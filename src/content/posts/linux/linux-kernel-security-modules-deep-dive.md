---
author: Anubhav Gain
pubDatetime: 2025-08-02T17:00:00+05:30
tags:
  - linux
  - kernel
  - security
  - lsm
  - selinux
  - apparmor
  - smack
modDatetime: 2025-08-02T17:00:00+05:30
title: "Linux Security Modules (LSM): A Deep Dive into Kernel-Level Security Frameworks"
slug: linux-kernel-security-modules-deep-dive
featured: true
draft: false
category: Security
description: Comprehensive guide to Linux Security Modules (LSM) framework, exploring SELinux, AppArmor, SMACK, and modern LSM implementations. Learn how to implement custom security modules and integrate with the kernel security subsystem.
---

# Linux Security Modules (LSM): A Deep Dive into Kernel-Level Security Frameworks

The Linux Security Modules (LSM) framework is a cornerstone of Linux kernel security, providing a flexible architecture that allows multiple security models to coexist without kernel modification. This comprehensive guide explores the LSM framework, major implementations, and how to leverage these powerful security mechanisms in modern Linux systems.

## Understanding the LSM Framework

### What is LSM?

Linux Security Modules is a framework that provides a general kernel interface for security modules. Rather than committing to a single security model, LSM allows the Linux kernel to support various security implementations through a clean, well-defined API.

### Architecture Overview

```c
// LSM Hook Structure (simplified)
struct security_hook_list {
    struct hlist_node list;
    struct hlist_head *head;
    union security_list_options hook;
    const char *lsm;
};

// Example LSM hook points
static struct security_hook_list my_hooks[] __lsm_ro_after_init = {
    LSM_HOOK_INIT(file_open, my_file_open),
    LSM_HOOK_INIT(task_create, my_task_create),
    LSM_HOOK_INIT(socket_create, my_socket_create),
    LSM_HOOK_INIT(inode_permission, my_inode_permission),
};
```

### How LSM Works

1. **Hook Placement**: LSM places hooks at critical points in kernel code
2. **DAC First**: Discretionary Access Control checks occur before LSM
3. **Module Callbacks**: Security modules register callbacks for hooks
4. **Decision Making**: Modules return allow/deny decisions
5. **Stacking**: Multiple LSMs can be active simultaneously (since Linux 4.2)

## Major LSM Implementations

### SELinux (Security-Enhanced Linux)

SELinux implements Mandatory Access Control (MAC) through Type Enforcement (TE) and Multi-Level Security (MLS).

#### Core Concepts

```bash
# SELinux contexts format: user:role:type:level
ls -Z /etc/passwd
-rw-r--r--. root root system_u:object_r:passwd_file_t:s0 /etc/passwd

# Policy rules example
allow httpd_t httpd_content_t:file { read open getattr };
allow httpd_t httpd_log_t:file { create write append };
```

#### Custom SELinux Policy Module

```te
# myapp.te - Type Enforcement file
policy_module(myapp, 1.0.0)

# Declare types
type myapp_t;
type myapp_exec_t;
type myapp_data_t;
type myapp_log_t;

# Make myapp_t a domain
domain_type(myapp_t)

# Allow transitions
domain_entry_file(myapp_t, myapp_exec_t)

# Define permissions
allow myapp_t myapp_data_t:file { read write create unlink };
allow myapp_t myapp_log_t:file { append create };
allow myapp_t self:tcp_socket { create connect };

# Network access
corenet_tcp_connect_http_port(myapp_t)

# File contexts
/usr/bin/myapp          -- gen_context(system_u:object_r:myapp_exec_t,s0)
/var/lib/myapp(/.*)?    gen_context(system_u:object_r:myapp_data_t,s0)
/var/log/myapp(/.*)?    gen_context(system_u:object_r:myapp_log_t,s0)
```

#### Building and Loading

```bash
# Compile the module
checkmodule -M -m -o myapp.mod myapp.te
semodule_package -o myapp.pp -m myapp.mod

# Install the module
semodule -i myapp.pp

# Verify installation
semodule -l | grep myapp

# Apply file contexts
restorecon -Rv /usr/bin/myapp /var/lib/myapp /var/log/myapp
```

### AppArmor

AppArmor uses path-based MAC, making it more intuitive but less flexible than SELinux.

#### Profile Development

```apparmor
# /etc/apparmor.d/usr.bin.myapp
#include <tunables/global>

/usr/bin/myapp {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  # Capabilities
  capability net_bind_service,
  capability setuid,

  # Network access
  network inet tcp,
  network inet udp,

  # File access
  /usr/bin/myapp r,
  /etc/myapp/** r,
  /var/lib/myapp/** rw,
  /var/log/myapp/** w,

  # Library access
  /usr/lib/x86_64-linux-gnu/** mr,

  # Temp files
  /tmp/myapp-* rw,

  # System access
  @{PROC}/sys/net/core/somaxconn r,
  @{PROC}/[0-9]*/stat r,

  # Child profiles
  /usr/bin/helper Cx -> helper,

  profile helper {
    #include <abstractions/base>

    /usr/bin/helper r,
    /tmp/helper-* rw,

    # Limited permissions for helper
    deny network,
    deny capability,
  }
}
```

#### Profile Management

```bash
# Parse and load profile
apparmor_parser -r /etc/apparmor.d/usr.bin.myapp

# Set to complain mode (logging only)
aa-complain /usr/bin/myapp

# Set to enforce mode
aa-enforce /usr/bin/myapp

# Generate profile from logs
aa-genprof /usr/bin/myapp

# Update profile based on logs
aa-logprof
```

### SMACK (Simplified Mandatory Access Control Kernel)

SMACK provides a simpler alternative to SELinux with label-based access control.

#### SMACK Rules

```bash
# SMACK rule format: subject object access
# Set labels
attr -S -s SMACK64 -V "WebApp" /usr/bin/webapp
attr -S -s SMACK64 -V "WebData" /var/www/data

# Define rules
echo "WebApp WebData rwx" > /sys/fs/smackfs/load2
echo "WebApp Network w" > /sys/fs/smackfs/load2
echo "WebApp _ r" > /sys/fs/smackfs/load2  # Read any unlabeled

# Network labels
echo "192.168.1.0/24 WebNet" > /sys/fs/smackfs/netlabel
```

### TOMOYO

TOMOYO provides pathname-based MAC with learning mode capabilities.

```tomoyo
# /etc/tomoyo/domain_policy.conf
<kernel>
use_profile 3

<kernel> /usr/sbin/sshd
use_profile 2
allow_read /etc/ssh/sshd_config
allow_read /etc/passwd
allow_read /etc/shadow
allow_create /var/run/sshd.pid 0600
allow_network TCP bind 0.0.0.0 22
allow_network TCP listen 0.0.0.0 22
```

### Yama

Yama provides additional DAC restrictions, particularly for ptrace.

```c
// Yama ptrace scope settings
// 0 - classic ptrace permissions
// 1 - restricted ptrace
// 2 - admin-only attach
// 3 - no attach
echo 1 > /proc/sys/kernel/yama/ptrace_scope
```

## Implementing a Custom LSM

### Basic LSM Structure

```c
// my_lsm.c - Custom LSM implementation
#include <linux/lsm_hooks.h>
#include <linux/security.h>
#include <linux/slab.h>
#include <linux/file.h>
#include <linux/mm.h>
#include <linux/mman.h>
#include <linux/pagemap.h>
#include <linux/swap.h>
#include <linux/spinlock.h>
#include <linux/init.h>
#include <linux/sched.h>

#define MY_LSM_NAME "my_lsm"

/* Security blob for storing custom data */
struct my_task_security {
    u32 security_level;
    bool privileged;
    struct list_head permissions;
};

/* Global security state */
static struct kmem_cache *my_task_security_cache;

/* Hook implementations */
static int my_task_alloc(struct task_struct *task, unsigned long clone_flags)
{
    struct my_task_security *tsec;

    tsec = kmem_cache_zalloc(my_task_security_cache, GFP_KERNEL);
    if (!tsec)
        return -ENOMEM;

    INIT_LIST_HEAD(&tsec->permissions);
    tsec->security_level = current->security_level;
    tsec->privileged = false;

    task->security = tsec;
    return 0;
}

static void my_task_free(struct task_struct *task)
{
    struct my_task_security *tsec = task->security;

    if (tsec) {
        /* Clean up permissions list */
        cleanup_permissions(&tsec->permissions);
        kmem_cache_free(my_task_security_cache, tsec);
    }
}

static int my_file_open(struct file *file)
{
    struct my_task_security *tsec = current->security;
    struct inode *inode = file_inode(file);

    /* Example policy: high security processes can't access world-writable files */
    if (tsec->security_level >= 3) {
        if (inode->i_mode & S_IWOTH) {
            pr_info("MY_LSM: Denied access to world-writable file\n");
            return -EACCES;
        }
    }

    return 0;
}

static int my_task_setpgid(struct task_struct *p, pid_t pgid)
{
    struct my_task_security *tsec = current->security;

    /* Example policy: only privileged tasks can change process groups */
    if (!tsec->privileged && pgid != task_pid_nr(p)) {
        pr_info("MY_LSM: Denied setpgid for unprivileged task\n");
        return -EPERM;
    }

    return 0;
}

static int my_socket_create(int family, int type, int protocol, int kern)
{
    struct my_task_security *tsec = current->security;

    /* Example policy: restrict raw sockets */
    if (type == SOCK_RAW && !tsec->privileged) {
        pr_info("MY_LSM: Denied raw socket creation\n");
        return -EPERM;
    }

    return 0;
}

/* LSM hook list */
static struct security_hook_list my_hooks[] __lsm_ro_after_init = {
    LSM_HOOK_INIT(task_alloc, my_task_alloc),
    LSM_HOOK_INIT(task_free, my_task_free),
    LSM_HOOK_INIT(file_open, my_file_open),
    LSM_HOOK_INIT(task_setpgid, my_task_setpgid),
    LSM_HOOK_INIT(socket_create, my_socket_create),
};

/* Initialize the module */
static int __init my_lsm_init(void)
{
    pr_info("MY_LSM: Initializing...\n");

    /* Create cache for security blobs */
    my_task_security_cache = kmem_cache_create("my_task_security",
                                              sizeof(struct my_task_security),
                                              0, SLAB_PANIC, NULL);

    /* Register hooks */
    security_add_hooks(my_hooks, ARRAY_SIZE(my_hooks), MY_LSM_NAME);

    pr_info("MY_LSM: Initialized successfully\n");
    return 0;
}

/* Define the LSM */
DEFINE_LSM(my_lsm) = {
    .name = MY_LSM_NAME,
    .init = my_lsm_init,
};
```

### Advanced LSM Features

```c
// Extended LSM with policy engine
struct my_policy_rule {
    char *subject_label;
    char *object_label;
    u32 allowed_operations;
    struct list_head list;
};

static LIST_HEAD(policy_rules);
static DEFINE_RWLOCK(policy_lock);

/* Policy parsing and enforcement */
static int parse_policy_rule(const char *rule_string)
{
    struct my_policy_rule *rule;
    char *subject, *object, *perms;

    rule = kzalloc(sizeof(*rule), GFP_KERNEL);
    if (!rule)
        return -ENOMEM;

    /* Parse rule format: "subject object permissions" */
    if (sscanf(rule_string, "%ms %ms %ms", &subject, &object, &perms) != 3) {
        kfree(rule);
        return -EINVAL;
    }

    rule->subject_label = subject;
    rule->object_label = object;
    rule->allowed_operations = parse_permissions(perms);

    write_lock(&policy_lock);
    list_add_tail(&rule->list, &policy_rules);
    write_unlock(&policy_lock);

    kfree(perms);
    return 0;
}

static bool check_policy(const char *subject, const char *object, u32 operation)
{
    struct my_policy_rule *rule;
    bool allowed = false;

    read_lock(&policy_lock);
    list_for_each_entry(rule, &policy_rules, list) {
        if (strcmp(rule->subject_label, subject) == 0 &&
            strcmp(rule->object_label, object) == 0) {
            if (rule->allowed_operations & operation) {
                allowed = true;
                break;
            }
        }
    }
    read_unlock(&policy_lock);

    return allowed;
}

/* securityfs interface for policy management */
static struct dentry *my_lsm_dir;
static struct dentry *policy_file;

static ssize_t policy_write(struct file *file, const char __user *buf,
                           size_t count, loff_t *ppos)
{
    char *policy_line;
    int ret;

    if (count > PAGE_SIZE)
        return -E2BIG;

    policy_line = memdup_user_nul(buf, count);
    if (IS_ERR(policy_line))
        return PTR_ERR(policy_line);

    ret = parse_policy_rule(policy_line);
    kfree(policy_line);

    return ret ?: count;
}

static const struct file_operations policy_fops = {
    .write = policy_write,
};

static int __init my_lsm_fs_init(void)
{
    my_lsm_dir = securityfs_create_dir(MY_LSM_NAME, NULL);
    if (IS_ERR(my_lsm_dir))
        return PTR_ERR(my_lsm_dir);

    policy_file = securityfs_create_file("policy", 0600, my_lsm_dir,
                                        NULL, &policy_fops);
    if (IS_ERR(policy_file)) {
        securityfs_remove(my_lsm_dir);
        return PTR_ERR(policy_file);
    }

    return 0;
}
```

## LSM Stacking and Modern Features

### BPF-LSM Integration

```c
// BPF-LSM program example
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

SEC("lsm/file_open")
int BPF_PROG(restrict_file_open, struct file *file, int ret)
{
    if (ret != 0)
        return ret;

    char filename[256];
    struct dentry *dentry = BPF_CORE_READ(file, f_path.dentry);

    bpf_d_path(&file->f_path, filename, sizeof(filename));

    /* Policy: Block access to specific files */
    if (bpf_strncmp(filename, 10, "/etc/shadow") == 0) {
        u32 pid = bpf_get_current_pid_tgid() >> 32;
        u32 uid = bpf_get_current_uid_gid() & 0xFFFFFFFF;

        if (uid != 0) {
            bpf_printk("Blocked access to /etc/shadow by PID %d UID %d\n",
                      pid, uid);
            return -EPERM;
        }
    }

    return ret;
}

SEC("lsm/socket_connect")
int BPF_PROG(monitor_socket_connect, struct socket *sock,
             struct sockaddr *address, int addrlen, int ret)
{
    if (ret != 0)
        return ret;

    if (address->sa_family == AF_INET) {
        struct sockaddr_in *addr = (struct sockaddr_in *)address;
        u32 dest_ip = addr->sin_addr.s_addr;
        u16 dest_port = bpf_ntohs(addr->sin_port);

        /* Policy: Log all outbound connections */
        bpf_printk("Connection to %pI4:%d\n", &dest_ip, dest_port);

        /* Block connections to specific ports */
        if (dest_port == 25 || dest_port == 587) {  /* SMTP */
            bpf_printk("Blocked SMTP connection attempt\n");
            return -ECONNREFUSED;
        }
    }

    return ret;
}
```

### LSM Stacking Configuration

```c
// Kernel configuration for LSM stacking
CONFIG_SECURITY=y
CONFIG_SECURITYFS=y
CONFIG_SECURITY_NETWORK=y
CONFIG_SECURITY_PATH=y
CONFIG_LSM="lockdown,yama,loadpin,safesetid,integrity,selinux,smack,tomoyo,apparmor,bpf"

// Runtime configuration
// /sys/kernel/security/lsm shows active LSMs
cat /sys/kernel/security/lsm
lockdown,capability,yama,selinux,bpf

// Configure LSM order at boot
kernel command line: lsm=capability,yama,apparmor,bpf
```

## Performance Considerations

### Benchmarking LSM Overhead

```c
// Benchmark tool for LSM performance
#include <stdio.h>
#include <time.h>
#include <fcntl.h>
#include <unistd.h>

#define ITERATIONS 1000000

void benchmark_file_open(const char *path)
{
    struct timespec start, end;
    double elapsed;
    int fd;

    clock_gettime(CLOCK_MONOTONIC, &start);

    for (int i = 0; i < ITERATIONS; i++) {
        fd = open(path, O_RDONLY);
        if (fd >= 0)
            close(fd);
    }

    clock_gettime(CLOCK_MONOTONIC, &end);

    elapsed = (end.tv_sec - start.tv_sec) +
              (end.tv_nsec - start.tv_nsec) / 1e9;

    printf("File open benchmark: %d iterations in %.3f seconds\n",
           ITERATIONS, elapsed);
    printf("Average time per operation: %.3f microseconds\n",
           (elapsed * 1e6) / ITERATIONS);
}

int main()
{
    printf("LSM Performance Benchmark\n");
    printf("=========================\n");

    /* Test with different LSM configurations */
    benchmark_file_open("/etc/passwd");

    return 0;
}
```

### Optimization Strategies

```c
// Optimized LSM hook implementation
static int optimized_file_permission(struct file *file, int mask)
{
    struct inode *inode = file_inode(file);
    struct my_inode_security *isec;

    /* Fast path: skip checks for kernel threads */
    if (current->flags & PF_KTHREAD)
        return 0;

    /* Use RCU for lock-free reads */
    rcu_read_lock();
    isec = rcu_dereference(inode->i_security);

    /* Cache security decisions */
    if (isec && isec->cached_result_valid &&
        isec->cached_mask == mask) {
        int result = isec->cached_result;
        rcu_read_unlock();
        return result;
    }
    rcu_read_unlock();

    /* Slow path: full security check */
    return perform_full_check(file, mask);
}
```

## Security Policy Development

### Policy Generation Tools

```python
#!/usr/bin/env python3
# generate_policy.py - Generate LSM policies from audit logs

import re
import sys
from collections import defaultdict

class PolicyGenerator:
    def __init__(self):
        self.rules = defaultdict(set)
        self.file_contexts = defaultdict(set)

    def parse_audit_log(self, logfile):
        with open(logfile, 'r') as f:
            for line in f:
                self.parse_line(line)

    def parse_line(self, line):
        # Parse SELinux denials
        if 'denied' in line and 'scontext=' in line:
            m = re.search(r'scontext=(\S+).*tcontext=(\S+).*tclass=(\S+).*\{(\S+)\}', line)
            if m:
                scontext = m.group(1).split(':')[2]
                tcontext = m.group(2).split(':')[2]
                tclass = m.group(3)
                perm = m.group(4)

                self.rules[(scontext, tcontext, tclass)].add(perm)

        # Parse AppArmor denials
        elif 'DENIED' in line and 'profile=' in line:
            m = re.search(r'profile="([^"]+)".*operation="([^"]+)".*name="([^"]+)"', line)
            if m:
                profile = m.group(1)
                operation = m.group(2)
                name = m.group(3)

                self.file_contexts[profile].add((operation, name))

    def generate_selinux_policy(self):
        print("# Generated SELinux policy")
        for (scontext, tcontext, tclass), perms in sorted(self.rules.items()):
            perms_str = ' '.join(sorted(perms))
            print(f"allow {scontext} {tcontext}:{tclass} {{ {perms_str} }};")

    def generate_apparmor_policy(self):
        print("# Generated AppArmor policy")
        for profile, accesses in sorted(self.file_contexts.items()):
            print(f"\nprofile {profile} {{")
            for operation, name in sorted(accesses):
                mode = self.operation_to_mode(operation)
                print(f"  {name} {mode},")
            print("}")

    def operation_to_mode(self, operation):
        mode_map = {
            'open': 'r',
            'create': 'w',
            'mkdir': 'w',
            'unlink': 'd',
            'exec': 'x',
        }
        return mode_map.get(operation, 'r')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <audit.log>")
        sys.exit(1)

    generator = PolicyGenerator()
    generator.parse_audit_log(sys.argv[1])

    print("=== SELinux Policy ===")
    generator.generate_selinux_policy()

    print("\n=== AppArmor Policy ===")
    generator.generate_apparmor_policy()
```

### Policy Testing Framework

```bash
#!/bin/bash
# test_policy.sh - Test security policies

set -e

POLICY_FILE=$1
TEST_SUITE=$2

echo "=== Security Policy Testing Framework ==="

# Function to test SELinux policy
test_selinux() {
    echo "Testing SELinux policy..."

    # Load policy in permissive mode
    semodule -DB
    setenforce 0
    semodule -i $POLICY_FILE

    # Run test suite
    $TEST_SUITE 2>&1 | tee selinux_test.log

    # Check for denials
    ausearch -m AVC -ts recent | grep -q "denied"
    if [ $? -eq 0 ]; then
        echo "FAIL: SELinux denials found"
        ausearch -m AVC -ts recent
        return 1
    else
        echo "PASS: No SELinux denials"
        return 0
    fi
}

# Function to test AppArmor policy
test_apparmor() {
    echo "Testing AppArmor policy..."

    # Load policy in complain mode
    apparmor_parser -C -r $POLICY_FILE

    # Run test suite
    $TEST_SUITE 2>&1 | tee apparmor_test.log

    # Check for denials
    grep -q "DENIED" /var/log/audit/audit.log
    if [ $? -eq 0 ]; then
        echo "FAIL: AppArmor denials found"
        grep "DENIED" /var/log/audit/audit.log
        return 1
    else
        echo "PASS: No AppArmor denials"
        return 0
    fi
}

# Determine policy type and test
if [[ $POLICY_FILE == *.pp ]]; then
    test_selinux
elif [[ $POLICY_FILE == *.apparmor ]]; then
    test_apparmor
else
    echo "Unknown policy type"
    exit 1
fi
```

## Best Practices for LSM Deployment

### 1. Start with Audit/Complain Mode

```bash
# SELinux
setenforce 0  # Set to permissive
audit2allow -a -M myapp  # Generate policy from audit logs

# AppArmor
aa-complain /usr/bin/myapp  # Set to complain mode
aa-logprof  # Generate policy from logs
```

### 2. Use Policy Modules

```bash
# SELinux modules
cat > myapp.fc << EOF
/opt/myapp/bin(/.*)?    system_u:object_r:myapp_exec_t:s0
/opt/myapp/etc(/.*)?    system_u:object_r:myapp_config_t:s0
/opt/myapp/data(/.*)?   system_u:object_r:myapp_data_t:s0
EOF

# Build and install
make -f /usr/share/selinux/devel/Makefile myapp.pp
semodule -i myapp.pp
```

### 3. Monitor Performance Impact

```c
// Kernel module for LSM performance monitoring
static struct kprobe kp = {
    .symbol_name = "security_file_open",
};

static void measure_hook_time(struct kprobe *p, struct pt_regs *regs)
{
    ktime_t start = ktime_get();
    jprobe_return();
    ktime_t end = ktime_get();

    u64 delta = ktime_to_ns(end - start);
    if (delta > threshold_ns) {
        pr_warn("LSM hook took %llu ns\n", delta);
    }
}
```

### 4. Implement Gradual Rollout

```yaml
# Kubernetes example with security policies
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  annotations:
    container.apparmor.security.beta.kubernetes.io/myapp: localhost/myapp-profile
spec:
  securityContext:
    seLinuxOptions:
      level: "s0:c123,c456"
      type: "myapp_t"
  containers:
    - name: myapp
      image: myapp:latest
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
```

## Troubleshooting Common Issues

### SELinux Troubleshooting

```bash
# Check SELinux status
sestatus -v

# View recent denials
ausearch -m AVC -ts recent

# Analyze denials
sealert -a /var/log/audit/audit.log

# Common fixes
# Wrong context
restorecon -Rv /path/to/files

# Missing permissions
audit2allow -a -M local
semodule -i local.pp

# Boolean toggles
getsebool -a | grep httpd
setsebool -P httpd_can_network_connect on
```

### AppArmor Troubleshooting

```bash
# Check AppArmor status
aa-status

# View denials
journalctl -xe | grep DENIED

# Common fixes
# Update profile
aa-logprof

# Reload profile
apparmor_parser -r /etc/apparmor.d/usr.bin.myapp

# Debug mode
echo "profile myapp flags=(complain,debug) {" > /etc/apparmor.d/usr.bin.myapp
```

## Future of LSM

### Emerging Trends

1. **eBPF Integration**: Dynamic security policies without kernel modules
2. **Container-Specific LSMs**: Tailored for container security
3. **Hardware-Backed Security**: Integration with TPM and secure enclaves
4. **AI/ML Policy Generation**: Automated policy creation and optimization

### Upcoming Features

```c
// Proposed LSM API extensions
struct security_operations_v2 {
    /* Async security decisions */
    int (*file_open_async)(struct file *file,
                          void (*callback)(int result));

    /* Hardware security integration */
    int (*validate_with_tpm)(struct file *file,
                            struct tpm_measurement *measurement);

    /* Container-aware hooks */
    int (*container_create)(struct container_struct *container);
    int (*container_escape_attempt)(struct task_struct *task);
};
```

## Conclusion

Linux Security Modules provide a powerful framework for implementing mandatory access control and enhancing system security. Whether using established modules like SELinux and AppArmor or developing custom solutions, LSM offers the flexibility and control needed for modern security requirements.

Key takeaways:

- LSM provides a vendor-neutral security framework
- Multiple LSMs can work together through stacking
- Choose the right LSM based on your security model
- Start with audit mode and gradually enforce policies
- Monitor performance impact in production
- Leverage modern features like BPF-LSM for dynamic policies

As threats evolve and systems become more complex, LSM continues to adapt, providing the foundation for Linux security in cloud-native, container, and traditional environments.

---

## Resources

- [Linux Security Module Documentation](https://www.kernel.org/doc/html/latest/admin-guide/LSM/index.html)
- [SELinux Project](https://github.com/SELinuxProject)
- [AppArmor Wiki](https://gitlab.com/apparmor/apparmor/-/wikis/home)
- [SMACK Documentation](https://www.kernel.org/doc/html/latest/admin-guide/LSM/Smack.html)

---

_Next: Linux Kernel Hardening Techniques - KASLR, KPTI, and Modern Mitigation Strategies_
