import * as fs from 'fs';
import * as path from 'path';

export interface SchemaVersioned {
  schemaVersion: number;
}

export type MigrationFn<T> = (oldData: Record<string, unknown>) => T;

export class AtomicJsonStore<T extends SchemaVersioned> {
  private readonly filePath: string;
  private readonly currentSchemaVersion: number;
  private readonly defaultFactory: () => T;
  private readonly migrations: Map<number, MigrationFn<unknown>>;

  constructor(options: {
    filePath: string;
    currentSchemaVersion: number;
    defaultFactory: () => T;
    migrations?: Map<number, MigrationFn<unknown>>;
  }) {
    this.filePath = options.filePath;
    this.currentSchemaVersion = options.currentSchemaVersion;
    this.defaultFactory = options.defaultFactory;
    this.migrations = options.migrations ?? new Map();
  }

  public getFilePath(): string {
    return this.filePath;
  }

  public load(): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        const initial = this.defaultFactory();
        this.save(initial);
        return initial;
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const migrated = this.applyMigrationsIfNeeded(parsed);
      return migrated;
    } catch {
      const fallback = this.defaultFactory();
      this.save(fallback);
      return fallback;
    }
  }

  /**
   * Writes JSON atomically by writing to a temporary file in the same directory,
   * flushing to disk (fsync), and renaming over the target file.
   */
  public save(data: T): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(
      { ...data, schemaVersion: this.currentSchemaVersion },
      null,
      2
    );

    const fd = fs.openSync(tmpPath, 'w');
    try {
      fs.writeFileSync(fd, serialized, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    fs.renameSync(tmpPath, this.filePath);
  }

  private applyMigrationsIfNeeded(raw: Record<string, unknown>): T {
    let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;
    let currentObj: Record<string, unknown> = { ...raw };
    let didMigrate = false;

    while (version < this.currentSchemaVersion) {
      const migrateFn = this.migrations.get(version);
      if (!migrateFn) {
        break;
      }
      currentObj = migrateFn(currentObj) as Record<string, unknown>;
      version += 1;
      currentObj.schemaVersion = version;
      didMigrate = true;
    }

    const result = currentObj as unknown as T;
    if (didMigrate) {
      this.save(result);
    }
    return result;
  }
}
