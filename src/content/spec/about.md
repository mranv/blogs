# Anubhav Gain

## Security Software Engineer · XDR/OXDR Architect · Rust & eBPF Specialist

**Anubhav Gain** (alias: *mranv*) is a security software engineer and entrepreneur building production-grade security infrastructure at the intersection of systems programming, kernel engineering, and cloud-native architecture. Based in Ahmedabad, Gujarat, India.

Currently: **Security Software Engineer at Infopercept Consulting** (Invinsense XDR/OXDR platform) and **CEO & Founder at TechAnv Consulting** (enterprise security consulting). 222+ academic research citations.

---

## Professional Experience

### Security Software Engineer — Infopercept Consulting
*Ahmedabad, Gujarat · July 2024 – Present*

Leads core platform engineering for the **Invinsense XDR/OXDR** enterprise security platform:

- Architecture and development of single-tenant and multi-tenant XDR deployments
- Custom OpenSearch Dashboard plugins for threat visualization and analytics
- Cross-platform agent development in Rust for telemetry collection and detection
- DevSecOps pipelines: automated security testing, vulnerability scanning, shift-left enforcement
- Container orchestration with Docker and Kubernetes for multi-tenant deployments
- SIEM rule authoring, ML anomaly detection, OCSF schema integration

### CEO & Founder — TechAnv Consulting
*Vadodara, Gujarat · December 2022 – Present*

Founded and operates an enterprise security consulting firm specializing in:

- XDR/OXDR platform architecture and implementation
- Windows kernel security driver development
- Kubernetes platform engineering and GitOps CI/CD design
- DevSecOps pipeline design and security automation
- Cloud security architecture (AWS, Azure, multi-cloud)
- Zero-trust network architecture and implementation

**Contact:** contact@techanv.com · [techanv.com](https://www.techanv.com)

### DevSecOps Engineer — Atcults
*November 2023 – Present*

- Architected automated security testing pipelines with measurable vulnerability detection improvements
- Infrastructure as Code via Terraform for reproducible, secure deployments
- Comprehensive security monitoring, alerting, and incident response automation
- Kubernetes-based containerization strategy and hardening

### IT Specialist — Parul University
*November 2022 – October 2023*

- Palo Alto Networks firewall configuration and management
- Red Hat Linux and Windows Server administration
- AWS cloud infrastructure management
- Microsoft Endpoint Configuration Manager deployment

### Owner — Gain Fisheries
*Pakhanjur, Chhattisgarh · August 2020 – Present*

Manages a sustainable fish hatchery combining modern aquaculture practices with environmental stewardship.

---

## Flagship Open-Source Projects

### [Leviathan](https://github.com/anubhavg-icpl/leviathan) — Windows Kernel EDR/XDR Framework
*Rust · Windows 10/11 · Ring 0 · x86_64 & ARM64*

Production-grade Windows kernel-mode security framework using Microsoft's **windows-drivers-rs** (KMDF v1.33) in **safe Rust — zero unsafe blocks**. Implements the full EDR/XDR primitive stack at Ring 0:

- **Five kernel callbacks**: process creation, thread creation, image load, registry operations, object operations
- **Detection engine**: rules-and-behavioral analysis with **MITRE ATT&CK mapping across 16 techniques**
- **Pool-tag memory forensics** for rootkit and hidden allocation detection
- **SSDT/IDT/MSR hook scanning** for anti-tamper and integrity verification
- **ELAM** (Early Launch Anti-Malware) support for boot-time protection
- **Lock-free MDL-mapped ring buffer** for zero-copy kernel-to-user telemetry streaming

---

### [Krustron](https://github.com/anubhavg-icpl/krustron) — Kubernetes Platform Engineering
*Go · Kubernetes · GitOps · Multi-cluster*

Open-source alternative to Devtron for enterprise Kubernetes platform teams. Provides a unified operator platform replacing fragmented toolchains (ArgoCD + Grafana + custom scripts):

- Unified dashboard for multi-cluster Kubernetes management
- End-to-end GitOps CI/CD pipeline orchestration
- Integrated observability: metrics, logs, distributed traces
- Security scanning with fine-grained RBAC
- Single opinionated operator — no fragmented toolchain

---

### [Agni](https://github.com/anubhavg-icpl/agni) — Firecracker microVM Terminal UI
*Go · Bubble Tea TUI · KVM · Linux*

Terminal UI for managing Firecracker microVMs. Extends firectl with a full interactive TUI layer — launch, configure, inspect, and teardown microVMs without memorizing CLI flags. Built for local development, CI workloads, and edge compute on bare-metal Linux with KVM.

---

### [opensearch-rust-sdk](https://github.com/Infopercept/opensearch-rust-sdk) — OpenSearch Extensions SDK
*Rust · Async · OpenSearch · No JVM*

High-performance Rust SDK for the OpenSearch Extensions API under the Infopercept organization. Async-first, strongly-typed bindings for building custom OpenSearch extensions — search pipelines, custom analyzers, and ingest processors — without JVM overhead. Designed for production Rust services integrating with OpenSearch clusters.

---

### [ebpf-file-monitor](https://github.com/mranv/ebpf-file-monitor) — eBPF File Monitoring
*Rust · eBPF · inotify · Linux · Jan–Feb 2024*

Sophisticated file monitoring system using the **inotify API** and **eBPF** on Linux. Tracks modifications with detailed timestamped logs. Demonstrates high-performance kernel-userspace communication patterns in Rust.

---

### [rshell](https://github.com/mranv/rshell-backdoor) — Rust Security Research Shell
*Rust · Jan–Feb 2024*

Rust-based bind and reverse shell implementation for ethical security research and penetration testing. Multithreaded bind shell server with configurable ports, reverse shell with netcat listener setup. Built for authorized security testing engagements.

---

### [status](https://github.com/anubhavg-icpl/status) — Enterprise Status Page Platform
*Go*

Enterprise-grade status page and monitoring platform. Multi-service health check scheduling, incident lifecycle management, historical uptime reporting, real-time email/webhook subscriber notifications. Fully self-hosted — production alternative to Atlassian Statuspage or Cachet.

---

### [vibe](https://github.com/anubhavg-icpl/vibe) — AI System Prompt Library
Professionally organized library of AI chat modes and system prompts for software development workflows. Specialized personas for backend architecture, security threat modeling, code review, incident debugging, API design, and DevOps. Compatible with Claude, GPT-4, and other assistants.

---

### [ocsf-rust-crawler](https://github.com/mranv/ocsf-rust-crawler) — OCSF Schema Crawler
*Rust · OCSF · async*

Rust application for crawling the **Open Cybersecurity Schema Framework (OCSF)** JSON API on a scheduled interval. Timestamped output files with async HTTP (reqwest), JSON serialization (serde), and scheduled execution (chrono).

---

### [Minimal Linux Image](https://github.com/mranv/simple-linux-os) — ~5MB Linux OS from Source
Custom-compiled **Linux 5.x kernel** + **Busybox** + tiny initramfs + Syslinux bootloader. Results in a ~5MB Linux system image for x86_64. Practical reference for embedded systems, IoT, container hosts, and network appliances.

---

### [r-logger](https://github.com/mranv/r-logger) — Rust Activity Logger
*Rust*

Lightweight logging utility for tracking user activities and executed queries in complex applications. Balances simplicity with efficiency for monitoring critical interactions.

---

### PU SUPPORT — University Help Desk System
*PHP · MySQL · Mar–Apr 2023 · Parul University*

Customer support help desk for Parul University. Multi-channel support, 24/7 availability, ticket management, SLA tracking, and performance metrics.

---

### PU Assets Management System — Institutional Asset Tracker
*PHP · MySQL · Parul University*

Asset management system for educational institutions. Tracks and maintains physical assets with audit trails, analytics, compliance documentation, and resource allocation optimization.

---

## Industry Engagements

| Organization | Engagement | Focus |
|---|---|---|
| **JPMorgan Chase & Co.** | Data Analyst — Fraud Detection (July 2023) | Financial payment fraud dataset analysis, prevention strategy development |
| **PwC** | Cybersecurity | Phishing simulation, integrated information defense |
| **AIG** | Zero-day Response | Ransomware bypassing techniques and mitigation |
| **Clifford Chance** | ICO Regulatory Compliance | Data leak damages claims, regulatory framework |

---

## Education

| Degree / Certification | Institution | Year |
|---|---|---|
| B.Tech in Cyber/Computer Forensics and Counterterrorism | Parul University | 2021–2025 |
| Licentiate in Cybersecurity Management (93/100 — High Distinction) | Charles Sturt University | 2023 |
| Licentiate in Ransomware Techniques | Charles Sturt University | 2023 |
| C3SA Premium Edition | — | April 2024 |
| IBM Cybersecurity Analyst Professional Certificate | IBM | October 2023 |
| AWS Educate — Getting Started with Security | AWS | October 2023 |
| Open Source Software Development, Linux and Git Specialization | — | October 2023 |
| Harvard CS50 | Harvard | — |
| Cisco Networking Basics & Introduction to Cybersecurity | Cisco | — |

---

## Technical Stack

**Systems Programming:** Rust (primary — safe systems, no-std, kernel-mode with windows-drivers-rs), Go (TUI, Kubernetes operators, REST APIs), C/C++ (kernel-adjacent), Python, Bash, PowerShell

**Security Engineering:** Windows kernel security (Ring 0, KMDF, 5 kernel callbacks, SSDT/IDT/MSR), EDR/XDR platform development, eBPF (Linux observability and security), MITRE ATT&CK, OCSF, Wazuh SIEM, YARA

**Platform & Infrastructure:** Kubernetes (multi-cluster, RBAC, GitOps), Terraform, Ansible, Docker, AWS (EC2, S3, IAM, CloudWatch), Azure, Palo Alto Networks

**Data & Observability:** OpenSearch (Extensions API, custom analyzers, ingest processors), Elasticsearch, distributed tracing, metrics pipelines

---

## Research

**222+ citations** on Google Scholar. Research contributions include:

- Co-authored work on EEG-based emotion recognition using LSTM networks
- Multiple papers spanning cybersecurity, scripting automation, and system administration
- Active research in emerging security threats, kernel security, and defense mechanisms

[Google Scholar Profile](https://scholar.google.com/citations?user=yhcz3TkAAAAJ&hl=en)

---

## Online Presence

- **GitHub (personal):** [github.com/mranv](https://github.com/mranv)
- **GitHub (Infopercept):** [github.com/anubhavg-icpl](https://github.com/anubhavg-icpl)
- **LinkedIn:** [in.linkedin.com/in/anubhavgain](https://in.linkedin.com/in/anubhavgain)
- **Blog:** [mranv.pages.dev](https://mranv.pages.dev)
- **Email:** contact@techanv.com

---

*Building robust, scalable defenses one line of Rust at a time.*
