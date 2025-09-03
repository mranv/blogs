---
title: "The Complete Guide to Amazon Route 53: DNS Management, Traffic Routing, and Domain Services"
description: "Master Amazon Route 53 with this comprehensive guide covering DNS management, health checks, traffic policies, and advanced routing strategies for scalable web applications."
publishDate: 2024-12-09
author: "Anubhav Gain"
category: "Cloud Computing"
tags:
  - aws
  - route53
  - dns
  - domain
  - traffic-routing
  - load-balancing
  - health-checks
  - cdn
  - networking
featured: true
draft: false
slug: "complete-guide-amazon-route53-dns"
---

# The Complete Guide to Amazon Route 53: DNS Management, Traffic Routing, and Domain Services

Amazon Route 53 is AWS's highly available and scalable cloud Domain Name System (DNS) web service. It connects user requests to AWS infrastructure and can be used to route users to infrastructure outside of AWS. This guide covers everything from basic DNS management to advanced traffic routing strategies.

## Table of Contents
1. [Introduction to Route 53](#introduction)
2. [Core Concepts](#core-concepts)
3. [DNS Record Types](#dns-records)
4. [Hosted Zones Management](#hosted-zones)
5. [Health Checks](#health-checks)
6. [Traffic Routing Policies](#traffic-routing)
7. [Domain Registration](#domain-registration)
8. [Advanced Features](#advanced-features)
9. [Integration with AWS Services](#aws-integration)
10. [Best Practices](#best-practices)
11. [Security and Compliance](#security)
12. [Cost Optimization](#cost-optimization)
13. [Troubleshooting](#troubleshooting)

## Introduction to Route 53 {#introduction}

Amazon Route 53 is a DNS service that translates domain names into IP addresses, directing traffic to appropriate resources. Named after the DNS port 53, it provides three main services:

### Key Services:
- **DNS Service**: Translate domain names to IP addresses
- **Domain Registration**: Register and manage domain names
- **Health Checking**: Monitor endpoint health and route traffic accordingly

### Benefits:
- **High Availability**: 100% SLA for DNS queries
- **Global Performance**: Anycast network for fast response times
- **Scalability**: Handles billions of queries per day
- **Integration**: Seamless integration with AWS services
- **Cost-effective**: Pay only for what you use

## Core Concepts {#core-concepts}

### DNS Fundamentals

```python
import boto3
import json
from datetime import datetime

# Initialize Route 53 client
route53 = boto3.client('route53')

def explain_dns_resolution():
    """
    Explain the DNS resolution process
    """
    process = {
        "1_user_request": "User types 'example.com' in browser",
        "2_recursive_resolver": "DNS resolver checks cache, then queries root servers",
        "3_root_servers": "Root servers respond with TLD servers (.com)",
        "4_tld_servers": "TLD servers respond with authoritative servers",
        "5_authoritative_servers": "Route 53 responds with IP address",
        "6_response": "Browser connects to IP address"
    }
    
    return process

# DNS hierarchy example
dns_hierarchy = {
    "root": ".",
    "top_level_domains": [".com", ".org", ".net", ".edu"],
    "second_level_domains": ["example.com", "google.com", "aws.com"],
    "subdomains": ["www.example.com", "api.example.com", "cdn.example.com"]
}

print("DNS Resolution Process:")
for step, description in explain_dns_resolution().items():
    print(f"{step}: {description}")
```

### Route 53 Architecture

```python
def route53_components():
    """
    Overview of Route 53 components
    """
    components = {
        "hosted_zones": {
            "description": "Container for DNS records for a domain",
            "types": ["public", "private"],
            "use_cases": ["Internet-facing domains", "Internal AWS resources"]
        },
        "record_sets": {
            "description": "DNS records that define how to respond to queries",
            "types": ["A", "AAAA", "CNAME", "MX", "TXT", "SRV"],
            "routing_policies": ["simple", "weighted", "latency-based", "failover", "geolocation", "geoproximity", "multivalue"]
        },
        "health_checks": {
            "description": "Monitor endpoint availability",
            "types": ["HTTP", "HTTPS", "TCP", "calculated", "CloudWatch alarm"],
            "features": ["failover", "notification", "string matching"]
        },
        "resolver": {
            "description": "DNS resolution for VPC",
            "features": ["conditional forwarding", "DNS firewall", "query logging"]
        }
    }
    
    return components

print("Route 53 Components:")
print(json.dumps(route53_components(), indent=2))
```

## DNS Record Types {#dns-records}

### Managing DNS Records

```python
class Route53RecordManager:
    def __init__(self):
        self.route53 = boto3.client('route53')
    
    def create_a_record(self, hosted_zone_id, name, ip_address, ttl=300):
        """
        Create an A record
        """
        try:
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating A record for {name}',
                    'Changes': [
                        {
                            'Action': 'CREATE',
                            'ResourceRecordSet': {
                                'Name': name,
                                'Type': 'A',
                                'TTL': ttl,
                                'ResourceRecords': [
                                    {'Value': ip_address}
                                ]
                            }
                        }
                    ]
                }
            )
            
            print(f"A record created for {name} -> {ip_address}")
            return response
            
        except Exception as e:
            print(f"Error creating A record: {e}")
    
    def create_cname_record(self, hosted_zone_id, name, target, ttl=300):
        """
        Create a CNAME record
        """
        try:
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating CNAME record for {name}',
                    'Changes': [
                        {
                            'Action': 'CREATE',
                            'ResourceRecordSet': {
                                'Name': name,
                                'Type': 'CNAME',
                                'TTL': ttl,
                                'ResourceRecords': [
                                    {'Value': target}
                                ]
                            }
                        }
                    ]
                }
            )
            
            print(f"CNAME record created for {name} -> {target}")
            return response
            
        except Exception as e:
            print(f"Error creating CNAME record: {e}")
    
    def create_mx_record(self, hosted_zone_id, name, mail_servers, ttl=300):
        """
        Create MX records for email
        """
        try:
            resource_records = []
            for priority, server in mail_servers:
                resource_records.append({'Value': f'{priority} {server}'})
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating MX records for {name}',
                    'Changes': [
                        {
                            'Action': 'CREATE',
                            'ResourceRecordSet': {
                                'Name': name,
                                'Type': 'MX',
                                'TTL': ttl,
                                'ResourceRecords': resource_records
                            }
                        }
                    ]
                }
            )
            
            print(f"MX records created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating MX records: {e}")
    
    def create_txt_record(self, hosted_zone_id, name, text_value, ttl=300):
        """
        Create TXT record for verification or configuration
        """
        try:
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating TXT record for {name}',
                    'Changes': [
                        {
                            'Action': 'CREATE',
                            'ResourceRecordSet': {
                                'Name': name,
                                'Type': 'TXT',
                                'TTL': ttl,
                                'ResourceRecords': [
                                    {'Value': f'"{text_value}"'}
                                ]
                            }
                        }
                    ]
                }
            )
            
            print(f"TXT record created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating TXT record: {e}")
    
    def create_alias_record(self, hosted_zone_id, name, alias_target, record_type='A'):
        """
        Create an alias record pointing to AWS resources
        """
        try:
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating alias record for {name}',
                    'Changes': [
                        {
                            'Action': 'CREATE',
                            'ResourceRecordSet': {
                                'Name': name,
                                'Type': record_type,
                                'AliasTarget': {
                                    'DNSName': alias_target['dns_name'],
                                    'EvaluateTargetHealth': alias_target.get('evaluate_health', False),
                                    'HostedZoneId': alias_target['hosted_zone_id']
                                }
                            }
                        }
                    ]
                }
            )
            
            print(f"Alias record created for {name} -> {alias_target['dns_name']}")
            return response
            
        except Exception as e:
            print(f"Error creating alias record: {e}")

# Usage examples
record_manager = Route53RecordManager()

# Example hosted zone ID (replace with actual)
hosted_zone_id = 'Z1D633PJN98FT9'

# Create various record types
record_manager.create_a_record(hosted_zone_id, 'web.example.com', '192.0.2.1')
record_manager.create_cname_record(hosted_zone_id, 'www.example.com', 'web.example.com')

# MX records for email
mail_servers = [
    (10, 'mail1.example.com'),
    (20, 'mail2.example.com'),
    (30, 'mail3.example.com')
]
record_manager.create_mx_record(hosted_zone_id, 'example.com', mail_servers)

# TXT record for domain verification
record_manager.create_txt_record(hosted_zone_id, '_amazonses.example.com', 'verification_string_here')

# Alias record pointing to Application Load Balancer
alb_alias_target = {
    'dns_name': 'my-alb-1234567890.us-east-1.elb.amazonaws.com',
    'hosted_zone_id': 'Z35SXDOTRQ7X7K',  # ALB hosted zone ID for us-east-1
    'evaluate_health': True
}
record_manager.create_alias_record(hosted_zone_id, 'app.example.com', alb_alias_target)
```

## Hosted Zones Management {#hosted-zones}

### Creating and Managing Hosted Zones

```python
class HostedZoneManager:
    def __init__(self):
        self.route53 = boto3.client('route53')
    
    def create_public_hosted_zone(self, domain_name, caller_reference=None):
        """
        Create a public hosted zone
        """
        if not caller_reference:
            caller_reference = f"{domain_name}-{int(datetime.now().timestamp())}"
        
        try:
            response = self.route53.create_hosted_zone(
                Name=domain_name,
                CallerReference=caller_reference,
                HostedZoneConfig={
                    'Comment': f'Public hosted zone for {domain_name}',
                    'PrivateZone': False
                }
            )
            
            hosted_zone_id = response['HostedZone']['Id'].split('/')[-1]
            name_servers = [ns['Value'] for ns in response['DelegationSet']['NameServers']]
            
            print(f"Public hosted zone created: {hosted_zone_id}")
            print(f"Name servers: {name_servers}")
            
            return {
                'hosted_zone_id': hosted_zone_id,
                'name_servers': name_servers,
                'response': response
            }
            
        except Exception as e:
            print(f"Error creating public hosted zone: {e}")
    
    def create_private_hosted_zone(self, domain_name, vpc_id, vpc_region, caller_reference=None):
        """
        Create a private hosted zone for VPC
        """
        if not caller_reference:
            caller_reference = f"{domain_name}-private-{int(datetime.now().timestamp())}"
        
        try:
            response = self.route53.create_hosted_zone(
                Name=domain_name,
                CallerReference=caller_reference,
                VPC={
                    'VPCRegion': vpc_region,
                    'VPCId': vpc_id
                },
                HostedZoneConfig={
                    'Comment': f'Private hosted zone for {domain_name} in VPC {vpc_id}',
                    'PrivateZone': True
                }
            )
            
            hosted_zone_id = response['HostedZone']['Id'].split('/')[-1]
            
            print(f"Private hosted zone created: {hosted_zone_id}")
            
            return {
                'hosted_zone_id': hosted_zone_id,
                'response': response
            }
            
        except Exception as e:
            print(f"Error creating private hosted zone: {e}")
    
    def associate_vpc_with_private_zone(self, hosted_zone_id, vpc_id, vpc_region):
        """
        Associate additional VPC with private hosted zone
        """
        try:
            response = self.route53.associate_vpc_with_hosted_zone(
                HostedZoneId=hosted_zone_id,
                VPC={
                    'VPCRegion': vpc_region,
                    'VPCId': vpc_id
                },
                Comment=f'Associating VPC {vpc_id} with hosted zone {hosted_zone_id}'
            )
            
            print(f"VPC {vpc_id} associated with hosted zone {hosted_zone_id}")
            return response
            
        except Exception as e:
            print(f"Error associating VPC: {e}")
    
    def list_hosted_zones(self):
        """
        List all hosted zones
        """
        try:
            response = self.route53.list_hosted_zones()
            
            zones_info = []
            for zone in response['HostedZones']:
                zone_id = zone['Id'].split('/')[-1]
                zones_info.append({
                    'id': zone_id,
                    'name': zone['Name'],
                    'private': zone['Config']['PrivateZone'],
                    'record_count': zone['ResourceRecordSetCount'],
                    'comment': zone['Config'].get('Comment', 'No comment')
                })
            
            return zones_info
            
        except Exception as e:
            print(f"Error listing hosted zones: {e}")
            return []
    
    def get_hosted_zone_records(self, hosted_zone_id):
        """
        Get all records in a hosted zone
        """
        try:
            paginator = self.route53.get_paginator('list_resource_record_sets')
            
            records = []
            for page in paginator.paginate(HostedZoneId=hosted_zone_id):
                for record in page['ResourceRecordSets']:
                    record_info = {
                        'name': record['Name'],
                        'type': record['Type'],
                        'ttl': record.get('TTL', 'N/A (Alias)'),
                    }
                    
                    if 'ResourceRecords' in record:
                        record_info['values'] = [rr['Value'] for rr in record['ResourceRecords']]
                    elif 'AliasTarget' in record:
                        record_info['alias_target'] = record['AliasTarget']['DNSName']
                    
                    records.append(record_info)
            
            return records
            
        except Exception as e:
            print(f"Error getting hosted zone records: {e}")
            return []

# Usage examples
hz_manager = HostedZoneManager()

# Create public hosted zone
public_zone = hz_manager.create_public_hosted_zone('example.com')

# Create private hosted zone
private_zone = hz_manager.create_private_hosted_zone(
    'internal.example.com',
    'vpc-12345678',
    'us-east-1'
)

# List all hosted zones
zones = hz_manager.list_hosted_zones()
print("Hosted Zones:")
for zone in zones:
    print(f"  {zone['name']} ({zone['id']}) - {'Private' if zone['private'] else 'Public'}")

# Get records for a hosted zone
if public_zone:
    records = hz_manager.get_hosted_zone_records(public_zone['hosted_zone_id'])
    print(f"\nRecords in {public_zone['hosted_zone_id']}:")
    for record in records:
        print(f"  {record['name']} ({record['type']}): {record.get('values', record.get('alias_target', 'N/A'))}")
```

## Health Checks {#health-checks}

### Creating and Managing Health Checks

```python
class HealthCheckManager:
    def __init__(self):
        self.route53 = boto3.client('route53')
    
    def create_http_health_check(self, fqdn, port=80, path='/', request_interval=30):
        """
        Create HTTP health check
        """
        try:
            response = self.route53.create_health_check(
                Type='HTTP',
                ResourcePath=path,
                FullyQualifiedDomainName=fqdn,
                Port=port,
                RequestInterval=request_interval,
                FailureThreshold=3,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': f'HTTP-{fqdn}-{port}'
                    },
                    {
                        'Key': 'Protocol',
                        'Value': 'HTTP'
                    }
                ]
            )
            
            health_check_id = response['HealthCheck']['Id']
            print(f"HTTP health check created: {health_check_id}")
            
            return health_check_id
            
        except Exception as e:
            print(f"Error creating HTTP health check: {e}")
    
    def create_https_health_check(self, fqdn, port=443, path='/', request_interval=30, enable_sni=True):
        """
        Create HTTPS health check with SNI support
        """
        try:
            health_check_config = {
                'Type': 'HTTPS_STR_MATCH',
                'ResourcePath': path,
                'FullyQualifiedDomainName': fqdn,
                'Port': port,
                'RequestInterval': request_interval,
                'FailureThreshold': 3,
                'SearchString': '200 OK',  # String to search for in response
                'EnableSNI': enable_sni
            }
            
            response = self.route53.create_health_check(**health_check_config)
            
            health_check_id = response['HealthCheck']['Id']
            print(f"HTTPS health check created: {health_check_id}")
            
            return health_check_id
            
        except Exception as e:
            print(f"Error creating HTTPS health check: {e}")
    
    def create_tcp_health_check(self, fqdn, port, request_interval=30):
        """
        Create TCP health check
        """
        try:
            response = self.route53.create_health_check(
                Type='TCP',
                FullyQualifiedDomainName=fqdn,
                Port=port,
                RequestInterval=request_interval,
                FailureThreshold=3,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': f'TCP-{fqdn}-{port}'
                    },
                    {
                        'Key': 'Protocol',
                        'Value': 'TCP'
                    }
                ]
            )
            
            health_check_id = response['HealthCheck']['Id']
            print(f"TCP health check created: {health_check_id}")
            
            return health_check_id
            
        except Exception as e:
            print(f"Error creating TCP health check: {e}")
    
    def create_calculated_health_check(self, child_health_checks, threshold):
        """
        Create calculated health check based on other health checks
        """
        try:
            response = self.route53.create_health_check(
                Type='CALCULATED',
                HealthThreshold=threshold,
                ChildHealthChecks=child_health_checks,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': f'Calculated-{threshold}-of-{len(child_health_checks)}'
                    },
                    {
                        'Key': 'Type',
                        'Value': 'Calculated'
                    }
                ]
            )
            
            health_check_id = response['HealthCheck']['Id']
            print(f"Calculated health check created: {health_check_id}")
            
            return health_check_id
            
        except Exception as e:
            print(f"Error creating calculated health check: {e}")
    
    def create_cloudwatch_alarm_health_check(self, alarm_name, region):
        """
        Create health check based on CloudWatch alarm
        """
        try:
            response = self.route53.create_health_check(
                Type='CLOUDWATCH_METRIC',
                CloudWatchAlarmRegion=region,
                CloudWatchAlarmName=alarm_name,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': f'CloudWatch-{alarm_name}'
                    },
                    {
                        'Key': 'AlarmName',
                        'Value': alarm_name
                    }
                ]
            )
            
            health_check_id = response['HealthCheck']['Id']
            print(f"CloudWatch alarm health check created: {health_check_id}")
            
            return health_check_id
            
        except Exception as e:
            print(f"Error creating CloudWatch alarm health check: {e}")
    
    def get_health_check_status(self, health_check_id):
        """
        Get current status of health check
        """
        try:
            response = self.route53.get_health_check_status(
                HealthCheckId=health_check_id
            )
            
            status_info = {
                'health_check_id': health_check_id,
                'status': response['StatusList'][-1]['Status'] if response['StatusList'] else 'Unknown',
                'checkers': len(response['StatusList']),
                'last_checked': response['StatusList'][-1]['CheckedAt'] if response['StatusList'] else None
            }
            
            return status_info
            
        except Exception as e:
            print(f"Error getting health check status: {e}")
    
    def list_health_checks(self):
        """
        List all health checks
        """
        try:
            response = self.route53.list_health_checks()
            
            health_checks = []
            for hc in response['HealthChecks']:
                hc_info = {
                    'id': hc['Id'],
                    'type': hc['Type'],
                    'fqdn': hc.get('FullyQualifiedDomainName', 'N/A'),
                    'port': hc.get('Port', 'N/A'),
                    'path': hc.get('ResourcePath', 'N/A'),
                    'failure_threshold': hc.get('FailureThreshold', 'N/A')
                }
                health_checks.append(hc_info)
            
            return health_checks
            
        except Exception as e:
            print(f"Error listing health checks: {e}")
            return []

# Usage examples
hc_manager = HealthCheckManager()

# Create various health checks
http_hc = hc_manager.create_http_health_check('web.example.com', 80, '/health')
https_hc = hc_manager.create_https_health_check('secure.example.com', 443, '/api/health')
tcp_hc = hc_manager.create_tcp_health_check('database.example.com', 5432)

# Create calculated health check
if http_hc and https_hc:
    calculated_hc = hc_manager.create_calculated_health_check([http_hc, https_hc], 1)

# CloudWatch alarm health check
cw_hc = hc_manager.create_cloudwatch_alarm_health_check('HighCPUUtilization', 'us-east-1')

# Check status
if http_hc:
    status = hc_manager.get_health_check_status(http_hc)
    print(f"Health check {http_hc} status: {status}")

# List all health checks
health_checks = hc_manager.list_health_checks()
print("\nAll Health Checks:")
for hc in health_checks:
    print(f"  {hc['id']}: {hc['type']} - {hc['fqdn']}:{hc['port']}")
```

## Traffic Routing Policies {#traffic-routing}

### Implementing Different Routing Policies

```python
class TrafficRoutingManager:
    def __init__(self):
        self.route53 = boto3.client('route53')
    
    def create_weighted_routing(self, hosted_zone_id, name, records_with_weights):
        """
        Create weighted routing records
        """
        try:
            changes = []
            for i, (ip_address, weight, set_identifier) in enumerate(records_with_weights):
                change = {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'Weight': weight,
                        'SetIdentifier': set_identifier,
                        'ResourceRecords': [
                            {'Value': ip_address}
                        ]
                    }
                }
                changes.append(change)
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating weighted routing for {name}',
                    'Changes': changes
                }
            )
            
            print(f"Weighted routing created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating weighted routing: {e}")
    
    def create_latency_routing(self, hosted_zone_id, name, records_with_regions):
        """
        Create latency-based routing records
        """
        try:
            changes = []
            for ip_address, region, set_identifier in records_with_regions:
                change = {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'Region': region,
                        'SetIdentifier': set_identifier,
                        'ResourceRecords': [
                            {'Value': ip_address}
                        ]
                    }
                }
                changes.append(change)
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating latency-based routing for {name}',
                    'Changes': changes
                }
            )
            
            print(f"Latency-based routing created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating latency routing: {e}")
    
    def create_failover_routing(self, hosted_zone_id, name, primary_record, secondary_record, health_check_id):
        """
        Create failover routing with primary and secondary
        """
        try:
            changes = [
                {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'Failover': 'PRIMARY',
                        'SetIdentifier': 'Primary',
                        'HealthCheckId': health_check_id,
                        'ResourceRecords': [
                            {'Value': primary_record}
                        ]
                    }
                },
                {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'Failover': 'SECONDARY',
                        'SetIdentifier': 'Secondary',
                        'ResourceRecords': [
                            {'Value': secondary_record}
                        ]
                    }
                }
            ]
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating failover routing for {name}',
                    'Changes': changes
                }
            )
            
            print(f"Failover routing created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating failover routing: {e}")
    
    def create_geolocation_routing(self, hosted_zone_id, name, geolocation_records):
        """
        Create geolocation routing records
        """
        try:
            changes = []
            for record_info in geolocation_records:
                geo_location = {}
                if 'continent' in record_info:
                    geo_location['ContinentCode'] = record_info['continent']
                elif 'country' in record_info:
                    geo_location['CountryCode'] = record_info['country']
                    if 'subdivision' in record_info:
                        geo_location['SubdivisionCode'] = record_info['subdivision']
                
                change = {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'GeoLocation': geo_location,
                        'SetIdentifier': record_info['set_identifier'],
                        'ResourceRecords': [
                            {'Value': record_info['ip_address']}
                        ]
                    }
                }
                changes.append(change)
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating geolocation routing for {name}',
                    'Changes': changes
                }
            )
            
            print(f"Geolocation routing created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating geolocation routing: {e}")
    
    def create_multivalue_routing(self, hosted_zone_id, name, records_with_health_checks):
        """
        Create multivalue answer routing
        """
        try:
            changes = []
            for i, (ip_address, health_check_id) in enumerate(records_with_health_checks):
                change = {
                    'Action': 'CREATE',
                    'ResourceRecordSet': {
                        'Name': name,
                        'Type': 'A',
                        'TTL': 60,
                        'SetIdentifier': f'Server-{i+1}',
                        'MultiValueAnswer': True,
                        'HealthCheckId': health_check_id,
                        'ResourceRecords': [
                            {'Value': ip_address}
                        ]
                    }
                }
                changes.append(change)
            
            response = self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Comment': f'Creating multivalue routing for {name}',
                    'Changes': changes
                }
            )
            
            print(f"Multivalue routing created for {name}")
            return response
            
        except Exception as e:
            print(f"Error creating multivalue routing: {e}")

# Usage examples
traffic_manager = TrafficRoutingManager()
hosted_zone_id = 'Z1D633PJN98FT9'

# Weighted routing (A/B testing, gradual rollout)
weighted_records = [
    ('192.0.2.1', 80, 'Version-A'),  # 80% traffic
    ('192.0.2.2', 20, 'Version-B')   # 20% traffic
]
traffic_manager.create_weighted_routing(hosted_zone_id, 'api.example.com', weighted_records)

# Latency-based routing (global applications)
latency_records = [
    ('192.0.2.10', 'us-east-1', 'US-East'),
    ('192.0.2.20', 'eu-west-1', 'Europe'),
    ('192.0.2.30', 'ap-southeast-1', 'Asia')
]
traffic_manager.create_latency_routing(hosted_zone_id, 'global.example.com', latency_records)

# Geolocation routing (compliance, content localization)
geo_records = [
    {
        'ip_address': '192.0.2.100',
        'country': 'US',
        'set_identifier': 'US-Servers'
    },
    {
        'ip_address': '192.0.2.200',
        'continent': 'EU',
        'set_identifier': 'EU-Servers'
    },
    {
        'ip_address': '192.0.2.250',
        'set_identifier': 'Default-Location'  # Default for unmatched locations
    }
]
traffic_manager.create_geolocation_routing(hosted_zone_id, 'localized.example.com', geo_records)
```

## Advanced Features {#advanced-features}

### Route 53 Resolver and DNS Firewall

```python
class Route53ResolverManager:
    def __init__(self):
        self.resolver = boto3.client('route53resolver')
        self.ec2 = boto3.client('ec2')
    
    def create_resolver_endpoint(self, name, direction, vpc_id, subnet_ids, security_group_ids):
        """
        Create Route 53 Resolver endpoint
        """
        try:
            ip_addresses = []
            for subnet_id in subnet_ids:
                ip_addresses.append({
                    'SubnetId': subnet_id
                })
            
            response = self.resolver.create_resolver_endpoint(
                CreatorRequestId=f"{name}-{int(datetime.now().timestamp())}",
                Name=name,
                Direction=direction,  # INBOUND or OUTBOUND
                IpAddresses=ip_addresses,
                SecurityGroupIds=security_group_ids,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': name
                    },
                    {
                        'Key': 'Direction',
                        'Value': direction
                    }
                ]
            )
            
            resolver_endpoint_id = response['ResolverEndpoint']['Id']
            print(f"Resolver endpoint created: {resolver_endpoint_id}")
            
            return resolver_endpoint_id
            
        except Exception as e:
            print(f"Error creating resolver endpoint: {e}")
    
    def create_resolver_rule(self, name, domain_name, rule_type, target_ips=None, resolver_endpoint_id=None):
        """
        Create Route 53 Resolver rule
        """
        try:
            rule_config = {
                'CreatorRequestId': f"{name}-{int(datetime.now().timestamp())}",
                'Name': name,
                'DomainName': domain_name,
                'RuleType': rule_type,  # FORWARD, SYSTEM, RECURSIVE
                'Tags': [
                    {
                        'Key': 'Name',
                        'Value': name
                    },
                    {
                        'Key': 'Domain',
                        'Value': domain_name
                    }
                ]
            }
            
            if rule_type == 'FORWARD':
                if target_ips and resolver_endpoint_id:
                    rule_config['ResolverEndpointId'] = resolver_endpoint_id
                    rule_config['TargetIps'] = [
                        {'Ip': ip, 'Port': 53} for ip in target_ips
                    ]
            
            response = self.resolver.create_resolver_rule(**rule_config)
            
            resolver_rule_id = response['ResolverRule']['Id']
            print(f"Resolver rule created: {resolver_rule_id}")
            
            return resolver_rule_id
            
        except Exception as e:
            print(f"Error creating resolver rule: {e}")
    
    def associate_resolver_rule(self, resolver_rule_id, vpc_id):
        """
        Associate resolver rule with VPC
        """
        try:
            response = self.resolver.associate_resolver_rule(
                ResolverRuleId=resolver_rule_id,
                VPCId=vpc_id,
                Name=f"Association-{vpc_id}"
            )
            
            print(f"Resolver rule {resolver_rule_id} associated with VPC {vpc_id}")
            return response
            
        except Exception as e:
            print(f"Error associating resolver rule: {e}")
    
    def create_dns_firewall_domain_list(self, name, domains):
        """
        Create DNS Firewall domain list
        """
        try:
            response = self.resolver.create_firewall_domain_list(
                CreatorRequestId=f"{name}-{int(datetime.now().timestamp())}",
                Name=name,
                Domains=domains,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': name
                    }
                ]
            )
            
            domain_list_id = response['FirewallDomainList']['Id']
            print(f"DNS Firewall domain list created: {domain_list_id}")
            
            return domain_list_id
            
        except Exception as e:
            print(f"Error creating DNS Firewall domain list: {e}")
    
    def create_dns_firewall_rule_group(self, name):
        """
        Create DNS Firewall rule group
        """
        try:
            response = self.resolver.create_firewall_rule_group(
                CreatorRequestId=f"{name}-{int(datetime.now().timestamp())}",
                Name=name,
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': name
                    }
                ]
            )
            
            rule_group_id = response['FirewallRuleGroup']['Id']
            print(f"DNS Firewall rule group created: {rule_group_id}")
            
            return rule_group_id
            
        except Exception as e:
            print(f"Error creating DNS Firewall rule group: {e}")
    
    def create_dns_firewall_rule(self, rule_group_id, domain_list_id, action, priority, name):
        """
        Create DNS Firewall rule
        """
        try:
            response = self.resolver.create_firewall_rule(
                CreatorRequestId=f"{name}-{int(datetime.now().timestamp())}",
                FirewallRuleGroupId=rule_group_id,
                FirewallDomainListId=domain_list_id,
                Priority=priority,
                Action=action,  # ALLOW, BLOCK, ALERT
                Name=name
            )
            
            print(f"DNS Firewall rule created: {name}")
            return response
            
        except Exception as e:
            print(f"Error creating DNS Firewall rule: {e}")

# Usage example
resolver_manager = Route53ResolverManager()

# Create outbound resolver endpoint for forwarding queries to on-premises DNS
outbound_endpoint = resolver_manager.create_resolver_endpoint(
    name='OutboundResolver',
    direction='OUTBOUND',
    vpc_id='vpc-12345678',
    subnet_ids=['subnet-12345678', 'subnet-87654321'],
    security_group_ids=['sg-12345678']
)

# Create resolver rule to forward queries for on-premises domain
if outbound_endpoint:
    rule_id = resolver_manager.create_resolver_rule(
        name='OnPremisesRule',
        domain_name='onprem.company.com',
        rule_type='FORWARD',
        target_ips=['10.0.0.10', '10.0.0.11'],  # On-premises DNS servers
        resolver_endpoint_id=outbound_endpoint
    )
    
    # Associate rule with VPC
    if rule_id:
        resolver_manager.associate_resolver_rule(rule_id, 'vpc-12345678')

# Create DNS Firewall to block malicious domains
malicious_domains = [
    'malware.example.com',
    'phishing.example.org',
    'suspicious.example.net'
]

domain_list_id = resolver_manager.create_dns_firewall_domain_list('MaliciousDomains', malicious_domains)
rule_group_id = resolver_manager.create_dns_firewall_rule_group('SecurityRules')

if domain_list_id and rule_group_id:
    resolver_manager.create_dns_firewall_rule(
        rule_group_id,
        domain_list_id,
        'BLOCK',
        100,
        'BlockMaliciousDomains'
    )
```

## Best Practices {#best-practices}

### Route 53 Best Practices Implementation

```python
class Route53BestPractices:
    def __init__(self):
        self.route53 = boto3.client('route53')
        self.cloudwatch = boto3.client('cloudwatch')
    
    def implement_dns_best_practices(self, hosted_zone_id, domain_name):
        """
        Implement DNS best practices
        """
        best_practices = {
            'ttl_optimization': self.optimize_ttl_values(hosted_zone_id),
            'health_check_setup': self.setup_comprehensive_health_checks(domain_name),
            'monitoring': self.setup_dns_monitoring(hosted_zone_id),
            'security': self.implement_dns_security(hosted_zone_id),
            'performance': self.optimize_performance(hosted_zone_id)
        }
        
        return best_practices
    
    def optimize_ttl_values(self, hosted_zone_id):
        """
        Optimize TTL values based on record type and usage
        """
        ttl_recommendations = {
            'A': {
                'production': 300,    # 5 minutes for production
                'staging': 60,        # 1 minute for staging
                'development': 30     # 30 seconds for development
            },
            'CNAME': {
                'production': 3600,   # 1 hour for aliases
                'staging': 300,       # 5 minutes for staging
                'development': 60     # 1 minute for development
            },
            'MX': 3600,              # 1 hour for email
            'TXT': {
                'verification': 300,  # 5 minutes for verification records
                'spf_dkim': 3600     # 1 hour for SPF/DKIM records
            },
            'NS': 86400,             # 24 hours for name servers
            'SOA': 86400             # 24 hours for SOA records
        }
        
        # Get current records and suggest optimizations
        try:
            records = self.route53.list_resource_record_sets(
                HostedZoneId=hosted_zone_id
            )
            
            optimizations = []
            for record in records['ResourceRecordSets']:
                record_type = record['Type']
                current_ttl = record.get('TTL', 'Alias')
                
                if current_ttl != 'Alias' and record_type in ttl_recommendations:
                    if isinstance(ttl_recommendations[record_type], dict):
                        recommended_ttl = ttl_recommendations[record_type]['production']
                    else:
                        recommended_ttl = ttl_recommendations[record_type]
                    
                    if current_ttl != recommended_ttl:
                        optimizations.append({
                            'record_name': record['Name'],
                            'record_type': record_type,
                            'current_ttl': current_ttl,
                            'recommended_ttl': recommended_ttl,
                            'reason': f'Optimize for {record_type} record type'
                        })
            
            return optimizations
            
        except Exception as e:
            print(f"Error optimizing TTL values: {e}")
            return []
    
    def setup_comprehensive_health_checks(self, domain_name):
        """
        Set up comprehensive health check strategy
        """
        health_check_strategy = {
            'endpoints': [
                {
                    'name': f'www.{domain_name}',
                    'type': 'HTTPS',
                    'port': 443,
                    'path': '/health',
                    'string_match': '{"status":"healthy"}'
                },
                {
                    'name': f'api.{domain_name}',
                    'type': 'HTTPS',
                    'port': 443,
                    'path': '/api/health',
                    'string_match': 'OK'
                }
            ],
            'calculated_checks': [
                {
                    'name': 'OverallHealth',
                    'threshold': 1,  # At least 1 of 2 must be healthy
                    'description': 'Overall application health'
                }
            ]
        }
        
        created_checks = []
        
        # Create individual health checks
        for endpoint in health_check_strategy['endpoints']:
            try:
                if endpoint['type'] == 'HTTPS':
                    response = self.route53.create_health_check(
                        Type='HTTPS_STR_MATCH',
                        ResourcePath=endpoint['path'],
                        FullyQualifiedDomainName=endpoint['name'],
                        Port=endpoint['port'],
                        RequestInterval=30,
                        FailureThreshold=3,
                        SearchString=endpoint['string_match']
                    )
                    
                    health_check_id = response['HealthCheck']['Id']
                    created_checks.append({
                        'id': health_check_id,
                        'endpoint': endpoint['name'],
                        'type': 'individual'
                    })
                    
            except Exception as e:
                print(f"Error creating health check for {endpoint['name']}: {e}")
        
        # Create calculated health checks
        if len(created_checks) >= 2:
            individual_check_ids = [check['id'] for check in created_checks if check['type'] == 'individual']
            
            try:
                response = self.route53.create_health_check(
                    Type='CALCULATED',
                    HealthThreshold=1,
                    ChildHealthChecks=individual_check_ids
                )
                
                calculated_check_id = response['HealthCheck']['Id']
                created_checks.append({
                    'id': calculated_check_id,
                    'endpoint': 'calculated',
                    'type': 'calculated'
                })
                
            except Exception as e:
                print(f"Error creating calculated health check: {e}")
        
        return created_checks
    
    def setup_dns_monitoring(self, hosted_zone_id):
        """
        Set up DNS monitoring with CloudWatch
        """
        try:
            # Create custom metrics for DNS monitoring
            monitoring_setup = {
                'query_count_metric': 'DNSQueryCount',
                'response_time_metric': 'DNSResponseTime',
                'error_rate_metric': 'DNSErrorRate'
            }
            
            # Create CloudWatch alarms for DNS metrics
            alarms_created = []
            
            # Query count alarm (unusually high traffic)
            response = self.cloudwatch.put_metric_alarm(
                AlarmName=f'HighDNSQueryCount-{hosted_zone_id}',
                ComparisonOperator='GreaterThanThreshold',
                EvaluationPeriods=2,
                MetricName='QueryCount',
                Namespace='AWS/Route53',
                Period=300,
                Statistic='Sum',
                Threshold=1000.0,
                ActionsEnabled=True,
                AlarmDescription='High DNS query count detected',
                Dimensions=[
                    {
                        'Name': 'HostedZoneId',
                        'Value': hosted_zone_id
                    }
                ]
            )
            alarms_created.append('HighDNSQueryCount')
            
            return {
                'monitoring_setup': monitoring_setup,
                'alarms_created': alarms_created
            }
            
        except Exception as e:
            print(f"Error setting up DNS monitoring: {e}")
    
    def implement_dns_security(self, hosted_zone_id):
        """
        Implement DNS security best practices
        """
        security_measures = {
            'dnssec': self.enable_dnssec(hosted_zone_id),
            'access_control': self.setup_access_control(),
            'monitoring': self.setup_security_monitoring(hosted_zone_id)
        }
        
        return security_measures
    
    def enable_dnssec(self, hosted_zone_id):
        """
        Enable DNSSEC for hosted zone
        """
        try:
            # Note: DNSSEC enabling through API requires additional setup
            # This is a simplified example
            dnssec_info = {
                'status': 'DNSSEC can be enabled through AWS Console',
                'steps': [
                    '1. Go to Route 53 console',
                    '2. Select the hosted zone',
                    '3. Click on DNSSEC signing',
                    '4. Enable DNSSEC signing',
                    '5. Add DS record to parent zone'
                ],
                'benefits': [
                    'DNS response authentication',
                    'Data integrity verification',
                    'Protection against DNS spoofing'
                ]
            }
            
            return dnssec_info
            
        except Exception as e:
            print(f"Error with DNSSEC setup: {e}")
    
    def setup_access_control(self):
        """
        Set up IAM policies for Route 53 access control
        """
        iam_policy_example = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "route53:GetHostedZone",
                        "route53:ListResourceRecordSets"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "route53:hosted-zone-id": ["Z1D633PJN98FT9"]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "route53:ChangeResourceRecordSets"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "route53:hosted-zone-id": ["Z1D633PJN98FT9"]
                        },
                        "StringLike": {
                            "route53:resource-record-set-name": ["*.example.com"]
                        }
                    }
                }
            ]
        }
        
        return {
            'policy': iam_policy_example,
            'recommendations': [
                'Use least privilege access',
                'Implement resource-based policies',
                'Enable CloudTrail for API logging',
                'Use IAM roles instead of access keys'
            ]
        }

# Implementation example
best_practices = Route53BestPractices()
hosted_zone_id = 'Z1D633PJN98FT9'

# Implement all best practices
implementation = best_practices.implement_dns_best_practices(hosted_zone_id, 'example.com')

print("Route 53 Best Practices Implementation:")
print(json.dumps(implementation, indent=2, default=str))
```

## Cost Optimization {#cost-optimization}

### Route 53 Cost Analysis and Optimization

```python
import boto3
from datetime import datetime, timedelta

class Route53CostOptimizer:
    def __init__(self):
        self.route53 = boto3.client('route53')
        self.ce = boto3.client('ce')  # Cost Explorer
    
    def analyze_route53_costs(self, start_date, end_date):
        """
        Analyze Route 53 costs and usage
        """
        try:
            # Get cost data
            response = self.ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='MONTHLY',
                Metrics=['BlendedCost', 'UsageQuantity'],
                GroupBy=[
                    {
                        'Type': 'DIMENSION',
                        'Key': 'USAGE_TYPE'
                    }
                ],
                Filter={
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': ['Amazon Route 53']
                    }
                }
            )
            
            cost_analysis = {}
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    usage_type = group['Keys'][0]
                    cost = float(group['Metrics']['BlendedCost']['Amount'])
                    usage = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    if usage_type not in cost_analysis:
                        cost_analysis[usage_type] = {'cost': 0, 'usage': 0}
                    
                    cost_analysis[usage_type]['cost'] += cost
                    cost_analysis[usage_type]['usage'] += usage
            
            return cost_analysis
            
        except Exception as e:
            print(f"Error analyzing Route 53 costs: {e}")
            return {}
    
    def optimize_hosted_zones(self):
        """
        Identify optimization opportunities for hosted zones
        """
        try:
            response = self.route53.list_hosted_zones()
            
            optimization_recommendations = []
            total_zones = len(response['HostedZones'])
            monthly_cost_per_zone = 0.50  # $0.50 per hosted zone per month
            
            for zone in response['HostedZones']:
                zone_id = zone['Id'].split('/')[-1]
                zone_name = zone['Name']
                is_private = zone['Config']['PrivateZone']
                record_count = zone['ResourceRecordSetCount']
                
                recommendations = []
                
                # Check for unused zones
                if record_count <= 2:  # Only NS and SOA records
                    recommendations.append("Potential unused zone - only contains default records")
                
                # Check for zones with few records
                if record_count < 5 and not is_private:
                    recommendations.append("Low record count - consider consolidation")
                
                # Check for overlapping zones
                if '.' in zone_name and len(zone_name.split('.')) > 2:
                    recommendations.append("Subdomain zone - consider using records in parent zone")
                
                if recommendations:
                    optimization_recommendations.append({
                        'zone_id': zone_id,
                        'zone_name': zone_name,
                        'record_count': record_count,
                        'is_private': is_private,
                        'monthly_cost': monthly_cost_per_zone,
                        'recommendations': recommendations
                    })
            
            # Summary
            total_monthly_cost = total_zones * monthly_cost_per_zone
            potential_savings = len(optimization_recommendations) * monthly_cost_per_zone
            
            return {
                'total_zones': total_zones,
                'total_monthly_cost': total_monthly_cost,
                'potential_savings': potential_savings,
                'optimization_opportunities': optimization_recommendations
            }
            
        except Exception as e:
            print(f"Error optimizing hosted zones: {e}")
            return {}
    
    def optimize_health_checks(self):
        """
        Optimize health check costs
        """
        try:
            response = self.route53.list_health_checks()
            
            health_check_analysis = {
                'total_checks': len(response['HealthChecks']),
                'by_type': {},
                'optimization_recommendations': []
            }
            
            monthly_cost_per_check = 0.50  # $0.50 per health check per month
            
            for hc in response['HealthChecks']:
                hc_type = hc['Type']
                hc_id = hc['Id']
                
                # Count by type
                health_check_analysis['by_type'][hc_type] = health_check_analysis['by_type'].get(hc_type, 0) + 1
                
                # Check for optimization opportunities
                recommendations = []
                
                # Check for calculated health checks with few children
                if hc_type == 'CALCULATED':
                    child_count = len(hc.get('ChildHealthChecks', []))
                    if child_count < 2:
                        recommendations.append("Calculated health check with few children - consider direct monitoring")
                
                # Check for high frequency checks
                request_interval = hc.get('RequestInterval', 30)
                if request_interval == 10:  # Fast interval
                    recommendations.append("Fast interval (10s) - consider standard interval (30s) if appropriate")
                
                # Check for string matching on simple endpoints
                if hc_type in ['HTTP_STR_MATCH', 'HTTPS_STR_MATCH']:
                    search_string = hc.get('SearchString', '')
                    if not search_string or search_string in ['200', 'OK']:
                        recommendations.append("Simple string matching - consider basic HTTP/HTTPS check")
                
                if recommendations:
                    health_check_analysis['optimization_recommendations'].append({
                        'health_check_id': hc_id,
                        'type': hc_type,
                        'monthly_cost': monthly_cost_per_check,
                        'recommendations': recommendations
                    })
            
            # Calculate costs
            total_monthly_cost = health_check_analysis['total_checks'] * monthly_cost_per_check
            potential_savings = len(health_check_analysis['optimization_recommendations']) * monthly_cost_per_check * 0.3  # Assume 30% savings
            
            health_check_analysis.update({
                'total_monthly_cost': total_monthly_cost,
                'potential_savings': potential_savings
            })
            
            return health_check_analysis
            
        except Exception as e:
            print(f"Error optimizing health checks: {e}")
            return {}
    
    def optimize_query_costs(self):
        """
        Analyze and optimize query costs
        """
        query_optimization = {
            'cost_per_million_queries': {
                'first_billion': 0.40,  # $0.40 per million for first billion
                'over_billion': 0.20    # $0.20 per million over 1 billion
            },
            'optimization_strategies': [
                {
                    'strategy': 'Increase TTL values',
                    'description': 'Higher TTL reduces query frequency',
                    'potential_savings': '20-50%',
                    'implementation': 'Review and increase TTL for stable records'
                },
                {
                    'strategy': 'Use alias records',
                    'description': 'Alias records are free for AWS resources',
                    'potential_savings': '100% for applicable queries',
                    'implementation': 'Replace A/CNAME records with aliases where possible'
                },
                {
                    'strategy': 'CDN implementation',
                    'description': 'CDN reduces origin queries',
                    'potential_savings': '30-70%',
                    'implementation': 'Use CloudFront or other CDN services'
                },
                {
                    'strategy': 'DNS caching',
                    'description': 'Application-level DNS caching',
                    'potential_savings': '40-60%',
                    'implementation': 'Implement DNS caching in applications'
                }
            ]
        }
        
        return query_optimization
    
    def generate_cost_report(self):
        """
        Generate comprehensive cost optimization report
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)  # Last 3 months
        
        report = {
            'report_date': datetime.utcnow().isoformat(),
            'analysis_period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'cost_analysis': self.analyze_route53_costs(start_date, end_date),
            'hosted_zone_optimization': self.optimize_hosted_zones(),
            'health_check_optimization': self.optimize_health_checks(),
            'query_optimization': self.optimize_query_costs()
        }
        
        # Calculate total potential savings
        total_savings = 0
        if 'potential_savings' in report['hosted_zone_optimization']:
            total_savings += report['hosted_zone_optimization']['potential_savings']
        if 'potential_savings' in report['health_check_optimization']:
            total_savings += report['health_check_optimization']['potential_savings']
        
        report['summary'] = {
            'total_potential_monthly_savings': total_savings,
            'annual_savings_projection': total_savings * 12,
            'top_recommendations': [
                'Review unused hosted zones',
                'Optimize health check configuration',
                'Increase TTL values for stable records',
                'Use alias records for AWS resources'
            ]
        }
        
        return report

# Usage example
cost_optimizer = Route53CostOptimizer()

# Generate comprehensive cost optimization report
report = cost_optimizer.generate_cost_report()

print("Route 53 Cost Optimization Report")
print("=" * 40)
print(f"Analysis Period: {report['analysis_period']}")
print(f"Potential Monthly Savings: ${report['summary']['total_potential_monthly_savings']:.2f}")
print(f"Annual Savings Projection: ${report['summary']['annual_savings_projection']:.2f}")

print("\nTop Recommendations:")
for i, rec in enumerate(report['summary']['top_recommendations'], 1):
    print(f"{i}. {rec}")

print("\nDetailed Analysis:")
print(json.dumps(report, indent=2, default=str))
```

## Conclusion

Amazon Route 53 provides comprehensive DNS services with high availability, performance, and integration with AWS services. Key takeaways:

### Essential Features:
- **DNS Management**: Authoritative DNS with global anycast network
- **Health Checks**: Automated failover and monitoring
- **Traffic Routing**: Advanced routing policies for optimal performance
- **Domain Registration**: Complete domain lifecycle management
- **Integration**: Seamless integration with AWS services

### Advanced Capabilities:
- **Route 53 Resolver**: Hybrid DNS resolution for on-premises integration
- **DNS Firewall**: Security filtering for malicious domains
- **Traffic Policies**: Version-controlled routing configurations
- **Geoproximity Routing**: Advanced geographic routing with bias
- **Query Logging**: Detailed DNS query analysis

### Best Practices:
- Optimize TTL values based on record types and change frequency
- Implement comprehensive health checks with appropriate thresholds
- Use alias records for AWS resources to reduce costs
- Enable DNSSEC for enhanced security
- Monitor DNS metrics and set up appropriate alarms
- Implement least privilege access with IAM policies

### Cost Optimization:
- Regular review of hosted zones and health checks
- Use alias records instead of traditional records where possible
- Optimize TTL values to reduce query frequency
- Implement DNS caching at application level
- Leverage CDN services to reduce DNS queries

Route 53 forms the foundation of internet connectivity for AWS applications, providing reliable, fast, and cost-effective DNS services that scale automatically with your needs.