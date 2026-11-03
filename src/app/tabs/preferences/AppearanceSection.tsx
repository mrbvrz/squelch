import React from 'react';
import type { AppSettings } from '../../../types';
import type { TranslationDictionary } from '../../../i18n';
import { ACCENT_SWATCHES, applyAppearanceVariables } from '../../../utils/appearance';
import { ThemePreviewCard } from '../../../components/ThemePreviewCard';
import { SearchableFontPicker } from '../../../components/SearchableFontPicker';
import { IconSwatch } from '../../../components/Icons';

export interface AppearanceSectionProps {
    settings: AppSettings;
    systemFonts: string[];
    isLoadingFonts?: boolean;
    onUpdateSettings: (patch: Partial<AppSettings>) => void;
    t: TranslationDictionary;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
    settings,
    systemFonts,
    isLoadingFonts = false,
    onUpdateSettings,
    t
}) => {
    return (
        <div className="relative z-30">
            <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                <IconSwatch size={14} className="text-accent" />
                <span>{t.prefAppearanceSection}</span>
            </h2>
            <div className="mac-settings-card mac-inset-list">
                <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="text-[13px] font-medium">
                            {t.prefThemeLabel}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemePreviewCard
                            mode="system"
                            active={(settings.theme ?? 'system') === 'system'}
                            label={t.prefThemeSystem}
                            onSelect={() => onUpdateSettings({ theme: 'system' })}
                        />
                        <ThemePreviewCard
                            mode="light"
                            active={settings.theme === 'light'}
                            label={t.prefThemeLight}
                            onSelect={() => onUpdateSettings({ theme: 'light' })}
                        />
                        <ThemePreviewCard
                            mode="dark"
                            active={settings.theme === 'dark'}
                            label={t.prefThemeDark}
                            onSelect={() => onUpdateSettings({ theme: 'dark' })}
                        />
                    </div>
                </div>

                {/* Accent Color Swatches */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                    <span className="text-[13px] font-medium">
                        {t.prefAccentLabel}
                    </span>
                    <div className="flex items-center gap-2">
                        {ACCENT_SWATCHES.map((swatch) => {
                            const selected =
                                (
                                    settings.accentColor ?? '#0A84FF'
                                ).toLowerCase() === swatch.hex.toLowerCase();
                            return (
                                <button
                                    key={swatch.id}
                                    type="button"
                                    title={swatch.label}
                                    aria-label={swatch.label}
                                    onClick={() => {
                                        applyAppearanceVariables({
                                            ...settings,
                                            accentColor: swatch.hex
                                        });
                                        onUpdateSettings({
                                            accentColor: swatch.hex
                                        });
                                    }}
                                    className={`w-[17px] h-[17px] rounded-full cursor-pointer transition-transform flex items-center justify-center shrink-0 ${
                                        selected
                                            ? 'scale-110 ring-2 ring-white/90 shadow-xs'
                                            : 'hover:scale-105 opacity-90 hover:opacity-100'
                                    }`}
                                    style={{
                                        backgroundColor: swatch.hex
                                    }}
                                >
                                    {selected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                    )}
                                </button>
                            );
                        })}
                        <div className="relative flex items-center ml-0.5">
                            <input
                                type="color"
                                value={settings.accentColor ?? '#0A84FF'}
                                aria-label="Custom Accent Color"
                                title="Custom Color"
                                onChange={(e) => {
                                    applyAppearanceVariables({
                                        ...settings,
                                        accentColor: e.target.value
                                    });
                                    onUpdateSettings({
                                        accentColor: e.target.value
                                    });
                                }}
                                className="w-[19px] h-[19px] rounded-full cursor-pointer bg-transparent border border-black/15 dark:border-white/20 p-0 overflow-hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Glass Opacity Slider */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                    <div>
                        <div className="text-[13px] font-medium">
                            {t.prefGlassOpacityLabel}
                        </div>
                        <div className="text-[12px] text-secondary mt-0.5">
                            {t.prefGlassOpacityDesc}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <input
                            type="range"
                            min={40}
                            max={100}
                            step={5}
                            value={settings.glassOpacity ?? 90}
                            aria-label={t.prefGlassOpacityLabel}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 90;
                                onUpdateSettings({
                                    glassOpacity: val
                                });
                            }}
                            className="w-32 cursor-pointer"
                            style={{
                                accentColor: 'var(--accent-color)'
                            }}
                        />
                        <span className="text-[12px] font-mono font-medium text-secondary tabular-nums min-w-[36px] text-right">
                            {settings.glassOpacity ?? 90}%
                        </span>
                    </div>
                </div>

                {/* System Font Picker */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-4 relative z-40">
                    <div>
                        <div className="text-[13px] font-medium">
                            {t.prefFontFamilyLabel}
                        </div>
                        <div className="text-[12px] text-secondary mt-0.5">
                            {t.prefFontFamilyDesc}
                        </div>
                    </div>
                    <SearchableFontPicker
                        value={settings.fontFamily ?? 'system'}
                        fonts={systemFonts}
                        isLoading={isLoadingFonts}
                        defaultLabel={t.prefFontSystemDefault}
                        ariaLabel={t.prefFontFamilyLabel}
                        placeholder={t.prefFontSearchPlaceholder}
                        foundLabel={t.prefFontFound}
                        selectedLabel={t.prefFontSelected}
                        loadingLabel={t.prefFontLoading}
                        noMatchLabel={t.prefFontNoMatch}
                        onChange={(selectedFont) => {
                            onUpdateSettings({
                                fontFamily: selectedFont
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
