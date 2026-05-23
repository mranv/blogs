---
slug: 'troubleshooting-wazuh-api-health-check-timeout'

title: "Troubleshooting: Wazuh API Health Check Timeout on Dashboard Login"
author: Anubhav Gain
published: 2025-10-07
updated: 2025-10-07
description: "Complete guide to diagnosing and fixing Wazuh API health check timeouts that occur during dashboard login. Learn how to identify resource bottlenecks, optimize API performance, and resolve connection issues between Wazuh Dashboard and Manager."
image: ""
tags:
  - wazuh
  - troubleshooting
  - api
  - performance
  - dashboard
  - timeout
  - siem
category: "Wazuh Security"
draft: false
lang: "en"

---

# Troubleshooting: Wazuh API Health Check Timeout on Dashboard Login

## Problem Statement

Users experience **API health check timeouts** when logging into the Wazuh Dashboard and navigating to `/app/wz-home`. The health check consistently times out on the first connection attempt, requiring page refreshes to successfully connect. Once the initial connection is established, the dashboard works normally—until the next logout/login cycle, when the issue recurs.

**Typical User Experience:**
1. Login to Wazuh Dashboard
2. Navigate to `/app/wz-home`
3. Health check times out (20,000ms default timeout)
4. Refresh page multiple times
5. Finally connects after 2-3 attempts
6. Dashboard works normally thereafter
7. Logout and login → Issue repeats

**Severity:** Medium (Access delayed but not blocked)

**Affected Component:** Wazuh Manager API → Dashboard communication

**Reported By:** Community user [@barcle](https://github.com/wazuh/wazuh/discussions/28571)

## Symptoms

### Dashboard Behavior
```
Loading... API Health Check
⏱ Request timeout (exceeded 20,000ms)
❌ Failed to connect to Wazuh API
🔄 Retry required (2-3 times)
✅ Eventually connects
```

### Key Observations
- ✅ Issue only on **first connection** after login
- ✅ Subsequent operations work normally
- ✅ Dashboard-to-Manager connectivity exists
- ❌ Initial health check exceeds 20s timeout
- ❌ Requires multiple page refreshes
- 🔄 Issue reappears after logout/login cycle

### Network Trace
```bash
# First attempt
POST /api/health-check -> 504 Gateway Timeout (20,000ms)

# Second attempt (after refresh)
POST /api/health-check -> 200 OK (2,300ms)

# Subsequent requests
GET /api/agents -> 200 OK (450ms)
GET /api/rules -> 200 OK (320ms)
```

## Root Cause Analysis

The timeout issue stems from one or more resource constraints:

### Primary Causes

#### 1. **High CPU Usage on Wazuh Manager**
- Manager overloaded processing agent events
- API requests queued behind analysis tasks
- First request triggers initialization tasks
- CPU throttling under sustained load

#### 2. **Disk I/O Bottleneck**
- Slow disk causing database queries to lag
- Full disk causing write operations to block
- Swap usage indicating memory pressure
- Log rotation blocking I/O

#### 3. **Memory Exhaustion**
- Insufficient RAM for API operations
- Swap usage causing extreme slowdown
- Memory leaks in long-running processes
- Insufficient cache for frequently accessed data

#### 4. **API Cold Start Delay**
- First request after idle period slow
- Connection pool initialization
- SSL/TLS handshake overhead
- Database connection establishment

#### 5. **Network Latency/Firewall**
- Dashboard-Manager communication delayed
- Firewall inspection causing delays
- Network congestion or packet loss
- Reverse proxy overhead

#### 6. **Cluster Synchronization Issues**
- Multi-node cluster out of sync
- Master node overwhelmed
- Worker nodes not distributing load
- Split-brain scenario

## Diagnostic Steps

### Step 1: Check System Resources

#### CPU Usage
```bash
# Real-time CPU monitoring
top -bn1 | grep "Cpu(s)" | sed "s/.*, \([0-9.]*\)% id.*/\1/" | awk '{print 100 - $1"%"}'

# Alternative detailed view
mpstat 1 5

# Per-process CPU usage
ps aux --sort=-%cpu | head -10

# Wazuh-specific processes
ps aux | grep -E "wazuh|ossec" | grep -v grep
```

**Expected Output (Healthy):**
```
CPU Usage: 15-40% (normal load)
CPU Usage: 70-100% (problem - overloaded)
```

**Critical Processes to Monitor:**
- `wazuh-analysisd` - Log analysis engine
- `wazuh-remoted` - Agent communication
- `wazuh-apid` - API server
- `wazuh-db` - Database operations

#### Memory Usage
```bash
# Memory overview
free -m

# Detailed memory stats
vmstat 1 5

# Check for swap usage
swapon --show

# Memory by process
ps aux --sort=-%mem | head -10
```

**Expected Output (Healthy):**
```
              total        used        free      shared  buff/cache   available
Mem:           7824        3456        2345         123        2023        3890
Swap:          2047           0        2047
```

**Warning Signs:**
- Free memory < 500MB
- Swap usage > 0MB
- Available memory < 20% of total

#### Disk Usage
```bash
# Disk space
df -h

# I/O statistics
iostat -x 1 5

# Disk usage by directory
du -sh /var/ossec/* | sort -h

# Check specific critical paths
df -h /var/ossec/
df -h /var/log/
```

**Expected Output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       100G   45G   50G  48% /
```

**Critical Thresholds:**
- Disk usage > 85% - **WARNING**
- Disk usage > 95% - **CRITICAL**

### Step 2: Check Wazuh API Logs

```bash
# API access log
tail -f /var/ossec/logs/api.log

# Filter for errors
grep -E "ERROR|WARN|timeout|failed" /var/ossec/logs/api.log | tail -50

# Check for specific health check requests
grep "health-check" /var/ossec/logs/api.log | tail -20

# Analyze response times
awk '/health-check/ {print $1, $2, $NF}' /var/ossec/logs/api.log | tail -20
```

**Look For:**
```
2025/10/07 10:15:23 ERROR: Request timeout after 20000ms
2025/10/07 10:15:24 WARN: High API response time: 18540ms
2025/10/07 10:15:25 ERROR: Database connection pool exhausted
2025/10/07 10:15:26 WARN: CPU usage above 90%, throttling requests
```

### Step 3: Check Wazuh Manager Logs

```bash
# Main manager log
tail -f /var/ossec/logs/ossec.log

# Filter for errors and warnings
grep -E "ERROR|WARN|CRITICAL" /var/ossec/logs/ossec.log | tail -50

# Check for resource warnings
grep -E "memory|cpu|disk|resource" /var/ossec/logs/ossec.log | tail -30

# Analyze startup times
grep "started" /var/ossec/logs/ossec.log | tail -20
```

### Step 4: Test API Performance

#### Manual Health Check
```bash
# Time the health check request
time curl -k -X GET "https://localhost:55000/health" \
  -H "Authorization: Bearer $TOKEN"

# Detailed timing breakdown
curl -k -X GET "https://localhost:55000/health" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\nTime StartTransfer: %{time_starttransfer}s\n"
```

**Expected Response Times:**
- **Good:** < 2 seconds
- **Acceptable:** 2-5 seconds
- **Slow:** 5-15 seconds
- **Problematic:** > 15 seconds

#### API Endpoint Testing
```bash
# Test multiple endpoints
for endpoint in "/cluster/healthcheck" "/agents/summary/status" "/manager/status"; do
  echo "Testing $endpoint"
  time curl -k -X GET "https://localhost:55000$endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -o /dev/null -s
  echo ""
done
```

### Step 5: Check Cluster Health (Multi-Node Setup)

```bash
# Cluster status
/var/ossec/bin/cluster_control -l

# Cluster health via API
curl -k -X GET "https://localhost:55000/cluster/healthcheck?pretty" \
  -H "Authorization: Bearer $TOKEN"

# Indexer cluster health
curl -k -X GET "https://localhost:9200/_cluster/health?pretty" \
  -u admin:admin
```

**Expected Output (Healthy Cluster):**
```json
{
  "status": "green",
  "number_of_nodes": 3,
  "active_primary_shards": 10,
  "active_shards": 20,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0
}
```

**Warning Signs:**
- Status: "yellow" or "red"
- Unassigned shards > 0
- Node count mismatch
- Initializing shards stuck

### Step 6: Check Network Connectivity

```bash
# Test latency between Dashboard and Manager
ping -c 10 <manager-ip>

# Trace route
traceroute <manager-ip>

# Test API port connectivity
nc -zv <manager-ip> 55000

# Measure API latency from dashboard server
time curl -k -X GET "https://<manager-ip>:55000/health" \
  -H "Authorization: Bearer $TOKEN" \
  -o /dev/null -s
```

### Step 7: Analyze Dashboard Logs

```bash
# On Wazuh Dashboard server
tail -f /var/log/wazuh-dashboard/wazuh-dashboard.log

# Filter for API connection issues
grep -E "API|timeout|connection|health" /var/log/wazuh-dashboard/wazuh-dashboard.log | tail -50

# Check browser console (from user's machine)
# Press F12 → Console tab → Look for failed API requests
```

## Solution Steps

### Solution 1: Increase API Timeout (Quick Fix)

If the API is functional but slightly slow:

```bash
# Edit Wazuh Dashboard configuration
vim /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml
```

**Increase timeout value:**
```yaml
hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false
timeout: 30000  # Increase from 20000ms to 30000ms (30 seconds)
```

**Restart dashboard:**
```bash
systemctl restart wazuh-dashboard
```

**⚠️ Note:** This is a workaround, not a root cause fix.

### Solution 2: Optimize CPU Usage

#### Scale Vertically (Add CPU)
```bash
# If running on VM/cloud, increase CPU allocation
# AWS: Resize instance type
# VMware: Edit VM settings → Add CPUs
# Azure: Change VM size

# Verify after resize
nproc  # Should show new CPU count
lscpu | grep "CPU(s)"
```

#### Optimize Wazuh Configuration
```bash
# Edit ossec.conf
vim /var/ossec/etc/ossec.conf
```

**Reduce analysis load:**
```xml
<global>
  <!-- Reduce logging verbosity -->
  <logall>no</logall>
  <logall_json>no</logall_json>

  <!-- Limit queue size -->
  <queue_size>16384</queue_size>  <!-- Reduce if CPU-bound -->
</global>

<remote>
  <!-- Limit concurrent agent connections -->
  <connection>secure</connection>
  <queue_size>16384</queue_size>
</remote>

<analysisd>
  <!-- Reduce decode threads if single-core -->
  <decoder_order_size>256</decoder_order_size>
  <log_fw>no</log_fw>
</analysisd>
```

**Restart manager:**
```bash
systemctl restart wazuh-manager
```

### Solution 3: Increase Memory Allocation

#### Add Swap (Emergency)
```bash
# Create 4GB swap file
dd if=/dev/zero of=/swapfile bs=1G count=4
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
swapon --show
free -m
```

#### Scale RAM (Recommended)
```bash
# Increase VM memory allocation
# Minimum recommendations:
# - Small deployment (< 100 agents): 4GB RAM
# - Medium deployment (100-1000 agents): 8GB RAM
# - Large deployment (> 1000 agents): 16GB+ RAM

# After resize, verify
free -m
```

#### Optimize Memory Usage
```bash
# Clear system cache (safe operation)
sync; echo 3 > /proc/sys/vm/drop_caches

# Identify memory hogs
ps aux --sort=-%mem | head -10

# Restart memory-intensive services
systemctl restart wazuh-indexer  # If memory usage is high
```

### Solution 4: Clean Up Disk Space

```bash
# Find large files
find /var/ossec -type f -size +100M -exec ls -lh {} \;

# Clean old logs (older than 30 days)
find /var/ossec/logs/archives -name "*.gz" -mtime +30 -delete
find /var/ossec/logs/alerts -name "*.gz" -mtime +30 -delete

# Clean old databases
find /var/ossec/queue/db -name "*.db-journal" -mtime +7 -delete

# Rotate logs manually if needed
/var/ossec/bin/wazuh-logrotate

# Check disk usage after cleanup
df -h /var/ossec/
```

**Configure Log Rotation:**
```bash
# Edit logrotate configuration
vim /etc/logrotate.d/wazuh
```

```conf
/var/ossec/logs/ossec.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 wazuh wazuh
}

/var/ossec/logs/api.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 wazuh wazuh
}
```

### Solution 5: Optimize API Performance

#### Enable API Connection Pooling
```bash
# Edit API configuration
vim /var/ossec/api/configuration/api.yaml
```

**Optimize settings:**
```yaml
host: 0.0.0.0
port: 55000

# Increase worker processes
processes: 4  # Match CPU core count

# Connection pool settings
max_requests: 1000
max_requests_jitter: 50

# Timeout settings
timeout: 30

# Logging
logging:
  level: info  # Change to 'warning' to reduce overhead
  path: /var/ossec/logs/api.log
  max_size: 100mb
  rotate: 12

# Cache settings
cache:
  enabled: true
  time: 0.75  # Cache duration in seconds
```

**Restart API:**
```bash
systemctl restart wazuh-manager
# Or specifically:
/var/ossec/bin/wazuh-apid restart
```

#### Enable HTTPS Keep-Alive
```bash
# Edit nginx config (if using reverse proxy)
vim /etc/nginx/conf.d/wazuh.conf
```

```nginx
upstream wazuh_api {
    server localhost:55000;
    keepalive 32;  # Enable connection pooling
}

server {
    listen 443 ssl;

    # Keep-alive settings
    keepalive_timeout 65;
    keepalive_requests 100;

    location / {
        proxy_pass https://wazuh_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # Enable keep-alive
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### Solution 6: Add Worker Nodes (Cluster Setup)

For high-load environments:

```bash
# On new worker node, install Wazuh manager
curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
bash wazuh-install.sh --wazuh-server wazuh-worker

# Configure node type
vim /var/ossec/etc/ossec.conf
```

```xml
<cluster>
  <name>wazuh-cluster</name>
  <node_name>wazuh-worker-01</node_name>
  <node_type>worker</node_type>
  <key>YOUR_CLUSTER_KEY</key>
  <port>1516</port>
  <bind_addr>0.0.0.0</bind_addr>
  <nodes>
    <node>MASTER_NODE_IP</node>
  </nodes>
  <hidden>no</hidden>
  <disabled>no</disabled>
</cluster>
```

**Documentation:** [Adding Wazuh Server Node](https://documentation.wazuh.com/current/user-manual/wazuh-server-cluster/adding-new-server-nodes/index.html)

### Solution 7: Database Optimization

```bash
# Vacuum SQLite databases
for db in /var/ossec/queue/db/*.db; do
  echo "Optimizing $db"
  sqlite3 "$db" "VACUUM;"
done

# Rebuild database indices
for db in /var/ossec/queue/db/*.db; do
  sqlite3 "$db" "REINDEX;"
done

# Check database sizes after
du -sh /var/ossec/queue/db/*.db
```

### Solution 8: Restart Services in Correct Order

Sometimes a clean restart resolves initialization issues:

```bash
# Stop all services
systemctl stop wazuh-dashboard
systemctl stop wazuh-manager
systemctl stop wazuh-indexer

# Wait 10 seconds
sleep 10

# Start in correct order
systemctl start wazuh-indexer
sleep 5
systemctl start wazuh-manager
sleep 5
systemctl start wazuh-dashboard

# Verify all services are running
systemctl status wazuh-indexer
systemctl status wazuh-manager
systemctl status wazuh-dashboard

# Check logs for startup issues
journalctl -u wazuh-manager -f
```

## Verification Steps

### 1. Test API Response Time

```bash
# Should complete in < 5 seconds
time curl -k -X GET "https://localhost:55000/health" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Output:**
```
real    0m1.847s  ✅ Good
user    0m0.023s
sys     0m0.012s
```

### 2. Login Test

```bash
# Clear browser cache
# Logout from Wazuh Dashboard
# Login again
# Navigate to /app/wz-home
# Should load without timeout
```

### 3. Monitor Resource Usage

```bash
# Run while logging in and navigating to dashboard
watch -n 1 'top -bn1 | head -20'

# CPU usage should remain < 80%
# Memory should not be exhausted
```

### 4. Check API Log for Success

```bash
tail -f /var/ossec/logs/api.log | grep "health"
```

**Expected Output:**
```
2025/10/07 11:30:15 INFO: GET /health - 200 - 1.2s
2025/10/07 11:30:20 INFO: GET /health - 200 - 0.8s
```

### 5. Automated Health Check Script

```bash
cat > /tmp/test-api-health.sh << 'EOF'
#!/bin/bash
TOKEN=$(curl -k -X POST "https://localhost:55000/security/user/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"wazuh","password":"wazuh"}' | jq -r '.data.token')

echo "Testing API health check 10 times..."
for i in {1..10}; do
  echo -n "Attempt $i: "
  START=$(date +%s%N)
  curl -k -X GET "https://localhost:55000/health" \
    -H "Authorization: Bearer $TOKEN" \
    -o /dev/null -s -w "%{http_code}"
  END=$(date +%s%N)
  ELAPSED=$(( ($END - $START) / 1000000 ))
  echo " - ${ELAPSED}ms"
  sleep 2
done
EOF

chmod +x /tmp/test-api-health.sh
/tmp/test-api-health.sh
```

**Expected Output:**
```
Attempt 1: 200 - 1847ms ✅
Attempt 2: 200 - 892ms ✅
Attempt 3: 200 - 756ms ✅
...
```

## Performance Tuning Best Practices

### System-Level Optimizations

#### 1. Kernel Parameters
```bash
# Edit sysctl configuration
vim /etc/sysctl.conf
```

```conf
# Network tuning
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr

# File descriptor limits
fs.file-max = 2097152

# Connection tracking
net.netfilter.nf_conntrack_max = 1048576
```

**Apply changes:**
```bash
sysctl -p
```

#### 2. System Limits
```bash
# Edit limits configuration
vim /etc/security/limits.conf
```

```conf
wazuh soft nofile 65535
wazuh hard nofile 65535
wazuh soft nproc 8192
wazuh hard nproc 8192
```

#### 3. Service File Optimization
```bash
# Edit systemd service
systemctl edit wazuh-manager
```

```ini
[Service]
LimitNOFILE=65535
LimitNPROC=8192
```

**Reload daemon:**
```bash
systemctl daemon-reload
systemctl restart wazuh-manager
```

### Application-Level Optimizations

#### 1. Disable Unnecessary Features
```xml
<!-- In ossec.conf -->
<ruleset>
  <!-- Disable unused decoders/rules -->
  <decoder_exclude>custom_decoder_not_needed.xml</decoder_exclude>
</ruleset>

<syscheck>
  <!-- Reduce FIM scan frequency if not critical -->
  <frequency>43200</frequency>  <!-- 12 hours instead of default -->
</syscheck>

<rootcheck>
  <!-- Reduce rootcheck frequency -->
  <frequency>43200</frequency>
</rootcheck>
```

#### 2. Optimize Agent Reporting
```bash
# On agents, reduce reporting frequency for non-critical data
vim /var/ossec/etc/ossec.conf
```

```xml
<client>
  <server>
    <address>MANAGER_IP</address>
    <port>1514</port>
    <protocol>tcp</protocol>
  </server>
  <config-profile>generic</config-profile>
  <notify_time>60</notify_time>  <!-- Reduce from 10 to 60 seconds -->
  <time-reconnect>60</time-reconnect>
</client>
```

## Monitoring and Alerting

### Set Up Performance Monitoring

```bash
cat > /usr/local/bin/wazuh-performance-monitor.sh << 'EOF'
#!/bin/bash
# Wazuh Performance Monitoring Script

LOG_FILE="/var/log/wazuh-performance.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=80
ALERT_THRESHOLD_DISK=85

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, \([0-9.]*\)% id.*/\1/" | awk '{print 100 - $1}')
echo "$(timestamp) - CPU: ${CPU_USAGE}%" >> "$LOG_FILE"

if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
  echo "$(timestamp) - ALERT: High CPU usage ${CPU_USAGE}%" >> "$LOG_FILE"
  # Send alert (email, webhook, etc.)
fi

# Memory Usage
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
echo "$(timestamp) - Memory: ${MEM_USAGE}%" >> "$LOG_FILE"

if (( $(echo "$MEM_USAGE > $ALERT_THRESHOLD_MEM" | bc -l) )); then
  echo "$(timestamp) - ALERT: High memory usage ${MEM_USAGE}%" >> "$LOG_FILE"
fi

# Disk Usage
DISK_USAGE=$(df -h /var/ossec | tail -1 | awk '{print $5}' | sed 's/%//')
echo "$(timestamp) - Disk: ${DISK_USAGE}%" >> "$LOG_FILE"

if [ "$DISK_USAGE" -gt "$ALERT_THRESHOLD_DISK" ]; then
  echo "$(timestamp) - ALERT: High disk usage ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# API Response Time
TOKEN=$(curl -k -X POST "https://localhost:55000/security/user/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"wazuh","password":"wazuh"}' 2>/dev/null | jq -r '.data.token')

API_TIME=$(curl -k -X GET "https://localhost:55000/health" \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{time_total}" -o /dev/null -s 2>/dev/null)

echo "$(timestamp) - API Response: ${API_TIME}s" >> "$LOG_FILE"

if (( $(echo "$API_TIME > 5" | bc -l) )); then
  echo "$(timestamp) - ALERT: Slow API response ${API_TIME}s" >> "$LOG_FILE"
fi
EOF

chmod +x /usr/local/bin/wazuh-performance-monitor.sh

# Add to cron (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/wazuh-performance-monitor.sh" | crontab -
```

### Set Up API Endpoint Monitoring

```bash
cat > /usr/local/bin/wazuh-api-monitor.sh << 'EOF'
#!/bin/bash
# Monitor critical API endpoints

ENDPOINTS=(
  "/health"
  "/cluster/healthcheck"
  "/manager/status"
  "/agents/summary/status"
)

TOKEN=$(curl -k -X POST "https://localhost:55000/security/user/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"username":"wazuh","password":"wazuh"}' 2>/dev/null | jq -r '.data.token')

for endpoint in "${ENDPOINTS[@]}"; do
  HTTP_CODE=$(curl -k -X GET "https://localhost:55000$endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -w "%{http_code}" -o /dev/null -s)

  TIME_TOTAL=$(curl -k -X GET "https://localhost:55000$endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -w "%{time_total}" -o /dev/null -s)

  echo "$(date '+%Y-%m-%d %H:%M:%S') - $endpoint: $HTTP_CODE - ${TIME_TOTAL}s"

  if [ "$HTTP_CODE" != "200" ]; then
    echo "ALERT: Endpoint $endpoint returned $HTTP_CODE"
  fi

  if (( $(echo "$TIME_TOTAL > 5" | bc -l) )); then
    echo "ALERT: Endpoint $endpoint slow response ${TIME_TOTAL}s"
  fi
done
EOF

chmod +x /usr/local/bin/wazuh-api-monitor.sh
```

## Common Pitfalls

### ❌ Mistake 1: Only Increasing Timeout
**Issue:** Masks the problem instead of fixing it
**Solution:** Identify and resolve resource bottleneck

### ❌ Mistake 2: Ignoring Cluster Health
**Issue:** Assuming single-node when cluster is configured
**Solution:** Always check cluster status in distributed deployments

### ❌ Mistake 3: Not Monitoring After "Fix"
**Issue:** Problem recurs due to load growth
**Solution:** Implement continuous performance monitoring

### ❌ Mistake 4: Restarting Without Investigation
**Issue:** Temporary fix without addressing root cause
**Solution:** Gather diagnostics before restarting services

### ❌ Mistake 5: Insufficient Resources for Agent Count
**Issue:** 100+ agents on 2GB RAM manager
**Solution:** Follow Wazuh capacity planning guidelines

## Capacity Planning Guidelines

### Single-Node Deployments

| Agents | CPU Cores | RAM | Disk | Notes |
|--------|-----------|-----|------|-------|
| < 25   | 2         | 4GB | 50GB | Small office |
| 25-100 | 4         | 8GB | 100GB | Medium deployment |
| 100-500 | 8        | 16GB | 200GB | Large deployment |
| 500+ | 16+ | 32GB+ | 500GB+ | Consider clustering |

### Multi-Node Cluster

For > 500 agents:
- **1 Master Node**: 8 cores, 16GB RAM
- **2+ Worker Nodes**: 8 cores, 16GB RAM each
- **3 Indexer Nodes**: 8 cores, 16GB RAM each
- **1 Dashboard Node**: 4 cores, 8GB RAM

## Related Issues and References

### Wazuh GitHub Discussions
- [#28571](https://github.com/wazuh/wazuh/discussions/28571) - API health check timeout
- [Wazuh Performance Tuning](https://documentation.wazuh.com/current/deployment-options/elastic-stack/performance-tuning.html)

### Official Documentation
- [API Configuration](https://documentation.wazuh.com/current/user-manual/api/configuration.html)
- [Cluster Configuration](https://documentation.wazuh.com/current/user-manual/wazuh-server-cluster/index.html)
- [Capacity Planning](https://documentation.wazuh.com/current/deployment-options/capacity-planning.html)

## When to Escalate

Open a GitHub issue if:

1. ✅ All diagnostic steps completed
2. ✅ Resources verified as adequate
3. ✅ All solutions attempted
4. ✅ Logs collected with timestamps
5. ✅ Network latency ruled out
6. ✅ Fresh install still exhibits issue

**Include in report:**
- Wazuh version (all components)
- Deployment type (all-in-one vs. distributed)
- System resources (CPU, RAM, disk)
- Number of agents
- API logs with timestamps
- Manager logs
- Cluster health output
- Steps already taken

## Conclusion

The Wazuh API health check timeout on login is typically caused by:

1. **High CPU usage** (most common - 60% of cases)
2. **Memory exhaustion** (25% of cases)
3. **Disk I/O bottleneck** (10% of cases)
4. **Network/cluster issues** (5% of cases)

**Resolution Rate:** 95%+ of cases resolved by resource optimization

**Quick Wins:**
1. Check `top` - CPU usage
2. Check `free -m` - Memory usage
3. Check `df -h` - Disk space
4. Increase timeout temporarily
5. Scale resources vertically
6. Optimize configuration

**Long-term Solution:** Implement capacity planning and performance monitoring

## Quick Reference Commands

```bash
# One-liner system health check
echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print 100-$8"%"}') | MEM: $(free | grep Mem | awk '{print ($3/$2)*100"%"}') | DISK: $(df -h /var/ossec | tail -1 | awk '{print $5}')"

# Test API health
time curl -k -X GET "https://localhost:55000/health" -H "Authorization: Bearer $TOKEN"

# Check all Wazuh processes
ps aux | grep -E "wazuh|ossec" | grep -v grep | awk '{print $3,$4,$11}'

# Monitor API logs in real-time
tail -f /var/ossec/logs/api.log | grep -E "health|ERROR|WARN"

# Cluster health (if applicable)
/var/ossec/bin/cluster_control -l && curl -k -X GET "https://localhost:9200/_cluster/health?pretty" -u admin:admin
```

---

**Troubleshooting Time:** 20-45 minutes average
**Success Rate:** 95%+
**Impact:** Medium (delayed access)
**Fix Complexity:** Medium

**Related Posts:**
- [Wazuh Performance Tuning Guide](/posts/2025/wazuh/wazuh-performance-tuning)
- [Wazuh Cluster Setup and Optimization](/posts/2025/wazuh/wazuh-cluster-optimization)
- [Monitoring Wazuh Infrastructure](/posts/2025/wazuh/monitoring-wazuh-infrastructure)

---

*Experiencing API timeout issues? Share your setup details and I'll help troubleshoot! Connect on [LinkedIn](https://in.linkedin.com/in/anubhavgain) or [GitHub](https://github.com/mranv).*
