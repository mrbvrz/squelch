# Squelch — Design Direction (`DESIGN.md`)

## 1. Identity & Product Truth

Squelch (`http://github.com/mrbvrz/squelch`) is a native-feeling macOS menu bar internet radio receiver and station manager focused on Indonesian and international broadcast streams. It is an **Operate** surface: users open the menu bar popover to switch stations in two clicks, check what song is playing via ICY metadata, or set a sleep timer, and open the companion window to curate, test, and verify streams.

## 2. Visual World & Aesthetic Direction

- **Archetype:** macOS Sequoia Acoustic Control Surface (inspired by Apple Music mini-player, macOS Control Center modules, and Teenage Engineering / Braun tactile precision—translated into native macOS translucent materials).
- **Liveliness Dials (antislop):**
    - `ENERGY: 2` (Measured acoustic focus: calm chrome, crisp broadcast signal indicators)
    - `RHYTHM: 3` (Varied structural rhythm: asymmetric receiver deck, compact sleep bar, dense scannable frequency directory, and tactile bottom utility strip)
    - `MOTION: 1` (Functional micro-transitions only; honors `prefers-reduced-motion`)
- **Identity Motif:** Broadcast Signal & Frequency Tuning—real station artwork or crisp monogram plates, tabular codec/latency readouts (`font-variant-numeric: tabular-nums`), and a clean 1.5px stroke SVG icon system (zero emojis anywhere in the UI).

## 3. Color System (3 Core Neutrals + 1 Broadcast Accent)

Color belongs on the broadcast state and live signal, never splashed across every button or sidebar pill.

- **Surface Ground (macOS Vibrancy):**
    - Dark mode: translucent graphite `rgba(22, 22, 25, 0.72)` over `NSVisualEffectView` (`menu` / `under-window`), elevated module surface `rgba(255, 255, 255, 0.055)` with `0.5px` inner specular hairline `rgba(255, 255, 255, 0.09)`.
    - Light mode: translucent stone `rgba(246, 246, 248, 0.78)`, elevated module surface `rgba(255, 255, 255, 0.66)` with `0.5px` inner hairline `rgba(0, 0, 0, 0.08)`.
- **Typography Hierarchy:**
    - Primary Ink: `#F5F5F7` (Dark) / `#1D1D1F` (Light)
    - Secondary Label: `rgba(235, 235, 245, 0.62)` (Dark) / `rgba(60, 60, 67, 0.66)` (Light)
    - Muted Technical: `rgba(235, 235, 245, 0.42)` (Dark) / `rgba(60, 60, 67, 0.46)` (Light)
- **Single Functional Accent:**
    - Broadcast Live / Signal Active: `#30D158` (Apple Broadcast Green)
    - Warning / Buffering / Favorite Star: `#FF9F0A` (Amber)
    - Fault / Offline: `#FF453A` (Coral Red)
    - Primary Control Fill: Neutral high-contrast ink (`#F5F5F7` text on `#2C2C2E` surface or `#1D1D1F` on `#FFFFFF`), avoiding saturated blue/indigo/violet buttons everywhere.

## 4. Typography & Numeric Discipline

- **UI Face:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`
- **Scale (5 strict sizes):**
    - `18px / 600` (`-0.02em`): Receiver station title / Window section title
    - `14px / 600` (`-0.01em`): Active row title / Modal heading
    - `13px / 500`: Standard list item / Control label
    - `12px / 400`: Secondary metadata / Table cells / ICY song title
    - `11px / 500` (`tabular-nums`): Technical readouts (codec, latency ms, station counts, timer countdown)
- **Bans:** No monospace used as a "tech costume" on ordinary labels; no uppercase tracked eyebrow kickers; no em-dashes (`—`) in UI copy; no emojis (`🎵`, `⏳`, `🩺`, `📂`, `🔊`) standing in for SVG icons.

## 5. One-Line Decisions (antislop R-31)

- **Why this color?** Neutral translucent graphite/stone lets macOS desktop wallpaper bleed through subtly while reserving `#30D158` strictly for live broadcast state so the user knows at a glance if audio is streaming.
- **Why this layout?** The popover is ordered by frequency of use: (1) Live Receiver Deck with artwork & play/stop at the top, (2) compact single-row Sleep Timer selector + search filter in the middle, (3) scrollable Station Directory taking 65% of vertical height, and (4) quiet utility footer at the bottom.
- **Why this typography?** Native SF Pro with `tabular-nums` aligns codecs, bitrates, and timers cleanly without resorting to decorative monospace fonts.
- **Why this spacing?** Tight `6px–8px` internal module grouping with `12px` outer padding maximizes visible stations inside a compact `360×580` menu bar popover without scrolling fatigue.
- **Why flat tonal modules instead of bento cards?** Replaced fake "Signal 100%" KPI tiles with a real horizontal Receiver Deck and a divided list directory, matching how macOS Control Center and real product screens work.
- **Why custom 1.5px SVG icons?** Replaces every inconsistent Unicode/emoji glyph with crisp, optical-aligned vector strokes that match Apple SF Symbols weight.
