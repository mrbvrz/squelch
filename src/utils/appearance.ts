import type { AppSettings, RadioBrowserCountry, ThemeMode } from '../types';

export interface CukupThemeMeta {
    id: ThemeMode;
    name: string;
    accent: string;
    canvas: string;
    panel: string;
    descriptionId: string;
    descriptionEn: string;
}

export const CUKUP_THEMES: CukupThemeMeta[] = [
    {
        id: 'cukup-senja',
        name: 'Cukup Senja',
        accent: '#E89058',
        canvas: '#181816',
        panel: '#131311',
        descriptionId: 'Obsidian hangat & terakota senja',
        descriptionEn: 'Warm charcoal obsidian & terracotta'
    },
    {
        id: 'cukup-malam',
        name: 'Cukup Malam',
        accent: '#E6A854',
        canvas: '#131718',
        panel: '#0E1213',
        descriptionId: 'Pirus pinus gelap & madu amber',
        descriptionEn: 'Deep pine slate & wild honey amber'
    },
    {
        id: 'cukup-kopi',
        name: 'Cukup Kopi',
        accent: '#E87D4B',
        canvas: '#161413',
        panel: '#11100E',
        descriptionId: 'Espreso sangrai gelap & kesemek',
        descriptionEn: 'Dark roasted espresso & persimmon'
    },
    {
        id: 'cukup-terang',
        name: 'Cukup Terang',
        accent: '#D96B27',
        canvas: '#FAF8F5',
        panel: '#F2EFE9',
        descriptionId: 'Kertas perkamen hangat & terakota',
        descriptionEn: 'Organic parchment & terracotta'
    }
];

export const CUKUP_THEME_ACCENTS: Record<string, string> = {
    'cukup-senja': '#E89058',
    'cukup-malam': '#E6A854',
    'cukup-kopi': '#E87D4B',
    'cukup-terang': '#D96B27'
};

export const ACCENT_SWATCHES: Array<{
    id: string;
    label: string;
    name: string;
    hex: string;
}> = [
    { id: 'blue', label: 'Blue', name: 'Blue', hex: '#0A84FF' },
    { id: 'purple', label: 'Purple', name: 'Purple', hex: '#BF5AF2' },
    { id: 'pink', label: 'Pink', name: 'Pink', hex: '#FF375F' },
    { id: 'red', label: 'Red', name: 'Red', hex: '#FF453A' },
    { id: 'orange', label: 'Orange', name: 'Orange', hex: '#FF9F0A' },
    { id: 'teal', label: 'Teal', name: 'Teal', hex: '#32ADE6' },
    { id: 'indigo', label: 'Indigo', name: 'Indigo', hex: '#5E5CE6' },
    { id: 'green', label: 'Green', name: 'Green', hex: '#30D158' },
    {
        id: 'terracotta',
        label: 'Terracotta (Senja)',
        name: 'Terracotta',
        hex: '#E89058'
    },
    {
        id: 'amber',
        label: 'Honey Amber (Malam)',
        name: 'Honey Amber',
        hex: '#E6A854'
    },
    {
        id: 'persimmon',
        label: 'Persimmon (Kopi)',
        name: 'Persimmon',
        hex: '#E87D4B'
    }
];

export function countryCodeToFlag(isoCode: string): string {
    const clean = (isoCode || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(clean)) return '🌐';
    const first = 0x1f1e6 + (clean.charCodeAt(0) - 65);
    const second = 0x1f1e6 + (clean.charCodeAt(1) - 65);
    return String.fromCodePoint(first, second);
}

export const FRIENDLY_COUNTRY_NAMES: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    RU: 'Russia',
    KR: 'South Korea',
    KP: 'North Korea',
    CD: 'DR Congo',
    CG: 'Congo',
    IR: 'Iran',
    SY: 'Syria',
    VE: 'Venezuela',
    BO: 'Bolivia',
    TZ: 'Tanzania',
    VN: 'Vietnam',
    LA: 'Laos',
    TW: 'Taiwan',
    PS: 'Palestine',
    VA: 'Vatican City'
};

export function getFriendlyCountryName(code: string, rawName?: string): string {
    const cleanCode = (code || '').trim().toUpperCase();
    if (FRIENDLY_COUNTRY_NAMES[cleanCode]) {
        return FRIENDLY_COUNTRY_NAMES[cleanCode];
    }
    return (rawName || '').replace(/^The\s+/i, '').trim();
}

export const FALLBACK_COUNTRIES: RadioBrowserCountry[] = [
    { code: 'ID', name: 'Indonesia', stationCount: 380, flag: '🇮🇩' },
    { code: 'MY', name: 'Malaysia', stationCount: 140, flag: '🇲🇾' },
    { code: 'SG', name: 'Singapore', stationCount: 65, flag: '🇸🇬' },
    { code: 'US', name: 'United States', stationCount: 6800, flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', stationCount: 2400, flag: '🇬🇧' },
    { code: 'JP', name: 'Japan', stationCount: 420, flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', stationCount: 190, flag: '🇰🇷' },
    { code: 'AU', name: 'Australia', stationCount: 720, flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', stationCount: 4900, flag: '🇩🇪' },
    { code: 'FR', name: 'France', stationCount: 2600, flag: '🇫🇷' },
    { code: 'NL', name: 'Netherlands', stationCount: 1100, flag: '🇳🇱' },
    { code: 'IT', name: 'Italy', stationCount: 1900, flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', stationCount: 1500, flag: '🇪🇸' },
    { code: 'CA', name: 'Canada', stationCount: 1400, flag: '🇨🇦' },
    { code: 'BR', name: 'Brazil', stationCount: 2200, flag: '🇧🇷' },
    { code: 'SA', name: 'Saudi Arabia', stationCount: 130, flag: '🇸🇦' },
    { code: 'TR', name: 'Turkey', stationCount: 680, flag: '🇹🇷' },
    { code: 'IN', name: 'India', stationCount: 850, flag: '🇮🇳' },
    { code: 'PH', name: 'Philippines', stationCount: 310, flag: '🇵🇭' },
    { code: 'TH', name: 'Thailand', stationCount: 180, flag: '🇹🇭' }
];

export function applyAppearanceVariables(
    settings?: Partial<AppSettings> | null
): void {
    const root = document.documentElement;
    if (!settings) return;

    // 1. Theme
    const theme = settings.theme || 'system';
    if (theme && theme !== 'system') {
        root.setAttribute('data-theme', theme);
    } else {
        root.removeAttribute('data-theme');
    }

    // 2. Accent color (uses custom accent or theme signature default)
    const defaultAccent = CUKUP_THEME_ACCENTS[theme] || '#0A84FF';
    const accent = settings.accentColor || defaultAccent;
    root.style.setProperty('--accent-color', accent);

    // 3. Glass opacity (default 90%)
    const opacityPct = settings.glassOpacity ?? 90;
    root.style.setProperty(
        '--glass-alpha',
        String(Math.max(0.2, Math.min(1, opacityPct / 100)))
    );

    // 4. Font family ('system' or user-chosen system font)
    const font = settings.fontFamily;
    if (!font || font === 'system') {
        root.style.setProperty(
            '--app-font-family',
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI Variable Text', 'Helvetica Neue', sans-serif"
        );
    } else {
        root.style.setProperty(
            '--app-font-family',
            `"${font}", -apple-system, BlinkMacSystemFont, sans-serif`
        );
    }
}

export function bindActiveScrollbars(): () => void {
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const root = document.documentElement;

    const onScroll = () => {
        root.classList.add('is-scrolling');
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            root.classList.remove('is-scrolling');
        }, 750);
    };

    window.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true
    });
    return () => {
        window.removeEventListener('scroll', onScroll, { capture: true });
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
    };
}

export function formatDurationCompact(
    totalSeconds: number,
    lang: 'id' | 'en' = 'id'
): string {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remSec = sec % 60;

    if (hours > 0) {
        return lang === 'en'
            ? `${hours}h ${minutes}m`
            : `${hours} j ${minutes} mnt`;
    }
    if (minutes > 0) {
        return lang === 'en'
            ? `${minutes}m ${remSec}s`
            : `${minutes} mnt ${remSec} dtk`;
    }
    return lang === 'en' ? `${remSec}s` : `${remSec} dtk`;
}
