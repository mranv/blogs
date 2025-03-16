---
author: Anubhav Gain
pubDatetime: 2024-05-01T14:00:00Z
modDatetime: 2024-05-01T14:00:00Z
title: Creating Custom Debian Packages for OpenSearch Dashboards
slug: packaging-custom-opensearch-dashboards
featured: false
draft: false
tags:
  - opensearch
  - packaging
  - debian
  - infrastructure
  - deployment
  - devops
  - customization
description: A step-by-step guide to creating custom Debian packages for OpenSearch Dashboards with your own plugins and configurations, allowing for standardized deployments and easier maintenance.
---

# Creating Custom Debian Packages for OpenSearch Dashboards

When deploying OpenSearch Dashboards in enterprise environments, you often need customizations like specific plugins, custom themes, or specialized configurations. Creating a custom Debian package lets you standardize these modifications across your infrastructure while maintaining the benefits of package management.

This guide walks you through building a custom Debian package for OpenSearch Dashboards 2.18.0 with your own plugins and configurations.

## Why Package Custom OpenSearch Dashboards?

Before diving into the technical steps, let's consider why packaging is better than manual installation:

1. **Standardized deployments** across multiple environments
2. **Simplified upgrades** through package management
3. **Dependency management** handled by the package manager
4. **Configuration consistency** across your infrastructure
5. **Easier integration** with CI/CD pipelines and configuration management tools

## Prerequisites

Before starting, ensure your build system has:

- A Debian-based Linux distribution (Ubuntu 20.04+ recommended)
- Sufficient RAM (at least 8GB) and disk space (20GB free)
- Internet connection to download dependencies
- Root or sudo access

## Step 1: Setting Up the Build Environment

First, install the necessary dependencies for building OpenSearch Dashboards:

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm ruby ruby-dev build-essential rpm git curl

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Yarn
npm install -g yarn
```

## Step 2: Clone and Prepare the Source Code

Clone the OpenSearch Dashboards repository and check out the specific version you want to package:

```bash
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards
git checkout 2.18.0

# Set up the correct Node.js version
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
```

## Step 3: Add Custom Plugins

Now add your custom plugins to the build:

```bash
# Create plugins directory if it doesn't exist
mkdir -p plugins

# Copy your custom plugins
cp -r /path/to/your/custom/plugins/* plugins/

# Alternatively, you can clone plugin repositories directly
# git clone https://github.com/example/your-plugin.git plugins/your-plugin
```

## Step 4: Build OpenSearch Dashboards

Build the package with your custom plugins included:

```bash
# Bootstrap the project
yarn osd bootstrap

# Build OpenSearch Dashboards
yarn build --skip-os-packages
```

This process might take some time depending on your system resources.

## Step 5: Create the Debian Package Structure

Create the directory structure for your Debian package:

```bash
# Create base package directory
mkdir -p opensearch-dashboards-2.18.0/DEBIAN

# Create installation directories
mkdir -p opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/etc/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/var/log/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/var/lib/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/lib/systemd/system
```

## Step 6: Copy Build Artifacts

Copy the built files to the appropriate locations in the package structure:

```bash
# Copy built OpenSearch Dashboards files
cp -r build/opensearch-dashboards/* opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/
```

## Step 7: Create Debian Control Files

### Control File

Create the main package control file:

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/control << EOL
Package: opensearch-dashboards
Version: 2.18.0
Section: web
Priority: optional
Architecture: amd64
Depends: libnss3
Maintainer: Your Name <your.email@domain.com>
Description: OpenSearch Dashboards with custom plugins
 Custom build of OpenSearch Dashboards including specific plugins
EOL
```

### Pre-installation Script

Create the pre-installation script to set up the user and group:

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/preinst << EOL
#!/bin/bash
if ! getent group opensearch-dashboards >/dev/null; then
    groupadd -r opensearch-dashboards
fi
if ! getent passwd opensearch-dashboards >/dev/null; then
    useradd -r -g opensearch-dashboards -d /usr/share/opensearch-dashboards -s /sbin/nologin opensearch-dashboards
fi
EOL

chmod 755 opensearch-dashboards-2.18.0/DEBIAN/preinst
```

### Post-installation Script

Create the post-installation script to set permissions:

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/postinst << EOL
#!/bin/bash
chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards
chown -R opensearch-dashboards:opensearch-dashboards /var/log/opensearch-dashboards
chown -R opensearch-dashboards:opensearch-dashboards /var/lib/opensearch-dashboards
chmod 750 /usr/share/opensearch-dashboards
chmod 750 /var/log/opensearch-dashboards
chmod 750 /var/lib/opensearch-dashboards

# Enable and start the service
systemctl daemon-reload
systemctl enable opensearch-dashboards.service
EOL

chmod 755 opensearch-dashboards-2.18.0/DEBIAN/postinst
```

## Step 8: Create Configuration Files

### Configuration File

Copy and modify the default configuration file:

```bash
cp config/opensearch_dashboards.yml opensearch-dashboards-2.18.0/etc/opensearch-dashboards/

# Add custom paths
cat >> opensearch-dashboards-2.18.0/etc/opensearch-dashboards/opensearch_dashboards.yml << EOL

# Custom paths
path.data: /var/lib/opensearch-dashboards
path.logs: /var/log/opensearch-dashboards

# Custom settings
server.host: "0.0.0.0"
server.port: 5601
opensearch.hosts: ["https://localhost:9200"]
opensearch.ssl.verificationMode: none
EOL
```

### Systemd Service File

Create a systemd service file for automatic startup:

```bash
cat > opensearch-dashboards-2.18.0/lib/systemd/system/opensearch-dashboards.service << EOL
[Unit]
Description=OpenSearch Dashboards
Documentation=https://opensearch.org/docs/dashboards
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=opensearch-dashboards
Group=opensearch-dashboards
Environment=NODE_ENV=production
Environment=CONFIG_PATH=/etc/opensearch-dashboards/opensearch_dashboards.yml
ExecStart=/usr/share/opensearch-dashboards/bin/opensearch-dashboards
Restart=always
WorkingDirectory=/usr/share/opensearch-dashboards

[Install]
WantedBy=multi-user.target
EOL
```

## Step 9: Build the Debian Package

Now build the Debian package:

```bash
dpkg-deb --build opensearch-dashboards-2.18.0
```

This will create a file named `opensearch-dashboards-2.18.0.deb` in your current directory.

## Step 10: Installing the Package

To install your custom package on a Debian/Ubuntu system:

```bash
sudo dpkg -i opensearch-dashboards-2.18.0.deb

# If there are dependency issues
sudo apt-get install -f
```

## Final Package Structure

Your final package will have the following structure:
