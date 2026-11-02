import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ShowSchedule, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import {
    IconCalendar,
    IconClose,
    IconChevronDown,
    IconSearch,
    IconCheck
} from '../../components/Icons';
import { MacToggle } from '../../components/MacToggle';
import { StationAvatar } from '../../components/StationAvatar';

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
    onResolveLogo?: (url: string) => Promise<string | null>;
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
    t,
    onResolveLogo
}) => {
    const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);
    const [stationSearchQuery, setStationSearchQuery] = useState('');
    const stationDropdownContainerRef = useRef<HTMLDivElement>(null);
    const stationSearchInputRef = useRef<HTMLInputElement>(null);

    // Close station dropdown on click outside or Escape
    useEffect(() => {
        if (!isStationDropdownOpen) {
            setStationSearchQuery('');
            return;
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (
                stationDropdownContainerRef.current &&
                !stationDropdownContainerRef.current.contains(e.target as Node)
            ) {
                setIsStationDropdownOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsStationDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isStationDropdownOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isStationDropdownOpen) {
            requestAnimationFrame(() => {
                stationSearchInputRef.current?.focus();
            });
        }
    }, [isStationDropdownOpen]);

    // Reset dropdown state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsStationDropdownOpen(false);
            setStationSearchQuery('');
        }
    }, [isOpen]);

    const selectedStation = useMemo(() => {
        return (
            stations.find((st) => st.id === schedStationId) ||
            stations[0] ||
            null
        );
    }, [stations, schedStationId]);

    const filteredStations = useMemo(() => {
        const q = stationSearchQuery.trim().toLowerCase();
        if (!q) return stations;
        return stations.filter(
            (st) =>
                st.name.toLowerCase().includes(q) ||
                (st.city && st.city.toLowerCase().includes(q)) ||
                (st.genre && st.genre.toLowerCase().includes(q))
        );
    }, [stations, stationSearchQuery]);

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

                {/* Station Selector with Images */}
                <div ref={stationDropdownContainerRef} className="relative">
                    <label className="block font-semibold mb-1.5">
                        {t.scheduleStation}
                    </label>
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isStationDropdownOpen}
                        onClick={() =>
                            setIsStationDropdownOpen((prev) => !prev)
                        }
                        className="mac-input w-full px-3 py-2 rounded-[8px] cursor-pointer flex items-center justify-between gap-2.5 text-left hover:border-accent/40 transition shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                            <StationAvatar
                                logoUrl={selectedStation?.logoUrl}
                                size="xs"
                                onResolveLogo={onResolveLogo}
                            />
                            <div className="truncate flex items-baseline gap-2">
                                <span className="font-semibold text-[13px] text-foreground truncate">
                                    {selectedStation?.name || 'Pilih Stasiun'}
                                </span>
                                {selectedStation &&
                                    (selectedStation.city ||
                                        selectedStation.genre) && (
                                        <span className="text-[11px] text-secondary truncate hidden sm:inline">
                                            (
                                            {selectedStation.city ||
                                                selectedStation.genre}
                                            )
                                        </span>
                                    )}
                            </div>
                        </div>
                        <span
                            className={`text-secondary shrink-0 transition-transform duration-150 ${
                                isStationDropdownOpen ? 'rotate-180' : ''
                            }`}
                        >
                            <IconChevronDown size={14} />
                        </span>
                    </button>

                    {/* Custom Station Dropdown Panel */}
                    {isStationDropdownOpen && (
                        <div
                            role="listbox"
                            className="absolute left-0 right-0 top-full mt-1.5 z-50 mac-modal-surface rounded-xl shadow-2xl p-2 text-xs flex flex-col gap-1.5 backdrop-blur-xl animate-scale-enter border border-black/10 dark:border-white/10"
                        >
                            {/* Search Box if stations > 5 */}
                            {stations.length > 5 && (
                                <div className="relative flex items-center px-2 py-1 rounded-[7px] mac-input focus-within:border-accent/60 transition">
                                    <span className="text-secondary shrink-0 mr-1.5">
                                        <IconSearch size={13} />
                                    </span>
                                    <input
                                        ref={stationSearchInputRef}
                                        type="text"
                                        value={stationSearchQuery}
                                        onChange={(e) =>
                                            setStationSearchQuery(
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            lang === 'id'
                                                ? 'Cari stasiun radio...'
                                                : 'Search radio stations...'
                                        }
                                        className="w-full bg-transparent border-0 p-0 text-[11px] text-foreground focus:outline-none placeholder:text-secondary/60"
                                    />
                                    {stationSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setStationSearchQuery('')
                                            }
                                            className="text-secondary hover:text-foreground ml-1 shrink-0 p-0.5 rounded cursor-pointer"
                                        >
                                            <IconClose size={11} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Scrollable Station List with Logos */}
                            <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                                {filteredStations.map((st) => {
                                    const isSelected = st.id === schedStationId;
                                    return (
                                        <button
                                            key={st.id}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                setSchedStationId(st.id);
                                                setIsStationDropdownOpen(false);
                                            }}
                                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-left flex items-center justify-between gap-2.5 cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-accent text-white font-medium shadow-xs'
                                                    : 'mac-row text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate min-w-0">
                                                <StationAvatar
                                                    logoUrl={st.logoUrl}
                                                    size="xs"
                                                    onResolveLogo={
                                                        onResolveLogo
                                                    }
                                                />
                                                <div className="truncate">
                                                    <div
                                                        className={`text-[12px] font-semibold truncate ${
                                                            isSelected
                                                                ? 'text-white'
                                                                : 'text-foreground'
                                                        }`}
                                                    >
                                                        {st.name}
                                                    </div>
                                                    {(st.city || st.genre) && (
                                                        <div
                                                            className={`text-[10px] truncate ${
                                                                isSelected
                                                                    ? 'text-white/80'
                                                                    : 'text-secondary'
                                                            }`}
                                                        >
                                                            {st.city}
                                                            {st.city && st.genre
                                                                ? ' • '
                                                                : ''}
                                                            {st.genre}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <IconCheck
                                                    size={14}
                                                    className="shrink-0 text-white ml-2"
                                                />
                                            )}
                                        </button>
                                    );
                                })}

                                {filteredStations.length === 0 && (
                                    <div className="py-6 text-center text-secondary text-[11px]">
                                        {lang === 'id'
                                            ? 'Tidak ada stasiun yang cocok'
                                            : 'No matching stations'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
