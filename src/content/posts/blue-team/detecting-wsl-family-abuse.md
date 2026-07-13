---
title: 'Detecting WSL-Family Abuse (bash / lxrun / wsl / wslconfig / wslhost)'
author: Anubhav Gain
pubDatetime: 2026-07-13T16:00:00.000Z
slug: detecting-wsl-family-abuse
draft: false
featured: false
description: 'Part 7 of the WDAC detection-engineering series — detecting Windows Subsystem for Linux binaries used to cross an application-control boundary, with a Sigma rule and WSL telemetry guidance.'
tags:
- detection-engineering
- wdac
- wsl
- lxss
- sigma
- blue-team
category: Detection Engineering
lang: en
---

# Detecting WSL-Family Abuse (bash / lxrun / wsl / wslconfig / wslhost)

A Windows-only WDAC policy scopes what runs on Windows. It does not, by default, scope what runs in the **Windows Subsystem for Linux**. The WSL family — `bash.exe`, `lxrun.exe`, `wsl.exe`, `wslconfig.exe`, `wslhost.exe`, and the `lxssmanager.dll` service — exposes a Linux world that can be used to run code outside the constraints a Windows-only policy assumed. The foundational research is Alex Ionescu's `lxss` work, and the binaries appear on the WDAC block list for exactly this reason.

This post covers detection of WSL being used to bypass or sidestep application control. The telemetry is good and the legitimate-use surface is narrow on most enterprise hosts, which makes this one of the cleaner families to cover.

## Table of Contents

1. [Why WSL Crosses the Boundary](#1-why-wsl-crosses-the-boundary)
2. [The Abuse Shapes](#2-the-abuse-shapes)
3. [Detection Signal 1 — WSL on a Non-WSL Fleet](#3-detection-signal-1--wsl-on-a-non-wsl-fleet)
4. [Detection Signal 2 — Invocations from Suspicious Parents](#4-detection-signal-2--invocations-from-suspicious-parents)
5. [Detection Signal 3 — Distribution Installation and Mounting](#5-detection-signal-3--distribution-installation-and-mounting)
6. [A Sigma Rule for the Family](#6-a-sigma-rule-for-the-family)
7. [Tuning Notes](#7-tuning-notes)
8. [References](#8-references)

---

## 1. Why WSL Crosses the Boundary

A WDAC policy compiled against Windows code-integrity trust does not generally evaluate the Linux ELF binaries a user runs inside WSL. The Linux subsystem is itself a trusted Microsoft component (`lxssmanager.dll`, the pico processes); the payloads an attacker executes inside it are data from the Windows policy's point of view. So an attacker with the ability to invoke `wsl.exe` can run arbitrary Linux tooling — downloaders, reverse shells, crypto miners — even on a host where Windows-side unsigned executables are blocked.

The defensive lesson from part 1's premise holds: if a trusted component's job is to run code, an attacker will use it to run code.

## 2. The Abuse Shapes

- **Direct execution** — `wsl.exe <command>` or `bash.exe -c <command>` to run Linux tooling that fetches a payload or establishes a channel.
- **Distribution bring-up** — `wsl.exe --install` / `lxrun.exe /install` to stand up a fresh Linux environment on a host where it was not present, then operate from inside it.
- **Filesystem crossing** — WSL's automatic mount of the Windows filesystem (`/mnt/c/...`) lets Linux tooling read, modify, and stage Windows-side files, including the code-integrity policy paths covered in [part 4](/posts/detecting-wdac-edr-blinding/).
- **Persistence** — a Linux-side cron/systemd unit inside WSL can re-establish a channel after a Windows-side cleanup, surviving a Windows-only investigation.

## 3. Detection Signal 1 — WSL on a Non-WSL Fleet

On most locked-down workstations and servers, WSL is either disabled or never used. The cleanest single detection: **any WSL-family binary executing on a host that is not in the WSL-enabled fleet tier**. This is a fleet-baselining rule — tag WSL-authorized hosts (developer machines, specific build servers) and alert on WSL execution everywhere else.

## 4. Detection Signal 2 — Invocations from Suspicious Parents

Where WSL *is* legitimately installed, the lineage gives the signal. `wsl.exe`/`bash.exe` as a child of an office app, a browser, or a script engine is abnormal; the same binaries as a child of a CI agent or an interactive developer session are normal. This reuses the parentage pattern from [part 1](/posts/detecting-wdac-lolbin-image-loads/) and [part 3](/posts/detecting-compiler-and-repl-host-abuse/).

Command-line content also helps: `wsl.exe` invoked with a long base64-looking argument, a `curl`/`wget`/`python`/`nc` payload, or piping to `bash -c` is the shape of a one-liner tradecraft.

## 5. Detection Signal 3 — Distribution Installation and Mounting

Two high-signal administrative actions:

- **`wsl --install` / `lxrun /install`** — standing up a new distribution. On a stable fleet this is rare and worth a high-severity alert, especially outside a change window.
- **Mount manipulation** — `wsl --mount` of a disk, or operations against `/mnt/c/Windows/System32/CodeIntegrity/`. The latter directly threatens the WDAC policy surface from part 4.

## 6. A Sigma Rule for the Family

```yaml
title: WDAC Bypass — WSL Family Abuse
id: 6b3c1d8e-4f2a-4c7e-9b1a-5d6e7f8a9b0c
status: experimental
description: >
  Detects Windows Subsystem for Linux binaries (bash/lxrun/wsl/wslconfig/
  wslhost) used to cross a Windows application-control boundary — invoked
  from suspicious parents, carrying execution payloads, or installing /
  mounting distributions outside change management.
references:
  - https://github.com/ionescu007/lxss
  - https://github.com/bohops/UltimateWDACBypassList
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1218
  - attack.t1027
logsource:
  product: windows
  category: process_creation
detection:
  wsl_image:
    Image|endswith:
      - '\bash.exe'
      - '\lxrun.exe'
      - '\wsl.exe'
      - '\wslconfig.exe'
      - '\wslhost.exe'
  suspicious_parent:
    ParentImage|endswith:
      - '\winword.exe'
      - '\excel.exe'
      - '\powerpnt.exe'
      - '\outlook.exe'
      - '\chrome.exe'
      - '\msedge.exe'
      - '\firefox.exe'
      - '\mshta.exe'
  payload_arg:
    Image|endswith:
      - '\wsl.exe'
      - '\bash.exe'
    CommandLine|contains:
      - 'curl'
      - 'wget'
      - 'python'
      - 'nc '
      - 'bash -c'
      - '/dev/tcp/'
      - 'base64'
  distro_ops:
    Image|endswith:
      - '\wsl.exe'
      - '\lxrun.exe'
    CommandLine|contains:
      - '--install'
      - '/install'
      - '--mount'
      - '--import'
      - '/mnt/c/Windows/System32/CodeIntegrity'
  condition: wsl_image and (suspicious_parent or payload_arg or distro_ops)
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Developer / build hosts that legitimately use WSL (tier separately)
  - Approved WSL distribution installation during onboarding
level: high
```

## 7. Tuning Notes

- **Tier the fleet.** WSL-authorized hosts (developer machines, specific build servers) go in their own tier; the rule runs at full severity everywhere else.
- **Baseline the distribution list.** Alert on a new distribution appearing (`wsl --list`) outside the approved set.
- **Watch the `/mnt/c` crossing.** Linux-side access to `System32\CodeIntegrity` from within WSL is the WDAC-policy attack path; correlate WSL launches with file-access telemetry on the policy paths.
- **Pair with Sysmon EID 7.** Loading of `lxssmanager.dll` by a process that is not the legitimate WSM service is anomalous.

## 8. References

- [Fun with the Windows Subsystem for Linux (lxss) — Alex Ionescu](https://github.com/ionescu007/lxss)
- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [Windows Subsystem for Linux Documentation — Microsoft Learn](https://learn.microsoft.com/en-us/windows/wsl/)
- [MITRE ATT&CK T1218 — System Binary Proxy Execution](https://attack.mitre.org/techniques/T1218/)
- [MITRE ATT&CK T1027 — Obfuscated Files or Information](https://attack.mitre.org/techniques/T1027/)
