---
author: Anubhav Gain
category: sqlite
description: 'I wanted to say "output this transformed value if it''s not null, otherwise
  nothing". The recipe I figured out was:'
draft: false
featured: false
lang: en
pubDatetime: '2024-07-31T16:32:23+05:30'
slug: null-case-comparisons-in-sqlite
tags:
- /
- sqlite
- javascript
- git
- database
- web
title: Null case comparisons in SQLite
---

# Null case comparisons in SQLite

I wanted to say "output this transformed value if it's not null, otherwise nothing". The recipe I figured out was:

```sql
  case
    when (media_url_https is not null) then json_object('img_src', media_url_https, 'width', 300)
  end as photo
```

Full query example:

```sql
select
  created_at,
  regexp_match('.*?(\d+(\.\d+))lb.*', full_text, 1) as lbs,
  full_text,
  case
    when (media_url_https is not null) then json_object('img_src', media_url_https, 'width', 300)
  end as photo
from
  tweets
  left join media_tweets on tweets.id = media_tweets.tweets_id
  left join media on media.id = media_tweets.media_id
where
  full_text like '%lb%'
  and user = 3166449535
  and lbs is not null
group by
  tweets.id
order by
  created_at
```
This uses [datasette-rure](https://github.com/simonw/datasette-rure) for the `regexp_match()` function. Example output here: https://twitter.com/simonw/status/1249400425138155523
