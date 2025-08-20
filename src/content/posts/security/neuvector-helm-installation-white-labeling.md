---
author: Anubhav Gain
pubDatetime: 2025-01-28T18:00:00+05:30
modDatetime: 2025-01-28T18:00:00+05:30
title: NeuVector Helm Installation and White-labeling - Complete Guide
slug: neuvector-helm-installation-white-labeling
featured: false
draft: false
tags:
  - neuvector
  - kubernetes
  - security
  - helm
  - container-security
  - white-labeling
  - zero-trust
  - runtime-protection
category: Security
description: Comprehensive guide to installing NeuVector container security platform using Helm, including advanced configuration, white-labeling customization, and enterprise deployment patterns
---

# NeuVector Helm Installation and White-labeling: Complete Guide

This comprehensive guide covers the installation of NeuVector, a full lifecycle container security platform, using Helm charts. We'll explore advanced configuration options, white-labeling capabilities for OEM deployments, and best practices for enterprise container security.

## Overview

NeuVector provides:

- **Runtime Security**: Zero-trust container network protection
- **Vulnerability Management**: Continuous scanning and compliance
- **Admission Control**: Kubernetes-native policy enforcement
- **Network Visualization**: Real-time container traffic mapping
- **Compliance**: CIS benchmarks and custom policy frameworks
- **White-labeling**: Full customization for managed service providers

## Prerequisites

### System Requirements

1. **Kubernetes Cluster**:
   - Version 1.19+ (1.24+ recommended)
   - RBAC enabled
   - CNI plugin supporting NetworkPolicy (Calico, Cilium, etc.)

2. **Hardware Requirements**:
   - Controller: 1 CPU, 1GB RAM minimum
   - Enforcer: 1 CPU, 1GB RAM per node
   - Scanner: 1 CPU, 1GB RAM minimum
   - Manager (UI): 1 CPU, 1GB RAM minimum

3. **Storage**:
   - 10GB persistent volume for database
   - 5GB for scanner registry cache

4. **Network**:
   - Service mesh compatible (optional)
   - LoadBalancer or Ingress controller

## Installation Methods

### Method 1: Helm Chart Installation

#### Add NeuVector Helm Repository

```bash
# Add the official repository
helm repo add neuvector https://neuvector.github.io/neuvector-helm/
helm repo update

# Search available versions
helm search repo neuvector/core --versions
```

#### Basic Installation

```bash
# Create namespace
kubectl create namespace neuvector

# Install with default values
helm install neuvector neuvector/core \
  --namespace neuvector \
  --set tag=5.3.0 \
  --set manager.ingress.enabled=true \
  --set manager.ingress.host=neuvector.example.com
```

#### Production Installation

Create `values-production.yaml`:

```yaml
# NeuVector Production Configuration
controller:
  replicas: 3
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

  # Persistent storage for policies
  pvc:
    enabled: true
    storageClass: "fast-ssd"
    accessMode: "ReadWriteOnce"
    size: "10Gi"

  # Federation configuration
  federation:
    mastersvc:
      type: LoadBalancer
    managedsvc:
      type: LoadBalancer

  # Advanced settings
  env:
    - name: CLUSTER_JOIN_RETRY_INTERVAL
      value: "30"
    - name: CUSTOM_CHECK_CONTROL
      value: "1"

enforcer:
  resources:
    requests:
      cpu: "500m"
      memory: "512Mi"
    limits:
      cpu: "1"
      memory: "1Gi"

  # Runtime protection settings
  runtimeProtection: true
  admissionControl: true

manager:
  replicas: 2
  resources:
    requests:
      cpu: "250m"
      memory: "512Mi"
    limits:
      cpu: "500m"
      memory: "1Gi"

  # Ingress configuration
  ingress:
    enabled: true
    className: "nginx"
    host: neuvector.example.com
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    tls:
      enabled: true
      secretName: neuvector-tls

  # Session management
  env:
    - name: MANAGER_SESSION_TIMEOUT
      value: "3600"
    - name: MANAGER_KEEP_ALIVE_INTERVAL
      value: "60"

scanner:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

  # Scanner storage
  pvc:
    enabled: true
    storageClass: "standard"
    size: "10Gi"

# CRD installation
crdwebhook:
  enabled: true
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"
    limits:
      cpu: "200m"
      memory: "256Mi"

# Global settings
tag: "5.3.0"
imagePullSecrets:
  - name: neuvector-registry

# Service account
serviceAccount:
  controller: neuvector-controller
  enforcer: neuvector-enforcer
  scanner: neuvector-scanner
  manager: neuvector-manager

# Security context
securityContext:
  runAsUser: 0
  fsGroup: 0

# Node selectors for dedicated security nodes
nodeSelector:
  node-role.kubernetes.io/security: "true"

# Tolerations for tainted nodes
tolerations:
  - key: "security"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

Install with production values:

```bash
helm install neuvector neuvector/core \
  --namespace neuvector \
  --values values-production.yaml \
  --wait
```

### Method 2: Operator Installation

```bash
# Install NeuVector Operator
kubectl apply -f https://raw.githubusercontent.com/neuvector/neuvector-operator/main/deploy/neuvector-operator.yaml

# Create NeuVector instance
cat <<EOF | kubectl apply -f -
apiVersion: neuvector.com/v1
kind: NeuVector
metadata:
  name: neuvector
  namespace: neuvector
spec:
  controller:
    replicas: 3
    env:
      - name: CLUSTER_JOIN_RETRY_INTERVAL
        value: "30"
  enforcer:
    runtimeProtection: true
  manager:
    ingress:
      enabled: true
      host: neuvector.example.com
  scanner:
    replicas: 2
EOF
```

## White-labeling Configuration

### Understanding White-labeling

NeuVector supports complete white-labeling for:

- Managed Security Service Providers (MSSPs)
- OEM partnerships
- Enterprise custom branding
- Multi-tenant deployments

### White-label Components

#### 1. UI Customization

Create custom ConfigMap for branding:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: neuvector-branding
  namespace: neuvector
data:
  custom.css: |
    /* Custom CSS for white-labeling */
    :root {
      --primary-color: #1a73e8;
      --secondary-color: #34a853;
      --background-color: #f8f9fa;
      --text-color: #202124;
      --border-color: #dadce0;
    }

    /* Logo customization */
    .logo-container {
      background-image: url('/custom/logo.png');
      background-size: contain;
      width: 200px;
      height: 60px;
    }

    /* Hide NeuVector branding */
    .nv-branding {
      display: none !important;
    }

    /* Custom header */
    .header-bar {
      background-color: var(--primary-color);
    }

    /* Custom buttons */
    .btn-primary {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .btn-primary:hover {
      background-color: #1557b0;
      border-color: #1557b0;
    }

    /* Custom navigation */
    .nav-sidebar {
      background-color: var(--background-color);
    }

    .nav-link.active {
      background-color: var(--secondary-color);
      color: white;
    }

  custom.js: |
    // Custom JavaScript for white-labeling
    (function() {
      // Wait for DOM to load
      document.addEventListener('DOMContentLoaded', function() {
        // Replace title
        document.title = 'Enterprise Container Security Platform';
        
        // Replace footer text
        const footer = document.querySelector('.footer-text');
        if (footer) {
          footer.innerHTML = '© 2024 Your Company. All rights reserved.';
        }
        
        // Custom welcome message
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
          welcomeMsg.innerHTML = 'Welcome to Enterprise Container Security';
        }
        
        // Add custom menu items
        const menuContainer = document.querySelector('.nav-sidebar');
        if (menuContainer) {
          const customMenuItem = document.createElement('li');
          customMenuItem.className = 'nav-item';
          customMenuItem.innerHTML = `
            <a class="nav-link" href="/support">
              <i class="fas fa-headset"></i>
              <span>Enterprise Support</span>
            </a>
          `;
          menuContainer.appendChild(customMenuItem);
        }
      });
      
      // Custom API endpoint for branding
      window.customBranding = {
        companyName: 'Your Company',
        supportEmail: 'support@yourcompany.com',
        documentationUrl: 'https://docs.yourcompany.com',
        apiEndpoint: 'https://api.yourcompany.com/v1'
      };
    })();

  config.json: |
    {
      "branding": {
        "productName": "Enterprise Container Security",
        "companyName": "Your Company",
        "logo": {
          "light": "/custom/logo-light.svg",
          "dark": "/custom/logo-dark.svg"
        },
        "favicon": "/custom/favicon.ico",
        "colors": {
          "primary": "#1a73e8",
          "secondary": "#34a853",
          "success": "#34a853",
          "warning": "#fbbc04",
          "danger": "#ea4335"
        },
        "features": {
          "showNeuVectorLogo": false,
          "showVersionInfo": true,
          "customFooter": true,
          "customHeader": true
        },
        "links": {
          "documentation": "https://docs.yourcompany.com",
          "support": "https://support.yourcompany.com",
          "community": "https://community.yourcompany.com"
        }
      }
    }
```

#### 2. Volume Mount for Custom Assets

Update Helm values to mount branding:

```yaml
manager:
  volumes:
    - name: custom-branding
      configMap:
        name: neuvector-branding
    - name: custom-assets
      persistentVolumeClaim:
        claimName: neuvector-assets

  volumeMounts:
    - name: custom-branding
      mountPath: /usr/local/apache2/htdocs/custom
    - name: custom-assets
      mountPath: /usr/local/apache2/htdocs/assets

  env:
    - name: CUSTOM_BRANDING_ENABLED
      value: "true"
    - name: CUSTOM_CSS_PATH
      value: "/custom/custom.css"
    - name: CUSTOM_JS_PATH
      value: "/custom/custom.js"
    - name: CUSTOM_CONFIG_PATH
      value: "/custom/config.json"
```

#### 3. Custom Login Page

Create custom login template:

```html
<!-- custom-login.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Enterprise Container Security - Login</title>
    <link rel="stylesheet" href="/custom/custom.css" />
    <style>
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .login-box {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        width: 400px;
      }

      .company-logo {
        text-align: center;
        margin-bottom: 30px;
      }

      .login-form input {
        width: 100%;
        padding: 12px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
      }

      .login-button {
        width: 100%;
        padding: 12px;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .login-button:hover {
        background-color: #1557b0;
      }

      .additional-options {
        margin-top: 20px;
        text-align: center;
      }

      .sso-buttons {
        margin-top: 20px;
      }

      .sso-button {
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #ddd;
        background: white;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <div class="login-box">
        <div class="company-logo">
          <img src="/custom/logo.png" alt="Company Logo" height="60" />
        </div>

        <h2 style="text-align: center; margin-bottom: 30px;">
          Enterprise Container Security
        </h2>

        <form class="login-form" action="/login" method="POST">
          <input type="text" name="username" placeholder="Username" required />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button type="submit" class="login-button">Sign In</button>
        </form>

        <div class="sso-buttons">
          <button class="sso-button" onclick="ssoLogin('saml')">
            <img
              src="/assets/saml-icon.png"
              height="20"
              style="margin-right: 10px;"
            />
            Sign in with SAML
          </button>
          <button class="sso-button" onclick="ssoLogin('oidc')">
            <img
              src="/assets/oidc-icon.png"
              height="20"
              style="margin-right: 10px;"
            />
            Sign in with OIDC
          </button>
        </div>

        <div class="additional-options">
          <a href="/forgot-password">Forgot password?</a> |
          <a href="https://support.yourcompany.com">Get Support</a>
        </div>
      </div>
    </div>

    <script src="/custom/custom.js"></script>
    <script>
      function ssoLogin(type) {
        window.location.href = `/auth/${type}/login`;
      }
    </script>
  </body>
</html>
```

#### 4. API White-labeling

Custom API wrapper for white-labeled endpoints:

```python
#!/usr/bin/env python3
# api-wrapper.py

from flask import Flask, request, jsonify, redirect
import requests
import os

app = Flask(__name__)

# Configuration
NEUVECTOR_API = os.environ.get('NEUVECTOR_API', 'https://neuvector-svc:10443')
COMPANY_NAME = os.environ.get('COMPANY_NAME', 'Your Company')
API_VERSION = 'v1'

# Custom API endpoints
@app.route(f'/api/{API_VERSION}/info', methods=['GET'])
def get_info():
    """Return white-labeled system information"""
    # Get original info from NeuVector
    response = requests.get(f'{NEUVECTOR_API}/v1/system/summary',
                          verify=False,
                          headers=request.headers)

    if response.status_code == 200:
        data = response.json()
        # Customize response
        custom_data = {
            'product': f'{COMPANY_NAME} Container Security',
            'version': data.get('version', 'unknown'),
            'platform': 'Kubernetes',
            'company': COMPANY_NAME,
            'support': f'support@{COMPANY_NAME.lower().replace(" ", "")}.com',
            'features': {
                'runtime_protection': True,
                'vulnerability_scanning': True,
                'compliance': True,
                'network_segmentation': True
            },
            'cluster_info': {
                'nodes': data.get('nodes', 0),
                'pods': data.get('pods', 0),
                'services': data.get('services', 0)
            }
        }
        return jsonify(custom_data)

    return jsonify({'error': 'Failed to get system info'}), 500

@app.route(f'/api/{API_VERSION}/branding', methods=['GET'])
def get_branding():
    """Return branding configuration"""
    return jsonify({
        'company': COMPANY_NAME,
        'product': f'{COMPANY_NAME} Container Security',
        'logo': '/custom/logo.png',
        'theme': {
            'primary': '#1a73e8',
            'secondary': '#34a853'
        },
        'links': {
            'documentation': f'https://docs.{COMPANY_NAME.lower()}.com',
            'support': f'https://support.{COMPANY_NAME.lower()}.com',
            'api': f'https://api.{COMPANY_NAME.lower()}.com'
        }
    })

# Proxy all other requests to NeuVector
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy(path):
    """Proxy requests to NeuVector API"""
    url = f'{NEUVECTOR_API}/{path}'

    response = requests.request(
        method=request.method,
        url=url,
        headers=request.headers,
        data=request.get_data(),
        verify=False,
        allow_redirects=False
    )

    # Return proxied response
    return response.content, response.status_code, response.headers.items()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, ssl_context='adhoc')
```

### Deploy White-label Components

```yaml
# white-label-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuvector-whitelabel
  namespace: neuvector
spec:
  replicas: 2
  selector:
    matchLabels:
      app: neuvector-whitelabel
  template:
    metadata:
      labels:
        app: neuvector-whitelabel
    spec:
      containers:
        - name: api-wrapper
          image: your-registry/neuvector-whitelabel:latest
          ports:
            - containerPort: 8080
          env:
            - name: NEUVECTOR_API
              value: "https://neuvector-svc-controller:10443"
            - name: COMPANY_NAME
              value: "Your Company"
          volumeMounts:
            - name: branding-config
              mountPath: /app/config
      volumes:
        - name: branding-config
          configMap:
            name: neuvector-branding
---
apiVersion: v1
kind: Service
metadata:
  name: neuvector-whitelabel
  namespace: neuvector
spec:
  selector:
    app: neuvector-whitelabel
  ports:
    - port: 443
      targetPort: 8080
  type: ClusterIP
```

## Advanced Configuration

### 1. Multi-tenancy Setup

```yaml
# Multi-tenant configuration
controller:
  federation:
    mastersvc:
      type: LoadBalancer
    managedsvc:
      type: LoadBalancer

  env:
    - name: MULTI_TENANT_MODE
      value: "true"
    - name: TENANT_ISOLATION
      value: "strict"
    - name: MAX_TENANTS
      value: "100"

manager:
  env:
    - name: ENABLE_TENANT_UI
      value: "true"
    - name: TENANT_ADMIN_ROLE
      value: "tenant-admin"
```

### 2. Integration with Service Mesh

```yaml
# Istio integration
apiVersion: v1
kind: ConfigMap
metadata:
  name: neuvector-istio-config
  namespace: neuvector
data:
  istio.yaml: |
    mesh_integration:
      enabled: true
      type: istio
      version: "1.18"
      
    traffic_management:
      enabled: true
      enforce_mtls: true
      
    telemetry:
      enabled: true
      export_to_prometheus: true
      
    security_policy:
      mode: "enforce"
      default_action: "deny"
```

### 3. Advanced Scanner Configuration

```yaml
scanner:
  registry:
    # Private registry configuration
    - name: private-registry
      url: registry.example.com
      username: scanner
      password: "${SCANNER_PASSWORD}"

    # Public registry with filters
    - name: docker-hub
      url: docker.io
      filters:
        - "library/*"
        - "official/*"

  # Vulnerability database updates
  vulnerabilityDatabase:
    updateInterval: 3600 # 1 hour
    sources:
      - nvd
      - redhat
      - ubuntu
      - alpine
      - debian

  # Custom vulnerability feeds
  customFeeds:
    - name: internal-vulns
      url: https://security.example.com/vulns/feed
      apiKey: "${VULN_FEED_API_KEY}"

  # Scan settings
  scanConfig:
    layerScan: true
    baseImageScan: true
    maxScanJobs: 10
    scanTimeout: 600

  # License scanning
  licenseScan:
    enabled: true
    blockedLicenses:
      - GPL-3.0
      - AGPL-3.0
```

### 4. Compliance Configuration

```yaml
# compliance-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: neuvector-compliance
  namespace: neuvector
data:
  compliance.yaml: |
    profiles:
      - name: cis-k8s-1.23
        enabled: true
        schedule: "0 2 * * *"  # Daily at 2 AM
        
      - name: pci-dss-3.2
        enabled: true
        schedule: "0 0 * * 0"  # Weekly on Sunday
        
      - name: nist-800-53
        enabled: true
        schedule: "0 0 1 * *"  # Monthly
        
      - name: custom-baseline
        enabled: true
        rules:
          - id: CUSTOM-001
            description: "Ensure no root containers"
            severity: HIGH
            script: |
              if [ "$(id -u)" = "0" ]; then
                exit 1
              fi
              
          - id: CUSTOM-002
            description: "Verify security labels"
            severity: MEDIUM
            script: |
              kubectl get pods -o json | \
                jq '.items[] | select(.metadata.labels.security != "verified")'

    reporting:
      format: 
        - json
        - pdf
        - csv
      
      destinations:
        - type: s3
          bucket: compliance-reports
          region: us-east-1
          
        - type: email
          recipients:
            - security@example.com
            - compliance@example.com
```

### 5. Network Policy Templates

```yaml
# network-policy-templates.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: neuvector-network-templates
  namespace: neuvector
data:
  templates.yaml: |
    templates:
      - name: zero-trust-default
        description: "Zero trust network policy"
        rules:
          - action: deny
            from: "any"
            to: "any"
            applications: ["any"]
            
      - name: microservice-communication
        description: "Allow microservice communication"
        rules:
          - action: allow
            from: "group:frontend"
            to: "group:backend"
            applications: ["HTTP", "HTTPS"]
            ports: ["8080", "8443"]
            
          - action: allow
            from: "group:backend"
            to: "group:database"
            applications: ["PostgreSQL", "MySQL"]
            
      - name: external-ingress
        description: "Allow external traffic"
        rules:
          - action: allow
            from: "external"
            to: "group:ingress"
            applications: ["HTTP", "HTTPS"]
            ports: ["80", "443"]
```

## Monitoring and Operations

### 1. Prometheus Integration

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: neuvector-prometheus
  namespace: neuvector
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
      evaluation_interval: 30s

    scrape_configs:
      - job_name: 'neuvector-controller'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - neuvector
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: neuvector-controller-pod
            action: keep
        metrics_path: '/v1/metrics'
        scheme: https
        tls_config:
          insecure_skip_verify: true
        basic_auth:
          username: 'admin'
          password: 'admin'
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "NeuVector Security Dashboard",
    "panels": [
      {
        "title": "Security Events",
        "targets": [
          {
            "expr": "rate(neuvector_security_events_total[5m])",
            "legendFormat": "{{severity}}"
          }
        ]
      },
      {
        "title": "Network Violations",
        "targets": [
          {
            "expr": "sum(rate(neuvector_network_violations_total[5m])) by (action)",
            "legendFormat": "{{action}}"
          }
        ]
      },
      {
        "title": "Scanner Activity",
        "targets": [
          {
            "expr": "neuvector_scan_jobs_active",
            "legendFormat": "Active Scans"
          },
          {
            "expr": "rate(neuvector_scan_jobs_completed_total[5m])",
            "legendFormat": "Completed/min"
          }
        ]
      },
      {
        "title": "Vulnerability Summary",
        "targets": [
          {
            "expr": "sum(neuvector_vulnerabilities_total) by (severity)",
            "legendFormat": "{{severity}}"
          }
        ]
      }
    ]
  }
}
```

### 3. Backup and Restore

```bash
#!/bin/bash
# backup-neuvector.sh

NAMESPACE="neuvector"
BACKUP_DIR="/backup/neuvector/$(date +%Y%m%d-%H%M%S)"

echo "Starting NeuVector backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Export controller configuration
echo "Backing up controller configuration..."
kubectl exec -n $NAMESPACE deployment/neuvector-controller-pod -- \
  /usr/local/bin/controller -export > "$BACKUP_DIR/controller-config.json"

# Export policies
echo "Backing up policies..."
curl -k -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  https://neuvector-svc-controller:10443/v1/policy/export \
  > "$BACKUP_DIR/policies.json"

# Export network rules
echo "Backing up network rules..."
curl -k -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  https://neuvector-svc-controller:10443/v1/network/rules/export \
  > "$BACKUP_DIR/network-rules.json"

# Backup persistent volumes
echo "Backing up persistent data..."
kubectl exec -n $NAMESPACE deployment/neuvector-controller-pod -- \
  tar czf - /var/neuvector | \
  cat > "$BACKUP_DIR/controller-data.tar.gz"

# Backup Kubernetes resources
echo "Backing up Kubernetes resources..."
kubectl get all,cm,secret,pvc,pv -n $NAMESPACE -o yaml \
  > "$BACKUP_DIR/k8s-resources.yaml"

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(kubectl get deployment -n $NAMESPACE neuvector-controller-pod -o jsonpath='{.spec.template.spec.containers[0].image}')",
  "components": [
    "controller-config.json",
    "policies.json",
    "network-rules.json",
    "controller-data.tar.gz",
    "k8s-resources.yaml"
  ]
}
EOF

echo "Backup completed: $BACKUP_DIR"
```

### 4. Performance Tuning

```yaml
# performance-tuning.yaml
controller:
  env:
    - name: CTRL_PATH_ENFORCE
      value: "true"
    - name: ENF_NO_SYSTEM_PROFILES
      value: "true"
    - name: CTRL_PERSIST_CONFIG
      value: "true"
    - name: MAX_CONCURRENT_SCAN
      value: "10"
    - name: SCAN_SCHEDULER_INTERVAL
      value: "5"

  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "4"
      memory: "8Gi"

  jvmOptions: |
    -Xms2g
    -Xmx6g
    -XX:+UseG1GC
    -XX:MaxGCPauseMillis=200
    -XX:ParallelGCThreads=4
    -XX:ConcGCThreads=2

enforcer:
  env:
    - name: ENF_NETPOLICY_PULL_INTERVAL
      value: "10" # seconds
    - name: ENF_MEMORY_LIMIT_PERCENTAGE
      value: "75"

  # eBPF optimization (if supported)
  ebpf:
    enabled: true
    mode: "enhanced" # basic, enhanced, or custom
```

## Troubleshooting

### Common Issues

#### 1. Controller Pods Not Starting

```bash
# Check pod status
kubectl get pods -n neuvector -l app=neuvector-controller-pod

# Check logs
kubectl logs -n neuvector deployment/neuvector-controller-pod

# Common issues:
# - Persistent volume not bound
# - Insufficient resources
# - Network policy blocking communication

# Fix: Check PVC status
kubectl get pvc -n neuvector

# Fix: Increase resource limits
kubectl patch deployment neuvector-controller-pod -n neuvector \
  --patch '{"spec":{"template":{"spec":{"containers":[{"name":"neuvector-controller-pod","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
```

#### 2. Scanner Not Finding Vulnerabilities

```bash
# Update vulnerability database
curl -k -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  https://neuvector-svc-controller:10443/v1/scan/config \
  -d '{"auto_scan": true, "db_update": true}'

# Force rescan
curl -k -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  https://neuvector-svc-controller:10443/v1/scan/workload \
  -d '{"namespace": "default", "pod": "all"}'
```

#### 3. Network Policies Not Enforcing

```bash
# Check enforcer status
kubectl get pods -n neuvector -l app=neuvector-enforcer-pod

# Verify CNI plugin support
kubectl get nodes -o jsonpath='{.items[*].status.nodeInfo.containerRuntimeVersion}'

# Enable debug logging
kubectl set env daemonset/neuvector-enforcer-pod -n neuvector \
  DEBUG_LEVEL=debug

# Check iptables rules (on node)
sudo iptables -L -n -v | grep NEUVECTOR
```

### Debug Mode

```yaml
# Enable debug mode
controller:
  env:
    - name: CTRL_DEBUG
      value: "true"
    - name: CTRL_DEBUG_LEVEL
      value: "debug" # info, warning, error, debug

enforcer:
  env:
    - name: ENF_DEBUG
      value: "true"

manager:
  env:
    - name: MANAGER_DEBUG
      value: "true"
```

## Best Practices

### 1. Security Hardening

```yaml
# Security hardening configuration
securityContext:
  controller:
    runAsNonRoot: false # Required for network monitoring
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false
    seccompProfile:
      type: RuntimeDefault
    capabilities:
      drop:
        - ALL
      add:
        - NET_ADMIN
        - SYS_ADMIN
        - NET_RAW

  manager:
    runAsNonRoot: true
    runAsUser: 1000
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false

  scanner:
    runAsNonRoot: true
    runAsUser: 1000
    readOnlyRootFilesystem: false # Needs write for cache
    allowPrivilegeEscalation: false
```

### 2. High Availability

```yaml
# HA configuration
controller:
  replicas: 3
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - neuvector-controller-pod
          topologyKey: kubernetes.io/hostname

manager:
  replicas: 2
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - neuvector-manager-pod
            topologyKey: kubernetes.io/hostname
```

### 3. Resource Optimization

```yaml
# Resource optimization
verticalPodAutoscaler:
  enabled: true
  updateMode: "Auto"

horizontalPodAutoscaler:
  scanner:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80
```

## Conclusion

NeuVector provides comprehensive container security with extensive customization options through white-labeling. Key benefits include:

- **Complete Security Stack**: Runtime protection, vulnerability management, and compliance
- **White-label Ready**: Full customization for MSSPs and enterprises
- **Cloud-Native**: Designed for Kubernetes with operator support
- **Zero Trust**: Network segmentation and behavioral learning
- **Enterprise Features**: Multi-tenancy, federation, and extensive integrations

The combination of Helm deployment flexibility and white-labeling capabilities makes NeuVector an ideal choice for organizations looking to provide branded container security services or integrate container security into their existing platforms.

## Additional Resources

- [NeuVector Documentation](https://open-docs.neuvector.com/)
- [NeuVector GitHub Repository](https://github.com/neuvector/neuvector)
- [NeuVector Helm Charts](https://github.com/neuvector/neuvector-helm)
- [SUSE Rancher Integration](https://www.suse.com/products/neuvector/)
- [Container Security Best Practices](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)
