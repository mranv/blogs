---
author: Anubhav Gain
category: github-actions
description: GitHub Actions workflows fail if any of the steps executes something
  that returns a non-zero exit code.
draft: false
featured: false
lang: en
pubDatetime: '2024-09-10T14:30:52+05:30'
slug: using-grep-to-write-tests-in-ci
tags:
- /
- github-actions
- python
- git
- database
- web
- testing
title: Using grep to write tests in CI
---

# Using grep to write tests in CI

GitHub Actions workflows fail if any of the steps executes something that returns a non-zero exit code.

Today I learned that `grep` returns a non-zero exit code if it fails to find any matches.

This means that piping to grep is a really quick way to write a test as part of an Actions workflow.

I wrote a quick soundness check today using the new `datasette --get /path` option, which runs a fake HTTP request for that path through Datasette and returns the response to standard out. Here's an example:

```yaml
    - name: Build database
      run: scripts/build.sh
    - name: Run tests
      run: |
        datasette . --get /us/pillar-point | grep 'Rocky Beaches'
    - name: Deploy to Vercel
```
I like this pattern a lot: build a database for a custom Datasette deloyment in CI, run one or more quick soundness checks using grep, then deploy if those checks pass.
