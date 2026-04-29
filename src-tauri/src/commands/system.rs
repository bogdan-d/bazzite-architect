use crate::commands::logs;
use crate::core::util::build_host_command;
use serde::Serialize;
use tauri::Emitter;

#[derive(Serialize)]
pub struct SystemCheckResult {
    pub podman_ok: bool,
    pub podman_version: Option<String>,
    pub distrobox_ok: bool,
    pub distrobox_version: Option<String>,
}

#[tauri::command]
pub fn system_check(app: tauri::AppHandle) -> Result<SystemCheckResult, String> {
    let podman = build_host_command("podman").arg("--version").output();
    let (podman_ok, podman_version) = match podman {
        Ok(out) if out.status.success() => (
            true,
            Some(String::from_utf8_lossy(&out.stdout).trim().to_string()),
        ),
        _ => (false, None),
    };

    let distrobox = build_host_command("distrobox").arg("--version").output();
    let (distrobox_ok, distrobox_version) = match distrobox {
        Ok(out) if out.status.success() => (
            true,
            Some(String::from_utf8_lossy(&out.stdout).trim().to_string()),
        ),
        _ => (false, None),
    };

    let res = SystemCheckResult {
        podman_ok,
        podman_version,
        distrobox_ok,
        distrobox_version,
    };
    logs::info(
        &app,
        "system",
        format!(
            "system_check: podman_ok={} distrobox_ok={}",
            res.podman_ok, res.distrobox_ok
        ),
    );

    let _ = app.emit(
        "app-notification",
        serde_json::json!({ "message": "System checked", "type": "success" }),
    );

    Ok(res)
}
