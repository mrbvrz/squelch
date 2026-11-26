import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getTranslations } from '../../src/i18n';
import { getPlayerStateHeadline } from '../../src/utils/player-state';
import { TraySleepBanner } from '../../src/tray/components/TraySleepBanner';
import { TrayActionDock } from '../../src/tray/components/TrayActionDock';
import { TrayPlayerDeck } from '../../src/tray/components/TrayPlayerDeck';
import type { Station } from '../../src/types';

function collectElements(
    node: React.ReactNode,
    predicate: (el: React.ReactElement<any>) => boolean,
    acc: React.ReactElement<any>[] = []
): React.ReactElement<any>[] {
    if (
        !node ||
        typeof node === 'boolean' ||
        typeof node === 'string' ||
        typeof node === 'number'
    ) {
        return acc;
    }
    if (Array.isArray(node)) {
        for (const child of node) collectElements(child, predicate, acc);
        return acc;
    }
    if (React.isValidElement(node)) {
        const el = node as React.ReactElement<any>;
        if (predicate(el)) acc.push(el);
        if (el.props?.children) {
            collectElements(el.props.children, predicate, acc);
        }
    }
    return acc;
}

const sampleStation: Station = {
    id: 'st-delta',
    name: 'Delta FM',
    streamUrl: 'https://stream.example.com/delta.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Hits',
    city: 'Jakarta',
    country: 'ID',
    tags: [],
    group: 'Pop',
    isFavorite: true,
    status: 'online',
    lastVerifiedAt: null
};

describe('React Tray Popover Components', () => {
    const t = getTranslations('en');

    it('renders TraySleepBanner for active countdown <= 60s and triggers onCancel', () => {
        const onCancel = vi.fn();
        expect(
            renderToStaticMarkup(
                React.createElement(TraySleepBanner, {
                    sleepRemainingSec: 90,
                    onCancel,
                    t
                })
            )
        ).toBe('');

        const props = { sleepRemainingSec: 30, onCancel, t };
        const html = renderToStaticMarkup(
            React.createElement(TraySleepBanner, props)
        );
        expect(html).toContain('role="alert"');
        expect(html).toContain('30s');

        const tree = TraySleepBanner(props);
        const btn = collectElements(tree, (el) => el.type === 'button')[0];
        btn?.props.onClick();
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('renders TrayActionDock counters and dispatches all 4 navigation/quit actions', () => {
        const onOpenStationsTab = vi.fn();
        const onOpenPreferencesTab = vi.fn();
        const onOpenAbout = vi.fn();
        const onTriggerQuit = vi.fn();
        const props = {
            stationCount: 12,
            favCount: 4,
            groupCount: 3,
            onOpenStationsTab,
            onOpenPreferencesTab,
            onOpenAbout,
            onTriggerQuit,
            t
        };

        const html = renderToStaticMarkup(
            React.createElement(TrayActionDock, props)
        );
        expect(html).toContain('>12<');
        expect(html).toContain('>4<');
        expect(html).toContain('>3<');
        expect(html).toContain(t.trayAddStation);
        expect(html).toContain(t.trayQuit);

        const tree = TrayActionDock(props);
        const buttons = collectElements(tree, (el) => el.type === 'button');
        expect(buttons).toHaveLength(4);
        buttons[0]?.props.onClick();
        buttons[1]?.props.onClick();
        buttons[2]?.props.onClick();
        buttons[3]?.props.onClick();
        expect(onOpenStationsTab).toHaveBeenCalledTimes(1);
        expect(onOpenPreferencesTab).toHaveBeenCalledTimes(1);
        expect(onOpenAbout).toHaveBeenCalledTimes(1);
        expect(onTriggerQuit).toHaveBeenCalledTimes(1);
    });

    it('renders TrayPlayerDeck station, EQ badge, volume and playback controls', () => {
        const onTogglePlayPause = vi.fn();
        const onStopPlayback = vi.fn();
        const onToggleMute = vi.fn();
        const onVolumeChange = vi.fn();
        const onSetSleepTimer = vi.fn();
        const isInteractingVolumeRef = { current: false };

        const props = {
            currentStation: sampleStation,
            streamTitle: 'Evening Jazz',
            playerState: 'playing' as const,
            stateHeadline: getPlayerStateHeadline('playing', null, t),
            isPlaying: true,
            isBusy: false,
            spectrumBars: [20, 40, 60, 80, 50, 30, 70, 90],
            sleepMinutes: 15,
            volume: 0.75,
            isMuted: false,
            hasEqualizer: true,
            isInteractingVolumeRef,
            onResolveStationLogo: async (url: string) => url,
            onStopPlayback,
            onTogglePlayPause,
            onSetSleepTimer,
            onToggleMute,
            onVolumeChange,
            t
        };

        const html = renderToStaticMarkup(
            React.createElement(TrayPlayerDeck, props)
        );
        expect(html).toContain('Delta FM');
        expect(html).toContain('Evening Jazz');
        expect(html).toContain('EQ');
        expect(html).toContain('75%');
        expect(html).toContain('15m');

        const tree = TrayPlayerDeck(props);
        const buttons = collectElements(tree, (el) => el.type === 'button');
        const stopBtn = buttons.find((b) => b.props['aria-label'] === t.stop);
        const pauseBtn = buttons.find(
            (b) => b.props['aria-label'] === t.statusPausedSub
        );
        stopBtn?.props.onClick();
        pauseBtn?.props.onClick();
        expect(onStopPlayback).toHaveBeenCalledTimes(1);
        expect(onTogglePlayPause).toHaveBeenCalledTimes(1);
    });
});
