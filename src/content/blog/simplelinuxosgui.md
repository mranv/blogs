---
author: Anubhav Gain
pubDatetime: 2024-04-09T03:49:00+05:30
modDatetime: 2024-06-14T14:29:00+05:30
title: This is a simple, lightweight GUI-based Linux distribution designed to run on QEMU.
slug: simple-gui-linux-os
featured: true
draft: false
tags:
  - linux
  - linux kernel
  - operating system
  - distro
  - lightweight distro
  - busybox
  - nano-x
  - microwindows
  - qemu
  - gui
  - graphical interface
  - custom linux
  - embedded linux
  - open source
  - unix utilities
  - minimalistic os
  - linux from scratch
  - linux development
  - linux kernel compilation
  - linux system
description: This is a simple, lightweight GUI-based Linux distribution designed to run on QEMU.
---

<img src="\assets\blog-images\simplelinuxgui.png" class="sm:w-1/2 mx-auto" alt="Anubhav Gain">

# Custom Linux Kernel and BusyBox Setup

Welcome to the guide where we embark on a journey to build our very own custom Linux kernel and BusyBox, because why settle for pre-packaged when you can have it your way? Get ready to dive into the world of minimalistic and customizable Linux operating systems!

## Step-by-Step Instructions

### Step 1: Install Dependencies

First things first, let's make sure we have all the necessary tools and packages. Run the following command:

```sh
sudo apt update && sudo apt install wget bzip2 libncurses-dev flex bison bc libelf-dev libssl-dev xz-utils autoconf gcc make libtool git vim libpng-dev libfreetype-dev g++ extlinux nano
```

### Step 2: Download and Prepare the Linux Kernel

1. **Download the Linux Kernel:**

   ```sh
   wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.9.4.tar.xz
   ```

2. **Extract the Kernel:**

   ```sh
   tar xf linux-6.9.4.tar.xz
   cd linux-6.9.4
   ```

3. **Configure the Kernel:**

   ```sh
   make menuconfig
   ```

4. **Compile the Kernel:**

   ```sh
   make -j 4
   ```

5. **Create a Directory for the Distro:**
   ```sh
   mkdir /distro
   cp arch/x86/boot/bzImage /distro/
   ```

### Step 3: Set Up BusyBox

1. **Download BusyBox:**

   ```sh
   cd ~
   wget https://busybox.net/downloads/busybox-1.36.1.tar.bz2
   ```

2. **Extract BusyBox:**

   ```sh
   tar xf busybox-1.36.1.tar.bz2
   cd busybox-1.36.1
   ```

3. **Configure BusyBox:**

   ```sh
   make menuconfig
   ```

4. **Compile and Install BusyBox:**
   ```sh
   make -j 4
   make CONFIG_PREFIX=/distro install
   ```

### Step 4: Set Up MicroWindows

1. **Clone MicroWindows:**

   ```sh
   git clone https://github.com/ghaerr/microwindows
   cd microwindows/src/
   ```

2. **Configure MicroWindows:**

   ```sh
   cp Configs/config.linux-fb config
   nano config
   ```

3. **Compile MicroWindows:**

   ```sh
   make -j 4
   make install
   make x11-demo
   ```

4. **Set Up a Sample GUI Application:**

   ```sh
   mkdir x11-demo
   cd x11-demo/
   nano gui.c
   ```

5. **Compile the GUI Application:**
   ```sh
   cd ..
   mv x11-demo /distro/
   cd /distro/x11-demo/
   gcc gui.c -lNX11 -lnano-X -I /microwindows/src/nx11/X11-local/
   mv a.out /distro/nirs-test-app
   ```

### Step 5: Prepare the Distro Environment

1. **Create Necessary Directories:**

   ```sh
   mkdir -p /distro/lib/x86_64-linux-gnu/
   mkdir /distro/lib64
   ```

2. **Copy Required Libraries:**

   ```sh
   cp /lib/x86_64-linux-gnu/libpng16.so.16 /distro/lib/x86_64-linux-gnu/libpng16.so.16
   cp /lib/x86_64-linux-gnu/libz.so.1 /distro/lib/x86_64-linux-gnu/libz.so.1
   cp /lib/x86_64-linux-gnu/libfreetype.so.6 /distro/lib/x86_64-linux-gnu/libfreetype.so.6
   cp /lib/x86_64-linux-gnu/libc.so.6 /distro/lib/x86_64-linux-gnu/libc.so.6
   cp /lib/x86_64-linux-gnu/libm.so.6 /distro/lib/x86_64-linux-gnu/libm.so.6
   cp /lib/x86_64-linux-gnu/libbrotlidec.so.1 /distro/lib/x86_64-linux-gnu/libbrotlidec.so.1
   cp /lib64/ld-linux-x86-64.so.2 /distro/lib64/ld-linux-x86-64.so.2
   cp /lib/x86_64-linux-gnu/libbrotlicommon.so.1 /distro/lib/x86_64-linux-gnu/libbrotlicommon.so.1
   ```

3. **Copy Nano-X Binaries:**
   ```sh
   cp -r /microwindows/src/bin /distro/nanox
   cp /microwindows/src/runapp /distro/nanox/
   ```

### Step 6: Create the Bootable Image

1. **Create and Format the Image:**

   ```sh
   cd /distro/
   truncate -s 200MB boot.img
   mkfs boot.img
   mkdir mnt
   mount boot.img mnt
   ```

2. **Install Extlinux:**

   ```sh
   extlinux -i mnt/
   ```

3. **Copy Files to the Image:**

   ```sh
   mv bin bzImage lib lib64 linuxrc nanox nirs-test-app sbin usr mnt
   ```

4. **Create Additional Directories:**

   ```sh
   cd mnt/
   mkdir var etc root dev tmp proc
   ```

5. **Unmount the Image:**
   ```sh
   cd ..
   umount mnt
   ```

### Release Notes

#### Simple GUI-Based Linux Distro - Version 1.0

**Overview:**
This release marks the initial version of our simple GUI-based Linux distribution, developed to run on QEMU. This distribution leverages the Linux kernel, BusyBox for essential Unix utilities, and Nano-X for graphical capabilities. This lightweight and efficient distro provides a basic graphical user interface and can serve as a foundational base for further customization and development.

**Key Features:**

- Linux Kernel 6.9.4
- BusyBox 1.36.1
- Nano-X/MicroWindows
- Sample GUI Application (`nirs-test-app`)

**Installation Instructions:**

1. Install dependencies.
2. Download and compile the Linux kernel.
3. Setup BusyBox.
4. Setup MicroWindows.
5. Prepare the distro environment.
6. Create a bootable image.

**Known Issues:**

- Limited GUI capabilities.
- Hardware compatibility primarily tested on QEMU.

**Future Plans:**

- Enhance GUI features.
- Broader hardware support.
- Provide detailed documentation.

**Resources:**

- [Linux Kernel](https://www.kernel.org/)
- [BusyBox](https://busybox.net/)
- [MicroWindows](https://github.com/ghaerr/microwindows)
- [X11 Hello](https://gist.github.com/nir9/098d83c7...)

**Acknowledgments:**
We extend our gratitude to the open-source community and the developers of the Linux kernel, BusyBox, and MicroWindows for their invaluable contributions.

---

\_Contributors: [@mranv](https://github.com/mranv)

---
