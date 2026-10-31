import { describe, expect, it } from 'vitest';
import { PlayerStateMachine } from '../../src/core/player/player-state-machine';
import { ReconnectStrategy } from '../../src/core/player/reconnect-strategy';
import {
  IcyStreamDemuxer,
  parseIcyMetadataBlock
} from '../../src/core/player/icy-proxy';

describe('PlayerStateMachine', () => {
  it('follows the valid lifecycle idle -> connecting -> buffering -> playing -> paused -> idle', () => {
    const sm = new PlayerStateMachine();
    expect(sm.getState()).toBe('idle');

    expect(sm.transition({ type: 'PLAY' }).currentState).toBe('connecting');
    expect(sm.transition({ type: 'CONNECTED' }).currentState).toBe('buffering');
    expect(sm.transition({ type: 'PLAYING' }).currentState).toBe('playing');
    expect(sm.transition({ type: 'PAUSE' }).currentState).toBe('paused');
    expect(sm.transition({ type: 'RESUME' }).currentState).toBe('connecting');
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
});

describe('ReconnectStrategy', () => {
  it('computes exponential backoff with jitter and stops after maxAttempts', () => {
    const strategy = new ReconnectStrategy({
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      maxAttempts: 3,
      randomFn: () => 0.5
    });

    const d1 = strategy.nextDelayMs();
    const d2 = strategy.nextDelayMs();
    const d3 = strategy.nextDelayMs();
    const d4 = strategy.nextDelayMs();

    expect(d1).toBe(750); // 500 + 0.5 * 500
    expect(d2).toBe(1500); // 1000 + 0.5 * 1000
    expect(d3).toBe(3000); // 2000 + 0.5 * 2000
    expect(d4).toBeNull();

    strategy.reset();
    expect(strategy.getCurrentAttempt()).toBe(0);
    expect(strategy.nextDelayMs()).toBe(750);
  });
});

describe('ICY Metadata Demuxer', () => {
  it('parses StreamTitle from padded ICY metadata buffer', () => {
    const raw = Buffer.from(
      "StreamTitle='Noah - Separuh Aku';StreamUrl='';\0\0",
      'utf8'
    );
    const parsed = parseIcyMetadataBlock(raw);
    expect(parsed.streamTitle).toBe('Noah - Separuh Aku');
  });

  it('strips metadata bytes accurately across arbitrary TCP chunks without corrupting audio', () => {
    const metaint = 8;
    const audioPart1 = Buffer.from('12345678', 'ascii');
    const metaText = "StreamTitle='Tulus - Hati-Hati di Jalan';";
    const metaBlocks = Math.ceil(metaText.length / 16);
    const metaPadded = Buffer.alloc(metaBlocks * 16, 0);
    metaPadded.write(metaText, 'utf8');
    const lengthByte = Buffer.from([metaBlocks]);
    const audioPart2 = Buffer.from('ABCDEFGH', 'ascii');

    const fullWireStream = Buffer.concat([
      audioPart1,
      lengthByte,
      metaPadded,
      audioPart2
    ]);

    const receivedAudio: Buffer[] = [];
    const receivedMeta: string[] = [];

    const demuxer = new IcyStreamDemuxer(
      metaint,
      (chunk) => receivedAudio.push(Buffer.from(chunk)),
      (meta) => {
        if (meta.streamTitle) receivedMeta.push(meta.streamTitle);
      }
    );

    // Feed 3 bytes at a time to simulate fragmented network packets
    for (let i = 0; i < fullWireStream.length; i += 3) {
      demuxer.push(fullWireStream.subarray(i, i + 3));
    }

    const combinedAudio = Buffer.concat(receivedAudio).toString('ascii');
    expect(combinedAudio).toBe('12345678ABCDEFGH');
    expect(receivedMeta).toEqual(['Tulus - Hati-Hati di Jalan']);
  });
});
