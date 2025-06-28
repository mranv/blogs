---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:45:00+05:30
modDatetime: 2025-01-28T14:45:00+05:30
title: Complete Guide - Setting Up and Publishing Helm Charts to ChartMuseum
slug: helm-charts-chartmuseum-complete-guide
featured: false
draft: false
tags:
  - helm
  - kubernetes
  - chartmuseum
  - devops
  - package-management
  - ci-cd
  - container-orchestration
  - helm-charts
description: Comprehensive guide to setting up ChartMuseum, creating, packaging, signing, and publishing Helm charts with automation, security best practices, and troubleshooting tips
---

# Complete Guide: Setting Up and Publishing Helm Charts to ChartMuseum

ChartMuseum is an open-source Helm Chart Repository server that makes it easy to host and share Helm charts within your organization. This comprehensive guide covers everything from setting up ChartMuseum to automating chart publishing through CI/CD pipelines.

## Table of Contents

1. [Setting Up ChartMuseum](#1-setting-up-chartmuseum)
2. [Creating a Helm Chart](#2-creating-a-helm-chart)
3. [Packaging the Chart](#3-packaging-the-chart)
4. [Pushing to ChartMuseum](#4-pushing-to-chartmuseum)
5. [Managing Charts in ChartMuseum](#5-managing-charts-in-chartmuseum)
6. [Automating with CI/CD](#6-automating-with-cicd)
7. [Troubleshooting Common Issues](#7-troubleshooting-common-issues)

## 1. Setting Up ChartMuseum

### Install ChartMuseum in Kubernetes

First, add the ChartMuseum Helm repository and install it with the API enabled for chart uploads:

```bash
# Add ChartMuseum's Helm repo
helm repo add chartmuseum https://chartmuseum.github.io/charts

# Install ChartMuseum with API enabled for uploads
helm install chartmuseum chartmuseum/chartmuseum \
  --set env.open.DISABLE_API=false \
  --set service.type=ClusterIP \
  --set persistence.enabled=true \
  --set persistence.size=10Gi

# For external access, set up an Ingress
kubectl create ingress chartmuseum \
  --rule="cm.yourdomain.com/*=chartmuseum:8080"
```

### Verify Installation

Ensure ChartMuseum is running correctly:

```bash
# Check ChartMuseum is running
kubectl get pods -l app.kubernetes.io/name=chartmuseum

# Test the endpoint
curl https://cm.yourdomain.com/health
```

### Advanced Configuration Options

For production deployments, consider these additional settings:

```yaml
# values.yaml for production deployment
env:
  open:
    DISABLE_API: false
    AUTH_ANONYMOUS_GET: true  # Allow anonymous chart downloads
    BASIC_AUTH_USER: admin
    BASIC_AUTH_PASS: secretpassword
    DEPTH: 2  # Allow nested chart directories

persistence:
  enabled: true
  size: 50Gi
  storageClass: fast-ssd

ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
  hosts:
    - cm.yourdomain.com
  tls:
    - secretName: chartmuseum-tls
      hosts:
        - cm.yourdomain.com
```

## 2. Creating a Helm Chart

### Generate a New Chart

```bash
# Create a new chart
helm create mychart

# Structure
mychart/
  ├── .helmignore   # Files to ignore when packaging
  ├── Chart.yaml    # Chart metadata
  ├── values.yaml   # Default configuration values
  ├── charts/       # Dependencies
  └── templates/    # K8s resource templates
```

### Configure Chart Metadata

Edit `Chart.yaml` to set appropriate metadata:

```yaml
apiVersion: v2
name: mychart
description: My application chart
type: application
version: 0.1.0
appVersion: "1.0.0"
keywords:
  - app
  - microservice
home: https://github.com/yourorg/mychart
sources:
  - https://github.com/yourorg/mychart
maintainers:
  - name: Anubhav Gain
    email: anubhav@example.com
    url: https://github.com/anubhavg-icpl
icon: https://example.com/mychart-icon.png
annotations:
  category: Backend
```

### Best Practices for Chart Development

1. **Use Helper Templates**: Create `_helpers.tpl` for reusable template snippets
2. **Implement Health Checks**: Include readiness and liveness probes
3. **Resource Limits**: Set default CPU/memory limits in values.yaml
4. **Security Context**: Define security contexts for pods
5. **Documentation**: Include comprehensive README.md and NOTES.txt

## 3. Packaging the Chart

### Basic Packaging

```bash
# Package the chart
helm package ./mychart

# This creates: mychart-0.1.0.tgz
```

### Signed Charts for Enhanced Security

Setting up GPG signing for charts:

```bash
# First, set up GPG keys if needed
gpg --full-generate-key

# Choose:
# - RSA and RSA (default)
# - Key size: 4096
# - Validity: 2y
# - Real name: Your Name
# - Email: your.email@example.com

# Export keys to format Helm can use
gpg --export > ~/.gnupg/pubring.gpg
gpg --export-secret-keys > ~/.gnupg/secring.gpg

# Package with signing
helm package ./mychart --sign --key "Your Name <your.email@example.com>"

# This creates:
# - mychart-0.1.0.tgz
# - mychart-0.1.0.tgz.prov (provenance file)

# Verify package
helm verify mychart-0.1.0.tgz
```

### Advanced Packaging Options

```bash
# Package with custom destination
helm package ./mychart --destination ./dist

# Package with dependency update
helm dependency update ./mychart
helm package ./mychart

# Package with version override
helm package ./mychart --version 1.2.3

# Package with app version override
helm package ./mychart --app-version 2.0.0
```

## 4. Pushing to ChartMuseum

### Method 1: Using the Helm CM-Push Plugin

The most convenient method using the official plugin:

```bash
# Install the ChartMuseum plugin
helm plugin install https://github.com/chartmuseum/helm-push

# Add your ChartMuseum repo
helm repo add myrepo https://cm.yourdomain.com

# Push the chart
helm cm-push mychart-0.1.0.tgz myrepo

# Push with force flag to overwrite
helm cm-push mychart-0.1.0.tgz myrepo --force

# Push directly from chart directory
helm cm-push ./mychart myrepo
```

### Method 2: Using cURL

For environments where the plugin isn't available:

```bash
# Push chart using cURL
curl --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts

# If you've signed the chart, also push the .prov file
curl --data-binary "@mychart-0.1.0.tgz.prov" https://cm.yourdomain.com/api/prov

# If authentication is required
curl -u username:password --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts

# With Bearer token authentication
curl -H "Authorization: Bearer ${TOKEN}" --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts
```

### Method 3: Using CI/CD Integration

Example for pushing from CI/CD:

```bash
# Function to push chart with retry
push_chart() {
    local chart_file=$1
    local repo_url=$2
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempting to push $chart_file (attempt $attempt/$max_attempts)"
        
        if curl --fail --data-binary "@${chart_file}" "${repo_url}/api/charts"; then
            echo "Successfully pushed $chart_file"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 5
    done
    
    echo "Failed to push $chart_file after $max_attempts attempts"
    return 1
}

# Usage
push_chart "mychart-0.1.0.tgz" "https://cm.yourdomain.com"
```

## 5. Managing Charts in ChartMuseum

### Searching and Listing Charts

```bash
# Update your local repo to see new charts
helm repo update

# Search for your chart
helm search repo myrepo/mychart

# View chart details
helm show chart myrepo/mychart

# View chart values
helm show values myrepo/mychart

# List all versions
helm search repo myrepo/mychart --versions

# List all charts in repo
helm search repo myrepo/
```

### Chart Version Management

```bash
# Delete a specific chart version
curl -X DELETE https://cm.yourdomain.com/api/charts/mychart/0.1.0

# Delete all versions of a chart
curl -X DELETE https://cm.yourdomain.com/api/charts/mychart

# Get chart information via API
curl https://cm.yourdomain.com/api/charts/mychart

# Get specific version info
curl https://cm.yourdomain.com/api/charts/mychart/0.1.0
```

### Downloading Charts

```bash
# Download a chart
helm pull myrepo/mychart

# Download specific version
helm pull myrepo/mychart --version 0.1.0

# Download and untar
helm pull myrepo/mychart --untar

# Download to specific directory
helm pull myrepo/mychart --destination ./downloads
```

## 6. Automating with CI/CD

### GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release Charts

on:
  push:
    branches: [main]
    paths:
      - 'charts/**'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Configure Git
        run: |
          git config user.name "$GITHUB_ACTOR"
          git config user.email "$GITHUB_ACTOR@users.noreply.github.com"

      - name: Set up Helm
        uses: azure/setup-helm@v3
        with:
          version: v3.12.0

      - name: Add Helm Push Plugin
        run: helm plugin install https://github.com/chartmuseum/helm-push

      - name: Add ChartMuseum Repo
        run: |
          helm repo add myrepo https://cm.yourdomain.com \
            --username ${{ secrets.CHARTMUSEUM_USER }} \
            --password ${{ secrets.CHARTMUSEUM_PASS }}

      - name: Package and Push Charts
        run: |
          for chart in ./charts/*; do
            if [ -d "$chart" ]; then
              echo "Processing chart: $chart"
              
              # Update dependencies
              helm dependency update "$chart"
              
              # Package the chart
              helm package "$chart"
              
              # Get chart name and version
              chart_name=$(basename "$chart")
              chart_version=$(grep '^version:' "$chart/Chart.yaml" | awk '{print $2}')
              chart_file="${chart_name}-${chart_version}.tgz"
              
              # Push to ChartMuseum
              helm cm-push "$chart_file" myrepo --force
              
              # Clean up
              rm -f "$chart_file"
            fi
          done

      - name: Update Helm Repo Index
        run: helm repo update
```

### GitLab CI Pipeline

Create `.gitlab-ci.yml`:

```yaml
stages:
  - package
  - publish

variables:
  HELM_VERSION: "3.12.0"
  CHARTMUSEUM_URL: "https://cm.yourdomain.com"

package-charts:
  stage: package
  image: alpine/helm:${HELM_VERSION}
  script:
    - helm plugin install https://github.com/chartmuseum/helm-push
    - |
      for chart in ./charts/*; do
        if [ -d "$chart" ]; then
          helm dependency update "$chart"
          helm package "$chart" --destination ./dist
        fi
      done
  artifacts:
    paths:
      - dist/*.tgz
    expire_in: 1 hour

publish-charts:
  stage: publish
  image: alpine/helm:${HELM_VERSION}
  dependencies:
    - package-charts
  script:
    - helm plugin install https://github.com/chartmuseum/helm-push
    - helm repo add myrepo ${CHARTMUSEUM_URL} --username ${CHARTMUSEUM_USER} --password ${CHARTMUSEUM_PASS}
    - |
      for chart in ./dist/*.tgz; do
        helm cm-push "$chart" myrepo --force
      done
  only:
    - main
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        CHARTMUSEUM_URL = 'https://cm.yourdomain.com'
        CHARTMUSEUM_CREDS = credentials('chartmuseum-credentials')
    }
    
    stages {
        stage('Setup') {
            steps {
                sh '''
                    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
                    helm plugin install https://github.com/chartmuseum/helm-push
                '''
            }
        }
        
        stage('Package Charts') {
            steps {
                sh '''
                    for chart in ./charts/*; do
                        if [ -d "$chart" ]; then
                            helm dependency update "$chart"
                            helm package "$chart"
                        fi
                    done
                '''
            }
        }
        
        stage('Publish Charts') {
            steps {
                sh '''
                    helm repo add myrepo ${CHARTMUSEUM_URL} \
                        --username ${CHARTMUSEUM_CREDS_USR} \
                        --password ${CHARTMUSEUM_CREDS_PSW}
                    
                    for chart in *.tgz; do
                        helm cm-push "$chart" myrepo --force
                    done
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

## 7. Troubleshooting Common Issues

### API Disabled

If you get "not found" or 404 errors when pushing:

```bash
# Check if API is enabled
curl https://cm.yourdomain.com/api/charts

# Fix: Update ChartMuseum deployment
kubectl set env deployment/chartmuseum DISABLE_API=false

# Or edit the deployment
kubectl edit deployment chartmuseum
# Add under spec.template.spec.containers[0].env:
# - name: DISABLE_API
#   value: "false"
```

### Authentication Issues

If authentication is required:

```bash
# Set credentials in environment
export HELM_REPO_USERNAME=admin
export HELM_REPO_PASSWORD=password

# Then push
helm cm-push mychart-0.1.0.tgz myrepo

# Or use inline credentials
helm repo add myrepo https://cm.yourdomain.com --username admin --password password

# For bearer token auth
export HELM_REPO_ACCESS_TOKEN=your-token
helm cm-push mychart-0.1.0.tgz myrepo
```

### GPG Key Issues

If chart signing fails:

```bash
# Check available keys
gpg --list-secret-keys --keyid-format LONG

# Export keys in the format Helm expects
gpg --export > ~/.gnupg/pubring.gpg
gpg --export-secret-keys > ~/.gnupg/secring.gpg
chmod 600 ~/.gnupg/pubring.gpg ~/.gnupg/secring.gpg

# If using GPG 2.1+, you might need legacy format
gpg --export-secret-keys --armor > private.key
gpg --export --armor > public.key
```

### Chart Already Exists

If you get an error about chart already existing:

```bash
# Use --force flag
helm cm-push mychart-0.1.0.tgz myrepo --force

# Or delete the old version first
curl -X DELETE https://cm.yourdomain.com/api/charts/mychart/0.1.0

# Then push the new version
helm cm-push mychart-0.1.0.tgz myrepo
```

### Large Chart Files

For charts larger than default limits:

```bash
# Increase nginx ingress body size
kubectl annotate ingress chartmuseum nginx.ingress.kubernetes.io/proxy-body-size=100m

# For ChartMuseum itself, set MAX_UPLOAD_SIZE
kubectl set env deployment/chartmuseum MAX_UPLOAD_SIZE=104857600  # 100MB in bytes
```

### Debugging Push Failures

Enable verbose logging:

```bash
# For helm cm-push
helm cm-push mychart-0.1.0.tgz myrepo --debug

# For curl
curl -v --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts

# Check ChartMuseum logs
kubectl logs deployment/chartmuseum -f
```

## Best Practices and Security Considerations

### 1. Access Control

- Use authentication for push operations
- Allow anonymous read for internal users
- Implement RBAC for different teams
- Use separate repositories for dev/staging/prod

### 2. Chart Versioning

- Follow semantic versioning strictly
- Never reuse version numbers
- Document breaking changes
- Maintain compatibility where possible

### 3. Storage and Backup

- Enable persistent storage
- Regular backups of chart storage
- Consider object storage (S3, GCS) for large deployments
- Implement retention policies

### 4. Monitoring

- Monitor ChartMuseum health endpoints
- Track storage usage
- Alert on push failures
- Log all API access

### 5. Security Scanning

- Scan charts for vulnerabilities
- Validate chart templates
- Check for hardcoded secrets
- Implement admission webhooks for validation

## Real-World Example

Here's a practical example from the gist:

```bash
# Package the invinsense-xdr chart
helm package ./charts/invinsense-xdr

# Push to the invinsense repository
helm cm-push invinsense-xdr-1.0.0.tgz invinsense
```

This demonstrates a typical workflow for packaging and publishing a production chart.

## Conclusion

ChartMuseum provides a simple yet powerful solution for hosting Helm charts within your organization. By following this guide, you can set up a robust chart repository with proper security, automation, and management practices. The combination of ChartMuseum with CI/CD automation enables teams to efficiently manage their Kubernetes applications through Helm charts, promoting consistency and reliability across deployments.

Remember to regularly update ChartMuseum and review your security settings to maintain a secure and efficient chart repository infrastructure.