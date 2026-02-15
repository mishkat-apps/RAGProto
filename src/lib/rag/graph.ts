import { z, ai } from '../genkit';
import { createChildLogger } from '../logger';
import { getSupabaseAdmin } from '../supabase/admin';
import { retrieveChunks } from './retrieval';
import type { MatchedChunk } from '../supabase/types';

const log = createChildLogger('graph-rag');

// Schema for extracted entities
export const EntitySchema = z.object({
    entities: z.array(z.object({
        name: z.string().describe('The name of the concept, person, location, or specialized term.'),
        type: z.enum(['Concept', 'Definition', 'Process', 'Person', 'Location', 'Event', 'Other']).describe('The category of the entity.'),
        description: z.string().optional().describe('A brief definition or explanation of the entity as used in the text.'),
        relevance: z.number().min(0).max(1).describe('How central this entity is to the provided text chunk (0.0 to 1.0).'),
    })).describe('List of key semantic entities found in the text.')
});

export type ExtractedEntity = z.infer<typeof EntitySchema>['entities'][0];

/**
 * Extracts key semantic entities from a text chunk using Gemini via Genkit.
 */
export async function extractEntities(text: string): Promise<ExtractedEntity[]> {
    try {
        const response = await ai.generate({
            prompt: `
            You are a specialized educational content analyzer.
            Your task is to extract key academic entities, definitions, and concepts from the following textbook text.
            Focus on terms that are central to the subject matter and would be useful for connecting this text to other related topics.

            TEXT:
            """
            ${text}
            """
            `,
            output: { schema: EntitySchema }
        });

        const entities = response.output?.entities || [];
        log.info({ entityCount: entities.length }, 'Entities extracted successfully');
        return entities;
    } catch (err) {
        log.error({ err, text: text.slice(0, 50) + '...' }, 'Entity extraction failed');
        return [];
    }
}

/**
 * Identifies potential entities in a user's query.
 */
export async function identifyQueryEntities(query: string): Promise<string[]> {
    try {
        const response = await ai.generate({
            prompt: `
            Identify the key subjects, concepts, or terms in this student question. 
            Return only the names of the most relevant entities found in the project's knowledge base.

            QUESTION: "${query}"
            `,
            output: {
                schema: z.object({
                    entityNames: z.array(z.string()).describe('List of entity names to look up.')
                })
            }
        });

        return response.output?.entityNames || [];
    } catch (err) {
        log.error({ err }, 'Query entity identification failed');
        return [];
    }
}

/**
 * Multi-pronged retrieval for GraphRAG:
 * 1. Vector search for semantic similarity.
 * 2. Entity-based retrieval for structural connections.
 * 3. Fusion and Ranking.
 */
export async function retrieveWithGraph(params: {
    query: string;
    bookId?: string;
    limit?: number;
}): Promise<MatchedChunk[]> {
    const { query, bookId, limit = 8 } = params;
    const supabase = getSupabaseAdmin();

    log.info({ query, bookId }, 'Starting GraphRAG retrieval');

    // Step A: Parallel retrieval
    const [queryEntities, vectorChunks] = await Promise.all([
        identifyQueryEntities(query),
        retrieveChunks(query, { bookId, topK: limit })
    ]);

    log.info({ queryEntities, vectorCount: vectorChunks.length }, 'Retrieved entities and vector chunks');

    // Step B: Fetch chunks linked to these entities (Structural Retrieval)
    let graphChunks: MatchedChunk[] = [];
    if (queryEntities.length > 0) {
        const { data, error } = await supabase.rpc('get_chunks_by_entities', {
            entity_names: queryEntities,
            p_book_id: bookId,
            p_limit: limit
        });

        if (error) {
            log.error({ error }, 'Failed to fetch graph chunks');
        } else {
            graphChunks = (data || []).map((c: any) => ({
                ...c,
                similarity: c.relevance_score || 0.5
            })) as MatchedChunk[];
        }
    }

    // Step C: Fusion and De-duplication
    const allChunks = [...graphChunks, ...vectorChunks];
    const seenIds = new Set<string>();
    const uniqueChunks: MatchedChunk[] = [];

    // Prioritize graph chunks if there's overlap (structural relevance)
    for (const chunk of allChunks) {
        if (!seenIds.has(chunk.id)) {
            seenIds.add(chunk.id);
            uniqueChunks.push(chunk);
        }
    }

    log.info({
        graphCount: graphChunks.length,
        vectorCount: vectorChunks.length,
        finalCount: uniqueChunks.length
    }, 'GraphRAG retrieval completed');

    return uniqueChunks.slice(0, limit + 4);
}
