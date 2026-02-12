# NECTA Textbook RAG

A production-ready MVP for a Retrieval-Augmented Generation system built for Tanzanian secondary-school textbooks. Upload PDFs, automatically ingest and embed content, then ask textbook questions and get cited answers.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14+ (App Router, TypeScript) |
| Database | Supabase (PostgreSQL + pgvector) |
| Storage | Supabase Storage |
| PDF Parsing | LlamaParse |
| Embeddings | Vertex AI (`text-embedding-004`, 768-dim) |
| LLM | Gemini 2.0 Flash via Genkit |
| Styling | Tailwind CSS |
| Validation | Zod |
| Logging | Pino |

## Architecture

```
User Question
  │
  ▼
/api/ask → classify question → embed query
  │
  ▼
match_chunks RPC (pgvector similarity) → rerank with Gemini → generate answer with citations
  │
  ▼
Chat UI with source citations
```

```
PDF Upload
  │
  ▼
/api/ingest → Supabase Storage → /api/worker/ingest
  │
  ▼
LlamaParse → normalize Markdown → extract structure → chunk → embed → store in pgvector
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project with pgvector extension
- Google Cloud project with Vertex AI enabled
- LlamaParse API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd RagProto
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `LLAMAPARSE_API_KEY` | LlamaParse API key |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID |
| `GOOGLE_CLOUD_LOCATION` | Region (e.g., `us-central1`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `WORKER_SECRET` | Secret to protect worker endpoints |

### 3. Database Setup

Run the migration in your Supabase SQL editor:

```sql
-- File: supabase/migrations/001_initial_schema.sql
-- Enables pgvector, creates tables, indexes, and match_chunks RPC
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
| --- | --- |
| `/` | Landing page with navigation cards |
| `/chat` | Chat interface — ask questions, view cited answers |
| `/admin/upload` | Upload PDFs with metadata, trigger ingestion |
| `/admin/books` | View ingested books, status, trigger worker |
| `/admin/eval` | Batch evaluation with quality ratings |

## API Routes

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/ask` | POST | Ask a question, get RAG answer with citations |
| `/api/ingest` | POST | Create a new ingestion job for a PDF |
| `/api/worker/ingest` | POST | Process queued ingestion jobs (protected) |
| `/api/books` | GET | List all books with latest ingest status |
| `/api/jobs` | GET | List recent jobs or get job by ID |

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages (upload, books, eval)
│   ├── chat/             # Chat interface
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles + dark theme
├── lib/
│   ├── env.ts            # Zod environment validation
│   ├── logger.ts         # Pino structured logging
│   ├── utils.ts          # Utilities (retry, batch, hash)
│   ├── supabase/         # Supabase clients + types
│   ├── ingest/           # LlamaParse, normalize, structure, pipeline
│   ├── rag/              # Chunking, retrieval, reranking
│   ├── vertex/           # Vertex AI embeddings
│   └── genkit/           # Genkit flows + prompt templates
├── middleware.ts         # Worker route protection
supabase/
├── migrations/           # SQL migrations
└── seed.sql              # Dev seed data
```

## Demo Script

1. **Upload a textbook**: Go to `/admin/upload`, drop a PDF, fill in subject/form/year, click Upload
2. **Watch ingestion**: Go to `/admin/books`, click "Run Worker" to process the queued job
3. **Ask questions**: Go to `/chat`, type a question like "What is geographic research?"
4. **View citations**: Click the sources badge on the answer to see chapter/page references
5. **Evaluate quality**: Go to `/admin/eval`, paste test questions as JSON, run batch evaluation

## License

MIT
