export interface ShowSchedule {
    id: string;
    stationId: string;
    stationName: string;
    showName: string;
    host?: string;
    daysOfWeek: number[]; // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
    startTime: string; // "HH:mm" (24h format, e.g. "06:00")
    endTime: string; // "HH:mm" (24h format, e.g. "10:00")
    autoPlay: boolean; // Autoplay station when show starts
    reminderMinutes: number; // 0 = at start, 5 = 5m before, 10 = 10m before
    enabled: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SchedulesDataSchema {
    schemaVersion: number;
    schedules: ShowSchedule[];
}

export type NewShowScheduleInput = Omit<
    ShowSchedule,
    'id' | 'createdAt' | 'updatedAt'
> & {
    id?: string;
};
