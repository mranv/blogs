---
author: Anubhav Gain
pubDatetime: 2025-01-28T16:45:00+05:30
modDatetime: 2025-01-28T16:45:00+05:30
title: Installing OpenSearch Security Analytics Dashboard Plugin
slug: opensearch-security-analytics-dashboard-installation
featured: false
draft: false
tags:
  - opensearch
  - security
  - analytics
  - dashboard
  - plugin
  - monitoring
  - siem
  - installation
description: Step-by-step guide to installing the Security Analytics Dashboard plugin in OpenSearch Dashboards, enhancing security monitoring capabilities with analytics-driven visualizations and alerts
---

# OpenSearch Security Analytics Dashboard Installation

This guide walks through the installation process for the Security Analytics Dashboard plugin in OpenSearch Dashboards. This plugin enhances OpenSearch's security monitoring capabilities with analytics-driven visualizations and alerts, making it an essential component for security operations centers (SOCs) and security analysts.

## Overview

The Security Analytics Dashboard plugin transforms OpenSearch into a powerful security information and event management (SIEM) platform. It provides:

- Pre-built security dashboards and visualizations
- Threat detection rules and correlation
- Security event analytics
- Alert management and notifications
- Compliance monitoring capabilities

## Prerequisites

Before installing the Security Analytics Dashboard plugin, ensure you have:

1. **OpenSearch cluster with Dashboards installed**
   - OpenSearch version 2.x or later
   - OpenSearch Dashboards version matching your OpenSearch version
   - Cluster properly configured and running

2. **System Requirements**
   - Root or sudo access to the server
   - Sufficient disk space (at least 1GB free)
   - Network connectivity to download plugins

3. **Security Considerations**
   - OpenSearch Security plugin configured (recommended)
   - SSL/TLS certificates configured
   - Authentication and authorization enabled

## Installation Steps

### Step 1: Access Your OpenSearch Dashboards Server

SSH into your server where OpenSearch Dashboards is installed:

```bash
ssh user@your-server-ip
```

Verify OpenSearch Dashboards is running:

```bash
sudo systemctl status opensearch-dashboards
```

### Step 2: Switch to Root User

For plugin installation, you'll need elevated privileges:

```bash
sudo su
```

Alternatively, you can prefix each command with `sudo`.

### Step 3: Navigate to OpenSearch Dashboards Directory

The default installation directory varies by installation method:

```bash
# For package installations (RPM/DEB)
cd /usr/share/opensearch-dashboards/

# For tar.gz installations
cd /opt/opensearch-dashboards/

# Verify you're in the correct directory
ls -la
# You should see directories like bin/, config/, plugins/, etc.
```

### Step 4: Install the Security Analytics Dashboard Plugin

Navigate to the bin directory:

```bash
cd bin/
```

Install the plugin using the OpenSearch Dashboards plugin installer:

```bash
./opensearch-dashboards-plugin --allow-root install securityAnalyticsDashboards
```

The system will:

- Download the plugin from the OpenSearch repository
- Verify plugin compatibility
- Extract and install plugin files
- Update plugin registry

**Expected output:**

```
Attempting to transfer from https://artifacts.opensearch.org/.../securityAnalyticsDashboards-*.zip
Transferring [====================] 100%
Transfer complete
Retrieving metadata from plugin archive
Extracting plugin archive
Extraction complete
Plugin installation complete
```

### Step 5: Verify Plugin Installation

List installed plugins to confirm successful installation:

```bash
./opensearch-dashboards-plugin list
```

You should see `securityAnalyticsDashboards` in the output.

### Step 6: Configure Plugin Settings (Optional)

If needed, configure plugin-specific settings:

```bash
# Navigate to config directory
cd ../config/

# Edit opensearch_dashboards.yml if necessary
vi opensearch_dashboards.yml
```

Add any required configuration:

```yaml
# Security Analytics Dashboard settings
securityAnalytics.enabled: true
securityAnalytics.rules.enabled: true
securityAnalytics.detectors.enabled: true
```

### Step 7: Restart OpenSearch Dashboards

After successful installation, restart the service to load the plugin:

```bash
# For systemd-based systems
sudo systemctl restart opensearch-dashboards

# Monitor the restart process
sudo journalctl -u opensearch-dashboards -f
```

Wait for the service to fully start. Look for messages like:

```
Server running at https://0.0.0.0:5601
```

### Step 8: Verify Installation in Web Interface

1. Open your browser and navigate to OpenSearch Dashboards:

   ```
   https://your-server-ip:5601
   ```

2. Log in with your credentials

3. Look for "Security Analytics" in the main navigation menu

4. Click on Security Analytics to access:
   - Overview dashboard
   - Detectors
   - Rules
   - Findings
   - Alerts

## Post-Installation Configuration

### 1. Initialize Security Analytics

Upon first access, you may need to:

```bash
# Initialize indices and mappings
curl -X POST "https://localhost:9200/_plugins/_security_analytics/indices/_initialize" \
  -H 'Content-Type: application/json' \
  -u admin:admin
```

### 2. Configure Detection Rules

Access the Rules section to:

- Import pre-built detection rules
- Create custom rules
- Configure rule actions

### 3. Set Up Detectors

Create detectors for your log sources:

- Windows Security Events
- Network Traffic Logs
- Application Logs
- Custom Log Sources

### 4. Configure Notifications

Set up alert destinations:

- Email notifications
- Slack/Teams webhooks
- Custom webhooks
- SIEM integrations

## Troubleshooting

### Permission Issues

If you encounter permission errors:

```bash
# Ensure proper ownership
chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/

# Fix plugin directory permissions
chmod -R 755 /usr/share/opensearch-dashboards/plugins/
```

### Plugin Compatibility Issues

Check version compatibility:

```bash
# Check OpenSearch Dashboards version
./bin/opensearch-dashboards --version

# Verify plugin compatibility matrix
curl -s https://opensearch.org/docs/latest/dashboards/compatibility/
```

### Installation Failures

If installation fails:

1. Check logs:

   ```bash
   tail -f /var/log/opensearch-dashboards/opensearch-dashboards.log
   ```

2. Clear plugin cache:

   ```bash
   rm -rf /usr/share/opensearch-dashboards/optimize/bundles/
   ```

3. Try manual installation:

   ```bash
   # Download plugin ZIP manually
   wget https://artifacts.opensearch.org/.../securityAnalyticsDashboards-VERSION.zip

   # Install from local file
   ./opensearch-dashboards-plugin install file:///path/to/securityAnalyticsDashboards-VERSION.zip
   ```

### Browser Cache Issues

If the plugin doesn't appear after installation:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private browsing mode
3. Use a different browser
4. Check browser console for JavaScript errors (F12)

## Security Considerations

### 1. Network Security

Ensure proper network controls:

```bash
# Restrict access to OpenSearch Dashboards port
sudo firewall-cmd --permanent --add-rich-rule='
  rule family="ipv4"
  source address="10.0.0.0/8"
  port protocol="tcp" port="5601" accept'

sudo firewall-cmd --reload
```

### 2. Authentication and Authorization

Configure role-based access:

```json
{
  "security_analytics_read": {
    "cluster_permissions": [
      "cluster:admin/opensearch/securityanalytics/detector/search",
      "cluster:admin/opensearch/securityanalytics/rule/search"
    ],
    "index_permissions": [
      {
        "index_patterns": ["security-analytics-*"],
        "allowed_actions": ["read"]
      }
    ]
  }
}
```

### 3. Audit Logging

Enable audit logging for security analytics activities:

```yaml
# In opensearch.yml
plugins.security.audit.type: internal_opensearch
plugins.security.audit.config.log_request_body: true
plugins.security.audit.config.disabled_rest_categories: []
plugins.security.audit.config.disabled_transport_categories: []
```

### 4. Resource Limits

Configure appropriate resource limits:

```yaml
# In jvm.options
-Xms2g
-Xmx2g

# In opensearch_dashboards.yml
opensearch.requestTimeout: 60000
opensearch.shardTimeout: 60000
```

## Performance Optimization

### 1. Index Management

Configure index lifecycle policies:

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50GB"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 2. Query Optimization

Optimize detector queries:

```json
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        {
          "range": {
            "@timestamp": {
              "gte": "now-15m"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "security_events": {
      "terms": {
        "field": "event.category",
        "size": 10
      }
    }
  }
}
```

## Integration with Other Tools

### 1. Logstash Integration

Configure Logstash to send security events:

```ruby
output {
  opensearch {
    hosts => ["https://localhost:9200"]
    index => "security-analytics-events-%{+YYYY.MM.dd}"
    user => "logstash_user"
    password => "${LOGSTASH_PASSWORD}"
    ssl => true
    ssl_certificate_verification => true
  }
}
```

### 2. Beats Integration

Configure Filebeat for log shipping:

```yaml
output.opensearch:
  hosts: ["https://localhost:9200"]
  protocol: "https"
  username: "beats_user"
  password: "${BEATS_PASSWORD}"
  index: "security-analytics-beats-%{[agent.version]}-%{+yyyy.MM.dd}"

processors:
  - add_tags:
      tags: [security-analytics]
      target: "event.tags"
```

### 3. SIEM Integration

Export findings to external SIEM:

```bash
# Export findings via API
curl -X GET "https://localhost:9200/_plugins/_security_analytics/findings/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "range": {
        "timestamp": {
          "gte": "now-1h"
        }
      }
    }
  }'
```

## Best Practices

### 1. Regular Updates

Keep the plugin updated:

```bash
# Check for updates
./opensearch-dashboards-plugin list --updates

# Update plugin
./opensearch-dashboards-plugin remove securityAnalyticsDashboards
./opensearch-dashboards-plugin install securityAnalyticsDashboards
```

### 2. Backup Configuration

Regularly backup your configurations:

```bash
# Backup rules and detectors
curl -X GET "https://localhost:9200/_plugins/_security_analytics/rules/_export" \
  -o security-rules-backup.json

curl -X GET "https://localhost:9200/_plugins/_security_analytics/detectors/_export" \
  -o security-detectors-backup.json
```

### 3. Monitor Performance

Track plugin performance:

```bash
# Monitor resource usage
curl -X GET "https://localhost:9200/_nodes/stats/breaker?pretty"

# Check detector performance
curl -X GET "https://localhost:9200/_plugins/_security_analytics/stats"
```

## Conclusion

The Security Analytics Dashboard plugin significantly enhances OpenSearch's capabilities as a security monitoring platform. With proper installation and configuration, it provides powerful tools for:

- Real-time threat detection
- Security event correlation
- Compliance monitoring
- Incident investigation

Regular maintenance, updates, and monitoring ensure optimal performance and security of your installation.

## Additional Resources

- [OpenSearch Security Analytics Documentation](https://opensearch.org/docs/latest/security-analytics/index/)
- [OpenSearch Dashboards Plugin Management](https://opensearch.org/docs/latest/dashboards/install/plugins/)
- [Security Best Practices for OpenSearch](https://opensearch.org/docs/latest/security/index/)
- [OpenSearch Community Forums](https://forum.opensearch.org/)
- [GitHub - OpenSearch Security Analytics](https://github.com/opensearch-project/security-analytics)
