---
title: "RSyslog Secure Configuration: Advanced Logging Architecture and Hardening Guide"
slug: "rsyslog-secure-configuration-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-11T08:00:00Z
featured: false
draft: false
tags:
  - rsyslog
  - logging
  - security
  - siem
  - log-management
  - system-administration
  - compliance
  - monitoring
description: "Comprehensive guide to implementing secure RSyslog configurations, covering advanced logging architectures, encryption, authentication, and enterprise-grade log management strategies."
---

# RSyslog Secure Configuration: Advanced Enterprise Guide

This comprehensive guide provides detailed instructions for implementing secure, high-performance RSyslog configurations suitable for enterprise environments. Learn advanced logging architectures, security hardening techniques, and best practices for centralized log management with compliance requirements.

## Table of Contents

## Understanding RSyslog Security Architecture

### RSyslog Security Fundamentals

RSyslog provides enterprise-grade logging capabilities with robust security features:

- **TLS Encryption**: Secure log transmission over networks
- **Authentication**: Certificate-based client authentication
- **Access Control**: Fine-grained permissions and filtering
- **Data Integrity**: Message authentication and tampering detection
- **Performance**: High-throughput logging with minimal overhead

### Common Security Challenges

**Log Security Threats:**

1. **Log Tampering**: Malicious modification of log entries
2. **Data Exfiltration**: Unauthorized access to sensitive log data
3. **Denial of Service**: Log flooding attacks
4. **Man-in-the-Middle**: Interception of log transmissions
5. **Privilege Escalation**: Exploitation of logging service vulnerabilities

**Compliance Requirements:**

- **PCI DSS**: Payment card industry data security standards
- **HIPAA**: Healthcare information privacy regulations
- **SOX**: Sarbanes-Oxley financial reporting requirements
- **GDPR**: General Data Protection Regulation compliance
- **NIST**: National Institute of Standards and Technology guidelines

## Core RSyslog Security Configuration

### Central Log Server Configuration

```bash
# /etc/rsyslog.conf - Secure central log server configuration

# Global directives for security
$PreserveFQDN on
$RepeatedMsgReduction on
$WorkDirectory /var/spool/rsyslog
$IncludeConfig /etc/rsyslog.d/*.conf

# Memory and performance optimization
$MainMsgQueueSize 50000
$MainMsgQueueHighWaterMark 40000
$MainMsgQueueLowWaterMark 20000
$MainMsgQueueTimeoutEnqueue 0
$MainMsgQueueType LinkedList
$MainMsgQueueSaveOnShutdown on
$MainMsgQueueWorkerThreads 4
$MainMsgQueueWorkerThreadMinimumMessages 2000

# TLS/SSL configuration for secure communication
$DefaultNetstreamDriver gtls
$DefaultNetstreamDriverCAFile /etc/ssl/rsyslog/ca.pem
$DefaultNetstreamDriverCertFile /etc/ssl/rsyslog/server-cert.pem
$DefaultNetstreamDriverKeyFile /etc/ssl/rsyslog/server-key.pem

# Authentication and encryption settings
$InputTCPServerStreamDriverMode 1
$InputTCPServerStreamDriverAuthMode x509/name
$InputTCPServerStreamDriverPermittedPeer *.example.com
$InputTCPServerRun 6514

# UDP input for local systems (if needed)
$ModLoad imudp
$UDPServerRun 514
$UDPServerAddress 127.0.0.1

# TCP input for secure remote logging
$ModLoad imtcp
$InputTCPServerRun 514

# File ownership and permissions
$FileOwner root
$FileGroup adm
$FileCreateMode 0640
$DirCreateMode 0755
$Umask 0022

# Message processing rules with security filtering
# Block potentially malicious patterns
:msg, contains, "../" stop
:msg, contains, "DROP TABLE" stop
:msg, regex, ".*[sS][qQ][lL].*[iI][nN][jJ][eE][cC][tT].*" stop

# Rate limiting to prevent DoS attacks
$SystemLogRateLimitInterval 10
$SystemLogRateLimitBurst 500

# Secure file templates with rotation
$template SecureLogFormat,"%timegenerated:::date-rfc3339% %HOSTNAME% %syslogtag:1:32%%msg:::sp-if-no-1st-sp%%msg%\n"
$template DailyPerHostLogs,"/var/log/remote/%HOSTNAME%/%$year%-%$month%-%$day%.log"

# Security event logging
auth,authpriv.*                 /var/log/auth.log;SecureLogFormat
*.*;auth,authpriv.none          -/var/log/syslog;SecureLogFormat
daemon.*                        -/var/log/daemon.log;SecureLogFormat
kern.*                          -/var/log/kern.log;SecureLogFormat
lpr.*                           -/var/log/lpr.log;SecureLogFormat
mail.*                          -/var/log/mail.log;SecureLogFormat
user.*                          -/var/log/user.log;SecureLogFormat

# Remote host logging with security
*.*                             ?DailyPerHostLogs;SecureLogFormat

# Forward critical security events to SIEM
auth.crit,authpriv.crit         @@siem.example.com:6514
```

### Advanced TLS Configuration

```bash
#!/bin/bash
# setup-rsyslog-tls.sh - Configure TLS certificates for RSyslog

set -euo pipefail

# Configuration variables
CERT_DIR="/etc/ssl/rsyslog"
CA_DIR="/etc/ssl/rsyslog/ca"
SERVER_NAME="logserver.example.com"
CLIENT_NAME="logclient.example.com"
ORGANIZATION="Example Organization"
COUNTRY="US"
STATE="California"
CITY="San Francisco"

# Create certificate directory structure
setup_cert_directories() {
    echo "Setting up certificate directories..."

    mkdir -p "$CERT_DIR"
    mkdir -p "$CA_DIR"
    chmod 700 "$CERT_DIR"
    chmod 700 "$CA_DIR"

    echo "Certificate directories created"
}

# Generate Certificate Authority
generate_ca() {
    echo "Generating Certificate Authority..."

    # Generate CA private key
    openssl genrsa -out "$CA_DIR/ca-key.pem" 4096

    # Generate CA certificate
    openssl req -new -x509 -days 3650 -key "$CA_DIR/ca-key.pem" \
        -out "$CERT_DIR/ca.pem" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/CN=RSyslog-CA"

    chmod 400 "$CA_DIR/ca-key.pem"
    chmod 444 "$CERT_DIR/ca.pem"

    echo "Certificate Authority generated"
}

# Generate server certificate
generate_server_cert() {
    echo "Generating server certificate..."

    # Generate server private key
    openssl genrsa -out "$CERT_DIR/server-key.pem" 2048

    # Generate certificate signing request
    openssl req -new -key "$CERT_DIR/server-key.pem" \
        -out "$CERT_DIR/server.csr" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/CN=$SERVER_NAME"

    # Create extensions file for server certificate
    cat > "$CERT_DIR/server-ext.conf" << EOF
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $SERVER_NAME
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

    # Generate server certificate
    openssl x509 -req -in "$CERT_DIR/server.csr" \
        -CA "$CERT_DIR/ca.pem" \
        -CAkey "$CA_DIR/ca-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/server-cert.pem" \
        -days 365 \
        -extensions v3_req \
        -extfile "$CERT_DIR/server-ext.conf"

    # Set permissions
    chmod 400 "$CERT_DIR/server-key.pem"
    chmod 444 "$CERT_DIR/server-cert.pem"

    # Cleanup
    rm "$CERT_DIR/server.csr" "$CERT_DIR/server-ext.conf"

    echo "Server certificate generated"
}

# Generate client certificate
generate_client_cert() {
    echo "Generating client certificate..."

    # Generate client private key
    openssl genrsa -out "$CERT_DIR/client-key.pem" 2048

    # Generate certificate signing request
    openssl req -new -key "$CERT_DIR/client-key.pem" \
        -out "$CERT_DIR/client.csr" \
        -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/CN=$CLIENT_NAME"

    # Generate client certificate
    openssl x509 -req -in "$CERT_DIR/client.csr" \
        -CA "$CERT_DIR/ca.pem" \
        -CAkey "$CA_DIR/ca-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/client-cert.pem" \
        -days 365

    # Set permissions
    chmod 400 "$CERT_DIR/client-key.pem"
    chmod 444 "$CERT_DIR/client-cert.pem"

    # Cleanup
    rm "$CERT_DIR/client.csr"

    echo "Client certificate generated"
}

# Verify certificates
verify_certificates() {
    echo "Verifying certificates..."

    # Verify server certificate
    if openssl verify -CAfile "$CERT_DIR/ca.pem" "$CERT_DIR/server-cert.pem"; then
        echo "Server certificate verification: PASSED"
    else
        echo "Server certificate verification: FAILED" >&2
        exit 1
    fi

    # Verify client certificate
    if openssl verify -CAfile "$CERT_DIR/ca.pem" "$CERT_DIR/client-cert.pem"; then
        echo "Client certificate verification: PASSED"
    else
        echo "Client certificate verification: FAILED" >&2
        exit 1
    fi

    echo "Certificate verification completed"
}

# Set proper ownership
set_ownership() {
    echo "Setting certificate ownership..."

    chown -R root:root "$CERT_DIR"
    chown -R root:root "$CA_DIR"

    echo "Certificate ownership configured"
}

# Main execution
echo "=== RSyslog TLS Certificate Setup ==="
setup_cert_directories
generate_ca
generate_server_cert
generate_client_cert
verify_certificates
set_ownership

echo "TLS certificate setup completed successfully!"
echo "CA Certificate: $CERT_DIR/ca.pem"
echo "Server Certificate: $CERT_DIR/server-cert.pem"
echo "Server Key: $CERT_DIR/server-key.pem"
echo "Client Certificate: $CERT_DIR/client-cert.pem"
echo "Client Key: $CERT_DIR/client-key.pem"
```

### Client Configuration for Secure Logging

```bash
# /etc/rsyslog.d/50-secure-client.conf - Secure client configuration

# Load TLS module
$ModLoad imfile

# Global TLS settings
$DefaultNetstreamDriver gtls
$DefaultNetstreamDriverCAFile /etc/ssl/rsyslog/ca.pem
$DefaultNetstreamDriverCertFile /etc/ssl/rsyslog/client-cert.pem
$DefaultNetstreamDriverKeyFile /etc/ssl/rsyslog/client-key.pem

# Action queue configuration for reliability
$ActionQueueType LinkedList
$ActionQueueFileName secure_forward
$ActionResumeRetryCount -1
$ActionQueueSaveOnShutdown on
$ActionQueueTimeoutEnqueue 0
$ActionQueueMaxDiskSpace 500m

# Forward all logs to central server with TLS
$ActionSendStreamDriver gtls
$ActionSendStreamDriverMode 1
$ActionSendStreamDriverAuthMode x509/name
$ActionSendStreamDriverPermittedPeer logserver.example.com

# Send all logs to secure central server
*.*                             @@logserver.example.com:6514

# Local backup in case of network issues
*.*                             /var/log/local-backup.log;SecureLogFormat

# Rate limiting for local client
$SystemLogRateLimitInterval 5
$SystemLogRateLimitBurst 200

# Security event filtering before forwarding
# Block sensitive data patterns
:msg, contains, "password" stop
:msg, contains, "secret" stop
:msg, regex, ".*[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}.*" stop  # Credit card patterns

# High-priority security events with immediate forwarding
auth.alert,authpriv.alert       @@logserver.example.com:6514
auth.crit,authpriv.crit         @@logserver.example.com:6514
auth.emerg,authpriv.emerg       @@logserver.example.com:6514
```

## Advanced Security Features

### Log Integrity and Signing

```bash
#!/bin/bash
# rsyslog-signing-setup.sh - Configure log signing for integrity

# Install signing module dependencies
install_signing_dependencies() {
    echo "Installing log signing dependencies..."

    # For Debian/Ubuntu
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update
        apt-get install -y rsyslog-gnutls libgt-dev libgnutls28-dev
    fi

    # For RHEL/CentOS
    if command -v yum >/dev/null 2>&1; then
        yum install -y rsyslog-gnutls guardtime-devel gnutls-devel
    fi

    echo "Dependencies installed"
}

# Configure log signing
configure_log_signing() {
    echo "Configuring log signing..."

    # Create signing configuration
    cat > /etc/rsyslog.d/10-signing.conf << 'EOF'
# Log signature configuration

# Load signature provider module
$ModLoad lmsig_gt

# Configure signature provider
$ActionLmSigGTSignatureProvider gt://guard.com

# File signature settings
$LmSigGTSigner "rsyslog-signer"
$LmSigGTHashChainMaxLength 1000
$LmSigGTTimestampTimeout 10

# Template for signed logs
$template SignedLogFormat,"%timegenerated:::date-rfc3339% %HOSTNAME% %syslogtag%%msg%\n"

# Sign critical security logs
auth.*                          /var/log/auth-signed.log;SignedLogFormat;LmSigGT
authpriv.*                      /var/log/authpriv-signed.log;SignedLogFormat;LmSigGT
security.*                      /var/log/security-signed.log;SignedLogFormat;LmSigGT

# Configure signature files
$LmSigGTSigFile /var/log/auth-signed.log.gtsig
$LmSigGTStateFile /var/log/auth-signed.log.gtstate
EOF

    echo "Log signing configured"
}

# Create signature verification script
create_verification_script() {
    cat > /usr/local/bin/verify-log-signatures.sh << 'EOF'
#!/bin/bash
# Log signature verification script

LOG_DIR="/var/log"
VERIFICATION_LOG="/var/log/signature-verification.log"

verify_signatures() {
    local log_file=$1
    local sig_file="${log_file}.gtsig"
    local state_file="${log_file}.gtstate"

    if [[ -f "$sig_file" && -f "$state_file" ]]; then
        echo "Verifying signatures for: $log_file" | tee -a "$VERIFICATION_LOG"

        if gtsig verify --sig-file "$sig_file" --log-file "$log_file"; then
            echo "  VERIFICATION PASSED: $log_file" | tee -a "$VERIFICATION_LOG"
            return 0
        else
            echo "  VERIFICATION FAILED: $log_file" | tee -a "$VERIFICATION_LOG"
            logger -p auth.alert "Log signature verification failed for $log_file"
            return 1
        fi
    else
        echo "  SIGNATURE FILES MISSING: $log_file" | tee -a "$VERIFICATION_LOG"
        return 1
    fi
}

# Main verification loop
echo "Starting log signature verification: $(date)" | tee -a "$VERIFICATION_LOG"

verification_failed=0

for log_file in "$LOG_DIR"/auth-signed.log "$LOG_DIR"/authpriv-signed.log "$LOG_DIR"/security-signed.log; do
    if [[ -f "$log_file" ]]; then
        if ! verify_signatures "$log_file"; then
            verification_failed=1
        fi
    fi
done

if [[ $verification_failed -eq 1 ]]; then
    echo "One or more signature verifications failed!" | tee -a "$VERIFICATION_LOG"
    exit 1
else
    echo "All signature verifications passed" | tee -a "$VERIFICATION_LOG"
    exit 0
fi
EOF

    chmod +x /usr/local/bin/verify-log-signatures.sh

    # Create systemd timer for regular verification
    cat > /etc/systemd/system/log-signature-verification.service << EOF
[Unit]
Description=Log Signature Verification
After=rsyslog.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/verify-log-signatures.sh
User=root
StandardOutput=journal
StandardError=journal
EOF

    cat > /etc/systemd/system/log-signature-verification.timer << EOF
[Unit]
Description=Run log signature verification hourly
Requires=log-signature-verification.service

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
EOF

    systemctl enable log-signature-verification.timer
    systemctl start log-signature-verification.timer

    echo "Signature verification scheduled"
}

# Run setup
install_signing_dependencies
configure_log_signing
create_verification_script

echo "Log signing setup completed!"
```

### Access Control and Filtering

```bash
# /etc/rsyslog.d/30-access-control.conf - Advanced access control

# Property-based filters for enhanced security
$ModLoad mmfields

# Define custom properties for filtering
set $!source_ip = $fromhost-ip;
set $!facility_name = $syslogfacility-text;
set $!severity_name = $syslogseverity-text;

# Whitelist trusted source IPs
if ($!source_ip == "192.168.1.100") then {
    set $!trusted_source = "true";
} else if ($!source_ip == "192.168.1.101") then {
    set $!trusted_source = "true";
} else if ($!source_ip == "10.0.0.0/8") then {
    set $!trusted_source = "internal";
} else {
    set $!trusted_source = "false";
}

# Block untrusted sources for sensitive facilities
if ($!trusted_source == "false" and ($!facility_name == "auth" or $!facility_name == "authpriv")) then {
    call LogSuspiciousActivity
    stop
}

# Rate limiting by source IP
$ModLoad imptcp
$InputPTCPServerRun 514
$InputPTCPServerBindRuleset secure_input

# Define secure input ruleset
$RuleSet secure_input

# Custom action for suspicious activity logging
$template SuspiciousActivityTemplate,"/var/log/security/suspicious-%$year%-%$month%-%$day%.log"

if ($!trusted_source == "false") then {
    action(type="omfile"
           dynaFile="SuspiciousActivityTemplate"
           template="SecureLogFormat"
           fileOwner="root"
           fileGroup="root"
           fileCreateMode="0600"
           dirCreateMode="0700")
}

# Content-based filtering for sensitive data
# Remove credit card numbers
:msg, regex, "[0-9]{4}[[:space:]-]?[0-9]{4}[[:space:]-]?[0-9]{4}[[:space:]-]?[0-9]{4}" {
    set $!original_msg = $msg;
    set $.redacted_msg = re_replace($msg, "[0-9]{4}[[:space:]-]?[0-9]{4}[[:space:]-]?[0-9]{4}[[:space:]-]?[0-9]{4}", "****-****-****-****");
    set $msg = $.redacted_msg;
}

# Remove Social Security Numbers
:msg, regex, "[0-9]{3}-[0-9]{2}-[0-9]{4}" {
    set $.redacted_msg = re_replace($msg, "[0-9]{3}-[0-9]{2}-[0-9]{4}", "***-**-****");
    set $msg = $.redacted_msg;
}

# Remove email addresses from certain logs
if ($programname == "web-app" or $programname == "user-service") then {
    set $.redacted_msg = re_replace($msg, "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", "[EMAIL-REDACTED]");
    set $msg = $.redacted_msg;
}

# Priority-based routing
if ($!severity_name == "emerg" or $!severity_name == "alert" or $!severity_name == "crit") then {
    # Immediate notification for critical events
    action(type="ommail"
           server="smtp.example.com"
           port="587"
           mailfrom="rsyslog@example.com"
           mailto="security-team@example.com"
           subject="CRITICAL: Security Alert from RSyslog"
           template="EmailAlertTemplate")

    # Forward to SIEM immediately
    action(type="omfwd"
           protocol="tcp"
           target="siem.example.com"
           port="6514"
           StreamDriver="gtls"
           StreamDriverMode="1"
           StreamDriverAuthMode="x509/name"
           StreamDriverPermittedPeers="siem.example.com")
}

# Reset to default ruleset
$RuleSet RSYSLOG_DefaultRuleset
```

## High-Availability and Load Balancing

### Multi-Server Configuration

```bash
#!/bin/bash
# ha-rsyslog-setup.sh - High-availability RSyslog configuration

# Configuration variables
PRIMARY_SERVER="log1.example.com"
SECONDARY_SERVER="log2.example.com"
VIP="192.168.1.200"
KEEPALIVED_PASSWORD="SecurePassword123!"

# Setup load balancer configuration
setup_load_balancer() {
    echo "Configuring HAProxy for log load balancing..."

    # Install HAProxy
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y haproxy keepalived
    elif command -v yum >/dev/null 2>&1; then
        yum install -y haproxy keepalived
    fi

    # Configure HAProxy for RSyslog
    cat > /etc/haproxy/haproxy.cfg << EOF
global
    daemon
    user haproxy
    group haproxy
    log 127.0.0.1:514 local0
    chroot /var/lib/haproxy
    stats socket /var/lib/haproxy/stats
    tune.ssl.default-dh-param 2048

defaults
    mode tcp
    log global
    option tcplog
    option dontlognull
    retries 3
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

# RSyslog load balancing
frontend rsyslog_frontend
    bind *:514
    bind *:6514 ssl crt /etc/ssl/rsyslog/server-combined.pem ca-file /etc/ssl/rsyslog/ca.pem verify required
    default_backend rsyslog_servers

backend rsyslog_servers
    balance roundrobin
    option tcp-check
    tcp-check connect port 514
    server log1 $PRIMARY_SERVER:514 check
    server log2 $SECONDARY_SERVER:514 check backup

# Statistics interface
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
EOF

    # Configure Keepalived for VIP management
    cat > /etc/keepalived/keepalived.conf << EOF
vrrp_script chk_haproxy {
    script "/bin/kill -0 \`cat /var/run/haproxy.pid\`"
    interval 2
    weight 2
    fall 3
    rise 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 110
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass $KEEPALIVED_PASSWORD
    }
    virtual_ipaddress {
        $VIP
    }
    track_script {
        chk_haproxy
    }
}
EOF

    systemctl enable haproxy keepalived
    systemctl start haproxy keepalived

    echo "Load balancer configured"
}

# Configure primary log server
configure_primary_server() {
    echo "Configuring primary log server..."

    cat > /etc/rsyslog.d/10-ha-primary.conf << 'EOF'
# Primary server configuration with replication

# Load database module for log storage
$ModLoad ommysql

# Database connection for log storage
$template MySQLInsertTemplate,"INSERT INTO rsyslog (datetime, hostname, facility, priority, tag, message) VALUES ('%timegenerated:::date-mysql%', '%hostname%', '%syslogfacility%', '%syslogpriority%', '%syslogtag%', '%msg%')"

# Store all logs in MySQL database
*.*     :ommysql:localhost,rsyslog_db,rsyslog_user,rsyslog_password;MySQLInsertTemplate

# Replicate to secondary server
$ModLoad omfwd
*.*     @@log2.example.com:6514

# Local file backup
*.*     /var/log/primary-backup.log;SecureLogFormat

# Health check endpoint
$ModLoad imhttp
$HTTPServerDocumentRoot /var/www/rsyslog-health
$HTTPServerPort 8080

# Create health check document
$template HealthCheckTemplate,"/var/www/rsyslog-health/health.json"
$template HealthCheckContent,'{"status":"healthy","timestamp":"%timegenerated:::date-rfc3339%","server":"primary"}'

local0.info     ?HealthCheckTemplate;HealthCheckContent
EOF

    echo "Primary server configured"
}

# Configure secondary log server
configure_secondary_server() {
    echo "Configuring secondary log server..."

    cat > /etc/rsyslog.d/10-ha-secondary.conf << 'EOF'
# Secondary server configuration (backup)

# Database replication for secondary server
$ModLoad ommysql
$template MySQLInsertTemplate,"INSERT INTO rsyslog (datetime, hostname, facility, priority, tag, message) VALUES ('%timegenerated:::date-mysql%', '%hostname%', '%syslogfacility%', '%syslogpriority%', '%syslogtag%', '%msg%')"

# Store all logs in MySQL database (replica)
*.*     :ommysql:localhost,rsyslog_db,rsyslog_user,rsyslog_password;MySQLInsertTemplate

# Local file backup
*.*     /var/log/secondary-backup.log;SecureLogFormat

# Health check endpoint
$ModLoad imhttp
$HTTPServerDocumentRoot /var/www/rsyslog-health
$HTTPServerPort 8080

$template HealthCheckTemplate,"/var/www/rsyslog-health/health.json"
$template HealthCheckContent,'{"status":"healthy","timestamp":"%timegenerated:::date-rfc3339%","server":"secondary"}'

local0.info     ?HealthCheckTemplate;HealthCheckContent
EOF

    echo "Secondary server configured"
}

# Setup database replication
setup_database_replication() {
    echo "Setting up MySQL database replication..."

    # Create database schema
    mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS rsyslog_db;
USE rsyslog_db;

CREATE TABLE IF NOT EXISTS rsyslog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    datetime DATETIME,
    hostname VARCHAR(255),
    facility INT,
    priority INT,
    tag VARCHAR(255),
    message TEXT,
    INDEX idx_datetime (datetime),
    INDEX idx_hostname (hostname),
    INDEX idx_facility (facility),
    INDEX idx_priority (priority)
);

CREATE USER IF NOT EXISTS 'rsyslog_user'@'localhost' IDENTIFIED BY 'rsyslog_password';
GRANT INSERT, SELECT ON rsyslog_db.* TO 'rsyslog_user'@'localhost';
FLUSH PRIVILEGES;
EOF

    echo "Database setup completed"
}

# Create monitoring script
create_monitoring_script() {
    cat > /usr/local/bin/rsyslog-ha-monitor.sh << 'EOF'
#!/bin/bash
# RSyslog HA monitoring script

LOGFILE="/var/log/rsyslog-ha-monitor.log"
PRIMARY_SERVER="log1.example.com"
SECONDARY_SERVER="log2.example.com"
VIP="192.168.1.200"

check_server_health() {
    local server=$1
    local port=$2

    if timeout 5 bash -c "</dev/tcp/$server/$port"; then
        return 0
    else
        return 1
    fi
}

check_database_health() {
    local server=$1

    if mysql -h "$server" -u rsyslog_user -prsyslog_password -e "SELECT 1;" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

monitor_ha_status() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Check primary server
    if check_server_health "$PRIMARY_SERVER" 514; then
        primary_status="UP"
    else
        primary_status="DOWN"
        echo "[$timestamp] ALERT: Primary server $PRIMARY_SERVER is DOWN" | tee -a "$LOGFILE"
        logger -p local0.alert "RSyslog HA: Primary server $PRIMARY_SERVER is DOWN"
    fi

    # Check secondary server
    if check_server_health "$SECONDARY_SERVER" 514; then
        secondary_status="UP"
    else
        secondary_status="DOWN"
        echo "[$timestamp] ALERT: Secondary server $SECONDARY_SERVER is DOWN" | tee -a "$LOGFILE"
        logger -p local0.alert "RSyslog HA: Secondary server $SECONDARY_SERVER is DOWN"
    fi

    # Check VIP status
    if check_server_health "$VIP" 514; then
        vip_status="UP"
    else
        vip_status="DOWN"
        echo "[$timestamp] ALERT: VIP $VIP is DOWN" | tee -a "$LOGFILE"
        logger -p local0.alert "RSyslog HA: VIP $VIP is DOWN"
    fi

    echo "[$timestamp] Status - Primary: $primary_status, Secondary: $secondary_status, VIP: $vip_status" | tee -a "$LOGFILE"
}

# Main monitoring loop
while true; do
    monitor_ha_status
    sleep 60
done
EOF

    chmod +x /usr/local/bin/rsyslog-ha-monitor.sh

    # Create systemd service for monitoring
    cat > /etc/systemd/system/rsyslog-ha-monitor.service << EOF
[Unit]
Description=RSyslog HA Monitor
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/rsyslog-ha-monitor.sh
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl enable rsyslog-ha-monitor.service
    systemctl start rsyslog-ha-monitor.service

    echo "HA monitoring configured"
}

# Main execution
echo "=== RSyslog High-Availability Setup ==="

read -p "Configure this server as [primary/secondary/loadbalancer]: " server_role

case $server_role in
    "primary")
        configure_primary_server
        setup_database_replication
        ;;
    "secondary")
        configure_secondary_server
        ;;
    "loadbalancer")
        setup_load_balancer
        ;;
    *)
        echo "Invalid role. Choose primary, secondary, or loadbalancer"
        exit 1
        ;;
esac

create_monitoring_script

echo "RSyslog HA setup completed for role: $server_role"
```

## Performance Optimization and Monitoring

### Performance Tuning Configuration

```bash
# /etc/rsyslog.d/20-performance.conf - Performance optimization

# Global performance settings
$MaxMessageSize 8192
$PreserveFQDN on
$RepeatedMsgReduction on

# Main message queue optimization
$MainMsgQueueSize 100000
$MainMsgQueueHighWaterMark 80000
$MainMsgQueueLowWaterMark 20000
$MainMsgQueueTimeoutEnqueue 0
$MainMsgQueueType LinkedList
$MainMsgQueueSaveOnShutdown on
$MainMsgQueueWorkerThreads 8
$MainMsgQueueWorkerThreadMinimumMessages 1000
$MainMsgQueueMaxFileSize 100m
$MainMsgQueueMaxDiskSpace 2g

# Action queue optimization for forwarding
$ActionQueueType LinkedList
$ActionQueueSize 50000
$ActionQueueHighWaterMark 40000
$ActionQueueLowWaterMark 10000
$ActionQueueTimeoutEnqueue 0
$ActionQueueWorkerThreads 4
$ActionQueueWorkerThreadMinimumMessages 500
$ActionQueueMaxFileSize 50m
$ActionQueueMaxDiskSpace 1g
$ActionResumeRetryCount -1
$ActionQueueSaveOnShutdown on

# File I/O optimization
$OMFileFlushInterval 10
$OMFileIOBufferSize 64k
$OMFileFlushOnTXEnd off

# Network optimization
$UDPServerTimeRequery 60
$InputTCPMaxSessions 500
$InputTCPFlowControl on

# Template for high-performance logging
$template HighPerfTemplate,"%timegenerated:1:19:date-rfc3339% %hostname% %syslogtag%%msg%\n"

# Asynchronous file writing for high-throughput logs
$OMFileAsyncWriting on
*.*     -/var/log/high-performance.log;HighPerfTemplate
```

### Comprehensive Monitoring Dashboard

```python
#!/usr/bin/env python3
# rsyslog-dashboard.py - Real-time RSyslog monitoring dashboard

import json
import time
import subprocess
import sqlite3
import os
from datetime import datetime, timedelta
from collections import defaultdict
import argparse

class RSyslogMonitor:
    def __init__(self, db_path="/var/log/rsyslog-monitor.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize SQLite database for monitoring data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metric_name TEXT,
                metric_value REAL,
                hostname TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                alert_type TEXT,
                message TEXT,
                severity TEXT,
                acknowledged BOOLEAN DEFAULT FALSE
            )
        ''')

        conn.commit()
        conn.close()

    def collect_rsyslog_stats(self):
        """Collect RSyslog statistics"""
        stats = {}

        try:
            # Get rsyslog process information
            result = subprocess.run(['pgrep', '-f', 'rsyslogd'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                pid = result.stdout.strip().split('\n')[0]

                # Memory usage
                with open(f'/proc/{pid}/status', 'r') as f:
                    for line in f:
                        if line.startswith('VmRSS:'):
                            memory_kb = int(line.split()[1])
                            stats['memory_usage_mb'] = memory_kb / 1024
                            break

                # CPU usage
                result = subprocess.run(['ps', '-p', pid, '-o', 'pcpu='],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    stats['cpu_usage_percent'] = float(result.stdout.strip())

                # File descriptor count
                fd_dir = f'/proc/{pid}/fd'
                if os.path.exists(fd_dir):
                    stats['open_file_descriptors'] = len(os.listdir(fd_dir))

            # Log file sizes
            log_files = [
                '/var/log/syslog',
                '/var/log/auth.log',
                '/var/log/daemon.log',
                '/var/log/kern.log'
            ]

            total_log_size = 0
            for log_file in log_files:
                if os.path.exists(log_file):
                    size = os.path.getsize(log_file)
                    total_log_size += size
                    stats[f'{os.path.basename(log_file)}_size_mb'] = size / (1024 * 1024)

            stats['total_log_size_mb'] = total_log_size / (1024 * 1024)

            # Network connections
            result = subprocess.run(['netstat', '-tn'], capture_output=True, text=True)
            if result.returncode == 0:
                connections = result.stdout.split('\n')
                rsyslog_connections = [line for line in connections if ':514' in line]
                stats['active_connections'] = len(rsyslog_connections)

            # Disk space
            result = subprocess.run(['df', '/var/log'], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    fields = lines[1].split()
                    used_percent = int(fields[4].rstrip('%'))
                    stats['disk_usage_percent'] = used_percent

        except Exception as e:
            print(f"Error collecting stats: {e}")

        return stats

    def store_metrics(self, metrics):
        """Store metrics in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        hostname = subprocess.run(['hostname'], capture_output=True, text=True).stdout.strip()

        for metric_name, value in metrics.items():
            cursor.execute(
                'INSERT INTO metrics (metric_name, metric_value, hostname) VALUES (?, ?, ?)',
                (metric_name, value, hostname)
            )

        conn.commit()
        conn.close()

    def check_alerts(self, metrics):
        """Check for alert conditions"""
        alerts = []

        # Memory usage alert
        if metrics.get('memory_usage_mb', 0) > 1024:  # 1GB
            alerts.append({
                'type': 'high_memory_usage',
                'message': f"High memory usage: {metrics['memory_usage_mb']:.1f}MB",
                'severity': 'warning'
            })

        # CPU usage alert
        if metrics.get('cpu_usage_percent', 0) > 80:
            alerts.append({
                'type': 'high_cpu_usage',
                'message': f"High CPU usage: {metrics['cpu_usage_percent']:.1f}%",
                'severity': 'warning'
            })

        # Disk space alert
        if metrics.get('disk_usage_percent', 0) > 90:
            alerts.append({
                'type': 'high_disk_usage',
                'message': f"High disk usage: {metrics['disk_usage_percent']}%",
                'severity': 'critical'
            })

        # Log file size alert
        if metrics.get('total_log_size_mb', 0) > 10240:  # 10GB
            alerts.append({
                'type': 'large_log_files',
                'message': f"Large log files: {metrics['total_log_size_mb']:.1f}MB",
                'severity': 'warning'
            })

        # Store alerts
        if alerts:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            for alert in alerts:
                cursor.execute(
                    'INSERT INTO alerts (alert_type, message, severity) VALUES (?, ?, ?)',
                    (alert['type'], alert['message'], alert['severity'])
                )

            conn.commit()
            conn.close()

        return alerts

    def generate_report(self, hours=24):
        """Generate monitoring report"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get recent metrics
        since_time = datetime.now() - timedelta(hours=hours)
        cursor.execute('''
            SELECT metric_name, AVG(metric_value) as avg_value,
                   MAX(metric_value) as max_value, MIN(metric_value) as min_value
            FROM metrics
            WHERE timestamp > ?
            GROUP BY metric_name
        ''', (since_time,))

        metrics_summary = cursor.fetchall()

        # Get recent alerts
        cursor.execute('''
            SELECT alert_type, COUNT(*) as count, severity
            FROM alerts
            WHERE timestamp > ?
            GROUP BY alert_type, severity
        ''', (since_time,))

        alerts_summary = cursor.fetchall()

        conn.close()

        # Generate report
        report = {
            'timestamp': datetime.now().isoformat(),
            'period_hours': hours,
            'metrics_summary': {
                row[0]: {
                    'average': row[1],
                    'maximum': row[2],
                    'minimum': row[3]
                } for row in metrics_summary
            },
            'alerts_summary': {
                f"{row[0]}_{row[2]}": row[1] for row in alerts_summary
            }
        }

        return report

    def run_monitoring(self, interval=60):
        """Run continuous monitoring"""
        print(f"Starting RSyslog monitoring (interval: {interval}s)")

        while True:
            try:
                # Collect metrics
                metrics = self.collect_rsyslog_stats()
                print(f"[{datetime.now()}] Collected {len(metrics)} metrics")

                # Store metrics
                self.store_metrics(metrics)

                # Check for alerts
                alerts = self.check_alerts(metrics)
                if alerts:
                    print(f"Generated {len(alerts)} alerts")
                    for alert in alerts:
                        print(f"  {alert['severity'].upper()}: {alert['message']}")

                time.sleep(interval)

            except KeyboardInterrupt:
                print("\nMonitoring stopped")
                break
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(interval)

def main():
    parser = argparse.ArgumentParser(description='RSyslog Monitoring Dashboard')
    parser.add_argument('--interval', type=int, default=60,
                      help='Monitoring interval in seconds (default: 60)')
    parser.add_argument('--report', action='store_true',
                      help='Generate and display report')
    parser.add_argument('--hours', type=int, default=24,
                      help='Report period in hours (default: 24)')

    args = parser.parse_args()

    monitor = RSyslogMonitor()

    if args.report:
        report = monitor.generate_report(args.hours)
        print(json.dumps(report, indent=2))
    else:
        monitor.run_monitoring(args.interval)

if __name__ == '__main__':
    main()
```

## Best Practices and Recommendations

### Security Hardening Checklist

1. **Encryption**: Always use TLS for log transmission
2. **Authentication**: Implement certificate-based client authentication
3. **Access Control**: Restrict log server access to authorized clients only
4. **Data Integrity**: Use log signing for critical security logs
5. **Monitoring**: Implement comprehensive monitoring and alerting
6. **Backup**: Regular backups of log data and configurations
7. **Retention**: Implement appropriate log retention policies
8. **Compliance**: Ensure configuration meets regulatory requirements

### Troubleshooting Common Issues

```bash
#!/bin/bash
# rsyslog-troubleshooting.sh - Diagnostic and troubleshooting tools

# Function to check RSyslog configuration
check_configuration() {
    echo "=== RSyslog Configuration Check ==="

    # Test configuration syntax
    if rsyslogd -N1; then
        echo "✓ Configuration syntax is valid"
    else
        echo "✗ Configuration syntax errors found"
        return 1
    fi

    # Check for common configuration issues
    if grep -q "ModLoad.*imudp" /etc/rsyslog.conf /etc/rsyslog.d/*.conf 2>/dev/null; then
        echo "✓ UDP input module loaded"
    else
        echo "⚠ UDP input module not loaded"
    fi

    if grep -q "ModLoad.*imtcp" /etc/rsyslog.conf /etc/rsyslog.d/*.conf 2>/dev/null; then
        echo "✓ TCP input module loaded"
    else
        echo "⚠ TCP input module not loaded"
    fi
}

# Function to check network connectivity
check_network() {
    echo "=== Network Connectivity Check ==="

    # Check if RSyslog is listening on expected ports
    if netstat -tlnp | grep -q ":514.*rsyslogd"; then
        echo "✓ RSyslog listening on TCP port 514"
    else
        echo "⚠ RSyslog not listening on TCP port 514"
    fi

    if netstat -ulnp | grep -q ":514.*rsyslogd"; then
        echo "✓ RSyslog listening on UDP port 514"
    else
        echo "⚠ RSyslog not listening on UDP port 514"
    fi

    # Check TLS port
    if netstat -tlnp | grep -q ":6514.*rsyslogd"; then
        echo "✓ RSyslog listening on TLS port 6514"
    else
        echo "⚠ RSyslog not listening on TLS port 6514"
    fi
}

# Function to check certificates
check_certificates() {
    echo "=== Certificate Check ==="

    local cert_dir="/etc/ssl/rsyslog"

    if [[ -f "$cert_dir/ca.pem" ]]; then
        if openssl x509 -in "$cert_dir/ca.pem" -noout -checkend 86400; then
            echo "✓ CA certificate is valid and not expiring soon"
        else
            echo "⚠ CA certificate is invalid or expiring within 24 hours"
        fi
    else
        echo "⚠ CA certificate not found"
    fi

    if [[ -f "$cert_dir/server-cert.pem" ]]; then
        if openssl x509 -in "$cert_dir/server-cert.pem" -noout -checkend 86400; then
            echo "✓ Server certificate is valid and not expiring soon"
        else
            echo "⚠ Server certificate is invalid or expiring within 24 hours"
        fi
    else
        echo "⚠ Server certificate not found"
    fi
}

# Function to check log file permissions
check_permissions() {
    echo "=== File Permissions Check ==="

    local log_dirs=("/var/log" "/var/spool/rsyslog")

    for dir in "${log_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            local perms=$(stat -c "%a" "$dir")
            if [[ "$perms" =~ ^[67][0-7][0-7]$ ]]; then
                echo "✓ $dir permissions are secure ($perms)"
            else
                echo "⚠ $dir permissions may be too restrictive or permissive ($perms)"
            fi
        else
            echo "⚠ Directory $dir does not exist"
        fi
    done
}

# Function to check disk space
check_disk_space() {
    echo "=== Disk Space Check ==="

    local usage=$(df /var/log | tail -1 | awk '{print $5}' | sed 's/%//')

    if [[ $usage -lt 80 ]]; then
        echo "✓ Disk space usage is acceptable ($usage%)"
    elif [[ $usage -lt 90 ]]; then
        echo "⚠ Disk space usage is high ($usage%)"
    else
        echo "✗ Disk space usage is critical ($usage%)"
    fi
}

# Function to analyze log patterns
analyze_logs() {
    echo "=== Log Analysis ==="

    # Check for recent errors
    local errors=$(journalctl -u rsyslog --since "1 hour ago" --no-pager | grep -i error | wc -l)
    echo "Recent RSyslog errors: $errors"

    # Check message rates
    local current_hour=$(date +%H)
    local messages=$(grep "$(date '+%b %d %H')" /var/log/syslog 2>/dev/null | wc -l)
    echo "Messages in current hour: $messages"

    # Check for dropped messages
    if journalctl -u rsyslog --since "1 hour ago" --no-pager | grep -q "dropped"; then
        echo "⚠ Dropped messages detected in recent logs"
    else
        echo "✓ No dropped messages in recent logs"
    fi
}

# Run all checks
echo "RSyslog Troubleshooting Tool"
echo "============================"

check_configuration
check_network
check_certificates
check_permissions
check_disk_space
analyze_logs

echo ""
echo "Troubleshooting completed. Review any warnings or errors above."
```

## Conclusion

Implementing secure RSyslog configurations requires careful attention to encryption, authentication, access control, and monitoring. Key recommendations:

1. **Always Use TLS**: Encrypt all log transmissions
2. **Certificate Management**: Implement proper certificate lifecycle management
3. **Access Control**: Restrict access to authorized clients only
4. **Monitoring**: Implement comprehensive health and security monitoring
5. **High Availability**: Design for resilience and redundancy
6. **Regular Testing**: Continuously validate configuration and security posture

By following the configurations and best practices outlined in this guide, you can build a robust, secure logging infrastructure that meets enterprise security and compliance requirements while maintaining high performance and reliability.
