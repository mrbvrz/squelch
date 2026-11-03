import React from 'react';
import { IconCheck, IconClose, IconSpinner } from '../../components/Icons';
import type { TranslationDictionary } from '../../i18n';

export interface StreamHealthToastProps {
    active: boolean;
    status: 'idle' | 'checking' | 'completed';
    total: number;
    completed: number;
    currentStation?: string;
    onlineCount: number;
    offlineCount: number;
    onDismiss: () => void;
    lang?: string;
    t: TranslationDictionary;
}

export const StreamHealthToast: React.FC<StreamHealthToastProps> = ({
    active,
    status,
    total,
    completed,
    currentStation,
    onlineCount,
    offlineCount,
    onDismiss,
    lang = 'id',
    t
}) => {
    if (!active || status === 'idle') return null;

    const percentage =
        total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    const isCompleted = status === 'completed';

    return (
        <aside
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 pointer-events-auto w-80 animate-scale-enter"
        >
            <div className="mac-modal-surface shadow-2xl border border-black/10 dark:border-white/10 rounded-xl p-3.5 backdrop-blur-2xl text-foreground">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0">
                                <IconCheck size={13} />
                            </div>
                        ) : (
                            <IconSpinner
                                size={15}
                                className="animate-spin text-accent shrink-0"
                            />
                        )}
                        <span className="text-[12px] font-semibold truncate">
                            {isCompleted
                                ? t.healthCheckComplete ||
                                  (lang === 'id'
                                      ? 'Pemeriksaan Selesai'
                                      : 'Verification Complete')
                                : t.checkingHealth ||
                                  (lang === 'id'
                                      ? 'Memeriksa Stream…'
                                      : 'Verifying Streams…')}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {!isCompleted && total > 0 && (
                            <span className="text-[11px] font-mono text-muted tabular-nums">
                                {completed}/{total}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={onDismiss}
                            aria-label="Tutup"
                            className="text-muted hover:text-foreground p-0.5 rounded cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/10"
                        >
                            <IconClose size={12} />
                        </button>
                    </div>
                </div>

                {/* Body Details */}
                <div className="mt-1.5 min-h-[16px] flex items-center justify-between text-[11px]">
                    {isCompleted ? (
                        <div className="flex items-center gap-2 text-secondary">
                            <span className="flex items-center gap-1 font-medium text-[#30D158]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                                {onlineCount}{' '}
                                {lang === 'id' ? 'Online' : 'Online'}
                            </span>
                            <span className="text-muted/60">•</span>
                            <span
                                className={`flex items-center gap-1 font-medium ${
                                    offlineCount > 0
                                        ? 'text-[#FF453A]'
                                        : 'text-muted'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        offlineCount > 0
                                            ? 'bg-[#FF453A]'
                                            : 'bg-muted/40'
                                    }`}
                                />
                                {offlineCount}{' '}
                                {lang === 'id' ? 'Offline' : 'Offline'}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted truncate">
                            {currentStation
                                ? `${
                                      t.healthCheckingStation ||
                                      (lang === 'id' ? 'Memeriksa' : 'Checking')
                                  }: ${currentStation}`
                                : lang === 'id'
                                  ? 'Menghubungkan…'
                                  : 'Connecting…'}
                        </span>
                    )}
                    <span className="text-muted font-mono tabular-nums shrink-0 ml-2">
                        {percentage}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${
                            isCompleted ? 'bg-[#30D158]' : 'bg-accent'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </aside>
    );
};
