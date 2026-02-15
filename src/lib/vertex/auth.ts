import { GoogleAuth } from 'google-auth-library';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('vertex-auth');

/**
 * Returns a GoogleAuth client configured for Vertex AI.
 * Prioritizes GOOGLE_SERVICE_ACCOUNT (JSON string) if provided,
 * otherwise falls back to Application Default Credentials (ADC).
 */
export async function getVertexAuth() {
    const env = getEnv();

    try {
        // Prioritize explicit GOOGLE_APPLICATION_CREDENTIALS (file path) or ADC
        if (env.GOOGLE_APPLICATION_CREDENTIALS) {
            log.info({ path: env.GOOGLE_APPLICATION_CREDENTIALS }, 'Attempting authentication with service account key file');
            return new GoogleAuth({
                keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
        }

        // Fallback to GOOGLE_SERVICE_ACCOUNT (JSON string) for Vercel/CI
        if (env.GOOGLE_SERVICE_ACCOUNT) {
            log.info('Attempting authentication with GOOGLE_SERVICE_ACCOUNT JSON string');
            try {
                const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
                return new GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
                });
            } catch (parseErr) {
                log.error({ error: parseErr instanceof Error ? parseErr.message : String(parseErr) }, 'Failed to parse GOOGLE_SERVICE_ACCOUNT JSON string.');
                throw parseErr;
            }
        }

        log.info('No explicit credentials found. Attempting Application Default Credentials (ADC)');
        return new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error({ error: message }, 'Failed to initialize Google Auth');
        throw new Error(`Could not initialize Google Cloud authentication: ${message}`);
    }
}

/**
 * Returns a fresh access token for Vertex AI.
 */
export async function getVertexAccessToken() {
    const auth = await getVertexAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
        throw new Error('Failed to retrieve access token from Google Cloud');
    }

    return tokenResponse.token;
}
