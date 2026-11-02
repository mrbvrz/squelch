import React, { useState, useEffect } from 'react';
import type { TranslationDictionary } from '../i18n';
import type { GlobalShortcutsConfig } from '../types';
import type { ShortcutActionKey, ShortcutDefinition } from '../utils/shortcuts';
import {
    formatKeyboardEventToAccelerator,
    findShortcutConflict,
    getActiveModifierBadges,
    isModifierOnlyKey
} from '../utils/shortcuts';
import { ShortcutKeyBadge } from './ShortcutKeyBadge';
import { IconKey, IconRestore, IconX } from './Icons';

export interface KeyboardShortcutRecorderProps {
    definition: ShortcutDefinition;
    currentValue?: string;
    allShortcuts: GlobalShortcutsConfig;
    isRecording: boolean;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onChange: (key: ShortcutActionKey, newAccelerator: string) => void;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const KeyboardShortcutRecorder: React.FC<
    KeyboardShortcutRecorderProps
> = ({
    definition,
    currentValue = '',
    allShortcuts,
    isRecording,
    onStartRecording,
    onStopRecording,
    onChange,
    lang,
    t
}) => {
    const [liveModifiers, setLiveModifiers] = useState<string[]>([]);

    const conflictKey = currentValue
        ? findShortcutConflict(definition.key, currentValue, allShortcuts)
        : null;

    useEffect(() => {
        if (!isRecording) {
            setLiveModifiers([]);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Cancel on Escape
            if (e.key === 'Escape') {
                onStopRecording();
                return;
            }

            // Unbind / Clear on Backspace or Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                onChange(definition.key, '');
                onStopRecording();
                return;
            }

            // Update live modifiers display if user is holding down modifier keys
            if (isModifierOnlyKey(e.key)) {
                setLiveModifiers(getActiveModifierBadges(e));
                return;
            }

            // Format full accelerator
            const accel = formatKeyboardEventToAccelerator(e);
            if (accel) {
                onChange(definition.key, accel);
                onStopRecording();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (isModifierOnlyKey(e.key)) {
                setLiveModifiers(getActiveModifierBadges(e));
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [isRecording, definition.key, onChange, onStopRecording]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(definition.key, '');
    };

    const handleResetDefault = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(definition.key, definition.defaultAccelerator);
    };

    const label = lang === 'id' ? definition.labelId : definition.labelEn;
    const desc = lang === 'id' ? definition.descId : definition.descEn;

    return (
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b mac-divider last:border-b-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition">
            {/* Action Label & Description */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                        {label}
                    </span>
                    {conflictKey && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⚠️ {t.prefShortcutConflict}
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-secondary mt-0.5 leading-normal">
                    {desc}
                </p>
            </div>

            {/* Recorder Button & Shortcut Badges */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <button
                    type="button"
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    className={`px-3 py-1.5 rounded-[7px] text-[11px] min-w-[160px] flex items-center justify-center gap-2 cursor-pointer transition select-none ${
                        isRecording
                            ? 'bg-accent/15 text-accent border border-accent ring-2 ring-accent/30 animate-pulse'
                            : 'mac-glass-pill hover:bg-black/8 dark:hover:bg-white/10'
                    }`}
                    title={
                        isRecording
                            ? 'Press any key combination or Esc to cancel'
                            : 'Click to record new keyboard shortcut'
                    }
                >
                    <IconKey
                        size={12}
                        className={
                            isRecording ? 'text-accent' : 'text-secondary'
                        }
                    />

                    {isRecording ? (
                        liveModifiers.length > 0 ? (
                            <div className="flex items-center gap-1">
                                <ShortcutKeyBadge
                                    badges={liveModifiers}
                                    size="sm"
                                />
                                <span className="text-[10px] text-secondary font-mono animate-pulse">
                                    + ?
                                </span>
                            </div>
                        ) : (
                            <span className="font-medium text-accent">
                                {t.prefShortcutRecording}
                            </span>
                        )
                    ) : (
                        <ShortcutKeyBadge
                            accelerator={currentValue}
                            unassignedText={t.prefShortcutUnassigned}
                            size="md"
                        />
                    )}
                </button>

                {/* Reset Default Button (if different from default) */}
                {currentValue !== definition.defaultAccelerator && (
                    <button
                        type="button"
                        onClick={handleResetDefault}
                        title={t.prefShortcutReset}
                        className="p-1.5 rounded-[6px] text-secondary hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                        <IconRestore size={12} />
                    </button>
                )}

                {/* Clear Shortcut Button (if not empty) */}
                {Boolean(currentValue) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title={t.prefShortcutClear}
                        className="p-1.5 rounded-[6px] text-secondary hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                    >
                        <IconX size={12} />
                    </button>
                )}
            </div>
        </div>
    );
};
