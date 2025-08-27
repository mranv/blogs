---
author: Anubhav Gain
pubDatetime: 2025-01-28T16:00:00Z
title: "Comprehensive OpenSearch Configuration Guide for Production"
slug: opensearch-configuration-guide
featured: false
draft: false
tags:
  - opensearch
  - elasticsearch
  - configuration
  - security
  - performance
category: Database
description: "A detailed guide to configuring OpenSearch for production environments, covering memory settings, security, performance tuning, and cluster optimization."
---

## Table of Contents

## Introduction

OpenSearch is a community-driven, open-source search and analytics suite derived from Elasticsearch 7.10.2. This guide provides comprehensive configuration recommendations for deploying OpenSearch in production environments, focusing on performance, security, and reliability.

## Essential opensearch.yml Configuration

Here's a production-ready `opensearch.yml` configuration with detailed explanations:

```yaml
# ======================== OpenSearch Configuration =========================
#
# NOTE: OpenSearch comes with reasonable defaults for most settings.
#       Before you set out to tweak and tune the configuration, make sure you
#       understand what are you trying to accomplish and the consequences.
#
# The primary way of configuring a node is via this file. This template lists
# the most important settings you may want to configure for a production cluster.
#
# Please consult the documentation for further information on configuration options:
# https://opensearch.org/docs/latest/
#
# ---------------------------------- Cluster -----------------------------------
#
# Use a descriptive name for your cluster:
#
cluster.name: wazuh-cluster
#
# ------------------------------------ Node ------------------------------------
#
# Use a descriptive name for the node:
#
node.name: node-1
#
# Add custom attributes to the node:
#
#node.attr.rack: r1
#
node.max_local_storage_nodes: "3"
#
# ----------------------------------- Paths ------------------------------------
#
# Path to directory where to store the data (separate multiple locations by comma):
#
path.data: /var/lib/opensearch
#
# Path to log files:
#
path.logs: /var/log/opensearch
#
# ----------------------------------- Memory -----------------------------------
#
# Lock the memory on startup:
#
#bootstrap.memory_lock: true
#
# Make sure that the heap size is set to about half the memory available
# on the system and that the owner of the process is allowed to use this
# limit.
#
# OpenSearch performs poorly when the system is swapping the memory.
#
# ---------------------------------- Network -----------------------------------
#
# Set the bind address to a specific IP (IPv4 or IPv6):
#
network.host: "0.0.0.0"
#
# Set a custom port for HTTP:
#
http.port: 9200
#
# For more information, consult the network module documentation.
#
# --------------------------------- Discovery ----------------------------------
#
# Pass an initial list of hosts to perform discovery when this node is started:
# The default list of hosts is ["127.0.0.1", "[::1]"]
#
#discovery.seed_hosts: ["host1", "host2"]
#
# Bootstrap the cluster using an initial set of master-eligible nodes:
#
#cluster.initial_master_nodes: ["node-1", "node-2"]
#
# For more information, consult the discovery and cluster formation module documentation.
#
# ---------------------------------- Gateway -----------------------------------
#
# Block initial recovery after a full cluster restart until N nodes are started:
#
#gateway.recover_after_nodes: 3
#
# For more information, consult the gateway module documentation.
#
# ---------------------------------- Various -----------------------------------
#
# Require explicit names when deleting indices:
#
#action.destructive_requires_name: true

######## Start OpenSearch Security Demo Configuration ########
# WARNING: revise all the lines below before you go into production
plugins.security.ssl.transport.pemcert_filepath: /etc/opensearch/certs/indexer.pem
plugins.security.ssl.transport.pemkey_filepath: /etc/opensearch/certs/indexer-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.transport.resolve_hostname: false
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: /etc/opensearch/certs/indexer.pem
plugins.security.ssl.http.pemkey_filepath: /etc/opensearch/certs/indexer-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem
plugins.security.allow_unsafe_democertificates: false
plugins.security.allow_default_init_securityindex: true
plugins.security.authcz.admin_dn:
  - CN=admin,OU=Wazuh,O=Wazuh,L=California,C=US
plugins.security.enable_snapshot_restore_privilege: true
plugins.security.check_snapshot_restore_write_privileges: true
plugins.security.restapi.roles_enabled:
  ["all_access", "security_rest_api_access"]
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices:
  [
    ".plugins-ml-model",
    ".plugins-ml-task",
    ".opendistro-alerting-config",
    ".opendistro-alerting-alert*",
    ".opendistro-anomaly-results*",
    ".opendistro-anomaly-detector*",
    ".opendistro-anomaly-checkpoints",
    ".opendistro-anomaly-detection-state",
    ".opendistro-reports-*",
    ".opensearch-notifications-*",
    ".opensearch-notebooks",
    ".opensearch-observability",
    ".opendistro-asynchronous-search-response*",
    ".replication-metadata-store",
  ]
######## End OpenSearch Security Demo Configuration ########

plugins.security.nodes_dn:
  - CN=node-1,OU=Wazuh,O=Wazuh,L=California,C=US

### Option to allow Filebeat-oss 7.10.2 to work ###
compatibility.override_main_response_version: true
```

## Production-Ready Configuration

### Complete Production opensearch.yml

```yaml
# ======================== OpenSearch Production Configuration =========================

# ---------------------------------- Cluster -----------------------------------
cluster.name: production-opensearch

# Prevent split brain
cluster.initial_master_nodes:
  - master-node-1
  - master-node-2
  - master-node-3

# Cluster routing settings
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
cluster.routing.allocation.disk.watermark.flood_stage: 95%

# ------------------------------------ Node ------------------------------------
node.name: ${NODE_NAME}
node.roles: [data, ingest, master, ml, remote_cluster_client]

# Node attributes for shard allocation awareness
node.attr.zone: ${ZONE}
node.attr.temp: hot

# ----------------------------------- Paths ------------------------------------
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch
path.repo: /backup/opensearch

# ----------------------------------- Memory -----------------------------------
# Lock memory to prevent swapping
bootstrap.memory_lock: true

# ---------------------------------- Network -----------------------------------
network.host: ${NETWORK_HOST}
http.port: 9200
transport.port: 9300

# Bind to both loopback and external
network.bind_host: 0.0.0.0
network.publish_host: ${EXTERNAL_IP}

# --------------------------------- Discovery ----------------------------------
discovery.seed_hosts:
  - master-node-1:9300
  - master-node-2:9300
  - master-node-3:9300

# Minimum master nodes to prevent split brain
discovery.zen.minimum_master_nodes: 2

# ---------------------------------- Security ----------------------------------
plugins.security.ssl.transport.pemcert_filepath: /etc/opensearch/certs/node.pem
plugins.security.ssl.transport.pemkey_filepath: /etc/opensearch/certs/node-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: true
plugins.security.ssl.transport.resolve_hostname: true

plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: /etc/opensearch/certs/node.pem
plugins.security.ssl.http.pemkey_filepath: /etc/opensearch/certs/node-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem

# Security plugin settings
plugins.security.authcz.admin_dn:
  - CN=admin,OU=IT,O=Company,L=City,C=US

plugins.security.nodes_dn:
  - CN=*.opensearch.company.com,OU=IT,O=Company,L=City,C=US

plugins.security.audit.enable_rest: true
plugins.security.audit.enable_transport: false
plugins.security.audit.resolve_bulk_requests: true
plugins.security.audit.config.disabled_rest_categories: NONE
plugins.security.audit.config.disabled_transport_categories: NONE

# ---------------------------------- Performance -------------------------------
# Thread pool settings
thread_pool.search.size: 50
thread_pool.search.queue_size: 1000
thread_pool.write.size: 30
thread_pool.write.queue_size: 500

# Indexing buffer
indices.memory.index_buffer_size: 20%
indices.memory.min_index_buffer_size: 96mb

# Field data cache
indices.fielddata.cache.size: 30%

# Query cache
indices.queries.cache.size: 10%

# Request cache
indices.requests.cache.size: 2%

# Recovery settings
indices.recovery.max_bytes_per_sec: 100mb

# ---------------------------------- Monitoring --------------------------------
# Enable monitoring
http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: "X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization"
http.cors.allow-credentials: true

# ---------------------------------- Snapshot ----------------------------------
# Repository settings
repositories.url.allowed_urls:
  - "http://backup.company.com/*"
  - "https://s3.amazonaws.com/*"

# ----------------------------------- Misc -------------------------------------
# Prevent accidental cluster deletion
action.destructive_requires_name: true

# Script settings
script.allowed_types: inline, stored
script.allowed_contexts: search, update, ingest

# Machine learning
node.ml: true
xpack.ml.enabled: true
```

## JVM Configuration

### jvm.options Configuration

```bash
## JVM configuration

################################################################
## IMPORTANT: JVM heap size
################################################################
##
## You should always set the min and max JVM heap
## size to the same value. For example, to set
## the heap to 4 GB, set:
##
## -Xms4g
## -Xmx4g
##
## See https://opensearch.org/docs/latest/opensearch/install/important-settings/
## for more information
##
################################################################

# Xms represents the initial size of total heap space
# Xmx represents the maximum size of total heap space

-Xms16g
-Xmx16g

################################################################
## Expert settings
################################################################
##
## All settings below this section are considered
## expert settings. Don't tamper with them unless
## you understand what you are doing
##
################################################################

## GC configuration
8-13:-XX:+UseConcMarkSweepGC
8-13:-XX:CMSInitiatingOccupancyFraction=75
8-13:-XX:+UseCMSInitiatingOccupancyOnly

## G1GC Configuration
# NOTE: G1 GC is only supported on JDK version 10 or later
# to use G1GC, uncomment the next two lines and update the version on the
# following three lines to your version of the JDK
# 10-13:-XX:-UseConcMarkSweepGC
# 10-13:-XX:-UseCMSInitiatingOccupancyOnly
14-:-XX:+UseG1GC
14-:-XX:G1ReservePercent=25
14-:-XX:InitiatingHeapOccupancyPercent=30

## JVM temporary directory
-Djava.io.tmpdir=${OPENSEARCH_TMPDIR}

## heap dumps

# generate a heap dump when an allocation from the Java heap fails
# heap dumps are created in the working directory of the JVM
-XX:+HeapDumpOnOutOfMemoryError

# specify an alternative path for heap dumps; ensure the directory exists and
# has sufficient space
-XX:HeapDumpPath=/var/lib/opensearch

# specify an alternative path for JVM fatal error logs
-XX:ErrorFile=/var/log/opensearch/hs_err_pid%p.log

## JDK 8 GC logging
8:-XX:+PrintGCDetails
8:-XX:+PrintGCDateStamps
8:-XX:+PrintTenuringDistribution
8:-XX:+PrintGCApplicationStoppedTime
8:-Xloggc:/var/log/opensearch/gc.log
8:-XX:+UseGCLogFileRotation
8:-XX:NumberOfGCLogFiles=32
8:-XX:GCLogFileSize=64m

# JDK 9+ GC logging
9-:-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/opensearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m

# Enable preview features for Java 14+
14-:--enable-preview

# Performance settings
-XX:MaxDirectMemorySize=8g
-XX:+AlwaysPreTouch
-XX:+DisableExplicitGC
-XX:+UseStringDeduplication
```

## Security Configuration

### Setting Up SSL/TLS

```bash
#!/bin/bash
# Generate certificates for OpenSearch cluster

# Create CA
openssl genrsa -out root-ca-key.pem 2048
openssl req -new -x509 -sha256 -key root-ca-key.pem -out root-ca.pem -days 3650 \
  -subj "/C=US/ST=State/L=City/O=Company/OU=IT/CN=OpenSearch Root CA"

# Create node certificate
openssl genrsa -out node-key-temp.pem 2048
openssl pkcs8 -inform PEM -outform PEM -in node-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out node-key.pem
openssl req -new -key node-key.pem -out node.csr \
  -subj "/C=US/ST=State/L=City/O=Company/OU=IT/CN=*.opensearch.company.com"

# Sign certificate
openssl x509 -req -in node.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out node.pem -days 3650

# Set permissions
chmod 600 *-key.pem
chmod 644 *.pem
```

### Security Plugin Configuration

```yaml
# config/opensearch-security/config.yml
_meta:
  type: "config"
  config_version: 2

config:
  dynamic:
    authc:
      basic_internal_auth_domain:
        description: "Authenticate via HTTP Basic against internal users database"
        http_enabled: true
        transport_enabled: true
        order: 0
        http_authenticator:
          type: basic
          challenge: true
        authentication_backend:
          type: intern

      ldap:
        description: "Authenticate via LDAP"
        http_enabled: true
        transport_enabled: true
        order: 1
        http_authenticator:
          type: basic
          challenge: true
        authentication_backend:
          type: ldap
          config:
            enable_ssl: true
            enable_start_tls: false
            enable_ssl_client_auth: false
            verify_hostnames: true
            hosts:
              - ldap.company.com:636
            bind_dn: cn=admin,dc=company,dc=com
            password: "ldap_password"
            userbase: ou=people,dc=company,dc=com
            usersearch: (uid={0})
            username_attribute: uid

    authz:
      roles_from_myldap:
        description: "Authorize via LDAP"
        http_enabled: true
        transport_enabled: true
        authorization_backend:
          type: ldap
          config:
            enable_ssl: true
            enable_start_tls: false
            enable_ssl_client_auth: false
            verify_hostnames: true
            hosts:
              - ldap.company.com:636
            bind_dn: cn=admin,dc=company,dc=com
            password: "ldap_password"
            rolebase: ou=groups,dc=company,dc=com
            rolesearch: (member={0})
            userroleattribute: null
            userrolename: memberOf
            rolename: cn
            resolve_nested_roles: true
```

## Performance Tuning

### System Settings

```bash
#!/bin/bash
# System performance tuning for OpenSearch

# Disable swap
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Set vm.max_map_count
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

# Set file descriptors
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* soft nproc 4096" | sudo tee -a /etc/security/limits.conf
echo "* hard nproc 4096" | sudo tee -a /etc/security/limits.conf

# Set memlock for opensearch user
echo "opensearch soft memlock unlimited" | sudo tee -a /etc/security/limits.conf
echo "opensearch hard memlock unlimited" | sudo tee -a /etc/security/limits.conf

# Apply sysctl settings
sudo sysctl -p

# Configure transparent huge pages
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/defrag

# Create systemd drop-in for OpenSearch
sudo mkdir -p /etc/systemd/system/opensearch.service.d
cat <<EOF | sudo tee /etc/systemd/system/opensearch.service.d/override.conf
[Service]
LimitNOFILE=65535
LimitNPROC=4096
LimitMEMLOCK=infinity
EOF

sudo systemctl daemon-reload
```

### Index Settings for Performance

```json
{
  "settings": {
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "refresh_interval": "30s",
      "translog": {
        "durability": "async",
        "sync_interval": "30s",
        "flush_threshold_size": "512mb"
      },
      "merge": {
        "scheduler": {
          "max_thread_count": 1
        },
        "policy": {
          "max_merged_segment": "5gb"
        }
      },
      "unassigned": {
        "node_left": {
          "delayed_timeout": "5m"
        }
      }
    },
    "analysis": {
      "analyzer": {
        "default": {
          "type": "standard",
          "stopwords": "_english_"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "@timestamp": {
        "type": "date"
      },
      "message": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```

## Monitoring and Alerting

### Monitoring Configuration

```yaml
# Enable monitoring APIs
http.detailed_errors.enabled: true
rest.action.multi.allow_explicit_index: true

# Monitoring settings
monitoring.enabled: true
monitoring.collection.enabled: true
monitoring.collection.interval: 10s
monitoring.history.duration: 7d
```

### Setting Up Alerts

```json
{
  "trigger": {
    "schedule": {
      "interval": {
        "period": 1,
        "unit": "MINUTES"
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": [".opensearch-cluster-stats*"],
        "body": {
          "query": {
            "bool": {
              "filter": [
                {
                  "range": {
                    "@timestamp": {
                      "gte": "now-5m"
                    }
                  }
                },
                {
                  "range": {
                    "nodes.jvm.mem.heap_used_percent": {
                      "gte": 90
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total.value": {
        "gt": 0
      }
    }
  },
  "actions": {
    "send_email": {
      "email": {
        "to": ["ops-team@company.com"],
        "subject": "High JVM Memory Usage Alert",
        "body": "OpenSearch cluster is experiencing high JVM memory usage (>90%)"
      }
    }
  }
}
```

## Backup and Recovery

### Snapshot Repository Configuration

```bash
# Create S3 repository
curl -XPUT "https://localhost:9200/_snapshot/s3_backup" \
  -H 'Content-Type: application/json' \
  -u admin:password \
  --insecure \
  -d '{
    "type": "s3",
    "settings": {
      "bucket": "opensearch-backups",
      "region": "us-east-1",
      "base_path": "snapshots",
      "compress": true,
      "chunk_size": "100mb",
      "max_restore_bytes_per_sec": "40mb",
      "max_snapshot_bytes_per_sec": "40mb"
    }
  }'

# Create snapshot policy
curl -XPUT "https://localhost:9200/_plugins/_sm/policies/daily_backup" \
  -H 'Content-Type: application/json' \
  -u admin:password \
  --insecure \
  -d '{
    "description": "Daily backup policy",
    "creation": {
      "schedule": {
        "cron": {
          "expression": "0 0 2 * * ?",
          "timezone": "UTC"
        }
      },
      "time_limit": "1h"
    },
    "deletion": {
      "condition": {
        "max_age": "30d",
        "max_count": 30,
        "min_count": 7
      },
      "time_limit": "1h"
    },
    "snapshot_config": {
      "indices": "*",
      "ignore_unavailable": true,
      "include_global_state": false,
      "partial": true
    }
  }'
```

## Cluster Management

### Shard Allocation Filtering

```bash
# Exclude a node from allocation
curl -XPUT "https://localhost:9200/_cluster/settings" \
  -H 'Content-Type: application/json' \
  -u admin:password \
  --insecure \
  -d '{
    "transient": {
      "cluster.routing.allocation.exclude._ip": "192.168.1.100"
    }
  }'

# Set allocation awareness
curl -XPUT "https://localhost:9200/_cluster/settings" \
  -H 'Content-Type: application/json' \
  -u admin:password \
  --insecure \
  -d '{
    "persistent": {
      "cluster.routing.allocation.awareness.attributes": "zone",
      "cluster.routing.allocation.awareness.force.zone.values": ["zone1", "zone2"]
    }
  }'
```

### Index Lifecycle Management

```json
{
  "policy": {
    "description": "Hot-Warm-Cold architecture policy",
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [
          {
            "rollover": {
              "min_size": "50gb",
              "min_index_age": "7d"
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
              "number_of_replicas": 1
            }
          },
          {
            "shrink": {
              "number_of_shards": 1
            }
          },
          {
            "allocation": {
              "require": {
                "temp": "warm"
              }
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
            "replica_count": {
              "number_of_replicas": 0
            }
          },
          {
            "allocation": {
              "require": {
                "temp": "cold"
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

## Troubleshooting

### Common Issues and Solutions

1. **High JVM Memory Usage**

   ```bash
   # Check heap usage
   curl -XGET "https://localhost:9200/_nodes/stats/jvm?pretty" \
     -u admin:password --insecure

   # Force garbage collection (use with caution)
   curl -XPOST "https://localhost:9200/_nodes/_local/_hot_threads" \
     -u admin:password --insecure
   ```

2. **Slow Queries**

   ```bash
   # Enable slow log
   curl -XPUT "https://localhost:9200/_all/_settings" \
     -H 'Content-Type: application/json' \
     -u admin:password \
     --insecure \
     -d '{
       "index.search.slowlog.threshold.query.warn": "10s",
       "index.search.slowlog.threshold.query.info": "5s",
       "index.search.slowlog.threshold.query.debug": "2s",
       "index.search.slowlog.threshold.query.trace": "500ms",
       "index.search.slowlog.threshold.fetch.warn": "1s",
       "index.search.slowlog.threshold.fetch.info": "800ms",
       "index.search.slowlog.threshold.fetch.debug": "500ms",
       "index.search.slowlog.threshold.fetch.trace": "200ms"
     }'
   ```

3. **Shard Allocation Issues**

   ```bash
   # Check allocation explanation
   curl -XGET "https://localhost:9200/_cluster/allocation/explain?pretty" \
     -u admin:password --insecure

   # Enable allocation
   curl -XPUT "https://localhost:9200/_cluster/settings" \
     -H 'Content-Type: application/json' \
     -u admin:password \
     --insecure \
     -d '{
       "transient": {
         "cluster.routing.allocation.enable": "all"
       }
     }'
   ```

## Best Practices

1. **Hardware Recommendations**
   - Use SSDs for data storage
   - Minimum 64GB RAM for production
   - Dedicate 50% of RAM to JVM heap (max 32GB)
   - Use multiple data paths for better I/O

2. **Index Design**
   - Use time-based indices for logs
   - Implement proper mapping before indexing
   - Use index templates for consistent settings
   - Consider hot-warm-cold architecture

3. **Security**
   - Always use TLS/SSL in production
   - Implement strong authentication
   - Regular security audits
   - Keep OpenSearch updated

4. **Monitoring**
   - Monitor cluster health continuously
   - Set up alerts for critical metrics
   - Regular backup verification
   - Track query performance

## Conclusion

Proper OpenSearch configuration is crucial for building a reliable, performant, and secure search infrastructure. This guide provides a comprehensive foundation for production deployments, but remember to adjust settings based on your specific workload, hardware, and requirements. Regular monitoring, maintenance, and optimization are key to maintaining a healthy OpenSearch cluster.
