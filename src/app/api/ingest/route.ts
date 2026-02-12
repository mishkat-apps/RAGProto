import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const ingestSchema = z.object({
    storage_path: z.string().min(1),
    title: z.string().min(1),
    subject: z.string().min(1),
    form: z.number().int().min(1).max(6),
    language: z.string().default('en'),
    publisher: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = ingestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { storage_path, title, subject, form, language, publisher } = parsed.data;
        const supabase = getSupabaseAdmin();

        // Create ingest job
        const { data: job, error } = await supabase
            .from('ingest_jobs')
            .insert({
                status: 'queued',
                progress: 0,
                metadata: { storage_path, title, subject, form, language, publisher },
            })
            .select()
            .single();

        if (error || !job) {
            return NextResponse.json(
                { error: `Failed to create job: ${error?.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            job_id: job.id,
            status: 'queued',
            message: 'Ingestion job queued. Call POST /api/worker/ingest to process.',
        });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
