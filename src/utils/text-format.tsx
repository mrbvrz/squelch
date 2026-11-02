import React from 'react';

/**
 * Safely parses inline markdown-like formatting (**bold**, *italic*, ~~strike~~, `code`)
 * into React DOM elements without using dangerouslySetInnerHTML.
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
    if (!text) return [];

    // Match bold (**text**), italic (*text* or _text_), strikethrough (~~text~~), inline code (`text`)
    const regex = /(\*\*[\s\S]*?\*\*|\*[^\s*][\s\S]*?\*|~~[\s\S]*?~~|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (!part) return null;

        // Bold: **text**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const inner = part.slice(2, -2);
            return (
                <strong key={index} className="font-bold text-foreground">
                    {parseInlineFormatting(inner)}
                </strong>
            );
        }

        // Strikethrough: ~~text~~
        if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
            const inner = part.slice(2, -2);
            return (
                <del key={index} className="line-through opacity-70">
                    {parseInlineFormatting(inner)}
                </del>
            );
        }

        // Italic: *text*
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            const inner = part.slice(1, -1);
            return (
                <em key={index} className="italic">
                    {parseInlineFormatting(inner)}
                </em>
            );
        }

        // Inline Code: `code`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            const inner = part.slice(1, -1);
            return (
                <code
                    key={index}
                    className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/15 font-mono text-[10px] text-accent"
                >
                    {inner}
                </code>
            );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}

/**
 * Renders multi-line formatted notes with support for bullet points, bold, italic,
 * strikethrough, and inline code.
 */
export function renderFormattedNotes(text: string): React.ReactNode {
    if (!text || !text.trim()) return null;

    const lines = text.split('\n');

    return (
        <div className="space-y-1 leading-relaxed">
            {lines.map((line, lineIdx) => {
                const trimmed = line.trim();
                const isBullet =
                    trimmed.startsWith('- ') ||
                    trimmed.startsWith('• ') ||
                    trimmed.startsWith('* ');
                const content = isBullet
                    ? trimmed.replace(/^[-*•]\s+/, '')
                    : line;

                if (!content && !isBullet) {
                    return <div key={lineIdx} className="h-1.5" />;
                }

                return (
                    <div
                        key={lineIdx}
                        className={
                            isBullet ? 'flex items-start gap-1.5 ml-1' : ''
                        }
                    >
                        {isBullet && (
                            <span className="text-accent shrink-0 select-none font-bold">
                                •
                            </span>
                        )}
                        <span className="break-words">
                            {parseInlineFormatting(content)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Converts inline markdown-like text to safe HTML for rich-text inline editing.
 */
export function markdownToHtml(md: string): string {
    if (!md) return '';
    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Strikethrough ~~text~~
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Italic *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code `code`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // Bullet lines and paragraphs
    const lines = html.split('\n');
    const processedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (
            trimmed.startsWith('• ') ||
            trimmed.startsWith('- ') ||
            trimmed.startsWith('* ')
        ) {
            const content = trimmed.replace(/^[-*•]\s+/, '');
            return `<li>${content}</li>`;
        }
        return line ? `<div>${line}</div>` : '<div><br></div>';
    });

    let result = processedLines.join('');
    result = result.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    return result;
}

/**
 * Converts rich-text contentEditable HTML back into clean markdown.
 */
export function htmlToMarkdown(html: string): string {
    if (!html) return '';
    if (typeof document === 'undefined') return html;

    const div = document.createElement('div');
    div.innerHTML = html;

    function walk(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        let inner = '';
        for (const child of Array.from(el.childNodes)) {
            inner += walk(child);
        }

        switch (tag) {
            case 'strong':
            case 'b':
                return inner.trim() ? `**${inner}**` : '';
            case 'em':
            case 'i':
                return inner.trim() ? `*${inner}*` : '';
            case 'del':
            case 's':
            case 'strike':
                return inner.trim() ? `~~${inner}~~` : '';
            case 'code':
                return inner.trim() ? `\`${inner}\`` : '';
            case 'li':
                return `• ${inner.trim()}\n`;
            case 'ul':
            case 'ol':
                return inner;
            case 'br':
                return '\n';
            case 'p':
            case 'div':
                return inner ? `${inner}\n` : '\n';
            default:
                return inner;
        }
    }

    const md = walk(div);
    return md.replace(/\n{3,}/g, '\n\n').trim();
}
