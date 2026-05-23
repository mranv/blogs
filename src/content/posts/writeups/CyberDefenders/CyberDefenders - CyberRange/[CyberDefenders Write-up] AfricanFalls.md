---
title: 'CyberDefenders Write-up AfricanFalls'
author: Anubhav Gain
category: CyberDefenders - CyberRange
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.883Z
slug: cyberdefenders-write-up-africanfalls
tags:
- cyberdefenders
---cyberrange
- cyberdefenders
- cyberdefenders-write-up-africanfalls
title: 'CyberDefenders Write up AfricanFalls'
---
# [CyberDefenders - AfricanFalls](https://cyberdefenders.org/blueteam-ctf-challenges/africanfalls/)
Created: 02/05/2024 00:35
Last Updated: 13/06/2024 08:47
* * *
>Category: Endpoint Forensics
>Tags: Disk Forensic, Eric Zimmerman's Tools, FTK Imager, Autopsy, Mimikatz, ShellBags Explorer, BrowsingHistoryView, WinPrefetchView, Metdata Extractor, Rifiuti2, Tor, T1005
* * *
John Doe was accused of doing illegal activities. A disk image of his laptop was taken. Your task as a soc analyst is to analyze the image and understand what happened under the hood.

**Tools**:
- [FTK Imager](https://accessdata.com/product-download/ftk-imager-version-4-5)
- [Autopsy](https://www.autopsy.com/download/)
- [rifiuti2](https://abelcheung.github.io/rifiuti2/)
- [Browsing History View](https://www.nirsoft.net/utils/browsing_history_view.html)
- [WinPrefetchView](https://www.nirsoft.net/utils/win_prefetch_view.html)
- [ShellBagsExplorer](https://f001.backblazeb2.com/file/EricZimmermanTools/ShellBagsExplorer.zip)
- [mimikatz](https://github.com/gentilkiwi/mimikatz/wiki)
- [Metdata Extractor](http://exif.regex.info/exif.cgi)
- [Online Hash Crack](https://www.onlinehashcrack.com/)
- [NTLM Hash](https://hashes.com/en/decrypt/hash)
* * *
## Questions
> Q1: What is the MD5 hash value of the suspect disk?

![9c295bd43c9b138d06afd35e1411132c.png](/assets/resources-writeups/9c295bd43c9b138d06afd35e1411132c.avif)
An evidence file was created using FTK Imager, which came with log file that also has MD5 checksum
```
9471e69c95d8909ae60ddff30d50ffa1
```

> Q2: What phrase did the suspect search for on 2021-04-29 18:17:38 UTC? (three words, two spaces in between)

Windows Search is the first thing that came in mind but I didn't find any artifact
![eb634436e2396a869f60e3f6a6ee6607.png](/assets/resources-writeups/eb634436e2396a869f60e3f6a6ee6607.avif)
But there are several browsers installed on this system, the first one we gonna look at is Chrome History so if user searching something on Google, it will be logged in `History` file
![4dad8b71b3ea3ae87deede76f059f370.png](/assets/resources-writeups/4dad8b71b3ea3ae87deede76f059f370.avif)
Using ChromeHistoryView from NirSoft to parse all data
![2c075df83c15d539352586c7bbc0f4c0.png](/assets/resources-writeups/2c075df83c15d539352586c7bbc0f4c0.avif)
Go to Options then check for "Show Time In GMT" then sort by "Visited On", you will find the exact time and keyword that was used to search on Google
```
password cracking lists
```

> Q3: What is the IPv4 address of the FTP server the suspect connected to?

![1448d37d68ff38eefcf17ef996209475.png](/assets/resources-writeups/1448d37d68ff38eefcf17ef996209475.avif)	
After doing some recon on suspected disk I found that FireZilla was installed on this system so I went to `Roaming\FileZilla` to grab `recentservers.xml` which store an information about the lastest server FileZilla was connected to
```
192.168.1.20
```

> Q4: What date and time was a password list deleted in UTC? (YYYY-MM-DD HH:MM:SS UTC)

![a6e54a6edb3898ce195f47e5d78c4cec.png](/assets/resources-writeups/a6e54a6edb3898ce195f47e5d78c4cec.avif)
A file that was deleted supposed to be in Recycle Bin so I went to Recycle Bin then after figure it out which SID associated with John Doe, I finally found the password list that was deleted

$I file is metadata of the actual file that will be created when a file is deleted so we will copy it date and change it to UTC
```
2021-04-29 18:22:17 UTC
```

> Q5: How many times was Tor Browser ran on the suspect's computer? (number only)

![e6caaa67fdeb7cd65a84e16420cb7bc6.png](/assets/resources-writeups/e6caaa67fdeb7cd65a84e16420cb7bc6.avif)
Prefetch is an artifact that was created when a program is loading then it can be fetch later faster and the one we're looking for is `tor.exe.*.pf` but I didn't find any of it, only the installer which could mean that Tor only got installed but not launch even once
![2e5ee81f2a0c3109a18bf38aa074e8a4.png](/assets/resources-writeups/2e5ee81f2a0c3109a18bf38aa074e8a4.avif)
We can also export prefetch folder and use PECmd from EZ Tools Suite to parse all prefetchs with this command `PECmd -d \Prefetch --json prefetch.json`
![7f6fe386fb0668ca3296f63815ed34d6.png](/assets/resources-writeups/7f6fe386fb0668ca3296f63815ed34d6.avif)
Use Timeline Explorer from EZ Tools Suite to open an output from PECmd and find for Tor executable file and There is no result
![9ed304d492c4310746a1b3a9a966caf0.png](/assets/resources-writeups/9ed304d492c4310746a1b3a9a966caf0.avif)
Only TOR that was found is the installer 
```
0
```

> Q6: What is the suspect's email address?

I did not find any outlook artifact or any ost file 
![ad0c1ad170af19f5ba36d544e5585509.png](/assets/resources-writeups/ad0c1ad170af19f5ba36d544e5585509.avif)
but luckily on Chrome Browser History, user visited protonmail and it also logged an email of suspicious email 
```
dreammaker82@protonmail.com
```

> Q7: What is the FQDN did the suspect port scan?

On John Doe's Desktop, I found nmap/zenmap shortcut which mean user using this tool to conduct port scan activity but sadly I do not know any artifact related to port scanning
![8049e6c34237ff2b2e315720d493de5d.png](/assets/resources-writeups/8049e6c34237ff2b2e315720d493de5d.avif)
I took a hint and found that PowerShell History can be used to solve this challenge which you can see that user conducted port scanning using PowerShell and the only Domain that was scanned is `dfir.science`
```
dfir.science
```

> Q8: What country was picture "20210429_152043.jpg" allegedly taken in?

![ef0814b84d48b1d8a13437d138e3761a.png](/assets/resources-writeups/ef0814b84d48b1d8a13437d138e3761a.avif)
After searching through user directory, I found several images inside Contact folder 
![0a6cd25427d3d8c8290d887496c5323d.png](/assets/resources-writeups/0a6cd25427d3d8c8290d887496c5323d.avif)
Use Exiftool to display metadata of this image which also have GPS Coordinate when this image was taken then we can use https://www.gps-coordinates.net/ to find out where it is
![df947db10362722b81bcbee4889f5703.png](/assets/resources-writeups/df947db10362722b81bcbee4889f5703.avif)
```
Zambia
```

> Q9: What is the parent folder name picture "20210429_151535.jpg" was in before the suspect copy it to "contact" folder on his desktop?

The artifact related to folder change is ShellBags that stored inside HKCU `UsrClass.dat` hive
![65b28e2e92ddfb2917f09d40f1f7fb36.png](/assets/resources-writeups/65b28e2e92ddfb2917f09d40f1f7fb36.avif)
Export it
![0bc95f54d59d93ce436a9a2ff0dae8f0.png](/assets/resources-writeups/0bc95f54d59d93ce436a9a2ff0dae8f0.avif)
Then use ShellBags Explorer to parse registry hive(don't forget to hold SHIFT to parse dirty hive) then you can see that only directory related to Picture is Camera from LG Q7  
![656950481e6738b77591488114c6a1d5.png](/assets/resources-writeups/656950481e6738b77591488114c6a1d5.avif)
I went back to an image and using Exiftool, we can see Camera model that shooting this image
![95f5cdbf7a4ba198a12845d8c52f4698.png](/assets/resources-writeups/95f5cdbf7a4ba198a12845d8c52f4698.avif)
And it's manufacture so to put it simply, user took photos using this camera and then plugged in to this system which all images was transferred to Contact folder
```
Camera
```

> Q10: A Windows password hashes for an account are below. What is the user's password? Anon:1001:aad3b435b51404eeaad3b435b51404ee:3DE1A36F6DDB8E036DFD75E8E20C4AF4:::

![87010ad5bd0d4cc1aed941334cb62e50.png](/assets/resources-writeups/87010ad5bd0d4cc1aed941334cb62e50.avif)
Using [Hashes.com](https://hashes.com/en/decrypt/hash) we got a password for this user
```
AFR1CA!
```

> Q11: What is the user "John Doe's" Windows login password?

First we need to dump NTML hash from this disk and a tool we will use to dump is mimikatz which is a the popular tool for credential dumping using by sevaral hackers and APTs 
![d3ea514d1d8ba425d6225f681a265934.png](/assets/resources-writeups/d3ea514d1d8ba425d6225f681a265934.avif)
We also need to export SAM and SYSTEM hives
![d978a5e5a2eb831b520c50142bc3be35.png](/assets/resources-writeups/d978a5e5a2eb831b520c50142bc3be35.avif)
Then executed mimikatz then using this command `lsadump::sam /system:SYSTEM /sam:SAM` to dump NTLM hashes
![22340fd93bb85ad8281d8922e6a43321.png](/assets/resources-writeups/22340fd93bb85ad8281d8922e6a43321.avif)
We got one
![6f2f46b24d9086e28e21aa39c2116880.png](/assets/resources-writeups/6f2f46b24d9086e28e21aa39c2116880.avif)
Using hashes.com to de-hash
```
ctf2021
```

![7805098918a5a29a0c7a4504fa5b0715.png](/assets/resources-writeups/7805098918a5a29a0c7a4504fa5b0715.avif)
* * *
