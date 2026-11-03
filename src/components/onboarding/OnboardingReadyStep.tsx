import React from 'react';
import type { Translations } from '../../i18n/types';
import { IconRadioTower } from '../Icons';

export interface OnboardingReadyStepProps {
    t: Translations;
}

export const OnboardingReadyStep: React.FC<OnboardingReadyStepProps> = ({
    t
}) => {
    return (
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
                    <span className="text-[16px] shrink-0">🧭</span>
                    <span className="text-[11px] text-secondary leading-normal">
                        {t.introReadyTip1}
                    </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                    <span className="text-[16px] shrink-0">⌨️</span>
                    <span className="text-[11px] text-secondary leading-normal">
                        {t.introReadyTip2}
                    </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-3">
                    <span className="text-[16px] shrink-0">⚙️</span>
                    <span className="text-[11px] text-secondary leading-normal">
                        {t.introReadyTip3}
                    </span>
                </div>
            </div>
        </div>
    );
};
