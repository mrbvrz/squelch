import { isValidStreamUrl, Station, StationsDataSchema } from './station.model';

export interface ParsedPlaylistEntry {
  name: string;
  streamUrl: string;
  group?: string;
  logoUrl?: string | null;
}

export function parseM3uPlaylist(content: string): ParsedPlaylistEntry[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedPlaylistEntry[] = [];
  let pendingName: string | null = null;
  let pendingGroup: string | undefined;
  let pendingLogo: string | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const groupMatch = /group-title="([^"]+)"/i.exec(line);
      if (groupMatch) pendingGroup = groupMatch[1].trim();

      const logoMatch = /tvg-logo="([^"]+)"/i.exec(line);
      if (logoMatch) pendingLogo = logoMatch[1].trim();

      const commaIdx = line.lastIndexOf(',');
      if (commaIdx !== -1) {
        pendingName = line.slice(commaIdx + 1).trim();
      }
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (isValidStreamUrl(line)) {
      results.push({
        name: pendingName || line,
        streamUrl: line,
        group: pendingGroup,
        logoUrl: pendingLogo
      });
      pendingName = null;
      pendingGroup = undefined;
      pendingLogo = null;
    }
  }

  return results;
}

export function parsePlsPlaylist(content: string): ParsedPlaylistEntry[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const files = new Map<string, string>();
  const titles = new Map<string, string>();

  for (const line of lines) {
    const fileMatch = /^File(\d+)=(.+)$/i.exec(line);
    if (fileMatch) {
      files.set(fileMatch[1], fileMatch[2].trim());
      continue;
    }
    const titleMatch = /^Title(\d+)=(.+)$/i.exec(line);
    if (titleMatch) {
      titles.set(titleMatch[1], titleMatch[2].trim());
    }
  }

  const results: ParsedPlaylistEntry[] = [];
  for (const [idx, url] of files.entries()) {
    if (isValidStreamUrl(url)) {
      results.push({
        name: titles.get(idx) || url,
        streamUrl: url
      });
    }
  }
  return results;
}

export function exportToM3u(stations: Station[]): string {
  const lines = ['#EXTM3U'];
  for (const st of stations) {
    const groupAttr = st.group
      ? ` group-title="${st.group.replace(/"/g, "'")}"`
      : '';
    const logoAttr = st.logoUrl ? ` tvg-logo="${st.logoUrl}"` : '';
    lines.push(`#EXTINF:-1${groupAttr}${logoAttr},${st.name}`);
    lines.push(st.streamUrl);
  }
  return lines.join('\n') + '\n';
}

export function exportToPls(stations: Station[]): string {
  const lines = ['[playlist]', `NumberOfEntries=${stations.length}`];
  stations.forEach((st, i) => {
    const n = i + 1;
    lines.push(`File${n}=${st.streamUrl}`);
    lines.push(`Title${n}=${st.name}`);
    lines.push(`Length${n}=-1`);
  });
  lines.push('Version=2');
  return lines.join('\n') + '\n';
}

export function exportToNativeJson(data: StationsDataSchema): string {
  return JSON.stringify(data, null, 2);
}
