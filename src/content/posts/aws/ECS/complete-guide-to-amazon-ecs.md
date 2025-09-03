---
author: Anubhav Gain
category: aws
description: Complete guide to Amazon ECS - fully managed container orchestration service for Docker containers with EC2 and Fargate launch types, service discovery, and auto scaling.
draft: false
featured: true
lang: en
pubDatetime: '2024-08-20T18:00:00+05:30'
slug: complete-guide-to-amazon-ecs
tags:
- aws
- ecs
- containers
- docker
- orchestration
- microservices
- fargate
title: 'Complete Guide to Amazon ECS: Container Orchestration at Scale'
---

# Complete Guide to Amazon ECS: Container Orchestration at Scale

Amazon Elastic Container Service (ECS) is a fully managed container orchestration service that makes it easy to run, stop, and manage Docker containers on a cluster. ECS eliminates the need to install and operate your own container orchestration software, manage and scale a cluster of virtual machines, or schedule containers on those virtual machines.

## Overview

ECS supports two launch types: EC2 for more control over the infrastructure, and Fargate for serverless container execution. You can run your containers on a serverless infrastructure managed by AWS Fargate, or for more control you can run your tasks and services on a cluster of Amazon EC2 instances that you manage.

## Key Benefits

### 1. **Fully Managed**
- No control plane to manage
- Integrated with AWS services
- Automatic patching and scaling
- Built-in security and monitoring

### 2. **Flexible**
- EC2 and Fargate launch types
- Support for Docker containers
- Multiple scheduling strategies
- Service discovery and load balancing

### 3. **Secure**
- IAM integration for fine-grained access
- VPC networking isolation
- Secrets management integration
- Container image vulnerability scanning

### 4. **Cost-Effective**
- Pay only for resources used
- Spot instances support
- Right-sizing recommendations
- Reserved capacity pricing

## Core Concepts

### 1. **Clusters**
```yaml
# ECS Cluster with EC2 capacity
ECSCluster:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: my-ecs-cluster
    CapacityProviders:
      - EC2
      - FARGATE
      - FARGATE_SPOT
    DefaultCapacityProviderStrategy:
      - CapacityProvider: FARGATE
        Weight: 1
        Base: 2
    ClusterSettings:
      - Name: containerInsights
        Value: enabled
    Tags:
      - Key: Environment
        Value: Production

# Auto Scaling Group for EC2 capacity
ECSAutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    VPCZoneIdentifier:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    LaunchTemplate:
      LaunchTemplateId: !Ref ECSLaunchTemplate
      Version: !GetAtt ECSLaunchTemplate.LatestVersionNumber
    MinSize: 1
    MaxSize: 10
    DesiredCapacity: 3
    TargetGroupARNs:
      - !Ref ApplicationTargetGroup
    Tags:
      - Key: Name
        Value: ECS-Instance
        PropagateAtLaunch: true

# Launch Template for ECS instances
ECSLaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateName: ecs-launch-template
    LaunchTemplateData:
      ImageId: ami-0c02fb55956c7d316  # ECS-optimized AMI
      InstanceType: t3.medium
      SecurityGroupIds:
        - !Ref ECSSecurityGroup
      IamInstanceProfile:
        Arn: !GetAtt ECSInstanceProfile.Arn
      UserData: !Base64
        !Sub |
          #!/bin/bash
          echo ECS_CLUSTER=${ECSCluster} >> /etc/ecs/ecs.config
          echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
```

### 2. **Task Definitions**
```yaml
# Fargate Task Definition
FargateTaskDefinition:
  Type: AWS::ECS::TaskDefinition
  Properties:
    Family: my-fargate-task
    NetworkMode: awsvpc
    RequiresCompatibilities:
      - FARGATE
    Cpu: 512
    Memory: 1024
    ExecutionRoleArn: !GetAtt ECSExecutionRole.Arn
    TaskRoleArn: !GetAtt ECSTaskRole.Arn
    ContainerDefinitions:
      - Name: web-server
        Image: nginx:latest
        PortMappings:
          - ContainerPort: 80
            Protocol: tcp
        LogConfiguration:
          LogDriver: awslogs
          Options:
            awslogs-group: !Ref ECSLogGroup
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: ecs
        Environment:
          - Name: ENV
            Value: production
        Secrets:
          - Name: DATABASE_PASSWORD
            ValueFrom: !Ref DatabaseSecret
        HealthCheck:
          Command:
            - CMD-SHELL
            - curl -f http://localhost/ || exit 1
          Interval: 30
          Timeout: 5
          Retries: 3
          StartPeriod: 60

# Multi-container Task Definition
MultiContainerTaskDefinition:
  Type: AWS::ECS::TaskDefinition
  Properties:
    Family: multi-container-task
    NetworkMode: awsvpc
    RequiresCompatibilities:
      - FARGATE
    Cpu: 1024
    Memory: 2048
    ExecutionRoleArn: !GetAtt ECSExecutionRole.Arn
    ContainerDefinitions:
      - Name: web-app
        Image: my-app:latest
        PortMappings:
          - ContainerPort: 8080
        DependsOn:
          - ContainerName: redis-cache
            Condition: HEALTHY
        Links:
          - redis-cache
        LogConfiguration:
          LogDriver: awslogs
          Options:
            awslogs-group: !Ref ECSLogGroup
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: web-app
      - Name: redis-cache
        Image: redis:alpine
        PortMappings:
          - ContainerPort: 6379
        HealthCheck:
          Command:
            - CMD-SHELL
            - redis-cli ping
          Interval: 30
          Timeout: 5
          Retries: 3
        LogConfiguration:
          LogDriver: awslogs
          Options:
            awslogs-group: !Ref ECSLogGroup
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: redis
```

### 3. **Services**
```yaml
# Fargate Service
FargateService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: my-fargate-service
    Cluster: !Ref ECSCluster
    TaskDefinition: !Ref FargateTaskDefinition
    LaunchType: FARGATE
    DesiredCount: 3
    DeploymentConfiguration:
      MinimumHealthyPercent: 50
      MaximumPercent: 200
      DeploymentCircuitBreaker:
        Enable: true
        Rollback: true
    NetworkConfiguration:
      AwsvpcConfiguration:
        SecurityGroups:
          - !Ref ECSSecurityGroup
        Subnets:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        AssignPublicIp: DISABLED
    LoadBalancers:
      - TargetGroupArn: !Ref ApplicationTargetGroup
        ContainerName: web-server
        ContainerPort: 80
    ServiceRegistries:
      - RegistryArn: !GetAtt ServiceDiscoveryService.Arn
        ContainerName: web-server
    EnableExecuteCommand: true  # Enable ECS Exec
    PropagateTags: SERVICE
    Tags:
      - Key: Environment
        Value: Production

# Service with Capacity Provider Strategy
CapacityProviderService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: mixed-capacity-service
    Cluster: !Ref ECSCluster
    TaskDefinition: !Ref TaskDefinition
    DesiredCount: 5
    CapacityProviderStrategy:
      - CapacityProvider: FARGATE
        Weight: 1
        Base: 2
      - CapacityProvider: FARGATE_SPOT
        Weight: 4
    DeploymentConfiguration:
      MinimumHealthyPercent: 50
      MaximumPercent: 200
```

## Container Management

### 1. **Container Images and ECR Integration**
```yaml
# ECR Repository for container images
ECRRepository:
  Type: AWS::ECR::Repository
  Properties:
    RepositoryName: my-application
    ImageScanningConfiguration:
      ScanOnPush: true
    ImageTagMutability: MUTABLE
    LifecyclePolicy:
      LifecyclePolicyText: |
        {
          "rules": [
            {
              "rulePriority": 1,
              "description": "Keep last 10 production images",
              "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["prod"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
              },
              "action": {
                "type": "expire"
              }
            },
            {
              "rulePriority": 2,
              "description": "Keep only 5 untagged images",
              "selection": {
                "tagStatus": "untagged",
                "countType": "imageCountMoreThan",
                "countNumber": 5
              },
              "action": {
                "type": "expire"
              }
            }
          ]
        }
```

```bash
# Build and push Docker image to ECR
#!/bin/bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1
REPOSITORY_NAME=my-application
IMAGE_TAG=v1.0.0

# Build Docker image
docker build -t ${REPOSITORY_NAME}:${IMAGE_TAG} .

# Get ECR login token
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Tag and push image
docker tag ${REPOSITORY_NAME}:${IMAGE_TAG} ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY_NAME}:${IMAGE_TAG}
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY_NAME}:${IMAGE_TAG}

# Also tag as latest
docker tag ${REPOSITORY_NAME}:${IMAGE_TAG} ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY_NAME}:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY_NAME}:latest
```

### 2. **Service Discovery**
```yaml
# Cloud Map Service Discovery
ServiceDiscoveryNamespace:
  Type: AWS::ServiceDiscovery::PrivateDnsNamespace
  Properties:
    Name: my-app.local
    Vpc: !Ref VPC

ServiceDiscoveryService:
  Type: AWS::ServiceDiscovery::Service
  Properties:
    Name: web-service
    NamespaceId: !Ref ServiceDiscoveryNamespace
    DnsConfig:
      DnsRecords:
        - Type: A
          TTL: 300
      RoutingPolicy: MULTIVALUE
    HealthCheckCustomConfig:
      FailureThreshold: 2
```

### 3. **Load Balancing**
```yaml
# Application Load Balancer
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: ecs-alb
    Type: application
    Scheme: internet-facing
    IpAddressType: ipv4
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
    SecurityGroups:
      - !Ref ALBSecurityGroup

ApplicationTargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Name: ecs-targets
    Port: 80
    Protocol: HTTP
    TargetType: ip  # For Fargate
    VpcId: !Ref VPC
    HealthCheckPath: /health
    HealthCheckProtocol: HTTP
    HealthCheckIntervalSeconds: 30
    HealthCheckTimeoutSeconds: 5
    HealthyThresholdCount: 2
    UnhealthyThresholdCount: 5
    Matcher:
      HttpCode: 200

ALBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref ApplicationTargetGroup
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP
```

## Auto Scaling

### 1. **Service Auto Scaling**
```yaml
# Service Auto Scaling Configuration
ServiceScalingTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: ecs
    ResourceId: !Sub 'service/${ECSCluster}/${FargateService}'
    ScalableDimension: ecs:service:DesiredCount
    MinCapacity: 2
    MaxCapacity: 20
    RoleARN: !GetAtt ECSAutoScalingRole.Arn

# CPU-based scaling policy
CPUScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: ECS-CPU-Scaling
    ServiceNamespace: ecs
    ResourceId: !Sub 'service/${ECSCluster}/${FargateService}'
    ScalableDimension: ecs:service:DesiredCount
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageCPUUtilization
      ScaleOutCooldown: 300
      ScaleInCooldown: 300

# Memory-based scaling policy
MemoryScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: ECS-Memory-Scaling
    ServiceNamespace: ecs
    ResourceId: !Sub 'service/${ECSCluster}/${FargateService}'
    ScalableDimension: ecs:service:DesiredCount
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 80.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageMemoryUtilization
      ScaleOutCooldown: 300
      ScaleInCooldown: 300

# ALB Request-based scaling
ALBScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: ECS-ALB-Scaling
    ServiceNamespace: ecs
    ResourceId: !Sub 'service/${ECSCluster}/${FargateService}'
    ScalableDimension: ecs:service:DesiredCount
    PolicyType: TargetTrackingScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 1000.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ALBRequestCountPerTarget
        ResourceLabel: !Sub 
          - '${LoadBalancerFullName}/${TargetGroupFullName}'
          - LoadBalancerFullName: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            TargetGroupFullName: !GetAtt ApplicationTargetGroup.TargetGroupFullName
```

### 2. **Cluster Auto Scaling**
```yaml
# Cluster Capacity Provider
EC2CapacityProvider:
  Type: AWS::ECS::CapacityProvider
  Properties:
    Name: ec2-capacity-provider
    AutoScalingGroupProvider:
      AutoScalingGroupArn: !Ref ECSAutoScalingGroup
      ManagedScaling:
        Status: ENABLED
        TargetCapacity: 100
        MinimumScalingStepSize: 1
        MaximumScalingStepSize: 10
      ManagedTerminationProtection: ENABLED
    Tags:
      - Key: Name
        Value: EC2CapacityProvider
```

## Deployment Strategies

### 1. **Blue/Green Deployment**
```python
import boto3
import json
import time

class ECSBlueGreenDeployment:
    def __init__(self, cluster_name, service_name, region='us-east-1'):
        self.ecs = boto3.client('ecs', region_name=region)
        self.elbv2 = boto3.client('elbv2', region_name=region)
        self.cluster_name = cluster_name
        self.service_name = service_name
    
    def deploy(self, new_task_definition_arn, target_group_arns):
        """
        Perform blue/green deployment
        """
        # Get current service configuration
        service = self.get_service_details()
        current_task_def = service['taskDefinition']
        current_count = service['desiredCount']
        
        # Create new service with new task definition
        new_service_name = f"{self.service_name}-green"
        
        print(f"Creating green service: {new_service_name}")
        self.create_green_service(
            new_service_name,
            new_task_definition_arn,
            current_count,
            service
        )
        
        # Wait for green service to be stable
        print("Waiting for green service to stabilize...")
        self.wait_for_service_stable(new_service_name)
        
        # Switch traffic to green service
        print("Switching traffic to green service...")
        self.switch_traffic(target_group_arns, new_service_name)
        
        # Cleanup old (blue) service
        print("Cleaning up blue service...")
        time.sleep(300)  # Wait 5 minutes before cleanup
        self.cleanup_blue_service()
        
        return True
    
    def get_service_details(self):
        """
        Get current service configuration
        """
        response = self.ecs.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )
        return response['services'][0]
    
    def create_green_service(self, green_service_name, task_def_arn, desired_count, blue_service):
        """
        Create green service with new task definition
        """
        service_config = {
            'serviceName': green_service_name,
            'cluster': self.cluster_name,
            'taskDefinition': task_def_arn,
            'desiredCount': desired_count,
            'launchType': blue_service.get('launchType', 'FARGATE'),
            'networkConfiguration': blue_service.get('networkConfiguration', {}),
            'loadBalancers': [],  # Will be added after traffic switch
            'serviceRegistries': blue_service.get('serviceRegistries', []),
            'deploymentConfiguration': blue_service.get('deploymentConfiguration', {})
        }
        
        self.ecs.create_service(**service_config)
    
    def wait_for_service_stable(self, service_name):
        """
        Wait for service to reach stable state
        """
        waiter = self.ecs.get_waiter('services_stable')
        waiter.wait(
            cluster=self.cluster_name,
            services=[service_name],
            WaiterConfig={
                'Delay': 30,
                'MaxAttempts': 20
            }
        )
    
    def switch_traffic(self, target_group_arns, green_service_name):
        """
        Switch load balancer traffic to green service
        """
        # Update target group to point to green service
        for tg_arn in target_group_arns:
            # This is simplified - in practice, you'd gradually shift traffic
            self.update_service_load_balancers(green_service_name, tg_arn)
    
    def update_service_load_balancers(self, service_name, target_group_arn):
        """
        Update service load balancer configuration
        """
        self.ecs.update_service(
            cluster=self.cluster_name,
            service=service_name,
            loadBalancers=[
                {
                    'targetGroupArn': target_group_arn,
                    'containerName': 'web-server',  # Adjust as needed
                    'containerPort': 80
                }
            ]
        )
    
    def cleanup_blue_service(self):
        """
        Scale down and delete blue service
        """
        # Scale down blue service
        self.ecs.update_service(
            cluster=self.cluster_name,
            service=self.service_name,
            desiredCount=0
        )
        
        # Wait for scale down
        self.wait_for_service_stable(self.service_name)
        
        # Delete blue service
        self.ecs.delete_service(
            cluster=self.cluster_name,
            service=self.service_name
        )

# Usage example
deployer = ECSBlueGreenDeployment('my-cluster', 'my-service')
deployer.deploy(
    'arn:aws:ecs:region:account:task-definition/my-app:2',
    ['arn:aws:elasticloadbalancing:region:account:targetgroup/my-targets/abc123']
)
```

### 2. **Rolling Updates**
```yaml
# Service with rolling update configuration
RollingUpdateService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: rolling-update-service
    Cluster: !Ref ECSCluster
    TaskDefinition: !Ref TaskDefinition
    DesiredCount: 4
    DeploymentConfiguration:
      MinimumHealthyPercent: 50  # Keep at least 50% running during deployment
      MaximumPercent: 200        # Can scale up to 200% during deployment
      DeploymentCircuitBreaker:
        Enable: true
        Rollback: true           # Auto rollback on failure
    PropagateTags: SERVICE
```

## Monitoring and Logging

### 1. **Container Insights**
```yaml
# Enable Container Insights on cluster
ClusterWithInsights:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: monitored-cluster
    ClusterSettings:
      - Name: containerInsights
        Value: enabled

# CloudWatch Log Group
ECSLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /ecs/my-application
    RetentionInDays: 30

# Custom CloudWatch Dashboard
ECSMonitoringDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: ECS-Monitoring
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/ECS", "CPUUtilization", "ServiceName", "${FargateService}", "ClusterName", "${ECSCluster}"],
                ["AWS/ECS", "MemoryUtilization", "ServiceName", "${FargateService}", "ClusterName", "${ECSCluster}"]
              ],
              "period": 300,
              "stat": "Average",
              "region": "${AWS::Region}",
              "title": "ECS Service Metrics"
            }
          }
        ]
      }
```

### 2. **Health Monitoring**
```python
import boto3
import json
from datetime import datetime, timedelta

class ECSHealthMonitor:
    def __init__(self, cluster_name, region='us-east-1'):
        self.ecs = boto3.client('ecs', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        self.cluster_name = cluster_name
    
    def get_cluster_health(self):
        """
        Get overall cluster health
        """
        # Get cluster details
        cluster_response = self.ecs.describe_clusters(
            clusters=[self.cluster_name],
            include=['STATISTICS']
        )
        cluster = cluster_response['clusters'][0]
        
        # Get services
        services_response = self.ecs.list_services(cluster=self.cluster_name)
        service_arns = services_response['serviceArns']
        
        health_status = {
            'cluster_name': self.cluster_name,
            'cluster_status': cluster['status'],
            'active_services_count': cluster['activeServicesCount'],
            'running_tasks_count': cluster['runningTasksCount'],
            'pending_tasks_count': cluster['pendingTasksCount'],
            'services': []
        }
        
        # Check individual services
        if service_arns:
            services_detail = self.ecs.describe_services(
                cluster=self.cluster_name,
                services=service_arns
            )
            
            for service in services_detail['services']:
                service_health = self.analyze_service_health(service)
                health_status['services'].append(service_health)
        
        return health_status
    
    def analyze_service_health(self, service):
        """
        Analyze individual service health
        """
        service_name = service['serviceName']
        desired_count = service['desiredCount']
        running_count = service['runningCount']
        pending_count = service['pendingCount']
        
        # Calculate health percentage
        health_percentage = (running_count / desired_count * 100) if desired_count > 0 else 0
        
        # Determine health status
        if health_percentage >= 100:
            status = 'HEALTHY'
        elif health_percentage >= 80:
            status = 'DEGRADED'
        else:
            status = 'UNHEALTHY'
        
        # Check for deployment issues
        deployments = service.get('deployments', [])
        active_deployment = next((d for d in deployments if d['status'] == 'PRIMARY'), None)
        
        deployment_status = 'STABLE'
        if active_deployment:
            if active_deployment['rolloutState'] == 'IN_PROGRESS':
                deployment_status = 'DEPLOYING'
            elif active_deployment['rolloutState'] == 'FAILED':
                deployment_status = 'FAILED'
        
        return {
            'service_name': service_name,
            'desired_count': desired_count,
            'running_count': running_count,
            'pending_count': pending_count,
            'health_percentage': health_percentage,
            'status': status,
            'deployment_status': deployment_status,
            'task_definition': service['taskDefinition'].split('/')[-1]
        }
    
    def get_service_metrics(self, service_name, hours=24):
        """
        Get CloudWatch metrics for service
        """
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        metrics = ['CPUUtilization', 'MemoryUtilization']
        service_metrics = {}
        
        for metric in metrics:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ECS',
                MetricName=metric,
                Dimensions=[
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'ClusterName', 'Value': self.cluster_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour intervals
                Statistics=['Average', 'Maximum']
            )
            
            datapoints = response['Datapoints']
            if datapoints:
                avg_value = sum(point['Average'] for point in datapoints) / len(datapoints)
                max_value = max(point['Maximum'] for point in datapoints)
                
                service_metrics[metric.lower()] = {
                    'average': round(avg_value, 2),
                    'maximum': round(max_value, 2),
                    'datapoints': len(datapoints)
                }
        
        return service_metrics
    
    def check_task_health(self, service_name):
        """
        Check health of individual tasks
        """
        # Get tasks for service
        tasks_response = self.ecs.list_tasks(
            cluster=self.cluster_name,
            serviceName=service_name
        )
        
        task_arns = tasks_response['taskArns']
        if not task_arns:
            return []
        
        # Get task details
        tasks_detail = self.ecs.describe_tasks(
            cluster=self.cluster_name,
            tasks=task_arns
        )
        
        task_health = []
        for task in tasks_detail['tasks']:
            containers = task.get('containers', [])
            
            healthy_containers = sum(1 for c in containers if c.get('healthStatus') == 'HEALTHY')
            total_containers = len(containers)
            
            task_info = {
                'task_arn': task['taskArn'].split('/')[-1],
                'last_status': task['lastStatus'],
                'desired_status': task['desiredStatus'],
                'health_status': task.get('healthStatus', 'UNKNOWN'),
                'healthy_containers': healthy_containers,
                'total_containers': total_containers,
                'cpu_utilization': None,  # Would need additional API calls
                'memory_utilization': None
            }
            
            task_health.append(task_info)
        
        return task_health

# Usage example
monitor = ECSHealthMonitor('my-cluster')
cluster_health = monitor.get_cluster_health()
print(json.dumps(cluster_health, indent=2))

service_metrics = monitor.get_service_metrics('my-service')
print(json.dumps(service_metrics, indent=2))
```

### 3. **Alerting**
```yaml
# CloudWatch Alarms for ECS monitoring
ServiceCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: ECS-High-CPU-Utilization
    AlarmDescription: ECS service CPU utilization is too high
    MetricName: CPUUtilization
    Namespace: AWS/ECS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: ServiceName
        Value: !Ref FargateService
      - Name: ClusterName
        Value: !Ref ECSCluster
    AlarmActions:
      - !Ref SNSAlarmTopic

TaskCountAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: ECS-Low-Running-Tasks
    AlarmDescription: ECS service has fewer running tasks than desired
    MetricName: RunningTaskCount
    Namespace: AWS/ECS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 2
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: ServiceName
        Value: !Ref FargateService
      - Name: ClusterName
        Value: !Ref ECSCluster
```

## Security Best Practices

### 1. **IAM Roles and Policies**
```yaml
# ECS Task Execution Role
ECSExecutionRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: ecs-tasks.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    Policies:
      - PolicyName: ECRAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - ecr:GetAuthorizationToken
                - ecr:BatchCheckLayerAvailability
                - ecr:GetDownloadUrlForLayer
                - ecr:BatchGetImage
              Resource: '*'
      - PolicyName: SecretsManagerAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: !Ref DatabaseSecret

# ECS Task Role (for application access)
ECSTaskRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: ecs-tasks.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: ApplicationAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:PutObject
              Resource: !Sub '${ApplicationBucket}/*'
            - Effect: Allow
              Action:
                - dynamodb:GetItem
                - dynamodb:PutItem
                - dynamodb:UpdateItem
                - dynamodb:DeleteItem
              Resource: !GetAtt ApplicationTable.Arn
```

### 2. **Network Security**
```yaml
# Security Group for ECS tasks
ECSSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for ECS tasks
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref ALBSecurityGroup
        Description: HTTP from ALB
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        SourceSecurityGroupId: !Ref ALBSecurityGroup
        Description: HTTPS from ALB
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS outbound
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
        Description: HTTP outbound

# Security Group for ALB
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Application Load Balancer
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
        Description: HTTP from internet
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS from internet
```

### 3. **Secrets Management**
```yaml
# Secrets Manager secret
DatabaseSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Description: Database password for application
    GenerateSecretString:
      SecretStringTemplate: '{"username": "admin"}'
      GenerateStringKey: password
      PasswordLength: 16
      ExcludeCharacters: '"@/\'

# Task definition using secrets
SecureTaskDefinition:
  Type: AWS::ECS::TaskDefinition
  Properties:
    ContainerDefinitions:
      - Name: app
        Image: my-app:latest
        Secrets:
          - Name: DB_PASSWORD
            ValueFrom: !Ref DatabaseSecret
        Environment:
          - Name: DB_HOST
            Value: !GetAtt Database.Endpoint.Address
```

## Cost Optimization

### 1. **Spot Instances and Fargate Spot**
```yaml
# Mixed capacity provider strategy
MixedCapacityService:
  Type: AWS::ECS::Service
  Properties:
    CapacityProviderStrategy:
      - CapacityProvider: FARGATE
        Weight: 1
        Base: 1
      - CapacityProvider: FARGATE_SPOT
        Weight: 4  # 80% spot instances
    # Other service properties...
```

```python
def optimize_ecs_costs(cluster_name, service_name):
    """
    Analyze and optimize ECS costs
    """
    ecs = boto3.client('ecs')
    
    # Get service details
    service = ecs.describe_services(
        cluster=cluster_name,
        services=[service_name]
    )['services'][0]
    
    recommendations = []
    
    # Check if using spot instances
    capacity_strategy = service.get('capacityProviderStrategy', [])
    spot_weight = sum(cp['weight'] for cp in capacity_strategy if 'SPOT' in cp['capacityProvider'])
    total_weight = sum(cp['weight'] for cp in capacity_strategy)
    
    if total_weight > 0:
        spot_percentage = (spot_weight / total_weight) * 100
        if spot_percentage < 70:
            recommendations.append(f"Consider increasing Spot usage (currently {spot_percentage:.1f}%)")
    else:
        recommendations.append("Consider using Fargate Spot for cost savings")
    
    # Check task definition resource allocation
    task_def_arn = service['taskDefinition']
    task_def = ecs.describe_task_definition(taskDefinition=task_def_arn)['taskDefinition']
    
    cpu = int(task_def.get('cpu', 0))
    memory = int(task_def.get('memory', 0))
    
    # Basic right-sizing recommendations
    if cpu >= 2048:  # 2 vCPUs
        recommendations.append("High CPU allocation - monitor utilization for right-sizing")
    
    if memory >= 4096:  # 4 GB
        recommendations.append("High memory allocation - monitor utilization for right-sizing")
    
    return {
        'spot_percentage': spot_percentage if total_weight > 0 else 0,
        'cpu_allocation': cpu,
        'memory_allocation': memory,
        'recommendations': recommendations
    }
```

### 2. **Resource Right-Sizing**
```python
def analyze_resource_utilization(cluster_name, service_name, days=7):
    """
    Analyze resource utilization for right-sizing recommendations
    """
    cloudwatch = boto3.client('cloudwatch')
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=days)
    
    metrics = ['CPUUtilization', 'MemoryUtilization']
    utilization_data = {}
    
    for metric in metrics:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName=metric,
            Dimensions=[
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'ClusterName', 'Value': cluster_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average', 'Maximum']
        )
        
        if response['Datapoints']:
            avg_utilization = sum(p['Average'] for p in response['Datapoints']) / len(response['Datapoints'])
            max_utilization = max(p['Maximum'] for p in response['Datapoints'])
            
            utilization_data[metric.lower()] = {
                'average': avg_utilization,
                'maximum': max_utilization
            }
    
    # Generate right-sizing recommendations
    recommendations = []
    
    cpu_avg = utilization_data.get('cpuutilization', {}).get('average', 0)
    cpu_max = utilization_data.get('cpuutilization', {}).get('maximum', 0)
    
    if cpu_avg < 20 and cpu_max < 50:
        recommendations.append("CPU: Consider downsizing - low utilization detected")
    elif cpu_avg > 70:
        recommendations.append("CPU: Consider upsizing - high utilization detected")
    
    memory_avg = utilization_data.get('memoryutilization', {}).get('average', 0)
    memory_max = utilization_data.get('memoryutilization', {}).get('maximum', 0)
    
    if memory_avg < 30 and memory_max < 60:
        recommendations.append("Memory: Consider downsizing - low utilization detected")
    elif memory_avg > 80:
        recommendations.append("Memory: Consider upsizing - high utilization detected")
    
    return {
        'utilization_data': utilization_data,
        'recommendations': recommendations
    }
```

## Troubleshooting

### 1. **Common Issues and Solutions**
```python
def diagnose_ecs_issues(cluster_name, service_name):
    """
    Diagnose common ECS issues
    """
    ecs = boto3.client('ecs')
    issues = []
    solutions = []
    
    # Get service details
    service = ecs.describe_services(
        cluster=cluster_name,
        services=[service_name]
    )['services'][0]
    
    # Check service status
    if service['status'] != 'ACTIVE':
        issues.append(f"Service status is {service['status']}")
        solutions.append("Check service events for error details")
    
    # Check task health
    running_count = service['runningCount']
    desired_count = service['desiredCount']
    
    if running_count < desired_count:
        issues.append(f"Running tasks ({running_count}) less than desired ({desired_count})")
        
        # Get recent tasks to understand why
        tasks = ecs.list_tasks(
            cluster=cluster_name,
            serviceName=service_name
        )
        
        if tasks['taskArns']:
            task_details = ecs.describe_tasks(
                cluster=cluster_name,
                tasks=tasks['taskArns'][:5]  # Check last 5 tasks
            )
            
            for task in task_details['tasks']:
                if task['lastStatus'] == 'STOPPED':
                    stop_reason = task.get('stoppedReason', 'Unknown')
                    issues.append(f"Task stopped: {stop_reason}")
                    
                    if 'OutOfMemory' in stop_reason:
                        solutions.append("Increase memory allocation in task definition")
                    elif 'CannotPullContainer' in stop_reason:
                        solutions.append("Check ECR permissions and image availability")
                    elif 'HealthCheck' in stop_reason:
                        solutions.append("Review container health check configuration")
    
    # Check deployment status
    deployments = service.get('deployments', [])
    for deployment in deployments:
        if deployment['status'] == 'PRIMARY' and deployment['rolloutState'] == 'FAILED':
            issues.append("Deployment failed")
            solutions.append("Check deployment events and task definition")
    
    return {
        'issues': issues,
        'solutions': solutions,
        'service_health': {
            'desired_count': desired_count,
            'running_count': running_count,
            'pending_count': service['pendingCount']
        }
    }

def get_ecs_events(cluster_name, service_name=None, max_events=20):
    """
    Get recent ECS events for troubleshooting
    """
    ecs = boto3.client('ecs')
    
    if service_name:
        # Get service events
        service = ecs.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )['services'][0]
        
        events = service.get('events', [])[:max_events]
        return [
            {
                'timestamp': event['createdAt'].isoformat(),
                'message': event['message']
            }
            for event in events
        ]
    else:
        # Get cluster-level events (would need additional implementation)
        return []
```

## Best Practices

### 1. **Container Design**
- Use multi-stage Docker builds to reduce image size
- Run containers as non-root users
- Use health checks for container monitoring
- Implement graceful shutdown handling

### 2. **Service Configuration**
- Use appropriate deployment strategies
- Configure proper health check settings
- Set realistic resource requests and limits
- Implement circuit breakers and retry logic

### 3. **Security**
- Use least privilege IAM roles
- Store secrets in AWS Secrets Manager
- Enable container image scanning
- Use VPC endpoints for private communication

### 4. **Monitoring**
- Enable Container Insights
- Set up CloudWatch alarms for key metrics
- Use X-Ray for distributed tracing
- Monitor application logs centrally

## Additional Resources

- [Amazon ECS Developer Guide](https://docs.aws.amazon.com/ecs/latest/developerguide/)
- [ECS Best Practices](https://docs.aws.amazon.com/ecs/latest/bestpracticesguide/)
- [AWS Fargate User Guide](https://docs.aws.amazon.com/ecs/latest/userguide/AWS_Fargate.html)
- [ECS Container Insights](https://docs.aws.amazon.com/ecs/latest/developerguide/cloudwatch-container-insights.html)