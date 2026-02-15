import './env-init';

import { ai, z } from '../src/lib/genkit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID;
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !VERTEX_PROJECT_ID) {
    console.error('❌ Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VERTEX_PROJECT_ID)');
    process.exit(1);
}

// (Genkit logic is now handled by the imported 'ai' instance)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
});

// --- 3. Logic & Schemas ---
const EntitySchema = z.object({
    entities: z.array(z.object({
        name: z.string(),
        type: z.enum(['Concept', 'Definition', 'Process', 'Person', 'Location', 'Event', 'Other']),
        description: z.string().optional(),
        relevance: z.number().min(0).max(1),
    }))
});

async function extractEntities(text: string) {
    try {
        const response = await ai.generate({
            prompt: `
            You are a specialized educational content analyzer.
            Extract key academic entities, definitions, and concepts from the following text.
            
            TEXT:
            """
            ${text}
            """
            `,
            output: { schema: EntitySchema }
        });
        return response.output?.entities || [];
    } catch (err) {
        console.error('Extraction failed:', err);
        return [];
    }
}

async function main() {
    console.log('--- Starting GraphRAG Entity Backfill ---');

    // 1. Get chunks that haven't been processed yet
    // We check this by seeing if they have any entries in chunk_entities
    // For simplicity in this script, we'll just fetch chunks and upsert
    const { data: chunks, error: fetchError } = await supabase
        .from('chunks')
        .select('id, content')
        .limit(100); // Process in small batches for safety

    if (fetchError || !chunks) {
        console.error('Error fetching chunks:', fetchError);
        return;
    }

    console.log(`Found ${chunks.length} chunks to process.`);

    for (const chunk of chunks) {
        console.log(`Processing chunk ${chunk.id.slice(0, 8)}...`);
        const entities = await extractEntities(chunk.content);

        if (entities.length === 0) continue;

        console.log(`  Extracted ${entities.length} entities.`);

        for (const entity of entities) {
            // First, upsert the entity
            const { data: entityData, error: entityError } = await supabase
                .from('entities')
                .upsert({
                    name: entity.name,
                    type: entity.type,
                    description: entity.description
                }, { onConflict: 'name,type' })
                .select()
                .single();

            if (entityError) {
                console.error(`  Error upserting entity "${entity.name}":`, entityError);
                continue;
            }

            // Then, link it to the chunk
            const { error: linkError } = await supabase
                .from('chunk_entities')
                .upsert({
                    chunk_id: chunk.id,
                    entity_id: entityData.id,
                    relevance_score: entity.relevance
                }, { onConflict: 'chunk_id,entity_id' });

            if (linkError) {
                console.error(`  Error linking entity to chunk:`, linkError);
            }
        }
    }

    console.log('--- Backfill Completed ---');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
