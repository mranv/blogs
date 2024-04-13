---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:36:00Z
modDatetime: 2024-04-13T08:36:00Z
title: Getting Started with Windows Server 2019
slug: getting-started-with-windows-server-2019
featured: true
draft: false
tags:
  - Windows Server 2019
  - windows admin center
  - user accounts
  - IIS
  - FTP
description: A guide to getting started with Windows Server 2019, including setting up user accounts, an IIS web server, and adding a static website.
---

# Getting Started with Windows Server 2019

<img alt="Central, Hong Kong" src="/assets/images/photo-45fdsfd6d_64567fh6drethg4_d-4d834f04f1162992a571b929f1ee839f.jpg" width="1500" height="756">

### Windows Admin Center

Windows Admin Center is a browser-based app for managing servers, clusters, and Windows 10 PCs. Download and install it. Open Admin Center Dashboard in your browser.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_01-30cc72cacfc2e2d0fdbed336657d6fe2.png" width="1272" height="262">

Click on Add > Add Windows Server. Enter the server name, login credentials, and add the server.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_02-c439caabbbcfda7e0f2e0061c42c2f1c.png" width="1024" height="307">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_04-5e4df77fe5ffa5598e9331188cdfe545.png" width="1275" height="735">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_05-fa13df324ceadbbcf16ee9b55f924bd0.png" width="1270" height="290">

Your server will now show up under All connections. Click on it to open the Server Management Dashboard.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_06-5937bd867bffedbadd1b77a4a222d52b.png" width="1274" height="486">

### Setting up User Accounts

Search for Local users & groups under Tools. Click on Add to create a new user account. Manage Membership to add the new user to necessary Groups.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_07-2478912068cd9c8c04b378c852ecd14d.png" width="1279" height="449">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_08-4f2b176bb245f3c369441b4ce5cddb66.png" width="1277" height="531">

### Setting up an IIS Webserver

Search for Roles & features under Tools. Add the Webserver (IIS) role to your server.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_09-92e2acaa62888b5eef5344ae6f64e7ac.png" width="1277" height="519">

Open the IP address of your Windows Server in your browser to view the default IIS start page.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_10-96cc14ca5722d66d826070c7818cdb1d.png" width="1267" height="607">

### Adding your own static website

Open Server Manager and access Internet Information Services (IIS) Manager. Right-click Sites to add your FTP Site.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_11-f989155e674180eee19add5b48d70b77.png" width="1109" height="430">

Configure FTP site settings and authentication. Ensure Windows Firewall does not block the FTP service.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_12-65f37eb7a55d1a7f3ca3192134131fd9.png" width="1112" height="369">

In IIS Manager, add FTP Authorization Rules and specify access for ftpuser.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_13-5df7ad6761fa24695ff97f409602e008.png" width="1116" height="662">

Restart the FTP Service from the Services Manager.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_21-66dac1a702c7510bf444e425e78049dc.png" width="803" height="551">

Ensure FTP User has full control over the directory. Upload your static website content to the FTP site directory.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_22-c4ff7cf990c88d424123010dd637b056.png" width="1179" height="211">

To allow .webp images, add the MIME Type in IIS Manager.

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_25-cd5e18d879486c218b5811e9a82b2e91.png" width="1116" height="778">

<img alt="Windows Server 2019" src="/assets/images/Windows_Server_2019_26-ff0c41b3e18c6ba2010823f221019b5d.png" width="1159" height="500">
