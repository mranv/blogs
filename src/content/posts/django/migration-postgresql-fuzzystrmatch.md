---
author: Anubhav Gain
category: django
description: The PostgreSQL [fuzzystrmatch extension](https://www.postgresql.org/docs/13/fuzzystrmatch.html)
  enables several functions for fuzzy string matching...
draft: false
featured: false
lang: en
pubDatetime: '2024-02-12T12:47:51+05:30'
slug: enabling-the-fuzzystrmatch-extension-in-postgresql-with-a-django-migration
tags:
- /
- django
- python
- database
- web
title: Enabling the fuzzystrmatch extension in PostgreSQL with a Django migration
---

# Enabling the fuzzystrmatch extension in PostgreSQL with a Django migration

The PostgreSQL [fuzzystrmatch extension](https://www.postgresql.org/docs/13/fuzzystrmatch.html) enables several functions for fuzzy string matching: `soundex()`, `difference()`, `levenshtein()`, `levenshtein_less_equal()`, `metaphone()`, `dmetaphone()` and `dmetaphone_alt()`.

Enabling them for use with Django turns out to be really easy - it just takes a migration that looks something like this:

```python
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0089_importrun_sourcelocation"),
    ]

    operations = [
        CreateExtension(name="fuzzystrmatch"),
    ]
```
