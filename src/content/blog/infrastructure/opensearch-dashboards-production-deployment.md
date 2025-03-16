---
author: Anubhav Gain
pubDatetime: 2024-04-26T09:00:00Z
modDatetime: 2024-04-26T09:00:00Z
title: Production Deployment Guide - OpenSearch Dashboards as a Systemd Service
slug: opensearch-dashboards-production-deployment
featured: true
draft: false
tags:
  - opensearch
  - dashboards
  - systemd
  - production
  - monitoring
  - devops
  - infrastructure
description: A comprehensive guide for deploying OpenSearch Dashboards as a systemd service in production environments, including configuration settings, permissions management, and common troubleshooting steps.
---

# Production Deployment Guide: OpenSearch Dashboards Service

This guide provides step-by-step instructions to deploy OpenSearch Dashboards as a systemd service on a production server. It covers configuration settings, directory permissions, service file configuration, and troubleshooting common issues like UUID file write errors.

## Overview

OpenSearch Dashboards is a powerful visualization tool for OpenSearch data. In a production environment, it is critical to run OpenSearch Dashboards as a managed systemd service with the proper permissions and configuration. This guide details how to configure the service, set up SSL (HTTPS on port 443), and resolve common permission issues that may arise during deployment.

## Prerequisites

Before proceeding with the deployment, ensure you have:

- A Linux server with OpenSearch Dashboards installed (using Tarball/RPM/Debian/Helm)
- Root access or sudo privileges
- SSL certificates (PEM format) available at the specified paths
- The opensearch-dashboards user is already created

If the opensearch-dashboards user doesn't exist, create it with:

```bash
sudo useradd -r -s /sbin/nologin opensearch-dashboards
```

You'll also need:

- OpenSearch Dashboards installation directory (default: `/usr/share/opensearch-dashboards`)
- Configuration directory (default: `/etc/opensearch-dashboards`)

## Directory and File Permissions

Proper permissions are crucial for security and functionality. Follow these steps to set up the necessary permissions:

### Set Ownership for Installation and Configuration Directories

```bash
sudo chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards
sudo chown -R opensearch-dashboards:opensearch-dashboards /etc/opensearch-dashboards
```

### Create and Set Permissions for the Data Directory

The UUID file is written in the data directory. Create it and set proper permissions:

```bash
sudo mkdir -p /usr/share/opensearch-dashboards/data
sudo chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/data
sudo chmod -R 755 /usr/share/opensearch-dashboards/data
```

## Configuration File

Edit the main configuration file located at `/etc/opensearch-dashboards/opensearch_dashboards.yml`. Below is an example configuration for a production environment:

```yaml
server.host: "0.0.0.0"
server.port: 443
server.ssl.enabled: true
server.ssl.certificate: "/etc/opensearch-dashboards/certs/dashboard.pem"
server.ssl.key: "/etc/opensearch-dashboards/certs/dashboard-key.pem"

opensearch.hosts:
  [
    "https://172.17.14.79:9200",
    "https://172.17.14.89:9200",
    "https://172.17.14.39:9200",
  ]
opensearch.ssl.verificationMode: certificate
opensearch.username: "admin"
opensearch.password: "Anubhav@321"
opensearch.requestHeadersAllowlist: ["securitytenant", "Authorization"]

opensearch_security.multitenancy.enabled: false
opensearch_security.readonly_mode.roles: ["kibana_read_only"]

uiSettings.overrides.defaultRoute: "/app/invinsense"
```

**Important Notes:**

- Ensure the certificate files exist and are accessible by the opensearch-dashboards user
- Replace the OpenSearch hosts with your actual OpenSearch cluster nodes
- Update credentials to match your environment's security configuration
- Consider storing passwords in a secure vault rather than in plaintext for production

## Systemd Service File Configuration

Create (or modify) the systemd service file at `/etc/systemd/system/opensearch-dashboards.service` with the following content:

```ini
[Unit]
Description=OpenSearch Dashboards
Documentation=https://opensearch.org/docs/
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=opensearch-dashboards
Group=opensearch-dashboards
Environment=NODE_ENV=production
WorkingDirectory=/usr/share/opensearch-dashboards
ExecStart=/usr/share/opensearch-dashboards/bin/opensearch-dashboards
Restart=on-failure
StandardOutput=journal
StandardError=inherit
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

**Key Configuration Points:**

- **User and Group**: The service runs as the opensearch-dashboards user
- **WorkingDirectory**: Must be set to the installation directory
- **ExecStart**: Path to the OpenSearch Dashboards startup script
- **Restart**: Set to restart on failure for improved reliability
- **LimitNOFILE**: Increased file descriptor limit for production workloads

After saving the file, reload systemd:

```bash
sudo systemctl daemon-reload
```

Then enable and start the service:

```bash
sudo systemctl enable opensearch-dashboards.service
sudo systemctl start opensearch-dashboards.service
```

## Reloading and Restarting the Service

After updating configurations or permissions, always reload the systemd daemon:

```bash
sudo systemctl daemon-reload
```

Then restart the service:

```bash
sudo systemctl restart opensearch-dashboards.service
```

Verify service status:

```bash
sudo systemctl status opensearch-dashboards.service
```

## Troubleshooting UUID File Write Errors

A common error when starting OpenSearch Dashboards is:
