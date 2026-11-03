import React, { useState, useMemo, useCallback } from 'react';
import type { Station } from '../../types';
import type { SquelchWindowApi } from '../types';

export interface UseStationManagementOptions {
    stations: Station[];
    groups: string[];
    currentStation: Station | null;
    isPlaying: boolean;
    isBusy: boolean;
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
}

export function useStationManagement({
    stations,
    groups,
    currentStation,
    isPlaying,
    isBusy,
    api,
    refreshAll
}: UseStationManagementOptions) {
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
    const [hideOffline, setHideOffline] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
    const [draggedStationId, setDraggedStationId] = useState<string | null>(
        null
    );
    const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
    const [healthProgress, setHealthProgress] = useState<{
        active: boolean;
        total: number;
        completed: number;
        currentStation?: string;
        onlineCount: number;
        offlineCount: number;
        status: 'idle' | 'checking' | 'completed';
    }>({
        active: false,
        total: 0,
        completed: 0,
        onlineCount: 0,
        offlineCount: 0,
        status: 'idle'
    });

    const favCount = useMemo(
        () => stations.filter((s) => s.isFavorite).length,
        [stations]
    );

    const filteredStations = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return stations.filter((s) => {
            if (selectedGroup !== 'ALL' && s.group !== selectedGroup) {
                return false;
            }
            if (favoritesOnly && !s.isFavorite) return false;
            if (hideOffline && s.status === 'offline') return false;
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q) ||
                s.genre.toLowerCase().includes(q) ||
                s.city.toLowerCase().includes(q) ||
                s.tags.some((tag) => tag.toLowerCase().includes(q))
            );
        });
    }, [stations, selectedGroup, favoritesOnly, hideOffline, searchQuery]);

    const handleAddGroup = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const trimmed = newGroupName.trim();
            if (!trimmed || groups.includes(trimmed)) return;
            const updated = [...groups, trimmed];
            await api.saveGroups(updated);
            setNewGroupName('');
            setIsAddingGroup(false);
            await refreshAll();
        },
        [api, groups, newGroupName, refreshAll]
    );

    const handleDropStation = useCallback(
        async (targetId: string) => {
            if (!draggedStationId || draggedStationId === targetId) return;
            const ids = stations.map((s) => s.id);
            const fromIdx = ids.indexOf(draggedStationId);
            const toIdx = ids.indexOf(targetId);
            if (fromIdx === -1 || toIdx === -1) return;

            ids.splice(fromIdx, 1);
            ids.splice(toIdx, 0, draggedStationId);
            setDraggedStationId(null);
            await api.reorderStations(ids);
            await refreshAll();
        },
        [api, draggedStationId, stations, refreshAll]
    );

    const handleRunHealthCheck = useCallback(async () => {
        setIsCheckingHealth(true);
        setHealthProgress({
            active: true,
            total: stations.length,
            completed: 0,
            onlineCount: 0,
            offlineCount: 0,
            status: 'checking'
        });
        try {
            await api.runHealthCheck((prog) => {
                setHealthProgress({
                    active: true,
                    total: prog.total,
                    completed: prog.completed,
                    currentStation: prog.currentStation,
                    onlineCount: prog.onlineCount,
                    offlineCount: prog.offlineCount,
                    status:
                        prog.completed >= prog.total && prog.total > 0
                            ? 'completed'
                            : 'checking'
                });
            });
            await refreshAll();
            setHealthProgress((prev) => ({
                ...prev,
                active: true,
                status: 'completed'
            }));
            setTimeout(() => {
                setHealthProgress((prev) => {
                    if (prev.status === 'completed') {
                        return { ...prev, active: false, status: 'idle' };
                    }
                    return prev;
                });
            }, 3500);
        } catch (err) {
            console.error('Health check failed:', err);
            setHealthProgress((prev) => ({
                ...prev,
                active: false,
                status: 'idle'
            }));
        } finally {
            setIsCheckingHealth(false);
        }
    }, [api, stations.length, refreshAll]);

    const dismissHealthToast = useCallback(() => {
        setHealthProgress((prev) => ({
            ...prev,
            active: false,
            status: 'idle'
        }));
    }, []);

    const isPlayingStation = useCallback(
        (stationId?: string) => {
            if (!stationId || !currentStation) return false;
            return (
                (currentStation.id === stationId ||
                    (Boolean(currentStation.streamUrl) &&
                        stations.find((s) => s.id === stationId)?.streamUrl ===
                            currentStation.streamUrl)) &&
                (isPlaying || isBusy)
            );
        },
        [currentStation, isPlaying, isBusy, stations]
    );

    return {
        selectedGroup,
        setSelectedGroup,
        searchQuery,
        setSearchQuery,
        favoritesOnly,
        setFavoritesOnly,
        hideOffline,
        setHideOffline,
        newGroupName,
        setNewGroupName,
        isAddingGroup,
        setIsAddingGroup,
        draggedStationId,
        setDraggedStationId,
        isCheckingHealth,
        healthProgress,
        dismissHealthToast,
        favCount,
        filteredStations,
        handleAddGroup,
        handleDropStation,
        handleRunHealthCheck,
        isPlayingStation
    };
}
