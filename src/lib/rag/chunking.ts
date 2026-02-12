import { ChunkInsert, ChunkType } from '@/lib/supabase/types';
import { estimateTokens, sha256 } from '@/lib/utils';
import { ExtractedSection } from '@/lib/ingest/structure';

export interface RawChunk {
    content: string;
    chunkType: ChunkType;
    sectionTitle: string;
    sectionPath: string; // e.g., "Chapter 1 > Topic 2 > Subtopic 3"
    pageStart: number;
    pageEnd: number;
    sectionId?: string;
}

const SMALL_CHUNK_TOKENS = { min: 100, max: 350 };
const MEDIUM_CHUNK_TOKENS = { min: 350, max: 900 };

/**
 * Chunk extracted sections into small and medium chunks.
 * Tags each chunk with a type based on content/heading analysis.
 */
export function chunkSections(
    sections: ExtractedSection[],
    bookId: string,
    parentPath: string = ''
): RawChunk[] {
    const chunks: RawChunk[] = [];

    for (const section of sections) {
        const sectionPath = parentPath ? `${parentPath} > ${section.title}` : section.title;
        const chunkType = classifyChunkType(section.title, section.content);

        if (section.content.trim().length > 0) {
            const textChunks = splitTextIntoChunks(section.content, SMALL_CHUNK_TOKENS.max);

            for (const text of textChunks) {
                if (estimateTokens(text) < 30) continue; // Skip tiny fragments

                chunks.push({
                    content: text.trim(),
                    chunkType,
                    sectionTitle: section.title,
                    sectionPath,
                    pageStart: section.pageStart,
                    pageEnd: section.pageEnd,
                });
            }
        }

        // Recurse into children
        if (section.children.length > 0) {
            chunks.push(...chunkSections(section.children, bookId, sectionPath));
        }
    }

    return chunks;
}

/**
 * Classify a chunk's type based on heading + content heuristics.
 */
function classifyChunkType(heading: string, content: string): ChunkType {
    const h = heading.toLowerCase();
    const c = content.toLowerCase().slice(0, 200);

    if (h.includes('revision exercise') || h.includes('exercise') || h.includes('question')) {
        return 'exercise';
    }
    if (h.includes('glossary') || h.includes('key terms') || h.includes('vocabulary')) {
        return 'definition';
    }
    if (h.includes('summary') || h.includes('recap') || h.includes('conclusion')) {
        return 'summary';
    }
    if (h.includes('example') || h.includes('case study') || h.includes('illustration')) {
        return 'example';
    }
    if (c.startsWith('the meaning of') || c.includes('is defined as') || c.includes('refers to')) {
        return 'definition';
    }

    return 'explanation';
}

/**
 * Split text into chunks respecting paragraph boundaries.
 */
function splitTextIntoChunks(text: string, maxTokens: number): string[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        const combined = currentChunk ? `${currentChunk}\n\n${para}` : para;

        if (estimateTokens(combined) > maxTokens && currentChunk) {
            chunks.push(currentChunk);
            currentChunk = para;
        } else {
            currentChunk = combined;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk);
    }

    // If a single paragraph exceeds maxTokens, split by sentences
    return chunks.flatMap((chunk) => {
        if (estimateTokens(chunk) > maxTokens * 1.5) {
            return splitBySentences(chunk, maxTokens);
        }
        return [chunk];
    });
}

function splitBySentences(text: string, maxTokens: number): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
        const combined = current ? `${current} ${sentence}` : sentence;
        if (estimateTokens(combined) > maxTokens && current) {
            chunks.push(current.trim());
            current = sentence;
        } else {
            current = combined;
        }
    }

    if (current.trim()) {
        chunks.push(current.trim());
    }

    return chunks;
}

/**
 * Convert raw chunks to database-ready ChunkInsert objects.
 * Computes content_hash for deduplication.
 */
export async function prepareChunksForDb(
    rawChunks: RawChunk[],
    bookId: string,
    sectionIdMap: Map<string, string>
): Promise<ChunkInsert[]> {
    const inserts: ChunkInsert[] = [];

    for (const chunk of rawChunks) {
        const hashInput = `${chunk.sectionPath}::${chunk.content}`;
        const contentHash = await sha256(hashInput);

        inserts.push({
            book_id: bookId,
            section_id: sectionIdMap.get(chunk.sectionTitle) || null,
            chunk_type: chunk.chunkType,
            content: chunk.content,
            page_start: chunk.pageStart,
            page_end: chunk.pageEnd,
            tokens_estimate: estimateTokens(chunk.content),
            keywords: extractKeywords(chunk.content),
            embedding: null, // Will be filled by embeddings step
            content_hash: contentHash,
        });
    }

    return inserts;
}

/**
 * Extract simple keywords from text (top terms by frequency).
 */
function extractKeywords(text: string): string[] {
    const stopwords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'not', 'no', 'be', 'was', 'were',
        'has', 'had', 'have', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these',
        'those', 'it', 'its', 'are', 'from', 'as', 'by', 'they', 'their',
        'been', 'being', 'also', 'than', 'then', 'so', 'if', 'when', 'where',
        'how', 'what', 'who', 'whom', 'why', 'all', 'each', 'every', 'both',
        'such', 'into', 'about', 'between', 'through', 'during', 'before',
        'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
        'under', 'again', 'further', 'once', 'more', 'most', 'other', 'some',
        'very', 'just', 'only',
    ]);

    const words = text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopwords.has(w));

    const freq = new Map<string, number>();
    for (const word of words) {
        freq.set(word, (freq.get(word) || 0) + 1);
    }

    return Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}
