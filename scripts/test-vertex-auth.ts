import './env-init';
import { getEnv } from '../src/lib/env';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

async function testAuth() {
    console.log('--- Vertex AI Auth Diagnostic ---');
    const env = getEnv();

    console.log('Environment Variables Detected:');
    console.log('- VERTEX_PROJECT_ID:', env.VERTEX_PROJECT_ID);
    console.log('- VERTEX_LOCATION:', env.VERTEX_LOCATION);
    console.log('- GOOGLE_SERVICE_ACCOUNT:', env.GOOGLE_SERVICE_ACCOUNT ? 'FOUND (Length: ' + env.GOOGLE_SERVICE_ACCOUNT.length + ')' : 'MISSING');
    console.log('- GOOGLE_APPLICATION_CREDENTIALS:', env.GOOGLE_APPLICATION_CREDENTIALS || 'MISSING');

    if (env.GOOGLE_SERVICE_ACCOUNT) {
        console.log('\nTesting GOOGLE_SERVICE_ACCOUNT JSON:');
        try {
            const creds = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT);
            console.log('✅ Valid JSON');
            console.log('  - Type:', creds.type);
            console.log('  - Project ID:', creds.project_id);
            console.log('  - Client Email:', creds.client_email);

            const auth = new GoogleAuth({
                credentials: creds,
                scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            });
            const client = await auth.getClient();
            const token = await client.getAccessToken();
            console.log('✅ Successfully retrieved access token using JSON string.');
        } catch (err) {
            console.error('❌ Failed to use GOOGLE_SERVICE_ACCOUNT:', err);
        }
    }

    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('\nTesting GOOGLE_APPLICATION_CREDENTIALS Path:');
        const path = env.GOOGLE_APPLICATION_CREDENTIALS;
        if (fs.existsSync(path)) {
            console.log('✅ File exists at', path);
            try {
                const auth = new GoogleAuth({
                    keyFilename: path,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
                });
                const client = await auth.getClient();
                const token = await client.getAccessToken();
                console.log('✅ Successfully retrieved access token using key file.');
            } catch (err) {
                console.error('❌ Failed to use Key File:', err);
            }
        } else {
            console.error('❌ File NOT found at', path);
        }
    }

    console.log('\n--- Diagnostic Complete ---');
}

testAuth();
