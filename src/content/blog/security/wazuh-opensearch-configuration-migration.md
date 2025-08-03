---
author: Anubhav Gain
pubDatetime: 2025-01-28T17:30:00+05:30
modDatetime: 2025-01-28T17:30:00+05:30
title: Wazuh to OpenSearch Configuration Migration - Complete Guide
slug: wazuh-opensearch-configuration-migration
featured: false
draft: false
tags:
  - wazuh
  - opensearch
  - migration
  - configuration
  - security
  - siem
  - elasticsearch
  - monitoring
description: Step-by-step guide for migrating Wazuh configuration from Elasticsearch to OpenSearch, including indexer settings, dashboard migration, and performance optimization
---

# Wazuh to OpenSearch Configuration Migration: Complete Guide

This comprehensive guide walks through the process of migrating Wazuh from Elasticsearch to OpenSearch, covering configuration changes, data migration, dashboard setup, and performance optimization. With the shift towards OpenSearch as the preferred indexer for Wazuh, this migration ensures continued support and enhanced features.

## Overview

Wazuh 4.3+ officially supports OpenSearch as its primary indexer, moving away from the Open Distro for Elasticsearch. This migration involves:

- Updating Wazuh manager configuration
- Migrating existing indices and data
- Reconfiguring Wazuh dashboard
- Updating API and integration settings
- Performance tuning for OpenSearch

## Prerequisites

### System Requirements

1. **Wazuh Components**:
   - Wazuh Manager 4.3+
   - Wazuh Dashboard 4.3+
   - Wazuh Indexer (OpenSearch) 2.x

2. **Current Environment**:
   - Running Elasticsearch cluster (6.x, 7.x, or Open Distro)
   - Sufficient storage for data migration
   - Backup of all configurations

3. **Target Environment**:
   - OpenSearch 2.x cluster
   - Compatible hardware specifications
   - Network connectivity between components

## Migration Planning

### Pre-Migration Checklist

```bash
#!/bin/bash
# Pre-migration verification script

echo "=== Wazuh Migration Pre-Check ==="

# Check current versions
echo "Current Wazuh version:"
/var/ossec/bin/wazuh-control info | grep "Version"

# Check Elasticsearch version
echo "Current Elasticsearch version:"
curl -s localhost:9200 | jq '.version.number'

# Check index sizes
echo "Current index sizes:"
curl -s localhost:9200/_cat/indices/wazuh-* | awk '{print $3, $9}'

# Check disk space
echo "Available disk space:"
df -h /var/lib/elasticsearch

# Backup current configuration
echo "Creating configuration backup..."
mkdir -p /backup/wazuh-migration/$(date +%Y%m%d)
cp -r /etc/elasticsearch /backup/wazuh-migration/$(date +%Y%m%d)/
cp -r /etc/wazuh-indexer /backup/wazuh-migration/$(date +%Y%m%d)/ 2>/dev/null || true
cp -r /usr/share/wazuh-dashboard/data/wazuh/config /backup/wazuh-migration/$(date +%Y%m%d)/
```

## Step 1: Install OpenSearch

### OpenSearch Installation

```bash
# Add OpenSearch repository
curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | sudo gpg --dearmor --batch --yes -o /usr/share/keyrings/opensearch-keyring
echo "deb [signed-by=/usr/share/keyrings/opensearch-keyring] https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main" | sudo tee /etc/apt/sources.list.d/opensearch-2.x.list

# Install OpenSearch
sudo apt-get update
sudo apt-get install opensearch=2.11.1

# Initial configuration
sudo nano /etc/opensearch/opensearch.yml
```

### OpenSearch Configuration

Create `/etc/opensearch/opensearch.yml`:

```yaml
# OpenSearch Configuration for Wazuh
cluster.name: wazuh-cluster
node.name: opensearch-node1
network.host: 0.0.0.0
http.port: 9200
discovery.seed_hosts: ["127.0.0.1"]
cluster.initial_master_nodes: ["opensearch-node1"]

# Security settings
plugins.security.disabled: false
plugins.security.ssl.transport.pemcert_filepath: /etc/opensearch/certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: /etc/opensearch/certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: /etc/opensearch/certs/ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: /etc/opensearch/certs/node.pem
plugins.security.ssl.http.pemkey_filepath: /etc/opensearch/certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: /etc/opensearch/certs/ca.pem

# Wazuh-specific settings
compatibility.override_main_response_version: true
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# Performance settings
bootstrap.memory_lock: true
indices.query.bool.max_clause_count: 2000

# Cluster settings
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
cluster.routing.allocation.disk.watermark.flood_stage: 95%
```

### JVM Configuration

Update `/etc/opensearch/jvm.options`:

```bash
# JVM heap size (50% of available RAM, max 32GB)
-Xms16g
-Xmx16g

# GC configuration
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:InitiatingHeapOccupancyPercent=70

# GC logging
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-XX:+PrintTenuringDistribution
-XX:+PrintGCApplicationStoppedTime
-Xloggc:/var/log/opensearch/gc.log
-XX:+UseGCLogFileRotation
-XX:NumberOfGCLogFiles=32
-XX:GCLogFileSize=64m
```

## Step 2: Data Migration

### Export Data from Elasticsearch

```bash
#!/bin/bash
# Export Wazuh indices from Elasticsearch

# Install elasticsearch-dump if not present
npm install -g elasticsearch-dump

# Create export directory
mkdir -p /backup/wazuh-indices
cd /backup/wazuh-indices

# Export all Wazuh indices
for index in $(curl -s localhost:9200/_cat/indices | grep wazuh | awk '{print $3}'); do
    echo "Exporting $index..."

    # Export mappings
    elasticdump \
        --input=http://localhost:9200/$index \
        --output=$index-mapping.json \
        --type=mapping

    # Export data
    elasticdump \
        --input=http://localhost:9200/$index \
        --output=$index-data.json \
        --type=data \
        --limit=1000
done

# Export templates
elasticdump \
    --input=http://localhost:9200 \
    --output=templates.json \
    --type=template

# Export aliases
elasticdump \
    --input=http://localhost:9200 \
    --output=aliases.json \
    --type=alias
```

### Import Data to OpenSearch

```bash
#!/bin/bash
# Import Wazuh indices to OpenSearch

cd /backup/wazuh-indices

# Update templates for OpenSearch compatibility
echo "Updating templates for OpenSearch..."
sed -i 's/"type": "keyword"/"type": "keyword"/g' templates.json
sed -i 's/"type": "text"/"type": "text"/g' templates.json

# Import templates first
elasticdump \
    --input=templates.json \
    --output=https://admin:admin@localhost:9200 \
    --type=template \
    --headers='Content-Type: application/json'

# Import indices
for mapping_file in *-mapping.json; do
    index_name=${mapping_file%-mapping.json}
    echo "Importing $index_name..."

    # Import mapping
    elasticdump \
        --input=$mapping_file \
        --output=https://admin:admin@localhost:9200/$index_name \
        --type=mapping \
        --headers='Content-Type: application/json'

    # Import data
    elasticdump \
        --input=${index_name}-data.json \
        --output=https://admin:admin@localhost:9200/$index_name \
        --type=data \
        --limit=1000 \
        --headers='Content-Type: application/json'
done

# Import aliases
elasticdump \
    --input=aliases.json \
    --output=https://admin:admin@localhost:9200 \
    --type=alias \
    --headers='Content-Type: application/json'
```

## Step 3: Update Wazuh Manager Configuration

### Filebeat Configuration

Update `/etc/filebeat/filebeat.yml`:

```yaml
# Wazuh - Filebeat configuration for OpenSearch
filebeat.inputs:
  - type: log
    paths:
      - "/var/ossec/logs/alerts/alerts.json"
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: "message"

processors:
  - decode_json_fields:
      fields: ["data"]
      target: ""
      overwrite_keys: true
  - drop_fields:
      fields: ["beat", "input_type", "offset", "log", "host.name"]
      ignore_missing: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  protocol: "https"
  username: "admin"
  password: "admin"
  ssl.verification_mode: "none"
  index: "wazuh-alerts-4.x-%{+yyyy.MM.dd}"
  template.name: "wazuh"
  template.pattern: "wazuh-*"
  template.settings:
    index.number_of_shards: 1
    index.number_of_replicas: 0
    index.refresh_interval: "5s"
    index.query.default_field: "*"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0640
```

### Wazuh API Configuration

Update `/var/ossec/api/configuration/api.yaml`:

```yaml
# Wazuh API configuration for OpenSearch
indexer:
  host: "https://localhost:9200"
  username: "wazuh_api"
  password: "${WAZUH_API_PASSWORD}"
  verify_ssl: false

logging:
  level: "info"
  path: "/var/ossec/logs/api.log"

auth:
  max_login_attempts: 5
  block_time: 300
  max_request_per_minute: 300

cache:
  enabled: true
  time: 0.75

upload:
  limits:
    eps:
      allow: true
      size: 1048576
```

## Step 4: Wazuh Dashboard Migration

### Install Wazuh Dashboard for OpenSearch

```bash
# Remove old Kibana-based dashboard
sudo systemctl stop wazuh-dashboard
sudo apt-get remove wazuh-dashboard

# Install new OpenSearch Dashboards-based Wazuh Dashboard
sudo apt-get install wazuh-dashboard

# Configure dashboard
sudo nano /etc/wazuh-dashboard/opensearch_dashboards.yml
```

### Dashboard Configuration

```yaml
# /etc/wazuh-dashboard/opensearch_dashboards.yml
server.port: 5601
server.host: "0.0.0.0"
server.name: "wazuh-dashboard"

opensearch.hosts: ["https://localhost:9200"]
opensearch.username: "kibanaserver"
opensearch.password: "${DASHBOARD_PASSWORD}"
opensearch.ssl.verificationMode: "none"

# Wazuh plugin configuration
wazuh.api.url: "https://localhost:55000"
wazuh.api.port: 55000
wazuh.api.username: "wazuh"
wazuh.api.password: "${WAZUH_API_PASSWORD}"

# Security settings
opensearch_security.multitenancy.enabled: false
opensearch_security.readonly_mode.roles: ["kibana_read_only"]
server.ssl.enabled: true
server.ssl.certificate: /etc/wazuh-dashboard/certs/dashboard.crt
server.ssl.key: /etc/wazuh-dashboard/certs/dashboard.key

# Logging
logging.dest: /var/log/wazuh-dashboard/dashboard.log
logging.silent: false
logging.quiet: false
logging.verbose: false
```

### Import Saved Objects

```bash
#!/bin/bash
# Import Wazuh dashboards and visualizations

# Export from old Kibana (if needed)
curl -X POST "localhost:5601/api/saved_objects/_export" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "type": ["dashboard", "visualization", "search", "index-pattern"],
    "includeReferencesDeep": true
  }' > wazuh-saved-objects.ndjson

# Import to new dashboard
curl -X POST "localhost:5601/api/saved_objects/_import" \
  -H "Content-Type: multipart/form-data" \
  -H "kbn-xsrf: true" \
  -F file=@wazuh-saved-objects.ndjson
```

## Step 5: Index Management

### Index Lifecycle Management

Create `/etc/opensearch/index-lifecycle-policy.json`:

```json
{
  "policy": {
    "description": "Wazuh index lifecycle policy",
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [
          {
            "rollover": {
              "min_size": "50gb",
              "min_index_age": "1d"
            }
          }
        ],
        "transitions": [
          {
            "state_name": "warm",
            "conditions": {
              "min_index_age": "7d"
            }
          }
        ]
      },
      {
        "name": "warm",
        "actions": [
          {
            "replica_count": {
              "number_of_replicas": 0
            }
          },
          {
            "shrink": {
              "number_of_shards": 1
            }
          },
          {
            "force_merge": {
              "max_num_segments": 1
            }
          }
        ],
        "transitions": [
          {
            "state_name": "cold",
            "conditions": {
              "min_index_age": "30d"
            }
          }
        ]
      },
      {
        "name": "cold",
        "actions": [
          {
            "read_only": {}
          },
          {
            "allocation": {
              "include": {
                "node_type": "cold"
              }
            }
          }
        ],
        "transitions": [
          {
            "state_name": "delete",
            "conditions": {
              "min_index_age": "90d"
            }
          }
        ]
      },
      {
        "name": "delete",
        "actions": [
          {
            "delete": {}
          }
        ]
      }
    ]
  }
}
```

Apply the policy:

```bash
# Create ISM policy
curl -X PUT "https://localhost:9200/_plugins/_ism/policies/wazuh-policy" \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d @/etc/opensearch/index-lifecycle-policy.json

# Apply policy to indices
curl -X PUT "https://localhost:9200/wazuh-alerts-*/_settings" \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d '{
    "index": {
      "plugins.index_state_management.policy_id": "wazuh-policy"
    }
  }'
```

### Index Templates

Create `/etc/opensearch/wazuh-template.json`:

```json
{
  "index_patterns": ["wazuh-alerts-4.x-*", "wazuh-archives-4.x-*"],
  "priority": 1,
  "template": {
    "settings": {
      "index": {
        "number_of_shards": "1",
        "number_of_replicas": "0",
        "refresh_interval": "5s",
        "query.default_field": [
          "rule.description",
          "agent.name",
          "agent.ip",
          "data.aws.source_ip_address",
          "data.url"
        ],
        "plugins.index_state_management.policy_id": "wazuh-policy",
        "plugins.index_state_management.rollover_alias": "wazuh-alerts"
      }
    },
    "mappings": {
      "dynamic": true,
      "dynamic_templates": [
        {
          "string_as_keyword": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword",
              "ignore_above": 1024
            }
          }
        }
      ],
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "agent": {
          "properties": {
            "id": { "type": "keyword" },
            "name": { "type": "keyword" },
            "ip": { "type": "ip" }
          }
        },
        "rule": {
          "properties": {
            "level": { "type": "integer" },
            "id": { "type": "keyword" },
            "description": { "type": "text" }
          }
        }
      }
    }
  }
}
```

## Step 6: Security Configuration

### Configure OpenSearch Security

```bash
#!/bin/bash
# Security configuration script

# Generate certificates
cd /etc/opensearch
./tools/generate-certificates.sh

# Configure internal users
cat > /etc/opensearch/internal_users.yml << EOF
_meta:
  type: "internalusers"
  config_version: 2

admin:
  hash: "$2y$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  reserved: true
  backend_roles:
  - "admin"
  description: "Admin user"

kibanaserver:
  hash: "$2y$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  reserved: true
  description: "OpenSearch Dashboards user"

wazuh_api:
  hash: "$2y$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  reserved: false
  backend_roles:
  - "wazuh_api"
  description: "Wazuh API user"
EOF

# Configure roles
cat > /etc/opensearch/roles.yml << EOF
_meta:
  type: "roles"
  config_version: 2

wazuh_api:
  cluster_permissions:
    - "cluster:monitor/main"
    - "indices:admin/template/get"
    - "indices:admin/template/put"
    - "cluster:admin/ingest/pipeline/get"
    - "cluster:admin/ingest/pipeline/put"
  index_permissions:
    - index_patterns:
        - "wazuh-*"
      allowed_actions:
        - "crud"
        - "create_index"
        - "manage"
EOF

# Configure role mappings
cat > /etc/opensearch/roles_mapping.yml << EOF
_meta:
  type: "rolesmapping"
  config_version: 2

all_access:
  reserved: false
  backend_roles:
  - "admin"
  description: "Maps admin to all_access"

wazuh_api:
  reserved: false
  users:
  - "wazuh_api"
  description: "Maps wazuh_api user to wazuh_api role"
EOF

# Apply security configuration
cd /usr/share/opensearch/plugins/opensearch-security/tools
./securityadmin.sh -cd /etc/opensearch -icl -nhnv \
  -cacert /etc/opensearch/certs/ca.pem \
  -cert /etc/opensearch/certs/admin.pem \
  -key /etc/opensearch/certs/admin-key.pem
```

## Step 7: Performance Optimization

### OpenSearch Performance Tuning

```bash
# System settings for OpenSearch
cat > /etc/sysctl.d/opensearch.conf << EOF
# Virtual memory
vm.max_map_count=262144
vm.swappiness=1

# Network
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535

# File descriptors
fs.file-max=131072
EOF

# Apply settings
sysctl -p /etc/sysctl.d/opensearch.conf

# Update limits
cat > /etc/security/limits.d/opensearch.conf << EOF
opensearch soft nofile 65535
opensearch hard nofile 65535
opensearch soft memlock unlimited
opensearch hard memlock unlimited
EOF
```

### Query Optimization

```json
// Optimize Wazuh queries
{
  "persistent": {
    "search.max_buckets": 100000,
    "indices.query.bool.max_clause_count": 2048,
    "cluster.routing.allocation.total_shards_per_node": 1000
  },
  "transient": {
    "indices.recovery.max_bytes_per_sec": "100mb",
    "cluster.routing.allocation.node_concurrent_recoveries": 2,
    "indices.memory.index_buffer_size": "20%"
  }
}
```

## Step 8: Monitoring and Validation

### Health Check Script

```bash
#!/bin/bash
# post-migration-check.sh

echo "=== Post-Migration Health Check ==="

# Check OpenSearch cluster health
echo "OpenSearch Cluster Health:"
curl -s -u admin:admin https://localhost:9200/_cluster/health?pretty

# Check Wazuh indices
echo -e "\nWazuh Indices:"
curl -s -u admin:admin https://localhost:9200/_cat/indices/wazuh-*?v

# Check Filebeat status
echo -e "\nFilebeat Status:"
systemctl status filebeat --no-pager | grep Active

# Check Wazuh API connectivity
echo -e "\nWazuh API Status:"
curl -s -u wazuh:wazuh https://localhost:55000/security/user/authenticate?raw=true

# Check Dashboard status
echo -e "\nWazuh Dashboard Status:"
systemctl status wazuh-dashboard --no-pager | grep Active

# Verify data ingestion
echo -e "\nRecent Alerts Count:"
curl -s -u admin:admin -X POST https://localhost:9200/wazuh-alerts-*/_count \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-1h"
        }
      }
    }
  }' | jq '.count'
```

### Monitoring Dashboard

Create a monitoring dashboard in OpenSearch Dashboards:

```json
{
  "version": "2.11.0",
  "objects": [
    {
      "id": "wazuh-migration-dashboard",
      "type": "dashboard",
      "attributes": {
        "title": "Wazuh Migration Monitoring",
        "panels": [
          {
            "gridData": { "x": 0, "y": 0, "w": 24, "h": 15 },
            "type": "visualization",
            "id": "cluster-health-gauge"
          },
          {
            "gridData": { "x": 24, "y": 0, "w": 24, "h": 15 },
            "type": "visualization",
            "id": "index-size-timeline"
          },
          {
            "gridData": { "x": 0, "y": 15, "w": 48, "h": 20 },
            "type": "visualization",
            "id": "alerts-per-hour"
          }
        ]
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Failures

```bash
# Reset admin password
/usr/share/opensearch/plugins/opensearch-security/tools/hash.sh -p newpassword

# Update internal users
vim /etc/opensearch/internal_users.yml
# Replace admin hash with new one

# Apply changes
./securityadmin.sh -cd /etc/opensearch -icl -nhnv \
  -cacert /etc/opensearch/certs/ca.pem \
  -cert /etc/opensearch/certs/admin.pem \
  -key /etc/opensearch/certs/admin-key.pem
```

#### 2. Index Compatibility Issues

```bash
# Fix mapping conflicts
curl -X PUT "https://localhost:9200/wazuh-alerts-*/_mapping" \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "agent.id": {
        "type": "keyword"
      }
    }
  }'

# Reindex if needed
curl -X POST "https://localhost:9200/_reindex" \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "source": {"index": "wazuh-alerts-old"},
    "dest": {"index": "wazuh-alerts-new"}
  }'
```

#### 3. Performance Issues

```bash
# Check slow queries
curl -X GET "https://localhost:9200/wazuh-*/_search" \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "profile": true,
    "query": {
      "match_all": {}
    }
  }'

# Optimize indices
curl -X POST "https://localhost:9200/wazuh-*/_forcemerge?max_num_segments=1" \
  -u admin:admin
```

## Rollback Plan

### Emergency Rollback Procedure

```bash
#!/bin/bash
# rollback-to-elasticsearch.sh

echo "Starting rollback to Elasticsearch..."

# Stop OpenSearch services
systemctl stop opensearch
systemctl stop wazuh-dashboard
systemctl stop filebeat

# Restore Elasticsearch configuration
cp -r /backup/wazuh-migration/$(date +%Y%m%d)/elasticsearch/* /etc/elasticsearch/

# Start Elasticsearch
systemctl start elasticsearch

# Restore Filebeat configuration
cp /backup/wazuh-migration/$(date +%Y%m%d)/filebeat.yml /etc/filebeat/

# Update output to Elasticsearch
sed -i 's/output.elasticsearch/output.elasticsearch/g' /etc/filebeat/filebeat.yml
sed -i 's/https:\/\/localhost:9200/http:\/\/localhost:9200/g' /etc/filebeat/filebeat.yml

# Start services
systemctl start filebeat
systemctl start kibana

echo "Rollback completed. Verify services are running correctly."
```

## Best Practices

### 1. Phased Migration

- Migrate in stages: Test → Development → Production
- Validate each component before proceeding
- Maintain parallel environments during transition

### 2. Data Retention

- Keep Elasticsearch backup for at least 30 days
- Document all configuration changes
- Test restore procedures regularly

### 3. Security Hardening

```bash
# Disable unnecessary features
curl -X PUT "https://localhost:9200/_cluster/settings" \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "persistent": {
      "plugins.security.audit.type": "internal_opensearch",
      "plugins.security.audit.config.disabled_rest_categories": ["AUTHENTICATED"],
      "plugins.security.audit.config.disabled_transport_categories": ["AUTHENTICATED"]
    }
  }'
```

### 4. Monitoring Setup

```yaml
# Metricbeat configuration for monitoring
metricbeat.modules:
  - module: elasticsearch
    metricsets:
      - node
      - node_stats
      - cluster_stats
      - index
    period: 10s
    hosts: ["https://localhost:9200"]
    username: "monitoring"
    password: "${MONITORING_PASSWORD}"
    ssl.verification_mode: "none"
```

## Conclusion

Migrating from Elasticsearch to OpenSearch for Wazuh provides improved security features, better performance, and long-term support. Key benefits include:

- Native security plugin with fine-grained access control
- Improved index lifecycle management
- Better resource utilization
- Active development and community support

The migration process, while complex, ensures your security monitoring infrastructure remains modern and maintainable. Regular monitoring and optimization will maximize the benefits of your new OpenSearch-based Wazuh deployment.

## Additional Resources

- [Wazuh Documentation - OpenSearch Integration](https://documentation.wazuh.com/current/installation-guide/wazuh-indexer/index.html)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenSearch Security Plugin](https://opensearch.org/docs/latest/security-plugin/index/)
- [Wazuh GitHub Repository](https://github.com/wazuh/wazuh)
- [OpenSearch Performance Tuning](https://opensearch.org/docs/latest/opensearch/performance-tuning/)
