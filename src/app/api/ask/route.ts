import { NextRequest, NextResponse } from 'next/server';
import { answerNECTAQuestion } from '@/lib/genkit/flows';
import { answerWithFullContext } from '@/lib/genkit/cag-flow';
import { answerWithGraph } from '@/lib/genkit/graph-flow';
import { z } from 'zod';

const askSchema = z.object({
    question: z.string().min(1),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional(),
    filters: z
        .object({
            book_id: z.string().uuid().optional(),
            subject: z.string().optional(),
            form: z.number().int().min(1).max(6).optional(),
            chapter: z.string().optional(),
            topic: z.string().optional(),
        })
        .optional(),
    topK: z.number().int().min(1).max(50).optional(),
    mode: z.enum(['rag', 'cag', 'graph']).optional().default('rag'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = askSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { mode, ...requestData } = parsed.data;
        let result;

        if (mode === 'cag') {
            result = await answerWithFullContext(requestData);
        } else if (mode === 'graph') {
            result = await answerWithGraph(requestData);
        } else {
            result = await answerNECTAQuestion(requestData);
        }

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
