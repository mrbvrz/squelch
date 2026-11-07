import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    applyAppearanceVariables,
    CUKUP_THEMES,
    CUKUP_THEME_ACCENTS,
    ACCENT_SWATCHES
} from '../../src/utils/appearance';
import { enLocale } from '../../src/i18n/locales/en';
import { idLocale } from '../../src/i18n/locales/id';

describe('Appearance & Cukup Themes', () => {
    const originalDocument = globalThis.document;
    let attributes: Map<string, string>;
    let styles: Map<string, string>;

    beforeEach(() => {
        attributes = new Map();
        styles = new Map();

        const fakeElement = {
            setAttribute: (name: string, val: string) =>
                attributes.set(name, val),
            removeAttribute: (name: string) => attributes.delete(name),
            getAttribute: (name: string) => attributes.get(name) ?? null,
            style: {
                setProperty: (name: string, val: string) => styles.set(name, val),
                getPropertyValue: (name: string) => styles.get(name) ?? '',
                removeProperty: (name: string) => styles.delete(name)
            }
        };

        // @ts-expect-error Mock minimal document in Node environment
        globalThis.document = {
            documentElement: fakeElement
        };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    it('exports all 4 Cukup themes with authentic palettes', () => {
        expect(CUKUP_THEMES).toHaveLength(4);
        const ids = CUKUP_THEMES.map((t) => t.id);
        expect(ids).toEqual([
            'cukup-senja',
            'cukup-malam',
            'cukup-kopi',
            'cukup-terang'
        ]);

        const senja = CUKUP_THEMES.find((t) => t.id === 'cukup-senja');
        expect(senja?.accent).toBe('#E89058');
        expect(senja?.canvas).toBe('#181816');
        expect(senja?.panel).toBe('#131311');

        const malam = CUKUP_THEMES.find((t) => t.id === 'cukup-malam');
        expect(malam?.accent).toBe('#E6A854');
        expect(malam?.canvas).toBe('#131718');
        expect(malam?.panel).toBe('#0E1213');

        const kopi = CUKUP_THEMES.find((t) => t.id === 'cukup-kopi');
        expect(kopi?.accent).toBe('#E87D4B');
        expect(kopi?.canvas).toBe('#161413');
        expect(kopi?.panel).toBe('#11100E');

        const terang = CUKUP_THEMES.find((t) => t.id === 'cukup-terang');
        expect(terang?.accent).toBe('#D96B27');
        expect(terang?.canvas).toBe('#FAF8F5');
        expect(terang?.panel).toBe('#F2EFE9');
    });

    it('applies system theme without data-theme attribute', () => {
        applyAppearanceVariables({ theme: 'system' });
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe('#0A84FF');
    });

    it('applies light and dark themes with matching data-theme attribute', () => {
        applyAppearanceVariables({ theme: 'dark' });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

        applyAppearanceVariables({ theme: 'light' });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'light'
        );
    });

    it('applies Cukup theme variants and signature accents', () => {
        applyAppearanceVariables({ theme: 'cukup-senja' });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'cukup-senja'
        );
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe(CUKUP_THEME_ACCENTS['cukup-senja']);

        applyAppearanceVariables({ theme: 'cukup-malam' });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'cukup-malam'
        );
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe(CUKUP_THEME_ACCENTS['cukup-malam']);

        applyAppearanceVariables({ theme: 'cukup-kopi' });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'cukup-kopi'
        );
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe(CUKUP_THEME_ACCENTS['cukup-kopi']);

        applyAppearanceVariables({ theme: 'cukup-terang' });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'cukup-terang'
        );
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe(CUKUP_THEME_ACCENTS['cukup-terang']);
    });

    it('allows custom user accent color override on Cukup themes', () => {
        applyAppearanceVariables({
            theme: 'cukup-senja',
            accentColor: '#30D158'
        });
        expect(document.documentElement.getAttribute('data-theme')).toBe(
            'cukup-senja'
        );
        expect(
            document.documentElement.style.getPropertyValue('--accent-color')
        ).toBe('#30D158');
    });

    it('supports transparent glass alpha values and clamps correctly', () => {
        // 80% opacity
        applyAppearanceVariables({ glassOpacity: 80 });
        expect(
            document.documentElement.style.getPropertyValue('--glass-alpha')
        ).toBe('0.8');

        // 50% opacity
        applyAppearanceVariables({ glassOpacity: 50 });
        expect(
            document.documentElement.style.getPropertyValue('--glass-alpha')
        ).toBe('0.5');

        // Clamping min 20%
        applyAppearanceVariables({ glassOpacity: 10 });
        expect(
            document.documentElement.style.getPropertyValue('--glass-alpha')
        ).toBe('0.2');

        // Clamping max 100%
        applyAppearanceVariables({ glassOpacity: 120 });
        expect(
            document.documentElement.style.getPropertyValue('--glass-alpha')
        ).toBe('1');
    });

    it('includes Cukup accents in ACCENT_SWATCHES', () => {
        const hexes = ACCENT_SWATCHES.map((s) => s.hex);
        expect(hexes).toContain('#E89058'); // terracotta
        expect(hexes).toContain('#E6A854'); // amber
        expect(hexes).toContain('#E87D4B'); // persimmon
    });

    it('provides localized strings for all Cukup theme keys in English and Indonesian', () => {
        const themeKeys = [
            'prefThemeStandardGroup',
            'prefThemeCukupGroup',
            'prefThemeCukupDesc',
            'prefThemeCukupSenja',
            'prefThemeCukupSenjaDesc',
            'prefThemeCukupMalam',
            'prefThemeCukupMalamDesc',
            'prefThemeCukupKopi',
            'prefThemeCukupKopiDesc',
            'prefThemeCukupTerang',
            'prefThemeCukupTerangDesc'
        ] as const;

        for (const key of themeKeys) {
            expect(enLocale[key]).toBeDefined();
            expect(enLocale[key].length).toBeGreaterThan(0);
            expect(idLocale[key]).toBeDefined();
            expect(idLocale[key].length).toBeGreaterThan(0);
        }
    });
});
