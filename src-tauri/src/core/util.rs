use std::path::Path;
use std::process::Command;

pub fn build_host_command(base_cmd: &str) -> Command {
    if Path::new("/run/.containerenv").exists() {
        let mut cmd = Command::new("distrobox-host-exec");
        cmd.arg(base_cmd);
        cmd
    } else {
        Command::new(base_cmd)
    }
}

pub fn build_host_command_async(base_cmd: &str) -> tokio::process::Command {
    if Path::new("/run/.containerenv").exists() {
        let mut cmd = tokio::process::Command::new("distrobox-host-exec");
        cmd.arg(base_cmd);
        cmd
    } else {
        tokio::process::Command::new(base_cmd)
    }
}

pub fn normalize_home_path(path: &str) -> String {
    path.replace("/var/home", "/home")
        .trim_end_matches('/')
        .to_string()
}
