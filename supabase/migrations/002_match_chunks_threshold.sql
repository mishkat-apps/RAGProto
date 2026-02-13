-- ============================================================
-- Migration 002: Add similarity_threshold to match_chunks
-- Also reduce default match_count from 20 → 12
-- ============================================================

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_count INT DEFAULT 12,
  similarity_threshold FLOAT DEFAULT 0.5,
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
    AND (1 - (c.embedding <=> query_embedding)) >= similarity_threshold
    AND (filter_book_id IS NULL OR c.book_id = filter_book_id)
    AND (filter_subject IS NULL OR b.subject = filter_subject)
    AND (filter_form IS NULL OR b.form = filter_form)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
