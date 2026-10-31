# Squelch

Lightweight, cross-platform menu bar internet radio player (macOS first, architected for Windows and Linux) featuring a **macOS HUD Glass Bento UI**, real-time ICY metadata extraction, HLS (`.m3u8`) + Icecast/Shoutcast (`MP3`, `AAC/HE-AAC`, `OGG/Opus`) playback, and 28 verified Indonesian radio stations out of the box.

Repository: [http://github.com/mrbvrz/squelch](http://github.com/mrbvrz/squelch)

---

## Key Features

- **Animated Menu Bar Waveform Icon**
  - Crisp, anti-aliased pure white 5-bar capsule waveform icon (`18x18` `@1x` and `36x36` `@2x` Retina rendered via Signed Distance Fields).
  - Pre-rendered 12-frame smooth animation in memory (`0%` CPU overhead) when streaming (`playing`) or connecting (`buffering`), without cluttering the menu bar with text.
- **Unified macOS Glass Bento Interface**
  - Both the **Menu Bar Tray Popover** and the **Management Window** share the same native macOS HUD vibrancy (`vibrancy: 'hud'`) and frosted Bento glass cards (`backdrop-filter: blur(24px) saturate(180%)`).
  - Instant 2-click playback, live signal spectrum indicator, sleep timer (`15m`, `30m`, `60m`), category filter pills, and station search directly from the menu bar.
- **Resilient Audio Engine & ICY Metadata Proxy**
  - Headless audio worker combining native `HTMLAudioElement` + `hls.js` for `MP3`, `AAC/AAC+`, `OGG/Opus`, and `HLS (.m3u8)` streams.
  - Local loopback `LocalIcyProxyServer` (`127.0.0.1`) requests `Icy-MetaData: 1`, strips `icy-metaint` blocks cleanly from the audio byte stream, and emits live `StreamTitle` updates without audio glitches.
  - Automatic stream resolver for `.m3u`, `.pls`, and **Noice** catalog URLs (`https://open.noice.id/catalog/...`).
  - Exponential backoff reconnect with random jitter on network drops, plus automatic pause/resume on macOS sleep/wake and audio output device removal.
- **Station Management & Online Discovery**
  - Add, edit, delete, reorder (drag & drop), and categorize stations with a built-in **Test Stream** validator (verifies HTTP status, `Content-Type`, codec, and initial audio buffer).
  - **Online Discovery** powered by the `radio-browser.info` API (with automatic multi-mirror failover across `de1`, `fi1`, `at1`) for one-click preview and import.
  - **Parallel Health Checker** (bounded concurrency) to detect and clean up offline streams.
  - **Import / Export** in native `JSON`, `M3U`, and `PLS` formats with duplicate handling (`skip`, `overwrite`, `duplicate`).
- **28 Verified Indonesian Radio Seed Stations**
  - Ships with `resources/stations.seed.json` containing 28 verified active streams across Jakarta, Surabaya, Bandung, Yogyakarta, Solo, Bali, Medan, Makassar, and Pekanbaru (including Jak 101 FM, Gen 98.7 FM, Kis 95.1 FM, Most Radio 105.8 FM, Mustang 88 FM, Hot 93.2 FM, I-Radio, Hard Rock FM, Elshinta, Suara Surabaya, RRI Pro 3, Sindo Trijaya, and more).

---

<a id="arsitektur--spesifikasi-teknis"></a>

## Arsitektur & Spesifikasi Teknis (Architecture)

Squelch strictly separates domain logic from OS-specific APIs and UI rendering:

```text
squelch/
├── src/
│   ├── core/                  # 100% OS-agnostic domain layer (zero Electron/DOM imports)
│   │   ├── player/            # State machine, PlayerController, ICY proxy, stream tester, backoff
│   │   ├── stations/          # Station repository, M3U/PLS/JSON parser, parallel health checker
│   │   ├── discover/          # radio-browser.info client with mirror failover
│   │   ├── settings/          # Settings & runtime state models and repository
│   │   ├── storage/           # Atomic JSON store (.tmp + fsync + rename) & schema migrations
│   │   ├── events/            # Strongly-typed EventBus
│   │   └── diagnostics/       # Rotating file logger & diagnostics builder
│   ├── platform/              # OS-specific adapters behind common interfaces (ITrayAdapter, ISystemIntegrationAdapter)
│   │   ├── macos/             # macOS Menu Bar Tray, SDF icon generator, LSUIElement Dock manager, power monitor
│   │   ├── windows/           # Windows system tray & auto-start adapter (Phase 2)
│   │   └── linux/             # Linux AppIndicator & XDG autostart adapter (Phase 3)
│   ├── main/                  # Electron main process composition root, WindowManager, typed IPC handlers
│   └── ui/                    # React + Tailwind CSS renderer views
│       ├── tray-popover/      # Menu bar Bento Glass popover (tray.html)
│       ├── app/               # Manage Stations, Discover, Preferences & Diagnostics window (index.html)
│       ├── audio-worker/      # Hidden headless audio transport & MediaSession bridge (audio.html)
│       └── components/        # Shared 1.75px stroke SVG icons
├── resources/
│   ├── stations.seed.json     # 28 verified Indonesian radio stations
│   ├── stations.seed-report.md# Verification report & rejected dead candidates
│   └── icons/                 # Generated @1x and @2x tray icons
├── scripts/
│   ├── verify-seed.ts         # Automated stream verifier & seed generator
│   └── generate-icons.ts      # SDF PNG tray icon generator
└── tests/
    ├── unit/                  # State machine, atomic storage, M3U/PLS parser unit tests
    └── integration/           # Architectural boundary verification tests
```

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.x`
- **npm** `>= 10.x`
- **macOS** `12+` (Apple Silicon or Intel) for Phase 1 native HUD vibrancy and menu bar integration

### Installation

```bash
npm install
```

### Build & Run

```bash
# Compile TypeScript main process + Vite UI bundles
npm run build

# Launch Squelch in the macOS menu bar
npm start

# Or build and run in one command
npm run dev
```

---

## Development Scripts

| Command                | Description                                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------- |
| `npm run build`        | Builds both the Electron main process (`dist/`) and Vite UI bundles (`dist-ui/`).                  |
| `npm start`            | Starts the compiled Electron application.                                                          |
| `npm run dev`          | Builds and launches the application.                                                               |
| `npm test`             | Runs unit and architectural boundary tests via Vitest.                                             |
| `npm run typecheck`    | Runs strict TypeScript checks across `tsconfig.main.json` and `tsconfig.ui.json`.                  |
| `npm run format`       | Formats all TypeScript, React, CSS, HTML, JSON, and Markdown files with Prettier.                  |
| `npm run format:check` | Verifies code formatting without modifying files.                                                  |
| `npm run verify:seed`  | Re-verifies all candidate Indonesian radio streams and regenerates `resources/stations.seed.json`. |
| `npm run dist:mac`     | Packages the macOS application bundle via `electron-builder`.                                      |

---

## Local Data Storage

All user data is persisted atomically (`write to .tmp` -> `fsync` -> `atomic rename`) in the standard OS application support directory:

- **macOS:** `~/Library/Application Support/Squelch/`
- **Windows:** `%APPDATA%\Squelch\`
- **Linux:** `~/.config/Squelch/`

Files stored:

- `stations.json` — User station list and categories (seeded from `resources/stations.seed.json` on first run)
- `settings.json` — User preferences and global keyboard shortcuts
- `state.json` — Last played station ID
- `stats.json` — Weekly, monthly, and yearly listening duration statistics
- `logs/squelch.log` — Rotating application log (`<= 1 MB`)
