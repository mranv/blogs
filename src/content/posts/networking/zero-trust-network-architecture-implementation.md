---
author: Anubhav Gain
pubDatetime: 2025-01-10T16:00:00+05:30
modDatetime: 2025-01-10T16:00:00+05:30
title: Zero Trust Network Architecture - Complete Implementation Guide
slug: zero-trust-network-architecture-implementation
featured: true
draft: false
tags:
  - networking
  - security
  - zero-trust
  - ztna
  - architecture
category: Programming
description: Comprehensive guide to implementing Zero Trust Network Architecture with practical examples, code snippets, and real-world deployment strategies
---

# Zero Trust Network Architecture: Complete Implementation Guide

Zero Trust Network Architecture (ZTNA) represents a fundamental shift in how we approach network security. Unlike traditional perimeter-based security models, Zero Trust operates on the principle of "never trust, always verify." This comprehensive guide provides practical implementation strategies, code examples, and real-world deployment scenarios.

## Table of Contents

## Understanding Zero Trust Architecture

### Core Principles

Zero Trust architecture is built on three fundamental principles:

1. **Verify Explicitly**: Always authenticate and authorize based on all available data points
2. **Least Privilege Access**: Limit user access with Just-In-Time and Just-Enough-Access (JIT/JEA)
3. **Assume Breach**: Minimize blast radius and segment access

### The Evolution from Perimeter Security

Traditional network security relied on castle-and-moat approach:
- Strong perimeter defenses
- Implicit trust for internal network
- VPN for remote access

Zero Trust transforms this model:
- No implicit trust zones
- Continuous verification
- Identity-centric security
- Micro-segmentation

## Components of Zero Trust Network

### 1. Identity and Access Management (IAM)

Identity forms the new perimeter in Zero Trust:

```python
# Example: Multi-factor Authentication Implementation
import pyotp
import qrcode
from datetime import datetime
import hashlib

class ZeroTrustAuthenticator:
    def __init__(self):
        self.users = {}
        
    def register_user(self, username, email):
        """Register user with TOTP-based MFA"""
        # Generate unique secret for user
        secret = pyotp.random_base32()
        
        # Store user data (in production, use secure storage)
        self.users[username] = {
            'email': email,
            'secret': secret,
            'registered': datetime.now(),
            'failed_attempts': 0
        }
        
        # Generate QR code for authenticator app
        provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=email,
            issuer_name='ZeroTrust Corp'
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        return secret, qr
    
    def verify_user(self, username, token, password_hash):
        """Verify user with password and TOTP token"""
        if username not in self.users:
            return False, "User not found"
        
        user = self.users[username]
        
        # Check for account lockout
        if user['failed_attempts'] >= 5:
            return False, "Account locked due to multiple failed attempts"
        
        # Verify TOTP token
        totp = pyotp.TOTP(user['secret'])
        if not totp.verify(token, valid_window=1):
            user['failed_attempts'] += 1
            return False, "Invalid authentication token"
        
        # Reset failed attempts on successful auth
        user['failed_attempts'] = 0
        
        # Generate session token
        session_token = self._generate_session_token(username)
        
        return True, session_token
    
    def _generate_session_token(self, username):
        """Generate time-limited session token"""
        timestamp = str(datetime.now().timestamp())
        data = f"{username}:{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()
```

### 2. Device Trust and Compliance

Device health verification is crucial for Zero Trust:

```rust
// Rust implementation for device compliance checking
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceProfile {
    device_id: String,
    hostname: String,
    os_version: String,
    patch_level: String,
    antivirus_status: bool,
    firewall_enabled: bool,
    disk_encryption: bool,
    last_scan: DateTime<Utc>,
}

#[derive(Debug)]
pub struct DeviceComplianceChecker {
    policies: HashMap<String, CompliancePolicy>,
    device_registry: HashMap<String, DeviceProfile>,
}

#[derive(Debug, Clone)]
struct CompliancePolicy {
    require_encryption: bool,
    require_antivirus: bool,
    require_firewall: bool,
    max_patch_age_days: i64,
    min_os_version: String,
}

impl DeviceComplianceChecker {
    pub fn new() -> Self {
        let mut policies = HashMap::new();
        
        // Define compliance policies for different security levels
        policies.insert("high_security".to_string(), CompliancePolicy {
            require_encryption: true,
            require_antivirus: true,
            require_firewall: true,
            max_patch_age_days: 7,
            min_os_version: "10.0.19041".to_string(),
        });
        
        policies.insert("standard".to_string(), CompliancePolicy {
            require_encryption: true,
            require_antivirus: true,
            require_firewall: false,
            max_patch_age_days: 30,
            min_os_version: "10.0.18362".to_string(),
        });
        
        DeviceComplianceChecker {
            policies,
            device_registry: HashMap::new(),
        }
    }
    
    pub fn check_compliance(&self, device: &DeviceProfile, policy_name: &str) -> ComplianceResult {
        let policy = match self.policies.get(policy_name) {
            Some(p) => p,
            None => return ComplianceResult::error("Policy not found"),
        };
        
        let mut issues = Vec::new();
        
        // Check encryption
        if policy.require_encryption && !device.disk_encryption {
            issues.push("Disk encryption is not enabled".to_string());
        }
        
        // Check antivirus
        if policy.require_antivirus && !device.antivirus_status {
            issues.push("Antivirus is not active".to_string());
        }
        
        // Check firewall
        if policy.require_firewall && !device.firewall_enabled {
            issues.push("Firewall is disabled".to_string());
        }
        
        // Check patch age
        let patch_age = Utc::now() - device.last_scan;
        if patch_age > Duration::days(policy.max_patch_age_days) {
            issues.push(format!("Device hasn't been patched in {} days", 
                patch_age.num_days()));
        }
        
        // Check OS version
        if device.os_version < policy.min_os_version {
            issues.push(format!("OS version {} is below minimum required {}", 
                device.os_version, policy.min_os_version));
        }
        
        if issues.is_empty() {
            ComplianceResult::compliant()
        } else {
            ComplianceResult::non_compliant(issues)
        }
    }
    
    pub fn register_device(&mut self, device: DeviceProfile) {
        self.device_registry.insert(device.device_id.clone(), device);
    }
}

#[derive(Debug)]
pub struct ComplianceResult {
    compliant: bool,
    issues: Vec<String>,
    timestamp: DateTime<Utc>,
}

impl ComplianceResult {
    fn compliant() -> Self {
        ComplianceResult {
            compliant: true,
            issues: vec![],
            timestamp: Utc::now(),
        }
    }
    
    fn non_compliant(issues: Vec<String>) -> Self {
        ComplianceResult {
            compliant: false,
            issues,
            timestamp: Utc::now(),
        }
    }
    
    fn error(msg: &str) -> Self {
        ComplianceResult {
            compliant: false,
            issues: vec![msg.to_string()],
            timestamp: Utc::now(),
        }
    }
}
```

### 3. Network Micro-Segmentation

Implementing micro-segmentation using Software-Defined Networking (SDN):

```python
# SDN Controller for Micro-Segmentation
import json
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
import ipaddress

class SecurityZone(Enum):
    DMZ = "dmz"
    PRODUCTION = "production"
    DEVELOPMENT = "development"
    MANAGEMENT = "management"
    CRITICAL_ASSETS = "critical_assets"

@dataclass
class NetworkSegment:
    """Represents a micro-segment in the network"""
    segment_id: str
    name: str
    zone: SecurityZone
    cidr: str
    vlan_id: int
    allowed_protocols: List[str]
    access_policy: Dict

class SDNController:
    """Software-Defined Network Controller for Zero Trust Segmentation"""
    
    def __init__(self):
        self.segments = {}
        self.flow_rules = []
        self.security_policies = {}
        
    def create_segment(self, name: str, zone: SecurityZone, cidr: str, vlan_id: int):
        """Create a new network micro-segment"""
        segment_id = f"seg_{zone.value}_{vlan_id}"
        
        # Validate CIDR
        try:
            network = ipaddress.ip_network(cidr)
        except ValueError as e:
            raise ValueError(f"Invalid CIDR: {e}")
        
        segment = NetworkSegment(
            segment_id=segment_id,
            name=name,
            zone=zone,
            cidr=cidr,
            vlan_id=vlan_id,
            allowed_protocols=[],
            access_policy={}
        )
        
        self.segments[segment_id] = segment
        self._generate_flow_rules(segment)
        
        return segment_id
    
    def _generate_flow_rules(self, segment: NetworkSegment):
        """Generate OpenFlow rules for segment isolation"""
        rules = []
        
        # Default deny all rule
        rules.append({
            'priority': 1,
            'match': {
                'vlan_vid': segment.vlan_id
            },
            'actions': 'drop'
        })
        
        # Allow established connections
        rules.append({
            'priority': 100,
            'match': {
                'vlan_vid': segment.vlan_id,
                'tcp_flags': 'ACK'
            },
            'actions': 'normal'
        })
        
        # Zone-specific rules
        if segment.zone == SecurityZone.DMZ:
            # Allow HTTP/HTTPS from external
            rules.append({
                'priority': 50,
                'match': {
                    'vlan_vid': segment.vlan_id,
                    'tcp_dst': 443,
                    'ip_proto': 'tcp'
                },
                'actions': 'normal'
            })
        elif segment.zone == SecurityZone.CRITICAL_ASSETS:
            # Strict access control for critical assets
            rules.append({
                'priority': 200,
                'match': {
                    'vlan_vid': segment.vlan_id,
                    'ip_src': '10.0.100.0/24'  # Management network only
                },
                'actions': 'normal'
            })
        
        self.flow_rules.extend(rules)
        return rules
    
    def apply_zero_trust_policy(self, source_segment: str, dest_segment: str, 
                                policy: Dict):
        """Apply Zero Trust access policy between segments"""
        if source_segment not in self.segments or dest_segment not in self.segments:
            raise ValueError("Invalid segment ID")
        
        policy_id = f"policy_{source_segment}_to_{dest_segment}"
        
        # Enhanced policy with Zero Trust principles
        zero_trust_policy = {
            'id': policy_id,
            'source': source_segment,
            'destination': dest_segment,
            'authentication_required': True,
            'encryption_required': True,
            'session_recording': policy.get('session_recording', False),
            'time_restrictions': policy.get('time_restrictions', {}),
            'risk_score_threshold': policy.get('risk_score_threshold', 50),
            'allowed_applications': policy.get('allowed_applications', []),
            'data_loss_prevention': policy.get('dlp_enabled', True)
        }
        
        self.security_policies[policy_id] = zero_trust_policy
        
        # Generate corresponding flow rules
        self._create_policy_flows(zero_trust_policy)
        
        return policy_id
    
    def _create_policy_flows(self, policy: Dict):
        """Create OpenFlow rules based on Zero Trust policy"""
        source = self.segments[policy['source']]
        dest = self.segments[policy['destination']]
        
        flow = {
            'priority': 150,
            'match': {
                'ip_src': source.cidr,
                'ip_dst': dest.cidr,
            },
            'actions': []
        }
        
        # Add authentication check action
        if policy['authentication_required']:
            flow['actions'].append('check_auth')
        
        # Add encryption verification
        if policy['encryption_required']:
            flow['match']['tcp_flags'] = 'TLS'
        
        # Add DLP inspection if enabled
        if policy['data_loss_prevention']:
            flow['actions'].append('dlp_inspect')
        
        # Forward if all checks pass
        flow['actions'].append('forward')
        
        self.flow_rules.append(flow)
    
    def get_segment_topology(self):
        """Return network topology for visualization"""
        topology = {
            'segments': [],
            'connections': []
        }
        
        for seg_id, segment in self.segments.items():
            topology['segments'].append({
                'id': seg_id,
                'name': segment.name,
                'zone': segment.zone.value,
                'cidr': segment.cidr,
                'risk_level': self._calculate_risk_level(segment)
            })
        
        for policy in self.security_policies.values():
            topology['connections'].append({
                'source': policy['source'],
                'destination': policy['destination'],
                'encrypted': policy['encryption_required'],
                'risk_score': policy['risk_score_threshold']
            })
        
        return topology
    
    def _calculate_risk_level(self, segment: NetworkSegment) -> str:
        """Calculate risk level based on zone and exposure"""
        risk_scores = {
            SecurityZone.DMZ: 80,
            SecurityZone.PRODUCTION: 60,
            SecurityZone.DEVELOPMENT: 40,
            SecurityZone.MANAGEMENT: 70,
            SecurityZone.CRITICAL_ASSETS: 90
        }
        
        score = risk_scores.get(segment.zone, 50)
        
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        else:
            return "LOW"
```

## Implementing ZTNA with Practical Examples

### Phase 1: Remote Access Implementation

Replace traditional VPN with ZTNA for remote users:

```yaml
# ZTNA Gateway Configuration (nginx-based)
# /etc/nginx/ztna-gateway.conf

upstream backend_servers {
    # Application servers
    server app1.internal:8080 max_fails=3 fail_timeout=30s;
    server app2.internal:8080 max_fails=3 fail_timeout=30s;
}

# ZTNA Authentication Service
upstream auth_service {
    server auth.ztna.local:9000;
}

# SSL Configuration
ssl_certificate /etc/nginx/certs/ztna.crt;
ssl_certificate_key /etc/nginx/certs/ztna.key;
ssl_protocols TLSv1.3;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# ZTNA Gateway Server Block
server {
    listen 443 ssl http2;
    server_name gateway.ztna.company.com;
    
    # Client certificate verification
    ssl_client_certificate /etc/nginx/certs/ca.crt;
    ssl_verify_client optional;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        # Verify client certificate
        if ($ssl_client_verify != SUCCESS) {
            return 403;
        }
        
        # Extract client identity from certificate
        set $client_dn $ssl_client_s_dn;
        
        # Zero Trust authentication check
        auth_request /auth;
        auth_request_set $auth_status $upstream_status;
        auth_request_set $auth_user $upstream_http_x_auth_user;
        auth_request_set $auth_groups $upstream_http_x_auth_groups;
        auth_request_set $risk_score $upstream_http_x_risk_score;
        
        # Risk-based access control
        if ($risk_score > 70) {
            return 403 "Access denied: Risk score too high";
        }
        
        # Pass authentication info to backend
        proxy_set_header X-Auth-User $auth_user;
        proxy_set_header X-Auth-Groups $auth_groups;
        proxy_set_header X-Client-DN $client_dn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Enable WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_pass http://backend_servers;
        
        # Session recording for high-risk users
        if ($risk_score > 50) {
            access_log /var/log/nginx/high_risk_access.log detailed;
        }
    }
    
    location = /auth {
        internal;
        proxy_pass http://auth_service/verify;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Client-Cert $ssl_client_cert;
    }
}
```

### Phase 2: Application-Level Segmentation

Implement application-aware Zero Trust policies:

```go
// Go implementation of application-level ZTNA
package main

import (
    "context"
    "crypto/tls"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
    
    "github.com/gorilla/mux"
    "github.com/dgrijalva/jwt-go"
)

type ZTNAMiddleware struct {
    PolicyEngine *PolicyEngine
    RiskEngine   *RiskEngine
    AuthService  *AuthenticationService
}

type AccessRequest struct {
    UserID      string
    DeviceID    string
    Application string
    Resource    string
    Action      string
    Context     map[string]interface{}
}

type AccessDecision struct {
    Allowed     bool
    Reason      string
    Conditions  []string
    RiskScore   int
    SessionID   string
}

func (zm *ZTNAMiddleware) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract authentication token
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "No authorization token", http.StatusUnauthorized)
            return
        }
        
        // Validate JWT token
        claims, err := zm.validateToken(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }
        
        // Build access request
        accessReq := AccessRequest{
            UserID:      claims.UserID,
            DeviceID:    r.Header.Get("X-Device-ID"),
            Application: r.Header.Get("X-App-Name"),
            Resource:    r.URL.Path,
            Action:      r.Method,
            Context: map[string]interface{}{
                "ip":        r.RemoteAddr,
                "user_agent": r.UserAgent(),
                "time":      time.Now(),
            },
        }
        
        // Evaluate Zero Trust policy
        decision := zm.evaluateAccess(accessReq)
        
        if !decision.Allowed {
            http.Error(w, decision.Reason, http.StatusForbidden)
            zm.logAccessAttempt(accessReq, decision, false)
            return
        }
        
        // Add security headers
        w.Header().Set("X-Session-ID", decision.SessionID)
        w.Header().Set("X-Risk-Score", fmt.Sprintf("%d", decision.RiskScore))
        
        // Apply additional conditions
        for _, condition := range decision.Conditions {
            zm.applyCondition(w, r, condition)
        }
        
        // Log successful access
        zm.logAccessAttempt(accessReq, decision, true)
        
        // Continue to next handler
        next.ServeHTTP(w, r)
    })
}

func (zm *ZTNAMiddleware) evaluateAccess(req AccessRequest) AccessDecision {
    ctx := context.Background()
    
    // Calculate risk score
    riskScore := zm.RiskEngine.CalculateRisk(ctx, req)
    
    // Check device compliance
    deviceCompliant := zm.PolicyEngine.CheckDeviceCompliance(req.DeviceID)
    if !deviceCompliant {
        return AccessDecision{
            Allowed:   false,
            Reason:    "Device not compliant with security policy",
            RiskScore: riskScore,
        }
    }
    
    // Evaluate policy rules
    policyResult := zm.PolicyEngine.Evaluate(ctx, req)
    if !policyResult.Allowed {
        return AccessDecision{
            Allowed:   false,
            Reason:    policyResult.Reason,
            RiskScore: riskScore,
        }
    }
    
    // Apply risk-based conditions
    conditions := []string{}
    if riskScore > 70 {
        conditions = append(conditions, "require_mfa")
        conditions = append(conditions, "enable_session_recording")
    } else if riskScore > 40 {
        conditions = append(conditions, "limit_session_duration")
    }
    
    // Generate session ID for tracking
    sessionID := zm.generateSessionID(req)
    
    return AccessDecision{
        Allowed:    true,
        Reason:     "Access granted",
        Conditions: conditions,
        RiskScore:  riskScore,
        SessionID:  sessionID,
    }
}

type PolicyEngine struct {
    Rules []PolicyRule
}

type PolicyRule struct {
    Name        string
    Priority    int
    Conditions  []Condition
    Actions     []Action
    Effect      string // "allow" or "deny"
}

func (pe *PolicyEngine) Evaluate(ctx context.Context, req AccessRequest) PolicyResult {
    // Sort rules by priority
    // Evaluate each rule until a decision is made
    
    for _, rule := range pe.Rules {
        if pe.matchesConditions(rule.Conditions, req) {
            return PolicyResult{
                Allowed: rule.Effect == "allow",
                Reason:  fmt.Sprintf("Matched rule: %s", rule.Name),
                Actions: rule.Actions,
            }
        }
    }
    
    // Default deny
    return PolicyResult{
        Allowed: false,
        Reason:  "No matching policy rule",
    }
}

type RiskEngine struct {
    Factors []RiskFactor
}

func (re *RiskEngine) CalculateRisk(ctx context.Context, req AccessRequest) int {
    totalRisk := 0
    
    // Location-based risk
    if !re.isTrustedLocation(req.Context["ip"].(string)) {
        totalRisk += 20
    }
    
    // Time-based risk
    if re.isUnusualTime(req.Context["time"].(time.Time)) {
        totalRisk += 15
    }
    
    // Device trust level
    deviceTrust := re.getDeviceTrustLevel(req.DeviceID)
    totalRisk += (100 - deviceTrust) / 2
    
    // Resource sensitivity
    resourceSensitivity := re.getResourceSensitivity(req.Resource)
    totalRisk += resourceSensitivity / 3
    
    // User behavior anomaly
    if re.detectAnomaly(req.UserID, req) {
        totalRisk += 30
    }
    
    // Cap at 100
    if totalRisk > 100 {
        totalRisk = 100
    }
    
    return totalRisk
}
```

## Security Patterns and Best Practices

### 1. Continuous Verification Pattern

```python
# Continuous verification implementation
import asyncio
from datetime import datetime, timedelta
import jwt
from typing import Dict, Optional

class ContinuousVerificationEngine:
    """Implements continuous verification for Zero Trust"""
    
    def __init__(self):
        self.sessions = {}
        self.verification_interval = 300  # 5 minutes
        self.risk_thresholds = {
            'low': 30,
            'medium': 60,
            'high': 80,
            'critical': 95
        }
    
    async def start_session(self, user_id: str, device_id: str, 
                           initial_risk: int) -> str:
        """Start a continuously verified session"""
        session_id = self._generate_session_id()
        
        session = {
            'user_id': user_id,
            'device_id': device_id,
            'start_time': datetime.now(),
            'last_verification': datetime.now(),
            'risk_score': initial_risk,
            'verification_count': 0,
            'status': 'active'
        }
        
        self.sessions[session_id] = session
        
        # Start continuous verification task
        asyncio.create_task(self._verify_session_continuously(session_id))
        
        return session_id
    
    async def _verify_session_continuously(self, session_id: str):
        """Continuously verify session based on risk level"""
        while session_id in self.sessions:
            session = self.sessions[session_id]
            
            if session['status'] != 'active':
                break
            
            # Adjust verification frequency based on risk
            interval = self._calculate_verification_interval(
                session['risk_score']
            )
            
            await asyncio.sleep(interval)
            
            # Perform verification checks
            verification_result = await self._perform_verification(session)
            
            if not verification_result['passed']:
                await self._terminate_session(session_id, 
                    reason=verification_result['reason'])
                break
            
            # Update session
            session['last_verification'] = datetime.now()
            session['verification_count'] += 1
            session['risk_score'] = verification_result['new_risk_score']
    
    async def _perform_verification(self, session: Dict) -> Dict:
        """Perform verification checks"""
        checks_passed = True
        reason = ""
        new_risk_score = session['risk_score']
        
        # Check 1: Device health
        device_healthy = await self._check_device_health(session['device_id'])
        if not device_healthy:
            checks_passed = False
            reason = "Device health check failed"
            new_risk_score += 20
        
        # Check 2: User behavior
        behavior_normal = await self._check_user_behavior(session['user_id'])
        if not behavior_normal:
            new_risk_score += 15
        
        # Check 3: Session duration
        session_duration = datetime.now() - session['start_time']
        if session_duration > timedelta(hours=8):
            new_risk_score += 10
        
        # Check 4: Network location
        location_trusted = await self._check_network_location(session['device_id'])
        if not location_trusted:
            new_risk_score += 25
        
        # Terminate if risk too high
        if new_risk_score >= self.risk_thresholds['critical']:
            checks_passed = False
            reason = f"Risk score too high: {new_risk_score}"
        
        return {
            'passed': checks_passed,
            'reason': reason,
            'new_risk_score': min(new_risk_score, 100)
        }
    
    def _calculate_verification_interval(self, risk_score: int) -> int:
        """Calculate verification interval based on risk score"""
        if risk_score >= self.risk_thresholds['high']:
            return 60  # 1 minute for high risk
        elif risk_score >= self.risk_thresholds['medium']:
            return 180  # 3 minutes for medium risk
        elif risk_score >= self.risk_thresholds['low']:
            return 300  # 5 minutes for low risk
        else:
            return 600  # 10 minutes for very low risk
    
    async def _check_device_health(self, device_id: str) -> bool:
        """Check device health status"""
        # Implementation would check:
        # - Antivirus status
        # - OS patch level
        # - Firewall status
        # - Disk encryption
        # For demo, return True
        return True
    
    async def _check_user_behavior(self, user_id: str) -> bool:
        """Check for anomalous user behavior"""
        # Implementation would check:
        # - Access patterns
        # - Resource usage
        # - Geographic anomalies
        # - Time-based anomalies
        return True
    
    async def _check_network_location(self, device_id: str) -> bool:
        """Check if device is in trusted network location"""
        # Implementation would check:
        # - IP geolocation
        # - Network reputation
        # - VPN usage
        return True
    
    async def _terminate_session(self, session_id: str, reason: str):
        """Terminate a session"""
        if session_id in self.sessions:
            self.sessions[session_id]['status'] = 'terminated'
            self.sessions[session_id]['termination_reason'] = reason
            self.sessions[session_id]['end_time'] = datetime.now()
            
            # Log termination
            print(f"Session {session_id} terminated: {reason}")
            
            # Notify user
            await self._notify_user_termination(
                self.sessions[session_id]['user_id'], 
                reason
            )
    
    async def _notify_user_termination(self, user_id: str, reason: str):
        """Notify user of session termination"""
        # Implementation would send notification via:
        # - Email
        # - Push notification
        # - SMS
        pass
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        import uuid
        return str(uuid.uuid4())
```

### 2. Software-Defined Perimeter (SDP) Implementation

```bash
#!/bin/bash
# SDP Controller Setup Script

# Install WireGuard for secure tunneling
sudo apt-get update
sudo apt-get install -y wireguard

# Generate keys for SDP controller
wg genkey | tee controller_private.key | wg pubkey > controller_public.key

# Create SDP controller configuration
cat > /etc/wireguard/sdp0.conf << EOF
[Interface]
PrivateKey = $(cat controller_private.key)
Address = 10.200.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i sdp0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i sdp0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Dynamic peer configuration will be added by SDP controller
EOF

# Install SDP controller service
cat > /etc/systemd/system/sdp-controller.service << EOF
[Unit]
Description=Software-Defined Perimeter Controller
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sdp-controller
Restart=always
User=sdp
Group=sdp

[Install]
WantedBy=multi-user.target
EOF

# Create SDP controller application
cat > /usr/local/bin/sdp-controller << 'EOF'
#!/usr/bin/env python3
import os
import json
import subprocess
import hashlib
from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SDP_SECRET_KEY', 'change-me')

# In-memory storage (use Redis in production)
authorized_devices = {}
active_tunnels = {}

@app.route('/api/v1/authenticate', methods=['POST'])
def authenticate():
    """Authenticate device and user for SDP access"""
    data = request.json
    
    # Verify device certificate
    device_cert = data.get('device_cert')
    if not verify_device_certificate(device_cert):
        return jsonify({'error': 'Invalid device certificate'}), 401
    
    # Verify user credentials
    username = data.get('username')
    password = data.get('password')
    totp_code = data.get('totp_code')
    
    if not verify_user_credentials(username, password, totp_code):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate SPA (Single Packet Authorization) token
    spa_token = generate_spa_token(username, device_cert)
    
    return jsonify({
        'spa_token': spa_token,
        'controller_ip': '10.200.0.1',
        'port': 51820
    })

@app.route('/api/v1/authorize', methods=['POST'])
def authorize():
    """Authorize SPA and create dynamic tunnel"""
    spa_token = request.headers.get('X-SPA-Token')
    
    if not verify_spa_token(spa_token):
        return jsonify({'error': 'Invalid SPA token'}), 401
    
    # Extract claims from token
    claims = jwt.decode(spa_token, app.config['SECRET_KEY'], 
                       algorithms=['HS256'])
    
    # Generate WireGuard configuration for client
    client_config = generate_client_config(claims['username'], 
                                          claims['device_id'])
    
    # Add peer to controller
    add_wireguard_peer(client_config['public_key'], 
                      client_config['allowed_ips'])
    
    # Create micro-tunnel
    tunnel_id = create_micro_tunnel(claims['username'], 
                                   claims['device_id'],
                                   claims['requested_resources'])
    
    return jsonify({
        'tunnel_id': tunnel_id,
        'client_config': client_config['config'],
        'expires_in': 3600
    })

def verify_device_certificate(cert):
    """Verify device certificate against CA"""
    # Implementation would verify certificate chain
    return True

def verify_user_credentials(username, password, totp_code):
    """Verify user credentials and TOTP"""
    # Implementation would check against identity provider
    return True

def generate_spa_token(username, device_cert):
    """Generate Single Packet Authorization token"""
    device_id = hashlib.sha256(device_cert.encode()).hexdigest()[:16]
    
    payload = {
        'username': username,
        'device_id': device_id,
        'exp': datetime.utcnow() + timedelta(minutes=5),
        'requested_resources': ['app1', 'app2']
    }
    
    return jwt.encode(payload, app.config['SECRET_KEY'], 
                     algorithm='HS256')

def verify_spa_token(token):
    """Verify SPA token"""
    try:
        jwt.decode(token, app.config['SECRET_KEY'], 
                  algorithms=['HS256'])
        return True
    except jwt.ExpiredSignatureError:
        return False
    except jwt.InvalidTokenError:
        return False

def generate_client_config(username, device_id):
    """Generate WireGuard client configuration"""
    # Generate client keys
    private_key = subprocess.check_output(['wg', 'genkey']).decode().strip()
    public_key = subprocess.check_output(
        ['wg', 'pubkey'], 
        input=private_key.encode()
    ).decode().strip()
    
    # Allocate IP address
    client_ip = allocate_client_ip(username, device_id)
    
    config = f"""[Interface]
PrivateKey = {private_key}
Address = {client_ip}/32
DNS = 10.200.0.1

[Peer]
PublicKey = {get_controller_public_key()}
Endpoint = sdp.company.com:51820
AllowedIPs = 10.200.0.0/24, 192.168.0.0/16
PersistentKeepalive = 25"""
    
    return {
        'config': config,
        'public_key': public_key,
        'allowed_ips': f"{client_ip}/32"
    }

def add_wireguard_peer(public_key, allowed_ips):
    """Add peer to WireGuard interface"""
    cmd = [
        'wg', 'set', 'sdp0', 'peer', public_key,
        'allowed-ips', allowed_ips
    ]
    subprocess.run(cmd, check=True)

def create_micro_tunnel(username, device_id, resources):
    """Create micro-tunnel for specific resources"""
    tunnel_id = f"{username}_{device_id}_{datetime.now().timestamp()}"
    
    # Configure iptables rules for micro-segmentation
    for resource in resources:
        resource_ip = get_resource_ip(resource)
        
        # Allow access to specific resource
        cmd = [
            'iptables', '-A', 'FORWARD',
            '-s', get_client_ip(username, device_id),
            '-d', resource_ip,
            '-j', 'ACCEPT'
        ]
        subprocess.run(cmd, check=True)
    
    # Store tunnel information
    active_tunnels[tunnel_id] = {
        'username': username,
        'device_id': device_id,
        'resources': resources,
        'created': datetime.now(),
        'expires': datetime.now() + timedelta(hours=1)
    }
    
    return tunnel_id

def allocate_client_ip(username, device_id):
    """Allocate IP address for client"""
    # Simple allocation (use IPAM in production)
    hash_input = f"{username}_{device_id}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest()[:2], 16)
    return f"10.200.0.{hash_value % 254 + 2}"

def get_controller_public_key():
    """Get controller's WireGuard public key"""
    with open('/etc/wireguard/controller_public.key', 'r') as f:
        return f.read().strip()

def get_resource_ip(resource):
    """Get IP address of resource"""
    resource_map = {
        'app1': '192.168.1.10',
        'app2': '192.168.1.20',
        'database': '192.168.2.10'
    }
    return resource_map.get(resource, '0.0.0.0')

def get_client_ip(username, device_id):
    """Get allocated client IP"""
    return allocate_client_ip(username, device_id)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
EOF

chmod +x /usr/local/bin/sdp-controller

# Create SDP user
useradd -r -s /bin/false sdp

# Start services
systemctl enable wg-quick@sdp0
systemctl start wg-quick@sdp0
systemctl enable sdp-controller
systemctl start sdp-controller

echo "SDP Controller setup complete!"
```

## Monitoring and Analytics

### Real-time Zero Trust Dashboard

```python
# Zero Trust Monitoring Dashboard
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
from flask import Flask, render_template_string

# Metrics
auth_attempts = Counter('ztna_auth_attempts_total', 
                       'Total authentication attempts',
                       ['result', 'method'])
access_requests = Counter('ztna_access_requests_total',
                         'Total access requests',
                         ['resource', 'decision'])
risk_scores = Histogram('ztna_risk_scores',
                       'Distribution of risk scores',
                       buckets=[10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
active_sessions = Gauge('ztna_active_sessions',
                       'Number of active sessions',
                       ['zone'])
compliance_status = Gauge('ztna_device_compliance',
                         'Device compliance status',
                         ['status'])

# Dashboard HTML template
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Zero Trust Network Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric-card { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin: 10px;
            border-radius: 5px;
            display: inline-block;
            width: 300px;
        }
        .metric-value { font-size: 36px; font-weight: bold; }
        .metric-label { color: #666; }
        .chart-container { width: 600px; display: inline-block; margin: 20px; }
    </style>
</head>
<body>
    <h1>Zero Trust Network Analytics</h1>
    
    <div id="metrics">
        <div class="metric-card">
            <div class="metric-label">Active Sessions</div>
            <div class="metric-value">{{ active_sessions }}</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Auth Success Rate</div>
            <div class="metric-value">{{ auth_success_rate }}%</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Average Risk Score</div>
            <div class="metric-value">{{ avg_risk_score }}</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-label">Compliant Devices</div>
            <div class="metric-value">{{ compliant_devices }}%</div>
        </div>
    </div>
    
    <div class="chart-container">
        <canvas id="riskDistribution"></canvas>
    </div>
    
    <div class="chart-container">
        <canvas id="accessTrends"></canvas>
    </div>
    
    <script>
        // Risk Distribution Chart
        new Chart(document.getElementById('riskDistribution'), {
            type: 'bar',
            data: {
                labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                datasets: [{
                    label: 'Risk Score Distribution',
                    data: {{ risk_distribution }},
                    backgroundColor: ['green', 'lightgreen', 'yellow', 'orange', 'red']
                }]
            }
        });
        
        // Access Trends Chart
        new Chart(document.getElementById('accessTrends'), {
            type: 'line',
            data: {
                labels: {{ time_labels }},
                datasets: [{
                    label: 'Access Requests',
                    data: {{ access_data }},
                    borderColor: 'blue',
                    tension: 0.1
                }]
            }
        });
    </script>
</body>
</html>
"""

app = Flask(__name__)

@app.route('/dashboard')
def dashboard():
    # Calculate metrics
    metrics = {
        'active_sessions': calculate_active_sessions(),
        'auth_success_rate': calculate_auth_success_rate(),
        'avg_risk_score': calculate_average_risk_score(),
        'compliant_devices': calculate_compliance_percentage(),
        'risk_distribution': get_risk_distribution(),
        'time_labels': get_time_labels(),
        'access_data': get_access_trends()
    }
    
    return render_template_string(DASHBOARD_TEMPLATE, **metrics)

@app.route('/metrics')
def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

def calculate_active_sessions():
    # Implementation would query actual session data
    return 127

def calculate_auth_success_rate():
    # Implementation would calculate from auth_attempts metric
    return 94.5

def calculate_average_risk_score():
    # Implementation would calculate from risk_scores metric
    return 42

def calculate_compliance_percentage():
    # Implementation would calculate from compliance_status metric
    return 87

def get_risk_distribution():
    # Implementation would get histogram data
    return [15, 35, 25, 18, 7]

def get_time_labels():
    # Generate time labels for last 24 hours
    return [f"{i}:00" for i in range(24)]

def get_access_trends():
    # Implementation would get time series data
    import random
    return [random.randint(50, 200) for _ in range(24)]
```

## Conclusion

Zero Trust Network Architecture represents a paradigm shift in network security, moving from perimeter-based trust to continuous verification. This implementation guide has covered:

1. **Core Components**: Identity management, device trust, and micro-segmentation
2. **Practical Implementation**: ZTNA gateways, application-level policies, and SDP
3. **Security Patterns**: Continuous verification and risk-based access control
4. **Monitoring**: Real-time analytics and compliance tracking

The journey to Zero Trust is iterative. Start with high-value assets, gradually expand coverage, and continuously refine policies based on observed behavior and emerging threats.

### Next Steps

1. **Assessment**: Evaluate current network architecture and identify gaps
2. **Pilot Program**: Implement ZTNA for a small group of users
3. **Policy Development**: Create comprehensive access policies
4. **Training**: Educate teams on Zero Trust principles
5. **Continuous Improvement**: Monitor, measure, and optimize

Remember: Zero Trust is not a product but a security strategy. Success requires commitment to continuous verification, least privilege access, and assumption of breach.

## Resources and References

- [NIST Zero Trust Architecture (SP 800-207)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf)
- [CISA Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model)
- [Zero Trust Networks (O'Reilly)](https://www.oreilly.com/library/view/zero-trust-networks/9781491962183/)
- [BeyondCorp: Google's Implementation](https://cloud.google.com/beyondcorp)

---

*Building secure networks for the modern threat landscape - one verification at a time.*