import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('api-admin-eval-generate');

export async function POST(request: NextRequest) {
    try {
        const { bookId } = await request.json();

        if (!bookId) {
            return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const env = getEnv();

        // 1. Fetch book metadata
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('storage_path_parsed_md, title')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        if (!book.storage_path_parsed_md) {
            return NextResponse.json({ error: 'No parsed markdown found for this book' }, { status: 400 });
        }

        // 2. Download markdown from Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .download(book.storage_path_parsed_md);

        if (downloadError || !fileData) {
            return NextResponse.json({ error: `Failed to download markdown: ${downloadError?.message}` }, { status: 500 });
        }

        const markdown = await fileData.text();

        // 3. Extract a random substantial snippet
        // We'll take a chunk of ~4000 characters from the middle-ish to avoid intros/outros
        const start = Math.floor(Math.random() * Math.max(0, markdown.length - 8000));
        const snippet = markdown.substring(start, start + 8000);

        // 4. Generate 3 questions using Gemini
        const prompt = `You are an educational content creator specializing in the Tanzanian NECTA curriculum.
Based on the following textbook snippet from "${book.title}", generate 3 diverse and high-quality test questions that a student might ask.

Snippet:
"""
${snippet}
"""

Requirements:
- Generate exactly 3 questions.
- Question 1: A direct fact-based question.
- Question 2: An explanatory "how" or "why" question.
- Question 3: A short answer conceptual question.
- Ensure the questions are based ONLY on the provided snippet.
- Return ONLY a JSON array of objects with a "question" field.

Example format:
[
  { "question": "What are the three main types of rocks?" },
  { "question": "Explain why sedimentary rocks often contain fossils." },
  { "question": "Define the term 'metamorphism' in the context of geology." }
]`;

        const { GoogleAuth } = await import('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            log.error({ status: res.status, body: errBody }, 'Gemini generation failed');
            return NextResponse.json({ error: 'Failed to generate questions with AI' }, { status: 500 });
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return NextResponse.json({ error: 'AI returned an empty response' }, { status: 500 });
        }

        const questions = JSON.parse(text);

        return NextResponse.json({ questions });
    } catch (err) {
        log.error({ error: err instanceof Error ? err.message : String(err) }, 'Generate test cases API failed');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
