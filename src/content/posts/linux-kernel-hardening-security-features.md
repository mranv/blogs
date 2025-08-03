---
author: Anubhav Gain
pubDatetime: 2025-08-02T17:30:00+05:30
modDatetime: 2025-08-02T17:30:00+05:30
title: "Linux Kernel Hardening: Modern Security Features and Mitigation Techniques"
slug: linux-kernel-hardening-security-features
featured: true
draft: false
tags:
  - linux
  - kernel
  - security
  - hardening
  - kaslr
  - kpti
  - mitigation
category: Linux
description: Comprehensive guide to Linux kernel hardening techniques including KASLR, KPTI, Control Flow Integrity, and modern CPU vulnerability mitigations. Learn how to configure and implement kernel security features for maximum protection.
---

# Linux Kernel Hardening: Modern Security Features and Mitigation Techniques

The Linux kernel has evolved significantly in response to sophisticated attacks and hardware vulnerabilities. This comprehensive guide explores modern kernel hardening techniques, from foundational features like KASLR and KPTI to cutting-edge mitigations for CPU vulnerabilities and advanced exploit prevention mechanisms.

## Understanding Kernel Attack Surface

### Common Attack Vectors

```c
/* Example: Vulnerable kernel code patterns */

// 1. Buffer overflow vulnerability
static long vulnerable_ioctl(struct file *file, unsigned int cmd, unsigned long arg)
{
    char buffer[64];

    // Vulnerable: No bounds checking
    if (copy_from_user(buffer, (void __user *)arg, 128))
        return -EFAULT;

    return 0;
}

// 2. Use-after-free vulnerability
struct my_data {
    void (*callback)(void);
    char data[100];
};

static void vulnerable_free(struct my_data *data)
{
    kfree(data);
    // Vulnerable: Use after free
    data->callback();
}

// 3. Race condition vulnerability
static int vulnerable_open(struct inode *inode, struct file *file)
{
    // Vulnerable: TOCTOU race condition
    if (!capable(CAP_SYS_ADMIN))
        return -EPERM;

    // Time window for privilege change
    msleep(10);

    // Assumes capability still valid
    file->private_data = sensitive_data;
    return 0;
}
```

## Core Hardening Features

### KASLR (Kernel Address Space Layout Randomization)

KASLR randomizes the kernel's virtual address space layout to make exploitation harder.

#### Implementation Details

```c
// Kernel configuration for KASLR
CONFIG_RANDOMIZE_BASE=y
CONFIG_RANDOMIZE_MEMORY=y
CONFIG_RANDOMIZE_KSTACK_OFFSET_DEFAULT=y

// Boot-time entropy gathering
void __init kaslr_early_init(void)
{
    unsigned long entropy;

    /* Gather entropy from various sources */
    entropy = get_boot_seed();
    entropy ^= rdtsc();
    entropy ^= read_cr3();

    /* Calculate random offset */
    kernel_offset = (entropy % KERNEL_IMAGE_SIZE_MAX) & ~(KERNEL_ALIGN - 1);

    /* Apply offset to kernel mappings */
    __START_KERNEL_map += kernel_offset;
    phys_base -= kernel_offset;
}
```

#### Verifying KASLR

```bash
# Check if KASLR is enabled
cat /proc/cmdline | grep kaslr
dmesg | grep "KASLR enabled"

# View kernel offset (requires root)
cat /proc/kallsyms | grep _text
# Address changes on each boot with KASLR

# Disable KASLR for debugging
kernel command line: nokaslr
```

### KPTI (Kernel Page Table Isolation)

KPTI mitigates Meltdown by separating user and kernel page tables.

#### Implementation

```c
// KPTI page table switching
static inline void switch_to_kernel_pt(void)
{
    unsigned long cr3 = __read_cr3();

    if (cr3 & PTI_USER_PGTABLE_BIT) {
        cr3 &= ~PTI_USER_PGTABLE_BIT;
        native_write_cr3(cr3);
    }
}

// Entry/exit macros
#define SWITCH_TO_KERNEL_CR3    \
    movq    %cr3, %rax;         \
    andq    $~PTI_USER_PGTABLE_BIT, %rax; \
    movq    %rax, %cr3

#define SWITCH_TO_USER_CR3      \
    movq    %cr3, %rax;         \
    orq     $PTI_USER_PGTABLE_BIT, %rax; \
    movq    %rax, %cr3
```

#### Performance Impact Mitigation

```c
// Process-specific KPTI control
static int setup_kpti_ctl(void)
{
    if (cpu_mitigations_off())
        return 0;

    /* Disable KPTI for trusted processes */
    if (current->flags & PF_KPTI_EXEMPT) {
        current->mm->context.pti_disabled = 1;
        return 0;
    }

    return 1;
}

// Per-CPU optimization
DEFINE_PER_CPU(unsigned long, cached_user_cr3);
DEFINE_PER_CPU(unsigned long, cached_kernel_cr3);
```

### Stack Protection

#### Stack Canaries

```c
// GCC stack protection
// Compile with: -fstack-protector-strong

void __stack_chk_fail(void)
{
    panic("Stack smashing detected!");
}

// Example protected function
void protected_function(char *input)
{
    char buffer[64];
    unsigned long canary = __stack_chk_guard;

    strcpy(buffer, input);  // Potentially unsafe

    if (canary != __stack_chk_guard)
        __stack_chk_fail();
}
```

#### Shadow Stack

```c
// Intel CET (Control-flow Enforcement Technology) shadow stack
static void enable_shadow_stack(void)
{
    u64 msr_val;

    if (!cpu_feature_enabled(X86_FEATURE_SHSTK))
        return;

    /* Enable shadow stack */
    rdmsrl(MSR_IA32_U_CET, msr_val);
    msr_val |= CET_SHSTK_EN;
    wrmsrl(MSR_IA32_U_CET, msr_val);

    /* Set up shadow stack pointer */
    wrmsrl(MSR_IA32_PL3_SSP, current->thread.shstk_base);
}
```

### Control Flow Integrity (CFI)

#### Clang CFI Implementation

```c
// Kernel built with Clang CFI
// CONFIG_CFI_CLANG=y

// CFI type checking before indirect calls
#define cfi_check_fn(fn, type) \
    __cfi_check((unsigned long)(fn), (unsigned long)type##_cfi_id)

// Example usage
struct file_operations {
    int (*open)(struct inode *, struct file *);
    int (*release)(struct inode *, struct file *);
} __randomize_layout;

static int cfi_safe_open(struct inode *inode, struct file *file)
{
    const struct file_operations *fops = file->f_op;

    /* CFI check before indirect call */
    cfi_check_fn(fops->open, file_operations_open);

    return fops->open(inode, file);
}
```

#### Return-Oriented Programming (ROP) Protection

```c
// Intel CET Indirect Branch Tracking
static void enable_ibt(void)
{
    u64 msr_val;

    if (!cpu_feature_enabled(X86_FEATURE_IBT))
        return;

    /* Enable indirect branch tracking */
    rdmsrl(MSR_IA32_S_CET, msr_val);
    msr_val |= CET_ENDBR_EN;
    wrmsrl(MSR_IA32_S_CET, msr_val);
}

// ENDBR instruction at valid targets
__attribute__((cf_check))
void valid_indirect_target(void)
{
    asm volatile("endbr64");
    /* Function body */
}
```

## CPU Vulnerability Mitigations

### Spectre Mitigations

#### Retpoline

```c
// Retpoline implementation for indirect branches
.macro RETPOLINE_JMP reg:req
    call    .Ldo_rop_\@
.Lspec_trap_\@:
    pause
    lfence
    jmp     .Lspec_trap_\@
.Ldo_rop_\@:
    mov     \reg, (%rsp)
    ret
.endm

// Compiler-generated retpoline thunks
extern void __x86_indirect_thunk_rax(void);

// Usage in C code
#define indirect_branch_prediction_barrier() \
    asm volatile("lfence" : : : "memory")
```

#### IBRS/IBPB/STIBP

```c
// Indirect Branch Restricted Speculation controls
static void enable_spectre_v2_protection(void)
{
    u64 msr_val;

    /* Enable IBRS */
    if (boot_cpu_has(X86_FEATURE_IBRS)) {
        rdmsrl(MSR_IA32_SPEC_CTRL, msr_val);
        msr_val |= SPEC_CTRL_IBRS;
        wrmsrl(MSR_IA32_SPEC_CTRL, msr_val);
    }

    /* Issue IBPB on context switch */
    if (boot_cpu_has(X86_FEATURE_IBPB)) {
        wrmsrl(MSR_IA32_PRED_CMD, PRED_CMD_IBPB);
    }

    /* Enable STIBP for user threads */
    if (boot_cpu_has(X86_FEATURE_STIBP)) {
        rdmsrl(MSR_IA32_SPEC_CTRL, msr_val);
        msr_val |= SPEC_CTRL_STIBP;
        wrmsrl(MSR_IA32_SPEC_CTRL, msr_val);
    }
}
```

### L1TF (L1 Terminal Fault) Mitigation

```c
// Page Table Entry inversion for L1TF
static inline void __pte_to_swp_entry_invert(pte_t *pte)
{
    pte->pte = pte_val(*pte) ^ _PAGE_PROTNONE;
}

// L1D cache flush on VM entry
static void l1d_flush(void)
{
    int size = PAGE_SIZE << L1D_CACHE_ORDER;
    void *buffer = this_cpu_ptr(&l1d_flush_pages);

    /* Fill L1D with safe data */
    asm volatile(
        "xorl   %%eax, %%eax\n"
        ".Lfill_cache:\n\t"
        "movzbl (%[flush_pages], %%" _ASM_AX "), %%ecx\n\t"
        "addl   $64, %%eax\n\t"
        "cmpl   %%eax, %[size]\n\t"
        "jne    .Lfill_cache\n\t"
        "lfence\n"
        :: [flush_pages] "r" (buffer),
           [size] "r" (size)
        : "eax", "ecx", "memory"
    );
}
```

### MDS (Microarchitectural Data Sampling) Mitigation

```c
// CPU buffer clear on context switch
static inline void mds_clear_cpu_buffers(void)
{
    static const u16 ds = __KERNEL_DS;

    /*
     * Clear CPU buffers by performing a dummy verw instruction
     * with the kernel data segment
     */
    asm volatile("verw %[ds]" : : [ds] "m" (ds) : "cc");
}

// Automatic buffer clearing
static void mds_user_clear_cpu_buffers(void)
{
    if (!static_branch_likely(&mds_user_clear))
        return;

    mds_clear_cpu_buffers();
}
```

## Memory Protection Features

### W^X (Write XOR Execute)

```c
// Enforce W^X protections
static int check_wx_pages(void)
{
    struct page *page;
    unsigned long pfn;
    int failed = 0;

    for_each_online_pgdat(pgdat) {
        for (pfn = pgdat->node_start_pfn;
             pfn < pgdat->node_start_pfn + pgdat->node_spanned_pages;
             pfn++) {

            page = pfn_to_page(pfn);

            if (!page_is_ram(pfn))
                continue;

            /* Check for W+X mappings */
            if (page_is_writable(page) && page_is_executable(page)) {
                pr_warn("Found W+X page at 0x%lx\n",
                        pfn << PAGE_SHIFT);
                failed++;
            }
        }
    }

    return failed;
}

// Set proper permissions
static void set_memory_protection(void *addr, size_t size, pgprot_t prot)
{
    unsigned long start = (unsigned long)addr;
    unsigned long end = start + size;

    /* Round to page boundaries */
    start = round_down(start, PAGE_SIZE);
    end = round_up(end, PAGE_SIZE);

    /* Apply protection */
    if (pgprot_val(prot) & _PAGE_NX) {
        set_memory_nx(start, (end - start) >> PAGE_SHIFT);
    }
    if (!(pgprot_val(prot) & _PAGE_RW)) {
        set_memory_ro(start, (end - start) >> PAGE_SHIFT);
    }
}
```

### FORTIFY_SOURCE

```c
// CONFIG_FORTIFY_SOURCE=y

// Fortified string operations
#define __fortify_memcpy(dest, src, len)                           \
({                                                                  \
    size_t __len = (len);                                          \
    size_t __dest_size = __builtin_object_size(dest, 0);          \
    size_t __src_size = __builtin_object_size(src, 0);            \
                                                                   \
    if (__builtin_constant_p(__len) && __len > __dest_size)       \
        __fortify_panic(__func__);                                 \
    if (__builtin_constant_p(__len) && __len > __src_size)        \
        __fortify_panic(__func__);                                 \
                                                                   \
    __builtin_memcpy(dest, src, len);                            \
})

// Usage
void safe_copy(void *dst, const void *src, size_t len)
{
    char buffer[64];

    /* Compile-time check if len > 64 */
    __fortify_memcpy(buffer, src, len);
}
```

### Guard Pages

```c
// Kernel stack guard pages
static int setup_stack_guard_page(struct task_struct *tsk)
{
    struct page *page;
    unsigned long addr;

    /* Allocate stack with guard page */
    addr = __get_free_pages(GFP_KERNEL, THREAD_SIZE_ORDER);
    if (!addr)
        return -ENOMEM;

    /* Set up guard page at bottom of stack */
    page = virt_to_page(addr);
    set_page_guard(page);

    /* Mark guard page as non-present */
    __set_page_prot(page, __pgprot(0));

    tsk->stack = (void *)(addr + PAGE_SIZE);
    return 0;
}
```

## Kernel Configuration Hardening

### Essential Hardening Options

```bash
# Security options
CONFIG_SECURITY=y
CONFIG_SECURITY_YAMA=y
CONFIG_SECURITY_LOADPIN=y
CONFIG_SECURITY_LOCKDOWN_LSM=y
CONFIG_SECURITY_LOCKDOWN_LSM_EARLY=y
CONFIG_LOCK_DOWN_KERNEL_FORCE_CONFIDENTIALITY=y

# Memory protection
CONFIG_FORTIFY_SOURCE=y
CONFIG_STACKPROTECTOR_STRONG=y
CONFIG_STRICT_KERNEL_RWX=y
CONFIG_STRICT_MODULE_RWX=y
CONFIG_DEBUG_WX=y

# CPU mitigations
CONFIG_PAGE_TABLE_ISOLATION=y
CONFIG_RETPOLINE=y
CONFIG_CPU_MITIGATIONS=y
CONFIG_SPECULATION_MITIGATIONS=y

# Attack surface reduction
CONFIG_LEGACY_VSYSCALL_NONE=y
CONFIG_HARDENED_USERCOPY=y
CONFIG_HARDENED_USERCOPY_FALLBACK=n
CONFIG_SLAB_FREELIST_RANDOM=y
CONFIG_SLAB_FREELIST_HARDENED=y
CONFIG_SHUFFLE_PAGE_ALLOCATOR=y

# Kernel self-protection
CONFIG_BUG_ON_DATA_CORRUPTION=y
CONFIG_DEBUG_CREDENTIALS=y
CONFIG_DEBUG_NOTIFIERS=y
CONFIG_DEBUG_LIST=y
CONFIG_DEBUG_SG=y
CONFIG_INIT_ON_ALLOC_DEFAULT_ON=y
CONFIG_INIT_ON_FREE_DEFAULT_ON=y

# Disable dangerous features
# CONFIG_DEVMEM is not set
# CONFIG_DEVKMEM is not set
# CONFIG_PROC_KCORE is not set
# CONFIG_KEXEC is not set
# CONFIG_HIBERNATION is not set
```

### Runtime Hardening

```bash
#!/bin/bash
# kernel-hardening.sh - Apply runtime hardening

# Kernel parameters
cat > /etc/sysctl.d/99-hardening.conf << EOF
# Kernel hardening
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 2
kernel.unprivileged_bpf_disabled = 1
kernel.unprivileged_userns_clone = 0
kernel.sysrq = 0
kernel.core_uses_pid = 1
kernel.panic = 60
kernel.panic_on_oops = 1

# Module loading restrictions
kernel.modules_disabled = 1

# Memory protections
vm.mmap_min_addr = 65536
vm.mmap_rnd_bits = 32
vm.mmap_rnd_compat_bits = 16

# Network hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_rfc1337 = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# IPv6 hardening
net.ipv6.conf.all.accept_ra = 0
net.ipv6.conf.default.accept_ra = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
EOF

# Apply settings
sysctl -p /etc/sysctl.d/99-hardening.conf

# Disable kernel module loading
echo 1 > /proc/sys/kernel/modules_disabled

# Set CPU vulnerability mitigations
echo "Enabling CPU mitigations..."
for vuln in /sys/devices/system/cpu/vulnerabilities/*; do
    echo "$(basename $vuln): $(cat $vuln)"
done
```

## Advanced Hardening Techniques

### Kernel Runtime Security Engine

```c
// Custom kernel hardening module
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/security.h>
#include <linux/cred.h>

static int hardening_task_create(unsigned long clone_flags)
{
    const struct cred *cred = current_cred();

    /* Restrict unprivileged user namespaces */
    if ((clone_flags & CLONE_NEWUSER) && !capable(CAP_SYS_ADMIN)) {
        pr_warn("Blocked unprivileged user namespace creation\n");
        return -EPERM;
    }

    /* Restrict ptrace */
    if (clone_flags & CLONE_PTRACE) {
        if (!has_capability(current, CAP_SYS_PTRACE)) {
            pr_warn("Blocked ptrace attach\n");
            return -EPERM;
        }
    }

    return 0;
}

static struct security_hook_list hardening_hooks[] __lsm_ro_after_init = {
    LSM_HOOK_INIT(task_create, hardening_task_create),
};

static int __init hardening_init(void)
{
    pr_info("Kernel hardening module loaded\n");
    security_add_hooks(hardening_hooks, ARRAY_SIZE(hardening_hooks),
                      "hardening");
    return 0;
}

module_init(hardening_init);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Additional kernel hardening");
```

### Integrity Measurement Architecture (IMA)

```bash
# IMA policy for kernel integrity
cat > /etc/ima/ima-policy << EOF
# Measure and appraise kernel modules
measure func=MODULE_CHECK
appraise func=MODULE_CHECK appraise_type=imasig

# Measure and appraise firmware
measure func=FIRMWARE_CHECK
appraise func=FIRMWARE_CHECK appraise_type=imasig

# Measure and appraise kexec kernel
measure func=KEXEC_KERNEL_CHECK
appraise func=KEXEC_KERNEL_CHECK appraise_type=imasig

# Measure all executables
measure func=BPRM_CHECK mask=MAY_EXEC
measure func=MMAP_CHECK mask=MAY_EXEC

# Audit policy violations
audit func=BPRM_CHECK mask=MAY_EXEC
EOF

# Load IMA policy
cat /etc/ima/ima-policy > /sys/kernel/security/ima/policy
```

### Kernel Lockdown

```c
// Kernel lockdown levels
enum lockdown_reason {
    LOCKDOWN_NONE,
    LOCKDOWN_MODULE_SIGNATURE,
    LOCKDOWN_DEV_MEM,
    LOCKDOWN_EFI_TEST,
    LOCKDOWN_KEXEC,
    LOCKDOWN_HIBERNATION,
    LOCKDOWN_PCI_ACCESS,
    LOCKDOWN_IOPORT,
    LOCKDOWN_MSR,
    LOCKDOWN_ACPI_TABLES,
    LOCKDOWN_PCMCIA_CIS,
    LOCKDOWN_TIOCSSERIAL,
    LOCKDOWN_MODULE_PARAMETERS,
    LOCKDOWN_MMIOTRACE,
    LOCKDOWN_DEBUGFS,
    LOCKDOWN_XMON_WR,
    LOCKDOWN_KCORE,
    LOCKDOWN_KPROBES,
    LOCKDOWN_BPF_READ,
    LOCKDOWN_PERF,
    LOCKDOWN_TRACEFS,
    LOCKDOWN_XMON_RW,
    LOCKDOWN_CONFIDENTIALITY_MAX,
};

static int lockdown_is_locked_down(enum lockdown_reason what)
{
    if (kernel_locked_down >= what) {
        pr_warn("Lockdown: %s is restricted; see man kernel_lockdown.7\n",
                lockdown_reasons[what]);
        return -EPERM;
    }

    return 0;
}
```

## Performance Impact and Tuning

### Measuring Security Overhead

```c
// Performance measurement module
#include <linux/time64.h>
#include <linux/timekeeping.h>

struct mitigation_stats {
    u64 total_cycles;
    u64 total_calls;
    u64 max_cycles;
};

static DEFINE_PER_CPU(struct mitigation_stats, kpti_stats);
static DEFINE_PER_CPU(struct mitigation_stats, retpoline_stats);

#define MEASURE_MITIGATION(name, code) ({                          \
    struct mitigation_stats *stats = this_cpu_ptr(&name##_stats);  \
    u64 start = rdtsc();                                           \
    code;                                                          \
    u64 delta = rdtsc() - start;                                  \
    stats->total_cycles += delta;                                  \
    stats->total_calls++;                                          \
    if (delta > stats->max_cycles)                                \
        stats->max_cycles = delta;                                 \
})

// Usage example
static void measured_context_switch(void)
{
    MEASURE_MITIGATION(kpti, {
        switch_to_kernel_cr3();
        /* Context switch code */
        switch_to_user_cr3();
    });
}
```

### Selective Mitigation

```bash
# Fine-grained mitigation control
# /etc/default/grub
GRUB_CMDLINE_LINUX="$GRUB_CMDLINE_LINUX mitigations=auto,nosmt spectre_v2=retpoline spec_store_bypass_disable=seccomp l1tf=full,force mds=full,nosmt tsx_async_abort=full,nosmt"

# Process-specific mitigation control
# /proc/PID/status
grep Speculation /proc/self/status
# Speculation_Store_Bypass:    thread force mitigated
# Speculation_Indirect_Branch: conditional force disabled

# Disable mitigations for specific process
prctl(PR_SET_SPECULATION_CTRL, PR_SPEC_STORE_BYPASS,
      PR_SPEC_FORCE_DISABLE, 0, 0);
```

## Testing and Validation

### Security Test Suite

```c
// kernel_hardening_test.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/prctl.h>

int test_nx_protection(void)
{
    void *exec_page;

    /* Allocate writable page */
    exec_page = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
                     MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);

    if (exec_page == MAP_FAILED) {
        perror("mmap");
        return -1;
    }

    /* Write shellcode */
    unsigned char shellcode[] = "\xc3"; /* ret */
    memcpy(exec_page, shellcode, sizeof(shellcode));

    /* Try to execute - should fail with NX */
    if (mprotect(exec_page, 4096, PROT_READ | PROT_EXEC) == 0) {
        printf("FAIL: NX protection not working\n");
        return -1;
    }

    printf("PASS: NX protection working\n");
    return 0;
}

int test_kaslr(void)
{
    FILE *f;
    unsigned long addr1, addr2;

    /* Read kernel symbol address */
    f = fopen("/proc/kallsyms", "r");
    if (!f) {
        printf("SKIP: Cannot read /proc/kallsyms\n");
        return 0;
    }

    fscanf(f, "%lx", &addr1);
    fclose(f);

    /* Check if address looks randomized */
    if ((addr1 & 0xFFFFFF) == 0) {
        printf("FAIL: KASLR might be disabled\n");
        return -1;
    }

    printf("PASS: KASLR appears enabled\n");
    return 0;
}

int main(void)
{
    printf("Kernel Hardening Test Suite\n");
    printf("===========================\n");

    test_nx_protection();
    test_kaslr();
    /* Add more tests */

    return 0;
}
```

### Exploit Mitigation Testing

```python
#!/usr/bin/env python3
# test_mitigations.py - Test kernel exploit mitigations

import os
import subprocess
import ctypes
import mmap

class KernelMitigationTester:
    def __init__(self):
        self.results = {}

    def test_kaslr(self):
        """Test KASLR effectiveness"""
        try:
            # Check for KASLR in cmdline
            with open('/proc/cmdline', 'r') as f:
                cmdline = f.read()
                if 'nokaslr' in cmdline:
                    return False, "KASLR disabled in boot parameters"

            # Check kernel offset
            with open('/proc/kallsyms', 'r') as f:
                first_symbol = f.readline().split()[0]
                if first_symbol == '0000000000000000':
                    return False, "kallsyms not available"

                # Check for randomization
                addr = int(first_symbol, 16)
                if (addr & 0xFFFFFF) != 0:
                    return True, "KASLR active"

        except Exception as e:
            return False, f"Error: {e}"

        return False, "KASLR status unknown"

    def test_nx(self):
        """Test NX bit enforcement"""
        try:
            # Check CPU support
            with open('/proc/cpuinfo', 'r') as f:
                if 'nx' not in f.read():
                    return False, "CPU doesn't support NX"

            # Test actual enforcement
            shellcode = b"\x31\xc0\xc3"  # xor eax,eax; ret

            # Create executable mapping
            buf = mmap.mmap(-1, len(shellcode),
                           prot=mmap.PROT_READ | mmap.PROT_WRITE | mmap.PROT_EXEC)
            buf.write(shellcode)

            # This should work
            cfunc = ctypes.CFUNCTYPE(ctypes.c_int)(ctypes.addressof(ctypes.c_char.from_buffer(buf)))

            # Create non-executable mapping
            buf2 = mmap.mmap(-1, len(shellcode),
                            prot=mmap.PROT_READ | mmap.PROT_WRITE)
            buf2.write(shellcode)

            # This should fail
            try:
                cfunc2 = ctypes.CFUNCTYPE(ctypes.c_int)(ctypes.addressof(ctypes.c_char.from_buffer(buf2)))
                cfunc2()
                return False, "NX not enforced"
            except:
                return True, "NX properly enforced"

        except Exception as e:
            return False, f"Error testing NX: {e}"

    def test_smep(self):
        """Test SMEP (Supervisor Mode Execution Prevention)"""
        try:
            with open('/proc/cpuinfo', 'r') as f:
                if 'smep' in f.read():
                    return True, "SMEP supported and likely enabled"
                else:
                    return False, "SMEP not supported by CPU"
        except:
            return False, "Could not determine SMEP status"

    def test_smap(self):
        """Test SMAP (Supervisor Mode Access Prevention)"""
        try:
            with open('/proc/cpuinfo', 'r') as f:
                if 'smap' in f.read():
                    return True, "SMAP supported and likely enabled"
                else:
                    return False, "SMAP not supported by CPU"
        except:
            return False, "Could not determine SMAP status"

    def test_kpti(self):
        """Test KPTI (Kernel Page Table Isolation)"""
        try:
            with open('/sys/devices/system/cpu/vulnerabilities/meltdown', 'r') as f:
                status = f.read().strip()
                if 'Mitigation: PTI' in status:
                    return True, "KPTI enabled"
                elif 'Vulnerable' in status:
                    return False, "KPTI disabled - system vulnerable"
                else:
                    return True, f"Status: {status}"
        except:
            return False, "Could not determine KPTI status"

    def run_all_tests(self):
        """Run all mitigation tests"""
        tests = [
            ('KASLR', self.test_kaslr),
            ('NX/DEP', self.test_nx),
            ('SMEP', self.test_smep),
            ('SMAP', self.test_smap),
            ('KPTI', self.test_kpti),
        ]

        print("Kernel Security Mitigation Tests")
        print("=" * 40)

        for name, test_func in tests:
            passed, message = test_func()
            status = "PASS" if passed else "FAIL"
            print(f"{name:.<30} [{status}] {message}")
            self.results[name] = passed

        print("=" * 40)
        passed = sum(self.results.values())
        total = len(self.results)
        print(f"Summary: {passed}/{total} tests passed")

if __name__ == '__main__':
    tester = KernelMitigationTester()
    tester.run_all_tests()
```

## Best Practices

### 1. Defense in Depth

```bash
# Layer multiple protections
# Boot parameters
GRUB_CMDLINE_LINUX="$GRUB_CMDLINE_LINUX init_on_alloc=1 init_on_free=1 page_alloc.shuffle=1 slab_nomerge pti=on randomize_kstack_offset=on"

# Runtime hardening
echo "kernel.unprivileged_bpf_disabled=1" >> /etc/sysctl.conf
echo "kernel.kexec_load_disabled=1" >> /etc/sysctl.conf
```

### 2. Regular Updates

```bash
#!/bin/bash
# Check for security updates
check_kernel_updates() {
    current=$(uname -r)
    echo "Current kernel: $current"

    # Check for CVEs
    echo "Checking for known vulnerabilities..."
    for cve in /sys/devices/system/cpu/vulnerabilities/*; do
        vuln=$(basename $cve)
        status=$(cat $cve)
        echo "$vuln: $status"
    done

    # Check for available updates
    if command -v apt-get >/dev/null; then
        apt-get update
        apt-cache policy linux-image-generic
    elif command -v yum >/dev/null; then
        yum check-update kernel
    fi
}
```

### 3. Monitoring and Alerting

```c
// Kernel security event monitor
static int security_event_notify(struct notifier_block *nb,
                               unsigned long action, void *data)
{
    switch (action) {
    case SECURITY_KERNEL_MODULE_LOAD:
        pr_warn("Kernel module loaded\n");
        break;
    case SECURITY_KERNEL_READ:
        pr_warn("Kernel memory read attempt\n");
        break;
    case SECURITY_LOCKDOWN_VIOLATION:
        pr_warn("Lockdown violation\n");
        break;
    }

    return NOTIFY_OK;
}
```

## Conclusion

Linux kernel hardening is an ongoing process that requires balancing security with performance and compatibility. Modern kernels provide extensive hardening options, from architectural features like KASLR and KPTI to advanced mitigations for CPU vulnerabilities.

Key takeaways:

- Enable all relevant hardening options for your threat model
- Keep kernels updated to get the latest security fixes
- Monitor performance impact and tune accordingly
- Test mitigations regularly to ensure they're working
- Use defense in depth - no single mitigation is perfect
- Consider hardware features when selecting platforms

As attack techniques evolve, so do kernel defenses. Stay informed about new vulnerabilities and mitigations, and regularly review and update your hardening configuration.

---

## Resources

- [Kernel Self Protection Project](https://kernsec.org/wiki/index.php/Kernel_Self_Protection_Project)
- [Linux Kernel Security Documentation](https://www.kernel.org/doc/html/latest/admin-guide/kernel-parameters.html)
- [CPU Vulnerability Mitigations](https://www.kernel.org/doc/html/latest/admin-guide/hw-vuln/)
- [Grsecurity (Reference Implementation)](https://grsecurity.net/)

---

_Next: Linux Kernel Exploitation and Defense - Understanding Attack Techniques and Building Robust Defenses_
