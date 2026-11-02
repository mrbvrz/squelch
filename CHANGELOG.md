# Changelog

All notable changes to the **Squelch** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.2] - 2026-11-03

### Polish, Modern Stats Analytics, macOS Design System & CI/CD Automation

- **GitHub Actions Automation**:
  - Added `.github/workflows/ci.yml` for automated linting, TypeScript typechecking, Vitest unit testing, and Rust cargo checks.
  - Added `.github/workflows/release.yml` for automated macOS packaging (DMG and ZIP) and GitHub Releases publishing.
- **Modern Listening Analytics with Recharts**:
  - Replaced legacy static chart with responsive, interactive area charts supporting **Harian (Daily)**, **Mingguan (Weekly)**, **Bulanan (Monthly)**, and **Tahunan (Yearly)** timeframes.
  - Dynamically calculated integer hour increments (1h, 2h, 4h, 5h/10h) on the Y-axis.
  - Dead-center empty state with direct action to start listening.
- **macOS HIG Control Consistency & Custom Dropdowns**:
  - Developed custom **`MacSelect`** component with glass popover, keyboard navigation (Esc, Arrow keys, Enter), and active checkmarks, eliminating WebKit Aqua menulist rendering quirks.
  - Unified input dimensions (`h-[30px]`, `rounded-[7px]`, `w-[200px]` dropdowns) across Preferences, Schedules, Stations, and Discover.
  - High-contrast macOS System Red primary action for factory reset ("Kembalikan Pengaturan Bawaan").
- **Granular Data Management & System Insets**:
  - Introduced selective data deletion dropdown ("Semua Data", "Stasiun Radio", "Jadwal Siaran", "Statistik Dengar") separate from factory settings reset.
  - Standardized macOS inset list divider lines (`mac-inset-list`) across shortcut lists and settings cards.
- **Window Lifecycle & Tray Interoperability**:
  - Intercepted `WindowEvent::CloseRequested` to keep the application alive in the menu bar tray when the main window is closed.
  - Robust restoration and unhiding of windows when invoked from tray menu actions.
- **Station Management Enhancements**:
  - Added automatic stream type detection (.mp3, .aac, .m3u8, .ogg) with lock indicator.
  - Dead-center empty states across all empty views without card wrappers.

---

## [0.1.1] - 2026-11-02

### Migrated to Tauri v2 & Rust Native Architecture

- **Core Framework Migration**:
    - Complete migration from Electron to **Tauri v2** with a native **Rust** backend.
    - Reduced idle memory footprint by over **75%** (~28 MB vs. ~160 MB).
    - Cold startup accelerated to under **300ms** leveraging native system WebKit webviews.
    - Removed hundreds of megabytes of obsolete dependencies (`electron`, `electron-builder`).
- **Rust Native State Management & Multi-Window Sync**:
    - Thread-safe `AppStore` in Rust utilizing `Mutex<Value>` for global playback status.
    - Synchronized player state in real time across the main management window, tray popover, and audio worker via `squelch:player-sync` events.
    - Eliminated out-of-sync playback states when switching radio stations from either surface.
- **High-Performance Rust ICY Demuxing Proxy**:
    - Replaced Node.js HTTP server with an asynchronous Rust loopback proxy built on **Tokio** and **Axum**.
    - Robust extraction of Shoutcast/Icecast `StreamTitle` metadata with zero audio stutter or playback glitches.
- **Clean Architecture & Directory Refactoring**:
    - Reorganized frontend into a modern, modular structure under `src/` (`app/`, `tray/`, `audio/`, `bridge/`, `components/`, `types/`, `utils/`, `i18n/`).
    - Unified single `tsconfig.json` for Vite + TypeScript.
    - Extracted clean domain models into `src/types/` and isolated playlist parsing into `src/utils/playlist.ts`.
- **Security Hardening**:
    - Strict URL scheme validation in `open_external` (allowing only `https://`, `http://`, and `mailto:`).
    - Rigorous escaping and sanitization of user strings in native macOS AppleScript notifications (`\`, `"`, `$`, `` ` ``).
    - Local loopback proxy binding locked strictly to `127.0.0.1`.
- **UI & UX Refinements**:
    - Matched main window search bar styling with tray popover (`mac-input rounded-[7px]`) and scaled down shortcut badge size.
    - Removed group badges beside station names in the tray player deck to give full horizontal width and prevent text truncation.
    - Restored clean, icon-free layout for bottom tray statistics (large number on top, label below).
    - Eliminated blueish/slate tint from dialog modals, standardizing on macOS neutral graphite (`rgba(30, 30, 32, 0.98)`).
    - Added quit confirmation dialog when selecting Quit from the menu bar tray.
    - Fixed responsive layout in Online Directory search to prevent button overflow on smaller window sizes.
    - Added deduplication to Online Directory search results.
    - Listening activity displays actual station names and artwork instead of raw IDs.

---

## [0.1.0] - 2026-11-01

### Added

- **macOS HUD Glass Bento Popover & Tray Experience**:
    - Native macOS HUD translucency window with frosted glass layout (`backdrop-filter: blur(24px) saturate(180%)`).
    - Pre-rendered 12-frame pure white Signed Distance Field (SDF) capsule waveform menu bar animation (`0%` CPU overhead).
    - Circular (`rounded-full`) Play/Pause and Stop action buttons on both tray and window surfaces.
    - Sleep timer with quick presets (`15m`, `30m`, `60m`) and advance 60-second countdown alert with cancellation option.
- **Resilient Multi-Codec Audio Engine**:
    - Headless worker combining HTML5 Audio with `hls.js` supporting MP3, AAC/HE-AAC, OGG/Opus, and HLS (`.m3u8`).
    - Automatic stream URL resolver supporting direct streams, `.m3u`, `.pls`, and Noice catalog endpoints (`open.noice.id`).
    - Exponential reconnect backoff with random jitter on network loss, plus auto pause/resume on system sleep/wake.
- **Show Schedules & Automated Broadcast Reminders**:
    - Broadcast show schedule manager (e.g. _Sarapan Seru_ on Jak 101 FM, Monday–Friday 06:00–10:00).
    - Background schedule engine ticking every 20 seconds with daily slot deduplication.
    - Native desktop notifications triggered at show start or 5–10 minutes in advance.
    - Optional _Autoplay_ switch to automatically tune in and begin streaming when the broadcast starts.
    - Live on-air pulsating indicator badge (`🟢 On Air Now`).
- **Sidebar Integration & Instant Keyboard Navigation**:
    - Unified mini player embedded directly under the search bar on the left sidebar.
    - Global `⌘F` (macOS) / `Ctrl+F` (Windows/Linux) keyboard shortcut with visual key badge for quick search access.
    - Primary sidebar tabs for _Radio Stations_, _Show Schedules_, _Online Directory_, _Listening Activity_, _Preferences_, and _About_.
- **Open Public Radio Directory (Radio Browser)**:
    - Search global internet radio streams powered by `radio-browser.info` with multi-mirror automatic failover.
    - Country selection dropdown with emoji flags and inline query input.
    - Instant audio stream preview and one-click library addition.
- **Listening Duration Analytics**:
    - Structured listening duration tracker broken down into Weekly, Monthly, and Yearly intervals.
    - Interactive SVG bar chart with day/month labels, active station badge, and format conversions.
- **Personalization & Settings**:
    - Window themes (System, Light, Dark) with visual preview cards.
    - 8 native macOS accent color swatches.
    - Custom system font picker leveraging local font query API with fallback.
    - Glass surface opacity adjustment (`70%`, `80%`, `90%`, `100%`).
    - Atomic JSON data backup & restore with file picker dialogs.
    - Reset to default configuration with modal confirmation.
    - Application quit confirmation dialog to prevent accidental closures.
- **Bilingual Localization (i18n)**:
    - Complete English and Indonesian language dictionaries with flag dropdown selector.
