---
title: "Elasticsearch and OpenSearch Cluster Health Troubleshooting Guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-28T15:00:00Z
featured: true
draft: false
tags:
  - elasticsearch
  - opensearch
  - cluster-health
  - troubleshooting
  - siem
  - monitoring
description: "Complete troubleshooting guide for Elasticsearch and OpenSearch cluster health issues, including yellow status fixes, unassigned shards resolution, and security best practices."
---

# Elasticsearch and OpenSearch Cluster Health Troubleshooting Guide

Maintaining healthy Elasticsearch and OpenSearch clusters is crucial for any SIEM or log analytics infrastructure. This comprehensive guide covers common cluster health issues, their diagnosis, and secure resolution methods.

## Table of Contents

- [Initial Assessment](#initial-assessment)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Security Considerations](#security-considerations)
- [Preventive Measures](#preventive-measures)
- [Monitoring and Alerting](#monitoring-and-alerting)

## Initial Assessment

Before implementing any fixes, perform a thorough assessment of your cluster's current state.

### Basic Health Check

```bash
# Check overall cluster health
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/health?pretty" \
     -u <username>:<password>

# Expected output format:
{
  "cluster_name" : "your-cluster",
  "status" : "yellow",
  "timed_out" : false,
  "number_of_nodes" : 1,
  "number_of_data_nodes" : 1,
  "active_primary_shards" : 15,
  "active_shards" : 15,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 5,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 75.0
}
```

### Detailed Shard Analysis

```bash
# Get detailed shard allocation explanation
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/allocation/explain?pretty" \
     -u <username>:<password>

# List indices with detailed health status
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/indices?v&h=index,health,status,pri,rep,docs.count,store.size,unassign.shards" \
     -u <username>:<password>

# Check specific shard allocation
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason" \
     -u <username>:<password>
```

### Node Information

```bash
# Check node information and resources
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/nodes?v&h=name,heap.percent,ram.percent,cpu,load_1m,disk.used_percent,node.role,master" \
     -u <username>:<password>

# Get cluster settings
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/settings?pretty" \
     -u <username>:<password>
```

## Common Issues and Solutions

### 1. Yellow Cluster Status with Unassigned Replicas (Single Node)

**Problem**: In single-node clusters, replica shards cannot be allocated, causing yellow status.

**Root Cause**: Elasticsearch/OpenSearch cannot place replica shards on the same node as primary shards for redundancy.

**Solution**: Disable replicas for single-node deployments.

```bash
# Disable replicas for all existing indices
curl -k -X PUT "https://<elasticsearch-host>:9200/*/_settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index": {
         "number_of_replicas": 0
       }
     }'

# Set template for future indices
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/default_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": ["*"],
       "settings": {
         "number_of_replicas": 0
       },
       "order": 1
     }'

# Verify template creation
curl -k -X GET "https://<elasticsearch-host>:9200/_template/default_template?pretty" \
     -u <username>:<password>
```

### 2. OpenDistro/ISM Index Issues

**Problem**: OpenDistro Index State Management indices showing yellow status.

**Root Cause**: ISM indices created with default replica settings.

**Solution**: Update ISM-specific indices and create dedicated templates.

```bash
# Update existing ISM indices
curl -k -X PUT "https://<elasticsearch-host>:9200/.opendistro-ism*/_settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index": {
         "number_of_replicas": 0
       }
     }'

# Create ISM-specific template
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/ism_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": [".opendistro-ism*", ".opensearch-ism*"],
       "settings": {
         "number_of_replicas": 0,
         "index": {
           "auto_expand_replicas": "0-1"
         }
       },
       "order": 10
     }'

# Update OpenSearch security indices
curl -k -X PUT "https://<elasticsearch-host>:9200/.opensearch-*/_settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index": {
         "number_of_replicas": 0
       }
     }'
```

### 3. Monitoring and Security Index Issues

**Problem**: Wazuh, Filebeat, or other monitoring indices showing unassigned shards.

**Root Cause**: Default templates creating replicas in single-node environments.

**Solution**: Create comprehensive monitoring templates.

```bash
# Create monitoring indices template
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/monitoring_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": [
         "wazuh-*",
         "filebeat-*",
         "otel-v1-*",
         "logstash-*",
         "metricbeat-*",
         "winlogbeat-*"
       ],
       "settings": {
         "number_of_replicas": 0,
         "index": {
           "lifecycle": {
             "name": "monitoring_policy",
             "rollover_alias": "monitoring"
           }
         }
       },
       "order": 5
     }'

# Update existing monitoring indices
indices=("wazuh-*" "filebeat-*" "otel-v1-*" "logstash-*")
for pattern in "${indices[@]}"; do
  curl -k -X PUT "https://<elasticsearch-host>:9200/${pattern}/_settings" \
       -H "Content-Type: application/json" \
       -u <username>:<password> \
       -d '{
         "index": {
           "number_of_replicas": 0
         }
       }'
done
```

### 4. Disk Space Issues

**Problem**: Cluster showing red status due to disk space constraints.

**Solution**: Implement disk management and cleanup procedures.

```bash
# Check disk usage by index
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/indices?v&s=store.size:desc&h=index,store.size,docs.count" \
     -u <username>:<password>

# Configure disk watermarks
curl -k -X PUT "https://<elasticsearch-host>:9200/_cluster/settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "persistent": {
         "cluster.routing.allocation.disk.watermark.low": "85%",
         "cluster.routing.allocation.disk.watermark.high": "90%",
         "cluster.routing.allocation.disk.watermark.flood_stage": "95%",
         "cluster.routing.allocation.disk.include_relocations": false
       }
     }'

# Delete old indices (be very careful with this command)
# List indices older than 30 days
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/indices?v&s=creation.date" \
     -u <username>:<password>

# Example: Delete specific old index (replace with actual index name)
# curl -k -X DELETE "https://<elasticsearch-host>:9200/old-index-name" \
#      -u <username>:<password>
```

### 5. Shard Allocation Issues

**Problem**: Shards stuck in initializing or relocating state.

**Solution**: Force shard allocation and resolve allocation issues.

```bash
# Check allocation filters
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/settings?pretty&include_defaults=true" \
     -u <username>:<password>

# Clear allocation filters if present
curl -k -X PUT "https://<elasticsearch-host>:9200/_cluster/settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "persistent": {
         "cluster.routing.allocation.include._name": null,
         "cluster.routing.allocation.exclude._name": null,
         "cluster.routing.allocation.require._name": null
       }
     }'

# Force allocation of unassigned shards
curl -k -X POST "https://<elasticsearch-host>:9200/_cluster/reroute?retry_failed=true" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "commands": [
         {
           "allocate_empty_primary": {
             "index": "problem-index",
             "shard": 0,
             "node": "node-name",
             "accept_data_loss": true
           }
         }
       ]
     }'
```

## Post-Fix Verification

After implementing fixes, verify the cluster health:

```bash
# Force cluster routing refresh
curl -k -X POST "https://<elasticsearch-host>:9200/_cluster/reroute?retry_failed=true" \
     -u <username>:<password>

# Wait a few moments and check health
sleep 30
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/health?pretty" \
     -u <username>:<password>

# Verify no unassigned shards
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/shards?v&h=index,shard,prirep,state" \
     -u <username>:<password> | grep UNASSIGNED

# Check cluster stats
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/stats?pretty" \
     -u <username>:<password>
```

## Security Considerations

### Certificate Management

Replace `-k` flag with proper certificate validation:

```bash
# Use proper certificate validation
curl --cacert /path/to/ca.crt \
     -X GET "https://<elasticsearch-host>:9200/_cluster/health" \
     -u <username>:<password>

# For client certificates
curl --cert /path/to/client.crt \
     --key /path/to/client.key \
     --cacert /path/to/ca.crt \
     -X GET "https://<elasticsearch-host>:9200/_cluster/health"
```

### Credential Management

```bash
# Use environment variables for credentials
export ES_USERNAME="admin"
export ES_PASSWORD="your-secure-password"
export ES_HOST="https://elasticsearch:9200"

# Create a secure wrapper script
cat > es_health_check.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Load credentials from secure location
source /etc/elasticsearch/credentials

curl --cacert /etc/elasticsearch/certs/ca.crt \
     -X GET "${ES_HOST}/_cluster/health?pretty" \
     -u "${ES_USERNAME}:${ES_PASSWORD}"
EOF

chmod 700 es_health_check.sh
```

### RBAC Implementation

```bash
# Create a dedicated monitoring role
curl -k -X PUT "https://<elasticsearch-host>:9200/_security/role/cluster_monitor" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "cluster": ["monitor", "manage"],
       "indices": [
         {
           "names": ["*"],
           "privileges": ["monitor"]
         }
       ]
     }'

# Create monitoring user
curl -k -X PUT "https://<elasticsearch-host>:9200/_security/user/monitor_user" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "password": "secure-monitor-password",
       "roles": ["cluster_monitor"],
       "full_name": "Cluster Monitor User"
     }'
```

### Network Security

```bash
# Implement firewall rules
sudo ufw allow from 192.168.1.0/24 to any port 9200
sudo ufw allow from 192.168.1.0/24 to any port 9300

# Configure elasticsearch.yml for network binding
echo "network.host: 192.168.1.100" >> /etc/elasticsearch/elasticsearch.yml
echo "discovery.seed_hosts: [\"192.168.1.100\", \"192.168.1.101\"]" >> /etc/elasticsearch/elasticsearch.yml
```

## Preventive Measures

### Monitoring Setup

```bash
# Configure cluster-level monitoring
curl -k -X PUT "https://<elasticsearch-host>:9200/_cluster/settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "persistent": {
         "cluster.routing.allocation.cluster_concurrent_rebalance": 2,
         "cluster.routing.allocation.node_concurrent_recoveries": 2,
         "cluster.routing.allocation.node_initial_primaries_recoveries": 4
       }
     }'

# Set up index lifecycle management
curl -k -X PUT "https://<elasticsearch-host>:9200/_ilm/policy/monitoring_policy" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "policy": {
         "phases": {
           "hot": {
             "actions": {
               "rollover": {
                 "max_size": "10GB",
                 "max_age": "7d"
               }
             }
           },
           "warm": {
             "min_age": "7d",
             "actions": {
               "shrink": {
                 "number_of_shards": 1
               }
             }
           },
           "cold": {
             "min_age": "30d",
             "actions": {
               "readonly": {}
             }
           },
           "delete": {
             "min_age": "90d",
             "actions": {
               "delete": {}
             }
           }
         }
       }
     }'
```

### Backup Strategy

```bash
# Configure snapshot repository
curl -k -X PUT "https://<elasticsearch-host>:9200/_snapshot/backup_repo" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "type": "fs",
       "settings": {
         "location": "/backup/elasticsearch",
         "compress": true,
         "chunk_size": "100MB"
       }
     }'

# Create automated backup script
cat > backup_cluster.sh << 'EOF'
#!/bin/bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="backup_${DATE}"

curl -k -X PUT "https://elasticsearch:9200/_snapshot/backup_repo/${SNAPSHOT_NAME}?wait_for_completion=true" \
     -H "Content-Type: application/json" \
     -u "${ES_USERNAME}:${ES_PASSWORD}" \
     -d '{
       "indices": "*",
       "include_global_state": true,
       "ignore_unavailable": true
     }'

echo "Backup completed: ${SNAPSHOT_NAME}"
EOF

chmod +x backup_cluster.sh
```

### Health Monitoring Script

```bash
# Create comprehensive health monitoring script
cat > cluster_health_monitor.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Configuration
ES_HOST="${ES_HOST:-https://localhost:9200}"
ES_USER="${ES_USER:-admin}"
ES_PASS="${ES_PASS:-password}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@company.com}"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check cluster health
health_status=$(curl -s -k -u "${ES_USER}:${ES_PASS}" \
  "${ES_HOST}/_cluster/health" | jq -r '.status')

case $health_status in
  "green")
    echo -e "${GREEN}✓ Cluster health: $health_status${NC}"
    ;;
  "yellow")
    echo -e "${YELLOW}⚠ Cluster health: $health_status${NC}"
    # Add notification logic here
    ;;
  "red")
    echo -e "${RED}✗ Cluster health: $health_status${NC}"
    # Add critical alert logic here
    ;;
esac

# Check disk usage
disk_usage=$(df -h /var/lib/elasticsearch | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
  echo -e "${RED}✗ High disk usage: ${disk_usage}%${NC}"
else
  echo -e "${GREEN}✓ Disk usage: ${disk_usage}%${NC}"
fi

# Check unassigned shards
unassigned=$(curl -s -k -u "${ES_USER}:${ES_PASS}" \
  "${ES_HOST}/_cluster/health" | jq -r '.unassigned_shards')

if [ "$unassigned" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Unassigned shards: $unassigned${NC}"
else
  echo -e "${GREEN}✓ All shards assigned${NC}"
fi

# Check node status
nodes=$(curl -s -k -u "${ES_USER}:${ES_PASS}" \
  "${ES_HOST}/_cat/nodes?h=name,heap.percent,disk.used_percent" | \
  while read name heap disk; do
    if [ "${heap%.*}" -gt 85 ]; then
      echo -e "${RED}✗ Node $name high heap: $heap${NC}"
    elif [ "${disk%.*}" -gt 85 ]; then
      echo -e "${YELLOW}⚠ Node $name high disk: $disk${NC}"
    else
      echo -e "${GREEN}✓ Node $name healthy${NC}"
    fi
  done)

echo "$nodes"
EOF

chmod +x cluster_health_monitor.sh
```

## Monitoring and Alerting

### Prometheus Integration

```yaml
# prometheus.yml excerpt
scrape_configs:
  - job_name: "elasticsearch"
    static_configs:
      - targets: ["elasticsearch:9200"]
    metrics_path: "/_prometheus/metrics"
    basic_auth:
      username: "monitor_user"
      password: "secure-password"
```

### Grafana Dashboard

Key metrics to monitor:

- Cluster health status
- Node availability
- Heap usage percentage
- Disk usage percentage
- Unassigned shard count
- Search and indexing rates
- JVM garbage collection metrics

### Alerting Rules

```yaml
# alerting_rules.yml
groups:
  - name: elasticsearch
    rules:
      - alert: ElasticsearchClusterYellow
        expr: elasticsearch_cluster_health_status{color="yellow"} == 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Elasticsearch cluster status is yellow"

      - alert: ElasticsearchClusterRed
        expr: elasticsearch_cluster_health_status{color="red"} == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Elasticsearch cluster status is red"

      - alert: ElasticsearchHighHeapUsage
        expr: elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Elasticsearch node heap usage is high"
```

## Best Practices

1. **Regular Health Checks**: Implement automated monitoring with appropriate alerting thresholds
2. **Capacity Planning**: Monitor trends and plan for capacity expansion before issues occur
3. **Index Lifecycle Management**: Implement proper ILM policies to manage data retention
4. **Security Updates**: Keep clusters updated with security patches
5. **Backup Verification**: Regularly test backup and restore procedures
6. **Documentation**: Maintain runbooks for common issues and procedures

## Conclusion

Maintaining healthy Elasticsearch and OpenSearch clusters requires proactive monitoring, proper configuration, and systematic troubleshooting approaches. This guide provides the foundation for identifying and resolving common cluster health issues while maintaining security best practices.

Remember to:

- Always backup configurations before making changes
- Test fixes in staging environments first
- Monitor cluster health continuously
- Implement proper security measures
- Document all changes and procedures

Regular maintenance and monitoring will help prevent most cluster health issues and ensure optimal performance for your SIEM and analytics infrastructure.
