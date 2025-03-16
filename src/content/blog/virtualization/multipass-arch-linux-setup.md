---
author: Anubhav Gain
pubDatetime: 2024-04-30T10:00:00Z
modDatetime: 2024-04-30T10:00:00Z
title: Setting Up Multipass on Arch Linux - Complete Guide
slug: multipass-arch-linux-setup
featured: false
draft: false
tags:
  - virtualization
  - multipass
  - arch-linux
  - ubuntu
  - devops
  - containers
description: A comprehensive guide to installing and configuring Multipass on Arch Linux, including troubleshooting tips, security considerations, and practical usage examples.
---

# Setting Up Multipass on Arch Linux - Complete Guide

[Multipass](https://multipass.run/) provides a streamlined way to launch and manage Ubuntu virtual machines on Linux, macOS, and Windows. While it's officially supported on Ubuntu, this guide walks through installing and configuring Multipass on Arch Linux, enabling you to quickly spin up development environments and test deployments.

## Prerequisites

Before starting, ensure you have:

- An Arch Linux system with sudo privileges
- The `base-devel` package group installed
- An internet connection for downloading packages

## Installation Steps

### 1. Install Required Dependencies

First, install the necessary packages from the official repositories:

```bash
sudo pacman -S qemu-base libvirt dnsmasq apparmor edk2-ovmf git cmake gcc
```

These packages provide:

- QEMU - The virtualization platform Multipass uses
- libvirt - Virtualization API
- dnsmasq - For VM networking
- AppArmor - Security module for access control
- edk2-ovmf - UEFI firmware for VMs
- git, cmake, gcc - Required for building Multipass from AUR

### 2. Set Up System Services

Enable and start the required system services:

```bash
# Enable and start libvirt
sudo systemctl enable --now libvirtd.service

# Enable and start AppArmor
sudo systemctl enable --now apparmor.service
```

### 3. Configure User Permissions

Add your user to the necessary groups to allow VM management without sudo:

```bash
sudo usermod -a -G libvirt,kvm $USER
```

> **Important**: Log out and back in for these group changes to take effect.

### 4. Configure OVMF for UEFI Support

Set up the OVMF firmware for QEMU:

```bash
sudo mkdir -p /usr/share/qemu
sudo ln -s /usr/share/edk2/x64/OVMF.fd /usr/share/qemu/OVMF.fd
```

### 5. Install Multipass from AUR

Using an AUR helper (like yay):

```bash
yay -S canonical-multipass
```

Or manually:

```bash
git clone https://aur.archlinux.org/canonical-multipass.git
cd canonical-multipass
makepkg -si
```

### 6. Start Multipass Service

Enable and start the Multipass daemon:

```bash
sudo systemctl enable --now multipassd.service
```

### 7. Verify Installation

Confirm that Multipass is installed correctly:

```bash
multipass version
multipass list
```

## Usage Examples

### Launching Ubuntu Instances

#### Basic Instance

Create a default Ubuntu 20.04 LTS instance:

```bash
multipass launch 20.04 --name my-instance
```

#### High-Resource Development Instance

Create an instance with custom resources:

```bash
multipass launch 20.04 --name dev-instance --cpus 4 --memory 8G --disk 50G
```

### Managing Instances

#### List All Instances

View all your Multipass instances:

```bash
multipass list
```

#### Access Instance Shell

Connect to an instance's terminal:

```bash
multipass shell instance-name
```

#### Stopping an Instance

Pause a running instance:

```bash
multipass stop instance-name
```

#### Deleting an Instance

Remove instances you no longer need:

```bash
multipass delete instance-name
multipass purge  # Remove deleted instances completely
```

## Troubleshooting

### OVMF Firmware Issues

If you encounter errors related to OVMF.fd:

```bash
# Verify OVMF installation
ls -l /usr/share/edk2/x64/OVMF.fd

# Recreate symlink if needed
sudo rm /usr/share/qemu/OVMF.fd
sudo ln -s /usr/share/edk2/x64/OVMF.fd /usr/share/qemu/OVMF.fd
```

### Service Connection Issues

If Multipass fails to connect to the daemon:

```bash
# Check service status
systemctl status multipassd

# Check logs
journalctl -u multipassd

# Restart service
sudo systemctl restart multipassd
```

### Permission Issues

For permission-related errors:

```bash
# Verify group membership
groups | grep -E "libvirt|kvm"

# Fix permissions if needed
sudo chmod 666 /dev/kvm
```

## Security Considerations

### AppArmor Profiles

Ensure AppArmor is properly configured:

```bash
# Verify profiles are loaded
aa-status | grep multipass
```

### Network Security

- Default networking is NAT-based for isolation
- Consider setting up dedicated network bridges for production use

### Resource Limits

- Set appropriate resource limits to prevent denial of service conditions
- Monitor resource usage with:

```bash
multipass info instance-name
```

### Access Control

- Use standard Linux permissions
- Consider implementing additional QEMU security features for sensitive environments

## Maintenance

### Updating Multipass

Keep Multipass updated with:

```bash
yay -Syu canonical-multipass
```

### Backing Up Instance Data

Back up your instance data:

```bash
multipass stop instance-name
cp -r /var/lib/multipass/data/instance-name backup/
```

### Regular Clean-Up

Perform maintenance to free up resources:

```bash
# Remove old instances
multipass delete unused-instance
multipass purge

# Clear cache
rm -rf ~/.cache/multipass
```

## Advanced Configuration

### Custom Image Source

Use a different Ubuntu image server:

```bash
multipass set local.image-servers="https://cloud-images.ubuntu.com/releases/"
```

### Shared Folders

Mount a host directory in your instance:

```bash
multipass mount /path/to/host/directory instance-name:/path/in/instance
```

### Bridged Networking

For direct network access, use a bridge:

```bash
# First create a bridge using netctl or systemd-networkd
# Then launch with:
multipass launch --network bridge=br0
```

## Conclusion

Multipass offers a lightweight alternative to traditional virtualization tools, making it perfect for development and testing. While not officially supported on Arch Linux, following this guide provides a stable and functional installation for quickly spinning up Ubuntu instances.

With Multipass configured on your Arch Linux system, you can now create consistent development environments, test deployments across different Ubuntu versions, and isolate projects within individual VMs.
