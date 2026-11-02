import Hls from 'hls.js';
import { invoke } from '@tauri-apps/api/core';
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
            isReconnect?: boolean;
        }) => void
    ) => void;
    notifyPlaying: () => void;
    notifyBuffering: () => void;
    notifyReconnecting: (attempt: number, maxAttempts: number) => void;
    notifyStopped: () => void;
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
    private initialSinkId: string | null = null;

    setPendingSinkId(sinkId: string) {
        this.initialSinkId = sinkId;
        if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
            void (this.ctx as any).setSinkId(sinkId).catch(() => {});
        }
    }

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

            if (
                this.initialSinkId &&
                typeof (this.ctx as any).setSinkId === 'function'
            ) {
                void (this.ctx as any)
                    .setSinkId(this.initialSinkId)
                    .catch(() => {});
            }

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
                const raw = payload.volume;
                const normalized = raw > 1 ? raw / 100 : raw;
                currentVolume = Math.max(0, Math.min(1, normalized));
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

    let currentAudioSinkId = 'default';

    const applyAudioSink = async (targetId?: string, targetName?: string) => {
        const sinkId = targetId || 'default';
        currentAudioSinkId = sinkId;

        // If 'default', clear custom sink so system default is used
        const rawSinkToApply = sinkId === 'default' ? '' : sinkId;
        let resolvedSinkId = rawSinkToApply;

        if (rawSinkToApply && navigator.mediaDevices?.enumerateDevices) {
            try {
                const devs = await navigator.mediaDevices.enumerateDevices();
                const outputDevs = devs.filter((d) => d.kind === 'audiooutput');
                const matched = outputDevs.find(
                    (d) =>
                        d.deviceId === rawSinkToApply ||
                        d.groupId === rawSinkToApply ||
                        (targetName &&
                            d.label &&
                            d.label
                                .toLowerCase()
                                .includes(targetName.toLowerCase())) ||
                        (d.label &&
                            rawSinkToApply
                                .toLowerCase()
                                .includes(d.label.toLowerCase()))
                );
                if (matched?.deviceId) {
                    resolvedSinkId = matched.deviceId;
                }
            } catch {
                // Ignore enumeration failure
            }
        }

        eqEngine.setPendingSinkId(resolvedSinkId);

        if (typeof (audioEl as any).setSinkId === 'function') {
            try {
                await (audioEl as any).setSinkId(resolvedSinkId);
            } catch (err) {
                console.warn('[AudioWorker] audioEl.setSinkId failed:', err);
            }
        }
    };

    // Real-time listener for Audio Output Device Sink updates
    listen<{ deviceId?: string; deviceName?: string }>(
        'squelch:audio:sink',
        (event) => {
            void applyAudioSink(
                event.payload?.deviceId,
                event.payload?.deviceName
            );
        }
    ).catch(() => {});

    // Read initial audioOutputDeviceId from settings
    void invoke('get_settings')
        .then((res: any) => {
            if (res?.settings?.audioOutputDeviceId) {
                void applyAudioSink(res.settings.audioOutputDeviceId);
            }
        })
        .catch(() => {});

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
                    void applyAudioSink(currentAudioSinkId);
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

    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let isHandlingIssue = false;
    let currentPlayCmd: {
        type: 'play' | 'pause' | 'stop' | 'metadata';
        url?: string;
        isHls?: boolean;
        stationName?: string;
        streamTitle?: string | null;
        logoUrl?: string | null;
        bufferLengthSeconds?: number;
        equalizer?: EqualizerPayload;
        isReconnect?: boolean;
    } | null = null;

    const clearStallTimer = () => {
        if (stallTimer) {
            clearTimeout(stallTimer);
            stallTimer = null;
        }
    };

    const clearReconnectTimer = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    const startStallTimer = async () => {
        clearStallTimer();
        if (isHandlingIssue || !currentPlayCmd) return;
        let timeoutMs = 12000;
        try {
            const cfg: any = await invoke('get_settings');
            if (cfg?.settings?.networkTimeoutMs) {
                timeoutMs = Number(cfg.settings.networkTimeoutMs) || 12000;
            }
        } catch {
            // fallback to default 12s
        }

        stallTimer = setTimeout(() => {
            stallTimer = null;
            void handleNetworkIssue('Stall timeout exceeded');
        }, timeoutMs);
    };

    const stopAndNotify = async (
        lang: 'id' | 'en',
        stationName: string,
        attempts: number,
        exhausted: boolean
    ) => {
        console.warn(
            `[AudioWorker] Network connection failed. Stopping playback and notifying user.`
        );
        isHandlingIssue = false;
        clearStallTimer();
        clearReconnectTimer();
        reconnectAttempts = 0;
        currentPlayCmd = null;

        destroyHls();
        audioEl.pause();
        audioEl.removeAttribute('src');
        audioEl.load();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }

        bridge.notifyStopped();

        const title = lang === 'id' ? 'Koneksi Terputus' : 'Connection Lost';
        const body =
            lang === 'id'
                ? exhausted
                    ? `Gagal menyambung ulang ke ${stationName} setelah ${attempts} percobaan. Pemutaran dihentikan.`
                    : `Gagal memuat ${stationName} karena kendala jaringan. Pemutaran dihentikan.`
                : exhausted
                  ? `Failed to reconnect to ${stationName} after ${attempts} attempts. Playback stopped.`
                  : `Failed to connect to ${stationName} due to network timeout. Playback stopped.`;

        try {
            await invoke('send_notification', { title, body });
        } catch (e) {
            console.error('[AudioWorker] Failed to send notification:', e);
        }
    };

    const handleNetworkIssue = async (reason: string) => {
        if (!currentPlayCmd) return;
        clearStallTimer();
        if (isHandlingIssue) return;
        isHandlingIssue = true;

        let autoReconnect = true;
        let maxAttempts = 8;
        let lang: 'id' | 'en' = 'id';

        try {
            const cfg: any = await invoke('get_settings');
            if (cfg?.settings) {
                autoReconnect = cfg.settings.autoReconnect !== false;
                maxAttempts = Number(cfg.settings.maxReconnectAttempts) || 8;
                lang = cfg.settings.language === 'en' ? 'en' : 'id';
            }
        } catch {
            // keep defaults
        }

        const stationName =
            currentPlayCmd.stationName || currentStationName || 'Radio';

        if (!autoReconnect) {
            await stopAndNotify(lang, stationName, 0, false);
            return;
        }

        if (reconnectAttempts >= maxAttempts) {
            await stopAndNotify(lang, stationName, maxAttempts, true);
            return;
        }

        reconnectAttempts++;
        console.warn(
            `[AudioWorker] Network issue (${reason}). Attempting reconnect ${reconnectAttempts}/${maxAttempts}...`
        );

        bridge.notifyReconnecting(reconnectAttempts, maxAttempts);

        clearReconnectTimer();
        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            if (!currentPlayCmd) {
                isHandlingIssue = false;
                return;
            }

            destroyHls();
            audioEl.pause();
            audioEl.removeAttribute('src');
            audioEl.load();

            void startStallTimer();
            isHandlingIssue = false;
            await executePlay(currentPlayCmd, true);
        }, 2500);
    };

    const executePlay = async (
        cmd: typeof currentPlayCmd,
        isReconnect = false
    ) => {
        if (!cmd || !cmd.url) return;

        destroyHls();
        audioEl.volume = currentVolume;
        audioEl.muted = currentMuted;

        if (cmd.bufferLengthSeconds) {
            currentBufferLengthSeconds = Number(cmd.bufferLengthSeconds) || 5;
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

        const isHlsStream =
            Boolean(cmd.isHls) || cmd.url.toLowerCase().includes('.m3u8');

        const streamUrl =
            isReconnect && !isHlsStream
                ? `${cmd.url}${cmd.url.includes('?') ? '&' : '?'}_t=${Date.now()}`
                : cmd.url;

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
                        audioEl.muted = currentMuted;
                        audioEl.volume = currentVolume;
                        eqEngine.resume();
                    })
                    .catch((err: unknown) => {
                        const msg =
                            err instanceof Error
                                ? err.message
                                : 'HLS play failed';
                        void handleNetworkIssue(msg);
                    });
            });

            hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    void handleNetworkIssue(
                        `HLS ${data.type}: ${data.details}`
                    );
                }
            });

            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(audioEl);
        } else {
            audioEl.pause();
            audioEl.src = streamUrl;
            audioEl.load();
            try {
                audioEl.muted = true;
                await audioEl.play();
                audioEl.muted = currentMuted;
                audioEl.volume = currentVolume;
                eqEngine.resume();
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Play interrupted';
                void handleNetworkIssue(msg);
            }
        }
    };

    audioEl.addEventListener('playing', () => {
        clearStallTimer();
        clearReconnectTimer();
        reconnectAttempts = 0;
        isHandlingIssue = false;
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        eqEngine.resume();
        bridge.notifyPlaying();
    });

    audioEl.addEventListener('waiting', () => {
        if (currentPlayCmd) {
            bridge.notifyBuffering();
            void startStallTimer();
        }
    });

    audioEl.addEventListener('stalled', () => {
        if (currentPlayCmd) {
            bridge.notifyBuffering();
            void startStallTimer();
        }
    });

    audioEl.addEventListener('ended', () => {
        if (currentPlayCmd && !isHandlingIssue) {
            void handleNetworkIssue('Stream ended unexpectedly');
        }
    });

    audioEl.addEventListener('error', () => {
        if (hlsInstance) return;
        if (!audioEl.src || audioEl.src === window.location.href) return;
        if (!currentPlayCmd) return;
        const code = audioEl.error?.code ?? 0;
        const msg = audioEl.error?.message || `MediaError code ${code}`;
        void handleNetworkIssue(msg);
    });

    bridge.onCommand(async (cmd) => {
        switch (cmd.type) {
            case 'play': {
                clearStallTimer();
                clearReconnectTimer();
                isHandlingIssue = false;
                if (!cmd.isReconnect) {
                    reconnectAttempts = 0;
                }
                currentPlayCmd = cmd;
                void startStallTimer();
                await executePlay(cmd, Boolean(cmd.isReconnect));
                break;
            }
            case 'pause': {
                clearStallTimer();
                clearReconnectTimer();
                isHandlingIssue = false;
                reconnectAttempts = 0;
                currentPlayCmd = null;
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
                clearStallTimer();
                clearReconnectTimer();
                isHandlingIssue = false;
                reconnectAttempts = 0;
                currentPlayCmd = null;
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
