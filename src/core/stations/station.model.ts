export type StreamType = 'mp3' | 'aac' | 'ogg' | 'hls';
export type StationStatus = 'online' | 'offline' | 'unknown';

export interface Station {
    id: string;
    name: string;
    streamUrl: string;
    streamType: StreamType;
    logoUrl: string | null;
    genre: string;
    city: string;
    country: string;
    tags: string[];
    group: string;
    isFavorite: boolean;
    lastVerifiedAt: string | null;
    status: StationStatus;
    notes?: string;
    sortOrder?: number;
}

export interface StationsDataSchema {
    schemaVersion: number;
    groups: string[];
    stations: Station[];
}

export function isValidStreamUrl(url: string): boolean {
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}
