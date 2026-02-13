import { createChildLogger } from '@/lib/logger';
import { getEnv } from '@/lib/env';

const log = createChildLogger('query-expansion');

const EXPANSION_SYSTEM_PROMPT = `You are a search query optimizer for an educational textbook retrieval system.
Your job is to expand a student's query with relevant synonyms, related terms, and textbook vocabulary
so that the search engine can find more relevant passages.

Rules:
- Return ONLY the expanded query text, nothing else
- Keep it under 80 words
- Include the original terms plus synonyms and related concepts
- Use terminology likely found in secondary school textbooks
- Do not add explanations or formatting`;

/**
 * Expand a student query with related terms using Gemini Flash.
 *
 * Short/vague queries benefit most from expansion. Already-detailed
 * queries (>20 words) are returned as-is to avoid dilution.
 */
export async function expandQuery(query: string): Promise<string> {
    const wordCount = query.trim().split(/\s+/).length;

    // Already detailed enough — skip expansion to avoid diluting intent
    if (wordCount > 20) {
        log.debug({ wordCount }, 'Query already detailed, skipping expansion');
        return query;
    }

    try {
        const env = getEnv();
        const { getVertexAccessToken } = await import('@/lib/vertex/auth');
        const accessToken = await getVertexAccessToken();

        // Use Flash model for speed + cost efficiency
        const model = env.GEMINI_MODEL.replace('pro', 'flash').replace('001', '002');
        const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: EXPANSION_SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: 'Understood. I will expand queries with relevant search terms.' }] },
                    { role: 'user', parts: [{ text: `Expand this student query for textbook search:\n\n"${query}"` }] },
                ],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.2,
                },
            }),
        });

        if (!res.ok) {
            log.warn({ status: res.status }, 'Query expansion API failed, using original query');
            return query;
        }

        const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };

        const expanded = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!expanded || expanded.length < query.length) {
            log.warn('Query expansion returned empty/shorter result, using original');
            return query;
        }

        log.info(
            { original: query, expanded: expanded.slice(0, 100) },
            'Query expanded'
        );

        return expanded;
    } catch (err) {
        log.warn(
            { error: err instanceof Error ? err.message : String(err) },
            'Query expansion failed, using original query'
        );
        return query;
    }
}
