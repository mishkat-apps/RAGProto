// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _admin: SupabaseClient<any, 'public', any> | undefined;

/**
 * Server-side Supabase admin client using service role key.
 * Uses `any` for database types since we don't have generated types yet.
 * Run `supabase gen types typescript` to generate strict types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any, 'public', any> {
    if (_admin) return _admin;
    const env = getEnv();
    _admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });
    return _admin;
}
