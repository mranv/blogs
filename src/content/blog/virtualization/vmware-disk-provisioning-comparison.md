---
author: Anubhav Gain
pubDatetime: 2024-04-24T16:00:00Z
modDatetime: 2024-04-24T16:00:00Z
title: Comparing VMware Disk Provisioning Types - Which One Should You Choose?
slug: vmware-disk-provisioning-comparison
featured: true
draft: false
tags:
  - virtualization
  - vmware
  - storage
  - performance
  - infrastructure
  - best-practices
description: A detailed comparison of VMware's disk provisioning options - Thin Provisioned, Thick Provisioned Lazily Zeroed, and Thick Provisioned Eagerly Zeroed - to help you choose the right option for your workloads.
---

# Comparing VMware Disk Provisioning Types - Which One Should You Choose?

When setting up virtual machines in VMware environments, one of the critical decisions is selecting the right disk provisioning type. The best choice among **Thin Provisioned, Thick Provisioned (Lazily Zeroed), and Thick Provisioned (Eagerly Zeroed)** depends on your **use case** and **performance requirements**.

## Comparison Table

| Feature                       | Thin Provisioned                                      | Thick Provisioned, Lazily Zeroed                    | Thick Provisioned, Eagerly Zeroed                     |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| **Storage Efficiency**        | Best (allocates space as needed)                      | Moderate (pre-allocates space but doesn't zero out) | Worst (pre-allocates and zeroes out space)            |
| **Performance**               | Can slow down over time due to on-demand allocation   | Better than thin, but slower on first write         | Best, since all space is allocated and zeroed upfront |
| **Security (Data Wiping)**    | No guarantee of old data being wiped                  | Old data remains until overwritten                  | Fully zeroed, ensuring no residual data               |
| **VM Creation Time**          | Fastest                                               | Moderate                                            | Slowest (due to zeroing)                              |
| **Snapshot & Cloning Impact** | Snapshots grow dynamically, consuming space over time | More predictable than thin                          | More predictable than thin                            |

## Which One to Choose?

### Choose Thin Provisioning if:

- You want to maximize storage efficiency.
- You have limited disk space and don't need the best performance.
- You're okay with potential performance degradation due to dynamic allocation.

### Choose Thick Provisioned (Lazily Zeroed) if:

- You want a balance between performance and storage efficiency.
- You don't need instant security (data zeroing).
- Your workload doesn't require high-performance storage.

### Choose Thick Provisioned (Eagerly Zeroed) if:

- You need the best **performance** and have **plenty of storage**.
- You are working with databases, high IOPS applications, or security-sensitive workloads.
- You want to avoid performance hits from zeroing blocks on first write.

## Best Overall Recommendation:

- If you **need maximum performance and security** → **Thick Provisioned (Eagerly Zeroed)**
- If you **want a balance of performance and space** → **Thick Provisioned (Lazily Zeroed)**
- If you **prioritize storage space over performance** → **Thin Provisioned**

## Technical Details

### Thin Provisioning

Thin provisioning creates a disk that uses only as much storage space as it needs for its initial operations. For example, if you create a 100GB thin-provisioned disk, it might initially use only 20GB of physical storage. As you add more data to the VM, the disk expands to accommodate it, up to the maximum size you've allocated.

**Key considerations:**

- Space is allocated on demand, which conserves storage
- Performance can degrade as the disk grows and becomes fragmented
- Monitoring is essential to prevent storage overcommitment

### Thick Provisioned, Lazily Zeroed

This option pre-allocates all the space required for your virtual disk at creation time. However, any data that may be present on the physical device is not erased or written over. Instead, this old data is zeroed out on first write, which can cause a small performance hit when writing to a new block for the first time.

**Key considerations:**

- All space is allocated upfront, providing more consistent performance
- First-write operations are slower due to on-demand zeroing
- Better for general-purpose VMs that don't require maximum security

### Thick Provisioned, Eagerly Zeroed

This is the most performance-optimized and secure option. It pre-allocates all space and zeroes out all blocks at creation time. While this makes disk creation take longer, it ensures that all blocks are ready for immediate writing, leading to the best possible performance during VM operation.

**Key considerations:**

- Required for VMware features like Fault Tolerance
- Best performance for I/O-intensive applications
- Ideal for security-sensitive environments where data remnants could be an issue

## Use Case Examples

1. **Development Environment**: Thin provisioning is often ideal for dev/test environments where storage efficiency is more important than performance.

2. **General-Purpose Servers**: Thick provisioned, lazily zeroed offers a good balance for standard application servers, file servers, and web servers.

3. **Production Databases**: Thick provisioned, eagerly zeroed is typically the best choice for database servers and mission-critical applications where performance is paramount.

4. **Security-Sensitive Applications**: For VMs handling sensitive data, eagerly zeroed disks provide an additional security layer by ensuring no residual data remains.

By selecting the appropriate disk provisioning type for your specific workloads, you can optimize both your storage utilization and application performance in your VMware environment.
