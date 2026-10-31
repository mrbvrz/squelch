import { app, globalShortcut, Notification, powerMonitor } from 'electron';
import * as path from 'path';
import { ISystemIntegrationAdapter } from '../types';

export class MacOSSystemAdapter implements ISystemIntegrationAdapter {
  private powerListenersRegistered = false;

  public getAppDataPath(): string {
    return path.join(app.getPath('appData'), 'Squelch');
  }

  public setDockVisible(visible: boolean): void {
    if (process.platform !== 'darwin' || !app.dock) return;
    if (visible) {
      void app.dock.show();
    } else {
      app.dock.hide();
    }
  }

  public setLaunchAtLogin(enabled: boolean): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true
      });
    } catch {
      // Ignore if running unpackaged in dev mode
    }
  }

  public getLaunchAtLogin(): boolean {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch {
      return false;
    }
  }

  public showNotification(title: string, body: string): void {
    if (Notification.isSupported()) {
      const notif = new Notification({ title, body, silent: true });
      notif.show();
    }
  }

  public bindPowerEvents(callbacks: {
    onSuspend: () => void;
    onResume: () => void;
  }): void {
    if (this.powerListenersRegistered) return;
    this.powerListenersRegistered = true;

    powerMonitor.on('suspend', () => {
      callbacks.onSuspend();
    });

    powerMonitor.on('resume', () => {
      callbacks.onResume();
    });
  }

  public registerGlobalShortcuts(
    shortcuts: {
      playPause?: string;
      nextStation?: string;
      prevStation?: string;
    },
    handlers: {
      onPlayPause: () => void;
      onNextStation: () => void;
      onPrevStation: () => void;
    }
  ): void {
    this.unregisterAllShortcuts();

    const tryRegister = (accelerator: string | undefined, fn: () => void) => {
      if (!accelerator || !accelerator.trim()) return;
      try {
        globalShortcut.register(accelerator, fn);
      } catch {
        // Ignore invalid or conflicting shortcut registration
      }
    };

    tryRegister(shortcuts.playPause, handlers.onPlayPause);
    tryRegister(shortcuts.nextStation, handlers.onNextStation);
    tryRegister(shortcuts.prevStation, handlers.onPrevStation);

    // Media keys fallback registration
    tryRegister('MediaPlayPause', handlers.onPlayPause);
    tryRegister('MediaNextTrack', handlers.onNextStation);
    tryRegister('MediaPreviousTrack', handlers.onPrevStation);
  }

  public unregisterAllShortcuts(): void {
    globalShortcut.unregisterAll();
  }
}
