import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { getTranslations } from '../i18n';
import type {
    ShowSchedule
} from '../types';
import type { SquelchWindowApi } from './types';

// Shell & Navigation Components
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { SleepCountdownBanner } from './components/SleepCountdownBanner';
import { StandaloneAboutView } from './components/StandaloneAboutView';
import { TabContentHost } from './components/TabContentHost';
import { AppModalsHost } from './components/AppModalsHost';

// Custom Modular Hooks
import { useTabNavigation } from './hooks/useTabNavigation';
import {
    useScheduleManagement,
    isScheduleCurrentlyOnAir
} from './hooks/useScheduleManagement';
import { useAppUpdates } from './hooks/useAppUpdates';
import { useStationModal } from './hooks/useStationModal';
import { useImportExportModal } from './hooks/useImportExportModal';
import { useDiscoverStations } from './hooks/useDiscoverStations';
import { useStationManagement } from './hooks/useStationManagement';
import { useAppCoreData } from './hooks/useAppCoreData';
import { useAppShortcuts } from './hooks/useAppShortcuts';

declare global {
    interface Window {
        squelchApi: SquelchWindowApi;
        queryLocalFonts?: () => Promise<Array<{ family: string }>>;
    }
}

export const App: React.FC = () => {
    const api = window.squelchApi;

    const {
        activeTab,
        setActiveTab,
        navigateToTab,
        canGoBack,
        canGoForward,
        goBack,
        goForward
    } = useTabNavigation();

    // Modal & Dialog UI States
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState<boolean>(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
    const [resetTarget, setResetTarget] = useState<
        'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    >('settings');
    const [recordingShortcutKey, setRecordingShortcutKey] = useState<
        string | null
    >(null);
    const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
    const [showDiagReport, setShowDiagReport] = useState<boolean>(false);
    const [copiedDiag, setCopiedDiag] = useState<boolean>(false);
    const [notifTestSuccess, setNotifTestSuccess] = useState<boolean>(false);

    // Modularized App Updates Hook
    const {
        updateInfo,
        setUpdateInfo,
        isCheckingUpdate,
        updateCheckError,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        updateDownloadProgress,
        handleStartDownloadUpdate,
        handleCancelDownloadUpdate,
        handleInstallUpdate,
        handleRevealUpdateInFinder,
        handleCheckForUpdates
    } = useAppUpdates({
        api,
        autoCheckUpdates: true
    });

    // Schedule list bridge ref
    const setSchedulesRef = useRef<(scheds: ShowSchedule[]) => void>(() => {});

    // Core Data & State Synchronization Hook
    const {
        stations,
        groups,
        settings,
        dataDir,
        systemFonts,
        isLoadingFonts,
        appIconDataUrl,
        statsSummary,
        statsViewMode,
        setStatsViewMode,
        activeChartPoints,
        maxChartSeconds,
        playerState,
        reconnectAttempt,
        currentStation,
        streamTitle,
        sleepRemainingSec,
        diagnosticsText,
        setDiagnosticsText,
        refreshAll
    } = useAppCoreData({
        api,
        activeTab,
        setActiveTab,
        setIsAboutModalOpen,
        setIsQuitConfirmOpen,
        handleCheckForUpdates,
        onSchedulesLoaded: (scheds) => setSchedulesRef.current(scheds)
    });

    const isPlaying = playerState === 'playing';
    const isBusy =
        playerState === 'connecting' ||
        playerState === 'buffering' ||
        playerState === 'reconnecting';

    // Filters, Group Management & Reordering Hook
    const {
        selectedGroup,
        setSelectedGroup,
        searchQuery,
        setSearchQuery,
        favoritesOnly,
        setFavoritesOnly,
        hideOffline,
        setHideOffline,
        newGroupName,
        setNewGroupName,
        isAddingGroup,
        setIsAddingGroup,
        draggedStationId,
        setDraggedStationId,
        isCheckingHealth,
        favCount,
        filteredStations,
        handleAddGroup,
        handleDropStation,
        handleRunHealthCheck,
        isPlayingStation
    } = useStationManagement({
        stations,
        groups,
        currentStation,
        isPlaying,
        isBusy,
        api,
        refreshAll: () => refreshAll()
    });

    // Discover Tab Hook
    const {
        discCountries,
        discCountry,
        setDiscCountry,
        discName,
        setDiscName,
        discTag,
        setDiscTag,
        discResults,
        isSearchingOnline,
        discError,
        handleDiscoverSearch,
        handleCountryChange,
        handleAddFromDiscover
    } = useDiscoverStations({
        api,
        refreshAll: () => refreshAll(),
        activeTab
    });

    // Station Form Modal Hook
    const {
        isFormOpen,
        setIsFormOpen,
        editingStation,
        formName,
        setFormName,
        formUrl,
        setFormUrl,
        formLogo,
        setFormLogo,
        formGenre,
        setFormGenre,
        formCity,
        setFormCity,
        formGroup,
        setFormGroup,
        formType,
        setFormType,
        formTags,
        setFormTags,
        isTestingStream,
        testResult,
        openAddStationModal,
        openEditStationModal,
        handleTestStream,
        handleSaveStation
    } = useStationModal({
        groups,
        selectedGroup,
        api,
        refreshAll: () => refreshAll()
    });

    // Import / Export Modal Hook
    const {
        isImportExportOpen,
        setIsImportExportOpen,
        ieFormat,
        ieDuplicateStrategy,
        setIeDuplicateStrategy,
        ieTextContent,
        setIeTextContent,
        ieStatusMessage,
        setIeStatusMessage,
        handleExportLoad,
        handleImportExecute
    } = useImportExportModal({
        stationsCount: stations.length,
        api,
        refreshAll: () => refreshAll()
    });

    // Schedule Management Hook
    const {
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
        handleToggleScheduleAutoPlay
    } = useScheduleManagement({
        stations,
        api,
        refreshAll: () => refreshAll()
    });

    // Connect bridge ref for schedule reload
    useEffect(() => {
        setSchedulesRef.current = setSchedules;
    }, [setSchedules]);

    // Search input ref & shortcut label (⌘F / Ctrl+F)
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

    const lang: 'id' | 'en' = settings?.language ?? 'id';
    const t = getTranslations(lang);

    // Global Keydown for ⌘F Search
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Automatically trigger onboarding wizard on first launch
    useEffect(() => {
        if (settings && settings.hasCompletedOnboarding === false) {
            setIsOnboardingOpen(true);
        }
    }, [settings?.hasCompletedOnboarding]);

    const handleCloseAllModals = useCallback(() => {
        setIsFormOpen(false);
        setIsImportExportOpen(false);
        setIsAddingGroup(false);
        setIsResetConfirmOpen(false);
        setIsAboutModalOpen(false);
        setIsQuitConfirmOpen(false);
        setUpdateInfo(null);
        setIsScheduleModalOpen(false);
        setIsUpdateModalOpen(false);
        setIsOnboardingOpen(false);
    }, [
        setIsFormOpen,
        setIsImportExportOpen,
        setIsAddingGroup,
        setUpdateInfo,
        setIsScheduleModalOpen,
        setIsUpdateModalOpen
    ]);

    useAppShortcuts({
        recordingShortcutKey: recordingShortcutKey as any,
        currentStation,
        searchInputRef,
        navigateToTab,
        onCloseAllModals: handleCloseAllModals,
        api
    });

    const stateHeadline = useMemo(() => {
        switch (playerState) {
            case 'playing':
                return { main: 'LIVE', sub: t.statusLiveSub, color: '#30D158' };
            case 'connecting':
                return {
                    main: 'SYNC',
                    sub: t.statusConnectingSub,
                    color: '#FF9F0A'
                };
            case 'buffering':
                return {
                    main: 'WAIT',
                    sub: t.statusBufferingSub,
                    color: '#FF9F0A'
                };
            case 'reconnecting':
                return {
                    main: 'RETRY',
                    sub: reconnectAttempt
                        ? `${t.statusReconnectingSub} (${reconnectAttempt})`
                        : t.statusReconnectingSub,
                    color: '#FF9F0A'
                };
            case 'paused':
                return {
                    main: 'HOLD',
                    sub: t.statusPausedSub,
                    color: '#8E8E93'
                };
            case 'error':
                return {
                    main: 'ERR',
                    sub: t.statusOfflineSub,
                    color: '#FF453A'
                };
            case 'idle':
            default:
                return {
                    main: 'IDLE',
                    sub: t.statusStandbySub,
                    color: '#8E8E93'
                };
        }
    }, [playerState, reconnectAttempt, t]);

    const currentHeadingTitle = useMemo(() => {
        if (activeTab === 'schedules') return t.tabSchedules;
        if (activeTab === 'discover') return t.tabDiscover;
        if (activeTab === 'stats') return t.tabStats;
        if (activeTab === 'preferences') return t.tabPreferences;
        if (activeTab === 'about') return t.tabAbout;
        if (favoritesOnly) return t.favoritesTitle;
        if (selectedGroup !== 'ALL') return selectedGroup;
        return t.allStationsTitle;
    }, [activeTab, favoritesOnly, selectedGroup, t]);

    const handleRequestReset = (
        target: 'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    ) => {
        setResetTarget(target);
        setIsResetConfirmOpen(true);
    };

    const resetModalMeta = useMemo(() => {
        switch (resetTarget) {
            case 'stations':
                return {
                    title: t.prefClearStationsConfirmTitle,
                    description: t.prefClearStationsConfirmDesc,
                    confirmBtn: t.prefClearStationsBtn
                };
            case 'schedules':
                return {
                    title: t.prefClearSchedulesConfirmTitle,
                    description: t.prefClearSchedulesConfirmDesc,
                    confirmBtn: t.prefClearSchedulesBtn
                };
            case 'stats':
                return {
                    title: t.prefClearStatsConfirmTitle,
                    description: t.prefClearStatsConfirmDesc,
                    confirmBtn: t.prefClearStatsBtn
                };
            case 'all':
                return {
                    title: t.prefResetAllConfirmTitle,
                    description: t.prefResetAllConfirmDesc,
                    confirmBtn: t.prefResetAllBtn
                };
            case 'settings':
            default:
                return {
                    title: t.prefResetConfirmTitle,
                    description: t.prefResetConfirmDesc,
                    confirmBtn: t.prefResetBtn
                };
        }
    }, [resetTarget, t]);

    const handleBackupData = async () => {
        setBackupStatusMsg(null);
        const res = await api.backupAppData();
        if (res.ok) {
            setBackupStatusMsg(t.prefBackupSuccess);
            setTimeout(() => setBackupStatusMsg(null), 3500);
        } else if (res.error) {
            setBackupStatusMsg(res.error);
        }
    };

    const handleRestoreData = async () => {
        setBackupStatusMsg(null);
        const res = await api.restoreAppData();
        if (res.ok) {
            await refreshAll();
            setBackupStatusMsg(t.prefRestoreSuccess);
            setTimeout(() => setBackupStatusMsg(null), 3500);
        } else if (res.error) {
            setBackupStatusMsg(res.error);
        }
    };

    const handleWindowDragMouseDown = (e: React.MouseEvent) => {
        if (
            e.button === 0 &&
            !(e.target as HTMLElement).closest(
                'button, input, a, select, textarea, [role="button"], kbd'
            )
        ) {
            void (api as any)?.startDragging?.();
        }
    };

    const isStandaloneAbout =
        typeof window !== 'undefined' &&
        window.location.hash === '#about-window';

    if (isStandaloneAbout) {
        return (
            <StandaloneAboutView
                appIconDataUrl={appIconDataUrl}
                api={api}
                t={t}
                onWindowDragMouseDown={handleWindowDragMouseDown}
            />
        );
    }

    return (
        <div className="mac-window-shell flex h-screen select-none overflow-hidden">
            {/* LEFT SIDEBAR: macOS System Settings Navigation */}
            <Sidebar
                activeTab={activeTab}
                navigateToTab={navigateToTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInputRef={searchInputRef}
                isMac={isMac}
                handleWindowDragMouseDown={handleWindowDragMouseDown}
                currentStation={currentStation}
                playerState={playerState}
                stateHeadline={stateHeadline}
                streamTitle={streamTitle}
                isPlaying={isPlaying}
                isBusy={isBusy}
                settings={settings}
                setIsAboutModalOpen={setIsAboutModalOpen}
                setIsQuitConfirmOpen={setIsQuitConfirmOpen}
                api={api}
                t={t}
            />

            {/* RIGHT CONTENT PANE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <HeaderBar
                    canGoBack={canGoBack}
                    canGoForward={canGoForward}
                    goBack={goBack}
                    goForward={goForward}
                    currentHeadingTitle={currentHeadingTitle}
                    updateInfo={updateInfo}
                    setIsUpdateModalOpen={setIsUpdateModalOpen}
                    handleWindowDragMouseDown={handleWindowDragMouseDown}
                />

                <main className="flex-1 overflow-y-auto px-6 pt-1 pb-8 flex flex-col">
                    <SleepCountdownBanner
                        sleepRemainingSec={sleepRemainingSec}
                        api={api}
                        t={t}
                    />

                    <TabContentHost
                        activeTab={activeTab}
                        stationsProps={{
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
                            draggedStationId,
                            setDraggedStationId,
                            handleDropStation,
                            api,
                            refreshAll,
                            t
                        }}
                        schedulesProps={{
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
                        }}
                        discoverProps={{
                            discCountry,
                            setDiscCountry,
                            handleCountryChange,
                            discCountries,
                            discName,
                            setDiscName,
                            discTag,
                            setDiscTag,
                            isSearchingOnline,
                            discError,
                            discResults,
                            stations,
                            currentStation,
                            isPlaying,
                            isBusy,
                            handleDiscoverSearch,
                            handleAddFromDiscover,
                            api,
                            t
                        }}
                        statsSummary={statsSummary}
                        statsProps={{
                            statsSummary: statsSummary!,
                            statsViewMode,
                            setStatsViewMode,
                            activeChartPoints,
                            maxChartSeconds,
                            stations,
                            isPlayingStation,
                            api,
                            lang,
                            t,
                            setActiveTab
                        }}
                        settings={settings}
                        preferencesProps={{
                            settings: settings!,
                            systemFonts,
                            isLoadingFonts,
                            lang,
                            recordingShortcutKey: recordingShortcutKey as any,
                            setRecordingShortcutKey: setRecordingShortcutKey as any,
                            backupStatusMsg,
                            handleRestoreData,
                            handleBackupData,
                            updateInfo,
                            updateCheckError,
                            isCheckingUpdate,
                            updateDownloadProgress,
                            handleCheckForUpdates,
                            setIsUpdateModalOpen,
                            setIsOnboardingOpen,
                            notifTestSuccess,
                            setNotifTestSuccess,
                            dataDir,
                            copiedDiag,
                            setCopiedDiag,
                            showDiagReport,
                            setShowDiagReport,
                            diagnosticsText,
                            setDiagnosticsText,
                            setIsResetConfirmOpen,
                            onRequestReset: handleRequestReset,
                            api,
                            t
                        }}
                        aboutProps={{
                            appIconDataUrl,
                            api,
                            t
                        }}
                    />
                </main>
            </div>

            {/* MODALS & FLOATING BADGES */}
            <AppModalsHost
                api={api}
                t={t}
                lang={lang}
                appIconDataUrl={appIconDataUrl}
                settings={settings}
                stations={stations}
                groups={groups}
                refreshAll={refreshAll}
                stationModalProps={{
                    isOpen: isFormOpen,
                    onClose: () => setIsFormOpen(false),
                    onSave: handleSaveStation,
                    editingStation,
                    formName,
                    setFormName,
                    formUrl,
                    setFormUrl,
                    formGroup,
                    setFormGroup,
                    formGenre,
                    setFormGenre,
                    formCity,
                    setFormCity,
                    formType,
                    setFormType,
                    formLogo,
                    setFormLogo,
                    formTags,
                    setFormTags,
                    onTestStream: () => void handleTestStream(),
                    isTestingStream,
                    testResult
                }}
                importExportModalProps={{
                    isOpen: isImportExportOpen,
                    onClose: () => setIsImportExportOpen(false),
                    onExportLoad: (format) => void handleExportLoad(format),
                    ieFormat,
                    ieDuplicateStrategy,
                    setIeDuplicateStrategy,
                    ieTextContent,
                    setIeTextContent,
                    ieStatusMessage,
                    onCopyExport: () => {
                        void navigator.clipboard.writeText(ieTextContent);
                        setIeStatusMessage(t.copiedDiagBtn);
                    },
                    onImportExecute: () => void handleImportExecute()
                }}
                resetModalProps={{
                    isOpen: isResetConfirmOpen,
                    onClose: () => setIsResetConfirmOpen(false),
                    onConfirm: async () => {
                        setIsResetConfirmOpen(false);
                        if (resetTarget === 'stations') {
                            await api.clearStationsData();
                        } else if (resetTarget === 'schedules') {
                            await api.clearSchedulesData();
                        } else if (resetTarget === 'stats') {
                            await api.clearListeningStats();
                        } else if (resetTarget === 'all') {
                            await api.clearStationsData();
                            await api.clearSchedulesData();
                            await api.clearListeningStats();
                        } else {
                            await api.resetSettings();
                        }
                        await refreshAll();
                    },
                    title: resetModalMeta.title,
                    description: resetModalMeta.description,
                    confirmBtnText: resetModalMeta.confirmBtn
                }}
                quitModalProps={{
                    isOpen: isQuitConfirmOpen,
                    onClose: () => setIsQuitConfirmOpen(false),
                    onConfirm: () => void api.quitApp()
                }}
                aboutModalProps={{
                    isOpen: isAboutModalOpen,
                    onClose: () => {
                        setIsAboutModalOpen(false);
                        if (
                            window.location.hash === '#about' ||
                            window.location.hash === '#about-window'
                        ) {
                            window.location.hash = '';
                        }
                    }
                }}
                scheduleModalProps={{
                    isOpen: isScheduleModalOpen,
                    onClose: () => setIsScheduleModalOpen(false),
                    onSave: handleSaveSchedule,
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
                    setSchedNotes
                }}
                onboardingModalProps={{
                    isOpen: isOnboardingOpen,
                    onClose: () => setIsOnboardingOpen(false)
                }}
                updateModalProps={{
                    isOpen: isUpdateModalOpen,
                    onOpen: () => setIsUpdateModalOpen(true),
                    onClose: () => setIsUpdateModalOpen(false),
                    updateInfo,
                    isCheckingUpdate,
                    updateCheckError,
                    updateDownloadProgress,
                    onCheckAgain: () => void handleCheckForUpdates(true),
                    onStartDownload: handleStartDownloadUpdate,
                    onCancelDownload: handleCancelDownloadUpdate,
                    onInstallUpdate: handleInstallUpdate,
                    onRevealInFinder: handleRevealUpdateInFinder
                }}
            />
        </div>
    );
};
export default App;
