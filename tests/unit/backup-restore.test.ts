import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    exportStationsData,
    importStationsData,
    restoreAppDataBundle
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
let savedStatsPayload: any = null;
const emittedEvents: Array<{ event: string; payload: any }> = [];

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(async (cmd: string, args?: any) => {
        if (cmd === 'get_stations_data') {
            return { stations: [...mockStations] };
        }
        if (cmd === 'save_station') {
            savedStations.push(args.station);
            return true;
        }
        if (cmd === 'save_listening_stats') {
            savedStatsPayload = args.stats;
            return true;
        }
        return null;
    })
}));

vi.mock('@tauri-apps/api/event', () => ({
    emit: vi.fn(async (event: string, payload?: any) => {
        emittedEvents.push({ event, payload });
    })
}));

describe('Backup and Restore Bridge Helpers', () => {
    beforeEach(() => {
        savedStations = [];
        savedStatsPayload = null;
        emittedEvents.length = 0;
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

    it('restores listeningStats and resolves on cancel when restoring a backup bundle', async () => {
        const listeners: Record<string, Array<() => void>> = {};
        const fakeInput: any = {
            type: '',
            accept: '',
            files: null,
            onchange: null,
            addEventListener: (evt: string, fn: () => void) => {
                listeners[evt] = listeners[evt] || [];
                listeners[evt].push(fn);
            },
            click: () => {
                for (const fn of listeners['cancel'] || []) fn();
            }
        };

        const origDocument = globalThis.document;
        const origWindow = globalThis.window;

        globalThis.document = {
            createElement: () => fakeInput
        } as unknown as Document;
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        } as unknown as Window & typeof globalThis;

        try {
            const canceledRes = await restoreAppDataBundle();
            expect(canceledRes).toEqual({ ok: false, canceled: true });

            const backupPayload = {
                stationsData: {
                    stations: [
                        {
                            id: 'st-2',
                            name: 'RRI',
                            streamUrl: 'https://rri.example/stream'
                        }
                    ],
                    groups: ['News']
                },
                listeningStats: {
                    dailySeconds: { '2026-11-03': 300 },
                    hourlySeconds: { '2026-11-03-10': 300 },
                    stationNames: { 'st-2': 'RRI' },
                    totalSeconds: 300
                }
            };

            fakeInput.click = () => {
                fakeInput.files = [
                    { text: async () => JSON.stringify(backupPayload) }
                ];
                void fakeInput.onchange?.();
            };

            const restoredRes = await restoreAppDataBundle();
            expect(restoredRes).toEqual({ ok: true });
            expect(savedStations).toHaveLength(1);
            expect(savedStatsPayload?.hourlySeconds).toEqual({
                '2026-11-03-10': 300
            });
            expect(savedStatsPayload?.stationNames).toEqual({ 'st-2': 'RRI' });
            expect(emittedEvents).toContainEqual({
                event: 'squelch:stats:reload',
                payload: undefined
            });
            expect(emittedEvents).toContainEqual({
                event: 'ui:state-changed',
                payload: { type: 'all' }
            });
        } finally {
            globalThis.document = origDocument;
            globalThis.window = origWindow;
        }
    });
});
