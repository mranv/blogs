---
author: Anubhav Gain
pubDatetime: 2024-05-03T13:00:00Z
modDatetime: 2024-05-03T13:00:00Z
title: Single Node Kubernetes on CoreOS - Complete Setup Guide
slug: single-node-coreos-kubernetes-setup
featured: false
draft: false
tags:
  - kubernetes
  - coreos
  - fedora
  - devops
  - container
  - virtualization
  - tutorial
description: A comprehensive step-by-step guide to setting up a single-node Kubernetes cluster on Fedora CoreOS, covering everything from VM creation to deploying your first application.
---

# Single Node Kubernetes on CoreOS - Complete Setup Guide

Setting up a lightweight, single-node Kubernetes environment is perfect for development, testing, and learning purposes. This guide walks you through deploying Kubernetes on Fedora CoreOS - a minimal, container-focused operating system designed for running containerized workloads.

We'll break this process into two main stages:

1. Setting up the CoreOS virtual machine
2. Installing and configuring Kubernetes

## Prerequisites

Before starting, ensure you have the following on your host system:

- Fedora CoreOS qcow2 image ([download here](https://getfedora.org/coreos/download/))
- podman installed (`dnf install podman`)
- libvirt and virt-install tools (`dnf install libvirt virt-install`)
- A generated SSH key pair (`ssh-keygen -t ed25519`)

## Stage 1: Basic CoreOS Setup

### 1. Create Basic Ignition Config

Ignition is the CoreOS configuration system. Create a file named `basic.bu`:

```yaml
variant: fcos
version: 1.4.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - YOUR_SSH_PUBLIC_KEY_HERE

storage:
  files:
    - path: /etc/hostname
      mode: 0644
      contents:
        inline: |
          k8s-node
```

Replace `YOUR_SSH_PUBLIC_KEY_HERE` with the content of your `~/.ssh/id_ed25519.pub` file.

### 2. Generate Ignition File

Convert the Butane configuration to an Ignition file:

```bash
podman run --interactive --rm \
  quay.io/coreos/butane:release \
  --pretty --strict < basic.bu > basic.ign
```

### 3. Create VM Script

Create a script named `start-node.sh` to launch your CoreOS VM:

```bash
#!/bin/sh

IGN_CONFIG=/path/to/basic.ign
IMAGE=/path/to/fedora-coreos.qcow2
VM_NAME=k8s-node
VCPUS=2
RAM_MB=4096
DISK_GB=20
STREAM=stable

chcon --verbose --type svirt_home_t ${IGN_CONFIG}
virt-install --connect="qemu:///system" \
    --name="${VM_NAME}" \
    --vcpus="${VCPUS}" \
    --memory="${RAM_MB}" \
    --os-variant="fedora-coreos-$STREAM" \
    --import --graphics=none \
    --disk="size=${DISK_GB},backing_store=${IMAGE}" \
    --qemu-commandline="-fw_cfg name=opt/com.coreos/config,file=${IGN_CONFIG}"
```

Update the paths to your Ignition config file and CoreOS image.

### 4. Launch VM

```bash
chmod +x start-node.sh
./start-node.sh
```

### 5. Note VM IP Address

During boot, you'll see network information. Look for a line showing the IP address assigned to the VM:
