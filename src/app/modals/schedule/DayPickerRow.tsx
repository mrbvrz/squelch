import React from 'react';
import type { TranslationDictionary } from '../../../i18n';

export interface DayLabelItem {
    day: number;
    labelId: string;
    labelEn: string;
}

export interface DayPickerRowProps {
    schedDays: number[];
    setSchedDays: (days: number[]) => void;
    dayLabels: DayLabelItem[];
    lang: string;
    t: TranslationDictionary;
}

export const DayPickerRow: React.FC<DayPickerRowProps> = ({
    schedDays,
    setSchedDays,
    dayLabels,
    lang,
    t
}) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold">{t.scheduleDays}</label>
                <div className="flex gap-2 text-[11px]">
                    <button
                        type="button"
                        onClick={() => setSchedDays([1, 2, 3, 4, 5])}
                        className="text-accent hover:underline cursor-pointer"
                    >
                        {t.scheduleDaysWeekdays}
                    </button>
                    <span className="text-secondary">·</span>
                    <button
                        type="button"
                        onClick={() => setSchedDays([0, 1, 2, 3, 4, 5, 6])}
                        className="text-accent hover:underline cursor-pointer"
                    >
                        {t.scheduleDaysAll}
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {dayLabels.map((day) => {
                    const isChecked = schedDays.includes(day.day);
                    return (
                        <button
                            key={day.day}
                            type="button"
                            onClick={() => {
                                if (isChecked) {
                                    if (schedDays.length > 1) {
                                        setSchedDays(
                                            schedDays.filter(
                                                (d) => d !== day.day
                                            )
                                        );
                                    }
                                } else {
                                    setSchedDays(
                                        [...schedDays, day.day].sort()
                                    );
                                }
                            }}
                            className={`py-2 rounded-[7px] text-[11px] font-semibold text-center transition cursor-pointer ${
                                isChecked
                                    ? 'bg-accent text-white shadow-sm'
                                    : 'mac-glass-pill text-secondary'
                            }`}
                        >
                            {lang === 'id' ? day.labelId : day.labelEn}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
