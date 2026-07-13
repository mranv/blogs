---
title: 'When WDAC Turns Offensive: Blinding EDR and the Case for Isolation'
author: Anubhav Gain
pubDatetime: 2025-09-29T00:00:00.000Z
slug: wdac-bypass-edr-isolation-containment
draft: false
featured: false
description: 'How attackers weaponise Windows Defender Application Control to switch off EDR at boot, why pure detect-and-respond buckles, and where isolation-first defence fills the gap.'
tags:
- wdac
- edr
- threat-intelligence
- defense-evasion
- isolation
- containment
- zero-trust
- windows-security
category: Threat Analysis
lang: en
---

# When WDAC Turns Offensive: Blinding EDR and the Case for Isolation

There is a particular kind of irony that security people appreciate more than most: the moment a defensive control becomes an offensive weapon. Windows Defender Application Control (WDAC) is built to decide what code is allowed to run. Over the last couple of years, attackers have inverted that logic — using WDAC policies to decide what *defensive* code is **not** allowed to run. The sensor stack that an EDR agent depends on can be switched off, kernel-side, before it ever initialises.

This is not a proof-of-concept anymore. It has shown up in incident-response engagements against commercial EDR products, and the underlying tooling has matured from a research demo into something that real adversaries reach for. This post is a short analytical tour: where the technique came from, why it is uncomfortable for the detect-and-respond model, and why isolation-first controls are the structural answer.

## Table of Contents

1. [The Inversion: WDAC as an Attack Primitive](#1-the-inversion-wdac-as-an-attack-primitive)
2. [From "Krueger" to "DreamDemon"](#2-from-krueger-to-dreamdemon)
3. [Why It Works: Boot Order and the Policy Trust Model](#3-why-it-works-boot-order-and-the-policy-trust-model)
4. [Why "Detect and Respond" Buckles](#4-why-detect-and-respond-buckles)
5. [Why Isolation and Containment Are Structural](#5-why-isolation-and-containment-are-structural)
6. [Practical Defensive Posture](#6-practical-defensive-posture)
7. [The Broader Lesson](#7-the-broader-lesson)
8. [References](#8-references)

---

## 1. The Inversion: WDAC as an Attack Primitive

A WDAC policy is, mechanically, an XML file compiled into a code-integrity policy that the kernel enforces. It is a list of *who is allowed to run*. Enterprise deployments use it to say "only signed, approved binaries may execute on this fleet." That same mechanism, in an attacker's hands, says "the EDR agent's binaries, drivers, and services may not execute on this host." Same engine, opposite allow-list.

The shape of the attack is therefore familiar to anyone who has administered a WDAC fleet:

- Craft a policy that **denies** the EDR's user-mode binaries, its kernel driver, and the services that wire them together.
- Get that policy into a system-critical location where Code Integrity will load it **early** — at boot, before the EDR agent starts.
- (Optionally) persist the policy through Group Policy so a reboot does not restore the sensor.

Once the policy is in place, the EDR's components fail to initialise. There is no process to inject into, no driver to load, no telemetry pipe to write to. From the console, the host looks healthy. From the endpoint, it is blind.

## 2. From "Krueger" to "DreamDemon"

The technique's public lineage is short and recent.

- **Krueger** — documented as part of the *"100 Days of Red Team"* series — is the foundational public write-up of building and deploying a WDAC policy whose explicit purpose is to disable an EDR agent. It is the clean expression of the idea: WDAC is bidirectional, so author a policy that turns the sensor off.
- **"A Nightmare on EDR Street: WDAC's Revenge"** (Jonathan Beierle, August 2025) is the follow-up that hardens and operationalises the concept under the moniker **DreamDemon**. It goes further than Krueger's deny-list by **embedding** WDAC policies inside the payload and hiding the supporting files, making cleanup and forensic recovery materially harder.
- **Beazley Security's IR disclosure** confirmed in-the-wild abuse: during an incident-response engagement, threat actors were observed using exactly this class of WDAC abuse against commercial EDR products (CrowdStrike-class sensors and Microsoft Defender for Endpoint among the named targets).

The trajectory is the standard one for a capable offensive technique: research write-up → working tool → hardened variant → observed in real intrusions. The window between "interesting idea" and "showing up in your IR" was short.

## 3. Why It Works: Boot Order and the Policy Trust Model

Two properties of Windows make this hard to defend against with detection alone.

**Boot-order asymmetry.** Code Integrity loads WDAC policies very early in the boot sequence — that is the whole point of putting application control in the kernel. EDR agents initialise later, in user space (and, where they have one, via an early-load kernel driver of their own). If an attacker can place a malicious policy somewhere Code Integrity will read it before the EDR's components come up, the sensor is denied by the time it would have started. The defence never gets a chance to phone home.

**The policy trust model is policy, not magic.** Administrators are trusted to add policies; Group Policy is a perfectly normal deployment channel; and the file paths Code Integrity reads are documented. An attacker who has already obtained admin-level access (which, in the engagements where this has been seen, they had) can use the same administrative primitives the defender uses. There is no privilege escalation here — there is a capability inversion. The defender's tool, used by someone with the defender's rights, for the opposite purpose.

That last point matters for scoping the risk: this is a **post-compromise, high-privilege** technique. It does not get an attacker in. It keeps them hidden once they are, and it removes the safety net that would otherwise catch the next stage of the intrusion.

## 4. Why "Detect and Respond" Buckles

The detect-and-respond model — sensors everywhere, alerts to a SOC, humans triage and react — is built on an assumption that the sensor is alive. WDAC-as-weapon breaks that assumption directly:

- **No visibility.** If the agent's driver and services are denied at boot, there is no hook delivering syscall telemetry, no ETW listener, no file-write events. The endpoint goes dark.
- **No alerts.** Alerts are generated *by the sensor*. A sensor that did not start cannot raise one. The absence of an alert is not evidence of safety; it is evidence of silence.
- **No response.** Many response actions (isolate host, kill process, collect memory) are commands *delivered to the agent*. With no agent, the console's "respond" button does nothing.

The cruellest part is the asymmetry in attention. A loud, noisy intrusion generates alerts and gets caught. A quiet, sensorless intrusion generates nothing and gets missed. Defenders are trained — reasonably — to chase signal. This technique manufactures silence, and silence does not look like an incident until long after it became one.

None of this means detect-and-respond is useless. It means it is **insufficient on its own**, and that an attacker with enough privilege can negate exactly the layer you were planning to catch them with.

## 5. Why Isolation and Containment Are Structural

If detection can be silenced, prevention has to hold. That is the argument for an isolation-first posture, and it is structurally different from detect-and-respond rather than a replacement for it.

- **Block before execute, not alert after execute.** Isolation controls decide whether an action is *permitted* in the first place. An unknown executable trying to run does not generate an alert that someone has to triage — it is denied, and a structured record of the denial is produced.
- **Zero-trust process isolation.** Risky lineages (documents spawning interpreters, child processes of untrusted parents, script engines called from Office) are confined rather than observed. The damage an attacker can do after the initial foothold is bounded by what the isolation policy permits, not by how quickly a human reads an alert.
- **Resilience to sensor loss.** Because isolation is enforced by the same class of kernel mechanism the attacker is trying to abuse, removing the *management console* does not remove the *enforcement*. The defence does not depend on a user-mode agent being alive to catch the next step.
- **Containment at the endpoint.** Lateral movement, credential theft and persistence all require the attacker to do things an isolation policy can refuse. Bounding those actions collapses the blast radius of an initial compromise.

The honest framing: detection tells you what happened; isolation limits what *can* happen. You need both, but if you have to pick an order, prevention is the load-bearing wall.

## 6. Practical Defensive Posture

A few concrete things that reduce the risk and the blast radius — none of them novel, all of them underused:

- **Protect WDAC policy deployment.** Treat the ability to add a code-integrity policy as a tier-0 action. Restrict who can write to `CiPolicies\Active`, alert on new policy files in system locations, and monitor GPO changes that push WDAC configuration.
- **Detect the dark endpoint.** The single most useful detection here is the *absence* of telemetry. If a host that always reports heartbeats goes silent outside a maintenance window, that is an incident until proven otherwise — do not let "no alerts" read as "no problem."
- **Watch for policy file writes at boot-relevant paths.** New `*.cip` files appearing outside your change-management process is a high-signal event.
- **Layer isolation controls.** Application control that denies unsigned/debugger binaries, attack-surface reduction rules, and behaviour policies that confine dangerous parent–child relationships all reduce the number of paths an attacker has from foothold to "I can rewrite your policy."
- **Assume breach and rehearse.** Run an exercise where an EDR is intentionally silenced and measure how long detection takes through other channels (network, identity, log gaps). The number is usually educational.
- **Don't put detection and prevention in one basket.** A single agent that does both can be silenced as a unit. Diversify telemetry sources — network, identity, DNS, cloud audit — so that an endpoint going dark is visible from somewhere else.

## 7. The Broader Lesson

The WDAC-as-weapon story is one instance of a pattern worth internalising: **any sufficiently powerful defensive control is also an offensive control, because power is symmetric.** Application control can permit your software; it can forbid the defender's software. EDR can observe an attacker; if its presence is observable and its load is controllable, an attacker can observe and control it back.

The defences that age well are the ones that do not depend on the attacker's cooperation or on a single sensor staying alive. Isolation, least privilege, network segmentation, diverse telemetry, and a rehearsed breach response are not exciting purchases — they are the structural work that keeps one clever bypass from unwinding an entire program.

Detection is how you learn you lost. Prevention and containment are how you limit how much.

---

## 8. References

- [Using WDAC to Disable EDR — "Krueger", 100 Days of Red Team](https://www.100daysofredteam.com/p/using-wdac-to-disable-edr-krueger)
- [A Nightmare on EDR Street: WDAC's Revenge — Jonathan Beierle](https://beierle.win/2025-08-28-A-Nightmare-on-EDR-Street-WDACs-Revenge/)
- [Labs Team Uncovers Novel Abuse of WDAC to Disable Commercial EDR — Beazley Security](https://beazley.security/insights/labs-team-uncovers-novel-abuse-of-wdac-to-disable-commercial-edr-products)
- [Weaponizing Windows Allow Listing (WDAC) to Kill EDR — YouTube](https://www.youtube.com/watch?v=C8qSli2uaa4)
- [Hackers Leverage WDAC Policies to Disable EDR Agents — Siembiot](https://siembiot.eu/cyber-security-news/hackers-leverage-windows-defender-application-control-policies-to-disable-edr-agents/53363)
- [Windows Defender Application Control — Microsoft Learn](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-defender-application-control/windows-defender-application-control)
- [Zero Trust Architecture — NIST SP 800-207](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf)
