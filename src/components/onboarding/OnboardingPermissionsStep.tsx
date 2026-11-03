import React from 'react';
import type { AppSettings } from '../../types';
import type { Translations } from '../../i18n/types';
import {
    IconBell,
    IconCheck,
    IconFolder,
    IconPower,
    IconPlay
} from '../Icons';

export interface OnboardingPermissionsStepProps {
    settings: AppSettings;
    onUpdateSettings: (partial: Partial<AppSettings>) => Promise<any>;
    notificationPerm: string;
    onRequestNotification: () => Promise<void>;
    t: Translations;
}

export const OnboardingPermissionsStep: React.FC<OnboardingPermissionsStepProps> = ({
    settings,
    onUpdateSettings,
    notificationPerm,
    onRequestNotification,
    t
}) => {
    return (
        <div className="space-y-4">
            <div className="text-center mb-1">
                <h2
                    id="onboarding-modal-title"
                    className="text-[18px] font-bold text-foreground"
                >
                    {t.introPermsTitle}
                </h2>
                <p className="text-[12px] text-secondary mt-1 max-w-sm mx-auto">
                    {t.introPermsSubtitle}
                </p>
            </div>

            <div className="mac-settings-card mac-inset-list rounded-xl overflow-hidden">
                {/* 1. Notification Permission */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FF2D55]/15 text-[#FF2D55] flex items-center justify-center shrink-0 mt-0.5">
                            <IconBell size={17} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-foreground">
                                {t.introPermNotifyTitle}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                {t.introPermNotifyDesc}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0">
                        {notificationPerm === 'granted' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#30D158]/15 text-[#30D158] text-[11px] font-medium">
                                <IconCheck size={13} />
                                <span>{t.introPermNotifyGranted}</span>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={onRequestNotification}
                                className="bg-accent hover:opacity-90 text-white px-3 py-1.5 rounded-[7px] text-[11px] font-medium cursor-pointer shadow-xs transition"
                            >
                                {t.introPermNotifyBtn}
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Local Storage Access */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shrink-0 mt-0.5">
                            <IconFolder size={17} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-foreground">
                                {t.introPermStorageTitle}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                {t.introPermStorageDesc}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#30D158]/15 text-[#30D158] text-[11px] font-medium">
                            <IconCheck size={13} />
                            <span>{t.introPermStorageActive}</span>
                        </span>
                    </div>
                </div>

                {/* 3. Launch at Login */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#5856D6]/15 text-[#5856D6] flex items-center justify-center shrink-0 mt-0.5">
                            <IconPower size={17} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-foreground">
                                {t.introPermAutostartTitle}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                {t.introPermAutostartDesc}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={settings.launchAtLogin}
                        aria-label={t.introPermAutostartTitle}
                        onClick={() =>
                            void onUpdateSettings({
                                launchAtLogin: !settings.launchAtLogin
                            })
                        }
                        className={`w-10 h-[22px] rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                            settings.launchAtLogin
                                ? 'bg-accent'
                                : 'bg-black/20 dark:bg-white/15'
                        }`}
                    >
                        <span
                            className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                                settings.launchAtLogin
                                    ? 'translate-x-[18px]'
                                    : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* 4. Auto-play Last Station */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/15 text-[#FF9500] flex items-center justify-center shrink-0 mt-0.5">
                            <IconPlay size={17} />
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-foreground">
                                {t.introPermAutoplayTitle}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                {t.introPermAutoplayDesc}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={settings.autoPlayLastStation}
                        aria-label={t.introPermAutoplayTitle}
                        onClick={() =>
                            void onUpdateSettings({
                                autoPlayLastStation:
                                    !settings.autoPlayLastStation
                            })
                        }
                        className={`w-10 h-[22px] rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                            settings.autoPlayLastStation
                                ? 'bg-accent'
                                : 'bg-black/20 dark:bg-white/15'
                        }`}
                    >
                        <span
                            className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                                settings.autoPlayLastStation
                                    ? 'translate-x-[18px]'
                                    : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};
