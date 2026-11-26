import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getTranslations } from '../../src/i18n';
import { getPlayerStateHeadline } from '../../src/utils/player-state';
import { MiniPlayer } from '../../src/app/components/MiniPlayer';
import { SleepCountdownBanner } from '../../src/app/components/SleepCountdownBanner';
import { HeaderBar } from '../../src/app/components/HeaderBar';
import { DangerZoneSection } from '../../src/app/tabs/preferences/DangerZoneSection';
import { ResetConfirmModal } from '../../src/app/modals/ResetConfirmModal';
import { QuitConfirmModal } from '../../src/app/modals/QuitConfirmModal';
import type { SquelchWindowApi } from '../../src/app/types';
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
    id: 'st-1',
    name: 'Prambors FM',
    streamUrl: 'https://stream.example.com/prambors.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Pop',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop'],
    group: 'Umum',
    isFavorite: true,
    status: 'online',
    lastVerifiedAt: null
};

function createMockApi(): SquelchWindowApi {
    return {
        togglePlayPause: vi.fn(async () => true),
        stopPlayback: vi.fn(async () => true),
        setSleepTimer: vi.fn(async () => true),
        resolveStationLogo: vi.fn(async (url: string) => url)
    } as unknown as SquelchWindowApi;
}

describe('React UI Components & State Headline', () => {
    const tEn = getTranslations('en');
    const tId = getTranslations('id');

    it('maps all PlayerState values consistently via getPlayerStateHeadline', () => {
        expect(getPlayerStateHeadline('idle', null, tEn)).toEqual({
            main: 'IDLE',
            sub: tEn.statusStandbySub,
            color: '#8E8E93'
        });
        expect(getPlayerStateHeadline('playing', null, tId)).toEqual({
            main: 'LIVE',
            sub: tId.statusLiveSub,
            color: '#30D158'
        });
        expect(getPlayerStateHeadline('reconnecting', 3, tEn)).toEqual({
            main: 'RETRY',
            sub: `${tEn.statusReconnectingSub} (3)`,
            color: '#FF9F0A'
        });
        expect(getPlayerStateHeadline('error', null, tEn).main).toBe('ERR');
        expect(getPlayerStateHeadline('paused', null, tEn).main).toBe('HOLD');
        expect(getPlayerStateHeadline('buffering', null, tEn).main).toBe(
            'WAIT'
        );
        expect(getPlayerStateHeadline('connecting', null, tEn).main).toBe(
            'SYNC'
        );
    });

    it('renders MiniPlayer states and wires play/pause and stop callbacks', () => {
        const api = createMockApi();
        const idleHtml = renderToStaticMarkup(
            React.createElement(MiniPlayer, {
                currentStation: null,
                playerState: 'idle',
                stateHeadline: getPlayerStateHeadline('idle', null, tEn),
                streamTitle: null,
                isPlaying: false,
                isBusy: false,
                eqActive: false,
                api,
                t: tEn
            })
        );
        expect(idleHtml).toContain('Squelch');
        expect(idleHtml).toContain('IDLE · Standby');
        expect(idleHtml).not.toContain(`aria-label="${tEn.stop}"`);

        const playingProps = {
            currentStation: sampleStation,
            playerState: 'playing' as const,
            stateHeadline: getPlayerStateHeadline('playing', null, tEn),
            streamTitle: 'Artist - Live Track',
            isPlaying: true,
            isBusy: false,
            eqActive: true,
            api,
            t: tEn
        };
        const playingHtml = renderToStaticMarkup(
            React.createElement(MiniPlayer, playingProps)
        );
        expect(playingHtml).toContain('Prambors FM');
        expect(playingHtml).toContain('EQ');
        expect(playingHtml).toContain('Artist - Live Track');
        expect(playingHtml).toContain(`aria-label="${tEn.stop}"`);

        const tree = MiniPlayer(playingProps);
        const buttons = collectElements(tree, (el) => el.type === 'button');
        const stopBtn = buttons.find((b) => b.props['aria-label'] === tEn.stop);
        const pauseBtn = buttons.find(
            (b) => b.props['aria-label'] === tEn.statusPausedSub
        );
        stopBtn?.props.onClick();
        pauseBtn?.props.onClick();
        expect(api.stopPlayback).toHaveBeenCalledTimes(1);
        expect(api.togglePlayPause).toHaveBeenCalledTimes(1);
    });

    it('renders SleepCountdownBanner only within final 60 seconds and cancels timer on click', () => {
        const api = createMockApi();
        expect(
            renderToStaticMarkup(
                React.createElement(SleepCountdownBanner, {
                    sleepRemainingSec: null,
                    api,
                    t: tEn
                })
            )
        ).toBe('');
        expect(
            renderToStaticMarkup(
                React.createElement(SleepCountdownBanner, {
                    sleepRemainingSec: 120,
                    api,
                    t: tEn
                })
            )
        ).toBe('');

        const activeProps = { sleepRemainingSec: 45, api, t: tEn };
        const html = renderToStaticMarkup(
            React.createElement(SleepCountdownBanner, activeProps)
        );
        expect(html).toContain('role="alert"');
        expect(html).toContain('45s');
        expect(html).toContain(tEn.sleepCancelBtn);

        const tree = SleepCountdownBanner(activeProps);
        const cancelBtn = collectElements(
            tree,
            (el) => el.type === 'button'
        )[0];
        cancelBtn?.props.onClick();
        expect(api.setSleepTimer).toHaveBeenCalledWith(null);
    });

    it('renders HeaderBar navigation state and update badge action', () => {
        const goBack = vi.fn();
        const goForward = vi.fn();
        const setIsUpdateModalOpen = vi.fn();
        const props = {
            canGoBack: true,
            canGoForward: false,
            goBack,
            goForward,
            currentHeadingTitle: 'All Stations',
            updateInfo: {
                hasUpdate: true,
                currentVersion: '0.1.3',
                latestVersion: '0.1.4',
                releaseName: 'v0.1.4',
                releaseNotes: '',
                publishedAt: '',
                releaseUrl: 'https://github.com/mrbvrz/squelch/releases',
                downloadUrl: 'https://github.com/mrbvrz/squelch/releases',
                assets: []
            },
            setIsUpdateModalOpen
        };

        const html = renderToStaticMarkup(
            React.createElement(HeaderBar, props)
        );
        expect(html).toContain('All Stations');
        expect(html).toContain('Update v0.1.4');

        const tree = HeaderBar(props);
        const buttons = collectElements(tree, (el) => el.type === 'button');
        const backBtn = buttons.find((b) => b.props['aria-label'] === 'Back');
        const fwdBtn = buttons.find((b) => b.props['aria-label'] === 'Forward');
        const updateBtn = buttons[2];
        expect(backBtn?.props.disabled).toBe(false);
        expect(fwdBtn?.props.disabled).toBe(true);
        backBtn?.props.onClick();
        updateBtn?.props.onClick();
        expect(goBack).toHaveBeenCalledTimes(1);
        expect(setIsUpdateModalOpen).toHaveBeenCalledWith(true);
    });

    it('renders DangerZoneSection descriptions and triggers targeted reset actions', () => {
        const onRequestReset = vi.fn();
        const setSelectedClearTarget = vi.fn();
        const setIsResetConfirmOpen = vi.fn();
        const props = {
            selectedClearTarget: 'schedules' as const,
            setSelectedClearTarget,
            onRequestReset,
            setIsResetConfirmOpen,
            t: tEn
        };

        const html = renderToStaticMarkup(
            React.createElement(DangerZoneSection, props)
        );
        expect(html).toContain(tEn.prefClearSchedulesDesc);

        const tree = DangerZoneSection(props);
        const buttons = collectElements(tree, (el) => el.type === 'button');
        buttons[0]?.props.onClick();
        buttons[1]?.props.onClick();
        expect(onRequestReset).toHaveBeenNthCalledWith(1, 'schedules');
        expect(onRequestReset).toHaveBeenNthCalledWith(2, 'settings');
    });

    it('renders ResetConfirmModal and QuitConfirmModal with pending guards and callbacks', () => {
        const onClose = vi.fn();
        const onConfirm = vi.fn();

        expect(
            renderToStaticMarkup(
                React.createElement(ResetConfirmModal, {
                    isOpen: false,
                    onClose,
                    onConfirm,
                    title: 'Reset?',
                    description: 'Erase data',
                    cancelBtnText: 'Cancel',
                    confirmBtnText: 'Reset'
                })
            )
        ).toBe('');

        const pendingProps = {
            isOpen: true,
            onClose,
            onConfirm,
            title: 'Reset?',
            description: 'Erase data',
            cancelBtnText: 'Cancel',
            confirmBtnText: 'Reset',
            isPending: true
        };
        const resetHtml = renderToStaticMarkup(
            React.createElement(ResetConfirmModal, pendingProps)
        );
        expect(resetHtml).toContain('role="dialog"');
        expect(resetHtml).toContain('animate-spin');

        const resetTree = ResetConfirmModal(pendingProps);
        const resetButtons = collectElements(
            resetTree,
            (el) => el.type === 'button'
        );
        expect(resetButtons[0]?.props.disabled).toBe(true);
        expect(resetButtons[1]?.props.disabled).toBe(true);

        const quitProps = {
            isOpen: true,
            isStandalone: true,
            onClose,
            onConfirm,
            appIconDataUrl: null,
            language: 'id' as const,
            cancelBtnText: 'Batal'
        };
        const quitHtml = renderToStaticMarkup(
            React.createElement(QuitConfirmModal, quitProps)
        );
        expect(quitHtml).toContain('Keluar dari Squelch?');
        const quitTree = QuitConfirmModal(quitProps);
        const quitButtons = collectElements(
            quitTree,
            (el) => el.type === 'button'
        );
        quitButtons[0]?.props.onClick();
        quitButtons[1]?.props.onClick();
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
