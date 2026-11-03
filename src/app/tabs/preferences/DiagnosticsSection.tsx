import React from 'react';
import type { TranslationDictionary } from '../../../i18n';
import {
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconCopy,
    IconFolder
} from '../../../components/Icons';

export interface DiagnosticsSectionProps {
    dataDir: string;
    diagnosticsText: string;
    showDiagReport: boolean;
    copiedDiag: boolean;
    onOpenLogsFolder: () => Promise<unknown> | unknown;
    onCopyDiagnostics: () => void;
    onToggleDiagReport: () => void;
    t: TranslationDictionary;
}

export const DiagnosticsSection: React.FC<DiagnosticsSectionProps> = ({
    dataDir,
    diagnosticsText,
    showDiagReport,
    copiedDiag,
    onOpenLogsFolder,
    onCopyDiagnostics,
    onToggleDiagReport,
    t
}) => {
    return (
        <div>
            <h2 className="text-[13px] font-bold mb-2 px-1">
                {t.prefDiagSection}
            </h2>
            <div className="mac-settings-card">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="text-[13px] font-medium">
                            {t.prefDiagDesc}
                        </div>
                        <div className="text-[11px] text-secondary font-mono truncate mt-1">
                            {t.prefDataDirLabel}: {dataDir}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => void onOpenLogsFolder()}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                            <IconFolder size={13} />
                            <span>{t.openLogsBtn}</span>
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2.5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onToggleDiagReport}
                        className="text-[12px] font-medium text-accent flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                        {showDiagReport ? (
                            <IconChevronUp size={14} />
                        ) : (
                            <IconChevronDown size={14} />
                        )}
                        <span>
                            {showDiagReport
                                ? t.prefDiagHideBtn
                                : t.prefDiagShowBtn}
                        </span>
                    </button>
                </div>

                {showDiagReport && (
                    <div className="px-4 pb-4 animate-collapse-enter">
                        <div className="relative group">
                            <pre className="p-3.5 pr-11 rounded-[8px] bg-black/25 border mac-divider text-[11px] font-mono overflow-x-auto tabular-nums max-h-64 whitespace-pre-wrap select-text">
                                {typeof diagnosticsText === 'string'
                                    ? diagnosticsText
                                    : JSON.stringify(diagnosticsText, null, 2)}
                            </pre>
                            <button
                                type="button"
                                onClick={onCopyDiagnostics}
                                title={
                                    copiedDiag ? t.copiedDiagBtn : t.copyDiagBtn
                                }
                                aria-label={
                                    copiedDiag ? t.copiedDiagBtn : t.copyDiagBtn
                                }
                                className={`absolute top-2.5 right-2.5 p-1.5 rounded-[6px] transition-all cursor-pointer shadow-xs active:scale-90 ${
                                    copiedDiag
                                        ? 'bg-emerald-500/20 text-emerald-400 scale-105 ring-1 ring-emerald-500/30'
                                        : 'mac-glass-pill hover:bg-black/10 dark:hover:bg-white/15 text-secondary hover:text-foreground'
                                }`}
                            >
                                {copiedDiag ? (
                                    <IconCheck
                                        size={13}
                                        className="text-emerald-400 animate-scale-enter"
                                    />
                                ) : (
                                    <IconCopy
                                        size={13}
                                        className="transition-transform active:rotate-12"
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
