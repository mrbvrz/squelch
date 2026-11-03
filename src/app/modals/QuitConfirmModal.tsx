import React from 'react';
import { SquircleAppIcon } from '../../components/SquircleAppIcon';

export interface QuitConfirmModalProps {
    isOpen: boolean;
    isStandalone?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    appIconDataUrl: string | null;
    language?: 'en' | 'id';
    cancelBtnText?: string;
}

export const QuitConfirmModal: React.FC<QuitConfirmModalProps> = ({
    isOpen,
    isStandalone = false,
    onClose,
    onConfirm,
    appIconDataUrl,
    language = 'en',
    cancelBtnText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const backdropClass = isStandalone
        ? 'fixed inset-0 flex items-center justify-center p-3 z-50 bg-transparent'
        : 'fixed inset-0 mac-modal-backdrop flex items-center justify-center p-3 z-50 animate-fade-in';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-modal-title"
            onClick={onClose}
            className={backdropClass}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                data-tauri-drag-region
                className="mac-modal-surface w-full max-w-[320px] p-5 space-y-3.5 text-xs flex flex-col items-center text-center shadow-2xl animate-scale-up"
            >
                <SquircleAppIcon dataUrl={appIconDataUrl} size={52} />
                <div>
                    <h3
                        id="quit-modal-title"
                        className="text-[15px] font-bold text-foreground"
                    >
                        {language === 'en'
                            ? 'Quit Squelch?'
                            : 'Keluar dari Squelch?'}
                    </h3>
                    <p className="text-[11.5px] text-secondary leading-normal mt-1.5 max-w-[250px] mx-auto">
                        {language === 'en'
                            ? 'Active radio playback in the menu bar will be stopped.'
                            : 'Pemutaran siaran radio di menu bar akan dihentikan.'}
                    </p>
                </div>

                <div className="w-full flex items-center justify-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mac-glass-pill flex-1 py-1.5 px-3 rounded-[7px] text-[12px] font-medium cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        {cancelBtnText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 bg-[#FF453A] hover:bg-[#D70015] text-white py-1.5 px-3 rounded-[7px] text-[12px] font-medium shadow-sm cursor-pointer transition"
                    >
                        {language === 'en' ? 'Quit' : 'Keluar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
