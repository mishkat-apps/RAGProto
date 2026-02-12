import { createChildLogger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { parsePdfWithLlamaParse } from './llamaparse';
import { normalizeMarkdown, buildPageMap, removePageBreaks } from './normalize';
import { extractStructure, flattenSectionsForDb } from './structure';
import { chunkSections, prepareChunksForDb } from '@/lib/rag/chunking';
import { generateEmbeddings } from '@/lib/vertex/embeddings';
import { getEnv } from '@/lib/env';
import { batchProcess } from '@/lib/utils';
import type { BookInsert, ChunkInsert, IngestJob } from '@/lib/supabase/types';

const log = createChildLogger('ingest-pipeline');

interface IngestInput {
    jobId: string;
    storagePath: string;
    title: string;
    subject: string;
    form: number;
    language: string;
    publisher?: string;
}

/**
 * Full ingestion pipeline: PDF → parse → chunk → embed → store
 */
export async function runIngestionPipeline(input: IngestInput): Promise<void> {
    const supabase = getSupabaseAdmin();
    const env = getEnv();
    const { jobId, storagePath, title, subject, form, language, publisher } = input;

    let bookId: string | null = null;

    try {
        // Update job status to running
        await updateJob(jobId, { status: 'running', progress: 5 });

        // Check if this is a retry — look for existing book_id on the job
        const { data: existingJob } = await supabase
            .from('ingest_jobs')
            .select('book_id')
            .eq('id', jobId)
            .single();

        if (existingJob?.book_id) {
            // Retry: reuse existing book, clean up old partial data
            bookId = existingJob.book_id;
            log.info({ bookId }, 'Retry detected — cleaning up previous partial data');

            // Delete old chunks and sections so we can re-ingest cleanly
            await supabase.from('chunks').delete().eq('book_id', bookId);
            await supabase.from('sections').delete().eq('book_id', bookId);
        }

        // Step 1: Download PDF from Supabase Storage
        log.info({ storagePath }, 'Step 1: Downloading PDF from Storage');
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .download(storagePath);

        if (downloadError || !fileData) {
            throw new Error(`Failed to download PDF: ${downloadError?.message || 'No data'}`);
        }

        const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
        await updateJob(jobId, { progress: 10 });

        // Step 2: Parse PDF with LlamaParse
        log.info('Step 2: Parsing PDF with LlamaParse');
        const rawMarkdown = await parsePdfWithLlamaParse(pdfBuffer, `${title}.pdf`);
        await updateJob(jobId, { progress: 30 });

        // Step 3: Normalize markdown
        log.info('Step 3: Normalizing markdown');
        const normalizedMd = normalizeMarkdown(rawMarkdown);
        const pageMap = buildPageMap(rawMarkdown);
        const cleanMd = removePageBreaks(normalizedMd);
        await updateJob(jobId, { progress: 35 });

        // Step 4: Store parsed markdown for audit
        log.info('Step 4: Storing parsed markdown for audit');
        const mdPath = `parsed/${storagePath.replace('.pdf', '.md')}`;
        const { error: uploadError } = await supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(mdPath, cleanMd, {
                contentType: 'text/markdown',
                upsert: true,
            });

        if (uploadError) {
            log.warn({ error: uploadError.message }, 'Failed to upload parsed markdown (non-fatal)');
        }

        // Step 5: Create or reuse book record
        if (bookId) {
            // Retry — update existing book record
            log.info({ bookId }, 'Step 5: Updating existing book record');
            await supabase
                .from('books')
                .update({
                    title,
                    subject,
                    form,
                    language,
                    publisher: publisher || null,
                    storage_path_pdf: storagePath,
                    storage_path_parsed_md: mdPath,
                })
                .eq('id', bookId);
        } else {
            // First run — create new book
            log.info('Step 5: Creating book record');
            const bookInsert: BookInsert = {
                title,
                subject,
                form,
                language,
                publisher: publisher || null,
                storage_path_pdf: storagePath,
                storage_path_parsed_md: mdPath,
            };

            const { data: book, error: bookError } = await supabase
                .from('books')
                .insert(bookInsert)
                .select()
                .single();

            if (bookError || !book) {
                throw new Error(`Failed to create book: ${bookError?.message}`);
            }

            bookId = book.id;
        }

        // Update job with book_id
        if (!bookId) {
            throw new Error('Book ID is unexpectedly null after creation step');
        }
        await updateJob(jobId, { book_id: bookId, progress: 40 });

        // Step 6: Extract structure
        log.info('Step 6: Extracting structure');
        const structure = extractStructure(cleanMd, pageMap);
        const sectionRows = flattenSectionsForDb(structure, bookId);

        if (sectionRows.length > 0) {
            const { error: secError } = await supabase.from('sections').insert(sectionRows);
            if (secError) {
                log.warn({ error: secError.message }, 'Section insert error (non-fatal)');
            }
        }

        await updateJob(jobId, { progress: 50 });

        // Build section title → ID map
        const { data: dbSections } = await supabase
            .from('sections')
            .select('id, title')
            .eq('book_id', bookId);

        const sectionIdMap = new Map<string, string>();
        for (const s of dbSections || []) {
            sectionIdMap.set(s.title, s.id);
        }

        // Step 7: Chunk text
        log.info('Step 7: Chunking text');
        const rawChunks = chunkSections(structure, bookId);
        const chunkInserts = await prepareChunksForDb(rawChunks, bookId, sectionIdMap);
        log.info({ chunkCount: chunkInserts.length }, 'Chunks prepared');
        await updateJob(jobId, { progress: 60 });

        // Step 8: Generate embeddings
        log.info('Step 8: Generating embeddings');
        const chunkTexts = chunkInserts.map((c) => c.content);
        const embeddings = await generateEmbeddings(chunkTexts);

        for (let i = 0; i < chunkInserts.length; i++) {
            chunkInserts[i].embedding = embeddings[i];
        }

        await updateJob(jobId, { progress: 85 });

        // Step 9: Insert chunks (deduplicate via content_hash)
        log.info('Step 9: Inserting chunks into database');
        await batchProcess(chunkInserts, 50, async (batch) => {
            const { error } = await supabase
                .from('chunks')
                .upsert(batch as unknown as Record<string, unknown>[], {
                    onConflict: 'content_hash',
                    ignoreDuplicates: true,
                });

            if (error) {
                log.warn({ error: error.message }, 'Chunk upsert batch error');
            }
            return batch;
        });

        await updateJob(jobId, { status: 'succeeded', progress: 100 });
        log.info({ jobId, bookId, chunks: chunkInserts.length }, 'Ingestion completed');
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error({ jobId, error: message }, 'Ingestion pipeline failed');

        // Clean up partial data on failure
        if (bookId) {
            log.info({ bookId }, 'Cleaning up partial data after failure');
            try {
                await supabase.from('chunks').delete().eq('book_id', bookId);
                await supabase.from('sections').delete().eq('book_id', bookId);
                await supabase.from('books').delete().eq('id', bookId);
                // Clear book_id from the job so next retry creates fresh
                await updateJob(jobId, { status: 'failed', error: message, book_id: null as unknown as string });
            } catch (cleanupErr) {
                log.error({ cleanupErr }, 'Failed to clean up partial data');
            }
        } else {
            await updateJob(jobId, { status: 'failed', error: message });
        }
        throw err;
    }
}

async function updateJob(
    jobId: string,
    updates: Partial<IngestJob> & { progress?: number }
) {
    const supabase = getSupabaseAdmin();
    await supabase
        .from('ingest_jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', jobId);
}
