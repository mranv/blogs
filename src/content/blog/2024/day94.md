---
author: Anubhav Gain
pubDatetime: 2024-09-30T10:00:00+05:30
modDatetime: 2024-09-30T10:00:00+05:30
title: Day 94 - Zero Trust Security in Multi-Cloud Environments
slug: day94
featured: false
draft: false
tags:
  - Security
  - ZeroTrust
  - CloudSecurity
  - MultiCloud
  - DevSecOps
  - IAM
description: Implementing Zero Trust security architecture across multiple cloud providers, ensuring consistent security policies and access controls in hybrid environments.
---

# Day 94 - Zero Trust Security in Multi-Cloud Environments

[![Watch the video](/thumbnails/day94.png)](https://www.youtube.com/watch?v=placeholder94)

As organizations embrace multi-cloud strategies, traditional perimeter-based security models become obsolete. Zero Trust architecture assumes no implicit trust and continuously verifies every transaction, regardless of source. Today, we'll explore implementing comprehensive Zero Trust security across AWS, Azure, Google Cloud, and hybrid environments.

## Understanding Zero Trust Principles

Zero Trust operates on three core principles:

1. **Never Trust, Always Verify**: Every access request is authenticated and authorized
2. **Least Privilege Access**: Users and services get minimal required permissions
3. **Assume Breach**: Design systems assuming attackers are already inside

## Multi-Cloud Identity Foundation

### Unified Identity Management with OIDC

```yaml
# kubernetes/identity-provider.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: oidc-discovery
  namespace: kube-system
data:
  config.json: |
    {
      "issuer": "https://identity.company.com",
      "authorization_endpoint": "https://identity.company.com/oauth2/authorize",
      "token_endpoint": "https://identity.company.com/oauth2/token",
      "userinfo_endpoint": "https://identity.company.com/userinfo",
      "jwks_uri": "https://identity.company.com/.well-known/jwks.json",
      "response_types_supported": ["code", "token", "id_token"],
      "subject_types_supported": ["public"],
      "id_token_signing_alg_values_supported": ["RS256"],
      "scopes_supported": ["openid", "email", "profile", "groups"]
    }
```

### Cross-Cloud Service Authentication

```python
# multi_cloud_auth.py
import jwt
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta

class MultiCloudAuthenticator:
    def __init__(self, identity_provider_url):
        self.identity_provider_url = identity_provider_url
        self.jwks_cache = {}

    def generate_service_token(self, service_account, target_cloud, scopes):
        """Generate JWT for service-to-service authentication"""
        # Load service account key
        with open(f"/keys/{service_account}.json", 'r') as f:
            key_data = json.load(f)

        # Create JWT claims
        now = datetime.utcnow()
        claims = {
            "iss": key_data["client_email"],
            "sub": key_data["client_email"],
            "aud": f"https://{target_cloud}.api.company.com",
            "iat": now,
            "exp": now + timedelta(hours=1),
            "scope": " ".join(scopes),
            "target_cloud": target_cloud,
            "service_account_id": key_data["client_id"]
        }

        # Sign JWT
        private_key = serialization.load_pem_private_key(
            key_data["private_key"].encode(),
            password=None
        )

        token = jwt.encode(
            claims,
            private_key,
            algorithm="RS256",
            headers={"kid": key_data["private_key_id"]}
        )

        return token

    def verify_cross_cloud_token(self, token, expected_audience):
        """Verify token from another cloud service"""
        # Decode header to get key ID
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        # Get public key from JWKS endpoint
        public_key = self._get_public_key(kid)

        # Verify and decode token
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=expected_audience,
                options={"verify_exp": True}
            )
            return payload
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")

    def _get_public_key(self, kid):
        """Retrieve public key from JWKS endpoint"""
        if kid not in self.jwks_cache:
            jwks_url = f"{self.identity_provider_url}/.well-known/jwks.json"
            response = requests.get(jwks_url)
            jwks = response.json()

            for key in jwks["keys"]:
                if key["kid"] == kid:
                    self.jwks_cache[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(
                        json.dumps(key)
                    )
                    break

        return self.jwks_cache.get(kid)
```

## Policy-as-Code Across Clouds

### Open Policy Agent (OPA) for Unified Policies

```rego
# policies/multi_cloud_access.rego
package multicloud.access

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# Default deny
default allow := false

# Cloud provider configurations
cloud_providers := {
    "aws": {"regions": ["us-east-1", "eu-west-1"], "services": ["ec2", "s3", "rds"]},
    "azure": {"regions": ["eastus", "westeurope"], "services": ["vm", "storage", "sql"]},
    "gcp": {"regions": ["us-central1", "europe-west1"], "services": ["compute", "storage", "sql"]}
}

# Allow access if all conditions are met
allow if {
    # User is authenticated
    input.user.authenticated == true

    # User has valid MFA
    input.user.mfa_verified == true

    # Request is for allowed cloud provider
    input.cloud in cloud_providers

    # Request is for allowed region
    input.region in cloud_providers[input.cloud].regions

    # User has permission for the action
    user_has_permission

    # Request complies with data residency requirements
    data_residency_compliant
}

# Check user permissions
user_has_permission if {
    some role in input.user.roles
    some permission in data.roles[role].permissions
    permission.cloud == input.cloud
    permission.service == input.service
    permission.action == input.action
}

# Data residency compliance
data_residency_compliant if {
    input.data_classification == "public"
} else if {
    input.data_classification == "internal"
    input.region in data.data_residency[input.user.country].allowed_regions
} else if {
    input.data_classification == "confidential"
    input.region == data.data_residency[input.user.country].primary_region
}

# Conditional access based on risk score
allow if {
    input.risk_score < 30
    basic_authentication_met
} else if {
    input.risk_score < 70
    enhanced_authentication_met
} else := false

basic_authentication_met if {
    input.user.authenticated == true
    input.device.managed == true
}

enhanced_authentication_met if {
    basic_authentication_met
    input.user.mfa_verified == true
    input.device.compliant == true
    input.network.trusted == true
}
```

### Policy Enforcement Gateway

```go
// policy_gateway.go
package main

import (
    "context"
    "encoding/json"
    "net/http"

    "github.com/open-policy-agent/opa/rego"
)

type PolicyGateway struct {
    opaQuery *rego.PreparedEvalQuery
    cloudProviders map[string]CloudProvider
}

type AuthzRequest struct {
    User            User            `json:"user"`
    Cloud           string          `json:"cloud"`
    Service         string          `json:"service"`
    Action          string          `json:"action"`
    Resource        string          `json:"resource"`
    Region          string          `json:"region"`
    DataClass       string          `json:"data_classification"`
    RiskScore       int             `json:"risk_score"`
    Device          DeviceInfo      `json:"device"`
    Network         NetworkInfo     `json:"network"`
}

func (pg *PolicyGateway) AuthorizeRequest(w http.ResponseWriter, r *http.Request) {
    var authzReq AuthzRequest
    if err := json.NewDecoder(r.Body).Decode(&authzReq); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // Evaluate OPA policy
    results, err := pg.opaQuery.Eval(context.Background(), rego.EvalInput(authzReq))
    if err != nil {
        http.Error(w, "Policy evaluation failed", http.StatusInternalServerError)
        return
    }

    allowed := results[0].Expressions[0].Value.(bool)

    if allowed {
        // Generate cloud-specific credentials
        creds, err := pg.generateCloudCredentials(authzReq)
        if err != nil {
            http.Error(w, "Failed to generate credentials", http.StatusInternalServerError)
            return
        }

        // Audit log
        pg.auditLog(authzReq, "allowed", creds.SessionID)

        json.NewEncoder(w).Encode(map[string]interface{}{
            "allowed": true,
            "credentials": creds,
            "session_id": creds.SessionID,
            "expires_at": creds.ExpiresAt,
        })
    } else {
        // Audit log
        pg.auditLog(authzReq, "denied", "")

        json.NewEncoder(w).Encode(map[string]interface{}{
            "allowed": false,
            "reason": "Policy denied access",
        })
    }
}

func (pg *PolicyGateway) generateCloudCredentials(req AuthzRequest) (*CloudCredentials, error) {
    provider := pg.cloudProviders[req.Cloud]

    // Generate temporary credentials with least privilege
    creds := &CloudCredentials{
        SessionID: generateSessionID(),
        ExpiresAt: time.Now().Add(1 * time.Hour),
    }

    switch req.Cloud {
    case "aws":
        assumeRoleOutput, err := provider.AssumeRole(AssumeRoleInput{
            RoleARN:         fmt.Sprintf("arn:aws:iam::%s:role/%s", accountID, req.User.Role),
            SessionName:     creds.SessionID,
            DurationSeconds: 3600,
            Policy:          pg.generateScopedPolicy(req),
        })
        if err != nil {
            return nil, err
        }
        creds.AWS = assumeRoleOutput.Credentials

    case "azure":
        token, err := provider.GetToken(TokenRequest{
            TenantID:     req.User.TenantID,
            ClientID:     req.User.ClientID,
            Scope:        pg.generateAzureScope(req),
            GrantType:    "client_credentials",
        })
        if err != nil {
            return nil, err
        }
        creds.Azure = token

    case "gcp":
        accessToken, err := provider.GenerateAccessToken(AccessTokenRequest{
            ServiceAccount: req.User.ServiceAccount,
            Scopes:        pg.generateGCPScopes(req),
            Lifetime:      "3600s",
        })
        if err != nil {
            return nil, err
        }
        creds.GCP = accessToken
    }

    return creds, nil
}
```

## Network Security Across Clouds

### Service Mesh for Zero Trust Networking

```yaml
# istio-multi-cloud-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: control-plane
spec:
  values:
    pilot:
      env:
        PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION: true
        PILOT_ENABLE_CROSS_CLUSTER_WORKLOAD_ENTRY: true
    global:
      meshID: mesh-global
      multiCluster:
        clusterName: aws-cluster
      network: aws-network
  components:
    pilot:
      k8s:
        env:
          - name: PILOT_ENABLE_VIRTUAL_SERVICE_DELEGATE
            value: "true"
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: istio-system
spec: {} # Deny all by default
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-internal-services
  namespace: production
spec:
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/*"]
      to:
        - operation:
            methods: ["GET", "POST"]
      when:
        - key: source.ip
          notValues: ["0.0.0.0/0"]
        - key: request.auth.claims[iss]
          values: ["https://identity.company.com"]
```

### Cross-Cloud VPN Mesh

```python
# vpn_mesh_orchestrator.py
import boto3
import azure.mgmt.network
from google.cloud import compute_v1
import ipaddress

class CrossCloudVPNMesh:
    def __init__(self):
        self.aws_ec2 = boto3.client('ec2')
        self.azure_network = azure.mgmt.network.NetworkManagementClient(
            credential, subscription_id
        )
        self.gcp_vpn = compute_v1.VpnGatewaysClient()

    def create_mesh_topology(self, regions):
        """Create full mesh VPN topology across clouds"""
        vpn_endpoints = {}

        # Create VPN gateways in each cloud
        for region in regions:
            if region['cloud'] == 'aws':
                vpn_endpoints[region['id']] = self._create_aws_vpn_gateway(region)
            elif region['cloud'] == 'azure':
                vpn_endpoints[region['id']] = self._create_azure_vpn_gateway(region)
            elif region['cloud'] == 'gcp':
                vpn_endpoints[region['id']] = self._create_gcp_vpn_gateway(region)

        # Create connections between all pairs
        connections = []
        for i, (region1_id, endpoint1) in enumerate(vpn_endpoints.items()):
            for region2_id, endpoint2 in list(vpn_endpoints.items())[i+1:]:
                connection = self._create_vpn_connection(
                    endpoint1, endpoint2,
                    f"conn-{region1_id}-{region2_id}"
                )
                connections.append(connection)

        return {
            'endpoints': vpn_endpoints,
            'connections': connections,
            'topology': 'full-mesh'
        }

    def _create_aws_vpn_gateway(self, region):
        """Create AWS Virtual Private Gateway"""
        # Create customer gateway for cross-cloud connectivity
        cgw_response = self.aws_ec2.create_customer_gateway(
            BgpAsn=65000,
            PublicIp=region['public_ip'],
            Type='ipsec.1',
            TagSpecifications=[{
                'ResourceType': 'customer-gateway',
                'Tags': [
                    {'Key': 'Name', 'Value': f"cgw-{region['id']}"},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'ZeroTrust', 'Value': 'enabled'}
                ]
            }]
        )

        # Create VPN connection
        vpn_response = self.aws_ec2.create_vpn_connection(
            CustomerGatewayId=cgw_response['CustomerGateway']['CustomerGatewayId'],
            Type='ipsec.1',
            VpnGatewayId=region['vpn_gateway_id'],
            Options={
                'EnableAcceleration': True,
                'TunnelOptions': [
                    {
                        'TunnelInsideCidr': '169.254.10.0/30',
                        'PreSharedKey': self._generate_psk()
                    },
                    {
                        'TunnelInsideCidr': '169.254.10.4/30',
                        'PreSharedKey': self._generate_psk()
                    }
                ]
            }
        )

        return {
            'cloud': 'aws',
            'region': region['name'],
            'vpn_connection_id': vpn_response['VpnConnection']['VpnConnectionId'],
            'customer_gateway_id': cgw_response['CustomerGateway']['CustomerGatewayId']
        }
```

## Workload Identity and Access

### Workload Identity Federation

```yaml
# workload-identity-config.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cross-cloud-workload
  namespace: production
  annotations:
    # AWS IRSA
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/cross-cloud-workload
    # GCP Workload Identity
    iam.gke.io/gcp-service-account: cross-cloud-workload@project.iam.gserviceaccount.com
    # Azure Workload Identity
    azure.workload.identity/client-id: "12345678-1234-1234-1234-123456789012"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: workload-identity-config
  namespace: production
data:
  config.yaml: |
    identity_providers:
      aws:
        region: us-east-1
        sts_endpoint: https://sts.amazonaws.com
        audience: sts.amazonaws.com
      gcp:
        project_id: my-project
        workload_identity_pool: cross-cloud-pool
        provider: cross-cloud-provider
      azure:
        tenant_id: 12345678-1234-1234-1234-123456789012
        client_id: 87654321-4321-4321-4321-210987654321
```

### Dynamic Credential Management

```go
// workload_identity_manager.go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/aws/aws-sdk-go-v2/service/sts"
    "google.golang.org/api/iamcredentials/v1"
    "github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

type WorkloadIdentityManager struct {
    awsSTS          *sts.Client
    gcpIAM          *iamcredentials.Service
    azureCredential *azidentity.DefaultAzureCredential
}

func (wim *WorkloadIdentityManager) GetCloudCredentials(ctx context.Context, targetCloud string, workloadID string) (interface{}, error) {
    // Verify workload identity
    workload, err := wim.verifyWorkloadIdentity(ctx, workloadID)
    if err != nil {
        return nil, fmt.Errorf("workload verification failed: %w", err)
    }

    switch targetCloud {
    case "aws":
        return wim.getAWSCredentials(ctx, workload)
    case "gcp":
        return wim.getGCPCredentials(ctx, workload)
    case "azure":
        return wim.getAzureCredentials(ctx, workload)
    default:
        return nil, fmt.Errorf("unsupported cloud: %s", targetCloud)
    }
}

func (wim *WorkloadIdentityManager) getAWSCredentials(ctx context.Context, workload *WorkloadIdentity) (*AWSCredentials, error) {
    // Exchange workload token for AWS credentials
    result, err := wim.awsSTS.AssumeRoleWithWebIdentity(ctx, &sts.AssumeRoleWithWebIdentityInput{
        RoleArn:          &workload.AWSRoleARN,
        RoleSessionName:  &workload.SessionName,
        WebIdentityToken: &workload.Token,
        DurationSeconds:  aws.Int32(3600),
        Policy:          wim.generateScopedPolicy(workload),
    })

    if err != nil {
        return nil, fmt.Errorf("failed to assume AWS role: %w", err)
    }

    return &AWSCredentials{
        AccessKeyID:     *result.Credentials.AccessKeyId,
        SecretAccessKey: *result.Credentials.SecretAccessKey,
        SessionToken:    *result.Credentials.SessionToken,
        Expiration:      *result.Credentials.Expiration,
    }, nil
}

func (wim *WorkloadIdentityManager) getGCPCredentials(ctx context.Context, workload *WorkloadIdentity) (*GCPCredentials, error) {
    // Generate access token for GCP
    name := fmt.Sprintf("projects/-/serviceAccounts/%s", workload.GCPServiceAccount)

    req := &iamcredentials.GenerateAccessTokenRequest{
        Scope:    workload.RequiredScopes,
        Lifetime: "3600s",
    }

    resp, err := wim.gcpIAM.Projects.ServiceAccounts.GenerateAccessToken(name, req).Context(ctx).Do()
    if err != nil {
        return nil, fmt.Errorf("failed to generate GCP access token: %w", err)
    }

    return &GCPCredentials{
        AccessToken: resp.AccessToken,
        ExpireTime:  resp.ExpireTime,
    }, nil
}

func (wim *WorkloadIdentityManager) generateScopedPolicy(workload *WorkloadIdentity) *string {
    // Generate least-privilege policy based on workload requirements
    policy := map[string]interface{}{
        "Version": "2012-10-17",
        "Statement": []interface{}{
            map[string]interface{}{
                "Effect": "Allow",
                "Action": workload.AllowedActions,
                "Resource": workload.AllowedResources,
                "Condition": map[string]interface{}{
                    "DateLessThan": map[string]string{
                        "aws:CurrentTime": time.Now().Add(1 * time.Hour).Format(time.RFC3339),
                    },
                    "StringEquals": map[string]string{
                        "aws:userid": workload.SessionName,
                    },
                },
            },
        },
    }

    policyJSON, _ := json.Marshal(policy)
    policyStr := string(policyJSON)
    return &policyStr
}
```

## Continuous Compliance Monitoring

### Cloud Security Posture Management

```python
# cspm_scanner.py
import asyncio
from typing import Dict, List, Any
import boto3
import azure.mgmt.security
from google.cloud import securitycenter

class MultiCloudCSPM:
    def __init__(self):
        self.scanners = {
            'aws': AWSSecurityScanner(),
            'azure': AzureSecurityScanner(),
            'gcp': GCPSecurityScanner()
        }

    async def scan_all_clouds(self) -> Dict[str, List[Finding]]:
        """Perform security scanning across all clouds"""
        tasks = []
        for cloud, scanner in self.scanners.items():
            tasks.append(scanner.scan())

        results = await asyncio.gather(*tasks)

        # Aggregate and normalize findings
        findings = self._normalize_findings(results)

        # Apply Zero Trust validation
        validated_findings = self._validate_zero_trust_compliance(findings)

        return validated_findings

    def _validate_zero_trust_compliance(self, findings: List[Finding]) -> List[Finding]:
        """Check findings against Zero Trust principles"""
        zero_trust_rules = {
            'no_public_access': self._check_no_public_access,
            'encryption_at_rest': self._check_encryption_at_rest,
            'mfa_enabled': self._check_mfa_enabled,
            'least_privilege': self._check_least_privilege,
            'network_segmentation': self._check_network_segmentation,
            'audit_logging': self._check_audit_logging
        }

        validated = []
        for finding in findings:
            for rule_name, rule_func in zero_trust_rules.items():
                if not rule_func(finding):
                    finding.zero_trust_violations.append(rule_name)

            if finding.zero_trust_violations:
                finding.severity = 'CRITICAL'

            validated.append(finding)

        return validated

class AWSSecurityScanner:
    def __init__(self):
        self.security_hub = boto3.client('securityhub')
        self.config = boto3.client('config')
        self.iam = boto3.client('iam')

    async def scan(self) -> List[Finding]:
        findings = []

        # Check IAM policies for least privilege
        policies = self.iam.list_policies(Scope='Local')['Policies']
        for policy in policies:
            policy_version = self.iam.get_policy_version(
                PolicyArn=policy['Arn'],
                VersionId=policy['DefaultVersionId']
            )

            violations = self._analyze_policy_permissions(
                policy_version['PolicyVersion']['Document']
            )

            if violations:
                findings.append(Finding(
                    cloud='aws',
                    resource_type='iam_policy',
                    resource_id=policy['Arn'],
                    title=f"Overly permissive IAM policy: {policy['PolicyName']}",
                    severity='HIGH',
                    violations=violations
                ))

        # Check Security Hub findings
        sh_findings = self.security_hub.get_findings(
            Filters={
                'RecordState': [{'Value': 'ACTIVE', 'Comparison': 'EQUALS'}],
                'ComplianceStatus': [{'Value': 'FAILED', 'Comparison': 'EQUALS'}]
            }
        )

        for finding in sh_findings['Findings']:
            findings.append(self._convert_security_hub_finding(finding))

        return findings

    def _analyze_policy_permissions(self, policy_document: dict) -> List[str]:
        violations = []

        for statement in policy_document.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                # Check for wildcards in actions
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]

                for action in actions:
                    if '*' in action:
                        violations.append(f"Wildcard in action: {action}")

                # Check for wildcards in resources
                resources = statement.get('Resource', [])
                if isinstance(resources, str):
                    resources = [resources]

                if '*' in resources:
                    violations.append("Wildcard in resource specification")

        return violations
```

### Compliance Dashboard

```typescript
// compliance-dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Grid, Progress, Alert, Table } from '@mantine/core';
import { IconShield, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface ComplianceStatus {
  framework: string;
  cloud: string;
  score: number;
  findings: Finding[];
}

export function ZeroTrustComplianceDashboard() {
  const [complianceData, setComplianceData] = useState<ComplianceStatus[]>([]);
  const [criticalFindings, setCriticalFindings] = useState<Finding[]>([]);

  useEffect(() => {
    // Fetch compliance data
    fetchComplianceStatus();
    const interval = setInterval(fetchComplianceStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchComplianceStatus = async () => {
    const response = await fetch('/api/compliance/zero-trust/status');
    const data = await response.json();
    setComplianceData(data.compliance);
    setCriticalFindings(data.critical_findings);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };

  return (
    <div>
      <h1>Zero Trust Compliance Dashboard</h1>

      {criticalFindings.length > 0 && (
        <Alert
          icon={<IconAlertTriangle />}
          title="Critical Zero Trust Violations"
          color="red"
          mb="lg"
        >
          {criticalFindings.length} critical findings require immediate attention
        </Alert>
      )}

      <Grid>
        {complianceData.map((compliance) => (
          <Grid.Col span={4} key={`${compliance.cloud}-${compliance.framework}`}>
            <Card shadow="sm" p="lg">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <IconShield size={24} style={{ marginRight: '0.5rem' }} />
                <h3>{compliance.cloud.toUpperCase()} - {compliance.framework}</h3>
              </div>

              <Progress
                value={compliance.score}
                size="xl"
                color={getComplianceColor(compliance.score)}
                label={`${compliance.score}%`}
              />

              <div style={{ marginTop: '1rem' }}>
                <strong>Top Violations:</strong>
                <ul>
                  {compliance.findings.slice(0, 3).map((finding, idx) => (
                    <li key={idx}>{finding.title}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Card shadow="sm" p="lg" mt="xl">
        <h2>Zero Trust Principles Compliance</h2>
        <Table>
          <thead>
            <tr>
              <th>Principle</th>
              <th>AWS</th>
              <th>Azure</th>
              <th>GCP</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Identity Verification</td>
              <td><ComplianceIcon score={95} /></td>
              <td><ComplianceIcon score={88} /></td>
              <td><ComplianceIcon score={92} /></td>
              <td><ComplianceIcon score={91} /></td>
            </tr>
            <tr>
              <td>Least Privilege Access</td>
              <td><ComplianceIcon score={78} /></td>
              <td><ComplianceIcon score={82} /></td>
              <td><ComplianceIcon score={85} /></td>
              <td><ComplianceIcon score={81} /></td>
            </tr>
            <tr>
              <td>Network Segmentation</td>
              <td><ComplianceIcon score={90} /></td>
              <td><ComplianceIcon score={87} /></td>
              <td><ComplianceIcon score={89} /></td>
              <td><ComplianceIcon score={88} /></td>
            </tr>
            <tr>
              <td>Encryption Everywhere</td>
              <td><ComplianceIcon score={94} /></td>
              <td><ComplianceIcon score={96} /></td>
              <td><ComplianceIcon score={93} /></td>
              <td><ComplianceIcon score={94} /></td>
            </tr>
            <tr>
              <td>Continuous Monitoring</td>
              <td><ComplianceIcon score={86} /></td>
              <td><ComplianceIcon score={84} /></td>
              <td><ComplianceIcon score={88} /></td>
              <td><ComplianceIcon score={86} /></td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function ComplianceIcon({ score }: { score: number }) {
  if (score >= 90) {
    return <IconCheck color="green" />;
  } else if (score >= 70) {
    return <IconAlertTriangle color="orange" />;
  } else {
    return <IconAlertTriangle color="red" />;
  }
}
```

## Incident Response Automation

### Multi-Cloud Security Orchestration

```python
# incident_response_orchestrator.py
class MultiCloudIncidentResponse:
    def __init__(self):
        self.cloud_apis = {
            'aws': AWSSecurityAPI(),
            'azure': AzureSecurityAPI(),
            'gcp': GCPSecurityAPI()
        }
        self.notification_service = NotificationService()

    async def handle_security_incident(self, incident: SecurityIncident):
        """Orchestrate incident response across clouds"""
        response_actions = []

        # Immediate containment
        if incident.severity == 'CRITICAL':
            containment_tasks = []
            for affected_resource in incident.affected_resources:
                task = self._contain_resource(affected_resource)
                containment_tasks.append(task)

            containment_results = await asyncio.gather(*containment_tasks)
            response_actions.extend(containment_results)

        # Investigate across all clouds
        investigation_results = await self._investigate_lateral_movement(incident)

        # Apply remediation
        remediation_plan = self._generate_remediation_plan(
            incident, investigation_results
        )

        remediation_results = await self._execute_remediation(remediation_plan)
        response_actions.extend(remediation_results)

        # Update security policies
        policy_updates = self._generate_policy_updates(incident)
        await self._apply_policy_updates(policy_updates)

        # Generate report
        report = self._generate_incident_report(
            incident, response_actions, remediation_results
        )

        await self.notification_service.send_incident_report(report)

        return report

    async def _contain_resource(self, resource: AffectedResource):
        """Immediately contain compromised resource"""
        cloud_api = self.cloud_apis[resource.cloud]

        actions = []

        # Isolate network
        if resource.type in ['vm', 'instance', 'container']:
            isolation_result = await cloud_api.isolate_network(resource.id)
            actions.append({
                'action': 'network_isolation',
                'resource': resource.id,
                'result': isolation_result
            })

        # Revoke credentials
        if resource.has_credentials:
            revoke_result = await cloud_api.revoke_credentials(resource.id)
            actions.append({
                'action': 'credential_revocation',
                'resource': resource.id,
                'result': revoke_result
            })

        # Create snapshot for forensics
        if resource.type in ['vm', 'disk', 'database']:
            snapshot_result = await cloud_api.create_forensic_snapshot(resource.id)
            actions.append({
                'action': 'forensic_snapshot',
                'resource': resource.id,
                'result': snapshot_result
            })

        return actions

    async def _investigate_lateral_movement(self, incident: SecurityIncident):
        """Check for lateral movement across clouds"""
        investigation_tasks = []

        for cloud, api in self.cloud_apis.items():
            # Check access logs
            task = api.analyze_access_logs(
                start_time=incident.detected_at - timedelta(hours=24),
                end_time=incident.detected_at,
                source_ips=incident.source_ips,
                suspicious_patterns=incident.indicators
            )
            investigation_tasks.append(task)

        results = await asyncio.gather(*investigation_tasks)

        # Correlate findings across clouds
        correlated_findings = self._correlate_findings(results)

        return correlated_findings
```

## Best Practices for Zero Trust Multi-Cloud

1. **Identity-First Security**: Start with strong identity management
2. **Automate Policy Enforcement**: Use Policy-as-Code everywhere
3. **Continuous Verification**: Never trust, always verify
4. **Micro-Segmentation**: Implement fine-grained network controls
5. **Encrypt Everything**: Data at rest and in transit
6. **Monitor Continuously**: Real-time security monitoring
7. **Automate Response**: Quick incident containment
8. **Regular Audits**: Compliance and security assessments

## Conclusion

Implementing Zero Trust in multi-cloud environments requires a comprehensive approach combining identity management, policy enforcement, network security, and continuous monitoring. By treating every request as potentially hostile and implementing defense in depth, organizations can maintain security across diverse cloud platforms while enabling business agility.

## Additional Resources

- [NIST Zero Trust Architecture](https://www.nist.gov/publications/zero-trust-architecture)
- [Google BeyondCorp](https://cloud.google.com/beyondcorp)
- [Microsoft Zero Trust Deployment Guide](https://docs.microsoft.com/en-us/security/zero-trust/)
- [AWS Zero Trust on AWS](https://aws.amazon.com/security/zero-trust/)
- [CNCF Zero Trust Whitepaper](https://www.cncf.io/blog/2021/05/12/zero-trust-whitepaper/)

Tomorrow, we'll explore DevOps Excellence and best practices for 2025. Stay tuned!
