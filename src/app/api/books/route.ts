import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/books — List all books with their ingest job status
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get latest job status for each book
        const { data: jobs } = await supabase
            .from('ingest_jobs')
            .select('*')
            .order('created_at', { ascending: false });

        const bookJobMap = new Map<string, unknown>();
        for (const job of jobs || []) {
            if (job.book_id && !bookJobMap.has(job.book_id)) {
                bookJobMap.set(job.book_id, job);
            }
        }

        const booksWithStatus = (books || []).map((book: { id: string }) => ({
            ...book,
            latest_job: bookJobMap.get(book.id) || null,
        }));

        return NextResponse.json({ books: booksWithStatus });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
