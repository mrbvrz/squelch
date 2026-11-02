import React from 'react';
import type { TranslationDictionary } from '../../i18n';
import type { SquelchWindowApi } from '../types';
import {
    AUTHOR_WEBSITE_URL,
    CHANGELOG_DOC_URL,
    GITHUB_REPO_URL,
    SPEC_DOC_URL
} from '../types';
import { SquircleAppIcon } from '../../components/SquircleAppIcon';
import {
    IconExternalLink,
    IconGitHub,
    IconGlobe
} from '../../components/Icons';

export interface AboutTabProps {
    appIconDataUrl: string | null;
    api: SquelchWindowApi;
    t: TranslationDictionary;
}

export const AboutTab: React.FC<AboutTabProps> = ({
    appIconDataUrl,
    api,
    t
}) => {
    return (
        <div
            key="tab-about"
            className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center gap-4 text-xs animate-tab-enter"
        >
            <SquircleAppIcon dataUrl={appIconDataUrl} size={92} />
            <div>
                <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Squelch
                    </h2>
                    <span className="px-2 py-0.5 rounded-[6px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                        v0.1.1
                    </span>
                </div>
                <div className="text-[13px] font-medium text-accent mt-0.5">
                    {t.aboutTagline}
                </div>
                <p className="text-[12px] text-secondary leading-relaxed mt-2.5 max-w-md">
                    {t.aboutDescription}
                </p>
            </div>

            {/* Primary Buttons: GitHub & Website */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                <button
                    type="button"
                    onClick={() => void api.openExternalUrl(GITHUB_REPO_URL)}
                    className="mac-glass-pill px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 cursor-pointer hover:bg-white/15 transition shadow-sm"
                >
                    <IconGitHub size={15} />
                    <span>GitHub</span>
                </button>

                <button
                    type="button"
                    onClick={() => void api.openExternalUrl(AUTHOR_WEBSITE_URL)}
                    className="bg-accent hover:opacity-90 text-white px-4 py-2 rounded-[8px] text-[12px] font-medium flex items-center gap-2 shadow-sm cursor-pointer transition"
                >
                    <IconGlobe size={15} />
                    <span>{t.aboutWebsiteBtn}</span>
                </button>
            </div>

            {/* Bottom Links: Spesifikasi & Arsitektur + Changelog */}
            <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-secondary">
                <button
                    type="button"
                    onClick={() => void api.openExternalUrl(SPEC_DOC_URL)}
                    className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                    <span>{t.aboutSpecLink}</span>
                    <IconExternalLink size={11} />
                </button>
                <span>·</span>
                <button
                    type="button"
                    onClick={() => void api.openExternalUrl(CHANGELOG_DOC_URL)}
                    className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                    <span>{t.aboutChangelogLink}</span>
                    <IconExternalLink size={11} />
                </button>
            </div>
        </div>
    );
};
