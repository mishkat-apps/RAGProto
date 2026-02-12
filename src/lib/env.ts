import { z } from 'zod';

const envSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().default('textbooks'),

    // LlamaParse
    LLAMAPARSE_API_KEY: z.string().min(1),

    // Google Cloud / Vertex AI
    VERTEX_PROJECT_ID: z.string().min(1),
    VERTEX_LOCATION: z.string().default('us-central1'),
    VERTEX_EMBEDDING_MODEL: z.string().default('text-embedding-005'),
    GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

    // Embedding dimensions
    EMBEDDING_DIM: z.coerce.number().int().positive().default(768),

    // Worker
    WORKER_SECRET: z.string().min(8),

    // Service Account (JSON string for Vercel)
    GOOGLE_SERVICE_ACCOUNT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
    if (_env) return _env;

    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const formatted = parsed.error.flatten().fieldErrors;
        console.error('❌ Invalid environment variables:', JSON.stringify(formatted, null, 2));
        throw new Error('Invalid environment variables. Check server logs.');
    }
    _env = parsed.data;
    return _env;
}

// Client-safe env (only NEXT_PUBLIC_ vars)
const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let _clientEnv: ClientEnv | undefined;

export function getClientEnv(): ClientEnv {
    if (_clientEnv) return _clientEnv;

    const parsed = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    if (!parsed.success) {
        throw new Error('Invalid client environment variables.');
    }
    _clientEnv = parsed.data;
    return _clientEnv;
}
