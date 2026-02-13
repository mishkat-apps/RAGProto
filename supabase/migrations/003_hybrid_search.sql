-- ============================================================
-- Migration 003: Hybrid search (vector + full-text)
-- Combines cosine similarity with BM25-style ts_rank scoring.
-- Uses existing GIN index: idx_chunks_content_fts
-- ============================================================

CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(768),
  query_text TEXT,
  match_count INT DEFAULT 12,
  similarity_threshold FLOAT DEFAULT 0.5,
  vector_weight FLOAT DEFAULT 0.7,
  text_weight FLOAT DEFAULT 0.3,
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
DECLARE
  ts_query tsquery;
BEGIN
  -- Build full-text query from raw text (handles multi-word queries)
  ts_query := plainto_tsquery('english', query_text);

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
    -- Combined score: weighted vector similarity + weighted text rank
    (
      vector_weight * (1 - (c.embedding <=> query_embedding))
      + text_weight * COALESCE(ts_rank(to_tsvector('english', c.content), ts_query), 0)
    )::FLOAT AS similarity
  FROM chunks c
  JOIN books b ON b.id = c.book_id
  WHERE
    c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
    AND (filter_book_id IS NULL OR c.book_id = filter_book_id)
    AND (filter_subject IS NULL OR b.subject = filter_subject)
    AND (filter_form IS NULL OR b.form = filter_form)
  ORDER BY
    (
      vector_weight * (1 - (c.embedding <=> query_embedding))
      + text_weight * COALESCE(ts_rank(to_tsvector('english', c.content), ts_query), 0)
    ) DESC
  LIMIT match_count;
END;
$$;
