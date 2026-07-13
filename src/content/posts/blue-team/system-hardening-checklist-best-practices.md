---
title: 'System Hardening: A Practical Checklist and Best-Practices Guide'
author: Anubhav Gain
pubDatetime: 2026-07-10T00:00:00.000Z
slug: system-hardening-checklist-best-practices
draft: false
featured: false
description: 'A category-by-category system hardening checklist for Windows and Linux — accounts, network, firewall, patching, services, logging, physical — mapped to CIS, NIST and STIG, plus the process and tooling to keep it maintained.'
tags:
- system-hardening
- cis-benchmarks
- nist
- stig
- windows-security
- linux-security
- compliance
- blue-team
category: Blue Team
lang: en
---

# System Hardening: A Practical Checklist and Best-Practices Guide

Your security is only as strong as your weakest configuration. Default settings are the single most common reason a freshly deployed system becomes an entry point — open ports, enabled services, default credentials, and permissive file ACLs that attackers scan for within minutes of a box touching the internet.

System hardening is the disciplined process of closing those gaps. Done well it is unglamorous, repeatable work that makes every other control you own more effective: detection has less noise to sift, incident response has fewer pivot paths to trace, and compliance audits become a paperwork exercise instead of a fire drill. This guide is a practical, category-by-category checklist plus the framework mapping, tooling, and process needed to keep hardening a habit rather than a one-off project.

## Table of Contents

1. [What Hardening Actually Is (and Isn't)](#1-what-hardening-actually-is-and-isnt)
2. [Why It Matters](#2-why-it-matters)
3. [The Checklist, by Category](#3-the-checklist-by-category)
4. [Windows-Specific Hardening](#4-windows-specific-hardening)
5. [Linux-Specific Hardening](#5-linux-specific-hardening)
6. [Types of Hardening](#6-types-of-hardening)
7. [Frameworks: CIS, NIST, STIG](#7-frameworks-cis-nist-stig)
8. [Building a Repeatable Process](#8-building-a-repeatable-process)
9. [Tooling](#9-tooling)
10. [Mistakes That Quietly Erode a Program](#10-mistakes-that-quietly-erode-a-program)
11. [References](#11-references)

---

## 1. What Hardening Actually Is (and Isn't)

**System hardening** is reducing a system's attack surface by changing how it is configured — disabling unused services, removing default accounts, tightening permissions, restricting network paths, and enabling logging. It shrinks the set of things an attacker can reach and the ways they can move once inside.

It is worth separating hardening from two neighbours it is constantly confused with:

- **Patching** fixes *known vulnerabilities* in software.
- **Hardening** changes *configuration* so that vulnerabilities are harder to reach or exploit in the first place.

Both sit under the vulnerability-management umbrella. Neither substitutes for the other. An unpatched CVE on a disabled service is not exposed; a fully patched service that listens on `0.0.0.0` with default credentials still is.

## 2. Why It Matters

Systems ship optimised for *ease of use*, not security. That means default-on services, default accounts, and generous defaults — exactly the things attackers enumerate. Misconfiguration consistently ranks among the top breach causes, and out-of-the-box settings are the usual culprit.

There is also a compliance dimension. CIS Benchmarks, NIST SP 800-53, and DISA STIGs all encode hardening requirements, and regimes like HIPAA, PCI DSS, and CMMC expect documented, applied hardening as evidence of due diligence. Hardening to a recognised baseline is simultaneously good engineering and audit-ready evidence.

The practical payoff: a hardened system is harder to compromise, cheaper to defend, and less likely to be the foothold that turns into a ransomware event.

## 3. The Checklist, by Category

Not every item applies to every host. Treat this as a starting point, adapt it to the system's role, and cross-reference the relevant CIS Benchmark for authoritative detail.

| Category | What to do | Type | Maps to |
|---|---|---|---|
| **Accounts & access** | Disable default accounts; enforce password policy; least privilege; MFA for privileged access | OS hardening | CIS, NIST SP 800-53 |
| **Network config** | Default-deny rules; disable unused ports/protocols; segment networks | Network hardening | CIS, NIST SP 800-53 |
| **Firewall** | Default-deny inbound and outbound; log matches | Network hardening | CIS, DISA STIG |
| **Patching** | Cadence for OS + third-party; retire EOL software | OS hardening | NIST SP 800-40 |
| **Windows-specific** | Disable SMBv1/LLMNR/PowerShell v2; enable BitLocker, Credential Guard, UAC; restrict RDP | OS hardening | CIS, DISA STIG |
| **Linux-specific** | Disable root SSH; key-based auth; SELinux/AppArmor enforcing; auditd | OS hardening | CIS, DISA STIG |
| **Services & apps** | Remove unused services; least-privilege service accounts; strip sample/default files | Application hardening | CIS |
| **Logging & monitoring** | Audit logging; centralise; retention; high-priority alerts | OS hardening | NIST SP 800-92, PCI DSS |
| **Physical** | Restrict access; BIOS/UEFI password; disable alternate boot; encrypt portables | OS hardening | NIST SP 800-53 |

### 3.1 User accounts and access controls

Default accounts are the first thing attackers go after. Disable or rename the built-in Administrator on Windows and create named admin accounts in its place; on Linux, disable direct `root` login over SSH and require `sudo` escalation.

- Enforce a password policy (12–16+ characters, complexity, rotation per policy).
- MFA for every privileged account and every remote-access path.
- Least privilege across users **and** service accounts — only the permissions the job needs, nothing more.
- Audit accounts regularly; disable inactive ones; restrict who can add accounts to privileged groups; disable guest accounts everywhere.

### 3.2 Network configuration

Close any port you don't need, document the ones you leave open, and disable insecure protocols — Telnet, FTP, SNMPv1/v2, and TLS 1.0/1.1 have no business being on by default in 2026.

- Segment the network so a compromised host isn't a beachhead to everything else. Separate servers from workstations; keep OT/IoT off the corporate network.
- Restrict management interfaces (RDP, SSH, web admin consoles) to specific IP ranges or a management VLAN.
- Disable IP source routing and ICMP redirects on servers and network devices.
- Configure DNS to refuse zone transfers to unauthorised hosts.
- Log inbound and outbound traffic so incident response has something to work from.

### 3.3 Firewall configuration

A perimeter firewall is not enough. Enable the host firewall on every system and treat each host as its own line of defence — default-deny for both directions, then explicit allow rules.

- Restrict outbound traffic from servers; a server rarely has business initiating arbitrary internet connections.
- Log rule matches (especially denies) and review them.
- Test rules after every change.

### 3.4 Patch management

Set a cadence and stick to it: critical within 24–72 hours, high within 7–14 days, the rest within 30 days, adjusted to risk tolerance. Enable automatic updates where it makes sense, but **test** patches in staging before pushing to production servers.

Don't stop at the OS — browsers, runtimes (Java), PDF readers, and other third-party apps are frequent attack vectors. Track end-of-life hardware and software; unsupported systems should be isolated or replaced, not left in place.

### 3.5 Logging and monitoring

Logging is only useful if it is configured correctly **and someone looks at it**. At minimum, audit authentication (success and failure), privilege escalation, account changes, and policy changes — then centralise in a SIEM so logs survive local tampering and can be correlated.

- Set retention to meet compliance (commonly 90 days to one year).
- Alert on high-signal events: repeated failed logins, a new local admin, a service installed outside a change window.
- Sync everything to a reliable NTP source so timestamps are forensic-quality.

### 3.6 Physical security controls

Physical access is the easy-to-forget attack surface. Restrict access to servers and network gear; set BIOS/UEFI passwords; configure systems to boot only from the primary drive; disable USB/optical boot; and enable full-disk encryption on laptops.

## 4. Windows-Specific Hardening

- Disable unused features/roles: PowerShell v2, SMBv1, LLMNR, NetBIOS over TCP/IP, Windows Script Host where unused.
- Keep Defender (or equivalent) on with current definitions.
- Configure AppLocker **or** WDAC for application control; enable Credential Guard and Device Guard on supported hardware.
- Disable AutoRun/AutoPlay for removable media.
- Configure UAC to prompt on all admin actions.
- Enable BitLocker on workstations and laptops.
- Restrict registry and sensitive path access with ACLs.
- Disable RDP where unused; where required, restrict to specific users and source IPs.

## 5. Linux-Specific Hardening

- Disable `root` SSH login; require `sudo` escalation.
- SSH key-based auth only; disable password auth; consider a non-default port.
- Host firewall (`iptables`/`nftables`) with default-deny.
- Remove unused packages and services via the package manager.
- Correct file permissions — world-writable paths are a classic misconfiguration.
- SELinux or AppArmor in **enforcing** mode.
- `auditd` for privileged command execution, file-access changes, and authentication events.
- Disable USB storage if removable media isn't needed.
- Set a GRUB bootloader password.

## 6. Types of Hardening

Hardening isn't one thing applied to one layer — it is a set of practices applied across the environment.

- **Operating-system hardening** — the base layer: services, accounts, password policy, OS-level config. Usually the starting point.
- **Network hardening** — firewall rules, port restrictions, disabling unused protocols, segmentation, replacing Telnet/FTP with encrypted alternatives.
- **Application hardening** — strip debug features and default admin accounts; least-privilege runtime; disable unused web-server modules; remove sample files; enforce TLS.
- **Server hardening** — OS + application hardening applied to server roles, with emphasis on installing only what the server's job requires.
- **Database hardening** — disable default accounts, restrict network access to the DB port, enable auditing, encrypt sensitive data.
- **Cloud hardening** — the same principles (least privilege, disable unused services, audit logging) applied to cloud primitives: tighten IAM roles, lock down storage buckets, restrict management-console exposure. CIS publishes cloud benchmarks for AWS, Azure, and GCP.

## 7. Frameworks: CIS, NIST, STIG

You don't build a baseline from scratch. Established frameworks give a documented, tested starting point and make audits easier — CIS or NIST alignment is widely accepted as due-diligence evidence.

- **CIS Benchmarks** — consensus-developed configuration guidance covering OSes, cloud, and network devices. Two levels: **Level 1** (practical controls, minimal performance impact, most environments) and **Level 2** (more aggressive, high-security environments). CIS also publishes Hardened Images for a faster start.
- **NIST guidelines** — SP 800-53 control families and SP 800-series hardening guidance; often required for FedRAMP or US-government work.
- **DISA STIGs** — the DoD's prescriptive, stringent requirements; mandatory for DoD systems and widely used elsewhere for a rigorous, well-documented standard.
- **Compliance regimes (HIPAA, PCI DSS, CMMC)** — rarely mandate specific hardening configs, but expect documented controls and audit evidence; aligning to CIS or NIST is usually accepted as sufficient.

| Standard | Origin | Strictness | Best for |
|---|---|---|---|
| CIS Benchmarks | Center for Internet Security | Moderate–high (2 levels) | General enterprise; customizable; maps to NIST CSF |
| DISA STIG | US DoD | Very high | Federal / DoD; regulated environments |
| NIST (SP 800-series, CSF) | NIST | Foundational | Risk management; zero-trust alignment |

## 8. Building a Repeatable Process

A checklist run once is a project. Hardening only works as a **process** applied to new systems and maintained over time.

1. **Asset inventory.** You can't harden what you don't know about. Document every device, server, and cloud instance before anything else.
2. **Define the baseline.** Pick a framework (CIS is a strong default) and turn it into a documented standard every system is expected to meet.
3. **Harden before deployment.** New systems meet the baseline *before* they go live, baked into provisioning so day-one consistency is the default.
4. **Audit and validate regularly.** Quarterly at a minimum, plus after major changes. Automated assessment tooling makes this practical for lean teams.
5. **Document everything.** Record the baseline, every exception, and the reason for it. Undocumented exceptions become invisible risks — and they're the first thing an auditor asks about.

## 9. Tooling

**Configuration assessment** (scans a host against a standard and reports gaps):

- **CIS-CAT Pro** — scans against CIS Benchmarks; scored reports (CIS-CAT Lite is the free, limited variant).
- **OpenSCAP** — open-source; assesses against SCAP content including DISA STIGs and NIST checklists; common in Linux and government environments.
- **Microsoft Security Compliance Toolkit** — applies and audits Microsoft security baselines on Windows, including GPOs aligned to Microsoft's recommendations.

**Configuration management / automation** (applies and enforces hardening at scale):

- **Ansible** — agentless; applies hardening across Linux and Windows via playbooks; community CIS roles live at dev-sec.io.
- **Puppet / Chef** — solid for teams already standardised on them.
- **Group Policy** — native Windows-domain enforcement with no extra tooling.

**Vulnerability scanners** complement hardening but aren't the same thing — a scanner finds CVEs, it doesn't evaluate configuration. Nessus (Tenable) and Qualys include policy-compliance scanning alongside vulnerability detection and can incorporate CIS checks.

**EDR / managed detection** catches what hardening doesn't stop; the two are complementary, not substitutes.

## 10. Mistakes That Quietly Erode a Program

Most failures here are process failures, not technical ones, and they compound quietly.

- **Hardening once and forgetting.** Hardening is a process, not a project with an end date.
- **Skipping the inventory.** Shadow IT, forgotten test servers, and unmanaged devices are the classic blind spots.
- **Treating all systems the same.** A domain controller and a developer workstation have different risk profiles and need different baselines. One-size-fits-all either over-restricts low-risk hosts or under-protects high-risk ones.
- **Disabling logging for performance.** Audit logging has a cost; disabling it forfeits visibility exactly when you need it. A managed SIEM can keep logging sustainable.
- **Not testing in staging.** Aggressive hardening breaks applications. Always stage first, especially on critical servers.
- **Ignoring third-party software.** OS hardening is well-understood; the apps on top of it (default web-app credentials, stale plugins, unpatched libraries) are the common gap.
- **Leaving exceptions undocumented.** Legitimate deviations exist, but undocumented exceptions become risks no one remembers to revisit.

---

## 11. References

- [CIS Benchmarks — Center for Internet Security](https://www.cisecurity.org/cis-benchmarks)
- [CIS Hardened Images — Center for Internet Security](https://www.cisecurity.org/cis-hardened-images)
- [DISA STIGs — Cyber Exchange](https://public.cyber.mil/stigs/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [NIST SP 800-53 Security and Privacy Controls](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [NIST SP 800-40 Patch Management](https://csrc.nist.gov/publications/detail/sp/800-40/rev-4/final)
- [NIST SP 800-92 Guide to Computer Security Log Management](https://csrc.nist.gov/publications/detail/sp/800-92/final)
- [NIST Zero Trust Architecture (SP 800-207)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf)
- [Microsoft CIS Benchmark compliance](https://learn.microsoft.com/en-us/compliance/regulatory/offering-cis-benchmark)
- [OpenSCAP](https://www.open-scap.org/)
- [dev-sec.io — Ansible hardening roles](https://dev-sec.io/)
