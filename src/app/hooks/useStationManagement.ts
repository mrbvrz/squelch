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
        try {
            await api.runHealthCheck();
            await refreshAll();
        } finally {
            setIsCheckingHealth(false);
        }
    }, [api, refreshAll]);

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
        favCount,
        filteredStations,
        handleAddGroup,
        handleDropStation,
        handleRunHealthCheck,
        isPlayingStation
    };
}
