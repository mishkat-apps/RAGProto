import { genkit, z } from 'genkit';
export { z };
import { vertexAI } from '@genkit-ai/vertexai';
import { getEnv } from '../env';

const env = getEnv();

export const ai = genkit({
    plugins: [
        vertexAI({
            projectId: env.VERTEX_PROJECT_ID,
            location: env.VERTEX_LOCATION,
        }),
    ],
    model: 'vertexai/gemini-1.5-flash', // Default model for fast extraction/classification
});
