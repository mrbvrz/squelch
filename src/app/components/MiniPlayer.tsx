import React from 'react';
import type { PlayerState, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import { IconPause, IconPlay, IconStop } from '../../components/Icons';

export interface MiniPlayerProps {
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
    eqActive?: boolean;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
    currentStation,
    playerState,
    stateHeadline,
    streamTitle,
    isPlaying,
    isBusy,
    eqActive = false,
    api,
    t
}) => {
    return (
        <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-[9px] mac-settings-card mb-3.5">
            <div
                role="button"
                tabIndex={0}
                onClick={() => void api.togglePlayPause()}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
                <StationAvatar
                    logoUrl={currentStation?.logoUrl}
                    size="sm"
                    accentFallback
                    onResolveLogo={(url) => api.resolveStationLogo(url)}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[12px] font-bold truncate leading-tight">
                            {currentStation ? currentStation.name : 'Squelch'}
                        </span>
                        {eqActive && (
                            <span className="px-1 rounded-[3px] bg-accent/20 text-accent text-[9px] font-bold leading-tight">
                                EQ
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-secondary truncate mt-0.5 flex items-center gap-1">
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                                backgroundColor: stateHeadline.color
                            }}
                        />
                        <span className="truncate">
                            {streamTitle
                                ? streamTitle
                                : `${stateHeadline.main} · ${stateHeadline.sub}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {playerState !== 'idle' && (
                    <button
                        type="button"
                        onClick={() => void api.stopPlayback()}
                        title={t.stop}
                        aria-label={t.stop}
                        className="w-6 h-6 rounded-full mac-glass-pill flex items-center justify-center text-secondary hover:text-[#FF453A] cursor-pointer transition"
                    >
                        <IconStop size={11} />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => void api.togglePlayPause()}
                    title={isPlaying || isBusy ? t.statusPausedSub : t.play}
                    aria-label={
                        isPlaying || isBusy ? t.statusPausedSub : t.play
                    }
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer transition ${
                        isPlaying || isBusy
                            ? 'bg-[#30D158] hover:bg-[#28B84C]'
                            : 'bg-accent hover:opacity-90'
                    }`}
                >
                    {isPlaying || isBusy ? (
                        <IconPause size={12} />
                    ) : (
                        <IconPlay size={12} />
                    )}
                </button>
            </div>
        </div>
    );
};
