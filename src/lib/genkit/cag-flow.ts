import { createChildLogger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getOrCreateBookCache, callGeminiWithCache } from '@/lib/vertex/cache';
import { CAG_ANSWER_PROMPT, CAG_SYSTEM_PROMPT } from './prompts/cag-prompt';
import type { AskRequest, AskResponse } from '@/lib/supabase/types';

const log = createChildLogger('cag-flow');

// In-memory cache for full book text to avoid re-fetching from Supabase
const bookTextCache = new Map<string, { text: string; title: string; fetchedAt: number }>();
const BOOK_TEXT_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch and assemble the full text of a book from its chunks,
 * ordered by section hierarchy and page number.
 */
async function getFullBookText(bookId: string): Promise<{ text: string; title: string }> {
    // Check in-memory cache
    const cached = bookTextCache.get(bookId);
    if (cached && Date.now() - cached.fetchedAt < BOOK_TEXT_TTL_MS) {
        log.info({ bookId }, 'Using cached book text');
        return { text: cached.text, title: cached.title };
    }

    const supabase = getSupabaseAdmin();

    // Get book title
    const { data: book, error: bookErr } = await supabase
        .from('books')
        .select('title')
        .eq('id', bookId)
        .single();

    if (bookErr || !book) {
        throw new Error(`Book not found: ${bookId}`);
    }

    // Get all sections for the book, ordered by hierarchy
    const { data: sections } = await supabase
        .from('sections')
        .select('id, title, level, parent_id, order_index, page_start')
        .eq('book_id', bookId)
        .order('order_index', { ascending: true });

    const sectionMap = new Map((sections || []).map(s => [s.id, s]));

    // Get all chunks for the book, ordered by page
    const { data: chunks, error: chunksErr } = await supabase
        .from('chunks')
        .select('id, section_id, content, page_start, page_end, chunk_type')
        .eq('book_id', bookId)
        .order('page_start', { ascending: true });

    if (chunksErr) {
        throw new Error(`Failed to fetch chunks: ${chunksErr.message}`);
    }

    if (!chunks || chunks.length === 0) {
        throw new Error(`No chunks found for book ${bookId}`);
    }

    // Build structured text with section markers
    const parts: string[] = [];
    let currentChapter = '';
    let currentTopic = '';

    for (const chunk of chunks) {
        if (chunk.section_id && sectionMap.has(chunk.section_id)) {
            const section = sectionMap.get(chunk.section_id)!;

            // Resolve chapter and topic from section hierarchy
            let chapter = '';
            let topic = '';

            if (section.level === 1) {
                chapter = section.title;
            } else if (section.level === 2) {
                topic = section.title;
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

            // Add section headers when they change
            if (chapter && chapter !== currentChapter) {
                currentChapter = chapter;
                parts.push(`\n\n## ${chapter}`);
            }
            if (topic && topic !== currentTopic) {
                currentTopic = topic;
                parts.push(`\n### ${topic}`);
            }
        }

        // Add page reference and content
        const pageRef = chunk.page_start ? ` [p. ${chunk.page_start}${chunk.page_end && chunk.page_end !== chunk.page_start ? `-${chunk.page_end}` : ''}]` : '';
        parts.push(`${pageRef}\n${chunk.content}`);
    }

    const fullText = `# ${book.title}\n${parts.join('\n')}`;

    // Cache it
    bookTextCache.set(bookId, { text: fullText, title: book.title, fetchedAt: Date.now() });

    log.info({ bookId, title: book.title, textLength: fullText.length, chunkCount: chunks.length }, 'Full book text assembled');

    return { text: fullText, title: book.title };
}

/**
 * CAG flow: Answer a question using the full textbook context.
 * Requires a book_id in filters.
 */
export async function answerWithFullContext(request: AskRequest): Promise<AskResponse> {
    const { question, filters, history = [] } = request;

    const bookId = filters?.book_id;
    if (!bookId) {
        return {
            answer: 'CAG mode requires a specific book to be selected. Please choose a textbook from the dropdown.',
            citations: [],
            confidence: 'low',
        };
    }

    log.info({ question, bookId, historyCount: history.length }, 'Starting CAG flow');

    // Step 1: Get full book text
    const { text: fullText, title: bookTitle } = await getFullBookText(bookId);

    // Step 2: Create or reuse Vertex AI context cache
    const cachedContentName = await getOrCreateBookCache(bookId, fullText, bookTitle);

    // Step 3: Build the prompt
    const historyStr = history.length > 0
        ? history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
        : 'No previous history.';

    const prompt = CAG_ANSWER_PROMPT
        .replace('{history}', historyStr)
        .replace('{question}', question);

    // Step 4: Call Gemini with cached context
    const answer = await callGeminiWithCache(cachedContentName, prompt, CAG_SYSTEM_PROMPT);

    // Step 5: Log query
    try {
        const supabase = getSupabaseAdmin();
        await supabase.from('queries_log').insert({
            question,
            filters: { ...filters, mode: 'cag' },
            retrieved_chunk_ids: [],
            answer,
            citations: [],
            confidence: 'high',
        });
    } catch {
        log.warn('Failed to log CAG query (non-fatal)');
    }

    log.info('CAG answer generated');

    return {
        answer,
        citations: [],
        confidence: 'high',
    };
}
