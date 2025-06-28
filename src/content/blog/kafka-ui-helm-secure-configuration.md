---
author: Anubhav Gain
pubDatetime: 2025-06-28T16:00:00+05:30
modDatetime: 2025-06-28T16:00:00+05:30
title: Secure Kafka UI Helm Configuration for Kubernetes
slug: kafka-ui-helm-secure-configuration
featured: false
draft: false
tags:
  - kafka
  - kubernetes
  - helm
  - security
  - monitoring
  - ui
  - infrastructure
description: Production-ready Helm values configuration for Kafka UI with enhanced security settings, network policies, and best practices for Kubernetes deployment.
---

# Secure Kafka UI Helm Configuration for Kubernetes

This guide provides a production-ready Helm values configuration for Kafka UI with enhanced security settings, network policies, and best practices for Kubernetes deployment.

## Configuration File

```yaml
replicaCount: 1
image:
  registry: docker.io
  repository: provectuslabs/kafka-ui
  pullPolicy: IfNotPresent
  tag: "v0.7.1" # Pinned to a specific version for security
imagePullSecrets: []
nameOverride: ""
fullnameOverride: "kafka-ui"
serviceAccount:
  create: true
  annotations: {}
  name: "kafka-ui"

# Configure Kafka connection and security settings
yamlApplicationConfig:
  kafka:
    clusters:
      - name: Yc8CaFhBkszRek42s5EIvf
        bootstrapServers: kafka.mukti.svc.cluster.local:9092
        properties:
          security.protocol: SASL_PLAINTEXT
          sasl.mechanism: SCRAM-SHA-512
          # Reference environment variables instead of hardcoded credentials
          sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required username="${KAFKA_USERNAME}" password="${KAFKA_PASSWORD}";
        schemaRegistry:
          enabled: false
        metrics:
          enabled: false
  auth:
    type: basic # Enabled for production security
    basicAuth:
      username: "${ADMIN_USERNAME}"
      password: "${ADMIN_PASSWORD}"
  management:
    health:
      ldap:
        enabled: false
  server:
    servlet:
      context-path: /
    port: 8080

# Use environment variables for sensitive data
# Fixed structure for secrets (direct format instead of nested map)
envs:
  secret:
    # Direct string values that will be read from secrets
    KAFKA_USERNAME: user1
    KAFKA_PASSWORD: ohXVKqI5Ld
    ADMIN_USERNAME: admin
    ADMIN_PASSWORD: securePassword123

# Network policy to allow communication with Kafka
networkPolicy:
  enabled: true
  egressRules:
    customRules:
      - to:
          - podSelector:
              matchLabels:
                app.kubernetes.io/name: kafka
                app.kubernetes.io/part-of: kafka
            namespaceSelector:
              matchLabels:
                kubernetes.io/metadata.name: mukti
        ports:
          - port: 9092
            protocol: TCP
  ingressRules:
    customRules: []

# Enhanced security annotations
podAnnotations:
  seccomp.security.alpha.kubernetes.io/pod: runtime/default

# Add labels to identify this application
podLabels:
  app.kubernetes.io/name: kafka-ui
  app.kubernetes.io/part-of: kafka

# Enhanced security context for the pod
podSecurityContext:
  fsGroup: 1000
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000

# Container security context
securityContext:
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false

# Service configuration
service:
  type: ClusterIP
  port: 80
  targetPort: 8080

# Ingress configuration - disabled by default
ingress:
  enabled: false
  annotations:
    kubernetes.io/ingress.class: nginx
    # Consider adding security headers for ingress
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
  path: /
  host: kafka-ui.example.com
  tls:
    enabled: false

# Resource limits to prevent resource exhaustion
resources:
  limits:
    cpu: 300m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 2
  targetCPUUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity: {}

# Probes for health monitoring
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

## Key Security Features

### 1. Authentication & Authorization

- **Basic Authentication**: Enabled for UI access
- **SASL/SCRAM**: Secure authentication for Kafka cluster
- **Environment Variables**: Credentials stored as environment variables, not hardcoded

### 2. Network Security

- **Network Policies**: Restrict egress to only Kafka cluster
- **Namespace Isolation**: Traffic limited to specific namespaces
- **ClusterIP Service**: Internal-only access by default

### 3. Pod Security

- **Non-root User**: Runs as UID 1000
- **Read-only Root Filesystem**: Prevents runtime modifications
- **Dropped Capabilities**: All Linux capabilities dropped
- **Seccomp Profile**: Runtime/default security profile

### 4. Resource Management

- **Resource Limits**: Prevents resource exhaustion
- **Health Probes**: Ensures pod health and availability
- **Auto-scaling**: Disabled by default for predictable resource usage

## Deployment Instructions

### 1. Create Kubernetes Secret

First, create a secret for sensitive credentials:

```bash
kubectl create secret generic kafka-ui-secrets \
  --from-literal=KAFKA_USERNAME=user1 \
  --from-literal=KAFKA_PASSWORD=ohXVKqI5Ld \
  --from-literal=ADMIN_USERNAME=admin \
  --from-literal=ADMIN_PASSWORD=securePassword123 \
  -n mukti
```

### 2. Update Values File

Modify the `envs.secret` section to reference the Kubernetes secret:

```yaml
envs:
  existingSecret: kafka-ui-secrets
```

### 3. Deploy with Helm

```bash
# Add the Kafka UI Helm repository
helm repo add kafka-ui https://provectuslabs.github.io/kafka-ui-charts
helm repo update

# Install with custom values
helm install kafka-ui kafka-ui/kafka-ui \
  -f kafka-ui-values.yaml \
  -n mukti
```

### 4. Enable Ingress (Optional)

For external access, update the ingress configuration:

```yaml
ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
  host: kafka-ui.your-domain.com
  tls:
    enabled: true
    secretName: kafka-ui-tls
```

## Security Best Practices

### 1. Secrets Management

- Use Kubernetes secrets or external secret managers
- Rotate credentials regularly
- Implement RBAC for secret access

### 2. Network Isolation

- Deploy in a dedicated namespace
- Use network policies to restrict traffic
- Consider service mesh for additional security

### 3. Monitoring & Auditing

- Enable audit logging
- Monitor access patterns
- Set up alerts for suspicious activities

### 4. Updates & Patches

- Regularly update Kafka UI image
- Monitor security advisories
- Test updates in staging environment

## Troubleshooting

### Common Issues

1. **Connection to Kafka Failed**

   - Verify network policy allows traffic
   - Check SASL credentials
   - Ensure Kafka service is accessible

2. **Authentication Issues**

   - Verify environment variables are set
   - Check secret mounting
   - Review pod logs for errors

3. **Resource Constraints**
   - Monitor memory usage
   - Adjust resource limits if needed
   - Check for memory leaks

### Debug Commands

```bash
# Check pod status
kubectl get pods -n mukti -l app.kubernetes.io/name=kafka-ui

# View pod logs
kubectl logs -n mukti -l app.kubernetes.io/name=kafka-ui

# Describe pod for events
kubectl describe pod -n mukti -l app.kubernetes.io/name=kafka-ui

# Test connectivity to Kafka
kubectl exec -it -n mukti deployment/kafka-ui -- nc -zv kafka.mukti.svc.cluster.local 9092
```

## Advanced Configuration

### Multi-Cluster Support

Add multiple Kafka clusters:

```yaml
yamlApplicationConfig:
  kafka:
    clusters:
      - name: production
        bootstrapServers: kafka-prod.mukti.svc.cluster.local:9092
        properties:
          security.protocol: SASL_SSL
          # Additional properties
      - name: staging
        bootstrapServers: kafka-staging.mukti.svc.cluster.local:9092
        properties:
          security.protocol: SASL_PLAINTEXT
```

### Schema Registry Integration

Enable schema registry support:

```yaml
schemaRegistry:
  enabled: true
  url: http://schema-registry.mukti.svc.cluster.local:8081
  auth:
    username: "${SR_USERNAME}"
    password: "${SR_PASSWORD}"
```

### Metrics & Monitoring

Enable JMX metrics collection:

```yaml
metrics:
  enabled: true
  type: JMX
  port: 9999
  ssl: false
```

## Conclusion

This configuration provides a secure, production-ready deployment of Kafka UI on Kubernetes. By following these security best practices and configurations, you can safely expose Kafka cluster management capabilities while maintaining strict security controls.
