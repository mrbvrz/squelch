import React from 'react';
import type { AppSettings } from '../../../types';
import { SUPPORTED_LOCALES, type TranslationDictionary } from '../../../i18n';
import { MacSelect } from '../../../components/MacSelect';
import { MacToggle } from '../../../components/MacToggle';
import { IconCompass } from '../../../components/Icons';

export interface GeneralSectionProps {
    settings: AppSettings;
    lang: 'id' | 'en';
    onUpdateSettings: (patch: Partial<AppSettings>) => void;
    onOpenOnboarding: () => void;
    t: TranslationDictionary;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
    settings,
    lang,
    onUpdateSettings,
    onOpenOnboarding,
    t
}) => {
    return (
        <div className="relative z-20">
            <h2 className="text-[13px] font-bold mb-2 px-1">
                {t.prefGeneral}
            </h2>
            <div className="mac-settings-card mac-inset-list">
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.prefLanguage}
                    </span>
                    <MacSelect
                        value={settings.language}
                        ariaLabel={t.prefLanguage}
                        onChange={(nextLang) =>
                            onUpdateSettings({
                                language: nextLang as AppSettings['language']
                            })
                        }
                        options={SUPPORTED_LOCALES.map((loc) => ({
                            value: loc.code,
                            label: loc.nativeName,
                            icon: (
                                <span className="text-[13px] shrink-0">
                                    {loc.flag}
                                </span>
                            )
                        }))}
                        widthClass="w-[160px]"
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.prefConfirmQuit}
                    </span>
                    <MacToggle
                        checked={settings.confirmBeforeQuit ?? true}
                        label={t.prefConfirmQuit}
                        onChange={(next) =>
                            onUpdateSettings({
                                confirmBeforeQuit: next
                            })
                        }
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.prefLaunchAtLogin}
                    </span>
                    <MacToggle
                        checked={settings.launchAtLogin}
                        label={t.prefLaunchAtLogin}
                        onChange={(next) =>
                            onUpdateSettings({
                                launchAtLogin: next
                            })
                        }
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                        <span className="text-[13px] font-medium block">
                            {t.prefHideFromDock}
                        </span>
                        <span className="text-[11px] text-secondary block mt-0.5">
                            {t.prefHideFromDockDesc}
                        </span>
                    </div>
                    <MacToggle
                        checked={settings.hideFromDock ?? false}
                        label={t.prefHideFromDock}
                        onChange={(next) =>
                            onUpdateSettings({
                                hideFromDock: next
                            })
                        }
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.prefAutoPlay}
                    </span>
                    <MacToggle
                        checked={settings.autoPlayLastStation}
                        label={t.prefAutoPlay}
                        onChange={(next) =>
                            onUpdateSettings({
                                autoPlayLastStation: next
                            })
                        }
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.prefNotifySong}
                    </span>
                    <MacToggle
                        checked={settings.notifyOnSongChange}
                        label={t.prefNotifySong}
                        onChange={(next) =>
                            onUpdateSettings({
                                notifyOnSongChange: next
                            })
                        }
                    />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                        <div className="text-[13px] font-medium">
                            {t.introReopenBtn}
                        </div>
                        <div className="text-[12px] text-secondary mt-0.5">
                            {lang === 'id'
                                ? 'Tampilkan kembali panduan langkah awal dan integrasi sistem.'
                                : 'Re-open the initial setup guide and system integration.'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenOnboarding}
                        className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                    >
                        <IconCompass size={14} />
                        <span>{t.introReopenBtn}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
