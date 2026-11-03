import React, { useMemo } from 'react';
import type { AppSettings, AudioOutputDevice } from '../../../types';
import type { TranslationDictionary } from '../../../i18n';
import { MacSelect, type MacSelectOption } from '../../../components/MacSelect';
import { MacToggle } from '../../../components/MacToggle';
import { AudioEqualizerCard } from '../../../components/AudioEqualizerCard';
import { IconSpeaker, IconSpinner } from '../../../components/Icons';

export interface AudioSectionProps {
    settings: AppSettings;
    audioDevices: AudioOutputDevice[];
    isLoadingAudioDevices?: boolean;
    onUpdateSettings: (patch: Partial<AppSettings>) => void;
    onSetAudioOutputDevice?: (
        deviceId: string,
        deviceName?: string
    ) => Promise<unknown> | unknown;
    lang: 'id' | 'en';
    t: TranslationDictionary;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
    settings,
    audioDevices,
    isLoadingAudioDevices = false,
    onUpdateSettings,
    onSetAudioOutputDevice,
    lang,
    t
}) => {
    const audioDeviceOptions: MacSelectOption<string>[] = useMemo(() => {
        if (audioDevices.length === 0) {
            return [
                {
                    value: 'default',
                    label: t.prefAudioOutputDefault,
                    icon: <IconSpeaker size={13} className="text-secondary" />
                }
            ];
        }
        return audioDevices.map((dev) => ({
            value: dev.id,
            label: dev.id === 'default' ? t.prefAudioOutputDefault : dev.name,
            icon: (
                <IconSpeaker
                    size={13}
                    className={
                        dev.id === (settings.audioOutputDeviceId ?? 'default')
                            ? 'text-accent'
                            : 'text-secondary'
                    }
                />
            )
        }));
    }, [audioDevices, settings.audioOutputDeviceId, t.prefAudioOutputDefault]);

    return (
        <div className="relative z-10 space-y-6">
            <div>
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
                                onUpdateSettings({
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
                                        onUpdateSettings({
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
                                        onUpdateSettings({
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
                                        onUpdateSettings({
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

                    {/* Audio Output Device Selector */}
                    <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium flex items-center gap-2">
                                <span>{t.prefAudioOutputDevice}</span>
                                {isLoadingAudioDevices && (
                                    <span className="text-[11px] text-secondary font-normal flex items-center gap-1">
                                        <IconSpinner
                                            size={11}
                                            className="animate-spin text-accent"
                                        />
                                        <span>{t.prefAudioOutputLoading}</span>
                                    </span>
                                )}
                            </div>
                            <div className="text-[12px] text-secondary mt-0.5 leading-relaxed">
                                {t.prefAudioOutputDeviceDesc}
                            </div>
                        </div>
                        <div className="shrink-0 self-start sm:self-auto">
                            <MacSelect
                                value={
                                    settings.audioOutputDeviceId ?? 'default'
                                }
                                options={audioDeviceOptions}
                                ariaLabel={t.prefAudioOutputDevice}
                                widthClass="w-[230px]"
                                onChange={(selectedId) => {
                                    const matchedDev = audioDevices.find(
                                        (d) => d.id === selectedId
                                    );
                                    if (onSetAudioOutputDevice) {
                                        void onSetAudioOutputDevice(
                                            selectedId,
                                            matchedDev?.name
                                        );
                                    } else {
                                        onUpdateSettings({
                                            audioOutputDeviceId: selectedId
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Audio Equalizer & Sound Quality */}
            <AudioEqualizerCard
                equalizer={settings.equalizer}
                onUpdateEqualizer={(eq) =>
                    onUpdateSettings({ equalizer: eq })
                }
                lang={lang}
                t={t}
            />
        </div>
    );
};
