import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    cancelSleepTimer,
    setSleepTimer,
    startSleepTimer
} from '../../src/bridge/sleep-timer';
import type { PlayerStatus } from '../../src/types';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn().mockResolvedValue({
        settings: { language: 'en' }
    })
}));

vi.mock('@tauri-apps/api/event', () => ({
    emit: vi.fn().mockResolvedValue(undefined)
}));

describe('Sleep Timer Controller', () => {
    let mockStatus: PlayerStatus;
    let syncToRust: ReturnType<typeof vi.fn>;
    let stopPlayback: ReturnType<typeof vi.fn>;
    let sendNotification: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        mockStatus = {
            state: 'playing',
            currentStation: {
                id: 'st-1',
                name: 'Prambors FM',
                streamUrl: 'https://stream.example.com/live',
                streamType: 'mp3',
                logoUrl: null,
                genre: 'Top 40',
                city: 'Jakarta',
                country: 'ID',
                tags: [],
                group: 'Umum',
                isFavorite: false,
                status: 'online',
                lastVerifiedAt: null
            },
            streamTitle: 'Top 40 Hits',
            sleepTimerMinutes: null,
            sleepTimerRemainingSec: null,
            reconnectAttempt: null
        };
        syncToRust = vi.fn();
        stopPlayback = vi.fn().mockResolvedValue(undefined);
        sendNotification = vi.fn().mockResolvedValue(undefined);
    });

    afterEach(() => {
        cancelSleepTimer(mockStatus, syncToRust);
        vi.useRealTimers();
    });

    it('sets initial countdown accurately when started', async () => {
        await setSleepTimer(
            30,
            mockStatus,
            syncToRust,
            stopPlayback,
            sendNotification
        );

        expect(mockStatus.sleepTimerMinutes).toBe(30);
        expect(mockStatus.sleepTimerRemainingSec).toBe(1800);
        expect(syncToRust).toHaveBeenCalled();
    });

    it('cancels countdown when set to null or 0', async () => {
        await setSleepTimer(
            15,
            mockStatus,
            syncToRust,
            stopPlayback,
            sendNotification
        );
        expect(mockStatus.sleepTimerMinutes).toBe(15);

        await setSleepTimer(
            null,
            mockStatus,
            syncToRust,
            stopPlayback,
            sendNotification
        );
        expect(mockStatus.sleepTimerMinutes).toBeNull();
        expect(mockStatus.sleepTimerRemainingSec).toBeNull();
    });

    it('ticks downward every second and triggers warning at 60 seconds', async () => {
        startSleepTimer(
            2, // 120 seconds
            mockStatus,
            syncToRust,
            stopPlayback,
            sendNotification
        );

        expect(mockStatus.sleepTimerRemainingSec).toBe(120);

        // Advance 60 seconds -> remaining 60s
        await vi.advanceTimersByTimeAsync(60000);

        expect(mockStatus.sleepTimerRemainingSec).toBe(60);
        expect(sendNotification).toHaveBeenCalledWith(
            'Sleep Timer',
            expect.stringContaining('stop in 1 minute')
        );
    });

    it('stops playback when countdown reaches zero', async () => {
        startSleepTimer(
            1, // 60 seconds
            mockStatus,
            syncToRust,
            stopPlayback,
            sendNotification
        );

        // Advance past 60 seconds
        await vi.advanceTimersByTimeAsync(60000);

        expect(stopPlayback).toHaveBeenCalled();
        expect(sendNotification).toHaveBeenCalledWith(
            'Sleep Timer',
            expect.stringContaining('stopped')
        );
    });
});
