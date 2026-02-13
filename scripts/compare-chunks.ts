/**
 * Comparison script: Old vs New chunking.
 * 
 * 1. Lists all books in Supabase
 * 2. Gets chunk stats for each book
 * 3. Runs 3 test queries against each book (filtered by book_id)
 * 4. Saves a comprehensive JSON report
 *
 * Usage: npx tsx scripts/compare-chunks.ts
 */

import * as fs from 'fs';
import * as pathMod from 'path';

// Load .env.local manually
const envPath = pathMod.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = 'http://localhost:3000';

const TEST_QUERIES = [
    'Explain how altitude affects climate',
    'What are the factors that influence weather patterns in East Africa?',
    'Define the term atmosphere and describe its layers',
];

interface BookInfo {
    id: string;
    title: string;
    subject: string;
    form: number;
    created_at: string;
}

interface ChunkStats {
    total_chunks: number;
    avg_tokens: number;
    has_context_prefix: boolean;
    sample_content: string;
}

interface QueryResult {
    query: string;
    answer: string;
    citations: Array<{ chunkId: string; content: string; similarity: number }>;
    confidence: string;
    elapsed_ms: number;
}

async function supabaseQuery(): Promise<unknown> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    return res.json();
}

async function getBooks(): Promise<BookInfo[]> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/books?select=id,title,subject,form,created_at&order=created_at.asc`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
    });
    return res.json();
}

async function getChunkStats(bookId: string): Promise<ChunkStats> {
    // Get total chunks and avg tokens
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chunks?book_id=eq.${bookId}&select=id,tokens_estimate,content&limit=500`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
            },
        }
    );
    const chunks: Array<{ id: string; tokens_estimate: number; content: string }> = await res.json();

    const totalChunks = chunks.length;
    const avgTokens = totalChunks > 0
        ? Math.round(chunks.reduce((s, c) => s + c.tokens_estimate, 0) / totalChunks)
        : 0;

    // Check if any chunk has the context prefix
    const hasContextPrefix = chunks.some((c) =>
        c.content.startsWith('[Chapter:') || c.content.startsWith('[Topic:')
    );

    // Pick a sample chunk
    const sampleContent = chunks.length > 0 ? chunks[0].content.slice(0, 300) : '';

    return { total_chunks: totalChunks, avg_tokens: avgTokens, has_context_prefix: hasContextPrefix, sample_content: sampleContent };
}

async function askQuestion(query: string, bookId: string): Promise<QueryResult> {
    const start = Date.now();
    const res = await fetch(`${APP_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: query,
            filters: { book_id: bookId },
            mode: 'rag',
        }),
    });

    const elapsed_ms = Date.now() - start;
    const data = await res.json();

    return {
        query,
        answer: data.answer || data.error || 'No answer',
        citations: data.citations || [],
        confidence: data.confidence || 'unknown',
        elapsed_ms,
    };
}

async function main() {
    console.log('=== Chunking Comparison: Old vs New ===\n');

    // 1. Get all books
    const books = await getBooks();
    console.log(`Found ${books.length} book(s):\n`);
    for (const b of books) {
        console.log(`  [${b.id.slice(0, 8)}] ${b.title} (Form ${b.form}, ${b.subject}) — created ${b.created_at}`);
    }

    if (books.length < 2) {
        console.log('\n⚠  Need at least 2 books (old + new chunks) to compare.');
        console.log('   Please re-ingest the textbook first to create a new book record.');

        // If only 1 book, still run stats and queries on it
        if (books.length === 1) {
            console.log('\n--- Running analysis on single book ---\n');
            const book = books[0];
            const stats = await getChunkStats(book.id);
            console.log(`Chunks: ${stats.total_chunks}, Avg tokens: ${stats.avg_tokens}, Context prefix: ${stats.has_context_prefix}`);
            console.log(`Sample:\n  ${stats.sample_content}\n`);

            for (const q of TEST_QUERIES) {
                console.log(`\n>>> Query: "${q}"`);
                const result = await askQuestion(q, book.id);
                console.log(`  Confidence: ${result.confidence}`);
                console.log(`  Citations: ${result.citations.length}`);
                console.log(`  Time: ${result.elapsed_ms}ms`);
                console.log(`  Answer (first 300 chars): ${result.answer.slice(0, 300)}...`);
            }
        }
        return;
    }

    // Assume oldest = old chunks, newest = new chunks
    const oldBook = books[0];
    const newBook = books[books.length - 1];

    console.log(`\nOld book: [${oldBook.id.slice(0, 8)}] "${oldBook.title}" — ${oldBook.created_at}`);
    console.log(`New book: [${newBook.id.slice(0, 8)}] "${newBook.title}" — ${newBook.created_at}`);

    // 2. Stats
    console.log('\n--- Chunk Statistics ---\n');
    const oldStats = await getChunkStats(oldBook.id);
    const newStats = await getChunkStats(newBook.id);

    console.log('| Metric              | Old Chunks | New Chunks |');
    console.log('|---------------------|------------|------------|');
    console.log(`| Total chunks        | ${String(oldStats.total_chunks).padStart(10)} | ${String(newStats.total_chunks).padStart(10)} |`);
    console.log(`| Avg tokens/chunk    | ${String(oldStats.avg_tokens).padStart(10)} | ${String(newStats.avg_tokens).padStart(10)} |`);
    console.log(`| Context prefix      | ${String(oldStats.has_context_prefix).padStart(10)} | ${String(newStats.has_context_prefix).padStart(10)} |`);

    console.log('\n--- Sample (Old) ---');
    console.log(oldStats.sample_content.slice(0, 200));
    console.log('\n--- Sample (New) ---');
    console.log(newStats.sample_content.slice(0, 200));

    // 3. Run queries
    const report: {
        timestamp: string;
        old_book: { id: string, title: string, stats: ChunkStats };
        new_book: { id: string, title: string, stats: ChunkStats };
        comparisons: any[];
    } = {
        timestamp: new Date().toISOString(),
        old_book: { id: oldBook.id, title: oldBook.title, stats: oldStats },
        new_book: { id: newBook.id, title: newBook.title, stats: newStats },
        comparisons: [],
    };

    for (const q of TEST_QUERIES) {
        console.log(`\n\n========================================`);
        console.log(`Query: "${q}"`);
        console.log(`========================================\n`);

        const [oldResult, newResult] = await Promise.all([
            askQuestion(q, oldBook.id),
            askQuestion(q, newBook.id),
        ]);

        console.log('--- OLD CHUNKS ---');
        console.log(`  Confidence: ${oldResult.confidence}`);
        console.log(`  Citations:  ${oldResult.citations.length}`);
        console.log(`  Time:       ${oldResult.elapsed_ms}ms`);
        console.log(`  Answer:\n${oldResult.answer.slice(0, 500)}\n`);

        console.log('--- NEW CHUNKS ---');
        console.log(`  Confidence: ${newResult.confidence}`);
        console.log(`  Citations:  ${newResult.citations.length}`);
        console.log(`  Time:       ${newResult.elapsed_ms}ms`);
        console.log(`  Answer:\n${newResult.answer.slice(0, 500)}\n`);

        report.comparisons.push({
            query: q,
            old: {
                confidence: oldResult.confidence,
                citations_count: oldResult.citations.length,
                elapsed_ms: oldResult.elapsed_ms,
                answer: oldResult.answer,
                citation_details: oldResult.citations,
            },
            new: {
                confidence: newResult.confidence,
                citations_count: newResult.citations.length,
                elapsed_ms: newResult.elapsed_ms,
                answer: newResult.answer,
                citation_details: newResult.citations,
            },
        });
    }

    // Save report
    const fs = await import('fs');
    const reportPath = 'scripts/comparison-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report saved to ${reportPath}`);
}

main().catch(console.error);
