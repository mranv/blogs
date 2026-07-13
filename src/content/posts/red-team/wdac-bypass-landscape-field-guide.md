---
title: 'A Field Guide to WDAC Bypass Techniques'
author: Anubhav Gain
pubDatetime: 2026-07-13T00:00:00.000Z
slug: wdac-bypass-landscape-field-guide
draft: false
featured: false
description: 'A mechanism-grouped tour of the Windows Defender Application Control (Application Control for Business) bypass landscape — debuggers, compilers, signed utilities, COM/XSL, WSL, and novel exploitation — with pointers to the original research.'
tags:
- wdac
- application-control
- lolbins
- offensive-security
- red-team
- windows-security
- device-guard
- umci
category: Offensive Security
lang: en
---

# A Field Guide to WDAC Bypass Techniques

Windows Defender Application Control (WDAC) — now rebranded by Microsoft as **Application Control** / **Application Control for Business** — is one of the strongest code-integrity controls on a modern Windows estate. It decides what code is allowed to run, and it does so in the kernel, early, and with a policy model that scales from "trust everything Microsoft-signed" up to a tightly curated allow-list. When deployed well, it shrinks an attacker's options dramatically.

So naturally there is a decade of public research on how to get around it.

This post is a tour of that landscape. It is organised by **mechanism** rather than by binary, because the mechanisms recur: a signed scripting engine, a debugger that controls execution, a compiler that turns data into code, a COM/XSL pipeline that interprets a markup format. Once you know the handful of shapes a WDAC bypass takes, a new "0day" LOLBin is usually an old shape wearing a new filename. For the exhaustive, maintained catalogue of documented techniques, the canonical resource is Jimmy Bayne's [UltimateWDACBypassList](https://github.com/bohops/UltimateWDACBypassList); this article is a companion orientation, not a substitute.

## Table of Contents

1. [Why WDAC Bypass Research Exists](#1-why-wdac-bypass-research-exists)
2. [The Trust Model, in One Paragraph](#2-the-trust-model-in-one-paragraph)
3. [Mechanism 1 — Debuggers](#3-mechanism-1--debuggers)
4. [Mechanism 2 — Compilers and Scripting Hosts](#4-mechanism-2--compilers-and-scripting-hosts)
5. [Mechanism 3 — Signed Installers and Utilities](#5-mechanism-3--signed-installers-and-utilities)
6. [Mechanism 4 — COM, XSL, and the Scripting Engines](#6-mechanism-4--com-xsl-and-the-scripting-engines)
7. [Mechanism 5 — Windows Subsystem for Linux](#7-mechanism-5--windows-subsystem-for-linux)
8. [Mechanism 6 — Novel Exploitation (BYOVA, Browser, Catalog Hygiene)](#8-mechanism-6--novel-exploitation-byova-browser-catalog-hygiene)
9. [Why Block Lists Are Reactive](#9-why-block-lists-are-reactive)
10. [Building and Testing Policies](#10-building-and-testing-policies)
11. [The Wider Lesson](#11-the-wider-lesson)
12. [References](#12-references)

---

## 1. Why WDAC Bypass Research Exists

Application control is a deny-by-default control built on top of code signing. The unstated assumption is that **signed binaries only do what their signed purpose says they do**. That assumption is false in a useful way: a great many Microsoft-signed binaries are, by design, interpreters, compilers, debuggers, or extensibility hosts. They take instructions from a data file, a script, a project manifest, a stylesheet, or a debugger script — and they execute them. If the trusted binary is allowed to run, and it will faithfully execute attacker-supplied logic, then WDAC has authorised the execution by proxy.

That is the whole game. Every technique below is a search for trusted binaries whose legitimate function is "run arbitrary logic," followed by working out how to feed them that logic without tripping the policy.

## 2. The Trust Model, in One Paragraph

A WDAC policy is an XML document compiled into a binary code-integrity policy (`.cip`) that the kernel's Code Integrity component enforces at image-load time. Trust is granted by rules: signer/publisher rules (a certificate chain plus a partial leaf hash), path rules, hash rules, and checks for WHQL signing, specific EKUs, or a recognised Windows root. Most enterprise policies carry implicit trust for the Microsoft signing ecosystem — which is precisely why Microsoft-signed developer tooling is such fertile ground. UMCI (User-Mode Code Integrity) extends the same idea to script engines and is where much of the PowerShell/COM research lives.

## 3. Mechanism 1 — Debuggers

A debugger is the most direct primitive of all: it controls register state and execution flow, which means it controls what code runs.WDAC evaluates at image load, not at "is a signed process manipulating another process's memory," so a signed debugger that manipulates an already-running, already-trusted process flies under the policy.

| Binary | Mechanism (original summary) | Original research |
|---|---|---|
| `cdb.exe` | Console debugger runs shellcode from a script via `.script`/memory-write primitives | Matt Graeber — [WinDbg/CDB as a Shellcode Runner](http://www.exploit-monday.com/2016/08/windbg-cdb-shellcode-runner.html) |
| `windbg.exe` | Same debugger scripting surface as CDB | Matt Graeber — [WinDbg/CDB as a Shellcode Runner](http://www.exploit-monday.com/2016/08/windbg-cdb-shellcode-runner.html) |
| `dbgsrv.exe` | Debugger server used to attach and drive code execution remotely | Casey Smith / Ross Wolf — [How to Bypass WDAC with dbgsrv.exe (FortyNorth)](https://fortynorthsecurity.com/blog/how-to-bypass-wdac-with-dbgsrv-exe/) |
| `WinDbgX.exe` | Store-distributed, Microsoft-signed WinDbg Preview; outside the recommended block list; injects shellcode via `.wds` scripting | CerberSec — [Bypass WDAC WinDbg Preview](https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html) (see [my write-up](/posts/bypassing-wdac-with-windbg-preview/)) |

A cluster of debugger-family binaries (`kd.exe`, `ntkd.exe`, `ntsd.exe`, `dbgsvc.exe`) also appear on Microsoft's block list even where public abuse write-ups are thin — the mechanism is the same and the block is precautionary.

## 4. Mechanism 2 — Compilers and Scripting Hosts

Compilers and REPL hosts are trusted programs whose job is to consume source and emit — or directly execute — code. If the host is signed and allowed, and the source lives in a data file the policy doesn't evaluate, you have execution.

| Binary / family | Mechanism (original summary) | Original research |
|---|---|---|
| `msbuild.exe` | Compiles and executes inline C#/VB tasks from a project file | Casey Smith — [Bypassing Application Whitelisting using MSBuild.exe](https://web.archive.org/web/20160920161634/http://subt0x10.blogspot.com/2016/09/bypassing-application-whitelisting.html) |
| `csi.exe` / `rcsi.exe` | Roslyn C# interactive REPL runs C# scripts | Casey Smith — [CSI.EXE](https://web.archive.org/web/20161008143428/http://subt0x10.blogspot.com/2016/09/application-whitelisting-bypass-csiexe.html); Matt Nelson — [RCSI.EXE](https://enigma0x3.net/2016/11/21/bypassing-application-whitelisting-by-using-rcsi-exe/) |
| `dnx.exe` | .NET execution environment runs project code | Matt Nelson — [Bypassing AWL by using DNX.EXE](https://enigma0x3.net/2016/11/17/bypassing-application-whitelisting-by-using-dnx-exe/) |
| `dotnet.exe` | .NET Core CLI runs assemblies/commands | Jimmy Bayn — [DotNet Core: A Vector for AWL Bypass](https://bohops.com/2019/08/19/dotnet-core-a-vector-for-awl-bypass-defense-evasion/) |
| `fsi.exe` / `fsiAnyCpu.exe` | F# interactive host executes F# inline | Nick Tyrer / Jimmy Bayn — [Wfc.exe, Fsi.exe, FsiAnyCpu.exe](https://bohops.com/2020/11/02/exploring-the-wdac-microsoft-recommended-block-rules-part-ii-wfc-fsi/) |
| `wfc.exe` | F# workflow compiler | Jimmy Bayn — [same write-up](https://bohops.com/2020/11/02/exploring-the-wdac-microsoft-recommended-block-rules-part-ii-wfc-fsi/) |
| `dbghost.exe` | Visual Studio T4 template host executes template logic | Casey Smith — [Ghost And The Darkness](https://web.archive.org/web/20170926164017/http://subt0x10.blogspot.com/2017/09/dbghostexe-ghost-in-darkness.html) |

The pattern is identical across all of them: find the signed host, hand it a data file containing your logic, let it execute on your behalf.

## 5. Mechanism 3 — Signed Installers and Utilities

A second class is signed Microsoft binaries that load or process attacker-controlled content during legitimate operations — installers, helpers, and UI-automation tools that can be coerced into running arbitrary code, usually through deserialisation, custom-script hooks, or by design exposing a "run this" capability.

| Binary | Mechanism (original summary) | Original research |
|---|---|---|
| `InstallUtil.exe` | Installer host loads and invokes attacker assembly methods | James Forshaw — [Abusing InstallUtil](https://www.tiraniddo.dev/2017/08/dg-on-windows-10-s-abusing-installutil.html) |
| `addinutil.exe` | Insecure deserialization of add-in config | [@McKinleyMike / @TheLatteri — Insecure Deserialization in AddinUtil.exe](https://www.blue-prints.blog/content/blog/posts/lolbin/addinutil-lolbas.html) |
| `runscripthelper.exe` | Signed utility executes PowerShell from a constrained path | Matt Graeber — [Bypassing AWL with runscripthelper.exe](https://posts.specterops.io/bypassing-application-whitelisting-with-runscripthelper-exe-1906923658fc) |
| `visualuiaverifynative.exe` | UI-automation verifier loads and runs code | Lee Christensen / Jimmy Bayn — [VisualUiaVerifyNative](https://bohops.com/2020/10/15/exploring-the-wdac-microsoft-recommended-block-rules-visualuiaverifynative/) |
| `bginfo.exe` | Sysinternals tool runs embedded VBScript | Oddvar Moe — [Bypassing AWL with BGInfo](https://msitpros.com/?p=3831) |
| `infdefaultinstall.exe` | INF-based installer runs an installer section | Kyle Hanslovan / Chris Bisnett — [Evading Autoruns](https://github.com/huntresslabs/evading-autoruns) |
| `Microsoft.Workflow.Compiler.exe` | Workflow compiler deserialises and runs logic | Matt Graeber — [Arbitrary Unsigned Code Execution Vector](https://posts.specterops.io/arbitrary-unsigned-code-execution-vector-in-microsoft-workflow-compiler-exe-3d9294bc5efb) |

## 6. Mechanism 4 — COM, XSL, and the Scripting Engines

UMCI extends code integrity into script-engine territory, so the bypass research here is dense. The recurring idea: a trusted scripting engine or COM component interprets a format (XSL, VBS, CHM, XML manifest) that carries executable content.

- **WMIC stylesheets** — `wmic.exe` honours an `/format:` flag pointing at an XSL stylesheet; the stylesheet runs script. Casey Smith documented the original. ([WMIC Whitelisting Bypass](https://web.archive.org/web/20190814201250/https://subt0x11.blogspot.com/2018/04/wmicexe-whitelisting-bypass-hacking.html))
- **COM XSL transformation (CVE-2018-8492)** — the same XSL idea through COM instantiation, defeating several application-control products. Jimmy Bayn's write-up is the reference. ([COM XSL Transformation](https://bohops.com/2019/01/10/com-xsl-transformation-bypassing-microsoft-application-control-solutions-cve-2018-8492/))
- **winrm.vbs** — a signed script host abused for execution. Matt Graeber's write-up is canonical. ([Arbitrary Unsigned Code Execution in winrm.vbs](https://posts.specterops.io/application-whitelisting-bypass-and-arbitrary-unsigned-code-execution-technique-in-winrm-vbs-c8c24fb40404))
- **CHM (CVE-2017-8625)** — HTML Help as a UMCI bypass. Oddvar Moe and Matt Nelson.
- **WSH / mshta** — `mshta.exe` and the Windows Script Host remain evergreen primitives for executing script content from a trusted host.
- **PowerShell CLM/UMCI CVEs** — a long tail of Constrained Language Mode escapes (CVE-2017-0215, CVE-2017-0007, CVE-2017-8715, CVE-2018-8212, `Invoke-History`) where the scripting engine itself could be coaxed out of restricted mode.
- **Catalog hygiene** — abusing the way signature catalogs are trusted to launder unsigned code as if it were signed. ([Abusing Catalog Hygiene](https://bohops.com/2019/05/04/abusing-catalog-file-hygiene-to-bypass-application-whitelisting/))

## 7. Mechanism 5 — Windows Subsystem for Linux

The WSL family (`bash.exe`, `wsl.exe`, `lxrun.exe`, `wslconfig.exe`, `wslhost.exe`) exposes a Linux world that can be used to run code outside the constraints a Windows-only policy assumed. Alex Ionescu's [lxss research](https://github.com/ionescu007/lxss) is the foundational write-up. The defensive lesson: a policy scoped to Windows binaries is not scoped to everything that runs on Windows.

## 8. Mechanism 6 — Novel Exploitation (BYOVA, Browser, Catalog Hygiene)

Not every bypass is a LOLBin. Some are genuine vulnerabilities or operational tradecraft:

- **Browser exploits** — a memory-corruption exploit in an allowed browser achieves execution that WDAC then has to permit because the browser is trusted. Valentina Palmiotti's [Operationalizing browser exploits to bypass WDAC (IBM X-Force)](https://www.ibm.com/think/x-force/operationalizing-browser-exploits-to-bypass-wdac) is the clearest treatment.
- **Electron/Node.js apps** — a signed Electron shell (e.g., a C2 like Loki) executes JavaScript payloads; WDAC trusts the shell. Bobby Cooke's [Bypassing WDAC with Loki C2 (IBM X-Force)](https://www.ibm.com/think/x-force/bypassing-windows-defender-application-control-loki-c2) documents the pattern.
- **Bring-Your-Own-Vulnerable-Application** — bring a signed-but-vulnerable binary and exploit it for unsigned execution.

## 9. Why Block Lists Are Reactive

Microsoft maintains a **recommended block list** (formerly the "Applications that can bypass WDAC" list) that denies the most abused LOLBins. It is a defensive essential — but it is structurally reactive. A new signed primitive (the Store-distributed WinDbg Preview being the recent textbook case) is not on the list until someone publishes it, and a determined defender ends up playing whack-a-mole against the next interpreter Microsoft ships.

Two practical corollaries:

1. **When you apply the recommended block-rules policy, strip the default-allow rules.** The block list ships with two default-allow file rules (`ID_ALLOW_A_1`, `ID_ALLOW_A_2`) that must be removed, or the "block" policy still allows more than you intend.
2. **A signed-binary block list cannot, by construction, anticipate signed binaries whose legitimate function is to run code.** Pair it with behavioural detection, least privilege, and network segmentation.

## 10. Building and Testing Policies

The defensive toolkit is mature and worth knowing whether you are red or blue:

- [**WDAC Policy Wizard**](https://github.com/MicrosoftDocs/WDAC-Toolkit) — Microsoft's official authoring tool for building and editing policies.
- [**WDACTools**](https://github.com/mattifestation/WDACTools) — Matt Graeber's PowerShell module for building, deploying, and auditing policies.
- [**WDACPolicies**](https://github.com/mattifestation/WDACPolicies) — baseline notes and corresponding sample policies.
- [**DeviceGuardBypassMitigationRules**](https://github.com/mattifestation/DeviceGuardBypassMitigationRules) — a reference deny policy that blocks the published bypasses; the companion defence to the UltimateWDACBypassList.
- [**WinAWL**](https://github.com/arekfurt/WinAWL) — application-control notes and sample policies by Brian in Pittsburgh.
- [**FortyNorth's WDAC lab guide**](https://fortynorthsecurity.com/blog/building-a-windows-defender-application-control-lab/) — standing up a test environment.
- Matt Graeber's [WDAC Twitch playlist](https://www.youtube.com/playlist?list=PL2Xx-q-W5pKUNaNkakjZkLmfsNvMWPdNB) and [case study on documenting/attacking a WDAC feature](https://posts.specterops.io/documenting-and-attacking-a-windows-defender-application-control-feature-the-hard-way-a-case-73dd1e11be3a) are the deepest end-to-end material available.

Always validate in **audit mode** first, then promote to enforced once your event log is quiet. A policy that breaks the business is a policy that gets turned off.

## 11. The Wider Lesson

Catalogues like the UltimateWDACBypassList are not vulnerability databases — they are an inventory of the tension at the heart of application control: **you cannot whitelist "programs that run code" without whitelisting code running.** Every compiler, debugger, scripting host, and COM interpreter that carries a Microsoft signature is, from the policy's point of view, a trusted general-purpose execution engine. The defensive answer is therefore not a perfect block list (there is no such thing) but defence in depth — application control as one layer, with behavioural detection, least privilege, identity controls, and segmentation behind it.

For attackers and red teamers, the lesson is the mirror image: stop looking for "new" bypasses and start looking for trusted binaries whose job is to interpret something. The shapes are few; the filenames are many.

---

## 12. References

- [UltimateWDACBypassList — Jimmy Bayn (bohops)](https://github.com/bohops/UltimateWDACBypassList)
- [Exploit Monday — Matt Graeber](http://www.exploit-monday.com/) · [mattifestation on GitHub](https://github.com/mattifestation)
- [bohops — security research](https://bohops.com/)
- [Bypass WDAC WinDbg Preview — CerberSec](https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html)
- [The Power of Cdb.exe — mr.d0x](https://mrd0x.com/the-power-of-cdb-debugging-tool/)
- [Operationalizing browser exploits to bypass WDAC — IBM X-Force](https://www.ibm.com/think/x-force/operationalizing-browser-exploits-to-bypass-wdac)
- [Bypassing WDAC with Loki C2 — IBM X-Force](https://www.ibm.com/think/x-force/bypassing-windows-defender-application-control-loki-c2)
- [Windows Defender Application Control — Microsoft Learn](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/windows-defender-application-control)
- [WDAC Policy Wizard — MicrosoftDocs/WDAC-Toolkit](https://github.com/MicrosoftDocs/WDAC-Toolkit)
- [WDACTools — mattifestation](https://github.com/mattifestation/WDACTools)
- [DeviceGuardBypassMitigationRules — mattifestation](https://github.com/mattifestation/DeviceGuardBypassMitigationRules)
