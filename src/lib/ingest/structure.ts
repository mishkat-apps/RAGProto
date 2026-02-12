import { SectionInsert } from '@/lib/supabase/types';
import { getPageNumber } from './normalize';

export interface ExtractedSection {
    level: number;
    title: string;
    content: string;
    pageStart: number;
    pageEnd: number;
    children: ExtractedSection[];
}

interface HeadingMatch {
    level: number;
    title: string;
    position: number;
}

/**
 * Extract hierarchical structure (chapters, topics, subtopics) from markdown.
 */
export function extractStructure(
    markdown: string,
    pageMap: Map<number, number>
): ExtractedSection[] {
    const headings = extractHeadings(markdown);
    if (headings.length === 0) {
        // No headings found - treat entire doc as one section
        return [
            {
                level: 1,
                title: 'Full Document',
                content: markdown,
                pageStart: 1,
                pageEnd: Math.max(...Array.from(pageMap.values()), 1),
                children: [],
            },
        ];
    }

    const sections: ExtractedSection[] = [];
    for (let i = 0; i < headings.length; i++) {
        const current = headings[i];
        const next = headings[i + 1];
        const contentStart = current.position + getHeadingLineLength(markdown, current.position);
        const contentEnd = next ? next.position : markdown.length;
        const content = markdown.slice(contentStart, contentEnd).trim();

        const pageStart = getPageNumber(current.position, pageMap);
        const pageEnd = getPageNumber(contentEnd - 1, pageMap);

        sections.push({
            level: Math.min(current.level, 3), // Cap at subtopic
            title: current.title,
            content,
            pageStart,
            pageEnd,
            children: [],
        });
    }

    // Build hierarchy (flat → nested)
    return buildHierarchy(sections);
}

function extractHeadings(markdown: string): HeadingMatch[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: HeadingMatch[] = [];
    let match: RegExpExecArray | null;

    while ((match = headingRegex.exec(markdown)) !== null) {
        headings.push({
            level: match[1].length,
            title: match[2].trim(),
            position: match.index,
        });
    }

    return headings;
}

function getHeadingLineLength(markdown: string, position: number): number {
    const newlineIdx = markdown.indexOf('\n', position);
    return newlineIdx === -1 ? markdown.length - position : newlineIdx - position + 1;
}

function buildHierarchy(flat: ExtractedSection[]): ExtractedSection[] {
    const root: ExtractedSection[] = [];
    const stack: ExtractedSection[] = [];

    for (const section of flat) {
        // Pop stack until we find a parent with lower level
        while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
            stack.pop();
        }

        if (stack.length === 0) {
            root.push(section);
        } else {
            stack[stack.length - 1].children.push(section);
        }

        stack.push(section);
    }

    return root;
}

/**
 * Flatten ExtractedSections into SectionInsert rows for database insertion.
 */
export function flattenSectionsForDb(
    sections: ExtractedSection[],
    bookId: string,
    parentId: string | null = null
): SectionInsert[] {
    const result: SectionInsert[] = [];

    for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const id = crypto.randomUUID();
        result.push({
            id,
            book_id: bookId,
            level: s.level,
            title: s.title,
            parent_id: parentId,
            order_index: i,
            page_start: s.pageStart,
            page_end: s.pageEnd,
        } as unknown as SectionInsert);

        if (s.children.length > 0) {
            result.push(...flattenSectionsForDb(s.children, bookId, id));
        }
    }

    return result;
}
