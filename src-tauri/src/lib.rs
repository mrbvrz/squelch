mod commands;
mod icy_proxy;
mod store;

use std::sync::Arc;
use store::AppStore;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_positioner::{Position, WindowExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_handle = app.handle().clone();

            // 1. Start local ICY streaming proxy server
            let proxy_port = tauri::async_runtime::block_on(async {
                icy_proxy::start_proxy_server(app_handle.clone()).await
            });

            // 2. Initialize state store
            let store = Arc::new(AppStore::new(&app_handle, proxy_port));
            app.manage(store);

            // 3. Configure macOS Vibrancy effects
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                if let Some(tray_win) = app.get_webview_window("tray") {
                    let _ = apply_vibrancy(
                        &tray_win,
                        NSVisualEffectMaterial::HudWindow,
                        None,
                        Some(16.0),
                    );
                }
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = apply_vibrancy(
                        &main_win,
                        NSVisualEffectMaterial::Sidebar,
                        None,
                        Some(16.0),
                    );
                }
            }

            // 4. Auto-hide tray popover when it loses focus
            if let Some(tray_win) = app.get_webview_window("tray") {
                let tray_clone = tray_win.clone();
                tray_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = tray_clone.hide();
                    }
                });
            }

            // 5. Build Tray Context Menu
            let menu_open = MenuItemBuilder::with_id("open_squelch", "Buka Squelch").build(app)?;
            let menu_about = MenuItemBuilder::with_id("about_squelch", "Tentang Squelch").build(app)?;
            let menu_quit = MenuItemBuilder::with_id("quit_squelch", "Keluar Squelch").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&menu_open)
                .item(&menu_about)
                .separator()
                .item(&menu_quit)
                .build()?;

            // 6. Build System Tray Icon
            let icon_image = app.default_window_icon().cloned().unwrap();
            let _tray = TrayIconBuilder::new()
                .icon(icon_image)
                .tooltip("Squelch - Menu Bar Internet Radio")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "open_squelch" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    "about_squelch" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.eval("window.location.hash = '#about';");
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    "quit_squelch" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("tray") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.as_ref().window().move_window(Position::TrayCenter);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_proxy_port,
            commands::get_stations_data,
            commands::save_station,
            commands::delete_station,
            commands::save_groups,
            commands::get_settings,
            commands::update_settings,
            commands::reset_settings,
            commands::get_schedules,
            commands::save_schedule,
            commands::delete_schedule,
            commands::get_listening_stats,
            commands::open_window_tab,
            commands::open_about_window,
            commands::toggle_tray_popover,
            commands::quit_app,
            commands::open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
