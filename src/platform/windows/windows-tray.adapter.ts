import { ITrayAdapter, TrayMenuCallbacks, TrayRenderState } from '../types';
import { MacOSTrayAdapter } from '../macos/macos-tray.adapter';

/**
 * Windows Tray Adapter (Phase 2 stub delegating to cross-platform Electron Tray structure)
 */
export class WindowsTrayAdapter implements ITrayAdapter {
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
