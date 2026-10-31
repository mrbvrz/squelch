import * as path from 'path';
import { TypedEventBus } from '../events/event-bus';
import { AtomicJsonStore } from '../storage/atomic-json-store';

export interface ListeningStatsSchema {
  schemaVersion: number;
  dailySeconds: Record<string, number>;
  monthlySeconds: Record<string, number>;
  stationSeconds: Record<string, number>;
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
    totalSeconds: 0
  };
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export class ListeningTracker {
  private readonly store: AtomicJsonStore<ListeningStatsSchema>;
  private readonly eventBus: TypedEventBus;
  private data: ListeningStatsSchema;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;
  private activeStationId: string | null = null;
  private lastTickTimeMs: number | null = null;

  constructor(dataDir: string, eventBus: TypedEventBus) {
    this.eventBus = eventBus;
    this.store = new AtomicJsonStore<ListeningStatsSchema>({
      filePath: path.join(dataDir, 'stats.json'),
      currentSchemaVersion: 1,
      defaultFactory: createDefaultListeningStats
    });

    const loaded = this.store.load();
    this.data = {
      ...createDefaultListeningStats(),
      ...loaded,
      dailySeconds: { ...(loaded.dailySeconds ?? {}) },
      monthlySeconds: { ...(loaded.monthlySeconds ?? {}) },
      stationSeconds: { ...(loaded.stationSeconds ?? {}) }
    };

    this.bindEvents();
  }

  public exportRawData(): ListeningStatsSchema {
    this.flushPendingTick();
    return {
      schemaVersion: 1,
      dailySeconds: { ...this.data.dailySeconds },
      monthlySeconds: { ...this.data.monthlySeconds },
      stationSeconds: { ...this.data.stationSeconds },
      totalSeconds: this.data.totalSeconds
    };
  }

  public importRawData(raw: Partial<ListeningStatsSchema>): void {
    this.data = {
      schemaVersion: 1,
      dailySeconds: { ...(raw.dailySeconds ?? {}) },
      monthlySeconds: { ...(raw.monthlySeconds ?? {}) },
      stationSeconds: { ...(raw.stationSeconds ?? {}) },
      totalSeconds: typeof raw.totalSeconds === 'number' ? raw.totalSeconds : 0
    };
    this.store.save(this.data);
  }

  public recordSeconds(
    seconds: number,
    stationId: string | null,
    now = new Date()
  ): void {
    if (seconds <= 0) return;
    const rounded = Math.round(seconds);
    if (rounded <= 0) return;

    const dayKey = formatDateKey(now);
    const monthKey = formatMonthKey(now);

    this.data.dailySeconds[dayKey] =
      (this.data.dailySeconds[dayKey] ?? 0) + rounded;
    this.data.monthlySeconds[monthKey] =
      (this.data.monthlySeconds[monthKey] ?? 0) + rounded;
    if (stationId) {
      this.data.stationSeconds[stationId] =
        (this.data.stationSeconds[stationId] ?? 0) + rounded;
    }
    this.data.totalSeconds = (this.data.totalSeconds ?? 0) + rounded;

    this.store.save(this.data);
  }

  public getSummary(now = new Date()): ListeningStatsSummary {
    const todayKey = formatDateKey(now);
    const thisMonthKey = formatMonthKey(now);
    const currentYearPrefix = `${now.getFullYear()}-`;

    // 1. Weekly series (Last 7 days)
    const weeklySeries: StatSeriesPoint[] = [];
    let thisWeekSeconds = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = formatDateKey(d);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
      const sec = this.data.dailySeconds[key] ?? 0;
      thisWeekSeconds += sec;
      weeklySeries.push({
        key,
        date: key,
        label: dayLabel,
        seconds: sec
      });
    }

    // Legacy 14-day dailySeries for compatibility
    const dailySeries: StatSeriesPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = formatDateKey(d);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
      dailySeries.push({
        key,
        date: key,
        label: dayLabel,
        seconds: this.data.dailySeconds[key] ?? 0
      });
    }

    // 2. Monthly series (Last 30 days)
    const monthlySeries: StatSeriesPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = formatDateKey(d);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
      monthlySeries.push({
        key,
        date: key,
        month: formatMonthKey(d),
        label: dayLabel,
        seconds: this.data.dailySeconds[key] ?? 0
      });
    }

    // 3. Yearly series (Last 12 months)
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
      const label = `${monthNames[d.getMonth()]} ${String(
        d.getFullYear()
      ).slice(-2)}`;
      yearlySeries.push({
        key,
        month: key,
        label,
        seconds: this.data.monthlySeconds[key] ?? 0
      });
    }

    let thisYearSeconds = 0;
    for (const [mKey, sec] of Object.entries(this.data.monthlySeconds)) {
      if (mKey.startsWith(currentYearPrefix)) {
        thisYearSeconds += sec;
      }
    }

    const topStations: StationStatPoint[] = Object.entries(
      this.data.stationSeconds
    )
      .map(([stationId, seconds]) => ({ stationId, seconds }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 6);

    return {
      todaySeconds: this.data.dailySeconds[todayKey] ?? 0,
      thisWeekSeconds,
      thisMonthSeconds: this.data.monthlySeconds[thisMonthKey] ?? 0,
      thisYearSeconds,
      totalSeconds: this.data.totalSeconds ?? 0,
      dailySeries,
      weeklySeries,
      monthlySeries,
      yearlySeries,
      topStations
    };
  }

  public stop(): void {
    this.flushPendingTick();
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private bindEvents(): void {
    this.eventBus.on('player:state-changed', ({ currentState, station }) => {
      if (currentState === 'playing') {
        this.activeStationId = station?.id ?? this.activeStationId;
        this.startTracking();
      } else {
        this.stopTracking();
        if (station?.id) {
          this.activeStationId = station.id;
        }
      }
    });
  }

  private startTracking(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTickTimeMs = Date.now();
    if (!this.tickTimer) {
      this.tickTimer = setInterval(() => {
        this.flushPendingTick();
      }, 5000);
    }
  }

  private stopTracking(): void {
    if (!this.isPlaying) return;
    this.flushPendingTick();
    this.isPlaying = false;
    this.lastTickTimeMs = null;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private flushPendingTick(): void {
    if (!this.isPlaying || this.lastTickTimeMs === null) return;
    const nowMs = Date.now();
    const elapsedSec = Math.floor((nowMs - this.lastTickTimeMs) / 1000);
    if (elapsedSec >= 1) {
      this.lastTickTimeMs += elapsedSec * 1000;
      this.recordSeconds(elapsedSec, this.activeStationId, new Date(nowMs));
    }
  }
}
