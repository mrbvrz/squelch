import React, { useMemo } from 'react';
import type {
    ListeningStatsSummary,
    StatSeriesPoint,
    Station
} from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi, StatsPeriodMode } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import { formatDurationCompact } from '../../utils/appearance';
import { IconChart, IconPlay, IconStop } from '../../components/Icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

export interface StatsTabProps {
    statsSummary: ListeningStatsSummary;
    statsViewMode: StatsPeriodMode;
    setStatsViewMode: (mode: StatsPeriodMode) => void;
    activeChartPoints: StatSeriesPoint[];
    maxChartSeconds: number;
    stations: Station[];
    isPlayingStation: (stationId: string) => boolean;
    api: SquelchWindowApi;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const StatsTab: React.FC<StatsTabProps> = ({
    statsSummary,
    statsViewMode,
    setStatsViewMode,
    activeChartPoints,
    maxChartSeconds,
    stations,
    isPlayingStation,
    api,
    lang,
    t
}) => {
    const chartData = useMemo(() => {
        return activeChartPoints.map((pt) => ({
            key: pt.key,
            name: pt.label,
            seconds: pt.seconds,
            formatted: formatDurationCompact(pt.seconds, lang)
        }));
    }, [activeChartPoints, lang]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="mac-modal-surface px-3 py-2 rounded-xl shadow-2xl border border-card-border backdrop-blur-2xl text-xs space-y-1">
                    <div className="font-semibold text-secondary text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#FF375F]" />
                        {data.name}
                    </div>
                    <div className="font-extrabold text-[14px] tabular-nums bg-gradient-to-r from-[#0A84FF] via-[#BF5AF2] to-[#FF375F] bg-clip-text text-transparent">
                        {data.formatted}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            key="tab-stats"
            className="max-w-3xl space-y-6 text-xs animate-tab-enter"
        >
            {/* Top Hero Summary Card */}
            <div className="mac-settings-card">
                <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-[8px] bg-[#30D158] text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                            <IconChart size={19} />
                        </div>
                        <div>
                            <div className="text-[13px] font-bold">
                                {t.statsTitle}
                            </div>
                            <p className="text-[12px] text-secondary leading-relaxed mt-0.5">
                                {t.statsSubtitle}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-4 border-t mac-divider" />

                {/* 4 KPI Summary Metrics: Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x mac-divider px-2 py-3">
                    <div className="px-3">
                        <div className="text-[11px] text-secondary flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                            <span>
                                {t.statsTodayLabel ||
                                    (lang === 'id' ? 'Hari Ini' : 'Today')}
                            </span>
                        </div>
                        <div className="text-[18px] font-bold tabular-nums mt-0.5 text-[#0A84FF]">
                            {formatDurationCompact(
                                statsSummary.todaySeconds,
                                lang
                            )}
                        </div>
                    </div>
                    <div className="px-3">
                        <div className="text-[11px] text-secondary flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
                            <span>{t.statsWeekLabel}</span>
                        </div>
                        <div className="text-[18px] font-bold tabular-nums mt-0.5 text-[#30D158]">
                            {formatDurationCompact(
                                statsSummary.thisWeekSeconds,
                                lang
                            )}
                        </div>
                    </div>
                    <div className="px-3">
                        <div className="text-[11px] text-secondary flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A]" />
                            <span>{t.statsMonthLabel}</span>
                        </div>
                        <div className="text-[18px] font-bold tabular-nums mt-0.5 text-[#FF9F0A]">
                            {formatDurationCompact(
                                statsSummary.thisMonthSeconds,
                                lang
                            )}
                        </div>
                    </div>
                    <div className="px-3">
                        <div className="text-[11px] text-secondary flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#BF5AF2]" />
                            <span>{t.statsYearLabel}</span>
                        </div>
                        <div className="text-[18px] font-bold tabular-nums mt-0.5 text-[#BF5AF2]">
                            {formatDurationCompact(
                                statsSummary.thisYearSeconds,
                                lang
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Graph Card (Harian / Mingguan / Bulanan / Tahunan) */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-bold">
                            {t.statsChartTitle}
                        </h2>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] text-secondary select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5E5CE6]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#BF5AF2]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF375F]" />
                            <span className="text-[10px] font-medium ml-0.5">
                                {statsViewMode === 'daily'
                                    ? lang === 'id'
                                        ? '24 Jam'
                                        : '24 Hours'
                                    : statsViewMode === 'weekly'
                                      ? lang === 'id'
                                          ? '7 Hari'
                                          : '7 Days'
                                      : statsViewMode === 'monthly'
                                        ? lang === 'id'
                                            ? '30 Hari'
                                            : '30 Days'
                                        : lang === 'id'
                                          ? '12 Bulan'
                                          : '12 Months'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill">
                        {(
                            [
                                [
                                    'daily',
                                    t.statsDailyView ||
                                        (lang === 'id' ? 'Harian' : 'Daily')
                                ],
                                ['weekly', t.statsWeeklyView],
                                ['monthly', t.statsMonthlyView],
                                ['yearly', t.statsYearlyView]
                            ] as Array<[StatsPeriodMode, string]>
                        ).map(([mode, label]) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setStatsViewMode(mode)}
                                className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                    statsViewMode === mode
                                        ? 'bg-accent text-white shadow-xs'
                                        : 'text-secondary hover:text-foreground'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mac-settings-card p-4 pt-5">
                    <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 12,
                                    left: -16,
                                    bottom: 0
                                }}
                            >
                                <defs>
                                    {/* Horizontal flowing spectrum gradient for the line curve */}
                                    <linearGradient
                                        id="strokeGradient"
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="0"
                                    >
                                        <stop offset="0%" stopColor="#0A84FF" />
                                        <stop
                                            offset="30%"
                                            stopColor="#5E5CE6"
                                        />
                                        <stop
                                            offset="65%"
                                            stopColor="#BF5AF2"
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#FF375F"
                                        />
                                    </linearGradient>

                                    {/* Vertical ambient glow area fill */}
                                    <linearGradient
                                        id="areaGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#5E5CE6"
                                            stopOpacity={0.45}
                                        />
                                        <stop
                                            offset="35%"
                                            stopColor="#BF5AF2"
                                            stopOpacity={0.22}
                                        />
                                        <stop
                                            offset="70%"
                                            stopColor="#0A84FF"
                                            stopOpacity={0.06}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#0A84FF"
                                            stopOpacity={0.0}
                                        />
                                    </linearGradient>

                                    {/* Subtle drop shadow glow for the curve */}
                                    <filter
                                        id="chartLineGlow"
                                        x="-20%"
                                        y="-20%"
                                        width="140%"
                                        height="140%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="3"
                                            floodColor="#5E5CE6"
                                            floodOpacity={0.4}
                                        />
                                    </filter>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="rgba(128, 128, 128, 0.12)"
                                />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 10,
                                        fill: 'var(--ink-secondary)'
                                    }}
                                    interval={
                                        statsViewMode === 'daily'
                                            ? 3
                                            : statsViewMode === 'monthly'
                                              ? 4
                                              : 0
                                    }
                                />
                                <YAxis
                                    domain={[0, Math.max(60, maxChartSeconds)]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 10,
                                        fill: 'var(--ink-secondary)'
                                    }}
                                    tickFormatter={(sec: number) =>
                                        formatDurationCompact(sec, lang)
                                    }
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{
                                        stroke: '#BF5AF2',
                                        strokeWidth: 1,
                                        strokeDasharray: '3 3',
                                        strokeOpacity: 0.6
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="seconds"
                                    stroke="url(#strokeGradient)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#areaGradient)"
                                    filter="url(#chartLineGlow)"
                                    activeDot={{
                                        r: 6,
                                        fill: '#FF375F',
                                        stroke: '#ffffff',
                                        strokeWidth: 2.5
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Listened Stations List */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1">
                    {t.statsTopStationsTitle}
                </h2>
                <div className="mac-settings-card mac-inset-list overflow-hidden">
                    {statsSummary.topStations.length === 0 ? (
                        <div className="p-8 text-center text-secondary">
                            {t.statsEmptyText}
                        </div>
                    ) : (
                        statsSummary.topStations.map((st, idx) => {
                            const topMax =
                                statsSummary.topStations[0]?.seconds || 1;
                            const pct = Math.max(
                                6,
                                Math.round((st.seconds / topMax) * 100)
                            );
                            const stationObj = stations.find(
                                (item) => item.id === st.stationId
                            );
                            const resolvedName =
                                stationObj?.name ??
                                st.stationName ??
                                (st.stationId.startsWith('station-')
                                    ? 'Radio Station'
                                    : st.stationId);
                            const resolvedLogo =
                                stationObj?.logoUrl ?? st.logoUrl;
                            const active = isPlayingStation(st.stationId);
                            return (
                                <div
                                    key={st.stationId}
                                    className="px-4 py-3 flex items-center justify-between gap-4 mac-row cursor-pointer"
                                    onClick={() =>
                                        void api.playStation(st.stationId)
                                    }
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <span className="w-5 h-5 rounded-[5px] mac-glass-pill text-[11px] font-bold tabular-nums flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>

                                        <StationAvatar
                                            logoUrl={resolvedLogo}
                                            size="sm"
                                            accentFallback
                                            onResolveLogo={(url) =>
                                                api.resolveStationLogo(url)
                                            }
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[13px] font-medium truncate">
                                                        {resolvedName}
                                                    </span>
                                                    {stationObj && (
                                                        <span className="text-[11px] text-secondary truncate">
                                                            · {stationObj.genre}{' '}
                                                            · {stationObj.city}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[12px] font-semibold text-secondary tabular-nums shrink-0 ml-2">
                                                    {formatDurationCompact(
                                                        st.seconds,
                                                        lang
                                                    )}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] via-[#5E5CE6] to-[#FF375F] transition-all duration-300"
                                                    style={{
                                                        width: `${pct}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 shrink-0 ml-2"
                                    >
                                        <button
                                            type="button"
                                            title={active ? t.stop : t.play}
                                            aria-label={
                                                active ? t.stop : t.play
                                            }
                                            onClick={() =>
                                                active
                                                    ? void api.stopPlayback()
                                                    : void api.playStation(
                                                          st.stationId
                                                      )
                                            }
                                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                active
                                                    ? 'bg-[#30D158] text-white'
                                                    : 'mac-glass-pill hover:bg-white/15'
                                            }`}
                                        >
                                            {active ? (
                                                <IconStop size={12} />
                                            ) : (
                                                <IconPlay size={12} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
