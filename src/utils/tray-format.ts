/**
 * Formatting utilities for macOS Menu Bar Tray Tooltips, Context Menu Subtitles,
 * and Audio Volume calculations.
 */

export function formatTrayTooltip(
    state: string,
    stationName?: string | null,
    streamTitle?: string | null
): string {
    const sName = stationName?.trim();
    const sTitle = streamTitle?.trim();

    if (state === 'playing') {
        if (sName && sTitle) {
            return `▶ Squelch: ${sName} — ${sTitle}`;
        }
        if (sName) {
            return `▶ Squelch: ${sName}`;
        }
    }
    if (
        state === 'buffering' ||
        state === 'connecting' ||
        state === 'reconnecting'
    ) {
        return sName
            ? `⏳ Squelch: Menyambung ke ${sName}...`
            : '⏳ Squelch: Menyambung...';
    }
    if (state === 'paused') {
        return sName ? `⏸ Squelch: ${sName} (Dijeda)` : '⏸ Squelch: Dijeda';
    }
    return 'Squelch - Menu Bar Internet Radio';
}

export function formatTrayMenuSubtitle(
    state: string,
    stationName?: string | null,
    streamTitle?: string | null,
    maxLen = 42
): string {
    const sName = stationName?.trim();
    const sTitle = streamTitle?.trim();

    let text = 'Squelch Radio (Siap)';
    if (state === 'playing') {
        if (sName && sTitle) {
            text = `▶ ${sName} — ${sTitle}`;
        } else if (sName) {
            text = `▶ ${sName}`;
        }
    } else if (
        state === 'buffering' ||
        state === 'connecting' ||
        state === 'reconnecting'
    ) {
        text = sName ? `⏳ Menyambung ke ${sName}...` : '⏳ Menyambung...';
    } else if (state === 'paused') {
        text = sName ? `⏸ ${sName} (Dijeda)` : '⏸ Dijeda';
    }

    if (text.length > maxLen) {
        return text.slice(0, maxLen - 1) + '…';
    }
    return text;
}

export function normalizeVolume(rawVol: number): number {
    if (typeof rawVol !== 'number' || isNaN(rawVol)) return 1.0;
    const normalized = rawVol > 1 ? rawVol / 100 : rawVol;
    return Math.max(0, Math.min(1, Math.round(normalized * 100) / 100));
}
