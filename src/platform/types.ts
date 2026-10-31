import { NowPlayingMetadata } from '../core/events/event-bus';
import { PlayerState } from '../core/player/player-state-machine';
import { Station } from '../core/stations/station.model';

export interface TrayIconBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TrayMenuCallbacks {
    onTrayClick: (bounds: TrayIconBounds) => void;
    onTogglePlayPause: () => void;
    onStop: () => void;
    onSelectStation: (stationId: string) => void;
    onSetSleepTimer: (minutes: number | null) => void;
    onOpenManageStations: () => void;
    onOpenPreferences: () => void;
    onOpenAbout: () => void;
    onQuit: () => void;
}

export interface TrayRenderState {
    playerState: PlayerState;
    currentStation: Station | null;
    metadata: NowPlayingMetadata | null;
    stations: Station[];
    groups: string[];
    sleepTimerMinutes: number | null;
    sleepTimerRemainingSec: number | null;
    showTitleInMenuBar: boolean;
    language: 'id' | 'en';
    errorMessage?: string;
}

export interface ITrayAdapter {
    initialize(callbacks: TrayMenuCallbacks): void;
    update(state: TrayRenderState): void;
    getBounds?(): TrayIconBounds | null;
    destroy(): void;
}

export interface IAudioBridgeAdapter {
    playSource(params: {
        url: string;
        isHls: boolean;
        stationName: string;
        streamTitle: string | null;
        logoUrl: string | null;
    }): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
    updateMediaSessionMetadata(meta: {
        stationName: string;
        streamTitle: string | null;
        logoUrl: string | null;
    }): Promise<void>;
}

export interface ISystemIntegrationAdapter {
    getAppDataPath(): string;
    setDockVisible(visible: boolean): void;
    setLaunchAtLogin(enabled: boolean): void;
    getLaunchAtLogin(): boolean;
    showNotification(title: string, body: string): void;
    registerGlobalShortcuts(
        shortcuts: {
            playPause?: string;
            nextStation?: string;
            prevStation?: string;
        },
        handlers: {
            onPlayPause: () => void;
            onNextStation: () => void;
            onPrevStation: () => void;
        }
    ): void;
    unregisterAllShortcuts(): void;
}
