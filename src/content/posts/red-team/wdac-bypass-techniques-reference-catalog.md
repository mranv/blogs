---
title: 'WDAC Bypass Techniques — The Complete Reference Catalog'
author: Anubhav Gain
pubDatetime: 2026-07-13T12:00:00.000Z
slug: wdac-bypass-techniques-reference-catalog
draft: false
featured: false
description: 'An exhaustive, attributed catalogue of every publicly documented Windows Defender Application Control (Application Control for Business) bypass technique — LOLBINs, libraries, PowerShell/UMCI, COM/XSL, novel exploitation — plus the policy and testing tooling.'
tags:
- wdac
- application-control
- lolbins
- lolbas
- device-guard
- umci
- offensive-security
- reference
- windows-security
category: Offensive Security
lang: en
---

# WDAC Bypass Techniques — The Complete Reference Catalog

> Companion to [A Field Guide to WDAC Bypass Techniques](/posts/wdac-bypass-landscape-field-guide/) — that post explains *why* the six mechanism families work. This one is the exhaustive catalogue: every publicly documented bypass, who published it, and where to read the original.

This is a reference index. Each entry is one documented technique, the researcher who published it, a one-line description of the mechanism, and a link to the original write-up. The facts (binary names, attributions, and URLs) are drawn from the public record and the canonical curated resource: Jimmy Bayn's [UltimateWDACBypassList](https://github.com/bohops/UltimateWDACBypassList). For the maintained, living list, always defer to that repository — this article exists to give the material a readable, searchable home on this blog.

A note on naming: Microsoft has rebranded **Windows Defender Application Control (WDAC)** as **Application Control** / **Application Control for Business**. The older names — **Device Guard** and **UMCI** (User-Mode Code Integrity) — still appear throughout the historical research and are preserved in the citations below.

## Table of Contents

1. [How to Read This Catalog](#1-how-to-read-this-catalog)
2. [Documented LOLBIN Bypasses](#2-documented-lolbin-bypasses)
3. [On the Block List but Not Yet Publicly Documented](#3-on-the-block-list-but-not-yet-publicly-documented)
4. [Libraries Worth Knowing](#4-libraries-worth-knowing)
5. [Other Unsigned-Code-Execution LOLBINs (Not on the List)](#5-other-unsigned-code-execution-lolbins-not-on-the-list)
6. [PowerShell / UMCI / Constrained Language Mode](#6-powershell--umci--constrained-language-mode)
7. [COM, XSL, Office, and Active Scripting](#7-com-xsl-office-and-active-scripting)
8. [Novel Exploitation and BYOVA](#8-novel-exploitation-and-byova)
9. [Defense, Policy Creation, Testing, and Research](#9-defense-policy-creation-testing-and-research)
10. [Using This Material Responsibly](#10-using-this-material-responsibly)
11. [Source Repository](#11-source-repository)

---

## 1. How to Read This Catalog

Each technique is a Microsoft-signed (or Microsoft-distributed) binary or component whose legitimate function — compiling, debugging, interpreting, transforming, or installing — can be repurposed to execute attacker-supplied logic. WDAC evaluates at **image-load** time against signing trust; it does not generally ask "will this signed program run code from a file it reads?" That gap is what every row below exploits.

Two cross-cutting reminders from the source repository, worth pinning to the top:

- The **Microsoft recommended block list** ships with two default-allow file rules (`ID_ALLOW_A_1`, `ID_ALLOW_A_2`) that must be removed when you apply it, or your "block" policy still allows more than you intend.
- The block list is **reactive**. New signed primitives ship faster than the list updates — the Store-distributed WinDbg Preview is the textbook recent example.

## 2. Documented LOLBIN Bypasses

| Binary | Mechanism (one line) | Original research |
|---|---|---|
| `addinprocess.exe` | COM add-in host process loads attacker content in a trusted context | James Forshaw — [DG on Windows 10 S: Executing Arbitrary Code](https://www.tiraniddo.dev/2017/07/dg-on-windows-10-s-executing-arbitrary.html) |
| `addinprocess32.exe` | 32-bit variant of the add-in host, same primitive | James Forshaw — [DG on Windows 10 S: Executing Arbitrary Code](https://www.tiraniddo.dev/2017/07/dg-on-windows-10-s-executing-arbitrary.html) |
| `addinutil.exe` | Insecure deserialization of add-in configuration data | @McKinleyMike / @TheLatteri — [Insecure Deserialization in AddinUtil.exe](https://www.blue-prints.blog/content/blog/posts/lolbin/addinutil-lolbas.html) |
| `aspnet_compiler.exe` | ASP.NET compiler pre-processes/executes build-time logic | cpl (@cpl3h) — [The Curious Case of Aspnet_Compiler.exe](https://ijustwannared.team/2020/08/01/the-curious-case-of-aspnet_compiler-exe/) |
| `bginfo.exe` | Sysinternals tool runs embedded VBScript from a `.bgi` config | Oddvar Moe — [Bypassing AWL with BGInfo](https://msitpros.com/?p=3831) |
| `cdb.exe` | Console debugger executes shellcode via `.script`/memory primitives | Matt Graeber — [WinDbg/CDB as a Shellcode Runner](http://www.exploit-monday.com/2016/08/windbg-cdb-shellcode-runner.html) |
| `csi.exe` | Roslyn C# interactive REPL runs C# script | Casey Smith — [CSI.EXE C# Scripting](https://web.archive.org/web/20161008143428/http://subt0x10.blogspot.com/2016/09/application-whitelisting-bypass-csiexe.html) |
| `dbghost.exe` | Visual Studio T4 template host executes template logic | Casey Smith — [Ghost And The Darkness](https://web.archive.org/web/20170926164017/http://subt0x10.blogspot.com/2017/09/dbghostexe-ghost-in-darkness.html) |
| `dnx.exe` | .NET execution environment runs project code | Matt Nelson — [Bypassing AWL with DNX.EXE](https://enigma0x3.net/2016/11/17/bypassing-application-whitelisting-by-using-dnx-exe/) |
| `dotnet.exe` | .NET Core CLI runs assemblies/commands | Jimmy Bayn — [DotNet Core: A Vector for AWL Bypass](https://bohops.com/2019/08/19/dotnet-core-a-vector-for-awl-bypass-defense-evasion/) |
| `fsi.exe` | F# interactive host executes F# inline | Nick Tyrer / Jimmy Bayn — [fsi.exe inline execution](https://gist.github.com/NickTyrer/51eb8c774a909634fa69b4d06fc79ae1); [Wfc/Fsi write-up](https://bohops.com/2020/11/02/exploring-the-wdac-microsoft-recommended-block-rules-part-ii-wfc-fsi/) |
| `fsiAnyCpu.exe` | Architecture-neutral F# host, same mechanism | Nick Tyrer / Jimmy Bayn — [Wfc/Fsi write-up](https://bohops.com/2020/11/02/exploring-the-wdac-microsoft-recommended-block-rules-part-ii-wfc-fsi/) |
| `infdefaultinstall.exe` | INF-driven installer runs an installer section's directives | Kyle Hanslovan / Chris Bisnett — [Evading Autoruns](https://github.com/huntresslabs/evading-autoruns) |
| `InstallUtil.exe` | Installer host loads and invokes methods on an attacker assembly | James Forshaw — [DG on Windows 10 S: Abusing InstallUtil](https://www.tiraniddo.dev/2017/08/dg-on-windows-10-s-abusing-installutil.html) |
| `Microsoft.Management.Services.IntuneWindowsAgent.exe` | Intune agent component abused to bypass control | Kim Oppalfens — [Intune Windows Agent Bypass (issue #1)](https://github.com/bohops/UltimateWDACBypassList/issues/1) |
| `kill.exe` | Process-kill utility; documented SEH buffer overflow as a primitive | @hyp3rlinx — [kill.exe SEH Buffer Overflow](http://hyp3rlinx.altervista.org/advisories/MS-KILL-UTILITY-BUFFER-OVERFLOW.txt) |
| `Microsoft.Workflow.Compiler.exe` | Workflow compiler deserialises and runs attacker logic | Matt Graeber — [Arbitrary Unsigned Code Execution Vector](https://posts.specterops.io/arbitrary-unsigned-code-execution-vector-in-microsoft-workflow-compiler-exe-3d9294bc5efb) |
| `msbuild.exe` | Build engine compiles and runs inline C#/VB tasks from a project file | Casey Smith — [Bypassing AWL using MSBuild.exe](https://web.archive.org/web/20160920161634/http://subt0x10.blogspot.com/2016/09/bypassing-application-whitelisting.html) |
| `mshta.exe` | HTA host runs embedded script | @conscioushacker — [Application Whitelisting Bypass: mshta.exe](https://web.archive.org/web/20171118145940/http://blog.conscioushacker.io/index.php/2017/11/17/application-whitelisting-bypass-mshta-exe/) |
| `powershellcustomhost.exe` | Custom PowerShell host that escapes the default constrained surface | Lasse Trolle Borup — [A Simple Device Guard Bypass](https://danishcyberdefence.dk/blog/device-guard-powershellcustomhost) |
| `rcsi.exe` | Roslyn C# script runner (non-interactive variant) | Matt Nelson — [Bypassing AWL with RCSI.EXE](https://enigma0x3.net/2016/11/21/bypassing-application-whitelisting-by-using-rcsi-exe/) |
| `runscripthelper.exe` | Signed utility executes PowerShell from a constrained path | Matt Graeber — [Bypassing AWL with runscripthelper.exe](https://posts.specterops.io/bypassing-application-whitelisting-with-runscripthelper-exe-1906923658fc) |
| `visualuiaverifynative.exe` | UI-automation verifier loads and runs code | Lee Christensen / Jimmy Bayn — [VisualUiaVerifyNative](https://bohops.com/2020/10/15/exploring-the-wdac-microsoft-recommended-block-rules-visualuiaverifynative/) |
| `wfc.exe` | F# workflow compiler | MSRC / Matt Graeber tip, Jimmy Bayn write-up — [Wfc/Fsi write-up](https://bohops.com/2020/11/02/exploring-the-wdac-microsoft-recommended-block-rules-part-ii-wfc-fsi/) |
| `windbg.exe` | GUI debugger with the same scripting surface as `cdb` | Matt Graeber — [WinDbg/CDB as a Shellcode Runner](http://www.exploit-monday.com/2016/08/windbg-cdb-shellcode-runner.html) |
| `wmic.exe` | Honours an `/format:` flag pointing at an XSL stylesheet that runs script | Casey Smith — [WMIC Whitelisting Bypass — Hacking with Style](https://web.archive.org/web/20190814201250/https://subt0x11.blogspot.com/2018/04/wmicexe-whitelisting-bypass-hacking.html) |
| WSL family — `bash.exe`, `lxrun.exe`, `wsl.exe`, `wslconfig.exe`, `wslhost.exe` | Linux subsystem executes code outside a Windows-only policy's scope | Alex Ionescu — [Fun with the Windows Subsystem for Linux (lxss)](https://github.com/ionescu007/lxss) |

## 3. On the Block List but Not Yet Publicly Documented

These binaries appear on Microsoft's recommended block list even where a full public abuse write-up is thin. The defensive assumption is that they share a debugger/loader/scripting primitive with documented neighbours and are blocked precautionarily.

- `dbgsvc.exe` — debugger service host
- `kd.exe` — kernel debugger
- `ntkd.exe` — kernel debugger (legacy)
- `ntsd.exe` — console debugger (NT symbol debugger)
- `texttransform.exe` — T4 text templating transformation host
- `HVCIScan.exe` — Hyper-V code-integrity scanning utility

## 4. Libraries Worth Knowing

DLLs that appear on the block list. Independent abuse of these is "may or may not be interesting" territory, but they are the loaded code behind several techniques above and worth recognising in telemetry.

- `Microsoft.Build.dll`
- `Microsoft.Build.Framework.dll`
- `msbuild.dll`
- `lxssmanager.dll` — the WSL service implementation
- `system.management.automation.dll` — the PowerShell engine
- `webclnt.dll` / `davsvc.dll` — WebDAV client/service (the classic `\\host@port\resource` path)
- `mfc40.dll`

## 5. Other Unsigned-Code-Execution LOLBINs (Not on the List)

| Binary | Mechanism (one line) | Original research |
|---|---|---|
| `dbgsrv.exe` | Debugger server used to attach and drive code execution remotely | Casey Smith / Ross Wolf — [How to Bypass WDAC with dbgsrv.exe (FortyNorth)](https://fortynorthsecurity.com/blog/how-to-bypass-wdac-with-dbgsrv-exe/); [Fantastic Red-Team Attacks (Black Hat)](https://i.blackhat.com/USA-19/Thursday/us-19-Smith-Fantastic-Red-Team-Attacks-And-How-To-Find-Them.pdf) |
| `WinDbgX.exe` | Store-distributed, Microsoft-signed WinDbg Preview; outside the recommended block list; injects shellcode via `.wds` scripting | CerberSec — [Bypass WDAC WinDbg Preview](https://cerbersec.com/2025/04/07/bypass-wdac-windbg-preview.html) — see also [my deep-dive](/posts/bypassing-wdac-with-windbg-preview/) |

## 6. PowerShell / UMCI / Constrained Language Mode

When WDAC policy includes UMCI, PowerShell is forced into **Constrained Language Mode (CLM)**. A long line of research covers escapes from CLM and the surrounding UMCI surface.

| Technique | Mechanism (one line) | Original research |
|---|---|---|
| `PSWorkflowUtility` (CVE-2017-0215) | Workflow utility abused to escape constrained language mode | Matt Nelson — [UMCI Bypass using PSWorkflowUtility](https://enigma0x3.net/2017/10/19/umci-bypass-using-psworkflowutility-cve-2017-0215/) |
| Defeating Device Guard (CVE-2017-0007) | Device Guard bypass via the named-pipe/rpc surface | Matt Nelson — [Defeating Device Guard: A Look into CVE-2017-0007](https://enigma0x3.net/2017/04/03/defeating-device-guard-a-look-into-cve-2017-0007/) |
| PowerShell code injection → CLM escape | Injecting code into an already-running full-language PowerShell host | Matt Graeber — [Exploiting PowerShell Code Injection to Bypass CLM](http://www.exploit-monday.com/2017/08/exploiting-powershell-code-injection.html) |
| CVE-2017-8715 | Bypass of the CVE-2017-0218 fix via PowerShell module manifests | Matt Nelson — [A Look at CVE-2017-8715](https://enigma0x3.net/2017/11/06/a-look-at-cve-2017-8715-bypassing-cve-2017-0218-using-powershell-module-manifests/) |
| CVE-2018-8212 (`MSFT_SCRIPTRESOURCE`) | DSC script resource abused to bypass Device Guard/CLM | Matt Nelson — [CVE-2018-8212: Device Guard/CLM Bypass](https://enigma0x3.net/2018/10/10/cve-2018-8212-device-guard-clm-bypass-using-msft_scriptresource/) |
| `Invoke-History` CLM bypass | Replaying a history entry to escape constrained mode | Matt Graeber — [Invoke-History bypass (post)](https://twitter.com/mattifestation/status/1095416185053696000) |

## 7. COM, XSL, Office, and Active Scripting

A dense family: trusted engines that interpret a markup, manifest, or transform format and execute embedded code.

| Technique | Mechanism (one line) | Original research |
|---|---|---|
| .NET assembly compilation methods | Compiler APIs invoked from script to assemble and run code in-policy | Matt Graeber — [Bypassing Device Guard with .NET Assembly Compilation Methods](http://www.exploit-monday.com/2017/07/bypassing-device-guard-with-dotnet-methods.html) |
| Sneaking Past Device Guard (CVE-2018-8417) | Script-integrity bypass via Office/scripting surface | Philip Tsukerman — [Sneaking Past Device Guard (HITB)](https://conference.hitb.org/hitbsecconf2019ams/materials/D2T1%20-%20Sneaking%20Past%20Device%20Guard%20-%20Philip%20Tsukerman.pdf) |
| WLDP CLSID-policy .NET COM instantiation | Instantiate a .NET COM object exempted from WLDP to escape UMCI | James Forshaw — [Project Zero issue #1514](https://bugs.chromium.org/p/project-zero/issues/detail?id=1514) |
| WSH injection | Windows Script Host injection case study for UMCI bypass | Matt Nelson — [WSH Injection: A Case Study](https://enigma0x3.net/2017/08/03/wsh-injection-a-case-study/) |
| `winrm.vbs` | Signed script host abused for arbitrary unsigned execution | Matt Graeber — [Arbitrary Unsigned Code Execution in winrm.vbs](https://posts.specterops.io/application-whitelisting-bypass-and-arbitrary-unsigned-code-execution-technique-in-winrm-vbs-c8c24fb40404) |
| COM XSL transformation (CVE-2018-8492) | XSL transform through COM defeats several application-control products | Jimmy Bayn — [COM XSL Transformation](https://bohops.com/2019/01/10/com-xsl-transformation-bypassing-microsoft-application-control-solutions-cve-2018-8492/) |
| Catalog-file hygiene | Abuse of signature-catalog trust to launder unsigned code as signed | Jimmy Bayn — [Abusing Catalog Hygiene](https://bohops.com/2019/05/04/abusing-catalog-file-hygiene-to-bypass-application-whitelisting/) |
| CHM (CVE-2017-8625) | HTML Help as a UMCI bypass vector | Oddvar Moe / Matt Nelson — [Bypassing Device Guard UMCI using CHM](https://oddvar.moe/2017/08/13/bypassing-device-guard-umici-using-chm-cve-2017-8625/) |
| UMCI vs Internet Explorer (CVE-2017-8625) | IE scripting surface leveraged against the same underlying flaw | Matt Nelson — [UMCI vs Internet Explorer](https://enigma0x3.net/2017/08/24/umci-vs-internet-explorer-exploring-cve-2017-8625/) |
| Previous-version signed script hosts + catalogs | Older signed script hosts and catalog files used to bypass WDAC | William Easton — [VULN-051861 advisory](https://github.com/strawgate/Advisories/blob/main/Microsoft/VULN-051861.md) |

## 8. Novel Exploitation and BYOVA

| Technique | Mechanism (one line) | Original research |
|---|---|---|
| Browser exploit → WDAC bypass | A memory-corruption exploit in a trusted browser achieves execution WDAC must permit | Valentina Palmiotti — [Operationalizing browser exploits to bypass WDAC (IBM X-Force)](https://www.ibm.com/think/x-force/operationalizing-browser-exploits-to-bypass-wdac) |
| WDAC bypass via Loki C2 (Electron/Node) | A signed Electron shell runs JavaScript payloads; the shell is trusted, the payload is data | Bobby Cooke (0xBoku) — [Bypassing WDAC with Loki C2 (IBM X-Force)](https://www.ibm.com/think/x-force/bypassing-windows-defender-application-control-loki-c2) |

## 9. Defense, Policy Creation, Testing, and Research

The other half of the catalog: the tooling and deep-dive material for **building, deploying, auditing, and testing** WDAC policies. This is the material you want on the blue-team desk.

| Resource | What it is | Link |
|---|---|---|
| WDAC stream playlist | Matt Graeber's video series covering creation, enforcement, bypass, and audit | [@mattifestation playlist](https://www.youtube.com/playlist?list=PL2Xx-q-W5pKUNaNkakjZkLmfsNvMWPdNB) |
| WDAC Policy Wizard | Microsoft's official tool for authoring and editing policies | [MicrosoftDocs/WDAC-Toolkit](https://github.com/MicrosoftDocs/WDAC-Toolkit) |
| WDACTools | PowerShell module to build, configure, deploy, and audit policies | [mattifestation/WDACTools](https://github.com/mattifestation/WDACTools) |
| WDACPolicies | Baseline software notes + corresponding sample policies | [mattifestation/WDACPolicies](https://github.com/mattifestation/WDACPolicies) |
| DeviceGuardBypassMitigationRules | Reference deny policy blocking the published bypasses — companion to this catalog | [mattifestation/DeviceGuardBypassMitigationRules](https://github.com/mattifestation/DeviceGuardBypassMitigationRules) |
| Building a WDAC lab | Stand up a test environment end-to-end | [FortyNorth Security](https://fortynorthsecurity.com/blog/building-a-windows-defender-application-control-lab/) |
| Documenting & attacking a WDAC feature | Case study in security-research methodology | Matt Graeber — [SpecterOps](https://posts.specterops.io/documenting-and-attacking-a-windows-defender-application-control-feature-the-hard-way-a-case-73dd1e11be3a) |
| WinAWL | Windows application-control notes and sample policies | Brian in Pittsburgh — [arekfurt/WinAWL](https://github.com/arekfurt/WinAWL) |
| Exploit Monday | Matt Graeber's blog — much of the foundational research lives here | [exploit-monday.com](http://www.exploit-monday.com/) |
| Quick deploy + test machine setup | Restrictive + scan policy gists for fast lab bring-up | Jimmy Bayn — [restrictive](https://gist.github.com/bohops/bd763d87187b79c0c749da6be7be8a42) / [scan](https://gist.github.com/bohops/148375490c5ead713ed8a433b466182f) |
| WDAC in 20H2 + a simple secure policy | Policy-design evolution and a minimal Windows-only baseline | Matt Graeber — [Medium](https://mattifestation.medium.com/windows-defender-application-control-wdac-updates-in-20h2-and-building-a-simple-secure-4fd4ee86de4) |
| Harden Windows Security — WDAC Notes | Practitioner notes on policy hardening | HotCakeX — [wiki](https://github.com/HotCakeX/Harden-Windows-Security/wiki/WDAC-Notes) |
| Chad Duffey — WDAC Notes | Operational notes from the field | [chadduffey.com](https://www.chadduffey.com/wdac/2021/01/26/WDAC-notes.html) |

## 10. Using This Material Responsibly

Every link above points to published, defensive-minded security research. The value of a catalogue like this is twofold: for red teamers it shortens the path from "I have admin" to "I have execution under application control," and for defenders it is the exact checklist of what a deny policy must account for. If you are on the blue side, the companion [DeviceGuardBypassMitigationRules](https://github.com/mattifestation/DeviceGuardBypassMitigationRules) policy is the fastest way to turn this catalogue into enforcement.

Two operating principles:

1. **Application control is one layer.** A block list cannot, by construction, anticipate signed binaries whose legitimate function is to run code. Pair it with behavioural detection, least privilege, and network segmentation.
2. **Validate before you enforce.** Promote a policy from audit to enforced only once your `8007` (code-integrity) event log is quiet against your real workload. A policy that breaks the business is a policy that gets turned off.

## 11. Source Repository

This catalogue is a readable re-presentation of public research. The maintained, canonical resource — the one to watch for new entries — is:

- **[bohops/UltimateWDACBypassList](https://github.com/bohops/UltimateWDACBypassList)** — Jimmy Bayn's centralised resource for documented WDAC/Device Guard/UMCI bypass techniques and policy building, managing, and testing. Inspired by Oddvar Moe's [UltimateAppLockerBypassList](https://github.com/api0cradle/UltimateAppLockerByPassList).

See also the companion orientation on this blog: [A Field Guide to WDAC Bypass Techniques](/posts/wdac-bypass-landscape-field-guide/), and the WinDbg-Preview deep-dive: [Bypassing WDAC with WinDbg Preview](/posts/bypassing-wdac-with-windbg-preview/).
