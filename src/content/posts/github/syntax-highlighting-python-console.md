---
author: Anubhav Gain
category: github
description: 'It turns out [GitHub Flavored Markdown](https://github.github.com/gfm/)
  can apply syntax highlighting to Python console examples, like this one:'
draft: false
featured: false
lang: en
pubDatetime: '2024-02-02T10:56:50+05:30'
slug: syntax-highlighting-python-console-examples-with-gfm
tags:
- /
- github
- python
- git
- web
title: Syntax highlighting Python console examples with GFM
---

# Syntax highlighting Python console examples with GFM

It turns out [GitHub Flavored Markdown](https://github.github.com/gfm/) can apply syntax highlighting to Python console examples, like this one:

```python
>>> import csv
>>> with open('eggs.csv', newline='') as csvfile:
...     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
...     for row in spamreader:
...         print(', '.join(row))
Spam, Spam, Spam, Spam, Spam, Baked Beans
Spam, Lovely Spam, Wonderful Spam
```

The trick is to use the following:

````
```python
>>> import csv
>>> with open('eggs.csv', newline='') as csvfile:
...     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
...     for row in spamreader:
...         print(', '.join(row))
Spam, Spam, Spam, Spam, Spam, Baked Beans
Spam, Lovely Spam, Wonderful Spam
```
````
I figured out the `pycon` code by scanning through the [languages.yml](https://github.com/github/linguist/blob/v7.12.2/lib/linguist/languages.yml#L4406-L4414) file for linguist, the library GitHub use for their syntax highlighting.

While writing this TIL I also learned how to embed triple-backticks in a code block - you surround the block with more-than-three backticks (thanks to [this tip](https://github.com/jonschlinkert/remarkable/issues/146#issuecomment-85539428)):


`````
````
```python
>>> import csv
>>> with open('eggs.csv', newline='') as csvfile:
...     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
...     for row in spamreader:
...         print(', '.join(row))
Spam, Spam, Spam, Spam, Spam, Baked Beans
Spam, Lovely Spam, Wonderful Spam
```
````
`````
