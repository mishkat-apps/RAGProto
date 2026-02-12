/**
 * Database types mirroring the Supabase schema.
 */

// ---- Books ----
export interface Book {
    id: string;
    title: string;
    subject: string;
    form: number;
    language: string;
    publisher: string | null;
    storage_path_pdf: string;
    storage_path_parsed_md: string | null;
    created_at: string;
}

export type BookInsert = Omit<Book, 'id' | 'created_at'>;

// ---- Sections ----
export interface Section {
    id: string;
    book_id: string;
    level: number; // 1=chapter, 2=topic, 3=subtopic
    title: string;
    parent_id: string | null;
    order_index: number;
    page_start: number | null;
    page_end: number | null;
}

export type SectionInsert = Omit<Section, 'id'>;

// ---- Chunks ----
export type ChunkType = 'definition' | 'explanation' | 'example' | 'exercise' | 'summary' | 'other';

export interface Chunk {
    id: string;
    book_id: string;
    section_id: string | null;
    chunk_type: ChunkType;
    content: string;
    page_start: number | null;
    page_end: number | null;
    tokens_estimate: number;
    keywords: string[] | null;
    embedding: number[] | null;
    content_hash: string;
    created_at: string;
}

export type ChunkInsert = Omit<Chunk, 'id' | 'created_at'>;

// ---- Ingest Jobs ----
export type IngestJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface IngestJob {
    id: string;
    book_id: string | null;
    status: IngestJobStatus;
    error: string | null;
    progress: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ---- Query Log ----
export interface QueryLog {
    id: string;
    question: string;
    filters: Record<string, unknown>;
    retrieved_chunk_ids: string[];
    answer: string;
    citations: Citation[];
    confidence: 'high' | 'medium' | 'low';
    created_at: string;
}

// ---- Citation (used in API responses) ----
export interface Citation {
    chunk_id: string;
    book_title: string;
    chapter: string;
    topic: string;
    page_start: number | null;
    page_end: number | null;
}

// ---- Match Chunks RPC result ----
export interface MatchedChunk {
    id: string;
    book_id: string;
    section_id: string | null;
    chunk_type: string;
    content: string;
    page_start: number | null;
    page_end: number | null;
    tokens_estimate: number;
    keywords: string[] | null;
    content_hash: string;
    similarity: number;
}

// ---- API Request/Response types ----
export interface IngestRequest {
    storage_path: string;
    title: string;
    subject: string;
    form: number;
    language?: string;
    publisher?: string;
}

export interface AskRequest {
    question: string;
    filters?: {
        book_id?: string;
        subject?: string;
        form?: number;
        chapter?: string;
        topic?: string;
    };
    topK?: number;
}

export interface AskResponse {
    answer: string;
    citations: Citation[];
    confidence: 'high' | 'medium' | 'low';
}
