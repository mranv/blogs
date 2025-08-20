---
author: Anubhav Gain
pubDatetime: 2025-01-10T16:30:00+05:30
modDatetime: 2025-01-10T16:30:00+05:30
title: eBPF for Network Performance Monitoring - Advanced Techniques
slug: ebpf-network-performance-monitoring
featured: true
draft: false
tags:
  - networking
  - ebpf
  - performance
  - monitoring
  - linux
  - observability
category: eBPF
description: Master eBPF for network performance monitoring with practical examples, XDP programs, and production-ready monitoring solutions
---

# eBPF for Network Performance Monitoring: Advanced Techniques and Real-World Implementation

Extended Berkeley Packet Filter (eBPF) has revolutionized network performance monitoring by enabling programmable, high-performance packet processing directly in the Linux kernel. This comprehensive guide explores advanced eBPF techniques for network monitoring, complete with production-ready code examples and deployment strategies.

## Table of Contents

## Introduction to eBPF Networking

eBPF allows you to run sandboxed programs in kernel space without changing kernel source code or loading kernel modules. For networking, this means:

- **Line-rate packet processing** with XDP (eXpress Data Path)
- **Zero-copy monitoring** with minimal overhead
- **Programmable network stack** at multiple hook points
- **Real-time network analytics** without packet drops

### eBPF Network Hook Points

```c
/* eBPF Network Attachment Points */
// XDP - Before SKB allocation (fastest)
SEC("xdp")
int xdp_prog(struct xdp_md *ctx)

// TC (Traffic Control) - After SKB creation
SEC("tc")
int tc_prog(struct __sk_buff *skb)

// Socket - Socket layer operations
SEC("sockops")
int sockops_prog(struct bpf_sock_ops *skops)

// SK_MSG - Message level processing
SEC("sk_msg")
int sk_msg_prog(struct sk_msg_md *msg)

// Flow Dissector - Custom flow parsing
SEC("flow_dissector")
int flow_dissector_prog(struct __sk_buff *skb)
```

## Building Network Performance Monitors

### 1. Packet Latency Tracker

Track packet processing latency through the network stack:

```c
// latency_monitor.bpf.c
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

#define MAX_ENTRIES 10000

struct packet_info {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
    __u8  protocol;
} __attribute__((packed));

struct latency_data {
    __u64 timestamp_ns;
    __u64 packets;
    __u64 total_latency_ns;
    __u64 max_latency_ns;
    __u64 min_latency_ns;
};

// Maps for tracking packet timestamps
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, MAX_ENTRIES);
    __type(key, struct packet_info);
    __type(value, __u64);  // timestamp
} packet_timestamps SEC(".maps");

// Per-flow latency statistics
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1000);
    __type(key, struct packet_info);
    __type(value, struct latency_data);
} flow_latency_stats SEC(".maps");

// Histogram for latency distribution
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 20);  // 20 buckets
    __type(key, __u32);
    __type(value, __u64);
} latency_histogram SEC(".maps");

static __always_inline int parse_packet(void *data, void *data_end,
                                       struct packet_info *pkt_info)
{
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return -1;
    
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return -1;
    
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return -1;
    
    pkt_info->saddr = ip->saddr;
    pkt_info->daddr = ip->daddr;
    pkt_info->protocol = ip->protocol;
    
    if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
        if ((void *)(tcp + 1) > data_end)
            return -1;
        
        pkt_info->sport = tcp->source;
        pkt_info->dport = tcp->dest;
    } else if (ip->protocol == IPPROTO_UDP) {
        struct udphdr *udp = (void *)ip + (ip->ihl * 4);
        if ((void *)(udp + 1) > data_end)
            return -1;
        
        pkt_info->sport = udp->source;
        pkt_info->dport = udp->dest;
    } else {
        pkt_info->sport = 0;
        pkt_info->dport = 0;
    }
    
    return 0;
}

SEC("xdp")
int xdp_latency_ingress(struct xdp_md *ctx)
{
    void *data = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;
    
    struct packet_info pkt_info = {};
    if (parse_packet(data, data_end, &pkt_info) < 0)
        return XDP_PASS;
    
    __u64 now = bpf_ktime_get_ns();
    
    // Store ingress timestamp
    bpf_map_update_elem(&packet_timestamps, &pkt_info, &now, BPF_ANY);
    
    return XDP_PASS;
}

SEC("tc")
int tc_latency_egress(struct __sk_buff *skb)
{
    void *data = (void *)(long)skb->data;
    void *data_end = (void *)(long)skb->data_end;
    
    struct packet_info pkt_info = {};
    if (parse_packet(data, data_end, &pkt_info) < 0)
        return TC_ACT_OK;
    
    // Reverse packet info for response matching
    __u32 tmp_addr = pkt_info.saddr;
    pkt_info.saddr = pkt_info.daddr;
    pkt_info.daddr = tmp_addr;
    
    __u16 tmp_port = pkt_info.sport;
    pkt_info.sport = pkt_info.dport;
    pkt_info.dport = tmp_port;
    
    // Look up ingress timestamp
    __u64 *ingress_time = bpf_map_lookup_elem(&packet_timestamps, &pkt_info);
    if (!ingress_time)
        return TC_ACT_OK;
    
    __u64 now = bpf_ktime_get_ns();
    __u64 latency = now - *ingress_time;
    
    // Update flow statistics
    struct latency_data *stats = bpf_map_lookup_elem(&flow_latency_stats, &pkt_info);
    if (stats) {
        stats->packets++;
        stats->total_latency_ns += latency;
        
        if (latency > stats->max_latency_ns)
            stats->max_latency_ns = latency;
        
        if (latency < stats->min_latency_ns || stats->min_latency_ns == 0)
            stats->min_latency_ns = latency;
    } else {
        struct latency_data new_stats = {
            .timestamp_ns = now,
            .packets = 1,
            .total_latency_ns = latency,
            .max_latency_ns = latency,
            .min_latency_ns = latency
        };
        bpf_map_update_elem(&flow_latency_stats, &pkt_info, &new_stats, BPF_ANY);
    }
    
    // Update histogram (microsecond buckets)
    __u32 bucket = latency / 1000;  // Convert to microseconds
    if (bucket >= 20)
        bucket = 19;  // Cap at last bucket
    
    __u64 *count = bpf_map_lookup_elem(&latency_histogram, &bucket);
    if (count)
        __sync_fetch_and_add(count, 1);
    
    // Clean up timestamp entry
    bpf_map_delete_elem(&packet_timestamps, &pkt_info);
    
    return TC_ACT_OK;
}

char LICENSE[] SEC("license") = "GPL";
```

### 2. TCP Connection Monitor

Monitor TCP connection lifecycle and performance:

```c
// tcp_monitor.bpf.c
#include <linux/bpf.h>
#include <linux/tcp.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

struct tcp_event {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
    __u32 state;
    __u32 rtt_us;
    __u32 cwnd;
    __u32 ssthresh;
    __u64 bytes_sent;
    __u64 bytes_received;
    __u64 retransmits;
    __u64 timestamp_ns;
};

// Ring buffer for events
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);  // 256KB buffer
} tcp_events SEC(".maps");

// Per-connection statistics
struct tcp_stats {
    __u64 bytes_sent;
    __u64 bytes_received;
    __u64 retransmits;
    __u32 max_rtt;
    __u32 min_rtt;
    __u64 total_rtt;
    __u64 rtt_samples;
};

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10000);
    __type(key, struct sock *);
    __type(value, struct tcp_stats);
} tcp_stats_map SEC(".maps");

SEC("kprobe/tcp_connect")
int trace_tcp_connect(struct pt_regs *ctx)
{
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    struct tcp_sock *tp = tcp_sk(sk);
    
    struct tcp_event *event;
    event = bpf_ringbuf_reserve(&tcp_events, sizeof(*event), 0);
    if (!event)
        return 0;
    
    event->saddr = sk->__sk_common.skc_rcv_saddr;
    event->daddr = sk->__sk_common.skc_daddr;
    event->sport = bpf_ntohs(sk->__sk_common.skc_num);
    event->dport = bpf_ntohs(sk->__sk_common.skc_dport);
    event->state = TCP_SYN_SENT;
    event->timestamp_ns = bpf_ktime_get_ns();
    
    bpf_ringbuf_submit(event, 0);
    
    // Initialize stats for new connection
    struct tcp_stats stats = {};
    bpf_map_update_elem(&tcp_stats_map, &sk, &stats, BPF_ANY);
    
    return 0;
}

SEC("kprobe/tcp_set_state")
int trace_tcp_set_state(struct pt_regs *ctx)
{
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    int state = (int)PT_REGS_PARM2(ctx);
    
    struct tcp_event *event;
    event = bpf_ringbuf_reserve(&tcp_events, sizeof(*event), 0);
    if (!event)
        return 0;
    
    event->saddr = sk->__sk_common.skc_rcv_saddr;
    event->daddr = sk->__sk_common.skc_daddr;
    event->sport = bpf_ntohs(sk->__sk_common.skc_num);
    event->dport = bpf_ntohs(sk->__sk_common.skc_dport);
    event->state = state;
    event->timestamp_ns = bpf_ktime_get_ns();
    
    struct tcp_sock *tp = tcp_sk(sk);
    event->rtt_us = tp->srtt_us >> 3;  // Smoothed RTT
    event->cwnd = tp->snd_cwnd;
    event->ssthresh = tp->snd_ssthresh;
    
    bpf_ringbuf_submit(event, 0);
    
    // Clean up stats on connection close
    if (state == TCP_CLOSE) {
        bpf_map_delete_elem(&tcp_stats_map, &sk);
    }
    
    return 0;
}

SEC("kprobe/tcp_sendmsg")
int trace_tcp_sendmsg(struct pt_regs *ctx)
{
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    size_t size = (size_t)PT_REGS_PARM3(ctx);
    
    struct tcp_stats *stats = bpf_map_lookup_elem(&tcp_stats_map, &sk);
    if (stats) {
        __sync_fetch_and_add(&stats->bytes_sent, size);
    }
    
    return 0;
}

SEC("kprobe/tcp_cleanup_rbuf")
int trace_tcp_cleanup_rbuf(struct pt_regs *ctx)
{
    struct sock *sk = (struct sock *)PT_REGS_PARM1(ctx);
    int copied = (int)PT_REGS_PARM2(ctx);
    
    if (copied <= 0)
        return 0;
    
    struct tcp_stats *stats = bpf_map_lookup_elem(&tcp_stats_map, &sk);
    if (stats) {
        __sync_fetch_and_add(&stats->bytes_received, copied);
    }
    
    return 0;
}

SEC("tracepoint/tcp/tcp_retransmit_skb")
int trace_tcp_retransmit(struct trace_event_raw_tcp_event_sk_skb *ctx)
{
    struct sock *sk = ctx->skaddr;
    
    struct tcp_stats *stats = bpf_map_lookup_elem(&tcp_stats_map, &sk);
    if (stats) {
        __sync_fetch_and_add(&stats->retransmits, 1);
    }
    
    // Log retransmit event
    struct tcp_event *event;
    event = bpf_ringbuf_reserve(&tcp_events, sizeof(*event), 0);
    if (!event)
        return 0;
    
    event->saddr = ctx->saddr;
    event->daddr = ctx->daddr;
    event->sport = ctx->sport;
    event->dport = ctx->dport;
    event->state = TCP_RETRANS;
    event->timestamp_ns = bpf_ktime_get_ns();
    
    bpf_ringbuf_submit(event, 0);
    
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

## XDP Programs for High-Performance Monitoring

### 1. DDoS Detection and Mitigation

```c
// ddos_detector.bpf.c
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

#define RATE_LIMIT_WINDOW_NS 1000000000  // 1 second
#define MAX_PACKETS_PER_SECOND 10000
#define SYN_FLOOD_THRESHOLD 1000

struct rate_limit_entry {
    __u64 packets;
    __u64 bytes;
    __u64 window_start;
    __u32 syn_count;
    __u32 flags;
};

// Per-IP rate limiting
struct {
    __uint(type, BPF_MAP_TYPE_LRU_PERCPU_HASH);
    __uint(max_entries, 100000);
    __type(key, __u32);  // IP address
    __type(value, struct rate_limit_entry);
} rate_limit_map SEC(".maps");

// Blacklist for blocking IPs
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10000);
    __type(key, __u32);  // IP address
    __type(value, __u64);  // Block expiry time
} blacklist SEC(".maps");

// Statistics
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 10);
    __type(key, __u32);
    __type(value, __u64);
} stats SEC(".maps");

enum stats_index {
    STATS_TOTAL_PACKETS = 0,
    STATS_DROPPED_PACKETS,
    STATS_RATE_LIMITED,
    STATS_BLACKLISTED,
    STATS_SYN_FLOODS_DETECTED,
};

static __always_inline int check_blacklist(__u32 addr)
{
    __u64 *expiry = bpf_map_lookup_elem(&blacklist, &addr);
    if (expiry) {
        __u64 now = bpf_ktime_get_ns();
        if (now < *expiry) {
            return 1;  // Still blacklisted
        }
        // Expired, remove from blacklist
        bpf_map_delete_elem(&blacklist, &addr);
    }
    return 0;
}

static __always_inline void update_stats(__u32 index)
{
    __u32 key = index;
    __u64 *value = bpf_map_lookup_elem(&stats, &key);
    if (value)
        __sync_fetch_and_add(value, 1);
}

SEC("xdp")
int xdp_ddos_detector(struct xdp_md *ctx)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    update_stats(STATS_TOTAL_PACKETS);
    
    // Parse Ethernet header
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_DROP;
    
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return XDP_PASS;
    
    // Parse IP header
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_DROP;
    
    __u32 src_ip = ip->saddr;
    
    // Check blacklist
    if (check_blacklist(src_ip)) {
        update_stats(STATS_BLACKLISTED);
        return XDP_DROP;
    }
    
    __u64 now = bpf_ktime_get_ns();
    
    // Rate limiting logic
    struct rate_limit_entry *entry = bpf_map_lookup_elem(&rate_limit_map, &src_ip);
    if (!entry) {
        struct rate_limit_entry new_entry = {
            .packets = 1,
            .bytes = ctx->data_end - ctx->data,
            .window_start = now,
            .syn_count = 0,
            .flags = 0
        };
        
        // Check for SYN packet
        if (ip->protocol == IPPROTO_TCP) {
            struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
            if ((void *)(tcp + 1) <= data_end && tcp->syn && !tcp->ack) {
                new_entry.syn_count = 1;
            }
        }
        
        bpf_map_update_elem(&rate_limit_map, &src_ip, &new_entry, BPF_ANY);
        return XDP_PASS;
    }
    
    // Check if we need to reset the window
    if (now - entry->window_start > RATE_LIMIT_WINDOW_NS) {
        entry->packets = 1;
        entry->bytes = ctx->data_end - ctx->data;
        entry->window_start = now;
        entry->syn_count = 0;
    } else {
        entry->packets++;
        entry->bytes += ctx->data_end - ctx->data;
        
        // Check for SYN flood
        if (ip->protocol == IPPROTO_TCP) {
            struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
            if ((void *)(tcp + 1) <= data_end && tcp->syn && !tcp->ack) {
                entry->syn_count++;
                
                if (entry->syn_count > SYN_FLOOD_THRESHOLD) {
                    // Detected SYN flood, blacklist the IP
                    __u64 block_until = now + 60 * 1000000000ULL;  // Block for 60 seconds
                    bpf_map_update_elem(&blacklist, &src_ip, &block_until, BPF_ANY);
                    
                    update_stats(STATS_SYN_FLOODS_DETECTED);
                    return XDP_DROP;
                }
            }
        }
        
        // Rate limit check
        if (entry->packets > MAX_PACKETS_PER_SECOND) {
            update_stats(STATS_RATE_LIMITED);
            update_stats(STATS_DROPPED_PACKETS);
            return XDP_DROP;
        }
    }
    
    return XDP_PASS;
}

char LICENSE[] SEC("license") = "GPL";
```

### 2. Load Balancer with Health Checking

```c
// xdp_load_balancer.bpf.c
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

#define MAX_BACKENDS 10

struct backend {
    __u32 ip;
    __u8  mac[ETH_ALEN];
    __u16 weight;
    __u16 current_connections;
    __u32 health_score;  // 0-100, 100 being healthy
    __u64 last_health_check;
};

// Backend servers configuration
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, MAX_BACKENDS);
    __type(key, __u32);
    __type(value, struct backend);
} backends SEC(".maps");

// Connection tracking
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 100000);
    __type(key, __u32);  // Client IP
    __type(value, __u32);  // Backend index
} connection_map SEC(".maps");

// Load balancing statistics
struct lb_stats {
    __u64 total_requests;
    __u64 backend_selections[MAX_BACKENDS];
    __u64 health_check_failures;
};

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct lb_stats);
} lb_statistics SEC(".maps");

static __always_inline __u32 jhash(const void *key, __u32 length, __u32 initval)
{
    __u32 a, b, c;
    const __u8 *k = key;
    
    a = b = c = 0xdeadbeef + length + initval;
    
    while (length > 12) {
        a += *(__u32 *)k;
        b += *(__u32 *)(k + 4);
        c += *(__u32 *)(k + 8);
        
        // Mix
        a -= c; a ^= (c << 4) | (c >> 28); c += b;
        b -= a; b ^= (a << 6) | (a >> 26); a += c;
        c -= b; c ^= (b << 8) | (b >> 24); b += a;
        a -= c; a ^= (c << 16) | (c >> 16); c += b;
        b -= a; b ^= (a << 19) | (a >> 13); a += c;
        c -= b; c ^= (b << 4) | (b >> 28); b += a;
        
        length -= 12;
        k += 12;
    }
    
    return c;
}

static __always_inline __u32 select_backend_weighted(__u32 hash)
{
    __u32 total_weight = 0;
    __u32 healthy_backends = 0;
    
    // Calculate total weight of healthy backends
    for (__u32 i = 0; i < MAX_BACKENDS; i++) {
        struct backend *b = bpf_map_lookup_elem(&backends, &i);
        if (!b || b->ip == 0)
            break;
        
        if (b->health_score > 50) {  // Consider backend healthy if score > 50
            total_weight += b->weight * (b->health_score / 10);
            healthy_backends++;
        }
    }
    
    if (healthy_backends == 0)
        return 0;  // No healthy backends
    
    // Select backend based on weighted distribution
    __u32 selection = hash % total_weight;
    __u32 accumulated = 0;
    
    for (__u32 i = 0; i < MAX_BACKENDS; i++) {
        struct backend *b = bpf_map_lookup_elem(&backends, &i);
        if (!b || b->ip == 0)
            break;
        
        if (b->health_score > 50) {
            accumulated += b->weight * (b->health_score / 10);
            if (selection < accumulated)
                return i;
        }
    }
    
    return 0;
}

static __always_inline int rewrite_packet(struct xdp_md *ctx, 
                                         struct backend *backend,
                                         __u32 client_ip)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_DROP;
    
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_DROP;
    
    // Update destination MAC
    __builtin_memcpy(eth->h_dest, backend->mac, ETH_ALEN);
    
    // Update destination IP
    __u32 old_daddr = ip->daddr;
    ip->daddr = backend->ip;
    
    // Update IP checksum
    __u32 csum = ~ip->check & 0xFFFF;
    csum += (~old_daddr & 0xFFFF) + (~old_daddr >> 16);
    csum += (backend->ip & 0xFFFF) + (backend->ip >> 16);
    csum = (csum & 0xFFFF) + (csum >> 16);
    csum = (csum & 0xFFFF) + (csum >> 16);
    ip->check = ~csum;
    
    // Update TCP/UDP checksum if needed
    if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
        if ((void *)(tcp + 1) > data_end)
            return XDP_DROP;
        
        // Simplified: recalculate would be needed in production
        tcp->check = 0;
    }
    
    return XDP_TX;  // Transmit modified packet
}

SEC("xdp")
int xdp_load_balancer(struct xdp_md *ctx)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_DROP;
    
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return XDP_PASS;
    
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_DROP;
    
    // Only handle TCP traffic for load balancing
    if (ip->protocol != IPPROTO_TCP)
        return XDP_PASS;
    
    struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
    if ((void *)(tcp + 1) > data_end)
        return XDP_DROP;
    
    __u32 client_ip = ip->saddr;
    
    // Check for existing connection (session persistence)
    __u32 *backend_idx = bpf_map_lookup_elem(&connection_map, &client_ip);
    
    if (!backend_idx || tcp->syn) {
        // New connection or SYN packet, select backend
        __u32 hash = jhash(&client_ip, sizeof(client_ip), tcp->dest);
        __u32 selected = select_backend_weighted(hash);
        
        // Store connection mapping
        bpf_map_update_elem(&connection_map, &client_ip, &selected, BPF_ANY);
        backend_idx = &selected;
    }
    
    // Get selected backend
    struct backend *backend = bpf_map_lookup_elem(&backends, backend_idx);
    if (!backend || backend->ip == 0)
        return XDP_DROP;
    
    // Update statistics
    __u32 key = 0;
    struct lb_stats *stats = bpf_map_lookup_elem(&lb_statistics, &key);
    if (stats) {
        __sync_fetch_and_add(&stats->total_requests, 1);
        if (*backend_idx < MAX_BACKENDS)
            __sync_fetch_and_add(&stats->backend_selections[*backend_idx], 1);
    }
    
    // Rewrite packet and forward to backend
    return rewrite_packet(ctx, backend, client_ip);
}

// Health checking program (runs periodically from userspace)
SEC("xdp")
int xdp_health_check(struct xdp_md *ctx)
{
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_PASS;
    
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return XDP_PASS;
    
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return XDP_PASS;
    
    // Check if this is a health check response
    if (ip->protocol != IPPROTO_ICMP)
        return XDP_PASS;
    
    // Find backend by IP
    for (__u32 i = 0; i < MAX_BACKENDS; i++) {
        struct backend *b = bpf_map_lookup_elem(&backends, &i);
        if (!b || b->ip == 0)
            break;
        
        if (b->ip == ip->saddr) {
            // Update health score (simplified)
            b->health_score = 100;
            b->last_health_check = bpf_ktime_get_ns();
            break;
        }
    }
    
    return XDP_PASS;
}

char LICENSE[] SEC("license") = "GPL";
```

## DNS Monitoring with eBPF

### Advanced DNS Performance Tracker

```python
#!/usr/bin/env python3
# dns_monitor.py - DNS Performance Monitoring with eBPF

from bcc import BPF
import socket
import struct
import time
from collections import defaultdict
import json

# eBPF program for DNS monitoring
bpf_program = """
#include <uapi/linux/ptrace.h>
#include <linux/sched.h>
#include <linux/ip.h>
#include <linux/udp.h>

#define DNS_PORT 53
#define MAX_DNS_NAME 256

struct dns_event {
    u32 pid;
    u32 tid;
    char comm[16];
    u32 saddr;
    u32 daddr;
    u16 sport;
    u16 dport;
    u16 qtype;
    u16 qclass;
    char qname[MAX_DNS_NAME];
    u64 timestamp_ns;
    u64 latency_ns;
    u8 is_response;
};

BPF_HASH(dns_requests, u64, struct dns_event);
BPF_PERF_OUTPUT(dns_events);
BPF_HISTOGRAM(dns_latency_hist, u64);

// Parse DNS query name from packet
static inline int parse_dns_name(char *dst, void *src, void *data_end)
{
    u8 *p = (u8 *)src;
    u8 *end = (u8 *)data_end;
    int i = 0;
    
    while (i < MAX_DNS_NAME - 1 && p < end) {
        u8 len = *p;
        if (len == 0)
            break;
        
        if (len > 63)  // Compression, skip
            break;
        
        p++;
        if (p + len > end)
            break;
        
        if (i > 0)
            dst[i++] = '.';
        
        for (int j = 0; j < len && i < MAX_DNS_NAME - 1; j++)
            dst[i++] = p[j];
        
        p += len;
    }
    
    dst[i] = 0;
    return i;
}

int trace_udp_sendmsg(struct pt_regs *ctx, struct sock *sk,
                      struct msghdr *msg, size_t len)
{
    u16 dport = sk->__sk_common.skc_dport;
    
    // Only track DNS traffic
    if (dport != htons(DNS_PORT))
        return 0;
    
    struct dns_event event = {};
    event.pid = bpf_get_current_pid_tgid() >> 32;
    event.tid = bpf_get_current_pid_tgid();
    bpf_get_current_comm(&event.comm, sizeof(event.comm));
    
    event.saddr = sk->__sk_common.skc_rcv_saddr;
    event.daddr = sk->__sk_common.skc_daddr;
    event.sport = sk->__sk_common.skc_num;
    event.dport = ntohs(dport);
    event.timestamp_ns = bpf_ktime_get_ns();
    event.is_response = 0;
    
    // Store request for latency calculation
    u64 key = (u64)event.sport << 16 | (u64)event.tid;
    dns_requests.update(&key, &event);
    
    return 0;
}

int trace_udp_recvmsg(struct pt_regs *ctx, struct sock *sk,
                      struct msghdr *msg, size_t len)
{
    u16 sport = sk->__sk_common.skc_num;
    
    // Only track DNS traffic
    if (sport == 0 || sk->__sk_common.skc_dport != htons(DNS_PORT))
        return 0;
    
    u64 now = bpf_ktime_get_ns();
    u64 key = (u64)sport << 16 | (u64)bpf_get_current_pid_tgid();
    
    struct dns_event *request = dns_requests.lookup(&key);
    if (!request)
        return 0;
    
    // Calculate latency
    u64 latency = now - request->timestamp_ns;
    
    // Update histogram
    dns_latency_hist.increment(bpf_log2l(latency / 1000));  // microseconds
    
    // Send event
    struct dns_event response = *request;
    response.latency_ns = latency;
    response.is_response = 1;
    response.timestamp_ns = now;
    
    dns_events.perf_submit(ctx, &response, sizeof(response));
    
    // Cleanup
    dns_requests.delete(&key);
    
    return 0;
}
"""

class DNSMonitor:
    def __init__(self):
        self.bpf = BPF(text=bpf_program)
        self.bpf.attach_kprobe(event="udp_sendmsg", 
                              fn_name="trace_udp_sendmsg")
        self.bpf.attach_kprobe(event="udp_recvmsg", 
                              fn_name="trace_udp_recvmsg")
        
        self.dns_stats = defaultdict(lambda: {
            'queries': 0,
            'total_latency': 0,
            'max_latency': 0,
            'min_latency': float('inf')
        })
        
    def process_event(self, cpu, data, size):
        event = self.bpf["dns_events"].event(data)
        
        if event.is_response:
            latency_ms = event.latency_ns / 1000000.0
            
            # Update statistics
            domain = event.qname.decode('utf-8', 'ignore')
            stats = self.dns_stats[domain]
            stats['queries'] += 1
            stats['total_latency'] += latency_ms
            stats['max_latency'] = max(stats['max_latency'], latency_ms)
            stats['min_latency'] = min(stats['min_latency'], latency_ms)
            
            # Print real-time event
            src_ip = socket.inet_ntoa(struct.pack('I', event.saddr))
            dst_ip = socket.inet_ntoa(struct.pack('I', event.daddr))
            
            print(f"[{time.strftime('%H:%M:%S')}] "
                  f"PID:{event.pid} ({event.comm.decode('utf-8', 'ignore')}) "
                  f"Query: {domain} "
                  f"Server: {dst_ip} "
                  f"Latency: {latency_ms:.2f}ms")
    
    def print_histogram(self):
        print("\n=== DNS Latency Distribution (microseconds) ===")
        self.bpf["dns_latency_hist"].print_log2_hist("latency (us)")
    
    def print_statistics(self):
        print("\n=== DNS Query Statistics ===")
        print(f"{'Domain':<40} {'Queries':<10} {'Avg(ms)':<10} "
              f"{'Min(ms)':<10} {'Max(ms)':<10}")
        print("-" * 90)
        
        for domain, stats in sorted(self.dns_stats.items(), 
                                   key=lambda x: x[1]['queries'], 
                                   reverse=True)[:20]:
            if stats['queries'] > 0:
                avg_latency = stats['total_latency'] / stats['queries']
                print(f"{domain:<40} {stats['queries']:<10} "
                      f"{avg_latency:<10.2f} {stats['min_latency']:<10.2f} "
                      f"{stats['max_latency']:<10.2f}")
    
    def run(self):
        print("Starting DNS monitoring... Press Ctrl+C to stop")
        self.bpf["dns_events"].open_perf_buffer(self.process_event)
        
        try:
            while True:
                self.bpf.perf_buffer_poll()
                time.sleep(1)
        except KeyboardInterrupt:
            self.print_histogram()
            self.print_statistics()

if __name__ == "__main__":
    monitor = DNSMonitor()
    monitor.run()
```

## Traffic Shaping and QoS with eBPF

### Bandwidth Limiter and Traffic Classifier

```c
// traffic_shaper.bpf.c
#include <linux/bpf.h>
#include <linux/pkt_cls.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <bpf/bpf_helpers.h>

#define NS_PER_SECOND 1000000000ULL
#define MAX_BANDWIDTH_MBPS 100  // 100 Mbps per flow

struct flow_key {
    __u32 src_ip;
    __u32 dst_ip;
    __u16 src_port;
    __u16 dst_port;
    __u8  protocol;
};

struct flow_state {
    __u64 last_packet_time;
    __u64 tokens;  // Token bucket for rate limiting
    __u64 total_bytes;
    __u64 total_packets;
    __u32 priority;  // 0-7, higher is better
};

// Flow state tracking
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 10000);
    __type(key, struct flow_key);
    __type(value, struct flow_state);
} flow_map SEC(".maps");

// QoS class definitions
struct qos_class {
    __u32 min_rate_mbps;
    __u32 max_rate_mbps;
    __u32 burst_size;
    __u32 priority;
};

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 8);  // 8 QoS classes
    __type(key, __u32);
    __type(value, struct qos_class);
} qos_classes SEC(".maps");

static __always_inline __u32 classify_traffic(struct flow_key *key)
{
    // Classify based on port and protocol
    if (key->protocol == IPPROTO_TCP) {
        if (key->dst_port == 80 || key->dst_port == 443)
            return 5;  // Web traffic - medium priority
        if (key->dst_port == 22)
            return 7;  // SSH - high priority
        if (key->dst_port == 3306 || key->dst_port == 5432)
            return 6;  // Database - high priority
    } else if (key->protocol == IPPROTO_UDP) {
        if (key->dst_port == 53)
            return 7;  // DNS - highest priority
        if (key->dst_port >= 5000 && key->dst_port <= 6000)
            return 4;  // VoIP range - medium-high priority
    }
    
    return 3;  // Default priority
}

static __always_inline int apply_token_bucket(struct flow_state *state, 
                                             __u32 packet_len,
                                             __u64 now)
{
    // Token bucket algorithm
    __u64 time_elapsed = now - state->last_packet_time;
    
    // Calculate tokens to add (rate in bytes per nanosecond)
    __u64 tokens_to_add = (MAX_BANDWIDTH_MBPS * 125000 * time_elapsed) / NS_PER_SECOND;
    
    // Maximum bucket size (1 second worth of tokens)
    __u64 max_tokens = MAX_BANDWIDTH_MBPS * 125000;
    
    state->tokens = state->tokens + tokens_to_add;
    if (state->tokens > max_tokens)
        state->tokens = max_tokens;
    
    // Check if we have enough tokens
    if (state->tokens >= packet_len) {
        state->tokens -= packet_len;
        state->last_packet_time = now;
        return TC_ACT_OK;  // Allow packet
    }
    
    // Not enough tokens, drop or queue
    return TC_ACT_SHOT;  // Drop packet
}

SEC("tc")
int tc_traffic_shaper(struct __sk_buff *skb)
{
    void *data = (void *)(long)skb->data;
    void *data_end = (void *)(long)skb->data_end;
    
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return TC_ACT_OK;
    
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return TC_ACT_OK;
    
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > data_end)
        return TC_ACT_OK;
    
    struct flow_key key = {
        .src_ip = ip->saddr,
        .dst_ip = ip->daddr,
        .protocol = ip->protocol
    };
    
    // Extract port information
    if (ip->protocol == IPPROTO_TCP) {
        struct tcphdr *tcp = (void *)ip + (ip->ihl * 4);
        if ((void *)(tcp + 1) > data_end)
            return TC_ACT_OK;
        
        key.src_port = tcp->source;
        key.dst_port = tcp->dest;
    } else if (ip->protocol == IPPROTO_UDP) {
        struct udphdr *udp = (void *)ip + (ip->ihl * 4);
        if ((void *)(udp + 1) > data_end)
            return TC_ACT_OK;
        
        key.src_port = udp->source;
        key.dst_port = udp->dest;
    }
    
    __u64 now = bpf_ktime_get_ns();
    __u32 packet_len = skb->len;
    
    // Look up or create flow state
    struct flow_state *state = bpf_map_lookup_elem(&flow_map, &key);
    if (!state) {
        struct flow_state new_state = {
            .last_packet_time = now,
            .tokens = MAX_BANDWIDTH_MBPS * 125000,  // Start with full bucket
            .total_bytes = packet_len,
            .total_packets = 1,
            .priority = classify_traffic(&key)
        };
        
        bpf_map_update_elem(&flow_map, &key, &new_state, BPF_ANY);
        
        // Set priority in packet metadata
        skb->priority = new_state.priority;
        
        return TC_ACT_OK;
    }
    
    // Update statistics
    state->total_bytes += packet_len;
    state->total_packets++;
    
    // Apply rate limiting
    int action = apply_token_bucket(state, packet_len, now);
    
    if (action == TC_ACT_OK) {
        // Set priority for QoS
        skb->priority = state->priority;
        
        // Apply DSCP marking for priority
        if (state->priority >= 6) {
            // High priority - set DSCP EF (46)
            ip->tos = 184;  // DSCP 46 << 2
        } else if (state->priority >= 4) {
            // Medium priority - set DSCP AF31 (26)
            ip->tos = 104;  // DSCP 26 << 2
        }
        
        // Recalculate IP checksum
        ip->check = 0;
        __u32 csum = 0;
        __u16 *p = (__u16 *)ip;
        for (int i = 0; i < sizeof(*ip) / 2; i++)
            csum += *p++;
        
        while (csum >> 16)
            csum = (csum & 0xffff) + (csum >> 16);
        
        ip->check = ~csum;
    }
    
    return action;
}

char LICENSE[] SEC("license") = "GPL";
```

## User-Space Control Plane

### Python Control Plane for eBPF Programs

```python
#!/usr/bin/env python3
# ebpf_network_controller.py

import sys
import time
import json
import signal
import argparse
import ipaddress
from dataclasses import dataclass
from typing import Dict, List
import pyroute2
from bcc import BPF, lib
import ctypes as ct

@dataclass
class NetworkMetrics:
    packets_total: int
    bytes_total: int
    drops: int
    errors: int
    latency_avg_us: float
    latency_p99_us: float
    connections_active: int
    bandwidth_mbps: float

class eBPFNetworkController:
    def __init__(self, interface: str):
        self.interface = interface
        self.bpf = None
        self.running = True
        
        # Load eBPF programs
        self.load_programs()
        
        # Attach programs
        self.attach_programs()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def load_programs(self):
        """Load all eBPF programs"""
        with open('network_monitor.bpf.c', 'r') as f:
            program_text = f.read()
        
        self.bpf = BPF(text=program_text, cflags=["-w"])
    
    def attach_programs(self):
        """Attach eBPF programs to network interface"""
        # Get interface index
        ip = pyroute2.IPRoute()
        idx = ip.link_lookup(ifname=self.interface)[0]
        
        # Attach XDP program
        fn = self.bpf.load_func("xdp_monitor", BPF.XDP)
        self.bpf.attach_xdp(self.interface, fn, 0)
        
        # Attach TC programs
        ip.tc("add", "clsact", idx)
        
        # Ingress
        fn = self.bpf.load_func("tc_ingress", BPF.SCHED_CLS)
        ip.tc("add-filter", "bpf", idx, ":1", fd=fn.fd,
              name=fn.name, parent="ffff:fff2", direct_action=True)
        
        # Egress
        fn = self.bpf.load_func("tc_egress", BPF.SCHED_CLS)
        ip.tc("add-filter", "bpf", idx, ":1", fd=fn.fd,
              name=fn.name, parent="ffff:fff3", direct_action=True)
        
        print(f"eBPF programs attached to {self.interface}")
    
    def get_metrics(self) -> NetworkMetrics:
        """Collect metrics from eBPF maps"""
        metrics = NetworkMetrics(
            packets_total=0,
            bytes_total=0,
            drops=0,
            errors=0,
            latency_avg_us=0,
            latency_p99_us=0,
            connections_active=0,
            bandwidth_mbps=0
        )
        
        # Read from stats map
        stats_map = self.bpf.get_table("stats")
        for k, v in stats_map.items():
            metrics.packets_total += v.packets
            metrics.bytes_total += v.bytes
            metrics.drops += v.drops
        
        # Calculate latency from histogram
        hist = self.bpf.get_table("latency_histogram")
        total_samples = 0
        total_latency = 0
        samples = []
        
        for k, v in hist.items():
            if v.value > 0:
                latency_us = 2 ** k.value
                total_samples += v.value
                total_latency += latency_us * v.value
                samples.extend([latency_us] * v.value)
        
        if total_samples > 0:
            metrics.latency_avg_us = total_latency / total_samples
            samples.sort()
            p99_idx = int(len(samples) * 0.99)
            metrics.latency_p99_us = samples[p99_idx] if p99_idx < len(samples) else 0
        
        # Count active connections
        conn_map = self.bpf.get_table("connection_map")
        metrics.connections_active = len(conn_map)
        
        # Calculate bandwidth
        if hasattr(self, 'last_bytes') and hasattr(self, 'last_time'):
            time_diff = time.time() - self.last_time
            bytes_diff = metrics.bytes_total - self.last_bytes
            metrics.bandwidth_mbps = (bytes_diff * 8) / (time_diff * 1000000)
        
        self.last_bytes = metrics.bytes_total
        self.last_time = time.time()
        
        return metrics
    
    def apply_rate_limit(self, ip_addr: str, limit_mbps: int):
        """Apply rate limit to specific IP"""
        rate_limits = self.bpf.get_table("rate_limits")
        ip_int = int(ipaddress.ip_address(ip_addr))
        
        limit_bytes_per_sec = limit_mbps * 125000
        rate_limits[ct.c_uint32(ip_int)] = ct.c_uint64(limit_bytes_per_sec)
        
        print(f"Applied rate limit of {limit_mbps} Mbps to {ip_addr}")
    
    def add_to_blacklist(self, ip_addr: str, duration_sec: int):
        """Add IP to blacklist"""
        blacklist = self.bpf.get_table("blacklist")
        ip_int = int(ipaddress.ip_address(ip_addr))
        
        expiry = time.time_ns() + (duration_sec * 1000000000)
        blacklist[ct.c_uint32(ip_int)] = ct.c_uint64(expiry)
        
        print(f"Added {ip_addr} to blacklist for {duration_sec} seconds")
    
    def print_top_talkers(self, n: int = 10):
        """Print top N traffic sources"""
        flow_stats = self.bpf.get_table("flow_stats")
        
        flows = []
        for k, v in flow_stats.items():
            src_ip = ipaddress.ip_address(k.src_ip)
            dst_ip = ipaddress.ip_address(k.dst_ip)
            flows.append({
                'src': str(src_ip),
                'dst': str(dst_ip),
                'bytes': v.bytes,
                'packets': v.packets
            })
        
        # Sort by bytes
        flows.sort(key=lambda x: x['bytes'], reverse=True)
        
        print(f"\n=== Top {n} Traffic Flows ===")
        print(f"{'Source':<20} {'Destination':<20} {'Bytes':<15} {'Packets':<10}")
        print("-" * 75)
        
        for flow in flows[:n]:
            print(f"{flow['src']:<20} {flow['dst']:<20} "
                  f"{flow['bytes']:<15,} {flow['packets']:<10,}")
    
    def monitor_loop(self):
        """Main monitoring loop"""
        print("Starting network monitoring...")
        
        while self.running:
            try:
                # Collect and display metrics
                metrics = self.get_metrics()
                
                # Clear screen
                print("\033[2J\033[H")
                
                # Display dashboard
                print("=" * 80)
                print(f"eBPF Network Monitor - Interface: {self.interface}")
                print("=" * 80)
                
                print(f"\n📊 Network Metrics:")
                print(f"  Packets: {metrics.packets_total:,}")
                print(f"  Bytes: {metrics.bytes_total:,}")
                print(f"  Drops: {metrics.drops:,}")
                print(f"  Active Connections: {metrics.connections_active}")
                print(f"  Bandwidth: {metrics.bandwidth_mbps:.2f} Mbps")
                
                print(f"\n⏱️  Latency:")
                print(f"  Average: {metrics.latency_avg_us:.2f} μs")
                print(f"  P99: {metrics.latency_p99_us:.2f} μs")
                
                # Show top talkers
                self.print_top_talkers(5)
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                break
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signals"""
        print("\nShutting down...")
        self.running = False
        self.cleanup()
        sys.exit(0)
    
    def cleanup(self):
        """Clean up eBPF programs"""
        if self.bpf:
            # Detach XDP
            self.bpf.remove_xdp(self.interface, 0)
            
            # Remove TC filters
            ip = pyroute2.IPRoute()
            idx = ip.link_lookup(ifname=self.interface)[0]
            ip.tc("del", "clsact", idx)
            
            print("eBPF programs detached")

def main():
    parser = argparse.ArgumentParser(description='eBPF Network Controller')
    parser.add_argument('interface', help='Network interface to monitor')
    parser.add_argument('--rate-limit', nargs=2, metavar=('IP', 'MBPS'),
                       help='Apply rate limit to IP')
    parser.add_argument('--blacklist', nargs=2, metavar=('IP', 'SECONDS'),
                       help='Add IP to blacklist')
    
    args = parser.parse_args()
    
    # Check for root privileges
    if os.geteuid() != 0:
        print("This program requires root privileges")
        sys.exit(1)
    
    controller = eBPFNetworkController(args.interface)
    
    # Apply configurations
    if args.rate_limit:
        controller.apply_rate_limit(args.rate_limit[0], 
                                   int(args.rate_limit[1]))
    
    if args.blacklist:
        controller.add_to_blacklist(args.blacklist[0], 
                                   int(args.blacklist[1]))
    
    # Start monitoring
    controller.monitor_loop()

if __name__ == "__main__":
    import os
    main()
```

## Production Deployment Guide

### 1. System Requirements

```bash
#!/bin/bash
# check_ebpf_support.sh

echo "Checking eBPF support..."

# Check kernel version
KERNEL_VERSION=$(uname -r | cut -d. -f1,2)
MIN_VERSION="4.14"

if [ "$(printf '%s\n' "$MIN_VERSION" "$KERNEL_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo "❌ Kernel version $KERNEL_VERSION is too old. Minimum required: $MIN_VERSION"
    exit 1
fi

echo "✅ Kernel version: $(uname -r)"

# Check for BPF syscall support
if ! grep -q "bpf" /proc/kallsyms; then
    echo "❌ BPF syscall not found"
    exit 1
fi

echo "✅ BPF syscall supported"

# Check for required kernel configs
configs=(
    "CONFIG_BPF=y"
    "CONFIG_BPF_SYSCALL=y"
    "CONFIG_BPF_JIT=y"
    "CONFIG_HAVE_EBPF_JIT=y"
    "CONFIG_XDP_SOCKETS=y"
    "CONFIG_BPF_STREAM_PARSER=y"
    "CONFIG_NET_CLS_BPF=y"
    "CONFIG_NET_ACT_BPF=y"
)

for config in "${configs[@]}"; do
    if zgrep -q "$config" /proc/config.gz 2>/dev/null || \
       grep -q "$config" /boot/config-$(uname -r) 2>/dev/null; then
        echo "✅ $config"
    else
        echo "⚠️  $config might not be enabled"
    fi
done

# Check for required tools
tools=("bpftool" "tc" "ip")

for tool in "${tools[@]}"; do
    if command -v $tool &> /dev/null; then
        echo "✅ $tool installed"
    else
        echo "❌ $tool not found. Install with: apt install iproute2 linux-tools-common"
    fi
done

echo -e "\n✅ System is ready for eBPF network monitoring!"
```

### 2. Performance Tuning

```bash
# /etc/sysctl.d/99-ebpf-networking.conf

# Increase BPF memory limits
net.core.bpf_jit_enable = 1
net.core.bpf_jit_harden = 0
net.core.bpf_jit_kallsyms = 1

# Increase network buffers
net.core.rmem_default = 134217728
net.core.rmem_max = 134217728
net.core.wmem_default = 134217728
net.core.wmem_max = 134217728
net.core.netdev_max_backlog = 10000
net.core.netdev_budget = 600
net.core.netdev_budget_usecs = 8000

# XDP optimization
net.core.xdp_unload_timeout = 10

# Enable RPS/RFS
net.core.rps_sock_flow_entries = 32768

# TCP optimizations
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_notsent_lowat = 16384

# Apply with: sysctl -p /etc/sysctl.d/99-ebpf-networking.conf
```

## Conclusion

eBPF has revolutionized network performance monitoring by providing:

1. **Kernel-level observability** without kernel modules
2. **Line-rate packet processing** with XDP
3. **Programmable network stack** at multiple layers
4. **Production-safe deployment** with verification
5. **Minimal performance overhead** compared to traditional tools

This guide covered practical implementations from basic packet monitoring to advanced load balancing and DDoS protection. The combination of eBPF's performance and flexibility makes it the ideal choice for modern network monitoring infrastructure.

### Key Takeaways

- Start with basic monitoring and gradually add complexity
- Use XDP for highest performance packet processing
- Implement proper error handling and bounds checking
- Monitor eBPF program performance and memory usage
- Combine multiple hook points for comprehensive visibility

### Next Steps

1. Deploy basic monitoring in test environment
2. Benchmark performance impact
3. Gradually roll out to production
4. Integrate with existing monitoring systems
5. Customize for specific use cases

Remember: eBPF is not just a tool but a platform for building custom network solutions tailored to your specific requirements.

---

*Revolutionizing network monitoring - one packet at a time.*