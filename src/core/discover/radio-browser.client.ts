import * as https from 'https';
import { StreamType } from '../stations/station.model';

export interface RadioBrowserQuery {
  countrycode?: string;
  name?: string;
  tag?: string;
  language?: string;
  limit?: number;
}

export interface DiscoverStationItem {
  id: string;
  name: string;
  streamUrl: string;
  streamType: StreamType;
  logoUrl: string | null;
  genre: string;
  city: string;
  country: string;
  tags: string[];
  bitrate: number;
  votes: number;
}

export interface RadioBrowserCountry {
  code: string;
  name: string;
  stationCount: number;
  flag: string;
}

interface RawRadioBrowserStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  url: string;
  favicon: string;
  tags: string;
  countrycode: string;
  state: string;
  codec: string;
  bitrate: number;
  votes: number;
}

interface RawRadioBrowserCountry {
  name: string;
  iso_3166_1: string;
  stationcount: number;
}

export function countryCodeToFlag(isoCode: string): string {
  const clean = (isoCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return '🌐';
  const first = 0x1f1e6 + (clean.charCodeAt(0) - 65);
  const second = 0x1f1e6 + (clean.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
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

const DEFAULT_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

export class RadioBrowserClient {
  private readonly mirrors: string[];
  private readonly fetchImpl?: (
    url: string
  ) => Promise<RawRadioBrowserStation[]>;
  private cachedCountries: RadioBrowserCountry[] | null = null;

  constructor(options?: {
    mirrors?: string[];
    fetchImpl?: (url: string) => Promise<RawRadioBrowserStation[]>;
  }) {
    this.mirrors = options?.mirrors ?? DEFAULT_MIRRORS;
    this.fetchImpl = options?.fetchImpl;
  }

  public async getCountries(): Promise<RadioBrowserCountry[]> {
    if (this.cachedCountries && this.cachedCountries.length > 0) {
      return this.cachedCountries;
    }

    for (const mirror of this.mirrors) {
      const endpoint = `${mirror}/json/countries?hidebroken=true`;
      try {
        const rawList =
          await this.httpGetJson<RawRadioBrowserCountry[]>(endpoint);
        const byCode = new Map<string, RadioBrowserCountry>();

        for (const item of rawList) {
          const code = (item.iso_3166_1 || '').trim().toUpperCase();
          if (!/^[A-Z]{2}$/.test(code)) continue;
          const count = Number(item.stationcount) || 0;
          if (count <= 0) continue;

          const existing = byCode.get(code);
          if (existing) {
            existing.stationCount += count;
          } else {
            byCode.set(code, {
              code,
              name: (item.name || code).trim(),
              stationCount: count,
              flag: countryCodeToFlag(code)
            });
          }
        }

        const list = Array.from(byCode.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        if (list.length > 0) {
          this.cachedCountries = list;
          return list;
        }
      } catch {
        // Try next mirror
      }
    }

    return FALLBACK_COUNTRIES;
  }

  public async searchStations(
    query: RadioBrowserQuery
  ): Promise<DiscoverStationItem[]> {
    const params = new URLSearchParams();
    params.set('hidebroken', 'true');
    params.set('order', 'votes');
    params.set('reverse', 'true');
    params.set('limit', String(query.limit ?? 40));

    if (query.countrycode && query.countrycode.trim()) {
      params.set('countrycode', query.countrycode.trim().toUpperCase());
    }
    if (query.name && query.name.trim()) {
      params.set('name', query.name.trim());
    }
    if (query.tag && query.tag.trim()) {
      params.set('tag', query.tag.trim());
    }
    if (query.language && query.language.trim()) {
      params.set('language', query.language.trim());
    }

    let lastError: Error | null = null;
    for (const mirror of this.mirrors) {
      const endpoint = `${mirror}/json/stations/search?${params.toString()}`;
      try {
        const rawList = this.fetchImpl
          ? await this.fetchImpl(endpoint)
          : await this.httpGetJson<RawRadioBrowserStation[]>(endpoint);
        return this.mapResults(rawList);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error('All radio-browser.info mirrors failed');
  }

  private mapResults(rawList: RawRadioBrowserStation[]): DiscoverStationItem[] {
    const results: DiscoverStationItem[] = [];
    const seenUrls = new Set<string>();

    for (const r of rawList) {
      const streamUrl = (r.url_resolved || r.url || '').trim();
      if (
        !streamUrl.startsWith('http://') &&
        !streamUrl.startsWith('https://')
      ) {
        continue;
      }
      if (seenUrls.has(streamUrl.toLowerCase())) continue;
      seenUrls.add(streamUrl.toLowerCase());

      const codecLower = (r.codec || '').toLowerCase();
      let streamType: StreamType = 'mp3';
      if (
        streamUrl.toLowerCase().includes('.m3u8') ||
        codecLower.includes('hls')
      ) {
        streamType = 'hls';
      } else if (codecLower.includes('aac')) {
        streamType = 'aac';
      } else if (codecLower.includes('ogg') || codecLower.includes('opus')) {
        streamType = 'ogg';
      }

      const tags = r.tags
        ? r.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 5)
        : [];

      let normalizedLogo: string | null = null;
      if (r.favicon) {
        const cleanFav = r.favicon.trim();
        if (cleanFav.startsWith('//')) {
          normalizedLogo = `https:${cleanFav}`;
        } else if (
          cleanFav.startsWith('http://') ||
          cleanFav.startsWith('https://')
        ) {
          normalizedLogo = cleanFav;
        }
      }

      results.push({
        id: `rb-${r.stationuuid}`,
        name: (r.name || 'Unnamed Station').trim(),
        streamUrl,
        streamType,
        logoUrl: normalizedLogo,
        genre: tags[0] || 'Radio',
        city: (r.state || r.countrycode || 'ID').trim(),
        country: (r.countrycode || 'ID').trim(),
        tags,
        bitrate: r.bitrate || 0,
        votes: r.votes || 0
      });
    }

    return results;
  }

  private httpGetJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'Squelch/0.1.0',
            Accept: 'application/json'
          },
          timeout: 6500
        },
        (res) => {
          if ((res.statusCode ?? 0) !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(
                Buffer.concat(chunks).toString('utf8')
              ) as T;
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error('Request timeout'));
      });
      req.on('error', reject);
    });
  }
}
