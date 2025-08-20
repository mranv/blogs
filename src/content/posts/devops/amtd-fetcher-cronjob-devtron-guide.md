---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:15:00+05:30
modDatetime: 2025-01-28T14:15:00+05:30
title: Running AMTD Fetcher as a Kubernetes CronJob with Devtron
slug: amtd-fetcher-cronjob-devtron-guide
featured: false
draft: false
tags:
  - kubernetes
  - devtron
  - cronjob
  - amtd
  - morphisec
  - nats
  - gitops
  - devops
  - security
  - data-fetcher
category: Kubernetes
description: Complete guide to deploying an AMTD (Advanced Moving Target Defense) data fetcher as a scheduled Kubernetes CronJob using Devtron's GitOps platform, including NATS integration and persistent storage configuration
---

# Running AMTD Fetcher as a Kubernetes CronJob with Devtron

This guide demonstrates how to deploy an AMTD (Advanced Moving Target Defense) data fetcher as a scheduled CronJob in Kubernetes using Devtron's GitOps-based deployment platform. The solution fetches security data from Morphisec's API every 15 minutes and streams it to NATS for real-time processing.

## Architecture Overview

The AMTD fetcher solution consists of:

- **Python Script**: `fetch-amtd-data.py` that polls the Morphisec API
- **NATS Integration**: Streams data to NATS subjects for real-time processing
- **Kubernetes CronJob**: Runs the fetcher every 15 minutes
- **Persistent Storage**: Stores NDJSON files and health check data
- **Secret Management**: Secure storage of NATS credentials

## Prerequisites

- Kubernetes cluster with Devtron installed
- NATS account with valid credentials (JWT + NKEY)
- Morphisec API credentials (Client ID and Secret Key)
- Docker registry for container images
- Git repository connected to Devtron

## Step 1: Prepare Your Kubernetes Manifests

### 1.1 Create Secret for NATS Credentials

Store your NATS credentials securely in a Kubernetes Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: amtd-nats-creds
type: Opaque
stringData:
  nats.creds: |-
    -----BEGIN NATS USER JWT-----
    eyJ0eXAiOiJKV1QiLCJhbGciOiJlZDI1NTE5LW5rZXkifQ...
    -----END NATS USER JWT-----
    -----BEGIN USER NKEY SEED-----
    SUACSSL3UAHUDXKFSNVUZRF5UHPMSGZ6H...
    -----END USER NKEY SEED-----
```

This secret will be mounted at `/app/nats-credentials/nats.creds` in your container.

### 1.2 Create PersistentVolumeClaim for Data Storage

Define a PVC to store NDJSON output and health check files:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: amtd-data-pvc
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
```

### 1.3 Define the CronJob

Create the main CronJob manifest that schedules your fetcher:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: amtd-fetcher
spec:
  schedule: "*/15 * * * *" # Run every 15 minutes
  concurrencyPolicy: Allow # Allow overlapping runs
  successfulJobsHistoryLimit: 3 # Keep last 3 successful runs
  failedJobsHistoryLimit: 1 # Keep last failed run
  startingDeadlineSeconds: 100 # Skip if missed by >100s
  suspend: false # Ensure it's active
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure # Retry on container crash
          containers:
            - name: fetcher
              image: your-registry/amtd-fetcher:latest
              command: ["python3", "fetch-amtd-data.py"]
              env:
                # Morphisec API Configuration
                - name: API_URL
                  value: "https://ap-1.morphisec.cloud/api/v1/authenticate"
                - name: BASE_URL
                  value: "https://ap-1.morphisec.cloud/api/v1"
                - name: CLIENT_ID
                  value: "7c68f48e-d10c-4111-818f-8f20513b02a3"
                - name: SECRET_KEY
                  value: "9b230bf1-2926-4972-887c-c05fdc49599f"

                # Data Output Configuration
                - name: ENABLE_NATS
                  value: "true"
                - name: ENABLE_OPENSEARCH
                  value: "false"
                - name: ENABLE_FILE_STORAGE
                  value: "false"

                # NATS Configuration
                - name: NATS_SERVERS
                  value: "tls://connect.ngs.global:4222"
                - name: NATS_SUBJECT_PREFIX
                  value: "amtd"
                - name: NATS_CREDS_PATH
                  value: "/app/nats-credentials/nats.creds"

                # OpenSearch Configuration (disabled)
                - name: OPENSEARCH_HOST
                  value: ""
                - name: OPENSEARCH_PORT
                  value: "9200"
                - name: OPENSEARCH_USER
                  value: ""
                - name: OPENSEARCH_PASSWORD
                  value: ""

                # AWS Configuration (for future use)
                - name: AWS_REGION
                  value: ""
                - name: AWS_ACCESS_KEY_ID
                  value: ""
                - name: AWS_SECRET_ACCESS_KEY
                  value: ""

                # Timing Configuration
                - name: REQUEST_TIMEOUT
                  value: "3600" # 1 hour timeout
                - name: REFRESH_INTERVAL
                  value: "900" # 15 minute refresh

              volumeMounts:
                - name: nats-creds
                  mountPath: /app/nats-credentials/nats.creds
                  subPath: nats.creds
                  readOnly: true
                - name: data-dir
                  mountPath: /app/data

          volumes:
            - name: nats-creds
              secret:
                secretName: amtd-nats-creds
                items:
                  - key: nats.creds
                    path: nats.creds
            - name: data-dir
              persistentVolumeClaim:
                claimName: amtd-data-pvc
```

## Step 2: Configure in Devtron

### 2.1 Push Manifests to Git

Combine all three manifests into a single YAML file and commit to your Git repository:

```bash
# Create the manifest file
cat > k8s/cronjob-amtd-fetcher.yaml << 'EOF'
# Secret, PVC, and CronJob manifests here...
EOF

# Commit and push
git add k8s/cronjob-amtd-fetcher.yaml
git commit -m "Add AMTD fetcher CronJob manifests"
git push origin main
```

### 2.2 Configure Devtron Application

1. **Navigate to Devtron UI**:
   - Go to Applications → Create New Application
   - Select your Git repository
   - Choose the appropriate environment

2. **Select Base Deployment Template**:
   - Go to App Configuration → Base Deployment Template
   - Select "Job and Cronjob" template
   - You'll see `cronjobConfigs` and `jobConfigs` sections

3. **Configure CronJob Settings**:
   - Set `Kind` to `CronJob`
   - Reference your manifest under `cronjobConfigs`
   - Configure any additional overrides

### 2.3 Deploy the Application

1. Save your configuration
2. Click "Deploy" to create the resources
3. Navigate to Workloads → CronJobs to verify deployment

## Step 3: Alternative Deployment with Helm

If you prefer a Helm-based approach, use Devtron's generic Helm chart:

### 3.1 Select Generic Helm Chart

1. In Devtron's Chart Store, select `devtron-charts/devtron-generic-helm`
2. Configure the chart values

### 3.2 Configure values.yaml

```yaml
cronjob:
  enabled: true
  spec:
    schedule: "*/15 * * * *"
    jobTemplate:
      spec:
        template:
          spec:
            containers:
              - name: fetcher
                image: your-registry/amtd-fetcher:latest
                # ... rest of the configuration
```

### 3.3 Deploy via Helm

Devtron will render and apply your CronJob using the Helm chart.

## Monitoring and Troubleshooting

### Check CronJob Status

```bash
# View CronJob details
kubectl get cronjob amtd-fetcher -n your-namespace

# Check recent job executions
kubectl get jobs -n your-namespace | grep amtd-fetcher

# View pod logs from the last run
kubectl logs -n your-namespace -l job-name=amtd-fetcher-xxxxx
```

### Common Issues and Solutions

1. **NATS Connection Failures**:
   - Verify NATS credentials are correctly formatted
   - Check network connectivity to NATS server
   - Ensure TLS is properly configured

2. **API Authentication Errors**:
   - Verify Morphisec API credentials
   - Check API endpoint URLs
   - Ensure network access to Morphisec cloud

3. **Storage Issues**:
   - Verify PVC is bound and accessible
   - Check disk space availability
   - Ensure proper write permissions

### Health Monitoring

The fetcher writes health check files to `/app/data/health/`:

- `last_run.json`: Timestamp and status of last execution
- `metrics.json`: Performance metrics and counters

## Security Best Practices

1. **Credential Management**:
   - Never hardcode sensitive credentials
   - Use Kubernetes Secrets for all sensitive data
   - Rotate credentials regularly

2. **Network Security**:
   - Use TLS for all external connections
   - Implement network policies if needed
   - Monitor outbound connections

3. **Resource Limits**:
   - Set appropriate CPU and memory limits
   - Configure resource requests for scheduling
   - Monitor resource usage patterns

4. **Access Control**:
   - Use RBAC for CronJob management
   - Limit who can view/edit secrets
   - Audit configuration changes

## Advanced Configuration

### Custom Fetch Intervals

Modify the schedule using standard cron syntax:

- Every hour: `"0 * * * *"`
- Every 30 minutes: `"*/30 * * * *"`
- Daily at 2 AM: `"0 2 * * *"`

### Multi-Environment Deployment

Use Devtron's environment overrides to deploy to multiple environments with different configurations:

```yaml
# dev-overrides.yaml
env:
  - name: NATS_SUBJECT_PREFIX
    value: "amtd.dev"

# prod-overrides.yaml
env:
  - name: NATS_SUBJECT_PREFIX
    value: "amtd.prod"
```

### Scaling Considerations

For high-volume deployments:

1. Use separate CronJobs for different data types
2. Implement parallel processing within the fetcher
3. Consider using Kubernetes Jobs with parallelism
4. Monitor and adjust based on API rate limits

## Conclusion

Deploying the AMTD fetcher as a Kubernetes CronJob with Devtron provides a robust, GitOps-driven solution for scheduled security data collection. The combination of Kubernetes native scheduling, Devtron's deployment management, and NATS streaming creates a scalable and maintainable architecture for security data pipelines.

Key benefits of this approach:

- **Automated Scheduling**: Reliable execution every 15 minutes
- **GitOps Workflow**: Version-controlled configuration
- **Secure Credential Management**: Kubernetes Secrets integration
- **Scalable Architecture**: Easy to extend and modify
- **Monitoring Integration**: Native Kubernetes observability

This solution seamlessly integrates with your existing security infrastructure while leveraging modern DevOps practices for deployment and management.
