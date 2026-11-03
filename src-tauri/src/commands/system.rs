use crate::store::AppStore;
use std::sync::Arc;
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;

static CACHED_FONTS: OnceLock<Vec<String>> = OnceLock::new();

#[tauri::command]
pub fn send_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    // 1. Try standard Tauri notification plugin
    let _ = app
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();

    // 2. On macOS, ensure native Notification Center banner is shown via AppleScript
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let safe_body = body
            .replace('\\', "\\\\")
            .replace('\"', "\\\"")
            .replace('$', "\\$")
            .replace('`', "\\`");
        let safe_title = title
            .replace('\\', "\\\\")
            .replace('\"', "\\\"")
            .replace('$', "\\$")
            .replace('`', "\\`");
        let script = format!(
            "display notification \"{}\" with title \"{}\" sound name \"default\"",
            safe_body, safe_title
        );
        let _ = Command::new("osascript").arg("-e").arg(&script).spawn();
    }

    Ok(())
}

#[tauri::command]
pub fn log_debug(msg: String) {
    println!("[DEBUG] {}", msg);
}

#[tauri::command]
pub fn start_window_drag(window: tauri::WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_dock_visibility(app: AppHandle, visible: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let policy = if visible {
            tauri::ActivationPolicy::Regular
        } else {
            tauri::ActivationPolicy::Accessory
        };
        app.set_activation_policy(policy)
            .map_err(|e| format!("Gagal mengubah visibilitas dock: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
    CACHED_FONTS
        .get_or_init(|| {
            #[cfg(target_os = "macos")]
            {
                if let Ok(output) = std::process::Command::new("osascript")
                    .args([
                        "-l",
                        "JavaScript",
                        "-e",
                        "ObjC.import('AppKit'); $.NSFontManager.sharedFontManager.availableFontFamilies.js.map(x => x.js).join('\\n')",
                    ])
                    .output()
                {
                    if output.status.success() {
                        let text = String::from_utf8_lossy(&output.stdout);
                        let mut list: Vec<String> = text
                            .lines()
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty() && !s.starts_with('.'))
                            .collect();
                        list.sort();
                        list.dedup();
                        if !list.is_empty() {
                            return list;
                        }
                    }
                }
            }

            #[cfg(target_os = "linux")]
            {
                if let Ok(output) = std::process::Command::new("fc-list")
                    .args([":", "family"])
                    .output()
                {
                    if output.status.success() {
                        let text = String::from_utf8_lossy(&output.stdout);
                        let mut list: Vec<String> = text
                            .lines()
                            .flat_map(|line| line.split(','))
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty() && !s.starts_with('.'))
                            .collect();
                        list.sort();
                        list.dedup();
                        if !list.is_empty() {
                            return list;
                        }
                    }
                }
            }

            // Fallback default system fonts
            let mut fonts = vec![
                "SF Pro Text".to_string(),
                "SF Pro Display".to_string(),
                "SF Pro Rounded".to_string(),
                "SF Mono".to_string(),
                "Helvetica Neue".to_string(),
                "Avenir Next".to_string(),
                "Avenir".to_string(),
                "Menlo".to_string(),
                "Monaco".to_string(),
                "Geneva".to_string(),
                "Optima".to_string(),
                "Futura".to_string(),
                "Gill Sans".to_string(),
                "Georgia".to_string(),
                "Palatino".to_string(),
                "Segoe UI".to_string(),
                "Inter".to_string(),
                "Arial".to_string(),
                "Verdana".to_string(),
                "Trebuchet MS".to_string(),
                "Courier New".to_string(),
            ];
            fonts.sort();
            fonts
        })
        .clone()
}

#[tauri::command]
pub fn set_tray_state(state_name: String, store: State<Arc<AppStore>>) {
    *store.tray_state.lock().unwrap() = state_name;
}

#[tauri::command]
pub fn open_window_tab(app: AppHandle, tab: String) -> Result<(), String> {
    if let Some(win) = crate::show_main_window(&app) {
        if tab == "updates" {
            let _ = win.eval("window.dispatchEvent(new CustomEvent('squelch:check-updates')); setTimeout(function(){ window.dispatchEvent(new CustomEvent('squelch:check-updates')); }, 50);");
            let _ = app.emit("ui:open-update-modal", ());
        } else if tab == "about" {
            let _ = win.eval("window.dispatchEvent(new CustomEvent('squelch:open-about')); setTimeout(function(){ window.dispatchEvent(new CustomEvent('squelch:open-about')); }, 50);");
            let _ = app.emit("squelch:open-about", ());
        } else {
            let _ = win.eval(&format!("window.location.hash = '#{}';", tab));
            let _ = win.eval(&format!(
                "window.dispatchEvent(new CustomEvent('squelch:navigate', {{ detail: '{}' }}));",
                tab
            ));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_about_window(app: AppHandle) -> Result<(), String> {
    let main_visible = app
        .get_webview_window("main")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false);
    if main_visible {
        if let Some(win) = crate::show_main_window(&app) {
            let _ = win.eval("window.dispatchEvent(new CustomEvent('squelch:open-about')); setTimeout(function(){ window.dispatchEvent(new CustomEvent('squelch:open-about')); }, 50);");
            let _ = app.emit("squelch:open-about", ());
        }
    } else if let Some(tray_win) = crate::show_tray_popover(&app) {
        let _ = tray_win.eval("window.dispatchEvent(new CustomEvent('squelch:open-about')); setTimeout(function(){ window.dispatchEvent(new CustomEvent('squelch:open-about')); }, 50);");
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_tray_popover(app: AppHandle) -> Result<(), String> {
    if let Some(tray_win) = app.get_webview_window("tray") {
        if tray_win.is_visible().unwrap_or(false) {
            let _ = tray_win.hide();
        } else {
            let _ = crate::show_tray_popover(&app);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn open_external(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if !trimmed.starts_with("https://")
        && !trimmed.starts_with("http://")
        && !trimmed.starts_with("mailto:")
    {
        return Err("Blocked unsafe URL scheme".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(trimmed).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/c", "start", trimmed])
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(trimmed).spawn();
    }
    Ok(())
}
