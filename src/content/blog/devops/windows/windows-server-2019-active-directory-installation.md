---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:32:00Z
modDatetime: 2024-04-13T08:32:00Z
title: Windows Server 2019 - Active Directory Installation
slug: windows-server-2019-active-directory-installation
featured: true
draft: false
tags:
  - Windows Server 2019
  - active directory
  - installation
description: Step-by-step guide for installing Active Directory on Windows Server 2019.
---

# Windows Server 2019 - Active Directory Installation

<img alt="Shanghai, China" src="/assets/images/photo-f454_gf45g4e3ff-58b1f03e072141e5c9118a76435bb93f.png" width="1500" height="766">

### Prerequisites

To set up Active Directory on our domain controller, we need to complete the following prerequisites:

1. **DNS service**: Ensure a DNS service is set up.
2. **Static IP address**: Assign a static IP address to the server.
3. **Domain controller name**: Choose a name for the domain controller that can be resolved by the DNS service.
4. **NetBIOS Domain Name**: Define a NetBIOS Domain Name that will be prepended to every username on login.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_01-822b0244ea4658f3ba1d7402c4c41eed.png" width="876" height="709">

#### Installation

Let's begin by configuring a static IP address:

- Navigate to Network & Internet settings.
- Click on Change adapter options > Properties.
- Configure the Internet Protocol Version 4 settings with an available IP address from your local network.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_02-bdd0556bb69e683ec979437ecad1719a.png" width="1045" height="410">

Next, add Active Directory to the domain controller:

- Open Server Manager and click on Add roles and features.
- Check Active Directory Domain Services and click on Add Features.
- Similarly, add the DNS Server.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_03-1af4efd23ad5afde90c5a75edec48f0d.png" width="1043" height="548">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_04-66219f9465bb9c8d1f1b0fc4417223a3.png" width="1068" height="553">

Proceed by clicking Next until you reach the Confirmation tab, then click Install.
After installation, navigate back to Server Manager and promote your server to Domain Controller.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_05-fcd7a371a33277e158ec9aac9a06b9a8.png" width="1042" height="332">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_06-f31f33129100bd1b340a3b90f9a4cc9a.png" width="1041" height="630">

Choose a Domain Name and set a Directory Service Restore Mode (DSRM) password.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_07-db5fa7592cabf91b6ac0e214fb1f2af0.png" width="1042" height="628">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_08-f8d5f4304f78badccf4642cf3e7b5884.png" width="1044" height="391">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_10-57e5dbd58b89ced138695464d9d0a2ad.png" width="1029" height="391">

Continue clicking Next, making changes only if desired, and finally hit Install when the Prerequisite Check gives a green light.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_11-516e477e182cdbec5a3c80ab27981157.png" width="1085" height="539">

Your server will restart automatically upon completion. Reconnect to your server afterward.

Verify the successful installation of Active Directory:

- Check for Active Directory Administrative Center in the start menu.
- Search for DNS in the start menu to access DNS Manager.
- Perform a quick ping to ensure correct server name resolution.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_12-b57b22ab8d848171641b7a509befe54a.png" width="1084" height="522">
