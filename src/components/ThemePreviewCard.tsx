import React from 'react';
import type { ThemeMode } from '../types';

export interface ThemePreviewCardProps {
    mode: ThemeMode;
    active: boolean;
    label: string;
    onSelect: () => void;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
    mode,
    active,
    label,
    onSelect
}) => (
    <button
        type="button"
        onClick={onSelect}
        className="flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none select-none"
    >
        <div
            className={`w-[84px] h-[52px] rounded-[8px] overflow-hidden border-2 transition p-1 flex flex-col justify-between relative ${
                active
                    ? 'border-accent shadow-[0_0_0_2px_rgba(10,132,255,0.25)]'
                    : 'border-black/10 dark:border-white/15 hover:border-black/25 dark:hover:border-white/30'
            }`}
            style={{
                background:
                    mode === 'light'
                        ? '#F2F3F7'
                        : mode === 'dark'
                          ? '#1C1D22'
                          : 'linear-gradient(135deg, #F2F3F7 50%, #1C1D22 50%)'
            }}
        >
            {/* macOS Window Traffic Lights */}
            <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F56]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFBD2E]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F]" />
            </div>

            {/* macOS Window Mock UI Content */}
            <div className="flex gap-1 flex-1 mt-1">
                <div
                    className="w-5 rounded-[3px]"
                    style={{
                        background:
                            mode === 'light'
                                ? 'rgba(0,0,0,0.08)'
                                : 'rgba(255,255,255,0.12)'
                    }}
                />
                <div className="flex-1 flex flex-col gap-0.5 justify-center">
                    <div
                        className="h-2 rounded-[2px] w-full"
                        style={{
                            background: 'var(--accent-color, #0A84FF)',
                            opacity: 0.85
                        }}
                    />
                    <div
                        className="h-1.5 rounded-[2px] w-4/5"
                        style={{
                            background:
                                mode === 'light'
                                    ? 'rgba(0,0,0,0.12)'
                                    : 'rgba(255,255,255,0.16)'
                        }}
                    />
                    <div
                        className="h-1.5 rounded-[2px] w-3/5"
                        style={{
                            background:
                                mode === 'light'
                                    ? 'rgba(0,0,0,0.08)'
                                    : 'rgba(255,255,255,0.1)'
                        }}
                    />
                </div>
            </div>
        </div>

        <span
            className={`text-[11px] font-medium transition ${
                active ? 'text-accent font-semibold' : 'text-secondary'
            }`}
        >
            {label}
        </span>
    </button>
);
