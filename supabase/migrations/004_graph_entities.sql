-- Migration: 004_graph_entities.sql
-- Description: Adds tables for GraphRAG entity extraction and chunk linking

-- Enable pg_trgm for fuzzy entity searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Entities table: Unique nodes in our "knowledge graph"
CREATE TABLE IF NOT EXISTS public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT, -- e.g., 'Concept', 'Person', 'Location', 'Event', 'Definition'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(name, type)
);

-- 2. Chunk-Entity junction table: The "edges" connecting text chunks to entities
CREATE TABLE IF NOT EXISTS public.chunk_entities (
    chunk_id UUID REFERENCES public.chunks(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0, -- Optional score of how central the entity is to the chunk
    PRIMARY KEY (chunk_id, entity_id)
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_entities_name_trgm ON public.entities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chunk_entities_entity_id ON public.chunk_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_chunk_entities_chunk_id ON public.chunk_entities(chunk_id);

-- 4. Enable RLS (matches existing patterns)
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunk_entities ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.entities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to authenticated users" ON public.chunk_entities
    FOR SELECT TO authenticated USING (true);
