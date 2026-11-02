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
        className="flex flex-col items-center gap-2 cursor-pointer group focus:outline-none"
    >
        <div
            className={`w-32 h-20 rounded-[10px] overflow-hidden border-2 transition p-1.5 flex flex-col justify-between relative ${
                active
                    ? 'border-accent shadow-[0_0_0_2px_rgba(10,132,255,0.25)]'
                    : 'border-white/15 hover:border-white/30'
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
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
            </div>

            <div className="flex gap-1.5 flex-1 mt-1.5">
                <div
                    className="w-8 rounded-[4px]"
                    style={{
                        background:
                            mode === 'light'
                                ? 'rgba(0,0,0,0.08)'
                                : 'rgba(255,255,255,0.12)'
                    }}
                />
                <div className="flex-1 flex flex-col gap-1">
                    <div
                        className="h-3 rounded-[3px] w-full"
                        style={{
                            background: 'var(--accent-color, #0A84FF)',
                            opacity: 0.85
                        }}
                    />
                    <div
                        className="h-2.5 rounded-[3px] w-4/5"
                        style={{
                            background:
                                mode === 'light'
                                    ? 'rgba(0,0,0,0.12)'
                                    : 'rgba(255,255,255,0.16)'
                        }}
                    />
                    <div
                        className="h-2.5 rounded-[3px] w-3/5"
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
            className={`text-[12px] font-medium ${
                active ? 'text-accent font-semibold' : 'text-secondary'
            }`}
        >
            {label}
        </span>
    </button>
);
