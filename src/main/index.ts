import { app, dialog, Menu, nativeTheme, Notification } from 'electron';
import * as path from 'path';
import { RadioBrowserClient } from '../core/discover/radio-browser.client';
import { RotatingLogger } from '../core/diagnostics/logger';
import { NowPlayingMetadata, TypedEventBus } from '../core/events/event-bus';
import { PlayerController } from '../core/player/player-controller';
import { AppSettings } from '../core/settings/settings.model';
import { SettingsRepository } from '../core/settings/settings.repository';
import { StationRepository } from '../core/stations/station.repository';
import { ScheduleRepository } from '../core/schedules/schedule.repository';
import { ScheduleRunner } from '../core/schedules/schedule-runner';
import { ListeningTracker } from '../core/stats/listening-tracker';
import { createPlatformAdapters } from '../platform/factory';
import { loadOrCreateMacAppIcon } from '../platform/macos/app-icon-generator';
import { registerIpcHandlers } from './ipc-handlers';
import { WindowManager } from './window-manager';

app.setName('Squelch');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.exit(0);
}

class SquelchApplication {
    private readonly eventBus = new TypedEventBus();
    private readonly resourcesDir = path.resolve(__dirname, '../../resources');
    private readonly adapters = createPlatformAdapters(this.resourcesDir);

    private logger!: RotatingLogger;
    private settingsRepository!: SettingsRepository;
    private stationRepository!: StationRepository;
    private scheduleRepository!: ScheduleRepository;
    private scheduleRunner!: ScheduleRunner;
    private listeningTracker!: ListeningTracker;
    private radioBrowserClient!: RadioBrowserClient;
    private windowManager!: WindowManager;
    private playerController!: PlayerController;

    private latestMetadata: NowPlayingMetadata | null = null;
    private lastErrorMessage: string | undefined;
    private isConfirmedQuit = false;
    private isShowingQuitDialog = false;

    public async bootstrap(): Promise<void> {
        const dataDir = this.adapters.systemAdapter.getAppDataPath();
        this.logger = new RotatingLogger(path.join(dataDir, 'logs'));
        this.logger.info('Bootstrapping Squelch', { dataDir });

        if (process.platform === 'darwin') {
            Menu.setApplicationMenu(
                Menu.buildFromTemplate([
                    {
                        label: 'Squelch',
                        submenu: [
                            {
                                label: 'Tentang Squelch…',
                                click: () =>
                                    this.windowManager.openAboutWindow()
                            },
                            { type: 'separator' },
                            {
                                label: 'Buka Squelch',
                                click: () => this.openMainWindow()
                            },
                            {
                                label: 'Pengaturan…',
                                accelerator: 'CmdOrCtrl+,',
                                click: () =>
                                    this.windowManager?.openUiWindow(
                                        'preferences'
                                    )
                            },
                            { type: 'separator' },
                            { role: 'hide', label: 'Sembunyikan Squelch' },
                            { role: 'hideOthers' },
                            { type: 'separator' },
                            {
                                label: 'Keluar dari Squelch',
                                accelerator: 'CmdOrCtrl+Q',
                                click: () =>
                                    void this.requestQuitWithConfirmation()
                            }
                        ]
                    },
                    {
                        label: 'Edit',
                        submenu: [
                            { role: 'undo' },
                            { role: 'redo' },
                            { type: 'separator' },
                            { role: 'cut' },
                            { role: 'copy' },
                            { role: 'paste' },
                            { role: 'selectAll' }
                        ]
                    }
                ])
            );
        }

        if (process.platform === 'darwin' && app.dock) {
            try {
                const appIcon = loadOrCreateMacAppIcon(this.resourcesDir);
                if (!appIcon.isEmpty()) {
                    app.dock.setIcon(appIcon);
                }
            } catch (err) {
                this.logger.warn('Failed to set dock icon', {
                    err: err instanceof Error ? err.message : String(err)
                });
            }
        }

        this.settingsRepository = new SettingsRepository(
            dataDir,
            this.eventBus
        );
        this.stationRepository = new StationRepository({
            dataDir,
            seedFilePath: path.join(this.resourcesDir, 'stations.seed.json'),
            eventBus: this.eventBus
        });
        this.listeningTracker = new ListeningTracker(dataDir, this.eventBus);
        this.radioBrowserClient = new RadioBrowserClient();
        this.scheduleRepository = new ScheduleRepository(dataDir);

        this.ensureJakFmPresent();

        const initialSettings = this.settingsRepository.getSettings();
        const runtimeState = this.settingsRepository.getRuntimeState();

        this.windowManager = new WindowManager({
            onAudioPlaying: () => this.playerController.notifyAudioPlaying(),
            onAudioBuffering: () =>
                this.playerController.notifyAudioBuffering(),
            onAudioError: (msg) => {
                this.logger.warn('Audio error reported', { msg });
                this.playerController.notifyStreamError(msg);
            },
            onAudioDeviceRemoved: () => {
                this.logger.info(
                    'Audio output device unplugged; pausing playback'
                );
                void this.playerController.handleSystemSleepOrAudioInterrupt();
            },
            onMediaAction: (action) => {
                if (action === 'play' || action === 'pause') {
                    this.handleTogglePlayPause();
                } else if (action === 'nexttrack') {
                    this.handleNextOrPrevStation(1);
                } else if (action === 'previoustrack') {
                    this.handleNextOrPrevStation(-1);
                }
            },
            onUiWindowVisibilityChanged: () => {
                // Keep activation policy steady on macOS so NSStatusItem (Tray) never drops from menu bar
            }
        });

        this.playerController = new PlayerController({
            eventBus: this.eventBus,
            audioTransport: this.windowManager,
            autoReconnect: initialSettings.autoReconnect,
            maxReconnectAttempts: initialSettings.maxReconnectAttempts,
            userAgent: initialSettings.userAgent,
            timeoutMs: initialSettings.networkTimeoutMs
        });

        registerIpcHandlers({
            playerController: this.playerController,
            stationRepository: this.stationRepository,
            scheduleRepository: this.scheduleRepository,
            settingsRepository: this.settingsRepository,
            listeningTracker: this.listeningTracker,
            radioBrowserClient: this.radioBrowserClient,
            windowManager: this.windowManager,
            logger: this.logger,
            resourcesDir: this.resourcesDir,
            onSettingsApplied: (updated) => this.applySettings(updated),
            onRequestQuit: () => this.requestQuitWithConfirmation(),
            onToggleTrayPopover: () => {
                const bounds = this.adapters.trayAdapter.getBounds?.() ?? {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
                this.windowManager.toggleTrayPopover(bounds);
            }
        });

        this.adapters.trayAdapter.initialize({
            onTrayClick: (bounds) => {
                this.windowManager.toggleTrayPopover(bounds);
            },
            onTogglePlayPause: () => this.handleTogglePlayPause(),
            onStop: () => {
                void this.playerController.stop();
            },
            onSelectStation: (stationId) => {
                const station =
                    this.stationRepository.getStationById(stationId);
                if (station) {
                    this.settingsRepository.updateRuntimeState({
                        lastStationId: station.id
                    });
                    void this.playerController.play(station);
                }
            },
            onSetSleepTimer: (minutes) => {
                this.playerController.setSleepTimer(minutes);
            },
            onOpenManageStations: () => {
                this.windowManager.openUiWindow('stations');
            },
            onOpenPreferences: () => {
                this.windowManager.openUiWindow('preferences');
            },
            onOpenAbout: () => {
                this.windowManager.openAboutWindow();
            },
            onQuit: () => {
                void this.requestQuitWithConfirmation();
            }
        });
        this.logger.info('Tray adapter initialized', {
            bounds: this.adapters.trayAdapter.getBounds?.()
        });

        await this.playerController.initialize();
        this.logger.info('Player controller initialized');

        this.scheduleRunner = new ScheduleRunner(this.scheduleRepository, {
            onNotify: (title, message) => {
                this.adapters.systemAdapter.showNotification(title, message);
            },
            onAutoPlay: (stationId, showName) => {
                const station =
                    this.stationRepository.getStationById(stationId);
                if (station) {
                    this.logger.info('Autoplay triggered for schedule', {
                        stationId,
                        showName
                    });
                    this.settingsRepository.updateRuntimeState({
                        lastStationId: station.id
                    });
                    void this.playerController.play(station);
                }
            }
        });
        this.scheduleRunner.start();

        this.adapters.systemAdapter.bindPowerEvents?.({
            onSuspend: () => {
                this.logger.info('System going to sleep');
                void this.playerController.handleSystemSleepOrAudioInterrupt();
            },
            onResume: () => {
                this.logger.info('System woke from sleep');
                void this.playerController.handleSystemWake();
            }
        });

        this.bindCoreEvents();
        this.applySettings(initialSettings);
        this.refreshTray();

        // Open the main window on startup so the user sees the app immediately alongside the menu bar tray
        this.windowManager.openUiWindow('stations');

        if (initialSettings.autoPlayLastStation) {
            const stations = this.stationRepository.getStations();
            const target =
                stations.find((s) => s.id === runtimeState.lastStationId) ??
                stations[0];
            if (target) {
                void this.playerController.play(target);
            }
        }
    }

    public openMainWindow(): void {
        this.windowManager?.openUiWindow('stations');
    }

    public isQuitConfirmed(): boolean {
        return this.isConfirmedQuit;
    }

    public async requestQuitWithConfirmation(): Promise<void> {
        if (this.isConfirmedQuit || this.isShowingQuitDialog) return;

        const settings = this.settingsRepository?.getSettings();
        const shouldConfirm = settings?.confirmBeforeQuit ?? true;

        if (!shouldConfirm) {
            this.isConfirmedQuit = true;
            app.quit();
            return;
        }

        this.isShowingQuitDialog = true;
        this.windowManager?.hideTrayPopover();

        const isEn = settings?.language === 'en';
        const appIcon = loadOrCreateMacAppIcon(this.resourcesDir);

        try {
            const res = await dialog.showMessageBox({
                type: 'question',
                icon: appIcon,
                title: isEn ? 'Quit Squelch?' : 'Keluar dari Squelch?',
                message: isEn ? 'Quit Squelch?' : 'Keluar dari Squelch?',
                detail: isEn
                    ? 'Active radio playback in the menu bar will be stopped.'
                    : 'Pemutaran siaran radio di menu bar akan dihentikan.',
                buttons: [
                    isEn ? 'Quit Squelch' : 'Keluar',
                    isEn ? 'Cancel' : 'Batal'
                ],
                defaultId: 0,
                cancelId: 1
            });

            if (res.response === 0) {
                this.isConfirmedQuit = true;
                app.quit();
            }
        } finally {
            this.isShowingQuitDialog = false;
        }
    }

    public async shutdown(): Promise<void> {
        this.adapters.systemAdapter.unregisterAllShortcuts();
        if (this.scheduleRunner) {
            this.scheduleRunner.stop();
        }
        if (this.listeningTracker) {
            this.listeningTracker.stop();
        }
        if (this.playerController) {
            await this.playerController.shutdown();
        }
        if (this.windowManager) {
            this.windowManager.destroyAll();
        }
        this.adapters.trayAdapter.destroy();
    }

    private ensureJakFmPresent(): void {
        const stations = this.stationRepository.getStations();
        const hasJakFm = stations.some(
            (s) =>
                s.id === 'jak-101-fm-jakarta' ||
                s.streamUrl.includes('noice_jakfm')
        );
        if (!hasJakFm) {
            this.stationRepository.upsertStation({
                id: 'jak-101-fm-jakarta',
                name: 'Jak 101 FM Jakarta',
                streamUrl:
                    'https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8',
                streamType: 'hls',
                logoUrl:
                    'https://images.noiceid.cc/catalog/content-1614529857498.jpg',
                genre: 'Pop / Adult Contemporary',
                city: 'Jakarta',
                country: 'ID',
                tags: ['pop', 'hits', 'jakarta', 'noice'],
                group: 'Pop & Anak Muda',
                isFavorite: true,
                status: 'online'
            });
        }
    }

    private handleTogglePlayPause(): void {
        const stations = this.stationRepository.getStations();
        const lastId = this.settingsRepository.getRuntimeState().lastStationId;
        const fallback =
            stations.find((s) => s.id === lastId) ?? stations[0] ?? null;
        void this.playerController.togglePlayPause(fallback);
    }

    private handleNextOrPrevStation(direction: 1 | -1): void {
        const stations = this.stationRepository.getStations();
        if (stations.length === 0) return;
        const currentId =
            this.playerController.getCurrentStation()?.id ??
            this.settingsRepository.getRuntimeState().lastStationId;
        const idx = stations.findIndex((s) => s.id === currentId);
        const nextIdx =
            idx === -1
                ? 0
                : (idx + direction + stations.length) % stations.length;
        const nextStation = stations[nextIdx];
        if (nextStation) {
            this.settingsRepository.updateRuntimeState({
                lastStationId: nextStation.id
            });
            void this.playerController.play(nextStation);
        }
    }

    private applySettings(settings: AppSettings): void {
        nativeTheme.themeSource = settings.theme || 'system';

        this.playerController.setAutoReconnect(
            settings.autoReconnect,
            settings.maxReconnectAttempts
        );
        this.playerController.setNetworkConfig({
            userAgent: settings.userAgent,
            timeoutMs: settings.networkTimeoutMs
        });
        this.adapters.systemAdapter.setLaunchAtLogin(settings.launchAtLogin);

        this.adapters.systemAdapter.registerGlobalShortcuts(
            settings.shortcuts,
            {
                onPlayPause: () => this.handleTogglePlayPause(),
                onNextStation: () => this.handleNextOrPrevStation(1),
                onPrevStation: () => this.handleNextOrPrevStation(-1)
            }
        );

        this.refreshTray();
    }

    private bindCoreEvents(): void {
        this.eventBus.on('player:state-changed', (evt) => {
            this.lastErrorMessage = evt.errorMessage;
            this.refreshTray();
            this.windowManager.broadcastToUi({
                type: 'player-state',
                payload: evt
            });
        });

        this.eventBus.on('player:metadata-changed', (meta) => {
            const prevTitle = this.latestMetadata?.streamTitle;
            this.latestMetadata = meta;
            this.refreshTray();
            this.windowManager.broadcastToUi({
                type: 'metadata',
                payload: meta
            });

            const settings = this.settingsRepository.getSettings();
            if (
                settings.notifyOnSongChange &&
                meta.streamTitle &&
                meta.streamTitle !== prevTitle
            ) {
                this.adapters.systemAdapter.showNotification(
                    meta.stationName,
                    `♪ ${meta.streamTitle}`
                );
            }
        });

        this.eventBus.on('player:sleep-timer-changed', (sleep) => {
            this.refreshTray();
            this.windowManager.broadcastToUi({
                type: 'sleep-timer',
                payload: sleep
            });

            if (sleep.remainingSeconds === 60) {
                this.showOneMinuteSleepWarning();
            }
        });

        this.eventBus.on('stations:updated', (data) => {
            this.refreshTray();
            this.windowManager.broadcastToUi({
                type: 'stations',
                payload: data
            });
        });

        this.eventBus.on('settings:updated', (settings) => {
            this.refreshTray();
            this.windowManager.broadcastToUi({
                type: 'settings',
                payload: settings
            });
        });
    }

    private showOneMinuteSleepWarning(): void {
        const settings = this.settingsRepository.getSettings();
        const isEn = settings.language === 'en';

        if (Notification.isSupported()) {
            const notif = new Notification({
                title: isEn
                    ? 'Sleep Timer · 60s Remaining'
                    : 'Sleep Timer · Tersisa 60 Detik',
                body: isEn
                    ? 'Radio playback will stop in 1 minute. Click to cancel sleep timer.'
                    : 'Siaran radio akan berhenti dalam 1 menit. Klik untuk membatalkan sleep.',
                actions: [
                    {
                        type: 'button',
                        text: isEn ? 'Cancel Sleep' : 'Batalkan Sleep'
                    }
                ]
            });

            notif.on('action', () => {
                this.playerController.setSleepTimer(null);
            });

            notif.on('click', () => {
                this.playerController.setSleepTimer(null);
            });

            notif.show();
        }

        const bounds = this.adapters.trayAdapter.getBounds?.() ?? null;
        this.windowManager.showTrayPopoverForSleepAlert(bounds);
    }

    private refreshTray(): void {
        const sleep = this.playerController.getSleepTimerState();
        const settings = this.settingsRepository.getSettings();
        this.adapters.trayAdapter.update({
            playerState: this.playerController.getState(),
            currentStation: this.playerController.getCurrentStation(),
            metadata: this.latestMetadata,
            stations: this.stationRepository.getStations(),
            groups: this.stationRepository.getGroups(),
            sleepTimerMinutes: sleep.durationMinutes,
            sleepTimerRemainingSec: sleep.remainingSeconds,
            showTitleInMenuBar: settings.showTitleInMenuBar,
            language: settings.language,
            errorMessage: this.lastErrorMessage
        });
    }
}

const squelchApp = new SquelchApplication();

app.whenReady().then(async () => {
    await squelchApp.bootstrap();
});

app.on('activate', () => {
    squelchApp.openMainWindow();
});

app.on('second-instance', () => {
    squelchApp.openMainWindow();
});

app.on('window-all-closed', () => {
    // Keep application alive in menu bar when all windows are closed
});

app.on('before-quit', (event) => {
    if (!squelchApp.isQuitConfirmed()) {
        event.preventDefault();
        void squelchApp.requestQuitWithConfirmation();
        return;
    }
    void squelchApp.shutdown();
});
