/**
 * Prompt template for classifying question types.
 */
export const CLASSIFY_PROMPT = `You are an intent classifier for NECTA Study Assistant. Categorize the user's input into exactly ONE of the following types:

- academic_query: The user is asking a specific academic or subject-related question (e.g., "What is a plateau?", "Explain photosynthesis").
- follow_up: The user is asking to do something with the previous answer (e.g., "Translate above into Swahili", "Summarize that", "Give me more info").
- greeting: The user is saying hi, hello, or other general pleasantries.
- conversational: The user is making small talk or asking general questions not necessarily requiring textbook context (e.g., "How are you?", "Who are you?").
- other: Anything else that doesn't fit.

Input: "{question}"

Respond with ONLY the type (one of the bullet points above, lowercase).`;
