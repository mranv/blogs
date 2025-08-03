---
author: Anubhav Gain
pubDatetime: 2024-04-25T16:30:00Z
modDatetime: 2024-04-25T16:30:00Z
title: Remote Windows System Monitoring from Linux Using WMI and winexe
slug: windows-remote-monitoring-linux-wmi-commands
featured: true
draft: false
tags:
  - windows
  - linux
  - monitoring
  - wmi
  - winexe
  - sysadmin
  - devops
description: A comprehensive guide to remotely monitoring and managing Windows systems from Linux using winexe, wmic, and WQL queries with practical examples and troubleshooting tips.
---

# Remote Windows System Monitoring from Linux Using WMI and winexe

System administrators often need to manage and monitor Windows machines from Linux environments. This guide demonstrates how to effectively use tools like `winexe` and `wmic` to remotely execute commands and gather system information from Windows machines without installing agents.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Using winexe for Remote Command Execution](#using-winexe)
3. [Using wmic for Structured Data Queries](#using-wmic)
4. [WQL Queries with go-msrpc](#wql-queries-with-go-msrpc)
5. [Enabling Remote WMI Access](#enabling-remote-wmi-access)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Prerequisites

Before you begin, ensure you have:

- A Linux system with `winexe` and `wmic` installed
- Administrative credentials for the target Windows system
- Network connectivity between the Linux and Windows machines
- Basic understanding of Windows Management Instrumentation (WMI)

## Using winexe

`winexe` is a powerful tool that allows you to execute commands on Windows systems from a Linux machine. Here are some practical examples:

### Operating System & System Information

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 "systeminfo"
```

This command returns detailed OS information including version, build number, installed hotfixes, memory, and more.

### List Running Processes

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 "tasklist"
```

This lists all active processes on the Windows system.

### Network Configuration

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 "ipconfig /all"
```

Displays IP configuration details for all network interfaces.

### Environment Variables

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 "set"
```

Lists all environment variables, helping reveal system paths and configuration.

## Using wmic

While `winexe` executes standard Windows commands, `wmic` provides more structured output through Windows Management Instrumentation queries. Note that Remote UAC filtering may need to be properly disabled for these commands to work.

### Get OS Details

```bash
wmic -U 'DOMAIN/Administrator%Password123' //192.168.1.100 "get Caption, Version, BuildNumber /value"
```

This command outputs properties such as the OS name (Caption), version, and build number.

### List Processes (Brief)

```bash
wmic -U 'DOMAIN/Administrator%Password123' //192.168.1.100 "process list brief"
```

Lists running processes with key details like ProcessId and Name.

### Query CPU Information

```bash
wmic -U 'DOMAIN/Administrator%Password123' //192.168.1.100 "cpu get Name, NumberOfCores, NumberOfLogicalProcessors /value"
```

Retrieves detailed CPU specifications.

### Get Memory Information

```bash
wmic -U 'DOMAIN/Administrator%Password123' //192.168.1.100 "OS get FreePhysicalMemory,TotalVisibleMemorySize /value"
```

Provides information about memory usage and capacity.

### List Logical Disks

```bash
wmic -U 'DOMAIN/Administrator%Password123' //192.168.1.100 "logicaldisk get Caption,FileSystem,FreeSpace,Size /value"
```

Shows disk drives with their file systems, free space, and total size.

## WQL Queries with go-msrpc

For more complex queries, especially when working with the go-msrpc tool, you should use WQL (WMI Query Language), which has an SQL-like syntax. Here are some examples:

### Operating System Details

```bash
go run examples/samples_with_config/wmic.go \
  --username=Administrator \
  --domain=WORKGROUP \
  --password=Password123 \
  --auth-level=privacy \
  --auth-spnego \
  --auth-type=ntlm \
  --server=192.168.1.100 \
  --query "SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem"
```

### List Processes

```bash
go run examples/samples_with_config/wmic.go \
  --username=Administrator \
  --domain=WORKGROUP \
  --password=Password123 \
  --auth-level=privacy \
  --auth-spnego \
  --auth-type=ntlm \
  --server=192.168.1.100 \
  --query "SELECT ProcessId, Name, ExecutablePath FROM Win32_Process"
```

### CPU Information

```bash
go run examples/samples_with_config/wmic.go \
  --username=Administrator \
  --domain=WORKGROUP \
  --password=Password123 \
  --auth-level=privacy \
  --auth-spnego \
  --auth-type=ntlm \
  --server=192.168.1.100 \
  --query "SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor"
```

### Memory Information

```bash
go run examples/samples_with_config/wmic.go \
  --username=Administrator \
  --domain=WORKGROUP \
  --password=Password123 \
  --auth-level=privacy \
  --auth-spnego \
  --auth-type=ntlm \
  --server=192.168.1.100 \
  --query "SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem"
```

### Logical Disks

```bash
go run examples/samples_with_config/wmic.go \
  --username=Administrator \
  --domain=WORKGROUP \
  --password=Password123 \
  --auth-level=privacy \
  --auth-spnego \
  --auth-type=ntlm \
  --server=192.168.1.100 \
  --query "SELECT Caption, FileSystem, FreeSpace, Size FROM Win32_LogicalDisk"
```

## Enabling Remote WMI Access

If you encounter "Access Denied" errors, you may need to configure the Windows system to allow remote WMI access. You can use `winexe` to apply these changes remotely:

### Enable WMI through Windows Firewall

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 'cmd.exe /c netsh advfirewall firewall set rule group="Windows Management Instrumentation (WMI)" new enable=yes'
```

### Set WMI DCOM permissions through registry

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 'powershell -Command "Set-ItemProperty -Path \"HKLM:\\SOFTWARE\\Microsoft\\Ole\" -Name \"EnableDCOM\" -Value \"Y\""'
```

### Modify registry for LocalAccountTokenFilterPolicy

This is crucial for bypassing Remote UAC filtering:

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 'reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v LocalAccountTokenFilterPolicy /t REG_DWORD /d 1 /f'
```

### Enable SMB1 protocol support (if needed)

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 'powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol"'
```

### Restart the WMI service

```bash
winexe -U 'Administrator%Password123' //192.168.1.100 'cmd.exe /c net stop winmgmt && net start winmgmt'
```

> **Note**: After making these changes, a reboot of the Windows system is often required for them to take effect.

## Security Considerations

When using remote management tools, keep these security aspects in mind:

1. **Use Secure Credentials**: Avoid embedding credentials in scripts; use credential storage when possible.
2. **Least Privilege**: Create dedicated administrative accounts with only the necessary permissions.
3. **Network Security**: Restrict WMI and SMB access to trusted networks using firewalls.
4. **Audit Changes**: Log and monitor all remote management operations.
5. **Alternative Methods**: Consider modern alternatives like Windows Remote Management (WinRM) with PowerShell where appropriate.

## Troubleshooting Common Issues

### Access Denied Errors

If you receive "NT_STATUS_ACCESS_DENIED" or similar errors:

1. Verify credentials (username, password, domain)
2. Ensure the LocalAccountTokenFilterPolicy registry key is set correctly
3. Check that the remote user has administrative privileges
4. Verify that WMI services are running on the target machine

### WMI Query Errors

For "StatusInvalidQuery" errors:

1. Ensure you're using proper WQL syntax (SELECT statements) rather than wmic-style "get" commands
2. Check your query for typographical errors
3. Verify that the WMI classes and properties exist on the target Windows version

### Network Connectivity Issues

If you cannot connect to the remote system:

1. Verify network connectivity with ping or traceroute
2. Check that necessary ports (135, 445, etc.) are open
3. Ensure Windows Firewall or other security software is not blocking the connection

## Conclusion

Remote monitoring and management of Windows systems from Linux provides powerful capabilities for cross-platform system administration. By mastering tools like `winexe` and `wmic`, and understanding WQL queries, you can effectively gather information and execute commands without needing to install agents or accessing the Windows system directly.

Remember that these techniques should be used responsibly and securely, with proper attention to authentication, authorization, and auditing. For modern environments, you might also consider exploring API-based monitoring solutions that provide more secure and standardized interfaces for remote management.
