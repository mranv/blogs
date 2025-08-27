---
author: Anubhav Gain
category: macos
description: I grabbed [a quote](https://simonwillison.net/2023/Dec/1/jeremy-howard/)
  from a transcript of a snippet of a YouTube video today for my blog.
draft: false
featured: false
lang: en
pubDatetime: '2024-01-07T09:29:20+05:30'
slug: grabbing-a-transcript-of-a-short-snippet-of-a-youtube-video-with-macwhisper
tags:
- /
- macos
- git
- web
title: Grabbing a transcript of a short snippet of a YouTube video with MacWhisper
---

# Grabbing a transcript of a short snippet of a YouTube video with MacWhisper

I grabbed [a quote](https://simonwillison.net/2023/Dec/1/jeremy-howard/) from a transcript of a snippet of a YouTube video today for my blog.

I use the [MacWhisper](https://goodsnooze.gumroad.com/l/macwhisper) macOS desktop app to run Whisper. It's a very pleasant GUI wrapper around the Whisper transcription model.

Usually I pull a full YouTube video using [yt-dlp](https://github.com/yt-dlp/yt-dlp) and then drop the resulting `.mp4` file into MacWhisper to transcribe the whole thing.

Today I realized there's a faster way if I just want a transcript of a few minutes from the video:

1. Open MacWhisper
2. Hit the "New Recording" button and then "Start Recording"
3. Hit "Play" on the YouTube video
4. Wait until the end of the snippet and hit "Stop Recording" in MacWhisper
5. Hit "Transcribe Reporting" and wait a few seconds or minutes depending on the length of the snippet

Once the transcription is done you can hit the "Copy" button to copy out the text - I then usually drop it into VS Code to make a few minor edits.

Here's a GIF of the whole process:

![Animated GIF illustrating each of the above steps](https://static.simonwillison.net/static/2023/macwhisper.gif)
