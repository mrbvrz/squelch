import React from 'react';
import type { TranslationDictionary } from '../../../i18n';
import { IconBell, IconCheck } from '../../../components/Icons';

export interface NotificationSectionProps {
    notifTestSuccess: boolean;
    onTestNotification: () => Promise<void>;
    t: TranslationDictionary;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
    notifTestSuccess,
    onTestNotification,
    t
}) => {
    const isGranted =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted';

    return (
        <div>
            <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                <IconBell size={14} className="text-accent" />
                <span>{t.prefNotifSection}</span>
            </h2>
            <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="text-[13px] font-medium text-foreground">
                            {isGranted
                                ? t.prefNotifStatusGranted
                                : t.prefNotifStatusPrompt}
                        </div>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                                isGranted
                                    ? 'bg-[#30D158]/15 text-[#30D158]'
                                    : 'bg-[#FF9F0A]/15 text-[#FF9F0A]'
                            }`}
                        >
                            {isGranted ? (
                                <>
                                    <IconCheck size={11} />
                                    <span>macOS Active</span>
                                </>
                            ) : (
                                <span>Permission Needed</span>
                            )}
                        </span>
                    </div>
                    <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                        {t.prefNotifDesc}
                    </p>
                    {notifTestSuccess && (
                        <div className="mt-1.5 text-[11px] text-[#30D158] font-medium flex items-center gap-1 animate-fade-in">
                            <IconCheck size={12} />
                            <span>{t.prefNotifTestSuccess}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => void onTestNotification()}
                        className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-xs"
                    >
                        <IconBell size={13} />
                        <span>{t.prefNotifTestBtn}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
