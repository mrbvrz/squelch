import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import {
    exportToM3u,
    exportToPls,
    parseM3uPlaylist,
    parsePlsPlaylist
} from '../../src/core/stations/playlist-parser';
import { AtomicJsonStore } from '../../src/core/storage/atomic-json-store';
import { RadioBrowserClient } from '../../src/core/discover/radio-browser.client';
import { Station } from '../../src/core/stations/station.model';
import { ListeningTracker } from '../../src/core/stats/listening-tracker';
import { TypedEventBus } from '../../src/core/events/event-bus';
import { getTranslations } from '../../src/ui/i18n';

const SAMPLE_STATIONS: Station[] = [
    {
        id: 'jak-101-fm-jakarta',
        name: 'Jak 101 FM Jakarta',
        streamUrl: 'https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8',
        streamType: 'hls',
        logoUrl: 'https://images.noiceid.cc/catalog/content-1614529857498.jpg',
        genre: 'Pop',
        city: 'Jakarta',
        country: 'ID',
        tags: ['pop', 'jakarta'],
        group: 'Pop & Anak Muda',
        isFavorite: true,
        lastVerifiedAt: '2026-10-31T00:00:00Z',
        status: 'online'
    }
];

describe('Playlist Parser & Exporter (M3U / PLS)', () => {
    it('exports and parses M3U playlists accurately', () => {
        const m3u = exportToM3u(SAMPLE_STATIONS);
        expect(m3u).toContain('#EXTM3U');
        expect(m3u).toContain('Jak 101 FM Jakarta');

        const parsed = parseM3uPlaylist(m3u);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('Jak 101 FM Jakarta');
        expect(parsed[0].streamUrl).toBe(
            'https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8'
        );
        expect(parsed[0].group).toBe('Pop & Anak Muda');
    });

    it('exports and parses PLS playlists accurately', () => {
        const pls = exportToPls(SAMPLE_STATIONS);
        expect(pls).toContain('[playlist]');
        expect(pls).toContain('NumberOfEntries=1');

        const parsed = parsePlsPlaylist(pls);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].name).toBe('Jak 101 FM Jakarta');
        expect(parsed[0].streamUrl).toBe(
            'https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8'
        );
    });
});

describe('AtomicJsonStore & Schema Migrations', () => {
    it('writes atomically and runs schema migrations when loading older versions', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squelch-test-'));
        const filePath = path.join(tmpDir, 'test-store.json');

        // Write v1 data manually
        fs.writeFileSync(
            filePath,
            JSON.stringify({ schemaVersion: 1, legacyField: 'hello' }),
            'utf8'
        );

        const migrations = new Map<
            number,
            (old: Record<string, unknown>) => unknown
        >();
        migrations.set(1, (old) => ({
            schemaVersion: 2,
            modernField: `${String(old.legacyField)}-migrated`
        }));

        const store = new AtomicJsonStore<{
            schemaVersion: number;
            modernField: string;
        }>({
            filePath,
            currentSchemaVersion: 2,
            defaultFactory: () => ({
                schemaVersion: 2,
                modernField: 'default'
            }),
            migrations
        });

        const loaded = store.load();
        expect(loaded.schemaVersion).toBe(2);
        expect(loaded.modernField).toBe('hello-migrated');

        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});

describe('RadioBrowserClient with mock failover', () => {
    it('fails over to the second mirror if the first mirror throws', async () => {
        const calledUrls: string[] = [];
        const client = new RadioBrowserClient({
            mirrors: ['https://mirror1.invalid', 'https://mirror2.valid'],
            fetchImpl: async (url) => {
                calledUrls.push(url);
                if (url.startsWith('https://mirror1.invalid')) {
                    throw new Error('Mirror 1 offline');
                }
                return [
                    {
                        stationuuid: 'uuid-123',
                        name: 'Radio Republik Indonesia',
                        url_resolved:
                            'https://stream-node0.rri.co.id/streaming/14/9014/kbrn.mp3',
                        url: 'https://stream-node0.rri.co.id/streaming/14/9014/kbrn.mp3',
                        favicon: '',
                        tags: 'berita,nasional',
                        countrycode: 'ID',
                        state: 'Jakarta',
                        codec: 'AAC',
                        bitrate: 64,
                        votes: 100
                    }
                ];
            }
        });

        const items = await client.searchStations({ countrycode: 'ID' });
        expect(calledUrls).toHaveLength(2);
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe('Radio Republik Indonesia');
        expect(items[0].streamType).toBe('aac');
    });
});

describe('ListeningTracker & Modular i18n', () => {
    it('records daily, monthly, and per-station listening durations accurately', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'squelch-stats-'));
        const bus = new TypedEventBus();
        const tracker = new ListeningTracker(tmpDir, bus);

        const fixedDate = new Date('2026-11-01T10:15:00Z');
        tracker.recordSeconds(180, 'prambors-fm-jakarta', fixedDate);
        tracker.recordSeconds(120, 'jak-101-fm-jakarta', fixedDate);

        const summary = tracker.getSummary(fixedDate);
        expect(summary.todaySeconds).toBe(300);
        expect(summary.thisWeekSeconds).toBe(300);
        expect(summary.thisMonthSeconds).toBe(300);
        expect(summary.thisYearSeconds).toBe(300);
        expect(summary.totalSeconds).toBe(300);
        expect(summary.weeklySeries).toHaveLength(7);
        expect(summary.monthlySeries).toHaveLength(30);
        expect(summary.yearlySeries).toHaveLength(12);
        expect(summary.topStations[0].stationId).toBe('prambors-fm-jakarta');
        expect(summary.topStations[0].seconds).toBe(180);

        tracker.stop();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('provides complete localized dictionaries for id and en', () => {
        const idDict = getTranslations('id');
        const enDict = getTranslations('en');
        expect(Object.keys(idDict).sort()).toEqual(Object.keys(enDict).sort());
        expect(idDict.tabStats).toBe('Statistik Dengar');
        expect(enDict.tabStats).toBe('Listening Activity');
    });
});
