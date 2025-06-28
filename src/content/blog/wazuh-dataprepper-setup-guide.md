---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:11:00Z
title: Complete Data Prepper 2.11.0 Setup Guide - Wazuh to OpenSearch
featured: false
draft: false
tags:
  - wazuh
  - opensearch
  - data-prepper
  - siem
  - security
  - migration
description: Complete setup guide for migrating from Logstash to Data Prepper 2.11.0 for Wazuh security event ingestion into OpenSearch, including configuration, troubleshooting, and production deployment.
---

## Table of contents

## Overview

Complete setup guide for migrating from Logstash to Data Prepper 2.11.0 for Wazuh security event ingestion into OpenSearch.

## Prerequisites

- OpenSearch cluster running on `https://localhost:9200`
- Wazuh manager generating alerts at `/var/ossec/logs/alerts/alerts.json`
- Root access to the system

## 1. Install Data Prepper 2.11.0

```bash
# Download and install Data Prepper 2.11.0
cd /tmp
wget https://github.com/opensearch-project/data-prepper/releases/download/2.11.0/opensearch-data-prepper-2.11.0-linux-x64.tar.gz

# Extract to /opt
sudo tar -xzf opensearch-data-prepper-2.11.0-linux-x64.tar.gz -C /opt/
sudo mv /opt/opensearch-data-prepper-2.11.0 /opt/data-prepper

# Set ownership
sudo chown -R root:root /opt/data-prepper
```

## 2. Create Data Prepper User

```bash
# Create dedicated user for Data Prepper
sudo useradd -r -s /bin/bash -d /var/lib/dataprepper -m dataprepper

# Create necessary directories
sudo mkdir -p /etc/data-prepper
sudo mkdir -p /var/log/data-prepper
sudo mkdir -p /var/lib/dataprepper

# Set ownership
sudo chown -R dataprepper:dataprepper /etc/data-prepper
sudo chown -R dataprepper:dataprepper /var/log/data-prepper
sudo chown -R dataprepper:dataprepper /var/lib/dataprepper
```

## 3. Create Data Prepper Configuration

### Main Configuration File

```bash
sudo tee /etc/data-prepper/data-prepper-config.yaml > /dev/null <<EOF
ssl: false
keyStoreFilePath: ""
keyStorePassword: ""
privateKeyPassword: ""
serverPort: 4900
metricRegistries:
  - Prometheus
metricTags:
  service: "data-prepper"
EOF
```

### Wazuh Index Template

```bash
curl -o /etc/data-prepper/wazuh.json https://packages.wazuh.com/integrations/opensearch/4.x-2.x/dashboards/wz-os-4.x-2.x-template.json
```

## 4. Create Working Pipeline Configuration

```bash
sudo tee /etc/data-prepper/pipelines-wazuh.yaml > /dev/null <<'EOF'
wazuh-alerts-pipeline:
  source:
    file:
      path: "/var/ossec/logs/alerts/alerts.json"
      # Use no codec (plain text) and parse JSON in processor
      record_type: "event"

  processor:
    # Parse each line as JSON (equivalent to Logstash codec behavior)
    - parse_json:
        source: "message"

  sink:
    - opensearch:
        hosts:
          - "https://localhost:9200"
        # Update these credentials for your environment
        username: "admin"
        password: "YOUR_OPENSEARCH_PASSWORD"
        index: "wazuh-alerts-4.x-%{yyyy.MM.dd}"
        insecure: true
        template_file: "/etc/data-prepper/wazuh.json"
        template_type: "index-template"
        bulk_size: 1000
        flush_timeout: 5000
EOF
```

## 5. Set Proper Permissions

```bash
# Set ownership of all configuration files
sudo chown -R dataprepper:dataprepper /etc/data-prepper

# Make Data Prepper executable accessible
sudo chmod +x /opt/data-prepper/bin/data-prepper

# Ensure dataprepper user can read Wazuh alerts
sudo usermod -a -G ossec dataprepper
# OR if ossec group doesn't exist:
sudo chmod 644 /var/ossec/logs/alerts/alerts.json
```

## 6. Create Systemd Service

```bash
sudo tee /etc/systemd/system/data-prepper.service > /dev/null <<EOF
[Unit]
Description=OpenSearch Data Prepper
After=network.target

[Service]
Type=simple
User=dataprepper
Group=dataprepper
ExecStart=/opt/data-prepper/bin/data-prepper /etc/data-prepper/pipelines-wazuh.yaml /etc/data-prepper/data-prepper-config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=data-prepper

# Java heap settings
Environment="JAVA_OPTS=-Xms1g -Xmx2g"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable data-prepper
```

## 7. Test Configuration

### Manual Test

```bash
# Test the configuration manually
sudo -u dataprepper bash -c '
  echo "Testing Data Prepper with Wazuh pipeline..."
  /opt/data-prepper/bin/data-prepper /etc/data-prepper/pipelines-wazuh.yaml /etc/data-prepper/data-prepper-config.yaml
'
```

### Expected Success Indicators

- No ClassCastException errors
- "Initialized OpenSearch sink" message
- "Starting file source with /var/ossec/logs/alerts/alerts.json path" message
- No authentication errors

### Verify Data Ingestion

```bash
# Check if indices are created
curl -k -u "admin:YOUR_PASSWORD" "https://localhost:9200/_cat/indices/wazuh-alerts-4.x-*?v"

# Check document count
curl -k -u "admin:YOUR_PASSWORD" "https://localhost:9200/wazuh-alerts-4.x-*/_count" | jq .

# View sample documents
curl -k -u "admin:YOUR_PASSWORD" "https://localhost:9200/wazuh-alerts-4.x-*/_search?size=1&pretty"
```

## 8. Start Data Prepper Service

```bash
# Start the service
sudo systemctl start data-prepper

# Check status
sudo systemctl status data-prepper

# View logs
sudo journalctl -u data-prepper -f
```

## 9. Production Security Hardening

### Environment Variables for Credentials

```bash
# Create environment file
sudo tee /etc/data-prepper/environment > /dev/null <<EOF
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=your_secure_password_here
EOF

sudo chown dataprepper:dataprepper /etc/data-prepper/environment
sudo chmod 600 /etc/data-prepper/environment
```

### Update Pipeline for Environment Variables

```bash
sudo tee /etc/data-prepper/pipelines-wazuh-secure.yaml > /dev/null <<'EOF'
wazuh-alerts-pipeline:
  source:
    file:
      path: "/var/ossec/logs/alerts/alerts.json"
      record_type: "event"

  processor:
    - parse_json:
        source: "message"

  sink:
    - opensearch:
        hosts:
          - "https://localhost:9200"
        username: "${OPENSEARCH_USERNAME}"
        password: "${OPENSEARCH_PASSWORD}"
        index: "wazuh-alerts-4.x-%{yyyy.MM.dd}"
        insecure: false  # Set to true only for testing
        cert: "/path/to/opensearch/certs/root-ca.pem"
        template_file: "/etc/data-prepper/wazuh.json"
        template_type: "index-template"
        bulk_size: 1000
        flush_timeout: 5000
EOF
```

### Update Systemd Service for Environment Variables

```bash
sudo systemctl edit data-prepper --full
# Add this line under [Service]:
# EnvironmentFile=/etc/data-prepper/environment
```

## 10. Monitoring and Troubleshooting

### Key Log Locations

- Data Prepper logs: `sudo journalctl -u data-prepper -f`
- Configuration directory: `/etc/data-prepper/`
- Data directory: `/var/lib/dataprepper/`

### Common Issues

- **Authentication errors**: Check OpenSearch credentials
- **File permission errors**: Ensure dataprepper user can read Wazuh logs
- **JSON parsing errors**: Verify Wazuh alert format matches expected structure
- **Memory issues**: Adjust JAVA_OPTS in systemd service

### Performance Tuning

```yaml
# In pipeline configuration, adjust:
bulk_size: 1000 # Increase for higher throughput
flush_timeout: 5000 # Decrease for lower latency
request_timeout: "30s" # Increase for large batches
```

## Equivalent Logstash vs Data Prepper

### Logstash Configuration

```ruby
input {
  file {
    codec => "json"
    path => "/var/ossec/logs/alerts/alerts.json"
    mode => "tail"
  }
}
output {
  opensearch {
    hosts => ["https://localhost:9200"]
    username => "admin"
    password => "password"
    index => "wazuh-alerts-4.x-%{+YYYY.MM.dd}"
  }
}
```

### Data Prepper Equivalent

```yaml
wazuh-alerts-pipeline:
  source:
    file:
      path: "/var/ossec/logs/alerts/alerts.json"
      record_type: "event"
  processor:
    - parse_json:
        source: "message"
  sink:
    - opensearch:
        hosts: ["https://localhost:9200"]
        username: "admin"
        password: "password"
        index: "wazuh-alerts-4.x-%{yyyy.MM.dd}"
```

## Migration Checklist

- [ ] Data Prepper installed and user created
- [ ] Configuration files created with proper permissions
- [ ] Wazuh file permissions allow dataprepper user access
- [ ] OpenSearch credentials configured
- [ ] Index template created
- [ ] Manual testing successful
- [ ] Systemd service configured and running
- [ ] Data ingestion verified in OpenSearch
- [ ] Production security hardening applied
- [ ] Monitoring and alerting configured

✅ **Migration Complete**: Your Logstash → Data Prepper migration for XDR security event ingestion is now operational!

## Import Wazuh Dashboards

Follow these steps to import the Wazuh dashboards for OpenSearch.

Run the command below to download the Wazuh dashboard file for OpenSearch:

If you are accessing the OpenSearch dashboard from a Linux or macOS system:

```bash
wget https://packages.wazuh.com/integrations/opensearch/4.x-2.x/dashboards/wz-os-4.x-2.x-dashboards.ndjson
```

If you are accessing the Opensearch dashboard from a Windows system (run the command using Powershell):

```powershell
Invoke-WebRequest -Uri "https://packages.wazuh.com/integrations/opensearch/4.x-2.x/dashboards/wz-os-4.x-2.x-dashboards.ndjson" -OutFile "allDashboards.ndjson"
```

1. In OpenSearch Dashboards, navigate to Management > Dashboards management.
2. Click on Saved Objects and click Import.
3. Click on the Import icon, browse your files, and select the dashboard file.
4. Click the Import button to start importing then click Done.
5. To find the imported dashboards, navigate to Dashboard under OpenSearch Dashboards.
