import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { runIngestionPipeline } from '@/lib/ingest/pipeline';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('worker-ingest');

export async function POST(request: NextRequest) {
    try {
        // Verify WORKER_SECRET
        const workerSecret = process.env.WORKER_SECRET;
        const authHeader = request.headers.get('authorization');

        if (!workerSecret || authHeader !== `Bearer ${workerSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Find next queued job
        const { data: job, error } = await supabase
            .from('ingest_jobs')
            .select('*')
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (error || !job) {
            return NextResponse.json({ message: 'No queued jobs found' }, { status: 200 });
        }

        log.info({ jobId: job.id }, 'Processing queued ingest job');

        const metadata = job.metadata as {
            storage_path: string;
            title: string;
            subject: string;
            form: number;
            language: string;
            publisher?: string;
        };

        // Run the ingestion pipeline
        await runIngestionPipeline({
            jobId: job.id,
            storagePath: metadata.storage_path,
            title: metadata.title,
            subject: metadata.subject,
            form: metadata.form,
            language: metadata.language,
            publisher: metadata.publisher,
        });

        return NextResponse.json({
            job_id: job.id,
            status: 'succeeded',
            message: 'Ingestion completed successfully',
        });
    } catch (err) {
        log.error({ error: err instanceof Error ? err.message : String(err) }, 'Worker ingest failed');
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Worker failed' },
            { status: 500 }
        );
    }
}
