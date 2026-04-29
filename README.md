<p align="center">
  <img src="git_src/assets/ba_logo.svg" alt="Bazzite Architect" width="160" />
  <br/>
  <br/>
  <img src="https://img.shields.io/badge/backend-Rust_1.80+-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/framework-Tauri_V2-024B6A?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/frontend-React_18-0D6EFD?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/runtime-Podman-076B2A?style=for-the-badge&logo=podman&logoColor=white" alt="Podman" />
</p>

# Bazzite Architect

A native, low-footprint orchestrator for reproducible, isolated development environments on immutable Linux distributions (Bazzite / Fedora Kinoite).

---

## 🚀 Demo

![Bazzite Architect Demo](git_src/assets/ba_architect_gif_py_setup.webp)

*Creating a full Python environment and launching VS Code **in under 45 seconds** — UI remains fully responsive.*

---

## Introduction

Bazzite Architect is a desktop application (Tauri + React frontend, Rust backend) that bridges host container tooling (Podman / Distrobox) and IDE DevContainers. It provides a manifest-driven synchronization model that keeps the host-integrated Distrobox environments and IDE DevContainers aligned while preserving the security constraints of immutable operating systems.

For a technical deep dive into the system's internals, design principles, and I/O safety model, check out the ARCHITECTURE.md.

---

## Key Technical Features

- 🧩 **Native Performance (Rust):** Lightweight, memory-safe backend for command orchestration and I/O-heavy tasks.
- 🔒 **Rootless Security:** All container operations are executed in user-space (rootless Podman / Distrobox) to minimize system-level risk.
- 🗂️ **Manifest-driven Sync Engine:** A single, declarative `.bazzite-architect.json` manifest drives idempotent synchronization between Distrobox and DevContainer state.
- 💾 **Storage Relocation:** Guided, safe reconfiguration of Podman's per-user GraphRoot to offload images and writable layers from constrained system disks.

---

## Supported Environments

Bazzite Architect currently provides zero-config scaffolding and native DevContainer synchronization for **5 major ecosystems**:

- 🐍 **Python** (Data Science, AI, Scripting)
- ⚛️ **Node / React** (Frontend & Fullstack TS/JS)
- 🦀 **Rust** (Systems Programming)
- ☕ **Java** (Enterprise Backend)
- ⚙️ **C / C++** (Native & Embedded)

*Each environment is automatically scaffolded with the correct build manifests and language-specific VS Code extensions.* 

---

## Comparison

| Concern | Manual Distrobox / DevContainer Setup | Bazzite Architect |
|---|---:|---|
| Repeatable setup | ad-hoc scripts, manual edits | declarative manifest + scaffolding |
| Security model | depends on individual setup | rootless Podman + guarded mounts |
| Drift handling | manual reconciliation | manifest-driven sync (MVP) |
| Disk management | manual moves / ad-hoc | guided storage relocation |

---

## Roadmap (high level)

- ✅ MVP: Environment creation, manifest-driven sync, storage relocation
- 🔜 Planned: Drift detection and adoption flows
- 🔁 In progress: Transactional rollback primitives for sync operations


---

## Motivation: From "Nightmare Setup" to Native Flow

Bazzite Architect was born out of real-world friction. 

Coming from a Frontend background (React/TS), I faced a major hurdle when moving my AI research - local training of OpenCV and ResNet models - to **Bazzite**. In a prior project (Goldgrube Coin Tool) I relied on ResNet models and local toolchains; you can find that repository [here](https://github.com/Kubaguette/goldgrube-coin-tool). As an immutable distribution, the "Windows way" or even the "standard Linux way" of installing toolchains simply didn't work.

I found myself trapped in a **"Nightmare Setup"**:
- ❌ Traditional terminal Python installs failed on the read-only root.
- ❌ Fragmented Conda environments that didn't talk to VS Code properly.
- ❌ High barrier to entry for students and engineers new to immutable OSs.

**The Mission:**
I built this tool to ensure that no developer has to waste hours on environment plumbing again. Bazzite Architect bridges the gap, providing a frictionless, native-feeling UI to manage what used to be a complex, manual process.

---

## Quick Start & Requirements

These steps are intentionally concise. Expand them to match your environment and distribution.

### Prerequisites

- A modern immutable Linux installation (Bazzite, Kinoite, or compatible Fedora spin).
- Podman (rootless) available on the host.
- Distrobox installed for friendly host-container integration.
- Node >= 18 / npm or pnpm for frontend development.
- Rust (stable) + cargo for backend build.

---

### Installation (End-User)

Bazzite Architect is distributed as native packages (.deb and .rpm). Download the appropriate package for your distribution from the [Latest Release](https://github.com/Kubaguette/bazzite-architect/releases/latest) and install it:

- Debian/Ubuntu (.deb):

```sh
sudo apt install ./Bazzite-Architect_1.0.0_amd64.deb
```

(Or using dpkg: `sudo dpkg -i Bazzite-Architect_1.0.0_amd64.deb && sudo apt-get install -f`)

- Fedora/RHEL (.rpm):

```sh
sudo dnf install ./Bazzite-Architect-1.0.0.x86_64.rpm
```

*Note: Make sure Podman and Distrobox are available on your system (standard on Bazzite).*

---


### Installation (developer mode)

Development should run inside a mutable container (Distrobox/toolbox) because the host OS is immutable. Example:

```sh
# create or enter your mutable development container
# distrobox create --name devbox --image registry.fedoraproject.org/fedora-toolbox:latest --yes
distrobox enter devbox
```

1. Clone the repository and install dependencies

```sh
git clone https://github.com/Kubaguette/bazzite-architect.git
cd bazzite-architect
npm install

# On Fedora/Bazzite/Kinoite (and other dnf-based immutable spins) install additional native deps needed
# for WebKit/Gtk bindings and build tools before running the Tauri build:
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel gtk3-devel gcc gcc-c++ make
```

2. Start the unified development workflow

```sh
# Run the unified dev command from the project root
npm run tauri dev
```

Note: npm run tauri dev compiles the Rust backend and starts the Vite dev server together, providing a single, integrated developer loop appropriate for immutable-host workflows. See ARCHITECTURE.md for additional environment caveats (for example, PKG_CONFIG for webkit bindings).

---

## Developer Hub

This repository includes a comprehensive design document: **ARCHITECTURE.md** — the Technical Design Authority for the project. It contains in-depth explanations of the sync logic, I/O safety model (bounded parallelism, caching, cancellation), storage heuristics, and contribution guidelines.

> Read the Technical Design Authority: [ARCHITECTURE.md](./ARCHITECTURE.md)

If you are contributing or auditing the implementation, start there.

---

## Contributing

We welcome contributions that respect the project's architecture and testing boundaries. Please consult ARCHITECTURE.md before making large structural changes; follow the Core → Commands → View separation and prefer small, reviewable PRs.

---

## Author

**Kubaguette**
*Frontend Engineer | Exploring Rust & Linux Systems*

- 🐙 [GitHub Profile](https://github.com/Kubaguette)
- 💰 Inspiration: [Goldgrube Coin Tool](https://github.com/Kubaguette/goldgrube-coin-tool)

---

## License

Bazzite Architect is distributed under the GNU General Public License v3.0. See LICENSE for details.

---

Built by developers, for the Bazzite community. Aiming for native, frictionless engineering.