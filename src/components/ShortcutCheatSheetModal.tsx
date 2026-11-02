import React, { useEffect } from 'react';
import type { TranslationDictionary } from '../i18n';
import type { GlobalShortcutsConfig } from '../types';
import {
    GLOBAL_SHORTCUT_DEFINITIONS,
    IN_APP_SHORTCUTS
} from '../utils/shortcuts';
import { ShortcutKeyBadge } from './ShortcutKeyBadge';
import { IconKey, IconX } from './Icons';

export interface ShortcutCheatSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: GlobalShortcutsConfig;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const ShortcutCheatSheetModal: React.FC<
    ShortcutCheatSheetModalProps
> = ({ isOpen, onClose, shortcuts, lang, t }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div
                className="mac-window w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-black/15 dark:border-white/15 animate-modal-enter"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cheat-sheet-title"
            >
                {/* Modal Title Bar */}
                <div className="px-5 py-3.5 flex items-center justify-between border-b mac-divider bg-white/60 dark:bg-[#202022]/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
                            <IconKey size={14} />
                        </span>
                        <h2
                            id="cheat-sheet-title"
                            className="text-[13px] font-bold text-foreground"
                        >
                            {t.prefShortcutCheatSheetTitle}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                        title="Close (Esc)"
                    >
                        <IconX size={14} />
                    </button>
                </div>

                {/* Modal Content Scrollable Area */}
                <div className="p-5 overflow-y-auto space-y-5 text-[12px]">
                    {/* Section 1: Global Shortcuts */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                                🌐 {t.prefShortcutGlobalSection}
                            </span>
                            <span className="text-[10px] text-secondary">
                                {lang === 'id'
                                    ? 'Dapat ditekan di mana saja'
                                    : 'System-wide hotkeys'}
                            </span>
                        </div>

                        <div className="mac-settings-card mac-inset-list rounded-xl overflow-hidden divide-y mac-divider">
                            {GLOBAL_SHORTCUT_DEFINITIONS.map((def) => {
                                const val = shortcuts[def.key];
                                const label =
                                    lang === 'id' ? def.labelId : def.labelEn;
                                return (
                                    <div
                                        key={def.key}
                                        className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                                    >
                                        <span className="font-medium text-foreground text-[12px]">
                                            {label}
                                        </span>
                                        <ShortcutKeyBadge
                                            accelerator={val}
                                            unassignedText={
                                                t.prefShortcutUnassigned
                                            }
                                            size="sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: In-App Shortcuts */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                                ⚡ {t.prefShortcutLocalSection}
                            </span>
                            <span className="text-[10px] text-secondary">
                                {lang === 'id'
                                    ? 'Saat jendela Squelch aktif'
                                    : 'Window focused'}
                            </span>
                        </div>

                        <div className="mac-settings-card mac-inset-list rounded-xl overflow-hidden divide-y mac-divider">
                            {IN_APP_SHORTCUTS.map((item) => {
                                const label =
                                    lang === 'id' ? item.labelId : item.labelEn;
                                return (
                                    <div
                                        key={item.key}
                                        className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                                    >
                                        <span className="font-medium text-foreground text-[12px]">
                                            {label}
                                        </span>
                                        <ShortcutKeyBadge
                                            badges={item.badge}
                                            size="sm"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="px-5 py-3 border-t mac-divider bg-black/3 dark:bg-white/3 flex items-center justify-between">
                    <p className="text-[11px] text-secondary">
                        💡{' '}
                        {lang === 'id'
                            ? 'Ubah pintasan global sewaktu-waktu di tab Pengaturan.'
                            : 'Customize global hotkeys anytime in the Preferences tab.'}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 rounded-[6px] text-[11px] font-semibold bg-accent text-white shadow-xs cursor-pointer hover:opacity-90 transition"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
