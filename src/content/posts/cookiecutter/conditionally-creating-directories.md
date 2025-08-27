---
author: Anubhav Gain
category: cookiecutter
description: I wanted my [datasette-plugin](https://github.com/simonw/datasette-plugin)
  cookiecutter template to create empty `static` and `templates` directori...
draft: false
featured: false
lang: en
pubDatetime: '2024-06-21T18:26:50+05:30'
slug: conditionally-creating-directories-in-cookiecutter
tags:
- /
- cookiecutter
- python
- git
- web
title: Conditionally creating directories in cookiecutter
---

# Conditionally creating directories in cookiecutter

I wanted my [datasette-plugin](https://github.com/simonw/datasette-plugin) cookiecutter template to create empty `static` and `templates` directories if the user replied `y` to the `include_static_directory` and `include_templates_directory` prompts.

The solution was to add a `hooks/post_gen_project.py` script containing the following:

```python
import os
import shutil


include_static_directory = bool("{{ cookiecutter.include_static_directory }}")
include_templates_directory = bool("{{ cookiecutter.include_templates_directory }}")


if include_static_directory:
    os.makedirs(
        os.path.join(
            os.getcwd(),
            "datasette_{{ cookiecutter.underscored }}",
            "static",
        )
    )


if include_templates_directory:
    os.makedirs(
        os.path.join(
            os.getcwd(),
            "datasette_{{ cookiecutter.underscored }}",
            "templates",
        )
    )
```

Note that these scripts are run through the cookiecutter Jinja template system, so they can use `{{ }}` Jinja syntax to read cookiecutter inputs.
