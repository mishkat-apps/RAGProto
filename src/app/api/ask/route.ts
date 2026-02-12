import { NextRequest, NextResponse } from 'next/server';
import { answerNECTAQuestion } from '@/lib/genkit/flows';
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

        const result = await answerNECTAQuestion(parsed.data);

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
