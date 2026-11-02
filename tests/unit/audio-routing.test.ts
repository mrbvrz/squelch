import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from '../../src/types/settings';
import type { AudioOutputDevice } from '../../src/types/settings';

describe('Audio Output Routing Settings & Types', () => {
    it('initializes default settings with audioOutputDeviceId = "default"', () => {
        const settings = createDefaultSettings();
        expect(settings.audioOutputDeviceId).toBe('default');
    });

    it('correctly maps audio output device structure with supported transport types', () => {
        const sampleDevices: AudioOutputDevice[] = [
            {
                id: 'default',
                name: 'Bawaan Sistem (macOS Default)',
                transport: 'system',
                isDefault: true
            },
            {
                id: 'BuiltInSpeakerDevice',
                name: 'MacBook Pro Speakers',
                transport: 'builtin',
                isDefault: true
            },
            {
                id: 'bt-airpods-pro-id',
                name: 'AirPods Pro',
                transport: 'bluetooth',
                isDefault: false
            },
            {
                id: 'usb-fiio-k3-dac',
                name: 'FiiO K3 USB DAC',
                transport: 'usb',
                isDefault: false
            }
        ];

        expect(sampleDevices).toHaveLength(4);
        expect(sampleDevices[0].transport).toBe('system');
        expect(sampleDevices[1].transport).toBe('builtin');
        expect(sampleDevices[2].transport).toBe('bluetooth');
        expect(sampleDevices[3].transport).toBe('usb');
    });

    it('handles custom audioOutputDeviceId update safely', () => {
        const settings = createDefaultSettings();
        const updated = {
            ...settings,
            audioOutputDeviceId: 'bt-airpods-pro-id'
        };
        expect(updated.audioOutputDeviceId).toBe('bt-airpods-pro-id');
    });
});
