import React from 'react';
import type { AppSettings } from '../../../types';
import type { TranslationDictionary } from '../../../i18n';
import type {
    UpdateCheckResult,
    UpdateDownloadProgress
} from '../../../components/UpdateModal';
import { MacToggle } from '../../../components/MacToggle';
import {
    IconArrowDownTray,
    IconCheck,
    IconRestore,
    IconSparkles,
    IconSpinner
} from '../../../components/Icons';

export interface UpdatesSectionProps {
    settings: AppSettings;
    updateInfo: UpdateCheckResult | null;
    updateCheckError: string | null;
    isCheckingUpdate: boolean;
    updateDownloadProgress?: UpdateDownloadProgress | null;
    onCheckForUpdates: (manual?: boolean) => Promise<void>;
    onOpenUpdateModal: () => void;
    onUpdateSettings: (patch: Partial<AppSettings>) => void;
    t: TranslationDictionary;
}

export const UpdatesSection: React.FC<UpdatesSectionProps> = ({
    settings,
    updateInfo,
    updateCheckError,
    isCheckingUpdate,
    updateDownloadProgress,
    onCheckForUpdates,
    onOpenUpdateModal,
    onUpdateSettings,
    t
}) => {
    return (
        <div>
            <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                <IconSparkles size={14} className="text-accent" />
                <span>{t.updatesSectionTitle}</span>
            </h2>
            <div className="mac-settings-card mac-inset-list">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="text-[13px] font-semibold text-foreground">
                                Squelch
                            </div>
                            <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-mono font-bold tabular-nums">
                                v{updateInfo?.currentVersion || '0.1.3'}
                            </span>
                            {updateInfo?.hasUpdate ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] text-[11px] font-semibold flex items-center gap-1">
                                    <span>
                                        Update: v{updateInfo.latestVersion}
                                    </span>
                                </span>
                            ) : !isCheckingUpdate &&
                              updateInfo &&
                              !updateCheckError ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] text-[11px] font-semibold flex items-center gap-1">
                                    <IconCheck size={12} />
                                    <span>{t.updatesUpToDate}</span>
                                </span>
                            ) : null}
                        </div>
                        <div className="text-[12px] text-secondary mt-1">
                            {updateCheckError ? (
                                <span className="text-[#FF453A]">
                                    {t.updatesError}: {updateCheckError}
                                </span>
                            ) : (
                                t.updatesSectionDesc
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {updateInfo?.hasUpdate && (
                            <button
                                type="button"
                                onClick={onOpenUpdateModal}
                                className="bg-accent hover:opacity-90 text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                            >
                                {updateDownloadProgress?.status ===
                                'downloading' ? (
                                    <>
                                        <IconSpinner
                                            size={13}
                                            className="animate-spin"
                                        />
                                        <span>
                                            {t.updatesDownloadingBadge} (
                                            {updateDownloadProgress.percent.toFixed(
                                                0
                                            )}
                                            %)
                                        </span>
                                    </>
                                ) : updateDownloadProgress?.status ===
                                  'completed' ? (
                                    <>
                                        <IconCheck size={13} />
                                        <span>{t.updatesInstallBtn}</span>
                                    </>
                                ) : (
                                    <>
                                        <IconArrowDownTray size={13} />
                                        <span>
                                            {t.updatesDownloadBackground}
                                        </span>
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={isCheckingUpdate}
                            onClick={() => void onCheckForUpdates(true)}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10 transition"
                        >
                            {isCheckingUpdate ? (
                                <>
                                    <IconSpinner
                                        size={13}
                                        className="animate-spin text-accent"
                                    />
                                    <span>{t.updatesChecking}</span>
                                </>
                            ) : (
                                <>
                                    <IconRestore size={13} />
                                    <span>{t.updatesCheckBtn}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                        {t.updatesAutoCheck}
                    </span>
                    <MacToggle
                        checked={settings.autoCheckUpdates !== false}
                        label={t.updatesAutoCheck}
                        onChange={(next) =>
                            onUpdateSettings({
                                autoCheckUpdates: next
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
};
