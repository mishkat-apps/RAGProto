import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('api-admin-eval-analyze');

export async function POST(request: NextRequest) {
    try {
        const { results } = await request.json().catch(() => ({}));

        if (!results || !Array.isArray(results) || results.length === 0) {
            return NextResponse.json({ error: 'Results are required' }, { status: 400 });
        }

        const env = getEnv();

        // 1. Construct the analysis prompt
        const resultsSummary = results.map((r, i) => `
Question ${i + 1}: ${r.question}
Answer: ${r.answer}
Confidence: ${r.confidence}
Citations count: ${r.citations?.length || 0}
`).join('\n---\n');

        const prompt = `You are an AI Quality Assurance expert. You will analyze the following RAG (Retrieval-Augmented Generation) evaluation results and provide a comprehensive, professional report.

EVALUATION DATA:
${resultsSummary}

REPORT STRUCTURE:
1. **Performance Overview**: A summary of overall performance. Calculate approximate success rate (High Confidence vs Others).
2. **Confidence Analysis**: Discuss the distribution of confidence levels.
3. **Citation & Source Evaluation**: Evaluate the usage of citations. Are there enough citations? Are they consistent?
4. **Key Strengths**: What did the system do well?
5. **Identified Weaknesses & Issues**: Point out specific questions where the system struggled or provided unsatisfactory answers.
6. **Actionable Recommendations**: Give 3-5 specific technical recommendations to improve the RAG pipeline (e.g., chunk size, embedding model, reranking, system prompt).

Format the output in clean Markdown. Use headings, bullet points, and bold text for readability.`;

        // 2. Call Gemini API
        const { getVertexAccessToken } = await import('@/lib/vertex/auth');
        let accessToken: string;
        try {
            accessToken = await getVertexAccessToken();
        } catch (authErr) {
            log.error({ error: authErr instanceof Error ? authErr.message : String(authErr) }, 'Vertex Auth failed');
            return NextResponse.json({ error: 'Authentication failed: Please check server configuration.' }, { status: 500 });
        }

        const endpoint = `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.VERTEX_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2, // Low temperature for factual analysis
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            log.error({ status: res.status, body: errBody }, 'Gemini analysis failed');
            return NextResponse.json({ error: `AI Analysis failed (${res.status}): ${errBody.slice(0, 100)}...` }, { status: 500 });
        }

        const data = await res.json();
        const report = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!report) {
            return NextResponse.json({ error: 'AI returned an empty analysis' }, { status: 500 });
        }

        return NextResponse.json({ report });
    } catch (err) {
        log.error({ error: err instanceof Error ? err.message : String(err) }, 'Analyze results API failed');
        return NextResponse.json({ error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown'}` }, { status: 500 });
    }
}
