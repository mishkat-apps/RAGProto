import { NextRequest, NextResponse } from 'next/server';
import { getVertexAccessToken } from '@/lib/vertex/auth';
import { getEnv } from '@/lib/env';

export async function GET(request: NextRequest) {
    try {
        const env = getEnv();
        const token = await getVertexAccessToken();

        return NextResponse.json({
            status: 'success',
            message: 'Successfully authenticated with Google Cloud Vertex AI',
            project_id: env.VERTEX_PROJECT_ID,
            location: env.VERTEX_LOCATION,
            token_prefix: token.slice(0, 5) + '...',
        });
    } catch (err) {
        return NextResponse.json({
            status: 'error',
            message: err instanceof Error ? err.message : 'Unknown authentication error',
        }, { status: 500 });
    }
}
