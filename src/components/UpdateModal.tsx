import React from 'react';
import type { Translations } from '../i18n/types';
import { SquircleAppIcon } from './SquircleAppIcon';
import {
    IconArrowDownTray,
    IconClose,
    IconGitHub,
    IconCheck,
    IconSpinner,
    IconWarning,
    IconRestore,
    IconFolder,
    IconExternalLink
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
    fileName?: string;
    assets: UpdateAsset[];
}

export interface UpdateDownloadProgress {
    status: 'idle' | 'downloading' | 'completed' | 'error' | 'cancelled';
    transferred: number;
    total: number;
    percent: number;
    filePath?: string;
    fileName?: string;
    error?: string;
}

export interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    updateInfo: UpdateCheckResult | null;
    appIconDataUrl: string | null;
    onOpenExternalUrl: (url: string) => void;
    t: Translations;
    isChecking?: boolean;
    error?: string | null;
    onCheckAgain?: () => void;
    downloadProgress?: UpdateDownloadProgress | null;
    onStartDownload?: (url: string, filename?: string) => void;
    onCancelDownload?: () => void;
    onInstallUpdate?: (filePath: string) => void;
    onRevealInFinder?: (filePath: string) => void;
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
    isOpen,
    onClose,
    updateInfo,
    appIconDataUrl,
    onOpenExternalUrl,
    t,
    isChecking = false,
    error = null,
    onCheckAgain,
    downloadProgress,
    onStartDownload,
    onCancelDownload,
    onInstallUpdate,
    onRevealInFinder
}) => {
    if (!isOpen) return null;

    const formattedDate = updateInfo?.publishedAt
        ? new Date(updateInfo.publishedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
          })
        : '';

    const dlStatus = downloadProgress?.status || 'idle';

    const titleText = isChecking
        ? t.updatesCheckingTitle
        : error
          ? t.updatesError
          : dlStatus === 'downloading'
            ? t.updatesDownloading
            : dlStatus === 'completed'
              ? t.updatesReadyTitle
              : dlStatus === 'error'
                ? t.updatesDownloadError
                : updateInfo?.hasUpdate
                  ? t.updatesModalTitle.replace(
                        '{ver}',
                        `v${updateInfo.latestVersion}`
                    )
                  : t.updatesUpToDate;

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
                {/* Header: App Icon, Status Headline, and Close Button */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                            <SquircleAppIcon
                                dataUrl={appIconDataUrl}
                                size={52}
                            />
                            {isChecking || dlStatus === 'downloading' ? (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-xs">
                                    <IconSpinner
                                        size={11}
                                        className="animate-spin"
                                    />
                                </div>
                            ) : error || dlStatus === 'error' ? (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF453A] text-white flex items-center justify-center shadow-xs text-[10px]">
                                    !
                                </div>
                            ) : dlStatus === 'completed' ? (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#30D158] text-white flex items-center justify-center shadow-xs">
                                    <IconCheck size={11} />
                                </div>
                            ) : updateInfo?.hasUpdate ? (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-xs text-[10px]">
                                    ✨
                                </div>
                            ) : (
                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#30D158] text-white flex items-center justify-center shadow-xs">
                                    <IconCheck size={11} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <h3
                                id="update-modal-title"
                                className="text-[16px] font-bold text-foreground tracking-tight leading-snug truncate"
                            >
                                {titleText}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="px-2 py-0.5 rounded-[5px] bg-black/10 dark:bg-white/10 text-secondary text-[11px] font-mono tabular-nums">
                                    v{updateInfo?.currentVersion || '0.1.3'}
                                </span>
                                {updateInfo?.hasUpdate && (
                                    <>
                                        <span className="text-secondary text-[11px]">
                                            ➔
                                        </span>
                                        <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-bold font-mono tabular-nums">
                                            v{updateInfo.latestVersion}
                                        </span>
                                        {formattedDate && (
                                            <span className="text-[11px] text-secondary tabular-nums">
                                                ({formattedDate})
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-secondary hover:text-foreground p-1 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
                        aria-label="Close"
                    >
                        <IconClose size={16} />
                    </button>
                </div>

                {/* Body Content depending on state */}
                {isChecking ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <IconSpinner size={24} className="animate-spin" />
                        </div>
                        <p className="text-[12px] text-secondary max-w-sm leading-relaxed">
                            {t.updatesCheckingDesc}
                        </p>
                    </div>
                ) : error ? (
                    <div className="py-4 space-y-3">
                        <div className="p-3.5 rounded-xl bg-[#FF453A]/10 text-[#FF453A] flex items-start gap-2.5 text-[12px] leading-relaxed">
                            <IconWarning
                                size={16}
                                className="shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">
                                    {t.updatesError}
                                </div>
                                <div className="text-[11px] opacity-90 mt-0.5 break-words">
                                    {error}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : dlStatus === 'downloading' && downloadProgress ? (
                    <div className="py-3 space-y-3">
                        <p className="text-[12px] text-secondary leading-relaxed">
                            {t.updatesDownloadDesc}
                        </p>

                        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-card-border space-y-2.5">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="font-semibold text-foreground truncate mr-2">
                                    {downloadProgress.fileName ||
                                        updateInfo?.fileName ||
                                        'Squelch-Update.dmg'}
                                </span>
                                <span className="font-mono text-accent font-bold tabular-nums shrink-0">
                                    {downloadProgress.percent.toFixed(0)}%
                                </span>
                            </div>

                            {/* macOS Animated Progress Bar */}
                            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-150 ease-out"
                                    style={{
                                        width: `${Math.max(4, Math.min(100, downloadProgress.percent))}%`
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-secondary tabular-nums">
                                <span>
                                    {formatBytes(downloadProgress.transferred)}{' '}
                                    dari {formatBytes(downloadProgress.total)}
                                </span>
                                <span>{t.updatesDownloadingBadge}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/15 flex items-start gap-2 text-[11px] text-secondary leading-relaxed">
                            <span className="text-accent text-[12px] shrink-0 mt-0.5">
                                ℹ️
                            </span>
                            <span>{t.updatesBackgroundNote}</span>
                        </div>
                    </div>
                ) : dlStatus === 'completed' && downloadProgress ? (
                    <div className="py-3 space-y-3">
                        <p className="text-[12px] text-secondary leading-relaxed">
                            {t.updatesReadySubtitle}
                        </p>

                        <div className="p-4 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#30D158]/20 text-[#30D158] flex items-center justify-center shrink-0">
                                <IconArrowDownTray size={20} />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                                <div className="text-[13px] font-semibold text-foreground truncate">
                                    {downloadProgress.fileName ||
                                        updateInfo?.fileName ||
                                        'Squelch-Update.dmg'}
                                </div>
                                <div className="text-[11px] text-secondary mt-0.5 flex items-center gap-2">
                                    <span className="tabular-nums font-mono">
                                        {downloadProgress.total > 0
                                            ? formatBytes(
                                                  downloadProgress.total
                                              )
                                            : 'Installer Ready'}
                                    </span>
                                    <span>•</span>
                                    <span className="text-[#30D158] font-medium">
                                        {t.updatesDownloadedBadge}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : dlStatus === 'error' && downloadProgress ? (
                    <div className="py-3 space-y-3">
                        <div className="p-3.5 rounded-xl bg-[#FF453A]/10 text-[#FF453A] flex items-start gap-2.5 text-[12px] leading-relaxed">
                            <IconWarning
                                size={16}
                                className="shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">
                                    {t.updatesDownloadError}
                                </div>
                                <div className="text-[11px] opacity-90 mt-0.5 break-words">
                                    {downloadProgress.error ||
                                        t.updatesDownloadError}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : updateInfo?.hasUpdate ? (
                    <>
                        <p className="text-[12px] text-secondary leading-relaxed">
                            {t.updatesModalSubtitle}
                        </p>

                        {/* Changelog Box */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center justify-between">
                                <span>{t.updatesChangelogLabel}</span>
                                <span className="text-secondary font-normal truncate ml-2">
                                    {updateInfo.releaseName}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-56 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-card-border font-mono text-[11px] leading-relaxed text-secondary whitespace-pre-wrap select-text">
                                {updateInfo.releaseNotes ||
                                    'No changelog provided.'}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#30D158]/15 text-[#30D158] flex items-center justify-center">
                            <IconCheck size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[13px] font-semibold text-foreground">
                                {t.updatesUpToDate}
                            </h4>
                            <p className="text-[12px] text-secondary max-w-sm leading-relaxed">
                                {t.updatesUpToDateDesc}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                    {dlStatus === 'downloading' ? (
                        <>
                            {onCancelDownload ? (
                                <button
                                    type="button"
                                    onClick={onCancelDownload}
                                    className="text-secondary hover:text-[#FF453A] px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium transition cursor-pointer"
                                >
                                    {t.updatesCancelDownload}
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-accent hover:opacity-90 text-white px-5 h-[30px] rounded-[7px] text-[12px] font-semibold cursor-pointer shadow-sm transition"
                            >
                                {t.updatesKeepInBackground}
                            </button>
                        </>
                    ) : dlStatus === 'completed' && downloadProgress ? (
                        <>
                            {downloadProgress.filePath && onRevealInFinder ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onRevealInFinder(
                                            downloadProgress.filePath!
                                        )
                                    }
                                    className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                    <IconFolder size={14} />
                                    <span>{t.updatesRevealFinderBtn}</span>
                                </button>
                            ) : (
                                <div />
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                    {t.updatesDismiss}
                                </button>

                                {downloadProgress.filePath && onInstallUpdate && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onInstallUpdate(
                                                downloadProgress.filePath!
                                            )
                                        }
                                        className="bg-accent hover:opacity-90 text-white px-5 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/20 transition hover:scale-[1.02]"
                                    >
                                        <IconArrowDownTray size={14} />
                                        <span>{t.updatesInstallBtn}</span>
                                    </button>
                                )}
                            </div>
                        </>
                    ) : dlStatus === 'error' && updateInfo ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    onOpenExternalUrl(updateInfo.downloadUrl)
                                }
                                className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                            >
                                <IconExternalLink size={14} />
                                <span>{t.updatesFallbackBrowser}</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer"
                                >
                                    {t.updatesDismiss}
                                </button>
                                {onStartDownload && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onStartDownload(
                                                updateInfo.downloadUrl,
                                                updateInfo.fileName
                                            )
                                        }
                                        className="bg-accent hover:opacity-90 text-white px-4 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                                    >
                                        <IconRestore size={13} />
                                        <span>{t.updatesRetryDownload}</span>
                                    </button>
                                )}
                            </div>
                        </>
                    ) : updateInfo?.hasUpdate && !isChecking && !error ? (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    onOpenExternalUrl(updateInfo.releaseUrl)
                                }
                                className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                            >
                                <IconGitHub size={14} />
                                <span>{t.updatesViewNotes}</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                    {t.updatesDismiss}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (onStartDownload) {
                                            onStartDownload(
                                                updateInfo.downloadUrl,
                                                updateInfo.fileName
                                            );
                                        } else {
                                            onOpenExternalUrl(
                                                updateInfo.downloadUrl
                                            );
                                        }
                                    }}
                                    className="bg-accent hover:opacity-90 text-white px-5 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/20 transition hover:scale-[1.02]"
                                >
                                    <IconArrowDownTray size={14} />
                                    <span>{t.updatesDownloadBackground}</span>
                                </button>
                            </div>
                        </>
                    ) : error ? (
                        <>
                            <div />
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer"
                                >
                                    {t.updatesDismiss}
                                </button>
                                {onCheckAgain && (
                                    <button
                                        type="button"
                                        onClick={onCheckAgain}
                                        className="bg-accent hover:opacity-90 text-white px-4 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                                    >
                                        <IconRestore size={13} />
                                        <span>{t.updatesRetryBtn}</span>
                                    </button>
                                )}
                            </div>
                        </>
                    ) : isChecking ? (
                        <>
                            <div />
                            <button
                                type="button"
                                onClick={onClose}
                                className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer"
                            >
                                {t.cancelBtn}
                            </button>
                        </>
                    ) : (
                        <>
                            {onCheckAgain ? (
                                <button
                                    type="button"
                                    onClick={onCheckAgain}
                                    className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                    <IconRestore size={13} />
                                    <span>{t.updatesCheckBtn}</span>
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-accent hover:opacity-90 text-white px-5 h-[30px] rounded-[7px] text-[12px] font-semibold cursor-pointer shadow-sm transition"
                            >
                                {t.updatesDoneBtn}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
