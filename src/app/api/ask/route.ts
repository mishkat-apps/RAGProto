import { NextRequest, NextResponse } from 'next/server';
import { answerNECTAQuestion } from '@/lib/genkit/flows';
import { answerWithFullContext } from '@/lib/genkit/cag-flow';
import { answerWithGraph } from '@/lib/genkit/graph-flow';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const askSchema = z.object({
    question: z.string().min(1),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional(),
    filters: z
        .object({
            book_id: z.string().uuid().optional(),
            subject: z.string().optional(),
            form: z.number().int().min(1).max(6).optional(),
            chapter: z.string().optional(),
            topic: z.string().optional(),
        })
        .optional(),
    topK: z.number().int().min(1).max(50).optional(),
    mode: z.enum(['rag', 'cag', 'graph']).optional().default('rag'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = askSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // --- Guest / Auth Check ---
        const supabase = await createSupabaseServer();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('--- API Auth Debug ---');
        console.log('User found:', !!user);
        console.log('User ID:', user?.id);
        if (authError) console.error('Auth Error:', authError);

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const isAnonymous = user.is_anonymous || user.app_metadata.provider === 'anonymous';
        const userId = user.id;

        if (isAnonymous) {
            const admin = getSupabaseAdmin();
            const { count, error: countErr } = await admin
                .from('queries_log')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countErr) {
                console.error('Error checking guest count:', countErr);
            } else if (count !== null && count >= 10) {
                return NextResponse.json(
                    { error: 'LIMIT_REACHED', message: 'Guest limit reached. Please register to continue.' },
                    { status: 403 }
                );
            }
        }
        // --------------------------

        const { mode, ...requestData } = parsed.data;
        // Inject userId into requestData for the flows to use for logging
        const enrichedRequestData = { ...requestData, userId };
        let result;

        if (mode === 'cag') {
            result = await answerWithFullContext(enrichedRequestData);
        } else if (mode === 'graph') {
            result = await answerWithGraph(enrichedRequestData);
        } else {
            result = await answerNECTAQuestion(enrichedRequestData);
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('Error in /api/ask:', err);
        return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
