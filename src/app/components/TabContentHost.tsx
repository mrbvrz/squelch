import React from 'react';
import type { TranslationDictionary } from '../../i18n';
import type { ActiveTab, SquelchWindowApi } from '../types';

import { StationsTab } from '../tabs/StationsTab';
import { SchedulesTab } from '../tabs/SchedulesTab';
import { DiscoverTab } from '../tabs/DiscoverTab';
import { PreferencesTab } from '../tabs/PreferencesTab';
import { AboutTab } from '../tabs/AboutTab';

const LazyStatsTab = React.lazy(() =>
    import('../tabs/StatsTab').then((m) => ({ default: m.StatsTab }))
);

import type { useAppCoreData } from '../hooks/useAppCoreData';
import type { useStationManagement } from '../hooks/useStationManagement';
import type { useScheduleManagement } from '../hooks/useScheduleManagement';
import type { useDiscoverStations } from '../hooks/useDiscoverStations';
import type { useStationModal } from '../hooks/useStationModal';
import type { useImportExportModal } from '../hooks/useImportExportModal';
import type { useAppUpdates } from '../hooks/useAppUpdates';
import { isScheduleCurrentlyOnAir } from '../hooks/useScheduleManagement';

export interface TabContentHostProps {
    activeTab: ActiveTab;
    appCoreData: ReturnType<typeof useAppCoreData>;
    stationManagement: ReturnType<typeof useStationManagement>;
    scheduleManagement: ReturnType<typeof useScheduleManagement>;
    discoverStations: ReturnType<typeof useDiscoverStations>;
    stationModal: ReturnType<typeof useStationModal>;
    importExportModal: ReturnType<typeof useImportExportModal>;
    appUpdates: ReturnType<typeof useAppUpdates>;
    currentHeadingTitle: string;
    lang: 'id' | 'en';
    t: TranslationDictionary;
    api: SquelchWindowApi;
    setActiveTab: (tab: ActiveTab) => void;

    // Preferences Tab Specific Handlers
    recordingShortcutKey: string | null;
    setRecordingShortcutKey: (key: any) => void;
    backupStatusMsg: string | null;
    handleRestoreData: () => Promise<void>;
    handleBackupData: () => Promise<void>;
    setIsUpdateModalOpen: (open: boolean) => void;
    setIsOnboardingOpen: (open: boolean) => void;
    notifTestSuccess: boolean;
    setNotifTestSuccess: React.Dispatch<React.SetStateAction<boolean>>;
    copiedDiag: boolean;
    setCopiedDiag: React.Dispatch<React.SetStateAction<boolean>>;
    showDiagReport: boolean;
    setShowDiagReport: React.Dispatch<React.SetStateAction<boolean>>;
    setIsResetConfirmOpen: (open: boolean) => void;
    onRequestReset: (
        target: 'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    ) => void;
}

export const TabContentHost: React.FC<TabContentHostProps> = ({
    activeTab,
    appCoreData,
    stationManagement,
    scheduleManagement,
    discoverStations,
    stationModal,
    importExportModal,
    appUpdates,
    currentHeadingTitle,
    lang,
    t,
    api,
    setActiveTab,
    recordingShortcutKey,
    setRecordingShortcutKey,
    backupStatusMsg,
    handleRestoreData,
    handleBackupData,
    setIsUpdateModalOpen,
    setIsOnboardingOpen,
    notifTestSuccess,
    setNotifTestSuccess,
    copiedDiag,
    setCopiedDiag,
    showDiagReport,
    setShowDiagReport,
    setIsResetConfirmOpen,
    onRequestReset
}) => {
    const isPlaying = appCoreData.playerState === 'playing';
    const isBusy =
        appCoreData.playerState === 'connecting' ||
        appCoreData.playerState === 'buffering' ||
        appCoreData.playerState === 'reconnecting';

    switch (activeTab) {
        case 'stations':
            return (
                <StationsTab
                    stations={appCoreData.stations}
                    filteredStations={stationManagement.filteredStations}
                    groups={appCoreData.groups}
                    selectedGroup={stationManagement.selectedGroup}
                    setSelectedGroup={stationManagement.setSelectedGroup}
                    favoritesOnly={stationManagement.favoritesOnly}
                    setFavoritesOnly={stationManagement.setFavoritesOnly}
                    favCount={stationManagement.favCount}
                    hideOffline={stationManagement.hideOffline}
                    setHideOffline={stationManagement.setHideOffline}
                    isCheckingHealth={stationManagement.isCheckingHealth}
                    handleRunHealthCheck={
                        stationManagement.handleRunHealthCheck
                    }
                    isAddingGroup={stationManagement.isAddingGroup}
                    setIsAddingGroup={stationManagement.setIsAddingGroup}
                    newGroupName={stationManagement.newGroupName}
                    setNewGroupName={stationManagement.setNewGroupName}
                    handleAddGroup={stationManagement.handleAddGroup}
                    currentHeadingTitle={currentHeadingTitle}
                    openAddStationModal={stationModal.openAddStationModal}
                    openEditStationModal={stationModal.openEditStationModal}
                    handleExportLoad={importExportModal.handleExportLoad}
                    setIsImportExportOpen={
                        importExportModal.setIsImportExportOpen
                    }
                    setActiveTab={setActiveTab}
                    isPlayingStation={stationManagement.isPlayingStation}
                    draggedStationId={stationManagement.draggedStationId}
                    setDraggedStationId={
                        stationManagement.setDraggedStationId
                    }
                    handleDropStation={stationManagement.handleDropStation}
                    api={api}
                    refreshAll={appCoreData.refreshAll}
                    t={t}
                />
            );

        case 'schedules':
            return (
                <SchedulesTab
                    schedules={scheduleManagement.schedules}
                    stations={appCoreData.stations}
                    currentStation={appCoreData.currentStation}
                    isPlaying={isPlaying}
                    isBusy={isBusy}
                    lang={lang}
                    openAddScheduleModal={
                        scheduleManagement.openAddScheduleModal
                    }
                    openEditScheduleModal={
                        scheduleManagement.openEditScheduleModal
                    }
                    handleDeleteSchedule={
                        scheduleManagement.handleDeleteSchedule
                    }
                    handleToggleSchedule={
                        scheduleManagement.handleToggleSchedule
                    }
                    handleToggleScheduleAutoPlay={
                        scheduleManagement.handleToggleScheduleAutoPlay
                    }
                    isScheduleCurrentlyOnAir={isScheduleCurrentlyOnAir}
                    api={api}
                    t={t}
                />
            );

        case 'discover':
            return (
                <DiscoverTab
                    discCountry={discoverStations.discCountry}
                    setDiscCountry={discoverStations.setDiscCountry}
                    handleCountryChange={discoverStations.handleCountryChange}
                    discCountries={discoverStations.discCountries}
                    discName={discoverStations.discName}
                    setDiscName={discoverStations.setDiscName}
                    discTag={discoverStations.discTag}
                    setDiscTag={discoverStations.setDiscTag}
                    isSearchingOnline={discoverStations.isSearchingOnline}
                    discError={discoverStations.discError}
                    discResults={discoverStations.discResults}
                    stations={appCoreData.stations}
                    currentStation={appCoreData.currentStation}
                    isPlaying={isPlaying}
                    isBusy={isBusy}
                    handleDiscoverSearch={
                        discoverStations.handleDiscoverSearch
                    }
                    handleAddFromDiscover={
                        discoverStations.handleAddFromDiscover
                    }
                    api={api}
                    t={t}
                />
            );

        case 'stats':
            if (!appCoreData.statsSummary) return null;
            return (
                <React.Suspense
                    fallback={
                        <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <span className="text-xs font-medium">
                                    {lang === 'en'
                                        ? 'Loading statistics...'
                                        : 'Memuat statistik...'}
                                </span>
                            </div>
                        </div>
                    }
                >
                    <LazyStatsTab
                        statsSummary={appCoreData.statsSummary}
                        statsViewMode={appCoreData.statsViewMode}
                        setStatsViewMode={appCoreData.setStatsViewMode}
                        activeChartPoints={appCoreData.activeChartPoints}
                        maxChartSeconds={appCoreData.maxChartSeconds}
                        stations={appCoreData.stations}
                        isPlayingStation={stationManagement.isPlayingStation}
                        api={api}
                        lang={lang}
                        t={t}
                        setActiveTab={setActiveTab}
                    />
                </React.Suspense>
            );

        case 'preferences':
            if (!appCoreData.settings) return null;
            return (
                <PreferencesTab
                    settings={appCoreData.settings}
                    systemFonts={appCoreData.systemFonts}
                    isLoadingFonts={appCoreData.isLoadingFonts}
                    lang={lang}
                    recordingShortcutKey={recordingShortcutKey as any}
                    setRecordingShortcutKey={setRecordingShortcutKey as any}
                    backupStatusMsg={backupStatusMsg}
                    handleRestoreData={handleRestoreData}
                    handleBackupData={handleBackupData}
                    updateInfo={appUpdates.updateInfo}
                    updateCheckError={appUpdates.updateCheckError}
                    isCheckingUpdate={appUpdates.isCheckingUpdate}
                    updateDownloadProgress={appUpdates.updateDownloadProgress}
                    handleCheckForUpdates={appUpdates.handleCheckForUpdates}
                    setIsUpdateModalOpen={setIsUpdateModalOpen}
                    setIsOnboardingOpen={setIsOnboardingOpen}
                    notifTestSuccess={notifTestSuccess}
                    setNotifTestSuccess={setNotifTestSuccess}
                    dataDir={appCoreData.dataDir}
                    copiedDiag={copiedDiag}
                    setCopiedDiag={setCopiedDiag}
                    showDiagReport={showDiagReport}
                    setShowDiagReport={setShowDiagReport}
                    diagnosticsText={appCoreData.diagnosticsText}
                    setDiagnosticsText={appCoreData.setDiagnosticsText}
                    setIsResetConfirmOpen={setIsResetConfirmOpen}
                    onRequestReset={onRequestReset}
                    api={api}
                    t={t}
                />
            );

        case 'about':
            return (
                <AboutTab
                    appIconDataUrl={appCoreData.appIconDataUrl}
                    api={api}
                    t={t}
                />
            );

        default:
            return null;
    }
};
