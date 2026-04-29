use std::fs;
use std::path::Path;

// Write .devcontainer/devcontainer.json for reopen-in-container with customizable image, postCreateCommand and extensions
pub fn write_devcontainer_files(
    project_dir: &Path,
    env_name: &str,
    base_image: &str,
    post_create_command: Option<&str>,
    extensions: &[&str],
) -> Result<Vec<String>, String> {
    let mut created = Vec::new();
    let dev_dir = project_dir.join(".devcontainer");
    if !dev_dir.exists() {
        fs::create_dir_all(&dev_dir)
            .map_err(|e| format!("Could not create {}: {}", dev_dir.display(), e))?;
    }

    let json_path = dev_dir.join("devcontainer.json");

    let mut obj = serde_json::json!({
        "name": env_name,
        "containerName": env_name,
        "image": base_image,
        "remoteUser": "root",
        "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
        "customizations": {
            "vscode": {
                "extensions": extensions
            }
        }
    });

    if let Some(cmd) = post_create_command {
        // Use postStartCommand instead of postCreateCommand to avoid a lifecycle
        // hang in VS Code DevContainers for Fedora toolbox-based images.
        // postCreateCommand runs during container creation and can block the
        // DevContainer agent startup in some environments. Running the install
        // steps in postStartCommand executes them after the container is
        // started and the VS Code server is attached, preventing the UI from
        // stalling (the command is still allowed to fail harmlessly).
        obj.as_object_mut().unwrap().insert(
            "postStartCommand".into(),
            serde_json::Value::String(cmd.to_string()),
        );
    }

    let content = serde_json::to_string_pretty(&obj)
        .map_err(|e| format!("Could not serialize devcontainer.json: {}", e))?;

    fs::write(&json_path, content)
        .map_err(|e| format!("Could not write {}: {}", json_path.display(), e))?;
    created.push(json_path.display().to_string());
    Ok(created)
}
