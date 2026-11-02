export type ThemeMode = 'system' | 'light' | 'dark';

export type EqualizerPresetId =
    | 'flat'
    | 'bass-boost'
    | 'vocal'
    | 'treble-boost'
    | 'acoustic'
    | 'rock'
    | 'electronic'
    | 'custom';

export interface EqualizerConfig {
    enabled: boolean;
    preset: EqualizerPresetId;
    bands: [number, number, number, number, number]; // 60Hz, 250Hz, 1kHz, 4kHz, 12kHz in dB (-12 to +12)
    normalization: boolean;
}

export const EQUALIZER_PRESETS: Record<
    Exclude<EqualizerPresetId, 'custom'>,
    {
        labelId: string;
        labelEn: string;
        bands: [number, number, number, number, number];
    }
> = {
    flat: {
        labelId: 'Datar (Flat)',
        labelEn: 'Flat',
        bands: [0, 0, 0, 0, 0]
    },
    'bass-boost': {
        labelId: 'Bass Mantap',
        labelEn: 'Bass Boost',
        bands: [5, 3, 0, 0, 0]
    },
    vocal: {
        labelId: 'Vokal & Talk Show',
        labelEn: 'Vocal / Talk',
        bands: [-2, 1, 4, 3, 1]
    },
    'treble-boost': {
        labelId: 'Treble Jernih',
        labelEn: 'Treble Boost',
        bands: [0, 0, 1, 4, 6]
    },
    acoustic: {
        labelId: 'Akustik Hangat',
        labelEn: 'Acoustic',
        bands: [3, 2, 1, 2, 3]
    },
    rock: {
        labelId: 'Rock & Dinamis',
        labelEn: 'Rock & Energy',
        bands: [4, 2, -1, 2, 4]
    },
    electronic: {
        labelId: 'Elektronik / EDM',
        labelEn: 'Electronic',
        bands: [5, 3, 0, 2, 4]
    }
};

export const EQUALIZER_BANDS_META = [
    {
        freq: 60,
        type: 'lowshelf' as const,
        label: '60 Hz',
        descId: 'Sub-Bass',
        descEn: 'Sub-Bass'
    },
    {
        freq: 250,
        type: 'peaking' as const,
        label: '250 Hz',
        descId: 'Bass Rendah',
        descEn: 'Low-Mid'
    },
    {
        freq: 1000,
        type: 'peaking' as const,
        label: '1 kHz',
        descId: 'Vokal Tengah',
        descEn: 'Midrange'
    },
    {
        freq: 4000,
        type: 'peaking' as const,
        label: '4 kHz',
        descId: 'Artikulasi',
        descEn: 'Presence'
    },
    {
        freq: 12000,
        type: 'highshelf' as const,
        label: '12 kHz',
        descId: 'Treble Udara',
        descEn: 'Air / Treble'
    }
];

export interface GlobalShortcutsConfig {
    playPause: string;
    nextStation: string;
    prevStation: string;
}

export interface AppSettings {
    schemaVersion: number;
    launchAtLogin: boolean;
    autoPlayLastStation: boolean;
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    notifyOnSongChange: boolean;
    showTitleInMenuBar: boolean;
    confirmBeforeQuit: boolean;
    language: 'id' | 'en';
    theme: ThemeMode;
    accentColor: string;
    fontFamily: string;
    glassOpacity: number;
    networkTimeoutMs: number;
    bufferLengthSeconds: number;
    equalizer: EqualizerConfig;
    userAgent: string;
    shortcuts: GlobalShortcutsConfig;
    hasCompletedOnboarding?: boolean;
    autoCheckUpdates?: boolean;
}

export interface AppRuntimeState {
    schemaVersion: number;
    lastStationId: string | null;
}

export function createDefaultSettings(): AppSettings {
    return {
        schemaVersion: 1,
        hasCompletedOnboarding: false,
        autoCheckUpdates: true,
        launchAtLogin: false,
        autoPlayLastStation: false,
        autoReconnect: true,
        maxReconnectAttempts: 8,
        notifyOnSongChange: true,
        showTitleInMenuBar: false,
        confirmBeforeQuit: true,
        language: 'id',
        theme: 'system',
        accentColor: '#0A84FF',
        fontFamily: 'system',
        glassOpacity: 0.9,
        networkTimeoutMs: 12000,
        bufferLengthSeconds: 5,
        equalizer: {
            enabled: false,
            preset: 'flat',
            bands: [0, 0, 0, 0, 0],
            normalization: true
        },
        userAgent: 'Squelch/0.1.0 (macOS)',
        shortcuts: {
            playPause: 'CommandOrControl+Shift+Space',
            nextStation: 'CommandOrControl+Shift+Right',
            prevStation: 'CommandOrControl+Shift+Left'
        }
    };
}
