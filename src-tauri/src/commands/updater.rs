use futures_util::StreamExt;
use serde_json::{Value, json};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

fn parse_version(v: &str) -> (u64, u64, u64) {
    let clean = v.trim().trim_start_matches(|c| c == 'v' || c == 'V');
    let parts: Vec<u64> = clean
        .split('.')
        .filter_map(|p| p.split('-').next().and_then(|s| s.parse().ok()))
        .collect();
    (
        parts.get(0).copied().unwrap_or(0),
        parts.get(1).copied().unwrap_or(0),
        parts.get(2).copied().unwrap_or(0),
    )
}

fn is_version_newer(current: &str, remote: &str) -> bool {
    let c = parse_version(current);
    let r = parse_version(remote);
    r > c
}

#[tauri::command]
pub async fn check_for_updates() -> Result<Value, String> {
    let current_version = env!("CARGO_PKG_VERSION");
    let url = "https://api.github.com/repos/mrbvrz/squelch/releases/latest";

    let client = reqwest::Client::builder()
        .user_agent(format!("Squelch/{}", current_version))
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let res = client
        .get(url)
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| format!("Network error checking for updates: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("GitHub API returned status: {}", res.status()));
    }

    let text = res
        .text()
        .await
        .map_err(|e| format!("Failed to read release response: {}", e))?;

    let release: Value =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse release JSON: {}", e))?;

    let remote_tag = release
        .get("tag_name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let clean_remote = remote_tag.trim_start_matches(|c| c == 'v' || c == 'V');
    let has_update = is_version_newer(current_version, clean_remote);

    let release_name = release
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or(&remote_tag)
        .to_string();

    let release_notes = release
        .get("body")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let published_at = release
        .get("published_at")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let html_url = release
        .get("html_url")
        .and_then(|v| v.as_str())
        .unwrap_or("https://github.com/mrbvrz/squelch/releases")
        .to_string();

    let mut dmg_url: Option<String> = None;
    let mut zip_url: Option<String> = None;
    let mut dmg_name: Option<String> = None;
    let mut zip_name: Option<String> = None;
    let mut assets_list: Vec<Value> = Vec::new();

    if let Some(assets) = release.get("assets").and_then(|v| v.as_array()) {
        for asset in assets {
            let name = asset.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let download_url = asset
                .get("browser_download_url")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let size = asset.get("size").and_then(|v| v.as_u64()).unwrap_or(0);

            if name.ends_with(".dmg") && dmg_url.is_none() {
                dmg_url = Some(download_url.to_string());
                dmg_name = Some(name.to_string());
            }
            if name.ends_with(".zip") && zip_url.is_none() {
                zip_url = Some(download_url.to_string());
                zip_name = Some(name.to_string());
            }

            assets_list.push(json!({
                "name": name,
                "downloadUrl": download_url,
                "size": size
            }));
        }
    }

    let primary_download_url = dmg_url.or(zip_url).unwrap_or_else(|| html_url.clone());
    let primary_filename = dmg_name.or(zip_name);

    Ok(json!({
        "hasUpdate": has_update,
        "currentVersion": current_version,
        "latestVersion": clean_remote,
        "releaseName": release_name,
        "releaseNotes": release_notes,
        "publishedAt": published_at,
        "releaseUrl": html_url,
        "downloadUrl": primary_download_url,
        "fileName": primary_filename,
        "assets": assets_list
    }))
}

static IS_DOWNLOADING_UPDATE: AtomicBool = AtomicBool::new(false);
static CANCEL_UPDATE_DOWNLOAD: AtomicBool = AtomicBool::new(false);

#[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDownloadProgress {
    pub status: String, // "downloading" | "completed" | "error" | "cancelled"
    pub transferred: u64,
    pub total: u64,
    pub percent: f64,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn start_download_update(
    app: AppHandle,
    url: String,
    filename: Option<String>,
) -> Result<(), String> {
    if url.is_empty() || (!url.starts_with("https://") && !url.starts_with("http://")) {
        return Err("URL unduhan tidak valid".to_string());
    }

    // Cancel any prior active download before starting a new one
    CANCEL_UPDATE_DOWNLOAD.store(true, Ordering::SeqCst);
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    CANCEL_UPDATE_DOWNLOAD.store(false, Ordering::SeqCst);
    IS_DOWNLOADING_UPDATE.store(true, Ordering::SeqCst);

    let cache_dir = app
        .path()
        .app_cache_dir()
        .unwrap_or_else(|_| std::env::temp_dir());
    let update_dir = cache_dir.join("updates");
    if let Err(e) = std::fs::create_dir_all(&update_dir) {
        IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
        return Err(format!("Gagal membuat direktori cache pembaruan: {}", e));
    }

    let file_name = filename.unwrap_or_else(|| {
        url.split('/')
            .last()
            .filter(|s| !s.is_empty())
            .unwrap_or("Squelch-Update.dmg")
            .to_string()
    });

    let target_path = update_dir.join(&file_name);
    let part_path = update_dir.join(format!("{}.part", &file_name));

    let app_handle = app.clone();
    let name_for_task = file_name.clone();

    tauri::async_runtime::spawn(async move {
        let client = match reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(600))
            .build()
        {
            Ok(c) => c,
            Err(e) => {
                IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "error".into(),
                        transferred: 0,
                        total: 0,
                        percent: 0.0,
                        file_path: None,
                        file_name: Some(name_for_task),
                        error: Some(format!("Gagal membuat HTTP client: {}", e)),
                    },
                );
                return;
            }
        };

        let res = match client.get(&url).send().await {
            Ok(r) if r.status().is_success() => r,
            Ok(r) => {
                IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "error".into(),
                        transferred: 0,
                        total: 0,
                        percent: 0.0,
                        file_path: None,
                        file_name: Some(name_for_task),
                        error: Some(format!("Unduhan gagal dengan status: {}", r.status())),
                    },
                );
                return;
            }
            Err(e) => {
                IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "error".into(),
                        transferred: 0,
                        total: 0,
                        percent: 0.0,
                        file_path: None,
                        file_name: Some(name_for_task),
                        error: Some(format!("Kendala jaringan: {}", e)),
                    },
                );
                return;
            }
        };

        let total_length = res.content_length().unwrap_or(0);

        let mut file = match tokio::fs::File::create(&part_path).await {
            Ok(f) => f,
            Err(e) => {
                IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "error".into(),
                        transferred: 0,
                        total: total_length,
                        percent: 0.0,
                        file_path: None,
                        file_name: Some(name_for_task),
                        error: Some(format!("Gagal membuat berkas sementara: {}", e)),
                    },
                );
                return;
            }
        };

        let mut stream = res.bytes_stream();
        let mut transferred: u64 = 0;
        let mut last_emit = std::time::Instant::now();

        // Emit initial progress
        let _ = app_handle.emit(
            "squelch:update-download-progress",
            UpdateDownloadProgress {
                status: "downloading".into(),
                transferred: 0,
                total: total_length,
                percent: 0.0,
                file_path: None,
                file_name: Some(name_for_task.clone()),
                error: None,
            },
        );

        let mut was_cancelled = false;

        while let Some(chunk_res) = stream.next().await {
            if CANCEL_UPDATE_DOWNLOAD.load(Ordering::SeqCst) {
                was_cancelled = true;
                break;
            }

            let chunk = match chunk_res {
                Ok(c) => c,
                Err(e) => {
                    let _ = tokio::fs::remove_file(&part_path).await;
                    IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                    let _ = app_handle.emit(
                        "squelch:update-download-progress",
                        UpdateDownloadProgress {
                            status: "error".into(),
                            transferred,
                            total: total_length,
                            percent: if total_length > 0 {
                                (transferred as f64 / total_length as f64) * 100.0
                            } else {
                                0.0
                            },
                            file_path: None,
                            file_name: Some(name_for_task),
                            error: Some(format!("Gagal membaca data unduhan: {}", e)),
                        },
                    );
                    return;
                }
            };

            if let Err(e) = file.write_all(&chunk).await {
                let _ = tokio::fs::remove_file(&part_path).await;
                IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "error".into(),
                        transferred,
                        total: total_length,
                        percent: 0.0,
                        file_path: None,
                        file_name: Some(name_for_task),
                        error: Some(format!("Gagal menulis berkas ke disk: {}", e)),
                    },
                );
                return;
            }

            transferred += chunk.len() as u64;

            if last_emit.elapsed().as_millis() >= 80 {
                last_emit = std::time::Instant::now();
                let percent = if total_length > 0 {
                    ((transferred as f64 / total_length as f64) * 100.0).min(99.9)
                } else {
                    0.0
                };
                let _ = app_handle.emit(
                    "squelch:update-download-progress",
                    UpdateDownloadProgress {
                        status: "downloading".into(),
                        transferred,
                        total: total_length,
                        percent,
                        file_path: None,
                        file_name: Some(name_for_task.clone()),
                        error: None,
                    },
                );
            }
        }

        if was_cancelled {
            let _ = tokio::fs::remove_file(&part_path).await;
            IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
            let _ = app_handle.emit(
                "squelch:update-download-progress",
                UpdateDownloadProgress {
                    status: "cancelled".into(),
                    transferred: 0,
                    total: total_length,
                    percent: 0.0,
                    file_path: None,
                    file_name: Some(name_for_task),
                    error: None,
                },
            );
            return;
        }

        let _ = file.flush().await;
        drop(file);

        if let Err(e) = tokio::fs::rename(&part_path, &target_path).await {
            IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
            let _ = app_handle.emit(
                "squelch:update-download-progress",
                UpdateDownloadProgress {
                    status: "error".into(),
                    transferred,
                    total: total_length,
                    percent: 0.0,
                    file_path: None,
                    file_name: Some(name_for_task),
                    error: Some(format!("Gagal menyimpan berkas pembaruan: {}", e)),
                },
            );
            return;
        }

        IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
        let final_path = target_path.to_string_lossy().to_string();

        let _ = app_handle.emit(
            "squelch:update-download-progress",
            UpdateDownloadProgress {
                status: "completed".into(),
                transferred,
                total: transferred,
                percent: 100.0,
                file_path: Some(final_path.clone()),
                file_name: Some(name_for_task),
                error: None,
            },
        );

        let _ = super::system::send_notification(
            app_handle.clone(),
            "Pembaruan Squelch Siap".into(),
            "Installer versi terbaru telah selesai diunduh di latar belakang. Klik untuk membuka & memasang.".into(),
        );
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_update_download() -> Result<(), String> {
    CANCEL_UPDATE_DOWNLOAD.store(true, Ordering::SeqCst);
    IS_DOWNLOADING_UPDATE.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn open_update_installer(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Berkas pembaruan tidak ditemukan: {}", file_path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Gagal membuka installer: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn reveal_update_in_finder(file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Berkas tidak ditemukan: {}", file_path));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Gagal menampilkan di Finder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to reveal in Explorer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(parent) = path.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        }
    }

    Ok(())
}
