---
author: Anubhav Gain
category: HTB Sherlocks
description: ''
draft: false
featured: false
lang: en
pubDatetime: 2025-12-20T10:04:24.915Z
slug: htb-sherlocks-write-up-jingle-bell
tags:
- htb-sherlocks
- hackthebox
- htb-labs
- htb-sherlocks-write-up-jingle-bell
title: 'HTB Sherlocks Write up Jingle Bell'
---
# [HackTheBox Sherlocks - Jingle Bell](https://app.hackthebox.com/sherlocks/Jingle%20Bell)
Created: 20/05/2024 18:43
Last Updated: 20/05/2024 19:49
* * *
![8dbe148f1eb78096fbf99212838ebf4c.png](/assets/resources-writeups/8dbe148f1eb78096fbf99212838ebf4c-1.avif)
**Scenario:**
Torrin is suspected to be an insider threat in Forela. He is believed to have leaked some data and removed certain applications from their workstation. They managed to bypass some controls and installed unauthorised software. Despite the forensic team's efforts, no evidence of data leakage was found. As a senior incident responder, you have been tasked with investigating the incident to determine the conversation between the two parties involved.

* * *
>Task 1: Which software/application did Torrin use to leak Forela's secrets?

![54f9a06e8d6af311193d02f58f865715.png](/assets/resources-writeups/54f9a06e8d6af311193d02f58f865715-1.avif)
We only have 1 artifact avaliable here which is Windows Notifications database
![6ca2ddd874e8bb8e195d49821c298d6d.png](/assets/resources-writeups/6ca2ddd874e8bb8e195d49821c298d6d-1.avif)
So after opened it with DB Browser for SQLite, go to Notification table and then you will see a lot of slack notification stored here.
```
slack
```

>Task 2: What's the name of the rival company to which Torrin leaked the data?

![86c38b826cf9a82753c4fb3faf38d679.png](/assets/resources-writeups/86c38b826cf9a82753c4fb3faf38d679-1.avif)
When inspect value inside we can see unfamiliar name which should be the rival company at this point
![de2257ecca2423cc46c6e4c3d126cdba.png](/assets/resources-writeups/de2257ecca2423cc46c6e4c3d126cdba-1.avif)
And the one we invited Torrin is Cyberjunkie, the creator of this sherlock
```
PrimeTech Innovations
```

>Task 3: What is the username of the person from the competitor organization whom Torrin shared information with?
```
Cyberjunkie-PrimeTechDev:
```

>Task 4: What's the channel name in which they conversed with each other?

![eb7a8e7d3f9f7530c7d8e9a290ccc858.png](/assets/resources-writeups/eb7a8e7d3f9f7530c7d8e9a290ccc858-1.avif)
```
forela-secrets-leak
```

>Task 5: What was the password for the archive server?

![49b8f5432621c8728a2d3a015890caf1.png](/assets/resources-writeups/49b8f5432621c8728a2d3a015890caf1-1.avif)
```
Tobdaf8Qip$re@1
```

>Task 6: What was the URL provided to Torrin to upload stolen data to?

![c99fc0f574d57768119f07f5b713ecc0.png](/assets/resources-writeups/c99fc0f574d57768119f07f5b713ecc0-1.avif)
```
https://drive.google.com/drive/folders/1vW97VBmxDZUIEuEUG64g5DLZvFP-Pdll?usp=sharing
```

>Task 7: When was the above link shared with Torrin?

![082e0bb8e91cf2a42ed9546f72febefe.png](/assets/resources-writeups/082e0bb8e91cf2a42ed9546f72febefe-1.avif)
I was too swayed with arrival time in this table but the real one was this which is unix timestamp
![d85fe82836b032a553344c1a340d92a2.png](/assets/resources-writeups/d85fe82836b032a553344c1a340d92a2-1.avif)
asked ChatGPT to write me a script then here we go
```
from datetime import datetime

# The given timestamp
epoch_time = 1681986889.660179

# Convert the epoch time to a UTC datetime
utc_time = datetime.utcfromtimestamp(epoch_time)

# Print the result
print("UTC Time:", utc_time)
```

```
2023-04-20 10:34:49
```

>Task 8: For how much money did Torrin leak Forela's secrets?

![64682c658e56dd997ecbf74b3216cb16.png](/assets/resources-writeups/64682c658e56dd997ecbf74b3216cb16-1.avif)
```
£10000
```

![53fcc9e536bb851d141e2e4d77446650.png](/assets/resources-writeups/53fcc9e536bb851d141e2e4d77446650-1.avif)
* * *
