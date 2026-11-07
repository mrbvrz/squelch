use crate::store::AppStore;
use serde_json::{Value, json};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn get_player_status(store: State<Arc<AppStore>>) -> Value {
    store.player_state.lock().unwrap().clone()
}

#[tauri::command]
pub fn update_player_status(
    app: AppHandle,
    store: State<Arc<AppStore>>,
    status: Value,
) -> Result<(), String> {
    let (prev_state, current_state) = {
        let mut st = store.player_state.lock().unwrap();
        *st = status.clone();

        let mut tray_guard = store.tray_state.lock().unwrap();
        let prev = tray_guard.clone();
        let cur = status
            .get("state")
            .and_then(|v| v.as_str())
            .unwrap_or("idle")
            .to_string();
        *tray_guard = cur.clone();
        (prev, cur)
    };

    if prev_state != current_state {
        crate::update_tray_icon(&app, &current_state);
    }

    // Dynamically update tray tooltip with live station and track information
    if let Some(tray) = app.tray_by_id("main-tray") {
        let state_str = status
            .get("state")
            .and_then(|v| v.as_str())
            .unwrap_or("idle");
        let station_name = status
            .get("currentStation")
            .and_then(|s| s.get("name"))
            .and_then(|v| v.as_str());
        let stream_title = status
            .get("streamTitle")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty());

        let tooltip = match (state_str, station_name, stream_title) {
            ("playing", Some(station), Some(title)) => {
                format!("▶ Squelch: {} — {}", station, title)
            }
            ("playing", Some(station), None) => {
                format!("▶ Squelch: {}", station)
            }
            ("buffering" | "connecting" | "reconnecting", Some(station), _) => {
                format!("⏳ Squelch: Menyambung ke {}...", station)
            }
            ("paused", Some(station), _) => {
                format!("⏸ Squelch: {} (Dijeda)", station)
            }
            _ => "Squelch - Menu Bar Internet Radio".to_string(),
        };

        let _ = tray.set_tooltip(Some(tooltip));

        // 1. Update Context Menu Subtitle Item (menu_status)
        if let Ok(guard) = store.menu_status.lock() {
            if let Some(item) = guard.as_ref() {
                let status_menu_text = match (state_str, station_name, stream_title) {
                    ("playing", Some(station), Some(title)) => {
                        format!("▶ {} — {}", station, title)
                    }
                    ("playing", Some(station), None) => {
                        format!("▶ {}", station)
                    }
                    ("buffering" | "connecting" | "reconnecting", Some(station), _) => {
                        format!("⏳ Menyambung ke {}...", station)
                    }
                    ("paused", Some(station), _) => {
                        format!("⏸ {} (Dijeda)", station)
                    }
                    _ => "Squelch Radio (Siap)".to_string(),
                };
                let truncated = if status_menu_text.chars().count() > 42 {
                    let mut s: String = status_menu_text.chars().take(41).collect();
                    s.push('…');
                    s
                } else {
                    status_menu_text
                };
                let _ = item.set_text(truncated);
            }
        }

        // 2. Update Play/Pause Menu Item Label
        if let Ok(guard) = store.menu_play_pause.lock() {
            if let Some(item) = guard.as_ref() {
                let play_pause_label = if state_str == "playing" {
                    "Jeda Siaran"
                } else {
                    "Putar Siaran"
                };
                let _ = item.set_text(play_pause_label);
            }
        }

        // 3. Optional Menu Bar text title next to tray icon
        let settings = store.read_json("settings.json", serde_json::json!({}));
        let show_title_in_menu_bar = settings
            .get("showTitleInMenuBar")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if show_title_in_menu_bar {
            let menu_bar_title = match (state_str, station_name, stream_title) {
                ("playing", Some(station), Some(title)) => {
                    let full = format!(" {} — {}", station, title);
                    if full.chars().count() > 30 {
                        let mut s: String = full.chars().take(29).collect();
                        s.push('…');
                        s
                    } else {
                        full
                    }
                }
                ("playing", Some(station), None) => format!(" {}", station),
                ("buffering" | "connecting" | "reconnecting", Some(station), _) => {
                    format!(" {}", station)
                }
                _ => String::new(),
            };
            let _ = tray.set_title(if menu_bar_title.is_empty() {
                None
            } else {
                Some(menu_bar_title)
            });
        } else {
            let _ = tray.set_title(None::<String>);
        }
    }

    let _ = app.emit("squelch:player-sync", &status);
    Ok(())
}

#[tauri::command]
pub fn get_proxy_port(store: State<Arc<AppStore>>) -> u16 {
    *store.proxy_port.lock().unwrap()
}

#[tauri::command]
pub fn get_stations_data(store: State<Arc<AppStore>>) -> Value {
    let empty_initial = json!({
        "schemaVersion": 1,
        "stations": [],
        "groups": []
    });

    let stations_file = store.data_dir.join("stations.json");
    if !stations_file.exists() {
        let _ = store.write_json("stations.json", &empty_initial);
        return empty_initial;
    }

    let mut data = store.read_json("stations.json", empty_initial.clone());

    // Ensure every station has a unique non-empty ID
    let mut needs_save = false;
    if let Some(stations) = data.get_mut("stations").and_then(|v| v.as_array_mut()) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        for (idx, s) in stations.iter_mut().enumerate() {
            let has_valid_id = s
                .get("id")
                .and_then(|v| v.as_str())
                .map(|id| !id.trim().is_empty())
                .unwrap_or(false);
            if !has_valid_id {
                if let Some(obj) = s.as_object_mut() {
                    obj.insert("id".to_string(), json!(format!("station-{}-{}", now, idx)));
                    needs_save = true;
                }
            }
        }
    }
    if needs_save {
        let _ = store.write_json("stations.json", &data);
    }

    data
}

#[tauri::command]
pub fn save_station(store: State<Arc<AppStore>>, mut station: Value) -> Result<(), String> {
    let mut data = get_stations_data(store.clone());
    let stations = data
        .get_mut("stations")
        .and_then(|v| v.as_array_mut())
        .ok_or("Invalid stations data")?;

    let id = match station.get("id").and_then(|v| v.as_str()) {
        Some(s) if !s.trim().is_empty() => s.to_string(),
        _ => {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis();
            let new_id = format!("station-{}", now);
            if let Some(obj) = station.as_object_mut() {
                obj.insert("id".to_string(), json!(new_id));
            }
            new_id
        }
    };

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
            "userAgent": format!("Squelch/{} (macOS; InternetRadio)", env!("CARGO_PKG_VERSION")),
            "shortcuts": {
                "playPause": "CommandOrControl+Shift+P",
                "nextStation": "CommandOrControl+Shift+Right",
                "prevStation": "CommandOrControl+Shift+Left"
            },
            "hasCompletedOnboarding": false,
            "autoCheckUpdates": true,
            "hideFromDock": false
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
    let existing = store.read_json("settings.json", json!({}));
    let has_completed_onboarding = existing
        .get("hasCompletedOnboarding")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

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
        "bufferLengthSeconds": 5,
        "equalizer": {
            "enabled": false,
            "preset": "flat",
            "bands": [0, 0, 0, 0, 0, 0, 0, 0],
            "normalization": true
        },
        "userAgent": format!("Squelch/{} (macOS; InternetRadio)", env!("CARGO_PKG_VERSION")),
        "shortcuts": {
            "playPause": "CommandOrControl+Shift+P",
            "nextStation": "CommandOrControl+Shift+Right",
            "prevStation": "CommandOrControl+Shift+Left"
        },
        "hasCompletedOnboarding": has_completed_onboarding,
        "autoCheckUpdates": true,
        "hideFromDock": false
    });
    store.write_json("settings.json", &default_val)?;
    Ok(json!({
        "settings": default_val,
        "dataDir": store.data_dir.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub fn clear_stations_data(store: State<Arc<AppStore>>) -> Result<(), String> {
    let empty_data = json!({
        "schemaVersion": 1,
        "stations": [],
        "groups": []
    });
    store.write_json("stations.json", &empty_data)
}

#[tauri::command]
pub fn clear_schedules_data(store: State<Arc<AppStore>>) -> Result<(), String> {
    let list = json!({
        "schemaVersion": 1,
        "schedules": []
    });
    store.write_json("schedules.json", &list)
}

#[tauri::command]
pub fn clear_listening_stats(store: State<Arc<AppStore>>) -> Result<(), String> {
    let stats = json!({
        "schemaVersion": 1,
        "dailySeconds": {},
        "hourlySeconds": {},
        "monthlySeconds": {},
        "stationSeconds": {},
        "stationNames": {},
        "stationLogos": {},
        "totalSeconds": 0
    });
    store.write_json("stats.json", &stats)
}

#[tauri::command]
pub fn reset_all_data(store: State<Arc<AppStore>>) -> Result<Value, String> {
    clear_stations_data(store.clone())?;
    clear_schedules_data(store.clone())?;
    clear_listening_stats(store.clone())?;
    reset_settings(store)
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
            "schemaVersion": 1,
            "dailySeconds": {},
            "monthlySeconds": {},
            "stationSeconds": {},
            "totalSeconds": 0
        }),
    )
}

#[tauri::command]
pub fn save_listening_stats(store: State<Arc<AppStore>>, stats: Value) -> Result<(), String> {
    store.write_json("stats.json", &stats)
}

#[tauri::command]
pub async fn test_stream_url(url: String) -> serde_json::Value {
    let start = std::time::Instant::now();
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .user_agent(format!(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Squelch/{}",
            env!("CARGO_PKG_VERSION")
        ))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return serde_json::json!({
                "ok": false,
                "resolvedUrl": url,
                "streamType": "mp3",
                "contentType": "",
                "latencyMs": 0,
                "errorReason": e.to_string()
            });
        }
    };

    match client.get(&url).header("Icy-MetaData", "1").send().await {
        Ok(mut res) => {
            let status = res.status();
            let latency = start.elapsed().as_millis() as u64;
            let final_url = res.url().to_string();
            let headers = res.headers().clone();
            let content_type = headers
                .get("content-type")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("")
                .to_string();
            let ct_lower = content_type.to_lowercase();
            let icy_name = headers
                .get("icy-name")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string());
            let bitrate = headers
                .get("icy-br")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string());

            let is_hls = final_url.contains(".m3u8")
                || ct_lower.contains("application/vnd.apple.mpegurl")
                || ct_lower.contains("application/x-mpegurl");
            let stream_type = if is_hls { "hls" } else { "mp3" };

            // Comprehensive audio stream validation
            let has_audio_indicators = ct_lower.contains("audio")
                || ct_lower.contains("ogg")
                || ct_lower.contains("mpeg")
                || ct_lower.contains("octet-stream")
                || ct_lower.contains("video")
                || is_hls
                || icy_name.is_some()
                || bitrate.is_some();

            let mut is_stream_valid = status.is_success();
            if is_stream_valid && ct_lower.contains("text/html") && !has_audio_indicators {
                is_stream_valid = false;
            }

            if is_stream_valid {
                // Verify initial data chunk transmits within 2500ms
                match tokio::time::timeout(std::time::Duration::from_millis(2500), res.chunk())
                    .await
                {
                    Ok(Ok(Some(chunk))) if !chunk.is_empty() => {
                        if is_hls {
                            let sample = String::from_utf8_lossy(&chunk);
                            if !sample.contains("#EXTM3U") && !sample.contains("#EXT-X-") {
                                is_stream_valid = false;
                            }
                        }
                    }
                    Ok(Ok(None)) => {
                        is_stream_valid = false;
                    }
                    _ => {
                        is_stream_valid = false;
                    }
                }
            }

            serde_json::json!({
                "ok": is_stream_valid,
                "resolvedUrl": final_url,
                "streamType": stream_type,
                "contentType": content_type,
                "icyName": icy_name,
                "bitrate": bitrate,
                "latencyMs": latency,
                "errorReason": if is_stream_valid { None } else { Some(format!("HTTP {}", status)) }
            })
        }
        Err(err) => serde_json::json!({
            "ok": false,
            "resolvedUrl": url,
            "streamType": "mp3",
            "contentType": "",
            "latencyMs": start.elapsed().as_millis() as u64,
            "errorReason": err.to_string()
        }),
    }
}

#[tauri::command]
pub fn reorder_stations(
    store: State<Arc<AppStore>>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let mut data = get_stations_data(store.clone());
    if let Some(stations) = data.get_mut("stations").and_then(|v| v.as_array_mut()) {
        let mut by_id: std::collections::HashMap<String, serde_json::Value> =
            std::collections::HashMap::new();
        for s in stations.drain(..) {
            if let Some(id) = s.get("id").and_then(|v| v.as_str()) {
                by_id.insert(id.to_string(), s);
            }
        }
        for id in &ordered_ids {
            if let Some(s) = by_id.remove(id) {
                stations.push(s);
            }
        }
        for (_, s) in by_id {
            stations.push(s);
        }
    }
    store.write_json("stations.json", &data)
}

#[tauri::command]
pub fn rename_group(
    store: State<Arc<AppStore>>,
    old_name: String,
    new_name: String,
) -> Result<serde_json::Value, String> {
    let mut data = get_stations_data(store.clone());
    let trimmed = new_name.trim().to_string();
    if !trimmed.is_empty() {
        if let Some(groups) = data.get_mut("groups").and_then(|v| v.as_array_mut()) {
            for g in groups.iter_mut() {
                if g.as_str() == Some(&old_name) {
                    *g = serde_json::json!(trimmed);
                }
            }
        }
        if let Some(stations) = data.get_mut("stations").and_then(|v| v.as_array_mut()) {
            for s in stations.iter_mut() {
                if s.get("group").and_then(|v| v.as_str()) == Some(&old_name) {
                    if let Some(obj) = s.as_object_mut() {
                        obj.insert("group".to_string(), serde_json::json!(trimmed));
                    }
                }
            }
        }
        store.write_json("stations.json", &data)?;
    }
    Ok(data)
}

#[tauri::command]
pub fn delete_group(
    store: State<Arc<AppStore>>,
    group_name: String,
    move_to_group: Option<String>,
) -> Result<serde_json::Value, String> {
    let mut data = get_stations_data(store.clone());
    let fallback = move_to_group.unwrap_or_else(|| "Umum".to_string());
    if let Some(groups) = data.get_mut("groups").and_then(|v| v.as_array_mut()) {
        groups.retain(|g| g.as_str() != Some(&group_name));
    }
    if let Some(stations) = data.get_mut("stations").and_then(|v| v.as_array_mut()) {
        for s in stations.iter_mut() {
            if s.get("group").and_then(|v| v.as_str()) == Some(&group_name) {
                if let Some(obj) = s.as_object_mut() {
                    obj.insert("group".to_string(), serde_json::json!(fallback));
                }
            }
        }
    }
    store.write_json("stations.json", &data)?;
    Ok(data)
}
