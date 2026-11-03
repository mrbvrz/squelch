# Security Policy

The Squelch project takes security and user privacy seriously. We appreciate your efforts to responsibly disclose any vulnerabilities you find.

---

## Supported Versions

We provide security updates and bug fixes for the current and recent minor versions of Squelch.

| Version   | Supported          |
| :-------- | :----------------- |
| `0.1.x`   | :white_check_mark: |
| `< 0.1.0` | :x:                |

---

## Reporting a Vulnerability

> [!CAUTION]
> **Please do not report security vulnerabilities through public GitHub issues, discussions, or social media channels.**

If you discover a security vulnerability in Squelch, please disclose it privately using one of the following methods:

1. **GitHub Private Vulnerability Reporting (Preferred)**:
    - Navigate to the [Security Advisories tab](https://github.com/mrbvrz/squelch/security/advisories) on our GitHub repository.
    - Click **"Report a vulnerability"** to open a confidential advisory draft.
2. **Email**:
    - Send details to **[hasan.suryaman@gmail.com](mailto:hasan.suryaman@gmail.com)** with the subject line: `[Security Vulnerability] Squelch - <Brief Summary>`.

### What to Include in Your Report

To help us triage and resolve the issue quickly, please provide as much information as possible:

- Type of vulnerability (e.g., Tauri IPC command exposure, arbitrary code execution, local stream proxy SSRF, insecure file handling).
- The version of Squelch where the issue was reproduced.
- Operating system and hardware architecture (e.g., macOS 14 Sonoma, Apple Silicon M2).
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any potential remediations or suggestions.

---

## Response Process & Timeline

1. **Initial Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**.
2. **Investigation & Assessment**: We will assess the severity and impact, verifying the vulnerability in a development environment.
3. **Fix & Patch**: We will prepare a patch and coordinate a release timeline.
4. **Public Disclosure**: Once a fix is released in an official version, we will publish a security advisory and credit you for the responsible disclosure (unless you request to remain anonymous).

---

## Security Architecture in Squelch

Squelch is built on top of [Tauri v2](https://v2.tauri.app/), which provides deep defense-in-depth security principles:

- **Tauri IPC Isolation**: WebViews only invoke strictly registered commands in `src-tauri/src/commands/`.
- **Local Audio Streaming**: Live streams and ICY metadata proxies operate over a local loopback (`127.0.0.1`) without exposing open ports to external networks.
- **Local Storage Security**: User settings and custom radio lists are stored locally in macOS application support directories (`~/Library/Application Support/com.mrbvrz.squelch`) using atomic write patterns.

Thank you for helping keep Squelch and its users safe! 🛡️
