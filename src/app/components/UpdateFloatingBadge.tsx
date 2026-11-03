import React from 'react';
import type { UpdateDownloadProgress } from '../../components/UpdateModal';
import type { TranslationDictionary } from '../../i18n';
import { IconCheck, IconSpinner } from '../../components/Icons';

export interface UpdateFloatingBadgeProps {
    updateDownloadProgress?: UpdateDownloadProgress | null;
    isUpdateModalOpen: boolean;
    onOpenUpdateModal: () => void;
    t: TranslationDictionary;
}

export const UpdateFloatingBadge: React.FC<UpdateFloatingBadgeProps> = ({
    updateDownloadProgress,
    isUpdateModalOpen,
    onOpenUpdateModal,
    t
}) => {
    if (isUpdateModalOpen || !updateDownloadProgress) {
        return null;
    }

    if (updateDownloadProgress.status === 'downloading') {
        return (
            <button
                type="button"
                onClick={onOpenUpdateModal}
                className="fixed bottom-4 right-4 z-40 mac-modal-surface shadow-2xl border border-accent/40 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-fade-in hover:scale-[1.02] transition cursor-pointer text-xs"
                title="Klik untuk membuka jendela pembaruan"
            >
                <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <IconSpinner size={13} className="animate-spin" />
                </div>
                <div className="text-left">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{t.updatesDownloadingBadge}</span>
                        <span className="font-mono text-accent text-[11px] font-bold tabular-nums">
                            {updateDownloadProgress.percent.toFixed(0)}%
                        </span>
                    </div>
                    <div className="text-[10px] text-secondary">
                        {t.updatesBackgroundNote}
                    </div>
                </div>
            </button>
        );
    }

    if (updateDownloadProgress.status === 'completed') {
        return (
            <button
                type="button"
                onClick={onOpenUpdateModal}
                className="fixed bottom-4 right-4 z-40 mac-modal-surface shadow-2xl border border-[#30D158]/50 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-fade-in hover:scale-[1.02] transition cursor-pointer text-xs"
                title="Klik untuk memasang pembaruan"
            >
                <div className="w-6 h-6 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center shrink-0">
                    <IconCheck size={14} />
                </div>
                <div className="text-left">
                    <div className="font-semibold text-foreground">
                        {t.updatesDownloadedBadge}
                    </div>
                    <div className="text-[10px] text-secondary">
                        {t.updatesReadySubtitle}
                    </div>
                </div>
            </button>
        );
    }

    return null;
};
