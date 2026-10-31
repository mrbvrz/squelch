import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class RotatingLogger {
  private readonly logFilePath: string;
  private readonly backupFilePath: string;
  private readonly maxBytes: number;

  constructor(logDir: string, maxBytes = 1024 * 1024) {
    fs.mkdirSync(logDir, { recursive: true });
    this.logFilePath = path.join(logDir, 'squelch.log');
    this.backupFilePath = path.join(logDir, 'squelch.1.log');
    this.maxBytes = maxBytes;
  }

  public getLogDir(): string {
    return path.dirname(this.logFilePath);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.write('INFO', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.write('WARN', message, meta);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.write('ERROR', message, meta);
  }

  public getRecentLogs(maxLines = 80): string {
    try {
      if (!fs.existsSync(this.logFilePath)) return 'No logs recorded yet.';
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      const lines = content.trim().split('\n');
      return lines.slice(-maxLines).join('\n');
    } catch {
      return 'Unable to read log file.';
    }
  }

  public buildDiagnosticsReport(extra: Record<string, unknown>): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        platform: process.platform,
        arch: process.arch,
        osRelease: os.release(),
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        ...extra,
        recentLogs: this.getRecentLogs(30).split('\n')
      },
      null,
      2
    );
  }

  private write(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    meta?: Record<string, unknown>
  ): void {
    try {
      this.rotateIfNeeded();
      const line = `[${new Date().toISOString()}] [${level}] ${message}${
        meta ? ` ${JSON.stringify(meta)}` : ''
      }\n`;
      fs.appendFileSync(this.logFilePath, line, 'utf8');
    } catch {
      // Never crash application due to logging
    }
  }

  private rotateIfNeeded(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) return;
      const stat = fs.statSync(this.logFilePath);
      if (stat.size >= this.maxBytes) {
        if (fs.existsSync(this.backupFilePath)) {
          fs.unlinkSync(this.backupFilePath);
        }
        fs.renameSync(this.logFilePath, this.backupFilePath);
      }
    } catch {
      // Ignore rotation error
    }
  }
}
