import type Hls from 'hls.js';
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

export interface AudioCommand {
    type: 'play' | 'pause' | 'stop' | 'metadata' | 'teardown';
    url?: string;
    isHls?: boolean;
    stationName?: string;
    streamTitle?: string | null;
    logoUrl?: string | null;
    bufferLengthSeconds?: number;
    equalizer?: EqualizerPayload;
    isReconnect?: boolean;
}

interface SquelchAudioBridge {
    onCommand: (callback: (cmd: AudioCommand) => void) => void;
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
    private dryGain: GainNode | null = null;
    private wetGain: GainNode | null = null;
    private masterGain: GainNode | null = null;
    public isInitialized = false;
    private initialSinkId: string | null = null;

    setPendingSinkId(sinkId: string) {
        this.initialSinkId = sinkId;
        if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
            void (this.ctx as any).setSinkId(sinkId).catch(() => {});
        }
    }

    isReady(): boolean {
        return Boolean(this.isInitialized && this.ctx && this.masterGain);
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

            this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
            this.source = this.ctx.createMediaElementSource(audioEl);

            // Master gain node for pop/click prevention and click-free fade
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

            // Dry path (bypasses all filters & compressor when EQ is disabled for pure bit-perfect sound)
            this.dryGain = this.ctx.createGain();
            this.dryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

            // Wet path (runs through 8 EQ bands and normalizer when EQ is enabled)
            this.wetGain = this.ctx.createGain();
            this.wetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

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

            // Smooth transparent dynamics compressor / normalizer
            // 20ms attack avoids destructive clipping of low frequencies (e.g. 50-100Hz bass waves)
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(
                -4.0,
                this.ctx.currentTime
            );
            this.compressor.knee.setValueAtTime(20.0, this.ctx.currentTime);
            this.compressor.ratio.setValueAtTime(3.0, this.ctx.currentTime);
            this.compressor.attack.setValueAtTime(0.02, this.ctx.currentTime);
            this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

            // Connect Dry Path: source -> dryGain -> masterGain -> destination
            this.source.connect(this.dryGain);
            this.dryGain.connect(this.masterGain);

            // Connect Wet Path: source -> filters[0..7] -> compressor -> wetGain -> masterGain -> destination
            let previousNode: AudioNode = this.source;
            for (const filter of this.filters) {
                previousNode.connect(filter);
                previousNode = filter;
            }
            previousNode.connect(this.compressor);
            this.compressor.connect(this.wetGain);
            this.wetGain.connect(this.masterGain);

            // Connect Master to destination
            this.masterGain.connect(this.ctx.destination);

            if (
                this.initialSinkId &&
                typeof (this.ctx as any).setSinkId === 'function'
            ) {
                void (this.ctx as any)
                    .setSinkId(this.initialSinkId)
                    .catch(() => {});
            }

            // Keep context suspended until playback is actively requested!
            // An active running AudioContext on macOS background webview causes CoreAudio buffer underruns.
            if (this.ctx.state === 'running') {
                void this.ctx.suspend();
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

    async suspend() {
        if (this.ctx && this.ctx.state === 'running') {
            try {
                await this.ctx.suspend();
            } catch {
                // Ignore suspend errors
            }
        }
    }

    async close() {
        if (this.ctx && this.ctx.state !== 'closed') {
            try {
                await this.ctx.close();
            } catch {
                // Ignore close errors
            }
            this.ctx = null;
            this.isInitialized = false;
        }
    }

    async fadeToZero(durationMs = 30): Promise<void> {
        if (!this.ctx || !this.masterGain || this.ctx.state !== 'running')
            return;
        try {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(
                this.masterGain.gain.value,
                now
            );
            this.masterGain.gain.linearRampToValueAtTime(
                0,
                now + durationMs / 1000
            );
            await new Promise((r) => setTimeout(r, durationMs + 5));
        } catch {
            // Ignore ramp errors
        }
    }

    fadeIn(durationMs = 30): void {
        if (!this.ctx || !this.masterGain) return;
        try {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(0, now);
            this.masterGain.gain.linearRampToValueAtTime(
                1.0,
                now + durationMs / 1000
            );
        } catch {
            // Ignore ramp errors
        }
    }

    apply(config?: EqualizerPayload | null) {
        if (
            !this.ctx ||
            !this.dryGain ||
            !this.wetGain ||
            this.filters.length !== 8
        )
            return;
        const now = this.ctx.currentTime;
        const isEnabled = Boolean(config?.enabled);

        if (isEnabled) {
            // Crossfade: dry -> 0, wet -> 1
            this.dryGain.gain.setTargetAtTime(0, now, 0.02);
            this.wetGain.gain.setTargetAtTime(1.0, now, 0.02);

            for (let i = 0; i < 8; i++) {
                const rawVal = config?.bands?.[i] ?? 0;
                const clamped = Math.max(-12, Math.min(12, rawVal));
                this.filters[i].gain.setTargetAtTime(clamped, now, 0.04);
            }

            if (this.compressor) {
                const useNormalization = config?.normalization !== false;
                const targetRatio = useNormalization ? 3.0 : 1.0;
                const targetThreshold = useNormalization ? -4.0 : 0.0;
                this.compressor.ratio.setTargetAtTime(targetRatio, now, 0.04);
                this.compressor.threshold.setTargetAtTime(
                    targetThreshold,
                    now,
                    0.04
                );
            }
        } else {
            // Bypass mode: pure direct dry audio
            this.dryGain.gain.setTargetAtTime(1.0, now, 0.02);
            this.wetGain.gain.setTargetAtTime(0, now, 0.02);

            for (let i = 0; i < 8; i++) {
                this.filters[i].gain.setTargetAtTime(0, now, 0.04);
            }

            if (this.compressor) {
                this.compressor.ratio.setTargetAtTime(1.0, now, 0.04);
                this.compressor.threshold.setTargetAtTime(0.0, now, 0.04);
            }
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
        if (!audioEl.paused && currentPlayCmd) {
            eqEngine.init(audioEl);
            eqEngine.resume();
            eqEngine.apply(currentEqualizerConfig);
        } else if (eqEngine.isInitialized) {
            // Player is idle/paused: Apply parameters safely without waking up CoreAudio hardware thread
            eqEngine.apply(currentEqualizerConfig);
        }
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
            try {
                hlsInstance.detachMedia();
            } catch {
                // Ignore detach errors if already disconnected
            }
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
    let currentPlayCmd: AudioCommand | null = null;

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

        await eqEngine.fadeToZero(30);
        destroyHls();
        audioEl.pause();
        audioEl.removeAttribute('src');
        audioEl.load();
        await eqEngine.suspend();
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
        eqEngine.fadeIn(30);

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

        let isHlsInitialized = false;
        if (isHlsStream) {
            try {
                const { default: HlsClass } = await import('hls.js');
                if (HlsClass.isSupported()) {
                    isHlsInitialized = true;
                    hlsInstance = new HlsClass({
                        enableWorker: false,
                        lowLatencyMode: currentBufferLengthSeconds <= 3,
                        maxBufferLength: currentBufferLengthSeconds,
                        maxMaxBufferLength: currentBufferLengthSeconds * 2,
                        maxBufferSize: 4 * 1024 * 1024,
                        maxBufferHole: 0.5,
                        backBufferLength: 10
                    });

                    hlsInstance.on(HlsClass.Events.MANIFEST_PARSED, () => {
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

                    hlsInstance.on(HlsClass.Events.ERROR, (_event, data) => {
                        if (data.fatal) {
                            void handleNetworkIssue(
                                `HLS ${data.type}: ${data.details}`
                            );
                        }
                    });

                    hlsInstance.loadSource(streamUrl);
                    hlsInstance.attachMedia(audioEl);
                }
            } catch (hlsErr) {
                console.error('Failed to load HLS engine:', hlsErr);
            }
        }

        if (!isHlsInitialized) {
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

                // Smoothly fade to 0dB in 30ms to avoid any sharp transient pop/crack
                await eqEngine.fadeToZero(30);
                destroyHls();
                audioEl.pause();
                audioEl.removeAttribute('src');
                audioEl.load();
                // Suspend context to immediately free macOS CoreAudio output unit and prevent buffer underrun crackles
                await eqEngine.suspend();

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

                // Smoothly fade to 0dB in 30ms to avoid any sharp transient pop/crack
                await eqEngine.fadeToZero(30);
                destroyHls();
                audioEl.pause();
                audioEl.removeAttribute('src');
                audioEl.load();
                // Suspend context to immediately free macOS CoreAudio output unit and prevent buffer underrun crackles
                await eqEngine.suspend();

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'none';
                }
                break;
            }
            case 'teardown': {
                clearStallTimer();
                clearReconnectTimer();
                isHandlingIssue = false;
                reconnectAttempts = 0;
                currentPlayCmd = null;

                // On app quit, perform gentle 40ms ramp-down then close AudioContext cleanly
                await eqEngine.fadeToZero(40);
                destroyHls();
                audioEl.pause();
                audioEl.removeAttribute('src');
                await eqEngine.close();

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

    window.addEventListener('beforeunload', () => {
        try {
            audioEl.pause();
            audioEl.removeAttribute('src');
            if (eqEngine.isInitialized) {
                void eqEngine.close();
            }
        } catch {
            // Ignore unload errors
        }
    });
})();

export {};
