import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconSearch, IconClose, IconCheck, IconChevronDown } from './Icons';

export interface SearchableFontPickerProps {
    value?: string;
    fonts: string[];
    defaultLabel: string;
    onChange: (font: string) => void;
    ariaLabel?: string;
    placeholder?: string;
}

export const SearchableFontPicker: React.FC<SearchableFontPickerProps> = ({
    value = 'system',
    fonts,
    defaultLabel,
    onChange,
    ariaLabel = 'Pilih Font',
    placeholder = 'Cari font sistem...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus search input on dropdown open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Handle click outside to close dropdown
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const filteredFonts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return fonts;
        return fonts.filter((f) => f.toLowerCase().includes(q));
    }, [fonts, searchQuery]);

    const isSystemSelected = !value || value === 'system';
    const showSystemOption =
        !searchQuery.trim() ||
        defaultLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        'system'.includes(searchQuery.toLowerCase());

    const handleSelect = (font: string) => {
        onChange(font);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            {/* Dropdown Trigger Button */}
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
                onClick={() => setIsOpen((prev) => !prev)}
                className="mac-input px-3 py-1.5 rounded-[7px] text-[12px] w-64 cursor-pointer flex items-center justify-between gap-2 text-left hover:border-accent/40 transition shadow-sm"
            >
                <span
                    className="truncate flex-1 font-medium"
                    style={{
                        fontFamily: isSystemSelected
                            ? 'var(--app-font-family)'
                            : `"${value}", sans-serif`
                    }}
                >
                    {isSystemSelected ? defaultLabel : value}
                </span>
                <span
                    className={`text-secondary transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                >
                    <IconChevronDown size={14} />
                </span>
            </button>

            {/* Dropdown Menu Panel */}
            {isOpen && (
                <div
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute right-0 top-full mt-1.5 w-72 z-50 mac-modal-surface rounded-xl shadow-2xl border border-white/10 p-2 text-xs flex flex-col gap-1.5 backdrop-blur-xl animate-scale-enter"
                >
                    {/* Search Input Box */}
                    <div className="relative flex items-center px-2 py-1 rounded-[7px] bg-white/5 border border-white/10 focus-within:border-accent/60 transition">
                        <span className="text-secondary shrink-0 mr-1.5">
                            <IconSearch size={13} />
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-transparent border-0 p-0 text-[11px] focus:outline-none placeholder:text-secondary/60"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-secondary hover:text-current ml-1 shrink-0 p-0.5 rounded cursor-pointer"
                                aria-label="Clear search"
                            >
                                <IconClose size={11} />
                            </button>
                        )}
                    </div>

                    {/* Font Count Status */}
                    <div className="flex items-center justify-between px-1.5 text-[10px] text-secondary tabular-nums">
                        <span>
                            {filteredFonts.length + (showSystemOption ? 1 : 0)}{' '}
                            font ditemukan
                        </span>
                        {isSystemSelected ? (
                            <span className="text-accent font-medium">
                                Sistem
                            </span>
                        ) : (
                            <span className="truncate max-w-[120px] font-medium text-accent">
                                {value}
                            </span>
                        )}
                    </div>

                    {/* Scrollable Font List */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                        {/* System Default Option */}
                        {showSystemOption && (
                            <button
                                type="button"
                                role="option"
                                aria-selected={isSystemSelected}
                                onClick={() => handleSelect('system')}
                                className={`w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer transition ${
                                    isSystemSelected
                                        ? 'bg-accent text-white font-semibold'
                                        : 'mac-row hover:bg-white/10 text-secondary hover:text-current'
                                }`}
                            >
                                <span className="truncate text-[12px]">
                                    {defaultLabel}
                                </span>
                                {isSystemSelected && <IconCheck size={14} />}
                            </button>
                        )}

                        {/* Filtered System Fonts List */}
                        {filteredFonts.map((fontName) => {
                            const isSelected = value === fontName;
                            return (
                                <button
                                    key={fontName}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(fontName)}
                                    className={`w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-accent text-white font-semibold'
                                            : 'mac-row hover:bg-white/10 text-secondary hover:text-current'
                                    }`}
                                >
                                    <span
                                        className="truncate text-[12px]"
                                        style={{
                                            fontFamily: `"${fontName}", sans-serif`
                                        }}
                                    >
                                        {fontName}
                                    </span>
                                    {isSelected && <IconCheck size={14} />}
                                </button>
                            );
                        })}

                        {filteredFonts.length === 0 && !showSystemOption && (
                            <div className="py-4 text-center text-secondary text-[11px]">
                                Tidak ada font yang cocok
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
