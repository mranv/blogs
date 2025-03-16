---
author: Anubhav Gain
pubDatetime: 2024-05-05T10:00:00Z
modDatetime: 2024-05-05T10:00:00Z
title: Production-Grade Kubernetes on CoreOS - Multi-Node Deployment Guide
slug: kubernetes-coreos-production-deployment
featured: true
draft: false
tags:
  - kubernetes
  - coreos
  - cri-o
  - security
  - devops
  - container
  - selinux
description: A comprehensive guide for deploying a secure, production-grade Kubernetes cluster on CoreOS with CRI-O runtime, SELinux integration, and robust networking using kube-router.
---

# Production-Grade Kubernetes on CoreOS - Multi-Node Deployment Guide

Deploying Kubernetes in production environments requires careful consideration of security, stability, and scalability. Fedora CoreOS provides an excellent foundation for Kubernetes deployments due to its minimal, immutable nature and built-in security features. This guide walks you through creating a production-ready Kubernetes cluster on CoreOS with enhanced security.

## Security Overview

This deployment includes several security enhancements:

- **SELinux enabled** by default for mandatory access control
- **CRI-O container runtime** with strong SELinux integration
- **Secure node communication** through kubeadm's built-in PKI infrastructure
- **Network security** with kube-router for network policy enforcement
- **Immutable infrastructure** principles through CoreOS design

## Prerequisites

Before you begin, ensure you have:

- Fedora CoreOS qcow2 image ([download here](https://getfedora.org/coreos/download/))
- A host with `podman`, `libvirt`, and `virt-install` tools installed
- SSH key pair generated (`ssh-keygen -t ed25519`)

Hardware requirements per node:

- 2+ vCPUs
- 4GB+ RAM
- 10GB+ storage (20GB+ recommended for production)

## Initial Configuration

### 1. Create Butane Configuration

Butane is CoreOS's configuration transpiler. Create a file named `fcos.bu`:

```yaml
variant: fcos
version: 1.4.0
storage:
  files:
    # CRI-O Configuration
    - path: /etc/dnf/modules.d/cri-o.module
      mode: 0644
      overwrite: true
      contents:
        inline: |
          [cri-o]
          name=cri-o
          stream=1.17
          profiles=
          state=enabled

    # Kubernetes Repository
    - path: /etc/yum.repos.d/kubernetes.repo
      mode: 0644
      overwrite: true
      contents:
        inline: |
          [kubernetes]
          name=Kubernetes
          baseurl=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/
          enabled=1
          gpgcheck=1
          gpgkey=https://pkgs.k8s.io/core:/stable:/v1.28/rpm/repodata/repomd.xml.key

    # Network Configuration
    - path: /etc/modules-load.d/br_netfilter.conf
      mode: 0644
      overwrite: true
      contents:
        inline: br_netfilter

    # Kubernetes Network Parameters
    - path: /etc/sysctl.d/kubernetes.conf
      mode: 0644
      overwrite: true
      contents:
        inline: |
          net.bridge.bridge-nf-call-iptables=1
          net.ipv4.ip_forward=1
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - YOUR_SSH_PUBLIC_KEY_HERE
```

Replace `YOUR_SSH_PUBLIC_KEY_HERE` with the content of your public SSH key.

### 2. Generate Ignition Configuration

Convert the Butane configuration to an Ignition file:

```bash
podman run --interactive --rm \
  quay.io/coreos/butane:release \
  --pretty --strict < fcos.bu > fcos.ign
```

### 3. Create VM Deployment Script

Create a script named `start_fcos.sh` to launch CoreOS VMs:

```bash
#!/bin/sh

IGN_CONFIG=/path/to/fcos.ign
IMAGE=/path/to/fedora-coreos.qcow2
VM_NAME=node$1
VCPUS=2
RAM_MB=4096
DISK_GB=20
STREAM=stable

chcon --verbose --type svirt_home_t ${IGN_CONFIG}
virt-install --connect="qemu:///system" --name="${VM_NAME}" \
    --vcpus="${VCPUS}" --memory="${RAM_MB}" \
    --os-variant="fedora-coreos-$STREAM" --import --graphics=none \
    --disk="size=${DISK_GB},backing_store=${IMAGE}" \
    --qemu-commandline="-fw_cfg name=opt/com.coreos/config,file=${IGN_CONFIG}"
```

Make the script executable:

```bash
chmod +x start_fcos.sh
```

## Node Setup

### 1. Launch VMs

Start your cluster nodes. For a basic production setup, you'll need at least three nodes (one control plane and two workers):

```bash
# Launch in separate terminals or tmux panes
./start_fcos.sh 1  # Control plane
./start_fcos.sh 2  # Worker
./start_fcos.sh 3  # Worker
```

Note the IP addresses assigned to each VM during boot.

### 2. Configure Host Resolution

Add the node IP addresses to your host's `/etc/hosts` file for easier access:
