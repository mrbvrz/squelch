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
    reconnecting: ['connecting', 'error', 'idle'],
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

    public canTransitionTo(target: PlayerState): boolean {
        if (this.state === target && target === 'connecting') {
            return true;
        }
        return ALLOWED_TRANSITIONS[this.state].includes(target);
    }

    public transition(action: PlayerAction): {
        changed: boolean;
        previousState: PlayerState;
        currentState: PlayerState;
    } {
        const previousState = this.state;
        let targetState: PlayerState = previousState;

        switch (action.type) {
            case 'PLAY':
                targetState = 'connecting';
                this.lastError = undefined;
                this.reconnectAttempt = 0;
                break;
            case 'CONNECTED':
                if (
                    this.state === 'connecting' ||
                    this.state === 'reconnecting'
                ) {
                    targetState = 'buffering';
                }
                break;
            case 'PLAYING':
                if (
                    this.state === 'connecting' ||
                    this.state === 'buffering' ||
                    this.state === 'paused'
                ) {
                    targetState = 'playing';
                    this.lastError = undefined;
                    this.reconnectAttempt = 0;
                }
                break;
            case 'BUFFER_UNDERRUN':
                if (this.state === 'playing') {
                    targetState = 'buffering';
                }
                break;
            case 'PAUSE':
                if (this.state === 'playing' || this.state === 'buffering') {
                    targetState = 'paused';
                }
                break;
            case 'RESUME':
                if (this.state === 'paused') {
                    targetState = 'connecting';
                }
                break;
            case 'STOP':
                targetState = 'idle';
                this.lastError = undefined;
                this.reconnectAttempt = 0;
                break;
            case 'RECONNECT':
                if (
                    this.state === 'connecting' ||
                    this.state === 'buffering' ||
                    this.state === 'playing' ||
                    this.state === 'reconnecting'
                ) {
                    targetState = 'reconnecting';
                    this.reconnectAttempt = action.attempt;
                }
                break;
            case 'ERROR':
                targetState = 'error';
                this.lastError = action.message;
                break;
        }

        if (
            targetState !== previousState &&
            !this.canTransitionTo(targetState) &&
            targetState !== 'idle'
        ) {
            return {
                changed: false,
                previousState,
                currentState: this.state
            };
        }

        this.state = targetState;
        return {
            changed: previousState !== targetState || action.type === 'PLAY',
            previousState,
            currentState: this.state
        };
    }
}
