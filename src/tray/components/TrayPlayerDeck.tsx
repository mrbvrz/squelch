import React from 'react';
import type { PlayerState, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import { StationAvatar } from '../../components/StationAvatar';
import {
    IconPause,
    IconPlay,
    IconRadioTower,
    IconSpeaker,
    IconSpeakerMute,
    IconStop,
    IconTimer
} from '../../components/Icons';

export interface TrayPlayerDeckProps {
    currentStation: Station | null;
    streamTitle: string | null;
    playerState: PlayerState;
    stateHeadline: { main: string; sub: string; color: string };
    isPlaying: boolean;
    isBusy: boolean;
    spectrumBars: number[];
    sleepMinutes: number | null;
    volume: number;
    isMuted: boolean;
    hasEqualizer: boolean;
    isInteractingVolumeRef: React.MutableRefObject<boolean>;
    onResolveStationLogo: (url: string) => Promise<string>;
    onStopPlayback: () => void;
    onTogglePlayPause: () => void;
    onSetSleepTimer: (minutes: number | null) => void;
    onToggleMute: () => void;
    onVolumeChange: (newVol: number) => void;
    t: TranslationDictionary;
}

export const TrayPlayerDeck: React.FC<TrayPlayerDeckProps> = ({
    currentStation,
    streamTitle,
    playerState,
    stateHeadline,
    isPlaying,
    isBusy,
    spectrumBars,
    sleepMinutes,
    volume,
    isMuted,
    hasEqualizer,
    isInteractingVolumeRef,
    onResolveStationLogo,
    onStopPlayback,
    onTogglePlayPause,
    onSetSleepTimer,
    onToggleMute,
    onVolumeChange,
    t
}) => {
    return (
        <div className="mac-settings-card p-3 flex flex-col gap-2.5">
            {/* Primary Station Identity & Playback Controls */}
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <StationAvatar
                        logoUrl={currentStation?.logoUrl}
                        size="md"
                        accentFallback
                        onResolveLogo={onResolveStationLogo}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[13px] font-bold truncate leading-tight text-foreground">
                                {currentStation
                                    ? currentStation.name
                                    : t.traySelectPrompt}
                            </span>
                            {hasEqualizer && (
                                <span className="px-1 rounded-[3px] bg-accent/20 text-accent text-[9px] font-bold leading-tight shrink-0">
                                    EQ
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] text-secondary truncate mt-0.5 flex items-center gap-1.5">
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                    backgroundColor: stateHeadline.color
                                }}
                            />
                            <span className="truncate">
                                {streamTitle
                                    ? streamTitle
                                    : currentStation
                                      ? `${currentStation.genre} · ${currentStation.city}`
                                      : t.trayClickStationHint}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {playerState !== 'idle' && (
                        <button
                            type="button"
                            onClick={onStopPlayback}
                            aria-label={t.stop}
                            title={t.stop}
                            className="mac-glass-pill w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:text-[#FF453A] transition"
                        >
                            <IconStop size={13} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onTogglePlayPause}
                        aria-label={
                            isPlaying || isBusy ? t.statusPausedSub : t.play
                        }
                        title={isPlaying || isBusy ? t.statusPausedSub : t.play}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer transition ${
                            isPlaying || isBusy
                                ? 'bg-[#30D158] hover:bg-[#28B84C]'
                                : 'bg-accent hover:opacity-90'
                        }`}
                    >
                        {isPlaying || isBusy ? (
                            <IconPause size={15} />
                        ) : (
                            <IconPlay size={15} />
                        )}
                    </button>
                </div>
            </div>

            {/* Secondary Row: Signal Waveform & Sleep Timer Quick Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t mac-divider">
                {/* Live Audio Equalizer Waveform */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <IconRadioTower
                        size={12}
                        className={
                            isPlaying
                                ? 'text-[#30D158] animate-pulse shrink-0'
                                : 'text-muted shrink-0'
                        }
                    />
                    <span
                        className="text-[10px] font-bold uppercase tracking-wider tabular-nums shrink-0"
                        style={{ color: stateHeadline.color }}
                    >
                        {isPlaying ? t.traySignalStreaming : t.traySignalReady}
                    </span>
                    <div className="flex items-end gap-1 h-3.5 w-16 px-0.5">
                        {spectrumBars.slice(0, 7).map((heightPct, idx) => (
                            <div
                                key={idx}
                                className="flex-1 rounded-[1.5px] transition-all duration-300"
                                style={{
                                    height: `${Math.max(15, heightPct)}%`,
                                    backgroundColor: isPlaying
                                        ? '#30D158'
                                        : 'rgba(142, 142, 147, 0.35)'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Sleep Timer Selector */}
                <div className="flex items-center gap-1 shrink-0">
                    <IconTimer size={12} className="text-secondary mr-0.5" />
                    {(
                        [
                            [null, t.traySleepOff],
                            [15, '15m'],
                            [30, '30m'],
                            [60, '60m']
                        ] as Array<[number | null, string]>
                    ).map(([val, label]) => {
                        const active = sleepMinutes === val;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => onSetSleepTimer(val)}
                                className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold tabular-nums cursor-pointer transition ${
                                    active
                                        ? 'bg-accent text-white shadow-xs'
                                        : 'mac-glass-pill hover:bg-white/15'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tertiary Row: Quick Volume & Mute Slider */}
            <div className="flex items-center gap-2 pt-2 border-t mac-divider">
                <button
                    type="button"
                    onClick={onToggleMute}
                    className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition cursor-pointer shrink-0 ${
                        isMuted
                            ? 'text-[#FF453A] bg-[#FF453A]/15'
                            : 'text-secondary hover:text-foreground'
                    }`}
                    title={isMuted ? 'Bunyikan (Unmute)' : 'Bisukan (Mute)'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <IconSpeakerMute size={12} />
                    ) : (
                        <IconSpeaker size={12} />
                    )}
                </button>

                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : Math.round(volume * 100)}
                        onPointerDown={() => {
                            isInteractingVolumeRef.current = true;
                        }}
                        onPointerUp={() => {
                            isInteractingVolumeRef.current = false;
                        }}
                        onChange={(e) => {
                            const newPct = Number(e.target.value);
                            onVolumeChange(newPct / 100);
                        }}
                        className="mac-slider"
                        style={{
                            background: `linear-gradient(to right, var(--accent-color, #0a84ff) 0%, var(--accent-color, #0a84ff) ${
                                isMuted ? 0 : Math.round(volume * 100)
                            }%, rgba(120, 120, 128, 0.2) ${
                                isMuted ? 0 : Math.round(volume * 100)
                            }%, rgba(120, 120, 128, 0.2) 100%)`
                        }}
                        aria-label="Volume"
                    />
                    <span className="text-[10px] text-secondary font-mono tabular-nums shrink-0 w-8 text-right select-none">
                        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                </div>
            </div>
        </div>
    );
};
