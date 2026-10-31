import * as path from 'path';
import { TypedEventBus } from '../events/event-bus';
import { AtomicJsonStore } from '../storage/atomic-json-store';
import {
  AppRuntimeState,
  AppSettings,
  createDefaultRuntimeState,
  createDefaultSettings
} from './settings.model';

export class SettingsRepository {
  private readonly settingsStore: AtomicJsonStore<AppSettings>;
  private readonly stateStore: AtomicJsonStore<AppRuntimeState>;
  private readonly eventBus: TypedEventBus;
  private settings: AppSettings;
  private runtimeState: AppRuntimeState;

  constructor(dataDir: string, eventBus: TypedEventBus) {
    this.eventBus = eventBus;
    this.settingsStore = new AtomicJsonStore<AppSettings>({
      filePath: path.join(dataDir, 'settings.json'),
      currentSchemaVersion: 1,
      defaultFactory: createDefaultSettings
    });
    this.stateStore = new AtomicJsonStore<AppRuntimeState>({
      filePath: path.join(dataDir, 'state.json'),
      currentSchemaVersion: 1,
      defaultFactory: createDefaultRuntimeState
    });

    const defaults = createDefaultSettings();
    const loaded = this.settingsStore.load();
    this.settings = {
      ...defaults,
      ...loaded,
      shortcuts: {
        ...defaults.shortcuts,
        ...(loaded.shortcuts ?? {})
      }
    };
    this.runtimeState = this.stateStore.load();
  }

  public getDataDir(): string {
    return path.dirname(this.settingsStore.getFilePath());
  }

  public getSettings(): AppSettings {
    return { ...this.settings, shortcuts: { ...this.settings.shortcuts } };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      shortcuts: {
        ...this.settings.shortcuts,
        ...(partial.shortcuts ?? {})
      },
      schemaVersion: 1
    };
    this.settingsStore.save(this.settings);
    this.eventBus.emit('settings:updated', { ...this.settings });
    return this.getSettings();
  }

  public resetToDefaults(): AppSettings {
    this.settings = createDefaultSettings();
    this.settingsStore.save(this.settings);
    this.eventBus.emit('settings:updated', { ...this.settings });
    return this.getSettings();
  }

  public getRuntimeState(): AppRuntimeState {
    return { ...this.runtimeState };
  }

  public updateRuntimeState(
    partial: Partial<AppRuntimeState>
  ): AppRuntimeState {
    this.runtimeState = {
      ...this.runtimeState,
      ...partial,
      schemaVersion: 1
    };
    this.stateStore.save(this.runtimeState);
    return this.getRuntimeState();
  }
}
