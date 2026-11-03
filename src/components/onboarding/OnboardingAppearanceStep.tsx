import React from 'react';
import type { AppSettings, ThemeMode } from '../../types';
import type { Translations } from '../../i18n/types';
import { ACCENT_SWATCHES } from '../../utils/appearance';
import { IconCheck } from '../Icons';

export interface OnboardingAppearanceStepProps {
    settings: AppSettings;
    onUpdateSettings: (partial: Partial<AppSettings>) => Promise<any>;
    t: Translations;
}

export const OnboardingAppearanceStep: React.FC<
    OnboardingAppearanceStepProps
> = ({ settings, onUpdateSettings, t }) => {
    return (
        <div className="space-y-4">
            <div className="text-center mb-1">
                <h2
                    id="onboarding-modal-title"
                    className="text-[18px] font-bold text-foreground"
                >
                    {t.introCustomTitle}
                </h2>
                <p className="text-[12px] text-secondary mt-1 max-w-sm mx-auto">
                    {t.introCustomSubtitle}
                </p>
            </div>

            <div className="space-y-3">
                {/* Language Choice */}
                <div className="p-3 rounded-xl mac-settings-card">
                    <div className="text-[12px] font-semibold text-foreground mb-2">
                        {t.introLanguageLabel}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                void onUpdateSettings({
                                    language: 'id'
                                })
                            }
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                                settings.language === 'id'
                                    ? 'border-accent bg-accent/10 font-bold'
                                    : 'border-card-border hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[16px]">🇮🇩</span>
                                <span className="text-[12px]">
                                    Bahasa Indonesia
                                </span>
                            </div>
                            {settings.language === 'id' && (
                                <IconCheck size={14} className="text-accent" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void onUpdateSettings({
                                    language: 'en'
                                })
                            }
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                                settings.language === 'en'
                                    ? 'border-accent bg-accent/10 font-bold'
                                    : 'border-card-border hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[16px]">🇺🇸</span>
                                <span className="text-[12px]">English</span>
                            </div>
                            {settings.language === 'en' && (
                                <IconCheck size={14} className="text-accent" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Theme Mode */}
                <div className="p-3 rounded-xl mac-settings-card">
                    <div className="text-[12px] font-semibold text-foreground mb-2">
                        {t.introThemeLabel}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {
                                mode: 'system' as ThemeMode,
                                label: t.prefThemeSystem,
                                icon: '💻'
                            },
                            {
                                mode: 'light' as ThemeMode,
                                label: t.prefThemeLight,
                                icon: '☀️'
                            },
                            {
                                mode: 'dark' as ThemeMode,
                                label: t.prefThemeDark,
                                icon: '🌙'
                            }
                        ].map((thm) => (
                            <button
                                key={thm.mode}
                                type="button"
                                onClick={() =>
                                    void onUpdateSettings({
                                        theme: thm.mode
                                    })
                                }
                                className={`p-2.5 rounded-lg border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                                    settings.theme === thm.mode
                                        ? 'border-accent bg-accent/10 font-bold'
                                        : 'border-card-border hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                                <span className="text-[16px]">{thm.icon}</span>
                                <span className="text-[11px]">{thm.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent Color Swatches */}
                <div className="p-3 rounded-xl mac-settings-card flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-foreground">
                        {t.introAccentLabel}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {ACCENT_SWATCHES.map((swatch) => {
                            const selected =
                                (settings.accentColor ?? '#0A84FF') ===
                                swatch.hex;
                            return (
                                <button
                                    key={swatch.hex}
                                    type="button"
                                    aria-label={swatch.name}
                                    onClick={() =>
                                        void onUpdateSettings({
                                            accentColor: swatch.hex
                                        })
                                    }
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                                        selected
                                            ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110'
                                            : 'hover:scale-105'
                                    }`}
                                    style={{
                                        backgroundColor: swatch.hex
                                    }}
                                >
                                    {selected && (
                                        <IconCheck
                                            size={12}
                                            className="text-white drop-shadow"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
