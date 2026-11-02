import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { RadioBrowserCountry } from '../types';
import { IconSearch, IconClose, IconCheck, IconChevronDown } from './Icons';
import { countryCodeToFlag, getFriendlyCountryName } from '../utils/appearance';

export interface SearchableCountryPickerProps {
    value?: string;
    countries: RadioBrowserCountry[];
    onChange: (countryCode: string) => void;
    ariaLabel?: string;
    placeholder?: string;
    globalLabel?: string;
    foundLabel?: string;
    noMatchLabel?: string;
    className?: string;
}

const INITIAL_BATCH_SIZE = 40;
const SCROLL_BATCH_STEP = 40;

export const SearchableCountryPicker: React.FC<
    SearchableCountryPickerProps
> = ({
    value = '',
    countries,
    onChange,
    ariaLabel = 'Pilih Negara',
    placeholder = 'Cari negara...',
    globalLabel = 'Global (Semua Negara)',
    foundLabel = 'negara ditemukan',
    noMatchLabel = 'Tidak ada negara yang cocok',
    className = 'w-44 sm:w-48'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Auto-focus search input when opened
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

    // Reset visible batch count when search query changes
    useEffect(() => {
        setVisibleCount(INITIAL_BATCH_SIZE);
        if (listContainerRef.current) {
            listContainerRef.current.scrollTop = 0;
        }
    }, [searchQuery]);

    // Close on click outside & escape key
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

    // Normalizing country list with friendly names & flags
    const normalizedCountries = useMemo(() => {
        return countries.map((c) => {
            const cleanCode = (c.code || '').trim().toUpperCase();
            const friendlyName = getFriendlyCountryName(cleanCode, c.name);
            const flag = c.flag || countryCodeToFlag(cleanCode) || '🌐';
            return {
                ...c,
                code: cleanCode,
                name: friendlyName,
                flag
            };
        });
    }, [countries]);

    // Selected country info
    const selectedCountry = useMemo(() => {
        if (!value) return null;
        const upper = value.trim().toUpperCase();
        return (
            normalizedCountries.find((c) => c.code === upper) || {
                code: upper,
                name: getFriendlyCountryName(upper),
                flag: countryCodeToFlag(upper) || '🌐',
                stationCount: 0
            }
        );
    }, [value, normalizedCountries]);

    const isGlobalSelected = !value;

    // Filtered countries based on search query
    const filteredCountries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return normalizedCountries;
        return normalizedCountries.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.code.toLowerCase().includes(q)
        );
    }, [normalizedCountries, searchQuery]);

    const showGlobalOption =
        !searchQuery.trim() ||
        globalLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        'global'.includes(searchQuery.toLowerCase()) ||
        'semua'.includes(searchQuery.toLowerCase()) ||
        'all'.includes(searchQuery.toLowerCase());

    const totalMatchingCount =
        filteredCountries.length + (showGlobalOption ? 1 : 0);

    const visibleCountries = useMemo(() => {
        return filteredCountries.slice(0, visibleCount);
    }, [filteredCountries, visibleCount]);

    const handleSelect = (countryCode: string) => {
        onChange(countryCode);
        setIsOpen(false);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            setVisibleCount((prev) =>
                Math.min(prev + SCROLL_BATCH_STEP, filteredCountries.length)
            );
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative inline-block text-left shrink-0 ${isOpen ? 'z-50' : 'z-20'} ${className}`}
        >
            {/* Dropdown Trigger Button */}
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel}
                onClick={() => setIsOpen((prev) => !prev)}
                className="mac-input px-3 h-[30px] rounded-[7px] text-xs w-full cursor-pointer flex items-center justify-between gap-1.5 text-left hover:border-accent/40 transition shadow-sm"
            >
                <span className="truncate flex-1 font-medium flex items-center gap-1.5">
                    {isGlobalSelected ? (
                        <>
                            <span className="text-[13px] shrink-0">🌐</span>
                            <span className="truncate">{globalLabel}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-[13px] shrink-0">
                                {selectedCountry?.flag}
                            </span>
                            <span className="truncate">
                                {selectedCountry?.name}
                            </span>
                        </>
                    )}
                </span>
                <span
                    className={`text-secondary shrink-0 transition-transform duration-150 ${
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
                    className="absolute left-0 top-full mt-1.5 w-64 z-[100] mac-modal-surface rounded-xl shadow-2xl p-2.5 text-xs flex flex-col gap-2 backdrop-blur-xl animate-scale-enter"
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

                    {/* Status Bar: Count and Selected Country */}
                    <div className="flex items-center justify-between px-2 py-1 rounded-[6px] bg-black/5 dark:bg-white/5 text-[10px] tabular-nums">
                        <div className="flex items-center gap-1 text-secondary">
                            <span className="font-medium text-foreground">
                                {totalMatchingCount}
                            </span>
                            <span>{foundLabel}</span>
                        </div>
                        <span
                            className="font-medium text-accent truncate max-w-[130px] text-right"
                            title={
                                isGlobalSelected
                                    ? globalLabel
                                    : selectedCountry?.name
                            }
                        >
                            {isGlobalSelected
                                ? '🌐 Global'
                                : `${selectedCountry?.flag || ''} ${selectedCountry?.name || ''}`.trim()}
                        </span>
                    </div>

                    {/* Scrollable Countries List */}
                    <div
                        ref={listContainerRef}
                        onScroll={handleScroll}
                        className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5"
                    >
                        {/* Pinned Selected Country (if country selected & no active search) */}
                        {!isGlobalSelected &&
                            !searchQuery.trim() &&
                            selectedCountry && (
                                <div className="mb-1 pb-1 border-b border-black/5 dark:border-white/10">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={true}
                                        onClick={() =>
                                            handleSelect(selectedCountry.code)
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer bg-accent text-white font-medium transition shadow-xs"
                                    >
                                        <span className="truncate text-[12px] flex items-center gap-2">
                                            <span className="text-[14px] shrink-0">
                                                {selectedCountry.flag}
                                            </span>
                                            <span className="truncate">
                                                {selectedCountry.name}
                                            </span>
                                        </span>
                                        <IconCheck
                                            size={14}
                                            className="shrink-0 ml-1.5"
                                        />
                                    </button>
                                </div>
                            )}

                        {/* Global / All Countries Option */}
                        {showGlobalOption && (
                            <button
                                type="button"
                                role="option"
                                aria-selected={isGlobalSelected}
                                onClick={() => handleSelect('')}
                                className={`w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer transition ${
                                    isGlobalSelected
                                        ? 'bg-accent text-white font-semibold shadow-xs'
                                        : 'mac-row text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="truncate text-[12px] flex items-center gap-2">
                                    <span className="text-[14px] shrink-0">
                                        🌐
                                    </span>
                                    <span className="truncate">
                                        {globalLabel}
                                    </span>
                                </span>
                                {isGlobalSelected && (
                                    <IconCheck
                                        size={14}
                                        className="shrink-0 ml-1.5"
                                    />
                                )}
                            </button>
                        )}

                        {/* Progressive Country List */}
                        {visibleCountries.map((c) => {
                            const isSelected =
                                value.trim().toUpperCase() === c.code;
                            return (
                                <button
                                    key={c.code}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(c.code)}
                                    className={`w-full px-2.5 py-1.5 rounded-[6px] text-left flex items-center justify-between cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-accent text-white font-semibold shadow-xs'
                                            : 'mac-row text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span className="truncate text-[12px] flex items-center gap-2">
                                        <span className="text-[14px] shrink-0">
                                            {c.flag}
                                        </span>
                                        <span className="truncate">
                                            {c.name}
                                        </span>
                                    </span>
                                    {isSelected && (
                                        <IconCheck
                                            size={14}
                                            className="shrink-0 ml-1.5"
                                        />
                                    )}
                                </button>
                            );
                        })}

                        {filteredCountries.length === 0 &&
                            !showGlobalOption && (
                                <div className="py-6 text-center text-secondary text-[11px]">
                                    {noMatchLabel}
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};
