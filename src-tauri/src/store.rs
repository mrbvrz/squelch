use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct AppStore {
    pub data_dir: PathBuf,
    pub proxy_port: Mutex<u16>,
    pub tray_state: Mutex<String>,
    pub player_state: Mutex<Value>,
    pub menu_status: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
    pub menu_play_pause: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
    pub io_lock: Mutex<()>,
}

impl AppStore {
    pub fn new(app: &AppHandle, proxy_port: u16) -> Self {
        let data_dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("./squelch_data"));
        let _ = fs::create_dir_all(&data_dir);

        let settings = Self::read_json_static(&data_dir, "settings.json", serde_json::json!({}));
        let init_volume = settings.get("volume").and_then(|v| v.as_f64()).unwrap_or(1.0);
        let init_muted = settings.get("isMuted").and_then(|v| v.as_bool()).unwrap_or(false);

        Self {
            data_dir,
            proxy_port: Mutex::new(proxy_port),
            tray_state: Mutex::new("idle".to_string()),
            player_state: Mutex::new(serde_json::json!({
                "state": "idle",
                "currentStation": null,
                "volume": init_volume,
                "isMuted": init_muted,
                "metadata": null,
                "streamTitle": null,
                "sleepTimerMinutes": null,
                "sleepTimerRemainingSec": null,
                "error": null
            })),
            menu_status: Mutex::new(None),
            menu_play_pause: Mutex::new(None),
            io_lock: Mutex::new(()),
        }
    }

    pub fn read_json_static(data_dir: &std::path::Path, filename: &str, default_val: Value) -> Value {
        let file_path = data_dir.join(filename);
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(parsed) = serde_json::from_str::<Value>(&content) {
                return parsed;
            }
        }
        default_val
    }

    pub fn read_json(&self, filename: &str, default_val: Value) -> Value {
        let _guard = self.io_lock.lock().unwrap_or_else(|e| e.into_inner());
        let file_path = self.data_dir.join(filename);
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(parsed) = serde_json::from_str::<Value>(&content) {
                return parsed;
            }
        }
        default_val
    }

    pub fn write_json(&self, filename: &str, val: &Value) -> Result<(), String> {
        let _guard = self.io_lock.lock().unwrap_or_else(|e| e.into_inner());
        let file_path = self.data_dir.join(filename);
        let tmp_path = self.data_dir.join(format!("{}.tmp", filename));
        let content = serde_json::to_string_pretty(val).map_err(|e| e.to_string())?;
        fs::write(&tmp_path, content).map_err(|e| e.to_string())?;
        fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::sync::Arc;

    fn test_store(name: &str) -> (AppStore, PathBuf) {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "squelch_store_test_{}_{}_{}",
            name,
            std::process::id(),
            nanos
        ));
        fs::create_dir_all(&dir).unwrap();
        let store = AppStore {
            data_dir: dir.clone(),
            proxy_port: Mutex::new(0),
            tray_state: Mutex::new("idle".to_string()),
            player_state: Mutex::new(json!({})),
            menu_status: Mutex::new(None),
            menu_play_pause: Mutex::new(None),
            io_lock: Mutex::new(()),
        };
        (store, dir)
    }

    #[test]
    fn write_and_read_json_handles_defaults_corrupt_files_and_atomic_updates() {
        let (store, dir) = test_store("rw");
        let missing = store.read_json("settings.json", json!({ "fallback": true }));
        assert_eq!(missing["fallback"], json!(true));

        store
            .write_json("settings.json", &json!({ "theme": "cukup-senja", "glassOpacity": 72 }))
            .unwrap();
        let loaded = store.read_json("settings.json", json!({}));
        assert_eq!(loaded["theme"], json!("cukup-senja"));
        assert!(!dir.join("settings.json.tmp").exists());

        fs::write(dir.join("broken.json"), "{not-valid-json").unwrap();
        let fallback = store.read_json("broken.json", json!([1, 2]));
        assert_eq!(fallback, json!([1, 2]));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_json_serializes_concurrent_writes_safely() {
        let (store, dir) = test_store("concurrent");
        let store = Arc::new(store);
        let mut handles = Vec::new();
        for i in 0..16 {
            let s = Arc::clone(&store);
            handles.push(std::thread::spawn(move || {
                s.write_json("concurrent.json", &json!({ "writer": i }))
                    .unwrap();
            }));
        }
        for h in handles {
            h.join().unwrap();
        }
        let final_val = store.read_json("concurrent.json", json!(null));
        assert!(final_val.get("writer").and_then(|v| v.as_u64()).is_some());
        let _ = fs::remove_dir_all(&dir);
    }
}
