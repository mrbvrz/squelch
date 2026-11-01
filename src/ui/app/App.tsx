import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslations, SUPPORTED_LOCALES } from '../i18n';
import type {
    Station,
    StationsDataSchema,
    StreamType
} from '../../core/stations/station.model';
import type {
    AppSettings,
    ThemeMode
} from '../../core/settings/settings.model';
import type { StreamTestResult } from '../../core/player/stream-tester';
import type {
    DiscoverStationItem,
    RadioBrowserCountry
} from '../../core/discover/radio-browser.client';
import type { PlayerState } from '../../core/player/player-state-machine';
import type { ListeningStatsSummary } from '../../core/stats/listening-tracker';
import {
    ACCENT_SWATCHES,
    applyAppearanceVariables,
    bindActiveScrollbars,
    countryCodeToFlag,
    FALLBACK_COUNTRIES,
    formatDurationCompact
} from '../utils/appearance';
import {
    IconBackup,
    IconBell,
    IconCalendar,
    IconChart,
    IconCheck,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconClose,
    IconCompass,
    IconCopy,
    IconEdit,
    IconExternalLink,
    IconFolder,
    IconGitHub,
    IconGlobe,
    IconInfo,
    IconKey,
    IconPause,
    IconPlay,
    IconPlus,
    IconPower,
    IconPulse,
    IconRadioTower,
    IconRestore,
    IconSearch,
    IconSliders,
    IconSpinner,
    IconStar,
    IconStop,
    IconSwatch,
    IconTransfer,
    IconTrash,
    IconWarning
} from '../components/Icons';
import { StationAvatar } from '../components/StationAvatar';
import { SquircleAppIcon } from '../components/SquircleAppIcon';
import { SearchableFontPicker } from '../components/SearchableFontPicker';
import { OnboardingModal } from '../components/OnboardingModal';
import type {
    NewShowScheduleInput,
    ShowSchedule
} from '../../core/schedules/schedule.model';

const GITHUB_REPO_URL = 'https://github.com/mrbvrz/squelch';
const AUTHOR_WEBSITE_URL = 'https://mrbvrz.web.id';
const SPEC_DOC_URL =
    'https://github.com/mrbvrz/squelch/blob/main/ARCHITECTURE.md';
const CHANGELOG_DOC_URL =
    'https://github.com/mrbvrz/squelch/blob/main/CHANGELOG.md';

interface SquelchWindowApi {
    getPlayerStatus: () => Promise<{
        state: PlayerState;
        currentStation: Station | null;
        streamTitle: string | null;
        sleepTimerMinutes: number | null;
        sleepTimerRemainingSec: number | null;
    }>;
    playStation: (stationId: string) => Promise<boolean>;
    togglePlayPause: () => Promise<boolean>;
    stopPlayback: () => Promise<boolean>;
    setSleepTimer: (minutes: number | null) => Promise<boolean>;
    openWindowTab: (
        tab: 'stations' | 'discover' | 'stats' | 'preferences' | 'about'
    ) => Promise<boolean>;
    quitApp: () => Promise<boolean>;
    getAppIconDataUrl: () => Promise<string | null>;
    openAboutWindow: () => Promise<boolean>;
    openExternalUrl: (url: string) => Promise<boolean>;
    getStationsData: () => Promise<StationsDataSchema>;
    getSchedules: () => Promise<ShowSchedule[]>;
    saveSchedule: (schedule: NewShowScheduleInput) => Promise<ShowSchedule>;
    deleteSchedule: (id: string) => Promise<boolean>;
    toggleSchedule: (
        id: string,
        enabled?: boolean
    ) => Promise<ShowSchedule | undefined>;
    toggleScheduleAutoPlay: (id: string) => Promise<ShowSchedule | undefined>;
    resolveStationLogo: (logoUrl: string) => Promise<string | null>;
    saveStation: (
        station: Partial<Station> & { name: string; streamUrl: string }
    ) => Promise<Station>;
    deleteStation: (stationId: string) => Promise<boolean>;
    toggleFavorite: (stationId: string) => Promise<Station | undefined>;
    reorderStations: (orderedIds: string[]) => Promise<boolean>;
    saveGroups: (groups: string[]) => Promise<string[]>;
    renameGroup: (
        oldName: string,
        newName: string
    ) => Promise<StationsDataSchema>;
    deleteGroup: (
        groupName: string,
        moveToGroup?: string
    ) => Promise<StationsDataSchema>;
    testStreamUrl: (url: string) => Promise<StreamTestResult>;
    runHealthCheck: () => Promise<{
        results: Array<{ stationId: string; ok: boolean }>;
        stations: Station[];
    }>;
    removeOfflineStations: () => Promise<number>;
    exportStations: (format: 'json' | 'm3u' | 'pls') => Promise<string>;
    importStations: (payload: {
        content: string;
        format: 'json' | 'm3u' | 'pls';
        duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
    }) => Promise<{ importedCount: number; skippedCount: number }>;
    getOnlineCountries: () => Promise<RadioBrowserCountry[]>;
    searchOnlineStations: (query: {
        countrycode?: string;
        name?: string;
        tag?: string;
        language?: string;
        limit?: number;
    }) => Promise<DiscoverStationItem[]>;
    getSettings: () => Promise<{ settings: AppSettings; dataDir: string }>;
    updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    resetSettings: () => Promise<AppSettings>;
    getSystemFonts: () => Promise<string[]>;
    backupAppData: () => Promise<{
        ok: boolean;
        filePath?: string;
        canceled?: boolean;
        error?: string;
    }>;
    restoreAppData: () => Promise<{
        ok: boolean;
        filePath?: string;
        canceled?: boolean;
        error?: string;
    }>;
    getListeningStats: () => Promise<ListeningStatsSummary>;
    getDiagnostics: () => Promise<string>;
    openLogsFolder: () => Promise<boolean>;
    onStateChanged: (cb: (data: unknown) => void) => () => void;
}

declare global {
    interface Window {
        squelchApi: SquelchWindowApi;
        queryLocalFonts?: () => Promise<Array<{ family: string }>>;
    }
}

type ActiveTab =
    'stations' | 'schedules' | 'discover' | 'stats' | 'preferences' | 'about';
type StatsPeriodMode = 'weekly' | 'monthly' | 'yearly';

const DAY_LABELS = [
    { day: 0, labelId: 'Min', labelEn: 'Sun' },
    { day: 1, labelId: 'Sen', labelEn: 'Mon' },
    { day: 2, labelId: 'Sel', labelEn: 'Tue' },
    { day: 3, labelId: 'Rab', labelEn: 'Wed' },
    { day: 4, labelId: 'Kam', labelEn: 'Thu' },
    { day: 5, labelId: 'Jum', labelEn: 'Fri' },
    { day: 6, labelId: 'Sab', labelEn: 'Sat' }
];

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

const MacToggle: React.FC<{
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}> = ({ checked, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-10 h-[22px] rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
            checked
                ? 'bg-accent'
                : 'bg-black/20 dark:bg-white/15 border mac-divider'
        }`}
    >
        <span
            className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-[18px]' : 'translate-x-0'
            }`}
        />
    </button>
);

const ThemePreviewCard: React.FC<{
    mode: ThemeMode;
    active: boolean;
    label: string;
    onSelect: () => void;
}> = ({ mode, active, label, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-center gap-2 cursor-pointer group focus:outline-none"
    >
        <div
            className={`w-32 h-20 rounded-[10px] overflow-hidden border-2 transition p-1.5 flex flex-col justify-between relative ${
                active
                    ? 'border-accent shadow-[0_0_0_2px_rgba(10,132,255,0.25)]'
                    : 'border-white/15 hover:border-white/30'
            }`}
            style={{
                background:
                    mode === 'light'
                        ? '#F2F3F7'
                        : mode === 'dark'
                          ? '#1C1D22'
                          : 'linear-gradient(135deg, #F2F3F7 50%, #1C1D22 50%)'
            }}
        >
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
            </div>

            <div className="flex gap-1.5 flex-1 mt-1.5">
                <div
                    className="w-8 rounded-[4px]"
                    style={{
                        background:
                            mode === 'light'
                                ? 'rgba(0,0,0,0.08)'
                                : 'rgba(255,255,255,0.12)'
                    }}
                />
                <div className="flex-1 flex flex-col gap-1">
                    <div
                        className="h-3 rounded-[3px] w-full"
                        style={{
                            background: 'var(--accent-color, #0A84FF)',
                            opacity: 0.85
                        }}
                    />
                    <div
                        className="h-2.5 rounded-[3px] w-4/5"
                        style={{
                            background:
                                mode === 'light'
                                    ? 'rgba(0,0,0,0.12)'
                                    : 'rgba(255,255,255,0.16)'
                        }}
                    />
                    <div
                        className="h-2.5 rounded-[3px] w-3/5"
                        style={{
                            background:
                                mode === 'light'
                                    ? 'rgba(0,0,0,0.08)'
                                    : 'rgba(255,255,255,0.1)'
                        }}
                    />
                </div>
            </div>
        </div>

        <span
            className={`text-[12px] font-medium ${
                active ? 'text-accent font-semibold' : 'text-secondary'
            }`}
        >
            {label}
        </span>
    </button>
);

export const App: React.FC = () => {
    const api = window.squelchApi;

    const initialHash = window.location.hash.replace('#', '') as ActiveTab;
    const validInitialTab: ActiveTab = [
        'stations',
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
    const [formNotes, setFormNotes] = useState<string>('');
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

    // Discover Tab (Country Dropdown with Flags + Search)
    const [discCountries, setDiscCountries] =
        useState<RadioBrowserCountry[]>(FALLBACK_COUNTRIES);
    const [discCountry, setDiscCountry] = useState<string>('ID');
    const [discName, setDiscName] = useState<string>('');
    const [discTag, setDiscTag] = useState<string>('');
    const [discResults, setDiscResults] = useState<DiscoverStationItem[]>([]);
    const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
    const [discError, setDiscError] = useState<string | null>(null);

    // Preferences, Shortcut Recorder, Backup/Restore, Diagnostics & Reset Confirmation
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

    // Show Schedules & Reminders State
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

    const lang = settings?.language ?? 'id';
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
            } else if (hash === '#schedule') {
                setActiveTab('schedule');
            } else if (hash === '#stats') {
                setActiveTab('stats');
            }
        };

        const handleCustomOpenAbout = () => {
            setIsAboutModalOpen(true);
        };

        const handleCustomNavigate = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                const targetTab = customEvent.detail as ActiveTab;
                setActiveTab(targetTab);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('squelch:open-about', handleCustomOpenAbout);
        window.addEventListener('squelch:navigate', handleCustomNavigate);
        handleHashChange();

        return () => {
            unbindScrollbars();
            unsub();
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener(
                'squelch:open-about',
                handleCustomOpenAbout
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
            void api.getDiagnostics().then(setDiagnosticsText);
        }
    }, [activeTab]);

    // Automatically trigger onboarding wizard on first launch
    useEffect(() => {
        if (settings && settings.hasCompletedOnboarding === false) {
            setIsOnboardingOpen(true);
        }
    }, [settings?.hasCompletedOnboarding]);

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
        setFormNotes('');
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
        setFormNotes(st.notes || '');
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
            notes: formNotes.trim(),
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
            setDiscResults(results);
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
                    <SquircleAppIcon dataUrl={appIconDataUrl} size={92} />
                    <div>
                        <div className="flex items-center justify-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Squelch
                            </h2>
                            <span className="px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                                v0.1.0
                            </span>
                        </div>
                        <div className="text-[13px] font-medium text-accent mt-0.5">
                            {t.aboutTagline}
                        </div>
                        <p className="text-[12px] text-secondary leading-relaxed mt-2.5 max-w-sm">
                            {t.aboutDescription}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                        <button
                            type="button"
                            onClick={() =>
                                void api.openExternalUrl(GITHUB_REPO_URL)
                            }
                            className="mac-glass-pill px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 cursor-pointer hover:bg-white/15 transition shadow-sm"
                        >
                            <IconGitHub size={15} />
                            <span>GitHub</span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void api.openExternalUrl(AUTHOR_WEBSITE_URL)
                            }
                            className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 shadow-sm cursor-pointer transition"
                        >
                            <IconGlobe size={15} />
                            <span>{t.aboutWebsiteBtn}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-secondary">
                        <button
                            type="button"
                            onClick={() =>
                                void api.openExternalUrl(SPEC_DOC_URL)
                            }
                            className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <span>{t.aboutSpecLink}</span>
                            <IconExternalLink size={11} />
                        </button>
                        <span>·</span>
                        <button
                            type="button"
                            onClick={() =>
                                void api.openExternalUrl(CHANGELOG_DOC_URL)
                            }
                            className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <span>{t.aboutChangelogLink}</span>
                            <IconExternalLink size={11} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mac-window-shell flex h-screen select-none overflow-hidden">
            {/* LEFT SIDEBAR: macOS System Settings Sidebar Structure */}
            <aside
                aria-label="Primary Navigation"
                className="mac-settings-sidebar w-60 shrink-0 flex flex-col justify-between px-3 pt-11 pb-3 overflow-y-auto"
            >
                <div>
                    {/* Drag Region for macOS Traffic Lights */}
                    <div
                        data-tauri-drag-region
                        onMouseDown={handleWindowDragMouseDown}
                        style={
                            { WebkitAppRegion: 'drag' } as React.CSSProperties
                        }
                        className="fixed top-0 left-0 w-60 h-10 z-10"
                    />

                    {/* 1. Pill Search Bar with ⌘F / Ctrl+F Shortcut */}
                    <div className="relative flex items-center mb-3 px-0.5">
                        <IconSearch
                            size={14}
                            className="absolute left-3.5 text-secondary pointer-events-none"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (activeTab !== 'stations') {
                                    navigateToTab('stations');
                                }
                            }}
                            placeholder={t.searchPlaceholder}
                            aria-label={t.searchPlaceholder}
                            className="mac-search-pill w-full pl-8 pr-16 py-1 rounded-full text-[12px]"
                        />
                        <div className="absolute right-2 flex items-center gap-1 pointer-events-none select-none">
                            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/10 dark:bg-white/10 border border-black/5 dark:border-white/10 text-secondary text-[10px] font-mono leading-none shadow-2xs">
                                {isMac ? '⌘' : 'Ctrl'}
                            </kbd>
                            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-white/10 dark:bg-white/10 border border-black/5 dark:border-white/10 text-secondary text-[10px] font-mono leading-none shadow-2xs">
                                F
                            </kbd>
                        </div>
                    </div>

                    {/* 2. Mini Player Deck directly underneath Search */}
                    <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-[9px] mac-settings-card mb-3.5">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => void api.togglePlayPause()}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                            <StationAvatar
                                logoUrl={currentStation?.logoUrl}
                                size="sm"
                                accentFallback
                                onResolveLogo={(url) =>
                                    api.resolveStationLogo(url)
                                }
                            />
                            <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-bold truncate leading-tight">
                                    {currentStation
                                        ? currentStation.name
                                        : 'Squelch'}
                                </div>
                                <div className="text-[10px] text-secondary truncate mt-0.5 flex items-center gap-1">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{
                                            backgroundColor: stateHeadline.color
                                        }}
                                    />
                                    <span className="truncate">
                                        {streamTitle
                                            ? streamTitle
                                            : `${stateHeadline.main} · ${stateHeadline.sub}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {playerState !== 'idle' && (
                                <button
                                    type="button"
                                    onClick={() => void api.stopPlayback()}
                                    title={t.stop}
                                    aria-label={t.stop}
                                    className="w-6 h-6 rounded-full mac-glass-pill flex items-center justify-center text-secondary hover:text-[#FF453A] cursor-pointer transition"
                                >
                                    <IconStop size={11} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => void api.togglePlayPause()}
                                title={
                                    isPlaying || isBusy
                                        ? t.statusPausedSub
                                        : t.play
                                }
                                aria-label={
                                    isPlaying || isBusy
                                        ? t.statusPausedSub
                                        : t.play
                                }
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer transition ${
                                    isPlaying || isBusy
                                        ? 'bg-[#30D158] hover:bg-[#28B84C]'
                                        : 'bg-accent hover:opacity-90'
                                }`}
                            >
                                {isPlaying || isBusy ? (
                                    <IconPause size={12} />
                                ) : (
                                    <IconPlay size={12} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 3. Main Navigation */}
                    <nav className="space-y-0.5">
                        <button
                            type="button"
                            onClick={() => navigateToTab('stations')}
                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                                activeTab === 'stations'
                                    ? 'bg-accent text-white font-medium'
                                    : 'mac-row'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-[5px] bg-[#0A84FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <IconRadioTower size={13} />
                            </span>
                            <span className="truncate flex-1 text-left">
                                {t.tabStations}
                            </span>
                            <span
                                className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold tabular-nums leading-none ${
                                    activeTab === 'stations'
                                        ? 'bg-white/25 text-white'
                                        : 'bg-[#30D158]/20 text-[#30D158]'
                                }`}
                            >
                                {onlineCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigateToTab('schedules')}
                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                                activeTab === 'schedules'
                                    ? 'bg-accent text-white font-medium'
                                    : 'mac-row'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-[5px] bg-[#FF9F0A] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <IconCalendar size={13} />
                            </span>
                            <span className="truncate flex-1 text-left">
                                {t.tabSchedules}
                            </span>
                            <span
                                className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold tabular-nums leading-none ${
                                    activeTab === 'schedules'
                                        ? 'bg-white/25 text-white'
                                        : 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                                }`}
                            >
                                {schedules.filter((s) => s.enabled).length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigateToTab('discover')}
                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                                activeTab === 'discover'
                                    ? 'bg-accent text-white font-medium'
                                    : 'mac-row'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-[5px] bg-[#32ADE6] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <IconCompass size={13} />
                            </span>
                            <span className="truncate flex-1 text-left">
                                {t.tabDiscover}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigateToTab('stats')}
                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                                activeTab === 'stats'
                                    ? 'bg-accent text-white font-medium'
                                    : 'mac-row'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-[5px] bg-[#30D158] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <IconChart size={13} />
                            </span>
                            <span className="truncate flex-1 text-left">
                                {t.tabStats}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigateToTab('preferences')}
                            className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                                activeTab === 'preferences'
                                    ? 'bg-accent text-white font-medium'
                                    : 'mac-row'
                            }`}
                        >
                            <span className="w-5 h-5 rounded-[5px] bg-[#8E8E93] text-white flex items-center justify-center shrink-0 shadow-sm">
                                <IconSliders size={13} />
                            </span>
                            <span className="truncate flex-1 text-left">
                                {t.tabPreferences}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Bottom Actions: About and Quit */}
                <div className="pt-3 border-t mac-divider space-y-0.5">
                    <button
                        type="button"
                        onClick={() => setIsAboutModalOpen(true)}
                        className="w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 mac-row text-secondary hover:text-current cursor-pointer"
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#BF5AF2] text-white flex items-center justify-center shrink-0">
                            <IconInfo size={13} />
                        </span>
                        <span>{t.tabAbout}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (settings?.confirmBeforeQuit ?? true) {
                                setIsQuitConfirmOpen(true);
                            } else {
                                void api.quitApp();
                            }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 mac-row text-secondary hover:text-current cursor-pointer"
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#FF453A] text-white flex items-center justify-center shrink-0">
                            <IconPower size={13} />
                        </span>
                        <span>{t.quitAppBtn}</span>
                    </button>
                </div>
            </aside>

            {/* RIGHT CONTENT PANE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar with Elevated < | > Navigation Pill and Page Title (No Mini Player button) */}
                <header
                    data-tauri-drag-region
                    onMouseDown={handleWindowDragMouseDown}
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                    className="h-11 pt-1.5 px-6 flex items-center justify-between shrink-0 cursor-default"
                >
                    <div
                        style={
                            {
                                WebkitAppRegion: 'no-drag'
                            } as React.CSSProperties
                        }
                        className="flex items-center gap-3.5"
                    >
                        <div className="inline-flex items-center rounded-[7px] mac-glass-pill divide-x mac-divider overflow-hidden">
                            <button
                                type="button"
                                disabled={!canGoBack}
                                onClick={goBack}
                                aria-label="Back"
                                className="px-2.5 py-1.5 disabled:opacity-30 hover:bg-white/10 cursor-pointer flex items-center justify-center transition"
                            >
                                <IconChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                disabled={!canGoForward}
                                onClick={goForward}
                                aria-label="Forward"
                                className="px-2.5 py-1.5 disabled:opacity-30 hover:bg-white/10 cursor-pointer flex items-center justify-center transition"
                            >
                                <IconChevronRight size={16} />
                            </button>
                        </div>

                        <h1 className="text-[17px] font-bold tracking-tight">
                            {currentHeadingTitle}
                        </h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-6 pt-1 pb-8">
                    {/* LIVE 1-MINUTE SLEEP COUNTDOWN NOTIFICATION BANNER */}
                    {sleepRemainingSec !== null &&
                        sleepRemainingSec > 0 &&
                        sleepRemainingSec <= 60 && (
                            <div
                                role="alert"
                                className="max-w-3xl mb-4 mac-settings-card animate-collapse-enter px-4 py-3 border border-[#FF9F0A]/45 bg-[#FF9F0A]/15 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-[8px] bg-[#FF9F0A] text-white flex items-center justify-center font-bold text-xs tabular-nums shrink-0 animate-pulse shadow-sm">
                                        {sleepRemainingSec}s
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-bold leading-tight">
                                            {t.sleepCountdownTitle}
                                        </div>
                                        <div className="text-[12px] text-secondary tabular-nums mt-0.5">
                                            {t.sleepCountdownDesc.replace(
                                                '{sec}',
                                                String(sleepRemainingSec)
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void api.setSleepTimer(null)}
                                    className="px-3.5 py-1.5 rounded-[7px] bg-[#FF9F0A] text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm"
                                >
                                    {t.sleepCancelBtn}
                                </button>
                            </div>
                        )}

                    {/* TAB 1: MANAGE STATIONS */}
                    {activeTab === 'stations' && (
                        <div
                            key="tab-stations"
                            className="max-w-3xl space-y-6 animate-tab-enter"
                        >
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
                                            selectedGroup === 'ALL' &&
                                            !favoritesOnly
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
                                        <IconStar
                                            size={11}
                                            filled={favoritesOnly}
                                        />
                                        <span>
                                            {t.favoritesOnly} ({favCount})
                                        </span>
                                    </button>

                                    {groups.map((grp) => {
                                        const active =
                                            selectedGroup === grp &&
                                            !favoritesOnly;
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
                                        onClick={() =>
                                            setIsAddingGroup((v) => !v)
                                        }
                                        className="mac-glass-pill px-2.5 py-1 rounded-[6px] text-[11px] font-medium cursor-pointer"
                                    >
                                        {t.addGroupBtn}
                                    </button>
                                </div>

                                {/* Stream Health Tools (Without "Volume follows macOS system output" text) */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setHideOffline((v) => !v)
                                        }
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
                                        onClick={() =>
                                            void handleRunHealthCheck()
                                        }
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
                                    {stations.some(
                                        (s) => s.status === 'offline'
                                    ) && (
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
                                    <span className="font-medium">
                                        {t.addGroupTitle}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) =>
                                                setNewGroupName(e.target.value)
                                            }
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
                                            {currentHeadingTitle} (
                                            {filteredStations.length})
                                        </h2>
                                        {selectedGroup !== 'ALL' &&
                                            groups.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void api.deleteGroup(
                                                            selectedGroup
                                                        );
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
                                    {stations.length === 0 ? (
                                        <div className="py-14 px-6 text-center flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 rounded-[12px] bg-accent/10 text-accent flex items-center justify-center shadow-sm">
                                                <IconRadioTower size={28} />
                                            </div>
                                            <div className="max-w-md">
                                                <h3 className="text-[15px] font-bold text-foreground">
                                                    {t.emptyStationsTitle}
                                                </h3>
                                                <p className="text-[12px] text-secondary leading-relaxed mt-1">
                                                    {t.emptyStationsDesc}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        openAddStationModal
                                                    }
                                                    className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                                                >
                                                    <IconPlus size={13} />
                                                    <span>{t.addStation}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveTab('discover')
                                                    }
                                                    className="mac-glass-pill hover:bg-white/15 px-4 py-2 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                                                >
                                                    <IconCompass size={13} />
                                                    <span>
                                                        {
                                                            t.emptyStationsDiscoverBtn
                                                        }
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsImportExportOpen(
                                                            true
                                                        )
                                                    }
                                                    className="mac-glass-pill hover:bg-white/15 px-4 py-2 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                                                >
                                                    <IconTransfer size={13} />
                                                    <span>
                                                        {t.importExport}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : filteredStations.length === 0 ? (
                                        <div className="p-10 text-center text-xs text-secondary flex flex-col items-center justify-center gap-2">
                                            <IconSearch
                                                size={22}
                                                className="opacity-40"
                                            />
                                            <span>{t.emptyStationsText}</span>
                                        </div>
                                    ) : (
                                        filteredStations.map((st) => {
                                            const active = isPlayingStation(
                                                st.id
                                            );
                                            return (
                                                <div
                                                    key={st.id}
                                                    draggable
                                                    onDragStart={() =>
                                                        setDraggedStationId(
                                                            st.id
                                                        )
                                                    }
                                                    onDragOver={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    onDrop={() =>
                                                        void handleDropStation(
                                                            st.id
                                                        )
                                                    }
                                                    onClick={() =>
                                                        void api.playStation(
                                                            st.id
                                                        )
                                                    }
                                                    className="group px-4 py-3 flex items-center justify-between gap-4 cursor-pointer mac-row"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                        <StationAvatar
                                                            logoUrl={st.logoUrl}
                                                            size="sm"
                                                            onResolveLogo={(
                                                                url
                                                            ) =>
                                                                api.resolveStationLogo(
                                                                    url
                                                                )
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
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="flex items-center gap-2 shrink-0"
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-label={st.name}
                                                            onClick={() =>
                                                                void api
                                                                    .toggleFavorite(
                                                                        st.id
                                                                    )
                                                                    .then(
                                                                        refreshAll
                                                                    )
                                                            }
                                                            className={`p-1.5 rounded-[6px] cursor-pointer transition ${
                                                                st.isFavorite
                                                                    ? 'text-[#FF9F0A]'
                                                                    : 'text-secondary opacity-50 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <IconStar
                                                                size={14}
                                                                filled={
                                                                    st.isFavorite
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title={
                                                                active
                                                                    ? t.stop
                                                                    : t.play
                                                            }
                                                            aria-label={
                                                                active
                                                                    ? t.stop
                                                                    : t.play
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
                                                                <IconStop
                                                                    size={12}
                                                                />
                                                            ) : (
                                                                <IconPlay
                                                                    size={12}
                                                                />
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditStationModal(
                                                                    st
                                                                )
                                                            }
                                                            title={t.edit}
                                                            aria-label={t.edit}
                                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-current flex items-center justify-center cursor-pointer"
                                                        >
                                                            <IconEdit
                                                                size={13}
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void api
                                                                    .deleteStation(
                                                                        st.id
                                                                    )
                                                                    .then(
                                                                        refreshAll
                                                                    )
                                                            }
                                                            title={t.delete}
                                                            aria-label={
                                                                t.delete
                                                            }
                                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-[#FF453A] flex items-center justify-center cursor-pointer"
                                                        >
                                                            <IconTrash
                                                                size={13}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SHOW SCHEDULES & REMINDERS */}
                    {activeTab === 'schedules' && (
                        <div
                            key="tab-schedules"
                            className="max-w-3xl space-y-5 animate-tab-enter text-xs"
                        >
                            {/* Header Card */}
                            <div className="mac-settings-card">
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-[9px] bg-accent text-white flex items-center justify-center shadow-sm shrink-0">
                                            <IconCalendar size={22} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-[15px] font-bold">
                                                    {t.schedulesTitle}
                                                </h2>
                                                <span className="px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                                                    {schedules.length}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-secondary mt-0.5 leading-relaxed max-w-lg">
                                                {t.schedulesSubtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openAddScheduleModal}
                                        className="bg-accent hover:opacity-90 text-white px-3.5 py-1.5 rounded-[7px] font-medium flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition shrink-0"
                                    >
                                        <IconPlus size={14} />
                                        <span>{t.addScheduleBtn}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Schedules List */}
                            {schedules.length === 0 ? (
                                <div className="mac-settings-card p-10 text-center flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 rounded-[10px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-secondary">
                                        <IconCalendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-semibold">
                                            {t.scheduleEmptyText}
                                        </h3>
                                        <p className="text-[12px] text-secondary mt-1">
                                            {t.schedulesSubtitle}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openAddScheduleModal}
                                        className="mt-2 bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[7px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                                    >
                                        <IconPlus size={14} />
                                        <span>{t.addScheduleBtn}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {schedules.map((sched) => {
                                        const isOnAir =
                                            isScheduleCurrentlyOnAir(sched);
                                        const matchedStation = stations.find(
                                            (s) => s.id === sched.stationId
                                        );
                                        const isStationActive =
                                            currentStation?.id ===
                                                sched.stationId &&
                                            (isPlaying || isBusy);

                                        return (
                                            <div
                                                key={sched.id}
                                                className={`mac-settings-card p-4 transition ${
                                                    isOnAir
                                                        ? 'ring-1 ring-[#34C759]/40'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b mac-divider">
                                                    <div className="flex items-center gap-3">
                                                        <StationAvatar
                                                            logoUrl={
                                                                matchedStation?.logoUrl ||
                                                                null
                                                            }
                                                            size="md"
                                                            accentFallback
                                                            onResolveLogo={(
                                                                url
                                                            ) =>
                                                                api.resolveStationLogo(
                                                                    url
                                                                )
                                                            }
                                                        />
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-[14px] font-bold">
                                                                    {
                                                                        sched.showName
                                                                    }
                                                                </h3>
                                                                {isOnAir && (
                                                                    <span className="px-2 py-0.5 rounded-[5px] bg-[#34C759]/20 text-[#34C759] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                                                                        {
                                                                            t.scheduleOnAirNow
                                                                        }
                                                                    </span>
                                                                )}
                                                                {sched.autoPlay && (
                                                                    <span className="px-1.5 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[10px] font-semibold">
                                                                        Autoplay
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[12px] text-secondary mt-0.5 flex flex-wrap items-center gap-2">
                                                                <span className="font-medium text-foreground">
                                                                    {matchedStation?.name ||
                                                                        sched.stationName}
                                                                </span>
                                                                {sched.host && (
                                                                    <>
                                                                        <span>
                                                                            ·
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                sched.host
                                                                            }
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        {/* Enable/Disable Master Toggle */}
                                                        <div className="flex items-center gap-2 mr-1">
                                                            <MacToggle
                                                                checked={
                                                                    sched.enabled
                                                                }
                                                                onChange={() =>
                                                                    handleToggleSchedule(
                                                                        sched.id
                                                                    )
                                                                }
                                                                label={
                                                                    sched.showName
                                                                }
                                                            />
                                                        </div>

                                                        {/* Play Station Now */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    isStationActive
                                                                ) {
                                                                    void api.stopPlayback();
                                                                } else if (
                                                                    sched.stationId
                                                                ) {
                                                                    void api.playStation(
                                                                        sched.stationId
                                                                    );
                                                                }
                                                            }}
                                                            title={
                                                                isStationActive
                                                                    ? t.stop
                                                                    : t.schedulePlayNow
                                                            }
                                                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                                isStationActive
                                                                    ? 'bg-accent text-white shadow-sm'
                                                                    : 'mac-glass-pill text-secondary hover:text-foreground'
                                                            }`}
                                                        >
                                                            {isStationActive ? (
                                                                <IconPause
                                                                    size={13}
                                                                />
                                                            ) : (
                                                                <IconPlay
                                                                    size={13}
                                                                />
                                                            )}
                                                        </button>

                                                        {/* Edit */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditScheduleModal(
                                                                    sched
                                                                )
                                                            }
                                                            title={t.edit}
                                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-foreground flex items-center justify-center cursor-pointer"
                                                        >
                                                            <IconEdit
                                                                size={13}
                                                            />
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteSchedule(
                                                                    sched.id
                                                                )
                                                            }
                                                            title={t.delete}
                                                            className="w-7 h-7 rounded-[7px] mac-glass-pill text-secondary hover:text-[#FF453A] flex items-center justify-center cursor-pointer"
                                                        >
                                                            <IconTrash
                                                                size={13}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Bottom Row: Days pills, Time range, Reminder info */}
                                                <div className="pt-3 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
                                                    {/* Day pills */}
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {DAY_LABELS.map(
                                                            (day) => {
                                                                const isSelected =
                                                                    sched.daysOfWeek.includes(
                                                                        day.day
                                                                    );
                                                                return (
                                                                    <span
                                                                        key={
                                                                            day.day
                                                                        }
                                                                        className={`px-2 py-0.5 rounded-[5px] font-medium transition ${
                                                                            isSelected
                                                                                ? 'bg-accent text-white font-semibold'
                                                                                : 'bg-black/5 dark:bg-white/5 text-secondary/60'
                                                                        }`}
                                                                    >
                                                                        {lang ===
                                                                        'id'
                                                                            ? day.labelId
                                                                            : day.labelEn}
                                                                    </span>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    {/* Time & Reminder info */}
                                                    <div className="flex items-center gap-3 text-secondary">
                                                        <span className="font-mono font-semibold text-foreground px-2 py-0.5 rounded-[5px] bg-black/5 dark:bg-white/5">
                                                            {sched.startTime} –{' '}
                                                            {sched.endTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <IconBell
                                                                size={12}
                                                                className="text-accent"
                                                            />
                                                            <span>
                                                                {sched.reminderMinutes ===
                                                                0
                                                                    ? t.scheduleReminderAtStart
                                                                    : `${sched.reminderMinutes}m ${
                                                                          lang ===
                                                                          'id'
                                                                              ? 'sebelum'
                                                                              : 'before'
                                                                      }`}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {sched.notes && (
                                                    <div className="mt-2 pt-2 border-t mac-divider text-[11px] text-secondary italic">
                                                        “{sched.notes}”
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: DISCOVER ONLINE STATIONS (Country Dropdown with Flags + Inline Search Row with Spinner) */}
                    {activeTab === 'discover' && (
                        <div
                            key="tab-discover"
                            className="max-w-3xl space-y-6 animate-tab-enter"
                        >
                            <form
                                onSubmit={handleDiscoverSearch}
                                className="mac-settings-card"
                            >
                                <div className="p-4 flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-[8px] bg-[#32ADE6] text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                                        <IconCompass size={19} />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-bold">
                                            {t.discoverTitle}
                                        </div>
                                        <p className="text-[12px] text-secondary leading-relaxed mt-0.5">
                                            {t.discoverSubtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="mx-4 border-t mac-divider" />

                                {/* Inline Filter & Search Row: Country Dropdown (Global first + All Countries with Flag), Name, Tag, and Search Button */}
                                <div className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                                    <select
                                        value={discCountry}
                                        aria-label="Country Filter"
                                        onChange={(e) =>
                                            setDiscCountry(e.target.value)
                                        }
                                        className="mac-input px-2.5 h-8 rounded-[7px] text-xs w-52 shrink-0 cursor-pointer"
                                    >
                                        <option value="">
                                            🌐 {t.discoverGlobalFilter}
                                        </option>
                                        {discCountries.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag || '🌐'} {c.name} (
                                                {c.stationCount})
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        value={discName}
                                        onChange={(e) =>
                                            setDiscName(e.target.value)
                                        }
                                        placeholder={t.discoverName}
                                        aria-label={t.discoverName}
                                        className="mac-input px-3 h-8 text-xs rounded-[7px] flex-1 min-w-[140px]"
                                    />

                                    <input
                                        type="text"
                                        value={discTag}
                                        onChange={(e) =>
                                            setDiscTag(e.target.value)
                                        }
                                        placeholder={t.discoverTag}
                                        aria-label={t.discoverTag}
                                        className="mac-input px-3 h-8 text-xs rounded-[7px] w-32 shrink-0"
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSearchingOnline}
                                        className="bg-accent hover:opacity-90 disabled:opacity-60 text-white px-3.5 h-8 rounded-[7px] text-xs font-medium shadow-sm cursor-pointer transition shrink-0 flex items-center gap-1.5"
                                    >
                                        {isSearchingOnline ? (
                                            <IconSpinner
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <IconSearch size={14} />
                                        )}
                                        <span>
                                            {isSearchingOnline
                                                ? t.discoverLoadingBtn
                                                : t.discoverSearchBtn}
                                        </span>
                                    </button>
                                </div>
                            </form>

                            {discError && (
                                <div className="mac-settings-card p-3.5 text-[#FF453A] text-xs">
                                    {discError}
                                </div>
                            )}

                            <div>
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.discoverAvailableHeader} (
                                    {discResults.length})
                                </h2>
                                <div className="mac-settings-card mac-inset-list overflow-hidden">
                                    {discResults.map((item) => {
                                        const alreadyAdded = stations.some(
                                            (s) =>
                                                s.streamUrl.toLowerCase() ===
                                                item.streamUrl.toLowerCase()
                                        );
                                        const isItemPlaying =
                                            (currentStation?.streamUrl ===
                                                item.streamUrl ||
                                                currentStation?.id ===
                                                    item.id) &&
                                            (isPlaying || isBusy);
                                        return (
                                            <div
                                                key={item.id}
                                                className="mac-row flex items-center justify-between px-4 py-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                    <StationAvatar
                                                        logoUrl={item.logoUrl}
                                                        size="sm"
                                                        onResolveLogo={(url) =>
                                                            api.resolveStationLogo(
                                                                url
                                                            )
                                                        }
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-[13px] truncate">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-secondary text-[12px] truncate tabular-nums mt-0.5">
                                                            {countryCodeToFlag(
                                                                item.country
                                                            )}{' '}
                                                            {item.city},{' '}
                                                            {item.country}
                                                            {item.bitrate
                                                                ? ` · ${item.bitrate} kbps`
                                                                : ''}
                                                            {item.tags.length >
                                                            0
                                                                ? ` · ${item.tags.slice(0, 3).join(', ')}`
                                                                : ''}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                                    <button
                                                        type="button"
                                                        title={
                                                            isItemPlaying
                                                                ? t.stop
                                                                : t.discoverPreviewBtn
                                                        }
                                                        aria-label={
                                                            isItemPlaying
                                                                ? t.stop
                                                                : t.discoverPreviewBtn
                                                        }
                                                        onClick={() => {
                                                            if (isItemPlaying) {
                                                                void api.stopPlayback();
                                                            } else {
                                                                void (
                                                                    api as any
                                                                ).playStation({
                                                                    id:
                                                                        item.id ||
                                                                        `preview-${Date.now()}`,
                                                                    name: item.name,
                                                                    streamUrl:
                                                                        item.streamUrl,
                                                                    streamType:
                                                                        item.streamType,
                                                                    logoUrl:
                                                                        item.logoUrl,
                                                                    genre: item.genre,
                                                                    city: item.city,
                                                                    country:
                                                                        item.country,
                                                                    tags: item.tags,
                                                                    group: 'Discover'
                                                                });
                                                            }
                                                        }}
                                                        className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                            isItemPlaying
                                                                ? 'bg-[#30D158] text-white shadow-sm'
                                                                : 'mac-glass-pill hover:bg-white/15'
                                                        }`}
                                                    >
                                                        {isItemPlaying ? (
                                                            <IconStop
                                                                size={12}
                                                            />
                                                        ) : (
                                                            <IconPlay
                                                                size={12}
                                                            />
                                                        )}
                                                    </button>
                                                    {alreadyAdded ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            title={
                                                                t.discoverAdded
                                                            }
                                                            aria-label={
                                                                t.discoverAdded
                                                            }
                                                            className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-[#30D158]/20 text-[#30D158] opacity-80 cursor-default"
                                                        >
                                                            <IconCheck
                                                                size={13}
                                                            />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            title={
                                                                t.discoverAddBtn
                                                            }
                                                            aria-label={
                                                                t.discoverAddBtn
                                                            }
                                                            onClick={() =>
                                                                void handleAddFromDiscover(
                                                                    item,
                                                                    false
                                                                )
                                                            }
                                                            className="bg-accent hover:opacity-90 text-white w-7 h-7 rounded-[7px] flex items-center justify-center shadow-sm cursor-pointer transition"
                                                        >
                                                            <IconPlus
                                                                size={13}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: LISTENING STATS & ACTIVITY GRAPH (Mingguan, Bulanan, Tahunan) */}
                    {activeTab === 'stats' && statsSummary && (
                        <div
                            key="tab-stats"
                            className="max-w-3xl space-y-6 text-xs animate-tab-enter"
                        >
                            {/* Top Hero Summary Card */}
                            <div className="mac-settings-card">
                                <div className="p-4 flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-9 h-9 rounded-[8px] bg-[#30D158] text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                                            <IconChart size={19} />
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-bold">
                                                {t.statsTitle}
                                            </div>
                                            <p className="text-[12px] text-secondary leading-relaxed mt-0.5">
                                                {t.statsSubtitle}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mx-4 border-t mac-divider" />

                                {/* 3 KPI Summary Metrics: Minggu Ini, Bulan Ini, Tahun Ini */}
                                <div className="grid grid-cols-3 divide-x mac-divider px-2 py-3">
                                    <div className="px-3">
                                        <div className="text-[11px] text-secondary">
                                            {t.statsWeekLabel}
                                        </div>
                                        <div className="text-[18px] font-bold tabular-nums mt-0.5 text-accent">
                                            {formatDurationCompact(
                                                statsSummary.thisWeekSeconds,
                                                lang
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-3">
                                        <div className="text-[11px] text-secondary">
                                            {t.statsMonthLabel}
                                        </div>
                                        <div className="text-[18px] font-bold tabular-nums mt-0.5">
                                            {formatDurationCompact(
                                                statsSummary.thisMonthSeconds,
                                                lang
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-3">
                                        <div className="text-[11px] text-secondary">
                                            {t.statsYearLabel}
                                        </div>
                                        <div className="text-[18px] font-bold tabular-nums mt-0.5">
                                            {formatDurationCompact(
                                                statsSummary.thisYearSeconds,
                                                lang
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Bar Graph Card (Mingguan / Bulanan / Tahunan) */}
                            <div>
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h2 className="text-[13px] font-bold">
                                        {t.statsChartTitle}
                                    </h2>
                                    <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill">
                                        {(
                                            [
                                                ['weekly', t.statsWeeklyView],
                                                ['monthly', t.statsMonthlyView],
                                                ['yearly', t.statsYearlyView]
                                            ] as Array<
                                                [StatsPeriodMode, string]
                                            >
                                        ).map(([mode, label]) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() =>
                                                    setStatsViewMode(mode)
                                                }
                                                className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                                    statsViewMode === mode
                                                        ? 'bg-accent text-white'
                                                        : 'text-secondary'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mac-settings-card p-5">
                                    <div className="h-44 flex items-end justify-between gap-1.5 pt-6 pb-2 border-b mac-divider">
                                        {activeChartPoints.map((pt) => {
                                            const ratio =
                                                pt.seconds > 0
                                                    ? Math.max(
                                                          0.08,
                                                          pt.seconds /
                                                              maxChartSeconds
                                                      )
                                                    : 0.03;
                                            const heightPct = Math.round(
                                                ratio * 100
                                            );
                                            return (
                                                <div
                                                    key={pt.key}
                                                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 px-2 py-0.5 rounded bg-black/85 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none z-10 shadow">
                                                        {pt.label}:{' '}
                                                        {formatDurationCompact(
                                                            pt.seconds,
                                                            lang
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`w-full max-w-[28px] rounded-t-[4px] transition-all duration-300 ${
                                                            pt.seconds > 0
                                                                ? 'bg-accent opacity-85 group-hover:opacity-100'
                                                                : 'bg-white/10'
                                                        }`}
                                                        style={{
                                                            height: `${heightPct}%`
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* X-Axis Labels */}
                                    <div className="flex items-center justify-between gap-1 pt-2.5">
                                        {activeChartPoints.map((pt, idx) => {
                                            const showLabel =
                                                statsViewMode !== 'monthly' ||
                                                idx % 5 === 0 ||
                                                idx ===
                                                    activeChartPoints.length -
                                                        1;
                                            return (
                                                <div
                                                    key={pt.key}
                                                    className="flex-1 text-center text-[10px] text-secondary tabular-nums truncate"
                                                >
                                                    {showLabel ? pt.label : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Top Listened Stations List */}
                            <div>
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.statsTopStationsTitle}
                                </h2>
                                <div className="mac-settings-card mac-inset-list overflow-hidden">
                                    {statsSummary.topStations.length === 0 ? (
                                        <div className="p-8 text-center text-secondary">
                                            {t.statsEmptyText}
                                        </div>
                                    ) : (
                                        statsSummary.topStations.map(
                                            (st, idx) => {
                                                const topMax =
                                                    statsSummary.topStations[0]
                                                        ?.seconds || 1;
                                                const pct = Math.max(
                                                    6,
                                                    Math.round(
                                                        (st.seconds / topMax) *
                                                            100
                                                    )
                                                );
                                                const stationObj =
                                                    stations.find(
                                                        (item) =>
                                                            item.id ===
                                                            st.stationId
                                                    );
                                                const resolvedName =
                                                    stationObj?.name ??
                                                    st.stationId;
                                                const active = isPlayingStation(
                                                    st.stationId
                                                );
                                                return (
                                                    <div
                                                        key={st.stationId}
                                                        className="px-4 py-3 flex items-center justify-between gap-4 mac-row cursor-pointer"
                                                        onClick={() =>
                                                            void api.playStation(
                                                                st.stationId
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                            <span className="w-5 h-5 rounded-[5px] mac-glass-pill text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0">
                                                                {idx + 1}
                                                            </span>

                                                            <StationAvatar
                                                                logoUrl={
                                                                    stationObj?.logoUrl
                                                                }
                                                                size="sm"
                                                                accentFallback
                                                                onResolveLogo={(
                                                                    url
                                                                ) =>
                                                                    api.resolveStationLogo(
                                                                        url
                                                                    )
                                                                }
                                                            />

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-[13px] font-medium truncate">
                                                                            {
                                                                                resolvedName
                                                                            }
                                                                        </span>
                                                                        {stationObj && (
                                                                            <span className="text-[11px] text-secondary truncate">
                                                                                ·{' '}
                                                                                {
                                                                                    stationObj.genre
                                                                                }{' '}
                                                                                ·{' '}
                                                                                {
                                                                                    stationObj.city
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[12px] font-semibold text-secondary tabular-nums shrink-0 ml-2">
                                                                        {formatDurationCompact(
                                                                            st.seconds,
                                                                            lang
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-accent transition-all duration-300"
                                                                        style={{
                                                                            width: `${pct}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="flex items-center gap-1.5 shrink-0 ml-2"
                                                        >
                                                            <button
                                                                type="button"
                                                                title={
                                                                    active
                                                                        ? t.stop
                                                                        : t.play
                                                                }
                                                                aria-label={
                                                                    active
                                                                        ? t.stop
                                                                        : t.play
                                                                }
                                                                onClick={() =>
                                                                    active
                                                                        ? void api.stopPlayback()
                                                                        : void api.playStation(
                                                                              st.stationId
                                                                          )
                                                                }
                                                                className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                                    active
                                                                        ? 'bg-[#30D158] text-white'
                                                                        : 'mac-glass-pill hover:bg-white/15'
                                                                }`}
                                                            >
                                                                {active ? (
                                                                    <IconStop
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <IconPlay
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PREFERENCES */}
                    {activeTab === 'preferences' && settings && (
                        <div
                            key="tab-preferences"
                            className="max-w-3xl space-y-6 text-xs animate-tab-enter"
                        >
                            {/* Group 1: Appearance & Personalization */}
                            <div className="relative z-30">
                                <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                                    <IconSwatch
                                        size={14}
                                        className="text-accent"
                                    />
                                    <span>{t.prefAppearanceSection}</span>
                                </h2>
                                <div className="mac-settings-card mac-inset-list">
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="text-[13px] font-medium">
                                                {t.prefThemeLabel}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <ThemePreviewCard
                                                mode="system"
                                                active={
                                                    (settings.theme ??
                                                        'system') === 'system'
                                                }
                                                label={t.prefThemeSystem}
                                                onSelect={() =>
                                                    void api.updateSettings({
                                                        theme: 'system'
                                                    })
                                                }
                                            />
                                            <ThemePreviewCard
                                                mode="light"
                                                active={
                                                    settings.theme === 'light'
                                                }
                                                label={t.prefThemeLight}
                                                onSelect={() =>
                                                    void api.updateSettings({
                                                        theme: 'light'
                                                    })
                                                }
                                            />
                                            <ThemePreviewCard
                                                mode="dark"
                                                active={
                                                    settings.theme === 'dark'
                                                }
                                                label={t.prefThemeDark}
                                                onSelect={() =>
                                                    void api.updateSettings({
                                                        theme: 'dark'
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Accent Color Swatches */}
                                    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                                        <span className="text-[13px] font-medium">
                                            {t.prefAccentLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {ACCENT_SWATCHES.map((swatch) => {
                                                const selected =
                                                    (
                                                        settings.accentColor ??
                                                        '#0A84FF'
                                                    ).toLowerCase() ===
                                                    swatch.hex.toLowerCase();
                                                return (
                                                    <button
                                                        key={swatch.id}
                                                        type="button"
                                                        title={swatch.label}
                                                        aria-label={
                                                            swatch.label
                                                        }
                                                        onClick={() =>
                                                            void api.updateSettings(
                                                                {
                                                                    accentColor:
                                                                        swatch.hex
                                                                }
                                                            )
                                                        }
                                                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform flex items-center justify-center ${
                                                            selected
                                                                ? 'scale-115 ring-2 ring-white/80'
                                                                : ''
                                                        }`}
                                                        style={{
                                                            backgroundColor:
                                                                swatch.hex
                                                        }}
                                                    >
                                                        {selected && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            <input
                                                type="color"
                                                value={
                                                    settings.accentColor ??
                                                    '#0A84FF'
                                                }
                                                aria-label="Custom Accent Color"
                                                onChange={(e) =>
                                                    void api.updateSettings({
                                                        accentColor:
                                                            e.target.value
                                                    })
                                                }
                                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                            />
                                        </div>
                                    </div>

                                    {/* Glass Opacity Slider */}
                                    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-[13px] font-medium">
                                                {t.prefGlassOpacityLabel}
                                            </div>
                                            <div className="text-[12px] text-secondary mt-0.5">
                                                {t.prefGlassOpacityDesc}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <input
                                                type="range"
                                                min={40}
                                                max={100}
                                                step={5}
                                                value={
                                                    settings.glassOpacity ?? 90
                                                }
                                                aria-label={
                                                    t.prefGlassOpacityLabel
                                                }
                                                onChange={(e) => {
                                                    const val =
                                                        parseInt(
                                                            e.target.value,
                                                            10
                                                        ) || 90;
                                                    void api.updateSettings({
                                                        glassOpacity: val
                                                    });
                                                }}
                                                className="w-28 cursor-pointer"
                                                style={{
                                                    accentColor:
                                                        'var(--accent-color)'
                                                }}
                                            />
                                            <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums">
                                                {[70, 80, 90, 100].map(
                                                    (pct) => (
                                                        <button
                                                            key={pct}
                                                            type="button"
                                                            onClick={() =>
                                                                void api.updateSettings(
                                                                    {
                                                                        glassOpacity:
                                                                            pct
                                                                    }
                                                                )
                                                            }
                                                            className={`px-2 py-0.5 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                                                (settings.glassOpacity ??
                                                                    90) === pct
                                                                    ? 'bg-accent text-white'
                                                                    : 'text-secondary'
                                                            }`}
                                                        >
                                                            {pct}%
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Font Picker */}
                                    <div className="px-4 py-3.5 flex items-center justify-between gap-4 relative z-40">
                                        <div>
                                            <div className="text-[13px] font-medium">
                                                {t.prefFontFamilyLabel}
                                            </div>
                                            <div className="text-[12px] text-secondary mt-0.5">
                                                {t.prefFontFamilyDesc}
                                            </div>
                                        </div>
                                        <SearchableFontPicker
                                            value={
                                                settings.fontFamily ?? 'system'
                                            }
                                            fonts={systemFonts}
                                            defaultLabel={
                                                t.prefFontSystemDefault
                                            }
                                            ariaLabel={t.prefFontFamilyLabel}
                                            onChange={(selectedFont) => {
                                                void api.updateSettings({
                                                    fontFamily: selectedFont
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: General & Language (Dropdown with Flag) */}
                            <div className="relative z-20">
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.prefGeneral}
                                </h2>
                                <div className="mac-settings-card mac-inset-list">
                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefLanguage}
                                        </span>
                                        <select
                                            value={settings.language}
                                            aria-label={t.prefLanguage}
                                            onChange={(e) =>
                                                void api.updateSettings({
                                                    language: e.target
                                                        .value as AppSettings['language']
                                                })
                                            }
                                            className="mac-input px-3 py-1.5 rounded-[7px] text-[12px] w-56 cursor-pointer"
                                        >
                                            {SUPPORTED_LOCALES.map((loc) => (
                                                <option
                                                    key={loc.code}
                                                    value={loc.code}
                                                >
                                                    {loc.flag} {loc.nativeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefConfirmQuit}
                                        </span>
                                        <MacToggle
                                            checked={
                                                settings.confirmBeforeQuit ??
                                                true
                                            }
                                            label={t.prefConfirmQuit}
                                            onChange={(next) =>
                                                void api.updateSettings({
                                                    confirmBeforeQuit: next
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefLaunchAtLogin}
                                        </span>
                                        <MacToggle
                                            checked={settings.launchAtLogin}
                                            label={t.prefLaunchAtLogin}
                                            onChange={(next) =>
                                                void api.updateSettings({
                                                    launchAtLogin: next
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefAutoPlay}
                                        </span>
                                        <MacToggle
                                            checked={
                                                settings.autoPlayLastStation
                                            }
                                            label={t.prefAutoPlay}
                                            onChange={(next) =>
                                                void api.updateSettings({
                                                    autoPlayLastStation: next
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefNotifySong}
                                        </span>
                                        <MacToggle
                                            checked={
                                                settings.notifyOnSongChange
                                            }
                                            label={t.prefNotifySong}
                                            onChange={(next) =>
                                                void api.updateSettings({
                                                    notifyOnSongChange: next
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-[13px] font-medium">
                                                {t.introReopenBtn}
                                            </div>
                                            <div className="text-[12px] text-secondary mt-0.5">
                                                {lang === 'id'
                                                    ? 'Tampilkan kembali panduan langkah awal dan integrasi sistem.'
                                                    : 'Re-open the initial setup guide and system integration.'}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsOnboardingOpen(true)
                                            }
                                            className="mac-glass-pill px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                                        >
                                            <IconCompass size={14} />
                                            <span>{t.introReopenBtn}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Audio & Network */}
                            <div className="relative z-10">
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.prefAudioNet}
                                </h2>
                                <div className="mac-settings-card mac-inset-list">
                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefAutoReconnect}
                                        </span>
                                        <MacToggle
                                            checked={settings.autoReconnect}
                                            label={t.prefAutoReconnect}
                                            onChange={(next) =>
                                                void api.updateSettings({
                                                    autoReconnect: next
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefMaxRetries}
                                        </span>
                                        <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums">
                                            {[5, 8, 15, 25].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() =>
                                                        void api.updateSettings(
                                                            {
                                                                maxReconnectAttempts:
                                                                    val
                                                            }
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                                        settings.maxReconnectAttempts ===
                                                        val
                                                            ? 'bg-accent text-white'
                                                            : 'text-secondary'
                                                    }`}
                                                >
                                                    {val}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <span className="text-[13px] font-medium">
                                            {t.prefTimeout}
                                        </span>
                                        <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums">
                                            {[8000, 12000, 20000].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() =>
                                                        void api.updateSettings(
                                                            {
                                                                networkTimeoutMs:
                                                                    val
                                                            }
                                                        )
                                                    }
                                                    className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                                        settings.networkTimeoutMs ===
                                                        val
                                                            ? 'bg-accent text-white'
                                                            : 'text-secondary'
                                                    }`}
                                                >
                                                    {val / 1000}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Group 4: Global Shortcuts (Direct Key Press Recorder) */}
                            <div>
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h2 className="text-[13px] font-bold">
                                        {t.prefShortcuts}
                                    </h2>
                                    <span className="text-[11px] text-secondary">
                                        {t.prefShortcutRecordHint}
                                    </span>
                                </div>
                                <div className="mac-settings-card mac-inset-list">
                                    {(
                                        [
                                            [
                                                'playPause',
                                                t.prefShortcutPlayPause
                                            ],
                                            ['nextStation', t.prefShortcutNext],
                                            ['prevStation', t.prefShortcutPrev]
                                        ] as Array<
                                            [
                                                keyof AppSettings['shortcuts'],
                                                string
                                            ]
                                        >
                                    ).map(([key, label]) => {
                                        const isRecording =
                                            recordingShortcutKey === key;
                                        return (
                                            <div
                                                key={key}
                                                className="px-4 py-3 flex items-center justify-between gap-4"
                                            >
                                                <span className="text-[13px] font-medium">
                                                    {label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRecordingShortcutKey(
                                                            isRecording
                                                                ? null
                                                                : key
                                                        )
                                                    }
                                                    className={`px-3.5 py-1.5 rounded-[7px] font-mono text-[11px] min-w-[200px] flex items-center justify-center gap-1.5 cursor-pointer transition ${
                                                        isRecording
                                                            ? 'bg-accent text-white ring-2 ring-accent/40 animate-pulse'
                                                            : 'mac-glass-pill'
                                                    }`}
                                                >
                                                    <IconKey size={12} />
                                                    <span>
                                                        {isRecording
                                                            ? t.prefShortcutRecording
                                                            : settings
                                                                  .shortcuts[
                                                                  key
                                                              ]}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Group 5: Backup & Restore Data */}
                            <div>
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.prefBackupSection}
                                </h2>
                                <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[13px] font-medium">
                                            {t.prefBackupTitle}
                                        </div>
                                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                            {t.prefBackupDesc}
                                        </p>
                                        {backupStatusMsg && (
                                            <div className="mt-1.5 text-[11px] text-[#30D158] font-medium">
                                                {backupStatusMsg}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleRestoreData()
                                            }
                                            className="mac-glass-pill px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <IconRestore size={13} />
                                            <span>{t.prefRestoreBtn}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleBackupData()
                                            }
                                            className="bg-accent hover:opacity-90 text-white px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                                        >
                                            <IconBackup size={13} />
                                            <span>{t.prefBackupBtn}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Group 6: Diagnostics & System Logs (Default Info Only, Expandable Report) */}
                            <div>
                                <h2 className="text-[13px] font-bold mb-2 px-1">
                                    {t.prefDiagSection}
                                </h2>
                                <div className="mac-settings-card">
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium">
                                                {t.prefDiagDesc}
                                            </div>
                                            <div className="text-[11px] text-secondary font-mono truncate mt-1">
                                                {t.prefDataDirLabel}: {dataDir}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void api.openLogsFolder()
                                                }
                                                className="mac-glass-pill px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <IconFolder size={13} />
                                                <span>{t.openLogsBtn}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    void navigator.clipboard.writeText(
                                                        diagnosticsText
                                                    );
                                                    setCopiedDiag(true);
                                                    setTimeout(
                                                        () =>
                                                            setCopiedDiag(
                                                                false
                                                            ),
                                                        2000
                                                    );
                                                }}
                                                className="mac-glass-pill px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <IconCopy size={13} />
                                                <span>
                                                    {copiedDiag
                                                        ? t.copiedDiagBtn
                                                        : t.copyDiagBtn}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mx-4 border-t mac-divider" />

                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowDiagReport((v) => !v)
                                            }
                                            className="text-[12px] font-medium text-accent flex items-center gap-1.5 cursor-pointer hover:underline"
                                        >
                                            {showDiagReport ? (
                                                <IconChevronUp size={14} />
                                            ) : (
                                                <IconChevronDown size={14} />
                                            )}
                                            <span>
                                                {showDiagReport
                                                    ? t.prefDiagHideBtn
                                                    : t.prefDiagShowBtn}
                                            </span>
                                        </button>
                                    </div>

                                    {showDiagReport && (
                                        <div className="px-4 pb-4 animate-collapse-enter">
                                            <pre className="p-3.5 rounded-[8px] bg-black/25 border mac-divider text-[11px] font-mono overflow-x-auto tabular-nums max-h-64">
                                                {diagnosticsText}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Group 7: Reset Defaults at Bottom with Red Button & Confirmation */}
                            <div>
                                <h2 className="text-[13px] font-bold mb-2 px-1 text-[#FF453A]">
                                    {t.prefDangerSection}
                                </h2>
                                <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#FF453A]/30">
                                    <div>
                                        <div className="text-[13px] font-medium">
                                            {t.prefResetBtn}
                                        </div>
                                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                            {t.prefResetDesc}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsResetConfirmOpen(true)
                                        }
                                        className="bg-[#FF453A] hover:bg-[#D70015] text-white px-4 py-1.5 rounded-[7px] font-semibold shadow-sm cursor-pointer transition shrink-0"
                                    >
                                        {t.prefResetBtn}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: ABOUT APPLICATION (No Card Wrapper, App Icon, GitHub Link with Icon, Direct Specs Link) */}
                    {activeTab === 'about' && (
                        <div
                            key="tab-about"
                            className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center gap-4 text-xs animate-tab-enter"
                        >
                            <SquircleAppIcon
                                dataUrl={appIconDataUrl}
                                size={92}
                            />
                            <div>
                                <div className="flex items-center justify-center gap-2">
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Squelch
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                                        v0.1.0
                                    </span>
                                </div>
                                <div className="text-[13px] font-medium text-accent mt-0.5">
                                    {t.aboutTagline}
                                </div>
                                <p className="text-[12px] text-secondary leading-relaxed mt-2.5 max-w-md">
                                    {t.aboutDescription}
                                </p>
                            </div>

                            {/* Primary Buttons: GitHub & Website */}
                            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void api.openExternalUrl(
                                            GITHUB_REPO_URL
                                        )
                                    }
                                    className="mac-glass-pill px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 cursor-pointer hover:bg-white/15 transition shadow-sm"
                                >
                                    <IconGitHub size={15} />
                                    <span>GitHub</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void api.openExternalUrl(
                                            AUTHOR_WEBSITE_URL
                                        )
                                    }
                                    className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 shadow-sm cursor-pointer transition"
                                >
                                    <IconGlobe size={15} />
                                    <span>{t.aboutWebsiteBtn}</span>
                                </button>
                            </div>

                            {/* Bottom Links: Spesifikasi & Arsitektur + Changelog */}
                            <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-secondary">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void api.openExternalUrl(SPEC_DOC_URL)
                                    }
                                    className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <span>{t.aboutSpecLink}</span>
                                    <IconExternalLink size={11} />
                                </button>
                                <span>·</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        void api.openExternalUrl(
                                            CHANGELOG_DOC_URL
                                        )
                                    }
                                    className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <span>{t.aboutChangelogLink}</span>
                                    <IconExternalLink size={11} />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ADD / EDIT STATION MODAL (High-Contrast Elevated Modal Surface) */}
            {isFormOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="station-modal-title"
                    onClick={() => setIsFormOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSaveStation}
                        className="mac-modal-surface w-full max-w-lg p-6 space-y-4 text-xs"
                    >
                        <div className="flex items-center justify-between pb-3 border-b mac-divider">
                            <div className="flex items-center gap-3">
                                <StationAvatar
                                    logoUrl={formLogo || null}
                                    size="sm"
                                    accentFallback
                                    onResolveLogo={(url) =>
                                        api.resolveStationLogo(url)
                                    }
                                />
                                <div>
                                    <h3
                                        id="station-modal-title"
                                        className="text-[15px] font-bold"
                                    >
                                        {editingStation
                                            ? t.modalEditTitle
                                            : t.modalAddTitle}
                                    </h3>
                                    {editingStation && (
                                        <div className="text-[11px] text-secondary">
                                            ID: {editingStation.id}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label={t.cancelBtn}
                                onClick={() => setIsFormOpen(false)}
                                className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                            >
                                <IconClose size={14} />
                            </button>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1.5">
                                {t.fieldUrl}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    placeholder="https://... or https://open.noice.id/catalog/..."
                                    className="mac-input flex-1 px-3 py-2 rounded-[7px]"
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleTestStream()}
                                    disabled={isTestingStream}
                                    className="mac-glass-pill px-3.5 py-2 rounded-[7px] font-semibold shrink-0 cursor-pointer"
                                >
                                    {isTestingStream
                                        ? t.testingStream
                                        : t.testStreamBtn}
                                </button>
                            </div>
                            {testResult && (
                                <div
                                    className={`mt-2 p-2.5 rounded-[7px] text-[11px] font-medium tabular-nums ${
                                        testResult.ok
                                            ? 'bg-[#30D158]/15 border border-[#30D158]/40 text-[#30D158]'
                                            : 'bg-[#FF453A]/15 border border-[#FF453A]/40 text-[#FF453A]'
                                    }`}
                                >
                                    {testResult.ok
                                        ? `${t.testOkPrefix}: ${testResult.streamType.toUpperCase()} (${testResult.contentType}, ${testResult.latencyMs} ms)`
                                        : `${t.testFailPrefix}: ${testResult.errorReason}`}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.fieldName}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) =>
                                        setFormName(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.fieldGroup}
                                </label>
                                <input
                                    type="text"
                                    list="group-options"
                                    value={formGroup}
                                    onChange={(e) =>
                                        setFormGroup(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                                <datalist id="group-options">
                                    {groups.map((g) => (
                                        <option key={g} value={g} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.fieldGenre}
                                </label>
                                <input
                                    type="text"
                                    value={formGenre}
                                    onChange={(e) =>
                                        setFormGenre(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.fieldCity}
                                </label>
                                <input
                                    type="text"
                                    value={formCity}
                                    onChange={(e) =>
                                        setFormCity(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.colType}
                                </label>
                                <select
                                    value={formType}
                                    onChange={(e) =>
                                        setFormType(
                                            e.target.value as StreamType
                                        )
                                    }
                                    className="mac-input w-full px-2.5 py-2 rounded-[7px] uppercase"
                                >
                                    <option value="mp3">MP3</option>
                                    <option value="aac">AAC / AAC+</option>
                                    <option value="ogg">OGG / Opus</option>
                                    <option value="hls">HLS (.m3u8)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1.5">
                                {t.fieldLogo}
                            </label>
                            <input
                                type="text"
                                value={formLogo}
                                onChange={(e) => setFormLogo(e.target.value)}
                                placeholder="https://.../favicon.ico or .png"
                                className="mac-input w-full px-3 py-2 rounded-[7px]"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold mb-1.5">
                                {t.fieldTags}
                            </label>
                            <input
                                type="text"
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                placeholder="pop, news, jakarta"
                                className="mac-input w-full px-3 py-2 rounded-[7px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t mac-divider">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                            >
                                {t.cancelBtn}
                            </button>
                            <button
                                type="submit"
                                className="bg-accent hover:opacity-90 text-white px-5 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                            >
                                {t.saveBtn}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* IMPORT / EXPORT MODAL (High-Contrast Elevated Modal Surface) */}
            {isImportExportOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ie-modal-title"
                    onClick={() => setIsImportExportOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mac-modal-surface w-full max-w-xl p-6 space-y-4 text-xs"
                    >
                        <div className="flex items-center justify-between pb-3 border-b mac-divider">
                            <h3
                                id="ie-modal-title"
                                className="text-[15px] font-bold"
                            >
                                {t.importExport}
                            </h3>
                            <button
                                type="button"
                                aria-label={t.cancelBtn}
                                onClick={() => setIsImportExportOpen(false)}
                                className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                            >
                                <IconClose size={14} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1.5">
                                {(['json', 'm3u', 'pls'] as const).map(
                                    (fmt) => (
                                        <button
                                            key={fmt}
                                            type="button"
                                            onClick={() =>
                                                void handleExportLoad(fmt)
                                            }
                                            className={`px-3 py-1.5 rounded-[6px] uppercase font-mono text-[11px] font-semibold cursor-pointer transition ${
                                                ieFormat === fmt
                                                    ? 'bg-accent text-white'
                                                    : 'mac-glass-pill'
                                            }`}
                                        >
                                            {fmt}
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-secondary font-medium">
                                    {t.duplicateStrategyLabel}
                                </span>
                                <select
                                    value={ieDuplicateStrategy}
                                    onChange={(e) =>
                                        setIeDuplicateStrategy(
                                            e.target.value as
                                                | 'skip'
                                                | 'overwrite'
                                                | 'duplicate'
                                        )
                                    }
                                    className="mac-input px-2.5 py-1.5 rounded-[6px]"
                                >
                                    <option value="skip">{t.dupSkip}</option>
                                    <option value="overwrite">
                                        {t.dupOverwrite}
                                    </option>
                                    <option value="duplicate">
                                        {t.dupDuplicate}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <textarea
                            value={ieTextContent}
                            onChange={(e) => setIeTextContent(e.target.value)}
                            rows={10}
                            className="mac-input w-full p-3 rounded-[7px] font-mono text-[11px]"
                        />

                        {ieStatusMessage && (
                            <div className="text-[11px] text-accent font-medium tabular-nums">
                                {ieStatusMessage}
                            </div>
                        )}

                        <div className="flex justify-between pt-3 border-t mac-divider">
                            <button
                                type="button"
                                onClick={() => {
                                    void navigator.clipboard.writeText(
                                        ieTextContent
                                    );
                                    setIeStatusMessage(t.copiedExportMsg);
                                }}
                                className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                                <IconCopy size={13} />
                                <span>{t.copyExportBtn}</span>
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsImportExportOpen(false)}
                                    className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                                >
                                    {t.cancelBtn}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleImportExecute()}
                                    className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                                >
                                    {t.importBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET SETTINGS CONFIRMATION MODAL */}
            {isResetConfirmOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-modal-title"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mac-modal-surface w-full max-w-md p-6 space-y-4 text-xs"
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-[9px] bg-[#FF453A]/20 text-[#FF453A] flex items-center justify-center shrink-0">
                                <IconWarning size={20} />
                            </div>
                            <div>
                                <h3
                                    id="reset-modal-title"
                                    className="text-[15px] font-bold"
                                >
                                    {t.prefResetConfirmTitle}
                                </h3>
                                <p className="text-[12px] text-secondary leading-relaxed mt-1">
                                    {t.prefResetConfirmDesc}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t mac-divider">
                            <button
                                type="button"
                                onClick={() => setIsResetConfirmOpen(false)}
                                className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                            >
                                {t.cancelBtn}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetConfirmOpen(false);
                                    void api.resetSettings();
                                }}
                                className="bg-[#FF453A] hover:bg-[#D70015] text-white px-4 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                            >
                                {t.prefResetConfirmYes}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUIT CONFIRMATION MODAL */}
            {isQuitConfirmOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="quit-modal-title"
                    onClick={() => setIsQuitConfirmOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mac-modal-surface w-full max-w-[340px] p-6 space-y-4 text-xs flex flex-col items-center text-center shadow-2xl"
                    >
                        <SquircleAppIcon dataUrl={appIconDataUrl} size={54} />
                        <div>
                            <h3
                                id="quit-modal-title"
                                className="text-[15px] font-bold text-foreground"
                            >
                                {settings?.language === 'en'
                                    ? 'Quit Squelch?'
                                    : 'Keluar dari Squelch?'}
                            </h3>
                            <p className="text-[12px] text-secondary leading-normal mt-1.5 max-w-[260px] mx-auto">
                                {settings?.language === 'en'
                                    ? 'Active radio playback in the menu bar will be stopped.'
                                    : 'Pemutaran siaran radio di menu bar akan dihentikan.'}
                            </p>
                        </div>

                        <div className="w-full flex items-center justify-center gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsQuitConfirmOpen(false)}
                                className="mac-glass-pill flex-1 py-1.5 px-3 rounded-[7px] text-[12px] font-medium cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                {t.cancelBtn}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsQuitConfirmOpen(false);
                                    void api.quitApp();
                                }}
                                className="flex-1 bg-[#FF453A] hover:bg-[#D70015] text-white py-1.5 px-3 rounded-[7px] text-[12px] font-medium shadow-sm cursor-pointer transition"
                            >
                                {settings?.language === 'en'
                                    ? 'Quit'
                                    : 'Keluar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ABOUT SQUELCH MODAL */}
            {isAboutModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="about-modal-title"
                    onClick={() => setIsAboutModalOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="mac-modal-surface w-full max-w-[360px] p-6 space-y-4 text-xs relative flex flex-col items-center text-center shadow-2xl"
                    >
                        <SquircleAppIcon dataUrl={appIconDataUrl} size={76} />
                        <div>
                            <div className="flex items-center justify-center gap-2">
                                <h2
                                    id="about-modal-title"
                                    className="text-[18px] font-bold tracking-tight text-foreground"
                                >
                                    Squelch
                                </h2>
                                <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                                    v0.1.0
                                </span>
                            </div>
                            <div className="text-[12px] font-medium text-accent mt-0.5">
                                {t.aboutTagline}
                            </div>
                            <p className="text-[12px] text-secondary leading-relaxed mt-2 max-w-[280px] mx-auto">
                                {t.aboutDescription}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    void api.openExternalUrl(GITHUB_REPO_URL)
                                }
                                className="mac-glass-pill px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-xs"
                            >
                                <IconGitHub size={14} />
                                <span>GitHub</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void api.openExternalUrl(AUTHOR_WEBSITE_URL)
                                }
                                className="bg-accent hover:opacity-90 text-white px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                            >
                                <IconGlobe size={14} />
                                <span>{t.aboutWebsiteBtn}</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-[11px] text-secondary">
                            <button
                                type="button"
                                onClick={() =>
                                    void api.openExternalUrl(SPEC_DOC_URL)
                                }
                                className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <span>{t.aboutSpecLink}</span>
                                <IconExternalLink size={10} />
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() =>
                                    void api.openExternalUrl(CHANGELOG_DOC_URL)
                                }
                                className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                            >
                                <span>{t.aboutChangelogLink}</span>
                                <IconExternalLink size={10} />
                            </button>
                        </div>

                        <div className="w-full pt-2 border-t mac-divider mt-1">
                            <button
                                type="button"
                                onClick={() => setIsAboutModalOpen(false)}
                                className="mac-glass-pill w-full py-1.5 rounded-[7px] text-[12px] font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                            >
                                {settings?.language === 'en'
                                    ? 'Close'
                                    : 'Tutup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ONBOARDING INTRO WIZARD */}
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

            {/* ADD / EDIT SCHEDULE MODAL */}
            {isScheduleModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="schedule-modal-title"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
                >
                    <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSaveSchedule}
                        className="mac-modal-surface w-full max-w-lg p-6 space-y-4 text-xs"
                    >
                        <div className="flex items-center justify-between pb-3 border-b mac-divider">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-[8px] bg-accent text-white flex items-center justify-center shrink-0">
                                    <IconCalendar size={18} />
                                </div>
                                <h3
                                    id="schedule-modal-title"
                                    className="text-[15px] font-bold"
                                >
                                    {editingSchedule
                                        ? t.modalEditScheduleTitle
                                        : t.modalAddScheduleTitle}
                                </h3>
                            </div>
                            <button
                                type="button"
                                aria-label={t.cancelBtn}
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                            >
                                <IconClose size={14} />
                            </button>
                        </div>

                        {/* Station Selector */}
                        <div>
                            <label className="block font-semibold mb-1.5">
                                {t.scheduleStation}
                            </label>
                            <select
                                value={schedStationId}
                                onChange={(e) =>
                                    setSchedStationId(e.target.value)
                                }
                                className="mac-input w-full px-3 py-2 rounded-[7px]"
                            >
                                {stations.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name} ({st.city || st.genre})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Show Name and Host */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.scheduleShowName}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sarapan Seru"
                                    value={schedShowName}
                                    onChange={(e) =>
                                        setSchedShowName(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.scheduleHost}
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Surya Insomnia & Molan"
                                    value={schedHost}
                                    onChange={(e) =>
                                        setSchedHost(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px]"
                                />
                            </div>
                        </div>

                        {/* Days of Week Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold">
                                    {t.scheduleDays}
                                </label>
                                <div className="flex gap-2 text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSchedDays([1, 2, 3, 4, 5])
                                        }
                                        className="text-accent hover:underline cursor-pointer"
                                    >
                                        {t.scheduleDaysWeekdays}
                                    </button>
                                    <span className="text-secondary">·</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSchedDays([0, 1, 2, 3, 4, 5, 6])
                                        }
                                        className="text-accent hover:underline cursor-pointer"
                                    >
                                        {t.scheduleDaysAll}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {DAY_LABELS.map((day) => {
                                    const isChecked = schedDays.includes(
                                        day.day
                                    );
                                    return (
                                        <button
                                            key={day.day}
                                            type="button"
                                            onClick={() => {
                                                if (isChecked) {
                                                    if (schedDays.length > 1) {
                                                        setSchedDays(
                                                            schedDays.filter(
                                                                (d) =>
                                                                    d !==
                                                                    day.day
                                                            )
                                                        );
                                                    }
                                                } else {
                                                    setSchedDays(
                                                        [
                                                            ...schedDays,
                                                            day.day
                                                        ].sort()
                                                    );
                                                }
                                            }}
                                            className={`py-2 rounded-[7px] text-[11px] font-semibold text-center transition cursor-pointer ${
                                                isChecked
                                                    ? 'bg-accent text-white shadow-sm'
                                                    : 'mac-glass-pill text-secondary'
                                            }`}
                                        >
                                            {lang === 'id'
                                                ? day.labelId
                                                : day.labelEn}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Window */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.scheduleStartTime}
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={schedStartTime}
                                    onChange={(e) =>
                                        setSchedStartTime(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px] font-mono text-[13px]"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1.5">
                                    {t.scheduleEndTime}
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={schedEndTime}
                                    onChange={(e) =>
                                        setSchedEndTime(e.target.value)
                                    }
                                    className="mac-input w-full px-3 py-2 rounded-[7px] font-mono text-[13px]"
                                />
                            </div>
                        </div>

                        {/* Autoplay & Reminder Setting */}
                        <div className="p-3 rounded-[8px] bg-black/5 dark:bg-white/5 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-semibold text-[13px]">
                                        {t.scheduleAutoPlay}
                                    </div>
                                    <div className="text-[11px] text-secondary mt-0.5">
                                        {t.scheduleAutoPlayDesc}
                                    </div>
                                </div>
                                <MacToggle
                                    checked={schedAutoPlay}
                                    onChange={setSchedAutoPlay}
                                    label={t.scheduleAutoPlay}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-2 border-t mac-divider">
                                <span className="font-semibold text-[12px]">
                                    {t.scheduleReminder}
                                </span>
                                <select
                                    value={schedReminderMinutes}
                                    onChange={(e) =>
                                        setSchedReminderMinutes(
                                            parseInt(e.target.value, 10)
                                        )
                                    }
                                    className="mac-input px-2.5 py-1 rounded-[6px]"
                                >
                                    <option value={0}>
                                        {t.scheduleReminderAtStart}
                                    </option>
                                    <option value={5}>
                                        {t.scheduleReminder5m}
                                    </option>
                                    <option value={10}>
                                        {t.scheduleReminder10m}
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block font-semibold mb-1.5">
                                {t.scheduleNotes}
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Program pagi favorit dengan info lalu lintas & kuis"
                                value={schedNotes}
                                onChange={(e) => setSchedNotes(e.target.value)}
                                className="mac-input w-full px-3 py-2 rounded-[7px]"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-2 pt-3 border-t mac-divider">
                            <button
                                type="button"
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                            >
                                {t.cancelBtn}
                            </button>
                            <button
                                type="submit"
                                className="bg-accent hover:opacity-90 text-white px-5 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                            >
                                {t.saveBtn}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
