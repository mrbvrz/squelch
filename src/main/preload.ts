import { contextBridge, ipcRenderer } from 'electron';

// 1. Bridge for Hidden Audio Worker
const audioBridge = {
  onCommand: (callback: (cmd: unknown) => void) => {
    ipcRenderer.on('audio:command', (_event, cmd) => callback(cmd));
  },
  notifyPlaying: () => ipcRenderer.send('audio:playing'),
  notifyBuffering: () => ipcRenderer.send('audio:buffering'),
  notifyError: (message: string) => ipcRenderer.send('audio:error', message),
  notifyDeviceRemoved: () => ipcRenderer.send('audio:device-removed'),
  notifyMediaAction: (action: string) =>
    ipcRenderer.send('audio:media-action', action)
};

contextBridge.exposeInMainWorld('squelchAudioBridge', audioBridge);
contextBridge.exposeInMainWorld('radioAudioBridge', audioBridge);

// 2. Typed Bridge for UI Windows (Tray Popover, Manage Stations & Preferences)
const squelchUiBridge = {
  // Player controls
  getPlayerStatus: () => ipcRenderer.invoke('player:get-status'),
  playStation: (stationId: string) =>
    ipcRenderer.invoke('player:play-station', stationId),
  togglePlayPause: () => ipcRenderer.invoke('player:toggle-play-pause'),
  stopPlayback: () => ipcRenderer.invoke('player:stop'),
  setSleepTimer: (minutes: number | null) =>
    ipcRenderer.invoke('player:set-sleep-timer', minutes),

  // Window navigation from Tray Popover
  openWindowTab: (
    tab: 'stations' | 'discover' | 'stats' | 'preferences' | 'about'
  ) => ipcRenderer.invoke('window:open-tab', tab),
  toggleTrayPopover: () => ipcRenderer.invoke('window:toggle-tray-popover'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  getAppIconDataUrl: () => ipcRenderer.invoke('app:get-icon-data-url'),
  openAboutWindow: () => ipcRenderer.invoke('app:open-about-window'),
  openExternalUrl: (url: string) =>
    ipcRenderer.invoke('app:open-external', url),

  // Stations CRUD, Logo Resolver, Test, Health Check, Import/Export
  getStationsData: () => ipcRenderer.invoke('stations:get-all'),
  resolveStationLogo: (logoUrl: string) =>
    ipcRenderer.invoke('stations:resolve-logo', logoUrl),
  saveStation: (station: unknown) =>
    ipcRenderer.invoke('stations:save', station),
  deleteStation: (stationId: string) =>
    ipcRenderer.invoke('stations:delete', stationId),
  toggleFavorite: (stationId: string) =>
    ipcRenderer.invoke('stations:toggle-favorite', stationId),
  reorderStations: (orderedIds: string[]) =>
    ipcRenderer.invoke('stations:reorder', orderedIds),
  saveGroups: (groups: string[]) =>
    ipcRenderer.invoke('stations:save-groups', groups),
  renameGroup: (oldName: string, newName: string) =>
    ipcRenderer.invoke('stations:rename-group', { oldName, newName }),
  deleteGroup: (groupName: string, moveToGroup?: string) =>
    ipcRenderer.invoke('stations:delete-group', { groupName, moveToGroup }),
  testStreamUrl: (url: string) =>
    ipcRenderer.invoke('stations:test-stream', url),
  runHealthCheck: () => ipcRenderer.invoke('stations:health-check'),
  removeOfflineStations: () => ipcRenderer.invoke('stations:remove-offline'),
  exportStations: (format: 'json' | 'm3u' | 'pls') =>
    ipcRenderer.invoke('stations:export', format),
  importStations: (payload: {
    content: string;
    format: 'json' | 'm3u' | 'pls';
    duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
  }) => ipcRenderer.invoke('stations:import', payload),

  // Discover (radio-browser.info)
  getOnlineCountries: () => ipcRenderer.invoke('discover:get-countries'),
  searchOnlineStations: (query: {
    countrycode?: string;
    name?: string;
    tag?: string;
    language?: string;
    limit?: number;
  }) => ipcRenderer.invoke('discover:search', query),

  // Settings, System Fonts, Backup/Restore, Listening Stats & Diagnostics
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial: Record<string, unknown>) =>
    ipcRenderer.invoke('settings:update', partial),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  getSystemFonts: () => ipcRenderer.invoke('system:get-fonts'),
  backupAppData: () => ipcRenderer.invoke('system:backup-data'),
  restoreAppData: () => ipcRenderer.invoke('system:restore-data'),
  getListeningStats: () => ipcRenderer.invoke('stats:get-summary'),
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  openLogsFolder: () => ipcRenderer.invoke('diagnostics:open-logs'),

  // Schedules, Reminders & Autoplay
  getSchedules: () => ipcRenderer.invoke('schedules:get-all'),
  saveSchedule: (schedule: unknown) =>
    ipcRenderer.invoke('schedules:save', schedule),
  deleteSchedule: (id: string) => ipcRenderer.invoke('schedules:delete', id),
  toggleSchedule: (id: string, enabled?: boolean) =>
    ipcRenderer.invoke('schedules:toggle', { id, enabled }),
  toggleScheduleAutoPlay: (id: string) =>
    ipcRenderer.invoke('schedules:toggle-autoplay', id),

  // Real-time event subscriptions
  onStateChanged: (cb: (data: unknown) => void) => {
    const listener = (_e: unknown, data: unknown) => cb(data);
    ipcRenderer.on('ui:state-changed', listener);
    return () => ipcRenderer.removeListener('ui:state-changed', listener);
  }
};

contextBridge.exposeInMainWorld('squelchApi', squelchUiBridge);
