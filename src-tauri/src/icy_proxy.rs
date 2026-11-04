use axum::{
    Router,
    extract::{Query, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::get,
};
use bytes::{Bytes, BytesMut};
use futures_util::StreamExt;
use serde::Deserialize;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

#[derive(Clone)]
pub struct ProxyState {
    pub app_handle: AppHandle,
    pub client: reqwest::Client,
}

#[derive(Deserialize)]
pub struct ProxyQuery {
    pub url: String,
}

pub fn parse_stream_title(raw: &[u8]) -> Option<String> {
    let mut end = raw.len();
    while end > 0 && raw[end - 1] == 0 {
        end -= 1;
    }
    let text = String::from_utf8_lossy(&raw[..end]);
    if let Some(pos) = text.find("StreamTitle='") {
        let rest = &text[pos + 13..];
        if let Some(quote_end) = rest.find("';") {
            let title = rest[..quote_end].trim().to_string();
            if !title.is_empty() {
                return Some(title);
            }
        } else if let Some(quote_end) = rest.find('\'') {
            let title = rest[..quote_end].trim().to_string();
            if !title.is_empty() {
                return Some(title);
            }
        }
    }
    None
}

async fn handle_proxy(
    State(state): State<ProxyState>,
    Query(query): Query<ProxyQuery>,
) -> Result<Response, StatusCode> {
    let target_url = query.url;
    if target_url.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let upstream = match state
        .client
        .get(&target_url)
        .header("Icy-MetaData", "1")
        .header(
            "User-Agent",
            format!("Squelch/{} (Tauri; macOS)", env!("CARGO_PKG_VERSION")),
        )
        .send()
        .await
    {
        Ok(res) => res,
        Err(_) => return Err(StatusCode::BAD_GATEWAY),
    };

    let content_type = upstream
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("audio/mpeg")
        .to_string();

    let metaint: Option<usize> = upstream
        .headers()
        .get("icy-metaint")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<usize>().ok());

    let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(256);
    let app_handle = state.app_handle.clone();

    tokio::spawn(async move {
        let mut stream = upstream.bytes_stream();

        if let Some(metaint_val) = metaint {
            let mut audio_remaining = metaint_val;
            let mut reading_length = false;
            let mut meta_remaining = 0usize;
            let mut meta_buf = BytesMut::new();
            let mut last_title = String::new();

            while let Some(chunk_result) = stream.next().await {
                let chunk = match chunk_result {
                    Ok(c) => c,
                    Err(_) => break,
                };

                let mut offset = 0;
                while offset < chunk.len() {
                    if reading_length {
                        let len_byte = chunk[offset] as usize;
                        offset += 1;
                        reading_length = false;
                        meta_remaining = len_byte * 16;
                        if meta_remaining == 0 {
                            audio_remaining = metaint_val;
                        } else {
                            meta_buf.clear();
                        }
                        continue;
                    }

                    if meta_remaining > 0 {
                        let available = chunk.len() - offset;
                        let to_take = std::cmp::min(meta_remaining, available);
                        meta_buf.extend_from_slice(&chunk[offset..offset + to_take]);
                        offset += to_take;
                        meta_remaining -= to_take;

                        if meta_remaining == 0 {
                            if let Some(title) = parse_stream_title(&meta_buf) {
                                if title != last_title {
                                    let _ = app_handle.emit("squelch:metadata", &title);
                                    last_title = title;
                                }
                            }
                            audio_remaining = metaint_val;
                        }
                        continue;
                    }

                    let available = chunk.len() - offset;
                    let to_take = std::cmp::min(audio_remaining, available);
                    let audio_slice = chunk.slice(offset..offset + to_take);
                    offset += to_take;
                    audio_remaining -= to_take;

                    if tx.send(Ok(audio_slice)).await.is_err() {
                        return;
                    }

                    if audio_remaining == 0 {
                        reading_length = true;
                    }
                }
            }
        } else {
            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        if tx.send(Ok(chunk)).await.is_err() {
                            return;
                        }
                    }
                    Err(_) => break,
                }
            }
        }
    });

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(&content_type).unwrap_or(HeaderValue::from_static("audio/mpeg")),
    );
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("no-cache, no-store, must-revalidate"),
    );
    headers.insert(
        header::ACCEPT_RANGES,
        HeaderValue::from_static("none"),
    );

    let body = axum::body::Body::from_stream(ReceiverStream::new(rx));
    Ok((headers, body).into_response())
}

pub async fn start_proxy_server(app_handle: AppHandle) -> u16 {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(5))
        .tcp_nodelay(true)
        .build()
        .unwrap_or_default();

    let state = ProxyState { app_handle, client };
    let app = Router::new()
        .route("/proxy", get(handle_proxy))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("Failed to bind ICY proxy server");
    let port = listener.local_addr().unwrap().port();

    tokio::spawn(async move {
        let _ = axum::serve(listener, app).await;
    });

    port
}
