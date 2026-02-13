import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getEnv } from '@/lib/env';

/**
 * DELETE /api/books/[id] — Delete a book and its physical file
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getSupabaseAdmin();
        const env = getEnv();

        // 1. Get the book to find storage path
        const { data: book, error: fetchError } = await supabase
            .from('books')
            .select('storage_path_pdf')
            .eq('id', id)
            .single();

        if (fetchError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        // 2. Delete the book from the database
        // Cascade delete will handle sections and chunks automatically based on schema.
        const { error: deleteError } = await supabase
            .from('books')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 3. Delete physical file from Supabase Storage
        if (book.storage_path_pdf) {
            const { error: storageError } = await supabase.storage
                .from(env.SUPABASE_STORAGE_BUCKET)
                .remove([book.storage_path_pdf]);

            if (storageError) {
                console.error('Failed to delete PDF from storage:', storageError.message);
                // We don't fail the whole request if storage delete fails
                // since the record is already gone from DB.
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
