import { useState, useEffect, useRef, useMemo } from 'react';
import type {
    AppSettings,
    PlayerState,
    Station
} from '../../types';
import type { SquelchTrayPopoverApi } from '../types';
import { getTranslations } from '../../i18n';
import {
    applyAppearanceVariables,
    bindActiveScrollbars
} from '../../utils/appearance';

export function useTrayPopoverState(api: SquelchTrayPopoverApi) {
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
                void api.toggleMute?.();
                return;
            }
        };

        window.addEventListener('keydown', handlePopoverKeyDown);
        return () =>
            window.removeEventListener('keydown', handlePopoverKeyDown);
    }, [searchText, isAboutOpen, isQuitConfirmOpen, api]);

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
        const unsub = api.onStateChanged((evt: unknown) => {
            const data = evt as {
                state?: PlayerState;
                currentStation?: Station | null;
                streamTitle?: string | null;
                reconnectAttempt?: number | null;
                sleepTimerMinutes?: number | null;
                sleepTimerRemainingSec?: number | null;
                volume?: number;
                isMuted?: boolean;
            };

            if (data?.state !== undefined) {
                setPlayerState(data.state);
                if (data.currentStation !== undefined) {
                    setCurrentStation(data.currentStation);
                }
                if (data.streamTitle !== undefined) {
                    setStreamTitle(data.streamTitle);
                }
                if (data.reconnectAttempt !== undefined) {
                    setReconnectAttempt(data.reconnectAttempt ?? null);
                }
                if (data.sleepTimerMinutes !== undefined) {
                    setSleepMinutes(data.sleepTimerMinutes ?? null);
                }
                if (data.sleepTimerRemainingSec !== undefined) {
                    setSleepRemainingSec(data.sleepTimerRemainingSec ?? null);
                }
                if (!isInteractingVolume.current) {
                    if (typeof data.volume === 'number') {
                        const raw = data.volume;
                        const normalized = raw > 1 ? raw / 100 : raw;
                        setVolume(Math.max(0, Math.min(1, normalized)));
                    }
                    if (typeof data.isMuted === 'boolean') {
                        setIsMuted(data.isMuted);
                    }
                }
                return;
            }

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
    }, [playerState, reconnectAttempt, t]);

    return {
        playerState,
        currentStation,
        streamTitle,
        sleepMinutes,
        sleepRemainingSec,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        isInteractingVolume,
        isAboutOpen,
        setIsAboutOpen,
        isQuitConfirmOpen,
        setIsQuitConfirmOpen,
        appIconDataUrl,
        stations,
        groups,
        settings,
        activeFilter,
        setActiveFilter,
        searchText,
        setSearchText,
        searchInputRef,
        loadData,
        isPlaying,
        isBusy,
        filteredStations,
        spectrumBars,
        favCount,
        stateHeadline,
        t
    };
}
