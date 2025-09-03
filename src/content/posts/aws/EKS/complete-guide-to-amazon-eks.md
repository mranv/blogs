---
title: "The Complete Guide to Amazon EKS: Kubernetes on AWS with Advanced Container Orchestration"
description: "Master Amazon EKS with this comprehensive guide covering cluster setup, node management, networking, security, and advanced Kubernetes deployment strategies."
publishDate: 2024-12-09
author: "Anubhav Gain"
category: "Cloud Computing"
tags:
  - aws
  - eks
  - kubernetes
  - containers
  - orchestration
  - microservices
  - devops
  - cloud-native
  - docker
featured: true
draft: false
slug: "complete-guide-amazon-eks-kubernetes"
---

# The Complete Guide to Amazon EKS: Kubernetes on AWS with Advanced Container Orchestration

Amazon Elastic Kubernetes Service (EKS) is AWS's managed Kubernetes service that simplifies running Kubernetes clusters without needing to manage the Kubernetes control plane. This guide covers everything from cluster setup to advanced deployment patterns and operational best practices.

## Table of Contents
1. [Introduction to EKS](#introduction)
2. [EKS Architecture](#architecture)
3. [Cluster Setup and Configuration](#cluster-setup)
4. [Node Groups and Fargate](#node-management)
5. [Networking and Security](#networking-security)
6. [Storage and Persistent Volumes](#storage)
7. [Application Deployment](#application-deployment)
8. [Advanced Features](#advanced-features)
9. [Monitoring and Logging](#monitoring-logging)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)
12. [Cost Optimization](#cost-optimization)
13. [Troubleshooting](#troubleshooting)

## Introduction to EKS {#introduction}

Amazon EKS is a fully managed Kubernetes service that provides a secure, reliable, and scalable way to run Kubernetes on AWS. It automatically manages the availability and scalability of the Kubernetes control plane nodes.

### Key Benefits:
- **Managed Control Plane**: AWS manages Kubernetes masters
- **High Availability**: Multi-AZ control plane deployment
- **Security**: Integration with AWS IAM and VPC
- **Scalability**: Automatic scaling and patching
- **AWS Integration**: Native integration with AWS services

## EKS Architecture {#architecture}

### Understanding EKS Components

```python
import boto3
import json
from datetime import datetime

# Initialize EKS client
eks = boto3.client('eks')
ec2 = boto3.client('ec2')

def eks_architecture_overview():
    """
    Overview of EKS architecture components
    """
    architecture = {
        "control_plane": {
            "description": "Managed by AWS",
            "components": [
                "API Server",
                "etcd",
                "Controller Manager", 
                "Scheduler"
            ],
            "features": [
                "Multi-AZ deployment",
                "Automatic patching",
                "Built-in monitoring",
                "99.95% SLA"
            ]
        },
        "data_plane": {
            "description": "Customer managed worker nodes",
            "options": [
                "EC2 Self-managed nodes",
                "EKS Managed node groups",
                "AWS Fargate"
            ],
            "networking": [
                "VPC integration",
                "Subnet placement",
                "Security groups",
                "Load balancers"
            ]
        },
        "add_ons": {
            "core": [
                "kube-proxy",
                "CoreDNS", 
                "Amazon VPC CNI"
            ],
            "optional": [
                "AWS Load Balancer Controller",
                "Amazon EBS CSI Driver",
                "Amazon EFS CSI Driver",
                "Cluster Autoscaler"
            ]
        }
    }
    
    return architecture

print("EKS Architecture Overview:")
print(json.dumps(eks_architecture_overview(), indent=2))
```

## Cluster Setup and Configuration {#cluster-setup}

### Creating an EKS Cluster with Python

```python
import boto3
import time
import yaml

class EKSClusterManager:
    def __init__(self):
        self.eks = boto3.client('eks')
        self.ec2 = boto3.client('ec2')
        self.iam = boto3.client('iam')
    
    def create_cluster_role(self, role_name):
        """
        Create IAM role for EKS cluster
        """
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "eks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='EKS Cluster Service Role'
            )
            
            # Attach required policies
            policies = [
                'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
            ]
            
            for policy_arn in policies:
                self.iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy_arn
                )
            
            role_arn = response['Role']['Arn']
            print(f"EKS cluster role created: {role_arn}")
            return role_arn
            
        except Exception as e:
            print(f"Error creating cluster role: {e}")
            return None
    
    def create_node_group_role(self, role_name):
        """
        Create IAM role for EKS node group
        """
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='EKS Node Group Service Role'
            )
            
            # Attach required policies
            policies = [
                'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
                'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
                'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
            ]
            
            for policy_arn in policies:
                self.iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy_arn
                )
            
            role_arn = response['Role']['Arn']
            print(f"EKS node group role created: {role_arn}")
            return role_arn
            
        except Exception as e:
            print(f"Error creating node group role: {e}")
            return None
    
    def create_cluster(self, cluster_name, cluster_role_arn, subnet_ids, security_group_ids=None):
        """
        Create EKS cluster
        """
        try:
            cluster_config = {
                'name': cluster_name,
                'version': '1.28',
                'roleArn': cluster_role_arn,
                'resourcesVpcConfig': {
                    'subnetIds': subnet_ids
                },
                'logging': {
                    'enable': [
                        {
                            'types': ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler']
                        }
                    ]
                }
            }
            
            if security_group_ids:
                cluster_config['resourcesVpcConfig']['securityGroupIds'] = security_group_ids
            
            response = self.eks.create_cluster(**cluster_config)
            
            cluster_arn = response['cluster']['arn']
            print(f"EKS cluster creation initiated: {cluster_arn}")
            
            # Wait for cluster to be active
            self.wait_for_cluster_active(cluster_name)
            
            return cluster_arn
            
        except Exception as e:
            print(f"Error creating cluster: {e}")
            return None
    
    def wait_for_cluster_active(self, cluster_name, timeout=1800):
        """
        Wait for cluster to become active
        """
        print(f"Waiting for cluster {cluster_name} to become active...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = self.eks.describe_cluster(name=cluster_name)
                status = response['cluster']['status']
                
                if status == 'ACTIVE':
                    print(f"Cluster {cluster_name} is now active!")
                    return True
                elif status == 'FAILED':
                    print(f"Cluster {cluster_name} creation failed!")
                    return False
                else:
                    print(f"Cluster status: {status}")
                    time.sleep(30)
                    
            except Exception as e:
                print(f"Error checking cluster status: {e}")
                time.sleep(30)
        
        print(f"Timeout waiting for cluster {cluster_name} to become active")
        return False
    
    def create_managed_node_group(self, cluster_name, node_group_name, node_role_arn, subnet_ids, instance_types=['t3.medium']):
        """
        Create EKS managed node group
        """
        try:
            response = self.eks.create_nodegroup(
                clusterName=cluster_name,
                nodegroupName=node_group_name,
                scalingConfig={
                    'minSize': 1,
                    'maxSize': 10,
                    'desiredSize': 3
                },
                diskSize=20,
                instanceTypes=instance_types,
                amiType='AL2_x86_64',
                nodeRole=node_role_arn,
                subnets=subnet_ids,
                remoteAccess={
                    'ec2SshKey': 'my-key-pair'  # Replace with your key pair
                },
                tags={
                    'Environment': 'production',
                    'ManagedBy': 'EKS'
                }
            )
            
            node_group_arn = response['nodegroup']['nodegroupArn']
            print(f"Node group creation initiated: {node_group_arn}")
            
            return node_group_arn
            
        except Exception as e:
            print(f"Error creating node group: {e}")
            return None

# Usage example
eks_manager = EKSClusterManager()

# Create IAM roles
cluster_role_arn = eks_manager.create_cluster_role('EKSClusterRole')
node_role_arn = eks_manager.create_node_group_role('EKSNodeGroupRole')

# Create cluster (replace with actual subnet IDs)
subnet_ids = ['subnet-12345678', 'subnet-87654321']
if cluster_role_arn:
    cluster_arn = eks_manager.create_cluster('my-eks-cluster', cluster_role_arn, subnet_ids)
    
    # Create managed node group
    if cluster_arn and node_role_arn:
        node_group_arn = eks_manager.create_managed_node_group(
            'my-eks-cluster',
            'my-node-group',
            node_role_arn,
            subnet_ids,
            ['t3.medium', 't3.large']
        )
```

### Cluster Configuration with eksctl

```bash
# Create cluster configuration file
cat > cluster-config.yaml << EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: production-cluster
  region: us-east-1
  version: "1.28"

# VPC Configuration
vpc:
  id: vpc-12345678  # Replace with your VPC ID
  subnets:
    private:
      us-east-1a: { id: subnet-12345678 }
      us-east-1b: { id: subnet-87654321 }
    public:
      us-east-1a: { id: subnet-abcdef12 }
      us-east-1b: { id: subnet-fedcba21 }

# Node Groups
managedNodeGroups:
  - name: worker-nodes
    instanceType: t3.medium
    minSize: 2
    maxSize: 10
    desiredCapacity: 3
    privateNetworking: true
    ssh:
      allow: true
      publicKeyName: my-key-pair
    labels:
      role: worker
    tags:
      Environment: production
      NodeGroup: worker-nodes
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        externalDNS: true
        certManager: true
        appMesh: true
        appMeshPreview: true
        ebs: true
        fsx: true
        efs: true
        albIngress: true
        xRay: true
        cloudWatch: true

# Add-ons
addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: aws-ebs-csi-driver
    version: latest

# CloudWatch Logging
cloudWatch:
  clusterLogging:
    enableTypes:
      - api
      - audit
      - authenticator
      - controllerManager
      - scheduler
    logRetentionInDays: 30
EOF

# Create cluster
eksctl create cluster -f cluster-config.yaml

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name production-cluster
```

## Node Groups and Fargate {#node-management}

### Managing Different Node Types

```python
class EKSNodeManager:
    def __init__(self):
        self.eks = boto3.client('eks')
        self.ec2 = boto3.client('ec2')
    
    def create_fargate_profile(self, cluster_name, profile_name, execution_role_arn, subnet_ids):
        """
        Create Fargate profile for serverless pods
        """
        try:
            response = self.eks.create_fargate_profile(
                fargateProfileName=profile_name,
                clusterName=cluster_name,
                podExecutionRoleArn=execution_role_arn,
                subnets=subnet_ids,
                selectors=[
                    {
                        'namespace': 'fargate-namespace',
                        'labels': {
                            'compute-type': 'fargate'
                        }
                    },
                    {
                        'namespace': 'kube-system',
                        'labels': {
                            'k8s-app': 'coredns'
                        }
                    }
                ],
                tags={
                    'Environment': 'production',
                    'ComputeType': 'fargate'
                }
            )
            
            profile_arn = response['fargateProfile']['fargateProfileArn']
            print(f"Fargate profile created: {profile_arn}")
            return profile_arn
            
        except Exception as e:
            print(f"Error creating Fargate profile: {e}")
            return None
    
    def create_self_managed_nodes(self, cluster_name, node_group_name, instance_type='t3.medium'):
        """
        Create self-managed node group using launch template
        """
        # User data script for EKS worker nodes
        user_data_script = f"""#!/bin/bash
/etc/eks/bootstrap.sh {cluster_name}
yum update -y
yum install -y amazon-cloudwatch-agent
"""
        
        try:
            # Create launch template
            response = self.ec2.create_launch_template(
                LaunchTemplateName=f"{node_group_name}-template",
                LaunchTemplateData={
                    'ImageId': 'ami-0c02fb55956c7d316',  # Replace with latest EKS-optimized AMI
                    'InstanceType': instance_type,
                    'KeyName': 'my-key-pair',
                    'SecurityGroupIds': ['sg-12345678'],  # Replace with appropriate security group
                    'UserData': user_data_script.encode('utf-8').decode('ascii'),
                    'IamInstanceProfile': {
                        'Name': 'EKSNodeInstanceProfile'  # Replace with your instance profile
                    },
                    'TagSpecifications': [
                        {
                            'ResourceType': 'instance',
                            'Tags': [
                                {'Key': 'Name', 'Value': f'{node_group_name}-node'},
                                {'Key': 'kubernetes.io/cluster/{cluster_name}', 'Value': 'owned'},
                                {'Key': 'k8s.io/cluster-autoscaler/{cluster_name}', 'Value': 'owned'},
                                {'Key': 'k8s.io/cluster-autoscaler/enabled', 'Value': 'true'}
                            ]
                        }
                    ]
                }
            )
            
            template_id = response['LaunchTemplate']['LaunchTemplateId']
            print(f"Launch template created: {template_id}")
            
            # Create Auto Scaling Group
            autoscaling = boto3.client('autoscaling')
            autoscaling.create_auto_scaling_group(
                AutoScalingGroupName=f"{node_group_name}-asg",
                LaunchTemplate={
                    'LaunchTemplateId': template_id,
                    'Version': '$Latest'
                },
                MinSize=1,
                MaxSize=10,
                DesiredCapacity=3,
                VPCZoneIdentifier='subnet-12345678,subnet-87654321',  # Replace with your subnets
                Tags=[
                    {
                        'Key': 'Name',
                        'Value': f'{node_group_name}-asg',
                        'PropagateAtLaunch': True,
                        'ResourceId': f"{node_group_name}-asg",
                        'ResourceType': 'auto-scaling-group'
                    }
                ]
            )
            
            print(f"Auto Scaling Group created: {node_group_name}-asg")
            return template_id
            
        except Exception as e:
            print(f"Error creating self-managed nodes: {e}")
            return None
    
    def configure_cluster_autoscaler(self, cluster_name):
        """
        Deploy cluster autoscaler configuration
        """
        cluster_autoscaler_yaml = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 300Mi
          requests:
            cpu: 100m
            memory: 300Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/{cluster_name}
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        env:
        - name: AWS_REGION
          value: us-east-1
        volumeMounts:
        - name: ssl-certs
          mountPath: /etc/ssl/certs/ca-certificates.crt
          readOnly: true
      volumes:
      - name: ssl-certs
        hostPath:
          path: /etc/ssl/certs/ca-bundle.crt
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-addon: cluster-autoscaler.addons.k8s.io
    k8s-app: cluster-autoscaler
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/cluster-autoscaler-role
"""
        return cluster_autoscaler_yaml
    
    def get_node_group_info(self, cluster_name):
        """
        Get information about all node groups
        """
        try:
            response = self.eks.list_nodegroups(clusterName=cluster_name)
            node_groups = []
            
            for ng_name in response['nodegroups']:
                ng_detail = self.eks.describe_nodegroup(
                    clusterName=cluster_name,
                    nodegroupName=ng_name
                )
                
                node_group_info = {
                    'name': ng_name,
                    'status': ng_detail['nodegroup']['status'],
                    'instance_types': ng_detail['nodegroup']['instanceTypes'],
                    'capacity': ng_detail['nodegroup']['scalingConfig'],
                    'ami_type': ng_detail['nodegroup']['amiType'],
                    'node_role': ng_detail['nodegroup']['nodeRole'],
                    'subnets': ng_detail['nodegroup']['subnets']
                }
                node_groups.append(node_group_info)
            
            return node_groups
            
        except Exception as e:
            print(f"Error getting node group info: {e}")
            return []

# Node management examples
node_manager = EKSNodeManager()

# Get node group information
node_groups = node_manager.get_node_group_info('production-cluster')
print("Node Groups:")
for ng in node_groups:
    print(f"  Name: {ng['name']}")
    print(f"  Status: {ng['status']}")
    print(f"  Instance Types: {ng['instance_types']}")
    print(f"  Capacity: {ng['capacity']}")
    print()

# Create Fargate profile
# fargate_profile = node_manager.create_fargate_profile(
#     'production-cluster',
#     'fargate-profile',
#     'arn:aws:iam::123456789012:role/EKSFargateRole',
#     ['subnet-12345678', 'subnet-87654321']
# )

# Deploy cluster autoscaler
autoscaler_yaml = node_manager.configure_cluster_autoscaler('production-cluster')
print("Cluster Autoscaler YAML:")
print(autoscaler_yaml)
```

## Application Deployment {#application-deployment}

### Kubernetes Deployment Examples

```python
import yaml
from kubernetes import client, config

class KubernetesDeploymentManager:
    def __init__(self):
        # Load kube config
        try:
            config.load_kube_config()
            self.v1 = client.CoreV1Api()
            self.apps_v1 = client.AppsV1Api()
            self.networking_v1 = client.NetworkingV1Api()
            print("Kubernetes client initialized successfully")
        except Exception as e:
            print(f"Error initializing Kubernetes client: {e}")
    
    def create_namespace(self, namespace_name):
        """
        Create a Kubernetes namespace
        """
        namespace = client.V1Namespace(
            metadata=client.V1ObjectMeta(
                name=namespace_name,
                labels={
                    'name': namespace_name,
                    'managed-by': 'python-client'
                }
            )
        )
        
        try:
            response = self.v1.create_namespace(namespace)
            print(f"Namespace '{namespace_name}' created successfully")
            return response
        except Exception as e:
            print(f"Error creating namespace: {e}")
    
    def create_deployment(self, name, namespace, image, replicas=3, port=80):
        """
        Create a Kubernetes deployment
        """
        # Define deployment
        deployment = client.V1Deployment(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace
            ),
            spec=client.V1DeploymentSpec(
                replicas=replicas,
                selector=client.V1LabelSelector(
                    match_labels={'app': name}
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(
                        labels={'app': name}
                    ),
                    spec=client.V1PodSpec(
                        containers=[
                            client.V1Container(
                                name=name,
                                image=image,
                                ports=[client.V1ContainerPort(container_port=port)],
                                resources=client.V1ResourceRequirements(
                                    requests={'cpu': '100m', 'memory': '128Mi'},
                                    limits={'cpu': '500m', 'memory': '512Mi'}
                                ),
                                liveness_probe=client.V1Probe(
                                    http_get=client.V1HTTPGetAction(
                                        path='/health',
                                        port=port
                                    ),
                                    initial_delay_seconds=30,
                                    period_seconds=10
                                ),
                                readiness_probe=client.V1Probe(
                                    http_get=client.V1HTTPGetAction(
                                        path='/ready',
                                        port=port
                                    ),
                                    initial_delay_seconds=5,
                                    period_seconds=5
                                )
                            )
                        ]
                    )
                )
            )
        )
        
        try:
            response = self.apps_v1.create_namespaced_deployment(
                namespace=namespace,
                body=deployment
            )
            print(f"Deployment '{name}' created in namespace '{namespace}'")
            return response
        except Exception as e:
            print(f"Error creating deployment: {e}")
    
    def create_service(self, name, namespace, port=80, target_port=80, service_type='ClusterIP'):
        """
        Create a Kubernetes service
        """
        service = client.V1Service(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace
            ),
            spec=client.V1ServiceSpec(
                selector={'app': name},
                ports=[client.V1ServicePort(
                    port=port,
                    target_port=target_port,
                    protocol='TCP'
                )],
                type=service_type
            )
        )
        
        try:
            response = self.v1.create_namespaced_service(
                namespace=namespace,
                body=service
            )
            print(f"Service '{name}' created in namespace '{namespace}'")
            return response
        except Exception as e:
            print(f"Error creating service: {e}")
    
    def create_ingress(self, name, namespace, host, service_name, service_port=80):
        """
        Create a Kubernetes ingress
        """
        ingress = client.V1Ingress(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace,
                annotations={
                    'kubernetes.io/ingress.class': 'alb',
                    'alb.ingress.kubernetes.io/scheme': 'internet-facing',
                    'alb.ingress.kubernetes.io/target-type': 'ip',
                    'alb.ingress.kubernetes.io/certificate-arn': 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
                }
            ),
            spec=client.V1IngressSpec(
                rules=[
                    client.V1IngressRule(
                        host=host,
                        http=client.V1HTTPIngressRuleValue(
                            paths=[
                                client.V1HTTPIngressPath(
                                    path='/',
                                    path_type='Prefix',
                                    backend=client.V1IngressBackend(
                                        service=client.V1IngressServiceBackend(
                                            name=service_name,
                                            port=client.V1ServiceBackendPort(number=service_port)
                                        )
                                    )
                                )
                            ]
                        )
                    )
                ]
            )
        )
        
        try:
            response = self.networking_v1.create_namespaced_ingress(
                namespace=namespace,
                body=ingress
            )
            print(f"Ingress '{name}' created in namespace '{namespace}'")
            return response
        except Exception as e:
            print(f"Error creating ingress: {e}")
    
    def create_horizontal_pod_autoscaler(self, name, namespace, deployment_name, min_replicas=2, max_replicas=10, cpu_target=70):
        """
        Create Horizontal Pod Autoscaler
        """
        hpa_yaml = f"""
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {name}
  namespace: {namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {deployment_name}
  minReplicas: {min_replicas}
  maxReplicas: {max_replicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: {cpu_target}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
"""
        return hpa_yaml

# Deployment examples
k8s_manager = KubernetesDeploymentManager()

# Create application namespace
k8s_manager.create_namespace('my-app')

# Deploy web application
k8s_manager.create_deployment(
    name='web-app',
    namespace='my-app',
    image='nginx:1.21',
    replicas=3,
    port=80
)

# Create service
k8s_manager.create_service(
    name='web-app',
    namespace='my-app',
    port=80,
    target_port=80,
    service_type='ClusterIP'
)

# Create ingress
k8s_manager.create_ingress(
    name='web-app-ingress',
    namespace='my-app',
    host='myapp.example.com',
    service_name='web-app',
    service_port=80
)

# Generate HPA YAML
hpa_yaml = k8s_manager.create_horizontal_pod_autoscaler(
    'web-app-hpa',
    'my-app',
    'web-app'
)

print("Horizontal Pod Autoscaler YAML:")
print(hpa_yaml)
```

### Helm Chart Deployment

```python
import subprocess
import yaml

class HelmManager:
    def __init__(self):
        self.helm_binary = 'helm'
    
    def add_repository(self, repo_name, repo_url):
        """
        Add Helm repository
        """
        try:
            result = subprocess.run([
                self.helm_binary, 'repo', 'add', repo_name, repo_url
            ], capture_output=True, text=True, check=True)
            
            print(f"Repository '{repo_name}' added successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error adding repository: {e.stderr}")
            return False
    
    def update_repositories(self):
        """
        Update Helm repositories
        """
        try:
            result = subprocess.run([
                self.helm_binary, 'repo', 'update'
            ], capture_output=True, text=True, check=True)
            
            print("Repositories updated successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error updating repositories: {e.stderr}")
            return False
    
    def install_chart(self, release_name, chart_name, namespace='default', values_file=None, set_values=None):
        """
        Install Helm chart
        """
        cmd = [self.helm_binary, 'install', release_name, chart_name, '--namespace', namespace, '--create-namespace']
        
        if values_file:
            cmd.extend(['--values', values_file])
        
        if set_values:
            for key, value in set_values.items():
                cmd.extend(['--set', f'{key}={value}'])
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"Chart '{chart_name}' installed as release '{release_name}'")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error installing chart: {e.stderr}")
            return False
    
    def create_aws_load_balancer_controller_values(self):
        """
        Create values file for AWS Load Balancer Controller
        """
        values = {
            'clusterName': 'production-cluster',
            'serviceAccount': {
                'create': True,
                'annotations': {
                    'eks.amazonaws.com/role-arn': 'arn:aws:iam::123456789012:role/aws-load-balancer-controller-role'
                }
            },
            'region': 'us-east-1',
            'vpcId': 'vpc-12345678'
        }
        
        with open('aws-load-balancer-controller-values.yaml', 'w') as f:
            yaml.dump(values, f, default_flow_style=False)
        
        return 'aws-load-balancer-controller-values.yaml'

# Helm deployment examples
helm_manager = HelmManager()

# Add EKS chart repository
helm_manager.add_repository('eks', 'https://aws.github.io/eks-charts')

# Add Kubernetes dashboard
helm_manager.add_repository('kubernetes-dashboard', 'https://kubernetes.github.io/dashboard/')

# Update repositories
helm_manager.update_repositories()

# Install AWS Load Balancer Controller
values_file = helm_manager.create_aws_load_balancer_controller_values()
helm_manager.install_chart(
    'aws-load-balancer-controller',
    'eks/aws-load-balancer-controller',
    'kube-system',
    values_file=values_file
)

# Install Kubernetes Dashboard
helm_manager.install_chart(
    'kubernetes-dashboard',
    'kubernetes-dashboard/kubernetes-dashboard',
    'kubernetes-dashboard'
)

# Install Prometheus and Grafana for monitoring
helm_manager.add_repository('prometheus-community', 'https://prometheus-community.github.io/helm-charts')
helm_manager.update_repositories()

# Install kube-prometheus-stack
helm_manager.install_chart(
    'prometheus',
    'prometheus-community/kube-prometheus-stack',
    'monitoring',
    set_values={
        'grafana.adminPassword': 'admin123',
        'prometheus.prometheusSpec.retention': '30d'
    }
)
```

## Monitoring and Logging {#monitoring-logging}

### Container Insights and CloudWatch Integration

```python
class EKSMonitoringManager:
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.logs = boto3.client('logs')
    
    def setup_container_insights(self, cluster_name, region='us-east-1'):
        """
        Set up Container Insights for EKS cluster
        """
        # CloudWatch Agent ConfigMap
        cloudwatch_config = f"""
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {{
      "logs": {{
        "metrics_collected": {{
          "kubernetes": {{
            "cluster_name": "{cluster_name}",
            "metrics_collection_interval": 60
          }}
        }},
        "force_flush_interval": 5
      }}
    }}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cloudwatch-agent
  namespace: amazon-cloudwatch
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/CloudWatchAgentServerRole
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: cloudwatch-agent
  namespace: amazon-cloudwatch
spec:
  selector:
    matchLabels:
      name: cloudwatch-agent
  template:
    metadata:
      labels:
        name: cloudwatch-agent
    spec:
      containers:
      - name: cloudwatch-agent
        image: amazon/cloudwatch-agent:1.247348.0b251780
        ports:
        - containerPort: 8125
          hostPort: 8125
          protocol: UDP
        resources:
          limits:
            cpu: 200m
            memory: 200Mi
          requests:
            cpu: 200m
            memory: 200Mi
        env:
        - name: HOST_IP
          valueFrom:
            fieldRef:
              fieldPath: status.hostIP
        - name: HOST_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: K8S_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: cwagentconfig
          mountPath: /etc/cwagentconfig
        - name: rootfs
          mountPath: /rootfs
          readOnly: true
        - name: dockersock
          mountPath: /var/run/docker.sock
          readOnly: true
        - name: varlibdocker
          mountPath: /var/lib/docker
          readOnly: true
        - name: sys
          mountPath: /sys
          readOnly: true
        - name: devdisk
          mountPath: /dev/disk
          readOnly: true
      volumes:
      - name: cwagentconfig
        configMap:
          name: cwagentconfig
      - name: rootfs
        hostPath:
          path: /
      - name: dockersock
        hostPath:
          path: /var/run/docker.sock
      - name: varlibdocker
        hostPath:
          path: /var/lib/docker
      - name: sys
        hostPath:
          path: /sys
      - name: devdisk
        hostPath:
          path: /dev/disk
      terminationGracePeriodSeconds: 60
      serviceAccountName: cloudwatch-agent
"""
        return cloudwatch_config
    
    def create_custom_metrics_dashboard(self, cluster_name):
        """
        Create CloudWatch dashboard for EKS metrics
        """
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ContainerInsights", "cluster_node_count", "ClusterName", cluster_name],
                            [".", "cluster_failed_node_count", ".", "."],
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Cluster Node Status",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "x": 12,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ContainerInsights", "pod_cpu_utilization", "ClusterName", cluster_name],
                            [".", "pod_memory_utilization", ".", "."],
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Pod Resource Utilization",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "x": 0,
                    "y": 6,
                    "width": 24,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ContainerInsights", "service_number_of_running_pods", "ClusterName", cluster_name]
                        ],
                        "view": "timeSeries",
                        "stacked": False,
                        "region": "us-east-1",
                        "title": "Running Pods",
                        "period": 300
                    }
                }
            ]
        }
        
        try:
            response = self.cloudwatch.put_dashboard(
                DashboardName=f'EKS-{cluster_name}-Overview',
                DashboardBody=json.dumps(dashboard_body)
            )
            print(f"Dashboard created for cluster {cluster_name}")
            return response
        except Exception as e:
            print(f"Error creating dashboard: {e}")
    
    def setup_log_aggregation(self, cluster_name):
        """
        Set up Fluent Bit for log aggregation
        """
        fluent_bit_config = f"""
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: amazon-cloudwatch
  labels:
    k8s-app: fluent-bit
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush                     5
        Log_Level                 info
        Daemon                    off
        Parsers_File              parsers.conf
        HTTP_Server               On
        HTTP_Listen               0.0.0.0
        HTTP_Port                 2020
        storage.path              /var/fluent-bit/state/flb-storage/
        storage.sync              normal
        storage.checksum          off
        storage.backlog.mem_limit 5M
        
    @INCLUDE application-log.conf
    @INCLUDE dataplane-log.conf
    @INCLUDE host-log.conf

  application-log.conf: |
    [INPUT]
        Name                tail
        Tag                 application.*
        Exclude_Path        /var/log/containers/cloudwatch-agent*, /var/log/containers/fluent-bit*
        Path                /var/log/containers/*.log
        multiline.parser    docker, cri
        DB                  /var/fluent-bit/state/flb_container.db
        Mem_Buf_Limit       50MB
        Skip_Long_Lines     On
        Refresh_Interval    10
        Rotate_Wait         30
        storage.type        filesystem
        Read_from_Head      Off

    [FILTER]
        Name                kubernetes
        Match               application.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     application.var.log.containers.
        Merge_Log           On
        Merge_Log_Key       log_processed
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off
        Labels              Off
        Annotations         Off

    [OUTPUT]
        Name                cloudwatch_logs
        Match               application.*
        region              us-east-1
        log_group_name      /aws/containerinsights/{cluster_name}/application
        log_stream_prefix   ${{kubernetes['pod_name']}}
        auto_create_group   true
        extra_user_agent    container-insights

  parsers.conf: |
    [PARSER]
        Name   apache
        Format regex
        Regex  ^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^\"]*?)(?: +\S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)")?$
        Time_Key time
        Time_Format %d/%b/%Y:%H:%M:%S %z

    [PARSER]
        Name   apache2
        Format regex
        Regex  ^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^ ]*) +\S*)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)")?$
        Time_Key time
        Time_Format %d/%b/%Y:%H:%M:%S %z
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: amazon-cloudwatch
  labels:
    k8s-app: fluent-bit
    version: v1
    kubernetes.io/cluster-service: "true"
spec:
  selector:
    matchLabels:
      k8s-app: fluent-bit
  template:
    metadata:
      labels:
        k8s-app: fluent-bit
        version: v1
        kubernetes.io/cluster-service: "true"
    spec:
      containers:
      - name: fluent-bit
        image: amazon/aws-for-fluent-bit:2.28.4
        imagePullPolicy: Always
        env:
        - name: AWS_REGION
          valueFrom:
            configMapKeyRef:
              name: fluent-bit-cluster-info
              key: cluster.region
        - name: CLUSTER_NAME
          valueFrom:
            configMapKeyRef:
              name: fluent-bit-cluster-info
              key: cluster.name
        - name: HTTP_SERVER
          value: "On"
        - name: HTTP_PORT
          value: "2020"
        - name: READ_FROM_HEAD
          value: "Off"
        - name: READ_FROM_TAIL
          value: "On"
        - name: HOST_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: HOSTNAME
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.name
        - name: CI_VERSION
          value: "k8s/1.3.12"
        resources:
          limits:
            cpu: 500m
            memory: 200Mi
          requests:
            cpu: 500m
            memory: 200Mi
        volumeMounts:
        - name: fluentbitstate
          mountPath: /var/fluent-bit/state
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc/
        - name: runlogjournal
          mountPath: /run/log/journal
          readOnly: true
        - name: dmesg
          mountPath: /var/log/dmesg
          readOnly: true
      terminationGracePeriodSeconds: 10
      volumes:
      - name: fluentbitstate
        hostPath:
          path: /var/fluent-bit/state
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
      - name: runlogjournal
        hostPath:
          path: /run/log/journal
      - name: dmesg
        hostPath:
          path: /var/log/dmesg
      serviceAccountName: fluent-bit
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule
      - operator: "Exists"
        effect: "NoExecute"
      - operator: "Exists"
        effect: "NoSchedule"
"""
        return fluent_bit_config

# Monitoring setup examples
monitoring_manager = EKSMonitoringManager()

# Set up Container Insights
container_insights_config = monitoring_manager.setup_container_insights('production-cluster')

# Create CloudWatch dashboard
monitoring_manager.create_custom_metrics_dashboard('production-cluster')

# Set up log aggregation
fluent_bit_config = monitoring_manager.setup_log_aggregation('production-cluster')

print("Container Insights Configuration:")
print(container_insights_config)
```

## Best Practices {#best-practices}

### EKS Security and Operational Best Practices

```python
class EKSBestPractices:
    def __init__(self):
        self.eks = boto3.client('eks')
    
    def security_best_practices(self):
        """
        Implement EKS security best practices
        """
        security_practices = {
            'cluster_security': {
                'enable_endpoint_private_access': True,
                'disable_endpoint_public_access_if_possible': True,
                'restrict_public_access_cidrs': ['YOUR_OFFICE_IP/32'],
                'enable_cluster_logging': ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler']
            },
            'node_security': {
                'use_latest_ami': 'Always use latest EKS-optimized AMI',
                'implement_pod_security_standards': 'Use Pod Security Standards',
                'resource_quotas': 'Implement resource quotas and limits',
                'network_policies': 'Use Kubernetes network policies'
            },
            'rbac_configuration': self.generate_rbac_examples(),
            'secrets_management': self.secrets_management_practices(),
            'container_security': self.container_security_practices()
        }
        
        return security_practices
    
    def generate_rbac_examples(self):
        """
        Generate RBAC configuration examples
        """
        rbac_configs = {
            'developer_role': """
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: development
subjects:
- kind: User
  name: developer@company.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
""",
            'readonly_role': """
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: readonly
rules:
- apiGroups: [""]
  resources: ["*"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["*"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: readonly-binding
subjects:
- kind: User
  name: readonly@company.com
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: readonly
  apiGroup: rbac.authorization.k8s.io
"""
        }
        
        return rbac_configs
    
    def secrets_management_practices(self):
        """
        Secrets management best practices
        """
        practices = {
            'external_secrets_operator': {
                'description': 'Use External Secrets Operator with AWS Secrets Manager',
                'example_yaml': """
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: default
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-secret
  namespace: default
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: database-secret
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: prod/database
      property: username
  - secretKey: password
    remoteRef:
      key: prod/database
      property: password
"""
            },
            'sealed_secrets': {
                'description': 'Use Sealed Secrets for GitOps workflows',
                'installation': 'kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml'
            }
        }
        
        return practices
    
    def container_security_practices(self):
        """
        Container security best practices
        """
        practices = {
            'pod_security_standards': """
apiVersion: v1
kind: Namespace
metadata:
  name: secure-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
""",
            'security_context_example': """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: app
        image: myapp:latest
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: var-run
          mountPath: /var/run
      volumes:
      - name: tmp
        emptyDir: {}
      - name: var-run
        emptyDir: {}
""",
            'network_policy_example': """
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - protocol: TCP
      port: 8080
"""
        }
        
        return practices
    
    def operational_best_practices(self):
        """
        Operational best practices for EKS
        """
        practices = {
            'resource_management': {
                'resource_quotas': """
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: development
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
    services: "5"
    secrets: "10"
    configmaps: "10"
""",
                'limit_ranges': """
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
  namespace: development
spec:
  limits:
  - default:
      memory: "512Mi"
      cpu: "500m"
    defaultRequest:
      memory: "256Mi"
      cpu: "100m"
    type: Container
"""
            },
            'cluster_maintenance': {
                'upgrade_strategy': 'Always test upgrades in non-production first',
                'backup_strategy': 'Regular etcd backups and configuration backups',
                'monitoring': 'Comprehensive monitoring and alerting setup',
                'logging': 'Centralized logging with retention policies'
            },
            'cost_optimization': {
                'right_sizing': 'Regular review of resource requests and limits',
                'spot_instances': 'Use spot instances for non-critical workloads',
                'cluster_autoscaler': 'Implement cluster autoscaler for dynamic scaling',
                'vertical_pod_autoscaler': 'Use VPA for automatic resource optimization'
            }
        }
        
        return practices
    
    def disaster_recovery_practices(self):
        """
        Disaster recovery best practices
        """
        dr_practices = {
            'backup_strategies': {
                'velero_backup': """
# Install Velero for cluster backup
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts/
helm install velero vmware-tanzu/velero \\
  --namespace velero \\
  --create-namespace \\
  --set-file credentials.secretContents.cloud=./credentials-velero \\
  --set configuration.provider=aws \\
  --set configuration.backupStorageLocation.bucket=my-backup-bucket \\
  --set configuration.backupStorageLocation.config.region=us-east-1 \\
  --set configuration.volumeSnapshotLocation.config.region=us-east-1 \\
  --set initContainers[0].name=velero-plugin-for-aws \\
  --set initContainers[0].image=velero/velero-plugin-for-aws:v1.5.0 \\
  --set initContainers[0].volumeMounts[0].mountPath=/target \\
  --set initContainers[0].volumeMounts[0].name=plugins
""",
                'automated_backups': """
# Schedule automated backups
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
    - production
    - staging
    storageLocation: default
    ttl: "720h"  # 30 days retention
"""
            },
            'multi_region_setup': {
                'description': 'Set up clusters in multiple regions for high availability',
                'considerations': [
                    'Cross-region networking setup',
                    'Data replication strategy',
                    'DNS failover configuration',
                    'Application state management'
                ]
            }
        }
        
        return dr_practices

# Best practices implementation
best_practices = EKSBestPractices()

# Get security best practices
security_practices = best_practices.security_best_practices()
print("EKS Security Best Practices:")
print(json.dumps(security_practices, indent=2))

# Get operational best practices
operational_practices = best_practices.operational_best_practices()
print("\nEKS Operational Best Practices:")
print(json.dumps(operational_practices, indent=2, default=str))

# Get disaster recovery practices
dr_practices = best_practices.disaster_recovery_practices()
print("\nEKS Disaster Recovery Best Practices:")
print(json.dumps(dr_practices, indent=2))
```

## Cost Optimization {#cost-optimization}

### EKS Cost Management Strategies

```python
class EKSCostOptimizer:
    def __init__(self):
        self.eks = boto3.client('eks')
        self.ce = boto3.client('ce')  # Cost Explorer
        self.ec2 = boto3.client('ec2')
    
    def analyze_eks_costs(self, cluster_name, start_date, end_date):
        """
        Analyze EKS cluster costs
        """
        try:
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
                    'And': [
                        {
                            'Dimensions': {
                                'Key': 'SERVICE',
                                'Values': ['Amazon Elastic Kubernetes Service']
                            }
                        },
                        {
                            'Dimensions': {
                                'Key': 'RESOURCE_ID',
                                'Values': [cluster_name]
                            }
                        }
                    ]
                }
            )
            
            cost_breakdown = {}
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    usage_type = group['Keys'][0]
                    cost = float(group['Metrics']['BlendedCost']['Amount'])
                    usage = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    cost_breakdown[usage_type] = {
                        'cost': cost,
                        'usage': usage
                    }
            
            return cost_breakdown
            
        except Exception as e:
            print(f"Error analyzing EKS costs: {e}")
            return {}
    
    def optimize_node_groups(self, cluster_name):
        """
        Analyze and optimize node group configurations
        """
        try:
            response = self.eks.list_nodegroups(clusterName=cluster_name)
            optimizations = []
            
            for ng_name in response['nodegroups']:
                ng_detail = self.eks.describe_nodegroup(
                    clusterName=cluster_name,
                    nodegroupName=ng_name
                )
                
                nodegroup = ng_detail['nodegroup']
                recommendations = []
                
                # Check instance types
                instance_types = nodegroup['instanceTypes']
                if len(instance_types) == 1 and 't2.' in instance_types[0]:
                    recommendations.append("Consider using newer generation instances (t3, t4g)")
                
                # Check scaling configuration
                scaling = nodegroup['scalingConfig']
                if scaling['minSize'] == scaling['desiredSize']:
                    recommendations.append("Enable auto-scaling by setting minSize < desiredSize")
                
                # Check capacity type
                capacity_type = nodegroup.get('capacityType', 'ON_DEMAND')
                if capacity_type == 'ON_DEMAND':
                    recommendations.append("Consider using SPOT instances for cost savings")
                
                # Check disk size
                disk_size = nodegroup.get('diskSize', 20)
                if disk_size > 50:
                    recommendations.append("Large disk size - consider using separate EBS volumes")
                
                if recommendations:
                    optimizations.append({
                        'nodegroup_name': ng_name,
                        'current_config': {
                            'instance_types': instance_types,
                            'capacity_type': capacity_type,
                            'scaling_config': scaling,
                            'disk_size': disk_size
                        },
                        'recommendations': recommendations
                    })
            
            return optimizations
            
        except Exception as e:
            print(f"Error optimizing node groups: {e}")
            return []
    
    def implement_spot_instances(self, cluster_name, node_group_name):
        """
        Create spot instance node group
        """
        spot_node_group_config = {
            'clusterName': cluster_name,
            'nodegroupName': f"{node_group_name}-spot",
            'scalingConfig': {
                'minSize': 0,
                'maxSize': 10,
                'desiredSize': 3
            },
            'instanceTypes': ['t3.medium', 't3.large', 't3a.medium', 't3a.large'],
            'capacityType': 'SPOT',
            'amiType': 'AL2_x86_64',
            'nodeRole': 'arn:aws:iam::123456789012:role/NodeInstanceRole',
            'subnets': ['subnet-12345678', 'subnet-87654321'],
            'labels': {
                'node-type': 'spot',
                'cost-optimization': 'enabled'
            },
            'taints': [
                {
                    'key': 'spot-instance',
                    'value': 'true',
                    'effect': 'NO_SCHEDULE'
                }
            ],
            'tags': {
                'NodeType': 'Spot',
                'CostOptimization': 'Enabled'
            }
        }
        
        return spot_node_group_config
    
    def setup_cluster_autoscaler_with_cost_optimization(self, cluster_name):
        """
        Configure cluster autoscaler for cost optimization
        """
        autoscaler_config = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8085'
    spec:
      priorityClassName: system-cluster-critical
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.21.0
        name: cluster-autoscaler
        resources:
          limits:
            cpu: 100m
            memory: 600Mi
          requests:
            cpu: 100m
            memory: 600Mi
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/{cluster_name}
        - --balance-similar-node-groups
        - --skip-nodes-with-system-pods=false
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --scale-down-delay-after-delete=10s
        - --scale-down-delay-after-failure=3m
        - --scale-down-utilization-threshold=0.5
        - --max-node-provision-time=15m
        env:
        - name: AWS_REGION
          value: us-east-1
        - name: AWS_STS_REGIONAL_ENDPOINTS
          value: regional
        volumeMounts:
        - name: ssl-certs
          mountPath: /etc/ssl/certs/ca-certificates.crt
          readOnly: true
      volumes:
      - name: ssl-certs
        hostPath:
          path: /etc/ssl/certs/ca-bundle.crt
      nodeSelector:
        kubernetes.io/os: linux
"""
        return autoscaler_config
    
    def setup_vertical_pod_autoscaler(self):
        """
        Set up VPA for automatic resource optimization
        """
        vpa_examples = {
            'vpa_installation': """
# Install VPA
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler/
./hack/vpa-install.sh
""",
            'vpa_example': """
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: web-app
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits
""",
            'vpa_monitoring': """
# Check VPA recommendations
kubectl describe vpa web-app-vpa

# Get current resource usage
kubectl top pods -n production

# View VPA status
kubectl get vpa -A
"""
        }
        
        return vpa_examples
    
    def generate_cost_optimization_report(self, cluster_name):
        """
        Generate comprehensive cost optimization report
        """
        from datetime import datetime, timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        report = {
            'cluster_name': cluster_name,
            'report_date': datetime.utcnow().isoformat(),
            'cost_analysis': self.analyze_eks_costs(cluster_name, start_date, end_date),
            'node_group_optimizations': self.optimize_node_groups(cluster_name),
            'recommendations': {
                'immediate': [
                    'Implement cluster autoscaler with cost-optimized settings',
                    'Enable spot instances for non-critical workloads',
                    'Right-size resource requests and limits',
                    'Set up VPA for automatic optimization'
                ],
                'medium_term': [
                    'Consider Fargate for irregular workloads',
                    'Implement pod disruption budgets',
                    'Use reserved instances for predictable workloads',
                    'Optimize storage costs with appropriate storage classes'
                ],
                'long_term': [
                    'Evaluate multi-arch (ARM-based) instances',
                    'Implement comprehensive monitoring for cost tracking',
                    'Consider cluster consolidation opportunities',
                    'Implement automated cost reporting and alerting'
                ]
            },
            'estimated_savings': {
                'spot_instances': '60-90% on compute costs',
                'right_sizing': '20-30% on resource costs',
                'cluster_autoscaler': '15-25% on unused capacity',
                'fargate_for_batch': '30-50% on sporadic workloads'
            }
        }
        
        return report

# Cost optimization examples
cost_optimizer = EKSCostOptimizer()

# Generate cost optimization report
report = cost_optimizer.generate_cost_optimization_report('production-cluster')

print("EKS Cost Optimization Report")
print("=" * 40)
print(json.dumps(report, indent=2, default=str))

# Get spot instance configuration
spot_config = cost_optimizer.implement_spot_instances('production-cluster', 'worker-nodes')
print("\nSpot Instance Node Group Configuration:")
print(json.dumps(spot_config, indent=2))

# Get cluster autoscaler configuration
autoscaler_config = cost_optimizer.setup_cluster_autoscaler_with_cost_optimization('production-cluster')
print("\nCluster Autoscaler Configuration:")
print(autoscaler_config)

# Get VPA setup
vpa_setup = cost_optimizer.setup_vertical_pod_autoscaler()
print("\nVertical Pod Autoscaler Setup:")
print(json.dumps(vpa_setup, indent=2))
```

## Conclusion

Amazon EKS provides a robust, managed Kubernetes platform that simplifies container orchestration on AWS. Key takeaways:

### Essential Components:
- **Managed Control Plane**: AWS handles Kubernetes master components
- **Flexible Node Options**: Choose between managed node groups, self-managed nodes, or Fargate
- **AWS Integration**: Native integration with VPC, IAM, and other AWS services
- **Add-ons**: Managed add-ons for core Kubernetes functionality

### Advanced Capabilities:
- **Multiple Compute Options**: EC2, Fargate, and Spot instances
- **Comprehensive Networking**: VPC CNI, load balancers, and network policies
- **Security Integration**: IAM roles, Pod Security Standards, and secrets management
- **Observability**: Container Insights, logging, and monitoring integration
- **Auto-scaling**: Cluster autoscaler, HPA, and VPA for dynamic scaling

### Best Practices:
- Implement comprehensive security controls with RBAC and Pod Security Standards
- Use infrastructure as code for cluster and application management
- Implement proper monitoring, logging, and alerting
- Follow cost optimization strategies with spot instances and right-sizing
- Maintain disaster recovery and backup strategies
- Keep clusters and node groups updated with latest patches

### Cost Optimization Strategies:
- Leverage spot instances for non-critical workloads (60-90% savings)
- Implement cluster autoscaler for dynamic scaling
- Use Vertical Pod Autoscaler for right-sizing
- Consider Fargate for sporadic or batch workloads
- Monitor and optimize resource requests and limits

EKS enables organizations to focus on application development while AWS manages the complexity of Kubernetes infrastructure, providing a secure, scalable, and cost-effective container orchestration platform.