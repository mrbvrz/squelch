import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { applyAppearanceVariables } from '../utils/appearance';
import type { ListeningStatsSchema } from '../types/stats';
import {
    buildListeningStatsSummary,
    recordListeningSeconds
} from '../utils/listening-stats';
import {
    fetchOnlineCountries,
    searchOnlineStations
} from './radio-browser-api';
import {
    exportStationsData,
    importStationsData,
    backupAppDataBundle,
    restoreAppDataBundle
} from './backup-restore';
import { setSleepTimer as handleSetSleepTimer } from './sleep-timer';

interface PlayerStatus {
    state:
        'idle' | 'buffering' | 'playing' | 'paused' | 'error' | 'reconnecting';
    currentStation: any | null;
    streamTitle: string | null;
    sleepTimerMinutes: number | null;
    sleepTimerRemainingSec: number | null;
    reconnectAttempt?: number | null;
}

let playerStatus: PlayerStatus = {
    state: 'idle',
    currentStation: null,
    streamTitle: null,
    sleepTimerMinutes: null,
    sleepTimerRemainingSec: null,
    reconnectAttempt: null
};

let currentAudioVolume = 1.0;
let isAudioMuted = false;

function syncPlayerStatusToRust() {
    void invoke('update_player_status', {
        status: {
            ...playerStatus,
            volume: currentAudioVolume,
            isMuted: isAudioMuted
        }
    }).catch(() => {});
}

let statsData: ListeningStatsSchema = {
    schemaVersion: 1,
    dailySeconds: {},
    hourlySeconds: {},
    monthlySeconds: {},
    stationSeconds: {},
    stationNames: {},
    stationLogos: {},
    totalSeconds: 0
};
let isStatsLoaded = false;
let statsDirty = false;
let lastTickTimeMs: number | null = null;
let statsSaveTimeout: ReturnType<typeof setTimeout> | null = null;

async function ensureStatsLoaded(): Promise<ListeningStatsSchema> {
    if (!isStatsLoaded) {
        try {
            const raw: any = await invoke('get_listening_stats');
            if (raw && typeof raw === 'object') {
                statsData = {
                    schemaVersion: 1,
                    dailySeconds: raw.dailySeconds || {},
                    monthlySeconds: raw.monthlySeconds || {},
                    stationSeconds: raw.stationSeconds || {},
                    totalSeconds:
                        typeof raw.totalSeconds === 'number'
                            ? raw.totalSeconds
                            : 0
                };
            }
        } catch (e) {
            console.error('Failed to load listening stats:', e);
        }
        isStatsLoaded = true;
    }
    return statsData;
}

async function flushStatsToDisk(): Promise<void> {
    if (!statsDirty) return;
    try {
        await invoke('save_listening_stats', { stats: statsData });
        statsDirty = false;
    } catch (e) {
        console.error('Failed to save listening stats:', e);
    }
}

function scheduleStatsSave(): void {
    if (statsSaveTimeout) return;
    statsSaveTimeout = setTimeout(() => {
        statsSaveTimeout = null;
        void flushStatsToDisk();
    }, 5000);
}

function recordListeningTick(now = new Date()): void {
    if (playerStatus.state !== 'playing') {
        lastTickTimeMs = null;
        return;
    }
    const nowMs = now.getTime();
    if (lastTickTimeMs === null) {
        lastTickTimeMs = nowMs;
        return;
    }
    const elapsedSec = Math.floor((nowMs - lastTickTimeMs) / 1000);
    if (elapsedSec < 1) return;

    lastTickTimeMs += elapsedSec * 1000;

    recordListeningSeconds(
        statsData,
        elapsedSec,
        playerStatus.currentStation,
        now
    );
    statsDirty = true;
    scheduleStatsSave();
}

export function initTauriBridge() {
    if (typeof window === 'undefined') return;
    if (!('__TAURI_INTERNALS__' in window)) return;

    void ensureStatsLoaded();

    // Hydrate player status from Rust global store on startup
    void invoke('get_player_status')
        .then((status: any) => {
            if (status && typeof status === 'object') {
                playerStatus = { ...playerStatus, ...status };
                emit('ui:state-changed', { ...playerStatus });
            }
        })
        .catch(() => {});

    // Listen to synchronized player state across all windows
    listen('squelch:player-sync', (event) => {
        const payload = event.payload as any;
        if (payload && typeof payload === 'object') {
            playerStatus = { ...playerStatus, ...payload };
            if (typeof payload.volume === 'number') {
                currentAudioVolume = payload.volume;
            }
            if (typeof payload.isMuted === 'boolean') {
                isAudioMuted = payload.isMuted;
            }
            emit('ui:state-changed', {
                ...playerStatus,
                volume: currentAudioVolume,
                isMuted: isAudioMuted
            });
        }
    });

    setInterval(() => {
        recordListeningTick();
    }, 1000);

    window.addEventListener('beforeunload', () => {
        recordListeningTick();
        void flushStatsToDisk();
    });

    // Listen to metadata from Rust ICY proxy
    listen<string>('squelch:metadata', (event) => {
        playerStatus.streamTitle = event.payload;
        syncPlayerStatusToRust();
        emit('ui:state-changed', { ...playerStatus });
    });

    // Listen to audio worker state updates
    listen<string>('squelch:audio:state', (event) => {
        const payload = event.payload as any;
        if (payload?.state) {
            if (payload.state === 'playing') {
                lastTickTimeMs = Date.now();
                playerStatus.reconnectAttempt = null;
            } else if (playerStatus.state === 'playing') {
                recordListeningTick();
                lastTickTimeMs = null;
                void flushStatsToDisk();
            }
            playerStatus.state = payload.state;
            if (payload.state === 'idle') {
                playerStatus.currentStation = null;
                playerStatus.streamTitle = null;
                playerStatus.reconnectAttempt = null;
            } else if (payload.state === 'reconnecting') {
                playerStatus.reconnectAttempt = payload.attempt ?? null;
            }
            syncPlayerStatusToRust();
            emit('ui:state-changed', { ...playerStatus });
        }
    });

    // Listen to tray context menu and global shortcut actions
    listen('squelch:action', async (event: any) => {
        const action = event.payload?.action || event.payload;
        const api = (window as any).squelchApi;
        if (!api) return;

        if (action === 'toggle-play-pause') {
            await api.togglePlayPause();
        } else if (action === 'stop') {
            await api.stopPlayback();
        } else if (action === 'next-station') {
            await api.nextStation();
        } else if (action === 'prev-station') {
            await api.prevStation();
        } else if (action === 'toggle-mute') {
            await api.toggleMute();
        } else if (action === 'volume-up') {
            await api.changeVolume(0.05);
        } else if (action === 'volume-down') {
            await api.changeVolume(-0.05);
        } else if (action === 'toggle-app') {
            await api.toggleTrayPopover();
        }
    });

    // Global Shortcuts Engine (active in background audio worker)
    const isAudioWorker =
        typeof window !== 'undefined' &&
        window.location.pathname.includes('audio.html');

    if (isAudioWorker) {
        let currentShortcutsJson = '';
        const syncGlobalShortcuts = async (shortcuts?: any) => {
            if (
                typeof window === 'undefined' ||
                !(window as any).__TAURI_INTERNALS__
            ) {
                return;
            }
            if (!shortcuts || typeof shortcuts !== 'object') return;
            const newJson = JSON.stringify(shortcuts);
            if (newJson === currentShortcutsJson) return; // Prevent redundant main-thread locking
            currentShortcutsJson = newJson;

            try {
                const { register, unregisterAll } =
                    await import('@tauri-apps/plugin-global-shortcut');
                await unregisterAll();

                const registerItem = async (
                    accel: string | undefined,
                    action: string
                ) => {
                    if (!accel || !accel.trim()) return;
                    try {
                        await register(accel.trim(), (event) => {
                            if (event.state === 'Pressed') {
                                void emit('squelch:action', { action });
                            }
                        });
                    } catch (err) {
                        console.warn(
                            `[GlobalShortcuts] Failed to register "${accel}" for ${action}:`,
                            err
                        );
                    }
                };

                await registerItem(shortcuts.playPause, 'toggle-play-pause');
                await registerItem(shortcuts.nextStation, 'next-station');
                await registerItem(shortcuts.prevStation, 'prev-station');
            } catch (err) {
                console.warn('[GlobalShortcuts] Init failed:', err);
            }
        };

        // Initial setup of global shortcuts
        void invoke('get_settings').then((res: any) => {
            if (res?.shortcuts) {
                void syncGlobalShortcuts(res.shortcuts);
            }
        });

        // Listen for shortcut preference changes
        void listen('squelch:shortcuts:sync', (event: any) => {
            void syncGlobalShortcuts(event.payload);
        });
    }

    // Background Schedule Runner (checks every 20s for reminders and autoplay)
    const triggeredSlots = new Set<string>();
    let lastDateStr = '';
    setInterval(async () => {
        try {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            if (dateStr !== lastDateStr) {
                triggeredSlots.clear();
                lastDateStr = dateStr;
            }
            const currentDay = now.getDay();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const schedules: any[] = await invoke('get_schedules');
            for (const schedule of schedules) {
                if (
                    !schedule.enabled ||
                    !schedule.daysOfWeek?.includes(currentDay)
                ) {
                    continue;
                }
                const [sH, sM] = schedule.startTime
                    .split(':')
                    .map((v: string) => parseInt(v, 10));
                const startTotalMinutes = sH * 60 + (sM || 0);

                // Reminder notification
                const reminderSlot = `${schedule.id}-remind-${startTotalMinutes}`;
                const reminderMinutes = schedule.reminderMinutes ?? 5;
                if (
                    reminderMinutes > 0 &&
                    currentMinutes === startTotalMinutes - reminderMinutes &&
                    !triggeredSlots.has(reminderSlot)
                ) {
                    triggeredSlots.add(reminderSlot);
                    if (
                        'Notification' in window &&
                        Notification.permission === 'granted'
                    ) {
                        new Notification(
                            `Acara Dimulai Dalam ${reminderMinutes} Menit`,
                            {
                                body: `${schedule.showName} akan segera mengudara di radio.`
                            }
                        );
                    }
                }

                // Autoplay / Start notification
                const startSlot = `${schedule.id}-start-${startTotalMinutes}`;
                if (
                    currentMinutes === startTotalMinutes &&
                    !triggeredSlots.has(startSlot)
                ) {
                    triggeredSlots.add(startSlot);
                    if (schedule.autoPlay && schedule.stationId) {
                        void (window as any).squelchApi?.playStation(
                            schedule.stationId
                        );
                    }
                    if (
                        'Notification' in window &&
                        Notification.permission === 'granted'
                    ) {
                        new Notification(
                            `Acara Sedang Berlangsung: ${schedule.showName}`,
                            {
                                body: `Siaran ${schedule.showName} sekarang mengudara.`
                            }
                        );
                    }
                }
            }
        } catch {
            // Ignore background schedule check errors
        }
    }, 20000);

    // Setup squelchAudioBridge for audio.html worker
    if (!(window as any).squelchAudioBridge) {
        (window as any).squelchAudioBridge = {
            onCommand: (callback: (cmd: any) => void) => {
                listen('squelch:audio:command', (event) => {
                    callback(event.payload);
                });
            },
            notifyPlaying: () => {
                playerStatus.state = 'playing';
                playerStatus.reconnectAttempt = null;
                lastTickTimeMs = Date.now();
                void invoke('set_tray_state', { stateName: 'playing' });
                emit('squelch:audio:state', { state: 'playing' });
                syncPlayerStatusToRust();
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyBuffering: () => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    void flushStatsToDisk();
                }
                playerStatus.state = 'buffering';
                lastTickTimeMs = null;
                void invoke('set_tray_state', { stateName: 'buffering' });
                emit('squelch:audio:state', { state: 'buffering' });
                syncPlayerStatusToRust();
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyReconnecting: (attempt: number, maxAttempts: number) => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    void flushStatsToDisk();
                }
                playerStatus.state = 'reconnecting';
                playerStatus.reconnectAttempt = attempt;
                lastTickTimeMs = null;
                void invoke('set_tray_state', { stateName: 'reconnecting' });
                emit('squelch:audio:state', {
                    state: 'reconnecting',
                    attempt,
                    maxAttempts
                });
                syncPlayerStatusToRust();
                emit('ui:state-changed', {
                    ...playerStatus,
                    reconnectAttempt: attempt
                });
            },
            notifyStopped: () => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    lastTickTimeMs = null;
                    void flushStatsToDisk();
                }
                playerStatus.state = 'idle';
                playerStatus.currentStation = null;
                playerStatus.streamTitle = null;
                playerStatus.reconnectAttempt = null;
                void invoke('set_tray_state', { stateName: 'idle' });
                emit('squelch:audio:state', { state: 'idle' });
                syncPlayerStatusToRust();
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyError: (msg: string) => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    void flushStatsToDisk();
                }
                playerStatus.state = 'error';
                playerStatus.reconnectAttempt = null;
                lastTickTimeMs = null;
                void invoke('set_tray_state', { stateName: 'error' });
                emit('squelch:audio:state', { state: 'error', message: msg });
                syncPlayerStatusToRust();
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyDeviceRemoved: () => {
                if (playerStatus.state === 'playing') {
                    const api = (window as any).squelchApi;
                    if (api?.togglePlayPause) {
                        void api.togglePlayPause();
                    }
                }
            },
            notifyMediaAction: (action: string) => {
                const api = (window as any).squelchApi;
                if (!api) return;
                if (action === 'play') {
                    if (
                        playerStatus.state !== 'playing' &&
                        playerStatus.currentStation
                    ) {
                        void api.togglePlayPause();
                    }
                } else if (action === 'pause') {
                    if (playerStatus.state === 'playing') {
                        void api.togglePlayPause();
                    }
                } else if (
                    action === 'nexttrack' ||
                    action === 'previoustrack'
                ) {
                    void invoke('get_stations_data').then((data: any) => {
                        const stations = data?.stations || [];
                        if (stations.length === 0) return;
                        const currentIndex = stations.findIndex(
                            (s: any) => s.id === playerStatus.currentStation?.id
                        );
                        let nextIndex = 0;
                        if (action === 'nexttrack') {
                            nextIndex =
                                currentIndex >= 0
                                    ? (currentIndex + 1) % stations.length
                                    : 0;
                        } else {
                            nextIndex =
                                currentIndex > 0
                                    ? currentIndex - 1
                                    : stations.length - 1;
                        }
                        void api.playStation(stations[nextIndex].id);
                    });
                }
            }
        };
        (window as any).radioAudioBridge = (window as any).squelchAudioBridge;
    }

    // Setup squelchUiBridge for Main and Tray windows
    if (!(window as any).squelchApi) {
        (window as any).squelchApi = {
            getPlayerStatus: async () => {
                try {
                    const remote: any = await invoke('get_player_status');
                    if (remote && typeof remote === 'object') {
                        playerStatus = { ...playerStatus, ...remote };
                        if (typeof remote.volume === 'number') {
                            const raw = remote.volume;
                            const normalized = raw > 1 ? raw / 100 : raw;
                            currentAudioVolume = Math.max(
                                0,
                                Math.min(1, Math.round(normalized * 100) / 100)
                            );
                        }
                        if (typeof remote.isMuted === 'boolean') {
                            isAudioMuted = remote.isMuted;
                        }
                    }
                } catch {
                    // ignore
                }
                return {
                    ...playerStatus,
                    volume: currentAudioVolume,
                    isMuted: isAudioMuted
                };
            },

            playStation: async (stationIdOrObj: string | any) => {
                let station: any = null;
                if (typeof stationIdOrObj === 'string') {
                    const data: any = await invoke('get_stations_data');
                    station = (data?.stations || []).find(
                        (s: any) => s.id === stationIdOrObj
                    );
                } else if (
                    stationIdOrObj &&
                    typeof stationIdOrObj === 'object'
                ) {
                    station = stationIdOrObj;
                }
                if (!station || !station.streamUrl) return false;

                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    void flushStatsToDisk();
                }

                const port: number = await invoke('get_proxy_port');
                const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${encodeURIComponent(station.streamUrl)}`;

                let settingsSnapshot: any = null;
                try {
                    const cfg: any = await invoke('get_settings');
                    settingsSnapshot = cfg?.settings;
                } catch {
                    // ignore
                }

                playerStatus = {
                    ...playerStatus,
                    state: 'buffering',
                    currentStation: station,
                    streamTitle: null
                };

                void invoke('set_tray_state', { stateName: 'buffering' });
                syncPlayerStatusToRust();

                await emit('squelch:audio:command', {
                    type: 'play',
                    url:
                        station.streamType === 'hls' ||
                        station.streamUrl.includes('.m3u8')
                            ? station.streamUrl
                            : proxyUrl,
                    isHls:
                        station.streamType === 'hls' ||
                        station.streamUrl.includes('.m3u8'),
                    stationName: station.name,
                    streamTitle: null,
                    logoUrl: station.logoUrl,
                    bufferLengthSeconds:
                        settingsSnapshot?.bufferLengthSeconds ?? 5,
                    equalizer: settingsSnapshot?.equalizer
                });

                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            togglePlayPause: async () => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    lastTickTimeMs = null;
                    void flushStatsToDisk();
                    playerStatus.state = 'paused';
                    playerStatus.reconnectAttempt = null;
                    void invoke('set_tray_state', { stateName: 'idle' });
                    syncPlayerStatusToRust();
                    await emit('squelch:audio:command', { type: 'pause' });
                } else if (
                    playerStatus.state === 'buffering' ||
                    playerStatus.state === 'reconnecting'
                ) {
                    playerStatus.state = 'paused';
                    playerStatus.reconnectAttempt = null;
                    void invoke('set_tray_state', { stateName: 'idle' });
                    syncPlayerStatusToRust();
                    await emit('squelch:audio:command', { type: 'pause' });
                } else if (playerStatus.currentStation) {
                    playerStatus.state = 'buffering';
                    playerStatus.reconnectAttempt = null;
                    void invoke('set_tray_state', { stateName: 'buffering' });
                    syncPlayerStatusToRust();
                    await (window as any).squelchApi.playStation(
                        playerStatus.currentStation.id
                    );
                } else {
                    try {
                        const data: any = await invoke('get_stations_data');
                        const stations = data?.stations || [];
                        if (stations.length > 0) {
                            await (window as any).squelchApi.playStation(
                                stations[0].id
                            );
                        }
                    } catch {
                        // ignore
                    }
                }
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            stopPlayback: async () => {
                if (playerStatus.state === 'playing') {
                    recordListeningTick();
                    lastTickTimeMs = null;
                    void flushStatsToDisk();
                }
                playerStatus.state = 'idle';
                playerStatus.currentStation = null;
                playerStatus.streamTitle = null;
                playerStatus.reconnectAttempt = null;
                void invoke('set_tray_state', { stateName: 'idle' });
                syncPlayerStatusToRust();
                await emit('squelch:audio:command', { type: 'stop' });
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            nextStation: async () => {
                try {
                    const data: any = await invoke('get_stations_data');
                    const stations = data?.stations || [];
                    if (stations.length === 0) return false;
                    const currentIndex = stations.findIndex(
                        (s: any) => s.id === playerStatus.currentStation?.id
                    );
                    const nextIndex =
                        currentIndex >= 0
                            ? (currentIndex + 1) % stations.length
                            : 0;
                    return await (window as any).squelchApi.playStation(
                        stations[nextIndex].id
                    );
                } catch {
                    return false;
                }
            },

            prevStation: async () => {
                try {
                    const data: any = await invoke('get_stations_data');
                    const stations = data?.stations || [];
                    if (stations.length === 0) return false;
                    const currentIndex = stations.findIndex(
                        (s: any) => s.id === playerStatus.currentStation?.id
                    );
                    const prevIndex =
                        currentIndex > 0
                            ? currentIndex - 1
                            : stations.length - 1;
                    return await (window as any).squelchApi.playStation(
                        stations[prevIndex].id
                    );
                } catch {
                    return false;
                }
            },

            toggleMute: async () => {
                isAudioMuted = !isAudioMuted;
                syncPlayerStatusToRust();
                await emit('squelch:audio:volume', {
                    volume: currentAudioVolume,
                    muted: isAudioMuted
                });
                await emit('ui:state-changed', {
                    ...playerStatus,
                    isMuted: isAudioMuted,
                    volume: currentAudioVolume
                });
                return isAudioMuted;
            },

            changeVolume: async (delta: number) => {
                currentAudioVolume = Math.max(
                    0,
                    Math.min(
                        1,
                        Math.round((currentAudioVolume + delta) * 100) / 100
                    )
                );
                isAudioMuted = false;
                syncPlayerStatusToRust();
                await emit('squelch:audio:volume', {
                    volume: currentAudioVolume,
                    muted: false
                });
                await emit('ui:state-changed', {
                    ...playerStatus,
                    volume: currentAudioVolume,
                    isMuted: false
                });
                return currentAudioVolume;
            },

            setVolume: async (vol: number) => {
                const raw = typeof vol === 'number' && !isNaN(vol) ? vol : 1.0;
                const normalized = raw > 1 ? raw / 100 : raw;
                currentAudioVolume = Math.max(
                    0,
                    Math.min(1, Math.round(normalized * 100) / 100)
                );
                isAudioMuted = false;
                syncPlayerStatusToRust();
                await emit('squelch:audio:volume', {
                    volume: currentAudioVolume,
                    muted: false
                });
                await emit('ui:state-changed', {
                    ...playerStatus,
                    volume: currentAudioVolume,
                    isMuted: false
                });
                return currentAudioVolume;
            },

            sendNotification: async (
                title: string,
                body: string
            ): Promise<boolean> => {
                try {
                    await invoke('send_notification', { title, body });
                    return true;
                } catch {
                    return false;
                }
            },

            requestQuitConfirm: async () => {
                try {
                    window.dispatchEvent(
                        new CustomEvent('squelch:confirm-quit')
                    );
                    await emit('squelch:confirm-quit');
                } catch {
                    // ignore
                }
            },

            setSleepTimer: async (minutes: number | null) => {
                return await handleSetSleepTimer(
                    minutes,
                    playerStatus,
                    syncPlayerStatusToRust,
                    () => (window as any).squelchApi.stopPlayback(),
                    (title, body) =>
                        (window as any).squelchApi.sendNotification(
                            title,
                            body
                        )
                );
            },

            startDragging: async () => {
                try {
                    const { getCurrentWindow } = await import(
                        '@tauri-apps/api/window'
                    );
                    await getCurrentWindow().startDragging();
                } catch {
                    await invoke('start_window_drag');
                }
            },

            openWindowTab: async (tab: string) => {
                await invoke('open_window_tab', { tab });
            },

            toggleTrayPopover: async () => {
                await invoke('toggle_tray_popover');
            },

            quitApp: async () => {
                recordListeningTick();
                await flushStatsToDisk();
                await invoke('quit_app');
            },

            checkForUpdates: async () => {
                return await invoke('check_for_updates');
            },

            startDownloadUpdate: async (url: string, filename?: string) => {
                await invoke('start_download_update', { url, filename });
            },

            cancelDownloadUpdate: async () => {
                await invoke('cancel_update_download');
            },

            openUpdateInstaller: async (filePath: string) => {
                await invoke('open_update_installer', { filePath });
            },

            revealUpdateInFinder: async (filePath: string) => {
                await invoke('reveal_update_in_finder', { filePath });
            },

            onUpdateDownloadProgress: (cb: (progress: any) => void) => {
                let unlisten: (() => void) | null = null;
                listen('squelch:update-download-progress', (event) => {
                    cb(event.payload);
                }).then((u) => {
                    unlisten = u;
                });
                return () => {
                    if (unlisten) unlisten();
                };
            },

            getAppIconDataUrl: async () => null,

            openAboutWindow: async () => {
                window.dispatchEvent(new CustomEvent('squelch:open-about'));
                await invoke('open_about_window');
            },

            openUpdateModal: async () => {
                window.dispatchEvent(new CustomEvent('squelch:check-updates'));
                await invoke('open_window_tab', { tab: 'updates' });
            },

            openExternalUrl: async (url: string) => {
                await invoke('open_external', { url });
            },

            getStationsData: async () => {
                return await invoke('get_stations_data');
            },

            resolveStationLogo: async (url: string) => url,

            saveStation: async (station: any) => {
                if (!station.id) {
                    station.id = `station-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                }
                await invoke('save_station', { station });
                await emit('ui:state-changed', { type: 'stations' });
                return station;
            },

            deleteStation: async (stationId: string) => {
                await invoke('delete_station', { id: stationId });
                await emit('ui:state-changed', { type: 'stations' });
            },

            toggleFavorite: async (stationId: string) => {
                const data: any = await invoke('get_stations_data');
                const station = (data?.stations || []).find(
                    (s: any) => s.id === stationId
                );
                if (station) {
                    station.isFavorite = !station.isFavorite;
                    await invoke('save_station', { station });
                    await emit('ui:state-changed', { type: 'stations' });
                }
            },

            reorderStations: async (orderedIds: string[]) => {
                await invoke('reorder_stations', { orderedIds });
                await emit('ui:state-changed', { type: 'stations' });
            },

            saveGroups: async (groups: string[]) => {
                await invoke('save_groups', { groups });
                await emit('ui:state-changed', { type: 'stations' });
            },

            renameGroup: async (oldName: string, newName: string) => {
                const res = await invoke('rename_group', { oldName, newName });
                await emit('ui:state-changed', { type: 'stations' });
                return res;
            },

            deleteGroup: async (
                groupName: string,
                moveToGroup = ''
            ) => {
                const res = await invoke('delete_group', {
                    groupName,
                    moveToGroup
                });
                await emit('ui:state-changed', { type: 'stations' });
                return res;
            },

            testStreamUrl: async (url: string) => {
                return await invoke('test_stream_url', { url });
            },

            runHealthCheck: async (onProgress?: (progress: {
                total: number;
                completed: number;
                currentStation?: string;
                onlineCount: number;
                offlineCount: number;
            }) => void) => {
                const data: any = await invoke('get_stations_data');
                const stations: any[] = data?.stations || [];
                const total = stations.length;
                let completed = 0;
                let onlineCount = 0;
                let offlineCount = 0;

                onProgress?.({
                    total,
                    completed: 0,
                    currentStation: stations[0]?.name,
                    onlineCount: 0,
                    offlineCount: 0
                });

                if (total === 0) {
                    return { results: [], stations: [] };
                }

                const results: any[] = await Promise.all(
                    stations.map(async (st) => {
                        const testRes: any = await invoke('test_stream_url', {
                            url: st.streamUrl
                        });
                        const isOnline = Boolean(testRes?.ok);
                        st.status = isOnline ? 'online' : 'offline';
                        completed++;
                        if (isOnline) {
                            onlineCount++;
                        } else {
                            offlineCount++;
                        }
                        onProgress?.({
                            total,
                            completed,
                            currentStation: st.name,
                            onlineCount,
                            offlineCount
                        });
                        return {
                            stationId: st.id,
                            name: st.name,
                            online: isOnline,
                            latencyMs: testRes?.latencyMs ?? 0,
                            bitrate: testRes?.bitrate,
                            error: testRes?.errorReason
                        };
                    })
                );
                for (const st of stations) {
                    await invoke('save_station', { station: st });
                }
                await emit('ui:state-changed', { type: 'stations' });
                return { results, stations };
            },

            removeOfflineStations: async () => {
                const data: any = await invoke('get_stations_data');
                const stations: any[] = data?.stations || [];
                const offline = stations.filter((s) => s.status === 'offline');
                for (const st of offline) {
                    await invoke('delete_station', { id: st.id });
                }
                await emit('ui:state-changed', { type: 'stations' });
                return { removedCount: offline.length };
            },

            exportStations: async (format: 'json' | 'm3u' | 'pls') => {
                return await exportStationsData(format);
            },

            importStations: async (payload: {
                content: string;
                format: 'json' | 'm3u' | 'pls';
                duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
            }) => {
                const res = await importStationsData(payload);
                await emit('ui:state-changed', { type: 'stations' });
                return res;
            },

            getOnlineCountries: async () => {
                return await fetchOnlineCountries();
            },

            searchOnlineStations: async (query: any) => {
                return await searchOnlineStations(query);
            },

            getSettings: async () => {
                return await invoke('get_settings');
            },

            updateSettings: async (partial: any) => {
                const res: any = await invoke('update_settings', { partial });
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
                    if (partial?.hideFromDock !== undefined) {
                        void invoke('set_dock_visibility', {
                            visible: !partial.hideFromDock
                        });
                    }
                    if (partial?.equalizer !== undefined) {
                        void emit('squelch:audio:eq', res.settings.equalizer);
                    }
                    if (partial?.bufferLengthSeconds !== undefined) {
                        void emit('squelch:audio:buffer', {
                            bufferLengthSeconds:
                                res.settings.bufferLengthSeconds
                        });
                    }
                    if (partial?.shortcuts !== undefined) {
                        void emit(
                            'squelch:shortcuts:sync',
                            res.settings.shortcuts
                        );
                    }
                    if (partial?.audioOutputDeviceId !== undefined) {
                        void emit('squelch:audio:sink', {
                            deviceId: res.settings.audioOutputDeviceId
                        });
                    }
                }
                await emit('ui:state-changed', { type: 'settings', ...res });
                return res?.settings;
            },

            resetSettings: async () => {
                return await (window as any).squelchApi.resetAllData();
            },

            getAudioOutputDevices: async () => {
                try {
                    const devices: any = await invoke('get_audio_output_devices');
                    if (Array.isArray(devices) && devices.length > 0) {
                        return devices;
                    }
                } catch {
                    // ignore
                }
                return [
                    {
                        id: 'default',
                        name: 'Bawaan Sistem (macOS Default)',
                        transport: 'system',
                        isDefault: true
                    }
                ];
            },

            setAudioOutputDevice: async (
                deviceId: string,
                deviceName?: string
            ) => {
                await emit('squelch:audio:sink', { deviceId, deviceName });
                await (window as any).squelchApi.updateSettings({
                    audioOutputDeviceId: deviceId
                });
                return true;
            },

            clearStationsData: async () => {
                await invoke('clear_stations_data');
                await emit('ui:state-changed', { type: 'stations' });
            },

            clearSchedulesData: async () => {
                await invoke('clear_schedules_data');
                await emit('ui:state-changed', { type: 'schedules' });
            },

            clearListeningStats: async () => {
                statsData = {
                    schemaVersion: 1,
                    dailySeconds: {},
                    hourlySeconds: {},
                    monthlySeconds: {},
                    stationSeconds: {},
                    stationNames: {},
                    stationLogos: {},
                    totalSeconds: 0
                };
                statsDirty = false;
                await invoke('clear_listening_stats');
                await emit('ui:state-changed', { type: 'stats' });
            },

            resetAllData: async () => {
                if (playerStatus.state !== 'idle') {
                    playerStatus.state = 'idle';
                    playerStatus.currentStation = null;
                    playerStatus.streamTitle = null;
                    playerStatus.reconnectAttempt = null;
                    void invoke('set_tray_state', { stateName: 'idle' });
                    syncPlayerStatusToRust();
                    void emit('squelch:audio:command', { type: 'stop' });
                    void emit('ui:state-changed', { ...playerStatus });
                }
                statsData = {
                    schemaVersion: 1,
                    dailySeconds: {},
                    hourlySeconds: {},
                    monthlySeconds: {},
                    stationSeconds: {},
                    stationNames: {},
                    stationLogos: {},
                    totalSeconds: 0
                };
                statsDirty = false;
                const res: any = await invoke('reset_all_data');
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
                    void emit('squelch:audio:eq', res.settings.equalizer);
                    void emit('squelch:audio:buffer', {
                        bufferLengthSeconds: res.settings.bufferLengthSeconds
                    });
                    void emit('squelch:shortcuts:sync', res.settings.shortcuts);
                    void emit('squelch:audio:sink', {
                        deviceId: 'default'
                    });
                }
                await emit('ui:state-changed', { type: 'all', ...res });
                return res?.settings;
            },

            getSystemFonts: async () => {
                return await invoke('get_system_fonts');
            },

            backupAppData: async () => {
                return await backupAppDataBundle();
            },

            restoreAppData: async () => {
                return await restoreAppDataBundle();
            },

            getListeningStats: async () => {
                await ensureStatsLoaded();
                recordListeningTick();
                void flushStatsToDisk();
                return buildListeningStatsSummary(statsData);
            },

            getDiagnostics: async () => {
                const stats: any = await invoke('get_listening_stats');
                const stData: any = await invoke('get_stations_data');
                const cfg: any = await invoke('get_settings');
                const report = {
                    timestamp: new Date().toISOString(),
                    app: 'Squelch v0.1.3 (Tauri v2 macOS)',
                    platform: 'darwin (macOS)',
                    userAgent: navigator.userAgent,
                    player: {
                        state: playerStatus.state,
                        currentStation:
                            playerStatus.currentStation?.name || null,
                        streamUrl:
                            playerStatus.currentStation?.streamUrl || null,
                        streamTitle: playerStatus.streamTitle || null
                    },
                    stationCount: stData?.stations?.length || 0,
                    groupCount: stData?.groups?.length || 0,
                    settings: {
                        theme: cfg?.settings?.theme,
                        language: cfg?.settings?.language,
                        accentColor: cfg?.settings?.accentColor,
                        fontFamily: cfg?.settings?.fontFamily,
                        glassOpacity: cfg?.settings?.glassOpacity,
                        launchAtLogin: cfg?.settings?.launchAtLogin,
                        autoPlayLastStation: cfg?.settings?.autoPlayLastStation
                    },
                    listeningStats: {
                        totalSeconds: stats?.totalSeconds || 0,
                        stationCounts: stats?.stationCounts || {}
                    },
                    dataDir:
                        cfg?.dataDir ||
                        '~/Library/Application Support/com.mrbvrz.squelch',
                    recentLogs: [
                        `[${new Date().toISOString()}] Audio Bridge: WebKit Media Engine Active`,
                        `[${new Date().toISOString()}] Player state: ${playerStatus.state}`,
                        `[${new Date().toISOString()}] Storage: Local JSON Stores Mounted`
                    ]
                };
                return JSON.stringify(report, null, 2);
            },

            openLogsFolder: async () => {
                const cfg: any = await invoke('get_settings');
                if (cfg?.dataDir) {
                    await invoke('open_external', { url: cfg.dataDir });
                }
            },

            getSchedules: async () => {
                return await invoke('get_schedules');
            },

            saveSchedule: async (schedule: any) => {
                await invoke('save_schedule', { schedule });
                await emit('ui:state-changed', { type: 'schedules' });
            },

            deleteSchedule: async (id: string) => {
                await invoke('delete_schedule', { id });
                await emit('ui:state-changed', { type: 'schedules' });
            },

            toggleSchedule: async (id: string) => {
                const list: any[] = await invoke('get_schedules');
                const sched = list.find((s) => s.id === id);
                if (sched) {
                    sched.enabled = !sched.enabled;
                    await invoke('save_schedule', { schedule: sched });
                    await emit('ui:state-changed', { type: 'schedules' });
                }
            },

            toggleScheduleAutoPlay: async (id: string) => {
                const list: any[] = await invoke('get_schedules');
                const sched = list.find((s) => s.id === id);
                if (sched) {
                    sched.autoPlay = !sched.autoPlay;
                    await invoke('save_schedule', { schedule: sched });
                    await emit('ui:state-changed', { type: 'schedules' });
                }
            },

            onStateChanged: (cb: (data: unknown) => void) => {
                let unlisten: (() => void) | null = null;
                listen('ui:state-changed', (event) => {
                    cb(event.payload);
                }).then((u) => {
                    unlisten = u;
                });
                return () => {
                    if (unlisten) unlisten();
                };
            }
        };
    }
}
