import { useCallback, useEffect, useState } from 'react';
import type { SquelchWindowApi } from '../types';
import type {
    UpdateCheckResult,
    UpdateDownloadProgress
} from '../../components/UpdateModal';

export interface UseAppUpdatesOptions {
    api: SquelchWindowApi;
    autoCheckUpdates?: boolean;
}

export function useAppUpdates({ api, autoCheckUpdates = true }: UseAppUpdatesOptions) {
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
    const [updateCheckError, setUpdateCheckError] = useState<string | null>(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
    const [updateDownloadProgress, setUpdateDownloadProgress] =
        useState<UpdateDownloadProgress | null>(null);

    useEffect(() => {
        if (api.onUpdateDownloadProgress) {
            const unsub = api.onUpdateDownloadProgress((progress) => {
                setUpdateDownloadProgress(progress);
            });
            return () => {
                unsub();
            };
        }
    }, [api]);

    const handleStartDownloadUpdate = useCallback(
        async (url: string, filename?: string) => {
            if (api.startDownloadUpdate) {
                setUpdateDownloadProgress({
                    status: 'downloading',
                    transferred: 0,
                    total: 0,
                    percent: 0,
                    fileName: filename
                });
                try {
                    await api.startDownloadUpdate(url, filename);
                } catch (err: unknown) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : typeof err === 'object' && err !== null && 'message' in err
                              ? String((err as { message: unknown }).message)
                              : String(err);
                    setUpdateDownloadProgress({
                        status: 'error',
                        transferred: 0,
                        total: 0,
                        percent: 0,
                        error: message
                    });
                }
            }
        },
        [api]
    );

    const handleCancelDownloadUpdate = useCallback(async () => {
        if (api.cancelDownloadUpdate) {
            await api.cancelDownloadUpdate();
            setUpdateDownloadProgress(null);
        }
    }, [api]);

    const handleInstallUpdate = useCallback(
        async (filePath: string) => {
            if (api.openUpdateInstaller) {
                await api.openUpdateInstaller(filePath);
            }
        },
        [api]
    );

    const handleRevealUpdateInFinder = useCallback(
        async (filePath: string) => {
            if (api.revealUpdateInFinder) {
                await api.revealUpdateInFinder(filePath);
            }
        },
        [api]
    );

    const handleCheckForUpdates = useCallback(
        async (manual = true) => {
            if (manual) {
                setIsUpdateModalOpen(true);
            }
            setIsCheckingUpdate(true);
            setUpdateCheckError(null);
            try {
                const res = await api.checkForUpdates();
                setUpdateInfo(res);
                if (res.hasUpdate) {
                    setIsUpdateModalOpen(true);
                }
            } catch (err: unknown) {
                console.error('Update check failed:', err);
                if (manual) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : typeof err === 'object' && err !== null && 'message' in err
                              ? String((err as { message: unknown }).message)
                              : String(err);
                    setUpdateCheckError(message);
                }
            } finally {
                setIsCheckingUpdate(false);
            }
        },
        [api]
    );

    // Auto-check for updates quietly 3s after startup if enabled
    useEffect(() => {
        if (autoCheckUpdates) {
            const timer = setTimeout(() => {
                void handleCheckForUpdates(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [autoCheckUpdates, handleCheckForUpdates]);

    return {
        updateInfo,
        setUpdateInfo,
        isCheckingUpdate,
        updateCheckError,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        updateDownloadProgress,
        setUpdateDownloadProgress,
        handleStartDownloadUpdate,
        handleCancelDownloadUpdate,
        handleInstallUpdate,
        handleRevealUpdateInFinder,
        handleCheckForUpdates
    };
}
