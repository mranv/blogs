---
title: 'Option 3 — Enabled:Audit Mode (Default)'
author: Anubhav Gain
pubDatetime: 2026-05-02T14:46:42.000Z
slug: app-control-rule-option-03-audit-mode
draft: false
featured: false
description: 'Enabled:Audit Mode places an App Control for Business policy in a non-enforcing observation state. When Audit Mode is active, the Code Integrity engine evaluate'
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
# Option 3 — Enabled:Audit Mode (Default)


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

`Enabled:Audit Mode` places an App Control for Business policy in a **non-enforcing observation state**. When Audit Mode is active, the Code Integrity engine evaluates every executable, DLL, script, and kernel driver against the policy rules exactly as it would in enforcement mode — but instead of blocking binaries that do not match an allow rule, it allows them to run while writing a detailed event to the `Microsoft-Windows-CodeIntegrity/Operational` Windows Event Log. These audit events (primarily **Event ID 3076** for user-mode and **Event ID 3033** for kernel-mode) capture the full file identity: name, path, hash, publisher certificate chain, and the reason the binary would have been blocked. Security and IT teams use this data to understand the real-world impact of a policy before it goes into enforcement, identify gaps in the allow rules, and refine the policy to avoid false-positive blocks of legitimate business applications. To transition from audit to enforcement, you simply remove the `Enabled:Audit Mode` option from the policy and redeploy — no structural changes to the rules are required.

---

## 2. Why It Exists

### The "Big Bang" Deployment Problem

Historically, application whitelisting technologies were notorious for causing operational outages when deployed without sufficient preparation. An enforced allowlist policy deployed to a production fleet without thorough testing would immediately block any legitimate application whose publisher, hash, or file path was not covered by the policy. The resulting flood of help-desk tickets, broken business processes, and emergency rollbacks eroded confidence in the technology and caused organizations to abandon it entirely.

`Enabled:Audit Mode` solves this by decoupling **policy learning** from **enforcement**. Teams can:

- Deploy a policy to live production endpoints with zero risk of blocking legitimate software.
- Collect weeks or months of audit data representing the real workload of each endpoint.
- Use the audit data to automatically generate supplemental policies that cover observed applications.
- Validate the refined policy in a staging environment.
- Flip to enforcement with high confidence.

### The Graduated Risk Reduction Model

```mermaid
flowchart LR
    classDef audit fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef enforce fill:#0d1f12,color:#86efac,stroke:#166534
    classDef risk fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d

    A([No Policy\nFull exposure]):::risk --> B([Audit Mode Policy\nLearning phase\nZero disruption]):::audit
    B --> C([Refined Policy\nAudit Mode\nValidation phase]):::audit
    C --> D([Enforced Policy\nProduction\nFull protection]):::enforce

    style A fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    style B fill:#1a1a0d,color:#fde68a,stroke:#713f12
    style C fill:#1a1a0d,color:#fde68a,stroke:#713f12
    style D fill:#0d1f12,color:#86efac,stroke:#166534
```

---

## 3. Visual Anatomy — Policy Evaluation Stack

```mermaid
flowchart TD
    classDef kernel fill:#162032,color:#58a6ff,stroke:#1e3a5f
    classDef usermode fill:#0d1f12,color:#86efac,stroke:#166534
    classDef audit fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534
    classDef neutral fill:#1c1c2e,color:#a5b4fc,stroke:#3730a3

    A([Binary Execution Request]) --> B[Code Integrity Engine\nCI.dll / VBS]:::kernel
    B --> C{Evaluate against\npolicy rules}
    C --> D{Rule match\nresult?}

    D -- Allow rule hit --> E([Binary executes\nNo event written]):::allow

    D -- No match / Deny hit --> F{Option 3\nEnabled:Audit Mode\npresent?}:::audit

    F -- Yes AUDIT MODE --> G([Binary executes anyway\nAudit event written]):::audit
    G --> H[(Event Log\nEvent ID 3076 user-mode\nEvent ID 3033 kernel-mode)]:::audit
    H --> I([SIEM / Event Forwarding\nPolicy refinement input]):::neutral

    F -- No ENFORCEMENT --> J([Binary BLOCKED\nEnforce event written]):::block
    J --> K[(Event Log\nEvent ID 3077 user-mode\nEvent ID 3034 kernel-mode)]:::block
```

### Audit Mode vs Enforcement Side-by-Side

```mermaid
flowchart LR
    classDef audit fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef enforce fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef allow fill:#0d1f12,color:#86efac,stroke:#166534

    subgraph Audit_Mode["Audit Mode (Option 3 Set)"]
        direction TB
        A1([Unauthorized binary]) --> B1([Policy evaluates]):::audit
        B1 --> C1([Would block? YES]):::audit
        C1 --> D1([Binary RUNS anyway]):::allow
        D1 --> E1([Event 3076 logged]):::audit
    end

    subgraph Enforce_Mode["Enforcement Mode (Option 3 Removed)"]
        direction TB
        A2([Unauthorized binary]) --> B2([Policy evaluates]):::enforce
        B2 --> C2([Would block? YES]):::enforce
        C2 --> D2([Binary BLOCKED]):::enforce
        D2 --> E2([Event 3077 logged]):::enforce
    end
```

---

## 4. How to Set It (PowerShell)

### Enable Audit Mode (Add Option 3)

```powershell
# Place policy in Audit Mode — binaries run but violations are logged
Set-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 3
```

### Disable Audit Mode / Switch to Enforcement (Remove Option 3)

```powershell
# Remove Audit Mode — policy is now ENFORCED
# WARNING: After this, non-matching binaries will be BLOCKED
Set-RuleOption -FilePath "C:\Policies\MyBasePolicy.xml" -Option 3 -Delete
```

### Verify Current Mode

```powershell
[xml]$Policy = Get-Content "C:\Policies\MyBasePolicy.xml"
$ns = New-Object System.Xml.XmlNamespaceManager($Policy.NameTable)
$ns.AddNamespace("si", "urn:schemas-microsoft-com:sipolicy")
$rules = $Policy.SelectNodes("//si:Rule/si:Option", $ns) | Select-Object -ExpandProperty '#text'

if ($rules -contains "Enabled:Audit Mode") {
    Write-Host "Policy is in AUDIT MODE — not enforcing" -ForegroundColor Yellow
} else {
    Write-Host "Policy is in ENFORCEMENT MODE — blocking active" -ForegroundColor Red
}
```

### Collecting Audit Events

```powershell
# Collect all audit events (would-be-blocked binaries)
$AuditEvents = Get-WinEvent -LogName "Microsoft-Windows-CodeIntegrity/Operational" |
    Where-Object { $_.Id -in @(3076, 3033) } |
    Select-Object TimeCreated, Id,
        @{N="FilePath"; E={ $_.Properties[1].Value }},
        @{N="Publisher"; E={ $_.Properties[4].Value }},
        @{N="SHA256"; E={ $_.Properties[8].Value }}

$AuditEvents | Export-Csv "$env:USERPROFILE\Desktop\audit_events_$(Get-Date -Format yyyyMMdd).csv" -NoTypeInformation
Write-Host "Collected $($AuditEvents.Count) audit events"
```

### Auto-Generate Supplemental Policy from Audit Log

```powershell
# Generate a supplemental policy covering all audited binaries
$AuditPolicyPath = "C:\Policies\Supplemental_FromAudit.xml"

New-CIPolicy -Audit -Level FilePublisher -Fallback Hash -UserPEs `
    -MultiplePolicyFormat `
    -FilePath $AuditPolicyPath

# Review the generated policy before merging
Get-Content $AuditPolicyPath | Select-String "FileRuleRef"
```

### Full Audit-to-Enforcement Workflow

```powershell
# Phase 1: Deploy audit policy
$PolicyPath = "C:\Policies\Corp_Baseline.xml"
Set-RuleOption -FilePath $PolicyPath -Option 0   # UMCI
Set-RuleOption -FilePath $PolicyPath -Option 3   # Audit Mode
ConvertFrom-CIPolicy -XmlFilePath $PolicyPath -BinaryFilePath "C:\Policies\Corp_Baseline_Audit.cip"
# ... deploy via Intune/GPO ...

# Phase 2: Collect data (run for 2-4 weeks)
Start-Sleep -Seconds (60 * 60 * 24 * 14)   # Conceptual — in reality, manual review

# Phase 3: Build supplemental from audit log
New-CIPolicy -Audit -Level FilePublisher -Fallback Hash -UserPEs `
    -FilePath "C:\Policies\Supplemental_Audit.xml"

# Phase 4: Merge supplemental into base or add allow rules
Merge-CIPolicy -PolicyPaths $PolicyPath, "C:\Policies\Supplemental_Audit.xml" `
    -OutputFilePath "C:\Policies\Corp_Baseline_Refined.xml"

# Phase 5: Remove Audit Mode — transition to enforcement
Set-RuleOption -FilePath "C:\Policies\Corp_Baseline_Refined.xml" -Option 3 -Delete

# Phase 6: Compile enforced policy
ConvertFrom-CIPolicy -XmlFilePath "C:\Policies\Corp_Baseline_Refined.xml" `
    -BinaryFilePath "C:\Policies\Corp_Baseline_Enforced.cip"
# ... deploy enforced policy ...
```

---

## 5. XML Representation

### Audit Mode Enabled (Policy in Learning Phase)

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Base Policy">

  <VersionEx>10.0.1.0</VersionEx>
  <PolicyTypeID>{A244370E-44C9-4C06-B551-F6016E563076}</PolicyTypeID>
  <PlatformID>{2E07F7E4-194C-4D20-B96C-1498495910E7}</PlatformID>

  <Rules>
    <Rule>
      <Option>Enabled:UMCI</Option>
    </Rule>

    <Rule>
      <Option>Enabled:Audit Mode</Option>
    </Rule>

  </Rules>


</SiPolicy>
```

### Enforcement Mode (Option 3 Removed)

```xml
<Rules>
  <Rule>
    <Option>Enabled:UMCI</Option>
  </Rule>


</Rules>
```

> **Critical Note:** The only XML difference between an auditing policy and an enforcing policy is the **presence or absence** of the `<Rule><Option>Enabled:Audit Mode</Option></Rule>` element. All signers, hashes, and file rules remain identical. This makes the audit-to-enforcement transition a minimal, low-risk operation.

---

## 6. Interaction with Other Options

### Option Relationship Matrix

| Option | Name | Relationship with Audit Mode |
|--------|------|------------------------------|
| 0 | Enabled:UMCI | **Essential pair** — UMCI must be present for meaningful user-mode audit data |
| 2 | Required:WHQL | **Pair for kernel driver auditing** — audit WHQL violations before enforcing |
| 4 | Disabled:Flight Signing | **Independent** — both can coexist; audit will log Flight-signed binaries |
| 10 | Enabled:Boot Audit on Failure | **Related** — extends audit concept to boot failures |
| 16 | Enabled:Update Policy No Reboot | **Deployment helper** — combined enables hot-swap from audit to enforcement |
| 20 | Enabled:Dynamic Code Security | **Pair** — audit JIT code violations before enforcing DCS |

### The Audit Mode Lifecycle State Machine

```mermaid
stateDiagram-v2
    direction LR

    [*] --> NoPolicyState: Endpoint with no WDAC policy

    NoPolicyState --> AuditPhase1: Deploy policy\n+ Option 3 (Audit Mode)
    AuditPhase1 --> DataCollection: 2-4 weeks\nevent collection

    DataCollection --> PolicyRefinement: Analyze 3076/3033 events\nGenerate supplemental

    PolicyRefinement --> AuditPhase2: Deploy refined policy\nstill with Option 3

    AuditPhase2 --> Validation: Validation period\n1-2 weeks

    Validation --> EnforcedState: Remove Option 3\nDeploy enforced policy

    EnforcedState --> [*]: Active enforcement

    EnforcedState --> AuditPhase1: New software rollout\nRe-enter audit cycle

    note right of AuditPhase1
        Event ID 3076 (user-mode)
        Event ID 3033 (kernel-mode)
        Binary RUNS despite violation
    end note

    note right of EnforcedState
        Event ID 3077 (user-mode)
        Event ID 3034 (kernel-mode)
        Binary BLOCKED on violation
    end note
```

---

## 7. When to Enable vs Disable

```mermaid
flowchart TD
    classDef yes fill:#0d1f12,color:#86efac,stroke:#166534
    classDef no fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef question fill:#162032,color:#58a6ff,stroke:#1e3a5f

    Start([Should Audit Mode be ENABLED?]) --> Q1{Is this a new policy\nbeing rolled out?}:::question
    Q1 -- Yes --> ENABLE1([Enable Audit Mode\nEssential for safe rollout]):::yes

    Q1 -- No --> Q2{Are you adding significant\nnew allow rules?}:::question
    Q2 -- Yes --> ENABLE2([Enable Audit Mode temporarily\nValidate new rules]):::yes
    Q2 -- No --> Q3{Is the policy already\nrefined and tested?}:::question

    Q3 -- Yes --> DISABLE([Remove Audit Mode\nEnforce the policy]):::no
    Q3 -- No --> WARN1([Enable Audit Mode\nDo not enforce untested policy]):::warn

    Start2([Should Audit Mode be REMOVED?]) --> Q4{Has audit data been\ncollected for 2+ weeks?}:::question
    Q4 -- No --> WAIT([Wait longer\nInsufficient data]):::warn
    Q4 -- Yes --> Q5{Has audit data been\nanalyzed and policy refined?}:::question
    Q5 -- No --> ANALYZE([Analyze first\nThen remove Audit Mode]):::warn
    Q5 -- Yes --> Q6{Has refined policy\nbeen tested in staging?}:::question
    Q6 -- Yes --> ENFORCE([Remove Option 3\nDeploy enforced policy]):::no
    Q6 -- No --> TEST([Test in staging first]):::warn
```

### Decision Reference Table

| Scenario | Audit Mode State |
|----------|-----------------|
| Initial policy deployment to any environment | **Enable** — non-negotiable best practice |
| New major software rollout to fleet | **Enable** — collect new binary data |
| Policy already enforced and stable | **Remove** — keep enforcement active |
| Responding to policy enforcement incident | **Enable temporarily** — diagnose without disruption |
| Compliance certification requiring enforcement | **Remove** — auditors expect enforcement, not audit |
| Dev/test machine policy | **Keep enabled** indefinitely for flexibility |

---

## 8. Real-World Scenario — End-to-End Walkthrough

### Scenario: Enterprise-Wide WDAC Rollout via Audit-First Approach

A 5,000-endpoint enterprise deploys WDAC for the first time across all corporate laptops. Audit Mode is used to learn the environment over 30 days before any enforcement is activated.

```mermaid
sequenceDiagram
    autonumber
    actor CISO
    actor Admin
    participant Intune as Microsoft Intune
    participant TestRing as Test Ring (50 endpoints)
    participant EventLog as Event Log / SIEM
    participant CIModule as ConfigCI PowerShell
    participant PilotRing as Pilot Ring (500 endpoints)
    participant ProdFleet as Production Fleet (5000 endpoints)

    CISO ->> Admin: Requirement: WDAC on all endpoints within 60 days
    Admin ->> CIModule: Create policy: DefaultWindows + Option 0 (UMCI) + Option 3 (Audit)
    Admin ->> CIModule: ConvertFrom-CIPolicy → corp_audit_v1.cip
    Admin ->> Intune: Deploy corp_audit_v1.cip to Test Ring (50 devices)
    TestRing ->> EventLog: Generate 3076 events for 2 weeks
    Admin ->> EventLog: Export and analyze 3076 events
    EventLog -->> Admin: 47 unique binaries would have been blocked
    Admin ->> CIModule: New-CIPolicy -Audit → supplemental_from_audit.xml
    Admin ->> CIModule: Merge base + supplemental → corp_audit_v2.xml
    Admin ->> Intune: Deploy corp_audit_v2.cip to Test Ring
    TestRing ->> EventLog: Generate 3076 events for 1 more week
    EventLog -->> Admin: 3 remaining edge-case binaries
    Admin ->> CIModule: Add remaining signers/hashes manually
    Admin ->> CIModule: Remove Option 3 → corp_enforced_v1.xml
    Admin ->> Intune: Deploy corp_enforced_v1.cip to Pilot Ring (500 devices)
    PilotRing -->> Admin: Monitor for 3077 events — 2 false positives found
    Admin ->> CIModule: Add 2 missing file rules → corp_enforced_v2.xml
    Admin ->> Intune: Staged rollout to Production Fleet (5000 devices)
    ProdFleet -->> CISO: 100% WDAC enforced — 0 operational incidents
```

### Analyzing Audit Events Efficiently

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant EventLog as Windows Event Log
    participant PowerShell as PowerShell Analysis
    participant ExcelCSV as CSV / Excel Report
    participant PolicyXML as Policy XML

    Admin ->> EventLog: Query Event ID 3076 for past 14 days
    EventLog -->> PowerShell: Return raw events (potentially thousands)
    PowerShell ->> PowerShell: Group by Publisher → deduplicate
    PowerShell ->> PowerShell: Prioritize: signed > unsigned > by path
    PowerShell ->> ExcelCSV: Export grouped report
    Admin ->> ExcelCSV: Review — identify business-critical apps vs noise
    Admin ->> PolicyXML: Add FilePublisher rules for signed trusted apps
    Admin ->> PolicyXML: Add Hash rules for unsigned but required binaries
    Admin ->> PolicyXML: Flag unknown binaries for security review
    PolicyXML -->> Admin: Refined policy ready for re-audit deployment
```

---

## 9. What Happens If You Get It Wrong

### Scenario A: Forget to Remove Audit Mode Before Production

The policy is deployed to production with Audit Mode still present. Enforcement never activates, but the team believes they are protected.

```mermaid
flowchart TD
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#713f12
    classDef ok fill:#0d1f12,color:#86efac,stroke:#166534

    A([Audit Mode left in production policy]) --> B{Malware executes}
    B --> C([Policy evaluates binary]):::warn
    C --> D([No allow rule match]):::warn
    D --> E([Audit Mode: Binary RUNS anyway]):::block
    D --> F([Event 3076 written to log]):::warn
    E --> G([Malware executes successfully]):::block
    G --> H([Data breach / ransomware]):::block
    F --> I([Alert in SIEM — too late]):::warn
    H --> J([Incident response triggered]):::block
    J --> K([Audit Mode discovered in policy review]):::warn
    K --> L([Policy corrected post-breach]):::block
```

### Scenario B: Remove Audit Mode Without Sufficient Data Collection

```mermaid
flowchart TD
    classDef block fill:#1f0d0d,color:#fca5a5,stroke:#7f1d1d
    classDef warn fill:#1a1a0d,color:#fde68a,stroke:#713f12

    A([Remove Audit Mode after only 3 days]) --> B[Insufficient audit coverage]:::warn
    B --> C([Policy enforced on day 4])
    C --> D[Monthly payroll software runs\nnot captured in 3-day audit]:::block
    C --> E[Quarterly compliance tool runs\nnot captured]:::block
    C --> F[Seasonal inventory software\nnot captured]:::block
    D --> G([Payroll fails on month-end]):::block
    E --> H([Compliance audit failure]):::block
    F --> I([Inventory count disrupted]):::block
```

### Misconfig Consequences Summary

| Mistake | Impact | Severity |
|---------|--------|----------|
| Leave Audit Mode in production permanently | Policy provides zero enforcement | Critical |
| Enforce without sufficient audit period | LOB app breaks at unexpected time | High |
| Ignore high-volume 3076 events | Policy gaps unaddressed before enforcement | High |
| Confuse audit coverage with full inventory | Seasonal/monthly apps missed | Medium |
| Run audit without UMCI option | Only kernel events logged; user-mode gaps invisible | High |

---

## 10. Valid for Supplemental Policies?

**No.** `Enabled:Audit Mode` is not valid in supplemental policies. The enforcement mode of the entire policy set is determined solely by the base policy. Supplemental policies cannot independently toggle between audit and enforcement — they inherit the base policy's mode. Setting Option 3 in a supplemental policy would be silently ignored or rejected during policy merge.

This design ensures a consistent enforcement posture across the base + supplemental policy set. You cannot have a "partially auditing" configuration where the base enforces but a supplemental audits — the base policy is authoritative.

---

## 11. OS Version Requirements

| Windows Version | Audit Mode Status |
|----------------|------------------|
| Windows 10 1507 (TH1) | Basic audit logging supported |
| Windows 10 1607+ | Full audit mode with UMCI audit (Event 3076) |
| Windows 10 1703+ | Audit events enriched with script enforcement data |
| Windows 10 1903+ | Structured audit event format improved |
| Windows 11 21H2+ | Enhanced audit tooling; `citool.exe` available |
| Windows Server 2016+ | Full support |
| Windows Server 2019+ | Recommended; enhanced event forwarding |

> **Event Forwarding for Scale:** In enterprise environments, configure Windows Event Forwarding (WEF) or a SIEM agent to centralize Event ID 3076 events from all endpoints. Processing thousands of per-endpoint logs manually is not scalable. Tools like `Microsoft WDAC Wizard` and `WDAC Policy Creator` can ingest event exports and generate policy fragments automatically.

---

## 12. Summary Table

| Attribute | Value |
|-----------|-------|
| Rule Option Name | `Enabled:Audit Mode` |
| Rule Option Index | 3 |
| Default State | **Enabled** in most Microsoft template policies |
| Effect when Enabled | Policy evaluates but does NOT block; violations logged |
| Effect when Disabled (Removed) | Policy ENFORCES — violating binaries are BLOCKED |
| Valid in Base Policy | **Yes** |
| Valid in Supplemental Policy | **No** |
| Requires Reboot on Change | **No** — audit/enforce switch takes effect on policy update |
| Primary Use Case | Safe initial deployment; policy validation; troubleshooting |
| Recommended Audit Duration | 2–4 weeks minimum; 4–8 weeks for complex environments |
| Event ID (Audit — User-Mode) | **3076** — would-be-blocked user-mode binary |
| Event ID (Audit — Kernel-Mode) | **3033** — would-be-blocked kernel-mode driver |
| Event ID (Enforce — User-Mode) | **3077** — blocked user-mode binary |
| Event ID (Enforce — Kernel-Mode) | **3034** — blocked kernel-mode driver |
| Event Log | `Microsoft-Windows-CodeIntegrity/Operational` |
| PowerShell Cmdlet (Enable) | `Set-RuleOption -FilePath <xml> -Option 3` |
| PowerShell Cmdlet (Disable) | `Set-RuleOption -FilePath <xml> -Option 3 -Delete` |
| Policy Generation from Audit | `New-CIPolicy -Audit -Level FilePublisher -Fallback Hash -UserPEs` |
| Critical Warning | Leaving Audit Mode in production = zero enforcement |
| Security Framework Alignment | NIST SP 800-167 (Phased deployment), CIS Controls (baseline scanning) |
