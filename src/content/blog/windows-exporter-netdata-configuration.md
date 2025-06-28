---
author: Anubhav Gain
pubDatetime: 2025-06-28T12:00:00+05:30
modDatetime: 2025-06-28T12:00:00+05:30
title: Windows Exporter Configuration for Netdata Monitoring
slug: windows-exporter-netdata-configuration
featured: false
draft: false
tags:
  - windows
  - monitoring
  - netdata
  - prometheus
  - observability
  - metrics
description: Complete guide to configuring Windows Exporter with custom log file monitoring and firewall exceptions for Netdata integration.
---

# Windows Exporter Configuration for Netdata Monitoring

This guide covers the installation and configuration of Windows Exporter with custom log file monitoring capabilities and firewall exception setup.

## Configuration File

Save this configuration as `config.yaml` in your Windows Exporter directory (e.g., `C:\windows_exporter\config.yaml`):

```yaml
collectors:
  enabled: cpu,memory,disk,logon,os,service,system,net,logfile

collector:
  logfile:
    files:
      - name: ArStatusUpdate
        path: 'C:\ProgramData\Infopercept\logs\ArStatusUpdate*.log'
        pattern: '(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[(?P<severity>\w+)\] (?P<message>.*)'
      - name: IvsAgent
        path: 'C:\ProgramData\Infopercept\logs\IvsAgent*.log'
        pattern: '(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[(?P<severity>\w+)\] (?P<message>.*)'
      - name: IvsSync
        path: 'C:\ProgramData\Infopercept\logs\IvsSync*.log'
        pattern: '(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[(?P<severity>\w+)\] (?P<message>.*)'
      - name: IvsTray
        path: 'C:\ProgramData\Infopercept\logs\IvsTray*.log'
        pattern: '(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[(?P<severity>\w+)\] (?P<message>.*)'
      - name: osquery-install
        path: 'C:\ProgramData\Infopercept\logs\osquery-install.log'
        pattern: '=== (?P<message>.*) (?P<timestamp>\d{2}/\d{2}/\d{4}  \d{2}:\d{2}:\d{2})  (?P<extra>.*)==='
      - name: wazuh-install
        path: 'C:\ProgramData\Infopercept\logs\wazuh-install.log'
        pattern: '=== (?P<message>.*) (?P<timestamp>\d{2}/\d{2}/\d{4}  \d{2}:\d{2}:\d{2})  (?P<extra>.*)==='

log:
  level: info
```

## Installation Steps

Let's go through the steps to install windows_exporter with this configuration and create a firewall exception:

### 1. Save the Configuration

Save the configuration above to a file named `config.yaml` in a location of your choice, for example, `C:\windows_exporter\config.yaml`.

### 2. Download Windows Exporter

Download the windows_exporter MSI installer from the [official GitHub releases page](https://github.com/prometheus-community/windows_exporter/releases).

### 3. Install with MSI Command

Open a command prompt or PowerShell with administrator privileges and execute the following command to install windows_exporter with the custom configuration and create a firewall exception:

```powershell
msiexec /i <path-to-windows-exporter.msi> EXTRA_FLAGS="--config.file=C:\windows_exporter\config.yaml" LISTEN_PORT=9182 ADDLOCAL=FirewallException
```

Replace `<path-to-windows-exporter.msi>` with the actual path to the downloaded MSI file.

This command does the following:

- Installs windows_exporter as a Windows service
- Uses the custom configuration file specified by `--config.file`
- Sets the listening port to 9182 (you can change this if needed)
- Adds a firewall exception for windows_exporter (`ADDLOCAL=FirewallException`)

### 4. Verify Installation

After installation, the windows_exporter service should start automatically, and a firewall rule should be created to allow incoming connections on the specified port.

### 5. Verify Firewall Rule

You can verify the firewall rule by opening Windows Defender Firewall with Advanced Security and checking the Inbound Rules for a rule named "windows_exporter".

### 6. Test the Exporter

To test if it's working, open a web browser and go to `http://localhost:9182/metrics`. You should see metrics being exported, including those from your custom log files.

### 7. Test Remote Access

You can also try accessing the metrics from another machine on the network to ensure the firewall exception is working correctly.

## Configuration Management

If you need to make changes to the configuration later:

1. Modify the `config.yaml` file
2. Restart the windows_exporter service:

```powershell
Restart-Service windows_exporter
```

## Log File Patterns Explained

The configuration monitors several log files with specific patterns:

### Standard Log Format

For logs like ArStatusUpdate, IvsAgent, IvsSync, and IvsTray:

- **Pattern**: `(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[(?P<severity>\w+)\] (?P<message>.*)`
- **Example**: `2024-01-15 10:30:45.123 +00:00 [INFO] Service started successfully`

### Installation Log Format

For osquery-install and wazuh-install logs:

- **Pattern**: `=== (?P<message>.*) (?P<timestamp>\d{2}/\d{2}/\d{4}  \d{2}:\d{2}:\d{2})  (?P<extra>.*) ===`
- **Example**: `=== Installation started 01/15/2024  10:30:45  Additional info ===`

## Important Notes

- The paths in the configuration file should match the actual locations of your log files
- If the log files are in different locations, update the paths accordingly
- The service runs with appropriate permissions to read the specified log files
- The firewall exception allows external access to the metrics endpoint

This setup provides comprehensive Windows monitoring with custom log file metrics that can be visualized in Netdata or any other Prometheus-compatible monitoring solution.
