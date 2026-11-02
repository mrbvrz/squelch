import React, { useMemo, useEffect } from 'react';
import type { Station, StreamType, StreamTestResult } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import { StationAvatar } from '../../components/StationAvatar';
import { IconClose, IconLock } from '../../components/Icons';
import { detectStreamTypeFromUrl } from '../../utils/stream';

export interface StationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    editingStation: Station | null;
    formName: string;
    setFormName: (v: string) => void;
    formUrl: string;
    setFormUrl: (v: string) => void;
    formGroup: string;
    setFormGroup: (v: string) => void;
    formGenre: string;
    setFormGenre: (v: string) => void;
    formCity: string;
    setFormCity: (v: string) => void;
    formType: StreamType;
    setFormType: (v: StreamType) => void;
    formLogo: string;
    setFormLogo: (v: string) => void;
    formTags: string;
    setFormTags: (v: string) => void;
    groups: string[];
    onTestStream: () => void;
    isTestingStream: boolean;
    testResult: StreamTestResult | null;
    onResolveLogo: (url: string) => Promise<string | null>;
    t: TranslationDictionary;
}

export const StationModal: React.FC<StationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingStation,
    formName,
    setFormName,
    formUrl,
    setFormUrl,
    formGroup,
    setFormGroup,
    formGenre,
    setFormGenre,
    formCity,
    setFormCity,
    formType,
    setFormType,
    formLogo,
    setFormLogo,
    formTags,
    setFormTags,
    groups,
    onTestStream,
    isTestingStream,
    testResult,
    onResolveLogo,
    t
}) => {
    const detectedType = useMemo(
        () => detectStreamTypeFromUrl(formUrl),
        [formUrl]
    );
    const isLocked = Boolean(detectedType);

    useEffect(() => {
        if (detectedType) {
            setFormType(detectedType);
        }
    }, [detectedType, setFormType]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="station-modal-title"
            onClick={onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
        >
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={onSave}
                className="mac-modal-surface w-full max-w-lg p-6 space-y-4 text-xs"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <StationAvatar
                            logoUrl={formLogo || null}
                            size="sm"
                            accentFallback
                            onResolveLogo={onResolveLogo}
                        />
                        <div>
                            <h3
                                id="station-modal-title"
                                className="text-[15px] font-bold"
                            >
                                {editingStation
                                    ? t.modalEditTitle
                                    : t.modalAddTitle}
                            </h3>
                            {editingStation && (
                                <div className="text-[11px] text-secondary">
                                    ID: {editingStation.id}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label={t.cancelBtn}
                        onClick={onClose}
                        className="mac-glass-pill w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer"
                    >
                        <IconClose size={14} />
                    </button>
                </div>

                <div>
                    <label className="block font-semibold mb-1.5">
                        {t.fieldUrl}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            required
                            value={formUrl}
                            onChange={(e) => setFormUrl(e.target.value)}
                            placeholder="https://... or https://open.noice.id/catalog/..."
                            className="mac-input flex-1 px-3 h-[30px] rounded-[7px]"
                        />
                        <button
                            type="button"
                            onClick={onTestStream}
                            disabled={isTestingStream}
                            className="mac-glass-pill px-3.5 h-[30px] rounded-[7px] font-semibold shrink-0 cursor-pointer flex items-center justify-center text-[12px]"
                        >
                            {isTestingStream
                                ? t.testingStream
                                : t.testStreamBtn}
                        </button>
                    </div>
                    {testResult && (
                        <div
                            className={`mt-2 p-2.5 rounded-[7px] text-[11px] font-medium tabular-nums ${
                                testResult.ok
                                    ? 'bg-[#30D158]/15 border border-[#30D158]/40 text-[#30D158]'
                                    : 'bg-[#FF453A]/15 border border-[#FF453A]/40 text-[#FF453A]'
                            }`}
                        >
                            {testResult.ok
                                ? `${t.testOkPrefix}: ${testResult.streamType.toUpperCase()} (${testResult.contentType}, ${testResult.latencyMs} ms)`
                                : `${t.testFailPrefix}: ${testResult.errorReason}`}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.fieldName}
                        </label>
                        <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.fieldGroup}
                        </label>
                        <input
                            type="text"
                            list="group-options"
                            value={formGroup}
                            onChange={(e) => setFormGroup(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                        />
                        <datalist id="group-options">
                            {groups.map((g) => (
                                <option key={g} value={g} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <div className="flex items-center mb-1.5 h-[16px]">
                            <label className="block font-semibold">
                                {t.fieldGenre}
                            </label>
                        </div>
                        <input
                            type="text"
                            value={formGenre}
                            onChange={(e) => setFormGenre(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                        />
                    </div>
                    <div>
                        <div className="flex items-center mb-1.5 h-[16px]">
                            <label className="block font-semibold">
                                {t.fieldCity}
                            </label>
                        </div>
                        <input
                            type="text"
                            value={formCity}
                            onChange={(e) => setFormCity(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1.5 h-[16px]">
                            <label className="block font-semibold">
                                {t.colType}
                            </label>
                            {isLocked && (
                                <span
                                    className="text-[10px] text-accent font-medium flex items-center gap-1 select-none"
                                    title="Tipe aliran otomatis terkunci berdasarkan ekstensi URL"
                                >
                                    <IconLock size={10} />
                                    <span>{t.typeAutoLocked}</span>
                                </span>
                            )}
                        </div>
                        <select
                            value={
                                isLocked && detectedType
                                    ? detectedType
                                    : formType
                            }
                            disabled={isLocked}
                            onChange={(e) =>
                                setFormType(e.target.value as StreamType)
                            }
                            className="mac-input w-full px-2.5 h-[30px] rounded-[7px] uppercase disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition"
                        >
                            <option value="mp3">MP3</option>
                            <option value="aac">AAC / AAC+</option>
                            <option value="ogg">OGG / Opus</option>
                            <option value="hls">HLS (.m3u8)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block font-semibold mb-1.5">
                        {t.fieldLogo}
                    </label>
                    <input
                        type="text"
                        value={formLogo}
                        onChange={(e) => setFormLogo(e.target.value)}
                        placeholder="https://.../favicon.ico or .png"
                        className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-1.5">
                        {t.fieldTags}
                    </label>
                    <input
                        type="text"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        placeholder="pop, news, jakarta"
                        className="mac-input w-full px-3 h-[30px] rounded-[7px]"
                    />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mac-glass-pill px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer flex items-center justify-center"
                    >
                        {t.cancelBtn}
                    </button>
                    <button
                        type="submit"
                        className="bg-accent hover:opacity-90 text-white px-5 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition flex items-center justify-center"
                    >
                        {t.saveBtn}
                    </button>
                </div>
            </form>
        </div>
    );
};
