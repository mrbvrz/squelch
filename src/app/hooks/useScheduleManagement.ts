import { useState } from 'react';
import type { ShowSchedule, Station } from '../../types';
import type { SquelchWindowApi } from '../types';

export function isScheduleCurrentlyOnAir(sched: ShowSchedule): boolean {
    if (!sched.enabled) return false;
    const now = new Date();
    const currentDay = now.getDay();
    if (!sched.daysOfWeek.includes(currentDay)) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = sched.startTime.split(':').map((v) => parseInt(v, 10));
    const [eH, eM] = sched.endTime.split(':').map((v) => parseInt(v, 10));
    const startMin = (sH || 0) * 60 + (sM || 0);
    const endMin = (eH || 0) * 60 + (eM || 0);
    return currentMinutes >= startMin && currentMinutes < endMin;
}

export interface UseScheduleManagementOptions {
    stations: Station[];
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
}

export function useScheduleManagement({
    stations,
    api,
    refreshAll
}: UseScheduleManagementOptions) {
    const [schedules, setSchedules] = useState<ShowSchedule[]>([]);
    const [isScheduleModalOpen, setIsScheduleModalOpen] =
        useState<boolean>(false);
    const [editingSchedule, setEditingSchedule] = useState<ShowSchedule | null>(
        null
    );
    const [schedStationId, setSchedStationId] = useState<string>('');
    const [schedShowName, setSchedShowName] = useState<string>('');
    const [schedHost, setSchedHost] = useState<string>('');
    const [schedDays, setSchedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [schedStartTime, setSchedStartTime] = useState<string>('06:00');
    const [schedEndTime, setSchedEndTime] = useState<string>('10:00');
    const [schedAutoPlay, setSchedAutoPlay] = useState<boolean>(true);
    const [schedReminderMinutes, setSchedReminderMinutes] = useState<number>(5);
    const [schedNotes, setSchedNotes] = useState<string>('');

    const openAddScheduleModal = () => {
        setEditingSchedule(null);
        setSchedStationId(stations[0]?.id || 'jak-101-fm-jakarta');
        setSchedShowName('');
        setSchedHost('');
        setSchedDays([1, 2, 3, 4, 5]);
        setSchedStartTime('06:00');
        setSchedEndTime('10:00');
        setSchedAutoPlay(true);
        setSchedReminderMinutes(5);
        setSchedNotes('');
        setIsScheduleModalOpen(true);
    };

    const openEditScheduleModal = (sched: ShowSchedule) => {
        setEditingSchedule(sched);
        setSchedStationId(sched.stationId);
        setSchedShowName(sched.showName);
        setSchedHost(sched.host || '');
        setSchedDays([...sched.daysOfWeek]);
        setSchedStartTime(sched.startTime);
        setSchedEndTime(sched.endTime);
        setSchedAutoPlay(sched.autoPlay);
        setSchedReminderMinutes(sched.reminderMinutes);
        setSchedNotes(sched.notes || '');
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedShowName.trim() || !schedStationId) return;

        const matchedStation = stations.find((s) => s.id === schedStationId);
        await api.saveSchedule({
            id: editingSchedule?.id,
            stationId: schedStationId,
            stationName: matchedStation?.name || schedStationId,
            showName: schedShowName.trim(),
            host: schedHost.trim(),
            daysOfWeek: schedDays.length > 0 ? schedDays : [1, 2, 3, 4, 5],
            startTime: schedStartTime,
            endTime: schedEndTime,
            autoPlay: schedAutoPlay,
            reminderMinutes: schedReminderMinutes,
            enabled: editingSchedule ? editingSchedule.enabled : true,
            notes: schedNotes.trim()
        });

        setIsScheduleModalOpen(false);
        await refreshAll();
    };

    const handleDeleteSchedule = async (id: string) => {
        await api.deleteSchedule(id);
        await refreshAll();
    };

    const handleToggleSchedule = async (id: string, enabled?: boolean) => {
        await api.toggleSchedule(id, enabled);
        await refreshAll();
    };

    const handleToggleScheduleAutoPlay = async (id: string) => {
        await api.toggleScheduleAutoPlay(id);
        await refreshAll();
    };

    return {
        schedules,
        setSchedules,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        editingSchedule,
        schedStationId,
        setSchedStationId,
        schedShowName,
        setSchedShowName,
        schedHost,
        setSchedHost,
        schedDays,
        setSchedDays,
        schedStartTime,
        setSchedStartTime,
        schedEndTime,
        setSchedEndTime,
        schedAutoPlay,
        setSchedAutoPlay,
        schedReminderMinutes,
        setSchedReminderMinutes,
        schedNotes,
        setSchedNotes,
        openAddScheduleModal,
        openEditScheduleModal,
        handleSaveSchedule,
        handleDeleteSchedule,
        handleToggleSchedule,
        handleToggleScheduleAutoPlay,
        isScheduleCurrentlyOnAir
    };
}
