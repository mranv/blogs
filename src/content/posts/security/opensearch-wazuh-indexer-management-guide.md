---
author: Anubhav Gain
pubDatetime: 2024-04-24T18:30:00Z
modDatetime: 2025-01-05T10:00:00Z
title: OpenSearch/Wazuh Indexer Setup and Management Guide - 2025 Edition
slug: opensearch-wazuh-indexer-management-guide
featured: true
draft: false
tags:
  - security
  - wazuh
  - opensearch
  - indexer
  - monitoring
  - devops
  - SIEM
  - elastic-alternative
  - enterprise-security
category: SIEM
description: A comprehensive guide for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer, including installation, backup procedures, performance tuning, and enterprise health monitoring.
---

# OpenSearch/Wazuh Indexer Setup and Management Guide

This document provides instructions for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer. It covers installation, backup procedures, configuration paths, and basic health checks.

## System Overview

The setup consists of:

- OpenSearch 2.11.1+ (latest stable) serving as a Wazuh indexer
- Compatible with Wazuh 4.7.x and 4.8.x
- Single-node cluster configuration (with multi-node scaling options)
- Security plugin enabled with admin authentication

## Updated Installation Process (2025)

### Prerequisites

- **Hardware Requirements**:
  - Minimum: 8GB RAM, 4 CPU cores, 100GB SSD
  - Recommended: 16GB RAM, 8 CPU cores, 500GB NVMe SSD
  - Enterprise: 32GB+ RAM, 16+ CPU cores, 1TB+ NVMe SSD in RAID configuration

- **Software Requirements**:
  - Ubuntu 22.04 LTS or RHEL 8.x/9.x
  - Java 11 or 17 (OpenJDK recommended)
  - Python 3.8+ for management scripts

### Quick Installation Script

```bash
#!/bin/bash
# OpenSearch/Wazuh Indexer Quick Setup Script - 2025

# Set version variables
OPENSEARCH_VERSION="2.11.1"
WAZUH_VERSION="4.8.0"

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y curl wget unzip apt-transport-https ca-certificates gnupg lsb-release

# Install Java
sudo apt-get install -y openjdk-11-jdk

# Set JAVA_HOME
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64" | sudo tee -a /etc/environment
source /etc/environment

# Download and install OpenSearch
wget https://artifacts.opensearch.org/releases/bundle/opensearch/${OPENSEARCH_VERSION}/opensearch-${OPENSEARCH_VERSION}-linux-x64.tar.gz
tar -xzf opensearch-${OPENSEARCH_VERSION}-linux-x64.tar.gz
sudo mv opensearch-${OPENSEARCH_VERSION} /opt/opensearch

# Configure system limits
echo "opensearch soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "opensearch hard nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "opensearch soft memlock unlimited" | sudo tee -a /etc/security/limits.conf
echo "opensearch hard memlock unlimited" | sudo tee -a /etc/security/limits.conf

# Configure sysctl
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Create opensearch user
sudo useradd -m -s /bin/bash opensearch
sudo chown -R opensearch:opensearch /opt/opensearch

# Create necessary directories
sudo mkdir -p /var/log/opensearch
sudo mkdir -p /var/lib/opensearch
sudo chown -R opensearch:opensearch /var/log/opensearch
sudo chown -R opensearch:opensearch /var/lib/opensearch
```

## Directory Structure

The key directories and configuration files are:

```bash
/opt/opensearch/                 # Main installation directory
├── config/                      # Configuration files
│   ├── opensearch.yml          # Main configuration
│   ├── jvm.options             # JVM settings
│   ├── log4j2.properties       # Logging configuration
│   └── opensearch-security/    # Security plugin configs
├── logs/                       # Log files
├── data/                       # Index data
└── plugins/                    # Installed plugins

/etc/systemd/system/opensearch.service  # Systemd service file
/var/log/opensearch/            # Alternative log location
/var/lib/opensearch/            # Alternative data location
```

## Configuration

### 1. Basic OpenSearch Configuration

Edit `/opt/opensearch/config/opensearch.yml`:

```yaml
# Cluster Settings
cluster.name: wazuh-cluster
node.name: wazuh-node-1

# Network Settings
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery Settings (for single node)
discovery.type: single-node

# Path Settings
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# Memory Lock
bootstrap.memory_lock: true

# Security Settings
plugins.security.ssl.transport.pemcert_filepath: esnode.pem
plugins.security.ssl.transport.pemkey_filepath: esnode-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: esnode.pem
plugins.security.ssl.http.pemkey_filepath: esnode-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: root-ca.pem
plugins.security.allow_unsafe_democertificates: true
plugins.security.allow_default_init_securityindex: true
plugins.security.authcz.admin_dn:
  - CN=admin,OU=UNIT,O=ORG,L=CITY,ST=STATE,C=US
plugins.security.audit.type: internal_opensearch
plugins.security.enable_snapshot_restore_privilege: true
plugins.security.check_snapshot_restore_write_privileges: true
plugins.security.restapi.roles_enabled: ["all_access", "security_rest_api_access"]
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [".opendistro-*", ".opensearch-*", ".kibana*", ".wazuh*"]
```

### 2. JVM Configuration

Edit `/opt/opensearch/config/jvm.options`:

```bash
# Heap size (set to 50% of available RAM, max 32GB)
-Xms8g
-Xmx8g

# GC configuration
-XX:+UseG1GC
-XX:G1ReservePercent=25
-XX:InitiatingHeapOccupancyPercent=30

# GC logging
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-XX:+PrintTenuringDistribution
-XX:+PrintGCApplicationStoppedTime

# Error handling
-XX:+ExitOnOutOfMemoryError
```

### 3. Systemd Service Configuration

Create `/etc/systemd/system/opensearch.service`:

```ini
[Unit]
Description=OpenSearch
Documentation=https://opensearch.org/docs/
Wants=network-online.target
After=network-online.target

[Service]
Type=notify
RuntimeDirectory=opensearch
PrivateTmp=true
Environment=OPENSEARCH_HOME=/opt/opensearch
Environment=OPENSEARCH_PATH_CONF=/opt/opensearch/config
Environment=JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

WorkingDirectory=/opt/opensearch

User=opensearch
Group=opensearch

ExecStart=/opt/opensearch/bin/opensearch

StandardOutput=journal
StandardError=inherit

LimitNOFILE=65536
LimitNPROC=4096
LimitAS=infinity
LimitFSIZE=infinity
LimitMEMLOCK=infinity

TimeoutStopSec=0
KillSignal=SIGTERM
KillMode=process
SendSIGKILL=no
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable opensearch
sudo systemctl start opensearch
```

## Security Configuration

### 1. Generate SSL Certificates

```bash
#!/bin/bash
# Generate SSL certificates for OpenSearch

cd /opt/opensearch/config/

# Generate root CA
openssl genrsa -out root-ca-key.pem 2048
openssl req -new -x509 -sha256 -key root-ca-key.pem -out root-ca.pem -days 730 \
    -subj "/C=US/ST=STATE/L=CITY/O=ORG/OU=UNIT/CN=root"

# Generate admin cert
openssl genrsa -out admin-key-temp.pem 2048
openssl pkcs8 -inform PEM -outform PEM -in admin-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out admin-key.pem
openssl req -new -key admin-key.pem -out admin.csr \
    -subj "/C=US/ST=STATE/L=CITY/O=ORG/OU=UNIT/CN=admin"
openssl x509 -req -in admin.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out admin.pem -days 730

# Generate node cert
openssl genrsa -out esnode-key-temp.pem 2048
openssl pkcs8 -inform PEM -outform PEM -in esnode-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out esnode-key.pem
openssl req -new -key esnode-key.pem -out esnode.csr \
    -subj "/C=US/ST=STATE/L=CITY/O=ORG/OU=UNIT/CN=node1"
openssl x509 -req -in esnode.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out esnode.pem -days 730

# Clean up
rm admin-key-temp.pem esnode-key-temp.pem admin.csr esnode.csr

# Set permissions
chown opensearch:opensearch *.pem
chmod 600 *-key.pem
chmod 644 *.pem
```

### 2. Initialize Security

```bash
cd /opt/opensearch/plugins/opensearch-security/tools/
sudo -u opensearch ./securityadmin.sh -cd ../securityconfig/ -icl -nhnv \
    -cacert /opt/opensearch/config/root-ca.pem \
    -cert /opt/opensearch/config/admin.pem \
    -key /opt/opensearch/config/admin-key.pem
```

### 3. Create Wazuh User

```bash
# Generate password hash
WAZUH_PASSWORD="MySecurePassword123!"
HASH=$(sh /opt/opensearch/plugins/opensearch-security/tools/hash.sh -p "$WAZUH_PASSWORD")

# Create internal user
curl -XPUT https://localhost:9200/_plugins/_security/api/internalusers/wazuh \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "password": "'$WAZUH_PASSWORD'",
  "backend_roles": ["wazuh_admin"],
  "attributes": {
    "attribute1": "value1"
  }
}'

# Create role
curl -XPUT https://localhost:9200/_plugins/_security/api/roles/wazuh_admin \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "cluster_permissions": ["cluster_all"],
  "index_permissions": [{
    "index_patterns": ["wazuh-*", ".wazuh*"],
    "allowed_actions": ["indices_all"]
  }]
}'

# Map user to role
curl -XPUT https://localhost:9200/_plugins/_security/api/rolesmapping/wazuh_admin \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "backend_roles": ["wazuh_admin"],
  "users": ["wazuh"]
}'
```

## Performance Tuning

### 1. Index Settings

```bash
# Create index template for Wazuh indices
curl -XPUT https://localhost:9200/_index_template/wazuh-template \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "index_patterns": ["wazuh-alerts-*", "wazuh-archives-*"],
  "template": {
    "settings": {
      "index": {
        "number_of_shards": 3,
        "number_of_replicas": 0,
        "refresh_interval": "5s",
        "translog.durability": "async",
        "translog.sync_interval": "5s",
        "codec": "best_compression"
      }
    },
    "mappings": {
      "dynamic_templates": [{
        "strings_as_keywords": {
          "match_mapping_type": "string",
          "mapping": {
            "type": "keyword",
            "ignore_above": 1024
          }
        }
      }]
    }
  },
  "priority": 1
}'
```

### 2. Shard Allocation Settings

```bash
# Configure shard allocation
curl -XPUT https://localhost:9200/_cluster/settings \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "persistent": {
    "cluster.routing.allocation.disk.threshold_enabled": true,
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%",
    "indices.breaker.total.limit": "75%",
    "indices.breaker.request.limit": "60%",
    "indices.breaker.fielddata.limit": "40%"
  }
}'
```

## Monitoring and Health Checks

### 1. Cluster Health Script

Create `/opt/opensearch/scripts/health_check.sh`:

```bash
#!/bin/bash
# OpenSearch Health Check Script

OPENSEARCH_URL="https://localhost:9200"
AUTH="admin:admin"

echo "=== OpenSearch Cluster Health ==="
curl -s -k -u $AUTH "$OPENSEARCH_URL/_cluster/health?pretty"

echo -e "\n=== Node Statistics ==="
curl -s -k -u $AUTH "$OPENSEARCH_URL/_nodes/stats/os,jvm,indices?pretty" | \
    jq '.nodes[] | {
        name: .name,
        cpu_percent: .os.cpu.percent,
        memory_used_percent: .os.mem.used_percent,
        heap_used_percent: .jvm.mem.heap_used_percent,
        disk_used: .indices.store.size_in_bytes
    }'

echo -e "\n=== Index Statistics ==="
curl -s -k -u $AUTH "$OPENSEARCH_URL/_cat/indices?v&h=index,docs.count,store.size,health,status&s=index"

echo -e "\n=== Pending Tasks ==="
curl -s -k -u $AUTH "$OPENSEARCH_URL/_cluster/pending_tasks?pretty"

echo -e "\n=== Thread Pool Stats ==="
curl -s -k -u $AUTH "$OPENSEARCH_URL/_cat/thread_pool?v&h=name,active,queue,rejected"
```

### 2. Automated Monitoring

Create `/opt/opensearch/scripts/monitor.py`:

```python
#!/usr/bin/env python3
import requests
import json
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
import urllib3
urllib3.disable_warnings()

# Configuration
OPENSEARCH_URL = "https://localhost:9200"
AUTH = ("admin", "admin")
THRESHOLDS = {
    "heap_percent": 85,
    "disk_percent": 85,
    "cpu_percent": 90
}
ALERT_EMAIL = "admin@example.com"
SMTP_SERVER = "localhost"

def check_cluster_health():
    response = requests.get(
        f"{OPENSEARCH_URL}/_cluster/health",
        auth=AUTH,
        verify=False
    )
    health = response.json()
    
    alerts = []
    if health['status'] != 'green':
        alerts.append(f"Cluster status is {health['status']}")
    
    return alerts

def check_node_stats():
    response = requests.get(
        f"{OPENSEARCH_URL}/_nodes/stats",
        auth=AUTH,
        verify=False
    )
    stats = response.json()
    
    alerts = []
    for node_id, node in stats['nodes'].items():
        name = node['name']
        heap_percent = node['jvm']['mem']['heap_used_percent']
        
        if heap_percent > THRESHOLDS['heap_percent']:
            alerts.append(f"Node {name}: Heap usage is {heap_percent}%")
    
    return alerts

def send_alerts(alerts):
    if not alerts:
        return
    
    body = "OpenSearch Alerts:\n\n" + "\n".join(alerts)
    msg = MIMEText(body)
    msg['Subject'] = f"OpenSearch Alert - {datetime.now()}"
    msg['From'] = "opensearch@example.com"
    msg['To'] = ALERT_EMAIL
    
    with smtplib.SMTP(SMTP_SERVER) as s:
        s.send_message(msg)

if __name__ == "__main__":
    all_alerts = []
    all_alerts.extend(check_cluster_health())
    all_alerts.extend(check_node_stats())
    
    if all_alerts:
        print("Alerts found:")
        for alert in all_alerts:
            print(f"  - {alert}")
        send_alerts(all_alerts)
    else:
        print("All checks passed")
```

## Backup and Recovery

### 1. Snapshot Repository Setup

```bash
# Create snapshot repository
curl -XPUT https://localhost:9200/_snapshot/wazuh_backup \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "type": "fs",
  "settings": {
    "location": "/var/lib/opensearch/snapshots",
    "compress": true
  }
}'

# Create snapshot directory
sudo mkdir -p /var/lib/opensearch/snapshots
sudo chown opensearch:opensearch /var/lib/opensearch/snapshots
```

### 2. Automated Backup Script

Create `/opt/opensearch/scripts/backup.sh`:

```bash
#!/bin/bash
# OpenSearch Backup Script

OPENSEARCH_URL="https://localhost:9200"
AUTH="admin:admin"
REPO_NAME="wazuh_backup"
SNAPSHOT_NAME="snapshot_$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=7

echo "Creating snapshot: $SNAPSHOT_NAME"

# Create snapshot
curl -XPUT "$OPENSEARCH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?wait_for_completion=false" \
    -u $AUTH \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "indices": "wazuh-*",
  "ignore_unavailable": true,
  "include_global_state": false
}'

# Check snapshot status
sleep 5
while true; do
    STATUS=$(curl -s -k -u $AUTH "$OPENSEARCH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME" | \
        jq -r '.snapshots[0].state')
    
    if [ "$STATUS" = "SUCCESS" ]; then
        echo "Snapshot completed successfully"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "Snapshot failed!"
        exit 1
    else
        echo "Snapshot in progress..."
        sleep 10
    fi
done

# Clean up old snapshots
echo "Cleaning up old snapshots..."
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

curl -s -k -u $AUTH "$OPENSEARCH_URL/_snapshot/$REPO_NAME/_all" | \
    jq -r '.snapshots[].snapshot' | \
    while read snapshot; do
        SNAPSHOT_DATE=$(echo $snapshot | grep -oP 'snapshot_\K\d{8}')
        if [ "$SNAPSHOT_DATE" -lt "$CUTOFF_DATE" ]; then
            echo "Deleting old snapshot: $snapshot"
            curl -XDELETE "$OPENSEARCH_URL/_snapshot/$REPO_NAME/$snapshot" \
                -u $AUTH -k
        fi
    done
```

### 3. Restore Procedure

```bash
# List available snapshots
curl -s -k -u admin:admin \
    "https://localhost:9200/_snapshot/wazuh_backup/_all?pretty"

# Restore specific snapshot
curl -XPOST "https://localhost:9200/_snapshot/wazuh_backup/snapshot_20250105_120000/_restore" \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/json' \
    -d '{
  "indices": "wazuh-alerts-*",
  "ignore_unavailable": true,
  "include_global_state": false,
  "rename_pattern": "(.+)",
  "rename_replacement": "restored_$1"
}'
```

## Troubleshooting

### Common Issues and Solutions

1. **High Memory Usage**
```bash
# Check memory usage
curl -s -k -u admin:admin \
    "https://localhost:9200/_nodes/stats/jvm?pretty" | \
    jq '.nodes[].jvm.mem'

# Clear field data cache
curl -XPOST -k -u admin:admin \
    "https://localhost:9200/_cache/clear?fielddata=true"
```

2. **Slow Queries**
```bash
# Enable slow log
curl -XPUT "https://localhost:9200/wazuh-alerts-*/_settings" \
    -u admin:admin -k \
    -H 'Content-Type: application/json' \
    -d '{
  "index.search.slowlog.threshold.query.warn": "10s",
  "index.search.slowlog.threshold.query.info": "5s",
  "index.search.slowlog.threshold.query.debug": "2s",
  "index.search.slowlog.level": "info"
}'
```

3. **Disk Space Issues**
```bash
# Check disk usage
curl -s -k -u admin:admin \
    "https://localhost:9200/_cat/allocation?v&h=node,disk.used,disk.avail,disk.percent"

# Force merge old indices
curl -XPOST -k -u admin:admin \
    "https://localhost:9200/wazuh-alerts-4.x-2024.*/_forcemerge?max_num_segments=1"
```

### Log Locations

- OpenSearch logs: `/var/log/opensearch/wazuh-cluster.log`
- GC logs: `/var/log/opensearch/gc.log`
- Slow logs: `/var/log/opensearch/wazuh-cluster_index_search_slowlog.log`

## Integration with Wazuh

### Configure Wazuh Manager

Edit `/var/ossec/etc/ossec.conf`:

```xml
<ossec_config>
  <indexer>
    <enabled>yes</enabled>
    <hosts>
      <host>https://your-opensearch-host:9200</host>
    </hosts>
    <username>wazuh</username>
    <password>MySecurePassword123!</password>
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

### Configure Filebeat

Edit `/etc/filebeat/filebeat.yml`:

```yaml
output.elasticsearch:
  hosts: ["https://your-opensearch-host:9200"]
  protocol: "https"
  username: "wazuh"
  password: "MySecurePassword123!"
  ssl.certificate_authorities: ["/etc/filebeat/certs/root-ca.pem"]
  ssl.certificate: "/etc/filebeat/certs/filebeat.pem"
  ssl.key: "/etc/filebeat/certs/filebeat-key.pem"
  ssl.verification_mode: "none"
```

## Maintenance Tasks

### Daily Tasks
- Monitor cluster health and disk usage
- Check for failed shards
- Review slow query logs

### Weekly Tasks
- Analyze index patterns and optimize mappings
- Review and update index lifecycle policies
- Check backup success rate

### Monthly Tasks
- Update OpenSearch and plugins
- Review and optimize JVM settings
- Audit user permissions and access logs
- Performance benchmarking

## Conclusion

This guide provides a comprehensive approach to deploying and managing OpenSearch as a Wazuh indexer. Regular monitoring, proper backup procedures, and performance optimization are key to maintaining a healthy and efficient SIEM infrastructure.

For more information, refer to:
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [Wazuh Documentation](https://documentation.wazuh.com/)
- [OpenSearch Security Plugin](https://opensearch.org/docs/latest/security-plugin/index/)