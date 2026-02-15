import { NextResponse } from 'next/server';
import { answerNECTAQuestion } from '@/lib/genkit/flows';
import { answerWithFullContext } from '@/lib/genkit/cag-flow';
import { answerWithGraph } from '@/lib/genkit/graph-flow';
import type { AskRequest } from '@/lib/supabase/types';

export const maxDuration = 300; // 5 minutes limit for complex evaluations

export async function POST(req: Request) {
    try {
        const { bookId, question } = await req.json();

        if (!bookId || !question) {
            return NextResponse.json({ error: 'Missing bookId or question' }, { status: 400 });
        }

        const request: AskRequest = {
            question,
            filters: { book_id: bookId },
            history: [],
        };

        // Run all three modes in parallel
        const [ragResult, cagResult, graphResult] = await Promise.all([
            answerNECTAQuestion(request).catch(err => ({ error: err.message, answer: 'Error in Standard RAG' })),
            answerWithFullContext(request).catch(err => ({ error: err.message, answer: 'Error in CAG' })),
            answerWithGraph(request).catch(err => ({ error: err.message, answer: 'Error in GraphRAG' })),
        ]);

        return NextResponse.json({
            question,
            results: {
                rag: ragResult,
                cag: cagResult,
                graph: graphResult,
            }
        });

    } catch (error: any) {
        console.error('Eval Run Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
