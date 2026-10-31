import { BrowserWindow, ipcMain, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AudioTransport } from '../core/player/player-controller';
import { TrayIconBounds } from '../platform/types';

export interface WindowManagerCallbacks {
    onAudioPlaying: () => void;
    onAudioBuffering: () => void;
    onAudioError: (message: string) => void;
    onAudioDeviceRemoved: () => void;
    onMediaAction: (
        action: 'play' | 'pause' | 'nexttrack' | 'previoustrack'
    ) => void;
    onUiWindowVisibilityChanged: (hasOpenWindow: boolean) => void;
}

export class WindowManager implements AudioTransport {
    private audioWindow: BrowserWindow | null = null;
    private audioReadyPromise: Promise<void> | null = null;
    private trayPopoverWindow: BrowserWindow | null = null;
    private mainWindow: BrowserWindow | null = null;
    private aboutWindow: BrowserWindow | null = null;
    private readonly callbacks: WindowManagerCallbacks;

    constructor(callbacks: WindowManagerCallbacks) {
        this.callbacks = callbacks;
        this.registerAudioIpcListeners();
    }

    public async ensureAudioWorkerWindow(): Promise<BrowserWindow> {
        if (this.audioWindow && !this.audioWindow.isDestroyed()) {
            if (this.audioReadyPromise) {
                await this.audioReadyPromise;
            }
            return this.audioWindow;
        }

        const preloadPath = path.join(__dirname, 'preload.js');
        this.audioWindow = new BrowserWindow({
            width: 100,
            height: 100,
            show: false,
            skipTaskbar: true,
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
                backgroundThrottling: false
            }
        });

        const audioHtmlDist = path.resolve(
            __dirname,
            '../../dist-ui/audio.html'
        );
        const audioHtmlFallback = path.resolve(
            __dirname,
            '../../src/ui/audio-worker/audio.html'
        );

        const targetHtml = fs.existsSync(audioHtmlDist)
            ? audioHtmlDist
            : audioHtmlFallback;

        this.audioReadyPromise = new Promise<void>((resolve) => {
            this.audioWindow?.webContents.once('did-finish-load', () => {
                resolve();
            });
        });

        await this.audioWindow.loadFile(targetHtml);
        await this.audioReadyPromise;
        return this.audioWindow;
    }

    public async playSource(params: {
        url: string;
        isHls: boolean;
        stationName: string;
        streamTitle: string | null;
        logoUrl: string | null;
    }): Promise<void> {
        const win = await this.ensureAudioWorkerWindow();
        win.webContents.send('audio:command', {
            type: 'play',
            ...params
        });
    }

    public async pause(): Promise<void> {
        if (!this.audioWindow || this.audioWindow.isDestroyed()) return;
        this.audioWindow.webContents.send('audio:command', { type: 'pause' });
    }

    public async stop(): Promise<void> {
        if (!this.audioWindow || this.audioWindow.isDestroyed()) return;
        this.audioWindow.webContents.send('audio:command', { type: 'stop' });
    }

    public async updateMediaSessionMetadata(meta: {
        stationName: string;
        streamTitle: string | null;
        logoUrl: string | null;
    }): Promise<void> {
        if (!this.audioWindow || this.audioWindow.isDestroyed()) return;
        this.audioWindow.webContents.send('audio:command', {
            type: 'metadata',
            ...meta
        });
    }

    /**
     * Toggles the native macOS blurred vibrancy popover window anchored directly
     * underneath the menu bar tray icon.
     */
    public toggleTrayPopover(bounds: TrayIconBounds): void {
        if (this.trayPopoverWindow && !this.trayPopoverWindow.isDestroyed()) {
            if (this.trayPopoverWindow.isVisible()) {
                this.trayPopoverWindow.hide();
                return;
            }
            this.positionPopoverNearTray(this.trayPopoverWindow, bounds);
            this.trayPopoverWindow.show();
            this.trayPopoverWindow.focus();
            return;
        }

        const preloadPath = path.join(__dirname, 'preload.js');
        const popoverWidth = 372;
        const popoverHeight = 612;

        this.trayPopoverWindow = new BrowserWindow({
            width: popoverWidth,
            height: popoverHeight,
            show: false,
            frame: false,
            transparent: true,
            backgroundColor: '#00000000',
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            hasShadow: true,
            roundedCorners: true,
            vibrancy: 'hud',
            visualEffectState: 'active',
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        if (process.platform === 'darwin') {
            this.trayPopoverWindow.setVisibleOnAllWorkspaces(true, {
                visibleOnFullScreen: true
            });
        }

        const trayHtmlDist = path.resolve(__dirname, '../../dist-ui/tray.html');
        void this.trayPopoverWindow.loadFile(trayHtmlDist);

        this.trayPopoverWindow.once('ready-to-show', () => {
            if (!this.trayPopoverWindow || this.trayPopoverWindow.isDestroyed())
                return;
            this.positionPopoverNearTray(this.trayPopoverWindow, bounds);
            this.trayPopoverWindow.show();
            this.trayPopoverWindow.focus();
        });

        this.trayPopoverWindow.on('blur', () => {
            if (
                this.trayPopoverWindow &&
                !this.trayPopoverWindow.isDestroyed()
            ) {
                this.trayPopoverWindow.hide();
            }
        });
    }

    public hideTrayPopover(): void {
        if (this.trayPopoverWindow && !this.trayPopoverWindow.isDestroyed()) {
            this.trayPopoverWindow.hide();
        }
    }

    public showTrayPopoverForSleepAlert(bounds: TrayIconBounds | null): void {
        if (
            this.mainWindow &&
            !this.mainWindow.isDestroyed() &&
            this.mainWindow.isVisible()
        ) {
            return;
        }
        if (
            this.trayPopoverWindow &&
            !this.trayPopoverWindow.isDestroyed() &&
            this.trayPopoverWindow.isVisible()
        ) {
            return;
        }
        const targetBounds = bounds ?? { x: 800, y: 0, width: 28, height: 22 };
        this.toggleTrayPopover(targetBounds);
    }

    private positionPopoverNearTray(
        win: BrowserWindow,
        bounds: TrayIconBounds
    ): void {
        const [winWidth, winHeight] = win.getSize();
        const primary = screen.getPrimaryDisplay();
        const display =
            bounds.x > 0 && bounds.height > 0
                ? screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
                : primary;
        const workArea = display.workArea;

        // If Bartender or macOS notch hides the status item (x=0 or height=0), anchor at top-right under menu bar
        const isHiddenOrOffscreen =
            bounds.x <= 0 || bounds.height <= 0 || bounds.y > workArea.y + 80;

        let x = isHiddenOrOffscreen
            ? workArea.x + workArea.width - winWidth - 16
            : Math.round(bounds.x + bounds.width / 2 - winWidth / 2);
        let y = isHiddenOrOffscreen
            ? workArea.y + 8
            : Math.round(bounds.y + bounds.height + 6);

        if (x + winWidth > workArea.x + workArea.width - 8) {
            x = workArea.x + workArea.width - winWidth - 8;
        }
        if (x < workArea.x + 8) {
            x = workArea.x + 8;
        }
        if (y < workArea.y) {
            y = workArea.y + 4;
        }
        if (y + winHeight > workArea.y + workArea.height) {
            y = workArea.y + workArea.height - winHeight - 8;
        }

        win.setPosition(x, y, false);
    }

    /**
     * Opens the Manage Stations / Preferences / About window lazily with native macOS vibrancy.
     */
    public openUiWindow(
        initialTab: 'stations' | 'discover' | 'stats' | 'preferences' | 'about'
    ): void {
        this.hideTrayPopover();

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.show();
            this.mainWindow.focus();
            this.mainWindow.webContents.send('ui:state-changed', {
                type: 'navigate',
                tab: initialTab
            });
            this.callbacks.onUiWindowVisibilityChanged(true);
            return;
        }

        const preloadPath = path.join(__dirname, 'preload.js');
        this.mainWindow = new BrowserWindow({
            width: 1040,
            height: 700,
            minWidth: 840,
            minHeight: 560,
            title: 'Squelch',
            titleBarStyle: 'hiddenInset',
            transparent: true,
            backgroundColor: '#00000000',
            hasShadow: true,
            roundedCorners: true,
            vibrancy: 'hud',
            visualEffectState: 'active',
            show: false,
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        const uiHtmlDist = path.resolve(__dirname, '../../dist-ui/index.html');
        void this.mainWindow.loadFile(uiHtmlDist, { hash: initialTab });

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
            this.mainWindow?.focus();
            this.callbacks.onUiWindowVisibilityChanged(true);
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            this.callbacks.onUiWindowVisibilityChanged(false);
        });
    }

    /**
     * Opens the dedicated macOS About dialog window.
     */
    public openAboutWindow(): void {
        if (this.aboutWindow && !this.aboutWindow.isDestroyed()) {
            this.aboutWindow.show();
            this.aboutWindow.focus();
            return;
        }

        const preloadPath = path.join(__dirname, 'preload.js');
        this.aboutWindow = new BrowserWindow({
            width: 480,
            height: 520,
            resizable: false,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            title: 'Tentang Squelch',
            titleBarStyle: 'hiddenInset',
            transparent: true,
            backgroundColor: '#00000000',
            hasShadow: true,
            roundedCorners: true,
            vibrancy: 'hud',
            visualEffectState: 'active',
            show: false,
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        const uiHtmlDist = path.resolve(__dirname, '../../dist-ui/index.html');
        void this.aboutWindow.loadFile(uiHtmlDist, { hash: 'about-window' });

        this.aboutWindow.once('ready-to-show', () => {
            this.aboutWindow?.show();
            this.aboutWindow?.focus();
        });

        this.aboutWindow.on('closed', () => {
            this.aboutWindow = null;
        });
    }

    public broadcastToUi(payload: unknown): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('ui:state-changed', payload);
        }
        if (this.aboutWindow && !this.aboutWindow.isDestroyed()) {
            this.aboutWindow.webContents.send('ui:state-changed', payload);
        }
        if (this.trayPopoverWindow && !this.trayPopoverWindow.isDestroyed()) {
            this.trayPopoverWindow.webContents.send(
                'ui:state-changed',
                payload
            );
        }
    }

    public destroyAll(): void {
        if (this.trayPopoverWindow && !this.trayPopoverWindow.isDestroyed()) {
            this.trayPopoverWindow.destroy();
            this.trayPopoverWindow = null;
        }
        if (this.aboutWindow && !this.aboutWindow.isDestroyed()) {
            this.aboutWindow.destroy();
            this.aboutWindow = null;
        }
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.destroy();
            this.mainWindow = null;
        }
        if (this.audioWindow && !this.audioWindow.isDestroyed()) {
            this.audioWindow.destroy();
            this.audioWindow = null;
        }
    }

    private registerAudioIpcListeners(): void {
        ipcMain.on('audio:playing', () => {
            this.callbacks.onAudioPlaying();
        });
        ipcMain.on('audio:buffering', () => {
            this.callbacks.onAudioBuffering();
        });
        ipcMain.on('audio:error', (_event, message: string) => {
            this.callbacks.onAudioError(message || 'Audio playback error');
        });
        ipcMain.on('audio:device-removed', () => {
            this.callbacks.onAudioDeviceRemoved();
        });
        ipcMain.on(
            'audio:media-action',
            (
                _event,
                action: 'play' | 'pause' | 'nexttrack' | 'previoustrack'
            ) => {
                this.callbacks.onMediaAction(action);
            }
        );
    }
}
