import React from 'react';
import type { SquelchWindowApi } from '../types';
import type { TranslationDictionary } from '../../i18n';
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

import type { useAppCoreData } from '../hooks/useAppCoreData';
import type { useStationModal } from '../hooks/useStationModal';
import type { useImportExportModal } from '../hooks/useImportExportModal';
import type { useScheduleManagement } from '../hooks/useScheduleManagement';
import type { useAppUpdates } from '../hooks/useAppUpdates';

export interface AppModalsHostProps {
    api: SquelchWindowApi;
    t: TranslationDictionary;
    lang: 'id' | 'en';
    appCoreData: ReturnType<typeof useAppCoreData>;
    stationModal: ReturnType<typeof useStationModal>;
    importExportModal: ReturnType<typeof useImportExportModal>;
    scheduleManagement: ReturnType<typeof useScheduleManagement>;
    appUpdates: ReturnType<typeof useAppUpdates>;

    resetModal: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => Promise<void>;
        title: string;
        description: string;
        confirmBtnText: string;
        isPending?: boolean;
    };
    quitModal: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
    };
    aboutModal: {
        isOpen: boolean;
        onClose: () => void;
    };
    onboardingModal: {
        isOpen: boolean;
        onClose: () => void;
    };
}

export const AppModalsHost: React.FC<AppModalsHostProps> = ({
    api,
    t,
    lang,
    appCoreData,
    stationModal,
    importExportModal,
    scheduleManagement,
    appUpdates,
    resetModal,
    quitModal,
    aboutModal,
    onboardingModal
}) => {
    return (
        <>
            <StationModal
                isOpen={stationModal.isFormOpen}
                onClose={() => stationModal.setIsFormOpen(false)}
                onSave={stationModal.handleSaveStation}
                editingStation={stationModal.editingStation}
                formName={stationModal.formName}
                setFormName={stationModal.setFormName}
                formUrl={stationModal.formUrl}
                setFormUrl={stationModal.setFormUrl}
                formGroup={stationModal.formGroup}
                setFormGroup={stationModal.setFormGroup}
                formGenre={stationModal.formGenre}
                setFormGenre={stationModal.setFormGenre}
                formCity={stationModal.formCity}
                setFormCity={stationModal.setFormCity}
                formType={stationModal.formType}
                setFormType={stationModal.setFormType}
                formLogo={stationModal.formLogo}
                setFormLogo={stationModal.setFormLogo}
                formTags={stationModal.formTags}
                setFormTags={stationModal.setFormTags}
                groups={appCoreData.groups}
                onTestStream={() => void stationModal.handleTestStream()}
                isTestingStream={stationModal.isTestingStream}
                testResult={stationModal.testResult}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
                t={t}
            />

            <ImportExportModal
                isOpen={importExportModal.isImportExportOpen}
                onClose={() => importExportModal.setIsImportExportOpen(false)}
                onExportLoad={(format) =>
                    void importExportModal.handleExportLoad(format)
                }
                ieFormat={importExportModal.ieFormat}
                ieDuplicateStrategy={importExportModal.ieDuplicateStrategy}
                setIeDuplicateStrategy={
                    importExportModal.setIeDuplicateStrategy
                }
                ieTextContent={importExportModal.ieTextContent}
                setIeTextContent={importExportModal.setIeTextContent}
                ieStatusMessage={importExportModal.ieStatusMessage}
                onCopyExport={() => {
                    void navigator.clipboard.writeText(
                        importExportModal.ieTextContent
                    );
                    importExportModal.setIeStatusMessage(t.copiedDiagBtn);
                }}
                onImportExecute={() =>
                    void importExportModal.handleImportExecute()
                }
                t={t}
            />

            <ResetConfirmModal
                isOpen={resetModal.isOpen}
                onClose={resetModal.onClose}
                onConfirm={resetModal.onConfirm}
                title={resetModal.title}
                description={resetModal.description}
                cancelBtnText={t.cancelBtn}
                confirmBtnText={resetModal.confirmBtnText}
                isPending={resetModal.isPending}
            />

            <QuitConfirmModal
                isOpen={quitModal.isOpen}
                onClose={quitModal.onClose}
                onConfirm={quitModal.onConfirm}
                appIconDataUrl={appCoreData.appIconDataUrl}
                language={lang}
                cancelBtnText={t.cancelBtn}
            />

            <AboutModal
                isOpen={aboutModal.isOpen}
                onClose={aboutModal.onClose}
                appIconDataUrl={appCoreData.appIconDataUrl}
                tagline={t.aboutTagline}
                description={t.aboutDescription}
                websiteBtnText={t.aboutWebsiteBtn}
                specLinkText={t.aboutSpecLink}
                changelogLinkText={t.aboutChangelogLink}
                onOpenExternalUrl={(url) => void api.openExternalUrl(url)}
            />

            <ScheduleModal
                isOpen={scheduleManagement.isScheduleModalOpen}
                onClose={() => scheduleManagement.setIsScheduleModalOpen(false)}
                onSave={scheduleManagement.handleSaveSchedule}
                editingSchedule={scheduleManagement.editingSchedule}
                stations={appCoreData.stations}
                schedStationId={scheduleManagement.schedStationId}
                setSchedStationId={scheduleManagement.setSchedStationId}
                schedShowName={scheduleManagement.schedShowName}
                setSchedShowName={scheduleManagement.setSchedShowName}
                schedHost={scheduleManagement.schedHost}
                setSchedHost={scheduleManagement.setSchedHost}
                schedDays={scheduleManagement.schedDays}
                setSchedDays={scheduleManagement.setSchedDays}
                schedStartTime={scheduleManagement.schedStartTime}
                setSchedStartTime={scheduleManagement.setSchedStartTime}
                schedEndTime={scheduleManagement.schedEndTime}
                setSchedEndTime={scheduleManagement.setSchedEndTime}
                schedAutoPlay={scheduleManagement.schedAutoPlay}
                setSchedAutoPlay={scheduleManagement.setSchedAutoPlay}
                schedReminderMinutes={scheduleManagement.schedReminderMinutes}
                setSchedReminderMinutes={
                    scheduleManagement.setSchedReminderMinutes
                }
                schedNotes={scheduleManagement.schedNotes}
                setSchedNotes={scheduleManagement.setSchedNotes}
                dayLabels={DAY_LABELS}
                lang={lang}
                t={t}
                onResolveLogo={(url) => api.resolveStationLogo(url)}
            />

            {appCoreData.settings && (
                <OnboardingModal
                    isOpen={onboardingModal.isOpen}
                    onClose={onboardingModal.onClose}
                    settings={appCoreData.settings}
                    onUpdateSettings={api.updateSettings}
                    appIconDataUrl={appCoreData.appIconDataUrl}
                    t={t}
                    lang={lang}
                />
            )}

            <UpdateModal
                isOpen={appUpdates.isUpdateModalOpen}
                onClose={() => appUpdates.setIsUpdateModalOpen(false)}
                updateInfo={appUpdates.updateInfo}
                appIconDataUrl={appCoreData.appIconDataUrl}
                onOpenExternalUrl={(url: string) =>
                    void api.openExternalUrl(url)
                }
                t={t}
                isChecking={appUpdates.isCheckingUpdate}
                error={appUpdates.updateCheckError}
                onCheckAgain={() => void appUpdates.handleCheckForUpdates(true)}
                downloadProgress={appUpdates.updateDownloadProgress}
                onStartDownload={appUpdates.handleStartDownloadUpdate}
                onCancelDownload={appUpdates.handleCancelDownloadUpdate}
                onInstallUpdate={appUpdates.handleInstallUpdate}
                onRevealInFinder={appUpdates.handleRevealUpdateInFinder}
            />

            <UpdateFloatingBadge
                updateDownloadProgress={appUpdates.updateDownloadProgress}
                isUpdateModalOpen={appUpdates.isUpdateModalOpen}
                onOpenUpdateModal={() => appUpdates.setIsUpdateModalOpen(true)}
                t={t}
            />
        </>
    );
};
