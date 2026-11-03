import React from 'react';
import type { TranslationDictionary } from '../../i18n';

export interface TraySleepBannerProps {
    sleepRemainingSec: number | null;
    onCancel: () => void;
    t: TranslationDictionary;
}

export const TraySleepBanner: React.FC<TraySleepBannerProps> = ({
    sleepRemainingSec,
    onCancel,
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
            className="mac-settings-card animate-collapse-enter mb-2.5 px-3 py-2 border border-[#FF9F0A]/45 bg-[#FF9F0A]/15 flex items-center justify-between gap-2.5"
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#FF9F0A] text-white flex items-center justify-center font-bold text-[11px] tabular-nums shrink-0 animate-pulse">
                    {sleepRemainingSec}s
                </div>
                <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">
                        {t.sleepCountdownTitle}
                    </div>
                    <div className="text-[10px] text-secondary truncate tabular-nums">
                        {t.sleepCountdownDesc.replace(
                            '{sec}',
                            String(sleepRemainingSec)
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1 rounded-[6px] bg-[#FF9F0A] text-white text-[10px] font-bold shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm"
            >
                {t.sleepCancelBtn}
            </button>
        </div>
    );
};
