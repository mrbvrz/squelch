# Squelch

<p align="center">
  <img src="resources/icons/app-icon.png" width="96" height="96" alt="Squelch App Icon" />
</p>

<p align="center">
  <strong>Modern, ultra-lightweight, cross-platform menu bar internet radio player powered by Tauri v2 & Rust.</strong><br />
  Featuring a native macOS HUD Glass interface, real-time Rust ICY metadata extraction, broadcast show schedules with autoplay, and public directory discovery.
</p>

<p align="center">
  <a href="https://github.com/mrbvrz/squelch/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/mrbvrz/squelch/releases"><img src="https://img.shields.io/badge/Version-0.1.2-emerald.svg" alt="Version 0.1.2" /></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built%20with-Tauri%20v2%20%26%20Rust-orange.svg" alt="Tauri v2" /></a>
  <a href="https://github.com/mrbvrz/squelch"><img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Platform" /></a>
</p>

---

## Interface Showcase

<p align="center">
  <strong>Menu Bar Tray Popover</strong><br />
  <sub>Compact 2-click HUD player with live waveform & sleep timer</sub><br /><br />
  <img src="docs/screenshots/squelch-tray-popover.png" width="360px" alt="Squelch Menu Bar Tray Popover" />
</p>

<table align="center" style="border: none;">
  <tr>
    <td align="center" width="50%" style="border: none; vertical-align: top;">
      <strong>Main Station Management</strong><br />
      <sub>Full-featured broadcast directory & preferences</sub><br /><br />
      <img src="docs/screenshots/squelch-main-window.png" width="98%" alt="Squelch Main Management" />
    </td>
    <td align="center" width="50%" style="border: none; vertical-align: top;">
      <strong>About Squelch</strong><br />
      <sub>Native macOS dark frosted glass HUD dialog</sub><br /><br />
      <img src="docs/screenshots/squelch-about-window.png" width="98%" alt="Squelch About Window" />
    </td>
  </tr>
</table>

---

## Download & Installation

### macOS (Apple Silicon & Intel)

#### Option 1: 1-Line Terminal Install (Recommended — Fast & Hassle-Free)

Run this single command in your Terminal. It downloads the latest release, installs it directly to `/Applications`, configures Gatekeeper permissions automatically, and launches Squelch:

```bash
curl -fsSL https://raw.githubusercontent.com/mrbvrz/squelch/main/install.sh | bash
```

#### Option 2: Manual Download (.dmg or .zip)

Download the ready-to-run package from GitHub Releases:

- 🍏 **[Download Squelch for macOS (.dmg)](https://github.com/mrbvrz/squelch/releases/download/v0.1.2/Squelch-0.1.2-arm64.dmg)**
- 📦 **[Download Squelch for macOS (.zip)](https://github.com/mrbvrz/squelch/releases/download/v0.1.2/Squelch-0.1.2-arm64.zip)**
- 🚀 **[View All Release Assets](https://github.com/mrbvrz/squelch/releases/tag/v0.1.2)**

> [!TIP]
> **First-time launch on macOS:**
> Because Squelch is an independent open-source app distributed outside the paid Apple Developer Program, macOS Gatekeeper may display a prompt on first launch.
>
> To open without issues:
>
> 1. Drag **Squelch.app** into `/Applications`.
> 2. **Right-Click** (or **Control-Click**) `Squelch.app` in `/Applications` and select **Open**.
> 3. Click **Open** on the confirmation dialog. (You only need to do this once).
>
> Alternatively, run this in Terminal after dragging to `/Applications`:
>
> ```bash
> xattr -cr /Applications/Squelch.app
> ```

### Windows & Linux

> [!NOTE]
> **Windows (x64) and Linux (AppImage / .deb) support is in active development!**  
> Squelch's core backend is written in standard Rust with Tauri v2, providing 100% native cross-platform support with minimal system resource consumption.

---

## Support the Project

<p align="left">
  <a href="https://trakteer.id/mrbvrz" target="_blank"><img src="https://edge-cdn.trakteer.id/images/embed/trbtn-red-1.png" height="42" style="border: 0; height: 42px;" alt="Trakteer Saya" /></a>&nbsp;
  <a href="https://www.buymeacoffee.com/mrbvrz" target="_blank"><img src="https://www.owlstown.com/assets/icons/bmc-yellow-button-941f96a1.png" height="42" style="border: 0; height: 42px;" alt="Buy Me A Coffee" /></a>
</p>

- 🇮🇩 **Trakteer**: [https://trakteer.id/mrbvrz](https://trakteer.id/mrbvrz)
- ☕ **Buy Me A Coffee**: [https://www.buymeacoffee.com/mrbvrz](https://www.buymeacoffee.com/mrbvrz)

---

## Key Highlights

- **Ultra-Lightweight Native Performance (Tauri v2 + Rust)**
    - Low RAM consumption (~25–35 MB memory footprint vs. ~160+ MB in legacy frameworks).
    - Instant cold startup under 300ms using system-native WebKit webviews.
    - Robust Rust backend handling atomic JSON persistence, local HTTP proxying, and global window state synchronization.
- **macOS HUD Glass Popover & Animated Waveform**
    - Native macOS HUD translucency window with frosted Bento layout (`backdrop-filter: blur(24px) saturate(180%)`).
    - 12-frame pure white Signed Distance Field (SDF) capsule waveform animation in the menu bar with zero CPU overhead.
    - Quick two-click playback, live audio signal indicators, sleep timer presets (`15m`, `30m`, `60m`) with 1-minute remaining desktop notifications, and instant category filters.
- **Show Schedules & Automated Autoplay**
    - Configure broadcast programs (e.g. _Sarapan Seru_ on Jak 101 FM, Monday–Friday 06:00–10:00).
    - Background scheduler engine with daily slot deduplication and native desktop notifications.
    - Optional _Autoplay_ switch to automatically tune in and stream when your show begins.
    - Live on-air pulsating badge (`🟢 On Air Now`) indicating active broadcasts.
- **Rust Asynchronous ICY Metadata Proxy & Multi-Codec Engine**
    - Background audio engine combining HTML5 Audio with `hls.js` supporting **MP3**, **AAC / HE-AAC**, **OGG / Opus**, and **HLS** (`.m3u8`).
    - High-performance local loopback proxy server (`127.0.0.1`) built with `axum` and `tokio`, requesting `Icy-MetaData: 1`, extracting `StreamTitle` chunks in real time without audio glitching.
    - Automatic stream URL resolver supporting direct streams, `.m3u`, `.pls`, and Noice catalog endpoints (`open.noice.id`).
- **Unified Sidebar & Instant Keyboard Navigation**
    - Integrated mini player deck docked right below the search bar on the left sidebar.
    - Global `⌘F` (macOS) / `Ctrl+F` (Windows/Linux) search shortcut with key badge and auto-focus.
- **Open Public Radio Directory**
    - Search global stations powered by the `radio-browser.info` directory with automatic deduplication.
    - Country selection dropdown with emoji flags and inline audio stream previewing.
- **Listening Analytics**
    - Weekly, Monthly, and Yearly listening duration tracking with interactive bar charts.
    - Resolves actual station names and artwork in the listening statistics deck.
- **Personalization & Custom Themes**
    - System, Light, and Dark window themes matching macOS neutral graphite tones.
    - 8 native macOS accent color palettes and adjustable frosted glass opacity.
    - Custom system font selector with automatic local font discovery.
    - Atomic JSON data backup and restore.

---

<a id="arsitektur--spesifikasi-teknis"></a>
<a id="architecture--technical-specifications"></a>

## Architecture & Technical Specifications

Squelch follows a modern, decoupled architecture pairing a high-performance **Rust backend** (via Tauri v2) with a responsive **React 18 + TypeScript + Vite frontend**:

```text
squelch/
├── src-tauri/                 # Native Rust Backend (Tauri v2)
│   ├── Cargo.toml             # Rust package manifest & release profiles
│   ├── tauri.conf.json        # Tauri v2 window and bundle configuration
│   ├── capabilities/          # Fine-grained security capabilities & permissions
│   └── src/
│       ├── main.rs            # Application entry point
│       ├── lib.rs             # Tray coordinator, menu event handlers & vibrancy
│       ├── commands.rs        # IPC Tauri command handlers (CRUD, audio, notif)
│       ├── store.rs           # Atomic JSON store (AppStore) & state synchronization
│       └── icy_proxy.rs       # Asynchronous ICY metadata demuxer (Tokio + Axum)
├── src/                       # Frontend Web Application (React 18 + Vite)
│   ├── app/                   # Main management window (App.tsx, styles.css)
│   ├── tray/                  # Menu bar tray popover view (TrayPopoverApp.tsx)
│   ├── audio/                 # Headless audio worker (audio-renderer.ts)
│   ├── bridge/                # Tauri IPC bridge & cross-window sync (tauri-bridge.ts)
│   ├── components/            # UI components (StationAvatar, Icons, Modals)
│   ├── i18n/                  # Bilingual localization (Indonesian & English)
│   ├── types/                 # Shared domain TypeScript interfaces & schemas
│   └── utils/                 # Visual appearance, playlist parsers, player state
├── index.html                 # Main window HTML entry
├── tray.html                  # Tray popover HTML entry
├── audio.html                 # Audio transport worker HTML entry
├── vite.config.ts             # Vite multi-entry build configuration
├── tsconfig.json              # Strict TypeScript configuration
├── ARCHITECTURE.md            # Detailed Architecture & Technical Specifications
└── CHANGELOG.md               # Version Release History
```

For detailed specifications on the Rust ICY demuxing protocol, state synchronization, and security model, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

For the complete version history, see **[CHANGELOG.md](CHANGELOG.md)**.

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.x`
- **npm** `>= 10.x`
- **Rust** `>= 1.78` (with `cargo`)
- **macOS** `12+` (Apple Silicon or Intel), **Windows 10/11**, or **Linux**

### Installation

```bash
# Clone the repository
git clone https://github.com/mrbvrz/squelch.git
cd squelch

# Install frontend dependencies
npm install
```

### Build & Run

```bash
# Launch Squelch in development mode (starts Vite dev server & Tauri debug app)
npm run dev

# Or run typecheck and test suites
npm run typecheck
npm test
```

---

## Development Scripts

| Command                | Description                                                           |
| :--------------------- | :-------------------------------------------------------------------- |
| `npm run dev`          | Launches Squelch in live development mode (`tauri dev`).              |
| `npm run build`        | Builds the optimized production frontend bundle (`dist-ui/`).         |
| `npm run tauri:build`  | Builds the production application executable via Tauri.               |
| `npm run tauri:dist`   | Creates the production macOS bundle, codesigns, and generates `.dmg`. |
| `npm test`             | Runs unit and architecture verification test suites with Vitest.      |
| `npm run typecheck`    | Runs strict TypeScript verification across all code (`tsc --noEmit`). |
| `npm run lint`         | Checks TypeScript and React code with ESLint.                         |
| `npm run format`       | Formats all source files, CSS, HTML, and Markdown with Prettier.      |
| `npm run format:check` | Verifies code formatting without modifying files.                     |

---

## Data Storage

All user configuration, schedules, and listening statistics are stored atomically in the operating system's standard application support folder:

- **macOS:** `~/Library/Application Support/com.mrbvrz.squelch/`
- **Windows:** `%APPDATA%\com.mrbvrz.squelch\`
- **Linux:** `~/.config/com.mrbvrz.squelch/`

Files persisted:

- `stations.json` — Station library and category groups
- `schedules.json` — Configured show schedules, alerts, and autoplay preferences
- `settings.json` — User preferences, theme, font, and shortcuts
- `stats.json` — Listening activity and duration history (with station names & logos)

---

## Author & License

- **Author:** [mrbvrz](https://mrbvrz.web.id)
- **Repository:** [https://github.com/mrbvrz/squelch](https://github.com/mrbvrz/squelch)
- **License:** [MIT License](LICENSE)
