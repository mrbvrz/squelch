import { describe, expect, it } from 'vitest';
import type { UpdateCheckResult, UpdateDownloadProgress } from '../../src/components/UpdateModal';

describe('Update Downloader & Background Progress', () => {
    it('initializes with idle state and valid asset URLs', () => {
        const updateInfo: UpdateCheckResult = {
            hasUpdate: true,
            currentVersion: '0.1.2',
            latestVersion: '0.1.3',
            releaseName: 'Squelch v0.1.3',
            releaseNotes: 'Performance improvements and bug fixes',
            publishedAt: '2026-11-03T02:00:00Z',
            releaseUrl: 'https://github.com/mrbvrz/squelch/releases/tag/v0.1.3',
            downloadUrl: 'https://github.com/mrbvrz/squelch/releases/download/v0.1.3/Squelch-0.1.3-arm64.dmg',
            fileName: 'Squelch-0.1.3-arm64.dmg',
            assets: [
                {
                    name: 'Squelch-0.1.3-arm64.dmg',
                    downloadUrl: 'https://github.com/mrbvrz/squelch/releases/download/v0.1.3/Squelch-0.1.3-arm64.dmg',
                    size: 3168256
                }
            ]
        };

        expect(updateInfo.hasUpdate).toBe(true);
        expect(updateInfo.fileName).toBe('Squelch-0.1.3-arm64.dmg');
        expect(updateInfo.downloadUrl.endsWith('.dmg')).toBe(true);
    });

    it('tracks downloading progress and calculates percentage correctly', () => {
        const total = 3168256;
        const transferred = 1584128; // 50%
        const percent = (transferred / total) * 100;

        const progress: UpdateDownloadProgress = {
            status: 'downloading',
            transferred,
            total,
            percent,
            fileName: 'Squelch-0.1.3-arm64.dmg'
        };

        expect(progress.status).toBe('downloading');
        expect(progress.percent).toBeCloseTo(50, 1);
        expect(progress.filePath).toBeUndefined();
    });

    it('transitions to completed status with valid local installer file path', () => {
        const progress: UpdateDownloadProgress = {
            status: 'completed',
            transferred: 3168256,
            total: 3168256,
            percent: 100,
            filePath: '/Users/test/Library/Caches/squelch/updates/Squelch-0.1.3-arm64.dmg',
            fileName: 'Squelch-0.1.3-arm64.dmg'
        };

        expect(progress.status).toBe('completed');
        expect(progress.percent).toBe(100);
        expect(progress.filePath).toBeDefined();
        expect(progress.filePath?.endsWith('.dmg')).toBe(true);
    });

    it('handles cancellation and error states gracefully', () => {
        const cancelled: UpdateDownloadProgress = {
            status: 'cancelled',
            transferred: 0,
            total: 3168256,
            percent: 0,
            fileName: 'Squelch-0.1.3-arm64.dmg'
        };
        expect(cancelled.status).toBe('cancelled');

        const errored: UpdateDownloadProgress = {
            status: 'error',
            transferred: 1024,
            total: 3168256,
            percent: 0.03,
            fileName: 'Squelch-0.1.3-arm64.dmg',
            error: 'Connection reset by peer'
        };
        expect(errored.status).toBe('error');
        expect(errored.error).toContain('Connection reset');
    });
});
