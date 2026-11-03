import React from 'react';
import type { UpdateCheckResult } from '../../components/UpdateModal';
import { IconChevronLeft, IconChevronRight } from '../../components/Icons';

export interface HeaderBarProps {
    canGoBack: boolean;
    canGoForward: boolean;
    goBack: () => void;
    goForward: () => void;
    currentHeadingTitle: string;
    updateInfo: UpdateCheckResult | null;
    setIsUpdateModalOpen: (open: boolean) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    currentHeadingTitle,
    updateInfo,
    setIsUpdateModalOpen
}) => {
    return (
        <header
            data-tauri-drag-region
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            className="h-11 pt-1.5 px-6 flex items-center justify-between shrink-0 cursor-default"
        >
            <div
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                className="flex items-center gap-3.5"
            >
                <div className="inline-flex items-center rounded-[7px] mac-glass-pill divide-x mac-divider overflow-hidden">
                    <button
                        type="button"
                        disabled={!canGoBack}
                        onClick={goBack}
                        aria-label="Back"
                        className="px-2.5 py-1.5 disabled:opacity-30 hover:bg-white/10 cursor-pointer flex items-center justify-center transition"
                    >
                        <IconChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        disabled={!canGoForward}
                        onClick={goForward}
                        aria-label="Forward"
                        className="px-2.5 py-1.5 disabled:opacity-30 hover:bg-white/10 cursor-pointer flex items-center justify-center transition"
                    >
                        <IconChevronRight size={16} />
                    </button>
                </div>

                <h1 className="text-[17px] font-bold tracking-tight">
                    {currentHeadingTitle}
                </h1>
            </div>

            <div
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                className="flex items-center gap-2"
            >
                {updateInfo?.hasUpdate && (
                    <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(true)}
                        className="px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-accent/25 transition shadow-xs"
                    >
                        <span className="text-[12px]">✨</span>
                        <span>Update v{updateInfo.latestVersion}</span>
                    </button>
                )}
            </div>
        </header>
    );
};
