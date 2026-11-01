import Hls from 'hls.js';
import { initTauriBridge } from '../bridge/tauri-bridge';

initTauriBridge();

interface SquelchAudioBridge {
    onCommand: (
        callback: (cmd: {
            type: 'play' | 'pause' | 'stop' | 'metadata';
            url?: string;
            isHls?: boolean;
            stationName?: string;
            streamTitle?: string | null;
            logoUrl?: string | null;
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

(function initAudioWorker() {
    const audioEl = document.getElementById(
        'radio-audio'
    ) as HTMLAudioElement | null;
    const bridge = window.squelchAudioBridge ?? window.radioAudioBridge;
    if (!audioEl || !bridge) return;

    // Always 100% unity gain; volume is controlled by macOS system output
    audioEl.volume = 1.0;
    audioEl.muted = false;

    let hlsInstance: Hls | null = null;
    let currentStationName = 'Squelch';

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
                audioEl.volume = 1.0;
                audioEl.muted = false;

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
                        lowLatencyMode: false,
                        backBufferLength: 30
                    });

                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        void audioEl.play().catch((err: unknown) => {
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
                        await audioEl.play();
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
