mod commands;
mod icy_proxy;
mod store;

use std::sync::{
    Arc,
    atomic::{AtomicU64, Ordering},
};
use std::time::{SystemTime, UNIX_EPOCH};

fn current_time_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}
use store::AppStore;
use tauri::{
    Emitter, Manager,
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use tauri_plugin_positioner::{Position, WindowExt};

static IDLE_ICON: &[u8] = include_bytes!("../icons/tray/tray_idle.png");
static ERROR_ICON: &[u8] = include_bytes!("../icons/tray/tray_error.png");

static PLAYING_ICONS: [&[u8]; 12] = [
    include_bytes!("../icons/tray/tray_playing_0.png"),
    include_bytes!("../icons/tray/tray_playing_1.png"),
    include_bytes!("../icons/tray/tray_playing_2.png"),
    include_bytes!("../icons/tray/tray_playing_3.png"),
    include_bytes!("../icons/tray/tray_playing_4.png"),
    include_bytes!("../icons/tray/tray_playing_5.png"),
    include_bytes!("../icons/tray/tray_playing_6.png"),
    include_bytes!("../icons/tray/tray_playing_7.png"),
    include_bytes!("../icons/tray/tray_playing_8.png"),
    include_bytes!("../icons/tray/tray_playing_9.png"),
    include_bytes!("../icons/tray/tray_playing_10.png"),
    include_bytes!("../icons/tray/tray_playing_11.png"),
];

static BUFFERING_ICONS: [&[u8]; 12] = [
    include_bytes!("../icons/tray/tray_buffering_0.png"),
    include_bytes!("../icons/tray/tray_buffering_1.png"),
    include_bytes!("../icons/tray/tray_buffering_2.png"),
    include_bytes!("../icons/tray/tray_buffering_3.png"),
    include_bytes!("../icons/tray/tray_buffering_4.png"),
    include_bytes!("../icons/tray/tray_buffering_5.png"),
    include_bytes!("../icons/tray/tray_buffering_6.png"),
    include_bytes!("../icons/tray/tray_buffering_7.png"),
    include_bytes!("../icons/tray/tray_buffering_8.png"),
    include_bytes!("../icons/tray/tray_buffering_9.png"),
    include_bytes!("../icons/tray/tray_buffering_10.png"),
    include_bytes!("../icons/tray/tray_buffering_11.png"),
];

pub(crate) fn show_main_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
        Some(win)
    } else {
        if let Ok(win) = tauri::WebviewWindowBuilder::new(
            app,
            "main",
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title("Squelch")
        .inner_size(980.0, 680.0)
        .min_inner_size(880.0, 560.0)
        .resizable(true)
        .transparent(true)
        .hidden_title(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .build()
        {
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};
                let _ = apply_vibrancy(&win, NSVisualEffectMaterial::Sidebar, None, Some(18.0));
            }
            let _ = win.show();
            let _ = win.unminimize();
            let _ = win.set_focus();
            Some(win)
        } else {
            None
        }
    }
}

pub(crate) fn show_tray_popover(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    if let Some(tray_win) = app.get_webview_window("tray") {
        let _ = tray_win.as_ref().window().move_window(Position::TrayCenter);
        let _ = tray_win.show();
        let _ = tray_win.set_focus();
        Some(tray_win)
    } else {
        None
    }
}

pub fn update_tray_icon(app: &tauri::AppHandle, state: &str) {
    let bytes = match state {
        "playing" => PLAYING_ICONS[0],
        "buffering" | "reconnecting" | "connecting" => BUFFERING_ICONS[0],
        "error" => ERROR_ICON,
        _ => IDLE_ICON,
    };
    if let Some(tray) = app.tray_by_id("main-tray") {
        if let Ok(img) = Image::from_bytes(bytes) {
            let _ = tray.set_icon_with_as_template(Some(img), true);
        }
    }
}

fn handle_menu_action(app: &tauri::AppHandle, id: &str) {
    match id {
        "play_pause" => {
            let _ = app.emit(
                "squelch:action",
                serde_json::json!({ "action": "toggle-play-pause" }),
            );
        }
        "stop" => {
            let _ = app.emit("squelch:action", serde_json::json!({ "action": "stop" }));
        }
        "open_squelch" => {
            let _ = show_main_window(app);
        }
        "stations_squelch" => {
            if let Some(win) = show_main_window(app) {
                let _ = app.emit(
                    "ui:state-changed",
                    serde_json::json!({ "type": "navigate", "tab": "stations" }),
                );
                let _ = win.emit("squelch:navigate", "stations");
                let _ = win.eval(
                    "window.dispatchEvent(new CustomEvent('squelch:navigate', { detail: 'stations' }));",
                );
            }
        }
        "pref_squelch" => {
            if let Some(win) = show_main_window(app) {
                let _ = app.emit(
                    "ui:state-changed",
                    serde_json::json!({ "type": "navigate", "tab": "preferences" }),
                );
                let _ = win.emit("squelch:navigate", "preferences");
                let _ = win.eval(
                    "window.dispatchEvent(new CustomEvent('squelch:navigate', { detail: 'preferences' }));",
                );
            }
        }
        "update_squelch" => {
            if let Some(win) = show_main_window(app) {
                let _ = win.eval("window.dispatchEvent(new CustomEvent('squelch:check-updates'));");
            }
            let _ = app.emit("ui:open-update-modal", ());
        }
        "tray_about_squelch" | "about_squelch" => {
            if let Some(tray_win) = app.get_webview_window("tray") {
                let _ = tray_win.hide();
            }
            if let Some(win) = show_main_window(app) {
                let _ = win.emit("squelch:open-about", ());
                let _ =
                    win.eval("window.dispatchEvent(new CustomEvent('squelch:open-about'));");
            }
        }
        "tray_quit_squelch" | "quit_squelch" => {
            let store = app.state::<Arc<AppStore>>();
            let settings = store.read_json("settings.json", serde_json::json!({}));
            let confirm_quit = settings
                .get("confirmBeforeQuit")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            if !confirm_quit {
                app.exit(0);
            } else {
                if let Some(tray_win) = app.get_webview_window("tray") {
                    let _ = tray_win.hide();
                }
                if let Some(win) = show_main_window(app) {
                    let _ = win.emit("squelch:confirm-quit", ());
                    let _ =
                        win.eval("window.dispatchEvent(new CustomEvent('squelch:confirm-quit'));");
                }
            }
        }
        _ => {}
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
            app.manage(store.clone());

            // 2b. Apply macOS Dock Visibility Policy
            #[cfg(target_os = "macos")]
            {
                let settings = store.read_json("settings.json", serde_json::json!({}));
                let hide_from_dock = settings
                    .get("hideFromDock")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                if hide_from_dock {
                    let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                }
            }

            // 3. Configure macOS Vibrancy effects
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = apply_vibrancy(
                        &main_win,
                        NSVisualEffectMaterial::Sidebar,
                        None,
                        Some(18.0),
                    );
                }
            }

            // Open devtools in debug mode only when SQUELCH_DEVTOOLS=1
            #[cfg(debug_assertions)]
            {
                if std::env::var("SQUELCH_DEVTOOLS")
                    .map(|v| v == "1")
                    .unwrap_or(false)
                {
                    if let Some(main_win) = app.get_webview_window("main") {
                        main_win.open_devtools();
                    }
                }
            }

            // 4. Auto-hide tray popover when it loses focus, tracking blur timestamp to prevent click bounce
            let last_blur_time = Arc::new(AtomicU64::new(0));
            let last_blur_for_win = Arc::clone(&last_blur_time);
            let last_blur_for_tray = Arc::clone(&last_blur_time);

            if let Some(tray_win) = app.get_webview_window("tray") {
                let tray_clone = tray_win.clone();
                tray_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        last_blur_for_win.store(current_time_millis(), Ordering::SeqCst);
                        let _ = tray_clone.hide();
                    }
                });
            }

            // 5. Build Rich Tray Context Menu
            let menu_status = MenuItemBuilder::with_id("status", "Squelch Radio")
                .enabled(false)
                .build(app)?;
            let menu_play_pause =
                MenuItemBuilder::with_id("play_pause", "Putar / Jeda").build(app)?;
            let menu_stop = MenuItemBuilder::with_id("stop", "Hentikan").build(app)?;

            let menu_open =
                MenuItemBuilder::with_id("open_squelch", "Buka Jendela Utama").build(app)?;
            let menu_stations =
                MenuItemBuilder::with_id("stations_squelch", "Stasiun Radio").build(app)?;
            let menu_pref = MenuItemBuilder::with_id("pref_squelch", "Pengaturan").build(app)?;
            let menu_about =
                MenuItemBuilder::with_id("tray_about_squelch", "Tentang Squelch").build(app)?;
            let menu_quit =
                MenuItemBuilder::with_id("tray_quit_squelch", "Keluar Squelch").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&menu_status)
                .separator()
                .item(&menu_play_pause)
                .item(&menu_stop)
                .separator()
                .item(&menu_open)
                .item(&menu_stations)
                .item(&menu_pref)
                .item(&menu_about)
                .separator()
                .item(&menu_quit)
                .build()?;

            // Build macOS Native Application Menu Bar
            let app_menu_about =
                MenuItemBuilder::with_id("about_squelch", "Tentang Squelch").build(app)?;
            let app_menu_update =
                MenuItemBuilder::with_id("update_squelch", "Periksa Pembaruan...").build(app)?;
            let app_menu_pref = MenuItemBuilder::with_id("pref_squelch", "Pengaturan...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;
            let app_menu_quit = MenuItemBuilder::with_id("quit_squelch", "Keluar Squelch")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;

            let app_submenu = SubmenuBuilder::new(app, "Squelch")
                .item(&app_menu_about)
                .item(&app_menu_update)
                .separator()
                .item(&app_menu_pref)
                .separator()
                .item(&PredefinedMenuItem::hide(app, Some("Sembunyikan Squelch"))?)
                .item(&PredefinedMenuItem::hide_others(
                    app,
                    Some("Sembunyikan Lainnya"),
                )?)
                .item(&PredefinedMenuItem::show_all(app, Some("Tampilkan Semua"))?)
                .separator()
                .item(&app_menu_quit)
                .build()?;

            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, None)?)
                .item(&PredefinedMenuItem::redo(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, None)?)
                .item(&PredefinedMenuItem::copy(app, None)?)
                .item(&PredefinedMenuItem::paste(app, None)?)
                .item(&PredefinedMenuItem::select_all(app, None)?)
                .build()?;

            let window_submenu = SubmenuBuilder::new(app, "Jendela")
                .item(&PredefinedMenuItem::minimize(app, None)?)
                .item(&PredefinedMenuItem::close_window(app, None)?)
                .build()?;

            let app_menu = MenuBuilder::new(app)
                .item(&app_submenu)
                .item(&edit_submenu)
                .item(&window_submenu)
                .build()?;

            let _ = app.set_menu(app_menu);
            app.on_menu_event(move |app, event| {
                handle_menu_action(app, event.id().as_ref());
            });

            // 6. Build System Tray Icon with Template Icon
            let init_icon = Image::from_bytes(IDLE_ICON).expect("failed to load initial tray icon");

            let tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("Squelch - Menu Bar Internet Radio")
                .icon(init_icon)
                .icon_as_template(true)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    handle_menu_action(app, event.id().as_ref());
                })
                .on_tray_icon_event(move |tray, event| {
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
                            let now = current_time_millis();
                            let last_blur = last_blur_for_tray.load(Ordering::SeqCst);
                            let recently_blurred = now.saturating_sub(last_blur) < 300;

                            // Standard macOS menu bar toggle behavior:
                            // If popover was already visible or was just dismissed by this click, hide it.
                            if is_visible || recently_blurred {
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

            let _ = tray.set_icon_as_template(true);

            // 7. Spawn Tray Icon Animation Loop
            let app_handle_for_anim = app.handle().clone();
            let store_clone = app.state::<Arc<AppStore>>().inner().clone();
            tauri::async_runtime::spawn(async move {
                let mut current_frame = 0usize;
                let mut last_rendered_state = String::new();

                loop {
                    let state = {
                        let guard = store_clone.tray_state.lock().unwrap();
                        guard.clone()
                    };

                    let is_animated = matches!(
                        state.as_str(),
                        "playing" | "buffering" | "connecting" | "reconnecting"
                    );

                    if is_animated {
                        let icon_bytes = if state == "playing" {
                            PLAYING_ICONS[current_frame % PLAYING_ICONS.len()]
                        } else {
                            BUFFERING_ICONS[current_frame % BUFFERING_ICONS.len()]
                        };

                        if let Some(tray) = app_handle_for_anim.tray_by_id("main-tray") {
                            if let Ok(img) = Image::from_bytes(icon_bytes) {
                                let _ = tray.set_icon_with_as_template(Some(img), true);
                            }
                        }

                        current_frame = current_frame.wrapping_add(1);
                        last_rendered_state = state;
                        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                    } else {
                        if last_rendered_state != state {
                            let icon_bytes = if state == "error" {
                                ERROR_ICON
                            } else {
                                IDLE_ICON
                            };

                            if let Some(tray) = app_handle_for_anim.tray_by_id("main-tray") {
                                if let Ok(img) = Image::from_bytes(icon_bytes) {
                                    let _ = tray.set_icon_with_as_template(Some(img), true);
                                }
                            }
                            last_rendered_state = state;
                            current_frame = 0;
                        }
                        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                    }
                }
            });

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
            commands::save_listening_stats,
            commands::get_system_fonts,
            commands::set_tray_state,
            commands::test_stream_url,
            commands::reorder_stations,
            commands::rename_group,
            commands::delete_group,
            commands::open_window_tab,
            commands::open_about_window,
            commands::prompt_quit,
            commands::toggle_tray_popover,
            commands::quit_app,
            commands::open_external,
            commands::start_window_drag,
            commands::set_dock_visibility,
            commands::check_for_updates,
            commands::start_download_update,
            commands::cancel_update_download,
            commands::open_update_installer,
            commands::reveal_update_in_finder,
            commands::send_notification,
            commands::get_audio_output_devices,
            commands::log_debug,
            commands::get_player_status,
            commands::update_player_status,
            commands::clear_stations_data,
            commands::clear_schedules_data,
            commands::clear_listening_stats,
            commands::reset_all_data
        ])
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
