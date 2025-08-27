---
author: Anubhav Gain
pubDatetime: 2025-01-28T13:00:00+05:30
modDatetime: 2025-06-28T13:00:00+05:30
title: Visualizing Log Files with Netdata and Fluent Bit
slug: netdata-fluentbit-log-visualization
featured: false
draft: false
tags:
  - netdata
  - fluentbit
  - logging
  - monitoring
  - observability
  - visualization
category: Monitoring
description: Guide to set up a data pipeline for visualizing log files on multiple machines using Netdata and Fluent Bit.
---

# Visualizing Log Files with Netdata and Fluent Bit

To visualize log files on multiple machines using Netdata and Fluent Bit, you'll need to set up a data pipeline. Here's a high-level overview of how you can achieve this:

1. Install Fluent Bit on each machine with log files
2. Configure Fluent Bit to collect and parse your log files
3. Set up Netdata on a central server or each machine
4. Configure Fluent Bit to send data to Netdata
5. Configure Netdata to receive and visualize the data from Fluent Bit

Let's break this down into more detailed steps:

## 1. Install Fluent Bit

Follow the official installation guide for your operating system: [Fluent Bit Installation Guide](https://docs.fluentbit.io/manual/installation/getting-started-with-fluent-bit)

## 2. Configure Fluent Bit

Create a configuration file (usually `/etc/fluent-bit/fluent-bit.conf`) to collect and parse your log files. Here's a basic example:

```ini
[INPUT]
    Name tail
    Path /path/to/your/logfile.log
    Parser your_log_parser

[PARSER]
    Name your_log_parser
    Format regex
    Regex ^(?<time>[^ ]*) (?<message>.*)$
    Time_Key time
    Time_Format %Y-%m-%d %H:%M:%S

[OUTPUT]
    Name http
    Match *
    Host your_netdata_host
    Port 19999
    URI /api/v1/collector/charts
    Format json_stream
```

Adjust the `Path`, `Parser`, and `Regex` fields according to your log format.

## 3. Install Netdata

Follow the official installation guide: [Netdata Installation](https://learn.netdata.cloud/docs/agent/packaging/installer)

## 4. Configure Netdata

Enable the web_log plugin in Netdata by editing `/etc/netdata/netdata.conf`:

```ini
[web_log]
    enabled = yes
```

## 5. Start Both Services

```bash
sudo systemctl start fluent-bit
sudo systemctl start netdata
```

Now, Fluent Bit should be collecting your log data and sending it to Netdata, which will visualize it in real-time.

## Advanced Configuration

This is a basic setup. Depending on your specific needs, you might want to add more advanced configurations, such as:

### Filtering and Transforming Log Data

Add filters to process your logs before sending them:

```ini
[FILTER]
    Name grep
    Match *
    Regex message error|warning|critical

[FILTER]
    Name record_modifier
    Match *
    Record hostname ${HOSTNAME}
    Record service_name my_application
```

### Multiple Log Sources

Monitor multiple log files by adding more INPUT sections:

```ini
[INPUT]
    Name tail
    Path /var/log/app1/*.log
    Tag app1
    Parser app1_parser

[INPUT]
    Name tail
    Path /var/log/app2/*.log
    Tag app2
    Parser app2_parser
```

### Aggregation for Multiple Machines

If you have multiple machines, you can set up a central Fluent Bit aggregator:

```ini
# On each machine
[OUTPUT]
    Name forward
    Match *
    Host central_fluent_bit_host
    Port 24224

# On central aggregator
[INPUT]
    Name forward
    Port 24224

[OUTPUT]
    Name http
    Match *
    Host netdata_host
    Port 19999
    URI /api/v1/collector/charts
    Format json_stream
```

### Custom Parsers

Create custom parsers for your specific log formats:

```ini
[PARSER]
    Name apache_access
    Format regex
    Regex ^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^\"]*?)(?: +\S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)")?$
    Time_Key time
    Time_Format %d/%b/%Y:%H:%M:%S %z

[PARSER]
    Name json_parser
    Format json
    Time_Key timestamp
    Time_Format %Y-%m-%dT%H:%M:%S.%L
```

### Security Considerations

When setting up this pipeline, consider:

1. **TLS/SSL Encryption**: Use HTTPS for the HTTP output
2. **Authentication**: Add authentication headers if required
3. **Network Security**: Ensure proper firewall rules between machines
4. **Log Rotation**: Configure log rotation to prevent disk space issues

### Netdata Configuration for Better Visualization

Configure Netdata to better visualize your log data:

```yaml
# In /etc/netdata/go.d/web_log.conf
jobs:
  - name: custom_app_logs
    path: /var/log/custom_app/*.log
    custom_log_format:
      pattern: '(?P<address>[\da-f.:]+) - (?P<user>.*) \[(?P<time>.*)\] "(?P<method>[A-Z]+) (?P<url>.*) HTTP/[0-9.]+" (?P<code>[0-9]+) (?P<bytes_sent>[0-9]+) "(?P<referer>.*)" "(?P<user_agent>.*)"'
      time_format: "%d/%b/%Y:%H:%M:%S %z"
```

### Alerting Configuration

Set up alerts in Netdata based on log patterns:

```yaml
# In /etc/netdata/health.d/logs.conf
alarm: high_error_rate
on: web_log.custom_app_logs
lookup: sum -5m unaligned of errors
units: errors
every: 1m
warn: $this > 100
crit: $this > 500
info: High error rate detected in application logs
```

## Troubleshooting

Common issues and solutions:

1. **Fluent Bit not sending data**: Check connectivity and firewall rules
2. **Parser not matching**: Test your regex patterns with sample log lines
3. **High memory usage**: Adjust buffer sizes and flush intervals
4. **Missing data in Netdata**: Verify the API endpoint and data format

This setup provides a robust solution for centralizing and visualizing logs from multiple machines using Netdata and Fluent Bit.
