import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    AppSettings,
    ListeningStatsSummary,
    PlayerState,
    ShowSchedule,
    Station
} from '../../types';
import type { ActiveTab, SquelchWindowApi, StatsPeriodMode } from '../types';
import {
    applyAppearanceVariables,
    bindActiveScrollbars
} from '../../utils/appearance';

export interface UseAppCoreDataOptions {
    api: SquelchWindowApi;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    setIsAboutModalOpen: (open: boolean) => void;
    setIsQuitConfirmOpen: (open: boolean) => void;
    handleCheckForUpdates: (manual?: boolean) => Promise<void>;
    onSchedulesLoaded?: (scheds: ShowSchedule[]) => void;
}

export function useAppCoreData({
    api,
    activeTab,
    setActiveTab,
    setIsAboutModalOpen,
    setIsQuitConfirmOpen,
    handleCheckForUpdates,
    onSchedulesLoaded
}: UseAppCoreDataOptions) {
    // Core data states
    const [stations, setStations] = useState<Station[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [dataDir, setDataDir] = useState<string>('');
    const [systemFonts, setSystemFonts] = useState<string[]>([]);
    const [isLoadingFonts, setIsLoadingFonts] = useState<boolean>(false);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
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
    const [diagnosticsText, setDiagnosticsText] = useState<string>('');

    const refreshAll = useCallback(async () => {
        try {
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
            if (Array.isArray(schedList) && onSchedulesLoaded) {
                onSchedulesLoaded(schedList);
            }
            applyAppearanceVariables(cfg.settings);
        } finally {
            setIsInitialLoading(false);
        }
    }, [api, onSchedulesLoaded]);

    const loadAvailableSystemFonts = useCallback(async () => {
        setIsLoadingFonts(true);
        try {
            const mainFonts = await api.getSystemFonts();
            if (Array.isArray(mainFonts) && mainFonts.length > 0) {
                setSystemFonts(mainFonts);
                return;
            }
            if (typeof window.queryLocalFonts === 'function') {
                try {
                    const local = await window.queryLocalFonts();
                    const merged = new Set<string>(mainFonts || []);
                    for (const item of local) {
                        if (item.family && !item.family.startsWith('.')) {
                            merged.add(item.family);
                        }
                    }
                    if (merged.size > 0) {
                        setSystemFonts(
                            Array.from(merged).sort((a, b) => a.localeCompare(b))
                        );
                        return;
                    }
                } catch {
                    // Fallback to main process font list
                }
            }
            setSystemFonts(mainFonts || []);
        } catch {
            setSystemFonts([]);
        } finally {
            setIsLoadingFonts(false);
        }
    }, [api]);

    // System fonts loading lifecycle
    useEffect(() => {
        void loadAvailableSystemFonts();
    }, [loadAvailableSystemFonts]);

    useEffect(() => {
        if (activeTab === 'preferences' && systemFonts.length === 0 && !isLoadingFonts) {
            void loadAvailableSystemFonts();
        }
    }, [activeTab, systemFonts.length, isLoadingFonts, loadAvailableSystemFonts]);

    // Initial setup and IPC listeners
    useEffect(() => {
        const unbindScrollbars = bindActiveScrollbars();
        void refreshAll();
        void api.getAppIconDataUrl().then(setAppIconDataUrl);

        const unsub = api.onStateChanged((evt: unknown) => {
            const data = evt as {
                type?: string;
                tab?: string;
                state?: PlayerState;
                currentStation?: Station | null;
                streamTitle?: string | null;
                reconnectAttempt?: number | null;
                sleepTimerRemainingSec?: number | null;
            };

            if (data?.type === 'navigate' && data.tab) {
                const targetTab: ActiveTab =
                    data.tab === 'diagnostics'
                        ? 'preferences'
                        : (data.tab as ActiveTab);
                setActiveTab(targetTab);
                return;
            }

            // Player status update: mutate in-memory state without redundant disk I/O and CSS reflows
            if (data?.state !== undefined) {
                setPlayerState(data.state);
                if (data.currentStation !== undefined) {
                    setCurrentStation(data.currentStation);
                }
                if (data.streamTitle !== undefined) {
                    setStreamTitle(data.streamTitle);
                }
                if (data.reconnectAttempt !== undefined) {
                    setReconnectAttempt(data.reconnectAttempt ?? null);
                }
                if (data.sleepTimerRemainingSec !== undefined) {
                    setSleepRemainingSec(data.sleepTimerRemainingSec ?? null);
                }
                return;
            }

            if (data?.type === 'settings' && (data as any)?.settings) {
                const s = (data as any).settings;
                setSettings(s);
                applyAppearanceVariables(s);
                return;
            }

            void refreshAll();
        });

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
        let unlistenNavigate: (() => void) | null = null;
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
                    listen('squelch:navigate', (evt) => {
                        if (evt?.payload) {
                            setActiveTab(evt.payload as ActiveTab);
                        }
                    }).then((u) => {
                        unlistenNavigate = u;
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
            if (unlistenNavigate) unlistenNavigate();
            if (unlistenUpdate) unlistenUpdate();
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
    }, [
        api,
        handleCheckForUpdates,
        refreshAll,
        setActiveTab,
        setIsAboutModalOpen,
        setIsQuitConfirmOpen
    ]);

    // Tab-dependent data fetching
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
    }, [activeTab, api]);

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

    return {
        isInitialLoading,
        stations,
        setStations,
        groups,
        setGroups,
        settings,
        setSettings,
        dataDir,
        systemFonts,
        isLoadingFonts,
        appIconDataUrl,
        statsSummary,
        setStatsSummary,
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
    };
}
