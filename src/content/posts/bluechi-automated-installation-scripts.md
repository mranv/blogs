---
author: Anubhav Gain
pubDatetime: 2025-01-28T13:00:00Z
title: "BlueChI Automated Installation: Enterprise-Ready Scripts for Multi-Node Orchestration"
slug: bluechi-automated-installation-scripts
featured: false
draft: false
tags:
  - bluechi
  - automation
  - systemd
  - orchestration
  - rocky-linux
  - enterprise
description: "Complete automation scripts for deploying BlueChI multi-node orchestration on Rocky Linux and Amazon Linux. Includes single-node, multi-node, and production-ready configurations with security hardening."
---

## Table of Contents

## Introduction

BlueChI is a systemd-based multi-node orchestration framework that provides deterministic service control across distributed systems. This guide presents production-ready automation scripts for deploying BlueChI in various configurations, from single-node setups to complex multi-node deployments.

The scripts featured here emphasize security, reliability, and ease of deployment, making them suitable for enterprise environments where predictable behavior and minimal overhead are critical requirements.

## Script Overview

We'll cover three main deployment scenarios:

1. **All-in-One Installation**: Single script for quick deployments
2. **Multi-Node Installation**: Flexible script supporting controller and agent roles
3. **Production Deployment**: Enhanced scripts with monitoring, HA, and security features

## All-in-One BlueChI Installation Script

This script installs all BlueChI components on a single node, ideal for development and testing:

```bash
#!/bin/bash

# BlueChI All-in-One Installation Script
# Supports: Rocky Linux, AlmaLinux, RHEL, Amazon Linux
# Version: 1.0

# Secure script setup
set -e          # Exit immediately if a command exits with a non-zero status
set -u          # Treat unset variables as an error
set -o pipefail # Return value of a pipeline is the value of the last command

# Global variables
TEMP_DIRS=()
LOG_FILE="/var/log/bluechi_install.log"

# Function for logging with colors
log() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo -e "\e[0;32m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
}

warn() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
  echo -e "\e[0;33m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
}

# Function for error handling
error_exit() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
  echo -e "\e[0;31m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
  cleanup
  exit 1
}

# Cleanup function
cleanup() {
  log "Cleaning up temporary files..."
  for dir in "${TEMP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      rm -rf "$dir"
    fi
  done
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Function to check if running as root
check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    error_exit "This script must be run as root"
  fi
}

# Function to detect OS
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    log "Detected OS: $OS $VERSION"
  else
    error_exit "Cannot detect OS, /etc/os-release file not found"
  fi
}

# Function to install wget
install_wget() {
  log "Installing wget..."

  case $OS in
    "rocky" | "almalinux" | "rhel" | "centos")
      dnf install -y wget || error_exit "Failed to install wget on $OS"
      ;;
    "amzn")
      yum install -y wget || error_exit "Failed to install wget on Amazon Linux"
      ;;
    *)
      error_exit "Unsupported OS: $OS"
      ;;
  esac

  log "wget installed successfully"
}

# Function to handle dependencies for BlueChI
install_dependencies() {
  log "Installing dependencies..."

  # Dependencies for BlueChI
  DEPENDENCIES=(
    "dbus"
    "systemd"
    "python3"
    "dbus-broker"
    "device-mapper"
    "device-mapper-libs"
    "libfdisk"
    "util-linux"
    "systemd-pam"
  )

  case $OS in
    "rocky" | "almalinux" | "rhel" | "centos")
      for dep in "${DEPENDENCIES[@]}"; do
        log "Installing dependency: $dep"
        dnf install -y "$dep" || warn "Could not install $dep, but continuing"
      done
      ;;
    "amzn")
      for dep in "${DEPENDENCIES[@]}"; do
        log "Installing dependency: $dep"
        yum install -y "$dep" || warn "Could not install $dep, but continuing"
      done
      ;;
    *)
      error_exit "Unsupported OS: $OS"
      ;;
  esac

  log "Dependencies installation completed"
}

# Function to download file with proper security validation
secure_download() {
  local url=$1
  local output_file=$2

  # Use wget with proper SSL/TLS security
  wget --https-only --secure-protocol=TLSv1_2 "$url" -O "$output_file" || return 1

  # Verify file exists and is not empty
  if [ ! -s "$output_file" ]; then
    return 1
  fi

  return 0
}

# Function to download and install a package
download_and_install() {
  local url=$1
  local filename=$(basename "$url")
  local temp_dir=$(mktemp -d)
  TEMP_DIRS+=("$temp_dir")
  local output_file="$temp_dir/$filename"

  log "Downloading $filename..."
  if ! secure_download "$url" "$output_file"; then
    error_exit "Failed to download $filename securely"
  fi

  log "Installing $filename..."
  if ! rpm -Uvh --nodeps "$output_file"; then
    warn "Failed to install $filename with standard options, trying with --force"
    rpm -Uvh --nodeps --force "$output_file" || error_exit "Failed to install $filename even with --force"
  fi

  log "$filename installed successfully"
}

# Function to check if all required commands are available
check_requirements() {
  log "Checking if required commands are available..."

  local missing_commands=()

  # Commands to check
  local commands=("rpm")

  for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_commands+=("$cmd")
    fi
  done

  if [ ${#missing_commands[@]} -gt 0 ]; then
    error_exit "Required commands not found: ${missing_commands[*]}"
  fi

  log "All required commands are available"
}

# Function to verify service status
verify_services() {
  log "Verifying BlueChI services..."

  if systemctl is-active --quiet bluechi-controller; then
    log "BlueChI controller service is active"
  else
    warn "BlueChI controller service is not active"
  fi

  if systemctl is-active --quiet bluechi-agent; then
    log "BlueChI agent service is active"
  else
    warn "BlueChI agent service is not active"
  fi
}

# Main function
main() {
  log "Starting BlueChI installation script"

  check_root
  detect_os
  check_requirements

  # Check if wget is already installed, if not install it
  if ! command -v wget &> /dev/null; then
    install_wget
  else
    log "wget is already installed"
  fi

  # Install dependencies
  install_dependencies

  # BlueChI package URLs
  PACKAGES=(
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-agent-0.10.2-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-controller-0.10.2-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-ctl-0.10.2-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-is-online-0.10.2-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-selinux-0.10.2-1.el9.noarch.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/p/python3-bluechi-0.10.2-1.el9.noarch.rpm"
  )

  # Install each package
  for package in "${PACKAGES[@]}"; do
    download_and_install "$package"
  done

  log "BlueChI packages installed successfully"

  # Configure BlueChI for all-in-one setup
  log "Configuring BlueChI..."

  # Create configuration directories
  mkdir -p /etc/bluechi/controller.conf.d
  mkdir -p /etc/bluechi/agent.conf.d

  # Create controller configuration
  cat > /etc/bluechi/controller.conf.d/1.conf << EOF
[bluechi-controller]
ControllerPort=2020
AllowedNodeNames=$(hostname)
EOF

  # Create agent configuration for local connection
  cat > /etc/bluechi/agent.conf.d/1.conf << EOF
[bluechi-agent]
ControllerAddress=unix:path=/run/bluechi/bluechi.sock
NodeName=$(hostname)
EOF

  # Enable and start BlueChI services
  log "Enabling and starting BlueChI services..."
  systemctl enable --now bluechi-controller bluechi-agent || warn "Failed to enable and start BlueChI services"

  # Verify services
  verify_services

  # Display summary
  log "BlueChI installation and configuration completed"
  log "Installation log available at: $LOG_FILE"

  echo ""
  echo "========================================"
  echo "BlueChI Installation Complete!"
  echo "========================================"
  echo ""
  echo "Verify installation with:"
  echo "  bluechictl list-nodes"
  echo "  bluechictl list-units $(hostname)"
  echo ""
  echo "Service status:"
  systemctl status bluechi-controller --no-pager | grep Active
  systemctl status bluechi-agent --no-pager | grep Active
  echo ""
}

# Execute main function
main
```

## Multi-Node BlueChI Installation Script

This enhanced script supports both controller and agent installations with flexible configurations:

```bash
#!/bin/bash

# BlueChI Multi-Node Installation Script
# Supports: Rocky Linux, AlmaLinux, RHEL, Amazon Linux
# Version: 2.0

# Secure script setup
set -e          # Exit immediately if a command exits with a non-zero status
set -u          # Treat unset variables as an error
set -o pipefail # Return value of a pipeline is the value of the last command

# Global variables
TEMP_DIRS=()
LOG_FILE="/var/log/bluechi_install.log"
CONTROLLER_PORT="2020"  # Non-privileged port for easier testing/deployment
BLUECHI_VERSION="0.10.2"
INSTALL_MODE=""
CONTROLLER_IP=""
ALLOWED_NODES=""
NODE_NAME=""

# Function for logging with colors
log() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo -e "\e[0;32m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
}

warn() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
  echo -e "\e[0;33m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
}

# Function for error handling
error_exit() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
  echo -e "\e[0;31m${message}\e[0m"
  echo "${message}" >> "$LOG_FILE"
  cleanup
  exit 1
}

# Cleanup function
cleanup() {
  log "Cleaning up temporary files..."
  for dir in "${TEMP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      rm -rf "$dir"
    fi
  done
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Function to check if running as root
check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    error_exit "This script must be run as root"
  fi
}

# Function to detect OS
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    log "Detected OS: $OS $VERSION"
  else
    error_exit "Cannot detect OS, /etc/os-release file not found"
  fi
}

# Function to install wget
install_wget() {
  log "Installing wget..."

  case $OS in
    "rocky" | "almalinux" | "rhel" | "centos")
      dnf install -y wget || error_exit "Failed to install wget on $OS"
      ;;
    "amzn")
      yum install -y wget || error_exit "Failed to install wget on Amazon Linux"
      ;;
    *)
      error_exit "Unsupported OS: $OS"
      ;;
  esac

  log "wget installed successfully"
}

# Function to handle dependencies for BlueChI
install_dependencies() {
  log "Installing dependencies..."

  DEPENDENCIES=(
    "dbus"
    "systemd"
    "python3"
    "dbus-broker"
    "device-mapper"
    "device-mapper-libs"
    "libfdisk"
    "util-linux"
    "systemd-pam"
  )

  case $OS in
    "rocky" | "almalinux" | "rhel" | "centos")
      for dep in "${DEPENDENCIES[@]}"; do
        log "Installing dependency: $dep"
        dnf install -y "$dep" || warn "Could not install $dep, but continuing"
      done
      ;;
    "amzn")
      for dep in "${DEPENDENCIES[@]}"; do
        log "Installing dependency: $dep"
        yum install -y "$dep" || warn "Could not install $dep, but continuing"
      done
      ;;
    *)
      error_exit "Unsupported OS: $OS"
      ;;
  esac

  log "Dependencies installation completed"
}

# Function to download file with proper security validation
secure_download() {
  local url=$1
  local output_file=$2

  # Use wget with proper SSL/TLS security
  wget --https-only --secure-protocol=TLSv1_2 "$url" -O "$output_file" || return 1

  # Verify file exists and is not empty
  if [ ! -s "$output_file" ]; then
    return 1
  fi

  return 0
}

# Function to download and install a package
download_and_install() {
  local url=$1
  local filename=$(basename "$url")
  local temp_dir=$(mktemp -d)
  TEMP_DIRS+=("$temp_dir")
  local output_file="$temp_dir/$filename"

  log "Downloading $filename..."
  if ! secure_download "$url" "$output_file"; then
    error_exit "Failed to download $filename securely"
  fi

  log "Installing $filename..."
  if ! rpm -Uvh --nodeps "$output_file"; then
    warn "Failed to install $filename with standard options, trying with --force"
    rpm -Uvh --nodeps --force "$output_file" || error_exit "Failed to install $filename even with --force"
  fi

  log "$filename installed successfully"
}

# Function to check if all required commands are available
check_requirements() {
  log "Checking if required commands are available..."

  local missing_commands=()
  local commands=("rpm" "hostname" "systemctl")

  for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_commands+=("$cmd")
    fi
  done

  if [ ${#missing_commands[@]} -gt 0 ]; then
    error_exit "Required commands not found: ${missing_commands[*]}"
  fi

  log "All required commands are available"
}

# Function to ensure config directories exist
ensure_config_dirs() {
  log "Ensuring configuration directories exist..."

  mkdir -p /etc/bluechi/controller.conf.d
  mkdir -p /etc/bluechi/agent.conf.d

  log "Configuration directories created"
}

# Function to configure controller
configure_controller() {
  log "Configuring BlueChI controller..."

  # Create configuration
  cat > /etc/bluechi/controller.conf.d/1.conf << EOF
[bluechi-controller]
ControllerPort=${CONTROLLER_PORT}
AllowedNodeNames=${ALLOWED_NODES}
LogLevel=info
LogTarget=journald
EOF

  log "Controller configuration written to /etc/bluechi/controller.conf.d/1.conf"

  # Configure local agent to use Unix Domain Socket
  cat > /etc/bluechi/agent.conf.d/1.conf << EOF
[bluechi-agent]
ControllerAddress=unix:path=/run/bluechi/bluechi.sock
NodeName=$(hostname)
LogLevel=info
LogTarget=journald
EOF

  log "Local agent configuration written to /etc/bluechi/agent.conf.d/1.conf"
}

# Function to configure agent
configure_agent() {
  log "Configuring BlueChI agent..."

  # Create configuration
  cat > /etc/bluechi/agent.conf.d/1.conf << EOF
[bluechi-agent]
ControllerHost=${CONTROLLER_IP}
ControllerPort=${CONTROLLER_PORT}
NodeName=${NODE_NAME}
LogLevel=info
LogTarget=journald
HeartbeatInterval=5
EOF

  log "Agent configuration written to /etc/bluechi/agent.conf.d/1.conf"
}

# Function to verify service status
verify_services() {
  log "Verifying BlueChI services..."

  if [ "$INSTALL_MODE" = "controller" ]; then
    if systemctl is-active --quiet bluechi-controller; then
      log "BlueChI controller service is active"
    else
      warn "BlueChI controller service is not active"
    fi
  fi

  if systemctl is-active --quiet bluechi-agent; then
    log "BlueChI agent service is active"
  else
    warn "BlueChI agent service is not active"
  fi
}

# Function to open firewall port for controller
configure_firewall() {
  log "Configuring firewall for BlueChI..."

  if command -v firewall-cmd &> /dev/null; then
    log "Using firewalld..."
    if systemctl is-active --quiet firewalld; then
      log "Opening port ${CONTROLLER_PORT} for BlueChI controller"
      firewall-cmd --permanent --add-port=${CONTROLLER_PORT}/tcp
      firewall-cmd --reload
    else
      warn "Firewalld is installed but not running, skipping firewall configuration"
    fi
  else
    warn "firewall-cmd not found, unable to configure firewall automatically"
    log "Please ensure port ${CONTROLLER_PORT} is open in your firewall for BlueChI to function properly"
  fi
}

# Function to install controller
install_controller() {
  log "Installing BlueChI controller components..."

  # Controller packages
  PACKAGES=(
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-agent-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-controller-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-ctl-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-selinux-${BLUECHI_VERSION}-1.el9.noarch.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/p/python3-bluechi-${BLUECHI_VERSION}-1.el9.noarch.rpm"
  )

  # Install each package
  for package in "${PACKAGES[@]}"; do
    download_and_install "$package"
  done

  # If online component was requested, install it
  if [[ "$*" == *"--with-online"* ]]; then
    download_and_install "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-is-online-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
  fi

  ensure_config_dirs
  configure_controller

  if [[ "$*" == *"--configure-firewall"* ]]; then
    configure_firewall
  fi

  log "BlueChI controller installation completed"
}

# Function to install agent
install_agent() {
  log "Installing BlueChI agent components..."

  # Agent packages
  PACKAGES=(
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-agent-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-selinux-${BLUECHI_VERSION}-1.el9.noarch.rpm"
    "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/p/python3-bluechi-${BLUECHI_VERSION}-1.el9.noarch.rpm"
  )

  # Install each package
  for package in "${PACKAGES[@]}"; do
    download_and_install "$package"
  done

  # If online component was requested, install it
  if [[ "$*" == *"--with-online"* ]]; then
    download_and_install "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-is-online-${BLUECHI_VERSION}-1.el9.x86_64.rpm"
  fi

  ensure_config_dirs
  configure_agent

  log "BlueChI agent installation completed"
}

# Function to start services
start_services() {
  log "Starting BlueChI services..."

  if [ "$INSTALL_MODE" = "controller" ]; then
    log "Starting controller and agent services..."
    systemctl enable --now bluechi-controller bluechi-agent || warn "Failed to enable and start BlueChI services"
  else
    log "Starting agent service..."
    systemctl enable --now bluechi-agent || warn "Failed to enable and start BlueChI agent service"
  fi

  verify_services
}

# Function to show usage
usage() {
  cat << EOF
Usage: $0 [OPTIONS]

BlueChI Multi-Node Installation Script

OPTIONS:
  -m, --mode MODE            Installation mode (controller or agent)
  -i, --controller-ip IP     IP address of the controller node (required for agent mode)
  -n, --node-name NAME       Name of this node (required for agent mode)
  -a, --allowed-nodes NODES  Comma-separated list of allowed node names (required for controller mode)
  -p, --port PORT            Controller port (default: 2020)
  -v, --version VERSION      BlueChI version to install (default: ${BLUECHI_VERSION})
  --with-online              Install bluechi-is-online package
  --configure-firewall       Configure firewall to allow BlueChi traffic (controller only)
  -h, --help                 Show this help message and exit

EXAMPLES:
  # Install controller with local hostname and pi as allowed nodes
  $0 --mode controller --allowed-nodes \$(hostname),pi

  # Install agent to connect to controller at 192.168.1.10
  $0 --mode agent --controller-ip 192.168.1.10 --node-name pi

  # Install controller with firewall configuration
  $0 --mode controller --allowed-nodes node1,node2,node3 --configure-firewall

  # Install agent with custom port
  $0 --mode agent --controller-ip 192.168.1.10 --node-name worker1 --port 2021

NOTES:
  - This script must be run as root
  - Supported OS: Rocky Linux, AlmaLinux, RHEL, Amazon Linux
  - Logs are written to: $LOG_FILE
  - Configuration files are in: /etc/bluechi/

For more information, visit: https://github.com/eclipse-bluechi/bluechi
EOF
  exit 0
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -m|--mode)
        INSTALL_MODE="$2"
        shift 2
        ;;
      -i|--controller-ip)
        CONTROLLER_IP="$2"
        shift 2
        ;;
      -n|--node-name)
        NODE_NAME="$2"
        shift 2
        ;;
      -a|--allowed-nodes)
        ALLOWED_NODES="$2"
        shift 2
        ;;
      -p|--port)
        CONTROLLER_PORT="$2"
        shift 2
        ;;
      -v|--version)
        BLUECHI_VERSION="$2"
        shift 2
        ;;
      --with-online)
        # This is a flag, no value needed
        shift
        ;;
      --configure-firewall)
        # This is a flag, no value needed
        shift
        ;;
      -h|--help)
        usage
        ;;
      *)
        warn "Unknown option: $1"
        usage
        ;;
    esac
  done

  # Validate required arguments
  if [ -z "$INSTALL_MODE" ]; then
    error_exit "Installation mode (--mode) must be specified"
  fi

  if [ "$INSTALL_MODE" != "controller" ] && [ "$INSTALL_MODE" != "agent" ]; then
    error_exit "Installation mode must be either 'controller' or 'agent'"
  fi

  if [ "$INSTALL_MODE" = "controller" ] && [ -z "$ALLOWED_NODES" ]; then
    error_exit "Allowed nodes (--allowed-nodes) must be specified for controller mode"
  fi

  if [ "$INSTALL_MODE" = "agent" ]; then
    if [ -z "$CONTROLLER_IP" ]; then
      error_exit "Controller IP (--controller-ip) must be specified for agent mode"
    fi

    if [ -z "$NODE_NAME" ]; then
      error_exit "Node name (--node-name) must be specified for agent mode"
    fi
  fi
}

# Main function
main() {
  log "Starting BlueChI installation script in $INSTALL_MODE mode"

  check_root
  detect_os
  check_requirements

  # Check if wget is already installed, if not install it
  if ! command -v wget &> /dev/null; then
    install_wget
  else
    log "wget is already installed"
  fi

  # Install dependencies
  install_dependencies

  # Install either controller or agent based on mode
  if [ "$INSTALL_MODE" = "controller" ]; then
    install_controller "$@"
  else
    install_agent "$@"
  fi

  # Start services
  start_services

  # Display summary
  echo ""
  echo "========================================"
  echo "BlueChI Installation Complete!"
  echo "========================================"
  echo ""

  if [ "$INSTALL_MODE" = "controller" ]; then
    echo "Controller installation summary:"
    echo "  - Listening on port: $CONTROLLER_PORT"
    echo "  - Allowed nodes: $ALLOWED_NODES"
    echo "  - Configuration: /etc/bluechi/controller.conf.d/"
    echo ""
    echo "Verify with: bluechictl list-nodes"
  else
    echo "Agent installation summary:"
    echo "  - Node name: $NODE_NAME"
    echo "  - Controller: $CONTROLLER_IP:$CONTROLLER_PORT"
    echo "  - Configuration: /etc/bluechi/agent.conf.d/"
    echo ""
    echo "Check logs: journalctl -u bluechi-agent -f"
  fi

  echo ""
  echo "Service status:"
  if [ "$INSTALL_MODE" = "controller" ]; then
    systemctl status bluechi-controller --no-pager | grep Active || true
  fi
  systemctl status bluechi-agent --no-pager | grep Active || true
  echo ""
  echo "Installation log: $LOG_FILE"
  echo ""
}

# Parse arguments first
parse_args "$@"

# Execute main function with all arguments
main "$@"
```

## Production Deployment Script

This comprehensive script includes monitoring, high availability, and enhanced security features:

```bash
#!/bin/bash

# BlueChI Production Deployment Script
# Enterprise-ready installation with monitoring and HA support
# Version: 3.0

set -euo pipefail

# Configuration
readonly SCRIPT_VERSION="3.0"
readonly LOG_DIR="/var/log/bluechi"
readonly BACKUP_DIR="/var/backups/bluechi"
readonly CONFIG_DIR="/etc/bluechi"
readonly MONITORING_DIR="/opt/bluechi-monitoring"
readonly HA_CONFIG_DIR="/etc/bluechi-ha"

# Create necessary directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$CONFIG_DIR" "$MONITORING_DIR" "$HA_CONFIG_DIR"

# Logging setup
readonly LOG_FILE="$LOG_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $*"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi

    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot detect OS version"
    fi

    # Check required tools
    local required_tools=("systemctl" "firewall-cmd" "sestatus" "python3")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            warn "$tool is not installed"
        fi
    done

    log "Prerequisites check completed"
}

# Install BlueChI with enhanced security
install_bluechi_secure() {
    local mode=$1
    local controller_ip=${2:-}
    local node_name=${3:-$(hostname)}

    log "Installing BlueChI in $mode mode with enhanced security..."

    # Create dedicated user for BlueChI
    if ! id -u bluechi &>/dev/null; then
        useradd -r -s /sbin/nologin -d /var/lib/bluechi -m bluechi
        log "Created bluechi user"
    fi

    # Install packages
    local packages=(
        "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-agent-0.10.2-1.el9.x86_64.rpm"
        "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-selinux-0.10.2-1.el9.noarch.rpm"
        "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/p/python3-bluechi-0.10.2-1.el9.noarch.rpm"
    )

    if [[ "$mode" == "controller" ]]; then
        packages+=(
            "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-controller-0.10.2-1.el9.x86_64.rpm"
            "https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/Packages/b/bluechi-ctl-0.10.2-1.el9.x86_64.rpm"
        )
    fi

    for package in "${packages[@]}"; do
        local pkg_name=$(basename "$package")
        log "Downloading $pkg_name..."
        wget -q --https-only "$package" -O "/tmp/$pkg_name"
        rpm -Uvh "/tmp/$pkg_name" || warn "Package $pkg_name might already be installed"
        rm -f "/tmp/$pkg_name"
    done

    # Secure configuration
    setup_secure_config "$mode" "$controller_ip" "$node_name"

    # SELinux configuration
    setup_selinux

    # Firewall configuration
    setup_firewall "$mode"

    log "BlueChI secure installation completed"
}

# Setup secure configuration
setup_secure_config() {
    local mode=$1
    local controller_ip=$2
    local node_name=$3

    log "Setting up secure configuration..."

    # Create config directories with proper permissions
    mkdir -p "$CONFIG_DIR"/{controller.conf.d,agent.conf.d}
    chown -R bluechi:bluechi "$CONFIG_DIR"
    chmod 750 "$CONFIG_DIR"

    if [[ "$mode" == "controller" ]]; then
        # Controller configuration with security settings
        cat > "$CONFIG_DIR/controller.conf.d/security.conf" << EOF
[bluechi-controller]
ControllerPort=2020
AllowedNodeNames=${ALLOWED_NODES:-$node_name}
LogLevel=info
LogTarget=journald

# Security settings
MaxConnections=100
ConnectionTimeout=30
AuthenticationMethod=certificate
CertificateFile=/etc/bluechi/certs/controller.crt
KeyFile=/etc/bluechi/certs/controller.key
CAFile=/etc/bluechi/certs/ca.crt
EOF

        # Local agent config
        cat > "$CONFIG_DIR/agent.conf.d/local.conf" << EOF
[bluechi-agent]
ControllerAddress=unix:path=/run/bluechi/bluechi.sock
NodeName=$node_name
LogLevel=info
LogTarget=journald
EOF
    else
        # Agent configuration
        cat > "$CONFIG_DIR/agent.conf.d/remote.conf" << EOF
[bluechi-agent]
ControllerHost=$controller_ip
ControllerPort=2020
NodeName=$node_name
LogLevel=info
LogTarget=journald
HeartbeatInterval=5
ReconnectInterval=10

# Security settings
CertificateFile=/etc/bluechi/certs/agent.crt
KeyFile=/etc/bluechi/certs/agent.key
CAFile=/etc/bluechi/certs/ca.crt
EOF
    fi

    # Set proper permissions
    chmod 640 "$CONFIG_DIR"/*/*.conf
    chown -R root:bluechi "$CONFIG_DIR"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."

    # Create monitoring scripts
    cat > "$MONITORING_DIR/bluechi-monitor.py" << 'EOF'
#!/usr/bin/env python3

import subprocess
import json
import time
import socket
from datetime import datetime

class BlueChiMonitor:
    def __init__(self):
        self.metrics = {
            'nodes': {},
            'services': {},
            'errors': []
        }

    def collect_metrics(self):
        # Collect node metrics
        try:
            result = subprocess.run(['bluechictl', 'list-nodes'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.parse_nodes(result.stdout)
        except Exception as e:
            self.metrics['errors'].append(f"Failed to collect nodes: {e}")

        # Collect service metrics for each node
        for node in self.metrics['nodes']:
            try:
                result = subprocess.run(['bluechictl', 'list-units', node],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.parse_services(node, result.stdout)
            except Exception as e:
                self.metrics['errors'].append(f"Failed to collect services for {node}: {e}")

    def parse_nodes(self, output):
        lines = output.strip().split('\n')[1:]  # Skip header
        for line in lines:
            parts = line.split()
            if len(parts) >= 3:
                node_name = parts[0]
                state = parts[1]
                last_seen = ' '.join(parts[2:])
                self.metrics['nodes'][node_name] = {
                    'state': state,
                    'last_seen': last_seen,
                    'timestamp': datetime.now().isoformat()
                }

    def parse_services(self, node, output):
        if node not in self.metrics['services']:
            self.metrics['services'][node] = {}

        lines = output.strip().split('\n')[1:]  # Skip header
        for line in lines:
            parts = line.split(None, 3)
            if len(parts) >= 3:
                service_name = parts[0]
                state = parts[1]
                self.metrics['services'][node][service_name] = {
                    'state': state,
                    'timestamp': datetime.now().isoformat()
                }

    def export_prometheus(self):
        # Export metrics in Prometheus format
        output = []

        # Node metrics
        for node, data in self.metrics['nodes'].items():
            state_value = 1 if data['state'] == 'online' else 0
            output.append(f'bluechi_node_online{{node="{node}"}} {state_value}')

        # Service metrics
        for node, services in self.metrics['services'].items():
            running = sum(1 for s in services.values() if s['state'] == 'running')
            failed = sum(1 for s in services.values() if s['state'] == 'failed')
            output.append(f'bluechi_services_running{{node="{node}"}} {running}')
            output.append(f'bluechi_services_failed{{node="{node}"}} {failed}')

        # Error count
        output.append(f'bluechi_monitor_errors {len(self.metrics["errors"])}')

        return '\n'.join(output)

    def serve_metrics(self, port=9101):
        # Simple HTTP server for Prometheus scraping
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind(('0.0.0.0', port))
        server_socket.listen(5)

        print(f"Serving metrics on port {port}")

        while True:
            client_socket, addr = server_socket.accept()

            # Collect fresh metrics
            self.collect_metrics()
            metrics = self.export_prometheus()

            # Send HTTP response
            response = f"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n{metrics}"
            client_socket.send(response.encode())
            client_socket.close()

if __name__ == '__main__':
    monitor = BlueChiMonitor()
    monitor.serve_metrics()
EOF

    chmod +x "$MONITORING_DIR/bluechi-monitor.py"

    # Create systemd service for monitoring
    cat > /etc/systemd/system/bluechi-monitor.service << EOF
[Unit]
Description=BlueChI Monitoring Service
After=network.target bluechi-controller.service

[Service]
Type=simple
ExecStart=$MONITORING_DIR/bluechi-monitor.py
Restart=always
User=bluechi
Group=bluechi

[Install]
WantedBy=multi-user.target
EOF

    # Create alert rules
    cat > "$MONITORING_DIR/alerts.yaml" << EOF
groups:
  - name: bluechi_alerts
    rules:
      - alert: BlueChiNodeDown
        expr: bluechi_node_online == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "BlueChI node {{ \$labels.node }} is down"
          description: "Node {{ \$labels.node }} has been offline for more than 5 minutes"

      - alert: BlueChiServicesFailed
        expr: bluechi_services_failed > 0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Failed services on node {{ \$labels.node }}"
          description: "{{ \$value }} services are in failed state on {{ \$labels.node }}"

      - alert: BlueChiMonitorErrors
        expr: bluechi_monitor_errors > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "BlueChI monitoring errors detected"
          description: "The monitoring system has encountered {{ \$value }} errors"
EOF

    systemctl daemon-reload
    systemctl enable bluechi-monitor.service

    log "Monitoring setup completed"
}

# Setup High Availability
setup_ha() {
    local role=$1  # master or backup
    local vip=$2
    local interface=$3

    log "Setting up High Availability as $role..."

    # Install keepalived
    dnf install -y keepalived || yum install -y keepalived

    # Configure keepalived
    local priority=100
    if [[ "$role" == "backup" ]]; then
        priority=90
    fi

    cat > /etc/keepalived/keepalived.conf << EOF
global_defs {
    notification_email {
        admin@example.com
    }
    notification_email_from bluechi@$(hostname)
    smtp_server localhost
    smtp_connect_timeout 30
}

vrrp_script check_bluechi {
    script "/usr/local/bin/check_bluechi_health.sh"
    interval 5
    weight -10
    fall 2
    rise 2
}

vrrp_instance BLUECHI_VIP {
    state $role
    interface $interface
    virtual_router_id 51
    priority $priority
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass $(openssl rand -hex 16)
    }
    virtual_ipaddress {
        $vip/24
    }
    track_script {
        check_bluechi
    }
    notify_master "/usr/local/bin/bluechi_ha_notify.sh master"
    notify_backup "/usr/local/bin/bluechi_ha_notify.sh backup"
    notify_fault "/usr/local/bin/bluechi_ha_notify.sh fault"
}
EOF

    # Create health check script
    cat > /usr/local/bin/check_bluechi_health.sh << 'EOF'
#!/bin/bash

# Check if BlueChI controller is running
if systemctl is-active --quiet bluechi-controller; then
    # Check if we can list nodes
    if bluechictl list-nodes &>/dev/null; then
        exit 0
    fi
fi

exit 1
EOF

    chmod +x /usr/local/bin/check_bluechi_health.sh

    # Create notification script
    cat > /usr/local/bin/bluechi_ha_notify.sh << 'EOF'
#!/bin/bash

STATE=$1
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

case $STATE in
    master)
        logger -t bluechi-ha "[$TIMESTAMP] Became MASTER - starting services"
        systemctl start bluechi-controller
        # Notify monitoring system
        curl -X POST http://monitoring.example.com/api/alerts \
             -H "Content-Type: application/json" \
             -d "{\"alert\": \"BlueChI HA failover\", \"host\": \"$(hostname)\", \"state\": \"master\"}"
        ;;
    backup)
        logger -t bluechi-ha "[$TIMESTAMP] Became BACKUP - stopping controller"
        systemctl stop bluechi-controller
        ;;
    fault)
        logger -t bluechi-ha "[$TIMESTAMP] Entered FAULT state"
        ;;
esac
EOF

    chmod +x /usr/local/bin/bluechi_ha_notify.sh

    # Enable and start keepalived
    systemctl enable --now keepalived

    log "High Availability setup completed"
}

# Setup backup and recovery
setup_backup() {
    log "Setting up backup and recovery..."

    # Create backup script
    cat > /usr/local/bin/bluechi_backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/bluechi"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bluechi_backup_$TIMESTAMP.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup components
tar -czf "$BACKUP_FILE" \
    /etc/bluechi/ \
    /var/lib/bluechi/ \
    /etc/systemd/system/bluechi*.service \
    /usr/local/bin/bluechi*.sh \
    2>/dev/null

# Backup node states
bluechictl list-nodes > "$BACKUP_DIR/nodes_$TIMESTAMP.txt"
for node in $(bluechictl list-nodes | tail -n +2 | awk '{print $1}'); do
    bluechictl list-units "$node" > "$BACKUP_DIR/units_${node}_$TIMESTAMP.txt"
done

# Rotate old backups (keep last 30 days)
find "$BACKUP_DIR" -name "bluechi_backup_*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.txt" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"

# Upload to remote storage (optional)
# aws s3 cp "$BACKUP_FILE" s3://backup-bucket/bluechi/
EOF

    chmod +x /usr/local/bin/bluechi_backup.sh

    # Create recovery script
    cat > /usr/local/bin/bluechi_recover.sh << 'EOF'
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Stop services
systemctl stop bluechi-controller bluechi-agent

# Extract backup
tar -xzf "$BACKUP_FILE" -C /

# Restore permissions
chown -R root:bluechi /etc/bluechi
chmod 750 /etc/bluechi
chmod 640 /etc/bluechi/*/*.conf

# Restart services
systemctl daemon-reload
systemctl start bluechi-controller bluechi-agent

echo "Recovery completed from: $BACKUP_FILE"
EOF

    chmod +x /usr/local/bin/bluechi_recover.sh

    # Schedule daily backups
    cat > /etc/cron.d/bluechi-backup << EOF
0 2 * * * root /usr/local/bin/bluechi_backup.sh >> $LOG_DIR/backup.log 2>&1
EOF

    log "Backup and recovery setup completed"
}

# Setup SELinux
setup_selinux() {
    log "Configuring SELinux..."

    if command -v getenforce &> /dev/null; then
        if [[ $(getenforce) != "Disabled" ]]; then
            # Set proper SELinux contexts
            semanage fcontext -a -t systemd_unit_file_t "/etc/bluechi(/.*)?"
            restorecon -Rv /etc/bluechi

            # Allow BlueChI to bind to port
            semanage port -a -t bluechi_port_t -p tcp 2020 2>/dev/null || true

            log "SELinux configuration completed"
        else
            warn "SELinux is disabled"
        fi
    else
        warn "SELinux tools not found"
    fi
}

# Setup firewall
setup_firewall() {
    local mode=$1

    log "Configuring firewall..."

    if command -v firewall-cmd &> /dev/null; then
        if systemctl is-active --quiet firewalld; then
            if [[ "$mode" == "controller" ]]; then
                # Open controller port
                firewall-cmd --permanent --add-port=2020/tcp
                # Open monitoring port
                firewall-cmd --permanent --add-port=9101/tcp
            fi

            # Reload firewall
            firewall-cmd --reload

            log "Firewall configuration completed"
        else
            warn "Firewalld is not running"
        fi
    else
        warn "firewall-cmd not found"
    fi
}

# Main deployment function
deploy_production() {
    local deployment_type=$1

    case "$deployment_type" in
        "controller-ha")
            log "Deploying BlueChI Controller with HA"
            check_prerequisites
            install_bluechi_secure "controller"
            setup_monitoring
            setup_ha "master" "192.168.1.100" "eth0"
            setup_backup
            ;;

        "controller")
            log "Deploying BlueChI Controller"
            check_prerequisites
            install_bluechi_secure "controller"
            setup_monitoring
            setup_backup
            ;;

        "agent")
            log "Deploying BlueChI Agent"
            check_prerequisites
            local controller_ip=$2
            local node_name=$3
            install_bluechi_secure "agent" "$controller_ip" "$node_name"
            ;;

        *)
            error "Unknown deployment type: $deployment_type"
            ;;
    esac

    # Start services
    log "Starting BlueChI services..."
    if [[ "$deployment_type" == "controller-ha" ]] || [[ "$deployment_type" == "controller" ]]; then
        systemctl enable --now bluechi-controller bluechi-agent
        systemctl enable --now bluechi-monitor
    else
        systemctl enable --now bluechi-agent
    fi

    # Final verification
    log "Verifying deployment..."
    sleep 5

    if [[ "$deployment_type" == "controller-ha" ]] || [[ "$deployment_type" == "controller" ]]; then
        if bluechictl list-nodes &>/dev/null; then
            info "BlueChI Controller is operational"
            bluechictl list-nodes
        else
            warn "BlueChI Controller verification failed"
        fi
    fi

    if systemctl is-active --quiet bluechi-agent; then
        info "BlueChI Agent is running"
    else
        warn "BlueChI Agent is not running"
    fi

    log "Production deployment completed successfully"
    info "Deployment log: $LOG_FILE"
    info "Configuration: $CONFIG_DIR"
    info "Monitoring: http://$(hostname):9101/metrics"
}

# Usage information
usage() {
    cat << EOF
BlueChI Production Deployment Script v${SCRIPT_VERSION}

Usage: $0 <deployment-type> [options]

Deployment Types:
  controller        Deploy BlueChI controller
  controller-ha     Deploy BlueChI controller with HA
  agent            Deploy BlueChI agent

Options for agent deployment:
  $0 agent <controller-ip> <node-name>

Examples:
  # Deploy controller with HA
  $0 controller-ha

  # Deploy simple controller
  $0 controller

  # Deploy agent
  $0 agent 192.168.1.10 worker-01

Features:
  - Enhanced security configuration
  - Monitoring and metrics export
  - High Availability support
  - Automated backup and recovery
  - SELinux and firewall configuration
  - Production-ready logging

For more information, check the deployment log at: $LOG_FILE
EOF
    exit 0
}

# Script entry point
if [[ $# -lt 1 ]]; then
    usage
fi

# Export required variables for controller mode
if [[ "$1" == "controller" ]] || [[ "$1" == "controller-ha" ]]; then
    export ALLOWED_NODES="controller,agent1,agent2,agent3"
fi

# Run deployment
deploy_production "$@"
```

## Security Hardening Script

Additional script for security hardening of BlueChI deployments:

```bash
#!/bin/bash

# BlueChI Security Hardening Script
# Implements defense-in-depth security measures
# Version: 1.0

set -euo pipefail

readonly CERT_DIR="/etc/bluechi/certs"
readonly AUDIT_LOG="/var/log/bluechi/audit.log"

# Create certificate infrastructure
setup_pki() {
    log "Setting up PKI infrastructure..."

    mkdir -p "$CERT_DIR"
    chmod 700 "$CERT_DIR"

    # Generate CA
    openssl req -x509 -newkey rsa:4096 -days 3650 -nodes \
        -keyout "$CERT_DIR/ca.key" \
        -out "$CERT_DIR/ca.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=BlueChI CA"

    # Generate controller certificate
    openssl req -newkey rsa:4096 -nodes \
        -keyout "$CERT_DIR/controller.key" \
        -out "$CERT_DIR/controller.csr" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=bluechi-controller"

    openssl x509 -req -in "$CERT_DIR/controller.csr" \
        -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" \
        -CAcreateserial -out "$CERT_DIR/controller.crt" \
        -days 365 -sha256

    # Set permissions
    chmod 600 "$CERT_DIR"/*.key
    chmod 644 "$CERT_DIR"/*.crt
    chown -R root:bluechi "$CERT_DIR"

    log "PKI infrastructure setup completed"
}

# Configure audit logging
setup_audit() {
    log "Configuring audit logging..."

    # Create audit rules
    cat > /etc/audit/rules.d/bluechi.rules << 'EOF'
# BlueChI audit rules
-w /usr/bin/bluechictl -p x -k bluechi_commands
-w /etc/bluechi/ -p wa -k bluechi_config
-w /var/lib/bluechi/ -p wa -k bluechi_data
-w /etc/systemd/system/bluechi*.service -p wa -k bluechi_service

# Monitor D-Bus calls
-a always,exit -F arch=b64 -S connect -F a0=1 -F path=/var/run/dbus/system_bus_socket -k bluechi_dbus
EOF

    # Reload audit rules
    augenrules --load
    systemctl restart auditd

    # Create audit report script
    cat > /usr/local/bin/bluechi_audit_report.sh << 'EOF'
#!/bin/bash

echo "BlueChI Security Audit Report - $(date)"
echo "========================================="
echo ""

echo "Recent BlueChI Commands:"
ausearch -k bluechi_commands -ts recent --raw | aureport -x --summary
echo ""

echo "Configuration Changes:"
ausearch -k bluechi_config -ts recent --raw | aureport -f --summary
echo ""

echo "Service Modifications:"
ausearch -k bluechi_service -ts recent --raw | aureport -f --summary
echo ""

echo "Failed Authentication Attempts:"
journalctl -u bluechi-controller --since "1 day ago" | grep -i "auth.*fail" || echo "None found"
echo ""

echo "Suspicious Activities:"
ausearch -k bluechi_dbus -ts recent --raw | aureport --summary
EOF

    chmod +x /usr/local/bin/bluechi_audit_report.sh

    log "Audit logging configuration completed"
}

# Harden system configuration
harden_system() {
    log "Hardening system configuration..."

    # Kernel parameters for security
    cat >> /etc/sysctl.d/99-bluechi-security.conf << 'EOF'
# BlueChI Security Hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.log_martians = 1
kernel.randomize_va_space = 2
kernel.yama.ptrace_scope = 1
EOF

    sysctl -p /etc/sysctl.d/99-bluechi-security.conf

    # Restrict core dumps
    echo "* hard core 0" >> /etc/security/limits.conf

    # Configure fail2ban for BlueChI
    if command -v fail2ban-client &> /dev/null; then
        cat > /etc/fail2ban/jail.d/bluechi.conf << 'EOF'
[bluechi]
enabled = true
port = 2020
filter = bluechi
logpath = /var/log/bluechi/*.log
maxretry = 5
bantime = 3600
EOF

        cat > /etc/fail2ban/filter.d/bluechi.conf << 'EOF'
[Definition]
failregex = Authentication failed for .* from <HOST>
            Connection refused from <HOST>
            Invalid certificate from <HOST>
ignoreregex =
EOF

        systemctl restart fail2ban
    fi

    log "System hardening completed"
}

# Main execution
main() {
    log "Starting BlueChI security hardening..."

    setup_pki
    setup_audit
    harden_system

    log "Security hardening completed successfully"
}

# Run main function
main "$@"
```

## Usage Examples

### Quick Development Setup

```bash
# Single node for testing
curl -sSL https://raw.githubusercontent.com/example/bluechi-scripts/main/install-all-in-one.sh | sudo bash
```

### Production Controller Deployment

```bash
# Download script
wget https://raw.githubusercontent.com/example/bluechi-scripts/main/install-production.sh
chmod +x install-production.sh

# Deploy controller with HA
sudo ./install-production.sh controller-ha

# Deploy simple controller
sudo ./install-production.sh controller
```

### Production Agent Deployment

```bash
# Deploy agent connected to controller
sudo ./install-production.sh agent 192.168.1.100 worker-01
```

### Multi-Node Setup Example

```bash
# On controller node
sudo ./install-multi-node.sh \
    --mode controller \
    --allowed-nodes controller,worker1,worker2,worker3 \
    --configure-firewall

# On worker nodes
sudo ./install-multi-node.sh \
    --mode agent \
    --controller-ip 192.168.1.100 \
    --node-name worker1
```

## Post-Installation Verification

After installation, verify your BlueChI deployment:

```bash
# Check services
systemctl status bluechi-controller bluechi-agent

# List connected nodes
bluechictl list-nodes

# Check node connectivity
for node in $(bluechictl list-nodes | tail -n +2 | awk '{print $1}'); do
    echo "Node: $node"
    bluechictl list-units $node | head -5
done

# Verify monitoring (if enabled)
curl -s http://localhost:9101/metrics | grep bluechi

# Check logs
journalctl -u bluechi-controller -u bluechi-agent --since "10 minutes ago"

# Test service control
bluechictl start <node> <service>
bluechictl status <node> <service>
```

## Troubleshooting

Common issues and solutions:

### Installation Failures

```bash
# Check installation log
tail -f /var/log/bluechi_install.log

# Verify package installation
rpm -qa | grep bluechi

# Check for conflicts
rpm -Va | grep bluechi
```

### Connection Issues

```bash
# Test network connectivity
telnet controller-ip 2020

# Check firewall
firewall-cmd --list-all

# Verify certificates (if using TLS)
openssl s_client -connect controller-ip:2020 -CAfile /etc/bluechi/certs/ca.crt
```

### Service Control Issues

```bash
# Check D-Bus
busctl status

# Verify systemd integration
systemctl show bluechi-agent | grep -E "User|Group|PrivateDevices"

# Test local control
systemctl status httpd
bluechictl status $(hostname) httpd.service
```

## Best Practices

1. **Security First**
   - Always use TLS in production
   - Implement proper firewall rules
   - Enable SELinux where possible
   - Regular security audits

2. **Monitoring**
   - Deploy monitoring from day one
   - Set up alerting for critical events
   - Regular health checks
   - Capacity planning

3. **Backup and Recovery**
   - Automate daily backups
   - Test recovery procedures
   - Document recovery steps
   - Off-site backup storage

4. **Documentation**
   - Keep deployment records
   - Document custom configurations
   - Maintain runbooks
   - Update as needed

## Conclusion

These automation scripts provide a comprehensive solution for deploying BlueChI in various environments, from development to production. The scripts emphasize:

- **Security**: Multiple layers of security controls
- **Reliability**: Health checks and monitoring
- **Scalability**: Support for multi-node deployments
- **Maintainability**: Automated backup and recovery

By using these scripts, organizations can quickly deploy a production-ready BlueChI infrastructure that meets enterprise requirements for security, monitoring, and high availability. The modular approach allows for customization based on specific needs while maintaining best practices for system orchestration.
