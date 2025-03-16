import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define custom types for Deepseek response
interface DeepseekDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

interface RAGResponse {
  documents: Array<{
    content: string;
    score: number;
  }>;
  warning?: string;
}

// Initialize OpenAI client with Deepseek base URL
const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});

const SYSTEM_PROMPT = `
    你是一位在中国生态环境部工作的环境法方向的法学博士，擅长案例研究、法律条文检索以及案件策略分析。
    针对每个问题，请自然、连贯地引用具体法律条款，分析问题，并提出可执行的解决方案，避免分段分点作答或列出分析步骤。回答应保持流畅简洁、专业且权威。
    你可能会遇到多个知识库文档，请从中选择与问题最相关的一个或几个条款对问题进行针对性地回答。
    格式要求：回答应以**“您好！根据《xxx》……”**开头，并以礼貌且正式的语气结束，如“谢谢您的关注与支持！”，以txt格式输出，不要用markdown
    字数要求：不超过200字，如答案真的非常复杂，可适当延长字数。`;

async function getRAGContext(question: string): Promise<string> {
  try {
    // Call your Python RAG service endpoint
    const response = await fetch(process.env.RAG_SERVICE_URL || 'http://localhost:8000/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: question }),
    });

    if (!response.ok) {
      throw new Error('RAG service request failed');
    }

    const data: RAGResponse = await response.json();
    
    // Format the retrieved documents
    const formattedDocs = data.documents
      .map((doc, i) => `\n\n===== 文档 ${i} (得分: ${doc.score.toFixed(4)}) =====\n${doc.content}`)
      .join('');

    return "\n相关的文档：" + formattedDocs;
  } catch (error) {
    console.error('Error in RAG context retrieval:', error);
    // Return empty context in case of error to allow the conversation to continue
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get relevant context from RAG service
    const ragContext = await getRAGContext(message);
    
    // Augment the user's question with retrieved context
    const augmentedMessage = `问题：${message}\n文本库：${ragContext}`;

    // Create streaming chat completion
    const stream = await openai.chat.completions.create({
      model: "Pro/deepseek-ai/DeepSeek-R1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: augmentedMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            const reasoningContent = (chunk.choices[0]?.delta as DeepseekDelta)?.reasoning_content || '';
            
            if (content || reasoningContent) {
              const sseMessage = `data: ${JSON.stringify({
                content,
                reasoning_content: reasoningContent
              })}\n\n`;
              controller.enqueue(encoder.encode(sseMessage));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Error in chat route:', error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'API error: ' + error.message },
        { status: error.status || 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
