/**
 * Normalize LlamaParse markdown output.
 * Removes noise, fixes formatting, preserves structure.
 */
export function normalizeMarkdown(raw: string): string {
    let md = raw;

    // Remove "FOR ONLINE USE ONLY" watermarks (case-insensitive)
    md = md.replace(/FOR\s+ONLINE\s+USE\s+ONLY/gi, '');

    // Remove repeated title pages / cover page noise
    md = md.replace(/^\s*(#{1,3})\s*\1\s*$/gm, '');

    // Fix hyphenation across lines (e.g., "geo-\ngraphy" → "geography")
    md = md.replace(/(\w+)-\n(\w+)/g, '$1$2');

    // Collapse multiple blank lines to max 2
    md = md.replace(/\n{4,}/g, '\n\n\n');

    // Remove stray page numbers like "123" alone on a line
    md = md.replace(/^\s*\d{1,4}\s*$/gm, '');

    // Trim trailing whitespace from lines
    md = md.replace(/[ \t]+$/gm, '');

    // Normalize heading whitespace
    md = md.replace(/^(#{1,6})\s{2,}/gm, '$1 ');

    // Remove zero-width characters
    md = md.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

    return md.trim();
}

/**
 * Extract page numbers from the page separator convention.
 * LlamaParse inserts "---PAGE_BREAK---" between pages.
 * Returns a map of content position → page number.
 */
export function buildPageMap(markdown: string): Map<number, number> {
    const pageMap = new Map<number, number>();
    const separator = '---PAGE_BREAK---';
    const parts = markdown.split(separator);

    let offset = 0;
    for (let i = 0; i < parts.length; i++) {
        pageMap.set(offset, i + 1);
        offset += parts[i].length + separator.length;
    }

    return pageMap;
}

/**
 * Given a character position in the full markdown, find the page number.
 */
export function getPageNumber(position: number, pageMap: Map<number, number>): number {
    let page = 1;
    for (const [offset, pageNum] of pageMap.entries()) {
        if (offset <= position) {
            page = pageNum;
        } else {
            break;
        }
    }
    return page;
}

/**
 * Remove page break separators from normalized markdown.
 */
export function removePageBreaks(markdown: string): string {
    return markdown.replace(/---PAGE_BREAK---/g, '');
}
