---
title: 'Option 17 — Enabled:Allow Supplemental Policies'
author: Anubhav Gain
pubDatetime: 2026-05-02T14:46:42.000Z
slug: app-control-rule-option-17-allow-supplemental-policies
draft: false
featured: false
description: 'Minimum OS Version: Windows 10 version 1903 / Windows Server 2022'
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
# Option 17 — Enabled:Allow Supplemental Policies

**Rule Option ID:** 17
**Rule String:** `Enabled:Allow Supplemental Policies`
**Minimum OS Version:** Windows 10 version 1903 / Windows Server 2022

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Why It Exists](#why-it-exists)
3. [The Base / Supplemental Policy Architecture — Deep Dive](#the-base--supplemental-policy-architecture--deep-dive)
4. [Visual Anatomy — Policy Evaluation Stack](#visual-anatomy--policy-evaluation-stack)
5. [How to Set It (PowerShell)](#how-to-set-it-powershell)
6. [XML Representation](#xml-representation)
7. [PolicyID Linking — How the Kernel Connects Base to Supplemental](#policyid-linking--how-the-kernel-connects-base-to-supplemental)
8. [How ci.dll Loads and Evaluates Both Policies](#how-cidll-loads-and-evaluates-both-policies)
9. [Interaction with Other Options](#interaction-with-other-options)
10. [When to Enable vs Disable](#when-to-enable-vs-disable)
11. [Real-World Scenario / End-to-End Walkthrough](#real-world-scenario--end-to-end-walkthrough)
12. [What Happens If You Get It Wrong](#what-happens-if-you-get-it-wrong)
13. [Valid for Supplemental Policies?](#valid-for-supplemental-policies)
14. [OS Version Requirements](#os-version-requirements)
15. [Summary Table](#summary-table)

---

## What It Does

**Option 17 — Enabled:Allow Supplemental Policies** activates the **multi-policy architecture** in App Control for Business. When this option is present in a base policy, the Windows Code Integrity kernel driver (`ci.dll`) will accept additional **supplemental policy** files that reference this base policy and **expand its allow-list**. Supplemental policies add new rules on top of the base — they can authorize additional signers, hashes, file paths, or entire application groups — without modifying the original base policy itself. A single base policy can be supplemented by **multiple independent supplemental policies simultaneously**, each layered additively on top. The base policy continues to define the security floor: its deny rules, enforcement mode, and core allow-list cannot be overridden by supplementals. Supplementals can only add permissions — they cannot remove restrictions or switch the policy from enforce to audit mode.

---

## Why It Exists

The fundamental challenge of managing App Control in diverse enterprises is the **tension between centralized security control and distributed operational needs**:

### The Problem Without Supplemental Policies

Before supplemental policies existed (Windows 10 versions prior to 1903), every organization had a binary choice:

1. **Centralized monolithic policy:** The security team manages a single policy file for all endpoints. Every new application addition requires a policy change, review, re-signing (if signed), and redeployment across the entire fleet. This creates a bottleneck: business units, developers, and operations teams must all queue through a central change process just to run new software.

2. **Per-device or per-group fragmented policies:** Different organizational units maintain their own policies. Centralized security controls are impossible to enforce uniformly. Tracking and auditing becomes a nightmare.

### What Supplemental Policies Enable

Option 17 enables a **hub-and-spoke governance model**:

```
Central Security Team → Base Policy → Security Floor (cannot be weakened)
       ↕ delegates customization authority to ↕
Business Unit A → Supplemental Policy A → Adds their approved apps
Business Unit B → Supplemental Policy B → Adds their approved apps
IT Operations   → Supplemental Policy C → Adds admin tools
Development Team → Supplemental Policy D → Adds dev toolchain
```

Each spoke can add to the allowlist without touching the security floor. The central team retains full control of what cannot be overridden (the base), while operational agility is distributed to those who need it.

### Additional Benefits

- **Staged rollouts:** Test new applications with a supplemental before promoting rules to the base policy
- **Temporary authorization windows:** Deploy a supplemental for a limited maintenance period, then remove it — no base policy change required
- **Organizational mergers:** Two merged companies can run their respective supplemental policies alongside a common corporate base policy
- **Separation of concerns:** Security team owns the base; IT operations owns supplementals for admin tools; application teams own supplementals for their apps
- **Blast-radius reduction:** A mistake in a supplemental policy affects only that supplemental's scope — it cannot corrupt the base policy

---

## The Base / Supplemental Policy Architecture — Deep Dive

### Conceptual Model

```mermaid
flowchart TB
    subgraph BASE ["Base Policy — The Security Floor"]
        B_META["PolicyType = Base Policy\nPolicyID = {GUID-BASE}\nBasePolicyID = {GUID-BASE}\nOption 17: Allow Supplemental Policies"]
        B_RULES["Base Rules\n• Allow: Windows components\n• Allow: Microsoft signing certs\n• Deny: Known malware hashes\n• Enforce mode\n• ISG settings\n• All security floor rules"]
    end

    subgraph SUPP_A ["Supplemental Policy A\n— Business Unit Finance"]
        SA_META["PolicyType = Supplemental Policy\nPolicyID = {GUID-SUPP-A}\nBasePolicyID = {GUID-BASE} ← links to base\nSupplementsBasePolicyID = {GUID-BASE}"]
        SA_RULES["Added Rules\n• Allow: Bloomberg Terminal signing cert\n• Allow: QuickBooks hash set\n• Allow: Internal finance app signer"]
    end

    subgraph SUPP_B ["Supplemental Policy B\n— IT Operations"]
        SB_META["PolicyType = Supplemental Policy\nPolicyID = {GUID-SUPP-B}\nBasePolicyID = {GUID-BASE} ← links to base\nSupplementsBasePolicyID = {GUID-BASE}"]
        SB_RULES["Added Rules\n• Allow: Sysinternals tools signer\n• Allow: Remote management agent\n• Allow: Monitoring tool hashes"]
    end

    subgraph SUPP_C ["Supplemental Policy C\n— Development Team"]
        SC_META["PolicyType = Supplemental Policy\nPolicyID = {GUID-SUPP-C}\nBasePolicyID = {GUID-BASE} ← links to base\nSupplementsBasePolicyID = {GUID-BASE}"]
        SC_RULES["Added Rules\n• Allow: JetBrains IDE signing cert\n• Allow: Node.js runtime\n• Allow: Build tools hashes"]
    end

    BASE --> SUPP_A
    BASE --> SUPP_B
    BASE --> SUPP_C

    style B_META fill:#162032,color:#58a6ff
    style B_RULES fill:#162032,color:#58a6ff
    style SA_META fill:#0d1f12,color:#86efac
    style SA_RULES fill:#0d1f12,color:#86efac
    style SB_META fill:#1c1c2e,color:#a5b4fc
    style SB_RULES fill:#1c1c2e,color:#a5b4fc
    style SC_META fill:#1a1a0d,color:#fde68a
    style SC_RULES fill:#1a1a0d,color:#fde68a
```

### What Supplemental Policies Can and Cannot Do

```mermaid
flowchart LR
    subgraph CAN ["Supplemental Policies CAN"]
        C1["Add allow rules:\nSigner, Hash, FilePath,\nPackage Family Name"]
        C2["Add new FileAttrib\nelements"]
        C3["Reference multiple\nbase policies\n(one supplemental per base)"]
        C4["Be deployed / removed\nindependently"]
        C5["Use Option 18\n(Disable Runtime FilePath\nRule Protection)"]
    end

    subgraph CANNOT ["Supplemental Policies CANNOT"]
        NC1["Add deny rules\n(ignored at evaluation time)"]
        NC2["Override base policy\nenforcement mode\n(Audit vs Enforce)"]
        NC3["Set Option 16\n(Update Policy No Reboot)"]
        NC4["Set Option 17\n(Allow Supplemental Policies\nis a base-only flag)"]
        NC5["Override ISG settings\nfrom the base"]
        NC6["Weaken base HVCI\nor boot protection settings"]
    end

    style C1 fill:#0d1f12,color:#86efac
    style C2 fill:#0d1f12,color:#86efac
    style C3 fill:#0d1f12,color:#86efac
    style C4 fill:#0d1f12,color:#86efac
    style C5 fill:#0d1f12,color:#86efac
    style NC1 fill:#1f0d0d,color:#fca5a5
    style NC2 fill:#1f0d0d,color:#fca5a5
    style NC3 fill:#1f0d0d,color:#fca5a5
    style NC4 fill:#1f0d0d,color:#fca5a5
    style NC5 fill:#1f0d0d,color:#fca5a5
    style NC6 fill:#1f0d0d,color:#fca5a5
```

---

## Visual Anatomy — Policy Evaluation Stack

```mermaid
flowchart TD
    EXEC([Binary Execution Request]) --> KERNEL["ci.dll — Code Integrity Driver\nKernel Mode Evaluation"]

    KERNEL --> LOAD["Load all active policies\nfrom CiPolicies\\Active\\"]

    LOAD --> CLASSIFY{Classify each policy\nby PolicyType field}
    CLASSIFY --> BASE_POL["Base Policy\nPolicyID = BasePolicyID\nOption 17 present?"]
    CLASSIFY --> SUPP_POLS["Supplemental Policies\nBasePolicyID points to\na loaded base policy"]

    BASE_POL --> CHECK_OPT17{Option 17 present\nin this base policy?}
    CHECK_OPT17 -- No --> IGNORE_SUPPS["Ignore all supplemental\npolicies referencing this base.\nOnly base rules apply."]
    CHECK_OPT17 -- Yes --> ACCEPT_SUPPS["Accept supplemental\npolicies linked to\nthis base's PolicyID"]

    SUPP_POLS --> LINK_CHECK{SupplementsBasePolicyID\nmatches a loaded base\nwith Option 17?}
    LINK_CHECK -- No --> ORPHAN["Orphan supplemental —\ndiscarded, not evaluated"]
    LINK_CHECK -- Yes --> MERGE["Merge supplemental rules\ninto evaluation set\n(additive only)"]

    ACCEPT_SUPPS --> EVAL_ENGINE["Combined Policy Evaluation\nBase rules + All valid supplemental rules"]
    MERGE --> EVAL_ENGINE
    IGNORE_SUPPS --> EVAL_ENGINE_BASE["Base-Only Policy Evaluation\nNo supplemental expansion"]

    EVAL_ENGINE --> ALLOW_CHECK{Does combined\nrule set allow\nthe binary?}
    EVAL_ENGINE_BASE --> ALLOW_CHECK

    ALLOW_CHECK -- Yes --> ALLOW([Allow Execution])
    ALLOW_CHECK -- No --> BLOCK([Block Execution])

    style EXEC fill:#162032,color:#58a6ff
    style KERNEL fill:#1c1c2e,color:#a5b4fc
    style LOAD fill:#1c1c2e,color:#a5b4fc
    style CLASSIFY fill:#1a1a0d,color:#fde68a
    style BASE_POL fill:#162032,color:#58a6ff
    style SUPP_POLS fill:#0d1f12,color:#86efac
    style CHECK_OPT17 fill:#1a1a0d,color:#fde68a
    style IGNORE_SUPPS fill:#1f0d0d,color:#fca5a5
    style ACCEPT_SUPPS fill:#0d1f12,color:#86efac
    style LINK_CHECK fill:#1a1a0d,color:#fde68a
    style ORPHAN fill:#1f0d0d,color:#fca5a5
    style MERGE fill:#0d1f12,color:#86efac
    style EVAL_ENGINE fill:#162032,color:#58a6ff
    style EVAL_ENGINE_BASE fill:#1f0d0d,color:#fca5a5
    style ALLOW_CHECK fill:#1a1a0d,color:#fde68a
    style ALLOW fill:#0d1f12,color:#86efac
    style BLOCK fill:#1f0d0d,color:#fca5a5
```

---

## How to Set It (PowerShell)

### Step 1: Enable Option 17 in the Base Policy

```powershell
$BasePolicyPath = "C:\Policies\CorporateBase.xml"

# Enable supplemental policy support
Set-RuleOption -FilePath $BasePolicyPath -Option 17

# Verify
[xml]$Policy = Get-Content $BasePolicyPath
$Policy.SiPolicy.Rules.Rule | Select-Object -ExpandProperty Option
```

### Step 2: Create a Supplemental Policy

```powershell
$SupplementalPath = "C:\Policies\FinanceDept-Supplemental.xml"

# Create a new supplemental policy (starts from scratch or from another policy)
# Method 1: Create a minimal supplemental from scratch
New-CIPolicy -FilePath $SupplementalPath `
             -ScanPath "C:\Program Files\Bloomberg\" `
             -Level Publisher `
             -Fallback Hash

# Method 2: Create supplemental from existing policy (extract rules from an existing XML)
# Then trim it down to only the rules you want to add

# Set the policy as Supplemental type and link to base
$BasePolicyId = ([xml](Get-Content $BasePolicyPath)).SiPolicy.PolicyID
Set-CIPolicyIdInfo -FilePath $SupplementalPath `
                   -SupplementsBasePolicyID $BasePolicyId `
                   -PolicyName "Finance-Department-Supplemental"
```

### Step 3: Configure Supplemental Policy Options

```powershell
# Supplemental policies must NOT have Option 17 set
# Remove it if accidentally present
Remove-RuleOption -FilePath $SupplementalPath -Option 17

# Option 18 (Disable Runtime FilePath Protection) is valid in supplementals
# Set it if you have FilePath rules that target non-admin-exclusive paths
# Set-RuleOption -FilePath $SupplementalPath -Option 18

# Supplementals should NOT have Option 3 (Audit Mode) — it's ignored
# Remove-RuleOption -FilePath $SupplementalPath -Option 3
```

### Step 4: Compile and Deploy Both Policies

```powershell
$BaseBin    = "C:\Policies\CorporateBase.bin"
$SuppBin    = "C:\Policies\FinanceDept-Supplemental.bin"
$ActiveDir  = "C:\Windows\System32\CodeIntegrity\CiPolicies\Active\"

# Get the base policy ID for file naming
$BasePolicyId = ([xml](Get-Content $BasePolicyPath)).SiPolicy.PolicyID

# Compile base policy
ConvertFrom-CIPolicy -XmlFilePath $BasePolicyPath -BinaryFilePath $BaseBin

# Compile supplemental policy
ConvertFrom-CIPolicy -XmlFilePath $SupplementalPath -BinaryFilePath $SuppBin

# Deploy base policy
Copy-Item -Path $BaseBin -Destination "$ActiveDir{$BasePolicyId}.p7" -Force

# Deploy supplemental (use its own PolicyID for the filename)
$SuppPolicyId = ([xml](Get-Content $SupplementalPath)).SiPolicy.PolicyID
Copy-Item -Path $SuppBin -Destination "$ActiveDir{$SuppPolicyId}.p7" -Force

Write-Host "Base and supplemental deployed."
```

### Removing a Supplemental Policy

```powershell
# To remove a supplemental policy, simply delete its binary from the active folder
$SuppPolicyId = "YOUR-SUPP-POLICY-GUID-HERE"
Remove-Item -Path "C:\Windows\System32\CodeIntegrity\CiPolicies\Active\{$SuppPolicyId}.p7" -Force

# With CiTool (Windows 11 22H2+):
& CiTool.exe --remove-policy "{$SuppPolicyId}"
```

### Inspecting Policy Relationships

```powershell
# List all active policies and their types
& "C:\Windows\System32\CiTool.exe" --list-policies

# Or parse the XML directly
$AllPolicies = Get-ChildItem "C:\Windows\System32\CodeIntegrity\CiPolicies\Active\" -Filter "*.p7"
foreach ($PolicyFile in $AllPolicies) {
    # Note: .p7 are binary files; you need your XML counterparts for inspection
    Write-Host "Active: $($PolicyFile.Name)"
}

# Inspect base policy ID from XML
$BasePolicyId = ([xml](Get-Content $BasePolicyPath)).SiPolicy.PolicyID
Write-Host "Base PolicyID: $BasePolicyId"

# Inspect supplemental's link to base
[xml]$Supp = Get-Content $SupplementalPath
Write-Host "Supplemental PolicyID: $($Supp.SiPolicy.PolicyID)"
Write-Host "Supplemental links to base: $($Supp.SiPolicy.BasePolicyID)"
```

---

## XML Representation

### Base Policy (must contain Option 17)

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Base Policy">

  <VersionEx>10.0.0.0</VersionEx>
  <PlatformID>{2E07F7E4-194C-4D20-B96C-1AEF9CF5A3CA}</PlatformID>

  <!--
    PolicyID and BasePolicyID are THE SAME for a base policy.
    This is how ci.dll identifies it as a base rather than a supplemental.
  -->
  <PolicyID>{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}</PolicyID>
  <BasePolicyID>{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}</BasePolicyID>

  <Rules>

    <Rule>
      <Option>Enabled:Update Policy No Reboot</Option>
    </Rule>

    <Rule>
      <Option>Enabled:Allow Supplemental Policies</Option>
    </Rule>

  </Rules>

  <FileRules>
  </FileRules>


</SiPolicy>
```

### Supplemental Policy (references the base via BasePolicyID)

```xml
<?xml version="1.0" encoding="utf-8"?>
<!--
  PolicyType="Supplemental Policy" tells ci.dll this is an extension, not a standalone base.
  The BasePolicyID MUST match the PolicyID of the base policy that has Option 17 enabled.
  The SupplementsBasePolicyID is an informational attribute that documents the relationship.
-->
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy" PolicyType="Supplemental Policy">

  <VersionEx>10.0.0.0</VersionEx>

  <!--
    PolicyID: Unique GUID for THIS supplemental policy.
    Used as the filename: {THIS-GUID}.p7 in CiPolicies\Active\
  -->
  <PolicyID>{F9E8D7C6-B5A4-3210-FEDC-BA9876543210}</PolicyID>

  <!--
    BasePolicyID: MUST equal the PolicyID of the base policy that has Option 17.
    This is the cryptographic link that ties this supplemental to its base.
    ci.dll validates this link at load time.
  -->
  <BasePolicyID>{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}</BasePolicyID>

  <Rules>
    <!--
      Supplemental policies can use Option 18 (Disable Runtime FilePath Rule Protection).
      They CANNOT use Options 3 (Audit Mode), 16 (No Reboot Update), or 17 (Allow Supplemental).
      Those are base-policy-only options.
    -->

  </Rules>

  <!--
    Supplemental FileRules — ADDITIVE ONLY.
    These expand the allow-list of the base. They cannot add deny rules
    that override the base, and they cannot remove base policy rules.
  -->
  <FileRules>
    <Allow ID="ID_ALLOW_BLOOMBERG" FriendlyName="Bloomberg Terminal - Publisher" FileName="*">
    </Allow>

    <Allow ID="ID_ALLOW_QB_HASH" FriendlyName="QuickBooks 2024" Hash="..." FileName="QBW32.exe" />
  </FileRules>

  <Signers>
  </Signers>

</SiPolicy>
```

---

## PolicyID Linking — How the Kernel Connects Base to Supplemental

This is the most critical technical detail for understanding why supplemental policies work (or fail).

```mermaid
flowchart TB
    subgraph DISK ["On-Disk Structure — CiPolicies\\Active\\"]
        BIN_BASE["{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}.p7\n(Base Policy Binary)"]
        BIN_SUPPA["{F9E8D7C6-B5A4-3210-FEDC-BA9876543210}.p7\n(Supplemental A Binary)"]
        BIN_SUPPB["{11223344-5566-7788-AABB-CCDDEEFF0011}.p7\n(Supplemental B Binary)"]
    end

    subgraph DECODE ["Decoded Policy Attributes"]
        BASE_ATTRS["Base Policy\nPolicyType = Base Policy\nPolicyID = A1B2C3D4...\nBasePolicyID = A1B2C3D4... ← same as PolicyID\nOption 17 = PRESENT"]
        SUPPA_ATTRS["Supplemental A\nPolicyType = Supplemental Policy\nPolicyID = F9E8D7C6...\nBasePolicyID = A1B2C3D4... ← points to base\nOption 17 = ABSENT"]
        SUPPB_ATTRS["Supplemental B\nPolicyType = Supplemental Policy\nPolicyID = 11223344...\nBasePolicyID = A1B2C3D4... ← points to base\nOption 17 = ABSENT"]
    end

    subgraph KERNEL_LINK ["Kernel Link Validation — ci.dll"]
        STEP1["1. Read all .p7 files in CiPolicies\\Active\\"]
        STEP2["2. Identify base policies:\n   where PolicyID == BasePolicyID"]
        STEP3["3. For each base, check Option 17"]
        STEP4["4. For supplementals: look up BasePolicyID\n   in list of loaded base policies"]
        STEP5["5. If matched base has Option 17:\n   link supplemental to base,\n   merge rules for evaluation"]
        STEP6["6. If base missing Option 17:\n   reject supplemental,\n   log Code Integrity event"]
    end

    BIN_BASE --> DECODE
    BIN_SUPPA --> DECODE
    BIN_SUPPB --> DECODE

    BASE_ATTRS --> STEP1
    SUPPA_ATTRS --> STEP1
    SUPPB_ATTRS --> STEP1

    STEP1 --> STEP2 --> STEP3 --> STEP4 --> STEP5 --> STEP6

    style BIN_BASE fill:#162032,color:#58a6ff
    style BIN_SUPPA fill:#0d1f12,color:#86efac
    style BIN_SUPPB fill:#1c1c2e,color:#a5b4fc
    style BASE_ATTRS fill:#162032,color:#58a6ff
    style SUPPA_ATTRS fill:#0d1f12,color:#86efac
    style SUPPB_ATTRS fill:#1c1c2e,color:#a5b4fc
    style STEP1 fill:#1a1a0d,color:#fde68a
    style STEP2 fill:#1a1a0d,color:#fde68a
    style STEP3 fill:#1a1a0d,color:#fde68a
    style STEP4 fill:#1a1a0d,color:#fde68a
    style STEP5 fill:#0d1f12,color:#86efac
    style STEP6 fill:#1f0d0d,color:#fca5a5
```

### The GUID Chain — Why It Cannot Be Forged (Signed Policies)

When using **signed policies**, the GUID linkage is protected by cryptographic signatures:

```mermaid
flowchart LR
    subgraph SIGNING ["Policy Signing Chain"]
        BASE_SIGN["Base Policy\nSigned by: Corporate CA\nContains: PolicyID = GUID-BASE\nOption 17 present\nSignature protects entire XML content"]
        SUPP_SIGN["Supplemental Policy\nSigned by: Team CA\nContains: BasePolicyID = GUID-BASE\nSignature protects BasePolicyID value"]
    end

    subgraph ATTACK ["Attack Scenario — Fails With Signed Policies"]
        ATTACKER["Attacker creates:\nFake supplemental\nBasePolicyID = GUID-BASE\nPermissive rules\n(unsigned)"]
        KERNEL_REJECT["ci.dll:\nSignature check fails\nFake supplemental rejected\nBase policy integrity intact"]
    end

    BASE_SIGN -- "GUID-BASE embedded in\nboth, protected by signatures" --> SUPP_SIGN
    ATTACKER -- "Unsigned policy attempt" --> KERNEL_REJECT

    style BASE_SIGN fill:#162032,color:#58a6ff
    style SUPP_SIGN fill:#0d1f12,color:#86efac
    style ATTACKER fill:#1f0d0d,color:#fca5a5
    style KERNEL_REJECT fill:#1f0d0d,color:#fca5a5
```

**Critical Security Note:** If the base policy is **unsigned**, any party who can write to `CiPolicies\Active\` can create a fake supplemental policy with a matching `BasePolicyID` and load arbitrary allow rules. Always use signed policies in production environments where Option 17 is active.

---

## How ci.dll Loads and Evaluates Both Policies

### Boot-Time Policy Loading

```mermaid
sequenceDiagram
    participant BOOT as Windows Boot Loader
    participant CI as ci.dll (Code Integrity)
    participant FS as CiPolicies\Active\ (File System)
    participant MEM as Kernel Policy Memory

    Note over BOOT,CI: System Boot — Early Kernel Initialization
    BOOT ->> CI: Initialize Code Integrity subsystem
    CI ->> FS: Enumerate all .p7 policy files

    CI ->> CI: Parse each policy binary
    CI ->> CI: Identify base policies (PolicyID == BasePolicyID)
    CI ->> CI: Validate base policy signatures (if signed)

    Note over CI: Process base policy with Option 17
    CI ->> MEM: Load base policy rules into kernel memory
    CI ->> CI: Record base PolicyID = {GUID-BASE} as accepting supplementals

    Note over CI: Process supplemental policies
    CI ->> CI: For each supplemental: look up BasePolicyID in loaded bases
    CI ->> CI: Validate supplemental signature (if signed)
    CI ->> CI: Confirm base has Option 17 — PASS
    CI ->> MEM: Merge supplemental rules into base policy evaluation set
    Note over MEM: Combined rule set = Base + All valid supplementals

    Note over CI,MEM: Runtime — Every Binary Execution
    CI ->> MEM: Evaluate binary against combined rule set
    MEM -->> CI: Result: ALLOW or BLOCK
```

### Rule Merging Logic at Evaluation Time

```mermaid
flowchart TD
    BINARY["Binary: example.exe\nHash: ABC123\nSigner: ACME Corp"]

    subgraph EVAL ["Evaluation — ci.dll checks COMBINED rule set"]
        BASE_CHECK{"Does BASE POLICY\nallow this binary?\n(Windows components,\nMicrosoft signer, etc.)"}
        SUPPA_CHECK{"Does SUPPLEMENTAL A\nallow this binary?\n(Finance apps)"}
        SUPPB_CHECK{"Does SUPPLEMENTAL B\nallow this binary?\n(IT Operations tools)"}
        DENY_CHECK{"Does BASE POLICY\nDENY this binary?\n(Known malware,\nexplicit blocks)"}
    end

    BINARY --> DENY_CHECK
    DENY_CHECK -- "YES — Deny rule matches" --> BLOCK_FINAL(["BLOCK — Deny takes precedence\nover any allow rule"])
    DENY_CHECK -- "No deny match" --> BASE_CHECK

    BASE_CHECK -- "YES — Base allows" --> ALLOW_FINAL(["ALLOW"])
    BASE_CHECK -- "No base allow" --> SUPPA_CHECK
    SUPPA_CHECK -- "YES — Supplemental A allows" --> ALLOW_FINAL
    SUPPA_CHECK -- "No match" --> SUPPB_CHECK
    SUPPB_CHECK -- "YES — Supplemental B allows" --> ALLOW_FINAL
    SUPPB_CHECK -- "No match in any policy" --> BLOCK_DEFAULT(["BLOCK — No allow rule found"])

    style BINARY fill:#162032,color:#58a6ff
    style BASE_CHECK fill:#1a1a0d,color:#fde68a
    style SUPPA_CHECK fill:#1a1a0d,color:#fde68a
    style SUPPB_CHECK fill:#1a1a0d,color:#fde68a
    style DENY_CHECK fill:#1f0d0d,color:#fca5a5
    style BLOCK_FINAL fill:#1f0d0d,color:#fca5a5
    style ALLOW_FINAL fill:#0d1f12,color:#86efac
    style BLOCK_DEFAULT fill:#1f0d0d,color:#fca5a5
```

**Key rule: Base policy DENY rules always win.** No supplemental can override a deny rule in the base. This is the guarantee that maintains the security floor.

---

## Interaction with Other Options

```mermaid
flowchart LR
    subgraph BASE_OPT ["Base Policy Options — Influence on Supplemental Behavior"]
        O16["Option 16\nUpdate Policy No Reboot\nIf base has Option 16,\nsupplemental additions\nand removals also take\neffect without reboot"]
        O3["Option 3\nAudit Mode\nBase in audit mode:\nboth base AND supplemental\nrules are audit-only.\nSupplemental cannot\npush to enforce mode."]
        O14["Option 14\nISG Authorization\nISG applies globally.\nSupplementals cannot\nchange ISG behavior."]
        O15["Option 15\nInvalidate EAs on Reboot\nEA lifecycle is base-only.\nSupplementals cannot\naffect ISG EA caching."]
    end

    subgraph SUBJECT ["This Option"]
        O17["Option 17\nEnabled:Allow\nSupplemental Policies\n(Base policy only)"]
    end

    subgraph SUPP_OPT ["Supplemental-Specific Options"]
        O18["Option 18\nDisable Runtime FilePath\nRule Protection\nCAN be set in supplementals.\nAffects FilePath rules\nwithin that supplemental."]
    end

    O16 -- "Supplementals also\nhot-reload when base\nhas Option 16" --> O17
    O3 -- "Enforcement mode\npropagates from base;\nSupplementals cannot\noverride" --> O17
    O14 -- "ISG settings\ncannot be changed\nby supplementals" --> O17
    O15 -- "EA lifecycle\ncannot be changed\nby supplementals" --> O17
    O17 -- "Supplemental policies\nmay use Option 18" --> O18

    style O16 fill:#0d1f12,color:#86efac
    style O3 fill:#1a1a0d,color:#fde68a
    style O14 fill:#1c1c2e,color:#a5b4fc
    style O15 fill:#1c1c2e,color:#a5b4fc
    style O17 fill:#162032,color:#58a6ff
    style O18 fill:#0d1f12,color:#86efac
```

### Option Compatibility Matrix

| Option | Relationship | Notes |
|--------|-------------|-------|
| **3 — Audit Mode** | Inherited by supplementals | If the base is in audit mode, supplemental rules are also audit-only. Supplementals cannot switch to enforce mode independently. |
| **16 — Update Policy No Reboot** | Enables hot-reload for supplementals | When the base has Option 16, deploying/removing supplementals also takes effect without reboot. |
| **14 — ISG Authorization** | Base-only, cannot be changed by supplementals | Supplementals cannot enable or disable ISG. |
| **15 — Invalidate EAs on Reboot** | Base-only, cannot be changed by supplementals | EA lifecycle is a base-policy concern. |
| **18 — Disable Runtime FilePath Protection** | Valid in supplementals | The only option that can appear in supplemental policies. |

---

## When to Enable vs Disable

```mermaid
flowchart TD
    START([Is OS Windows 10 1903+\nor Server 2022+?]) --> NOTSUPPORTED{No}
    START --> SUPPORTED{Yes}

    NOTSUPPORTED --> BLOCK_OS(["Option 17 not supported on this OS.\nDo not set — supplemental\nmechanism is unavailable."])

    SUPPORTED --> Q1{Does your organization\nhave multiple business\nunits or teams with\ndifferent software needs?}
    Q1 -- Yes --> ENABLE_STRONG(["ENABLE Option 17\nHub-and-spoke governance\nCentral security floor +\nDistributed customization"])

    Q1 -- No --> Q2{Do you have staged rollout\nor A/B testing needs\nfor new application approvals?}
    Q2 -- Yes --> ENABLE_STRONG

    Q2 -- No --> Q3{Is this a single-purpose\ndevice: kiosk, ATM,\nfixed-function terminal?}
    Q3 -- Yes --> DISABLE(["CONSIDER DISABLING Option 17\nMonolithic base policy\nis simpler and more\nattack-resistant for\nfixed-function devices.\nNo supplemental attack surface."])

    Q3 -- No --> Q4{Do you need the ability\nto temporarily authorize\napps for maintenance\nwindows without base\npolicy changes?}
    Q4 -- Yes --> ENABLE_STRONG

    Q4 -- No --> Q5{Do you use Intune\nor MDM for policy\ndistribution to multiple\ndepartment groups?}
    Q5 -- Yes --> ENABLE_STRONG
    Q5 -- No --> OPTIONAL(["OPTIONAL\nEnable for future flexibility.\nNo harm in having it\nif supplementals are\nnot actively deployed."])

    style START fill:#162032,color:#58a6ff
    style NOTSUPPORTED fill:#1f0d0d,color:#fca5a5
    style SUPPORTED fill:#0d1f12,color:#86efac
    style Q1 fill:#1a1a0d,color:#fde68a
    style Q2 fill:#1a1a0d,color:#fde68a
    style Q3 fill:#1a1a0d,color:#fde68a
    style Q4 fill:#1a1a0d,color:#fde68a
    style Q5 fill:#1a1a0d,color:#fde68a
    style ENABLE_STRONG fill:#0d1f12,color:#86efac
    style DISABLE fill:#1f0d0d,color:#fca5a5
    style OPTIONAL fill:#1c1c2e,color:#a5b4fc
    style BLOCK_OS fill:#1f0d0d,color:#fca5a5
```

---

## Real-World Scenario / End-to-End Walkthrough

**Scenario:** A financial services firm is deploying App Control across 5,000 workstations. The central security team owns the base policy. The Finance department needs Bloomberg Terminal, the IT Operations team needs Sysinternals tools, and the Development team needs their IDE and build tools — all without the security team having to touch the base policy for every new application request.

```mermaid
sequenceDiagram
    actor SecTeam as Security Team
    actor FinanceIT as Finance IT Admin
    actor OpsIT as IT Operations
    actor DevLead as Development Lead
    participant MDM as Intune / MDM
    participant Endpoint as Windows Endpoint<br/>(ci.dll)

    Note over SecTeam: Phase 1 — Base Policy Deployment
    SecTeam ->> SecTeam: Create base policy\n• Allow Windows components\n• Allow Microsoft signer\n• Deny known malware\n• Set Option 17 (Allow Supplemental)\n• Set Option 16 (No Reboot Update)
    SecTeam ->> MDM: Upload base policy binary
    MDM ->> Endpoint: Deploy base policy to all 5,000 endpoints
    Endpoint ->> Endpoint: ci.dll loads base policy\nOption 17 active: accepting supplementals

    Note over FinanceIT: Phase 2 — Finance Supplemental Policy
    FinanceIT ->> FinanceIT: Scan Bloomberg Terminal\nGet-FileHash all executables\nCapture publisher certificate
    FinanceIT ->> FinanceIT: Create supplemental policy XML\nBasePolicyID = {GUID-BASE}
    FinanceIT ->> SecTeam: Submit supplemental for review
    SecTeam ->> SecTeam: Review: confirms only Bloomberg\nrules added, no security bypass
    SecTeam -->> FinanceIT: Approved ✓
    FinanceIT ->> MDM: Upload supplemental binary
    MDM ->> Endpoint: Deploy Finance supplemental\nto Finance department device group only
    Endpoint ->> Endpoint: ci.dll links supplemental to base\n(BasePolicyID match + Option 17 present)\nBloomberg Terminal now allowed on Finance endpoints

    Note over OpsIT: Phase 3 — IT Operations Supplemental
    OpsIT ->> OpsIT: Create supplemental for Sysinternals tools\nBasePolicyID = {GUID-BASE}
    OpsIT ->> MDM: Deploy to IT Admin device group
    MDM ->> Endpoint: Supplemental deployed to IT admin machines
    Endpoint ->> Endpoint: Sysinternals now allowed on IT admin endpoints

    Note over DevLead: Phase 4 — Development Supplemental
    DevLead ->> DevLead: Create supplemental for IDE + build tools\nBasePolicyID = {GUID-BASE}
    DevLead ->> MDM: Deploy to Developer device group
    MDM ->> Endpoint: Supplemental deployed to dev machines
    Endpoint ->> Endpoint: IDE and build tools allowed on dev endpoints

    Note over SecTeam,Endpoint: Each endpoint group has DIFFERENT effective policies
    Note over SecTeam: Base policy: UNCHANGED throughout this entire process
    Note over Endpoint: Finance endpoint: Base + Finance supplemental
    Note over Endpoint: IT Admin endpoint: Base + IT Operations supplemental
    Note over Endpoint: Dev endpoint: Base + Dev supplemental
    Note over Endpoint: Standard user endpoint: Base only
```

### Governance Structure Achieved

```mermaid
flowchart TD
    subgraph GOVERNANCE ["Enterprise Policy Governance"]
        SEC["Security Team\nOwns: Base Policy\n• Controls: Security floor\n• Controls: Deny rules\n• Controls: ISG settings\n• Approves: Supplemental requests"]

        FIN["Finance IT Admin\nOwns: Finance Supplemental\n• Bloomberg Terminal\n• QuickBooks\n• Internal finance app"]

        OPS["IT Operations\nOwns: Ops Supplemental\n• Sysinternals tools\n• Remote management agents\n• Monitoring tools"]

        DEV["Development Lead\nOwns: Dev Supplemental\n• JetBrains IDEs\n• Node.js / Python\n• Build tools"]
    end

    SEC -- "Sets security baseline\napproves supplemental use" --> FIN
    SEC -- "Sets security baseline" --> OPS
    SEC -- "Sets security baseline" --> DEV

    style SEC fill:#162032,color:#58a6ff
    style FIN fill:#0d1f12,color:#86efac
    style OPS fill:#1c1c2e,color:#a5b4fc
    style DEV fill:#1a1a0d,color:#fde68a
```

---

## What Happens If You Get It Wrong

### Scenario A: Option 17 absent in base — supplemental policies silently rejected

**Symptom:** You deploy a supplemental policy with correct `BasePolicyID` linking. Applications covered by the supplemental still block. Event Viewer shows Code Integrity events indicating the binary is not authorized.

**Root cause:** Without Option 17 in the base, `ci.dll` will not accept any supplemental policies, regardless of their `BasePolicyID`. The supplemental binary sits in `CiPolicies\Active\` but is never linked or evaluated.

**Resolution:** Add Option 17 to the base policy and redeploy. If Option 16 is also set, the change takes effect without a reboot.

**Detection:**
```powershell
# Check if Option 17 is in the base policy XML
[xml]$Policy = Get-Content $BasePolicyPath
$hasOpt17 = $Policy.SiPolicy.Rules.Rule | Where-Object { $_.Option -eq "Enabled:Allow Supplemental Policies" }
if ($hasOpt17) { "Option 17 present" } else { "Option 17 MISSING — supplementals will not load" }
```

### Scenario B: Wrong BasePolicyID in supplemental

**Symptom:** Identical to Scenario A. Supplemental deployed but rules not enforced.

**Root cause:** The `BasePolicyID` in the supplemental XML does not match the `PolicyID` of any loaded base policy.

**Common cause:** Copy-paste error when creating supplemental XML; using the base policy's `BasePolicyID` field (which equals `PolicyID` in a base) from a different policy; GUID format mismatch (e.g., missing braces).

**Resolution:** Verify the GUIDs match exactly:
```powershell
$BaseGuid = ([xml](Get-Content $BasePolicyPath)).SiPolicy.PolicyID
$SuppBaseRef = ([xml](Get-Content $SuppPath)).SiPolicy.BasePolicyID
if ($BaseGuid -eq $SuppBaseRef) {
    "GUIDs match ✓"
} else {
    "MISMATCH: Base='$BaseGuid', Supplemental references='$SuppBaseRef'"
}
```

### Scenario C: Option 17 set on a supplemental policy

**Symptom:** Policy compilation may succeed, but the option is meaningless and ignored. A supplemental policy cannot itself accept sub-supplemental policies. There is no "supplemental of a supplemental" in the App Control model.

**Resolution:** Remove Option 17 from supplemental policies. The multi-policy tree is intentionally flat (one level of hierarchy: base → supplemental). There are no grandchild supplementals.

### Scenario D: Supplemental policy with deny rules — rules silently ignored

**Symptom:** You add a deny rule to a supplemental policy expecting it to block an application. The application still runs if allowed by another rule (base or supplemental allow).

**Root cause:** Deny rules in supplemental policies are **not evaluated**. Only allow rules in supplemental policies affect the combined evaluation set. The deny rule is parsed but discarded at evaluation time.

**Resolution:** All deny rules must be placed in the **base policy**. This is by design — supplementals can only expand permissions, not restrict them.

### Scenario E: Unsigned base policy with Option 17 — supplemental injection attack

**Risk:** If the base policy is unsigned, an attacker with write access to `CiPolicies\Active\` can craft a supplemental policy with `BasePolicyID` matching the base, containing permissive allow rules (e.g., allow all by path). Because the base has Option 17 and is unsigned, there is no signature chain to validate, so `ci.dll` will accept the attacker's supplemental.

**Mitigation:**
1. Use signed policies in all production environments
2. Lock down `CiPolicies\Active\` folder ACLs to SYSTEM + Administrators only
3. Enable Windows Defender Credential Guard and HVCI for additional kernel protection
4. Monitor for unexpected policy additions via Code Integrity Event ID 3099

---

## Valid for Supplemental Policies?

**No.** Option 17 is only valid in **base policies**, and this restriction is fundamental to the architecture.

The multi-policy model is intentionally **one level deep**: base policies can have supplementals, but supplemental policies cannot themselves have sub-supplementals. This flat hierarchy ensures:

1. **Predictable evaluation:** The evaluation model remains simple — base rules plus one set of supplemental expansions. There is no recursive policy tree to trace.
2. **Clear security floor:** The base policy's authority is unambiguous. Allowing supplementals-of-supplementals would create potential for authority laundering (a permissive supplemental-of-supplemental appearing to be authorized by a strict intermediate supplemental).
3. **Administrative clarity:** Policy ownership is clear — the base policy team always knows exactly which policies are expanding their rule set.

If you set Option 17 in a supplemental policy, `ci.dll` ignores it. The supplemental cannot become a pseudo-base.

---

## OS Version Requirements

| Operating System | Minimum Version Required | Notes |
|-----------------|--------------------------|-------|
| Windows 10 | **1903 (May 2019 Update, Build 18362)** | Minimum required; earlier builds cannot load supplemental policies |
| Windows 11 | All versions | Fully supported |
| Windows Server | **2022** | Windows Server 2019 does NOT support supplemental policies |
| Windows Server Core | 2022+ | Supported |

### Checking OS Version

```powershell
$Build = [int](Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion").CurrentBuildNumber
Write-Host "Current build: $Build"
if ($Build -ge 18362) {
    Write-Host "Option 17 / Supplemental Policies: SUPPORTED"
} elseif ($Build -ge 16299) {
    Write-Host "Option 16 (no reboot update): SUPPORTED"
    Write-Host "Option 17 (supplemental policies): NOT SUPPORTED on this build"
} else {
    Write-Host "Basic App Control only. Options 16 and 17 not supported."
}
```

**Windows Server 2019 note:** This is a common trap. Server 2019 supports Option 16 (no-reboot updates) but does **not** support Option 17 (supplemental policies). You need Server 2022 or later for supplemental policy support on server OS.

---

## Summary Table

| Attribute | Value |
|-----------|-------|
| **Option Number** | 17 |
| **Full Option String** | `Enabled:Allow Supplemental Policies` |
| **Rule Type** | Enabled (presence = active) |
| **Dependencies** | None (self-contained; supplementals need matching BasePolicyID) |
| **Effect** | Base policy accepts supplemental policies that expand its allow-list |
| **Architecture** | Hub-and-spoke: one base, multiple independent supplementals |
| **Deny Rule Behavior** | Base deny rules override any supplemental allow rules |
| **Supplemental Limitation** | Supplementals can only ADD allow rules, never restrict |
| **Security Risk (if enabled)** | Unsigned base + write access to CiPolicies\Active\ = supplemental injection |
| **Mitigation** | Use signed policies in production |
| **Valid in Base Policy** | **Yes** |
| **Valid in Supplemental Policy** | **No** |
| **Minimum OS — Windows 10** | **Version 1903 (Build 18362)** |
| **Minimum OS — Windows Server** | **2022** (NOT 2019) |
| **PowerShell Enable** | `Set-RuleOption -FilePath $BasePolicyPath -Option 17` |
| **PowerShell Disable** | `Remove-RuleOption -FilePath $BasePolicyPath -Option 17` |
| **XML Tag** | `<Option>Enabled:Allow Supplemental Policies</Option>` |
| **PolicyID link** | Supplemental's `<BasePolicyID>` must equal base's `<PolicyID>` |
