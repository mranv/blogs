---
author: Anubhav Gain
pubDatetime: 2023-12-04T14:29:00+05:30
modDatetime: 2023-12-04T14:29:00+05:30
title: Simple Linux OS
slug: simple-linux-os
featured: true
draft: false
tags:
  - linux
description: Developed as a successor to the original Linux Kernal and Busybox based operating system.
---

  <img src="/assets/blog-images/linux.png" class="sm:w-1/2 mx-auto" alt="Anubhav Gain">

# Custom Linux Kernel and Busybox Setup

Welcome to the guide where we embark on a journey to build our very own custom Linux kernel and Busybox, because why settle for pre-packaged when you can have it your way? Get ready to dive into the world of minimalistic and customizable Linux operating systems!

## Step 1: Install Dependencies

First things first, let's make sure we have all the necessary tools and packages. Depending on your distribution, run one of the following commands:

- For Debian-based systems:

  ```bash
  sudo apt-get install bzip2 git vim make gcc libncurses-dev flex bison bc cpio libelf-dev libssl-dev syslinux dosfstools nano git
  ```

- For Fedora-based systems:
  ```bash
  sudo dnf install bzip2 git vim make gcc ncurses-devel flex bison bc cpio elfutils-libelf-devel openssl-devel syslinux dosfstools nano git
  ```

## Step 2: Clone the Linux Kernel Repository

Let's get our hands on the Linux Kernel source code. Clone Linus Torvalds' repository like a boss:

```bash
git clone --depth 1 https://github.com/torvalds/linux.git
cd linux
```

## Step 3: Configure the Kernel

Time to customize our kernel to fit our needs. Execute the following command and brace yourself for the configuration menu:

```bash
make menuconfig
```

Feel free to tweak the settings to your heart's content and then save your changes.

## Step 4: Build the Kernel

Let the compilation begin! Execute the following command to build your shiny new kernel:

```bash
make -j 4
```

Adjust the `-j` parameter according to your processor count for maximum efficiency.

## Step 5: Copy Kernel Image

Keep your precious kernel image safe. Create a cozy directory for it and copy the image there:

```bash
mkdir /boot-files
cp arch/x86/boot/bzImage /boot-files
```

## Step 6: Clone Busybox

Next up, let's grab Busybox for our userspace utilities. Clone the repository like a pro:

```bash
git clone --depth 1 https://git.busybox.net/busybox
cd busybox
```

## Step 7: Configure Busybox

Time to configure Busybox. Fire up the configuration menu:

```bash
make menuconfig
```

Select "Build static binary" because we like our binaries like we like our relationships – stable.

## Step 8: Build Busybox

Get ready to witness the magic. Build Busybox with this command:

```bash
make -j 4
```

## Step 9: Create Initramfs

Let's prep an initial RAM filesystem (initramfs) for our kernel to play with after boot:

```bash
mkdir /boot-files/initramfs
make CONFIG_PREFIX=/boot-files/initramfs install
cd /boot-files/initramfs/
nano init
```

Add the following content to the `init` file:

```bash
#!/bin/sh
/bin/sh
```

Then, let's do some cleanup and packing:

```bash
rm linuxrc
chmod +x init
find . | cpio -o -H newc > ../init.cpio
```

## Step 10: Prepare Boot Environment

Time to get our boot environment ready. Install syslinux and create a bootable file system:

```bash
sudo apt-get install syslinux
dd if=/dev/zero of=boot bs=1M count=50
ls
sudo apt-get install dosfstools
mkfs -t fat boot
syslinux boot
mkdir m && mount boot m
cp bzImage init.cpio m
```

## Step 11: Finalize Boot Environment

Finish up the boot setup by unmounting the file system:

```bash
umount m
```

And there you have it! Your custom Linux OS is ready to rock and roll. Just add the following configuration in the boot section:

```
boot: /bzImage -initrd=/init.cpio
```

Now sit back, relax, and watch your custom creation come to life. Happy hacking!

---

_Contributors: [@mranv](https://github.com/mranv), [@Teztarrar](https://github.com/Teztarrar)_
