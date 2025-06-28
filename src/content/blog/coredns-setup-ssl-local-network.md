---
author: Anubhav Gain
pubDatetime: 2025-06-28T11:00:00+05:30
modDatetime: 2025-06-28T11:00:00+05:30
title: CoreDNS Setup for Local Network with SSL
slug: coredns-setup-ssl-local-network
featured: false
draft: false
tags:
  - coredns
  - dns
  - ssl
  - networking
  - linux
  - homelab
  - infrastructure
description: Step-by-step guide to set up CoreDNS for local network DNS resolution with SSL configuration, including client configuration and troubleshooting tips.
---

# CoreDNS Setup for Local Network with SSL

## Table of Contents

## Introduction

This project sets up a local DNS infrastructure using CoreDNS, with one Debian server acting as the DNS server and two client VMs. The system is designed to use CoreDNS for local hostname resolution and fall back to 1.1.1.1 for internet queries. Additionally, it includes SSL configuration for secure local connections.

## System Architecture

The setup consists of:

- 1 Debian VM running CoreDNS as the DNS server
- 2 Client VMs configured to use the CoreDNS server
- SSL certificates for secure local connections
- Fallback to Cloudflare DNS (1.1.1.1) for external queries

## Prerequisites

- 1 Debian VM for CoreDNS server
- 2 Client VMs (any Linux distribution)
- Root or sudo access on all VMs
- Basic understanding of DNS and networking

## Installation

### CoreDNS Server Setup

1. Download and install CoreDNS:

```bash
wget https://github.com/coredns/coredns/releases/download/v1.10.1/coredns_1.10.1_linux_amd64.tgz
tar xzf coredns_1.10.1_linux_amd64.tgz
sudo mv coredns /usr/local/bin/
```

2. Verify installation:

```bash
coredns -version
```

### Client VM Configuration

On each client VM, edit the `/etc/resolv.conf` file:

```bash
sudo nano /etc/resolv.conf
```

Add the following content (replace 192.168.1.10 with your CoreDNS server's IP):

```
nameserver 192.168.1.10
nameserver 1.1.1.1
```

## Configuration

### CoreDNS Configuration File

Create and edit the Corefile:

```bash
sudo mkdir /etc/coredns
sudo nano /etc/coredns/Corefile
```

Add the following content:

```corefile
.:53 {
    hosts {
        192.168.1.10 server.local
        192.168.1.20 client1.local
        192.168.1.30 client2.local
        fallthrough
    }
    forward . 1.1.1.1
    log
    errors
}
```

### SystemD Service Setup

Create a SystemD service file:

```bash
sudo nano /etc/systemd/system/coredns.service
```

Add the following content:

```ini
[Unit]
Description=CoreDNS DNS server
After=network.target

[Service]
ExecStart=/usr/local/bin/coredns -conf /etc/coredns/Corefile
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable coredns
sudo systemctl start coredns
```

## SSL Configuration

Generate a self-signed certificate:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/hostname.local.key \
     -out /etc/ssl/certs/hostname.local.crt
```

Follow the prompts, ensuring you set the Common Name to "hostname.local".

## Troubleshooting

If CoreDNS fails to start, try the following:

1. **Check permissions:**

```bash
ls -l /usr/local/bin/coredns
sudo chmod +x /usr/local/bin/coredns
```

2. **Verify Corefile:**

```bash
cat /etc/coredns/Corefile
```

3. **Run CoreDNS manually:**

```bash
sudo /usr/local/bin/coredns -conf /etc/coredns/Corefile
```

4. **Check logs:**

```bash
sudo journalctl -u coredns.service
```

5. **Check for port conflicts:**

```bash
sudo lsof -i :53
```

6. **Configure firewall:**

```bash
sudo firewall-cmd --permanent --add-service=dns
sudo firewall-cmd --reload
```

## Advanced Usage

1. **Custom DNS records**: Add more entries to the hosts section in the Corefile.
2. **Plugins**: CoreDNS supports various plugins. Explore the official documentation for more options.

## Conclusion

This setup provides a robust local DNS solution with SSL support, perfect for development environments and homelabs. The CoreDNS server handles local hostname resolution while maintaining internet connectivity through Cloudflare DNS.
