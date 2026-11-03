import React from 'react';
import type { Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { ActiveTab, SquelchWindowApi } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import {
    IconClose,
    IconCompass,
    IconEdit,
    IconEye,
    IconEyeSlash,
    IconPlay,
    IconPlus,
    IconPulse,
    IconRadioTower,
    IconSearch,
    IconSpinner,
    IconStar,
    IconStop,
    IconTrash,
    IconTransfer
} from '../../components/Icons';

export interface StationsTabProps {
    isLoading?: boolean;
    stations: Station[];
    filteredStations: Station[];
    groups: string[];
    selectedGroup: string;
    setSelectedGroup: (grp: string) => void;
    favoritesOnly: boolean;
    setFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
    favCount: number;
    hideOffline: boolean;
    setHideOffline: React.Dispatch<React.SetStateAction<boolean>>;
    isCheckingHealth: boolean;
    handleRunHealthCheck: () => Promise<void>;
    isAddingGroup: boolean;
    setIsAddingGroup: React.Dispatch<React.SetStateAction<boolean>>;
    newGroupName: string;
    setNewGroupName: (name: string) => void;
    handleAddGroup: (e: React.FormEvent) => void;
    currentHeadingTitle: string;
    openAddStationModal: () => void;
    openEditStationModal: (st: Station) => void;
    handleExportLoad: (format: 'json' | 'm3u' | 'pls') => Promise<void>;
    setIsImportExportOpen: (open: boolean) => void;
    setActiveTab: (tab: ActiveTab) => void;
    isPlayingStation: (stationId: string) => boolean;
    draggedStationId: string | null;
    setDraggedStationId: (id: string | null) => void;
    handleDropStation: (targetStationId: string) => Promise<void>;
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
    t: TranslationDictionary;
}

export const StationsTab: React.FC<StationsTabProps> = ({
    isLoading,
    stations,
    filteredStations,
    groups,
    selectedGroup,
    setSelectedGroup,
    favoritesOnly,
    setFavoritesOnly,
    favCount,
    hideOffline,
    setHideOffline,
    isCheckingHealth,
    handleRunHealthCheck,
    isAddingGroup,
    setIsAddingGroup,
    newGroupName,
    setNewGroupName,
    handleAddGroup,
    currentHeadingTitle,
    openAddStationModal,
    openEditStationModal,
    handleExportLoad,
    setIsImportExportOpen,
    setActiveTab,
    isPlayingStation,
    setDraggedStationId,
    handleDropStation,
    api,
    refreshAll,
    t
}) => {
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const addGroupInputRef = React.useRef<HTMLInputElement>(null);
    const [popoverAlignRight, setPopoverAlignRight] = React.useState(false);

    React.useEffect(() => {
        if (!isAddingGroup) return;
        const updateAlign = () => {
            if (popoverRef.current) {
                const rect = popoverRef.current.getBoundingClientRect();
                setPopoverAlignRight(window.innerWidth - rect.left < 275);
            }
        };
        updateAlign();
        window.addEventListener('resize', updateAlign);

        requestAnimationFrame(() => {
            addGroupInputRef.current?.focus();
        });
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node)
            ) {
                setIsAddingGroup(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsAddingGroup(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('resize', updateAlign);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isAddingGroup, setIsAddingGroup]);

    return (
        <div
            key="tab-stations"
            className={`max-w-3xl animate-tab-enter text-xs ${
                !isLoading && stations.length === 0
                    ? 'flex-1 flex flex-col items-center justify-center min-h-[460px] my-auto'
                    : 'space-y-6'
            }`}
        >
            {isLoading ? (
                <div className="space-y-4">
                    <div className="mac-settings-card px-4 py-3 flex items-center justify-between">
                        <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                        <div className="h-6 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                    </div>
                    <div className="mac-settings-card mac-inset-list overflow-hidden p-3 space-y-3">
                        {[1, 2, 3, 4, 5].map((idx) => (
                            <div key={idx} className="flex items-center gap-3.5 px-3 py-2 animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3.5 w-1/3 rounded bg-black/10 dark:bg-white/10" />
                                    <div className="h-2.5 w-1/5 rounded bg-black/5 dark:bg-white/5" />
                                </div>
                                <div className="w-6 h-6 rounded bg-black/5 dark:bg-white/5" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : stations.length === 0 ? (
                /* Empty state without card wrapper; positioned dead-center in the window */
                <div className="text-center flex flex-col items-center justify-center gap-3 my-auto py-12">
                    <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary">
                        <IconRadioTower size={28} className="opacity-70" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-[15px] font-bold text-foreground">
                            {t.emptyStationsTitle}
                        </h3>
                        <p className="text-[12px] text-secondary mt-1 leading-relaxed">
                            {t.emptyStationsDesc}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={openAddStationModal}
                            className="bg-accent hover:opacity-90 text-white px-4 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                            <IconPlus size={13} />
                            <span>{t.addStation}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('discover')}
                            className="mac-glass-pill hover:bg-white/15 px-4 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                        >
                            <IconCompass size={13} />
                            <span>{t.emptyStationsDiscoverBtn}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsImportExportOpen(true)}
                            className="mac-glass-pill hover:bg-white/15 px-4 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                        >
                            <IconTransfer size={13} />
                            <span>{t.importExport}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
            {/* Category Filter Pills (WhatsApp / Segmented style) */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
                <button
                    type="button"
                    onClick={() => {
                        setSelectedGroup('ALL');
                        setFavoritesOnly(false);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium tabular-nums cursor-pointer transition whitespace-nowrap shadow-xs ${
                        selectedGroup === 'ALL' && !favoritesOnly
                            ? 'bg-accent text-white font-semibold'
                            : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                    }`}
                >
                    {t.allGroups} ({stations.length})
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setSelectedGroup('ALL');
                        setFavoritesOnly(true);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium tabular-nums flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shadow-xs ${
                        favoritesOnly
                            ? 'bg-accent text-white font-semibold'
                            : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                    }`}
                >
                    <IconStar size={11} filled={favoritesOnly} />
                    <span>
                        {t.favoritesOnly} ({favCount})
                    </span>
                </button>

                {groups.map((grp) => {
                    const active = selectedGroup === grp && !favoritesOnly;
                    return (
                        <button
                            key={grp}
                            type="button"
                            onClick={() => {
                                setSelectedGroup(grp);
                                setFavoritesOnly(false);
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition whitespace-nowrap shadow-xs ${
                                active
                                    ? 'bg-accent text-white font-semibold'
                                    : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                            }`}
                        >
                            {grp}
                        </button>
                    );
                })}

                {/* Popover / Tooltip Input for Adding Category */}
                <div className="relative inline-block z-40" ref={popoverRef}>
                    <button
                        type="button"
                        onClick={() => setIsAddingGroup((v) => !v)}
                        className={`mac-glass-pill w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition shadow-xs ${
                            isAddingGroup
                                ? 'bg-black/10 dark:bg-white/15 text-foreground'
                                : 'hover:bg-black/10 dark:hover:bg-white/15 text-secondary hover:text-foreground'
                        }`}
                        title={t.addGroupTitle}
                        aria-label={t.addGroupTitle}
                        aria-expanded={isAddingGroup}
                    >
                        <IconPlus size={13} />
                    </button>

                    {isAddingGroup && (
                        <div
                            className={`absolute ${
                                popoverAlignRight ? 'right-0' : 'left-0'
                            } top-full mt-2 z-50 w-64 mac-modal-surface rounded-xl shadow-2xl p-2.5 backdrop-blur-2xl animate-scale-enter border border-black/10 dark:border-white/10`}
                        >
                            {/* SVG Caret pointing up to the button */}
                            <svg
                                className={`absolute -top-2 ${
                                    popoverAlignRight ? 'right-2.5' : 'left-2.5'
                                } pointer-events-none drop-shadow-xs`}
                                width="14"
                                height="8"
                                viewBox="0 0 14 8"
                            >
                                <path
                                    d="M7 0L14 8H0L7 0Z"
                                    fill="var(--surface-modal, #1e1e1e)"
                                />
                                <path
                                    d="M7 0.5L13.5 8M7 0.5L0.5 8"
                                    stroke="var(--card-border, rgba(255,255,255,0.15))"
                                    strokeWidth="1"
                                    fill="none"
                                />
                            </svg>
                            <form onSubmit={handleAddGroup} className="flex flex-col gap-2 relative z-10">
                                <div className="flex items-center justify-between px-0.5 text-[11px] font-semibold text-foreground">
                                    <span>{t.addGroupTitle}</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingGroup(false)}
                                        className="text-secondary hover:text-foreground p-0.5 cursor-pointer rounded"
                                        aria-label="Tutup"
                                    >
                                        <IconClose size={12} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        ref={addGroupInputRef}
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder={t.addGroupPlaceholder}
                                        className="mac-input flex-1 px-2.5 py-1 rounded-[6px] text-[11px] text-foreground focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setIsAddingGroup(false);
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newGroupName.trim() || groups.includes(newGroupName.trim())}
                                        className="bg-accent disabled:opacity-40 text-white px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer transition shrink-0 shadow-xs"
                                    >
                                        {t.saveGroupBtn}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Section: My Stations Header & Controls */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-[13px] font-bold">
                            {currentHeadingTitle} ({filteredStations.length})
                        </h2>
                        {selectedGroup !== 'ALL' && groups.includes(selectedGroup) && (
                            <button
                                type="button"
                                onClick={() => {
                                    void api.deleteGroup(selectedGroup);
                                    setSelectedGroup('ALL');
                                }}
                                className="text-[11px] text-[#FF453A] hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <IconTrash size={11} />
                                <span>{t.deleteGroupBtn}</span>
                            </button>
                        )}
                    </div>

                    {/* Integrated Action Toolbar: Stream Health Icons + Import/Export + Add Station */}
                    <div className="flex items-center gap-1.5">
                        {/* Sembunyikan / Tampilkan Offline (Icon button) */}
                        <button
                            type="button"
                            onClick={() => setHideOffline((v) => !v)}
                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition cursor-pointer shadow-xs ${
                                hideOffline
                                    ? 'bg-accent text-white font-semibold'
                                    : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                            }`}
                            title={hideOffline ? t.showOffline : t.hideOffline}
                            aria-label={hideOffline ? t.showOffline : t.hideOffline}
                        >
                            {hideOffline ? <IconEyeSlash size={13} /> : <IconEye size={13} />}
                        </button>

                        {/* Periksa Stream (Icon button) */}
                        <button
                            type="button"
                            onClick={() => void handleRunHealthCheck()}
                            disabled={isCheckingHealth}
                            className="w-7 h-7 rounded-[7px] mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer disabled:opacity-50 text-secondary hover:text-foreground shadow-xs"
                            title={isCheckingHealth ? t.checkingHealth : t.healthCheck}
                            aria-label={t.healthCheck}
                        >
                            {isCheckingHealth ? (
                                <IconSpinner size={13} className="animate-spin text-accent" />
                            ) : (
                                <IconPulse size={13} />
                            )}
                        </button>

                        {/* Hapus Offline jika ada stasiun offline (Badge icon button) */}
                        {stations.some((s) => s.status === 'offline') && (
                            <button
                                type="button"
                                onClick={() =>
                                    void api
                                        .removeOfflineStations()
                                        .then(refreshAll)
                                }
                                className="h-7 px-2 rounded-[7px] mac-glass-pill text-[#FF453A] hover:bg-[#FF453A]/10 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title={t.removeOffline}
                                aria-label={t.removeOffline}
                            >
                                <IconTrash size={12} />
                                <span className="text-[10px] tabular-nums font-semibold">
                                    {stations.filter((s) => s.status === 'offline').length}
                                </span>
                            </button>
                        )}

                        {/* Separator */}
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />

                        {/* Import & Export */}
                        <button
                            type="button"
                            onClick={() => {
                                void handleExportLoad('json');
                                setIsImportExportOpen(true);
                            }}
                            className="mac-glass-pill px-2.5 h-7 rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition text-secondary hover:text-foreground shadow-xs"
                        >
                            <IconTransfer size={12} />
                            <span>{t.importExport}</span>
                        </button>

                        {/* Tambah Stasiun */}
                        <button
                            type="button"
                            onClick={openAddStationModal}
                            className="bg-accent hover:opacity-90 text-white px-3 h-7 rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                            <IconPlus size={12} />
                            <span>{t.addStation}</span>
                        </button>
                    </div>
                </div>

                <div className="mac-settings-card mac-inset-list overflow-hidden">
                    {filteredStations.length === 0 ? (
                        <div className="p-10 text-center text-xs text-secondary flex flex-col items-center justify-center gap-2">
                            <IconSearch size={22} className="opacity-40" />
                            <span>{t.emptyStationsText}</span>
                        </div>
                    ) : (
                        filteredStations.map((st) => {
                            const active = isPlayingStation(st.id);
                            return (
                                <div
                                    key={st.id}
                                    draggable
                                    onDragStart={() =>
                                        setDraggedStationId(st.id)
                                    }
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => void handleDropStation(st.id)}
                                    onClick={() => void api.playStation(st.id)}
                                    className="group px-4 py-3 flex items-center justify-between gap-4 cursor-pointer mac-row"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <StationAvatar
                                            logoUrl={st.logoUrl}
                                            size="sm"
                                            onResolveLogo={(url) =>
                                                api.resolveStationLogo(url)
                                            }
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="text-[13px] font-medium truncate">
                                                {st.name}
                                            </div>
                                            <div className="text-[12px] text-secondary truncate mt-0.5 flex items-center gap-1.5">
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-[2px] shrink-0 ${
                                                        active
                                                            ? 'bg-[#30D158]'
                                                            : st.status ===
                                                                'online'
                                                              ? 'bg-[#30D158]/70'
                                                              : 'bg-[#FF453A]/70'
                                                    }`}
                                                />
                                                <span>
                                                    {active
                                                        ? `${t.connectedBadge} · ${st.genre} · ${st.city}`
                                                        : `${st.genre} · ${st.city} · ${st.group}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 shrink-0"
                                    >
                                        <button
                                            type="button"
                                            aria-label={st.name}
                                            onClick={() =>
                                                void api
                                                    .toggleFavorite(st.id)
                                                    .then(refreshAll)
                                            }
                                            className={`p-1.5 rounded-[6px] cursor-pointer transition ${
                                                st.isFavorite
                                                    ? 'text-[#FF9F0A]'
                                                    : 'text-secondary opacity-50 hover:opacity-100'
                                            }`}
                                        >
                                            <IconStar
                                                size={14}
                                                filled={st.isFavorite}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            title={active ? t.stop : t.play}
                                            aria-label={
                                                active ? t.stop : t.play
                                            }
                                            onClick={() =>
                                                active
                                                    ? void api.stopPlayback()
                                                    : void api.playStation(
                                                          st.id
                                                      )
                                            }
                                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                active
                                                    ? 'bg-[#30D158] text-white'
                                                    : 'mac-glass-pill hover:bg-white/15'
                                            }`}
                                        >
                                            {active ? (
                                                <IconStop size={12} />
                                            ) : (
                                                <IconPlay size={12} />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditStationModal(st)
                                            }
                                            title={t.edit}
                                            aria-label={t.edit}
                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-current flex items-center justify-center cursor-pointer"
                                        >
                                            <IconEdit size={13} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void api
                                                    .deleteStation(st.id)
                                                    .then(refreshAll)
                                            }
                                            title={t.delete}
                                            aria-label={t.delete}
                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-[#FF453A] flex items-center justify-center cursor-pointer"
                                        >
                                            <IconTrash size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    )}
</div>
    );
};
