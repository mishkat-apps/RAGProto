import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly for scripts
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Also load .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
