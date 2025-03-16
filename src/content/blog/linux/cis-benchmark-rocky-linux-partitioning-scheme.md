---
author: Anubhav Gain
pubDatetime: 2024-04-24T14:00:00Z
modDatetime: 2024-04-24T14:00:00Z
title: CIS Benchmark-Aligned Partitioning Scheme for Rocky Linux 9.5
slug: cis-benchmark-rocky-linux-partitioning-scheme
featured: true
draft: false
tags:
  - linux
  - rocky-linux
  - security
  - cis-benchmark
  - hardening
  - partitioning
  - system-administration
description: A comprehensive guide to creating a secure, CIS Benchmark-compliant partitioning scheme for Rocky Linux 9.5 installations with 400 GiB of storage.
---

# CIS Benchmark-Aligned Partitioning Scheme for Rocky Linux 9.5

To align your **Rocky Linux 9.5 installation** with **CIS Benchmark recommendations** and fully utilize **400 GiB of storage**, follow this **partitioning scheme** and **filesystem recommendations**.

---

## 📌 Partitioning Plan (CIS Benchmark Aligned)

| **Partition**       | **Size**  | **Filesystem** | **Mount Options**                   | **Purpose** |
|---------------------|-----------|---------------|-------------------------------------|-------------|
| `/boot`            | 1024 MiB | `ext4`        | `nodev, noexec, nosuid`            | Bootloader partition |
| `/home`            | 100 GiB  | `xfs`         | `nodev`                            | User data storage |
| `/var`             | 40 GiB   | `xfs`         | `nodev`                            | App & system logs |
| `/var/log`         | 60 GiB   | `xfs`         | `nodev`                            | System logs |
| `/var/log/audit`   | 15 GiB   | `xfs`         | `nodev`                            | Security audit logs |
| `/var/tmp`         | 20 GiB   | `xfs`         | `nodev, noexec, nosuid`            | Temporary storage |
| `/tmp`             | 20 GiB   | `xfs`         | `nodev, noexec, nosuid`            | Prevent script execution in `/tmp` |
| `/srv`             | 30 GiB   | `xfs`         | `nodev`                            | Application data |
| `/opt`             | 30 GiB   | `xfs`         | `nodev`                            | Third-party software |
| `/swap`            | 16 GiB   | `swap`        | *N/A*                              | Virtual memory swap |
| `/` (root)         | **88 GiB** | `xfs`         | Default                            | Main OS partition |

**Total Used**: 400 GiB ✅

---

## 🔧 Filesystem Choices

| **Filesystem** | **Reason** |
|---------------|-----------|
| **XFS** (for most partitions) | Best for high-performance and large storage |
| **EXT4** (for `/boot`) | Needed for compatibility with bootloaders |
| **Swap** | Virtual memory |

---

## 📌 Security-Hardened `/etc/fstab` Configuration

```ini
UUID=<boot-uuid>    /boot         ext4  defaults,nodev,noexec,nosuid  1 2
UUID=<home-uuid>    /home         xfs   defaults,nodev                0 2
UUID=<var-uuid>     /var          xfs   defaults,nodev                0 2
UUID=<log-uuid>     /var/log      xfs   defaults,nodev                0 2
UUID=<audit-uuid>   /var/log/audit xfs  defaults,nodev                0 2
UUID=<tmp-uuid>     /tmp          xfs   defaults,nodev,noexec,nosuid  0 2
UUID=<vtmp-uuid>    /var/tmp      xfs   defaults,nodev,noexec,nosuid  0 2
UUID=<srv-uuid>     /srv          xfs   defaults,nodev                0 2
UUID=<opt-uuid>     /opt          xfs   defaults,nodev                0 2
UUID=<root-uuid>    /             xfs   defaults                      0 1
UUID=<swap-uuid>    swap          swap  defaults                      0 0
```
> 📝 **Replace `<UUID>` with actual disk UUIDs using `blkid` command**

---

## 🛠 Steps to Configure During Installation

1. **Manual Partitioning**: Choose "Custom Partitioning" in Rocky Linux installer.
2. **Format the Partitions**:
   - Set `/boot` as **ext4**.
   - Set all other partitions as **XFS**.
   - Set swap as **swap**.
3. **Assign Mount Points** as per the table.
4. **Apply Mount Options**:
   - Click on **Modify Mount Options** → Set `nodev, noexec, nosuid` as needed.
5. **Confirm Total Usage is ~400 GiB** and proceed with installation.

---

## 🔍 Additional Hardening

✔ **Enable Automatic `fsck` (Filesystem Check) on Boot**
✔ **Ensure SELinux is Enforcing (`getenforce` should return `Enforcing`)**
✔ **Set correct file permissions (`chmod 1777 /tmp /var/tmp`)**

---

## 🔥 Final Thoughts

- ✅ **This layout follows CIS Benchmark best practices**.
- ✅ **Provides security, prevents attacks on `/tmp`, and separates logs**.
- ✅ **Optimized for server use** (Rocky Linux, CentOS, RHEL-based).
- ✅ **Will scale well for both production and development workloads**.

## Automation with Ansible

This partitioning scheme can be automated using Ansible for consistent deployments across multiple servers. A basic playbook structure would include:

```yaml
---
- name: Configure CIS-compliant partitioning
  hosts: rocky_servers
  become: true
  tasks:
    - name: Install required packages
      dnf:
        name:
          - parted
          - lvm2
        state: present

    - name: Configure partitions
      block:
        - name: Create partitions
          # Commands to create partitions
          # This would typically involve parted commands

        - name: Format partitions
          # Format each partition with the correct filesystem

        - name: Update fstab
          # Add entries to /etc/fstab

        - name: Set correct permissions
          file:
            path: "{{ item }}"
            mode: '1777'
          with_items:
            - /tmp
            - /var/tmp
```

For production use, a more detailed playbook with proper error handling and idempotence checks would be necessary.

By following this partitioning scheme and security recommendations, you'll have a solid foundation for a secure Rocky Linux 9.5 server that aligns with CIS Benchmark standards.
