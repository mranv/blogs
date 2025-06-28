---
title: "Custom OpenSearch Dashboards Packaging Guide: Building from Source with Custom Plugins"
author: "Anubhav Gain"
pubDatetime: 2025-01-28T17:00:00Z
featured: false
draft: false
tags:
  - opensearch
  - dashboards
  - packaging
  - debian
  - build
  - plugins
  - nodejs
description: "Complete guide for building and packaging OpenSearch Dashboards from source with custom plugins, including manual Debian package creation and automated build processes."
---

# Custom OpenSearch Dashboards Packaging Guide: Building from Source with Custom Plugins

This comprehensive guide covers building OpenSearch Dashboards from source with custom plugins and creating custom Debian packages for deployment. Whether you need to integrate custom visualizations or modify the core functionality, this guide provides multiple approaches for packaging OpenSearch Dashboards.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Standard Build Process](#standard-build-process)
- [Manual Debian Package Creation](#manual-debian-package-creation)
- [Custom Plugin Integration](#custom-plugin-integration)
- [Build Optimization](#build-optimization)
- [Deployment and Testing](#deployment-and-testing)

## Overview

### Why Custom Packaging?

Custom packaging of OpenSearch Dashboards provides several advantages:

- **Custom Plugin Integration**: Include proprietary or custom-developed plugins
- **Configuration Control**: Pre-configure dashboards with specific settings
- **Security Hardening**: Apply security patches or customizations
- **Resource Optimization**: Remove unnecessary components or add optimizations
- **Enterprise Deployment**: Create standardized packages for enterprise environments

### Build Methods

1. **Standard Build**: Using OpenSearch's built-in build system
2. **Manual Packaging**: Creating Debian packages from scratch
3. **Custom Plugin Build**: Including additional plugins in the build

## Prerequisites

### System Requirements

```bash
# Minimum requirements for building OpenSearch Dashboards
# - CPU: 8+ cores (16+ recommended)
# - RAM: 16GB+ (32GB recommended)
# - Disk: 50GB+ free space
# - OS: Ubuntu 20.04+ or compatible Linux distribution

# Install essential build dependencies
sudo apt-get update
sudo apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    nodejs \
    npm \
    ruby \
    ruby-dev \
    rpm \
    python3 \
    python3-pip \
    dpkg-dev \
    debhelper
```

### Node.js Version Management

OpenSearch Dashboards requires specific Node.js versions:

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# The .nvmrc file in the repository specifies the required Node.js version
# This will be used automatically when you run nvm use
```

### Development Tools

```bash
# Install Yarn package manager
npm install -g yarn

# Install additional build tools
npm install -g node-gyp
```

## Standard Build Process

### 1. Source Code Preparation

```bash
# Clone OpenSearch Dashboards repository
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards

# Checkout specific version (2.18.0 in this example)
git checkout 2.18.0

# Use the required Node.js version
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)

# Verify Node.js version
node --version
npm --version
```

### 2. Dependency Installation

```bash
# Install dependencies using Yarn
yarn install

# Alternative: Use npm if preferred
# npm install

# Bootstrap plugins (this process can take 30+ minutes)
yarn osd bootstrap
```

### 3. Custom Plugin Integration (Pre-Build)

If you have custom plugins to include:

```bash
# Create plugins directory if it doesn't exist
mkdir -p plugins

# Copy your custom plugins
cp -r /path/to/your/custom/plugins/* plugins/

# Example plugin structure:
# plugins/
# ├── my-custom-plugin/
# │   ├── package.json
# │   ├── public/
# │   ├── server/
# │   └── kibana.json

# Install plugin dependencies
cd plugins/my-custom-plugin
yarn install
cd ../..
```

### 4. Build Process

```bash
# Build OpenSearch Dashboards (this can take 1+ hours)
yarn build --skip-os-packages

# Alternative: Build with OS packages
yarn build --deb

# The built files will be in:
# - build/opensearch-dashboards/ (application files)
# - build/opensearch-dashboards-*.deb (if building packages)
```

## Manual Debian Package Creation

### 1. Package Structure Setup

```bash
# Create package directory structure
mkdir -p opensearch-dashboards-2.18.0/DEBIAN
mkdir -p opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/etc/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/var/log/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/var/lib/opensearch-dashboards
mkdir -p opensearch-dashboards-2.18.0/lib/systemd/system

# Set proper ownership for package building
sudo chown -R $USER:$USER opensearch-dashboards-2.18.0/
```

### 2. Copy Built Application

```bash
# Copy built application files
cp -r build/opensearch-dashboards/* opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/

# Create directory structure in the package
mkdir -p opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/{bin,config,plugins,data}

# Ensure proper permissions for executables
chmod +x opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/bin/*
```

### 3. Create Package Control Files

#### Control File

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/control << 'EOF'
Package: opensearch-dashboards
Version: 2.18.0-custom1
Section: web
Priority: optional
Architecture: amd64
Depends: libnss3, libatk-bridge2.0-0, libgtk-3-0, libx11-xcb1, libxcomposite1, libxcursor1, libxdamage1, libxi6, libxtst6, libasound2
Maintainer: Your Organization <admin@yourorg.com>
Description: OpenSearch Dashboards with custom plugins
 Custom build of OpenSearch Dashboards including specific plugins
 and configurations for enterprise deployment.
 .
 OpenSearch Dashboards is a data visualization dashboard for OpenSearch.
Installed-Size: 1048576
EOF
```

#### Pre-installation Script

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/preinst << 'EOF'
#!/bin/bash
set -e

# Create opensearch-dashboards group if it doesn't exist
if ! getent group opensearch-dashboards >/dev/null; then
    groupadd -r opensearch-dashboards
fi

# Create opensearch-dashboards user if it doesn't exist
if ! getent passwd opensearch-dashboards >/dev/null; then
    useradd -r -g opensearch-dashboards -d /usr/share/opensearch-dashboards \
            -s /sbin/nologin -c "OpenSearch Dashboards Service User" opensearch-dashboards
fi

# Create necessary directories
mkdir -p /var/log/opensearch-dashboards
mkdir -p /var/lib/opensearch-dashboards
mkdir -p /etc/opensearch-dashboards

exit 0
EOF
```

#### Post-installation Script

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/postinst << 'EOF'
#!/bin/bash
set -e

# Set ownership and permissions
chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards
chown -R opensearch-dashboards:opensearch-dashboards /var/log/opensearch-dashboards
chown -R opensearch-dashboards:opensearch-dashboards /var/lib/opensearch-dashboards
chown -R opensearch-dashboards:opensearch-dashboards /etc/opensearch-dashboards

# Set directory permissions
chmod 750 /usr/share/opensearch-dashboards
chmod 750 /var/log/opensearch-dashboards
chmod 750 /var/lib/opensearch-dashboards
chmod 750 /etc/opensearch-dashboards

# Set file permissions
chmod 755 /usr/share/opensearch-dashboards/bin/opensearch-dashboards
chmod 755 /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin

# Configure systemd service
systemctl daemon-reload
systemctl enable opensearch-dashboards.service

# Create data directory symlink if it doesn't exist
if [ ! -L /usr/share/opensearch-dashboards/data ]; then
    ln -sf /var/lib/opensearch-dashboards /usr/share/opensearch-dashboards/data
fi

echo "OpenSearch Dashboards installed successfully."
echo "Configuration file: /etc/opensearch-dashboards/opensearch_dashboards.yml"
echo "Start service: sudo systemctl start opensearch-dashboards"

exit 0
EOF
```

#### Pre-removal Script

```bash
cat > opensearch-dashboards-2.18.0/DEBIAN/prerm << 'EOF'
#!/bin/bash
set -e

# Stop service if running
if systemctl is-active --quiet opensearch-dashboards; then
    systemctl stop opensearch-dashboards
fi

# Disable service
if systemctl is-enabled --quiet opensearch-dashboards; then
    systemctl disable opensearch-dashboards
fi

exit 0
EOF
```

### 4. Create Configuration Files

#### Default Configuration

```bash
# Copy default configuration
cp config/opensearch_dashboards.yml opensearch-dashboards-2.18.0/etc/opensearch-dashboards/

# Add custom paths to configuration
cat >> opensearch-dashboards-2.18.0/etc/opensearch-dashboards/opensearch_dashboards.yml << 'EOF'

# Custom paths for packaged installation
path.data: /var/lib/opensearch-dashboards
logging.dest: /var/log/opensearch-dashboards/opensearch_dashboards.log

# Security settings
server.ssl.enabled: false
opensearch.ssl.verificationMode: none

# Custom branding (if applicable)
opensearchDashboards.branding.mark: "data:image/svg+xml;base64,..."
opensearchDashboards.branding.title: "Custom OpenSearch Dashboards"
EOF
```

#### Systemd Service File

```bash
cat > opensearch-dashboards-2.18.0/lib/systemd/system/opensearch-dashboards.service << 'EOF'
[Unit]
Description=OpenSearch Dashboards
Documentation=https://opensearch.org/docs/dashboards
Wants=network-online.target
After=network-online.target
RequiresMountsFor=/var/lib/opensearch-dashboards

[Service]
Type=simple
User=opensearch-dashboards
Group=opensearch-dashboards
Environment=NODE_ENV=production
Environment=CONFIG_PATH=/etc/opensearch-dashboards/opensearch_dashboards.yml
Environment=NODE_OPTIONS="--max-old-space-size=4096"
ExecStart=/usr/share/opensearch-dashboards/bin/opensearch-dashboards
Restart=always
RestartSec=3
StartLimitBurst=3
StartLimitInterval=60
TimeoutStopSec=30
KillMode=mixed
KillSignal=SIGTERM

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/opensearch-dashboards
ReadWritePaths=/var/log/opensearch-dashboards
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true

# Resource limits
LimitNOFILE=65536
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
EOF
```

### 5. Make Scripts Executable

```bash
# Make maintainer scripts executable
chmod 755 opensearch-dashboards-2.18.0/DEBIAN/preinst
chmod 755 opensearch-dashboards-2.18.0/DEBIAN/postinst
chmod 755 opensearch-dashboards-2.18.0/DEBIAN/prerm
```

### 6. Build the Package

```bash
# Build the Debian package
dpkg-deb --build opensearch-dashboards-2.18.0

# Verify package
dpkg-deb --info opensearch-dashboards-2.18.0.deb
dpkg-deb --contents opensearch-dashboards-2.18.0.deb

# Check package with Lintian (optional)
lintian opensearch-dashboards-2.18.0.deb
```

## Custom Plugin Integration

### Plugin Development Structure

```bash
# Example custom plugin structure
mkdir -p plugins/my-security-plugin

cat > plugins/my-security-plugin/package.json << 'EOF'
{
  "name": "my-security-plugin",
  "version": "2.18.0",
  "description": "Custom security visualization plugin",
  "main": "index.js",
  "opensearchDashboardsVersion": "2.18.0",
  "dependencies": {
    "react": "^16.14.0",
    "react-dom": "^16.14.0"
  }
}
EOF

cat > plugins/my-security-plugin/opensearch_dashboards.json << 'EOF'
{
  "id": "mySecurityPlugin",
  "version": "2.18.0",
  "opensearchDashboardsVersion": "2.18.0",
  "server": true,
  "ui": true,
  "requiredPlugins": ["data", "navigation"],
  "optionalPlugins": []
}
EOF
```

### Plugin Build Integration

```bash
# Build plugins during the main build process
yarn osd bootstrap

# Verify plugin is included
ls -la build/opensearch-dashboards/plugins/
```

## Build Optimization

### Performance Optimization

```bash
# Set Node.js memory limits for large builds
export NODE_OPTIONS="--max-old-space-size=8192"

# Use parallel builds where possible
export JOBS=8

# Optimize build for production
yarn build --skip-os-packages --skip-archives --release
```

### Size Optimization

```bash
# Remove development dependencies from final package
cd opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.map" -delete
find . -name "*.ts" -delete
find . -name "*.spec.js" -delete
find . -name "*.test.js" -delete

# Compress assets
find . -name "*.js" -exec gzip -9 {} \; -exec mv {}.gz {} \;
```

### Security Hardening

```bash
# Remove potentially sensitive files
rm -rf opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/.git*
rm -rf opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/test/
rm -rf opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/docs/

# Set secure permissions
find opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards -type f -exec chmod 644 {} \;
find opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards -type d -exec chmod 755 {} \;
chmod 755 opensearch-dashboards-2.18.0/usr/share/opensearch-dashboards/bin/*
```

## Deployment and Testing

### Installation Testing

```bash
# Install the custom package
sudo dpkg -i opensearch-dashboards-2.18.0.deb

# Fix any dependency issues
sudo apt-get install -f

# Start the service
sudo systemctl start opensearch-dashboards

# Check service status
sudo systemctl status opensearch-dashboards

# Verify web interface (default port 5601)
curl -s http://localhost:5601/api/status | jq .
```

### Validation Scripts

```bash
#!/bin/bash
# validate-installation.sh

echo "=== OpenSearch Dashboards Installation Validation ==="

# Check service status
if systemctl is-active --quiet opensearch-dashboards; then
    echo "✓ Service is running"
else
    echo "✗ Service is not running"
    exit 1
fi

# Check port binding
if netstat -tlnp | grep -q :5601; then
    echo "✓ Port 5601 is bound"
else
    echo "✗ Port 5601 is not bound"
    exit 1
fi

# Check API response
if curl -s -f http://localhost:5601/api/status >/dev/null; then
    echo "✓ API is responding"
else
    echo "✗ API is not responding"
    exit 1
fi

# Check custom plugins
if curl -s http://localhost:5601/api/plugins | grep -q "mySecurityPlugin"; then
    echo "✓ Custom plugins loaded"
else
    echo "⚠ Custom plugins not detected"
fi

# Check log files
if [ -f /var/log/opensearch-dashboards/opensearch_dashboards.log ]; then
    echo "✓ Log file exists"
    if grep -q "Server running at" /var/log/opensearch-dashboards/opensearch_dashboards.log; then
        echo "✓ Successful startup logged"
    else
        echo "⚠ No startup confirmation in logs"
    fi
else
    echo "✗ Log file not found"
fi

echo "=== Validation Complete ==="
```

### Automated Build Script

```bash
#!/bin/bash
# build-custom-dashboards.sh

set -e

VERSION="2.18.0"
CUSTOM_VERSION="${VERSION}-custom$(date +%Y%m%d)"
BUILD_DIR="/tmp/opensearch-dashboards-build"
PLUGINS_DIR="/path/to/custom/plugins"

echo "Building OpenSearch Dashboards ${CUSTOM_VERSION}"

# Cleanup previous builds
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Clone and checkout
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards
git checkout "$VERSION"

# Setup Node.js
nvm use $(cat .nvmrc)

# Copy custom plugins
if [ -d "$PLUGINS_DIR" ]; then
    cp -r "$PLUGINS_DIR"/* plugins/
fi

# Install dependencies
yarn install
yarn osd bootstrap

# Build
yarn build --skip-os-packages --release

# Create package
cd ..
./create-debian-package.sh "$CUSTOM_VERSION"

echo "Build complete: opensearch-dashboards-${CUSTOM_VERSION}.deb"
```

## Troubleshooting

### Common Build Issues

**Memory Issues:**

```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=16384"

# Monitor memory usage during build
watch -n 1 'free -h && ps aux | grep node'
```

**Permission Issues:**

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

**Plugin Conflicts:**

```bash
# Clean plugin cache
rm -rf plugins/*/node_modules
yarn osd bootstrap --force

# Debug plugin loading
node --trace-warnings scripts/opensearch_dashboards --verbose
```

### Package Installation Issues

**Service Won't Start:**

```bash
# Check service logs
journalctl -u opensearch-dashboards -f

# Verify configuration
opensearch-dashboards --config /etc/opensearch-dashboards/opensearch_dashboards.yml --help

# Check permissions
ls -la /var/lib/opensearch-dashboards
ls -la /var/log/opensearch-dashboards
```

**Port Conflicts:**

```bash
# Check what's using port 5601
sudo netstat -tlnp | grep 5601
sudo lsof -i :5601

# Change port in configuration
echo "server.port: 5602" >> /etc/opensearch-dashboards/opensearch_dashboards.yml
```

## Best Practices

### Security Considerations

1. **Regular Updates**: Keep base OpenSearch Dashboards updated
2. **Plugin Vetting**: Audit all custom plugins for security vulnerabilities
3. **Access Control**: Implement proper authentication and authorization
4. **Network Security**: Use HTTPS and proper firewall rules
5. **Monitoring**: Implement logging and monitoring for security events

### Performance Optimization

1. **Resource Allocation**: Allocate sufficient CPU and memory
2. **Caching**: Configure appropriate caching strategies
3. **Index Management**: Optimize OpenSearch indices
4. **Load Balancing**: Use load balancers for high availability
5. **Monitoring**: Monitor performance metrics and optimize accordingly

### Maintenance Procedures

1. **Backup Strategy**: Regular backups of configurations and customizations
2. **Update Process**: Establish procedures for updating custom packages
3. **Testing**: Comprehensive testing before production deployment
4. **Documentation**: Maintain detailed documentation of customizations
5. **Rollback Plan**: Prepare rollback procedures for failed deployments

## Conclusion

Custom packaging of OpenSearch Dashboards enables organizations to deploy tailored solutions that meet specific requirements while maintaining control over the build and deployment process. Whether you need custom plugins, specific configurations, or enterprise-grade packaging, the approaches outlined in this guide provide a solid foundation for creating and deploying custom OpenSearch Dashboards packages.

Key takeaways:

- Plan your customizations carefully before building
- Test thoroughly in development environments
- Implement proper security measures throughout the process
- Maintain detailed documentation of customizations
- Establish reliable build and deployment pipelines

With proper implementation, custom OpenSearch Dashboards packages can provide significant value for organizations requiring specialized functionality or deployment requirements.
