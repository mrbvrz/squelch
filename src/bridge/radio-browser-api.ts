import {
    countryCodeToFlag,
    getFriendlyCountryName
} from '../utils/appearance';
import type { DiscoverStationItem, RadioBrowserCountry, RadioBrowserQuery } from '../types';

export async function fetchOnlineCountries(): Promise<RadioBrowserCountry[]> {
    try {
        const res = await fetch(
            'https://de1.api.radio-browser.info/json/countries'
        );
        const list: any[] = await res.json();
        return list
            .filter((c) => c.iso_3166_1 && c.stationcount > 0)
            .map((c) => {
                const code = c.iso_3166_1.toUpperCase();
                return {
                    code,
                    name: getFriendlyCountryName(code, c.name),
                    stationCount: c.stationcount,
                    flag: countryCodeToFlag(code)
                };
            })
            .sort((a, b) => b.stationCount - a.stationCount);
    } catch {
        return [];
    }
}

export async function searchOnlineStations(
    query: RadioBrowserQuery
): Promise<DiscoverStationItem[]> {
    try {
        const params = new URLSearchParams();
        if (query.name && query.name.trim()) {
            params.set('name', query.name.trim());
        }
        if (query.countrycode && query.countrycode.trim()) {
            params.set(
                'countrycode',
                query.countrycode.trim().toUpperCase()
            );
        }
        if (query.tag && query.tag.trim()) {
            params.set('tag', query.tag.trim());
        }

        // Order by popularity (votes) descending & filter out dead streams
        params.set('hidebroken', 'true');
        params.set('order', 'votes');
        params.set('reverse', 'true');
        params.set('limit', String(query.limit || 60));

        const res = await fetch(
            `https://de1.api.radio-browser.info/json/stations/search?${params.toString()}`
        );
        const list: any[] = await res.json();
        if (!Array.isArray(list)) return [];

        const targetCountry = query.countrycode
            ? query.countrycode.trim().toUpperCase()
            : '';

        const seen = new Set<string>();
        const deduplicated = [];
        for (const s of list) {
            const url = (s.url_resolved || s.url || '')
                .trim()
                .toLowerCase();
            const id = s.stationuuid;
            const key = url || id;
            if (!key || seen.has(key)) continue;

            if (
                targetCountry &&
                s.countrycode &&
                s.countrycode.trim().toUpperCase() !== targetCountry
            ) {
                continue;
            }

            seen.add(key);
            deduplicated.push(s);
        }

        return deduplicated.map((s) => {
            const cleanName =
                (s.name || '')
                    .replace(/^[\s\t\r\n]+/, '')
                    .replace(/[\s\t\r\n]+$/, '')
                    .replace(/\s+/g, ' ')
                    .trim() || 'Radio Stream';

            const rawUrl = (s.url_resolved || s.url || '').trim();
            const tags = (s.tags || '')
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean);

            return {
                id: s.stationuuid,
                name: cleanName,
                streamUrl: rawUrl,
                streamType: rawUrl.includes('.m3u8')
                    ? ('hls' as const)
                    : ('mp3' as const),
                logoUrl:
                    s.favicon && s.favicon.trim()
                        ? s.favicon.trim()
                        : null,
                genre: tags[0] || 'General',
                city: (s.state || '').trim(),
                country: (s.countrycode || '').trim().toUpperCase(),
                tags,
                bitrate: s.bitrate || 128,
                votes: s.votes || 0
            };
        });
    } catch {
        return [];
    }
}
