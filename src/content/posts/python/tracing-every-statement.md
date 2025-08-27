---
author: Anubhav Gain
category: python
description: Today I learned how to use the Python [trace module](https://docs.python.org/3/library/trace.html)
  to output every single executed line of Python c...
draft: false
featured: false
lang: en
pubDatetime: '2024-01-17T19:58:19+05:30'
slug: tracing-every-executed-python-statement
tags:
- /
- python
- web
title: Tracing every executed Python statement
---

# Tracing every executed Python statement

Today I learned how to use the Python [trace module](https://docs.python.org/3/library/trace.html) to output every single executed line of Python code in a program - useful for figuring out exactly when a crash or infinite loop happens.

The basic format is to run:

    python3 -m trace --trace myscript.py

This will execute the script and print out every single line of code as it executes - which can be a LOT of output. It slows the program down to a crawl - just starting up Datasette took probably over a minute and churned through hundreds of thousands of lines of console output.

Since Datasette is a command-line application, I needed to use the following recipe to trace it:

    python3 -m trace --trace $(which datasette) fixtures.db -p 8002
