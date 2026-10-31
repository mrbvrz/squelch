import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { TypedEventBus } from '../events/event-bus';
import { AtomicJsonStore } from '../storage/atomic-json-store';
import {
  exportToM3u,
  exportToNativeJson,
  exportToPls,
  parseM3uPlaylist,
  parsePlsPlaylist
} from './playlist-parser';
import { isValidStreamUrl, Station, StationsDataSchema } from './station.model';

export class StationRepository {
  private readonly store: AtomicJsonStore<StationsDataSchema>;
  private readonly eventBus: TypedEventBus;
  private data: StationsDataSchema;

  constructor(options: {
    dataDir: string;
    seedFilePath: string;
    eventBus: TypedEventBus;
  }) {
    this.eventBus = options.eventBus;
    this.store = new AtomicJsonStore<StationsDataSchema>({
      filePath: path.join(options.dataDir, 'stations.json'),
      currentSchemaVersion: 1,
      defaultFactory: () => this.loadSeedData(options.seedFilePath)
    });

    this.data = this.store.load();
  }

  public getAll(): StationsDataSchema {
    return {
      schemaVersion: this.data.schemaVersion,
      groups: [...this.data.groups],
      stations: this.data.stations.map((s) => ({ ...s, tags: [...s.tags] }))
    };
  }

  public restoreAll(incoming: Partial<StationsDataSchema>): void {
    if (Array.isArray(incoming.stations)) {
      this.data = {
        schemaVersion: 1,
        groups:
          Array.isArray(incoming.groups) && incoming.groups.length > 0
            ? incoming.groups.map((g) => String(g).trim()).filter(Boolean)
            : [...this.data.groups],
        stations: incoming.stations
      };
      this.persistAndEmit();
    }
  }

  public getStations(): Station[] {
    return this.data.stations.map((s) => ({ ...s, tags: [...s.tags] }));
  }

  public getGroups(): string[] {
    return [...this.data.groups];
  }

  public getStationById(id: string): Station | undefined {
    const found = this.data.stations.find((s) => s.id === id);
    return found ? { ...found, tags: [...found.tags] } : undefined;
  }

  public upsertStation(
    input: Partial<Station> & { name: string; streamUrl: string }
  ): Station {
    if (!isValidStreamUrl(input.streamUrl)) {
      throw new Error(
        'Invalid stream URL (must start with http:// or https://)'
      );
    }

    const groupName = (input.group || 'Lainnya & Nostalgia').trim();
    if (!this.data.groups.includes(groupName)) {
      this.data.groups.push(groupName);
    }

    const existingIdx = input.id
      ? this.data.stations.findIndex((s) => s.id === input.id)
      : -1;

    const station: Station = {
      id:
        input.id && input.id.trim()
          ? input.id.trim()
          : `${input.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 32)}-${crypto.randomUUID().slice(0, 6)}`,
      name: input.name.trim(),
      streamUrl: input.streamUrl.trim(),
      streamType: input.streamType ?? 'mp3',
      logoUrl: input.logoUrl?.trim() ? input.logoUrl.trim() : null,
      genre: (input.genre || 'Radio').trim(),
      city: (input.city || 'Indonesia').trim(),
      country: (input.country || 'ID').trim(),
      tags: Array.isArray(input.tags)
        ? input.tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      group: groupName,
      isFavorite: Boolean(input.isFavorite),
      lastVerifiedAt: input.lastVerifiedAt ?? new Date().toISOString(),
      status: input.status ?? 'online',
      notes: input.notes ?? ''
    };

    if (existingIdx >= 0) {
      this.data.stations[existingIdx] = station;
    } else {
      this.data.stations.unshift(station);
    }

    this.persistAndEmit();
    return station;
  }

  public deleteStation(stationId: string): void {
    this.data.stations = this.data.stations.filter((s) => s.id !== stationId);
    this.persistAndEmit();
  }

  public toggleFavorite(stationId: string): Station | undefined {
    const target = this.data.stations.find((s) => s.id === stationId);
    if (!target) return undefined;
    target.isFavorite = !target.isFavorite;
    this.persistAndEmit();
    return { ...target };
  }

  public reorderStations(orderedIds: string[]): void {
    const byId = new Map(this.data.stations.map((s) => [s.id, s]));
    const reordered: Station[] = [];
    for (const id of orderedIds) {
      const st = byId.get(id);
      if (st) {
        reordered.push(st);
        byId.delete(id);
      }
    }
    for (const remaining of byId.values()) {
      reordered.push(remaining);
    }
    this.data.stations = reordered;
    this.persistAndEmit();
  }

  public saveGroups(groups: string[]): void {
    const cleaned = Array.from(
      new Set(groups.map((g) => g.trim()).filter(Boolean))
    );
    if (cleaned.length === 0) {
      cleaned.push('Umum');
    }
    this.data.groups = cleaned;
    this.persistAndEmit();
  }

  public renameGroup(oldName: string, newName: string): void {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;
    this.data.groups = this.data.groups.map((g) =>
      g === oldName ? trimmedNew : g
    );
    this.data.groups = Array.from(new Set(this.data.groups));
    for (const st of this.data.stations) {
      if (st.group === oldName) {
        st.group = trimmedNew;
      }
    }
    this.persistAndEmit();
  }

  public deleteGroup(
    groupName: string,
    moveToGroup = 'Lainnya & Nostalgia'
  ): void {
    this.data.groups = this.data.groups.filter((g) => g !== groupName);
    if (!this.data.groups.includes(moveToGroup)) {
      this.data.groups.push(moveToGroup);
    }
    for (const st of this.data.stations) {
      if (st.group === groupName) {
        st.group = moveToGroup;
      }
    }
    this.persistAndEmit();
  }

  public updateHealthStatuses(
    results: Array<{ stationId: string; ok: boolean }>
  ): void {
    const now = new Date().toISOString();
    const map = new Map(results.map((r) => [r.stationId, r.ok]));
    for (const st of this.data.stations) {
      if (map.has(st.id)) {
        st.status = map.get(st.id) ? 'online' : 'offline';
        st.lastVerifiedAt = now;
      }
    }
    this.persistAndEmit();
  }

  public removeOfflineStations(): number {
    const before = this.data.stations.length;
    this.data.stations = this.data.stations.filter(
      (s) => s.status !== 'offline'
    );
    const removed = before - this.data.stations.length;
    if (removed > 0) {
      this.persistAndEmit();
    }
    return removed;
  }

  public exportStations(format: 'json' | 'm3u' | 'pls'): string {
    switch (format) {
      case 'm3u':
        return exportToM3u(this.data.stations);
      case 'pls':
        return exportToPls(this.data.stations);
      case 'json':
      default:
        return exportToNativeJson(this.getAll());
    }
  }

  public importStations(params: {
    content: string;
    format: 'json' | 'm3u' | 'pls';
    duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
  }): { importedCount: number; skippedCount: number } {
    let incoming: Array<
      Partial<Station> & { name: string; streamUrl: string }
    > = [];

    if (params.format === 'json') {
      const parsed = JSON.parse(params.content) as Partial<StationsDataSchema>;
      if (Array.isArray(parsed.stations)) {
        incoming = parsed.stations.filter((s) =>
          Boolean(s?.name && s?.streamUrl && isValidStreamUrl(s.streamUrl))
        );
      }
    } else if (params.format === 'm3u') {
      incoming = parseM3uPlaylist(params.content).map((e) => ({
        name: e.name,
        streamUrl: e.streamUrl,
        group: e.group || 'Impor M3U',
        logoUrl: e.logoUrl ?? null,
        streamType: e.streamUrl.includes('.m3u8') ? 'hls' : 'mp3'
      }));
    } else if (params.format === 'pls') {
      incoming = parsePlsPlaylist(params.content).map((e) => ({
        name: e.name,
        streamUrl: e.streamUrl,
        group: 'Impor PLS',
        streamType: e.streamUrl.includes('.m3u8') ? 'hls' : 'mp3'
      }));
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of incoming) {
      const normalizedUrl = item.streamUrl.trim().toLowerCase();
      const existing = this.data.stations.find(
        (s) =>
          s.streamUrl.toLowerCase() === normalizedUrl ||
          s.name.toLowerCase() === item.name.trim().toLowerCase()
      );

      if (existing) {
        if (params.duplicateStrategy === 'skip') {
          skippedCount += 1;
          continue;
        }
        if (params.duplicateStrategy === 'overwrite') {
          this.upsertStation({
            ...existing,
            ...item,
            id: existing.id
          });
          importedCount += 1;
          continue;
        }
      }

      this.upsertStation({
        ...item,
        id: undefined,
        name:
          existing && params.duplicateStrategy === 'duplicate'
            ? `${item.name} (Copy)`
            : item.name
      });
      importedCount += 1;
    }

    return { importedCount, skippedCount };
  }

  private persistAndEmit(): void {
    this.store.save(this.data);
    this.eventBus.emit('stations:updated', {
      stations: this.getStations(),
      groups: this.getGroups()
    });
  }

  private loadSeedData(seedFilePath: string): StationsDataSchema {
    try {
      if (fs.existsSync(seedFilePath)) {
        const raw = fs.readFileSync(seedFilePath, 'utf8');
        const parsed = JSON.parse(raw) as StationsDataSchema;
        if (Array.isArray(parsed.stations) && parsed.stations.length > 0) {
          return {
            schemaVersion: 1,
            groups: Array.isArray(parsed.groups)
              ? parsed.groups
              : [
                  'Pop & Anak Muda',
                  'Nasional & Berita',
                  'Lainnya & Nostalgia',
                  'Daerah & Komunitas',
                  'Religi & Rohani'
                ],
            stations: parsed.stations
          };
        }
      }
    } catch {
      // Fallback if seed file cannot be read
    }

    return {
      schemaVersion: 1,
      groups: ['Pop & Anak Muda', 'Nasional & Berita'],
      stations: []
    };
  }
}
