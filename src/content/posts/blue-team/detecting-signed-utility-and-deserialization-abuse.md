---
title: 'Detecting Signed-Utility and Deserialization Abuse (InstallUtil / AddInUtil / runscripthelper)'
author: Anubhav Gain
pubDatetime: 2026-07-13T16:30:00.000Z
slug: detecting-signed-utility-and-deserialization-abuse
draft: false
featured: false
description: 'Part 8 of the WDAC detection-engineering series — detecting signed Microsoft installers, helpers, and deserialising utilities repurposed to execute attacker code, with a Sigma rule and tuning guidance.'
tags:
- detection-engineering
- wdac
- installutil
- deserialization
- lolbins
- sigma
- blue-team
category: Detection Engineering
lang: en
---

# Detecting Signed-Utility and Deserialization Abuse (InstallUtil / AddInUtil / runscripthelper)

A distinct sub-family of the WDAC bypass catalogue is the **signed installer/helper/utility** class: Microsoft binaries whose legitimate job is to install, configure, transform, or verify content, and which can be coerced into running arbitrary code — usually through deserialisation, a built-in "run this" capability, or by invoking attacker-supplied assembly methods. `InstallUtil.exe`, `AddInUtil.exe`/`AddInProcess.exe`, `runscripthelper.exe`, `VisualUiaVerifyNative.exe`, `Microsoft.Workflow.Compiler.exe`, `bginfo.exe`, and `InfDefaultInstall.exe` all live here.

Part 1's baseline rule catches their *presence* in suspicious contexts. This post gives them dedicated coverage because their abuse shape — deserialisation and assembly-method invocation — is different enough from the compiler family (part 3) to deserve its own detections and false-positive plan.

## Table of Contents

1. [What Makes This Family Different](#1-what-makes-this-family-different)
2. [The Abuse Patterns](#2-the-abuse-patterns)
3. [Detection Signal 1 — Invocation Outside Build/Admin Contexts](#3-detection-signal-1--invocation-outside-buildadmin-contexts)
4. [Detection Signal 2 — The Assembly Argument](#4-detection-signal-2--the-assembly-argument)
5. [Detection Signal 3 — Deserialisation Telemetry](#5-detection-signal-3--deserialisation-telemetry)
6. [A Sigma Rule for the Family](#6-a-sigma-rule-for-the-family)
7. [Tuning Notes](#7-tuning-notes)
8. [References](#8-references)

---

## 1. What Makes This Family Different

The compiler family (part 3) consumes source and emits code. The signed-utility family consumes a **binary artefact** — an assembly, a serialised object, an INF, a config — and either invokes methods on it (`InstallUtil`), deserialises it (`AddInUtil`, `Microsoft.Workflow.Compiler`), or runs an embedded script (`bginfo`). The trusted binary does the loading; WDAC sees only the signed host.

The practical difference for detection: the command-line shape is dominated by **a file argument** (the assembly, INF, or config), and the highest-signal relationship is *which process loaded the attacker's assembly* and *whether a shell child followed*.

## 2. The Abuse Patterns

- **`InstallUtil.exe`** — invoked against an attacker assembly; `InstallUtil` reflectively calls the assembly's installer methods, which run in full trust. Classic command shape: `InstallUtil.exe /logfile= /LogToConsole=false /U attacker.dll`.
- **`AddInUtil.exe` / `AddInProcess.exe` / `AddInProcess32.exe`** — insecure deserialisation of add-in configuration, exploited to load attacker content in a trusted host.
- **`runscripthelper.exe`** — executes PowerShell from a constrained, signed path; the bypass is getting attacker content into that path.
- **`VisualUiaVerifyNative.exe`** — UI-automation verifier that loads and runs code.
- **`Microsoft.Workflow.Compiler.exe`** — deserialises a workflow definition into an assembly and executes it; two-argument `INPUT.xml OUT` shape.
- **`bginfo.exe`** — runs embedded VBScript from a `.bgi` config.
- **`InfDefaultInstall.exe`** — runs an INF `DefaultInstall` section's directives.

## 3. Detection Signal 1 — Invocation Outside Build/Admin Contexts

Most of these binaries are rare outside specific workflows. `InstallUtil.exe` is normally invoked by an installer framework or `dotnet`, not interactively from a user-writable directory. `AddInUtil.exe`, `runscripthelper.exe`, and `VisualUiaVerifyNative.exe` are essentially never seen on a typical workstation. Their execution there is the signal, exactly as in [part 1](/posts/detecting-wdac-lolbin-image-loads/).

## 4. Detection Signal 2 — The Assembly Argument

For the assembly-loading members (`InstallUtil`, `Microsoft.Workflow.Compiler`), the command line names the attacker file. High-signal atoms:

- A `.dll`/`.exe` argument located in a user-writable path (`%USERPROFILE%`, `%TEMP%`, `%LOCALAPPDATA%`, `Downloads`).
- A UNC/URL argument.
- The `/U` (uninstall) flag combined with a non-installer assembly — the uninstall code path is a favourite because it still runs the assembly's methods.

## 5. Detection Signal 3 — Deserialisation Telemetry

For the deserialising members (`AddInUtil`, `Microsoft.Workflow.Compiler`), pair process creation with **assembly load telemetry** (Sysmon EID 7 / `AssemblyLoad`) to detect the attacker's payload assembly being loaded by the trusted host. The signature: a signed utility loads an assembly from a user-writable path, immediately followed by network or child-process activity.

And, as across the rest of the series, the **shell-child lineage** is the resilient catch — `InstallUtil.exe` → `cmd.exe`/`powershell.exe` is almost never legitimate.

## 6. A Sigma Rule for the Family

```yaml
title: WDAC Bypass — Signed Utility / Deserialization Abuse
id: 8c2d4e6f-1a3b-4c5d-9e8f-7a6b5c4d3e2f
status: experimental
description: >
  Detects signed Microsoft installers, helpers, and deserialising utilities
  (InstallUtil, AddInUtil, runscripthelper, VisualUiaVerifyNative,
  Microsoft.Workflow.Compiler, bginfo, InfDefaultInstall) used to execute
  attacker code, via suspicious file arguments, user-writable invocation
  paths, or shell-child lineage.
references:
  - https://github.com/bohops/UltimateWDACBypassList
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1218
  - attack.t1127
  - attack.t1574
logsource:
  product: windows
  category: process_creation
detection:
  utility_image:
    Image|endswith:
      - '\InstallUtil.exe'
      - '\AddInUtil.exe'
      - '\AddInProcess.exe'
      - '\AddInProcess32.exe'
      - '\runscripthelper.exe'
      - '\VisualUiaVerifyNative.exe'
      - '\Microsoft.Workflow.Compiler.exe'
      - '\bginfo.exe'
      - '\InfDefaultInstall.exe'
  user_writable_arg:
    CommandLine|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\\\\'
  invoked_from_user_writable:
    Image|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\Windows\Temp\'
  assembly_payload_arg:
    CommandLine|re: '.*\.(dll|exe).*(/U|/logfile|/LogToConsole)'   # InstallUtil-style
  shell_child:
    ParentImage|endswith:
      - '\InstallUtil.exe'
      - '\AddInProcess.exe'
      - '\Microsoft.Workflow.Compiler.exe'
      - '\runscripthelper.exe'
      - '\bginfo.exe'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\wscript.exe'
      - '\cscript.exe'
  condition: utility_image and (user_writable_arg or invoked_from_user_writable or assembly_payload_arg) or shell_child
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Legitimate installer/framework invocations of InstallUtil (constrain to known build/service accounts)
  - Managed bginfo login scripts (constrain by path + service account)
level: high
```

## 7. Tuning Notes

- **`InstallUtil.exe` is the noisiest.** It runs legitimately during software installation; anchor your allow-list to the installer framework's service account and signed installer paths, and let the shell-child branch carry the high-confidence alert.
- **`bginfo.exe` is a common false positive** in managed fleets with login scripts. Constrain that case to a specific path and a specific service account.
- **Promote `shell_child`.** Across this family, a signed installer/utility spawning a shell is the real deal regardless of command-line obfuscation.
- **Pair with assembly-load telemetry.** For the deserialising members, an assembly loaded from a user-writable path by these hosts is the smoking gun.

## 8. References

- [DG on Windows 10 S: Abusing InstallUtil — James Forshaw](https://www.tiraniddo.dev/2017/08/dg-on-windows-10-s-abusing-installutil.html)
- [Insecure Deserialization in AddInUtil.exe — @McKinleyMike / @TheLatteri](https://www.blue-prints.blog/content/blog/posts/lolbin/addinutil-lolbas.html)
- [Bypassing AWL with runscripthelper.exe — Matt Graeber](https://posts.specterops.io/bypassing-application-whitelisting-with-runscripthelper-exe-1906923658fc)
- [Arbitrary Unsigned Code Execution in Microsoft.Workflow.Compiler.exe — Matt Graeber](https://posts.specterops.io/arbitrary-unsigned-code-execution-vector-in-microsoft-workflow-compiler-exe-3d9294bc5efb)
- [Bypassing AWL with BGInfo — Oddvar Moe](https://msitpros.com/?p=3831)
- [Evading Autoruns — Kyle Hanslovan / Chris Bisnett](https://github.com/huntresslabs/evading-autoruns)
- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [MITRE ATT&CK T1218 — System Binary Proxy Execution](https://attack.mitre.org/techniques/T1218/)
