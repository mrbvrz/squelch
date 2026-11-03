import React from 'react';
import { SquircleAppIcon } from '../../components/SquircleAppIcon';
import {
    IconGitHub,
    IconGlobe,
    IconExternalLink,
    IconClose
} from '../../components/Icons';

export interface AboutModalProps {
    isOpen: boolean;
    isStandalone?: boolean;
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
    isStandalone = false,
    onClose,
    appIconDataUrl,
    version = 'v0.1.3',
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

    const backdropClass = isStandalone
        ? 'fixed inset-0 flex items-center justify-center p-3 z-50 bg-transparent'
        : 'fixed inset-0 mac-modal-backdrop flex items-center justify-center p-3 z-50 animate-fade-in';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            onClick={onClose}
            className={backdropClass}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                data-tauri-drag-region
                className="mac-modal-surface w-full max-w-[330px] p-5 space-y-3.5 text-xs relative flex flex-col items-center text-center shadow-2xl animate-scale-up"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 text-secondary hover:text-foreground w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    aria-label="Close"
                >
                    <IconClose size={13} />
                </button>

                <SquircleAppIcon dataUrl={appIconDataUrl} size={68} />
                <div>
                    <div className="flex items-center justify-center gap-2">
                        <h2
                            id="about-modal-title"
                            className="text-[17px] font-bold tracking-tight text-foreground"
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
                    <p className="text-[11.5px] text-secondary leading-relaxed mt-1.5 max-w-[270px] mx-auto">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(repoUrl)}
                        className="mac-glass-pill px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition shadow-xs"
                    >
                        <IconGitHub size={13} />
                        <span>GitHub</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenExternalUrl(websiteUrl)}
                        className="bg-accent hover:opacity-90 text-white px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                    >
                        <IconGlobe size={13} />
                        <span>{websiteBtnText}</span>
                    </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] text-secondary pt-0.5">
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
