import { MacOSSystemAdapter } from '../macos/macos-system.adapter';

export class LinuxSystemAdapter extends MacOSSystemAdapter {
  public override setDockVisible(_visible: boolean): void {
    // Linux desktop environments manage panel visibility per window
  }
}
