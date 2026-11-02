import type { Station } from '../types';

export function exportToM3u(stations: Station[]): string {
    const lines = ['#EXTM3U'];
    for (const s of stations) {
        lines.push(`#EXTINF:-1,${s.name}`);
        lines.push(s.streamUrl);
    }
    return lines.join('\n');
}

export function exportToPls(stations: Station[]): string {
    const lines = ['[playlist]', `NumberOfEntries=${stations.length}`];
    stations.forEach((s, idx) => {
        lines.push(`File${idx + 1}=${s.streamUrl}`);
        lines.push(`Title${idx + 1}=${s.name}`);
        lines.push(`Length${idx + 1}=-1`);
    });
    lines.push('Version=2');
    return lines.join('\n');
}

export function parseM3uPlaylist(content: string): Array<Partial<Station>> {
    const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const results: Array<Partial<Station>> = [];
    let currentTitle = '';

    for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
            const idx = line.indexOf(',');
            currentTitle =
                idx !== -1 ? line.substring(idx + 1).trim() : 'Radio Station';
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
            results.push({
                name: currentTitle || 'Radio Station',
                streamUrl: line,
                streamType: line.includes('.m3u8') ? 'hls' : 'mp3',
                group: 'Umum'
            });
            currentTitle = '';
        }
    }
    return results;
}

export function parsePlsPlaylist(content: string): Array<Partial<Station>> {
    const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const results: Array<Partial<Station>> = [];
    const files: Record<number, string> = {};
    const titles: Record<number, string> = {};

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith('file') && line.includes('=')) {
            const match = line.match(/^file(\d+)=(.*)$/i);
            if (match) {
                const idx = parseInt(match[1], 10);
                files[idx] = match[2].trim();
            }
        } else if (lower.startsWith('title') && line.includes('=')) {
            const match = line.match(/^title(\d+)=(.*)$/i);
            if (match) {
                const idx = parseInt(match[1], 10);
                titles[idx] = match[2].trim();
            }
        }
    }

    const indices = Object.keys(files)
        .map(Number)
        .sort((a, b) => a - b);
    for (const idx of indices) {
        const url = files[idx];
        if (url) {
            results.push({
                name: titles[idx] || 'Radio Station',
                streamUrl: url,
                streamType: url.includes('.m3u8') ? 'hls' : 'mp3',
                group: 'Umum'
            });
        }
    }

    return results;
}
