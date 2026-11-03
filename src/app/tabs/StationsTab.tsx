import React from 'react';
import type { Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { ActiveTab, SquelchWindowApi } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import {
    IconClose,
    IconCompass,
    IconDots,
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

    const moreMenuRef = React.useRef<HTMLDivElement>(null);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

    const offlineCount = React.useMemo(
        () => stations.filter((s) => s.status === 'offline').length,
        [stations]
    );

    React.useEffect(() => {
        if (!isMoreMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                moreMenuRef.current &&
                !moreMenuRef.current.contains(e.target as Node)
            ) {
                setIsMoreMenuOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMoreMenuOpen]);

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
            {/* Category Filter Bar: Single Row, Horizontally Scrollable */}
            <div className="flex items-center gap-1.5 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap flex-1 min-w-0 py-0.5">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedGroup('ALL');
                            setFavoritesOnly(false);
                        }}
                        className={`px-3.5 h-[30px] rounded-[6px] text-[12px] font-medium tabular-nums cursor-pointer transition whitespace-nowrap shadow-xs shrink-0 flex items-center justify-center ${
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
                        className={`px-3.5 h-[30px] rounded-[6px] text-[12px] font-medium tabular-nums flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shadow-xs shrink-0 ${
                            favoritesOnly
                                ? 'bg-accent text-white font-semibold'
                                : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                        }`}
                    >
                        <IconStar size={12} filled={favoritesOnly} />
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
                                className={`px-3.5 h-[30px] rounded-[6px] text-[12px] font-medium cursor-pointer transition whitespace-nowrap shadow-xs shrink-0 flex items-center justify-center ${
                                    active
                                        ? 'bg-accent text-white font-semibold'
                                        : 'mac-glass-pill hover:bg-black/5 dark:hover:bg-white/10 text-secondary hover:text-foreground'
                                }`}
                            >
                                {grp}
                            </button>
                        );
                    })}
                </div>

                {/* Popover / Tooltip Input for Adding Category */}
                <div className="relative inline-block z-40 shrink-0" ref={popoverRef}>
                    <button
                        type="button"
                        onClick={() => setIsAddingGroup((v) => !v)}
                        className={`mac-glass-pill w-[30px] h-[30px] rounded-[6px] flex items-center justify-center cursor-pointer transition shadow-xs ${
                            isAddingGroup
                                ? 'bg-black/10 dark:bg-white/15 text-foreground'
                                : 'hover:bg-black/10 dark:hover:bg-white/15 text-secondary hover:text-foreground'
                        }`}
                        title={t.addGroupTitle}
                        aria-label={t.addGroupTitle}
                        aria-expanded={isAddingGroup}
                    >
                        <IconPlus size={14} />
                    </button>

                    {isAddingGroup && (
                        <div
                            className={`absolute ${
                                popoverAlignRight ? 'right-0' : 'left-0'
                            } top-full mt-2 z-50 w-64 mac-modal-surface rounded-xl shadow-2xl p-2.5 backdrop-blur-2xl animate-scale-enter border border-black/10 dark:border-white/10`}
                        >
                            {/* Seamless SVG Caret pointing up to the button */}
                            <svg
                                className={`absolute -top-[7px] ${
                                    popoverAlignRight ? 'right-2' : 'left-2'
                                } pointer-events-none drop-shadow-xs`}
                                width="16"
                                height="8"
                                viewBox="0 0 16 8"
                            >
                                <polygon
                                    points="0,8 8,0 16,8"
                                    style={{ fill: 'var(--surface-modal, #202022)' }}
                                />
                                <path
                                    d="M0 8 L8 0.5 L16 8"
                                    fill="none"
                                    strokeWidth="1"
                                    className="stroke-black/15 dark:stroke-white/15"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
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

                    {/* Button Group: + Add Station | 3-dot Dropdown */}
                    <div className="relative inline-flex items-center" ref={moreMenuRef}>
                        {/* Primary Action: Add Station */}
                        <button
                            type="button"
                            onClick={openAddStationModal}
                            className="bg-accent hover:opacity-95 text-white pl-3 pr-2.5 h-[30px] rounded-l-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                            <IconPlus size={13} />
                            <span>{t.addStation}</span>
                        </button>

                        {/* Thin clean Divider */}
                        <div className="w-[1px] h-[30px] bg-white/20" />

                        {/* Secondary Action: 3-dot Ellipsis */}
                        <button
                            type="button"
                            onClick={() => setIsMoreMenuOpen((v) => !v)}
                            aria-expanded={isMoreMenuOpen}
                            aria-label="More options"
                            className={`bg-accent hover:opacity-95 text-white px-2 h-[30px] rounded-r-[7px] flex items-center justify-center shadow-sm cursor-pointer transition ${
                                isMoreMenuOpen ? 'opacity-90' : ''
                            }`}
                        >
                            <IconDots size={16} />
                        </button>

                        {/* Dropdown Menu for 3-dot Ellipsis */}
                        {isMoreMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 mac-modal-surface rounded-xl shadow-2xl p-1.5 backdrop-blur-2xl animate-scale-enter border border-black/10 dark:border-white/10 flex flex-col gap-0.5">
                                {/* 1. Import / Export */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMoreMenuOpen(false);
                                        void handleExportLoad('json');
                                        setIsImportExportOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                                >
                                    <IconTransfer size={14} className="text-secondary shrink-0" />
                                    <span className="flex-1 text-left">{t.importExport}</span>
                                </button>

                                {/* 2. Verify Stream */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMoreMenuOpen(false);
                                        void handleRunHealthCheck();
                                    }}
                                    disabled={isCheckingHealth}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition cursor-pointer"
                                >
                                    {isCheckingHealth ? (
                                        <IconSpinner size={14} className="animate-spin text-accent shrink-0" />
                                    ) : (
                                        <IconPulse size={14} className="text-secondary shrink-0" />
                                    )}
                                    <span className="flex-1 text-left">
                                        {isCheckingHealth ? t.checkingHealth : t.healthCheck}
                                    </span>
                                </button>

                                {/* 3. Hide Offline */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHideOffline((v) => !v);
                                        setIsMoreMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                                >
                                    {hideOffline ? (
                                        <IconEyeSlash size={14} className="text-secondary shrink-0" />
                                    ) : (
                                        <IconEye size={14} className="text-secondary shrink-0" />
                                    )}
                                    <span className="flex-1 text-left">
                                        {hideOffline ? t.showOffline : t.hideOffline}
                                    </span>
                                    {hideOffline && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    )}
                                </button>

                                {/* Separator */}
                                <div className="h-px bg-black/5 dark:bg-white/10 my-0.5" />

                                {/* 4. Delete Offline */}
                                <button
                                    type="button"
                                    disabled={offlineCount === 0}
                                    onClick={() => {
                                        setIsMoreMenuOpen(false);
                                        void api.removeOfflineStations().then(refreshAll);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-[#FF453A] hover:bg-[#FF453A]/10 disabled:opacity-35 disabled:hover:bg-transparent transition cursor-pointer"
                                >
                                    <IconTrash size={14} className="shrink-0" />
                                    <span className="flex-1 text-left">{t.removeOffline}</span>
                                    {offlineCount > 0 && (
                                        <span className="text-[10px] tabular-nums font-semibold bg-[#FF453A]/15 px-1.5 py-0.5 rounded-full">
                                            {offlineCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
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
