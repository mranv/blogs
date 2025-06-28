---
author: Anubhav Gain
pubDatetime: 2025-06-28T10:00:00+05:30
modDatetime: 2025-06-28T10:00:00+05:30
title: Setting up HTTPS for Local VMs with Custom Domains
slug: coredns-https-local-vms
featured: false
draft: false
tags:
  - coredns
  - nginx
  - https
  - virtualization
  - homelab
  - networking
  - certificates
description: Complete guide to serving local VMs over HTTPS using custom domain names with CoreDNS, NGINX, and Smallstep certificates.
---

# Setting up HTTPS for Local VMs with Custom Domains

This guide will walk you through setting up a system to serve your local VMs over HTTPS using custom domain names (e.g., https://xyz.local). We'll use the following components:

- Hypervisor (e.g., VirtualBox, VMware, or Hyper-V)
- CoreDNS for local DNS resolution
- NGINX as a reverse proxy
- Smallstep/certificates for certificate management

## 1. Set up your Hypervisor and VMs

1. Install your chosen hypervisor (VirtualBox, VMware, or Hyper-V).
2. Create VMs for each service you want to run.
3. Configure the VMs to use bridged networking so they're accessible on your local network.
4. Note down the IP addresses assigned to each VM.

## 2. Set up CoreDNS

1. Create a new VM to act as your DNS server.

2. Install CoreDNS on this VM.

3. Configure CoreDNS:

```corefile
xyz.local:53 {
  hosts {
    192.168.1.101 app1.xyz.local
    192.168.1.102 app2.xyz.local
    192.168.1.103 ca.xyz.local
    fallthrough
  }
  log
}

.:53 {
  forward . 8.8.8.8 8.8.4.4
  log
}
```

4. Configure your router to use this VM's IP address as the primary DNS server.

## 3. Set up NGINX Reverse Proxy

1. Create a new VM to act as your reverse proxy.

2. Install NGINX on this VM.

3. Configure NGINX as a reverse proxy:

```nginx
http {
  server {
    listen 80;
    server_name *.xyz.local;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl;
    server_name app1.xyz.local;

    ssl_certificate /path/to/app1.xyz.local.crt;
    ssl_certificate_key /path/to/app1.xyz.local.key;

    location / {
      proxy_pass http://192.168.1.101;
    }
  }

  # Repeat for other apps...
}
```

## 4. Set up Smallstep/certificates

1. Create a new VM to act as your Certificate Authority (CA).

2. Install Smallstep/certificates on this VM.

3. Initialize the CA:

```bash
step ca init --name "Local CA" --dns ca.xyz.local --address :443
```

4. Configure the CA for long-lived certificates:

```json
{
  "claims": {
    "minTLSCertDuration": "5s",
    "maxTLSCertDuration": "8760h",
    "defaultTLSCertDuration": "8760h"
  }
}
```

5. Generate certificates for each domain:

```bash
step ca certificate app1.xyz.local app1.xyz.local.crt app1.xyz.local.key
```

6. Copy the certificates to your NGINX VM.

## 5. Trust the Root Certificate

1. Export the root certificate from your CA VM.
2. Import the root certificate into the trust store of each client device.

## 6. Configure Client Devices

1. Ensure all client devices are using your CoreDNS server for DNS resolution.
2. Import the root CA certificate into each client device's trust store.

## How It Works

Now, when you access https://app1.xyz.local from a client device on your network, it should:

1. Resolve to your NGINX VM's IP address
2. Connect securely using the custom certificate
3. Be proxied to the correct application VM

## Security Considerations

Remember to keep your CA and certificates secure, and renew certificates before they expire. This setup is intended for local development and homelab environments only - do not expose these services to the public internet without proper security hardening.

## Conclusion

This setup provides a professional-grade local development environment with proper HTTPS support and custom domain names. It's perfect for testing applications that require HTTPS or for creating a more realistic development environment that mimics production infrastructure.