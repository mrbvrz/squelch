import React from 'react';
import type { Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { ActiveTab, SquelchWindowApi } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import {
    IconCompass,
    IconEdit,
    IconPlay,
    IconPlus,
    IconPulse,
    IconRadioTower,
    IconSearch,
    IconStar,
    IconStop,
    IconTrash,
    IconTransfer
} from '../../components/Icons';

export interface StationsTabProps {
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
    return (
        <div
            key="tab-stations"
            className={`max-w-3xl animate-tab-enter text-xs ${
                stations.length === 0
                    ? 'flex-1 flex flex-col items-center justify-center min-h-[460px] my-auto'
                    : 'space-y-6'
            }`}
        >
            {stations.length === 0 ? (
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
                            className="bg-accent hover:opacity-90 text-white px-4 h-[34px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                            <IconPlus size={13} />
                            <span>{t.addStation}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('discover')}
                            className="mac-glass-pill hover:bg-white/15 px-4 h-[34px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                        >
                            <IconCompass size={13} />
                            <span>{t.emptyStationsDiscoverBtn}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsImportExportOpen(true)}
                            className="mac-glass-pill hover:bg-white/15 px-4 h-[34px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                        >
                            <IconTransfer size={13} />
                            <span>{t.importExport}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Category Filter Pills & Stream Health Tools */}
            <div className="mac-settings-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedGroup('ALL');
                            setFavoritesOnly(false);
                        }}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium tabular-nums cursor-pointer transition ${
                            selectedGroup === 'ALL' && !favoritesOnly
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
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
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium tabular-nums flex items-center gap-1 cursor-pointer transition ${
                            favoritesOnly
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
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
                                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer transition ${
                                    active
                                        ? 'bg-accent text-white'
                                        : 'mac-glass-pill'
                                }`}
                            >
                                {grp}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsAddingGroup((v) => !v)}
                        className="mac-glass-pill px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer"
                    >
                        {t.addGroupBtn}
                    </button>
                </div>

                {/* Stream Health Tools */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setHideOffline((v) => !v)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer transition ${
                            hideOffline
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
                        }`}
                    >
                        {t.hideOffline}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleRunHealthCheck()}
                        disabled={isCheckingHealth}
                        className="mac-glass-pill px-2.5 py-1 rounded-[6px] text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        <IconPulse size={12} />
                        <span>
                            {isCheckingHealth
                                ? t.checkingHealth
                                : t.healthCheck}
                        </span>
                    </button>
                    {stations.some((s) => s.status === 'offline') && (
                        <button
                            type="button"
                            onClick={() =>
                                void api
                                    .removeOfflineStations()
                                    .then(refreshAll)
                            }
                            className="mac-glass-pill px-2.5 py-1 rounded-[6px] text-[#FF453A] text-[11px] font-medium cursor-pointer"
                        >
                            {t.removeOffline}
                        </button>
                    )}
                </div>
            </div>

            {isAddingGroup && (
                <form
                    onSubmit={handleAddGroup}
                    className="mac-settings-card animate-collapse-enter px-4 py-3 flex items-center justify-between gap-3 text-xs"
                >
                    <span className="font-medium">{t.addGroupTitle}</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder={t.addGroupPlaceholder}
                            className="mac-input px-3 py-1 rounded-[7px] text-xs w-52"
                        />
                        <button
                            type="submit"
                            className="bg-accent text-white px-3 py-1 rounded-[7px] text-xs font-medium cursor-pointer"
                        >
                            {t.saveGroupBtn}
                        </button>
                    </div>
                </form>
            )}

            {/* Section: My Stations */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-[13px] font-bold">
                            {currentHeadingTitle} ({filteredStations.length})
                        </h2>
                        {selectedGroup !== 'ALL' && groups.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    void api.deleteGroup(selectedGroup);
                                    setSelectedGroup('ALL');
                                }}
                                className="text-[11px] text-[#FF453A] hover:underline cursor-pointer"
                            >
                                {t.deleteGroupBtn}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                void handleExportLoad('json');
                                setIsImportExportOpen(true);
                            }}
                            className="mac-glass-pill px-2.5 py-1 rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                            <IconTransfer size={12} />
                            <span>{t.importExport}</span>
                        </button>
                        <button
                            type="button"
                            onClick={openAddStationModal}
                            className="bg-accent hover:opacity-90 text-white px-3 py-1 rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
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
