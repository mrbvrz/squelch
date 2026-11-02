import type { GlobalShortcutsConfig } from '../types';

export type ShortcutActionKey = keyof GlobalShortcutsConfig;

export interface ShortcutDefinition {
    key: ShortcutActionKey;
    labelEn: string;
    labelId: string;
    descEn: string;
    descId: string;
    defaultAccelerator: string;
}

export const GLOBAL_SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
    {
        key: 'playPause',
        labelEn: 'Play / Pause Stream',
        labelId: 'Putar / Jeda Siaran',
        descEn: 'Toggle live internet radio stream playback from anywhere',
        descId: 'Putar atau jeda siaran radio secara instan dari aplikasi mana pun',
        defaultAccelerator: 'CommandOrControl+Shift+P'
    },
    {
        key: 'nextStation',
        labelEn: 'Next Station',
        labelId: 'Stasiun Berikutnya',
        descEn: 'Switch forward to next radio station in your list',
        descId: 'Pindah ke stasiun radio berikutnya dalam daftar Anda',
        defaultAccelerator: 'CommandOrControl+Shift+Right'
    },
    {
        key: 'prevStation',
        labelEn: 'Previous Station',
        labelId: 'Stasiun Sebelumnya',
        descEn: 'Switch backward to previous radio station in your list',
        descId: 'Pindah ke stasiun radio sebelumnya dalam daftar Anda',
        defaultAccelerator: 'CommandOrControl+Shift+Left'
    }
];

export const isMacOS =
    typeof navigator !== 'undefined'
        ? /Mac|iPhone|iPad|iPod/i.test(
              navigator.platform || navigator.userAgent
          )
        : true;

/**
 * Converts a raw accelerator string (e.g. "CommandOrControl+Shift+P")
 * into visual key glyphs appropriate for macOS or Windows/Linux.
 */
export function formatAcceleratorToBadges(
    accelerator: string | undefined | null,
    isMac = isMacOS
): string[] {
    if (!accelerator || !accelerator.trim()) return [];

    const parts = accelerator.split('+').map((p) => p.trim());
    return parts.map((part) => {
        const lower = part.toLowerCase();
        if (lower === 'commandorcontrol' || lower === 'cmdorctrl') {
            return isMac ? '⌘' : 'Ctrl';
        }
        if (lower === 'cmd' || lower === 'command') {
            return '⌘';
        }
        if (lower === 'control' || lower === 'ctrl') {
            return isMac ? '⌃' : 'Ctrl';
        }
        if (lower === 'shift') {
            return isMac ? '⇧' : 'Shift';
        }
        if (lower === 'alt' || lower === 'option') {
            return isMac ? '⌥' : 'Alt';
        }
        if (lower === 'space') {
            return '␣ Space';
        }
        if (lower === 'up' || lower === 'arrowup') {
            return '↑';
        }
        if (lower === 'down' || lower === 'arrowdown') {
            return '↓';
        }
        if (lower === 'left' || lower === 'arrowleft') {
            return '←';
        }
        if (lower === 'right' || lower === 'arrowright') {
            return '→';
        }
        if (lower === 'escape' || lower === 'esc') {
            return 'Esc';
        }
        return part.toUpperCase();
    });
}

/**
 * Inspects a KeyboardEvent to see if only modifier keys are currently being held.
 */
export function isModifierOnlyKey(key: string): boolean {
    return ['Meta', 'Control', 'Shift', 'Alt', 'CapsLock', 'Tab'].includes(key);
}

/**
 * Returns active modifier badges from a KeyboardEvent for live recording preview.
 */
export function getActiveModifierBadges(
    e: KeyboardEvent,
    isMac = isMacOS
): string[] {
    const badges: string[] = [];
    if (e.metaKey) badges.push('⌘');
    if (e.ctrlKey && (!isMac || !e.metaKey)) badges.push(isMac ? '⌃' : 'Ctrl');
    if (e.altKey) badges.push(isMac ? '⌥' : 'Alt');
    if (e.shiftKey) badges.push(isMac ? '⇧' : 'Shift');
    return badges;
}

/**
 * Parses a KeyboardEvent into a cross-platform accelerator string compatible with Tauri.
 */
export function formatKeyboardEventToAccelerator(
    e: KeyboardEvent
): string | null {
    if (isModifierOnlyKey(e.key)) return null;

    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let mainKey = e.key;
    if (mainKey === ' ') mainKey = 'Space';
    else if (mainKey === 'ArrowUp') mainKey = 'Up';
    else if (mainKey === 'ArrowDown') mainKey = 'Down';
    else if (mainKey === 'ArrowLeft') mainKey = 'Left';
    else if (mainKey === 'ArrowRight') mainKey = 'Right';
    else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

    // Require at least one modifier unless it's a Function key (e.g. F1-F12) or Media key
    if (parts.length === 0 && !/^F\d+$|^Media/i.test(mainKey)) {
        parts.push('CommandOrControl');
    }

    parts.push(mainKey);
    return parts.join('+');
}

/**
 * Checks for duplicate conflicts between shortcuts in the settings.
 */
export function findShortcutConflict(
    targetKey: ShortcutActionKey,
    accelerator: string,
    allShortcuts: GlobalShortcutsConfig
): ShortcutActionKey | null {
    if (!accelerator) return null;
    const normalizedTarget = accelerator.toLowerCase().trim();

    for (const [key, value] of Object.entries(allShortcuts)) {
        if (key === targetKey || !value) continue;
        if (value.toLowerCase().trim() === normalizedTarget) {
            return key as ShortcutActionKey;
        }
    }
    return null;
}
