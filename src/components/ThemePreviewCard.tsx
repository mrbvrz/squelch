import React from 'react';
import type { ThemeMode } from '../types';

export interface ThemePreviewCardProps {
    mode: ThemeMode;
    active: boolean;
    label: string;
    subtitle?: string;
    customAccent?: string;
    onSelect: () => void;
}

interface ThemePreviewStyle {
    background: string;
    sidebarBg: string;
    accent: string;
    line1Bg: string;
    line2Bg: string;
    borderColor?: string;
}

function getThemePreviewStyle(
    mode: ThemeMode,
    customAccent?: string
): ThemePreviewStyle {
    switch (mode) {
        case 'light':
            return {
                background: '#F2F3F7',
                sidebarBg: 'rgba(0,0,0,0.08)',
                accent: customAccent || '#0A84FF',
                line1Bg: 'rgba(0,0,0,0.14)',
                line2Bg: 'rgba(0,0,0,0.08)'
            };
        case 'dark':
            return {
                background: '#1C1D22',
                sidebarBg: 'rgba(255,255,255,0.12)',
                accent: customAccent || '#0A84FF',
                line1Bg: 'rgba(255,255,255,0.18)',
                line2Bg: 'rgba(255,255,255,0.1)'
            };
        case 'cukup-senja':
            return {
                background: '#181816',
                sidebarBg: '#131311',
                accent: '#E89058',
                line1Bg: 'rgba(216, 213, 205, 0.3)',
                line2Bg: 'rgba(120, 119, 111, 0.25)',
                borderColor: 'rgba(232, 144, 88, 0.4)'
            };
        case 'cukup-malam':
            return {
                background: '#131718',
                sidebarBg: '#0E1213',
                accent: '#E6A854',
                line1Bg: 'rgba(214, 224, 221, 0.3)',
                line2Bg: 'rgba(106, 120, 117, 0.25)',
                borderColor: 'rgba(230, 168, 84, 0.4)'
            };
        case 'cukup-kopi':
            return {
                background: '#161413',
                sidebarBg: '#11100E',
                accent: '#E87D4B',
                line1Bg: 'rgba(224, 216, 208, 0.3)',
                line2Bg: 'rgba(122, 114, 106, 0.25)',
                borderColor: 'rgba(232, 125, 75, 0.4)'
            };
        case 'cukup-terang':
            return {
                background: '#FAF8F5',
                sidebarBg: '#F2EFE9',
                accent: '#D96B27',
                line1Bg: 'rgba(44, 40, 37, 0.22)',
                line2Bg: 'rgba(138, 130, 120, 0.18)',
                borderColor: 'rgba(217, 107, 39, 0.4)'
            };
        case 'system':
        default:
            return {
                background:
                    'linear-gradient(135deg, #F2F3F7 50%, #1C1D22 50%)',
                sidebarBg: 'rgba(128,128,128,0.18)',
                accent: customAccent || 'var(--accent-color, #0A84FF)',
                line1Bg: 'rgba(128,128,128,0.25)',
                line2Bg: 'rgba(128,128,128,0.15)'
            };
    }
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
    mode,
    active,
    label,
    subtitle,
    customAccent,
    onSelect
}) => {
    const preview = getThemePreviewStyle(mode, customAccent);

    return (
        <button
            type="button"
            onClick={onSelect}
            className="flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none select-none w-full"
        >
            <div
                className={`w-full max-w-[96px] h-[54px] rounded-[9px] overflow-hidden border-2 transition p-1.5 flex flex-col justify-between relative shadow-xs ${
                    active
                        ? 'border-accent shadow-[0_0_0_2px_var(--accent-color,rgba(10,132,255,0.3))]'
                        : 'border-black/10 dark:border-white/15 hover:border-black/25 dark:hover:border-white/30'
                }`}
                style={{
                    background: preview.background
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
                        className="w-5 rounded-[3px] shrink-0"
                        style={{
                            background: preview.sidebarBg
                        }}
                    />
                    <div className="flex-1 flex flex-col gap-0.5 justify-center min-w-0">
                        <div
                            className="h-2 rounded-[2px] w-full"
                            style={{
                                background: preview.accent,
                                opacity: 0.95
                            }}
                        />
                        <div
                            className="h-1.5 rounded-[2px] w-4/5"
                            style={{
                                background: preview.line1Bg
                            }}
                        />
                        <div
                            className="h-1.5 rounded-[2px] w-3/5"
                            style={{
                                background: preview.line2Bg
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center text-center">
                <span
                    className={`text-[11px] font-medium leading-tight transition ${
                        active ? 'text-accent font-semibold' : 'text-primary'
                    }`}
                >
                    {label}
                </span>
                {subtitle && (
                    <span className="text-[9.5px] text-secondary/70 leading-tight mt-0.5 line-clamp-1">
                        {subtitle}
                    </span>
                )}
            </div>
        </button>
    );
};
