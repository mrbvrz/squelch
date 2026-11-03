import React from 'react';
import type { TranslationDictionary } from '../../i18n';
import {
    IconCompass,
    IconInfo,
    IconPlus,
    IconPower,
    IconSliders
} from '../../components/Icons';

export interface TrayActionDockProps {
    stationCount: number;
    favCount: number;
    groupCount: number;
    onOpenStationsTab: () => void;
    onOpenDiscoverTab: () => void;
    onOpenPreferencesTab: () => void;
    onOpenAbout: () => void;
    onTriggerQuit: () => void;
    t: TranslationDictionary;
}

export const TrayActionDock: React.FC<TrayActionDockProps> = ({
    stationCount,
    favCount,
    groupCount,
    onOpenStationsTab,
    onOpenDiscoverTab,
    onOpenPreferencesTab,
    onOpenAbout,
    onTriggerQuit,
    t
}) => {
    return (
        <div className="mac-settings-card mt-2.5 p-2.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-secondary pb-2 border-b mac-divider">
                <button
                    type="button"
                    onClick={onOpenStationsTab}
                    className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                >
                    <IconPlus size={13} />
                    <span>{t.trayAddStation}</span>
                </button>
                <button
                    type="button"
                    onClick={onOpenDiscoverTab}
                    className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                >
                    <IconCompass size={13} />
                    <span>{t.trayDiscover}</span>
                </button>
                <button
                    type="button"
                    onClick={onOpenPreferencesTab}
                    className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                >
                    <IconSliders size={13} />
                    <span>{t.traySettings}</span>
                </button>
                <button
                    type="button"
                    onClick={onOpenAbout}
                    className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                    title={t.tabAbout}
                >
                    <IconInfo size={13} />
                    <span>{t.tabAbout}</span>
                </button>
                <button
                    type="button"
                    onClick={onTriggerQuit}
                    className="flex items-center gap-1 text-[#FF453A] hover:opacity-80 transition font-medium cursor-pointer"
                >
                    <IconPower size={13} />
                    <span>{t.trayQuit}</span>
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center tabular-nums text-secondary">
                <div>
                    <div className="text-[13px] font-bold text-foreground">
                        {stationCount}
                    </div>
                    <div className="text-[10px] text-secondary truncate">
                        {t.trayStatStations}
                    </div>
                </div>
                <div>
                    <div className="text-[13px] font-bold text-foreground">
                        {favCount}
                    </div>
                    <div className="text-[10px] text-secondary truncate">
                        {t.trayStatFavorites}
                    </div>
                </div>
                <div>
                    <div className="text-[13px] font-bold text-foreground">
                        {groupCount}
                    </div>
                    <div className="text-[10px] text-secondary truncate">
                        {t.trayStatCategories}
                    </div>
                </div>
            </div>
        </div>
    );
};
