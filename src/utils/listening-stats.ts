import type {
    ListeningStatsSchema,
    ListeningStatsSummary,
    StatSeriesPoint,
    StationStatPoint
} from '../types/stats';

export function formatDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatMonthKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function recordListeningSeconds(
    stats: ListeningStatsSchema,
    seconds: number,
    station?: { id?: string; name?: string; logoUrl?: string | null } | null,
    now = new Date()
): void {
    if (seconds <= 0) return;

    const dayKey = formatDateKey(now);
    const hourKey = `${dayKey}-${String(now.getHours()).padStart(2, '0')}`;
    const monthKey = formatMonthKey(now);

    stats.dailySeconds[dayKey] = (stats.dailySeconds[dayKey] ?? 0) + seconds;

    if (!stats.hourlySeconds) stats.hourlySeconds = {};
    stats.hourlySeconds[hourKey] =
        (stats.hourlySeconds[hourKey] ?? 0) + seconds;

    stats.monthlySeconds[monthKey] =
        (stats.monthlySeconds[monthKey] ?? 0) + seconds;

    if (station?.id) {
        stats.stationSeconds[station.id] =
            (stats.stationSeconds[station.id] ?? 0) + seconds;
        if (!stats.stationNames) stats.stationNames = {};
        if (station.name) {
            stats.stationNames[station.id] = station.name;
        }
        if (!stats.stationLogos) stats.stationLogos = {};
        if (station.logoUrl) {
            stats.stationLogos[station.id] = station.logoUrl;
        }
    }

    stats.totalSeconds = (stats.totalSeconds ?? 0) + seconds;
}

export function buildListeningStatsSummary(
    data: ListeningStatsSchema,
    now = new Date()
): ListeningStatsSummary {
    const todayKey = formatDateKey(now);
    const thisMonthKey = formatMonthKey(now);
    const currentYearPrefix = `${now.getFullYear()}-`;

    // 1. Weekly series (Last 7 days)
    const weeklySeries: StatSeriesPoint[] = [];
    let thisWeekSeconds = 0;
    for (let i = 6; i >= 0; i--) {
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - i
        );
        const key = formatDateKey(d);
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const sec = data.dailySeconds[key] ?? 0;
        thisWeekSeconds += sec;
        weeklySeries.push({ key, date: key, label: dayLabel, seconds: sec });
    }

    // 2. Daily series (24 Hours of Today: 00:00 - 23:00)
    const dailySeries: StatSeriesPoint[] = [];
    const currentHour = now.getHours();
    for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0');
        const key = `${todayKey}-${hourStr}`;
        const label = `${hourStr}:00`;
        let sec = data.hourlySeconds?.[key] ?? 0;
        if (sec === 0 && h === currentHour && data.dailySeconds[todayKey]) {
            const recordedHourly = Object.entries(data.hourlySeconds || {})
                .filter(([k]) => k.startsWith(todayKey))
                .reduce((acc, [, val]) => acc + (val as number), 0);
            const remainder = Math.max(
                0,
                (data.dailySeconds[todayKey] ?? 0) - recordedHourly
            );
            if (remainder > 0) {
                sec = remainder;
            }
        }
        dailySeries.push({
            key,
            date: todayKey,
            label,
            seconds: sec
        });
    }

    // 3. Monthly series (Last 30 days)
    const monthlySeries: StatSeriesPoint[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - i
        );
        const key = formatDateKey(d);
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlySeries.push({
            key,
            date: key,
            month: formatMonthKey(d),
            label: dayLabel,
            seconds: data.dailySeconds[key] ?? 0
        });
    }

    // 4. Yearly series (Last 12 months)
    const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
    ];
    const yearlySeries: StatSeriesPoint[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = formatMonthKey(d);
        const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        yearlySeries.push({
            key,
            month: key,
            label,
            seconds: data.monthlySeconds[key] ?? 0
        });
    }

    let thisYearSeconds = 0;
    for (const [mKey, sec] of Object.entries(data.monthlySeconds)) {
        if (mKey.startsWith(currentYearPrefix)) {
            thisYearSeconds += sec;
        }
    }

    const topStations: StationStatPoint[] = Object.entries(data.stationSeconds)
        .map(([stationId, seconds]) => ({
            stationId,
            stationName: data.stationNames?.[stationId],
            logoUrl: data.stationLogos?.[stationId],
            seconds
        }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 6);

    return {
        todaySeconds: data.dailySeconds[todayKey] ?? 0,
        thisWeekSeconds,
        thisMonthSeconds: data.monthlySeconds[thisMonthKey] ?? 0,
        thisYearSeconds,
        totalSeconds: data.totalSeconds ?? 0,
        dailySeries,
        weeklySeries,
        monthlySeries,
        yearlySeries,
        topStations
    };
}
