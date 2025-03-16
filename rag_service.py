from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import jieba
from dotenv import load_dotenv
from langchain.docstore.document import Document
from langchain_community.embeddings import ZhipuAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from FlagEmbedding import FlagReranker
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize components
load_dotenv('API_KEY.env')
ZHIPU_KEY = os.getenv("ZHIPU_KEY")
embeddings = ZhipuAIEmbeddings(model="embedding-3", api_key=ZHIPU_KEY)

try:
    # Initialize ChromaDB
    vector_store = Chroma(
        collection_name='all_zhipu',
        embedding_function=embeddings,
        persist_directory='data/vector'
    )
    
    data = vector_store.get()
    if not data['documents']:
        raise ValueError("No documents found in ChromaDB collection")
        
    documents = [
        Document(
            page_content=doc,
            metadata={'title': meta.get('title', 'Untitled')}
        )
        for doc, meta in zip(data['documents'], data['metadatas'])
        if doc  # Only include non-empty documents
    ]
    
    logger.info(f"Successfully loaded {len(documents)} documents from ChromaDB")
    
    # Initialize BM25 and reranker
    bm25_retriever = BM25Retriever.from_documents(
        documents,
        preprocess_func=lambda text: list(jieba.cut(text)) if text else []
    )
    bm25_retriever.k = 10
    reranker = FlagReranker('BAAI/bge-reranker-v2-m3', use_fp16=True)
    logger.info("Successfully initialized BM25 retriever and reranker")
    
except Exception as e:
    logger.error(f"Error initializing components: {str(e)}")
    # Initialize with empty defaults for graceful failure
    documents = []
    bm25_retriever = None
    reranker = None
    vector_store = None

class Query(BaseModel):
    query: str

def rerank_with_flag_reranker(query, retrieved_docs):
    if not reranker:
        return retrieved_docs  # Return without reranking if reranker isn't initialized
    
    scores = reranker.compute_score(
        [[query, doc.page_content] for doc, _ in retrieved_docs]
    )
    return sorted(
        [(doc, score) for (doc, _), score in zip(retrieved_docs, scores)],
        key=lambda x: x[1],
        reverse=True,
    )

@app.post("/retrieve")
async def retrieve(query: Query):
    try:
        logger.info(f"\n{'='*50}\nReceived query: {query.query}\n{'='*50}")

        if not vector_store or not bm25_retriever:
            logger.error("Search services not properly initialized")
            raise HTTPException(
                status_code=503,
                detail="Search services not properly initialized"
            )

        # Get results from both retrievers
        logger.info("Retrieving documents...")
        semantic_results = vector_store.similarity_search_with_score(query.query, k=10)
        bm25_results = bm25_retriever.get_relevant_documents(query.query)
        
        logger.info(f"Found {len(semantic_results)} semantic results and {len(bm25_results)} BM25 results")
        
        # Combine and rerank
        combined_results = semantic_results + [(doc, None) for doc in bm25_results]
        reranked_results = rerank_with_flag_reranker(query.query, combined_results)
        
        # Format response
        documents = [
            {
                "content": doc.page_content,
                "score": float(score) if score is not None else 0.0
            }
            for doc, score in reranked_results[:5]
        ]
        
        if not documents:
            logger.warning("No relevant documents found")
            return {"documents": [], "warning": "No relevant documents found"}
        
        logger.info(f"Returning {len(documents)} documents")
        for i, doc in enumerate(documents):
            logger.info(f"\nDocument {i} (score: {doc['score']:.4f}):")
            logger.info(f"Content preview: {doc['content'][:200]}...")
            
        return {"documents": documents}
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting RAG service...")
    uvicorn.run(app, host="0.0.0.0", port=8000) 