import { ai } from './index';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { retrieveWithGraph } from '@/lib/rag/graph';
import { enrichChunksWithContext } from '@/lib/rag/retrieval';
import { createChildLogger } from '@/lib/logger';
import { ANSWER_SYSTEM_PROMPT, ANSWER_PROMPT } from './prompts/answer';
import type { AskRequest, AskResponse, Citation } from '@/lib/supabase/types';

const log = createChildLogger('graph-flow');

/**
 * GraphRAG Flow:
 * 1. Hybrid Retrieval (Vector + Entity)
 * 2. Context Enrichment
 * 3. Answer Generation with Citations
 */
export async function answerWithGraph(request: AskRequest): Promise<AskResponse> {
    const { question, filters, history = [], topK = 10 } = request;

    log.info({ question, filters }, 'Starting answerWithGraph flow');

    // Step 1: Hybrid Graph Retrieval
    const chunks = await retrieveWithGraph({
        query: question,
        bookId: filters?.book_id,
        limit: topK
    });

    if (chunks.length === 0) {
        log.warn('No chunks found in GraphRAG retrieval');
        return {
            answer: "I couldn't find any specific information about that in the available books. Could you try rephrasing or asking something else?",
            citations: [],
            confidence: 'low'
        };
    }

    // Step 2: Enrich with context (Book/Chapter titles)
    const enrichedChunks = await enrichChunksWithContext(chunks);

    // Step 3: Format context for prompt
    const contextStr = enrichedChunks
        .map((c, i) => `[${i + 1}] ${c.book_title} > ${c.chapter || 'Overview'} > ${c.topic || 'General'}\n${c.content}`)
        .join('\n\n---\n\n');

    const historyStr = history.length > 0
        ? history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
        : 'No previous history.';

    // Step 4: Generate Answer
    const prompt = ANSWER_PROMPT
        .replace('{context}', contextStr)
        .replace('{history}', historyStr)
        .replace('{question}', question);

    const response = await ai.generate({
        prompt,
        system: ANSWER_SYSTEM_PROMPT,
        // We can use vertexai/gemini-1.5-flash here via Genkit
    });

    const answer = response.text;

    // Step 5: Extract Citations
    const citations: Citation[] = enrichedChunks.map((c, i) => ({
        chunk_id: c.id,
        book_title: c.book_title,
        chapter: c.chapter,
        topic: c.topic,
        page_start: c.page_start,
        page_end: c.page_end
    }));

    // Simple confidence heuristic
    const confidence = chunks.some(c => c.similarity > 0.7) ? 'high' :
        chunks.some(c => c.similarity > 0.5) ? 'medium' : 'low';

    log.info({ confidence, citationCount: citations.length }, 'GraphRAG answer generated');

    // Step 6: Log query
    try {
        const supabase = getSupabaseAdmin();
        await supabase.from('queries_log').insert({
            question,
            filters: { ...filters, mode: 'graph' },
            retrieved_chunk_ids: chunks.map((c) => c.id),
            answer,
            citations,
            confidence,
            user_id: request.userId,
        });
    } catch {
        log.warn('Failed to log GraphRAG query (non-fatal)');
    }

    return { answer, citations, confidence };
}
