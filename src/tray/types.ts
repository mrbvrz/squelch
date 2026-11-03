import type {
    AppSettings,
    PlayerStatus,
    Station,
    StationsDataSchema
} from '../types';

export interface SquelchTrayPopoverApi {
    getPlayerStatus: () => Promise<PlayerStatus>;
    playStation: (stationId: string) => Promise<boolean>;
    togglePlayPause: () => Promise<boolean>;
    stopPlayback: () => Promise<boolean>;
    setVolume?: (vol: number) => Promise<number>;
    toggleMute?: () => Promise<boolean>;
    setSleepTimer: (minutes: number | null) => Promise<boolean>;
    openWindowTab: (
        tab:
            | 'stations'
            | 'discover'
            | 'stats'
            | 'preferences'
            | 'about'
            | 'updates'
    ) => Promise<boolean>;
    quitApp: () => Promise<boolean>;
    requestQuitConfirm: () => Promise<void>;
    promptQuit?: () => Promise<boolean>;
    openAboutWindow?: () => Promise<boolean>;
    hideDialogWindow?: () => Promise<boolean>;
    getStationsData: () => Promise<StationsDataSchema>;
    resolveStationLogo: (logoUrl: string) => Promise<string | null>;
    getSettings: () => Promise<{
        settings: AppSettings;
        dataDir: string;
    }>;
    toggleFavorite: (stationId: string) => Promise<Station | undefined>;
    sendNotification: (title: string, body: string) => Promise<boolean>;
    onStateChanged: (cb: (data: unknown) => void) => () => void;
    openExternalUrl?: (url: string) => Promise<boolean>;
    getAppIconDataUrl?: () => Promise<string | null>;
}
