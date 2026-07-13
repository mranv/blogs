---
title: 'Detecting UMCI Bypasses and PowerShell Constrained Language Mode Escapes'
author: Anubhav Gain
pubDatetime: 2026-07-13T15:30:00.000Z
slug: detecting-umci-powershell-clm-escapes
draft: false
featured: false
description: 'Part 6 of the WDAC detection-engineering series — detecting User-Mode Code Integrity (UMCI) bypasses and escapes from PowerShell Constrained Language Mode, with a Sigma rule and PowerShell event-log coverage.'
tags:
- detection-engineering
- wdac
- umci
- powershell
- constrained-language-mode
- sigma
- blue-team
category: Detection Engineering
lang: en
---

# Detecting UMCI Bypasses and PowerShell Constrained Language Mode Escapes

When a WDAC policy includes **UMCI** (User-Mode Code Integrity), PowerShell is forced into **Constrained Language Mode (CLM)**. CLM strips the dangerous surface — no arbitrary COM, no `Add-Type`, no Win32 API calls, no script-based .NET invocation — precisely the surface an attacker needs. Unsurprisingly, there is a long line of public research on escaping CLM and the surrounding UMCI surface: `PSWorkflowUtility` (CVE-2017-0215), the CVE-2017-0007 Device Guard defeat, CVE-2017-8715, CVE-2018-8212 (`MSFT_SCRIPTRESOURCE`), `Invoke-History`, and code injection into an already-running full-language host.

Part 5 deferred this family to its own post; this is that post. The good news for detection: CLM and UMCI produce rich, structured PowerShell telemetry, and the escapes have distinctive shapes.

## Table of Contents

1. [What UMCI and CLM Actually Restrict](#1-what-umci-and-clm-actually-restrict)
2. [The Shape of an Escape](#2-the-shape-of-an-escape)
3. [Detection Signal 1 — Script-Block Logging](#3-detection-signal-1--script-block-logging)
4. [Detection Signal 2 — Full-Language Mode in a CLM Fleet](#4-detection-signal-2--full-language-mode-in-a-clm-fleet)
5. [Detection Signal 3 — Known Escape Indicators](#5-detection-signal-3--known-escape-indicators)
6. [Detection Signal 4 — Code Injection into a Full-Language Host](#6-detection-signal-4--code-injection-into-a-full-language-host)
7. [A Sigma Rule for the Family](#7-a-sigma-rule-for-the-family)
8. [Tuning and Operational Notes](#8-tuning-and-operational-notes)
9. [References](#9-references)

---

## 1. What UMCI and CLM Actually Restrict

UMCI extends code-integrity enforcement into user-mode script engines: only trusted (WDAC-approved) assemblies and scripts may execute. Because PowerShell is a trusted, signed host, WDAC cannot simply block it — instead it forces PowerShell into **Constrained Language Mode**, in which the dangerous .NET/COM/Win32 surface is unavailable to untrusted scripts. An attacker who can either (a) escape CLM back to Full Language Mode, or (b) inject their code into a process that is *already* in Full Language Mode, recovers the full surface.

That is the entire shape of the escape problem, and every technique below is one of those two paths.

## 2. The Shape of an Escape

Two recurring patterns:

- **CLM → Full Language Mode** — abuse a trusted component the policy permits to run full-trust code, or exploit a logic flaw in the policy enforcement itself (the CVE family). Examples: `PSWorkflowUtility` honouring a workflow in full trust; `MSFT_SCRIPTRESOURCE` (DSC) running outside CLM; module-manifest tricks.
- **Inject into a full-language host** — find an already-running PowerShell process in Full Language Mode (e.g. a management agent, a signed module's host) and inject code into its memory, bypassing the language-mode check entirely.

Both leave traces — the first in PowerShell's own event logs, the second in process/thread telemetry.

## 3. Detection Signal 1 — Script-Block Logging

Enable **PowerShell Script Block Logging** (Event ID 4104 in `Microsoft-Windows-PowerShell/Operational`) across the fleet. It captures the de-obfuscated script block content at execution time, including the bodies of `Invoke-History`, workflow, and DSC resource calls. This is the single most important telemetry source for this family.

Pair it with **Module Logging** (EID 4103) and **Transcription** for defence-in-depth. Script-block logging defeats most obfuscation because the engine logs the script *after* de-obfuscation, at compile time.

## 4. Detection Signal 2 — Full-Language Mode in a CLM Fleet

If your fleet enforces UMCI, the steady state is **Constrained Language Mode**. A PowerShell process reporting `Full Language` (or the engine emitting the EID 4104 with a script block that would be illegal under CLM, such as `Add-Type`, `[Activator]::CreateInstance`, or direct Win32 via `Add-Type`) is the anomaly.

You can observe language mode two ways:

- The `EngineState`/`Host Application` fields in PowerShell event logs.
- ETW from `Microsoft-Windows-PowerShell` reflecting a transition out of constrained mode.

On a CLM-enforcing fleet, alert on any `Full Language` context outside the small set of management agents that legitimately run that way.

## 5. Detection Signal 3 — Known Escape Indicators

Per-technique fingerprints visible in script-block logs and command lines:

- **CVE-2017-0215 / PSWorkflowUtility** — `Invoke-AsWorkflow` or workflow invocation carrying inline script; `New-PSWorkflowExecutionOption`.
- **CVE-2017-8715** — PowerShell module manifest (`.psd1`) abuse; watch for `NestedModules`/`RootModule` pointing at unusual assemblies.
- **CVE-2018-8212** — `MSFT_SCRIPTResource` (DSC) invocation carrying script outside a legitimate DSC configuration pipeline.
- **Invoke-History** — `Get-History` / `Invoke-History` replaying a crafted history entry; the replayed content is the payload.
- **CVE-2017-0007** — the named-pipe/RPC surface against the Device Guard component; correlate with unusual local RPC/Pipe activity.

The presence of these atoms in a script-block log on a CLM-enforcing host is the detection.

## 6. Detection Signal 4 — Code Injection into a Full-Language Host

The injection path is detectable at the process/thread level rather than the PowerShell log:

- **`CreateRemoteThread` / `SetThreadContext`** into a `powershell.exe`/`pwsh.exe` process from an external, non-parent process — the classic injection signature against a full-language host.
- **Memory write + execute** into a PowerShell process from an unsigned or non-standard source.
- A PowerShell process whose loaded module set suddenly grows (Sysmon EID 7) with a non-default assembly after the process has been running.

This is the same behavioural shape as the debugger-as-injector from [part 2](/posts/detecting-debugger-as-injector-wdac/) and reuses the same thread-context-manipulation detection logic, retargeted at a PowerShell host.

## 7. A Sigma Rule for the Family

A Sigma rule keyed on the script-block log (EID 4104) for the known escape indicators, plus a process-creation branch for the injection path.

```yaml
title: UMCI / PowerShell CLM Escape Indicators
id: 1f4a8b2c-6d3e-4a9f-b5c7-8e1d2a3b4c5d
status: experimental
description: >
  Detects indicators of Windows Defender Application Control User-Mode Code
  Integrity (UMCI) bypass and PowerShell Constrained Language Mode (CLM)
  escape — known escape atoms in script-block logs, and injection into a
  running full-language PowerShell host.
references:
  - https://www.100daysofredteam.com/
  - https://enigma0x3.net/2017/10/19/umci-bypass-using-psworkflowutility-cve-2017-0215/
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1059.001
  - attack.t1127.001
logsource:
  product: windows
  service: microsoft-windows-powershell
detection:
  selection_scriptblock:
    EventID: 4104
    ScriptBlockText|contains:
      - 'Invoke-AsWorkflow'
      - 'New-PSWorkflowExecutionOption'
      - 'MSFT_SCRIPTResource'
      - 'Invoke-History'
      - 'Get-History'
      - '[Activator]::CreateInstance'
      - 'Add-Type'
      - '[Microsoft.VisualStudio.Text.Temporation]'
  selection_full_language:
    EventID: 400
    Data|contains:
      - 'EngineState=FullLanguage'
  condition: selection_scriptblock or selection_full_language
fields:
  - ScriptBlockText
  - ComputerName
  - User
falsepositives:
  - Legitimate DSC / workflow use on management servers (constrain by host)
  - Legitimate Add-Type use by signed modules on non-CLM hosts
level: medium
```

A companion process-creation rule for the injection path:

```yaml
title: Injection Into a Full-Language PowerShell Host
id: 2a5b9c1d-7e4f-4b1a-9c8d-3f2e1a0b9c8d
status: experimental
description: >
  Detects a non-parent process writing code into / hijacking threads of a
  running powershell.exe/pwsh.exe host, consistent with injecting into a
  Full-Language PowerShell process to escape Constrained Language Mode.
references:
  - http://www.exploit-monday.com/2017/08/exploiting-powershell-code-injection.html
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1055
  - attack.t1059.001
logsource:
  product: windows
  category: process_creation
detection:
  target_host:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
  injector_parent:
    ParentImage|endswith:
      - '\rundll32.exe'
      - '\regsvcs.exe'
      - '\regasm.exe'
      - '\msbuild.exe'
      - '\installutil.exe'
  condition: target_host and injector_parent
fields:
  - Image
  - ParentImage
  - CommandLine
falsepositives:
  - Legitimate tooling that hosts PowerShell (constrain to known service accounts)
level: high
```

## 8. Tuning and Operational Notes

- **Script-block logging is mandatory** for this family. Without EID 4104 you are blind to the de-obfuscated content. Turn it on centrally and forward to the SIEM.
- **Baseline language mode.** On a UMCI fleet the expected state is CLM. Deviation to `FullLanguage` is the alert, not the routine.
- **Correlate CVE indicators with patch level.** CVE-2017-0215, CVE-2017-8715, CVE-2018-8212 are old; their appearance on a patched fleet implies either a missed host or a deliberate bypass attempt — both worth investigating.
- **Watch the module manifest path.** `.psd1` files with `NestedModules`/`RootModule` pointing outside `Program Files` are a common shape across several of these escapes.

## 9. References

- [UMCI Bypass using PSWorkflowUtility (CVE-2017-0215) — Matt Nelson](https://enigma0x3.net/2017/10/19/umci-bypass-using-psworkflowutility-cve-2017-0215/)
- [Defeating Device Guard: CVE-2017-0007 — Matt Nelson](https://enigma0x3.net/2017/04/03/defeating-device-guard-a-look-into-cve-2017-0007/)
- [CVE-2017-8715 — Matt Nelson](https://enigma0x3.net/2017/11/06/a-look-at-cve-2017-8715-bypassing-cve-2017-0218-using-powershell-module-manifests/)
- [CVE-2018-8212: Device Guard/CLM Bypass via MSFT_SCRIPTRESOURCE — Matt Nelson](https://enigma0x3.net/2018/10/10/cve-2018-8212-device-guard-clm-bypass-using-msft_scriptresource/)
- [Exploiting PowerShell Code Injection to Bypass CLM — Matt Graeber](http://www.exploit-monday.com/2017/08/exploiting-powershell-code-injection.html)
- [PowerShell Script Block Logging — Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_logging_windows)
- [MITRE ATT&CK T1059.001 — PowerShell](https://attack.mitre.org/techniques/T1059/001/)
