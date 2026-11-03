import { useEffect } from 'react';
import type { AppSettings, Station } from '../../types';
import type { ActiveTab, SquelchWindowApi } from '../types';

export interface UseAppShortcutsOptions {
    recordingShortcutKey: keyof AppSettings['shortcuts'] | null;
    currentStation: Station | null;
    searchInputRef: React.RefObject<HTMLInputElement>;
    navigateToTab: (tab: ActiveTab) => void;
    onCloseAllModals: () => void;
    api: SquelchWindowApi;
}

export function useAppShortcuts({
    recordingShortcutKey,
    currentStation,
    searchInputRef,
    navigateToTab,
    onCloseAllModals,
    api
}: UseAppShortcutsOptions) {
    useEffect(() => {
        const handleInAppKeyDown = (e: KeyboardEvent) => {
            // When actively recording a shortcut in Preferences, do not intercept
            if (recordingShortcutKey) return;

            const target = e.target as HTMLElement | null;
            const isEditingText =
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable);

            // Escape closes open modals or clears active search
            if (e.key === 'Escape') {
                if (isEditingText) {
                    target.blur();
                    return;
                }
                onCloseAllModals();
                return;
            }

            // ⌘F or Ctrl+F (or '/' when not editing text): Focus search
            if (
                ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') ||
                (!isEditingText && e.key === '/' && !e.metaKey && !e.ctrlKey)
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                return;
            }

            // ⌘, or Ctrl+, : Open Preferences
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                navigateToTab('preferences');
                return;
            }

            // ⌘1 to ⌘6: Quick switch tabs
            if (e.metaKey || e.ctrlKey) {
                const tabNum = parseInt(e.key, 10);
                const tabs: ActiveTab[] = [
                    'stations',
                    'schedules',
                    'discover',
                    'stats',
                    'preferences',
                    'about'
                ];
                if (!isNaN(tabNum) && tabNum >= 1 && tabNum <= tabs.length) {
                    e.preventDefault();
                    navigateToTab(tabs[tabNum - 1]);
                    return;
                }
            }

            // ⌘R or F5: Reconnect stream
            if (
                ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') ||
                e.key === 'F5'
            ) {
                if (currentStation) {
                    e.preventDefault();
                    void api.playStation(currentStation.id);
                    return;
                }
            }

            // The following controls are only active when NOT editing text
            if (isEditingText) return;

            // Space: Toggle Play/Pause
            if (e.code === 'Space') {
                e.preventDefault();
                void api.togglePlayPause();
                return;
            }

            // ArrowRight / ArrowLeft: Next / Prev station
            if (e.key === 'ArrowRight' || e.key === 'l') {
                e.preventDefault();
                void api.nextStation();
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'h') {
                e.preventDefault();
                void api.prevStation();
                return;
            }

            // ArrowUp / ArrowDown: Volume adjustments
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                void api.changeVolume(0.05);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                void api.changeVolume(-0.05);
                return;
            }

            // 'm' or 'M': Toggle Mute
            if (e.key.toLowerCase() === 'm') {
                e.preventDefault();
                void api.toggleMute();
                return;
            }
        };

        window.addEventListener('keydown', handleInAppKeyDown);
        return () => window.removeEventListener('keydown', handleInAppKeyDown);
    }, [
        recordingShortcutKey,
        currentStation,
        searchInputRef,
        navigateToTab,
        onCloseAllModals,
        api
    ]);
}
