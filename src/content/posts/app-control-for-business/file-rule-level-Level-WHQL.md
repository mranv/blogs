---
title: 'WDAC File Rule Level: WHQL'
author: Anubhav Gain
pubDatetime: 2026-05-03T10:00:00.000Z
slug: file-rule-level-level-whql
draft: false
featured: false
description: '> Windows Hardware Quality Lab signing — a Microsoft-operated certification program that tests and cryptographically endorses hardware drivers. The WHQL level i'
tags:
- windows-security
- app-control-for-business
- wdac
- endpoint-security
- file-rule-levels
category: WDAC File Rule Levels
lang: en
---
# WDAC File Rule Level: WHQL

> Windows Hardware Quality Lab signing — a Microsoft-operated certification program that tests and cryptographically endorses hardware drivers. The WHQL level in App Control for Business allows files that carry the WHQL Extended Key Usage (EKU) in their signing certificate chain.

---

## Table of Contents

1. [Overview](#1-overview)
2. [What WHQL Is — Background](#2-what-whql-is--background)
3. [The WHQL Certification Process](#3-the-whql-certification-process)
4. [How the WHQL Level Works Technically](#4-how-the-whql-level-works-technically)
5. [The WHQL EKU — OID and Hex Encoding](#5-the-whql-eku--oid-and-hex-encoding)
6. [Certificate Chain / Trust Anatomy](#6-certificate-chain--trust-anatomy)
7. [Where in the Evaluation Stack](#7-where-in-the-evaluation-stack)
8. [XML Representation](#8-xml-representation)
9. [PowerShell Examples](#9-powershell-examples)
10. [WHQL vs. Option 02 (Required:WHQL)](#10-whql-vs-option-02-requiredwhql)
11. [Pros & Cons Table](#11-pros--cons-table)
12. [Attack Resistance Analysis — BYOVD Context](#12-attack-resistance-analysis--byovd-context)
13. [When to Use vs. When to Avoid — Decision Flowchart](#13-when-to-use-vs-when-to-avoid--decision-flowchart)
14. [Real-World Scenario: End-to-End Sequence](#14-real-world-scenario-end-to-end-sequence)
15. [OS Version & Compatibility](#15-os-version--compatibility)
16. [Common Mistakes & Gotchas](#16-common-mistakes--gotchas)
17. [Summary Table](#17-summary-table)

---

## 1. Overview

The `WHQL` file rule level in App Control for Business allows the execution of files whose signing certificate chain contains the **Windows Hardware Quality Lab EKU** (Extended Key Usage). This EKU is placed in certificates issued by Microsoft specifically to drivers and hardware firmware that have passed the Hardware Lab Kit (HLK) test suite and received Microsoft's certification.

Key characteristics of this level:

- **Primarily for kernel-mode binaries:** Drivers (.sys files) and related kernel-mode components are the typical targets. User-mode binaries are rarely WHQL-signed.
- **EKU-based trust:** Unlike most other WDAC levels that key off certificate subject names or thumbprints, WHQL trust is determined by the presence of a specific OID in the certificate's Extended Key Usage extension.
- **Broad by design:** Trusts any driver that Microsoft has certified, regardless of which hardware vendor submitted it.
- **Connected to but distinct from Option 02:** The policy option `Required:WHQL` (Rule Option 02) mandates that all kernel drivers be WHQL-certified; the WHQL rule level is a different concept — it's the trust grant for files that *are* WHQL-signed.

---

## 2. What WHQL Is — Background

### Windows Hardware Quality Lab

The Windows Hardware Quality Lab (WHQL) program, now operationally known as the **Windows Hardware Compatibility Program (WHCP)**, is Microsoft's certification framework for hardware drivers and devices. The program:

1. Defines a test suite (the **Hardware Lab Kit, HLK**) that driver vendors must run against their hardware
2. Requires vendors to submit test results to Microsoft through the **Windows Hardware Dev Center portal**
3. Issues a **WHQL-signed driver package** after verifying the test results meet certification requirements

WHQL signing is distinct from standard Authenticode signing. A regular Authenticode certificate (from DigiCert, Sectigo, etc.) allows a vendor to self-sign their driver with their own identity. WHQL signing means **Microsoft itself cryptographically endorses** the driver using a certificate with the WHQL EKU embedded.

### Why WHQL Matters to WDAC

Before WDAC, the primary kernel-mode trust mechanism was the **kernel-mode code signing policy** introduced in Windows Vista 64-bit (which required all kernel drivers to be signed). WDAC extends this by allowing organizations to specify *which* signed drivers they permit.

The `WHQL` level is the most practical way to allow all properly-certified drivers without enumerating every driver vendor individually. It represents Microsoft's explicit endorsement: "We tested this driver, it met our quality bar, and we signed it with our WHQL certificate."

---

## 3. The WHQL Certification Process

```mermaid
sequenceDiagram
    participant Vendor as Hardware Vendor
    participant HLK as HLK Test Lab (Vendor's)
    participant Portal as Windows Hardware Dev Center
    participant MSFT as Microsoft WHQL Team
    participant Sign as Microsoft Signing Service
    participant Driver as WHQL-Signed Driver Package

    Vendor->>HLK: Run Hardware Lab Kit test suite against device
    HLK-->>Vendor: HLK test results (.hlkx package)
    
    Vendor->>Portal: Submit HLK results via Dev Center portal
    Portal->>MSFT: Routes submission for review
    MSFT->>MSFT: Verify test results meet WHCP requirements
    MSFT->>MSFT: Review driver package integrity
    
    alt Tests Pass
        MSFT->>Sign: Approve driver for WHQL signing
        Sign->>Sign: Signs driver with Microsoft's WHQL certificate\n(contains WHQL EKU OID 1.3.6.1.4.1.311.10.3.5)
        Sign-->>Driver: Returns signed .sys + .inf + catalog file
        Driver-->>Vendor: Certified driver package available for download
        Note over Driver,Vendor: Driver is now WHQL-certified\nci.dll WHQL EKU check will pass
    else Tests Fail
        MSFT-->>Vendor: Rejection with failure details
        Vendor->>HLK: Fix driver issues, re-test
    end
```

The critical output of this process is a driver package where the `.sys` file (and associated catalog) carries a signature from Microsoft's WHQL signing certificate — a certificate that includes the WHQL EKU OID. This is what WDAC's WHQL level checks for.

---

## 4. How the WHQL Level Works Technically

When `ci.dll` (the kernel's Code Integrity component) evaluates a file against a WDAC policy containing WHQL rules, it performs the following checks:

### Step 1: Is the file kernel-mode?

WHQL rules are evaluated in the **kernel-mode signing scenario**. For user-mode binaries, different rule sets apply. The evaluation context is determined by how the binary is being loaded:
- Kernel drivers loaded via `IoLoadDriver` → kernel-mode scenario
- Executables and DLLs loaded via the process loader → user-mode scenario

### Step 2: Does the certificate chain contain the WHQL EKU?

`ci.dll` walks the certificate chain from the leaf certificate upward. At each level, it checks the Extended Key Usage extension for the presence of OID `1.3.6.1.4.1.311.10.3.5` (Windows Hardware Driver Verification).

The EKU can appear in:
- The **leaf certificate** (most common for WHQL-signed drivers)
- An **intermediate CA certificate** (for enterprise CA hierarchies, less common)

### Step 3: Does the chain root in a trusted WHQL root?

Microsoft uses two root CAs for WHQL signing:
1. **Microsoft Product Root 2010** — for drivers signed after 2010
2. **Microsoft Code Verification Root** — for older drivers signed under the previous root

The chain must root in one of these Microsoft-operated roots. This prevents third-party CAs from issuing "WHQL-like" certificates.

### Step 4: WDAC Policy Rule Match

If a WHQL Signer rule exists in the policy and the above checks pass, the file is allowed. If no WHQL rule exists, the file evaluation continues to other applicable rules.

---

## 5. The WHQL EKU — OID and Hex Encoding

The WHQL EKU has the following OID:

```
OID (dotted decimal): 1.3.6.1.4.1.311.10.3.5
OID meaning:         Microsoft → Products → OIDs → WHQL-related → Windows Hardware Driver Verification
```

In WDAC XML, EKUs are represented as hexadecimal DER-encoded OID values. The encoding process:

1. Start with the OID in dotted decimal: `1.3.6.1.4.1.311.10.3.5`
2. Prepend the ASN.1 OID tag `06` (object identifier)
3. Encode the OID value per BER/DER OID encoding rules
4. Express as uppercase hex

The result:

```
DER-encoded WHQL EKU value: 010A2B0601040182370A0305
```

Breaking down the hex encoding:
- `01` — Length byte (context-dependent in WDAC's encoding format)
- `0A` — Length of the OID content (10 bytes)
- `2B` — Encodes the first two OID components (1.3 → 40×1+3=43=0x2B)
- `06 01 04 01 82 37 0A 03 05` — Remaining OID components encoded per BER rules
  - `06` = 6
  - `01` = 1
  - `04` = 4
  - `01` = 1
  - `82 37` = 311 (multi-byte encoding: 0x82=high byte flag, 0x37=55 → 311)
  - `0A` = 10
  - `03` = 3
  - `05` = 5

In WDAC XML, this appears as:

```xml
<EKU ID="ID_EKU_WHQL" Value="010A2B0601040182370A0305" />
```

---

## 6. Certificate Chain / Trust Anatomy

```mermaid
graph TB
    subgraph "WHQL Certificate Chain"
        ROOT["Microsoft Product Root 2010\nOR\nMicrosoft Code Verification Root\n(Self-Signed, air-gapped HSM at Microsoft)"]:::root

        MSWHQL_CA["Microsoft Windows Hardware\nCompatibility PCA 2021\n(Intermediate CA — WHQL signing)"]:::pca

        LEAF["Microsoft Windows Hardware\nCompatibility Publisher\nEKU: 1.3.6.1.4.1.311.10.3.5\n(WHQL EKU present in leaf cert)"]:::pca

        DRIVER["nvlddmkm.sys\nNVIDIA Display Adapter Driver\nSigned by Microsoft's WHQL signing service\non behalf of NVIDIA's submission"]:::file

        subgraph "EKU Extension in Leaf Cert"
            EKU1["Code Signing (1.3.6.1.5.5.7.3.3)"]:::node
            EKU2["Windows Hardware Driver Verification\n(1.3.6.1.4.1.311.10.3.5) ← WHQL EKU"]:::allow
        end
    end

    ROOT --> MSWHQL_CA
    MSWHQL_CA --> LEAF
    LEAF --> DRIVER
    LEAF -.->|"contains"| EKU1
    LEAF -.->|"contains"| EKU2

    classDef root fill:#1a0d2e,stroke:#6b21a8,color:#d8b4fe
    classDef pca fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef leaf fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef file fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef allow fill:#0d1f12,stroke:#1a5c2a,color:#86efac
    classDef node fill:#162032,stroke:#1e3a5f,color:#e2e8f0
```

**Important note on WHQL signing mechanics:** Unlike standard Authenticode where the *vendor* signs their own binary with their *own* private key, WHQL-signed drivers are signed by **Microsoft's private key** (on behalf of the vendor's submission). The vendor submits the driver to Microsoft's portal, and Microsoft signs it. This is why WHQL certs chain to Microsoft roots, not to vendor roots.

---

## 7. Where in the Evaluation Stack

```mermaid
flowchart TD
    START(["Kernel Driver Load Requested\n(e.g., nvlddmkm.sys)"]):::node

    SCENARIO{"Kernel-mode or\nUser-mode context?"}:::node
    USER_PATH["User-mode rule evaluation\n(different rule set applies)"]:::node

    HASH_CHECK{"Hash rule\nexists for this .sys file?"}:::node
    HASH_ALLOW(["ALLOW — Hash match\n(most specific)"]):::allow

    FP_CHECK{"FilePublisher/WHQLFilePublisher rule\nexists? (EKU + CN + filename + version)"}:::node
    FP_ALLOW(["ALLOW — WHQLFilePublisher match"]):::allow

    PUB_CHECK{"Publisher/WHQLPublisher rule\nexists? (EKU + leaf CN)"}:::node
    PUB_ALLOW(["ALLOW — WHQLPublisher match"]):::allow

    WHQL_CHECK{"WHQL rule exists?\n(EKU OID 1.3.6.1.4.1.311.10.3.5\nin cert chain?)"}:::node
    WHQL_ALLOW(["ALLOW — WHQL EKU match\n(any WHQL-certified driver)"]):::allow

    PCA_CHECK{"PcaCertificate rule\nexists for signer chain?"}:::node
    PCA_ALLOW(["ALLOW — PcaCertificate match"]):::allow

    DEFAULT{"Default action?"}:::node
    BLOCK(["BLOCK — Kernel driver\nnot authorized"]):::block
    AUDIT(["AUDIT LOG — allowed in\naudit mode, blocked in enforce"]):::warn

    START --> SCENARIO
    SCENARIO -->|"Kernel-mode"| HASH_CHECK
    SCENARIO -->|"User-mode"| USER_PATH
    HASH_CHECK -->|"Yes"| HASH_ALLOW
    HASH_CHECK -->|"No"| FP_CHECK
    FP_CHECK -->|"Yes"| FP_ALLOW
    FP_CHECK -->|"No"| PUB_CHECK
    PUB_CHECK -->|"Yes"| PUB_ALLOW
    PUB_CHECK -->|"No"| WHQL_CHECK
    WHQL_CHECK -->|"Yes — EKU found in chain"| WHQL_ALLOW
    WHQL_CHECK -->|"No"| PCA_CHECK
    PCA_CHECK -->|"Yes"| PCA_ALLOW
    PCA_CHECK -->|"No"| DEFAULT
    DEFAULT -->|"DefaultDeny"| BLOCK
    DEFAULT -->|"Audit mode"| AUDIT

    classDef node fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef allow fill:#0d1f12,stroke:#1a5c2a,color:#86efac
    classDef block fill:#1f0d0d,stroke:#7f1d1d,color:#fca5a5
    classDef warn fill:#1a1a0d,stroke:#7a6a00,color:#fde68a
```

The WHQL level sits **between** `WHQLPublisher`/`WHQLFilePublisher` (more specific) and `PcaCertificate` (broader but different concept). More specific WHQL-based rules are checked first.

---

## 8. XML Representation

A complete WHQL rule in App Control for Business XML consists of two parts:
1. An **EKU element** defining the WHQL OID
2. A **Signer element** referencing that EKU

### Full XML Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<SiPolicy xmlns="urn:schemas-microsoft-com:sipolicy">
  
  <EKUs>
    <EKU ID="ID_EKU_WHQL" Value="010A2B0601040182370A0305" />
  </EKUs>

  <Signers>
    <!--
      WHQL Signer: Trusts any file whose cert chain:
      1. Contains the WHQL EKU (defined above)
      2. Chains to Microsoft's WHQL root
      This does NOT restrict to a specific vendor — any WHQL-certified driver matches.
    -->
    <Signer ID="ID_SIGNER_WHQL_KERNEL" Name="Windows Hardware Quality Lab (WHQL) - Kernel Mode">
      <CertRoot Type="TBS" Value="3085A90B03EE71B6B33F5EA8A07DBBD40B5B7A89" />
      <CertEKU ID="ID_EKU_WHQL" />
    </Signer>
  </Signers>

  <SigningScenarios>
    <SigningScenario Value="131" ID="ID_SIGNINGSCENARIO_DRIVERS" FriendlyName="Driver Signing Scenario">
      <ProductSigners>
        <AllowedSigner SignerID="ID_SIGNER_WHQL_KERNEL" />
      </ProductSigners>
    </SigningScenario>
  </SigningScenarios>

  <Rules>
    <Rule>
      <Option>Enabled:Unsigned System Integrity Policy</Option>
    </Rule>
  </Rules>

</SiPolicy>
```

### Signing Scenario Values

| Value | Scenario | Applies To |
|---|---|---|
| `131` | Kernel Mode | Drivers, kernel components |
| `12` | User Mode | Executables, DLLs |

WHQL rules are almost always placed in the kernel-mode signing scenario (131).

---

## 9. PowerShell Examples

### Generating a WHQL Policy

```powershell
# Generate a policy that allows all WHQL-certified kernel drivers
# New-CIPolicy with Level WHQL creates WHQL EKU-based Signer rules
New-CIPolicy `
    -ScanPath "C:\Windows\System32\drivers\" `
    -Level WHQL `
    -Fallback Hash `       # For any drivers that are NOT WHQL-signed
    -FilePath "C:\Policies\WHQL-Drivers-Policy.xml" `
    -Drivers               # Only scan drivers (kernel mode)

# Output: EKU element for WHQL OID + Signer elements for WHQL intermediate CAs
# Plus Hash rules for any non-WHQL-signed drivers found during scan
```

### Checking If a Driver Is WHQL-Signed

```powershell
function Test-WHQLSigned {
    param([string]$DriverPath)
    
    # The WHQL EKU OID
    $whqlOid = "1.3.6.1.4.1.311.10.3.5"
    
    $sig = Get-AuthenticodeSignature -FilePath $DriverPath
    if ($sig.Status -ne "Valid") {
        Write-Warning "File is not validly signed: $DriverPath"
        return $false
    }
    
    $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
    $chain.Build($sig.SignerCertificate) | Out-Null
    
    foreach ($element in $chain.ChainElements) {
        $cert = $element.Certificate
        foreach ($ext in $cert.Extensions) {
            if ($ext -is [System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]) {
                foreach ($oid in $ext.EnhancedKeyUsages) {
                    if ($oid.Value -eq $whqlOid) {
                        Write-Host "WHQL-signed: $DriverPath" -ForegroundColor Green
                        Write-Host "  WHQL EKU found in cert: $($cert.Subject)" -ForegroundColor Green
                        return $true
                    }
                }
            }
        }
    }
    
    Write-Host "Not WHQL-signed: $DriverPath" -ForegroundColor Yellow
    return $false
}

# Test a specific driver
Test-WHQLSigned -DriverPath "C:\Windows\System32\drivers\nvlddmkm.sys"
```

### Scanning System32\drivers for WHQL Status

```powershell
# Audit all drivers on the system — identify which are WHQL-signed
$whqlOid = "1.3.6.1.4.1.311.10.3.5"

Get-ChildItem "C:\Windows\System32\drivers\*.sys" | ForEach-Object {
    $driver = $_
    $sig = Get-AuthenticodeSignature -FilePath $driver.FullName -ErrorAction SilentlyContinue
    
    if ($sig -and $sig.Status -eq "Valid") {
        $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
        $chain.Build($sig.SignerCertificate) | Out-Null
        
        $isWhql = $false
        foreach ($el in $chain.ChainElements) {
            foreach ($ext in $el.Certificate.Extensions) {
                if ($ext -is [System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]) {
                    if ($ext.EnhancedKeyUsages | Where-Object { $_.Value -eq $whqlOid }) {
                        $isWhql = $true
                    }
                }
            }
        }
        
        [PSCustomObject]@{
            Driver    = $driver.Name
            Signer    = $sig.SignerCertificate.Subject -replace "CN=",""
            WHQLSigned = $isWhql
            Status    = $sig.Status
        }
    }
} | Sort-Object WHQLSigned, Driver | Format-Table -AutoSize
```

### Creating a Combined WHQL + Recommended Block Rules Policy

```powershell
# Microsoft-recommended approach: allow WHQL drivers BUT apply the vulnerable driver block rules

# Step 1: Generate base WHQL policy
New-CIPolicy `
    -Level WHQL `
    -Fallback Hash `
    -FilePath "C:\Policies\WHQL-Base.xml" `
    -Drivers

# Step 2: Download Microsoft's recommended block rules (driver blocklist)
# Source: https://aka.ms/VulnerableDriverBlockList
# These block known vulnerable drivers that ARE WHQL-signed but have CVEs
Invoke-WebRequest `
    -Uri "https://aka.ms/VulnerableDriverBlockList" `
    -OutFile "C:\Policies\VulnerableDriverBlockList.xml"

# Step 3: Merge base policy with block rules
Merge-CIPolicy `
    -PolicyPaths "C:\Policies\WHQL-Base.xml", "C:\Policies\VulnerableDriverBlockList.xml" `
    -OutputFilePath "C:\Policies\WHQL-WithBlockList.xml"

# Step 4: Compile to binary
ConvertFrom-CIPolicy `
    -XmlFilePath "C:\Policies\WHQL-WithBlockList.xml" `
    -BinaryFilePath "C:\Policies\WHQL-WithBlockList.p7b"
```

---

## 10. WHQL vs. Option 02 (Required:WHQL)

This is one of the most common sources of confusion regarding WHQL in WDAC. These are two completely different concepts:

| Concept | What It Is | Effect |
|---|---|---|
| **WHQL level** (file rule level) | A trust grant — "allow files that are WHQL-signed" | Files with WHQL EKU are allowed to run |
| **Option 02: Required:WHQL** | A policy mandate — "all kernel drivers MUST be WHQL" | Drivers without WHQL EKU are BLOCKED, regardless of other rules |

### Option 02 Explained

Adding `<Option>Required:WHQL</Option>` to a WDAC policy's `<Rules>` section activates a **global kernel-mode policy** that requires every kernel driver to be WHQL-certified. This is enforced by `ci.dll` before any signer rules are evaluated:

```xml
<Rules>
  <Rule>
    <Option>Required:WHQL</Option>
  </Rule>
</Rules>
```

**When you combine both:**

```mermaid
graph TD
    DRIVER_LOAD(["Kernel Driver Load Request"]):::node
    
    OPT02{"Option 02\nRequired:WHQL\nin policy?"}:::node
    
    WHQL_CHECK_OPT{"Does driver have\nWHQL EKU?"}:::node
    OPT02_BLOCK(["BLOCKED — Option 02 mandate\ndriver lacks WHQL EKU\nNo signer rules evaluated"]):::block
    
    RULE_EVAL["Evaluate WDAC Signer Rules\n(WHQL level, Publisher, Hash, etc.)"]:::node
    
    WHQL_RULE{"WHQL signer rule\nexists AND EKU present?"}:::node
    WHQL_RULE_ALLOW(["ALLOWED — WHQL rule matches"]):::allow
    
    OTHER_RULE{"Other signer rules\nmatch?"}:::node
    OTHER_ALLOW(["ALLOWED — Other rule matches"]):::allow
    
    DEFAULT_BLOCK(["BLOCKED — Default deny"]):::block

    DRIVER_LOAD --> OPT02
    OPT02 -->|"Yes — Option 02 active"| WHQL_CHECK_OPT
    OPT02 -->|"No — Option 02 absent"| RULE_EVAL
    WHQL_CHECK_OPT -->|"No WHQL EKU"| OPT02_BLOCK
    WHQL_CHECK_OPT -->|"Has WHQL EKU"| RULE_EVAL
    RULE_EVAL --> WHQL_RULE
    WHQL_RULE -->|"Yes"| WHQL_RULE_ALLOW
    WHQL_RULE -->|"No"| OTHER_RULE
    OTHER_RULE -->|"Yes"| OTHER_ALLOW
    OTHER_RULE -->|"No"| DEFAULT_BLOCK

    classDef node fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef allow fill:#0d1f12,stroke:#1a5c2a,color:#86efac
    classDef block fill:#1f0d0d,stroke:#7f1d1d,color:#fca5a5
    classDef warn fill:#1a1a0d,stroke:#7a6a00,color:#fde68a
```

**Practical guidance:**
- Use `WHQL level` when you want to *allow* WHQL-certified drivers as a category
- Use `Option 02` when you want to *mandate* that all drivers must be WHQL (and block non-WHQL drivers even if they have other valid signatures)
- For maximum security, use *both*: Option 02 mandates WHQL, and WHQL level rules allow them

---

## 11. Pros & Cons Table

| Attribute | Assessment |
|---|---|
| **Trust scope** | All WHQL-certified drivers — broad but bounded by Microsoft's certification process |
| **Maintenance burden** | Very low — new WHQL drivers automatically match existing rules |
| **Security validation** | High — Microsoft tested and signed each driver through HLK |
| **False positive risk** | Low for kernel mode; WHQL is specific to hardware drivers |
| **BYOVD vulnerability** | Present — legitimate old WHQL drivers with CVEs still match |
| **Specificity** | Low — cannot distinguish NVIDIA driver from Intel driver at this level |
| **Ease of use** | High — single EKU rule covers all certified drivers |
| **User-mode applicability** | Limited — few user-mode binaries are WHQL-signed |
| **Compatibility** | Excellent — works on all WDAC-capable Windows versions |
| **Kernel stability** | High — WHQL drivers have passed quality testing |

---

## 12. Attack Resistance Analysis — BYOVD Context

### Bring Your Own Vulnerable Driver (BYOVD)

The WHQL level's most significant limitation is its vulnerability to **BYOVD attacks**. In a BYOVD attack, a threat actor loads a legitimately-signed, WHQL-certified driver that contains a known vulnerability (typically a kernel read/write primitive) and exploits it to escalate privileges or disable security software.

**The key insight:** WHQL certification tests whether a driver works correctly for its intended purpose on certified hardware. It does NOT:
- Test for security vulnerabilities in the driver code
- Expire or invalidate a signature when a CVE is discovered
- Prevent old, vulnerable drivers from matching WDAC WHQL rules

```mermaid
graph TD
    subgraph "BYOVD Attack Chain"
        ATK1["Attacker runs with admin privileges\n(e.g., post-initial-access)"]:::warn
        
        ATK2["Downloads vulnerable WHQL driver:\nkevp64.sys (Gigabyte driver, CVE-XXXX)\ndbutil_2_3.sys (Dell driver, CVE-2021-21551)\nnvflash.sys (NVIDIA tool, has kernel R/W)"]:::warn
        
        ATK3["Loads driver via sc.exe or\nLoadDriver privilege"]:::warn
        
        WDAC_CHECK{"WDAC WHQL check"}:::node
        
        WHQL_PASS(["ALLOWED — Driver IS WHQL-signed\nWDAC WHQL rule matches\nDriver loads successfully"]):::block
        
        ATK4["Exploits kernel vulnerability\nin loaded driver\n(arbitrary kernel R/W, process token\nmanipulation, PPL bypass, etc.)"]:::block
        
        ATK5["Disables EDR/AV,\nescalates to SYSTEM,\nor installs kernel rootkit"]:::block
    end

    subgraph "Mitigation: Microsoft Vulnerable Driver Blocklist"
        BLOCK_LIST["Microsoft-maintained deny list:\n/windows/security/application-security/\napplication-control/windows-defender-\napplication-control/design/\nrecommended-driver-block-rules"]:::allow
        
        BLOCK_CHECK{"Driver hash/signer\nin block list?"}:::node
        
        BLOCKED(["BLOCKED — Even though WHQL-signed\nDeny rule takes precedence\nover WHQL allow rule"]):::allow
    end

    ATK1 --> ATK2
    ATK2 --> ATK3
    ATK3 --> WDAC_CHECK
    WDAC_CHECK -->|"WHQL rule exists, EKU found"| WHQL_PASS
    WHQL_PASS --> ATK4
    ATK4 --> ATK5

    ATK3 -.->|"With block list enabled"| BLOCK_CHECK
    BLOCK_CHECK -->|"Yes — in block list"| BLOCKED

    classDef node fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef allow fill:#0d1f12,stroke:#1a5c2a,color:#86efac
    classDef block fill:#1f0d0d,stroke:#7f1d1d,color:#fca5a5
    classDef warn fill:#1a1a0d,stroke:#7a6a00,color:#fde68a
```

### Mitigating BYOVD When Using WHQL Level

The WHQL level should always be combined with Microsoft's **recommended driver block rules** (the vulnerable driver blocklist). This list contains hashes and signer rules for known-vulnerable WHQL-certified drivers. Since deny rules take precedence over allow rules in WDAC, drivers on the block list are blocked even if they would otherwise match the WHQL allow rule.

Key point: **WHQL level alone is insufficient for BYOVD protection.** Always combine with:
1. Microsoft's vulnerable driver block rules (updated regularly)
2. `WHQLFilePublisher` level rules for specific known-good drivers (more restrictive)
3. `Required:WHQL` option (Option 02) to block unsigned kernel drivers

---

## 13. When to Use vs. When to Avoid — Decision Flowchart

```mermaid
flowchart TD
    Q1["Goal: Control which kernel drivers\ncan load on my systems"]:::node
    
    Q2{"Do you need to control\nwhich VENDORS' drivers run?"}:::node
    
    Q3{"Are ALL drivers from a\nsingle known set of vendors?"}:::node
    
    USE_WHQL(["Consider WHQL level\n+ Microsoft block rules\n+ Option 02 (Required:WHQL)\nBest for: broad enterprise\ndriver allowlisting where\nyou trust all WHQL-certified vendors"]):::allow
    
    USE_WHQL_PUB(["Use WHQLPublisher level\nTrust WHQL drivers from\nspecific vendors only\nBest for: OEM-specific\ndriver allowlisting"]):::allow
    
    USE_WHQL_FP(["Use WHQLFilePublisher level\nTrust specific WHQL drivers\nby filename + version + vendor\nBest for: production policy\nwith known driver inventory"]):::allow
    
    Q4{"Security requirement\nlevel?"}:::node
    
    HIGH_SEC(["High security environment\n→ WHQLFilePublisher preferred\n→ Enumerate specific drivers\n→ Add Microsoft block rules\n→ Enable Option 02"]):::warn
    
    STD_SEC(["Standard enterprise\n→ WHQL level is acceptable\n→ Must add Microsoft block rules\n→ Recommended: enable Option 02\n→ Monitor for CVE advisories"]):::allow
    
    Q1 --> Q2
    Q2 -->|"Any WHQL vendor is fine"| Q4
    Q2 -->|"Specific vendors only"| Q3
    Q3 -->|"Yes, one or few vendors"| USE_WHQL_PUB
    Q3 -->|"Specific files known"| USE_WHQL_FP
    Q4 -->|"High security / strict"| HIGH_SEC
    Q4 -->|"Standard enterprise"| STD_SEC
    STD_SEC --> USE_WHQL
    HIGH_SEC --> USE_WHQL_FP

    classDef node fill:#162032,stroke:#1e3a5f,color:#e2e8f0
    classDef allow fill:#0d1f12,stroke:#1a5c2a,color:#86efac
    classDef block fill:#1f0d0d,stroke:#7f1d1d,color:#fca5a5
    classDef warn fill:#1a1a0d,stroke:#7a6a00,color:#fde68a
```

---

## 14. Real-World Scenario: End-to-End Sequence

**Scenario:** A manufacturing company deploys WDAC to their workstations. They have various hardware with drivers from Intel, NVIDIA, Realtek, and other vendors. They want to allow all properly-certified drivers without enumerating each vendor.

```mermaid
sequenceDiagram
    participant Admin as IT Admin
    participant PS as PowerShell (ConfigCI)
    participant MSBlock as Microsoft Block Rules Feed
    participant MDM as Intune/MDM
    participant WS as Workstation (ci.dll)
    participant Driver as Vendor Driver (nvlddmkm.sys)

    Note over Admin,Driver: Phase 1 — Policy Creation

    Admin->>PS: New-CIPolicy -Level WHQL -Fallback Hash -Drivers -FilePath base.xml
    PS-->>Admin: base.xml — contains WHQL EKU rule + Hash rules for any non-WHQL drivers

    Admin->>MSBlock: Download recommended driver block rules (aka.ms/VulnerableDriverBlockList)
    MSBlock-->>Admin: blocklist.xml — deny rules for known-vulnerable WHQL drivers

    Admin->>PS: Merge-CIPolicy -PolicyPaths base.xml, blocklist.xml -OutputFilePath merged.xml
    Admin->>PS: Add Option 02 (Required:WHQL) to merged.xml
    Admin->>PS: ConvertFrom-CIPolicy -XmlFilePath merged.xml -BinaryFilePath policy.p7b

    Note over Admin,Driver: Phase 2 — Deployment

    Admin->>MDM: Upload policy.p7b, deploy via OMA-URI to workstations
    MDM-->>WS: Policy deployed and activated

    Note over Admin,Driver: Phase 3 — Normal Operation (WHQL driver allowed)

    Driver->>WS: NVIDIA driver update: nvlddmkm.sys v560.94 loads
    WS->>WS: ci.dll — kernel mode evaluation
    WS->>WS: Check Option 02: nvlddmkm.sys has WHQL EKU? Yes → proceed
    WS->>WS: Evaluate WHQL signer rule: EKU OID 1.3.6.1.4.1.311.10.3.5 found in chain? Yes
    WS->>WS: Check Microsoft block list: v560.94 hash in deny list? No
    WS-->>Driver: ALLOWED — WHQL-certified, not on block list

    Note over Admin,Driver: Phase 4 — BYOVD Attempt (blocked by deny list)

    Driver->>WS: Attacker tries to load kevp64.sys (Gigabyte, known vulnerable, WHQL-signed)
    WS->>WS: ci.dll — kernel mode evaluation
    WS->>WS: Check Option 02: kevp64.sys has WHQL EKU? Yes → proceed to rules
    WS->>WS: Check Microsoft block list: kevp64.sys hash in deny list? YES
    WS-->>Driver: BLOCKED — Deny rule (block list) takes precedence over WHQL allow rule
    WS->>WS: Event ID 3077 logged (CI block event)
```

---

## 15. OS Version & Compatibility

| OS Version | WHQL Level Support | Notes |
|---|---|---|
| Windows 10 1507+ | Full support | WDAC kernel-mode signing scenarios |
| Windows 10 1709+ | Full support + Audit Mode | Separate audit/enforce policy support |
| Windows 11 21H2+ | Full support | Enhanced kernel security, HVCI |
| Windows Server 2016+ | Full support | Server supports WDAC kernel driver control |
| Windows Server 2019+ | Full support | Recommended for server deployments |
| Windows Server 2022+ | Full support | Strong WDAC integration with Secured-Core |
| ARM64 | Full support | WHQL covers ARM64 drivers as well |

**Note on HVCI (Hypervisor-Protected Code Integrity):**
When HVCI (Memory Integrity) is enabled, kernel driver loading is validated by the hypervisor using WDAC policies. WHQL rules work identically in HVCI mode. The additional protection HVCI provides is that even if `ci.dll` were compromised, the hypervisor enforces the policy independently.

---

## 16. Common Mistakes & Gotchas

### Mistake 1: Believing WHQL Means the Driver Is Secure

**Wrong assumption:** "WHQL drivers are Microsoft-approved, so they're safe to run."

**Reality:** WHQL certification tests hardware compatibility and quality, not security. A driver can be WHQL-certified and still contain exploitable vulnerabilities (as demonstrated by dozens of CVEs in WHQL-signed drivers). Always combine WHQL rules with Microsoft's vulnerable driver block list.

### Mistake 2: Forgetting the Fallback

**Wrong approach:** Using WHQL level without a fallback for legacy or internal drivers that are not WHQL-certified.

**Reality:** Many legitimate enterprise drivers (especially legacy hardware or internal development drivers) are not WHQL-signed. Without a fallback (`-Fallback Hash` or `-Fallback Publisher`), these drivers will be blocked.

**Fix:** Always specify `-Fallback Hash` or another appropriate fallback level when generating WHQL policies.

### Mistake 3: Confusing WHQL Level with Option 02

As described in Section 10, these are different. Confusing them leads to policies that either:
- Allow non-WHQL drivers when you intended to block them (forgot Option 02)
- Block valid driver loads that only have PcaCertificate rules (added Option 02 without WHQL allow rules)

### Mistake 4: Not Updating the Block List

**Wrong assumption:** "Once I add the Microsoft block list to my policy, I'm protected forever."

**Reality:** New vulnerable WHQL-signed drivers are discovered regularly. Microsoft updates the block list. Your deployed policy does not auto-update. Schedule regular policy reviews to incorporate updated block rules.

### Mistake 5: Applying WHQL Rules to User-Mode Scenario

WHQL rules are meaningful only in the **kernel-mode signing scenario** (value 131). Adding WHQL EKU rules to user-mode scenario (value 12) rules has no meaningful effect because user-mode binaries are almost never WHQL-signed. If you see WHQL rules in a user-mode policy section, they are likely the result of an overly broad scan and can be removed.

### Mistake 6: The EKU Hex Value Encoding

The WHQL EKU value in WDAC XML (`010A2B0601040182370A0305`) is **not** the raw OID in hex. It is a specific encoding format used by WDAC. Using the wrong encoding (e.g., raw ASN.1 OID bytes without the WDAC-specific prefix) will cause the EKU rule to never match, silently failing to allow WHQL drivers.

Always use the canonical value `010A2B0601040182370A0305` for the WHQL EKU in WDAC XML.

---

## 17. Summary Table

| Property | Value |
|---|---|
| **Level Name** | WHQL |
| **Trust Mechanism** | EKU OID `1.3.6.1.4.1.311.10.3.5` in cert chain |
| **EKU Hex (WDAC XML)** | `010A2B0601040182370A0305` |
| **Primary Use Case** | Kernel-mode driver allowlisting |
| **Trust Scope** | All Microsoft-certified WHQL drivers |
| **Vendor Specificity** | None — any WHQL driver from any vendor matches |
| **BYOVD Risk** | Present — old vulnerable WHQL drivers still match |
| **BYOVD Mitigation** | Microsoft vulnerable driver block rules |
| **Related Option** | Option 02 `Required:WHQL` (mandate, not grant) |
| **More Specific Alternatives** | WHQLPublisher (adds vendor CN), WHQLFilePublisher (adds filename+version) |
| **Signing Scenario** | Kernel mode (131) — rarely user mode (12) |
| **PowerShell Level Name** | `WHQL` |
| **Kernel Component** | ci.dll (Code Integrity) |
| **OS Support** | Windows 10 1507+ / Server 2016+ |
| **HVCI Compatible** | Yes — evaluated by hypervisor in HVCI mode |
| **Block List URL** | `https://aka.ms/VulnerableDriverBlockList` |
