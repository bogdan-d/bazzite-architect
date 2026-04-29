use chrono::Local;
use std::collections::VecDeque;
use std::sync::{Mutex, OnceLock};
use tauri::Emitter;

static LOGS: OnceLock<Mutex<VecDeque<String>>> = OnceLock::new();
const MAX_LOG_LINES: usize = 1000;

fn with_logs_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut VecDeque<String>) -> R,
{
    let mutex = LOGS.get_or_init(|| Mutex::new(VecDeque::new()));
    let mut guard = mutex.lock().unwrap();
    f(&mut guard)
}

pub fn info(app: &tauri::AppHandle, source: &str, message: impl Into<String>) {
    append(app, source, "INFO", &message.into());
}

pub fn error(app: &tauri::AppHandle, source: &str, message: impl Into<String>) {
    append(app, source, "ERROR", &message.into());
}

pub fn append(app: &tauri::AppHandle, source: &str, level: &str, message: &str) {
    let ts = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let line = format!("[{}] [{}] [{}] {}", ts, source, level, message);
    with_logs_mut(|logs| {
        logs.push_back(line.clone());
        while logs.len() > MAX_LOG_LINES {
            logs.pop_front();
        }
    });
    let _ = app.emit("app-log", line);
}

#[tauri::command]
pub fn get_logs_text() -> Result<String, String> {
    let text = with_logs_mut(|logs| logs.iter().cloned().collect::<Vec<_>>().join("\n"));
    Ok(text)
}

#[tauri::command]
pub fn clear_logs() -> Result<(), String> {
    with_logs_mut(|logs| logs.clear());
    Ok(())
}

#[tauri::command]
pub fn client_log(
    app: tauri::AppHandle,
    source: String,
    level: Option<String>,
    message: String,
) -> Result<(), String> {
    let lvl = level.unwrap_or_else(|| "INFO".to_string());
    append(&app, &source, &lvl, &message);
    Ok(())
}
