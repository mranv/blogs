---
author: Anubhav Gain
pubDatetime: 2025-01-28T14:35:00Z
title: "Complete Guide: Setting Up and Publishing Helm Charts to ChartMuseum"
featured: false
draft: false
tags:
  - helm
  - kubernetes
  - chartmuseum
  - devops
  - ci-cd
description: Comprehensive guide covering ChartMuseum setup, Helm chart creation, packaging, signing, publishing, and CI/CD automation for managing private Helm chart repositories.
---

## Table of contents

## 1. Setting Up ChartMuseum

### Install ChartMuseum in Kubernetes

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

```bash
# Check ChartMuseum is running
kubectl get pods -l app.kubernetes.io/name=chartmuseum

# Test the endpoint
curl https://cm.yourdomain.com/health
```

## 2. Creating a Helm Chart

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

Edit `Chart.yaml` to set metadata:

```yaml
apiVersion: v2
name: mychart
description: My application chart
type: application
version: 0.1.0
appVersion: "1.0.0"
```

## 3. Packaging the Chart

```bash
# Package the chart
helm package ./mychart

# Sign the chart (optional)
# First, set up GPG keys if needed
gpg --full-generate-key

# Export keys to format Helm can use
gpg --export > ~/.gnupg/pubring.gpg
gpg --export-secret-keys > ~/.gnupg/secring.gpg

# Package with signing
helm package ./mychart --sign --key "Your Name <your.email@example.com>"

# Verify package
helm verify mychart-0.1.0.tgz
```

## 4. Pushing to ChartMuseum

### Method 1: Using the Helm CM-Push Plugin

```bash
# Install the ChartMuseum plugin
helm plugin install https://github.com/chartmuseum/helm-push

# Add your ChartMuseum repo
helm repo add myrepo https://cm.yourdomain.com

# Push the chart
helm cm-push mychart-0.1.0.tgz myrepo

# Push with force flag to overwrite
helm cm-push mychart-0.1.0.tgz myrepo --force
```

### Method 2: Using cURL

```bash
# Push chart using cURL
curl --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts

# If you've signed the chart, also push the .prov file
curl --data-binary "@mychart-0.1.0.tgz.prov" https://cm.yourdomain.com/api/prov

# If authentication is required
curl -u username:password --data-binary "@mychart-0.1.0.tgz" https://cm.yourdomain.com/api/charts
```

## 5. Managing Charts in ChartMuseum

```bash
# Update your local repo to see new charts
helm repo update

# Search for your chart
helm search repo myrepo/mychart

# View chart details
helm show chart myrepo/mychart

# List all versions
helm search repo myrepo/mychart --versions

# Delete a chart version
curl -X DELETE https://cm.yourdomain.com/api/charts/mychart/0.1.0
```

## 6. Automating with CI/CD

Create a GitHub workflow `.github/workflows/release.yml`:

```yaml
name: Release Charts

on:
  push:
    branches: [main]
    paths:
      - "charts/**"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Set up Helm
        uses: azure/setup-helm@v1

      - name: Add Helm Push Plugin
        run: helm plugin install https://github.com/chartmuseum/helm-push

      - name: Add ChartMuseum Repo
        run: helm repo add myrepo https://cm.yourdomain.com

      - name: Package and Push Charts
        run: |
          for chart in ./charts/*; do
            if [ -d "$chart" ]; then
              helm package "$chart"
              chart_file=$(basename "$chart")-$(grep '^version:' "$chart/Chart.yaml" | awk '{print $2}').tgz
              helm cm-push "$chart_file" myrepo --force
            fi
          done
```

## 7. Troubleshooting Common Issues

### API Disabled

If you get "not found" or 404 errors when pushing:

```bash
# Check if API is enabled
curl https://cm.yourdomain.com/api/charts

# Fix: Update ChartMuseum deployment
kubectl set env deployment/chartmuseum DISABLE_API=false
```

### Authentication Issues

If authentication is required:

```bash
# Set credentials in environment
export HELM_REPO_USERNAME=admin
export HELM_REPO_PASSWORD=password

# Then push
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
```

### Chart Already Exists

If you get an error about chart already existing:

```bash
# Use --force flag
helm cm-push mychart-0.1.0.tgz myrepo --force

# Or delete the old version first
curl -X DELETE https://cm.yourdomain.com/api/charts/mychart/0.1.0
```

## Example Usage

```bash
helm package ./charts/invinsense-xdr
helm cm-push invinsense-xdr-1.0.0.tgz invinsense
```

This comprehensive guide covers all aspects of setting up ChartMuseum and managing Helm charts, from basic installation to advanced CI/CD automation. ChartMuseum provides an excellent solution for hosting private Helm charts with a simple API for programmatic chart management.
