---
title: 'Detecting the Debugger-as-Injector (cdb / windbg / dbgsrv / WinDbgX)'
author: Anubhav Gain
pubDatetime: 2026-07-13T13:30:00.000Z
slug: detecting-debugger-as-injector-wdac
draft: false
featured: false
description: 'Part 2 of the WDAC detection-engineering series — how to detect a Microsoft-signed debugger used to inject shellcode into a remote process, including a Sigma rule for script-driven injection and behavioural detection of thread-context manipulation.'
tags:
- detection-engineering
- wdac
- windbg
- shellcode-injection
- sigma
- sysmon
- blue-team
category: Detection Engineering
lang: en
---

# Detecting the Debugger-as-Injector (cdb / windbg / dbgsrv / WinDbgX)

A debugger controls register state and execution flow, which means a debugger controls what code runs. Under WDAC, that makes the Microsoft-signed debugging tools — `cdb.exe`, `windbg.exe`, `dbgsrv.exe`, and the Store-distributed `WinDbgX.exe` — some of the most capable application-control bypass primitives in the catalogue. WDAC evaluates at image load, not at "is a signed process rewriting another process's registers," so a signed debugger that drives an already-trusted process executes underneath the policy.

Part 1 covered the baseline image-load detection. This post covers what the baseline cannot: the **behavioural** signature of a debugger being used as an injector, plus the **content** fingerprint of its script-driven form. If you only had to detect one family in this catalogue well, it would be this one — it is where the most capable modern bypasses live.

## Table of Contents

1. [What the Attack Looks Like](#1-what-the-attack-looks-like)
2. [Why Image-Load Telemetry Is Not Enough](#2-why-image-load-telemetry-is-not-enough)
3. [Detection Signal 1 — Script-Driven Invocation](#3-detection-signal-1--script-driven-invocation)
4. [Detection Signal 2 — Thread-Context Manipulation Density](#4-detection-signal-2--thread-context-manipulation-density)
5. [Detection Signal 3 — Abnormal Attach Targets](#5-detection-signal-3--abnormal-attach-targets)
6. [A Sigma Rule Combining the Signals](#6-a-sigma-rule-combining-the-signals)
7. [False Positives and Tuning](#7-false-positives-and-tuning)
8. [References](#8-references)

---

## 1. What the Attack Looks Like

The technique, in its script-driven form, has a consistent shape (see the [WinDbg Preview deep-dive](/posts/bypassing-wdac-with-windbg-preview/) for the full mechanics):

1. Launch the signed debugger against a target process, passing a script file: `cdb.exe -cf script.txt -p <PID>`, `windbg.exe -c "$$>a<inject.wds ..."`, `dbgsrv.exe` remotely attached, or `WinDbgX.exe /p <PID> /c "$$>a<...wds"`.
2. The script allocates memory in the debuggee (`.dvalloc`), writes shellcode byte-by-byte (`eb`), and drives the Win32 injection sequence by manipulating registers (`r`) and the instruction pointer (`rip`), executing each API with `g`.
3. The result is a thread running attacker shellcode inside an already-trusted process, loaded entirely by a signed Microsoft binary.

No unsigned image is ever loaded. From the kernel's perspective, nothing bypassed anything.

## 2. Why Image-Load Telemetry Is Not Enough

The baseline rule from [part 1](/posts/detecting-wdac-lolbin-image-loads/) catches the debugger *launching*. It will not catch:

- The **in-process** memory writes and register manipulation that follow.
- A debugger that was already running (e.g. an attacker's persistent `dbgsrv.exe` listener) being directed at a new target.
- The actual injection — `OpenProcess` → `VirtualAllocEx` → `WriteProcessMemory` → `CreateRemoteThread` — which is driven through the debugger's thread-context APIs rather than through direct syscalls from an unsigned payload.

The behavioural and content signals below close those gaps.

## 3. Detection Signal 1 — Script-Driven Invocation

Every script-driven variant passes the debugger a script argument. Those arguments are distinctive on the command line:

- `cdb.exe` / `windbg.exe`: `-cf <file>` or `-c "<commands>"`, often containing `.dvalloc`, ` eb `, ` @$t0`, or `$$>a<`.
- `WinDbgX.exe`: `/c "$$>a<...wds ...>"`, `.wds` argument, `/p <PID>` to attach headlessly.
- `dbgsrv.exe`: `-t tcp:port=...,server=...` (a remote debug server listening is itself anomalous outside a dev box).

The substring `.wds`, the pseudo-register token `@$t0`, the `eb` enter-byte command, and the script-runner token `$$>a<` are the highest-signal command-line atoms. Their presence in the command line of a debugger process is, in any environment that is not actively debugging, a detection.

## 4. Detection Signal 2 — Thread-Context Manipulation Density

Driving an injection one Win32 call at a time by rewriting `rip`, `rsp`, and the argument registers translates under the hood into a **burst of `SetThreadContext` / `GetThreadContext` calls** from the debugger process. There is no legitimate workflow in which `WinDbgX.exe` issues hundreds of context mutations against a process it attached to seconds ago.

This is visible two ways:

- **ETW** — the DbgEng/Thread provider emits context-manipulation events. Aggregating `SetThreadContext` call counts per (debugger PID → target PID) pair over a short window produces a clean outlier signal.
- **EDR behavioural analytics** — most EDRs expose "thread context modified by external process" as an event. A high rate of these events from a debugger image against a non-debuggee-of-record process is the detection.

The exact threshold is environment-dependent; a good starting heuristic is "more than N `SetThreadContext` calls from a debugger image to a single target PID within 60 seconds," where N is well below what a human-driven interactive debug session produces in normal stepping.

## 5. Detection Signal 3 — Abnormal Attach Targets

Debuggers are normally attached to processes a developer chose to debug. In the bypass scenario the target is whatever the attacker wants to inject into — often a long-running system service or a browser process. Two corollaries:

- A debugger image opening a handle to (or attaching to) a process outside its expected target set (e.g. `lsass.exe`, browser content processes, AV/EDR components) is high-signal.
- A debugger image as a **child of an office app, browser, or script engine** is the same lineage signal from part 1, and it remains the single best relationship-based detection.

## 6. A Sigma Rule Combining the Signals

A Sigma rule that fires on the script-driven invocation (Signal 1) and the abnormal-parent case from Signal 3. The thread-context density signal (Signal 2) is best implemented in your EDR's analytics or a custom ETW pipeline rather than in pure process-creation Sigma, but the rule below carries you most of the way.

```yaml
title: WDAC Bypass — Debugger Used as Script-Driven Injector
id: 3a7c9e1b-4d2f-4a8e-9c6b-2f1e0d9a8b7c
status: experimental
description: >
  Detects a Microsoft-signed debugger (cdb/windbg/dbgsrv/WinDbgX) invoked
  with script-driven or remote-server arguments consistent with shellcode
  injection to bypass Windows Defender Application Control, or spawned by
  an abnormal parent process.
references:
  - https://mrd0x.com/the-power-of-cdb-debugging-tool/
  - https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html
  - https://fortynorthsecurity.com/blog/how-to-bypass-wdac-with-dbgsrv-exe/
  - /posts/bypassing-wdac-with-windbg-preview/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1055
  - attack.t1218
logsource:
  product: windows
  category: process_creation
detection:
  debugger_image:
    Image|endswith:
      - '\cdb.exe'
      - '\windbg.exe'
      - '\WinDbgX.exe'
      - '\dbgsrv.exe'
      - '\kd.exe'
      - '\ntkd.exe'
      - '\ntsd.exe'
  script_args:
    CommandLine|contains:
      - ' $$>a<'
      - '$$>a<'
      - '.wds'
      - ' -cf '
      - ' /c "$$'
      - '.dvalloc'
      - '@$t0'
      - ' -c "eb '
  remote_server:
    Image|endswith: '\dbgsrv.exe'
    CommandLine|contains:
      - '-t tcp:'
      - '-t npipe:'
      - '-t spipe:'
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
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\cmd.exe'
  condition: (debugger_image and (script_args or remote_server)) or (debugger_image and abnormal_parent)
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Legitimate interactive debugging by named developer accounts (tune by user/tag)
  - dbgsrv use by a sanctioned remote-debugging workflow (constrain to specific hosts)
level: high
```

## 7. False Positives and Tuning

- **Developers debug legitimately.** Tag developer hosts and either exclude them or route this rule to a developer-corroboration queue. The presence of a debugger on a non-developer host is itself the cleaner signal for those fleets.
- **`-c` is a normal flag.** A bare `-c "command"` is used in legitimate automation. The rule keys on the *script-runner* token `$$>a<`, the `.wds` extension, and the `@$t0` / `.dvalloc` / `eb` atoms precisely to avoid firing on ordinary one-shot `-c` use.
- **`dbgsrv.exe` listeners** are rare even in dev shops. If you do not run remote debugging, treat any `dbgsrv.exe -t` as an incident until proven otherwise.
- **Thread-context density (Signal 2)** should be wired as a separate, higher-confidence alert in your EDR/ETW layer; a debugger hammering `SetThreadContext` on a target PID is almost never benign.

## 8. References

- [Bypassing WDAC with WinDbg Preview — Anubhav Gain (this blog)](/posts/bypassing-wdac-with-windbg-preview/)
- [The Power of Cdb.exe — mr.d0x](https://mrd0x.com/the-power-of-cdb-debugging-tool/)
- [Bypass WDAC WinDbg Preview — CerberSec](https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html)
- [How to Bypass WDAC with dbgsrv.exe — FortyNorth Security](https://fortynorthsecurity.com/blog/how-to-bypass-wdac-with-dbgsrv-exe/)
- [WinDbg/CDB as a Shellcode Runner — Matt Graeber](http://www.exploit-monday.com/2016/08/windbg-cdb-shellcode-runner.html)
- [MITRE ATT&CK T1055 — Process Injection](https://attack.mitre.org/techniques/T1055/)
- [MITRE ATT&CK T1055.001 — DLL Injection (context for remote-thread family)](https://attack.mitre.org/techniques/T1055/001/)
