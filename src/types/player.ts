import { Station, StreamType } from './station';

export type PlayerState =
    | 'idle'
    | 'connecting'
    | 'buffering'
    | 'playing'
    | 'paused'
    | 'error'
    | 'reconnecting';

export type PlayerAction =
    | { type: 'PLAY' }
    | { type: 'CONNECTED' }
    | { type: 'PLAYING' }
    | { type: 'BUFFER_UNDERRUN' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'STOP' }
    | { type: 'RECONNECT'; attempt: number }
    | { type: 'ERROR'; message: string };

export interface StreamTestResult {
    ok: boolean;
    resolvedUrl: string;
    streamType: StreamType;
    contentType: string;
    icyName?: string;
    bitrate?: string;
    latencyMs: number;
    errorReason?: string;
    noiceCatalogInfo?: {
        title?: string;
        logoUrl?: string;
    };
}

export interface PlayerStatus {
    state: PlayerState;
    currentStation: Station | null;
    streamTitle: string | null;
    sleepTimerMinutes: number | null;
    sleepTimerRemainingSec: number | null;
    reconnectAttempt?: number | null;
}
