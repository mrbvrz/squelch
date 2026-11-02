import { describe, expect, it } from 'vitest';
import {
    formatAcceleratorToBadges,
    formatKeyboardEventToAccelerator,
    findShortcutConflict,
    GLOBAL_SHORTCUT_DEFINITIONS
} from '../../src/utils/shortcuts';
import type { GlobalShortcutsConfig } from '../../src/types';

describe('Keyboard Shortcuts Utilities', () => {
    it('formats accelerators into macOS glyph badges', () => {
        expect(
            formatAcceleratorToBadges('CommandOrControl+Shift+P', true)
        ).toEqual(['⌘', '⇧', 'P']);
        expect(
            formatAcceleratorToBadges('CommandOrControl+Alt+Right', true)
        ).toEqual(['⌘', '⌥', '→']);
        expect(
            formatAcceleratorToBadges('CommandOrControl+Shift+Space', true)
        ).toEqual(['⌘', '⇧', '␣ Space']);
        expect(
            formatAcceleratorToBadges('CommandOrControl+Shift+Up', true)
        ).toEqual(['⌘', '⇧', '↑']);
    });

    it('formats accelerators into Windows/Linux text badges', () => {
        expect(
            formatAcceleratorToBadges('CommandOrControl+Shift+P', false)
        ).toEqual(['Ctrl', 'Shift', 'P']);
        expect(
            formatAcceleratorToBadges('CommandOrControl+Alt+Right', false)
        ).toEqual(['Ctrl', 'Alt', '→']);
    });

    it('handles empty and undefined accelerators gracefully', () => {
        expect(formatAcceleratorToBadges('')).toEqual([]);
        expect(formatAcceleratorToBadges(null)).toEqual([]);
        expect(formatAcceleratorToBadges(undefined)).toEqual([]);
    });

    it('parses KeyboardEvents into standard accelerators', () => {
        const metaShiftP = {
            key: 'p',
            metaKey: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: true
        } as KeyboardEvent;
        expect(formatKeyboardEventToAccelerator(metaShiftP)).toBe(
            'CommandOrControl+Shift+P'
        );

        const spaceNoMod = {
            key: ' ',
            metaKey: false,
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        } as KeyboardEvent;
        // Requires at least one modifier for global safety
        expect(formatKeyboardEventToAccelerator(spaceNoMod)).toBe(
            'CommandOrControl+Space'
        );

        const f12Key = {
            key: 'F12',
            metaKey: false,
            ctrlKey: false,
            altKey: false,
            shiftKey: false
        } as KeyboardEvent;
        // Function keys are allowed without modifier
        expect(formatKeyboardEventToAccelerator(f12Key)).toBe('F12');
    });

    it('detects shortcut collisions accurately', () => {
        const shortcuts: GlobalShortcutsConfig = {
            playPause: 'CommandOrControl+Shift+P',
            nextStation: 'CommandOrControl+Shift+Right',
            prevStation: 'CommandOrControl+Shift+Left'
        };

        const conflict = findShortcutConflict(
            'nextStation',
            'CommandOrControl+Shift+P',
            shortcuts
        );
        expect(conflict).toBe('playPause');

        const noConflict = findShortcutConflict(
            'prevStation',
            'CommandOrControl+Shift+M',
            shortcuts
        );
        expect(noConflict).toBeNull();
    });

    it('has standard global shortcut definitions with sensible defaults', () => {
        expect(GLOBAL_SHORTCUT_DEFINITIONS).toHaveLength(3);
        const keys = GLOBAL_SHORTCUT_DEFINITIONS.map((d) => d.key);
        expect(keys).toEqual(['playPause', 'nextStation', 'prevStation']);
        for (const def of GLOBAL_SHORTCUT_DEFINITIONS) {
            expect(def.key).toBeTruthy();
            expect(def.defaultAccelerator).toBeTruthy();
            expect(def.labelId).toBeTruthy();
            expect(def.labelEn).toBeTruthy();
        }
    });
});
