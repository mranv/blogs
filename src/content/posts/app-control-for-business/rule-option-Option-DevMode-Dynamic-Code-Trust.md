---
title: 'Developer Mode Dynamic Code Trust'
author: Anubhav Gain
pubDatetime: 2026-05-02T14:46:42.000Z
slug: app-control-rule-option-devmode-dynamic-code-trust
draft: false
featured: false
description: 'XML Token: Enabled:Developer Mode Dynamic Code Trust'
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
# Developer Mode Dynamic Code Trust

**Policy Rule Option:** (No numeric identifier)  
**XML Token:** `Enabled:Developer Mode Dynamic Code Trust`  
**Applies To:** User Mode Code Integrity (UMCI) — UWP / Windows App development workflows  
**Minimum OS:** Windows 10 version 1809 (RS5) / Windows Server 2019  

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Why It Exists](#2-why-it-exists)
3. [Visual Anatomy — Policy Evaluation Stack](#3-visual-anatomy--policy-evaluation-stack)
4. [How to Set It](#4-how-to-set-it)
5. [XML Representation](#5-xml-representation)
6. [Interaction with Other Options](#6-interaction-with-other-options)
7. [When to Enable vs Disable](#7-when-to-enable-vs-disable)
8. [Real-World Scenario — End-to-End Walkthrough](#8-real-world-scenario--end-to-end-walkthrough)
9. [What Happens If You Get It Wrong](#9-what-happens-if-you-get-it-wrong)
10. [Valid for Supplemental Policies](#10-valid-for-supplemental-policies)
11. [OS Version Requirements](#11-os-version-requirements)
12. [Summary Table](#12-summary-table)

---

## 1. What It Does

The **Enabled:Developer Mode Dynamic Code Trust** option instructs App Control for Business to extend dynamic code trust to UWP (Universal Windows Platform) applications that are being debugged through Visual Studio or deployed via the Windows Device Portal while the Windows Developer Mode setting is active on the system. In a standard App Control UMCI enforcement environment, dynamically generated code — including the code that UWP application frameworks generate and execute at debug-time — must meet the same signing and trust requirements as any other executable code. This creates a friction point for developers: when writing and iterating on UWP applications, the development toolchain relies on side-loading, debug-mode code generation, and Device Portal deployment flows that do not produce traditionally signed binaries. When this option is present in the policy and Windows Developer Mode is simultaneously enabled via Settings, App Control treats code generated in these specific UWP debugging contexts as trusted, allowing the development workflow to proceed without requiring full PKI signing of every debug build. This option is entirely dependent on the system-level Developer Mode toggle: if Developer Mode is off, the option has no effect even if it is present in the policy XML.

---

## 2. Why It Exists

### The Fundamental Tension: Security vs Developer Productivity

App Control for Business, in UMCI enforcement mode, is designed to ensure that only trusted, authorized code runs on a managed endpoint. This is an excellent security property for production workstations and servers. However, it creates a direct conflict with the needs of software developers building UWP applications:

**The development iteration loop requires:**
1. Write code in Visual Studio
2. Compile to a debug or test build (unsigned or developer-signed only)
3. Deploy the app to a local or remote test device
4. Attach debugger and observe runtime behavior
5. Modify code and repeat

Steps 2–4 involve code that is fundamentally different from production-signed software:
- Debug builds are typically signed with a developer test certificate, not a production code-signing certificate
- The Visual Studio debugger attaches to the process and generates additional code (debug shims, instrumentation)
- Device Portal deployment bypasses the Microsoft Store signing and distribution pipeline entirely
- The UWP app container generates dynamic code as part of its runtime execution model

### Why Standard UMCI Enforcement Breaks Development Workflows

Without this option, a developer working on a machine with App Control UMCI enforced faces these obstacles:

**Visual Studio Debugger Attachment:** When VS attaches to a UWP process, it generates native shim code for breakpoint handling and variable inspection. This code is generated dynamically and is not part of any signed binary. Under UMCI enforcement, this code would be blocked.

**Side-loading / Device Portal Deployment:** Developers frequently deploy test builds directly to devices for UI and hardware testing. These builds are signed with locally generated test certificates, not enterprise CA certificates or Microsoft Store certificates. App Control UMCI enforcement rejects them.

**Debug/Test Certificate Trust:** Visual Studio generates per-developer test certificates for package signing. These certificates are self-signed, not anchored to an enterprise PKI, and do not satisfy standard signer rules.

**F5 Deploy-and-Debug Cycle:** The "press F5 to run" workflow in Visual Studio for UWP projects involves a rapid sequence of: build, package, sign with test cert, deploy locally, launch in debug host, attach debugger. Every step of this sequence involves either unsigned code or test-signed code that would not pass UMCI enforcement.

### The Solution: Tie Trust to Developer Mode

Microsoft's solution is elegant: rather than requiring developers to maintain a separate, less-secure policy or continuously toggle App Control enforcement, the Developer Mode Dynamic Code Trust option ties the trust exception to the Windows Developer Mode setting. Developer Mode is a separate, explicit, administratively controlled toggle that:

1. Must be enabled by an administrator (or a user with appropriate privileges depending on MDM policy)
2. Signals that the device is in a development context where reduced security constraints are acceptable
3. Is visible in Windows Settings and auditable
4. Can be prevented or controlled via Group Policy and MDM (Intune)

When both the App Control option AND Developer Mode are active, the trust exception applies. When Developer Mode is off (the default on production systems), the option has zero effect — the policy behaves identically to a policy without this option. This means a single policy can be deployed to both developer machines and production machines, with behavior automatically adapting based on the Developer Mode state.

### What "Dynamic Code Trust" Means Here

The trust extended by this option is specifically:
- **UWP app debugging contexts** — code generated by the VS debugger and debug runtime for UWP app processes
- **Device Portal deployed packages** — apps deployed via the Windows Device Portal (`localhost:11443`) while in Developer Mode
- **Test-signed or developer-signed packages** — UWP packages signed with developer test certificates that would not otherwise satisfy UMCI signer rules

This is not a blanket exemption for all dynamic code. It is scoped to specific, identifiable development workflows that are gated behind the Developer Mode system state.

---

## 3. Visual Anatomy — Policy Evaluation Stack

### Where Developer Mode Dynamic Code Trust Operates

```mermaid
flowchart TD
    A["UWP App Code Load Request\n(Via VS Debugger or Device Portal)"]:::kernel
    B["Standard UMCI\nPolicy Evaluation Begins"]:::eval
    C["Authenticode Signature\nPresent and Valid?"]:::decision

    D["Normal Signer Rule\nEvaluation Path"]:::allow
    E["Unsigned / Test-Signed\n(Does not meet standard\nUMCI signer rules)"]:::warn

    F{"Developer Mode\nDynamic Code Trust\nOption Present in Policy?"}:::decision
    G{"Windows Developer Mode\nCurrently ENABLED?\n(Settings → Privacy &\nSecurity → For Developers)"}:::decision

    H["Trust Exception\nApplied for UWP Debug\nCode Generation Context"]:::allow
    I["Code Execution\nALLOWED\n(Developer Mode exception)"]:::allow
    J["Code Execution\nBLOCKED\n(No trust exception available)"]:::block
    K["Normal UMCI enforcement\nApply hash/attribute rules\nor deny"]:::eval

    A --> B --> C
    C -- Signed, trusted --> D --> I
    C -- Unsigned / test-signed --> E --> F

    F -- No --> K --> J
    F -- Yes --> G

    G -- Developer Mode ON --> H --> I
    G -- Developer Mode OFF --> K --> J

    classDef kernel fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef decision fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
```

### The Dual-Gate Architecture

```mermaid
flowchart LR
    subgraph Policy ["App Control Policy"]
        POption["Enabled:Developer Mode\nDynamic Code Trust\n(Option present in XML)"]:::eval
    end

    subgraph OS ["Windows System State"]
        DevMode["Windows Developer Mode\nSettings → Privacy & Security\n→ For Developers → On"]:::warn
    end

    subgraph Gate ["Trust Decision Gate"]
        AND{"BOTH conditions\nmust be true\nfor exception to apply"}:::decision
        Allow["UWP Debug Code\nTrusted and Allowed"]:::allow
        Deny["Standard UMCI\nenforcement applies"]:::block
    end

    POption --> AND
    DevMode --> AND
    AND -- Both TRUE --> Allow
    AND -- Either FALSE --> Deny

    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef decision fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
```

### Developer Mode System State in Windows Settings

```mermaid
flowchart TD
    Settings["Windows Settings\nPrivacy & Security"]:::eval
    ForDevs["For Developers"]:::eval
    DevModeToggle{"Developer Mode\nToggle"}:::decision

    subgraph DevModeON ["Developer Mode: ON"]
        Feature1["Device Portal enabled (port 11443)"]:::allow
        Feature2["Sideloading without Store enabled"]:::allow
        Feature3["SSH Server optionally available"]:::allow
        Feature4["App Control DevMode\nDynamic Code Trust ACTIVE"]:::allow
    end

    subgraph DevModeOFF ["Developer Mode: OFF (Default)"]
        Prod1["Standard system security"]:::block
        Prod2["Sideloading disabled"]:::block
        Prod3["App Control DevMode option\nhas ZERO effect"]:::block
    end

    Settings --> ForDevs --> DevModeToggle
    DevModeToggle -- ON --> DevModeON
    DevModeToggle -- OFF --> DevModeOFF

    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef decision fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
```

---

## 4. How to Set It

### Enable Developer Mode Dynamic Code Trust

```powershell
# The option is identified by its string token, not a numeric ID
# Use Set-RuleOption with the appropriate option value

# Note: The option token for this rule is listed differently in PowerShell
# Check the available options list to get the exact numeric value or use the string form

# Method 1: View all available options to confirm the token
(Get-Command Set-RuleOption).Parameters.Option.Attributes | 
    Where-Object { $_ -is [System.Management.Automation.ValidateSetAttribute] } |
    Select-Object -ExpandProperty ValidValues |
    Where-Object { $_ -like "*Developer*" -or $_ -like "*Dynamic*" }

# Method 2: Add the rule directly via XML manipulation (reliable approach)
$PolicyPath = "C:\Policies\DevPolicy.xml"
[xml]$Policy = Get-Content $PolicyPath

# Check if Rules element exists
$RulesNode = $Policy.SiPolicy.Rules
if (-not $RulesNode) {
    $RulesNode = $Policy.CreateElement("Rules", $Policy.DocumentElement.NamespaceURI)
    $Policy.SiPolicy.AppendChild($RulesNode) | Out-Null
}

# Add the Developer Mode Dynamic Code Trust rule
$NewRule = $Policy.CreateElement("Rule", $Policy.DocumentElement.NamespaceURI)
$NewOption = $Policy.CreateElement("Option", $Policy.DocumentElement.NamespaceURI)
$NewOption.InnerText = "Enabled:Developer Mode Dynamic Code Trust"
$NewRule.AppendChild($NewOption) | Out-Null
$RulesNode.AppendChild($NewRule) | Out-Null

$Policy.Save($PolicyPath)
Write-Host "Developer Mode Dynamic Code Trust option added to policy."

# Method 3: Via Set-RuleOption (if numeric option is available in your PS module version)
# Set-RuleOption -FilePath $PolicyPath -Option <check your module for the number>
```

### Remove (Disable) Developer Mode Dynamic Code Trust

```powershell
# Via XML manipulation
$PolicyPath = "C:\Policies\DevPolicy.xml"
[xml]$Policy = Get-Content $PolicyPath

$RulesToRemove = $Policy.SiPolicy.Rules.Rule | Where-Object {
    $_.Option -eq "Enabled:Developer Mode Dynamic Code Trust"
}

foreach ($Rule in $RulesToRemove) {
    $Policy.SiPolicy.Rules.RemoveChild($Rule) | Out-Null
}

$Policy.Save($PolicyPath)
Write-Host "Developer Mode Dynamic Code Trust option removed from policy."
```

### Verify Developer Mode State on Target System

```powershell
# Check if Developer Mode is currently enabled
$DevModeKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
$DevModeValue = Get-ItemProperty -Path $DevModeKey -Name "AllowDevelopmentWithoutDevLicense" -ErrorAction SilentlyContinue

if ($DevModeValue -and $DevModeValue.AllowDevelopmentWithoutDevLicense -eq 1) {
    Write-Host "Developer Mode: ENABLED" -ForegroundColor Yellow
    Write-Host "NOTE: DevMode Dynamic Code Trust option will be ACTIVE if present in policy"
} else {
    Write-Host "Developer Mode: DISABLED (default)" -ForegroundColor Green
    Write-Host "NOTE: DevMode Dynamic Code Trust option has NO EFFECT on this system"
}

# Also check via WMI for enterprise environments
try {
    $Setting = Get-CimInstance -Namespace root/StandardCimv2 -ClassName MSFT_DeviceGuard -ErrorAction Stop
    Write-Host "VBS / App Control state: $($Setting.VirtualizationBasedSecurityStatus)"
} catch {
    Write-Host "DeviceGuard WMI class not available: $_" -ForegroundColor Yellow
}
```

### Full Development Workstation Policy Setup

```powershell
# Build a policy suitable for development workstations
# where developers need the VS/Device Portal workflow

$DevPolicyPath   = "C:\Policies\DevWorkstation-Policy.xml"
$ProdPolicyPath  = "C:\Windows\schemas\CodeIntegrity\ExamplePolicies\DefaultWindows_Enforced.xml"
$OutputBinary    = "C:\Policies\DevWorkstation-Policy.p7b"

# Start from DefaultWindows enforced template
Copy-Item $ProdPolicyPath $DevPolicyPath

# Enable UMCI
Set-RuleOption -FilePath $DevPolicyPath -Option 0

# Enable Audit Mode for initial testing
Set-RuleOption -FilePath $DevPolicyPath -Option 3

# Enable Developer Mode Dynamic Code Trust
# (Safe on developer machines — gated by Developer Mode toggle)
# Add via XML as shown above, or use Set-RuleOption with correct option number

# Do NOT add Option 19 (Dynamic Code Security) to dev workstations
# if the development workflow requires unsigned dynamic code generation
# Set-RuleOption -FilePath $DevPolicyPath -Option 19  # OMIT for dev machines

# Compile to binary
ConvertFrom-CIPolicy -XmlFilePath $DevPolicyPath -BinaryFilePath $OutputBinary

Write-Host "Development workstation policy compiled: $OutputBinary"
Write-Host "Deploy to: C:\Windows\System32\CodeIntegrity\SIPolicy.p7b"
Write-Host ""
Write-Host "Remember: The Developer Mode exception only activates when:"
Write-Host "  1. This policy option is present (check: yes)"
Write-Host "  2. Developer Mode is ON in Windows Settings"
```

---

## 5. XML Representation

### Option in Policy XML

```xml
<Rules>
  <Rule>
    <Option>Enabled:Developer Mode Dynamic Code Trust</Option>
  </Rule>
</Rules>
```

### Full Development Workstation Policy Context

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Base Policy">
  <VersionEx>10.0.0.0</VersionEx>
  <PolicyTypeID>{E79E3A2C-90D7-4A76-843E-57F5A22F4D88}</PolicyTypeID>
  <PlatformID>{2E07F7E4-194C-4D20-B96C-1253577D5412}</PlatformID>
  <Rules>
    <Rule>
      <Option>Enabled:UMCI</Option>
    </Rule>
    <!-- Developer Mode Dynamic Code Trust:
         Allows UWP debug/Device Portal workflows when Developer Mode is ON.
         Has NO EFFECT when Developer Mode is OFF. -->
    <Rule>
      <Option>Enabled:Developer Mode Dynamic Code Trust</Option>
    </Rule>
    <!-- Note: Option 19 (Dynamic Code Security) intentionally omitted
         for developer workstations, as it would conflict with
         VS debugging workflows even with DevMode trust enabled. -->
    
    <Rule>
      <Option>Required:Enforce Store Applications</Option>
    </Rule>
  </Rules>

  <EKUs />

  <FileRules>
  </FileRules>

  <Signers>
  </Signers>

  <SigningScenarios>
    <SigningScenario Value="12" ID="ID_SIGNINGSCENARIO_WINDOWS" FriendlyName="User Mode">
    </SigningScenario>
  </SigningScenarios>
</SiPolicy>
```

---

## 6. Interaction with Other Options

### Compatibility Matrix

| Option | Name | Relationship with DevMode Dynamic Code Trust |
|--------|------|----------------------------------------------|
| 0 | Enabled:UMCI | **Context prerequisite.** DevMode trust applies within the UMCI enforcement context. |
| 3 | Enabled:Audit Mode | **Compatible.** Use audit mode to test the development workflow without full enforcement. DevMode trust respects audit mode. |
| 7 | Enabled:Unsigned System Integrity Policy | **Orthogonal.** Controls policy signing; does not affect DevMode dynamic code trust. |
| 9 | Enabled:Advanced Boot Options Menu | **Orthogonal.** Boot-time feature; unrelated to UWP debug trust. |
| 11 | Disabled:Script Enforcement | **Orthogonal.** Script enforcement is separate from UWP app dynamic code trust. |
| 14 | Enabled:Lifetime WHQL Only | **Orthogonal.** Kernel driver signing; unrelated to UWP user-mode context. |
| 19 | Enabled:Dynamic Code Security | **Potentially conflicting.** Option 19 enforces policy on .NET dynamic code even in audit mode. For UWP developers using .NET, enabling both Option 19 AND DevMode Dynamic Code Trust may still block .NET dynamic code generated by debug builds, depending on the specific code paths. Test thoroughly. |
| 20 | Enabled:Revoked Expired As Unsigned | **Orthogonal but relevant.** Dev test certificates are typically not revoked; Option 20 primarily affects production PKI scenarios. No direct conflict. |

### Interaction Diagram

```mermaid
flowchart TD
    O0["Option 0\nEnabled:UMCI\n(PREREQUISITE)"]:::require
    O3["Option 3\nAudit Mode\n(Safe for initial\ndevmode policy testing)"]:::allow
    O19["Option 19\nDynamic Code Security\n(May conflict with .NET\nUWP debug workflows)"]:::block
    ODev["DevMode Dynamic\nCode Trust"]:::eval
    DevModeState["Windows Developer Mode\nSystem Setting\n(Must be ON for this\noption to have effect)"]:::warn

    O0 --> |"UMCI context\nrequired"| ODev
    O3 --> |"Audit mode\ncompatible"| ODev
    O19 -. "Potential conflict:\n.NET dynamic code in\nUWP debug context\nmay still be blocked\nby Option 19" .-> ODev
    DevModeState --> |"Runtime gate:\nBOTH must be active\nfor trust exception"| ODev

    classDef require fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
```

---

## 7. When to Enable vs Disable

```mermaid
flowchart TD
    Start["Evaluating DevMode\nDynamic Code Trust\nfor Your Environment"]:::eval

    Q1{"Is this a developer\nworkstation used for\nUWP / Windows app\ndevelopment?"}:::decision
    Q2{"Do developers need to\nuse Visual Studio debugger\nattachment or Device Portal\ndeployment workflows?"}:::decision
    Q3{"Is Windows Developer\nMode controlled and\nmonitored (MDM/GPO)?"}:::decision
    Q4{"Is the production workstation\nor server environment?"}:::decision
    Q5{"Are you testing or\nvalidating an existing\ndevelopment workflow?"}:::decision

    Enable["ENABLE DevMode Dynamic\nCode Trust\nPaired with Developer Mode\nMDM controls for governance"]:::allow
    EnableWithGovernance["ENABLE with governance:\nEnsure Developer Mode is\nMDM-controlled and not\nenabled on production devices"]:::warn
    Disable["DO NOT add this option\nProduction environments:\nDeveloper Mode should be OFF\nOption has no effect anyway,\nbut adding it signals wrong\npolicy intent"]:::block
    Omit["OMIT this option\nNot needed for server\nor non-UWP workflows"]:::block

    Start --> Q1
    Q1 -- No --> Q4
    Q1 -- Yes --> Q2
    Q2 -- No --> Omit
    Q2 -- Yes --> Q3
    Q3 -- Yes (MDM controlled) --> Enable
    Q3 -- No (uncontrolled) --> EnableWithGovernance
    Q4 -- Yes (production) --> Disable
    Q4 -- No --> Q5
    Q5 -- Yes --> Enable
    Q5 -- No --> Omit

    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef decision fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
```

### Deployment Strategy by Device Tier

```mermaid
flowchart LR
    subgraph ProductionServers ["Production Servers"]
        PS_Policy["Base UMCI Policy\nOption 19: Enabled\nOption 20: Enabled\nDevMode Trust: ABSENT"]:::block
        PS_DevMode["Developer Mode:\nDISABLED (MDM enforced)"]:::block
    end

    subgraph ProductionWorkstations ["Production Workstations"]
        PW_Policy["Base UMCI Policy\nOption 19: Enabled\nDevMode Trust: ABSENT\nor present but inert"]:::block
        PW_DevMode["Developer Mode:\nDISABLED (MDM enforced)"]:::block
    end

    subgraph DevWorkstations ["Developer Workstations"]
        DW_Policy["Dev UMCI Policy\nOption 19: Omitted\nDevMode Trust: PRESENT"]:::allow
        DW_DevMode["Developer Mode:\nON (controlled, monitored)"]:::warn
    end

    subgraph TestLab ["Test / QA Lab Devices"]
        TL_Policy["Test UMCI Policy\nAudit Mode: Enabled\nDevMode Trust: PRESENT"]:::eval
        TL_DevMode["Developer Mode:\nON (lab only)"]:::warn
    end

    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
```

---

## 8. Real-World Scenario — End-to-End Walkthrough

### Scenario A: Developer Debugging a UWP App on a Managed Workstation

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant VS as Visual Studio 2022
    participant OS as Windows (Developer Mode ON)
    participant CI as ci.dll + App Control Policy
    participant UWP as UWP App Process

    Note over Dev,UWP: Setup — App Control policy with DevMode Dynamic Code Trust deployed

    Dev->>OS: Enable Developer Mode\n(Settings → Privacy & Security → For Developers)
    OS-->>Dev: Developer Mode: ON\nDevice Portal started on localhost:11443

    Note over Dev,UWP: Development Iteration Cycle

    Dev->>VS: Write UWP app code (C# / XAML)
    VS->>VS: Build → Debug build (test-signed package)
    Note over VS: Package signed with VS developer test certificate
    Note over VS: Certificate is self-signed, not in enterprise PKI

    VS->>OS: F5 Deploy: install test package via side-loading
    OS->>CI: Load package — check UMCI policy

    CI->>CI: Evaluate package signature
    CI->>CI: Test cert not in standard signer rules
    CI->>CI: Check: DevMode Dynamic Code Trust option present?
    CI->>CI: Check: Developer Mode currently ON?
    Note over CI: BOTH conditions TRUE — apply trust exception

    CI-->>OS: ALLOW — UWP test package trusted in Developer Mode context
    OS->>UWP: Launch UWP app process

    VS->>UWP: Attach debugger
    UWP->>CI: Debugger generates shim code for breakpoints
    CI->>CI: Developer Mode trust exception still active
    CI-->>UWP: Debugger code allowed

    Dev->>VS: Set breakpoint — hit breakpoint — inspect variables
    Dev->>VS: Modify code — rebuild

    Note over Dev,UWP: Policy protects production while enabling dev workflow

    Dev->>OS: Disable Developer Mode when debugging complete
    OS-->>Dev: Developer Mode: OFF
    Note over CI: DevMode Dynamic Code Trust option now INERT\nFull UMCI enforcement restored
```

### Scenario B: Device Portal Deployment for Hardware Testing

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Browser as Web Browser
    participant Portal as Windows Device Portal\n(localhost:11443)
    participant OS as Windows System
    participant CI as ci.dll + App Control
    participant App as Deployed UWP App

    Note over Dev,App: Scenario: Testing UWP app on test device with App Control

    Dev->>Browser: Navigate to https://localhost:11443\n(Windows Device Portal)
    Browser->>Portal: Access Device Portal (requires Developer Mode ON)
    Portal-->>Browser: Device Portal Dashboard

    Dev->>Portal: Upload .appx package (test-signed, unsigned by enterprise PKI)
    Portal->>OS: Initiate package installation
    OS->>CI: Evaluate package for UMCI policy

    alt DevMode Dynamic Code Trust PRESENT + Developer Mode ON
        CI->>CI: Standard signer rules — test cert not matched
        CI->>CI: DevMode Dynamic Code Trust: YES
        CI->>CI: Developer Mode ON: YES
        CI-->>OS: ALLOW installation
        OS->>App: Install and run test package
        App-->>Dev: App running — hardware test can proceed
        Note over Dev: Successful test deployment via Device Portal
    else DevMode Dynamic Code Trust ABSENT or Developer Mode OFF
        CI->>CI: Standard signer rules — test cert not matched
        CI->>CI: DevMode trust: NOT available
        CI-->>OS: DENY — package blocked by UMCI policy
        OS-->>Browser: Installation failed — 0x800700C1 (not a valid Win32 application)\nor similar error
        Dev-->>Dev: Test deployment blocked — must sign with enterprise PKI\nor disable App Control
        Note over Dev: Developer blocked from iterating — productivity impact
    end
```

### Scenario C: MDM-Controlled Developer Mode on Enterprise Fleet

```mermaid
sequenceDiagram
    participant MDM as Intune / MDM Admin
    participant Policy as App Control Policy
    participant DevDevice as Developer Workstation
    participant ProdDevice as Production Workstation
    participant CI as ci.dll

    Note over MDM,CI: Enterprise Deployment Strategy

    MDM->>Policy: Deploy App Control policy WITH DevMode Dynamic Code Trust
    MDM->>DevDevice: MDM policy: Allow Developer Mode (./Vendor/MSFT/Policy/Config/ApplicationManagement/AllowDeveloperUnlock = 1)
    MDM->>ProdDevice: MDM policy: Block Developer Mode (AllowDeveloperUnlock = 0)

    Note over DevDevice: Developer Workstation
    DevDevice->>DevDevice: Developer enables Developer Mode in Settings (allowed by MDM)
    DevDevice->>CI: UWP debug session starts
    CI->>CI: DevMode Trust option: PRESENT
    CI->>CI: Developer Mode: ON (permitted by MDM)
    CI-->>DevDevice: Debug workflow ALLOWED

    Note over ProdDevice: Production Workstation
    ProdDevice->>ProdDevice: User attempts to enable Developer Mode
    ProdDevice-->>ProdDevice: BLOCKED by MDM policy — Developer Mode cannot be enabled

    ProdDevice->>CI: Any code load request
    CI->>CI: DevMode Trust option: PRESENT in policy (same policy)
    CI->>CI: Developer Mode: OFF (MDM blocked it)
    CI-->>ProdDevice: Standard UMCI enforcement applies — DevMode exception NOT active
    Note over ProdDevice: Production security maintained despite DevMode option in policy

    MDM->>MDM: Audit report: which devices have Developer Mode enabled
    Note over MDM: Governance: only approved developer devices can enable Developer Mode
```

---

## 9. What Happens If You Get It Wrong

### Enabling This Option Without MDM Control of Developer Mode

```mermaid
flowchart TD
    Mistake1["Deploy policy with\nDevMode Dynamic Code Trust\nwithout MDM controls\non Developer Mode"]:::warn

    Risk1["Any end user can enable\nDeveloper Mode in Settings\nand thereby activate the\ntrust exception"]:::block
    Risk2["Malicious insider or compromised\nuser account: enable Developer Mode\n→ App Control UMCI exceptions\nactivate for UWP debug workflows"]:::block
    Risk3["Social engineering attack:\nTrick user into enabling\nDeveloper Mode 'for a feature'\n→ Attacker delivers unsigned\nUWP payload via side-loading"]:::block
    Risk4["IT compliance failure:\nApp Control deployment logged\nas 'present' but security team\nunaware that Developer Mode\ncould activate exceptions"]:::block

    Remediation1["Remediation:\n1. Implement MDM policy to\n   control AllowDeveloperUnlock\n2. Allow only on approved\n   developer devices\n3. Monitor Developer Mode state\n   via MDM compliance reports\n4. Alert on unexpected\n   Developer Mode activation"]:::allow

    Mistake1 --> Risk1 & Risk2 & Risk3 & Risk4 --> Remediation1

    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
```

### Leaving This Option in Production Policies

```mermaid
flowchart TD
    Mistake2["Policy with DevMode Dynamic\nCode Trust deployed to\nproduction servers and\nworkstations unintentionally"]:::warn

    Consequence1["On production systems:\nDeveloper Mode is OFF (good)\nOption has NO EFFECT (ok)\nBut policy intent is muddied"]:::warn
    Consequence2["If a production system\nhas Developer Mode\naccidentally enabled:\nTrust exception activates\nunexpectedly"]:::block
    Consequence3["Security audit finding:\nPolicy contains DevMode exception\nAuditor questions intent\nCompliance review required"]:::warn
    Consequence4["False sense of security:\nAdmins believe production\nis fully hardened but\nthe exception path exists"]:::block

    BestPractice["Best Practice:\nMaintain SEPARATE policies\nfor developer workstations\nvs production systems.\nDevMode option belongs only\nin developer-tier policies."]:::allow

    Mistake2 --> Consequence1 & Consequence2 & Consequence3 & Consequence4 --> BestPractice

    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
```

### Enabling Option 19 (Dynamic Code Security) Alongside This Option on Developer Machines

This pairing requires careful consideration:

```mermaid
flowchart TD
    Conflict["Policy has BOTH:\nOption 19: Dynamic Code Security\nAND DevMode Dynamic Code Trust"]:::warn

    Scenario1["Developer Mode: ON\nUWP app debug session"]:::eval
    Scenario2[".NET UWP app uses\nReflection.Emit or\ndynamic compilation"]:::eval

    Gate1{"DevMode Dynamic\nCode Trust applies\nto UWP package loading?"}:::decision
    Gate2{"Option 19 also\nblocks dynamic .NET\ncode within that process?"}:::decision

    Result1["UWP package loads\n(DevMode exception applies\nto package-level trust)"]:::allow
    Result2["In-process .NET dynamic\ncode still BLOCKED\n(Option 19 has no DevMode\nexception path)"]:::block
    Result3["Developer sees: App loads\nbut crashes when scripting\nor plugin system activates"]:::warn

    Conflict --> Scenario1 & Scenario2
    Scenario1 --> Gate1 -- Yes --> Result1
    Scenario2 --> Gate2 -- Yes --> Result2
    Result1 --> Result3
    Result2 --> Result3

    Advice["Recommendation:\nOn developer workstations:\n- Include DevMode Dynamic Code Trust\n- OMIT Option 19 (Dynamic Code Security)\nOn production:\n- Include Option 19\n- Omit or make inert DevMode trust\n  (Developer Mode off via MDM)"]:::allow

    Result3 --> Advice

    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef eval fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef decision fill:#1a1a0d,color:#fde68a,stroke:#78716c
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#991b1b
```

---

## 10. Valid for Supplemental Policies

**No.** Developer Mode Dynamic Code Trust is not valid for supplemental policies.

This restriction exists for the following reasons:

1. **Enforcement model coherence:** The trust exception tied to Developer Mode is a fundamental behavioral change in how the policy evaluates code loading in specific runtime contexts. This must be established at the base policy level, not layered on via supplemental extensions.

2. **Security boundary:** Allowing a supplemental policy to introduce Developer Mode trust exceptions would mean that deploying a supplemental policy to a production machine could inadvertently open a trust exception — even on machines where the base policy was deliberately hardened without this option.

3. **Developer Mode governance:** Because the effectiveness of this option depends entirely on the Developer Mode system state, and because Developer Mode control should be a deliberate, governed decision (ideally via MDM), it belongs in the base policy where IT administrators have explicit visibility and control.

4. **Consistent with other behavioral options:** Like Options 19 and 20, this option changes the fundamental trust evaluation model rather than adding specific file or signer rules. Such behavioral options are consistently restricted to base policies in App Control's design.

---

## 11. OS Version Requirements

| Platform | Minimum Version | Notes |
|----------|----------------|-------|
| Windows 10 | Version 1809 (RS5, October 2018 Update) | Build 17763 — aligns with UWP tooling maturity and Device Portal improvements |
| Windows 11 | All versions | Fully supported; Developer Mode controls in Settings redesigned but functionally equivalent |
| Windows Server 2019 | Supported | Server with Desktop Experience only — Server Core has limited UWP support |
| Windows Server 2022 | Supported | Desktop Experience; Server Core UWP support limited |
| Windows 10 < 1809 | Not recommended | Feature may be absent or behave inconsistently; UWP debugging toolchain also less mature |

### Checking Developer Mode Availability and State

```powershell
# Comprehensive Developer Mode state check
function Get-DeveloperModeState {
    $Results = [ordered]@{}

    # Registry-based check
    $RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
    $RegValue = Get-ItemProperty -Path $RegPath -Name "AllowDevelopmentWithoutDevLicense" -ErrorAction SilentlyContinue
    $Results["DeveloperModeEnabled"]     = ($RegValue -and $RegValue.AllowDevelopmentWithoutDevLicense -eq 1)

    # MDM control check
    $MDMPath = "HKLM:\SOFTWARE\Microsoft\PolicyManager\current\device\ApplicationManagement"
    $MDMValue = Get-ItemProperty -Path $MDMPath -Name "AllowDeveloperUnlock" -ErrorAction SilentlyContinue
    $Results["MDMControlled"]            = ($null -ne $MDMValue)
    $Results["MDMAllowsDeveloperMode"]   = ($MDMValue -and $MDMValue.AllowDeveloperUnlock -eq 1)

    # Device Portal service state
    $DevPortal = Get-Service -Name "DevQueryBroker" -ErrorAction SilentlyContinue
    $Results["DevicePortalServiceState"] = if ($DevPortal) { $DevPortal.Status } else { "Service not found" }

    # OS version
    $OS = Get-CimInstance Win32_OperatingSystem
    $Results["OSBuildNumber"]            = [int]$OS.BuildNumber
    $Results["MinimumBuildForOption"]    = 17763
    $Results["OSMeetsMinimum"]           = ([int]$OS.BuildNumber -ge 17763)

    return $Results
}

$State = Get-DeveloperModeState
$State | Format-List

if ($State["DeveloperModeEnabled"]) {
    Write-Host "ADVISORY: Developer Mode is currently ENABLED on this system." -ForegroundColor Yellow
    Write-Host "If App Control policy includes DevMode Dynamic Code Trust, the exception is ACTIVE." -ForegroundColor Yellow
    if (-not $State["MDMControlled"]) {
        Write-Host "WARNING: Developer Mode is NOT MDM-controlled. User can toggle it." -ForegroundColor Red
    }
} else {
    Write-Host "Developer Mode: DISABLED. DevMode Dynamic Code Trust option is inert." -ForegroundColor Green
}
```

---

## 12. Summary Table

| Property | Value |
|----------|-------|
| **Option Identifier** | No numeric ID — string token only |
| **XML Token** | `Enabled:Developer Mode Dynamic Code Trust` |
| **Policy Type** | UMCI (User Mode Code Integrity) |
| **Default State** | Disabled (not present in default policy templates) |
| **Dual-Gate Requirement** | Option must be in policy AND Windows Developer Mode must be ON — BOTH required |
| **Effect When Developer Mode OFF** | No effect whatsoever — standard UMCI enforcement applies fully |
| **Audit Mode Behavior** | Respects Audit Mode (Option 3) when Developer Mode is ON — produces Event ID 3076 |
| **Supplemental Policy Valid** | No |
| **Prerequisite** | Option 0 (Enabled:UMCI); Windows Developer Mode system setting |
| **Minimum OS (Client)** | Windows 10 version 1809 (Build 17763) |
| **Minimum OS (Server)** | Windows Server 2019 (Desktop Experience) |
| **Scope of Trust Exception** | UWP apps debugged in Visual Studio; apps deployed via Windows Device Portal |
| **What It Does NOT Trust** | General unsigned Win32 executables; non-UWP .NET dynamic code (see Option 19 interaction) |
| **PowerShell — Enable** | XML manipulation: set `<Option>Enabled:Developer Mode Dynamic Code Trust</Option>` |
| **PowerShell — Disable** | Remove the Rule element containing this token |
| **Developer Mode MDM CSP** | `./Vendor/MSFT/Policy/Config/ApplicationManagement/AllowDeveloperUnlock` |
| **Registry Key (Developer Mode)** | `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock\AllowDevelopmentWithoutDevLicense` |
| **Governance Requirement** | MDM control of Developer Mode strongly recommended; without it, any user can activate the exception |
| **Recommended Use** | Developer workstation policies only; separate from production policies |
| **Risk if Misdeployed to Production** | If Developer Mode enabled on a production machine, unsigned UWP debug code gains trust — potential attack vector |
| **Risk if Omitted on Dev Machines** | VS debugger and Device Portal deployment workflows blocked; developer productivity severely impacted |
| **Compatible With Option 19** | Use with caution — Option 19 may still block in-process .NET dynamic code even with DevMode trust active |
| **Best Practice Policy Architecture** | Maintain separate DEVELOPER and PRODUCTION policy sets with this option only in developer-tier policies |
