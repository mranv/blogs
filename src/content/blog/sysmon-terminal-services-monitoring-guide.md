---
title: "Sysmon Terminal Services Monitoring: Complete Detection and Response Guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-10T22:30:00Z
featured: false
draft: false
tags:
  - sysmon
  - terminal-services
  - rdp
  - monitoring
  - security
  - windows
  - detection
  - logging
description: "Comprehensive guide to monitoring Terminal Services and RDP activities using Sysmon, including advanced configuration, threat detection rules, and incident response strategies."
---

# Sysmon Terminal Services Monitoring: Complete Detection Guide

This comprehensive guide covers the implementation of advanced Terminal Services monitoring using Sysmon, focusing on detecting RDP attacks, lateral movement, and suspicious remote access activities. Learn to configure Sysmon for comprehensive Terminal Services visibility and build effective detection rules.

## Table of Contents

## Understanding Terminal Services Security

Terminal Services (Remote Desktop Services) represent a critical attack vector in Windows environments. Attackers often target RDP services for:

- **Initial Access**: Exploiting weak credentials or vulnerabilities
- **Lateral Movement**: Moving between systems using compromised accounts
- **Persistence**: Maintaining access through legitimate remote services
- **Privilege Escalation**: Exploiting RDP session vulnerabilities
- **Data Exfiltration**: Using clipboard and file transfer capabilities

### Common Terminal Services Threats

1. **Brute Force Attacks**: Automated credential guessing
2. **Pass-the-Hash**: Using stolen credentials for authentication
3. **Session Hijacking**: Taking over active RDP sessions
4. **BlueKeep Exploitation**: CVE-2019-0708 and related vulnerabilities
5. **Credential Stuffing**: Using breached credentials from other sources

## Sysmon Configuration for Terminal Services

### Core Sysmon Configuration

```xml
<!-- sysmon-terminal-services.xml -->
<Sysmon schemaversion="4.82">
  <HashAlgorithms>md5,sha256,IMPHASH</HashAlgorithms>
  <CheckRevocation>false</CheckRevocation>
  <DnsLookup>false</DnsLookup>
  <ArchiveDirectory>SysmonArchive</ArchiveDirectory>

  <EventFiltering>
    <!-- Event ID 1: Process Creation -->
    <RuleGroup name="" groupRelation="or">
      <ProcessCreate onmatch="include">
        <!-- Terminal Services related processes -->
        <Image condition="contains">rdpclip.exe</Image>
        <Image condition="contains">tstheme.exe</Image>
        <Image condition="contains">dwm.exe</Image>
        <Image condition="contains">winlogon.exe</Image>
        <Image condition="contains">csrss.exe</Image>
        <Image condition="contains">rdpinit.exe</Image>
        <Image condition="contains">rdpshell.exe</Image>

        <!-- RDP Client processes -->
        <Image condition="contains">mstsc.exe</Image>
        <Image condition="contains">mstscax.dll</Image>

        <!-- Terminal Services utilities -->
        <Image condition="contains">tscon.exe</Image>
        <Image condition="contains">tsdiscon.exe</Image>
        <Image condition="contains">rwinsta.exe</Image>
        <Image condition="contains">qwinsta.exe</Image>
        <Image condition="contains">quser.exe</Image>
        <Image condition="contains">query.exe</Image>

        <!-- Remote access tools -->
        <Image condition="contains">teamviewer.exe</Image>
        <Image condition="contains">anydesk.exe</Image>
        <Image condition="contains">vnc</Image>
        <Image condition="contains">logmein</Image>

        <!-- Suspicious parent processes -->
        <ParentImage condition="contains">rdpclip.exe</ParentImage>
        <ParentImage condition="contains">winlogon.exe</ParentImage>

        <!-- Commands executed over RDP sessions -->
        <CommandLine condition="contains">powershell</CommandLine>
        <CommandLine condition="contains">cmd.exe</CommandLine>
        <CommandLine condition="contains">wmic</CommandLine>
        <CommandLine condition="contains">net user</CommandLine>
        <CommandLine condition="contains">net group</CommandLine>
        <CommandLine condition="contains">whoami</CommandLine>
        <CommandLine condition="contains">systeminfo</CommandLine>
      </ProcessCreate>
    </RuleGroup>

    <!-- Event ID 3: Network Connection -->
    <RuleGroup name="" groupRelation="or">
      <NetworkConnect onmatch="include">
        <!-- RDP Traffic (Port 3389) -->
        <DestinationPort condition="is">3389</DestinationPort>
        <SourcePort condition="is">3389</SourcePort>

        <!-- Alternative RDP Ports -->
        <DestinationPort condition="is">3390</DestinationPort>
        <DestinationPort condition="is">3391</DestinationPort>
        <DestinationPort condition="is">33890</DestinationPort>

        <!-- RDP-related processes -->
        <Image condition="contains">mstsc.exe</Image>
        <Image condition="contains">rdpclip.exe</Image>
        <Image condition="contains">tstheme.exe</Image>

        <!-- Terminal Services processes -->
        <Image condition="contains">svchost.exe</Image>
        <Image condition="contains">termsrv.dll</Image>

        <!-- Outbound connections from RDP sessions -->
        <User condition="contains">RDP-Tcp</User>
        <User condition="contains">Console</User>

        <!-- Suspicious network activity -->
        <DestinationHostname condition="contains">bit.ly</DestinationHostname>
        <DestinationHostname condition="contains">pastebin</DestinationHostname>
        <DestinationHostname condition="contains">github.com</DestinationHostname>
        <DestinationHostname condition="contains">githubusercontent</DestinationHostname>
      </NetworkConnect>
    </RuleGroup>

    <!-- Event ID 5: Process Terminated -->
    <RuleGroup name="" groupRelation="or">
      <ProcessTerminate onmatch="include">
        <!-- Terminal Services process termination -->
        <Image condition="contains">rdpclip.exe</Image>
        <Image condition="contains">tstheme.exe</Image>
        <Image condition="contains">dwm.exe</Image>

        <!-- RDP session cleanup -->
        <Image condition="contains">mstsc.exe</Image>
        <Image condition="contains">tsclient</Image>
      </ProcessTerminate>
    </RuleGroup>

    <!-- Event ID 7: Image/Library Loaded -->
    <RuleGroup name="" groupRelation="or">
      <ImageLoad onmatch="include">
        <!-- Terminal Services DLLs -->
        <ImageLoaded condition="contains">termsrv.dll</ImageLoaded>
        <ImageLoaded condition="contains">rdpcorekmts.dll</ImageLoaded>
        <ImageLoaded condition="contains">rdpcorets.dll</ImageLoaded>
        <ImageLoaded condition="contains">rdpcore.dll</ImageLoaded>
        <ImageLoaded condition="contains">mstscax.dll</ImageLoaded>
        <ImageLoaded condition="contains">tsclient.dll</ImageLoaded>

        <!-- RDP-related modules -->
        <ImageLoaded condition="contains">rdpdr.sys</ImageLoaded>
        <ImageLoaded condition="contains">rdpsnd.sys</ImageLoaded>
        <ImageLoaded condition="contains">rdpwd.sys</ImageLoaded>

        <!-- Clipboard redirection -->
        <ImageLoaded condition="contains">rdpclip.dll</ImageLoaded>
        <ImageLoaded condition="contains">cliprdr.dll</ImageLoaded>

        <!-- Drive redirection -->
        <ImageLoaded condition="contains">rdpdr.dll</ImageLoaded>
        <ImageLoaded condition="contains">tsclient.dll</ImageLoaded>
      </ImageLoad>
    </RuleGroup>

    <!-- Event ID 8: CreateRemoteThread -->
    <RuleGroup name="" groupRelation="or">
      <CreateRemoteThread onmatch="include">
        <!-- Injection into Terminal Services processes -->
        <TargetImage condition="contains">csrss.exe</TargetImage>
        <TargetImage condition="contains">winlogon.exe</TargetImage>
        <TargetImage condition="contains">rdpclip.exe</TargetImage>
        <TargetImage condition="contains">dwm.exe</TargetImage>

        <!-- RDP session injection -->
        <SourceImage condition="contains">mstsc.exe</SourceImage>
        <TargetImage condition="contains">explorer.exe</TargetImage>
      </CreateRemoteThread>
    </RuleGroup>

    <!-- Event ID 10: Process Access -->
    <RuleGroup name="" groupRelation="or">
      <ProcessAccess onmatch="include">
        <!-- Access to Terminal Services processes -->
        <TargetImage condition="contains">csrss.exe</TargetImage>
        <TargetImage condition="contains">winlogon.exe</TargetImage>
        <TargetImage condition="contains">rdpclip.exe</TargetImage>
        <TargetImage condition="contains">dwm.exe</TargetImage>
        <TargetImage condition="contains">lsass.exe</TargetImage>

        <!-- Credential dumping attempts -->
        <GrantedAccess>0x1010</GrantedAccess>
        <GrantedAccess>0x1410</GrantedAccess>
        <GrantedAccess>0x143a</GrantedAccess>

        <!-- RDP process access patterns -->
        <SourceImage condition="contains">powershell.exe</SourceImage>
        <SourceImage condition="contains">cmd.exe</SourceImage>
        <CallTrace condition="contains">UNKNOWN</CallTrace>
      </ProcessAccess>
    </RuleGroup>

    <!-- Event ID 11: File Created -->
    <RuleGroup name="" groupRelation="or">
      <FileCreate onmatch="include">
        <!-- RDP cache and temporary files -->
        <TargetFilename condition="contains">\Local Settings\Temporary Internet Files\</TargetFilename>
        <TargetFilename condition="contains">\Microsoft\Terminal Server Client\</TargetFilename>
        <TargetFilename condition="contains">\rdp_cache\</TargetFilename>
        <TargetFilename condition="contains">tsclient</TargetFilename>

        <!-- Clipboard cache -->
        <TargetFilename condition="contains">\rdpclip</TargetFilename>
        <TargetFilename condition="contains">\ClipboardCache</TargetFilename>

        <!-- RDP configuration files -->
        <TargetFilename condition="contains">.rdp</TargetFilename>
        <TargetFilename condition="contains">Default.rdp</TargetFilename>

        <!-- Suspicious file locations -->
        <TargetFilename condition="contains">\AppData\Local\Temp\</TargetFilename>
        <TargetFilename condition="contains">\Windows\Temp\</TargetFilename>
        <TargetFilename condition="contains">\ProgramData\</TargetFilename>

        <!-- Executable files from RDP sessions -->
        <TargetFilename condition="endswith">.exe</TargetFilename>
        <TargetFilename condition="endswith">.dll</TargetFilename>
        <TargetFilename condition="endswith">.bat</TargetFilename>
        <TargetFilename condition="endswith">.ps1</TargetFilename>
        <TargetFilename condition="endswith">.vbs</TargetFilename>
      </FileCreate>
    </RuleGroup>

    <!-- Event ID 12: Registry Event (Object create and delete) -->
    <RuleGroup name="" groupRelation="or">
      <RegistryEvent onmatch="include">
        <!-- Terminal Services registry keys -->
        <TargetObject condition="contains">SYSTEM\CurrentControlSet\Control\Terminal Server</TargetObject>
        <TargetObject condition="contains">SOFTWARE\Microsoft\Terminal Server Client</TargetObject>
        <TargetObject condition="contains">SYSTEM\CurrentControlSet\Services\TermService</TargetObject>

        <!-- RDP settings modifications -->
        <TargetObject condition="contains">fDenyTSConnections</TargetObject>
        <TargetObject condition="contains">UserAuthentication</TargetObject>
        <TargetObject condition="contains">SecurityLayer</TargetObject>
        <TargetObject condition="contains">PortNumber</TargetObject>

        <!-- Session configuration -->
        <TargetObject condition="contains">WinStations\RDP-Tcp</TargetObject>
        <TargetObject condition="contains">WinStations\Console</TargetObject>

        <!-- Clipboard and drive redirection -->
        <TargetObject condition="contains">fDisableClip</TargetObject>
        <TargetObject condition="contains">fDisableCdm</TargetObject>
        <TargetObject condition="contains">fDisableCam</TargetObject>

        <!-- Authentication settings -->
        <TargetObject condition="contains">HKLM\SYSTEM\CurrentControlSet\Control\Lsa</TargetObject>
        <TargetObject condition="contains">DisableRestrictedAdmin</TargetObject>
      </RegistryEvent>
    </RuleGroup>

    <!-- Event ID 13: Registry Value Set -->
    <RuleGroup name="" groupRelation="or">
      <RegistryEvent onmatch="include">
        <!-- Critical Terminal Services settings -->
        <TargetObject condition="contains">SYSTEM\CurrentControlSet\Control\Terminal Server\fDenyTSConnections</TargetObject>
        <TargetObject condition="contains">SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp\PortNumber</TargetObject>
        <TargetObject condition="contains">SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp\UserAuthentication</TargetObject>

        <!-- Security layer modifications -->
        <TargetObject condition="contains">SecurityLayer</TargetObject>
        <TargetObject condition="contains">MinEncryptionLevel</TargetObject>

        <!-- Session timeout settings -->
        <TargetObject condition="contains">MaxConnectionTime</TargetObject>
        <TargetObject condition="contains">MaxDisconnectionTime</TargetObject>
        <TargetObject condition="contains">MaxIdleTime</TargetObject>
      </RegistryEvent>
    </RuleGroup>

    <!-- Event ID 15: File Create Stream Hash -->
    <RuleGroup name="" groupRelation="or">
      <FileCreateStreamHash onmatch="include">
        <!-- RDP-related alternate data streams -->
        <TargetFilename condition="contains">tsclient</TargetFilename>
        <TargetFilename condition="contains">rdpclip</TargetFilename>
        <TargetFilename condition="contains">.rdp:</TargetFilename>

        <!-- Suspicious ADS in RDP directories -->
        <TargetFilename condition="contains">\Terminal Server Client\</TargetFilename>
        <TargetFilename condition="contains">\Microsoft\Terminal Server Client\</TargetFilename>
      </FileCreateStreamHash>
    </RuleGroup>

    <!-- Event ID 17: Pipe Created -->
    <RuleGroup name="" groupRelation="or">
      <PipeEvent onmatch="include">
        <!-- Terminal Services named pipes -->
        <PipeName condition="contains">TermSrv</PipeName>
        <PipeName condition="contains">trkwks</PipeName>
        <PipeName condition="contains">Ctx_WinStation_API_service</PipeName>
        <PipeName condition="contains">ICA</PipeName>

        <!-- RDP session pipes -->
        <PipeName condition="contains">RDPClient</PipeName>
        <PipeName condition="contains">TSClient</PipeName>

        <!-- Clipboard pipes -->
        <PipeName condition="contains">cliprdr</PipeName>

        <!-- Suspicious pipe names -->
        <PipeName condition="contains">rdp</PipeName>
        <PipeName condition="contains">remote</PipeName>
      </PipeEvent>
    </RuleGroup>

    <!-- Event ID 18: Pipe Connected -->
    <RuleGroup name="" groupRelation="or">
      <PipeEvent onmatch="include">
        <!-- Connections to Terminal Services pipes -->
        <PipeName condition="contains">TermSrv</PipeName>
        <PipeName condition="contains">trkwks</PipeName>
        <PipeName condition="contains">Ctx_WinStation_API_service</PipeName>

        <!-- RDP client connections -->
        <PipeName condition="contains">RDPClient</PipeName>
        <PipeName condition="contains">cliprdr</PipeName>
      </PipeEvent>
    </RuleGroup>

    <!-- Event ID 22: DNS Query -->
    <RuleGroup name="" groupRelation="or">
      <DnsQuery onmatch="include">
        <!-- DNS queries from RDP processes -->
        <Image condition="contains">mstsc.exe</Image>
        <Image condition="contains">rdpclip.exe</Image>

        <!-- Suspicious domains from RDP sessions -->
        <QueryName condition="contains">bit.ly</QueryName>
        <QueryName condition="contains">pastebin</QueryName>
        <QueryName condition="contains">github.com</QueryName>
        <QueryName condition="contains">powershellgallery.com</QueryName>

        <!-- Dynamic DNS providers -->
        <QueryName condition="contains">dyndns</QueryName>
        <QueryName condition="contains">no-ip</QueryName>
        <QueryName condition="contains">ddns</QueryName>
      </DnsQuery>
    </RuleGroup>

    <!-- Event ID 25: Process Tampering -->
    <RuleGroup name="" groupRelation="or">
      <ProcessTampering onmatch="include">
        <!-- Tampering with Terminal Services processes -->
        <Image condition="contains">csrss.exe</Image>
        <Image condition="contains">winlogon.exe</Image>
        <Image condition="contains">rdpclip.exe</Image>
        <Image condition="contains">dwm.exe</Image>
        <Image condition="contains">lsass.exe</Image>
      </ProcessTampering>
    </RuleGroup>

    <!-- Event ID 26: File Delete -->
    <RuleGroup name="" groupRelation="or">
      <FileDelete onmatch="include">
        <!-- RDP cache cleanup -->
        <TargetFilename condition="contains">\Terminal Server Client\</TargetFilename>
        <TargetFilename condition="contains">tsclient</TargetFilename>
        <TargetFilename condition="contains">rdpclip</TargetFilename>

        <!-- Log file deletion -->
        <TargetFilename condition="contains">\Windows\System32\LogFiles\</TargetFilename>
        <TargetFilename condition="contains">\Security.evtx</TargetFilename>
        <TargetFilename condition="contains">\System.evtx</TargetFilename>

        <!-- RDP configuration files -->
        <TargetFilename condition="endswith">.rdp</TargetFilename>
      </FileDelete>
    </RuleGroup>

    <!-- Exclusions -->
    <RuleGroup name="" groupRelation="or">
      <ProcessCreate onmatch="exclude">
        <!-- Legitimate system processes -->
        <Image condition="is">C:\Windows\System32\csrss.exe</Image>
        <Image condition="is">C:\Windows\System32\winlogon.exe</Image>
        <ParentImage condition="is">C:\Windows\System32\services.exe</ParentImage>

        <!-- Known good software -->
        <Image condition="contains">C:\Program Files\</Image>
        <Image condition="contains">C:\Program Files (x86)\</Image>

        <!-- System updates -->
        <CommandLine condition="contains">Windows Update</CommandLine>
        <CommandLine condition="contains">TrustedInstaller</CommandLine>
      </ProcessCreate>
    </RuleGroup>
  </EventFiltering>
</Sysmon>
```

## Advanced Detection Rules

### Suspicious RDP Activity Detection

```xml
<!-- High-confidence RDP attack indicators -->
<RuleGroup name="RDP_Attack_Indicators" groupRelation="or">
  <ProcessCreate onmatch="include">
    <!-- Rare Terminal Services utilities -->
    <Image condition="contains">tscon.exe</Image>
    <Image condition="contains">tsdiscon.exe</Image>
    <Image condition="contains">rwinsta.exe</Image>
    <Image condition="contains">qwinsta.exe</Image>

    <!-- Session hijacking attempts -->
    <CommandLine condition="contains">tscon /dest:console</CommandLine>
    <CommandLine condition="contains">tscon /dest:rdp</CommandLine>
    <CommandLine condition="contains">rwinsta /server:</CommandLine>

    <!-- RDP tunnel creation -->
    <CommandLine condition="contains">portfwd</CommandLine>
    <CommandLine condition="contains">netsh interface portproxy</CommandLine>
    <CommandLine condition="contains">ssh -L 3389</CommandLine>

    <!-- Credential extraction from RDP -->
    <CommandLine condition="contains">sekurlsa::tspkg</CommandLine>
    <CommandLine condition="contains">sekurlsa::credman</CommandLine>
    <CommandLine condition="contains">lsadump::cache</CommandLine>
  </ProcessCreate>
</RuleGroup>

<!-- Lateral movement via RDP -->
<RuleGroup name="RDP_Lateral_Movement" groupRelation="or">
  <NetworkConnect onmatch="include">
    <!-- Rapid successive RDP connections -->
    <DestinationPort condition="is">3389</DestinationPort>
    <Image condition="contains">mstsc.exe</Image>

    <!-- RDP to multiple hosts -->
    <DestinationIp condition="contains">192.168.</DestinationIp>
    <DestinationIp condition="contains">10.</DestinationIp>
    <DestinationIp condition="contains">172.16.</DestinationIp>
  </NetworkConnect>
</RuleGroup>

<!-- RDP configuration tampering -->
<RuleGroup name="RDP_Configuration_Tampering" groupRelation="or">
  <RegistryEvent onmatch="include">
    <!-- Enabling RDP -->
    <TargetObject condition="contains">fDenyTSConnections</TargetObject>
    <Details condition="is">0x00000000</Details>

    <!-- Disabling NLA -->
    <TargetObject condition="contains">UserAuthentication</TargetObject>
    <Details condition="is">0x00000000</Details>

    <!-- Changing RDP port -->
    <TargetObject condition="contains">PortNumber</TargetObject>
    <Details condition="isnot">0x00000d3d</Details>

    <!-- Weakening security -->
    <TargetObject condition="contains">SecurityLayer</TargetObject>
    <Details condition="is">0x00000000</Details>
  </RegistryEvent>
</RuleGroup>
```

### Persistence Detection

```xml
<!-- RDP persistence mechanisms -->
<RuleGroup name="RDP_Persistence" groupRelation="or">
  <RegistryEvent onmatch="include">
    <!-- RDP service modifications -->
    <TargetObject condition="contains">SYSTEM\CurrentControlSet\Services\TermService</TargetObject>
    <TargetObject condition="contains">Start</TargetObject>
    <Details condition="is">0x00000002</Details>

    <!-- Sticky keys backdoor -->
    <TargetObject condition="contains">Image File Execution Options\sethc.exe</TargetObject>
    <TargetObject condition="contains">Debugger</TargetObject>

    <!-- Utilman backdoor -->
    <TargetObject condition="contains">Image File Execution Options\utilman.exe</TargetObject>
    <TargetObject condition="contains">Debugger</TargetObject>

    <!-- Magnifier backdoor -->
    <TargetObject condition="contains">Image File Execution Options\magnify.exe</TargetObject>
    <TargetObject condition="contains">Debugger</TargetObject>

    <!-- OSK backdoor -->
    <TargetObject condition="contains">Image File Execution Options\osk.exe</TargetObject>
    <TargetObject condition="contains">Debugger</TargetObject>
  </RegistryEvent>

  <FileCreate onmatch="include">
    <!-- Accessibility tool replacement -->
    <TargetFilename condition="is">C:\Windows\System32\sethc.exe</TargetFilename>
    <TargetFilename condition="is">C:\Windows\System32\utilman.exe</TargetFilename>
    <TargetFilename condition="is">C:\Windows\System32\magnify.exe</TargetFilename>
    <TargetFilename condition="is">C:\Windows\System32\osk.exe</TargetFilename>

    <!-- Backup accessibility tools -->
    <TargetFilename condition="contains">sethc.exe.backup</TargetFilename>
    <TargetFilename condition="contains">utilman.exe.backup</TargetFilename>
  </FileCreate>
</RuleGroup>
```

## Detection Analytics and Queries

### PowerShell Detection Queries

```powershell
# Get-RDPConnections.ps1 - Analyze RDP connections from Sysmon logs

# Function to query Sysmon events for RDP activity
function Get-RDPConnections {
    param(
        [Parameter(Mandatory=$true)]
        [datetime]$StartTime,

        [Parameter(Mandatory=$true)]
        [datetime]$EndTime,

        [Parameter(Mandatory=$false)]
        [string]$ComputerName = $env:COMPUTERNAME
    )

    Write-Host "Analyzing RDP connections between $StartTime and $EndTime on $ComputerName" -ForegroundColor Green

    # Query for RDP network connections (Event ID 3)
    $rdpConnections = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 3
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName | Where-Object {
        $_.Message -match "DestinationPort: 3389|SourcePort: 3389" -or
        $_.Message -match "mstsc.exe|rdpclip.exe"
    }

    # Query for RDP process creation (Event ID 1)
    $rdpProcesses = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 1
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName | Where-Object {
        $_.Message -match "mstsc.exe|rdpclip.exe|tscon.exe|tsdiscon.exe|qwinsta.exe"
    }

    # Query for RDP registry modifications (Event ID 13)
    $rdpRegistry = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 13
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName | Where-Object {
        $_.Message -match "Terminal Server|fDenyTSConnections|PortNumber"
    }

    # Analyze and format results
    $results = @{
        NetworkConnections = @()
        ProcessActivity = @()
        RegistryChanges = @()
        SuspiciousActivity = @()
    }

    # Process network connections
    foreach ($connection in $rdpConnections) {
        $xml = [xml]$connection.ToXml()
        $eventData = $xml.Event.EventData.Data

        $connInfo = @{
            TimeCreated = $connection.TimeCreated
            ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
            Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
            SourceIp = ($eventData | Where-Object {$_.Name -eq 'SourceIp'}).'#text'
            DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
            SourcePort = ($eventData | Where-Object {$_.Name -eq 'SourcePort'}).'#text'
            DestinationPort = ($eventData | Where-Object {$_.Name -eq 'DestinationPort'}).'#text'
            User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
        }

        $results.NetworkConnections += $connInfo
    }

    # Process RDP processes
    foreach ($process in $rdpProcesses) {
        $xml = [xml]$process.ToXml()
        $eventData = $xml.Event.EventData.Data

        $processInfo = @{
            TimeCreated = $process.TimeCreated
            ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
            Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
            CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
            User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            ParentImage = ($eventData | Where-Object {$_.Name -eq 'ParentImage'}).'#text'
            ParentCommandLine = ($eventData | Where-Object {$_.Name -eq 'ParentCommandLine'}).'#text'
        }

        $results.ProcessActivity += $processInfo

        # Flag suspicious activities
        if ($processInfo.CommandLine -match "tscon|tsdiscon|rwinsta" -or
            $processInfo.Image -match "tscon.exe|tsdiscon.exe|rwinsta.exe") {
            $results.SuspiciousActivity += @{
                Type = "Session Management"
                TimeCreated = $process.TimeCreated
                Details = $processInfo
            }
        }
    }

    # Process registry changes
    foreach ($regChange in $rdpRegistry) {
        $xml = [xml]$regChange.ToXml()
        $eventData = $xml.Event.EventData.Data

        $regInfo = @{
            TimeCreated = $regChange.TimeCreated
            ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
            Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
            TargetObject = ($eventData | Where-Object {$_.Name -eq 'TargetObject'}).'#text'
            Details = ($eventData | Where-Object {$_.Name -eq 'Details'}).'#text'
            User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
        }

        $results.RegistryChanges += $regInfo

        # Flag suspicious registry changes
        if ($regInfo.TargetObject -match "fDenyTSConnections" -and $regInfo.Details -eq "DWORD (0x00000000)") {
            $results.SuspiciousActivity += @{
                Type = "RDP Enabled"
                TimeCreated = $regChange.TimeCreated
                Details = $regInfo
            }
        } elseif ($regInfo.TargetObject -match "PortNumber" -and $regInfo.Details -ne "DWORD (0x00000d3d)") {
            $results.SuspiciousActivity += @{
                Type = "RDP Port Changed"
                TimeCreated = $regChange.TimeCreated
                Details = $regInfo
            }
        }
    }

    return $results
}

# Function to detect RDP brute force attempts
function Get-RDPBruteForce {
    param(
        [Parameter(Mandatory=$true)]
        [datetime]$StartTime,

        [Parameter(Mandatory=$true)]
        [datetime]$EndTime,

        [Parameter(Mandatory=$false)]
        [int]$ThresholdCount = 10,

        [Parameter(Mandatory=$false)]
        [string]$ComputerName = $env:COMPUTERNAME
    )

    # Get RDP connection attempts
    $connections = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 3
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName | Where-Object {
        $_.Message -match "DestinationPort: 3389"
    }

    # Group by source IP and count
    $connectionsByIP = $connections | ForEach-Object {
        $xml = [xml]$_.ToXml()
        $eventData = $xml.Event.EventData.Data
        $sourceIp = ($eventData | Where-Object {$_.Name -eq 'SourceIp'}).'#text'

        [PSCustomObject]@{
            TimeCreated = $_.TimeCreated
            SourceIp = $sourceIp
            DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
            ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
        }
    } | Group-Object SourceIp

    # Identify potential brute force attacks
    $bruteForceAttempts = $connectionsByIP | Where-Object {
        $_.Count -ge $ThresholdCount
    } | ForEach-Object {
        [PSCustomObject]@{
            SourceIP = $_.Name
            ConnectionCount = $_.Count
            FirstAttempt = ($_.Group | Sort-Object TimeCreated)[0].TimeCreated
            LastAttempt = ($_.Group | Sort-Object TimeCreated)[-1].TimeCreated
            UniqueDestinations = ($_.Group | Select-Object -Unique DestinationIp).Count
            TimeSpan = (($_.Group | Sort-Object TimeCreated)[-1].TimeCreated - ($_.Group | Sort-Object TimeCreated)[0].TimeCreated).TotalMinutes
        }
    }

    return $bruteForceAttempts
}

# Function to detect RDP lateral movement
function Get-RDPLateralMovement {
    param(
        [Parameter(Mandatory=$true)]
        [datetime]$StartTime,

        [Parameter(Mandatory=$true)]
        [datetime]$EndTime,

        [Parameter(Mandatory=$false)]
        [string]$ComputerName = $env:COMPUTERNAME
    )

    # Get outbound RDP connections
    $outboundConnections = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 3
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName | Where-Object {
        $_.Message -match "DestinationPort: 3389" -and
        $_.Message -match "mstsc.exe"
    }

    # Analyze for patterns indicating lateral movement
    $lateralMovement = $outboundConnections | ForEach-Object {
        $xml = [xml]$_.ToXml()
        $eventData = $xml.Event.EventData.Data

        [PSCustomObject]@{
            TimeCreated = $_.TimeCreated
            SourceIp = ($eventData | Where-Object {$_.Name -eq 'SourceIp'}).'#text'
            DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
            User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
            Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
        }
    } | Group-Object User | Where-Object {
        # Multiple destinations indicate potential lateral movement
        ($_.Group | Select-Object -Unique DestinationIp).Count -gt 2
    }

    return $lateralMovement
}

# Usage examples
$results = Get-RDPConnections -StartTime (Get-Date).AddHours(-24) -EndTime (Get-Date)
$bruteForce = Get-RDPBruteForce -StartTime (Get-Date).AddHours(-24) -EndTime (Get-Date) -ThresholdCount 5
$lateralMovement = Get-RDPLateralMovement -StartTime (Get-Date).AddHours(-24) -EndTime (Get-Date)

# Display results
Write-Host "=== RDP Activity Summary ===" -ForegroundColor Yellow
Write-Host "Network Connections: $($results.NetworkConnections.Count)" -ForegroundColor Cyan
Write-Host "Process Activity: $($results.ProcessActivity.Count)" -ForegroundColor Cyan
Write-Host "Registry Changes: $($results.RegistryChanges.Count)" -ForegroundColor Cyan
Write-Host "Suspicious Activities: $($results.SuspiciousActivity.Count)" -ForegroundColor Red

if ($bruteForce.Count -gt 0) {
    Write-Host "=== Potential Brute Force Attacks ===" -ForegroundColor Red
    $bruteForce | Format-Table -AutoSize
}

if ($lateralMovement.Count -gt 0) {
    Write-Host "=== Potential Lateral Movement ===" -ForegroundColor Red
    $lateralMovement | Format-Table -AutoSize
}
```

### Elasticsearch/Splunk Queries

```sql
-- Elasticsearch query for RDP activity
GET sysmon-*/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "@timestamp": {
              "gte": "now-24h"
            }
          }
        },
        {
          "bool": {
            "should": [
              {
                "match": {
                  "event.code": "3"
                }
              },
              {
                "match": {
                  "event.code": "1"
                }
              }
            ]
          }
        },
        {
          "bool": {
            "should": [
              {
                "match": {
                  "winlog.event_data.DestinationPort": "3389"
                }
              },
              {
                "match": {
                  "winlog.event_data.Image": "*mstsc.exe"
                }
              },
              {
                "match": {
                  "winlog.event_data.Image": "*rdpclip.exe"
                }
              }
            ]
          }
        }
      ]
    }
  },
  "aggs": {
    "rdp_activity_by_host": {
      "terms": {
        "field": "host.name",
        "size": 50
      }
    },
    "rdp_connections_by_ip": {
      "terms": {
        "field": "winlog.event_data.SourceIp",
        "size": 100
      }
    }
  }
}

-- Splunk query for RDP brute force detection
index=sysmon EventCode=3 DestinationPort=3389
| eval src_ip=SourceIp, dest_ip=DestinationIp
| stats count as connection_attempts, earliest(_time) as first_attempt, latest(_time) as last_attempt by src_ip, dest_ip
| where connection_attempts > 10
| eval duration_minutes=round((last_attempt-first_attempt)/60,2)
| sort - connection_attempts
| table src_ip, dest_ip, connection_attempts, first_attempt, last_attempt, duration_minutes

-- RDP lateral movement detection
index=sysmon EventCode=3 DestinationPort=3389 Image="*mstsc.exe"
| eval user=User, dest_ip=DestinationIp
| stats dc(dest_ip) as unique_destinations, values(dest_ip) as destinations by user
| where unique_destinations > 2
| sort - unique_destinations
```

## Threat Hunting Playbooks

### RDP Threat Hunting Methodology

```powershell
# RDP-ThreatHunt.ps1 - Comprehensive RDP threat hunting

class RDPThreatHunter {
    [string]$ComputerName
    [datetime]$StartTime
    [datetime]$EndTime
    [hashtable]$Results

    RDPThreatHunter([string]$computerName, [datetime]$startTime, [datetime]$endTime) {
        $this.ComputerName = $computerName
        $this.StartTime = $startTime
        $this.EndTime = $endTime
        $this.Results = @{
            Indicators = @()
            Timeline = @()
            IOCs = @()
            Recommendations = @()
        }
    }

    # Hunt for RDP configuration changes
    [void]HuntConfigurationChanges() {
        Write-Host "[*] Hunting for RDP configuration changes..." -ForegroundColor Yellow

        $configChanges = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 13
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "Terminal Server|fDenyTSConnections|PortNumber|UserAuthentication|SecurityLayer"
        }

        foreach ($change in $configChanges) {
            $xml = [xml]$change.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Configuration Change"
                Severity = "Medium"
                TimeCreated = $change.TimeCreated
                ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                TargetObject = ($eventData | Where-Object {$_.Name -eq 'TargetObject'}).'#text'
                Details = ($eventData | Where-Object {$_.Name -eq 'Details'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            # Assess severity
            if ($indicator.TargetObject -match "fDenyTSConnections" -and $indicator.Details -match "0x00000000") {
                $indicator.Severity = "High"
                $indicator.Description = "RDP was enabled on the system"
            } elseif ($indicator.TargetObject -match "PortNumber" -and $indicator.Details -notmatch "0x00000d3d") {
                $indicator.Severity = "High"
                $indicator.Description = "RDP port was changed from default"
            } elseif ($indicator.TargetObject -match "UserAuthentication" -and $indicator.Details -match "0x00000000") {
                $indicator.Severity = "High"
                $indicator.Description = "NLA was disabled"
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }
    }

    # Hunt for RDP persistence mechanisms
    [void]HuntPersistence() {
        Write-Host "[*] Hunting for RDP persistence mechanisms..." -ForegroundColor Yellow

        # Check for accessibility tool backdoors
        $accessibilityBackdoors = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 13
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "Image File Execution Options\\(sethc|utilman|magnify|osk)\.exe"
        }

        foreach ($backdoor in $accessibilityBackdoors) {
            $xml = [xml]$backdoor.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Persistence"
                Severity = "Critical"
                TimeCreated = $backdoor.TimeCreated
                Description = "Accessibility tool backdoor detected"
                TargetObject = ($eventData | Where-Object {$_.Name -eq 'TargetObject'}).'#text'
                Details = ($eventData | Where-Object {$_.Name -eq 'Details'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }

        # Check for file replacements
        $fileReplacements = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 11
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "\\System32\\(sethc|utilman|magnify|osk)\.exe"
        }

        foreach ($replacement in $fileReplacements) {
            $xml = [xml]$replacement.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Persistence"
                Severity = "Critical"
                TimeCreated = $replacement.TimeCreated
                Description = "Accessibility tool file replacement"
                TargetFilename = ($eventData | Where-Object {$_.Name -eq 'TargetFilename'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }
    }

    # Hunt for session hijacking
    [void]HuntSessionHijacking() {
        Write-Host "[*] Hunting for session hijacking attempts..." -ForegroundColor Yellow

        $sessionCommands = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 1
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "tscon\.exe|tsdiscon\.exe|rwinsta\.exe" -or
            $_.Message -match "tscon /dest:|tsdiscon /server:|rwinsta /server:"
        }

        foreach ($command in $sessionCommands) {
            $xml = [xml]$command.ToXml()
            $eventData = $xml.Event.EventData.Data

            $commandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
            $severity = "High"

            # Increase severity for specific patterns
            if ($commandLine -match "tscon.*console|tscon.*rdp") {
                $severity = "Critical"
            }

            $indicator = @{
                Type = "Session Hijacking"
                Severity = $severity
                TimeCreated = $command.TimeCreated
                Description = "Terminal Services session manipulation"
                CommandLine = $commandLine
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                ParentImage = ($eventData | Where-Object {$_.Name -eq 'ParentImage'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }
    }

    # Hunt for credential dumping
    [void]HuntCredentialDumping() {
        Write-Host "[*] Hunting for credential dumping from RDP sessions..." -ForegroundColor Yellow

        # Look for process access to LSASS from RDP sessions
        $lsassAccess = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 10
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "lsass\.exe" -and
            ($_.Message -match "0x1010|0x1410|0x143a" -or
             $_.Message -match "rdpclip\.exe|mstsc\.exe")
        }

        foreach ($access in $lsassAccess) {
            $xml = [xml]$access.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Credential Dumping"
                Severity = "Critical"
                TimeCreated = $access.TimeCreated
                Description = "Suspicious LSASS access from RDP session"
                SourceImage = ($eventData | Where-Object {$_.Name -eq 'SourceImage'}).'#text'
                TargetImage = ($eventData | Where-Object {$_.Name -eq 'TargetImage'}).'#text'
                GrantedAccess = ($eventData | Where-Object {$_.Name -eq 'GrantedAccess'}).'#text'
                CallTrace = ($eventData | Where-Object {$_.Name -eq 'CallTrace'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }

        # Look for common credential dumping tools
        $credDumpingTools = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 1
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "mimikatz|sekurlsa|procdump|comsvcs\.dll" -or
            $_.Message -match "lsadump|logonpasswords|wdigest"
        }

        foreach ($tool in $credDumpingTools) {
            $xml = [xml]$tool.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Credential Dumping"
                Severity = "Critical"
                TimeCreated = $tool.TimeCreated
                Description = "Credential dumping tool execution"
                CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }
    }

    # Hunt for RDP tunneling
    [void]HuntRDPTunneling() {
        Write-Host "[*] Hunting for RDP tunneling activities..." -ForegroundColor Yellow

        $tunnelingCommands = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 1
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            $_.Message -match "portfwd|netsh.*portproxy|ssh.*-L.*3389|plink.*-L.*3389" -or
            $_.Message -match "chisel|ngrok|frp|localtunnel"
        }

        foreach ($command in $tunnelingCommands) {
            $xml = [xml]$command.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "RDP Tunneling"
                Severity = "High"
                TimeCreated = $command.TimeCreated
                Description = "RDP tunneling or port forwarding"
                CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }

        # Look for suspicious network connections
        $suspiciousConnections = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 3
            StartTime = $this.StartTime
            EndTime = $this.EndTime
        } -ComputerName $this.ComputerName | Where-Object {
            ($_.Message -match "DestinationPort: 22|DestinationPort: 443|DestinationPort: 80" -and
             $_.Message -match "ssh\.exe|plink\.exe|chisel\.exe|ngrok\.exe") -or
            $_.Message -match "DestinationPort: 3389.*DestinationIp: 127\.0\.0\.1"
        }

        foreach ($connection in $suspiciousConnections) {
            $xml = [xml]$connection.ToXml()
            $eventData = $xml.Event.EventData.Data

            $indicator = @{
                Type = "Suspicious Network"
                Severity = "Medium"
                TimeCreated = $connection.TimeCreated
                Description = "Potential tunneling network connection"
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
                DestinationPort = ($eventData | Where-Object {$_.Name -eq 'DestinationPort'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
            }

            $this.Results.Indicators += $indicator
            $this.Results.Timeline += $indicator
        }
    }

    # Generate IOCs from findings
    [void]GenerateIOCs() {
        Write-Host "[*] Generating IOCs from hunt results..." -ForegroundColor Yellow

        foreach ($indicator in $this.Results.Indicators) {
            switch ($indicator.Type) {
                "Configuration Change" {
                    if ($indicator.TargetObject) {
                        $this.Results.IOCs += @{
                            Type = "Registry Key"
                            Value = $indicator.TargetObject
                            Context = $indicator.Description
                        }
                    }
                }
                "Persistence" {
                    if ($indicator.TargetFilename) {
                        $this.Results.IOCs += @{
                            Type = "File Path"
                            Value = $indicator.TargetFilename
                            Context = $indicator.Description
                        }
                    }
                }
                "Credential Dumping" {
                    if ($indicator.CommandLine) {
                        $this.Results.IOCs += @{
                            Type = "Command Line"
                            Value = $indicator.CommandLine
                            Context = $indicator.Description
                        }
                    }
                }
                "RDP Tunneling" {
                    if ($indicator.Image) {
                        $this.Results.IOCs += @{
                            Type = "Process"
                            Value = $indicator.Image
                            Context = $indicator.Description
                        }
                    }
                }
            }
        }

        # Deduplicate IOCs
        $this.Results.IOCs = $this.Results.IOCs | Sort-Object Type, Value -Unique
    }

    # Generate recommendations
    [void]GenerateRecommendations() {
        Write-Host "[*] Generating security recommendations..." -ForegroundColor Yellow

        $configChanges = $this.Results.Indicators | Where-Object {$_.Type -eq "Configuration Change"}
        $persistence = $this.Results.Indicators | Where-Object {$_.Type -eq "Persistence"}
        $hijacking = $this.Results.Indicators | Where-Object {$_.Type -eq "Session Hijacking"}

        if ($configChanges.Count -gt 0) {
            $this.Results.Recommendations += "Review and audit RDP configuration changes"
            $this.Results.Recommendations += "Implement change monitoring for Terminal Services settings"
            $this.Results.Recommendations += "Consider disabling RDP if not required"
        }

        if ($persistence.Count -gt 0) {
            $this.Results.Recommendations += "Immediately investigate accessibility tool modifications"
            $this.Results.Recommendations += "Implement file integrity monitoring for system utilities"
            $this.Results.Recommendations += "Review logon events for suspicious authentication patterns"
        }

        if ($hijacking.Count -gt 0) {
            $this.Results.Recommendations += "Investigate session management activities"
            $this.Results.Recommendations += "Review user privileges and session access"
            $this.Results.Recommendations += "Consider implementing session recording"
        }

        # General recommendations
        $this.Results.Recommendations += "Enable Network Level Authentication (NLA)"
        $this.Results.Recommendations += "Implement strong password policies"
        $this.Results.Recommendations += "Use MFA for RDP access"
        $this.Results.Recommendations += "Regularly rotate service accounts"
        $this.Results.Recommendations += "Monitor for lateral movement patterns"
    }

    # Execute comprehensive hunt
    [hashtable]ExecuteHunt() {
        Write-Host "=== RDP Threat Hunt Started ===" -ForegroundColor Green
        Write-Host "Computer: $($this.ComputerName)" -ForegroundColor Cyan
        Write-Host "Time Range: $($this.StartTime) to $($this.EndTime)" -ForegroundColor Cyan

        $this.HuntConfigurationChanges()
        $this.HuntPersistence()
        $this.HuntSessionHijacking()
        $this.HuntCredentialDumping()
        $this.HuntRDPTunneling()
        $this.GenerateIOCs()
        $this.GenerateRecommendations()

        # Sort timeline chronologically
        $this.Results.Timeline = $this.Results.Timeline | Sort-Object TimeCreated

        Write-Host "=== RDP Threat Hunt Completed ===" -ForegroundColor Green
        Write-Host "Total Indicators: $($this.Results.Indicators.Count)" -ForegroundColor Yellow
        Write-Host "Critical: $(($this.Results.Indicators | Where-Object {$_.Severity -eq 'Critical'}).Count)" -ForegroundColor Red
        Write-Host "High: $(($this.Results.Indicators | Where-Object {$_.Severity -eq 'High'}).Count)" -ForegroundColor Red
        Write-Host "Medium: $(($this.Results.Indicators | Where-Object {$_.Severity -eq 'Medium'}).Count)" -ForegroundColor Yellow

        return $this.Results
    }
}

# Usage example
$hunter = [RDPThreatHunter]::new($env:COMPUTERNAME, (Get-Date).AddDays(-7), (Get-Date))
$huntResults = $hunter.ExecuteHunt()

# Display critical findings
$criticalFindings = $huntResults.Indicators | Where-Object {$_.Severity -eq "Critical"}
if ($criticalFindings.Count -gt 0) {
    Write-Host "=== CRITICAL FINDINGS ===" -ForegroundColor Red
    $criticalFindings | Format-Table TimeCreated, Type, Description, User -AutoSize
}

# Display IOCs
if ($huntResults.IOCs.Count -gt 0) {
    Write-Host "=== GENERATED IOCs ===" -ForegroundColor Yellow
    $huntResults.IOCs | Format-Table Type, Value, Context -AutoSize
}

# Display recommendations
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
$huntResults.Recommendations | ForEach-Object { Write-Host "• $_" -ForegroundColor White }
```

## Incident Response Procedures

### RDP Incident Response Workflow

```powershell
# RDP-IncidentResponse.ps1 - Automated incident response for RDP attacks

class RDPIncidentHandler {
    [string]$IncidentId
    [string]$ComputerName
    [datetime]$IncidentStart
    [hashtable]$Evidence
    [array]$Actions

    RDPIncidentHandler([string]$incidentId, [string]$computerName, [datetime]$incidentStart) {
        $this.IncidentId = $incidentId
        $this.ComputerName = $computerName
        $this.IncidentStart = $incidentStart
        $this.Evidence = @{
            ProcessArtifacts = @()
            NetworkArtifacts = @()
            FileArtifacts = @()
            RegistryArtifacts = @()
            MemoryArtifacts = @()
        }
        $this.Actions = @()
    }

    # Initial triage and containment
    [void]InitialTriage() {
        Write-Host "[!] Initiating RDP incident triage for $($this.IncidentId)" -ForegroundColor Red

        # Check if RDP is currently enabled
        $rdpEnabled = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -ErrorAction SilentlyContinue
        if ($rdpEnabled -and $rdpEnabled.fDenyTSConnections -eq 0) {
            Write-Host "[!] RDP is currently ENABLED on the system" -ForegroundColor Red
            $this.Actions += @{
                Time = Get-Date
                Action = "RDP Status Check"
                Result = "RDP Enabled"
                Severity = "High"
            }
        }

        # Get current RDP sessions
        $activeSessions = quser 2>$null
        if ($activeSessions) {
            Write-Host "[!] Active RDP sessions detected:" -ForegroundColor Yellow
            $activeSessions | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
            $this.Actions += @{
                Time = Get-Date
                Action = "Active Session Check"
                Result = "Active RDP sessions found"
                Severity = "Medium"
            }
        }

        # Check for suspicious processes
        $suspiciousProcesses = Get-Process | Where-Object {
            $_.ProcessName -match "mstsc|rdpclip|tscon|tsdiscon|rwinsta"
        }

        foreach ($process in $suspiciousProcesses) {
            $this.Evidence.ProcessArtifacts += @{
                ProcessId = $process.Id
                ProcessName = $process.ProcessName
                StartTime = $process.StartTime
                Path = $process.Path
                CommandLine = (Get-WmiObject Win32_Process -Filter "ProcessId=$($process.Id)").CommandLine
            }
        }
    }

    # Collect forensic evidence
    [void]CollectEvidence() {
        Write-Host "[*] Collecting forensic evidence..." -ForegroundColor Yellow

        # Collect recent Sysmon events
        $sysmonEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            StartTime = $this.IncidentStart
        } -MaxEvents 10000 | Where-Object {
            $_.Message -match "rdp|mstsc|terminal|tscon|3389"
        }

        foreach ($event in $sysmonEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            switch ($event.Id) {
                1 {  # Process Creation
                    $this.Evidence.ProcessArtifacts += @{
                        EventId = $event.Id
                        TimeCreated = $event.TimeCreated
                        ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                        Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                        CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                        User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                        ParentImage = ($eventData | Where-Object {$_.Name -eq 'ParentImage'}).'#text'
                    }
                }
                3 {  # Network Connection
                    $this.Evidence.NetworkArtifacts += @{
                        EventId = $event.Id
                        TimeCreated = $event.TimeCreated
                        ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                        Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                        SourceIp = ($eventData | Where-Object {$_.Name -eq 'SourceIp'}).'#text'
                        DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
                        DestinationPort = ($eventData | Where-Object {$_.Name -eq 'DestinationPort'}).'#text'
                    }
                }
                11 { # File Create
                    $this.Evidence.FileArtifacts += @{
                        EventId = $event.Id
                        TimeCreated = $event.TimeCreated
                        ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                        Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                        TargetFilename = ($eventData | Where-Object {$_.Name -eq 'TargetFilename'}).'#text'
                    }
                }
                13 { # Registry Set
                    $this.Evidence.RegistryArtifacts += @{
                        EventId = $event.Id
                        TimeCreated = $event.TimeCreated
                        ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                        Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                        TargetObject = ($eventData | Where-Object {$_.Name -eq 'TargetObject'}).'#text'
                        Details = ($eventData | Where-Object {$_.Name -eq 'Details'}).'#text'
                    }
                }
            }
        }

        Write-Host "[*] Evidence collection completed:" -ForegroundColor Green
        Write-Host "    Process Artifacts: $($this.Evidence.ProcessArtifacts.Count)" -ForegroundColor Cyan
        Write-Host "    Network Artifacts: $($this.Evidence.NetworkArtifacts.Count)" -ForegroundColor Cyan
        Write-Host "    File Artifacts: $($this.Evidence.FileArtifacts.Count)" -ForegroundColor Cyan
        Write-Host "    Registry Artifacts: $($this.Evidence.RegistryArtifacts.Count)" -ForegroundColor Cyan
    }

    # Immediate containment actions
    [void]ContainmentActions() {
        Write-Host "[!] Executing containment actions..." -ForegroundColor Red

        # Option to disable RDP (commented out for safety)
        # Uncomment only if immediate containment is required
        <#
        $confirm = Read-Host "Disable RDP immediately? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -Value 1
            Write-Host "[!] RDP has been DISABLED" -ForegroundColor Red
            $this.Actions += @{
                Time = Get-Date
                Action = "RDP Containment"
                Result = "RDP Disabled"
                Severity = "High"
            }
        }
        #>

        # Block suspicious network connections
        $suspiciousIPs = $this.Evidence.NetworkArtifacts | Where-Object {
            $_.DestinationPort -eq "3389" -and $_.SourceIp -notmatch "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)"
        } | Select-Object -ExpandProperty SourceIp -Unique

        foreach ($ip in $suspiciousIPs) {
            Write-Host "[!] Blocking suspicious IP: $ip" -ForegroundColor Yellow
            # netsh advfirewall firewall add rule name="Block_$ip" dir=in action=block remoteip=$ip
            $this.Actions += @{
                Time = Get-Date
                Action = "IP Block"
                Result = "Blocked $ip"
                Severity = "Medium"
            }
        }

        # Terminate suspicious processes
        $suspiciousProcesses = $this.Evidence.ProcessArtifacts | Where-Object {
            $_.Image -match "temp|appdata" -and $_.Image -match "\.exe$"
        }

        foreach ($process in $suspiciousProcesses) {
            Write-Host "[!] Terminating suspicious process: $($process.Image) (PID: $($process.ProcessId))" -ForegroundColor Yellow
            # Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
            $this.Actions += @{
                Time = Get-Date
                Action = "Process Termination"
                Result = "Terminated PID $($process.ProcessId)"
                Severity = "High"
            }
        }
    }

    # Generate incident report
    [hashtable]GenerateReport() {
        Write-Host "[*] Generating incident report..." -ForegroundColor Yellow

        $report = @{
            IncidentId = $this.IncidentId
            ComputerName = $this.ComputerName
            IncidentStart = $this.IncidentStart
            ReportGenerated = Get-Date
            Summary = @{
                TotalArtifacts = ($this.Evidence.ProcessArtifacts.Count + $this.Evidence.NetworkArtifacts.Count + $this.Evidence.FileArtifacts.Count + $this.Evidence.RegistryArtifacts.Count)
                ActionsExecuted = $this.Actions.Count
                CriticalActions = ($this.Actions | Where-Object {$_.Severity -eq "High"}).Count
            }
            Evidence = $this.Evidence
            Actions = $this.Actions
            Recommendations = @(
                "Change all user passwords immediately"
                "Review and audit user accounts with RDP access"
                "Implement MFA for remote access"
                "Review firewall rules for RDP access"
                "Conduct forensic imaging of affected systems"
                "Monitor for lateral movement to other systems"
                "Update incident response procedures based on lessons learned"
            )
        }

        # Save report to file
        $reportPath = "C:\Temp\RDP_Incident_$($this.IncidentId)_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
        $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8

        Write-Host "[*] Incident report saved to: $reportPath" -ForegroundColor Green

        return $report
    }

    # Execute full incident response
    [hashtable]ExecuteResponse() {
        Write-Host "=== RDP INCIDENT RESPONSE INITIATED ===" -ForegroundColor Red
        Write-Host "Incident ID: $($this.IncidentId)" -ForegroundColor Yellow
        Write-Host "Computer: $($this.ComputerName)" -ForegroundColor Yellow
        Write-Host "Start Time: $($this.IncidentStart)" -ForegroundColor Yellow

        $this.InitialTriage()
        $this.CollectEvidence()
        $this.ContainmentActions()
        $report = $this.GenerateReport()

        Write-Host "=== RDP INCIDENT RESPONSE COMPLETED ===" -ForegroundColor Green

        return $report
    }
}

# Usage example
# $incidentHandler = [RDPIncidentHandler]::new("INC-RDP-$(Get-Date -Format 'yyyyMMdd-HHmmss')", $env:COMPUTERNAME, (Get-Date).AddHours(-2))
# $incidentReport = $incidentHandler.ExecuteResponse()
```

## Advanced Analytics and Correlation

### Machine Learning Detection

```python
#!/usr/bin/env python3
# rdp_ml_detection.py - Machine learning-based RDP anomaly detection

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import json
import logging
from datetime import datetime, timedelta

class RDPAnomalyDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.features = [
            'connection_count',
            'unique_destinations',
            'connection_duration_avg',
            'bytes_transferred',
            'failed_attempts',
            'time_of_day',
            'day_of_week',
            'connection_frequency'
        ]

    def extract_features(self, events):
        """Extract features from RDP events for ML analysis"""
        features = []

        # Group events by user and time window
        for user in events['user'].unique():
            user_events = events[events['user'] == user]

            # Extract time-based features
            user_events['timestamp'] = pd.to_datetime(user_events['timestamp'])
            user_events['hour'] = user_events['timestamp'].dt.hour
            user_events['day_of_week'] = user_events['timestamp'].dt.dayofweek

            # Calculate features for each time window (e.g., hourly)
            for window_start in pd.date_range(start=user_events['timestamp'].min(),
                                            end=user_events['timestamp'].max(),
                                            freq='H'):
                window_end = window_start + timedelta(hours=1)
                window_events = user_events[
                    (user_events['timestamp'] >= window_start) &
                    (user_events['timestamp'] < window_end)
                ]

                if len(window_events) == 0:
                    continue

                feature_vector = {
                    'user': user,
                    'timestamp': window_start,
                    'connection_count': len(window_events),
                    'unique_destinations': window_events['destination_ip'].nunique(),
                    'connection_duration_avg': window_events['duration'].mean() if 'duration' in window_events else 0,
                    'bytes_transferred': window_events['bytes_transferred'].sum() if 'bytes_transferred' in window_events else 0,
                    'failed_attempts': len(window_events[window_events['status'] == 'failed']),
                    'time_of_day': window_start.hour,
                    'day_of_week': window_start.weekday(),
                    'connection_frequency': len(window_events) / 3600  # connections per second
                }

                features.append(feature_vector)

        return pd.DataFrame(features)

    def train_model(self, training_data):
        """Train the anomaly detection model"""
        feature_matrix = training_data[self.features]
        feature_matrix_scaled = self.scaler.fit_transform(feature_matrix)

        self.model.fit(feature_matrix_scaled)

        # Calculate baseline metrics
        scores = self.model.decision_function(feature_matrix_scaled)
        anomaly_threshold = np.percentile(scores, 10)  # Bottom 10% as anomalies

        return {
            'training_samples': len(training_data),
            'anomaly_threshold': anomaly_threshold,
            'model_trained': True
        }

    def detect_anomalies(self, events):
        """Detect anomalies in RDP events"""
        features = self.extract_features(events)

        if len(features) == 0:
            return []

        feature_matrix = features[self.features]
        feature_matrix_scaled = self.scaler.transform(feature_matrix)

        # Predict anomalies
        anomaly_scores = self.model.decision_function(feature_matrix_scaled)
        anomaly_predictions = self.model.predict(feature_matrix_scaled)

        # Combine results
        results = features.copy()
        results['anomaly_score'] = anomaly_scores
        results['is_anomaly'] = anomaly_predictions == -1

        # Return only anomalies
        anomalies = results[results['is_anomaly']].to_dict('records')

        return anomalies

    def analyze_rdp_patterns(self, events):
        """Analyze RDP usage patterns for baseline establishment"""
        analysis = {
            'temporal_patterns': {},
            'user_behavior': {},
            'network_patterns': {},
            'risk_indicators': []
        }

        # Temporal analysis
        events['timestamp'] = pd.to_datetime(events['timestamp'])
        events['hour'] = events['timestamp'].dt.hour
        events['day_of_week'] = events['timestamp'].dt.dayofweek

        hourly_activity = events['hour'].value_counts().sort_index()
        daily_activity = events['day_of_week'].value_counts().sort_index()

        analysis['temporal_patterns'] = {
            'peak_hours': hourly_activity.idxmax(),
            'low_activity_hours': hourly_activity.idxmin(),
            'weekend_activity': daily_activity[5:].sum(),  # Sat-Sun
            'weekday_activity': daily_activity[:5].sum()   # Mon-Fri
        }

        # User behavior analysis
        user_stats = events.groupby('user').agg({
            'destination_ip': 'nunique',
            'timestamp': ['count', lambda x: (x.max() - x.min()).total_seconds() / 3600]
        }).round(2)

        analysis['user_behavior'] = user_stats.to_dict('index')

        # Network pattern analysis
        network_stats = events.groupby('destination_ip').agg({
            'user': 'nunique',
            'timestamp': 'count'
        })

        analysis['network_patterns'] = {
            'most_accessed_hosts': network_stats.sort_values('timestamp', ascending=False).head().to_dict('index'),
            'hosts_with_multiple_users': network_stats[network_stats['user'] > 1].to_dict('index')
        }

        # Risk indicators
        if len(events[events['timestamp'].dt.hour.isin([0, 1, 2, 3, 4, 5])]) > 0:
            analysis['risk_indicators'].append('Off-hours activity detected')

        if events['user'].nunique() > 10:
            analysis['risk_indicators'].append('High number of unique users')

        failed_rate = len(events[events['status'] == 'failed']) / len(events)
        if failed_rate > 0.1:
            analysis['risk_indicators'].append(f'High failure rate: {failed_rate:.2%}')

        return analysis

# Example usage
def main():
    # Sample data structure - replace with actual Sysmon data parsing
    sample_events = pd.DataFrame([
        {'user': 'user1', 'destination_ip': '192.168.1.100', 'timestamp': '2025-01-10 09:00:00', 'status': 'success', 'duration': 3600, 'bytes_transferred': 1024000},
        {'user': 'user1', 'destination_ip': '192.168.1.101', 'timestamp': '2025-01-10 14:00:00', 'status': 'success', 'duration': 1800, 'bytes_transferred': 512000},
        {'user': 'user2', 'destination_ip': '192.168.1.100', 'timestamp': '2025-01-10 02:00:00', 'status': 'failed', 'duration': 0, 'bytes_transferred': 0},
        # Add more sample data...
    ])

    detector = RDPAnomalyDetector()

    # Analyze patterns
    patterns = detector.analyze_rdp_patterns(sample_events)
    print("RDP Usage Patterns:")
    print(json.dumps(patterns, indent=2, default=str))

    # Train model (in practice, use historical data)
    features = detector.extract_features(sample_events)
    if len(features) > 0:
        training_result = detector.train_model(features)
        print(f"\nModel Training: {training_result}")

        # Detect anomalies
        anomalies = detector.detect_anomalies(sample_events)
        if anomalies:
            print(f"\nDetected {len(anomalies)} anomalies:")
            for anomaly in anomalies:
                print(f"- User: {anomaly['user']}, Time: {anomaly['timestamp']}, Score: {anomaly['anomaly_score']:.3f}")
        else:
            print("\nNo anomalies detected")

if __name__ == "__main__":
    main()
```

## Best Practices and Recommendations

### Sysmon Configuration Best Practices

1. **Event Selection**

   - Focus on high-value events (1, 3, 7, 10, 11, 13)
   - Use targeted filtering to reduce noise
   - Regular review and tuning of rules

2. **Performance Optimization**

   - Monitor Sysmon overhead
   - Use exclude rules for known-good processes
   - Implement log rotation and archival

3. **Detection Engineering**

   - Develop use-case specific rules
   - Test detection rules thoroughly
   - Implement alerting thresholds

4. **Incident Response Integration**
   - Automate evidence collection
   - Create standardized playbooks
   - Practice incident scenarios

### Terminal Services Security Hardening

1. **Configuration Security**

   - Enable Network Level Authentication
   - Use strong encryption levels
   - Implement session timeouts
   - Disable unused features (clipboard, drive redirection)

2. **Access Controls**

   - Implement least privilege principles
   - Use certificate-based authentication
   - Regular access reviews
   - Monitor privileged accounts

3. **Network Security**

   - Change default RDP port
   - Implement network segmentation
   - Use VPN for external access
   - Monitor network traffic

4. **Monitoring and Alerting**
   - Real-time session monitoring
   - Failed logon alerting
   - Configuration change detection
   - Behavioral analytics

## Conclusion

This comprehensive guide provides the foundation for implementing advanced Terminal Services monitoring using Sysmon. The configuration and detection rules enable organizations to:

- **Detect Advanced Threats**: Identify sophisticated RDP-based attacks
- **Monitor Configuration Changes**: Track modifications to Terminal Services settings
- **Hunt for Persistence**: Discover backdoors and persistence mechanisms
- **Respond to Incidents**: Execute structured incident response procedures
- **Analyze Patterns**: Use machine learning for anomaly detection

Key benefits of this approach:

- **Comprehensive Coverage**: All aspects of RDP security monitoring
- **Actionable Intelligence**: Detection rules that minimize false positives
- **Scalable Detection**: Suitable for enterprise environments
- **Incident Ready**: Integrated response and analysis capabilities

By implementing these monitoring strategies, security teams can significantly improve their ability to detect, analyze, and respond to Terminal Services-based threats while maintaining operational visibility and security posture.

---

_Remember to test all configurations in a lab environment before deploying to production systems and regularly update detection rules based on emerging threats._
