import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { getTranslations } from '../i18n';
import type {
    AppSettings,
    ListeningStatsSummary,
    PlayerState,
    Station
} from '../types';
import {
    applyAppearanceVariables,
    bindActiveScrollbars
} from '../utils/appearance';
import { OnboardingModal } from '../components/OnboardingModal';
import { UpdateModal } from '../components/UpdateModal';
import { IconSpinner, IconCheck } from '../components/Icons';

import type { ActiveTab, SquelchWindowApi, StatsPeriodMode } from './types';
import { DAY_LABELS } from './types';

// Shell & Navigation Components
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { SleepCountdownBanner } from './components/SleepCountdownBanner';

// Tabs
import { StationsTab } from './tabs/StationsTab';
import { SchedulesTab } from './tabs/SchedulesTab';
import { DiscoverTab } from './tabs/DiscoverTab';
import { StatsTab } from './tabs/StatsTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { AboutTab } from './tabs/AboutTab';

// Modals
import { StationModal } from './modals/StationModal';
import { ScheduleModal } from './modals/ScheduleModal';
import { ImportExportModal } from './modals/ImportExportModal';
import { ResetConfirmModal } from './modals/ResetConfirmModal';
import { QuitConfirmModal } from './modals/QuitConfirmModal';
import { AboutModal } from './modals/AboutModal';

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

    // Core data states
    const [stations, setStations] = useState<Station[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [dataDir, setDataDir] = useState<string>('');
    const [systemFonts, setSystemFonts] = useState<string[]>([]);
    const [isLoadingFonts, setIsLoadingFonts] = useState<boolean>(true);
    const [appIconDataUrl, setAppIconDataUrl] = useState<string | null>(null);
    const [statsSummary, setStatsSummary] =
        useState<ListeningStatsSummary | null>(null);
    const [statsViewMode, setStatsViewMode] =
        useState<StatsPeriodMode>('weekly');

    // Player states
    const [playerState, setPlayerState] = useState<PlayerState>('idle');
    const [reconnectAttempt, setReconnectAttempt] = useState<number | null>(
        null
    );
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [streamTitle, setStreamTitle] = useState<string | null>(null);
    const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(
        null
    );

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

    // Preferences & Diagnostics
    const [recordingShortcutKey, setRecordingShortcutKey] = useState<
        keyof AppSettings['shortcuts'] | null
    >(null);
    const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
    const [showDiagReport, setShowDiagReport] = useState<boolean>(false);
    const [diagnosticsText, setDiagnosticsText] = useState<string>('');
    const [copiedDiag, setCopiedDiag] = useState<boolean>(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] =
        useState<boolean>(false);
    const [resetTarget, setResetTarget] = useState<
        'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    >('settings');
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState<boolean>(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
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
        autoCheckUpdates: settings?.autoCheckUpdates !== false
    });

    // Modularized Station Form Modal Hook
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

    // Modularized Import / Export Modal Hook
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

    // Show Schedules
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

    // Search input ref & shortcut label (⌘F / Ctrl+F)
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

    const lang: 'id' | 'en' = settings?.language ?? 'id';
    const t = getTranslations(lang);

    const refreshAll = async () => {
        const [stData, player, cfg, stats, schedList] = await Promise.all([
            api.getStationsData(),
            api.getPlayerStatus(),
            api.getSettings(),
            api.getListeningStats(),
            api.getSchedules()
        ]);
        setStations(stData.stations);
        setGroups(stData.groups);
        setPlayerState(player.state);
        setReconnectAttempt(player.reconnectAttempt ?? null);
        setCurrentStation(player.currentStation);
        setStreamTitle(player.streamTitle);
        setSleepRemainingSec(player.sleepTimerRemainingSec);
        setSettings(cfg.settings);
        setDataDir(cfg.dataDir);
        setStatsSummary(stats);
        if (Array.isArray(schedList)) {
            setSchedules(schedList);
        }
        applyAppearanceVariables(cfg.settings);
    };

    const loadAvailableSystemFonts = async () => {
        setIsLoadingFonts(true);
        try {
            const mainFonts = await api.getSystemFonts();
            if (typeof window.queryLocalFonts === 'function') {
                try {
                    const local = await window.queryLocalFonts();
                    const merged = new Set<string>(mainFonts);
                    for (const item of local) {
                        if (item.family && !item.family.startsWith('.')) {
                            merged.add(item.family);
                        }
                    }
                    setSystemFonts(
                        Array.from(merged).sort((a, b) => a.localeCompare(b))
                    );
                    return;
                } catch {
                    // Fallback to main process font list
                }
            }
            setSystemFonts(mainFonts);
        } catch {
            setSystemFonts([]);
        } finally {
            setIsLoadingFonts(false);
        }
    };

    useEffect(() => {
        const unbindScrollbars = bindActiveScrollbars();
        void refreshAll();
        void loadAvailableSystemFonts();
        void api.getAppIconDataUrl().then(setAppIconDataUrl);

        const unsub = api.onStateChanged((evt: unknown) => {
            const data = evt as { type?: string; tab?: string };
            if (data?.type === 'navigate' && data.tab) {
                const targetTab: ActiveTab =
                    data.tab === 'diagnostics'
                        ? 'preferences'
                        : (data.tab as ActiveTab);
                setActiveTab(targetTab);
            }
            void refreshAll();
        });

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);

        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#about' || hash === '#about-window') {
                setIsAboutModalOpen(true);
            } else if (hash === '#preferences') {
                setActiveTab('preferences');
            } else if (hash === '#stations') {
                setActiveTab('stations');
            } else if (hash === '#discover') {
                setActiveTab('discover');
            } else if (hash === '#schedule' || hash === '#schedules') {
                setActiveTab('schedules');
            } else if (hash === '#stats') {
                setActiveTab('stats');
            }
        };

        const handleCustomOpenAbout = () => {
            setIsAboutModalOpen(true);
        };

        const handleCustomConfirmQuit = () => {
            setIsQuitConfirmOpen(true);
        };

        const handleCustomNavigate = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                const targetTab = customEvent.detail as ActiveTab;
                setActiveTab(targetTab);
            }
        };

        let unlistenAbout: (() => void) | null = null;
        let unlistenQuit: (() => void) | null = null;
        let unlistenUpdate: (() => void) | null = null;
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            import('@tauri-apps/api/event')
                .then(({ listen }) => {
                    listen('squelch:open-about', () => {
                        setIsAboutModalOpen(true);
                    }).then((u) => {
                        unlistenAbout = u;
                    });
                    listen('squelch:confirm-quit', () => {
                        setIsQuitConfirmOpen(true);
                    }).then((u) => {
                        unlistenQuit = u;
                    });
                    listen('ui:open-update-modal', () => {
                        void handleCheckForUpdates(true);
                    }).then((u) => {
                        unlistenUpdate = u;
                    });
                })
                .catch(() => {});
        }

        const handleCustomCheckUpdates = () => {
            void handleCheckForUpdates(true);
        };

        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('squelch:open-about', handleCustomOpenAbout);
        window.addEventListener(
            'squelch:confirm-quit',
            handleCustomConfirmQuit
        );
        window.addEventListener('squelch:navigate', handleCustomNavigate);
        window.addEventListener(
            'squelch:check-updates',
            handleCustomCheckUpdates
        );
        handleHashChange();

        return () => {
            unbindScrollbars();
            unsub();
            if (unlistenAbout) unlistenAbout();
            if (unlistenQuit) unlistenQuit();
            if (unlistenUpdate) unlistenUpdate();
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener(
                'squelch:open-about',
                handleCustomOpenAbout
            );
            window.removeEventListener(
                'squelch:confirm-quit',
                handleCustomConfirmQuit
            );
            window.removeEventListener(
                'squelch:navigate',
                handleCustomNavigate
            );
            window.removeEventListener(
                'squelch:check-updates',
                handleCustomCheckUpdates
            );
        };
    }, [handleCheckForUpdates]);

    useEffect(() => {
        if (activeTab === 'stats') {
            void api.getListeningStats().then(setStatsSummary);
            const interval = setInterval(() => {
                void api.getListeningStats().then(setStatsSummary);
            }, 3000);
            return () => clearInterval(interval);
        }
        if (activeTab === 'preferences') {
            void api.getDiagnostics().then((res) => {
                const text =
                    typeof res === 'string'
                        ? res
                        : JSON.stringify(res, null, 2);
                setDiagnosticsText(text);
            });
        }
    }, [activeTab]);

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
        setUpdateInfo,
        setIsScheduleModalOpen,
        setIsUpdateModalOpen
    ]);

    useAppShortcuts({
        recordingShortcutKey,
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
    }, [playerState, t]);

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

    const activeChartPoints = useMemo(() => {
        if (!statsSummary) return [];
        if (statsViewMode === 'daily') {
            return statsSummary.dailySeries;
        }
        if (statsViewMode === 'weekly') {
            return statsSummary.weeklySeries;
        }
        if (statsViewMode === 'monthly') {
            return statsSummary.monthlySeries;
        }
        return statsSummary.yearlySeries;
    }, [statsSummary, statsViewMode]);

    const maxChartSeconds = useMemo(() => {
        const maxVal = Math.max(0, ...activeChartPoints.map((p) => p.seconds));
        return maxVal > 0 ? maxVal : 60;
    }, [activeChartPoints]);

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
            <div className="mac-window-shell flex flex-col h-screen select-none overflow-hidden p-6">
                <div
                    onMouseDown={handleWindowDragMouseDown}
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                    className="h-8 w-full shrink-0 -mt-2 -mx-2"
                />
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4 overflow-y-auto">
                    <AboutTab appIconDataUrl={appIconDataUrl} api={api} t={t} />
                </div>
            </div>
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

                    {activeTab === 'stations' && (
                        <StationsTab
                            stations={stations}
                            filteredStations={filteredStations}
                            groups={groups}
                            selectedGroup={selectedGroup}
                            setSelectedGroup={setSelectedGroup}
                            favoritesOnly={favoritesOnly}
                            setFavoritesOnly={setFavoritesOnly}
                            favCount={favCount}
                            hideOffline={hideOffline}
                            setHideOffline={setHideOffline}
                            isCheckingHealth={isCheckingHealth}
                            handleRunHealthCheck={handleRunHealthCheck}
                            isAddingGroup={isAddingGroup}
                            setIsAddingGroup={setIsAddingGroup}
                            newGroupName={newGroupName}
                            setNewGroupName={setNewGroupName}
                            handleAddGroup={handleAddGroup}
                            currentHeadingTitle={currentHeadingTitle}
                            openAddStationModal={openAddStationModal}
                            openEditStationModal={openEditStationModal}
                            handleExportLoad={handleExportLoad}
                            setIsImportExportOpen={setIsImportExportOpen}
                            setActiveTab={setActiveTab}
                            isPlayingStation={isPlayingStation}
                            draggedStationId={draggedStationId}
                            setDraggedStationId={setDraggedStationId}
                            handleDropStation={handleDropStation}
                            api={api}
                            refreshAll={refreshAll}
                            t={t}
                        />
                    )}

                    {activeTab === 'schedules' && (
                        <SchedulesTab
                            schedules={schedules}
                            stations={stations}
                            currentStation={currentStation}
                            isPlaying={isPlaying}
                            isBusy={isBusy}
                            lang={lang}
                            openAddScheduleModal={openAddScheduleModal}
                            openEditScheduleModal={openEditScheduleModal}
                            handleDeleteSchedule={handleDeleteSchedule}
                            handleToggleSchedule={handleToggleSchedule}
                            handleToggleScheduleAutoPlay={
                                handleToggleScheduleAutoPlay
                            }
                            isScheduleCurrentlyOnAir={isScheduleCurrentlyOnAir}
                            api={api}
                            t={t}
                        />
                    )}

                    {activeTab === 'discover' && (
                        <DiscoverTab
                            discCountry={discCountry}
                            setDiscCountry={setDiscCountry}
                            handleCountryChange={handleCountryChange}
                            discCountries={discCountries}
                            discName={discName}
                            setDiscName={setDiscName}
                            discTag={discTag}
                            setDiscTag={setDiscTag}
                            isSearchingOnline={isSearchingOnline}
                            discError={discError}
                            discResults={discResults}
                            stations={stations}
                            currentStation={currentStation}
                            isPlaying={isPlaying}
                            isBusy={isBusy}
                            handleDiscoverSearch={handleDiscoverSearch}
                            handleAddFromDiscover={handleAddFromDiscover}
                            api={api}
                            t={t}
                        />
                    )}

                    {activeTab === 'stats' && statsSummary && (
                        <StatsTab
                            statsSummary={statsSummary}
                            statsViewMode={statsViewMode}
                            setStatsViewMode={setStatsViewMode}
                            activeChartPoints={activeChartPoints}
                            maxChartSeconds={maxChartSeconds}
                            stations={stations}
                            isPlayingStation={isPlayingStation}
                            api={api}
                            lang={lang}
                            t={t}
                            setActiveTab={setActiveTab}
                        />
                    )}

                    {activeTab === 'preferences' && settings && (
                        <PreferencesTab
                            settings={settings}
                            systemFonts={systemFonts}
                            isLoadingFonts={isLoadingFonts}
                            lang={lang}
                            recordingShortcutKey={recordingShortcutKey}
                            setRecordingShortcutKey={setRecordingShortcutKey}
                            backupStatusMsg={backupStatusMsg}
                            handleRestoreData={handleRestoreData}
                            handleBackupData={handleBackupData}
                            updateInfo={updateInfo}
                            updateCheckError={updateCheckError}
                            isCheckingUpdate={isCheckingUpdate}
                            updateDownloadProgress={updateDownloadProgress}
                            handleCheckForUpdates={handleCheckForUpdates}
                            setIsUpdateModalOpen={setIsUpdateModalOpen}
                            setIsOnboardingOpen={setIsOnboardingOpen}
                            notifTestSuccess={notifTestSuccess}
                            setNotifTestSuccess={setNotifTestSuccess}
                            dataDir={dataDir}
                            copiedDiag={copiedDiag}
                            setCopiedDiag={setCopiedDiag}
                            showDiagReport={showDiagReport}
                            setShowDiagReport={setShowDiagReport}
                            diagnosticsText={diagnosticsText}
                            setDiagnosticsText={setDiagnosticsText}
                            setIsResetConfirmOpen={setIsResetConfirmOpen}
                            onRequestReset={handleRequestReset}
                            api={api}
                            t={t}
                        />
                    )}

                    {activeTab === 'about' && (
                        <AboutTab
                            appIconDataUrl={appIconDataUrl}
                            api={api}
                            t={t}
                        />
                    )}
                </main>
            </div>

            {/* MODALS */}
            <StationModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveStation}
                editingStation={editingStation}
                formName={formName}
                setFormName={setFormName}
                formUrl={formUrl}
                setFormUrl={setFormUrl}
                formGroup={formGroup}
                setFormGroup={setFormGroup}
                formGenre={formGenre}
                setFormGenre={setFormGenre}
                formCity={formCity}
                setFormCity={setFormCity}
                formType={formType}
                setFormType={setFormType}
                formLogo={formLogo}
                setFormLogo={setFormLogo}
                formTags={formTags}
                setFormTags={setFormTags}
                groups={groups}
                onTestStream={() => void handleTestStream()}
                isTestingStream={isTestingStream}
                testResult={testResult}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
                t={t}
            />

            <ImportExportModal
                isOpen={isImportExportOpen}
                onClose={() => setIsImportExportOpen(false)}
                onExportLoad={(format) => void handleExportLoad(format)}
                ieFormat={ieFormat}
                ieDuplicateStrategy={ieDuplicateStrategy}
                setIeDuplicateStrategy={setIeDuplicateStrategy}
                ieTextContent={ieTextContent}
                setIeTextContent={setIeTextContent}
                ieStatusMessage={ieStatusMessage}
                onCopyExport={() => {
                    void navigator.clipboard.writeText(ieTextContent);
                    setIeStatusMessage(t.copiedDiagBtn);
                }}
                onImportExecute={() => void handleImportExecute()}
                t={t}
            />

            <ResetConfirmModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={async () => {
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
                }}
                title={resetModalMeta.title}
                description={resetModalMeta.description}
                cancelBtnText={t.cancelBtn}
                confirmBtnText={resetModalMeta.confirmBtn}
            />

            <QuitConfirmModal
                isOpen={isQuitConfirmOpen}
                onClose={() => setIsQuitConfirmOpen(false)}
                onConfirm={() => void api.quitApp()}
                appIconDataUrl={appIconDataUrl}
                language={lang as 'en' | 'id'}
                cancelBtnText={t.cancelBtn}
            />

            <AboutModal
                isOpen={isAboutModalOpen}
                onClose={() => {
                    setIsAboutModalOpen(false);
                    if (
                        window.location.hash === '#about' ||
                        window.location.hash === '#about-window'
                    ) {
                        window.location.hash = '';
                    }
                }}
                appIconDataUrl={appIconDataUrl}
                tagline={t.aboutTagline}
                description={t.aboutDescription}
                websiteBtnText={t.aboutWebsiteBtn}
                specLinkText={t.aboutSpecLink}
                changelogLinkText={t.aboutChangelogLink}
                onOpenExternalUrl={(url) => void api.openExternalUrl(url)}
            />

            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
                editingSchedule={editingSchedule}
                stations={stations}
                schedStationId={schedStationId}
                setSchedStationId={setSchedStationId}
                schedShowName={schedShowName}
                setSchedShowName={setSchedShowName}
                schedHost={schedHost}
                setSchedHost={setSchedHost}
                schedDays={schedDays}
                setSchedDays={setSchedDays}
                schedStartTime={schedStartTime}
                setSchedStartTime={setSchedStartTime}
                schedEndTime={schedEndTime}
                setSchedEndTime={setSchedEndTime}
                schedAutoPlay={schedAutoPlay}
                setSchedAutoPlay={setSchedAutoPlay}
                schedReminderMinutes={schedReminderMinutes}
                setSchedReminderMinutes={setSchedReminderMinutes}
                schedNotes={schedNotes}
                setSchedNotes={setSchedNotes}
                dayLabels={DAY_LABELS}
                lang={lang}
                t={t}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
            />

            {settings && (
                <OnboardingModal
                    isOpen={isOnboardingOpen}
                    onClose={() => setIsOnboardingOpen(false)}
                    settings={settings}
                    onUpdateSettings={api.updateSettings}
                    appIconDataUrl={appIconDataUrl}
                    t={t}
                    lang={lang}
                />
            )}

            <UpdateModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                updateInfo={updateInfo}
                appIconDataUrl={appIconDataUrl}
                onOpenExternalUrl={(url: string) =>
                    void api.openExternalUrl(url)
                }
                t={t}
                isChecking={isCheckingUpdate}
                error={updateCheckError}
                onCheckAgain={() => void handleCheckForUpdates(true)}
                downloadProgress={updateDownloadProgress}
                onStartDownload={handleStartDownloadUpdate}
                onCancelDownload={handleCancelDownloadUpdate}
                onInstallUpdate={handleInstallUpdate}
                onRevealInFinder={handleRevealUpdateInFinder}
            />

            {/* Non-intrusive floating indicator when downloading in background and modal is closed */}
            {updateDownloadProgress?.status === 'downloading' &&
                !isUpdateModalOpen && (
                    <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="fixed bottom-4 right-4 z-40 mac-modal-surface shadow-2xl border border-accent/40 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-fade-in hover:scale-[1.02] transition cursor-pointer text-xs"
                        title="Klik untuk membuka jendela pembaruan"
                    >
                        <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                            <IconSpinner size={13} className="animate-spin" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                                <span>{t.updatesDownloadingBadge}</span>
                                <span className="font-mono text-accent text-[11px] font-bold tabular-nums">
                                    {updateDownloadProgress.percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="text-[10px] text-secondary">
                                {t.updatesBackgroundNote}
                            </div>
                        </div>
                    </button>
                )}

            {/* Non-intrusive floating indicator when download completed and modal is closed */}
            {updateDownloadProgress?.status === 'completed' &&
                !isUpdateModalOpen && (
                    <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="fixed bottom-4 right-4 z-40 mac-modal-surface shadow-2xl border border-[#30D158]/50 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-fade-in hover:scale-[1.02] transition cursor-pointer text-xs"
                        title="Klik untuk memasang pembaruan"
                    >
                        <div className="w-6 h-6 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center shrink-0">
                            <IconCheck size={14} />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold text-foreground">
                                {t.updatesDownloadedBadge}
                            </div>
                            <div className="text-[10px] text-secondary">
                                {t.updatesReadySubtitle}
                            </div>
                        </div>
                    </button>
                )}
        </div>
    );
};
export default App;
