---
author: Anubhav Gain
pubDatetime: 2024-04-26T14:00:00Z
modDatetime: 2024-04-26T14:00:00Z
title: Comprehensive OpenSearch Deployment Guide for Production
slug: opensearch-production-deployment-guide
featured: true
draft: false
tags:
  - opensearch
  - elasticsearch
  - search
  - production
  - cluster
  - devops
  - infrastructure
description: A detailed guide for deploying and configuring OpenSearch in production environments, covering single-node and cluster setups, security configuration, performance tuning, and best practices.
---

# Comprehensive OpenSearch Deployment Guide

This guide provides detailed instructions for deploying OpenSearch in both single-node and cluster configurations. OpenSearch is a powerful, open-source search and analytics engine that offers enterprise-grade security, powerful monitoring capabilities, and extensive customization options.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Single Node Installation](#single-node-installation)
4. [Cluster Installation](#cluster-installation)
5. [Security Configuration](#security-configuration)
6. [Performance Tuning](#performance-tuning)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Introduction

OpenSearch is a community-driven, open-source fork of Elasticsearch that provides a secure, high-performance search and analytics engine. Whether you're deploying a single node for development or a multi-node cluster for production, this guide will help you set up and optimize your OpenSearch deployment.

## Prerequisites

### System Requirements

- **Operating System**: Rocky Linux, RHEL, Ubuntu 20.04+, or Amazon Linux 2
- **RAM**: Minimum 4GB per node (8GB recommended)
- **CPU**: Minimum 2 cores per node
- **Storage**: 20GB+ available space
- **Java**: OpenJDK 11 or later

### Required Packages

```bash
# For RPM-based systems (Rocky Linux, RHEL)
sudo dnf install java-11-openjdk-devel unzip wget curl

# For Debian-based systems
sudo apt-get update
sudo apt-get install openjdk-11-jdk unzip wget curl
```

### Network Requirements

- Open ports:
  - 9200: HTTP API
  - 9300: Node communication
  - 9600: Performance Analyzer
  - 5601: OpenSearch Dashboards (if installed)

## Single Node Installation

### Add OpenSearch Repository

```bash
# Create repository file
sudo bash -c 'cat > /etc/yum.repos.d/opensearch.repo << EOF
[opensearch]
name=OpenSearch
baseurl=https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/yum
enabled=1
gpgcheck=1
gpgkey=https://artifacts.opensearch.org/publickeys/opensearch.gpg
autorefresh=1
type=rpm-md
EOF'
```

### Install OpenSearch

```bash
sudo dnf install opensearch
```

### Configure OpenSearch

```bash
sudo bash -c 'cat > /etc/opensearch/opensearch.yml << EOF
cluster.name: opensearch-single
node.name: single-node
network.host: 0.0.0.0
discovery.type: single-node
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# Memory Settings
bootstrap.memory_lock: true

# Security Settings
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: certs/node.pem
plugins.security.ssl.http.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: certs/root-ca.pem
plugins.security.ssl.transport.pemcert_filepath: certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.allow_default_init_securityindex: true
plugins.security.authcz.admin_dn:
  - "CN=admin,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"

# Performance Settings
indices.memory.index_buffer_size: 10%
thread_pool.write.queue_size: 200
thread_pool.search.queue_size: 500
EOF'
```

### Generate Certificates

```bash
# Create directory for certificates
sudo mkdir -p /etc/opensearch/certs
cd /etc/opensearch/certs

# Generate root CA
sudo openssl req -x509 -new -nodes -newkey rsa:2048 \
  -keyout root-ca.key -out root-ca.pem -days 3650 \
  -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=Root CA"

# Generate node certificate
sudo openssl req -new -nodes -newkey rsa:2048 \
  -keyout node-key.pem -out node.csr \
  -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=single-node"

sudo openssl x509 -req -in node.csr -CA root-ca.pem \
  -CAkey root-ca.key -CAcreateserial -out node.pem \
  -days 3650 -sha256

# Generate admin certificate
sudo openssl req -new -nodes -newkey rsa:2048 \
  -keyout admin-key.pem -out admin.csr \
  -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=admin"

sudo openssl x509 -req -in admin.csr -CA root-ca.pem \
  -CAkey root-ca.key -CAcreateserial -out admin.pem \
  -days 3650 -sha256
```

### Set Permissions

```bash
sudo chown -R opensearch:opensearch /etc/opensearch/certs
sudo chmod 600 /etc/opensearch/certs/*.pem
sudo chmod 600 /etc/opensearch/certs/*.key
```

### Configure System Settings

```bash
# Set memory mapping limits
sudo bash -c 'cat >> /etc/sysctl.conf << EOF
vm.max_map_count=262144
vm.swappiness=1
EOF'

sudo sysctl -p

# Set memory lock limits
sudo bash -c 'cat > /etc/security/limits.d/opensearch.conf << EOF
opensearch soft memlock unlimited
opensearch hard memlock unlimited
opensearch soft nofile 65536
opensearch hard nofile 65536
opensearch soft nproc 4096
opensearch hard nproc 4096
EOF'
```

### Start OpenSearch

```bash
sudo systemctl enable opensearch
sudo systemctl start opensearch
```

## Cluster Installation

This section covers setting up a three-node cluster with one master node and two data nodes.

### Master Node Configuration (os1)

```bash
sudo bash -c 'cat > /etc/opensearch/opensearch.yml << EOF
# Basic cluster configuration
cluster.name: opensearch-cluster
node.name: os1
node.roles: [master, data]
network.host: 172.17.14.79
http.port: 9200
transport.port: 9300

# Discovery settings
discovery.seed_hosts: ["172.17.14.79:9300", "172.17.14.89:9300", "172.17.14.39:9300"]
cluster.initial_master_nodes: ["os1"]

# Memory and path settings
bootstrap.memory_lock: true
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# Performance settings
indices.memory.index_buffer_size: 5%
thread_pool.write.queue_size: 200
thread_pool.search.queue_size: 500

# Security Configuration
plugins.security.ssl.transport.pemcert_filepath: certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.transport.resolve_hostname: false

plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: certs/node.pem
plugins.security.ssl.http.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: certs/root-ca.pem

plugins.security.allow_unsafe_democertificates: false
plugins.security.allow_default_init_securityindex: true

# Node Identity Management
plugins.security.nodes_dn:
  - "CN=opensearch-1,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"
  - "CN=opensearch-2,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"
  - "CN=opensearch-3,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"

plugins.security.authcz.admin_dn:
  - "CN=admin,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"

# System indices configuration
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [
  ".plugins-ml-*",
  ".opendistro-alerting-*",
  ".opendistro-anomaly-*",
  ".opendistro-reports-*",
  ".opensearch-notifications-*",
  ".opensearch-notebooks",
  ".opensearch-observability",
  ".ql-datasources",
  ".opendistro-asynchronous-search-*",
  ".replication-metadata-store",
  ".opensearch-knn-models",
  ".geospatial-ip2geo-data*",
  ".plugins-flow-framework-*"
]
EOF'
```

### Data Node Configuration (os2 and os3)

```bash
# Replace IP address and node name for each node
sudo bash -c 'cat > /etc/opensearch/opensearch.yml << EOF
# Basic cluster configuration
cluster.name: opensearch-cluster
node.name: os2  # Change to os3 for the third node
node.roles: [data, ingest]
network.host: 172.17.14.89  # Change to appropriate IP
http.port: 9200
transport.port: 9300

# Discovery settings
discovery.seed_hosts: ["172.17.14.79:9300", "172.17.14.89:9300", "172.17.14.39:9300"]
cluster.initial_master_nodes: ["os1"]

# Memory and path settings
bootstrap.memory_lock: true
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# Performance settings
indices.memory.index_buffer_size: 5%
thread_pool.write.queue_size: 200
thread_pool.search.queue_size: 500

# Security Configuration
plugins.security.ssl.transport.pemcert_filepath: certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.transport.resolve_hostname: false

plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: certs/node.pem
plugins.security.ssl.http.pemkey_filepath: certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: certs/root-ca.pem

# Security Settings
plugins.security.allow_unsafe_democertificates: false
plugins.security.allow_default_init_securityindex: true

# Node Identity Management
plugins.security.nodes_dn:
  - "CN=opensearch-1,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"
  - "CN=opensearch-2,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"
  - "CN=opensearch-3,OU=Invinsense,O=Invinsense,L=Ahmedabad,C=IN"

# System indices configuration
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [
  ".plugins-ml-*",
  ".opendistro-alerting-*",
  ".opendistro-anomaly-*",
  ".opendistro-reports-*",
  ".opensearch-notifications-*",
  ".opensearch-notebooks",
  ".opensearch-observability",
  ".ql-datasources",
  ".opendistro-asynchronous-search-*",
  ".replication-metadata-store",
  ".opensearch-knn-models",
  ".geospatial-ip2geo-data*",
  ".plugins-flow-framework-*"
]
EOF'
```

### Generate and Distribute Certificates

Create a certificate generation script:

```bash
#!/bin/bash

CERT_DIR="/tmp/opensearch-certs"
mkdir -p "$CERT_DIR"

# Generate root CA
openssl req -x509 -new -nodes -newkey rsa:2048 \
  -keyout "$CERT_DIR/root-ca.key" -out "$CERT_DIR/root-ca.pem" \
  -days 3650 -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=Root CA"

# Function to generate node certificate
generate_node_cert() {
    local node_name=$1
    openssl req -new -nodes -newkey rsa:2048 \
      -keyout "$CERT_DIR/$node_name-key.pem" -out "$CERT_DIR/$node_name.csr" \
      -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=$node_name"

    openssl x509 -req -in "$CERT_DIR/$node_name.csr" \
      -CA "$CERT_DIR/root-ca.pem" -CAkey "$CERT_DIR/root-ca.key" \
      -CAcreateserial -out "$CERT_DIR/$node_name.pem" \
      -days 3650 -sha256
}

# Generate certificates for each node
generate_node_cert "opensearch-1"
generate_node_cert "opensearch-2"
generate_node_cert "opensearch-3"

# Generate admin certificate
openssl req -new -nodes -newkey rsa:2048 \
  -keyout "$CERT_DIR/admin-key.pem" -out "$CERT_DIR/admin.csr" \
  -subj "/C=IN/L=Ahmedabad/O=Invinsense/OU=Invinsense/CN=admin"

openssl x509 -req -in "$CERT_DIR/admin.csr" \
  -CA "$CERT_DIR/root-ca.pem" -CAkey "$CERT_DIR/root-ca.key" \
  -CAcreateserial -out "$CERT_DIR/admin.pem" \
  -days 3650 -sha256

# Set permissions
chmod 600 "$CERT_DIR"/*.pem "$CERT_DIR"/*.key
```

### Distribute Certificates

```bash
# On each node
sudo mkdir -p /etc/opensearch/certs
sudo cp /tmp/opensearch-certs/root-ca.pem /etc/opensearch/certs/
sudo cp /tmp/opensearch-certs/root-ca.key /etc/opensearch/certs/
sudo cp /tmp/opensearch-certs/admin*.pem /etc/opensearch/certs/

# On each node, copy the appropriate node certificate
# For os1
sudo cp /tmp/opensearch-certs/opensearch-1.pem /etc/opensearch/certs/node.pem
sudo cp /tmp/opensearch-certs/opensearch-1-key.pem /etc/opensearch/certs/node-key.pem

# For os2
sudo cp /tmp/opensearch-certs/opensearch-2.pem /etc/opensearch/certs/node.pem
sudo cp /tmp/opensearch-certs/opensearch-2-key.pem /etc/opensearch/certs/node-key.pem

# For os3
sudo cp /tmp/opensearch-certs/opensearch-3.pem /etc/opensearch/certs/node.pem
sudo cp /tmp/opensearch-certs/opensearch-3-key.pem /etc/opensearch/certs/node-key.pem

# Set permissions on all nodes
sudo chown -R opensearch:opensearch /etc/opensearch/certs
sudo chmod 750 /etc/opensearch/certs
sudo chmod 600 /etc/opensearch/certs/*
```

### Configure System Settings on All Nodes

```bash
# Configure sysctl settings
sudo bash -c 'cat >> /etc/sysctl.conf << EOF
vm.max_map_count=262144
vm.swappiness=1
EOF'

sudo sysctl -p

# Configure memory limits
sudo bash -c 'cat > /etc/security/limits.d/opensearch.conf << EOF
opensearch soft memlock unlimited
opensearch hard memlock unlimited
opensearch soft nofile 65536
opensearch hard nofile 65536
opensearch soft nproc 4096
opensearch hard nproc 4096
EOF'

# Create JVM options file
sudo mkdir -p /etc/opensearch/jvm.options.d/
sudo bash -c 'cat > /etc/opensearch/jvm.options.d/heap.options << EOF
-Xms2g
-Xmx2g
EOF'
```

### Start the Cluster

```bash
# On all nodes
sudo systemctl daemon-reload
sudo systemctl enable opensearch
sudo systemctl start opensearch

# Monitor logs
sudo tail -f /var/log/opensearch/opensearch-cluster.log
```

## Security Configuration

### Create Security Configuration Directory

```bash
sudo mkdir -p /etc/opensearch/opensearch-security
```

### Configure Internal Users

```bash
sudo bash -c 'cat > /etc/opensearch/opensearch-security/internal_users.yml << EOF
admin:
  hash: "$2y$12$XwI0HxUmgQpR5zIzWUKIBONRPvU1kRUFCaXUa2Z2iCGjBxbqpyKtG"  # Change this
  reserved: true
  backend_roles:
  - "admin"
  description: "Admin user"
kibanaserver:
  hash: "$2y$12$XwI0HxUmgQpR5zIzWUKIBONRPvU1kRUFCaXUa2Z2iCGjBxbqpyKtG"  # Change this
  reserved: true
  description: "OpenSearch Dashboards user"
EOF'
```

> **Important**: Always change default password hashes in production environments.

### Configure Roles

```bash
sudo bash -c 'cat > /etc/opensearch/opensearch-security/roles.yml << EOF
admin:
  cluster:
    - UNLIMITED
  indices:
    "*":
      allowlist: ["*"]
      denylist: []
      authorized_indices: ["*"]
  tenants:
    admin_tenant: RW

kibanaserver:
  cluster:
    - CLUSTER_MONITOR
    - CLUSTER_COMPOSITE_OPS
  indices:
    "*":
      allowlist: [".kibana*", ".opensearch_dashboards*"]
      denylist: []
      authorized_indices: [".kibana*", ".opensearch_dashboards*"]
EOF'
```

### Configure Role Mappings

```bash
sudo bash -c 'cat > /etc/opensearch/opensearch-security/roles_mapping.yml << EOF
admin:
  users:
    - admin
  backend_roles:
    - admin
  hosts: []
  and_backend_roles: []

kibanaserver:
  users:
    - kibanaserver
  backend_roles: []
  hosts: []
  and_backend_roles: []
EOF'
```

## Performance Tuning

### Memory Settings

For nodes with 4GB RAM:

```bash
sudo bash -c 'cat > /etc/opensearch/jvm.options.d/heap.options << EOF
-Xms2g
-Xmx2g
EOF'
```

### Thread Pool Settings

Add the following to `opensearch.yml`:

```yaml
thread_pool:
  write:
    queue_size: 200
  search:
    queue_size: 500
```

### Field Data and Query Cache

Add to `opensearch.yml`:

```yaml
indices.fielddata.cache.size: 20%
indices.queries.cache.size: 10%
```

### Disk I/O Settings

Add to `opensearch.yml`:

```yaml
index:
  merge:
    policy:
      floor_segment: 2mb
      max_merge_at_once: 5
      max_merged_segment: 5gb
  refresh_interval: 30s
```

## Troubleshooting

### Memory Lock Issues

```bash
# Check if memory lock is enabled
ulimit -l

# If unlimited is not shown, verify /etc/security/limits.conf:
sudo bash -c 'cat >> /etc/security/limits.conf << EOF
opensearch soft memlock unlimited
opensearch hard memlock unlimited
EOF'
```

### Certificate Issues

```bash
# Verify certificate permissions
ls -la /etc/opensearch/certs/

# Verify certificate content
openssl x509 -in /etc/opensearch/certs/node.pem -text -noout

# Check certificate chain
openssl verify -CAfile /etc/opensearch/certs/root-ca.pem /etc/opensearch/certs/node.pem
```

### Cluster Formation Issues

```bash
# Check cluster health
curl -k -X GET "https://localhost:9200/_cluster/health?pretty" -u admin:admin

# Check cluster state
curl -k -X GET "https://localhost:9200/_cluster/state?pretty" -u admin:admin

# Check node info
curl -k -X GET "https://localhost:9200/_nodes?pretty" -u admin:admin
```

## Best Practices

### Security Best Practices

1. **Certificate Management**:

   - Rotate certificates every 12 months
   - Use strong key sizes (minimum 2048 bits for RSA)
   - Implement proper certificate revocation procedures
   - Store private keys securely

2. **Network Security**:

   - Use firewalls to restrict access to OpenSearch ports
   - Implement VPC or network segmentation
   - Use TLS 1.2 or higher for all communications
   - Disable plaintext HTTP when possible

3. **Authentication and Authorization**:
   - Use role-based access control (RBAC)
   - Follow the principle of least privilege
   - Regularly audit user access and permissions
   - Implement strong password policies

### Performance Best Practices

1. **Hardware Recommendations**:

   - Use SSDs for data nodes
   - Provide adequate RAM (minimum 4GB per node)
   - Use multiple CPUs/cores for better concurrent processing
   - Ensure network bandwidth is sufficient

2. **Indexing Best Practices**:

   - Use bulk indexing when possible
   - Optimize refresh intervals based on workload
   - Use appropriate shard sizes (10-50GB per shard)
   - Implement proper mapping strategies

3. **Search Optimization**:
   - Use filter context when possible
   - Implement proper caching strategies
   - Optimize query patterns
   - Use scroll API for deep pagination

### Monitoring Best Practices

1. **Key Metrics to Monitor**:

   - Cluster health status
   - Node status and resource usage
   - Index performance metrics
   - Query performance metrics
   - JVM heap usage
   - Disk usage and I/O statistics

2. **Logging**:

   - Implement log rotation
   - Monitor error logs regularly
   - Set appropriate log levels
   - Archive logs for compliance and debugging

3. **Alerting**:
   - Set up alerts for cluster state changes
   - Monitor disk space usage
   - Track JVM heap usage
   - Monitor query latency
   - Track failed node connections

### Backup and Recovery

#### Snapshot Repository Setup

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/mnt/backups"
  }
}'
```

#### Automated Backup Script

```bash
#!/bin/bash
SNAPSHOT_NAME="snapshot_$(date +%Y%m%d_%H%M%S)"
curl -X PUT "localhost:9200/_snapshot/my_backup/${SNAPSHOT_NAME}?wait_for_completion=true"
```

### Maintenance Procedures

#### Rolling Restart Procedure

```bash
# For each node in the cluster:
# 1. Disable shard allocation
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.enable": "none"
  }
}'

# 2. Stop OpenSearch
sudo systemctl stop opensearch

# 3. Perform maintenance

# 4. Start OpenSearch
sudo systemctl start opensearch

# 5. Wait for node to join cluster
curl -X GET "localhost:9200/_cat/nodes"

# 6. Re-enable shard allocation
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "cluster.routing.allocation.enable": "all"
  }
}'
```

#### Index Lifecycle Management

```bash
# Create index lifecycle policy
curl -X PUT "localhost:9200/_ilm/policy/my_policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "30d"
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "60d",
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

## Conclusion

This comprehensive guide should help you deploy, secure, optimize, and maintain OpenSearch in production environments. Remember to regularly check the [OpenSearch documentation](https://opensearch.org/docs/) for updates and new features that might affect your deployment strategy.

Production deployments require careful planning, monitoring, and maintenance. By following the practices outlined in this guide, you can build a robust, high-performance search infrastructure that meets your organization's needs.
