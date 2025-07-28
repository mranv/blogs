---
author: Anubhav Gain
pubDatetime: 2025-01-28T16:32:00Z
title: Completely Disable PowerShell on Windows for Enhanced Security
slug: "disable-powershell-windows-security"
featured: false
draft: false
tags:
  - windows
  - security
  - powershell
  - hardening
  - enterprise
description: Multiple methods to completely disable PowerShell including both PowerShell.exe and PowerShell 7, with options for AppLocker, Software Restriction Policies, Registry modifications, and Windows Defender ASR rules.
---

## Table of contents

## Overview

To completely disable PowerShell, especially to block both PowerShell.exe and PowerShell 7 (pwsh.exe), including scripting engine access, you'll need a combination of Group Policy, AppLocker, or Software Restriction Policies, depending on your edition of Windows.

Here are multiple methods to block the PowerShell engine and execution:

## 🔒 Method 1: Use AppLocker (Enterprise / Education Editions only)

1. Open `gpedit.msc` → Go to: Computer Configuration → Windows Settings → Security Settings → Application Control Policies → AppLocker → Executable Rules

2. Right-click Executable Rules → Create New Rule.

3. Set the following:

   - **Action**: Deny
   - **User or Group**: Everyone
   - **Condition**: Path
   - **Path**: Add rules for:
     - `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
     - `C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe`
     - `C:\Program Files\PowerShell\7\pwsh.exe` (for PowerShell 7)
     - `C:\Program Files (x86)\PowerShell\7\pwsh.exe` (if 32-bit installed)

4. Enforce rules using the AppIDSvc:

```cmd
sc config AppIDSvc start=auto
net start AppIDSvc
```

## 🔧 Method 2: Software Restriction Policies (SRP) – Works in Pro/Enterprise

1. Open `gpedit.msc` → Go to: Computer Configuration → Windows Settings → Security Settings → Software Restriction Policies

2. If not configured yet, right-click → New Software Restriction Policies

3. Go to Additional Rules → right-click → New Path Rule

4. Add rules with **Disallowed**:
   - `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`
   - `%SystemRoot%\SysWOW64\WindowsPowerShell\v1.0\powershell.exe`
   - `%ProgramFiles%\PowerShell\7\pwsh.exe`
   - `%ProgramFiles(x86)%\PowerShell\7\pwsh.exe`

## 🧠 Method 3: Registry-based Blocking (Engine Level)

To break the scripting engine:

### 🔹 Block PowerShell Script Execution:

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell]
"ExecutionPolicy"="Restricted"

[HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell]
"ExecutionPolicy"="Restricted"
```

### 🔹 Disable PowerShell V2 (Deprecated but sometimes used in exploits):

```powershell
Disable-WindowsOptionalFeature -Online -FeatureName MicrosoftWindowsPowerShellV2Root -NoRestart
```

## 🛡️ Method 4: Rename or Remove PowerShell Binaries (Not Recommended)

Manually delete or rename:

- `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
- `C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe`
- PowerShell 7 installation directories (`pwsh.exe`)

⚠️ **Not recommended** as it can break OS tasks relying on PowerShell.

## 🚫 Optional: Block PowerShell via Windows Defender ASR Rules

If using Microsoft Defender for Endpoint, enable this ASR rule:

**Block all Office applications from creating child processes**

- GUID: `D4F940AB-401B-4EFC-AADC-AD5F3C50688A`

## ✅ Recommended Combo for Enterprise Environment:

1. Use AppLocker + Registry ExecutionPolicy + ASR Rules
2. Monitor any bypass attempts using Sysmon or Windows Event Logs

Would you like a PowerShell script or .reg file that automates this process?
