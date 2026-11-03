# Contributing to Squelch

First off, thank you for considering contributing to Squelch! 🎉

Squelch is a lightweight, cross-platform menu bar internet radio player (macOS-first, built with [Tauri v2](https://v2.tauri.app/), React 18, and Rust). Whether you are reporting a bug, suggesting an aesthetic improvement, or submitting a pull request, your help makes this project better for everyone.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
    - [Reporting Bugs](#reporting-bugs)
    - [Suggesting Features & Enhancements](#suggesting-features--enhancements)
    - [Adding Verified Radio Stations](#adding-verified-radio-stations)
    - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Local Installation](#local-installation)
    - [Development Commands](#development-commands)
- [Architecture & Conventions](#architecture--conventions)
    - [State Management Rule](#state-management-rule)
    - [Directory Structure](#directory-structure)
    - [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project and everyone participating in it is governed by the [Squelch Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [hasan.suryaman@gmail.com](mailto:hasan.suryaman@gmail.com).

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing [GitHub Issues](https://github.com/mrbvrz/squelch/issues) to ensure the problem has not already been reported.

When creating a bug report using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml), please include:

- A clear, descriptive title.
- Your macOS version (e.g., macOS 14 Sonoma, macOS 15 Sequoia) and hardware architecture (Apple Silicon M1-M4 vs Intel x86_64).
- The exact version of Squelch (e.g., `v0.1.3`).
- Steps to reproduce the issue.
- Relevant stream URL (if playback or metadata related).
- Screenshots or console logs if applicable.

### Suggesting Features & Enhancements

Feature requests are very welcome! Please submit suggestions using our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml), describing:

- The problem you are trying to solve.
- The proposed solution and why it would benefit macOS radio listeners.
- Any alternative solutions or ideas considered.

### Adding Verified Radio Stations

Squelch comes with initial verified default stations and supports querying the public Radio Browser directory. If you'd like to suggest adding high-quality stations to defaults, ensure the stream:

1. Supports HTTPS or standard HTTP audio streaming (`audio/mpeg`, `audio/aac`, or HLS `.m3u8`).
2. Provides reliable 24/7 uptime and ICY title metadata where available.

### Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
    ```bash
    git checkout -b feat/my-new-feature
    ```
2. Follow existing code styles and architecture guidelines.
3. Ensure all tests and linting pass before submitting:
    ```bash
    npm run typecheck
    npm run lint
    npm test
    cargo check --manifest-path src-tauri/Cargo.toml
    ```
4. Submit a Pull Request following our [PR Template](.github/pull_request_template.md).

---

## Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher (`npm v10+`)
- **Rust Toolchain**: Stable Rust compiler (`rustc 1.80+` or `rustc 1.90+`) and `cargo`
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
- **macOS Dependencies**: Xcode Command Line Tools
    ```bash
    xcode-select --install
    ```

### Local Installation

1. Clone your fork:
    ```bash
    git clone https://github.com/<your-username>/squelch.git
    cd squelch
    ```
2. Install npm dependencies:
    ```bash
    npm ci
    ```

### Development Commands

| Command                                            | Description                                                       |
| :------------------------------------------------- | :---------------------------------------------------------------- |
| `npm run dev` / `npm run tauri:dev`                | Runs the full Tauri desktop application in live-reload dev mode   |
| `npm run dev:ui`                                   | Starts the Vite development server only (`http://localhost:1420`) |
| `npm run typecheck`                                | Validates TypeScript compilation with `tsc --noEmit`              |
| `npm run lint`                                     | Runs ESLint across all source and test files                      |
| `npm run format`                                   | Formats all code with Prettier                                    |
| `npm test`                                         | Runs the full Vitest unit test suite                              |
| `npm run tauri:build`                              | Compiles production macOS `.app` bundle                           |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Validates the Rust backend code                                   |

---

## Architecture & Conventions

### State Management Rule

> [!IMPORTANT]
> **Strict Architecture Rule**: Do NOT introduce heavyweight global state libraries (such as Zustand, Redux Toolkit, or MobX). Squelch maintains extreme memory efficiency and sub-second startup times by utilizing:
>
> - Domain-specific React custom hooks (e.g., `useStationManagement`, `useAppCoreData`).
> - Lightweight Tauri IPC events (`ui:state-changed`) bridging the Rust store and WebViews.
> - Modular pure utility functions in `src/utils/` and `src/bridge/`.

### Directory Structure

```text
squelch/
├── .github/              # CI/CD Workflows, issue templates, and funding
├── src/
│   ├── app/              # Main application window (tabs, header, settings)
│   ├── audio/            # Dedicated background audio worker webview
│   ├── bridge/           # Tauri IPC bridge, radio directory, backup & sleep
│   ├── components/       # Reusable UI icons, modal dialogs, and avatars
│   ├── i18n/             # Localization dictionary (English & Bahasa Indonesia)
│   ├── tray/             # macOS Status Bar Popover window & state deck
│   └── types/            # Shared TypeScript data models
├── src-tauri/            # Native Rust backend (Tauri v2, axum proxy, tray, audio)
│   ├── src/
│   │   ├── commands/     # Modular Tauri command handlers
│   │   ├── lib.rs        # App runtime entrypoint and window setup
│   │   └── store.rs      # Thread-safe in-memory state & disk synchronization
│   └── tauri.conf.json   # Tauri v2 configuration
└── tests/                # Unit and integration test suites (Vitest)
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature (e.g., `feat(stations): add horizontal scroll for categories`)
- `fix:` A bug fix (e.g., `fix(audio): handle network reconnect with exponential backoff`)
- `perf:` Performance optimization (e.g., `perf(tray): eliminate layout loop on status change`)
- `refactor:` Code refactoring without changing user-facing behavior
- `test:` Adding or updating unit tests
- `docs:` Documentation improvements
- `chore:` Dependency bumps, CI configuration, or tooling maintenance

---

## Pull Request Process

1. Open PR against the `main` branch.
2. Fill out the Pull Request template completely.
3. Automated GitHub Actions CI will run linting, TypeScript checking, unit tests, and Cargo validation.
4. Once reviewed and approved by maintainers, your changes will be merged into `main`!

Thank you for contributing to Squelch! 📻✨
