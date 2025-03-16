---
author: Anubhav Gain
pubDatetime: 2024-04-24T10:00:00Z
modDatetime: 2024-04-24T10:00:00Z
title: Wazuh Admin API Authentication Guide
slug: wazuh-admin-api-authentication
featured: true
draft: false
tags:
  - security
  - wazuh
  - api
  - authentication
  - devops
description: A comprehensive guide for authenticating with the Wazuh API and creating admin users with elevated privileges for effective security management.
---

# Wazuh Admin API Authentication Guide

Security management is a critical aspect of any infrastructure, and Wazuh provides powerful tools for monitoring and securing your environment. This guide explains how to authenticate with the Wazuh API and create an admin user with elevated privileges.

## Overview

Wazuh's API enables administrators to interact with and manage the Wazuh server programmatically. Proper authentication is essential to ensure that only authorized users can access these powerful controls.

## Base URL

```
https://34.93.219.205:55000
```

## Authentication Process

### 1. Authenticate with Existing Credentials

Obtain an authentication token using existing credentials:

```bash
curl -k -u "wazuh-wui:MyS3cr37P450r.*-" -X POST "https://34.93.219.205:55000/security/user/authenticate" \
-H "Content-Type: application/json"
```

### 2. Store the Authentication Token

Save the returned token for subsequent API calls:

```bash
TOKEN="eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3..."
```

## User Management

### Create a New Admin User

```bash
curl -k -X POST "https://34.93.219.205:55000/security/users" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-d '{
  "username": "ultraadmin",
  "password": "YourSecurePassword"
}'
```

### Assign Administrator Role

```bash
curl -k -X POST "https://34.93.219.205:55000/security/users/100/roles?role_ids=1" \
-H "Authorization: Bearer $TOKEN"
```

> **Note**: Replace `100` with the actual user ID returned from the user creation response.

### Enable Run As Permission

```bash
curl -k -X PUT "https://34.93.219.205:55000/security/users/100/run_as?allow_run_as=true" \
-H "Authorization: Bearer $TOKEN"
```

### List All Users

```bash
curl -k -X GET "https://34.93.219.205:55000/security/users?pretty=true" \
-H "Authorization: Bearer $TOKEN"
```

## Using the New Admin User

### Authenticate as the New Admin

```bash
curl -k -u "ultraadmin:YourSecurePassword" -X POST "https://34.93.219.205:55000/security/user/authenticate" \
-H "Content-Type: application/json"
```

### Make API Calls with the New Token

```bash
NEW_TOKEN="eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3..."

curl -k -X GET "https://34.93.219.205:55000/agents?pretty=true" \
-H "Authorization: Bearer $NEW_TOKEN"
```

## Security Best Practices

When managing Wazuh API authentication, consider the following best practices:

1. **Always use secure passwords**: Implement strong password policies
2. **Rotate tokens regularly**: Set up a schedule for token rotation
3. **Use HTTPS with valid certificates in production**: Avoid using `-k` flag in production
4. **Limit the number of admin users**: Follow the principle of least privilege
5. **Implement proper access controls**: Create specific roles for different tasks
6. **Monitor admin user activity in Wazuh logs**: Set up alerts for suspicious admin actions

## Token Expiration

Tokens typically expire after a certain period. Always check for 401 errors and re-authenticate when needed. You can implement a token refresh mechanism in your scripts to handle this automatically.

## Conclusion

Properly managing authentication for your Wazuh API ensures that your security monitoring system remains secure. By creating dedicated admin users and following best practices, you can maintain the integrity of your security operations while enabling the full power of Wazuh's API capabilities.

For more information on Wazuh API and security best practices, visit the [official Wazuh documentation](https://documentation.wazuh.com/current/user-manual/api/index.html).
