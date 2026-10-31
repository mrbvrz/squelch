import * as crypto from 'crypto';
import * as path from 'path';
import { AtomicJsonStore } from '../storage/atomic-json-store';
import {
  NewShowScheduleInput,
  SchedulesDataSchema,
  ShowSchedule
} from './schedule.model';

const DEFAULT_SEED_SCHEDULES: ShowSchedule[] = [
  {
    id: 'jakfm-sarapan-seru',
    stationId: 'jak-101-fm-jakarta',
    stationName: 'Jak 101 FM Jakarta',
    showName: 'Sarapan Seru',
    host: 'Kemal & TJ',
    daysOfWeek: [1, 2, 3, 4, 5], // Senin s/d Jumat
    startTime: '06:00',
    endTime: '10:00',
    autoPlay: true,
    reminderMinutes: 5,
    enabled: true,
    notes: 'Program pagi legendaris Jak FM dengan obrolan seru dan lagu hits.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class ScheduleRepository {
  private readonly store: AtomicJsonStore<SchedulesDataSchema>;
  private data: SchedulesDataSchema;

  constructor(dataDir: string) {
    this.store = new AtomicJsonStore<SchedulesDataSchema>({
      filePath: path.join(dataDir, 'schedules.json'),
      currentSchemaVersion: 1,
      defaultFactory: () => ({
        schemaVersion: 1,
        schedules: DEFAULT_SEED_SCHEDULES
      })
    });

    this.data = this.store.load();
    if (
      !Array.isArray(this.data?.schedules) ||
      this.data.schedules.length === 0
    ) {
      this.data = {
        schemaVersion: 1,
        schedules: DEFAULT_SEED_SCHEDULES
      };
      this.store.save(this.data);
    }
  }

  public getAll(): ShowSchedule[] {
    return this.data.schedules.map((s) => ({
      ...s,
      daysOfWeek: [...s.daysOfWeek]
    }));
  }

  public getById(id: string): ShowSchedule | undefined {
    const found = this.data.schedules.find((s) => s.id === id);
    return found ? { ...found, daysOfWeek: [...found.daysOfWeek] } : undefined;
  }

  public save(input: NewShowScheduleInput): ShowSchedule {
    const now = new Date().toISOString();
    const id = input.id || crypto.randomUUID();
    const existingIndex = this.data.schedules.findIndex((s) => s.id === id);

    const schedule: ShowSchedule = {
      id,
      stationId: input.stationId,
      stationName: input.stationName,
      showName: input.showName.trim(),
      host: input.host?.trim() || '',
      daysOfWeek:
        Array.isArray(input.daysOfWeek) && input.daysOfWeek.length > 0
          ? [...input.daysOfWeek].sort((a, b) => a - b)
          : [1, 2, 3, 4, 5],
      startTime: input.startTime || '06:00',
      endTime: input.endTime || '10:00',
      autoPlay: Boolean(input.autoPlay),
      reminderMinutes:
        typeof input.reminderMinutes === 'number' ? input.reminderMinutes : 5,
      enabled: input.enabled !== false,
      notes: input.notes?.trim() || '',
      createdAt:
        existingIndex !== -1
          ? this.data.schedules[existingIndex].createdAt
          : now,
      updatedAt: now
    };

    if (existingIndex !== -1) {
      this.data.schedules[existingIndex] = schedule;
    } else {
      this.data.schedules.push(schedule);
    }

    this.store.save(this.data);
    return schedule;
  }

  public delete(id: string): boolean {
    const initialLen = this.data.schedules.length;
    this.data.schedules = this.data.schedules.filter((s) => s.id !== id);
    if (this.data.schedules.length !== initialLen) {
      this.store.save(this.data);
      return true;
    }
    return false;
  }

  public toggle(id: string, enabled?: boolean): ShowSchedule | undefined {
    const target = this.data.schedules.find((s) => s.id === id);
    if (!target) return undefined;
    target.enabled = enabled !== undefined ? enabled : !target.enabled;
    target.updatedAt = new Date().toISOString();
    this.store.save(this.data);
    return { ...target };
  }

  public toggleAutoPlay(id: string): ShowSchedule | undefined {
    const target = this.data.schedules.find((s) => s.id === id);
    if (!target) return undefined;
    target.autoPlay = !target.autoPlay;
    target.updatedAt = new Date().toISOString();
    this.store.save(this.data);
    return { ...target };
  }
}
