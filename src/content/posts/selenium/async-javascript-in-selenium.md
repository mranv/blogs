---
author: Anubhav Gain
category: selenium
description: 'Thanks [Stuart Langridge](https://twitter.com/sil/status/1312137808111304704)
  for showing me how to do this:'
draft: false
featured: false
lang: en
pubDatetime: '2024-02-12T17:29:00+05:30'
slug: using-asyncawait-in-javascript-in-selenium
tags:
- /
- selenium
- python
- javascript
- web
title: Using async/await in JavaScript in Selenium
---

# Using async/await in JavaScript in Selenium

Thanks [Stuart Langridge](https://twitter.com/sil/status/1312137808111304704) for showing me how to do this:

```python
from selenium import webdriver

chromedriver_path = "/Users/simon/bin/chromedriver"
driver = webdriver.Chrome(executable_path=chromedriver_path)

script = """
done = arguments[arguments.length-1];
a1 = async () => {
    return 42
};
a2 = async() => {
    return await a1()+1
};
a2().then(done);
"""
output = driver.execute_async_script(script)
# output is now the Python integer 43
```
