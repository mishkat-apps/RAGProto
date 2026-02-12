import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    opts: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 1000, label = 'operation' } = opts;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
                console.warn(`[retry] ${label} attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Process array items in batches.
 */
export async function batchProcess<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[], batchIndex: number) => Promise<R[]>
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch, Math.floor(i / batchSize));
        results.push(...batchResults);
    }
    return results;
}

/**
 * Create a SHA-256 hash of a string.
 */
export async function sha256(text: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(text, 'utf-8').digest('hex');
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars for English).
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Sleep for ms.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
