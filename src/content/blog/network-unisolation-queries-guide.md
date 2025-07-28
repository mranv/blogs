---
title: "Network Unisolation Queries: Advanced Incident Response and Forensic Analysis"
slug: "network-unisolation-queries-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-11T04:00:00Z
featured: false
draft: false
tags:
  - network-security
  - incident-response
  - forensics
  - unisolation
  - threat-hunting
  - windows-security
  - malware-analysis
description: "Comprehensive guide to network unisolation queries for incident response, covering advanced forensic techniques, threat hunting methodologies, and malware analysis procedures."
---

# Network Unisolation Queries: Advanced Incident Response Guide

This comprehensive guide provides detailed queries and techniques for conducting network unisolation analysis during incident response activities. Learn advanced forensic methodologies, threat hunting procedures, and malware analysis techniques for effective security investigations.

## Table of Contents

## Understanding Network Unisolation

### What is Network Unisolation?

Network unisolation refers to the process of restoring network connectivity that was previously isolated or restricted due to security incidents. During incident response, systems are often isolated to contain threats, and unisolation queries help analysts understand:

- **Isolation Timeline**: When and why systems were isolated
- **Network Dependencies**: What services and connections were affected
- **Communication Patterns**: Normal vs. anomalous network behavior
- **Threat Indicators**: Evidence of malicious network activity
- **Recovery Requirements**: What needs to be restored for normal operations

### Common Isolation Scenarios

1. **Malware Infections**: Systems isolated to prevent lateral movement
2. **Data Breaches**: Network segments isolated to stop exfiltration
3. **Ransomware Attacks**: Critical systems isolated to prevent encryption spread
4. **APT Incidents**: Compromised hosts isolated during investigation
5. **Policy Violations**: Systems isolated for compliance investigations

## Windows Network Forensics Queries

### Registry-Based Network Configuration Analysis

```powershell
# Network-Configuration-Analysis.ps1 - Registry-based network forensics

# Function to analyze network adapter configurations
function Get-NetworkAdapterForensics {
    param(
        [string]$ComputerName = $env:COMPUTERNAME,
        [datetime]$StartTime = (Get-Date).AddDays(-30),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Network Adapter Forensic Analysis ===" -ForegroundColor Yellow
    Write-Host "Computer: $ComputerName" -ForegroundColor Cyan
    Write-Host "Time Range: $StartTime to $EndTime" -ForegroundColor Cyan

    # Get network adapter registry information
    $networkAdapters = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e972-e325-11ce-bfc1-08002be10318}\*" -ErrorAction SilentlyContinue |
        Where-Object { $_.DriverDesc -ne $null }

    $results = @()

    foreach ($adapter in $networkAdapters) {
        $adapterInfo = @{
            DriverDescription = $adapter.DriverDesc
            DriverVersion = $adapter.DriverVersion
            DriverDate = $adapter.DriverDate
            ProviderName = $adapter.ProviderName
            RegistryPath = $adapter.PSPath
            NetCfgInstanceId = $adapter.NetCfgInstanceId
            ComponentId = $adapter.ComponentId
            LastModified = (Get-Item $adapter.PSPath.Replace('Microsoft.PowerShell.Core\Registry::', '')).LastWriteTime
        }

        # Check for suspicious network adapters
        $suspiciousIndicators = @()

        if ($adapter.DriverDesc -match "TAP|VPN|Virtual|Tunnel") {
            $suspiciousIndicators += "Virtual/VPN adapter detected"
        }

        if ($adapter.ProviderName -match "Unknown|Unsigned") {
            $suspiciousIndicators += "Unsigned or unknown provider"
        }

        if ($suspiciousIndicators.Count -gt 0) {
            $adapterInfo.SuspiciousIndicators = $suspiciousIndicators
        }

        $results += New-Object PSObject -Property $adapterInfo
    }

    return $results
}

# Function to analyze network isolation events
function Get-NetworkIsolationEvents {
    param(
        [string]$ComputerName = $env:COMPUTERNAME,
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Network Isolation Event Analysis ===" -ForegroundColor Yellow

    # Security event IDs related to network isolation
    $isolationEventIDs = @(
        4624,  # Successful logon
        4625,  # Failed logon
        4648,  # Logon using explicit credentials
        4776,  # Domain controller attempted to validate credentials
        5156,  # Windows Filtering Platform allowed connection
        5157,  # Windows Filtering Platform blocked connection
        5447,  # Windows Filtering Platform filter change
        5448,  # Windows Filtering Platform provider change
        5152,  # Windows Filtering Platform blocked packet
        5154   # Windows Filtering Platform permitted application to listen
    )

    $events = @()

    foreach ($eventID in $isolationEventIDs) {
        try {
            $eventLogs = Get-WinEvent -FilterHashtable @{
                LogName = 'Security'
                ID = $eventID
                StartTime = $StartTime
                EndTime = $EndTime
            } -ComputerName $ComputerName -ErrorAction SilentlyContinue

            foreach ($event in $eventLogs) {
                $eventData = @{
                    TimeCreated = $event.TimeCreated
                    EventID = $event.Id
                    LevelDisplayName = $event.LevelDisplayName
                    Message = $event.Message
                    Computer = $event.MachineName
                    UserID = $event.UserId
                    ProcessID = $event.ProcessId
                    ThreadID = $event.ThreadId
                }

                # Parse specific event details
                switch ($event.Id) {
                    5156 {
                        # Parse WFP allowed connection
                        if ($event.Message -match "Source Address:\s+([^\r\n]+)") {
                            $eventData.SourceAddress = $matches[1].Trim()
                        }
                        if ($event.Message -match "Destination Address:\s+([^\r\n]+)") {
                            $eventData.DestinationAddress = $matches[1].Trim()
                        }
                        if ($event.Message -match "Source Port:\s+([^\r\n]+)") {
                            $eventData.SourcePort = $matches[1].Trim()
                        }
                        if ($event.Message -match "Destination Port:\s+([^\r\n]+)") {
                            $eventData.DestinationPort = $matches[1].Trim()
                        }
                    }
                    5157 {
                        # Parse WFP blocked connection
                        if ($event.Message -match "Source Address:\s+([^\r\n]+)") {
                            $eventData.SourceAddress = $matches[1].Trim()
                        }
                        if ($event.Message -match "Destination Address:\s+([^\r\n]+)") {
                            $eventData.DestinationAddress = $matches[1].Trim()
                        }
                        if ($event.Message -match "Source Port:\s+([^\r\n]+)") {
                            $eventData.SourcePort = $matches[1].Trim()
                        }
                        if ($event.Message -match "Destination Port:\s+([^\r\n]+)") {
                            $eventData.DestinationPort = $matches[1].Trim()
                        }
                    }
                }

                $events += New-Object PSObject -Property $eventData
            }
        }
        catch {
            Write-Warning "Could not retrieve events for ID $eventID`: $($_.Exception.Message)"
        }
    }

    return $events | Sort-Object TimeCreated
}

# Function to analyze firewall rule changes
function Get-FirewallRuleChanges {
    param(
        [string]$ComputerName = $env:COMPUTERNAME,
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Firewall Rule Change Analysis ===" -ForegroundColor Yellow

    # Get firewall rule change events
    $firewallEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = @(5447, 5448, 5449)  # WFP filter/provider changes
        StartTime = $StartTime
        EndTime = $EndTime
    } -ComputerName $ComputerName -ErrorAction SilentlyContinue

    $ruleChanges = @()

    foreach ($event in $firewallEvents) {
        $ruleChange = @{
            TimeCreated = $event.TimeCreated
            EventID = $event.Id
            Computer = $event.MachineName
            UserSID = $event.UserId
            ProcessID = $event.ProcessId
            Message = $event.Message
        }

        # Extract rule details
        if ($event.Message -match "Filter Name:\s+([^\r\n]+)") {
            $ruleChange.FilterName = $matches[1].Trim()
        }
        if ($event.Message -match "Provider Name:\s+([^\r\n]+)") {
            $ruleChange.ProviderName = $matches[1].Trim()
        }
        if ($event.Message -match "Change Type:\s+([^\r\n]+)") {
            $ruleChange.ChangeType = $matches[1].Trim()
        }

        $ruleChanges += New-Object PSObject -Property $ruleChange
    }

    return $ruleChanges
}

# Function to get current firewall status and rules
function Get-FirewallConfiguration {
    Write-Host "=== Current Firewall Configuration ===" -ForegroundColor Yellow

    # Get firewall profiles
    $profiles = @()
    foreach ($profile in @('Domain', 'Private', 'Public')) {
        $profileInfo = netsh advfirewall show $profile.ToLower() state
        $enabled = if ($profileInfo -match "State\s+ON") { $true } else { $false }

        $profiles += @{
            Profile = $profile
            Enabled = $enabled
            Details = $profileInfo
        }
    }

    # Get active firewall rules
    $firewallRules = Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' } | ForEach-Object {
        $rule = $_
        $addressFilter = $rule | Get-NetFirewallAddressFilter
        $portFilter = $rule | Get-NetFirewallPortFilter
        $applicationFilter = $rule | Get-NetFirewallApplicationFilter

        @{
            DisplayName = $rule.DisplayName
            Direction = $rule.Direction
            Action = $rule.Action
            Enabled = $rule.Enabled
            Profile = $rule.Profile
            LocalAddress = $addressFilter.LocalAddress
            RemoteAddress = $addressFilter.RemoteAddress
            Protocol = $portFilter.Protocol
            LocalPort = $portFilter.LocalPort
            RemotePort = $portFilter.RemotePort
            Program = $applicationFilter.Program
            CreationDate = $rule.CreationDate
        }
    }

    return @{
        Profiles = $profiles
        Rules = $firewallRules
    }
}

# Main execution example
$adapterAnalysis = Get-NetworkAdapterForensics
$isolationEvents = Get-NetworkIsolationEvents
$firewallChanges = Get-FirewallRuleChanges
$firewallConfig = Get-FirewallConfiguration

# Display suspicious adapters
$suspiciousAdapters = $adapterAnalysis | Where-Object { $_.SuspiciousIndicators -ne $null }
if ($suspiciousAdapters) {
    Write-Host "=== SUSPICIOUS NETWORK ADAPTERS DETECTED ===" -ForegroundColor Red
    $suspiciousAdapters | Format-Table DriverDescription, ProviderName, SuspiciousIndicators -AutoSize
}

# Display recent isolation events
Write-Host "=== RECENT NETWORK ISOLATION EVENTS ===" -ForegroundColor Yellow
$isolationEvents | Select-Object TimeCreated, EventID, SourceAddress, DestinationAddress, DestinationPort |
    Sort-Object TimeCreated -Descending | Select-Object -First 20 | Format-Table -AutoSize

# Display firewall rule changes
if ($firewallChanges) {
    Write-Host "=== FIREWALL RULE CHANGES ===" -ForegroundColor Yellow
    $firewallChanges | Select-Object TimeCreated, ChangeType, FilterName, ProviderName |
        Sort-Object TimeCreated -Descending | Format-Table -AutoSize
}
```

### Network Connection Analysis

```powershell
# Network-Connection-Analysis.ps1 - Comprehensive network connection forensics

# Function to analyze active network connections
function Get-NetworkConnectionForensics {
    param(
        [string]$ProcessName = "*",
        [string]$RemoteAddress = "*",
        [int]$Port = 0
    )

    Write-Host "=== Active Network Connection Analysis ===" -ForegroundColor Yellow

    # Get active connections with process information
    $connections = Get-NetTCPConnection | ForEach-Object {
        $conn = $_
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue

        $connectionInfo = @{
            LocalAddress = $conn.LocalAddress
            LocalPort = $conn.LocalPort
            RemoteAddress = $conn.RemoteAddress
            RemotePort = $conn.RemotePort
            State = $conn.State
            ProcessId = $conn.OwningProcess
            ProcessName = if ($process) { $process.ProcessName } else { "Unknown" }
            ProcessPath = if ($process) { $process.Path } else { "Unknown" }
            ProcessStartTime = if ($process) { $process.StartTime } else { $null }
            CreationTime = $conn.CreationTime
        }

        # Add risk assessment
        $riskFactors = @()

        # Check for suspicious remote addresses
        if ($conn.RemoteAddress -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
            # Internal network - lower risk
        } elseif ($conn.RemoteAddress -notmatch "^(127\.|::1|0\.0\.0\.0)") {
            $riskFactors += "External connection"
        }

        # Check for suspicious ports
        $suspiciousPorts = @(4444, 5555, 6666, 8080, 9999, 31337, 12345)
        if ($conn.RemotePort -in $suspiciousPorts -or $conn.LocalPort -in $suspiciousPorts) {
            $riskFactors += "Suspicious port"
        }

        # Check for suspicious processes
        $suspiciousProcesses = @("cmd.exe", "powershell.exe", "rundll32.exe", "regsvr32.exe")
        if ($process -and $process.ProcessName -in $suspiciousProcesses) {
            $riskFactors += "Suspicious process"
        }

        if ($riskFactors.Count -gt 0) {
            $connectionInfo.RiskFactors = $riskFactors
            $connectionInfo.RiskLevel = if ($riskFactors.Count -gt 2) { "High" } elseif ($riskFactors.Count -gt 1) { "Medium" } else { "Low" }
        }

        New-Object PSObject -Property $connectionInfo
    }

    # Filter results
    $filteredConnections = $connections

    if ($ProcessName -ne "*") {
        $filteredConnections = $filteredConnections | Where-Object { $_.ProcessName -like "*$ProcessName*" }
    }

    if ($RemoteAddress -ne "*") {
        $filteredConnections = $filteredConnections | Where-Object { $_.RemoteAddress -like "*$RemoteAddress*" }
    }

    if ($Port -gt 0) {
        $filteredConnections = $filteredConnections | Where-Object { $_.LocalPort -eq $Port -or $_.RemotePort -eq $Port }
    }

    return $filteredConnections
}

# Function to analyze historical network connections
function Get-HistoricalNetworkConnections {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-1),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Historical Network Connection Analysis ===" -ForegroundColor Yellow

    # Parse network-related events from event logs
    $networkEvents = @()

    # Get Sysmon network connection events (Event ID 3)
    try {
        $sysmonEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 3
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $sysmonEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $networkEvent = @{
                TimeCreated = $event.TimeCreated
                EventID = $event.Id
                ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                Protocol = ($eventData | Where-Object {$_.Name -eq 'Protocol'}).'#text'
                SourceIp = ($eventData | Where-Object {$_.Name -eq 'SourceIp'}).'#text'
                SourcePort = ($eventData | Where-Object {$_.Name -eq 'SourcePort'}).'#text'
                DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
                DestinationPort = ($eventData | Where-Object {$_.Name -eq 'DestinationPort'}).'#text'
                Initiated = ($eventData | Where-Object {$_.Name -eq 'Initiated'}).'#text'
            }

            $networkEvents += New-Object PSObject -Property $networkEvent
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon events: $($_.Exception.Message)"
    }

    # Get Windows Filtering Platform events
    try {
        $wfpEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Security'
            ID = @(5156, 5157)  # WFP allowed/blocked connections
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $wfpEvents) {
            $wfpEvent = @{
                TimeCreated = $event.TimeCreated
                EventID = $event.Id
                Action = if ($event.Id -eq 5156) { "Allowed" } else { "Blocked" }
                Computer = $event.MachineName
                ProcessID = $event.ProcessId
                Message = $event.Message
            }

            # Parse message for network details
            if ($event.Message -match "Source Address:\s+([^\r\n]+)") {
                $wfpEvent.SourceAddress = $matches[1].Trim()
            }
            if ($event.Message -match "Destination Address:\s+([^\r\n]+)") {
                $wfpEvent.DestinationAddress = $matches[1].Trim()
            }
            if ($event.Message -match "Source Port:\s+([^\r\n]+)") {
                $wfpEvent.SourcePort = $matches[1].Trim()
            }
            if ($event.Message -match "Destination Port:\s+([^\r\n]+)") {
                $wfpEvent.DestinationPort = $matches[1].Trim()
            }
            if ($event.Message -match "Protocol:\s+([^\r\n]+)") {
                $wfpEvent.Protocol = $matches[1].Trim()
            }

            $networkEvents += New-Object PSObject -Property $wfpEvent
        }
    }
    catch {
        Write-Warning "Could not retrieve WFP events: $($_.Exception.Message)"
    }

    return $networkEvents | Sort-Object TimeCreated
}

# Function to analyze DNS queries
function Get-DNSQueryAnalysis {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-1),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== DNS Query Analysis ===" -ForegroundColor Yellow

    $dnsQueries = @()

    # Get Sysmon DNS query events (Event ID 22)
    try {
        $sysmonDNSEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 22
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $sysmonDNSEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $dnsQuery = @{
                TimeCreated = $event.TimeCreated
                ProcessId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                QueryName = ($eventData | Where-Object {$_.Name -eq 'QueryName'}).'#text'
                QueryStatus = ($eventData | Where-Object {$_.Name -eq 'QueryStatus'}).'#text'
                QueryResults = ($eventData | Where-Object {$_.Name -eq 'QueryResults'}).'#text'
            }

            # Analyze for suspicious domains
            $suspiciousDomains = @(
                "bit.ly", "tinyurl.com", "pastebin.com", "hastebin.com",
                "githubusercontent.com", "raw.githubusercontent.com",
                "ngrok.io", "duckdns.org", "no-ip.com"
            )

            $riskFactors = @()
            foreach ($domain in $suspiciousDomains) {
                if ($dnsQuery.QueryName -like "*$domain*") {
                    $riskFactors += "Suspicious domain: $domain"
                }
            }

            # Check for DGA-like domains
            if ($dnsQuery.QueryName -match "^[a-z]{10,}\.(com|net|org)$") {
                $riskFactors += "Possible DGA domain"
            }

            # Check for recently registered domains (would need external API)
            # This is a placeholder for demonstration
            if ($dnsQuery.QueryName -match "\.(tk|ml|ga|cf)$") {
                $riskFactors += "Free TLD (potentially suspicious)"
            }

            if ($riskFactors.Count -gt 0) {
                $dnsQuery.RiskFactors = $riskFactors
            }

            $dnsQueries += New-Object PSObject -Property $dnsQuery
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon DNS events: $($_.Exception.Message)"
    }

    # Get DNS Client events
    try {
        $dnsClientEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-DNS-Client/Operational'
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        # Process DNS client events for additional context
        foreach ($event in $dnsClientEvents) {
            if ($event.Message -match "DNS query") {
                # Parse DNS client events for additional intelligence
                # Implementation depends on specific event structure
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve DNS Client events: $($_.Exception.Message)"
    }

    return $dnsQueries | Sort-Object TimeCreated
}

# Usage examples
Write-Host "Starting Network Connection Forensic Analysis..." -ForegroundColor Green

# Analyze current connections
$currentConnections = Get-NetworkConnectionForensics
$riskyConnections = $currentConnections | Where-Object { $_.RiskLevel -ne $null }

if ($riskyConnections) {
    Write-Host "=== HIGH-RISK CONNECTIONS DETECTED ===" -ForegroundColor Red
    $riskyConnections | Format-Table ProcessName, RemoteAddress, RemotePort, RiskLevel, RiskFactors -AutoSize
}

# Analyze historical connections
$historicalConnections = Get-HistoricalNetworkConnections -StartTime (Get-Date).AddHours(-24)
$externalConnections = $historicalConnections | Where-Object {
    $_.DestinationIp -and $_.DestinationIp -notmatch "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|::1)"
}

Write-Host "=== EXTERNAL CONNECTIONS (Last 24 Hours) ===" -ForegroundColor Yellow
$externalConnections | Select-Object TimeCreated, Image, DestinationIp, DestinationPort |
    Sort-Object TimeCreated -Descending | Select-Object -First 20 | Format-Table -AutoSize

# Analyze DNS queries
$dnsAnalysis = Get-DNSQueryAnalysis -StartTime (Get-Date).AddHours(-24)
$suspiciousDNS = $dnsAnalysis | Where-Object { $_.RiskFactors -ne $null }

if ($suspiciousDNS) {
    Write-Host "=== SUSPICIOUS DNS QUERIES ===" -ForegroundColor Red
    $suspiciousDNS | Select-Object TimeCreated, Image, QueryName, RiskFactors | Format-Table -AutoSize
}
```

## Advanced Threat Hunting Queries

### Lateral Movement Detection

```powershell
# Lateral-Movement-Detection.ps1 - Advanced lateral movement analysis

# Function to detect lateral movement patterns
function Detect-LateralMovement {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date),
        [string[]]$TargetComputers = @()
    )

    Write-Host "=== Lateral Movement Detection Analysis ===" -ForegroundColor Yellow

    $lateralMovementIndicators = @()

    # 1. Detect Pass-the-Hash attacks
    Write-Host "Analyzing Pass-the-Hash indicators..." -ForegroundColor Cyan

    $pthEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = 4624  # Successful logon
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        $xml = [xml]$event.ToXml()
        $eventData = $xml.Event.EventData.Data

        $logonType = ($eventData | Where-Object {$_.Name -eq 'LogonType'}).'#text'
        $authPackage = ($eventData | Where-Object {$_.Name -eq 'AuthenticationPackageName'}).'#text'
        $logonProcess = ($eventData | Where-Object {$_.Name -eq 'LogonProcessName'}).'#text'
        $workstationName = ($eventData | Where-Object {$_.Name -eq 'WorkstationName'}).'#text'
        $sourceIP = ($eventData | Where-Object {$_.Name -eq 'IpAddress'}).'#text'
        $targetUser = ($eventData | Where-Object {$_.Name -eq 'TargetUserName'}).'#text'

        # PTH indicators: Type 3 logon with NTLM auth and no password (LM hash blank)
        if ($logonType -eq '3' -and $authPackage -eq 'NTLM' -and $logonProcess -eq 'NtLmSsp') {
            @{
                TimeCreated = $event.TimeCreated
                EventType = "Potential Pass-the-Hash"
                TargetUser = $targetUser
                SourceIP = $sourceIP
                WorkstationName = $workstationName
                LogonType = $logonType
                AuthPackage = $authPackage
                Severity = "High"
                Description = "Type 3 NTLM logon detected - possible PTH attack"
            }
        }
    }

    $lateralMovementIndicators += $pthEvents

    # 2. Detect WMI-based lateral movement
    Write-Host "Analyzing WMI lateral movement..." -ForegroundColor Cyan

    $wmiEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-WMI-Activity/Operational'
        ID = 5857  # WMI connection
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "ClientMachine = ([^;]+)") {
            $clientMachine = $matches[1]
            if ($clientMachine -ne $env:COMPUTERNAME -and $clientMachine -ne "127.0.0.1") {
                @{
                    TimeCreated = $event.TimeCreated
                    EventType = "WMI Remote Connection"
                    SourceComputer = $clientMachine
                    TargetComputer = $env:COMPUTERNAME
                    Severity = "Medium"
                    Description = "Remote WMI connection detected"
                }
            }
        }
    }

    $lateralMovementIndicators += $wmiEvents

    # 3. Detect PSExec-style service creation
    Write-Host "Analyzing service-based lateral movement..." -ForegroundColor Cyan

    $serviceEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'System'
        ID = 7045  # Service installation
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "PSEXE|ADMIN\$|psexec|paexec|winexe") {
            @{
                TimeCreated = $event.TimeCreated
                EventType = "Suspicious Service Creation"
                ServiceName = if ($event.Message -match "Service Name:\s+([^\r\n]+)") { $matches[1] } else { "Unknown" }
                ServicePath = if ($event.Message -match "Service File Name:\s+([^\r\n]+)") { $matches[1] } else { "Unknown" }
                Severity = "High"
                Description = "PSExec-style service creation detected"
            }
        }
    }

    $lateralMovementIndicators += $serviceEvents

    # 4. Detect RDP lateral movement
    Write-Host "Analyzing RDP lateral movement..." -ForegroundColor Cyan

    $rdpEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = 4624  # Successful logon
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        $xml = [xml]$event.ToXml()
        $eventData = $xml.Event.EventData.Data

        $logonType = ($eventData | Where-Object {$_.Name -eq 'LogonType'}).'#text'
        $sourceIP = ($eventData | Where-Object {$_.Name -eq 'IpAddress'}).'#text'
        $targetUser = ($eventData | Where-Object {$_.Name -eq 'TargetUserName'}).'#text'

        # RDP logons (Type 10)
        if ($logonType -eq '10' -and $sourceIP -ne '-' -and $sourceIP -ne '127.0.0.1') {
            @{
                TimeCreated = $event.TimeCreated
                EventType = "RDP Logon"
                TargetUser = $targetUser
                SourceIP = $sourceIP
                LogonType = $logonType
                Severity = "Medium"
                Description = "Remote RDP logon detected"
            }
        }
    }

    $lateralMovementIndicators += $rdpEvents

    # 5. Detect PowerShell remoting
    Write-Host "Analyzing PowerShell remoting..." -ForegroundColor Cyan

    $psRemotingEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-PowerShell/Operational'
        ID = 4103  # Module logging
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "Invoke-Command|Enter-PSSession|New-PSSession") {
            @{
                TimeCreated = $event.TimeCreated
                EventType = "PowerShell Remoting"
                Command = if ($event.Message -match "CommandName=([^\r\n]+)") { $matches[1] } else { "Unknown" }
                Severity = "Medium"
                Description = "PowerShell remoting activity detected"
            }
        }
    }

    $lateralMovementIndicators += $psRemotingEvents

    return $lateralMovementIndicators | Sort-Object TimeCreated
}

# Function to detect credential dumping activities
function Detect-CredentialDumping {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Credential Dumping Detection ===" -ForegroundColor Yellow

    $credentialDumpingIndicators = @()

    # 1. Detect LSASS access
    Write-Host "Analyzing LSASS process access..." -ForegroundColor Cyan

    $lsassEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = 4656  # Handle to object requested
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "lsass.exe" -and $event.Message -match "Process Terminate") {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            @{
                TimeCreated = $event.TimeCreated
                EventType = "LSASS Access"
                ProcessName = ($eventData | Where-Object {$_.Name -eq 'ProcessName'}).'#text'
                SubjectUserName = ($eventData | Where-Object {$_.Name -eq 'SubjectUserName'}).'#text'
                Severity = "High"
                Description = "Access to LSASS process detected - possible credential dumping"
            }
        }
    }

    $credentialDumpingIndicators += $lsassEvents

    # 2. Detect Mimikatz usage via Sysmon
    Write-Host "Analyzing potential Mimikatz usage..." -ForegroundColor Cyan

    $mimikatzEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 1  # Process creation
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "mimikatz|sekurlsa|logonpasswords|lsadump") {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            @{
                TimeCreated = $event.TimeCreated
                EventType = "Mimikatz Activity"
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                Severity = "Critical"
                Description = "Mimikatz-related activity detected"
            }
        }
    }

    $credentialDumpingIndicators += $mimikatzEvents

    # 3. Detect procdump usage on LSASS
    Write-Host "Analyzing procdump usage..." -ForegroundColor Cyan

    $procdumpEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Microsoft-Windows-Sysmon/Operational'
        ID = 1  # Process creation
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        if ($event.Message -match "procdump.*lsass" -or $event.Message -match "procdump.*-ma.*lsass") {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            @{
                TimeCreated = $event.TimeCreated
                EventType = "Procdump LSASS"
                Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                Severity = "High"
                Description = "Procdump used against LSASS process"
            }
        }
    }

    $credentialDumpingIndicators += $procdumpEvents

    return $credentialDumpingIndicators | Sort-Object TimeCreated
}

# Function to detect persistence mechanisms
function Detect-PersistenceMechanisms {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Persistence Mechanism Detection ===" -ForegroundColor Yellow

    $persistenceIndicators = @()

    # 1. Detect registry autorun modifications
    Write-Host "Analyzing registry autorun changes..." -ForegroundColor Cyan

    $registryEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = 4657  # Registry value modified
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        $autorunKeys = @(
            "Run", "RunOnce", "RunServices", "RunServicesOnce",
            "Winlogon", "Explorer", "Shell", "Userinit"
        )

        foreach ($key in $autorunKeys) {
            if ($event.Message -match $key) {
                $xml = [xml]$event.ToXml()
                $eventData = $xml.Event.EventData.Data

                @{
                    TimeCreated = $event.TimeCreated
                    EventType = "Registry Autorun Modification"
                    ObjectName = ($eventData | Where-Object {$_.Name -eq 'ObjectName'}).'#text'
                    ProcessName = ($eventData | Where-Object {$_.Name -eq 'ProcessName'}).'#text'
                    SubjectUserName = ($eventData | Where-Object {$_.Name -eq 'SubjectUserName'}).'#text'
                    Severity = "Medium"
                    Description = "Autorun registry key modified"
                }
                break
            }
        }
    }

    $persistenceIndicators += $registryEvents

    # 2. Detect scheduled task creation
    Write-Host "Analyzing scheduled task creation..." -ForegroundColor Cyan

    $taskEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'Security'
        ID = 4698  # Scheduled task created
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        $xml = [xml]$event.ToXml()
        $eventData = $xml.Event.EventData.Data

        @{
            TimeCreated = $event.TimeCreated
            EventType = "Scheduled Task Created"
            TaskName = ($eventData | Where-Object {$_.Name -eq 'TaskName'}).'#text'
            SubjectUserName = ($eventData | Where-Object {$_.Name -eq 'SubjectUserName'}).'#text'
            TaskContent = ($eventData | Where-Object {$_.Name -eq 'TaskContent'}).'#text'
            Severity = "Medium"
            Description = "New scheduled task created"
        }
    }

    $persistenceIndicators += $taskEvents

    # 3. Detect service creation
    Write-Host "Analyzing service creation..." -ForegroundColor Cyan

    $serviceCreationEvents = Get-WinEvent -FilterHashtable @{
        LogName = 'System'
        ID = 7045  # Service installation
        StartTime = $StartTime
        EndTime = $EndTime
    } -ErrorAction SilentlyContinue | ForEach-Object {
        $event = $_
        @{
            TimeCreated = $event.TimeCreated
            EventType = "Service Installation"
            ServiceName = if ($event.Message -match "Service Name:\s+([^\r\n]+)") { $matches[1] } else { "Unknown" }
            ServicePath = if ($event.Message -match "Service File Name:\s+([^\r\n]+)") { $matches[1] } else { "Unknown" }
            StartType = if ($event.Message -match "Service Start Type:\s+([^\r\n]+)") { $matches[1] } else { "Unknown" }
            Severity = "Medium"
            Description = "New service installed"
        }
    }

    $persistenceIndicators += $serviceCreationEvents

    return $persistenceIndicators | Sort-Object TimeCreated
}

# Main execution
Write-Host "Starting Advanced Threat Hunting Analysis..." -ForegroundColor Green

# Detect lateral movement
$lateralMovement = Detect-LateralMovement -StartTime (Get-Date).AddDays(-7)
$criticalLateralMovement = $lateralMovement | Where-Object { $_.Severity -eq "Critical" -or $_.Severity -eq "High" }

if ($criticalLateralMovement) {
    Write-Host "=== CRITICAL LATERAL MOVEMENT DETECTED ===" -ForegroundColor Red
    $criticalLateralMovement | Format-Table TimeCreated, EventType, TargetUser, SourceIP, Description -AutoSize
}

# Detect credential dumping
$credentialDumping = Detect-CredentialDumping -StartTime (Get-Date).AddDays(-7)
if ($credentialDumping) {
    Write-Host "=== CREDENTIAL DUMPING ACTIVITIES ===" -ForegroundColor Red
    $credentialDumping | Format-Table TimeCreated, EventType, ProcessName, SubjectUserName, Description -AutoSize
}

# Detect persistence
$persistence = Detect-PersistenceMechanisms -StartTime (Get-Date).AddDays(-7)
$suspiciousPersistence = $persistence | Where-Object {
    $_.TaskName -match "Update|Microsoft|System" -or
    $_.ServiceName -match "Update|Microsoft|System" -or
    $_.ObjectName -match "HKEY_LOCAL_MACHINE.*Run"
}

if ($suspiciousPersistence) {
    Write-Host "=== SUSPICIOUS PERSISTENCE MECHANISMS ===" -ForegroundColor Yellow
    $suspiciousPersistence | Format-Table TimeCreated, EventType, TaskName, ServiceName, Description -AutoSize
}
```

## Timeline Analysis and Correlation

### Incident Timeline Reconstruction

```powershell
# Timeline-Analysis.ps1 - Comprehensive incident timeline reconstruction

# Function to create comprehensive incident timeline
function Build-IncidentTimeline {
    param(
        [datetime]$IncidentStart,
        [datetime]$IncidentEnd,
        [string[]]$EventSources = @(
            'Security', 'System', 'Application',
            'Microsoft-Windows-Sysmon/Operational',
            'Microsoft-Windows-PowerShell/Operational',
            'Microsoft-Windows-WMI-Activity/Operational'
        ),
        [string[]]$Keywords = @()
    )

    Write-Host "=== Building Incident Timeline ===" -ForegroundColor Yellow
    Write-Host "Period: $IncidentStart to $IncidentEnd" -ForegroundColor Cyan

    $timelineEvents = @()

    foreach ($logName in $EventSources) {
        Write-Host "Processing log: $logName" -ForegroundColor Cyan

        try {
            $events = Get-WinEvent -FilterHashtable @{
                LogName = $logName
                StartTime = $IncidentStart
                EndTime = $IncidentEnd
            } -ErrorAction SilentlyContinue

            foreach ($event in $events) {
                $shouldInclude = $false

                # Include event if no keywords specified or if keywords match
                if ($Keywords.Count -eq 0) {
                    $shouldInclude = $true
                } else {
                    foreach ($keyword in $Keywords) {
                        if ($event.Message -match $keyword) {
                            $shouldInclude = $true
                            break
                        }
                    }
                }

                if ($shouldInclude) {
                    $timelineEvent = @{
                        TimeCreated = $event.TimeCreated
                        LogName = $event.LogName
                        EventID = $event.Id
                        Level = $event.LevelDisplayName
                        Computer = $event.MachineName
                        ProcessID = $event.ProcessId
                        ThreadID = $event.ThreadId
                        Message = $event.Message.Substring(0, [Math]::Min(200, $event.Message.Length))
                        FullMessage = $event.Message
                    }

                    # Add event-specific parsing
                    switch ($event.Id) {
                        1 {  # Sysmon Process Creation
                            if ($event.LogName -eq 'Microsoft-Windows-Sysmon/Operational') {
                                $xml = [xml]$event.ToXml()
                                $eventData = $xml.Event.EventData.Data
                                $timelineEvent.EventType = "Process Created"
                                $timelineEvent.Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                                $timelineEvent.CommandLine = ($eventData | Where-Object {$_.Name -eq 'CommandLine'}).'#text'
                                $timelineEvent.ParentImage = ($eventData | Where-Object {$_.Name -eq 'ParentImage'}).'#text'
                                $timelineEvent.User = ($eventData | Where-Object {$_.Name -eq 'User'}).'#text'
                            }
                        }
                        3 {  # Sysmon Network Connection
                            if ($event.LogName -eq 'Microsoft-Windows-Sysmon/Operational') {
                                $xml = [xml]$event.ToXml()
                                $eventData = $xml.Event.EventData.Data
                                $timelineEvent.EventType = "Network Connection"
                                $timelineEvent.Image = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
                                $timelineEvent.DestinationIp = ($eventData | Where-Object {$_.Name -eq 'DestinationIp'}).'#text'
                                $timelineEvent.DestinationPort = ($eventData | Where-Object {$_.Name -eq 'DestinationPort'}).'#text'
                            }
                        }
                        4624 {  # Successful Logon
                            $xml = [xml]$event.ToXml()
                            $eventData = $xml.Event.EventData.Data
                            $timelineEvent.EventType = "Successful Logon"
                            $timelineEvent.TargetUserName = ($eventData | Where-Object {$_.Name -eq 'TargetUserName'}).'#text'
                            $timelineEvent.LogonType = ($eventData | Where-Object {$_.Name -eq 'LogonType'}).'#text'
                            $timelineEvent.IpAddress = ($eventData | Where-Object {$_.Name -eq 'IpAddress'}).'#text'
                        }
                        4625 {  # Failed Logon
                            $xml = [xml]$event.ToXml()
                            $eventData = $xml.Event.EventData.Data
                            $timelineEvent.EventType = "Failed Logon"
                            $timelineEvent.TargetUserName = ($eventData | Where-Object {$_.Name -eq 'TargetUserName'}).'#text'
                            $timelineEvent.FailureReason = ($eventData | Where-Object {$_.Name -eq 'FailureReason'}).'#text'
                            $timelineEvent.IpAddress = ($eventData | Where-Object {$_.Name -eq 'IpAddress'}).'#text'
                        }
                        4698 {  # Scheduled Task Created
                            $xml = [xml]$event.ToXml()
                            $eventData = $xml.Event.EventData.Data
                            $timelineEvent.EventType = "Scheduled Task Created"
                            $timelineEvent.TaskName = ($eventData | Where-Object {$_.Name -eq 'TaskName'}).'#text'
                            $timelineEvent.SubjectUserName = ($eventData | Where-Object {$_.Name -eq 'SubjectUserName'}).'#text'
                        }
                        7045 {  # Service Installation
                            $timelineEvent.EventType = "Service Installation"
                            if ($event.Message -match "Service Name:\s+([^\r\n]+)") {
                                $timelineEvent.ServiceName = $matches[1]
                            }
                            if ($event.Message -match "Service File Name:\s+([^\r\n]+)") {
                                $timelineEvent.ServicePath = $matches[1]
                            }
                        }
                        default {
                            $timelineEvent.EventType = "Other"
                        }
                    }

                    $timelineEvents += New-Object PSObject -Property $timelineEvent
                }
            }
        }
        catch {
            Write-Warning "Error processing log $logName`: $($_.Exception.Message)"
        }
    }

    return $timelineEvents | Sort-Object TimeCreated
}

# Function to correlate events and identify patterns
function Correlate-IncidentEvents {
    param(
        [array]$TimelineEvents,
        [int]$CorrelationWindowMinutes = 5
    )

    Write-Host "=== Correlating Incident Events ===" -ForegroundColor Yellow

    $correlatedEvents = @()
    $correlationWindow = New-TimeSpan -Minutes $CorrelationWindowMinutes

    # Group events by time windows
    $eventGroups = $TimelineEvents | Group-Object {
        [int]($_.TimeCreated.Ticks / $correlationWindow.Ticks)
    }

    foreach ($group in $eventGroups) {
        $groupEvents = $group.Group | Sort-Object TimeCreated
        $firstEvent = $groupEvents[0]
        $lastEvent = $groupEvents[-1]

        $correlation = @{
            TimeStart = $firstEvent.TimeCreated
            TimeEnd = $lastEvent.TimeCreated
            Duration = ($lastEvent.TimeCreated - $firstEvent.TimeCreated).TotalSeconds
            EventCount = $groupEvents.Count
            Events = $groupEvents
        }

        # Analyze patterns within the group
        $patterns = @()

        # Pattern 1: Process creation followed by network connection
        $processCreations = $groupEvents | Where-Object { $_.EventType -eq "Process Created" }
        $networkConnections = $groupEvents | Where-Object { $_.EventType -eq "Network Connection" }

        foreach ($proc in $processCreations) {
            $relatedConnections = $networkConnections | Where-Object {
                $_.Image -eq $proc.Image -and
                [Math]::Abs(($_.TimeCreated - $proc.TimeCreated).TotalSeconds) -lt 30
            }

            if ($relatedConnections) {
                $patterns += "Process-to-Network: $($proc.Image) -> $($relatedConnections[0].DestinationIp):$($relatedConnections[0].DestinationPort)"
            }
        }

        # Pattern 2: Failed logons followed by successful logon
        $failedLogons = $groupEvents | Where-Object { $_.EventType -eq "Failed Logon" }
        $successfulLogons = $groupEvents | Where-Object { $_.EventType -eq "Successful Logon" }

        if ($failedLogons -and $successfulLogons) {
            $patterns += "Brute Force Pattern: $($failedLogons.Count) failed attempts, then successful logon"
        }

        # Pattern 3: Service installation followed by process creation
        $serviceInstalls = $groupEvents | Where-Object { $_.EventType -eq "Service Installation" }
        if ($serviceInstalls -and $processCreations) {
            $patterns += "Service-to-Process: Service installation followed by process execution"
        }

        if ($patterns.Count -gt 0) {
            $correlation.Patterns = $patterns
            $correlation.RiskLevel = switch ($patterns.Count) {
                { $_ -ge 3 } { "High" }
                { $_ -eq 2 } { "Medium" }
                default { "Low" }
            }
        }

        $correlatedEvents += New-Object PSObject -Property $correlation
    }

    return $correlatedEvents | Sort-Object TimeStart
}

# Function to generate incident summary report
function Generate-IncidentSummary {
    param(
        [array]$TimelineEvents,
        [array]$CorrelatedEvents
    )

    Write-Host "=== Generating Incident Summary Report ===" -ForegroundColor Yellow

    $report = @{
        AnalysisTime = Get-Date
        TotalEvents = $TimelineEvents.Count
        TimeRange = @{
            Start = ($TimelineEvents | Sort-Object TimeCreated)[0].TimeCreated
            End = ($TimelineEvents | Sort-Object TimeCreated)[-1].TimeCreated
        }
        EventBreakdown = @{}
        HighRiskCorrelations = @()
        KeyFindings = @()
        Recommendations = @()
    }

    # Event breakdown by type
    $eventTypes = $TimelineEvents | Group-Object EventType
    foreach ($type in $eventTypes) {
        $report.EventBreakdown[$type.Name] = $type.Count
    }

    # High-risk correlations
    $report.HighRiskCorrelations = $CorrelatedEvents | Where-Object { $_.RiskLevel -eq "High" }

    # Key findings analysis
    $findings = @()

    # Check for potential malware execution
    $suspiciousProcesses = $TimelineEvents | Where-Object {
        $_.EventType -eq "Process Created" -and
        ($_.Image -match "temp|appdata|users.*desktop" -or
         $_.CommandLine -match "powershell.*-enc|-w hidden|-nop|-exec bypass")
    }

    if ($suspiciousProcesses) {
        $findings += "Suspicious process executions detected: $($suspiciousProcesses.Count) instances"
    }

    # Check for lateral movement
    $networkConnections = $TimelineEvents | Where-Object {
        $_.EventType -eq "Network Connection" -and
        $_.DestinationIp -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)"
    }

    if ($networkConnections.Count -gt 10) {
        $findings += "High volume of internal network connections: $($networkConnections.Count) connections"
    }

    # Check for privilege escalation
    $privilegeEscalation = $TimelineEvents | Where-Object {
        $_.EventType -eq "Successful Logon" -and
        $_.TargetUserName -match "admin|root|system"
    }

    if ($privilegeEscalation) {
        $findings += "Privileged account logons detected: $($privilegeEscalation.Count) instances"
    }

    # Check for persistence mechanisms
    $persistence = $TimelineEvents | Where-Object {
        $_.EventType -in @("Scheduled Task Created", "Service Installation") -or
        ($_.Message -match "Run.*Registry" -and $_.EventID -eq 4657)
    }

    if ($persistence) {
        $findings += "Persistence mechanisms detected: $($persistence.Count) instances"
    }

    $report.KeyFindings = $findings

    # Generate recommendations
    $recommendations = @()

    if ($suspiciousProcesses) {
        $recommendations += "Immediately quarantine systems with suspicious process executions"
        $recommendations += "Perform full antimalware scan on affected systems"
    }

    if ($networkConnections.Count -gt 20) {
        $recommendations += "Review network segmentation and implement additional monitoring"
        $recommendations += "Consider network isolation for affected systems"
    }

    if ($privilegeEscalation) {
        $recommendations += "Reset passwords for all privileged accounts"
        $recommendations += "Review and audit privileged account usage"
    }

    if ($persistence) {
        $recommendations += "Review and validate all scheduled tasks and services"
        $recommendations += "Implement stricter controls on task/service creation"
    }

    $recommendations += "Continue monitoring for 48-72 hours post-incident"
    $recommendations += "Update detection rules based on observed TTPs"

    $report.Recommendations = $recommendations

    return $report
}

# Usage example
$incidentStart = Get-Date "2025-01-10 08:00:00"
$incidentEnd = Get-Date "2025-01-10 18:00:00"

Write-Host "Starting Comprehensive Incident Timeline Analysis..." -ForegroundColor Green

# Build timeline
$timeline = Build-IncidentTimeline -IncidentStart $incidentStart -IncidentEnd $incidentEnd

# Correlate events
$correlations = Correlate-IncidentEvents -TimelineEvents $timeline -CorrelationWindowMinutes 5

# Generate summary
$summary = Generate-IncidentSummary -TimelineEvents $timeline -CorrelatedEvents $correlations

# Display results
Write-Host "=== INCIDENT ANALYSIS SUMMARY ===" -ForegroundColor Yellow
Write-Host "Analysis Time: $($summary.AnalysisTime)" -ForegroundColor Cyan
Write-Host "Total Events Analyzed: $($summary.TotalEvents)" -ForegroundColor Cyan
Write-Host "Time Range: $($summary.TimeRange.Start) to $($summary.TimeRange.End)" -ForegroundColor Cyan

Write-Host "`n=== EVENT BREAKDOWN ===" -ForegroundColor Yellow
$summary.EventBreakdown.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value)" -ForegroundColor White
}

if ($summary.HighRiskCorrelations) {
    Write-Host "`n=== HIGH-RISK CORRELATIONS ===" -ForegroundColor Red
    foreach ($correlation in $summary.HighRiskCorrelations) {
        Write-Host "Time: $($correlation.TimeStart) - Duration: $($correlation.Duration)s - Events: $($correlation.EventCount)" -ForegroundColor White
        foreach ($pattern in $correlation.Patterns) {
            Write-Host "  - $pattern" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== KEY FINDINGS ===" -ForegroundColor Yellow
foreach ($finding in $summary.KeyFindings) {
    Write-Host "• $finding" -ForegroundColor White
}

Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Cyan
foreach ($recommendation in $summary.Recommendations) {
    Write-Host "• $recommendation" -ForegroundColor White
}
```

## Malware Analysis Queries

### File and Process Analysis

```powershell
# Malware-Analysis-Queries.ps1 - Advanced malware detection and analysis

# Function to analyze suspicious file activities
function Analyze-SuspiciousFileActivity {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date),
        [string[]]$SuspiciousExtensions = @('.exe', '.bat', '.cmd', '.ps1', '.vbs', '.scr', '.com', '.pif'),
        [string[]]$SuspiciousPaths = @('temp', 'appdata', 'desktop', 'downloads', 'public')
    )

    Write-Host "=== Analyzing Suspicious File Activities ===" -ForegroundColor Yellow

    $suspiciousFiles = @()

    # Get Sysmon file creation events (Event ID 11)
    try {
        $fileEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 11  # File created
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $fileEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $fileName = ($eventData | Where-Object {$_.Name -eq 'TargetFilename'}).'#text'
            $processName = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
            $processId = ($eventData | Where-Object {$_.Name -eq 'ProcessId'}).'#text'

            # Check for suspicious characteristics
            $riskFactors = @()

            # Check file extension
            foreach ($ext in $SuspiciousExtensions) {
                if ($fileName -like "*$ext") {
                    $riskFactors += "Executable file type: $ext"
                    break
                }
            }

            # Check file path
            foreach ($path in $SuspiciousPaths) {
                if ($fileName -match $path) {
                    $riskFactors += "Suspicious location: $path"
                    break
                }
            }

            # Check for temporary or random names
            if ($fileName -match "\\(tmp|temp|~)[a-fA-F0-9]{6,}") {
                $riskFactors += "Temporary/random filename"
            }

            # Check for common malware patterns
            if ($fileName -match "(svchost|winlogon|explorer|lsass)\.exe$" -and
                $fileName -notmatch "\\(system32|syswow64)\\") {
                $riskFactors += "System process name in non-system location"
            }

            # Check for double extensions
            if ($fileName -match "\.[a-zA-Z]{2,4}\.[a-zA-Z]{2,4}$") {
                $riskFactors += "Double file extension"
            }

            if ($riskFactors.Count -gt 0) {
                $fileAnalysis = @{
                    TimeCreated = $event.TimeCreated
                    FileName = $fileName
                    ProcessName = $processName
                    ProcessId = $processId
                    RiskFactors = $riskFactors
                    RiskLevel = if ($riskFactors.Count -gt 2) { "High" } elseif ($riskFactors.Count -gt 1) { "Medium" } else { "Low" }
                }

                $suspiciousFiles += New-Object PSObject -Property $fileAnalysis
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon file events: $($_.Exception.Message)"
    }

    return $suspiciousFiles | Sort-Object TimeCreated -Descending
}

# Function to analyze process injection techniques
function Analyze-ProcessInjection {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Analyzing Process Injection Techniques ===" -ForegroundColor Yellow

    $injectionEvents = @()

    # Get Sysmon process access events (Event ID 10)
    try {
        $processAccessEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 10  # Process accessed
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $processAccessEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $sourceImage = ($eventData | Where-Object {$_.Name -eq 'SourceImage'}).'#text'
            $targetImage = ($eventData | Where-Object {$_.Name -eq 'TargetImage'}).'#text'
            $grantedAccess = ($eventData | Where-Object {$_.Name -eq 'GrantedAccess'}).'#text'
            $callTrace = ($eventData | Where-Object {$_.Name -eq 'CallTrace'}).'#text'

            # Check for suspicious access patterns
            $suspiciousAccess = @(
                '0x1010',   # PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION
                '0x1410',   # PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION | PROCESS_VM_READ
                '0x143a',   # Multiple access rights including VM_WRITE
                '0x1f0fff', # PROCESS_ALL_ACCESS
                '0x1f1fff', # PROCESS_ALL_ACCESS
                '0x1f2fff', # PROCESS_ALL_ACCESS
                '0x1f3fff'  # PROCESS_ALL_ACCESS
            )

            if ($grantedAccess -in $suspiciousAccess) {
                $injectionAnalysis = @{
                    TimeCreated = $event.TimeCreated
                    SourceImage = $sourceImage
                    TargetImage = $targetImage
                    GrantedAccess = $grantedAccess
                    CallTrace = $callTrace
                    InjectionTechnique = "Unknown"
                    Severity = "Medium"
                }

                # Identify specific injection techniques
                if ($callTrace -match "ntdll\.dll.*VirtualAllocEx") {
                    $injectionAnalysis.InjectionTechnique = "VirtualAllocEx Injection"
                    $injectionAnalysis.Severity = "High"
                } elseif ($callTrace -match "ntdll\.dll.*WriteProcessMemory") {
                    $injectionAnalysis.InjectionTechnique = "WriteProcessMemory Injection"
                    $injectionAnalysis.Severity = "High"
                } elseif ($callTrace -match "ntdll\.dll.*CreateRemoteThread") {
                    $injectionAnalysis.InjectionTechnique = "CreateRemoteThread Injection"
                    $injectionAnalysis.Severity = "High"
                } elseif ($callTrace -match "kernel32\.dll.*SetThreadContext") {
                    $injectionAnalysis.InjectionTechnique = "Thread Context Hijacking"
                    $injectionAnalysis.Severity = "Critical"
                } elseif ($grantedAccess -eq '0x1010' -and $targetImage -match "(lsass|csrss|winlogon)\.exe") {
                    $injectionAnalysis.InjectionTechnique = "Potential Credential Dumping"
                    $injectionAnalysis.Severity = "Critical"
                }

                $injectionEvents += New-Object PSObject -Property $injectionAnalysis
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon process access events: $($_.Exception.Message)"
    }

    # Get Sysmon CreateRemoteThread events (Event ID 8)
    try {
        $remoteThreadEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 8  # CreateRemoteThread
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $remoteThreadEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $sourceImage = ($eventData | Where-Object {$_.Name -eq 'SourceImage'}).'#text'
            $targetImage = ($eventData | Where-Object {$_.Name -eq 'TargetImage'}).'#text'
            $startAddress = ($eventData | Where-Object {$_.Name -eq 'StartAddress'}).'#text'
            $startModule = ($eventData | Where-Object {$_.Name -eq 'StartModule'}).'#text'
            $startFunction = ($eventData | Where-Object {$_.Name -eq 'StartFunction'}).'#text'

            $remoteThreadAnalysis = @{
                TimeCreated = $event.TimeCreated
                SourceImage = $sourceImage
                TargetImage = $targetImage
                StartAddress = $startAddress
                StartModule = $startModule
                StartFunction = $startFunction
                InjectionTechnique = "CreateRemoteThread"
                Severity = "High"
            }

            # Check for specific malicious patterns
            if ($startModule -eq "ntdll.dll" -and $startFunction -match "Ldr.*LoadDll") {
                $remoteThreadAnalysis.InjectionTechnique = "Manual DLL Loading"
                $remoteThreadAnalysis.Severity = "Critical"
            } elseif ($startAddress -match "^0x[0-9a-fA-F]{16}$" -and $startModule -eq "") {
                $remoteThreadAnalysis.InjectionTechnique = "Reflective DLL Injection"
                $remoteThreadAnalysis.Severity = "Critical"
            }

            $injectionEvents += New-Object PSObject -Property $remoteThreadAnalysis
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon CreateRemoteThread events: $($_.Exception.Message)"
    }

    return $injectionEvents | Sort-Object TimeCreated -Descending
}

# Function to analyze image/DLL loading patterns
function Analyze-ImageLoading {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Analyzing Suspicious Image/DLL Loading ===" -ForegroundColor Yellow

    $suspiciousLoads = @()

    # Get Sysmon image load events (Event ID 7)
    try {
        $imageLoadEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 7  # Image loaded
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        foreach ($event in $imageLoadEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $processName = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'
            $imageLoaded = ($eventData | Where-Object {$_.Name -eq 'ImageLoaded'}).'#text'
            $signed = ($eventData | Where-Object {$_.Name -eq 'Signed'}).'#text'
            $signature = ($eventData | Where-Object {$_.Name -eq 'Signature'}).'#text'
            $signatureStatus = ($eventData | Where-Object {$_.Name -eq 'SignatureStatus'}).'#text'

            $riskFactors = @()

            # Check for unsigned or invalid signatures
            if ($signed -eq 'false' -or $signatureStatus -ne 'Valid') {
                $riskFactors += "Unsigned or invalid signature"
            }

            # Check for loading from suspicious locations
            $suspiciousImagePaths = @('temp', 'appdata', 'programdata', 'users.*desktop', 'downloads')
            foreach ($path in $suspiciousImagePaths) {
                if ($imageLoaded -match $path) {
                    $riskFactors += "Suspicious load location: $path"
                    break
                }
            }

            # Check for known malicious DLLs
            $maliciousDLLNames = @(
                'payload\.dll', 'shell\.dll', 'backdoor\.dll', 'rat\.dll',
                'inject\.dll', 'hook\.dll', 'keylog\.dll'
            )
            foreach ($dllName in $maliciousDLLNames) {
                if ($imageLoaded -match $dllName) {
                    $riskFactors += "Suspicious DLL name: $dllName"
                    break
                }
            }

            # Check for reflective DLL loading (no file on disk)
            if ($imageLoaded -match "^0x[0-9a-fA-F]{16}$") {
                $riskFactors += "Reflective DLL loading"
            }

            # Check for hollowing indicators
            if ($processName -match "(svchost|explorer|winlogon)\.exe" -and
                $imageLoaded -notmatch "\\(system32|syswow64|program files)" -and
                $signed -eq 'false') {
                $riskFactors += "Possible process hollowing"
            }

            if ($riskFactors.Count -gt 0) {
                $loadAnalysis = @{
                    TimeCreated = $event.TimeCreated
                    ProcessName = $processName
                    ImageLoaded = $imageLoaded
                    Signed = $signed
                    Signature = $signature
                    SignatureStatus = $signatureStatus
                    RiskFactors = $riskFactors
                    RiskLevel = if ($riskFactors.Count -gt 2) { "High" } elseif ($riskFactors.Count -gt 1) { "Medium" } else { "Low" }
                }

                $suspiciousLoads += New-Object PSObject -Property $loadAnalysis
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon image load events: $($_.Exception.Message)"
    }

    return $suspiciousLoads | Sort-Object TimeCreated -Descending
}

# Function to analyze registry modifications for malware persistence
function Analyze-MalwarePersistence {
    param(
        [datetime]$StartTime = (Get-Date).AddDays(-7),
        [datetime]$EndTime = (Get-Date)
    )

    Write-Host "=== Analyzing Malware Persistence Mechanisms ===" -ForegroundColor Yellow

    $persistenceEvents = @()

    # Get Sysmon registry events (Event ID 13)
    try {
        $registryEvents = Get-WinEvent -FilterHashtable @{
            LogName = 'Microsoft-Windows-Sysmon/Operational'
            ID = 13  # Registry value set
            StartTime = $StartTime
            EndTime = $EndTime
        } -ErrorAction SilentlyContinue

        # Define persistence registry keys
        $persistenceKeys = @(
            'HKLM.*\\Run',
            'HKLM.*\\RunOnce',
            'HKCU.*\\Run',
            'HKCU.*\\RunOnce',
            'HKLM.*\\Winlogon\\Shell',
            'HKLM.*\\Winlogon\\Userinit',
            'HKLM.*\\Image File Execution Options',
            'HKLM.*\\CurrentVersion\\Windows\\Load',
            'HKLM.*\\CurrentVersion\\Windows\\Run',
            'HKLM.*\\Services\\.*\\ImagePath',
            'HKLM.*\\Microsoft\\Windows NT\\CurrentVersion\\Windows\\AppInit_DLLs'
        )

        foreach ($event in $registryEvents) {
            $xml = [xml]$event.ToXml()
            $eventData = $xml.Event.EventData.Data

            $targetObject = ($eventData | Where-Object {$_.Name -eq 'TargetObject'}).'#text'
            $details = ($eventData | Where-Object {$_.Name -eq 'Details'}).'#text'
            $processName = ($eventData | Where-Object {$_.Name -eq 'Image'}).'#text'

            foreach ($key in $persistenceKeys) {
                if ($targetObject -match $key) {
                    $persistenceType = switch -Regex ($targetObject) {
                        'Run.*' { "Autorun Registry" }
                        'Winlogon' { "Winlogon Persistence" }
                        'Image File Execution Options' { "IFEO Persistence" }
                        'Services' { "Service Persistence" }
                        'AppInit_DLLs' { "AppInit DLL Persistence" }
                        default { "Unknown Persistence" }
                    }

                    $riskFactors = @()

                    # Check for suspicious values
                    if ($details -match '(temp|appdata|programdata).*\.(exe|bat|cmd|ps1)') {
                        $riskFactors += "Suspicious file location in persistence value"
                    }

                    if ($details -match '(powershell|cmd).*-enc|-w hidden|-nop|-exec bypass') {
                        $riskFactors += "Suspicious PowerShell/command line arguments"
                    }

                    if ($details -match 'rundll32.*,.*#[0-9]+') {
                        $riskFactors += "Suspicious rundll32 usage"
                    }

                    $persistenceAnalysis = @{
                        TimeCreated = $event.TimeCreated
                        ProcessName = $processName
                        TargetObject = $targetObject
                        Details = $details
                        PersistenceType = $persistenceType
                        RiskFactors = $riskFactors
                        RiskLevel = if ($riskFactors.Count -gt 1) { "High" } elseif ($riskFactors.Count -eq 1) { "Medium" } else { "Low" }
                    }

                    $persistenceEvents += New-Object PSObject -Property $persistenceAnalysis
                    break
                }
            }
        }
    }
    catch {
        Write-Warning "Could not retrieve Sysmon registry events: $($_.Exception.Message)"
    }

    return $persistenceEvents | Sort-Object TimeCreated -Descending
}

# Main execution
Write-Host "Starting Comprehensive Malware Analysis..." -ForegroundColor Green

# Analyze suspicious files
$suspiciousFiles = Analyze-SuspiciousFileActivity -StartTime (Get-Date).AddDays(-7)
$highRiskFiles = $suspiciousFiles | Where-Object { $_.RiskLevel -eq "High" }

if ($highRiskFiles) {
    Write-Host "=== HIGH-RISK FILE ACTIVITIES ===" -ForegroundColor Red
    $highRiskFiles | Select-Object TimeCreated, FileName, ProcessName, RiskFactors |
        Sort-Object TimeCreated -Descending | Format-Table -AutoSize
}

# Analyze process injection
$injectionEvents = Analyze-ProcessInjection -StartTime (Get-Date).AddDays(-7)
$criticalInjections = $injectionEvents | Where-Object { $_.Severity -eq "Critical" }

if ($criticalInjections) {
    Write-Host "=== CRITICAL PROCESS INJECTION EVENTS ===" -ForegroundColor Red
    $criticalInjections | Select-Object TimeCreated, SourceImage, TargetImage, InjectionTechnique |
        Sort-Object TimeCreated -Descending | Format-Table -AutoSize
}

# Analyze image loading
$suspiciousLoads = Analyze-ImageLoading -StartTime (Get-Date).AddDays(-7)
$highRiskLoads = $suspiciousLoads | Where-Object { $_.RiskLevel -eq "High" }

if ($highRiskLoads) {
    Write-Host "=== HIGH-RISK IMAGE LOADING ===" -ForegroundColor Red
    $highRiskLoads | Select-Object TimeCreated, ProcessName, ImageLoaded, RiskFactors |
        Sort-Object TimeCreated -Descending | Format-Table -AutoSize
}

# Analyze persistence mechanisms
$persistenceEvents = Analyze-MalwarePersistence -StartTime (Get-Date).AddDays(-7)
$highRiskPersistence = $persistenceEvents | Where-Object { $_.RiskLevel -eq "High" }

if ($highRiskPersistence) {
    Write-Host "=== HIGH-RISK PERSISTENCE MECHANISMS ===" -ForegroundColor Red
    $highRiskPersistence | Select-Object TimeCreated, PersistenceType, TargetObject, RiskFactors |
        Sort-Object TimeCreated -Descending | Format-Table -AutoSize
}

# Generate summary statistics
Write-Host "=== MALWARE ANALYSIS SUMMARY ===" -ForegroundColor Yellow
Write-Host "Suspicious Files: $($suspiciousFiles.Count) (High Risk: $($highRiskFiles.Count))" -ForegroundColor Cyan
Write-Host "Injection Events: $($injectionEvents.Count) (Critical: $($criticalInjections.Count))" -ForegroundColor Cyan
Write-Host "Suspicious Loads: $($suspiciousLoads.Count) (High Risk: $($highRiskLoads.Count))" -ForegroundColor Cyan
Write-Host "Persistence Events: $($persistenceEvents.Count) (High Risk: $($highRiskPersistence.Count))" -ForegroundColor Cyan
```

## Best Practices and Recommendations

### Query Optimization and Performance

1. **Time Range Optimization**

   - Use specific time ranges to reduce query load
   - Implement sliding window analysis for real-time monitoring
   - Archive old logs to maintain performance

2. **Event Filtering**

   - Use targeted event IDs to reduce noise
   - Implement whitelist filtering for known-good activities
   - Correlate multiple event sources for better context

3. **Resource Management**
   - Monitor system performance during query execution
   - Implement query result caching for repeated analyses
   - Use background jobs for long-running queries

### Incident Response Integration

1. **Automated Analysis**

   - Create scheduled tasks for regular threat hunting
   - Implement alerting for high-risk findings
   - Integrate with SIEM platforms for centralized analysis

2. **Documentation Standards**

   - Maintain query libraries for common scenarios
   - Document findings with timestamps and evidence
   - Create playbooks for different incident types

3. **Team Collaboration**
   - Share query results in standardized formats
   - Maintain centralized knowledge base
   - Conduct regular training on query techniques

## Conclusion

Network unisolation queries provide powerful capabilities for incident response and forensic analysis. This guide demonstrates:

- **Comprehensive Analysis**: Multi-layered approach to network forensics
- **Advanced Detection**: Sophisticated threat hunting methodologies
- **Timeline Reconstruction**: Detailed incident analysis capabilities
- **Malware Detection**: Advanced techniques for identifying malicious activities
- **Correlation Analysis**: Pattern recognition and event correlation

Key benefits of these query approaches:

- **Deep Visibility**: Comprehensive view of network and system activities
- **Threat Detection**: Advanced capabilities for identifying sophisticated attacks
- **Incident Response**: Structured approach to investigation and analysis
- **Evidence Collection**: Detailed forensic evidence for legal proceedings
- **Continuous Improvement**: Iterative enhancement of detection capabilities

By implementing these query techniques, security teams can significantly improve their incident response capabilities and enhance their overall security posture through proactive threat hunting and comprehensive forensic analysis.

---

_These queries should be tested in lab environments before production use and regularly updated based on emerging threats and attack techniques._
