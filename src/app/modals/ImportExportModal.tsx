import React from 'react';
import type { TranslationDictionary } from '../../i18n';
import { IconClose, IconCopy } from '../../components/Icons';

export interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportLoad: (format: 'json' | 'm3u' | 'pls') => void;
    ieFormat: 'json' | 'm3u' | 'pls';
    ieDuplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
    setIeDuplicateStrategy: (v: 'skip' | 'overwrite' | 'duplicate') => void;
    ieTextContent: string;
    setIeTextContent: (v: string) => void;
    ieStatusMessage: string | null;
    onCopyExport: () => void;
    onImportExecute: () => void;
    t: TranslationDictionary;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
    isOpen,
    onClose,
    onExportLoad,
    ieFormat,
    ieDuplicateStrategy,
    setIeDuplicateStrategy,
    ieTextContent,
    setIeTextContent,
    ieStatusMessage,
    onCopyExport,
    onImportExecute,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ie-modal-title"
            onClick={onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="mac-modal-surface w-full max-w-xl p-6 space-y-4 text-xs"
            >
                <div className="flex items-center justify-between pb-3 border-b mac-divider">
                    <h3 id="ie-modal-title" className="text-[15px] font-bold">
                        {t.importExport}
                    </h3>
                    <button
                        type="button"
                        aria-label={t.cancelBtn}
                        onClick={onClose}
                        className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                    >
                        <IconClose size={14} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                        {(['json', 'm3u', 'pls'] as const).map((fmt) => (
                            <button
                                key={fmt}
                                type="button"
                                onClick={() => onExportLoad(fmt)}
                                className={`px-3 py-1.5 rounded-[6px] uppercase font-mono text-[11px] font-semibold cursor-pointer transition ${
                                    ieFormat === fmt
                                        ? 'bg-accent text-white'
                                        : 'mac-glass-pill'
                                }`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-secondary font-medium">
                            {t.duplicateStrategyLabel}
                        </span>
                        <select
                            value={ieDuplicateStrategy}
                            onChange={(e) =>
                                setIeDuplicateStrategy(
                                    e.target.value as
                                        'skip' | 'overwrite' | 'duplicate'
                                )
                            }
                            className="mac-input px-2.5 py-1.5 rounded-[6px]"
                        >
                            <option value="skip">{t.dupSkip}</option>
                            <option value="overwrite">{t.dupOverwrite}</option>
                            <option value="duplicate">{t.dupDuplicate}</option>
                        </select>
                    </div>
                </div>

                <textarea
                    value={ieTextContent}
                    onChange={(e) => setIeTextContent(e.target.value)}
                    rows={10}
                    className="mac-input w-full p-3 rounded-[7px] font-mono text-[11px]"
                />

                {ieStatusMessage && (
                    <div className="text-[11px] text-accent font-medium tabular-nums">
                        {ieStatusMessage}
                    </div>
                )}

                <div className="flex justify-between pt-3 border-t mac-divider">
                    <button
                        type="button"
                        onClick={onCopyExport}
                        className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                        <IconCopy size={13} />
                        <span>{t.copyExportBtn}</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mac-glass-pill px-4 py-2 rounded-[7px] font-medium cursor-pointer"
                        >
                            {t.cancelBtn}
                        </button>
                        <button
                            type="button"
                            onClick={onImportExecute}
                            className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[7px] font-semibold shadow-sm cursor-pointer transition"
                        >
                            {t.importBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
