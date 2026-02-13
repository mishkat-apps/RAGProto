import { getVertexAccessToken } from './auth';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('vertex-cache');

interface CacheEntry {
    name: string;       // e.g. "projects/.../cachedContents/abc123"
    expiresAt: number;  // Unix ms
}

// In-memory map: bookId -> cached content resource name + expiry
const cacheMap = new Map<string, CacheEntry>();

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_SAFETY_MARGIN_MS = 5 * 60 * 1000; // 5-minute safety margin before expiry

/**
 * Get or create a Vertex AI cached content resource for a book.
 * Returns the full resource name to pass to generateContent.
 */
export async function getOrCreateBookCache(
    bookId: string,
    fullText: string,
    bookTitle: string,
): Promise<string> {
    // Check in-memory cache first
    const existing = cacheMap.get(bookId);
    if (existing && existing.expiresAt > Date.now() + CACHE_SAFETY_MARGIN_MS) {
        log.info({ bookId, cachedName: existing.name }, 'Reusing existing context cache');
        return existing.name;
    }

    log.info({ bookId, textLength: fullText.length }, 'Creating new context cache');

    const env = getEnv();
    const accessToken = await getVertexAccessToken();

    const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/cachedContents`;

    const body = {
        model: `projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}`,
        displayName: `necta-book-${bookId.slice(0, 8)}`,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `You are provided with the complete text of the textbook "${bookTitle}". Use this as your primary knowledge source to answer questions.\n\n--- FULL TEXTBOOK START ---\n\n${fullText}\n\n--- FULL TEXTBOOK END ---`,
                    },
                ],
            },
        ],
        ttl: `${CACHE_TTL_SECONDS}s`,
    };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        log.error({ status: res.status, body: errorBody }, 'Failed to create context cache');
        throw new Error(`Vertex AI cachedContents.create failed (${res.status}): ${errorBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const cachedContentName: string = data.name;

    // Store in memory
    cacheMap.set(bookId, {
        name: cachedContentName,
        expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
    });

    log.info({ bookId, cachedContentName }, 'Context cache created successfully');
    return cachedContentName;
}

/**
 * Call Gemini generateContent using a cached context.
 */
export async function callGeminiWithCache(
    cachedContentName: string,
    prompt: string,
    systemPrompt?: string,
): Promise<string> {
    const env = getEnv();
    const accessToken = await getVertexAccessToken();

    const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

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
            cachedContent: cachedContentName,
            contents,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
            },
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        log.error({ status: res.status, body }, 'Gemini call with cache failed');
        throw new Error(`Gemini cached call failed (${res.status}): ${body.slice(0, 100)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
