---
author: Anubhav Gain
pubDatetime: 2025-08-02T16:00:00+05:30
tags:
  - ebpf
  - rust
  - aya
  - security
  - monitoring
  - linux
  - kernel
modDatetime: 2025-08-02T16:00:00+05:30
title: "Building Modern eBPF Security Tools with Rust and Aya: A Comprehensive Guide"
slug: ebpf-rust-aya-security-monitoring
featured: true
draft: false
category: eBPF
description: Learn how to build production-grade eBPF security tools using Rust and Aya. From basic monitoring to advanced threat detection, this guide covers everything you need to know about modern eBPF development.
---

# Building Modern eBPF Security Tools with Rust and Aya: A Comprehensive Guide

The eBPF ecosystem has evolved significantly, with Rust emerging as a powerful language for building safe, efficient, and maintainable eBPF programs. Aya, a pure-Rust eBPF library, has revolutionized how we develop kernel-level security tools by bringing Rust's safety guarantees to the kernel. This comprehensive guide explores building production-grade security monitoring solutions using Rust and Aya.

## Why Rust and Aya for eBPF Security?

### The Perfect Match

Rust's memory safety, zero-cost abstractions, and powerful type system make it ideal for eBPF development:

- **Memory Safety**: No null pointer dereferences or buffer overflows
- **Type Safety**: Catch errors at compile time, not in production
- **Performance**: Zero-cost abstractions mean no runtime overhead
- **Expressiveness**: Modern language features for cleaner code

### Aya's Advantages

Unlike traditional eBPF development with C and libbpf, Aya offers:

- **Pure Rust**: Both kernel and user-space code in Rust
- **No Dependencies**: Built from scratch without libbpf or BCC
- **Compile Once, Run Everywhere**: True portability with BTF and musl
- **Developer Experience**: Idiomatic Rust APIs and excellent tooling

## Setting Up Your Development Environment

### Prerequisites

```bash
# Install Rust and cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install bpf-linker for eBPF compilation
cargo install bpf-linker

# Install cargo-generate for project templates
cargo install cargo-generate

# Install bpftool for debugging
sudo apt-get install linux-tools-common linux-tools-generic

# Verify kernel support
uname -r  # Should be 5.4+ for best compatibility
```

### Creating Your First Aya Project

```bash
# Generate a new eBPF project
cargo generate https://github.com/aya-rs/aya-template

# Project structure
security-monitor/
├── Cargo.toml
├── security-monitor/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── security-monitor-common/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── security-monitor-ebpf/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── xtask/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

## Building a File Integrity Monitor

Let's build a production-grade file integrity monitoring system:

### eBPF Program (Kernel Space)

```rust
// security-monitor-ebpf/src/main.rs
#![no_std]
#![no_main]

use aya_ebpf::{
    bindings::xdp_action,
    macros::{kprobe, lsm, map, tracepoint},
    maps::{HashMap, PerfEventArray, RingBuf},
    programs::{KProbeContext, LsmContext, TracePointContext},
    helpers::{
        bpf_get_current_pid_tgid,
        bpf_get_current_uid_gid,
        bpf_ktime_get_ns,
        bpf_probe_read_kernel_str_bytes,
        bpf_d_path,
    },
};
use aya_log_ebpf::info;
use security_monitor_common::{FileEvent, EventType, ProcessInfo};

#[map]
static mut FILE_EVENTS: RingBuf = RingBuf::with_max_entries(256 * 1024, 0);

#[map]
static mut PROCESS_CACHE: HashMap<u32, ProcessInfo> = HashMap::with_max_entries(10240, 0);

#[map]
static mut MONITORED_PATHS: HashMap<[u8; 256], u8> = HashMap::with_max_entries(1024, 0);

#[lsm(hook = "file_open")]
pub fn monitor_file_open(ctx: LsmContext) -> i32 {
    match try_monitor_file_open(ctx) {
        Ok(ret) => ret,
        Err(_) => 0,
    }
}

fn try_monitor_file_open(ctx: LsmContext) -> Result<i32, i64> {
    // Get file path
    let file: *const bindings::file = unsafe { ctx.arg(0) };
    let mut path_buf = [0u8; 256];

    unsafe {
        let dentry = (*file).f_path.dentry;
        let mnt = (*file).f_path.mnt;

        // Use d_path helper to get full path
        bpf_d_path(&(*file).f_path as *const _ as *mut _,
                   path_buf.as_mut_ptr() as *mut _,
                   path_buf.len() as u32);
    }

    // Check if path is monitored
    if !is_monitored_path(&path_buf)? {
        return Ok(0);
    }

    // Get process information
    let pid_tgid = bpf_get_current_pid_tgid();
    let pid = (pid_tgid >> 32) as u32;
    let tgid = pid_tgid as u32;

    let uid_gid = bpf_get_current_uid_gid();
    let uid = uid_gid as u32;
    let gid = (uid_gid >> 32) as u32;

    // Create file event
    let event = FileEvent {
        timestamp: unsafe { bpf_ktime_get_ns() },
        event_type: EventType::FileOpen,
        pid,
        tgid,
        uid,
        gid,
        path: path_buf,
        flags: unsafe { (*file).f_flags },
        mode: unsafe { (*file).f_mode },
    };

    // Submit event to ring buffer
    unsafe {
        FILE_EVENTS.output(&event, 0)?;
    }

    Ok(0)
}

#[kprobe("security_file_permission")]
pub fn monitor_file_permission(ctx: KProbeContext) -> i32 {
    match try_monitor_file_permission(ctx) {
        Ok(ret) => ret,
        Err(_) => 0,
    }
}

fn try_monitor_file_permission(ctx: KProbeContext) -> Result<i32, i64> {
    let file: *const bindings::file = unsafe { ctx.arg(0).ok_or(0i64)? };
    let mask: i32 = unsafe { ctx.arg(1).ok_or(0i64)? };

    // Check for write operations
    if mask & 0x2 == 0 {  // MAY_WRITE
        return Ok(0);
    }

    let mut path_buf = [0u8; 256];
    unsafe {
        bpf_d_path(&(*file).f_path as *const _ as *mut _,
                   path_buf.as_mut_ptr() as *mut _,
                   path_buf.len() as u32);
    }

    if !is_monitored_path(&path_buf)? {
        return Ok(0);
    }

    let pid_tgid = bpf_get_current_pid_tgid();
    let uid_gid = bpf_get_current_uid_gid();

    let event = FileEvent {
        timestamp: unsafe { bpf_ktime_get_ns() },
        event_type: EventType::FileWrite,
        pid: (pid_tgid >> 32) as u32,
        tgid: pid_tgid as u32,
        uid: uid_gid as u32,
        gid: (uid_gid >> 32) as u32,
        path: path_buf,
        flags: mask as u32,
        mode: 0,
    };

    unsafe {
        FILE_EVENTS.output(&event, 0)?;
    }

    Ok(0)
}

#[tracepoint("syscalls", "sys_exit_unlink")]
pub fn monitor_file_unlink(ctx: TracePointContext) -> i32 {
    match try_monitor_file_unlink(ctx) {
        Ok(ret) => ret,
        Err(_) => 0,
    }
}

fn try_monitor_file_unlink(ctx: TracePointContext) -> Result<i32, i64> {
    // Get return value to check if unlink succeeded
    let ret: i64 = unsafe { ctx.read_at(16)? };
    if ret < 0 {
        return Ok(0);  // Unlink failed
    }

    // Get the pathname from saved args
    let pathname_ptr: *const u8 = unsafe { ctx.read_at(24)? };
    let mut path_buf = [0u8; 256];

    unsafe {
        bpf_probe_read_kernel_str_bytes(
            pathname_ptr,
            &mut path_buf
        )?;
    }

    if !is_monitored_path(&path_buf)? {
        return Ok(0);
    }

    let pid_tgid = bpf_get_current_pid_tgid();
    let uid_gid = bpf_get_current_uid_gid();

    let event = FileEvent {
        timestamp: unsafe { bpf_ktime_get_ns() },
        event_type: EventType::FileDelete,
        pid: (pid_tgid >> 32) as u32,
        tgid: pid_tgid as u32,
        uid: uid_gid as u32,
        gid: (uid_gid >> 32) as u32,
        path: path_buf,
        flags: 0,
        mode: 0,
    };

    unsafe {
        FILE_EVENTS.output(&event, 0)?;
    }

    Ok(0)
}

#[inline(always)]
fn is_monitored_path(path: &[u8; 256]) -> Result<bool, i64> {
    // Check exact match
    unsafe {
        if MONITORED_PATHS.get(path).is_some() {
            return Ok(true);
        }
    }

    // Check prefix match for directories
    for i in (1..256).rev() {
        if path[i] == b'/' || path[i] == 0 {
            let mut prefix = [0u8; 256];
            prefix[..=i].copy_from_slice(&path[..=i]);

            unsafe {
                if MONITORED_PATHS.get(&prefix).is_some() {
                    return Ok(true);
                }
            }

            if path[i] == 0 {
                break;
            }
        }
    }

    Ok(false)
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    unreachable!()
}
```

### Common Types (Shared)

```rust
// security-monitor-common/src/lib.rs
#![no_std]

#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct FileEvent {
    pub timestamp: u64,
    pub event_type: EventType,
    pub pid: u32,
    pub tgid: u32,
    pub uid: u32,
    pub gid: u32,
    pub path: [u8; 256],
    pub flags: u32,
    pub mode: u32,
}

#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub enum EventType {
    FileOpen = 1,
    FileWrite = 2,
    FileDelete = 3,
    FileRename = 4,
    ProcessExec = 5,
    NetworkConnect = 6,
}

#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct ProcessInfo {
    pub pid: u32,
    pub ppid: u32,
    pub uid: u32,
    pub gid: u32,
    pub comm: [u8; 16],
    pub executable: [u8; 256],
    pub start_time: u64,
}

// Implement safe conversion for paths
impl FileEvent {
    pub fn path_str(&self) -> Result<&str, core::str::Utf8Error> {
        let len = self.path.iter()
            .position(|&x| x == 0)
            .unwrap_or(self.path.len());
        core::str::from_utf8(&self.path[..len])
    }
}
```

### User Space Application

```rust
// security-monitor/src/main.rs
use anyhow::{Context, Result};
use aya::{
    include_bytes_aligned,
    maps::{HashMap, RingBuf},
    programs::{Lsm, KProbe, TracePoint},
    Btf, BpfLoader,
};
use aya_log::BpfLogger;
use bytes::BytesMut;
use clap::Parser;
use log::{info, warn, error};
use security_monitor_common::{FileEvent, EventType};
use std::{
    collections::HashSet,
    convert::TryFrom,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};
use tokio::{
    signal,
    sync::mpsc,
    time::sleep,
};

#[derive(Debug, Parser)]
struct Opt {
    /// Paths to monitor (can be specified multiple times)
    #[clap(short, long, value_name = "PATH")]
    monitor: Vec<String>,

    /// Output format (json, text)
    #[clap(short, long, default_value = "text")]
    format: String,

    /// Enable verbose output
    #[clap(short, long)]
    verbose: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let opt = Opt::parse();

    env_logger::init();

    // Load eBPF program
    #[cfg(debug_assertions)]
    let mut bpf = BpfLoader::new()
        .btf(&Btf::from_sys_fs().ok())
        .load(include_bytes_aligned!(
            "../../target/bpfel-unknown-none/debug/security-monitor"
        ))?;

    #[cfg(not(debug_assertions))]
    let mut bpf = BpfLoader::new()
        .btf(&Btf::from_sys_fs().ok())
        .load(include_bytes_aligned!(
            "../../target/bpfel-unknown-none/release/security-monitor"
        ))?;

    // Initialize eBPF logger
    if let Err(e) = BpfLogger::init(&mut bpf) {
        warn!("Failed to initialize eBPF logger: {}", e);
    }

    // Set up monitored paths
    let mut monitored_paths: HashMap<_, [u8; 256], u8> =
        HashMap::try_from(bpf.take_map("MONITORED_PATHS").unwrap())?;

    for path in &opt.monitor {
        let mut path_buf = [0u8; 256];
        let path_bytes = path.as_bytes();
        let len = path_bytes.len().min(255);
        path_buf[..len].copy_from_slice(&path_bytes[..len]);
        path_buf[len] = 0;

        monitored_paths.insert(path_buf, 1, 0)?;
        info!("Monitoring path: {}", path);
    }

    // Attach programs
    let lsm_prog: &mut Lsm = bpf.program_mut("monitor_file_open").unwrap().try_into()?;
    lsm_prog.load()?;
    lsm_prog.attach()?;

    let kprobe_prog: &mut KProbe = bpf.program_mut("monitor_file_permission").unwrap().try_into()?;
    kprobe_prog.load()?;
    kprobe_prog.attach()?;

    let tp_prog: &mut TracePoint = bpf.program_mut("monitor_file_unlink").unwrap().try_into()?;
    tp_prog.load()?;
    tp_prog.attach()?;

    info!("Security monitor started. Press Ctrl-C to exit.");

    // Set up event processing
    let mut ring_buf = RingBuf::try_from(bpf.take_map("FILE_EVENTS").unwrap())?;

    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    // Handle shutdown signal
    tokio::spawn(async move {
        signal::ctrl_c().await.expect("Failed to listen for Ctrl-C");
        r.store(false, Ordering::SeqCst);
    });

    // Event processing loop
    let (tx, mut rx) = mpsc::channel::<FileEvent>(1000);

    // Spawn event reader task
    let reader_running = running.clone();
    tokio::task::spawn_blocking(move || {
        let mut buffers = (0..10)
            .map(|_| BytesMut::with_capacity(1024))
            .collect::<Vec<_>>();

        while reader_running.load(Ordering::SeqCst) {
            if let Err(e) = ring_buf.poll(&mut buffers) {
                if e.kind() != std::io::ErrorKind::WouldBlock {
                    error!("Error polling ring buffer: {}", e);
                }
                std::thread::sleep(Duration::from_millis(10));
                continue;
            }

            for buf in &mut buffers {
                if buf.len() >= std::mem::size_of::<FileEvent>() {
                    let event = unsafe {
                        std::ptr::read_unaligned(buf.as_ptr() as *const FileEvent)
                    };

                    if let Err(e) = tx.blocking_send(event) {
                        error!("Failed to send event: {}", e);
                    }

                    buf.clear();
                }
            }
        }
    });

    // Event processor
    let event_processor = EventProcessor::new(opt.format.clone());

    while running.load(Ordering::SeqCst) {
        tokio::select! {
            Some(event) = rx.recv() => {
                event_processor.process_event(&event).await?;
            }
            _ = sleep(Duration::from_secs(1)) => {
                // Periodic tasks can go here
            }
        }
    }

    info!("Security monitor stopped.");
    Ok(())
}

struct EventProcessor {
    format: String,
    event_count: u64,
}

impl EventProcessor {
    fn new(format: String) -> Self {
        Self {
            format,
            event_count: 0,
        }
    }

    async fn process_event(&mut self, event: &FileEvent) -> Result<()> {
        self.event_count += 1;

        match self.format.as_str() {
            "json" => self.output_json(event),
            _ => self.output_text(event),
        }
    }

    fn output_json(&self, event: &FileEvent) -> Result<()> {
        use serde_json::json;

        let path = event.path_str().unwrap_or("<invalid>");
        let event_type = match event.event_type {
            EventType::FileOpen => "open",
            EventType::FileWrite => "write",
            EventType::FileDelete => "delete",
            EventType::FileRename => "rename",
            _ => "unknown",
        };

        let output = json!({
            "timestamp": event.timestamp,
            "event_type": event_type,
            "pid": event.pid,
            "uid": event.uid,
            "gid": event.gid,
            "path": path,
            "flags": event.flags,
            "mode": event.mode,
            "event_number": self.event_count,
        });

        println!("{}", output);
        Ok(())
    }

    fn output_text(&self, event: &FileEvent) -> Result<()> {
        let path = event.path_str().unwrap_or("<invalid>");
        let event_type = match event.event_type {
            EventType::FileOpen => "OPEN",
            EventType::FileWrite => "WRITE",
            EventType::FileDelete => "DELETE",
            EventType::FileRename => "RENAME",
            _ => "UNKNOWN",
        };

        println!(
            "[{}] {} | PID: {} | UID: {} | Path: {} | Flags: 0x{:x}",
            self.event_count,
            event_type,
            event.pid,
            event.uid,
            path,
            event.flags
        );

        Ok(())
    }
}
```

## Advanced Security Monitoring Features

### Network Security Monitor

```rust
// network-monitor-ebpf/src/main.rs
#![no_std]
#![no_main]

use aya_ebpf::{
    bindings::{TC_ACT_OK, TC_ACT_SHOT},
    macros::{classifier, map, xdp},
    maps::{LruHashMap, RingBuf},
    programs::{TcContext, XdpContext},
};
use core::mem;
use network_monitor_common::{NetworkEvent, ConnectionInfo, Protocol};

#[map]
static mut NETWORK_EVENTS: RingBuf = RingBuf::with_max_entries(256 * 1024, 0);

#[map]
static mut CONNECTION_TRACKING: LruHashMap<ConnectionInfo, u64> =
    LruHashMap::with_max_entries(65536, 0);

#[map]
static mut BLOCKED_IPS: LruHashMap<u32, u64> = LruHashMap::with_max_entries(10000, 0);

#[xdp]
pub fn xdp_firewall(ctx: XdpContext) -> u32 {
    match try_xdp_firewall(ctx) {
        Ok(ret) => ret,
        Err(_) => xdp_action::XDP_PASS,
    }
}

fn try_xdp_firewall(ctx: XdpContext) -> Result<u32, ()> {
    let ethhdr: *const EthHdr = unsafe { ptr_at(&ctx, 0)? };

    // Skip non-IP packets
    if unsafe { (*ethhdr).ether_type } != ETH_P_IP {
        return Ok(xdp_action::XDP_PASS);
    }

    let iphdr: *const IpHdr = unsafe { ptr_at(&ctx, EthHdr::LEN)? };
    let src_ip = unsafe { (*iphdr).src_addr };

    // Check if IP is blocked
    unsafe {
        if BLOCKED_IPS.get(&src_ip).is_some() {
            // Log blocked attempt
            let event = NetworkEvent {
                timestamp: bpf_ktime_get_ns(),
                event_type: NetworkEventType::Blocked,
                src_ip,
                dst_ip: (*iphdr).dst_addr,
                src_port: 0,
                dst_port: 0,
                protocol: Protocol::from((*iphdr).protocol),
                packet_len: ctx.data_end() - ctx.data(),
                action: NetworkAction::Drop,
            };

            let _ = NETWORK_EVENTS.output(&event, 0);
            return Ok(xdp_action::XDP_DROP);
        }
    }

    // Track connection for TCP
    if unsafe { (*iphdr).protocol } == IPPROTO_TCP {
        let tcphdr: *const TcpHdr = unsafe {
            ptr_at(&ctx, EthHdr::LEN + (*iphdr).ihl() as usize * 4)?
        };

        let conn_info = ConnectionInfo {
            src_ip,
            dst_ip: unsafe { (*iphdr).dst_addr },
            src_port: unsafe { (*tcphdr).source },
            dst_port: unsafe { (*tcphdr).dest },
            protocol: Protocol::TCP,
        };

        let now = unsafe { bpf_ktime_get_ns() };
        unsafe {
            CONNECTION_TRACKING.insert(&conn_info, &now, 0)?;
        }

        // Detect SYN flood
        if unsafe { (*tcphdr).syn() == 1 && (*tcphdr).ack() == 0 } {
            if is_syn_flood(&conn_info)? {
                let event = NetworkEvent {
                    timestamp: now,
                    event_type: NetworkEventType::SynFlood,
                    src_ip: conn_info.src_ip,
                    dst_ip: conn_info.dst_ip,
                    src_port: conn_info.src_port,
                    dst_port: conn_info.dst_port,
                    protocol: Protocol::TCP,
                    packet_len: ctx.data_end() - ctx.data(),
                    action: NetworkAction::Alert,
                };

                unsafe {
                    let _ = NETWORK_EVENTS.output(&event, 0);
                }
            }
        }
    }

    Ok(xdp_action::XDP_PASS)
}

#[classifier]
pub fn tc_egress_monitor(ctx: TcContext) -> i32 {
    match try_tc_egress_monitor(ctx) {
        Ok(ret) => ret,
        Err(_) => TC_ACT_OK,
    }
}

fn try_tc_egress_monitor(mut ctx: TcContext) -> Result<i32, ()> {
    let ethhdr: EthHdr = ctx.load(0)?;

    if ethhdr.ether_type != ETH_P_IP {
        return Ok(TC_ACT_OK);
    }

    let iphdr: IpHdr = ctx.load(EthHdr::LEN)?;

    // Monitor suspicious outbound connections
    if iphdr.protocol == IPPROTO_TCP {
        let tcphdr: TcpHdr = ctx.load(EthHdr::LEN + iphdr.ihl() as usize * 4)?;

        // Check for suspicious ports
        if is_suspicious_port(tcphdr.dest) {
            let event = NetworkEvent {
                timestamp: unsafe { bpf_ktime_get_ns() },
                event_type: NetworkEventType::SuspiciousConnection,
                src_ip: iphdr.src_addr,
                dst_ip: iphdr.dst_addr,
                src_port: tcphdr.source,
                dst_port: tcphdr.dest,
                protocol: Protocol::TCP,
                packet_len: ctx.len() as u32,
                action: NetworkAction::Monitor,
            };

            unsafe {
                let _ = NETWORK_EVENTS.output(&event, 0);
            }
        }
    }

    Ok(TC_ACT_OK)
}

#[inline(always)]
fn is_suspicious_port(port: u16) -> bool {
    matches!(port.to_be(),
        4444 |  // Common backdoor
        5555 |  // Android ADB
        6666 |  // IRC backdoor
        6667 |  // IRC
        8333 |  // Bitcoin
        9001    // Tor
    )
}

#[inline(always)]
fn is_syn_flood(conn: &ConnectionInfo) -> Result<bool, ()> {
    // Simple SYN flood detection: too many SYN packets from same source
    // In production, use more sophisticated detection
    Ok(false) // Placeholder
}
```

### Process Behavior Analysis

```rust
// process-monitor-ebpf/src/main.rs
use aya_ebpf::{
    macros::{lsm, map, tracepoint},
    maps::{LruHashMap, RingBuf, PerCpuArray},
};

#[map]
static mut PROCESS_EVENTS: RingBuf = RingBuf::with_max_entries(512 * 1024, 0);

#[map]
static mut PROCESS_TREE: LruHashMap<u32, ProcessInfo> =
    LruHashMap::with_max_entries(10000, 0);

#[map]
static mut ANOMALY_SCORES: PerCpuArray<AnomalyScore> =
    PerCpuArray::with_max_entries(1, 0);

#[tracepoint("sched", "sched_process_exec")]
pub fn trace_exec(ctx: TracePointContext) -> i32 {
    match try_trace_exec(ctx) {
        Ok(ret) => ret,
        Err(_) => 0,
    }
}

fn try_trace_exec(ctx: TracePointContext) -> Result<i32, i64> {
    let pid = bpf_get_current_pid_tgid() >> 32;
    let ppid = get_parent_pid()?;

    // Get executable path
    let filename: *const u8 = unsafe { ctx.read_at(16)? };
    let mut exe_path = [0u8; 256];
    unsafe {
        bpf_probe_read_user_str_bytes(filename, &mut exe_path)?;
    }

    // Behavioral analysis
    let mut anomaly_score = 0u32;

    // Check 1: Execution from /tmp
    if is_tmp_execution(&exe_path) {
        anomaly_score += 20;
    }

    // Check 2: Hidden process (name starts with .)
    if exe_path[0] == b'.' {
        anomaly_score += 15;
    }

    // Check 3: Process tree anomaly
    if is_process_tree_anomaly(pid, ppid)? {
        anomaly_score += 30;
    }

    // Check 4: Known malicious patterns
    if contains_malicious_pattern(&exe_path) {
        anomaly_score += 40;
    }

    // Create process info
    let proc_info = ProcessInfo {
        pid,
        ppid,
        uid: (bpf_get_current_uid_gid() & 0xFFFFFFFF) as u32,
        gid: (bpf_get_current_uid_gid() >> 32) as u32,
        exe_path,
        anomaly_score,
        start_time: unsafe { bpf_ktime_get_ns() },
    };

    // Update process tree
    unsafe {
        PROCESS_TREE.insert(&pid, &proc_info, 0)?;
    }

    // Alert on high anomaly score
    if anomaly_score >= 50 {
        let event = ProcessEvent {
            timestamp: proc_info.start_time,
            event_type: ProcessEventType::AnomalousExecution,
            process: proc_info,
            details: ProcessEventDetails::AnomalyDetected { score: anomaly_score },
        };

        unsafe {
            PROCESS_EVENTS.output(&event, 0)?;
        }
    }

    Ok(0)
}

#[lsm(hook = "task_kill")]
pub fn monitor_kill(ctx: LsmContext) -> i32 {
    match try_monitor_kill(ctx) {
        Ok(ret) => ret,
        Err(_) => 0,
    }
}

fn try_monitor_kill(ctx: LsmContext) -> Result<i32, i64> {
    let target_task: *const task_struct = unsafe { ctx.arg(0) };
    let signal: i32 = unsafe { ctx.arg(2) };

    // Get killer and target PIDs
    let killer_pid = (bpf_get_current_pid_tgid() >> 32) as u32;
    let target_pid = unsafe { (*target_task).pid };

    // Check for suspicious kill patterns
    if is_suspicious_kill(killer_pid, target_pid, signal)? {
        let event = ProcessEvent {
            timestamp: unsafe { bpf_ktime_get_ns() },
            event_type: ProcessEventType::SuspiciousKill,
            process: get_process_info(killer_pid)?,
            details: ProcessEventDetails::Kill {
                target_pid,
                signal,
            },
        };

        unsafe {
            PROCESS_EVENTS.output(&event, 0)?;
        }
    }

    Ok(0)
}

#[inline(always)]
fn is_tmp_execution(path: &[u8; 256]) -> bool {
    path.len() >= 5 &&
    path[0] == b'/' &&
    path[1] == b't' &&
    path[2] == b'm' &&
    path[3] == b'p' &&
    path[4] == b'/'
}

#[inline(always)]
fn contains_malicious_pattern(path: &[u8; 256]) -> bool {
    // Check for known malicious patterns
    const PATTERNS: &[&[u8]] = &[
        b"xmrig",
        b"minerd",
        b"cryptonight",
        b".hidden",
        b"backdoor",
    ];

    for pattern in PATTERNS {
        if contains_pattern(path, pattern) {
            return true;
        }
    }

    false
}
```

## Production Deployment with Aya

### Container Deployment

```dockerfile
# Dockerfile for eBPF security monitor
FROM rust:1.70 AS builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    clang \
    llvm \
    libbpf-dev \
    linux-headers-generic

# Install bpf-linker
RUN cargo install bpf-linker

# Copy source code
WORKDIR /app
COPY . .

# Build eBPF programs
RUN cargo xtask build-ebpf --release

# Build user-space application
RUN cargo build --release

# Runtime image
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/security-monitor /usr/local/bin/
COPY --from=builder /app/target/bpfel-unknown-none/release/* /usr/local/lib/bpf/

# Run with required capabilities
ENTRYPOINT ["/usr/local/bin/security-monitor"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: aya-security-monitor
  namespace: security
spec:
  selector:
    matchLabels:
      app: aya-security-monitor
  template:
    metadata:
      labels:
        app: aya-security-monitor
    spec:
      hostNetwork: true
      hostPID: true
      containers:
        - name: monitor
          image: your-registry/aya-security-monitor:latest
          imagePullPolicy: Always
          command: ["/usr/local/bin/security-monitor"]
          args:
            - "--monitor=/etc"
            - "--monitor=/var/lib"
            - "--monitor=/usr/bin"
            - "--format=json"
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          securityContext:
            privileged: true
            capabilities:
              add:
                - SYS_ADMIN
                - SYS_RESOURCE
                - NET_ADMIN
                - PERFMON
                - BPF
          volumeMounts:
            - name: sys
              mountPath: /sys
              readOnly: true
            - name: proc
              mountPath: /proc
              readOnly: true
            - name: dev
              mountPath: /dev
              readOnly: true
            - name: host
              mountPath: /host
              readOnly: true
          resources:
            limits:
              memory: 500Mi
              cpu: 500m
            requests:
              memory: 200Mi
              cpu: 100m
      volumes:
        - name: sys
          hostPath:
            path: /sys
        - name: proc
          hostPath:
            path: /proc
        - name: dev
          hostPath:
            path: /dev
        - name: host
          hostPath:
            path: /
```

## Performance Optimization

### Efficient Map Usage

```rust
// Use per-CPU maps for high-frequency updates
#[map]
static mut STATS: PerCpuArray<Statistics> = PerCpuArray::with_max_entries(1, 0);

// Use LRU maps for automatic eviction
#[map]
static mut CACHE: LruHashMap<u64, CachedData> = LruHashMap::with_max_entries(10000, 0);

// Use bloom filters for membership tests
#[map]
static mut SEEN_FILES: BloomFilter<u64> = BloomFilter::with_max_entries(100000, 0);
```

### Batching and Sampling

```rust
#[kprobe("vfs_read")]
pub fn sample_reads(ctx: KProbeContext) -> i32 {
    // Sample 1 in 1000 events
    let sample_rate = 1000;
    let rand = bpf_get_prandom_u32();

    if rand % sample_rate != 0 {
        return 0;
    }

    // Process sampled event
    process_read_event(ctx)
}
```

## Testing and Debugging

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_matching() {
        let path = b"/etc/passwd\0";
        let mut path_buf = [0u8; 256];
        path_buf[..path.len()].copy_from_slice(path);

        assert!(is_sensitive_path(&path_buf));
    }

    #[test]
    fn test_anomaly_scoring() {
        let mut score = AnomalyScore::default();
        score.add_tmp_execution();
        score.add_hidden_process();

        assert!(score.total() >= 35);
    }
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use aya::{Bpf, BpfLoader};
use std::process::Command;

#[test]
fn test_file_monitoring() {
    // Load eBPF program
    let mut bpf = BpfLoader::new()
        .load_file("target/bpfel-unknown-none/debug/security-monitor")
        .unwrap();

    // Attach programs
    // ... attachment code ...

    // Trigger file access
    Command::new("cat")
        .arg("/etc/passwd")
        .output()
        .unwrap();

    // Verify event was captured
    // ... verification code ...
}
```

## Best Practices and Tips

### 1. Error Handling

Always use fallible operations and handle errors gracefully:

```rust
fn try_process_event(ctx: ProbeContext) -> Result<i32, i64> {
    // Use ? operator for error propagation
    let pid = bpf_get_current_pid_tgid();
    let data = ctx.read_user::<UserData>(addr)?;

    // Validate data before use
    if data.len > MAX_LEN {
        return Err(-1);
    }

    Ok(0)
}
```

### 2. Memory Management

Be mindful of stack usage and use heap maps when needed:

```rust
// Bad: Large stack allocation
let mut buffer = [0u8; 4096]; // Too large for eBPF stack

// Good: Use per-CPU array
#[map]
static mut BUFFERS: PerCpuArray<[u8; 4096]> = PerCpuArray::with_max_entries(1, 0);
```

### 3. Compatibility

Use CO-RE (Compile Once, Run Everywhere) features:

```rust
use aya_ebpf::cty::c_void;
use aya_ebpf_bindings::helpers::bpf_core_read;

// CO-RE compatible field access
let offset = bpf_core_field_offset!(task_struct, pid);
let pid = bpf_core_read::<u32>(task as *const c_void, offset)?;
```

## Conclusion

Rust and Aya bring modern Security Software Engineering practices to eBPF development, making it easier to build safe, efficient, and maintainable security tools. The combination of Rust's safety guarantees and eBPF's kernel-level capabilities creates a powerful platform for next-generation security monitoring.

Key advantages of using Rust and Aya:

1. **Type Safety**: Catch errors at compile time
2. **Memory Safety**: No buffer overflows or null pointer dereferences
3. **Modern Tooling**: Cargo, rustfmt, clippy, and excellent IDE support
4. **Pure Rust**: Both kernel and user space in the same language
5. **Performance**: Zero-cost abstractions with no runtime overhead

As the eBPF ecosystem continues to evolve, Rust and Aya are positioned to become the standard for building production-grade eBPF applications, especially in security-critical environments where safety and reliability are paramount.

---

## Resources for Further Learning

- [Aya Book](https://aya-rs.dev/book/) - Official Aya documentation
- [Aya Examples](https://github.com/aya-rs/aya/tree/main/examples) - Sample programs
- [awesome-aya](https://github.com/aya-rs/awesome-aya) - Curated list of Aya projects
- [Rust eBPF Working Group](https://github.com/rust-lang/ebpf-wg) - Rust eBPF ecosystem

---

_Next in the series: Building distributed eBPF security systems with Rust and cloud-native integration._
