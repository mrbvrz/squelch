use crate::store::AppStore;
use serde_json::{json, Value};
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
            "stations": [],
            "groups": ["Favorit", "Musik", "Berita", "Talkshow"]
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
    store.read_json(
        "settings.json",
        json!({
            "theme": "system",
            "accentColor": "blue",
            "systemFont": "system-ui",
            "windowOpacity": 100,
            "language": "id",
            "confirmOnQuit": true,
            "shortcuts": {
                "togglePlay": "Space",
                "nextStation": "KeyN",
                "prevStation": "KeyP"
            }
        }),
    )
}

#[tauri::command]
pub fn update_settings(store: State<Arc<AppStore>>, partial: Value) -> Result<(), String> {
    let mut current = get_settings(store.clone());
    if let (Some(cur_obj), Some(part_obj)) = (current.as_object_mut(), partial.as_object()) {
        for (k, v) in part_obj {
            cur_obj.insert(k.clone(), v.clone());
        }
    }
    store.write_json("settings.json", &current)
}

#[tauri::command]
pub fn reset_settings(store: State<Arc<AppStore>>) -> Result<(), String> {
    let default_val = json!({
        "theme": "system",
        "accentColor": "blue",
        "systemFont": "system-ui",
        "windowOpacity": 100,
        "language": "id",
        "confirmOnQuit": true,
        "shortcuts": {
            "togglePlay": "Space",
            "nextStation": "KeyN",
            "prevStation": "KeyP"
        }
    });
    store.write_json("settings.json", &default_val)
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
            "totalMinutes": 0,
            "weeklyMinutes": [0, 0, 0, 0, 0, 0, 0],
            "monthlyMinutes": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "topStations": []
        }),
    )
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
        let _ = std::process::Command::new("cmd").args(["/c", "start", &url]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
    }
    Ok(())
}
