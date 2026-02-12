/**
 * Prompt template for reranking chunks.
 */
export const RERANK_PROMPT = `You are a reranking judge for a textbook RAG system. Given a student's question and a list of text chunks from a textbook, rank the chunks by relevance to the question.

Question: "{question}"

Chunks:
{chunks}

Return ONLY a JSON array of chunk IDs in order of relevance (most relevant first). Select the top {topK} most relevant chunks. Do not include any explanation.

Example output: ["chunk-id-1", "chunk-id-2", "chunk-id-3"]`;
