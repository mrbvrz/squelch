import React, { useState, useEffect } from 'react';
import type { SquelchWindowApi } from '../types';
import type { TranslationDictionary } from '../../i18n';
import type { useAppCoreData } from '../hooks/useAppCoreData';
import { AboutModal } from '../modals/AboutModal';
import { QuitConfirmModal } from '../modals/QuitConfirmModal';

export interface StandaloneDialogHostProps {
    api: SquelchWindowApi;
    t: TranslationDictionary;
    appCoreData: ReturnType<typeof useAppCoreData>;
}

export const StandaloneDialogHost: React.FC<StandaloneDialogHostProps> = ({
    api,
    t,
    appCoreData
}) => {
    const [dialogType, setDialogType] = useState<'about' | 'quit' | null>(
        () => {
            if (typeof window !== 'undefined') {
                if (window.location.hash.includes('quit')) return 'quit';
                if (window.location.hash.includes('about')) return 'about';
            }
            return 'about';
        }
    );

    const handleClose = () => {
        if (api.hideDialogWindow) {
            void api.hideDialogWindow();
        } else {
            window.close();
        }
    };

    useEffect(() => {
        const handleSetDialog = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (
                customEvent.detail === 'quit' ||
                customEvent.detail === 'about'
            ) {
                setDialogType(customEvent.detail);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('squelch:set-dialog', handleSetDialog);
        window.addEventListener('keydown', handleKeyDown);

        let unlistenSetDialog: (() => void) | null = null;
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            import('@tauri-apps/api/event')
                .then(({ listen }) => {
                    listen<string>('squelch:set-dialog', (event) => {
                        if (
                            event.payload === 'quit' ||
                            event.payload === 'about'
                        ) {
                            setDialogType(event.payload);
                        }
                    }).then((u) => {
                        unlistenSetDialog = u;
                    });
                })
                .catch(() => {});
        }

        return () => {
            window.removeEventListener('squelch:set-dialog', handleSetDialog);
            window.removeEventListener('keydown', handleKeyDown);
            if (unlistenSetDialog) unlistenSetDialog();
        };
    }, []);

    return (
        <div
            className="w-full h-screen flex items-center justify-center p-2 select-none overflow-hidden bg-transparent"
            onClick={handleClose}
        >
            {dialogType === 'about' && (
                <AboutModal
                    isOpen={true}
                    isStandalone={true}
                    onClose={handleClose}
                    appIconDataUrl={appCoreData.appIconDataUrl}
                    version="v0.1.3"
                    tagline={t.aboutTagline}
                    description={t.aboutDescription}
                    websiteBtnText={t.aboutWebsiteBtn}
                    specLinkText={t.aboutSpecLink}
                    changelogLinkText={t.aboutChangelogLink}
                    onOpenExternalUrl={(url: string) => {
                        if (api.openExternalUrl) {
                            void api.openExternalUrl(url);
                        } else {
                            window.open(url, '_blank');
                        }
                    }}
                />
            )}
            {dialogType === 'quit' && (
                <QuitConfirmModal
                    isOpen={true}
                    isStandalone={true}
                    onClose={handleClose}
                    onConfirm={() => void api.quitApp()}
                    appIconDataUrl={appCoreData.appIconDataUrl}
                    language={appCoreData.settings?.language || 'id'}
                    cancelBtnText={t.cancelBtn}
                />
            )}
        </div>
    );
};
