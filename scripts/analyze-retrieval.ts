// Analysis script — outputs JSON for reliable reading
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const result: Record<string, any> = {};

    // 1. Text search for altitude
    const { data: textMatches } = await supabase
        .from('chunks')
        .select('id, book_id, section_id, chunk_type, page_start, page_end, tokens_estimate, content')
        .textSearch('content', 'altitude')
        .order('page_start', { ascending: true })
        .limit(30);

    result.textSearch = {
        count: textMatches?.length || 0,
        chunks: (textMatches || []).map(c => ({
            type: c.chunk_type,
            pages: `${c.page_start}-${c.page_end}`,
            tokens: c.tokens_estimate,
            preview: c.content.slice(0, 120).replace(/\n/g, ' ')
        }))
    };

    // 2. DB stats
    const { count: totalCount } = await supabase.from('chunks').select('*', { count: 'exact', head: true });
    const { data: allChunks } = await supabase
        .from('chunks')
        .select('tokens_estimate, chunk_type')
        .not('embedding', 'is', null);

    if (allChunks) {
        const avg = allChunks.reduce((s, c) => s + c.tokens_estimate, 0) / allChunks.length;
        const types: Record<string, number> = {};
        for (const c of allChunks) types[c.chunk_type] = (types[c.chunk_type] || 0) + 1;

        result.dbStats = {
            totalChunks: totalCount,
            embeddedChunks: allChunks.length,
            avgTokens: Math.round(avg),
            minTokens: Math.min(...allChunks.map(c => c.tokens_estimate)),
            maxTokens: Math.max(...allChunks.map(c => c.tokens_estimate)),
            typeDistribution: types
        };
    }

    // 3. Sections
    const { data: sections } = await supabase
        .from('sections')
        .select('id, title, level, page_start, page_end, parent_id')
        .gte('page_start', 25)
        .lte('page_start', 36)
        .order('page_start', { ascending: true });

    result.sectionsNearTarget = (sections || []).map(s => ({
        level: s.level,
        title: s.title,
        pages: `${s.page_start}-${s.page_end}`
    }));

    // 4. Chunks near pages 28-34
    const { data: nearbyChunks } = await supabase
        .from('chunks')
        .select('id, section_id, chunk_type, page_start, page_end, tokens_estimate, content')
        .gte('page_start', 28)
        .lte('page_start', 34)
        .order('page_start', { ascending: true });

    result.chunksPages28to34 = {
        count: nearbyChunks?.length || 0,
        chunks: (nearbyChunks || []).map(c => ({
            type: c.chunk_type,
            pages: `${c.page_start}-${c.page_end}`,
            tokens: c.tokens_estimate,
            preview: c.content.slice(0, 120).replace(/\n/g, ' ')
        }))
    };

    // 5. Books
    const { data: books } = await supabase.from('books').select('id, title, subject, form');
    result.books = books;

    // 6. All sections for the book (to understand structure)
    if (books && books.length > 0) {
        const { data: allSections } = await supabase
            .from('sections')
            .select('id, title, level, page_start, page_end, parent_id')
            .eq('book_id', books[0].id)
            .order('page_start', { ascending: true });

        result.allSections = (allSections || []).map(s => ({
            level: s.level,
            title: s.title,
            pages: `${s.page_start}-${s.page_end}`
        }));
    }

    fs.writeFileSync('scripts/analysis.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Done');
}

main().catch(console.error);
