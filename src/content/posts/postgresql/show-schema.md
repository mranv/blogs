---
author: Anubhav Gain
category: postgresql
description: This took me longer to figure out than I care to admit.
draft: false
featured: false
lang: en
pubDatetime: '2024-04-20T14:22:41+05:30'
slug: show-the-sql-schema-for-a-postgresql-database
tags:
- /
- postgresql
- database
- web
title: Show the SQL schema for a PostgreSQL database
---

# Show the SQL schema for a PostgreSQL database

This took me longer to figure out than I care to admit.

    pg_dump -s name-of-database

Surprisingly there doesn't seem to be an easy way to do this using a `SELECT` statement within PostgreSQL itself.

StackOverflow [offers up](https://stackoverflow.com/a/16154183) a terrifying 72 line SQL monstrosity that attempts to recreate the `CREATE TABLE` for a given table.
