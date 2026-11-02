import type { PlayerAction, PlayerState } from '../types';

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
