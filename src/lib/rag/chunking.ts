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

const CHUNK_TOKENS = { min: 100, max: 500 };
const OVERLAP_SENTENCES = 2; // Carry last N sentences from previous chunk

/**
 * Chunk extracted sections into contextual, overlapping chunks.
 * Tags each chunk with a type based on content/heading analysis.
 *
 * Improvements over v1:
 * - Section-context prefix: each chunk starts with "[Chapter: X] [Topic: Y]"
 * - Overlap: last 2 sentences of previous chunk are carried into next
 * - Larger chunks (500 tokens max) to preserve more context
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
            // Build section-context prefix
            const contextPrefix = buildContextPrefix(sectionPath);

            const textChunks = splitTextIntoChunksWithOverlap(
                section.content,
                CHUNK_TOKENS.max,
                contextPrefix
            );

            for (const text of textChunks) {
                // Skip tiny fragments (after stripping prefix for size check)
                const contentWithoutPrefix = text.replace(contextPrefix, '').trim();
                if (estimateTokens(contentWithoutPrefix) < 30) continue;

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
 * Build a context prefix from the section path.
 * e.g., "Climate > Altitude" → "[Chapter: Climate] [Topic: Altitude]\n\n"
 */
function buildContextPrefix(sectionPath: string): string {
    const parts = sectionPath.split(' > ').map((s) => s.trim()).filter(Boolean);

    if (parts.length === 0) return '';
    if (parts.length === 1) return `[Chapter: ${parts[0]}]\n\n`;
    if (parts.length === 2) return `[Chapter: ${parts[0]}] [Topic: ${parts[1]}]\n\n`;

    // 3+ levels: Chapter > Topic > Subtopic
    return `[Chapter: ${parts[0]}] [Topic: ${parts[1]}] [Subtopic: ${parts.slice(2).join(' > ')}]\n\n`;
}

/**
 * Split text into chunks with overlap at boundaries.
 * Each chunk gets the section-context prefix prepended.
 */
function splitTextIntoChunksWithOverlap(
    text: string,
    maxTokens: number,
    contextPrefix: string
): string[] {
    const prefixTokens = estimateTokens(contextPrefix);
    const effectiveMax = maxTokens - prefixTokens;
    const paragraphs = text.split(/\n\n+/);
    const rawChunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        const combined = currentChunk ? `${currentChunk}\n\n${para}` : para;

        if (estimateTokens(combined) > effectiveMax && currentChunk) {
            rawChunks.push(currentChunk);
            currentChunk = para;
        } else {
            currentChunk = combined;
        }
    }

    if (currentChunk.trim()) {
        rawChunks.push(currentChunk);
    }

    // Split oversized paragraphs by sentences
    const splitChunks = rawChunks.flatMap((chunk) => {
        if (estimateTokens(chunk) > effectiveMax * 1.5) {
            return splitBySentences(chunk, effectiveMax);
        }
        return [chunk];
    });

    // Apply overlap: carry last N sentences from previous chunk
    const overlappedChunks: string[] = [];
    for (let i = 0; i < splitChunks.length; i++) {
        if (i === 0) {
            overlappedChunks.push(contextPrefix + splitChunks[i]);
        } else {
            const prevSentences = extractLastSentences(splitChunks[i - 1], OVERLAP_SENTENCES);
            const overlap = prevSentences ? `${prevSentences}\n\n` : '';
            const withOverlap = overlap + splitChunks[i];

            // Only add overlap if it doesn't make the chunk too large
            if (estimateTokens(withOverlap) <= effectiveMax * 1.2) {
                overlappedChunks.push(contextPrefix + withOverlap);
            } else {
                overlappedChunks.push(contextPrefix + splitChunks[i]);
            }
        }
    }

    return overlappedChunks;
}

/**
 * Extract the last N sentences from a text block.
 */
function extractLastSentences(text: string, count: number): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length === 0) return '';
    return sentences.slice(-count).join(' ').trim();
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

    // Hard-split any remaining oversized chunks by characters (~3 chars per token)
    return chunks.flatMap((chunk) => {
        if (estimateTokens(chunk) > maxTokens * 2) {
            return hardSplitByCharacters(chunk, maxTokens);
        }
        return [chunk];
    });
}

/**
 * Last-resort fallback: split by character count, breaking at word boundaries.
 */
function hardSplitByCharacters(text: string, maxTokens: number): string[] {
    const maxChars = maxTokens * 3; // ~3 chars per token
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const word of words) {
        const combined = current ? `${current} ${word}` : word;
        if (combined.length > maxChars && current) {
            chunks.push(current.trim());
            current = word;
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
        'very', 'just', 'only', 'chapter', 'topic', 'subtopic',
    ]);

    // Strip the context prefix before extracting keywords
    const cleanText = text
        .replace(/\[Chapter:[^\]]*\]/g, '')
        .replace(/\[Topic:[^\]]*\]/g, '')
        .replace(/\[Subtopic:[^\]]*\]/g, '');

    const words = cleanText
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
