import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconChevronDown, IconCheck } from './Icons';

export interface MacSelectOption<T extends string = string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

export interface MacSelectProps<T extends string = string> {
    value: T;
    onChange: (value: T) => void;
    options: MacSelectOption<T>[];
    ariaLabel?: string;
    widthClass?: string;
    className?: string;
    align?: 'left' | 'right';
}

export const MacSelect = <T extends string = string>({
    value,
    onChange,
    options,
    ariaLabel,
    widthClass = 'w-[200px]',
    className = '',
    align = 'right'
}: MacSelectProps<T>): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Keyboard navigation (Escape, ArrowDown, ArrowUp, Enter)
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                return;
            }

            if (!isOpen) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setIsOpen(true);
                    setFocusedIndex(options.findIndex((o) => o.value === value));
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < options.length) {
                    onChange(options[focusedIndex].value);
                    setIsOpen(false);
                }
            }
        },
        [isOpen, focusedIndex, options, value, onChange]
    );

    return (
        <div
            ref={containerRef}
            className={`relative inline-block text-left shrink-0 ${isOpen ? 'z-50' : 'z-20'}`}
            onKeyDown={handleKeyDown}
        >
            {/* Trigger Button - perfectly matches Mac control buttons (h-[30px], rounded-[7px]) */}
            <button
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    setFocusedIndex(options.findIndex((o) => o.value === value));
                }}
                className={`mac-glass-pill ${widthClass} h-[30px] px-3 rounded-[7px] text-[12px] font-medium flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-sm select-none shrink-0 ${className}`}
            >
                <span className="truncate flex items-center gap-1.5 font-medium text-foreground">
                    {selectedOption?.icon}
                    <span className="truncate">{selectedOption?.label}</span>
                </span>
                <IconChevronDown
                    size={12}
                    className={`text-secondary shrink-0 transition-transform duration-150 ml-1.5 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Menu Panel */}
            {isOpen && (
                <div
                    role="listbox"
                    aria-label={ariaLabel}
                    className={`absolute ${
                        align === 'right' ? 'right-0' : 'left-0'
                    } top-full mt-1.5 ${widthClass} z-50 mac-modal-surface rounded-[8px] shadow-2xl p-1 text-[12px] border border-card-border backdrop-blur-xl animate-scale-enter overflow-hidden`}
                >
                    {options.map((opt, index) => {
                        const isSelected = opt.value === value;
                        const isFocused = index === focusedIndex;
                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={`px-2.5 py-1.5 rounded-[5px] flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                                    isSelected
                                        ? 'bg-accent text-white font-medium shadow-xs'
                                        : isFocused
                                          ? 'bg-black/5 dark:bg-white/10 text-foreground'
                                          : 'text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-1.5 truncate">
                                    {opt.icon}
                                    <span className="truncate">{opt.label}</span>
                                </span>
                                {isSelected && (
                                    <IconCheck size={13} className="shrink-0 text-white" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
