import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    exportStationsData,
    importStationsData
} from '../../src/bridge/backup-restore';
import type { Station } from '../../src/types';

const mockStations: Station[] = [
    {
        id: 'st-1',
        name: 'Delta FM',
        streamUrl: 'https://stream.example.com/delta.mp3',
        streamType: 'mp3',
        logoUrl: null,
        genre: 'Pop',
        city: 'Jakarta',
        country: 'ID',
        tags: ['pop'],
        group: 'Umum',
        isFavorite: true,
        status: 'online',
        lastVerifiedAt: null
    }
];

let savedStations: Station[] = [];

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(async (cmd: string, args?: any) => {
        if (cmd === 'get_stations_data') {
            return { stations: [...mockStations] };
        }
        if (cmd === 'save_station') {
            savedStations.push(args.station);
            return true;
        }
        return null;
    })
}));

describe('Backup and Restore Bridge Helpers', () => {
    beforeEach(() => {
        savedStations = [];
    });

    it('exports stations to json format correctly', async () => {
        const json = await exportStationsData('json');
        const parsed = JSON.parse(json);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed[0].name).toBe('Delta FM');
    });

    it('exports stations to m3u format correctly', async () => {
        const m3u = await exportStationsData('m3u');
        expect(m3u).toContain('#EXTM3U');
        expect(m3u).toContain('Delta FM');
    });

    it('imports new stations that do not conflict', async () => {
        const newStation = [
            {
                name: 'Gen FM',
                streamUrl: 'https://stream.example.com/gen.mp3',
                genre: 'Hits'
            }
        ];
        const res = await importStationsData({
            content: JSON.stringify(newStation),
            format: 'json',
            duplicateStrategy: 'skip'
        });

        expect(res.importedCount).toBe(1);
        expect(res.skippedCount).toBe(0);
        expect(savedStations).toHaveLength(1);
        expect(savedStations[0].name).toBe('Gen FM');
    });

    it('skips duplicate stations when duplicateStrategy is skip', async () => {
        const dupStation = [
            {
                name: 'Delta FM',
                streamUrl: 'https://stream.example.com/delta.mp3'
            }
        ];
        const res = await importStationsData({
            content: JSON.stringify(dupStation),
            format: 'json',
            duplicateStrategy: 'skip'
        });

        expect(res.importedCount).toBe(0);
        expect(res.skippedCount).toBe(1);
        expect(savedStations).toHaveLength(0);
    });

    it('overwrites duplicate stations when duplicateStrategy is overwrite', async () => {
        const dupStation = [
            {
                name: 'Delta FM',
                streamUrl: 'https://stream.example.com/delta.mp3',
                genre: 'Adult Contemporary'
            }
        ];
        const res = await importStationsData({
            content: JSON.stringify(dupStation),
            format: 'json',
            duplicateStrategy: 'overwrite'
        });

        expect(res.importedCount).toBe(1);
        expect(res.skippedCount).toBe(0);
        expect(savedStations).toHaveLength(1);
        expect(savedStations[0].genre).toBe('Adult Contemporary');
    });
});
