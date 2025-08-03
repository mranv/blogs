---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:30:00+05:30
modDatetime: 2025-01-28T14:30:00+05:30
title: Creating a Security-Focused PowerShell and CMD Console for Windows
slug: powershell-security-console-customization
featured: false
draft: false
tags:
  - powershell
  - windows
  - security
  - cmd
  - customization
  - terminal
  - productivity
  - windows-10-iot
description: Build a personalized security-focused command line environment with custom PowerShell profiles and CMD configurations, including security utilities, enhanced prompts, and auto-launch capabilities for Windows environments
---

# Creating a Security-Focused PowerShell and CMD Console for Windows

Transform your Windows command line experience with personalized, security-focused configurations for both PowerShell and CMD. This guide provides complete customization solutions that work even in restricted environments like Windows 10 IoT.

## Overview

Whether you're conducting security audits, managing systems, or performing daily administrative tasks, having a properly configured command line environment significantly improves productivity. This guide covers:

- Custom PowerShell profiles with security utilities
- Enhanced CMD configurations with auto-launch
- Security-focused aliases and functions
- Professional visual themes
- Compatibility with restricted environments

## PowerShell Security Console

### Creating Your Personalized Profile

Let's build a comprehensive PowerShell profile tailored for security operations:

```powershell
# Create a personalized profile for Anubhav
@'
# Anubhav's Security PowerShell Profile
# ====================================

# Set colors - dark security-focused theme
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "White"
$Host.PrivateData.ErrorForegroundColor = "Red"
$Host.PrivateData.WarningForegroundColor = "Yellow"
$Host.PrivateData.DebugForegroundColor = "Cyan"
$Host.PrivateData.VerboseForegroundColor = "Green"

# Personalized security-focused prompt
function prompt {
    # Get last command status
    $lastCommand = $?
    $statusIndicator = if ($lastCommand) { "+" } else { "!" }
    $statusColor = if ($lastCommand) { "Green" } else { "Red" }

    # Admin check
    $admin = [bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match "S-1-5-32-544")
    $adminTag = if ($admin) { "[ADMIN] " } else { "" }

    # Current path
    $path = $pwd.Path.Replace($HOME, "~")

    # Current time for audit logging
    $time = Get-Date -Format "HH:mm:ss"

    # Update window title with path info
    $Host.UI.RawUI.WindowTitle = "Anubhav - $path $adminTag"

    # Multi-line prompt for better readability
    Write-Host ""
    Write-Host "[$time] " -NoNewline -ForegroundColor Cyan
    Write-Host $adminTag -NoNewline -ForegroundColor Yellow
    Write-Host "$path" -ForegroundColor Blue
    Write-Host "[$statusIndicator]" -NoNewline -ForegroundColor $statusColor
    return " > "
}

# Useful security aliases
Set-Alias ping Test-Connection
Set-Alias which Get-Command

# Security utility functions
function Test-Port {
    param($Computer, $Port)
    $conn = New-Object System.Net.Sockets.TcpClient
    try {
        $conn.Connect($Computer, $Port)
        Write-Host "Port $Port is OPEN on $Computer" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Port $Port is CLOSED on $Computer" -ForegroundColor Red
        return $false
    } finally {
        $conn.Dispose()
    }
}

function Get-SystemInfo {
    $os = Get-CimInstance Win32_OperatingSystem
    $cs = Get-CimInstance Win32_ComputerSystem

    Write-Host "OS: $($os.Caption) $($os.Version)" -ForegroundColor Green
    Write-Host "Boot Time: $($os.LastBootUpTime)" -ForegroundColor Green
    Write-Host "Uptime: $([math]::Round(($os.LocalDateTime - $os.LastBootUpTime).TotalHours, 2)) hours" -ForegroundColor Green
    Write-Host "Memory: $([math]::Round($cs.TotalPhysicalMemory / 1GB, 2)) GB" -ForegroundColor Green
}

# Welcome banner
Clear-Host
Write-Host "+-------------------------------------------+" -ForegroundColor Blue
Write-Host "|       ANUBHAV'S SECURITY CONSOLE          |" -ForegroundColor Blue
Write-Host "+-------------------------------------------+" -ForegroundColor Blue
Write-Host "* System : $([System.Environment]::OSVersion.VersionString)" -ForegroundColor Gray
Write-Host "* User   : $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)" -ForegroundColor Gray
Write-Host "* PS Ver : $($PSVersionTable.PSVersion)" -ForegroundColor Gray
Write-Host ""
Write-Host "[*] Type 'Get-SystemInfo' for system details" -ForegroundColor Yellow
Write-Host "[*] Type 'Test-Port computer port' to check connectivity" -ForegroundColor Yellow
Write-Host ""
'@ | Set-Content -Path $PROFILE -Encoding ASCII

# Inform the user how to load the profile
Write-Host "Anubhav's profile created. To load it, run:" -ForegroundColor Green
Write-Host 'powershell -ExecutionPolicy Bypass -NoExit -Command ". $PROFILE"' -ForegroundColor Yellow
```

### Key Features of the PowerShell Profile

1. **Enhanced Security Prompt**:
   - Shows current time for audit trails
   - Displays admin status clearly
   - Indicates last command success/failure
   - Updates window title with context

2. **Security Utility Functions**:
   - `Test-Port`: Quick port scanning capability
   - `Get-SystemInfo`: System security auditing
   - Custom aliases for common tasks

3. **Professional Appearance**:
   - Dark theme optimized for long sessions
   - Color-coded output for different message types
   - Clean, organized welcome banner

4. **Compatibility**:
   - Works in restricted environments
   - Minimal dependencies
   - Lightweight resource usage

### Activating Your PowerShell Profile

To use this profile, run:

```powershell
powershell -ExecutionPolicy Bypass -NoExit -Command ". $PROFILE"
```

## CMD Security Console with Auto-Launch

For environments where PowerShell is restricted or when you prefer CMD, here's a comprehensive solution:

### Step 1: Create the Batch File

Create a file named `AnubhavCMD.bat` with the following content:

```batch
@echo off
:: Anubhav's Security-Focused CMD Setup
title Anubhav's Security Console
color 0B

:: Clear screen with custom banner
cls
echo.
echo  +------------------------------------------+
echo  ^|      ANUBHAV'S SECURITY COMMAND LINE     ^|
echo  +------------------------------------------+
echo.
echo  * System: %OS%
echo  * User  : %USERNAME%
echo  * Date  : %DATE%
echo.

:: Custom prompt with admin check
net session >nul 2>&1
if %errorlevel% == 0 (
    prompt $E[36m[$T]$E[0m [ADMIN] $E[94m$P$E[0m$_$E[92m^>$E[0m
) else (
    prompt $E[36m[$T]$E[0m $E[94m$P$E[0m$_$E[92m^>$E[0m
)

:: Security aliases
doskey ls=dir $*
doskey clear=cls
doskey sysinfo=systeminfo ^| findstr /B /C:"OS" /C:"OS Version"
doskey ports=netstat -an ^| findstr "LISTENING"
doskey netinfo=ipconfig /all
doskey scan=ping $1

echo  [*] Security commands: sysinfo, ports, netinfo, scan
echo.
```

Save this file in your user profile folder: `C:\Users\%USERNAME%\AnubhavCMD.bat`

### Step 2: Configure Auto-Launch

Create a setup script to enable automatic loading:

```batch
@echo off
reg add "HKCU\Software\Microsoft\Command Processor" /v AutoRun /t REG_SZ /d "%USERPROFILE%\AnubhavCMD.bat" /f
echo Registry key has been set! Close this window and open a new CMD to see your customized prompt.
pause
```

Save this as `SetupAutoRun.bat` and run it as administrator.

### Step 3: Test Your Configuration

1. Close any open Command Prompt windows
2. Open a new Command Prompt
3. Your custom configuration loads automatically

### CMD Console Features

1. **Security Commands**:
   - `sysinfo`: Quick OS information
   - `ports`: Show listening ports
   - `netinfo`: Network configuration
   - `scan`: Ping utility wrapper

2. **Enhanced Prompt**:
   - Shows current time
   - Indicates admin privileges
   - Color-coded for visibility

3. **Professional Banner**:
   - Personalized header
   - System information display
   - Command reference

## Advanced Customization Options

### Adding More Security Functions to PowerShell

Extend your profile with additional utilities:

```powershell
# Network Security Scanner
function Get-OpenPorts {
    param($Target = "localhost", $StartPort = 1, $EndPort = 1000)
    Write-Host "Scanning $Target from port $StartPort to $EndPort..." -ForegroundColor Yellow

    $StartPort..$EndPort | ForEach-Object {
        $port = $_
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $tcp.Connect($Target, $port)
            Write-Host "Port $port : OPEN" -ForegroundColor Green
            $tcp.Close()
        } catch {
            # Port closed or filtered
        }
    }
}

# Process Security Checker
function Get-SuspiciousProcesses {
    Get-Process | Where-Object {
        $_.Path -eq $null -or
        $_.Company -eq $null -or
        $_.Path -like "*\Temp\*"
    } | Select-Object Name, Id, Path, Company
}

# Quick Security Audit
function Start-SecurityAudit {
    Write-Host "=== Security Audit ===" -ForegroundColor Yellow

    # Check Windows Defender status
    Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, IoavProtectionEnabled

    # Check firewall status
    Get-NetFirewallProfile | Select-Object Name, Enabled

    # Check for suspicious scheduled tasks
    Get-ScheduledTask | Where-Object {$_.Author -notlike "*Microsoft*"} | Select-Object TaskName, Author, State
}
```

### Enhancing CMD with More Aliases

Add these to your `AnubhavCMD.bat`:

```batch
:: Additional security aliases
doskey firewall=netsh advfirewall show allprofiles
doskey services=sc query state= all
doskey processes=tasklist /v
doskey connections=netstat -anob
doskey users=net user
doskey shares=net share
doskey startup=wmic startup get caption,command
doskey patches=wmic qfe list brief
```

## Security Best Practices

### 1. Profile Security

- Store profiles in protected directories
- Avoid hardcoding sensitive information
- Use environment variables for paths
- Regularly review and update profiles

### 2. Execution Policy Management

For PowerShell, understand execution policies:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Logging and Auditing

Enable PowerShell transcription for security auditing:

```powershell
# Add to profile for automatic logging
Start-Transcript -Path "$env:USERPROFILE\Documents\PSTranscripts\$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
```

## Troubleshooting Common Issues

### PowerShell Profile Not Loading

1. Check profile path:

   ```powershell
   $PROFILE
   Test-Path $PROFILE
   ```

2. Verify execution policy allows scripts

3. Ensure profile file has correct encoding

### CMD Customization Not Working

1. Verify registry key:

   ```cmd
   reg query "HKCU\Software\Microsoft\Command Processor" /v AutoRun
   ```

2. Check batch file path is correct

3. Ensure no syntax errors in batch file

### Color Codes Not Displaying

For modern Windows 10/11, enable ANSI color support:

```cmd
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1
```

## Conclusion

A well-configured command line environment is essential for efficient security operations and system administration. These customizations provide:

- **Enhanced Productivity**: Quick access to security tools and information
- **Better Visibility**: Clear indication of privilege levels and system state
- **Professional Appearance**: Clean, organized interface for daily work
- **Flexibility**: Works across different Windows environments

Whether you're using PowerShell or CMD, these configurations create a personalized, security-focused workspace that adapts to your workflow. The modular approach allows you to add or modify features as your needs evolve, ensuring your command line environment remains an effective tool in your security arsenal.

Remember to regularly update your profiles with new functions and utilities as you discover useful patterns in your daily work. A personalized command line is not just about aesthetics—it's about creating an efficient, secure workspace tailored to your specific needs.
