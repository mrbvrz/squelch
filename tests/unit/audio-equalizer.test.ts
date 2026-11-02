import { describe, expect, it } from 'vitest';
import {
    createDefaultSettings,
    EQUALIZER_BANDS_META,
    EQUALIZER_PRESETS
} from '../../src/types/settings';

describe('Audio Equalizer (P3 - Web Audio Engine & Presets)', () => {
    it('defines 5 standard frequency bands spanning Sub-Bass to Treble', () => {
        expect(EQUALIZER_BANDS_META).toHaveLength(5);
        expect(EQUALIZER_BANDS_META[0]).toMatchObject({
            freq: 60,
            type: 'lowshelf'
        });
        expect(EQUALIZER_BANDS_META[1]).toMatchObject({
            freq: 250,
            type: 'peaking'
        });
        expect(EQUALIZER_BANDS_META[2]).toMatchObject({
            freq: 1000,
            type: 'peaking'
        });
        expect(EQUALIZER_BANDS_META[3]).toMatchObject({
            freq: 4000,
            type: 'peaking'
        });
        expect(EQUALIZER_BANDS_META[4]).toMatchObject({
            freq: 12000,
            type: 'highshelf'
        });
    });

    it('validates that all equalizer presets contain 5 clamped safe bands (-12 to +12 dB)', () => {
        const presets = Object.entries(EQUALIZER_PRESETS);
        expect(presets.length).toBeGreaterThanOrEqual(5);

        for (const [_name, preset] of presets) {
            expect(preset.bands).toHaveLength(5);
            for (const gain of preset.bands) {
                expect(gain).toBeGreaterThanOrEqual(-12);
                expect(gain).toBeLessThanOrEqual(12);
            }
            expect(preset.labelId).toBeTruthy();
            expect(preset.labelEn).toBeTruthy();
        }

        // Specific preset acoustic characteristics
        expect(EQUALIZER_PRESETS.flat.bands).toEqual([0, 0, 0, 0, 0]);
        expect(EQUALIZER_PRESETS['bass-boost'].bands[0]).toBeGreaterThanOrEqual(
            5
        );
        expect(EQUALIZER_PRESETS['vocal'].bands[2]).toBeGreaterThanOrEqual(4);
        expect(
            EQUALIZER_PRESETS['treble-boost'].bands[4]
        ).toBeGreaterThanOrEqual(6);
    });

    it('initializes default settings with balanced 5s buffer and bit-perfect flat EQ', () => {
        const defaults = createDefaultSettings();
        expect(defaults.bufferLengthSeconds).toBe(5);
        expect(defaults.equalizer).toBeDefined();
        expect(defaults.equalizer.enabled).toBe(false);
        expect(defaults.equalizer.preset).toBe('flat');
        expect(defaults.equalizer.bands).toEqual([0, 0, 0, 0, 0]);
        expect(defaults.equalizer.normalization).toBe(true);
    });
});
