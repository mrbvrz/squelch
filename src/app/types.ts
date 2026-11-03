import type {
    Station,
    StationsDataSchema,
    AppSettings,
    AudioOutputDevice,
    StreamTestResult,
    DiscoverStationItem,
    RadioBrowserCountry,
    PlayerStatus,
    ListeningStatsSummary,
    ShowSchedule,
    NewShowScheduleInput
} from '../types';
import type { UpdateCheckResult, UpdateDownloadProgress } from '../components/UpdateModal';

export type ActiveTab =
    'stations' | 'schedules' | 'discover' | 'stats' | 'preferences' | 'about';

export type StatsPeriodMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface DayLabelItem {
    day: number;
    labelId: string;
    labelEn: string;
}

export const DAY_LABELS: DayLabelItem[] = [
    { day: 1, labelId: 'Sen', labelEn: 'Mon' },
    { day: 2, labelId: 'Sel', labelEn: 'Tue' },
    { day: 3, labelId: 'Rab', labelEn: 'Wed' },
    { day: 4, labelId: 'Kam', labelEn: 'Thu' },
    { day: 5, labelId: 'Jum', labelEn: 'Fri' },
    { day: 6, labelId: 'Sab', labelEn: 'Sat' },
    { day: 0, labelId: 'Min', labelEn: 'Sun' }
];

export const GITHUB_REPO_URL = 'https://github.com/mrbvrz/squelch';
export const AUTHOR_WEBSITE_URL = 'https://mrbvrz.web.id';
export const SPEC_DOC_URL =
    'https://github.com/mrbvrz/squelch/blob/main/ARCHITECTURE.md';
export const CHANGELOG_DOC_URL =
    'https://github.com/mrbvrz/squelch/blob/main/CHANGELOG.md';

export interface SquelchWindowApi {
    getPlayerStatus: () => Promise<PlayerStatus>;
    playStation: (stationId: string | Partial<Station>) => Promise<boolean>;
    togglePlayPause: () => Promise<boolean>;
    stopPlayback: () => Promise<boolean>;
    nextStation: () => Promise<boolean>;
    prevStation: () => Promise<boolean>;
    toggleMute: () => Promise<boolean>;
    changeVolume: (delta: number) => Promise<number>;
    setVolume: (vol: number) => Promise<number>;
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
    runHealthCheck: (onProgress?: (progress: {
        total: number;
        completed: number;
        currentStation?: string;
        onlineCount: number;
        offlineCount: number;
    }) => void) => Promise<{
        results: Array<{
            stationId: string;
            name: string;
            online: boolean;
            latencyMs: number;
            bitrate?: string;
            error?: string;
        }>;
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
    getAudioOutputDevices: () => Promise<AudioOutputDevice[]>;
    setAudioOutputDevice: (deviceId: string, deviceName?: string) => Promise<boolean>;
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
    checkForUpdates: () => Promise<UpdateCheckResult>;
    startDownloadUpdate?: (url: string, filename?: string) => Promise<void>;
    cancelDownloadUpdate?: () => Promise<void>;
    openUpdateInstaller?: (filePath: string) => Promise<void>;
    revealUpdateInFinder?: (filePath: string) => Promise<void>;
    onUpdateDownloadProgress?: (cb: (progress: UpdateDownloadProgress) => void) => () => void;
    openUpdateModal?: () => Promise<void>;
    clearStationsData: () => Promise<void>;
    clearSchedulesData: () => Promise<void>;
    clearListeningStats: () => Promise<void>;
    resetAllData: () => Promise<AppSettings | undefined>;
    sendNotification: (title: string, body: string) => Promise<boolean>;
    requestQuitConfirm?: () => Promise<void>;
    onStateChanged: (cb: (data: unknown) => void) => () => void;
}
