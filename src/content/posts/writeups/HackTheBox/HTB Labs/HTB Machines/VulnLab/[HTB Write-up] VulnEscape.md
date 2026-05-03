---
author: Anubhav Gain
category: VulnLab
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.911Z
slug: htb-write-up-vulnescape
tags:
- vulnlab
- hackthebox
- htb-labs
- htb-machines
- htb-write-up-vulnescape
title: 'HTB Write up VulnEscape'
---
# [HackTheBox - VulnEscape](https://app.hackthebox.com/machines/VulnEscape)

![9869a71153cbce4a9c949d997e45a9be.png](/assets/resources-writeups/9869a71153cbce4a9c949d997e45a9be.avif)

## Table of Contents

- [Abstract](#abstract)
- [Enumeration](#enumeration)
- [Initial Access with RDP](#initial-access-with-rdp)
- [Kiosk Breakout to CMD with another MS Edge browser](#kiosk-breakout-to-cmd-with-another-ms-edge-browser)
- [Password unmasking to obtain admin password](#password-unmasking-to-obtain-admin-password)
- [Privilege Escalation to admin user](#privilege-escalation-to-admin-user)

***
## Abstract
VulnEscape is a vulnlab machine imported to HackTheBox as a Easy Windows box. I started with network enumeration with nmap, revealing only RDP port running on the target.

I connected to the target with rdesktop which reveals that this box was setup as kiosk machine and I can login as "kioskuser0" without any password to 

I escaped kiosk mode by spawning new Microsoft Edge instance that let me download `cmd.exe` with file protocol which I rename it to `msedge.exe` to execute and get the command prompt on the box.

Then I discovered Remote Desktop Plus profile which I used Kernel Password Unmask to reveals password of "admin" user in the Remote Desktop Plus application and finally obtain a shell as admin user.

The admin user is in the Administrators group so I started another powershell process with UAC prompt and finally obtain full privileges of this user and root the box.

## Enumeration

I start with nmap enumeration as always and as we can see that there is only a single RDP port exposed on this box.

![e50dc23737164283600a67dba73daaef.png](/assets/resources-writeups/e50dc23737164283600a67dba73daaef.avif)

## Initial Access with RDP

Since I don't have any credential to work on, I will use `rdesktop` to connect to the box which I discover the username I can use right away upon connecting to the box.

```
rdesktop $IP
```
![ac272e6886df58b9996c20b86cae1171.png](/assets/resources-writeups/ac272e6886df58b9996c20b86cae1171.avif)

I will login as "KioskUser0" which do not required any password and once I'm in, I can see the display image of a good view and a text in the middle of "Busan Expo" so this machine was setup kiosk mode on KioskUser0 to display specific webpage in Microsoft Edge.

![1f3714b4aa92fad0bb459214484170bd.png](/assets/resources-writeups/1f3714b4aa92fad0bb459214484170bd.avif)

There are couple of way to escape from this restrict environment and first is to press "Windows" button which will open Start Menu.

![d5257c19034104dfddaf4d33ec3d1f57.png](/assets/resources-writeups/d5257c19034104dfddaf4d33ec3d1f57.avif)

On this start menu, I try to run `cmd.exe` but It could not be launched because it was configured to run only `msedge.exe` in kiosk environment.

![da37f801c7c3993482f936d8aa0dd359.png](/assets/resources-writeups/da37f801c7c3993482f936d8aa0dd359.avif)

## Kiosk Breakout to CMD with another MS Edge browser

I will open another Microsoft Edge instance which will pop up new edge browser but this time, I have access to url bar and several feature of the browser.

![c9700d265ea174f93f04f4d8f52298ec.png](/assets/resources-writeups/c9700d265ea174f93f04f4d8f52298ec.avif)

But the new browser instance will also restricted which I can not access other folder beside "Downloads" folder of "KioskUser0" user if I open file explorer windows from "Open", "Save" or even spawn new file explorer so I will use file protocol (`file:\\C:`) to access the file system as seen in the image below 

![879280d62835a725eba9172d6a3fbda1.png](/assets/resources-writeups/879280d62835a725eba9172d6a3fbda1.avif)

Now I will download `cmd.exe` from `file:\\C:\Windows\System32` to the downloads folder that I can access

![77f8435ba9f1265b4a277e46802fb846.png](/assets/resources-writeups/77f8435ba9f1265b4a277e46802fb846.avif)

This cmd will not be able to run if I don't change the name to `msedge.exe`.

![6a4463874576bf9be0725e8a065c9604.png](/assets/resources-writeups/6a4463874576bf9be0725e8a065c9604.avif)

So I change the name of `cmd.exe` to `msedge.exe` and now I can finally execute it as a new command prompt window pop-up in the full screen but in this command prompt. there are multiple errors message display along with the result of any command I type. (probably because of `cmd.exe` run outside from the standard environment and even changed its name)

![64429c6645dc80f729785b9616fdbcf8.png](/assets/resources-writeups/64429c6645dc80f729785b9616fdbcf8.avif)

So I will change it to PowerShell since the restriction could not affect here and now all of the output will not have any error messages eariler.

![f06480d90160780684460cbbc48ef5f3.png](/assets/resources-writeups/f06480d90160780684460cbbc48ef5f3.avif)

Now I can grab the flag on the desktop of "KioskUser0" user.

![a5a2d6c048ea090540f1c51cb6e15dd6.png](/assets/resources-writeups/a5a2d6c048ea090540f1c51cb6e15dd6.avif)

## Password unmasking to obtain admin password

After exploring the file system, I discover `_admin` folder located at the root of C drive and it contains `profiles.xml` inside of it.

![eb36369b9bc79028f6859add9525c46a.png](/assets/resources-writeups/eb36369b9bc79028f6859add9525c46a.avif)

This profile contains encrypted password of "admin" user and it can be used with "Remote Desktop Plus" application so I will find this software and import this profile to see if I can obtain cleartext password.

![6bebf7358321b759a3fbe847c1a44293.png](/assets/resources-writeups/6bebf7358321b759a3fbe847c1a44293.avif)

After exploring the file system again, I found "Remote Desktop Plus" installation folder inside "Program Files (x86)" folder.

![41ee407f443deb937b58a4989d412340.png](/assets/resources-writeups/41ee407f443deb937b58a4989d412340.avif)

I will execute `rdp.exe` inside this folder to open Remote Desktop Plus.

![4f3aae1f4c8123e9167202ea2c1265ef.png](/assets/resources-writeups/4f3aae1f4c8123e9167202ea2c1265ef.avif)

Now I will import the profile, I found in `_admin` folder into this application.

![7144eb1d9b674b04b33320bad638cf11.png](/assets/resources-writeups/7144eb1d9b674b04b33320bad638cf11.avif)

Well look like I still could not access to other folder using File Explorer so I will need to copy the file to Downloads folder so I can import from there.

![bffd6cfb21cd707a2a13700dadf6dcc8.png](/assets/resources-writeups/bffd6cfb21cd707a2a13700dadf6dcc8.avif)

Copy the file to Downloads folder of kioskUser0 user.

```
cp C:\_admin\profiles.xml C:\Users\kioskUser0\Downloads\
```
![9d060af00e6a63ea0bcf0f50bf4f5c5c.png](/assets/resources-writeups/9d060af00e6a63ea0bcf0f50bf4f5c5c.avif)

Now I can import this profile.

![f27050e62e46400d9194d347534e88cb.png](/assets/resources-writeups/f27050e62e46400d9194d347534e88cb.avif)

Sadly the password is still marked inside this application so I will need a way to reveal it in cleartext.

![99924a56814cba1463c18acd2a9c26f5.png](/assets/resources-writeups/99924a56814cba1463c18acd2a9c26f5.avif)

First software I think of is the [BulletsPassView](https://www.nirsoft.net/utils/bullets_password_view.html) from Nirsoft so I download it to the box and execute it.

![f9484cc58e068972b9123fe07aafa913.png](/assets/resources-writeups/f9484cc58e068972b9123fe07aafa913.avif)

For some reason, It did not recognize the password in Remote Desktop Plus so I will resort with another software.

![d6e3a376c16b29d902a4e6512c4fc8f4.png](/assets/resources-writeups/d6e3a376c16b29d902a4e6512c4fc8f4.avif)

The next software I will utilize is [Kernel Password Unmask](https://www.nucleustechnologies.com/Unmask-Password-Show-Reveal-Stars.html) that can also unmask the password in GUI application like Remote Desktop Plus.

![a3041ac9e553a7209158f84a6921d536.png](/assets/resources-writeups/a3041ac9e553a7209158f84a6921d536.avif)

## Privilege Escalation to admin user

After open the program, I start Remote Desktop Plus again and this time I can finally see the password of admin account (Twisting3021)

![372b97e504e81262e7dff7d629571419.png](/assets/resources-writeups/372b97e504e81262e7dff7d629571419.avif)

I will use runas command to start a new powershell process in "admin" user context and I found that this user is in the member of Administrators group which I can spawn a new process again to trigger UAC and have full privilege as Administrator.

```
runas /user:admin powershell
``` 

![45df07dcf958d038fbd207430cd51327.png](/assets/resources-writeups/45df07dcf958d038fbd207430cd51327.avif)

I will use `-Verb runas` flag of `Start-Process` cmdlet to spawn PowerShell in administrative context which trigger UAC to prompt.

```
Start-Process powershell -Verb runas
```

![2f8dc819396ff16c1f715d7b3b158c2f.png](/assets/resources-writeups/2f8dc819396ff16c1f715d7b3b158c2f.avif)

And now I finally have full privilege administrator shell to get the root flag.

![781c910db8c7a035527ebb036a5a1db9.png](/assets/resources-writeups/781c910db8c7a035527ebb036a5a1db9.avif)

![cdd6a1e764cfbc04b496a47c8ca29a74.png](/assets/resources-writeups/cdd6a1e764cfbc04b496a47c8ca29a74.avif)

The root flag is located on the desktop of administrator user and I successfully root the box :D

![347a7ca811d8e01bc954913ad49bbdef.png](/assets/resources-writeups/347a7ca811d8e01bc954913ad49bbdef.avif)

![77222dec6336f37377c676c3fe3a0d12.png](/assets/resources-writeups/77222dec6336f37377c676c3fe3a0d12.avif)

https://labs.hackthebox.com/achievement/machine/1438364/678
***