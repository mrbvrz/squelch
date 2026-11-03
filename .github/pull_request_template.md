## Description

Please include a summary of the changes and the related issue (if applicable). Please also include relevant motivation and context.

Fixes #(issue)

---

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] ⚡ Performance improvement (code optimization, reduced memory usage)
- [ ] 🎨 UI / UX refinement (styling, themes, layout alignment)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] 📝 Documentation update (README, docs, or comments)
- [ ] 🔧 Tooling or CI/CD change

---

## Architecture & Code Standards Checklist

- [ ] **No Heavy State Libraries**: I did NOT introduce Zustand, Redux Toolkit, or other heavyweight global state managers.
- [ ] **TypeScript Check**: `npm run typecheck` passed with 0 errors.
- [ ] **Linting**: `npm run lint` passed with 0 errors and 0 warnings.
- [ ] **Unit Tests**: `npm test` ran and all tests passed.
- [ ] **Rust Backend**: `cargo check --manifest-path src-tauri/Cargo.toml` compiled without errors.
- [ ] **Tested on macOS**: Verified visually in the main window and the menu bar tray popover.

---

## Screenshots / Visual Comparison (Optional)

| Before | After |
| :---: | :---: |
| *(Image or N/A)* | *(Image or N/A)* |
