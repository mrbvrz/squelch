import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import type { PlayerStatus } from '../types';

let sleepInterval: ReturnType<typeof setInterval> | null = null;

export function cancelSleepTimer(
    playerStatus: PlayerStatus,
    syncPlayerStatusToRust: () => void
): void {
    if (sleepInterval) {
        clearInterval(sleepInterval);
        sleepInterval = null;
    }
    playerStatus.sleepTimerMinutes = null;
    playerStatus.sleepTimerRemainingSec = null;
    syncPlayerStatusToRust();
    void emit('ui:state-changed', { ...playerStatus });
}

export function startSleepTimer(
    minutes: number,
    playerStatus: PlayerStatus,
    syncPlayerStatusToRust: () => void,
    stopPlayback: () => Promise<void>,
    sendNotification: (title: string, body: string) => Promise<void>
): void {
    if (sleepInterval) {
        clearInterval(sleepInterval);
        sleepInterval = null;
    }
    playerStatus.sleepTimerMinutes = minutes;
    playerStatus.sleepTimerRemainingSec = minutes * 60;
    syncPlayerStatusToRust();
    void emit('ui:state-changed', { ...playerStatus });

    sleepInterval = setInterval(async () => {
        if (
            playerStatus.sleepTimerRemainingSec &&
            playerStatus.sleepTimerRemainingSec > 0
        ) {
            playerStatus.sleepTimerRemainingSec -= 1;

            // 1 minute remaining warning notification
            if (playerStatus.sleepTimerRemainingSec === 60) {
                void (async () => {
                    try {
                        const cfg: any = await invoke('get_settings').catch(
                            () => null
                        );
                        const isEn = cfg?.settings?.language === 'en';
                        const title = isEn
                            ? 'Sleep Timer'
                            : 'Pengatur Waktu Tidur';
                        const stName = playerStatus.currentStation?.name;
                        const body = isEn
                            ? `Radio playback will stop in 1 minute${stName ? ` (${stName})` : ''}.`
                            : `Siaran radio akan dinonaktifkan dalam 1 menit${stName ? ` (${stName})` : ''}.`;
                        await sendNotification(title, body);
                    } catch {
                        // ignore
                    }
                })();
            }

            if (playerStatus.sleepTimerRemainingSec <= 0) {
                if (sleepInterval) {
                    clearInterval(sleepInterval);
                    sleepInterval = null;
                }
                await stopPlayback();
                void (async () => {
                    try {
                        const cfg: any = await invoke('get_settings').catch(
                            () => null
                        );
                        const isEn = cfg?.settings?.language === 'en';
                        const title = isEn
                            ? 'Sleep Timer'
                            : 'Pengatur Waktu Tidur';
                        const body = isEn
                            ? 'Radio playback has stopped.'
                            : 'Pemutaran radio telah dihentikan.';
                        await sendNotification(title, body);
                    } catch {
                        // ignore
                    }
                })();
            }
            if (
                playerStatus.sleepTimerRemainingSec % 5 === 0 ||
                playerStatus.sleepTimerRemainingSec <= 0
            ) {
                syncPlayerStatusToRust();
            }
            await emit('ui:state-changed', { ...playerStatus });
        }
    }, 1000);
}

export async function setSleepTimer(
    minutes: number | null,
    playerStatus: PlayerStatus,
    syncPlayerStatusToRust: () => void,
    stopPlayback: () => Promise<void>,
    sendNotification: (title: string, body: string) => Promise<void>
): Promise<boolean> {
    if (!minutes || minutes <= 0) {
        cancelSleepTimer(playerStatus, syncPlayerStatusToRust);
    } else {
        startSleepTimer(
            minutes,
            playerStatus,
            syncPlayerStatusToRust,
            stopPlayback,
            sendNotification
        );
    }
    return true;
}
