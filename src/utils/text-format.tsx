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
