---
author: Anubhav Gain
pubDatetime: 2025-01-28T02:10:00Z
title: "Wazuh Agent Logging Capabilities: Comprehensive Technical Analysis"
featured: false
draft: false
tags:
  - wazuh
  - siem
  - security
  - logging
  - monitoring
  - xdr
description: Wazuh agents provide enterprise-grade, multi-platform security monitoring with sophisticated log collection, parsing, and forwarding capabilities designed for XDR/OXDR platforms.
---

## Table of contents

## Overview

Wazuh agents provide enterprise-grade, multi-platform security monitoring with sophisticated log collection, parsing, and forwarding capabilities designed for XDR/OXDR platforms. This analysis reveals that Wazuh employs a modular architecture capable of processing 50,000+ events per second while maintaining minimal system overhead (35MB RAM average) and AES-256 encrypted communications. The platform's open-source nature, combined with extensive SIEM integration capabilities and MITRE ATT&CK framework alignment, positions it as a viable alternative to commercial endpoint detection solutions.

## Agent Architecture and Core Logging Framework

Wazuh implements a distributed, modular agent architecture where specialized daemons handle distinct security monitoring functions. The core logging subsystem centers around the wazuh-logcollector daemon, which operates through multiple collection engines supporting diverse log formats and sources across operating systems.

### Multi-platform Agent Components

The agent architecture employs five primary daemons working in coordination:

- **wazuh-agentd**: Main coordination daemon managing server communication and agent lifecycle
- **wazuh-logcollector**: Core log collection engine with multi-threaded processing capabilities
- **wazuh-syscheckd**: File Integrity Monitoring module using hash-based change detection
- **wazuh-modulesd**: Manager for specialized modules including syscollector and vulnerability detection
- **wazuh-execd**: Active response execution daemon for automated threat remediation

The logging subsystem source code structure reveals sophisticated engineering:

```
src/logcollector/
├── logcollector.c           # Core collection logic and main processing loop
├── read_syslog.c           # Syslog format parsing engine
├── read_audit.c            # Linux audit subsystem integration
├── read_win_event_channel.c # Windows Event Channel API wrapper
├── read_macos_log.c        # macOS unified logging system interface
└── state.c                 # File position tracking with JSON persistence
```

## Log Collection Engines and Parsing Framework

The wazuh-logcollector implements multiple specialized parsing engines optimized for different log formats and sources. Each engine handles specific data types while maintaining consistent internal message formatting.

### Multi-format Log Reading Capabilities:

- **Syslog Parser**: RFC3164/RFC5424 compliant with regex-based field extraction
- **Audit Log Parser**: Linux audit subsystem integration supporting multi-line events
- **Windows Event Channel**: Native Windows Event Log API integration via Event Channel API
- **JSON Parser**: Dynamic field extraction with configurable schema validation
- **Multi-line Support**: State-machine based parsing for complex log formats spanning multiple lines

### File Monitoring Infrastructure

File monitoring infrastructure provides robust change detection:

- **Position Tracking**: SHA1-based integrity verification with JSON state persistence in `queue/logcollector/file_status.json`
- **Rotation Handling**: Automatic detection and handling of log file rotation using inode tracking
- **Real-time Monitoring**: Linux inotify-based file change detection with sub-second responsiveness
- **Hash Verification**: Content integrity verification prevents duplicate event processing

## Operating System Specific Implementations

### Linux Integration and Audit Framework

Linux agents leverage native system logging infrastructure with deep integration into auditd and systemd logging frameworks. The implementation supports both traditional syslog and modern journald systems.

Core Linux log sources and configuration:

```xml
<ossec_config>
  <!-- Audit framework integration -->
  <localfile>
    <log_format>audit</log_format>
    <location>/var/log/audit/audit.log</location>
  </localfile>

  <!-- System authentication logs -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>

  <!-- Wildcard pattern matching -->
  <localfile>
    <location>/var/log/*.log</location>
    <log_format>syslog</log_format>
  </localfile>
</ossec_config>
```

Audit integration specifics include comprehensive system call monitoring:

- **Configuration**: `/etc/audit/audit.rules` for persistent audit rules with key-based event tagging
- **CDB Lists**: Audit key mappings in `/var/ossec/etc/lists/audit-keys` for efficient rule processing
- **Multi-line Processing**: Complex audit events spanning multiple log lines handled atomically

### Windows Event Channel Integration

Windows agents utilize Windows Event Channel API for native integration with Windows Event Logs, providing access to both traditional event logs and modern ETW (Event Tracing for Windows) channels.

Event channel configuration examples:

```xml
<ossec_config>
  <!-- Security event monitoring -->
  <localfile>
    <location>Security</location>
    <log_format>eventchannel</log_format>
    <query>Event[System/EventID = 4624 and (EventData/Data[@Name='LogonType'] = 2 or EventData/Data[@Name='LogonType'] = 10)]</query>
  </localfile>

  <!-- Sysmon integration -->
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- PowerShell operational logs -->
  <localfile>
    <location>Microsoft-Windows-PowerShell/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
</ossec_config>
```

Registry monitoring capabilities provide real-time change detection:

- **FIM Database**: `C:\Program Files (x86)\ossec-agent\queue\fim\db` stores file and registry state
- **Registry Paths**: Support for recursion levels and specific key monitoring
- **Environment Variables**: Dynamic path resolution using Windows environment variables (`%WINDIR%`, `%ProgramFiles%`)

### macOS Unified Logging System

macOS agents integrate with Apple's Unified Logging System (ULS) introduced in macOS 10.12, providing access to system-wide logging infrastructure with sophisticated filtering capabilities.

ULS integration configuration:

```xml
<localfile>
  <location>macos</location>
  <log_format>macos</log_format>
  <query type="trace,log,activity" level="info">
    (process == "sudo") or
    (process == "sshd") or
    (process == "securityd" and eventMessage contains "Session" and subsystem == "com.apple.securityd")
  </query>
</localfile>
```

Log level hierarchy enables granular filtering:

- **fault/error**: Always stored and displayed, highest priority security events
- **default**: Standard operational events stored on disk
- **info**: Memory-stored events, configurable for disk persistence
- **debug**: Development and troubleshooting information

## SIEM Integration Architecture and Protocols

### Agent-to-SIEM Data Flow and Communication

Wazuh implements a hub-and-spoke architecture where agents establish persistent TCP connections to a central server on port 1514. The communication protocol uses AES-256 encryption with MD5 integrity verification.

Message authentication and integrity process:

1. **Block Construction**: Random(5) + GlobalCounter(10) + LocalCounter(4) + Event
2. **Hash Generation**: MD5 checksum of entire message block
3. **Compression**: DEFLATE compression achieving 70-80% size reduction
4. **Encryption**: AES-256 with constant IV for consistency
5. **Transmission**: Size-prefixed TCP payload with agent identification

Protocol specifications:

- **Transport**: TCP preferred (reliable delivery), UDP alternative for high-throughput scenarios
- **Encryption**: AES-256 default, Blowfish fallback with 192-bit keys
- **Compression**: zlib DEFLATE algorithm with configurable compression levels
- **Queue Management**: Leaky bucket algorithm prevents event flooding with configurable thresholds

### SIEM Platform Integrations and Data Formats

Wazuh supports multiple output formats optimized for different SIEM platforms and use cases:

JSON alert structure for modern SIEM integration:

```json
{
  "timestamp": "2024-06-04T10:30:00.000Z",
  "rule": {
    "level": 12,
    "id": "5712",
    "description": "Multiple authentication failures",
    "groups": ["authentication_failed", "syslog", "sshd"],
    "mitre": {
      "id": "T1110",
      "technique": "Brute Force"
    }
  },
  "agent": {
    "id": "001",
    "name": "web-server-01",
    "ip": "192.168.1.100"
  },
  "data": {
    "srcip": "192.168.1.50",
    "dstuser": "admin",
    "program_name": "sshd"
  },
  "location": "/var/log/auth.log"
}
```

Syslog forwarding configuration for enterprise SIEM platforms:

```xml
<syslog_output>
  <server>qradar-console.company.com</server>
  <port>514</port>
  <format>cef</format>
  <level>5</level>
  <group>authentication_success,authentication_failed</group>
</syslog_output>
```

## Threat Detection and Correlation Engine

The XML-based rule engine implements sophisticated pattern matching with MITRE ATT&CK framework integration:

```xml
<group name="authentication,">
  <rule id="100002" level="10" frequency="5" timeframe="300">
    <if_matched_sid>100001</if_matched_sid>
    <same_source_ip />
    <description>Multiple authentication failures - Possible brute force attack</description>
    <mitre>
      <id>T1110</id>
    </mitre>
  </rule>
</group>
```

Detection capabilities span multiple security domains:

- **Intrusion Detection**: Network and host-based anomaly detection with baseline learning
- **Malware Detection**: File hash correlation with VirusTotal and threat intelligence feeds
- **Vulnerability Detection**: CVE database correlation with asset inventory
- **Compliance Monitoring**: PCI DSS, HIPAA, GDPR, NIST framework compliance checking

## Security Implementation and Defensive Architecture

### Encryption Standards and Secure Transmission

Wazuh implements defense-in-depth security with multiple layers of protection for data in transit and at rest:

Encryption implementation details:

- **AES Encryption**: 128-bit blocks with 256-bit keys using constant IV for message consistency
- **Key Management**: Agent-specific encryption keys derived from secure enrollment process
- **Integrity Verification**: MD5 checksums per message block with global/local counter anti-replay protection
- **TLS Support**: TLS 1.2 for API communications with planned TLS 1.3 upgrade

Agent enrollment and authentication:

1. TLS-secured registration on port 1515
2. Unique client key generation per agent
3. Key-based symmetric encryption for ongoing communication
4. Agent replacement policies with configurable security conditions

### Defense Evasion Detection Capabilities

Wazuh implements multiple evasion detection techniques designed to identify sophisticated attack methods:

Rootkit and stealth detection:

- **File System Integrity**: Real-time SHA1-based hash verification of critical system files
- **Process Anomaly Detection**: Behavioral analysis of process execution patterns
- **Network Traffic Analysis**: Suspicious connection pattern identification
- **Log Tampering Detection**: File modification monitoring with cryptographic verification

File Integrity Monitoring alert structure:

```json
{
  "syscheck": {
    "path": "/etc/passwd",
    "mode": "realtime",
    "size_before": "2847",
    "size_after": "2901",
    "md5_before": "8d5e957f297893487bd98fa830fa85a5",
    "md5_after": "76dc611340c5c71d53d059431cea64bb",
    "changed_attributes": ["size", "md5", "sha1"],
    "who_data": {
      "user_id": "1000",
      "user_name": "admin",
      "process_name": "/usr/bin/nano",
      "process_id": "12345"
    }
  }
}
```

## High Availability and Scalability Architecture

Cluster deployment patterns support enterprise-scale implementations:

- **Horizontal Scaling**: Master/worker node architecture with automatic load distribution
- **Geographic Distribution**: Multi-site deployments with local data processing
- **Cloud Elasticity**: Auto-scaling capabilities in cloud environments
- **Performance Characteristics**: 50,000+ EPS per server node with sub-second alert latency

## XDR Platform Integration and Automation

### Extended Detection and Response Capabilities

Wazuh's XDR architecture provides unified visibility across multiple security domains:

Multi-domain data sources:

- **Endpoints**: File system monitoring, process execution, network connections
- **Network**: Flow data analysis, DNS query logging, proxy traffic inspection
- **Cloud**: AWS CloudTrail, Azure AD, GCP audit logs with native API integration
- **Applications**: Database transaction logs, web server access logs, application-specific telemetry

SOAR integration capabilities:

```xml
<integration>
  <name>slack</name>
  <hook_url>https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK</hook_url>
  <alert_format>json</alert_format>
  <level>10</level>
</integration>

<integration>
  <name>pagerduty</name>
  <api_key>YOUR_PAGERDUTY_API_KEY</api_key>
  <level>12</level>
  <alert_format>json</alert_format>
</integration>
```

### Active Response and Automated Remediation

Active response framework enables automated threat mitigation:

```xml
<command>
  <name>firewall-drop</name>
  <executable>firewall-drop.sh</executable>
  <expect>srcip</expect>
  <timeout_allowed>yes</timeout_allowed>
</command>

<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <level>12</level>
  <timeout>600</timeout>
</active-response>
```

## Custom Decoder Development and Log Parsing

### Advanced Pattern Matching and Field Extraction

PCRE2 regex support enables sophisticated log parsing:

```xml
<decoder name="advanced-log">
  <parent>advanced-log</parent>
  <regex type="pcre2">(\w+).*:\s+(\w+)\s(?=on)on\s+(.*)from\s+(\S+)</regex>
  <order>program, action, destination, srcip</order>
</decoder>
```

JSON log decoder implementation:

```xml
<decoder name="json-app">
  <program_name>myapp</program_name>
</decoder>

<decoder name="json-app">
  <parent>json-app</parent>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
  <use_own_name>true</use_own_name>
</decoder>
```

### Log Normalization and Enrichment Pipeline

The log processing pipeline implements multiple enrichment stages:

1. **Pre-decoding**: Timestamp extraction, hostname identification, program name parsing
2. **Field Extraction**: Regex-based parsing with named capture groups
3. **Enrichment**: Addition of agent metadata, geolocation data, threat intelligence correlation
4. **Rule Matching**: Complex pattern matching with frequency analysis and correlation
5. **Alert Generation**: Structured alert creation with MITRE ATT&CK mapping

## Deployment Automation and Configuration Management

### Infrastructure as Code Examples

Ansible deployment playbook:

```yaml
- hosts: wazuh-agents
  become: yes
  vars:
    wazuh_managers:
      - address: 10.0.0.2
        port: 1514
        protocol: tcp
        max_retries: 5
    wazuh_agent_config:
      - type: os
        type_value: linux
        syscheck:
          directories:
            - dirs: /etc,/usr/bin,/usr/sbin
              checks: 'check_all="yes" realtime="yes"'
```

Docker container orchestration:

```yaml
services:
  wazuh.manager:
    image: wazuh/wazuh-manager:4.12.0
    environment:
      - SSL_CERTIFICATE_AUTHORITIES=/etc/ssl/root-ca.pem
      - SSL_CERTIFICATE=/etc/ssl/filebeat.pem
    volumes:
      - wazuh_etc:/var/ossec/etc
      - wazuh_logs:/var/ossec/logs
    ports:
      - "1514:1514"
      - "55000:55000"
    networks:
      - wazuh
```

## Conclusion

Wazuh agents provide enterprise-grade security monitoring with sophisticated multi-platform logging capabilities optimized for XDR/OXDR platform integration. The modular architecture, combined with extensive customization capabilities and strong security controls, makes it suitable for large-scale deployments requiring comprehensive endpoint visibility. Key strengths include native OS integration, flexible SIEM connectivity, and robust threat detection capabilities aligned with MITRE ATT&CK framework. Organizations implementing Wazuh should focus on proper capacity planning, rule tuning, and integration testing to maximize detection efficacy while minimizing false positives. The platform's open-source nature enables extensive customization but requires technical expertise for optimal deployment and maintenance in enterprise environments.
