import React from 'react';
import type { ShowSchedule, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import { IconCalendar, IconClose } from '../../components/Icons';
import { MacToggle } from '../../components/MacToggle';

export interface DayLabelItem {
    day: number;
    labelId: string;
    labelEn: string;
}

export interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    editingSchedule: ShowSchedule | null;
    stations: Station[];
    schedStationId: string;
    setSchedStationId: (v: string) => void;
    schedShowName: string;
    setSchedShowName: (v: string) => void;
    schedHost: string;
    setSchedHost: (v: string) => void;
    schedDays: number[];
    setSchedDays: (v: number[]) => void;
    schedStartTime: string;
    setSchedStartTime: (v: string) => void;
    schedEndTime: string;
    setSchedEndTime: (v: string) => void;
    schedAutoPlay: boolean;
    setSchedAutoPlay: (v: boolean) => void;
    schedReminderMinutes: number;
    setSchedReminderMinutes: (v: number) => void;
    schedNotes: string;
    setSchedNotes: (v: string) => void;
    dayLabels: DayLabelItem[];
    lang: string;
    t: TranslationDictionary;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingSchedule,
    stations,
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
    dayLabels,
    lang,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            onClick={onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
        >
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={onSave}
                className="mac-modal-surface w-full max-w-lg p-6 space-y-4 text-xs"
            >
                <div className="flex items-center justify-between pb-3 border-b mac-divider">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[8px] bg-accent text-white flex items-center justify-center shrink-0">
                            <IconCalendar size={18} />
                        </div>
                        <h3
                            id="schedule-modal-title"
                            className="text-[15px] font-bold"
                        >
                            {editingSchedule
                                ? t.modalEditScheduleTitle
                                : t.modalAddScheduleTitle}
                        </h3>
                    </div>
                    <button
                        type="button"
                        aria-label={t.cancelBtn}
                        onClick={onClose}
                        className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                    >
                        <IconClose size={14} />
                    </button>
                </div>

                {/* Station Selector */}
                <div>
                    <label className="block font-semibold mb-1.5">
                        {t.scheduleStation}
                    </label>
                    <select
                        value={schedStationId}
                        onChange={(e) => setSchedStationId(e.target.value)}
                        className="mac-input w-full px-3 py-2 rounded-[7px]"
                    >
                        {stations.map((st) => (
                            <option key={st.id} value={st.id}>
                                {st.name} ({st.city || st.genre})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Show Name and Host */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleShowName}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Sarapan Seru"
                            value={schedShowName}
                            onChange={(e) => setSchedShowName(e.target.value)}
                            className="mac-input w-full px-3 py-2 rounded-[7px]"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleHost}
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Surya Insomnia & Molan"
                            value={schedHost}
                            onChange={(e) => setSchedHost(e.target.value)}
                            className="mac-input w-full px-3 py-2 rounded-[7px]"
                        />
                    </div>
                </div>

                {/* Days of Week Selection */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="font-semibold">
                            {t.scheduleDays}
                        </label>
                        <div className="flex gap-2 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setSchedDays([1, 2, 3, 4, 5])}
                                className="text-accent hover:underline cursor-pointer"
                            >
                                {t.scheduleDaysWeekdays}
                            </button>
                            <span className="text-secondary">·</span>
                            <button
                                type="button"
                                onClick={() =>
                                    setSchedDays([0, 1, 2, 3, 4, 5, 6])
                                }
                                className="text-accent hover:underline cursor-pointer"
                            >
                                {t.scheduleDaysAll}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {dayLabels.map((day) => {
                            const isChecked = schedDays.includes(day.day);
                            return (
                                <button
                                    key={day.day}
                                    type="button"
                                    onClick={() => {
                                        if (isChecked) {
                                            if (schedDays.length > 1) {
                                                setSchedDays(
                                                    schedDays.filter(
                                                        (d) => d !== day.day
                                                    )
                                                );
                                            }
                                        } else {
                                            setSchedDays(
                                                [...schedDays, day.day].sort()
                                            );
                                        }
                                    }}
                                    className={`py-2 rounded-[7px] text-[11px] font-semibold text-center transition cursor-pointer ${
                                        isChecked
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'mac-glass-pill text-secondary'
                                    }`}
                                >
                                    {lang === 'id' ? day.labelId : day.labelEn}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Window */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleStartTime}
                        </label>
                        <input
                            type="time"
                            required
                            value={schedStartTime}
                            onChange={(e) => setSchedStartTime(e.target.value)}
                            className="mac-input w-full px-3 py-2 rounded-[7px] font-mono text-[13px]"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleEndTime}
                        </label>
                        <input
                            type="time"
                            required
                            value={schedEndTime}
                            onChange={(e) => setSchedEndTime(e.target.value)}
                            className="mac-input w-full px-3 py-2 rounded-[7px] font-mono text-[13px]"
                        />
                    </div>
                </div>

                {/* Autoplay & Reminder Setting */}
                <div className="p-3 rounded-[8px] bg-black/5 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold text-[13px]">
                                {t.scheduleAutoPlay}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5">
                                {t.scheduleAutoPlayDesc}
                            </div>
                        </div>
                        <MacToggle
                            checked={schedAutoPlay}
                            onChange={setSchedAutoPlay}
                            label={t.scheduleAutoPlay}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t mac-divider">
                        <span className="font-semibold text-[12px]">
                            {t.scheduleReminder}
                        </span>
                        <select
                            value={schedReminderMinutes}
                            onChange={(e) =>
                                setSchedReminderMinutes(
                                    parseInt(e.target.value, 10)
                                )
                            }
                            className="mac-input px-2.5 py-1 rounded-[6px]"
                        >
                            <option value={0}>
                                {t.scheduleReminderAtStart}
                            </option>
                            <option value={5}>{t.scheduleReminder5m}</option>
                            <option value={10}>{t.scheduleReminder10m}</option>
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block font-semibold mb-1.5">
                        {t.scheduleNotes}
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Program pagi favorit dengan info lalu lintas & kuis"
                        value={schedNotes}
                        onChange={(e) => setSchedNotes(e.target.value)}
                        className="mac-input w-full px-3 py-2 rounded-[7px]"
                    />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t mac-divider">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                    >
                        {t.cancelBtn}
                    </button>
                    <button
                        type="submit"
                        className="bg-accent hover:opacity-90 text-white px-5 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                    >
                        {t.saveBtn}
                    </button>
                </div>
            </form>
        </div>
    );
};
