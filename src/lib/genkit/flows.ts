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
    const { question, filters, topK = 20 } = request;

    log.info({ question, filters }, 'Starting answerNECTAQuestion flow');

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
            answer:
                'No relevant content was found in the textbook for this question. Please try rephrasing your question or selecting a different book/subject.',
            citations: [],
            confidence: 'low',
        };
    }

    // Step 3: Enrich with metadata + Rerank
    const enrichedChunks = await enrichChunksWithContext(rawChunks);
    const rerankedIds = await rerankChunks(question, enrichedChunks, 8);

    // Select top chunks in reranked order
    const topChunks = rerankedIds
        .map((id) => enrichedChunks.find((c) => c.id === id))
        .filter(Boolean) as typeof enrichedChunks;

    // Fallback if reranking returned nothing useful
    const finalChunks = topChunks.length > 0 ? topChunks : enrichedChunks.slice(0, 8);

    // Step 4: Generate answer
    const contextStr = finalChunks
        .map(
            (c, i) =>
                `[Chunk ${i + 1}] (${c.chapter || 'Unknown Chapter'}, ${c.topic || 'Unknown Topic'}, pp. ${c.page_start || '?'}–${c.page_end || '?'})\n${c.content}`
        )
        .join('\n\n---\n\n');

    const prompt = ANSWER_PROMPT.replace('{questionType}', questionType)
        .replace('{question}', question)
        .replace('{context}', contextStr);

    const answer = await callGemini(prompt, ANSWER_SYSTEM_PROMPT);

    // Step 5: Build citations
    const citations: Citation[] = finalChunks.map((c) => ({
        chunk_id: c.id,
        book_title: c.book_title,
        chapter: c.chapter || 'Unknown',
        topic: c.topic || '',
        page_start: c.page_start,
        page_end: c.page_end,
    }));

    // Determine confidence
    const avgSimilarity =
        finalChunks.reduce((sum, c) => sum + c.similarity, 0) / finalChunks.length;
    const confidence: 'high' | 'medium' | 'low' =
        avgSimilarity > 0.8 ? 'high' : avgSimilarity > 0.6 ? 'medium' : 'low';

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
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

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
            Authorization: `Bearer ${accessToken.token}`,
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
        throw new Error(`Gemini call failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
