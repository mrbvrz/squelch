# Accessibility Statement for Squelch

Squelch is committed to ensuring digital accessibility for all users, including people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards (inspired by [WCAG 2.1 Level AA](https://www.w3.org/WAI/standards-guidelines/wcag/) and Apple's [Human Interface Guidelines for Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)).

---

## Key Accessibility Features in Squelch

### 1. Full Keyboard Navigation & Shortcuts

Every core interaction within Squelch is fully accessible via keyboard without requiring a mouse or trackpad:

| Key Combination       | Action                                                          |
| :-------------------- | :-------------------------------------------------------------- |
| `Space`               | Toggle Play / Pause playback                                    |
| `M`                   | Toggle Mute / Unmute audio                                      |
| `⌘ + F` or `/`        | Focus the station search input directly                         |
| `Escape`              | Dismiss open popovers, dropdown menus, and modal dialogs        |
| `Tab` / `Shift + Tab` | Navigate forward and backward through interactive controls      |
| `Enter` / `Space`     | Activate selected buttons, play stations, and toggle checkboxes |

### 2. Screen Reader Compatibility (macOS VoiceOver)

- **Semantic HTML & ARIA Attributes**: All buttons, sliders, input fields, tabs, and status cards employ semantic HTML5 elements alongside descriptive `aria-label`, `aria-expanded`, and `role` attributes.
- **Dynamic Updates with `aria-live`**: Real-time notifications (such as station stream verification progress toasts and sleep timer alerts) utilize `aria-live="polite"` regions so assistive technology can announce state changes without interrupting user workflows.
- **Hidden Decorative Assets**: SVG icons and background waveforms contain `aria-hidden="true"` to prevent unnecessary noise for screen reader users.

### 3. Visual Contrast & System Theming

- **macOS Light & Dark Mode Support**: Colors dynamically respond to system appearance and custom accent colors with verified high contrast ratios exceeding the WCAG 2.1 AA threshold of `4.5:1` for body text.
- **Clear Focus Indicators**: All interactive elements (buttons, inputs, and list rows) feature prominent focus rings (`focus-visible`) so keyboard navigators always know their active position.
- **Customizable Appearance**: Users can select custom accent colors and adjust UI typography in **Preferences ➔ Appearance**.

### 4. Reduced Motion

Squelch respects macOS system preferences for reduced motion (`prefers-reduced-motion`). When enabled:

- Modal backdrop transitions and slide-in animations are softened or disabled to prevent vestibular discomfort.
- Heavy audio spectrum animations freeze into static indicator bars.

---

## Feedback & Accessibility Issue Reporting

We welcome feedback on the accessibility of Squelch. If you encounter any accessibility barriers, confusing screen reader announcements, or keyboard traps:

1. **GitHub Issues**: Open an issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) with the label `accessibility`.
2. **Email**: Contact **[hasan.suryaman@gmail.com](mailto:hasan.suryaman@gmail.com)** with the subject `[Accessibility] Squelch Feedback`.

We aim to acknowledge and address accessibility feedback promptly.
