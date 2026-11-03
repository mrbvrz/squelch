import { useState } from 'react';
import type { SquelchWindowApi } from '../types';

export interface UseImportExportModalOptions {
    stationsCount: number;
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
}

export function useImportExportModal({
    stationsCount,
    api,
    refreshAll
}: UseImportExportModalOptions) {
    const [isImportExportOpen, setIsImportExportOpen] =
        useState<boolean>(false);
    const [ieFormat, setIeFormat] = useState<'json' | 'm3u' | 'pls'>('json');
    const [ieDuplicateStrategy, setIeDuplicateStrategy] = useState<
        'skip' | 'overwrite' | 'duplicate'
    >('skip');
    const [ieTextContent, setIeTextContent] = useState<string>('');
    const [ieStatusMessage, setIeStatusMessage] = useState<string>('');

    const handleExportLoad = async (format: 'json' | 'm3u' | 'pls') => {
        setIeFormat(format);
        const content = await api.exportStations(format);
        setIeTextContent(content);
        setIeStatusMessage(`${stationsCount} (${format.toUpperCase()})`);
    };

    const handleImportExecute = async () => {
        if (!ieTextContent.trim()) return;
        try {
            const res = await api.importStations({
                content: ieTextContent,
                format: ieFormat,
                duplicateStrategy: ieDuplicateStrategy
            });
            setIeStatusMessage(`+${res.importedCount} / ~${res.skippedCount}`);
            await refreshAll();
        } catch (err) {
            setIeStatusMessage(
                err instanceof Error ? err.message : 'Invalid playlist format'
            );
        }
    };

    return {
        isImportExportOpen,
        setIsImportExportOpen,
        ieFormat,
        setIeFormat,
        ieDuplicateStrategy,
        setIeDuplicateStrategy,
        ieTextContent,
        setIeTextContent,
        ieStatusMessage,
        setIeStatusMessage,
        handleExportLoad,
        handleImportExecute
    };
}
