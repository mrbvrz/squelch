import React, { useMemo, useState } from 'react';
import type {
    DiscoverStationItem,
    RadioBrowserCountry,
    Station
} from '../../types';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import { StationAvatar } from '../../components/StationAvatar';
import { SearchableCountryPicker } from '../../components/SearchableCountryPicker';
import { MacSelect } from '../../components/MacSelect';
import { countryCodeToFlag } from '../../utils/appearance';
import {
    IconCheck,
    IconCompass,
    IconPlay,
    IconPlus,
    IconSearch,
    IconSpinner,
    IconStop
} from '../../components/Icons';

export interface DiscoverTabProps {
    discCountry: string;
    setDiscCountry: (code: string) => void;
    handleCountryChange?: (country: string) => void;
    discCountries: RadioBrowserCountry[];
    discName: string;
    setDiscName: (name: string) => void;
    discTag: string;
    setDiscTag: (tag: string) => void;
    isSearchingOnline: boolean;
    discError: string | null;
    discResults: DiscoverStationItem[];
    stations: Station[];
    currentStation: Station | null;
    isPlaying: boolean;
    isBusy: boolean;
    handleDiscoverSearch: (e: React.FormEvent) => void;
    handleAddFromDiscover: (
        item: DiscoverStationItem,
        autoPlay?: boolean
    ) => Promise<void>;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
    discCountry,
    setDiscCountry,
    handleCountryChange,
    discCountries,
    discName,
    setDiscName,
    discTag,
    setDiscTag,
    isSearchingOnline,
    discError,
    discResults,
    stations,
    currentStation,
    isPlaying,
    isBusy,
    handleDiscoverSearch,
    handleAddFromDiscover,
    api,
    t
}) => {
    const [bitrateFilter, setBitrateFilter] = useState<string>('all');
    const [sortMode, setSortMode] = useState<string>('default');

    const displayedResults = useMemo(() => {
        let res = [...discResults];
        if (bitrateFilter !== 'all') {
            const minKbps = parseInt(bitrateFilter, 10);
            res = res.filter((item) => (item.bitrate || 0) >= minKbps);
        }
        if (sortMode === 'bitrate') {
            res.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        } else if (sortMode === 'name') {
            res.sort((a, b) => a.name.localeCompare(b.name));
        }
        return res;
    }, [discResults, bitrateFilter, sortMode]);

    return (
        <div
            key="tab-discover"
            className="max-w-3xl space-y-6 animate-tab-enter"
        >
            <form
                onSubmit={handleDiscoverSearch}
                className="mac-settings-card relative z-30"
            >
                <div className="p-4 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-[8px] bg-[#32ADE6] text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                        <IconCompass size={19} />
                    </div>
                    <div>
                        <div className="text-[13px] font-bold">
                            {t.discoverTitle}
                        </div>
                        <p className="text-[12px] text-secondary leading-relaxed mt-0.5">
                            {t.discoverSubtitle}
                        </p>
                    </div>
                </div>

                <div className="mx-4 border-t mac-divider" />

                {/* Inline Filter & Search Row: Country Dropdown, Name, Tag, and Search Button */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2 text-xs relative z-40">
                    <SearchableCountryPicker
                        value={discCountry}
                        countries={discCountries}
                        onChange={(newCountry) => {
                            setDiscCountry(newCountry);
                            if (handleCountryChange) {
                                handleCountryChange(newCountry);
                            }
                        }}
                        globalLabel={t.discoverGlobalFilter}
                        placeholder={t.discoverSearchCountryPlaceholder}
                        foundLabel={t.discoverCountriesFound}
                        noMatchLabel={t.discoverNoCountryMatch}
                        ariaLabel="Country Filter"
                        className="w-[200px] shrink-0"
                    />

                    <input
                        type="text"
                        value={discName}
                        onChange={(e) => setDiscName(e.target.value)}
                        placeholder={t.discoverName}
                        aria-label={t.discoverName}
                        className="mac-input px-3 h-[30px] text-xs rounded-[7px] flex-1 min-w-[110px]"
                    />

                    <input
                        type="text"
                        value={discTag}
                        onChange={(e) => setDiscTag(e.target.value)}
                        placeholder={t.discoverTag}
                        aria-label={t.discoverTag}
                        className="mac-input px-3 h-[30px] text-xs rounded-[7px] w-24 sm:w-28 shrink-0"
                    />

                    <button
                        type="submit"
                        disabled={isSearchingOnline}
                        className="bg-accent hover:opacity-90 disabled:opacity-60 text-white px-3.5 h-[30px] rounded-[7px] text-xs font-medium shadow-sm cursor-pointer transition shrink-0 flex items-center gap-1.5"
                    >
                        {isSearchingOnline ? (
                            <IconSpinner size={14} className="animate-spin" />
                        ) : (
                            <IconSearch size={14} />
                        )}
                        <span>
                            {isSearchingOnline
                                ? t.discoverLoadingBtn
                                : t.discoverSearchBtn}
                        </span>
                    </button>
                </div>
            </form>

            {discError && (
                <div className="mac-settings-card p-3.5 text-[#FF453A] text-xs relative z-10">
                    {discError}
                </div>
            )}

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2 px-1">
                    <h2 className="text-[13px] font-bold">
                        {t.discoverAvailableHeader} ({displayedResults.length})
                    </h2>

                    {discResults.length > 0 && (
                        <div className="flex items-center gap-2">
                            <MacSelect
                                value={bitrateFilter}
                                onChange={setBitrateFilter}
                                options={[
                                    {
                                        value: 'all',
                                        label: t.discoverAllBitrates
                                    },
                                    { value: '64', label: '≥ 64 kbps' },
                                    { value: '128', label: '≥ 128 kbps' },
                                    { value: '192', label: '≥ 192 kbps' },
                                    { value: '320', label: '≥ 320 kbps' }
                                ]}
                                className="w-[130px]"
                                ariaLabel="Filter Bitrate"
                            />
                            <MacSelect
                                value={sortMode}
                                onChange={setSortMode}
                                options={[
                                    {
                                        value: 'default',
                                        label: t.discoverSortDefault
                                    },
                                    {
                                        value: 'bitrate',
                                        label: t.discoverSortBitrate
                                    },
                                    { value: 'name', label: t.discoverSortName }
                                ]}
                                className="w-[145px]"
                                ariaLabel="Urutan Hasil"
                            />
                        </div>
                    )}
                </div>

                <div className="mac-settings-card mac-inset-list overflow-hidden">
                    {isSearchingOnline ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full mac-glass-pill flex items-center justify-center mb-3 shadow-xs">
                                <IconSpinner
                                    size={20}
                                    className="animate-spin text-accent"
                                />
                            </div>
                            <div className="text-[13px] font-semibold text-foreground">
                                {t.discoverLoadingHeader}
                            </div>
                            <p className="text-[12px] text-secondary mt-1 max-w-[320px] leading-relaxed">
                                {t.discoverLoadingSub}
                            </p>
                        </div>
                    ) : displayedResults.length === 0 ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-secondary">
                            <div className="w-10 h-10 rounded-full mac-glass-pill flex items-center justify-center mb-3 opacity-60">
                                <IconCompass size={20} />
                            </div>
                            <div className="text-[13px] font-medium text-foreground">
                                {t.discoverNoResultsTitle}
                            </div>
                            <p className="text-[11px] text-secondary mt-1 max-w-[320px] leading-relaxed">
                                {t.discoverNoResultsHint}
                            </p>
                        </div>
                    ) : (
                        displayedResults.map((item) => {
                            const alreadyAdded = stations.some(
                                (s) =>
                                    s.streamUrl.toLowerCase() ===
                                    item.streamUrl.toLowerCase()
                            );
                            const isItemPlaying =
                                (currentStation?.streamUrl === item.streamUrl ||
                                    currentStation?.id === item.id) &&
                                (isPlaying || isBusy);
                            return (
                                <div
                                    key={item.id}
                                    className="mac-row flex items-center justify-between px-4 py-3 text-xs"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <StationAvatar
                                            logoUrl={item.logoUrl}
                                            size="sm"
                                            onResolveLogo={(url) =>
                                                api.resolveStationLogo(url)
                                            }
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-[13px] truncate">
                                                {item.name}
                                            </div>
                                            <div className="text-secondary text-[12px] truncate tabular-nums mt-0.5">
                                                {countryCodeToFlag(
                                                    item.country
                                                )}{' '}
                                                {item.city}, {item.country}
                                                {item.bitrate
                                                    ? ` · ${item.bitrate} kbps`
                                                    : ''}
                                                {item.tags.length > 0
                                                    ? ` · ${item.tags.slice(0, 3).join(', ')}`
                                                    : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                        <button
                                            type="button"
                                            title={
                                                isItemPlaying
                                                    ? t.stop
                                                    : t.discoverPreviewBtn
                                            }
                                            aria-label={
                                                isItemPlaying
                                                    ? t.stop
                                                    : t.discoverPreviewBtn
                                            }
                                            onClick={() => {
                                                if (isItemPlaying) {
                                                    void api.stopPlayback();
                                                } else {
                                                    void api.playStation({
                                                        id:
                                                            item.id ||
                                                            `preview-${Date.now()}`,
                                                        name: item.name,
                                                        streamUrl:
                                                            item.streamUrl,
                                                        streamType:
                                                            item.streamType,
                                                        logoUrl: item.logoUrl,
                                                        genre: item.genre,
                                                        city: item.city,
                                                        country: item.country,
                                                        tags: item.tags,
                                                        group: 'Discover'
                                                    });
                                                }
                                            }}
                                            className={`w-7 h-7 rounded-[7px] flex items-center justify-center cursor-pointer transition ${
                                                isItemPlaying
                                                    ? 'bg-[#30D158] text-white shadow-sm'
                                                    : 'mac-glass-pill hover:bg-white/15'
                                            }`}
                                        >
                                            {isItemPlaying ? (
                                                <IconStop size={12} />
                                            ) : (
                                                <IconPlay size={12} />
                                            )}
                                        </button>
                                        {alreadyAdded ? (
                                            <button
                                                type="button"
                                                disabled
                                                title={t.discoverAdded}
                                                aria-label={t.discoverAdded}
                                                className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-[#30D158]/20 text-[#30D158] opacity-80 cursor-default"
                                            >
                                                <IconCheck size={13} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                title={t.discoverAddBtn}
                                                aria-label={t.discoverAddBtn}
                                                onClick={() =>
                                                    void handleAddFromDiscover(
                                                        item,
                                                        false
                                                    )
                                                }
                                                className="bg-accent hover:opacity-90 text-white w-7 h-7 rounded-[7px] flex items-center justify-center shadow-sm cursor-pointer transition"
                                            >
                                                <IconPlus size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
