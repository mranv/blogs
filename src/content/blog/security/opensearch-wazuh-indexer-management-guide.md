---
author: Anubhav Gain
pubDatetime: 2024-04-24T18:30:00Z
modDatetime: 2024-04-24T18:30:00Z
title: OpenSearch/Wazuh Indexer Setup and Management Guide
slug: opensearch-wazuh-indexer-management
featured: true
draft: false
tags:
  - security
  - wazuh
  - opensearch
  - indexer
  - monitoring
  - devops
description: A comprehensive guide for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer, including installation, backup procedures, and health checks.
---

# OpenSearch/Wazuh Indexer Setup and Management Guide

This document provides instructions for setting up, configuring, and managing an OpenSearch cluster that serves as a Wazuh indexer. It covers installation, backup procedures, configuration paths, and basic health checks.

## System Overview

The setup consists of:

- OpenSearch 2.19.0 serving as a Wazuh indexer
- Single-node cluster configuration
- Security plugin enabled with admin authentication

## Directory Structure

The key directories and configuration files are:
