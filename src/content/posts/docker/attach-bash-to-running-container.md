---
author: Anubhav Gain
category: docker
description: 'Use `docker ps` to find the container ID:'
draft: false
featured: false
lang: en
pubDatetime: '2024-07-31T08:21:39+05:30'
slug: attaching-a-bash-shell-to-a-running-docker-container
tags:
- /
- docker
- git
- cli
title: Attaching a bash shell to a running Docker container
---

# Attaching a bash shell to a running Docker container

Use `docker ps` to find the container ID:

    $ docker ps
    CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS               NAMES
    81b2ad3194cb        alexdebrie/livegrep-base:1   "/livegrep-github-re…"   2 minutes ago       Up 2 minutes                            compassionate_yalow

Run `docker exec -it ID bash` to start a bash session in that container:

    $ docker exec -it 81b2ad3194cb bash

I made the mistake of using `docker attach 81b2ad3194cb` first, which attaches you to the command running as CMD in that conatiner, and means that if you hit `Ctrl+C` you exit that command and terminate the container!
