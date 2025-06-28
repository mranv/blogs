---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:00:00Z
title: "Migration Guide: Wazuh to OpenSearch Single Node"
slug: wazuh-to-opensearch-migration
featured: false
draft: false
tags:
  - wazuh
  - opensearch
  - migration
  - security
  - siem
description: "A comprehensive step-by-step guide to migrate from Wazuh indexer to OpenSearch while preserving your data and configurations."
---

## Table of Contents

## Introduction

This guide provides a comprehensive step-by-step process to migrate from Wazuh indexer to OpenSearch while preserving your data and configurations. This migration allows you to leverage OpenSearch's advanced features while maintaining your existing security monitoring infrastructure.

## Prerequisites

Before starting the migration process, ensure you have:

- Root access to the server
- Backup of your data (highly recommended)
- At least 20GB of free disk space
- Basic understanding of Linux command line

## Step 1: Install OpenSearch

First, we need to install OpenSearch on your system:

```bash
# Install OpenSearch if not already installed
apt-get update
apt-get install -y opensearch
```

## Step 2: Stop Services

Before migrating data, stop both services to prevent conflicts:

```bash
# Stop Wazuh indexer and OpenSearch services
systemctl stop wazuh-indexer
systemctl stop opensearch
```

## Step 3: Migrate Data Directory

Now we'll move the Wazuh indexer data to OpenSearch:

```bash
# Move Wazuh indexer data to OpenSearch
mv /var/lib/wazuh-indexer/* /var/lib/opensearch/
chown -R opensearch:opensearch /var/lib/opensearch
```

## Step 4: Copy Certificates

OpenSearch needs access to the same certificates used by Wazuh:

```bash
# Create OpenSearch certificates directory
mkdir -p /etc/opensearch/certs

# Copy certificates from Wazuh
cp /etc/wazuh-indexer/certs/indexer.pem /etc/opensearch/certs/
cp /etc/wazuh-indexer/certs/indexer-key.pem /etc/opensearch/certs/
cp /etc/wazuh-indexer/certs/root-ca.pem /etc/opensearch/certs/

# Set proper permissions
chown -R opensearch:opensearch /etc/opensearch/certs
chmod 600 /etc/opensearch/certs/indexer-key.pem
chmod 644 /etc/opensearch/certs/indexer.pem
chmod 644 /etc/opensearch/certs/root-ca.pem
```

## Step 5: Copy Security Configuration

Copy the security configuration from Wazuh to OpenSearch:

```bash
# Copy security configuration from Wazuh
cp /etc/wazuh-indexer/opensearch-security/roles.yml /etc/opensearch/opensearch-security/
cp /etc/wazuh-indexer/opensearch-security/internal_users.yml /etc/opensearch/opensearch-security/
cp /etc/wazuh-indexer/opensearch-security/roles_mapping.yml /etc/opensearch/opensearch-security/
cp /etc/wazuh-indexer/opensearch-security/config.yml /etc/opensearch/opensearch-security/

# Set proper permissions
chown -R opensearch:opensearch /etc/opensearch/opensearch-security/
```

## Step 6: Configure OpenSearch

Create or update `/etc/opensearch/opensearch.yml` with the following configuration:

```yaml
# ======================== OpenSearch Configuration =========================

# ---------------------------------- Cluster -----------------------------------
cluster.name: "wazuh-cluster"

# ------------------------------------ Node ------------------------------------
node.name: "node-1"
node.max_local_storage_nodes: "3"

# ----------------------------------- Paths ------------------------------------
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch

# ---------------------------------- Network -----------------------------------
network.host: "0.0.0.0"

# --------------------------------- Discovery ----------------------------------
discovery.type: single-node

# ---------------------------------- Security ----------------------------------
plugins.security.ssl.http.pemcert_filepath: /etc/opensearch/certs/indexer.pem
plugins.security.ssl.http.pemkey_filepath: /etc/opensearch/certs/indexer-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem
plugins.security.ssl.transport.pemcert_filepath: /etc/opensearch/certs/indexer.pem
plugins.security.ssl.transport.pemkey_filepath: /etc/opensearch/certs/indexer-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: /etc/opensearch/certs/root-ca.pem
plugins.security.ssl.http.enabled: true
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.transport.resolve_hostname: false

plugins.security.authcz.admin_dn:
- "CN=admin,OU=Wazuh,O=Wazuh,L=California,C=US"
plugins.security.check_snapshot_restore_write_privileges: true
plugins.security.enable_snapshot_restore_privilege: true
plugins.security.nodes_dn:
- "CN=node-1,OU=Wazuh,O=Wazuh,L=California,C=US"
plugins.security.restapi.roles_enabled:
- "all_access"
- "security_rest_api_access"

plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [".plugins-ml-model", ".plugins-ml-task", ".opendistro-alerting-config", ".opendistro-alerting-alert*", ".opendistro-anomaly-results*", ".opendistro-anomaly-detector*", ".opendistro-anomaly-checkpoints", ".opendistro-anomaly-detection-state", ".opendistro-reports-*", ".opensearch-notifications-*", ".opensearch-notebooks", ".opensearch-observability", ".opendistro-asynchronous-search-response*", ".replication-metadata-store"]

# Allow security index initialization
plugins.security.allow_default_init_securityindex: true

# ---------------------------------- Compatibility -----------------------------------
### Option to allow Filebeat-oss 7.10.2 to work ###
compatibility.override_main_response_version: true

# ---------------------------------- Performance Analyzer -----------------------------------
# Disable performance analyzer to avoid permission issues
performance_analyzer.enabled: false
```

## Step 7: Start OpenSearch

Now start the OpenSearch service:

```bash
# Start OpenSearch
systemctl start opensearch

# Wait a moment for OpenSearch to start
sleep 30
```

## Step 8: Set Up OpenSearch Dashboards

Install and configure OpenSearch Dashboards:

```bash
# Install OpenSearch Dashboards if not already installed
apt-get install -y opensearch-dashboards
```

Create or update `/etc/opensearch-dashboards/opensearch_dashboards.yml`:

```yaml
server.host: 0.0.0.0
server.port: 443
opensearch.hosts: https://localhost:9200
opensearch.ssl.verificationMode: certificate
opensearch.username: "admin"
opensearch.password: "your_admin_password"  # Replace with your actual password
opensearch.requestHeadersAllowlist: ["securitytenant","Authorization"]
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: ["Global", "Private"]
opensearch_security.readonly_mode.roles: ["kibana_read_only"]
server.ssl.enabled: true
server.ssl.key: "/etc/opensearch-dashboards/certs/dashboard-key.pem"
server.ssl.certificate: "/etc/opensearch-dashboards/certs/dashboard.pem"
opensearch.ssl.certificateAuthorities: ["/etc/opensearch-dashboards/certs/root-ca.pem"]
uiSettings.overrides.defaultRoute: /app/home

# Initially use basic auth to verify connection
opensearch_security.auth.type: "basic"
```

## Step 9: Copy Dashboard Certificates

Copy certificates for OpenSearch Dashboards:

```bash
# Create certificates directory
mkdir -p /etc/opensearch-dashboards/certs

# Copy certificates from Wazuh dashboard
cp /etc/wazuh-dashboard/certs/dashboard-key.pem /etc/opensearch-dashboards/certs/
cp /etc/wazuh-dashboard/certs/dashboard.pem /etc/opensearch-dashboards/certs/
cp /etc/wazuh-dashboard/certs/root-ca.pem /etc/opensearch-dashboards/certs/

# Set proper ownership and permissions
chown -R opensearch-dashboards:opensearch-dashboards /etc/opensearch-dashboards/certs
chmod 600 /etc/opensearch-dashboards/certs/dashboard-key.pem
chmod 644 /etc/opensearch-dashboards/certs/dashboard.pem
chmod 644 /etc/opensearch-dashboards/certs/root-ca.pem
```

## Step 10: Configure OpenSearch Dashboards for Port 443

To run OpenSearch Dashboards on port 443, we need to configure authbind:

```bash
# Install authbind to allow binding to port 443
apt-get update
apt-get install -y authbind

# Configure authbind for port 443
touch /etc/authbind/byport/443
chmod 500 /etc/authbind/byport/443
chown opensearch-dashboards /etc/authbind/byport/443

# Create a systemd override directory
mkdir -p /etc/systemd/system/opensearch-dashboards.service.d/

# Create the override file
cat > /etc/systemd/system/opensearch-dashboards.service.d/override.conf << EOF
[Service]
ExecStart=
ExecStart=/usr/bin/authbind --deep /usr/share/opensearch-dashboards/bin/opensearch-dashboards
EOF

# Reload systemd configuration
systemctl daemon-reload
```

## Step 11: Start OpenSearch Dashboards

```bash
# Start OpenSearch Dashboards
systemctl start opensearch-dashboards
```

## Step 12: Verify Installation

Check if everything is working correctly:

```bash
# Check OpenSearch Status
curl -k -u "admin:your_admin_password" https://localhost:9200

# Check OpenSearch Indices
curl -k -u "admin:your_admin_password" https://localhost:9200/_cat/indices?v
```

## Step 13: Configure Services to Start on Boot

Enable services to start automatically:

```bash
# Enable services to start on boot
systemctl enable opensearch
systemctl enable opensearch-dashboards
```

## Step 14: Re-enable OpenID Connect (Optional)

If you were using OpenID Connect authentication, update the OpenSearch Dashboards configuration:

```yaml
# Update /etc/opensearch-dashboards/opensearch_dashboards.yml
opensearch_security.auth.type: "openid"

# The IdP metadata endpoint
opensearch_security.openid.connect_url: "your_openid_connect_url"

# The ID of the OpenID Connect client
opensearch_security.openid.client_id: "your_client_id"

# The client secret of the OpenID Connect client
opensearch_security.openid.client_secret: "your_client_secret"

opensearch_security.openid.base_redirect_url: "your_redirect_url"
opensearch_security.openid.logout_url: "your_logout_url"
```

Then restart OpenSearch Dashboards:

```bash
systemctl restart opensearch-dashboards
```

## Troubleshooting

### Fixing Security Index Issues

If the security index is not initializing properly:

```bash
# Disable OpenSearch
systemctl stop opensearch

# Reset the cluster state
rm -rf /var/lib/opensearch/nodes/0/node.lock
rm -rf /var/lib/opensearch/nodes/0/_state

# Start OpenSearch again
systemctl start opensearch
```

### Fixing Performance Analyzer Permission Issues

If you see performance analyzer permission errors:

```bash
# Create the directory with proper permissions
mkdir -p /dev/shm/performanceanalyzer
chmod 777 /dev/shm/performanceanalyzer
```

### Fixing Connection Issues

If OpenSearch Dashboards can't connect to OpenSearch:

1. Verify OpenSearch is running: `systemctl status opensearch`
2. Check your admin password is correct in both places
3. Verify certificates are properly configured

## Advanced Configuration

### Enabling OpenID Connect with Keycloak

If you're using Keycloak for authentication, here's a sample configuration:

```yaml
# OpenSearch Dashboards configuration for Keycloak
opensearch_security.auth.type: "openid"
opensearch_security.openid.connect_url: "https://your-keycloak-server:9443/realms/your-realm/.well-known/openid-configuration"
opensearch_security.openid.client_id: "opensearch"
opensearch_security.openid.client_secret: "your-client-secret"
opensearch_security.openid.base_redirect_url: "https://your-opensearch-dashboards-url"
opensearch_security.openid.logout_url: "https://your-keycloak-server:9443/realms/your-realm/protocol/openid-connect/logout"
```

### Custom Index Patterns

To use custom index patterns (like invinsense instead of wazuh):

```yaml
# In your Wazuh configuration
alerts.sample.prefix: "invinsense-alerts-4.x-"
cron.prefix: "invinsense"
pattern: "invinsense-alerts-*"
wazuh.monitoring.pattern: "invinsense-monitoring-*"
vulnerabilities.pattern: "invinsense-states-vulnerabilities-*"
```

## Conclusion

After following these steps, you should have a working single-node OpenSearch setup migrated from your Wazuh installation. This migration preserves all your data while giving you access to OpenSearch's advanced features and flexibility.

Remember to:
- Test all functionality thoroughly before decommissioning the old Wazuh indexer
- Keep backups of your data and configurations
- Monitor logs for any issues during the first few days
- Update any external integrations to point to the new OpenSearch endpoints

For production environments, consider:
- Setting up regular snapshots for backup
- Implementing proper security policies
- Monitoring cluster health and performance
- Planning for scaling if your data grows