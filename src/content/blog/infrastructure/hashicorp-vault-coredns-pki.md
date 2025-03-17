---
author: Anubhav Gain
pubDatetime: 2024-09-24T10:00:00Z
modDatetime: 2024-09-24T10:00:00Z
title: Enterprise PKI with HashiCorp Vault and CoreDNS - Complete Setup Guide
slug: hashicorp-vault-coredns-pki
featured: false
draft: false
tags:
  - vault
  - hashicorp
  - pki
  - coredns
  - certificates
  - security
  - nginx
  - ssl
  - infrastructure
description: A comprehensive guide to implementing a secure internal PKI infrastructure using HashiCorp Vault as a certificate authority with root and intermediate CAs, integrated with CoreDNS for service discovery and Nginx for HTTPS services.
---

# Enterprise PKI with HashiCorp Vault and CoreDNS - Complete Setup Guide

Building a secure internal network requires proper certificate management and name resolution. HashiCorp Vault provides robust certificate authority capabilities, while CoreDNS offers flexible DNS management. This guide demonstrates how to implement a complete PKI solution across multiple servers, enabling secure internal HTTPS communications with proper certificate validation.

## Architecture Overview

Our setup consists of three virtual machines, each with a specific role:

```mermaid
graph TD
    A[VM1: Vault Server<br>192.168.122.206] -->|Issues Certificates| C[VM3: Nginx Server<br>192.168.122.27]
    B[VM2: CoreDNS Server<br>192.168.122.16] -->|Name Resolution| A
    B -->|Name Resolution| C
    A -->|Root & Intermediate CA| D[PKI Infrastructure]
    C -->|HTTPS Services| E[Internal Users]
    B -->|DNS Services| E
```

- **VM1 (192.168.122.206)**: HashiCorp Vault server acting as Certificate Authority
- **VM2 (192.168.122.16)**: CoreDNS server providing internal DNS resolution
- **VM3 (192.168.122.27)**: Nginx web server with TLS/SSL enabled

## Prerequisites

Before beginning, ensure you have:

- Three virtual machines with the IPs listed above
- Basic Linux administration knowledge
- Network connectivity between all three servers
- Root or sudo access on all machines

## Step 1: Initialize and Configure HashiCorp Vault

First, let's install and configure Vault on the dedicated server.

### Installing Vault

```bash
# Download and install Vault
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault

# Verify the installation
vault --version
```

### Configure the Vault Server

Create a basic configuration file:

```bash
sudo mkdir /etc/vault
sudo nano /etc/vault/config.hcl
```

Add the following configuration:

```hcl
storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in production with proper certificates
}

api_addr = "http://192.168.122.206:8200"
cluster_addr = "https://192.168.122.206:8201"
ui = true
```

Prepare the storage directory and start Vault:

```bash
sudo mkdir -p /opt/vault/data
sudo chown -R vault:vault /opt/vault
sudo systemctl enable vault
sudo systemctl start vault
```

### Initialize and Unseal Vault

Initialize the Vault server:

```bash
export VAULT_ADDR='http://192.168.122.206:8200'
vault operator init
```

This will output five unseal keys and a root token. Store these securely as they are critical for accessing your Vault.

Sample output:
