# Hey, I'm Anubhav.

I build security software. Mostly the low-level kind: kernel drivers, eBPF probes, Rust agents that sit on a machine and watch what it does. I'm based in Ahmedabad, Gujarat, India.

By day I'm a Security Product Engineer at Infopercept, working on the Invinsense XDR/OXDR platform. I also run my own shop, TechAnv Consulting, which I started in December 2022.

## What I actually do

At Infopercept I'm one of the core engineers on Invinsense. That means XDR deployments for single and multi-tenant setups, custom OpenSearch Dashboard plugins for threat visualization, and cross-platform Rust agents that collect telemetry and catch bad things. Plus the unglamorous parts: DevSecOps pipelines, Docker and Kubernetes, SIEM rules, ML anomaly detection, OCSF schemas.

At TechAnv I help companies with XDR architecture, Windows kernel driver development, Kubernetes platform engineering, cloud security on AWS and Azure, and zero-trust networks. If that sounds like your problem, say hi at [techanv.com](https://www.techanv.com).

Before Infopercept I was a DevSecOps Engineer at Atcults (security testing pipelines, Terraform, incident response automation, Kubernetes hardening). Before all that I was an IT Specialist at Parul University, wrangling Palo Alto firewalls, Red Hat and Windows servers, AWS, and Endpoint Configuration Manager.

## Why I build this way

I write Rust wherever I can. My Windows kernel EDR has zero unsafe blocks, and I'd like to keep it that way. Security tooling that crashes the machine it's protecting isn't security tooling.

I also don't like tools that make you fight them. If an SDK needs a JVM it shouldn't need, or a VM launcher makes you memorize twenty CLI flags, I'd rather build the one that doesn't.

## Things I've made

- **[Leviathan](https://github.com/anubhavg-icpl/leviathan)**\
  A Windows kernel EDR/XDR framework in Rust. Ring 0, KMDF, five kernel callbacks, MITRE ATT&CK mapping, ELAM support, zero unsafe blocks.
- **[Krustron](https://github.com/anubhavg-icpl/krustron)**\
  An open-source Kubernetes platform. One place for multi-cluster management, CI/CD, observability and RBAC.
- **[Agni](https://github.com/anubhavg-icpl/agni)**\
  A terminal UI for Firecracker microVMs. Launch, configure, inspect and tear down without touching a CLI flag.
- **[opensearch-rust-sdk](https://github.com/Infopercept/opensearch-rust-sdk)**\
  An async-first, strongly-typed OpenSearch Extensions SDK. No JVM.
- **[ebpf-file-monitor](https://github.com/mranv/ebpf-file-monitor)**\
  File monitoring with inotify and eBPF, with timestamped audit logs.

More on the [projects page](/projects/).

## What's in my toolbox

Rust first (safe systems, no-std, kernel mode with windows-drivers-rs), then Go for TUIs, Kubernetes operators and APIs, plus C/C++, Python, Bash and PowerShell.

On the security side: the Windows kernel (Ring 0, KMDF, SSDT/IDT/MSR), EDR/XDR internals, eBPF, MITRE ATT&CK, OCSF, Wazuh and YARA. For infrastructure: Kubernetes, Terraform, Ansible, Docker, AWS, Azure and Palo Alto. For data: OpenSearch (Extensions API, custom analyzers, ingest processors), Elasticsearch, tracing and metrics pipelines.

## The paper trail

I studied Cyber/Computer Forensics and Counterterrorism at Parul University (B.Tech, 2021–2025). Along the way I picked up:

- Licentiate in Cybersecurity Management from Charles Sturt University (93/100, High Distinction), 2023
- Licentiate in Ransomware Techniques from Charles Sturt University, 2023
- C3SA Premium Edition, 2024
- IBM Cybersecurity Analyst Professional Certificate, 2023
- AWS Educate: Getting Started with Security, 2023
- Open Source Software Development, Linux and Git Specialization, 2023
- Harvard CS50
- Cisco Networking Basics and Introduction to Cybersecurity

I've also done industry engagements with **JPMorgan Chase & Co.** (payment fraud analysis), **PwC** (phishing simulation and information defense), **AIG** (zero-day and ransomware response) and **Clifford Chance** (ICO regulatory compliance and data-leak claims).

## Say hi

- [Portfolio](https://mranv.github.io/)
- [GitHub](https://github.com/mranv)
- [GitHub (Infopercept)](https://github.com/anubhavg-icpl)
- [LinkedIn](https://in.linkedin.com/in/anubhavgain)
- [Email](mailto:contact@techanv.com)

*Building robust, scalable defenses, one line of Rust at a time.*
