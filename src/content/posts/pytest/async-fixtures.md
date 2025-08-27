---
author: Anubhav Gain
category: pytest
description: I wanted to use a fixture with `pytest-asyncio` that was itsef as `async
  def` function, so that it could execute `await` statements.
draft: false
featured: false
lang: en
pubDatetime: '2024-06-29T18:52:01+05:30'
slug: async-fixtures-with-pytest-asyncio
tags:
- /
- pytest
- python
- database
- testing
title: Async fixtures with pytest-asyncio
---

# Async fixtures with pytest-asyncio

I wanted to use a fixture with `pytest-asyncio` that was itsef as `async def` function, so that it could execute `await` statements.

Since I'm using a `pytest.ini` file containing `asyncio_mode = strict` I had to use the `@pytest_asyncio.fixture` fixture to get this to work. Without that fixture I got this error:

```
    assert _has_explicit_asyncio_mark(fixturedef.func)
E   AssertionError: assert False
E    +  where False = _has_explicit_asyncio_mark(<function ds_with_route at 0x11332d2d0>)
E    +    where <function ds_with_route at 0x11332d2d0> = <FixtureDef argname='ds_with_route' scope='function' baseid='tests/test_routes.py'>.func
```

Swapping `@pytest.fixture` for `@pytest_asyncio.fixture` fixed this problem:

```python
import pytest_asyncio

@pytest_asyncio.fixture
async def ds_with_route():
    ds = Datasette()
    db = Database(ds, is_memory=True, memory_name="route-name-db")
    ds.add_database(db, name="name", route="route-name")
    await db.execute_write_script(
        """
        create table if not exists t (id integer primary key);
        insert or replace into t (id) values (1);
    """
    )
    return ds
```
