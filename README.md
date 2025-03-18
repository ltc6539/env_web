# 环境法律智能问答平台开发文档

## 项目简介

本项目是一个基于Next.js和Python构建的环境法律智能问答平台，采用检索增强生成（Retrieval-Augmented Generation, RAG）技术，利用向量检索、BM25检索算法及FlagEmbedding进行文档重排序，结合DeepSeek-R1模型提供准确的环境法律咨询服务。

## 技术栈
- **前端/接口框架**：Next.js（TypeScript）
- **Python后端**：FastAPI （RAG服务）
- **语言模型服务**：DeepSeek API（SiliconFlow接口）
- **数据库与检索**：Chroma向量数据库、BM25 Retriever、Semantic Retriever
- **嵌入模型**：ZhipuAI/embedding-3
- **重排序模型**：BAAI/bge-reranker-v2-m3

## 项目目录结构
```
.
├── src/app
│        ├── api
│        │   └── chat
│        │       └── route.ts     # chat API
|        ├── best-practices
|        |   └── page.tsx         # 最佳实践界面
│        ├── page.tsx             # 聊天界面
│        └── layout.tsx           # 布局界面
├── data
│    └── vector                   # 向量数据库
├── API_KEY.env                   # python 环境变量
├── .env.local                    # nextjs 环境变量
├── rag_service.py                # python-rag逻辑 通过FASTAPI传递文本
├── requirements.txt              # python 依赖管理
├── package.json                  # nextjs 依赖管理 
└── README.md                     # README

## 本地开发与运行

### 步骤1：克隆项目
```bash
git clone https://github.com/ltc6539/env_web
cd env_web
```

### 步骤2：设置环境变量

**创建`API_KEY.env`**：
```env
ZHIPU_KEY=你的智谱API密钥
```

**创建`.env.local`文件**
```bash
SILICONFLOW_API_KEY=你的硅基流动密钥
RAG_SERVICE_URL=http://localhost:8001/retrieve （云端服务器需要要部署为http:/<内网IP>:8001/retrieve）
```

### 步骤3：启动Python后端（RAG服务）

安装Python依赖：
```bash
pip install -r requirements.txt
```

- 启动Python RAG服务：
```bash
nohup python3 rag_service.py &
```
确保RAG服务已在`http://0.0.0.0:8001/retrieve`正常启动。

### 步骤4：启动Next.js服务

安装依赖：
```bash
pnpm install
```

启动开发服务器：
```bash
pnpm dev --port 5005
```

- 部署Next.js服务：
```bash
pnpm install
pnpm build
pnpm start
```

访问 [http://localhost:5005](http://localhost:3000)

### 注意事项
- 确保安全组规则已开放相应端口（Next.js默认5005，Python后端8001）。
- 部署时确保API密钥安全，不要暴露在公开仓库。


### TODO
- 在data中放更多法律文本
- 实现联网搜索
- 前端页面美化
