import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { getTranslations } from '../i18n';
import type { ShowSchedule } from '../types';
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
import { useScheduleManagement } from './hooks/useScheduleManagement';
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
    const [isResetting, setIsResetting] = useState<boolean>(false);
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
    const appUpdates = useAppUpdates({
        api,
        autoCheckUpdates: true
    });

    // Schedule list bridge ref
    const setSchedulesRef = useRef<(scheds: ShowSchedule[]) => void>(() => {});
    const handleSchedulesLoaded = useCallback((scheds: ShowSchedule[]) => {
        setSchedulesRef.current(scheds);
    }, []);

    // Core Data & State Synchronization Hook
    const appCoreData = useAppCoreData({
        api,
        activeTab,
        setActiveTab,
        setIsAboutModalOpen,
        setIsQuitConfirmOpen,
        handleCheckForUpdates: appUpdates.handleCheckForUpdates,
        onSchedulesLoaded: handleSchedulesLoaded
    });

    const isPlaying = appCoreData.playerState === 'playing';
    const isBusy =
        appCoreData.playerState === 'connecting' ||
        appCoreData.playerState === 'buffering' ||
        appCoreData.playerState === 'reconnecting';

    // Filters, Group Management & Reordering Hook
    const stationManagement = useStationManagement({
        stations: appCoreData.stations,
        groups: appCoreData.groups,
        currentStation: appCoreData.currentStation,
        isPlaying,
        isBusy,
        api,
        refreshAll: () => appCoreData.refreshAll()
    });

    // Discover Tab Hook
    const discoverStations = useDiscoverStations({
        api,
        refreshAll: () => appCoreData.refreshAll(),
        activeTab
    });

    // Station Form Modal Hook
    const stationModal = useStationModal({
        groups: appCoreData.groups,
        selectedGroup: stationManagement.selectedGroup,
        api,
        refreshAll: () => appCoreData.refreshAll()
    });

    // Import / Export Modal Hook
    const importExportModal = useImportExportModal({
        stationsCount: appCoreData.stations.length,
        api,
        refreshAll: () => appCoreData.refreshAll()
    });

    // Schedule Management Hook
    const scheduleManagement = useScheduleManagement({
        stations: appCoreData.stations,
        api,
        refreshAll: () => appCoreData.refreshAll()
    });

    // Connect bridge ref for schedule reload
    useEffect(() => {
        setSchedulesRef.current = scheduleManagement.setSchedules;
    }, [scheduleManagement.setSchedules]);

    // Search input ref & shortcut label (⌘F / Ctrl+F)
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

    const lang: 'id' | 'en' = appCoreData.settings?.language ?? 'id';
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
        if (appCoreData.settings && appCoreData.settings.hasCompletedOnboarding === false) {
            setIsOnboardingOpen(true);
        }
    }, [appCoreData.settings?.hasCompletedOnboarding]);

    const handleCloseAllModals = useCallback(() => {
        stationModal.setIsFormOpen(false);
        importExportModal.setIsImportExportOpen(false);
        stationManagement.setIsAddingGroup(false);
        setIsResetConfirmOpen(false);
        setIsAboutModalOpen(false);
        setIsQuitConfirmOpen(false);
        appUpdates.setUpdateInfo(null);
        scheduleManagement.setIsScheduleModalOpen(false);
        appUpdates.setIsUpdateModalOpen(false);
        setIsOnboardingOpen(false);
    }, [
        stationModal,
        importExportModal,
        stationManagement,
        appUpdates,
        scheduleManagement
    ]);

    useAppShortcuts({
        recordingShortcutKey: recordingShortcutKey as any,
        currentStation: appCoreData.currentStation,
        searchInputRef,
        navigateToTab,
        onCloseAllModals: handleCloseAllModals,
        api
    });

    const stateHeadline = useMemo(() => {
        switch (appCoreData.playerState) {
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
                    sub: appCoreData.reconnectAttempt
                        ? `${t.statusReconnectingSub} (${appCoreData.reconnectAttempt})`
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
    }, [appCoreData.playerState, appCoreData.reconnectAttempt, t]);

    const currentHeadingTitle = useMemo(() => {
        if (activeTab === 'schedules') return t.tabSchedules;
        if (activeTab === 'discover') return t.tabDiscover;
        if (activeTab === 'stats') return t.tabStats;
        if (activeTab === 'preferences') return t.tabPreferences;
        if (activeTab === 'about') return t.tabAbout;
        if (stationManagement.favoritesOnly) return t.favoritesTitle;
        if (stationManagement.selectedGroup !== 'ALL') return stationManagement.selectedGroup;
        return t.allStationsTitle;
    }, [activeTab, stationManagement.favoritesOnly, stationManagement.selectedGroup, t]);

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

    const handleConfirmReset = async () => {
        setIsResetting(true);
        try {
            if (resetTarget === 'stations') {
                await api.clearStationsData();
                appCoreData.setStations([]);
                appCoreData.setGroups([
                    'Pop & Anak Muda',
                    'Nasional & Berita',
                    'Lainnya & Nostalgia'
                ]);
            } else if (resetTarget === 'schedules') {
                await api.clearSchedulesData();
                setSchedulesRef.current([]);
            } else if (resetTarget === 'stats') {
                await api.clearListeningStats();
                appCoreData.setStatsSummary(null);
            } else if (resetTarget === 'all') {
                await api.clearStationsData();
                await api.clearSchedulesData();
                await api.clearListeningStats();
                appCoreData.setStations([]);
                appCoreData.setGroups([
                    'Pop & Anak Muda',
                    'Nasional & Berita',
                    'Lainnya & Nostalgia'
                ]);
                setSchedulesRef.current([]);
                appCoreData.setStatsSummary(null);
            } else {
                const res = await api.resetSettings();
                if (res) {
                    appCoreData.setSettings(res);
                    applyAppearanceVariables(res);
                }
            }
        } finally {
            setIsResetting(false);
            setIsResetConfirmOpen(false);
        }
    };

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
            await appCoreData.refreshAll();
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
                appIconDataUrl={appCoreData.appIconDataUrl}
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
                searchQuery={stationManagement.searchQuery}
                setSearchQuery={stationManagement.setSearchQuery}
                searchInputRef={searchInputRef}
                isMac={isMac}
                currentStation={appCoreData.currentStation}
                playerState={appCoreData.playerState}
                stateHeadline={stateHeadline}
                streamTitle={appCoreData.streamTitle}
                isPlaying={isPlaying}
                isBusy={isBusy}
                settings={appCoreData.settings}
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
                    updateInfo={appUpdates.updateInfo}
                    setIsUpdateModalOpen={appUpdates.setIsUpdateModalOpen}
                    onMouseDown={handleWindowDragMouseDown}
                />

                <main className="flex-1 overflow-y-auto px-6 pt-1 pb-8 flex flex-col">
                    <SleepCountdownBanner
                        sleepRemainingSec={appCoreData.sleepRemainingSec}
                        api={api}
                        t={t}
                    />

                    <TabContentHost
                        activeTab={activeTab}
                        appCoreData={appCoreData}
                        stationManagement={stationManagement}
                        scheduleManagement={scheduleManagement}
                        discoverStations={discoverStations}
                        stationModal={stationModal}
                        importExportModal={importExportModal}
                        appUpdates={appUpdates}
                        currentHeadingTitle={currentHeadingTitle}
                        lang={lang}
                        t={t}
                        api={api}
                        setActiveTab={setActiveTab}
                        recordingShortcutKey={recordingShortcutKey}
                        setRecordingShortcutKey={setRecordingShortcutKey}
                        backupStatusMsg={backupStatusMsg}
                        handleRestoreData={handleRestoreData}
                        handleBackupData={handleBackupData}
                        setIsUpdateModalOpen={appUpdates.setIsUpdateModalOpen}
                        setIsOnboardingOpen={setIsOnboardingOpen}
                        notifTestSuccess={notifTestSuccess}
                        setNotifTestSuccess={setNotifTestSuccess}
                        copiedDiag={copiedDiag}
                        setCopiedDiag={setCopiedDiag}
                        showDiagReport={showDiagReport}
                        setShowDiagReport={setShowDiagReport}
                        setIsResetConfirmOpen={setIsResetConfirmOpen}
                        onRequestReset={handleRequestReset}
                    />
                </main>
            </div>

            {/* MODALS & FLOATING BADGES */}
            <AppModalsHost
                api={api}
                t={t}
                lang={lang}
                appCoreData={appCoreData}
                stationModal={stationModal}
                importExportModal={importExportModal}
                scheduleManagement={scheduleManagement}
                appUpdates={appUpdates}
                resetModal={{
                    isOpen: isResetConfirmOpen,
                    onClose: () => {
                        if (!isResetting) setIsResetConfirmOpen(false);
                    },
                    onConfirm: handleConfirmReset,
                    title: resetModalMeta.title,
                    description: resetModalMeta.description,
                    confirmBtnText: resetModalMeta.confirmBtn,
                    isPending: isResetting
                }}
                quitModal={{
                    isOpen: isQuitConfirmOpen,
                    onClose: () => setIsQuitConfirmOpen(false),
                    onConfirm: () => void api.quitApp()
                }}
                aboutModal={{
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
                onboardingModal={{
                    isOpen: isOnboardingOpen,
                    onClose: () => setIsOnboardingOpen(false)
                }}
            />
        </div>
    );
};
export default App;
