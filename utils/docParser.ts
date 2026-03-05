// docParser.ts — Parse markdown documents into structured sections
// Used by DocViewer to render FAQ (accordion) and legal docs (text)

export interface DocSection {
    title: string;
    content: string;
    level: number;
}

/**
 * Parse a markdown string into an array of sections.
 * Each ## or ### heading becomes a section with its subsequent content.
 */
export function parseMarkdownSections(raw: string): DocSection[] {
    const lines = raw.split('\n');
    const sections: DocSection[] = [];
    let currentTitle = '';
    let currentContent = '';
    let currentLevel = 0;

    for (const line of lines) {
        const h3 = line.match(/^### (.+)/);
        const h2 = line.match(/^## (.+)/);

        if (h3 || h2) {
            if (currentTitle) {
                sections.push({
                    title: currentTitle,
                    content: currentContent.trim(),
                    level: currentLevel,
                });
            }
            currentTitle = (h3 || h2)![1]
                .replace(/^\d+\.\s*/, '')  // Remove leading numbers
                .replace(/^[🔐🏠📅🎓👥👤💼🖼️📰🛠️🔔💬🆘⚙️❓📘]\s*/u, ''); // Remove leading emoji
            currentContent = '';
            currentLevel = h3 ? 3 : 2;
        } else if (currentTitle) {
            // Clean markdown formatting for display
            const cleaned = line
                .replace(/^\*\*(.+)\*\*$/, '$1')  // bold-only lines
                .replace(/\*\*(.+?)\*\*/g, '$1')  // inline bold
                .replace(/^[-*]\s+/, '• ')         // bullets → •
                .replace(/^\|.+\|$/, '')           // table rows (skip)
                .replace(/^[-|:]+$/, '')           // table separators (skip)
                .replace(/^---+$/, '')             // horizontal rules (skip)
                .replace(/^>\s*/, '');              // blockquotes
            if (cleaned.trim()) currentContent += cleaned + '\n';
        }
    }

    // Push last section
    if (currentTitle) {
        sections.push({
            title: currentTitle,
            content: currentContent.trim(),
            level: currentLevel,
        });
    }

    return sections.filter(s => s.content.length > 0);
}

/**
 * Filter sections by a search query (case-insensitive).
 */
export function filterSections(sections: DocSection[], query: string): DocSection[] {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
    );
}
