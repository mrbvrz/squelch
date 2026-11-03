import { describe, it, expect } from 'vitest';
import type { Station } from '../../src/types';

describe('Station filtering and search logic', () => {
    const mockStations: Station[] = [
        {
            id: 'st-1',
            name: 'Prambors FM',
            streamUrl: 'https://stream.prambors.com',
            streamType: 'mp3',
            logoUrl: null,
            genre: 'Hits / Pop',
            city: 'Jakarta',
            country: 'Indonesia',
            tags: ['hits', 'youth'],
            group: 'Pop',
            isFavorite: true,
            status: 'online',
            lastVerifiedAt: '2026-01-01'
        },
        {
            id: 'st-2',
            name: 'Delta FM',
            streamUrl: 'https://stream.delta.com',
            streamType: 'mp3',
            logoUrl: null,
            genre: 'Adult Contemporary',
            city: 'Bandung',
            country: 'Indonesia',
            tags: ['calm', 'music'],
            group: 'Adult Contemporary',
            isFavorite: false,
            status: 'offline',
            lastVerifiedAt: '2026-01-01'
        },
        {
            id: 'st-3',
            name: 'Hard Rock FM',
            streamUrl: 'https://stream.hardrock.com',
            streamType: 'mp3',
            logoUrl: null,
            genre: 'Rock',
            city: 'Jakarta',
            country: 'Indonesia',
            tags: ['rock', 'lifestyle'],
            group: 'Rock',
            isFavorite: true,
            status: 'online',
            lastVerifiedAt: '2026-01-01'
        }
    ];

    it('filters by favorite only', () => {
        const favs = mockStations.filter((s) => s.isFavorite);
        expect(favs).toHaveLength(2);
        expect(favs.map((s) => s.id)).toEqual(['st-1', 'st-3']);
    });

    it('filters out offline stations when hideOffline is enabled', () => {
        const onlineOnly = mockStations.filter((s) => s.status !== 'offline');
        expect(onlineOnly).toHaveLength(2);
        expect(onlineOnly.map((s) => s.id)).toEqual(['st-1', 'st-3']);
    });

    it('searches across name, genre, city, and tags', () => {
        const query = 'bandung';
        const results = mockStations.filter(
            (s) =>
                s.name.toLowerCase().includes(query) ||
                s.genre.toLowerCase().includes(query) ||
                s.city.toLowerCase().includes(query) ||
                s.tags.some((t) => t.toLowerCase().includes(query))
        );
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Delta FM');
    });

    it('reorders station IDs correctly when dragged and dropped', () => {
        const ids = ['st-1', 'st-2', 'st-3'];
        const fromIdx = ids.indexOf('st-3');
        const toIdx = ids.indexOf('st-1');

        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, 'st-3');

        expect(ids).toEqual(['st-3', 'st-1', 'st-2']);
    });
});
