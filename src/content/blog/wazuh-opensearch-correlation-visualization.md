---
author: Anubhav Gain
pubDatetime: 2025-01-28T12:59:00Z
title: Integrating Wazuh Alerts Correlation and Graphs with OpenSearch Dashboards
featured: false
draft: false
tags:
  - wazuh
  - opensearch
  - siem
  - security
  - correlation
  - visualization
description: A comprehensive guide for integrating Wazuh Manager 4.12.0 with OpenSearch 2.19.2 and OpenSearch Dashboards for advanced alert correlation and visualization capabilities.
---

## Table of contents

## Overview

Integrating Wazuh-Manager 4.12.0 with OpenSearch 2.19.2 and OpenSearch Dashboards 2.19.2 for alert correlation and visualization involves several key components working together. This comprehensive guide provides the complete solution for setting up this integration with proper correlation capabilities and graphical representations.

## Architecture Components

The complete setup consists of:

- **Wazuh Manager 4.12.0**: Collects and analyzes security events
- **Filebeat**: Ships data from Wazuh to OpenSearch
- **OpenSearch 2.19.2**: Stores and indexes security data
- **OpenSearch Dashboards 2.19.2**: Provides visualization and correlation analysis

## Step 1: Setting Up the Core Infrastructure

### Installing and Configuring Wazuh Manager 4.12.0

First, install Wazuh Manager on your designated server:

```bash
# Add Wazuh repository
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
apt-get update

# Install Wazuh Manager
apt-get install wazuh-manager
systemctl daemon-reload
systemctl enable wazuh-manager
systemctl start wazuh-manager
```

### Configuring OpenSearch 2.19.2

Install and configure OpenSearch to work with Wazuh:

```bash
# Download and install OpenSearch
wget https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.2/opensearch-2.19.2-linux-x64.tar.gz
tar -xzf opensearch-2.19.2-linux-x64.tar.gz
cd opensearch-2.19.2

# Configure opensearch.yml
echo "cluster.name: wazuh-cluster
node.name: wazuh-node-1
path.data: /var/lib/opensearch
path.logs: /var/log/opensearch
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
compatibility.override_main_response_version: true
plugins.security.ssl.http.enabled: true
plugins.security.ssl.transport.enabled: true" > config/opensearch.yml
```

## Step 2: Configuring Filebeat Integration

### Installing Filebeat

```bash
# Install Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.10.0-linux-x86_64.tar.gz
tar xzvf filebeat-8.10.0-linux-x86_64.tar.gz
cd filebeat-8.10.0-linux-x86_64
```

### Filebeat Configuration for Wazuh-OpenSearch Integration

Create the Filebeat configuration file (`/etc/filebeat/filebeat.yml`):

```yaml
# Wazuh - Filebeat configuration file
filebeat.inputs:
  - type: filestream
    id: wazuh-alerts
    paths:
      - /var/ossec/logs/alerts/alerts.json
    parser:
      format: json

  - type: filestream
    id: wazuh-archives
    paths:
      - /var/ossec/logs/archives/archives.json
    parser:
      format: json

output.elasticsearch:
  hosts: ["localhost:9200"]
  protocol: https
  username: ${username}
  password: ${password}
  ssl.certificate_authorities:
    - /etc/filebeat/certs/root-ca.pem
  ssl.certificate: "/etc/filebeat/certs/wazuh-server.pem"
  ssl.key: "/etc/filebeat/certs/wazuh-server-key.pem"

setup.template.json.enabled: true
setup.template.json.path: "/etc/filebeat/wazuh-template.json"
setup.template.json.name: "wazuh"
setup.ilm.enabled: false

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~
```

### Creating Wazuh Index Template

Download and configure the Wazuh template for OpenSearch:

```bash
curl -so /etc/filebeat/wazuh-template.json https://raw.githubusercontent.com/wazuh/wazuh/v4.12.0/extensions/elasticsearch/7.x/wazuh-template.json

# Modify index patterns in template
sed -i 's/"wazuh-alerts-4.x-\*"/"wazuh-alerts-4.x-*", "wazuh-archives-4.x-*"/g' /etc/filebeat/wazuh-template.json
```

## Step 3: Setting Up OpenSearch Dashboards 2.19.2

### Installation and Configuration

```bash
# Download OpenSearch Dashboards
wget https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/2.19.2/opensearch-dashboards-2.19.2-linux-x64.tar.gz
tar -xzf opensearch-dashboards-2.19.2-linux-x64.tar.gz
cd opensearch-dashboards-2.19.2

# Configure opensearch_dashboards.yml
echo "server.host: 0.0.0.0
server.port: 5601
opensearch.hosts: ['https://localhost:9200']
opensearch.ssl.verificationMode: certificate
opensearch.username: admin
opensearch.password: admin
opensearch.requestHeadersWhitelist: ['securitytenant','Authorization']
opensearch_security.multitenancy.enabled: false
opensearch_security.readonly_mode.roles: ['kibana_read_only']
server.ssl.enabled: true
server.ssl.key: /path/to/server-key.pem
server.ssl.certificate: /path/to/server.pem" > config/opensearch_dashboards.yml
```

## Step 4: Implementing Alert Correlation

### Creating Correlation Rules in Wazuh

Wazuh supports several correlation mechanisms. Here's an example of creating a correlation rule for detecting brute force attacks followed by successful logins:

```xml
<!-- Custom correlation rules in /var/ossec/etc/rules/local_rules.xml -->
<group name="correlation,attack,">

  <!-- Rule for multiple failed logins -->
  <rule id="100001" level="7" frequency="5" timeframe="300">
    <if_matched_sid>5710</if_matched_sid>
    <same_source_ip />
    <description>Multiple SSH authentication failures from same source IP</description>
    <group>authentication_failures,pci_dss_10.2.4,pci_dss_10.2.5,</group>
  </rule>

  <!-- Rule for successful login after failures -->
  <rule id="100002" level="12">
    <if_matched_sid>5715</if_matched_sid>
    <same_source_ip />
    <if_matched_sid>100001</if_matched_sid>
    <description>Successful SSH login after multiple failures - Possible brute force attack</description>
    <group>correlation,attack,pci_dss_10.2.4,</group>
  </rule>

</group>
```

### Advanced Correlation Example

For more complex scenarios involving multiple systems:

```xml
<group name="correlation,lateral_movement,">

  <!-- Detect suspicious network activity -->
  <rule id="100010" level="8" frequency="3" timeframe="600">
    <if_matched_group>network</if_matched_group>
    <field name="action">connection_established</field>
    <same_source_ip />
    <description>Multiple network connections from same source</description>
  </rule>

  <!-- Correlate with privilege escalation -->
  <rule id="100011" level="15">
    <if_matched_sid>100010</if_matched_sid>
    <if_matched_group>privilege_escalation</if_matched_group>
    <same_source_ip />
    <description>Privilege escalation after suspicious network activity - Possible lateral movement</description>
    <group>correlation,lateral_movement,attack,</group>
  </rule>

</group>
```

## Step 5: Creating Correlation Visualizations in OpenSearch Dashboards

### Setting Up Index Patterns

1. Access OpenSearch Dashboards at `https://your-server:5601`
2. Navigate to Management → Index Patterns
3. Create index patterns:
   - `wazuh-alerts-*` for alerts
   - `wazuh-archives-*` for archived events

### Building Correlation Dashboards

Create visualizations for correlation analysis:

#### 1. Alert Correlation Timeline

```json
{
  "version": "2.19.2",
  "visualization": {
    "title": "Alert Correlation Timeline",
    "type": "line",
    "params": {
      "grid": { "categoryLines": false, "style": { "color": "#eee" } },
      "categoryAxes": [
        {
          "id": "CategoryAxis-1",
          "type": "category",
          "position": "bottom",
          "show": true,
          "style": {},
          "scale": { "type": "linear" },
          "labels": { "show": true, "truncate": 100 },
          "title": {}
        }
      ],
      "valueAxes": [
        {
          "id": "ValueAxis-1",
          "name": "LeftAxis-1",
          "type": "value",
          "position": "left",
          "show": true,
          "style": {},
          "scale": { "type": "linear", "mode": "normal" },
          "labels": {
            "show": true,
            "rotate": 0,
            "filter": false,
            "truncate": 100
          },
          "title": { "text": "Alert Count" }
        }
      ],
      "seriesParams": [
        {
          "show": true,
          "type": "line",
          "mode": "normal",
          "data": { "label": "Alert Count", "id": "1" },
          "valueAxis": "ValueAxis-1",
          "drawLinesBetweenPoints": true,
          "showCircles": true
        }
      ]
    },
    "aggs": [
      {
        "id": "1",
        "enabled": true,
        "type": "count",
        "schema": "metric",
        "params": {}
      },
      {
        "id": "2",
        "enabled": true,
        "type": "date_histogram",
        "schema": "segment",
        "params": {
          "field": "@timestamp",
          "interval": "auto",
          "customInterval": "2h",
          "min_doc_count": 1,
          "extended_bounds": {}
        }
      }
    ]
  }
}
```

#### 2. Correlation Graph Visualization

OpenSearch Dashboards 2.19.2 includes built-in correlation graph capabilities:

1. Navigate to Security Analytics → Correlations
2. Create correlation rules that define relationships between different log types
3. Use the correlation graph to visualize relationships between findings

#### Example Correlation Rule Configuration

```json
{
  "name": "Brute Force to Success Correlation",
  "queries": [
    {
      "index": "wazuh-alerts-*",
      "query": {
        "bool": {
          "must": [
            { "match": { "rule.groups": "authentication_failed" } },
            { "range": { "@timestamp": { "gte": "now-1h" } } }
          ]
        }
      }
    },
    {
      "index": "wazuh-alerts-*",
      "query": {
        "bool": {
          "must": [
            { "match": { "rule.groups": "authentication_success" } },
            { "range": { "@timestamp": { "gte": "now-1h" } } }
          ]
        }
      }
    }
  ],
  "time_window": "10m"
}
```

## Step 6: Advanced Correlation Features

### Using OpenSearch Alerting for Correlation

Set up OpenSearch alerting to trigger on correlation patterns:

```json
{
  "name": "Correlation Alert Monitor",
  "type": "monitor",
  "monitor_type": "query_level_monitor",
  "enabled": true,
  "schedule": {
    "period": {
      "interval": 5,
      "unit": "MINUTES"
    }
  },
  "inputs": [
    {
      "search": {
        "indices": ["wazuh-alerts-*"],
        "query": {
          "bool": {
            "must": [
              { "match": { "rule.groups": "correlation" } },
              { "range": { "@timestamp": { "gte": "now-10m" } } }
            ]
          }
        }
      }
    }
  ],
  "triggers": [
    {
      "name": "High Priority Correlation",
      "severity": "1",
      "condition": {
        "script": {
          "source": "ctx.results[0].hits.total.value > 0"
        }
      },
      "actions": [
        {
          "name": "Send Email Alert",
          "destination_id": "email-destination-id",
          "message_template": {
            "source": "Alert: Correlation detected - {{ctx.results.0.hits.hits.0._source.rule.description}}"
          }
        }
      ]
    }
  ]
}
```

### Custom Correlation Dashboards

Create comprehensive dashboards combining multiple correlation views:

```yaml
# Dashboard Configuration
dashboard:
  title: "Security Alert Correlation Analysis"
  panels:
    - title: "Alert Volume by Source IP"
      type: "data_table"
      query: "rule.groups:correlation AND agent.ip:*"

    - title: "Correlation Timeline"
      type: "line_chart"
      timeframe: "24h"

    - title: "Geographic Distribution"
      type: "map"
      field: "geoip.location"

    - title: "Top Correlation Rules"
      type: "pie_chart"
      field: "rule.id"
```

## Step 7: Performance Optimization and Troubleshooting

### Index Lifecycle Management

Configure ILM policies for optimal performance:

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "10gb",
            "max_age": "1d"
          }
        }
      },
      "warm": {
        "min_age": "2d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "cold": {
        "min_age": "7d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "delete": {
        "min_age": "30d"
      }
    }
  }
}
```

### Common Issues and Solutions

1. **Connection Issues**: Ensure proper SSL certificates and network connectivity
2. **Index Pattern Problems**: Verify index patterns match your data structure
3. **Performance Issues**: Implement proper sharding and replica strategies

## Code Examples and Implementation

### Python Script for Custom Correlation

```python
#!/usr/bin/env python3
import json
import requests
from datetime import datetime, timedelta

class WazuhCorrelationEngine:
    def __init__(self, opensearch_host, username, password):
        self.opensearch_host = opensearch_host
        self.auth = (username, password)

    def search_alerts(self, query, time_range="1h"):
        """Search for alerts in OpenSearch"""
        endpoint = f"{self.opensearch_host}/wazuh-alerts-*/_search"

        search_body = {
            "query": {
                "bool": {
                    "must": query,
                    "filter": {
                        "range": {
                            "@timestamp": {
                                "gte": f"now-{time_range}"
                            }
                        }
                    }
                }
            },
            "size": 100,
            "sort": [{"@timestamp": {"order": "desc"}}]
        }

        response = requests.post(endpoint,
                               json=search_body,
                               auth=self.auth,
                               verify=False)
        return response.json()

    def correlate_events(self, rule_config):
        """Correlate events based on rule configuration"""
        correlations = []

        for rule in rule_config:
            # Search for first event type
            primary_events = self.search_alerts(rule['primary_query'])

            for event in primary_events['hits']['hits']:
                source_ip = event['_source'].get('data', {}).get('srcip')
                if source_ip:
                    # Search for correlated events from same IP
                    correlated_query = rule['secondary_query']
                    correlated_query.append({"term": {"data.srcip": source_ip}})

                    secondary_events = self.search_alerts(correlated_query, "30m")

                    if secondary_events['hits']['total']['value'] > 0:
                        correlations.append({
                            'primary_event': event,
                            'correlated_events': secondary_events['hits']['hits'],
                            'correlation_rule': rule['name'],
                            'severity': rule['severity']
                        })

        return correlations

# Usage example
correlation_rules = [
    {
        'name': 'Brute Force to Success',
        'primary_query': [{"match": {"rule.groups": "authentication_failed"}}],
        'secondary_query': [{"match": {"rule.groups": "authentication_success"}}],
        'severity': 'high'
    }
]

engine = WazuhCorrelationEngine('https://localhost:9200', 'admin', 'admin')
correlations = engine.correlate_events(correlation_rules)
print(json.dumps(correlations, indent=2))
```

### Bash Script for Automated Setup

```bash
#!/bin/bash

# Automated Wazuh-OpenSearch Integration Setup
set -e

OPENSEARCH_VERSION="2.19.2"
WAZUH_VERSION="4.12.0"
OPENSEARCH_HOST="localhost"
OPENSEARCH_PORT="9200"

echo "Setting up Wazuh-OpenSearch Integration..."

# Function to check service status
check_service() {
    if systemctl is-active --quiet $1; then
        echo "✓ $1 is running"
    else
        echo "✗ $1 is not running"
        return 1
    fi
}

# Setup index templates
setup_index_templates() {
    echo "Setting up index templates..."

    curl -X PUT "${OPENSEARCH_HOST}:${OPENSEARCH_PORT}/_template/wazuh" \
        -H 'Content-Type: application/json' \
        -d @/etc/filebeat/wazuh-template.json \
        --user admin:admin -k

    echo "Index templates configured successfully"
}

# Create correlation dashboards
setup_dashboards() {
    echo "Setting up correlation dashboards..."

    # Download Wazuh dashboards for OpenSearch
    wget -O /tmp/wazuh-dashboards.ndjson \
        "https://packages.wazuh.com/integrations/opensearch/4.x-2.x/dashboards/wz-os-4.x-2.x-dashboards.ndjson"

    # Import dashboards
    curl -X POST "${OPENSEARCH_HOST}:5601/api/saved_objects/_import" \
        -H "osd-xsrf: true" \
        -H "Content-Type: application/json" \
        --form file=@/tmp/wazuh-dashboards.ndjson \
        --user admin:admin -k

    echo "Dashboards imported successfully"
}

# Main execution
main() {
    echo "Starting Wazuh-OpenSearch integration setup..."

    # Check prerequisites
    check_service wazuh-manager
    check_service opensearch
    check_service opensearch-dashboards
    check_service filebeat

    # Setup components
    setup_index_templates
    setup_dashboards

    echo "Integration setup completed successfully!"
    echo "Access OpenSearch Dashboards at: https://${OPENSEARCH_HOST}:5601"
}

main "$@"
```

## Conclusion

This comprehensive integration enables powerful security event correlation and visualization capabilities by combining Wazuh's threat detection with OpenSearch's analytical power and visualization features. The solution provides:

- Real-time alert correlation across multiple data sources
- Interactive dashboards for security analysis
- Custom correlation rules for specific threat scenarios
- Graph-based visualization of security events and their relationships
- Automated alerting on correlation patterns

The integration leverages Wazuh's built-in correlation engine while extending capabilities through OpenSearch's advanced search and aggregation features. This creates a robust security monitoring platform capable of detecting complex, multi-stage attacks through event correlation and providing intuitive visual representations of security threats.

By following this guide, security teams can implement a comprehensive SIEM solution that not only detects individual security events but also identifies patterns and relationships between events, significantly enhancing threat detection capabilities and reducing false positives through intelligent correlation analysis.
