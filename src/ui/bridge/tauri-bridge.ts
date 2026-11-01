import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { applyAppearanceVariables } from '../utils/appearance';

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

    // Listen to tray context menu actions
    listen('squelch:action', async (event: any) => {
        const action = event.payload?.action || event.payload;
        if (action === 'toggle-play-pause') {
            await (window as any).squelchApi?.togglePlayPause();
        } else if (action === 'stop') {
            await (window as any).squelchApi?.stopPlayback();
        }
    });

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
                void invoke('set_tray_state', { stateName: 'playing' });
                emit('squelch:audio:state', { state: 'playing' });
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyBuffering: () => {
                playerStatus.state = 'buffering';
                void invoke('set_tray_state', { stateName: 'buffering' });
                emit('squelch:audio:state', { state: 'buffering' });
                emit('ui:state-changed', { ...playerStatus });
            },
            notifyError: (msg: string) => {
                playerStatus.state = 'error';
                void invoke('set_tray_state', { stateName: 'error' });
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

                void invoke('set_tray_state', { stateName: 'buffering' });

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
                    void invoke('set_tray_state', { stateName: 'idle' });
                    await emit('squelch:audio:command', { type: 'pause' });
                } else if (playerStatus.currentStation) {
                    playerStatus.state = 'buffering';
                    void invoke('set_tray_state', { stateName: 'buffering' });
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
                void invoke('set_tray_state', { stateName: 'idle' });
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
                window.dispatchEvent(new CustomEvent('squelch:open-about'));
                await emit('squelch:navigate', { action: 'about' });
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
                    const lines = ['#EXTM3U'];
                    for (const s of stations) {
                        lines.push(`#EXTINF:-1,${s.name}`);
                        lines.push(s.streamUrl);
                    }
                    return lines.join('\n');
                }
                if (format === 'pls') {
                    const lines = [
                        '[playlist]',
                        `NumberOfEntries=${stations.length}`
                    ];
                    stations.forEach((s: any, idx: number) => {
                        lines.push(`File${idx + 1}=${s.streamUrl}`);
                        lines.push(`Title${idx + 1}=${s.name}`);
                        lines.push(`Length${idx + 1}=-1`);
                    });
                    lines.push('Version=2');
                    return lines.join('\n');
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
                } else {
                    const lines = payload.content
                        .split('\n')
                        .map((l: string) => l.trim())
                        .filter(Boolean);
                    let currTitle = '';
                    for (const line of lines) {
                        if (line.startsWith('#EXTINF:')) {
                            const idx = line.indexOf(',');
                            currTitle =
                                idx !== -1
                                    ? line.substring(idx + 1).trim()
                                    : 'Radio Station';
                        } else if (
                            line.startsWith('http://') ||
                            line.startsWith('https://')
                        ) {
                            parsed.push({
                                name: currTitle || 'Radio Station',
                                streamUrl: line,
                                streamType: line.includes('.m3u8')
                                    ? 'hls'
                                    : 'mp3',
                                group: 'Umum'
                            });
                            currTitle = '';
                        } else if (
                            line.toLowerCase().startsWith('file') &&
                            line.includes('=')
                        ) {
                            const url = line.split('=')[1]?.trim();
                            if (url) {
                                parsed.push({
                                    name: 'Radio Station',
                                    streamUrl: url,
                                    streamType: url.includes('.m3u8')
                                        ? 'hls'
                                        : 'mp3',
                                    group: 'Umum'
                                });
                            }
                        }
                    }
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
                const res: any = await invoke('update_settings', { partial });
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
                }
                await emit('ui:state-changed', { type: 'settings', ...res });
                return res?.settings;
            },

            resetSettings: async () => {
                const res: any = await invoke('reset_settings');
                if (res?.settings) {
                    applyAppearanceVariables(res.settings);
                }
                await emit('ui:state-changed', { type: 'settings', ...res });
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
                return await invoke('get_listening_stats');
            },

            getDiagnostics: async () => {
                const stats: any = await invoke('get_listening_stats');
                const stData: any = await invoke('get_stations_data');
                const cfg: any = await invoke('get_settings');
                const logs = [
                    `[${new Date().toISOString()}] App: Squelch v0.1.0 (Tauri v2)`,
                    `[${new Date().toISOString()}] OS: macOS / UserAgent: ${navigator.userAgent}`,
                    `[${new Date().toISOString()}] Player Status: ${playerStatus.state} (Station: ${playerStatus.currentStation?.name || 'none'})`,
                    `[${new Date().toISOString()}] Stations Count: ${stData?.stations?.length || 0} across ${stData?.groups?.length || 0} categories`,
                    `[${new Date().toISOString()}] Settings: theme=${cfg?.settings?.theme}, lang=${cfg?.settings?.language}, accent=${cfg?.settings?.accentColor}`,
                    `[${new Date().toISOString()}] Total Listening Time: ${stats?.totalSeconds || 0} seconds`,
                    `[${new Date().toISOString()}] WebKit Memory: Active Audio Worker Bridge Connected`
                ];
                return { logs };
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
