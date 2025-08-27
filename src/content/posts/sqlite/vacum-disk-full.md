---
author: Anubhav Gain
category: sqlite
description: 'I was trying to run `VACUUM` against a large SQLite database file (~7GB)
  using `sqlite-utils vacuum data.db` and I got this error:'
draft: false
featured: false
lang: en
pubDatetime: '2024-05-18T08:22:22+05:30'
slug: sqlite-vacuum-database-or-disk-is-full
tags:
- /
- sqlite
- database
title: 'SQLite VACUUM: database or disk is full'
---

# SQLite VACUUM: database or disk is full

I was trying to run `VACUUM` against a large SQLite database file (~7GB) using `sqlite-utils vacuum data.db` and I got this error:

    sqlite3.OperationalError: database or disk is full

The `/data` volume that the database lived in was 20GB in size, so there should have been enough room to run the operation.

I realized that this was because VACUUM uses the `/tmp` directory, and on this machine that was on a separate volume that did not have enough space.

The fix was to set the `SQLITE_TMPDIR` environment variable to the current directory (or any directory on a volume with enough space):

    SQLITE_TMPDIR=/data sqlite-utils vacuum data.db
