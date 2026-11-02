import React from 'react';
import type { EqualizerConfig, EqualizerPresetId } from '../types';
import { EQUALIZER_BANDS_META, EQUALIZER_PRESETS } from '../types';
import type { TranslationDictionary } from '../i18n';
import { MacToggle } from './MacToggle';
import { IconEqualizer, IconRestore } from './Icons';

export interface AudioEqualizerCardProps {
    equalizer: EqualizerConfig | undefined;
    onUpdateEqualizer: (eq: EqualizerConfig) => void;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const AudioEqualizerCard: React.FC<AudioEqualizerCardProps> = ({
    equalizer = {
        enabled: false,
        preset: 'flat',
        bands: [0, 0, 0, 0, 0],
        normalization: true
    },
    onUpdateEqualizer,
    lang,
    t
}) => {
    const isEnabled = equalizer.enabled;

    const handleToggleEnable = (next: boolean) => {
        onUpdateEqualizer({
            ...equalizer,
            enabled: next
        });
    };

    const handleSelectPreset = (presetId: EqualizerPresetId) => {
        if (presetId === 'custom') {
            onUpdateEqualizer({
                ...equalizer,
                preset: 'custom'
            });
            return;
        }

        const presetDef = EQUALIZER_PRESETS[presetId];
        if (presetDef) {
            onUpdateEqualizer({
                ...equalizer,
                preset: presetId,
                bands: [...presetDef.bands]
            });
        }
    };

    const handleBandChange = (index: number, newDb: number) => {
        const nextBands: [number, number, number, number, number] = [
            ...equalizer.bands
        ];
        nextBands[index] = newDb;

        // Determine if matches an existing preset
        let matchedPreset: EqualizerPresetId = 'custom';
        for (const [key, presetDef] of Object.entries(EQUALIZER_PRESETS)) {
            const isMatch = presetDef.bands.every(
                (val, idx) => val === nextBands[idx]
            );
            if (isMatch) {
                matchedPreset = key as EqualizerPresetId;
                break;
            }
        }

        onUpdateEqualizer({
            ...equalizer,
            preset: matchedPreset,
            bands: nextBands
        });
    };

    const handleResetFlat = () => {
        handleSelectPreset('flat');
    };

    const handleToggleNormalization = (next: boolean) => {
        onUpdateEqualizer({
            ...equalizer,
            normalization: next
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[13px] font-bold flex items-center gap-1.5">
                    <IconEqualizer size={14} className="text-accent" />
                    <span>{t.prefEqSection}</span>
                </h2>
                {isEnabled && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider animate-fade-in">
                        {t.prefEqBadgeActive}
                    </span>
                )}
            </div>

            <div className="mac-settings-card mac-inset-list overflow-hidden">
                {/* Master Switch Row */}
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-foreground">
                            {t.prefEqToggle}
                        </div>
                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                            {t.prefEqDesc}
                        </p>
                    </div>
                    <MacToggle
                        checked={isEnabled}
                        label={t.prefEqToggle}
                        onChange={handleToggleEnable}
                    />
                </div>

                {isEnabled && (
                    <div className="border-t mac-divider animate-collapse-enter">
                        {/* Preset Selector Pills */}
                        <div className="px-4 pt-3.5 pb-2">
                            <div className="text-[11px] font-medium text-secondary mb-2">
                                {t.prefEqPresetLabel}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {(
                                    Object.keys(EQUALIZER_PRESETS) as Array<
                                        Exclude<EqualizerPresetId, 'custom'>
                                    >
                                ).map((presetKey) => {
                                    const preset = EQUALIZER_PRESETS[presetKey];
                                    const isSelected =
                                        equalizer.preset === presetKey;
                                    return (
                                        <button
                                            key={presetKey}
                                            type="button"
                                            onClick={() =>
                                                handleSelectPreset(presetKey)
                                            }
                                            className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition cursor-pointer ${
                                                isSelected
                                                    ? 'bg-accent text-white shadow-xs'
                                                    : 'mac-glass-pill text-secondary hover:text-foreground'
                                            }`}
                                        >
                                            {lang === 'id'
                                                ? preset.labelId
                                                : preset.labelEn}
                                        </button>
                                    );
                                })}

                                {equalizer.preset === 'custom' && (
                                    <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-accent/20 text-accent border border-accent/30">
                                        ✨ {t.prefEqCustomNotice}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 5-Band Equalizer Sliders Deck */}
                        <div className="px-4 py-3 bg-black/5 dark:bg-white/5">
                            <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
                                {EQUALIZER_BANDS_META.map((meta, idx) => {
                                    const gainVal = equalizer.bands[idx] ?? 0;
                                    const isPositive = gainVal > 0;
                                    const isNegative = gainVal < 0;

                                    return (
                                        <div
                                            key={meta.freq}
                                            className="flex flex-col items-center gap-1.5"
                                        >
                                            {/* Gain Value readout */}
                                            <span
                                                className={`text-[11px] font-mono font-bold tabular-nums ${
                                                    isPositive
                                                        ? 'text-accent'
                                                        : isNegative
                                                          ? 'text-[#FF9F0A]'
                                                          : 'text-secondary'
                                                }`}
                                            >
                                                {isPositive
                                                    ? `+${gainVal}`
                                                    : gainVal}{' '}
                                                dB
                                            </span>

                                            {/* Slider Track */}
                                            <div className="w-full h-28 flex items-center justify-center py-1">
                                                <input
                                                    type="range"
                                                    min={-12}
                                                    max={12}
                                                    step={1}
                                                    value={gainVal}
                                                    onChange={(e) =>
                                                        handleBandChange(
                                                            idx,
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            ) || 0
                                                        )
                                                    }
                                                    aria-label={`${meta.label} Equalizer Band`}
                                                    className="w-24 -rotate-90 cursor-pointer"
                                                    style={{
                                                        accentColor:
                                                            'var(--accent-color)'
                                                    }}
                                                />
                                            </div>

                                            {/* Frequency & Description Label */}
                                            <div className="text-center">
                                                <div className="text-[11px] font-bold tracking-tight">
                                                    {meta.label}
                                                </div>
                                                <div className="text-[9px] text-secondary truncate max-w-[56px] leading-tight mt-0.5">
                                                    {lang === 'id'
                                                        ? meta.descId
                                                        : meta.descEn}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reset Flat Shortcut Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleResetFlat}
                                    className="mac-glass-pill px-2.5 py-1 rounded-[6px] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer text-secondary hover:text-foreground transition"
                                >
                                    <IconRestore size={12} />
                                    <span>{t.prefEqResetBtn}</span>
                                </button>
                            </div>
                        </div>

                        {/* Dynamics Compressor / Volume Normalization Row */}
                        <div className="px-4 py-3 flex items-center justify-between gap-4 border-t mac-divider">
                            <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-medium text-foreground">
                                    {t.prefEqNormalizationLabel}
                                </div>
                                <div className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                    {t.prefEqNormalizationDesc}
                                </div>
                            </div>
                            <MacToggle
                                checked={equalizer.normalization !== false}
                                label={t.prefEqNormalizationLabel}
                                onChange={handleToggleNormalization}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
