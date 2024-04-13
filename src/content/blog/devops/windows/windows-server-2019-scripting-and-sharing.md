---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:34:00Z
modDatetime: 2024-04-13T08:34:00Z
title: Windows Server 2019 - Scripting and Sharing
slug: windows-server-2019-scripting-and-sharing
featured: true
draft: false
tags:
  - Windows Server 2019
  - powershell
  - scripting
  - sharing
description: Guide for scripting tasks and setting up sharing on Windows Server 2019.
---

# Windows Server 2019 - Scripting and Sharing

<img alt="Wan Chai, Hong Kong" src="/assets/images/photo-fd6d_gj62544ethg4_d-4d3b4974f45b02cf184cd6862b4ce29a.jpg" width="1500" height="654">

### Windows PowerShell

Microsoft Windows PowerShell can be accessed directly from the Windows Admin Center. Connect to your Windows Server via Admin Center and find PowerShell under Tools. Log in with your account.

### Running PowerShell Commands

Execute PowerShell commands directly from the web interface. For example, create a new user with `New-LocalUser -Name Peter`.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_01-a9e607eb3e0ddc1d06d34519b4dc9bec.png" width="1273" height="792">

Search for Local user & groups under tools in Admin Center and open user management in a new tab to see the created user.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_02-97a720a8e3b8902ac795d203cdd64e7d.png" width="1275" height="392">

Working with the filesystem follows similar steps. Use commands like `Get-ChildItem`, `New-Item`, `Copy-Item`, and `Remove-Item`.

```powershell
Get-ChildItem -Path C:\
New-Item -Path 'C:\scripts' -ItemType Directory
New-Item -Path 'C:\scripts\test' -ItemType Directory
New-Item -Path 'C:\scripts\test\helloworld.ps1' -ItemType File
Copy-Item -Path 'C:\scripts\test\helloworld.ps1' -Destination 'C:\scripts\hello.ps1'
Remove-Item -Path 'C:\scripts\test\helloworld.ps1'
```

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_03-c59739b1bcef07c3c1f4d9361be5e817.png" width="1273" height="953">

Run commands to view processes and services:

```powershell
Get-Process
Get-Service
```

### PowerShell Scripting

Run local shell scripts through PowerShell. Store scripts with the .ps1 extension. Here's an example script:

```powershell
echo 'Hello World'
sleep 10
```

Save as helloworld.ps1, navigate to the directory, and run the script as `.\helloworld.ps1`.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_04-f07efae32e6074f9e87e1d22cc8897cb.png" width="1287" height="413">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_05-79dfdeefc1db5949cccce2b19c988419.png" width="1274" height="491">

### Creating a Samba Share

Enable Remote Desktop on the server. Add a Desktop on your host machine in Remote Desktop. Connect to the remote server using the server name or IP address.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_06-ead147e272159a1bb2305aee88365596.png" width="1275" height="348">

Right-click the directory to share, choose Properties, Sharing, Advanced Sharing. Name the share and set Permissions.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_07-34be4f6e32b14658e3777cf61a4e02fa.png" width="1196" height="666">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_08-5bbbb7f5f6ac79d5834c9a3e49875068.png" width="1197" height="408">

Discover the share from your host machine and connect using specified user login.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_11-562cfc2daf31235deda594561b5f6c35.png" width="1124" height="627">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_12-38d8fcf258620036402aaf06d1ab5d87.png" width="1120" height="628">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_14-4386fd314caa7f225ca7c79d299522e5.png" width="1123" height="629">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_15-1528d206810188971ee9fa34f4d2cb95.png" width="1124" height="631">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_16-62402880b516cf16e493917349cb9b5a.png" width="867" height="382">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_17-3e1848f51b1efba781d07a69207dd9a8.png" width="1198" height="740">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_18-d1ddfa78e93d68016505cec72cbb8df2.png" width="1193" height="742">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_19-3db238095611d7e49c2444bd53cb2173.png" width="1194" height="731">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_20-d544555777f5d3d8f608377be4d8fe9e.png" width="1192" height="743">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_21-b973c221f4683854ed43e1eb239cfbad.png" width="1196" height="741">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_22-1ddab52487ced9fedcb07e8102f965ec.png" width="1199" height="608">
