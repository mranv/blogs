---
author: Anubhav Gain
pubDatetime: 2025-01-04T18:30:00+05:30
modDatetime: 2025-01-04T18:30:00+05:30
title: "Mastering SIEM Logs and Events: The Complete Guide to Log Management with Wazuh"
slug: mastering-siem-logs-events-wazuh-2025
featured: true
draft: false
tags:
  - SIEM
  - Wazuh
  - log-management
  - event-monitoring
  - EPS
  - APS
  - security-monitoring
  - log-analysis
  - incident-response
  - syslog
  - XDR
  - threat-detection
  - security-operations
  - compliance
  - forensics
description: "An exhaustive guide to understanding SIEM logs and events, featuring deep dives into Wazuh implementation, EPS/APS metrics, log collection mechanisms, analysis engines, and real-world deployment scenarios with practical examples and advanced configurations."
---

# Mastering SIEM Logs and Events: The Complete Guide to Log Management with Wazuh

## Table of Contents

## Preface: The Digital Chronicle of Modern Security

In the vast digital landscape of 2025, every click, every connection, and every computation leaves a trace – a digital footprint encoded in logs. These logs are not mere text files; they are the **chronicles of your IT infrastructure**, the **witnesses to security incidents**, and the **keys to forensic investigations**. This comprehensive guide delves into the intricate world of SIEM logs and events, with a particular focus on **Wazuh**, the open-source security platform that has revolutionized how organizations approach log management and threat detection.

Consider this: A single enterprise generates approximately **100,000 to 1 million log entries per second**. Hidden within this tsunami of data are the subtle indicators of compromise, the early warnings of system failures, and the evidence of regulatory compliance. The challenge isn't just collecting these logs – it's transforming them into actionable intelligence before it's too late.

## Part 1: The Foundation - Understanding SIEM in the Context of Logs

### What Makes SIEM the Nerve Center of Security Operations?

**Security Information and Event Management (SIEM)** represents the convergence of two critical security disciplines:
- **Security Information Management (SIM)**: The historian, archiving and analyzing historical log data
- **Security Event Management (SEM)**: The sentinel, monitoring real-time events and triggering immediate responses

Together, they create a **unified platform** that doesn't just collect logs – it breathes life into them, transforming raw data into security intelligence.

### The Anatomy of a Log Entry

Before diving deeper, let's dissect what makes a log entry:

```
2025-01-04T18:30:45.123Z [INFO] AUTH user=john.doe@company.com ip=192.168.1.100 
action=LOGIN status=SUCCESS duration=234ms geo=US-NYC device=laptop-jd-001
```

This single line contains:
- **Timestamp**: Precise timing for correlation
- **Severity Level**: INFO, WARN, ERROR, CRITICAL
- **Category**: AUTH, NETWORK, SYSTEM, APPLICATION
- **Context Data**: User, IP, action, status
- **Metadata**: Duration, geolocation, device identifier

Each element serves a purpose in the larger security narrative.

## Part 2: The Mathematics of Security - EPS and APS Decoded

### Events Per Second (EPS): The Pulse of Your Infrastructure

**EPS (Events Per Second)** is more than a metric – it's the heartbeat of your digital ecosystem. It represents the velocity at which your infrastructure generates security-relevant data.

#### Understanding EPS Scale and Impact

```
Small Business:       100-1,000 EPS
Medium Enterprise:    1,000-10,000 EPS  
Large Enterprise:     10,000-100,000 EPS
Global Corporation:   100,000-1,000,000+ EPS
```

#### The EPS Calculation Formula

```
EPS = Total Events / Time Period (seconds)

Daily Events = EPS × 86,400
Monthly Events = EPS × 2,592,000
Yearly Events = EPS × 31,536,000

Storage Required (GB) = (EPS × 86,400 × Avg Event Size × Retention Days) / 1,073,741,824
```

#### Real-World EPS Scenarios

**Scenario 1: Normal Operations**
```
Baseline EPS: 5,000
Morning Peak (9-10 AM): 8,000 EPS
Lunch Period (12-1 PM): 3,000 EPS
Evening Wind-down (6-7 PM): 4,000 EPS
```

**Scenario 2: Security Incident**
```
Baseline EPS: 5,000
DDoS Attack Detected: 50,000 EPS
Malware Outbreak: 25,000 EPS
Data Exfiltration Attempt: 15,000 EPS
```

### Alerts Per Second (APS): The Alarm System

While EPS measures volume, **APS (Alerts Per Second)** measures relevance. It's the rate at which your SIEM identifies potentially dangerous patterns.

#### The APS Hierarchy

```
Level 1 - Informational: 0.1-1 APS (routine notifications)
Level 2 - Warning: 0.01-0.1 APS (anomalies requiring review)
Level 3 - Critical: 0.001-0.01 APS (immediate action required)
Level 4 - Emergency: <0.001 APS (organization-wide threat)
```

#### The Critical Relationship: EPS vs APS

```
Healthy Ratio: APS/EPS = 0.0001 to 0.001 (1 alert per 1,000-10,000 events)
Alert Fatigue Zone: APS/EPS > 0.01 (>1% of events generating alerts)
Blind Spot Zone: APS/EPS < 0.00001 (<0.001% - potentially missing threats)
```

## Part 3: The Wazuh Ecosystem - Architecture for Scale

### Wazuh's Evolutionary Journey

Wazuh emerged from the foundations of OSSEC, evolving into a comprehensive **XDR (Extended Detection and Response)** platform. Its architecture represents a masterclass in distributed security monitoring.

### Component Deep Dive

#### 1. Wazuh Manager: The Brain
```
Primary Functions:
├── Agent Management (registration, configuration, updates)
├── Event Processing (decoders, rules, correlation)
├── Alert Generation (real-time threat detection)
├── Integration Hub (connecting to external systems)
└── API Services (RESTful interface for automation)

Performance Metrics:
- Single Manager: Up to 20,000 agents
- Clustered Setup: 100,000+ agents
- Processing Capacity: 50,000 EPS per manager
```

#### 2. Wazuh Agent: The Sensory Network
```
Collection Capabilities:
├── Log Collection (system, application, custom)
├── File Integrity Monitoring (FIM)
├── System Inventory (hardware, software, network)
├── Security Configuration Assessment (SCA)
├── Vulnerability Detection
└── Active Response Execution

Resource Footprint:
- CPU Usage: <1% average, 5% during scans
- Memory: 30-50 MB resident
- Network: 500-1000 EPS default throttle
- Disk: 100 MB installation + log buffer
```

#### 3. Wazuh Indexer: The Memory Palace
```
Architecture:
├── Elasticsearch-based (OpenSearch fork)
├── Distributed Clustering Support
├── Hot-Warm-Cold Data Tiering
├── Index Lifecycle Management
└── Snapshot and Restore Capabilities

Sizing Guidelines:
- 1 GB RAM per 1 million daily events
- 3 nodes minimum for production
- 50 GB disk per 100 million events (compressed)
```

#### 4. Wazuh Dashboard: The Window to Security
```
Visualization Capabilities:
├── Real-time Event Streaming
├── Custom Dashboard Creation
├── Threat Intelligence Overlays
├── Compliance Reporting
├── Investigation Workbench
└── Multi-tenancy Support

Performance Optimization:
- Browser Cache: 100 MB recommended
- Concurrent Users: 50-100 per instance
- Query Timeout: 30 seconds default
- Dashboard Refresh: 5-60 seconds configurable
```

## Part 4: The Taxonomy of Logs - A Comprehensive Catalog

### Operating System Logs: The Foundation Layer

#### Windows Event Logs - The Microsoft Chronicle
```
Security Log (Event ID Ranges):
├── 4624-4625: Logon Events (Success/Failure)
├── 4688-4689: Process Creation/Termination
├── 4656-4663: Object Access Attempts
├── 4697: Service Installation
├── 4720-4738: Account Management
├── 4768-4773: Kerberos Authentication
└── 5136-5141: Directory Service Changes

Critical Event IDs for Security:
- 4625: Failed login (Brute force indicator)
- 4672: Special privileges assigned (Privilege escalation)
- 4688: New process created (Malware execution)
- 4697: Service installed (Persistence mechanism)
- 7045: New service installed (System compromise)
```

#### Linux System Logs - The Penguin's Diary
```
/var/log/ Directory Structure:
├── auth.log/secure: Authentication events
├── syslog/messages: System-wide messages
├── kern.log: Kernel events and errors
├── audit/audit.log: SELinux/AppArmor events
├── cron.log: Scheduled task execution
├── mail.log: Email server activity
├── apache2/nginx/: Web server logs
└── mysql/postgresql/: Database logs

Key Log Patterns:
- "Failed password": Authentication failures
- "COMMAND=/usr/bin/sudo": Privilege escalation
- "Connection from": Network connections
- "segfault": Application crashes (potential exploits)
- "Out of memory": Resource exhaustion
```

### Network Device Logs: The Traffic Controllers

#### Firewall Logs - The Gatekeepers
```
Common Firewall Log Fields:
├── Timestamp: Event occurrence time
├── Action: ALLOW/DENY/DROP/REJECT
├── Protocol: TCP/UDP/ICMP/GRE
├── Source IP/Port: Origin of traffic
├── Destination IP/Port: Target of traffic
├── Interface: Ingress/Egress interface
├── Rule ID: Matching security policy
├── Bytes Transferred: Data volume
└── Session ID: Connection tracking

Security Indicators:
- Port Scanning: Multiple denied connections to different ports
- DDoS Patterns: High volume from single/multiple sources
- Data Exfiltration: Large outbound transfers to unusual destinations
- Command & Control: Regular beaconing to suspicious IPs
```

#### IDS/IPS Logs - The Threat Detectors
```
Alert Classifications:
├── Priority 1: Critical threats requiring immediate action
│   ├── Known exploits
│   ├── Active malware
│   └── Data breaches
├── Priority 2: High-risk activities
│   ├── Suspicious scanning
│   ├── Policy violations
│   └── Anomalous behavior
└── Priority 3: Informational events
    ├── Regular updates
    ├── Status changes
    └── Baseline deviations

Snort/Suricata Rule Example:
alert tcp $EXTERNAL_NET any -> $HOME_NET 445 (
  msg:"SMB EternalBlue Exploit Attempt"; 
  flow:to_server,established; 
  content:"|FF|SMB|75|"; 
  sid:1000001; 
  rev:1;
)
```

### Application Logs: The Business Layer

#### Web Server Logs - The Digital Footprints
```
Apache/Nginx Access Log Format:
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent 
"$http_referer" "$http_user_agent" $request_time

Security Patterns to Monitor:
- SQL Injection: request contains "' OR '1'='1", "UNION SELECT"
- XSS Attempts: request contains "<script>", "javascript:"
- Directory Traversal: request contains "../", "..\"
- Brute Force: Multiple 401/403 responses to same user
- Resource Enumeration: Sequential requests with incrementing IDs
- Bot Detection: Unusual user agents, high request rates
```

#### Database Logs - The Data Vault Records
```
Critical Database Events:
├── Authentication:
│   ├── Successful/failed logins
│   ├── Password changes
│   └── Privilege modifications
├── Data Access:
│   ├── SELECT on sensitive tables
│   ├── Bulk data exports
│   └── Schema modifications
├── Performance:
│   ├── Slow queries (>1000ms)
│   ├── Deadlocks
│   └── Connection pool exhaustion
└── Security:
    ├── Failed SQL statements (injection attempts)
    ├── Unauthorized access attempts
    └── Audit trail modifications

PostgreSQL Example:
LOG: connection authorized: user=analyst database=production
LOG: statement: SELECT * FROM users WHERE id=1; DROP TABLE users;--
ERROR: syntax error at or near "DROP"
```

### Cloud Platform Logs: The Modern Frontier

#### AWS CloudTrail - The Cloud Audit Trail
```
Event Categories:
├── Management Events:
│   ├── EC2 instance launches/terminations
│   ├── S3 bucket creation/deletion
│   ├── IAM policy changes
│   └── Security group modifications
├── Data Events:
│   ├── S3 object operations
│   ├── Lambda function invocations
│   └── DynamoDB operations
└── Insights Events:
    ├── Unusual API activity
    ├── Resource provisioning spikes
    └── Error rate anomalies

Critical CloudTrail Events:
{
  "eventName": "AssumeRole",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDAI23HXD2O5EXAMPLE",
    "arn": "arn:aws:iam::123456789012:user/suspicious-user"
  },
  "requestParameters": {
    "roleArn": "arn:aws:iam::123456789012:role/AdminRole"
  }
}
```

#### Azure Monitor - The Azure Observatory
```
Log Categories:
├── Activity Logs: Control plane operations
├── Resource Logs: Resource-specific operations
├── Azure AD Logs: Identity and access events
├── Security Center: Threat detection alerts
└── Application Insights: Application telemetry

Key Security Signals:
- Conditional Access failures
- Privileged Identity Management activations
- Key Vault access patterns
- Network Security Group rule changes
- Unusual geographical access patterns
```

## Part 5: The Wazuh Implementation Masterclass

### Phase 1: Installation Architecture and Deployment

#### Single-Node All-in-One Deployment
```bash
# System Requirements Check
CPU_CORES=$(nproc)
MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
DISK_GB=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')

if [[ $CPU_CORES -lt 4 ]] || [[ $MEMORY_GB -lt 8 ]] || [[ $DISK_GB -lt 50 ]]; then
    echo "Insufficient resources. Minimum: 4 CPU, 8GB RAM, 50GB Disk"
    exit 1
fi

# Automated Installation Script
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.7/config.yml

# Configure installation parameters
cat > config.yml <<EOF
nodes:
  indexer:
    - name: indexer-1
      ip: 127.0.0.1
  server:
    - name: server-1
      ip: 127.0.0.1
  dashboard:
    - name: dashboard-1
      ip: 127.0.0.1
EOF

# Execute installation
bash wazuh-install.sh --generate-config-files
bash wazuh-install.sh --wazuh-indexer indexer-1
bash wazuh-install.sh --wazuh-server server-1
bash wazuh-install.sh --wazuh-dashboard dashboard-1

# Verify installation
systemctl status wazuh-manager
systemctl status wazuh-indexer
systemctl status wazuh-dashboard
```

#### Distributed Multi-Node Architecture
```yaml
# docker-compose.yml for containerized deployment
version: '3.8'

services:
  wazuh-manager-master:
    image: wazuh/wazuh-manager:4.7.0
    hostname: wazuh-manager-master
    environment:
      - INDEXER_URL=https://wazuh-indexer:9200
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=${INDEXER_PASSWORD}
      - FILEBEAT_SSL_VERIFICATION_MODE=full
      - SSL_CERTIFICATE_AUTHORITIES=/etc/ssl/root-ca.pem
      - SSL_CERTIFICATE=/etc/ssl/filebeat.pem
      - SSL_KEY=/etc/ssl/filebeat.key
    volumes:
      - master-wazuh-api-configuration:/var/ossec/api/configuration
      - master-wazuh-etc:/var/ossec/etc
      - master-wazuh-logs:/var/ossec/logs
      - master-wazuh-queue:/var/ossec/queue
      - master-wazuh-var-multigroups:/var/ossec/var/multigroups
      - master-wazuh-integrations:/var/ossec/integrations
      - master-wazuh-active-response:/var/ossec/active-response/bin
      - master-wazuh-agentless:/var/ossec/agentless
      - master-wazuh-wodles:/var/ossec/wodles
      - master-filebeat-etc:/etc/filebeat
      - master-filebeat-var:/var/lib/filebeat
    ports:
      - "1514:1514/udp"
      - "1514:1514/tcp"
      - "514:514/udp"
      - "514:514/tcp"
      - "55000:55000"

  wazuh-manager-worker:
    image: wazuh/wazuh-manager:4.7.0
    hostname: wazuh-manager-worker
    depends_on:
      - wazuh-manager-master
    environment:
      - CLUSTER_NODE_TYPE=worker
      - CLUSTER_KEY=${CLUSTER_KEY}
      - CLUSTER_MASTER_HOST=wazuh-manager-master
    volumes:
      - worker-wazuh-api-configuration:/var/ossec/api/configuration
      - worker-wazuh-etc:/var/ossec/etc
      - worker-wazuh-logs:/var/ossec/logs
      - worker-wazuh-queue:/var/ossec/queue
      - worker-wazuh-var-multigroups:/var/ossec/var/multigroups
      - worker-wazuh-integrations:/var/ossec/integrations
      - worker-wazuh-active-response:/var/ossec/active-response/bin
      - worker-wazuh-agentless:/var/ossec/agentless
      - worker-wazuh-wodles:/var/ossec/wodles
      - worker-filebeat-etc:/etc/filebeat
      - worker-filebeat-var:/var/lib/filebeat

  wazuh-indexer:
    image: wazuh/wazuh-indexer:4.7.0
    hostname: wazuh-indexer
    environment:
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
      - bootstrap.memory_lock=true
      - discovery.type=single-node
      - cluster.name=wazuh-cluster
      - network.host=0.0.0.0
      - "DISABLE_INSTALL_DEMO_CONFIG=true"
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - wazuh-indexer-data:/var/lib/wazuh-indexer
      - ./config/wazuh_indexer_ssl_certs:/usr/share/wazuh-indexer/config/certs
    ports:
      - "9200:9200"

  wazuh-dashboard:
    image: wazuh/wazuh-dashboard:4.7.0
    hostname: wazuh-dashboard
    depends_on:
      - wazuh-indexer
    environment:
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=${INDEXER_PASSWORD}
      - WAZUH_API_URL=https://wazuh-manager-master
      - DASHBOARD_USERNAME=kibanaserver
      - DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
    volumes:
      - ./config/wazuh_indexer_ssl_certs:/usr/share/wazuh-dashboard/certs
      - wazuh-dashboard-config:/usr/share/wazuh-dashboard/data/wazuh/config
      - wazuh-dashboard-custom:/usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom
    ports:
      - "5601:5601"

volumes:
  master-wazuh-api-configuration:
  master-wazuh-etc:
  master-wazuh-logs:
  master-wazuh-queue:
  master-wazuh-var-multigroups:
  master-wazuh-integrations:
  master-wazuh-active-response:
  master-wazuh-agentless:
  master-wazuh-wodles:
  master-filebeat-etc:
  master-filebeat-var:
  worker-wazuh-api-configuration:
  worker-wazuh-etc:
  worker-wazuh-logs:
  worker-wazuh-queue:
  worker-wazuh-var-multigroups:
  worker-wazuh-integrations:
  worker-wazuh-active-response:
  worker-wazuh-agentless:
  worker-wazuh-wodles:
  worker-filebeat-etc:
  worker-filebeat-var:
  wazuh-indexer-data:
  wazuh-dashboard-config:
  wazuh-dashboard-custom:
```

### Phase 2: Agent Deployment and Management

#### Windows Agent Deployment via PowerShell
```powershell
# Automated Windows Agent Deployment Script
param(
    [Parameter(Mandatory=$true)]
    [string]$ManagerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    
    [Parameter(Mandatory=$false)]
    [string]$AgentGroup = "windows",
    
    [Parameter(Mandatory=$false)]
    [string]$WazuhVersion = "4.7.0"
)

# Download and install Wazuh agent
$installerUrl = "https://packages.wazuh.com/4.x/windows/wazuh-agent-$WazuhVersion-1.msi"
$installerPath = "$env:TEMP\wazuh-agent.msi"

Write-Host "Downloading Wazuh Agent v$WazuhVersion..."
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

Write-Host "Installing Wazuh Agent..."
$arguments = @(
    "/i"
    "`"$installerPath`""
    "/qn"
    "WAZUH_MANAGER=$ManagerIP"
    "WAZUH_AGENT_NAME=$AgentName"
    "WAZUH_AGENT_GROUP=$AgentGroup"
    "WAZUH_REGISTRATION_SERVER=$ManagerIP"
    "WAZUH_REGISTRATION_PORT=1514"
)

Start-Process msiexec.exe -ArgumentList $arguments -Wait -NoNewWindow

# Configure advanced settings
$ossecConf = "C:\Program Files (x86)\ossec-agent\ossec.conf"
$customConfig = @"
<ossec_config>
  <client>
    <server>
      <address>$ManagerIP</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <crypto_method>aes</crypto_method>
    <notify_time>10</notify_time>
    <time-reconnect>60</time-reconnect>
    <auto_restart>yes</auto_restart>
  </client>
  
  <client_buffer>
    <disabled>no</disabled>
    <queue_size>5000</queue_size>
    <events_per_second>500</events_per_second>
  </client_buffer>
  
  <logging>
    <log_format>json</log_format>
  </logging>
  
  <!-- File Integrity Monitoring -->
  <syscheck>
    <disabled>no</disabled>
    <frequency>43200</frequency>
    <scan_on_start>yes</scan_on_start>
    <directories check_all="yes" realtime="yes">C:\Windows\System32</directories>
    <directories check_all="yes" realtime="yes">C:\Windows\SysWOW64</directories>
    <directories check_all="yes" realtime="yes">C:\Program Files</directories>
    <directories check_all="yes" realtime="yes">C:\Program Files (x86)</directories>
    <ignore>C:\Windows\Temp</ignore>
    <ignore>C:\Windows\SoftwareDistribution</ignore>
  </syscheck>
  
  <!-- Windows Registry Monitoring -->
  <syscheck>
    <windows_registry>HKEY_LOCAL_MACHINE\Software</windows_registry>
    <windows_registry>HKEY_LOCAL_MACHINE\System\CurrentControlSet\Services</windows_registry>
    <windows_registry>HKEY_LOCAL_MACHINE\Security</windows_registry>
  </syscheck>
  
  <!-- Log Collection -->
  <localfile>
    <location>Security</location>
    <log_format>eventchannel</log_format>
  </localfile>
  
  <localfile>
    <location>System</location>
    <log_format>eventchannel</log_format>
  </localfile>
  
  <localfile>
    <location>Application</location>
    <log_format>eventchannel</log_format>
  </localfile>
  
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
  
  <localfile>
    <location>Microsoft-Windows-PowerShell/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
</ossec_config>
"@

# Append custom configuration
Add-Content -Path $ossecConf -Value $customConfig

# Start the Wazuh service
Write-Host "Starting Wazuh Agent service..."
Start-Service -Name "Wazuh"

# Verify agent registration
Start-Sleep -Seconds 10
$agentStatus = & "C:\Program Files (x86)\ossec-agent\agent-auth.exe" -m $ManagerIP
Write-Host "Agent Status: $agentStatus"
```

#### Linux Agent Deployment via Bash
```bash
#!/bin/bash
# Automated Linux Agent Deployment Script

MANAGER_IP="${1}"
AGENT_NAME="${2:-$(hostname)}"
AGENT_GROUP="${3:-linux}"
WAZUH_VERSION="${4:-4.7.0}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_error() {
    echo -e "${RED}[-]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VERSION"

# Install Wazuh repository
install_repository() {
    case $OS in
        ubuntu|debian)
            curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
            echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
            apt-get update
            ;;
        centos|rhel|fedora)
            rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH
            cat > /etc/yum.repos.d/wazuh.repo << EOF
[wazuh]
gpgcheck=1
gpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH
enabled=1
name=EL-\$releasever - Wazuh
baseurl=https://packages.wazuh.com/4.x/yum/
protect=1
EOF
            ;;
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
}

# Install Wazuh agent
install_agent() {
    print_status "Installing Wazuh Agent..."
    case $OS in
        ubuntu|debian)
            WAZUH_MANAGER="$MANAGER_IP" WAZUH_AGENT_NAME="$AGENT_NAME" WAZUH_AGENT_GROUP="$AGENT_GROUP" apt-get install -y wazuh-agent
            ;;
        centos|rhel|fedora)
            WAZUH_MANAGER="$MANAGER_IP" WAZUH_AGENT_NAME="$AGENT_NAME" WAZUH_AGENT_GROUP="$AGENT_GROUP" yum install -y wazuh-agent
            ;;
    esac
}

# Configure agent
configure_agent() {
    print_status "Configuring Wazuh Agent..."
    cat > /var/ossec/etc/ossec.conf << 'EOF'
<ossec_config>
  <client>
    <server>
      <address>MANAGER_IP_PLACEHOLDER</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <crypto_method>aes</crypto_method>
    <notify_time>10</notify_time>
    <time-reconnect>60</time-reconnect>
    <auto_restart>yes</auto_restart>
  </client>

  <client_buffer>
    <disabled>no</disabled>
    <queue_size>5000</queue_size>
    <events_per_second>500</events_per_second>
  </client_buffer>

  <logging>
    <log_format>json</log_format>
  </logging>

  <!-- File Integrity Monitoring -->
  <syscheck>
    <disabled>no</disabled>
    <frequency>43200</frequency>
    <scan_on_start>yes</scan_on_start>
    
    <!-- System directories -->
    <directories check_all="yes" realtime="yes">/bin,/sbin,/usr/bin,/usr/sbin</directories>
    <directories check_all="yes" realtime="yes">/etc</directories>
    <directories check_all="yes" realtime="yes">/boot</directories>
    
    <!-- Critical files -->
    <directories check_all="yes" realtime="yes">/root/.ssh</directories>
    <directories check_all="yes" realtime="yes">/home/*/.ssh</directories>
    
    <!-- Ignore temporary files -->
    <ignore>/etc/mtab</ignore>
    <ignore>/etc/hosts.deny</ignore>
    <ignore>/etc/mail/statistics</ignore>
    <ignore>/etc/random-seed</ignore>
    <ignore>/etc/random.seed</ignore>
    <ignore>/etc/adjtime</ignore>
    <ignore>/etc/httpd/logs</ignore>
    <ignore>/etc/utmpx</ignore>
    <ignore>/etc/wtmpx</ignore>
    <ignore>/etc/cups/certs</ignore>
    <ignore>/etc/dumpdates</ignore>
    <ignore>/etc/svc/volatile</ignore>
    <ignore>/sys</ignore>
    <ignore>/proc</ignore>
    <ignore>/dev</ignore>
    <ignore>/tmp</ignore>
    <ignore>/var/tmp</ignore>
    <ignore>/var/cache</ignore>
    <ignore>/var/run</ignore>
    <ignore>/var/lock</ignore>
  </syscheck>

  <!-- Log Collection -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/syslog</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/messages</location>
  </localfile>

  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/secure</location>
  </localfile>

  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/apache2/access.log</location>
  </localfile>

  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/apache2/error.log</location>
  </localfile>

  <localfile>
    <log_format>command</log_format>
    <command>df -P</command>
    <frequency>360</frequency>
  </localfile>

  <localfile>
    <log_format>command</log_format>
    <command>netstat -tulpn | grep LISTEN</command>
    <frequency>360</frequency>
  </localfile>

  <localfile>
    <log_format>command</log_format>
    <command>last -n 20</command>
    <frequency>360</frequency>
  </localfile>

  <!-- Rootcheck -->
  <rootcheck>
    <disabled>no</disabled>
    <check_files>yes</check_files>
    <check_trojans>yes</check_trojans>
    <check_dev>yes</check_dev>
    <check_sys>yes</check_sys>
    <check_pids>yes</check_pids>
    <check_ports>yes</check_ports>
    <check_if>yes</check_if>
    <frequency>43200</frequency>
  </rootcheck>

  <!-- Vulnerability Detection -->
  <vulnerability-detector>
    <enabled>yes</enabled>
    <interval>5m</interval>
    <ignore_time>6h</ignore_time>
    <run_on_start>yes</run_on_start>
    
    <provider name="canonical">
      <enabled>yes</enabled>
      <os>trusty</os>
      <os>xenial</os>
      <os>bionic</os>
      <os>focal</os>
      <os>jammy</os>
      <update_interval>1h</update_interval>
    </provider>
    
    <provider name="redhat">
      <enabled>yes</enabled>
      <os>7</os>
      <os>8</os>
      <os>9</os>
      <update_interval>1h</update_interval>
    </provider>
  </vulnerability-detector>

  <!-- Active Response -->
  <active-response>
    <disabled>no</disabled>
    <ca_store>/var/ossec/etc/wpk_root.pem</ca_store>
    <ca_verification>yes</ca_verification>
  </active-response>

  <!-- Security Configuration Assessment -->
  <sca>
    <enabled>yes</enabled>
    <scan_on_start>yes</scan_on_start>
    <interval>12h</interval>
    <skip_nfs>yes</skip_nfs>
  </sca>

</ossec_config>
EOF

    # Replace placeholder with actual manager IP
    sed -i "s/MANAGER_IP_PLACEHOLDER/$MANAGER_IP/g" /var/ossec/etc/ossec.conf
}

# Enable and start service
start_agent() {
    print_status "Starting Wazuh Agent service..."
    systemctl daemon-reload
    systemctl enable wazuh-agent
    systemctl start wazuh-agent
    
    # Check service status
    if systemctl is-active --quiet wazuh-agent; then
        print_status "Wazuh Agent is running"
    else
        print_error "Failed to start Wazuh Agent"
        systemctl status wazuh-agent
        exit 1
    fi
}

# Main execution
main() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root"
        exit 1
    fi

    if [ -z "$MANAGER_IP" ]; then
        print_error "Usage: $0 <MANAGER_IP> [AGENT_NAME] [AGENT_GROUP] [WAZUH_VERSION]"
        exit 1
    fi

    print_status "Starting Wazuh Agent installation..."
    print_status "Manager IP: $MANAGER_IP"
    print_status "Agent Name: $AGENT_NAME"
    print_status "Agent Group: $AGENT_GROUP"
    print_status "Wazuh Version: $WAZUH_VERSION"

    install_repository
    install_agent
    configure_agent
    start_agent

    print_status "Installation completed successfully!"
    print_status "Checking agent status..."
    
    sleep 5
    /var/ossec/bin/agent_control -l
}

main "$@"
```

### Phase 3: Advanced Log Collection Configuration

#### Remote Syslog Collection Setup
```xml
<!-- /var/ossec/etc/ossec.conf - Manager Configuration -->
<ossec_config>
  <!-- Remote Syslog Reception -->
  <remote>
    <connection>syslog</connection>
    <port>514</port>
    <protocol>udp</protocol>
    <allowed-ips>192.168.0.0/16</allowed-ips>
    <allowed-ips>10.0.0.0/8</allowed-ips>
  </remote>

  <!-- Secure Syslog over TLS -->
  <remote>
    <connection>secure</connection>
    <port>1514</port>
    <protocol>tcp</protocol>
    <queue_size>131072</queue_size>
  </remote>

  <!-- Agent-less monitoring for network devices -->
  <agentless>
    <type>ssh_pixconfig_diff</type>
    <frequency>86400</frequency>
    <host>admin@192.168.1.1</host>
    <state>periodic_diff</state>
    <arguments>/usr/bin/ssh -i /var/ossec/.ssh/id_rsa</arguments>
  </agentless>

  <agentless>
    <type>ssh_generic_diff</type>
    <frequency>3600</frequency>
    <host>root@192.168.1.10</host>
    <state>periodic_diff</state>
    <arguments>cat /var/log/messages</arguments>
  </agentless>
</ossec_config>
```

#### PfSense Firewall Integration
```php
// PfSense Configuration for Wazuh Integration
// Navigate to Status -> System Logs -> Settings

// Remote Logging Configuration
$config['syslog']['remoteserver'] = '192.168.1.100';  // Wazuh Manager IP
$config['syslog']['remoteserver2'] = '192.168.1.101'; // Backup Wazuh Manager
$config['syslog']['remoteserver3'] = '';
$config['syslog']['sourceip'] = '';
$config['syslog']['ipproto'] = 'ipv4';
$config['syslog']['logall'] = true;
$config['syslog']['filter'] = true;
$config['syslog']['dhcp'] = true;
$config['syslog']['auth'] = true;
$config['syslog']['portalauth'] = true;
$config['syslog']['vpn'] = true;
$config['syslog']['dpinger'] = true;
$config['syslog']['hostapd'] = true;
$config['syslog']['system'] = true;
$config['syslog']['resolver'] = true;
$config['syslog']['ppp'] = true;
$config['syslog']['routing'] = true;
$config['syslog']['ntpd'] = true;

// Log Format Settings
$config['syslog']['format'] = 'rfc5424';  // Use RFC5424 format for better parsing
$config['syslog']['tcp'] = true;          // Use TCP for reliable delivery

// Apply Configuration
write_config("Configured remote syslog for Wazuh SIEM");
system_syslogd_start();
```

## Part 6: Correlation Rules and Detection Engineering

### Advanced Correlation Rule Development

#### Multi-Stage Attack Detection
```xml
<!-- Custom correlation rules for detecting multi-stage attacks -->
<group name="custom_correlation,attack_chain">

  <!-- Stage 1: Initial Reconnaissance -->
  <rule id="100001" level="7">
    <if_sid>5710</if_sid> <!-- Port scan detected -->
    <description>Possible reconnaissance: Port scanning detected</description>
    <group>reconnaissance,</group>
  </rule>

  <!-- Stage 2: Exploitation Attempt -->
  <rule id="100002" level="10">
    <if_sid>100001</if_sid>
    <if_matched_sid>31104</if_matched_sid> <!-- Web attack -->
    <same_source_ip />
    <description>Attack chain: Reconnaissance followed by exploitation attempt</description>
    <group>attack_chain,</group>
  </rule>

  <!-- Stage 3: Successful Compromise -->
  <rule id="100003" level="14">
    <if_sid>100002</if_sid>
    <if_matched_sid>5501</if_matched_sid> <!-- Login success -->
    <same_source_ip />
    <description>Critical: Successful attack chain - reconnaissance, exploitation, and access</description>
    <group>attack_chain,successful_compromise,</group>
  </rule>

  <!-- Lateral Movement Detection -->
  <rule id="100010" level="8">
    <if_sid>5402</if_sid> <!-- User account created -->
    <time>120</time>
    <if_matched_sid>5715</if_matched_sid> <!-- Multiple authentication failures -->
    <description>Possible lateral movement: Account creation after failed authentications</description>
    <group>lateral_movement,</group>
  </rule>

  <!-- Data Exfiltration Pattern -->
  <rule id="100020" level="12">
    <if_group>web_server</if_group>
    <regex>GET|POST</regex>
    <if_matched_regex>SELECT.*FROM.*WHERE</if_matched_regex>
    <frequency>10</frequency>
    <timeframe>60</timeframe>
    <description>Possible SQL injection with high frequency - potential data exfiltration</description>
    <group>sql_injection,data_exfiltration,</group>
  </rule>

  <!-- Privilege Escalation Detection -->
  <rule id="100030" level="10">
    <if_sid>5303</if_sid> <!-- su command -->
    <if_matched_sid>5402</if_matched_sid> <!-- User added to group -->
    <same_user />
    <time>300</time>
    <description>Privilege escalation detected: User elevated privileges after group modification</description>
    <group>privilege_escalation,</group>
  </rule>

  <!-- Ransomware Behavior Detection -->
  <rule id="100040" level="15">
    <if_group>syscheck</if_group>
    <match>modified|deleted</match>
    <frequency>100</frequency>
    <timeframe>60</timeframe>
    <description>Critical: Possible ransomware activity - mass file modification/deletion</description>
    <group>ransomware,critical,</group>
  </rule>

  <!-- Command and Control Communication -->
  <rule id="100050" level="11">
    <if_group>firewall</if_group>
    <match>outbound</match>
    <regex>port:(443|8443|8080|9090)</regex>
    <frequency>50</frequency>
    <timeframe>300</timeframe>
    <same_destination_ip />
    <description>Possible C2 communication: Regular outbound connections to same IP</description>
    <group>c2_communication,</group>
  </rule>

</group>
```

#### Machine Learning Enhanced Rules
```python
#!/usr/bin/env python3
# Custom Wazuh integration for ML-based anomaly detection

import json
import sys
import os
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='/var/ossec/logs/ml_integration.log'
)

class WazuhMLIntegration:
    def __init__(self):
        self.model_path = '/var/ossec/integrations/models/'
        self.data_path = '/var/ossec/integrations/data/'
        self.models = {}
        self.scalers = {}
        self.load_models()
    
    def load_models(self):
        """Load pre-trained ML models"""
        try:
            # Load anomaly detection model
            self.models['anomaly'] = joblib.load(
                os.path.join(self.model_path, 'anomaly_detection.pkl')
            )
            self.scalers['anomaly'] = joblib.load(
                os.path.join(self.model_path, 'anomaly_scaler.pkl')
            )
            
            # Load classification models
            self.models['threat_classifier'] = joblib.load(
                os.path.join(self.model_path, 'threat_classifier.pkl')
            )
            
            logging.info("ML models loaded successfully")
        except Exception as e:
            logging.error(f"Failed to load models: {str(e)}")
            # Initialize default models if loading fails
            self.initialize_default_models()
    
    def initialize_default_models(self):
        """Initialize default models if pre-trained models are not available"""
        self.models['anomaly'] = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.scalers['anomaly'] = StandardScaler()
        logging.info("Default models initialized")
    
    def extract_features(self, alert):
        """Extract numerical features from Wazuh alert"""
        features = []
        
        # Time-based features
        hour = datetime.fromisoformat(alert.get('timestamp', '')).hour
        day_of_week = datetime.fromisoformat(alert.get('timestamp', '')).weekday()
        
        features.extend([
            hour,
            day_of_week,
            alert.get('rule', {}).get('level', 0),
            len(alert.get('full_log', '')),
            alert.get('data', {}).get('srcport', 0),
            alert.get('data', {}).get('dstport', 0),
            self.ip_to_numeric(alert.get('data', {}).get('srcip', '0.0.0.0')),
            self.ip_to_numeric(alert.get('data', {}).get('dstip', '0.0.0.0')),
        ])
        
        return np.array(features).reshape(1, -1)
    
    def ip_to_numeric(self, ip):
        """Convert IP address to numeric value"""
        try:
            parts = ip.split('.')
            return sum(int(part) << (8 * (3 - i)) for i, part in enumerate(parts))
        except:
            return 0
    
    def detect_anomaly(self, alert):
        """Detect if the alert represents anomalous behavior"""
        try:
            features = self.extract_features(alert)
            scaled_features = self.scalers['anomaly'].transform(features)
            prediction = self.models['anomaly'].predict(scaled_features)
            
            # -1 indicates anomaly, 1 indicates normal
            is_anomaly = prediction[0] == -1
            
            if is_anomaly:
                self.generate_ml_alert(alert, "Anomaly detected by ML model")
            
            return is_anomaly
        except Exception as e:
            logging.error(f"Anomaly detection failed: {str(e)}")
            return False
    
    def classify_threat(self, alert):
        """Classify the type of threat"""
        try:
            features = self.extract_features(alert)
            threat_type = self.models['threat_classifier'].predict(features)[0]
            confidence = max(self.models['threat_classifier'].predict_proba(features)[0])
            
            threat_mapping = {
                0: "Benign",
                1: "Malware",
                2: "Exploitation",
                3: "Reconnaissance",
                4: "Lateral Movement",
                5: "Data Exfiltration"
            }
            
            return {
                'threat_type': threat_mapping.get(threat_type, "Unknown"),
                'confidence': confidence
            }
        except Exception as e:
            logging.error(f"Threat classification failed: {str(e)}")
            return {'threat_type': "Unknown", 'confidence': 0}
    
    def generate_ml_alert(self, original_alert, ml_description):
        """Generate a new alert based on ML detection"""
        ml_alert = {
            "integration": "ml_detection",
            "ml": {
                "description": ml_description,
                "original_rule_id": original_alert.get('rule', {}).get('id'),
                "original_rule_level": original_alert.get('rule', {}).get('level'),
                "threat_classification": self.classify_threat(original_alert),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # Send alert to Wazuh
        print(json.dumps(ml_alert))
        logging.info(f"ML alert generated: {ml_description}")
    
    def process_alert(self, alert_json):
        """Main processing function for incoming alerts"""
        try:
            alert = json.loads(alert_json)
            
            # Check if this is a high-value alert for ML processing
            if alert.get('rule', {}).get('level', 0) >= 7:
                # Perform anomaly detection
                is_anomaly = self.detect_anomaly(alert)
                
                # Classify threat type
                threat_info = self.classify_threat(alert)
                
                # Enhanced logging
                logging.info(f"Processed alert: Rule ID {alert.get('rule', {}).get('id')}, "
                           f"Anomaly: {is_anomaly}, Threat: {threat_info['threat_type']}")
                
                # Update alert with ML insights
                alert['ml_analysis'] = {
                    'is_anomaly': is_anomaly,
                    'threat_classification': threat_info
                }
                
                return alert
            
        except Exception as e:
            logging.error(f"Alert processing failed: {str(e)}")
            return None

def main():
    """Main execution function"""
    # Read alert from stdin (Wazuh integration format)
    alert_json = sys.stdin.read()
    
    # Initialize ML integration
    ml_integration = WazuhMLIntegration()
    
    # Process the alert
    enhanced_alert = ml_integration.process_alert(alert_json)
    
    if enhanced_alert:
        # Output enhanced alert
        print(json.dumps(enhanced_alert))

if __name__ == "__main__":
    main()
```

## Part 7: Performance Optimization and Scaling

### EPS Optimization Strategies

#### Buffer Configuration for High-Volume Environments
```xml
<!-- Agent-side buffering configuration -->
<ossec_config>
  <client_buffer>
    <disabled>no</disabled>
    <queue_size>10000</queue_size>
    <events_per_second>1000</events_per_second>
  </client_buffer>
</ossec_config>

<!-- Manager-side optimization -->
<ossec_config>
  <global>
    <logall>no</logall>
    <logall_json>yes</logall_json>
    <jsonout_output>yes</jsonout_output>
    <alerts_log>yes</alerts_log>
    <stats>4</stats>
    <memory_size>8192</memory_size>
    <max_output_size>65536</max_output_size>
  </global>

  <cluster>
    <name>wazuh-cluster</name>
    <node_name>master-node</node_name>
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
</ossec_config>
```

#### Indexer Performance Tuning
```yaml
# opensearch.yml - Performance optimized configuration
cluster.name: wazuh-cluster
node.name: wazuh-indexer-01
network.host: 0.0.0.0
discovery.seed_hosts:
  - 192.168.1.100
  - 192.168.1.101
  - 192.168.1.102
cluster.initial_master_nodes:
  - wazuh-indexer-01
  - wazuh-indexer-02
  - wazuh-indexer-03

# Memory settings
bootstrap.memory_lock: true

# Thread pools
thread_pool:
  write:
    size: 32
    queue_size: 1000
  search:
    size: 64
    queue_size: 1000

# Index settings
index:
  number_of_shards: 3
  number_of_replicas: 1
  refresh_interval: 30s
  translog:
    durability: async
    sync_interval: 30s
    flush_threshold_size: 1gb

# Cache settings
indices:
  memory:
    index_buffer_size: 30%
  queries:
    cache:
      size: 20%
  fielddata:
    cache:
      size: 30%

# Circuit breakers
indices.breaker:
  total:
    limit: 95%
  fielddata:
    limit: 40%
  request:
    limit: 40%

# Garbage collection
indices.memory.interval: 30s
indices.cache.cleanup_interval: 1m

# Bulk processing
http.max_content_length: 200mb
```

### Monitoring and Metrics Collection

#### Custom Monitoring Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Wazuh Performance Metrics",
    "panels": [
      {
        "id": "eps-monitor",
        "type": "line",
        "title": "Events Per Second Trend",
        "query": {
          "index": "wazuh-monitoring-*",
          "body": {
            "aggs": {
              "eps_over_time": {
                "date_histogram": {
                  "field": "@timestamp",
                  "interval": "1m"
                },
                "aggs": {
                  "eps": {
                    "sum": {
                      "field": "events_processed"
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        "id": "aps-monitor",
        "type": "gauge",
        "title": "Current Alert Rate",
        "query": {
          "index": "wazuh-alerts-*",
          "body": {
            "query": {
              "range": {
                "@timestamp": {
                  "gte": "now-1m"
                }
              }
            },
            "aggs": {
              "alerts_per_second": {
                "value_count": {
                  "field": "rule.id"
                }
              }
            }
          }
        }
      },
      {
        "id": "agent-status",
        "type": "pie",
        "title": "Agent Status Distribution",
        "query": {
          "index": "wazuh-monitoring-*",
          "body": {
            "aggs": {
              "agent_status": {
                "terms": {
                  "field": "agent.status",
                  "size": 10
                }
              }
            }
          }
        }
      },
      {
        "id": "top-rules",
        "type": "bar",
        "title": "Top Triggered Rules",
        "query": {
          "index": "wazuh-alerts-*",
          "body": {
            "aggs": {
              "top_rules": {
                "terms": {
                  "field": "rule.id",
                  "size": 20
                }
              }
            }
          }
        }
      }
    ]
  }
}
```

## Part 8: Compliance and Regulatory Reporting

### Automated Compliance Scanning

#### PCI-DSS Compliance Configuration
```xml
<!-- PCI-DSS specific monitoring rules -->
<group name="pci_dss">
  
  <!-- Requirement 2: Default passwords -->
  <rule id="200001" level="10">
    <decoded_as>sshd</decoded_as>
    <match>Accepted password for root</match>
    <description>PCI-DSS 2.1: Root login via password (should use keys)</description>
    <group>pci_dss_2.1,authentication_success,</group>
  </rule>

  <!-- Requirement 7: Restrict access -->
  <rule id="200002" level="8">
    <if_sid>5402</if_sid> <!-- User added -->
    <match>sudo|wheel|admin</match>
    <description>PCI-DSS 7.1: Administrative group modification</description>
    <group>pci_dss_7.1,</group>
  </rule>

  <!-- Requirement 8: Unique IDs -->
  <rule id="200003" level="7">
    <if_sid>5551</if_sid> <!-- User login -->
    <match>shared|generic|admin</match>
    <description>PCI-DSS 8.5: Generic account usage detected</description>
    <group>pci_dss_8.5,</group>
  </rule>

  <!-- Requirement 10: Track access -->
  <rule id="200004" level="5">
    <if_group>syscheck</if_group>
    <match>/var/log|audit</match>
    <description>PCI-DSS 10.5: Audit log modification detected</description>
    <group>pci_dss_10.5,</group>
  </rule>

  <!-- Requirement 11: Security testing -->
  <rule id="200005" level="8">
    <if_sid>5712</if_sid> <!-- Port scan -->
    <description>PCI-DSS 11.4: Intrusion detection - port scan</description>
    <group>pci_dss_11.4,</group>
  </rule>

</group>
```

#### GDPR Compliance Monitoring
```xml
<!-- GDPR specific monitoring rules -->
<group name="gdpr">
  
  <!-- Article 32: Security of processing -->
  <rule id="210001" level="10">
    <if_group>web</if_group>
    <regex>SELECT.*FROM.*(users|customers|personal)</regex>
    <description>GDPR Article 32: Bulk personal data access detected</description>
    <group>gdpr_32,data_access,</group>
  </rule>

  <!-- Article 33: Breach notification -->
  <rule id="210002" level="15">
    <if_sid>210001</if_sid>
    <frequency>100</frequency>
    <timeframe>3600</timeframe>
    <description>GDPR Article 33: Potential data breach - mass data access</description>
    <group>gdpr_33,data_breach,</group>
  </rule>

  <!-- Article 25: Data protection by design -->
  <rule id="210003" level="7">
    <if_group>syscheck</if_group>
    <match>encrypt|crypto|ssl|tls</match>
    <description>GDPR Article 25: Encryption configuration changed</description>
    <group>gdpr_25,configuration_changed,</group>
  </rule>

</group>
```

## Part 9: Advanced Integration Scenarios

### SOAR Platform Integration

#### Integration with Popular SOAR Platforms
```python
#!/usr/bin/env python3
# Wazuh to SOAR integration script

import json
import requests
import sys
import hashlib
import time
from datetime import datetime

class WazuhSOARConnector:
    def __init__(self, config_file='/var/ossec/integrations/soar_config.json'):
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        self.soar_platforms = {
            'phantom': self.send_to_phantom,
            'demisto': self.send_to_demisto,
            'resilient': self.send_to_resilient,
            'cortex': self.send_to_cortex
        }
    
    def process_alert(self, alert):
        """Process Wazuh alert and send to SOAR"""
        # Determine severity and routing
        severity = self.calculate_severity(alert)
        platform = self.determine_platform(alert, severity)
        
        # Create incident
        incident = self.create_incident(alert, severity)
        
        # Send to appropriate platform
        if platform in self.soar_platforms:
            self.soar_platforms[platform](incident)
    
    def calculate_severity(self, alert):
        """Calculate incident severity based on multiple factors"""
        base_level = alert.get('rule', {}).get('level', 0)
        
        # Severity multipliers
        multipliers = {
            'critical_asset': 2.0,
            'multiple_alerts': 1.5,
            'known_threat': 1.8,
            'business_hours': 1.3
        }
        
        final_severity = base_level
        
        # Check for critical assets
        if self.is_critical_asset(alert.get('agent', {}).get('name', '')):
            final_severity *= multipliers['critical_asset']
        
        # Check for alert frequency
        if self.check_alert_frequency(alert) > 10:
            final_severity *= multipliers['multiple_alerts']
        
        # Map to standard severity levels
        if final_severity >= 13:
            return 'critical'
        elif final_severity >= 10:
            return 'high'
        elif final_severity >= 7:
            return 'medium'
        else:
            return 'low'
    
    def create_incident(self, alert, severity):
        """Create standardized incident format"""
        return {
            'id': hashlib.md5(json.dumps(alert).encode()).hexdigest(),
            'title': alert.get('rule', {}).get('description', 'Wazuh Alert'),
            'description': self.generate_description(alert),
            'severity': severity,
            'type': self.determine_incident_type(alert),
            'source': 'Wazuh SIEM',
            'timestamp': alert.get('timestamp', datetime.now().isoformat()),
            'artifacts': self.extract_artifacts(alert),
            'raw_event': alert,
            'playbook_recommendation': self.recommend_playbook(alert)
        }
    
    def extract_artifacts(self, alert):
        """Extract IOCs and artifacts from alert"""
        artifacts = []
        
        # Extract IPs
        if 'srcip' in alert.get('data', {}):
            artifacts.append({
                'type': 'ip',
                'value': alert['data']['srcip'],
                'context': 'source_ip'
            })
        
        if 'dstip' in alert.get('data', {}):
            artifacts.append({
                'type': 'ip',
                'value': alert['data']['dstip'],
                'context': 'destination_ip'
            })
        
        # Extract files
        if 'syscheck' in alert:
            artifacts.append({
                'type': 'file',
                'value': alert['syscheck'].get('path', ''),
                'context': 'modified_file'
            })
        
        # Extract users
        if 'dstuser' in alert.get('data', {}):
            artifacts.append({
                'type': 'user',
                'value': alert['data']['dstuser'],
                'context': 'target_user'
            })
        
        return artifacts
    
    def recommend_playbook(self, alert):
        """Recommend appropriate playbook based on alert type"""
        playbook_mapping = {
            'authentication_failed': 'investigate_failed_login',
            'malware': 'malware_response',
            'intrusion': 'intrusion_investigation',
            'data_leak': 'data_exfiltration_response',
            'dos': 'ddos_mitigation',
            'web_attack': 'web_application_attack_response'
        }
        
        # Determine alert category
        groups = alert.get('rule', {}).get('groups', [])
        for group in groups:
            if group in playbook_mapping:
                return playbook_mapping[group]
        
        return 'generic_investigation'
    
    def send_to_phantom(self, incident):
        """Send incident to Splunk Phantom"""
        phantom_url = self.config['phantom']['url']
        api_key = self.config['phantom']['api_key']
        
        headers = {
            'ph-auth-token': api_key,
            'Content-Type': 'application/json'
        }
        
        container = {
            'name': incident['title'],
            'description': incident['description'],
            'severity': incident['severity'],
            'status': 'new',
            'label': 'wazuh',
            'tags': ['wazuh', 'automated'],
            'artifacts': incident['artifacts']
        }
        
        response = requests.post(
            f"{phantom_url}/rest/container",
            headers=headers,
            json=container,
            verify=False
        )
        
        if response.status_code == 200:
            container_id = response.json()['id']
            # Trigger playbook
            self.trigger_phantom_playbook(
                container_id,
                incident['playbook_recommendation']
            )
    
    def is_critical_asset(self, hostname):
        """Check if the host is a critical asset"""
        critical_assets = self.config.get('critical_assets', [])
        return hostname in critical_assets
    
    def check_alert_frequency(self, alert):
        """Check how many similar alerts occurred recently"""
        # This would typically query a database or cache
        # For demonstration, returning a static value
        return 5

# Main execution
if __name__ == "__main__":
    alert_json = sys.stdin.read()
    alert = json.loads(alert_json)
    
    connector = WazuhSOARConnector()
    connector.process_alert(alert)
```

## Part 10: Forensic Analysis and Incident Response

### Forensic Data Collection and Preservation

#### Evidence Collection Script
```bash
#!/bin/bash
# Wazuh Forensic Evidence Collection Script
# Triggered automatically for high-severity incidents

INCIDENT_ID=$1
AGENT_ID=$2
EVIDENCE_DIR="/var/ossec/forensics/${INCIDENT_ID}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create evidence directory
mkdir -p "${EVIDENCE_DIR}"

# Function to collect system information
collect_system_info() {
    echo "[+] Collecting system information..."
    
    # System info
    uname -a > "${EVIDENCE_DIR}/system_info.txt"
    hostname >> "${EVIDENCE_DIR}/system_info.txt"
    date >> "${EVIDENCE_DIR}/system_info.txt"
    
    # Running processes
    ps auxww > "${EVIDENCE_DIR}/processes_${TIMESTAMP}.txt"
    pstree -p > "${EVIDENCE_DIR}/process_tree_${TIMESTAMP}.txt"
    
    # Network connections
    netstat -tulpan > "${EVIDENCE_DIR}/network_connections_${TIMESTAMP}.txt"
    ss -tulpan > "${EVIDENCE_DIR}/socket_stats_${TIMESTAMP}.txt"
    
    # Open files
    lsof > "${EVIDENCE_DIR}/open_files_${TIMESTAMP}.txt"
    
    # Logged in users
    w > "${EVIDENCE_DIR}/logged_users_${TIMESTAMP}.txt"
    last -50 > "${EVIDENCE_DIR}/last_logins_${TIMESTAMP}.txt"
    
    # Memory information
    free -m > "${EVIDENCE_DIR}/memory_usage_${TIMESTAMP}.txt"
    cat /proc/meminfo > "${EVIDENCE_DIR}/memory_info_${TIMESTAMP}.txt"
}

# Function to collect logs
collect_logs() {
    echo "[+] Collecting log files..."
    
    # Create logs directory
    mkdir -p "${EVIDENCE_DIR}/logs"
    
    # System logs
    cp -r /var/log/* "${EVIDENCE_DIR}/logs/" 2>/dev/null
    
    # Wazuh logs
    cp -r /var/ossec/logs/* "${EVIDENCE_DIR}/logs/wazuh/" 2>/dev/null
    
    # Journal logs if systemd
    if command -v journalctl &> /dev/null; then
        journalctl --since "7 days ago" > "${EVIDENCE_DIR}/logs/journal_${TIMESTAMP}.log"
    fi
}

# Function to create memory dump
create_memory_dump() {
    echo "[+] Creating memory dump..."
    
    if command -v LiME &> /dev/null; then
        insmod /path/to/lime.ko "path=${EVIDENCE_DIR}/memory_${TIMESTAMP}.lime format=lime"
    else
        echo "[-] LiME not available for memory dump"
    fi
}

# Function to collect file system artifacts
collect_filesystem_artifacts() {
    echo "[+] Collecting filesystem artifacts..."
    
    # Timeline of file modifications
    find / -type f -mtime -7 -ls 2>/dev/null > "${EVIDENCE_DIR}/modified_files_7days_${TIMESTAMP}.txt"
    
    # Suspicious directories
    ls -la /tmp > "${EVIDENCE_DIR}/tmp_directory_${TIMESTAMP}.txt"
    ls -la /var/tmp > "${EVIDENCE_DIR}/var_tmp_directory_${TIMESTAMP}.txt"
    ls -la /dev/shm > "${EVIDENCE_DIR}/dev_shm_directory_${TIMESTAMP}.txt"
    
    # Cron jobs
    crontab -l > "${EVIDENCE_DIR}/user_crontab_${TIMESTAMP}.txt" 2>/dev/null
    ls -la /etc/cron* > "${EVIDENCE_DIR}/system_cron_${TIMESTAMP}.txt"
    
    # Startup items
    ls -la /etc/init.d/ > "${EVIDENCE_DIR}/init_scripts_${TIMESTAMP}.txt"
    systemctl list-unit-files > "${EVIDENCE_DIR}/systemd_units_${TIMESTAMP}.txt" 2>/dev/null
}

# Function to calculate hashes
calculate_hashes() {
    echo "[+] Calculating evidence hashes..."
    
    find "${EVIDENCE_DIR}" -type f -exec sha256sum {} \; > "${EVIDENCE_DIR}/evidence_hashes.txt"
}

# Function to create timeline
create_timeline() {
    echo "[+] Creating incident timeline..."
    
    # Get Wazuh alerts for the incident
    /var/ossec/bin/wazuh-logtest -q "agent.id:${AGENT_ID}" -t "24h" > "${EVIDENCE_DIR}/wazuh_timeline_${TIMESTAMP}.json"
}

# Main execution
main() {
    echo "========================================="
    echo "Wazuh Forensic Evidence Collection"
    echo "Incident ID: ${INCIDENT_ID}"
    echo "Agent ID: ${AGENT_ID}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "========================================="
    
    collect_system_info
    collect_logs
    collect_filesystem_artifacts
    create_timeline
    
    # Optional: Create memory dump (resource intensive)
    # create_memory_dump
    
    # Calculate hashes for chain of custody
    calculate_hashes
    
    # Create evidence package
    tar czf "${EVIDENCE_DIR}.tar.gz" "${EVIDENCE_DIR}"
    
    echo "[+] Evidence collection complete: ${EVIDENCE_DIR}.tar.gz"
    
    # Send notification
    echo "Forensic evidence collected for incident ${INCIDENT_ID}" | \
        mail -s "Wazuh Forensic Collection Complete" security@company.com
}

# Run with elevated privileges check
if [[ $EUID -ne 0 ]]; then
   echo "[-] This script must be run as root for complete evidence collection"
   exit 1
fi

main
```

## Part 11: Real-World Implementation Case Study

### Complete Enterprise Deployment Scenario

Let's walk through a real-world implementation for a medium-sized enterprise with:
- 500 endpoints (400 Windows, 100 Linux)
- 50 network devices
- 10 critical servers
- Multi-site architecture (3 locations)
- Compliance requirements: PCI-DSS, GDPR

#### Architecture Design
```yaml
# Complete Wazuh Enterprise Architecture
architecture:
  headquarters:
    wazuh_cluster:
      master:
        hostname: wazuh-master-hq
        ip: 10.0.1.10
        specs:
          cpu: 16
          ram: 32GB
          disk: 1TB SSD
      workers:
        - hostname: wazuh-worker-hq-01
          ip: 10.0.1.11
          specs:
            cpu: 8
            ram: 16GB
            disk: 500GB SSD
        - hostname: wazuh-worker-hq-02
          ip: 10.0.1.12
          specs:
            cpu: 8
            ram: 16GB
            disk: 500GB SSD
    
    indexer_cluster:
      nodes:
        - hostname: wazuh-indexer-hq-01
          ip: 10.0.1.20
          role: master-eligible
          specs:
            cpu: 8
            ram: 64GB
            disk: 2TB SSD
        - hostname: wazuh-indexer-hq-02
          ip: 10.0.1.21
          role: master-eligible
          specs:
            cpu: 8
            ram: 64GB
            disk: 2TB SSD
        - hostname: wazuh-indexer-hq-03
          ip: 10.0.1.22
          role: data
          specs:
            cpu: 8
            ram: 32GB
            disk: 4TB SSD
    
    dashboard:
      hostname: wazuh-dashboard-hq
      ip: 10.0.1.30
      specs:
        cpu: 4
        ram: 8GB
        disk: 100GB SSD
  
  branch_office_1:
    relay_server:
      hostname: wazuh-relay-br1
      ip: 10.1.1.10
      specs:
        cpu: 4
        ram: 8GB
        disk: 200GB SSD
      forwards_to: wazuh-master-hq
  
  branch_office_2:
    relay_server:
      hostname: wazuh-relay-br2
      ip: 10.2.1.10
      specs:
        cpu: 4
        ram: 8GB
        disk: 200GB SSD
      forwards_to: wazuh-master-hq

load_balancing:
  haproxy:
    vip: 10.0.1.100
    backend_servers:
      - wazuh-master-hq:1514
      - wazuh-worker-hq-01:1514
      - wazuh-worker-hq-02:1514
    algorithm: least_connections
    health_check: tcp-check

monitoring:
  metrics:
    prometheus:
      url: http://10.0.1.200:9090
    grafana:
      url: http://10.0.1.201:3000
  
  alerting:
    channels:
      - type: email
        recipients: ["soc@company.com"]
      - type: slack
        webhook: "https://hooks.slack.com/..."
      - type: pagerduty
        api_key: "..."

backup:
  strategy:
    indexer_snapshots:
      frequency: daily
      retention: 30_days
      location: s3://company-wazuh-backups/
    
    configuration_backup:
      frequency: hourly
      retention: 7_days
      location: /backup/configs/
    
    database_backup:
      frequency: daily
      retention: 90_days
      location: /backup/database/
```

#### Expected Performance Metrics
```
Performance Baseline:
├── Total EPS Capacity: 50,000
├── Peak EPS Observed: 35,000
├── Average EPS: 15,000
├── Alert Rate (APS): 5-10
├── Storage Growth: 500GB/month
├── Query Response Time: <2 seconds
├── Dashboard Load Time: <3 seconds
├── Agent Registration Time: <30 seconds
├── Alert Latency: <5 seconds
└── Index Retention: 180 days online, 2 years archive
```

## Part 12: Troubleshooting and Best Practices

### Common Issues and Solutions

#### High EPS Troubleshooting
```bash
#!/bin/bash
# Wazuh High EPS Diagnostic Script

echo "=== Wazuh High EPS Diagnostics ==="
echo "Timestamp: $(date)"
echo ""

# Check current EPS
echo "[1] Current EPS Rate:"
/var/ossec/bin/wazuh-control status | grep -E "Events|Messages"

# Check agent buffer status
echo ""
echo "[2] Agent Buffer Status:"
for agent in $(/var/ossec/bin/manage_agents -l | grep -E "ID: [0-9]+" | cut -d' ' -f2); do
    echo "Agent $agent:"
    /var/ossec/bin/agent_control -i $agent | grep -E "Client buffer|Events/second"
done

# Check system resources
echo ""
echo "[3] System Resources:"
echo "CPU Usage:"
top -bn1 | head -10
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Disk I/O:"
iostat -x 1 3

# Check Wazuh processes
echo ""
echo "[4] Wazuh Process Status:"
ps aux | grep wazuh | grep -v grep

# Check log processing delays
echo ""
echo "[5] Log Processing Queue:"
ls -la /var/ossec/queue/ossec/ | wc -l
echo "Files in queue: $(ls -la /var/ossec/queue/ossec/ | wc -l)"

# Recommendations
echo ""
echo "[6] Recommendations:"
CURRENT_EPS=$(tail -1000 /var/ossec/logs/ossec.log | grep -c "")
if [ $CURRENT_EPS -gt 10000 ]; then
    echo "- Consider adding more worker nodes"
    echo "- Increase agent buffer size"
    echo "- Implement log filtering at source"
    echo "- Review and optimize correlation rules"
fi
```

### Security Hardening Checklist

```yaml
wazuh_security_hardening:
  network_security:
    - enable_tls: true
      protocols: ["TLSv1.2", "TLSv1.3"]
      ciphers: "HIGH:!aNULL:!MD5:!3DES"
    
    - firewall_rules:
        - allow: "1514/tcp from 10.0.0.0/8"
        - allow: "1515/tcp from 10.0.0.0/8"
        - allow: "514/udp from 192.168.0.0/16"
        - allow: "9200/tcp from 10.0.1.0/24"
        - deny: "all"
    
    - network_segmentation:
        management_vlan: 100
        agent_vlan: 200
        indexer_vlan: 300
  
  authentication:
    - multi_factor: enabled
    - password_policy:
        min_length: 14
        complexity: true
        rotation: 90_days
    
    - certificate_management:
        ca_cert: "/etc/wazuh/ca.pem"
        server_cert: "/etc/wazuh/server.pem"
        key_rotation: annual
  
  access_control:
    - rbac_enabled: true
    - roles:
        - soc_analyst:
            permissions: ["read_alerts", "acknowledge"]
        - soc_admin:
            permissions: ["all"]
        - compliance_auditor:
            permissions: ["read_only", "export_reports"]
    
    - api_tokens:
        rotation: 30_days
        scope: minimal_required
  
  audit_logging:
    - wazuh_audit: enabled
    - system_audit: enabled
    - retention: 365_days
    - integrity_monitoring: enabled
  
  data_protection:
    - encryption_at_rest: true
      algorithm: "AES-256"
    
    - encryption_in_transit: true
      protocol: "TLS 1.3"
    
    - data_masking:
        pii_fields: ["ssn", "credit_card", "email"]
        masking_pattern: "XXX-XX-####"
```

## Conclusion: The Future of Log Management

As we stand at the threshold of 2025, the landscape of security monitoring continues to evolve at breakneck speed. Wazuh SIEM, with its comprehensive log management capabilities, represents not just a tool but a complete security ecosystem. From the granular control of EPS management to the sophisticated correlation rules that detect multi-stage attacks, from the seamless integration with SOAR platforms to the forensic-ready data collection – every aspect works in concert to create an impenetrable security posture.

The journey through this guide has taken us from the fundamental understanding of logs as digital DNA to the complex orchestration of enterprise-wide security monitoring. We've explored:

- The **mathematical precision** required in EPS and APS calculations
- The **architectural elegance** of distributed Wazuh deployments
- The **forensic rigor** needed for incident response
- The **automation possibilities** through SOAR integration
- The **compliance frameworks** that govern our security practices

But remember: **Technology is only as effective as the people who wield it**. The most sophisticated SIEM deployment will fail without proper training, continuous tuning, and a security-conscious culture.

### Key Takeaways for Implementation Success

1. **Start with clear objectives** – Know what you're protecting and why
2. **Size appropriately** – Under-provisioning leads to blind spots, over-provisioning wastes resources
3. **Implement gradually** – Rome wasn't built in a day, neither should your SIEM
4. **Tune continuously** – Your environment changes, your SIEM should adapt
5. **Automate intelligently** – Let machines handle the repetitive, humans handle the creative
6. **Document everything** – Your future self will thank you
7. **Test regularly** – A SIEM that isn't tested is a SIEM that will fail when needed most

### The Road Ahead

The future of SIEM and log management points toward:
- **AI-driven correlation** that learns from your environment
- **Quantum-resistant encryption** for future-proof security
- **Edge computing integration** for distributed log processing
- **Blockchain-based audit trails** for tamper-proof logging
- **Natural language querying** making security accessible to all

As cyber threats evolve, so must our defenses. Wazuh SIEM, with its open-source foundation and community-driven development, stands ready to meet these challenges head-on.

Whether you're securing a small business or a global enterprise, the principles remain the same: **Collect comprehensively, analyze intelligently, respond swiftly, and learn continuously**.

The logs are speaking. Are you listening?

---

*This guide represents the collective knowledge of the security community, distilled through real-world implementations and battle-tested configurations. May your logs be verbose, your alerts be accurate, and your incidents be few.*

**Remember**: In the world of cybersecurity, paranoia is not a disorder – it's a job requirement. Stay vigilant, stay curious, and most importantly, stay secure.

---

**About the Author**: Anubhav Gain is a DevSecOps Engineer and Technical Writer specializing in enterprise security implementations, with extensive experience in SIEM deployments, incident response, and security automation. Connect for more insights on building resilient security architectures.