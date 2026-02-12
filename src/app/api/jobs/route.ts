import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/jobs — List recent ingest jobs
 * GET /api/jobs?id=xxx — Get a specific job
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const jobId = request.nextUrl.searchParams.get('id');

        if (jobId) {
            const { data: job, error } = await supabase
                .from('ingest_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error || !job) {
                return NextResponse.json({ error: 'Job not found' }, { status: 404 });
            }

            return NextResponse.json({ job });
        }

        const { data: jobs, error } = await supabase
            .from('ingest_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ jobs: jobs || [] });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
