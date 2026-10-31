import { Menu, NativeImage, Tray } from 'electron';
import { ITrayAdapter, TrayMenuCallbacks, TrayRenderState } from '../types';
import {
    createTrayTemplateImage,
    TRAY_ANIMATION_FRAME_COUNT,
    TrayIconVisualState
} from './tray-icon-generator';

export class MacOSTrayAdapter implements ITrayAdapter {
    private tray: Tray | null = null;
    private callbacks: TrayMenuCallbacks | null = null;
    private lastVisualState: TrayIconVisualState | null = null;
    private latestState: TrayRenderState | null = null;
    private readonly resourcesDir?: string;

    private animationTimer: NodeJS.Timeout | null = null;
    private currentFrame = 0;
    private playingFrames: NativeImage[] = [];
    private bufferingFrames: NativeImage[] = [];
    private idleImage: NativeImage | null = null;
    private errorImage: NativeImage | null = null;

    constructor(resourcesDir?: string) {
        this.resourcesDir = resourcesDir;
    }

    public initialize(callbacks: TrayMenuCallbacks): void {
        this.callbacks = callbacks;

        // Pre-render static and animated frames in memory for zero-CPU menu bar animation
        this.idleImage = createTrayTemplateImage('idle', this.resourcesDir, 0);
        this.errorImage = createTrayTemplateImage(
            'error',
            this.resourcesDir,
            0
        );
        this.playingFrames = Array.from(
            { length: TRAY_ANIMATION_FRAME_COUNT },
            (_, i) => createTrayTemplateImage('playing', this.resourcesDir, i)
        );
        this.bufferingFrames = Array.from(
            { length: TRAY_ANIMATION_FRAME_COUNT },
            (_, i) => createTrayTemplateImage('buffering', this.resourcesDir, i)
        );

        this.tray = new Tray(this.idleImage);
        this.lastVisualState = 'idle';
        this.tray.setToolTip('Squelch');
        this.tray.setTitle('');

        // Left-click toggles the Mole-style modern custom popover window
        this.tray.on('click', (_event, bounds) => {
            this.callbacks?.onTrayClick(bounds);
        });

        // Right-click opens quick native fallback context menu
        this.tray.on('right-click', () => {
            if (!this.tray || !this.callbacks) return;
            const isPlaying =
                this.latestState?.playerState === 'playing' ||
                this.latestState?.playerState === 'buffering' ||
                this.latestState?.playerState === 'connecting';
            const isEn = this.latestState?.language === 'en';

            const menu = Menu.buildFromTemplate([
                {
                    label: isPlaying
                        ? isEn
                            ? 'Pause Stream'
                            : 'Jeda Siaran'
                        : isEn
                          ? 'Play Stream'
                          : 'Putar Siaran',
                    click: () => this.callbacks?.onTogglePlayPause()
                },
                {
                    label: isEn ? 'Stop Stream' : 'Hentikan Siaran',
                    enabled: this.latestState?.playerState !== 'idle',
                    click: () => this.callbacks?.onStop()
                },
                { type: 'separator' },
                {
                    label: isEn ? 'Radio Stations…' : 'Stasiun Radio…',
                    click: () => this.callbacks?.onOpenManageStations()
                },
                {
                    label: isEn ? 'Preferences…' : 'Pengaturan…',
                    click: () => this.callbacks?.onOpenPreferences()
                },
                {
                    label: isEn ? 'About Squelch…' : 'Tentang Squelch…',
                    click: () => this.callbacks?.onOpenAbout()
                },
                { type: 'separator' },
                {
                    label: isEn ? 'Quit Squelch' : 'Keluar dari Squelch',
                    click: () => this.callbacks?.onQuit()
                }
            ]);
            this.tray.popUpContextMenu(menu);
        });
    }

    public update(state: TrayRenderState): void {
        if (!this.tray) return;
        this.latestState = state;

        const visualState = this.mapToVisualState(state.playerState);
        if (visualState !== this.lastVisualState) {
            this.lastVisualState = visualState;
            this.applyVisualState(visualState);
        }

        // Never show station/song title text next to the menu bar icon; keep only the animated icon
        this.tray.setTitle('');

        const stationName = state.currentStation?.name ?? '';
        const songTitle = state.metadata?.streamTitle ?? '';

        if (state.playerState === 'playing' && stationName) {
            const tooltipText = songTitle
                ? `${stationName} · ${songTitle}`
                : `${stationName} (On Air)`;
            this.tray.setToolTip(tooltipText);
        } else {
            this.tray.setToolTip(
                stationName
                    ? `Squelch · ${stationName} (${state.playerState})`
                    : 'Squelch'
            );
        }
    }

    public getBounds(): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null {
        if (!this.tray) return null;
        return this.tray.getBounds();
    }

    public destroy(): void {
        this.stopAnimation();
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
        }
    }

    private applyVisualState(visualState: TrayIconVisualState): void {
        if (!this.tray) return;

        if (visualState === 'playing' || visualState === 'buffering') {
            this.startAnimation(visualState);
        } else {
            this.stopAnimation();
            const staticImg =
                visualState === 'error' ? this.errorImage : this.idleImage;
            if (staticImg) {
                this.tray.setImage(staticImg);
            }
        }
    }

    private startAnimation(mode: 'playing' | 'buffering'): void {
        this.stopAnimation();
        if (!this.tray) return;

        const frames =
            mode === 'playing' ? this.playingFrames : this.bufferingFrames;
        if (frames.length === 0) return;

        this.currentFrame = 0;
        this.tray.setImage(frames[0]);

        const intervalMs = mode === 'playing' ? 115 : 140;
        this.animationTimer = setInterval(() => {
            if (!this.tray) return;
            this.currentFrame = (this.currentFrame + 1) % frames.length;
            this.tray.setImage(frames[this.currentFrame]);
        }, intervalMs);
    }

    private stopAnimation(): void {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
    }

    private mapToVisualState(
        playerState: TrayRenderState['playerState']
    ): TrayIconVisualState {
        switch (playerState) {
            case 'playing':
                return 'playing';
            case 'connecting':
            case 'buffering':
            case 'reconnecting':
                return 'buffering';
            case 'error':
                return 'error';
            case 'idle':
            case 'paused':
            default:
                return 'idle';
        }
    }
}
