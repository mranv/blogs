---
title: 'Option 5 — Enabled:Inherit Default Policy'
author: Anubhav Gain
pubDatetime: 2026-05-03T10:00:00.000Z
slug: rule-option-option-05-inherit-default-policy
draft: false
featured: false
description: 'XML Value: <Rule><Option>Enabled:Inherit Default Policy</Option></Rule>'
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
# Option 5 — Enabled:Inherit Default Policy

**Policy Rule Option Index:** 5  
**XML Value:** `<Rule><Option>Enabled:Inherit Default Policy</Option></Rule>`  
---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Why It Exists](#2-why-it-exists)
3. [Visual Anatomy — Policy Evaluation Stack](#3-visual-anatomy--policy-evaluation-stack)
4. [How to Set It (PowerShell)](#4-how-to-set-it-powershell)
5. [XML Representation](#5-xml-representation)
6. [Interaction with Other Options](#6-interaction-with-other-options)
7. [When to Enable vs Disable](#7-when-to-enable-vs-disable)
8. [Real-World Scenario / End-to-End Walkthrough](#8-real-world-scenario--end-to-end-walkthrough)
9. [What Happens If You Get It Wrong](#9-what-happens-if-you-get-it-wrong)
10. [Valid for Supplemental Policies?](#10-valid-for-supplemental-policies)
11. [OS Version Requirements](#11-os-version-requirements)
12. [Summary Table](#12-summary-table)

---

## 1. What It Does

Option 5, **Enabled:Inherit Default Policy**, is a placeholder rule option that is reserved for future use by Microsoft. As of current Windows releases, enabling or omitting this option produces **no observable change** in policy enforcement behavior. The kernel-mode code-integrity engine (CI.dll / WDAC enforcement layer) reads this bit from the policy XML but takes no action on it. Its presence in a policy file is syntactically valid and will not cause parsing errors, but it does not alter allow/deny decisions, signing requirements, boot-time behavior, or any other enforcement outcome. Despite its current no-op status, the option is documented and tested by Windows because it is expected to carry semantics in a future OS release, and its position in the option bitmask is already reserved so that no other option can inadvertently claim that slot.

---

## 2. Why It Exists

### The Reservation Pattern in WDAC Policy Design

App Control for Business (formerly WDAC) policy rule options are encoded as a compact bitmask inside the policy binary. Microsoft follows a conservative extension model: before a new behavioral option is shipped to end-users, the bit position is claimed and documented in advance so that:

1. **Policy files authored today remain forward-compatible.** When the OS eventually implements the behavior, existing policies that already set the flag will automatically gain the new capability without re-authoring.
2. **Policy tooling (ConfigCI, WDAC Wizard, Intune) can expose the option early** so administrators can learn about it and plan deployment before the feature lands.
3. **Interoperability with pre-release builds is preserved.** Windows Insider / Preview channels may implement the flag earlier; reservation ensures production policies can be tested on those builds.

The conceptual intent suggested by the name — *inherit from a default policy* — points toward a future model where a supplemental policy can explicitly delegate evaluation back to the default base policy for a given signer or path, rather than adding its own rules on top. This would allow a supplemental policy to say "use whatever the base says here" rather than remaining silent (which already causes fall-through to the base). The exact semantics remain unspecified in public documentation.

---

## 3. Visual Anatomy — Policy Evaluation Stack

The diagram below shows where Option 5 is positioned in the full WDAC evaluation chain. Because it currently has no effect, the option bit is read and then immediately bypassed by the enforcement engine.

```mermaid
flowchart TD
    A([Binary/Script Execution Request]) --> B[Kernel CI.dll intercepts]
    B --> C{Active Policies\nEnumerated}
    C --> D[Base Policy Loaded]
    C --> E[Supplemental Policies Loaded]
    D --> F[Parse Rule Options Bitmask]
    E --> F
    F --> G{Option 5 bit set?}
    G -- "Yes (bit reserved)" --> H["Read bit\n— no action taken —"]
    G -- "No" --> H
    H --> I[Evaluate Signer Rules]
    I --> J[Evaluate Hash Rules]
    J --> K[Evaluate Path Rules]
    K --> L{Allow / Deny\nDecision}
    L -- Allow --> M([Execution Proceeds])
    L -- Deny --> N([Block + Audit Event 3077/3076])

    style A fill:#162032,color:#58a6ff
    style B fill:#162032,color:#58a6ff
    style C fill:#162032,color:#58a6ff
    style D fill:#0d1f12,color:#86efac
    style E fill:#0d1f12,color:#86efac
    style F fill:#162032,color:#58a6ff
    style G fill:#1a1a0d,color:#fde68a
    style H fill:#1a1a0d,color:#fde68a
    style I fill:#162032,color:#58a6ff
    style J fill:#162032,color:#58a6ff
    style K fill:#162032,color:#58a6ff
    style L fill:#1a1a0d,color:#fde68a
    style M fill:#0d1f12,color:#86efac
    style N fill:#1f0d0d,color:#fca5a5
```

**Key takeaway:** The option bit is read during policy parsing (step F → G) but the decision node H is a dead branch — both paths converge to the same next step.

---

## 4. How to Set It (PowerShell)

The standard ConfigCI cmdlets `Set-RuleOption` and `Remove-RuleOption` operate on the policy XML file. The option index for **Enabled:Inherit Default Policy** is **5**.

### Enable Option 5

```powershell
# Enable:Inherit Default Policy on a base policy
Set-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 5

# Enable on a supplemental policy
Set-RuleOption -FilePath "C:\Policies\MySupplementalPolicy.xml" -Option 5
```

### Disable / Remove Option 5

```powershell
# Remove the option (return to default — absent from XML)
Remove-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 5
```

### Verify Current State

```powershell
# Read back all options present in a policy file
[xml]$policy = Get-Content "C:\Policies\MyBasePolicy.xml"
$policy.SiPolicy.Rules.Rule | Select-Object -ExpandProperty Option
```

### Full Scripted Example with Conversion

```powershell
$policyPath   = "C:\Policies\MyBasePolicy.xml"
$binaryOutput = "C:\Policies\MyBasePolicy.p7b"

# 1. Set option 5 (reserved, no current effect)
Set-RuleOption -FilePath $policyPath -Option 5

# 2. Confirm it was written
$xml = [xml](Get-Content $policyPath)
$opts = $xml.SiPolicy.Rules.Rule | Select-Object -ExpandProperty Option
Write-Host "Active options: $($opts -join ', ')"

# 3. Compile to binary
ConvertFrom-CIPolicy -XmlFilePath $policyPath -BinaryFilePath $binaryOutput

# 4. (Optional) Deploy via CiTool
CiTool --update-policy $binaryOutput
```

> **Note:** Because this option currently has no runtime effect, steps 1–2 are purely administrative. The compiled binary will contain the bit, but the enforcement engine will ignore it.

---

## 5. XML Representation

### Option Present in Policy XML

When Option 5 is set via `Set-RuleOption`, the following element appears inside the `<Rules>` block of the policy XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy"
          PolicyType="Base Policy">

  <VersionEx>10.0.0.0</VersionEx>
  <PolicyTypeID>{A244370E-44C9-4C06-B551-F6016E563076}</PolicyTypeID>
  <PlatformID>{2E07F7E4-194C-4D20-B96C-1498069CCC11}</PlatformID>

  <Rules>
    <Rule>
      <Option>Enabled:Inherit Default Policy</Option>
    </Rule>
    <Rule>
      <Option>Enabled:Unsigned System Integrity Policy</Option>
    </Rule>
  </Rules>

</SiPolicy>
```

### Option Absent from Policy XML

When the option is not set (the default state), the `<Rule>` element for Option 5 simply does not appear. There is no explicit "disabled" element; absence equals disabled.

### Bitmask Position

Inside the compiled binary (`.p7b` / `.bin`), policy rule options are stored as a 32-bit flags field. Option 5 occupies **bit position 5** (0-indexed from the LSB). Its hex mask value is `0x00000020`.

---

## 6. Interaction with Other Options

Because Option 5 currently has no effect, it does not conflict with or depend on any other option. The interaction diagram below is provided to show its **intended future relationship** based on its name and position in the option set.

```mermaid
graph LR
    O5["Option 5\nInherit Default Policy\n(Reserved)"]
    O6["Option 6\nUnsigned System\nIntegrity Policy"]
    O13["Option 13\nManaged Installer"]
    O14["Option 14\nIntelligent Security Graph\n(ISG)"]
    O17["Option 17\nRequired: WHQL"]
    BASE["Base Policy"]
    SUPP["Supplemental Policy"]

    O5 -. "Future: delegate\nevaluation to base?" .-> BASE
    SUPP -. "Future: may use O5\nto reference base rules" .-> O5
    O5 -. "No current conflict" .-> O6
    O5 -. "No current conflict" .-> O13
    O5 -. "No current conflict" .-> O14
    O5 -. "No current conflict" .-> O17

    style O5 fill:#1a1a0d,color:#fde68a
    style O6 fill:#162032,color:#58a6ff
    style O13 fill:#162032,color:#58a6ff
    style O14 fill:#162032,color:#58a6ff
    style O17 fill:#162032,color:#58a6ff
    style BASE fill:#0d1f12,color:#86efac
    style SUPP fill:#1c1c2e,color:#a5b4fc
```

### Compatibility Matrix

| Option | Name | Conflicts with O5? | Notes |
|--------|------|--------------------|-------|
| 0 | Enabled:UMCI | No | Orthogonal |
| 1 | Enabled:Boot Menu Protection | No | Orthogonal |
| 2 | Required:WHQL | No | Orthogonal |
| 3 | Enabled:Audit Mode | No | Orthogonal |
| 4 | Disabled:Flight Signing | No | Orthogonal |
| 6 | Enabled:Unsigned System Integrity Policy | No | Orthogonal |
| 7 | Allowed:Debug Policy Augmented | No | Orthogonal |
| 8 | Required:EV Signers | No | Orthogonal |
| 9 | Enabled:Advanced Boot Options Menu | No | Orthogonal |
| 10 | Enabled:Boot Audit On Failure | No | Orthogonal |
| 11 | Disabled:Script Enforcement | No | Orthogonal |
| 12 | Required:Enforce Store Applications | No | Orthogonal |
| 13 | Enabled:Managed Installer | No | Orthogonal |
| 14 | Enabled:Intelligent Security Graph | No | Orthogonal |

---

## 7. When to Enable vs Disable

```mermaid
flowchart TD
    START([Configuring a new policy]) --> Q1{Do you need\nforward-compat with\nfuture Windows\nfeatures?}
    Q1 -- Yes --> Q2{Is your org on\nWindows Insider or\nearly-access programs?}
    Q2 -- Yes --> ENABLE[Set Option 5\nSet-RuleOption ... -Option 5]
    Q2 -- No --> Q3{Are you writing\na supplemental policy\nthat may inherit\nbase rules someday?}
    Q3 -- Yes --> ENABLE
    Q3 -- No --> Q4{Do you prefer\nminimal / clean\npolicy XML?}
    Q4 -- Yes --> OMIT[Omit Option 5\nRemove-RuleOption ... -Option 5\nor just don't set it]
    Q4 -- No --> ENABLE
    Q1 -- No --> OMIT

    ENABLE --> RESULT_E([Option present in XML\nNo runtime effect today\nForward-ready])
    OMIT --> RESULT_O([Option absent from XML\nNo runtime effect today\nClean policy])

    style START fill:#162032,color:#58a6ff
    style Q1 fill:#1a1a0d,color:#fde68a
    style Q2 fill:#1a1a0d,color:#fde68a
    style Q3 fill:#1a1a0d,color:#fde68a
    style Q4 fill:#1a1a0d,color:#fde68a
    style ENABLE fill:#0d1f12,color:#86efac
    style OMIT fill:#1c1c2e,color:#a5b4fc
    style RESULT_E fill:#0d1f12,color:#86efac
    style RESULT_O fill:#1c1c2e,color:#a5b4fc
```

**Recommendation:** In production environments today, **omit this option**. The only reason to explicitly set it is if your organization is running Windows Insider builds where Microsoft may have begun implementing its behavior, or if you want to future-proof policy authoring pipelines.

---

## 8. Real-World Scenario / End-to-End Walkthrough

### Scenario: Enterprise Prepares Policies for an Upcoming Windows Feature Release

An enterprise security team receives a preview of an upcoming Windows feature that will use Option 5 to allow supplemental policies to explicitly inherit rules from the base. They decide to pre-stage their supplemental policies with the flag set so that, when the OS update ships, no policy re-deployment is needed.

```mermaid
sequenceDiagram
    actor Admin as Security Admin
    participant VS as WDAC Wizard / ConfigCI
    participant GIT as Policy Git Repo
    participant INTUNE as Microsoft Intune
    participant OS as Windows 11 (Insider)
    participant CI as CI.dll (Enforcement)

    Admin->>VS: Create supplemental policy for LOB apps
    VS->>VS: Generate XML with standard rules
    Admin->>VS: Set-RuleOption -Option 5 (future-compat)
    VS->>GIT: Commit policy XML with Option 5 present
    GIT->>Admin: PR approved, policy tagged v1.2

    Admin->>VS: ConvertFrom-CIPolicy → .p7b binary
    Admin->>INTUNE: Upload .p7b as Custom OMA-URI
    INTUNE->>OS: Deploy policy to pilot devices

    OS->>CI: Load policy binary on boot
    CI->>CI: Parse option bitmask — bit 5 set
    CI->>CI: No handler registered → skip (today)
    CI->>OS: Policy active, rules enforced normally

    Note over CI,OS: On future OS update, bit 5\nhandler activates automatically\n— no policy re-deployment needed

    Admin->>OS: Upgrade to future Windows build
    OS->>CI: Reload policy — bit 5 handler now active
    CI->>CI: Supplemental inherits base signer rules
    CI->>OS: Enhanced inheritance behavior enabled
```

This workflow illustrates that setting the option early is purely administrative but carries zero risk and zero overhead today. The only cost is a single additional `<Rule>` element in the XML.

---

## 9. What Happens If You Get It Wrong

Because this option currently has no runtime effect, there is **no meaningful misconfiguration risk** today.

### Potential Future Risk

If and when Microsoft implements the behavior behind this flag, misconfiguring it could produce unintended rule inheritance. For example, if the future semantics are "supplemental policy inherits all deny rules from base," then setting this flag on a supplemental policy that was designed to be additive-only could cause unexpected blocks.

### Misconfiguration Consequence Matrix (Current + Future Projection)

| Scenario | Today | Future (Projected) |
|----------|-------|-------------------|
| Set Option 5 on base policy | No effect | May enable inheritance cascade |
| Set Option 5 on supplemental | No effect | May allow base-rule delegation |
| Omit Option 5 everywhere | No effect | No inheritance behavior |
| Set on unsigned policy | No effect | Likely still allowed (Option 6 governs signing) |
| Set on signed policy | No effect | Likely still allowed |

```mermaid
flowchart LR
    WRONG["Option 5 set\nincorrectly (future)"]
    RIGHT["Option 5 omitted\nor set intentionally"]

    WRONG --> W1["Unexpected rule\ninheritance from base"]
    WRONG --> W2["Supplemental may\nbecome more restrictive\nthan intended"]
    RIGHT --> R1["Predictable behavior\nmatch policy intent"]
    RIGHT --> R2["No cross-policy\nrule bleed"]

    style WRONG fill:#1f0d0d,color:#fca5a5
    style RIGHT fill:#0d1f12,color:#86efac
    style W1 fill:#1f0d0d,color:#fca5a5
    style W2 fill:#1f0d0d,color:#fca5a5
    style R1 fill:#0d1f12,color:#86efac
    style R2 fill:#0d1f12,color:#86efac
```

---

## 10. Valid for Supplemental Policies?

**Yes.** Option 5 is explicitly valid for supplemental policies. This is actually the most likely target for its future semantics, given that the name "Inherit Default Policy" implies a relationship between a supplemental and its parent base policy.

### Supplemental Policy Constraints Context

Supplemental policies can only expand what a base policy allows — they cannot tighten restrictions. Option 5 may eventually let a supplemental policy explicitly acknowledge its inheritance relationship with a specific base, potentially unlocking behaviors like:
- Explicit base-signer trust propagation
- Rule deduplication (supplemental does not re-state rules already in base)
- Priority ordering (supplemental defers to base for unresolved code identities)

For now, placing Option 5 in a supplemental policy is harmless and syntactically correct.

---

## 11. OS Version Requirements

| Requirement | Details |
|-------------|---------|
| Minimum OS | Windows 10, version 1903 (Build 18362) — when WDAC option parsing was formalized |
| Current effect | No runtime effect on any released Windows version |
| Future effect | Unknown — not yet implemented as of Windows 11 24H2 |
| Server support | Windows Server 2019+ |
| ARM support | Yes — same binary encoding |
| Hypervisor dependency | None |

Option 5 does not require Virtualization-Based Security (VBS), Secure Boot, or any particular hardware feature. Its future implementation will determine whether hardware dependencies apply.

---

## 12. Summary Table

| Property | Value |
|----------|-------|
| Option Index | 5 |
| Option Name | Enabled:Inherit Default Policy |
| XML Element | `<Option>Enabled:Inherit Default Policy</Option>` |
| Binary Bitmask Position | Bit 5 (0x00000020) |
| Default State | **Not set** (absent from XML) |
| Current Runtime Effect | **None — reserved for future use** |
| Valid for Base Policy | Yes |
| Valid for Supplemental | Yes |
| Conflicts with | None (currently) |
| PowerShell Set | `Set-RuleOption -FilePath <path> -Option 5` |
| PowerShell Remove | `Remove-RuleOption -FilePath <path> -Option 5` |
| Risk Level (Today) | None |
| Risk Level (Future) | Low–Medium (depends on implemented semantics) |
| Recommendation | Omit unless forward-compat staging is required |
| Minimum OS Version | Windows 10 1903 / Server 2019 |
| Requires VBS | No |
| Requires Secure Boot | No |
