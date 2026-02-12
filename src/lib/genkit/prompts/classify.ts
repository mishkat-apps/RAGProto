/**
 * Prompt template for classifying question types.
 */
export const CLASSIFY_PROMPT = `You are a question classifier for NECTA textbook questions. Classify the following question into ONE of these types:

- definition: The question asks for the meaning or definition of a term
- explanation: The question asks to explain a concept or process
- essay: The question requires a long-form answer (describe, discuss, analyze)
- compare: The question asks to compare, contrast, or differentiate
- other: The question doesn't fit the above categories

Question: "{question}"

Respond with ONLY the type (one word, lowercase).`;
