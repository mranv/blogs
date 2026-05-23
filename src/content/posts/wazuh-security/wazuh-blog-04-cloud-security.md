---
title: "Cloud Security Mastery: Multi-Cloud Correlation Rules with Wazuh"
slug: "wazuh-blog-04-cloud-security"
description: "Master cloud security operations using Wazuh's multi-cloud correlation rules. Learn to build unified security monitoring across AWS, Azure, GCP, and containerized environments with advanced threat detection."
author: "Anubhav Gain"
pubDatetime: 2025-01-28T00:00:00Z
tags:
  - general
  - wazuh
  - cloud-security
  - multi-cloud
  - correlation-rules
  - aws
  - azure
  - gcp
  - containers
  - cybersecurity
categories:
  - Security
featured: true
draft: false
---

# Cloud Security Mastery: Multi-Cloud Correlation Rules with Wazuh

## Introduction

As enterprises embrace multi-cloud strategies, security teams face an exponential increase in complexity. With 53% of organizations finding cloud threat detection more challenging than traditional environments and container escape vulnerabilities like CVE-2025-23266 threatening AI ecosystems, comprehensive cloud security monitoring is no longer optional—it's survival. This guide demonstrates how Wazuh's multi-cloud correlation rules provide unified security across AWS, Azure, GCP, and containerized environments.

## Multi-Cloud Architecture Overview

### The Challenge Landscape

- **37% of organizations** require >24 hours for cloud exposure validation
- **Average 14 different security tools** per cloud provider
- **427% increase** in cloud security incidents year-over-year
- **$3.86M average cost** of cloud security breaches

### Wazuh Multi-Cloud Integration Architecture

```yaml
# Multi-Cloud Wazuh Architecture
cloud_integration:
  aws:
    services:
      - CloudTrail
      - GuardDuty
      - VPC Flow Logs
      - Config
      - Security Hub
    ingestion_method: "S3 bucket polling"

  azure:
    services:
      - Activity Logs
      - Security Center
      - Key Vault Logs
      - Network Watcher
    ingestion_method: "Event Hub streaming"

  gcp:
    services:
      - Cloud Audit Logs
      - Security Command Center
      - VPC Flow Logs
      - Cloud Asset Inventory
    ingestion_method: "Pub/Sub subscription"

  kubernetes:
    sources:
      - API Server Audit
      - Pod Security Policies
      - Network Policies
      - Admission Controllers
    ingestion_method: "Webhook receiver"
```

## AWS Security Monitoring

### CloudTrail Integration

```xml
<!-- AWS Root Account Usage Detection -->
<rule id="400001" level="12">
  <field name="aws.userIdentity.type">^Root$</field>
  <description>AWS Security: Root account usage detected</description>
  <group>aws,cloud_security,privileged_access</group>
  <mitre>
    <id>T1078.004</id>
  </mitre>
</rule>

<!-- Unauthorized Region Activity -->
<rule id="400002" level="10">
  <field name="aws.awsRegion" negate="yes">us-east-1|us-west-2|eu-west-1</field>
  <description>AWS Security: Activity in unauthorized region</description>
  <group>aws,cloud_security,geographic_anomaly</group>
</rule>

<!-- S3 Bucket Public Access Change -->
<rule id="400003" level="14">
  <field name="aws.eventName">^PutBucketPublicAccessBlock$</field>
  <field name="aws.requestParameters.publicAccessBlock" type="pcre2">BlockPublicAcls.*false</field>
  <description>AWS Security: S3 bucket made public - Critical exposure</description>
  <group>aws,cloud_security,data_exposure</group>
  <mitre>
    <id>T1530</id>
  </mitre>
</rule>

<!-- IAM Policy Elevation -->
<rule id="400004" level="12">
  <field name="aws.eventName">^(PutUserPolicy|AttachUserPolicy)$</field>
  <field name="aws.requestParameters.policyDocument" type="pcre2">\*:\*</field>
  <description>AWS Security: Administrative policy attached - privilege escalation</description>
  <group>aws,cloud_security,privilege_escalation</group>
  <mitre>
    <id>T1098</id>
  </mitre>
</rule>
```

### GuardDuty Integration

```xml
<!-- GuardDuty High Severity Findings -->
<rule id="400010" level="13">
  <field name="aws.service.serviceName">^guardduty$</field>
  <field name="aws.severity" compare=">=">7</field>
  <description>AWS GuardDuty: High severity threat detected</description>
  <group>aws,guardduty,threat_detection</group>
</rule>

<!-- Cryptocurrency Mining Detection -->
<rule id="400011" level="14">
  <field name="aws.service.action.actionType">^AWS_API_CALL$</field>
  <field name="aws.title" type="pcre2">CryptoCurrency|BitcoinTool|Mining</field>
  <description>AWS GuardDuty: Cryptocurrency mining activity detected</description>
  <group>aws,guardduty,cryptomining</group>
  <mitre>
    <id>T1496</id>
  </mitre>
</rule>
```

## Azure Security Monitoring

### Activity Log Correlation

```xml
<!-- Azure Key Vault Access Anomaly -->
<rule id="400020" level="11">
  <field name="azure.category">^KeyVault$</field>
  <field name="azure.operationName">^SecretGet$</field>
  <field name="azure.properties.clientInfo" negate="yes">AzurePortal</field>
  <description>Azure Security: Programmatic key vault access detected</description>
  <group>azure,cloud_security,secret_access</group>
</rule>

<!-- Virtual Machine Deletion -->
<rule id="400021" level="12">
  <field name="azure.operationName.value">^Microsoft.Compute/virtualMachines/delete$</field>
  <field name="azure.status.value">^Succeeded$</field>
  <description>Azure Security: Virtual machine deleted</description>
  <group>azure,cloud_security,resource_deletion</group>
  <mitre>
    <id>T1485</id>
  </mitre>
</rule>

<!-- Network Security Group Modification -->
<rule id="400022" level="10">
  <field name="azure.operationName.value" type="pcre2">NetworkSecurityGroups/securityRules/write</field>
  <field name="azure.properties.securityRuleAccess">^Allow$</field>
  <field name="azure.properties.securityRuleSourceAddressPrefix">^(\*|0\.0\.0\.0)$</field>
  <description>Azure Security: NSG rule allows unrestricted access</description>
  <group>azure,cloud_security,network_exposure</group>
</rule>
```

### Azure Security Center Integration

```xml
<!-- Security Recommendation Ignored -->
<rule id="400030" level="9">
  <field name="azure.properties.state">^Dismissed$</field>
  <field name="azure.properties.severity">^High$</field>
  <description>Azure Security Center: High severity recommendation dismissed</description>
  <group>azure,security_center,compliance</group>
</rule>

<!-- Just-In-Time Access Request -->
<rule id="400031" level="7">
  <field name="azure.operationName.value">^Microsoft.Security/locations/jitNetworkAccessPolicies</field>
  <field name="azure.status.value">^Accepted$</field>
  <description>Azure Security: JIT access request approved</description>
  <group>azure,security_center,jit_access</group>
</rule>
```

## Google Cloud Platform Security

### Cloud Audit Logs

```xml
<!-- GCP Service Account Key Creation -->
<rule id="400040" level="11">
  <field name="gcp.protoPayload.methodName">^google.iam.admin.v1.CreateServiceAccountKey$</field>
  <description>GCP Security: Service account key created</description>
  <group>gcp,cloud_security,credential_creation</group>
  <mitre>
    <id>T1098</id>
  </mitre>
</rule>

<!-- Compute Instance External IP Assignment -->
<rule id="400041" level="9">
  <field name="gcp.protoPayload.resourceName" type="pcre2">compute\.instances</field>
  <field name="gcp.protoPayload.request.networkInterfaces.accessConfigs.type">^ONE_TO_ONE_NAT$</field>
  <description>GCP Security: External IP assigned to compute instance</description>
  <group>gcp,cloud_security,network_exposure</group>
</rule>

<!-- Cloud Storage Bucket Permission Change -->
<rule id="400042" level="12">
  <field name="gcp.protoPayload.methodName">^storage.setIamPermissions$</field>
  <field name="gcp.protoPayload.serviceData.policyDelta.bindingDeltas.member">^allUsers$</field>
  <description>GCP Security: Storage bucket made publicly accessible</description>
  <group>gcp,cloud_security,data_exposure</group>
  <mitre>
    <id>T1530</id>
  </mitre>
</rule>

<!-- Firewall Rule Modification -->
<rule id="400043" level="10">
  <field name="gcp.protoPayload.methodName">^compute.firewalls.insert$</field>
  <field name="gcp.protoPayload.request.sourceRanges">0.0.0.0/0</field>
  <field name="gcp.protoPayload.request.allowed.ports">22|3389|3306|5432</field>
  <description>GCP Security: Firewall rule allows sensitive ports from anywhere</description>
  <group>gcp,cloud_security,firewall_misconfiguration</group>
</rule>
```

## Container Security Correlation

### Kubernetes Security Events

```xml
<!-- Container Escape Detection -->
<rule id="400050" level="15">
  <field name="kubernetes.objectRef.resource">^pods$</field>
  <field name="kubernetes.requestObject.spec.hostPID">true</field>
  <field name="kubernetes.requestObject.spec.containers.securityContext.privileged">true</field>
  <description>Container Security: High-risk pod with host access detected</description>
  <group>kubernetes,container_security,escape_risk</group>
  <mitre>
    <id>T1611</id>
  </mitre>
</rule>

<!-- Unauthorized Kubectl Exec -->
<rule id="400051" level="12">
  <field name="kubernetes.verb">^create$</field>
  <field name="kubernetes.objectRef.subresource">^exec$</field>
  <field name="kubernetes.user.username" negate="yes">system:admin|system:masters</field>
  <description>Container Security: Non-admin kubectl exec detected</description>
  <group>kubernetes,container_security,suspicious_execution</group>
</rule>

<!-- Secrets Access Pattern -->
<rule id="400052" level="10">
  <field name="kubernetes.objectRef.resource">^secrets$</field>
  <field name="kubernetes.verb">^(get|list)$</field>
  <description>Container Security: Kubernetes secrets accessed</description>
  <group>kubernetes,container_security,secret_access</group>
</rule>

<rule id="400053" level="13" frequency="10" timeframe="300">
  <if_matched_rules>400052</if_matched_rules>
  <same_field>kubernetes.user.username</same_field>
  <description>Container Security: Multiple secrets accessed - potential enumeration</description>
  <group>kubernetes,container_security,secret_enumeration</group>
  <mitre>
    <id>T1552</id>
  </mitre>
</rule>
```

### Docker Runtime Security

```xml
<!-- Privileged Container Launch -->
<rule id="400060" level="11">
  <field name="docker.action">^create$</field>
  <field name="docker.attributes.privileged">true</field>
  <description>Docker Security: Privileged container created</description>
  <group>docker,container_security,privilege_risk</group>
</rule>

<!-- Container Breakout Attempt -->
<rule id="400061" level="14">
  <field name="docker.action">^exec$</field>
  <field name="docker.attributes.cmd" type="pcre2">nsenter|/proc/self/exe|/proc/1/root</field>
  <description>Docker Security: Container breakout attempt detected</description>
  <group>docker,container_security,breakout_attempt</group>
  <mitre>
    <id>T1611</id>
  </mitre>
</rule>
```

## Cross-Cloud Correlation

### Multi-Cloud Lateral Movement

```xml
<!-- Cross-Cloud Access Pattern -->
<rule id="400070" level="0">
  <decoded_as>cloud_correlation_helper</decoded_as>
  <description>Cloud Correlation Helper</description>
  <options>no_log</options>
</rule>

<!-- AWS to Azure Movement -->
<rule id="400071" level="12" frequency="2" timeframe="3600">
  <if_group>aws,cloud_security</if_group>
  <if_matched_group>azure,cloud_security</if_matched_group>
  <same_field>srcip</same_field>
  <description>Multi-Cloud: Same IP accessing AWS and Azure - possible lateral movement</description>
  <group>multi_cloud,lateral_movement</group>
</rule>

<!-- Simultaneous Multi-Cloud Activity -->
<rule id="400072" level="13" frequency="3" timeframe="300">
  <if_group>cloud_security</if_group>
  <same_field>user.email</same_field>
  <different_field>cloud.provider</different_field>
  <description>Multi-Cloud: Simultaneous activity across multiple clouds</description>
  <group>multi_cloud,suspicious_activity</group>
</rule>
```

### Cloud Resource Correlation

```python
# Multi-Cloud Resource Tracking
class CloudResourceCorrelator:
    def __init__(self):
        self.resource_map = {
            'aws': {},
            'azure': {},
            'gcp': {},
            'kubernetes': {}
        }

    def correlate_resources(self, event):
        """Correlate resources across cloud providers"""
        provider = event['cloud']['provider']
        resource_id = self.extract_resource_id(event)

        # Check for cross-cloud references
        cross_references = []
        for other_provider, resources in self.resource_map.items():
            if other_provider != provider:
                for res_id, res_data in resources.items():
                    if self.is_related(resource_id, res_id, res_data):
                        cross_references.append({
                            'provider': other_provider,
                            'resource': res_id,
                            'relationship': self.determine_relationship(
                                resource_id, res_id
                            )
                        })

        return cross_references

    def detect_resource_sprawl(self):
        """Detect unauthorized resource proliferation"""
        sprawl_indicators = []

        for provider, resources in self.resource_map.items():
            # Check for rapid resource creation
            recent_creates = [
                r for r in resources.values()
                if r['created'] > datetime.now() - timedelta(hours=1)
            ]

            if len(recent_creates) > 10:
                sprawl_indicators.append({
                    'provider': provider,
                    'resources_created': len(recent_creates),
                    'risk_level': 'HIGH'
                })

        return sprawl_indicators
```

## Cloud-Native Security Patterns

### Serverless Security Monitoring

```xml
<!-- Lambda Function Modification -->
<rule id="400080" level="11">
  <field name="aws.eventName">^UpdateFunctionConfiguration$</field>
  <field name="aws.requestParameters.environment" type="pcre2">SECRET|KEY|PASSWORD</field>
  <description>Serverless Security: Lambda environment variables contain secrets</description>
  <group>serverless,cloud_security,secret_exposure</group>
</rule>

<!-- Azure Function Scaling Anomaly -->
<rule id="400081" level="10">
  <field name="azure.operationName.value">^Microsoft.Web/sites/functions/scale$</field>
  <field name="azure.properties.instanceCount" compare=">=">50</field>
  <description>Serverless Security: Unusual Azure Function scaling detected</description>
  <group>serverless,cloud_security,resource_abuse</group>
</rule>

<!-- GCP Cloud Function Permission Change -->
<rule id="400082" level="12">
  <field name="gcp.protoPayload.methodName">^google.cloud.functions.v1.SetIamPolicy$</field>
  <field name="gcp.protoPayload.request.policy.bindings.members">allUsers</field>
  <description>Serverless Security: Cloud Function made publicly invocable</description>
  <group>serverless,cloud_security,access_control</group>
</rule>
```

### Container Registry Security

```xml
<!-- Vulnerable Image Push -->
<rule id="400090" level="13">
  <field name="container.registry.action">^push$</field>
  <field name="container.image.vulnerabilities.critical" compare=">=">1</field>
  <description>Container Registry: Image with critical vulnerabilities pushed</description>
  <group>container_registry,vulnerability</group>
</rule>

<!-- Unsigned Image Deployment -->
<rule id="400091" level="11">
  <field name="kubernetes.objectRef.resource">^deployments$</field>
  <field name="kubernetes.requestObject.spec.template.spec.containers.image" negate="yes">@sha256:</field>
  <description>Container Security: Unsigned image deployment attempted</description>
  <group>container_security,image_integrity</group>
</rule>
```

## Advanced Cloud Threat Detection

### Cloud Cryptomining Detection

```python
# Cloud Resource Abuse Detection
class CloudCryptominingDetector:
    def __init__(self):
        self.mining_indicators = {
            'instance_names': ['xmr', 'mine', 'crypto', 'coin'],
            'processes': ['xmrig', 'minergate', 'nicehash'],
            'network_patterns': {
                'ports': [3333, 4444, 5555, 8333],
                'domains': ['pool.', 'mining.', '.nicehash.com']
            },
            'resource_patterns': {
                'cpu_threshold': 0.95,
                'gpu_enabled': True,
                'network_egress': 1000000000  # 1GB/hour
            }
        }

    def analyze_instance(self, instance_data):
        """Detect cryptomining on cloud instances"""
        risk_score = 0
        indicators = []

        # Check instance name
        instance_name = instance_data.get('name', '').lower()
        for indicator in self.mining_indicators['instance_names']:
            if indicator in instance_name:
                risk_score += 20
                indicators.append(f'Suspicious name: {instance_name}')

        # Check resource usage
        if instance_data.get('cpu_usage', 0) > self.mining_indicators['resource_patterns']['cpu_threshold']:
            risk_score += 30
            indicators.append('High CPU usage')

        # Check network patterns
        for connection in instance_data.get('network_connections', []):
            if connection['port'] in self.mining_indicators['network_patterns']['ports']:
                risk_score += 25
                indicators.append(f'Mining pool port: {connection["port"]}')

        return {
            'risk_score': risk_score,
            'indicators': indicators,
            'recommendation': self.get_recommendation(risk_score)
        }
```

### Cross-Cloud Attack Chain Detection

```xml
<!-- Initial Compromise in AWS -->
<rule id="400100" level="10">
  <field name="aws.eventName">^AssumeRole$</field>
  <field name="aws.errorCode">^AccessDenied$</field>
  <frequency>5</frequency>
  <timeframe>300</timeframe>
  <description>Attack Chain: Multiple failed role assumption attempts in AWS</description>
  <group>attack_chain,initial_access</group>
</rule>

<!-- Lateral Movement to Azure -->
<rule id="400101" level="12">
  <if_matched_rules>400100</if_matched_rules>
  <field name="azure.category">^SignIn$</field>
  <field name="azure.properties.status.errorCode">^50126$</field>
  <same_field>srcip</same_field>
  <description>Attack Chain: Same IP failing auth in Azure after AWS attempts</description>
  <group>attack_chain,lateral_movement</group>
</rule>

<!-- Data Exfiltration from GCP -->
<rule id="400102" level="14">
  <if_matched_rules>400101</if_matched_rules>
  <field name="gcp.protoPayload.methodName">^storage.objects.get$</field>
  <same_field>srcip</same_field>
  <frequency>50</frequency>
  <timeframe>3600</timeframe>
  <description>Attack Chain: Mass data access in GCP after multi-cloud compromise</description>
  <group>attack_chain,data_exfiltration</group>
  <mitre>
    <id>T1537</id>
  </mitre>
</rule>
```

## Cloud Security Posture Management

### Configuration Compliance Monitoring

```python
# Cloud Security Posture Assessment
class CloudPostureAnalyzer:
    def __init__(self):
        self.compliance_frameworks = {
            'cis_aws': self.load_cis_aws_benchmarks(),
            'cis_azure': self.load_cis_azure_benchmarks(),
            'cis_gcp': self.load_cis_gcp_benchmarks(),
            'pci_dss': self.load_pci_requirements()
        }

    def assess_resource(self, resource, framework='cis_aws'):
        """Assess resource against compliance framework"""
        benchmarks = self.compliance_frameworks[framework]
        findings = []

        for benchmark in benchmarks:
            if benchmark['resource_type'] == resource['type']:
                result = self.evaluate_benchmark(resource, benchmark)
                if not result['compliant']:
                    findings.append({
                        'benchmark_id': benchmark['id'],
                        'severity': benchmark['severity'],
                        'description': benchmark['description'],
                        'remediation': benchmark['remediation'],
                        'evidence': result['evidence']
                    })

        return {
            'resource_id': resource['id'],
            'compliance_score': self.calculate_score(findings),
            'findings': findings
        }
```

### Automated Remediation

```xml
<!-- Auto-Remediation Rules -->
<ossec_config>
  <!-- S3 Bucket Public Access -->
  <active-response>
    <command>remediate-s3-public</command>
    <location>server</location>
    <rules_id>400003</rules_id>
    <timeout>0</timeout>
  </active-response>

  <!-- Overly Permissive Security Group -->
  <active-response>
    <command>restrict-security-group</command>
    <location>server</location>
    <rules_id>400022</rules_id>
    <timeout>0</timeout>
  </active-response>

  <!-- Vulnerable Container -->
  <active-response>
    <command>quarantine-container</command>
    <location>local</location>
    <rules_id>400090</rules_id>
    <timeout>0</timeout>
  </active-response>
</ossec_config>
```

## Performance Optimization

### Cloud Log Ingestion Optimization

```yaml
# Optimized ingestion configuration
cloud_ingestion:
  aws:
    batch_size: 1000
    parallelism: 10
    compression: gzip
    filters:
      - service: ["s3", "ec2", "iam", "rds"]
      - severity: ["ERROR", "WARNING", "CRITICAL"]

  azure:
    streaming:
      partitions: 8
      checkpoint_interval: 30s
    deduplication: true

  gcp:
    subscription:
      ack_deadline: 60s
      max_messages: 500
    retry_policy:
      minimum_backoff: 10s
      maximum_backoff: 600s
```

### Correlation Engine Tuning

```python
# Distributed correlation for cloud scale
class DistributedCloudCorrelator:
    def __init__(self, redis_cluster):
        self.redis = redis_cluster
        self.correlation_window = 3600  # 1 hour
        self.batch_size = 10000

    def process_event_batch(self, events):
        """Process events in distributed manner"""
        # Partition events by correlation key
        partitions = self.partition_events(events)

        # Process partitions in parallel
        with multiprocessing.Pool() as pool:
            results = pool.map(
                self.correlate_partition,
                partitions
            )

        # Aggregate results
        return self.aggregate_correlations(results)
```

## ROI and Metrics

### Cloud Security Metrics Dashboard

```json
{
  "cloud_security_metrics": {
    "total_resources_monitored": {
      "aws": 15234,
      "azure": 8921,
      "gcp": 6782,
      "containers": 3421
    },
    "threats_detected": {
      "cryptomining": 23,
      "data_exfiltration": 7,
      "privilege_escalation": 31,
      "misconfigurations": 156
    },
    "compliance_posture": {
      "cis_score": 87.3,
      "pci_compliant_resources": 94.2,
      "critical_findings": 3,
      "auto_remediated": 89
    },
    "cost_optimization": {
      "unused_resources_identified": 342,
      "potential_savings": "$45,230/month",
      "over_provisioned_instances": 78
    },
    "mean_time_to_detect": "3.7 minutes",
    "mean_time_to_respond": "12.4 minutes",
    "false_positive_rate": 4.2
  }
}
```

## Best Practices

### 1. Cloud-Native Integration

```yaml
# Native service integration
integrations:
  aws:
    use_eventbridge: true # Real-time events
    enable_cloudtrail_insights: true
    config_recorder: all_supported_resources

  azure:
    use_event_grid: true
    enable_sentinel_connector: true
    diagnostic_settings: all_resources

  gcp:
    use_security_command_center: true
    enable_event_threat_detection: true
    asset_inventory: real_time
```

### 2. Zero Trust Cloud Security

```python
# Zero Trust verification for cloud resources
def verify_cloud_access(request):
    """Implement Zero Trust for cloud resource access"""
    checks = {
        'identity_verified': verify_identity(request.user),
        'device_compliant': check_device_compliance(request.device),
        'location_allowed': verify_location(request.source_ip),
        'risk_acceptable': calculate_risk_score(request) < 70,
        'mfa_completed': verify_mfa(request.session)
    }

    # All checks must pass
    return all(checks.values()), checks
```

## Conclusion

Multi-cloud security requires a unified approach that transcends individual platform boundaries. Wazuh's correlation capabilities, combined with cloud-native integrations and intelligent detection rules, provide the visibility and control needed to secure modern cloud infrastructures. The key is not just monitoring each cloud in isolation, but understanding the connections and patterns that span across them.

## Next Steps

1. Deploy cloud-specific integrations for each provider
2. Implement cross-cloud correlation rules
3. Establish baseline behavior for cloud resources
4. Configure automated remediation workflows
5. Integrate with cloud-native security services

Remember: In the cloud, security is a shared responsibility, but visibility is entirely yours. Make it count.
