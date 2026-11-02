import React from 'react';
import type { AppSettings, PlayerState, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { ActiveTab, SquelchWindowApi } from '../types';
import { MiniPlayer } from './MiniPlayer';
import {
    IconCalendar,
    IconChart,
    IconCompass,
    IconInfo,
    IconPower,
    IconRadioTower,
    IconSearch,
    IconSliders
} from '../../components/Icons';

export interface SidebarProps {
    activeTab: ActiveTab;
    navigateToTab: (tab: ActiveTab) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    isMac: boolean;
    handleWindowDragMouseDown: (e: React.MouseEvent) => void;
    currentStation: Station | null;
    playerState: PlayerState;
    stateHeadline: {
        main: string;
        sub: string;
        color: string;
    };
    streamTitle: string | null;
    isPlaying: boolean;
    isBusy: boolean;
    onlineCount: number;
    enabledSchedulesCount: number;
    settings: AppSettings | null;
    setIsAboutModalOpen: (open: boolean) => void;
    setIsQuitConfirmOpen: (open: boolean) => void;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    navigateToTab,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    isMac,
    handleWindowDragMouseDown,
    currentStation,
    playerState,
    stateHeadline,
    streamTitle,
    isPlaying,
    isBusy,
    onlineCount,
    enabledSchedulesCount,
    settings,
    setIsAboutModalOpen,
    setIsQuitConfirmOpen,
    api,
    t
}) => {
    return (
        <aside
            aria-label="Primary Navigation"
            className="mac-settings-sidebar w-60 shrink-0 flex flex-col justify-between px-3 pt-11 pb-3 overflow-y-auto"
        >
            <div>
                {/* Drag Region for macOS Traffic Lights */}
                <div
                    data-tauri-drag-region
                    onMouseDown={handleWindowDragMouseDown}
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                    className="fixed top-0 left-0 w-60 h-10 z-10"
                />

                {/* 1. Search Bar */}
                <div className="relative flex items-center mb-3 px-0.5">
                    <IconSearch
                        size={13}
                        className="absolute left-2.5 text-secondary pointer-events-none"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (activeTab !== 'stations') {
                                navigateToTab('stations');
                            }
                        }}
                        placeholder={t.searchPlaceholder}
                        aria-label={t.searchPlaceholder}
                        className="mac-input w-full pl-7 pr-14 py-1.5 rounded-[7px] text-[12px]"
                    />
                    <div className="absolute right-2 flex items-center gap-1 pointer-events-none select-none">
                        <kbd className="px-1 py-0.5 rounded-[3px] bg-white/10 dark:bg-white/10 border border-black/5 dark:border-white/10 text-secondary text-[9px] font-mono leading-none shadow-2xs">
                            {isMac ? '⌘' : 'Ctrl'}
                        </kbd>
                        <kbd className="px-1 py-0.5 rounded-[3px] bg-white/10 dark:bg-white/10 border border-black/5 dark:border-white/10 text-secondary text-[9px] font-mono leading-none shadow-2xs">
                            F
                        </kbd>
                    </div>
                </div>

                {/* 2. Mini Player Deck */}
                <MiniPlayer
                    currentStation={currentStation}
                    playerState={playerState}
                    stateHeadline={stateHeadline}
                    streamTitle={streamTitle}
                    isPlaying={isPlaying}
                    isBusy={isBusy}
                    api={api}
                    t={t}
                />

                {/* 3. Main Navigation */}
                <nav className="space-y-0.5">
                    <button
                        type="button"
                        onClick={() => navigateToTab('stations')}
                        className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                            activeTab === 'stations'
                                ? 'bg-accent text-white font-medium'
                                : 'mac-row'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#0A84FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <IconRadioTower size={13} />
                        </span>
                        <span className="truncate flex-1 text-left">
                            {t.tabStations}
                        </span>
                        <span
                            className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold tabular-nums leading-none ${
                                activeTab === 'stations'
                                    ? 'bg-white/25 text-white'
                                    : 'bg-[#30D158]/20 text-[#30D158]'
                            }`}
                        >
                            {onlineCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateToTab('schedules')}
                        className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                            activeTab === 'schedules'
                                ? 'bg-accent text-white font-medium'
                                : 'mac-row'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#FF9F0A] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <IconCalendar size={13} />
                        </span>
                        <span className="truncate flex-1 text-left">
                            {t.tabSchedules}
                        </span>
                        <span
                            className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold tabular-nums leading-none ${
                                activeTab === 'schedules'
                                    ? 'bg-white/25 text-white'
                                    : 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                            }`}
                        >
                            {enabledSchedulesCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateToTab('discover')}
                        className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                            activeTab === 'discover'
                                ? 'bg-accent text-white font-medium'
                                : 'mac-row'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#32ADE6] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <IconCompass size={13} />
                        </span>
                        <span className="truncate flex-1 text-left">
                            {t.tabDiscover}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateToTab('stats')}
                        className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                            activeTab === 'stats'
                                ? 'bg-accent text-white font-medium'
                                : 'mac-row'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#30D158] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <IconChart size={13} />
                        </span>
                        <span className="truncate flex-1 text-left">
                            {t.tabStats}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigateToTab('preferences')}
                        className={`w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 cursor-pointer transition ${
                            activeTab === 'preferences'
                                ? 'bg-accent text-white font-medium'
                                : 'mac-row'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-[5px] bg-[#8E8E93] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <IconSliders size={13} />
                        </span>
                        <span className="truncate flex-1 text-left">
                            {t.tabPreferences}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Bottom Actions: About and Quit */}
            <div className="pt-3 border-t mac-divider space-y-0.5">
                <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(true)}
                    className="w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 mac-row text-secondary hover:text-current cursor-pointer"
                >
                    <span className="w-5 h-5 rounded-[5px] bg-[#BF5AF2] text-white flex items-center justify-center shrink-0">
                        <IconInfo size={13} />
                    </span>
                    <span>{t.tabAbout}</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (settings?.confirmBeforeQuit ?? true) {
                            setIsQuitConfirmOpen(true);
                        } else {
                            void api.quitApp();
                        }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-[7px] text-[13px] flex items-center gap-2.5 mac-row text-secondary hover:text-current cursor-pointer"
                >
                    <span className="w-5 h-5 rounded-[5px] bg-[#FF453A] text-white flex items-center justify-center shrink-0">
                        <IconPower size={13} />
                    </span>
                    <span>{t.quitAppBtn}</span>
                </button>
            </div>
        </aside>
    );
};
