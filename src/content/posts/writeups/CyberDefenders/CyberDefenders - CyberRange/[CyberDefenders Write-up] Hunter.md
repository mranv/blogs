---
author: Anubhav Gain
category: CyberDefenders - CyberRange
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.891Z
slug: cyberdefenders-write-up-hunter
tags:
- cyberdefenders---cyberrange
- cyberdefenders
- cyberdefenders-write-up-hunter
title: 'CyberDefenders Write up Hunter'
---
# [CyberDefenders - Hunter](https://cyberdefenders.org/blueteam-ctf-challenges/hunter/)
## Table of Contents

- [Scenario](#scenario)
- [Questions](#questions)

* * *
## Scenario
**Case Overview**:
The SOC team got an alert regarding some illegal port scanning activity coming from an employee's system. The employee was not authorized to do any port scanning or any offensive hacking activity within the network. The employee claimed that he had no idea about that, and it is probably a malware acting on his behalf. The IR team managed to respond immediately and take a full forensic image of the user's system to perform some investigations.

There is a theory that the user intentionally installed illegal applications to do port scanning and maybe other things. He was probably planning for something bigger, far beyond a port scanning!

It all began when the user asked for a salary raise that was rejected. After that, his behavior was abnormal and different. The suspect is believed to have weak technical skills, and there might be an outsider helping him!

Your objective as a soc analyst is to analyze the image and to either confirm or deny this theory.

**Category**: Endpoint Forensics

**Tools**:
- [AccessData_FTK_Imager](https://accessdata.com/product-download/ftk-imager-version-4-3-1-1)
- [Registry Explorer/RECmd](https://ericzimmerman.github.io/#!index.md)
- [Reg Ripper "Windows"](https://github.com/keydet89/RegRipper3.0)
- [Reg Ripper "Linux"](https://tools.kali.org/forensics/regripper)
- [DCode](https://www.digital-detective.net/dcode/)
- [ShellBags Explorer](https://ericzimmerman.github.io/#!index.md)
- [DB Browser for SQLlite](https://sqlitebrowser.org/dl/)
- [WinPrefetchView](https://www.nirsoft.net/utils/win_prefetch_view.html)
- [JumpList Explorer](https://ericzimmerman.github.io/#!index.md)
- [010 Editor](https://www.sweetscape.com/download/010editor/)
- [SysTools Outlook PST Viewer 4.5.0.0.](https://www.majorgeeks.com/mg/getmirror/systools_outlook_pst_viewer,1.html)
- [Autopsy](https://www.autopsy.com/download/)
- [Hindsight](https://github.com/obsidianforensics/hindsight)
- [Arsenal Image Mounter](https://arsenalrecon.com/downloads/) 
- [LinkParser v1.3](https://4discovery.com/our-tools/link-parser/)
* * *
## Questions
> Q1: What is the computer name of the suspect machine?

![4f981334c213e3b36d0e9ecad4e546d2.png](/assets/resources-writeups/4f981334c213e3b36d0e9ecad4e546d2.avif)

First thing that came to my mind is this registry key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName` that hold an information about a computer including its name

So we need to extract SYSTEM hive 

![28655c2ba8e5db054d1463e60c7baa73.png](/assets/resources-writeups/28655c2ba8e5db054d1463e60c7baa73.avif)

Then use whatever registry tool, you prefered to inspect this key
```
4ORENSICS
```

> Q2: What is the computer IP?

This information could be found on this registry key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\` that hold an information about networking interface of a computer

![4df248a9aba86e81d48b67f61ab3e101.png](/assets/resources-writeups/4df248a9aba86e81d48b67f61ab3e101.avif)

Its an IP that obtained from DHCP so it has to be this one
```
10.0.2.15
```

> Q3: What was the DHCP LeaseObtainedTime?

![677e38db558178a6067361690d66eb43.png](/assets/resources-writeups/677e38db558178a6067361690d66eb43.avif)

We're still on the same registry key as previous question and as you can see that DCHP Lease Obtained Time as also stored in UNIX timestamp

![7a62fceaf04cee8eaa28ff7d23a06a21.png](/assets/resources-writeups/7a62fceaf04cee8eaa28ff7d23a06a21.avif)

Use Epoch Converter and a little bit of formatting to answer
```
21/06/2016 02:24:12 UTC
```

> Q4: What is the computer SID?

![38408571f6e0bf3ed185a62f3f2ebec2.png](/assets/resources-writeups/38408571f6e0bf3ed185a62f3f2ebec2.avif)

This could be obtained easily by inspecting $Recycle.Bin which stores all of user deleted files inside their associated SID which last 4 digits are user SID and the rest before that is computer SID
```
S-1-5-21-2489440558-2754304563-710705792
```

> Q5: What is the Operating System(OS) version?

![9e5aac0e436beb12c0f9a2ba400386b1.png](/assets/resources-writeups/9e5aac0e436beb12c0f9a2ba400386b1.avif)

Export SOFTWARE hive then use your registry explorer to inspect this registry key `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion` which stores an information about Windows OS
```
6.3
```

> Q6: What was the computer timezone?

![06dd308dff0c26cc3acce45a5e7b12a4.png](/assets/resources-writeups/06dd308dff0c26cc3acce45a5e7b12a4.avif)

Go back to SYSTEM hive with this key `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\TimeZoneInformation` that holds timezone information

![ab08a1a9cb1085a663dd550dd04da861.png](/assets/resources-writeups/ab08a1a9cb1085a663dd550dd04da861.avif)

with helps from ChatGPT, that is the correct answer
```
UTC-07:00
```

> Q7: How many times did this user log on to the computer?

![b00aea5a9a2ab8e70ea7e4cf63f0a0e2.png](/assets/resources-writeups/b00aea5a9a2ab8e70ea7e4cf63f0a0e2.avif)

Now we will export SAM hive and inspect this key `HKEY_LOCAL_MACHINE\SAM\Domains\Account\Users` that stores information about Users
```
3
```

> Q8: When was the last login time for the discovered account? Format: one-space between date and time

![2ec484c2cbe2a9fc196a4e1a0efaca12.png](/assets/resources-writeups/2ec484c2cbe2a9fc196a4e1a0efaca12.avif)

We can still use the same key to obtain this information
```
2016-06-21 01:42:40
```

> Q9: There was a “Network Scanner” running on this computer, what was it? And when was the last time the suspect used it? Format: program.exe,YYYY-MM-DD HH:MM:SS UTC

![d7fec6509b4b113b0e9d41dc94c6c980.png](/assets/resources-writeups/d7fec6509b4b113b0e9d41dc94c6c980.avif)

There is `.zenmap` folder inside Hunter user folder that mean zenmap was executed at least 1 time

![b7827f859694b85304d5a9839f514d4b.png](/assets/resources-writeups/b7827f859694b85304d5a9839f514d4b.avif)

So lets export its prefetch file 

![383d8ab26a542d598d5dd50e35caf5ec.png](/assets/resources-writeups/383d8ab26a542d598d5dd50e35caf5ec.avif)

Then use `PECmd.exe -f ZENMAP.EXE-56B17C4C.pf` to parse this prefetch file

```
zenmap.exe,2016-06-21 12:08:13 UTC
```

> Q10: When did the port scan end? (Example: Sat Jan 23 hh:mm:ss 2016)

![9509418bfd36d6e2163b9dfe250e824a.png](/assets/resources-writeups/9509418bfd36d6e2163b9dfe250e824a.avif)

If we go back to `.zenmap` folder inside Hunter user folder then you will see `recent_scan.txt` file and it leads us to an output of nmap scan 

![10bc53454669059832e4a20f885c713d.png](/assets/resources-writeups/10bc53454669059832e4a20f885c713d.avif)

an answer should be right here
```
Tue Jun 21 05:12:09 2016
```

> Q11: How many ports were scanned?

![3edf0d0c0fa7bdd502d60a337572f2ff.png](/assets/resources-writeups/3edf0d0c0fa7bdd502d60a337572f2ff.avif)

```
1000
```

> Q12: What ports were found "open"?(comma-separated, ascending)

![1bffe515c4bad8d4274ebf178dab442f.png](/assets/resources-writeups/1bffe515c4bad8d4274ebf178dab442f.avif)

```
22,80,9929,31337
```

> Q13: What was the version of the network scanner running on this computer?

![e94de8901c4c07e1055068e34dc930c2.png](/assets/resources-writeups/e94de8901c4c07e1055068e34dc930c2.avif)

```
7.12
```

> Q14: The employee engaged in a Skype conversation with someone. What is the skype username of the other party?

I did some research and found a lot of blogs talking about [Skype forensics](https://www.dataforensics.org/skype-forensic-analysis/) (mostly vendors talking about how "THEIR" product will help us analyze them)

![150810fb303f7a3ecea6f49116680b74.png](/assets/resources-writeups/150810fb303f7a3ecea6f49116680b74.avif)

We only need to know the location of this `main.db` file so we can use any tool that can open SQLite 3 to proceed 

![fca4975b203c2af02e3dcfd090d32138.png](/assets/resources-writeups/fca4975b203c2af02e3dcfd090d32138.avif)

There we have user hunterrhpt which obviously an employee's username so the other one has to be other party that involved with this scenario

```
linux-rul3z
```

> Q15: What is the name of the application both parties agreed to use to exfiltrate data and provide remote access for the external attacker in their Skype conversation?

![65278948e4471be488751b15bfbfb7f2.png](/assets/resources-writeups/65278948e4471be488751b15bfbfb7f2.avif)

Go to Messages table then we will have full conversation between 2 parties talking about data exfiltration 

![449e43a9d5363f9f4dab4cc2ae0b339f.png](/assets/resources-writeups/449e43a9d5363f9f4dab4cc2ae0b339f.avif)

Someone recommended teamviewer for other party so it has to be this one
```
teamviewer
```

> Q16: What is the Gmail email address of the suspect employee?

![51b457158ac2c72c221d3bccb9a04ef2.png](/assets/resources-writeups/51b457158ac2c72c221d3bccb9a04ef2.avif)

Go to Accounts table and we will have his gmail address
```
ehptmsgs@gmail.com
```

> Q17: It looks like the suspect user deleted an important diagram after his conversation with the external attacker. What is the file name of the deleted diagram?

![0a09494a3922e8f7aa5a5971a7f5c293.png](/assets/resources-writeups/0a09494a3922e8f7aa5a5971a7f5c293.avif)

They talked about sending a file to someone's hotmail account so we need to investigate outlook if available

![5e69985478d09e0fb983405c8b94c14e.png](/assets/resources-writeups/5e69985478d09e0fb983405c8b94c14e.avif)

Which there is a backup in pst file inside Documents folder

![b3db048dd060164052d0cbd4e805c14e.png](/assets/resources-writeups/b3db048dd060164052d0cbd4e805c14e.avif)

Using Sysinfo PST Viewer Pro (Demo) to read contents of it then we will have this sent mail with an image attachment of home network design for home
```
home-network-design-networking-for-a-single-family-home-case-house-arkko-1433-x-792.jpg
```

> Q18: The user Documents' directory contained a PDF file discussing data exfiltration techniques. What is the name of the file?

![ea0b1b1e43596850cb42d71020610a19.png](/assets/resources-writeups/ea0b1b1e43596850cb42d71020610a19.avif)

There is a file named after someone thesis so I think it worth looking for

![d6aaf95cb36e3e42ca574acbf5780de6.png](/assets/resources-writeups/d6aaf95cb36e3e42ca574acbf5780de6.avif)

Which is a goldmine for data exfiltration techniques, you can read one
```
Ryan_VanAntwerp_thesis.pdf
```

> Q19: What was the name of the Disk Encryption application Installed on the victim system? (two words space separated)

![3f471619dbf7acc1c80ccf6bfedf6b98.png](/assets/resources-writeups/3f471619dbf7acc1c80ccf6bfedf6b98.avif)

There is an installer named `bcwipeSetup.exe` inside Downloads folder

![858328de1fc79a3b964e58977ee26d33.png](/assets/resources-writeups/858328de1fc79a3b964e58977ee26d33.avif)

Which confirmed that it was been installed and also uninstalled from the log and this one look like it could encrypt something as its name stated

![9877ed3c83f323ef7459d7706f70e275.png](/assets/resources-writeups/9877ed3c83f323ef7459d7706f70e275.avif)

And it is the one we're looking for 
```
Crypto Swap
```

> Q20: What are the serial numbers of the two identified USB storage?

![c105fd2f9a4d3630657fc567a952abd1.png](/assets/resources-writeups/c105fd2f9a4d3630657fc567a952abd1.avif)

We can obtain both serial numbers by inspecting `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Enum\USBSTOR` key
```
07B20C03C80830A9&0,AAI6UXDKZDV8E9OU&0
```

> Q21: One of the installed applications is a file shredder. What is the name of the application? (two words space separated)

![7fc4f5c928c91fa65a6c4472a5e41685.png](/assets/resources-writeups/7fc4f5c928c91fa65a6c4472a5e41685.avif)

Obviously BCWipe but we have to put vendor name at the front
```
Jetico BCwipe
```

> Q22: How many prefetch files were discovered on the system?

![67c80ba10ea71d5a7a6e557284348aa4.png](/assets/resources-writeups/67c80ba10ea71d5a7a6e557284348aa4.avif)

Export prefetch folder then parse it with `PECmd.exe -d .\Prefetch\ --csv Hunter.csv` then we will have 174 prefetch files processed and stored in csv file
```
174
```

> Q23: How many times was the file shredder application executed?

![4aab8a4e43648f31de6f081ea2d8ba12.png](/assets/resources-writeups/4aab8a4e43648f31de6f081ea2d8ba12.avif)

Open a csv file we got from previous question and search for BCWIPE, we should have run count of this executable file (I thought it was eraser since its installer also in Downloads folder but whatever)
```
5
```

> Q24: Using prefetch, determine when was the last time ZENMAP.EXE-56B17C4C.pf was executed?

![4e0c314a9b2027493c50757e32d3fd04.png](/assets/resources-writeups/4e0c314a9b2027493c50757e32d3fd04.avif)

Search for Zenmap executable and we will have a time from Last Run column
```
06/21/2016 12:08:13 PM
```

> Q25: A JAR file for an offensive traffic manipulation tool was executed. What is the absolute path of the file?

![e2230504f8402f3b599a8d60e2490025.png](/assets/resources-writeups/e2230504f8402f3b599a8d60e2490025.avif)

Only jar file was found inside Downloads folder 
```
C:\Users\Hunter\Downloads\burpsuite_free_v1.7.03.jar
```

> Q26: The suspect employee tried to exfiltrate data by sending it as an email attachment. What is the name of the suspected attachment?

![cc57fd247357a45c894f9e6523ddce61.png](/assets/resources-writeups/cc57fd247357a45c894f9e6523ddce61.avif)

Back to PST viewer then we can see that an employee send exfiltrate data as a fakeporn in 7zip file
```
fakeporn.7z
```

> Q27: Shellbags shows that the employee created a folder to include all the data he will exfiltrate. What is the full path of that folder?

![1ee4726781e8fb941d0a41cccdec9643.png](/assets/resources-writeups/1ee4726781e8fb941d0a41cccdec9643.avif)

To process ShellBags, we need to extract UsrClass.dat hive first 

![c7d9e0d093fb8a81df8e3a0a252d6c77.png](/assets/resources-writeups/c7d9e0d093fb8a81df8e3a0a252d6c77.avif)

Then use ShellBags Explorer than we can see that there is Exfil folder under Pictures folder there

![de1300716c83b775ea4951d0f6371bee.png](/assets/resources-writeups/de1300716c83b775ea4951d0f6371bee.avif)

Confirming it existence by visiting it and its actually there
```
C:\Users\Hunter\Pictures\Exfil
```

> Q28: The user deleted two JPG files from the system and moved them to $Recycle-Bin. What is the file name that has the resolution of 1920x1200?

![c60ad4c07c7100cbb79cf01e67f66be3.png](/assets/resources-writeups/c60ad4c07c7100cbb79cf01e67f66be3.avif)

There are 2 image files inside $Recycle.Bin, the larger one should have the higher resolution

![f7dfa6a749dd40efccc0de86b1cbbe5a.png](/assets/resources-writeups/f7dfa6a749dd40efccc0de86b1cbbe5a.avif)

luckily the same file could still be found under Private folder
```
ws_Small_cute_kitty_1920x1200.jpg
```

> Q29: Provide the name of the directory where information about jump lists items (created automatically by the system) is stored?

![7f71cdb424666a96815202fd5f7a3e37.png](/assets/resources-writeups/7f71cdb424666a96815202fd5f7a3e37.avif)

Here are the locations, we could get Jump lists items and the first one is created automatically by the system
```
AutomaticDestinations
```

> Q30: Using JUMP LIST analysis, provide the full path of the application with the AppID of "aa28770954eaeaaa" used to bypass network security monitoring controls.

![3e146cce32c38a2b423ecc6350fbb014.png](/assets/resources-writeups/3e146cce32c38a2b423ecc6350fbb014.avif)

This item was located under CustomDestinations folder

![dfce9f2658649666373fc495f2841664.png](/assets/resources-writeups/dfce9f2658649666373fc495f2841664.avif)

Export it and use JumpList Explorer to parse it then we have half of absolute path here

![8c76a9edac6bd6640b831107c544f0c3.png](/assets/resources-writeups/8c76a9edac6bd6640b831107c544f0c3.avif)

Confirming it existence and then we will have absolute path of this file
```
C:\Users\Hunter\Desktop\Tor Browser\Browser\firefox.exe
```

https://cyberdefenders.org/blueteam-ctf-challenges/achievements/Chicken_0248/hunter/

* * *
