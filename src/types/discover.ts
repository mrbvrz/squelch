import { StreamType } from './station';

export interface RadioBrowserQuery {
    countrycode?: string;
    name?: string;
    tag?: string;
    language?: string;
    limit?: number;
}

export interface DiscoverStationItem {
    id: string;
    name: string;
    streamUrl: string;
    streamType: StreamType;
    logoUrl: string | null;
    genre: string;
    city: string;
    country: string;
    tags: string[];
    bitrate: number;
    votes: number;
}

export interface RadioBrowserCountry {
    code: string;
    name: string;
    stationCount: number;
    flag: string;
}
