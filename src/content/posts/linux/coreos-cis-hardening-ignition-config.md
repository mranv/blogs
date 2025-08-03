---
author: Anubhav Gain
pubDatetime: 2025-01-28T17:00:00+05:30
modDatetime: 2025-01-28T17:00:00+05:30
title: CoreOS CIS Hardening with Ignition Configuration
slug: coreos-cis-hardening-ignition-config
featured: false
draft: false
tags:
  - coreos
  - security
  - cis
  - hardening
  - ignition
  - fedora-coreos
  - compliance
  - linux
  - infrastructure
description: Comprehensive guide to hardening Fedora CoreOS using CIS Distribution Independent Linux Benchmark controls through Ignition configuration, including partitioning, kernel parameters, and security policies
---

# CoreOS CIS Hardening with Ignition Configuration

This guide provides a comprehensive Ignition configuration for hardening Fedora CoreOS (FCOS) according to the CIS Distribution Independent Linux Benchmark. The configuration implements security controls across filesystem partitioning, kernel parameters, network settings, SSH hardening, and system security policies.

## Overview

Fedora CoreOS is an automatically updating, minimal operating system for running containerized workloads. While it provides excellent security defaults, additional hardening according to CIS (Center for Internet Security) benchmarks ensures compliance with industry security standards.

This Ignition configuration implements:

- Filesystem partitioning and mount options
- Kernel security parameters
- Network security settings
- SSH server hardening
- Password policies and authentication controls
- Firewall configuration with nftables
- System security policies

## Prerequisites

- Fedora CoreOS installation media or cloud image
- Understanding of Ignition configuration format
- Access to modify boot parameters or cloud-init data
- Basic knowledge of Linux security concepts

## Complete Ignition Configuration

Here's the comprehensive Ignition configuration implementing CIS controls:

```yaml
variant: fcos
version: 1.4.0
storage:
  disks:
    - device: /dev/sda
      wipe_table: true
      partitions:
        # 1.1.6 Ensure separate partition exists for /var
        - label: VAR
          number: 1
          size_mib: 4096
        # 1.1.11 Ensure separate partition exists for /var/log
        - label: LOG
          number: 2
          size_mib: 4096
        # 1.1.12 Ensure separate partition exists for /var/log/audit
        - label: AUDIT
          number: 3
          size_mib: 4096
        # 1.1.13 Ensure separate partition exists for /home
        - label: HOME
          number: 4
          size_mib: 4096

  filesystems:
    # 1.1.6 Ensure separate partition exists for /var
    - path: /var
      device: /dev/disk/by-partlabel/VAR
      format: ext4
      label: VAR
      wipe_filesystem: true

    # 1.1.11 Ensure separate partition exists for /var/log
    - path: /var/log
      device: /dev/disk/by-partlabel/LOG
      format: ext4
      label: LOG
      wipe_filesystem: true

    # 1.1.12 Ensure separate partition exists for /var/log/audit
    - path: /var/log/audit
      device: /dev/disk/by-partlabel/AUDIT
      format: ext4
      label: AUDIT
      wipe_filesystem: true

    # 1.1.13 Ensure separate partition exists for /home
    - path: /home
      device: /dev/disk/by-partlabel/HOME
      format: ext4
      label: HOME
      wipe_filesystem: true

  files:
    # 1.1.17 Ensure noexec option set on /dev/shm partition
    - path: /etc/fstab
      mode: 0644
      overwrite: true
      contents:
        inline: |
          tmpfs /dev/shm tmpfs defaults,nodev,nosuid,noexec 0 0

    # 1.6.1.2 Ensure the SELinux state is enforcing
    - path: /etc/selinux/config
      mode: 0644
      overwrite: true
      contents:
        inline: |
          SELINUX=enforcing
          SELINUXTYPE=targeted

    # 1.7.1.2 Ensure local login warning banner is configured properly
    - path: /etc/issue
      mode: 0644
      overwrite: true
      contents:
        inline: |
          Authorized uses only. All activity may be monitored and reported.

    # 1.7.1.3 Ensure remote login warning banner is configured properly
    - path: /etc/issue.net
      mode: 0644
      overwrite: true
      contents:
        inline: |
          Authorized uses only. All activity may be monitored and reported.

    # Kernel module blacklisting for security
    - path: /etc/modprobe.d/cis.conf
      mode: 0600
      overwrite: true
      contents:
        inline: |
          install cramfs /bin/true
          install freevxfs /bin/true
          install jffs2 /bin/true
          install hfs /bin/true
          install hfsplus /bin/true
          install squashfs /bin/true
          install udf /bin/true
          install dccp /bin/true
          install sctp /bin/true
          install rds /bin/true
          install tipc /bin/true

    # Network security settings
    - path: /etc/sysctl.d/cis.conf
      mode: 0600
      overwrite: true
      contents:
        inline: |
          # IPv4 settings
          net.ipv4.ip_forward = 0
          net.ipv4.conf.all.send_redirects = 0
          net.ipv4.conf.default.send_redirects = 0
          net.ipv4.conf.all.accept_redirects = 0
          net.ipv4.conf.default.accept_redirects = 0
          net.ipv4.conf.all.secure_redirects = 0
          net.ipv4.conf.default.secure_redirects = 0
          net.ipv4.conf.all.log_martians = 1
          net.ipv4.conf.default.log_martians = 1
          # Disable source routing
          net.ipv4.conf.all.accept_source_route = 0
          net.ipv4.conf.default.accept_source_route = 0
          # IPv6 settings
          net.ipv6.conf.all.accept_ra = 0
          net.ipv6.conf.default.accept_ra = 0
          net.ipv6.conf.all.accept_redirects = 0
          net.ipv6.conf.default.accept_redirects = 0
          net.ipv6.conf.all.accept_source_route = 0
          net.ipv6.conf.default.accept_source_route = 0
          # Additional recommended settings
          kernel.randomize_va_space = 2

    # 5.6 Ensure access to the su command is restricted
    - path: /etc/pam.d/su
      mode: 0644
      overwrite: true
      contents:
        inline: |
          auth sufficient pam_rootok.so
          auth required pam_wheel.so debug use_uid
          auth required pam_unix.so
          account required pam_unix.so
          session required pam_unix.so

    # Password quality and aging settings
    - path: /etc/pam.d/system-auth
      mode: 0644
      overwrite: true
      contents:
        inline: |
          auth required pam_env.so
          auth sufficient pam_unix.so try_first_pass likeauth nullok
          auth sufficient pam_sss.so use_first_pass
          auth required pam_deny.so
          account required pam_unix.so
          account required pam_sss.so ignore_unknown_user ignore_authinfo_unavail
          account optional pam_permit.so
          password required pam_pwhistory.so remember=5
          password required pam_pwquality.so retry=3 minlen=14 dcredit=-1 ucredit=-1 ocredit=-1 lcredit=-1 
          password sufficient pam_unix.so use_authtok try_first_pass nullok sha512 shadow
          password sufficient pam_sss.so use_authtok
          password required pam_deny.so
          session required pam_limits.so
          session required pam_env.so
          session required pam_unix.so
          session optional pam_permit.so
          session optional pam_sss.so
          -session optional pam_systemd.so

    # CIS hardening script
    - path: /usr/local/bin/cis-hardener.sh
      mode: 0700
      overwrite: true
      contents:
        inline: |
          #!/bin/bash
          # CIS Distribution Independent Linux Benchmark hardening script

          echo "Running CIS hardening script..."

          # 6.2.8 Ensure users' home directories permissions are 750 or more restrictive
          echo "Setting secure home directory permissions..."
          find /home -type d -exec chmod 750 {} \;

          # 5.4.4 Ensure default user umask is 027 or more restrictive
          echo "Setting secure umask defaults..."
          sed -i '/^umask/c\# CIS 5.4.4 - Secure umask\numask 027' /etc/profile
          sed -i '/^UMASK/c\# CIS 5.4.4 - Secure umask\nUMASK 027' /etc/login.defs

          # 5.4.1.4 Ensure inactive password lock is 30 days or less
          echo "Setting password aging controls..."
          useradd -D -f 30
          sed -i '/^PASS_MAX_DAYS/c\# CIS 5.4.1.1\nPASS_MAX_DAYS 90' /etc/login.defs
          sed -i '/^PASS_MIN_DAYS/c\# CIS 5.4.1.2\nPASS_MIN_DAYS 7' /etc/login.defs
          sed -i '/^PASS_WARN_AGE/c\# CIS 5.4.1.3\nPASS_WARN_AGE 7' /etc/login.defs

          # Apply password settings to existing users
          for user in $(awk -F: '($3 >= 1000) && ($7 != "/sbin/nologin") {print $1}' /etc/passwd); do
            echo "Updating password aging for user: $user"
            chage --inactive 30 --maxdays 90 --mindays 7 --warndays 7 "$user"
          done

          # 5.2 SSH Server Configuration
          echo "Hardening SSH configuration..."

          # Ensure we have a backup of the original config
          if [ ! -f /etc/ssh/sshd_config.orig ]; then
            cp /etc/ssh/sshd_config /etc/ssh/sshd_config.orig
          fi

          # Set hardened SSH configuration
          cat > /etc/ssh/sshd_config << 'EOF'
          # SSH configuration hardened according to CIS Distribution Independent Linux Benchmark

          # 5.2.1 Permissions handled separately
          # 5.2.2 Ensure SSH Protocol is set to 2
          Protocol 2

          # Basic SSH settings
          Port 22
          AddressFamily any
          ListenAddress 0.0.0.0

          # 5.2.3 Ensure SSH LogLevel is set to INFO
          LogLevel INFO

          # 5.2.4 Ensure SSH MaxAuthTries is set to 4 or less
          MaxAuthTries 4

          # 5.2.5 Ensure SSH IgnoreRhosts is enabled
          IgnoreRhosts yes

          # 5.2.6 Ensure SSH HostbasedAuthentication is disabled
          HostbasedAuthentication no

          # 5.2.7 Ensure SSH root login is disabled
          PermitRootLogin no

          # 5.2.8 Ensure SSH PermitEmptyPasswords is disabled
          PermitEmptyPasswords no

          # 5.2.9 Ensure SSH PermitUserEnvironment is disabled
          PermitUserEnvironment no

          # 5.2.10 Ensure only strong ciphers are used
          Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

          # Ensure only strong MACs are used
          MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

          # Ensure only strong key exchange algorithms are used
          KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,diffie-hellman-group-exchange-sha256

          # 5.2.11 Ensure Idle Timeout Interval is configured
          ClientAliveInterval 300
          ClientAliveCountMax 0

          # 5.2.12 Ensure SSH LoginGraceTime is set to one minute or less
          LoginGraceTime 60

          # 5.2.15 Ensure SSH warning banner is configured
          Banner /etc/issue.net

          # Additional security settings
          X11Forwarding no
          UsePAM yes
          PrintMotd no

          # Allow specific users only - to be customized based on environment
          # AllowUsers core

          # Subsystem for SFTP
          Subsystem sftp internal-sftp
          EOF

          # Fix permissions on SSH config
          chmod 600 /etc/ssh/sshd_config

          # 3.6 Firewall configuration with nftables (modern replacement for iptables)
          echo "Configuring firewall with nftables..."

          # Create nftables config file
          cat > /etc/nftables.conf << 'EOF'
          #!/usr/sbin/nft -f

          flush ruleset

          table inet filter {
              # Base chain for incoming packets
              chain input {
                  type filter hook input priority 0; policy drop;
                  
                  # Accept established/related connections
                  ct state established,related accept
                  
                  # Accept loopback traffic
                  iif lo accept
                  
                  # Drop invalid packets
                  ct state invalid drop
                  
                  # Accept ICMP and IGMP
                  ip protocol icmp accept
                  ip6 nexthdr icmpv6 accept
                  
                  # Accept SSH on port 22
                  tcp dport 22 ct state new accept
                  
                  # Log and drop all other traffic
                  log prefix "NFT-INPUT-DROP: " limit rate 5/minute
                  drop
              }
              
              # Base chain for outgoing packets
              chain output {
                  type filter hook output priority 0; policy drop;
                  
                  # Accept established/related connections
                  ct state established,related accept
                  
                  # Accept loopback traffic
                  oif lo accept
                  
                  # Allow DNS queries
                  udp dport 53 ct state new accept
                  tcp dport 53 ct state new accept
                  
                  # Allow outbound HTTP/HTTPS
                  tcp dport { 80, 443 } ct state new accept
                  
                  # Allow NTP
                  udp dport 123 ct state new accept
                  
                  # Log and drop all other traffic
                  log prefix "NFT-OUTPUT-DROP: " limit rate 5/minute
                  drop
              }
              
              # Base chain for forwarded packets
              chain forward {
                  type filter hook forward priority 0; policy drop;
                  
                  # Accept established/related connections
                  ct state established,related accept
                  
                  # Log and drop all other traffic
                  log prefix "NFT-FORWARD-DROP: " limit rate 5/minute
                  drop
              }
          }
          EOF

          # Secure nftables config file
          chmod 600 /etc/nftables.conf

          # Enable nftables service
          if [ -x "$(command -v systemctl)" ]; then
              systemctl enable nftables
          fi

          echo "CIS hardening complete"
          exit 0

systemd:
  units:
    # 1.1.5 Ensure noexec option set on /tmp partition
    - name: tmp.mount
      enabled: true
      contents: |
        [Unit]
        Description=Temporary Directory (/tmp)
        Documentation=man:hier(7)
        Documentation=https://www.freedesktop.org/wiki/Software/systemd/APIFileSystems
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target

        [Mount]
        What=tmpfs
        Where=/tmp
        Type=tmpfs
        Options=mode=1777,strictatime,nosuid,nodev,noexec

        [Install]
        WantedBy=local-fs.target

    # 1.1.7 Ensure separate partition exists for /var/tmp with security options
    - name: var-tmp.mount
      enabled: true
      contents: |
        [Unit]
        Description=Temporary Directory (/var/tmp)
        Documentation=man:hier(7)
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target
        After=swap.target

        [Mount]
        What=tmpfs
        Where=/var/tmp
        Type=tmpfs
        Options=mode=1777,strictatime,nosuid,nodev,noexec

        [Install]
        WantedBy=local-fs.target

    # 1.1.6 Ensure separate partition exists for /var
    - name: var.mount
      enabled: true
      contents: |
        [Unit]
        Description=/var Directory
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target

        [Mount]
        What=/dev/disk/by-label/VAR
        Where=/var
        Type=ext4
        Options=defaults

        [Install]
        WantedBy=local-fs.target

    # 1.1.11 Ensure separate partition exists for /var/log
    - name: var-log.mount
      enabled: true
      contents: |
        [Unit]
        Description=/var/log Directory
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target
        After=var.mount

        [Mount]
        What=/dev/disk/by-label/LOG
        Where=/var/log
        Type=ext4
        Options=defaults

        [Install]
        WantedBy=local-fs.target

    # 1.1.12 Ensure separate partition exists for /var/log/audit
    - name: var-log-audit.mount
      enabled: true
      contents: |
        [Unit]
        Description=/var/log/audit Directory
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target
        After=var-log.mount

        [Mount]
        What=/dev/disk/by-label/AUDIT
        Where=/var/log/audit
        Type=ext4
        Options=defaults

        [Install]
        WantedBy=local-fs.target

    # 1.1.13 Ensure separate partition exists for /home
    # 1.1.14 Ensure nodev option set on /home partition
    - name: home.mount
      enabled: true
      contents: |
        [Unit]
        Description=/home Directory
        DefaultDependencies=no
        Conflicts=umount.target
        Before=local-fs.target umount.target

        [Mount]
        What=/dev/disk/by-label/HOME
        Where=/home
        Type=ext4
        Options=defaults,nodev

        [Install]
        WantedBy=local-fs.target

    # Run the hardener script at first boot
    - name: cis-hardener.service
      enabled: true
      contents: |
        [Unit]
        Description=CIS Hardening Service
        ConditionFirstBoot=yes
        After=network.target

        [Service]
        Type=oneshot
        ExecStart=/usr/local/bin/cis-hardener.sh
        RemainAfterExit=yes

        [Install]
        WantedBy=multi-user.target

    # Enable and start firewall
    - name: nftables.service
      enabled: true
      contents: |
        [Unit]
        Description=nftables firewall service
        Documentation=man:nft(8)
        Wants=network-pre.target
        Before=network-pre.target

        [Service]
        Type=oneshot
        ExecStart=/usr/sbin/nft -f /etc/nftables.conf
        ExecReload=/usr/sbin/nft -f /etc/nftables.conf
        ExecStop=/usr/sbin/nft flush ruleset
        RemainAfterExit=yes

        [Install]
        WantedBy=multi-user.target

passwd:
  # 1.4.3 Ensure authentication required for single user mode
  # IMPORTANT: Change this default password in production environments!
  users:
    - name: root
      password_hash: "$6$rounds=4096$J86aZz4zInvxG$YZ8j2Kh.Z/7rCF1Kj9tFQawixQySGcUnZi7mlkKRJbZ9Pu4pJLrSWfFsRgPGu0qKgjLFJW2r7w0n6XUggXVDT1"
      home_dir: /root
      no_create_home: true
      shell: /bin/bash
      groups:
        - wheel
        - sudo
```

## Key Security Controls Implemented

### 1. Filesystem Partitioning (CIS Section 1.1)

The configuration creates separate partitions for:

- `/var` - Variable data (4GB)
- `/var/log` - Log files (4GB)
- `/var/log/audit` - Audit logs (4GB)
- `/home` - User home directories (4GB)

Mount options enforce:

- `noexec` on `/tmp` and `/var/tmp` - Prevents execution from temporary directories
- `nodev` on `/home` - Prevents device files in user directories
- `nosuid` on temporary filesystems - Prevents setuid binaries

### 2. Kernel Security Parameters (CIS Section 3.2)

Network security hardening includes:

- Disabled IP forwarding
- Blocked ICMP redirects
- Enabled martian packet logging
- Disabled source routing
- IPv6 security hardening

Additional kernel parameters:

- `kernel.randomize_va_space = 2` - Full ASLR randomization

### 3. Module Blacklisting (CIS Section 1.1.1)

Disabled unnecessary filesystems:

- cramfs, freevxfs, jffs2, hfs, hfsplus
- squashfs, udf

Disabled unnecessary network protocols:

- dccp, sctp, rds, tipc

### 4. SSH Hardening (CIS Section 5.2)

Comprehensive SSH security:

- Protocol 2 only
- Root login disabled
- Empty passwords disabled
- Strong ciphers only (ChaCha20, AES-GCM)
- Strong MACs (HMAC-SHA2)
- Strong key exchange (Curve25519, DH Group 16/18)
- Idle timeout (5 minutes)
- Login grace time (60 seconds)
- Warning banners configured

### 5. Password Policies (CIS Section 5.4)

Strong password requirements:

- Minimum length: 14 characters
- Complexity: At least one digit, uppercase, lowercase, special character
- History: Remember last 5 passwords
- Aging: 90 days maximum, 7 days minimum
- Inactive lock: 30 days

### 6. Access Controls (CIS Section 5.6)

- `su` command restricted to wheel group
- SELinux enforcing mode
- Secure umask (027)
- Home directory permissions (750)

### 7. Firewall Configuration (CIS Section 3.6)

nftables rules implement:

- Default deny policy
- Stateful connection tracking
- Minimal allowed services (SSH only inbound)
- Outbound restrictions (DNS, HTTP/S, NTP only)
- Logging of dropped packets

## Deployment Instructions

### 1. Convert to Ignition Format

Save the YAML configuration as `coreos-hardened.yml` and convert:

```bash
# Install Butane if not already installed
podman pull quay.io/coreos/butane:release

# Convert YAML to Ignition
podman run --rm -v .:/data:z quay.io/coreos/butane:release \
  --pretty --strict /data/coreos-hardened.yml > coreos-hardened.ign
```

### 2. Deploy with Ignition

For bare metal:

```bash
sudo coreos-installer install /dev/sda \
  --ignition-file coreos-hardened.ign
```

For cloud deployments, provide the Ignition config via user-data.

### 3. Verify Hardening

After deployment, verify the hardening:

```bash
# Check partitions
df -h

# Verify mount options
mount | grep -E "(tmp|home|var)"

# Check SSH configuration
sshd -T | grep -E "(permit|protocol|ciphers)"

# Verify kernel parameters
sysctl -a | grep -E "(forward|redirect|martian)"

# Check firewall rules
nft list ruleset
```

## Customization Considerations

### 1. Partition Sizes

Adjust partition sizes based on your needs:

```yaml
partitions:
  - label: VAR
    size_mib: 8192 # 8GB for larger deployments
```

### 2. Network Access

Modify firewall rules for your services:

```bash
# Add HTTPS service
tcp dport 443 ct state new accept

# Add Kubernetes API
tcp dport 6443 ct state new accept
```

### 3. User Management

Add regular users instead of using root:

```yaml
passwd:
  users:
    - name: admin
      ssh_authorized_keys:
        - "ssh-rsa AAAAB3..."
      groups:
        - wheel
        - systemd-journal
```

### 4. Additional Services

For container workloads, add:

```yaml
# Allow container registry access
tcp dport 5000 ct state new accept

# Allow Kubernetes pod network
ip saddr 10.0.0.0/8 accept
```

## Monitoring and Compliance

### 1. Audit Configuration

Enable comprehensive auditing:

```yaml
- path: /etc/audit/rules.d/cis.rules
  mode: 0640
  contents:
    inline: |
      -w /etc/passwd -p wa -k identity
      -w /etc/group -p wa -k identity
      -w /etc/shadow -p wa -k identity
      -w /etc/sudoers -p wa -k scope
```

### 2. Log Monitoring

Configure log forwarding:

```yaml
- path: /etc/rsyslog.d/50-default.conf
  contents:
    inline: |
      *.* @@remote-syslog-server:514
```

### 3. Compliance Scanning

Use tools like OpenSCAP:

```bash
# Install OpenSCAP
rpm-ostree install openscap-scanner

# Run CIS scan
oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis \
  /usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml
```

## Security Maintenance

### 1. Regular Updates

CoreOS automatically updates, but monitor:

```bash
# Check update status
rpm-ostree status

# View staged updates
rpm-ostree upgrade --preview
```

### 2. Security Reviews

Regularly review:

- User accounts and permissions
- Firewall rules
- SSH access logs
- Failed authentication attempts

### 3. Incident Response

Prepare for security incidents:

- Enable audit logging
- Configure centralized log collection
- Document emergency procedures
- Test recovery processes

## Conclusion

This Ignition configuration provides a solid security foundation for Fedora CoreOS deployments following CIS benchmark recommendations. The layered security approach addresses:

- Filesystem security through partitioning and mount options
- Network security via kernel parameters and firewall rules
- Access control through SSH hardening and authentication policies
- System security with SELinux and module restrictions

Regular monitoring, updates, and security reviews ensure ongoing compliance and protection against evolving threats. Customize the configuration based on your specific requirements while maintaining the security principles established by the CIS benchmarks.
