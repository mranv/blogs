# Anubhav Gain — Security Engineering Blog
## Full Content Index for LLM Ingestion

> This file contains comprehensive, structured content about Anubhav Gain's work, expertise, projects, and blog content for LLM context ingestion. For a navigational index, see /llms.txt.

---

## Identity

**Name:** Anubhav Gain
**Alias:** mranv
**Location:** Ahmedabad, Gujarat, India
**Roles:** Security Software Engineer at Infopercept Consulting | CEO & Founder at TechAnv Consulting
**Expertise:** DevSecOps, XDR/OXDR Platform Architecture, Windows Kernel Security, Rust Programming, eBPF Development, Go Programming, Kubernetes Platform Engineering, Cloud-Native Security
**Citations:** 222+ Research Citations
**Contact:** contact@techanv.com | https://in.linkedin.com/in/anubhavgain

---

## Technical Expertise (Comprehensive)

### Systems Programming
- Rust (safe systems programming, no-std, kernel-mode with windows-drivers-rs)
- Go (TUI with Bubble Tea, Kubernetes operators, REST APIs, monitoring platforms)
- C/C++ (kernel-adjacent tooling)
- eBPF (Linux kernel observability and security)

### Security Engineering
- Windows Kernel Security: Ring 0 drivers, KMDF v1.33, five kernel callbacks (process/thread/image/registry/object), SSDT/IDT/MSR hook scanning, ELAM, pool-tag memory forensics
- EDR/XDR Platform Development: detection engine, MITRE ATT&CK mapping (16 techniques), telemetry streaming
- eBPF File Monitoring: inotify API, timestamped change tracking
- Network Security: bind/reverse shells, PCAP analysis, network forensics
- SIEM: Wazuh configuration, rule authoring, ML anomaly detection
- OCSF (Open Cybersecurity Schema Framework): JSON crawling and ETL

### Platform & Infrastructure
- Kubernetes: multi-cluster management, GitOps CI/CD, RBAC, observability (metrics/logs/traces)
- DevSecOps: security-integrated CI/CD pipelines, shift-left security
- Cloud Security: AWS (EC2, S3, IAM, CloudWatch), Azure, multi-cloud
- Container Security: Docker, microservices, zero trust
- OpenSearch: extensions API, search pipelines, custom analyzers, ingest processors

---

## Flagship Open-Source Projects (Full Detail)

### Leviathan
**Repo:** https://github.com/anubhavg-icpl/leviathan
**Language:** Rust (safe, no unsafe blocks)
**Target:** Windows 10/11, x86_64 and ARM64
**Description:** Production-grade Windows kernel-mode security framework using Microsoft's windows-drivers-rs (KMDF v1.33). Implements the full EDR/XDR primitive stack at Ring 0.

**Technical capabilities:**
- Five kernel callbacks: process creation, thread creation, image load, registry operations, object operations
- Rules-and-behavioral detection engine with MITRE ATT&CK mapping across 16 techniques
- Pool-tag memory forensics for rootkit detection
- SSDT/IDT/MSR hook scanning
- ELAM (Early Launch Anti-Malware) support
- Lock-free MDL-mapped ring buffer for zero-copy kernel-to-user telemetry streaming
- Targets x86_64 and ARM64 Windows 10/11

### Krustron
**Repo:** https://github.com/anubhavg-icpl/krustron
**Language:** Go
**Description:** Open-source alternative to Devtron for Kubernetes platform engineering teams. Unified dashboard for multi-cluster management, end-to-end GitOps CI/CD pipeline orchestration, integrated observability (metrics, logs, traces), and security scanning with fine-grained RBAC. Replaces fragmented toolchain of ArgoCD + Grafana + custom scripts with a single opinionated operator platform.

### Agni
**Repo:** https://github.com/anubhavg-icpl/agni
**Language:** Go (Bubble Tea TUI framework)
**Description:** Terminal UI for managing Firecracker microVMs. Forked and extended firectl to add an interactive TUI layer for developers who need to launch, configure, inspect, and teardown microVMs without memorizing CLI flags. Useful for local development environments, CI workloads, and edge compute scenarios running on bare-metal Linux with KVM.

### opensearch-rust-sdk
**Repo:** https://github.com/Infopercept/opensearch-rust-sdk
**Language:** Rust
**Description:** High-performance Rust SDK for the OpenSearch Extensions API under the Infopercept organization. Provides async-first, strongly-typed bindings for building custom OpenSearch extensions — search pipelines, custom analyzers, and ingest processors — without JVM overhead. Designed for production-grade Rust services integrating with OpenSearch clusters.

### ebpf-file-monitor (RustInotifyTracker)
**Repo:** https://github.com/mranv/ebpf-file-monitor
**Language:** Rust
**Period:** Jan 2024 – Feb 2024
**Description:** Sophisticated Rust program for efficient file monitoring using the inotify API on Linux. Uses Rust, inotify on Linux, and eBPF to create a robust file monitoring solution. Tracks modifications in a specified file and provides detailed timestamped logs.

### rshell Backdoor
**Repo:** https://github.com/mranv/rshell-backdoor
**Language:** Rust
**Period:** Jan 2024 – Feb 2024
**Description:** Rust-based bind and reverse shell implementation for ethical security research and penetration testing. Features multithreaded bind shell server, configurable ports, and reverse shell with netcat listener setup. Promotes responsible and ethical usage.

### status
**Repo:** https://github.com/anubhavg-icpl/status
**Language:** Go
**Description:** Enterprise-grade status page and monitoring platform. Supports multi-service health check scheduling, incident lifecycle management, historical uptime reporting, and real-time email/webhook subscriber notifications. Fully self-hosted with clean operator UI. Production alternative to Atlassian Statuspage or Cachet.

### vibe
**Repo:** https://github.com/anubhavg-icpl/vibe
**Description:** Professionally organized library of AI chat modes and system prompts engineered for software development workflows. Covers specialized personas for backend architecture, security threat modeling, code review, incident debugging, API design, and DevOps. Compatible with Claude, GPT-4, and other AI assistants.

### ocsf-rust-crawler
**Repo:** https://github.com/mranv/ocsf-rust-crawler
**Language:** Rust
**Description:** Rust application for crawling the Open Cybersecurity Schema Framework (OCSF) JSON API on a scheduled interval. Fetches JSON responses from configurable URL endpoints, saves to timestamped files. Demonstrates async requests with reqwest, JSON serialization with serde, configurable scheduling with chrono, and error handling.

### r-logger (Rust Logger)
**Repo:** https://github.com/mranv/r-logger
**Language:** Rust
**Description:** Lightweight logging utility for tracking user activities and executed queries within complex applications. Balances simplicity with efficiency for monitoring critical interactions.

### Minimal Linux Image
**Repo:** https://github.com/mranv/simple-linux-os
**Description:** Step-by-step guide to building a compact Linux OS from source. Custom compiled Linux 5.x kernel, Busybox for lightweight system utilities, tiny initramfs instead of full root filesystem, Syslinux bootloader. Results in a ~5MB Linux system image for x86_64. Use cases: embedded systems, IoT, container hosts, network appliances.

### PU SUPPORT
**Period:** Mar 2023 – Apr 2023
**Association:** Parul University
**Stack:** PHP, MySQL
**Description:** Customer support help desk system for Parul University. Multi-channel support, 24/7 availability, ticket management system, performance metrics. Contact: contact@techanv.com.

### PU Assets Management System
**Association:** Parul University
**Stack:** PHP, MySQL
**Description:** Asset management system for educational institutions. Tracks, monitors, and maintains physical assets. Features audit trails, analytics, compliance documentation, and resource allocation optimization.

---

## App Control for Business Documentation Series

43 posts covering Microsoft App Control for Business (formerly WDAC/AppLocker):

### Main Series (Part 1–8)
1. Part 1: Introduction & Key Concepts — why application control matters, trust model shift from reactive to proactive, deployment, licensing, device requirements, App Control vs AppLocker, policy formats, policy types, core terminology
2. Part 2: Policy Templates & Rule Options — base policy templates, supplemental policies, rule option overview
3. Part 3: AppID Tagging & Managed Installer — application identity tagging, managed installer configuration, installation workflows
4. Part 4: Starter Base Policy (Lightly Managed) — policy for BYOD/lightly managed devices, audit mode setup
5. Part 5: Base Policy (Fully Managed Devices) — strict enforcement policy for corporate-managed endpoints
6. Part 6: Sign, Apply & Remove Signed Policies — code signing workflow, policy deployment and removal lifecycle
7. Part 7: Maintaining Policies with Azure DevOps & PowerShell — CI/CD-driven policy management, automated testing
8. Part 8: AppLocker, Option 13 & Selective MSI Allowlisting — end-to-end MSI allowlisting with managed installer

### File Rule Levels (12 reference posts)
Covers all WDAC file rule levels: Hash, FileName, FilePath, FilePublisher, Publisher, LeafCertificate, PcaCertificate, RootCertificate, SignedVersion, WHQL, WHQLPublisher, WHQLFilePublisher

### Rule Options (21 reference posts)
Covers all WDAC policy rule options: Option 0 (UMCI) through Option 20 (Revoked/Expired as Unsigned), plus DevMode Dynamic Code Trust

---

## CTF & Security Writeup Coverage

### CyberDefenders (Blue Team CTF)
Over 100 writeups covering: Cloud Forensics (AWS, Azure), Malware Analysis, Network Forensics (PCAP), Memory Forensics, Threat Hunting, Log Analysis, Incident Response

### HackTheBox
Machine and challenge writeups including VulnLab environments

### TryHackMe
Blue team learning paths, SOC analyst challenges, incident response rooms

### LetsDefend
SIEM-based challenge writeups, brute force detection, alert triage

### Security Blue Team (BTLO)
Investigation challenges: Aspen, Haunted, Masquerade, PikaBoo, Rotten Cloud, The Walking Packets

### Competition Writeups
- Cyber Range Thailand 2024 (Qualifier and Final)
- n00bz CTF 2024
- SECPlayground Bloody Xmas 2024 CTF

---

## Blog Technical Stack

- **Framework:** Astro (static site generator)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Cloudflare Pages (https://mranv.pages.dev)
- **Features:** Dark mode, full-text search, RSS feed, sitemap, OG image generation, reading time, table of contents, syntax highlighting (Expressive Code), KaTeX math rendering, Mermaid diagrams

---

## Companies

### Infopercept Consulting
- URL: https://infopercept.com
- Role: Security Software Engineer
- Focus: XDR/OXDR platform development, enterprise security solutions, SIEM, EDR

### TechAnv Consulting
- URL: https://www.techanv.com
- Role: CEO & Founder
- Email: contact@techanv.com
- Services: Enterprise security consulting, XDR platform development, DevSecOps implementation, cloud security architecture, Kubernetes platform engineering, Windows kernel security development

---

## Content License

All blog content is licensed under CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)
