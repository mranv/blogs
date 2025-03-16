---
author: Anubhav Gain
pubDatetime: 2024-05-01T10:00:00Z
modDatetime: 2024-05-01T10:00:00Z
title: Comprehensive Elasticsearch/OpenSearch Cluster Health Troubleshooting Guide
slug: elasticsearch-opensearch-cluster-troubleshooting
featured: true
draft: false
tags:
  - elasticsearch
  - opensearch
  - troubleshooting
  - database
  - monitoring
  - devops
  - infrastructure
description: A detailed technical guide for diagnosing and resolving common Elasticsearch and OpenSearch cluster health issues, including practical commands, solutions for yellow/red status, and preventive measures.
---

# Elasticsearch/OpenSearch Cluster Health Troubleshooting Guide

Maintaining a healthy Elasticsearch or OpenSearch cluster is crucial for ensuring optimal performance, data reliability, and system availability. This guide provides a systematic approach to diagnosing and resolving common cluster health issues, with practical commands and solutions that can be applied in various deployment scenarios.

## Initial Assessment

Before attempting any fixes, it's essential to gather information about your cluster's current state. Use these commands to perform an initial assessment:

### Check Cluster Health Status

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/health" \
     -u <username>:<password>
```

The response will include a `status` field that can be:

- **Green**: All primary and replica shards are allocated
- **Yellow**: All primary shards are allocated, but some replica shards are not
- **Red**: Some primary shards are not allocated

### Get Detailed Shard Allocation Explanation

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/allocation/explain" \
     -u <username>:<password>
```

This provides detailed information about why specific shards remain unassigned, helping pinpoint the root cause.

### List Indices with Health Status

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/indices?v&h=index,health,pri,rep,unassign" \
     -u <username>:<password>
```

This command displays a table of indices with their health status, primary shard count, replica count, and unassigned shards—helping identify which indices are problematic.

## Common Issues and Solutions

### 1. Yellow Cluster Status with Unassigned Replicas (Single Node)

**Problem**: In a single-node cluster, replica shards cannot be allocated because the cluster needs at least two nodes to distribute replicas (for high availability).

**Solution**: Disable replicas for all existing indices:

```bash
# Disable replicas for all indices
curl -k -X PUT "https://<elasticsearch-host>:9200/*/_settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index": {
         "number_of_replicas": 0
       }
     }'
```

Set a default template for future indices to prevent the issue from recurring:

```bash
# Set template for future indices
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/default_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": ["*"],
       "settings": {
         "number_of_replicas": 0
       }
     }'
```

> **Note**: For OpenSearch 2.x and Elasticsearch 8.x, use the newer index template API:
>
> ```bash
> curl -k -X PUT "https://<elasticsearch-host>:9200/_index_template/default_template" \
>      -H "Content-Type: application/json" \
>      -u <username>:<password> \
>      -d '{
>        "index_patterns": ["*"],
>        "template": {
>          "settings": {
>            "number_of_replicas": 0
>          }
>        }
>      }'
> ```

### 2. OpenDistro/ISM Index Issues

**Problem**: Index State Management (ISM) related indices often show yellow status in single-node deployments.

**Solution**: Update ISM indices to use zero replicas:

```bash
# Update ISM indices
curl -k -X PUT "https://<elasticsearch-host>:9200/.opendistro-ism*/_settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index": {
         "number_of_replicas": 0
       }
     }'
```

Set an ISM-specific template to ensure future ISM indices have zero replicas:

```bash
# Set ISM template
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/ism_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": [".opendistro-ism*"],
       "settings": {
         "number_of_replicas": 0
       }
     }'
```

### 3. Specific Index Patterns (Wazuh/OpenTelemetry)

**Problem**: Monitoring systems like Wazuh or OpenTelemetry often create indices with default replica settings, causing yellow status.

**Solution**: Create custom templates for these specific index patterns:

```bash
# Update settings for monitoring indices
curl -k -X PUT "https://<elasticsearch-host>:9200/_template/monitoring_template" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "index_patterns": ["wazuh-*", "filebeat-*", "otel-v1-*"],
       "settings": {
         "number_of_replicas": 0
       }
     }'
```

### 4. Red Cluster Status with Unassigned Primary Shards

**Problem**: Some primary shards cannot be allocated, often due to disk space issues, node failures, or corrupt shard data.

**Solution**: First, identify the specific indices with unassigned primary shards:

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/indices?v&health=red" \
     -u <username>:<password>
```

Check disk space on all nodes:

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/allocation?v" \
     -u <username>:<password>
```

If the issue is disk space, free up space or add more storage. If the issue persists, you may need to force allocation of the unassigned shards:

```bash
curl -k -X POST "https://<elasticsearch-host>:9200/_cluster/reroute" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "commands": [
         {
           "allocate_empty_primary": {
             "index": "<index-name>",
             "shard": <shard-number>,
             "node": "<node-name>",
             "accept_data_loss": true
           }
         }
       ]
     }'
```

> **Warning**: The `accept_data_loss` parameter means that any data in the unassigned primary shard will be lost. Use this as a last resort when you're willing to lose the data in that shard or when you have reliable backups.

## Post-Fix Verification

After applying fixes, verify that your cluster has returned to a healthy state:

### Force Cluster Routing Refresh

```bash
curl -k -X POST "https://<elasticsearch-host>:9200/_cluster/reroute?retry_failed=true" \
     -u <username>:<password>
```

### Verify Cluster Health

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/health" \
     -u <username>:<password>
```

### Check Unassigned Shards

```bash
curl -k -X GET "https://<elasticsearch-host>:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason" \
     -u <username>:<password>
```

## Security Considerations

When troubleshooting Elasticsearch/OpenSearch clusters, always keep these security aspects in mind:

### Certificate Management

- Replace the `-k` flag with proper certificate validation in production environments
- Consider implementing mutual TLS authentication
- Store certificates in secure locations with proper permissions

```bash
# Example with proper certificate validation
curl --cacert /path/to/ca.pem \
     -X GET "https://<elasticsearch-host>:9200/_cluster/health" \
     -u <username>:<password>
```

### Credential Management

- Use environment variables for credentials rather than embedding them in scripts
- Implement Role-Based Access Control (RBAC) for cluster management
- Regularly rotate credentials according to your security policy

```bash
# Using environment variables for credentials
curl -k -X GET "https://<elasticsearch-host>:9200/_cluster/health" \
     -u "$ES_USERNAME:$ES_PASSWORD"
```

### Network Security

- Restrict Elasticsearch endpoint access using firewalls and security groups
- Use VPN or private network for cluster communication
- Implement network segmentation to isolate Elasticsearch/OpenSearch clusters

## Preventive Measures

To prevent cluster health issues in the future, consider implementing these preventive measures:

### Configure Disk Watermarks

```bash
curl -k -X PUT "https://<elasticsearch-host>:9200/_cluster/settings" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "persistent": {
         "cluster.routing.allocation.disk.watermark.low": "85%",
         "cluster.routing.allocation.disk.watermark.high": "90%",
         "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
       }
     }'
```

These settings control when Elasticsearch/OpenSearch starts to avoid allocating shards to nodes with high disk usage:

- **Low watermark**: When to stop allocating new shards to a node
- **High watermark**: When to start relocating existing shards from a node
- **Flood stage**: When to enforce a read-only index block

### Set Up Regular Monitoring

Implement monitoring for:

1. **Cluster health status**: Alerts for yellow or red status
2. **Disk usage**: Alerts before reaching watermarks
3. **JVM heap usage**: Alerts for high memory usage
4. **CPU usage**: Alerts for sustained high CPU
5. **Shard counts**: Alerts for excessive shard counts

### Implement Backup Strategy

Regular snapshots protect against data loss:

```bash
# Create a snapshot repository
curl -k -X PUT "https://<elasticsearch-host>:9200/_snapshot/my_backup" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "type": "fs",
       "settings": {
         "location": "/path/to/backup/directory"
       }
     }'

# Create a snapshot
curl -k -X PUT "https://<elasticsearch-host>:9200/_snapshot/my_backup/snapshot_1" \
     -H "Content-Type: application/json" \
     -u <username>:<password> \
     -d '{
       "indices": "*",
       "ignore_unavailable": true
     }'
```

## Best Practices for Maintaining Cluster Health

1. **Index Management**:

   - Use Index Lifecycle Management (ILM) or Index State Management (ISM)
   - Set appropriate shard counts (not too many, not too few)
   - Regularly delete or archive old indices

2. **Resource Planning**:

   - Plan for adequate disk space (with room for growth)
   - Allocate sufficient memory for JVM heap (typically 50% of RAM, not exceeding 32GB)
   - Monitor and adjust resources based on usage patterns

3. **Configuration Tuning**:

   - Optimize refresh intervals for write-heavy workloads
   - Configure merge policies appropriate for your use case
   - Set appropriate replica counts based on your availability requirements

4. **Regular Maintenance**:
   - Schedule regular cluster restarts during off-peak hours
   - Apply security patches promptly
   - Review logs for warning signs

## Conclusion

Maintaining a healthy Elasticsearch or OpenSearch cluster requires proactive monitoring, regular maintenance, and quick response to issues when they arise. By following the troubleshooting steps and preventive measures outlined in this guide, you can ensure your search infrastructure remains reliable and performant.

Remember that each environment is unique, and you may need to adapt these recommendations to your specific deployment. Always test changes in a non-production environment first, and ensure you have recent backups before making significant changes to your cluster configuration.

For more detailed information, refer to the official documentation for your specific version of Elasticsearch or OpenSearch.
