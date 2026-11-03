import React from 'react';
import type { TranslationDictionary } from '../../../i18n';
import { MacSelect } from '../../../components/MacSelect';
import { IconTrash } from '../../../components/Icons';

export interface DangerZoneSectionProps {
    selectedClearTarget: 'stations' | 'schedules' | 'stats' | 'all';
    setSelectedClearTarget: (
        target: 'stations' | 'schedules' | 'stats' | 'all'
    ) => void;
    onRequestReset?: (
        target: 'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    ) => void;
    setIsResetConfirmOpen: (open: boolean) => void;
    t: TranslationDictionary;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
    selectedClearTarget,
    setSelectedClearTarget,
    onRequestReset,
    setIsResetConfirmOpen,
    t
}) => {
    return (
        <div>
            <h2 className="text-[13px] font-bold mb-2 px-1 text-[#FF453A] flex items-center gap-1.5">
                <IconTrash size={14} className="text-[#FF453A]" />
                <span>{t.prefDangerSection}</span>
            </h2>
            <div className="mac-settings-card mac-inset-list border border-[#FF453A]/30 overflow-hidden">
                {/* 1. Dropdown Hapus Data Tertentu */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-foreground">
                            {t.prefClearDropdownLabel || 'Hapus Data'}
                        </div>
                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                            {selectedClearTarget === 'stations'
                                ? t.prefClearStationsDesc
                                : selectedClearTarget === 'schedules'
                                  ? t.prefClearSchedulesDesc
                                  : selectedClearTarget === 'stats'
                                    ? t.prefClearStatsDesc
                                    : t.prefResetAllDesc}
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <MacSelect
                            value={selectedClearTarget}
                            ariaLabel={
                                t.prefClearDropdownLabel ||
                                'Pilih data yang ingin dihapus'
                            }
                            onChange={(nextTarget) =>
                                setSelectedClearTarget(
                                    nextTarget as
                                        | 'stations'
                                        | 'schedules'
                                        | 'stats'
                                        | 'all'
                                )
                            }
                            options={[
                                {
                                    value: 'all',
                                    label:
                                        t.prefClearAllDataOption ||
                                        'Semua Data'
                                },
                                {
                                    value: 'stations',
                                    label: t.tabStations
                                },
                                {
                                    value: 'schedules',
                                    label: t.tabSchedules
                                },
                                { value: 'stats', label: t.tabStats }
                            ]}
                            widthClass="w-[200px]"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                onRequestReset
                                    ? onRequestReset(selectedClearTarget)
                                    : setIsResetConfirmOpen(true)
                            }
                            className="mac-glass-pill text-[#FF453A] hover:bg-[#FF453A]/10 px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition shrink-0"
                        >
                            {t.prefClearBtn || 'Hapus Data'}
                        </button>
                    </div>
                </div>

                {/* 2. Kembali ke Pengaturan Awal */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-foreground">
                            {t.prefResetBtn}
                        </div>
                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                            {t.prefResetDesc}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            onRequestReset
                                ? onRequestReset('all')
                                : setIsResetConfirmOpen(true)
                        }
                        className="bg-[#FF453A] hover:bg-[#D70015] text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition shrink-0"
                    >
                        {t.prefResetBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};
