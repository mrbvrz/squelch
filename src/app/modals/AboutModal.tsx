import React from 'react';
import { SquircleAppIcon } from '../../components/SquircleAppIcon';
import {
    IconGitHub,
    IconGlobe,
    IconExternalLink
} from '../../components/Icons';

export interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    appIconDataUrl: string | null;
    version?: string;
    tagline: string;
    description: string;
    websiteBtnText: string;
    specLinkText: string;
    changelogLinkText: string;
    onOpenExternalUrl: (url: string) => void;
    repoUrl?: string;
    websiteUrl?: string;
    specUrl?: string;
    changelogUrl?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
    isOpen,
    onClose,
    appIconDataUrl,
    version = 'v0.1.1',
    tagline,
    description,
    websiteBtnText,
    specLinkText,
    changelogLinkText,
    onOpenExternalUrl,
    repoUrl = 'https://github.com/mrbvrz/squelch',
    websiteUrl = 'https://mrbvrz.web.id',
    specUrl = 'https://github.com/mrbvrz/squelch/blob/main/ARCHITECTURE.md',
    changelogUrl = 'https://github.com/mrbvrz/squelch/blob/main/CHANGELOG.md'
}) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            onClick={onClose}
            className="fixed inset-0 mac-modal-backdrop flex items-center justify-center p-4 z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="mac-modal-surface w-full max-w-[360px] p-6 space-y-4 text-xs relative flex flex-col items-center text-center shadow-2xl"
            >
                <SquircleAppIcon dataUrl={appIconDataUrl} size={76} />
                <div>
                    <div className="flex items-center justify-center gap-2">
                        <h2
                            id="about-modal-title"
                            className="text-[18px] font-bold tracking-tight text-foreground"
                        >
                            Squelch
                        </h2>
                        <span className="px-2 py-0.5 rounded-[5px] bg-accent/15 text-accent text-[11px] font-bold tabular-nums">
                            {version}
                        </span>
                    </div>
                    <div className="text-[12px] font-medium text-accent mt-0.5">
                        {tagline}
                    </div>
                    <p className="text-[12px] text-secondary leading-relaxed mt-2 max-w-[280px] mx-auto">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(repoUrl)}
                        className="mac-glass-pill px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-xs"
                    >
                        <IconGitHub size={14} />
                        <span>GitHub</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(websiteUrl)}
                        className="bg-accent hover:opacity-90 text-white px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                    >
                        <IconGlobe size={14} />
                        <span>{websiteBtnText}</span>
                    </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] text-secondary">
                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(specUrl)}
                        className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                    >
                        <span>{specLinkText}</span>
                        <IconExternalLink size={10} />
                    </button>
                    <span>·</span>
                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(changelogUrl)}
                        className="hover:text-accent hover:underline cursor-pointer flex items-center gap-1"
                    >
                        <span>{changelogLinkText}</span>
                        <IconExternalLink size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
};
