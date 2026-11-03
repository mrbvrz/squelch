import { describe, expect, it } from 'vitest';
import {
    formatDateKey,
    formatMonthKey,
    recordListeningSeconds,
    buildListeningStatsSummary
} from '../../src/utils/listening-stats';
import type { ListeningStatsSchema } from '../../src/types/stats';

describe('listening-stats utility', () => {
    it('formats date and month keys with padded zeroes correctly', () => {
        const testDate = new Date(2026, 4, 3); // May 3, 2026
        expect(formatDateKey(testDate)).toBe('2026-05-03');
        expect(formatMonthKey(testDate)).toBe('2026-05');
    });

    it('records listening seconds into daily, hourly, monthly, and station buckets', () => {
        const stats: ListeningStatsSchema = {
            schemaVersion: 1,
            dailySeconds: {},
            hourlySeconds: {},
            monthlySeconds: {},
            stationSeconds: {},
            stationNames: {},
            stationLogos: {},
            totalSeconds: 0
        };

        const date = new Date(2026, 10, 3, 14, 30, 0); // 2026-11-03 14:30
        recordListeningSeconds(
            stats,
            120,
            {
                id: 'st-prambors',
                name: 'Prambors FM',
                logoUrl: 'https://example.com/logo.png'
            },
            date
        );

        expect(stats.totalSeconds).toBe(120);
        expect(stats.dailySeconds['2026-11-03']).toBe(120);
        expect(stats.hourlySeconds?.['2026-11-03-14']).toBe(120);
        expect(stats.monthlySeconds['2026-11']).toBe(120);
        expect(stats.stationSeconds['st-prambors']).toBe(120);
        expect(stats.stationNames?.['st-prambors']).toBe('Prambors FM');
        expect(stats.stationLogos?.['st-prambors']).toBe(
            'https://example.com/logo.png'
        );

        // Accumulates correctly on subsequent ticks
        recordListeningSeconds(
            stats,
            60,
            { id: 'st-prambors', name: 'Prambors FM' },
            date
        );
        expect(stats.totalSeconds).toBe(180);
        expect(stats.dailySeconds['2026-11-03']).toBe(180);
        expect(stats.stationSeconds['st-prambors']).toBe(180);
    });

    it('builds comprehensive ListeningStatsSummary across daily, weekly, monthly, and yearly series', () => {
        const fixedNow = new Date(2026, 10, 3, 14, 0, 0); // 2026-11-03
        const stats: ListeningStatsSchema = {
            schemaVersion: 1,
            dailySeconds: {
                '2026-11-03': 3600,
                '2026-11-02': 1800
            },
            hourlySeconds: {
                '2026-11-03-14': 3600
            },
            monthlySeconds: {
                '2026-11': 5400,
                '2026-10': 7200
            },
            stationSeconds: {
                'st-1': 5000,
                'st-2': 400
            },
            stationNames: {
                'st-1': 'Prambors FM',
                'st-2': 'Delta FM'
            },
            stationLogos: {},
            totalSeconds: 12600
        };

        const summary = buildListeningStatsSummary(stats, fixedNow);
        expect(summary.todaySeconds).toBe(3600);
        expect(summary.thisWeekSeconds).toBe(5400);
        expect(summary.thisMonthSeconds).toBe(5400);
        expect(summary.totalSeconds).toBe(12600);
        expect(summary.dailySeries).toHaveLength(24);
        expect(summary.weeklySeries).toHaveLength(7);
        expect(summary.monthlySeries).toHaveLength(30);
        expect(summary.yearlySeries).toHaveLength(12);
        expect(summary.topStations).toHaveLength(2);
        expect(summary.topStations[0].stationId).toBe('st-1');
        expect(summary.topStations[0].stationName).toBe('Prambors FM');
        expect(summary.topStations[0].seconds).toBe(5000);
    });
});
