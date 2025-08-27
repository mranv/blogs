---
author: Anubhav Gain
category: git
description: I accidentally triggered a commit which added a big chunk of unwanted
  data to my repository. I didn't want this to stick around in the history fore...
draft: false
featured: false
lang: en
pubDatetime: '2024-08-03T10:28:47+05:30'
slug: removing-a-git-commit-and-force-pushing-to-remove-it-from-history
tags:
- /
- git
- web
title: Removing a git commit and force pushing to remove it from history
---

# Removing a git commit and force pushing to remove it from history

I accidentally triggered a commit which added a big chunk of unwanted data to my repository. I didn't want this to stick around in the history forever, and no-one else was pulling from the repo, so I decided to use force push to remove the rogue commit entirely.

I figured out the commit hash of the previous version that I wanted to restore and ran:

    git reset --hard 1909f93

Then I ran the force push like this:

    git push --force origin main

See https://github.com/simonw/sf-tree-history/issues/1
