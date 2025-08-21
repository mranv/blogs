---
author: Anubhav Gain
pubDatetime: 2025-08-06T18:00:00+05:30
tags:
  - Wazuh
  - Linux-Kernel
  - Auditd
  - SIEM
  - Security-Monitoring
  - System-Audit
  - Log-Collection
  - Threat-Detection
  - Blue-Team
  - SOC
modDatetime: 2025-08-06T18:00:00+05:30
title: "Practical Guide: Linux Kernel and Audit Log Monitoring with Wazuh"
slug: linux-kernel-audit-logs-wazuh-practical-guide
featured: true
draft: false
category: SIEM
description: Complete practical guide to collecting and monitoring Linux kernel logs and audit events with Wazuh, including journald integration, auditd configuration, and real-world troubleshooting.
---

# Practical Guide: Linux Kernel and Audit Log Monitoring with Wazuh

## Introduction

Linux systems generate critical security information through kernel logs and audit events. This guide provides a practical, tested approach to collecting and monitoring these logs using Wazuh, based on real-world implementations and community experiences.

## What We'll Monitor

1. **Kernel Logs**: Hardware events, system calls, security violations
2. **Audit Events**: User actions, file access, system changes
3. **System Events**: Authentication, network connections, process execution

## Architecture Overview

```mermaid
flowchart TB
    subgraph "Linux System"
        K[Linux Kernel] --> KL[Kernel Logs]
        A[Auditd] --> AL[Audit Logs]
        S[System Events] --> SL[System Logs]

        KL --> J[journald]
        AL --> AF[/var/log/audit/audit.log]
        SL --> SF[/var/log/syslog]
    end

    subgraph "Wazuh Agent"
        LC[Log Collector]
        J --> LC
        AF --> LC
        SF --> LC
        LC --> AB[Agent Buffer]
        AB --> T[TLS Transport]
    end

    subgraph "Wazuh Manager"
        T --> WM[Log Reception]
        WM --> D[Decoders]
        D --> R[Rules Engine]
        R --> AG[Alert Generation]
        AG --> FB[Filebeat]
    end

    subgraph "Wazuh Dashboard"
        FB --> WI[Wazuh Indexer]
        WI --> WD[Dashboard]
    end

    style K fill:#ff6b6b
    style A fill:#4dabf7
    style R fill:#51cf66
    style WD fill:#ffd43b
```

## Part 1: Kernel Log Collection

### Method 1: Journald Integration (Recommended for Modern Systems)

#### Basic Configuration

Add to `/var/ossec/etc/ossec.conf` on the agent:

```xml
<ossec_config>
  <!-- Collect all journal logs including kernel -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
  </localfile>
</ossec_config>
```

#### Advanced Kernel-Specific Configuration

For kernel logs only:

```xml
<ossec_config>
  <!-- Kernel logs via journald -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <filter field="_TRANSPORT">kernel</filter>
  </localfile>

  <!-- High-priority kernel events -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <query>_TRANSPORT=kernel AND PRIORITY<=3</query>
    <target>kernel-critical</target>
  </localfile>
</ossec_config>
```

#### Testing Journald Filters

Before applying, test your filters:

```bash
# View kernel messages
journalctl _TRANSPORT=kernel

# Shorthand for kernel messages
journalctl -k

# Real-time kernel monitoring
journalctl -k -f

# Check if wazuh user can access
sudo -u wazuh journalctl --since "1 minute ago" --no-pager
```

### Method 2: Traditional Syslog Files

For older systems or specific requirements:

```xml
<ossec_config>
  <!-- Kernel logs -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/kern.log</location>
  </localfile>

  <!-- System messages (includes kernel) -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/messages</location>
  </localfile>

  <!-- All syslog -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/syslog</location>
  </localfile>
</ossec_config>
```

### Troubleshooting Kernel Log Collection

#### Issue: No Kernel Logs in Wazuh

1. **Check Permissions**:
```bash
# Add wazuh to required groups
sudo usermod -a -G systemd-journal wazuh
sudo usermod -a -G adm wazuh

# Restart agent
sudo systemctl restart wazuh-agent
```

2. **Verify Log Collection**:
```bash
# Check agent log
tail -f /var/ossec/logs/ossec.log | grep -E "journald|kernel"

# Test log generation
echo "Test kernel message" | sudo tee /dev/kmsg

# Check if collected
grep "Test kernel message" /var/ossec/logs/archives/archives.log
```

## Part 2: Audit Log Collection with Auditd

### Step 1: Install and Configure Auditd

```bash
# Ubuntu/Debian
sudo apt-get install -y auditd audispd-plugins

# RHEL/CentOS
sudo yum install -y audit audit-libs

# Enable and start
sudo systemctl enable auditd
sudo systemctl start auditd
```

### Step 2: Configure Wazuh Agent

Add to `/var/ossec/etc/ossec.conf`:

```xml
<ossec_config>
  <localfile>
    <log_format>audit</log_format>
    <location>/var/log/audit/audit.log</location>
  </localfile>
</ossec_config>
```

### Step 3: Create Audit Rules

#### Monitor Root Command Execution

Edit `/etc/audit/rules.d/audit.rules`:

```bash
# Monitor all commands by root (euid=0)
-a exit,always -F arch=b64 -F euid=0 -S execve -k audit-wazuh-c
-a exit,always -F arch=b32 -F euid=0 -S execve -k audit-wazuh-c

# Monitor specific user commands (uid=1000)
-a exit,always -F arch=b64 -F auid=1000 -S execve -k user-commands
-a exit,always -F arch=b32 -F auid=1000 -S execve -k user-commands

# File access monitoring
-w /etc/passwd -p wa -k passwd-changes
-w /etc/shadow -p wa -k shadow-changes
-w /etc/sudoers -p wa -k sudoers-changes

# System calls
-a always,exit -F arch=b64 -S open,openat -F exit=-EPERM -k access-denied
-a always,exit -F arch=b64 -S unlink,rename -k file-deletion

# Kernel module monitoring
-w /sbin/insmod -p x -k kernel-modules
-w /sbin/rmmod -p x -k kernel-modules
-w /sbin/modprobe -p x -k kernel-modules
```

Apply rules:

```bash
# Load rules
sudo auditctl -R /etc/audit/rules.d/audit.rules

# Verify rules
sudo auditctl -l
```

### Step 4: Configure Wazuh Server

#### Update Audit Keys List

The Wazuh server maintains a list of audit keys at `/var/ossec/etc/lists/audit-keys`:

```bash
# View current keys
cat /var/ossec/etc/lists/audit-keys

# Add custom keys
echo "user-commands:command" | sudo tee -a /var/ossec/etc/lists/audit-keys
echo "passwd-changes:write" | sudo tee -a /var/ossec/etc/lists/audit-keys
echo "kernel-modules:command" | sudo tee -a /var/ossec/etc/lists/audit-keys

# Restart manager
sudo systemctl restart wazuh-manager
```

#### Create Custom Rules

Add to `/var/ossec/etc/rules/local_rules.xml`:

```xml
<group name="audit,">
  <!-- Enhanced root command detection -->
  <rule id="100002" level="6">
    <if_sid>80792</if_sid>
    <field name="audit.euid">0</field>
    <description>Root command execution: $(audit.exe) by user $(audit.auid)</description>
    <group>audit_command,</group>
  </rule>

  <!-- Detect suspicious commands -->
  <rule id="100003" level="8">
    <if_sid>100002</if_sid>
    <field name="audit.exe">nc|ncat|netcat|tcpdump|wireshark</field>
    <description>Suspicious command by root: $(audit.exe)</description>
    <group>audit_command,suspicious_command,</group>
  </rule>

  <!-- File modification alerts -->
  <rule id="100004" level="7">
    <if_sid>80784</if_sid>
    <field name="audit.key">passwd-changes</field>
    <description>Password file modified: $(audit.file.name)</description>
    <group>audit_watch_write,</group>
  </rule>

  <!-- Kernel module changes -->
  <rule id="100005" level="9">
    <if_sid>80792</if_sid>
    <field name="audit.key">kernel-modules</field>
    <description>Kernel module operation: $(audit.exe)</description>
    <group>audit_command,kernel_modules,</group>
  </rule>
</group>
```

## Part 3: Real-World Testing

### Generate Test Events

```bash
# Test root commands
sudo su -
whoami
ls /etc/shadow
cat /etc/passwd

# Test kernel module operations
sudo modprobe -v scsi_debug
sudo rmmod scsi_debug

# Test file modifications
sudo touch /etc/test-file
sudo rm /etc/test-file

# Generate kernel messages
echo "Security test message" | sudo tee /dev/kmsg
```

### Verify Alerts

```bash
# Check alerts on manager
sudo tail -f /var/ossec/logs/alerts/alerts.json | jq '.'

# Filter specific alerts
sudo grep "100002\|100003\|100004\|100005" /var/ossec/logs/alerts/alerts.log
```

## Part 4: Dashboard Configuration

### Create Visualizations

1. **Security Events View**:
   - Navigate to **Modules > Security Events**
   - Add filters:
     - `rule.groups: audit`
     - `rule.level >= 6`

2. **Audit Dashboard Queries**:

```kql
# Root commands
rule.id: 100002

# Suspicious commands
rule.id: 100003

# File modifications
rule.groups: audit_watch_write

# Kernel events
data.audit.key: kernel-modules

# Failed access attempts
data.audit.success: no
```

3. **Custom Dashboard Panels**:
   - Top users executing root commands
   - Command frequency timeline
   - File modification heat map
   - Failed access attempts by source

## Part 5: Common Issues and Solutions

### Issue 1: No Audit Events in Dashboard

**Solution**:
```bash
# Check if auditd is running
sudo systemctl status auditd

# Verify log file exists and growing
ls -la /var/log/audit/audit.log
tail -f /var/log/audit/audit.log

# Check agent configuration
grep -A5 "audit" /var/ossec/etc/ossec.conf

# Restart agent
sudo systemctl restart wazuh-agent
```

### Issue 2: High Log Volume

**Solution**:
```xml
<!-- Rate limit in ossec.conf -->
<ossec_config>
  <localfile>
    <log_format>audit</log_format>
    <location>/var/log/audit/audit.log</location>
    <frequency>10</frequency>
  </localfile>
</ossec_config>
```

### Issue 3: Missing Specific Events

**Debug Process**:
```bash
# Test audit rules
sudo auditctl -m "Test audit message"

# Search audit log
sudo ausearch -m USER_CMD -ts recent

# Check key-based search
sudo ausearch -k audit-wazuh-c

# Use ossec-logtest
echo 'type=SYSCALL msg=audit(1234567890.123:456): arch=c000003e syscall=59 success=yes exit=0 a0=1234 a1=5678 items=2 ppid=1000 pid=2000 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=1 comm="ls" exe="/usr/bin/ls" key="audit-wazuh-c"' | sudo /var/ossec/bin/ossec-logtest
```

## Part 6: Performance Optimization

### Audit Rule Optimization

```bash
# Limit rules to specific users
-a exit,always -F arch=b64 -F auid>=1000 -F auid<2000 -S execve -k user-commands

# Exclude noisy processes
-a exit,never -F exe=/usr/bin/bash
-a exit,always -F arch=b64 -F euid=0 -S execve -k root-commands

# Use syscall filtering
-a exit,always -F arch=b64 -S socket -F a0=2 -k network-connections
```

### Wazuh Agent Tuning

```xml
<ossec_config>
  <!-- Buffer configuration -->
  <client_buffer>
    <disabled>no</disabled>
    <queue_size>5000</queue_size>
    <events_per_second>500</events_per_second>
  </client_buffer>
</ossec_config>
```

## Part 7: Security Use Cases

### 1. Privilege Escalation Detection

```xml
<rule id="100010" level="10">
  <if_sid>100002</if_sid>
  <field name="audit.auid" negate="yes">0</field>
  <field name="audit.exe">su|sudo|pkexec</field>
  <description>Privilege escalation: $(audit.auid) to root via $(audit.exe)</description>
  <group>audit_command,privilege_escalation,</group>
</rule>
```

### 2. Unauthorized Access Attempts

```xml
<rule id="100011" level="8">
  <if_sid>80784</if_sid>
  <field name="audit.success">no</field>
  <description>Failed file access attempt: $(audit.file.name)</description>
  <group>audit_watch_read,access_denied,</group>
</rule>
```

### 3. Suspicious Network Tools

```xml
<rule id="100012" level="9">
  <if_sid>80792</if_sid>
  <field name="audit.exe">nmap|masscan|zmap|nikto</field>
  <description>Network scanning tool detected: $(audit.exe)</description>
  <group>audit_command,recon,</group>
</rule>
```

## Best Practices

1. **Start Small**: Begin with basic rules and expand gradually
2. **Test Thoroughly**: Verify rules in test environment first
3. **Monitor Performance**: Watch system load with audit enabled
4. **Document Rules**: Maintain documentation for audit rules
5. **Regular Review**: Periodically review and update rules

## Conclusion

This practical guide provides a working foundation for Linux kernel and audit log monitoring with Wazuh. By implementing these configurations, you'll gain deep visibility into system activities, enabling effective threat detection and compliance monitoring.

Remember: Security monitoring is an iterative process. Start with the basics, test thoroughly, and expand based on your specific security requirements.

## Additional Resources

- [Wazuh Documentation - System Call Monitoring](https://documentation.wazuh.com/current/user-manual/capabilities/system-calls-monitoring/index.html)
- [Linux Audit Documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/security_guide/chap-system_auditing)
- [Wazuh Community Forum](https://groups.google.com/g/wazuh)
- [Audit Rule Examples](https://github.com/Neo23x0/auditd)

---

*Building comprehensive security monitoring, one log at a time. Stay vigilant! 🛡️*
