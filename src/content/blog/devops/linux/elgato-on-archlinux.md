---
author: Anubhav Gain
pubDatetime: 2024-04-13T08:34:00Z
modDatetime: 2024-04-13T08:34:00Z
title: Elgato on Archlinux
slug: elgato-on-archlinux
featured: true
draft: false
tags:
  - linux
  - elgato
description: Guide on setting up the Elgato Streamdeck on Arch Linux, including installing necessary packages, configuring the environment, and accessing Elgato devices.
---

# Elgato Streamdeck on Arch Linux

<img alt="Guangzhou, China" src="/assets/images/photo-kt443t6d_64hdh43hfh6dgjdfhg4_d-a6ea9c37592199bec87ef0a289a7fd91.jpg" width="1500" height="622">

## Streamdeck UI

To utilize the Elgato Streamdeck on Arch Linux, follow these steps:

### Install hidapi

```bash
sudo pacman -S hidapi python-pip qt6-base
```

Packages installed:

- hidapi-0.13.1-1
- python-pip-23.0-1
- qt6-base-6.4.2-1

### Set Path

Add `~/.local/bin` to your path by appending the following line to your `.bashrc`, `.zshrc`, or equivalent:

```bash
PATH=$PATH:$HOME/.local/bin
```

### Prepare the Python Environment

```bash
python -m pip install --upgrade pip
python -m pip install setuptools
```

### Configure access to Elgato devices

Create a file called `/etc/udev/rules.d/70-streamdeck.rules` with the following content:

```bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```

Apply the rule immediately:

```bash
sudo udevadm trigger
```

### Install and Start Stream Deck UI

```bash
python -m pip install streamdeck-ui --user
streamdeck
```

<img alt="Elgato Streamdeck on Arch Linux" src="/assets/images/Elgato_Streamdeck_on_Arch_Linux_01-224c434dc64584d69e4f60bd344f4b10.png" width="934" height="514">

Now you should be able to use the Elgato Streamdeck on your Arch Linux system.
