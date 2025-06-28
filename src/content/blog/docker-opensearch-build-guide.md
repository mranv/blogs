---
author: Anubhav Gain
pubDatetime: 2025-01-28T17:00:00Z
title: "Building and Customizing OpenSearch with Docker: Complete Guide"
slug: docker-opensearch-build-guide
featured: false
draft: false
tags:
  - docker
  - opensearch
  - devops
  - containerization
  - elasticsearch
description: "A comprehensive guide to building custom OpenSearch Docker images, setting up development environments, and deploying production-ready OpenSearch clusters with Docker."
---

## Table of Contents

## Introduction

This guide covers building custom OpenSearch Docker images, creating development environments, and deploying production-ready OpenSearch clusters using Docker and Docker Compose. Whether you need a simple development setup or a complex production deployment, this guide has you covered.

## Building Custom OpenSearch Docker Images

### Basic Dockerfile

```dockerfile
# Dockerfile for custom OpenSearch image
FROM opensearchproject/opensearch:2.11.0

# Switch to root to install packages
USER root

# Install additional tools
RUN yum install -y \
    jq \
    curl \
    wget \
    net-tools \
    && yum clean all

# Install custom plugins
RUN /usr/share/opensearch/bin/opensearch-plugin install \
    --batch \
    repository-s3

RUN /usr/share/opensearch/bin/opensearch-plugin install \
    --batch \
    repository-gcs

# Copy custom configuration
COPY --chown=opensearch:opensearch config/opensearch.yml /usr/share/opensearch/config/
COPY --chown=opensearch:opensearch config/log4j2.properties /usr/share/opensearch/config/

# Copy custom scripts
COPY --chown=opensearch:opensearch scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy certificates
COPY --chown=opensearch:opensearch certs/ /usr/share/opensearch/config/certs/

# Set environment variables
ENV OPENSEARCH_JAVA_OPTS="-Xms1g -Xmx1g"
ENV discovery.type=single-node
ENV DISABLE_SECURITY_PLUGIN=false

# Switch back to opensearch user
USER opensearch

# Expose ports
EXPOSE 9200 9300 9600

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
```

### Advanced Multi-Stage Build

```dockerfile
# Multi-stage Dockerfile for optimized OpenSearch image
# Stage 1: Plugin builder
FROM opensearchproject/opensearch:2.11.0 AS plugin-builder

USER root

# Install build dependencies
RUN yum install -y \
    git \
    maven \
    java-11-openjdk-devel \
    && yum clean all

# Clone and build custom plugin
RUN git clone https://github.com/example/custom-plugin.git /tmp/custom-plugin
WORKDIR /tmp/custom-plugin
RUN mvn clean package

# Stage 2: Certificate generator
FROM alpine:latest AS cert-generator

RUN apk add --no-cache openssl

WORKDIR /certs

# Generate self-signed certificates
RUN openssl genrsa -out root-ca-key.pem 2048 && \
    openssl req -new -x509 -sha256 -key root-ca-key.pem -out root-ca.pem -days 730 \
    -subj "/C=US/ST=State/L=City/O=Org/OU=Unit/CN=root.example.com" && \
    openssl genrsa -out node-key-temp.pem 2048 && \
    openssl pkcs8 -inform PEM -outform PEM -in node-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out node-key.pem && \
    openssl req -new -key node-key.pem -out node.csr \
    -subj "/C=US/ST=State/L=City/O=Org/OU=Unit/CN=node.example.com" && \
    openssl x509 -req -in node.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out node.pem -days 730 && \
    rm node-key-temp.pem node.csr

# Stage 3: Final image
FROM opensearchproject/opensearch:2.11.0

USER root

# Install runtime dependencies only
RUN yum install -y \
    jq \
    curl \
    && yum clean all && \
    rm -rf /var/cache/yum

# Copy custom plugin from builder
COPY --from=plugin-builder /tmp/custom-plugin/target/custom-plugin-*.zip /tmp/
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch file:///tmp/custom-plugin-*.zip && \
    rm /tmp/custom-plugin-*.zip

# Copy certificates from generator
COPY --from=cert-generator --chown=opensearch:opensearch /certs /usr/share/opensearch/config/certs

# Copy custom configuration
COPY --chown=opensearch:opensearch config/ /usr/share/opensearch/config/

# Create necessary directories
RUN mkdir -p /usr/share/opensearch/data && \
    chown -R opensearch:opensearch /usr/share/opensearch/data

# Switch to opensearch user
USER opensearch

# Health check
HEALTHCHECK --interval=5s --timeout=2s --retries=12 \
    CMD curl -k -u admin:admin https://localhost:9200/_cluster/health || exit 1

EXPOSE 9200 9300

ENTRYPOINT ["/usr/share/opensearch/opensearch-docker-entrypoint.sh"]
CMD ["opensearch"]
```

### Custom Entry Point Script

```bash
#!/bin/bash
# docker-entrypoint.sh - Custom entrypoint for OpenSearch

set -e

# Function to wait for OpenSearch to start
wait_for_opensearch() {
    echo "Waiting for OpenSearch to start..."
    until curl -s -k -u admin:admin https://localhost:9200/_cluster/health >/dev/null 2>&1; do
        sleep 1
    done
    echo "OpenSearch is ready!"
}

# Set custom JVM options based on container memory
if [ -z "$OPENSEARCH_JAVA_OPTS" ]; then
    # Get container memory limit
    CONTAINER_MEMORY=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "2147483648")
    if [ "$CONTAINER_MEMORY" -gt "0" ] && [ "$CONTAINER_MEMORY" -lt "9223372036854775807" ]; then
        # Set heap to 50% of container memory
        HEAP_SIZE=$((CONTAINER_MEMORY / 2 / 1024 / 1024))m
        export OPENSEARCH_JAVA_OPTS="-Xms${HEAP_SIZE} -Xmx${HEAP_SIZE}"
        echo "Setting OPENSEARCH_JAVA_OPTS=$OPENSEARCH_JAVA_OPTS"
    fi
fi

# Configure security if enabled
if [ "$DISABLE_SECURITY_PLUGIN" != "true" ]; then
    # Initialize security index if this is the first node
    if [ "$NODE_NAME" = "opensearch-node1" ] || [ "$discovery.type" = "single-node" ]; then
        # Start OpenSearch in background
        /usr/share/opensearch/opensearch-docker-entrypoint.sh opensearch &
        OPENSEARCH_PID=$!

        # Wait for OpenSearch to be ready
        wait_for_opensearch

        # Initialize security index
        /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
            -cd /usr/share/opensearch/config/opensearch-security/ \
            -icl -nhnv \
            -cacert /usr/share/opensearch/config/certs/root-ca.pem \
            -cert /usr/share/opensearch/config/certs/admin.pem \
            -key /usr/share/opensearch/config/certs/admin-key.pem

        # Bring OpenSearch back to foreground
        wait $OPENSEARCH_PID
    else
        # Start normally for other nodes
        exec /usr/share/opensearch/opensearch-docker-entrypoint.sh opensearch
    fi
else
    # Start without security
    exec /usr/share/opensearch/opensearch-docker-entrypoint.sh opensearch
fi
```

## Docker Compose Configurations

### Development Environment

```yaml
# docker-compose.dev.yml - Development environment
version: "3.8"

services:
  opensearch:
    image: opensearchproject/opensearch:2.11.0
    container_name: opensearch-dev
    environment:
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
      - "DISABLE_SECURITY_PLUGIN=true"
      - "DISABLE_INSTALL_DEMO_CONFIG=true"
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch-data:/usr/share/opensearch/data
      - ./config/opensearch.yml:/usr/share/opensearch/config/opensearch.yml:ro
    ports:
      - 9200:9200
      - 9600:9600
    networks:
      - opensearch-net

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.0
    container_name: opensearch-dashboards-dev
    environment:
      - 'OPENSEARCH_HOSTS=["http://opensearch:9200"]'
      - "DISABLE_SECURITY_DASHBOARDS_PLUGIN=true"
    ports:
      - 5601:5601
    networks:
      - opensearch-net
    depends_on:
      - opensearch

volumes:
  opensearch-data:

networks:
  opensearch-net:
```

### Production Cluster

```yaml
# docker-compose.prod.yml - Production cluster with 3 nodes
version: "3.8"

services:
  opensearch-node1:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: opensearch-node1
    environment:
      - cluster.name=opensearch-cluster
      - node.name=opensearch-node1
      - discovery.seed_hosts=opensearch-node1,opensearch-node2,opensearch-node3
      - cluster.initial_cluster_manager_nodes=opensearch-node1,opensearch-node2,opensearch-node3
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
      - network.host=0.0.0.0
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch-data1:/usr/share/opensearch/data
      - ./certs:/usr/share/opensearch/config/certs:ro
      - ./config/opensearch.yml:/usr/share/opensearch/config/opensearch.yml:ro
    ports:
      - 9200:9200
      - 9300:9300
    networks:
      - opensearch-net
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "curl -k -u admin:admin https://localhost:9200/_cluster/health || exit 1",
        ]
      interval: 30s
      timeout: 10s
      retries: 5

  opensearch-node2:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: opensearch-node2
    environment:
      - cluster.name=opensearch-cluster
      - node.name=opensearch-node2
      - discovery.seed_hosts=opensearch-node1,opensearch-node2,opensearch-node3
      - cluster.initial_cluster_manager_nodes=opensearch-node1,opensearch-node2,opensearch-node3
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
      - network.host=0.0.0.0
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch-data2:/usr/share/opensearch/data
      - ./certs:/usr/share/opensearch/config/certs:ro
      - ./config/opensearch.yml:/usr/share/opensearch/config/opensearch.yml:ro
    networks:
      - opensearch-net
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "curl -k -u admin:admin https://localhost:9200/_cluster/health || exit 1",
        ]
      interval: 30s
      timeout: 10s
      retries: 5

  opensearch-node3:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: opensearch-node3
    environment:
      - cluster.name=opensearch-cluster
      - node.name=opensearch-node3
      - discovery.seed_hosts=opensearch-node1,opensearch-node2,opensearch-node3
      - cluster.initial_cluster_manager_nodes=opensearch-node1,opensearch-node2,opensearch-node3
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
      - network.host=0.0.0.0
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - opensearch-data3:/usr/share/opensearch/data
      - ./certs:/usr/share/opensearch/config/certs:ro
      - ./config/opensearch.yml:/usr/share/opensearch/config/opensearch.yml:ro
    networks:
      - opensearch-net
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "curl -k -u admin:admin https://localhost:9200/_cluster/health || exit 1",
        ]
      interval: 30s
      timeout: 10s
      retries: 5

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.11.0
    container_name: opensearch-dashboards
    environment:
      - 'OPENSEARCH_HOSTS=["https://opensearch-node1:9200","https://opensearch-node2:9200","https://opensearch-node3:9200"]'
      - "SERVER_SSL_ENABLED=true"
      - "SERVER_SSL_CERTIFICATE=/usr/share/opensearch-dashboards/config/certs/dashboard.pem"
      - "SERVER_SSL_KEY=/usr/share/opensearch-dashboards/config/certs/dashboard-key.pem"
      - "OPENSEARCH_SSL_CERTIFICATEAUTHORITIES=/usr/share/opensearch-dashboards/config/certs/root-ca.pem"
      - "OPENSEARCH_USERNAME=admin"
      - "OPENSEARCH_PASSWORD=admin"
    volumes:
      - ./certs:/usr/share/opensearch-dashboards/config/certs:ro
      - ./config/opensearch_dashboards.yml:/usr/share/opensearch-dashboards/config/opensearch_dashboards.yml:ro
    ports:
      - 5601:5601
    networks:
      - opensearch-net
    depends_on:
      - opensearch-node1
      - opensearch-node2
      - opensearch-node3
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: opensearch-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    ports:
      - 443:443
    networks:
      - opensearch-net
    depends_on:
      - opensearch-node1
      - opensearch-node2
      - opensearch-node3
    restart: unless-stopped

volumes:
  opensearch-data1:
  opensearch-data2:
  opensearch-data3:

networks:
  opensearch-net:
    driver: bridge
```

### Load Balancer Configuration

```nginx
# nginx/nginx.conf - Load balancer for OpenSearch cluster
events {
    worker_connections 1024;
}

http {
    upstream opensearch {
        least_conn;
        server opensearch-node1:9200 max_fails=3 fail_timeout=30s;
        server opensearch-node2:9200 max_fails=3 fail_timeout=30s;
        server opensearch-node3:9200 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 443 ssl;
        server_name opensearch.example.com;

        ssl_certificate /etc/nginx/certs/nginx.pem;
        ssl_certificate_key /etc/nginx/certs/nginx-key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass https://opensearch;
            proxy_http_version 1.1;
            proxy_set_header Connection "Keep-Alive";
            proxy_set_header Proxy-Connection "Keep-Alive";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 5s;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;

            # Buffer settings
            proxy_buffering off;
            proxy_request_buffering off;
        }

        location /_cluster/health {
            proxy_pass https://opensearch/_cluster/health;
            access_log off;
        }
    }
}
```

## Security Configuration

### Certificate Generation Script

```bash
#!/bin/bash
# generate-certs.sh - Generate certificates for OpenSearch cluster

CERT_DIR="./certs"
mkdir -p $CERT_DIR

# Generate Root CA
openssl genrsa -out $CERT_DIR/root-ca-key.pem 2048
openssl req -new -x509 -sha256 -key $CERT_DIR/root-ca-key.pem -out $CERT_DIR/root-ca.pem -days 730 \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=opensearch-ca"

# Generate Admin certificate
openssl genrsa -out $CERT_DIR/admin-key-temp.pem 2048
openssl pkcs8 -inform PEM -outform PEM -in $CERT_DIR/admin-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out $CERT_DIR/admin-key.pem
openssl req -new -key $CERT_DIR/admin-key.pem -out $CERT_DIR/admin.csr \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=admin"
openssl x509 -req -in $CERT_DIR/admin.csr -CA $CERT_DIR/root-ca.pem -CAkey $CERT_DIR/root-ca-key.pem -CAcreateserial -sha256 -out $CERT_DIR/admin.pem -days 730
rm $CERT_DIR/admin-key-temp.pem $CERT_DIR/admin.csr

# Generate node certificates
for i in 1 2 3; do
    openssl genrsa -out $CERT_DIR/node${i}-key-temp.pem 2048
    openssl pkcs8 -inform PEM -outform PEM -in $CERT_DIR/node${i}-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out $CERT_DIR/node${i}-key.pem
    openssl req -new -key $CERT_DIR/node${i}-key.pem -out $CERT_DIR/node${i}.csr \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=opensearch-node${i}"

    # Create SAN extension file
    cat > $CERT_DIR/node${i}.ext <<EOF
subjectAltName = DNS:opensearch-node${i},DNS:localhost,IP:127.0.0.1
EOF

    openssl x509 -req -in $CERT_DIR/node${i}.csr -CA $CERT_DIR/root-ca.pem -CAkey $CERT_DIR/root-ca-key.pem \
        -CAcreateserial -sha256 -out $CERT_DIR/node${i}.pem -days 730 -extfile $CERT_DIR/node${i}.ext

    rm $CERT_DIR/node${i}-key-temp.pem $CERT_DIR/node${i}.csr $CERT_DIR/node${i}.ext
done

# Generate Dashboard certificate
openssl genrsa -out $CERT_DIR/dashboard-key-temp.pem 2048
openssl pkcs8 -inform PEM -outform PEM -in $CERT_DIR/dashboard-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out $CERT_DIR/dashboard-key.pem
openssl req -new -key $CERT_DIR/dashboard-key.pem -out $CERT_DIR/dashboard.csr \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=opensearch-dashboards"
openssl x509 -req -in $CERT_DIR/dashboard.csr -CA $CERT_DIR/root-ca.pem -CAkey $CERT_DIR/root-ca-key.pem -CAcreateserial -sha256 -out $CERT_DIR/dashboard.pem -days 730
rm $CERT_DIR/dashboard-key-temp.pem $CERT_DIR/dashboard.csr

# Set permissions
chmod 600 $CERT_DIR/*-key.pem
chmod 644 $CERT_DIR/*.pem

echo "Certificates generated successfully in $CERT_DIR"
```

### Security Configuration Files

```yaml
# config/opensearch-security/internal_users.yml
_meta:
  type: "internalusers"
  config_version: 2

admin:
  hash: "$2y$12$88IFVl6IfIwCFh5aQYfOmuXVL9j2hz/GusQb35o.4sdTDAEMTOD.K"
  reserved: true
  backend_roles:
    - "admin"
  description: "Admin user"

kibanaserver:
  hash: "$2y$12$4AcgAt3xwOWadA5s5blL6ev39OXDNhmOesEoo33eZtrq2N0YrU3H."
  reserved: true
  description: "Kibana server user"

readall:
  hash: "$2y$12$ae4ycwzwvLtZxwZ82RmiEunBbIPiAmGZduBAjKN0TXdwQFtCwARz2"
  reserved: false
  backend_roles:
    - "readall"
  attributes:
    attribute1: "value1"
    attribute2: "value2"
  description: "Read-only user"
```

## Monitoring and Management

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Monitor OpenSearch cluster health

OPENSEARCH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check cluster health
echo "Checking cluster health..."
HEALTH=$(curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_cluster/health" | jq -r '.status')

case $HEALTH in
    "green")
        echo -e "${GREEN}Cluster health: GREEN${NC}"
        ;;
    "yellow")
        echo -e "${YELLOW}Cluster health: YELLOW${NC}"
        ;;
    "red")
        echo -e "${RED}Cluster health: RED${NC}"
        ;;
    *)
        echo -e "${RED}Unable to determine cluster health${NC}"
        exit 1
        ;;
esac

# Check node status
echo -e "\nNode Status:"
curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_cat/nodes?v"

# Check indices
echo -e "\nIndices:"
curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_cat/indices?v&s=index"

# Check disk usage
echo -e "\nDisk Usage:"
curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_cat/allocation?v"

# Check pending tasks
echo -e "\nPending Tasks:"
PENDING=$(curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_cluster/pending_tasks" | jq '.tasks | length')
if [ "$PENDING" -gt 0 ]; then
    echo -e "${YELLOW}Warning: $PENDING pending tasks${NC}"
else
    echo -e "${GREEN}No pending tasks${NC}"
fi
```

### Performance Monitoring

```yaml
# docker-compose.monitoring.yml - Add monitoring stack
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/usr/share/prometheus/console_libraries"
      - "--web.console.templates=/usr/share/prometheus/consoles"
    ports:
      - 9090:9090
    networks:
      - opensearch-net

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    ports:
      - 3000:3000
    networks:
      - opensearch-net
    depends_on:
      - prometheus

  opensearch-exporter:
    image: justwatch/elasticsearch_exporter:latest
    container_name: opensearch-exporter
    command:
      - "--es.uri=https://admin:admin@opensearch-node1:9200"
      - "--es.ssl-skip-verify"
      - "--es.all"
    ports:
      - 9114:9114
    networks:
      - opensearch-net
    depends_on:
      - opensearch-node1

volumes:
  prometheus-data:
  grafana-data:
```

## Backup and Restore

### Automated Backup Script

```bash
#!/bin/bash
# backup-opensearch.sh - Automated backup for OpenSearch

BACKUP_DIR="/backup/opensearch"
REPOSITORY_NAME="backup-repo"
OPENSEARCH_URL="https://localhost:9200"
USERNAME="admin"
PASSWORD="admin"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Register repository if it doesn't exist
echo "Registering backup repository..."
curl -s -k -u $USERNAME:$PASSWORD -X PUT "$OPENSEARCH_URL/_snapshot/$REPOSITORY_NAME" \
    -H 'Content-Type: application/json' \
    -d "{
        \"type\": \"fs\",
        \"settings\": {
            \"location\": \"$BACKUP_DIR\",
            \"compress\": true
        }
    }"

# Create snapshot
SNAPSHOT_NAME="snapshot-$(date +%Y%m%d-%H%M%S)"
echo "Creating snapshot: $SNAPSHOT_NAME"
curl -s -k -u $USERNAME:$PASSWORD -X PUT "$OPENSEARCH_URL/_snapshot/$REPOSITORY_NAME/$SNAPSHOT_NAME?wait_for_completion=true" \
    -H 'Content-Type: application/json' \
    -d '{
        "indices": "*",
        "ignore_unavailable": true,
        "include_global_state": true
    }'

# Clean up old snapshots
echo "Cleaning up old snapshots..."
OLD_SNAPSHOTS=$(curl -s -k -u $USERNAME:$PASSWORD "$OPENSEARCH_URL/_snapshot/$REPOSITORY_NAME/_all" | \
    jq -r ".snapshots[] | select(.start_time_in_millis < $(date -d "$RETENTION_DAYS days ago" +%s)000) | .snapshot")

for snapshot in $OLD_SNAPSHOTS; do
    echo "Deleting old snapshot: $snapshot"
    curl -s -k -u $USERNAME:$PASSWORD -X DELETE "$OPENSEARCH_URL/_snapshot/$REPOSITORY_NAME/$snapshot"
done

echo "Backup completed successfully"
```

### Docker Volume Backup

```bash
#!/bin/bash
# backup-volumes.sh - Backup Docker volumes

BACKUP_DIR="/backup/docker-volumes"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup each OpenSearch volume
for i in 1 2 3; do
    VOLUME_NAME="opensearch-data${i}"
    echo "Backing up volume: $VOLUME_NAME"

    docker run --rm \
        -v ${VOLUME_NAME}:/data \
        -v ${BACKUP_DIR}:/backup \
        alpine \
        tar czf /backup/${VOLUME_NAME}-${DATE}.tar.gz -C /data .
done

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Volume backup completed"
```

## Troubleshooting

### Common Issues and Solutions

```bash
#!/bin/bash
# troubleshoot.sh - Common troubleshooting commands

echo "=== OpenSearch Troubleshooting ==="

# Check container status
echo "\n1. Container Status:"
docker-compose ps

# Check container logs
echo "\n2. Recent logs:"
for node in opensearch-node1 opensearch-node2 opensearch-node3; do
    echo "\n--- $node ---"
    docker logs --tail 20 $node 2>&1 | grep -E "ERROR|WARN|Exception"
done

# Check resource usage
echo "\n3. Resource Usage:"
docker stats --no-stream

# Check cluster allocation
echo "\n4. Cluster Allocation:"
curl -s -k -u admin:admin "https://localhost:9200/_cluster/allocation/explain?pretty"

# Check unassigned shards
echo "\n5. Unassigned Shards:"
curl -s -k -u admin:admin "https://localhost:9200/_cat/shards?h=index,shard,prirep,state,unassigned.reason&s=state"

# Check cluster settings
echo "\n6. Cluster Settings:"
curl -s -k -u admin:admin "https://localhost:9200/_cluster/settings?pretty"
```

### Debug Mode Docker Compose

```yaml
# docker-compose.debug.yml - Debug configuration
version: "3.8"

services:
  opensearch-debug:
    image: opensearchproject/opensearch:2.11.0
    container_name: opensearch-debug
    environment:
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
      - "DISABLE_SECURITY_PLUGIN=true"
      - "logger.level=DEBUG"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./logs:/usr/share/opensearch/logs
    ports:
      - 9200:9200
      - 5005:5005 # Debug port
    stdin_open: true
    tty: true
    command: ["/bin/bash"]
```

## Performance Optimization

### JVM Tuning

```dockerfile
# Dockerfile with JVM optimization
FROM opensearchproject/opensearch:2.11.0

# Copy custom JVM options
COPY --chown=opensearch:opensearch jvm.options /usr/share/opensearch/config/jvm.options.d/custom.options

# jvm.options content:
# -Xms4g
# -Xmx4g
# -XX:+UseG1GC
# -XX:G1ReservePercent=25
# -XX:InitiatingHeapOccupancyPercent=30
# -XX:+HeapDumpOnOutOfMemoryError
# -XX:HeapDumpPath=/usr/share/opensearch/logs
# -XX:ErrorFile=/usr/share/opensearch/logs/hs_err_pid%p.log
# -XX:+ExitOnOutOfMemoryError
```

### Resource Limits

```yaml
# docker-compose with resource limits
services:
  opensearch:
    image: opensearchproject/opensearch:2.11.0
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 4G
        reservations:
          cpus: "1.0"
          memory: 2G
    environment:
      - "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
```

## Best Practices

1. **Security**

   - Always use TLS/SSL in production
   - Change default passwords immediately
   - Use strong certificates
   - Enable audit logging

2. **Performance**

   - Set heap size to 50% of available RAM (max 32GB)
   - Use SSDs for data volumes
   - Monitor and tune thread pools
   - Implement proper index lifecycle management

3. **High Availability**

   - Use at least 3 master-eligible nodes
   - Distribute nodes across availability zones
   - Implement proper backup strategies
   - Monitor cluster health continuously

4. **Container Best Practices**
   - Use specific version tags, not 'latest'
   - Implement health checks
   - Use init containers for setup tasks
   - Properly handle signals for graceful shutdown

## Conclusion

Docker provides an excellent platform for running OpenSearch, from development environments to production clusters. Key considerations:

- Use multi-stage builds for optimized images
- Implement proper security from the start
- Monitor and tune performance based on workload
- Automate backup and maintenance tasks
- Use orchestration tools for production deployments

This guide provides a solid foundation for building and deploying OpenSearch with Docker, but remember to adapt configurations to your specific requirements and constraints.
