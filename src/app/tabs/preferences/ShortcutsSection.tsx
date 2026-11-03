import React from 'react';
import type { AppSettings } from '../../../types';
import type { TranslationDictionary } from '../../../i18n';
import { KeyboardShortcutRecorder } from '../../../components/KeyboardShortcutRecorder';
import {
    GLOBAL_SHORTCUT_DEFINITIONS,
    type ShortcutActionKey
} from '../../../utils/shortcuts';

export interface ShortcutsSectionProps {
    settings: AppSettings;
    recordingShortcutKey: keyof AppSettings['shortcuts'] | null;
    setRecordingShortcutKey: (
        key: keyof AppSettings['shortcuts'] | null
    ) => void;
    onUpdateShortcut: (key: ShortcutActionKey, newAccel: string) => void;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const ShortcutsSection: React.FC<ShortcutsSectionProps> = ({
    settings,
    recordingShortcutKey,
    setRecordingShortcutKey,
    onUpdateShortcut,
    lang,
    t
}) => {
    return (
        <div>
            <div className="mb-2 px-1">
                <h2 className="text-[13px] font-bold">{t.prefShortcuts}</h2>
                <p className="text-[11px] text-secondary mt-0.5">
                    {t.prefShortcutRecordHint}
                </p>
            </div>

            <div className="mac-settings-card mac-inset-list">
                {GLOBAL_SHORTCUT_DEFINITIONS.map((def) => {
                    const isRecording = recordingShortcutKey === def.key;
                    const currentValue = settings.shortcuts?.[def.key] ?? '';
                    return (
                        <KeyboardShortcutRecorder
                            key={def.key}
                            definition={def}
                            currentValue={currentValue}
                            allShortcuts={settings.shortcuts}
                            isRecording={isRecording}
                            onStartRecording={() =>
                                setRecordingShortcutKey(def.key)
                            }
                            onStopRecording={() =>
                                setRecordingShortcutKey(null)
                            }
                            onChange={onUpdateShortcut}
                            lang={lang}
                            t={t}
                        />
                    );
                })}
            </div>
        </div>
    );
};
