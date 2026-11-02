import { describe, expect, it } from 'vitest';
import { PlayerStateMachine } from '../../src/utils/player-state';

describe('PlayerStateMachine', () => {
    it('follows the valid lifecycle idle -> connecting -> buffering -> playing -> paused -> idle', () => {
        const sm = new PlayerStateMachine();
        expect(sm.getState()).toBe('idle');

        expect(sm.transition({ type: 'PLAY' }).currentState).toBe('connecting');
        expect(sm.transition({ type: 'CONNECTED' }).currentState).toBe(
            'buffering'
        );
        expect(sm.transition({ type: 'PLAYING' }).currentState).toBe('playing');
        expect(sm.transition({ type: 'PAUSE' }).currentState).toBe('paused');
        expect(sm.transition({ type: 'RESUME' }).currentState).toBe(
            'connecting'
        );
        expect(sm.transition({ type: 'STOP' }).currentState).toBe('idle');
    });

    it('transitions to reconnecting and error properly', () => {
        const sm = new PlayerStateMachine();
        sm.transition({ type: 'PLAY' });
        sm.transition({ type: 'PLAYING' });

        const recon = sm.transition({ type: 'RECONNECT', attempt: 1 });
        expect(recon.currentState).toBe('reconnecting');
        expect(sm.getReconnectAttempt()).toBe(1);

        const err = sm.transition({
            type: 'ERROR',
            message: 'Network unreachable'
        });
        expect(err.currentState).toBe('error');
        expect(sm.getLastError()).toBe('Network unreachable');
    });

    it('transitions to reconnecting and handles retry exhaustion or recovery', () => {
        const sm = new PlayerStateMachine();
        sm.transition({ type: 'PLAY' });
        sm.transition({ type: 'PLAYING' });

        // Network issue triggers reconnect
        const recon = sm.transition({ type: 'RECONNECT', attempt: 1 });
        expect(recon.currentState).toBe('reconnecting');
        expect(sm.getReconnectAttempt()).toBe(1);

        // When reconnect succeeds
        const recovered = sm.transition({ type: 'PLAYING' });
        expect(recovered.currentState).toBe('playing');
        expect(sm.getReconnectAttempt()).toBe(0);

        // Prolonged stall again: retries exhausted -> STOP
        sm.transition({ type: 'RECONNECT', attempt: 8 });
        expect(sm.getState()).toBe('reconnecting');
        const stopped = sm.transition({ type: 'STOP' });
        expect(stopped.currentState).toBe('idle');
        expect(sm.getReconnectAttempt()).toBe(0);
    });

    it('prevents illegal transitions', () => {
        const sm = new PlayerStateMachine();
        expect(sm.getState()).toBe('idle');
        // Illegal: idle cannot jump directly to playing without connecting
        expect(sm.canTransitionTo('playing')).toBe(false);
    });
});
