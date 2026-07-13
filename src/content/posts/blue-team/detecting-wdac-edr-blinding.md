---
title: 'Detecting WDAC-as-Weapon — Catching EDR-Blinding Before the Sensor Goes Dark'
author: Anubhav Gain
pubDatetime: 2026-07-13T14:30:00.000Z
slug: detecting-wdac-edr-blinding
draft: false
featured: false
description: 'Part 4 of the WDAC detection-engineering series — detecting attackers who weaponise WDAC policies to switch off EDR at boot, including malicious .cip writes, GPO policy deployment, and the heartbeat-absence "dark endpoint" detection.'
tags:
- detection-engineering
- wdac
- edr
- code-integrity
- sigma
- sysmon
- blue-team
- threat-hunting
category: Detection Engineering
lang: en
---

# Detecting WDAC-as-Weapon — Catching EDR-Blinding Before the Sensor Goes Dark

The most dangerous use of Windows Defender Application Control is not an attacker bypassing it — it is an attacker **using** it. By crafting a WDAC policy that denies an EDR agent's binaries, drivers, and services, and placing that policy where Code Integrity reads it before the sensor initialises, an adversary with sufficient privilege can switch the EDR off at boot and keep it off. The technique is documented publicly (Krueger; the DreamDemon lineage) and has been seen in real incident-response engagements.

This post is the detection counterpart to [the threat analysis](/posts/wdac-bypass-edr-isolation-containment/). The hard truth is that once the policy is loaded and the agent is denied, **your endpoint telemetry is gone** — so the detections that matter are the ones that fire *before* the silence, or that observe the silence *from somewhere else*. Both are below.

## Table of Contents

1. [The Attack Timeline](#1-the-attack-timeline)
2. [The Detection Window Problem](#2-the-detection-window-problem)
3. [Signal 1 — Code-Integrity Policy File Writes](#3-signal-1--code-integrity-policy-file-writes)
4. [Signal 2 — Policy Deployment via GPO](#4-signal-2--policy-deployment-via-gpo)
5. [Signal 3 — The Dark Endpoint (Heartbeat Absence)](#5-signal-3--the-dark-endpoint-heartbeat-absence)
6. [Signal 4 — Agent Service/Driver State Changes](#6-signal-4--agent-servicedriver-state-changes)
7. [A Sigma Rule for Policy Writes](#7-a-sigma-rule-for-policy-writes)
8. [Detection Engineering Notes](#8-detection-engineering-notes)
9. [References](#9-references)

---

## 1. The Attack Timeline

The technique follows a tight sequence:

1. **Obtain local admin** on the host (this is a post-compromise, high-privilege technique — it does not grant initial access).
2. **Craft a malicious policy** that denies the EDR's user-mode binaries, its kernel driver, and the services that wire them together.
3. **Place the policy** in a system-critical code-integrity location so Code Integrity loads it early in boot, before the EDR agent comes up.
4. **(Optional) Persist** via Group Policy so the policy survives reboots and re-applies across the OU.
5. **Reboot.** The EDR's components now fail to initialise. The host goes dark.

The kernel never reports a bypass — from its point of view, policy is being enforced exactly as written. The defence has to observe the *deployment* of the policy and the *absence* of the sensor.

## 2. The Detection Window Problem

Once the malicious policy is loaded, the EDR's hooks are gone. You will not get process-create or image-load events from that host anymore. So the two viable detection postures are:

- **Pre-silence detection** — catch the policy file write or GPO change *before* the reboot that loads it. This is the highest-value window.
- **Post-silence detection** — observe that the host has stopped reporting, from a system *other than* the endpoint (the management plane, the SIEM's ingest tracker, identity telemetry). This is the "dark endpoint" detection and it is essential, because pre-silence detection will sometimes miss.

A mature program runs both.

## 3. Signal 1 — Code-Integrity Policy File Writes

Code Integrity reads policy files from a small number of well-known locations. A new or modified `.cip` (compiled policy) or policy XML appearing outside your change-management process is the single highest-signal pre-silence event.

Key paths to monitor:

- `C:\Windows\System32\CodeIntegrity\CiPolicies\Active\*.cip` — the active compiled policies.
- `C:\Windows\System32\CodeIntegrity\CiPolicies\Pending\*.cip` — pending policies.
- `C:\Windows\System32\CodeIntegrity\*.cip` and `*.xml` policy sources.
- The legacy `C:\Windows\System32\CodeIntegrity\SiPolicy.p7b` (the legacy WDAC/CIG policy path).

Normal fleets change these files rarely — at most during a planned policy revision. Any other write, especially from an interactive admin session or a script, is the signal.

## 4. Signal 2 — Policy Deployment via GPO

For persistence and scale, attackers re-use the defender's own deployment channel: Group Policy Preferences / Files, or an Intune configuration, pushing a malicious `.cip`. Monitor:

- `\\<domain>\SysVol\...\Policies\...\` for new `.cip`/`.xml` WDAC policy files.
- Group Policy change events (Security EID 5136 — directory-service object modified; EID 4739 — domain policy changed).
- The event log `Microsoft-Windows-CodeIntegrity/Operational` for policy-load events at boot (EID 3076/3077 audit/blocks and EID 3089 rule-list load), which will name the policy that took effect.

## 5. Signal 3 — The Dark Endpoint (Heartbeat Absence)

The most underrated detection in this entire space is the simplest: **a host that always reports heartbeats has gone silent outside a maintenance window**. Silence is not evidence of safety; under this threat it is evidence of compromise until proven otherwise.

Implementation:

- Track per-agent heartbeat regularity in the SIEM (or the EDR console's own health telemetry).
- Alert when a previously-reporting host misses N consecutive heartbeats, or when its last-event timestamp ages beyond a threshold (e.g. 2× the normal inter-event gap) outside an approved maintenance window.
- **Correlate** silence with other signals: did a `.cip` write precede it? Did the host's last events include a reboot (EID 1074/6005/6006)? A silent host that just wrote a code-integrity policy and rebooted is your detection, even though the endpoint itself can no longer tell you.

The discipline here is organisational: "no alerts" must not read as "no problem" when a host has gone quiet.

## 6. Signal 4 — Agent Service/Driver State Changes

In the window before the reboot that fully loads the policy, an attacker may stop or disable the EDR service or attempt to unload its driver. These are detectable on the host:

- Security EID 7036 / System log service state changes for the EDR service.
- EID 7040 service start-type changes (auto → disabled).
- Sysmon EID 6 driver-load or EID 7 image-load anomalies for the EDR driver.

These are generic "someone is tampering with the sensor" detections and they are worth having independent of the WDAC-specific threat, because they fire across a range of evasion techniques.

## 7. A Sigma Rule for Policy Writes

A Sigma rule covering Signal 1 — writes to the code-integrity policy locations outside expected processes. Pair this with your change-management process: the `filter_known_mgmt` branch excludes the tooling and accounts that legitimately revise policy.

```yaml
title: Suspicious WDAC Code-Integrity Policy File Write
id: 7f1a3c9d-2b4e-4f6a-8d0c-5e9b7a3f1c2d
status: experimental
description: >
  Detects creation or modification of Windows Defender Application Control
  (WDAC) / Application Control for Business code-integrity policy files
  (.cip / SiPolicy) outside of approved management processes. A malicious
  policy that denies an EDR agent is a known technique for blinding endpoint
  sensors at boot.
references:
  - https://www.100daysofredteam.com/p/using-wdac-to-disable-edr-krueger
  - https://beierle.win/2025-08-28-A-Nightmare-on-EDR-Street-WDACs-Revenge/
  - /posts/wdac-bypass-edr-isolation-containment/
author: Anubhav Gain
date: 2026/07/13
tags:
  - attack.defense_evasion
  - attack.t1562
  - attack.t1562.001
  - attack.t1553
logsource:
  product: windows
  category: file_event
detection:
  selection:
    TargetFilename|endswith:
      - '.cip'
      - 'SiPolicy.p7b'
      - 'SiPolicy.xml'
    TargetFilename|contains:
      - '\CodeIntegrity\CiPolicies\Active\'
      - '\CodeIntegrity\CiPolicies\Pending\'
      - '\CodeIntegrity\'
      - '\SysVol\'
  filter_known_mgmt:
    Image|endswith:
      - '\CiTool.exe'          # official WDAC policy management binary
      - '\msiexec.exe'
      - '\IntuneManagementExtension.exe'
    User|contains:
      - 'NT AUTHORITY\SYSTEM'   # refine to specific mgmt service accounts
  condition: selection and not filter_known_mgmt
fields:
  - TargetFilename
  - Image
  - User
falsepositives:
  - Planned policy revision via an approved change-management process
  - Intune/MDM policy distribution to managed endpoints
level: high
```

Two important caveats on the `filter_known_mgmt` branch: `CiTool.exe` is the legitimate policy tool but an attacker with admin can invoke it too, so consider gating the exclusion by the specific service account context rather than the binary alone. And `SYSTEM` is exactly the context an attacker with admin operates in, so refine `filter_known_mgmt` to *named* management service accounts, not the generic `SYSTEM` principal.

## 8. Detection Engineering Notes

- **Log the Code Integrity operational channel.** `Microsoft-Windows-CodeIntegrity/Operational` is where policy load and audit/block events live. Enable it centrally and forward it; many fleets do not, and it is the authoritative source for "which policy is active on this host."
- **Make heartbeat monitoring first-class.** The dark-endpoint detection is not a Sigma rule on a host — it is a SIEM/management-plane query. It is also the detection most likely to actually fire when the in-host telemetry is gone.
- **Treat policy deployment as tier-0.** The ability to add a code-integrity policy is equivalent to the ability to disable every control below it. Restrict who can write to `CiPolicies\Active`, alert on new policy files in system locations, and monitor GPO changes that push WDAC configuration.
- **Diversify telemetry.** A single agent that both detects and prevents can be silenced as a unit. Network, identity, DNS, and cloud-audit telemetry from elsewhere make a silenced endpoint visible from the outside.

## 9. References

- [When WDAC Turns Offensive: Blinding EDR — Anubhav Gain (this blog)](/posts/wdac-bypass-edr-isolation-containment/)
- [Using WDAC to Disable EDR — Krueger, 100 Days of Red Team](https://www.100daysofredteam.com/p/using-wdac-to-disable-edr-krueger)
- [A Nightmare on EDR Street: WDAC's Revenge — Beierle](https://beierle.win/2025-08-28-A-Nightmare-on-EDR-Street-WDACs-Revenge/)
- [Beazley Security — WDAC abuse against commercial EDR](https://beazley.security/insights/labs-team-uncovers-novel-abuse-of-wdac-to-disable-commercial-edr-products)
- [Microsoft — Code Integrity event logging](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/audit-windows-defender-application-control-policies)
- [MITRE ATT&CK T1562.001 — Disable or Modify Tools](https://attack.mitre.org/techniques/T1562/001/)
