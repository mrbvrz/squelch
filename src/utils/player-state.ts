import type { PlayerAction, PlayerState } from '../types';
import type { TranslationDictionary } from '../i18n';

export interface PlayerStateHeadline {
    main: string;
    sub: string;
    color: string;
}

/** Maps a player state and optional reconnect count into a UI badge headline. */
export function getPlayerStateHeadline(
    playerState: PlayerState,
    reconnectAttempt: number | null | undefined,
    t: Pick<
        TranslationDictionary,
        | 'statusLiveSub'
        | 'statusConnectingSub'
        | 'statusBufferingSub'
        | 'statusReconnectingSub'
        | 'statusPausedSub'
        | 'statusOfflineSub'
        | 'statusStandbySub'
    >
): PlayerStateHeadline {
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
            return { main: 'HOLD', sub: t.statusPausedSub, color: '#8E8E93' };
        case 'error':
            return { main: 'ERR', sub: t.statusOfflineSub, color: '#FF453A' };
        case 'idle':
        default:
            return { main: 'IDLE', sub: t.statusStandbySub, color: '#8E8E93' };
    }
}

const ALLOWED_TRANSITIONS: Record<PlayerState, PlayerState[]> = {
    idle: ['connecting'],
    connecting: ['buffering', 'playing', 'reconnecting', 'error', 'idle'],
    buffering: [
        'playing',
        'paused',
        'reconnecting',
        'error',
        'idle',
        'connecting'
    ],
    playing: [
        'paused',
        'buffering',
        'reconnecting',
        'error',
        'idle',
        'connecting'
    ],
    paused: ['connecting', 'playing', 'idle'],
    reconnecting: [
        'connecting',
        'buffering',
        'playing',
        'paused',
        'error',
        'idle'
    ],
    error: ['connecting', 'idle']
};

export class PlayerStateMachine {
    private state: PlayerState = 'idle';
    private lastError: string | undefined;
    private reconnectAttempt = 0;

    public getState(): PlayerState {
        return this.state;
    }

    public getLastError(): string | undefined {
        return this.lastError;
    }

    public getReconnectAttempt(): number {
        return this.reconnectAttempt;
    }

    public canTransitionTo(nextState: PlayerState): boolean {
        return ALLOWED_TRANSITIONS[this.state]?.includes(nextState) ?? false;
    }

    public transition(action: PlayerAction): {
        previousState: PlayerState;
        currentState: PlayerState;
    } {
        const prev = this.state;
        let next: PlayerState = prev;

        switch (action.type) {
            case 'PLAY':
            case 'RESUME':
                next = 'connecting';
                this.lastError = undefined;
                this.reconnectAttempt = 0;
                break;
            case 'CONNECTED':
                next = 'buffering';
                break;
            case 'PLAYING':
                next = 'playing';
                this.lastError = undefined;
                this.reconnectAttempt = 0;
                break;
            case 'BUFFER_UNDERRUN':
                next = 'buffering';
                break;
            case 'PAUSE':
                next = 'paused';
                break;
            case 'STOP':
                next = 'idle';
                this.reconnectAttempt = 0;
                break;
            case 'RECONNECT':
                next = 'reconnecting';
                this.reconnectAttempt = action.attempt;
                break;
            case 'ERROR':
                next = 'error';
                this.lastError = action.message;
                break;
        }

        if (this.canTransitionTo(next)) {
            this.state = next;
        }

        return { previousState: prev, currentState: this.state };
    }

    public reset(): void {
        this.state = 'idle';
        this.lastError = undefined;
        this.reconnectAttempt = 0;
    }
}
