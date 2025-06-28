---
title: "Complete Wazuh to OpenSearch Migration Guide: Indexer Replacement and Data Migration"
author: "Anubhav Gain"
pubDatetime: 2025-01-28T16:00:00Z
featured: true
draft: false
tags:
  - wazuh
  - opensearch
  - migration
  - indexer
  - elasticsearch
  - siem
  - security
description: "Comprehensive guide for migrating from Wazuh indexer to OpenSearch, including data migration, configuration updates, and step-by-step replacement procedures."
---

# Complete Wazuh to OpenSearch Migration Guide: Indexer Replacement and Data Migration

Migrating from Wazuh indexer to OpenSearch requires careful planning and execution to ensure data integrity and minimal downtime. This guide provides comprehensive instructions for different migration scenarios, from simple indexer replacement to complex multi-node cluster migrations.

## Table of Contents

- [Migration Overview](#migration-overview)
- [Pre-Migration Planning](#pre-migration-planning)
- [Single Node Migration](#single-node-migration)
- [Cluster Migration](#cluster-migration)
- [Data Migration Strategies](#data-migration-strategies)
- [Configuration Updates](#configuration-updates)
- [Post-Migration Validation](#post-migration-validation)
- [Rollback Procedures](#rollback-procedures)

## Migration Overview

### Understanding the Migration Scope

The migration from Wazuh indexer to OpenSearch involves several components:

**Components to Migrate:**

- Index data (alerts, archives, monitoring data)
- Index templates and mappings
- Security configurations and users
- Custom dashboards and visualizations
- Backup repositories and snapshots

**Migration Paths:**

1. **In-place upgrade**: Replace Wazuh indexer with OpenSearch on same nodes
2. **Side-by-side migration**: Deploy new OpenSearch cluster and migrate data
3. **Hybrid approach**: Gradual replacement with data synchronization

### Compatibility Matrix

| Wazuh Version | Compatible OpenSearch Version | Migration Method   |
| ------------- | ----------------------------- | ------------------ |
| 4.3.x         | 2.3.0+                        | Direct replacement |
| 4.4.x         | 2.8.0+                        | Direct replacement |
| 4.5.x         | 2.11.0+                       | Direct replacement |
| 4.6.x+        | 2.15.0+                       | Direct replacement |

## Pre-Migration Planning

### 1. Environment Assessment

Assess your current Wazuh indexer environment:

```bash
# Check Wazuh indexer version
curl -k -u admin:admin "https://localhost:9200"

# Check cluster health
curl -k -u admin:admin "https://localhost:9200/_cluster/health?pretty"

# List all indices
curl -k -u admin:admin "https://localhost:9200/_cat/indices?v"

# Check disk usage
curl -k -u admin:admin "https://localhost:9200/_cat/allocation?v"

# Get cluster settings
curl -k -u admin:admin "https://localhost:9200/_cluster/settings?pretty"
```

### 2. Data Inventory

Create an inventory of your data:

```bash
#!/bin/bash
# wazuh-inventory.sh

echo "=== Wazuh Indexer Data Inventory ==="

# Count documents per index
echo "Document counts:"
curl -s -k -u admin:admin "https://localhost:9200/_cat/indices?v&h=index,docs.count" | \
  grep -E "wazuh|\.security|\.kibana" | sort

# Calculate total storage
echo -e "\nStorage usage:"
curl -s -k -u admin:admin "https://localhost:9200/_cat/indices?v&h=index,store.size" | \
  grep -E "wazuh|\.security|\.kibana" | sort

# List templates
echo -e "\nIndex templates:"
curl -s -k -u admin:admin "https://localhost:9200/_cat/templates?v"

# List snapshots
echo -e "\nSnapshots:"
curl -s -k -u admin:admin "https://localhost:9200/_cat/snapshots?v" 2>/dev/null || echo "No snapshot repositories configured"

# Check security users
echo -e "\nSecurity users:"
curl -s -k -u admin:admin "https://localhost:9200/_plugins/_security/api/internalusers" | jq -r 'keys[]' 2>/dev/null || echo "Security plugin not accessible"
```

### 3. Backup Strategy

Create comprehensive backups before migration:

```bash
# Create snapshot repository
curl -k -u admin:admin -X PUT "https://localhost:9200/_snapshot/pre_migration_backup" \
  -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup/pre-migration",
    "compress": true,
    "chunk_size": "100MB"
  }
}'

# Create complete backup
curl -k -u admin:admin -X PUT "https://localhost:9200/_snapshot/pre_migration_backup/full_backup_$(date +%Y%m%d)" \
  -H 'Content-Type: application/json' -d'
{
  "indices": "*",
  "include_global_state": true,
  "ignore_unavailable": false
}'

# Backup configuration files
sudo tar -czf /backup/wazuh-config-$(date +%Y%m%d).tar.gz \
  /etc/wazuh-indexer/ \
  /etc/wazuh-manager/ \
  /etc/wazuh-dashboard/ \
  /etc/filebeat/
```

### 4. Downtime Planning

Plan maintenance windows and communication:

```bash
# Calculate estimated downtime
echo "Migration time estimates:"
echo "- Single node (< 100GB): 30-60 minutes"
echo "- Single node (100GB-1TB): 1-4 hours"
echo "- Multi-node cluster: 2-8 hours"
echo "- Cross-cluster migration: 4-24 hours"

# Test migration on development environment first
```

## Single Node Migration

### Method 1: In-Place Replacement

This method replaces Wazuh indexer with OpenSearch on the same node:

```bash
#!/bin/bash
# single-node-migration.sh

set -e

echo "Starting Wazuh to OpenSearch migration..."

# Step 1: Stop Wazuh services
echo "Stopping Wazuh services..."
sudo systemctl stop wazuh-dashboard
sudo systemctl stop filebeat
sudo systemctl stop wazuh-manager
sudo systemctl stop wazuh-indexer

# Step 2: Backup data directory
echo "Backing up data directory..."
sudo cp -r /var/lib/wazuh-indexer /backup/wazuh-indexer-backup-$(date +%Y%m%d)

# Step 3: Install OpenSearch
echo "Installing OpenSearch..."
curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | sudo apt-key add -
echo "deb https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/opensearch-2.x.list

sudo apt-get update
sudo apt-get install opensearch=2.15.0

# Step 4: Configure OpenSearch
echo "Configuring OpenSearch..."
sudo cp /etc/wazuh-indexer/opensearch.yml /etc/opensearch/opensearch.yml.backup

cat << 'EOF' | sudo tee /etc/opensearch/opensearch.yml
cluster.name: wazuh-cluster
node.name: wazuh-node-1
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node

# Data paths
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch
path.repo: /var/lib/opensearch/backup

# Memory
bootstrap.memory_lock: true

# Security
plugins.security.disabled: false
plugins.security.allow_default_init_securityindex: true
plugins.security.allow_unsafe_democertificates: true
EOF

# Step 5: Migrate data
echo "Migrating data..."
sudo mkdir -p /var/lib/opensearch
sudo cp -r /var/lib/wazuh-indexer/* /var/lib/opensearch/
sudo chown -R opensearch:opensearch /var/lib/opensearch

# Step 6: Start OpenSearch
echo "Starting OpenSearch..."
sudo systemctl enable opensearch
sudo systemctl start opensearch

# Wait for OpenSearch to start
sleep 30

# Step 7: Verify migration
echo "Verifying migration..."
curl -k -u admin:admin "https://localhost:9200/_cluster/health?pretty"
curl -k -u admin:admin "https://localhost:9200/_cat/indices?v"

echo "Migration completed successfully!"
```

### Method 2: Side-by-Side Migration

Deploy new OpenSearch instance and migrate data:

```bash
#!/bin/bash
# side-by-side-migration.sh

# Step 1: Install OpenSearch on new port
sudo apt-get install opensearch=2.15.0

# Configure on port 9201 temporarily
cat << 'EOF' | sudo tee /etc/opensearch/opensearch.yml
cluster.name: wazuh-migration-cluster
node.name: opensearch-migration-node
network.host: 0.0.0.0
http.port: 9201
transport.port: 9301
discovery.type: single-node
path.data: /var/lib/opensearch-migration
path.logs: /var/log/opensearch-migration
plugins.security.disabled: true
EOF

# Start new OpenSearch instance
sudo systemctl start opensearch

# Step 2: Use reindex API to migrate data
echo "Migrating indices..."

# Get list of indices to migrate
INDICES=$(curl -s -k -u admin:admin "https://localhost:9200/_cat/indices?h=index" | grep -E "wazuh|\.security|\.kibana")

for index in $INDICES; do
  echo "Migrating index: $index"

  # Create index on new cluster
  curl -X POST "localhost:9201/_reindex" -H 'Content-Type: application/json' -d"
  {
    \"source\": {
      \"remote\": {
        \"host\": \"https://localhost:9200\",
        \"username\": \"admin\",
        \"password\": \"admin\"
      },
      \"index\": \"$index\"
    },
    \"dest\": {
      \"index\": \"$index\"
    }
  }"

  # Wait for reindex to complete
  sleep 10
done

# Step 3: Switch configurations
sudo systemctl stop wazuh-indexer
sudo systemctl stop opensearch

# Update OpenSearch config to use standard ports
sed -i 's/9201/9200/' /etc/opensearch/opensearch.yml
sed -i 's/9301/9300/' /etc/opensearch/opensearch.yml
sed -i 's/opensearch-migration/opensearch/' /etc/opensearch/opensearch.yml

# Move data to standard location
sudo mv /var/lib/opensearch-migration /var/lib/opensearch
sudo chown -R opensearch:opensearch /var/lib/opensearch

sudo systemctl start opensearch
```

## Cluster Migration

### Rolling Migration Strategy

For multi-node clusters, use a rolling migration approach:

```bash
#!/bin/bash
# cluster-rolling-migration.sh

NODES=("node1" "node2" "node3")
CLUSTER_IP="10.0.1.10"

for node in "${NODES[@]}"; do
  echo "Migrating node: $node"

  # Step 1: Disable shard allocation
  curl -k -u admin:admin -X PUT "https://$CLUSTER_IP:9200/_cluster/settings" \
    -H 'Content-Type: application/json' -d'
  {
    "persistent": {
      "cluster.routing.allocation.enable": "primaries"
    }
  }'

  # Step 2: Stop node services on target node
  ssh $node "sudo systemctl stop wazuh-indexer"

  # Step 3: Install OpenSearch on target node
  ssh $node "
    curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | sudo apt-key add -
    echo 'deb https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main' | sudo tee -a /etc/apt/sources.list.d/opensearch-2.x.list
    sudo apt-get update
    sudo apt-get install opensearch=2.15.0
  "

  # Step 4: Configure OpenSearch
  scp cluster-opensearch.yml $node:/tmp/
  ssh $node "sudo mv /tmp/cluster-opensearch.yml /etc/opensearch/opensearch.yml"

  # Step 5: Migrate data directory
  ssh $node "
    sudo cp -r /var/lib/wazuh-indexer /var/lib/opensearch
    sudo chown -R opensearch:opensearch /var/lib/opensearch
  "

  # Step 6: Start OpenSearch
  ssh $node "sudo systemctl enable opensearch && sudo systemctl start opensearch"

  # Step 7: Wait for node to join cluster
  sleep 60

  # Step 8: Re-enable shard allocation
  curl -k -u admin:admin -X PUT "https://$CLUSTER_IP:9200/_cluster/settings" \
    -H 'Content-Type: application/json' -d'
  {
    "persistent": {
      "cluster.routing.allocation.enable": "all"
    }
  }'

  # Step 9: Wait for cluster to stabilize
  while true; do
    status=$(curl -s -k -u admin:admin "https://$CLUSTER_IP:9200/_cluster/health" | jq -r '.status')
    if [ "$status" = "green" ]; then
      echo "Cluster is green, proceeding to next node"
      break
    fi
    echo "Waiting for cluster to be green (current: $status)"
    sleep 30
  done
done
```

### Cluster Configuration Template

```yaml
# cluster-opensearch.yml
cluster.name: wazuh-cluster
node.name: ${NODE_NAME}
node.roles: [cluster_manager, data, ingest]

network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery
discovery.seed_hosts: ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
cluster.initial_cluster_manager_nodes: ["node1"]

# Paths
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch
path.repo: /shared/backup

# Memory
bootstrap.memory_lock: true

# Security
plugins.security.disabled: false
plugins.security.allow_default_init_securityindex: true

# Performance
indices.memory.index_buffer_size: 10%
thread_pool.write.queue_size: 1000
```

## Data Migration Strategies

### 1. Snapshot and Restore

Most reliable method for large datasets:

```bash
# Create snapshot on source
curl -k -u admin:admin -X PUT "https://source:9200/_snapshot/migration_repo/migration_snapshot" \
  -H 'Content-Type: application/json' -d'
{
  "indices": "wazuh-*,.security*,.kibana*",
  "ignore_unavailable": true,
  "include_global_state": true
}'

# Register repository on destination
curl -k -u admin:admin -X PUT "https://destination:9200/_snapshot/migration_repo" \
  -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/shared/backup/migration"
  }
}'

# Restore on destination
curl -k -u admin:admin -X POST "https://destination:9200/_snapshot/migration_repo/migration_snapshot/_restore" \
  -H 'Content-Type: application/json' -d'
{
  "indices": "*",
  "ignore_unavailable": true,
  "include_global_state": true,
  "rename_pattern": "(.+)",
  "rename_replacement": "$1"
}'
```

### 2. Remote Reindex

For selective data migration:

```bash
# Configure remote cluster
curl -k -u admin:admin -X PUT "https://destination:9200/_cluster/settings" \
  -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.remote.source.seeds": ["source:9300"],
    "cluster.remote.source.username": "admin",
    "cluster.remote.source.password": "admin"
  }
}'

# Reindex with transformation
curl -k -u admin:admin -X POST "https://destination:9200/_reindex" \
  -H 'Content-Type: application/json' -d'
{
  "source": {
    "remote": {
      "host": "https://source:9200",
      "username": "admin",
      "password": "admin"
    },
    "index": "wazuh-alerts-*",
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-30d"
        }
      }
    }
  },
  "dest": {
    "index": "wazuh-alerts-migrated"
  }
}'
```

### 3. Logstash Pipeline

For complex data transformation:

```ruby
# logstash-migration.conf
input {
  elasticsearch {
    hosts => ["https://source:9200"]
    user => "admin"
    password => "admin"
    index => "wazuh-alerts-*"
    ssl => true
    ssl_certificate_verification => false
    query => '{"query": {"match_all": {}}}'
    scroll => "5m"
    size => 1000
  }
}

filter {
  # Transform data if needed
  if [rule][id] {
    mutate {
      add_field => { "rule_id" => "%{[rule][id]}" }
    }
  }

  # Add migration metadata
  mutate {
    add_field => {
      "migration_timestamp" => "%{@timestamp}"
      "migration_source" => "wazuh-indexer"
    }
  }
}

output {
  elasticsearch {
    hosts => ["https://destination:9200"]
    user => "admin"
    password => "admin"
    index => "wazuh-alerts-%{+YYYY.MM.dd}"
    ssl => true
    ssl_certificate_verification => false
  }

  stdout {
    codec => dots
  }
}
```

## Configuration Updates

### 1. Update Wazuh Manager Configuration

```xml
<!-- /etc/wazuh-manager/ossec.conf -->
<ossec_config>
  <indexer>
    <enabled>yes</enabled>
    <hosts>
      <host>https://localhost:9200</host>
    </hosts>
    <ssl>
      <certificate_authorities>/etc/wazuh-manager/certs/root-ca.pem</certificate_authorities>
      <certificate>/etc/wazuh-manager/certs/wazuh-manager.pem</certificate>
      <key>/etc/wazuh-manager/certs/wazuh-manager-key.pem</key>
    </ssl>
  </indexer>
</ossec_config>
```

### 2. Update Filebeat Configuration

```yaml
# /etc/filebeat/filebeat.yml
output.elasticsearch:
  hosts: ["https://localhost:9200"]
  protocol: "https"
  username: "admin"
  password: "admin"
  ssl.certificate_authorities: ["/etc/filebeat/certs/root-ca.pem"]
  ssl.certificate: "/etc/filebeat/certs/filebeat.pem"
  ssl.key: "/etc/filebeat/certs/filebeat-key.pem"
  ssl.verification_mode: "certificate"

setup.template.name: "wazuh"
setup.template.pattern: "wazuh-alerts-*"
setup.template.settings:
  index.number_of_shards: 1
  index.number_of_replicas: 0
```

### 3. Update Wazuh Dashboard Configuration

```yaml
# /etc/wazuh-dashboard/opensearch_dashboards.yml
server.host: "0.0.0.0"
server.port: 443
opensearch.hosts: ["https://localhost:9200"]
opensearch.ssl.verificationMode: certificate
opensearch.ssl.certificateAuthorities:
  ["/etc/wazuh-dashboard/certs/root-ca.pem"]
opensearch.ssl.certificate: "/etc/wazuh-dashboard/certs/wazuh-dashboard.pem"
opensearch.ssl.key: "/etc/wazuh-dashboard/certs/wazuh-dashboard-key.pem"

opensearch.username: "kibanaserver"
opensearch.password: "kibanaserver"
```

## Post-Migration Validation

### 1. Health Checks

```bash
#!/bin/bash
# post-migration-validation.sh

echo "=== Post-Migration Validation ==="

# Check cluster health
echo "Cluster Health:"
curl -k -u admin:admin "https://localhost:9200/_cluster/health?pretty"

# Verify all indices
echo -e "\nIndices Status:"
curl -k -u admin:admin "https://localhost:9200/_cat/indices?v"

# Check document counts
echo -e "\nDocument Counts:"
for index in $(curl -s -k -u admin:admin "https://localhost:9200/_cat/indices?h=index" | grep wazuh); do
  count=$(curl -s -k -u admin:admin "https://localhost:9200/$index/_count" | jq -r '.count')
  echo "$index: $count documents"
done

# Test search functionality
echo -e "\nSearch Test:"
curl -k -u admin:admin "https://localhost:9200/wazuh-alerts-*/_search?size=1&pretty"

# Check templates
echo -e "\nTemplates:"
curl -k -u admin:admin "https://localhost:9200/_cat/templates?v"

# Verify security
echo -e "\nSecurity Status:"
curl -k -u admin:admin "https://localhost:9200/_plugins/_security/health?pretty"
```

### 2. Performance Validation

```bash
# Performance benchmark
curl -k -u admin:admin -X POST "https://localhost:9200/wazuh-alerts-*/_search" \
  -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "alerts_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "1h"
      }
    }
  }
}'

# Check resource usage
curl -k -u admin:admin "https://localhost:9200/_cat/nodes?v&h=name,heap.percent,ram.percent,cpu,load_1m"
```

### 3. Data Integrity Verification

```bash
#!/bin/bash
# data-integrity-check.sh

# Compare document counts between backup and current
echo "Comparing document counts..."

# Create temporary mapping file
curl -s -k -u admin:admin "https://localhost:9200/_cat/indices?h=index,docs.count" > current_counts.txt

# Compare with pre-migration backup
# (Assuming you have a snapshot of original counts)
diff pre_migration_counts.txt current_counts.txt || echo "Document count differences detected"

# Sample data verification
echo "Verifying sample data..."
curl -k -u admin:admin "https://localhost:9200/wazuh-alerts-*/_search?q=rule.id:5716&size=5&pretty"
```

## Rollback Procedures

### 1. Emergency Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

echo "Starting emergency rollback..."

# Stop current services
sudo systemctl stop opensearch
sudo systemctl stop wazuh-dashboard
sudo systemctl stop filebeat

# Restore from backup
sudo rm -rf /var/lib/opensearch
sudo cp -r /backup/wazuh-indexer-backup-* /var/lib/wazuh-indexer

# Reinstall Wazuh indexer
sudo apt-get remove --purge opensearch
sudo apt-get install wazuh-indexer

# Restore configurations
sudo cp /backup/wazuh-config-*/etc/wazuh-indexer/* /etc/wazuh-indexer/

# Start services
sudo systemctl start wazuh-indexer
sudo systemctl start wazuh-dashboard
sudo systemctl start filebeat

echo "Rollback completed"
```

### 2. Partial Rollback

```bash
# Rollback specific indices
curl -k -u admin:admin -X DELETE "https://localhost:9200/problematic-index"

# Restore from snapshot
curl -k -u admin:admin -X POST "https://localhost:9200/_snapshot/backup_repo/pre_migration_backup/_restore" \
  -H 'Content-Type: application/json' -d'
{
  "indices": "problematic-index",
  "ignore_unavailable": true
}'
```

## Best Practices and Recommendations

### Migration Checklist

- [ ] Backup all data and configurations
- [ ] Test migration in development environment
- [ ] Plan for adequate downtime window
- [ ] Verify network connectivity and resources
- [ ] Update monitoring and alerting configurations
- [ ] Communicate with stakeholders
- [ ] Prepare rollback procedures
- [ ] Document the migration process

### Performance Optimization

```bash
# Post-migration optimizations
curl -k -u admin:admin -X PUT "https://localhost:9200/_cluster/settings" \
  -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "indices.memory.index_buffer_size": "10%",
    "indices.memory.min_index_buffer_size": "96mb",
    "thread_pool.write.queue_size": 1000,
    "thread_pool.search.queue_size": 1000
  }
}'

# Optimize indices after migration
curl -k -u admin:admin -X POST "https://localhost:9200/_forcemerge?max_num_segments=1"
```

### Security Hardening

```bash
# Update default passwords
curl -k -u admin:admin -X PUT "https://localhost:9200/_plugins/_security/api/internalusers/admin" \
  -H 'Content-Type: application/json' -d'
{
  "password": "new-secure-password",
  "opendistro_security_roles": ["all_access"]
}'

# Configure proper TLS
# Update certificates and remove demo certificates
```

## Conclusion

Successfully migrating from Wazuh indexer to OpenSearch requires careful planning, proper execution, and thorough validation. This guide provides the necessary tools and procedures for different migration scenarios.

Key success factors:

- Comprehensive backup strategy
- Thorough testing in development
- Minimal downtime planning
- Post-migration validation
- Ready rollback procedures

For complex environments, consider engaging with migration specialists and conduct phased migrations to minimize risk and ensure data integrity throughout the process.
