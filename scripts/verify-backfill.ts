import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// --- Load Environment ---
const env: Record<string, string> = {};
try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
        const envLocal = fs.readFileSync(envLocalPath, 'utf8');
        envLocal.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                env[key.trim()] = value;
            }
        });
    }
} catch (err) { }

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    const { count: entityCount, error: err1 } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true });

    const { count: relCount, error: err2 } = await supabase
        .from('chunk_entities')
        .select('*', { count: 'exact', head: true });

    if (err1 || err2) {
        console.error('Error checking counts:', err1 || err2);
    } else {
        console.log(`Entities: ${entityCount}`);
        console.log(`Relationships: ${relCount}`);
    }
}

check();
