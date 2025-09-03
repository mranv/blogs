---
author: Anubhav Gain
category: aws
description: Complete guide to Amazon VPC - create isolated cloud networks with subnets, security groups, routing, and connectivity options for secure AWS infrastructure.
draft: false
featured: true
lang: en
pubDatetime: '2024-08-20T14:00:00+05:30'
slug: complete-guide-to-amazon-vpc-networking
tags:
- aws
- vpc
- networking
- security
- infrastructure
- subnets
- routing
title: 'Complete Guide to Amazon VPC: Secure Cloud Networking'
---

# Complete Guide to Amazon VPC: Secure Cloud Networking

Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS Cloud where you can launch AWS resources in a virtual network that you define. You have complete control over your virtual networking environment, including selection of your own IP address range, creation of subnets, and configuration of route tables and network gateways.

## Overview

VPC enables you to use many of the AWS services within a virtual network that you define. This virtual network closely resembles a traditional network that you might operate in your own data center, with the benefits of using the scalable infrastructure of AWS.

## Key Benefits

### 1. **Network Isolation**
- Logical isolation from other virtual networks
- Private IP address ranges
- Control over network configuration
- Secure by default

### 2. **Flexible Connectivity**
- Multiple connectivity options
- VPN connections to on-premises
- Direct Connect for dedicated bandwidth
- VPC peering for inter-VPC communication

### 3. **Granular Security**
- Security groups (instance-level firewall)
- Network ACLs (subnet-level firewall)
- Flow logs for monitoring
- Private subnets for sensitive resources

### 4. **Scalability**
- Supports thousands of instances
- Multiple Availability Zones
- Auto Scaling integration
- Load balancer support

## Core Components

### 1. **VPC Architecture**
```yaml
# Basic VPC with public and private subnets
Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: MyVPC

  # Internet Gateway for public internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: MyVPC-IGW

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public Subnet

  # Private Subnet
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private Subnet
```

### 2. **Subnets**
```yaml
# Multi-AZ subnet configuration
PublicSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref MyVPC
    CidrBlock: 10.0.1.0/24
    AvailabilityZone: !Select [0, !GetAZs '']
    MapPublicIpOnLaunch: true
    Tags:
      - Key: Name
        Value: Public Subnet AZ1
      - Key: Type
        Value: Public

PublicSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref MyVPC
    CidrBlock: 10.0.2.0/24
    AvailabilityZone: !Select [1, !GetAZs '']
    MapPublicIpOnLaunch: true
    Tags:
      - Key: Name
        Value: Public Subnet AZ2
      - Key: Type
        Value: Public

PrivateSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref MyVPC
    CidrBlock: 10.0.10.0/24
    AvailabilityZone: !Select [0, !GetAZs '']
    Tags:
      - Key: Name
        Value: Private Subnet AZ1
      - Key: Type
        Value: Private

PrivateSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref MyVPC
    CidrBlock: 10.0.11.0/24
    AvailabilityZone: !Select [1, !GetAZs '']
    Tags:
      - Key: Name
        Value: Private Subnet AZ2
      - Key: Type
        Value: Private
```

### 3. **Route Tables**
```yaml
# Public Route Table
PublicRouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId: !Ref MyVPC
    Tags:
      - Key: Name
        Value: Public Route Table

PublicRoute:
  Type: AWS::EC2::Route
  DependsOn: AttachGateway
  Properties:
    RouteTableId: !Ref PublicRouteTable
    DestinationCidrBlock: 0.0.0.0/0
    GatewayId: !Ref InternetGateway

PublicSubnetRouteTableAssociation1:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref PublicSubnet1
    RouteTableId: !Ref PublicRouteTable

# Private Route Table with NAT Gateway
PrivateRouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId: !Ref MyVPC
    Tags:
      - Key: Name
        Value: Private Route Table

PrivateRoute:
  Type: AWS::EC2::Route
  Properties:
    RouteTableId: !Ref PrivateRouteTable
    DestinationCidrBlock: 0.0.0.0/0
    NatGatewayId: !Ref NATGateway

PrivateSubnetRouteTableAssociation1:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet1
    RouteTableId: !Ref PrivateRouteTable
```

### 4. **NAT Gateway**
```yaml
# NAT Gateway for private subnet internet access
NATGatewayEIP:
  Type: AWS::EC2::EIP
  DependsOn: AttachGateway
  Properties:
    Domain: vpc

NATGateway:
  Type: AWS::EC2::NatGateway
  Properties:
    AllocationId: !GetAtt NATGatewayEIP.AllocationId
    SubnetId: !Ref PublicSubnet1
    Tags:
      - Key: Name
        Value: NAT Gateway

# High Availability NAT Gateways
NATGateway2:
  Type: AWS::EC2::NatGateway
  Properties:
    AllocationId: !GetAtt NATGatewayEIP2.AllocationId
    SubnetId: !Ref PublicSubnet2
    Tags:
      - Key: Name
        Value: NAT Gateway AZ2
```

## Security Features

### 1. **Security Groups**
```yaml
# Web Server Security Group
WebServerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for web servers
    VpcId: !Ref MyVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
        Description: HTTP access from anywhere
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS access from anywhere
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        SourceSecurityGroupId: !Ref BastionSecurityGroup
        Description: SSH access from bastion host
    SecurityGroupEgress:
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0
        Description: All outbound traffic
    Tags:
      - Key: Name
        Value: WebServer-SG

# Database Security Group
DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for database servers
    VpcId: !Ref MyVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 3306
        ToPort: 3306
        SourceSecurityGroupId: !Ref WebServerSecurityGroup
        Description: MySQL access from web servers
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        SourceSecurityGroupId: !Ref BastionSecurityGroup
        Description: SSH access from bastion host
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
        Description: HTTP for package updates
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS for package updates
    Tags:
      - Key: Name
        Value: Database-SG

# Bastion Host Security Group
BastionSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for bastion host
    VpcId: !Ref MyVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: 203.0.113.0/24  # Your office IP range
        Description: SSH access from office
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: 10.0.0.0/16
        Description: SSH to internal instances
    Tags:
      - Key: Name
        Value: Bastion-SG
```

### 2. **Network ACLs**
```yaml
# Custom Network ACL for additional security
PrivateNetworkAcl:
  Type: AWS::EC2::NetworkAcl
  Properties:
    VpcId: !Ref MyVPC
    Tags:
      - Key: Name
        Value: Private-NACL

# Inbound rules
PrivateNetworkAclEntryInbound:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PrivateNetworkAcl
    RuleNumber: 100
    Protocol: -1
    RuleAction: allow
    CidrBlock: 10.0.0.0/16

# Outbound rules
PrivateNetworkAclEntryOutbound:
  Type: AWS::EC2::NetworkAclEntry
  Properties:
    NetworkAclId: !Ref PrivateNetworkAcl
    RuleNumber: 100
    Protocol: -1
    Egress: true
    RuleAction: allow
    CidrBlock: 0.0.0.0/0

# Associate with private subnets
PrivateSubnetNetworkAclAssociation:
  Type: AWS::EC2::SubnetNetworkAclAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet1
    NetworkAclId: !Ref PrivateNetworkAcl
```

### 3. **VPC Flow Logs**
```yaml
# VPC Flow Logs for monitoring
FlowLogRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: vpc-flow-logs.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: CloudWatchLogPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
                - logs:DescribeLogGroups
                - logs:DescribeLogStreams
              Resource: '*'

VPCFlowLog:
  Type: AWS::EC2::FlowLog
  Properties:
    ResourceType: VPC
    ResourceId: !Ref MyVPC
    TrafficType: ALL
    LogDestinationType: cloud-watch-logs
    LogDestination: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:VPCFlowLogs'
    LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action}'
    DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn
```

## Connectivity Options

### 1. **VPN Gateway**
```yaml
# Customer Gateway (your on-premises router)
CustomerGateway:
  Type: AWS::EC2::CustomerGateway
  Properties:
    Type: ipsec.1
    BgpAsn: 65000
    IpAddress: 203.0.113.12  # Your public IP
    Tags:
      - Key: Name
        Value: Main Office Gateway

# Virtual Private Gateway
VPNGateway:
  Type: AWS::EC2::VPNGateway
  Properties:
    Type: ipsec.1
    Tags:
      - Key: Name
        Value: VPC VPN Gateway

VPNGatewayAttachment:
  Type: AWS::EC2::VPCGatewayAttachment
  Properties:
    VpcId: !Ref MyVPC
    VpnGatewayId: !Ref VPNGateway

# VPN Connection
VPNConnection:
  Type: AWS::EC2::VPNConnection
  Properties:
    Type: ipsec.1
    StaticRoutesOnly: true
    CustomerGatewayId: !Ref CustomerGateway
    VpnGatewayId: !Ref VPNGateway
    Tags:
      - Key: Name
        Value: Main Office VPN

# VPN Connection Route
VPNConnectionRoute:
  Type: AWS::EC2::VPNConnectionRoute
  Properties:
    VpnConnectionId: !Ref VPNConnection
    DestinationCidrBlock: 192.168.0.0/16  # On-premises network
```

### 2. **VPC Peering**
```yaml
# VPC Peering Connection
VPCPeeringConnection:
  Type: AWS::EC2::VPCPeeringConnection
  Properties:
    VpcId: !Ref MyVPC
    PeerVpcId: !Ref PeerVPC
    PeerRegion: !Ref AWS::Region
    Tags:
      - Key: Name
        Value: VPC-Peering-Connection

# Route for peering in main VPC
PeeringRoute:
  Type: AWS::EC2::Route
  Properties:
    RouteTableId: !Ref PrivateRouteTable
    DestinationCidrBlock: 10.1.0.0/16  # Peer VPC CIDR
    VpcPeeringConnectionId: !Ref VPCPeeringConnection

# Security group rule to allow peering traffic
CrossVPCSecurityGroupRule:
  Type: AWS::EC2::SecurityGroupIngress
  Properties:
    GroupId: !Ref WebServerSecurityGroup
    IpProtocol: tcp
    FromPort: 80
    ToPort: 80
    SourceSecurityGroupId: !Ref PeerVPCSecurityGroup
    SourceSecurityGroupOwnerId: !Ref AWS::AccountId
```

### 3. **Transit Gateway**
```yaml
# Transit Gateway for multiple VPC connectivity
TransitGateway:
  Type: AWS::EC2::TransitGateway
  Properties:
    AmazonSideAsn: 64512
    Description: Central hub for VPC connectivity
    Tags:
      - Key: Name
        Value: Main Transit Gateway

# Attach VPC to Transit Gateway
TransitGatewayVPCAttachment:
  Type: AWS::EC2::TransitGatewayAttachment
  Properties:
    TransitGatewayId: !Ref TransitGateway
    VpcId: !Ref MyVPC
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    Tags:
      - Key: Name
        Value: MyVPC Attachment

# Route table for Transit Gateway
TransitGatewayRouteTable:
  Type: AWS::EC2::TransitGatewayRouteTable
  Properties:
    TransitGatewayId: !Ref TransitGateway
    Tags:
      - Key: Name
        Value: Main Route Table

# Route through Transit Gateway
TransitGatewayRoute:
  Type: AWS::EC2::Route
  Properties:
    RouteTableId: !Ref PrivateRouteTable
    DestinationCidrBlock: 10.0.0.0/8
    TransitGatewayId: !Ref TransitGateway
```

## Advanced Features

### 1. **VPC Endpoints**
```yaml
# S3 VPC Endpoint (Gateway type)
S3VPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref MyVPC
    ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
    VpcEndpointType: Gateway
    RouteTableIds:
      - !Ref PrivateRouteTable
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal: '*'
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource:
            - 'arn:aws:s3:::my-bucket/*'
        - Effect: Allow
          Principal: '*'
          Action:
            - s3:ListBucket
          Resource:
            - 'arn:aws:s3:::my-bucket'

# EC2 VPC Endpoint (Interface type)
EC2VPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref MyVPC
    ServiceName: !Sub 'com.amazonaws.${AWS::Region}.ec2'
    VpcEndpointType: Interface
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    SecurityGroupIds:
      - !Ref VPCEndpointSecurityGroup
    PrivateDnsEnabled: true
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal: '*'
          Action:
            - ec2:DescribeInstances
            - ec2:DescribeImages
            - ec2:DescribeSnapshots
          Resource: '*'

VPCEndpointSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for VPC endpoints
    VpcId: !Ref MyVPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 10.0.0.0/16
        Description: HTTPS access from VPC
```

### 2. **DHCP Options**
```yaml
# Custom DHCP Options Set
DHCPOptions:
  Type: AWS::EC2::DHCPOptions
  Properties:
    DomainName: !Sub '${AWS::Region}.compute.internal'
    DomainNameServers:
      - AmazonProvidedDNS
    NtpServers:
      - 169.254.169.123
    NetbiosNameServers:
      - 10.0.0.10
    NetbiosNodeType: 2
    Tags:
      - Key: Name
        Value: Custom DHCP Options

DHCPOptionsAssociation:
  Type: AWS::EC2::VPCDHCPOptionsAssociation
  Properties:
    VpcId: !Ref MyVPC
    DhcpOptionsId: !Ref DHCPOptions
```

### 3. **Network Load Balancer**
```yaml
# Network Load Balancer for high performance
NetworkLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: MyNetworkLoadBalancer
    Type: network
    Scheme: internal
    IpAddressType: ipv4
    Subnets:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    Tags:
      - Key: Name
        Value: Internal NLB

NLBTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: NLB-Target-Group
    Port: 80
    Protocol: TCP
    VpcId: !Ref MyVPC
    HealthCheckProtocol: HTTP
    HealthCheckPath: /health
    HealthCheckIntervalSeconds: 10
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 2
    TargetType: instance

NLBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref NLBTargetGroup
    LoadBalancerArn: !Ref NetworkLoadBalancer
    Port: 80
    Protocol: TCP
```

## Monitoring and Troubleshooting

### 1. **CloudWatch Integration**
```python
# Python script to analyze VPC Flow Logs
import boto3
import json
from collections import defaultdict

def analyze_vpc_flow_logs(log_group_name, start_time, end_time):
    """
    Analyze VPC Flow Logs to identify traffic patterns
    """
    logs_client = boto3.client('logs')
    
    query = """
    fields @timestamp, srcaddr, dstaddr, srcport, dstport, protocol, action, bytes
    | filter action = "REJECT"
    | stats count() by srcaddr, dstaddr, dstport
    | sort count desc
    | limit 20
    """
    
    response = logs_client.start_query(
        logGroupName=log_group_name,
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=query
    )
    
    query_id = response['queryId']
    
    # Wait for query completion
    while True:
        result = logs_client.get_query_results(queryId=query_id)
        if result['status'] == 'Complete':
            break
        time.sleep(1)
    
    return result['results']

# Usage example
if __name__ == "__main__":
    from datetime import datetime, timedelta
    
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    
    rejected_traffic = analyze_vpc_flow_logs(
        'VPCFlowLogs', 
        start_time, 
        end_time
    )
    
    print("Top rejected traffic patterns:")
    for result in rejected_traffic:
        print(f"From: {result[0]['value']} To: {result[1]['value']} "
              f"Port: {result[2]['value']} Count: {result[3]['value']}")
```

### 2. **Network Testing Tools**
```bash
#!/bin/bash
# Network connectivity testing script

VPC_ID="vpc-123456789"
INSTANCE_ID="i-123456789"

echo "=== VPC Network Diagnostics ==="

# Check VPC configuration
echo "1. VPC Configuration:"
aws ec2 describe-vpcs --vpc-ids $VPC_ID --query 'Vpcs[0].[VpcId,CidrBlock,State]' --output table

# Check subnets
echo "2. Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[].[SubnetId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch]' --output table

# Check route tables
echo "3. Route Tables:"
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'RouteTables[].[RouteTableId,Routes[?State==`active`].[DestinationCidrBlock,GatewayId,NatGatewayId]]' --output table

# Check security groups
echo "4. Security Groups for Instance:"
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].SecurityGroups[].[GroupId,GroupName]' --output table

# Check NACLs
echo "5. Network ACLs:"
SUBNET_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].SubnetId' --output text)
  
aws ec2 describe-network-acls --filters "Name=association.subnet-id,Values=$SUBNET_ID" \
  --query 'NetworkAcls[0].[NetworkAclId,Entries[?RuleAction==`allow`].[RuleNumber,Protocol,CidrBlock]]' --output table

# Test connectivity
echo "6. Testing Connectivity:"
ping -c 3 8.8.8.8
nslookup google.com
curl -I https://aws.amazon.com
```

### 3. **Automated Network Validation**
```python
import boto3
import ipaddress
from typing import List, Dict, Tuple

class VPCValidator:
    def __init__(self, vpc_id: str):
        self.vpc_id = vpc_id
        self.ec2 = boto3.client('ec2')
        
    def validate_vpc_configuration(self) -> Dict:
        """
        Comprehensive VPC configuration validation
        """
        results = {
            'vpc_basics': self._validate_vpc_basics(),
            'subnets': self._validate_subnets(),
            'routing': self._validate_routing(),
            'security': self._validate_security(),
            'connectivity': self._validate_connectivity()
        }
        
        return results
    
    def _validate_vpc_basics(self) -> Dict:
        """Validate basic VPC configuration"""
        try:
            vpc = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])['Vpcs'][0]
            
            issues = []
            recommendations = []
            
            # Check DNS resolution
            if not vpc.get('EnableDnsSupport', False):
                issues.append("DNS support is disabled")
            
            if not vpc.get('EnableDnsHostnames', False):
                recommendations.append("Consider enabling DNS hostnames")
            
            # Check CIDR block size
            cidr = ipaddress.IPv4Network(vpc['CidrBlock'])
            if cidr.num_addresses < 256:
                recommendations.append("Small CIDR block, consider larger range for growth")
            
            return {
                'status': 'healthy' if not issues else 'issues_found',
                'vpc_id': self.vpc_id,
                'cidr_block': vpc['CidrBlock'],
                'dns_support': vpc.get('EnableDnsSupport', False),
                'dns_hostnames': vpc.get('EnableDnsHostnames', False),
                'issues': issues,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _validate_subnets(self) -> Dict:
        """Validate subnet configuration"""
        try:
            subnets = self.ec2.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['Subnets']
            
            issues = []
            recommendations = []
            
            # Check AZ distribution
            az_count = len(set(subnet['AvailabilityZone'] for subnet in subnets))
            if az_count < 2:
                issues.append("Subnets not distributed across multiple AZs")
            
            # Check for public/private subnet pairs
            public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
            private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]
            
            if len(public_subnets) == 0:
                recommendations.append("No public subnets found - may limit internet connectivity")
            
            if len(private_subnets) == 0:
                recommendations.append("No private subnets found - consider security best practices")
            
            return {
                'status': 'healthy' if not issues else 'issues_found',
                'total_subnets': len(subnets),
                'availability_zones': az_count,
                'public_subnets': len(public_subnets),
                'private_subnets': len(private_subnets),
                'issues': issues,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _validate_routing(self) -> Dict:
        """Validate routing configuration"""
        try:
            route_tables = self.ec2.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['RouteTables']
            
            issues = []
            recommendations = []
            
            # Check for internet gateway routes
            has_igw_route = any(
                any(route.get('GatewayId', '').startswith('igw-') for route in rt['Routes'])
                for rt in route_tables
            )
            
            if not has_igw_route:
                recommendations.append("No Internet Gateway routes found")
            
            # Check for default route
            has_default_route = any(
                any(route.get('DestinationCidrBlock') == '0.0.0.0/0' for route in rt['Routes'])
                for rt in route_tables
            )
            
            if not has_default_route:
                recommendations.append("No default routes found - may affect internet connectivity")
            
            return {
                'status': 'healthy' if not issues else 'issues_found',
                'route_tables_count': len(route_tables),
                'has_internet_gateway': has_igw_route,
                'has_default_route': has_default_route,
                'issues': issues,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _validate_security(self) -> Dict:
        """Validate security configuration"""
        try:
            security_groups = self.ec2.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['SecurityGroups']
            
            issues = []
            recommendations = []
            
            # Check for overly permissive rules
            for sg in security_groups:
                for rule in sg['IpPermissions']:
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            if rule.get('FromPort') == 22:  # SSH
                                issues.append(f"SG {sg['GroupId']}: SSH open to 0.0.0.0/0")
                            elif rule.get('FromPort') == 3389:  # RDP
                                issues.append(f"SG {sg['GroupId']}: RDP open to 0.0.0.0/0")
                            elif rule.get('IpProtocol') == '-1':  # All traffic
                                issues.append(f"SG {sg['GroupId']}: All traffic open to 0.0.0.0/0")
            
            return {
                'status': 'healthy' if not issues else 'issues_found',
                'security_groups_count': len(security_groups),
                'issues': issues,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _validate_connectivity(self) -> Dict:
        """Validate connectivity options"""
        try:
            # Check for NAT Gateways
            nat_gateways = self.ec2.describe_nat_gateways(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['NatGateways']
            
            # Check for VPN connections
            vpn_connections = self.ec2.describe_vpn_connections(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['VpnConnections']
            
            # Check for VPC endpoints
            vpc_endpoints = self.ec2.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )['VpcEndpoints']
            
            recommendations = []
            
            if len(nat_gateways) == 0:
                recommendations.append("No NAT Gateways found - private subnets can't reach internet")
            
            if len(vpc_endpoints) == 0:
                recommendations.append("No VPC Endpoints found - consider for AWS service access")
            
            return {
                'status': 'healthy',
                'nat_gateways': len(nat_gateways),
                'vpn_connections': len(vpn_connections),
                'vpc_endpoints': len(vpc_endpoints),
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

# Usage example
if __name__ == "__main__":
    validator = VPCValidator('vpc-123456789')
    results = validator.validate_vpc_configuration()
    
    print(json.dumps(results, indent=2))
```

## Cost Optimization

### 1. **NAT Gateway Optimization**
```yaml
# Single NAT Gateway for cost optimization (less HA)
# Use NAT Instances for very low traffic scenarios
NATInstance:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: ami-00a9d4a05375b2763  # NAT AMI
    InstanceType: t3.micro
    KeyName: !Ref KeyPairName
    SubnetId: !Ref PublicSubnet1
    SecurityGroupIds:
      - !Ref NATInstanceSecurityGroup
    SourceDestCheck: false
    Tags:
      - Key: Name
        Value: NAT Instance
    UserData: !Base64
      !Sub |
        #!/bin/bash
        echo 1 > /proc/sys/net/ipv4/ip_forward
        /sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
        /sbin/iptables -F FORWARD
```

### 2. **VPC Endpoint Cost Analysis**
```python
def calculate_vpc_endpoint_savings(monthly_data_gb: float, 
                                 endpoint_hours: int = 744) -> Dict:
    """
    Calculate potential savings from VPC endpoints vs NAT Gateway
    """
    
    # NAT Gateway costs (us-east-1)
    nat_gateway_hourly = 0.045  # per hour
    nat_gateway_data = 0.045   # per GB processed
    
    # VPC Endpoint costs (Interface)
    vpc_endpoint_hourly = 0.01  # per AZ per hour
    vpc_endpoint_data = 0.01   # per GB processed
    
    # Calculate monthly costs
    nat_cost = (nat_gateway_hourly * endpoint_hours) + (nat_gateway_data * monthly_data_gb)
    endpoint_cost = (vpc_endpoint_hourly * endpoint_hours) + (vpc_endpoint_data * monthly_data_gb)
    
    savings = nat_cost - endpoint_cost
    
    return {
        'nat_gateway_cost': round(nat_cost, 2),
        'vpc_endpoint_cost': round(endpoint_cost, 2),
        'monthly_savings': round(savings, 2),
        'annual_savings': round(savings * 12, 2),
        'breakeven_gb': round(
            (nat_gateway_hourly - vpc_endpoint_hourly) * endpoint_hours / 
            (vpc_endpoint_data - nat_gateway_data), 2
        )
    }
```

## Best Practices

### 1. **Network Design**
- Use multiple Availability Zones for high availability
- Separate public and private subnets
- Plan CIDR blocks carefully to avoid conflicts
- Use smallest necessary CIDR blocks
- Reserve IP ranges for future growth

### 2. **Security**
- Use security groups as primary security mechanism
- Apply principle of least privilege
- Use NACLs for additional subnet-level security
- Enable VPC Flow Logs for monitoring
- Regularly audit security group rules

### 3. **Performance**
- Place resources in same AZ when possible
- Use Placement Groups for HPC workloads
- Consider Enhanced Networking for high throughput
- Monitor network utilization metrics
- Use appropriate instance types for network requirements

### 4. **Cost Management**
- Use single NAT Gateway if high availability not critical
- Consider NAT Instances for low traffic
- Implement VPC Endpoints for AWS services
- Monitor data transfer costs
- Use spot instances where appropriate

## Additional Resources

- [Amazon VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [VPC Networking Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
- [AWS Network Firewall](https://docs.aws.amazon.com/network-firewall/)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)