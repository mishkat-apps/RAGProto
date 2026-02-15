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
        console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT JSON in Genkit init');
    }
} else if (env.GOOGLE_APPLICATION_CREDENTIALS && typeof window === 'undefined') {
    // If we have a file path and we are on the server (node), verify it exists
    if (fs.existsSync(env.GOOGLE_APPLICATION_CREDENTIALS)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
    } else {
        console.warn(`⚠️ GOOGLE_APPLICATION_CREDENTIALS path specified (${env.GOOGLE_APPLICATION_CREDENTIALS}) but file not found. Skipping.`);
    }
} else if (typeof window === 'undefined') {
    console.warn('⚠️ No explicit Google credentials found. Genkit will try to use Application Default Credentials.');
}

export const ai = genkit({
    plugins: [
        vertexAI(vertexConfig),
    ],
    model: 'vertexai/gemini-1.5-flash-002', // Default model for fast extraction/classification
});
