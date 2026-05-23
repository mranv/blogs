---
slug: 'resetting-opensearch-to-fresh-state'

title: "How to Completely Reset OpenSearch and OpenSearch Dashboards to a Fresh State"
description: "A comprehensive guide to resetting OpenSearch and OpenSearch Dashboards, removing all data and configurations for a clean start"
pubDatetime: 2025-01-29T00:00:00Z
author: Anubhav
tags:
  - opensearch
  - elasticsearch
  - devops
  - system-administration
  - troubleshooting
category: DevOps
featured: false
draft: false

---

Sometimes you need to completely reset OpenSearch and OpenSearch Dashboards to start fresh - whether you're dealing with corrupted data, testing configurations, or simply want a clean slate. This guide walks you through the process of completely resetting both services.

## Table of contents

## When to Reset OpenSearch

You might want to reset OpenSearch in these scenarios:

- **Corrupted indices** that can't be recovered
- **Testing purposes** where you need a clean environment
- **Configuration issues** that are easier to reset than fix
- **Learning environments** where you want to start over
- **Development setups** that accumulated too much test data

⚠️ **Warning**: This process will permanently delete ALL your data, including:

- All indices and documents
- All dashboards and visualizations
- All saved searches and filters
- All user configurations and settings

## Prerequisites

Before proceeding, ensure you have:

- Root or sudo access to the server
- Backed up any data you need to preserve
- Documented any custom configurations you want to recreate
- Stopped any applications that depend on OpenSearch

## Step-by-Step Reset Process

### Step 1: Stop the Services

First, stop both OpenSearch and OpenSearch Dashboards services:

```bash
sudo systemctl stop opensearch
sudo systemctl stop opensearch-dashboards
```

Verify the services have stopped:

```bash
sudo systemctl status opensearch
sudo systemctl status opensearch-dashboards
```

### Step 2: Remove OpenSearch Data

Delete all OpenSearch data directories:

```bash
# Default OpenSearch data directory
sudo rm -rf /var/lib/opensearch/*

# Also remove logs if you want them fresh
sudo rm -rf /var/log/opensearch/*
```

If your installation uses custom paths, adjust accordingly. You can find your data path in `/etc/opensearch/opensearch.yml` under the `path.data` setting.

### Step 3: Remove OpenSearch Dashboards Data

Clear OpenSearch Dashboards data:

```bash
# Default OpenSearch Dashboards data directory
sudo rm -rf /var/lib/opensearch-dashboards/*

# Remove logs
sudo rm -rf /var/log/opensearch-dashboards/*
```

### Step 4: Reset Configuration (Optional)

If you want to reset configurations to defaults:

```bash
# Backup current configs first
sudo cp -r /etc/opensearch /etc/opensearch.backup
sudo cp -r /etc/opensearch-dashboards /etc/opensearch-dashboards.backup

# Remove configs (they'll be recreated with defaults)
sudo rm -rf /etc/opensearch/*
sudo rm -rf /etc/opensearch-dashboards/*
```

⚠️ **Note**: Only do this if you want default configurations. If you have custom settings you want to keep, skip this step.

### Step 5: Restart Services

Start OpenSearch first, then OpenSearch Dashboards:

```bash
# Start OpenSearch
sudo systemctl start opensearch

# Wait for OpenSearch to fully start (important!)
sleep 30

# Start OpenSearch Dashboards
sudo systemctl start opensearch-dashboards
```

### Step 6: Verify Services are Running

Check that both services started successfully:

```bash
# Check service status
sudo systemctl status opensearch
sudo systemctl status opensearch-dashboards

# Verify OpenSearch is responding
curl -X GET "localhost:9200"

# Check cluster health
curl -X GET "localhost:9200/_cluster/health?pretty"
```

You should see a response indicating the cluster is healthy (likely with "yellow" status initially for a single-node setup).

## Alternative Reset Methods

### Method 1: Using Delete API (Less Destructive)

If you only want to delete indices but keep configurations:

```bash
# Delete all indices
curl -X DELETE "localhost:9200/*"

# Delete specific indices
curl -X DELETE "localhost:9200/index_name"
```

### Method 2: Docker Reset

If using Docker, simply remove and recreate containers:

```bash
# Stop and remove containers
docker-compose down -v

# Start fresh containers
docker-compose up -d
```

## Common Issues and Troubleshooting

### Service Won't Start After Reset

1. Check permissions on data directories:

```bash
sudo chown -R opensearch:opensearch /var/lib/opensearch
sudo chown -R opensearch-dashboards:opensearch-dashboards /var/lib/opensearch-dashboards
```

2. Check for port conflicts:

```bash
sudo netstat -tulpn | grep -E '9200|5601'
```

### Configuration Errors

If you deleted configurations and services won't start:

1. Reinstall the packages to restore default configs:

```bash
sudo apt-get install --reinstall opensearch opensearch-dashboards
```

### Disk Space Issues

Ensure you have sufficient disk space after deletion:

```bash
df -h /var/lib/opensearch
```

## Post-Reset Tasks

After resetting, you'll need to:

1. **Reconfigure security settings** if you had custom authentication
2. **Recreate index templates** and mappings
3. **Restore any backed-up data** if needed
4. **Reconfigure OpenSearch Dashboards** index patterns
5. **Set up users and roles** again

## Best Practices

1. **Always backup first** - Even if you think you don't need the data
2. **Document your configurations** - Keep track of custom settings
3. **Test in development first** - Never reset production without testing
4. **Use snapshots** - Consider using OpenSearch snapshots for easier recovery
5. **Monitor after reset** - Check logs for any issues after restarting

## Conclusion

Resetting OpenSearch and OpenSearch Dashboards gives you a clean slate but comes with the cost of losing all data and configurations. Always ensure you have proper backups and understand the implications before proceeding. This process is best suited for development environments or situations where data recovery is not possible or needed.

Remember: with great power comes great responsibility - use the reset process wisely!
