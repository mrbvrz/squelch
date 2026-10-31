# Changelog

All notable changes to the **Squelch** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-11-01

### Added

- **macOS HUD Glass Bento Popover & Tray Experience**:
    - Native macOS HUD vibrancy window (`vibrancy: 'hud'`) with frosted glass bento layout (`backdrop-filter: blur(24px) saturate(180%)`).
    - Pre-rendered 12-frame pure white Signed Distance Field (SDF) capsule waveform menu bar animation (`0%` CPU overhead).
    - Circular (`rounded-full`) Play/Pause and Stop action buttons on both tray and window surfaces.
    - Sleep timer with quick presets (`15m`, `30m`, `60m`) and advance 60-second countdown alert with cancellation option.
- **Resilient Multi-Codec Audio Engine & ICY StreamTitle Demuxing**:
    - Headless worker combining HTML5 Audio with `hls.js` supporting MP3, AAC/HE-AAC, OGG/Opus, and HLS (`.m3u8`).
    - Local loopback proxy server (`127.0.0.1`) requesting `Icy-MetaData: 1`, extracting metadata chunks cleanly, and delivering smooth PCM playback.
    - Automatic stream URL resolver supporting direct streams, `.m3u`, `.pls`, and Noice catalog endpoints (`open.noice.id`).
    - Exponential reconnect backoff with random jitter on network loss, plus auto pause/resume on system sleep/wake and audio device unplugging.
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
    - Search global internet radio streams powered by `radio-browser.info` with multi-mirror automatic failover (`de1`, `fi1`, `at1`).
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
