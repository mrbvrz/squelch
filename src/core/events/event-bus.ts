import { EventEmitter } from 'events';
import { PlayerState } from '../player/player-state-machine';
import { Station } from '../stations/station.model';

export interface NowPlayingMetadata {
    stationId: string;
    stationName: string;
    streamTitle: string | null;
    logoUrl: string | null;
    genre: string;
}

export interface CoreEventMap {
    'player:state-changed': {
        previousState: PlayerState;
        currentState: PlayerState;
        station: Station | null;
        errorMessage?: string;
        reconnectAttempt?: number;
    };
    'player:metadata-changed': NowPlayingMetadata;
    'player:volume-changed': {
        volume: number;
        muted: boolean;
    };
    'player:sleep-timer-changed': {
        remainingSeconds: number | null;
        durationMinutes: number | null;
    };
    'stations:updated': {
        stations: Station[];
        groups: string[];
    };
    'settings:updated': Record<string, unknown>;
}

export class TypedEventBus {
    private readonly emitter = new EventEmitter();

    constructor() {
        this.emitter.setMaxListeners(50);
    }

    public on<K extends keyof CoreEventMap>(
        event: K,
        listener: (payload: CoreEventMap[K]) => void
    ): () => void {
        this.emitter.on(event, listener);
        return () => {
            this.emitter.off(event, listener);
        };
    }

    public once<K extends keyof CoreEventMap>(
        event: K,
        listener: (payload: CoreEventMap[K]) => void
    ): void {
        this.emitter.once(event, listener);
    }

    public emit<K extends keyof CoreEventMap>(
        event: K,
        payload: CoreEventMap[K]
    ): void {
        this.emitter.emit(event, payload);
    }

    public removeAllListeners(): void {
        this.emitter.removeAllListeners();
    }
}
