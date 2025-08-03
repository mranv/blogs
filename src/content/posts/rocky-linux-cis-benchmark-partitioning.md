---
author: Anubhav Gain
pubDatetime: 2025-03-01T20:15:00Z
title: "Rocky Linux 9.5 CIS Benchmark Partitioning Guide for 400GB Storage"
slug: rocky-linux-cis-benchmark-partitioning
featured: false
draft: false
tags:
  - rocky-linux
  - cis-benchmark
  - security
  - partitioning
  - linux
  - hardening
  - server-setup
description: "Complete partitioning scheme and security hardening guide for Rocky Linux 9.5 aligned with CIS Benchmark recommendations, optimized for 400GB storage."
---

# Rocky Linux 9.5 CIS Benchmark Partitioning Guide

To align your Rocky Linux 9.5 installation with CIS Benchmark recommendations and fully utilize 400 GiB of storage, follow this partitioning scheme and filesystem recommendations.

## 📌 Partitioning Plan (CIS Benchmark Aligned)

| Partition        | Size     | Filesystem | Mount Options           | Purpose                          |
| ---------------- | -------- | ---------- | ----------------------- | -------------------------------- |
| `/boot`          | 1024 MiB | ext4       | `nodev, noexec, nosuid` | Bootloader partition             |
| `/home`          | 100 GiB  | xfs        | `nodev`                 | User data storage                |
| `/var`           | 40 GiB   | xfs        | `nodev`                 | App & system logs                |
| `/var/log`       | 60 GiB   | xfs        | `nodev`                 | System logs                      |
| `/var/log/audit` | 15 GiB   | xfs        | `nodev`                 | Security audit logs              |
| `/var/tmp`       | 20 GiB   | xfs        | `nodev, noexec, nosuid` | Temporary storage                |
| `/tmp`           | 20 GiB   | xfs        | `nodev, noexec, nosuid` | Prevent script execution in /tmp |
| `/srv`           | 30 GiB   | xfs        | `nodev`                 | Application data                 |
| `/opt`           | 30 GiB   | xfs        | `nodev`                 | Third-party software             |
| `/swap`          | 16 GiB   | swap       | N/A                     | Virtual memory swap              |
| `/` (root)       | 88 GiB   | xfs        | Default                 | Main OS partition                |

**Total Used: 400 GiB ✅**

## 🔧 Filesystem Choices

| Filesystem                    | Reason                                      |
| ----------------------------- | ------------------------------------------- |
| **XFS** (for most partitions) | Best for high-performance and large storage |
| **EXT4** (for /boot)          | Needed for compatibility with bootloaders   |
| **Swap**                      | Virtual memory                              |

## 📌 Security-Hardened /etc/fstab Configuration

```fstab
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

> 📝 **Note**: Replace `<UUID>` with actual disk UUIDs using `blkid` command

## 🛠 Steps to Configure During Installation

### 1. Manual Partitioning

- Choose **"Custom Partitioning"** in Rocky Linux installer
- Create partitions according to the table above

### 2. Format the Partitions

- Set `/boot` as **ext4**
- Set all other partitions as **XFS**
- Set swap as **swap**

### 3. Assign Mount Points

- Configure mount points as per the partitioning table
- Ensure proper hierarchy (e.g., `/var` before `/var/log`)

### 4. Apply Mount Options

- Click on **"Modify Mount Options"**
- Set `nodev`, `noexec`, `nosuid` as needed per the table
- Confirm settings before proceeding

### 5. Verify Configuration

- Confirm total usage is ~400 GiB
- Review all mount points and options
- Proceed with installation

## 🔒 CIS Benchmark Security Benefits

### Mount Option Security

| Mount Option | Security Benefit                                              |
| ------------ | ------------------------------------------------------------- |
| `nodev`      | Prevents device files from being interpreted as devices       |
| `noexec`     | Prevents execution of binaries from the filesystem            |
| `nosuid`     | Prevents set-user-ID and set-group-ID bits from taking effect |

### Partition Separation Benefits

1. **Containment**: Limits the impact of disk space exhaustion
2. **Security**: Prevents privilege escalation through filesystem attacks
3. **Performance**: Optimizes I/O patterns for different data types
4. **Compliance**: Meets CIS Benchmark requirements

## 🔍 Additional Hardening Steps

### Post-Installation Configuration

```bash
# Enable automatic fsck (Filesystem Check) on boot
tune2fs -c 30 /dev/sda1  # for /boot (ext4)

# Verify SELinux is enforcing
getenforce  # Should return "Enforcing"

# Set correct permissions for temporary directories
chmod 1777 /tmp /var/tmp

# Verify mount options
mount | grep -E "(tmp|var|home|opt|srv)"
```

### SELinux Configuration

```bash
# Ensure SELinux is in enforcing mode
sestatus

# If needed, set to enforcing
setenforce 1
echo "SELINUX=enforcing" > /etc/selinux/config
```

### Audit Configuration

```bash
# Verify auditd is enabled and running
systemctl status auditd
systemctl enable auditd

# Check audit log location
ls -la /var/log/audit/
```

## 🔧 Maintenance and Monitoring

### Disk Space Monitoring

```bash
# Monitor partition usage
df -h

# Check for large files
du -sh /var/log/* | sort -rh | head -10

# Set up disk usage alerts
echo "*/15 * * * * root df -h | awk '\$5 > 85 {print \$0}' | mail -s 'Disk Usage Alert' admin@domain.com" >> /etc/crontab
```

### Log Rotation Configuration

```bash
# Configure logrotate for audit logs
cat > /etc/logrotate.d/audit << EOF
/var/log/audit/*.log {
    weekly
    rotate 52
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    postrotate
        /sbin/service auditd restart 2> /dev/null || true
    endscript
}
EOF
```

## 📊 Partition Usage Monitoring

### Create Monitoring Script

```bash
#!/bin/bash
# /usr/local/bin/disk-monitor.sh

THRESHOLD=85
EMAIL="admin@domain.com"

df -h | awk -v threshold=$THRESHOLD '
NR>1 {
    usage = substr($5, 1, length($5)-1)
    if (usage > threshold) {
        print "WARNING: " $6 " is " $5 " full"
    }
}' | while read line; do
    if [ ! -z "$line" ]; then
        echo "$line" | mail -s "Disk Space Alert - $(hostname)" $EMAIL
    fi
done
```

## 🚀 Performance Optimization

### XFS Optimizations

```bash
# Mount options for better performance (add to /etc/fstab)
# For databases or high I/O applications:
# UUID=<uuid> /var/lib/mysql xfs defaults,noatime,nodiratime 0 2

# For general performance:
# UUID=<uuid> /home xfs defaults,noatime 0 2
```

### I/O Scheduler Optimization

```bash
# Set I/O scheduler for better performance
echo mq-deadline > /sys/block/sda/queue/scheduler

# Make permanent
echo 'ACTION=="add|change", KERNEL=="sd*", ATTR{queue/scheduler}="mq-deadline"' > /etc/udev/rules.d/60-ioschedulers.rules
```

## 🔥 Final Validation Checklist

- ✅ **Partitioning**: All partitions created according to CIS recommendations
- ✅ **Mount Options**: Security options applied correctly (`nodev`, `noexec`, `nosuid`)
- ✅ **Filesystem Types**: XFS for data, ext4 for boot, swap configured
- ✅ **SELinux**: Enforcing mode enabled
- ✅ **Audit**: Audit daemon enabled and logging to dedicated partition
- ✅ **Permissions**: Correct permissions on temporary directories (1777)
- ✅ **Monitoring**: Disk usage monitoring scripts in place
- ✅ **Log Rotation**: Configured to prevent log partition overflow

## 🎯 Benefits of This Configuration

1. **Security Compliance**: Meets CIS Benchmark Level 1 requirements
2. **Scalability**: Optimized for both production and development workloads
3. **Reliability**: Separate partitions prevent system-wide failures
4. **Performance**: XFS provides excellent performance for large files
5. **Monitoring**: Built-in disk usage monitoring and alerting
6. **Maintenance**: Simplified backup and maintenance procedures

This layout provides a robust foundation for a secure Rocky Linux 9.5 server that follows industry best practices and security standards.
