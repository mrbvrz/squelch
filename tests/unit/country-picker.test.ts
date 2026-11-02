import { describe, expect, it } from 'vitest';
import {
    countryCodeToFlag,
    getFriendlyCountryName,
    FALLBACK_COUNTRIES
} from '../../src/utils/appearance';

describe('Country Formatting & Search Utilities', () => {
    it('converts ISO country codes to emoji flags', () => {
        expect(countryCodeToFlag('ID')).toBe('🇮🇩');
        expect(countryCodeToFlag('US')).toBe('🇺🇸');
        expect(countryCodeToFlag('GB')).toBe('🇬🇧');
        expect(countryCodeToFlag('JP')).toBe('🇯🇵');
        expect(countryCodeToFlag('')).toBe('🌐');
        expect(countryCodeToFlag(null as unknown as string)).toBe('🌐');
    });

    it('returns friendly country names without raw official prefixes', () => {
        expect(getFriendlyCountryName('ID', 'Indonesia')).toBe('Indonesia');
        expect(
            getFriendlyCountryName('US', 'The United States Of America')
        ).toBe('United States');
        expect(
            getFriendlyCountryName('GB', 'The United Kingdom Of Great Britain')
        ).toBe('United Kingdom');
        expect(getFriendlyCountryName('KR', 'South Korea')).toBe('South Korea');
        expect(getFriendlyCountryName('RU', 'Russian Federation')).toBe(
            'Russia'
        );
    });

    it('filters country lists matching search queries by name and ISO code', () => {
        const countries = FALLBACK_COUNTRIES;

        // Search by name substring
        const indoMatches = countries.filter(
            (c) =>
                c.name.toLowerCase().includes('indo') ||
                c.code.toLowerCase().includes('indo')
        );
        expect(indoMatches.length).toBe(1);
        expect(indoMatches[0].code).toBe('ID');

        // Search by ISO code
        const usMatches = countries.filter(
            (c) =>
                c.name.toLowerCase().includes('us') ||
                c.code.toLowerCase().includes('us')
        );
        expect(usMatches.some((c) => c.code === 'US')).toBe(true);

        // Search with no match
        const noneMatches = countries.filter(
            (c) =>
                c.name.toLowerCase().includes('xyz123') ||
                c.code.toLowerCase().includes('xyz123')
        );
        expect(noneMatches.length).toBe(0);
    });
});
