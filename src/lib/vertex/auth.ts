import { GoogleAuth } from 'google-auth-library';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';
import fs from 'fs';

const log = createChildLogger('vertex-auth');

/**
 * Returns a GoogleAuth client configured for Vertex AI.
 * Prioritizes GOOGLE_SERVICE_ACCOUNT (JSON string) if provided,
 * as it is more reliable for serverless environments.
 * Otherwise falls back to GOOGLE_APPLICATION_CREDENTIALS (file path) or ADC.
 */
export async function getVertexAuth() {
    const env = getEnv();

    try {
        // 1. High Priority: GOOGLE_SERVICE_ACCOUNT (JSON string) 
        if (env.GOOGLE_SERVICE_ACCOUNT) {
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

        // 2. Medium Priority: GOOGLE_APPLICATION_CREDENTIALS (file path)
        if (env.GOOGLE_APPLICATION_CREDENTIALS) {
            const path = env.GOOGLE_APPLICATION_CREDENTIALS;
            if (fs.existsSync(path)) {
                return new GoogleAuth({
                    keyFilename: path,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
                });
            } else {
                log.warn({ path }, 'GOOGLE_APPLICATION_CREDENTIALS path specified but file not found.');
                // Fall through to ADC
            }
        }

        log.info('Final attempt: falling back to Application Default Credentials (ADC)');
        return new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error({ error: message }, 'Failed to initialize Google Auth');

        let hint = '';
        if (env.GOOGLE_APPLICATION_CREDENTIALS && !fs.existsSync(env.GOOGLE_APPLICATION_CREDENTIALS)) {
            hint = ` (Hint: GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist: ${env.GOOGLE_APPLICATION_CREDENTIALS})`;
        } else if (!env.GOOGLE_SERVICE_ACCOUNT) {
            hint = ' (Hint: Try setting GOOGLE_SERVICE_ACCOUNT with your service account JSON string for serverless environments)';
        }

        throw new Error(`Could not initialize Google Cloud authentication: ${message}${hint}`);
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
