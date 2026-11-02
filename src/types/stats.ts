export interface ListeningStatsSchema {
    schemaVersion: number;
    dailySeconds: Record<string, number>;
    monthlySeconds: Record<string, number>;
    stationSeconds: Record<string, number>;
    stationNames?: Record<string, string>;
    stationLogos?: Record<string, string>;
    totalSeconds: number;
}

export interface StatSeriesPoint {
    key: string;
    date?: string;
    month?: string;
    label: string;
    seconds: number;
}

export interface StationStatPoint {
    stationId: string;
    stationName?: string;
    logoUrl?: string;
    seconds: number;
}

export interface ListeningStatsSummary {
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

export function createDefaultListeningStats(): ListeningStatsSchema {
    return {
        schemaVersion: 1,
        dailySeconds: {},
        monthlySeconds: {},
        stationSeconds: {},
        stationNames: {},
        stationLogos: {},
        totalSeconds: 0
    };
}
