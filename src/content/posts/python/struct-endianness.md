---
author: Anubhav Gain
category: python
description: TIL the Python standard library [struct](https://docs.python.org/3/library/struct.html)
  module defaults to interpreting binary strings using the en...
draft: false
featured: false
lang: en
pubDatetime: '2024-01-29T18:42:02+05:30'
slug: struct-endianness-in-python
tags:
- /
- python
- git
- database
- web
- testing
title: struct endianness in Python
---

# struct endianness in Python

TIL the Python standard library [struct](https://docs.python.org/3/library/struct.html) module defaults to interpreting binary strings using the endianness of your machine.

Which means that this code:

```python
def decode_matchinfo(buf):
    # buf is a bytestring of unsigned integers, each 4 bytes long
    return struct.unpack("I" * (len(buf) // 4), buf)
```
Behaves differently on big-endian v.s. little-endian systems.

I found this out thanks to [this bug report](https://github.com/simonw/sqlite-fts4/issues/6) against my sqlite-fts4 library.

My `decode_matchinfo()` function runs against a binary data structure returned by SQLite - more details on that in [Exploring search relevance algorithms with SQLite](https://simonwillison.net/2019/Jan/7/exploring-search-relevance-algorithms-sqlite/).

SQLite doesn't change the binary format depending on the endianness of the system, which means that my function here works correctly on little-endian but does the wrong thing on big-endian systems:

**Update:** I was entirely wrong about this. SQLite DOES change the format based on the endianness of the system. My bug fix was incorrect - see [this issue comment](https://github.com/simonw/sqlite-fts4/issues/6#issuecomment-1200053863) for details.

On little-endian systems:

```python
>>> buf = b'\x01\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00'
>>> decode_matchinfo(buf)
(1, 2, 2, 2)
```
But on big-endian systems:
```python
>>> buf = b'\x01\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00'
>>> decode_matchinfo(buf)
(16777216, 33554432, 33554432, 33554432)
```
The fix is to add a first character to that format string specifying the endianness that should be used, see [Byte Order, Size, and Alignment](https://docs.python.org/3/library/struct.html#struct-alignment) in the Python documentation.

```python
>>> struct.unpack("<IIII", buf)
(1, 2, 2, 2)
>>> struct.unpack(">IIII", buf)
(16777216, 33554432, 33554432, 33554432)
```
So [the fix](https://github.com/simonw/sqlite-fts4/commit/ed6ea76a727243e9b0bff4fe7cf7022fcd1ec834) for my bug was to rewrite the function to look like this:
```python
def decode_matchinfo(buf):
    # buf is a bytestring of unsigned integers, each 4 bytes long
    return struct.unpack("<" + ("I" * (len(buf) // 4)), buf)
```
## Bonus: How to tell which endianness your system has

Turns out Python can tell you if you are big-endian or little-endian like this:

```python
>>> from sys import byteorder
>>> byteorder
'little'
```
