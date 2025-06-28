---
author: Anubhav Gain
pubDatetime: 2025-01-28T15:15:00+05:30
modDatetime: 2025-01-28T15:15:00+05:30
title: Deploying Cloudflare Tunnels in Kubernetes for Secure Application Access
slug: cloudflare-tunnel-kubernetes-deployment
featured: false
draft: false
tags:
  - cloudflare
  - kubernetes
  - security
  - zero-trust
  - networking
  - gitlab
  - tunnel
  - cloudflared
description: Complete guide to deploying Cloudflare Tunnels in Kubernetes for secure, zero-trust access to applications like GitLab, including high availability configuration, security best practices, and troubleshooting
---

# Deploying Cloudflare Tunnels in Kubernetes for Secure Application Access

Cloudflare Tunnels provide a secure way to expose your internal applications to the internet without opening inbound ports or exposing your infrastructure. This guide demonstrates how to deploy Cloudflare Tunnels in Kubernetes to securely access applications like GitLab.

## Overview

Cloudflare Tunnel (formerly Argo Tunnel) creates an encrypted tunnel between your origin server and Cloudflare's edge network. This approach offers several security advantages:

- **No Public IPs Required**: Applications remain completely private
- **Zero-Trust Security**: All traffic is authenticated and encrypted
- **DDoS Protection**: Leverages Cloudflare's global network
- **Easy Management**: Centralized configuration through Cloudflare dashboard

## Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured
- Cloudflare account with a domain
- Cloudflare Tunnel token

## Security-First Approach

Before diving into the deployment, let's address the security considerations upfront.

### 1. Secure Token Storage

Never store Cloudflare tokens in plain text. Always use Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gitlab-cloudflared-token
  namespace: default
type: Opaque
stringData:
  token: eyJhIjoiNjcwODgwNDJhYjYyYzAwZTU0MjAwOTRlZjIwZTkyNDQiLCJ0IjoiNjEyMmU5ZjItNTBhYS00M2ExLTk4YzYtNDYyYmEyYzU1OGFmIiwicyI6IlhZL1piNGxGVHZDNVZtL2RnVW5lSUQvSDNQNHpXNXRiNHpCSVB1aHF6b3M9In0=
```

### 2. RBAC Configuration

Create appropriate service accounts and role bindings:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cloudflared
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cloudflared
  namespace: default
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["gitlab-cloudflared-token"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cloudflared
  namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: cloudflared
subjects:
  - kind: ServiceAccount
    name: cloudflared
    namespace: default
```

## Complete Deployment Configuration

Here's the production-ready deployment for GitLab with Cloudflare Tunnel:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gitlab-cloudflared-token
  namespace: default
type: Opaque
stringData:
  token: YOUR_CLOUDFLARE_TUNNEL_TOKEN_HERE
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: cloudflared-config
  namespace: default
data:
  config.yaml: |
    tunnel: gitlab-tunnel
    credentials-file: /etc/cloudflared/creds/credentials.json
    metrics: 0.0.0.0:2000
    no-autoupdate: true

    ingress:
      - hostname: gitlab.yourdomain.com
        service: http://gitlab-service:80
      - service: http_status:404
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-cloudflared-deployment
  namespace: default
  labels:
    app: gitlab-cloudflared
spec:
  replicas: 2
  selector:
    matchLabels:
      pod: cloudflared
      app: gitlab-cloudflared
  template:
    metadata:
      labels:
        pod: cloudflared
        app: gitlab-cloudflared
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "2000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: cloudflared
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        fsGroup: 65532
      containers:
        - name: cloudflared
          image: cloudflare/cloudflared:2024.1.5
          command:
            - cloudflared
            - tunnel
            - --no-autoupdate
            - --metrics
            - 0.0.0.0:2000
            - run
          args:
            - --token
            - $(TUNNEL_TOKEN)
          env:
            - name: TUNNEL_TOKEN
              valueFrom:
                secretKeyRef:
                  name: gitlab-cloudflared-token
                  key: token
            - name: TUNNEL_LOGLEVEL
              value: "info"
            - name: TUNNEL_TRANSPORT_PROTOCOL
              value: "quic"
          resources:
            requests:
              cpu: 10m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 128Mi
          livenessProbe:
            httpGet:
              path: /ready
              port: 2000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 1
            failureThreshold: 1
          readinessProbe:
            httpGet:
              path: /ready
              port: 2000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 1
            successThreshold: 1
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: config
              mountPath: /etc/cloudflared
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: cloudflared-config
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
                        - gitlab-cloudflared
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: cloudflared-metrics
  namespace: default
  labels:
    app: gitlab-cloudflared
spec:
  ports:
    - name: metrics
      port: 2000
      targetPort: 2000
  selector:
    app: gitlab-cloudflared
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: gitlab-cloudflared-pdb
  namespace: default
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: gitlab-cloudflared
```

## Advanced Configuration Options

### 1. Multiple Services Through Single Tunnel

Configure multiple services through one tunnel:

```yaml
data:
  config.yaml: |
    tunnel: multi-service-tunnel
    credentials-file: /etc/cloudflared/creds/credentials.json

    ingress:
      - hostname: gitlab.yourdomain.com
        service: http://gitlab-service:80
      - hostname: jenkins.yourdomain.com
        service: http://jenkins-service:8080
      - hostname: grafana.yourdomain.com
        service: http://grafana-service:3000
      - service: http_status:404
```

### 2. Origin Server Configuration

Configure advanced origin settings:

```yaml
data:
  config.yaml: |
    tunnel: gitlab-tunnel

    ingress:
      - hostname: gitlab.yourdomain.com
        service: http://gitlab-service:80
        originRequest:
          connectTimeout: 30s
          tlsTimeout: 10s
          tcpKeepAlive: 30s
          noHappyEyeballs: false
          keepAliveConnections: 100
          keepAliveTimeout: 90s
          httpHostHeader: gitlab.internal.local
          originServerName: gitlab.internal.local
          caPool: /etc/cloudflared/ca.crt
          noTLSVerify: false
          disableChunkedEncoding: false
          proxyAddress: 127.0.0.1
          proxyPort: 0
          proxyType: ""
      - service: http_status:404
```

### 3. Load Balancing Configuration

For high-traffic applications, implement load balancing:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-cloudflared-deployment
spec:
  replicas: 3 # Increase replicas for load distribution
  template:
    spec:
      containers:
        - name: cloudflared
          env:
            - name: TUNNEL_EDGE_IP_VERSION
              value: "auto" # Use both IPv4 and IPv6
            - name: TUNNEL_PROTOCOL
              value: "quic" # Use QUIC for better performance
            - name: TUNNEL_RETRIES
              value: "5"
            - name: TUNNEL_GRACE_PERIOD
              value: "30s"
```

## Monitoring and Observability

### 1. Prometheus Metrics

The Cloudflared deployment exposes metrics on port 2000. Configure Prometheus to scrape these metrics:

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: cloudflared-metrics
  namespace: default
spec:
  selector:
    matchLabels:
      app: gitlab-cloudflared
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

### 2. Key Metrics to Monitor

- `cloudflared_tunnel_active_streams`: Number of active connections
- `cloudflared_tunnel_request_errors`: Request error rate
- `cloudflared_tunnel_response_time`: Response time histogram
- `cloudflared_tunnel_concurrent_requests`: Concurrent request count

### 3. Logging Configuration

Configure structured logging for better observability:

```yaml
env:
  - name: TUNNEL_LOGLEVEL
    value: "info"
  - name: TUNNEL_LOGFILE
    value: "/dev/stdout"
  - name: TUNNEL_LOG_FORMAT
    value: "json"
```

## Security Best Practices

### 1. Network Policies

Implement strict network policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cloudflared-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: gitlab-cloudflared
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              monitoring: prometheus
      ports:
        - protocol: TCP
          port: 2000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443 # Cloudflare API
        - protocol: UDP
          port: 7844 # QUIC
    - to:
        - podSelector:
            matchLabels:
              app: gitlab
      ports:
        - protocol: TCP
          port: 80
```

### 2. Pod Security Standards

Apply pod security standards:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cloudflare-tunnels
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 3. Secret Rotation

Implement automatic token rotation:

```bash
#!/bin/bash
# Rotate Cloudflare tunnel token

# Generate new token via Cloudflare API
NEW_TOKEN=$(cloudflared tunnel token ${TUNNEL_NAME})

# Update Kubernetes secret
kubectl create secret generic gitlab-cloudflared-token \
  --from-literal=token=${NEW_TOKEN} \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment to pick up new token
kubectl rollout restart deployment/gitlab-cloudflared-deployment
```

## Troubleshooting Guide

### 1. Connection Issues

Check tunnel status:

```bash
# Check pod logs
kubectl logs -l app=gitlab-cloudflared -f

# Verify tunnel connectivity
kubectl exec -it deployment/gitlab-cloudflared-deployment -- cloudflared tunnel info

# Test service connectivity
kubectl exec -it deployment/gitlab-cloudflared-deployment -- curl -I http://gitlab-service:80
```

### 2. Common Error Messages

**"Unable to reach the origin service"**:

- Verify service name and port
- Check network policies
- Ensure origin service is running

**"Tunnel credentials file not found"**:

- Verify secret is properly mounted
- Check token format and encoding
- Ensure proper RBAC permissions

**"Failed to serve quic connection"**:

- Check firewall rules for UDP port 7844
- Try fallback to HTTP2: `TUNNEL_TRANSPORT_PROTOCOL=http2`

### 3. Performance Optimization

For high-traffic scenarios:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

env:
  - name: TUNNEL_COMPRESSION_LEVEL
    value: "0" # Disable compression for low-latency
  - name: TUNNEL_TCP_KEEPALIVE
    value: "30"
  - name: TUNNEL_KEEP_ALIVE_CONNECTIONS
    value: "100"
```

## Integration with CI/CD

### GitLab CI/CD Pipeline

Automate tunnel deployment with GitLab CI:

```yaml
stages:
  - deploy

deploy-tunnel:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl apply -f cloudflare-tunnel.yaml
    - kubectl rollout status deployment/gitlab-cloudflared-deployment
  only:
    - main
  environment:
    name: production
```

### ArgoCD Application

Deploy using GitOps with ArgoCD:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cloudflare-tunnel
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourorg/k8s-configs
    targetRevision: HEAD
    path: cloudflare-tunnels
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Cost Optimization

### 1. Resource Right-Sizing

Monitor actual resource usage and adjust:

```bash
# Get resource usage
kubectl top pod -l app=gitlab-cloudflared

# Adjust resources based on actual usage
```

### 2. Autoscaling

Implement horizontal pod autoscaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cloudflared-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gitlab-cloudflared-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Conclusion

Cloudflare Tunnels provide a secure, scalable solution for exposing internal applications without compromising security. This deployment configuration ensures:

- **High Availability**: Multiple replicas with pod anti-affinity
- **Security**: Least privilege, encrypted secrets, network policies
- **Observability**: Comprehensive metrics and logging
- **Performance**: Optimized resource usage and QUIC protocol
- **Maintainability**: GitOps-ready configuration

By following this guide, you can securely expose your applications while maintaining a zero-trust security posture and leveraging Cloudflare's global network for performance and protection.
