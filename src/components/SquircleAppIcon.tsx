import React from 'react';

export interface SquircleAppIconProps {
    dataUrl?: string | null;
    size?: number;
}

/**
 * Renders the exact macOS Sonoma/Sequoia Squircle App Icon matching `app-icon-generator.ts`
 * (Azure-to-Cobalt gradient squircle, inner specular top rim, concentric broadcast ring,
 * and 5-bar white capsule waveform emblem).
 */
export const SquircleAppIcon: React.FC<SquircleAppIconProps> = ({
    dataUrl,
    size = 84
}) => {
    if (dataUrl) {
        return (
            <img
                src={dataUrl}
                alt="Squelch App Icon"
                width={size}
                height={size}
                style={{ width: size, height: size }}
                className="shrink-0 select-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
            />
        );
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 select-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
            aria-label="Squelch App Icon"
        >
            <defs>
                <linearGradient
                    id="squelchBgGrad"
                    x1="128"
                    y1="23"
                    x2="128"
                    y2="233"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#2AA8FF" />
                    <stop offset="45%" stopColor="#0E94FF" />
                    <stop offset="100%" stopColor="#004ADA" />
                </linearGradient>
            </defs>
            {/* macOS Squircle Body */}
            <rect
                x="23"
                y="23"
                width="210"
                height="210"
                rx="47"
                fill="url(#squelchBgGrad)"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="2"
            />
            {/* Subtle Concentric Broadcast Ring */}
            <circle
                cx="128"
                cy="128"
                r="77"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="3"
            />
            {/* Crisp White 5-Bar Capsule Waveform Emblem */}
            <rect x="73" y="107" width="18" height="42" rx="9" fill="#FFFFFF" />
            <rect x="96" y="88" width="18" height="80" rx="9" fill="#FFFFFF" />
            <rect
                x="119"
                y="73"
                width="18"
                height="110"
                rx="9"
                fill="#FFFFFF"
            />
            <rect x="142" y="88" width="18" height="80" rx="9" fill="#FFFFFF" />
            <rect
                x="165"
                y="107"
                width="18"
                height="42"
                rx="9"
                fill="#FFFFFF"
            />
        </svg>
    );
};
