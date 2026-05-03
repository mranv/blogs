---
title: 'Option 10 — Enabled:Boot Audit on Failure'
author: Anubhav Gain
pubDatetime: 2026-05-03T10:00:00.000Z
slug: rule-option-option-10-boot-audit-on-failure
draft: false
featured: false
description: 'Applies to Supplemental Policies: No'
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
# Option 10 — Enabled:Boot Audit on Failure

**Policy Rule Option:** 10
**Rule Name:** `Enabled:Boot Audit on Failure`
**Applies to Supplemental Policies:** No

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Why It Exists](#why-it-exists)
3. [Visual Anatomy — Policy Evaluation Stack](#visual-anatomy--policy-evaluation-stack)
4. [How to Set It (PowerShell)](#how-to-set-it-powershell)
5. [XML Representation](#xml-representation)
6. [Interaction With Other Options](#interaction-with-other-options)
7. [When to Enable vs Disable](#when-to-enable-vs-disable)
8. [Real-World Scenario — End-to-End Walkthrough](#real-world-scenario--end-to-end-walkthrough)
9. [What Happens If You Get It Wrong](#what-happens-if-you-get-it-wrong)
10. [Valid for Supplemental Policies?](#valid-for-supplemental-policies)
11. [OS Version Requirements](#os-version-requirements)
12. [Summary Table](#summary-table)

---

## What It Does

When **Enabled:Boot Audit on Failure** is active in an enforcement-mode App Control for Business (WDAC) policy, Windows acts as a safety net during early boot. If a boot-critical driver or binary is blocked by the policy—causing the system to fail to initialize—the kernel automatically demotes the entire App Control policy from **enforcement mode to audit mode** for that boot session. Windows continues loading, the blocked driver is permitted to run in this fallback mode, and a Code Integrity event is written to the event log so administrators can investigate and resolve the rule gap before the next restart. Without this option, a misconfigured policy that blocks a critical boot driver would render the machine unbootable.

---

## Why It Exists

Deploying an enforcement-mode WDAC policy is inherently risky when the full software inventory of a machine is unknown or when third-party hardware (RAID controllers, storage drivers, NIC firmware) is present. If the policy is missing a signer rule or hash for a boot-critical component, the result is a **blue screen** or **recovery loop**, requiring physical access or WinRE intervention to remove the policy.

Option 10 solves this problem by providing a **graceful degradation path**: the machine recovers automatically, no user data is lost, and the administrator has a clear log trail pointing to exactly which binary caused the failure. This is especially valuable during phased enforcement rollouts or when deploying policies to a hardware estate that includes uncommon OEM drivers.

---

## Visual Anatomy — Policy Evaluation Stack

The following diagram shows where Option 10 intercepts the normal boot-time policy enforcement flow.

```mermaid
flowchart TD
    A([System Power-On / Reset]) --> B[UEFI Secure Boot validates bootloader]
    B --> C[Windows Boot Manager\nwinload.efi / winload.exe]
    C --> D{App Control Policy\nPresent?}
    D -- No --> E([Normal Boot, no CI enforcement])
    D -- Yes --> F[ci.dll loads policy binary\n.p7b file]
    F --> G{Policy Mode?}
    G -- Audit --> H([Load all drivers, log violations])
    G -- Enforce --> I[Evaluate each boot-critical driver\nagainst policy rules]
    I --> J{Driver allowed\nby policy?}
    J -- Yes --> K([Driver loads, continues boot])
    J -- No --> L{Option 10\nEnabled?}
    L -- No --> M([BSOD / Boot Failure\nSystem unbootable])
    L -- Yes --> N[/Policy demoted to\nAudit Mode for this session/]
    N --> O([Driver loads under audit mode])
    O --> P[CodeIntegrity Event 3077 or 3033\nwritten to event log]
    P --> Q([Boot completes, system available])
    Q --> R[Admin reviews event log\nand adds missing rule]

    style A fill:#162032,color:#58a6ff
    style B fill:#162032,color:#58a6ff
    style C fill:#162032,color:#58a6ff
    style D fill:#1a1a0d,color:#fde68a
    style E fill:#0d1f12,color:#86efac
    style F fill:#162032,color:#58a6ff
    style G fill:#1a1a0d,color:#fde68a
    style H fill:#0d1f12,color:#86efac
    style I fill:#162032,color:#58a6ff
    style J fill:#1a1a0d,color:#fde68a
    style K fill:#0d1f12,color:#86efac
    style L fill:#1a1a0d,color:#fde68a
    style M fill:#1f0d0d,color:#fca5a5
    style N fill:#1a1a0d,color:#fde68a
    style O fill:#0d1f12,color:#86efac
    style P fill:#162032,color:#58a6ff
    style Q fill:#0d1f12,color:#86efac
    style R fill:#1c1c2e,color:#a5b4fc
```

---

## How to Set It (PowerShell)

### Enable Option 10

```powershell
# Enable Boot Audit on Failure in an existing policy XML
Set-RuleOption -FilePath "C:\Policies\MyPolicy.xml" -Option 10
```

### Remove (Disable) Option 10

```powershell
# Remove Boot Audit on Failure (system will BSOD if boot driver is blocked)
Remove-RuleOption -FilePath "C:\Policies\MyPolicy.xml" -Option 10
```

### Full Example — Creating a Policy with Option 10 Enabled

```powershell
# Start from the DefaultWindows template
$PolicyPath = "C:\Policies\EnforceWithBootAudit.xml"

Copy-Item -Path "C:\Windows\schemas\CodeIntegrity\ExamplePolicies\DefaultWindows_Enforced.xml" `
          -Destination $PolicyPath

# Ensure enforcement mode
Set-RuleOption -FilePath $PolicyPath -Option 3   # Enabled:Audit Mode (remove this for enforcement)
Remove-RuleOption -FilePath $PolicyPath -Option 3 # Remove audit mode to enforce

# Enable Boot Audit on Failure
Set-RuleOption -FilePath $PolicyPath -Option 10

# Convert to binary
ConvertFrom-CIPolicy -XmlFilePath $PolicyPath `
                     -BinaryFilePath "C:\Policies\EnforceWithBootAudit.p7b"
```

### Verify the Option is Set

```powershell
[xml]$policy = Get-Content "C:\Policies\MyPolicy.xml"
$policy.SiPolicy.Rules.Rule | Where-Object { $_.Option -eq "Enabled:Boot Audit on Failure" }
```

---

## XML Representation

Within the policy XML, Option 10 appears as a `<Rule>` element inside the `<Rules>` block:

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Base Policy">
  <VersionEx>10.0.0.0</VersionEx>
  <PolicyTypeID>{A244370E-44C9-4C06-B551-F6016E563076}</PolicyTypeID>
  <PlatformID>{2E07F7E4-194C-4D20-B96C-134CA31A5C3F}</PlatformID>
  <Rules>

    <Rule>
      <Option>Enabled:Boot Audit on Failure</Option>
    </Rule>

  </Rules>
</SiPolicy>
```

**Important:** Option 10 is only meaningful when the policy is in **enforcement mode** (i.e., Option 3 `Enabled:Audit Mode` is NOT present). In audit mode, all violations are already logged without blocking, so the boot-audit fallback is irrelevant.

---

## Interaction With Other Options

```mermaid
flowchart LR
    subgraph Complementary["Complementary Options"]
        direction TB
        O10([Option 10\nBoot Audit on Failure])
        O3([Option 3\nAudit Mode])
        O14([Option 14\nISG Authorization])
        O13([Option 13\nManaged Installer])
    end
    subgraph Conflicting["Conflicting / Irrelevant"]
        direction TB
        O3_note["If Option 3 is set,\npolicy is already audit mode.\nOption 10 has no effect."]
    end

    O10 -->|"Works best WITH\nenforcement mode\n(Option 3 absent)"| EnforceMode([Enforcement Mode])
    O10 -->|"Provides fallback for\ndrivers allowed by"| O13
    O10 -->|"Provides fallback for\ndrivers allowed by"| O14
    O3 -.->|"Supersedes Option 10:\nwhole policy is audit already"| O3_note

    style O10 fill:#162032,color:#58a6ff
    style O3 fill:#1a1a0d,color:#fde68a
    style O14 fill:#1c1c2e,color:#a5b4fc
    style O13 fill:#0d1f12,color:#86efac
    style EnforceMode fill:#1f0d0d,color:#fca5a5
    style O3_note fill:#1f0d0d,color:#fca5a5
```

| Option | Relationship | Notes |
|--------|-------------|-------|
| Option 3 — Enabled:Audit Mode | Supersedes | If Option 3 is present, the policy is already audit-only. Option 10 has no additional effect. |
| Option 6 — Enabled:Unsigned System Integrity Policy | Neutral | Independent of boot-audit behavior. |
| Option 13 — Enabled:Managed Installer | Complementary | Option 10 provides a safety net if a MI-stamped boot driver lacks an explicit rule. |
| Option 14 — Enabled:ISG Authorization | Complementary | Option 10 protects against ISG connectivity failure during early boot (ISG cannot be queried before network stack initializes). |

---

## When to Enable vs Disable

```mermaid
flowchart TD
    Start([Configuring enforcement policy]) --> Q1{Is this policy\nbeing deployed to\na known, fully-inventoried\nhardware estate?}
    Q1 -- Yes --> Q2{Have all boot drivers\nbeen tested in\naudit mode first?}
    Q1 -- No --> Enable([Enable Option 10\nSafety net essential])
    Q2 -- Yes --> Q3{Is a BSOD acceptable\nas a hard failure\nsignal in your org?}
    Q2 -- No --> Enable
    Q3 -- Yes --> Disable([Consider removing Option 10\nStrict enforcement desired])
    Q3 -- No --> Enable
    Enable --> Note1[/"Recommended for initial deployments,\npilot rings, and heterogeneous hardware"/]
    Disable --> Note2[/"Acceptable in tightly-controlled,\nfully-inventoried server environments\nafter full audit validation"/]

    style Start fill:#162032,color:#58a6ff
    style Q1 fill:#1a1a0d,color:#fde68a
    style Q2 fill:#1a1a0d,color:#fde68a
    style Q3 fill:#1a1a0d,color:#fde68a
    style Enable fill:#0d1f12,color:#86efac
    style Disable fill:#1f0d0d,color:#fca5a5
    style Note1 fill:#1c1c2e,color:#a5b4fc
    style Note2 fill:#1c1c2e,color:#a5b4fc
```

**Enable Option 10 when:**
- Deploying enforcement policy for the first time to a broad hardware estate
- Machines have heterogeneous OEM drivers (RAID, NIC, GPU firmware helpers)
- Full audit-mode soak has not been completed prior to enforcement
- High-availability machines where an unplanned BSOD is unacceptable
- Pilot ring rollouts where coverage gaps are still being discovered

**Remove Option 10 when:**
- The policy has been fully validated through an extended audit-mode period
- The hardware estate is tightly controlled and fully inventoried
- You want a hard failure signal to catch any policy regression immediately
- Security posture demands zero tolerance for policy bypass, even temporary

---

## Real-World Scenario — End-to-End Walkthrough

**Scenario:** Contoso IT is rolling out an enforcement-mode WDAC policy to 5,000 endpoints. A subset of machines has a third-party RAID controller (Adaptec) whose miniport driver is not covered by any signer rule in the policy. Option 10 is enabled as a precaution.

```mermaid
sequenceDiagram
    actor Admin as IT Administrator
    participant MDM as Intune / MDM
    participant Machine as Endpoint Machine
    participant CI as Code Integrity (ci.dll)
    participant Log as Event Log (CodeIntegrity)
    participant Defender as Microsoft Defender / SIEM

    Admin->>MDM: Deploy enforcement policy with Option 10 enabled
    MDM->>Machine: Push policy binary (.p7b) via OMA-URI
    Machine->>Machine: Policy file written to EFI System Partition
    Note over Machine: Machine reboots for policy to take effect

    Machine->>CI: Boot begins, ci.dll evaluates each driver
    CI->>CI: Adaptec miniport driver evaluated
    CI-->>CI: No matching signer or hash rule found!
    CI->>CI: Option 10 detected → demote policy to audit mode
    CI->>Machine: Driver allowed to load (audit mode)
    Machine->>Machine: Boot completes successfully
    CI->>Log: Write Event ID 3033 (boot audit fallback triggered)\nWrite Event ID 3077 (blocked file details)

    Log->>Defender: Events forwarded via WEF/Defender for Endpoint
    Defender->>Admin: Alert: "Boot Audit Fallback triggered on MACHINE-0042"

    Admin->>Log: Review event log:\n- Publisher: Adaptec Inc.\n- File: arcmsr.sys\n- Version: 1.20.0.23

    Admin->>MDM: Add Adaptec signer rule to policy
    Admin->>MDM: Redeploy updated policy
    MDM->>Machine: Push updated policy binary
    Machine->>Machine: Reboot with corrected policy
    CI->>CI: arcmsr.sys now matches signer rule
    CI->>Machine: Driver allowed in full enforcement mode
    Note over Machine: Boot completes in enforcement mode — no fallback needed
```

---

## What Happens If You Get It Wrong

### Scenario A: Option 10 absent, boot driver blocked

- The machine experiences a **BSOD** (typically `STOP: 0xC0000428` — `STATUS_INVALID_IMAGE_HASH`)
- Windows enters **automatic repair** or **blue screen loop**
- Recovery requires booting into **WinRE** and manually deleting or disabling the policy file from the EFI partition
- If BitLocker is enabled, the recovery key is required
- Remote machines become **unreachable** — requiring physical or IPMI/iLO access
- Severity: **Critical** — potential for large-scale outage if deployed broadly before audit validation

### Scenario B: Option 10 present but forgotten — never removing it after full validation

- If the policy perpetually relies on boot-audit fallback, a misconfigured policy silently passes
- Attackers with physical access could theoretically exploit the transient audit-mode window during boot
- Over time, the organization may believe the policy is enforcing when it is only auditing
- **Recommendation:** Remove Option 10 after audit-mode soak confirms all boot drivers are covered

### Event IDs to Monitor

| Event ID | Log | Meaning |
|----------|-----|---------|
| 3033 | Microsoft-Windows-CodeIntegrity/Operational | A boot-start driver failed to meet the requirements. Boot audit mode was activated. |
| 3077 | Microsoft-Windows-CodeIntegrity/Operational | A file was blocked. Details include file name, hash, and publisher. |
| 3076 | Microsoft-Windows-CodeIntegrity/Operational | Audit-mode violation (file would have been blocked in enforcement). |

---

## Valid for Supplemental Policies?

**No.** Option 10 is only valid in **base policies**.

Supplemental policies extend or override the rules of a base policy, but boot-time behavior — including the audit fallback — is governed entirely by the base policy. A supplemental policy cannot modify boot-time enforcement behavior. If you attempt to set Option 10 in a supplemental policy XML, the policy will fail validation or the option will be silently ignored.

---

## OS Version Requirements

| Platform | Minimum Version | Notes |
|----------|----------------|-------|
| Windows 10 | 1709 (Fall Creators Update) | App Control (WDAC) multiple-policy format introduced |
| Windows 11 | All versions | Fully supported |
| Windows Server 2019 | All versions | Fully supported |
| Windows Server 2022 | All versions | Fully supported |
| Windows Server 2016 | Limited | Single-policy format only; Option 10 supported but multi-policy features unavailable |

Option 10 itself has been available since the original WDAC feature introduction in Windows 10 1507. No special kernel version is required beyond standard WDAC prerequisites.

---

## Summary Table

| Attribute | Value |
|-----------|-------|
| Option Number | 10 |
| XML String | `Enabled:Boot Audit on Failure` |
| Policy Type | Base policy only |
| Enforcement Mode Required | Yes (no effect in audit-mode policies) |
| Default State | Not set (disabled) |
| PowerShell Enable | `Set-RuleOption -FilePath <xml> -Option 10` |
| PowerShell Remove | `Remove-RuleOption -FilePath <xml> -Option 10` |
| Risk if Missing | Boot failure / BSOD if critical driver is blocked |
| Risk if Kept Too Long | Transient policy bypass at boot time; silent audit fallback |
| Supplemental Policy | Not valid |
| Recommended For | All initial enforcement deployments; heterogeneous hardware |
| Key Event IDs | 3033, 3077 (CodeIntegrity/Operational) |
