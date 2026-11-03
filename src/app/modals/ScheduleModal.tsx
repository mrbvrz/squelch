import React, { useRef, useEffect } from 'react';
import type { ShowSchedule, Station } from '../../types';
import type { TranslationDictionary } from '../../i18n';
import { IconCalendar, IconClose } from '../../components/Icons';
import { MacToggle } from '../../components/MacToggle';
import { MacSelect } from '../../components/MacSelect';
import { markdownToHtml, htmlToMarkdown } from '../../utils/text-format';
import { DayPickerRow, type DayLabelItem } from './schedule/DayPickerRow';
import { StationPickerDropdown } from './schedule/StationPickerDropdown';

export type { DayLabelItem };

export interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    editingSchedule: ShowSchedule | null;
    stations: Station[];
    schedStationId: string;
    setSchedStationId: (v: string) => void;
    schedShowName: string;
    setSchedShowName: (v: string) => void;
    schedHost: string;
    setSchedHost: (v: string) => void;
    schedDays: number[];
    setSchedDays: (v: number[]) => void;
    schedStartTime: string;
    setSchedStartTime: (v: string) => void;
    schedEndTime: string;
    setSchedEndTime: (v: string) => void;
    schedAutoPlay: boolean;
    setSchedAutoPlay: (v: boolean) => void;
    schedReminderMinutes: number;
    setSchedReminderMinutes: (v: number) => void;
    schedNotes: string;
    setSchedNotes: (v: string) => void;
    dayLabels: DayLabelItem[];
    lang: string;
    t: TranslationDictionary;
    onResolveLogo?: (url: string) => Promise<string | null>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingSchedule,
    stations,
    schedStationId,
    setSchedStationId,
    schedShowName,
    setSchedShowName,
    schedHost,
    setSchedHost,
    schedDays,
    setSchedDays,
    schedStartTime,
    setSchedStartTime,
    schedEndTime,
    setSchedEndTime,
    schedAutoPlay,
    setSchedAutoPlay,
    schedReminderMinutes,
    setSchedReminderMinutes,
    schedNotes,
    setSchedNotes,
    dayLabels,
    lang,
    t,
    onResolveLogo
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    // Sync external schedNotes to contentEditable HTML
    useEffect(() => {
        if (!editorRef.current) return;
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const targetHtml = markdownToHtml(schedNotes);
        if (editorRef.current.innerHTML !== targetHtml) {
            editorRef.current.innerHTML = targetHtml;
        }
    }, [schedNotes, isOpen]);

    const handleEditorInput = () => {
        if (!editorRef.current) return;
        isInternalUpdate.current = true;
        const md = htmlToMarkdown(editorRef.current.innerHTML);
        setSchedNotes(md);
    };

    const execEditorCommand = (
        command: string,
        value: string | undefined = undefined
    ) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        handleEditorInput();
    };

    const handleInsertCode = () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const selectedText =
            range.toString() || (lang === 'id' ? 'kode' : 'code');
        const codeNode = document.createElement('code');
        codeNode.className =
            'px-1 py-0.5 rounded bg-black/10 dark:bg-white/15 font-mono text-[10px] text-accent';
        codeNode.textContent = selectedText;
        range.deleteContents();
        range.insertNode(codeNode);
        sel.selectAllChildren(codeNode);
        handleEditorInput();
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const isMod = e.metaKey || e.ctrlKey;
        if (isMod && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            execEditorCommand('bold');
        } else if (isMod && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault();
            execEditorCommand('italic');
        } else if (isMod && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            execEditorCommand('strikeThrough');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
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
                        <div className="w-8 h-8 rounded-[8px] bg-accent text-white flex items-center justify-center shrink-0">
                            <IconCalendar size={18} />
                        </div>
                        <h3
                            id="schedule-modal-title"
                            className="text-[15px] font-bold"
                        >
                            {editingSchedule
                                ? t.modalEditScheduleTitle
                                : t.modalAddScheduleTitle}
                        </h3>
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

                {/* Station Selector with Images */}
                <StationPickerDropdown
                    stations={stations}
                    schedStationId={schedStationId}
                    setSchedStationId={setSchedStationId}
                    label={t.scheduleStation}
                    lang={lang}
                    onResolveLogo={onResolveLogo}
                />

                {/* Show Name and Host */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleShowName}
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Sarapan Seru"
                            value={schedShowName}
                            onChange={(e) => setSchedShowName(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px] text-xs"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleHost}
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Surya Insomnia & Molan"
                            value={schedHost}
                            onChange={(e) => setSchedHost(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px] text-xs"
                        />
                    </div>
                </div>

                {/* Days of Week Selection */}
                <DayPickerRow
                    schedDays={schedDays}
                    setSchedDays={setSchedDays}
                    dayLabels={dayLabels}
                    lang={lang}
                    t={t}
                />

                {/* Time Window */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleStartTime}
                        </label>
                        <input
                            type="time"
                            required
                            value={schedStartTime}
                            onChange={(e) => setSchedStartTime(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px] font-mono text-[12px]"
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1.5">
                            {t.scheduleEndTime}
                        </label>
                        <input
                            type="time"
                            required
                            value={schedEndTime}
                            onChange={(e) => setSchedEndTime(e.target.value)}
                            className="mac-input w-full px-3 h-[30px] rounded-[7px] font-mono text-[12px]"
                        />
                    </div>
                </div>

                {/* Autoplay & Reminder Setting */}
                <div className="p-3 rounded-[8px] bg-black/5 dark:bg-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold text-[13px]">
                                {t.scheduleAutoPlay}
                            </div>
                            <div className="text-[11px] text-secondary mt-0.5">
                                {t.scheduleAutoPlayDesc}
                            </div>
                        </div>
                        <MacToggle
                            checked={schedAutoPlay}
                            onChange={setSchedAutoPlay}
                            label={t.scheduleAutoPlay}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="font-semibold text-[12px]">
                            {t.scheduleReminder}
                        </span>
                        <MacSelect
                            value={String(schedReminderMinutes)}
                            ariaLabel={t.scheduleReminder}
                            onChange={(val) =>
                                setSchedReminderMinutes(parseInt(val, 10))
                            }
                            options={[
                                {
                                    value: '0',
                                    label: t.scheduleReminderAtStart
                                },
                                { value: '5', label: t.scheduleReminder5m },
                                { value: '10', label: t.scheduleReminder10m }
                            ]}
                            widthClass="w-[200px]"
                        />
                    </div>
                </div>

                {/* Notes & Description with Integrated Toolbar (Live Editable Preview) */}
                <div>
                    <label className="block font-semibold mb-1.5 text-foreground">
                        {t.scheduleNotes}
                    </label>
                    <div className="mac-input rounded-[8px] overflow-hidden focus-within:border-accent/60 transition shadow-sm flex flex-col">
                        {/* Integrated Toolbar inside Textarea box */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 select-none">
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    title="Tebal (⌘B / Ctrl+B)"
                                    onClick={() => execEditorCommand('bold')}
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center font-bold text-[12px] hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-foreground transition cursor-pointer"
                                >
                                    B
                                </button>
                                <button
                                    type="button"
                                    title="Miring (⌘I / Ctrl+I)"
                                    onClick={() => execEditorCommand('italic')}
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center italic font-serif text-[12px] hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-foreground transition cursor-pointer"
                                >
                                    I
                                </button>
                                <button
                                    type="button"
                                    title="Coret"
                                    onClick={() =>
                                        execEditorCommand('strikeThrough')
                                    }
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center line-through text-[12px] hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-foreground transition cursor-pointer"
                                >
                                    S
                                </button>
                                <span className="text-secondary/30 text-[10px] mx-1">
                                    |
                                </span>
                                <button
                                    type="button"
                                    title="Daftar Butir"
                                    onClick={() =>
                                        execEditorCommand('insertUnorderedList')
                                    }
                                    className="px-1.5 h-6 rounded-[5px] flex items-center gap-1 text-[11px] hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-foreground transition cursor-pointer"
                                >
                                    • List
                                </button>
                                <button
                                    type="button"
                                    title="Kode"
                                    onClick={handleInsertCode}
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center font-mono text-[11px] hover:bg-black/10 dark:hover:bg-white/10 text-secondary hover:text-foreground transition cursor-pointer"
                                >
                                    {'</>'}
                                </button>
                            </div>
                            <span className="text-[10px] text-secondary/60">
                                {lang === 'id'
                                    ? 'Format Langsung'
                                    : 'Live Preview'}
                            </span>
                        </div>

                        {/* Direct Editable WYSIWYG Surface */}
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            onKeyDown={handleEditorKeyDown}
                            data-placeholder={
                                lang === 'id'
                                    ? 'Tulis catatan, deskripsi acara, bintang tamu, dll...'
                                    : 'Enter notes, show description, guest stars, etc...'
                            }
                            className="min-h-[76px] max-h-44 overflow-y-auto px-3 py-2 text-[12px] text-foreground focus:outline-none leading-relaxed select-text [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_del]:line-through [&_del]:opacity-70 [&_s]:line-through [&_strike]:line-through [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/10 dark:[&_code]:bg-white/15 [&_code]:font-mono [&_code]:text-[10px] [&_code]:text-accent [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-0.5 empty:before:content-[attr(data-placeholder)] empty:before:text-secondary/50 empty:before:pointer-events-none cursor-text"
                        />
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-2 pt-2">
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
