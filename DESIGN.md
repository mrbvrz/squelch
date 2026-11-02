# Squelch — Design Direction (`DESIGN.md`)

## 1. Identity & Product Truth

Squelch ([github.com/mrbvrz/squelch](https://github.com/mrbvrz/squelch)) is a native-feeling macOS menu bar internet radio receiver and station manager focused on Indonesian and international broadcast streams, built with **Tauri v2** and **Rust**.

It is an **Operate** surface:

- Users open the menu bar popover to switch stations in two clicks, check current song titles via live ICY metadata, or set a sleep timer.
- Users open the companion management window to curate, test, schedule, and organize streams.

---

## 2. Visual World & Aesthetic Direction

- **Archetype:** macOS Sequoia Acoustic Control Surface (inspired by Apple Music mini-player, macOS Control Center modules, and Teenage Engineering tactile precision—translated into native macOS translucent materials).
- **Liveliness Dials (antislop):**
    - `ENERGY: 2` (Measured acoustic focus: calm chrome, crisp broadcast signal indicators)
    - `RHYTHM: 3` (Varied structural rhythm: clean horizontal receiver deck, compact sleep timer bar, dense scannable station directory, and tactile bottom utility strip)
    - `MOTION: 1` (Functional micro-transitions only; honors `prefers-reduced-motion`)
- **Identity Motif:** Broadcast Signal & Frequency Tuning—real station artwork, tabular codec readouts (`font-variant-numeric: tabular-nums`), and a clean 1.5px stroke vector icon system (zero emojis anywhere in controls).

---

## 3. Color System (3 Core Neutrals + 1 Broadcast Accent)

Color belongs on broadcast states and live signals, never splashed arbitrarily across buttons or cards.

- **Surface Ground (macOS Neutral Graphite & Stone):**
    - **Dark mode:** Neutral graphite `rgba(30, 30, 32, 0.90)` over native macOS window vibrancy, elevated module surface `rgba(255, 255, 255, 0.05)` with `0.5px` inner specular hairline `rgba(255, 255, 255, 0.08)`.
    - **Light mode:** Neutral stone `rgba(242, 242, 247, 0.90)`, elevated module surface `rgba(255, 255, 255, 0.82)` with `0.5px` inner hairline `rgba(0, 0, 0, 0.06)`.
    - **Modal Surfaces:** Strictly neutral `rgba(30, 30, 32, 0.98)` (Dark) and `rgba(242, 242, 247, 0.98)` (Light), completely eliminating artificial blueish or violet tints.
- **Typography Hierarchy:**
    - Primary Ink: `#F5F5F7` (Dark) / `#1D1D1F` (Light)
    - Secondary Label: `rgba(235, 235, 245, 0.62)` (Dark) / `rgba(60, 60, 67, 0.66)` (Light)
    - Muted Technical: `rgba(235, 235, 245, 0.42)` (Dark) / `rgba(60, 60, 67, 0.46)` (Light)
- **Single Functional Accent:**
    - Broadcast Live / Signal Active: `#30D158` (Apple Broadcast Green)
    - Warning / Sleep Countdown / Favorite Star: `#FF9F0A` (Amber)
    - Fault / Offline / Power Action: `#FF453A` (Coral Red)
    - Primary Button Fill: Neutral high-contrast ink or system accent swatch.

---

## 4. Typography & Numeric Discipline

- **UI Face:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`
- **Scale (5 strict sizes):**
    - `18px / 600` (`-0.02em`): Receiver station title / Window section title
    - `14px / 600` (`-0.01em`): Active row title / Modal heading
    - `13px / 500`: Standard list item / Control label / Tray station header
    - `12px / 400`: Secondary metadata / Table cells / ICY song title
    - `10px–11px / 500` (`tabular-nums`): Technical readouts (timer countdown, station statistics, shortcut badges)
- **Bans:** No monospace used as a decorative costume on ordinary labels; no uppercase tracked eyebrow kickers; no em-dashes (`—`) in UI copy; no emojis (`🎵`, `⏳`, `🩺`, `📂`, `🔊`) standing in for functional SVG icons.

---

## 5. UI Architecture Decisions

- **Uncluttered Station Header:** Removed distracting group badges beside the active station name in the player deck, ensuring station names have full horizontal width and never truncate prematurely.
- **Minimalist Tray Statistics:** Station, Favorite, and Category counters use a clean vertical stack: large tabular number on top (`text-[13px] font-bold`) and small label below (`text-[10px] text-secondary`) without icon clutter.
- **Unified Search Bar Styling:** The search input in the main window mirrors the sleek, rounded `mac-input` style of the tray popover with a compact, legible keyboard shortcut badge (`⌘F` / `Ctrl+F`).
- **Responsive Directory Filters:** Online directory filters wrap gracefully on narrow window widths, ensuring the Search action button never overflows the bounding card.
- **Custom 1.5px Vector Icons:** Every button uses crisp, optically balanced SVG icons matching Apple SF Symbols stroke weight.
