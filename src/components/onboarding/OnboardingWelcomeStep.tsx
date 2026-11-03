import React from 'react';
import type { Translations } from '../../i18n/types';
import { SquircleAppIcon } from '../SquircleAppIcon';
import { IconGlobe, IconRadioTower, IconChart } from '../Icons';

export interface OnboardingWelcomeStepProps {
    appIconDataUrl: string | null;
    t: Translations;
}

export const OnboardingWelcomeStep: React.FC<OnboardingWelcomeStepProps> = ({
    appIconDataUrl,
    t
}) => {
    return (
        <div className="flex flex-col items-center text-center space-y-4">
            <SquircleAppIcon dataUrl={appIconDataUrl} size={72} />
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
    );
};
