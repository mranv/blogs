# Open-Source Projects

A collection of production-grade tools and frameworks spanning Windows kernel security, Kubernetes platform engineering, eBPF observability, and systems programming in Rust and Go.

---

## Security & Kernel Engineering

### [Leviathan](https://github.com/anubhavg-icpl/leviathan)
**Windows Kernel-Mode EDR/XDR Framework in Safe Rust**

`Rust` `Windows` `Ring 0` `KMDF v1.33` `x86_64` `ARM64`

Production-grade kernel security framework using Microsoft's **windows-drivers-rs** with **zero unsafe blocks**. Implements the complete EDR/XDR primitive stack at Ring 0.

**Capabilities:**
- Five kernel callbacks: process creation, thread creation, image load, registry operations, object operations
- Rules-and-behavioral detection engine with **MITRE ATT&CK mapping across 16 techniques**
- Pool-tag memory forensics for rootkit detection
- SSDT / IDT / MSR hook scanning for integrity verification
- ELAM (Early Launch Anti-Malware) support
- Lock-free MDL-mapped ring buffer for zero-copy kernel-to-user telemetry streaming

---

### [ebpf-file-monitor](https://github.com/mranv/ebpf-file-monitor)
**eBPF File Monitoring with inotify**

`Rust` `eBPF` `inotify` `Linux`

High-performance file monitoring using the inotify API and eBPF on Linux. Tracks file modifications with detailed timestamped logs. Demonstrates kernel-userspace communication patterns in safe Rust.

---

### [rshell](https://github.com/mranv/rshell-backdoor)
**Rust Bind/Reverse Shell for Security Research**

`Rust` `Networking` `Penetration Testing`

Multithreaded bind shell server and reverse shell implementation for authorized penetration testing and security research engagements. Configurable ports, netcat-compatible listener setup.

---

### [ocsf-rust-crawler](https://github.com/mranv/ocsf-rust-crawler)
**OCSF Schema Crawler**

`Rust` `OCSF` `async` `reqwest` `serde`

Scheduled crawler for the Open Cybersecurity Schema Framework (OCSF) JSON API. Fetches and archives responses with timestamped output files. Uses async HTTP with reqwest, JSON serialization with serde, and scheduled execution with chrono.

---

## Platform & Infrastructure Engineering

### [Krustron](https://github.com/anubhavg-icpl/krustron)
**Kubernetes Platform Engineering — Open-Source Devtron Alternative**

`Go` `Kubernetes` `GitOps` `Multi-cluster` `RBAC` `Observability`

Unified operator platform for enterprise Kubernetes teams. Replaces fragmented toolchains (ArgoCD + Grafana + custom scripts) with a single opinionated platform:

- Multi-cluster Kubernetes management
- End-to-end GitOps CI/CD pipeline orchestration
- Integrated observability: metrics, logs, distributed traces
- Security scanning with fine-grained RBAC

---

### [Agni](https://github.com/anubhavg-icpl/agni)
**Firecracker microVM Terminal UI**

`Go` `Bubble Tea` `Firecracker` `KVM` `Linux`

Interactive TUI for managing Firecracker microVMs, built on the Bubble Tea framework. Extends firectl with a full interactive layer for launching, configuring, inspecting, and tearing down microVMs. Designed for local development, CI workloads, and edge compute on bare-metal Linux with KVM.

---

### [opensearch-rust-sdk](https://github.com/Infopercept/opensearch-rust-sdk)
**High-Performance Rust SDK for OpenSearch Extensions**

`Rust` `async` `OpenSearch` `No JVM`

Async-first, strongly-typed Rust SDK for the OpenSearch Extensions API. Build custom search pipelines, analyzers, and ingest processors without JVM overhead. Designed for production Rust services integrating with OpenSearch clusters.

---

### [status](https://github.com/anubhavg-icpl/status)
**Enterprise Status Page & Monitoring Platform**

`Go` `Self-hosted` `Webhooks` `Incident Management`

Production-grade status page platform. Self-hosted alternative to Atlassian Statuspage or Cachet:

- Multi-service health check scheduling
- Incident lifecycle management
- Historical uptime reporting
- Real-time email and webhook subscriber notifications

---

## Developer Tools & Utilities

### [vibe](https://github.com/anubhavg-icpl/vibe)
**AI System Prompt Library for Engineering Workflows**

`AI` `Prompts` `Claude` `GPT-4`

Professionally organized library of AI chat modes and system prompts for software development workflows. Specialized personas for backend architecture, security threat modeling, code review, incident debugging, API design, and DevOps. Compatible with Claude, GPT-4, and other assistants.

---

### [r-logger](https://github.com/mranv/r-logger)
**Lightweight Rust Activity Logger**

`Rust` `Logging`

Lightweight logging utility for tracking user activities and executed queries in complex applications. Minimal dependencies, balancing simplicity with efficiency.

---

### [Minimal Linux Image](https://github.com/mranv/simple-linux-os)
**~5MB Linux OS from Source**

`Linux Kernel` `Busybox` `initramfs` `Syslinux` `x86_64`

Step-by-step build of a compact Linux OS: custom-compiled Linux 5.x kernel + Busybox + tiny initramfs + Syslinux bootloader. Results in a ~5MB x86_64 image. Reference for embedded systems, IoT devices, container hosts, and network appliances.

---

## Enterprise Software (Parul University)

### PU SUPPORT — University Help Desk
`PHP` `MySQL` `2023`

Customer support help desk system for Parul University. Multi-channel support, ticket management, SLA tracking, 24/7 availability, and performance metrics reporting.

### PU Assets Management System — Institutional Asset Tracker
`PHP` `MySQL`

Asset management system for educational institutions. Tracks and maintains physical assets with audit trails, compliance documentation, analytics, and resource allocation optimization.

---

## GitHub

- [github.com/mranv](https://github.com/mranv) — Personal projects: Rust, eBPF, security tools
- [github.com/anubhavg-icpl](https://github.com/anubhavg-icpl) — Infopercept organization: Leviathan, Krustron, Agni, opensearch-rust-sdk
