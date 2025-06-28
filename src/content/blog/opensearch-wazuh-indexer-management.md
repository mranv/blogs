---
author: Anubhav Gain
pubDatetime: 2025-02-25T01:32:00Z
title: "OpenSearch/Wazuh Indexer Setup and Management Guide"
slug: opensearch-wazuh-indexer-management-tool-tip
featured: false
draft: false
tags:
  - opensearch
  - wazuh
  - security
  - indexer
  - siem
  - backup
  - monitoring
description: "Complete guide for setting up, configuring, and managing an OpenSearch cluster serving as a Wazuh indexer, including backup procedures, health checks, and troubleshooting."
---

# OpenSearch/Wazuh Indexer Setup and Management Guide

This document provides comprehensive instructions for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer. It covers installation, backup procedures, configuration paths, and basic health checks for production environments.

## System Overview

The setup consists of:

- **OpenSearch 2.19.0** serving as a Wazuh indexer
- **Single-node cluster** configuration (expandable to multi-node)
- **Security plugin** enabled with admin authentication
- **Custom paths** configured for Wazuh integration

## Directory Structure

The key directories and configuration files are:

```
/var/lib/wazuh-indexer/      # Main data directory
/var/log/wazuh-indexer/      # Log directory
/etc/opensearch/             # Configuration directory
/etc/opensearch/opensearch.yml  # Main configuration file
/etc/opensearch/certs/       # TLS certificates directory
```

## Installation and Setup

### 1. Install OpenSearch

First, install the OpenSearch Debian package:

```bash
# Update package repository
sudo apt-get update

# Install required dependencies
sudo apt-get install -y curl gnupg2

# Add OpenSearch GPG key and repository
curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | sudo apt-key add -
echo "deb https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/opensearch-2.x.list

# Update repository and install OpenSearch
sudo apt-get update
sudo apt-get install opensearch=2.19.0
```

### 2. Configure Custom Paths

Edit the OpenSearch configuration file to use Wazuh-specific paths:

```bash
sudo nano /etc/opensearch/opensearch.yml
```

Add or modify the following settings:

```yaml
# Basic cluster configuration
cluster.name: wazuh-cluster
node.name: wazuh-indexer-1
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Custom paths for Wazuh integration
path.data: /var/lib/wazuh-indexer
path.logs: /var/log/wazuh-indexer
path.repo: /var/lib/wazuh-indexer/backup

# Memory settings
bootstrap.memory_lock: true

# Security plugin configuration
plugins.security.disabled: false
plugins.security.allow_default_init_securityindex: true
```

### 3. Set Proper Permissions

Ensure the OpenSearch user has proper permissions to the data and log directories:

```bash
# Create directories
sudo mkdir -p /var/lib/wazuh-indexer
sudo mkdir -p /var/log/wazuh-indexer
sudo mkdir -p /var/lib/wazuh-indexer/backup

# Set ownership and permissions
sudo chown -R opensearch:opensearch /var/lib/wazuh-indexer
sudo chown -R opensearch:opensearch /var/log/wazuh-indexer
sudo chmod -R 755 /var/lib/wazuh-indexer
sudo chmod -R 755 /var/log/wazuh-indexer
```

### 4. Configure JVM Settings

Set appropriate heap size for your system:

```bash
sudo nano /etc/opensearch/jvm.options
```

Modify heap settings (use 50% of available RAM, max 32GB):

```
# For 8GB system
-Xms4g
-Xmx4g

# For 16GB system
-Xms8g
-Xmx8g
```

### 5. Start the Service

Enable and start the OpenSearch service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable opensearch
sudo systemctl start opensearch

# Check service status
sudo systemctl status opensearch
```

## Configuration Management

### Basic Configuration File

Here's a complete example configuration for a single-node Wazuh indexer:

```yaml
# /etc/opensearch/opensearch.yml

# Cluster configuration
cluster.name: wazuh-cluster
node.name: wazuh-indexer-1
node.roles: [cluster_manager, data, ingest]

# Network configuration
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery settings (single node)
discovery.type: single-node

# Paths
path.data: /var/lib/wazuh-indexer
path.logs: /var/log/wazuh-indexer
path.repo: /var/lib/wazuh-indexer/backup

# Memory
bootstrap.memory_lock: true

# Security plugin settings
plugins.security.disabled: false
plugins.security.allow_default_init_securityindex: true
plugins.security.allow_unsafe_democertificates: true
plugins.security.audit.type: internal_opensearch

# Performance settings
indices.memory.index_buffer_size: 10%
thread_pool.write.queue_size: 1000
thread_pool.search.queue_size: 1000

# Index management
action.auto_create_index: true
action.destructive_requires_name: true
```

### Multi-Node Configuration

For production environments, configure multiple nodes:

```yaml
# Node 1 configuration
cluster.name: wazuh-cluster
node.name: wazuh-indexer-1
node.roles: [cluster_manager, data]
network.host: 0.0.0.0
discovery.seed_hosts: ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
cluster.initial_cluster_manager_nodes: ["wazuh-indexer-1"]

# Node 2 configuration
cluster.name: wazuh-cluster
node.name: wazuh-indexer-2
node.roles: [data]
network.host: 0.0.0.0
discovery.seed_hosts: ["10.0.1.10", "10.0.1.11", "10.0.1.12"]
cluster.initial_cluster_manager_nodes: ["wazuh-indexer-1"]
```

## Backup Procedures

### 1. Prepare for Backup

For production environments, ensure data consistency before backup:

```bash
# Flush in-memory changes to disk
curl -k -u admin:password -X POST "https://localhost:9200/_flush"

# Optionally, disable shard allocation during backup
curl -k -u admin:password -X PUT "https://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.enable": "primaries"
  }
}'
```

### 2. Create Filesystem Backup

Create a complete backup of the data directory:

```bash
# Stop OpenSearch service (for cold backup)
sudo systemctl stop opensearch

# Create a dated backup
sudo tar -czf /backup/wazuh-indexer-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C / var/lib/wazuh-indexer var/log/wazuh-indexer etc/opensearch

# Restart OpenSearch
sudo systemctl start opensearch
```

### 3. Create Snapshot Backup (Hot Backup)

Configure and use OpenSearch snapshot feature:

```bash
# Register snapshot repository
curl -k -u admin:password -X PUT "https://localhost:9200/_snapshot/wazuh_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/var/lib/wazuh-indexer/backup",
    "compress": true
  }
}'

# Create snapshot
curl -k -u admin:password -X PUT "https://localhost:9200/_snapshot/wazuh_backup/snapshot_$(date +%Y%m%d_%H%M%S)" -H 'Content-Type: application/json' -d'
{
  "indices": "wazuh-*",
  "ignore_unavailable": true,
  "include_global_state": false
}'

# Check snapshot status
curl -k -u admin:password "https://localhost:9200/_snapshot/wazuh_backup/_current"
```

### 4. Verify the Backup

Always verify your backups:

```bash
# Check backup file size and integrity
du -sh /backup/wazuh-indexer-backup-*.tar.gz
tar -tzf /backup/wazuh-indexer-backup-*.tar.gz | head -20

# For snapshots, list all snapshots
curl -k -u admin:password "https://localhost:9200/_snapshot/wazuh_backup/_all?pretty"
```

### 5. Automated Backup Script

Create an automated backup script:

```bash
#!/bin/bash
# /usr/local/bin/wazuh-backup.sh

BACKUP_DIR="/backup/wazuh-indexer"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Create snapshot backup
curl -k -u admin:password -X PUT "https://localhost:9200/_snapshot/wazuh_backup/auto_snapshot_$DATE" \
  -H 'Content-Type: application/json' -d'
{
  "indices": "wazuh-*",
  "ignore_unavailable": true,
  "include_global_state": false
}'

# Wait for snapshot completion
while true; do
  STATUS=$(curl -s -k -u admin:password "https://localhost:9200/_snapshot/wazuh_backup/auto_snapshot_$DATE" | jq -r '.snapshots[0].state')
  if [ "$STATUS" = "SUCCESS" ]; then
    echo "Snapshot completed successfully"
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Snapshot failed"
    exit 1
  fi
  sleep 10
done

# Clean up old snapshots
find $BACKUP_DIR -name "auto_snapshot_*" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "$(date): Backup completed successfully" >> /var/log/wazuh-backup.log
```

## Health Checks and Monitoring

### 1. Basic Health Checks

Regularly monitor the health of your OpenSearch/Wazuh indexer cluster:

```bash
# Check cluster health
curl -k -u admin:password "https://localhost:9200/_cluster/health?pretty"

# Expected output shows cluster status (green or yellow for single-node deployments)
```

### 2. Node Status and Performance

```bash
# Check node information
curl -k -u admin:password "https://localhost:9200/_cat/nodes?v&h=name,heap.percent,ram.percent,cpu,load_1m,disk.used_percent"

# Check indices status
curl -k -u admin:password "https://localhost:9200/_cat/indices?v&s=index"

# Check shard allocation
curl -k -u admin:password "https://localhost:9200/_cat/shards?v"
```

### 3. Performance Metrics

```bash
# Check cluster statistics
curl -k -u admin:password "https://localhost:9200/_cluster/stats?pretty"

# Check thread pool status
curl -k -u admin:password "https://localhost:9200/_cat/thread_pool?v&h=name,active,queue,rejected"

# Monitor search and indexing performance
curl -k -u admin:password "https://localhost:9200/_stats/search,indexing?pretty"
```

### 4. Wazuh-Specific Monitoring

```bash
# Check Wazuh indices
curl -k -u admin:password "https://localhost:9200/_cat/indices/wazuh-*?v&s=index"

# Check latest Wazuh alerts
curl -k -u admin:password "https://localhost:9200/wazuh-alerts-*/_search?size=5&sort=@timestamp:desc&pretty"

# Monitor Wazuh data ingestion rate
curl -k -u admin:password "https://localhost:9200/wazuh-alerts-*/_count?pretty"
```

### 5. Automated Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/wazuh-health-check.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Wazuh Indexer Health Check ==="

# Check if OpenSearch is running
if ! systemctl is-active --quiet opensearch; then
    echo -e "${RED}ERROR: OpenSearch service is not running${NC}"
    exit 1
fi

# Check cluster health
HEALTH=$(curl -s -k -u admin:password "https://localhost:9200/_cluster/health" | jq -r '.status')
case $HEALTH in
    "green")
        echo -e "${GREEN}✓ Cluster health: $HEALTH${NC}"
        ;;
    "yellow")
        echo -e "${YELLOW}⚠ Cluster health: $HEALTH${NC}"
        ;;
    "red")
        echo -e "${RED}✗ Cluster health: $HEALTH${NC}"
        ;;
esac

# Check disk usage
DISK_USAGE=$(df -h /var/lib/wazuh-indexer | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${RED}✗ High disk usage: ${DISK_USAGE}%${NC}"
else
    echo -e "${GREEN}✓ Disk usage: ${DISK_USAGE}%${NC}"
fi

# Check memory usage
HEAP_USAGE=$(curl -s -k -u admin:password "https://localhost:9200/_cat/nodes?h=heap.percent" | tr -d ' ')
if [ $HEAP_USAGE -gt 85 ]; then
    echo -e "${RED}✗ High heap usage: ${HEAP_USAGE}%${NC}"
else
    echo -e "${GREEN}✓ Heap usage: ${HEAP_USAGE}%${NC}"
fi

echo "=== Health Check Complete ==="
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Yellow Cluster Status

**Issue**: Single-node cluster shows yellow status due to unassigned replica shards.

**Solution**: This is normal for single-node deployments. For production, either:

```bash
# Option 1: Add more nodes to the cluster
# Option 2: Set replica count to 0 for single node
curl -k -u admin:password -X PUT "https://localhost:9200/_template/wazuh" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["wazuh-*"],
  "settings": {
    "number_of_replicas": 0
  }
}'
```

#### 2. High Memory Usage

**Issue**: OpenSearch consumes too much memory.

**Solution**:

```bash
# Adjust JVM heap settings
sudo nano /etc/opensearch/jvm.options

# Set heap to 50% of available RAM (max 32GB)
-Xms4g
-Xmx4g

# Clear fielddata cache
curl -k -u admin:password -X POST "https://localhost:9200/_cache/clear?fielddata=true"
```

#### 3. Disk Space Issues

**Issue**: Running out of disk space.

**Solution**:

```bash
# Check index sizes
curl -k -u admin:password "https://localhost:9200/_cat/indices?v&s=store.size:desc"

# Delete old indices
curl -k -u admin:password -X DELETE "https://localhost:9200/wazuh-alerts-2023.01.*"

# Set up index lifecycle management
curl -k -u admin:password -X PUT "https://localhost:9200/_template/wazuh-alerts" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["wazuh-alerts-*"],
  "settings": {
    "index.lifecycle.name": "wazuh-policy",
    "index.lifecycle.rollover_alias": "wazuh-alerts"
  }
}'
```

#### 4. Authentication Issues

**Issue**: Cannot authenticate with admin credentials.

**Solution**:

```bash
# Reset admin password
sudo /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
  -cd /etc/opensearch/opensearch-security/ \
  -icl -nhnv \
  -cacert /etc/opensearch/certs/root-ca.pem \
  -cert /etc/opensearch/certs/admin.pem \
  -key /etc/opensearch/certs/admin-key.pem

# Update internal users
sudo nano /etc/opensearch/opensearch-security/internal_users.yml
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### 1. Index Management

```bash
# Force merge old indices (monthly)
curl -k -u admin:password -X POST "https://localhost:9200/wazuh-alerts-2023.12.*/_forcemerge?max_num_segments=1"

# Update index settings for better performance
curl -k -u admin:password -X PUT "https://localhost:9200/wazuh-alerts-*/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "refresh_interval": "30s",
    "number_of_replicas": 0
  }
}'
```

#### 2. Performance Optimization

```bash
# Clear caches
curl -k -u admin:password -X POST "https://localhost:9200/_cache/clear"

# Optimize indices
curl -k -u admin:password -X POST "https://localhost:9200/_optimize?max_num_segments=1"

# Check slow queries
curl -k -u admin:password "https://localhost:9200/_nodes/stats/indices/search?pretty" | jq '.nodes[].indices.search'
```

## Complete Removal

To completely remove OpenSearch from the system:

```bash
# Stop the service
sudo systemctl stop opensearch
sudo systemctl disable opensearch

# Remove the package
sudo apt-get remove --purge opensearch

# Remove configuration directories
sudo rm -rf /etc/opensearch

# Remove data directories
sudo rm -rf /var/lib/opensearch
sudo rm -rf /var/lib/wazuh-indexer
sudo rm -rf /var/log/opensearch
sudo rm -rf /var/log/wazuh-indexer

# Remove the user
sudo userdel opensearch

# Remove systemd files
sudo rm -f /etc/systemd/system/opensearch.service
sudo systemctl daemon-reload

# Remove repository
sudo rm -f /etc/apt/sources.list.d/opensearch-2.x.list

# Check for any remaining files
sudo find / -name "*opensearch*" -type d 2>/dev/null
sudo find / -name "*wazuh-indexer*" -type d 2>/dev/null
```

## Security Considerations

### Production Security Checklist

1. **Change Default Passwords**: Never use default credentials in production
2. **Enable TLS**: Configure proper TLS certificates for all communications
3. **Network Security**: Use firewall rules to restrict access to OpenSearch ports
4. **User Management**: Implement proper role-based access control
5. **Audit Logging**: Enable and monitor security audit logs
6. **Regular Updates**: Keep OpenSearch updated to address security vulnerabilities
7. **Backup Security**: Encrypt backup files and secure backup storage

### Security Configuration Example

```yaml
# Security settings in opensearch.yml
plugins.security.ssl.transport.pemcert_filepath: certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false

plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: certs/node.pem
plugins.security.ssl.http.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: certs/root-ca.pem

plugins.security.authcz.admin_dn:
  - CN=admin,OU=client,O=client,L=Test,C=DE

plugins.security.audit.type: internal_opensearch
plugins.security.audit.config.disabled_rest_categories: NONE
plugins.security.audit.config.disabled_transport_categories: NONE
```

## Production Recommendations

For production environments:

1. **Use Multiple Nodes**: Deploy at least 3 nodes for high availability
2. **Separate Roles**: Use dedicated master nodes for large clusters
3. **Monitor Resources**: Implement comprehensive monitoring with Prometheus/Grafana
4. **Backup Strategy**: Implement automated daily backups with off-site storage
5. **Index Lifecycle**: Configure automatic index rotation and deletion
6. **Load Balancing**: Use a load balancer for client connections
7. **Capacity Planning**: Monitor growth trends and plan for capacity expansion

This guide provides a solid foundation for deploying and managing OpenSearch as a Wazuh indexer in both development and production environments.
