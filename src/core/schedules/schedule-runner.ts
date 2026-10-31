import { ScheduleRepository } from './schedule.repository';

export interface ScheduleRunnerCallbacks {
  onNotify: (title: string, message: string) => void;
  onAutoPlay: (stationId: string, showName: string) => void;
}

export class ScheduleRunner {
  private readonly repository: ScheduleRepository;
  private readonly callbacks: ScheduleRunnerCallbacks;
  private timer: NodeJS.Timeout | null = null;
  private triggeredSlots = new Set<string>();
  private lastDateStr = '';

  constructor(
    repository: ScheduleRepository,
    callbacks: ScheduleRunnerCallbacks
  ) {
    this.repository = repository;
    this.callbacks = callbacks;
  }

  public start(): void {
    if (this.timer) return;
    this.tick();
    this.timer = setInterval(() => this.tick(), 20000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Reset slot cache daily
    if (dateStr !== this.lastDateStr) {
      this.triggeredSlots.clear();
      this.lastDateStr = dateStr;
    }

    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const schedules = this.repository.getAll().filter((s) => s.enabled);

    for (const schedule of schedules) {
      if (!schedule.daysOfWeek.includes(currentDay)) {
        continue;
      }

      const [sH, sM] = schedule.startTime
        .split(':')
        .map((v) => parseInt(v, 10));
      const startTotalMinutes = sH * 60 + (sM || 0);

      // 1. Advance Reminder Notification (e.g. 5m before)
      if (schedule.reminderMinutes > 0) {
        const reminderTargetMinutes =
          startTotalMinutes - schedule.reminderMinutes;
        if (currentMinutes === reminderTargetMinutes) {
          const slotKey = `${schedule.id}_${dateStr}_remind`;
          if (!this.triggeredSlots.has(slotKey)) {
            this.triggeredSlots.add(slotKey);
            this.callbacks.onNotify(
              `Siaran Segera Dimulai · ${schedule.showName}`,
              `Dalam ${schedule.reminderMinutes} menit di ${schedule.stationName}${schedule.host ? ` bersama ${schedule.host}` : ''}.`
            );
          }
        }
      }

      // 2. Exact Start Time Trigger (On Air Notification + Autoplay)
      if (currentMinutes === startTotalMinutes) {
        const slotKey = `${schedule.id}_${dateStr}_start`;
        if (!this.triggeredSlots.has(slotKey)) {
          this.triggeredSlots.add(slotKey);

          this.callbacks.onNotify(
            `Sedang Mengudara · ${schedule.showName}`,
            `${schedule.showName} sekarang sedang live di ${schedule.stationName}!`
          );

          if (schedule.autoPlay) {
            this.callbacks.onAutoPlay(schedule.stationId, schedule.showName);
          }
        }
      }
    }
  }
}
