---
author: Anubhav Gain
pubDatetime: 2025-06-28T14:00:00+05:30
modDatetime: 2025-06-28T14:00:00+05:30
title: Wazuh 4.12.0 + OpenSearch 2.19.2 + Filebeat Integration Guide
slug: wazuh-correlation-opensearch-implementation
featured: true
draft: false
tags:
  - wazuh
  - opensearch
  - filebeat
  - security
  - correlation
  - xdr
  - siem
  - monitoring
description: Complete setup guide for Wazuh with OpenSearch and Filebeat, implementing advanced alert correlation, custom dashboards, and real-time threat detection.
---

# Wazuh 4.12.0 + OpenSearch 2.19.2 + Filebeat Integration Guide

Complete Setup for Alert Correlation and Advanced Visualization

## Table of Contents

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wazuh Agent   │    │   Wazuh Agent   │    │   Wazuh Agent   │
│   (Endpoints)   │    │   (Endpoints)   │    │   (Endpoints)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Wazuh Manager         │
                    │       (4.12.0)           │
                    │  - Alert Processing       │
                    │  - Rule Engine            │
                    │  - Correlation Engine     │
                    └─────────────┬─────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │    Filebeat       │
                        │   (Official)      │
                        │ - Data Shipping   │
                        │ - SSL/TLS        │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    OpenSearch            │
                    │     (2.19.2)            │
                    │  - Data Storage          │
                    │  - Full-text Search      │
                    │  - Aggregations          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │ OpenSearch Dashboards    │
                    │     (2.19.2)            │
                    │  - Visualizations        │
                    │  - Custom Dashboards     │
                    │  - Real-time Monitoring  │
                    └───────────────────────────┘
```

## Prerequisites

### System Requirements

- OS: Ubuntu 20.04/22.04 LTS, CentOS 7/8, RHEL 7/8
- RAM: Minimum 8GB (16GB recommended for production)
- CPU: 4+ cores
- Disk: 100GB+ available space
- Network: All nodes should communicate on required ports

### Required Ports

| Service               | Port  | Protocol | Description            |
| --------------------- | ----- | -------- | ---------------------- |
| Wazuh Manager         | 1514  | TCP/UDP  | Agent communication    |
| Wazuh Manager         | 1515  | TCP      | Agent enrollment       |
| Wazuh API             | 55000 | TCP      | RESTful API            |
| OpenSearch            | 9200  | TCP      | REST API               |
| OpenSearch            | 9300  | TCP      | Transport (cluster)    |
| OpenSearch Dashboards | 5601  | TCP      | Web interface          |
| Filebeat              | -     | -        | Outbound to OpenSearch |

## Installation Steps

### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

# Set system limits for OpenSearch
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* soft memlock unlimited" | sudo tee -a /etc/security/limits.conf
echo "* hard memlock unlimited" | sudo tee -a /etc/security/limits.conf

# Configure kernel parameters
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Step 2: Install Java (Required for OpenSearch)

```bash
# Install OpenJDK 11
sudo apt install -y openjdk-11-jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' | sudo tee -a /etc/environment
source /etc/environment

# Verify installation
java -version
```

### Step 3: Install OpenSearch

```bash
# Add OpenSearch repository
curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | sudo gpg --dearmor --batch --yes -o /usr/share/keyrings/opensearch-keyring
echo "deb [signed-by=/usr/share/keyrings/opensearch-keyring] https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main" | sudo tee /etc/apt/sources.list.d/opensearch-2.x.list

# Update package list and install
sudo apt update
sudo apt install -y opensearch=2.19.2

# Configure OpenSearch
sudo cp opensearch.yml /etc/opensearch/opensearch.yml

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable opensearch
sudo systemctl start opensearch

# Verify installation
curl -X GET "localhost:9200" -u admin:admin --insecure
```

### Step 4: Install OpenSearch Dashboards

```bash
# Install OpenSearch Dashboards
sudo apt install -y opensearch-dashboards=2.19.2

# Configure OpenSearch Dashboards
sudo cp opensearch_dashboards.yml /etc/opensearch-dashboards/opensearch_dashboards.yml

# Enable and start service
sudo systemctl enable opensearch-dashboards
sudo systemctl start opensearch-dashboards

# Access web interface
# https://localhost:5601 (admin/admin)
```

### Step 5: Install Wazuh Manager

```bash
# Add Wazuh repository
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee -a /etc/apt/sources.list.d/wazuh.list

# Install Wazuh Manager
sudo apt update
sudo apt install -y wazuh-manager=4.12.0-*

# Enable and start service
sudo systemctl enable wazuh-manager
sudo systemctl start wazuh-manager

# Verify installation
sudo systemctl status wazuh-manager
```

### Step 6: Install and Configure Filebeat

```bash
# Add Elastic repository
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list

# Install Filebeat
sudo apt update
sudo apt install -y filebeat=7.10.2

# Download Wazuh Filebeat module
curl -s https://packages.wazuh.com/4.x/filebeat/wazuh-filebeat-0.2.tar.gz | sudo tar -xvz -C /usr/share/filebeat/module

# Configure Filebeat for OpenSearch
sudo cp filebeat_opensearch_config.yml /etc/filebeat/filebeat.yml

# Download Wazuh template for OpenSearch
sudo curl -so /etc/filebeat/wazuh-template.json https://raw.githubusercontent.com/wazuh/wazuh/v4.12.0/extensions/elasticsearch/7.x/wazuh-template.json

# Configure authentication
echo 'OPENSEARCH_USERNAME=admin' | sudo tee -a /etc/default/filebeat
echo 'OPENSEARCH_PASSWORD=admin' | sudo tee -a /etc/default/filebeat

# Enable and start Filebeat
sudo systemctl enable filebeat
sudo systemctl start filebeat

# Test Filebeat connection
sudo filebeat test output
```

## Configuration

### Wazuh Manager Configuration

Edit `/var/ossec/etc/ossec.conf`:

```xml
<ossec_config>
  <global>
    <jsonout_output>yes</jsonout_output>
    <alerts_log>yes</alerts_log>
    <logall>no</logall>
    <logall_json>no</logall_json>
  </global>

  <alerts>
    <log_alert_level>3</log_alert_level>
    <email_alert_level>12</email_alert_level>
  </alerts>

  <!-- Enable vulnerability detection -->
  <vulnerability-detection>
    <enabled>yes</enabled>
    <index-status>yes</index-status>
    <feed-update-interval>60m</feed-update-interval>
  </vulnerability-detection>

  <!-- Configure indexer connection -->
  <indexer>
    <enabled>yes</enabled>
    <hosts>
      <host>https://127.0.0.1:9200</host>
    </hosts>
    <ssl>
      <certificate_authorities>
        <ca>/etc/filebeat/certs/root-ca.pem</ca>
      </certificate_authorities>
      <certificate>/etc/filebeat/certs/filebeat.pem</certificate>
      <key>/etc/filebeat/certs/filebeat-key.pem</key>
    </ssl>
  </indexer>
</ossec_config>
```

### SSL Certificate Generation

```bash
# Create certificate directory
sudo mkdir -p /etc/filebeat/certs

# Generate certificates using the provided script
sudo ./generate_certificates.sh

# Set proper permissions
sudo chown -R root:root /etc/filebeat/certs
sudo chmod 600 /etc/filebeat/certs/*
```

## Alert Correlation Implementation

### Basic Correlation Rules

The correlation rules provide:

1. **Brute Force Detection**: Multiple failed login attempts
2. **Successful Compromise**: Login success after failed attempts
3. **Lateral Movement**: Network activity after successful login
4. **Privilege Escalation**: Critical file modifications
5. **Data Exfiltration**: Suspicious data transfer activities
6. **Multi-stage Attacks**: Advanced persistent threat detection

### Implementation Steps

```bash
# Copy correlation rules
sudo cp custom_correlation_rules.xml /var/ossec/etc/rules/local_rules.xml

# Set proper ownership
sudo chown root:ossec /var/ossec/etc/rules/local_rules.xml
sudo chmod 640 /var/ossec/etc/rules/local_rules.xml

# Restart Wazuh manager to load new rules
sudo systemctl restart wazuh-manager

# Verify rules are loaded
sudo /var/ossec/bin/ossec-logtest < test_log.txt
```

### Custom Correlation Example

Create advanced correlation for detecting credential stuffing:

```xml
<!-- Detect multiple failed logins from different IPs for same user -->
<rule id="100100" level="8" frequency="5" timeframe="600">
  <if_matched_sid>5710</if_matched_sid>
  <same_user />
  <description>Multiple failed login attempts for same user from different IPs</description>
  <group>credential_stuffing,authentication_failures</group>
  <mitre>
    <id>T1110.004</id>
  </mitre>
</rule>

<!-- Detect successful login after credential stuffing -->
<rule id="100101" level="12" timeframe="1800">
  <if_matched_sid>100100</if_matched_sid>
  <if_sid>5715</if_sid>
  <same_user />
  <description>Successful login after credential stuffing attempts</description>
  <group>credential_stuffing_success</group>
  <mitre>
    <id>T1110.004</id>
    <id>T1078</id>
  </mitre>
</rule>
```

## Dashboard Creation

### OpenSearch Index Pattern Setup

```bash
# Use the dashboard manager script
python3 dashboard_manager.py \
  --url https://localhost:9200 \
  --username admin \
  --password admin \
  --action create-pattern \
  --pattern-name "wazuh-alerts-*"
```

### Custom Visualizations

1. **Security Overview Dashboard**

   - Alert trends over time
   - Top attack sources
   - MITRE ATT&CK mapping
   - Agent status overview

2. **Correlation Analysis Dashboard**

   - Multi-stage attack timelines
   - User behavior analytics
   - Network traffic patterns
   - File integrity monitoring

3. **Compliance Dashboard**
   - PCI DSS compliance status
   - GDPR data protection events
   - HIPAA security incidents
   - NIST framework coverage

### Creating Custom Searches

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "range": {
            "rule.level": {
              "gte": 7
            }
          }
        },
        {
          "terms": {
            "rule.groups": ["attack", "authentication_failures"]
          }
        }
      ],
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "now-24h"
            }
          }
        }
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Filebeat Connection Issues

```bash
# Check Filebeat logs
sudo journalctl -u filebeat -f

# Test connection
sudo filebeat test output

# Common fixes:
# - Verify SSL certificates
# - Check OpenSearch credentials
# - Ensure proper file permissions
```

#### 2. OpenSearch Memory Issues

```bash
# Increase heap size in /etc/opensearch/jvm.options
-Xms4g
-Xmx4g

# Monitor memory usage
curl -X GET "localhost:9200/_nodes/stats/jvm?pretty" -u admin:admin --insecure
```

#### 3. Wazuh Rule Loading Issues

```bash
# Check rule syntax
sudo /var/ossec/bin/ossec-logtest

# Verify rule loading
sudo tail -f /var/ossec/logs/ossec.log

# Test specific rules
echo "test log message" | sudo /var/ossec/bin/ossec-logtest
```

#### 4. Dashboard Loading Issues

```bash
# Check OpenSearch Dashboards logs
sudo journalctl -u opensearch-dashboards -f

# Verify index patterns
curl -X GET "localhost:9200/_cat/indices/wazuh-*?v" -u admin:admin --insecure

# Clear browser cache and cookies
```

## Performance Optimization

### OpenSearch Optimization

```yaml
# /etc/opensearch/opensearch.yml
cluster.routing.allocation.disk.threshold.enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%

# Index settings
indices.fielddata.cache.size: 40%
indices.breaker.fielddata.limit: 60%
indices.breaker.request.limit: 40%
indices.breaker.total.limit: 70%
```

### Wazuh Manager Optimization

```xml
<!-- /var/ossec/etc/ossec.conf -->
<global>
  <max_agents>5000</max_agents>
  <white_list>127.0.0.1</white_list>
  <white_list>localhost</white_list>
</global>

<alerts>
  <log_alert_level>5</log_alert_level>
  <email_alert_level>12</email_alert_level>
</alerts>
```

### Filebeat Optimization

```yaml
# /etc/filebeat/filebeat.yml
queue.mem:
  events: 8192
  flush.min_events: 1024
  flush.timeout: 5s

output.elasticsearch:
  worker: 2
  bulk_max_size: 2048
  template.settings:
    index.refresh_interval: 10s
```

## Security Considerations

### SSL/TLS Configuration

Ensure all communications are encrypted:

1. Wazuh Manager ↔ Agents
2. Filebeat ↔ OpenSearch
3. OpenSearch ↔ OpenSearch Dashboards
4. Client ↔ OpenSearch Dashboards

### Access Control

```bash
# Create restricted user for Filebeat
curl -X POST "localhost:9200/_plugins/_security/api/internalusers/filebeat" \
  -u admin:admin --insecure \
  -H 'Content-Type: application/json' \
  -d '{
    "password": "SecurePassword123!",
    "roles": ["filebeat_writer"]
  }'
```

### Network Security

1. Configure firewall rules
2. Use VPNs for remote agents
3. Implement network segmentation
4. Monitor for suspicious network activity

## Monitoring and Maintenance

### Health Checks

```bash
#!/bin/bash
echo "=== Wazuh Manager Status ==="
sudo systemctl status wazuh-manager

echo "=== OpenSearch Status ==="
curl -X GET "localhost:9200/_cluster/health?pretty" -u admin:admin --insecure

echo "=== Filebeat Status ==="
sudo systemctl status filebeat

echo "=== Agent Status ==="
sudo /var/ossec/bin/agent_control -l
```

### Log Rotation

```bash
# Configure logrotate for Wazuh logs
sudo cat > /etc/logrotate.d/wazuh << EOF
/var/ossec/logs/alerts/alerts.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        /bin/kill -HUP `cat /var/ossec/var/run/ossec-logd*.pid 2> /dev/null` 2> /dev/null || true
    endscript
}
EOF
```

## Conclusion

This comprehensive setup provides:

- Real-time security monitoring
- Advanced threat correlation
- Rich visualization capabilities
- Scalable architecture
- Compliance reporting
- Performance optimization

For additional support, refer to:

- [Wazuh Documentation](https://documentation.wazuh.com)
- [OpenSearch Documentation](https://opensearch.org/docs)
- [Elastic Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)
