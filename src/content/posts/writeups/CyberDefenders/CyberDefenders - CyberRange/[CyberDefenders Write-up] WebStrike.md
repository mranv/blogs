---
title: 'CyberDefenders Write-up WebStrike'
author: Anubhav Gain
category: CyberDefenders - CyberRange
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.905Z
slug: cyberdefenders-write-up-webstrike
tags:
- cyberdefenders
---cyberrange
- cyberdefenders
- cyberdefenders-write-up-webstrike
title: 'CyberDefenders Write up WebStrike'
---
# [CyberDefenders - WebStrike](https://cyberdefenders.org/blueteam-ctf-challenges/webstrike/)
Created: 19/02/2024 12:45
Last Updated: 09/10/2024 00:21
* * *
>**Category**: Network Forensics
>**Tags**: Wireshark, PCAP, Exfiltration
* * *
**Scenario**: An anomaly was discovered within our company's intranet as our Development team found an unusual file on one of our web servers. Suspecting potential malicious activity, the network team has prepared a pcap file with critical network traffic for analysis for the security team, and you have been tasked with analyzing the pcap.

**Tools**: Wireshark
* * *
## Questions
> Q1: Understanding the geographical origin of the attack aids in geo-blocking measures and threat intelligence analysis. What city did the attack originate from?

![0bfe5bf1f85db637057150fb33299a0e.png](/assets/resources-writeups/0bfe5bf1f85db637057150fb33299a0e.avif)
![8cbb712ae14ca463f8c535ec5967ef5e.png](/assets/resources-writeups/8cbb712ae14ca463f8c535ec5967ef5e.avif)
After taking a look at pcap file, There are only 2 IP addresses were captured.
Which `117.11.88.124` is probably the client (attacker) and `24.49.63.79` is a web server
![718a357005c2dc6fb61ffc8eccf03f1e.png](/assets/resources-writeups/718a357005c2dc6fb61ffc8eccf03f1e.avif)
![1dfa993bfaa53fb62bc8ae67675515c1.png](/assets/resources-writeups/1dfa993bfaa53fb62bc8ae67675515c1.avif)
I used [iplocation](https://www.iplocation.net/ip-lookup) to find both of IP addresses, attack was from the China and the web server was on the US so the answer is
<details>
  <summary>Answer</summary>
<pre><code>Tianjin</code></pre>
</details>

> Q2: Knowing the attacker's user-agent assists in creating robust filtering rules. What's the attacker's user agent?

![55739d889fe7b2c4510c9cda0d12ccf9.png](/assets/resources-writeups/55739d889fe7b2c4510c9cda0d12ccf9.avif)
Follow HTTP or TCP stream of HTTP traffic, here is the user-agent of the attacker

<details>
  <summary>Answer</summary>
<pre><code>Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0</code></pre>
</details>

> Q3: We need to identify if there were potential vulnerabilities exploited. What's the name of the malicious web shell uploaded?

![a34b81b79b64cea0aedbf6435b443b7b.png](/assets/resources-writeups/a34b81b79b64cea0aedbf6435b443b7b.avif)
After browsing the website, the attacker found the upload page and used POST method to upload php reverse shell to the server which was a successful attempt.

<details>
  <summary>Answer</summary>
<pre><code>image.jpg.php</code></pre>
</details>

> Q4: Knowing the directory where files uploaded are stored is important for reinforcing defenses against unauthorized access. Which directory is used by the website to store the uploaded files?

![451b238b4d7fcd606f3e75b2d3bd293c.png](/assets/resources-writeups/451b238b4d7fcd606f3e75b2d3bd293c.avif)
The php reverse shell was uploaded to this directory as a link

<details>
  <summary>Answer</summary>
<pre><code>/reviews/uploads/</code></pre>
</details>

> Q5: Identifying the port utilized by the web shell helps improve firewall configurations for blocking unauthorized outbound traffic. What port was used by the malicious web shell?

Look at the content of php reverse shell, The port that was used is

<details>
  <summary>Answer</summary>
<pre><code>8080</code></pre>
</details>

![33a231c416857db796bca3938affcfeb.png](/assets/resources-writeups/33a231c416857db796bca3938affcfeb.avif)
Which the attacker successfully gained the reverse shell from the server.

> Q6: Understanding the value of compromised data assists in prioritizing incident response actions. What file was the attacker trying to exfiltrate?

![48447fe0b3561bfa69b94c38c4c7756b.png](/assets/resources-writeups/48447fe0b3561bfa69b94c38c4c7756b.avif)
<details>
  <summary>Answer</summary>
<pre><code>passwd</code></pre>
</details>

<div align=center>

![dc380c96026d53b7272c8f8601e24180.png](/assets/resources-writeups/dc380c96026d53b7272c8f8601e24180.avif)
</div>

* * *