import { MacOSSystemAdapter } from '../macos/macos-system.adapter';

export class WindowsSystemAdapter extends MacOSSystemAdapter {
    public override setDockVisible(_visible: boolean): void {
        // Windows uses taskbar per window; no macOS Dock API
    }
}
