-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  form INT NOT NULL CHECK (form BETWEEN 1 AND 6),
  language TEXT NOT NULL DEFAULT 'en',
  publisher TEXT,
  storage_path_pdf TEXT NOT NULL,
  storage_path_parsed_md TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTIONS (chapter / topic / subtopic hierarchy)
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  parent_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  page_start INT,
  page_end INT
);

CREATE INDEX idx_sections_book ON sections(book_id);
CREATE INDEX idx_sections_parent ON sections(parent_id);

-- ============================================================
-- CHUNKS
-- ============================================================
CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  chunk_type TEXT NOT NULL DEFAULT 'other'
    CHECK (chunk_type IN ('definition','explanation','example','exercise','summary','other')),
  content TEXT NOT NULL,
  page_start INT,
  page_end INT,
  tokens_estimate INT NOT NULL DEFAULT 0,
  keywords TEXT[],
  embedding vector(768),
  content_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_book ON chunks(book_id);
CREATE INDEX idx_chunks_section ON chunks(section_id);
CREATE INDEX idx_chunks_content_hash ON chunks(content_hash);

-- IVFFlat vector index for similarity search
-- NOTE: Requires at least some data before building IVFFlat.
-- For small datasets, use exact search. For production, rebuild after loading data.
CREATE INDEX idx_chunks_embedding ON chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search GIN index
CREATE INDEX idx_chunks_content_fts ON chunks
  USING GIN (to_tsvector('english', content));

-- ============================================================
-- INGEST_JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','succeeded','failed')),
  error TEXT,
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingest_jobs_status ON ingest_jobs(status);

-- ============================================================
-- QUERIES_LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS queries_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  retrieved_chunk_ids UUID[] DEFAULT '{}',
  answer TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  confidence TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RPC: match_chunks - vector similarity search with filters
-- ============================================================
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_count INT DEFAULT 20,
  filter_book_id UUID DEFAULT NULL,
  filter_subject TEXT DEFAULT NULL,
  filter_form INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  book_id UUID,
  section_id UUID,
  chunk_type TEXT,
  content TEXT,
  page_start INT,
  page_end INT,
  tokens_estimate INT,
  keywords TEXT[],
  content_hash TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.book_id,
    c.section_id,
    c.chunk_type,
    c.content,
    c.page_start,
    c.page_end,
    c.tokens_estimate,
    c.keywords,
    c.content_hash,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  JOIN books b ON b.id = c.book_id
  WHERE
    c.embedding IS NOT NULL
    AND (filter_book_id IS NULL OR c.book_id = filter_book_id)
    AND (filter_subject IS NULL OR b.subject = filter_subject)
    AND (filter_form IS NULL OR b.form = filter_form)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
