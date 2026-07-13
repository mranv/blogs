---
title: 'Detecting COM, XSL, and Script-Host Abuse (wmic /format, mshta, winrm.vbs)'
author: Anubhav Gain
pubDatetime: 2026-07-13T15:00:00.000Z
slug: detecting-com-xsl-and-script-host-abuse
draft: false
featured: false
description: 'Part 5 of the WDAC detection-engineering series — detecting WMIC XSL stylesheets, mshta, winrm.vbs, and COM XSL transformations used to execute attacker code from trusted interpreters, with a Sigma rule and script-engine lineage guidance.'
tags:
- detection-engineering
- wdac
- com
- xsl
- wmic
- mshta
- sigma
- blue-team
category: Detection Engineering
lang: en
---

# Detecting COM, XSL, and Script-Host Abuse (wmic /format, mshta, winrm.vbs)

The richest family in the WDAC bypass catalogue is the trusted-interpreter family: scripting engines and COM components that consume a markup format — XSL, VBS, CHM, XML manifest, HTA — and execute the logic inside it. WDAC's user-mode code integrity (UMCI) extends into this territory, so the historical research is dense, and the techniques have aged into evergreen tradecraft: `wmic.exe /format:<xsl>`, `mshta.exe <url>`, `winrm.vbs`, and the COM XSL transformation (CVE-2018-8492) all still appear in real intrusions because the trusted engines are everywhere and the formats are legitimate.

This post closes the series with the detection coverage for that family. The good news: these techniques leave strong command-line and child-process fingerprints. The challenge: the same engines run legitimate administrative automation, so tuning matters.

## Table of Contents

1. [Why the Interpreters Are Everywhere](#1-why-the-interpreters-are-everywhere)
2. [The Five Shapes to Detect](#2-the-five-shapes-to-detect)
3. [Detection Signal 1 — WMIC XSL Stylesheet](#3-detection-signal-1--wmic-xsl-stylesheet)
4. [Detection Signal 2 — mshta](#4-detection-signal-2--mshta)
5. [Detection Signal 3 — winrm.vbs and Signed Script Hosts](#5-detection-signal-3--winrmvbs-and-signed-script-hosts)
6. [Detection Signal 4 — COM XSL Transformation](#6-detection-signal-4--com-xsl-transformation)
7. [Detection Signal 5 — Script-Engine Child Lineage](#7-detection-signal-5--script-engine-child-lineage)
8. [A Sigma Rule for the Family](#8-a-sigma-rule-for-the-family)
9. [Tuning Notes](#9-tuning-notes)
10. [Series Wrap-Up](#10-series-wrap-up)
11. [References](#11-references)

---

## 1. Why the Interpreters Are Everywhere

WDAC evaluates at image load against signing trust. A signed interpreter — `mshta.exe`, `wscript.exe`, `cscript.exe`, `wmic.exe` — is allowed to run. The script content it consumes is not an image; it is data. So if the interpreter is trusted, the policy authorises execution of whatever the data says. That is the whole game for this family, and it is why UMCI (which extends code integrity into script engines) and Constrained Language Mode exist — and also why there is a decade of research on escaping both.

## 2. The Five Shapes to Detect

| Shape | Trusted host | Content | Highest-signal atom |
|---|---|---|---|
| WMIC XSL | `wmic.exe` | XSL stylesheet | `/format:` with a non-default stylesheet path |
| HTA | `mshta.exe` | `.hta` or URL | `mshta.exe` with a `.hta`/`http` argument |
| Signed script host | `cscript.exe`/`wscript.exe` | `winrm.vbs` and friends | signed `.vbs`/`.js` run from a non-standard path |
| COM XSL transform | Office/scripting/COM host | XSL via COM | XSL transform API usage from an unusual host |
| Script-engine child | any of the above | shell payload | `wscript`/`cscript`/`mshta` → `cmd`/`powershell` |

The five are not independent — shape 5 (child lineage) is a catch-all that fires across the others. The per-shape rules give you specificity; the child-lineage rule gives you resilience against obfuscation.

## 3. Detection Signal 1 — WMIC XSL Stylesheet

`wmic.exe` accepts a `/format:` flag that points at an XSL stylesheet, and the stylesheet can run embedded script. The default formats (`htable`, `csv`, etc.) are benign; the detection is `/format:` pointing at a **file path** or a **URL**, especially one in a user-writable location or fetched over the network. Legitimate WMIC use almost never specifies a custom stylesheet file, so this is a high-signal, low-volume rule.

## 4. Detection Signal 2 — mshta

`mshta.exe` is the HTA host. It takes a `.hta` file or a URL as its argument and executes the embedded VBScript/JScript. Two strong signals:

- **Any** `mshta.exe` invocation with a `http`, `https`, or `ftp` argument — fetching an HTA over the network is essentially always malicious.
- `mshta.exe` with a `.hta` argument located in a user-writable path.
- `mshta.exe` as a child of an office app, browser, or script engine.

On most fleets, `mshta.exe` is rare enough that alerting on network-sourced arguments is clean.

## 5. Detection Signal 3 — winrm.vbs and Signed Script Hosts

`winrm.vbs` (and a handful of other signed Microsoft scripts) can be coerced into arbitrary execution — the original research is Matt Graeber's. The detection shape:

- `cscript.exe` or `wscript.exe` invoking `winrm.vbs` (or other known-abused signed scripts) with arguments outside their documented parameter set.
- Signed Microsoft scripts being run from non-standard paths (copied out of `System32`).
- The general case: `cscript.exe`/`wscript.exe` with a `.vbs`/`.js`/`.wsf` argument from a user-writable path.

The provenance of the script file is the signal. A script from `System32` run by `cscript` is one thing; the same engine running a script from `%TEMP%` is another.

## 6. Detection Signal 4 — COM XSL Transformation

CVE-2018-8492 turned XSL transforms through COM into a cross-product bypass. The host that performs the transform varies (Office, scripting engines, .NET), so this is harder to catch on process creation alone. Detection options:

- **Command line** containing XSL transform invocations (`msxsl.exe`, `xslt` args, `.xsl`/`.xslt` files passed to a COM host).
- **DLL load** of the XSL transform support (`msxml3.dll`, `msxml6.dll`) by an unusual host immediately followed by child-process or network activity.
- **Sysmon EID 22 DNS** or EID 3 network events from the transforming process, since COM XSL payloads frequently fetch a remote transform.

## 7. Detection Signal 5 — Script-Engine Child Lineage

The most resilient detection in the family: a script engine spawning a shell. The lineage to alert on:

> `wscript.exe` | `cscript.exe` | `mshta.exe` | `wmic.exe` → `cmd.exe` | `powershell.exe` | `pwsh.exe` | an unsigned executable

A script engine that spawns a shell is the canonical "interpreter was told to run something hostile" signature, and it is largely immune to command-line obfuscation because the child image is what it is.

## 8. A Sigma Rule for the Family

A rule covering WMIC XSL, mshta, the provenance of script files, and the shell-child lineage.

```yaml
title: WDAC Bypass — COM / XSL / Script-Host Abuse
id: 9d2e5a7c-3f1b-4d8e-a6c2-7b0e1f3a5d4c
status: experimental
description: >
  Detects trusted interpreters and COM hosts abused to bypass application
  control — WMIC with a custom XSL stylesheet, mshta with a URL/HTA,
  cscript/wscript running scripts from user-writable paths, and script
  engines spawning shells.
references:
  - https://github.com/bohops/UltimateWDACBypassList
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1218
  - attack.t1220
  - attack.t1059
logsource:
  product: windows
  category: process_creation
detection:
  wmic_xsl:
    Image|endswith: '\wmic.exe'
    CommandLine|contains:
      - '/format:'
      - '-format:'
    CommandLine|re: '.*(/format:|-format:).*\.(xsl|xslt|xml|js|vbs|hta).*'
  mshta_network:
    Image|endswith: '\mshta.exe'
    CommandLine|contains:
      - 'http://'
      - 'https://'
      - 'ftp://'
      - '.hta'
  script_user_writable:
    Image|endswith:
      - '\cscript.exe'
      - '\wscript.exe'
    CommandLine|contains:
      - '\Users\Public\'
      - '\AppData\Local\Temp\'
      - '\AppData\Roaming\'
      - '\Downloads\'
      - '\Windows\Temp\'
  shell_child:
    ParentImage|endswith:
      - '\wscript.exe'
      - '\cscript.exe'
      - '\mshta.exe'
      - '\wmic.exe'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\wscript.exe'
      - '\cscript.exe'
  condition: wmic_xsl or mshta_network or script_user_writable or shell_child
fields:
  - Image
  - ParentImage
  - CommandLine
  - User
falsepositives:
  - Legitimate administrative WMIC/VBScript automation (constrain to specific service accounts/paths)
  - Signed HTA applications run intentionally (rare in enterprise)
level: high
```

The `shell_child` branch is the sub-condition to weight highest — it fires across the entire family and is the most resistant to the attacker's choice of content.

## 9. Tuning Notes

- **WMIC `/format:`** is the cleanest single rule. Legitimate WMIC invocations rarely specify a stylesheet file; alert on the file/URL case and you will have a quiet, high-signal detection.
- **mshta on the network** is essentially never benign. If your fleet does not use HTA applications, treat any `mshta.exe` network fetch as an incident.
- **Script provenance over script execution.** You will drown if you alert on every `cscript.exe`. Anchor to path provenance (user-writable) and to the shell-child lineage.
- **Pair with Sysmon EID 7 (image load).** Loading `msxml3.dll`/`msxml6.dll` by Office or a scripting host immediately before a child process or network fetch is the COM XSL transform fingerprint.
- **UMCI/CLM context.** If your fleet enforces UMCI with PowerShell in Constrained Language Mode, the script-engine escapes covered in the catalogue (CVE-2017-0215, CVE-2017-8715, CVE-2018-8212, `Invoke-History`) deserve their own dedicated rules; treat the COM/XSL family here as one layer of a broader script-engine coverage.

## 10. Series Wrap-Up

Across the five parts, the detection posture for the WDAC bypass catalogue looks like this:

1. [**Baseline image-load / lineage**](/posts/detecting-wdac-lolbin-image-loads/) — catches the *invocation* of bypass primitives in abnormal contexts.
2. [**Debugger-as-injector**](/posts/detecting-debugger-as-injector-wdac/) — catches the behavioural signature of script-driven injection.
3. [**Compiler/REPL host abuse**](/posts/detecting-compiler-and-repl-host-abuse/) — catches trusted developer tools repurposed as execution engines.
4. [**WDAC-as-weapon**](/posts/detecting-wdac-edr-blinding/) — catches the policy deployment that blinds EDR, and the dark-endpoint silence.
5. **COM/XSL/script-host** (this post) — catches the interpreter family via command line and shell-child lineage.

The recurring lesson: WDAC bypass detection is not a single rule, it is a *posture* — image-load baseline, behavioural signals, content fingerprints, child-process lineage, and out-of-band telemetry for when the in-host signal is gone. Layer them, tier them to your fleet, and treat absence as signal.

## 11. References

- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [WMIC Whitelisting Bypass — Hacking with Style — Casey Smith](https://web.archive.org/web/20190814201250/https://subt0x11.blogspot.com/2018/04/wmicexe-whitelisting-bypass-hacking.html)
- [COM XSL Transformation (CVE-2018-8492) — bohops](https://bohops.com/2019/01/10/com-xsl-transformation-bypassing-microsoft-application-control-solutions-cve-2018-8492/)
- [Arbitrary Unsigned Code Execution in winrm.vbs — Matt Graeber](https://posts.specterops.io/application-whitelisting-bypass-and-arbitrary-unsigned-code-execution-technique-in-winrm-vbs-c8c24fb40404)
- [MITRE ATT&CK T1220 — XSL Script Processing](https://attack.mitre.org/techniques/T1220/)
- [MITRE ATT&CK T1218 — System Binary Proxy Execution](https://attack.mitre.org/techniques/T1218/)
- [MITRE ATT&CK T1059 — Command and Scripting Interpreter](https://attack.mitre.org/techniques/T1059/)
