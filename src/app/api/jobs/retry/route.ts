import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/jobs/retry — Reset a failed job back to 'queued' so the worker picks it up again
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const jobId = body.job_id;

        if (!jobId) {
            return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Only allow retrying failed jobs
        const { data: job, error: fetchError } = await supabase
            .from('ingest_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (fetchError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (job.status !== 'failed') {
            return NextResponse.json(
                { error: `Cannot retry job with status '${job.status}'. Only failed jobs can be retried.` },
                { status: 400 }
            );
        }

        // Reset to queued
        const { error: updateError } = await supabase
            .from('ingest_jobs')
            .update({ status: 'queued', progress: 0, error: null, updated_at: new Date().toISOString() })
            .eq('id', jobId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Job re-queued successfully', job_id: jobId });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
