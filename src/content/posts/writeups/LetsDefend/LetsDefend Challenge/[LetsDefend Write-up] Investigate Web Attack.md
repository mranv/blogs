---
author: Anubhav Gain
category: LetsDefend Challenge
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.928Z
slug: letsdefend-write-up-investigate-web-attack
tags:
- letsdefend-challenge
- letsdefend
- letsdefend-write-up-investigate-web-attack
title: 'LetsDefend Write up Investigate Web Attack'
---
# [LetsDefend - Investigate Web Attack](https://app.letsdefend.io/challenge/investigate-web-attack)
Created: 15/01/2024 12:02
Last Updated: 19/01/2024 08:52
* * *
<div align=center>

**Investigate Web Attack**
![15d98a85f8a00463a592b9272bec6702.png](/assets/resources-writeups/15d98a85f8a00463a592b9272bec6702.avif)
</div>

We detected some web attacks and need to deep investigation.

Challenge Files (pass:infected): [Download](https://files-ld.s3.us-east-2.amazonaws.com/WebLog.zip)

* * *
## Start Investigation
Let's start unzip and open this log file!

<div align=center>

![0f99d0115660c860f780751856e1bb2e.png](/assets/resources-writeups/0f99d0115660c860f780751856e1bb2e.avif)
![a425583839b0feada0e114e20ad36dae.png](/assets/resources-writeups/a425583839b0feada0e114e20ad36dae.avif)
At first glance, it seems that this website has been targeted by Nikto, a web vulnerability scanner, as indicated by the user-agent identified in the web server logs.
![bd2f1a5206728f670b12a6402f2fb162.png](/assets/resources-writeups/bd2f1a5206728f670b12a6402f2fb162.avif)
The observed activity aligns with characteristics typically associated with the Nikto tool. The tool seems to be conducting web reconnaissance through directory brute-forcing.
![22ccfb4bd28b80d77b7f3b286e4370da.png](/assets/resources-writeups/22ccfb4bd28b80d77b7f3b286e4370da.avif)
After discovering directories, it appears that there have been multiple attempts at accessing `/bWAPP/login.php`. This suggests the possibility of a brute force attack targeted at the login page.
![08b61c1e6e59fa62a6aae89ddc568687.png](/assets/resources-writeups/08b61c1e6e59fa62a6aae89ddc568687.avif)
After scrolling through the logs, I found a HTTP 302 status codes (Redirects), indicating that the attacker has successfully brute-forced their way through.

![b3f7b447daaa1f33f9aabfb55fc7da5e.png](/assets/resources-writeups/b3f7b447daaa1f33f9aabfb55fc7da5e.avif)
After successfully gaining access to the website through brute force attacks, the attacker identified a code injection vulnerability through `whoami` command. Subsequently, they attempted to exploit this vulnerability to inject code and establish persistence by adding a user to the system.
</div>

* * *
>Which automated scan tool did attacker use for web reconnansiance?
```
nikto
```

>After web reconnansiance activity, which technique did attacker use for directory listing discovery?
```
directory brute force
```

>What is the third attack type after directory listing discovery?
```
brute force
```

>Is the third attack success?
```
yes
```

>What is the name of fourth attack?
```
code injection
```

>What is the first payload for 4rd attack?
```
whoami
```

>Is there any persistency clue for the victim machine in the log file ? If yes, what is the related payload?
```
%27net%20user%20hacker%20Asd123!!%20/add%27
```

* * *
## Summary
On this challenge, we investigate log file to discover how an attacker used nikto to scan vulnerability of a website then exploited it to gaining access to the website via brute force attacks then an attacker identified a code injection vulnerability through `whoami` command. Subsequently, they attempted to exploit this vulnerability to inject code and establish persistence by adding a user to the system.
<div align=center>

![5d711c086bb7898f5bf060f20d10276f.png](/assets/resources-writeups/5d711c086bb7898f5bf060f20d10276f.avif)
Badge Acquired
</div>

* * *