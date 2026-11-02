import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    IconSearch,
    IconClose,
    IconCheck,
    IconChevronDown,
    IconSpinner
} from './Icons';

export interface SearchableFontPickerProps {
    value?: string;
    fonts: string[];
    defaultLabel: string;
    onChange: (font: string) => void;
    ariaLabel?: string;
    placeholder?: string;
    isLoading?: boolean;
    foundLabel?: string;
    selectedLabel?: string;
    loadingLabel?: string;
    noMatchLabel?: string;
}

const INITIAL_BATCH_SIZE = 40;
const SCROLL_BATCH_STEP = 40;

export const SearchableFontPicker: React.FC<SearchableFontPickerProps> = ({
    value = 'system',
    fonts,
    defaultLabel,
    onChange,
    ariaLabel = 'Pilih Font',
    placeholder = 'Cari font sistem...',
    isLoading = false,
    foundLabel = 'font ditemukan',
    selectedLabel: _selectedLabel,
    loadingLabel = 'Memuat font sistem...',
    noMatchLabel = 'Tidak ada font yang cocok'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Auto-focus search input with requestAnimationFrame for instant response
    useEffect(() => {
        if (isOpen) {
            setVisibleCount(INITIAL_BATCH_SIZE);
            requestAnimationFrame(() => {
                searchInputRef.current?.focus();
            });
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Reset visible count when search query changes
    useEffect(() => {
        setVisibleCount(INITIAL_BATCH_SIZE);
        if (listContainerRef.current) {
            listContainerRef.current.scrollTop = 0;
        }
    }, [searchQuery]);

    // Handle click outside & escape key to close dropdown
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

    const totalMatchingCount =
        filteredFonts.length + (showSystemOption ? 1 : 0);

    const visibleFonts = useMemo(() => {
        return filteredFonts.slice(0, visibleCount);
    }, [filteredFonts, visibleCount]);

    const handleSelect = (font: string) => {
        onChange(font);
        setIsOpen(false);
    };

    // Lazy load next batch on scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            setVisibleCount((prev) =>
                Math.min(prev + SCROLL_BATCH_STEP, filteredFonts.length)
            );
        }
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
                className="mac-input px-3 rounded-[7px] text-[12px] w-48 h-[30px] cursor-pointer flex items-center justify-between gap-2 text-left hover:border-accent/40 transition shadow-sm"
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
                    className="absolute right-0 top-full mt-1.5 w-64 z-50 mac-modal-surface rounded-xl shadow-2xl p-2.5 text-xs flex flex-col gap-2 backdrop-blur-xl animate-scale-enter"
                >
                    {/* Search Input Box */}
                    <div className="relative flex items-center px-2 py-1 rounded-[7px] mac-input focus-within:border-accent/60 transition">
                        <span className="text-secondary shrink-0 mr-1.5">
                            <IconSearch size={13} />
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-transparent border-0 p-0 text-[11px] text-foreground focus:outline-none placeholder:text-secondary/60"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-secondary hover:text-foreground ml-1 shrink-0 p-0.5 rounded cursor-pointer"
                                aria-label="Clear search"
                            >
                                <IconClose size={11} />
                            </button>
                        )}
                    </div>

                    {/* Status Bar: Count and Selected Font */}
                    <div className="flex items-center justify-between px-2 py-1 rounded-[6px] bg-black/5 dark:bg-white/5 text-[10px] tabular-nums">
                        <div className="flex items-center gap-1 text-secondary">
                            <span className="font-medium text-foreground">
                                {isLoading ? '...' : totalMatchingCount}
                            </span>
                            <span>{foundLabel}</span>
                        </div>
                        <span
                            className="font-medium text-accent truncate max-w-[130px] text-right"
                            title={isSystemSelected ? defaultLabel : value}
                        >
                            {isSystemSelected ? defaultLabel : value}
                        </span>
                    </div>

                    {/* Dropdown Content Area */}
                    {isLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-secondary">
                            <IconSpinner
                                size={20}
                                className="animate-spin text-accent"
                            />
                            <span className="text-[12px] font-medium text-foreground">
                                {loadingLabel}
                            </span>
                            <span className="text-[10px] text-secondary">
                                Memindai font sistem...
                            </span>
                        </div>
                    ) : (
                        <div
                            ref={listContainerRef}
                            onScroll={handleScroll}
                            className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5"
                        >
                            {/* Pinned Selected Font (if custom font selected & no search) */}
                            {!isSystemSelected && !searchQuery.trim() && (
                                <div className="mb-1 pb-1 border-b border-black/5 dark:border-white/10">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={true}
                                        onClick={() => handleSelect(value)}
                                        className="w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer bg-accent text-white font-medium transition shadow-xs"
                                    >
                                        <span
                                            className="truncate text-[12px]"
                                            style={{
                                                fontFamily: `"${value}", sans-serif`
                                            }}
                                        >
                                            {value}
                                        </span>
                                        <IconCheck
                                            size={14}
                                            className="shrink-0"
                                        />
                                    </button>
                                </div>
                            )}

                            {/* System Default Option */}
                            {showSystemOption && (
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSystemSelected}
                                    onClick={() => handleSelect('system')}
                                    className={`w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer transition ${
                                        isSystemSelected
                                            ? 'bg-accent text-white font-semibold shadow-xs'
                                            : 'mac-row text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span className="truncate text-[12px]">
                                        {defaultLabel}
                                    </span>
                                    {isSystemSelected && (
                                        <IconCheck
                                            size={14}
                                            className="shrink-0"
                                        />
                                    )}
                                </button>
                            )}

                            {/* Progressive System Fonts List */}
                            {visibleFonts.map((fontName) => {
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
                                                ? 'bg-accent text-white font-semibold shadow-xs'
                                                : 'mac-row text-foreground hover:bg-black/5 dark:hover:bg-white/10'
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
                                        {isSelected && (
                                            <IconCheck
                                                size={14}
                                                className="shrink-0"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                            {filteredFonts.length === 0 &&
                                !showSystemOption && (
                                    <div className="py-6 text-center text-secondary text-[11px]">
                                        {noMatchLabel}
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
