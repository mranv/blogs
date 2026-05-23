# Projects

A collection of open-source tools spanning kernel security, platform engineering, and systems programming.

---

## Security & Kernel

### [Leviathan](https://github.com/anubhavg-icpl/leviathan)

Windows kernel-mode EDR/XDR framework written entirely in safe Rust (Ring 0, KMDF). Features five kernel callbacks, MITRE ATT&CK-mapped detection, pool-tag forensics, SSDT/IDT hook scanning, and zero-copy telemetry streaming.

`Rust` `Ring 0` `KMDF` `Windows` `EDR`

### [ebpf-file-monitor](https://github.com/mranv/ebpf-file-monitor)

High-performance file monitoring on Linux using eBPF and inotify with timestamped logs and kernel-userspace communication in safe Rust.

`Rust` `eBPF` `inotify` `Linux`

### [rshell](https://github.com/mranv/rshell-backdoor)

Multithreaded bind and reverse shell for authorized penetration testing and security research. Netcat-compatible with configurable ports.

`Rust` `Networking` `Pentesting`

### [ocsf-rust-crawler](https://github.com/mranv/ocsf-rust-crawler)

Async crawler for the Open Cybersecurity Schema Framework (OCSF) JSON API. Fetches, archives, and timestamps schema responses.

`Rust` `OCSF` `async` `serde`

---

## Platform & Infrastructure

### [Krustron](https://github.com/anubhavg-icpl/krustron)

Unified Kubernetes platform engineering tool — an open-source Devtron alternative. Multi-cluster management, GitOps CI/CD, integrated observability, and RBAC in a single operator platform.

`Go` `Kubernetes` `GitOps` `Multi-cluster`

### [Agni](https://github.com/anubhavg-icpl/agni)

Interactive TUI for managing Firecracker microVMs, built on Bubble Tea. Launch, configure, inspect, and tear down microVMs for dev, CI, and edge compute workloads.

`Go` `Bubble Tea` `Firecracker` `KVM`

### [opensearch-rust-sdk](https://github.com/Infopercept/opensearch-rust-sdk)

Async-first, strongly-typed Rust SDK for the OpenSearch Extensions API. Build custom search pipelines and ingest processors without JVM overhead.

`Rust` `async` `OpenSearch` `No JVM`

### [status](https://github.com/anubhavg-icpl/status)

Self-hosted enterprise status page with health checks, incident lifecycle management, uptime reporting, and webhook/email notifications. Alternative to Atlassian Statuspage.

`Go` `Self-hosted` `Webhooks`

---

## Developer Tools

### [vibe](https://github.com/anubhavg-icpl/vibe)

Curated library of AI system prompts and chat modes for engineering workflows — backend architecture, threat modeling, code review, and DevOps. Compatible with Claude, GPT-4, and others.

`AI` `Prompts` `LLM`

### [Minimal Linux Image](https://github.com/mranv/simple-linux-os)

A ~5MB x86_64 Linux image built from source — custom kernel, Busybox, tiny initramfs, and Syslinux bootloader. Reference for embedded and container hosts.

`Linux` `Busybox` `x86_64`

### [r-logger](https://github.com/mranv/r-logger)

Lightweight Rust logging utility for tracking user activities and queries in complex applications. Minimal dependencies.

`Rust` `Logging`

---

## GitHub

- [mranv](https://github.com/mranv) — personal: Rust, eBPF, security tools
- [anubhavg-icpl](https://github.com/anubhavg-icpl) — org: Leviathan, Krustron, Agni
