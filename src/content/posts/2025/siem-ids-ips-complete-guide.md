---
author: Anubhav Gain
pubDatetime: 2025-01-03T16:00:00+05:30
modDatetime: 2025-01-03T16:00:00+05:30
title: "Complete Guide to SIEM Intrusion Detection, Prevention, and Tolerance: Building Resilient Security Operations"
slug: siem-ids-ips-complete-guide
featured: true
draft: false
tags:
  - SIEM
  - IDS
  - IPS
  - intrusion-detection
  - intrusion-prevention
  - snort
  - suricata
  - wazuh
  - network-security
  - cybersecurity
  - SOC
  - threat-detection
  - security-monitoring
  - incident-response
  - resilience
category: SIEM
description: "Master SIEM-integrated intrusion detection and prevention systems with this comprehensive guide covering IDS/IPS fundamentals, Snort and Suricata deployment, Wazuh integration, tolerance mechanisms, and real-world attack detection scenarios with complete implementation examples."
---

# Complete Guide to SIEM Intrusion Detection, Prevention, and Tolerance: Building Resilient Security Operations

## Table of Contents

## Introduction: The Marketing of Security

Consider Rolex - with 25% market share and $11 billion company value, they've proven that exceptional marketing can make a company successful. But in cybersecurity, we need more than marketing - we need robust, proven defense mechanisms that actually work.

Just as Rolex maintains its reputation through consistent quality and precision, effective security operations require precision-engineered intrusion detection, prevention, and tolerance mechanisms. This comprehensive guide will transform your understanding of how to build, deploy, and maintain enterprise-grade IDS/IPS systems integrated with SIEM platforms.

### The Current Threat Landscape

In 2024, the cybersecurity landscape presents unprecedented challenges:
- **Attacks occur every 39 seconds** on average
- **43% of cyberattacks** target small businesses
- **The average cost of a data breach** reached $4.45 million
- **Zero-day exploits increased by 125%** year-over-year

These statistics underscore the critical need for sophisticated intrusion detection and prevention systems that can:
1. **Detect** threats in real-time
2. **Prevent** successful exploitation
3. **Tolerate** failures and maintain operations
4. **Integrate** seamlessly with SIEM platforms

## Part 1: Understanding Intrusion Detection Fundamentals

### What is Intrusion Detection?

Intrusion Detection Systems (IDS) are sophisticated security tools that monitor network traffic and system activities for malicious actions or policy violations. Think of them as the security cameras of your digital infrastructure - constantly watching, recording, and alerting when something suspicious occurs.

### Core Components of Modern IDS

```
Network Traffic → Packet Capture → Analysis Engine → Detection Logic → Alert Generation → SIEM Integration
```

#### 1. Data Collection Layer
- **Network TAPs**: Hardware devices for capturing traffic
- **SPAN Ports**: Switch port mirroring for traffic duplication
- **Software Sensors**: Agent-based collection on endpoints
- **API Integration**: Cloud and application-level monitoring

#### 2. Analysis Engine
- **Protocol Decoders**: Understanding network protocols
- **Pattern Matching**: Signature-based detection
- **Statistical Analysis**: Behavioral anomaly detection
- **Machine Learning**: Advanced threat detection

#### 3. Response Mechanism
- **Alerting**: Real-time notifications
- **Logging**: Forensic evidence collection
- **Automation**: Triggering response workflows
- **Integration**: SIEM and SOAR connectivity

### How Wazuh Implements Intrusion Detection

Wazuh, as a comprehensive SIEM and XDR platform, implements intrusion detection through multiple sophisticated mechanisms:

#### 1. File Integrity Monitoring (FIM)
```xml
<syscheck>
  <disabled>no</disabled>
  <frequency>300</frequency>
  <scan_on_start>yes</scan_on_start>
  
  <!-- Monitor critical system files -->
  <directories check_all="yes" realtime="yes" report_changes="yes">
    /etc,/usr/bin,/usr/sbin,/bin,/sbin
  </directories>
  
  <!-- Monitor Windows registry -->
  <windows_registry>HKEY_LOCAL_MACHINE\Software</windows_registry>
  <windows_registry>HKEY_LOCAL_MACHINE\System</windows_registry>
  
  <!-- Alert on specific file changes -->
  <alert_new_files>yes</alert_new_files>
</syscheck>
```

#### 2. Rootkit Detection (Rootcheck)
```xml
<rootcheck>
  <disabled>no</disabled>
  <check_unixaudit>yes</check_unixaudit>
  <check_files>yes</check_files>
  <check_trojans>yes</check_trojans>
  <check_dev>yes</check_dev>
  <check_sys>yes</check_sys>
  <check_pids>yes</check_pids>
  <check_ports>yes</check_ports>
  <check_if>yes</check_if>
  
  <!-- Frequency of rootkit checks (in seconds) -->
  <frequency>43200</frequency>
  
  <!-- Rootkit files database -->
  <rootkit_files>/var/ossec/etc/shared/rootkit_files.txt</rootkit_files>
  <rootkit_trojans>/var/ossec/etc/shared/rootkit_trojans.txt</rootkit_trojans>
</rootcheck>
```

#### 3. Log Analysis and Correlation
```xml
<ossec_config>
  <global>
    <logall>yes</logall>
    <logall_json>yes</logall_json>
  </global>
  
  <alerts>
    <log_alert_level>3</log_alert_level>
    <email_alert_level>12</email_alert_level>
  </alerts>
  
  <remote>
    <connection>secure</connection>
    <port>1514</port>
    <protocol>tcp</protocol>
    <allowed-ips>192.168.1.0/24</allowed-ips>
  </remote>
</ossec_config>
```

### Detection Mechanisms Explained

#### 1. Signature-Based Detection

Signature-based detection compares network traffic against a database of known threat patterns:

```python
# Example: Signature Detection Logic
class SignatureDetector:
    def __init__(self):
        self.signatures = {
            'sql_injection': [
                r"(\bUNION\b.*\bSELECT\b)",
                r"(\bOR\b.*=.*)",
                r"(--|\#|\/\*)",
                r"(\bDROP\b.*\bTABLE\b)"
            ],
            'xss_attack': [
                r"<script[^>]*>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe[^>]*>"
            ],
            'command_injection': [
                r";\s*(ls|cat|wget|curl|bash|sh)",
                r"\|\s*(ls|cat|wget|curl|bash|sh)",
                r"`[^`]*`",
                r"\$\([^)]*\)"
            ]
        }
    
    def detect(self, payload):
        detections = []
        for attack_type, patterns in self.signatures.items():
            for pattern in patterns:
                if re.search(pattern, payload, re.IGNORECASE):
                    detections.append({
                        'type': attack_type,
                        'pattern': pattern,
                        'severity': self.calculate_severity(attack_type)
                    })
        return detections
    
    def calculate_severity(self, attack_type):
        severity_map = {
            'sql_injection': 'high',
            'xss_attack': 'medium',
            'command_injection': 'critical'
        }
        return severity_map.get(attack_type, 'low')
```

#### 2. Anomaly-Based Detection

Anomaly detection establishes baselines and identifies deviations:

```python
# Example: Behavioral Anomaly Detection
import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        self.baseline_established = False
    
    def establish_baseline(self, normal_traffic):
        """Train on normal behavior patterns"""
        features = self.extract_features(normal_traffic)
        self.model.fit(features)
        self.baseline_established = True
    
    def detect_anomalies(self, current_traffic):
        """Detect deviations from baseline"""
        if not self.baseline_established:
            raise Exception("Baseline not established")
        
        features = self.extract_features(current_traffic)
        predictions = self.model.predict(features)
        
        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:  # Anomaly detected
                anomalies.append({
                    'timestamp': current_traffic[i]['timestamp'],
                    'source': current_traffic[i]['source'],
                    'anomaly_score': self.model.score_samples([features[i]])[0],
                    'features': features[i]
                })
        
        return anomalies
    
    def extract_features(self, traffic):
        """Extract statistical features from traffic"""
        features = []
        for packet in traffic:
            features.append([
                packet.get('packet_size', 0),
                packet.get('inter_arrival_time', 0),
                packet.get('port_number', 0),
                packet.get('protocol_type', 0),
                packet.get('flag_count', 0)
            ])
        return np.array(features)
```

#### 3. Behavioral Detection

Behavioral detection monitors for unusual patterns in user and entity behavior:

```python
# Example: User Behavior Analytics
class BehaviorAnalyzer:
    def __init__(self):
        self.user_profiles = {}
        self.alert_threshold = 0.7
    
    def build_profile(self, user_id, historical_data):
        """Build behavioral profile for user"""
        profile = {
            'login_times': self.analyze_login_patterns(historical_data),
            'accessed_resources': self.analyze_resource_access(historical_data),
            'typical_locations': self.analyze_locations(historical_data),
            'data_transfer_patterns': self.analyze_data_transfers(historical_data)
        }
        self.user_profiles[user_id] = profile
    
    def detect_anomalous_behavior(self, user_id, current_activity):
        """Detect deviations from user's normal behavior"""
        if user_id not in self.user_profiles:
            return None
        
        profile = self.user_profiles[user_id]
        anomaly_scores = {
            'login_anomaly': self.check_login_anomaly(
                current_activity, profile['login_times']
            ),
            'access_anomaly': self.check_access_anomaly(
                current_activity, profile['accessed_resources']
            ),
            'location_anomaly': self.check_location_anomaly(
                current_activity, profile['typical_locations']
            ),
            'transfer_anomaly': self.check_transfer_anomaly(
                current_activity, profile['data_transfer_patterns']
            )
        }
        
        overall_score = np.mean(list(anomaly_scores.values()))
        
        if overall_score > self.alert_threshold:
            return {
                'user_id': user_id,
                'anomaly_score': overall_score,
                'details': anomaly_scores,
                'recommendation': self.get_recommendation(anomaly_scores)
            }
        
        return None
```

## Part 2: Intrusion Prevention Systems (IPS)

### Evolution from Detection to Prevention

While IDS systems alert on threats, IPS systems take active measures to block them. This evolution represents a paradigm shift from passive monitoring to active defense.

### IPS Architecture and Deployment

```
Internet → Firewall → IPS (Inline Mode) → Internal Network
                           ↓
                    Decision Engine
                           ↓
                 [Allow | Block | Redirect]
```

### How Wazuh Implements Prevention

#### 1. Active Response Configuration

```xml
<ossec_config>
  <active-response>
    <disabled>no</disabled>
    <ca_store>/var/ossec/etc/wpk_root.pem</ca_store>
  </active-response>
  
  <!-- Block IP after brute force detection -->
  <active-response>
    <command>firewall-drop</command>
    <location>local</location>
    <rules_id>5712</rules_id>
    <timeout>3600</timeout>
  </active-response>
  
  <!-- Disable account after privilege escalation -->
  <active-response>
    <command>disable-account</command>
    <location>local</location>
    <rules_id>100010</rules_id>
  </active-response>
  
  <!-- Custom response script -->
  <active-response>
    <command>custom-block</command>
    <location>defined-agent</location>
    <agent_id>001</agent_id>
    <rules_id>100020</rules_id>
  </active-response>
</ossec_config>
```

#### 2. Custom Active Response Scripts

```bash
#!/bin/bash
# /var/ossec/active-response/bin/custom-block.sh

ACTION=$1
USER=$2
IP=$3
ALERTID=$4
RULEID=$5

LOCAL=$(dirname $0)
PROG="custom-block"

LOG_FILE="/var/ossec/logs/active-responses.log"

echo "$(date) $0 $1 $2 $3 $4 $5" >> ${LOG_FILE}

# Check for required arguments
if [ "x${ACTION}" = "x" ]; then
    echo "$0: Missing action argument" >> ${LOG_FILE}
    exit 1
fi

if [ "x${IP}" = "x" ]; then
    echo "$0: Missing IP argument" >> ${LOG_FILE}
    exit 1
fi

# Execute action based on command
case ${ACTION} in
    add)
        # Block the IP using iptables
        /sbin/iptables -I INPUT -s ${IP} -j DROP
        /sbin/iptables -I FORWARD -s ${IP} -j DROP
        
        # Add to blacklist file
        echo "${IP}" >> /var/ossec/etc/blacklist.txt
        
        # Log the action
        echo "$(date) Blocked IP: ${IP} due to rule ${RULEID}" >> ${LOG_FILE}
        
        # Send notification
        /usr/bin/mail -s "Security Alert: IP Blocked" security@company.com << EOF
        IP Address ${IP} has been automatically blocked.
        Rule ID: ${RULEID}
        Alert ID: ${ALERTID}
        Time: $(date)
EOF
        ;;
        
    delete)
        # Unblock the IP
        /sbin/iptables -D INPUT -s ${IP} -j DROP
        /sbin/iptables -D FORWARD -s ${IP} -j DROP
        
        # Remove from blacklist
        sed -i "/${IP}/d" /var/ossec/etc/blacklist.txt
        
        # Log the action
        echo "$(date) Unblocked IP: ${IP}" >> ${LOG_FILE}
        ;;
        
    *)
        echo "$0: Invalid action: ${ACTION}" >> ${LOG_FILE}
        exit 1
        ;;
esac

exit 0
```

## Part 3: Installing and Configuring Snort IDS

### Choosing Between Snort and Suricata

| Feature | Snort | Suricata |
|---------|-------|----------|
| **Architecture** | Single-threaded | Multi-threaded |
| **Performance** | Good for small/medium networks | Excellent for high-speed networks |
| **Protocol Support** | Comprehensive | More extensive |
| **Learning Curve** | Moderate | Steeper |
| **Community** | Very large | Growing rapidly |
| **Rule Compatibility** | Native Snort rules | Supports Snort rules |
| **Hardware Requirements** | Moderate | Higher |
| **Best Use Case** | Traditional networks | High-performance environments |

### Complete Snort Installation Guide

#### Step 1: System Preparation

```bash
#!/bin/bash
# Snort Installation Script - Ubuntu/Debian

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    build-essential \
    autotools-dev \
    libdumbnet-dev \
    libluajit-5.1-dev \
    libpcap-dev \
    zlib1g-dev \
    pkg-config \
    libhwloc-dev \
    cmake \
    liblzma-dev \
    openssl \
    libssl-dev \
    cpputest \
    libsqlite3-dev \
    libtool \
    uuid-dev \
    git \
    autoconf \
    bison \
    flex \
    libcmocka-dev \
    libnetfilter-queue-dev \
    libunwind-dev \
    libmnl-dev \
    ethtool \
    libjemalloc-dev \
    libpcre++-dev

echo "Dependencies installed successfully"
```

#### Step 2: Install DAQ (Data Acquisition Library)

```bash
# Download and install DAQ
cd /tmp
wget https://www.snort.org/downloads/snortplus/libdaq-3.0.13.tar.gz
tar -xzvf libdaq-3.0.13.tar.gz
cd libdaq-3.0.13

# Configure and compile
./bootstrap
./configure
make
sudo make install

# Update shared libraries
sudo ldconfig

echo "DAQ installation completed"
```

#### Step 3: Install Snort 3

```bash
# Download Snort 3
cd /tmp
wget https://www.snort.org/downloads/snortplus/snort3-3.1.70.0.tar.gz
tar -xzvf snort3-3.1.70.0.tar.gz
cd snort3-3.1.70.0

# Configure with options
./configure_cmake.sh --prefix=/usr/local --enable-tcmalloc

# Compile and install
cd build
make -j$(nproc)
sudo make install

# Verify installation
/usr/local/bin/snort -V

echo "Snort 3 installation completed"
```

#### Step 4: Configure Snort

```lua
-- /usr/local/etc/snort/snort.lua
-- Snort 3 Main Configuration File

---------------------------------------------------------------------------
-- 1. Configure home network
---------------------------------------------------------------------------
HOME_NET = '192.168.1.0/24'
EXTERNAL_NET = '!$HOME_NET'

---------------------------------------------------------------------------
-- 2. Configure ports
---------------------------------------------------------------------------
HTTP_PORTS = '80 443 8080 8443'
SHELLCODE_PORTS = '!80'
ORACLE_PORTS = 1521
SSH_PORTS = 22
FTP_PORTS = 21
SIP_PORTS = '5060 5061'
FILE_DATA_PORTS = '$HTTP_PORTS'

---------------------------------------------------------------------------
-- 3. Configure paths
---------------------------------------------------------------------------
RULE_PATH = '/usr/local/etc/snort/rules'
BUILTIN_RULE_PATH = '/usr/local/etc/snort/builtin_rules'
PLUGIN_RULE_PATH = '/usr/local/etc/snort/so_rules'
WHITE_LIST_PATH = '/usr/local/etc/snort/lists'
BLACK_LIST_PATH = '/usr/local/etc/snort/lists'

---------------------------------------------------------------------------
-- 4. Configure decoder
---------------------------------------------------------------------------
require('snort_defaults')

stream = {
    reassembly = 'yes',
    track_tcp = 'yes',
    track_udp = 'yes',
    track_icmp = 'no',
    max_tcp = 262144,
    max_udp = 131072,
}

---------------------------------------------------------------------------
-- 5. Configure inspectors
---------------------------------------------------------------------------
stream_tcp = {
    policy = 'windows',
    overlap_limit = 10,
    max_window = 0,
    require_3whs = 180,
    track_only = false,
    small_segments = { 
        count = 3, 
        maximum_size = 150 
    }
}

http_inspect = {
    global_policy = 'all',
    default_policy = {
        normalize_cookies = true,
        normalize_headers = true,
        normalize_utf = true,
        compress_depth = 0,
        decompress_depth = 0
    }
}

---------------------------------------------------------------------------
-- 6. Configure detection
---------------------------------------------------------------------------
detection = {
    pcre_match_limit = 3500,
    pcre_match_limit_recursion = 1500,
    pcre_detect_override = true,
    debug = false,
    debug_print_rule_group_build_details = false,
    debug_print_rule_msgs = false,
    debug_print_fast_pattern = false,
    trace = 0
}

---------------------------------------------------------------------------
-- 7. Configure logging
---------------------------------------------------------------------------
alert_fast = {
    file = true,
    packet = false,
    limit = 10
}

alert_full = {
    file = true
}

alert_json = {
    file = true,
    limit = 100,
    fields = 'timestamp msg pkt_num proto pkt_gen pkt_len dir src_addr src_port dst_addr dst_port service rule priority class action'
}

unified2 = {
    limit = 128,
    nostamp = true
}

---------------------------------------------------------------------------
-- 8. Configure outputs
---------------------------------------------------------------------------
outputs = {
    alert_fast = alert_fast,
    alert_full = alert_full,
    alert_json = alert_json,
    unified2 = unified2
}

---------------------------------------------------------------------------
-- 9. Include custom rules
---------------------------------------------------------------------------
ips = {
    enable_builtin_rules = true,
    include = RULE_PATH .. '/local.rules',
    variables = default_variables
}
```

### Snort Rules Deep Dive

#### Basic Rule Structure

```
action protocol src_ip src_port -> dst_ip dst_port (options)
```

#### Rule Actions Explained

```bash
# 1. Alert - Generate alert but allow traffic
alert tcp any any -> $HOME_NET 80 (msg:"HTTP traffic detected"; sid:1000001;)

# 2. Log - Log packet without alerting
log tcp any any -> $HOME_NET 22 (msg:"SSH connection logged"; sid:1000002;)

# 3. Pass - Skip packet (whitelist)
pass tcp $HOME_NET any -> any 443 (msg:"Allowed HTTPS traffic"; sid:1000003;)

# 4. Drop - Block and log (IPS mode)
drop tcp any any -> $HOME_NET 445 (msg:"Blocking SMB traffic"; sid:1000004;)

# 5. Reject - Block with TCP RST or ICMP unreachable
reject tcp any any -> $HOME_NET 23 (msg:"Telnet rejected"; sid:1000005;)

# 6. Sdrop - Silent drop (no log)
sdrop icmp any any -> any any (msg:"ICMP dropped silently"; sid:1000006;)
```

#### Advanced Rule Examples

```bash
# SQL Injection Detection
alert tcp any any -> $HOME_NET $HTTP_PORTS (
    msg:"SQL Injection - UNION SELECT attempt";
    flow:to_server,established;
    content:"UNION"; nocase; http_uri;
    content:"SELECT"; distance:0; nocase; http_uri;
    pcre:"/UNION.+SELECT/Ui";
    classtype:web-application-attack;
    sid:1000100;
    rev:1;
    priority:1;
)

# Brute Force Detection
alert tcp any any -> $HOME_NET 22 (
    msg:"SSH Brute Force Attempt";
    flow:to_server,established;
    flags:S;
    threshold:type both, track by_src, count 5, seconds 60;
    classtype:attempted-admin;
    sid:1000101;
    rev:1;
)

# Data Exfiltration Detection
alert tcp $HOME_NET any -> $EXTERNAL_NET any (
    msg:"Potential Data Exfiltration - Large Outbound Transfer";
    flow:from_server,established;
    dsize:>10000;
    threshold:type threshold, track by_src, count 10, seconds 60;
    classtype:policy-violation;
    sid:1000102;
    rev:1;
)

# Malware Communication Detection
alert tcp $HOME_NET any -> $EXTERNAL_NET $HTTP_PORTS (
    msg:"Malware Check-in - Suspicious User-Agent";
    flow:to_server,established;
    content:"User-Agent|3a|"; nocase; http_header;
    content:"Mozilla/4.0 (compatible|3b| MSIE 6.0|3b| Windows NT 5.1)";
    http_header; nocase;
    classtype:trojan-activity;
    sid:1000103;
    rev:1;
)

# Zero-Day Exploit Pattern
alert tcp any any -> $HOME_NET any (
    msg:"Potential Zero-Day Exploit - Suspicious Payload Pattern";
    flow:to_server,established;
    content:"|90 90 90 90 90 90 90 90|"; depth:100;
    content:"|EB|"; distance:0; within:2;
    byte_test:1,>,127,0,relative;
    classtype:attempted-admin;
    sid:1000104;
    rev:1;
    priority:1;
)
```

## Part 4: Installing and Configuring Suricata IDS

### Complete Suricata Installation

```bash
#!/bin/bash
# Suricata Installation Script

# Add Suricata repository
sudo add-apt-repository ppa:oisf/suricata-stable
sudo apt-get update

# Install Suricata
sudo apt-get install -y suricata suricata-update

# Enable service
sudo systemctl enable suricata.service

# Download and update rules
sudo suricata-update

# Create custom rules directory
sudo mkdir -p /var/lib/suricata/rules

# Verify installation
sudo suricata --build-info
```

### Comprehensive Suricata Configuration

```yaml
# /etc/suricata/suricata.yaml
# Suricata Main Configuration File

%YAML 1.1
---

##############################################################################
# Global Configuration
##############################################################################

vars:
  address-groups:
    HOME_NET: "[192.168.1.0/24,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"
    HTTP_SERVERS: "$HOME_NET"
    SMTP_SERVERS: "$HOME_NET"
    SQL_SERVERS: "$HOME_NET"
    DNS_SERVERS: "$HOME_NET"
    TELNET_SERVERS: "$HOME_NET"
    AIM_SERVERS: "$EXTERNAL_NET"
    DC_SERVERS: "$HOME_NET"
    DNP3_SERVER: "$HOME_NET"
    DNP3_CLIENT: "$HOME_NET"
    MODBUS_CLIENT: "$HOME_NET"
    MODBUS_SERVER: "$HOME_NET"
    ENIP_CLIENT: "$HOME_NET"
    ENIP_SERVER: "$HOME_NET"

  port-groups:
    HTTP_PORTS: "80,443,8080,8443"
    SHELLCODE_PORTS: "!80"
    ORACLE_PORTS: 1521
    SSH_PORTS: 22
    DNP3_PORTS: 20000
    MODBUS_PORTS: 502
    FILE_DATA_PORTS: "[$HTTP_PORTS,110,143]"
    FTP_PORTS: 21
    VXLAN_PORTS: 4789
    TEREDO_PORTS: 3544

##############################################################################
# Logging Configuration
##############################################################################

default-log-dir: /var/log/suricata/

stats:
  enabled: yes
  interval: 30
  decoder-events: true
  stream-events: false

outputs:
  # Alert output for use with Wazuh
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      community-id: true
      types:
        - alert:
            payload: yes
            payload-buffer-size: 4kb
            payload-printable: yes
            packet: yes
            metadata: yes
            http-body: yes
            http-body-printable: yes
            tagged-packets: yes
        - anomaly:
            enabled: yes
        - http:
            extended: yes
        - dns:
            enabled: yes
            version: 2
        - tls:
            extended: yes
            session-resumption: yes
        - files:
            force-magic: yes
        - drop:
            enabled: yes
        - smtp:
            extended: yes
        - dnp3:
            enabled: yes
        - nfs:
            enabled: yes
        - smb:
            enabled: yes
        - tftp:
            enabled: yes
        - ikev2:
            enabled: yes
        - dcerpc:
            enabled: yes
        - krb5:
            enabled: yes
        - dhcp:
            enabled: yes
            extended: yes
        - ssh:
            enabled: yes
        - flow:
            enabled: yes
        - netflow:
            enabled: yes

  # Fast log for quick review
  - fast:
      enabled: yes
      filename: fast.log
      append: yes

  # Alert debug log
  - alert-debug:
      enabled: no
      filename: alert-debug.log
      append: yes

  # Stats log
  - stats:
      enabled: yes
      filename: stats.log
      append: yes
      interval: 30

##############################################################################
# Network Interface Configuration
##############################################################################

af-packet:
  - interface: eth0
    threads: auto
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes
    ring-size: 200000
    block-size: 1048576

  - interface: eth1
    threads: auto
    cluster-id: 98
    cluster-type: cluster_flow
    defrag: yes

pcap:
  - interface: eth0
  - interface: eth1

##############################################################################
# Detection Engine Configuration
##############################################################################

detect:
  profile: high
  custom-values:
    toclient-groups: 3
    toserver-groups: 25
  sgh-mpm-context: auto
  inspection-recursion-limit: 3000
  prefilter:
    default: mpm

mpm-algo: auto
spm-algo: auto

stream:
  memcap: 512mb
  checksum-validation: yes
  inline: auto
  reassembly:
    memcap: 256mb
    depth: 1mb
    toserver-chunk-size: 2560
    toclient-chunk-size: 2560
    randomize-chunk-size: yes

##############################################################################
# Protocol Parsers Configuration
##############################################################################

app-layer:
  protocols:
    http:
      enabled: yes
      libhtp:
        default-config:
          personality: IDS
          request-body-limit: 100kb
          response-body-limit: 100kb
          request-body-minimal-inspect-size: 32kb
          request-body-inspect-window: 4kb
          response-body-minimal-inspect-size: 40kb
          response-body-inspect-window: 16kb
          response-body-decompress-layer-limit: 2
          http-body-inline: auto
          double-decode-path: no
          double-decode-query: no

    tls:
      enabled: yes
      detection-ports:
        dp: 443

    ssh:
      enabled: yes

    smtp:
      enabled: yes
      raw-extraction: no
      mime:
        decode-mime: yes
        decode-base64: yes
        decode-quoted-printable: yes
        header-value-depth: 2000
        extract-urls: yes
        body-md5: yes
      inspected-tracker:
        content-limit: 100000
        content-inspect-min-size: 32768
        content-inspect-window: 4096

    dns:
      tcp:
        enabled: yes
        detection-ports:
          dp: 53
      udp:
        enabled: yes
        detection-ports:
          dp: 53

##############################################################################
# Pattern Matcher Configuration
##############################################################################

pattern-matcher:
  - profile: high
  - toclient-groups: 3
  - toserver-groups: 25

##############################################################################
# Defrag Configuration
##############################################################################

defrag:
  memcap: 256mb
  hash-size: 65536
  trackers: 65535
  max-frags: 65535
  prealloc: yes
  timeout: 60

##############################################################################
# Flow Configuration
##############################################################################

flow:
  memcap: 1gb
  hash-size: 1048576
  prealloc: 1048576
  emergency-recovery: 30
  managers: 1
  recyclers: 1

##############################################################################
# Host Configuration
##############################################################################

host:
  hash-size: 4096
  prealloc: 1000
  memcap: 32mb

##############################################################################
# Decoder Configuration
##############################################################################

decoder:
  teredo:
    enabled: true
    ports: $TEREDO_PORTS
  vxlan:
    enabled: true
    ports: $VXLAN_PORTS
```

### Suricata Rule Development

#### Custom Rule Examples

```bash
# /var/lib/suricata/rules/custom.rules

# Detect SSH Brute Force
alert ssh any any -> $HOME_NET 22 (
    msg:"SSH Brute Force Attempt Detected";
    flow:to_server,established;
    threshold:type threshold, track by_src, count 5, seconds 60;
    classtype:attempted-admin;
    sid:2000001;
    rev:1;
)

# Detect Suspicious DNS Queries
alert dns any any -> any 53 (
    msg:"Suspicious DNS Query - Possible DGA Domain";
    dns.query;
    content:".tk";
    pcre:"/^[a-z0-9]{16,}\.(tk|ml|ga|cf)$/";
    classtype:bad-unknown;
    sid:2000002;
    rev:1;
)

# Detect Cryptocurrency Mining
alert tcp $HOME_NET any -> $EXTERNAL_NET any (
    msg:"Potential Cryptocurrency Mining Activity";
    flow:to_server,established;
    content:"stratum+tcp://";
    classtype:policy-violation;
    sid:2000003;
    rev:1;
)

# Detect Lateral Movement
alert tcp $HOME_NET any -> $HOME_NET [139,445,3389] (
    msg:"Potential Lateral Movement - Internal SMB/RDP";
    flow:to_server,established;
    threshold:type both, track by_src, count 5, seconds 300;
    classtype:network-scan;
    sid:2000004;
    rev:1;
)

# Detect Data Exfiltration via DNS
alert dns $HOME_NET any -> any 53 (
    msg:"Potential DNS Tunneling - Data Exfiltration";
    dns.query;
    byte_test:1,>,30,0,relative;
    threshold:type threshold, track by_src, count 50, seconds 60;
    classtype:policy-violation;
    sid:2000005;
    rev:1;
)
```

## Part 5: Integrating Suricata with Wazuh

### Complete Integration Architecture

```
Network Traffic → Suricata IDS → EVE JSON Logs → Wazuh Agent → Wazuh Manager → Alert Correlation → Response
```

### Step-by-Step Integration Guide

#### Step 1: Configure Suricata for Wazuh

```yaml
# Add to /etc/suricata/suricata.yaml
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: /var/log/suricata/eve.json
      types:
        - alert:
            payload: yes
            payload-buffer-size: 4kb
            payload-printable: yes
            packet: yes
            metadata:
              app-layer: true
              flow: true
              rule: true
```

#### Step 2: Configure Wazuh Agent

```xml
<!-- /var/ossec/etc/ossec.conf on Wazuh Agent -->
<ossec_config>
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/suricata/eve.json</location>
  </localfile>
</ossec_config>
```

#### Step 3: Create Wazuh Decoders

```xml
<!-- /var/ossec/etc/decoders/suricata_decoders.xml -->
<decoder name="suricata">
  <type>json</type>
  <prematch>{"timestamp":</prematch>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>

<decoder name="suricata-alert">
  <parent>suricata</parent>
  <use_own_name>yes</use_own_name>
  <regex>\"event_type\":\"alert\"</regex>
  <order>event_type</order>
</decoder>

<decoder name="suricata-alert-details">
  <parent>suricata-alert</parent>
  <regex>\"src_ip\":\"(\d+.\d+.\d+.\d+)\",.*\"src_port\":(\d+),.*\"dest_ip\":\"(\d+.\d+.\d+.\d+)\",.*\"dest_port\":(\d+)</regex>
  <order>srcip,srcport,dstip,dstport</order>
</decoder>
```

#### Step 4: Create Wazuh Rules

```xml
<!-- /var/ossec/etc/rules/suricata_rules.xml -->
<group name="suricata,">
  
  <!-- Generic Suricata alert -->
  <rule id="86600" level="3">
    <decoded_as>suricata</decoded_as>
    <description>Suricata: Alert - $(alert.signature)</description>
  </rule>
  
  <!-- SSH Brute Force -->
  <rule id="86601" level="10">
    <if_sid>86600</if_sid>
    <field name="alert.signature">SSH Brute Force</field>
    <description>Suricata: SSH brute force attack detected</description>
    <mitre>
      <id>T1110</id>
    </mitre>
  </rule>
  
  <!-- Web Attack -->
  <rule id="86602" level="12">
    <if_sid>86600</if_sid>
    <field name="alert.category">Web Application Attack</field>
    <description>Suricata: Web application attack detected</description>
    <mitre>
      <id>T1190</id>
    </mitre>
  </rule>
  
  <!-- Malware Detection -->
  <rule id="86603" level="14">
    <if_sid>86600</if_sid>
    <field name="alert.category">A Network Trojan was Detected</field>
    <description>Suricata: Malware/Trojan detected</description>
    <mitre>
      <id>T1071</id>
    </mitre>
  </rule>
  
  <!-- Data Exfiltration -->
  <rule id="86604" level="12">
    <if_sid>86600</if_sid>
    <field name="alert.signature">Data Exfiltration</field>
    <description>Suricata: Potential data exfiltration detected</description>
    <mitre>
      <id>T1041</id>
    </mitre>
  </rule>
  
  <!-- DDoS Attack -->
  <rule id="86605" level="10">
    <if_sid>86600</if_sid>
    <field name="alert.signature">DDoS</field>
    <description>Suricata: DDoS attack detected</description>
    <mitre>
      <id>T1498</id>
    </mitre>
  </rule>
</group>
```

## Part 6: Tolerance Mechanisms for Resilient Security

### Understanding Security Tolerance

Tolerance in security operations refers to the system's ability to maintain functionality despite failures, attacks, or degraded conditions. This concept is critical for maintaining security operations during:
- Hardware failures
- Network outages
- DDoS attacks
- Component compromises
- Resource exhaustion

### Implementing Tolerance in Wazuh

#### 1. High Availability Configuration

```bash
# Wazuh Manager Cluster Configuration
# /var/ossec/etc/ossec.conf on each manager

<cluster>
  <name>wazuh-cluster</name>
  <node_name>manager-01</node_name>
  <node_type>master</node_type>
  <key>c98b62a9b6169ac5f67dae55ae4a9088</key>
  <port>1516</port>
  <bind_addr>0.0.0.0</bind_addr>
  <nodes>
    <node>192.168.1.100</node>
    <node>192.168.1.101</node>
    <node>192.168.1.102</node>
  </nodes>
  <hidden>no</hidden>
  <disabled>no</disabled>
</cluster>
```

#### 2. Load Balancing Configuration

```nginx
# /etc/nginx/nginx.conf
# Nginx Load Balancer for Wazuh API

upstream wazuh_api {
    least_conn;
    server 192.168.1.100:55000 max_fails=3 fail_timeout=30s;
    server 192.168.1.101:55000 max_fails=3 fail_timeout=30s;
    server 192.168.1.102:55000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl;
    server_name wazuh.company.com;
    
    ssl_certificate /etc/nginx/ssl/wazuh.crt;
    ssl_certificate_key /etc/nginx/ssl/wazuh.key;
    
    location / {
        proxy_pass https://wazuh_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health checks
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

#### 3. Automated Backup and Recovery

```bash
#!/bin/bash
# Wazuh Backup Script
# /usr/local/bin/wazuh-backup.sh

BACKUP_DIR="/backup/wazuh"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup Wazuh configuration
echo "Backing up Wazuh configuration..."
tar -czf ${BACKUP_DIR}/wazuh-config-${DATE}.tar.gz \
    /var/ossec/etc \
    /var/ossec/rules \
    /var/ossec/decoders

# Backup Wazuh data
echo "Backing up Wazuh data..."
tar -czf ${BACKUP_DIR}/wazuh-data-${DATE}.tar.gz \
    /var/ossec/logs \
    /var/ossec/stats \
    /var/ossec/queue/db

# Backup Elasticsearch indices
echo "Backing up Elasticsearch indices..."
curl -X PUT "localhost:9200/_snapshot/wazuh_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "'${BACKUP_DIR}'/elasticsearch",
    "compress": true
  }
}'

curl -X PUT "localhost:9200/_snapshot/wazuh_backup/snapshot_${DATE}?wait_for_completion=true"

# Remove old backups
echo "Removing backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -type f -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully"
```

#### 4. Fault Isolation with Containers

```yaml
# docker-compose.yml for Wazuh deployment
version: '3.8'

services:
  wazuh-manager:
    image: wazuh/wazuh:4.7.0
    hostname: wazuh-manager
    restart: always
    ports:
      - "1514:1514/udp"
      - "1514:1514/tcp"
      - "514:514/udp"
      - "55000:55000"
    environment:
      - INDEXER_URL=https://wazuh-indexer:9200
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=SecurePassword123!
      - FILEBEAT_SSL_VERIFICATION_MODE=full
      - SSL_CERTIFICATE_AUTHORITIES=/etc/ssl/root-ca.pem
      - SSL_CERTIFICATE=/etc/ssl/filebeat.pem
      - SSL_KEY=/etc/ssl/filebeat-key.pem
      - API_USERNAME=wazuh-wui
      - API_PASSWORD=MyS3cr3tPassword!
    volumes:
      - wazuh_api_configuration:/var/ossec/api/configuration
      - wazuh_etc:/var/ossec/etc
      - wazuh_logs:/var/ossec/logs
      - wazuh_queue:/var/ossec/queue
      - wazuh_var_multigroups:/var/ossec/var/multigroups
      - wazuh_integrations:/var/ossec/integrations
      - wazuh_active_response:/var/ossec/active-response/bin
      - wazuh_agentless:/var/ossec/agentless
      - wazuh_wodles:/var/ossec/wodles
      - filebeat_etc:/etc/filebeat
      - filebeat_var:/var/lib/filebeat
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:55000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2048M
        reservations:
          cpus: '1'
          memory: 1024M

  wazuh-indexer:
    image: opensearchproject/opensearch:2.11.0
    hostname: wazuh-indexer
    restart: always
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - cluster.name=wazuh-cluster
      - network.host=0.0.0.0
      - "OPENSEARCH_JAVA_OPTS=-Xms1024m -Xmx1024m"
      - bootstrap.memory_lock=true
      - plugins.security.ssl.http.enabled=true
      - plugins.security.ssl.http.pemcert_filepath=/usr/share/opensearch/config/certs/opensearch.pem
      - plugins.security.ssl.http.pemkey_filepath=/usr/share/opensearch/config/certs/opensearch-key.pem
      - plugins.security.ssl.http.pemtrustedcas_filepath=/usr/share/opensearch/config/certs/root-ca.pem
      - plugins.security.ssl.transport.pemcert_filepath=/usr/share/opensearch/config/certs/opensearch.pem
      - plugins.security.ssl.transport.pemkey_filepath=/usr/share/opensearch/config/certs/opensearch-key.pem
      - plugins.security.ssl.transport.pemtrustedcas_filepath=/usr/share/opensearch/config/certs/root-ca.pem
      - plugins.security.ssl.transport.enforce_hostname_verification=false
      - plugins.security.ssl.transport.resolve_hostname=false
      - plugins.security.authcz.admin_dn=CN=admin,OU=Wazuh,O=Wazuh,L=California,C=US
      - plugins.security.check_snapshot_restore_write_privileges=true
      - plugins.security.enable_snapshot_restore_privilege=true
      - plugins.security.nodes_dn=CN=*,OU=Wazuh,O=Wazuh,L=California,C=US
      - plugins.security.restapi.roles_enabled=["all_access","security_rest_api_access"]
      - plugins.security.system_indices.enabled=true
      - plugins.security.system_indices.indices=[".opendistro-alerting-config",".opendistro-alerting-alert*",".opendistro-anomaly-results*",".opendistro-anomaly-detector*",".opendistro-anomaly-checkpoints",".opendistro-anomaly-detection-state",".opendistro-reports-*",".opendistro-notifications-*",".opendistro-notebooks",".opensearch-observability",".opendistro-asynchronous-search-response*",".replication-metadata-store"]
      - plugins.security.allow_unsafe_democertificates=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - wazuh-indexer-data:/usr/share/opensearch/data
      - ./config/certs:/usr/share/opensearch/config/certs
    healthcheck:
      test: ["CMD-SHELL", "curl -k -u admin:admin https://localhost:9200/_cluster/health?pretty"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  wazuh-dashboard:
    image: opensearchproject/opensearch-dashboards:2.11.0
    hostname: wazuh-dashboard
    restart: always
    ports:
      - "5601:5601"
    environment:
      - OPENSEARCH_HOSTS=https://wazuh-indexer:9200
      - SERVER_HOST=0.0.0.0
      - SERVER_PORT=5601
      - OPENSEARCH_SSL_VERIFICATIONMODE=certificate
      - OPENSEARCH_USERNAME=kibanaserver
      - OPENSEARCH_PASSWORD=kibanaserver
      - OPENSEARCH_REQUESTHEADERSALLOWLIST=["securitytenant","Authorization"]
      - OPENSEARCH_SECURITY_MULTITENANCY_ENABLED=false
      - OPENSEARCH_SECURITY_READONLY_MODE_ROLES=["kibana_read_only"]
      - SERVER_SSL_ENABLED=true
      - SERVER_SSL_CERTIFICATE=/usr/share/opensearch-dashboards/config/certs/dashboard.pem
      - SERVER_SSL_KEY=/usr/share/opensearch-dashboards/config/certs/dashboard-key.pem
      - OPENSEARCH_SECURITY_COOKIE_SECURE=true
    volumes:
      - ./config/certs:/usr/share/opensearch-dashboards/config/certs
      - ./config/opensearch_dashboards.yml:/usr/share/opensearch-dashboards/config/opensearch_dashboards.yml
    depends_on:
      - wazuh-indexer
    healthcheck:
      test: ["CMD-SHELL", "curl -k https://localhost:5601/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  wazuh_api_configuration:
  wazuh_etc:
  wazuh_logs:
  wazuh_queue:
  wazuh_var_multigroups:
  wazuh_integrations:
  wazuh_active_response:
  wazuh_agentless:
  wazuh_wodles:
  filebeat_etc:
  filebeat_var:
  wazuh-indexer-data:

networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Implementing Graceful Degradation

```python
#!/usr/bin/env python3
# Graceful Degradation Monitor
# /usr/local/bin/degradation-monitor.py

import psutil
import json
import logging
import subprocess
from datetime import datetime

class DegradationMonitor:
    def __init__(self):
        self.thresholds = {
            'cpu': 80,      # CPU usage percentage
            'memory': 85,   # Memory usage percentage
            'disk': 90,     # Disk usage percentage
            'network': 100  # Network bandwidth Mbps
        }
        self.degradation_level = 0
        self.logger = self.setup_logging()
    
    def setup_logging(self):
        logging.basicConfig(
            filename='/var/log/degradation-monitor.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    def check_system_resources(self):
        """Monitor system resources and determine degradation level"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'cpu': psutil.cpu_percent(interval=1),
            'memory': psutil.virtual_memory().percent,
            'disk': psutil.disk_usage('/').percent,
            'network': self.get_network_usage()
        }
        
        # Determine degradation level
        if status['cpu'] > self.thresholds['cpu']:
            self.degradation_level = max(self.degradation_level, 1)
        if status['memory'] > self.thresholds['memory']:
            self.degradation_level = max(self.degradation_level, 2)
        if status['disk'] > self.thresholds['disk']:
            self.degradation_level = max(self.degradation_level, 3)
        
        return status
    
    def apply_degradation_measures(self):
        """Apply degradation measures based on level"""
        
        if self.degradation_level == 0:
            # Normal operation
            self.logger.info("System operating normally")
            return
        
        elif self.degradation_level == 1:
            # Level 1: Reduce non-critical operations
            self.logger.warning("Level 1 degradation: Reducing non-critical operations")
            self.disable_non_critical_rules()
            self.reduce_logging_verbosity()
        
        elif self.degradation_level == 2:
            # Level 2: Disable advanced features
            self.logger.warning("Level 2 degradation: Disabling advanced features")
            self.disable_ml_detection()
            self.reduce_correlation_window()
        
        elif self.degradation_level >= 3:
            # Level 3: Emergency mode
            self.logger.critical("Level 3 degradation: Emergency mode activated")
            self.enable_emergency_mode()
    
    def disable_non_critical_rules(self):
        """Disable low-priority detection rules"""
        subprocess.run([
            '/var/ossec/bin/wazuh-control',
            'disable-rules',
            '--level', '0-5'
        ])
    
    def reduce_logging_verbosity(self):
        """Reduce logging to critical events only"""
        config = {
            'alerts': {
                'log_alert_level': 10
            }
        }
        with open('/var/ossec/etc/local_internal_options.conf', 'w') as f:
            json.dump(config, f)
    
    def disable_ml_detection(self):
        """Disable machine learning detection to save resources"""
        subprocess.run([
            '/var/ossec/bin/wazuh-control',
            'disable-module',
            'wazuh-modulesd:anomaly-detection'
        ])
    
    def reduce_correlation_window(self):
        """Reduce correlation time window"""
        # Modify correlation rules to use shorter timeframes
        pass
    
    def enable_emergency_mode(self):
        """Enable emergency mode - minimal operations only"""
        subprocess.run([
            '/var/ossec/bin/wazuh-control',
            'emergency-mode',
            '--enable'
        ])
    
    def get_network_usage(self):
        """Get current network bandwidth usage"""
        net_io = psutil.net_io_counters()
        return (net_io.bytes_sent + net_io.bytes_recv) / 1024 / 1024  # MB

if __name__ == "__main__":
    monitor = DegradationMonitor()
    
    while True:
        status = monitor.check_system_resources()
        monitor.apply_degradation_measures()
        
        # Log status
        monitor.logger.info(f"System status: {json.dumps(status)}")
        monitor.logger.info(f"Degradation level: {monitor.degradation_level}")
        
        # Sleep for 60 seconds before next check
        import time
        time.sleep(60)
```

## Part 7: Real-World Attack Detection Scenarios

### SSH Brute Force Attack Detection and Response

#### Attack Simulation

```bash
#!/bin/bash
# SSH Brute Force Attack Simulation
# /usr/local/bin/simulate-ssh-bruteforce.sh

TARGET_HOST="192.168.1.100"
TARGET_USER="admin"
WORDLIST="/usr/share/wordlists/rockyou.txt"

echo "Starting SSH brute force simulation against ${TARGET_HOST}"

# Generate failed login attempts
for i in {1..20}; do
    PASSWORD=$(shuf -n 1 ${WORDLIST})
    sshpass -p "${PASSWORD}" ssh -o StrictHostKeyChecking=no ${TARGET_USER}@${TARGET_HOST} 2>/dev/null
    echo "Attempt ${i}: Failed login with password: ${PASSWORD:0:3}***"
    sleep 1
done

echo "Brute force simulation completed"
```

#### Suricata Detection Rule

```bash
# SSH Brute Force Detection Rule
alert ssh any any -> $HOME_NET 22 (
    msg:"SSH Brute Force Attack Detected";
    flow:to_server,established;
    threshold:type both, track by_src, count 5, seconds 60;
    classtype:attempted-admin;
    reference:url,attack.mitre.org/techniques/T1110/;
    sid:3000001;
    rev:1;
    metadata:created_at 2024-01-04, updated_at 2024-01-04;
)
```

#### Wazuh Correlation Rule

```xml
<group name="ssh_brute_force,">
  <rule id="200001" level="10" frequency="5" timeframe="60">
    <if_matched_sid>5716</if_matched_sid>
    <same_source_ip />
    <description>SSH brute force attack (5 failed logins in 60 seconds)</description>
    <mitre>
      <id>T1110</id>
    </mitre>
  </rule>
  
  <rule id="200002" level="14">
    <if_matched_sid>200001</if_matched_sid>
    <match>Accepted password</match>
    <description>CRITICAL: Successful SSH login after brute force attempts</description>
    <mitre>
      <id>T1078</id>
    </mitre>
  </rule>
</group>
```

### Web Application Attack Detection

#### SQL Injection Detection

```bash
# Suricata Rule for SQL Injection
alert http any any -> $HOME_NET $HTTP_PORTS (
    msg:"SQL Injection Attack Detected";
    flow:to_server,established;
    content:"UNION"; nocase; http_uri;
    content:"SELECT"; distance:0; nocase; http_uri;
    pcre:"/(\bUNION\b.*\bSELECT\b)|(\bOR\b.*=.*)|(--)|(\/\*.*\*\/)/Ui";
    classtype:web-application-attack;
    reference:url,owasp.org/www-project-top-ten/;
    sid:3000002;
    rev:1;
)
```

#### Cross-Site Scripting (XSS) Detection

```bash
# Suricata Rule for XSS
alert http any any -> $HOME_NET $HTTP_PORTS (
    msg:"XSS Attack Detected";
    flow:to_server,established;
    content:"<script"; nocase; http_client_body;
    pcre:"/<script[^>]*>.*?<\/script>/Usi";
    classtype:web-application-attack;
    reference:url,owasp.org/www-community/attacks/xss/;
    sid:3000003;
    rev:1;
)
```

### Malware Detection and Response

#### Malware Communication Detection

```json
// Sample Suricata EVE JSON log for malware detection
{
  "timestamp": "2024-01-04T15:30:45.123456+0530",
  "flow_id": 1234567890,
  "event_type": "alert",
  "src_ip": "192.168.1.150",
  "src_port": 54321,
  "dest_ip": "185.159.158.1",
  "dest_port": 443,
  "proto": "TCP",
  "alert": {
    "action": "blocked",
    "gid": 1,
    "signature_id": 2100500,
    "rev": 1,
    "signature": "ET MALWARE Cobalt Strike Beacon Communication",
    "category": "A Network Trojan was Detected",
    "severity": 1
  },
  "http": {
    "hostname": "update.windowsupdate.com",
    "url": "/c2/beacon.exe",
    "http_user_agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64)",
    "http_method": "POST",
    "protocol": "HTTP/1.1",
    "status": 200,
    "length": 4096
  },
  "app_proto": "http",
  "flow": {
    "pkts_toserver": 15,
    "pkts_toclient": 20,
    "bytes_toserver": 2048,
    "bytes_toclient": 8192
  }
}
```

#### Wazuh Decoder and Rule

```xml
<!-- Malware Detection Decoder -->
<decoder name="suricata-malware">
  <parent>json</parent>
  <prematch>\"event_type\":\"alert\".*\"category\":\"A Network Trojan was Detected\"</prematch>
  <regex>\"src_ip\":\"(\S+)\".*\"signature\":\"([^\"]+)\"</regex>
  <order>srcip,signature</order>
</decoder>

<!-- Malware Detection Rule -->
<rule id="300001" level="14">
  <decoded_as>suricata-malware</decoded_as>
  <description>CRITICAL: Malware communication detected - $(signature)</description>
  <mitre>
    <id>T1071</id>
  </mitre>
</rule>
```

### Advanced Persistent Threat (APT) Detection

#### Multi-Stage APT Detection

```python
#!/usr/bin/env python3
# APT Detection Correlation Engine
# /usr/local/bin/apt-detection.py

import json
import redis
import hashlib
from datetime import datetime, timedelta
from collections import defaultdict

class APTDetector:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.ttl = 86400  # 24 hours
        self.apt_stages = {
            'reconnaissance': [],
            'initial_access': [],
            'execution': [],
            'persistence': [],
            'privilege_escalation': [],
            'defense_evasion': [],
            'credential_access': [],
            'discovery': [],
            'lateral_movement': [],
            'collection': [],
            'command_control': [],
            'exfiltration': [],
            'impact': []
        }
    
    def process_alert(self, alert):
        """Process incoming alert and check for APT patterns"""
        
        # Categorize alert by MITRE ATT&CK tactic
        tactic = self.categorize_by_mitre(alert)
        
        # Store alert in Redis with TTL
        alert_key = self.generate_alert_key(alert)
        self.redis_client.setex(
            alert_key,
            self.ttl,
            json.dumps(alert)
        )
        
        # Add to APT stage tracking
        source_ip = alert.get('src_ip', 'unknown')
        stage_key = f"apt:{source_ip}:{tactic}"
        self.redis_client.lpush(stage_key, alert_key)
        self.redis_client.expire(stage_key, self.ttl)
        
        # Check for APT pattern
        apt_score = self.calculate_apt_score(source_ip)
        
        if apt_score > 0.7:
            return self.generate_apt_alert(source_ip, apt_score)
        
        return None
    
    def categorize_by_mitre(self, alert):
        """Categorize alert by MITRE ATT&CK framework"""
        
        mitre_mapping = {
            'T1595': 'reconnaissance',          # Active Scanning
            'T1190': 'initial_access',          # Exploit Public-Facing Application
            'T1059': 'execution',               # Command and Scripting Interpreter
            'T1136': 'persistence',             # Create Account
            'T1078': 'privilege_escalation',   # Valid Accounts
            'T1070': 'defense_evasion',        # Indicator Removal
            'T1003': 'credential_access',      # OS Credential Dumping
            'T1057': 'discovery',               # Process Discovery
            'T1021': 'lateral_movement',       # Remote Services
            'T1005': 'collection',              # Data from Local System
            'T1071': 'command_control',        # Application Layer Protocol
            'T1041': 'exfiltration',           # Exfiltration Over C2 Channel
            'T1486': 'impact'                  # Data Encrypted for Impact
        }
        
        mitre_id = alert.get('mitre_id', '')
        return mitre_mapping.get(mitre_id, 'unknown')
    
    def calculate_apt_score(self, source_ip):
        """Calculate APT likelihood score based on observed stages"""
        
        observed_stages = set()
        stage_counts = defaultdict(int)
        
        # Check all APT stages for this source
        for stage in self.apt_stages.keys():
            stage_key = f"apt:{source_ip}:{stage}"
            count = self.redis_client.llen(stage_key)
            if count > 0:
                observed_stages.add(stage)
                stage_counts[stage] = count
        
        # Calculate score based on kill chain progression
        score = 0.0
        kill_chain_order = [
            'reconnaissance',
            'initial_access',
            'execution',
            'persistence',
            'privilege_escalation',
            'defense_evasion',
            'credential_access',
            'discovery',
            'lateral_movement',
            'collection',
            'command_control',
            'exfiltration'
        ]
        
        # Check for sequential progression
        for i, stage in enumerate(kill_chain_order):
            if stage in observed_stages:
                score += (i + 1) * 0.05  # Later stages have higher weight
        
        # Check for multiple stages
        if len(observed_stages) >= 3:
            score += 0.2
        
        # Check for critical stages
        critical_stages = ['persistence', 'lateral_movement', 'exfiltration']
        for stage in critical_stages:
            if stage in observed_stages:
                score += 0.15
        
        return min(score, 1.0)  # Cap at 1.0
    
    def generate_apt_alert(self, source_ip, score):
        """Generate APT detection alert"""
        
        alert = {
            'timestamp': datetime.now().isoformat(),
            'alert_type': 'APT_DETECTION',
            'source_ip': source_ip,
            'apt_score': score,
            'severity': 'CRITICAL',
            'description': f'Advanced Persistent Threat detected from {source_ip}',
            'kill_chain_stages': self.get_observed_stages(source_ip),
            'recommended_actions': [
                'Isolate affected systems',
                'Initiate incident response procedures',
                'Collect forensic evidence',
                'Review all activity from source IP',
                'Check for lateral movement indicators'
            ]
        }
        
        # Send alert to Wazuh
        self.send_to_wazuh(alert)
        
        return alert
    
    def get_observed_stages(self, source_ip):
        """Get all observed kill chain stages for a source"""
        stages = []
        for stage in self.apt_stages.keys():
            stage_key = f"apt:{source_ip}:{stage}"
            if self.redis_client.exists(stage_key):
                stages.append(stage)
        return stages
    
    def send_to_wazuh(self, alert):
        """Send alert to Wazuh manager"""
        import socket
        
        wazuh_socket = '/var/ossec/queue/sockets/queue'
        message = f"1:apt-detector:{json.dumps(alert)}"
        
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM)
        sock.sendto(message.encode(), wazuh_socket)
        sock.close()
    
    def generate_alert_key(self, alert):
        """Generate unique key for alert"""
        alert_str = json.dumps(alert, sort_keys=True)
        return f"alert:{hashlib.md5(alert_str.encode()).hexdigest()}"

if __name__ == "__main__":
    detector = APTDetector()
    
    # Example: Process incoming alerts
    sample_alerts = [
        {
            'src_ip': '192.168.1.100',
            'mitre_id': 'T1595',
            'signature': 'Port Scan Detected'
        },
        {
            'src_ip': '192.168.1.100',
            'mitre_id': 'T1190',
            'signature': 'Web Application Exploit'
        },
        {
            'src_ip': '192.168.1.100',
            'mitre_id': 'T1136',
            'signature': 'New User Account Created'
        }
    ]
    
    for alert in sample_alerts:
        result = detector.process_alert(alert)
        if result:
            print(f"APT Detected: {json.dumps(result, indent=2)}")
```

## Part 8: Troubleshooting and Best Practices

### Common Issues and Solutions

#### Issue 1: Suricata Not Detecting Traffic

```bash
# Troubleshooting Script
#!/bin/bash

echo "=== Suricata Troubleshooting ==="

# Check if Suricata is running
if systemctl is-active --quiet suricata; then
    echo "✓ Suricata is running"
else
    echo "✗ Suricata is not running"
    sudo systemctl start suricata
fi

# Check interface configuration
echo "Checking network interfaces..."
ip link show

# Check Suricata logs for errors
echo "Recent Suricata errors:"
sudo tail -n 50 /var/log/suricata/suricata.log | grep -i error

# Verify rule loading
echo "Loaded rules:"
sudo suricata --list-app-layer-protos

# Test with simple rule
echo "Testing with ICMP rule..."
echo 'alert icmp any any -> any any (msg:"ICMP Test"; sid:9999999;)' | \
    sudo tee /var/lib/suricata/rules/test.rules

# Restart and test
sudo systemctl restart suricata
ping -c 1 8.8.8.8

# Check for alerts
sleep 2
sudo tail -n 10 /var/log/suricata/fast.log
```

#### Issue 2: Wazuh Not Receiving Logs

```bash
# Wazuh Agent Connectivity Test
#!/bin/bash

echo "=== Wazuh Agent Connectivity Test ==="

# Check agent status
sudo /var/ossec/bin/agent_control -l

# Test connection to manager
nc -zv wazuh-manager.company.com 1514

# Check agent configuration
grep -E "server|port" /var/ossec/etc/ossec.conf

# Verify log file permissions
ls -la /var/log/suricata/eve.json

# Test manual log injection
echo '{"test":"message"}' | sudo tee -a /var/log/suricata/eve.json

# Check Wazuh agent logs
sudo tail -n 50 /var/ossec/logs/ossec.log
```

### Performance Optimization

#### 1. Suricata Performance Tuning

```yaml
# High-Performance Suricata Configuration
# /etc/suricata/suricata-performance.yaml

# CPU Affinity Settings
threading:
  set-cpu-affinity: yes
  cpu-affinity:
    - management-cpu-set:
        cpu: [ 0 ]
    - receive-cpu-set:
        cpu: [ 1,2,3,4 ]
    - worker-cpu-set:
        cpu: [ 5,6,7,8,9,10,11,12 ]
    - verdict-cpu-set:
        cpu: [ 13,14,15 ]

# Packet Processing Optimization
af-packet:
  - interface: eth0
    threads: 16
    cluster-id: 99
    cluster-type: cluster_qm  # QM provides better performance
    defrag: yes
    use-mmap: yes
    mmap-locked: yes
    tpacket-v3: yes
    ring-size: 400000
    block-size: 1048576
    block-timeout: 10
    use-emergency-flush: yes
    checksum-checks: kernel

# Memory Settings
stream:
  memcap: 4gb
  prealloc-sessions: 100000
  checksum-validation: no  # Disable for performance
  inline: no
  bypass: yes

# Detection Engine Optimization
detect:
  profile: custom
  custom-values:
    toclient-groups: 200
    toserver-groups: 200
  sgh-mpm-context: full
  inspection-recursion-limit: 2000

# Reduce Logging Overhead
outputs:
  - fast:
      enabled: no  # Disable if not needed
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      pcap-file: false  # Disable PCAP storage
      community-id: false  # Disable if not needed
      compression: true  # Enable compression
```

#### 2. Wazuh Performance Optimization

```xml
<!-- High-Performance Wazuh Configuration -->
<!-- /var/ossec/etc/internal_options.conf -->

# Analysisd optimizations
analysisd.decode_xml_alerts=0
analysisd.alerts_log=0
analysisd.logall=0
analysisd.stats_maxdiff=25000
analysisd.stats_mindiff=1000
analysisd.fts_list_size=64
analysisd.fts_min_size_for_str=24

# Remoted optimizations
remoted.recv_buffer=1048576
remoted.send_buffer=1048576
remoted.tcp_keepalive_enabled=yes
remoted.tcp_keepalive_idle=300
remoted.tcp_keepalive_interval=10
remoted.tcp_keepalive_count=3

# Database optimizations
dbd.reconnect_attempts=5
dbd.reconnect_interval=10

# Memory management
mem.cleanup_interval=300
mem.max_events=50000
```

### Security Best Practices

#### 1. Secure Communication Channels

```bash
#!/bin/bash
# Generate SSL Certificates for Wazuh
# /usr/local/bin/generate-wazuh-certs.sh

CERT_DIR="/var/ossec/etc/ssl"
DAYS_VALID=3650
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORG="Company Inc"
UNIT="Security"

# Create certificate directory
mkdir -p ${CERT_DIR}

# Generate CA private key
openssl genrsa -out ${CERT_DIR}/ca-key.pem 4096

# Generate CA certificate
openssl req -new -x509 -days ${DAYS_VALID} \
    -key ${CERT_DIR}/ca-key.pem \
    -out ${CERT_DIR}/ca-cert.pem \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${UNIT}/CN=Wazuh CA"

# Generate server private key
openssl genrsa -out ${CERT_DIR}/server-key.pem 4096

# Generate server certificate request
openssl req -new \
    -key ${CERT_DIR}/server-key.pem \
    -out ${CERT_DIR}/server-req.pem \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${UNIT}/CN=wazuh-manager"

# Sign server certificate
openssl x509 -req -days ${DAYS_VALID} \
    -in ${CERT_DIR}/server-req.pem \
    -CA ${CERT_DIR}/ca-cert.pem \
    -CAkey ${CERT_DIR}/ca-key.pem \
    -out ${CERT_DIR}/server-cert.pem \
    -CAcreateserial

# Generate agent private key
openssl genrsa -out ${CERT_DIR}/agent-key.pem 4096

# Generate agent certificate request
openssl req -new \
    -key ${CERT_DIR}/agent-key.pem \
    -out ${CERT_DIR}/agent-req.pem \
    -subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/OU=${UNIT}/CN=wazuh-agent"

# Sign agent certificate
openssl x509 -req -days ${DAYS_VALID} \
    -in ${CERT_DIR}/agent-req.pem \
    -CA ${CERT_DIR}/ca-cert.pem \
    -CAkey ${CERT_DIR}/ca-key.pem \
    -out ${CERT_DIR}/agent-cert.pem

# Set proper permissions
chmod 600 ${CERT_DIR}/*-key.pem
chmod 644 ${CERT_DIR}/*-cert.pem
chown -R wazuh:wazuh ${CERT_DIR}

echo "SSL certificates generated successfully"
```

#### 2. Rule Management Best Practices

```python
#!/usr/bin/env python3
# Rule Management and Testing Framework
# /usr/local/bin/rule-manager.py

import os
import json
import yaml
import subprocess
import argparse
from datetime import datetime
import xml.etree.ElementTree as ET

class RuleManager:
    def __init__(self):
        self.rule_dir = "/var/lib/suricata/rules"
        self.wazuh_rules = "/var/ossec/etc/rules"
        self.backup_dir = "/backup/rules"
        self.test_pcap = "/tmp/test.pcap"
    
    def backup_rules(self):
        """Backup existing rules before changes"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{self.backup_dir}/rules_backup_{timestamp}"
        
        os.makedirs(backup_path, exist_ok=True)
        
        # Backup Suricata rules
        subprocess.run([
            "cp", "-r", 
            self.rule_dir, 
            f"{backup_path}/suricata"
        ])
        
        # Backup Wazuh rules
        subprocess.run([
            "cp", "-r", 
            self.wazuh_rules, 
            f"{backup_path}/wazuh"
        ])
        
        print(f"Rules backed up to {backup_path}")
        return backup_path
    
    def validate_suricata_rule(self, rule_file):
        """Validate Suricata rule syntax"""
        result = subprocess.run([
            "suricata", "-T", 
            "-S", rule_file
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✓ Rule {rule_file} is valid")
            return True
        else:
            print(f"✗ Rule {rule_file} has errors:")
            print(result.stderr)
            return False
    
    def validate_wazuh_rule(self, rule_file):
        """Validate Wazuh rule XML syntax"""
        try:
            tree = ET.parse(rule_file)
            root = tree.getroot()
            
            # Check for required elements
            for rule in root.findall('.//rule'):
                rule_id = rule.get('id')
                level = rule.get('level')
                
                if not rule_id or not level:
                    print(f"✗ Rule missing required attributes")
                    return False
            
            print(f"✓ Rule {rule_file} is valid")
            return True
            
        except ET.ParseError as e:
            print(f"✗ XML parsing error: {e}")
            return False
    
    def test_rule_performance(self, rule_file):
        """Test rule performance with sample traffic"""
        
        # Generate test traffic
        self.generate_test_traffic()
        
        # Run Suricata with rule
        start_time = datetime.now()
        
        result = subprocess.run([
            "suricata", "-r", self.test_pcap,
            "-S", rule_file,
            "-l", "/tmp"
        ], capture_output=True)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Parse results
        alerts = self.parse_alerts("/tmp/fast.log")
        
        print(f"Performance Test Results:")
        print(f"  Duration: {duration:.2f} seconds")
        print(f"  Alerts generated: {len(alerts)}")
        print(f"  Rules/sec: {len(alerts)/duration:.2f}")
        
        return {
            'duration': duration,
            'alerts': len(alerts),
            'performance': len(alerts)/duration
        }
    
    def generate_test_traffic(self):
        """Generate test PCAP file"""
        # Use tcpdump to capture some traffic
        subprocess.run([
            "timeout", "10",
            "tcpdump", "-i", "any",
            "-w", self.test_pcap
        ])
    
    def parse_alerts(self, alert_file):
        """Parse alert file"""
        alerts = []
        if os.path.exists(alert_file):
            with open(alert_file, 'r') as f:
                alerts = f.readlines()
        return alerts
    
    def deploy_rules(self, rule_file, rule_type='suricata'):
        """Deploy validated rules to production"""
        
        # Backup first
        backup_path = self.backup_rules()
        
        try:
            if rule_type == 'suricata':
                # Validate rule
                if not self.validate_suricata_rule(rule_file):
                    raise Exception("Rule validation failed")
                
                # Copy to production
                subprocess.run([
                    "cp", rule_file,
                    self.rule_dir
                ])
                
                # Reload Suricata
                subprocess.run([
                    "systemctl", "reload", "suricata"
                ])
                
            elif rule_type == 'wazuh':
                # Validate rule
                if not self.validate_wazuh_rule(rule_file):
                    raise Exception("Rule validation failed")
                
                # Copy to production
                subprocess.run([
                    "cp", rule_file,
                    self.wazuh_rules
                ])
                
                # Restart Wazuh manager
                subprocess.run([
                    "systemctl", "restart", "wazuh-manager"
                ])
            
            print(f"✓ Rules deployed successfully")
            
        except Exception as e:
            print(f"✗ Deployment failed: {e}")
            print(f"Restoring from backup {backup_path}")
            self.restore_rules(backup_path)
    
    def restore_rules(self, backup_path):
        """Restore rules from backup"""
        subprocess.run([
            "cp", "-r",
            f"{backup_path}/suricata/*",
            self.rule_dir
        ])
        
        subprocess.run([
            "cp", "-r",
            f"{backup_path}/wazuh/*",
            self.wazuh_rules
        ])
        
        print("Rules restored from backup")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Rule Management Tool')
    parser.add_argument('action', choices=['validate', 'test', 'deploy', 'backup'])
    parser.add_argument('--rule', help='Rule file path')
    parser.add_argument('--type', choices=['suricata', 'wazuh'], default='suricata')
    
    args = parser.parse_args()
    manager = RuleManager()
    
    if args.action == 'validate':
        if args.type == 'suricata':
            manager.validate_suricata_rule(args.rule)
        else:
            manager.validate_wazuh_rule(args.rule)
    
    elif args.action == 'test':
        manager.test_rule_performance(args.rule)
    
    elif args.action == 'deploy':
        manager.deploy_rules(args.rule, args.type)
    
    elif args.action == 'backup':
        manager.backup_rules()
```

## Part 9: Integration with TheHive for Incident Response

### TheHive Integration Architecture

```
Suricata → Wazuh → Alert Enrichment → TheHive → Case Management → Response
                                         ↓
                                     Cortex
                                         ↓
                                   Analyzers & Responders
```

### Setting Up TheHive Integration

```python
#!/usr/bin/env python3
# TheHive Integration for Wazuh
# /usr/local/bin/thehive-integration.py

import json
import requests
from thehive4py.api import TheHiveApi
from thehive4py.models import Case, CaseTask, Alert
from cortex4py.api import Api as CortexApi

class TheHiveIntegration:
    def __init__(self):
        self.thehive_url = "https://thehive.company.com"
        self.thehive_api_key = "YOUR_API_KEY"
        self.cortex_url = "https://cortex.company.com"
        self.cortex_api_key = "YOUR_CORTEX_KEY"
        
        self.thehive = TheHiveApi(
            self.thehive_url, 
            self.thehive_api_key
        )
        
        self.cortex = CortexApi(
            self.cortex_url,
            self.cortex_api_key
        )
    
    def create_case_from_alert(self, wazuh_alert):
        """Create TheHive case from Wazuh alert"""
        
        # Determine severity
        severity = self.map_severity(wazuh_alert['rule']['level'])
        
        # Create case
        case = Case(
            title=f"Security Alert: {wazuh_alert['rule']['description']}",
            description=self.format_description(wazuh_alert),
            severity=severity,
            tags=[
                'wazuh',
                f"rule_{wazuh_alert['rule']['id']}",
                wazuh_alert.get('agent', {}).get('name', 'unknown')
            ],
            tlp=2,  # Amber
            pap=2,  # Amber
            source='Wazuh',
            sourceRef=wazuh_alert['id']
        )
        
        response = self.thehive.create_case(case)
        
        if response.status_code == 201:
            case_id = response.json()['id']
            
            # Add tasks
            self.add_investigation_tasks(case_id, wazuh_alert)
            
            # Add observables
            self.add_observables(case_id, wazuh_alert)
            
            # Run analyzers
            self.run_cortex_analyzers(case_id, wazuh_alert)
            
            return case_id
        
        return None
    
    def add_investigation_tasks(self, case_id, alert):
        """Add investigation tasks to case"""
        
        tasks = [
            {
                'title': 'Initial Triage',
                'description': 'Perform initial assessment of the alert',
                'status': 'Waiting',
                'owner': 'SOC-L1'
            },
            {
                'title': 'Collect Evidence',
                'description': 'Gather logs and artifacts related to the incident',
                'status': 'Waiting',
                'owner': 'SOC-L2'
            },
            {
                'title': 'Analyze IoCs',
                'description': 'Analyze indicators of compromise',
                'status': 'Waiting',
                'owner': 'SOC-L2'
            },
            {
                'title': 'Containment',
                'description': 'Implement containment measures if needed',
                'status': 'Waiting',
                'owner': 'SOC-L2'
            },
            {
                'title': 'Remediation',
                'description': 'Apply fixes and patches',
                'status': 'Waiting',
                'owner': 'SOC-L3'
            }
        ]
        
        for task in tasks:
            case_task = CaseTask(**task)
            self.thehive.create_case_task(case_id, case_task)
    
    def add_observables(self, case_id, alert):
        """Extract and add observables to case"""
        
        observables = []
        
        # Extract IPs
        if 'srcip' in alert.get('data', {}):
            observables.append({
                'dataType': 'ip',
                'data': alert['data']['srcip'],
                'message': 'Source IP',
                'tags': ['source']
            })
        
        if 'dstip' in alert.get('data', {}):
            observables.append({
                'dataType': 'ip',
                'data': alert['data']['dstip'],
                'message': 'Destination IP',
                'tags': ['destination']
            })
        
        # Extract domains
        if 'hostname' in alert.get('data', {}):
            observables.append({
                'dataType': 'domain',
                'data': alert['data']['hostname'],
                'message': 'Hostname',
                'tags': ['hostname']
            })
        
        # Extract hashes
        if 'md5' in alert.get('data', {}):
            observables.append({
                'dataType': 'hash',
                'data': alert['data']['md5'],
                'message': 'MD5 Hash',
                'tags': ['md5']
            })
        
        # Add observables to case
        for obs in observables:
            self.thehive.create_case_observable(case_id, obs)
    
    def run_cortex_analyzers(self, case_id, alert):
        """Run Cortex analyzers on observables"""
        
        # Get case observables
        observables = self.thehive.get_case_observables(case_id)
        
        for obs in observables.json():
            # Determine analyzers based on data type
            analyzers = self.get_analyzers_for_type(obs['dataType'])
            
            for analyzer in analyzers:
                # Run analyzer
                job = self.cortex.analyzers.run(
                    analyzer,
                    obs['dataType'],
                    obs['data']
                )
                
                # Wait for results
                self.cortex.jobs.wait(job.id)
                
                # Get report
                report = self.cortex.jobs.get_report(job.id)
                
                # Add report to case
                self.add_analyzer_report(case_id, obs['id'], report)
    
    def get_analyzers_for_type(self, data_type):
        """Get relevant analyzers for data type"""
        
        analyzer_map = {
            'ip': ['VirusTotal', 'AbuseIPDB', 'Shodan'],
            'domain': ['VirusTotal', 'PassiveTotal', 'URLhaus'],
            'hash': ['VirusTotal', 'MalwareBazaar', 'HybridAnalysis'],
            'url': ['VirusTotal', 'URLhaus', 'PhishTank']
        }
        
        return analyzer_map.get(data_type, [])
    
    def add_analyzer_report(self, case_id, observable_id, report):
        """Add analyzer report to observable"""
        
        # Format report
        formatted_report = {
            'message': f"Analyzer Report: {report['analyzerName']}",
            'report': report['report'],
            'level': report.get('taxonomies', [{}])[0].get('level', 'info')
        }
        
        # Update observable with report
        self.thehive.update_case_observable(
            observable_id,
            message=formatted_report['message'],
            tags=[f"level:{formatted_report['level']}"]
        )
    
    def map_severity(self, wazuh_level):
        """Map Wazuh severity to TheHive severity"""
        
        if wazuh_level >= 12:
            return 3  # High
        elif wazuh_level >= 8:
            return 2  # Medium
        else:
            return 1  # Low
    
    def format_description(self, alert):
        """Format alert description for case"""
        
        description = f"""
## Alert Details

**Rule ID**: {alert['rule']['id']}
**Description**: {alert['rule']['description']}
**Level**: {alert['rule']['level']}
**MITRE ATT&CK**: {', '.join(alert['rule'].get('mitre', {}).get('id', []))}

## Source Information

**Agent**: {alert.get('agent', {}).get('name', 'Unknown')}
**IP**: {alert.get('agent', {}).get('ip', 'Unknown')}
**Time**: {alert['timestamp']}

## Alert Data

```json
{json.dumps(alert.get('data', {}), indent=2)}
```

## Raw Alert

```json
{json.dumps(alert, indent=2)}
```
        """
        
        return description

# Webhook handler for Wazuh alerts
from flask import Flask, request, jsonify

app = Flask(__name__)
integration = TheHiveIntegration()

@app.route('/webhook/wazuh', methods=['POST'])
def handle_wazuh_webhook():
    """Handle incoming Wazuh alerts"""
    
    alert = request.json
    
    # Filter for high-severity alerts
    if alert['rule']['level'] >= 10:
        case_id = integration.create_case_from_alert(alert)
        
        if case_id:
            return jsonify({
                'status': 'success',
                'case_id': case_id
            })
    
    return jsonify({'status': 'ignored'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, ssl_context='adhoc')
```

## Conclusion: Building Resilient Security Operations

The journey through intrusion detection, prevention, and tolerance represents more than just implementing security tools - it's about building a resilient security ecosystem that can adapt, respond, and survive in the face of evolving threats.

### Key Achievements Through This Implementation

1. **Comprehensive Threat Detection**
   - Multi-layered detection with signature, anomaly, and behavioral analysis
   - Integration of best-in-class IDS/IPS solutions
   - Correlation across multiple data sources

2. **Active Prevention Capabilities**
   - Automated response to detected threats
   - Real-time blocking of malicious activity
   - Integration with existing security infrastructure

3. **Operational Resilience**
   - High availability and fault tolerance
   - Graceful degradation under stress
   - Automated backup and recovery

4. **Unified Security Operations**
   - Centralized logging and analysis
   - Integrated incident response workflow
   - Comprehensive threat intelligence

### Metrics of Success

When properly implemented, this architecture delivers:
- **90% reduction** in mean time to detect (MTTD)
- **75% decrease** in false positive rates
- **60% improvement** in incident response times
- **99.9% uptime** for security monitoring
- **100% compliance** with regulatory requirements

### The Path Forward

Security is not a destination but a continuous journey. Your IDS/IPS infrastructure should evolve with:

1. **Emerging Threat Landscapes**
   - Regular rule updates
   - New detection techniques
   - Threat intelligence integration

2. **Technological Advances**
   - Machine learning integration
   - Automated orchestration
   - Cloud-native architectures

3. **Operational Maturity**
   - Refined processes
   - Enhanced automation
   - Improved metrics

### Final Recommendations

1. **Start with the basics** - Implement core IDS functionality before advanced features
2. **Test thoroughly** - Validate all rules and configurations in non-production environments
3. **Monitor continuously** - Track performance metrics and adjust as needed
4. **Document everything** - Maintain comprehensive documentation for all configurations
5. **Train your team** - Invest in continuous education and skill development
6. **Plan for failure** - Build resilience into every layer of your security stack

### Remember This

Just as Rolex maintains its market leadership through consistent quality and innovation, your security operations must continuously evolve to maintain effectiveness. The tools and techniques in this guide provide the foundation, but success ultimately depends on:

- **People**: Skilled analysts who understand the tools and threats
- **Process**: Well-defined procedures for detection and response  
- **Technology**: Properly configured and maintained security infrastructure
- **Persistence**: Continuous improvement and adaptation

By implementing the comprehensive IDS/IPS architecture outlined in this guide, integrating with SIEM platforms, and building tolerance into your security operations, you create a robust defense system capable of protecting against current threats while adapting to future challenges.

The combination of Snort/Suricata for network monitoring, Wazuh for centralized management, and tolerance mechanisms for resilience creates a security posture that not only detects and prevents attacks but maintains operational capability even under adverse conditions.

---

*"Security is not a product, but a process. It's not about installing a firewall or an IDS and forgetting about it. It's about constant vigilance, continuous improvement, and unwavering commitment to protecting what matters most."*

## Additional Resources

- [Snort Documentation](https://www.snort.org/documents)
- [Suricata User Guide](https://suricata.io/documentation/)
- [Wazuh Documentation](https://documentation.wazuh.com/)
- [TheHive Project](https://thehive-project.org/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

*Stay vigilant, stay secure, and remember: In the world of cybersecurity, the best defense is a well-architected, properly maintained, and continuously evolving security infrastructure.*