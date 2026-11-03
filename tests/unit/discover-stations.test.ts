import { describe, it, expect } from 'vitest';
import type { DiscoverStationItem } from '../../src/types';

describe('Discover stations deduplication logic', () => {
    it('deduplicates items with identical stream URLs case-insensitively', () => {
        const mockRawItems: DiscoverStationItem[] = [
            {
                id: '1',
                name: 'Radio Prambors',
                streamUrl: 'https://stream.prambors.com/live',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'Pop',
                city: 'Jakarta',
                country: 'Indonesia',
                tags: ['pop'],
                bitrate: 128,
                votes: 10
            },
            {
                id: '2',
                name: 'Prambors Stream 2',
                streamUrl: 'HTTPS://STREAM.PRAMBORS.COM/LIVE',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'Top 40',
                city: 'Jakarta',
                country: 'Indonesia',
                tags: ['top40'],
                bitrate: 128,
                votes: 5
            },
            {
                id: '3',
                name: 'Hard Rock FM',
                streamUrl: 'https://stream.hardrock.com/live',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'Rock',
                city: 'Jakarta',
                country: 'Indonesia',
                tags: ['rock'],
                bitrate: 128,
                votes: 12
            }
        ];

        const seen = new Set<string>();
        const deduplicated = mockRawItems.filter((st) => {
            const url = (st.streamUrl || '').trim().toLowerCase();
            const key = url || st.id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        expect(deduplicated).toHaveLength(2);
        expect(deduplicated[0].name).toBe('Radio Prambors');
        expect(deduplicated[1].name).toBe('Hard Rock FM');
    });

    it('falls back to id if streamUrl is missing or empty', () => {
        const mockRawItems: DiscoverStationItem[] = [
            {
                id: 'id-alpha',
                name: 'Station A',
                streamUrl: '',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'News',
                city: '',
                country: '',
                tags: [],
                bitrate: 0,
                votes: 0
            },
            {
                id: 'id-alpha',
                name: 'Station A Duplicate',
                streamUrl: '',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'News',
                city: '',
                country: '',
                tags: [],
                bitrate: 0,
                votes: 0
            },
            {
                id: 'id-beta',
                name: 'Station B',
                streamUrl: '',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'Jazz',
                city: '',
                country: '',
                tags: [],
                bitrate: 0,
                votes: 0
            }
        ];

        const seen = new Set<string>();
        const deduplicated = mockRawItems.filter((st) => {
            const url = (st.streamUrl || '').trim().toLowerCase();
            const key = url || st.id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        expect(deduplicated).toHaveLength(2);
        expect(deduplicated.map((s) => s.id)).toEqual(['id-alpha', 'id-beta']);
    });
});
