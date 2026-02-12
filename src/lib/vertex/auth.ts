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
        if (env.GOOGLE_SERVICE_ACCOUNT) {
            log.debug('Using service account from environment variable');
            const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
            return new GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
        }

        log.debug('Using Application Default Credentials');
        return new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    } catch (err) {
        log.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to initialize Google Auth');
        throw new Error('Could not initialize Google Cloud authentication. Check GOOGLE_SERVICE_ACCOUNT or ADC.');
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
