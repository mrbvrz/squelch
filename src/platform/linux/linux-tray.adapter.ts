import { ITrayAdapter, TrayMenuCallbacks, TrayRenderState } from '../types';
import { MacOSTrayAdapter } from '../macos/macos-tray.adapter';

/**
 * Linux Tray Adapter (Phase 3 stub using Electron Tray / AppIndicator)
 */
export class LinuxTrayAdapter implements ITrayAdapter {
  private readonly delegate: MacOSTrayAdapter;

  constructor(resourcesDir?: string) {
    this.delegate = new MacOSTrayAdapter(resourcesDir);
  }

  public initialize(callbacks: TrayMenuCallbacks): void {
    this.delegate.initialize(callbacks);
  }

  public update(state: TrayRenderState): void {
    this.delegate.update({ ...state, showTitleInMenuBar: false });
  }

  public destroy(): void {
    this.delegate.destroy();
  }
}
