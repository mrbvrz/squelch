import Hls from 'hls.js';
import { listen } from '@tauri-apps/api/event';
import { initTauriBridge } from '../bridge/tauri-bridge';

initTauriBridge();

export interface EqualizerPayload {
    enabled: boolean;
    preset?: string;
    bands: [number, number, number, number, number, number, number, number];
    normalization?: boolean;
}

interface SquelchAudioBridge {
    onCommand: (
        callback: (cmd: {
            type: 'play' | 'pause' | 'stop' | 'metadata';
            url?: string;
            isHls?: boolean;
            stationName?: string;
            streamTitle?: string | null;
            logoUrl?: string | null;
            bufferLengthSeconds?: number;
            equalizer?: EqualizerPayload;
        }) => void
    ) => void;
    notifyPlaying: () => void;
    notifyBuffering: () => void;
    notifyError: (message: string) => void;
    notifyDeviceRemoved: () => void;
    notifyMediaAction: (
        action: 'play' | 'pause' | 'nexttrack' | 'previoustrack'
    ) => void;
}

declare global {
    interface Window {
        squelchAudioBridge?: SquelchAudioBridge;
        radioAudioBridge?: SquelchAudioBridge;
    }
}

class AudioEqualizerEngine {
    private ctx: AudioContext | null = null;
    private source: MediaElementAudioSourceNode | null = null;
    private filters: BiquadFilterNode[] = [];
    private compressor: DynamicsCompressorNode | null = null;
    private isInitialized = false;

    init(audioEl: HTMLAudioElement) {
        if (this.isInitialized) return;
        try {
            const AudioContextClass =
                window.AudioContext ||
                (
                    window as unknown as {
                        webkitAudioContext?: typeof AudioContext;
                    }
                ).webkitAudioContext;
            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass();
            this.source = this.ctx.createMediaElementSource(audioEl);

            // 8 Bands: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 4kHz, 16kHz
            const specs: Array<{
                f: number;
                type: BiquadFilterType;
                q?: number;
            }> = [
                { f: 32, type: 'lowshelf' },
                { f: 64, type: 'peaking', q: 1.2 },
                { f: 125, type: 'peaking', q: 1.2 },
                { f: 250, type: 'peaking', q: 1.2 },
                { f: 500, type: 'peaking', q: 1.2 },
                { f: 1000, type: 'peaking', q: 1.2 },
                { f: 4000, type: 'peaking', q: 1.2 },
                { f: 16000, type: 'highshelf' }
            ];

            this.filters = specs.map((spec) => {
                const node = this.ctx!.createBiquadFilter();
                node.type = spec.type;
                node.frequency.value = spec.f;
                if (spec.q) node.Q.value = spec.q;
                node.gain.value = 0;
                return node;
            });

            // Dynamics compressor acting as soft limiter / volume normalizer
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(
                -1.5,
                this.ctx.currentTime
            );
            this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

            let previousNode: AudioNode = this.source;
            for (const filter of this.filters) {
                previousNode.connect(filter);
                previousNode = filter;
            }
            previousNode.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            this.isInitialized = true;
        } catch (e) {
            console.warn(
                '[AudioEqualizer] Web Audio API init skipped or failed:',
                e
            );
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
    }

    apply(config?: EqualizerPayload | null) {
        if (!config || !this.ctx || this.filters.length !== 8) return;
        const now = this.ctx.currentTime;
        const isEnabled = Boolean(config.enabled);

        for (let i = 0; i < 8; i++) {
            const rawVal = config.bands?.[i] ?? 0;
            const clamped = Math.max(-12, Math.min(12, rawVal));
            const targetGain = isEnabled ? clamped : 0;
            this.filters[i].gain.setTargetAtTime(targetGain, now, 0.04);
        }

        if (this.compressor) {
            const useNormalization = config.normalization !== false;
            const targetRatio = isEnabled && useNormalization ? 4 : 1;
            this.compressor.ratio.setTargetAtTime(targetRatio, now, 0.04);
        }
    }
}

(function initAudioWorker() {
    const audioEl = document.getElementById(
        'radio-audio'
    ) as HTMLAudioElement | null;
    const bridge = window.squelchAudioBridge ?? window.radioAudioBridge;
    if (!audioEl || !bridge) return;

    // Always 100% unity gain; volume is controlled by macOS system output
    audioEl.volume = 1.0;
    audioEl.muted = false;

    const eqEngine = new AudioEqualizerEngine();
    let currentBufferLengthSeconds = 5;
    let currentEqualizerConfig: EqualizerPayload | null = null;
    let currentVolume = 1.0;
    let currentMuted = false;

    let hlsInstance: Hls | null = null;
    let currentStationName = 'Squelch';

    // Real-time listener for Volume and Mute updates
    listen<{ volume?: number; muted?: boolean }>(
        'squelch:audio:volume',
        (event) => {
            const payload = event.payload;
            if (typeof payload?.volume === 'number') {
                currentVolume = Math.max(0, Math.min(1, payload.volume));
                audioEl.volume = currentVolume;
            }
            if (typeof payload?.muted === 'boolean') {
                currentMuted = Boolean(payload.muted);
                audioEl.muted = currentMuted;
            }
        }
    ).catch(() => {});

    // Real-time listener for EQ updates from UI
    listen<EqualizerPayload>('squelch:audio:eq', (event) => {
        currentEqualizerConfig = event.payload;
        eqEngine.init(audioEl);
        eqEngine.resume();
        eqEngine.apply(currentEqualizerConfig);
    }).catch(() => {});

    // Real-time listener for Buffer length updates from UI
    listen<{ bufferLengthSeconds: number }>('squelch:audio:buffer', (event) => {
        const val = Number(event.payload?.bufferLengthSeconds);
        if (!isNaN(val) && val >= 2 && val <= 30) {
            currentBufferLengthSeconds = val;
            if (hlsInstance) {
                hlsInstance.config.maxBufferLength = currentBufferLengthSeconds;
                hlsInstance.config.maxMaxBufferLength =
                    currentBufferLengthSeconds * 2;
            }
        }
    }).catch(() => {});

    const destroyHls = () => {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    };

    const updateMediaSession = (meta: {
        stationName?: string;
        streamTitle?: string | null;
        logoUrl?: string | null;
    }) => {
        if (meta.stationName) {
            currentStationName = meta.stationName;
        }
        if ('mediaSession' in navigator) {
            const title = meta.streamTitle || currentStationName;
            const artist = meta.streamTitle
                ? currentStationName
                : 'Squelch Live';
            const artwork = meta.logoUrl
                ? [{ src: meta.logoUrl, sizes: '512x512', type: 'image/jpeg' }]
                : [];
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title,
                    artist,
                    album: 'Squelch',
                    artwork
                });
            } catch {
                // Ignore invalid artwork URLs
            }
        }
    };

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            bridge.notifyMediaAction('play');
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            bridge.notifyMediaAction('pause');
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            bridge.notifyMediaAction('nexttrack');
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            bridge.notifyMediaAction('previoustrack');
        });
    }

    let knownOutputCount = -1;
    if (navigator.mediaDevices?.enumerateDevices) {
        const refreshDeviceCount = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const outputs = devices.filter(
                    (d) => d.kind === 'audiooutput'
                ).length;
                if (knownOutputCount > 0 && outputs < knownOutputCount) {
                    bridge.notifyDeviceRemoved();
                }
                knownOutputCount = outputs;
            } catch {
                // Ignore enumeration error
            }
        };
        void refreshDeviceCount();
        navigator.mediaDevices.addEventListener('devicechange', () => {
            void refreshDeviceCount();
        });
    }

    audioEl.addEventListener('playing', () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        eqEngine.resume();
        bridge.notifyPlaying();
    });

    audioEl.addEventListener('waiting', () => {
        bridge.notifyBuffering();
    });

    audioEl.addEventListener('stalled', () => {
        bridge.notifyBuffering();
    });

    audioEl.addEventListener('error', () => {
        if (hlsInstance) return;
        if (!audioEl.src || audioEl.src === window.location.href) return;
        const code = audioEl.error?.code ?? 0;
        const msg = audioEl.error?.message || `MediaError code ${code}`;
        bridge.notifyError(msg);
    });

    bridge.onCommand(async (cmd) => {
        switch (cmd.type) {
            case 'play': {
                destroyHls();
                audioEl.volume = currentVolume;
                audioEl.muted = currentMuted;

                if (cmd.bufferLengthSeconds) {
                    currentBufferLengthSeconds =
                        Number(cmd.bufferLengthSeconds) || 5;
                }
                if (cmd.equalizer) {
                    currentEqualizerConfig = cmd.equalizer;
                }

                eqEngine.init(audioEl);
                eqEngine.resume();
                if (currentEqualizerConfig) {
                    eqEngine.apply(currentEqualizerConfig);
                }

                updateMediaSession({
                    stationName: cmd.stationName,
                    streamTitle: cmd.streamTitle,
                    logoUrl: cmd.logoUrl
                });

                if (!cmd.url) break;

                const isHlsStream =
                    Boolean(cmd.isHls) ||
                    cmd.url.toLowerCase().includes('.m3u8');

                if (isHlsStream && Hls.isSupported()) {
                    hlsInstance = new Hls({
                        enableWorker: false,
                        lowLatencyMode: currentBufferLengthSeconds <= 3,
                        maxBufferLength: currentBufferLengthSeconds,
                        maxMaxBufferLength: currentBufferLengthSeconds * 2,
                        backBufferLength: 30
                    });

                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        audioEl.muted = true;
                        void audioEl
                            .play()
                            .then(() => {
                                audioEl.muted = false;
                                eqEngine.resume();
                            })
                            .catch((err: unknown) => {
                                const msg =
                                    err instanceof Error
                                        ? err.message
                                        : 'HLS play failed';
                                bridge.notifyError(msg);
                            });
                    });

                    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
                        if (data.fatal) {
                            bridge.notifyError(
                                `HLS ${data.type}: ${data.details}`
                            );
                        }
                    });

                    hlsInstance.loadSource(cmd.url);
                    hlsInstance.attachMedia(audioEl);
                } else {
                    audioEl.pause();
                    audioEl.src = cmd.url;
                    audioEl.load();
                    try {
                        audioEl.muted = true;
                        await audioEl.play();
                        audioEl.muted = false;
                        eqEngine.resume();
                    } catch (err) {
                        const msg =
                            err instanceof Error
                                ? err.message
                                : 'Play interrupted';
                        bridge.notifyError(msg);
                    }
                }
                break;
            }
            case 'pause': {
                destroyHls();
                audioEl.pause();
                audioEl.removeAttribute('src');
                audioEl.load();
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                }
                break;
            }
            case 'stop': {
                destroyHls();
                audioEl.pause();
                audioEl.removeAttribute('src');
                audioEl.load();
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'none';
                }
                break;
            }
            case 'metadata': {
                updateMediaSession({
                    stationName: cmd.stationName,
                    streamTitle: cmd.streamTitle,
                    logoUrl: cmd.logoUrl
                });
                break;
            }
        }
    });
})();

export {};
