import { createChildLogger } from '@/lib/logger';
import { withRetry } from '@/lib/utils';
import { getEnv } from '@/lib/env';

const log = createChildLogger('llamaparse');

interface LlamaParseResult {
    markdown: string;
    job_id: string;
}

/**
 * Send a PDF to LlamaParse and get structured Markdown back.
 * Uses the upload-from-url approach as the PDF is in Supabase Storage.
 */
export async function parsePdfWithLlamaParse(pdfBuffer: Buffer, filename: string): Promise<string> {
    const env = getEnv();
    const apiKey = env.LLAMAPARSE_API_KEY;

    log.info({ filename }, 'Starting LlamaParse upload');

    // Step 1: Upload the file
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), filename);
    formData.append('result_type', 'markdown');
    formData.append('auto_mode', 'true');
    formData.append('auto_mode_trigger_on_image_in_page', 'true');
    formData.append('auto_mode_trigger_on_table_in_page', 'true');
    formData.append('page_separator', '\n\n---PAGE_BREAK---\n\n');
    formData.append('do_not_unroll_columns', 'true');

    const uploadRes = await withRetry(
        () =>
            fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}` },
                body: formData,
            }),
        { maxRetries: 3, baseDelayMs: 2000, label: 'llamaparse-upload' }
    );

    if (!uploadRes.ok) {
        const body = await uploadRes.text();
        throw new Error(`LlamaParse upload failed (${uploadRes.status}): ${body}`);
    }

    const { id: jobId } = (await uploadRes.json()) as { id: string };
    log.info({ jobId }, 'LlamaParse job created, polling for result');

    // Step 2: Poll for completion
    const result = await pollLlamaParseJob(apiKey, jobId);
    log.info({ jobId, markdownLength: result.markdown.length }, 'LlamaParse completed');

    return result.markdown;
}

async function pollLlamaParseJob(apiKey: string, jobId: string): Promise<LlamaParseResult> {
    const maxPolls = 120; // 10 minutes at 5s interval
    const pollInterval = 5000;

    for (let i = 0; i < maxPolls; i++) {
        const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!statusRes.ok) {
            throw new Error(`LlamaParse status check failed: ${statusRes.status}`);
        }

        const status = (await statusRes.json()) as { status: string; error?: string };

        if (status.status === 'SUCCESS') {
            // Fetch the markdown result
            const resultRes = await fetch(
                `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );

            if (!resultRes.ok) {
                throw new Error(`LlamaParse result fetch failed: ${resultRes.status}`);
            }

            const resultData = (await resultRes.json()) as { markdown: string };
            return { markdown: resultData.markdown, job_id: jobId };
        }

        if (status.status === 'ERROR') {
            throw new Error(`LlamaParse job failed: ${status.error || 'Unknown error'}`);
        }

        log.debug({ jobId, status: status.status, poll: i + 1 }, 'Polling LlamaParse...');
        await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`LlamaParse job ${jobId} timed out after ${maxPolls * pollInterval / 1000}s`);
}
