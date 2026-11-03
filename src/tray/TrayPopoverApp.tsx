import React from 'react';
import type { SquelchTrayPopoverApi } from './types';
import { useTrayPopoverState } from './hooks/useTrayPopoverState';
import {
    TraySleepBanner,
    TrayPlayerDeck,
    TrayStationDirectory,
    TrayActionDock
} from './components';
import { AboutModal } from '../app/modals/AboutModal';
import { QuitConfirmModal } from '../app/modals/QuitConfirmModal';

export const TrayPopoverApp: React.FC = () => {
    const api = window.squelchApi as SquelchTrayPopoverApi;

    const {
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
    } = useTrayPopoverState(api);

    return (
        <div className="mac-popover-shell animate-tab-enter w-full h-full p-3 flex flex-col justify-between overflow-hidden select-none">
            {/* 1. Live 1-Minute Sleep Countdown Notification Banner */}
            <TraySleepBanner
                sleepRemainingSec={sleepRemainingSec}
                onCancel={() => void api.setSleepTimer(null)}
                t={t}
            />

            {/* 2. Unified Tray Player Deck */}
            <TrayPlayerDeck
                currentStation={currentStation}
                streamTitle={streamTitle}
                playerState={playerState}
                stateHeadline={stateHeadline}
                isPlaying={isPlaying}
                isBusy={isBusy}
                spectrumBars={spectrumBars}
                sleepMinutes={sleepMinutes}
                volume={volume}
                isMuted={isMuted}
                hasEqualizer={Boolean(settings?.equalizer?.enabled)}
                isInteractingVolumeRef={isInteractingVolume}
                onResolveStationLogo={(url) => api.resolveStationLogo(url).then((res) => res ?? '')}
                onStopPlayback={() => void api.stopPlayback()}
                onTogglePlayPause={() => void api.togglePlayPause()}
                onSetSleepTimer={(minutes) => void api.setSleepTimer(minutes)}
                onToggleMute={async () => {
                    if (api.toggleMute) {
                        const muted = await api.toggleMute();
                        setIsMuted(muted);
                    }
                }}
                onVolumeChange={(newVol) => {
                    setVolume(newVol);
                    if (isMuted && newVol > 0) {
                        setIsMuted(false);
                    }
                    if (api.setVolume) {
                        void api.setVolume(newVol);
                    }
                }}
                t={t}
            />

            {/* 3. Station Directory Card */}
            <TrayStationDirectory
                stations={stations}
                groups={groups}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                searchText={searchText}
                setSearchText={setSearchText}
                searchInputRef={searchInputRef}
                currentStation={currentStation}
                isPlaying={isPlaying}
                isBusy={isBusy}
                favCount={favCount}
                filteredStations={filteredStations}
                onPlayStation={(id) => void api.playStation(id)}
                onToggleFavorite={(id) => {
                    void api.toggleFavorite(id).then(loadData);
                }}
                t={t}
            />

            {/* 4. Bottom Action Dock & Stats Bar */}
            <TrayActionDock
                stationCount={stations.length}
                favCount={favCount}
                groupCount={groups.length}
                onOpenStationsTab={() => void api.openWindowTab('stations')}
                onOpenDiscoverTab={() => void api.openWindowTab('discover')}
                onOpenPreferencesTab={() => void api.openWindowTab('preferences')}
                onOpenAbout={() => setIsAboutOpen(true)}
                onTriggerQuit={() => {
                    if (settings?.confirmBeforeQuit ?? true) {
                        setIsQuitConfirmOpen(true);
                    } else {
                        void api.quitApp();
                    }
                }}
                t={t}
            />

            {/* 5. Direct Tray Popup Modals (About & Quit Confirmation) */}
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
                onOpenExternalUrl={(url: string) => {
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
