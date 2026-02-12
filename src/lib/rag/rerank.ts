import { createChildLogger } from '@/lib/logger';
import { getEnv } from '@/lib/env';
import type { MatchedChunk } from '@/lib/supabase/types';

const log = createChildLogger('rerank');

/**
 * Rerank chunks using Gemini as a judge.
 * Returns ordered chunk IDs (best first).
 */
export async function rerankChunks(
    question: string,
    chunks: Array<MatchedChunk & { book_title: string; chapter: string; topic: string }>,
    topK: number = 8
): Promise<string[]> {
    if (chunks.length === 0) return [];
    if (chunks.length <= topK) return chunks.map((c) => c.id);

    const env = getEnv();

    const chunkSummaries = chunks
        .map(
            (c, i) =>
                `[${i}] (id: ${c.id}) ${c.chapter ? `Chapter: ${c.chapter}, ` : ''}${c.topic ? `Topic: ${c.topic}, ` : ''}Pages ${c.page_start || '?'}-${c.page_end || '?'}\nContent: ${c.content.slice(0, 300)}...`
        )
        .join('\n\n');

    const prompt = `You are a reranking judge. Given a student's question and a list of text chunks from a textbook, rank the chunks by relevance to the question.

Question: "${question}"

Chunks:
${chunkSummaries}

Return ONLY a JSON array of chunk IDs in order of relevance (most relevant first). Select the top ${topK} most relevant chunks. Do not include any explanation.

Example output: ["id1", "id2", "id3"]`;

    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!res.ok) {
            log.warn({ status: res.status }, 'Rerank call failed, falling back to similarity order');
            return chunks.slice(0, topK).map((c) => c.id);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            log.warn('No text in rerank response, falling back');
            return chunks.slice(0, topK).map((c) => c.id);
        }

        const ids = JSON.parse(text) as string[];
        return ids.slice(0, topK);
    } catch (err) {
        log.warn({ error: err instanceof Error ? err.message : String(err) }, 'Rerank failed, using similarity order');
        return chunks.slice(0, topK).map((c) => c.id);
    }
}
