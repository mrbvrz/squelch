import { describe, expect, it } from 'vitest';
import {
    formatTrayTooltip,
    formatTrayMenuSubtitle,
    normalizeVolume
} from '../../src/utils/tray-format';

describe('Tray Volume and Tooltip Utilities', () => {
    describe('normalizeVolume', () => {
        it('clamps values below 0 to 0', () => {
            expect(normalizeVolume(-0.5)).toBe(0);
            expect(normalizeVolume(-100)).toBe(0);
        });

        it('clamps values above 100% to 1.0', () => {
            expect(normalizeVolume(150)).toBe(1);
            expect(normalizeVolume(200)).toBe(1);
        });

        it('normalizes percentage inputs (0-100) to decimal (0-1.0)', () => {
            expect(normalizeVolume(75)).toBe(0.75);
            expect(normalizeVolume(50)).toBe(0.5);
            expect(normalizeVolume(100)).toBe(1.0);
        });

        it('handles decimal inputs gracefully', () => {
            expect(normalizeVolume(0.85)).toBe(0.85);
            expect(normalizeVolume(0.0)).toBe(0);
            expect(normalizeVolume(1.0)).toBe(1);
        });

        it('falls back to 1.0 on invalid numbers or NaN', () => {
            expect(normalizeVolume(NaN)).toBe(1.0);
            expect(normalizeVolume(undefined as unknown as number)).toBe(1.0);
        });
    });

    describe('formatTrayTooltip', () => {
        it('returns idle tooltip when not playing', () => {
            expect(formatTrayTooltip('idle')).toBe(
                'Squelch - Menu Bar Internet Radio'
            );
            expect(formatTrayTooltip('error')).toBe(
                'Squelch - Menu Bar Internet Radio'
            );
        });

        it('formats playing status with station name and stream title', () => {
            const tooltip = formatTrayTooltip(
                'playing',
                'BBC Radio 1',
                'Dua Lipa - Houdini'
            );
            expect(tooltip).toBe('▶ Squelch: BBC Radio 1 — Dua Lipa - Houdini');
        });

        it('formats playing status with station name only if stream title is absent', () => {
            const tooltip = formatTrayTooltip('playing', 'Prambors FM', null);
            expect(tooltip).toBe('▶ Squelch: Prambors FM');
        });

        it('formats connecting / buffering status', () => {
            expect(formatTrayTooltip('buffering', 'Hard Rock FM')).toBe(
                '⏳ Squelch: Menyambung ke Hard Rock FM...'
            );
            expect(formatTrayTooltip('connecting', 'Delta FM')).toBe(
                '⏳ Squelch: Menyambung ke Delta FM...'
            );
        });

        it('formats paused status', () => {
            expect(formatTrayTooltip('paused', 'Trax FM')).toBe(
                '⏸ Squelch: Trax FM (Dijeda)'
            );
        });
    });

    describe('formatTrayMenuSubtitle', () => {
        it('returns default subtitle when idle', () => {
            expect(formatTrayMenuSubtitle('idle')).toBe('Squelch Radio (Siap)');
        });

        it('formats playing status correctly', () => {
            expect(
                formatTrayMenuSubtitle('playing', 'Gen FM', 'Sheila On 7 - Dan')
            ).toBe('▶ Gen FM — Sheila On 7 - Dan');
        });

        it('truncates long titles to fit menu bar constraints', () => {
            const longTitle =
                'A Very Long Station Name With Many Words — An Extremely Long Track Title Featuring Many Collaborating Artists';
            const formatted = formatTrayMenuSubtitle(
                'playing',
                'Super Radio',
                longTitle,
                35
            );
            expect(formatted.length).toBeLessThanOrEqual(35);
            expect(formatted.endsWith('…')).toBe(true);
        });
    });
});
