import { dialog, ipcMain, shell } from 'electron';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import { RadioBrowserClient } from '../core/discover/radio-browser.client';
import { RotatingLogger } from '../core/diagnostics/logger';
import { PlayerController } from '../core/player/player-controller';
import { testAndInspectStream } from '../core/player/stream-tester';
import { AppSettings } from '../core/settings/settings.model';
import { SettingsRepository } from '../core/settings/settings.repository';
import { checkAllStationsHealth } from '../core/stations/health-checker';
import { Station, StationsDataSchema } from '../core/stations/station.model';
import { StationRepository } from '../core/stations/station.repository';
import { NewShowScheduleInput } from '../core/schedules/schedule.model';
import { ScheduleRepository } from '../core/schedules/schedule.repository';
import {
    ListeningStatsSchema,
    ListeningTracker
} from '../core/stats/listening-tracker';
import { loadOrCreateMacAppIcon } from '../platform/macos/app-icon-generator';
import { WindowManager } from './window-manager';

function scanSystemFontFamilies(): string[] {
    const curated = [
        'SF Pro Text',
        'SF Pro Display',
        'SF Pro Rounded',
        'SF Mono',
        'Helvetica Neue',
        'Avenir Next',
        'Avenir',
        'Menlo',
        'Monaco',
        'Geneva',
        'Optima',
        'Futura',
        'Gill Sans',
        'Georgia',
        'Palatino',
        'Segoe UI',
        'Inter',
        'Arial',
        'Verdana',
        'Trebuchet MS',
        'Courier New'
    ];

    const found = new Set<string>(curated);
    const fontDirs = [
        '/System/Library/Fonts',
        '/Library/Fonts',
        path.join(os.homedir(), 'Library/Fonts'),
        'C:\\Windows\\Fonts',
        '/usr/share/fonts',
        '/usr/local/share/fonts'
    ];

    for (const dir of fontDirs) {
        try {
            if (!fs.existsSync(dir)) continue;
            const entries = fs.readdirSync(dir);
            for (const file of entries) {
                if (!/\.(ttf|otf|ttc)$/i.test(file)) continue;
                const base = file
                    .replace(/\.(ttf|otf|ttc)$/i, '')
                    .replace(
                        /[-_](Regular|Bold|Italic|Medium|Light|Semibold|Heavy|Black|Thin|Ultralight|Condensed|Roman|Oblique)+$/i,
                        ''
                    )
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .trim();
                if (
                    base.length >= 3 &&
                    base.length <= 34 &&
                    !base.startsWith('.')
                ) {
                    found.add(base);
                }
            }
        } catch {
            // Ignore inaccessible system font directories
        }
    }

    return Array.from(found).sort((a, b) => a.localeCompare(b));
}

function detectImageMimeType(buf: Buffer, url: string): string | null {
    if (buf.length < 4) return null;
    // ICO signature: 00 00 01 00 or 00 00 02 00
    if (
        buf[0] === 0x00 &&
        buf[1] === 0x00 &&
        (buf[2] === 0x01 || buf[2] === 0x02) &&
        buf[3] === 0x00
    ) {
        return 'image/x-icon';
    }
    // PNG signature: 89 50 4E 47
    if (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
    ) {
        return 'image/png';
    }
    // JPEG signature: FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return 'image/jpeg';
    }
    // GIF signature: 47 49 46
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
        return 'image/gif';
    }
    // WEBP signature: RIFF....WEBP
    if (
        buf.length >= 12 &&
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
    ) {
        return 'image/webp';
    }
    // SVG check
    const headText = buf.subarray(0, 200).toString('utf8').trim().toLowerCase();
    if (headText.startsWith('<svg') || headText.includes('<svg')) {
        return 'image/svg+xml';
    }
    if (
        /\.ico(\?|$)/i.test(url) &&
        !headText.startsWith('<!doctype') &&
        !headText.startsWith('<html')
    ) {
        return 'image/x-icon';
    }
    return null;
}

function fetchImageAsDataUrl(
    targetUrl: string,
    redirectsLeft = 3
): Promise<string | null> {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(targetUrl);
            const isHttps = parsed.protocol === 'https:';
            const client = isHttps ? https : http;

            const req = client.get(
                parsed,
                {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Squelch/0.1.0',
                        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/x-icon,image/*,*/*;q=0.8'
                    },
                    timeout: 4500,
                    ...(isHttps ? { rejectUnauthorized: false } : {})
                },
                (res) => {
                    const status = res.statusCode ?? 0;
                    if (
                        status >= 300 &&
                        status < 400 &&
                        res.headers.location &&
                        redirectsLeft > 0
                    ) {
                        res.resume();
                        try {
                            const nextUrl = new URL(
                                res.headers.location,
                                targetUrl
                            ).toString();
                            void fetchImageAsDataUrl(
                                nextUrl,
                                redirectsLeft - 1
                            ).then(resolve);
                        } catch {
                            resolve(null);
                        }
                        return;
                    }

                    if (status !== 200) {
                        res.resume();
                        resolve(null);
                        return;
                    }

                    const chunks: Buffer[] = [];
                    let totalBytes = 0;
                    res.on('data', (chunk: Buffer) => {
                        totalBytes += chunk.length;
                        if (totalBytes <= 512 * 1024) {
                            chunks.push(chunk);
                        }
                    });
                    res.on('end', () => {
                        const buf = Buffer.concat(chunks);
                        const mime = detectImageMimeType(buf, targetUrl);
                        if (!mime) {
                            resolve(null);
                            return;
                        }
                        resolve(
                            `data:${mime};base64,${buf.toString('base64')}`
                        );
                    });
                }
            );

            req.on('timeout', () => {
                req.destroy();
                resolve(null);
            });
            req.on('error', () => {
                resolve(null);
            });
        } catch {
            resolve(null);
        }
    });
}

const resolvedLogoCache = new Map<string, string | null>();
let cachedFontFamilies: string[] | null = null;

export function registerIpcHandlers(deps: {
    playerController: PlayerController;
    stationRepository: StationRepository;
    scheduleRepository: ScheduleRepository;
    settingsRepository: SettingsRepository;
    listeningTracker: ListeningTracker;
    radioBrowserClient: RadioBrowserClient;
    windowManager: WindowManager;
    logger: RotatingLogger;
    resourcesDir: string;
    onSettingsApplied: (settings: AppSettings) => void;
    onRequestQuit: () => Promise<void>;
    onToggleTrayPopover?: () => void;
}): void {
    const {
        playerController,
        stationRepository,
        scheduleRepository,
        settingsRepository,
        listeningTracker,
        radioBrowserClient,
        windowManager,
        logger,
        resourcesDir,
        onSettingsApplied,
        onRequestQuit,
        onToggleTrayPopover
    } = deps;

    ipcMain.handle('player:get-status', () => {
        const sleep = playerController.getSleepTimerState();
        return {
            state: playerController.getState(),
            currentStation: playerController.getCurrentStation(),
            streamTitle: playerController.getCurrentStreamTitle(),
            sleepTimerMinutes: sleep.durationMinutes,
            sleepTimerRemainingSec: sleep.remainingSeconds
        };
    });

    ipcMain.handle('player:play-station', async (_e, stationId: string) => {
        const st = stationRepository.getStationById(stationId);
        if (st) {
            await playerController.play(st);
            settingsRepository.updateRuntimeState({ lastStationId: st.id });
        }
        return true;
    });

    ipcMain.handle('player:toggle-play-pause', async () => {
        const all = stationRepository.getStations();
        const lastId = settingsRepository.getRuntimeState().lastStationId;
        const fallback = all.find((s) => s.id === lastId) ?? all[0] ?? null;
        await playerController.togglePlayPause(fallback);
        return true;
    });

    ipcMain.handle('player:stop', async () => {
        await playerController.stop();
        return true;
    });

    ipcMain.handle('player:set-sleep-timer', (_e, minutes: number | null) => {
        playerController.setSleepTimer(minutes);
        return true;
    });

    ipcMain.handle(
        'window:open-tab',
        (
            _e,
            tab: 'stations' | 'discover' | 'stats' | 'preferences' | 'about'
        ) => {
            windowManager.openUiWindow(tab);
            return true;
        }
    );

    ipcMain.handle('window:toggle-tray-popover', () => {
        onToggleTrayPopover?.();
        return true;
    });

    ipcMain.handle('app:quit', async () => {
        await onRequestQuit();
        return true;
    });

    ipcMain.handle('app:get-icon-data-url', () => {
        try {
            const icon = loadOrCreateMacAppIcon(resourcesDir);
            return icon.toDataURL();
        } catch {
            return null;
        }
    });

    ipcMain.handle('app:open-about-window', () => {
        windowManager.openAboutWindow();
        return true;
    });

    ipcMain.handle('app:open-external', async (_e, url: string) => {
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            await shell.openExternal(url);
            return true;
        }
        return false;
    });

    ipcMain.handle('stations:get-all', () => {
        return stationRepository.getAll();
    });

    ipcMain.handle('stations:resolve-logo', async (_e, logoUrl: string) => {
        if (!logoUrl || !logoUrl.trim()) return null;
        const clean = logoUrl.trim();
        if (resolvedLogoCache.has(clean)) {
            return resolvedLogoCache.get(clean) ?? null;
        }

        // 1. Try direct fetch (supports .ico, PNG, JPEG, WEBP, SVG and self-signed TLS)
        let dataUrl = await fetchImageAsDataUrl(clean);

        // 2. If direct .ico / image URL failed, try domain favicon fallback via DuckDuckGo / Google S2
        if (!dataUrl) {
            try {
                const host = new URL(clean).hostname;
                if (host) {
                    dataUrl = await fetchImageAsDataUrl(
                        `https://icons.duckduckgo.com/ip3/${host}.ico`
                    );
                }
            } catch {
                // Ignore invalid URL
            }
        }

        resolvedLogoCache.set(clean, dataUrl);
        return dataUrl;
    });

    ipcMain.handle(
        'stations:save',
        async (
            _e,
            stationInput: Partial<Station> & { name: string; streamUrl: string }
        ) => {
            let resolvedUrl = stationInput.streamUrl.trim();
            let detectedType = stationInput.streamType;
            let resolvedLogo = stationInput.logoUrl;

            if (resolvedUrl.includes('open.noice.id/catalog/')) {
                const inspected = await testAndInspectStream(resolvedUrl);
                if (inspected.resolvedUrl) {
                    resolvedUrl = inspected.resolvedUrl;
                    detectedType = inspected.streamType;
                    if (!resolvedLogo && inspected.noiceCatalogInfo?.logoUrl) {
                        resolvedLogo = inspected.noiceCatalogInfo.logoUrl;
                    }
                }
            }

            const saved = stationRepository.upsertStation({
                ...stationInput,
                streamUrl: resolvedUrl,
                streamType: detectedType,
                logoUrl: resolvedLogo
            });
            logger.info('Saved station', { id: saved.id, name: saved.name });
            return saved;
        }
    );

    ipcMain.handle('stations:delete', (_e, stationId: string) => {
        stationRepository.deleteStation(stationId);
        logger.info('Deleted station', { stationId });
        return true;
    });

    ipcMain.handle('stations:toggle-favorite', (_e, stationId: string) => {
        return stationRepository.toggleFavorite(stationId);
    });

    ipcMain.handle('stations:reorder', (_e, orderedIds: string[]) => {
        stationRepository.reorderStations(orderedIds);
        return true;
    });

    ipcMain.handle('stations:save-groups', (_e, groups: string[]) => {
        stationRepository.saveGroups(groups);
        return stationRepository.getGroups();
    });

    ipcMain.handle(
        'stations:rename-group',
        (_e, payload: { oldName: string; newName: string }) => {
            stationRepository.renameGroup(payload.oldName, payload.newName);
            return stationRepository.getAll();
        }
    );

    ipcMain.handle(
        'stations:delete-group',
        (_e, payload: { groupName: string; moveToGroup?: string }) => {
            stationRepository.deleteGroup(
                payload.groupName,
                payload.moveToGroup
            );
            return stationRepository.getAll();
        }
    );

    ipcMain.handle('stations:test-stream', async (_e, url: string) => {
        return testAndInspectStream(
            url,
            settingsRepository.getSettings().networkTimeoutMs
        );
    });

    ipcMain.handle('stations:health-check', async () => {
        const stations = stationRepository.getStations();
        const results = await checkAllStationsHealth(stations, 5, 7000);
        stationRepository.updateHealthStatuses(results);
        return {
            results,
            stations: stationRepository.getStations()
        };
    });

    ipcMain.handle('stations:remove-offline', () => {
        return stationRepository.removeOfflineStations();
    });

    ipcMain.handle('stations:export', (_e, format: 'json' | 'm3u' | 'pls') => {
        return stationRepository.exportStations(format);
    });

    ipcMain.handle(
        'stations:import',
        (
            _e,
            payload: {
                content: string;
                format: 'json' | 'm3u' | 'pls';
                duplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
            }
        ) => {
            const res = stationRepository.importStations(payload);
            logger.info('Imported stations', res);
            return res;
        }
    );

    ipcMain.handle('discover:get-countries', async () => {
        return radioBrowserClient.getCountries();
    });

    ipcMain.handle(
        'discover:search',
        async (
            _e,
            query: {
                countrycode?: string;
                name?: string;
                tag?: string;
                language?: string;
                limit?: number;
            }
        ) => {
            return radioBrowserClient.searchStations(query);
        }
    );

    ipcMain.handle('settings:get', () => {
        return {
            settings: settingsRepository.getSettings(),
            dataDir: settingsRepository.getDataDir()
        };
    });

    ipcMain.handle('settings:update', (_e, partial: Partial<AppSettings>) => {
        const updated = settingsRepository.updateSettings(partial);
        onSettingsApplied(updated);
        return updated;
    });

    ipcMain.handle('settings:reset', () => {
        const reset = settingsRepository.resetToDefaults();
        onSettingsApplied(reset);
        return reset;
    });

    ipcMain.handle('system:get-fonts', () => {
        if (!cachedFontFamilies) {
            cachedFontFamilies = scanSystemFontFamilies();
        }
        return cachedFontFamilies;
    });

    ipcMain.handle('system:backup-data', async () => {
        try {
            const dateStr = new Date().toISOString().slice(0, 10);
            const res = await dialog.showSaveDialog({
                title: 'Backup Squelch Data',
                defaultPath: path.join(
                    os.homedir(),
                    'Downloads',
                    `squelch-backup-${dateStr}.json`
                ),
                filters: [{ name: 'Squelch Backup JSON', extensions: ['json'] }]
            });

            if (res.canceled || !res.filePath) {
                return { ok: false, canceled: true };
            }

            const bundle = {
                app: 'Squelch',
                version: '0.1.0',
                exportedAt: new Date().toISOString(),
                stationsData: stationRepository.getAll(),
                settings: settingsRepository.getSettings(),
                listeningStats: listeningTracker.exportRawData()
            };

            fs.writeFileSync(
                res.filePath,
                JSON.stringify(bundle, null, 2),
                'utf8'
            );
            logger.info('Created application backup', {
                filePath: res.filePath
            });
            return { ok: true, filePath: res.filePath };
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    });

    ipcMain.handle('system:restore-data', async () => {
        try {
            const res = await dialog.showOpenDialog({
                title: 'Restore Squelch Backup',
                properties: ['openFile'],
                filters: [{ name: 'Squelch Backup JSON', extensions: ['json'] }]
            });

            if (res.canceled || res.filePaths.length === 0) {
                return { ok: false, canceled: true };
            }

            const filePath = res.filePaths[0];
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw) as {
                stationsData?: StationsDataSchema;
                settings?: Partial<AppSettings>;
                listeningStats?: Partial<ListeningStatsSchema>;
                stations?: Station[];
                groups?: string[];
            };

            if (
                parsed.stationsData &&
                Array.isArray(parsed.stationsData.stations)
            ) {
                stationRepository.restoreAll(parsed.stationsData);
            } else if (Array.isArray(parsed.stations)) {
                stationRepository.restoreAll({
                    schemaVersion: 1,
                    groups: parsed.groups ?? [],
                    stations: parsed.stations
                });
            }

            if (parsed.settings && typeof parsed.settings === 'object') {
                const updated = settingsRepository.updateSettings(
                    parsed.settings
                );
                onSettingsApplied(updated);
            }

            if (
                parsed.listeningStats &&
                typeof parsed.listeningStats === 'object'
            ) {
                listeningTracker.importRawData(parsed.listeningStats);
            }

            logger.info('Restored application backup', { filePath });
            return { ok: true, filePath };
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error ? err.message : String(err)
            };
        }
    });

    ipcMain.handle('stats:get-summary', () => {
        return listeningTracker.getSummary();
    });

    ipcMain.handle('diagnostics:get', () => {
        return logger.buildDiagnosticsReport({
            playerState: playerController.getState(),
            currentStation: playerController.getCurrentStation()?.name ?? null,
            stationCount: stationRepository.getStations().length,
            dataDir: settingsRepository.getDataDir()
        });
    });

    ipcMain.handle('diagnostics:open-logs', async () => {
        await shell.openPath(logger.getLogDir());
        return true;
    });

    // Schedule & Reminder Handlers
    ipcMain.handle('schedules:get-all', () => {
        return scheduleRepository.getAll();
    });

    ipcMain.handle('schedules:save', (_e, input: NewShowScheduleInput) => {
        const saved = scheduleRepository.save(input);
        windowManager.broadcastToUi({
            type: 'schedules:updated',
            payload: scheduleRepository.getAll()
        });
        return saved;
    });

    ipcMain.handle('schedules:delete', (_e, id: string) => {
        const ok = scheduleRepository.delete(id);
        if (ok) {
            windowManager.broadcastToUi({
                type: 'schedules:updated',
                payload: scheduleRepository.getAll()
            });
        }
        return ok;
    });

    ipcMain.handle(
        'schedules:toggle',
        (_e, { id, enabled }: { id: string; enabled?: boolean }) => {
            const updated = scheduleRepository.toggle(id, enabled);
            windowManager.broadcastToUi({
                type: 'schedules:updated',
                payload: scheduleRepository.getAll()
            });
            return updated;
        }
    );

    ipcMain.handle('schedules:toggle-autoplay', (_e, id: string) => {
        const updated = scheduleRepository.toggleAutoPlay(id);
        windowManager.broadcastToUi({
            type: 'schedules:updated',
            payload: scheduleRepository.getAll()
        });
        return updated;
    });
}
