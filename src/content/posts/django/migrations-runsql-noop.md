---
author: Anubhav Gain
category: django
description: '`migrations.RunSQL.noop` provides an easy way to create "reversible"
  Django SQL migrations, where the reverse operation does nothing (but keeps it ...'
draft: false
featured: false
lang: en
pubDatetime: '2024-03-12T15:22:57+05:30'
slug: migrationsrunsqlnoop-for-reversible-sql-migrations
tags:
- /
- django
- python
- database
title: migrations.RunSQL.noop for reversible SQL migrations
---

# migrations.RunSQL.noop for reversible SQL migrations

`migrations.RunSQL.noop` provides an easy way to create "reversible" Django SQL migrations, where the reverse operation does nothing (but keeps it possible to reverse back to a previous migration state without being blocked by an irreversible migration).

```python
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0114_last_migration"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                update concordance_identifier
                set authority = replace(authority, ':', '_')
                where authority like '%:%'
            """,
            reverse_sql=migrations.RunSQL.noop,
        )
    ]
```
