import React from 'react';
import type { TranslationDictionary } from '../../../i18n';
import { IconBackup, IconRestore } from '../../../components/Icons';

export interface BackupSectionProps {
    backupStatusMsg: string | null;
    onRestoreData: () => Promise<void>;
    onBackupData: () => Promise<void>;
    t: TranslationDictionary;
}

export const BackupSection: React.FC<BackupSectionProps> = ({
    backupStatusMsg,
    onRestoreData,
    onBackupData,
    t
}) => {
    return (
        <div>
            <h2 className="text-[13px] font-bold mb-2 px-1">
                {t.prefBackupSection}
            </h2>
            <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-[13px] font-medium">
                        {t.prefBackupTitle}
                    </div>
                    <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                        {t.prefBackupDesc}
                    </p>
                    {backupStatusMsg && (
                        <div className="mt-1.5 text-[11px] text-[#30D158] font-medium">
                            {backupStatusMsg}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => void onRestoreData()}
                        className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                    >
                        <IconRestore size={13} />
                        <span>{t.prefRestoreBtn}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => void onBackupData()}
                        className="bg-accent hover:opacity-90 text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                    >
                        <IconBackup size={13} />
                        <span>{t.prefBackupBtn}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
