---
author: Anubhav Gain
pubDatetime: 2025-01-28T18:30:00Z
title: "Wazuh Snapshot Migration: Complete Backup and Restore Guide"
slug: wazuh-snapshot-migration-guide
featured: false
draft: false
tags:
  - wazuh
  - backup
  - migration
  - opensearch
  - elasticsearch
description: "A comprehensive guide to creating, managing, and migrating Wazuh snapshots across different environments, including automated backup strategies and disaster recovery procedures."
---

## Table of Contents

## Introduction

Wazuh snapshot migration is crucial for maintaining business continuity, disaster recovery, and system upgrades. This guide covers comprehensive strategies for creating, managing, and migrating Wazuh snapshots across different environments, including automated backup procedures and best practices.

## Understanding Wazuh Snapshots

Wazuh snapshots are point-in-time backups that capture:

- **Index Data**: All security alerts, events, and monitoring data
- **Cluster Settings**: Configuration and mappings
- **Security Configuration**: Users, roles, and policies
- **Custom Rules and Decoders**: Security logic and parsing rules

## Snapshot Repository Configuration

### File System Repository Setup

```bash
#!/bin/bash
# setup-snapshot-repository.sh - Configure snapshot repository

REPO_NAME="wazuh-backups"
REPO_PATH="/opt/wazuh-backups"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

# Create backup directory
sudo mkdir -p $REPO_PATH
sudo chown -R wazuh-indexer:wazuh-indexer $REPO_PATH
sudo chmod 755 $REPO_PATH

# Add repository path to opensearch.yml
echo "path.repo: [$REPO_PATH]" | sudo tee -a /etc/wazuh-indexer/opensearch.yml

# Restart Wazuh indexer
sudo systemctl restart wazuh-indexer

# Wait for service to start
sleep 30

# Register snapshot repository
curl -k -u $USERNAME:$PASSWORD -X PUT "$WAZUH_URL/_snapshot/$REPO_NAME" \
  -H 'Content-Type: application/json' \
  -d "{
    \"type\": \"fs\",
    \"settings\": {
      \"location\": \"$REPO_PATH\",
      \"compress\": true,
      \"chunk_size\": \"100mb\",
      \"max_restore_bytes_per_sec\": \"40mb\",
      \"max_snapshot_bytes_per_sec\": \"40mb\"
    }
  }"

# Verify repository
curl -k -u $USERNAME:$PASSWORD -X GET "$WAZUH_URL/_snapshot/$REPO_NAME?pretty"

echo "Snapshot repository '$REPO_NAME' configured successfully"
```

### S3 Repository Configuration

```bash
#!/bin/bash
# setup-s3-repository.sh - Configure S3 snapshot repository

REPO_NAME="wazuh-s3-backups"
S3_BUCKET="your-wazuh-backups"
S3_REGION="us-east-1"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"
AWS_ACCESS_KEY="your-access-key"
AWS_SECRET_KEY="your-secret-key"

# Install repository-s3 plugin if not already installed
sudo /usr/share/wazuh-indexer/bin/opensearch-plugin install repository-s3

# Restart Wazuh indexer
sudo systemctl restart wazuh-indexer
sleep 30

# Add AWS credentials to keystore
echo "$AWS_ACCESS_KEY" | sudo /usr/share/wazuh-indexer/bin/opensearch-keystore add s3.client.default.access_key
echo "$AWS_SECRET_KEY" | sudo /usr/share/wazuh-indexer/bin/opensearch-keystore add s3.client.default.secret_key

# Restart again to load credentials
sudo systemctl restart wazuh-indexer
sleep 30

# Register S3 repository
curl -k -u $USERNAME:$PASSWORD -X PUT "$WAZUH_URL/_snapshot/$REPO_NAME" \
  -H 'Content-Type: application/json' \
  -d "{
    \"type\": \"s3\",
    \"settings\": {
      \"bucket\": \"$S3_BUCKET\",
      \"region\": \"$S3_REGION\",
      \"base_path\": \"wazuh-snapshots\",
      \"compress\": true,
      \"chunk_size\": \"100mb\",
      \"server_side_encryption\": true,
      \"storage_class\": \"standard_ia\"
    }
  }"

# Verify repository
curl -k -u $USERNAME:$PASSWORD -X GET "$WAZUH_URL/_snapshot/$REPO_NAME?pretty"

echo "S3 snapshot repository '$REPO_NAME' configured successfully"
```

## Creating Snapshots

### Manual Snapshot Creation

```bash
#!/bin/bash
# create-manual-snapshot.sh - Create manual Wazuh snapshot

REPO_NAME="wazuh-backups"
SNAPSHOT_NAME="manual-snapshot-$(date +%Y%m%d-%H%M%S)"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

echo "Creating snapshot: $SNAPSHOT_NAME"

# Create snapshot with all indices
curl -k -u $USERNAME:$PASSWORD -X PUT "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "*",
    "ignore_unavailable": true,
    "include_global_state": true,
    "metadata": {
      "description": "Manual backup of all Wazuh data",
      "created_by": "manual_script",
      "environment": "production"
    }
  }'

echo -e "\nSnapshot creation completed"

# Verify snapshot
curl -k -u $USERNAME:$PASSWORD -X GET "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?pretty"
```

### Selective Index Snapshot

```bash
#!/bin/bash
# create-selective-snapshot.sh - Create snapshot of specific indices

REPO_NAME="wazuh-backups"
SNAPSHOT_NAME="alerts-snapshot-$(date +%Y%m%d-%H%M%S)"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

# Define indices to backup (alerts only)
INDICES="wazuh-alerts-*"

echo "Creating selective snapshot: $SNAPSHOT_NAME"
echo "Indices: $INDICES"

# Create snapshot with specific indices
curl -k -u $USERNAME:$PASSWORD -X PUT "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d "{
    \"indices\": \"$INDICES\",
    \"ignore_unavailable\": true,
    \"include_global_state\": false,
    \"metadata\": {
      \"description\": \"Backup of Wazuh alerts indices only\",
      \"created_by\": \"selective_script\",
      \"indices_pattern\": \"$INDICES\"
    }
  }"

echo -e "\nSelective snapshot creation completed"

# Show snapshot details
curl -k -u $USERNAME:$PASSWORD -X GET "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?pretty"
```

## Automated Backup Strategies

### Comprehensive Backup Script

```bash
#!/bin/bash
# wazuh-backup-manager.sh - Comprehensive backup management script

# Configuration
CONFIG_FILE="/etc/wazuh-backup/config.conf"
LOG_FILE="/var/log/wazuh-backup.log"
REPO_NAME="wazuh-backups"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"
RETENTION_DAYS=30
MAX_SNAPSHOTS=50
BACKUP_PREFIX="auto"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Load configuration if exists
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Function to check Wazuh indexer health
check_cluster_health() {
    local health_status
    health_status=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/health" | jq -r '.status')
    
    if [ "$health_status" != "green" ] && [ "$health_status" != "yellow" ]; then
        log "ERROR: Cluster health is $health_status. Aborting backup."
        return 1
    fi
    
    log "INFO: Cluster health is $health_status. Proceeding with backup."
    return 0
}

# Function to get cluster stats
get_cluster_stats() {
    local stats
    stats=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/stats")
    
    local node_count
    local index_count
    local doc_count
    local store_size
    
    node_count=$(echo "$stats" | jq -r '.nodes.count.total')
    index_count=$(echo "$stats" | jq -r '.indices.count')
    doc_count=$(echo "$stats" | jq -r '.indices.docs.count')
    store_size=$(echo "$stats" | jq -r '.indices.store.size_in_bytes')
    
    log "INFO: Cluster stats - Nodes: $node_count, Indices: $index_count, Documents: $doc_count, Size: $(($store_size / 1024 / 1024 / 1024))GB"
}

# Function to create snapshot
create_snapshot() {
    local snapshot_name="$1"
    local indices="$2"
    local include_global_state="$3"
    
    log "INFO: Creating snapshot: $snapshot_name"
    
    local response
    response=$(curl -s -k -u "$USERNAME:$PASSWORD" -X PUT "$WAZUH_URL/_snapshot/$REPO_NAME/$snapshot_name?wait_for_completion=true" \
      -H 'Content-Type: application/json' \
      -d "{
        \"indices\": \"$indices\",
        \"ignore_unavailable\": true,
        \"include_global_state\": $include_global_state,
        \"metadata\": {
          \"description\": \"Automated backup - $(date)\",
          \"created_by\": \"backup_script\",
          \"backup_type\": \"$BACKUP_PREFIX\",
          \"retention_days\": $RETENTION_DAYS
        }
      }")
    
    local state
    state=$(echo "$response" | jq -r '.snapshot.state')
    
    if [ "$state" = "SUCCESS" ]; then
        local duration
        local indices_count
        local shards_total
        local size_bytes
        
        duration=$(echo "$response" | jq -r '.snapshot.duration_in_millis')
        indices_count=$(echo "$response" | jq -r '.snapshot.indices | length')
        shards_total=$(echo "$response" | jq -r '.snapshot.shards.total')
        size_bytes=$(echo "$response" | jq -r '.snapshot.size_in_bytes')
        
        log "INFO: Snapshot $snapshot_name completed successfully"
        log "INFO: Duration: $((duration / 1000))s, Indices: $indices_count, Shards: $shards_total, Size: $(($size_bytes / 1024 / 1024))MB"
        return 0
    else
        local failure_reason
        failure_reason=$(echo "$response" | jq -r '.snapshot.failures[0].reason // "Unknown error"')
        log "ERROR: Snapshot $snapshot_name failed: $failure_reason"
        return 1
    fi
}

# Function to list snapshots
list_snapshots() {
    curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$REPO_NAME/_all" | jq -r '.snapshots[].snapshot'
}

# Function to delete old snapshots
cleanup_old_snapshots() {
    log "INFO: Starting snapshot cleanup (retention: $RETENTION_DAYS days)"
    
    local cutoff_date
    cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    local snapshots
    snapshots=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$REPO_NAME/_all")
    
    local deleted_count=0
    
    echo "$snapshots" | jq -r '.snapshots[] | select(.snapshot | startswith("'$BACKUP_PREFIX'")) | .snapshot' | while read -r snapshot_name; do
        # Extract date from snapshot name (assuming format: prefix-YYYYMMDD-HHMMSS)
        local snapshot_date
        snapshot_date=$(echo "$snapshot_name" | grep -o '[0-9]\{8\}' | head -1)
        
        if [ -n "$snapshot_date" ] && [ "$snapshot_date" -lt "$cutoff_date" ]; then
            log "INFO: Deleting old snapshot: $snapshot_name (date: $snapshot_date)"
            
            local delete_response
            delete_response=$(curl -s -k -u "$USERNAME:$PASSWORD" -X DELETE "$WAZUH_URL/_snapshot/$REPO_NAME/$snapshot_name")
            
            if echo "$delete_response" | jq -e '.acknowledged' > /dev/null; then
                log "INFO: Successfully deleted snapshot: $snapshot_name"
                deleted_count=$((deleted_count + 1))
            else
                log "ERROR: Failed to delete snapshot: $snapshot_name"
            fi
        fi
    done
    
    log "INFO: Cleanup completed. Deleted $deleted_count snapshots."
}

# Function to enforce maximum snapshot count
enforce_max_snapshots() {
    log "INFO: Enforcing maximum snapshot count: $MAX_SNAPSHOTS"
    
    local snapshots
    snapshots=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$REPO_NAME/_all")
    
    local snapshot_count
    snapshot_count=$(echo "$snapshots" | jq -r '[.snapshots[] | select(.snapshot | startswith("'$BACKUP_PREFIX'"))] | length')
    
    if [ "$snapshot_count" -gt "$MAX_SNAPSHOTS" ]; then
        local excess_count
        excess_count=$((snapshot_count - MAX_SNAPSHOTS))
        
        log "INFO: Found $snapshot_count snapshots, removing $excess_count oldest ones"
        
        echo "$snapshots" | jq -r '[.snapshots[] | select(.snapshot | startswith("'$BACKUP_PREFIX'"))] | sort_by(.start_time_in_millis) | .[0:'$excess_count'] | .[].snapshot' | while read -r snapshot_name; do
            log "INFO: Deleting excess snapshot: $snapshot_name"
            curl -s -k -u "$USERNAME:$PASSWORD" -X DELETE "$WAZUH_URL/_snapshot/$REPO_NAME/$snapshot_name" > /dev/null
        done
    fi
}

# Function to verify snapshot integrity
verify_snapshot() {
    local snapshot_name="$1"
    
    log "INFO: Verifying snapshot: $snapshot_name"
    
    local response
    response=$(curl -s -k -u "$USERNAME:$PASSWORD" -X GET "$WAZUH_URL/_snapshot/$REPO_NAME/$snapshot_name")
    
    local state
    state=$(echo "$response" | jq -r '.snapshots[0].state')
    
    if [ "$state" = "SUCCESS" ]; then
        log "INFO: Snapshot $snapshot_name verification successful"
        return 0
    else
        log "ERROR: Snapshot $snapshot_name verification failed (state: $state)"
        return 1
    fi
}

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Example: Send email notification
    if command -v mail > /dev/null; then
        echo "$message" | mail -s "Wazuh Backup $status" admin@example.com
    fi
    
    # Example: Send Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Wazuh Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Main backup function
main_backup() {
    local backup_type="$1"
    
    log "INFO: Starting Wazuh backup process (type: $backup_type)"
    
    # Check cluster health
    if ! check_cluster_health; then
        send_notification "FAILED" "Cluster health check failed"
        exit 1
    fi
    
    # Get cluster stats
    get_cluster_stats
    
    # Create snapshot name with timestamp
    local snapshot_name="${BACKUP_PREFIX}-${backup_type}-$(date +%Y%m%d-%H%M%S)"
    
    # Determine what to backup based on type
    case "$backup_type" in
        "full")
            local indices="*"
            local include_global_state="true"
            ;;
        "alerts")
            local indices="wazuh-alerts-*"
            local include_global_state="false"
            ;;
        "monitoring")
            local indices="wazuh-monitoring-*"
            local include_global_state="false"
            ;;
        "system")
            local indices=".opendistro-*,.opensearch-*"
            local include_global_state="true"
            ;;
        *)
            log "ERROR: Unknown backup type: $backup_type"
            exit 1
            ;;
    esac
    
    # Create snapshot
    if create_snapshot "$snapshot_name" "$indices" "$include_global_state"; then
        # Verify snapshot
        if verify_snapshot "$snapshot_name"; then
            log "INFO: Backup process completed successfully"
            send_notification "SUCCESS" "Backup $snapshot_name completed successfully"
        else
            log "ERROR: Snapshot verification failed"
            send_notification "FAILED" "Backup $snapshot_name verification failed"
            exit 1
        fi
    else
        log "ERROR: Snapshot creation failed"
        send_notification "FAILED" "Backup $snapshot_name creation failed"
        exit 1
    fi
    
    # Cleanup old snapshots
    cleanup_old_snapshots
    
    # Enforce maximum snapshot count
    enforce_max_snapshots
    
    log "INFO: Backup process completed"
}

# Command line interface
case "${1:-full}" in
    "full"|"alerts"|"monitoring"|"system")
        main_backup "$1"
        ;;
    "list")
        echo "Available snapshots:"
        list_snapshots
        ;;
    "cleanup")
        cleanup_old_snapshots
        ;;
    "verify")
        if [ -n "$2" ]; then
            verify_snapshot "$2"
        else
            echo "Usage: $0 verify <snapshot_name>"
            exit 1
        fi
        ;;
    "health")
        check_cluster_health
        get_cluster_stats
        ;;
    *)
        echo "Usage: $0 {full|alerts|monitoring|system|list|cleanup|verify|health}"
        echo "  full       - Backup all indices and cluster state"
        echo "  alerts     - Backup only alert indices"
        echo "  monitoring - Backup only monitoring indices"
        echo "  system     - Backup only system indices"
        echo "  list       - List all snapshots"
        echo "  cleanup    - Remove old snapshots"
        echo "  verify     - Verify snapshot integrity"
        echo "  health     - Check cluster health and stats"
        exit 1
        ;;
esac
```

### Cron Job Configuration

```bash
#!/bin/bash
# setup-backup-cron.sh - Configure automated backup schedule

BACKUP_SCRIPT="/opt/wazuh-backup/wazuh-backup-manager.sh"
LOG_DIR="/var/log/wazuh-backup"

# Create directories
sudo mkdir -p "$(dirname "$BACKUP_SCRIPT")"
sudo mkdir -p "$LOG_DIR"

# Create cron jobs
sudo tee /etc/cron.d/wazuh-backup << 'EOF'
# Wazuh backup schedule
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Full backup daily at 2 AM
0 2 * * * root /opt/wazuh-backup/wazuh-backup-manager.sh full >> /var/log/wazuh-backup/full-backup.log 2>&1

# Alerts backup every 6 hours
0 */6 * * * root /opt/wazuh-backup/wazuh-backup-manager.sh alerts >> /var/log/wazuh-backup/alerts-backup.log 2>&1

# Monitoring backup daily at 3 AM
0 3 * * * root /opt/wazuh-backup/wazuh-backup-manager.sh monitoring >> /var/log/wazuh-backup/monitoring-backup.log 2>&1

# Cleanup weekly on Sunday at 4 AM
0 4 * * 0 root /opt/wazuh-backup/wazuh-backup-manager.sh cleanup >> /var/log/wazuh-backup/cleanup.log 2>&1

# Health check every hour
0 * * * * root /opt/wazuh-backup/wazuh-backup-manager.sh health >> /var/log/wazuh-backup/health.log 2>&1
EOF

echo "Cron jobs configured for automated Wazuh backups"
```

## Snapshot Restoration

### Complete Cluster Restore

```bash
#!/bin/bash
# restore-wazuh-cluster.sh - Complete cluster restoration

REPO_NAME="wazuh-backups"
SNAPSHOT_NAME="$1"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

if [ -z "$SNAPSHOT_NAME" ]; then
    echo "Usage: $0 <snapshot_name>"
    echo "Available snapshots:"
    curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$REPO_NAME/_all" | jq -r '.snapshots[].snapshot'
    exit 1
fi

echo "Starting cluster restoration from snapshot: $SNAPSHOT_NAME"

# Step 1: Stop Wazuh services
echo "Stopping Wazuh services..."
sudo systemctl stop wazuh-manager
sudo systemctl stop wazuh-dashboard

# Step 2: Check if indices exist and close them
echo "Checking existing indices..."
INDICES=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cat/indices?h=index" | grep -E '^(wazuh|\.)' || true)

if [ -n "$INDICES" ]; then
    echo "Closing existing indices..."
    echo "$INDICES" | while read -r index; do
        if [ -n "$index" ]; then
            curl -s -k -u "$USERNAME:$PASSWORD" -X POST "$WAZUH_URL/$index/_close"
        fi
    done
fi

# Step 3: Restore snapshot
echo "Restoring snapshot..."
RESTORE_RESPONSE=$(curl -s -k -u "$USERNAME:$PASSWORD" -X POST "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME/_restore?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d '{
    "ignore_unavailable": true,
    "include_global_state": true,
    "rename_pattern": "(.+)",
    "rename_replacement": "$1",
    "include_aliases": true
  }')

# Check restore status
if echo "$RESTORE_RESPONSE" | jq -e '.snapshot.state == "SUCCESS"' > /dev/null; then
    echo "Snapshot restore completed successfully"
    
    # Show restored indices
    echo "Restored indices:"
    echo "$RESTORE_RESPONSE" | jq -r '.snapshot.indices[]'
else
    echo "Snapshot restore failed:"
    echo "$RESTORE_RESPONSE" | jq -r '.error.reason // "Unknown error"'
    exit 1
fi

# Step 4: Wait for cluster to be ready
echo "Waiting for cluster to be ready..."
for i in {1..60}; do
    HEALTH=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/health" | jq -r '.status')
    if [ "$HEALTH" = "green" ] || [ "$HEALTH" = "yellow" ]; then
        echo "Cluster is ready (status: $HEALTH)"
        break
    fi
    echo "Waiting... (attempt $i/60, status: $HEALTH)"
    sleep 10
done

# Step 5: Restart Wazuh services
echo "Starting Wazuh services..."
sudo systemctl start wazuh-manager
sudo systemctl start wazuh-dashboard

# Step 6: Verify restoration
echo "Verifying restoration..."
sleep 30

# Check index count
INDEX_COUNT=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cat/indices?h=index" | wc -l)
echo "Total indices after restore: $INDEX_COUNT"

# Check document count
DOC_COUNT=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cat/indices?h=docs.count" | awk '{sum+=$1} END {print sum}')
echo "Total documents after restore: $DOC_COUNT"

echo "Cluster restoration completed successfully"
```

### Selective Index Restore

```bash
#!/bin/bash
# restore-selective-indices.sh - Restore specific indices from snapshot

REPO_NAME="wazuh-backups"
SNAPSHOT_NAME="$1"
INDICES_PATTERN="$2"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

if [ -z "$SNAPSHOT_NAME" ] || [ -z "$INDICES_PATTERN" ]; then
    echo "Usage: $0 <snapshot_name> <indices_pattern>"
    echo "Examples:"
    echo "  $0 auto-full-20240128-020000 'wazuh-alerts-*'"
    echo "  $0 manual-snapshot-20240128-120000 'wazuh-monitoring-*'"
    exit 1
fi

echo "Restoring indices '$INDICES_PATTERN' from snapshot: $SNAPSHOT_NAME"

# Get snapshot information
SNAPSHOT_INFO=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME")
SNAPSHOT_STATE=$(echo "$SNAPSHOT_INFO" | jq -r '.snapshots[0].state')

if [ "$SNAPSHOT_STATE" != "SUCCESS" ]; then
    echo "ERROR: Snapshot $SNAPSHOT_NAME is not in SUCCESS state (current state: $SNAPSHOT_STATE)"
    exit 1
fi

# Show available indices in snapshot
echo "Indices available in snapshot:"
echo "$SNAPSHOT_INFO" | jq -r '.snapshots[0].indices[]' | sort

# Ask for confirmation
read -p "Proceed with restore? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Check for existing indices that match the pattern
EXISTING_INDICES=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cat/indices/$INDICES_PATTERN?h=index" 2>/dev/null || true)

if [ -n "$EXISTING_INDICES" ]; then
    echo "WARNING: Found existing indices matching pattern '$INDICES_PATTERN':"
    echo "$EXISTING_INDICES"
    read -p "Delete existing indices before restore? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing indices..."
        echo "$EXISTING_INDICES" | while read -r index; do
            if [ -n "$index" ]; then
                echo "Deleting index: $index"
                curl -s -k -u "$USERNAME:$PASSWORD" -X DELETE "$WAZUH_URL/$index"
            fi
        done
        sleep 5
    fi
fi

# Perform selective restore
echo "Starting selective restore..."
RESTORE_RESPONSE=$(curl -s -k -u "$USERNAME:$PASSWORD" -X POST "$WAZUH_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME/_restore?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d "{
    \"indices\": \"$INDICES_PATTERN\",
    \"ignore_unavailable\": true,
    \"include_global_state\": false,
    \"include_aliases\": true,
    \"partial\": false
  }")

# Check restore status
if echo "$RESTORE_RESPONSE" | jq -e '.snapshot' > /dev/null; then
    RESTORE_STATE=$(echo "$RESTORE_RESPONSE" | jq -r '.snapshot.state')
    
    if [ "$RESTORE_STATE" = "SUCCESS" ]; then
        echo "Selective restore completed successfully"
        
        # Show restored indices
        echo "Restored indices:"
        echo "$RESTORE_RESPONSE" | jq -r '.snapshot.indices[]'
        
        # Show statistics
        RESTORED_SHARDS=$(echo "$RESTORE_RESPONSE" | jq -r '.snapshot.shards.successful')
        TOTAL_SHARDS=$(echo "$RESTORE_RESPONSE" | jq -r '.snapshot.shards.total')
        echo "Restored shards: $RESTORED_SHARDS/$TOTAL_SHARDS"
        
    else
        echo "Selective restore failed (state: $RESTORE_STATE)"
        echo "$RESTORE_RESPONSE" | jq -r '.snapshot.failures[]? | .reason'
        exit 1
    fi
else
    echo "Restore request failed:"
    echo "$RESTORE_RESPONSE"
    exit 1
fi

echo "Selective restore process completed"
```

## Cross-Environment Migration

### Migration Planning Script

```bash
#!/bin/bash
# migration-planner.sh - Plan migration between environments

SOURCE_URL="$1"
TARGET_URL="$2"
USERNAME="admin"
PASSWORD="admin"

if [ -z "$SOURCE_URL" ] || [ -z "$TARGET_URL" ]; then
    echo "Usage: $0 <source_url> <target_url>"
    echo "Example: $0 https://source:9200 https://target:9200"
    exit 1
fi

echo "Migration Planning Report"
echo "========================"
echo "Source: $SOURCE_URL"
echo "Target: $TARGET_URL"
echo "Date: $(date)"
echo

# Function to get cluster info
get_cluster_info() {
    local url="$1"
    local label="$2"
    
    echo "$label Environment:"
    echo "-------------------"
    
    # Cluster health
    local health
    health=$(curl -s -k -u "$USERNAME:$PASSWORD" "$url/_cluster/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "Cluster Status: $(echo "$health" | jq -r '.status')"
        echo "Nodes: $(echo "$health" | jq -r '.number_of_nodes')"
        echo "Data Nodes: $(echo "$health" | jq -r '.number_of_data_nodes')"
        echo "Active Shards: $(echo "$health" | jq -r '.active_shards')"
        echo "Relocating Shards: $(echo "$health" | jq -r '.relocating_shards')"
        echo "Initializing Shards: $(echo "$health" | jq -r '.initializing_shards')"
        echo "Unassigned Shards: $(echo "$health" | jq -r '.unassigned_shards')"
    else
        echo "ERROR: Unable to connect to $url"
        return 1
    fi
    
    # Version info
    local version_info
    version_info=$(curl -s -k -u "$USERNAME:$PASSWORD" "$url" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "Version: $(echo "$version_info" | jq -r '.version.number')"
        echo "Lucene Version: $(echo "$version_info" | jq -r '.version.lucene_version')"
    fi
    
    # Indices information
    local indices_info
    indices_info=$(curl -s -k -u "$USERNAME:$PASSWORD" "$url/_cat/indices?v&s=index" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "\nIndices:"
        echo "$indices_info" | head -20  # Show first 20 indices
        
        local total_indices
        total_indices=$(echo "$indices_info" | grep -c '^[^h]' || echo "0")
        echo "\nTotal Indices: $total_indices"
    fi
    
    # Storage information
    local cluster_stats
    cluster_stats=$(curl -s -k -u "$USERNAME:$PASSWORD" "$url/_cluster/stats" 2>/dev/null)
    if [ $? -eq 0 ]; then
        local store_size
        local doc_count
        store_size=$(echo "$cluster_stats" | jq -r '.indices.store.size_in_bytes')
        doc_count=$(echo "$cluster_stats" | jq -r '.indices.docs.count')
        
        echo "Total Documents: $doc_count"
        echo "Total Storage: $(($store_size / 1024 / 1024 / 1024))GB"
    fi
    
    echo
}

# Get information from both environments
get_cluster_info "$SOURCE_URL" "Source"
get_cluster_info "$TARGET_URL" "Target"

# Check compatibility
echo "Compatibility Check:"
echo "-------------------"

SOURCE_VERSION=$(curl -s -k -u "$USERNAME:$PASSWORD" "$SOURCE_URL" | jq -r '.version.number')
TARGET_VERSION=$(curl -s -k -u "$USERNAME:$PASSWORD" "$TARGET_URL" | jq -r '.version.number')

echo "Source Version: $SOURCE_VERSION"
echo "Target Version: $TARGET_VERSION"

if [ "$SOURCE_VERSION" = "$TARGET_VERSION" ]; then
    echo "✓ Versions match - direct migration possible"
elif [[ "$TARGET_VERSION" > "$SOURCE_VERSION" ]]; then
    echo "⚠ Target version is newer - migration should work but test thoroughly"
else
    echo "✗ Target version is older - migration may not be compatible"
fi

# Generate migration recommendations
echo "\nMigration Recommendations:"
echo "-------------------------"

# Get source cluster stats for sizing
SOURCE_STATS=$(curl -s -k -u "$USERNAME:$PASSWORD" "$SOURCE_URL/_cluster/stats")
SOURCE_SIZE=$(echo "$SOURCE_STATS" | jq -r '.indices.store.size_in_bytes')
SOURCE_DOCS=$(echo "$SOURCE_STATS" | jq -r '.indices.docs.count')

echo "1. Storage Requirements:"
echo "   - Minimum space needed: $(($SOURCE_SIZE / 1024 / 1024 / 1024))GB"
echo "   - Recommended space: $(($SOURCE_SIZE * 2 / 1024 / 1024 / 1024))GB (with 100% overhead)"

echo "\n2. Migration Strategy:"
if [ $SOURCE_SIZE -gt $((100 * 1024 * 1024 * 1024)) ]; then  # 100GB
    echo "   - Large dataset detected (>100GB)"
    echo "   - Recommend incremental migration or selective index migration"
    echo "   - Consider using remote reindex for minimal downtime"
else
    echo "   - Medium dataset detected (<100GB)"
    echo "   - Full snapshot/restore migration recommended"
fi

echo "\n3. Estimated Migration Time:"
# Rough estimation: 1GB per minute for backup + restore
ESTIMATED_MINUTES=$(($SOURCE_SIZE / 1024 / 1024 / 1024))
echo "   - Estimated time: $ESTIMATED_MINUTES minutes (1GB/min estimation)"
echo "   - Plan for 2-3x this time for safety"

echo "\n4. Pre-migration Checklist:"
echo "   □ Stop data ingestion on source"
echo "   □ Verify target cluster health"
echo "   □ Ensure sufficient storage on target"
echo "   □ Configure snapshot repository"
echo "   □ Test migration with subset of data"
echo "   □ Plan for rollback strategy"

echo "\n5. Post-migration Checklist:"
echo "   □ Verify all indices restored"
echo "   □ Check document counts match"
echo "   □ Test Wazuh manager connectivity"
echo "   □ Verify dashboard functionality"
echo "   □ Update agent configurations if needed"
```

### Remote Reindex Migration

```bash
#!/bin/bash
# remote-reindex-migration.sh - Migrate using remote reindex

SOURCE_URL="$1"
TARGET_URL="$2"
INDEX_PATTERN="$3"
USERNAME="admin"
PASSWORD="admin"

if [ -z "$SOURCE_URL" ] || [ -z "$TARGET_URL" ] || [ -z "$INDEX_PATTERN" ]; then
    echo "Usage: $0 <source_url> <target_url> <index_pattern>"
    echo "Example: $0 https://source:9200 https://target:9200 'wazuh-alerts-*'"
    exit 1
fi

echo "Starting remote reindex migration"
echo "Source: $SOURCE_URL"
echo "Target: $TARGET_URL"
echo "Pattern: $INDEX_PATTERN"
echo

# Get list of indices to migrate
SOURCE_INDICES=$(curl -s -k -u "$USERNAME:$PASSWORD" "$SOURCE_URL/_cat/indices/$INDEX_PATTERN?h=index&s=index")

if [ -z "$SOURCE_INDICES" ]; then
    echo "No indices found matching pattern: $INDEX_PATTERN"
    exit 1
fi

echo "Indices to migrate:"
echo "$SOURCE_INDICES"
echo

read -p "Proceed with migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Migrate each index
echo "$SOURCE_INDICES" | while read -r index_name; do
    if [ -n "$index_name" ]; then
        echo "Migrating index: $index_name"
        
        # Get index settings and mappings from source
        INDEX_SETTINGS=$(curl -s -k -u "$USERNAME:$PASSWORD" "$SOURCE_URL/$index_name/_settings")
        INDEX_MAPPINGS=$(curl -s -k -u "$USERNAME:$PASSWORD" "$SOURCE_URL/$index_name/_mappings")
        
        # Create index on target with same settings
        echo "Creating index on target..."
        CREATE_RESPONSE=$(curl -s -k -u "$USERNAME:$PASSWORD" -X PUT "$TARGET_URL/$index_name" \
            -H 'Content-Type: application/json' \
            -d "{
                \"settings\": $(echo "$INDEX_SETTINGS" | jq ".\"$index_name\".settings"),
                \"mappings\": $(echo "$INDEX_MAPPINGS" | jq ".\"$index_name\".mappings")
            }")
        
        if echo "$CREATE_RESPONSE" | jq -e '.acknowledged' > /dev/null; then
            echo "Index created successfully on target"
        else
            echo "Failed to create index on target: $CREATE_RESPONSE"
            continue
        fi
        
        # Start remote reindex
        echo "Starting reindex operation..."
        REINDEX_RESPONSE=$(curl -s -k -u "$USERNAME:$PASSWORD" -X POST "$TARGET_URL/_reindex" \
            -H 'Content-Type: application/json' \
            -d "{
                \"source\": {
                    \"remote\": {
                        \"host\": \"$SOURCE_URL\",
                        \"username\": \"$USERNAME\",
                        \"password\": \"$PASSWORD\"
                    },
                    \"index\": \"$index_name\"
                },
                \"dest\": {
                    \"index\": \"$index_name\"
                },
                \"conflicts\": \"proceed\"
            }")
        
        TASK_ID=$(echo "$REINDEX_RESPONSE" | jq -r '.task')
        
        if [ "$TASK_ID" != "null" ] && [ -n "$TASK_ID" ]; then
            echo "Reindex task started: $TASK_ID"
            
            # Monitor reindex progress
            while true; do
                sleep 10
                TASK_STATUS=$(curl -s -k -u "$USERNAME:$PASSWORD" "$TARGET_URL/_tasks/$TASK_ID")
                COMPLETED=$(echo "$TASK_STATUS" | jq -r '.completed')
                
                if [ "$COMPLETED" = "true" ]; then
                    TOTAL=$(echo "$TASK_STATUS" | jq -r '.task.status.total')
                    CREATED=$(echo "$TASK_STATUS" | jq -r '.task.status.created')
                    UPDATED=$(echo "$TASK_STATUS" | jq -r '.task.status.updated')
                    
                    echo "Reindex completed - Total: $TOTAL, Created: $CREATED, Updated: $UPDATED"
                    break
                else
                    TOTAL=$(echo "$TASK_STATUS" | jq -r '.task.status.total // 0')
                    CREATED=$(echo "$TASK_STATUS" | jq -r '.task.status.created // 0')
                    
                    if [ "$TOTAL" -gt 0 ]; then
                        PROGRESS=$(( CREATED * 100 / TOTAL ))
                        echo "Progress: $PROGRESS% ($CREATED/$TOTAL)"
                    else
                        echo "Reindexing in progress..."
                    fi
                fi
            done
        else
            echo "Failed to start reindex task: $REINDEX_RESPONSE"
        fi
        
        echo "Completed migration of $index_name"
        echo
    fi
done

echo "Remote reindex migration completed"
```

## Disaster Recovery Procedures

### Disaster Recovery Runbook

```bash
#!/bin/bash
# disaster-recovery.sh - Comprehensive disaster recovery procedures

DR_CONFIG_FILE="/etc/wazuh-dr/config.conf"
DR_LOG_FILE="/var/log/wazuh-dr.log"
BACKUP_REPO="wazuh-dr-backups"
WAZUH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

# Load DR configuration
if [ -f "$DR_CONFIG_FILE" ]; then
    source "$DR_CONFIG_FILE"
fi

# Logging function
dr_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [DR] - $1" | tee -a "$DR_LOG_FILE"
}

# Function to assess damage
assess_damage() {
    dr_log "Starting damage assessment"
    
    local damage_report="/tmp/damage_assessment_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Wazuh Disaster Recovery - Damage Assessment"
        echo "==========================================="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "IP Address: $(hostname -I | awk '{print $1}')"
        echo
        
        echo "Service Status:"
        echo "---------------"
        systemctl is-active wazuh-manager && echo "✓ Wazuh Manager: Running" || echo "✗ Wazuh Manager: Stopped"
        systemctl is-active wazuh-indexer && echo "✓ Wazuh Indexer: Running" || echo "✗ Wazuh Indexer: Stopped"
        systemctl is-active wazuh-dashboard && echo "✓ Wazuh Dashboard: Running" || echo "✗ Wazuh Dashboard: Stopped"
        echo
        
        echo "Disk Space:"
        echo "-----------"
        df -h | grep -E '(Filesystem|/dev/)'
        echo
        
        echo "Memory Usage:"
        echo "-------------"
        free -h
        echo
        
        echo "Network Connectivity:"
        echo "--------------------"
        ping -c 3 8.8.8.8 > /dev/null && echo "✓ Internet: Accessible" || echo "✗ Internet: Not accessible"
        
        if curl -s -k "$WAZUH_URL" > /dev/null; then
            echo "✓ Wazuh API: Accessible"
            
            local cluster_health
            cluster_health=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/health" | jq -r '.status')
            echo "Cluster Health: $cluster_health"
            
            local node_count
            node_count=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/health" | jq -r '.number_of_nodes')
            echo "Active Nodes: $node_count"
            
            local index_count
            index_count=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cat/indices" | wc -l)
            echo "Total Indices: $index_count"
        else
            echo "✗ Wazuh API: Not accessible"
        fi
        
        echo
        echo "Recent Errors (last 100 lines):"
        echo "--------------------------------"
        journalctl -u wazuh-manager --no-pager -n 100 | grep -i error || echo "No recent errors in Wazuh Manager"
        journalctl -u wazuh-indexer --no-pager -n 100 | grep -i error || echo "No recent errors in Wazuh Indexer"
        
    } > "$damage_report"
    
    dr_log "Damage assessment completed: $damage_report"
    cat "$damage_report"
    
    # Determine recovery strategy
    if systemctl is-active wazuh-indexer > /dev/null && curl -s -k "$WAZUH_URL" > /dev/null; then
        dr_log "Assessment: Partial failure - services running but may have data issues"
        return 1  # Partial failure
    else
        dr_log "Assessment: Complete failure - full recovery required"
        return 2  # Complete failure
    fi
}

# Function to list available snapshots
list_recovery_snapshots() {
    dr_log "Listing available recovery snapshots"
    
    local snapshots
    snapshots=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$BACKUP_REPO/_all" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "Available snapshots for recovery:"
        echo "$snapshots" | jq -r '.snapshots[] | "\(.snapshot) - \(.start_time) (\(.state))"' | sort -r
    else
        dr_log "ERROR: Unable to access snapshot repository"
        return 1
    fi
}

# Function for emergency data backup
emergency_backup() {
    dr_log "Starting emergency backup procedure"
    
    local emergency_snapshot="emergency-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Try to create emergency snapshot
    local backup_response
    backup_response=$(curl -s -k -u "$USERNAME:$PASSWORD" -X PUT "$WAZUH_URL/_snapshot/$BACKUP_REPO/$emergency_snapshot?wait_for_completion=true" \
        -H 'Content-Type: application/json' \
        -d '{
            "indices": "*",
            "ignore_unavailable": true,
            "include_global_state": true,
            "metadata": {
                "description": "Emergency backup before disaster recovery",
                "created_by": "disaster_recovery_script"
            }
        }')
    
    local backup_state
    backup_state=$(echo "$backup_response" | jq -r '.snapshot.state')
    
    if [ "$backup_state" = "SUCCESS" ]; then
        dr_log "Emergency backup completed successfully: $emergency_snapshot"
        return 0
    else
        dr_log "Emergency backup failed: $backup_state"
        return 1
    fi
}

# Function for full system recovery
full_system_recovery() {
    local snapshot_name="$1"
    
    if [ -z "$snapshot_name" ]; then
        dr_log "ERROR: No snapshot specified for recovery"
        return 1
    fi
    
    dr_log "Starting full system recovery with snapshot: $snapshot_name"
    
    # Step 1: Stop all Wazuh services
    dr_log "Stopping Wazuh services"
    sudo systemctl stop wazuh-manager
    sudo systemctl stop wazuh-dashboard
    
    # Step 2: Clear existing data (if needed)
    read -p "Clear existing Wazuh data before restore? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dr_log "Clearing existing data"
        sudo rm -rf /var/ossec/logs/*
        sudo rm -rf /var/lib/wazuh-indexer/nodes/*
    fi
    
    # Step 3: Start indexer for restore
    dr_log "Starting Wazuh indexer for restore"
    sudo systemctl start wazuh-indexer
    
    # Wait for indexer to be ready
    local retries=0
    while [ $retries -lt 30 ]; do
        if curl -s -k "$WAZUH_URL" > /dev/null; then
            dr_log "Wazuh indexer is ready"
            break
        fi
        dr_log "Waiting for Wazuh indexer to start... (attempt $((retries + 1))/30)"
        sleep 10
        retries=$((retries + 1))
    done
    
    if [ $retries -eq 30 ]; then
        dr_log "ERROR: Wazuh indexer failed to start"
        return 1
    fi
    
    # Step 4: Restore from snapshot
    dr_log "Restoring data from snapshot: $snapshot_name"
    
    local restore_response
    restore_response=$(curl -s -k -u "$USERNAME:$PASSWORD" -X POST "$WAZUH_URL/_snapshot/$BACKUP_REPO/$snapshot_name/_restore?wait_for_completion=true" \
        -H 'Content-Type: application/json' \
        -d '{
            "ignore_unavailable": true,
            "include_global_state": true,
            "include_aliases": true
        }')
    
    local restore_state
    restore_state=$(echo "$restore_response" | jq -r '.snapshot.state')
    
    if [ "$restore_state" = "SUCCESS" ]; then
        dr_log "Data restore completed successfully"
    else
        dr_log "ERROR: Data restore failed: $restore_state"
        return 1
    fi
    
    # Step 5: Start all services
    dr_log "Starting all Wazuh services"
    sudo systemctl start wazuh-manager
    sudo systemctl start wazuh-dashboard
    
    # Step 6: Verify recovery
    dr_log "Verifying system recovery"
    sleep 30
    
    local health_status
    health_status=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_cluster/health" | jq -r '.status')
    
    if [ "$health_status" = "green" ] || [ "$health_status" = "yellow" ]; then
        dr_log "System recovery completed successfully (cluster health: $health_status)"
        
        # Send recovery notification
        send_recovery_notification "SUCCESS" "Full system recovery completed successfully using snapshot $snapshot_name"
        
        return 0
    else
        dr_log "ERROR: System recovery verification failed (cluster health: $health_status)"
        return 1
    fi
}

# Function to send recovery notifications
send_recovery_notification() {
    local status="$1"
    local message="$2"
    
    dr_log "Sending recovery notification: $status"
    
    # Email notification
    if command -v mail > /dev/null && [ -n "$DR_EMAIL" ]; then
        echo "$message" | mail -s "Wazuh DR - $status" "$DR_EMAIL"
    fi
    
    # Slack notification
    if [ -n "$DR_SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Wazuh Disaster Recovery $status\\n$message\"}" \
            "$DR_SLACK_WEBHOOK"
    fi
    
    # PagerDuty notification
    if [ -n "$DR_PAGERDUTY_KEY" ]; then
        curl -X POST 'https://events.pagerduty.com/v2/enqueue' \
            -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$DR_PAGERDUTY_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Wazuh Disaster Recovery $status\",
                    \"source\": \"$(hostname)\",
                    \"severity\": \"critical\",
                    \"custom_details\": {
                        \"message\": \"$message\"
                    }
                }
            }"
    fi
}

# Main disaster recovery function
main_disaster_recovery() {
    dr_log "Starting Wazuh disaster recovery process"
    
    # Step 1: Assess damage
    assess_damage
    local damage_level=$?
    
    case $damage_level in
        1)
            dr_log "Partial failure detected - attempting emergency backup"
            if emergency_backup; then
                dr_log "Emergency backup successful - proceeding with selective recovery"
            else
                dr_log "Emergency backup failed - proceeding with full recovery"
            fi
            ;;
        2)
            dr_log "Complete failure detected - full recovery required"
            ;;
        *)
            dr_log "System appears healthy - no recovery needed"
            return 0
            ;;
    esac
    
    # Step 2: List available snapshots
    if ! list_recovery_snapshots; then
        dr_log "ERROR: Cannot access snapshots - recovery not possible"
        send_recovery_notification "FAILED" "Cannot access backup snapshots for recovery"
        return 1
    fi
    
    # Step 3: Select snapshot for recovery
    echo
    read -p "Enter snapshot name for recovery (or 'latest' for most recent): " snapshot_name
    
    if [ "$snapshot_name" = "latest" ]; then
        snapshot_name=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$BACKUP_REPO/_all" | jq -r '.snapshots | sort_by(.start_time_in_millis) | last | .snapshot')
        dr_log "Using latest snapshot: $snapshot_name"
    fi
    
    # Step 4: Perform recovery
    if full_system_recovery "$snapshot_name"; then
        dr_log "Disaster recovery completed successfully"
        return 0
    else
        dr_log "Disaster recovery failed"
        send_recovery_notification "FAILED" "Disaster recovery failed during restoration process"
        return 1
    fi
}

# Command line interface
case "${1:-auto}" in
    "auto")
        main_disaster_recovery
        ;;
    "assess")
        assess_damage
        ;;
    "list")
        list_recovery_snapshots
        ;;
    "backup")
        emergency_backup
        ;;
    "recover")
        if [ -n "$2" ]; then
            full_system_recovery "$2"
        else
            echo "Usage: $0 recover <snapshot_name>"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {auto|assess|list|backup|recover}"
        echo "  auto    - Automatic disaster recovery (assess and recover)"
        echo "  assess  - Assess system damage"
        echo "  list    - List available recovery snapshots"
        echo "  backup  - Create emergency backup"
        echo "  recover - Recover from specific snapshot"
        exit 1
        ;;
esac
```

## Best Practices and Recommendations

### Security Considerations

1. **Encrypt Snapshots**: Use encryption for snapshot repositories
2. **Access Control**: Restrict snapshot repository access
3. **Audit Logging**: Log all snapshot operations
4. **Secure Transport**: Use HTTPS/TLS for all API communications

### Performance Optimization

1. **Concurrent Snapshots**: Configure appropriate snapshot concurrency
2. **Network Bandwidth**: Limit snapshot transfer rates during peak hours
3. **Storage Performance**: Use high-performance storage for repositories
4. **Compression**: Enable compression to reduce storage requirements

### Monitoring and Alerting

```bash
# Monitor snapshot health and send alerts
#!/bin/bash
# snapshot-monitor.sh

check_snapshot_health() {
    local repo_name="$1"
    local alert_email="$2"
    
    # Check repository status
    local repo_status
    repo_status=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$repo_name")
    
    if ! echo "$repo_status" | jq -e '.type' > /dev/null; then
        echo "ALERT: Snapshot repository $repo_name is not accessible" | mail -s "Wazuh Snapshot Alert" "$alert_email"
        return 1
    fi
    
    # Check recent snapshots
    local recent_snapshots
    recent_snapshots=$(curl -s -k -u "$USERNAME:$PASSWORD" "$WAZUH_URL/_snapshot/$repo_name/_all" | jq '[.snapshots[] | select(.start_time_in_millis > (now * 1000 - 86400000))] | length')
    
    if [ "$recent_snapshots" -eq 0 ]; then
        echo "ALERT: No snapshots created in the last 24 hours" | mail -s "Wazuh Snapshot Alert" "$alert_email"
        return 1
    fi
    
    return 0
}
```

## Conclusion

Wazuh snapshot migration is essential for:

1. **Business Continuity**: Ensuring data availability during outages
2. **Disaster Recovery**: Quick restoration from catastrophic failures
3. **Environment Migration**: Moving between development, testing, and production
4. **Compliance**: Meeting data retention and backup requirements

Key takeaways:
- Implement automated backup strategies with proper retention policies
- Test recovery procedures regularly in non-production environments
- Monitor snapshot health and repository status continuously
- Document recovery procedures and maintain runbooks
- Consider multiple backup locations for critical environments

Regular testing and validation of backup and recovery procedures ensure that when disaster strikes, your Wazuh environment can be restored quickly and completely.
