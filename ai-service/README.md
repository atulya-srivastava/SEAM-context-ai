# SEAM AI Microservice (FastAPI)

A high-performance asynchronous AI backend service powering **SEAM Context AI**. Decoupled from the Node.js API server to enable independent scaling, fault isolation, sub-10ms intent classification, and real-time LLM token streaming via Server-Sent Events (SSE).

---

## 🏛 System Architecture

SEAM employs a **polyglot hybrid architecture**:

```
                       ┌───────────────────────────┐
                       │   Frontend (Next.js/React) │
                       └─────────────┬─────────────┘
                                     │
             ┌───────────────────────┴──────────────────────┐
             │                                              │
             ▼                                              ▼
┌─────────────────────────┐                    ┌─────────────────────────┐
│ Node.js / Express API   │                    │ Python FastAPI Service  │
│ (Port 5000)             │                    │ (Port 8000)             │
├─────────────────────────┤                    ├─────────────────────────┤
│ • Clerk Authentication  │                    │ • DistilBERT Intent Clf │
│ • GitHub OAuth / Octokit│                    │   (<6ms ONNX inference) │
│ • MongoDB Chat History  │                    │ • Groq LLM Completion  │
│ • User / Session Store  │                    │ • SSE Token Streaming   │
└─────────────────────────┘                    └─────────────────────────┘
```

---

## 🚀 Key Features

1. **High-Speed Intent Classification**:
   - Executes fine-tuned quantized ONNX DistilBERT (`model_quantized.onnx`).
   - Runs in `<6ms` on CPU with low memory overhead.
   - Categorizes queries into `github`, `integration`, or `general`.

2. **Async LLM Orchestration & Streaming**:
   - Uses LangChain Groq bindings with native ASGI (`uvicorn` / `asyncio`).
   - Real-time Server-Sent Events (SSE) streaming endpoint (`/api/ai/chat/stream`).
   - Streams reasoning/thought tokens (models like `gpt-oss-20b`) and output tokens.

3. **Fault Isolation**:
   - Memory-heavy tensor operations and LLM spikes cannot crash or block web I/O, user authentication, or database operations.

---

## 📦 Getting Started

### 1. Prerequisites
- Python 3.10+
- The service automatically reads credentials from `../backend/.env` (or a local `.env`).

### 2. Run Locally

```bash
cd ai-service
./run.sh
```

Or manually:

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints

### 1. Health Check
`GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "service": "SEAM Context AI Service",
  "version": "1.0.0",
  "classifier_ready": true,
  "classifier_model_path": ".../backend/classifier/model"
}
```

### 2. Intent Classification
`POST /api/ai/classify`

**Request:**
```json
{
  "text": "show me the latest commits on main"
}
```

**Response:**
```json
{
  "intent": "github",
  "confidence": 0.9892,
  "inference_ms": 5.22,
  "probabilities": {
    "general": 0.0048,
    "github": 0.9892,
    "integration": 0.006
  }
}
```

### 3. Synchronous Chat
`POST /api/ai/chat`

**Request:**
```json
{
  "prompt": "What can you do?",
  "history": [
    {"role": "user", "content": "hi"},
    {"role": "assistant", "content": "Hello! How can I assist you?"}
  ],
  "temperature": 0.2
}
```

### 4. Real-time Streaming (SSE)
`POST /api/ai/chat/stream`

Returns `text/event-stream` with individual token chunks:
```text
data: {"type": "meta", "intent": "general", "model": "openai/gpt-oss-20b"}

data: {"type": "token", "content": "Hello"}

data: {"type": "token", "content": "!"}

data: {"type": "done"}
```

