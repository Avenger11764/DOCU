# DOCU — AI Document Intelligence Platform

DOCU is a full-stack RAG (Retrieval-Augmented Generation) platform that lets you upload documents and ask natural language questions about them. Built with a React frontend, Node.js/Express backend, MongoDB Atlas for storage, and Google Gemini for embeddings and generation.

**Live Demo**: _coming soon_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (via Mongoose) |
| AI Embeddings | Google Gemini `text-embedding-004` |
| AI Generation | Google Gemini `gemini-1.5-flash` |
| Auth | JWT (JSON Web Tokens) |
| File Parsing | pdf-parse, mammoth, Tesseract.js (OCR) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- Upload PDFs, DOCX, TXT, and image files (PNG, JPG, WEBP)
- Automatic text extraction and intelligent chunking
- Vector embeddings stored in MongoDB Atlas
- Cosine similarity search to retrieve relevant context
- Streaming AI responses strictly grounded in document content (out-of-context queries are safely blocked)
- Source citation with block references
- User authentication (register/login with JWT)
- Persistent chat sessions and message history (synced with client local timezone)
- Custom Gemini API key support
- Responsive mobile layout with collapsible sidebar drawer
- Inline file attachment button directly inside the chat typing bar
- Sticky navigation header tracking active document state

---

## Chunking & Embedding Approach

### Chunking
Documents are split into overlapping text chunks of ~800 characters with a 150-character overlap. Splitting is word-boundary-aware — it avoids cutting mid-word by finding the last space before the chunk boundary. This preserves semantic coherence across chunk edges.

### Embedding
Each chunk is embedded using Google Gemini's `text-embedding-004` model, which produces a 768-dimensional dense vector. These vectors are stored in MongoDB alongside the chunk text.

### Retrieval
At query time, the user's question is embedded with the same model. Cosine similarity is computed between the query vector and all stored chunk vectors. The top 4 most similar chunks are passed to Gemini as grounded context for answer generation.

### Generation
Gemini `gemini-1.5-flash` generates a streaming response using the retrieved chunks as context. The prompt instructs the model to answer strictly from the provided context, reducing hallucination.

---

## Setup (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone the repo
```bash
git clone https://github.com/Avenger11764/DOCU.git
cd DOCU
```

### 2. Backend setup
```bash
cd backend
cp .env.template .env
```

Fill in your `.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.lz3if0r.mongodb.net/?appName=Cluster0
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=any_random_secret_string
PORT=5000
```

```bash
npm install
node server.js
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
DOCU/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Route handlers (documents, auth)
│   ├── middleware/     # JWT auth middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── utils/          # Document parser, embedder
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   └── App.jsx
│   └── vite.config.js
└── README.md
```

---

## Deployment

### Backend (Render)
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `PORT`

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

---

## Test Credentials

| Field | Value |
|---|---|
| Username | `testuser` |
| Password | `test123` |

---

## What I'd Improve With More Time

- **Hybrid search**: Combine vector similarity with BM25 keyword search for better retrieval on short/exact queries
- **Re-ranking**: Add a cross-encoder re-ranker pass after initial retrieval to improve answer quality
- **Multi-document context**: Allow querying across multiple uploaded documents simultaneously
- **Streaming citations**: Surface citation blocks inline as the response streams, not after
- **Folder/workspace organization**: Group documents into named workspaces per project
- **Rate limiting & quotas**: Per-user API usage tracking to handle Gemini quota gracefully
- **File chunking by structure**: Detect headings, tables, and sections for smarter chunk boundaries instead of fixed-size splitting
- **Export**: Allow exporting conversation history as PDF or Markdown
- **LLM-Based Auto-Naming**: Automatically rename chat sessions using Gemini to generate a concise summary/title based on the user's first query, instead of relying on default timestamped titles.
- **Auto Keep-Alive ping**: Integrate background health checks or ping schedulers to prevent cold starts on Render's Free instance.

---

## Author

Built by **Avinash Bajpai**  
Contact: avinashbajpai11764@gmail.com
