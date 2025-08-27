---
title: "Podman Bare Metal Performance Analysis: Comprehensive Benchmarking and Optimization Guide"
slug: "podman-bare-metal-performance-analysis"
author: "Anubhav Gain"
pubDatetime: 2025-01-11T06:00:00Z
featured: false
draft: false
tags:
  - podman
  - containers
  - performance
  - bare-metal
  - benchmarking
  - optimization
  - container-runtime
  - devops
category: DevOps
description: "Comprehensive analysis of Podman performance on bare metal systems, including detailed benchmarks, optimization techniques, and production deployment strategies for high-performance container workloads."
---

# Podman Bare Metal Performance Analysis: Complete Guide

This comprehensive guide provides in-depth performance analysis of Podman on bare metal systems, covering benchmarking methodologies, optimization techniques, and production deployment strategies for achieving maximum container performance in enterprise environments.

## Table of Contents

## Understanding Podman Performance Characteristics

### Podman vs Traditional Container Runtimes

Podman offers several performance advantages over traditional container runtimes:

- **Daemonless Architecture**: Eliminates daemon overhead and reduces attack surface
- **Rootless Containers**: Enhanced security without significant performance penalty
- **Direct Kernel Integration**: Lower latency through direct system calls
- **Pod Support**: Native Kubernetes-style pod management
- **OCI Compliance**: Standard container runtime interface for maximum compatibility

### Performance Factors on Bare Metal

**Hardware Considerations:**

- **CPU Architecture**: x86_64 vs ARM64 performance characteristics
- **Memory Bandwidth**: Impact on container startup and runtime performance
- **Storage I/O**: NVMe vs SSD vs HDD container image and volume performance
- **Network Interface**: High-bandwidth networking for container communication

**System-Level Factors:**

- **Kernel Version**: Container runtime optimizations in recent kernels
- **cgroup Version**: cgroup v2 performance improvements
- **File System**: overlay2, fuse-overlayfs, and btrfs performance comparison
- **SELinux/AppArmor**: Security enforcement overhead analysis

## Comprehensive Performance Benchmarking

### Container Lifecycle Benchmarks

```bash
#!/bin/bash
# podman-performance-benchmark.sh - Comprehensive Podman performance testing

set -euo pipefail

# Configuration
TEST_IMAGE="registry.fedoraproject.org/fedora:38"
WORKLOAD_IMAGE="nginx:alpine"
ITERATIONS=100
RESULTS_DIR="./podman-benchmarks-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$RESULTS_DIR"

echo "=== Podman Bare Metal Performance Benchmark Suite ===" | tee "$RESULTS_DIR/summary.log"
echo "Date: $(date)" | tee -a "$RESULTS_DIR/summary.log"
echo "Host: $(hostname)" | tee -a "$RESULTS_DIR/summary.log"
echo "Kernel: $(uname -r)" | tee -a "$RESULTS_DIR/summary.log"
echo "Podman Version: $(podman version --format '{{.Client.Version}}')" | tee -a "$RESULTS_DIR/summary.log"

# Function to measure container startup time
measure_startup_time() {
    local image=$1
    local iterations=$2
    local test_name=$3

    echo "Running $test_name startup benchmark..." | tee -a "$RESULTS_DIR/summary.log"

    local startup_times=()
    for ((i=1; i<=iterations; i++)); do
        local start_time=$(date +%s.%N)
        podman run --rm "$image" echo "test" >/dev/null 2>&1
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc)
        startup_times+=("$duration")

        if ((i % 10 == 0)); then
            echo "  Completed $i/$iterations iterations"
        fi
    done

    # Calculate statistics
    local sum=0
    local min=${startup_times[0]}
    local max=${startup_times[0]}

    for time in "${startup_times[@]}"; do
        sum=$(echo "$sum + $time" | bc)
        if (($(echo "$time < $min" | bc -l))); then
            min=$time
        fi
        if (($(echo "$time > $max" | bc -l))); then
            max=$time
        fi
    done

    local avg=$(echo "scale=3; $sum / $iterations" | bc)

    echo "$test_name Results:" | tee -a "$RESULTS_DIR/startup-$test_name.log"
    echo "  Average: ${avg}s" | tee -a "$RESULTS_DIR/startup-$test_name.log"
    echo "  Minimum: ${min}s" | tee -a "$RESULTS_DIR/startup-$test_name.log"
    echo "  Maximum: ${max}s" | tee -a "$RESULTS_DIR/startup-$test_name.log"

    # Save raw data
    printf "%s\n" "${startup_times[@]}" > "$RESULTS_DIR/raw-startup-$test_name.dat"
}

# Function to measure memory overhead
measure_memory_overhead() {
    echo "Measuring memory overhead..." | tee -a "$RESULTS_DIR/summary.log"

    # Baseline memory usage
    local baseline_memory=$(free -m | awk '/^Mem:/ {print $3}')

    # Start containers and measure memory
    local container_count=50
    local containers=()

    for ((i=1; i<=container_count; i++)); do
        local container_id=$(podman run -d --rm "$WORKLOAD_IMAGE" sleep 300)
        containers+=("$container_id")

        if ((i % 10 == 0)); then
            local current_memory=$(free -m | awk '/^Mem:/ {print $3}')
            local overhead=$((current_memory - baseline_memory))
            echo "  $i containers: ${overhead}MB overhead" | tee -a "$RESULTS_DIR/memory-overhead.log"
        fi
    done

    # Cleanup
    for container in "${containers[@]}"; do
        podman stop "$container" >/dev/null 2>&1 || true
    done

    echo "Memory overhead test completed" | tee -a "$RESULTS_DIR/summary.log"
}

# Function to measure I/O performance
measure_io_performance() {
    echo "Measuring I/O performance..." | tee -a "$RESULTS_DIR/summary.log"

    # Sequential write test
    echo "  Testing sequential write performance..."
    podman run --rm -v "$RESULTS_DIR:/benchmark" "$TEST_IMAGE" \
        bash -c "dd if=/dev/zero of=/benchmark/test-write bs=1M count=1000 2>&1 | grep 'bytes transferred'" \
        | tee -a "$RESULTS_DIR/io-performance.log"

    # Sequential read test
    echo "  Testing sequential read performance..."
    podman run --rm -v "$RESULTS_DIR:/benchmark" "$TEST_IMAGE" \
        bash -c "dd if=/benchmark/test-write of=/dev/null bs=1M 2>&1 | grep 'bytes transferred'" \
        | tee -a "$RESULTS_DIR/io-performance.log"

    # Random I/O test with fio
    echo "  Testing random I/O performance..."
    podman run --rm -v "$RESULTS_DIR:/benchmark" quay.io/jitesoft/fio \
        fio --name=random-rw --ioengine=libaio --iodepth=32 --rw=randrw \
        --bs=4k --direct=1 --size=1G --numjobs=4 --runtime=60 \
        --group_reporting --filename=/benchmark/fio-test \
        | tee -a "$RESULTS_DIR/io-performance.log"

    # Cleanup
    rm -f "$RESULTS_DIR/test-write" "$RESULTS_DIR/fio-test"
}

# Function to measure network performance
measure_network_performance() {
    echo "Measuring network performance..." | tee -a "$RESULTS_DIR/summary.log"

    # Create a test network
    podman network create benchmark-net

    # Start iperf3 server
    local server_id=$(podman run -d --name iperf-server --network benchmark-net \
        quay.io/jitesoft/iperf3 iperf3 -s)

    sleep 5

    # Run client tests
    echo "  Testing TCP throughput..."
    podman run --rm --network benchmark-net quay.io/jitesoft/iperf3 \
        iperf3 -c iperf-server -t 30 -P 4 | tee -a "$RESULTS_DIR/network-performance.log"

    echo "  Testing UDP throughput..."
    podman run --rm --network benchmark-net quay.io/jitesoft/iperf3 \
        iperf3 -c iperf-server -u -b 1G -t 30 | tee -a "$RESULTS_DIR/network-performance.log"

    # Cleanup
    podman stop iperf-server >/dev/null 2>&1 || true
    podman rm iperf-server >/dev/null 2>&1 || true
    podman network rm benchmark-net >/dev/null 2>&1 || true
}

# Pre-pull images
echo "Pre-pulling test images..." | tee -a "$RESULTS_DIR/summary.log"
podman pull "$TEST_IMAGE" >/dev/null 2>&1
podman pull "$WORKLOAD_IMAGE" >/dev/null 2>&1
podman pull quay.io/jitesoft/fio >/dev/null 2>&1
podman pull quay.io/jitesoft/iperf3 >/dev/null 2>&1

# Run benchmarks
measure_startup_time "$TEST_IMAGE" 50 "basic-container"
measure_startup_time "$WORKLOAD_IMAGE" 30 "nginx-container"
measure_memory_overhead
measure_io_performance
measure_network_performance

# Generate summary
echo "=== Benchmark Summary ===" | tee -a "$RESULTS_DIR/summary.log"
echo "Results saved to: $RESULTS_DIR" | tee -a "$RESULTS_DIR/summary.log"
echo "Benchmark completed at: $(date)" | tee -a "$RESULTS_DIR/summary.log"

echo "Podman performance benchmark completed successfully!"
```

### CPU and Memory Profiling

```bash
#!/bin/bash
# podman-resource-profiling.sh - Detailed resource utilization analysis

# Function to profile CPU usage during container operations
profile_cpu_usage() {
    local test_name=$1
    local duration=$2

    echo "Profiling CPU usage for $test_name..."

    # Start system monitoring
    pidstat -u 1 $duration > "cpu-profile-$test_name.log" &
    local pidstat_pid=$!

    # Start container workload
    case $test_name in
        "startup-intensive")
            for ((i=1; i<=20; i++)); do
                podman run --rm registry.fedoraproject.org/fedora:38 \
                    bash -c "stress --cpu 4 --timeout 10s" &
            done
            wait
            ;;
        "memory-intensive")
            podman run --rm --memory=2g registry.fedoraproject.org/fedora:38 \
                bash -c "stress --vm 2 --vm-bytes 1G --timeout ${duration}s"
            ;;
        "io-intensive")
            podman run --rm -v "$(pwd):/workdir" registry.fedoraproject.org/fedora:38 \
                bash -c "dd if=/dev/zero of=/workdir/test bs=1M count=1000; rm /workdir/test"
            ;;
    esac

    # Stop monitoring
    kill $pidstat_pid 2>/dev/null || true
    wait $pidstat_pid 2>/dev/null || true
}

# Function to analyze memory patterns
analyze_memory_patterns() {
    echo "Analyzing memory usage patterns..."

    # Monitor memory during container lifecycle
    for operation in "pull" "create" "start" "stop" "rm"; do
        echo "Memory usage during: $operation"

        case $operation in
            "pull")
                free -m > "memory-before-$operation.log"
                podman pull registry.redhat.io/ubi8/ubi:latest >/dev/null 2>&1
                free -m > "memory-after-$operation.log"
                ;;
            "create")
                free -m > "memory-before-$operation.log"
                local container_id=$(podman create nginx:alpine)
                free -m > "memory-after-$operation.log"
                ;;
            "start")
                free -m > "memory-before-$operation.log"
                podman start $container_id >/dev/null 2>&1
                free -m > "memory-after-$operation.log"
                ;;
            "stop")
                free -m > "memory-before-$operation.log"
                podman stop $container_id >/dev/null 2>&1
                free -m > "memory-after-$operation.log"
                ;;
            "rm")
                free -m > "memory-before-$operation.log"
                podman rm $container_id >/dev/null 2>&1
                free -m > "memory-after-$operation.log"
                ;;
        esac

        # Calculate memory difference
        local before=$(grep "^Mem:" "memory-before-$operation.log" | awk '{print $3}')
        local after=$(grep "^Mem:" "memory-after-$operation.log" | awk '{print $3}')
        local diff=$((after - before))
        echo "  Memory change: ${diff}MB"
    done
}

# System information collection
collect_system_info() {
    echo "=== System Information ===" > system-info.log
    echo "Date: $(date)" >> system-info.log
    echo "Hostname: $(hostname)" >> system-info.log
    echo "Uptime: $(uptime)" >> system-info.log
    echo "" >> system-info.log

    echo "=== Hardware Information ===" >> system-info.log
    lscpu >> system-info.log
    echo "" >> system-info.log
    cat /proc/meminfo >> system-info.log
    echo "" >> system-info.log

    echo "=== Storage Information ===" >> system-info.log
    df -h >> system-info.log
    echo "" >> system-info.log
    lsblk >> system-info.log
    echo "" >> system-info.log

    echo "=== Container Runtime Information ===" >> system-info.log
    podman info >> system-info.log
    echo "" >> system-info.log
    podman system df >> system-info.log
}

# Run profiling
collect_system_info
profile_cpu_usage "startup-intensive" 60
profile_cpu_usage "memory-intensive" 120
profile_cpu_usage "io-intensive" 90
analyze_memory_patterns

echo "Resource profiling completed!"
```

## Performance Optimization Strategies

### System-Level Optimizations

**Kernel Parameters:**

```bash
# /etc/sysctl.d/99-podman-performance.conf
# Container-optimized kernel parameters

# Network performance
net.core.rmem_max = 268435456
net.core.wmem_max = 268435456
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.ipv4.tcp_rmem = 4096 87380 268435456
net.ipv4.tcp_wmem = 4096 65536 268435456
net.ipv4.tcp_congestion_control = bbr

# File system performance
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512

# Memory management
vm.swappiness = 1
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50

# Container-specific optimizations
kernel.pid_max = 4194304
kernel.threads-max = 1048576
```

**Storage Optimization:**

```bash
#!/bin/bash
# storage-optimization.sh - Optimize storage for Podman

# Configure optimal storage driver
configure_storage_driver() {
    local storage_conf="/etc/containers/storage.conf"

    # Backup original configuration
    cp "$storage_conf" "${storage_conf}.backup"

    # Configure overlay2 with optimizations
    cat > "$storage_conf" << EOF
[storage]
driver = "overlay"
runroot = "/run/containers/storage"
graphroot = "/var/lib/containers/storage"

[storage.options]
additionalimagestores = []

[storage.options.overlay]
mountopt = "nodev,metacopy=on"
size = ""
skip_mount_home = "false"
mount_program = "/usr/bin/fuse-overlayfs"

[storage.options.thinpool]
autoextend_percent = "20"
autoextend_threshold = "80"
basesize = "10G"
blocksize = "64k"
directlvm_device = ""
directlvm_device_force = "True"
fs = "xfs"
log_level = "7"
min_free_space = "10%"
mkfsarg = ""
size = ""
use_deferred_deletion = "True"
use_deferred_removal = "True"
xfs_nospace_max_retries = "0"
EOF

    echo "Storage configuration optimized"
}

# Optimize XFS filesystem for containers
optimize_xfs_filesystem() {
    local mount_point="/var/lib/containers"

    if df -T "$mount_point" | grep -q xfs; then
        echo "Configuring XFS optimizations..."

        # Add to /etc/fstab for persistent mount options
        local device=$(df "$mount_point" | tail -1 | awk '{print $1}')
        local uuid=$(blkid -s UUID -o value "$device")

        # XFS mount options for container workloads
        local mount_opts="rw,noatime,attr2,inode64,logbufs=8,logbsize=32k,noquota"

        echo "UUID=$uuid $mount_point xfs $mount_opts 0 2" >> /etc/fstab
        echo "XFS optimization configured. Reboot required for full effect."
    fi
}

# Configure container image caching
setup_image_caching() {
    # Create systemd service for image warming
    cat > /etc/systemd/system/podman-image-warming.service << EOF
[Unit]
Description=Podman Image Warming Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/warm-podman-images.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

    # Create image warming script
    cat > /usr/local/bin/warm-podman-images.sh << 'EOF'
#!/bin/bash
# Warm commonly used images

COMMON_IMAGES=(
    "registry.fedoraproject.org/fedora:38"
    "registry.redhat.io/ubi8/ubi:latest"
    "nginx:alpine"
    "redis:alpine"
    "postgres:alpine"
)

for image in "${COMMON_IMAGES[@]}"; do
    echo "Warming image: $image"
    podman pull "$image" || echo "Failed to pull $image"
done

echo "Image warming completed"
EOF

    chmod +x /usr/local/bin/warm-podman-images.sh
    systemctl enable podman-image-warming.service
}

configure_storage_driver
optimize_xfs_filesystem
setup_image_caching

echo "Storage optimization completed!"
```

### Container Runtime Optimizations

**Podman Configuration Tuning:**

```bash
#!/bin/bash
# podman-tuning.sh - Optimize Podman runtime configuration

# Function to optimize containers.conf
optimize_containers_conf() {
    local conf_file="/etc/containers/containers.conf"

    # Backup original configuration
    cp "$conf_file" "${conf_file}.backup" 2>/dev/null || true

    cat > "$conf_file" << EOF
[containers]
# Networking optimizations
default_sysctls = [
    "net.ipv4.ping_group_range=0 0",
    "net.ipv4.ip_unprivileged_port_start=80"
]

# Resource limits
default_ulimits = [
    "nofile=65536:65536",
    "nproc=8192:8192"
]

# Performance tuning
log_size_max = 10485760
pids_limit = 4096
shm_size = "256m"

# Security with performance balance
seccomp_profile = "/usr/share/containers/seccomp.json"
apparmor_profile = "containers-default-0.50.0"

[engine]
# Event logging optimization
events_logger = "journald"

# Image handling
image_default_transport = "docker://"
image_parallel_copies = 4

# Network configuration
network_backend = "netavark"
network_config_dir = "/etc/containers/networks"

# Runtime optimization
runtime = "crun"
static_dir = "/var/lib/containers/storage/libpod"
tmp_dir = "/var/tmp"

# Volume handling
volume_path = "/var/lib/containers/storage/volumes"

[machine]
# Machine-specific optimizations (if using podman machine)
cpus = 4
disk_size = 100
memory = 8192

[network]
# Network performance tuning
default_network = "podman"
default_subnet = "10.88.0.0/16"
default_subnet_pools = [
    {"base" = "10.89.0.0/16", "size" = 24},
    {"base" = "10.90.0.0/16", "size" = 24}
]
dns_bind_port = 53

[secrets]
driver = "file"
opts = {"path" = "/var/lib/containers/storage/secrets"}

[service_destinations]
# Service mesh optimization
EOF

    echo "containers.conf optimized for performance"
}

# Function to optimize registries.conf
optimize_registries_conf() {
    local conf_file="/etc/containers/registries.conf"

    # Backup original configuration
    cp "$conf_file" "${conf_file}.backup" 2>/dev/null || true

    cat > "$conf_file" << EOF
# Registry configuration optimized for performance

[registries.search]
registries = [
    "registry.fedoraproject.org",
    "registry.access.redhat.com",
    "docker.io",
    "quay.io"
]

[registries.insecure]
registries = []

[registries.block]
registries = []

# Performance optimizations
[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "mirror.gcr.io"
insecure = false

[[registry]]
prefix = "registry.fedoraproject.org"
location = "registry.fedoraproject.org"

[[registry]]
prefix = "quay.io"
location = "quay.io"

# Local registry cache (if available)
[[registry]]
prefix = "localhost:5000"
location = "localhost:5000"
insecure = true
EOF

    echo "registries.conf optimized for performance"
}

# Function to create performance monitoring script
create_performance_monitor() {
    cat > /usr/local/bin/podman-performance-monitor.sh << 'EOF'
#!/bin/bash
# Real-time Podman performance monitoring

INTERVAL=5
LOG_FILE="/var/log/podman-performance.log"

# Function to collect metrics
collect_metrics() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Container counts
    local running_containers=$(podman ps -q | wc -l)
    local total_containers=$(podman ps -a -q | wc -l)

    # System resources
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

    # Storage usage
    local storage_usage=$(podman system df --format "table {{.Type}}\t{{.Total}}\t{{.Size}}")

    # Network statistics
    local network_stats=$(podman network ls --format "table {{.Name}}\t{{.Driver}}")

    # Log metrics
    echo "[$timestamp] Containers: $running_containers/$total_containers, CPU: ${cpu_usage}%, Memory: ${memory_usage}%" >> "$LOG_FILE"

    # Alert on high resource usage
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        logger -t podman-monitor "HIGH CPU USAGE: ${cpu_usage}%"
    fi

    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        logger -t podman-monitor "HIGH MEMORY USAGE: ${memory_usage}%"
    fi
}

# Main monitoring loop
while true; do
    collect_metrics
    sleep $INTERVAL
done
EOF

    chmod +x /usr/local/bin/podman-performance-monitor.sh

    # Create systemd service for monitoring
    cat > /etc/systemd/system/podman-performance-monitor.service << EOF
[Unit]
Description=Podman Performance Monitor
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/local/bin/podman-performance-monitor.sh
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl enable podman-performance-monitor.service
    echo "Performance monitoring service created"
}

# Run optimizations
optimize_containers_conf
optimize_registries_conf
create_performance_monitor

echo "Podman runtime optimization completed!"
```

## Production Deployment Strategies

### High-Performance Container Orchestration

```yaml
# high-performance-pod.yaml - Optimized pod configuration
apiVersion: v1
kind: Pod
metadata:
  name: high-performance-app
  annotations:
    io.podman.annotations/init: "false"
    io.podman.annotations/privileged: "false"
    io.podman.annotations/publish: "8080:8080"
spec:
  restartPolicy: Always
  containers:
    - name: app-container
      image: nginx:alpine
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      securityContext:
        allowPrivilegeEscalation: false
        runAsNonRoot: true
        runAsUser: 1000
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
      volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
        - name: cache-volume
          mountPath: /var/cache/nginx
        - name: run-volume
          mountPath: /var/run
  volumes:
    - name: tmp-volume
      emptyDir:
        medium: Memory
        sizeLimit: 64Mi
    - name: cache-volume
      emptyDir:
        sizeLimit: 128Mi
    - name: run-volume
      emptyDir:
        medium: Memory
        sizeLimit: 32Mi
```

### Automated Performance Testing Pipeline

```bash
#!/bin/bash
# performance-ci-pipeline.sh - Automated performance testing for containers

set -euo pipefail

# Configuration
BASELINE_THRESHOLD=5.0  # seconds
MEMORY_THRESHOLD=512    # MB
CI_MODE=${CI_MODE:-false}
RESULTS_DIR="performance-results-$(date +%Y%m%d-%H%M%S)"

# Function to run performance regression tests
run_regression_tests() {
    echo "Running performance regression tests..."

    mkdir -p "$RESULTS_DIR"

    # Test 1: Container startup time
    local startup_times=()
    for ((i=1; i<=10; i++)); do
        local start_time=$(date +%s.%N)
        podman run --rm nginx:alpine echo "test" >/dev/null 2>&1
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc)
        startup_times+=("$duration")
    done

    # Calculate average startup time
    local sum=0
    for time in "${startup_times[@]}"; do
        sum=$(echo "$sum + $time" | bc)
    done
    local avg_startup=$(echo "scale=3; $sum / 10" | bc)

    echo "Average startup time: ${avg_startup}s" | tee "$RESULTS_DIR/startup-time.log"

    # Check against baseline
    if (( $(echo "$avg_startup > $BASELINE_THRESHOLD" | bc -l) )); then
        echo "ERROR: Startup time regression detected!" >&2
        echo "Expected: < ${BASELINE_THRESHOLD}s, Got: ${avg_startup}s" >&2
        if [[ "$CI_MODE" == "true" ]]; then
            exit 1
        fi
    fi

    # Test 2: Memory usage
    local container_id=$(podman run -d nginx:alpine sleep 60)
    sleep 5

    local memory_usage=$(podman stats --no-stream --format "table {{.MemUsage}}" "$container_id" | tail -1 | awk '{print $1}' | sed 's/MiB//')

    echo "Memory usage: ${memory_usage}MB" | tee "$RESULTS_DIR/memory-usage.log"

    # Check against threshold
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        echo "WARNING: High memory usage detected!" >&2
        echo "Threshold: ${MEMORY_THRESHOLD}MB, Got: ${memory_usage}MB" >&2
    fi

    # Cleanup
    podman stop "$container_id" >/dev/null 2>&1 || true

    echo "Regression tests completed successfully"
}

# Function to generate performance report
generate_performance_report() {
    echo "Generating performance report..."

    cat > "$RESULTS_DIR/performance-report.md" << EOF
# Podman Performance Test Report

**Date**: $(date)
**System**: $(hostname)
**Podman Version**: $(podman version --format '{{.Client.Version}}')

## Test Results

### Container Startup Performance
- Average startup time: $(cat "$RESULTS_DIR/startup-time.log" | grep "Average" | awk '{print $4}')
- Baseline threshold: ${BASELINE_THRESHOLD}s
- Status: $(if (( $(echo "$(cat "$RESULTS_DIR/startup-time.log" | grep "Average" | awk '{print $4}' | sed 's/s//') <= $BASELINE_THRESHOLD" | bc -l) )); then echo "PASS"; else echo "FAIL"; fi)

### Memory Usage
- Container memory usage: $(cat "$RESULTS_DIR/memory-usage.log" | grep "Memory" | awk '{print $3}')
- Memory threshold: ${MEMORY_THRESHOLD}MB
- Status: $(if (( $(echo "$(cat "$RESULTS_DIR/memory-usage.log" | grep "Memory" | awk '{print $3}' | sed 's/MB//') <= $MEMORY_THRESHOLD" | bc -l) )); then echo "PASS"; else echo "WARNING"; fi)

## System Information

\`\`\`
$(podman info)
\`\`\`

## Recommendations

$(if (( $(echo "$(cat "$RESULTS_DIR/startup-time.log" | grep "Average" | awk '{print $4}' | sed 's/s//') > $BASELINE_THRESHOLD" | bc -l) )); then
    echo "- Consider optimizing container startup time"
    echo "- Review image layers and optimize Dockerfile"
    echo "- Check storage driver performance"
fi)

$(if (( $(echo "$(cat "$RESULTS_DIR/memory-usage.log" | grep "Memory" | awk '{print $3}' | sed 's/MB//') > $MEMORY_THRESHOLD" | bc -l) )); then
    echo "- Review memory usage patterns"
    echo "- Consider reducing container resource allocation"
    echo "- Optimize application memory usage"
fi)
EOF

    echo "Performance report generated: $RESULTS_DIR/performance-report.md"
}

# Main execution
echo "Starting Podman performance testing pipeline..."

# Pre-pull test images
podman pull nginx:alpine >/dev/null 2>&1

# Run tests
run_regression_tests
generate_performance_report

echo "Performance testing pipeline completed!"
echo "Results available in: $RESULTS_DIR"
```

## Best Practices and Recommendations

### Security-Performance Balance

1. **Rootless Containers**: Use rootless mode for security without significant performance impact
2. **Resource Limits**: Set appropriate CPU and memory limits to prevent resource exhaustion
3. **Read-Only Filesystems**: Use read-only root filesystems with tmpfs for write operations
4. **Minimal Images**: Use Alpine or distroless images for reduced attack surface and faster startup

### Monitoring and Observability

```bash
#!/bin/bash
# monitoring-setup.sh - Comprehensive monitoring for Podman

# Install and configure Prometheus node exporter
setup_prometheus_monitoring() {
    # Create podman metrics exporter
    cat > /usr/local/bin/podman-metrics-exporter.py << 'EOF'
#!/usr/bin/env python3
import json
import subprocess
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            metrics = self.collect_podman_metrics()
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(metrics.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def collect_podman_metrics(self):
        metrics = []

        # Container count metrics
        try:
            running = subprocess.check_output(['podman', 'ps', '-q']).decode().strip().split('\n')
            running_count = len([x for x in running if x])
            metrics.append(f'podman_containers_running {running_count}')

            all_containers = subprocess.check_output(['podman', 'ps', '-a', '-q']).decode().strip().split('\n')
            total_count = len([x for x in all_containers if x])
            metrics.append(f'podman_containers_total {total_count}')
        except:
            metrics.append('podman_containers_running 0')
            metrics.append('podman_containers_total 0')

        # Image count metrics
        try:
            images = subprocess.check_output(['podman', 'images', '-q']).decode().strip().split('\n')
            image_count = len([x for x in images if x])
            metrics.append(f'podman_images_total {image_count}')
        except:
            metrics.append('podman_images_total 0')

        # Storage metrics
        try:
            df_output = subprocess.check_output(['podman', 'system', 'df', '--format', 'json']).decode()
            storage_data = json.loads(df_output)

            for item in storage_data:
                item_type = item.get('Type', '').lower()
                size = item.get('Size', 0)
                reclaimable = item.get('Reclaimable', 0)

                metrics.append(f'podman_storage_size_bytes{{type="{item_type}"}} {size}')
                metrics.append(f'podman_storage_reclaimable_bytes{{type="{item_type}"}} {reclaimable}')
        except:
            pass

        return '\n'.join(metrics) + '\n'

if __name__ == '__main__':
    server = HTTPServer(('localhost', 9101), MetricsHandler)
    print("Podman metrics exporter started on port 9101")
    server.serve_forever()
EOF

    chmod +x /usr/local/bin/podman-metrics-exporter.py

    # Create systemd service
    cat > /etc/systemd/system/podman-metrics-exporter.service << EOF
[Unit]
Description=Podman Metrics Exporter
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/local/bin/podman-metrics-exporter.py
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl enable podman-metrics-exporter.service
    systemctl start podman-metrics-exporter.service

    echo "Podman metrics exporter configured on port 9101"
}

# Setup log aggregation
setup_log_aggregation() {
    # Configure journald for container logs
    cat > /etc/systemd/journald.conf.d/containers.conf << EOF
[Journal]
SystemMaxUse=2G
SystemKeepFree=1G
SystemMaxFileSize=128M
RuntimeMaxUse=512M
RuntimeKeepFree=256M
MaxRetentionSec=7day
EOF

    systemctl restart systemd-journald

    echo "Log aggregation configured"
}

setup_prometheus_monitoring
setup_log_aggregation

echo "Monitoring setup completed!"
```

## Conclusion

Podman on bare metal offers exceptional performance characteristics for containerized workloads when properly configured and optimized. Key takeaways:

1. **Daemonless Architecture**: Provides lower overhead and better security
2. **Proper System Tuning**: Kernel parameters and storage optimization significantly impact performance
3. **Resource Management**: Appropriate limits and monitoring prevent performance degradation
4. **Regular Benchmarking**: Continuous performance testing ensures optimal configuration

By following the benchmarking methodologies, optimization techniques, and best practices outlined in this guide, you can achieve optimal Podman performance on bare metal systems for production workloads.
