import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('api-admin-eval-analyze');

export async function POST(request: NextRequest) {
    try {
        const { results, question } = await request.json().catch(() => ({}));

        if (!results || !question) {
            return NextResponse.json({ error: 'Comparison results and question are required' }, { status: 400 });
        }

        const env = getEnv();

        // 1. Construct the comparison analysis prompt
        const comparisonSummary = `
Question: ${question}

--- STANDARD RAG ---
Answer: ${results.rag?.answer || 'N/A'}
Confidence: ${results.rag?.confidence || 'N/A'}
Citations: ${results.rag?.citations?.length || 0}

--- CAG (FULL CONTEXT) ---
Answer: ${results.cag?.answer || 'N/A'}
Confidence: ${results.cag?.confidence || 'N/A'}
Citations: ${results.cag?.citations?.length || 0}

--- GRAPHRAG (ENTITIES + HYBRID) ---
Answer: ${results.graph?.answer || 'N/A'}
Confidence: ${results.graph?.confidence || 'N/A'}
Citations: ${results.graph?.citations?.length || 0}
`;

        const prompt = `You are an AI RAG Specialist. You are comparing three different retrieval strategies for a Tanzanian educational platform.
Analyze the following answers provided by different RAG modes for the SAME question and provide a professional comparison report.

COMPARISON DATA:
${comparisonSummary}

REPORT STRUCTURE:
1. **Comparative Analysis**: Compare the accuracy, depth, and tone of each mode. Which one followed the NECTA curriculum requirements best?
2. **Retrieval Efficacy**: Evaluate which mode provided the most relevant/comprehensive answer. (Standard vs Full Context vs Graph).
3. **Citation Quality**: Comment on the transparency and source attribution of each mode.
4. **Winner for this Query**: Declare which mode "won" for this specific question and why.
5. **Technical Insights**: Provide 2-3 specific insights on why one mode outperformed the others (e.g., "Standard RAG missed context X which CAG caught", or "GraphRAG successfully linked entity Y").
6. **Recommendations**: Suggest one improvement for the overall pipeline based on these results.

Format the output in clean Markdown. Use headings, tables for comparison if helpful, and bold text for key points.`;

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
