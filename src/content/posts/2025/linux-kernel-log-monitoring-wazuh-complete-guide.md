---
author: Anubhav Gain
pubDatetime: 2025-01-06T16:00:00+05:30
tags:
  - Wazuh
  - Linux-Kernel
  - SIEM
  - Security-Monitoring
  - Journald
  - Syslog
  - Threat-Detection
  - System-Security
  - Log-Analysis
  - Blue-Team
modDatetime: 2025-01-06T16:00:00+05:30
title: "Complete Guide to Linux Kernel Log Monitoring with Wazuh: From Zero to Hero"
slug: linux-kernel-log-monitoring-wazuh-complete-guide
featured: true
draft: false
category: SIEM
description: Master Linux kernel log monitoring with Wazuh through practical examples, from basic journald integration to advanced security monitoring, including real-world troubleshooting and performance optimization.
---

# Complete Guide to Linux Kernel Log Monitoring with Wazuh: From Zero to Hero

## Introduction: Why Kernel Logs Matter

Linux kernel logs are the heartbeat of your system's security posture. They reveal:
- 🔍 Hardware failures and driver issues
- 🛡️ Security violations and exploit attempts
- 📊 System performance degradation
- 🚨 Memory corruption and segmentation faults
- 🔐 Unauthorized kernel module loading

Today, we'll build a comprehensive kernel log monitoring system using Wazuh that catches everything from rootkit installations to memory exploits.

## Architecture Overview

```mermaid
flowchart TB
    subgraph "Linux Kernel Space"
        K1[Kernel Ring Buffer]
        K2[printk Messages]
        K3[Security Events]
        K4[Driver Messages]
        K5[System Calls]
    end
    
    subgraph "User Space Logging"
        U1[/dev/kmsg]
        U2[klogd/rsyslog]
        U3[systemd-journald]
        U4[/var/log/kern.log]
        U5[dmesg Buffer]
    end
    
    subgraph "Wazuh Agent"
        W1[Log Collector]
        W2[journald Module]
        W3[syslog Module]
        W4[Command Module]
        W5[Agent Buffer]
    end
    
    subgraph "Wazuh Manager"
        M1[Log Analysis]
        M2[Decoders]
        M3[Rules Engine]
        M4[Alert Generation]
        M5[Integration]
    end
    
    K1 --> U1
    K2 --> U1
    K3 --> U1
    K4 --> U1
    K5 --> U1
    
    U1 --> U2
    U1 --> U3
    U2 --> U4
    U1 --> U5
    
    U3 --> W2
    U4 --> W3
    U5 --> W4
    
    W2 --> W1
    W3 --> W1
    W4 --> W1
    W1 --> W5
    
    W5 --> M1
    M1 --> M2
    M2 --> M3
    M3 --> M4
    M4 --> M5
    
    style K1 fill:#ff6b6b,stroke:#c92a2a
    style K3 fill:#ff6b6b,stroke:#c92a2a
    style W1 fill:#4dabf7,stroke:#1864ab
    style M3 fill:#51cf66,stroke:#2b8a3e
    style M4 fill:#ffd43b,stroke:#fab005
```

## Part 1: Modern Approach - Journald Integration

### Understanding Journald for Kernel Logs

Modern Linux distributions use systemd-journald to collect all system logs, including kernel messages. This provides structured logging with metadata.

### Basic Journald Configuration

Edit `/var/ossec/etc/ossec.conf`:

```xml
<ossec_config>
  <!-- Basic kernel log collection via journald -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
  </localfile>
</ossec_config>
```

### Advanced Journald Filtering

For production environments, filter kernel logs to reduce noise:

```xml
<ossec_config>
  <!-- Only kernel transport messages -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <filter field="_TRANSPORT">kernel</filter>
  </localfile>
  
  <!-- High-priority kernel messages only -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <query>_TRANSPORT=kernel AND PRIORITY<=3</query>
    <target>critical-kernel</target>
  </localfile>
  
  <!-- Security-related kernel events -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <query>_TRANSPORT=kernel AND (MESSAGE~".*SELinux.*" OR MESSAGE~".*audit.*" OR MESSAGE~".*security.*")</query>
    <target>kernel-security</target>
  </localfile>
</ossec_config>
```

### Manual Testing of Journald Filters

Before applying configurations, test your filters:

```bash
# View all kernel messages
journalctl _TRANSPORT=kernel

# Test priority filter
journalctl _TRANSPORT=kernel PRIORITY=0..3

# Security-related kernel events
journalctl _TRANSPORT=kernel | grep -E "(SELinux|audit|security)"

# Real-time kernel log monitoring
journalctl -f _TRANSPORT=kernel

# Last 100 kernel messages with timestamps
journalctl -k -n 100 --no-pager
```

## Part 2: Traditional Syslog Approach

### Classic Kernel Log Files

For systems using traditional syslog:

```xml
<ossec_config>
  <!-- Ubuntu/Debian kernel logs -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/kern.log</location>
  </localfile>
  
  <!-- RHEL/CentOS system messages -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/messages</location>
  </localfile>
  
  <!-- Generic syslog -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/syslog</location>
  </localfile>
</ossec_config>
```

### Multi-file Monitoring

Monitor multiple log locations for comprehensive coverage:

```xml
<ossec_config>
  <!-- Wildcard pattern for all system logs -->
  <localfile>
    <location>/var/log/*.log</location>
    <log_format>syslog</log_format>
  </localfile>
  
  <!-- Rotated kernel logs -->
  <localfile>
    <location>/var/log/kern.log*</location>
    <log_format>syslog</log_format>
    <exclude>/var/log/kern.log*.gz</exclude>
  </localfile>
</ossec_config>
```

## Part 3: Advanced Kernel Monitoring Techniques

### Direct Kernel Ring Buffer Access

```xml
<ossec_config>
  <!-- Real-time dmesg monitoring -->
  <localfile>
    <log_format>command</log_format>
    <command>dmesg -T --follow --level=err,crit,alert,emerg</command>
    <alias>kernel-errors</alias>
  </localfile>
  
  <!-- Periodic full kernel buffer snapshot -->
  <localfile>
    <log_format>command</log_format>
    <command>dmesg -T | tail -100</command>
    <frequency>300</frequency>
    <alias>kernel-snapshot</alias>
  </localfile>
</ossec_config>
```

### Kernel Module Monitoring

Track kernel module loading/unloading:

```xml
<ossec_config>
  <!-- Monitor loaded modules -->
  <localfile>
    <log_format>command</log_format>
    <command>lsmod | md5sum</command>
    <frequency>600</frequency>
    <alias>loaded-modules-hash</alias>
  </localfile>
  
  <!-- Detailed module info -->
  <localfile>
    <log_format>full_command</log_format>
    <command>for mod in $(lsmod | awk '{print $1}' | tail -n +2); do modinfo $mod 2>/dev/null | grep -E "^(filename|description|author|license):" | sed "s/^/$mod: /"; done</command>
    <frequency>3600</frequency>
    <alias>module-details</alias>
  </localfile>
</ossec_config>
```

### Security-Focused Kernel Monitoring

```xml
<ossec_config>
  <!-- OOM killer events -->
  <localfile>
    <log_format>command</log_format>
    <command>dmesg | grep -i "killed process" | tail -10</command>
    <frequency>60</frequency>
    <alias>oom-killer</alias>
  </localfile>
  
  <!-- Segmentation faults -->
  <localfile>
    <log_format>command</log_format>
    <command>dmesg | grep -i segfault | tail -10</command>
    <frequency>60</frequency>
    <alias>segfaults</alias>
  </localfile>
  
  <!-- USB device connections -->
  <localfile>
    <log_format>command</log_format>
    <command>dmesg | grep -E "USB.*: (new|Product|Manufacturer)" | tail -20</command>
    <frequency>30</frequency>
    <alias>usb-devices</alias>
  </localfile>
</ossec_config>
```

## Part 4: Custom Rules for Kernel Events

### Creating Kernel-Specific Rules

Add to `/var/ossec/etc/rules/local_rules.xml`:

```xml
<group name="kernel,linux,">
  <!-- Kernel module loading -->
  <rule id="110001" level="7">
    <decoded_as>syslog</decoded_as>
    <match>kernel: module</match>
    <regex>loaded|inserted</regex>
    <description>Kernel module loaded: $(log)</description>
    <group>kernel_modules,</group>
  </rule>
  
  <!-- Critical: Unknown module -->
  <rule id="110002" level="10">
    <if_sid>110001</if_sid>
    <regex>TAINT</regex>
    <description>Tainted kernel module loaded - possible rootkit</description>
    <group>kernel_modules,rootkit,</group>
  </rule>
  
  <!-- Memory corruption -->
  <rule id="110003" level="12">
    <decoded_as>syslog</decoded_as>
    <match>kernel:</match>
    <regex>segfault|general protection fault</regex>
    <description>Kernel detected memory corruption: $(log)</description>
    <group>kernel_security,exploit,</group>
  </rule>
  
  <!-- OOM Killer -->
  <rule id="110004" level="9">
    <decoded_as>syslog</decoded_as>
    <match>kernel: Out of memory: Kill process</match>
    <description>Out of Memory: Process killed by kernel</description>
    <group>kernel_resource,system_error,</group>
  </rule>
  
  <!-- USB device detection -->
  <rule id="110005" level="5">
    <decoded_as>syslog</decoded_as>
    <match>kernel: usb</match>
    <regex>new USB device found</regex>
    <description>New USB device connected</description>
    <group>kernel_hardware,</group>
  </rule>
  
  <!-- Suspicious USB -->
  <rule id="110006" level="10">
    <if_sid>110005</if_sid>
    <regex>BadUSB|Rubber Ducky|WHID</regex>
    <description>Suspicious USB device detected</description>
    <group>kernel_hardware,attack,</group>
  </rule>
  
  <!-- SELinux violations -->
  <rule id="110007" level="8">
    <decoded_as>syslog</decoded_as>
    <match>kernel: audit</match>
    <regex>denied|violation</regex>
    <description>SELinux security violation</description>
    <group>kernel_security,access_denied,</group>
  </rule>
  
  <!-- Kernel panic indicators -->
  <rule id="110008" level="12">
    <decoded_as>syslog</decoded_as>
    <match>kernel:</match>
    <regex>panic|Oops|BUG:|Unable to handle kernel</regex>
    <description>Kernel panic or critical error detected</description>
    <group>kernel_error,system_error,</group>
  </rule>
</group>
```

### Advanced Correlation Rules

```xml
<group name="kernel_correlation,">
  <!-- Multiple module loads in short time -->
  <rule id="110020" level="12" frequency="5" timeframe="60">
    <if_matched_sid>110001</if_matched_sid>
    <same_field>agent.id</same_field>
    <description>Multiple kernel modules loaded rapidly - possible rootkit installation</description>
    <group>kernel_modules,rootkit,</group>
  </rule>
  
  <!-- Repeated segfaults -->
  <rule id="110021" level="14" frequency="3" timeframe="300">
    <if_matched_sid>110003</if_matched_sid>
    <same_field>agent.id</same_field>
    <description>Multiple memory corruption events - active exploitation attempt</description>
    <group>kernel_security,active_attack,</group>
  </rule>
</group>
```

## Part 5: Performance Optimization

### Agent Buffer Configuration

Optimize for high-volume kernel logs:

```xml
<ossec_config>
  <client_buffer>
    <disabled>no</disabled>
    <queue_size>20000</queue_size>
    <events_per_second>2000</events_per_second>
  </client_buffer>
  
  <!-- Specific buffer for kernel logs -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <filter field="_TRANSPORT">kernel</filter>
    <out_format>json</out_format>
    <target>kernel</target>
    <reconnect_time>10</reconnect_time>
  </localfile>
</ossec_config>
```

### Rate Limiting and Filtering

```xml
<ossec_config>
  <!-- Priority-based filtering -->
  <localfile>
    <location>journald</location>
    <log_format>journald</log_format>
    <query>_TRANSPORT=kernel AND (PRIORITY=0 OR PRIORITY=1 OR PRIORITY=2)</query>
    <target>kernel-critical</target>
    <only-future-events>yes</only-future-events>
  </localfile>
  
  <!-- Exclude noisy drivers -->
  <localfile>
    <location>/var/log/kern.log</location>
    <log_format>syslog</log_format>
    <exclude>nvidia|nouveau|iwlwifi</exclude>
  </localfile>
</ossec_config>
```

## Part 6: Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: No Kernel Logs Received

**Diagnosis:**
```bash
# Check if wazuh user can access logs
sudo -u wazuh journalctl --since "1 minute ago" --no-pager

# Verify permissions
ls -la /var/log/kern.log
groups wazuh
```

**Solution:**
```bash
# Add wazuh to systemd-journal group
sudo usermod -a -G systemd-journal wazuh
sudo usermod -a -G adm wazuh

# Restart agent
sudo systemctl restart wazuh-agent
```

#### Issue 2: High CPU Usage

**Diagnosis:**
```bash
# Check agent resource usage
top -p $(pgrep -f wazuh-agent)

# Review log collection rate
sudo /var/ossec/bin/agent_control -i $(hostname) -s
```

**Solution:**
```xml
<!-- Implement rate limiting -->
<localfile>
  <location>journald</location>
  <log_format>journald</log_format>
  <filter field="_TRANSPORT">kernel</filter>
  <frequency>10</frequency>
  <max-log-size>1MB</max-log-size>
</localfile>
```

#### Issue 3: Missing Critical Events

**Debug Process:**
```bash
# Test log collection
echo "Test kernel message" | sudo tee /dev/kmsg

# Check if received
sudo tail -f /var/ossec/logs/archives/archives.log | grep "Test kernel"

# Verify decoder
echo 'Jan  6 10:00:00 hostname kernel: [12345.678] Test message' | sudo /var/ossec/bin/ossec-logtest
```

## Part 7: Real-World Security Scenarios

### Scenario 1: Rootkit Detection

```bash
# Simulate suspicious module load
sudo insmod /path/to/suspicious.ko

# Expected alert
Rule: 110002 (level 10) -> 'Tainted kernel module loaded - possible rootkit'
```

### Scenario 2: Memory Exploitation

```bash
# Generate segfault
./vulnerable_program

# Expected alert
Rule: 110003 (level 12) -> 'Kernel detected memory corruption'
```

### Scenario 3: Resource Exhaustion

```bash
# Trigger OOM killer
stress-ng --vm 1 --vm-bytes 100G --timeout 10s

# Expected alert
Rule: 110004 (level 9) -> 'Out of Memory: Process killed by kernel'
```

## Part 8: Integration with SIEM Dashboard

### Creating Kernel Security Dashboard

#### Key Visualizations

1. **Kernel Events Timeline**
   ```
   Query: rule.groups: kernel
   Visualization: Line chart
   X-axis: @timestamp
   Y-axis: Count
   ```

2. **Top Kernel Security Events**
   ```
   Query: rule.groups: kernel AND rule.level >= 7
   Visualization: Data table
   Metrics: Count
   Buckets: rule.description
   ```

3. **Module Loading Activity**
   ```
   Query: rule.id: 110001
   Visualization: Bar chart
   Split series: agent.name
   ```

### Alert Queries

```kql
# Critical kernel security events
rule.groups: kernel AND rule.level >= 10

# Memory corruption attempts
rule.id: 110003 OR rule.id: 110021

# Suspicious USB devices
rule.id: 110006

# Kernel module changes
rule.groups: kernel_modules

# System stability issues
rule.groups: kernel_error OR rule.groups: system_error
```

## Part 9: Automation and Response

### Active Response Configuration

```xml
<ossec_config>
  <active-response>
    <command>disable-usb</command>
    <location>local</location>
    <rules_id>110006</rules_id>
    <timeout>0</timeout>
  </active-response>
  
  <active-response>
    <command>snapshot-memory</command>
    <location>local</location>
    <rules_id>110003</rules_id>
    <timeout>0</timeout>
  </active-response>
</ossec_config>
```

### Custom Response Scripts

Create `/var/ossec/active-response/bin/disable-usb.sh`:

```bash
#!/bin/bash
# Disable USB storage when suspicious device detected

ACTION=$1
USER=$2
IP=$3
ALERTID=$4
RULEID=$5

if [ "$ACTION" = "add" ]; then
    # Disable USB storage
    echo 'install usb-storage /bin/true' > /etc/modprobe.d/disable-usb-storage.conf
    
    # Log action
    logger -t wazuh-usb "USB storage disabled due to alert $ALERTID"
    
    # Remove existing USB storage module
    rmmod usb_storage 2>/dev/null
fi

exit 0
```

## Part 10: Best Practices

### 1. Storage Management

```bash
# Implement log rotation
cat > /etc/logrotate.d/wazuh-kernel << EOF
/var/ossec/logs/archives/kernel-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 wazuh wazuh
}
EOF
```

### 2. Regular Maintenance

```bash
#!/bin/bash
# Weekly kernel log analysis

# Check for unusual module activity
echo "=== Kernel Module Analysis ==="
lsmod | awk '{print $1}' | sort | comm -13 /etc/wazuh/baseline/modules.txt -

# Review high-severity kernel events
echo "=== High Severity Events (Last 7 days) ==="
grep -E "level\":(10|11|12|13|14|15)" /var/ossec/logs/alerts/alerts.json | \
    jq -r 'select(.rule.groups[]? | contains("kernel"))'

# Performance metrics
echo "=== Kernel Log Volume ==="
journalctl --since "7 days ago" _TRANSPORT=kernel | wc -l
```

### 3. Documentation

Maintain a runbook for kernel security events:

```markdown
## Kernel Security Event Response Playbook

### Event: Tainted Module Detected (Rule 110002)
1. Isolate affected system
2. Capture module information: `modinfo <module_name>`
3. Check module signature: `modprobe --dump-modversions <module>`
4. Review system logs for related activity
5. If confirmed malicious, remove and block

### Event: Memory Corruption (Rule 110003)
1. Identify affected process
2. Collect memory dump if possible
3. Review application logs
4. Check for known exploits
5. Apply patches or mitigations
```

## Conclusion

Kernel log monitoring with Wazuh provides deep visibility into system security and stability. By implementing the configurations in this guide, you'll be able to:

- 🔍 Detect kernel-level attacks and rootkits
- 🛡️ Identify memory corruption and exploitation attempts  
- 📊 Monitor system resource issues
- 🚨 Track hardware changes and USB devices
- 🔐 Enforce security policies at the kernel level

Remember: The kernel is the last line of defense. Monitor it well, and you'll catch attacks that bypass user-space security.

## Additional Resources

- [Wazuh Official Documentation](https://documentation.wazuh.com/)
- [Linux Kernel Security Documentation](https://www.kernel.org/doc/html/latest/admin-guide/security-bugs.html)
- [systemd-journald Manual](https://www.freedesktop.org/software/systemd/man/systemd-journald.service.html)

---

*Building robust security monitoring, one kernel message at a time. Stay vigilant! 🛡️*