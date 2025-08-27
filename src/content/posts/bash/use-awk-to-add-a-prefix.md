---
author: Anubhav Gain
category: bash
description: 'I wanted to dynamically run the following command against all files
  in a directory:'
draft: false
featured: false
lang: en
pubDatetime: '2024-06-20T16:30:51+05:30'
slug: using-awk-to-add-a-prefix
tags:
- /
- bash
- python
- javascript
- git
- database
- web
- cli
title: Using awk to add a prefix
---

# Using awk to add a prefix

I wanted to dynamically run the following command against all files in a directory:

```bash
pypi-to-sqlite content.db -f /tmp/pypi-datasette-packages/packages/airtable-export.json \
-f /tmp/pypi-datasette-packages/packages/csv-diff.json \
--prefix pypi_
```

I can't use `/tmp/pypi-datasette-packages/packages/*.json` here because I need each file to be processed using the `-f` option.

I found a solution using `awk`. The `awk` program `'{print "-f "$0}'` adds a prefix to the input, for example:
```
% echo "blah" | awk '{print "-f "$0}'
-f blah
```
I wanted that trailing backslash too, so I used this:

```awk
{print "-f "$0 " \\"}
```
Piping to `awk` works, so I combined that with `ls ../*.json` like so:

```
% ls /tmp/pypi-datasette-packages/packages/*.json | awk '{print "-f "$0 " \\"}'
-f /tmp/pypi-datasette-packages/packages/airtable-export.json \
-f /tmp/pypi-datasette-packages/packages/csv-diff.json \
-f /tmp/pypi-datasette-packages/packages/csvs-to-sqlite.json \
```
Then I used `eval` to execute the command. The full recipe looks like this:
```bash
args=$(ls /tmp/pypi-datasette-packages/packages/*.json | awk '{print "-f "$0 " \\"}')
eval "pypi-to-sqlite content.db $args
--prefix pypi_"
```
Full details in [datasette.io issue 98](https://github.com/simonw/datasette.io/issues/98).
