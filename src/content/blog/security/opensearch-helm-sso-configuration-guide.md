---
author: Anubhav Gain
pubDatetime: 2025-01-28T15:00:00+05:30
modDatetime: 2025-01-28T15:00:00+05:30
title: Configuring OpenSearch with OpenID Connect SSO using Helm
slug: opensearch-helm-sso-configuration-guide
featured: false
draft: false
tags:
  - opensearch
  - helm
  - kubernetes
  - sso
  - security
  - openid-connect
  - keycloak
  - authentication
  - elasticsearch
description: Complete guide to deploying OpenSearch 2.19.0 with OpenID Connect SSO integration using Helm charts, including Keycloak configuration, security settings, and production best practices
---

# Configuring OpenSearch with OpenID Connect SSO using Helm

This comprehensive guide walks through deploying OpenSearch 2.19.0 with OpenID Connect (OIDC) Single Sign-On (SSO) integration using Helm charts. We'll configure OpenSearch to authenticate users through an external identity provider (Keycloak in this example) while maintaining security best practices.

## Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x installed
- kubectl configured
- OpenID Connect provider (Keycloak, Okta, Auth0, etc.)
- DNS configured for OpenSearch and SSO endpoints

## Architecture Overview

The deployment consists of:
- **OpenSearch Cluster**: 3-node cluster with master, data, and ingest roles
- **OpenID Provider**: External SSO provider (Keycloak)
- **Security Plugin**: OpenSearch security plugin configured for OIDC
- **Persistent Storage**: 8Gi per node for data persistence

## Complete Helm Values Configuration

Here's the production-ready `values.yaml` for OpenSearch with SSO:

```yaml
---
clusterName: "opensearch-cluster"
nodeGroup: "master"

# Single-node deployment setting
singleNode: false

# Master service configuration
masterService: "opensearch-cluster-master"

# Node roles configuration
roles:
  - master
  - ingest
  - data
  - remote_cluster_client

replicas: 3

# Version configuration
majorVersion: ""

global:
  dockerRegistry: ""

# OpenSearch home directory
opensearchHome: /usr/share/opensearch

# Configuration files
config:
  opensearch.yml: |
    cluster.name: opensearch-cluster
    
    # Network binding
    network.host: 0.0.0.0
    
    # OpenID Connect Configuration
    opensearch_security.auth.type: "openid"
    opensearch_security.openid.connect_url: "https://oxdr-sso.invinsense.io/realms/sahadev-oxdr/.well-known/openid-configuration"
    opensearch_security.openid.client_id: "siem"
    opensearch_security.openid.client_secret: "ctvfQCVuoyfu8M7JV9hqtLiiRnEfCOTn"
    opensearch_security.openid.base_redirect_url: "https://opensearch.invinsense.dev"
    opensearch_security.openid.logout_url: "https://oxdr-sso.invinsense.io/realms/sahadev-oxdr/protocol/openid-connect/logout"

# Environment variables
extraEnvs:
  # Strong admin password (required for OpenSearch 2.12.0+)
  - name: OPENSEARCH_INITIAL_ADMIN_PASSWORD
    value: LhYSLF99y64QP0n

# Image configuration
image:
  repository: "opensearchproject/opensearch"
  tag: ""
  pullPolicy: "IfNotPresent"

# Resource configuration
opensearchJavaOpts: "-Xmx512M -Xms512M"

resources:
  requests:
    cpu: "1000m"
    memory: "100Mi"

# Persistence configuration
persistence:
  enabled: true
  enableInitChown: true
  accessModes:
    - ReadWriteOnce
  size: 8Gi

# Service configuration
protocol: https
httpPort: 9200
transportPort: 9300
metricsPort: 9600

service:
  type: ClusterIP
  annotations: {}
  httpPortName: http
  transportPortName: transport
  metricsPortName: metrics

# Security configuration
podSecurityContext:
  fsGroup: 1000
  runAsUser: 1000

securityContext:
  capabilities:
    drop:
      - ALL
  runAsNonRoot: true
  runAsUser: 1000

# OpenSearch Security Plugin Configuration
securityConfig:
  enabled: true
  path: "/usr/share/opensearch/config/opensearch-security"
  config:
    securityConfigSecret: ""
    dataComplete: true
    data:
      config.yml: |
        _meta:
          type: "config"
          config_version: 2
        
        config:
          dynamic:
            http:
              anonymous_auth_enabled: false
              xff:
                enabled: false
                internalProxies: '192\.168\.0\.10|192\.168\.0\.11'
            authc:
              # Basic authentication for internal users
              basic_internal_auth_domain:
                description: "Authenticate via HTTP Basic against internal users database"
                http_enabled: true
                transport_enabled: true
                order: 0
                http_authenticator:
                  type: basic
                  challenge: false
                authentication_backend:
                  type: internal
              
              # OpenID Connect authentication
              openid_auth_domain:
                http_enabled: true
                transport_enabled: true
                order: 1
                http_authenticator:
                  type: openid
                  challenge: false
                  config:
                    openid_connect_url: https://oxdr-sso.invinsense.io/realms/sahadev-oxdr/.well-known/openid-configuration
                    kibana_url: https://opensearch.invinsense.dev
                    roles_key: roles
                    subject_key: preferred_username
                    verify_hostnames: false
                authentication_backend:
                  type: noop

# System settings
terminationGracePeriod: 120
sysctlVmMaxMapCount: 262144

# Health checks
startupProbe:
  tcpSocket:
    port: 9200
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 30

readinessProbe:
  tcpSocket:
    port: 9200
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

# Pod management
updateStrategy: RollingUpdate
maxUnavailable: 1
podManagementPolicy: "Parallel"

# Anti-affinity configuration
antiAffinityTopologyKey: "kubernetes.io/hostname"
antiAffinity: "soft"

# Ingress configuration (optional)
ingress:
  enabled: false
  annotations: {}
  path: /
  hosts:
    - opensearch.example.com
  tls: []
```

## Deployment Steps

### 1. Add OpenSearch Helm Repository

```bash
# Add the OpenSearch Helm repository
helm repo add opensearch https://opensearch-project.github.io/helm-charts/
helm repo update
```

### 2. Create Namespace

```bash
kubectl create namespace opensearch
```

### 3. Deploy OpenSearch

```bash
# Deploy with custom values
helm install opensearch opensearch/opensearch \
  --namespace opensearch \
  --values values.yaml \
  --version 2.19.0
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n opensearch

# Check service endpoints
kubectl get svc -n opensearch

# View logs
kubectl logs -n opensearch -l app.kubernetes.io/instance=opensearch
```

## OpenID Connect Provider Configuration

### Keycloak Configuration

1. **Create a New Client**:
   ```json
   {
     "clientId": "siem",
     "name": "OpenSearch SIEM",
     "protocol": "openid-connect",
     "enabled": true,
     "publicClient": false,
     "standardFlowEnabled": true,
     "implicitFlowEnabled": false,
     "directAccessGrantsEnabled": false
   }
   ```

2. **Configure Redirect URIs**:
   - Valid Redirect URIs: `https://opensearch.invinsense.dev/*`
   - Base URL: `https://opensearch.invinsense.dev`
   - Web Origins: `https://opensearch.invinsense.dev`

3. **Configure Client Scopes**:
   - Ensure `openid`, `profile`, and `email` scopes are included
   - Add custom scope for roles mapping if needed

4. **Create Role Mappers**:
   ```json
   {
     "name": "roles",
     "protocol": "openid-connect",
     "protocolMapper": "oidc-usermodel-realm-role-mapper",
     "config": {
       "claim.name": "roles",
       "jsonType.label": "String",
       "multivalued": "true",
       "userinfo.token.claim": "true",
       "id.token.claim": "true",
       "access.token.claim": "true"
     }
   }
   ```

## Security Best Practices

### 1. Secure Secret Management

Store sensitive values in Kubernetes secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opensearch-secrets
  namespace: opensearch
type: Opaque
stringData:
  admin-password: "LhYSLF99y64QP0n"
  oidc-client-secret: "ctvfQCVuoyfu8M7JV9hqtLiiRnEfCOTn"
```

Reference in Helm values:

```yaml
extraEnvs:
  - name: OPENSEARCH_INITIAL_ADMIN_PASSWORD
    valueFrom:
      secretKeyRef:
        name: opensearch-secrets
        key: admin-password
```

### 2. Network Policies

Implement network isolation:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: opensearch-network-policy
  namespace: opensearch
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: opensearch
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: opensearch-dashboards
      ports:
        - protocol: TCP
          port: 9200
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443  # For OIDC provider
```

### 3. TLS Configuration

Enable end-to-end encryption:

```yaml
config:
  opensearch.yml: |
    plugins.security.ssl.transport.pemcert_filepath: node.pem
    plugins.security.ssl.transport.pemkey_filepath: node-key.pem
    plugins.security.ssl.transport.pemtrustedcas_filepath: root-ca.pem
    plugins.security.ssl.transport.enforce_hostname_verification: true
    
    plugins.security.ssl.http.enabled: true
    plugins.security.ssl.http.pemcert_filepath: node.pem
    plugins.security.ssl.http.pemkey_filepath: node-key.pem
    plugins.security.ssl.http.pemtrustedcas_filepath: root-ca.pem
```

### 4. Role-Based Access Control

Configure OpenSearch roles mapping:

```yaml
securityConfig:
  config:
    data:
      roles_mapping.yml: |
        all_access:
          reserved: false
          backend_roles:
            - "admin"
          users:
            - "admin"
        
        readall:
          reserved: false
          backend_roles:
            - "analyst"
            - "reader"
        
        kibana_user:
          reserved: false
          backend_roles:
            - "kibana_user"
            - "analyst"
```

## Monitoring and Troubleshooting

### 1. Health Checks

```bash
# Check cluster health
curl -k -u admin:$ADMIN_PASSWORD https://localhost:9200/_cluster/health?pretty

# Verify OIDC configuration
curl -k https://localhost:9200/_opendistro/_security/authinfo
```

### 2. Common Issues

**OIDC Connection Failures**:
- Verify network connectivity to OIDC provider
- Check certificate validation settings
- Validate client credentials

**Role Mapping Issues**:
- Ensure OIDC token contains expected claims
- Verify roles_key configuration matches token structure
- Check backend_roles mapping in OpenSearch

**Performance Optimization**:
- Adjust JVM heap size based on workload
- Configure appropriate resource limits
- Monitor disk I/O and adjust storage class

### 3. Debug Logging

Enable debug logging for security plugin:

```yaml
config:
  log4j2.properties: |
    logger.security.name = com.amazon.opendistroforelasticsearch.security
    logger.security.level = debug
```

## Production Considerations

### 1. High Availability

- Deploy across multiple availability zones
- Use pod topology spread constraints
- Configure appropriate replica counts

### 2. Backup and Recovery

```bash
# Create snapshot repository
curl -X PUT "https://localhost:9200/_snapshot/backup" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/mount/backups"
    }
  }'
```

### 3. Capacity Planning

- Monitor resource usage patterns
- Plan for data growth
- Configure index lifecycle policies

### 4. Security Hardening

- Regularly update OpenSearch and security plugin
- Implement audit logging
- Use dedicated service accounts
- Enable encryption at rest

## Integration with OpenSearch Dashboards

Configure OpenSearch Dashboards for OIDC:

```yaml
opensearchDashboards:
  config:
    opensearch_dashboards.yml: |
      opensearch_security.auth.type: "openid"
      opensearch_security.openid.connect_url: "https://oxdr-sso.invinsense.io/realms/sahadev-oxdr/.well-known/openid-configuration"
      opensearch_security.openid.client_id: "siem"
      opensearch_security.openid.client_secret: "ctvfQCVuoyfu8M7JV9hqtLiiRnEfCOTn"
      opensearch_security.openid.base_redirect_url: "https://opensearch-dashboards.invinsense.dev"
```

## Conclusion

Deploying OpenSearch with OpenID Connect SSO provides a secure, scalable solution for centralized authentication. This configuration enables seamless integration with enterprise identity providers while maintaining the flexibility and power of OpenSearch's security features.

Key benefits of this approach:
- **Centralized Authentication**: Single source of truth for user identities
- **Enhanced Security**: No local password management
- **Scalability**: Easy to add/remove users through IdP
- **Compliance**: Meets enterprise security requirements
- **User Experience**: Single sign-on across applications

Remember to regularly review and update your security configurations, monitor system performance, and maintain backups for disaster recovery scenarios.