import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
    Station,
    StationsDataSchema,
    AppSettings,
    PlayerState,
    PlayerStatus
} from '../types';
import { getTranslations } from '../i18n';
import {
    applyAppearanceVariables,
    bindActiveScrollbars
} from '../utils/appearance';
import { AboutModal } from '../app/modals/AboutModal';
import { QuitConfirmModal } from '../app/modals/QuitConfirmModal';
import {
    IconCompass,
    IconInfo,
    IconPause,
    IconPlay,
    IconPlus,
    IconPower,
    IconRadioTower,
    IconSearch,
    IconSliders,
    IconSpeaker,
    IconSpeakerMute,
    IconStar,
    IconStop,
    IconTimer
} from '../components/Icons';
import { StationAvatar } from '../components/StationAvatar';

interface SquelchTrayPopoverApi {
    getPlayerStatus: () => Promise<PlayerStatus>;
    playStation: (stationId: string) => Promise<boolean>;
    togglePlayPause: () => Promise<boolean>;
    stopPlayback: () => Promise<boolean>;
    setVolume?: (vol: number) => Promise<number>;
    toggleMute?: () => Promise<boolean>;
    setSleepTimer: (minutes: number | null) => Promise<boolean>;
    openWindowTab: (
        tab:
            | 'stations'
            | 'discover'
            | 'stats'
            | 'preferences'
            | 'about'
            | 'updates'
    ) => Promise<boolean>;
    quitApp: () => Promise<boolean>;
    requestQuitConfirm: () => Promise<void>;
    getStationsData: () => Promise<StationsDataSchema>;
    resolveStationLogo: (logoUrl: string) => Promise<string | null>;
    getSettings: () => Promise<{
        settings: AppSettings;
        dataDir: string;
    }>;
    toggleFavorite: (stationId: string) => Promise<Station | undefined>;
    sendNotification: (title: string, body: string) => Promise<boolean>;
    onStateChanged: (cb: (data: unknown) => void) => () => void;
    openExternalUrl?: (url: string) => Promise<boolean>;
    getAppIconDataUrl?: () => Promise<string | null>;
}

export const TrayPopoverApp: React.FC = () => {
    const api = window.squelchApi as SquelchTrayPopoverApi;

    const [playerState, setPlayerState] = useState<PlayerState>('idle');
    const [reconnectAttempt, setReconnectAttempt] = useState<number | null>(
        null
    );
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [streamTitle, setStreamTitle] = useState<string | null>(null);
    const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
    const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(
        null
    );
    const [volume, setVolume] = useState<number>(1.0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const isInteractingVolume = useRef<boolean>(false);

    const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
    const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState<boolean>(false);
    const [appIconDataUrl, setAppIconDataUrl] = useState<string | null>(null);

    const [stations, setStations] = useState<Station[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [searchText, setSearchText] = useState<string>('');
    const [tick, setTick] = useState<number>(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const settingsRef = useRef<AppSettings | null>(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const t = getTranslations(settings?.language);

    useEffect(() => {
        if (api?.getAppIconDataUrl) {
            void api.getAppIconDataUrl().then((url) => {
                if (url) setAppIconDataUrl(url);
            });
        }
    }, [api]);

    useEffect(() => {
        const handleOpenAbout = () => {
            setIsQuitConfirmOpen(false);
            setIsAboutOpen(true);
        };

        const handleConfirmQuit = () => {
            setIsAboutOpen(false);
            if (settingsRef.current?.confirmBeforeQuit === false) {
                void api.quitApp();
            } else {
                setIsQuitConfirmOpen(true);
            }
        };

        window.addEventListener('squelch:open-about', handleOpenAbout);
        window.addEventListener('squelch:confirm-quit', handleConfirmQuit);

        let unlistenAbout: (() => void) | null = null;
        let unlistenQuit: (() => void) | null = null;

        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            import('@tauri-apps/api/event')
                .then(({ listen }) => {
                    listen('squelch:open-about', () => {
                        handleOpenAbout();
                    }).then((u) => {
                        unlistenAbout = u;
                    });
                    listen('squelch:confirm-quit', () => {
                        handleConfirmQuit();
                    }).then((u) => {
                        unlistenQuit = u;
                    });
                })
                .catch(() => {});
        }

        const handleWindowBlur = () => {
            setIsAboutOpen(false);
            setIsQuitConfirmOpen(false);
        };
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('squelch:open-about', handleOpenAbout);
            window.removeEventListener(
                'squelch:confirm-quit',
                handleConfirmQuit
            );
            window.removeEventListener('blur', handleWindowBlur);
            if (unlistenAbout) unlistenAbout();
            if (unlistenQuit) unlistenQuit();
        };
    }, [api]);

    useEffect(() => {
        const handlePopoverKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isEditing = target && target.tagName === 'INPUT';

            if (e.key === 'Escape') {
                if (isAboutOpen) {
                    setIsAboutOpen(false);
                    return;
                }
                if (isQuitConfirmOpen) {
                    setIsQuitConfirmOpen(false);
                    return;
                }
                if (searchText) {
                    setSearchText('');
                    target?.blur();
                    return;
                }
                return;
            }

            if (
                ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') ||
                (!isEditing && e.key === '/' && !e.metaKey && !e.ctrlKey)
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                return;
            }

            if (isEditing) return;

            if (e.code === 'Space') {
                e.preventDefault();
                void api.togglePlayPause();
                return;
            }

            if (e.key.toLowerCase() === 'm') {
                e.preventDefault();
                const globalApi = (window as any).squelchApi;
                void globalApi?.toggleMute?.();
                return;
            }
        };

        window.addEventListener('keydown', handlePopoverKeyDown);
        return () =>
            window.removeEventListener('keydown', handlePopoverKeyDown);
    }, [searchText, api]);

    const loadData = async () => {
        const [status, stData, cfg] = await Promise.all([
            api.getPlayerStatus(),
            api.getStationsData(),
            api.getSettings()
        ]);
        setPlayerState(status.state);
        setReconnectAttempt(status.reconnectAttempt ?? null);
        setCurrentStation(status.currentStation);
        setStreamTitle(status.streamTitle);
        setSleepMinutes(status.sleepTimerMinutes);
        setSleepRemainingSec(status.sleepTimerRemainingSec);
        if (!isInteractingVolume.current) {
            if (typeof status.volume === 'number') {
                const raw = status.volume;
                const normalized = raw > 1 ? raw / 100 : raw;
                setVolume(Math.max(0, Math.min(1, normalized)));
            }
            if (typeof status.isMuted === 'boolean') {
                setIsMuted(status.isMuted);
            }
        }
        setStations(stData.stations);
        setGroups(stData.groups);
        if (cfg?.settings) {
            setSettings(cfg.settings);
            applyAppearanceVariables(cfg.settings);
        }
    };

    useEffect(() => {
        void loadData();
        const unbindScroll = bindActiveScrollbars();
        const unsub = api.onStateChanged(() => {
            void loadData();
        });
        return () => {
            unbindScroll();
            unsub();
        };
    }, []);

    useEffect(() => {
        if (playerState !== 'playing') return;
        const interval = setInterval(() => {
            setTick((prev) => (prev + 1) % 1000);
        }, 320);
        return () => clearInterval(interval);
    }, [playerState]);

    const isPlaying = playerState === 'playing';
    const isBusy =
        playerState === 'connecting' ||
        playerState === 'buffering' ||
        playerState === 'reconnecting';

    const filteredStations = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        return stations.filter((s) => {
            if (activeFilter === 'FAV' && !s.isFavorite) return false;
            if (
                activeFilter !== 'ALL' &&
                activeFilter !== 'FAV' &&
                s.group !== activeFilter
            ) {
                return false;
            }
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q) ||
                s.city.toLowerCase().includes(q) ||
                s.genre.toLowerCase().includes(q)
            );
        });
    }, [stations, activeFilter, searchText]);

    const spectrumBars = useMemo(() => {
        const base = [24, 52, 78, 44, 88, 62, 34, 72];
        if (!isPlaying) return base.map(() => 14);
        return base.map((val, i) => {
            const wave = Math.sin((tick + i * 1.6) * 0.85) * 18;
            return Math.max(16, Math.min(96, Math.round(val + wave)));
        });
    }, [isPlaying, tick]);

    const favCount = useMemo(
        () => stations.filter((s) => s.isFavorite).length,
        [stations]
    );

    const stateHeadline = useMemo(() => {
        switch (playerState) {
            case 'playing':
                return { main: 'LIVE', sub: t.statusLiveSub, color: '#30D158' };
            case 'connecting':
                return {
                    main: 'SYNC',
                    sub: t.statusConnectingSub,
                    color: '#FF9F0A'
                };
            case 'buffering':
                return {
                    main: 'WAIT',
                    sub: t.statusBufferingSub,
                    color: '#FF9F0A'
                };
            case 'reconnecting':
                return {
                    main: 'RETRY',
                    sub: reconnectAttempt
                        ? `${t.statusReconnectingSub} (${reconnectAttempt})`
                        : t.statusReconnectingSub,
                    color: '#FF9F0A'
                };
            case 'paused':
                return {
                    main: 'HOLD',
                    sub: t.statusPausedSub,
                    color: '#8E8E93'
                };
            case 'error':
                return {
                    main: 'ERR',
                    sub: t.statusOfflineSub,
                    color: '#FF453A'
                };
            case 'idle':
            default:
                return {
                    main: 'IDLE',
                    sub: t.statusStandbySub,
                    color: '#8E8E93'
                };
        }
    }, [playerState, t]);

    return (
        <div className="mac-popover-shell animate-tab-enter w-full h-full p-3 flex flex-col justify-between overflow-hidden select-none">
            {/* 1. LIVE 1-MINUTE SLEEP COUNTDOWN NOTIFICATION BANNER */}
            {sleepRemainingSec !== null &&
                sleepRemainingSec > 0 &&
                sleepRemainingSec <= 60 && (
                    <div
                        role="alert"
                        className="mac-settings-card animate-collapse-enter mb-2.5 px-3 py-2 border border-[#FF9F0A]/45 bg-[#FF9F0A]/15 flex items-center justify-between gap-2.5"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-[7px] bg-[#FF9F0A] text-white flex items-center justify-center font-bold text-[11px] tabular-nums shrink-0 animate-pulse">
                                {sleepRemainingSec}s
                            </div>
                            <div className="min-w-0">
                                <div className="text-[11px] font-bold leading-tight truncate">
                                    {t.sleepCountdownTitle}
                                </div>
                                <div className="text-[10px] text-secondary truncate tabular-nums">
                                    {t.sleepCountdownDesc.replace(
                                        '{sec}',
                                        String(sleepRemainingSec)
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => void api.setSleepTimer(null)}
                            className="px-2.5 py-1 rounded-[6px] bg-[#FF9F0A] text-white text-[10px] font-bold shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm"
                        >
                            {t.sleepCancelBtn}
                        </button>
                    </div>
                )}

            {/* 2. UNIFIED TRAY PLAYER DECK (Single Layer Card, Reduced Nesting) */}
            <div className="mac-settings-card p-3 flex flex-col gap-2.5">
                {/* Primary Station Identity & Playback Controls */}
                <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <StationAvatar
                            logoUrl={currentStation?.logoUrl}
                            size="md"
                            accentFallback
                            onResolveLogo={(url) => api.resolveStationLogo(url)}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[13px] font-bold truncate leading-tight text-foreground">
                                    {currentStation
                                        ? currentStation.name
                                        : t.traySelectPrompt}
                                </span>
                                {settings?.equalizer?.enabled && (
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
                                onClick={() => void api.stopPlayback()}
                                aria-label={t.stop}
                                title={t.stop}
                                className="mac-glass-pill w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:text-[#FF453A] transition"
                            >
                                <IconStop size={13} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => void api.togglePlayPause()}
                            aria-label={
                                isPlaying || isBusy ? t.statusPausedSub : t.play
                            }
                            title={
                                isPlaying || isBusy ? t.statusPausedSub : t.play
                            }
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
                            {isPlaying
                                ? t.traySignalStreaming
                                : t.traySignalReady}
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
                        <IconTimer
                            size={12}
                            className="text-secondary mr-0.5"
                        />
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
                                    onClick={() => void api.setSleepTimer(val)}
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
                        onClick={async () => {
                            if (api.toggleMute) {
                                const muted = await api.toggleMute();
                                setIsMuted(muted);
                            }
                        }}
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
                                isInteractingVolume.current = true;
                            }}
                            onPointerUp={() => {
                                isInteractingVolume.current = false;
                            }}
                            onChange={(e) => {
                                const newPct = Number(e.target.value);
                                const newVol = newPct / 100;
                                setVolume(newVol);
                                if (isMuted && newPct > 0) {
                                    setIsMuted(false);
                                }
                                if (api.setVolume) {
                                    void api.setVolume(newVol);
                                }
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

            {/* 4. STATION DIRECTORY CARD (Unified 10px Radius & Rounded-[6px] Filter Pills) */}
            <div className="mac-settings-card mt-2.5 p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mb-2">
                    <button
                        type="button"
                        onClick={() => setActiveFilter('ALL')}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 tabular-nums cursor-pointer transition ${
                            activeFilter === 'ALL'
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
                        }`}
                    >
                        {t.trayAllFilter} ({stations.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveFilter('FAV')}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 tabular-nums flex items-center gap-1 cursor-pointer transition ${
                            activeFilter === 'FAV'
                                ? 'bg-accent text-white'
                                : 'mac-glass-pill'
                        }`}
                    >
                        <IconStar size={11} filled={activeFilter === 'FAV'} />
                        <span>
                            {t.trayFavFilter} ({favCount})
                        </span>
                    </button>
                    {groups.map((grp) => (
                        <button
                            key={grp}
                            type="button"
                            onClick={() => setActiveFilter(grp)}
                            className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold shrink-0 cursor-pointer transition ${
                                activeFilter === grp
                                    ? 'bg-accent text-white'
                                    : 'mac-glass-pill'
                            }`}
                        >
                            {grp.split(' ')[0]}
                        </button>
                    ))}
                </div>

                <div className="relative flex items-center mb-2">
                    <IconSearch
                        size={13}
                        className="absolute left-2.5 text-muted pointer-events-none"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t.traySearchPlaceholder}
                        aria-label={t.traySearchPlaceholder}
                        className="mac-input w-full pl-7 pr-2.5 py-1.5 rounded-[7px] text-[11px]"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                    {stations.length === 0 ? (
                        <div className="py-8 text-center text-xs text-secondary flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                <IconRadioTower size={20} />
                            </div>
                            <span className="font-semibold">
                                {t.emptyStationsTitle}
                            </span>
                            <p className="text-[11px] text-muted max-w-[220px] leading-tight">
                                {t.emptyStationsDesc}
                            </p>
                            <button
                                type="button"
                                onClick={() =>
                                    void api.openWindowTab('discover')
                                }
                                className="mt-1 bg-accent text-white hover:opacity-90 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition cursor-pointer shadow-sm"
                            >
                                {t.trayDiscover}
                            </button>
                        </div>
                    ) : filteredStations.length === 0 ? (
                        <div className="py-8 text-center text-xs text-secondary flex flex-col items-center justify-center gap-1.5">
                            <IconSearch size={18} className="opacity-40" />
                            <span>{t.emptyStationsText}</span>
                        </div>
                    ) : (
                        filteredStations.map((st) => {
                            const active =
                                currentStation?.id === st.id &&
                                (isPlaying || isBusy);
                            return (
                                <div
                                    key={st.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => void api.playStation(st.id)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            void api.playStation(st.id);
                                        }
                                    }}
                                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[7px] cursor-pointer text-xs transition ${
                                        active
                                            ? 'mac-row-selected font-semibold'
                                            : 'mac-row'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {active ? (
                                            <IconPlay
                                                size={10}
                                                className="text-[#30D158] shrink-0 animate-pulse"
                                            />
                                        ) : (
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                    st.status === 'online'
                                                        ? 'bg-[#30D158]/70'
                                                        : 'bg-[#FF453A]/70'
                                                }`}
                                            />
                                        )}
                                        <span className="font-medium truncate">
                                            {st.name}
                                        </span>
                                        <span className="text-[11px] text-muted truncate">
                                            {st.city}
                                        </span>
                                    </div>

                                    <div className="flex items-center shrink-0 ml-2">
                                        <button
                                            type="button"
                                            aria-label={st.name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void api
                                                    .toggleFavorite(st.id)
                                                    .then(loadData);
                                            }}
                                            className={`p-0.5 rounded-[5px] cursor-pointer transition ${
                                                st.isFavorite
                                                    ? 'text-[#FF9F0A]'
                                                    : 'text-muted opacity-55 group-hover:opacity-100'
                                            }`}
                                        >
                                            <IconStar
                                                size={13}
                                                filled={st.isFavorite}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 4. BOTTOM ACTION DOCK & STATS BAR */}
            <div className="mac-settings-card mt-2.5 p-2.5 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-secondary pb-2 border-b mac-divider">
                    <button
                        type="button"
                        onClick={() => void api.openWindowTab('stations')}
                        className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                    >
                        <IconPlus size={13} />
                        <span>{t.trayAddStation}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => void api.openWindowTab('discover')}
                        className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                    >
                        <IconCompass size={13} />
                        <span>{t.trayDiscover}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => void api.openWindowTab('preferences')}
                        className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                    >
                        <IconSliders size={13} />
                        <span>{t.traySettings}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAboutOpen(true)}
                        className="flex items-center gap-1 hover:text-foreground transition font-medium cursor-pointer"
                        title={t.tabAbout}
                    >
                        <IconInfo size={13} />
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
                        className="flex items-center gap-1 text-[#FF453A] hover:opacity-80 transition font-medium cursor-pointer"
                    >
                        <IconPower size={13} />
                        <span>{t.trayQuit}</span>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center tabular-nums text-secondary">
                    <div>
                        <div className="text-[13px] font-bold text-foreground">
                            {stations.length}
                        </div>
                        <div className="text-[10px] text-secondary truncate">
                            {t.trayStatStations}
                        </div>
                    </div>
                    <div>
                        <div className="text-[13px] font-bold text-foreground">
                            {favCount}
                        </div>
                        <div className="text-[10px] text-secondary truncate">
                            {t.trayStatFavorites}
                        </div>
                    </div>
                    <div>
                        <div className="text-[13px] font-bold text-foreground">
                            {groups.length}
                        </div>
                        <div className="text-[10px] text-secondary truncate">
                            {t.trayStatCategories}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. DIRECT TRAY POPUP MODALS (About & Quit Confirmation) */}
            <AboutModal
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
                appIconDataUrl={appIconDataUrl}
                version="v0.1.3"
                tagline={t.aboutTagline}
                description={t.aboutDescription}
                websiteBtnText={t.aboutWebsiteBtn}
                specLinkText={t.aboutSpecLink}
                changelogLinkText={t.aboutChangelogLink}
                onOpenExternalUrl={(url) => {
                    if (api.openExternalUrl) {
                        void api.openExternalUrl(url);
                    } else {
                        window.open(url, '_blank');
                    }
                }}
            />

            <QuitConfirmModal
                isOpen={isQuitConfirmOpen}
                onClose={() => setIsQuitConfirmOpen(false)}
                onConfirm={() => void api.quitApp()}
                appIconDataUrl={appIconDataUrl}
                language={settings?.language || 'id'}
                cancelBtnText={t.cancelBtn}
            />
        </div>
    );
};
