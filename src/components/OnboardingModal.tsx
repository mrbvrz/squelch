import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import type { Translations } from '../i18n/types';
import { IconChevronLeft, IconChevronRight } from './Icons';
import { OnboardingWelcomeStep } from './onboarding/OnboardingWelcomeStep';
import { OnboardingPermissionsStep } from './onboarding/OnboardingPermissionsStep';
import { OnboardingAppearanceStep } from './onboarding/OnboardingAppearanceStep';
import { OnboardingReadyStep } from './onboarding/OnboardingReadyStep';

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
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
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
                    {step === 0 && (
                        <OnboardingWelcomeStep
                            appIconDataUrl={appIconDataUrl}
                            t={t}
                        />
                    )}
                    {step === 1 && (
                        <OnboardingPermissionsStep
                            settings={settings}
                            onUpdateSettings={onUpdateSettings}
                            notificationPerm={notificationPerm}
                            onRequestNotification={handleRequestNotification}
                            t={t}
                        />
                    )}
                    {step === 2 && (
                        <OnboardingAppearanceStep
                            settings={settings}
                            onUpdateSettings={onUpdateSettings}
                            t={t}
                        />
                    )}
                    {step === 3 && <OnboardingReadyStep t={t} />}
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="px-6 py-4 flex items-center justify-between bg-black/5 dark:bg-white/5">
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
