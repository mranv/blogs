---
title: 'Option 1 — Enabled:Boot Menu Protection'
author: Anubhav Gain
pubDatetime: 2026-05-03T10:00:00.000Z
slug: rule-option-option-01-boot-menu-protection
draft: false
featured: false
description: 'Current Support Status: Not currently supported by Windows'
tags:
- windows-security
- app-control-for-business
- wdac
- endpoint-security
- rule-options
- applocker
category: WDAC Rule Options
lang: en
---
# Option 1 — Enabled:Boot Menu Protection

**Current Support Status:** Not currently supported by Windows

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Why It Exists](#2-why-it-exists)
3. [Visual Anatomy — Policy Evaluation Stack](#3-visual-anatomy--policy-evaluation-stack)
4. [How to Set It (PowerShell)](#4-how-to-set-it-powershell)
5. [XML Representation](#5-xml-representation)
6. [Interaction with Other Options](#6-interaction-with-other-options)
7. [When to Enable vs Disable](#7-when-to-enable-vs-disable)
8. [Real-World Scenario — End-to-End Walkthrough](#8-real-world-scenario--end-to-end-walkthrough)
9. [What Happens If You Get It Wrong](#9-what-happens-if-you-get-it-wrong)
10. [Valid for Supplemental Policies?](#10-valid-for-supplemental-policies)
11. [OS Version Requirements](#11-os-version-requirements)
12. [Summary Table](#12-summary-table)

---

## 1. What It Does

`Enabled:Boot Menu Protection` is a WDAC / App Control for Business policy rule option with the index value 1 that, **in its intended design**, would prevent users from interrupting the boot sequence to access the Windows Advanced Boot Options menu — the menu that presents recovery options such as Safe Mode, Disable Driver Signature Enforcement, and Enable Low-Resolution Video. Accessing these options is a known pathway to bypassing code integrity enforcement because Safe Mode loads a minimal set of drivers and can disable or weaken Code Integrity policies. The intent of this option is to close that boot-time bypass by locking out the `F8`/`Shift+F8` interrupt that normally surfaces the boot menu.

**However, this option is currently not supported.** Microsoft has defined the rule option in the WDAC schema and tooling, assigned it an index, and documented it in the policy XML specification, but the underlying operating system does not yet implement the enforcement behavior. Setting this option in a policy XML has no observable effect on the boot menu behavior at runtime. The option is reserved for a future Windows release.

Despite being non-functional today, it is important to understand its design intent, placement in the boot trust chain, and what compensating controls exist in the current OS to achieve the same goal through other means (Secure Boot configuration, BitLocker lockout policies, and UEFI password protection).

---

## 2. Why It Exists

### The Boot-Time Attack Vector

The Windows Advanced Boot Options menu (`F8` during boot) is one of the few remaining user-accessible pathways to modify kernel behavior after Secure Boot has handed control to the Windows Boot Manager. Specifically:

- **"Disable Driver Signature Enforcement"** — Temporarily disables kernel-mode code integrity for the duration of that boot session. An attacker or privileged user can use this option to load unsigned drivers, rootkits, or kernel-level implants that would otherwise be blocked by WDAC.
- **Safe Mode** — Loads a minimal driver set and may start fewer security services. Some EDR/AV products do not fully initialize in Safe Mode, creating a window for tampering.
- **Startup Settings → Disable Early Launch Antimalware** — Disables ELAM protection, removing the first-boot malware scan.

### The Threat Model

```mermaid
flowchart TD
    classDef threat fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef protect fill:#0d1f12,color:#86efac,stroke:#166534
    classDef neutral fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef option fill:#1a1a0d,color:#fde68a,stroke:#713f12

    A([Attacker with physical\nor admin access]) --> B{Press F8 at boot}:::threat
    B --> C[Advanced Boot Options menu]:::threat
    C --> D[Disable Driver Signature\nEnforcement]:::threat
    C --> E[Boot into Safe Mode]:::threat
    C --> F[Disable ELAM]:::threat
    D --> G([Unsigned driver / rootkit loads\nWDAC kernel CI bypassed]):::threat
    E --> H([EDR/AV not initialized\nTampering possible]):::threat
    F --> I([First-boot malware scan\nskipped]):::threat

    J([Option 1 Design Intent]) --> K{Lock F8 menu\nwhen WDAC enforced}:::option
    K --> L([Boot menu inaccessible\nduring enforced policy]):::protect
```

### Why a Dedicated Option Is Needed

Secure Boot alone does not prevent F8 boot menu access — it only validates the bootloader signature before handing control to the Windows Boot Manager. Once the signed bootloader is running, it provides the `F8` pathway as a user convenience feature. Revoking that convenience programmatically, through the active Code Integrity policy, was the architectural goal of Option 1.

---

## 3. Visual Anatomy — Policy Evaluation Stack

```mermaid
flowchart TD
    classDef kernel fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef usermode fill:#0d1f12,color:#86efac,stroke:#166534
    classDef option fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef unsupported fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef neutral fill:#1c1c2e,color:#a5b4fc,stroke:#3730a3

    A([System Power On]) --> B[UEFI Firmware]:::kernel
    B --> C[Secure Boot Validation]:::kernel
    C --> D[Windows Boot Manager\nbootmgfw.efi]:::kernel
    D --> E{F8 / Shift+F8\nDetected?}:::neutral

    E -- Yes --> F{Option 1\nEnabled:Boot Menu Protection\nPresent in Policy?}:::option
    F -- Yes & Supported --> G([Boot menu BLOCKED]):::kernel
    F -- Yes & NOT Supported --> H([Boot menu shows ANYWAY\nOption 1 has no effect today]):::unsupported
    F -- No --> I([Boot menu shows\nnormally]):::neutral

    E -- No --> J[Windows OS Loader\nwinload.efi]:::kernel
    G --> J
    J --> K[Early Launch Anti-Malware\nELAM]:::kernel
    K --> L[Kernel + Drivers Load\nCode Integrity checks]:::kernel
    L --> M[User Session Starts\nWDAC Enforcement]:::usermode
```

### Current Reality vs Intended Design

```mermaid
flowchart LR
    classDef intended fill:#0d1f12,color:#86efac,stroke:#166534
    classDef actual fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef neutral fill:#162032,color:#58a6ff,stroke:#1e3a5f

    subgraph Intended["Intended Behavior (Future)"]
        direction TB
        A1([Option 1 in Policy]) --> B1([Boot Manager reads policy]):::intended
        B1 --> C1([F8 menu disabled]):::intended
        C1 --> D1([Boot-time bypass closed]):::intended
    end

    subgraph Actual["Actual Behavior (Today)"]
        direction TB
        A2([Option 1 in Policy]) --> B2([Boot Manager ignores option]):::actual
        B2 --> C2([F8 menu available]):::actual
        C2 --> D2([Boot-time bypass possible]):::actual
    end
```

---

## 4. How to Set It (PowerShell)

Although the option has no runtime effect today, the PowerShell syntax is defined and functional for XML manipulation. It is documented here for completeness and future readiness.

### Set Option 1 (No-Op Today)

```powershell
# Enable Option 1 — no effect on current Windows versions
Set-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 1
```

### Remove Option 1

```powershell
# Remove Option 1
Set-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 1 -Delete
```

### Verify the Option Is Present in Policy XML

```powershell
[xml]$Policy = Get-Content "C:\Policies\MyBasePolicy.xml"
$ns = New-Object System.Xml.XmlNamespaceManager($Policy.NameTable)
$ns.AddNamespace("si", "urn:schemas-microsoft-com:sipolicy")
$rules = $Policy.SelectNodes("//si:Rule/si:Option", $ns) | Select-Object -ExpandProperty '#text'
if ($rules -contains "Enabled:Boot Menu Protection") {
    Write-Host "Option 1 (Boot Menu Protection) is SET in policy XML" -ForegroundColor Yellow
    Write-Host "NOTE: This option has no effect on current Windows versions." -ForegroundColor Red
} else {
    Write-Host "Option 1 is not set." -ForegroundColor Gray
}
```

### Compensating Controls (Current Best Practice)

Since Option 1 is non-functional, the following compensating controls achieve the equivalent security goal today:

```powershell
# 1. Disable F8 boot menu via bcdedit (disables Advanced Options prompt)
bcdedit /set {bootmgr} displaybootmenu no
bcdedit /set {default} bootmenupolicy standard

# 2. Set a short boot timeout (prevents F8 window)
bcdedit /timeout 0

# 3. Require BitLocker PIN at boot (physical access attack mitigated)
# Enable BitLocker with TPM+PIN:
Enable-BitLocker -MountPoint "C:" -TpmAndPinProtector -Pin (Read-Host -AsSecureString "Enter PIN")

# 4. Lock UEFI settings with administrator password (prevent boot order change)
# (Done via UEFI firmware interface — no PowerShell API)

# 5. Verify HVCI is enabled (makes kernel CI tamper-resistant)
$hvci = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard
$hvci.SecurityServicesRunning  # Should include 2 (HVCI)
```

---

## 5. XML Representation

### Option 1 Present in Policy XML

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Base Policy">

  <VersionEx>10.0.0.0</VersionEx>
  <PolicyTypeID>{A244370E-44C9-4C06-B551-F6016E563076}</PolicyTypeID>

  <Rules>
    <Rule>
      <Option>Enabled:UMCI</Option>
    </Rule>

    <Rule>
      <Option>Enabled:Boot Menu Protection</Option>
    </Rule>

  </Rules>

</SiPolicy>
```

### XML Schema Reference

The WDAC XML schema (`sipolicy.xsd`) includes `Enabled:Boot Menu Protection` as a valid enumeration value in the `RuleOptionType` simple type. This is why `Set-RuleOption` accepts it without error and `ConvertFrom-CIPolicy` produces a valid binary. The binary compiler includes the option bit in the compiled policy, but the boot manager does not yet read or act on that bit.

---

## 6. Interaction with Other Options

### Option Relationship Matrix

| Option | Name | Relationship with Option 1 |
|--------|------|---------------------------|
| 0 | Enabled:UMCI | Independent; UMCI is user-mode enforcement, Option 1 is boot-time |
| 2 | Required:WHQL | Independent; WHQL is driver signing, Option 1 is boot menu access |
| 3 | Enabled:Audit Mode | Independent; audit mode does not affect boot menu |
| 9 | Enabled:Advanced Boot Options Menu | **Direct counterpart** — Option 9 explicitly enables the advanced boot menu; intended conflict with Option 1 |
| 10 | Enabled:Boot Audit on Failure | Related — both operate in the boot trust chain |

### Interaction with Option 9

```mermaid
flowchart TD
    classDef option fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef conflict fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef neutral fill:#162032,color:#58a6ff,stroke:#1e3a5f

    Opt1["Option 1\nEnabled:Boot Menu Protection\n(Blocks F8 menu)"]:::option
    Opt9["Option 9\nEnabled:Advanced Boot Options Menu\n(Enables F8 menu when policy fails)"]:::option

    Opt1 -->|"Intended conflict\n(one locks, one enables)"| Opt9
    note1["NOTE: Since Option 1 is unsupported,\nOption 9 currently wins by default"]:::conflict
    Opt9 --> note1
```

---

## 7. When to Enable vs Disable

```mermaid
flowchart TD
    classDef yes fill:#0d1f12,color:#86efac,stroke:#166534
    classDef no fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef question fill:#162032,color:#58a6ff,stroke:#1e3a5f

    Start([Should I set Option 1?]) --> Q1{Is this a future-proofing\nor schema compliance exercise?}:::question
    Q1 -- Yes --> WARN1([Set it in XML for future readiness\nbut expect NO current enforcement]):::warn
    Q1 -- No --> Q2{Do you want to prevent\nF8 boot menu access NOW?}:::question
    Q2 -- Yes --> COMP([Use compensating controls:\nbcdedit, BitLocker PIN, UEFI password]):::yes
    Q2 -- No --> SKIP([Leave Option 1 unset\nNo current benefit to setting it]):::no

    WARN1 --> NOTE([Document in change log:\nOption 1 is pending OS support]):::warn
```

### Decision Reference Table

| Scenario | Recommendation |
|----------|---------------|
| High-security endpoint requiring boot menu lockout | Use bcdedit + BitLocker PIN (compensating controls) |
| Future OS compatibility preparation | Set Option 1 in base policy with documentation note |
| Standard enterprise rollout | Omit Option 1; no current benefit |
| Research / lab environment testing future features | Set Option 1 to observe when OS support arrives |
| Compliance requirement citing "boot menu protection" | Implement via compensating controls; note Option 1 gap in risk register |

---

## 8. Real-World Scenario — End-to-End Walkthrough

### Scenario: Insider Threat Attempts Safe Mode Bypass

An insider with physical access to an endpoint attempts to bypass WDAC enforcement by booting into Safe Mode to load an unsigned driver and exfiltrate data. This walkthrough shows current behavior vs intended behavior.

```mermaid
sequenceDiagram
    autonumber
    actor Insider as Insider Threat
    participant Physical as Physical Machine
    participant UEFI as UEFI Secure Boot
    participant BootMgr as Windows Boot Manager
    participant BootMenu as Advanced Boot Options
    participant SafeMode as Safe Mode Session
    participant WDAC as WDAC Enforcement

    Note over Insider,WDAC: CURRENT BEHAVIOR (Option 1 not supported)
    Insider ->> Physical: Power on / restart machine
    Physical ->> UEFI: POST and Secure Boot validation
    UEFI -->> BootMgr: Bootloader validated, launch
    Insider ->> BootMgr: Press F8 during boot
    BootMgr ->> BootMenu: Display Advanced Boot Options
    Note over BootMenu: Option 1 in policy — NO EFFECT today
    Insider ->> BootMenu: Select "Safe Mode"
    BootMenu ->> SafeMode: Boot into Safe Mode
    SafeMode -->> WDAC: WDAC partially active or weakened
    Insider ->> SafeMode: Load unsigned driver via sc.exe
    SafeMode -->> Insider: Driver loads (WDAC weakened in Safe Mode)

    Note over Insider,WDAC: INTENDED BEHAVIOR (When Option 1 is supported)
    Insider ->> Physical: Power on / restart machine
    Physical ->> UEFI: POST and Secure Boot validation
    UEFI -->> BootMgr: Bootloader validated, launch
    BootMgr ->> BootMgr: Read active WDAC policy
    BootMgr ->> BootMgr: Detect Option 1 (Boot Menu Protection)
    Insider ->> BootMgr: Press F8 during boot
    BootMgr -->> Insider: F8 BLOCKED — boot continues normally
    BootMgr ->> SafeMode: Normal boot — WDAC fully enforced
```

### Current Compensating Control Walkthrough

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Endpoint as Endpoint Machine
    participant bcdedit as bcdedit Tool
    participant BitLocker as BitLocker Service
    participant UEFI as UEFI Firmware

    Admin ->> bcdedit: bcdedit /set {bootmgr} displaybootmenu no
    bcdedit -->> Admin: Boot menu timeout suppressed
    Admin ->> bcdedit: bcdedit /timeout 0
    bcdedit -->> Admin: Zero-second boot timeout set
    Admin ->> BitLocker: Enable-BitLocker with TPM+PIN protector
    BitLocker -->> Admin: Drive encrypted; PIN required at boot
    Admin ->> UEFI: Set UEFI administrator password
    UEFI -->> Admin: UEFI settings locked
    Admin ->> Endpoint: Verify: attempt F8 at next boot
    Endpoint -->> Admin: Boot proceeds directly to Windows
    Note over Admin,UEFI: Option 1 effect achieved via compensating controls
```

---

## 9. What Happens If You Get It Wrong

### Misunderstanding: Assuming Option 1 Works Today

```mermaid
flowchart TD
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef ok fill:#0d1f12,color:#86efac,stroke:#166534

    A([Admin sets Option 1 in policy\nassuming it works]) --> B{OS enforces it?}
    B -- No --> C([False security assurance]):::block
    C --> D([Boot menu bypass available]):::block
    D --> E([Attacker uses F8 to enter Safe Mode]):::block
    E --> F([WDAC weakened in Safe Mode]):::block
    F --> G([Unsigned driver / malware loads]):::block
    B -- Yes FUTURE --> H([Boot menu locked]):::ok
```

### Misunderstanding: Not Knowing It Is Non-Functional

An organization includes Option 1 in their WDAC baseline policy believing it closes the boot menu bypass vector. Their security audit passes because the policy XML contains the option. However, the control is not actually enforced, creating a compliance gap and a real security hole.

**Mitigation:** Always document Option 1 as "pending OS support" in your policy change log, and implement the bcdedit + BitLocker + UEFI compensating controls to achieve the actual security objective.

### Misconfig Consequences Summary

| Mistake | Impact | Severity |
|---------|--------|----------|
| Relying on Option 1 without compensating controls | Boot menu bypass unclosed | Critical — unmitigated bypass |
| Setting Option 1 thinking it blocks F8 today | False security posture | High — compliance gap |
| Not documenting Option 1 as non-functional | Audit findings at security review | Medium |
| Not implementing bcdedit compensating controls | Boot-time attack surface open | High |

---

## 10. Valid for Supplemental Policies?

**No.** `Enabled:Boot Menu Protection` is defined as a base-policy-only option. Even if it were supported by the OS, its effect would need to apply at the boot manager level before any user or tenant context is established — a point in the boot sequence where supplemental policies (which extend base policies at runtime) have no relevance. Supplemental policies are merged into the base policy by the Code Integrity engine after the kernel loads; they cannot retroactively affect the boot manager's behavior.

---

## 11. OS Version Requirements

| Windows Version | Status |
|----------------|--------|
| Windows 10 (all versions to date) | **Not supported** — option defined but not enforced |
| Windows 11 (all versions to date) | **Not supported** — same status |
| Windows Server 2016–2022 | **Not supported** |
| Future Windows release (TBD) | **Pending implementation** by Microsoft |

> **Official Microsoft Guidance:** "This option isn't currently supported." — Windows App Control for Business documentation.

### Why It Appears in Tooling Despite Being Unsupported

The rule option schema is versioned independently of OS enforcement capability. Microsoft pre-registers options in the schema to allow policy authors to future-proof their XML, enabling a smooth transition when OS support is eventually added without requiring policy rewrites. Setting the option today ensures the binary policy will automatically take effect once the OS gains enforcement support — provided the policy is redeployed or remains active.

---

## 12. Summary Table

| Attribute | Value |
|-----------|-------|
| Rule Option Name | `Enabled:Boot Menu Protection` |
| Rule Option Index | 1 |
| Default State | **Not set** |
| Current OS Enforcement | **None — not yet supported** |
| Intended Effect when Enabled | Block F8 / Advanced Boot Options menu during enforced WDAC boot |
| Intended Effect when Disabled | Advanced Boot Options accessible (default behavior) |
| Valid in Base Policy | **Yes** (syntactically valid, semantically no-op) |
| Valid in Supplemental Policy | **No** |
| Requires Reboot | N/A (no effect) |
| Compensating Controls | bcdedit displaybootmenu no, bcdedit /timeout 0, BitLocker TPM+PIN, UEFI password |
| Option 9 Relationship | Direct counterpart — Option 9 enables boot menu, Option 1 intended to disable it |
| Minimum OS Version for Enforcement | Unknown — future Windows release |
| PowerShell Cmdlet (Set) | `Set-RuleOption -FilePath <xml> -Option 1` |
| PowerShell Cmdlet (Remove) | `Set-RuleOption -FilePath <xml> -Option 1 -Delete` |
| Risk if Misconstrued as Working | Critical — unmitigated boot-time bypass pathway |
| Documentation Status | Pre-registered in schema; enforcement pending |
