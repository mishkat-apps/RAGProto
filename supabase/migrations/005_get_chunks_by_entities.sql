-- RPC to fetch chunks by entity names with fuzzy matching
CREATE OR REPLACE FUNCTION get_chunks_by_entities(
    entity_names TEXT[],
    p_book_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    chunk_type TEXT,
    relevance_score FLOAT,
    entity_name TEXT,
    entity_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.chunk_type,
        ce.relevance_score,
        e.name as entity_name,
        e.type as entity_type
    FROM chunks c
    JOIN chunk_entities ce ON c.id = ce.chunk_id
    JOIN entities e ON ce.entity_id = e.id
    WHERE 
        (p_book_id IS NULL OR c.book_id = p_book_id)
        AND e.name = ANY(entity_names)
    ORDER BY ce.relevance_score DESC
    LIMIT p_limit;
END;
$$;
