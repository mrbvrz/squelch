import React from 'react';
import type { Translations } from '../i18n/types';
import { SquircleAppIcon } from './SquircleAppIcon';
import {
    IconArrowDownTray,
    IconClose,
    IconGitHub
} from './Icons';

export interface UpdateAsset {
    name: string;
    downloadUrl: string;
    size: number;
}

export interface UpdateCheckResult {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseName: string;
    releaseNotes: string;
    publishedAt: string;
    releaseUrl: string;
    downloadUrl: string;
    assets: UpdateAsset[];
}

export interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    updateInfo: UpdateCheckResult | null;
    appIconDataUrl: string | null;
    onOpenExternalUrl: (url: string) => void;
    t: Translations;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    isOpen,
    onClose,
    updateInfo,
    appIconDataUrl,
    onOpenExternalUrl,
    t
}) => {
    if (!isOpen || !updateInfo) return null;

    const formattedDate = updateInfo.publishedAt
        ? new Date(updateInfo.publishedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
          })
        : '';

    const titleText = t.updatesModalTitle.replace(
        '{ver}',
        `v${updateInfo.latestVersion}`
    );

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-modal-title"
            onClick={onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="mac-modal-surface w-full max-w-lg p-6 space-y-4 text-xs shadow-2xl rounded-2xl flex flex-col max-h-[85vh] animate-scale-enter"
            >
                {/* Header with App Icon and Version Pill */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <SquircleAppIcon
                                dataUrl={appIconDataUrl}
                                size={54}
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-xs text-[10px]">
                                ✨
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3
                                    id="update-modal-title"
                                    className="text-[16px] font-bold text-foreground tracking-tight"
                                >
                                    {titleText}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-[5px] bg-black/10 dark:bg-white/10 text-secondary text-[11px] font-mono tabular-nums">
                                    v{updateInfo.currentVersion}
                                </span>
                                <span className="text-secondary text-[11px]">
                                    ➔
                                </span>
                                <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-bold font-mono tabular-nums">
                                    v{updateInfo.latestVersion}
                                </span>
                                {formattedDate && (
                                    <span className="text-[11px] text-secondary tabular-nums ml-1">
                                        ({formattedDate})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-secondary hover:text-foreground p-1 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                        aria-label="Close"
                    >
                        <IconClose size={16} />
                    </button>
                </div>

                <p className="text-[12px] text-secondary leading-relaxed">
                    {t.updatesModalSubtitle}
                </p>

                {/* Changelog Box */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center justify-between">
                        <span>{t.updatesChangelogLabel}</span>
                        <span className="text-secondary font-normal">
                            {updateInfo.releaseName}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-56 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-card-border font-mono text-[11px] leading-relaxed text-secondary whitespace-pre-wrap select-text">
                        {updateInfo.releaseNotes || 'No changelog provided.'}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t mac-divider flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(updateInfo.releaseUrl)}
                        className="mac-glass-pill px-3.5 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                    >
                        <IconGitHub size={14} />
                        <span>{t.updatesViewNotes}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mac-glass-pill px-4 py-2 rounded-[8px] text-[12px] font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                        >
                            {t.updatesDismiss}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onOpenExternalUrl(updateInfo.downloadUrl)
                            }
                            className="bg-accent hover:opacity-90 text-white px-5 py-2 rounded-[8px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/20 transition hover:scale-[1.02]"
                        >
                            <IconArrowDownTray size={14} />
                            <span>{t.updatesDownloadDmg}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
