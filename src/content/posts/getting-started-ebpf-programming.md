---
author: Anubhav Gain
pubDatetime: 2025-01-17T10:00:00+05:30
tags:
  - ebpf
  - programming
  - tutorial
  - linux
  - kernel
modDatetime: 2025-01-17T10:00:00+05:30
title: "Getting Started with eBPF Programming: A Hands-On Guide"
slug: getting-started-ebpf-programming
featured: true
draft: false
category: eBPF
description: A practical guide to eBPF programming with hands-on examples, from hello world to production-ready programs using modern tools and frameworks.
---

# Getting Started with eBPF Programming: A Hands-On Guide

Ready to write your first eBPF program? This hands-on guide will take you from zero to running eBPF programs, covering modern tools, practical examples, and best practices for eBPF development.

## Prerequisites and Setup

### System Requirements

```bash
# Check kernel version (need 4.4+, recommend 5.10+)
uname -r

# Check for BPF support
ls /sys/fs/bpf

# Check for BTF support (recommended)
ls /sys/kernel/btf/vmlinux
```

### Installing Development Tools

#### Ubuntu/Debian

```bash
# Essential tools
sudo apt-get update
sudo apt-get install -y \
    clang llvm libbpf-dev \
    linux-headers-$(uname -r) \
    build-essential git

# Additional tools
sudo apt-get install -y \
    bpftrace bpfcc-tools \
    linux-tools-$(uname -r) \
    linux-tools-common
```

#### Fedora/RHEL

```bash
sudo dnf install -y \
    clang llvm libbpf-devel \
    kernel-devel make git \
    bpftrace bcc-tools
```

## Your First eBPF Program: Hello World

### 1. Starting Simple with bpftrace

The easiest way to start with eBPF is using bpftrace for one-liners:

```bash
# Hello World - trace all openat() system calls
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("Hello from eBPF! PID %d opened %s\n", pid, str(args->filename)); }'

# Count system calls by process
sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'

# Trace TCP connections
sudo bpftrace -e 'kprobe:tcp_connect { printf("PID %d (%s) connecting\n", pid, comm); }'
```

### 2. Writing a C eBPF Program

Create `hello_ebpf.c`:

```c
#include <linux/bpf.h>
#include <linux/ptrace.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

char LICENSE[] SEC("license") = "GPL";

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

struct event {
    __u32 pid;
    __u8 comm[16];
    __u64 ts;
};

SEC("tp/syscalls/sys_enter_open")
int hello_open(struct trace_event_raw_sys_enter *ctx) {
    struct event *e;

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;

    e->pid = bpf_get_current_pid_tgid() >> 32;
    e->ts = bpf_ktime_get_ns();
    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    bpf_ringbuf_submit(e, 0);
    return 0;
}
```

### 3. User-Space Loader

Create `hello_user.c`:

```c
#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include "hello_ebpf.skel.h"

static int libbpf_print_fn(enum libbpf_print_level level,
                          const char *format, va_list args) {
    return vfprintf(stderr, format, args);
}

static volatile bool exiting = false;

static void sig_handler(int sig) {
    exiting = true;
}

static int handle_event(void *ctx, void *data, size_t data_sz) {
    const struct event *e = data;
    printf("%-8u %-16s\n", e->pid, e->comm);
    return 0;
}

int main(int argc, char **argv) {
    struct hello_ebpf_bpf *skel;
    struct ring_buffer *rb = NULL;
    int err;

    // Set up libbpf errors and debug info callback
    libbpf_set_print(libbpf_print_fn);

    // Open, load, and attach BPF program
    skel = hello_ebpf_bpf__open_and_load();
    if (!skel) {
        fprintf(stderr, "Failed to open BPF skeleton\n");
        return 1;
    }

    err = hello_ebpf_bpf__attach(skel);
    if (err) {
        fprintf(stderr, "Failed to attach BPF skeleton\n");
        goto cleanup;
    }

    // Set up ring buffer
    rb = ring_buffer__new(bpf_map__fd(skel->maps.events),
                          handle_event, NULL, NULL);
    if (!rb) {
        err = -1;
        fprintf(stderr, "Failed to create ring buffer\n");
        goto cleanup;
    }

    // Set up signal handler
    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);

    printf("%-8s %-16s\n", "PID", "COMM");
    printf("%-8s %-16s\n", "----", "----");

    // Poll ring buffer
    while (!exiting) {
        err = ring_buffer__poll(rb, 100);
        if (err == -EINTR) {
            err = 0;
            break;
        }
        if (err < 0) {
            printf("Error polling ring buffer: %d\n", err);
            break;
        }
    }

cleanup:
    ring_buffer__free(rb);
    hello_ebpf_bpf__destroy(skel);
    return err < 0 ? -err : 0;
}
```

### 4. Building and Running

Create a `Makefile`:

```makefile
CLANG ?= clang
CC ?= gcc
LIBBPF_SRC := /usr/include/bpf
ARCH := $(shell uname -m | sed 's/x86_64/x86/')

all: hello

hello_ebpf.o: hello_ebpf.c
	$(CLANG) -g -O2 -target bpf -D__TARGET_ARCH_$(ARCH) \
		-I$(LIBBPF_SRC) -c hello_ebpf.c -o hello_ebpf.o

hello_ebpf.skel.h: hello_ebpf.o
	bpftool gen skeleton hello_ebpf.o > hello_ebpf.skel.h

hello: hello_user.c hello_ebpf.skel.h
	$(CC) -g -Wall -o hello hello_user.c -lbpf -lelf -lz

clean:
	rm -f *.o hello hello_ebpf.skel.h

.PHONY: all clean
```

Build and run:

```bash
make
sudo ./hello
```

## Modern eBPF Development with CO-RE

### CO-RE (Compile Once - Run Everywhere)

CO-RE enables writing portable eBPF programs that work across different kernel versions:

```c
#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>

char LICENSE[] SEC("license") = "GPL";

// Use BPF_CORE_READ for portable field access
SEC("kprobe/tcp_connect")
int trace_tcp_connect(struct pt_regs *ctx) {
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    struct sock_common skc = {};

    // CO-RE-enabled read
    bpf_core_read(&skc, sizeof(skc), &sk->__sk_common);

    u16 sport = bpf_ntohs(skc.skc_num);
    u16 dport = bpf_ntohs(skc.skc_dport);

    bpf_printk("TCP connect: sport=%d dport=%d\n", sport, dport);
    return 0;
}
```

## Practical Examples

### 1. TCP Connection Tracker

Track all TCP connections with detailed information:

```c
struct tcp_event {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
    __u32 pid;
    __u8 comm[16];
};

struct {
    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);
} events SEC(".maps");

SEC("kprobe/tcp_connect")
int trace_connect(struct pt_regs *ctx) {
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    struct tcp_event event = {};

    // Read connection details
    bpf_probe_read(&event.saddr, sizeof(event.saddr),
                   &sk->__sk_common.skc_rcv_saddr);
    bpf_probe_read(&event.daddr, sizeof(event.daddr),
                   &sk->__sk_common.skc_daddr);
    bpf_probe_read(&event.sport, sizeof(event.sport),
                   &sk->__sk_common.skc_num);
    bpf_probe_read(&event.dport, sizeof(event.dport),
                   &sk->__sk_common.skc_dport);

    event.pid = bpf_get_current_pid_tgid() >> 32;
    bpf_get_current_comm(&event.comm, sizeof(event.comm));

    // Submit event
    bpf_perf_event_output(ctx, &events, BPF_F_CURRENT_CPU,
                          &event, sizeof(event));
    return 0;
}
```

### 2. File Access Monitor

Monitor file operations with path resolution:

```c
struct file_event {
    __u32 pid;
    __u8 comm[16];
    __u8 filename[256];
    __u32 flags;
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} rb SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_openat")
int trace_openat(struct trace_event_raw_sys_enter *ctx) {
    struct file_event *e;

    e = bpf_ringbuf_reserve(&rb, sizeof(*e), 0);
    if (!e)
        return 0;

    e->pid = bpf_get_current_pid_tgid() >> 32;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    // Read filename from user space
    const char *filename_ptr = (const char *)ctx->args[1];
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename),
                            filename_ptr);

    e->flags = (u32)ctx->args[2];

    bpf_ringbuf_submit(e, 0);
    return 0;
}
```

### 3. Performance Profiler

CPU sampling profiler with stack traces:

```c
struct {
    __uint(type, BPF_MAP_TYPE_STACK_TRACE);
    __uint(max_entries, 10000);
} stacks SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10000);
    __type(key, u32);
    __type(value, u64);
} counts SEC(".maps");

SEC("perf_event")
int do_sample(struct bpf_perf_event_data *ctx) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;

    // Skip kernel threads
    if (pid == 0)
        return 0;

    // Get stack ID
    __s32 stack_id = bpf_get_stackid(ctx, &stacks,
                                      BPF_F_USER_STACK);
    if (stack_id < 0)
        return 0;

    // Count this stack
    __u64 *count = bpf_map_lookup_elem(&counts, &stack_id);
    if (count)
        (*count)++;
    else {
        __u64 one = 1;
        bpf_map_update_elem(&counts, &stack_id, &one, BPF_ANY);
    }

    return 0;
}
```

## Advanced Development Patterns

### 1. Per-CPU Maps for High Performance

```c
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, u32);
    __type(value, struct statistics);
} stats SEC(".maps");

SEC("xdp")
int count_packets(struct xdp_md *ctx) {
    u32 key = 0;
    struct statistics *s = bpf_map_lookup_elem(&stats, &key);
    if (!s)
        return XDP_PASS;

    // No locking needed - per-CPU storage
    s->packets++;
    s->bytes += (ctx->data_end - ctx->data);

    return XDP_PASS;
}
```

### 2. Tail Calls for Program Chaining

```c
struct {
    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);
    __uint(max_entries, 10);
} progs SEC(".maps");

SEC("xdp")
int dispatcher(struct xdp_md *ctx) {
    // Determine which program to call
    u32 prog_id = classify_packet(ctx);

    // Tail call to specific handler
    bpf_tail_call(ctx, &progs, prog_id);

    // Only reached if tail call fails
    return XDP_PASS;
}
```

### 3. BPF-to-BPF Function Calls

```c
static __always_inline int parse_ip_header(struct iphdr *ip,
                                          void *data_end) {
    if (ip + 1 > data_end)
        return -1;

    if (ip->version != 4)
        return -1;

    return 0;
}

SEC("xdp")
int process_packet(struct xdp_md *ctx) {
    void *data = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;

    struct ethhdr *eth = data;
    struct iphdr *ip = data + sizeof(*eth);

    if (parse_ip_header(ip, data_end) < 0)
        return XDP_DROP;

    // Process valid IP packet
    return XDP_PASS;
}
```

## Testing and Debugging

### 1. Using bpf_printk for Debugging

```c
SEC("kprobe/sys_open")
int trace_open(struct pt_regs *ctx) {
    char comm[16];
    bpf_get_current_comm(&comm, sizeof(comm));

    // Debug output (view with: sudo cat /sys/kernel/debug/tracing/trace_pipe)
    bpf_printk("DEBUG: %s called sys_open\n", comm);

    return 0;
}
```

### 2. BPF Verifier Debugging

```bash
# Verbose verifier output
sudo bpftool prog load hello.o /sys/fs/bpf/hello verb

# Check loaded programs
sudo bpftool prog list

# Dump program instructions
sudo bpftool prog dump xlated id <prog_id>
```

### 3. Performance Analysis

```bash
# Check program run time
sudo bpftool prog profile id <prog_id> duration 10

# Monitor map usage
sudo bpftool map list
sudo bpftool map dump id <map_id>
```

## Production Best Practices

### 1. Error Handling

```c
// Always check map lookups
struct data *d = bpf_map_lookup_elem(&my_map, &key);
if (!d)
    return 0;  // Handle gracefully

// Check bounds before access
if (ptr + sizeof(*ptr) > data_end)
    return XDP_DROP;
```

### 2. Resource Management

```c
// Limit loop iterations
#pragma unroll
for (int i = 0; i < MAX_ITERATIONS && i < 100; i++) {
    // Process...
}

// Use appropriate map sizes
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 10000);  // LRU eviction when full
} cache SEC(".maps");
```

### 3. Compatibility

```c
// Use CO-RE for field access
struct task_struct *task = (void *)bpf_get_current_task();
u32 pid = BPF_CORE_READ(task, tgid);

// Feature detection
if (bpf_core_field_exists(struct tcp_sock, snd_cwnd))
    cwnd = BPF_CORE_READ(tp, snd_cwnd);
```

## Development Workflow

### 1. Project Structure

```
my_ebpf_project/
├── src/
│   ├── my_prog.bpf.c      # eBPF program
│   └── my_prog.c          # User-space loader
├── include/
│   └── my_prog.h          # Shared definitions
├── Makefile
└── README.md
```

### 2. Automated Build

```makefile
# Modern Makefile with BTF and CO-RE
CLANG := clang
BPFTOOL := bpftool
ARCH := $(shell uname -m | sed 's/x86_64/x86/')

.PHONY: all clean

all: my_prog

%.bpf.o: %.bpf.c
	$(CLANG) -g -O2 -target bpf \
		-D__TARGET_ARCH_$(ARCH) \
		-c $< -o $@

%.skel.h: %.bpf.o
	$(BPFTOOL) gen skeleton $< > $@

my_prog: src/my_prog.c src/my_prog.skel.h
	$(CC) -g -Wall -o $@ $< -lbpf -lelf -lz
```

### 3. CI/CD Integration

```yaml
# GitHub Actions example
name: Build eBPF
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install deps
        run: |
          sudo apt-get update
          sudo apt-get install -y clang llvm libbpf-dev
      - name: Build
        run: make
      - name: Test
        run: sudo ./run_tests.sh
```

## Next Steps

1. **Explore Examples**: Study programs in the [BCC repository](https://github.com/iovisor/bcc/tree/master/examples)
2. **Read the Guide**: [BPF and XDP Reference Guide](https://docs.cilium.io/en/stable/bpf/)
3. **Join Community**: [eBPF Slack](https://ebpf.io/slack) and mailing lists
4. **Build Something**: Start with a real problem you want to solve

## Common Pitfalls and Solutions

### Verifier Rejection

```c
// BAD: Unbounded loop
for (int i = 0; i < n; i++) { }

// GOOD: Bounded loop
for (int i = 0; i < n && i < 100; i++) { }
```

### Stack Size Limits

```c
// BAD: Large stack allocation
char buffer[8192];

// GOOD: Use maps for large data
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, u32);
    __type(value, struct large_buffer);
} buffers SEC(".maps");
```

### Memory Access

```c
// BAD: Direct pointer arithmetic
struct iphdr *ip = eth + 1;

// GOOD: Proper bounds checking
struct iphdr *ip = (void *)eth + sizeof(*eth);
if ((void *)ip + sizeof(*ip) > data_end)
    return XDP_DROP;
```

## Conclusion

eBPF programming opens up incredible possibilities for system programming, but it requires understanding its constraints and patterns. Start simple with tools like bpftrace, gradually move to writing C programs with libbpf, and always prioritize safety and performance.

Remember: eBPF is powerful because it's safe. The verifier is your friend—work with it, not against it!

---

_Ready to dive deeper? Check out our next post on the eBPF ecosystem and advanced tools!_
