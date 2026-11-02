import { useState } from 'react';
import type { ActiveTab } from '../types';

export function useTabNavigation() {
    const initialHash = (
        typeof window !== 'undefined'
            ? window.location.hash.replace('#', '')
            : 'stations'
    ) as ActiveTab;

    const validInitialTab: ActiveTab = [
        'stations',
        'schedules',
        'discover',
        'stats',
        'preferences',
        'about'
    ].includes(initialHash)
        ? initialHash
        : 'stations';

    const [activeTab, setActiveTab] = useState<ActiveTab>(validInitialTab);
    const [tabHistory, setTabHistory] = useState<ActiveTab[]>([validInitialTab]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    const navigateToTab = (nextTab: ActiveTab) => {
        if (nextTab === activeTab) return;
        const sliced = tabHistory.slice(0, historyIndex + 1);
        sliced.push(nextTab);
        setTabHistory(sliced);
        setHistoryIndex(sliced.length - 1);
        setActiveTab(nextTab);
    };

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < tabHistory.length - 1;

    const goBack = () => {
        if (!canGoBack) return;
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setActiveTab(tabHistory[prevIdx]);
    };

    const goForward = () => {
        if (!canGoForward) return;
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setActiveTab(tabHistory[nextIdx]);
    };

    const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '') as ActiveTab;
        if (
            [
                'stations',
                'schedules',
                'discover',
                'stats',
                'preferences',
                'about'
            ].includes(hash)
        ) {
            setActiveTab(hash);
        }
    };

    return {
        activeTab,
        setActiveTab,
        tabHistory,
        historyIndex,
        navigateToTab,
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        handleHashChange
    };
}
