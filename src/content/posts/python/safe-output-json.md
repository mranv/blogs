---
author: Anubhav Gain
category: python
description: 'Carelessly including the output of `json.dumps()` in an HTML page can
  lead to an XSS hole, thanks to the following:'
draft: false
featured: false
lang: en
pubDatetime: '2024-08-10T16:56:57+05:30'
slug: safely-outputting-json
tags:
- /
- python
- javascript
- git
- web
title: Safely outputting JSON
---

# Safely outputting JSON

Carelessly including the output of `json.dumps()` in an HTML page can lead to an XSS hole, thanks to the following:

```pycon
>>> import json
>>> s = "</script><script>alert(document.location)</script>"
>>> print(json.dumps({"bad": s}))
{"bad": "</script><script>alert(document.location)</script>"}
```
Jinja has a function that avoids this in `jinja2.utils.htmlsafe_json_dumps()` - the (simplified) implementation [looks like this](https://github.com/pallets/jinja/blob/3.0.3/src/jinja2/utils.py#L704-L741):

```python
def htmlsafe_json_dumps(obj):
    return (
        json.dumps(obj)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
        .replace("'", "\\u0027")
    )
```
Which outputs like this:
```pycon
>>> print(htmlsafe_json_dumps({"bad": s}))
{"bad": "\u003c/script\u003e\u003cscript\u003ealert(document.location)\u003c/script\u003e"}
```
