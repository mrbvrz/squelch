import { describe, expect, it } from 'vitest';
import {
    exportToM3u,
    exportToPls,
    parseM3uPlaylist,
    parsePlsPlaylist
} from '../../src/utils/playlist';
import { Station } from '../../src/types/station';
import { getTranslations } from '../../src/i18n';

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
        expect(parsed[0].group).toBe('Umum');
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

describe('Modular i18n Dictionaries', () => {
    it('provides complete localized dictionaries for id and en with matching keys', () => {
        const idDict = getTranslations('id');
        const enDict = getTranslations('en');
        expect(Object.keys(idDict).sort()).toEqual(Object.keys(enDict).sort());
        expect(idDict.tabStats).toBe('Statistik Dengar');
        expect(enDict.tabStats).toBe('Listening Activity');
        expect(idDict.trayQuit).toBe('Keluar');
        expect(enDict.trayQuit).toBe('Quit');
    });
});
