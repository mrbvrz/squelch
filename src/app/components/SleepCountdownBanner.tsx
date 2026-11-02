import React from 'react';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';

export interface SleepCountdownBannerProps {
    sleepRemainingSec: number | null;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const SleepCountdownBanner: React.FC<SleepCountdownBannerProps> = ({
    sleepRemainingSec,
    api,
    t
}) => {
    if (
        sleepRemainingSec === null ||
        sleepRemainingSec <= 0 ||
        sleepRemainingSec > 60
    ) {
        return null;
    }

    return (
        <div
            role="alert"
            className="max-w-3xl mb-4 mac-settings-card animate-collapse-enter px-4 py-3 border border-[#FF9F0A]/45 bg-[#FF9F0A]/15 flex items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[8px] bg-[#FF9F0A] text-white flex items-center justify-center font-bold text-xs tabular-nums shrink-0 animate-pulse shadow-sm">
                    {sleepRemainingSec}s
                </div>
                <div className="min-w-0">
                    <div className="text-[13px] font-bold leading-tight">
                        {t.sleepCountdownTitle}
                    </div>
                    <div className="text-[12px] text-secondary tabular-nums mt-0.5">
                        {t.sleepCountdownDesc.replace(
                            '{sec}',
                            String(sleepRemainingSec)
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => void api.setSleepTimer(null)}
                className="px-3.5 py-1.5 rounded-[7px] bg-[#FF9F0A] text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm"
            >
                {t.sleepCancelBtn}
            </button>
        </div>
    );
};
