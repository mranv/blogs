---
author: Anubhav Gain
pubDatetime: 2025-08-02T15:00:00+05:30
tags:
  - ebpf
  - security
  - linux
  - falco
  - tetragon
  - tracee
  - security-tools
modDatetime: 2025-08-02T15:00:00+05:30
title: "Practical Guide to eBPF Security Tools: From Detection to Prevention"
slug: ebpf-security-tools-practical-guide
featured: true
draft: false
category: eBPF
description: A hands-on guide to implementing eBPF security tools in production. Learn to deploy Falco, Tetragon, Tracee, and build custom security solutions with real-world examples.
---

# Practical Guide to eBPF Security Tools: From Detection to Prevention

While understanding eBPF's security capabilities is crucial, implementing these tools in production requires practical knowledge. This guide walks through deploying and customizing major eBPF security tools, building custom solutions, and integrating them into your security infrastructure.

## Tool Overview: Choosing the Right Solution

### Quick Comparison Matrix

| Tool            | Primary Focus                        | Best For                       | Learning Curve | Performance Impact |
| --------------- | ------------------------------------ | ------------------------------ | -------------- | ------------------ |
| **Falco**       | Runtime threat detection             | Cloud-native environments      | Low            | Low (5-10%)        |
| **Tetragon**    | Security observability & enforcement | Kubernetes security            | Medium         | Very Low (2-5%)    |
| **Tracee**      | Security event tracking              | Forensics & investigation      | Low            | Low (5-10%)        |
| **KubeArmor**   | Container runtime protection         | Kubernetes workload protection | Medium         | Low (3-8%)         |
| **Custom eBPF** | Specific security needs              | Unique requirements            | High           | Variable           |

## Falco: Cloud-Native Runtime Security

### Installation and Setup

```bash
# Method 1: Using Helm (Recommended for Kubernetes)
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

# Install with eBPF probe
helm install falco falcosecurity/falco \
  --set driver.kind=modern_ebpf \
  --set driver.modernEbpf.leastPrivileged=true \
  --set tty=true

# Method 2: Standalone installation
curl -fsSL https://falco.org/script/install | sudo bash
sudo systemctl start falco-modern-bpf
```

### Custom Rules Development

```yaml
# /etc/falco/rules.d/custom-security.yaml

# Rule 1: Detect cryptocurrency mining
- rule: Detect Crypto Mining
  desc: Detect cryptocurrency mining activities
  condition: >
    spawned_process and (
      proc.name in (xmrig, minerd, minergate, ethminer) or
      (proc.cmdline contains "stratum+tcp" or 
       proc.cmdline contains "pool.") or
      (proc.name in (python, python3, perl, ruby) and
       proc.cmdline contains "cryptonight")
    )
  output: >
    Crypto mining process detected (user=%user.name user_id=%user.uid 
    command=%proc.cmdline container_id=%container.id image=%container.image.repository)
  priority: WARNING
  tags: 
  - cryptomining
  - threat

# Rule 2: Detect reverse shell
- rule: Reverse Shell Detection
  desc: Detect reverse shell connections
  condition: >
    inbound_outbound and
    ((proc.name in (bash, sh, zsh) and proc.args contains "-i") or
     (proc.name = "nc" and 
      (proc.args contains "-e" or proc.args contains "-c")) or
     (proc.name in (python, python3) and 
      proc.args contains "socket" and 
      proc.args contains "subprocess"))
  output: >
    Reverse shell detected (user=%user.name command=%proc.cmdline 
    connection=%fd.name container=%container.name)
  priority: CRITICAL
  tags: 
  - reverse_shell
  - threat

# Rule 3: Sensitive file access monitoring
- rule: Unauthorized Sensitive File Access
  desc: Detect access to sensitive configuration files
  condition: >
    open_read and 
    (fd.name startswith /etc/shadow or
     fd.name startswith /etc/sudoers or
     fd.name contains ".kube/config" or
     fd.name contains "id_rsa" or
     fd.name contains ".aws/credentials") and
    not proc.name in (passwd, chpasswd, shadow, sudo, sshd)
  output: >
    Sensitive file accessed (user=%user.name file=%fd.name 
    command=%proc.cmdline container=%container.name)
  priority: WARNING
  tags: 
  - sensitive_files
  - configuration

# Rule 4: Container escape detection
- rule: Container Escape Attempt
  desc: Detect potential container escape attempts
  condition: >
    container.id != host and (
      (evt.type = setns and evt.dir=<) or
      (proc.name in (nsenter) and not proc.user.name = root) or
      (filesystem.mount and 
       (filesystem.mount.source contains "/proc" or 
        filesystem.mount.source contains "/sys"))
    )
  output: >
    Container escape attempt (user=%user.name command=%proc.cmdline 
    container=%container.name syscall=%evt.type)
  priority: CRITICAL
  tags: 
  - container_escape
  - threat
```

### Advanced Falco Configuration

```yaml
# /etc/falco/falco.yaml

# Performance tuning
syscall_event_drops:
  actions:
    - log
    - alert
  rate: 0.03 # Alert if drop rate > 3%
  max_burst: 10

# Custom output channels
outputs:
  rate: 1000 # Max 1000 messages/sec
  max_burst: 10000

# Enable gRPC output for integration
grpc:
  bind_address: "unix:///run/falco/falco.sock"
  threadiness: 4

# JSON output for SIEM integration
json_output: true
json_include_output_property: true

# Buffer size for event processing
buf_size_preset: 4 # 4 = 16MB, good for high-load systems
```

### Integration with Alerting Systems

```python
# falco_to_slack.py - Send Falco alerts to Slack
import json
import requests
from flask import Flask, request

app = Flask(__name__)
SLACK_WEBHOOK = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

@app.route('/falco', methods=['POST'])
def handle_falco_alert():
    alert = request.json

    # Parse Falco alert
    priority = alert.get('priority', 'INFO')
    output = alert.get('output', 'Unknown alert')
    rule = alert.get('rule', 'Unknown rule')

    # Color based on priority
    color_map = {
        'CRITICAL': '#FF0000',
        'WARNING': '#FFA500',
        'INFO': '#0000FF'
    }

    # Send to Slack
    slack_message = {
        "attachments": [{
            "color": color_map.get(priority, '#808080'),
            "title": f"Falco Alert: {rule}",
            "text": output,
            "fields": [
                {"title": "Priority", "value": priority, "short": True},
                {"title": "Rule", "value": rule, "short": True}
            ]
        }]
    }

    requests.post(SLACK_WEBHOOK, json=slack_message)
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## Tetragon: Advanced Security Observability

### Installation

```bash
# Kubernetes deployment
helm repo add cilium https://helm.cilium.io
helm repo update

helm install tetragon cilium/tetragon \
  --namespace kube-system \
  --set tetragon.enableProcessCred=true \
  --set tetragon.enableProcessNs=true

# Verify installation
kubectl -n kube-system get pods -l app.kubernetes.io/name=tetragon
```

### TracingPolicy Examples

```yaml
# network-monitoring.yaml - Monitor suspicious network connections
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: network-security-monitoring
spec:
  kprobes:
    - call: "tcp_connect"
      syscall: false
      args:
        - index: 0
          type: "sock"
      selectors:
        - matchArgs:
            - index: 0
              operator: "NotDPort"
              values:
                - 80
                - 443
                - 22
          matchActions:
            - action: Sigkill
              argError: -1
        - matchArgs:
            - index: 0
              operator: "DAddr"
              values:
                - "10.0.0.0/8"
                - "172.16.0.0/12"
                - "192.168.0.0/16"
          matchActions:
            - action: NoPost # Don't kill, just log

---
# file-integrity.yaml - File integrity monitoring
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: file-integrity-monitoring
spec:
  kprobes:
    - call: "security_file_open"
      syscall: false
      args:
        - index: 0
          type: "file"
        - index: 1
          type: "int"
      selectors:
        - matchArgs:
            - index: 0
              operator: "Prefix"
              values:
                - "/etc/"
                - "/usr/bin/"
                - "/usr/sbin/"
            - index: 1
              operator: "Equal"
              values:
                - "2" # O_RDWR
          matchActions:
            - action: Post

---
# process-execution.yaml - Monitor process execution
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: process-execution-monitoring
spec:
  tracepoints:
    - subsystem: "sched"
      event: "sched_process_exec"
      args:
        - index: 0
          type: "string"
      selectors:
        - matchArgs:
            - index: 0
              operator: "In"
              values:
                - "curl"
                - "wget"
                - "nc"
                - "ncat"
                - "socat"
          matchBinaries:
            - operator: "NotIn"
              values:
                - "/usr/bin/apt"
                - "/usr/bin/yum"
          matchActions:
            - action: Post
              rateLimit: 10 # Max 10 events per second
```

### Custom Event Processing

```go
// tetragon-processor/main.go - Process Tetragon events
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "os"

    "github.com/cilium/tetragon/api/v1/tetragon"
    "google.golang.org/grpc"
)

type SecurityEvent struct {
    Type      string                 `json:"type"`
    Timestamp string                 `json:"timestamp"`
    Process   map[string]interface{} `json:"process"`
    Parent    map[string]interface{} `json:"parent"`
    Args      []string              `json:"args"`
    Action    string                `json:"action"`
}

func processEvent(event *tetragon.GetEventsResponse) {
    switch ev := event.Event.(type) {
    case *tetragon.GetEventsResponse_ProcessExec:
        handleProcessExec(ev.ProcessExec)
    case *tetragon.GetEventsResponse_ProcessExit:
        handleProcessExit(ev.ProcessExit)
    case *tetragon.GetEventsResponse_ProcessKprobe:
        handleKprobeEvent(ev.ProcessKprobe)
    }
}

func handleProcessExec(exec *tetragon.ProcessExec) {
    // Check for suspicious process execution patterns
    binary := exec.Process.Binary
    args := exec.Process.Arguments

    // Detect reverse shell patterns
    if isReverseShell(binary, args) {
        alert := SecurityEvent{
            Type:      "REVERSE_SHELL",
            Timestamp: exec.Process.ExecTime.String(),
            Process: map[string]interface{}{
                "binary": binary,
                "pid":    exec.Process.Pid.Value,
                "uid":    exec.Process.Uid.Value,
            },
            Args:   args,
            Action: "BLOCKED",
        }
        sendAlert(alert)
    }
}

func isReverseShell(binary string, args []string) bool {
    // Implement detection logic
    suspiciousBinaries := []string{"nc", "ncat", "socat", "bash", "sh"}
    suspiciousArgs := []string{"-e", "-c", "exec", "socket"}

    for _, b := range suspiciousBinaries {
        if binary == b {
            for _, arg := range args {
                for _, s := range suspiciousArgs {
                    if arg == s {
                        return true
                    }
                }
            }
        }
    }
    return false
}

func main() {
    // Connect to Tetragon
    conn, err := grpc.Dial("localhost:54321", grpc.WithInsecure())
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := tetragon.NewFineGuidanceSensorsClient(conn)
    stream, err := client.GetEvents(context.Background(), &tetragon.GetEventsRequest{})
    if err != nil {
        log.Fatal(err)
    }

    // Process events
    for {
        event, err := stream.Recv()
        if err != nil {
            log.Printf("Error receiving event: %v", err)
            continue
        }
        processEvent(event)
    }
}
```

## Tracee: Security Runtime Observability

### Advanced Deployment

```bash
# Deploy with specific event filters
docker run --rm -it \
  --pid=host --cgroupns=host --privileged \
  -v /etc/os-release:/etc/os-release-host:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e LIBBPFGO_OSRELEASE_FILE=/etc/os-release-host \
  aquasec/tracee:latest \
  --output json \
  --filter event=security_file_open,security_inode_rename \
  --filter comm=bash,sh,python \
  --filter pid=new \
  --capture exec \
  --capture mem
```

### Custom Signatures

```go
// custom-signature.go - Detect privilege escalation
package main

import (
    "fmt"
    "github.com/aquasecurity/tracee/signatures/helpers"
    "github.com/aquasecurity/tracee/types/detect"
    "github.com/aquasecurity/tracee/types/protocol"
    "github.com/aquasecurity/tracee/types/trace"
)

type PrivilegeEscalation struct {
    cb detect.SignatureHandler
}

func (sig *PrivilegeEscalation) Init(cb detect.SignatureHandler) error {
    sig.cb = cb
    return nil
}

func (sig *PrivilegeEscalation) GetMetadata() (detect.SignatureMetadata, error) {
    return detect.SignatureMetadata{
        ID:          "CUSTOM-001",
        Version:     "1.0.0",
        Name:        "Privilege Escalation Detection",
        Description: "Detects potential privilege escalation attempts",
        Properties: map[string]interface{}{
            "Severity": "Critical",
            "Category": "Threat",
        },
    }, nil
}

func (sig *PrivilegeEscalation) GetSelectedEvents() ([]detect.SignatureEventSelector, error) {
    return []detect.SignatureEventSelector{
        {Source: "tracee", Name: "sched_process_exec"},
        {Source: "tracee", Name: "setuid"},
        {Source: "tracee", Name: "setgid"},
        {Source: "tracee", Name: "capset"},
    }, nil
}

func (sig *PrivilegeEscalation) OnEvent(event protocol.Event) error {
    ee, ok := event.Payload.(trace.Event)
    if !ok {
        return fmt.Errorf("invalid event")
    }

    switch ee.EventName {
    case "setuid":
        uid, _ := helpers.GetTraceeIntArgumentByName(ee, "uid")
        if uid == 0 && ee.ProcessUID != 0 {
            // Non-root becoming root
            sig.cb(detect.Finding{
                SigMetadata: sig.GetMetadata(),
                Event:       event,
                Data: map[string]interface{}{
                    "process": ee.ProcessName,
                    "pid":     ee.ProcessID,
                    "oldUID":  ee.ProcessUID,
                    "newUID":  uid,
                },
            })
        }
    }

    return nil
}
```

### Output Processing Pipeline

```python
# tracee_processor.py - Process Tracee JSON output
import json
import sys
from datetime import datetime
from elasticsearch import Elasticsearch

es = Elasticsearch(['localhost:9200'])

def process_tracee_event(event):
    """Process and enrich Tracee events for Elasticsearch"""

    # Parse event
    parsed = {
        'timestamp': datetime.utcnow(),
        'event_name': event.get('eventName'),
        'process': {
            'name': event.get('processName'),
            'pid': event.get('processId'),
            'uid': event.get('uid'),
            'binary': event.get('executable', {}).get('path')
        },
        'container': {
            'id': event.get('containerId'),
            'name': event.get('containerName')
        },
        'severity': classify_severity(event),
        'raw_event': event
    }

    # Add detection tags
    if is_suspicious_event(event):
        parsed['tags'] = ['suspicious', 'security']
        parsed['severity'] = 'high'

    return parsed

def classify_severity(event):
    """Classify event severity based on type and context"""
    high_severity_events = [
        'security_file_open', 'security_task_setuid',
        'process_vm_write', 'ptrace'
    ]

    if event.get('eventName') in high_severity_events:
        return 'high'

    if event.get('uid') == 0:  # Root activity
        return 'medium'

    return 'low'

def is_suspicious_event(event):
    """Detect suspicious patterns"""
    suspicious_patterns = [
        lambda e: e.get('eventName') == 'execve' and '/tmp' in e.get('pathname', ''),
        lambda e: e.get('eventName') == 'open' and '/etc/shadow' in e.get('pathname', ''),
        lambda e: e.get('processName') in ['nc', 'ncat', 'socat'],
    ]

    return any(pattern(event) for pattern in suspicious_patterns)

def main():
    for line in sys.stdin:
        try:
            event = json.loads(line)
            processed = process_tracee_event(event)

            # Index to Elasticsearch
            es.index(
                index=f"tracee-{datetime.utcnow().strftime('%Y.%m.%d')}",
                body=processed
            )

            # Alert on high severity
            if processed['severity'] == 'high':
                send_alert(processed)

        except json.JSONDecodeError:
            continue
        except Exception as e:
            print(f"Error processing event: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
```

## Building Custom eBPF Security Tools

### Project Structure

```bash
custom-security-tool/
├── src/
│   ├── bpf/
│   │   ├── security_monitor.bpf.c
│   │   └── maps.h
│   ├── user/
│   │   ├── main.c
│   │   ├── event_processor.c
│   │   └── alerts.c
├── include/
│   └── security_events.h
├── Makefile
└── README.md
```

### Core eBPF Program

```c
// src/bpf/security_monitor.bpf.c
#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>
#include "maps.h"

// Define security event types
enum security_event_type {
    SEC_EVENT_PROCESS_EXEC = 1,
    SEC_EVENT_FILE_ACCESS,
    SEC_EVENT_NETWORK_CONNECT,
    SEC_EVENT_PRIVILEGE_CHANGE,
};

struct security_event {
    u64 timestamp;
    u32 pid;
    u32 uid;
    u32 gid;
    enum security_event_type type;
    char comm[16];
    union {
        struct {
            char filename[256];
            u32 flags;
        } file;
        struct {
            u32 addr;
            u16 port;
        } network;
        struct {
            u32 old_uid;
            u32 new_uid;
        } privilege;
    } data;
};

// Maps
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 24); // 16MB
} events SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10000);
    __type(key, u32);
    __type(value, struct process_info);
} processes SEC(".maps");

// Monitor process execution
SEC("tracepoint/sched/sched_process_exec")
int monitor_exec(struct trace_event_raw_sched_process_exec *ctx) {
    struct security_event *event;
    struct task_struct *task;

    event = bpf_ringbuf_reserve(&events, sizeof(*event), 0);
    if (!event)
        return 0;

    // Fill event data
    event->timestamp = bpf_ktime_get_ns();
    event->pid = bpf_get_current_pid_tgid() >> 32;
    event->uid = bpf_get_current_uid_gid() & 0xFFFFFFFF;
    event->gid = bpf_get_current_uid_gid() >> 32;
    event->type = SEC_EVENT_PROCESS_EXEC;

    bpf_get_current_comm(&event->comm, sizeof(event->comm));

    // Get executable path
    task = (struct task_struct *)bpf_get_current_task();
    struct mm_struct *mm = BPF_CORE_READ(task, mm);
    struct file *exe_file = BPF_CORE_READ(mm, exe_file);

    if (exe_file) {
        struct path f_path = BPF_CORE_READ(exe_file, f_path);
        bpf_d_path(&f_path, event->data.file.filename,
                   sizeof(event->data.file.filename));
    }

    bpf_ringbuf_submit(event, 0);
    return 0;
}

// Monitor sensitive file access
SEC("lsm/file_open")
int monitor_file_open(struct file *file) {
    struct security_event *event;
    char filename[256];

    // Get filename
    bpf_d_path(&file->f_path, filename, sizeof(filename));

    // Check if it's a sensitive file
    if (!is_sensitive_file(filename))
        return 0;

    event = bpf_ringbuf_reserve(&events, sizeof(*event), 0);
    if (!event)
        return 0;

    event->timestamp = bpf_ktime_get_ns();
    event->pid = bpf_get_current_pid_tgid() >> 32;
    event->uid = bpf_get_current_uid_gid() & 0xFFFFFFFF;
    event->type = SEC_EVENT_FILE_ACCESS;

    bpf_probe_read_str(event->data.file.filename,
                       sizeof(event->data.file.filename),
                       filename);

    bpf_ringbuf_submit(event, 0);
    return 0;
}

// Helper to check sensitive files
static __always_inline bool is_sensitive_file(const char *filename) {
    const char sensitive_paths[][32] = {
        "/etc/shadow",
        "/etc/passwd",
        "/etc/sudoers",
        ".ssh/id_rsa",
        ".kube/config",
    };

    #pragma unroll
    for (int i = 0; i < 5; i++) {
        if (str_contains(filename, sensitive_paths[i]))
            return true;
    }

    return false;
}
```

### User-Space Component

```c
// src/user/main.c
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include "security_monitor.skel.h"
#include "security_events.h"

static volatile bool running = true;

static void sig_handler(int sig) {
    running = false;
}

static int handle_event(void *ctx, void *data, size_t data_sz) {
    struct security_event *event = data;

    switch (event->type) {
    case SEC_EVENT_PROCESS_EXEC:
        printf("[EXEC] PID=%d UID=%d CMD=%s PATH=%s\n",
               event->pid, event->uid, event->comm,
               event->data.file.filename);
        break;

    case SEC_EVENT_FILE_ACCESS:
        printf("[FILE] PID=%d UID=%d FILE=%s\n",
               event->pid, event->uid,
               event->data.file.filename);

        // Send alert for critical files
        if (strstr(event->data.file.filename, "/etc/shadow")) {
            send_critical_alert(event);
        }
        break;
    }

    return 0;
}

int main(int argc, char **argv) {
    struct security_monitor_bpf *skel;
    struct ring_buffer *rb = NULL;
    int err;

    // Set up signal handler
    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);

    // Load and verify BPF program
    skel = security_monitor_bpf__open();
    if (!skel) {
        fprintf(stderr, "Failed to open BPF skeleton\n");
        return 1;
    }

    // Load & verify BPF programs
    err = security_monitor_bpf__load(skel);
    if (err) {
        fprintf(stderr, "Failed to load BPF skeleton\n");
        goto cleanup;
    }

    // Attach programs
    err = security_monitor_bpf__attach(skel);
    if (err) {
        fprintf(stderr, "Failed to attach BPF programs\n");
        goto cleanup;
    }

    // Set up ring buffer
    rb = ring_buffer__new(bpf_map__fd(skel->maps.events),
                          handle_event, NULL, NULL);
    if (!rb) {
        fprintf(stderr, "Failed to create ring buffer\n");
        goto cleanup;
    }

    printf("Security monitor running... Press Ctrl-C to stop.\n");

    // Poll for events
    while (running) {
        err = ring_buffer__poll(rb, 100 /* timeout, ms */);
        if (err == -EINTR) {
            err = 0;
            break;
        }
        if (err < 0) {
            fprintf(stderr, "Error polling ring buffer: %d\n", err);
            break;
        }
    }

cleanup:
    ring_buffer__free(rb);
    security_monitor_bpf__destroy(skel);
    return err < 0 ? -err : 0;
}
```

## Production Deployment Best Practices

### 1. Resource Management

```yaml
# kubernetes-resources.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ebpf-security-quota
spec:
  hard:
    cpu: "4"
    memory: "8Gi"
    persistentvolumeclaims: "2"

---
apiVersion: v1
kind: LimitRange
metadata:
  name: ebpf-security-limits
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: "1Gi"
      defaultRequest:
        cpu: "100m"
        memory: "256Mi"
```

### 2. Monitoring eBPF Performance

```bash
#!/bin/bash
# monitor-ebpf.sh - Monitor eBPF program performance

# Check BPF program statistics
bpftool prog show | grep -E "name|run_time_ns|run_cnt"

# Monitor map usage
for map in $(bpftool map show | grep -E "id" | awk '{print $2}'); do
    echo "Map $map:"
    bpftool map show id $map
    echo "Entries: $(bpftool map dump id $map | wc -l)"
    echo "---"
done

# Check for dropped events
cat /sys/kernel/debug/tracing/trace_pipe | grep -i "lost"

# Monitor CPU usage by eBPF programs
perf record -e bpf:* -a -g -- sleep 10
perf report
```

### 3. Security Hardening Checklist

```bash
# eBPF Security Hardening Script
#!/bin/bash

echo "Applying eBPF security hardening..."

# 1. Disable unprivileged eBPF
sysctl -w kernel.unprivileged_bpf_disabled=1
echo "kernel.unprivileged_bpf_disabled=1" >> /etc/sysctl.conf

# 2. Restrict BPF JIT
sysctl -w net.core.bpf_jit_harden=2
echo "net.core.bpf_jit_harden=2" >> /etc/sysctl.conf

# 3. Set up audit rules
cat >> /etc/audit/rules.d/ebpf.rules <<EOF
-a always,exit -F arch=b64 -S bpf -F a0=5 -k ebpf_load
-a always,exit -F arch=b64 -S bpf -F a0=6 -k ebpf_attach
EOF

# 4. Configure AppArmor/SELinux
# Example AppArmor profile
cat > /etc/apparmor.d/ebpf-security <<EOF
#include <tunables/global>

profile ebpf-security flags=(attach_disconnected) {
  #include <abstractions/base>

  capability sys_admin,
  capability bpf,
  capability perfmon,

  /sys/kernel/debug/tracing/** r,
  /proc/kallsyms r,

  deny /etc/passwd w,
  deny /etc/shadow w,
}
EOF

# 5. Set up logging
cat >> /etc/rsyslog.d/50-ebpf.conf <<EOF
:programname, isequal, "bpf" /var/log/ebpf.log
& stop
EOF

systemctl restart rsyslog
echo "Hardening complete!"
```

## Troubleshooting Common Issues

### Diagnostic Commands

```bash
# Check if eBPF is supported
grep CONFIG_BPF /boot/config-$(uname -r)

# Verify required capabilities
capsh --print | grep -E "cap_sys_admin|cap_bpf"

# Debug program loading failures
strace -e bpf bpftool prog load program.o /sys/fs/bpf/program

# Check verifier logs
cat /sys/kernel/debug/tracing/trace_pipe | grep -i verifier

# Monitor memory usage
cat /proc/meminfo | grep -i bpf
```

### Common Error Solutions

```bash
# Error: Operation not permitted
# Solution: Check capabilities
sudo setcap cap_sys_admin,cap_bpf+eip ./your-program

# Error: Invalid argument (map creation)
# Solution: Increase map limits
sudo sysctl -w kernel.bpf_stats_enabled=1
sudo sysctl -w net.core.bpf_jit_limit=1000000000

# Error: Program too large
# Solution: Optimize or split program
# Use static functions and aggressive inlining
```

## Conclusion

Implementing eBPF security tools requires careful planning and understanding of both the tools and your environment. Start with established tools like Falco and Tetragon for immediate value, then gradually build custom solutions for specific needs.

Remember:

- Always test in development first
- Monitor performance impact
- Keep security rules updated
- Integrate with existing security infrastructure
- Stay informed about new capabilities and threats

The eBPF security ecosystem is rapidly evolving, offering unprecedented capabilities for protecting modern infrastructure. By mastering these tools, you're equipped to build the next generation of security solutions.

---

## Quick Reference

```bash
# Install all tools
curl -fsSL https://falco.org/script/install | sudo bash
helm install tetragon cilium/tetragon -n kube-system
docker pull aquasec/tracee:latest

# Run security audit
falco --modern-bpf --list
tetragon status
tracee --list events

# Emergency response
# Kill all eBPF programs
for prog in $(bpftool prog show | grep id | awk '{print $2}'); do
    bpftool prog detach id $prog
done
```

---

_Next in the series: Advanced eBPF security patterns and building production-grade security infrastructure._
