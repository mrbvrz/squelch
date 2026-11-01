import React, { useState, useEffect } from 'react';
import type {
    AppSettings,
    ThemeMode
} from '../../core/settings/settings.model';
import type { Translations } from '../i18n/types';
import { ACCENT_SWATCHES } from '../utils/appearance';
import { SquircleAppIcon } from './SquircleAppIcon';
import {
    IconBell,
    IconCheck,
    IconChevronLeft,
    IconChevronRight,
    IconFolder,
    IconGlobe,
    IconPlay,
    IconPower,
    IconRadioTower,
    IconChart
} from './Icons';

export interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (partial: Partial<AppSettings>) => Promise<any>;
    appIconDataUrl: string | null;
    t: Translations;
    lang: 'id' | 'en';
}

const TOTAL_STEPS = 4;

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    appIconDataUrl,
    t,
    lang
}) => {
    const [step, setStep] = useState<number>(0);
    const [notificationPerm, setNotificationPerm] = useState<string>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPerm(Notification.permission);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRequestNotification = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            try {
                const res = await Notification.requestPermission();
                setNotificationPerm(res);
                if (res === 'granted') {
                    void onUpdateSettings({ notifyOnSongChange: true });
                }
            } catch {
                // Ignore permission error
            }
        }
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) {
            setStep((s) => s + 1);
        } else {
            void onUpdateSettings({ hasCompletedOnboarding: true });
            onClose();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep((s) => s - 1);
        }
    };

    const handleSkip = () => {
        void onUpdateSettings({ hasCompletedOnboarding: true });
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-modal-title"
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="mac-modal-surface w-full max-w-lg rounded-2xl shadow-2xl border border-card-border flex flex-col overflow-hidden text-xs max-h-[90vh]"
            >
                {/* Top Navigation Bar: Progress Bar & Skip Button */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b mac-divider">
                    {/* Segmented Step Progress Bar */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                                    idx <= step
                                        ? 'bg-accent shadow-xs'
                                        : 'bg-black/10 dark:bg-white/10'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-secondary tabular-nums">
                            {lang === 'id'
                                ? `Langkah ${step + 1} dari ${TOTAL_STEPS}`
                                : `Step ${step + 1} of ${TOTAL_STEPS}`}
                        </span>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="text-secondary hover:text-foreground text-[11px] font-medium px-2 py-1 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                        >
                            {t.introSkipBtn}
                        </button>
                    </div>
                </div>

                {/* Step Content Area */}
                <div className="p-6 overflow-y-auto flex-1 min-h-[380px] flex flex-col justify-center animate-tab-enter">
                    {/* STEP 0: Welcome to Squelch */}
                    {step === 0 && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <SquircleAppIcon
                                dataUrl={appIconDataUrl}
                                size={72}
                            />
                            <div>
                                <h2
                                    id="onboarding-modal-title"
                                    className="text-[20px] font-bold tracking-tight text-foreground"
                                >
                                    {t.introWelcomeTitle}
                                </h2>
                                <p className="text-[12px] text-secondary leading-relaxed mt-1 max-w-md mx-auto">
                                    {t.introWelcomeSubtitle}
                                </p>
                            </div>

                            <div className="w-full space-y-2.5 text-left mt-2">
                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                                        <IconGlobe size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-foreground">
                                            {t.introWelcomeFeature1Title}
                                        </div>
                                        <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                            {t.introWelcomeFeature1Desc}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0 mt-0.5">
                                        <IconRadioTower size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-foreground">
                                            {t.introWelcomeFeature2Title}
                                        </div>
                                        <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                            {t.introWelcomeFeature2Desc}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#FF9F0A]/15 text-[#FF9F0A] flex items-center justify-center shrink-0 mt-0.5">
                                        <IconChart size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-semibold text-foreground">
                                            {t.introWelcomeFeature3Title}
                                        </div>
                                        <div className="text-[11px] text-secondary mt-0.5 leading-normal">
                                            {t.introWelcomeFeature3Desc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Permissions & System Integration */}
                    {step === 1 && (
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
                                                <span>
                                                    {t.introPermNotifyGranted}
                                                </span>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleRequestNotification
                                                }
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
                                            <span>
                                                {t.introPermStorageActive}
                                            </span>
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
                                                launchAtLogin:
                                                    !settings.launchAtLogin
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
                                        aria-checked={
                                            settings.autoPlayLastStation
                                        }
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
                    )}

                    {/* STEP 2: Appearance & Personalization */}
                    {step === 2 && (
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
                                                <span className="text-[16px]">
                                                    🇮🇩
                                                </span>
                                                <span className="text-[12px]">
                                                    Bahasa Indonesia
                                                </span>
                                            </div>
                                            {settings.language === 'id' && (
                                                <IconCheck
                                                    size={14}
                                                    className="text-accent"
                                                />
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
                                                <span className="text-[16px]">
                                                    🇺🇸
                                                </span>
                                                <span className="text-[12px]">
                                                    English
                                                </span>
                                            </div>
                                            {settings.language === 'en' && (
                                                <IconCheck
                                                    size={14}
                                                    className="text-accent"
                                                />
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
                                                <span className="text-[16px]">
                                                    {thm.icon}
                                                </span>
                                                <span className="text-[11px]">
                                                    {thm.label}
                                                </span>
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
                                                (settings.accentColor ??
                                                    '#0A84FF') === swatch.color;
                                            return (
                                                <button
                                                    key={swatch.color}
                                                    type="button"
                                                    aria-label={swatch.name}
                                                    onClick={() =>
                                                        void onUpdateSettings({
                                                            accentColor:
                                                                swatch.color
                                                        })
                                                    }
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                                                        selected
                                                            ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110'
                                                            : 'hover:scale-105'
                                                    }`}
                                                    style={{
                                                        backgroundColor:
                                                            swatch.color
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
                    )}

                    {/* STEP 3: Ready to Listen */}
                    {step === 3 && (
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/25 animate-pulse-gentle">
                                <IconRadioTower size={32} />
                            </div>

                            <div>
                                <h2
                                    id="onboarding-modal-title"
                                    className="text-[20px] font-bold tracking-tight text-foreground"
                                >
                                    {t.introReadyTitle}
                                </h2>
                                <p className="text-[12px] text-secondary leading-relaxed mt-1 max-w-sm mx-auto">
                                    {t.introReadySubtitle}
                                </p>
                            </div>

                            <div className="w-full space-y-2 text-left mt-2">
                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                                    <span className="text-[16px] shrink-0">
                                        🧭
                                    </span>
                                    <span className="text-[11px] text-secondary leading-normal">
                                        {t.introReadyTip1}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                                    <span className="text-[16px] shrink-0">
                                        ⌨️
                                    </span>
                                    <span className="text-[11px] text-secondary leading-normal">
                                        {t.introReadyTip2}
                                    </span>
                                </div>

                                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                                    <span className="text-[16px] shrink-0">
                                        ⚙️
                                    </span>
                                    <span className="text-[11px] text-secondary leading-normal">
                                        {t.introReadyTip3}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="px-6 py-4 flex items-center justify-between border-t mac-divider bg-black/5 dark:bg-white/5">
                    {step > 0 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="mac-glass-pill px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                        >
                            <IconChevronLeft size={14} />
                            <span>{t.introBackBtn}</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-accent hover:opacity-90 text-white px-5 py-2 rounded-[8px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/20 transition hover:scale-[1.02]"
                    >
                        <span>
                            {step === TOTAL_STEPS - 1
                                ? t.introStartBtn
                                : t.introNextBtn}
                        </span>
                        {step < TOTAL_STEPS - 1 && (
                            <IconChevronRight size={14} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
