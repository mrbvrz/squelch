import React from 'react';
import type { ShowSchedule, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import { DAY_LABELS } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import { MacToggle } from '../../components/MacToggle';
import {
    IconBell,
    IconCalendar,
    IconEdit,
    IconPlay,
    IconPlus,
    IconStop,
    IconTrash
} from '../../components/Icons';

export interface SchedulesTabProps {
    schedules: ShowSchedule[];
    stations: Station[];
    currentStation: Station | null;
    isPlaying: boolean;
    isBusy: boolean;
    lang: 'id' | 'en';
    openAddScheduleModal: () => void;
    openEditScheduleModal: (schedule: ShowSchedule) => void;
    handleDeleteSchedule: (id: string) => void;
    handleToggleSchedule: (id: string, enabled?: boolean) => void;
    handleToggleScheduleAutoPlay: (id: string) => void;
    isScheduleCurrentlyOnAir: (schedule: ShowSchedule) => boolean;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
    schedules,
    stations,
    currentStation,
    isPlaying,
    isBusy,
    lang,
    openAddScheduleModal,
    openEditScheduleModal,
    handleDeleteSchedule,
    handleToggleSchedule,
    handleToggleScheduleAutoPlay,
    isScheduleCurrentlyOnAir,
    api,
    t
}) => {
    return (
        <div
            key="tab-schedules"
            className="max-w-3xl space-y-5 animate-tab-enter text-xs"
        >
            {/* Header Card */}
            <div className="mac-settings-card">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-[9px] bg-accent text-white flex items-center justify-center shadow-sm shrink-0">
                            <IconCalendar size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[15px] font-bold">
                                    {t.schedulesTitle}
                                </h2>
                                <span className="px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                                    {schedules.length}
                                </span>
                            </div>
                            <p className="text-[11px] text-secondary mt-0.5 leading-relaxed max-w-lg">
                                {t.schedulesSubtitle}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openAddScheduleModal}
                        className="bg-accent hover:opacity-90 text-white px-3.5 py-1.5 rounded-[7px] font-medium flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition shrink-0"
                    >
                        <IconPlus size={14} />
                        <span>{t.addScheduleBtn}</span>
                    </button>
                </div>
            </div>

            {/* Schedules List */}
            {schedules.length === 0 ? (
                <div className="mac-settings-card p-10 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-[10px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary">
                        <IconCalendar size={24} />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-semibold">
                            {t.scheduleEmptyText}
                        </h3>
                        <p className="text-[12px] text-secondary mt-1">
                            {t.schedulesSubtitle}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openAddScheduleModal}
                        className="mt-2 bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[7px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                    >
                        <IconPlus size={14} />
                        <span>{t.addScheduleBtn}</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {schedules.map((sched) => {
                        const isOnAir = isScheduleCurrentlyOnAir(sched);
                        const matchedStation = stations.find(
                            (s) => s.id === sched.stationId
                        );
                        const isStationActive =
                            currentStation?.id === sched.stationId &&
                            (isPlaying || isBusy);

                        return (
                            <div
                                key={sched.id}
                                className={`mac-settings-card p-4 transition ${
                                    isOnAir ? 'ring-1 ring-[#34C759]/40' : ''
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b mac-divider">
                                    <div className="flex items-center gap-3">
                                        <StationAvatar
                                            logoUrl={
                                                matchedStation?.logoUrl || null
                                            }
                                            size="md"
                                            accentFallback
                                            onResolveLogo={(url) =>
                                                api.resolveStationLogo(url)
                                            }
                                        />
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-[14px] font-bold">
                                                    {sched.showName}
                                                </h3>
                                                {isOnAir && (
                                                    <span className="px-2 py-0.5 rounded-[5px] bg-[#34C759]/20 text-[#34C759] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                                                        {t.scheduleOnAirNow}
                                                    </span>
                                                )}
                                                {sched.autoPlay && (
                                                    <span className="px-1.5 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[10px] font-semibold">
                                                        Autoplay
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[12px] text-secondary mt-0.5 flex flex-wrap items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    {matchedStation?.name ||
                                                        sched.stationName}
                                                </span>
                                                {sched.host && (
                                                    <>
                                                        <span>·</span>
                                                        <span>
                                                            {sched.host}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {/* Enable/Disable Master Toggle */}
                                        <div className="flex items-center gap-2 mr-1">
                                            <MacToggle
                                                checked={sched.enabled}
                                                onChange={() =>
                                                    handleToggleSchedule(
                                                        sched.id
                                                    )
                                                }
                                                label={sched.showName}
                                            />
                                        </div>

                                        {/* Autoplay Toggle */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleToggleScheduleAutoPlay(
                                                    sched.id
                                                )
                                            }
                                            title="Autoplay saat siaran dimulai"
                                            className={`px-2 py-1 rounded-[6px] text-[11px] font-medium transition cursor-pointer ${
                                                sched.autoPlay
                                                    ? 'bg-accent/20 text-accent font-semibold'
                                                    : 'mac-glass-pill text-secondary'
                                            }`}
                                        >
                                            ⚡ Auto
                                        </button>

                                        {/* Play/Stop Station Button */}
                                        <button
                                            type="button"
                                            title={
                                                isStationActive
                                                    ? t.stop
                                                    : t.play
                                            }
                                            onClick={() => {
                                                if (isStationActive) {
                                                    void api.stopPlayback();
                                                } else {
                                                    void api.playStation(
                                                        sched.stationId
                                                    );
                                                }
                                            }}
                                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                isStationActive
                                                    ? 'bg-[#30D158] text-white'
                                                    : 'mac-glass-pill hover:bg-white/15'
                                            }`}
                                        >
                                            {isStationActive ? (
                                                <IconStop size={12} />
                                            ) : (
                                                <IconPlay size={12} />
                                            )}
                                        </button>

                                        {/* Edit */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditScheduleModal(sched)
                                            }
                                            title={t.edit}
                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-foreground flex items-center justify-center cursor-pointer"
                                        >
                                            <IconEdit size={13} />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteSchedule(sched.id)
                                            }
                                            title={t.delete}
                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-[#FF453A] flex items-center justify-center cursor-pointer"
                                        >
                                            <IconTrash size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom Row: Days pills, Time range, Reminder info */}
                                <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
                                    {/* Day pills */}
                                    <div className="flex flex-wrap items-center gap-1">
                                        {DAY_LABELS.map((day) => {
                                            const isSelected =
                                                sched.daysOfWeek.includes(
                                                    day.day
                                                );
                                            return (
                                                <span
                                                    key={day.day}
                                                    className={`px-2 py-0.5 rounded-[5px] font-medium transition ${
                                                        isSelected
                                                            ? 'bg-accent text-white font-semibold'
                                                            : 'bg-black/5 dark:bg-white/5 text-secondary/60'
                                                    }`}
                                                >
                                                    {lang === 'id'
                                                        ? day.labelId
                                                        : day.labelEn}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Time & Reminder info */}
                                    <div className="flex items-center gap-3 text-secondary">
                                        <span className="font-mono font-semibold text-foreground px-2 py-0.5 rounded-[5px] bg-black/5 dark:bg-white/5">
                                            {sched.startTime} – {sched.endTime}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <IconBell
                                                size={12}
                                                className="text-accent"
                                            />
                                            <span>
                                                {sched.reminderMinutes === 0
                                                    ? t.scheduleReminderAtStart
                                                    : `${sched.reminderMinutes}m ${
                                                          lang === 'id'
                                                              ? 'sebelum'
                                                              : 'before'
                                                      }`}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {sched.notes && (
                                    <div className="mt-2 pt-2 border-t mac-divider text-[11px] text-secondary italic">
                                        “{sched.notes}”
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
