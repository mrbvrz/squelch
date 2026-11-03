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
}

impl AppStore {
    pub fn new(app: &AppHandle, proxy_port: u16) -> Self {
        let data_dir = app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("./squelch_data"));
        let _ = fs::create_dir_all(&data_dir);

        Self {
            data_dir,
            proxy_port: Mutex::new(proxy_port),
            tray_state: Mutex::new("idle".to_string()),
            player_state: Mutex::new(serde_json::json!({
                "state": "idle",
                "currentStation": null,
                "volume": 1.0,
                "isMuted": false,
                "metadata": null,
                "streamTitle": null,
                "sleepTimerMinutes": null,
                "sleepTimerRemainingSec": null,
                "error": null
            })),
        }
    }

    pub fn read_json(&self, filename: &str, default_val: Value) -> Value {
        let file_path = self.data_dir.join(filename);
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(parsed) = serde_json::from_str::<Value>(&content) {
                return parsed;
            }
        }
        default_val
    }

    pub fn write_json(&self, filename: &str, val: &Value) -> Result<(), String> {
        let file_path = self.data_dir.join(filename);
        let tmp_path = self.data_dir.join(format!("{}.tmp", filename));
        let content = serde_json::to_string_pretty(val).map_err(|e| e.to_string())?;
        fs::write(&tmp_path, content).map_err(|e| e.to_string())?;
        fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;
        Ok(())
    }
}
