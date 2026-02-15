import fs from 'fs';
import path from 'path';

// Manual loading of .env.local if needed (fallback if process.env.NEXT_PUBLIC_SUPABASE_URL is missing)
try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
        const envLocal = fs.readFileSync(envLocalPath, 'utf8');
        envLocal.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
} catch (err) {
    console.warn('Warning: Failed to load .env.local manually', err);
}

import { getSupabaseAdmin } from '../src/lib/supabase/admin';
import { extractEntities } from '../src/lib/rag/graph';
import { batchProcess } from '../src/lib/utils';
import { createChildLogger } from '../src/lib/logger';

const log = createChildLogger('backfill-entities');
const supabase = getSupabaseAdmin();

/**
 * Backfills entities for all existing chunks in the database.
 */
async function backfill() {
    log.info('Starting entity backfill for existing chunks');

    // 1. Fetch all chunks
    const { data: chunks, error: chunksError } = await supabase
        .from('chunks')
        .select('id, content')
        .order('created_at', { ascending: false });

    if (chunksError || !chunks) {
        log.error({ chunksError }, 'Failed to fetch chunks');
        return;
    }

    log.info({ totalChunks: chunks.length }, 'Fetched chunks for processing');

    // 2. Process in batches
    await batchProcess(chunks, 5, async (batch) => {
        for (const chunk of batch) {
            try {
                const entities = await extractEntities(chunk.content);
                if (entities.length === 0) continue;

                for (const ent of entities) {
                    // Upsert entity
                    const { data: entity, error: entError } = await supabase
                        .from('entities')
                        .upsert({
                            name: ent.name,
                            type: ent.type,
                            description: ent.description
                        }, { onConflict: 'name, type' })
                        .select('id')
                        .single();

                    if (entError || !entity) {
                        log.warn({ entError, name: ent.name }, 'Failed to upsert entity');
                        continue;
                    }

                    // Link chunk to entity
                    await supabase
                        .from('chunk_entities')
                        .upsert({
                            chunk_id: chunk.id,
                            entity_id: entity.id,
                            relevance_score: ent.relevance
                        }, { onConflict: 'chunk_id, entity_id' });
                }
            } catch (err) {
                log.error({ err, chunkId: chunk.id }, 'Error processing chunk');
            }
        }
        return batch;
    });

    log.info('Backfill completed successfully');
}

backfill().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
