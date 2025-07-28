---
title: "OpenSSH Docker Security: Complete Guide to Secure SSH Containers"
slug: "openssh-docker-security-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-10T20:15:00Z
featured: false
draft: false
tags:
  - docker
  - openssh
  - security
  - containerization
  - ssh
  - networking
  - hardening
description: "Comprehensive guide to implementing secure OpenSSH containers with Docker, covering security hardening, key management, network isolation, and enterprise deployment strategies."
---

# OpenSSH Docker Security: Complete Guide

This comprehensive guide covers the implementation of secure OpenSSH containers using Docker, focusing on security hardening, proper key management, network isolation, and enterprise-grade deployment strategies. Learn to build production-ready SSH jump hosts and secure remote access solutions.

## Table of Contents

## Overview of OpenSSH Containerization

Containerizing OpenSSH provides numerous benefits for secure remote access:

- **Isolation**: Complete separation from host system
- **Scalability**: Easy horizontal scaling of SSH services
- **Consistency**: Identical SSH environments across deployments
- **Security**: Reduced attack surface through containerization
- **Portability**: Platform-independent SSH solutions

### Common Use Cases

1. **SSH Jump Hosts**: Secure bastion servers for infrastructure access
2. **CI/CD Integration**: Secure deployment pipelines
3. **Development Environments**: Isolated SSH access for development
4. **Emergency Access**: Backup SSH access methods
5. **Multi-tenant SSH**: Isolated SSH services per tenant

## Secure Dockerfile Implementation

### Basic Secure Dockerfile

```dockerfile
# Use minimal base image for reduced attack surface
FROM alpine:3.18

# Add metadata for container identification
LABEL maintainer="Security Team"
LABEL version="1.0"
LABEL description="Hardened OpenSSH Server Container"
LABEL security.level="high"

# Install OpenSSH and security tools
RUN apk add --no-cache \
    openssh-server \
    openssh-keygen \
    openssh-client \
    shadow \
    sudo \
    rsyslog \
    fail2ban \
    && rm -rf /var/cache/apk/*

# Create SSH directory with proper permissions
RUN mkdir -p /var/run/sshd \
    && mkdir -p /etc/ssh/keys \
    && mkdir -p /var/log/ssh

# Generate host keys with strong encryption
RUN ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N "" \
    && ssh-keygen -t ecdsa -b 521 -f /etc/ssh/ssh_host_ecdsa_key -N "" \
    && ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""

# Set proper permissions for host keys
RUN chmod 600 /etc/ssh/ssh_host_*_key \
    && chmod 644 /etc/ssh/ssh_host_*_key.pub

# Create non-root SSH user
RUN addgroup -g 1000 sshuser \
    && adduser -D -u 1000 -G sshuser -s /bin/ash sshuser \
    && mkdir -p /home/sshuser/.ssh \
    && chown -R sshuser:sshuser /home/sshuser/.ssh \
    && chmod 700 /home/sshuser/.ssh

# Copy hardened SSH configuration
COPY sshd_config /etc/ssh/sshd_config
COPY ssh_banner /etc/ssh/banner

# Copy security scripts
COPY entrypoint.sh /entrypoint.sh
COPY healthcheck.sh /healthcheck.sh

# Set proper permissions
RUN chmod +x /entrypoint.sh /healthcheck.sh \
    && chmod 644 /etc/ssh/sshd_config \
    && chmod 644 /etc/ssh/banner

# Create log directory
RUN mkdir -p /var/log/auth \
    && touch /var/log/auth/sshd.log \
    && chmod 640 /var/log/auth/sshd.log

# Expose SSH port (non-standard for security)
EXPOSE 2222

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

# Use non-root user for runtime (where possible)
# Note: SSH daemon requires root for initial startup
USER root

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/sbin/sshd", "-D", "-e"]
```

### Hardened SSH Configuration

```bash
# /etc/ssh/sshd_config - Hardened SSH Configuration

# Network and Protocol Settings
Port 2222
Protocol 2
AddressFamily inet
ListenAddress 0.0.0.0

# Host Key Configuration
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Encryption and Security
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512
KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521,ecdh-sha2-nistp384,ecdh-sha2-nistp256,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Authentication Settings
LoginGraceTime 60
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 5
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
UsePAM yes

# Access Control
AllowUsers sshuser
DenyUsers root
AllowGroups sshuser
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
GatewayPorts no
PermitTunnel no

# Session Settings
ClientAliveInterval 300
ClientAliveCountMax 2
TCPKeepAlive yes
Compression no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Banner and Message
Banner /etc/ssh/banner
PrintMotd no
PrintLastLog yes

# File Transfer
Subsystem sftp internal-sftp

# Security Features
UseDNS no
PermitUserEnvironment no
AcceptEnv LANG LC_*

# Rate Limiting
MaxStartups 10:30:100

# Privilege Separation
UsePrivilegeSeparation sandbox
```

### SSH Security Banner

```bash
# /etc/ssh/banner
***************************************************************************
*                                WARNING                                   *
***************************************************************************
*                                                                         *
* This system is for authorized users only. All activities are logged    *
* and monitored. Unauthorized access is strictly prohibited and will be  *
* prosecuted to the full extent of the law.                              *
*                                                                         *
* By accessing this system, you acknowledge that:                        *
* - Your activities may be monitored and recorded                        *
* - You have no expectation of privacy                                   *
* - Misuse of this system is prohibited                                  *
*                                                                         *
***************************************************************************
```

### Container Entrypoint Script

```bash
#!/bin/bash
# /entrypoint.sh - Secure SSH container entrypoint

set -e

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /var/log/auth/sshd.log
}

log "Starting SSH container initialization..."

# Validate environment
validate_environment() {
    log "Validating container environment..."

    # Check for required directories
    required_dirs=("/etc/ssh" "/var/run/sshd" "/home/sshuser/.ssh")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log "ERROR: Required directory missing: $dir"
            exit 1
        fi
    done

    # Check for host keys
    host_keys=("/etc/ssh/ssh_host_rsa_key" "/etc/ssh/ssh_host_ecdsa_key" "/etc/ssh/ssh_host_ed25519_key")
    for key in "${host_keys[@]}"; do
        if [[ ! -f "$key" ]]; then
            log "ERROR: Host key missing: $key"
            exit 1
        fi
    done

    log "Environment validation completed"
}

# Setup authorized keys
setup_authorized_keys() {
    log "Setting up authorized keys..."

    # Check for authorized keys from environment variable
    if [[ -n "$SSH_PUBLIC_KEYS" ]]; then
        echo "$SSH_PUBLIC_KEYS" > /home/sshuser/.ssh/authorized_keys
        log "Authorized keys loaded from environment variable"
    fi

    # Check for authorized keys from mounted volume
    if [[ -f "/ssh-keys/authorized_keys" ]]; then
        cp /ssh-keys/authorized_keys /home/sshuser/.ssh/authorized_keys
        log "Authorized keys loaded from mounted volume"
    fi

    # Set proper permissions
    if [[ -f "/home/sshuser/.ssh/authorized_keys" ]]; then
        chown sshuser:sshuser /home/sshuser/.ssh/authorized_keys
        chmod 600 /home/sshuser/.ssh/authorized_keys
        log "Authorized keys permissions set"
    else
        log "WARNING: No authorized keys found - SSH access will not be possible"
    fi
}

# Configure fail2ban
setup_fail2ban() {
    log "Configuring fail2ban..."

    cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth/sshd.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

    # Start fail2ban
    fail2ban-server -b
    log "Fail2ban configured and started"
}

# Setup logging
setup_logging() {
    log "Configuring logging..."

    # Create rsyslog configuration for SSH
    cat > /etc/rsyslog.d/50-sshd.conf << EOF
# SSH logging configuration
auth,authpriv.*                 /var/log/auth/sshd.log
EOF

    # Start rsyslog
    rsyslogd
    log "Logging configured"
}

# Security hardening
apply_security_hardening() {
    log "Applying security hardening..."

    # Set secure umask
    umask 027

    # Disable core dumps
    echo "* hard core 0" >> /etc/security/limits.conf
    echo "fs.suid_dumpable = 0" >> /etc/sysctl.conf

    # Set process limits
    echo "* hard nproc 1024" >> /etc/security/limits.conf
    echo "* soft nproc 1024" >> /etc/security/limits.conf

    # Apply sysctl settings
    sysctl -p /etc/sysctl.conf > /dev/null 2>&1 || true

    log "Security hardening applied"
}

# Health monitoring setup
setup_health_monitoring() {
    log "Setting up health monitoring..."

    # Create health check script
    cat > /usr/local/bin/ssh-health-check << 'EOF'
#!/bin/bash
# SSH health check script

# Check if SSH daemon is running
if ! pgrep -f "sshd" > /dev/null; then
    echo "ERROR: SSH daemon not running"
    exit 1
fi

# Check if SSH port is listening
if ! netstat -tln | grep -q ":2222 "; then
    echo "ERROR: SSH port not listening"
    exit 1
fi

# Test SSH configuration
if ! sshd -t; then
    echo "ERROR: SSH configuration invalid"
    exit 1
fi

echo "SSH service healthy"
exit 0
EOF

    chmod +x /usr/local/bin/ssh-health-check
    log "Health monitoring configured"
}

# Main initialization
main() {
    validate_environment
    setup_authorized_keys
    setup_logging
    setup_fail2ban
    apply_security_hardening
    setup_health_monitoring

    log "SSH container initialization completed"
    log "Starting SSH daemon..."

    # Execute the main command
    exec "$@"
}

# Run main function
main "$@"
```

### Health Check Script

```bash
#!/bin/bash
# /healthcheck.sh - Container health check

# Check SSH daemon process
if ! pgrep -f "sshd.*-D" > /dev/null; then
    echo "SSH daemon not running"
    exit 1
fi

# Check SSH port availability
if ! nc -z localhost 2222; then
    echo "SSH port not accessible"
    exit 1
fi

# Check configuration validity
if ! sshd -t; then
    echo "SSH configuration invalid"
    exit 1
fi

# Check log file exists and is writable
if [[ ! -w /var/log/auth/sshd.log ]]; then
    echo "Log file not writable"
    exit 1
fi

echo "SSH container healthy"
exit 0
```

## Advanced Security Features

### Multi-Factor Authentication

```dockerfile
# Add MFA support to Dockerfile
RUN apk add --no-cache \
    google-authenticator \
    libpam-google-authenticator

# Copy PAM configuration
COPY pam_sshd /etc/pam.d/sshd
```

```bash
# /etc/pam.d/sshd - PAM configuration with MFA
auth required pam_google_authenticator.so
auth required pam_unix.so nullok
account required pam_unix.so
password required pam_unix.so
session required pam_unix.so
session required pam_limits.so
```

### Certificate-Based Authentication

```bash
# Setup SSH Certificate Authority
setup_ssh_ca() {
    log "Setting up SSH Certificate Authority..."

    # Generate CA key if not exists
    if [[ ! -f /etc/ssh/ca/ssh_ca ]]; then
        mkdir -p /etc/ssh/ca
        ssh-keygen -t rsa -b 4096 -f /etc/ssh/ca/ssh_ca -N "" -C "SSH-CA"
        chmod 600 /etc/ssh/ca/ssh_ca
        chmod 644 /etc/ssh/ca/ssh_ca.pub
        log "SSH CA key generated"
    fi

    # Configure SSH to trust CA
    echo "TrustedUserCAKeys /etc/ssh/ca/ssh_ca.pub" >> /etc/ssh/sshd_config

    log "SSH Certificate Authority configured"
}
```

### Advanced Logging and Monitoring

```bash
# Enhanced logging configuration
setup_advanced_logging() {
    log "Configuring advanced logging..."

    # JSON structured logging
    cat > /etc/rsyslog.d/60-ssh-json.conf << 'EOF'
# JSON format for SSH logs
$template ssh_json,"{\"timestamp\":\"%timegenerated:::date-rfc3339%\",\"host\":\"%hostname%\",\"process\":\"%programname%\",\"pid\":\"%procid%\",\"message\":\"%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\"}\n"

# Send SSH logs in JSON format
auth,authpriv.* @@logserver:514;ssh_json
EOF

    # Setup log rotation
    cat > /etc/logrotate.d/ssh << 'EOF'
/var/log/auth/sshd.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 root root
    postrotate
        /usr/bin/killall -HUP rsyslogd
    endscript
}
EOF

    log "Advanced logging configured"
}

# Real-time monitoring
setup_monitoring() {
    log "Setting up real-time monitoring..."

    # Create monitoring script
    cat > /usr/local/bin/ssh-monitor << 'EOF'
#!/bin/bash
# Real-time SSH monitoring

LOGFILE="/var/log/auth/sshd.log"
ALERT_EMAIL="security@company.com"

# Monitor for suspicious activities
tail -F "$LOGFILE" | while read line; do
    # Check for brute force attempts
    if echo "$line" | grep -q "Failed password"; then
        ip=$(echo "$line" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
        # Alert if more than 5 failures from same IP
        failures=$(grep "Failed password.*$ip" "$LOGFILE" | wc -l)
        if [[ $failures -gt 5 ]]; then
            echo "ALERT: Brute force detected from $ip" | \
                mail -s "SSH Security Alert" "$ALERT_EMAIL"
        fi
    fi

    # Check for successful logins
    if echo "$line" | grep -q "Accepted"; then
        echo "INFO: Successful SSH login detected"
        # Log to security monitoring system
        logger -p auth.info "SSH_LOGIN_SUCCESS: $line"
    fi

    # Check for privilege escalation attempts
    if echo "$line" | grep -q "sudo"; then
        echo "ALERT: Sudo usage detected in SSH session"
        logger -p auth.warning "SSH_SUDO_USAGE: $line"
    fi
done &
EOF

    chmod +x /usr/local/bin/ssh-monitor
    log "Real-time monitoring configured"
}
```

## Container Security Hardening

### Security Contexts and Capabilities

```yaml
# docker-compose.yml with security contexts
version: "3.8"

services:
  openssh:
    build: .
    ports:
      - "2222:2222"
    volumes:
      - ssh-keys:/ssh-keys:ro
      - ssh-logs:/var/log/auth
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined
    cap_drop:
      - ALL
    cap_add:
      - SETUID
      - SETGID
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:size=100M,noexec,nosuid,nodev
      - /var/run:size=50M,noexec,nosuid,nodev
    environment:
      - SSH_PUBLIC_KEYS=${SSH_PUBLIC_KEYS}
    restart: unless-stopped
    networks:
      - ssh-network

networks:
  ssh-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  ssh-keys:
    driver: local
  ssh-logs:
    driver: local
```

### AppArmor Profile

```bash
# AppArmor profile for SSH container
# /etc/apparmor.d/docker-openssh

#include <tunables/global>

profile docker-openssh flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  #include <abstractions/nameservice>
  #include <abstractions/openssl>
  #include <abstractions/ssl_certs>

  # Network access
  network inet tcp,
  network inet udp,
  network inet6 tcp,
  network inet6 udp,

  # File system access
  /etc/ssh/ r,
  /etc/ssh/** r,
  /var/log/auth/ rw,
  /var/log/auth/** rw,
  /var/run/sshd/ rw,
  /var/run/sshd/** rw,
  /home/sshuser/ r,
  /home/sshuser/.ssh/ r,
  /home/sshuser/.ssh/** r,

  # Binary execution
  /usr/sbin/sshd ix,
  /bin/bash ix,
  /bin/ash ix,

  # Deny dangerous capabilities
  deny capability sys_admin,
  deny capability sys_module,
  deny capability sys_rawio,
  deny capability sys_time,

  # Allow necessary capabilities
  capability setuid,
  capability setgid,
  capability chown,
  capability dac_override,
  capability fowner,
  capability net_bind_service,
}
```

### Seccomp Profile

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_X32"],
  "syscalls": [
    {
      "names": [
        "accept",
        "accept4",
        "access",
        "bind",
        "brk",
        "chdir",
        "chmod",
        "chown",
        "chown32",
        "clock_gettime",
        "close",
        "connect",
        "dup",
        "dup2",
        "epoll_create",
        "epoll_create1",
        "epoll_ctl",
        "epoll_wait",
        "execve",
        "exit",
        "exit_group",
        "fchdir",
        "fchmod",
        "fchown",
        "fchown32",
        "fcntl",
        "fcntl64",
        "fork",
        "fstat",
        "fstat64",
        "getdents",
        "getdents64",
        "getegid",
        "getegid32",
        "geteuid",
        "geteuid32",
        "getgid",
        "getgid32",
        "getgroups",
        "getgroups32",
        "getpgrp",
        "getpid",
        "getppid",
        "getrlimit",
        "getsid",
        "getsockname",
        "getsockopt",
        "getuid",
        "getuid32",
        "ioctl",
        "kill",
        "listen",
        "lseek",
        "lstat",
        "lstat64",
        "mmap",
        "mmap2",
        "mprotect",
        "munmap",
        "nanosleep",
        "open",
        "openat",
        "pipe",
        "pipe2",
        "poll",
        "read",
        "readlink",
        "recv",
        "recvfrom",
        "recvmsg",
        "rt_sigaction",
        "rt_sigprocmask",
        "rt_sigreturn",
        "select",
        "send",
        "sendmsg",
        "sendto",
        "setgid",
        "setgid32",
        "setgroups",
        "setgroups32",
        "setresuid",
        "setresuid32",
        "setsid",
        "setsockopt",
        "setuid",
        "setuid32",
        "shutdown",
        "socket",
        "socketpair",
        "stat",
        "stat64",
        "time",
        "uname",
        "unlink",
        "wait4",
        "waitpid",
        "write"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

## Key Management and Rotation

### Automated Key Rotation

```bash
#!/bin/bash
# ssh-key-rotation.sh - Automated SSH key rotation

KEY_ROTATION_INTERVAL=${KEY_ROTATION_INTERVAL:-30} # days
BACKUP_DIR="/etc/ssh/backup"
LOG_FILE="/var/log/auth/key-rotation.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if key rotation is needed
check_key_age() {
    local key_file="$1"
    local max_age="$KEY_ROTATION_INTERVAL"

    if [[ -f "$key_file" ]]; then
        local key_age=$(( ($(date +%s) - $(stat -f %m "$key_file")) / 86400 ))
        if [[ $key_age -gt $max_age ]]; then
            return 0  # Rotation needed
        fi
    fi
    return 1  # No rotation needed
}

# Backup existing keys
backup_keys() {
    log "Backing up existing SSH keys..."

    mkdir -p "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"

    cp /etc/ssh/ssh_host_*_key* "$backup_path/" 2>/dev/null || true

    log "Keys backed up to $backup_path"
}

# Generate new host keys
generate_new_keys() {
    log "Generating new SSH host keys..."

    # Remove old keys
    rm -f /etc/ssh/ssh_host_*_key*

    # Generate new keys
    ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N "" -C "$(hostname)-$(date +%Y%m%d)"
    ssh-keygen -t ecdsa -b 521 -f /etc/ssh/ssh_host_ecdsa_key -N "" -C "$(hostname)-$(date +%Y%m%d)"
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N "" -C "$(hostname)-$(date +%Y%m%d)"

    # Set proper permissions
    chmod 600 /etc/ssh/ssh_host_*_key
    chmod 644 /etc/ssh/ssh_host_*_key.pub

    log "New SSH host keys generated"
}

# Update known_hosts on client systems
update_known_hosts() {
    log "Updating known_hosts on client systems..."

    # Extract public keys
    local rsa_key=$(cat /etc/ssh/ssh_host_rsa_key.pub)
    local ecdsa_key=$(cat /etc/ssh/ssh_host_ecdsa_key.pub)
    local ed25519_key=$(cat /etc/ssh/ssh_host_ed25519_key.pub)

    # Send notification to configuration management system
    # This would typically integrate with your CM system (Ansible, Puppet, etc.)
    curl -X POST "${CM_WEBHOOK_URL}" \
         -H "Content-Type: application/json" \
         -d "{
           \"action\": \"update_known_hosts\",
           \"hostname\": \"$(hostname)\",
           \"keys\": {
             \"rsa\": \"$rsa_key\",
             \"ecdsa\": \"$ecdsa_key\",
             \"ed25519\": \"$ed25519_key\"
           }
         }" || log "WARNING: Failed to notify CM system"

    log "Known_hosts update notification sent"
}

# Restart SSH daemon
restart_ssh() {
    log "Restarting SSH daemon..."

    # Test configuration first
    if sshd -t; then
        # Send SIGHUP to reload configuration
        pkill -HUP sshd
        log "SSH daemon reloaded successfully"
    else
        log "ERROR: SSH configuration test failed"
        return 1
    fi
}

# Main rotation process
main() {
    log "Starting SSH key rotation process..."

    # Check if any key needs rotation
    local rotation_needed=false
    for key_file in /etc/ssh/ssh_host_*_key; do
        if check_key_age "$key_file"; then
            rotation_needed=true
            break
        fi
    done

    if [[ "$rotation_needed" == "true" ]] || [[ "$1" == "--force" ]]; then
        log "SSH key rotation required"

        backup_keys
        generate_new_keys
        update_known_hosts
        restart_ssh

        log "SSH key rotation completed successfully"
    else
        log "SSH key rotation not required"
    fi
}

# Run main function
main "$@"
```

### Key Distribution System

```python
#!/usr/bin/env python3
# ssh-key-distributor.py - SSH key distribution system

import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
import requests
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/auth/key-distribution.log'),
        logging.StreamHandler()
    ]
)

class SSHKeyDistributor:
    def __init__(self, config_file='/etc/ssh/key-distribution.yaml'):
        self.config = self.load_config(config_file)
        self.logger = logging.getLogger(__name__)

    def load_config(self, config_file):
        """Load configuration from YAML file"""
        try:
            with open(config_file, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.error(f"Configuration file not found: {config_file}")
            sys.exit(1)

    def get_authorized_keys(self, username):
        """Retrieve authorized keys for a user from central system"""
        try:
            response = requests.get(
                f"{self.config['key_server']['url']}/users/{username}/keys",
                headers={
                    'Authorization': f"Bearer {self.config['key_server']['token']}",
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('keys', [])
        except requests.RequestException as e:
            self.logger.error(f"Failed to retrieve keys for {username}: {e}")
            return []

    def validate_key(self, public_key):
        """Validate SSH public key format"""
        try:
            # Use ssh-keygen to validate key
            result = subprocess.run(
                ['ssh-keygen', '-l', '-f', '/dev/stdin'],
                input=public_key.encode(),
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except Exception as e:
            self.logger.error(f"Key validation failed: {e}")
            return False

    def update_authorized_keys(self, username, keys):
        """Update authorized_keys file for user"""
        user_home = Path(f"/home/{username}")
        ssh_dir = user_home / ".ssh"
        authorized_keys_file = ssh_dir / "authorized_keys"

        try:
            # Create .ssh directory if it doesn't exist
            ssh_dir.mkdir(mode=0o700, exist_ok=True)

            # Validate all keys before writing
            valid_keys = []
            for key in keys:
                if self.validate_key(key):
                    valid_keys.append(key)
                else:
                    self.logger.warning(f"Invalid key for user {username}: {key[:50]}...")

            # Write authorized keys
            with open(authorized_keys_file, 'w') as f:
                for key in valid_keys:
                    f.write(f"{key}\n")

            # Set proper permissions
            authorized_keys_file.chmod(0o600)
            subprocess.run(['chown', f"{username}:{username}", str(authorized_keys_file)])

            self.logger.info(f"Updated authorized_keys for {username}: {len(valid_keys)} keys")
            return True

        except Exception as e:
            self.logger.error(f"Failed to update authorized_keys for {username}: {e}")
            return False

    def sync_user_keys(self, username):
        """Sync keys for a specific user"""
        self.logger.info(f"Syncing keys for user: {username}")

        # Get keys from central system
        keys = self.get_authorized_keys(username)

        if keys:
            return self.update_authorized_keys(username, keys)
        else:
            self.logger.warning(f"No keys found for user: {username}")
            return False

    def sync_all_users(self):
        """Sync keys for all configured users"""
        users = self.config.get('users', [])
        success_count = 0

        for username in users:
            if self.sync_user_keys(username):
                success_count += 1

        self.logger.info(f"Key sync completed: {success_count}/{len(users)} users updated")
        return success_count == len(users)

    def audit_keys(self):
        """Perform security audit of SSH keys"""
        self.logger.info("Starting SSH key security audit...")

        issues = []

        for username in self.config.get('users', []):
            user_home = Path(f"/home/{username}")
            authorized_keys_file = user_home / ".ssh" / "authorized_keys"

            if not authorized_keys_file.exists():
                continue

            # Check file permissions
            file_mode = authorized_keys_file.stat().st_mode & 0o777
            if file_mode != 0o600:
                issues.append(f"Incorrect permissions on {authorized_keys_file}: {oct(file_mode)}")

            # Check key expiration
            with open(authorized_keys_file, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue

                    # Extract key comment for expiration check
                    parts = line.split()
                    if len(parts) >= 3:
                        comment = ' '.join(parts[2:])
                        if 'expires:' in comment:
                            # Parse expiration date
                            try:
                                expires_str = comment.split('expires:')[1].strip()
                                expires_date = datetime.fromisoformat(expires_str)
                                if expires_date < datetime.now():
                                    issues.append(f"Expired key in {authorized_keys_file}:{line_num}")
                            except (ValueError, IndexError):
                                issues.append(f"Invalid expiration format in {authorized_keys_file}:{line_num}")

        if issues:
            self.logger.warning(f"Security audit found {len(issues)} issues:")
            for issue in issues:
                self.logger.warning(f"  - {issue}")
        else:
            self.logger.info("Security audit completed - no issues found")

        return len(issues) == 0

def main():
    if len(sys.argv) < 2:
        print("Usage: ssh-key-distributor.py <sync|audit> [username]")
        sys.exit(1)

    distributor = SSHKeyDistributor()
    command = sys.argv[1]

    if command == "sync":
        if len(sys.argv) > 2:
            # Sync specific user
            username = sys.argv[2]
            success = distributor.sync_user_keys(username)
        else:
            # Sync all users
            success = distributor.sync_all_users()

        sys.exit(0 if success else 1)

    elif command == "audit":
        success = distributor.audit_keys()
        sys.exit(0 if success else 1)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## Network Security and Isolation

### Network Segmentation

```yaml
# docker-compose.yml with network segmentation
version: "3.8"

services:
  openssh-dmz:
    build: .
    ports:
      - "2222:2222"
    networks:
      - dmz-network
      - internal-network
    volumes:
      - ssh-keys-dmz:/ssh-keys:ro
    environment:
      - SSH_ROLE=dmz
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 30s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  openssh-internal:
    build: .
    ports:
      - "2223:2222"
    networks:
      - internal-network
      - backend-network
    volumes:
      - ssh-keys-internal:/ssh-keys:ro
    environment:
      - SSH_ROLE=internal
    depends_on:
      - openssh-dmz

  ssh-proxy:
    image: nginx:alpine
    ports:
      - "22:22"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - dmz-network
    depends_on:
      - openssh-dmz

networks:
  dmz-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/24
          gateway: 172.20.0.1
    driver_opts:
      com.docker.network.bridge.name: br-dmz
      com.docker.network.bridge.enable_icc: "false"
      com.docker.network.bridge.enable_ip_masquerade: "true"

  internal-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/24
          gateway: 172.21.0.1
    driver_opts:
      com.docker.network.bridge.name: br-internal

  backend-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/24
          gateway: 172.22.0.1
    driver_opts:
      com.docker.network.bridge.name: br-backend

volumes:
  ssh-keys-dmz:
  ssh-keys-internal:
```

### iptables Rules for Container Security

```bash
#!/bin/bash
# iptables-ssh-container.sh - iptables rules for SSH containers

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH container specific rules
# Allow SSH on port 2222 with rate limiting
iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 2222 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --name SSH -j DROP
iptables -A INPUT -p tcp --dport 2222 -j ACCEPT

# Docker bridge networks
iptables -A INPUT -i br-dmz -j ACCEPT
iptables -A INPUT -i br-internal -j ACCEPT
iptables -A INPUT -i br-backend -j ACCEPT

# Allow Docker containers to communicate
iptables -A FORWARD -i br-dmz -o br-internal -j ACCEPT
iptables -A FORWARD -i br-internal -o br-backend -j ACCEPT

# Block direct access to backend from DMZ
iptables -A FORWARD -i br-dmz -o br-backend -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "DROPPED INPUT: "
iptables -A FORWARD -j LOG --log-prefix "DROPPED FORWARD: "

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "iptables rules applied for SSH containers"
```

## High Availability and Load Balancing

### HAProxy Configuration

```bash
# haproxy.cfg - Load balancer for SSH containers
global
    daemon
    log stdout local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy

    # Security
    ssl-default-bind-options ssl-min-ver TLSv1.2
    ssl-default-bind-ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384

defaults
    mode tcp
    log global
    option tcplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend ssh_frontend
    bind *:22
    mode tcp

    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    tcp-request inspect-delay 5s
    tcp-request content track-sc0 src
    tcp-request content reject if { sc_http_req_rate(0) gt 10 }

    default_backend ssh_backend

backend ssh_backend
    mode tcp
    balance roundrobin

    # Health checks
    option tcp-check
    tcp-check send-binary 5353482d322e30
    tcp-check expect binary 5353482d322e30

    # SSH containers
    server ssh1 openssh-1:2222 check inter 5s rise 2 fall 3
    server ssh2 openssh-2:2222 check inter 5s rise 2 fall 3
    server ssh3 openssh-3:2222 check inter 5s rise 2 fall 3

listen stats
    bind *:8080
    mode http
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
```

### Kubernetes Deployment

```yaml
# kubernetes/ssh-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openssh-server
  namespace: ssh-service
  labels:
    app: openssh-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: openssh-server
  template:
    metadata:
      labels:
        app: openssh-server
    spec:
      securityContext:
        runAsNonRoot: false # SSH daemon requires root
        fsGroup: 1000
      containers:
        - name: openssh
          image: company/openssh:latest
          ports:
            - containerPort: 2222
              name: ssh
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
              add:
                - SETUID
                - SETGID
                - CHOWN
                - DAC_OVERRIDE
                - FOWNER
                - NET_BIND_SERVICE
          env:
            - name: SSH_PUBLIC_KEYS
              valueFrom:
                secretKeyRef:
                  name: ssh-public-keys
                  key: authorized_keys
          volumeMounts:
            - name: ssh-host-keys
              mountPath: /etc/ssh/keys
              readOnly: true
            - name: ssh-logs
              mountPath: /var/log/auth
            - name: tmp
              mountPath: /tmp
            - name: var-run
              mountPath: /var/run
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
          livenessProbe:
            tcpSocket:
              port: 2222
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            tcpSocket:
              port: 2222
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: ssh-host-keys
          secret:
            secretName: ssh-host-keys
            defaultMode: 0600
        - name: ssh-logs
          emptyDir: {}
        - name: tmp
          emptyDir:
            sizeLimit: 100Mi
        - name: var-run
          emptyDir:
            sizeLimit: 50Mi
      nodeSelector:
        security-zone: dmz
      tolerations:
        - key: "security-zone"
          operator: "Equal"
          value: "dmz"
          effect: "NoSchedule"

---
apiVersion: v1
kind: Service
metadata:
  name: openssh-service
  namespace: ssh-service
spec:
  selector:
    app: openssh-server
  ports:
    - port: 22
      targetPort: 2222
      protocol: TCP
  type: LoadBalancer
  loadBalancerSourceRanges:
    - 10.0.0.0/8
    - 172.16.0.0/12
    - 192.168.0.0/16

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: openssh-network-policy
  namespace: ssh-service
spec:
  podSelector:
    matchLabels:
      app: openssh-server
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ssh-service
        - podSelector: {}
      ports:
        - protocol: TCP
          port: 2222
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 53
        - protocol: UDP
          port: 53
    - to:
        - namespaceSelector:
            matchLabels:
              name: logging
      ports:
        - protocol: TCP
          port: 514
```

## Monitoring and Alerting

### Prometheus Metrics

```python
#!/usr/bin/env python3
# ssh-metrics-exporter.py - Prometheus metrics for SSH containers

import time
import re
import subprocess
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
ssh_connections_active = Gauge('ssh_connections_active', 'Number of active SSH connections')
ssh_connections_total = Counter('ssh_connections_total', 'Total SSH connections', ['status'])
ssh_auth_attempts = Counter('ssh_auth_attempts_total', 'SSH authentication attempts', ['method', 'result'])
ssh_session_duration = Histogram('ssh_session_duration_seconds', 'SSH session duration')
ssh_bytes_transferred = Counter('ssh_bytes_transferred_total', 'Bytes transferred over SSH', ['direction'])

class SSHMetricsCollector:
    def __init__(self):
        self.log_file = '/var/log/auth/sshd.log'
        self.last_position = 0

    def get_active_connections(self):
        """Count active SSH connections"""
        try:
            result = subprocess.run(['netstat', '-tn'], capture_output=True, text=True)
            connections = 0
            for line in result.stdout.split('\n'):
                if ':2222' in line and 'ESTABLISHED' in line:
                    connections += 1
            return connections
        except Exception as e:
            logger.error(f"Error counting connections: {e}")
            return 0

    def parse_log_line(self, line):
        """Parse SSH log line and extract metrics"""
        # Connection established
        if 'Accepted' in line:
            ssh_connections_total.labels(status='accepted').inc()

            # Extract authentication method
            if 'publickey' in line:
                ssh_auth_attempts.labels(method='publickey', result='success').inc()
            elif 'password' in line:
                ssh_auth_attempts.labels(method='password', result='success').inc()

        # Connection failed
        elif 'Failed' in line:
            ssh_connections_total.labels(status='failed').inc()

            if 'publickey' in line:
                ssh_auth_attempts.labels(method='publickey', result='failure').inc()
            elif 'password' in line:
                ssh_auth_attempts.labels(method='password', result='failure').inc()

        # Session closed
        elif 'session closed' in line:
            # Extract session duration if available
            duration_match = re.search(r'duration: (\d+)', line)
            if duration_match:
                duration = int(duration_match.group(1))
                ssh_session_duration.observe(duration)

        # Bytes transferred
        elif 'bytes' in line:
            bytes_match = re.search(r'(\d+) bytes', line)
            if bytes_match:
                bytes_count = int(bytes_match.group(1))
                if 'sent' in line:
                    ssh_bytes_transferred.labels(direction='sent').inc(bytes_count)
                elif 'received' in line:
                    ssh_bytes_transferred.labels(direction='received').inc(bytes_count)

    def collect_metrics(self):
        """Collect all SSH metrics"""
        try:
            # Update active connections
            active_conns = self.get_active_connections()
            ssh_connections_active.set(active_conns)

            # Parse new log entries
            try:
                with open(self.log_file, 'r') as f:
                    f.seek(self.last_position)
                    for line in f:
                        self.parse_log_line(line.strip())
                    self.last_position = f.tell()
            except FileNotFoundError:
                logger.warning(f"Log file not found: {self.log_file}")

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

def main():
    # Start Prometheus metrics server
    start_http_server(8090)
    logger.info("SSH metrics exporter started on port 8090")

    collector = SSHMetricsCollector()

    while True:
        collector.collect_metrics()
        time.sleep(10)  # Collect metrics every 10 seconds

if __name__ == "__main__":
    main()
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SSH Container Security Dashboard",
    "tags": ["ssh", "security", "containers"],
    "panels": [
      {
        "title": "Active SSH Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "ssh_connections_active"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "green", "value": 0 },
                { "color": "yellow", "value": 10 },
                { "color": "red", "value": 50 }
              ]
            }
          }
        }
      },
      {
        "title": "SSH Connection Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ssh_connections_total[5m])"
          }
        ]
      },
      {
        "title": "Authentication Failures",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ssh_auth_attempts_total{result=\"failure\"}[5m])"
          }
        ]
      },
      {
        "title": "Top Failed IPs",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, sum by (client_ip) (rate(ssh_connections_total{status=\"failed\"}[1h])))"
          }
        ]
      }
    ]
  }
}
```

## Compliance and Auditing

### SOC 2 Compliance

```bash
#!/bin/bash
# soc2-compliance-check.sh - SOC 2 compliance validation

COMPLIANCE_LOG="/var/log/auth/compliance.log"

log_compliance() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" | tee -a "$COMPLIANCE_LOG"
}

# CC6.1 - Logical and Physical Access Controls
check_access_controls() {
    log_compliance "Checking access controls (CC6.1)..."

    # Verify SSH configuration
    local violations=0

    # Check for root login disabled
    if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
        log_compliance "VIOLATION: Root login is enabled"
        ((violations++))
    fi

    # Check for password authentication disabled
    if grep -q "PasswordAuthentication yes" /etc/ssh/sshd_config; then
        log_compliance "VIOLATION: Password authentication is enabled"
        ((violations++))
    fi

    # Check for key-based authentication only
    if ! grep -q "PubkeyAuthentication yes" /etc/ssh/sshd_config; then
        log_compliance "VIOLATION: Public key authentication is not enabled"
        ((violations++))
    fi

    log_compliance "Access controls check completed: $violations violations"
    return $violations
}

# CC6.2 - User Access Provisioning and Deprovisioning
check_user_provisioning() {
    log_compliance "Checking user provisioning (CC6.2)..."

    # Check for authorized users only
    local authorized_users=("sshuser")
    local violations=0

    # Get list of users with shell access
    local shell_users=$(getent passwd | grep -E '(/bin/bash|/bin/sh|/bin/ash)$' | cut -d: -f1)

    for user in $shell_users; do
        if [[ ! " ${authorized_users[@]} " =~ " $user " ]] && [[ "$user" != "root" ]]; then
            log_compliance "VIOLATION: Unauthorized user with shell access: $user"
            ((violations++))
        fi
    done

    log_compliance "User provisioning check completed: $violations violations"
    return $violations
}

# CC6.3 - User Access Reviews
check_access_reviews() {
    log_compliance "Checking access reviews (CC6.3)..."

    # Check last access review date
    local review_file="/etc/ssh/last_access_review"
    local violations=0

    if [[ -f "$review_file" ]]; then
        local last_review=$(cat "$review_file")
        local review_age=$(( ($(date +%s) - $(date -d "$last_review" +%s)) / 86400 ))

        if [[ $review_age -gt 90 ]]; then
            log_compliance "VIOLATION: Access review overdue (last: $last_review, age: $review_age days)"
            ((violations++))
        fi
    else
        log_compliance "VIOLATION: No access review record found"
        ((violations++))
    fi

    log_compliance "Access reviews check completed: $violations violations"
    return $violations
}

# CC7.1 - System Monitoring
check_monitoring() {
    log_compliance "Checking system monitoring (CC7.1)..."

    local violations=0

    # Check if logging is enabled
    if ! pgrep rsyslogd > /dev/null; then
        log_compliance "VIOLATION: System logging is not running"
        ((violations++))
    fi

    # Check if fail2ban is running
    if ! pgrep fail2ban > /dev/null; then
        log_compliance "VIOLATION: Intrusion detection (fail2ban) is not running"
        ((violations++))
    fi

    # Check log retention
    local log_files=$(find /var/log/auth -name "*.log" -mtime +30)
    if [[ -z "$log_files" ]]; then
        log_compliance "VIOLATION: Insufficient log retention (< 30 days)"
        ((violations++))
    fi

    log_compliance "System monitoring check completed: $violations violations"
    return $violations
}

# CC8.1 - Change Management
check_change_management() {
    log_compliance "Checking change management (CC8.1)..."

    local violations=0

    # Check for configuration changes
    local config_hash=$(sha256sum /etc/ssh/sshd_config | cut -d' ' -f1)
    local baseline_hash_file="/etc/ssh/sshd_config.baseline_hash"

    if [[ -f "$baseline_hash_file" ]]; then
        local baseline_hash=$(cat "$baseline_hash_file")
        if [[ "$config_hash" != "$baseline_hash" ]]; then
            log_compliance "WARNING: SSH configuration has changed from baseline"
            log_compliance "Current hash: $config_hash"
            log_compliance "Baseline hash: $baseline_hash"
        fi
    else
        echo "$config_hash" > "$baseline_hash_file"
        log_compliance "INFO: Baseline configuration hash established"
    fi

    log_compliance "Change management check completed: $violations violations"
    return $violations
}

# Generate compliance report
generate_compliance_report() {
    local report_file="/var/log/auth/compliance-report-$(date +%Y%m%d).json"

    cat > "$report_file" << EOF
{
  "report_date": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "compliance_framework": "SOC 2",
  "container_id": "$(hostname)",
  "checks": {
    "access_controls": {
      "status": "$1",
      "violations": $2
    },
    "user_provisioning": {
      "status": "$3",
      "violations": $4
    },
    "access_reviews": {
      "status": "$5",
      "violations": $6
    },
    "monitoring": {
      "status": "$7",
      "violations": $8
    },
    "change_management": {
      "status": "$9",
      "violations": ${10}
    }
  },
  "overall_status": "$11",
  "total_violations": ${12}
}
EOF

    log_compliance "Compliance report generated: $report_file"
}

# Main compliance check
main() {
    log_compliance "Starting SOC 2 compliance check..."

    local total_violations=0
    local check_results=()

    # Run all compliance checks
    check_access_controls
    local ac_violations=$?
    check_results+=("$([ $ac_violations -eq 0 ] && echo 'PASS' || echo 'FAIL')" "$ac_violations")
    ((total_violations += ac_violations))

    check_user_provisioning
    local up_violations=$?
    check_results+=("$([ $up_violations -eq 0 ] && echo 'PASS' || echo 'FAIL')" "$up_violations")
    ((total_violations += up_violations))

    check_access_reviews
    local ar_violations=$?
    check_results+=("$([ $ar_violations -eq 0 ] && echo 'PASS' || echo 'FAIL')" "$ar_violations")
    ((total_violations += ar_violations))

    check_monitoring
    local mon_violations=$?
    check_results+=("$([ $mon_violations -eq 0 ] && echo 'PASS' || echo 'FAIL')" "$mon_violations")
    ((total_violations += mon_violations))

    check_change_management
    local cm_violations=$?
    check_results+=("$([ $cm_violations -eq 0 ] && echo 'PASS' || echo 'FAIL')" "$cm_violations")
    ((total_violations += cm_violations))

    # Determine overall status
    local overall_status="$([ $total_violations -eq 0 ] && echo 'COMPLIANT' || echo 'NON_COMPLIANT')"

    # Generate report
    generate_compliance_report "${check_results[@]}" "$overall_status" "$total_violations"

    log_compliance "Compliance check completed: $overall_status ($total_violations total violations)"

    # Exit with appropriate code
    exit $total_violations
}

# Run compliance check
main "$@"
```

## Best Practices and Guidelines

### Security Checklist

1. **Container Security**

   - [ ] Use minimal base image (Alpine Linux)
   - [ ] Run as non-root user where possible
   - [ ] Implement read-only filesystem
   - [ ] Use security contexts and capabilities
   - [ ] Enable AppArmor/SELinux profiles

2. **SSH Configuration**

   - [ ] Disable root login
   - [ ] Use key-based authentication only
   - [ ] Implement strong ciphers and MACs
   - [ ] Configure proper access controls
   - [ ] Enable comprehensive logging

3. **Network Security**

   - [ ] Use non-standard SSH ports
   - [ ] Implement network segmentation
   - [ ] Configure firewall rules
   - [ ] Use fail2ban for intrusion prevention
   - [ ] Monitor network traffic

4. **Key Management**

   - [ ] Implement automated key rotation
   - [ ] Use certificate-based authentication
   - [ ] Secure key distribution
   - [ ] Regular key auditing
   - [ ] Proper key backup procedures

5. **Monitoring and Compliance**
   - [ ] Implement comprehensive logging
   - [ ] Set up real-time monitoring
   - [ ] Configure alerting systems
   - [ ] Regular compliance audits
   - [ ] Incident response procedures

### Performance Optimization

1. **Container Performance**

   - Use multi-stage builds to reduce image size
   - Optimize resource limits and requests
   - Implement proper health checks
   - Use persistent volumes for logs

2. **SSH Performance**
   - Configure appropriate connection limits
   - Optimize cipher selection for performance
   - Use connection multiplexing where appropriate
   - Monitor resource usage

### Troubleshooting Guide

```bash
# Common troubleshooting commands
# Check container status
docker ps -a | grep openssh

# View container logs
docker logs openssh-container

# Check SSH configuration
docker exec openssh-container sshd -T

# Test SSH connectivity
ssh -p 2222 -v user@container-host

# Monitor active connections
docker exec openssh-container netstat -tn | grep :2222

# Check security logs
docker exec openssh-container tail -f /var/log/auth/sshd.log
```

## Conclusion

This comprehensive guide provides a production-ready approach to implementing secure OpenSSH containers with Docker. The solution covers all aspects of container security, from basic hardening to enterprise-grade monitoring and compliance.

Key benefits of this approach:

- **Enhanced Security**: Multiple layers of security controls
- **Scalability**: Horizontal scaling with load balancing
- **Compliance**: SOC 2 and other compliance framework support
- **Monitoring**: Comprehensive logging and alerting
- **Automation**: Automated key management and deployment

By implementing these practices, organizations can achieve secure, scalable, and compliant SSH infrastructure using containerization technologies while maintaining the highest security standards.

---

_Remember to regularly update container images, review security configurations, and conduct periodic security audits to maintain optimal security posture._
