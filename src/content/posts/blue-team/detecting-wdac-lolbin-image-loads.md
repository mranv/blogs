---
title: 'Detecting WDAC Bypass LOLBINs — A Baseline Image-Load Strategy'
author: Anubhav Gain
pubDatetime: 2026-07-13T13:00:00.000Z
slug: detecting-wdac-lolbin-image-loads
draft: false
featured: false
description: 'Part 1 of the WDAC detection-engineering series — a baseline strategy for catching application-control bypass LOLBINs with Sysmon image-load and process-create telemetry, with a ready-to-use Sigma rule.'
tags:
- detection-engineering
- wdac
- sigma
- sysmon
- lolbins
- blue-team
- threat-hunting
category: Detection Engineering
lang: en
---

# Detecting WDAC Bypass LOLBINs — A Baseline Image-Load Strategy

This is the first in a series on **detecting** the WDAC / Application Control bypass techniques catalogued in [the WDAC bypass reference](/posts/wdac-bypass-techniques-reference-catalog/). The offensive side is well-documented; the defensive side is usually underwritten. The goal of this series is to turn each family of bypasses into concrete telemetry, a Sigma rule, and a false-positive plan.

We start with the most general and most valuable control: a **baseline image-load and process-creation strategy** for the binaries that show up again and again across application-control bypass research. Get this right and you catch a large fraction of the catalogue with one rule shape, before you ever specialise.

## Table of Contents

1. [The Detection Premise](#1-the-detection-premise)
2. [Telemetry You Need](#2-telemetry-you-need)
3. [The Baseline Strategy](#3-the-baseline-strategy)
4. [A Sigma Rule for the Baseline](#4-a-sigma-rule-for-the-baseline)
5. [Tuning and False Positives](#5-tuning-and-false-positives)
6. [Where This Catches, and Where It Doesn't](#6-where-this-catches-and-where-it-doesnt)
7. [What's Next in the Series](#7-whats-next-in-the-series)
8. [References](#8-references)

---

## 1. The Detection Premise

Almost every WDAC bypass in the catalogue works the same way at the process level: a Microsoft-signed binary whose legitimate job is to compile, debug, interpret, install, or transform content is invoked in a context it would not normally appear in, usually with an argument pointing at attacker-controlled content (a script, a project file, a stylesheet, a `.wds` file). The binary itself is trusted, so the policy allows it. The telemetry, however, is rich.

The detection premise is therefore not "did something bypass WDAC" (the kernel will not tell you that, because from its point of view nothing did). It is:

> **Did a known application-control-abuse primitive execute in a context that is abnormal for my environment?**

That is a baseline-and-deviation problem, and it is solvable with standard EDR/Sysmon telemetry plus a small, well-tuned allow-list.

## 2. Telemetry You Need

You need three event streams, all of them standard:

- **Process creation** — Windows Security Event ID 4688 (with command-line auditing enabled) or Sysmon Event ID 1. This is where the binary, its path, its parent process, and its command line live.
- **Image load** — Sysmon Event ID 7. Loading of DLLs by a process. Essential for the libraries side of the catalogue (`Microsoft.Build.dll`, `system.management.automation.dll`, `webclnt.dll`, and friends).
- **File creation** — Sysmon Event ID 11, for the moment a script/policy/payload lands on disk before being fed to the trusted binary.

If you run a modern EDR, the equivalent of all three is almost always available through its own event schema; Sigma lets you target whichever abstraction layer you operate on.

## 3. The Baseline Strategy

Three layers, in increasing specificity.

**Layer 1 — Presence.** Maintain a list of the binaries from the catalogue that have *no legitimate reason* to run on the host in question. On a typical workstation, `cdb.exe`, `windbg.exe`, `WinDbgX.exe`, `dbgsrv.exe`, `msbuild.exe` (outside of a developer's machine), `csi.exe`, `rcsi.exe`, `fsi.exe`, `runscripthelper.exe`, `visualuiaverifynative.exe`, `Microsoft.Workflow.Compiler.exe`, and the WSL family are strong candidates. Their mere execution on a non-developer host is worth an alert.

**Layer 2 — Lineage.** The same binaries have a small set of legitimate parents. `msbuild.exe` is spawned by Visual Studio, `dotnet`, or CI agents — not by `winword.exe`, `outlook.exe`, a browser, or `cmd.exe` invoked from a temp directory. Debugger binaries are spawned by developers or build tooling — not by Office documents. A trusted binary whose parent is an office productivity app, a browser, a scripting engine, or a process running from a user-writable path is the single highest-signal relationship in this entire catalogue.

**Layer 3 — Content.** The command-line shape is distinctive. `wmic.exe ... /format:<xsl>`, `mshta.exe <url-or-path>`, `msbuild.exe <project-from-downloads>`, `cdb.exe -cf <script>`, `WinDbgX.exe /c "$$>a<...wds"`, and `InstallUtil.exe /logfile= /LogToConsole=false /U <assembly>` all have fingerprints. Layer 3 catches the specific invocation; Layers 1 and 2 catch the general abnormality.

## 4. A Sigma Rule for the Baseline

A baseline rule that fires on Layer 1 (presence on a non-developer host) combined with Layer 2 (suspicious parentage). Tune the image and parent lists to your estate.

```yaml
title: WDAC Bypass LOLBIN Executed from Suspicious Parent
id: 8c4f1a2e-9b3d-4e7a-8f6c-1a2b3c4d5e6f
status: experimental
description: >
  Detects execution of binaries commonly abused to bypass Windows Defender
  Application Control (WDAC) / Application Control for Business, when spawned
  by a parent process that is abnormal for the host (office apps, browsers,
  script engines, or processes running from user-writable paths).
references:
  - https://github.com/bohops/UltimateWDACBypassList
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1218
  - attack.t1127
  - attack.t1059
logsource:
  product: windows
  category: process_creation
detection:
  selection_image:
    Image|endswith:
      - '\cdb.exe'
      - '\windbg.exe'
      - '\WinDbgX.exe'
      - '\dbgsrv.exe'
      - '\kd.exe'
      - '\ntsd.exe'
      - '\msbuild.exe'
      - '\dotnet.exe'
      - '\csi.exe'
      - '\rcsi.exe'
      - '\fsi.exe'
      - '\fsiAnyCpu.exe'
      - '\wfc.exe'
      - '\dnx.exe'
      - '\mshta.exe'
      - '\Microsoft.Workflow.Compiler.exe'
      - '\runscripthelper.exe'
      - '\VisualUiaVerifyNative.exe'
      - '\InstallUtil.exe'
      - '\AddInUtil.exe'
      - '\AddInProcess.exe'
      - '\AddInProcess32.exe'
      - '\aspnet_compiler.exe'
      - '\bginfo.exe'
      - '\InfDefaultInstall.exe'
      - '\powershellcustomhost.exe'
  suspicious_parent:
    ParentImage|endswith:
      - '\winword.exe'
      - '\excel.exe'
      - '\powerpnt.exe'
      - '\outlook.exe'
      - '\msaccess.exe'
      - '\excel.exe'
      - '\chrome.exe'
      - '\msedge.exe'
      - '\firefox.exe'
      - '\iexplore.exe'
      - '\wscript.exe'
      - '\cscript.exe'
      - '\pwsh.exe'
      - '\powershell.exe'
      - '\cmd.exe'
      - '\bash.exe'
      - '\wsl.exe'
  suspicious_path:
    Image|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\Windows\Temp\'
  condition: selection_image and (suspicious_parent or suspicious_path)
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Developer workstations running legitimate build/debug tooling
  - CI/build agents invoking msbuild or dotnet
  - Sysinternals bginfo in a managed login script (constrain by path/user)
level: high
```

This is intentionally a starting point. On a developer fleet it will need a parent/path allow-list; on a locked-down workstation fleet it will be quiet and high-signal.

## 5. Tuning and False Positives

- **Tier the fleet.** Tag developer machines and CI agents separately. The rule's `condition` can exclude them, or they route to a lower-severity queue. Do not run the un-tuned rule globally and drown the SOC.
- **Allow-list legitimate parents by path.** `msbuild.exe` from `C:\Program Files\Microsoft Visual Studio\...` or `C:\Program Files\dotnet\...` is normal; the same binary from a user profile is not.
- **Expected invocations.** `bginfo.exe` in a corporate login script is legitimate — constrain that case to a specific path and a specific service account.
- **Command-line enrichment.** For the highest fidelity, add a Layer 3 condition on the command line (e.g. `/format:` for `wmic.exe`, `/c "$$>a<"` for `WinDbgX.exe`). Layer 3 rules are covered in the technique-specific posts that follow.

## 6. Where This Catches, and Where It Doesn't

The baseline catches the *invocation* of the bypass primitive. It does **not** catch:

- **In-memory execution within an already-running trusted process** — e.g. shellcode staged via `.dvalloc`/`eb` inside an already-launched debugger. That requires the behavioural detection in [part 2](/posts/detecting-debugger-as-injector-wdac/) (thread-context manipulation density).
- **A genuinely novel signed primitive** not on your image list. The catalogue is reactive; keep the list current against the [UltimateWDACBypassList](https://github.com/bohops/UltimateWDACBypassList).
- **Fileless COM/XSL transforms** that never spawn a new process image. Covered in [part 5](/posts/detecting-com-xsl-and-script-host-abuse/).

The baseline is the floor, not the ceiling. The rest of the series layers the behavioural and content-specific detections on top.

## 7. What's Next in the Series

- [Part 2 — Detecting the debugger-as-injector](/posts/detecting-debugger-as-injector-wdac/) (`cdb`/`windbg`/`dbgsrv`/`WinDbgX`): thread-context manipulation density, script-file arguments.
- Part 3 — Detecting compiler/REPL-host abuse (`msbuild`/`dotnet`/`csi`/`rcsi`/`fsi`).
- [Part 4 — Detecting WDAC-as-weapon (EDR blinding)](/posts/detecting-wdac-edr-blinding/): malicious `.cip` writes and the "dark endpoint."
- Part 5 — Detecting COM/XSL/script-host abuse.

## 8. References

- [UltimateWDACBypassList — bohops](https://github.com/bohops/UltimateWDACBypassList)
- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [A Field Guide to WDAC Bypass Techniques](/posts/wdac-bypass-landscape-field-guide/)
- [Sigma — detection rules specification](https://sigmahq.io/)
- [Sysmon — Sysinternals](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon)
- [MITRE ATT&CK T1218 — System Binary Proxy Execution](https://attack.mitre.org/techniques/T1218/)
- [MITRE ATT&CK T1127 — Trusted Developer Utilities Proxy Execution](https://attack.mitre.org/techniques/T1127/)
