import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import {
    exportToM3u,
    exportToPls,
    parseM3uPlaylist,
    parsePlsPlaylist
} from '../utils/playlist';
import type { Station } from '../types';

export async function exportStationsData(
    format: 'json' | 'm3u' | 'pls'
): Promise<string> {
    const data: any = await invoke('get_stations_data');
    const stations: Station[] = data?.stations || [];
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
}

export async function importStationsData(payload: {
    content: string;
    format: 'json' | 'm3u' | 'pls';
    duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
}): Promise<{ importedCount: number; skippedCount: number }> {
    const data: any = await invoke('get_stations_data');
    const existing: Station[] = data?.stations || [];
    const parsed: any[] = [];
    if (payload.format === 'json') {
        try {
            const arr = JSON.parse(payload.content);
            if (Array.isArray(arr)) parsed.push(...arr);
        } catch {
            // Ignore parse errors
        }
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
            (s) => s.streamUrl === item.streamUrl || s.name === item.name
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
        const newStation: Station = {
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
            isFavorite: Boolean(item.isFavorite),
            status: 'online',
            lastVerifiedAt: null
        };
        await invoke('save_station', { station: newStation });
        importedCount++;
    }
    return { importedCount, skippedCount };
}

export async function backupAppDataBundle(): Promise<{
    ok: boolean;
    filePath?: string;
    error?: string;
}> {
    try {
        const bundle = {
            app: 'Squelch',
            version: '0.1.3',
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
}

export async function restoreAppDataBundle(): Promise<{
    ok: boolean;
    canceled?: boolean;
    error?: string;
}> {
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
                        await invoke('save_station', { station: s });
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
                        await invoke('save_schedule', { schedule: sc });
                    }
                }
                await emit('ui:state-changed', { type: 'settings' });
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
}
