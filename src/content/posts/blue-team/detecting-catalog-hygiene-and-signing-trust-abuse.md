---
title: 'Detecting Catalog-Hygiene and Signing-Trust Abuse'
author: Anubhav Gain
pubDatetime: 2026-07-13T17:00:00.000Z
slug: detecting-catalog-hygiene-and-signing-trust-abuse
draft: false
featured: false
description: 'Part 9 of the WDAC detection-engineering series — detecting abuse of Windows signature catalogs and previous-version signed script hosts to launder unsigned code past application control, with a Sigma rule and catalog-integrity monitoring guidance.'
tags:
- detection-engineering
- wdac
- code-signing
- catalog
- authenticity
- sigma
- blue-team
category: Detection Engineering
lang: en
---

# Detecting Catalog-Hygiene and Signing-Trust Abuse

The most subtle WDAC bypass family targets the **trust mechanism itself** rather than any individual signed binary. Windows maintains **security catalogs** (`.cat`) that vouch for the integrity of files that are not individually signed — drivers, system components, script hosts. WDAC and SmartScreen honour catalog-based trust. Two documented abuse paths exploit this: **catalog-hygiene abuse**, where an attacker exploits sloppy catalog maintenance to get unsigned code treated as catalog-trusted, and **previous-version signed script hosts**, where an older, still-trusted copy of a script host whose current version is blocked is used to run code.

This family is harder to detect than the LOLBIN families because the abuse lives in file-integrity and catalog state rather than in a loud process command line. The detections are correspondingly file- and integrity-oriented.

## Table of Contents

1. [How Catalog Trust Works](#1-how-catalog-trust-works)
2. [The Two Abuse Paths](#2-the-two-abuse-paths)
3. [Detection Signal 1 — Catalog File Integrity](#3-detection-signal-1--catalog-file-integrity)
4. [Detection Signal 2 — Stale/Previous-Version Script Hosts](#4-detection-signal-2--staleprevious-version-script-hosts)
5. [Detection Signal 3 — Unsigned Code Treated as Trusted](#5-detection-signal-3--unsigned-code-treated-as-trusted)
6. [A Sigma Rule for the Family](#6-a-sigma-rule-for-the-family)
7. [Operationalising Catalog Monitoring](#7-operationalising-catalog-monitoring)
8. [References](#8-references)

---

## 1. How Catalog Trust Works

A **security catalog** (`.cat`) is a signed container of cryptographic hashes for a set of files. Windows uses catalogs to attest to the integrity of files that ship without their own embedded Authenticode signature — typically drivers and system binaries. When a process or the kernel needs to verify such a file, it can look up the file's hash in an installed catalog; if found, the file is treated as trusted by virtue of the catalog's signature.

WDAC honours this. A policy that grants trust on catalog-signed content (which many do, because the Windows driver ecosystem depends on it) inherits an obligation: **the catalog infrastructure itself must be integrity-protected.** The abuse family below is what happens when that obligation is weak.

## 2. The Two Abuse Paths

- **Catalog-hygiene abuse** — Jimmy Bayn's [Abusing Catalog Hygiene](https://bohops.com/2019/05/04/abusing-catalog-file-hygiene-to-bypass-application-whitelisting/) documents how lax catalog maintenance lets an attacker get unsigned code treated as catalog-trusted, laundering it past an application-control policy that trusts catalog signatures.
- **Previous-version signed script hosts + catalogs** — William Easton's [VULN-051861 advisory](https://github.com/strawgate/Advisories/blob/main/Microsoft/VULN-051861.md) covers using older, still-trusted copies of signed script hosts (whose current versions are on the block list) alongside catalog files to bypass WDAC. The block list blocks the *current* binary, not every historical version whose signature is still valid.

Both paths share the same root cause: trust that was meant to be scoped to a specific, maintained artifact is instead being satisfied by a stale or tampered substitute.

## 3. Detection Signal 1 — Catalog File Integrity

Catalogs live under `C:\Windows\System32\catroot` and `C:\Windows\System32\catroot2` (the Cryptographic Services working directories). Detection posture:

- Monitor **writes, creation, and replacement** of `.cat` files outside the OS servicing process (`TiWorker.exe`, `TrustedInstaller.exe`, `msiexec.exe`, Windows Update).
- Alert on catalog files appearing in **non-standard locations** (user-writable paths, alongside an attacker payload).
- Track catalog **hash inventory** per host; a new or modified catalog that does not correspond to a Windows Update event is the signal.

## 4. Detection Signal 2 — Stale/Previous-Version Script Hosts

The previous-version abuse requires an *old copy* of a signed script host (e.g. an older `wscript.exe`, `cscript.exe`, `mshta.exe`, or a signed PowerShell host) to be present and runnable. Detection:

- Inventory signed script-host binaries across the host and alert on **duplicates outside their System32 install path** (e.g. a second `wscript.exe` in a user directory or a backup folder).
- Alert on execution of a script host whose **version is older** than the installed OS's shipping version by a significant margin, especially when the current version is on your block list.
- Correlate script-host execution from non-`System32` paths with the catalog-monitoring signal — a script host plus an unexpected catalog in the same directory tree is the fingerprint of this abuse.

## 5. Detection Signal 3 — Unsigned Code Treated as Trusted

The strongest end-state signal: a file that you know is unsigned (or unsigned-by-the-expected-publisher) being loaded/executed as if it were trusted. This is observable through:

- **Sysmon EID 7** (image load) where the loaded module has no signature but the loading process proceeds — paired with `Microsoft-Windows-CodeIntegrity/Operational` events showing catalog-based trust satisfaction.
- **Code-integrity audit mode** events (EID 3076/3077/3089) that name the catalog used to satisfy trust for a given file.

Running WDAC in **audit mode** alongside enforcement, and forwarding the audit events, gives you this visibility directly.

## 6. A Sigma Rule for the Family

A file-event rule for catalog tampering and a process rule for stale script-host execution. The catalog branch requires a Sysmon file-audit configuration targeting `.cat` paths.

```yaml
title: WDAC Bypass — Catalog Tamper or Stale Signed Script Host
id: 4d7f1a2b-9c3e-4f6a-8d2b-1e5c7a9b3d4e
status: experimental
description: >
  Detects abuse of Windows security catalog trust or previous-version signed
  script hosts to launder unsigned code past application control — catalog
  file writes outside OS servicing, or execution of duplicate/old script
  hosts from non-system paths.
references:
  - https://bohops.com/2019/05/04/abusing-catalog-file-hygiene-to-bypass-application-whitelisting/
  - https://github.com/strawgate/Advisories/blob/main/Microsoft/VULN-051861.md
  - /posts/wdac-bypass-techniques-reference-catalog/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1553
  - attack.t1218
logsource:
  product: windows
  category: file_event
detection:
  catalog_write:
    TargetFilename|endswith: '.cat'
    TargetFilename|contains:
      - '\catroot'
      - '\catroot2\'
      - '\Users\'
      - '\AppData\'
      - '\Temp\'
      - '\ProgramData\'
    filter_servicing:
      Image|endswith:
        - '\TiWorker.exe'
        - '\TrustedInstaller.exe'
        - '\msiexec.exe'
        - '\setup.exe'
        - '\wuauclt.exe'
        - '\UsoClient.exe'
    condition: catalog_write and not filter_servicing
  stale_script_host:
    Image|endswith:
      - '\wscript.exe'
      - '\cscript.exe'
      - '\mshta.exe'
    Image|contains:
      - '\Users\'
      - '\AppData\'
      - '\Temp\'
      - '\ProgramData\'
      - '\Downloads\'
condition: catalog_write or stale_script_host
fields:
  - TargetFilename
  - Image
  - User
falsepositives:
  - Legitimate driver/software installation via servicing components (filtered)
  - Authorised catalog updates through WSUS/Intune
level: high
```

(Note: in a real Sigma pipeline, the `filter_servicing` block's nested `condition` is composed at the rule-engine level; the intent is "catalog write not from the OS servicing image set.")

## 7. Operationalising Catalog Monitoring

- **Deploy a Sysmon configuration** that audits `.cat` file create/rename/write under `catroot`, `catroot2`, and user-writable paths. This telemetry does not exist by default.
- **Inventory script hosts.** A one-time per-host inventory of `wscript.exe`/`cscript.exe`/`mshta.exe`/`powershell.exe` paths and versions, refreshed periodically, makes the stale-script-host detection trivial.
- **Run WDAC audit mode in parallel.** The Code Integrity operational log is the authoritative source for "which catalog satisfied trust for this file." Forward it.
- **Treat catalog trust as tier-0 infrastructure.** The ability to add or modify a catalog is the ability to launder arbitrary code as trusted. Restrict and alert on it the way you would on code-integrity policy writes (see [part 4](/posts/detecting-wdac-edr-blinding/)).

## 8. References

- [Abusing Catalog Hygiene to Bypass Application Whitelisting — bohops](https://bohops.com/2019/05/04/abusing-catalog-file-hygiene-to-bypass-application-whitelisting/)
- [Bypassing WDAC with Previous Versions of Signed Script Hosts & Catalogs — William Easton (@strawgate)](https://github.com/strawgate/Advisories/blob/main/Microsoft/VULN-051861.md)
- [WDAC Bypass Techniques — The Complete Reference Catalog](/posts/wdac-bypass-techniques-reference-catalog/)
- [Windows Security Catalogs and `catroot` — Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/catalog-files)
- [MITRE ATT&CK T1553 — Subvert Trust Controls](https://attack.mitre.org/techniques/T1553/)
- [MITRE ATT&CK T1553.003 — Code Signing](https://attack.mitre.org/techniques/T1553/003/)
