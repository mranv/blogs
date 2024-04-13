---
author: Anubhav Gain
pubDatetime: 2023-12-06T13:59:00+05:30
modDatetime: 2023-12-06T13:59:00+05:30
title: Active Directory Setup on Windows Server 2019
slug: active-directory-setup-windows-server-2019
featured: true
draft: false
tags:
  - Windows Server 2019
  - Active Directory
description: Guide to setting up Active Directory on Windows Server 2019, including PowerShell commands for OU management.
---

# Windows Server 2019 - Active Directory Setup

<img alt="Shanghai, China" src="/assets/images/photo-f454_gf45g4e3ff-39d029f9c439d01297de3c91be9e0401.jpg" width="1500" height="674">

### Organizing Objects with Organization Units (OU)

The main task for Active Directory is to group objects such as users, groups, contacts, computers, printers, and shared folders into Organization Units (OU) and manage access rights for each object.

#### Organization Unit Structure

- **Organization Unit:** Main unit for grouping objects.
- **Sub-OU:** Sub-unit within an Organization Unit.
- **Group:** Group of objects (e.g., Users).

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_01-68618a49da624b7d08a2d9eab602b6d5.png" width="1085" height="576">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_02-58f941abcb393e4368d80c603c09e39d.png" width="1085" height="545">

### User Account Management

Begin by mapping the company structure in units, sub-units, and groups within Active Directory.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_03-b2a668be47e958881859e7d65fd403db.png" width="1086" height="572">

1. Create Organization Units:

   - When creating an OU, consider protecting it from accidental deletion. If protection is enabled, PowerShell commands are required to remove it.
   - Example PowerShell command to remove protection and delete an OU:
     ```powershell
     Get-ADOrganizationalUnit -Identity 'OU=Cloud,OU=INSTAR_Shenzhen,OU=INSTAR,DC=instar,DC=local' | Set-ADObject -ProtectedFromAccidentalDeletion:$false -PassThru | Remove-ADOrganizationalUnit -Confirm:$false
     ```

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_04-9c104b05df374e7d66a4f5294fd6576f.png" width="1089" height="707">

2. Finish the hierarchy by adding groups and users to map structures based on offices, projects, etc.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_05-b8c6b181efad688420321f72c4ac5b5a.png" width="1087" height="573">

This setup allows for efficient organization and management of objects within Active Directory.
