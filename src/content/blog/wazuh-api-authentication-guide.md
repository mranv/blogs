---
author: Anubhav Gain
pubDatetime: 2025-01-28T18:00:00Z
title: "Wazuh API Authentication: Complete Implementation Guide"
slug: wazuh-api-authentication-guide
featured: false
draft: false
tags:
  - wazuh
  - api
  - authentication
  - security
  - rbac
description: "A comprehensive guide to implementing secure authentication for Wazuh API, including token management, role-based access control, and practical examples."
---

## Table of Contents

## Introduction

Wazuh provides a powerful RESTful API for programmatic access to its security monitoring capabilities. This guide covers implementing secure authentication, managing API tokens, configuring role-based access control (RBAC), and provides practical examples for common use cases.

## Wazuh API Authentication Overview

Wazuh API supports multiple authentication methods:

1. **Basic Authentication** - Username and password
2. **JWT Tokens** - JSON Web Tokens for stateless authentication
3. **API Keys** - Long-lived authentication tokens
4. **Integration Authentication** - For external system integration

## Basic Authentication Implementation

### Python Client with Basic Auth

```python
#!/usr/bin/env python3
# wazuh_api_client.py - Wazuh API client with authentication

import requests
import json
import base64
from typing import Dict, Any, Optional, List
import urllib3
from datetime import datetime, timedelta
import logging

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class WazuhAPIClient:
    def __init__(self, base_url: str, username: str, password: str,
                 verify_ssl: bool = False, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.session = requests.Session()
        self.token: Optional[str] = None
        self.token_expires: Optional[datetime] = None

        # Setup logging
        self.logger = logging.getLogger(__name__)

        # Setup session defaults
        self.session.verify = verify_ssl
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'WazuhAPIClient/1.0'
        })

    def _get_basic_auth_header(self) -> str:
        """Generate basic authentication header"""
        credentials = f"{self.username}:{self.password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded_credentials}"

    def authenticate(self) -> bool:
        """Authenticate with Wazuh API and obtain JWT token"""
        auth_url = f"{self.base_url}/security/user/authenticate"

        headers = {
            'Authorization': self._get_basic_auth_header()
        }

        try:
            response = self.session.post(
                auth_url,
                headers=headers,
                timeout=self.timeout
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data['data']['token']

                # JWT tokens typically expire in 15 minutes
                self.token_expires = datetime.now() + timedelta(minutes=14)

                # Update session headers with token
                self.session.headers['Authorization'] = f"Bearer {self.token}"

                self.logger.info("Successfully authenticated with Wazuh API")
                return True
            else:
                self.logger.error(f"Authentication failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Authentication request failed: {e}")
            return False

    def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid token"""
        if not self.token or not self.token_expires:
            return self.authenticate()

        if datetime.now() >= self.token_expires:
            self.logger.info("Token expired, re-authenticating")
            return self.authenticate()

        return True

    def _make_request(self, method: str, endpoint: str,
                     params: Dict = None, data: Dict = None) -> Dict[str, Any]:
        """Make authenticated request to Wazuh API"""
        if not self._ensure_authenticated():
            raise Exception("Failed to authenticate")

        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                timeout=self.timeout
            )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                # Token might be invalid, try to re-authenticate
                self.token = None
                if self._ensure_authenticated():
                    # Retry the request with new token
                    response = self.session.request(
                        method=method,
                        url=url,
                        params=params,
                        json=data,
                        timeout=self.timeout
                    )
                    response.raise_for_status()
                    return response.json()

            self.logger.error(f"HTTP error: {e}")
            raise

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            raise

    def get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make GET request"""
        return self._make_request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """Make POST request"""
        return self._make_request('POST', endpoint, params=params, data=data)

    def put(self, endpoint: str, data: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """Make PUT request"""
        return self._make_request('PUT', endpoint, params=params, data=data)

    def delete(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make DELETE request"""
        return self._make_request('DELETE', endpoint, params=params)

    # Convenience methods for common operations
    def get_agents(self, **kwargs) -> List[Dict]:
        """Get list of agents"""
        response = self.get('/agents', params=kwargs)
        return response.get('data', {}).get('affected_items', [])

    def get_agent(self, agent_id: str) -> Dict:
        """Get specific agent information"""
        response = self.get(f'/agents/{agent_id}')
        affected_items = response.get('data', {}).get('affected_items', [])
        return affected_items[0] if affected_items else {}

    def get_rules(self, **kwargs) -> List[Dict]:
        """Get security rules"""
        response = self.get('/rules', params=kwargs)
        return response.get('data', {}).get('affected_items', [])

    def get_alerts(self, **kwargs) -> List[Dict]:
        """Get security alerts"""
        response = self.get('/security/events', params=kwargs)
        return response.get('data', {}).get('affected_items', [])

    def restart_agent(self, agent_id: str) -> bool:
        """Restart specific agent"""
        try:
            self.put(f'/agents/{agent_id}/restart')
            return True
        except Exception as e:
            self.logger.error(f"Failed to restart agent {agent_id}: {e}")
            return False

    def get_system_info(self) -> Dict:
        """Get system information"""
        response = self.get('/manager/status')
        return response.get('data', {})

    def close(self):
        """Close the session"""
        self.session.close()

# Usage example
def main():
    # Configure logging
    logging.basicConfig(level=logging.INFO)

    # Initialize client
    client = WazuhAPIClient(
        base_url="https://wazuh-manager:55000",
        username="wazuh",
        password="wazuh",
        verify_ssl=False
    )

    try:
        # Authenticate
        if not client.authenticate():
            print("Authentication failed")
            return

        # Get system information
        system_info = client.get_system_info()
        print(f"Wazuh Manager Status: {system_info}")

        # Get agents
        agents = client.get_agents()
        print(f"Found {len(agents)} agents")

        for agent in agents[:5]:  # Show first 5 agents
            print(f"Agent {agent['id']}: {agent['name']} - {agent['status']}")

        # Get recent alerts
        alerts = client.get_alerts(limit=10)
        print(f"\nRecent alerts: {len(alerts)}")

        for alert in alerts:
            print(f"Alert {alert.get('id', 'N/A')}: {alert.get('rule', {}).get('description', 'N/A')}")

    except Exception as e:
        print(f"Error: {e}")

    finally:
        client.close()

if __name__ == "__main__":
    main()
```

## JWT Token Management

### Advanced Token Management

```python
# advanced_token_manager.py - Advanced JWT token management

import jwt
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import hashlib
import secrets

class TokenManager:
    def __init__(self, secret_key: str = None, algorithm: str = 'HS256'):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.algorithm = algorithm
        self.active_tokens: Dict[str, Dict] = {}
        self.blacklisted_tokens: set = set()

    def generate_token(self, user_id: str, username: str, roles: list,
                      expires_minutes: int = 15, additional_claims: Dict = None) -> str:
        """Generate JWT token with user information"""
        now = datetime.utcnow()
        exp = now + timedelta(minutes=expires_minutes)

        payload = {
            'user_id': user_id,
            'username': username,
            'roles': roles,
            'iat': now,
            'exp': exp,
            'jti': secrets.token_urlsafe(16),  # JWT ID for tracking
            'iss': 'wazuh-api',  # Issuer
            'aud': 'wazuh-client'  # Audience
        }

        if additional_claims:
            payload.update(additional_claims)

        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

        # Store token metadata
        self.active_tokens[payload['jti']] = {
            'user_id': user_id,
            'username': username,
            'created_at': now,
            'expires_at': exp,
            'roles': roles
        }

        return token

    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token and return payload"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience='wazuh-client',
                issuer='wazuh-api'
            )

            # Check if token is blacklisted
            jti = payload.get('jti')
            if jti in self.blacklisted_tokens:
                return None

            # Check if token is in active tokens
            if jti not in self.active_tokens:
                return None

            return payload

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def refresh_token(self, token: str, expires_minutes: int = 15) -> Optional[str]:
        """Refresh an existing token"""
        payload = self.validate_token(token)
        if not payload:
            return None

        # Generate new token with same claims
        return self.generate_token(
            user_id=payload['user_id'],
            username=payload['username'],
            roles=payload['roles'],
            expires_minutes=expires_minutes
        )

    def revoke_token(self, token: str) -> bool:
        """Revoke a specific token"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_exp": False}  # Don't verify expiration for revocation
            )

            jti = payload.get('jti')
            if jti:
                self.blacklisted_tokens.add(jti)
                if jti in self.active_tokens:
                    del self.active_tokens[jti]
                return True

        except jwt.InvalidTokenError:
            pass

        return False

    def revoke_user_tokens(self, user_id: str) -> int:
        """Revoke all tokens for a specific user"""
        revoked_count = 0
        tokens_to_remove = []

        for jti, token_info in self.active_tokens.items():
            if token_info['user_id'] == user_id:
                self.blacklisted_tokens.add(jti)
                tokens_to_remove.append(jti)
                revoked_count += 1

        for jti in tokens_to_remove:
            del self.active_tokens[jti]

        return revoked_count

    def cleanup_expired_tokens(self) -> int:
        """Remove expired tokens from active tokens"""
        now = datetime.utcnow()
        expired_tokens = []

        for jti, token_info in self.active_tokens.items():
            if token_info['expires_at'] < now:
                expired_tokens.append(jti)

        for jti in expired_tokens:
            del self.active_tokens[jti]

        return len(expired_tokens)

    def get_active_sessions(self, user_id: str = None) -> List[Dict]:
        """Get active sessions for a user or all users"""
        sessions = []
        now = datetime.utcnow()

        for jti, token_info in self.active_tokens.items():
            if token_info['expires_at'] > now:  # Only active tokens
                if user_id is None or token_info['user_id'] == user_id:
                    sessions.append({
                        'jti': jti,
                        'user_id': token_info['user_id'],
                        'username': token_info['username'],
                        'created_at': token_info['created_at'].isoformat(),
                        'expires_at': token_info['expires_at'].isoformat(),
                        'roles': token_info['roles']
                    })

        return sessions

class APIKeyManager:
    def __init__(self):
        self.api_keys: Dict[str, Dict] = {}

    def generate_api_key(self, user_id: str, username: str, roles: list,
                        description: str = "", expires_days: int = 365) -> str:
        """Generate long-lived API key"""
        api_key = f"wazuh_api_{secrets.token_urlsafe(32)}"

        self.api_keys[api_key] = {
            'user_id': user_id,
            'username': username,
            'roles': roles,
            'description': description,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(days=expires_days),
            'last_used': None,
            'usage_count': 0,
            'active': True
        }

        return api_key

    def validate_api_key(self, api_key: str) -> Optional[Dict]:
        """Validate API key and update usage statistics"""
        if api_key not in self.api_keys:
            return None

        key_info = self.api_keys[api_key]

        if not key_info['active']:
            return None

        if datetime.utcnow() > key_info['expires_at']:
            return None

        # Update usage statistics
        key_info['last_used'] = datetime.utcnow()
        key_info['usage_count'] += 1

        return {
            'user_id': key_info['user_id'],
            'username': key_info['username'],
            'roles': key_info['roles']
        }

    def revoke_api_key(self, api_key: str) -> bool:
        """Revoke an API key"""
        if api_key in self.api_keys:
            self.api_keys[api_key]['active'] = False
            return True
        return False

    def list_api_keys(self, user_id: str = None) -> List[Dict]:
        """List API keys for a user or all users"""
        keys = []

        for api_key, key_info in self.api_keys.items():
            if user_id is None or key_info['user_id'] == user_id:
                keys.append({
                    'key': api_key[:16] + '...',  # Partial key for security
                    'user_id': key_info['user_id'],
                    'username': key_info['username'],
                    'description': key_info['description'],
                    'created_at': key_info['created_at'].isoformat(),
                    'expires_at': key_info['expires_at'].isoformat(),
                    'last_used': key_info['last_used'].isoformat() if key_info['last_used'] else None,
                    'usage_count': key_info['usage_count'],
                    'active': key_info['active']
                })

        return keys
```

## Role-Based Access Control (RBAC)

### RBAC Implementation

```python
# rbac_manager.py - Role-based access control for Wazuh API

from typing import Dict, List, Set, Optional
from enum import Enum
from dataclasses import dataclass, field
import re

class Permission(Enum):
    # Agent permissions
    AGENTS_READ = "agents:read"
    AGENTS_CREATE = "agents:create"
    AGENTS_UPDATE = "agents:update"
    AGENTS_DELETE = "agents:delete"
    AGENTS_RESTART = "agents:restart"

    # Rules permissions
    RULES_READ = "rules:read"
    RULES_CREATE = "rules:create"
    RULES_UPDATE = "rules:update"
    RULES_DELETE = "rules:delete"

    # Security events permissions
    EVENTS_READ = "events:read"
    EVENTS_CREATE = "events:create"
    EVENTS_DELETE = "events:delete"

    # System permissions
    SYSTEM_READ = "system:read"
    SYSTEM_UPDATE = "system:update"
    SYSTEM_RESTART = "system:restart"

    # User management permissions
    USERS_READ = "users:read"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"

    # Role management permissions
    ROLES_READ = "roles:read"
    ROLES_CREATE = "roles:create"
    ROLES_UPDATE = "roles:update"
    ROLES_DELETE = "roles:delete"

    # API key permissions
    API_KEYS_READ = "api_keys:read"
    API_KEYS_CREATE = "api_keys:create"
    API_KEYS_DELETE = "api_keys:delete"

@dataclass
class Role:
    name: str
    description: str
    permissions: Set[Permission] = field(default_factory=set)
    resource_filters: Dict[str, List[str]] = field(default_factory=dict)

    def add_permission(self, permission: Permission):
        self.permissions.add(permission)

    def remove_permission(self, permission: Permission):
        self.permissions.discard(permission)

    def has_permission(self, permission: Permission) -> bool:
        return permission in self.permissions

    def add_resource_filter(self, resource_type: str, resource_ids: List[str]):
        """Add resource-level filtering (e.g., specific agent IDs)"""
        if resource_type not in self.resource_filters:
            self.resource_filters[resource_type] = []
        self.resource_filters[resource_type].extend(resource_ids)

    def can_access_resource(self, resource_type: str, resource_id: str) -> bool:
        """Check if role can access specific resource"""
        if resource_type not in self.resource_filters:
            return True  # No restrictions

        allowed_resources = self.resource_filters[resource_type]
        return '*' in allowed_resources or resource_id in allowed_resources

@dataclass
class User:
    user_id: str
    username: str
    email: str
    roles: Set[str] = field(default_factory=set)
    active: bool = True

    def add_role(self, role_name: str):
        self.roles.add(role_name)

    def remove_role(self, role_name: str):
        self.roles.discard(role_name)

    def has_role(self, role_name: str) -> bool:
        return role_name in self.roles

class RBACManager:
    def __init__(self):
        self.roles: Dict[str, Role] = {}
        self.users: Dict[str, User] = {}
        self._create_default_roles()

    def _create_default_roles(self):
        """Create default system roles"""
        # Administrator role - full access
        admin_role = Role(
            name="administrator",
            description="Full system administrator access",
            permissions=set(Permission)
        )
        self.roles["administrator"] = admin_role

        # Read-only role
        readonly_role = Role(
            name="readonly",
            description="Read-only access to all resources",
            permissions={
                Permission.AGENTS_READ,
                Permission.RULES_READ,
                Permission.EVENTS_READ,
                Permission.SYSTEM_READ,
                Permission.USERS_READ,
                Permission.ROLES_READ,
                Permission.API_KEYS_READ
            }
        )
        self.roles["readonly"] = readonly_role

        # Agent manager role
        agent_manager_role = Role(
            name="agent_manager",
            description="Manage agents and view events",
            permissions={
                Permission.AGENTS_READ,
                Permission.AGENTS_CREATE,
                Permission.AGENTS_UPDATE,
                Permission.AGENTS_DELETE,
                Permission.AGENTS_RESTART,
                Permission.EVENTS_READ,
                Permission.RULES_READ
            }
        )
        self.roles["agent_manager"] = agent_manager_role

        # Security analyst role
        analyst_role = Role(
            name="security_analyst",
            description="Analyze security events and rules",
            permissions={
                Permission.AGENTS_READ,
                Permission.RULES_READ,
                Permission.RULES_CREATE,
                Permission.RULES_UPDATE,
                Permission.EVENTS_READ,
                Permission.EVENTS_CREATE
            }
        )
        self.roles["security_analyst"] = analyst_role

    def create_role(self, name: str, description: str,
                   permissions: List[Permission] = None) -> Role:
        """Create a new role"""
        role = Role(name=name, description=description)
        if permissions:
            role.permissions.update(permissions)

        self.roles[name] = role
        return role

    def get_role(self, name: str) -> Optional[Role]:
        """Get role by name"""
        return self.roles.get(name)

    def delete_role(self, name: str) -> bool:
        """Delete a role"""
        if name in self.roles:
            # Remove role from all users
            for user in self.users.values():
                user.remove_role(name)

            del self.roles[name]
            return True
        return False

    def create_user(self, user_id: str, username: str, email: str,
                   roles: List[str] = None) -> User:
        """Create a new user"""
        user = User(user_id=user_id, username=username, email=email)
        if roles:
            for role_name in roles:
                if role_name in self.roles:
                    user.add_role(role_name)

        self.users[user_id] = user
        return user

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)

    def get_user_permissions(self, user_id: str) -> Set[Permission]:
        """Get all permissions for a user"""
        user = self.get_user(user_id)
        if not user or not user.active:
            return set()

        permissions = set()
        for role_name in user.roles:
            role = self.get_role(role_name)
            if role:
                permissions.update(role.permissions)

        return permissions

    def user_has_permission(self, user_id: str, permission: Permission) -> bool:
        """Check if user has specific permission"""
        permissions = self.get_user_permissions(user_id)
        return permission in permissions

    def user_can_access_resource(self, user_id: str, resource_type: str,
                               resource_id: str) -> bool:
        """Check if user can access specific resource"""
        user = self.get_user(user_id)
        if not user or not user.active:
            return False

        for role_name in user.roles:
            role = self.get_role(role_name)
            if role and role.can_access_resource(resource_type, resource_id):
                return True

        return False

    def check_endpoint_access(self, user_id: str, method: str,
                            endpoint: str, resource_id: str = None) -> bool:
        """Check if user can access specific API endpoint"""
        user = self.get_user(user_id)
        if not user or not user.active:
            return False

        # Map endpoints to required permissions
        endpoint_permissions = {
            # Agent endpoints
            r'^/agents$': {
                'GET': Permission.AGENTS_READ,
                'POST': Permission.AGENTS_CREATE
            },
            r'^/agents/\d+$': {
                'GET': Permission.AGENTS_READ,
                'PUT': Permission.AGENTS_UPDATE,
                'DELETE': Permission.AGENTS_DELETE
            },
            r'^/agents/\d+/restart$': {
                'PUT': Permission.AGENTS_RESTART
            },

            # Rules endpoints
            r'^/rules$': {
                'GET': Permission.RULES_READ,
                'POST': Permission.RULES_CREATE
            },
            r'^/rules/\d+$': {
                'GET': Permission.RULES_READ,
                'PUT': Permission.RULES_UPDATE,
                'DELETE': Permission.RULES_DELETE
            },

            # Events endpoints
            r'^/security/events$': {
                'GET': Permission.EVENTS_READ,
                'POST': Permission.EVENTS_CREATE
            },

            # System endpoints
            r'^/manager/status$': {
                'GET': Permission.SYSTEM_READ
            },
            r'^/manager/restart$': {
                'PUT': Permission.SYSTEM_RESTART
            },

            # User management endpoints
            r'^/security/users$': {
                'GET': Permission.USERS_READ,
                'POST': Permission.USERS_CREATE
            },
            r'^/security/users/\d+$': {
                'GET': Permission.USERS_READ,
                'PUT': Permission.USERS_UPDATE,
                'DELETE': Permission.USERS_DELETE
            }
        }

        # Find matching endpoint pattern
        required_permission = None
        for pattern, methods in endpoint_permissions.items():
            if re.match(pattern, endpoint):
                required_permission = methods.get(method.upper())
                break

        if not required_permission:
            return False  # Endpoint not found or method not allowed

        # Check if user has required permission
        if not self.user_has_permission(user_id, required_permission):
            return False

        # Check resource-level access if resource_id is provided
        if resource_id:
            resource_type = self._extract_resource_type(endpoint)
            if resource_type and not self.user_can_access_resource(
                user_id, resource_type, resource_id
            ):
                return False

        return True

    def _extract_resource_type(self, endpoint: str) -> Optional[str]:
        """Extract resource type from endpoint"""
        if '/agents' in endpoint:
            return 'agents'
        elif '/rules' in endpoint:
            return 'rules'
        elif '/events' in endpoint:
            return 'events'
        elif '/users' in endpoint:
            return 'users'

        return None

    def export_user_permissions(self, user_id: str) -> Dict:
        """Export user permissions for auditing"""
        user = self.get_user(user_id)
        if not user:
            return {}

        permissions = self.get_user_permissions(user_id)

        return {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'active': user.active,
            'roles': list(user.roles),
            'permissions': [p.value for p in permissions],
            'resource_filters': {
                role_name: self.get_role(role_name).resource_filters
                for role_name in user.roles
                if self.get_role(role_name)
            }
        }

# RBAC Decorator for API endpoints
class require_permission:
    def __init__(self, permission: Permission):
        self.permission = permission

    def __call__(self, func):
        def wrapper(*args, **kwargs):
            # Extract user_id from request context
            # This would typically come from the JWT token
            user_id = kwargs.get('user_id') or getattr(args[0], 'current_user_id', None)

            if not user_id:
                raise PermissionError("Authentication required")

            rbac_manager = kwargs.get('rbac_manager') or getattr(args[0], 'rbac_manager', None)
            if not rbac_manager:
                raise RuntimeError("RBAC manager not available")

            if not rbac_manager.user_has_permission(user_id, self.permission):
                raise PermissionError(f"Permission denied: {self.permission.value}")

            return func(*args, **kwargs)

        return wrapper

# Usage example
def example_rbac_usage():
    rbac = RBACManager()

    # Create users
    admin_user = rbac.create_user("1", "admin", "admin@example.com", ["administrator"])
    analyst_user = rbac.create_user("2", "analyst", "analyst@example.com", ["security_analyst"])
    readonly_user = rbac.create_user("3", "viewer", "viewer@example.com", ["readonly"])

    # Test permissions
    print(f"Admin can delete agents: {rbac.user_has_permission('1', Permission.AGENTS_DELETE)}")
    print(f"Analyst can delete agents: {rbac.user_has_permission('2', Permission.AGENTS_DELETE)}")
    print(f"Viewer can read agents: {rbac.user_has_permission('3', Permission.AGENTS_READ)}")

    # Test endpoint access
    print(f"Admin can POST /agents: {rbac.check_endpoint_access('1', 'POST', '/agents')}")
    print(f"Analyst can POST /agents: {rbac.check_endpoint_access('2', 'POST', '/agents')}")
    print(f"Viewer can GET /agents: {rbac.check_endpoint_access('3', 'GET', '/agents')}")

    # Export permissions for auditing
    admin_perms = rbac.export_user_permissions('1')
    print(f"\nAdmin permissions: {len(admin_perms['permissions'])} total")

if __name__ == "__main__":
    example_rbac_usage()
```

## API Authentication Middleware

### Flask/FastAPI Middleware Implementation

```python
# auth_middleware.py - Authentication middleware for Wazuh API

from functools import wraps
from flask import Flask, request, jsonify, g
from typing import Dict, Any, Optional, Callable
import logging

class WazuhAuthMiddleware:
    def __init__(self, app: Flask, token_manager, rbac_manager, api_key_manager):
        self.app = app
        self.token_manager = token_manager
        self.rbac_manager = rbac_manager
        self.api_key_manager = api_key_manager
        self.logger = logging.getLogger(__name__)

        # Register middleware
        app.before_request(self.authenticate_request)

    def authenticate_request(self):
        """Authenticate incoming requests"""
        # Skip authentication for certain endpoints
        if self._should_skip_auth():
            return

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return self._unauthorized("Authorization header required")

        # Extract token from header
        token = self._extract_token(auth_header)
        if not token:
            return self._unauthorized("Invalid authorization header")

        # Authenticate based on token type
        user_info = None

        if auth_header.startswith('Bearer '):
            # JWT Token authentication
            user_info = self._authenticate_jwt(token)
        elif auth_header.startswith('ApiKey '):
            # API Key authentication
            user_info = self._authenticate_api_key(token)
        elif auth_header.startswith('Basic '):
            # Basic authentication (for initial token acquisition)
            return  # Handle in specific endpoint
        else:
            return self._unauthorized("Unsupported authentication method")

        if not user_info:
            return self._unauthorized("Invalid or expired token")

        # Store user info in request context
        g.current_user = user_info

        # Check endpoint authorization
        if not self._authorize_request(user_info['user_id']):
            return self._forbidden("Insufficient permissions")

    def _should_skip_auth(self) -> bool:
        """Check if authentication should be skipped for this endpoint"""
        skip_endpoints = [
            '/security/user/authenticate',
            '/health',
            '/version'
        ]

        return request.endpoint in skip_endpoints or request.path in skip_endpoints

    def _extract_token(self, auth_header: str) -> Optional[str]:
        """Extract token from authorization header"""
        try:
            scheme, token = auth_header.split(' ', 1)
            return token
        except ValueError:
            return None

    def _authenticate_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        """Authenticate JWT token"""
        payload = self.token_manager.validate_token(token)
        if payload:
            return {
                'user_id': payload['user_id'],
                'username': payload['username'],
                'roles': payload['roles'],
                'auth_method': 'jwt'
            }
        return None

    def _authenticate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Authenticate API key"""
        key_info = self.api_key_manager.validate_api_key(api_key)
        if key_info:
            return {
                'user_id': key_info['user_id'],
                'username': key_info['username'],
                'roles': key_info['roles'],
                'auth_method': 'api_key'
            }
        return None

    def _authorize_request(self, user_id: str) -> bool:
        """Check if user is authorized for this endpoint"""
        method = request.method
        endpoint = request.path

        # Extract resource ID from path if present
        resource_id = self._extract_resource_id(endpoint)

        return self.rbac_manager.check_endpoint_access(
            user_id, method, endpoint, resource_id
        )

    def _extract_resource_id(self, endpoint: str) -> Optional[str]:
        """Extract resource ID from endpoint path"""
        import re

        # Match patterns like /agents/123, /users/456, etc.
        match = re.search(r'/(\w+)/(\d+)', endpoint)
        if match:
            return match.group(2)

        return None

    def _unauthorized(self, message: str):
        """Return unauthorized response"""
        self.logger.warning(f"Unauthorized access attempt: {message}")
        return jsonify({
            'error': 401,
            'message': message
        }), 401

    def _forbidden(self, message: str):
        """Return forbidden response"""
        self.logger.warning(f"Forbidden access attempt: {message}")
        return jsonify({
            'error': 403,
            'message': message
        }), 403

# Decorator for additional endpoint-specific authorization
def require_role(role_name: str):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 401, 'message': 'Authentication required'}), 401

            user_roles = g.current_user.get('roles', [])
            if role_name not in user_roles:
                return jsonify({
                    'error': 403,
                    'message': f'Role {role_name} required'
                }), 403

            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_permissions(*permissions):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 401, 'message': 'Authentication required'}), 401

            # This would need access to RBAC manager instance
            # Implementation depends on how you inject dependencies

            return func(*args, **kwargs)
        return wrapper
    return decorator

# Example Flask application
def create_wazuh_api_app():
    app = Flask(__name__)

    # Initialize managers (in real app, these would be properly configured)
    from your_auth_modules import TokenManager, RBACManager, APIKeyManager

    token_manager = TokenManager()
    rbac_manager = RBACManager()
    api_key_manager = APIKeyManager()

    # Initialize middleware
    auth_middleware = WazuhAuthMiddleware(
        app, token_manager, rbac_manager, api_key_manager
    )

    @app.route('/security/user/authenticate', methods=['POST'])
    def authenticate():
        # Handle basic authentication and return JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Basic '):
            return jsonify({'error': 400, 'message': 'Basic authentication required'}), 400

        # Decode basic auth credentials
        import base64
        try:
            credentials = base64.b64decode(auth_header[6:]).decode('utf-8')
            username, password = credentials.split(':', 1)
        except (ValueError, UnicodeDecodeError):
            return jsonify({'error': 400, 'message': 'Invalid credentials format'}), 400

        # Validate credentials (implement your own logic)
        user = validate_user_credentials(username, password)
        if not user:
            return jsonify({'error': 401, 'message': 'Invalid credentials'}), 401

        # Generate JWT token
        token = token_manager.generate_token(
            user_id=user['id'],
            username=user['username'],
            roles=user['roles']
        )

        return jsonify({
            'data': {
                'token': token,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'roles': user['roles']
                }
            }
        })

    @app.route('/agents', methods=['GET'])
    def get_agents():
        # This endpoint automatically requires authentication via middleware
        return jsonify({
            'data': {
                'affected_items': [
                    {'id': '001', 'name': 'agent1', 'status': 'active'},
                    {'id': '002', 'name': 'agent2', 'status': 'active'}
                ],
                'total_affected_items': 2
            }
        })

    @app.route('/agents', methods=['POST'])
    @require_role('administrator')
    def create_agent():
        # Only administrators can create agents
        return jsonify({
            'data': {
                'affected_items': [{'id': '003', 'name': 'new_agent'}],
                'total_affected_items': 1
            }
        })

    @app.route('/security/users/<user_id>/api-keys', methods=['POST'])
    @require_role('administrator')
    def create_api_key(user_id):
        data = request.get_json()

        # Generate API key
        api_key = api_key_manager.generate_api_key(
            user_id=user_id,
            username=data.get('username'),
            roles=data.get('roles', []),
            description=data.get('description', ''),
            expires_days=data.get('expires_days', 365)
        )

        return jsonify({
            'data': {
                'api_key': api_key,
                'message': 'API key created successfully'
            }
        })

    return app

def validate_user_credentials(username: str, password: str) -> Optional[Dict]:
    """Validate user credentials - implement your own logic"""
    # This is a placeholder - implement actual credential validation
    if username == "admin" and password == "admin":
        return {
            'id': '1',
            'username': 'admin',
            'roles': ['administrator']
        }
    return None

if __name__ == '__main__':
    app = create_wazuh_api_app()
    app.run(debug=True, host='0.0.0.0', port=55000)
```

## Security Best Practices

### Security Implementation Guidelines

```python
# security_utils.py - Security utilities and best practices

import hashlib
import secrets
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import re
import ipaddress

class SecurityConfig:
    # Token settings
    JWT_EXPIRY_MINUTES = 15
    REFRESH_TOKEN_EXPIRY_DAYS = 30
    API_KEY_EXPIRY_DAYS = 365

    # Rate limiting
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30

    # Password policy
    MIN_PASSWORD_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_NUMBERS = True
    REQUIRE_SPECIAL_CHARS = True

    # Session security
    MAX_CONCURRENT_SESSIONS = 5
    SESSION_TIMEOUT_MINUTES = 60

    # Network security
    ALLOWED_IP_RANGES = [
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16'
    ]

    # Audit settings
    LOG_ALL_REQUESTS = True
    LOG_SENSITIVE_DATA = False
    AUDIT_RETENTION_DAYS = 90

class PasswordValidator:
    @staticmethod
    def validate_password(password: str) -> Dict[str, bool]:
        """Validate password against security policy"""
        results = {
            'length': len(password) >= SecurityConfig.MIN_PASSWORD_LENGTH,
            'uppercase': bool(re.search(r'[A-Z]', password)) if SecurityConfig.REQUIRE_UPPERCASE else True,
            'lowercase': bool(re.search(r'[a-z]', password)) if SecurityConfig.REQUIRE_LOWERCASE else True,
            'numbers': bool(re.search(r'\d', password)) if SecurityConfig.REQUIRE_NUMBERS else True,
            'special_chars': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)) if SecurityConfig.REQUIRE_SPECIAL_CHARS else True,
            'common_patterns': not PasswordValidator._has_common_patterns(password)
        }

        results['valid'] = all(results.values())
        return results

    @staticmethod
    def _has_common_patterns(password: str) -> bool:
        """Check for common weak patterns"""
        common_patterns = [
            r'123456',
            r'password',
            r'admin',
            r'qwerty',
            r'(.)\1{3,}',  # Repeated characters
            r'(\d{4,})',   # Sequential numbers
        ]

        password_lower = password.lower()
        for pattern in common_patterns:
            if re.search(pattern, password_lower):
                return True

        return False

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using secure method"""
        import bcrypt
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password: str, hash: str) -> bool:
        """Verify password against hash"""
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), hash.encode('utf-8'))

class RateLimiter:
    def __init__(self):
        self.attempts: Dict[str, List[float]] = {}
        self.lockouts: Dict[str, float] = {}

    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is rate limited"""
        current_time = time.time()

        # Check if currently locked out
        if identifier in self.lockouts:
            lockout_end = self.lockouts[identifier] + (SecurityConfig.LOCKOUT_DURATION_MINUTES * 60)
            if current_time < lockout_end:
                return True
            else:
                # Lockout expired
                del self.lockouts[identifier]
                if identifier in self.attempts:
                    del self.attempts[identifier]

        # Check recent attempts
        if identifier in self.attempts:
            # Remove attempts older than 1 hour
            cutoff_time = current_time - 3600
            self.attempts[identifier] = [
                attempt_time for attempt_time in self.attempts[identifier]
                if attempt_time > cutoff_time
            ]

            # Check if too many attempts
            if len(self.attempts[identifier]) >= SecurityConfig.MAX_LOGIN_ATTEMPTS:
                self.lockouts[identifier] = current_time
                return True

        return False

    def record_attempt(self, identifier: str, success: bool = False):
        """Record login attempt"""
        current_time = time.time()

        if success:
            # Clear attempts on successful login
            if identifier in self.attempts:
                del self.attempts[identifier]
            if identifier in self.lockouts:
                del self.lockouts[identifier]
        else:
            # Record failed attempt
            if identifier not in self.attempts:
                self.attempts[identifier] = []
            self.attempts[identifier].append(current_time)

class NetworkSecurity:
    @staticmethod
    def is_ip_allowed(ip_address: str) -> bool:
        """Check if IP address is in allowed ranges"""
        try:
            ip = ipaddress.ip_address(ip_address)

            for allowed_range in SecurityConfig.ALLOWED_IP_RANGES:
                if ip in ipaddress.ip_network(allowed_range):
                    return True

            return False
        except ValueError:
            return False

    @staticmethod
    def get_client_ip(request) -> str:
        """Get real client IP from request headers"""
        # Check for forwarded headers
        forwarded_ips = request.headers.get('X-Forwarded-For')
        if forwarded_ips:
            # Take the first IP in the chain
            return forwarded_ips.split(',')[0].strip()

        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip

        return request.remote_addr

class AuditLogger:
    def __init__(self):
        self.audit_log: List[Dict] = []

    def log_authentication_event(self, user_id: str, username: str,
                                event_type: str, success: bool,
                                ip_address: str, user_agent: str = None,
                                additional_data: Dict = None):
        """Log authentication events"""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'username': username,
            'success': success,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'additional_data': additional_data or {}
        }

        self.audit_log.append(event)

        # In production, send to SIEM or log aggregation system
        self._send_to_siem(event)

    def log_api_access(self, user_id: str, method: str, endpoint: str,
                      status_code: int, ip_address: str,
                      response_time_ms: float = None):
        """Log API access events"""
        if not SecurityConfig.LOG_ALL_REQUESTS:
            return

        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'api_access',
            'user_id': user_id,
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'ip_address': ip_address,
            'response_time_ms': response_time_ms
        }

        self.audit_log.append(event)
        self._send_to_siem(event)

    def log_security_event(self, event_type: str, severity: str,
                          description: str, user_id: str = None,
                          ip_address: str = None, additional_data: Dict = None):
        """Log security events"""
        event = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'security_event',
            'security_event_type': event_type,
            'severity': severity,
            'description': description,
            'user_id': user_id,
            'ip_address': ip_address,
            'additional_data': additional_data or {}
        }

        self.audit_log.append(event)
        self._send_to_siem(event)

    def _send_to_siem(self, event: Dict):
        """Send event to SIEM system"""
        # Implement SIEM integration
        # This could be Wazuh itself, Splunk, ELK stack, etc.
        pass

    def get_security_events(self, start_time: datetime = None,
                           end_time: datetime = None,
                           event_type: str = None) -> List[Dict]:
        """Retrieve security events for analysis"""
        events = self.audit_log

        if start_time:
            events = [e for e in events if datetime.fromisoformat(e['timestamp']) >= start_time]

        if end_time:
            events = [e for e in events if datetime.fromisoformat(e['timestamp']) <= end_time]

        if event_type:
            events = [e for e in events if e.get('event_type') == event_type]

        return events

class SessionManager:
    def __init__(self):
        self.active_sessions: Dict[str, Dict] = {}

    def create_session(self, user_id: str, token_id: str, ip_address: str,
                      user_agent: str = None) -> str:
        """Create new session"""
        session_id = secrets.token_urlsafe(32)

        # Check for too many concurrent sessions
        user_sessions = [s for s in self.active_sessions.values()
                        if s['user_id'] == user_id]

        if len(user_sessions) >= SecurityConfig.MAX_CONCURRENT_SESSIONS:
            # Remove oldest session
            oldest_session = min(user_sessions, key=lambda s: s['created_at'])
            self.terminate_session(oldest_session['session_id'])

        session = {
            'session_id': session_id,
            'user_id': user_id,
            'token_id': token_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow(),
            'last_activity': datetime.utcnow(),
            'active': True
        }

        self.active_sessions[session_id] = session
        return session_id

    def update_session_activity(self, session_id: str) -> bool:
        """Update session last activity"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['last_activity'] = datetime.utcnow()
            return True
        return False

    def terminate_session(self, session_id: str) -> bool:
        """Terminate specific session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            return True
        return False

    def terminate_user_sessions(self, user_id: str) -> int:
        """Terminate all sessions for a user"""
        sessions_to_remove = [
            sid for sid, session in self.active_sessions.items()
            if session['user_id'] == user_id
        ]

        for session_id in sessions_to_remove:
            del self.active_sessions[session_id]

        return len(sessions_to_remove)

    def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions"""
        timeout = timedelta(minutes=SecurityConfig.SESSION_TIMEOUT_MINUTES)
        cutoff_time = datetime.utcnow() - timeout

        expired_sessions = [
            sid for sid, session in self.active_sessions.items()
            if session['last_activity'] < cutoff_time
        ]

        for session_id in expired_sessions:
            del self.active_sessions[session_id]

        return len(expired_sessions)

# Example usage
def example_security_implementation():
    # Password validation
    password_result = PasswordValidator.validate_password("WeakPass123!")
    print(f"Password validation: {password_result}")

    # Rate limiting
    rate_limiter = RateLimiter()
    user_ip = "192.168.1.100"

    for i in range(6):
        if rate_limiter.is_rate_limited(user_ip):
            print(f"Attempt {i+1}: Rate limited")
            break
        else:
            print(f"Attempt {i+1}: Allowed")
            rate_limiter.record_attempt(user_ip, success=False)

    # Network security
    allowed = NetworkSecurity.is_ip_allowed("192.168.1.100")
    print(f"IP 192.168.1.100 allowed: {allowed}")

    # Audit logging
    audit_logger = AuditLogger()
    audit_logger.log_authentication_event(
        user_id="1",
        username="admin",
        event_type="login",
        success=True,
        ip_address="192.168.1.100",
        user_agent="WazuhAPIClient/1.0"
    )

    print(f"Audit events: {len(audit_logger.audit_log)}")

if __name__ == "__main__":
    example_security_implementation()
```

## Conclusion

Implementing secure authentication for Wazuh API requires:

1. **Multiple Authentication Methods**: Support JWT tokens, API keys, and basic auth
2. **Strong RBAC**: Implement granular role-based access control
3. **Security Best Practices**: Rate limiting, password policies, audit logging
4. **Token Management**: Proper token lifecycle management and revocation
5. **Monitoring**: Comprehensive audit logging and security event tracking

Key security considerations:

- Always use HTTPS in production
- Implement proper token expiration and refresh mechanisms
- Use strong password policies and hashing
- Monitor and log all authentication events
- Implement rate limiting to prevent brute force attacks
- Regular security audits and token cleanup

This implementation provides a robust foundation for secure Wazuh API access while maintaining flexibility for different use cases and integration requirements.
