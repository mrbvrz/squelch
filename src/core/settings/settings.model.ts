export type ThemeMode = 'system' | 'light' | 'dark';

export interface GlobalShortcutsConfig {
  playPause: string;
  nextStation: string;
  prevStation: string;
}

export interface AppSettings {
  schemaVersion: number;
  launchAtLogin: boolean;
  autoPlayLastStation: boolean;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  notifyOnSongChange: boolean;
  showTitleInMenuBar: boolean;
  confirmBeforeQuit: boolean;
  language: 'id' | 'en';
  theme: ThemeMode;
  accentColor: string;
  fontFamily: string;
  glassOpacity: number;
  networkTimeoutMs: number;
  userAgent: string;
  shortcuts: GlobalShortcutsConfig;
}

export interface AppRuntimeState {
  schemaVersion: number;
  lastStationId: string | null;
}

export function createDefaultSettings(): AppSettings {
  return {
    schemaVersion: 1,
    launchAtLogin: false,
    autoPlayLastStation: false,
    autoReconnect: true,
    maxReconnectAttempts: 8,
    notifyOnSongChange: true,
    showTitleInMenuBar: false,
    confirmBeforeQuit: true,
    language: 'id',
    theme: 'system',
    accentColor: '#0A84FF',
    fontFamily: 'system',
    glassOpacity: 90,
    networkTimeoutMs: 12000,
    userAgent: 'Squelch/0.1.0 (macOS; InternetRadio)',
    shortcuts: {
      playPause: 'CommandOrControl+Shift+P',
      nextStation: 'CommandOrControl+Shift+Right',
      prevStation: 'CommandOrControl+Shift+Left'
    }
  };
}

export function createDefaultRuntimeState(): AppRuntimeState {
  return {
    schemaVersion: 1,
    lastStationId: 'jak-101-fm-jakarta'
  };
}
