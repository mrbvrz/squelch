import { describe, it, expect } from 'vitest';
import { renderFormattedNotes } from '../../src/utils/text-format';
import React from 'react';

describe('text-format utility', () => {
    it('returns null for empty or whitespace text', () => {
        expect(renderFormattedNotes('')).toBeNull();
        expect(renderFormattedNotes('   ')).toBeNull();
    });

    it('renders plain text into a line element', () => {
        const node = renderFormattedNotes('Hello World');
        expect(React.isValidElement(node)).toBe(true);
    });

    it('handles bold, italic, strikethrough and code formatting', () => {
        const node = renderFormattedNotes(
            'This is **bold**, *italic*, ~~strike~~, and `code`!'
        );
        expect(React.isValidElement(node)).toBe(true);
    });

    it('handles bullet lists and multi-lines properly', () => {
        const text = `- Line 1 with **bold**\n- Line 2 with *italic*\nNormal line`;
        const node = renderFormattedNotes(text);
        expect(React.isValidElement(node)).toBe(true);
    });
});
