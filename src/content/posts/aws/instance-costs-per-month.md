---
author: Anubhav Gain
category: aws
description: The [EC2 pricing page](https://aws.amazon.com/ec2/pricing/on-demand/)
  shows cost per hour, which is pretty much useless. I want cost per month. The...
draft: false
featured: false
lang: en
pubDatetime: '2024-12-21T10:08:19+05:30'
slug: display-ec2-instance-costs-per-month
tags:
- aws
- ec2
- pricing
- javascript
- cost-optimization
title: Display EC2 instance costs per month
---

# Display EC2 instance costs per month

The [EC2 pricing page](https://aws.amazon.com/ec2/pricing/on-demand/) shows cost per hour, which is pretty much useless. I want cost per month. The following JavaScript, pasted into the browser developer console, modifies the page to show cost-per-month instead.

```javascript
Array.from(
    document.querySelectorAll('td')
).filter(
    el => el.textContent.toLowerCase().includes('per hour')
).forEach(
    el => el.textContent = '$' + (parseFloat(
        /\d+\.\d+/.exec(el.textContent)[0]
    ) * 24 * 30).toFixed(2) + ' per month'
)
```
