---
author: Anubhav Gain
pubDatetime: 2024-04-24T18:30:00Z
modDatetime: 2025-01-05T10:00:00Z
title: OpenSearch/Wazuh Indexer Setup and Management Guide - 2025 Edition
slug: opensearch-wazuh-indexer-management-guide
featured: true
draft: false
tags:
  - security
  - wazuh
  - opensearch
  - indexer
  - monitoring
  - devops
  - SIEM
  - elastic-alternative
  - enterprise-security
category: SIEM
description: A comprehensive guide for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer, including installation, backup procedures, performance tuning, and enterprise health monitoring.
---

# OpenSearch/Wazuh Indexer Setup and Management Guide

This document provides instructions for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer. It covers installation, backup procedures, configuration paths, and basic health checks.

## System Overview

The setup consists of:

- OpenSearch 2.11.1+ (latest stable) serving as a Wazuh indexer
- Compatible with Wazuh 4.7.x and 4.8.x
- Single-node cluster configuration
- Security plugin enabled with admin authentication

## Updated Installation Process (2025)

### Prerequisites

- **Hardware Requirements**:
  - Minimum: 8GB RAM, 4 CPU cores, 100GB SSD
  - Recommended: 16GB RAM, 8 CPU cores, 500GB NVMe SSD
  - Enterprise: 32GB+ RAM, 16+ CPU cores, 1TB+ NVMe SSD in RAID configuration

- **Software Requirements**:
  - Ubuntu 22.04 LTS or RHEL 8.x/9.x
  - Java 11 or 17 (OpenJDK recommended)
  - Python 3.8+ for management scripts

### Quick Installation Script

```bash
#!/bin/bash
# OpenSearch/Wazuh Indexer Quick Setup Script - 2025

# Set version variables
OPENSEARCH_VERSION="2.11.1"
WAZUH_VERSION="4.8.0"

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Java
sudo apt-get install -y openjdk-11-jdk

# Download and install OpenSearch
wget https://artifacts.opensearch.org/releases/bundle/opensearch/${OPENSEARCH_VERSION}/opensearch-${OPENSEARCH_VERSION}-linux-x64.tar.gz
tar -xzf opensearch-${OPENSEARCH_VERSION}-linux-x64.tar.gz
sudo mv opensearch-${OPENSEARCH_VERSION} /opt/opensearch

# Configure system limits
echo "opensearch soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "opensearch hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Create opensearch user
sudo useradd -m -s /bin/bash opensearch
sudo chown -R opensearch:opensearch /opt/opensearch
```

## Directory Structure

The key directories and configuration files are:
