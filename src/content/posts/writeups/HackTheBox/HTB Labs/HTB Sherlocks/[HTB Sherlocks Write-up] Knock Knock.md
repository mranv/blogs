---
author: Anubhav Gain
category: HTB Sherlocks
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.916Z
slug: htb-sherlocks-write-up-knock-knock
tags:
- htb-sherlocks
- hackthebox
- htb-labs
- htb-sherlocks-write-up-knock-knock
title: 'HTB Sherlocks Write up Knock Knock'
---
# [HackTheBox Sherlocks - Knock Knock](https://app.hackthebox.com/sherlocks/Knock%20Knock)
![623d4517bbe2bbf2dc078d3f242054d4.png](/assets/resources-writeups/623d4517bbe2bbf2dc078d3f242054d4.avif)
**Scenario:**
A critical Forela Dev server was targeted by a threat group. The Dev server was accidentally left open to the internet which it was not supposed to be. The senior dev Abdullah told the IT team that the server was fully hardened and it's still difficult to comprehend how the attack took place and how the attacker got access in the first place. Forela recently started its business expansion in Pakistan and Abdullah was the one IN charge of all infrastructure deployment and management. The Security Team need to contain and remediate the threat as soon as possible as any more damage can be devastating for the company, especially at the crucial stage of expanding in other region. Thankfully a packet capture tool was running in the subnet which was set up a few months ago. A packet capture is provided to you around the time of the incident (1-2) days margin because we don't know exactly when the attacker gained access. As our forensics analyst, you have been provided the packet capture to assess how the attacker gained access. Warning : This Sherlock will require an element of OSINT to complete fully.

* * *
>Task 1: Which ports did the attacker find open during their enumeration phase?

![67f2ffbc5cd205176e41e3df80933abb.png](/assets/resources-writeups/67f2ffbc5cd205176e41e3df80933abb.avif)

After opened pcap file on Wireshark, I reviewed question again and thought that it has to be port scanning so I started to find for an IP address that keep sending multiple SYN packets to different ports on the same IP address which we can see that `3.109.209.43` conducted port scanning on `172.31.39.46` (so this would be Forela Dev server)

![2efa17c02a46db39f16bfa94b04e416f.png](/assets/resources-writeups/2efa17c02a46db39f16bfa94b04e416f.avif)

If a port is opened then it would send SYN, ACK packet back so we could filter with `ip.addr == 172.31.39.46 && frame.number >= 76081 && frame.number <= 207174 && tcp.flags == 0x012` which will see that there are 5 opened ports on Forela Dev server.

```
21,22,3306,6379,8086
```

>Task 2: Whats the UTC time when attacker started their attack against the server?

![3ab512b2b37ac44801b1dbb68a678cc0.png](/assets/resources-writeups/3ab512b2b37ac44801b1dbb68a678cc0.avif)
Go back to where the attacker started sending SYN packet to port 1 on the server then we will have the answer of this question.
```
21/03/2023 10:42:23
```

>Task 3: What's the MITRE Technique ID of the technique attacker used to get initial access?

![470c7ad94ebe4ffb3ebf9251070bc8bd.png](/assets/resources-writeups/470c7ad94ebe4ffb3ebf9251070bc8bd.avif)

So we know that the port scan activity ended at packet 207174 so we could use `ip.addr == 3.109.209.43 && frame.number >= 207174` to find out what happened after that from the attacker IP address which we can see that there are multiple communication on port 21 (FTP)

![6d8940c22d45be0845debc819d0b765f.png](/assets/resources-writeups/6d8940c22d45be0845debc819d0b765f.avif)

After take a look at one of these stream, we could see that the attacker tried to authenticate with different username and password so... it is a password spray attack.

```
T1110.003
```

>Task 4: What are valid set of credentials used to get initial foothold?


![c262c322837db42b7b4173385dbce47f.png](/assets/resources-writeups/c262c322837db42b7b4173385dbce47f.avif)

We can search for FTP Status 230 Login Successful then we follow that stream to get valid credential used to get initial foothold.

![19322f48ccf0a2e4aa698d5e8979adf3.png](/assets/resources-writeups/19322f48ccf0a2e4aa698d5e8979adf3.avif)

```
tony.shephard:Summer2023!
```

>Task 5: What is the Malicious IP address utilized by the attacker for initial access?
```
3.109.209.43
```

>Task 6: What is name of the file which contained some config data and credentials?

![c4771ea5a2fd8a23a7e3d327a12d6de2.png](/assets/resources-writeups/c4771ea5a2fd8a23a7e3d327a12d6de2.avif)

Since the attacker gained access to FTP server so I suspected there should be a file transfer happened and I was right, `.backup` file was downloaded from FTP server. 

![5fd8ee048d7cfcb3fe6e1ee1bd56c985.png](/assets/resources-writeups/5fd8ee048d7cfcb3fe6e1ee1bd56c985.avif)

After carefully review the content of this file, I recognized that this is back up of `/etc/knockd.conf` file which used for port knocking service which reveals Internal FTP server that has to be knocked on port 29999, 50234, 45087 first then firewall will let that IP communicate to port 24456 that host internal FTP server and we can also see credential that can be used with this internal FTP server at the end of this file.

You can read more about Port Knocking [here](https://medium.com/@reotmani/port-knocking-dbe6d8aaeb9)

```
.backup
```

>Task 7: Which port was the critical service running?

![36063f9c4ca6a5e92bf46dfcfbaa49c0.png](/assets/resources-writeups/36063f9c4ca6a5e92bf46dfcfbaa49c0.avif)
```
24456
```

>Task 8: Whats the name of technique used to get to that critical service?

![c04f5e4069fd086f6810506f5f6fe861.png](/assets/resources-writeups/c04f5e4069fd086f6810506f5f6fe861.avif)

We can go back to Wireshark and we could see that the attacker knocked 29999, 50234, 45087 ports in order then finally established connection to internal FTP server on port 24456. 

```
Port Knocking
```

>Task 9: Which ports were required to interact with to reach the critical service?
```
29999,45087,50234
```

>Task 10: Whats the UTC time when interaction with previous question ports ended?

Enter the timestamp of last port that was knocked
```
21/03/2023 10:58:50
```

>Task 11: What are set of valid credentials for the critical service?

We already know that the attacker already obtained valid credential for internal FTP server but to confirm if this credential was actually used then we can use this filter `ip.addr == 3.109.209.43 && frame.number >= 207174 && tcp.port==24456` and follow TCP stream to find out what happened after the attacker established connection to port 24456

![5ecca56279e274513681cc61ca70865f.png](/assets/resources-writeups/5ecca56279e274513681cc61ca70865f.avif)

We can see that this credential was used to authenticate here as expected.

```
abdullah.yasin:XhlhGame_90HJLDASxfd&hoooad
```

>Task 12: At what UTC Time attacker got access to the critical server?

![37aa4d14d552ce4a46fc7b8931c61e75.png](/assets/resources-writeups/37aa4d14d552ce4a46fc7b8931c61e75.avif)
We have to find the packet that sent message "230 Login successful" to user which is frame 210799 so we could use this timestamp to answer this question.
```
21/03/2023 11:00:01
```

>Task 13: Whats the AWS AccountID and Password for the developer "Abdullah"?

![13ed37d4ddb2ba5e3727456068dfc768.png](/assets/resources-writeups/13ed37d4ddb2ba5e3727456068dfc768.avif)

After authenticated, the attacker downloaded several files from this FTP server, first one is this sql file

![cabd57635ef1fdd73da8a61ced370e54.png](/assets/resources-writeups/cabd57635ef1fdd73da8a61ced370e54.avif)

To get the content of this file, we need to go to frame 211114 and follow TCP stream

![95cc002be62cf237f19407fb23d18f72.png](/assets/resources-writeups/95cc002be62cf237f19407fb23d18f72.avif)

This sql file is used to create AWS_EC2_DEV table with name, accountID and password that will be inserted into after that and we could see AWS AccountID and Password of "Abdullah" right there.

```
391629733297:yiobkod0986Y[adij@IKBDS
```

>Task 14: Whats the deadline for hiring developers for forela?

![eae25a0c1e23ed10a83ce256fa76e1e8.png](/assets/resources-writeups/eae25a0c1e23ed10a83ce256fa76e1e8.avif)

Second file that was downloaded is `Tasks to get Done.docx` file.

![530e7eb40fb044fff224bfdbf711575e.png](/assets/resources-writeups/530e7eb40fb044fff224bfdbf711575e.avif)

Go to stream 211158 or 211159 then follow TCP stream.

![002312409efea43cb5bbc8a397e4a2ed.png](/assets/resources-writeups/002312409efea43cb5bbc8a397e4a2ed.avif)

Since we need to export this file so we have to click "Save as..." and name it as you want but it has to be open as docx file.

![5a93c7ad7dca105baaf272de5848fca2.png](/assets/resources-writeups/5a93c7ad7dca105baaf272de5848fca2.avif)

After exported this file out, opened it then we can see deadline of 4 activitities including hiring developers one.

```
30/08/2023
```

>Task 15: When did CEO of forela was scheduled to arrive in pakistan?

![be2aa289d15411135a0c4be5c657c81f.png](/assets/resources-writeups/be2aa289d15411135a0c4be5c657c81f.avif)

The third file that was downloaded is `reminder.txt`.

![bdeec30519f1c885163db91b23c26d00.png](/assets/resources-writeups/bdeec30519f1c885163db91b23c26d00.avif)

Go to frame 211188 to read the content of this text file.

![0959595cd0bd5f04c347a5012976cb91.png](/assets/resources-writeups/0959595cd0bd5f04c347a5012976cb91.avif)

We can see that CEO Happy will arrive in pakistan on 8 march 2023.

```
08/03/2023
```

>Task 16: The attacker was able to perform directory traversel and escape the chroot jail.This caused attacker to roam around the filesystem just like a normal user would. Whats the username of an account other than root having /bin/bash set as default shell?

![2aa579add001a50ef49612f627790fd2.png](/assets/resources-writeups/2aa579add001a50ef49612f627790fd2.avif)

To answer this question, we will have to inspect `/etc/passwd` file that was downloaded by the attacker.

![d9069750c3d41e7d72649616b6a16c89.png](/assets/resources-writeups/d9069750c3d41e7d72649616b6a16c89.avif)

Go to frame 211273 and follow the stream.

![c36e17c5d15787c36ccef4656566834f.png](/assets/resources-writeups/c36e17c5d15787c36ccef4656566834f.avif)

We can see that beside from root, cyberjunkie is the user that has /bin/bash as default shell.

```
cyberjunkie
```

>Task 17: Whats the full path of the file which lead to ssh access of the server by attacker?

![155c582cef2d6467b65f39142e1dac45.png](/assets/resources-writeups/155c582cef2d6467b65f39142e1dac45.avif)

The attacker navigated to `/opt/reminders` and then downloaded `.reminder` file so lets see whats inside this file that let attacker gain access server via SSH.

![6cc2c35fc1e19152e46a5decdaf3d54d.png](/assets/resources-writeups/6cc2c35fc1e19152e46a5decdaf3d54d.avif)

its on frame 211605 which we can see that there is a GitHub repo that might contain SSH credential that the attacker found out and used that credential to gain access to server.

```
/opt/reminders/.reminder
```

>Task 18: Whats the SSH password which attacker used to access the server and get full access?

![ef6fe024a106ef20884ed45fec9cfb39.png](/assets/resources-writeups/ef6fe024a106ef20884ed45fec9cfb39.avif)

Went to GitHub and search for folera repo then we will see that `folela-finance/forela-dev` might be the one we are looking for.

![0936ecf8dd03b90fc7d452d1c0f5a4bf.png](/assets/resources-writeups/0936ecf8dd03b90fc7d452d1c0f5a4bf.avif)

There is a yaml file for ansible playbook right here which will download key from url then use that key to authenticate to SSH and doing some operations after that but where is SSH password?.

![73e601465014e17850e000f78c4d4e70.png](/assets/resources-writeups/73e601465014e17850e000f78c4d4e70.avif)

Lets take a look at commit history when it created.

![9955153fcae4841d09ba69ed66f1adfc.png](/assets/resources-writeups/9955153fcae4841d09ba69ed66f1adfc.avif)

We can see that there is SSH password when this repo was created and the attacker used this to access server.

```
YHUIhnollouhdnoamjndlyvbl398782bapd
```

>Task 19: Whats the full url from where attacker downloaded ransomware?

![ed24788a68de5dff358bd8935ac3570a.png](/assets/resources-writeups/ed24788a68de5dff358bd8935ac3570a.avif)

Since we could not read SSH traffic so what left is to find any connection happened during these communication which indicated file downloading and there is one right there!

![b0037f62c50cebddb4607572a2e2d4af.png](/assets/resources-writeups/b0037f62c50cebddb4607572a2e2d4af.avif)

The attacker download zip file that might contain ransomware using wget 

```
้้http://13.233.179.35/PKCampaign/Targets/Forela/Ransomware2_server.zip
```

>Task 20: Whats the tool/util name and version which attacker used to download ransomware?
```
Wget/1.21.2
```

>Task 21: Whats the ransomware name?

![004e514f972bfc35a11ba904c5a28228.png](/assets/resources-writeups/004e514f972bfc35a11ba904c5a28228.avif)

I almost exported this file out but then I keep scrolling to the bottom and found that there is a "GonnaCry" directory so the ransomware that was downloaded is GonnaCry ransomware 

```
GonnaCry
```

![5a3498b675f4f3c52a3a0b3b7043b853.png](/assets/resources-writeups/5a3498b675f4f3c52a3a0b3b7043b853.avif)
* * *
