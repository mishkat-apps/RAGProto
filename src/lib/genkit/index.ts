import { genkit, z } from 'genkit';
export { z };
import fs from 'fs';
import { vertexAI } from '@genkit-ai/vertexai';
import { getEnv } from '../env';

const env = getEnv();

const vertexConfig: any = {
    projectId: env.VERTEX_PROJECT_ID,
    location: env.VERTEX_LOCATION,
};

// Add explicit credentials if available
if (env.GOOGLE_SERVICE_ACCOUNT) {
    try {
        vertexConfig.credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
    } catch (err) {
        console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT JSON');
    }
} else if (env.GOOGLE_APPLICATION_CREDENTIALS && typeof window === 'undefined') {
    const path = env.GOOGLE_APPLICATION_CREDENTIALS;
    if (fs.existsSync(path)) {
        try {
            const raw = fs.readFileSync(path, 'utf8');
            vertexConfig.credentials = JSON.parse(raw);
        } catch (err) {
            console.error('❌ Failed to read or parse credentials file:', err);
        }
    }
}

export const ai = genkit({
    plugins: [
        vertexAI(vertexConfig),
    ],
    // Favor the environment variable if set, otherwise fallback to a stable default
    model: `vertexai/${env.GEMINI_MODEL || 'gemini-1.5-flash'}`,
});
