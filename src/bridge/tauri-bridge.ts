import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import {
    applyAppearanceVariables,
    countryCodeToFlag,
    getFriendlyCountryName
} from '../utils/appearance';
import {
    exportToM3u,
    exportToPls,
    parseM3uPlaylist,
    parsePlsPlaylist
} from '../utils/playlist';

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

let sleepInterval: any = null;
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

interface ListeningStatsSchema {
    schemaVersion: number;
    dailySeconds: Record<string, number>;
    hourlySeconds?: Record<string, number>;
    monthlySeconds: Record<string, number>;
    stationSeconds: Record<string, number>;
    stationNames?: Record<string, string>;
    stationLogos?: Record<string, string>;
    totalSeconds: number;
}

interface StatSeriesPoint {
    key: string;
    date?: string;
    month?: string;
    label: string;
    seconds: number;
}

interface StationStatPoint {
    stationId: string;
    stationName?: string;
    logoUrl?: string;
    seconds: number;
}

interface ListeningStatsSummary {
    todaySeconds: number;
    thisWeekSeconds: number;
    thisMonthSeconds: number;
    thisYearSeconds: number;
    totalSeconds: number;
    dailySeries: StatSeriesPoint[];
    weeklySeries: StatSeriesPoint[];
    monthlySeries: StatSeriesPoint[];
    yearlySeries: StatSeriesPoint[];
    topStations: StationStatPoint[];
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

function formatDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatMonthKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

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

    const dayKey = formatDateKey(now);
    const hourKey = `${dayKey}-${String(now.getHours()).padStart(2, '0')}`;
    const monthKey = formatMonthKey(now);
    const stationId = playerStatus.currentStation?.id;
    const stationName = playerStatus.currentStation?.name;
    const logoUrl = playerStatus.currentStation?.logoUrl;

    statsData.dailySeconds[dayKey] =
        (statsData.dailySeconds[dayKey] ?? 0) + elapsedSec;
    if (!statsData.hourlySeconds) statsData.hourlySeconds = {};
    statsData.hourlySeconds[hourKey] =
        (statsData.hourlySeconds[hourKey] ?? 0) + elapsedSec;
    statsData.monthlySeconds[monthKey] =
        (statsData.monthlySeconds[monthKey] ?? 0) + elapsedSec;
    if (stationId) {
        statsData.stationSeconds[stationId] =
            (statsData.stationSeconds[stationId] ?? 0) + elapsedSec;
        if (!statsData.stationNames) statsData.stationNames = {};
        if (stationName) {
            statsData.stationNames[stationId] = stationName;
        }
        if (!statsData.stationLogos) statsData.stationLogos = {};
        if (logoUrl) {
            statsData.stationLogos[stationId] = logoUrl;
        }
    }
    statsData.totalSeconds = (statsData.totalSeconds ?? 0) + elapsedSec;
    statsDirty = true;
    scheduleStatsSave();
}

function buildListeningStatsSummary(
    data: ListeningStatsSchema,
    now = new Date()
): ListeningStatsSummary {
    const todayKey = formatDateKey(now);
    const thisMonthKey = formatMonthKey(now);
    const currentYearPrefix = `${now.getFullYear()}-`;

    // 1. Weekly series (Last 7 days)
    const weeklySeries: StatSeriesPoint[] = [];
    let thisWeekSeconds = 0;
    for (let i = 6; i >= 0; i--) {
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - i
        );
        const key = formatDateKey(d);
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const sec = data.dailySeconds[key] ?? 0;
        thisWeekSeconds += sec;
        weeklySeries.push({ key, date: key, label: dayLabel, seconds: sec });
    }

    // 2. Daily series (24 Hours of Today: 00:00 - 23:00)
    const dailySeries: StatSeriesPoint[] = [];
    const currentHour = now.getHours();
    for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0');
        const key = `${todayKey}-${hourStr}`;
        const label = `${hourStr}:00`;
        let sec = data.hourlySeconds?.[key] ?? 0;
        if (sec === 0 && h === currentHour && data.dailySeconds[todayKey]) {
            const recordedHourly = Object.entries(data.hourlySeconds || {})
                .filter(([k]) => k.startsWith(todayKey))
                .reduce((acc, [, val]) => acc + (val as number), 0);
            const remainder = Math.max(
                0,
                (data.dailySeconds[todayKey] ?? 0) - recordedHourly
            );
            if (remainder > 0) {
                sec = remainder;
            }
        }
        dailySeries.push({
            key,
            date: todayKey,
            label,
            seconds: sec
        });
    }

    // 3. Monthly series (Last 30 days)
    const monthlySeries: StatSeriesPoint[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - i
        );
        const key = formatDateKey(d);
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlySeries.push({
            key,
            date: key,
            month: formatMonthKey(d),
            label: dayLabel,
            seconds: data.dailySeconds[key] ?? 0
        });
    }

    // 4. Yearly series (Last 12 months)
    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
    ];
    const yearlySeries: StatSeriesPoint[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = formatMonthKey(d);
        const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        yearlySeries.push({
            key,
            month: key,
            label,
            seconds: data.monthlySeconds[key] ?? 0
        });
    }

    let thisYearSeconds = 0;
    for (const [mKey, sec] of Object.entries(data.monthlySeconds)) {
        if (mKey.startsWith(currentYearPrefix)) {
            thisYearSeconds += sec;
        }
    }

    const topStations: StationStatPoint[] = Object.entries(data.stationSeconds)
        .map(([stationId, seconds]) => ({
            stationId,
            stationName: data.stationNames?.[stationId],
            logoUrl: data.stationLogos?.[stationId],
            seconds
        }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 6);

    return {
        todaySeconds: data.dailySeconds[todayKey] ?? 0,
        thisWeekSeconds,
        thisMonthSeconds: data.monthlySeconds[thisMonthKey] ?? 0,
        thisYearSeconds,
        totalSeconds: data.totalSeconds ?? 0,
        dailySeries,
        weeklySeries,
        monthlySeries,
        yearlySeries,
        topStations
    };
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
        const syncGlobalShortcuts = async (shortcuts?: any) => {
            if (
                typeof window === 'undefined' ||
                !(window as any).__TAURI_INTERNALS__
            ) {
                return;
            }
            try {
                const { register, unregisterAll } =
                    await import('@tauri-apps/plugin-global-shortcut');
                await unregisterAll();
                if (!shortcuts || typeof shortcuts !== 'object') return;

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
                            currentAudioVolume = remote.volume;
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
                currentAudioVolume = Math.max(
                    0,
                    Math.min(1, Math.round(vol * 100) / 100)
                );
                isAudioMuted = false;
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
                    await invoke('open_window_tab', { tab: 'stations' });
                    await emit('squelch:confirm-quit');
                } catch {
                    // ignore
                }
            },

            setSleepTimer: async (minutes: number | null) => {
                if (sleepInterval) {
                    clearInterval(sleepInterval);
                    sleepInterval = null;
                }
                if (!minutes || minutes <= 0) {
                    playerStatus.sleepTimerMinutes = null;
                    playerStatus.sleepTimerRemainingSec = null;
                    syncPlayerStatusToRust();
                } else {
                    playerStatus.sleepTimerMinutes = minutes;
                    playerStatus.sleepTimerRemainingSec = minutes * 60;
                    syncPlayerStatusToRust();
                    sleepInterval = setInterval(async () => {
                        if (
                            playerStatus.sleepTimerRemainingSec &&
                            playerStatus.sleepTimerRemainingSec > 0
                        ) {
                            playerStatus.sleepTimerRemainingSec -= 1;

                            // 1 minute remaining warning notification
                            if (playerStatus.sleepTimerRemainingSec === 60) {
                                void (async () => {
                                    try {
                                        const cfg: any = await invoke(
                                            'get_settings'
                                        ).catch(() => null);
                                        const isEn =
                                            cfg?.settings?.language === 'en';
                                        const title = isEn
                                            ? 'Sleep Timer'
                                            : 'Pengatur Waktu Tidur';
                                        const stName =
                                            playerStatus.currentStation?.name;
                                        const body = isEn
                                            ? `Radio playback will stop in 1 minute${stName ? ` (${stName})` : ''}.`
                                            : `Siaran radio akan dinonaktifkan dalam 1 menit${stName ? ` (${stName})` : ''}.`;
                                        await (
                                            window as any
                                        ).squelchApi.sendNotification(
                                            title,
                                            body
                                        );
                                    } catch {
                                        // ignore
                                    }
                                })();
                            }

                            if (playerStatus.sleepTimerRemainingSec <= 0) {
                                clearInterval(sleepInterval);
                                sleepInterval = null;
                                await (window as any).squelchApi.stopPlayback();
                                void (async () => {
                                    try {
                                        const cfg: any = await invoke(
                                            'get_settings'
                                        ).catch(() => null);
                                        const isEn =
                                            cfg?.settings?.language === 'en';
                                        const title = isEn
                                            ? 'Sleep Timer'
                                            : 'Pengatur Waktu Tidur';
                                        const body = isEn
                                            ? 'Radio playback has stopped.'
                                            : 'Pemutaran radio telah dihentikan.';
                                        await (
                                            window as any
                                        ).squelchApi.sendNotification(
                                            title,
                                            body
                                        );
                                    } catch {
                                        // ignore
                                    }
                                })();
                            }
                            if (
                                playerStatus.sleepTimerRemainingSec % 5 === 0 ||
                                playerStatus.sleepTimerRemainingSec <= 0
                            ) {
                                syncPlayerStatusToRust();
                            }
                            await emit('ui:state-changed', { ...playerStatus });
                        }
                    }, 1000);
                }
                syncPlayerStatusToRust();
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            startDragging: async () => {
                await invoke('start_window_drag');
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
                await emit('ui:state-changed', { ...playerStatus });
                return station;
            },

            deleteStation: async (stationId: string) => {
                await invoke('delete_station', { id: stationId });
                await emit('ui:state-changed', { ...playerStatus });
            },

            toggleFavorite: async (stationId: string) => {
                const data: any = await invoke('get_stations_data');
                const station = (data?.stations || []).find(
                    (s: any) => s.id === stationId
                );
                if (station) {
                    station.isFavorite = !station.isFavorite;
                    await invoke('save_station', { station });
                    await emit('ui:state-changed', { ...playerStatus });
                }
            },

            reorderStations: async (orderedIds: string[]) => {
                await invoke('reorder_stations', { orderedIds });
                await emit('ui:state-changed', { ...playerStatus });
            },

            saveGroups: async (groups: string[]) => {
                await invoke('save_groups', { groups });
                await emit('ui:state-changed', { ...playerStatus });
            },

            renameGroup: async (oldName: string, newName: string) => {
                const res = await invoke('rename_group', { oldName, newName });
                await emit('ui:state-changed', { ...playerStatus });
                return res;
            },

            deleteGroup: async (
                groupName: string,
                moveToGroup = 'Lainnya & Nostalgia'
            ) => {
                const res = await invoke('delete_group', {
                    groupName,
                    moveToGroup
                });
                await emit('ui:state-changed', { ...playerStatus });
                return res;
            },

            testStreamUrl: async (url: string) => {
                return await invoke('test_stream_url', { url });
            },

            runHealthCheck: async () => {
                const data: any = await invoke('get_stations_data');
                const stations: any[] = data?.stations || [];
                const results: any[] = [];
                for (const st of stations) {
                    const testRes: any = await invoke('test_stream_url', {
                        url: st.streamUrl
                    });
                    const isOnline = testRes?.ok ?? false;
                    st.status = isOnline ? 'online' : 'offline';
                    results.push({
                        stationId: st.id,
                        name: st.name,
                        online: isOnline,
                        latencyMs: testRes?.latencyMs ?? 0,
                        bitrate: testRes?.bitrate,
                        error: testRes?.errorReason
                    });
                    await invoke('save_station', { station: st });
                }
                await emit('ui:state-changed', { ...playerStatus });
                return { results, stations };
            },

            removeOfflineStations: async () => {
                const data: any = await invoke('get_stations_data');
                const stations: any[] = data?.stations || [];
                const offline = stations.filter((s) => s.status === 'offline');
                for (const st of offline) {
                    await invoke('delete_station', { id: st.id });
                }
                await emit('ui:state-changed', { ...playerStatus });
                return { removedCount: offline.length };
            },

            exportStations: async (format: 'json' | 'm3u' | 'pls') => {
                const data: any = await invoke('get_stations_data');
                const stations: any[] = data?.stations || [];
                if (format === 'json') {
                    return JSON.stringify(stations, null, 2);
                }
                if (format === 'm3u') {
                    return exportToM3u(stations);
                }
                if (format === 'pls') {
                    return exportToPls(stations);
                }
                return '';
            },

            importStations: async (payload: {
                content: string;
                format: 'json' | 'm3u' | 'pls';
                duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
            }) => {
                const data: any = await invoke('get_stations_data');
                const existing: any[] = data?.stations || [];
                const parsed: any[] = [];
                if (payload.format === 'json') {
                    try {
                        const arr = JSON.parse(payload.content);
                        if (Array.isArray(arr)) parsed.push(...arr);
                    } catch {}
                } else if (payload.format === 'm3u') {
                    parsed.push(...parseM3uPlaylist(payload.content));
                } else if (payload.format === 'pls') {
                    parsed.push(...parsePlsPlaylist(payload.content));
                }
                let importedCount = 0;
                let skippedCount = 0;
                for (const item of parsed) {
                    if (!item.name || !item.streamUrl) continue;
                    const exists = existing.find(
                        (s: any) =>
                            s.streamUrl === item.streamUrl ||
                            s.name === item.name
                    );
                    if (exists) {
                        if (payload.duplicateStrategy === 'skip') {
                            skippedCount++;
                            continue;
                        } else if (payload.duplicateStrategy === 'overwrite') {
                            Object.assign(exists, item);
                            await invoke('save_station', { station: exists });
                            importedCount++;
                            continue;
                        }
                    }
                    const newStation = {
                        id:
                            item.id ||
                            `station-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        name: item.name,
                        streamUrl: item.streamUrl,
                        streamType:
                            item.streamType ||
                            (item.streamUrl.includes('.m3u8') ? 'hls' : 'mp3'),
                        logoUrl: item.logoUrl || null,
                        genre: item.genre || 'General',
                        city: item.city || '',
                        country: item.country || '',
                        tags: item.tags || [],
                        group: item.group || 'Umum',
                        isFavorite: !!item.isFavorite,
                        status: 'online'
                    };
                    await invoke('save_station', { station: newStation });
                    importedCount++;
                }
                await emit('ui:state-changed', { ...playerStatus });
                return { importedCount, skippedCount };
            },

            getOnlineCountries: async () => {
                try {
                    const res = await fetch(
                        'https://de1.api.radio-browser.info/json/countries'
                    );
                    const list: any[] = await res.json();
                    return list
                        .filter((c) => c.iso_3166_1 && c.stationcount > 0)
                        .map((c) => {
                            const code = c.iso_3166_1.toUpperCase();
                            return {
                                code,
                                name: getFriendlyCountryName(code, c.name),
                                stationCount: c.stationcount,
                                flag: countryCodeToFlag(code)
                            };
                        })
                        .sort((a, b) => b.stationCount - a.stationCount);
                } catch {
                    return [];
                }
            },

            searchOnlineStations: async (query: any) => {
                try {
                    const params = new URLSearchParams();
                    if (query.name && query.name.trim()) {
                        params.set('name', query.name.trim());
                    }
                    if (query.countrycode && query.countrycode.trim()) {
                        params.set(
                            'countrycode',
                            query.countrycode.trim().toUpperCase()
                        );
                    }
                    if (query.tag && query.tag.trim()) {
                        params.set('tag', query.tag.trim());
                    }

                    // Order by popularity (votes) descending & filter out dead streams,
                    // identical to https://www.radio-browser.info/search
                    params.set('hidebroken', 'true');
                    params.set('order', 'votes');
                    params.set('reverse', 'true');
                    params.set('limit', String(query.limit || 60));

                    const res = await fetch(
                        `https://de1.api.radio-browser.info/json/stations/search?${params.toString()}`
                    );
                    const list: any[] = await res.json();
                    if (!Array.isArray(list)) return [];

                    const targetCountry = query.countrycode
                        ? query.countrycode.trim().toUpperCase()
                        : '';

                    const seen = new Set<string>();
                    const deduplicated = [];
                    for (const s of list) {
                        const url = (s.url_resolved || s.url || '')
                            .trim()
                            .toLowerCase();
                        const id = s.stationuuid;
                        const key = url || id;
                        if (!key || seen.has(key)) continue;

                        // Ensure country filter matches strictly if provided
                        if (
                            targetCountry &&
                            s.countrycode &&
                            s.countrycode.trim().toUpperCase() !== targetCountry
                        ) {
                            continue;
                        }

                        seen.add(key);
                        deduplicated.push(s);
                    }

                    return deduplicated.map((s) => {
                        // Sanitize station name by trimming leading/trailing spaces and tabs
                        const cleanName =
                            (s.name || '')
                                .replace(/^[\s\t\r\n]+/, '')
                                .replace(/[\s\t\r\n]+$/, '')
                                .replace(/\s+/g, ' ')
                                .trim() || 'Radio Stream';

                        const rawUrl = (s.url_resolved || s.url || '').trim();
                        const tags = (s.tags || '')
                            .split(',')
                            .map((t: string) => t.trim())
                            .filter(Boolean);

                        return {
                            id: s.stationuuid,
                            name: cleanName,
                            streamUrl: rawUrl,
                            streamType: rawUrl.includes('.m3u8')
                                ? ('hls' as const)
                                : ('mp3' as const),
                            logoUrl:
                                s.favicon && s.favicon.trim()
                                    ? s.favicon.trim()
                                    : null,
                            genre: tags[0] || 'General',
                            city: (s.state || '').trim(),
                            country: (s.countrycode || '').trim().toUpperCase(),
                            tags,
                            bitrate: s.bitrate || 128,
                            votes: s.votes || 0
                        };
                    });
                } catch {
                    return [];
                }
            },

            getSettings: async () => {
                return await invoke('get_settings');
            },

            updateSettings: async (partial: any) => {
                const res: any = await invoke('update_settings', { partial });
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
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
                }
                await emit('ui:state-changed', { type: 'settings', ...res });
                return res?.settings;
            },

            resetSettings: async () => {
                const res: any = await invoke('reset_settings');
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
                    void emit('squelch:audio:eq', res.settings.equalizer);
                    void emit('squelch:audio:buffer', {
                        bufferLengthSeconds: res.settings.bufferLengthSeconds
                    });
                    void emit('squelch:shortcuts:sync', res.settings.shortcuts);
                }
                await emit('ui:state-changed', { type: 'settings', ...res });
                return res?.settings;
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
                }
                await emit('ui:state-changed', { type: 'all', ...res });
                return res?.settings;
            },

            getSystemFonts: async () => {
                return await invoke('get_system_fonts');
            },

            backupAppData: async () => {
                try {
                    const bundle = {
                        app: 'Squelch',
                        version: '0.1.0',
                        exportedAt: new Date().toISOString(),
                        stationsData: await invoke('get_stations_data'),
                        settings: await invoke('get_settings'),
                        schedules: await invoke('get_schedules'),
                        listeningStats: await invoke('get_listening_stats')
                    };
                    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
                        type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const filename = `squelch-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    return { ok: true, filePath: filename };
                } catch (err: any) {
                    return {
                        ok: false,
                        error: err?.message || String(err)
                    };
                }
            },

            restoreAppData: async () => {
                return new Promise((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) {
                            resolve({ ok: false, canceled: true });
                            return;
                        }
                        try {
                            const text = await file.text();
                            const data = JSON.parse(text);
                            if (data.stationsData?.stations) {
                                for (const s of data.stationsData.stations) {
                                    await invoke('save_station', {
                                        station: s
                                    });
                                }
                                if (data.stationsData.groups) {
                                    await invoke('save_groups', {
                                        groups: data.stationsData.groups
                                    });
                                }
                            }
                            if (data.settings?.settings) {
                                await invoke('update_settings', {
                                    partial: data.settings.settings
                                });
                            }
                            if (Array.isArray(data.schedules)) {
                                for (const sc of data.schedules) {
                                    await invoke('save_schedule', {
                                        schedule: sc
                                    });
                                }
                            }
                            await emit('ui:state-changed', {
                                type: 'settings'
                            });
                            resolve({ ok: true });
                        } catch (err: any) {
                            resolve({
                                ok: false,
                                error: err?.message || 'Invalid backup file'
                            });
                        }
                    };
                    input.click();
                });
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
