import { createChildLogger } from '@/lib/logger';
import { getEnv } from '@/lib/env';
import { withRetry, batchProcess } from '@/lib/utils';

const log = createChildLogger('vertex-embeddings');

/**
 * Generate embeddings for a list of texts using Vertex AI.
 * Handles batching and retry with exponential backoff.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const env = getEnv();

    log.info({ count: texts.length }, 'Generating embeddings');

    const results = await batchProcess(texts, 100, async (batch, batchIdx) => {
        log.debug({ batchIdx, batchSize: batch.length }, 'Processing embedding batch');

        const embeddings = await withRetry(
            () => callVertexEmbeddings(batch, env),
            { maxRetries: 3, baseDelayMs: 2000, label: `embeddings-batch-${batchIdx}` }
        );

        return embeddings;
    });

    log.info({ count: results.length }, 'Embeddings generated');
    return results;
}

/**
 * Generate embedding for a single text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const results = await generateEmbeddings([text]);
    return results[0];
}

async function callVertexEmbeddings(
    texts: string[],
    env: { VERTEX_PROJECT_ID: string; VERTEX_LOCATION: string; VERTEX_EMBEDDING_MODEL: string }
): Promise<number[][]> {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.VERTEX_EMBEDDING_MODEL}:predict`;

    const instances = texts.map((text) => ({
        content: text.slice(0, 3000), // Truncate very long texts
        task_type: 'RETRIEVAL_DOCUMENT',
    }));

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instances }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Vertex embeddings failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
        predictions: Array<{ embeddings: { values: number[] } }>;
    };

    return data.predictions.map((p) => p.embeddings.values);
}

/**
 * Generate an embedding for a query (uses RETRIEVAL_QUERY task type).
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
    const env = getEnv();

    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.VERTEX_EMBEDDING_MODEL}:predict`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            instances: [{ content: text, task_type: 'RETRIEVAL_QUERY' }],
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Vertex query embedding failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
        predictions: Array<{ embeddings: { values: number[] } }>;
    };

    return data.predictions[0].embeddings.values;
}
