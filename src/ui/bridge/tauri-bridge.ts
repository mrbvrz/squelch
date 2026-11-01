import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';

interface PlayerStatus {
    state: 'idle' | 'buffering' | 'playing' | 'paused' | 'error';
    currentStation: any | null;
    streamTitle: string | null;
    sleepTimerMinutes: number | null;
    sleepTimerRemainingSec: number | null;
}

let playerStatus: PlayerStatus = {
    state: 'idle',
    currentStation: null,
    streamTitle: null,
    sleepTimerMinutes: null,
    sleepTimerRemainingSec: null
};

let sleepInterval: any = null;

export function initTauriBridge() {
    if (typeof window === 'undefined') return;
    if (!('__TAURI_INTERNALS__' in window)) return;

    // Listen to metadata from Rust ICY proxy
    listen<string>('squelch:metadata', (event) => {
        playerStatus.streamTitle = event.payload;
        emit('ui:state-changed', { ...playerStatus });
    });

    // Listen to audio worker state updates
    listen<string>('squelch:audio:state', (event) => {
        const payload = event.payload as any;
        if (payload?.state) {
            playerStatus.state = payload.state;
            emit('ui:state-changed', { ...playerStatus });
        }
    });

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
                emit('squelch:audio:state', { state: 'playing' });
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyBuffering: () => {
                playerStatus.state = 'buffering';
                emit('squelch:audio:state', { state: 'buffering' });
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyError: (msg: string) => {
                playerStatus.state = 'error';
                emit('squelch:audio:state', { state: 'error', message: msg });
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyDeviceRemoved: () => {},
            notifyMediaAction: () => {}
        };
        (window as any).radioAudioBridge = (window as any).squelchAudioBridge;
    }

    // Setup squelchUiBridge for Main and Tray windows
    if (!(window as any).squelchApi) {
        (window as any).squelchApi = {
            getPlayerStatus: async () => ({ ...playerStatus }),

            playStation: async (stationId: string) => {
                const data: any = await invoke('get_stations_data');
                const station = (data?.stations || []).find(
                    (s: any) => s.id === stationId
                );
                if (!station) return false;

                const port: number = await invoke('get_proxy_port');
                const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${encodeURIComponent(station.streamUrl)}`;

                playerStatus = {
                    ...playerStatus,
                    state: 'buffering',
                    currentStation: station,
                    streamTitle: null
                };

                await emit('squelch:audio:command', {
                    type: 'play',
                    url:
                        station.streamType === 'hls'
                            ? station.streamUrl
                            : proxyUrl,
                    isHls: station.streamType === 'hls',
                    stationName: station.name,
                    streamTitle: null,
                    logoUrl: station.logoUrl
                });

                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            togglePlayPause: async () => {
                if (playerStatus.state === 'playing') {
                    playerStatus.state = 'paused';
                    await emit('squelch:audio:command', { type: 'pause' });
                } else if (playerStatus.currentStation) {
                    playerStatus.state = 'buffering';
                    await (window as any).squelchApi.playStation(
                        playerStatus.currentStation.id
                    );
                }
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            stopPlayback: async () => {
                playerStatus.state = 'idle';
                playerStatus.currentStation = null;
                playerStatus.streamTitle = null;
                await emit('squelch:audio:command', { type: 'stop' });
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            setSleepTimer: async (minutes: number | null) => {
                if (sleepInterval) {
                    clearInterval(sleepInterval);
                    sleepInterval = null;
                }
                if (!minutes || minutes <= 0) {
                    playerStatus.sleepTimerMinutes = null;
                    playerStatus.sleepTimerRemainingSec = null;
                } else {
                    playerStatus.sleepTimerMinutes = minutes;
                    playerStatus.sleepTimerRemainingSec = minutes * 60;
                    sleepInterval = setInterval(async () => {
                        if (
                            playerStatus.sleepTimerRemainingSec &&
                            playerStatus.sleepTimerRemainingSec > 0
                        ) {
                            playerStatus.sleepTimerRemainingSec -= 1;
                            if (playerStatus.sleepTimerRemainingSec <= 0) {
                                clearInterval(sleepInterval);
                                sleepInterval = null;
                                await (window as any).squelchApi.stopPlayback();
                            }
                            await emit('ui:state-changed', { ...playerStatus });
                        }
                    }, 1000);
                }
                await emit('ui:state-changed', { ...playerStatus });
                return true;
            },

            openWindowTab: async (tab: string) => {
                await invoke('open_window_tab', { tab });
            },

            toggleTrayPopover: async () => {
                await invoke('toggle_tray_popover');
            },

            quitApp: async () => {
                await invoke('quit_app');
            },

            getAppIconDataUrl: async () => null,

            openAboutWindow: async () => {
                await invoke('open_about_window');
            },

            openExternalUrl: async (url: string) => {
                await invoke('open_external', { url });
            },

            getStationsData: async () => {
                return await invoke('get_stations_data');
            },

            resolveStationLogo: async (url: string) => url,

            saveStation: async (station: any) => {
                await invoke('save_station', { station });
                await emit('ui:state-changed', { ...playerStatus });
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

            reorderStations: async () => {},

            saveGroups: async (groups: string[]) => {
                await invoke('save_groups', { groups });
            },

            renameGroup: async () => {},
            deleteGroup: async () => {},
            testStreamUrl: async () => ({ ok: true }),
            runHealthCheck: async () => ({ results: [] }),
            removeOfflineStations: async () => ({ removedCount: 0 }),
            exportStations: async () => '',
            importStations: async () => ({ importedCount: 0 }),

            getOnlineCountries: async () => {
                try {
                    const res = await fetch(
                        'https://de1.api.radio-browser.info/json/countries'
                    );
                    const list: any[] = await res.json();
                    return list
                        .filter((c) => c.iso_3166_1 && c.stationcount > 0)
                        .map((c) => ({
                            code: c.iso_3166_1,
                            name: c.name,
                            stationCount: c.stationcount,
                            flag: '🌐'
                        }))
                        .sort((a, b) => b.stationCount - a.stationCount);
                } catch {
                    return [];
                }
            },

            searchOnlineStations: async (query: any) => {
                try {
                    const params = new URLSearchParams();
                    if (query.name) params.set('name', query.name);
                    if (query.countrycode)
                        params.set('countrycode', query.countrycode);
                    if (query.tag) params.set('tag', query.tag);
                    params.set('limit', String(query.limit || 30));

                    const res = await fetch(
                        `https://de1.api.radio-browser.info/json/stations/search?${params.toString()}`
                    );
                    const list: any[] = await res.json();
                    return list.map((s) => ({
                        id: s.stationuuid,
                        name: s.name,
                        streamUrl: s.url_resolved || s.url,
                        streamType: (s.url_resolved || s.url).includes('.m3u8')
                            ? 'hls'
                            : 'mp3',
                        logoUrl: s.favicon || null,
                        genre: s.tags || 'General',
                        city: s.state || '',
                        country: s.countrycode || '',
                        tags: (s.tags || '')
                            .split(',')
                            .map((t: string) => t.trim())
                            .filter(Boolean),
                        bitrate: s.bitrate || 128,
                        votes: s.votes || 0
                    }));
                } catch {
                    return [];
                }
            },

            getSettings: async () => {
                return await invoke('get_settings');
            },

            updateSettings: async (partial: any) => {
                await invoke('update_settings', { partial });
            },

            resetSettings: async () => {
                await invoke('reset_settings');
            },

            getSystemFonts: async () => [],
            backupAppData: async () => '',
            restoreAppData: async () => {},

            getListeningStats: async () => {
                return await invoke('get_listening_stats');
            },

            getDiagnostics: async () => ({ logs: [] }),
            openLogsFolder: async () => {},

            getSchedules: async () => {
                return await invoke('get_schedules');
            },

            saveSchedule: async (schedule: any) => {
                await invoke('save_schedule', { schedule });
            },

            deleteSchedule: async (id: string) => {
                await invoke('delete_schedule', { id });
            },

            toggleSchedule: async () => {},
            toggleScheduleAutoPlay: async () => {},

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
