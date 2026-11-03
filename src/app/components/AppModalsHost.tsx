import React from 'react';
import type {
    AppSettings,
    ShowSchedule,
    Station,
    StreamTestResult
} from '../../types';
import type { SquelchWindowApi } from '../types';
import type { TranslationDictionary } from '../../i18n';
import type {
    UpdateCheckResult,
    UpdateDownloadProgress
} from '../../components/UpdateModal';
import { DAY_LABELS } from '../types';

import { StationModal } from '../modals/StationModal';
import { ScheduleModal } from '../modals/ScheduleModal';
import { ImportExportModal } from '../modals/ImportExportModal';
import { ResetConfirmModal } from '../modals/ResetConfirmModal';
import { QuitConfirmModal } from '../modals/QuitConfirmModal';
import { AboutModal } from '../modals/AboutModal';
import { OnboardingModal } from '../../components/OnboardingModal';
import { UpdateModal } from '../../components/UpdateModal';
import { UpdateFloatingBadge } from './UpdateFloatingBadge';

export interface AppModalsHostProps {
    api: SquelchWindowApi;
    t: TranslationDictionary;
    lang: 'id' | 'en';
    appIconDataUrl: string | null;
    settings: AppSettings | null;
    stations: Station[];
    groups: string[];
    refreshAll: () => Promise<void>;

    // Station Form Modal
    stationModalProps: {
        isOpen: boolean;
        onClose: () => void;
        onSave: (e: React.FormEvent) => void;
        editingStation: Station | null;
        formName: string;
        setFormName: (val: string) => void;
        formUrl: string;
        setFormUrl: (val: string) => void;
        formGroup: string;
        setFormGroup: (val: string) => void;
        formGenre: string;
        setFormGenre: (val: string) => void;
        formCity: string;
        setFormCity: (val: string) => void;
        formType: Station['streamType'];
        setFormType: (val: Station['streamType']) => void;
        formLogo: string;
        setFormLogo: (val: string) => void;
        formTags: string;
        setFormTags: (val: string) => void;
        onTestStream: () => void;
        isTestingStream: boolean;
        testResult: StreamTestResult | null;
    };

    // Import / Export Modal
    importExportModalProps: {
        isOpen: boolean;
        onClose: () => void;
        onExportLoad: (format: 'm3u' | 'pls' | 'json') => void;
        ieFormat: 'm3u' | 'pls' | 'json';
        ieDuplicateStrategy: 'skip' | 'overwrite' | 'duplicate';
        setIeDuplicateStrategy: (val: 'skip' | 'overwrite' | 'duplicate') => void;
        ieTextContent: string;
        setIeTextContent: (val: string) => void;
        ieStatusMessage: string | null;
        onCopyExport: () => void;
        onImportExecute: () => void;
    };

    // Reset Confirm Modal
    resetModalProps: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => Promise<void>;
        title: string;
        description: string;
        confirmBtnText: string;
    };

    // Quit Confirm Modal
    quitModalProps: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
    };

    // About Modal
    aboutModalProps: {
        isOpen: boolean;
        onClose: () => void;
    };

    // Schedule Modal
    scheduleModalProps: {
        isOpen: boolean;
        onClose: () => void;
        onSave: (e: React.FormEvent) => void;
        editingSchedule: ShowSchedule | null;
        schedStationId: string;
        setSchedStationId: (val: string) => void;
        schedShowName: string;
        setSchedShowName: (val: string) => void;
        schedHost: string;
        setSchedHost: (val: string) => void;
        schedDays: number[];
        setSchedDays: (val: number[] | ((prev: number[]) => number[])) => void;
        schedStartTime: string;
        setSchedStartTime: (val: string) => void;
        schedEndTime: string;
        setSchedEndTime: (val: string) => void;
        schedAutoPlay: boolean;
        setSchedAutoPlay: (val: boolean) => void;
        schedReminderMinutes: number;
        setSchedReminderMinutes: (val: number) => void;
        schedNotes: string;
        setSchedNotes: (val: string) => void;
    };

    // Onboarding Modal
    onboardingModalProps: {
        isOpen: boolean;
        onClose: () => void;
    };

    // Update Modal
    updateModalProps: {
        isOpen: boolean;
        onOpen: () => void;
        onClose: () => void;
        updateInfo: UpdateCheckResult | null;
        isCheckingUpdate: boolean;
        updateCheckError: string | null;
        updateDownloadProgress?: UpdateDownloadProgress | null;
        onCheckAgain: () => void;
        onStartDownload: (url: string, filename?: string) => Promise<void> | void;
        onCancelDownload: () => void;
        onInstallUpdate: (filePath: string) => Promise<void> | void;
        onRevealInFinder: (filePath: string) => Promise<void> | void;
    };
}

export const AppModalsHost: React.FC<AppModalsHostProps> = ({
    api,
    t,
    lang,
    appIconDataUrl,
    settings,
    stations,
    groups,
    stationModalProps,
    importExportModalProps,
    resetModalProps,
    quitModalProps,
    aboutModalProps,
    scheduleModalProps,
    onboardingModalProps,
    updateModalProps
}) => {
    return (
        <>
            <StationModal
                isOpen={stationModalProps.isOpen}
                onClose={stationModalProps.onClose}
                onSave={stationModalProps.onSave}
                editingStation={stationModalProps.editingStation}
                formName={stationModalProps.formName}
                setFormName={stationModalProps.setFormName}
                formUrl={stationModalProps.formUrl}
                setFormUrl={stationModalProps.setFormUrl}
                formGroup={stationModalProps.formGroup}
                setFormGroup={stationModalProps.setFormGroup}
                formGenre={stationModalProps.formGenre}
                setFormGenre={stationModalProps.setFormGenre}
                formCity={stationModalProps.formCity}
                setFormCity={stationModalProps.setFormCity}
                formType={stationModalProps.formType}
                setFormType={stationModalProps.setFormType}
                formLogo={stationModalProps.formLogo}
                setFormLogo={stationModalProps.setFormLogo}
                formTags={stationModalProps.formTags}
                setFormTags={stationModalProps.setFormTags}
                groups={groups}
                onTestStream={stationModalProps.onTestStream}
                isTestingStream={stationModalProps.isTestingStream}
                testResult={stationModalProps.testResult}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
                t={t}
            />

            <ImportExportModal
                isOpen={importExportModalProps.isOpen}
                onClose={importExportModalProps.onClose}
                onExportLoad={importExportModalProps.onExportLoad}
                ieFormat={importExportModalProps.ieFormat}
                ieDuplicateStrategy={importExportModalProps.ieDuplicateStrategy}
                setIeDuplicateStrategy={importExportModalProps.setIeDuplicateStrategy}
                ieTextContent={importExportModalProps.ieTextContent}
                setIeTextContent={importExportModalProps.setIeTextContent}
                ieStatusMessage={importExportModalProps.ieStatusMessage}
                onCopyExport={importExportModalProps.onCopyExport}
                onImportExecute={importExportModalProps.onImportExecute}
                t={t}
            />

            <ResetConfirmModal
                isOpen={resetModalProps.isOpen}
                onClose={resetModalProps.onClose}
                onConfirm={resetModalProps.onConfirm}
                title={resetModalProps.title}
                description={resetModalProps.description}
                cancelBtnText={t.cancelBtn}
                confirmBtnText={resetModalProps.confirmBtnText}
            />

            <QuitConfirmModal
                isOpen={quitModalProps.isOpen}
                onClose={quitModalProps.onClose}
                onConfirm={quitModalProps.onConfirm}
                appIconDataUrl={appIconDataUrl}
                language={lang}
                cancelBtnText={t.cancelBtn}
            />

            <AboutModal
                isOpen={aboutModalProps.isOpen}
                onClose={aboutModalProps.onClose}
                appIconDataUrl={appIconDataUrl}
                tagline={t.aboutTagline}
                description={t.aboutDescription}
                websiteBtnText={t.aboutWebsiteBtn}
                specLinkText={t.aboutSpecLink}
                changelogLinkText={t.aboutChangelogLink}
                onOpenExternalUrl={(url) => void api.openExternalUrl(url)}
            />

            <ScheduleModal
                isOpen={scheduleModalProps.isOpen}
                onClose={scheduleModalProps.onClose}
                onSave={scheduleModalProps.onSave}
                editingSchedule={scheduleModalProps.editingSchedule}
                stations={stations}
                schedStationId={scheduleModalProps.schedStationId}
                setSchedStationId={scheduleModalProps.setSchedStationId}
                schedShowName={scheduleModalProps.schedShowName}
                setSchedShowName={scheduleModalProps.setSchedShowName}
                schedHost={scheduleModalProps.schedHost}
                setSchedHost={scheduleModalProps.setSchedHost}
                schedDays={scheduleModalProps.schedDays}
                setSchedDays={scheduleModalProps.setSchedDays}
                schedStartTime={scheduleModalProps.schedStartTime}
                setSchedStartTime={scheduleModalProps.setSchedStartTime}
                schedEndTime={scheduleModalProps.schedEndTime}
                setSchedEndTime={scheduleModalProps.setSchedEndTime}
                schedAutoPlay={scheduleModalProps.schedAutoPlay}
                setSchedAutoPlay={scheduleModalProps.setSchedAutoPlay}
                schedReminderMinutes={scheduleModalProps.schedReminderMinutes}
                setSchedReminderMinutes={scheduleModalProps.setSchedReminderMinutes}
                schedNotes={scheduleModalProps.schedNotes}
                setSchedNotes={scheduleModalProps.setSchedNotes}
                dayLabels={DAY_LABELS}
                lang={lang}
                t={t}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
            />

            {settings && (
                <OnboardingModal
                    isOpen={onboardingModalProps.isOpen}
                    onClose={onboardingModalProps.onClose}
                    settings={settings}
                    onUpdateSettings={api.updateSettings}
                    appIconDataUrl={appIconDataUrl}
                    t={t}
                    lang={lang}
                />
            )}

            <UpdateModal
                isOpen={updateModalProps.isOpen}
                onClose={updateModalProps.onClose}
                updateInfo={updateModalProps.updateInfo}
                appIconDataUrl={appIconDataUrl}
                onOpenExternalUrl={(url: string) => void api.openExternalUrl(url)}
                t={t}
                isChecking={updateModalProps.isCheckingUpdate}
                error={updateModalProps.updateCheckError}
                onCheckAgain={updateModalProps.onCheckAgain}
                downloadProgress={updateModalProps.updateDownloadProgress}
                onStartDownload={updateModalProps.onStartDownload}
                onCancelDownload={updateModalProps.onCancelDownload}
                onInstallUpdate={updateModalProps.onInstallUpdate}
                onRevealInFinder={updateModalProps.onRevealInFinder}
            />

            <UpdateFloatingBadge
                updateDownloadProgress={updateModalProps.updateDownloadProgress}
                isUpdateModalOpen={updateModalProps.isOpen}
                onOpenUpdateModal={updateModalProps.onOpen}
                t={t}
            />
        </>
    );
};
