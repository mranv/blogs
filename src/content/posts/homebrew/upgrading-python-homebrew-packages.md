---
author: Anubhav Gain
category: homebrew
description: '[VisiData 2.0](https://www.visidata.org/) came out today. I previously
  installed VisiData using Homebrew, but the VisiData tap has not yet been upd...'
draft: false
featured: false
lang: en
pubDatetime: '2024-04-12T18:55:45+05:30'
slug: upgrading-python-homebrew-packages-using-pip
tags:
- /
- homebrew
- python
- database
- web
- testing
title: Upgrading Python Homebrew packages using pip
---

# Upgrading Python Homebrew packages using pip

[VisiData 2.0](https://www.visidata.org/) came out today. I previously installed VisiData using Homebrew, but the VisiData tap has not yet been updated with the latest version.

Homebrew Python packages (including the packages for [Datasette](https://formulae.brew.sh/formula/datasette) and [sqlite-utils](https://formulae.brew.sh/formula/sqlite-utils)) work by setting up their own package-specific virtual environments. This means you can upgrade them without waiting for the tap.

To find the virtual environment, run `head -n 1` against the Homebrew-providid executable. VisiData is `vd`, so this works:
```
% head -n 1 $(which vd)
#!/usr/local/Cellar/visidata/1.5.2/libexec/bin/python3.8
```
Now you can call `pip` within that virtual directory to perform the upgrade like so:
```
/usr/local/Cellar/visidata/1.5.2/libexec/bin/pip install -U visidata
```
