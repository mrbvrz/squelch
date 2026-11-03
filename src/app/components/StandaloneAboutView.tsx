import React from 'react';
import type { SquelchWindowApi } from '../types';
import type { TranslationDictionary } from '../../i18n';
import { AboutTab } from '../tabs/AboutTab';

export interface StandaloneAboutViewProps {
    appIconDataUrl: string | null;
    api: SquelchWindowApi;
    t: TranslationDictionary;
    onWindowDragMouseDown: (e: React.MouseEvent) => void;
}

export const StandaloneAboutView: React.FC<StandaloneAboutViewProps> = ({
    appIconDataUrl,
    api,
    t,
    onWindowDragMouseDown
}) => {
    return (
        <div className="mac-window-shell flex flex-col h-screen select-none overflow-hidden p-6">
            <div
                onMouseDown={onWindowDragMouseDown}
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                className="h-8 w-full shrink-0 -mt-2 -mx-2"
            />
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4 overflow-y-auto">
                <AboutTab appIconDataUrl={appIconDataUrl} api={api} t={t} />
            </div>
        </div>
    );
};
