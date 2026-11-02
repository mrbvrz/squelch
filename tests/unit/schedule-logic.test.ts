import { describe, expect, it } from 'vitest';
import { isScheduleCurrentlyOnAir } from '../../src/app/hooks/useScheduleManagement';
import type { ShowSchedule } from '../../src/types';

describe('Schedule Management Logic', () => {
    it('returns false if schedule is disabled', () => {
        const sched: ShowSchedule = {
            id: 'sched-1',
            stationId: 'st-1',
            stationName: 'Station 1',
            showName: 'Morning Show',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '00:00',
            endTime: '23:59',
            autoPlay: true,
            reminderMinutes: 5,
            enabled: false
        };
        expect(isScheduleCurrentlyOnAir(sched)).toBe(false);
    });

    it('returns false if current day of week is not included', () => {
        const now = new Date();
        const currentDay = now.getDay();
        const otherDay = (currentDay + 1) % 7;

        const sched: ShowSchedule = {
            id: 'sched-2',
            stationId: 'st-1',
            stationName: 'Station 1',
            showName: 'Weekend Special',
            daysOfWeek: [otherDay],
            startTime: '00:00',
            endTime: '23:59',
            autoPlay: true,
            reminderMinutes: 5,
            enabled: true
        };
        expect(isScheduleCurrentlyOnAir(sched)).toBe(false);
    });

    it('returns true if day and time match the current time', () => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        // Construct a start time 10 minutes ago, and end time 20 minutes from now
        const startTotalMin = Math.max(0, currentHours * 60 + currentMinutes - 10);
        const endTotalMin = Math.min(23 * 60 + 59, currentHours * 60 + currentMinutes + 20);

        const sH = String(Math.floor(startTotalMin / 60)).padStart(2, '0');
        const sM = String(startTotalMin % 60).padStart(2, '0');
        const eH = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
        const eM = String(endTotalMin % 60).padStart(2, '0');

        const sched: ShowSchedule = {
            id: 'sched-3',
            stationId: 'st-1',
            stationName: 'Station 1',
            showName: 'Live Now',
            daysOfWeek: [currentDay],
            startTime: `${sH}:${sM}`,
            endTime: `${eH}:${eM}`,
            autoPlay: true,
            reminderMinutes: 5,
            enabled: true
        };

        expect(isScheduleCurrentlyOnAir(sched)).toBe(true);
    });
});
