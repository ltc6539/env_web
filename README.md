## Getting Started

First, set the API_KEY.env file:
```
ZHIPU_KEY = xxxxxxxxxx
```
Then, set the .env.local file
```
SILICONFLOW_API_KEY = xxxxxxxx
RAG_SERVICE_URL=http://localhost:xxxx/retrieve
```

First, start the python server:
```bash
python m -venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
.\python rag_service.py
```

Then, start the js server
```bash
pnpm install
pnpm dev
```
