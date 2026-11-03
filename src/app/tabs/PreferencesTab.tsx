import React, { useState, useEffect } from 'react';
import type { AppSettings, AudioOutputDevice } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import type { UpdateCheckResult, UpdateDownloadProgress } from '../../components/UpdateModal';
import type { ShortcutActionKey } from '../../utils/shortcuts';
import {
    AppearanceSection,
    GeneralSection,
    AudioSection,
    ShortcutsSection,
    BackupSection,
    UpdatesSection,
    NotificationSection,
    DiagnosticsSection,
    DangerZoneSection
} from './preferences';

export interface PreferencesTabProps {
    settings: AppSettings;
    systemFonts: string[];
    isLoadingFonts?: boolean;
    lang: 'id' | 'en';
    recordingShortcutKey: keyof AppSettings['shortcuts'] | null;
    setRecordingShortcutKey: (
        key: keyof AppSettings['shortcuts'] | null
    ) => void;
    backupStatusMsg: string | null;
    handleRestoreData: () => Promise<void>;
    handleBackupData: () => Promise<void>;
    updateInfo: UpdateCheckResult | null;
    updateCheckError: string | null;
    isCheckingUpdate: boolean;
    updateDownloadProgress?: UpdateDownloadProgress | null;
    handleCheckForUpdates: (manual?: boolean) => Promise<void>;
    setIsUpdateModalOpen: (open: boolean) => void;
    setIsOnboardingOpen: (open: boolean) => void;
    notifTestSuccess: boolean;
    setNotifTestSuccess: React.Dispatch<React.SetStateAction<boolean>>;
    dataDir: string;
    copiedDiag: boolean;
    setCopiedDiag: React.Dispatch<React.SetStateAction<boolean>>;
    showDiagReport: boolean;
    setShowDiagReport: React.Dispatch<React.SetStateAction<boolean>>;
    diagnosticsText: string;
    setDiagnosticsText: (text: string) => void;
    setIsResetConfirmOpen: (open: boolean) => void;
    onRequestReset?: (
        target: 'settings' | 'stations' | 'schedules' | 'stats' | 'all'
    ) => void;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({
    settings,
    systemFonts,
    isLoadingFonts = false,
    lang,
    recordingShortcutKey,
    setRecordingShortcutKey,
    backupStatusMsg,
    handleRestoreData,
    handleBackupData,
    updateInfo,
    updateCheckError,
    isCheckingUpdate,
    updateDownloadProgress,
    handleCheckForUpdates,
    setIsUpdateModalOpen,
    setIsOnboardingOpen,
    notifTestSuccess,
    setNotifTestSuccess,
    dataDir,
    copiedDiag,
    setCopiedDiag,
    showDiagReport,
    setShowDiagReport,
    diagnosticsText,
    setDiagnosticsText,
    setIsResetConfirmOpen,
    onRequestReset,
    api,
    t
}) => {
    const [selectedClearTarget, setSelectedClearTarget] = useState<
        'stations' | 'schedules' | 'stats' | 'all'
    >('stations');

    const [audioDevices, setAudioDevices] = useState<AudioOutputDevice[]>([]);
    const [isLoadingAudioDevices, setIsLoadingAudioDevices] =
        useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchDevices = async () => {
            try {
                if (api.getAudioOutputDevices) {
                    const devs = await api.getAudioOutputDevices();
                    if (isMounted) {
                        setAudioDevices(devs);
                    }
                }
            } catch {
                // ignore
            } finally {
                if (isMounted) {
                    setIsLoadingAudioDevices(false);
                }
            }
        };
        void fetchDevices();
        return () => {
            isMounted = false;
        };
    }, [api]);

    const handleUpdateSettings = (patch: Partial<AppSettings>) => {
        void api.updateSettings(patch);
    };

    const handleUpdateShortcut = (key: ShortcutActionKey, newAccel: string) => {
        void api.updateSettings({
            shortcuts: {
                ...settings.shortcuts,
                [key]: newAccel
            }
        });
    };

    const handleTestNotification = async () => {
        const title = 'Squelch Radio';
        const body =
            settings?.language === 'en'
                ? 'System notification is working properly on macOS!'
                : 'Notifikasi sistem berfungsi dengan baik pada macOS!';
        const ok = await api.sendNotification(title, body);
        if (ok) {
            setNotifTestSuccess(true);
            setTimeout(() => setNotifTestSuccess(false), 2500);
        }
    };

    const handleCopyDiagnostics = () => {
        const textToCopy =
            typeof diagnosticsText === 'string'
                ? diagnosticsText
                : JSON.stringify(diagnosticsText, null, 2);
        void navigator.clipboard.writeText(textToCopy);
        setCopiedDiag(true);
        setTimeout(() => setCopiedDiag(false), 2000);
    };

    const handleToggleDiagReport = () => {
        const next = !showDiagReport;
        setShowDiagReport(next);
        if (next) {
            void api.getDiagnostics().then((res) => {
                const text =
                    typeof res === 'string'
                        ? res
                        : JSON.stringify(res, null, 2);
                setDiagnosticsText(text);
            });
        }
    };

    return (
        <div
            key="tab-preferences"
            className="max-w-3xl space-y-6 text-xs animate-tab-enter"
        >
            {/* 1. Appearance & Personalization */}
            <AppearanceSection
                settings={settings}
                systemFonts={systemFonts}
                isLoadingFonts={isLoadingFonts}
                onUpdateSettings={handleUpdateSettings}
                t={t}
            />

            {/* 2. General & Language */}
            <GeneralSection
                settings={settings}
                lang={lang}
                onUpdateSettings={handleUpdateSettings}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                t={t}
            />

            {/* 3. Audio, Network & Equalizer */}
            <AudioSection
                settings={settings}
                audioDevices={audioDevices}
                isLoadingAudioDevices={isLoadingAudioDevices}
                onUpdateSettings={handleUpdateSettings}
                onSetAudioOutputDevice={api.setAudioOutputDevice}
                lang={lang}
                t={t}
            />

            {/* 4. Global Shortcuts */}
            <ShortcutsSection
                settings={settings}
                recordingShortcutKey={recordingShortcutKey}
                setRecordingShortcutKey={setRecordingShortcutKey}
                onUpdateShortcut={handleUpdateShortcut}
                lang={lang}
                t={t}
            />

            {/* 5. Backup & Restore Data */}
            <BackupSection
                backupStatusMsg={backupStatusMsg}
                onRestoreData={handleRestoreData}
                onBackupData={handleBackupData}
                t={t}
            />

            {/* 6. Application Updates */}
            <UpdatesSection
                settings={settings}
                updateInfo={updateInfo}
                updateCheckError={updateCheckError}
                isCheckingUpdate={isCheckingUpdate}
                updateDownloadProgress={updateDownloadProgress}
                onCheckForUpdates={handleCheckForUpdates}
                onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
                onUpdateSettings={handleUpdateSettings}
                t={t}
            />

            {/* 7. System Notifications */}
            <NotificationSection
                notifTestSuccess={notifTestSuccess}
                onTestNotification={handleTestNotification}
                t={t}
            />

            {/* 8. Diagnostics & System Logs */}
            <DiagnosticsSection
                dataDir={dataDir}
                diagnosticsText={diagnosticsText}
                showDiagReport={showDiagReport}
                copiedDiag={copiedDiag}
                onOpenLogsFolder={() => api.openLogsFolder()}
                onCopyDiagnostics={handleCopyDiagnostics}
                onToggleDiagReport={handleToggleDiagReport}
                t={t}
            />

            {/* 9. Data Management & Reset Options */}
            <DangerZoneSection
                selectedClearTarget={selectedClearTarget}
                setSelectedClearTarget={setSelectedClearTarget}
                onRequestReset={onRequestReset}
                setIsResetConfirmOpen={setIsResetConfirmOpen}
                t={t}
            />
        </div>
    );
};
