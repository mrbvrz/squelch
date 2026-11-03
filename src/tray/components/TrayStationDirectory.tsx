import React from 'react';
import type { Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import { IconPlay, IconRadioTower, IconSearch, IconStar } from '../../components/Icons';

export interface TrayStationDirectoryProps {
    stations: Station[];
    groups: string[];
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    searchText: string;
    setSearchText: (text: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    currentStation: Station | null;
    isPlaying: boolean;
    isBusy: boolean;
    favCount: number;
    filteredStations: Station[];
    onPlayStation: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onOpenDiscover: () => void;
    t: TranslationDictionary;
}

export const TrayStationDirectory: React.FC<TrayStationDirectoryProps> = ({
    stations,
    groups,
    activeFilter,
    setActiveFilter,
    searchText,
    setSearchText,
    searchInputRef,
    currentStation,
    isPlaying,
    isBusy,
    favCount,
    filteredStations,
    onPlayStation,
    onToggleFavorite,
    onOpenDiscover,
    t
}) => {
    return (
        <div className="mac-settings-card mt-2.5 p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mb-2">
                <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 tabular-nums cursor-pointer transition ${
                        activeFilter === 'ALL'
                            ? 'bg-accent text-white'
                            : 'mac-glass-pill'
                    }`}
                >
                    {t.trayAllFilter} ({stations.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveFilter('FAV')}
                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 tabular-nums flex items-center gap-1 cursor-pointer transition ${
                        activeFilter === 'FAV'
                            ? 'bg-accent text-white'
                            : 'mac-glass-pill'
                    }`}
                >
                    <IconStar size={11} filled={activeFilter === 'FAV'} />
                    <span>
                        {t.trayFavFilter} ({favCount})
                    </span>
                </button>
                {groups.map((grp) => (
                    <button
                        key={grp}
                        type="button"
                        onClick={() => setActiveFilter(grp)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 cursor-pointer transition ${
                            activeFilter === grp
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
                        }`}
                    >
                        {grp.split(' ')[0]}
                    </button>
                ))}
            </div>

            <div className="relative flex items-center mb-2">
                <IconSearch
                    size={13}
                    className="absolute left-2.5 text-muted pointer-events-none"
                />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={t.traySearchPlaceholder}
                    aria-label={t.traySearchPlaceholder}
                    className="mac-input w-full pl-7 pr-2.5 py-1.5 rounded-[7px] text-[11px]"
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                {stations.length === 0 ? (
                    <div className="py-8 text-center text-xs text-secondary flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                            <IconRadioTower size={20} />
                        </div>
                        <span className="font-semibold">
                            {t.emptyStationsTitle}
                        </span>
                        <p className="text-[11px] text-muted max-w-[220px] leading-tight">
                            {t.emptyStationsDesc}
                        </p>
                        <button
                            type="button"
                            onClick={onOpenDiscover}
                            className="mt-1 bg-accent text-white hover:opacity-90 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition cursor-pointer shadow-sm"
                        >
                            {t.trayDiscover}
                        </button>
                    </div>
                ) : filteredStations.length === 0 ? (
                    <div className="py-8 text-center text-xs text-secondary flex flex-col items-center justify-center gap-1.5">
                        <IconSearch size={18} className="opacity-40" />
                        <span>{t.emptyStationsText}</span>
                    </div>
                ) : (
                    filteredStations.map((st) => {
                        const active =
                            currentStation?.id === st.id &&
                            (isPlaying || isBusy);
                        return (
                            <div
                                key={st.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => onPlayStation(st.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onPlayStation(st.id);
                                    }
                                }}
                                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[7px] cursor-pointer text-xs transition ${
                                    active
                                        ? 'mac-row-selected font-semibold'
                                        : 'mac-row'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {active ? (
                                        <IconPlay
                                            size={10}
                                            className="text-[#30D158] shrink-0 animate-pulse"
                                        />
                                    ) : (
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                st.status === 'online'
                                                    ? 'bg-[#30D158]/70'
                                                    : 'bg-[#FF453A]/70'
                                            }`}
                                        />
                                    )}
                                    <span className="font-medium truncate">
                                        {st.name}
                                    </span>
                                    <span className="text-[11px] text-muted truncate">
                                        {st.city}
                                    </span>
                                </div>

                                <div className="flex items-center shrink-0 ml-2">
                                    <button
                                        type="button"
                                        aria-label={st.name}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(st.id);
                                        }}
                                        className={`p-0.5 rounded-[5px] cursor-pointer transition ${
                                            st.isFavorite
                                                ? 'text-[#FF9F0A]'
                                                : 'text-muted opacity-55 group-hover:opacity-100'
                                        }`}
                                    >
                                        <IconStar
                                            size={13}
                                            filled={st.isFavorite}
                                        />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
