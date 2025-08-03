---
author: Anubhav Gain
pubDatetime: 2024-05-10T10:00:00Z
modDatetime: 2024-05-10T10:00:00Z
title: Running OpenSearch in Rootless Podman Containers - A Complete Guide
slug: opensearch-podman-rootless-setup
featured: true
draft: false
tags:
  - opensearch
  - podman
  - containers
  - security
  - elasticsearch
  - infrastructure
  - rootless
description: A comprehensive guide to setting up and running OpenSearch in rootless Podman containers with proper security configuration and systemd integration.
---

# Running OpenSearch in Rootless Podman Containers

Modern infrastructure demands robust security practices, and running containers with reduced privileges is a key component of defense-in-depth strategies. This guide demonstrates how to run OpenSearch in rootless Podman containers with proper systemd integration, enabling powerful search capabilities without requiring root privileges.

## Why Rootless Containers?

Rootless containers provide several security benefits:

1. **Reduced attack surface** - compromised containers can't easily escalate to root privileges
2. **User namespace isolation** - containers run with regular user privileges
3. **Improved security posture** - follows the principle of least privilege
4. **Regulatory compliance** - helps meet security requirements in regulated environments

## Prerequisites

Before starting, ensure you have:

- Linux system with Podman 3.0+ installed
- systemd user service support
- At least 2GB of available RAM (4GB+ recommended for production)
- Appropriate kernel settings (covered below)

## Step 1: System Preparation

First, we'll configure the necessary kernel parameters to allow for ElasticSearch-like applications in rootless containers:

```bash
# Create a sysctl configuration file
cat << EOF | sudo tee /etc/sysctl.d/99-opensearch.conf
vm.max_map_count=262144
fs.file-max=65536
EOF

# Apply the settings
sudo sysctl --system
```

## Step 2: Create Data Directory

Create a persistent storage location for OpenSearch data:

```bash
mkdir -p ~/.local/share/opensearch-data
chmod 700 ~/.local/share/opensearch-data
```

## Step 3: Create systemd Service File

Create a systemd user service file to manage the OpenSearch container:

```bash
mkdir -p ~/.config/systemd/user/
cat << EOF > ~/.config/systemd/user/container-opensearch-node1.service
[Unit]
Description=Podman container-opensearch-node1.service
Documentation=man:podman-generate-systemd(1)
Wants=network-online.target
After=network-online.target
RequiresMountsFor=%t/containers

[Service]
Environment=PODMAN_SYSTEMD_UNIT=%n
Restart=on-failure
TimeoutStopSec=70
ExecStartPre=/bin/rm -f %t/%n.ctr-id
ExecStart=/usr/bin/podman run \\
    --cidfile=%t/%n.ctr-id \\
    --cgroups=no-conmon \\
    --rm \\
    --sdnotify=conmon \\
    --replace \\
    -d \\
    --name opensearch-node1 \\
    -e cluster.name=opensearch-cluster \\
    -e node.name=opensearch-node1 \\
    -e discovery.type=single-node \\
    -e "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m" \\
    -e OPENSEARCH_INITIAL_ADMIN_PASSWORD=Anubhav@321 \\
    -e DISABLE_INSTALL_DEMO_CONFIG=false \\
    -e DISABLE_SECURITY_PLUGIN=false \\
    -e bootstrap.memory_lock=false \\
    --ulimit nofile=65536:65536 \\
    -v $HOME/.local/share/opensearch-data:/usr/share/opensearch/data:Z,rw \\
    -p 9200:9200 \\
    -p 9600:9600 \\
    --user $(id -u):$(id -g) \\
    docker.io/opensearchproject/opensearch:latest

ExecStop=/usr/bin/podman stop --ignore --cidfile=%t/%n.ctr-id
ExecStopPost=/usr/bin/podman rm -f --ignore --cidfile=%t/%n.ctr-id
Type=notify
NotifyAccess=all

[Install]
WantedBy=default.target
EOF
```

## Step 4: Enable and Start the Service

Now let's enable and start our OpenSearch service:

```bash
# Reload systemd configuration
systemctl --user daemon-reload

# Enable the service to start at login
systemctl --user enable container-opensearch-node1.service

# Start the service
systemctl --user start container-opensearch-node1.service

# Enable lingering to allow the service to run without being logged in
loginctl enable-linger $(whoami)
```

## Step 5: Verify the Deployment

After giving OpenSearch about 30-45 seconds to initialize, verify that it's running correctly:

```bash
# Check service status
systemctl --user status container-opensearch-node1.service

# Test HTTPS endpoint with admin credentials
curl -k -u admin:Anubhav@321 https://localhost:9200/_cluster/health
```

You should see output similar to:

```json
{
  "cluster_name": "opensearch-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "discovered_master": true,
  "active_primary_shards": 1,
  "active_shards": 1,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0,
  "delayed_unassigned_shards": 0,
  "number_of_pending_tasks": 0,
  "number_of_in_flight_fetch": 0,
  "task_max_waiting_in_queue_millis": 0,
  "active_shards_percent_as_number": 100.0
}
```

## Understanding the systemd Service Configuration

Let's break down the key parts of our service file:

### Container Runtime Options
