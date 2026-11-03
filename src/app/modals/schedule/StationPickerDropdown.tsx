import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Station } from '../../../types';
import { StationAvatar } from '../../../components/StationAvatar';
import {
    IconChevronDown,
    IconSearch,
    IconClose,
    IconCheck
} from '../../../components/Icons';

export interface StationPickerDropdownProps {
    stations: Station[];
    schedStationId: string;
    setSchedStationId: (id: string) => void;
    label: string;
    lang: string;
    onResolveLogo?: (url: string) => Promise<string | null>;
}

export const StationPickerDropdown: React.FC<StationPickerDropdownProps> = ({
    stations,
    schedStationId,
    setSchedStationId,
    label,
    lang,
    onResolveLogo
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedStation = useMemo(
        () => stations.find((s) => s.id === schedStationId) || stations[0],
        [stations, schedStationId]
    );

    const filteredStations = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return stations;
        return stations.filter(
            (st) =>
                st.name.toLowerCase().includes(q) ||
                (st.city && st.city.toLowerCase().includes(q)) ||
                (st.genre && st.genre.toLowerCase().includes(q))
        );
    }, [stations, searchQuery]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <label className="block font-semibold mb-1.5">{label}</label>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
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
                            (selectedStation.city || selectedStation.genre) && (
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
                        isOpen ? 'rotate-180' : ''
                    }`}
                >
                    <IconChevronDown size={14} />
                </span>
            </button>

            {/* Custom Station Dropdown Panel */}
            {isOpen && (
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
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    lang === 'id'
                                        ? 'Cari stasiun radio...'
                                        : 'Search radio stations...'
                                }
                                className="w-full bg-transparent border-0 p-0 text-[11px] text-foreground focus:outline-none placeholder:text-secondary/60"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
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
                                        setIsOpen(false);
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
                                            onResolveLogo={onResolveLogo}
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
    );
};
