import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslations } from '../i18n';
import type {
    AppSettings,
    DiscoverStationItem,
    ListeningStatsSummary,
    PlayerState,
    RadioBrowserCountry,
    ShowSchedule,
    Station,
    StreamTestResult,
    StreamType
} from '../types';
import {
    applyAppearanceVariables,
    bindActiveScrollbars,
    FALLBACK_COUNTRIES
} from '../utils/appearance';
import { OnboardingModal } from '../components/OnboardingModal';
import { UpdateModal, type UpdateCheckResult } from '../components/UpdateModal';

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

declare global {
    interface Window {
        squelchApi: SquelchWindowApi;
        queryLocalFonts?: () => Promise<Array<{ family: string }>>;
    }
}

function isScheduleCurrentlyOnAir(sched: ShowSchedule): boolean {
    if (!sched.enabled) return false;
    const now = new Date();
    const currentDay = now.getDay();
    if (!sched.daysOfWeek.includes(currentDay)) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = sched.startTime.split(':').map((v) => parseInt(v, 10));
    const [eH, eM] = sched.endTime.split(':').map((v) => parseInt(v, 10));
    const startMin = (sH || 0) * 60 + (sM || 0);
    const endMin = (eH || 0) * 60 + (eM || 0);
    return currentMinutes >= startMin && currentMinutes < endMin;
}

function formatKeyboardEventToAccelerator(e: KeyboardEvent): string | null {
    const ignoredKeys = new Set([
        'Meta',
        'Control',
        'Shift',
        'Alt',
        'CapsLock',
        'Tab'
    ]);
    if (ignoredKeys.has(e.key)) return null;

    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let mainKey = e.key;
    if (mainKey === ' ') mainKey = 'Space';
    else if (mainKey === 'ArrowUp') mainKey = 'Up';
    else if (mainKey === 'ArrowDown') mainKey = 'Down';
    else if (mainKey === 'ArrowLeft') mainKey = 'Left';
    else if (mainKey === 'ArrowRight') mainKey = 'Right';
    else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

    // Require at least one modifier unless it's a Function/Media key
    if (parts.length === 0 && !/^F\d+$|^Media/i.test(mainKey)) {
        parts.push('CommandOrControl');
    }

    parts.push(mainKey);
    return parts.join('+');
}

export const App: React.FC = () => {
    const api = window.squelchApi;

    const initialHash = window.location.hash.replace('#', '') as ActiveTab;
    const validInitialTab: ActiveTab = [
        'stations',
        'schedules',
        'discover',
        'stats',
        'preferences',
        'about'
    ].includes(initialHash)
        ? initialHash
        : 'stations';

    const [activeTab, setActiveTab] = useState<ActiveTab>(validInitialTab);
    const [tabHistory, setTabHistory] = useState<ActiveTab[]>([
        validInitialTab
    ]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const navigateToTab = (nextTab: ActiveTab) => {
        if (nextTab === activeTab) return;
        const sliced = tabHistory.slice(0, historyIndex + 1);
        sliced.push(nextTab);
        setTabHistory(sliced);
        setHistoryIndex(sliced.length - 1);
        setActiveTab(nextTab);
    };

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < tabHistory.length - 1;

    const goBack = () => {
        if (!canGoBack) return;
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setActiveTab(tabHistory[prevIdx]);
    };

    const goForward = () => {
        if (!canGoForward) return;
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setActiveTab(tabHistory[nextIdx]);
    };

    // Core data states
    const [stations, setStations] = useState<Station[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [dataDir, setDataDir] = useState<string>('');
    const [systemFonts, setSystemFonts] = useState<string[]>([]);
    const [appIconDataUrl, setAppIconDataUrl] = useState<string | null>(null);
    const [statsSummary, setStatsSummary] =
        useState<ListeningStatsSummary | null>(null);
    const [statsViewMode, setStatsViewMode] =
        useState<StatsPeriodMode>('weekly');

    // Player states
    const [playerState, setPlayerState] = useState<PlayerState>('idle');
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [streamTitle, setStreamTitle] = useState<string | null>(null);
    const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(
        null
    );

    // Filters & UI states in Manage Stations
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
    const [hideOffline, setHideOffline] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
    const [draggedStationId, setDraggedStationId] = useState<string | null>(
        null
    );
    const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

    // Add/Edit Station Modal
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingStation, setEditingStation] = useState<Station | null>(null);
    const [formName, setFormName] = useState<string>('');
    const [formUrl, setFormUrl] = useState<string>('');
    const [formLogo, setFormLogo] = useState<string>('');
    const [formGenre, setFormGenre] = useState<string>('Pop');
    const [formCity, setFormCity] = useState<string>('Jakarta');
    const [formCountry, setFormCountry] = useState<string>('ID');
    const [formGroup, setFormGroup] = useState<string>('Pop & Anak Muda');
    const [formType, setFormType] = useState<StreamType>('mp3');
    const [formTags, setFormTags] = useState<string>('');
    const [isTestingStream, setIsTestingStream] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<StreamTestResult | null>(null);

    // Import/Export Modal
    const [isImportExportOpen, setIsImportExportOpen] =
        useState<boolean>(false);
    const [ieFormat, setIeFormat] = useState<'json' | 'm3u' | 'pls'>('json');
    const [ieDuplicateStrategy, setIeDuplicateStrategy] = useState<
        'skip' | 'overwrite' | 'duplicate'
    >('skip');
    const [ieTextContent, setIeTextContent] = useState<string>('');
    const [ieStatusMessage, setIeStatusMessage] = useState<string>('');

    // Discover Tab
    const [discCountries, setDiscCountries] =
        useState<RadioBrowserCountry[]>(FALLBACK_COUNTRIES);
    const [discCountry, setDiscCountry] = useState<string>('ID');
    const [discName, setDiscName] = useState<string>('');
    const [discTag, setDiscTag] = useState<string>('');
    const [discResults, setDiscResults] = useState<DiscoverStationItem[]>([]);
    const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
    const [discError, setDiscError] = useState<string | null>(null);

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
    const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState<boolean>(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(
        null
    );
    const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
    const [updateCheckError, setUpdateCheckError] = useState<string | null>(
        null
    );
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
    const [notifTestSuccess, setNotifTestSuccess] = useState<boolean>(false);

    // Show Schedules
    const [schedules, setSchedules] = useState<ShowSchedule[]>([]);
    const [isScheduleModalOpen, setIsScheduleModalOpen] =
        useState<boolean>(false);
    const [editingSchedule, setEditingSchedule] = useState<ShowSchedule | null>(
        null
    );
    const [schedStationId, setSchedStationId] = useState<string>('');
    const [schedShowName, setSchedShowName] = useState<string>('');
    const [schedHost, setSchedHost] = useState<string>('');
    const [schedDays, setSchedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [schedStartTime, setSchedStartTime] = useState<string>('06:00');
    const [schedEndTime, setSchedEndTime] = useState<string>('10:00');
    const [schedAutoPlay, setSchedAutoPlay] = useState<boolean>(true);
    const [schedReminderMinutes, setSchedReminderMinutes] = useState<number>(5);
    const [schedNotes, setSchedNotes] = useState<string>('');

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
        }
    };

    useEffect(() => {
        const unbindScrollbars = bindActiveScrollbars();
        void refreshAll();
        void loadAvailableSystemFonts();
        void api.getAppIconDataUrl().then(setAppIconDataUrl);
        void api
            .getOnlineCountries()
            .then((list) => {
                if (Array.isArray(list) && list.length > 0) {
                    setDiscCountries(list);
                }
            })
            .catch(() => {
                // Keep FALLBACK_COUNTRIES
            });

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
                })
                .catch(() => {});
        }

        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('squelch:open-about', handleCustomOpenAbout);
        window.addEventListener(
            'squelch:confirm-quit',
            handleCustomConfirmQuit
        );
        window.addEventListener('squelch:navigate', handleCustomNavigate);
        handleHashChange();

        return () => {
            unbindScrollbars();
            unsub();
            if (unlistenAbout) unlistenAbout();
            if (unlistenQuit) unlistenQuit();
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
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'discover' && discResults.length === 0) {
            void handleDiscoverSearch();
        }
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

    const handleCheckForUpdates = async (manual = true) => {
        setIsCheckingUpdate(true);
        setUpdateCheckError(null);
        try {
            const res = await api.checkForUpdates();
            setUpdateInfo(res);
            if (res.hasUpdate) {
                setIsUpdateModalOpen(true);
            }
        } catch (err: any) {
            console.error('Update check failed:', err);
            if (manual) {
                setUpdateCheckError(err?.message || String(err));
            }
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    // Auto-check for updates quietly 3s after startup
    useEffect(() => {
        if (settings && settings.autoCheckUpdates !== false) {
            const timer = setTimeout(() => {
                void handleCheckForUpdates(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [settings?.autoCheckUpdates]);

    // Direct Keyboard Shortcut Recorder Listener
    useEffect(() => {
        if (!recordingShortcutKey || !settings) return;

        const handleRecordKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
                setRecordingShortcutKey(null);
                return;
            }

            const accel = formatKeyboardEventToAccelerator(e);
            if (!accel) return;

            void api.updateSettings({
                shortcuts: {
                    ...settings.shortcuts,
                    [recordingShortcutKey]: accel
                }
            });
            setRecordingShortcutKey(null);
        };

        window.addEventListener('keydown', handleRecordKeyDown, true);
        return () =>
            window.removeEventListener('keydown', handleRecordKeyDown, true);
    }, [recordingShortcutKey, settings]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (recordingShortcutKey) return;
            if (e.key === 'Escape') {
                setIsFormOpen(false);
                setIsImportExportOpen(false);
                setIsAddingGroup(false);
                setIsResetConfirmOpen(false);
                setIsAboutModalOpen(false);
                setIsQuitConfirmOpen(false);
                setUpdateInfo(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [recordingShortcutKey]);

    const isPlaying = playerState === 'playing';
    const isBusy =
        playerState === 'connecting' ||
        playerState === 'buffering' ||
        playerState === 'reconnecting';

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
                    sub: t.statusReconnectingSub,
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

    const favCount = useMemo(
        () => stations.filter((s) => s.isFavorite).length,
        [stations]
    );

    const onlineCount = useMemo(
        () => stations.filter((s) => s.status === 'online').length,
        [stations]
    );

    const filteredStations = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return stations.filter((s) => {
            if (selectedGroup !== 'ALL' && s.group !== selectedGroup)
                return false;
            if (favoritesOnly && !s.isFavorite) return false;
            if (hideOffline && s.status === 'offline') return false;
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q) ||
                s.genre.toLowerCase().includes(q) ||
                s.city.toLowerCase().includes(q) ||
                s.tags.some((tag) => tag.toLowerCase().includes(q))
            );
        });
    }, [stations, selectedGroup, favoritesOnly, hideOffline, searchQuery]);

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

    const openAddStationModal = () => {
        setEditingStation(null);
        setFormName('');
        setFormUrl('');
        setFormLogo('');
        setFormGenre('Pop');
        setFormCity('Jakarta');
        setFormCountry('ID');
        setFormGroup(
            selectedGroup !== 'ALL'
                ? selectedGroup
                : groups[0] || 'Pop & Anak Muda'
        );
        setFormType('mp3');
        setFormTags('');
        setTestResult(null);
        setIsFormOpen(true);
    };

    const openEditStationModal = (st: Station) => {
        setEditingStation(st);
        setFormName(st.name);
        setFormUrl(st.streamUrl);
        setFormLogo(st.logoUrl || '');
        setFormGenre(st.genre);
        setFormCity(st.city);
        setFormCountry(st.country);
        setFormGroup(st.group);
        setFormType(st.streamType);
        setFormTags(st.tags.join(', '));
        setTestResult(null);
        setIsFormOpen(true);
    };

    const handleTestStream = async () => {
        if (!formUrl.trim()) return;
        setIsTestingStream(true);
        setTestResult(null);
        try {
            const res = await api.testStreamUrl(formUrl.trim());
            setTestResult(res);
            if (res.ok) {
                setFormType(res.streamType);
                if (res.resolvedUrl && res.resolvedUrl !== formUrl.trim()) {
                    setFormUrl(res.resolvedUrl);
                }
                if (!formName.trim() && res.icyName) {
                    setFormName(res.icyName);
                }
                if (!formLogo.trim() && res.noiceCatalogInfo?.logoUrl) {
                    setFormLogo(res.noiceCatalogInfo.logoUrl);
                }
            }
        } finally {
            setIsTestingStream(false);
        }
    };

    const handleSaveStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formUrl.trim()) return;

        await api.saveStation({
            id: editingStation?.id,
            name: formName.trim(),
            streamUrl: formUrl.trim(),
            streamType: formType,
            logoUrl: formLogo.trim() || null,
            genre: formGenre.trim() || 'Radio',
            city: formCity.trim() || 'Indonesia',
            country: formCountry.trim() || 'ID',
            group: formGroup.trim() || 'Pop & Anak Muda',
            tags: formTags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            isFavorite: editingStation?.isFavorite ?? false,
            notes: editingStation?.notes ?? '',
            status: testResult?.ok
                ? 'online'
                : (editingStation?.status ?? 'online')
        });

        setIsFormOpen(false);
        await refreshAll();
    };

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newGroupName.trim();
        if (!trimmed || groups.includes(trimmed)) return;
        const updated = [...groups, trimmed];
        await api.saveGroups(updated);
        setNewGroupName('');
        setIsAddingGroup(false);
        await refreshAll();
    };

    const handleDropStation = async (targetId: string) => {
        if (!draggedStationId || draggedStationId === targetId) return;
        const ids = stations.map((s) => s.id);
        const fromIdx = ids.indexOf(draggedStationId);
        const toIdx = ids.indexOf(targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, draggedStationId);
        setDraggedStationId(null);
        await api.reorderStations(ids);
        await refreshAll();
    };

    const handleRunHealthCheck = async () => {
        setIsCheckingHealth(true);
        try {
            await api.runHealthCheck();
            await refreshAll();
        } finally {
            setIsCheckingHealth(false);
        }
    };

    const handleDiscoverSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSearchingOnline(true);
        setDiscError(null);
        try {
            const results = await api.searchOnlineStations({
                countrycode: discCountry,
                name: discName,
                tag: discTag,
                limit: 40
            });
            const seen = new Set<string>();
            const deduplicated = results.filter((st) => {
                const url = (st.streamUrl || '').trim().toLowerCase();
                const key = url || st.id;
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setDiscResults(deduplicated);
        } catch (err) {
            setDiscError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load station directory'
            );
        } finally {
            setIsSearchingOnline(false);
        }
    };

    const handleAddFromDiscover = async (
        item: DiscoverStationItem,
        playImmediately = false
    ) => {
        const saved = await api.saveStation({
            name: item.name,
            streamUrl: item.streamUrl,
            streamType: item.streamType,
            logoUrl: item.logoUrl,
            genre: item.genre,
            city: item.city,
            country: item.country,
            tags: item.tags,
            group: 'Pop & Anak Muda',
            isFavorite: false,
            status: 'online'
        });
        await refreshAll();
        if (playImmediately) {
            await api.playStation(saved.id);
        }
    };

    const handleExportLoad = async (format: 'json' | 'm3u' | 'pls') => {
        setIeFormat(format);
        const content = await api.exportStations(format);
        setIeTextContent(content);
        setIeStatusMessage(`${stations.length} (${format.toUpperCase()})`);
    };

    const handleImportExecute = async () => {
        if (!ieTextContent.trim()) return;
        try {
            const res = await api.importStations({
                content: ieTextContent,
                format: ieFormat,
                duplicateStrategy: ieDuplicateStrategy
            });
            setIeStatusMessage(`+${res.importedCount} / ~${res.skippedCount}`);
            await refreshAll();
        } catch (err) {
            setIeStatusMessage(
                err instanceof Error ? err.message : 'Invalid playlist format'
            );
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
            await refreshAll();
            setBackupStatusMsg(t.prefRestoreSuccess);
            setTimeout(() => setBackupStatusMsg(null), 3500);
        } else if (res.error) {
            setBackupStatusMsg(res.error);
        }
    };

    // Schedule action handlers
    const openAddScheduleModal = () => {
        setEditingSchedule(null);
        setSchedStationId(stations[0]?.id || 'jak-101-fm-jakarta');
        setSchedShowName('');
        setSchedHost('');
        setSchedDays([1, 2, 3, 4, 5]);
        setSchedStartTime('06:00');
        setSchedEndTime('10:00');
        setSchedAutoPlay(true);
        setSchedReminderMinutes(5);
        setSchedNotes('');
        setIsScheduleModalOpen(true);
    };

    const openEditScheduleModal = (sched: ShowSchedule) => {
        setEditingSchedule(sched);
        setSchedStationId(sched.stationId);
        setSchedShowName(sched.showName);
        setSchedHost(sched.host || '');
        setSchedDays([...sched.daysOfWeek]);
        setSchedStartTime(sched.startTime);
        setSchedEndTime(sched.endTime);
        setSchedAutoPlay(sched.autoPlay);
        setSchedReminderMinutes(sched.reminderMinutes);
        setSchedNotes(sched.notes || '');
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedShowName.trim() || !schedStationId) return;

        const matchedStation = stations.find((s) => s.id === schedStationId);
        await api.saveSchedule({
            id: editingSchedule?.id,
            stationId: schedStationId,
            stationName: matchedStation?.name || schedStationId,
            showName: schedShowName.trim(),
            host: schedHost.trim(),
            daysOfWeek: schedDays.length > 0 ? schedDays : [1, 2, 3, 4, 5],
            startTime: schedStartTime,
            endTime: schedEndTime,
            autoPlay: schedAutoPlay,
            reminderMinutes: schedReminderMinutes,
            enabled: editingSchedule ? editingSchedule.enabled : true,
            notes: schedNotes.trim()
        });

        setIsScheduleModalOpen(false);
        await refreshAll();
    };

    const handleDeleteSchedule = async (id: string) => {
        await api.deleteSchedule(id);
        await refreshAll();
    };

    const handleToggleSchedule = async (id: string, enabled?: boolean) => {
        await api.toggleSchedule(id, enabled);
        await refreshAll();
    };

    const handleToggleScheduleAutoPlay = async (id: string) => {
        await api.toggleScheduleAutoPlay(id);
        await refreshAll();
    };

    const isPlayingStation = (stationId?: string) => {
        if (!stationId || !currentStation) return false;
        return (
            (currentStation.id === stationId ||
                (Boolean(currentStation.streamUrl) &&
                    stations.find((s) => s.id === stationId)?.streamUrl ===
                        currentStation.streamUrl)) &&
            (isPlaying || isBusy)
        );
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
                onlineCount={onlineCount}
                enabledSchedulesCount={
                    schedules.filter((s) => s.enabled).length
                }
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

                <main className="flex-1 overflow-y-auto px-6 pt-1 pb-8">
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
                        />
                    )}

                    {activeTab === 'preferences' && settings && (
                        <PreferencesTab
                            settings={settings}
                            systemFonts={systemFonts}
                            lang={lang}
                            recordingShortcutKey={recordingShortcutKey}
                            setRecordingShortcutKey={setRecordingShortcutKey}
                            backupStatusMsg={backupStatusMsg}
                            handleRestoreData={handleRestoreData}
                            handleBackupData={handleBackupData}
                            updateInfo={updateInfo}
                            updateCheckError={updateCheckError}
                            isCheckingUpdate={isCheckingUpdate}
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
                    await api.resetSettings();
                    await refreshAll();
                }}
                title={t.prefResetBtn}
                description={t.prefResetDesc}
                cancelBtnText={t.cancelBtn}
                confirmBtnText={t.prefResetBtn}
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
                onClose={() => setIsAboutModalOpen(false)}
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
            />
        </div>
    );
};
export default App;
