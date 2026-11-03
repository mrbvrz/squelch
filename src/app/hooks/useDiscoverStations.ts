import React, { useState, useEffect, useCallback } from 'react';
import type { DiscoverStationItem, RadioBrowserCountry } from '../../types';
import { FALLBACK_COUNTRIES } from '../../utils/appearance';
import type { SquelchWindowApi } from '../types';

export interface UseDiscoverStationsOptions {
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
    activeTab?: string;
}

export function useDiscoverStations({
    api,
    refreshAll,
    activeTab
}: UseDiscoverStationsOptions) {
    const [discCountries, setDiscCountries] =
        useState<RadioBrowserCountry[]>(FALLBACK_COUNTRIES);
    const [discCountry, setDiscCountry] = useState<string>('ID');
    const [discName, setDiscName] = useState<string>('');
    const [discTag, setDiscTag] = useState<string>('');
    const [discResults, setDiscResults] = useState<DiscoverStationItem[]>([]);
    const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
    const [discError, setDiscError] = useState<string | null>(null);

    // Load available online countries on mount
    useEffect(() => {
        let isMounted = true;
        api.getOnlineCountries()
            .then((list) => {
                if (isMounted && Array.isArray(list) && list.length > 0) {
                    setDiscCountries(list);
                }
            })
            .catch(() => {
                // Keep FALLBACK_COUNTRIES
            });
        return () => {
            isMounted = false;
        };
    }, [api]);

    const handleDiscoverSearch = useCallback(
        async (e?: React.FormEvent, overrideCountry?: string) => {
            if (e) e.preventDefault();
            setIsSearchingOnline(true);
            setDiscError(null);
            const countryToUse =
                overrideCountry !== undefined ? overrideCountry : discCountry;
            try {
                const results = await api.searchOnlineStations({
                    countrycode: countryToUse,
                    name: discName,
                    tag: discTag,
                    limit: 60
                });
                const seen = new Set<string>();
                const deduplicated = results.filter((st) => {
                    const url = (st.streamUrl || '').trim().toLowerCase();
                    const key = url || st.id;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setDiscResults(deduplicated);
            } catch (err) {
                setDiscError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load station directory'
                );
            } finally {
                setIsSearchingOnline(false);
            }
        },
        [api, discCountry, discName, discTag]
    );

    const handleCountryChange = useCallback(
        (countryCode: string) => {
            setDiscCountry(countryCode);
            void handleDiscoverSearch(undefined, countryCode);
        },
        [handleDiscoverSearch]
    );

    const handleAddFromDiscover = useCallback(
        async (item: DiscoverStationItem, playImmediately = false) => {
            const saved = await api.saveStation({
                name: item.name,
                streamUrl: item.streamUrl,
                streamType: item.streamType,
                logoUrl: item.logoUrl,
                genre: item.genre,
                city: item.city,
                country: item.country,
                tags: item.tags,
                group: 'Pop & Anak Muda',
                isFavorite: false,
                status: 'online'
            });
            await refreshAll();
            if (playImmediately) {
                await api.playStation(saved.id);
            }
        },
        [api, refreshAll]
    );

    // Initial load when user switches to discover tab
    useEffect(() => {
        if (activeTab === 'discover' && discResults.length === 0) {
            void handleDiscoverSearch();
        }
    }, [activeTab, discResults.length, handleDiscoverSearch]);

    return {
        discCountries,
        setDiscCountries,
        discCountry,
        setDiscCountry,
        discName,
        setDiscName,
        discTag,
        setDiscTag,
        discResults,
        setDiscResults,
        isSearchingOnline,
        discError,
        handleDiscoverSearch,
        handleCountryChange,
        handleAddFromDiscover
    };
}
