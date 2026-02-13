import { createChildLogger } from '@/lib/logger';
import { getEnv } from '@/lib/env';
import type { MatchedChunk } from '@/lib/supabase/types';

const log = createChildLogger('rerank');

export interface RerankResult {
    id: string;
    score: number;
}

/**
 * Rerank chunks using the Vertex AI Ranking API (Discovery Engine).
 * Returns ordered chunk IDs with relevance scores (best first).
 */
export async function rerankChunksWithScores(
    question: string,
    chunks: Array<MatchedChunk & { book_title: string; chapter: string; topic: string }>,
    topK: number = 8
): Promise<RerankResult[]> {
    if (chunks.length === 0) return [];
    if (chunks.length <= topK) {
        return chunks.map((c) => ({ id: c.id, score: 1.0 }));
    }

    const env = getEnv();

    // Build records for the Ranking API
    const records = chunks.map((c) => ({
        id: c.id,
        title: [
            c.chapter ? `Chapter: ${c.chapter}` : '',
            c.topic ? `Topic: ${c.topic}` : '',
            `pp. ${c.page_start || '?'}-${c.page_end || '?'}`,
        ]
            .filter(Boolean)
            .join(' | '),
        content: c.content,
    }));

    try {
        const { getVertexAccessToken } = await import('@/lib/vertex/auth');
        const accessToken = await getVertexAccessToken();

        const endpoint = `https://discoveryengine.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/global/rankingConfigs/default_ranking_config:rank`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Goog-User-Project': env.VERTEX_PROJECT_ID,
            },
            body: JSON.stringify({
                model: env.RANKING_MODEL,
                query: question,
                topN: topK,
                ignoreRecordDetailsInResponse: true,
                records,
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            log.warn({ status: res.status, body: body.slice(0, 200) }, 'Ranking API call failed, falling back to similarity order');
            return chunks.slice(0, topK).map((c) => ({ id: c.id, score: c.similarity }));
        }

        const data = await res.json();
        const rankedRecords = data.records as Array<{ id: string; score: number }>;

        if (!rankedRecords || rankedRecords.length === 0) {
            log.warn('No records in Ranking API response, falling back');
            return chunks.slice(0, topK).map((c) => ({ id: c.id, score: c.similarity }));
        }

        log.info(
            { count: rankedRecords.length, topScore: rankedRecords[0]?.score },
            'Ranking API returned results'
        );

        return rankedRecords.slice(0, topK).map((r) => ({
            id: r.id,
            score: r.score,
        }));
    } catch (err) {
        log.warn(
            { error: err instanceof Error ? err.message : String(err) },
            'Rerank failed, using similarity order'
        );
        return chunks.slice(0, topK).map((c) => ({ id: c.id, score: c.similarity }));
    }
}

/**
 * Convenience wrapper that returns only ordered IDs (backward-compatible).
 */
export async function rerankChunks(
    question: string,
    chunks: Array<MatchedChunk & { book_title: string; chapter: string; topic: string }>,
    topK: number = 8
): Promise<string[]> {
    const results = await rerankChunksWithScores(question, chunks, topK);
    return results.map((r) => r.id);
}
