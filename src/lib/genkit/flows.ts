import { createChildLogger } from '@/lib/logger';
import { getEnv } from '@/lib/env';
import { retrieveChunks, enrichChunksWithContext } from '@/lib/rag/retrieval';
import { rerankChunks } from '@/lib/rag/rerank';
import { CLASSIFY_PROMPT } from './prompts/classify';
import { ANSWER_PROMPT, ANSWER_SYSTEM_PROMPT } from './prompts/answer';
import type { AskRequest, AskResponse, Citation } from '@/lib/supabase/types';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const log = createChildLogger('genkit-flows');

/**
 * Main RAG flow: answerNECTAQuestion
 * 1) Classify question type
 * 2) Retrieve chunks (vector search)
 * 3) Rerank top candidates with Gemini
 * 4) Answer strictly from context with citations
 * 5) If context weak: refuse and ask clarifying question
 */
export async function answerNECTAQuestion(request: AskRequest): Promise<AskResponse> {
    const { question, filters, history = [], topK = 20 } = request;

    log.info({ question, filters, historyCount: history.length }, 'Starting answerNECTAQuestion flow');

    // Step 1: Classify question type
    const questionType = await classifyQuestion(question);
    log.info({ questionType }, 'Question classified');

    // Step 2: Retrieve chunks
    const rawChunks = await retrieveChunks(question, {
        bookId: filters?.book_id,
        subject: filters?.subject,
        form: filters?.form,
        topK,
    });

    log.info({ retrievedCount: rawChunks.length }, 'Chunks retrieved');

    if (rawChunks.length === 0) {
        return {
            answer: 'I could not find any relevant information in the uploaded textbooks to answer your question.',
            citations: [],
            confidence: 'low'
        };
    }

    // Step 3: Rerank
    const enrichedChunks = await enrichChunksWithContext(rawChunks);
    const rerankedIds = await rerankChunks(question, enrichedChunks);

    // Select top chunks in reranked order
    const topChunks = rerankedIds
        .map((id) => enrichedChunks.find((c) => c.id === id))
        .filter(Boolean) as typeof enrichedChunks;

    const finalChunks = topChunks.length > 0 ? topChunks : enrichedChunks.slice(0, 8);

    // Step 4: Group chunks by source metadata to avoid duplicate footnote numbers
    const sourcesMap = new Map<string, {
        book_title: string;
        chapter: string;
        topic: string;
        page_start: number | null;
        page_end: number | null;
        content: string[];
        chunk_ids: string[];
    }>();

    for (const chunk of finalChunks) {
        const key = `${chunk.book_title}|${chunk.chapter}|${chunk.topic}|${chunk.page_start}|${chunk.page_end}`;
        const existing = sourcesMap.get(key);
        if (existing) {
            existing.content.push(chunk.content);
            existing.chunk_ids.push(chunk.id);
        } else {
            sourcesMap.set(key, {
                book_title: chunk.book_title,
                chapter: chunk.chapter || 'Unknown',
                topic: chunk.topic || '',
                page_start: chunk.page_start,
                page_end: chunk.page_end,
                content: [chunk.content],
                chunk_ids: [chunk.id]
            });
        }
    }

    const groupedSources = Array.from(sourcesMap.values());

    const contextStr = groupedSources
        .map(
            (s, i) =>
                `[Source ${i + 1}] (${s.chapter}, ${s.topic}, pp. ${s.page_start || '?'}–${s.page_end || '?'})\n${s.content.join('\n\n')}`
        )
        .join('\n\n---\n\n');

    const historyStr = history.length > 0
        ? history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
        : 'No previous history.';

    const prompt = ANSWER_PROMPT.replace('{questionType}', questionType)
        .replace('{question}', question)
        .replace('{history}', historyStr)
        .replace('{context}', contextStr);

    const answer = await callGemini(prompt, ANSWER_SYSTEM_PROMPT);

    // Step 5: Build citations mapped to sources
    const citations: Citation[] = groupedSources.map((s) => ({
        chunk_id: s.chunk_ids[0], // Use first chunk ID as primary
        book_title: s.book_title,
        chapter: s.chapter,
        topic: s.topic,
        page_start: s.page_start,
        page_end: s.page_end,
    }));

    // Determine confidence
    // Use top-3 similarity average for confidence (more representative than all chunks)
    const topChunksSorted = [...finalChunks].sort((a, b) => b.similarity - a.similarity);
    const top3 = topChunksSorted.slice(0, Math.min(3, topChunksSorted.length));
    const avgSimilarity = top3.reduce((sum, c) => sum + c.similarity, 0) / top3.length;
    const confidence: 'high' | 'medium' | 'low' =
        avgSimilarity > 0.75 ? 'high' : avgSimilarity > 0.55 ? 'medium' : 'low';

    // Log query
    try {
        const supabase = getSupabaseAdmin();
        await supabase.from('queries_log').insert({
            question,
            filters: filters || {},
            retrieved_chunk_ids: finalChunks.map((c) => c.id),
            answer,
            citations,
            confidence,
        });
    } catch (err) {
        log.warn('Failed to log query (non-fatal)');
    }

    log.info({ confidence, citationCount: citations.length }, 'Answer generated');

    return { answer, citations, confidence };
}

async function classifyQuestion(question: string): Promise<string> {
    const prompt = CLASSIFY_PROMPT.replace('{question}', question);
    try {
        const result = await callGemini(prompt);
        const type = result.trim().toLowerCase();
        const validTypes = ['definition', 'explanation', 'essay', 'compare', 'other'];
        return validTypes.includes(type) ? type : 'other';
    } catch {
        return 'other';
    }
}

async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
    const env = getEnv();
    const { getVertexAccessToken } = await import('@/lib/vertex/auth');

    let accessToken: string;
    try {
        accessToken = await getVertexAccessToken();
    } catch (authErr) {
        log.error({ error: authErr instanceof Error ? authErr.message : String(authErr) }, 'Vertex Auth failed in flow');
        throw new Error('AI Authentication failed. Please contact administrator.');
    }

    const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        log.error({ status: res.status, body }, 'Gemini call failed in flow');
        throw new Error(`Gemini call failed (${res.status}): ${body.slice(0, 100)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
