use crate::store::AppStore;
use serde_json::{Value, json};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub fn get_proxy_port(store: State<Arc<AppStore>>) -> u16 {
    *store.proxy_port.lock().unwrap()
}

#[tauri::command]
pub fn get_stations_data(store: State<Arc<AppStore>>) -> Value {
    store.read_json(
        "stations.json",
        json!({
            "schemaVersion": 1,
            "stations": [],
            "groups": [
                "Pop & Anak Muda",
                "Nasional & Berita",
                "Lainnya & Nostalgia"
            ]
        }),
    )
}

#[tauri::command]
pub fn save_station(store: State<Arc<AppStore>>, station: Value) -> Result<(), String> {
    let mut data = get_stations_data(store.clone());
    let stations = data
        .get_mut("stations")
        .and_then(|v| v.as_array_mut())
        .ok_or("Invalid stations data")?;

    let id = station
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if let Some(pos) = stations
        .iter()
        .position(|s| s.get("id").and_then(|v| v.as_str()) == Some(&id))
    {
        stations[pos] = station;
    } else {
        stations.push(station);
    }

    store.write_json("stations.json", &data)
}

#[tauri::command]
pub fn delete_station(store: State<Arc<AppStore>>, id: String) -> Result<(), String> {
    let mut data = get_stations_data(store.clone());
    let stations = data
        .get_mut("stations")
        .and_then(|v| v.as_array_mut())
        .ok_or("Invalid stations data")?;

    stations.retain(|s| s.get("id").and_then(|v| v.as_str()) != Some(&id));
    store.write_json("stations.json", &data)
}

#[tauri::command]
pub fn save_groups(store: State<Arc<AppStore>>, groups: Vec<String>) -> Result<(), String> {
    let mut data = get_stations_data(store.clone());
    data["groups"] = json!(groups);
    store.write_json("stations.json", &data)
}

#[tauri::command]
pub fn get_settings(store: State<Arc<AppStore>>) -> Value {
    let settings = store.read_json(
        "settings.json",
        json!({
            "schemaVersion": 1,
            "launchAtLogin": false,
            "autoPlayLastStation": false,
            "autoReconnect": true,
            "maxReconnectAttempts": 8,
            "notifyOnSongChange": true,
            "showTitleInMenuBar": false,
            "confirmBeforeQuit": true,
            "language": "id",
            "theme": "system",
            "accentColor": "#0A84FF",
            "fontFamily": "system",
            "glassOpacity": 90,
            "networkTimeoutMs": 12000,
            "userAgent": "Squelch/0.1.0 (macOS; InternetRadio)",
            "shortcuts": {
                "playPause": "CommandOrControl+Shift+P",
                "nextStation": "CommandOrControl+Shift+Right",
                "prevStation": "CommandOrControl+Shift+Left"
            }
        }),
    );
    let data_dir = store.data_dir.to_string_lossy().to_string();
    json!({
        "settings": settings,
        "dataDir": data_dir
    })
}

#[tauri::command]
pub fn update_settings(store: State<Arc<AppStore>>, partial: Value) -> Result<Value, String> {
    let current_res = get_settings(store.clone());
    let mut current_settings = current_res.get("settings").cloned().unwrap_or(json!({}));
    if let (Some(cur_obj), Some(part_obj)) = (current_settings.as_object_mut(), partial.as_object())
    {
        for (k, v) in part_obj {
            cur_obj.insert(k.clone(), v.clone());
        }
    }
    store.write_json("settings.json", &current_settings)?;
    Ok(json!({
        "settings": current_settings,
        "dataDir": store.data_dir.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub fn reset_settings(store: State<Arc<AppStore>>) -> Result<Value, String> {
    let default_val = json!({
        "schemaVersion": 1,
        "launchAtLogin": false,
        "autoPlayLastStation": false,
        "autoReconnect": true,
        "maxReconnectAttempts": 8,
        "notifyOnSongChange": true,
        "showTitleInMenuBar": false,
        "confirmBeforeQuit": true,
        "language": "id",
        "theme": "system",
        "accentColor": "#0A84FF",
        "fontFamily": "system",
        "glassOpacity": 90,
        "networkTimeoutMs": 12000,
        "userAgent": "Squelch/0.1.0 (macOS; InternetRadio)",
        "shortcuts": {
            "playPause": "CommandOrControl+Shift+P",
            "nextStation": "CommandOrControl+Shift+Right",
            "prevStation": "CommandOrControl+Shift+Left"
        }
    });
    store.write_json("settings.json", &default_val)?;
    Ok(json!({
        "settings": default_val,
        "dataDir": store.data_dir.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub fn get_schedules(store: State<Arc<AppStore>>) -> Value {
    store.read_json("schedules.json", json!([]))
}

#[tauri::command]
pub fn save_schedule(store: State<Arc<AppStore>>, schedule: Value) -> Result<(), String> {
    let mut list = get_schedules(store.clone());
    let schedules = list.as_array_mut().ok_or("Invalid schedules")?;

    let id = schedule
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if let Some(pos) = schedules
        .iter()
        .position(|s| s.get("id").and_then(|v| v.as_str()) == Some(&id))
    {
        schedules[pos] = schedule;
    } else {
        schedules.push(schedule);
    }

    store.write_json("schedules.json", &list)
}

#[tauri::command]
pub fn delete_schedule(store: State<Arc<AppStore>>, id: String) -> Result<(), String> {
    let mut list = get_schedules(store.clone());
    let schedules = list.as_array_mut().ok_or("Invalid schedules")?;
    schedules.retain(|s| s.get("id").and_then(|v| v.as_str()) != Some(&id));
    store.write_json("schedules.json", &list)
}

#[tauri::command]
pub fn get_listening_stats(store: State<Arc<AppStore>>) -> Value {
    store.read_json(
        "stats.json",
        json!({
            "todaySeconds": 0,
            "thisWeekSeconds": 0,
            "thisMonthSeconds": 0,
            "thisYearSeconds": 0,
            "totalSeconds": 0,
            "dailySeries": [],
            "weeklySeries": [],
            "monthlySeries": [],
            "yearlySeries": [],
            "topStations": []
        }),
    )
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<String> {
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
}

#[tauri::command]
pub fn set_tray_state(state_name: String, store: State<Arc<AppStore>>) {
    *store.tray_state.lock().unwrap() = state_name;
}

#[tauri::command]
pub fn open_window_tab(app: AppHandle, tab: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.eval(&format!("window.location.hash = '#{}';", tab));
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
pub fn open_about_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.eval("window.location.hash = '#about';");
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_tray_popover(app: AppHandle) -> Result<(), String> {
    if let Some(tray_win) = app.get_webview_window("tray") {
        if tray_win.is_visible().unwrap_or(false) {
            let _ = tray_win.hide();
        } else {
            let _ = tray_win.show();
            let _ = tray_win.set_focus();
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
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&url).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/c", "start", &url])
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
    }
    Ok(())
}
