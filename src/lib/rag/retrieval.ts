import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateQueryEmbedding } from '@/lib/vertex/embeddings';
import { createChildLogger } from '@/lib/logger';
import type { MatchedChunk } from '@/lib/supabase/types';

const log = createChildLogger('retrieval');

/**
 * Retrieve relevant chunks via hybrid search (vector + full-text).
 */
export async function retrieveChunks(
    question: string,
    opts: {
        bookId?: string;
        subject?: string;
        form?: number;
        topK?: number;
        similarityThreshold?: number;
    } = {}
): Promise<MatchedChunk[]> {
    const { bookId, subject, form, topK = 12, similarityThreshold = 0.5 } = opts;

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(question);

    // Call the hybrid_search RPC (vector + keyword)
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('hybrid_search', {
        query_embedding: queryEmbedding,
        query_text: question,
        match_count: topK,
        similarity_threshold: similarityThreshold,
        vector_weight: 0.7,
        text_weight: 0.3,
        filter_book_id: bookId || null,
        filter_subject: subject || null,
        filter_form: form || null,
    });

    if (error) {
        // Fallback to match_chunks if hybrid_search doesn't exist yet
        if (error.message.includes('hybrid_search')) {
            log.warn('hybrid_search not available, falling back to match_chunks');
            return retrieveChunksFallback(queryEmbedding, question, opts);
        }
        throw new Error(`hybrid_search RPC failed: ${error.message}`);
    }

    const results = (data || []) as MatchedChunk[];

    // Log scores for debugging
    if (results.length > 0) {
        const topSim = results[0]?.similarity?.toFixed(4);
        const botSim = results[results.length - 1]?.similarity?.toFixed(4);
        log.info(
            { count: results.length, topScore: topSim, bottomScore: botSim, threshold: similarityThreshold, mode: 'hybrid' },
            'Chunks retrieved from hybrid search'
        );
    } else {
        log.warn('No chunks returned from hybrid search');
    }

    return results;
}

/**
 * Fallback to original vector-only search if hybrid_search isn't deployed yet.
 */
async function retrieveChunksFallback(
    queryEmbedding: number[],
    question: string,
    opts: {
        bookId?: string;
        subject?: string;
        form?: number;
        topK?: number;
        similarityThreshold?: number;
    } = {}
): Promise<MatchedChunk[]> {
    const { bookId, subject, form, topK = 12, similarityThreshold = 0.5 } = opts;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_count: topK,
        similarity_threshold: similarityThreshold,
        filter_book_id: bookId || null,
        filter_subject: subject || null,
        filter_form: form || null,
    });

    if (error) {
        throw new Error(`match_chunks RPC failed: ${error.message}`);
    }

    const results = (data || []) as MatchedChunk[];
    if (results.length > 0) {
        const topSim = results[0]?.similarity?.toFixed(4);
        const botSim = results[results.length - 1]?.similarity?.toFixed(4);
        log.info(
            { count: results.length, topSimilarity: topSim, bottomSimilarity: botSim, mode: 'vector-only' },
            'Chunks retrieved (fallback)'
        );
    }
    return results;
}

/**
 * Expand results with sibling chunks from the same section.
 *
 * If chunk A belongs to section S and was retrieved, this fetches other
 * chunks in section S that weren't already in the results. This ensures
 * that topics spanning multiple chunks are fully represented.
 *
 * Caps the total at `maxTotal` to avoid over-expansion.
 */
export async function expandWithSiblingChunks(
    chunks: MatchedChunk[],
    maxTotal: number = 15
): Promise<MatchedChunk[]> {
    if (chunks.length === 0) return [];

    // Collect section IDs from the retrieved chunks
    const sectionIds = [...new Set(
        chunks
            .map((c) => c.section_id)
            .filter((id): id is string => id !== null)
    )];

    if (sectionIds.length === 0) return chunks;

    const existingIds = new Set(chunks.map((c) => c.id));
    const spotsAvailable = maxTotal - chunks.length;

    if (spotsAvailable <= 0) return chunks;

    const supabase = getSupabaseAdmin();

    // Fetch sibling chunks from the same sections
    const { data: siblings, error } = await supabase
        .from('chunks')
        .select('id, book_id, section_id, chunk_type, content, page_start, page_end, tokens_estimate, keywords, content_hash')
        .in('section_id', sectionIds)
        .not('embedding', 'is', null)
        .order('page_start', { ascending: true })
        .limit(spotsAvailable + chunks.length); // fetch enough to filter

    if (error) {
        log.warn({ error: error.message }, 'Failed to fetch sibling chunks, continuing without expansion');
        return chunks;
    }

    // Filter to only truly new chunks
    const newSiblings = (siblings || [])
        .filter((s) => !existingIds.has(s.id))
        .slice(0, spotsAvailable)
        .map((s) => ({
            ...s,
            similarity: 0, // Siblings don't have a similarity score from vector search
        })) as MatchedChunk[];

    if (newSiblings.length > 0) {
        log.info(
            { added: newSiblings.length, fromSections: sectionIds.length },
            'Expanded results with sibling chunks'
        );
    }

    return [...chunks, ...newSiblings];
}

/**
 * Enrich matched chunks with section/book metadata.
 */
export async function enrichChunksWithContext(chunks: MatchedChunk[]): Promise<
    Array<
        MatchedChunk & {
            book_title: string;
            chapter: string;
            topic: string;
        }
    >
> {
    if (chunks.length === 0) return [];

    const supabase = getSupabaseAdmin();

    // Get unique book IDs
    const bookIds = [...new Set(chunks.map((c) => c.book_id))];
    const { data: books } = await supabase
        .from('books')
        .select('id, title')
        .in('id', bookIds);

    const bookMap = new Map((books || []).map((b) => [b.id, b.title]));

    // Get section info for chunks that have section_id
    const sectionIds = chunks
        .map((c) => c.section_id)
        .filter((id): id is string => id !== null);

    const { data: sections } = await supabase
        .from('sections')
        .select('id, title, level, parent_id')
        .in('id', sectionIds);

    const sectionMap = new Map((sections || []).map((s) => [s.id, s]));

    return chunks.map((chunk) => {
        const bookTitle = bookMap.get(chunk.book_id) || 'Unknown Book';
        let chapter = '';
        let topic = '';

        if (chunk.section_id && sectionMap.has(chunk.section_id)) {
            const section = sectionMap.get(chunk.section_id)!;
            if (section.level === 1) {
                chapter = section.title;
            } else if (section.level === 2) {
                topic = section.title;
                // Try to find parent chapter
                if (section.parent_id && sectionMap.has(section.parent_id)) {
                    chapter = sectionMap.get(section.parent_id)!.title;
                }
            } else if (section.level === 3) {
                topic = section.title;
                if (section.parent_id && sectionMap.has(section.parent_id)) {
                    const parent = sectionMap.get(section.parent_id)!;
                    topic = parent.title;
                    if (parent.parent_id && sectionMap.has(parent.parent_id)) {
                        chapter = sectionMap.get(parent.parent_id)!.title;
                    }
                }
            }
        }

        return {
            ...chunk,
            book_title: bookTitle,
            chapter,
            topic,
        };
    });
}
