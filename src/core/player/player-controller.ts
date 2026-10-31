import { TypedEventBus } from '../events/event-bus';
import { Station } from '../stations/station.model';
import { LocalIcyProxyServer } from './icy-proxy';
import { PlayerState, PlayerStateMachine } from './player-state-machine';
import { ReconnectStrategy } from './reconnect-strategy';

export interface AudioTransport {
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

export interface PlayerControllerOptions {
  eventBus: TypedEventBus;
  audioTransport: AudioTransport;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  userAgent?: string;
  timeoutMs?: number;
}

export class PlayerController {
  private readonly eventBus: TypedEventBus;
  private readonly audioTransport: AudioTransport;
  private readonly stateMachine = new PlayerStateMachine();
  private readonly icyProxy = new LocalIcyProxyServer();
  private readonly reconnectStrategy: ReconnectStrategy;

  private currentStation: Station | null = null;
  private currentStreamTitle: string | null = null;
  private autoReconnect: boolean;
  private userAgent: string;
  private timeoutMs: number;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sleepTimer: NodeJS.Timeout | null = null;
  private sleepInterval: NodeJS.Timeout | null = null;
  private sleepRemainingSec: number | null = null;
  private sleepDurationMin: number | null = null;
  private wasPlayingBeforeSystemPause = false;

  constructor(options: PlayerControllerOptions) {
    this.eventBus = options.eventBus;
    this.audioTransport = options.audioTransport;
    this.autoReconnect = options.autoReconnect ?? true;
    this.userAgent = options.userAgent ?? 'Squelch/0.1.0 (macOS)';
    this.timeoutMs = options.timeoutMs ?? 12000;
    this.reconnectStrategy = new ReconnectStrategy({
      maxAttempts: options.maxReconnectAttempts ?? 8
    });
  }

  public async initialize(): Promise<void> {
    await this.icyProxy.start();
  }

  public async shutdown(): Promise<void> {
    this.clearReconnectTimer();
    this.clearSleepTimer();
    await this.icyProxy.stop();
  }

  public getState(): PlayerState {
    return this.stateMachine.getState();
  }

  public getCurrentStation(): Station | null {
    return this.currentStation;
  }

  public getCurrentStreamTitle(): string | null {
    return this.currentStreamTitle;
  }

  public setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.autoReconnect = enabled;
    if (typeof maxAttempts === 'number') {
      this.reconnectStrategy.setMaxAttempts(maxAttempts);
    }
  }

  public setNetworkConfig(config: {
    userAgent?: string;
    timeoutMs?: number;
  }): void {
    if (config.userAgent) this.userAgent = config.userAgent;
    if (config.timeoutMs) this.timeoutMs = config.timeoutMs;
  }

  public async play(station: Station): Promise<void> {
    this.clearReconnectTimer();
    this.reconnectStrategy.reset();
    this.currentStation = station;
    this.currentStreamTitle = null;

    this.applyTransition({ type: 'PLAY' });
    this.emitMetadata();

    await this.startStreamInternal(station);
  }

  public async togglePlayPause(
    fallbackStation?: Station | null
  ): Promise<void> {
    const state = this.stateMachine.getState();
    if (
      state === 'playing' ||
      state === 'buffering' ||
      state === 'connecting'
    ) {
      await this.pause();
    } else if (state === 'paused' && this.currentStation) {
      await this.resume();
    } else if (this.currentStation) {
      await this.play(this.currentStation);
    } else if (fallbackStation) {
      await this.play(fallbackStation);
    }
  }

  public async pause(): Promise<void> {
    this.clearReconnectTimer();
    this.icyProxy.abortActiveStream();
    await this.audioTransport.pause();
    this.applyTransition({ type: 'PAUSE' });
  }

  public async resume(): Promise<void> {
    if (!this.currentStation) return;
    this.applyTransition({ type: 'RESUME' });
    await this.startStreamInternal(this.currentStation);
  }

  public async stop(): Promise<void> {
    this.clearReconnectTimer();
    this.reconnectStrategy.reset();
    this.icyProxy.abortActiveStream();
    this.currentStreamTitle = null;
    await this.audioTransport.stop();
    this.applyTransition({ type: 'STOP' });
  }

  public setSleepTimer(minutes: number | null): void {
    this.clearSleepTimer();
    if (!minutes || minutes <= 0) {
      this.eventBus.emit('player:sleep-timer-changed', {
        remainingSeconds: null,
        durationMinutes: null
      });
      return;
    }

    this.sleepDurationMin = minutes;
    this.sleepRemainingSec = minutes * 60;
    this.eventBus.emit('player:sleep-timer-changed', {
      remainingSeconds: this.sleepRemainingSec,
      durationMinutes: this.sleepDurationMin
    });

    this.sleepInterval = setInterval(() => {
      if (this.sleepRemainingSec !== null && this.sleepRemainingSec > 0) {
        this.sleepRemainingSec -= 1;
        if (this.sleepRemainingSec <= 60 || this.sleepRemainingSec % 10 === 0) {
          this.eventBus.emit('player:sleep-timer-changed', {
            remainingSeconds: this.sleepRemainingSec,
            durationMinutes: this.sleepDurationMin
          });
        }
      }
    }, 1000);

    this.sleepTimer = setTimeout(
      () => {
        this.clearSleepTimer();
        void this.stop();
        this.eventBus.emit('player:sleep-timer-changed', {
          remainingSeconds: null,
          durationMinutes: null
        });
      },
      minutes * 60 * 1000
    );
  }

  public getSleepTimerState(): {
    remainingSeconds: number | null;
    durationMinutes: number | null;
  } {
    return {
      remainingSeconds: this.sleepRemainingSec,
      durationMinutes: this.sleepDurationMin
    };
  }

  public notifyAudioPlaying(): void {
    this.reconnectStrategy.reset();
    this.applyTransition({ type: 'PLAYING' });
  }

  public notifyAudioBuffering(): void {
    this.applyTransition({ type: 'BUFFER_UNDERRUN' });
  }

  public notifyStreamError(reason: string): void {
    const state = this.stateMachine.getState();
    if (state === 'idle' || state === 'paused') {
      return;
    }

    if (this.autoReconnect && this.currentStation) {
      const nextDelay = this.reconnectStrategy.nextDelayMs();
      if (nextDelay !== null) {
        const attempt = this.reconnectStrategy.getCurrentAttempt();
        this.applyTransition({ type: 'RECONNECT', attempt });
        this.clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
          if (
            this.currentStation &&
            this.stateMachine.getState() === 'reconnecting'
          ) {
            this.applyTransition({ type: 'PLAY' });
            void this.startStreamInternal(this.currentStation);
          }
        }, nextDelay);
        return;
      }
    }

    this.applyTransition({ type: 'ERROR', message: reason });
  }

  public async handleSystemSleepOrAudioInterrupt(): Promise<void> {
    const state = this.stateMachine.getState();
    if (
      state === 'playing' ||
      state === 'buffering' ||
      state === 'connecting'
    ) {
      this.wasPlayingBeforeSystemPause = true;
      await this.pause();
    } else {
      this.wasPlayingBeforeSystemPause = false;
    }
  }

  public async handleSystemWake(): Promise<void> {
    if (this.wasPlayingBeforeSystemPause && this.currentStation) {
      this.wasPlayingBeforeSystemPause = false;
      await this.resume();
    }
  }

  private async startStreamInternal(station: Station): Promise<void> {
    await this.icyProxy.start();

    const isHls =
      station.streamType === 'hls' ||
      station.streamUrl.toLowerCase().includes('.m3u8');

    const playUrl = isHls
      ? station.streamUrl
      : this.icyProxy.getProxyUrlFor(station.streamUrl, {
          userAgent: this.userAgent,
          timeoutMs: this.timeoutMs,
          onStreamConnected: () => {
            this.applyTransition({ type: 'CONNECTED' });
          },
          onMetadata: (meta) => {
            if (
              meta.streamTitle &&
              meta.streamTitle !== this.currentStreamTitle
            ) {
              this.currentStreamTitle = meta.streamTitle;
              this.emitMetadata();
              void this.audioTransport.updateMediaSessionMetadata({
                stationName: station.name,
                streamTitle: this.currentStreamTitle,
                logoUrl: station.logoUrl
              });
            }
          },
          onStreamError: (err) => {
            this.notifyStreamError(err.message);
          }
        });

    try {
      await this.audioTransport.playSource({
        url: playUrl,
        isHls,
        stationName: station.name,
        streamTitle: this.currentStreamTitle,
        logoUrl: station.logoUrl
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to start playback';
      this.notifyStreamError(msg);
    }
  }

  private emitMetadata(): void {
    if (!this.currentStation) return;
    this.eventBus.emit('player:metadata-changed', {
      stationId: this.currentStation.id,
      stationName: this.currentStation.name,
      streamTitle: this.currentStreamTitle,
      logoUrl: this.currentStation.logoUrl,
      genre: this.currentStation.genre
    });
  }

  private applyTransition(
    action: Parameters<PlayerStateMachine['transition']>[0]
  ): void {
    const result = this.stateMachine.transition(action);
    if (result.changed) {
      this.eventBus.emit('player:state-changed', {
        previousState: result.previousState,
        currentState: result.currentState,
        station: this.currentStation,
        errorMessage: this.stateMachine.getLastError(),
        reconnectAttempt: this.stateMachine.getReconnectAttempt()
      });
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearSleepTimer(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    if (this.sleepInterval) {
      clearInterval(this.sleepInterval);
      this.sleepInterval = null;
    }
    this.sleepRemainingSec = null;
    this.sleepDurationMin = null;
  }
}
