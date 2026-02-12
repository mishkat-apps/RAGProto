import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateQueryEmbedding } from '@/lib/vertex/embeddings';
import { createChildLogger } from '@/lib/logger';
import type { MatchedChunk } from '@/lib/supabase/types';

const log = createChildLogger('retrieval');

/**
 * Retrieve relevant chunks via vector similarity search.
 */
export async function retrieveChunks(
    question: string,
    opts: {
        bookId?: string;
        subject?: string;
        form?: number;
        topK?: number;
    } = {}
): Promise<MatchedChunk[]> {
    const { bookId, subject, form, topK = 20 } = opts;

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(question);

    // Call the match_chunks RPC
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        match_count: topK,
        filter_book_id: bookId || null,
        filter_subject: subject || null,
        filter_form: form || null,
    });

    if (error) {
        throw new Error(`match_chunks RPC failed: ${error.message}`);
    }

    const results = (data || []) as MatchedChunk[];

    // Log similarity scores for debugging
    if (results.length > 0) {
        const topSim = results[0]?.similarity?.toFixed(4);
        const botSim = results[results.length - 1]?.similarity?.toFixed(4);
        log.info(
            { count: results.length, topSimilarity: topSim, bottomSimilarity: botSim },
            'Chunks retrieved from vector search'
        );
    } else {
        log.warn('No chunks returned from vector search');
    }

    return results;
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
