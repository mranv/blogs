---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:38:00Z
modDatetime: 2024-04-13T08:38:00Z
title: Windows Control
slug: windows-control
featured: true
draft: false
tags:
  - windows
  - windows updates
  - auto-reboot
description: Venting frustrations and providing solutions for managing Windows features.
---

# Windows Control

<img alt="Hokkaido, Abashiri" src="/assets/images/photo-11627014666_359f04f9db_o-eb75fa1b8907b3fff51ab57698159410.png" width="1500" height="613">

Welcome to my Angry-Blog, where I unleash my frustrations about undesired Windows features. Be warned, colorful language ahead!

### Prevent Auto-Reboot

Windows Updates often require a reboot, but Windows doesn't handle this gracefully. Here's how to prevent auto-reboot:

1. **Task Scheduler Method**:
   - Open Start and search for Task Scheduler.
   - Right-click the Reboot task, go to Properties, and navigate to the Triggers tab.
   - Uncheck "Enabled" and confirm.

<img alt="Windows 10 Whisperer" src="/assets/images/win10_01-50f11d660df10ed80f0f43dc5452555a.png" width="1008" height="597">

<img alt="Windows 10 Whisperer" src="/assets/images/win10_02-2bc2c06d3cb27971556c709567b95496.png" width="1006" height="594">

<img alt="Windows 10 Whisperer" src="/assets/images/win10_03-46f472472d3ec1781208d46e663277bb.png" width="1006" height="596">

2. **Alternative Method**:
   - Use Run (Windows key + R) and type `%windir%\System32\Tasks\Microsoft\Windows\UpdateOrchestrator`.
   - Rename the Reboot file to Reboot.bak and create a folder called Reboot.

<img alt="Windows 10 Whisperer" src="/assets/images/win10_04-92f8d40eb6578595b7005bc8da212c12.png" width="1002" height="590">

However, some users might encounter permission issues while attempting these steps.

<img alt="Windows 10 Whisperer" src="/assets/images/win10_05-8322e540a492c0a546aeb77583a105b0.png" width="1003" height="590">

<img alt="Windows 10 Whisperer" src="/assets/images/win10_06-26d0ecc46ccad6ff73f4a28229187295.png" width="1006" height="594">

<img alt="Windows 10 Whisperer" src="/assets/images/win10_07-0769cd7a98c6fb504b5b1a8e7fb1c16c.png" width="961" height="576">

### Making Room for an Update

Temporarily deactivate hibernation to allow updates to run smoothly:

```powershell
powercfg -h off
powercfg -h on
```

<img alt="Windows 10 Whisperer" src="/assets/images/win10_08-ce9376706be2534598beef79a4f3f32e.png" width="961" height="571">

This will delete the hiberfil.sys file from your C drive.
