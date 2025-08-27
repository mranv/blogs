---
author: Anubhav Gain
category: zsh
description: 'I got fed up of the default macOS `zsh` prompt:'
draft: false
featured: false
lang: en
pubDatetime: '2024-05-28T13:48:08+05:30'
slug: customizing-my-zsh-prompt
tags:
- /
- zsh
- git
- cli
title: Customizing my zsh prompt
---

# Customizing my zsh prompt

I got fed up of the default macOS `zsh` prompt:

    simon@Simons-MacBook-Pro ~ %

Mainly because I like copying and pasting terminal examples into GitHub issues.

I changed it to this:

    ~ % cd /tmp
    /tmp %

By adding this line to the top of my `~/.zshrc` file:

    PROMPT='%1~ %# '
