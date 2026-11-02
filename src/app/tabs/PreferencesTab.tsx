import React, { useState } from 'react';
import type { AppSettings } from '../../types';
import { SUPPORTED_LOCALES, type TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import type { UpdateCheckResult, UpdateDownloadProgress } from '../../components/UpdateModal';
import { ACCENT_SWATCHES } from '../../utils/appearance';
import { ThemePreviewCard } from '../../components/ThemePreviewCard';
import { MacToggle } from '../../components/MacToggle';
import { SearchableFontPicker } from '../../components/SearchableFontPicker';
import { MacSelect } from '../../components/MacSelect';
import { AudioEqualizerCard } from '../../components/AudioEqualizerCard';
import { KeyboardShortcutRecorder } from '../../components/KeyboardShortcutRecorder';
import {
    GLOBAL_SHORTCUT_DEFINITIONS,
    type ShortcutActionKey
} from '../../utils/shortcuts';
import {
    IconArrowDownTray,
    IconBackup,
    IconBell,
    IconCheck,
    IconChevronDown,
    IconChevronUp,
    IconCompass,
    IconCopy,
    IconFolder,
    IconRestore,
    IconSparkles,
    IconSpinner,
    IconSwatch,
    IconTrash
} from '../../components/Icons';

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

    const handleUpdateShortcut = (key: ShortcutActionKey, newAccel: string) => {
        void api.updateSettings({
            shortcuts: {
                ...settings.shortcuts,
                [key]: newAccel
            }
        });
    };

    return (
        <div
            key="tab-preferences"
            className="max-w-3xl space-y-6 text-xs animate-tab-enter"
        >
            {/* Group 1: Appearance & Personalization */}
            <div className="relative z-30">
                <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                    <IconSwatch size={14} className="text-accent" />
                    <span>{t.prefAppearanceSection}</span>
                </h2>
                <div className="mac-settings-card mac-inset-list">
                    <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="text-[13px] font-medium">
                                {t.prefThemeLabel}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemePreviewCard
                                mode="system"
                                active={
                                    (settings.theme ?? 'system') === 'system'
                                }
                                label={t.prefThemeSystem}
                                onSelect={() =>
                                    void api.updateSettings({ theme: 'system' })
                                }
                            />
                            <ThemePreviewCard
                                mode="light"
                                active={settings.theme === 'light'}
                                label={t.prefThemeLight}
                                onSelect={() =>
                                    void api.updateSettings({ theme: 'light' })
                                }
                            />
                            <ThemePreviewCard
                                mode="dark"
                                active={settings.theme === 'dark'}
                                label={t.prefThemeDark}
                                onSelect={() =>
                                    void api.updateSettings({ theme: 'dark' })
                                }
                            />
                        </div>
                    </div>

                    {/* Accent Color Swatches */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                        <span className="text-[13px] font-medium">
                            {t.prefAccentLabel}
                        </span>
                        <div className="flex items-center gap-2">
                            {ACCENT_SWATCHES.map((swatch) => {
                                const selected =
                                    (
                                        settings.accentColor ?? '#0A84FF'
                                    ).toLowerCase() ===
                                    swatch.hex.toLowerCase();
                                return (
                                    <button
                                        key={swatch.id}
                                        type="button"
                                        title={swatch.label}
                                        aria-label={swatch.label}
                                        onClick={() =>
                                            void api.updateSettings({
                                                accentColor: swatch.hex
                                            })
                                        }
                                        className={`w-[17px] h-[17px] rounded-full cursor-pointer transition-transform flex items-center justify-center shrink-0 ${
                                            selected
                                                ? 'scale-110 ring-2 ring-white/90 shadow-xs'
                                                : 'hover:scale-105 opacity-90 hover:opacity-100'
                                        }`}
                                        style={{
                                            backgroundColor: swatch.hex
                                        }}
                                    >
                                        {selected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                        )}
                                    </button>
                                );
                            })}
                            <div className="relative flex items-center ml-0.5">
                                <input
                                    type="color"
                                    value={settings.accentColor ?? '#0A84FF'}
                                    aria-label="Custom Accent Color"
                                    title="Custom Color"
                                    onChange={(e) =>
                                        void api.updateSettings({
                                            accentColor: e.target.value
                                        })
                                    }
                                    className="w-[19px] h-[19px] rounded-full cursor-pointer bg-transparent border border-black/15 dark:border-white/20 p-0 overflow-hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Glass Opacity Slider */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-[13px] font-medium">
                                {t.prefGlassOpacityLabel}
                            </div>
                            <div className="text-[12px] text-secondary mt-0.5">
                                {t.prefGlassOpacityDesc}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <input
                                type="range"
                                min={40}
                                max={100}
                                step={5}
                                value={settings.glassOpacity ?? 90}
                                aria-label={t.prefGlassOpacityLabel}
                                onChange={(e) => {
                                    const val =
                                        parseInt(e.target.value, 10) || 90;
                                    void api.updateSettings({
                                        glassOpacity: val
                                    });
                                }}
                                className="w-32 cursor-pointer"
                                style={{
                                    accentColor: 'var(--accent-color)'
                                }}
                            />
                            <span className="text-[12px] font-mono font-medium text-secondary tabular-nums min-w-[36px] text-right">
                                {settings.glassOpacity ?? 90}%
                            </span>
                        </div>
                    </div>

                    {/* System Font Picker */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-4 relative z-40">
                        <div>
                            <div className="text-[13px] font-medium">
                                {t.prefFontFamilyLabel}
                            </div>
                            <div className="text-[12px] text-secondary mt-0.5">
                                {t.prefFontFamilyDesc}
                            </div>
                        </div>
                        <SearchableFontPicker
                            value={settings.fontFamily ?? 'system'}
                            fonts={systemFonts}
                            isLoading={isLoadingFonts}
                            defaultLabel={t.prefFontSystemDefault}
                            ariaLabel={t.prefFontFamilyLabel}
                            placeholder={t.prefFontSearchPlaceholder}
                            foundLabel={t.prefFontFound}
                            selectedLabel={t.prefFontSelected}
                            loadingLabel={t.prefFontLoading}
                            noMatchLabel={t.prefFontNoMatch}
                            onChange={(selectedFont) => {
                                void api.updateSettings({
                                    fontFamily: selectedFont
                                });
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Group 2: General & Language */}
            <div className="relative z-20">
                <h2 className="text-[13px] font-bold mb-2 px-1">
                    {t.prefGeneral}
                </h2>
                <div className="mac-settings-card mac-inset-list">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefLanguage}
                        </span>
                        <MacSelect
                            value={settings.language}
                            ariaLabel={t.prefLanguage}
                            onChange={(nextLang) =>
                                void api.updateSettings({
                                    language: nextLang as AppSettings['language']
                                })
                            }
                            options={SUPPORTED_LOCALES.map((loc) => ({
                                value: loc.code,
                                label: loc.nativeName,
                                icon: (
                                    <span className="text-[13px] shrink-0">
                                        {loc.flag}
                                    </span>
                                )
                            }))}
                            widthClass="w-[200px]"
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefConfirmQuit}
                        </span>
                        <MacToggle
                            checked={settings.confirmBeforeQuit ?? true}
                            label={t.prefConfirmQuit}
                            onChange={(next) =>
                                void api.updateSettings({
                                    confirmBeforeQuit: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefLaunchAtLogin}
                        </span>
                        <MacToggle
                            checked={settings.launchAtLogin}
                            label={t.prefLaunchAtLogin}
                            onChange={(next) =>
                                void api.updateSettings({
                                    launchAtLogin: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                            <span className="text-[13px] font-medium block">
                                {t.prefHideFromDock}
                            </span>
                            <span className="text-[11px] text-secondary block mt-0.5">
                                {t.prefHideFromDockDesc}
                            </span>
                        </div>
                        <MacToggle
                            checked={settings.hideFromDock ?? false}
                            label={t.prefHideFromDock}
                            onChange={(next) =>
                                void api.updateSettings({
                                    hideFromDock: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefAutoPlay}
                        </span>
                        <MacToggle
                            checked={settings.autoPlayLastStation}
                            label={t.prefAutoPlay}
                            onChange={(next) =>
                                void api.updateSettings({
                                    autoPlayLastStation: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefNotifySong}
                        </span>
                        <MacToggle
                            checked={settings.notifyOnSongChange}
                            label={t.prefNotifySong}
                            onChange={(next) =>
                                void api.updateSettings({
                                    notifyOnSongChange: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-[13px] font-medium">
                                {t.introReopenBtn}
                            </div>
                            <div className="text-[12px] text-secondary mt-0.5">
                                {lang === 'id'
                                    ? 'Tampilkan kembali panduan langkah awal dan integrasi sistem.'
                                    : 'Re-open the initial setup guide and system integration.'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOnboardingOpen(true)}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
                        >
                            <IconCompass size={14} />
                            <span>{t.introReopenBtn}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Group 3: Audio & Network */}
            <div className="relative z-10">
                <h2 className="text-[13px] font-bold mb-2 px-1">
                    {t.prefAudioNet}
                </h2>
                <div className="mac-settings-card mac-inset-list">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefAutoReconnect}
                        </span>
                        <MacToggle
                            checked={settings.autoReconnect}
                            label={t.prefAutoReconnect}
                            onChange={(next) =>
                                void api.updateSettings({
                                    autoReconnect: next
                                })
                            }
                        />
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefMaxRetries}
                        </span>
                        <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums">
                            {[5, 8, 15, 25].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() =>
                                        void api.updateSettings({
                                            maxReconnectAttempts: val
                                        })
                                    }
                                    className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                        settings.maxReconnectAttempts === val
                                            ? 'bg-accent text-white'
                                            : 'text-secondary'
                                    }`}
                                >
                                    {val}x
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.prefTimeout}
                        </span>
                        <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums">
                            {[8000, 12000, 20000].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() =>
                                        void api.updateSettings({
                                            networkTimeoutMs: val
                                        })
                                    }
                                    className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                        settings.networkTimeoutMs === val
                                            ? 'bg-accent text-white'
                                            : 'text-secondary'
                                    }`}
                                >
                                    {val / 1000}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buffer Length Selector */}
                    <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium">
                                {t.prefBufferLabel}
                            </div>
                            <div className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                {t.prefBufferDesc}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 p-0.5 rounded-[7px] mac-glass-pill tabular-nums shrink-0 self-start sm:self-auto">
                            {[
                                { sec: 3, label: '3s' },
                                { sec: 5, label: '5s' },
                                { sec: 10, label: '10s' },
                                { sec: 15, label: '15s' }
                            ].map(({ sec, label }) => (
                                <button
                                    key={sec}
                                    type="button"
                                    onClick={() =>
                                        void api.updateSettings({
                                            bufferLengthSeconds: sec
                                        })
                                    }
                                    className={`px-3 py-1 rounded-[5px] text-[11px] font-medium cursor-pointer transition ${
                                        (settings.bufferLengthSeconds ?? 5) ===
                                        sec
                                            ? 'bg-accent text-white shadow-xs'
                                            : 'text-secondary hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Audio Equalizer & Sound Quality */}
            <AudioEqualizerCard
                equalizer={settings.equalizer}
                onUpdateEqualizer={(eq) =>
                    void api.updateSettings({ equalizer: eq })
                }
                lang={lang}
                t={t}
            />

            {/* Group 4: Global Shortcuts */}
            <div>
                <div className="mb-2 px-1">
                    <h2 className="text-[13px] font-bold">{t.prefShortcuts}</h2>
                    <p className="text-[11px] text-secondary mt-0.5">
                        {t.prefShortcutRecordHint}
                    </p>
                </div>

                <div className="mac-settings-card mac-inset-list">
                    {GLOBAL_SHORTCUT_DEFINITIONS.map((def) => {
                        const isRecording = recordingShortcutKey === def.key;
                        const currentValue =
                            settings.shortcuts?.[def.key] ?? '';
                        return (
                            <KeyboardShortcutRecorder
                                key={def.key}
                                definition={def}
                                currentValue={currentValue}
                                allShortcuts={settings.shortcuts}
                                isRecording={isRecording}
                                onStartRecording={() =>
                                    setRecordingShortcutKey(def.key)
                                }
                                onStopRecording={() =>
                                    setRecordingShortcutKey(null)
                                }
                                onChange={handleUpdateShortcut}
                                lang={lang}
                                t={t}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Group 5: Backup & Restore Data */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1">
                    {t.prefBackupSection}
                </h2>
                <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="text-[13px] font-medium">
                            {t.prefBackupTitle}
                        </div>
                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                            {t.prefBackupDesc}
                        </p>
                        {backupStatusMsg && (
                            <div className="mt-1.5 text-[11px] text-[#30D158] font-medium">
                                {backupStatusMsg}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => void handleRestoreData()}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                            <IconRestore size={13} />
                            <span>{t.prefRestoreBtn}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleBackupData()}
                            className="bg-accent hover:opacity-90 text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                            <IconBackup size={13} />
                            <span>{t.prefBackupBtn}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Group: Application Updates */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                    <IconSparkles size={14} className="text-accent" />
                    <span>{t.updatesSectionTitle}</span>
                </h2>
                <div className="mac-settings-card mac-inset-list">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="text-[13px] font-semibold text-foreground">
                                    Squelch
                                </div>
                                <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-mono font-bold tabular-nums">
                                    v{updateInfo?.currentVersion || '0.1.3'}
                                </span>
                                {updateInfo?.hasUpdate ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] text-[11px] font-semibold flex items-center gap-1">
                                        <span>
                                            Update: v{updateInfo.latestVersion}
                                        </span>
                                    </span>
                                ) : !isCheckingUpdate &&
                                  updateInfo &&
                                  !updateCheckError ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] text-[11px] font-semibold flex items-center gap-1">
                                        <IconCheck size={12} />
                                        <span>{t.updatesUpToDate}</span>
                                    </span>
                                ) : null}
                            </div>
                            <div className="text-[12px] text-secondary mt-1">
                                {updateCheckError ? (
                                    <span className="text-[#FF453A]">
                                        {t.updatesError}: {updateCheckError}
                                    </span>
                                ) : (
                                    t.updatesSectionDesc
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {updateInfo?.hasUpdate && (
                                <button
                                    type="button"
                                    onClick={() => setIsUpdateModalOpen(true)}
                                    className="bg-accent hover:opacity-90 text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                                >
                                    {updateDownloadProgress?.status ===
                                    'downloading' ? (
                                        <>
                                            <IconSpinner
                                                size={13}
                                                className="animate-spin"
                                            />
                                            <span>
                                                {t.updatesDownloadingBadge} (
                                                {updateDownloadProgress.percent.toFixed(
                                                    0
                                                )}
                                                %)
                                            </span>
                                        </>
                                    ) : updateDownloadProgress?.status ===
                                      'completed' ? (
                                        <>
                                            <IconCheck size={13} />
                                            <span>{t.updatesInstallBtn}</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconArrowDownTray size={13} />
                                            <span>
                                                {t.updatesDownloadBackground}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={isCheckingUpdate}
                                onClick={() => void handleCheckForUpdates(true)}
                                className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10 transition"
                            >
                                {isCheckingUpdate ? (
                                    <>
                                        <IconSpinner
                                            size={13}
                                            className="animate-spin text-accent"
                                        />
                                        <span>{t.updatesChecking}</span>
                                    </>
                                ) : (
                                    <>
                                        <IconRestore size={13} />
                                        <span>{t.updatesCheckBtn}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium">
                            {t.updatesAutoCheck}
                        </span>
                        <MacToggle
                            checked={settings.autoCheckUpdates !== false}
                            label={t.updatesAutoCheck}
                            onChange={(next) =>
                                void api.updateSettings({
                                    autoCheckUpdates: next
                                })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Group: System Notifications */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5">
                    <IconBell size={14} className="text-accent" />
                    <span>{t.prefNotifSection}</span>
                </h2>
                <div className="mac-settings-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="text-[13px] font-medium text-foreground">
                                {typeof window !== 'undefined' &&
                                'Notification' in window &&
                                Notification.permission === 'granted'
                                    ? t.prefNotifStatusGranted
                                    : t.prefNotifStatusPrompt}
                            </div>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                                    typeof window !== 'undefined' &&
                                    'Notification' in window &&
                                    Notification.permission === 'granted'
                                        ? 'bg-[#30D158]/15 text-[#30D158]'
                                        : 'bg-[#FF9F0A]/15 text-[#FF9F0A]'
                                }`}
                            >
                                {typeof window !== 'undefined' &&
                                'Notification' in window &&
                                Notification.permission === 'granted' ? (
                                    <>
                                        <IconCheck size={11} />
                                        <span>macOS Active</span>
                                    </>
                                ) : (
                                    <span>Permission Needed</span>
                                )}
                            </span>
                        </div>
                        <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                            {t.prefNotifDesc}
                        </p>
                        {notifTestSuccess && (
                            <div className="mt-1.5 text-[11px] text-[#30D158] font-medium flex items-center gap-1 animate-fade-in">
                                <IconCheck size={12} />
                                <span>{t.prefNotifTestSuccess}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={async () => {
                                const title = 'Squelch Radio';
                                const body =
                                    settings?.language === 'en'
                                        ? 'System notification is working properly on macOS!'
                                        : 'Notifikasi sistem berfungsi dengan baik pada macOS!';
                                const ok = await api.sendNotification(
                                    title,
                                    body
                                );
                                if (ok) {
                                    setNotifTestSuccess(true);
                                    setTimeout(
                                        () => setNotifTestSuccess(false),
                                        2500
                                    );
                                }
                            }}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-xs"
                        >
                            <IconBell size={13} />
                            <span>{t.prefNotifTestBtn}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Group 6: Diagnostics & System Logs */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1">
                    {t.prefDiagSection}
                </h2>
                <div className="mac-settings-card">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[13px] font-medium">
                                {t.prefDiagDesc}
                            </div>
                            <div className="text-[11px] text-secondary font-mono truncate mt-1">
                                {t.prefDataDirLabel}: {dataDir}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => void api.openLogsFolder()}
                                className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                                <IconFolder size={13} />
                                <span>{t.openLogsBtn}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const textToCopy =
                                        typeof diagnosticsText === 'string'
                                            ? diagnosticsText
                                            : JSON.stringify(
                                                  diagnosticsText,
                                                  null,
                                                  2
                                              );
                                    void navigator.clipboard.writeText(
                                        textToCopy
                                    );
                                    setCopiedDiag(true);
                                    setTimeout(
                                        () => setCopiedDiag(false),
                                        2000
                                    );
                                }}
                                className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                                <IconCopy size={13} />
                                <span>
                                    {copiedDiag
                                        ? t.copiedDiagBtn
                                        : t.copyDiagBtn}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => {
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
                            }}
                            className="text-[12px] font-medium text-accent flex items-center gap-1.5 cursor-pointer hover:underline"
                        >
                            {showDiagReport ? (
                                <IconChevronUp size={14} />
                            ) : (
                                <IconChevronDown size={14} />
                            )}
                            <span>
                                {showDiagReport
                                    ? t.prefDiagHideBtn
                                    : t.prefDiagShowBtn}
                            </span>
                        </button>
                    </div>

                    {showDiagReport && (
                        <div className="px-4 pb-4 animate-collapse-enter">
                            <pre className="p-3.5 rounded-[8px] bg-black/25 border mac-divider text-[11px] font-mono overflow-x-auto tabular-nums max-h-64 whitespace-pre-wrap select-text">
                                {typeof diagnosticsText === 'string'
                                    ? diagnosticsText
                                    : JSON.stringify(diagnosticsText, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Group: Data Management & Reset Options */}
            <div>
                <h2 className="text-[13px] font-bold mb-2 px-1 text-[#FF453A] flex items-center gap-1.5">
                    <IconTrash size={14} className="text-[#FF453A]" />
                    <span>{t.prefDangerSection}</span>
                </h2>
                <div className="mac-settings-card mac-inset-list border border-[#FF453A]/30 overflow-hidden">
                    {/* 1. Dropdown Hapus Data Tertentu */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-foreground">
                                {t.prefClearDropdownLabel || 'Hapus Data'}
                            </div>
                            <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                {selectedClearTarget === 'stations'
                                    ? t.prefClearStationsDesc
                                    : selectedClearTarget === 'schedules'
                                      ? t.prefClearSchedulesDesc
                                      : selectedClearTarget === 'stats'
                                        ? t.prefClearStatsDesc
                                        : t.prefResetAllDesc}
                            </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                            <MacSelect
                                value={selectedClearTarget}
                                ariaLabel={
                                    t.prefClearDropdownLabel ||
                                    'Pilih data yang ingin dihapus'
                                }
                                onChange={(nextTarget) =>
                                    setSelectedClearTarget(
                                        nextTarget as
                                            | 'stations'
                                            | 'schedules'
                                            | 'stats'
                                            | 'all'
                                    )
                                }
                                options={[
                                    {
                                        value: 'all',
                                        label:
                                            t.prefClearAllDataOption ||
                                            'Semua Data'
                                    },
                                    {
                                        value: 'stations',
                                        label: t.tabStations
                                    },
                                    {
                                        value: 'schedules',
                                        label: t.tabSchedules
                                    },
                                    { value: 'stats', label: t.tabStats }
                                ]}
                                widthClass="w-[200px]"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    onRequestReset
                                        ? onRequestReset(selectedClearTarget)
                                        : setIsResetConfirmOpen(true)
                                }
                                className="mac-glass-pill text-[#FF453A] hover:bg-[#FF453A]/10 px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition shrink-0"
                            >
                                {t.prefClearBtn || 'Hapus Data'}
                            </button>
                        </div>
                    </div>

                    {/* 2. Kembali ke Pengaturan Awal */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-foreground">
                                {t.prefResetBtn}
                            </div>
                            <p className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                {t.prefResetDesc}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                onRequestReset
                                    ? onRequestReset('settings')
                                    : setIsResetConfirmOpen(true)
                            }
                            className="bg-[#FF453A] hover:bg-[#D70015] text-white px-3.5 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition shrink-0"
                        >
                            {t.prefResetBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
