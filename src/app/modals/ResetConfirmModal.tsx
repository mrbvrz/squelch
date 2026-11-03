import React from 'react';
import { IconWarning, IconSpinner } from '../../components/Icons';

export interface ResetConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    cancelBtnText: string;
    confirmBtnText: string;
    isPending?: boolean;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    cancelBtnText,
    confirmBtnText,
    isPending = false
}) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            onClick={isPending ? undefined : onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50 animate-fade-in"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="mac-modal-surface w-full max-w-md p-6 space-y-4 text-xs"
            >
                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-[9px] bg-[#FF453A]/20 text-[#FF453A] flex items-center justify-center shrink-0">
                        <IconWarning size={20} />
                    </div>
                    <div>
                        <h3
                            id="reset-modal-title"
                            className="text-[15px] font-bold"
                        >
                            {title}
                        </h3>
                        <p className="text-[12px] text-secondary leading-relaxed mt-1">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onClose}
                        className="mac-glass-pill disabled:opacity-50 disabled:cursor-not-allowed px-4 h-[30px] rounded-[7px] text-[12px] font-medium cursor-pointer flex items-center justify-center transition"
                    >
                        {cancelBtnText}
                    </button>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={onConfirm}
                        className="bg-[#FF453A] hover:bg-[#D70015] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 h-[30px] rounded-[7px] text-[12px] font-semibold shadow-sm cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                        {isPending && (
                            <IconSpinner size={13} className="animate-spin" />
                        )}
                        {confirmBtnText}
                    </button>
                </div>
            </div>
        </div>
    );
};
