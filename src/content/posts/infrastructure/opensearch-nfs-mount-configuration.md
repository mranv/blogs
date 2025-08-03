---
author: Anubhav Gain
pubDatetime: 2024-04-25T18:00:00Z
modDatetime: 2024-04-25T18:00:00Z
title: OpenSearch NFS Mount Configuration for Cluster Data Migration
slug: opensearch-nfs-mount-configuration
featured: true
draft: false
tags:
  - opensearch
  - elasticsearch
  - nfs
  - data-migration
  - infrastructure
  - wazuh
  - devops
description: A comprehensive guide for configuring NFS mounts to facilitate OpenSearch data migration across cluster nodes, including step-by-step instructions, troubleshooting tips, and security considerations.
---

# OpenSearch NFS Mount Configuration Guide

This guide provides detailed instructions for configuring NFS mounts for OpenSearch data migration across cluster nodes. Properly configured NFS mounts enable seamless data transfer while ensuring consistent permissions and ownership across your OpenSearch/Wazuh indexer infrastructure.

## Prerequisites

Before you begin, ensure you have:

- OpenSearch nodes with compatible UID/GID for the opensearch user
- NFS server running and accessible at the specified IP
- nfs-utils installed on all nodes

## Installation

If NFS utilities are not already installed on your systems:

```bash
# On RHEL/CentOS/Fedora
sudo yum -y install nfs-utils

# On Debian/Ubuntu
sudo apt -y install nfs-common
```

## Steps for Each OpenSearch Node

Follow these steps on each node in your OpenSearch cluster:

### 1. Stop OpenSearch Service (if running)

```bash
sudo systemctl stop opensearch
```

### 2. Sync UID/GID Across Nodes

Consistency in user and group IDs is crucial for shared NFS access. Ensure all nodes use the same UID/GID for the opensearch user:

```bash
# Check current IDs
id opensearch

# If needed, modify UID/GID (for example, to match 996:993)
sudo usermod -u 996 opensearch
sudo groupmod -g 993 opensearch

# Fix ownership of OpenSearch directories
sudo chown -R opensearch:opensearch /var/lib/opensearch/
sudo chown -R opensearch:opensearch /etc/opensearch/
sudo chown -R opensearch:opensearch /var/log/opensearch/
```

### 3. Prepare Mount Directory

Create and configure the mount point with appropriate permissions:

```bash
# Unmount if already mounted
sudo umount /var/lib/opensearch/migration 2>/dev/null || true

# Create mount directory with proper permissions
sudo mkdir -p /var/lib/opensearch/migration
sudo chown opensearch:opensearch /var/lib/opensearch/migration
sudo chmod 755 /var/lib/opensearch/migration
```

### 4. Mount NFS Share

Connect to the NFS server:

```bash
# Mount the NFS share
sudo mount -t nfs 172.17.14.126:/var/lib/wazuh-indexer/migration /var/lib/opensearch/migration

# Verify mount and permissions
ls -la /var/lib/opensearch/migration
```

### 5. Configure Persistent Mount

Add an entry to `/etc/fstab` for automatic mounting on system reboot:

```bash
echo "172.17.14.126:/var/lib/wazuh-indexer/migration /var/lib/opensearch/migration nfs defaults,_netdev,soft,timeo=30 0 0" | sudo tee -a /etc/fstab
```

> **Note**: The `soft` and `timeo` options prevent system hangs if the NFS server becomes unavailable, while `_netdev` ensures the filesystem is mounted after the network is online.

### 6. Verify Write Access

Test that the OpenSearch user can write to the mounted directory:

```bash
sudo -u opensearch touch /var/lib/opensearch/migration/test_$(hostname)
ls -la /var/lib/opensearch/migration/test_$(hostname)
```

### 7. Update OpenSearch Configuration

If necessary, add the migration path to the OpenSearch configuration:

```bash
sudo nano /etc/opensearch/opensearch.yml
```

You may need to add path configurations like:

```yaml
# Migration path config
path.repo: ["/var/lib/opensearch/migration"]
```

### 8. Restart OpenSearch

Once configuration is complete, restart the OpenSearch service:

```bash
sudo systemctl start opensearch
sudo systemctl status opensearch
```

## Troubleshooting

### Permission Issues

If you encounter permission-related problems:

```bash
# Verify UID/GID consistency across nodes
id opensearch

# Check numeric UIDs of files on the mount
ls -ln /var/lib/opensearch/migration

# Temporarily set more permissive permissions for testing
sudo chmod 777 /var/lib/opensearch/migration
```

### Mount Issues

If the NFS mount fails:

```bash
# Check if NFS server is reachable
ping 172.17.14.126

# Verify the NFS share is exported on the server
showmount -e 172.17.14.126

# Check system logs
dmesg | grep nfs
sudo tail -f /var/log/messages
```

### OpenSearch Issues

If OpenSearch fails to start after configuration:

```bash
# Check logs for errors
sudo tail -f /var/log/opensearch/opensearch-cluster.log
```

Common issues include:

- Incorrect permissions on the NFS mount
- Path not correctly specified in opensearch.yml
- Network connectivity problems between nodes and NFS server

## Security Considerations

When implementing NFS mounts for OpenSearch, keep these security best practices in mind:

- The NFS mount should only be accessible within a secure network
- Consider using NFSv4 with Kerberos authentication for production environments
- Restrict mount permissions to only what's necessary (755 or more restrictive)
- Always verify correct ownership and permissions before starting OpenSearch
- Use firewall rules to restrict NFS traffic to specific hosts

## Performance Optimization

For optimal NFS performance with OpenSearch:

1. **Mount Options**: Consider these additional mount options for better performance:

   ```
   rsize=1048576,wsize=1048576,hard,noatime
   ```

2. **Network Configuration**: Use a dedicated network interface for NFS traffic if possible

3. **NFS Server Tuning**: On the NFS server, increase the number of NFS daemon threads:
   ```bash
   echo "options nfs threads=16" | sudo tee /etc/modprobe.d/nfs.conf
   ```

## Conclusion

Properly configured NFS mounts enable efficient data migration and sharing between OpenSearch nodes. By ensuring consistent user/group permissions and following security best practices, you can maintain data integrity while leveraging the flexibility of networked storage for your OpenSearch clusters.

For more information on OpenSearch configuration and administration, refer to the [official OpenSearch documentation](https://opensearch.org/docs/).
