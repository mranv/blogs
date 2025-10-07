---
author: Anubhav Gain
pubDatetime: 2025-01-06T14:30:00+05:30
modDatetime: 2025-01-06T14:30:00+05:30
title: "Monitoring Root Command Execution with Auditd + Wazuh - Break It, Fix It, Learn It"
slug: monitoring-root-command-execution-auditd-wazuh
featured: true
draft: false
tags:
  - Wazuh
  - Auditd
  - Linux-Security
  - SIEM
  - Threat-Detection
  - Security-Monitoring
  - Blue-Team
  - SOC
  - Incident-Response
  - Privileged-Access
category: SIEM
description: Real-world guide to implementing root command monitoring using Auditd and Wazuh, including troubleshooting a server crash and rebuilding the entire detection pipeline from scratch.
---

# Monitoring Root Command Execution with Auditd + Wazuh - Break It, Fix It, Learn It

## The Real Story: When Everything Breaks

Today was messy. But you know what? That's exactly how real learning happens.

I jumped back into my Wazuh lab after a break, tried to configure Auditd rules to monitor root-level command executions, and **boom** — 💀 **Server crashed**.

Why? A misconfigured rule sent the Wazuh manager into chaos.

But instead of panicking, I did what every Blue Teamer eventually learns to do:
- 🛠️ Rebuilt the broken environment
- ✅ Debugged and fixed rule conflicts
- 🔁 Reconnected agents
- 📈 Verified logs and alerts from Auditd

**"Break it. Fix it. Learn. Repeat."** That's the hacker way. That's the SOC mindset.

## Why This Matters

In the real world:
- 🔹 Things break
- 🔹 Logs go missing
- 🔹 Rules misfire

But if you know **why** it broke, you're already ahead.

Today wasn't about perfect success. It was about **resilience + technical clarity**.

## The Goal: Detect Root Command Execution

We're building a system to detect and alert on any command run by root (`euid=0`) using:
- **Auditd** for syscall logging
- **Wazuh** for alerting via custom rules

### Environment Setup

```yaml
Environment:
  Agent: Kali Linux with Wazuh agent
  Manager: Wazuh OVA (Wazuh manager)
  Components:
    - Auditd installed on agent
    - Custom rules set on manager
    - Real-time alerting pipeline
```

## Architecture Overview

```mermaid
flowchart LR
    subgraph "Linux System (Kali)"
        A1[Root User] --> A2[System Calls]
        A2 --> A3[Kernel]
        A3 --> A4[Auditd]
        A4 --> A5[/var/log/audit/audit.log]
    end

    subgraph "Wazuh Agent"
        A5 --> B1[Log Collection]
        B1 --> B2[Agent Buffer]
        B2 --> B3[Secure Transport]
    end

    subgraph "Wazuh Manager"
        B3 --> C1[Log Reception]
        C1 --> C2[Decoder]
        C2 --> C3[Rules Engine]
        C3 --> C4[Alert Generation]
        C4 --> C5[Dashboard/API]
    end

    style A1 fill:#ff6b6b,stroke:#c92a2a
    style A4 fill:#4dabf7,stroke:#1864ab
    style C3 fill:#51cf66,stroke:#2b8a3e
    style C4 fill:#ffd43b,stroke:#fab005
```

## Step-by-Step Implementation

### Step 1: Install Auditd on the Agent

```bash
# Install Auditd and plugins
sudo apt install auditd audispd-plugins -y

# Enable and start the service
sudo systemctl enable auditd --now
sudo systemctl start auditd.service

# Verify installation
sudo systemctl status auditd
```

### Step 2: Configure Auditd Rules

First, check existing rules:

```bash
sudo auditctl -l
```

Now, add rules to track root commands:

```bash
# Edit the rules file
sudo nano /etc/audit/rules.d/audit.rules
```

Add these rules to monitor all commands executed with root privileges:

```bash
# Monitor all execve syscalls for root user (euid=0)
-a always,exit -F arch=b64 -F euid=0 -S execve -k root_commands
-a always,exit -F arch=b32 -F euid=0 -S execve -k root_commands

# Additional monitoring for specific sensitive commands
-a always,exit -F arch=b64 -F euid=0 -F exe=/usr/bin/passwd -k passwd_changes
-a always,exit -F arch=b64 -F euid=0 -F exe=/usr/sbin/useradd -k user_creation
-a always,exit -F arch=b64 -F euid=0 -F exe=/usr/sbin/userdel -k user_deletion
-a always,exit -F arch=b64 -F euid=0 -F exe=/bin/rm -F path=/etc/* -k config_deletion
```

Apply the rules:

```bash
# Load the new rules
sudo auditctl -R /etc/audit/rules.d/audit.rules

# Verify rules are loaded
sudo auditctl -l
```

### Step 3: Configure Wazuh Manager

Create the audit key list:

```bash
# Create directory if it doesn't exist
sudo mkdir -p /var/ossec/etc/lists

# Add our audit keys
echo "root_commands" | sudo tee /var/ossec/etc/lists/audit-keys
echo "passwd_changes" | sudo tee -a /var/ossec/etc/lists/audit-keys
echo "user_creation" | sudo tee -a /var/ossec/etc/lists/audit-keys
echo "user_deletion" | sudo tee -a /var/ossec/etc/lists/audit-keys
echo "config_deletion" | sudo tee -a /var/ossec/etc/lists/audit-keys
```

### Step 4: Configure Log Collection

Edit the Wazuh configuration:

```bash
sudo nano /var/ossec/etc/ossec.conf
```

Add the audit log monitoring configuration:

```xml
<ossec_config>
  <!-- Audit log monitoring -->
  <localfile>
    <location>/var/log/audit/audit.log</location>
    <log_format>audit</log_format>
  </localfile>
</ossec_config>
```

### Step 5: Create Custom Detection Rules

This is where things got interesting (and where my server crashed initially). Here's the **working** configuration:

```bash
sudo nano /var/ossec/etc/rules/local_rules.xml
```

Add these rules:

```xml
<group name="audit,audit_command,">
  <!-- Base rule for audit commands -->
  <rule id="100001" level="3">
    <if_sid>80700</if_sid>
    <list field="audit.key" lookup="match_key_value" check_value="root_commands">etc/lists/audit-keys</list>
    <description>Audit: Command executed by root: $(audit.exe)</description>
    <group>audit_command,</group>
  </rule>

  <!-- High-priority root command execution -->
  <rule id="100002" level="7">
    <if_sid>100001</if_sid>
    <field name="audit.euid">^0$</field>
    <description>Audit: Root command execution detected - Command: $(audit.exe) - User: $(audit.auid)</description>
    <group>audit_command,pci_dss_10.2.2,gdpr_IV_32.2,hipaa_164.312.b,nist_800_53_AU.14,tsc_CC6.1,tsc_CC7.2,tsc_CC7.3,</group>
  </rule>

  <!-- Critical: Password changes by root -->
  <rule id="100003" level="10">
    <if_sid>80700</if_sid>
    <list field="audit.key" lookup="match_key_value" check_value="passwd_changes">etc/lists/audit-keys</list>
    <description>Critical: Root user changed passwords - User affected: $(audit.auid)</description>
    <group>audit_command,authentication_failed,pci_dss_10.2.5,gdpr_IV_35.7,gdpr_IV_32.2,hipaa_164.312.b,nist_800_53_AU.14,nist_800_53_AC.7,tsc_CC6.1,tsc_CC7.2,tsc_CC7.3,</group>
  </rule>

  <!-- User creation/deletion monitoring -->
  <rule id="100004" level="8">
    <if_sid>80700</if_sid>
    <list field="audit.key" lookup="match_key_value" check_value="user_creation">etc/lists/audit-keys</list>
    <description>Audit: New user created by root - Command: $(audit.exe)</description>
    <group>audit_command,account_changed,pci_dss_10.2.5,gdpr_IV_35.7,gdpr_IV_32.2,hipaa_164.312.b,nist_800_53_AU.14,nist_800_53_AC.2,tsc_CC6.8,tsc_CC7.2,tsc_CC7.3,</group>
  </rule>

  <rule id="100005" level="9">
    <if_sid>80700</if_sid>
    <list field="audit.key" lookup="match_key_value" check_value="user_deletion">etc/lists/audit-keys</list>
    <description>Critical: User deleted by root - Command: $(audit.exe)</description>
    <group>audit_command,account_changed,pci_dss_10.2.5,gdpr_IV_35.7,gdpr_IV_32.2,hipaa_164.312.b,nist_800_53_AU.14,nist_800_53_AC.2,tsc_CC6.8,tsc_CC7.2,tsc_CC7.3,</group>
  </rule>

  <!-- Configuration file deletion -->
  <rule id="100006" level="10">
    <if_sid>80700</if_sid>
    <list field="audit.key" lookup="match_key_value" check_value="config_deletion">etc/lists/audit-keys</list>
    <description>Critical: Configuration file deleted by root - Path: $(audit.file.name)</description>
    <group>audit_command,config_changed,pci_dss_10.5.5,gdpr_IV_35.7,hipaa_164.312.b,nist_800_53_AU.14,tsc_CC6.1,tsc_CC7.2,tsc_CC7.3,</group>
  </rule>
</group>
```

### Step 6: The Critical Restart (Where Things Can Break)

```bash
# Test configuration first!
sudo /var/ossec/bin/ossec-analysisd -t

# If test passes, restart
sudo systemctl restart wazuh-manager

# Monitor logs for errors
sudo tail -f /var/ossec/logs/ossec.log
```

## Troubleshooting: When Things Go Wrong

### Issue 1: Server Crash After Adding Rules

**Symptoms:**
- Wazuh manager becomes unresponsive
- High CPU usage
- Log flooding

**Root Cause:**
- Incorrect rule syntax
- Missing closing tags
- Circular rule dependencies

**Fix:**
```bash
# Stop the service
sudo systemctl stop wazuh-manager

# Check rule syntax
sudo /var/ossec/bin/ossec-analysisd -t

# Fix syntax errors in local_rules.xml
# Remove problematic rules temporarily

# Start with minimal configuration
sudo systemctl start wazuh-manager
```

### Issue 2: No Alerts Generated

**Symptoms:**
- Auditd logs show events
- Wazuh doesn't generate alerts

**Debugging Steps:**
```bash
# Check if agent is reading audit logs
sudo grep audit /var/ossec/logs/ossec.log

# Verify audit log format
sudo ausearch -k root_commands

# Test rule matching
sudo /var/ossec/bin/ossec-logtest
# Paste a sample audit log entry
```

### Issue 3: Performance Impact

**Symptoms:**
- System slowdown
- High disk I/O

**Optimization:**
```bash
# Adjust audit rules to be more specific
# Instead of monitoring all execve, target specific binaries

# Edit /etc/audit/rules.d/audit.rules
-a always,exit -F arch=b64 -F euid=0 -F exe=/bin/su -k root_commands
-a always,exit -F arch=b64 -F euid=0 -F exe=/usr/bin/sudo -k root_commands
-a always,exit -F arch=b64 -F euid=0 -F exe=/bin/bash -k root_commands
```

## Testing the Detection

### Generate Test Events

```bash
# Switch to root
sudo su

# Run various commands
whoami
ls /etc
cat /etc/passwd
useradd testuser
passwd testuser
userdel testuser
```

### Verify Alert Generation

Check alerts in real-time:

```bash
# On Wazuh Manager
sudo tail -f /var/ossec/logs/alerts/alerts.json | jq '.'
```

Example alert output:

```json
{
  "timestamp": "2025-01-06T14:30:00.000+0000",
  "rule": {
    "level": 7,
    "description": "Audit: Root command execution detected - Command: /bin/ls - User: 1000",
    "id": "100002",
    "firedtimes": 1,
    "groups": ["audit", "audit_command", "pci_dss_10.2.2"]
  },
  "agent": {
    "id": "001",
    "name": "kali-agent"
  },
  "data": {
    "audit": {
      "euid": "0",
      "auid": "1000",
      "exe": "/bin/ls",
      "key": "root_commands"
    }
  }
}
```

## Dashboard Integration

### Creating Custom Dashboards

1. **Access Wazuh Dashboard**
   - Navigate to Stack Management → Index Patterns
   - Ensure `wazuh-alerts-*` exists

2. **Create Visualization**
   ```
   Visualization Type: Data Table
   Metrics: Count
   Buckets:
     - Split Rows: rule.id
     - Split Rows: audit.exe
     - Split Rows: agent.name
   ```

3. **Build Dashboard**
   - Add visualization for rule.id: 100002
   - Create time-series chart for root command frequency
   - Add top commands executed by root

### Sample KQL Queries

```kql
# All root commands in last 24h
rule.id: 100002 AND @timestamp >= now-24h

# Password changes by root
rule.id: 100003

# User management activities
rule.id: (100004 OR 100005)

# Critical configuration changes
rule.id: 100006 AND rule.level >= 9
```

## Advanced Configuration

### 1. Enhanced Audit Rules

```bash
# Monitor specific system directories
-w /etc/shadow -p wa -k shadow_file_changes
-w /etc/passwd -p wa -k passwd_file_changes
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config_changes

# Monitor kernel modules
-w /sbin/insmod -p x -k kernel_modules
-w /sbin/rmmod -p x -k kernel_modules
-w /sbin/modprobe -p x -k kernel_modules

# Monitor system calls
-a always,exit -F arch=b64 -S open -F dir=/etc -F success=0 -k unauth_file_access
```

### 2. Correlation Rules

```xml
<group name="audit_correlation,">
  <!-- Multiple failed root access attempts -->
  <rule id="100010" level="10" frequency="5" timeframe="120">
    <if_matched_sid>100002</if_matched_sid>
    <same_field>agent.id</same_field>
    <description>Multiple root commands executed in short time</description>
    <group>audit_command,attacks,</group>
  </rule>

  <!-- Suspicious pattern: user creation followed by password change -->
  <rule id="100011" level="12">
    <if_sid>100004</if_sid>
    <if_matched_sid>100003</if_matched_sid>
    <same_field>agent.id</same_field>
    <time_interval>60</time_interval>
    <description>Suspicious: User created and password immediately changed</description>
    <group>audit_command,attacks,</group>
  </rule>
</group>
```

### 3. Integration with Active Response

```xml
<ossec_config>
  <active-response>
    <command>host-deny</command>
    <location>local</location>
    <level>12</level>
    <timeout>600</timeout>
  </active-response>
</ossec_config>
```

## Performance Considerations

### System Impact

Monitoring all root commands can impact system performance. Here's how to optimize:

1. **Selective Monitoring**
   ```bash
   # Instead of all execve calls, monitor specific high-risk commands
   -a exit,always -F arch=b64 -F euid=0 -F exe=/usr/bin/curl -k network_commands
   -a exit,always -F arch=b64 -F euid=0 -F exe=/usr/bin/wget -k network_commands
   ```

2. **Rate Limiting**
   ```bash
   # Add to /etc/audit/auditd.conf
   rate_limit = 500
   ```

3. **Log Rotation**
   ```bash
   # /etc/logrotate.d/audit
   /var/log/audit/audit.log {
       daily
       rotate 7
       compress
       delaycompress
       postrotate
           /sbin/service auditd restart > /dev/null
       endscript
   }
   ```

## Security Best Practices

1. **Protect Audit Configuration**
   ```bash
   # Make audit rules immutable
   -e 2
   ```

2. **Monitor Audit Daemon**
   ```xml
   <rule id="100020" level="10">
     <decoded_as>syslog</decoded_as>
     <match>auditd.*stopped</match>
     <description>Critical: Audit daemon stopped</description>
   </rule>
   ```

3. **Regular Review**
   - Weekly review of root command patterns
   - Monthly audit rule effectiveness assessment
   - Quarterly false positive tuning

## Compliance Mapping

This configuration helps meet various compliance requirements:

| Compliance | Requirement | How This Helps |
|------------|-------------|----------------|
| PCI DSS 10.2.2 | Monitor all actions by privileged users | Tracks all root commands |
| HIPAA 164.312(b) | Audit controls | Comprehensive audit logging |
| GDPR Article 32 | Security of processing | Monitors system changes |
| NIST 800-53 AU-14 | Session audit | Tracks privileged sessions |
| SOC 2 CC6.1 | Logical access controls | Monitors privilege usage |

## Lessons Learned

1. **Test in isolation first** - Always test new rules on a non-production system
2. **Incremental changes** - Add rules one at a time
3. **Monitor performance** - Watch system resources after changes
4. **Document everything** - Your future self will thank you
5. **Have a rollback plan** - Know how to quickly disable problematic rules

## Conclusion

Today's journey from a crashed server to a working root command monitoring system taught me more than any perfect tutorial could. The real world is messy, systems break, and that's where true learning happens.

Key takeaways:
- 🔧 Building resilience through breaking and fixing
- 📊 Understanding the full audit pipeline
- 🚨 Creating meaningful security alerts
- 🛡️ Protecting critical system operations

Remember: **"Break it. Fix it. Learn. Repeat."**

That's not just a motto—it's the path to becoming a skilled security professional.

## Next Steps

1. Extend monitoring to specific application commands
2. Integrate with SOAR for automated response
3. Build ML models for anomaly detection
4. Create executive dashboards for compliance reporting

---

*No shortcuts, no copy-paste fixes. Just raw, real learning. Building detection muscles one broken server at a time. 💪*
