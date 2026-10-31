import { ISystemIntegrationAdapter, ITrayAdapter } from './types';
import { MacOSTrayAdapter } from './macos/macos-tray.adapter';
import { MacOSSystemAdapter } from './macos/macos-system.adapter';
import { WindowsTrayAdapter } from './windows/windows-tray.adapter';
import { WindowsSystemAdapter } from './windows/windows-system.adapter';
import { LinuxTrayAdapter } from './linux/linux-tray.adapter';
import { LinuxSystemAdapter } from './linux/linux-system.adapter';

export function createPlatformAdapters(resourcesDir?: string): {
  trayAdapter: ITrayAdapter;
  systemAdapter: ISystemIntegrationAdapter & {
    bindPowerEvents?: (cb: {
      onSuspend: () => void;
      onResume: () => void;
    }) => void;
  };
} {
  switch (process.platform) {
    case 'darwin':
      return {
        trayAdapter: new MacOSTrayAdapter(resourcesDir),
        systemAdapter: new MacOSSystemAdapter()
      };
    case 'win32':
      return {
        trayAdapter: new WindowsTrayAdapter(resourcesDir),
        systemAdapter: new WindowsSystemAdapter()
      };
    default:
      return {
        trayAdapter: new LinuxTrayAdapter(resourcesDir),
        systemAdapter: new LinuxSystemAdapter()
      };
  }
}
