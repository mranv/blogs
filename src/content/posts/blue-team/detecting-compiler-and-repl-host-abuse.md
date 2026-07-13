---
title: 'Detecting Compiler and REPL Host Abuse (msbuild / dotnet / csi / rcsi / fsi)'
author: Anubhav Gain
pubDatetime: 2026-07-13T14:00:00.000Z
slug: detecting-compiler-and-repl-host-abuse
draft: false
featured: false
description: 'Part 3 of the WDAC detection-engineering series — detecting trusted developer compilers and REPL hosts repurposed to execute attacker code, with a Sigma rule and parentage tuning guidance.'
tags:
- detection-engineering
- wdac
- msbuild
- dotnet
- sigma
- blue-team
- threat-hunting
category: Detection Engineering
lang: en
---

# Detecting Compiler and REPL Host Abuse (msbuild / dotnet / csi / rcsi / fsi)

Compilers and interactive REPL hosts are, by design, programs that consume source and emit or execute code. Under WDAC that is a problem: if the signed host is allowed to run and the source lives in a data file the policy does not evaluate, the host becomes a general-purpose execution engine. The catalogue is full of these — `msbuild.exe`, `dotnet.exe`, `csi.exe`, `rcsi.exe`, `fsi.exe`/`fsiAnyCpu.exe`, `wfc.exe`, `dnx.exe`, `dbghost.exe`, `aspnet_compiler.exe`, and `Microsoft.Workflow.Compiler.exe`.

This post covers how to detect that family being abused. The good news is that, unlike the debugger-as-injector from [part 2](/posts/detecting-debugger-as-injector-wdac/), the compiler family leaves a loud process-creation and child-process signature. The challenge is the false-positive surface — these tools also run legitimately on every developer and CI host you own.

## Table of Contents

1. [The Mechanism, Briefly](#1-the-mechanism-briefly)
2. [Why This Family Is Loud](#2-why-this-family-is-loud)
3. [Detection Signal 1 — Abnormal Parentage and Invocation Path](#3-detection-signal-1--abnormal-parentage-and-invocation-path)
4. [Detection Signal 2 — Suspicious Content Argument](#4-detection-signal-2--suspicious-content-argument)
5. [Detection Signal 3 — Child-Process Lineage](#5-detection-signal-3--child-process-lineage)
6. [A Sigma Rule for the Family](#6-a-sigma-rule-for-the-family)
7. [Tuning for a Mixed Fleet](#7-tuning-for-a-mixed-fleet)
8. [References](#8-references)

---

## 1. The Mechanism, Briefly

Each of these binaries accepts attacker-supplied content — a project file, an inline task, a C#/F# script, a workflow XOML — and executes the logic inside it. Classic examples:

- `msbuild.exe project.xml` with an inline C# `<Task>` that runs on build.
- `dotnet.exe` / `dotnet.exe run` against a project, or `dotnet.exe <assembly.dll>` to load and execute.
- `csi.exe script.csx` / `rcsi.exe script.csx` running a C# script.
- `fsi.exe script.fsx` running F#.
- `Microsoft.Workflow.Compiler.exe INPUT.xml OUT.dll` deserialising and executing.

In every case the trusted host does the executing; WDAC sees only the signed image. See the [reference catalog](/posts/wdac-bypass-techniques-reference-catalog/) for the per-binary citations.

## 2. Why This Family Is Loud

Unlike a debugger quietly rewriting a thread's context, a compiler host that executes attacker logic almost always produces **observable side effects**: it reads a file from a user-writable path, it often spawns a child process, and its command line names the content file. The detection problem is not "is there a signal" — it is "which of these thousands of legitimate msbuild invocations is the malicious one?" That is a filtering and baseline problem, and it is very tractable.

## 3. Detection Signal 1 — Abnormal Parentage and Invocation Path

Legitimate compiler hosts have a small set of parents and a small set of installation paths. Any deviation is the signal:

- **Parentage.** `msbuild.exe` is normally a child of Visual Studio (`devenv.exe`), `dotnet.exe`, MSBuild node hosts (`MSBuild.exe` itself, for the worker nodes), or a CI agent (`msbuild.exe` under `pwsh.exe`/`cmd.exe` inside a pipeline workspace). It is **not** a child of `winword.exe`, a browser, or `cmd.exe` spawned from `%TEMP%`.
- **Path.** The genuine binaries live under `C:\Program Files\Microsoft Visual Studio\...`, `C:\Program Files\dotnet\...`, or the .NET Framework reference path. A `msbuild.exe` invoked from `%USERPROFILE%\Downloads\` or `%LOCALAPPDATA%` is suspicious even if it is the real binary.
- **Content path.** The argument naming the project/script file is the strongest single atom. A project file loaded from a user-writable directory, a UNC path, or an internet-sourced URL is the canonical shape.

## 4. Detection Signal 2 — Suspicious Content Argument

Per-host fingerprints on the command line:

- `msbuild.exe`: the project argument; inline-task smell is harder to see from the command line alone, so pair with a file-read of the project (Sysmon EID 11 or your EDR's file events) looking for `<Task` + `using:` or `Code Language="cs"`.
- `dotnet.exe`: `dotnet <path>.dll` where the DLL is in a user-writable location, or `dotnet script` / `dotnet-script` (the scripting tooling).
- `csi.exe` / `rcsi.exe`: any invocation with a `.csx` argument is suspect on a non-dev host.
- `fsi.exe` / `fsiAnyCpu.exe`: any invocation with a `.fsx` argument, same caveat.
- `Microsoft.Workflow.Compiler.exe`: the two-argument `INPUT.xml OUT` shape, rarely seen outside its original purpose.
- `aspnet_compiler.exe`: invocation outside a build farm.

The presence of these hosts on a **non-developer** endpoint is itself the cleanest signal. On a dev endpoint, fall back to path and content provenance.

## 5. Detection Signal 3 — Child-Process Lineage

When an attacker-controlled inline task or script runs, the host frequently spawns a child — `cmd.exe`, `powershell.exe`/`pwsh.exe`, or an attacker payload — to extend the attack. The lineage to alert on is therefore:

> `msbuild.exe` (or `dotnet.exe` / `csi.exe` / `fsi.exe`) → `cmd.exe` | `powershell.exe` | `pwsh.exe` | an unsigned executable

A trusted compiler host spawning a shell is almost never legitimate. This is the highest-confidence detection in the family and the most resistant to command-line obfuscation, because the child image is what it is regardless of how the parent was invoked.

## 6. A Sigma Rule for the Family

A rule combining the abnormal path/parent (Signal 1), the suspicious content extension (Signal 2), and the shell-child lineage (Signal 3).

```yaml
title: WDAC Bypass — Compiler/REPL Host Abuse
id: 5b2d7f0a-1c4e-4b9a-8f3d-6e0c1a2b3c4d
status: experimental
description: >
  Detects trusted developer compilers and REPL hosts (msbuild, dotnet, csi,
  rcsi, fsi, Microsoft.Workflow.Compiler) invoked from suspicious paths or
  parents, with script/project arguments from user-writable locations, or
  spawning shell children — patterns consistent with WDAC/Application Control
  bypass.
references:
  - https://github.com/bohops/UltimateWDACBypassList
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1127
  - attack.t1218
  - attack.t1027
logsource:
  product: windows
  category: process_creation
detection:
  host_image:
    Image|endswith:
      - '\MSBuild.exe'
      - '\dotnet.exe'
      - '\csi.exe'
      - '\rcsi.exe'
      - '\fsi.exe'
      - '\fsiAnyCpu.exe'
      - '\wfc.exe'
      - '\dnx.exe'
      - '\Microsoft.Workflow.Compiler.exe'
      - '\TextTransform.exe'
  user_writable_arg:
    CommandLine|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\\\\'      # UNC paths
  script_extension:
    CommandLine|endswith:
      - '.csx'
      - '.fsx'
      - '.csproj'
      - '.vbproj'
      - '.dll'
  abnormal_parent:
    ParentImage|endswith:
      - '\winword.exe'
      - '\excel.exe'
      - '\powerpnt.exe'
      - '\outlook.exe'
      - '\chrome.exe'
      - '\msedge.exe'
      - '\firefox.exe'
      - '\wscript.exe'
      - '\cscript.exe'
  invoked_from_user_writable:
    Image|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\Windows\Temp\'
  shell_child:
    ParentImage|endswith:
      - '\MSBuild.exe'
      - '\dotnet.exe'
      - '\csi.exe'
      - '\rcsi.exe'
      - '\fsi.exe'
      - '\Microsoft.Workflow.Compiler.exe'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\wscript.exe'
      - '\cscript.exe'
  condition: >-
    (host_image and (user_writable_arg or script_extension or abnormal_parent or invoked_from_user_writable))
    or shell_child
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Developer workstations and CI agents running legitimate builds (tier separately)
  - dotnet loading framework DLLs (constrain the .dll extension to user-writable paths)
level: medium
```

Note the level is `medium` rather than `high`: this family runs legitimately at scale on dev/CI hosts, so without tiering it will produce volume. The `shell_child` branch is the sub-condition you can promote to `high` confidence — a compiler host spawning `cmd.exe`/`powershell.exe` is the real deal.

## 7. Tuning for a Mixed Fleet

- **Tier the hosts.** Developer and CI hosts route to a lower-severity queue; locked-down workstations and servers use the full-severity rule.
- **Anchor legitimate paths.** Allow-list `MSBuild.exe` and `dotnet.exe` from their `Program Files` install roots invoked by the CI service account or `devenv.exe`. Everything else stays in scope.
- **Watch the project files, not just the process.** A companion Sysmon rule (FileCreate for `*.csproj`/`*.vbproj`/`*.csx`/`*.fsx` under user-writable paths) gives you lead time before the host executes them.
- **Promote `shell_child`.** On any fleet, a compiler host spawning a shell is worth paging on regardless of tier.

## 8. References

- [Bypassing Application Whitelisting using MSBuild.exe — Casey Smith](https://web.archive.org/web/20160920161634/http://subt0x10.blogspot.com/2016/09/bypassing-application-whitelisting.html)
- [DotNet Core: A Vector for AWL Bypass — bohops](https://bohops.com/2019/08/19/dotnet-core-a-vector-for-awl-bypass-defense-evasion/)
- [Arbitrary Unsigned Code Execution in Microsoft.Workflow.Compiler.exe — Matt Graeber](https://posts.specterops.io/arbitrary-unsigned-code-execution-vector-in-microsoft-workflow-compiler-exe-3d9294bc5efb)
- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [MITRE ATT&CK T1127 — Trusted Developer Utilities Proxy Execution](https://attack.mitre.org/techniques/T1127/)
- [MITRE ATT&CK T1127.001 — MSBuild](https://attack.mitre.org/techniques/T1127/001/)
