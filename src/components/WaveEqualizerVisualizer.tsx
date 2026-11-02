import React, { useState, useRef, useCallback } from 'react';
import { EQUALIZER_BANDS_META } from '../types';

export interface WaveEqualizerVisualizerProps {
    bands: [number, number, number, number, number, number, number, number];
    onChangeBand: (index: number, newDb: number) => void;
    enabled: boolean;
    lang?: 'id' | 'en';
    hintText?: string;
}

interface Point {
    x: number;
    y: number;
}

const SVG_WIDTH = 640;
const SVG_HEIGHT = 160;
const Y_CENTER = 80; // 0 dB
const Y_SPAN = 55; // Distance for 12 dB (so +12dB = 25, -12dB = 135)
const MIN_DB = -12;
const MAX_DB = 12;

function dbToY(db: number): number {
    const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
    return Y_CENTER - (clamped / MAX_DB) * Y_SPAN;
}

function yToDb(y: number): number {
    const rawDb = ((Y_CENTER - y) / Y_SPAN) * MAX_DB;
    const rounded = Math.round(rawDb);
    return Math.max(MIN_DB, Math.min(MAX_DB, rounded));
}

function calculateCatmullRomSpline(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return path;
}

export const WaveEqualizerVisualizer: React.FC<
    WaveEqualizerVisualizerProps
> = ({ bands, onChangeBand, enabled, hintText }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Compute column centers: 8 columns -> centers at 40, 120, 200, 280, 360, 440, 520, 600
    const nodePoints: Point[] = bands.map((db, idx) => ({
        x: 40 + idx * 80,
        y: dbToY(db)
    }));

    // Spline curve points spanning from x=0 to x=640
    const splinePoints: Point[] = [
        { x: 0, y: nodePoints[0]?.y ?? Y_CENTER },
        ...nodePoints,
        { x: SVG_WIDTH, y: nodePoints[nodePoints.length - 1]?.y ?? Y_CENTER }
    ];

    const curvePath = calculateCatmullRomSpline(splinePoints);
    const fillAreaPath = `${curvePath} L ${SVG_WIDTH} ${SVG_HEIGHT} L 0 ${SVG_HEIGHT} Z`;

    const handlePointerDown = (
        index: number,
        e: React.PointerEvent<SVGElement>
    ) => {
        if (!enabled) return;
        e.preventDefault();
        (e.target as Element).setPointerCapture(e.pointerId);
        setDraggingIndex(index);
    };

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (draggingIndex === null || !svgRef.current || !enabled) return;
            const rect = svgRef.current.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            const svgY = (relativeY / rect.height) * SVG_HEIGHT;
            const newDb = yToDb(svgY);
            onChangeBand(draggingIndex, newDb);
        },
        [draggingIndex, enabled, onChangeBand]
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (draggingIndex !== null) {
                try {
                    (e.target as Element).releasePointerCapture(e.pointerId);
                } catch {
                    // Safe ignore if pointer capture is already released
                }
                setDraggingIndex(null);
            }
        },
        [draggingIndex]
    );

    const handleNodeDoubleClick = (index: number) => {
        if (!enabled) return;
        onChangeBand(index, 0);
    };

    const handleNodeKeyDown = (
        index: number,
        e: React.KeyboardEvent<SVGGElement>
    ) => {
        if (!enabled) return;
        const currentDb = bands[index] ?? 0;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            onChangeBand(index, Math.min(MAX_DB, currentDb + 1));
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            onChangeBand(index, Math.max(MIN_DB, currentDb - 1));
        } else if (e.key === 'Home' || e.key === '0') {
            e.preventDefault();
            onChangeBand(index, 0);
        }
    };

    return (
        <div className="relative w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-linear-to-b from-black/[0.04] to-black/[0.08] dark:from-white/[0.03] dark:to-white/[0.07] p-3 select-none">
            {/* Top Toolbar / Readout bar */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        {enabled && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                        )}
                        <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                                enabled ? 'bg-accent' : 'bg-secondary/40'
                            }`}
                        />
                    </span>
                    <span className="text-[11px] font-semibold tracking-wide text-foreground uppercase">
                        Wave Equalizer
                    </span>
                    <span className="text-[10px] text-secondary font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                        8-Band Parametric
                    </span>
                </div>

                {hintText && (
                    <span className="text-[10px] text-secondary truncate hidden sm:inline-block">
                        {hintText}
                    </span>
                )}
            </div>

            {/* Interactive SVG Display */}
            <div className="relative w-full aspect-[4/1] sm:aspect-[4.5/1] max-h-48 overflow-hidden rounded-lg bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/5 shadow-inner">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    preserveAspectRatio="none"
                    className={`w-full h-full block ${
                        enabled
                            ? 'cursor-crosshair'
                            : 'cursor-not-allowed opacity-60'
                    }`}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <defs>
                        {/* Area gradient under response curve */}
                        <linearGradient
                            id="eqWaveGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="var(--accent-color, #0a84ff)"
                                stopOpacity={enabled ? 0.45 : 0.15}
                            />
                            <stop
                                offset="60%"
                                stopColor="var(--accent-color, #0a84ff)"
                                stopOpacity={enabled ? 0.18 : 0.05}
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--accent-color, #0a84ff)"
                                stopOpacity="0"
                            />
                        </linearGradient>

                        {/* Subtle glow filter for curve */}
                        <filter
                            id="eqGlowFilter"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Horizontal Reference Grid Lines & Decibel Labels */}
                    {[
                        { db: 12, y: 25, label: '+12 dB', solid: false },
                        { db: 6, y: 52.5, label: '+6 dB', solid: false },
                        { db: 0, y: 80, label: '0 dB', solid: true },
                        { db: -6, y: 107.5, label: '-6 dB', solid: false },
                        { db: -12, y: 135, label: '-12 dB', solid: false }
                    ].map((line) => (
                        <g key={line.db}>
                            <line
                                x1="0"
                                y1={line.y}
                                x2={SVG_WIDTH}
                                y2={line.y}
                                stroke="currentColor"
                                strokeOpacity={line.solid ? 0.22 : 0.08}
                                strokeWidth={line.solid ? 1.25 : 1}
                                strokeDasharray={line.solid ? undefined : '3 4'}
                            />
                            <text
                                x="8"
                                y={line.y - 3}
                                fill="currentColor"
                                opacity={line.solid ? 0.55 : 0.35}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight={line.solid ? 'bold' : 'normal'}
                            >
                                {line.label}
                            </text>
                        </g>
                    ))}

                    {/* Vertical Frequency Band Column Lines */}
                    {nodePoints.map((point, idx) => (
                        <line
                            key={`vcol-${idx}`}
                            x1={point.x}
                            y1="10"
                            x2={point.x}
                            y2={SVG_HEIGHT - 10}
                            stroke="currentColor"
                            strokeOpacity={
                                hoveredIndex === idx || draggingIndex === idx
                                    ? 0.25
                                    : 0.06
                            }
                            strokeWidth={
                                hoveredIndex === idx || draggingIndex === idx
                                    ? 1.5
                                    : 1
                            }
                            strokeDasharray="2 3"
                        />
                    ))}

                    {/* Gradient Area under Curve */}
                    <path
                        d={fillAreaPath}
                        fill="url(#eqWaveGradient)"
                        className="transition-all duration-75"
                    />

                    {/* Dynamic Moving Wave Flow Ripple (when enabled) */}
                    {enabled && (
                        <path
                            d={curvePath}
                            fill="none"
                            stroke="var(--accent-color, #0a84ff)"
                            strokeWidth="2"
                            strokeDasharray="12 24"
                            className="animate-eq-wave-flow opacity-60"
                        />
                    )}

                    {/* Main Frequency Response Spline Curve */}
                    <path
                        d={curvePath}
                        fill="none"
                        stroke="var(--accent-color, #0a84ff)"
                        strokeWidth={enabled ? 3 : 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={enabled ? 'url(#eqGlowFilter)' : undefined}
                        className="transition-all duration-75"
                    />

                    {/* Interactive Draggable Frequency Nodes */}
                    {nodePoints.map((point, idx) => {
                        const dbVal = bands[idx] ?? 0;
                        const isHovered = hoveredIndex === idx;
                        const isDragging = draggingIndex === idx;
                        const isNonZero = dbVal !== 0;
                        const meta = EQUALIZER_BANDS_META[idx];

                        return (
                            <g
                                key={`node-${idx}`}
                                className="outline-none"
                                role="slider"
                                tabIndex={enabled ? 0 : -1}
                                aria-label={`${meta.label} Equalizer Node`}
                                aria-valuenow={dbVal}
                                aria-valuemin={MIN_DB}
                                aria-valuemax={MAX_DB}
                                onKeyDown={(e) => handleNodeKeyDown(idx, e)}
                                onPointerEnter={() => setHoveredIndex(idx)}
                                onPointerLeave={() => setHoveredIndex(null)}
                            >
                                {/* Outer Pulse Aura on Hover or Non-zero Gain */}
                                {(isHovered || isDragging || isNonZero) &&
                                    enabled && (
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={isDragging ? 14 : 10}
                                            fill="var(--accent-color, #0a84ff)"
                                            opacity={isDragging ? 0.4 : 0.22}
                                            className={
                                                isDragging
                                                    ? 'scale-110'
                                                    : 'animate-eq-pulse'
                                            }
                                        />
                                    )}

                                {/* Node Body Circle */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={isDragging ? 7 : isHovered ? 6 : 5}
                                    fill={
                                        isDragging
                                            ? 'var(--accent-color, #0a84ff)'
                                            : '#ffffff'
                                    }
                                    stroke="var(--accent-color, #0a84ff)"
                                    strokeWidth={isDragging ? 2.5 : 2}
                                    className="cursor-ns-resize shadow-md transition-transform"
                                />

                                {/* Inner Core Dot */}
                                {!isDragging && (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r="2"
                                        fill="var(--accent-color, #0a84ff)"
                                        className="pointer-events-none"
                                    />
                                )}

                                {/* Interactive Invisible Hit Area */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="22"
                                    fill="transparent"
                                    className="cursor-ns-resize"
                                    onPointerDown={(e) =>
                                        handlePointerDown(idx, e)
                                    }
                                    onDoubleClick={() =>
                                        handleNodeDoubleClick(idx)
                                    }
                                />

                                {/* Floating Tooltip Pill on Hover or Drag */}
                                {(isHovered || isDragging) && (
                                    <g
                                        transform={`translate(${point.x}, ${Math.max(
                                            18,
                                            Math.min(
                                                SVG_HEIGHT - 18,
                                                point.y - 20
                                            )
                                        )})`}
                                        className="pointer-events-none transition-all"
                                    >
                                        <rect
                                            x="-32"
                                            y="-14"
                                            width="64"
                                            height="18"
                                            rx="4"
                                            fill="#1c1c1e"
                                            stroke="var(--accent-color, #0a84ff)"
                                            strokeWidth="1"
                                            opacity="0.95"
                                        />
                                        <text
                                            x="0"
                                            y="-2"
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="9"
                                            fontFamily="monospace"
                                            fontWeight="bold"
                                        >
                                            {meta.label}:{' '}
                                            {dbVal > 0 ? `+${dbVal}` : dbVal} dB
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
