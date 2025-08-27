---
author: Anubhav Gain
category: vim
description: Today I learned that if you hit `Esc` in vim and then type `:set mouse=a`
  and hit enter... vim grows mouse support! In your terminal!
draft: false
featured: false
lang: en
pubDatetime: '2024-03-11T09:20:37+05:30'
slug: mouse-support-in-vim
tags:
- /
- vim
- python
- git
- web
- cli
title: Mouse support in vim
---

# Mouse support in vim

Today I learned that if you hit `Esc` in vim and then type `:set mouse=a` and hit enter... vim grows mouse support! In your terminal!

You can use the mouse to select blocks of text and move the insertion cursor around, then hit `del` to delete it or type to replace it.

I learned this after tweeting [a demo video](https://twitter.com/simonw/status/1406336417500860423) of Will McGugan's brilliant new [textual](https://github.com/willmcgugan/textual) Python library for building TUIs - terminal user interfaces - and marveling at how his demo application can already respond to mouseover events and scroll wheel activation while running in the terminal.
