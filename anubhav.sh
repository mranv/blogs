#!/bin/bash
#==============================================================================
# Script Name: xdr-installer.sh
# Description: Production-Ready Installer for OpenSearch XDR Stack
# Features:
#   - Robust certificate generation and management
#   - Secure configuration of OpenSearch
#   - Component installation (OpenSearch, Filebeat, Dashboards, XDR Manager)
#   - Service management with retry mechanisms
#   - Comprehensive error handling and logging
#   - Security hardening best practices
# Usage: ./xdr-installer.sh [--password=PASSWORD] [--debug] [--help]
# Author: THE BOYS | INFOPERCEPT
# Date: April 2025
#==============================================================================

#==============================================================================
# INITIALIZATION
#==============================================================================
set -euo pipefail  # Exit on error, undefined var, or pipe failure
shopt -s nullglob  # Handles empty globs gracefully

display_banner() {
 echo -e "\033[0;36m"
cat << "EOF"
██╗███╗   ██╗██╗   ██╗██╗███╗   ██╗███████╗███████╗███╗   ██╗███████╗███████╗
██║████╗  ██║██║   ██║██║████╗  ██║██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝
██║██╔██╗ ██║██║   ██║██║██╔██╗ ██║███████╗█████╗  ██╔██╗ ██║███████╗█████╗
██║██║╚██╗██║╚██╗ ██╔╝██║██║╚██╗██║╚════██║██╔══╝  ██║╚██╗██║╚════██║██╔══╝
██║██║ ╚████║ ╚████╔╝ ██║██║ ╚████║███████║███████╗██║ ╚████║███████║███████╗
╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝
███████╗██████╗ ██████╗     ██╗███╗   ██╗███████╗████████╗ █████╗ ██╗     ██╗
██╔════╝██╔══██╗██╔══██╗    ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██║     ██║
█████╗  ██║  ██║██████╔╝    ██║██╔██╗ ██║███████╗   ██║   ███████║██║     ██║
██╔══╝  ██║  ██║██╔══██╗    ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║     ██║
███████╗██████╔╝██║  ██║    ██║██║ ╚████║███████║   ██║   ██║  ██║███████╗███████╗
╚══════╝╚═════╝ ╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝
EOF
  echo -e "\033[0m"
  echo -e "\033[1;32m[ InvinSense EDR Platform Installer - Production Ready ]\033[0m"
  echo -e "\033[1;32m[ Version: 6.0.0 | Date: 12 June 2025 ]\033[0m"
  echo -e "\033[1;32m[ TF-Ready Deployment - Security Enhanced ]\033[0m"
  echo
}

#==============================================================================
# DEBUG CONFIGURATION
#==============================================================================
# Set DEBUG=true to enable verbose output
# This can also be enabled with --debug flag
DEBUG="${DEBUG:-false}"

# Debug logging function - only prints if DEBUG is true
debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "\033[0;34m[$(date '+%Y-%m-%d %H:%M:%S')] DEBUG: $1\033[0m"
    fi
}

#==============================================================================
# CONFIGURATION VARIABLES
#==============================================================================
# Authentication settings
# Set your custom admin password here (or leave blank to auto-generate)
CUSTOM_ADMIN_PASSWORD="${CUSTOM_ADMIN_PASSWORD:-}"

# Service settings
SERVICE_START_TIMEOUT=60  # Maximum seconds to wait for service to start
SERVICE_RETRY_COUNT=3     # Number of times to retry starting a service

# Package URLs - Where to download components from
OPENSEARCH_DEB_URL="https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.2/opensearch-2.19.2-linux-x64.deb"
FILEBEAT_DEB_URL="https://packages.wazuh.com/4.x/apt/pool/main/f/filebeat/filebeat-oss-7.10.2-amd64.deb"
DASHBOARDS_DEB_URL="http://192.168.3.91:1234/opensearch-dashboards_2.19.2_amd64.deb"
XDR_MANAGER_DEB_URL="http://192.168.3.91:1234/xdr-manager_4.12.0-0_amd64.deb"

# Certificate directories - Where certificates will be stored
CERT_TMP_PATH="/tmp/xdr-certificates"
CERTS_OUTPUT_DIR="/root/xdr-certificates"
INDEXER_CERT_DIR="/etc/opensearch/certs"
DASHBOARD_CERT_DIR="/etc/opensearch-dashboards/certs"
FILEBEAT_CERT_DIR="/etc/filebeat/certs"

# Certificate subject info - Used for generating certificates
NODE_NAME="siem.indexer"
DASHBOARD_NODE_NAME="dashboard"
ADMIN_NAME="admin"
ORGANIZATION="XDR Security"
COUNTRY="US"
LOCALITY="Ahmedabad"
ORG_UNIT="Security"

# OpenSearch configuration
OPENSEARCH_CONFIG="/etc/opensearch/opensearch.yml"
OPENSEARCH_DATA="/var/lib/opensearch"
OPENSEARCH_LOGS="/var/log/opensearch"

# OpenSearch Dashboards configuration
DASHBOARDS_CONFIG="/etc/opensearch-dashboards/opensearch_dashboards.yml"

# Log files
CERT_LOG_FILE="${CERT_TMP_PATH}/cert-generation.log"
INSTALL_LOG_FILE="/var/log/xdr-install.log"

#==============================================================================
# LOGGING FUNCTIONS
#==============================================================================
# Standard information log
log() {
    echo -e "\033[0;32m[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1\033[0m"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$INSTALL_LOG_FILE"
}

# Warning log
log_warn() {
    echo -e "\033[0;33m[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1\033[0m"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1" >> "$INSTALL_LOG_FILE"
}

# Error log
log_error() {
    echo -e "\033[0;31m[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$INSTALL_LOG_FILE"
}

# Debug log specific to certificate operations
log_debug() {
    debug "$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] DEBUG: $1" >> "${CERT_LOG_FILE}" 2>&1
}

#==============================================================================
# UTILITY FUNCTIONS
#==============================================================================
# Check if script is running as root
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "This script must be run as root."
        exit 1
    fi
}

# Parse command-line arguments for custom password and debug flag
parse_arguments() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --password=*)
                CUSTOM_ADMIN_PASSWORD="${1#*=}"
                ;;
            --password)
                if [ -n "$2" ] && [ "${2:0:1}" != "-" ]; then
                    CUSTOM_ADMIN_PASSWORD="$2"
                    shift
                else
                    log_error "Error: Argument for $1 is missing"
                    exit 1
                fi
                ;;
            --debug)
                DEBUG="true"
                ;;
            --help|--h|-h|-help)
                echo -e "\033[1;36m"
                echo "╔════════════════════════════════════════════════════════════════╗"
                echo "║             OpenSearch XDR Platform Installer Help              ║"
                echo "╚════════════════════════════════════════════════════════════════╝"
                echo -e "\033[0m"
                echo -e "\033[1;33mUsage: $0 [OPTIONS]\033[0m"
                echo
                echo -e "\033[1;32mOPTIONS:\033[0m"
                echo -e "  \033[1;37m--password=PASSWORD   \033[0m Set custom admin password"
                echo -e "  \033[1;37m--debug               \033[0m Enable debug output"
                echo -e "  \033[1;37m--help, -h            \033[0m Show this help message"
                echo
                echo -e "\033[1;32mExamples:\033[0m"
                echo -e "  \033[1;37m$0 --password=SecureP@ss123\033[0m      Set specific admin password"
                echo -e "  \033[1;37m$0 --debug\033[0m                      Install with debug information"
                echo
                exit 0
                ;;
            *)
                log_warn "Unknown option: $1"
                log_warn "Use --help or -h to see available options"
                ;;
        esac
        shift
    done

    # If no password was provided, auto-generate one
    # Safely reference the variable using parameter expansion to default to empty if unset.
    if [ -z "${OPENSEARCH_INITIAL_ADMIN_PASSWORD-}" ]; then
        # Generate one character from each required character group using OpenSSL.
        UPPER=$(openssl rand -base64 12 | tr -dc 'A-Z' | head -c 1)
        LOWER=$(openssl rand -base64 12 | tr -dc 'a-z' | head -c 1)
        DIGIT=$(openssl rand -base64 12 | tr -dc '0-9' | head -c 1)
        SPECIAL=$(openssl rand -base64 12 | tr -dc '!@#$%^&*()_+-=' | head -c 1)

        # Generate additional random characters to reach a total length of 12
        EXTRA=$(openssl rand -base64 12 | tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' | head -c 8)

        # Combine all parts.
        PASSWORD_RAW="${UPPER}${LOWER}${DIGIT}${SPECIAL}${EXTRA}"

        # Shuffle the combined password so that the positions of the required characters are random.
        CUSTOM_ADMIN_PASSWORD=$(echo "${PASSWORD_RAW}" | fold -w1 | shuf | tr -d '\n')

        # Warning: Avoid logging passwords in production environments.
        echo "No admin password provided. A password has been generated and set."
    else
        echo "Using provided admin password"
    fi


    # Ensure the password is at least 12 characters long
    if [ ${#CUSTOM_ADMIN_PASSWORD} -lt 12 ]; then
        log_error "Admin password must be at least 12 characters long"
        exit 1
    fi


    # Save the admin password to a file for reference
    echo "$CUSTOM_ADMIN_PASSWORD" > /root/.opensearch_admin_password
    chmod 600 /root/.opensearch_admin_password
}

#==============================================================================
# SECURITY FUNCTIONS
#==============================================================================
# Generate password hash using OpenSearch's native tool and fallbacks.
# This revised function tries three methods and aborts if no valid hash can be generated.
generate_opensearch_hash() {
    local password="$1"
    local hash_output=""

    # 1. Try using OpenSearch's hash.sh tool, if available.
    if [ -f "/usr/share/opensearch/plugins/opensearch-security/tools/hash.sh" ]; then
        hash_output=$(/usr/share/opensearch/plugins/opensearch-security/tools/hash.sh -p "$password" 2>/dev/null)
        if [[ "$hash_output" =~ ^\$2a\$ ]]; then
            echo "$hash_output"
            return 0
        else
            debug "hash.sh output is invalid: $hash_output"
        fi
    fi

    # 2. Try using htpasswd.
    if command -v htpasswd >/dev/null 2>&1; then
        hash_output=$(htpasswd -bnBC 10 "" "$password" | tr -d ':\n' | sed "s/\$2y/\$2a/")
        if [[ "$hash_output" =~ ^\$2a\$ ]]; then
            echo "$hash_output"
            return 0
        else
            debug "htpasswd output is invalid: $hash_output"
        fi
    fi

    # 3. Try using mkpasswd (from the whois package).
    if command -v mkpasswd >/dev/null 2>&1; then
        hash_output=$(mkpasswd -m bcrypt "$password" 2>/dev/null)
        hash_output=$(echo "$hash_output" | sed "s/\$2y/\$2a/")
        if [[ "$hash_output" =~ ^\$2a\$ ]]; then
            echo "$hash_output"
            return 0
        else
            debug "mkpasswd output is invalid: $hash_output"
        fi
    fi

    # Fallback: Use a well-known default admin password ("admin") if none of the above produced a valid hash.
    local default_password="admin"
    log_warn "Failed to generate a valid bcrypt hash for the provided admin password. Falling back to the well-known default admin password: '$default_password'."
    hash_output=$(htpasswd -bnBC 10 "" "$default_password" | tr -d ':\n' | sed "s/\$2y/\$2a/")
    if [[ "$hash_output" =~ ^\$2a\$ ]]; then
        echo "$hash_output"
        return 0
    else
        log_error "Fallback hash generation also failed. Aborting."
        exit 1
    fi
}




# Verify OpenSearch API is accessible with correct credentials
verify_opensearch_api() {
    local max_attempts=30
    local attempt=1
    local wait_time=10

    log "Verifying OpenSearch API accessibility..."

    while [ $attempt -le $max_attempts ]; do
        # Check if the API responds with a status field
        if curl -ks -u "admin:${CUSTOM_ADMIN_PASSWORD}" "https://localhost:9200/_cluster/health" | grep -q '"status"'; then
            log "OpenSearch API is accessible"
            return 0
        fi
        log "Attempt $attempt/$max_attempts: OpenSearch API not yet accessible, waiting ${wait_time}s..."
        sleep $wait_time
        attempt=$((attempt + 1))
    done

    log_error "OpenSearch API failed to become accessible after $max_attempts attempts"
    return 1
}

# Update the internal_users.yml file with proper format and admin password
update_internal_users_yml() {
    local custom_password="$1"
    local internal_users_file="/etc/opensearch/opensearch-security/internal_users.yml"
    local backup_file="${internal_users_file}.bak.$(date +%Y%m%d%H%M%S)"

    log "Creating or updating ${internal_users_file} with proper format..."

    # Create backup if file exists.
    if [ -f "$internal_users_file" ]; then
        cp "$internal_users_file" "$backup_file"
        log "Backup created at ${backup_file}"
    fi

    # Generate password hash (this function will exit if no valid hash is produced).
    local password_hash
    password_hash=$(generate_opensearch_hash "$custom_password")

    # Verify the hash.
    if [[ ! "$password_hash" =~ ^\$2a\$ ]]; then
        log_error "Generated hash doesn't look like a valid bcrypt hash. Aborting."
        exit 1
    fi

    # Write the configuration file.
    cat > "$internal_users_file" <<EOF
---
# This is the internal user database.
# The hash value is a bcrypt hash generated using one of the approved methods.

_meta:
  type: "internalusers"
  config_version: 2

admin:
  hash: "$password_hash"
  reserved: true
  backend_roles:
    - "admin"
  description: "Demo admin user"

anomalyadmin:
  hash: "$password_hash"
  reserved: false
  opendistro_security_roles:
    - "anomaly_full_access"
  description: "Demo anomaly admin user, using internal role"

kibanaserver:
  hash: "$password_hash"
  reserved: true
  description: "Demo OpenSearch Dashboards user"

kibanaro:
  hash: "$password_hash"
  reserved: false
  backend_roles:
    - "kibanauser"
    - "readall"
  attributes:
    attribute1: "value1"
    attribute2: "value2"
    attribute3: "value3"
  description: "Demo OpenSearch Dashboards read only user, using external role mapping"

logstash:
  hash: "$password_hash"
  reserved: false
  backend_roles:
    - "logstash"
  description: "Demo logstash user, using external role mapping"

readall:
  hash: "$password_hash"
  reserved: false
  backend_roles:
    - "readall"
  description: "Demo readall user, using external role mapping"

snapshotrestore:
  hash: "$password_hash"
  reserved: false
  backend_roles:
    - "snapshotrestore"
  description: "Demo snapshotrestore user, using external role mapping"
EOF

    chmod 600 "$internal_users_file"
    if getent passwd opensearch >/dev/null; then
        chown opensearch:opensearch "$internal_users_file"
    fi

    log "Successfully created ${internal_users_file} with updated passwords."

    # Save the admin password for reference.
    echo "$custom_password" > /root/.opensearch_admin_password
    chmod 600 /root/.opensearch_admin_password

    return 0
}

# Run the securityadmin.sh tool to apply security settings
run_security_admin() {
    log "Running OpenSearch security admin tool with enhanced error handling..."

    # Check required certificates
    local capem="$INDEXER_CERT_DIR/root-ca.pem"
    local adminpem="$INDEXER_CERT_DIR/admin.pem"
    local adminkey="$INDEXER_CERT_DIR/admin-key.pem"

    # Verify certificate files exist
    for cert_file in "$capem" "$adminpem" "$adminkey"; do
        if [ ! -f "$cert_file" ]; then
            log_error "Required certificate file not found: $cert_file"
            return 1
        fi
    done

    # Wait for OpenSearch to be ready (longer timeout)
    log "Waiting for OpenSearch to be fully operational..."
    local retries=60
    while [ $retries -gt 0 ]; do
        if curl -sk "https://localhost:9200/_cat/nodes" >/dev/null 2>&1; then
            log "OpenSearch is responsive, proceeding with security admin"
            break
        fi
        retries=$((retries-1))
        if [ $retries -gt 0 ]; then
            log "Waiting for OpenSearch to become available ($retries attempts left)..."
            sleep 5
        fi
    done

    if [ $retries -eq 0 ]; then
        log_error "OpenSearch did not become available in time"
        return 1
    fi

    # Set proper Java environment
    export JAVA_HOME=/usr/share/opensearch/jdk
    export PATH=$JAVA_HOME/bin:$PATH
    export OPENSEARCH_JAVA_HOME=$JAVA_HOME

    # Get local IP for connection
    local SERVER_IP
    SERVER_IP=$(hostname -I | awk '{print $1}')

    # Run securityadmin.sh with multiple attempts
    local max_attempts=5
    local attempt=1
    local success=false

    while [ $attempt -le $max_attempts ] && [ "$success" = "false" ]; do
        log "Running security admin attempt $attempt of $max_attempts..."

        # Execute securityadmin.sh with comprehensive options
        local output
        output=$(OPENSEARCH_JAVA_HOME=$JAVA_HOME \
                 /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
                 -cd /etc/opensearch/opensearch-security/ \
                 -icl -nhnv \
                 -cacert "$capem" \
                 -cert "$adminpem" \
                 -key "$adminkey" \
                 -h localhost -p 9200 2>&1)

        local status=$?

        if [ $status -eq 0 ]; then
            log "Security admin executed successfully!"
            success=true
        else
            log_warn "Security admin failed (attempt $attempt):"
            echo "$output" >> "/var/log/opensearch-security-admin.log"

            # Check why it might have failed
            if echo "$output" | grep -q "Connection refused"; then
                log "Connection to OpenSearch refused. Checking service status..."
                systemctl status opensearch || true
            elif echo "$output" | grep -q "certificate problem"; then
                log_error "Certificate issue detected. Verify certificate paths and permissions"
                ls -la "/etc/opensearch/certs/" || true
            fi

            attempt=$((attempt + 1))
            if [ $attempt -le $max_attempts ]; then
                log "Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
    done

    if [ "$success" = "true" ]; then
        log "Security configuration applied successfully"
        return 0
    else
        log_error "Failed to apply security configuration after $max_attempts attempts"
        log_error "Check detailed logs at /var/log/opensearch-security-admin.log"
        return 1
    fi
}

# Initialize OpenSearch Security with enhanced error handling and fallbacks
initialize_opensearch_security() {
    log "Initializing OpenSearch Security..."

    # First, directly create a properly formatted internal_users.yml
    if ! update_internal_users_yml "$CUSTOM_ADMIN_PASSWORD"; then
        log_error "Failed to create internal_users.yml"
        return 1
    fi

    # Make sure certificates have proper permissions
    log "Setting secure permissions for certificates..."
    chmod 600 "$INDEXER_CERT_DIR"/admin-key.pem
    chmod 644 "$INDEXER_CERT_DIR"/admin.pem
    chmod 644 "$INDEXER_CERT_DIR"/root-ca.pem

    if getent passwd opensearch >/dev/null; then
        chown -R opensearch:opensearch "$INDEXER_CERT_DIR"
    fi

    # Run security admin tool
    if ! run_security_admin; then
        log_error "Initial security admin tool run failed"

        # Try alternative approach with simpler arguments
        log "Trying simplified security admin approach..."
        export JAVA_HOME=/usr/share/opensearch/jdk
        export PATH=$JAVA_HOME/bin:$PATH

        if ! /usr/share/opensearch/plugins/opensearch-security/tools/securityadmin.sh \
            -cd /etc/opensearch/opensearch-security/ \
            -icl -nhnv \
            -cacert "$INDEXER_CERT_DIR/root-ca.pem" \
            -cert "$INDEXER_CERT_DIR/admin.pem" \
            -key "$INDEXER_CERT_DIR/admin-key.pem" \
            -h localhost; then
            log_error "Security admin failed even with simplified approach"
            return 1
        fi
    fi

    # Display the password information
    log "Admin password set to: $CUSTOM_ADMIN_PASSWORD"

    log "OpenSearch security initialized successfully."
    return 0
}

# Function to set optimal JVM heap size for OpenSearch
set_jvm_options() {
    log "Setting optimal JVM heap size for OpenSearch..."

    # Get total system memory in KB and convert to GB
    local total_mem_kb
    total_mem_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')

    local total_mem_gb=$((total_mem_kb / 1024 / 1024))

    # Calculate heap size (50% of total memory)
    local heap_size=$((total_mem_gb / 2))

    # Enforce minimum heap size of 1GB
    if [ "$heap_size" -lt 1 ]; then
        heap_size=1
        log "System memory is very low. Setting minimum heap size of 1GB."
    fi

    # Cap maximum heap size at 32GB (OpenSearch best practice)
    if [ "$heap_size" -gt 32 ]; then
        heap_size=32
        log "System has large memory. Capping heap size at 32GB (OpenSearch best practice)."
    fi

    # Display system information
    log "System memory information:"
    log "Total system memory: ${total_mem_gb}GB"
    log "Calculated heap size: ${heap_size}GB"

    # Make a backup of the original jvm.options file
    cp /etc/opensearch/jvm.options /etc/opensearch/jvm.options.bak.$(date +%Y%m%d%H%M%S)
    log "Backup created at /etc/opensearch/jvm.options.bak.$(date +%Y%m%d%H%M%S)"

    # Remove any files in jvm.options.d/ to avoid conflicts
    rm -f /etc/opensearch/jvm.options.d/memory.options

    # Directly modify the heap settings in the main jvm.options file
    sed -i "s/-Xms[0-9]\+[mg]/-Xms${heap_size}g/" /etc/opensearch/jvm.options
    sed -i "s/-Xmx[0-9]\+[mg]/-Xmx${heap_size}g/" /etc/opensearch/jvm.options

    # Also handle commented-out versions that might exist
    sed -i "s/-#Xms[0-9]\+[mg]/-Xms${heap_size}g/" /etc/opensearch/jvm.options
    sed -i "s/-#Xmx[0-9]\+[mg]/-Xmx${heap_size}g/" /etc/opensearch/jvm.options

    # Set proper permissions for the modified file
    chown opensearch:opensearch /etc/opensearch/jvm.options
    chmod 644 /etc/opensearch/jvm.options

    log "JVM heap size set directly in main jvm.options file to ${heap_size}GB (Xms${heap_size}g/Xmx${heap_size}g)"
    log "For these changes to take effect, restart OpenSearch with: systemctl restart opensearch"

    return 0
}

#==============================================================================
# CERTIFICATE MANAGEMENT FUNCTIONS
#==============================================================================

# Check if any existing certificates are present
check_existing_certificates() {
    local certs_exist=false
    log "Checking for existing certificates..."

    # Check all certificate directories
    for dir in "${CERT_TMP_PATH}" "${CERTS_OUTPUT_DIR}" "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}"; do
        if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
            log "Found existing certificates in $dir"
            certs_exist=true
        fi
    done

    if [[ "$certs_exist" = true ]]; then
        return 0
    else
        return 1
    fi
}

# Clean up any existing certificates before generating new ones
cleanup_existing_certificates() {
    log "Cleaning up existing certificates..."

    # Remove certificates from all directories
    for dir in "${CERT_TMP_PATH}" "${CERTS_OUTPUT_DIR}" "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}"; do
        if [ -d "$dir" ]; then
            log "Removing certificate files from $dir"
            rm -f "$dir"/*.pem "$dir"/*.key "$dir"/*.pfx "$dir"/*.b64 "$dir"/*.p12 "$dir"/*.jks 2>/dev/null
            rm -f "$dir"/pfx_passwords.txt "$dir"/xdr-certificates.tar "$dir"/cert-generation.log 2>/dev/null
        fi
    done

    # Recreate empty directories if they don't exist
    for dir in "${CERT_TMP_PATH}" "${CERTS_OUTPUT_DIR}"; do
        mkdir -p "$dir"
    done

    log "Certificate cleanup completed."
}

# Execute and validate certificate generation commands
cert_execute_and_validate() {
    local command="$1"
    log_debug "Executing: $command"

    local command_output
    command_output=$(eval "$command" 2>&1)
    local e_code=$?

    if [ "${e_code}" -ne 0 ]; then
        log_error "Error generating certificates."
        log_debug "Error executing command: $command"
        log_debug "Error output: ${command_output}"
        cleanup_existing_certificates
        exit 1
    fi

    return 0
}

# Clean temporary certificate files
cert_clean_files() {
    log_debug "Cleaning certificate files."
    # Remove temporary files created during certificate generation
    rm -f "${CERT_TMP_PATH}"/*.csr "${CERT_TMP_PATH}"/*.srl "${CERT_TMP_PATH}"/*.conf
    rm -f "${CERT_TMP_PATH}"/*-temp.pem
}

# Generate Root CA certificate
generate_root_ca() {
    log "Generating the root certificate..."

    # Create template file for root CA
    cat > "${CERT_TMP_PATH}/root-ca.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "XDR Root CA"
    },
    "keyUsage": ["certSign", "crlSign"],
    "basicConstraints": {
        "isCA": true,
        "maxPathLen": 0
    }
}
EOF

    # Generate the root CA certificate and key
    cert_execute_and_validate "step certificate create \
        --template ${CERT_TMP_PATH}/root-ca.tpl \
        'XDR Root CA' \
        ${CERT_TMP_PATH}/root-ca.pem \
        ${CERT_TMP_PATH}/root-ca.key \
        --no-password \
        --insecure \
        --not-after=87600h \
        --kty=RSA \
        --size=2048"

    # Clean up template
    rm -f "${CERT_TMP_PATH}/root-ca.tpl"

    # Verify the certificate was created
    if [[ ! -f "${CERT_TMP_PATH}/root-ca.pem" || ! -f "${CERT_TMP_PATH}/root-ca.key" ]]; then
        log_error "Failed to generate root CA certificate files"
        return 1
    fi

    # Set appropriate permissions
    chmod 644 "${CERT_TMP_PATH}/root-ca.pem"
    chmod 600 "${CERT_TMP_PATH}/root-ca.key"

    log_debug "Root CA certificate generated successfully"
    return 0
}

# Generate admin certificate
generate_admin_certificate() {
    log "Generating Admin certificate..."

    # Create template file for admin
    cat > "${CERT_TMP_PATH}/admin.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "${ADMIN_NAME}"
    },
    "keyUsage": ["digitalSignature", "keyEncipherment"],
    "extKeyUsage": ["clientAuth", "serverAuth"],
    "basicConstraints": {
        "isCA": false
    }
}
EOF

    # Generate the admin certificate and key
    cert_execute_and_validate "step certificate create \
        --template ${CERT_TMP_PATH}/admin.tpl \
        ${ADMIN_NAME} \
        ${CERT_TMP_PATH}/admin.pem \
        ${CERT_TMP_PATH}/admin-key.pem \
        --ca ${CERT_TMP_PATH}/root-ca.pem \
        --ca-key ${CERT_TMP_PATH}/root-ca.key \
        --no-password \
        --insecure \
        --not-after=87600h \
        --kty=RSA \
        --size=2048"

    # Clean up template
    rm -f "${CERT_TMP_PATH}/admin.tpl"

    # Verify the certificate was created
    if [[ ! -f "${CERT_TMP_PATH}/admin.pem" || ! -f "${CERT_TMP_PATH}/admin-key.pem" ]]; then
        log_error "Failed to generate admin certificate files"
        return 1
    fi

    log_debug "Admin certificate generated successfully"
    return 0
}

# Generate certificate with Subject Alternative Names (SANs)
generate_certificate_with_sans() {
    local name="$1"
    local ip="$2"
    local additional_sans="${3:-}"

    log "Generating certificate for ${name}..."

    # Build JSON template with SANs
    cat > "${CERT_TMP_PATH}/${name}.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "${name}"
    },
    "sans": [
        {"type": "dns", "value": "localhost"},
        {"type": "dns", "value": "${name}"},
        {"type": "ip", "value": "127.0.0.1"},
        {"type": "ip", "value": "${ip}"}
        ${additional_sans}
    ],
    "keyUsage": ["digitalSignature", "keyEncipherment"],
    "extKeyUsage": ["serverAuth", "clientAuth"],
    "basicConstraints": {
        "isCA": false
    }
}
EOF

    # Generate the certificate and key
    cert_execute_and_validate "step certificate create \
        --template ${CERT_TMP_PATH}/${name}.tpl \
        ${name} \
        ${CERT_TMP_PATH}/${name}.pem \
        ${CERT_TMP_PATH}/${name}-key.pem \
        --ca ${CERT_TMP_PATH}/root-ca.pem \
        --ca-key ${CERT_TMP_PATH}/root-ca.key \
        --no-password \
        --insecure \
        --not-after=87600h \
        --kty=RSA \
        --size=2048"

    # Clean up template
    rm -f "${CERT_TMP_PATH}/${name}.tpl"

    # Verify the certificate was created
    if [[ ! -f "${CERT_TMP_PATH}/${name}.pem" || ! -f "${CERT_TMP_PATH}/${name}-key.pem" ]]; then
        log_error "Failed to generate certificate files for ${name}"
        return 1
    fi

    log_debug "Certificate for ${name} generated successfully"
    return 0
}

# Generate PFX certificate for API nodes
generate_pfx_certificate() {
    local name="$1"
    local ip="$2"

    log "Generating PFX certificate for ${name}..."

    # First generate the standard certificate
    generate_certificate_with_sans "${name}" "${ip}"

    # Generate random password for PFX
    local pfx_password
    pfx_password=$(openssl rand -base64 16)

    # Create PFX certificate
    log_debug "Creating PFX certificate for ${name}"
    if ! openssl pkcs12 -export \
        -out "${CERT_TMP_PATH}/${name}.pfx" \
        -inkey "${CERT_TMP_PATH}/${name}-key.pem" \
        -in "${CERT_TMP_PATH}/${name}.pem" \
        -certfile "${CERT_TMP_PATH}/root-ca.pem" \
        -password "pass:${pfx_password}" > /dev/null 2>&1; then

        log_error "Error creating PFX certificate for ${name}"
        cleanup_existing_certificates
        exit 1
    fi

    # Convert PFX to base64
    log_debug "Converting PFX certificate to Base64 format for ${name}"
    if ! base64 "${CERT_TMP_PATH}/${name}.pfx" > "${CERT_TMP_PATH}/${name}.pfx.b64"; then
        log_error "Error converting PFX certificate to Base64 for ${name}"
        cleanup_existing_certificates
        exit 1
    fi

    # Store password in the password file
    echo "${name}:${pfx_password}" >> "${CERT_TMP_PATH}/pfx_passwords.txt"

    # Set appropriate permissions for the PFX files
    chmod 600 "${CERT_TMP_PATH}/${name}.pfx.b64"

    # Remove the original PFX file after creating the base64 version
    log_debug "Removing original PFX file for ${name}"
    rm -f "${CERT_TMP_PATH}/${name}.pfx"

    log "Generated PFX certificate for ${name} with random password (Base64 version created)"
    return 0
}

# Main certificate generation function
# Uses Step CLI to generate all necessary certificates
generate_certificates() {
    log "Starting certificate generation with Step CLI..."

    # Check for existing certificates and clean them up
    if check_existing_certificates; then
        log_warn "Existing certificates found. These will be removed before generating new ones."
        cleanup_existing_certificates
    fi

    # Install Step CLI if not already installed
    if ! command -v step &>/dev/null; then
        log "Installing Step CLI..."
        apt-get update && apt-get install -y wget tar unzip apache2-utils whois
        wget -q https://dl.smallstep.com/gh-release/cli/gh-release-header/v0.28.2/step_linux_0.28.2_amd64.tar.gz
        tar -xzf step_linux_0.28.2_amd64.tar.gz
        cp step_0.28.2/bin/step /usr/local/bin/
        chmod +x /usr/local/bin/step
        rm -rf step_linux_0.28.2_amd64.tar.gz step_0.28.2
        log "Step CLI installed."
    fi

    # Get the server IP address
    local SERVER_IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    log "Using server IP: ${SERVER_IP}"

    # Create certificate directories
    mkdir -p "${CERT_TMP_PATH}"
    mkdir -p "${CERTS_OUTPUT_DIR}"
    mkdir -p "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}"

    # Initialize the log file
    echo "Certificate Generation Log - $(date)" > "${CERT_LOG_FILE}"

    # Generate Root CA with Step CLI
    log "Generating Root CA certificate..."
    cat > "${CERT_TMP_PATH}/root-ca.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "XDR Root CA"
    },
    "keyUsage": ["certSign", "crlSign"],
    "basicConstraints": {
        "isCA": true,
        "maxPathLen": 0
    }
}
EOF

    step certificate create \
        --template "${CERT_TMP_PATH}/root-ca.tpl" \
        'XDR Root CA' \
        "${CERT_TMP_PATH}/root-ca.pem" \
        "${CERT_TMP_PATH}/root-ca-key.pem" \
        --no-password \
        --insecure \
        --not-after=87600h \
        --kty=RSA \
        --size=2048

    # Generate certificates for each component using Step CLI
    for component in "${ADMIN_NAME}" "${NODE_NAME}" "${DASHBOARD_NODE_NAME}"; do
        log "Generating certificate for ${component}..."

        # Define SANs for the certificate
        local sans=""
        if [ "${component}" != "${ADMIN_NAME}" ]; then
            sans=$(cat <<EOF
    "sans": [
        {"type": "dns", "value": "localhost"},
        {"type": "dns", "value": "${component}"},
        {"type": "ip", "value": "127.0.0.1"},
        {"type": "ip", "value": "${SERVER_IP}"}
    ],
EOF
        )
        fi

        # Create template for the certificate
        cat > "${CERT_TMP_PATH}/${component}.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "${component}"
    },
${sans}
    "keyUsage": ["digitalSignature", "keyEncipherment"],
    "extKeyUsage": ["serverAuth", "clientAuth"],
    "basicConstraints": {
        "isCA": false
    }
}
EOF

        # Generate the certificate with Step CLI
        step certificate create \
            --template "${CERT_TMP_PATH}/${component}.tpl" \
            "${component}" \
            "${CERT_TMP_PATH}/${component}.pem" \
            "${CERT_TMP_PATH}/${component}-step-key.pem" \
            --ca "${CERT_TMP_PATH}/root-ca.pem" \
            --ca-key "${CERT_TMP_PATH}/root-ca-key.pem" \
            --no-password \
            --insecure \
            --not-after=87600h \
            --kty=RSA \
            --size=2048

        # Convert the private key to PKCS#8 PEM format that OpenSearch can read
        openssl pkcs8 -topk8 -inform PEM -in "${CERT_TMP_PATH}/${component}-step-key.pem" \
            -outform PEM -out "${CERT_TMP_PATH}/${component}-key.pem" -nocrypt

        # Verify the certificate
        openssl x509 -in "${CERT_TMP_PATH}/${component}.pem" -text -noout >> "${CERT_LOG_FILE}" 2>&1
    done

    # Generate Filebeat certificate (using the admin cert)
    log "Using admin certificate for Filebeat..."
    cp "${CERT_TMP_PATH}/admin.pem" "${CERT_TMP_PATH}/filebeat.pem"
    cp "${CERT_TMP_PATH}/admin-key.pem" "${CERT_TMP_PATH}/filebeat-key.pem"

    # Generate API certificate
    log "Generating API certificate..."
    cat > "${CERT_TMP_PATH}/api.tpl" <<EOF
{
    "subject": {
        "country": "${COUNTRY}",
        "organization": "${ORGANIZATION}",
        "organizationalUnit": "${ORG_UNIT}",
        "locality": "${LOCALITY}",
        "commonName": "api"
    },
    "sans": [
        {"type": "dns", "value": "localhost"},
        {"type": "dns", "value": "api"},
        {"type": "ip", "value": "127.0.0.1"},
        {"type": "ip", "value": "${SERVER_IP}"}
    ],
    "keyUsage": ["digitalSignature", "keyEncipherment"],
    "extKeyUsage": ["serverAuth", "clientAuth"],
    "basicConstraints": {
        "isCA": false
    }
}
EOF

    step certificate create \
        --template "${CERT_TMP_PATH}/api.tpl" \
        "api" \
        "${CERT_TMP_PATH}/api.pem" \
        "${CERT_TMP_PATH}/api-step-key.pem" \
        --ca "${CERT_TMP_PATH}/root-ca.pem" \
        --ca-key "${CERT_TMP_PATH}/root-ca-key.pem" \
        --no-password \
        --insecure \
        --not-after=87600h \
        --kty=RSA \
        --size=2048

    # Convert the API private key to PKCS#8 PEM format
    openssl pkcs8 -topk8 -inform PEM -in "${CERT_TMP_PATH}/api-step-key.pem" \
        -outform PEM -out "${CERT_TMP_PATH}/api-key.pem" -nocrypt

    # Create PFX certificate for API
    local pfx_password
    pfx_password=$(openssl rand -base64 16)

    if ! openssl pkcs12 -export -out "${CERT_TMP_PATH}/api.pfx" \
        -inkey "${CERT_TMP_PATH}/api-key.pem" -in "${CERT_TMP_PATH}/api.pem" \
        -certfile "${CERT_TMP_PATH}/root-ca.pem" -password "pass:${pfx_password}"; then
        log_error "Failed to create PFX certificate for API"
        exit 1
    fi

    # Convert PFX to base64
    if ! base64 "${CERT_TMP_PATH}/api.pfx" > "${CERT_TMP_PATH}/api.pfx.b64"; then
        log_error "Failed to convert PFX to base64"
        exit 1
    fi

    # Store password in the password file
    echo "api:${pfx_password}" > "${CERT_TMP_PATH}/pfx_passwords.txt"
    chmod 600 "${CERT_TMP_PATH}/pfx_passwords.txt"

    # Remove the original PFX file
    rm -f "${CERT_TMP_PATH}/api.pfx"

    # Copy certificates to component directories
    log "Deploying certificates to component directories..."

    # For OpenSearch (Indexer)
    cp "${CERT_TMP_PATH}/root-ca.pem" "${INDEXER_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/${NODE_NAME}.pem" "${INDEXER_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/${NODE_NAME}-key.pem" "${INDEXER_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/admin.pem" "${INDEXER_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/admin-key.pem" "${INDEXER_CERT_DIR}/"

    # For Dashboards
    cp "${CERT_TMP_PATH}/root-ca.pem" "${DASHBOARD_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/${DASHBOARD_NODE_NAME}.pem" "${DASHBOARD_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/${DASHBOARD_NODE_NAME}-key.pem" "${DASHBOARD_CERT_DIR}/"

    # For Filebeat
    cp "${CERT_TMP_PATH}/root-ca.pem" "${FILEBEAT_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/filebeat.pem" "${FILEBEAT_CERT_DIR}/"
    cp "${CERT_TMP_PATH}/filebeat-key.pem" "${FILEBEAT_CERT_DIR}/"

    # Create a consolidated archive for Filebeat deployment
    log "Creating xdr-certificates.tar archive for Filebeat deployment..."
    (cd "${CERT_TMP_PATH}" && tar -cf xdr-certificates.tar root-ca.pem admin.pem admin-key.pem)
    if [ -f "${CERT_TMP_PATH}/xdr-certificates.tar" ]; then
        cp "${CERT_TMP_PATH}/xdr-certificates.tar" "${CERTS_OUTPUT_DIR}/"
    fi

    # Copy all certificates to the output directory for backup
    cp -r "${CERT_TMP_PATH}"/* "${CERTS_OUTPUT_DIR}/" 2>/dev/null

    # Set appropriate permissions
    fix_cert_permissions

    # Clean up temporary files
    rm -f "${CERT_TMP_PATH}"/*.tpl "${CERT_TMP_PATH}"/*-step-key.pem

    log "Certificate generation complete. All certificates saved to ${CERTS_OUTPUT_DIR}"
}

# Fix certificate permissions with enhanced security and error handling
fix_cert_permissions() {
    log "Setting secure permissions for certificates..."

    # Ensure directory permissions are strict
    for dir in "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}" "${CERTS_OUTPUT_DIR}"; do
        if [ -d "$dir" ]; then
            if ! chmod 700 "$dir"; then
                log_error "Failed to set permissions on $dir"
            fi
        else
            log_error "Directory $dir does not exist. Cannot set permissions."
        fi
    done

    # Set individual file permissions with error handling
    # Private keys should be read-only by owner
    if ! find "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}" "${CERTS_OUTPUT_DIR}" \
        -type f \( -name "*-key.pem" -o -name "*.key" \) -exec chmod 400 {} \; 2>/dev/null; then
        log_error "Failed to set permissions for private key files"
    fi

    # Certificates can be read by group
    if ! find "${INDEXER_CERT_DIR}" "${DASHBOARD_CERT_DIR}" "${FILEBEAT_CERT_DIR}" "${CERTS_OUTPUT_DIR}" \
        -type f -name "*.pem" -not -name "*-key.pem" -exec chmod 440 {} \; 2>/dev/null; then
        log_error "Failed to set permissions for certificate files"
    fi

    # PFX files should be read-only by owner
    if ! find "${CERTS_OUTPUT_DIR}" -type f -name "*.pfx.b64" -exec chmod 400 {} \; 2>/dev/null; then
        log_warn "No PFX files found or failed to set permissions"
    fi

    # Set ownership with error handling
    if getent passwd opensearch >/dev/null; then
        if ! chown -R opensearch:opensearch "${INDEXER_CERT_DIR}" 2>/dev/null; then
            log_error "Failed to set ownership for ${INDEXER_CERT_DIR}"
        fi
    else
        log_warn "User 'opensearch' does not exist. Not changing ownership for ${INDEXER_CERT_DIR}"
    fi

    if getent passwd opensearch-dashboards >/dev/null; then
        if ! chown -R opensearch-dashboards:opensearch-dashboards "${DASHBOARD_CERT_DIR}" 2>/dev/null; then
            log_error "Failed to set ownership for ${DASHBOARD_CERT_DIR}"
        fi
    else
        log_warn "User 'opensearch-dashboards' does not exist. Not changing ownership for ${DASHBOARD_CERT_DIR}"
    fi

    if ! chown -R root:root "${FILEBEAT_CERT_DIR}" 2>/dev/null; then
        log_error "Failed to set ownership for ${FILEBEAT_CERT_DIR}"
    fi

    log "Certificate permissions set securely."
}

#==============================================================================
# INSTALLATION FUNCTIONS
#==============================================================================

# Install prerequisites packages and system configuration
install_prerequisites() {
    log "Installing prerequisites..."
    apt-get update
    apt-get install -y curl wget tar gnupg apt-transport-https openssl jq unzip openjdk-11-jre-headless apache2-utils whois

    # Set system limits for OpenSearch
    cat > /etc/security/limits.d/30-opensearch.conf <<EOF
opensearch soft nofile 65535
opensearch hard nofile 65535
opensearch soft nproc 4096
opensearch hard nproc 4096
opensearch soft memlock unlimited
opensearch hard memlock unlimited
EOF

    # Set vm.max_map_count for OpenSearch
    cat > /etc/sysctl.d/30-opensearch.conf <<EOF
vm.max_map_count = 262144
EOF
    sysctl -p /etc/sysctl.d/30-opensearch.conf
    log "Prerequisites installed."
}

# Install OpenSearch package
install_opensearch() {
    log "Downloading OpenSearch package..."
    if [ ! -f "$(basename "$OPENSEARCH_DEB_URL")" ]; then
        curl -SLO "$OPENSEARCH_DEB_URL"
    else
        log "OpenSearch package already downloaded, using existing file."
    fi

    log "Installing OpenSearch..."
    # Export the password as an environment variable for OpenSearch
    export OPENSEARCH_INITIAL_ADMIN_PASSWORD="$CUSTOM_ADMIN_PASSWORD"

    if ! dpkg -i "$(basename "$OPENSEARCH_DEB_URL")"; then
        log "Fixing dependencies..."
        apt-get install -f -y
    fi

    log "OpenSearch installed (not started)."
}

# Install Filebeat package
install_filebeat() {
    log "Downloading Filebeat package..."
    if [ ! -f "$(basename "$FILEBEAT_DEB_URL")" ]; then
        curl -SLO "$FILEBEAT_DEB_URL"
    else
        log "Filebeat package already downloaded, using existing file."
    fi

    log "Installing Filebeat..."
    if ! dpkg -i "$(basename "$FILEBEAT_DEB_URL")"; then
        log "Fixing dependencies..."
        apt-get install -f -y
    fi

    log "Filebeat installed (not started)."
}

# Install OpenSearch Dashboards package
install_dashboards() {
    log "Downloading OpenSearch Dashboards package..."
    if [ ! -f "$(basename "$DASHBOARDS_DEB_URL")" ]; then
        curl -SLO "$DASHBOARDS_DEB_URL"
    else
        log "OpenSearch Dashboards package already downloaded, using existing file."
    fi

    log "Installing OpenSearch Dashboards..."
    if ! dpkg -i "$(basename "$DASHBOARDS_DEB_URL")"; then
        log "Fixing dependencies..."
        apt-get install -f -y
    fi

    log "OpenSearch Dashboards installed (not started)."
}

# Install XDR Manager package
install_xdr_manager() {
    log "Downloading XDR Manager package..."
    if [ ! -f "$(basename "$XDR_MANAGER_DEB_URL")" ]; then
        curl -SLO "$XDR_MANAGER_DEB_URL"
    else
        log "XDR Manager package already downloaded, using existing file."
    fi

    log "Installing XDR Manager..."
    if ! dpkg -i "$(basename "$XDR_MANAGER_DEB_URL")"; then
        log "Fixing dependencies..."
        apt-get install -f -y
    fi

    log "XDR Manager installed (not started)."
}

#==============================================================================
# CONFIGURATION FUNCTIONS
#==============================================================================

# Configure OpenSearch
configure_opensearch() {
    log "Configuring OpenSearch..."
    mkdir -p "$(dirname "$OPENSEARCH_CONFIG")"

    # Create the OpenSearch configuration file with secure settings
    cat > "$OPENSEARCH_CONFIG" <<EOF
# OpenSearch configuration (Production Single-Node)
cluster.name: opensearch
node.name: "$NODE_NAME"
node.master: true
node.data: true
node.ingest: true

network.host: "0.0.0.0"
http.port: 9200
transport.port: 9300
discovery.type: single-node
compatibility.override_main_response_version: true

path.data: $OPENSEARCH_DATA
path.logs: $OPENSEARCH_LOGS

# Auto-create indices for security features and monitoring
# action.auto_create_index: .security,.monitoring*,.watches,.triggered_watches,.watcher-history*,.ml*,wazuh*

# SSL/TLS Configuration for HTTP (REST API)
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: $INDEXER_CERT_DIR/${NODE_NAME}.pem
plugins.security.ssl.http.pemkey_filepath: $INDEXER_CERT_DIR/${NODE_NAME}-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: $INDEXER_CERT_DIR/root-ca.pem

# SSL/TLS Configuration for Transport (Node-to-node)
plugins.security.ssl.transport.pemcert_filepath: $INDEXER_CERT_DIR/${NODE_NAME}.pem
plugins.security.ssl.transport.pemkey_filepath: $INDEXER_CERT_DIR/${NODE_NAME}-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: $INDEXER_CERT_DIR/root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.transport.resolve_hostname: false

# Snapshot Api Request
plugins.security.check_snapshot_restore_write_privileges: true
plugins.security.enable_snapshot_restore_privilege: true

# Admin certificate configuration
plugins.security.authcz.admin_dn:
  - "CN=${ADMIN_NAME},OU=${ORG_UNIT},O=${ORGANIZATION},L=${LOCALITY},C=${COUNTRY}"

# Security API access configuration
plugins.security.restapi.roles_enabled:
  - "all_access"
  - "security_rest_api_access"
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [".opendistro-alerting-config", ".opendistro-alerting-alert*", ".opendistro-anomaly-results*", ".opendistro-anomaly-detector*", ".opendistro-anomaly-checkpoints", ".opendistro-anomaly-detection-state", ".opendistro-reports-*", ".opendistro-notifications-*", ".opendistro-notebooks", ".opensearch-observability", ".opendistro-asynchronous-search-response*", ".replication-metadata-store"]
EOF
    log "OpenSearch configuration written to $OPENSEARCH_CONFIG"
}

# Configure Filebeat with enhanced error handling
configure_filebeat() {
    log "Configuring Filebeat with XDR method..."

    # 1. Clean up any existing Wazuh module
    rm -rf /usr/share/filebeat/module/wazuh

    # 2. Download the preconfigured Filebeat configuration file (XDR version)
    if ! curl -so /etc/filebeat/filebeat.yml https://packages.wazuh.com/4.12/tpl/wazuh/filebeat/filebeat.yml; then
        log_error "Failed to download Filebeat configuration. Check network connectivity."
        return 1
    fi

    # 3. Create a Filebeat keystore
    if ! filebeat keystore create --force; then
        log_error "Failed to create Filebeat keystore"
        return 1
    fi

    # 4. Add credentials to the keystore (using custom admin password)
    echo "admin" | filebeat keystore add username --stdin --force
    echo "$CUSTOM_ADMIN_PASSWORD" | filebeat keystore add password --stdin --force

    # 5. Download the alerts template (XDR version)
    if ! curl -so /etc/filebeat/wazuh-template.json https://raw.githubusercontent.com/wazuh/wazuh/v4.12.0/extensions/elasticsearch/7.x/wazuh-template.json; then
        log_error "Failed to download Wazuh template"
        return 1
    fi
    chmod go+r /etc/filebeat/wazuh-template.json

    # 6. Install the XDR module for Filebeat
    local XDR_FILEBEAT_URL="https://packages.wazuh.com/4.x/filebeat/wazuh-filebeat-0.4.tar.gz"
    log "Downloading and installing XDR Filebeat module..."

    mkdir -p /usr/share/filebeat/module
    curl -s "$XDR_FILEBEAT_URL" | tar -xvz -C /usr/share/filebeat/module

    # 7. Verify module installation
    if [ ! -d "/usr/share/filebeat/module/wazuh" ]; then
        log_error "Wazuh module installation failed"
        return 1
    fi

    # 8. Set proper permissions
    chown -R root:root /usr/share/filebeat/module
    chmod -R 755 /usr/share/filebeat/module
    chmod 640 /etc/filebeat/filebeat.yml
    chown root:root /etc/filebeat/filebeat.yml

    # 9. Test configuration
    if ! filebeat test config; then
        log_error "Filebeat configuration test failed"
        return 1
    fi

    log "Filebeat configuration completed successfully."
    return 0
}

# Configure OpenSearch Dashboards
configure_dashboards() {
    log "Configuring OpenSearch Dashboards..."
    mkdir -p "$(dirname "$DASHBOARDS_CONFIG")"

    # Create the OpenSearch Dashboards configuration with secure settings
    cat > "$DASHBOARDS_CONFIG" <<EOF
# OpenSearch Dashboards configuration
server.host: "0.0.0.0"
server.port: 5601

# SSL/TLS Configuration
server.ssl.enabled: true
server.ssl.certificate: "$DASHBOARD_CERT_DIR/${DASHBOARD_NODE_NAME}.pem"
server.ssl.key: "$DASHBOARD_CERT_DIR/${DASHBOARD_NODE_NAME}-key.pem"

# OpenSearch connection settings
opensearch.hosts: ["https://localhost:9200"]
opensearch.ssl.verificationMode: certificate
opensearch.requestHeadersAllowlist: ["securitytenant","Authorization"]
opensearch.username: "admin"
opensearch.password: "$CUSTOM_ADMIN_PASSWORD"

# Security settings
opensearch_security.multitenancy.enabled: false
opensearch_security.readonly_mode.roles: ["kibana_read_only"]
opensearch.ssl.certificateAuthorities: ["$DASHBOARD_CERT_DIR/root-ca.pem"]

# User interface settings
uiSettings.overrides.defaultRoute: "/app/invinsense"
EOF
    log "OpenSearch Dashboards configuration written to $DASHBOARDS_CONFIG"
}

# Set Java Home from OpenSearch installation
export_java_home() {
    log "Setting JAVA_HOME from OpenSearch installation..."

    local java_path
    java_path=$(find /usr/share/opensearch/jdk -name java | head -n 1)

    if [ -z "$java_path" ]; then
        log_error "Could not find Java in OpenSearch installation"
        return 1
    fi

    local java_dir
    java_dir=$(dirname "$(readlink -f "$java_path")")

    JAVA_HOME="$java_dir"
    export JAVA_HOME

    echo "export JAVA_HOME=\"$JAVA_HOME\"" >> /etc/profile.d/opensearch-java.sh
    log "JAVA_HOME set to $JAVA_HOME"
}

#==============================================================================
# SERVICE MANAGEMENT FUNCTIONS
#==============================================================================

# Check if service is running and in expected state
check_service_status() {
    local service_name="$1"
    local expected_state="${2:-active}"

    local service_state
    service_state=$(systemctl is-active "$service_name" 2>/dev/null)

    if [[ "$service_state" == "$expected_state" ]]; then
        debug "Service $service_name is $expected_state"
        return 0
    else
        debug "Service $service_name is $service_state (expected $expected_state)"
        return 1
    fi
}

# Start a service with validations and retries
start_service_with_retry() {
    local service_name="$1"
    local retry_count=0

    log "Starting $service_name..."
    systemctl start "$service_name"

    # Wait for the service to be "active"
    for ((i=1; i<=SERVICE_START_TIMEOUT; i++)); do
        if check_service_status "$service_name" "active"; then
            log "$service_name started successfully"
            return 0
        fi
        sleep 1
    done

    # If we get here, service failed to start
    log_warn "$service_name failed to start within $SERVICE_START_TIMEOUT seconds. Status output:"
    systemctl status "$service_name" || true

    # Try restarting with retry logic
    if [ "$retry_count" -lt "$SERVICE_RETRY_COUNT" ]; then
        retry_count=$((retry_count + 1))
        log "Retrying $service_name start (attempt $retry_count of $SERVICE_RETRY_COUNT)..."
        systemctl restart "$service_name"

        # Wait again
        for ((i=1; i<=SERVICE_START_TIMEOUT; i++)); do
            if check_service_status "$service_name" "active"; then
                log "$service_name started successfully on retry $retry_count"
                return 0
            fi
            sleep 1
        done
    fi

    log_error "Failed to start $service_name after $SERVICE_RETRY_COUNT attempts"
    return 1
}

# Restart a service with validations and retries
restart_service_with_retry() {
    local service_name="$1"
    local retry_count=0

    log "Restarting $service_name..."
    systemctl restart "$service_name"

    # Wait for the service to be "active"
    for ((i=1; i<=SERVICE_START_TIMEOUT; i++)); do
        if check_service_status "$service_name" "active"; then
            log "$service_name restarted successfully"
            return 0
        fi
        sleep 1
    done

    # If we get here, service failed to restart
    log_warn "$service_name failed to restart within $SERVICE_START_TIMEOUT seconds. Status output:"
    systemctl status "$service_name" || true

    # Try again with retry logic
    if [ "$retry_count" -lt "$SERVICE_RETRY_COUNT" ]; then
        retry_count=$((retry_count + 1))
        log "Retrying $service_name restart (attempt $retry_count of $SERVICE_RETRY_COUNT)..."

        # For some services, we might need to stop and then start
        systemctl stop "$service_name"
        sleep 2
        systemctl start "$service_name"

        # Wait again
        for ((i=1; i<=SERVICE_START_TIMEOUT; i++)); do
            if check_service_status "$service_name" "active"; then
                log "$service_name restarted successfully on retry $retry_count"
                return 0
            fi
            sleep 1
        done
    fi

    log_error "Failed to restart $service_name after $SERVICE_RETRY_COUNT attempts"
    return 1
}

# Start all services
start_services() {
    log "Starting all services..."
    rm -rf  /etc/opensearch/esnode-key.pem  /etc/opensearch/esnode.pem  /etc/opensearch/root-ca.pem  /etc/opensearch/kirk-key.pem  /etc/opensearch/kirk.pem
    systemctl daemon-reload

    # Enable all services to start on boot
    systemctl enable opensearch filebeat opensearch-dashboards xdr-manager

    # Start OpenSearch
    start_service_with_retry opensearch
    if ! check_service_status opensearch; then
        log_error "OpenSearch failed to start! Check logs with: journalctl -u opensearch"
        return 1
    fi

    # Initialize security
    if initialize_opensearch_security; then
        log "Security initialized successfully, restarting OpenSearch to apply changes"
        restart_service_with_retry opensearch
        sleep 15
    else
        log_error "Failed to initialize security. Continuing with other services..."
    fi

    # Verify authentication with admin credentials
    log "Testing admin credentials..."
    if curl -ks -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200 >/dev/null 2>&1; then
        log "Admin authentication successful with password: $CUSTOM_ADMIN_PASSWORD"
        # Test a simple query to confirm proper authorization
        local api_response
        api_response=$(curl -k -s -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200/_cluster/health)
        log "API response verification: $(echo "$api_response" | grep -E 'status|cluster_name' || echo 'Failed to get cluster health')"
    else
        log_error "Admin authentication failed. Check your credentials."
    fi

    # Start other services with retry logic
    log "Starting Filebeat..."
    if start_service_with_retry filebeat; then
        log "Filebeat started successfully"
    else
        log_error "Filebeat failed to start. Check logs with: journalctl -u filebeat"
        # Continue with other services even if Filebeat failed
    fi

    log "Starting OpenSearch Dashboards..."
    if start_service_with_retry opensearch-dashboards; then
        log "OpenSearch Dashboards started successfully"
    else
        log_error "OpenSearch Dashboards failed to start. Check logs with: journalctl -u opensearch-dashboards"
        # Continue with other services even if Dashboards failed
    fi

    log "Starting XDR Manager..."
    if start_service_with_retry xdr-manager; then
        log "XDR Manager started successfully"
    else
        log_error "XDR Manager failed to start. Check logs with: journalctl -u xdr-manager"
    fi

    sleep 10
    log "All services started. Checking final status..."

    # Print status of all services for debug
    if [[ "$DEBUG" == "true" ]]; then
        systemctl status opensearch || true
        systemctl status filebeat || true
        systemctl status opensearch-dashboards || true
        systemctl status xdr-manager || true
    fi
}

# Fix permissions for all component directories and files
fix_component_permissions() {
    log "Setting proper ownership and permissions for all components..."

    #==============================================================================
    # OpenSearch Permissions
    #==============================================================================
    if getent passwd opensearch >/dev/null; then
        log "Setting permissions for OpenSearch directories and files..."
        # Main data and log directories
        chown -R opensearch:opensearch /var/lib/opensearch 2>/dev/null || log_warn "Failed to set ownership for /var/lib/opensearch"
        chown -R opensearch:opensearch /var/log/opensearch 2>/dev/null || log_warn "Failed to set ownership for /var/log/opensearch"
        # Configuration directory
        chown -R opensearch:opensearch /etc/opensearch 2>/dev/null || log_warn "Failed to set ownership for /etc/opensearch"
        # Certificate directory
        chown -R opensearch:opensearch "$INDEXER_CERT_DIR" 2>/dev/null || log_warn "Failed to set ownership for $INDEXER_CERT_DIR"
        # Ensure proper certificate permissions
        chmod 750 "$INDEXER_CERT_DIR" 2>/dev/null || log_warn "Failed to set directory permissions for $INDEXER_CERT_DIR"
        find "$INDEXER_CERT_DIR" -name "*-key.pem" -exec chmod 600 {} \; 2>/dev/null
        find "$INDEXER_CERT_DIR" -name "*.pem" -not -name "*-key.pem" -exec chmod 644 {} \; 2>/dev/null
        # Security plugins
        if [ -d "/usr/share/opensearch/plugins/opensearch-security" ]; then
            chown -R opensearch:opensearch /usr/share/opensearch/plugins/opensearch-security 2>/dev/null || log_warn "Failed to set ownership for security plugin"
        fi
    else
        log_warn "User 'opensearch' does not exist. Skipping OpenSearch permissions."
    fi

    #==============================================================================
    # OpenSearch Dashboards Permissions
    #==============================================================================
    if getent passwd opensearch-dashboards >/dev/null; then
        log "Setting permissions for OpenSearch Dashboards directories and files..."
        # Configuration directory
        chown -R opensearch-dashboards:opensearch-dashboards /etc/opensearch-dashboards 2>/dev/null || log_warn "Failed to set ownership for /etc/opensearch-dashboards"
        # Certificate directory
        chown -R opensearch-dashboards:opensearch-dashboards "$DASHBOARD_CERT_DIR" 2>/dev/null || log_warn "Failed to set ownership for $DASHBOARD_CERT_DIR"
        chmod 750 "$DASHBOARD_CERT_DIR" 2>/dev/null || log_warn "Failed to set directory permissions for $DASHBOARD_CERT_DIR"
        find "$DASHBOARD_CERT_DIR" -name "*-key.pem" -exec chmod 600 {} \; 2>/dev/null
        find "$DASHBOARD_CERT_DIR" -name "*.pem" -not -name "*-key.pem" -exec chmod 644 {} \; 2>/dev/null

        # Data directory
        chown -R opensearch-dashboards:opensearch-dashboards /var/lib/opensearch-dashboards 2>/dev/null || log_warn "Failed to set ownership for /var/lib/opensearch-dashboards"

        # Additional certificate directory in application folder
        if [ -d "/usr/share/opensearch-dashboards/certs" ]; then
            chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/certs 2>/dev/null || log_warn "Failed to set ownership for /usr/share/opensearch-dashboards/certs"
            chmod 755 /usr/share/opensearch-dashboards/certs 2>/dev/null || log_warn "Failed to set permissions for /usr/share/opensearch-dashboards/certs"
            find /usr/share/opensearch-dashboards/certs -type f -name "*-key.pem" -exec chmod 600 {} \; 2>/dev/null
            find /usr/share/opensearch-dashboards/certs -type f -name "*.pem" -not -name "*-key.pem" -exec chmod 644 {} \; 2>/dev/null
        else
            # Create directory if it doesn't exist
            mkdir -p /usr/share/opensearch-dashboards/certs
            chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/certs
            chmod 755 /usr/share/opensearch-dashboards/certs
        fi

        # Copy certificates to the application directory if they don't exist
        if [ -d "$DASHBOARD_CERT_DIR" ] && [ -d "/usr/share/opensearch-dashboards/certs" ]; then
            cp -f "$DASHBOARD_CERT_DIR"/*.pem /usr/share/opensearch-dashboards/certs/ 2>/dev/null || log_warn "Failed to copy certificates to /usr/share/opensearch-dashboards/certs"
            chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/certs/*.pem 2>/dev/null || log_warn "Failed to set ownership for copied certificates"
            find /usr/share/opensearch-dashboards/certs -name "*-key.pem" -exec chmod 600 {} \; 2>/dev/null
            find /usr/share/opensearch-dashboards/certs -name "*.pem" -not -name "*-key.pem" -exec chmod 644 {} \; 2>/dev/null
        fi

        # Fix any NodeJS/NPM cache permission issues
        if [ -d "/usr/share/opensearch-dashboards/.npm" ]; then
            chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/.npm 2>/dev/null
        fi
        if [ -d "/usr/share/opensearch-dashboards/.cache" ]; then
            chown -R opensearch-dashboards:opensearch-dashboards /usr/share/opensearch-dashboards/.cache 2>/dev/null
        fi
    else
        log_warn "User 'opensearch-dashboards' does not exist. Skipping OpenSearch Dashboards permissions."
    fi

    #==============================================================================
    # XDR Manager (Wazuh) Permissions
    #==============================================================================
    if getent passwd wazuh >/dev/null; then
        log "Setting permissions for XDR Manager (Wazuh) directories and files..."
        # Main directory
        if [ -d "/var/ossec" ]; then
            chown -R wazuh:wazuh /var/ossec 2>/dev/null || log_warn "Failed to set ownership for /var/ossec"
            # Set special permissions for certain directories that might need them
            if [ -d "/var/ossec/etc" ]; then
                chmod 750 /var/ossec/etc 2>/dev/null
                find /var/ossec/etc -type f -exec chmod 640 {} \; 2>/dev/null
            fi
            if [ -d "/var/ossec/bin" ]; then
                chmod 750 /var/ossec/bin 2>/dev/null
                chmod 750 /var/ossec/bin/* 2>/dev/null || true
            fi
            if [ -d "/var/ossec/queue" ]; then
                chmod 770 /var/ossec/queue 2>/dev/null
            fi
            if [ -d "/var/ossec/var/run" ]; then
                chmod 770 /var/ossec/var/run 2>/dev/null
            fi
        else
            log_warn "Directory /var/ossec does not exist. Skipping XDR Manager permissions."
        fi
        # Log directory
        if [ -d "/var/log/wazuh" ]; then
            chown -R wazuh:wazuh /var/log/wazuh 2>/dev/null || log_warn "Failed to set ownership for /var/log/wazuh"
        fi
    else
        log_warn "User 'wazuh' does not exist. Skipping XDR Manager permissions."
    fi

    #==============================================================================
    # Filebeat Permissions (runs as root)
    #==============================================================================
    log "Setting permissions for Filebeat directories and files..."
    chown -R root:root /etc/filebeat 2>/dev/null || log_warn "Failed to set ownership for /etc/filebeat"
    chown -R root:root "$FILEBEAT_CERT_DIR" 2>/dev/null || log_warn "Failed to set ownership for $FILEBEAT_CERT_DIR"
    chmod 500 "$FILEBEAT_CERT_DIR" 2>/dev/null || log_warn "Failed to set permissions for $FILEBEAT_CERT_DIR"
    chmod 400 "$FILEBEAT_CERT_DIR"/*.pem 2>/dev/null || log_warn "Failed to set permissions for Filebeat certificate files"
    chmod 640 /etc/filebeat/filebeat.yml 2>/dev/null || log_warn "Failed to set permissions for /etc/filebeat/filebeat.yml"

    # Ensure data directory exists with right permissions
    mkdir -p /var/lib/filebeat
    chown -R root:root /var/lib/filebeat 2>/dev/null
    chmod 750 /var/lib/filebeat 2>/dev/null

    log "Component permissions setup completed."
}

# Fix common service issues
fix_service_issues() {
    log "Checking for and fixing common service issues..."

    # Fix for Filebeat issues (check config and permissions)
    if ! check_service_status filebeat; then
        log_warn "Filebeat service is not running, attempting fixes..."

        # Check filebeat config
        filebeat test config -c /etc/filebeat/filebeat.yml || log_error "Filebeat config test failed"

        # Fix permissions on certificates
        if [ -d "$FILEBEAT_CERT_DIR" ]; then
            chmod 500 "$FILEBEAT_CERT_DIR"
            find "$FILEBEAT_CERT_DIR" -type f -name "*.pem" -exec chmod 400 {} \;
        fi

        # Try to restart filebeat
        systemctl restart filebeat
    fi

    # Fix for OpenSearch Dashboards issues
    if ! check_service_status opensearch-dashboards; then
        log_warn "OpenSearch Dashboards service is not running, attempting fixes..."

        # Make sure certificates are accessible
        if [ -d "$DASHBOARD_CERT_DIR" ]; then
            chmod 755 "$DASHBOARD_CERT_DIR"
            find "$DASHBOARD_CERT_DIR" -type f -name "*.pem" -exec chmod 644 {} \;
            if getent passwd opensearch-dashboards >/dev/null; then
                chown -R opensearch-dashboards:opensearch-dashboards "$DASHBOARD_CERT_DIR"
            fi
        fi

        # Try to restart opensearch-dashboards
        systemctl restart opensearch-dashboards
    fi

    # Fix for XDR Manager issues
    if ! check_service_status xdr-manager; then
        log_warn "XDR Manager service is not running, attempting fixes..."

        # Try to restart xdr-manager
        systemctl restart xdr-manager
    fi
}

# Check final status and create summary documentation
final_status() {
    log "Final service status:"
    local status_summary="${CERTS_OUTPUT_DIR}/deployment_summary.txt"

    # Create summary header
    cat > "${status_summary}" <<EOF
====================================================================
                XDR DEPLOYMENT SUMMARY
              Generated on $(date)
====================================================================

SERVER INFORMATION:
- Hostname: $(hostname)
- IP Address: $(hostname -I | awk '{print $1}')

CREDENTIALS:
- Admin username: admin
- Admin password: ${CUSTOM_ADMIN_PASSWORD}

ACCESS POINTS:
- OpenSearch API: https://$(hostname -I | awk '{print $1}'):9200
- OpenSearch Dashboards: https://$(hostname -I | awk '{print $1}'):5601

SERVICE STATUS:
EOF

    # Add service status to summary
    for service in opensearch filebeat opensearch-dashboards xdr-manager; do
        local status
        status=$(systemctl is-active "$service" 2>/dev/null || echo "inactive")
        echo "$service: $status"
        echo "- $service: $status" >> "${status_summary}"
    done

    # Add certificate information to summary
    cat >> "${status_summary}" <<EOF

CERTIFICATE INFORMATION:
- Root CA: ${CERTS_OUTPUT_DIR}/root-ca.pem
- Admin Certificate: ${CERTS_OUTPUT_DIR}/admin.pem
- Deployment Archive: ${CERTS_OUTPUT_DIR}/xdr-certificates.tar
- Certificate Log: ${CERT_LOG_FILE}

NOTE: All certificates have been stored in ${CERTS_OUTPUT_DIR}
      PFX certificates (if generated) are in .pfx.b64 format
      Passwords for PFX certificates can be found in ${CERTS_OUTPUT_DIR}/pfx_passwords.txt
====================================================================
EOF

    chmod 600 "${status_summary}"

    echo ""
    echo -e "\033[1;32m==================== ACCESS INFORMATION ====================\033[0m"
    echo -e "\033[1;36mOpenSearch is available at: \033[1;33mhttps://$(hostname -I | awk '{print $1}'):9200\033[0m"
    echo -e "\033[1;36mDashboards is available at: \033[1;33mhttps://$(hostname -I | awk '{print $1}'):5601\033[0m"
    echo -e "\033[1;36mAdmin credentials: \033[1;33madmin / ${CUSTOM_ADMIN_PASSWORD}\033[0m"
    echo -e "\033[1;36mDeployment summary: \033[1;33m${status_summary}\033[0m"
    echo -e "\033[1;36mInstallation log: \033[1;33m${INSTALL_LOG_FILE}\033[0m"
    echo -e "\033[1;32m============================================================\033[0m"
}

# Verify API access after setup
verify_api_access() {
    log "Verifying API access..."

    # Add timeout and proper error handling
    local curl_opts="-k -s --connect-timeout 10 --max-time 30"

    # Test basic API endpoint
    local basic_response
    basic_response=$(curl ${curl_opts} -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200)
    if ! curl ${curl_opts} -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200 > /dev/null; then
        log_error "Failed to connect to OpenSearch API"
        return 1
    fi
    log "Basic API response: $(echo "$basic_response" | grep -o '"tagline":[^}]*' || echo 'Failed to connect')"

    # Test cluster health with proper error handling
    local health_response
    health_response=$(curl ${curl_opts} -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200/_cluster/health)
    if ! curl ${curl_opts} -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200/_cluster/health > /dev/null; then
        log_error "Failed to get cluster health"
        return 1
    fi
    log "Cluster health: $(echo "$health_response" | grep -o '"status":"[^"]*"' || echo 'Failed to get health')"

    # Test indices
    local indices_response
    indices_response=$(curl -k -s -u "admin:$CUSTOM_ADMIN_PASSWORD" https://localhost:9200/_cat/indices?v)
    log "Available indices: $(echo "$indices_response" | wc -l) indices found"

    echo ""
    echo -e "\033[1;32m==================== API VERIFICATION RESULTS ====================\033[0m"
    echo -e "\033[1;36mBasic API access: \033[1;33m$(if echo "$basic_response" | grep -q "tagline"; then echo "SUCCESS"; else echo "FAILED"; fi)\033[0m"
    echo -e "\033[1;36mCluster health: \033[1;33m$(if echo "$health_response" | grep -q "status"; then echo "SUCCESS"; else echo "FAILED"; fi)\033[0m"
    echo -e "\033[1;36mIndices access: \033[1;33m$(if [ "$(echo "$indices_response" | wc -l)" -gt 0 ]; then echo "SUCCESS"; else echo "FAILED"; fi)\033[0m"
    echo -e "\033[1;32m==================================================================\033[0m"
}

# Cleanup function for secure removal of sensitive data
cleanup() {
    log "Performing secure cleanup..."

    # If debug is not enabled, remove leftover package files
    if [[ "$DEBUG" != "true" ]]; then
        rm -f "$(basename "$OPENSEARCH_DEB_URL")" "$(basename "$FILEBEAT_DEB_URL")" \
            "$(basename "$DASHBOARDS_DEB_URL")" "$(basename "$XDR_MANAGER_DEB_URL")"
    else
        log "Debug mode enabled, keeping package files"
    fi

    # Remove temporary files but keep the certificates
    if [ -d "/tmp/step_0.28.2" ]; then
        rm -rf /tmp/step_0.28.2
    fi

    log "Cleanup completed."
}

#==============================================================================
# MAIN EXECUTION FLOW
#==============================================================================
main() {
    # Display the banner
    display_banner

    # Create/initialize the installation log file
    mkdir -p "$(dirname "$INSTALL_LOG_FILE")"
    touch "$INSTALL_LOG_FILE"
    chmod 640 "$INSTALL_LOG_FILE"

    log "Starting installation with enhanced certificate generation..."

    # Parse command-line arguments
    parse_arguments "$@"

    echo -e "\033[1;32m===== PHASE 1: INSTALLING COMPONENTS =====\033[0m"
    check_root
    install_prerequisites
    install_opensearch
    install_filebeat
    install_dashboards
    install_xdr_manager

    echo -e "\033[1;32m===== PHASE 2: CONFIGURING COMPONENTS =====\033[0m"
    generate_certificates
    configure_opensearch
    set_jvm_options
    configure_filebeat
    configure_dashboards
    export_java_home

    echo -e "\033[1;32m===== PHASE 3: STARTING SERVICES =====\033[0m"
    # Fix permissions before starting services to prevent access issues
    fix_component_permissions

    # Start all services
    start_services

    # Apply permissions again after security initialization
    fix_component_permissions

    # Fix any remaining service issues
    fix_service_issues

    final_status
    # verify_api_access
    cleanup

    log "Installation completed with enhanced certificate generation and security."
    log "Using admin password: $CUSTOM_ADMIN_PASSWORD"
    log "You can access OpenSearch API at: https://$(hostname -I | awk '{print $1}'):9200"
    log "You can access OpenSearch Dashboards at: https://$(hostname -I | awk '{print $1}'):5601"

    echo -e "\033[1;32m"
    cat << "EOF"
 ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗██╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝██║
██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗  ██║
██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝  ╚═╝
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗██╗
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝
EOF
    echo -e "\033[0m"
}

# Call main with all script arguments
main "$@"
