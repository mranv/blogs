---
author: Anubhav Gain
pubDatetime: 2024-04-05T08:15:00+05:30
modDatetime: 2024-04-13T08:15:00+05:30
title: "90 Days Recap and Next Steps"
slug: 90days-96-90-days-recap-and-next-steps
featured: false
draft: false
tags:
  - community
  - learning
  - career
  - devops-journey
  - resources
category: Community & Learning
description: "Day 96 of 90 Days of DevOps - 90 Days Recap and Next Steps. Part of the Community & Learning series covering essential DevOps concepts and hands-on practices."
---

# Day 96 - Modern Infrastructure as Code: From Terraform to Pulumi

[![Watch the video](/thumbnails/day96.png)](https://www.youtube.com/watch?v=placeholder96)

Infrastructure as Code (IaC) has revolutionized how we provision and manage infrastructure. As we move into 2025, the landscape has evolved beyond declarative configuration to include full programming languages, policy engines, and AI-assisted infrastructure management. Today, we'll explore modern IaC tools, patterns, and best practices for managing infrastructure at scale.

## The Evolution of Infrastructure as Code

The IaC journey has been transformative:

- **2011-2014**: Configuration management (Puppet, Chef, Ansible)
- **2014-2018**: Declarative IaC (Terraform, CloudFormation)
- **2018-2021**: Cloud-native tools (CDK, Pulumi)
- **2021-2025**: AI-assisted IaC and policy-driven infrastructure

## Modern IaC Tools Comparison

### Terraform: The Industry Standard

```hcl
# terraform/modules/kubernetes-cluster/main.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = var.enable_public_access
    public_access_cidrs    = var.public_access_cidrs
    security_group_ids     = [aws_security_group.cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.cluster_AmazonEKSVPCResourceController,
    aws_cloudwatch_log_group.eks,
  ]

  tags = merge(
    var.tags,
    {
      "Name" = var.cluster_name
    }
  )
}

# Node Groups with mixed instance types
resource "aws_eks_node_group" "main" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type # ON_DEMAND or SPOT

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  update_config {
    max_unavailable_percentage = 33
  }

  launch_template {
    id      = aws_launch_template.node[each.key].id
    version = aws_launch_template.node[each.key].latest_version
  }

  labels = each.value.labels

  taints = [
    for taint in each.value.taints : {
      key    = taint.key
      value  = taint.value
      effect = taint.effect
    }
  ]

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.node_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.node_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# Advanced networking with VPC CNI custom configuration
resource "kubernetes_config_map" "aws_auth" {
  metadata {
    name      = "aws-auth"
    namespace = "kube-system"
  }

  data = {
    mapRoles = yamlencode(concat(
      [
        {
          rolearn  = aws_iam_role.node.arn
          username = "system:node:{{EC2PrivateDNSName}}"
          groups   = ["system:bootstrappers", "system:nodes"]
        }
      ],
      var.map_roles
    ))
    mapUsers = yamlencode(var.map_users)
  }

  depends_on = [aws_eks_cluster.main]
}
```

### Pulumi: Infrastructure as Real Code

```typescript
// pulumi/infrastructure/index.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

interface ModernClusterArgs {
  vpcCidr: string;
  availabilityZones: string[];
  nodeGroups: NodeGroupConfig[];
  enableGitOps: boolean;
  enableServiceMesh: boolean;
  monitoringConfig: MonitoringConfig;
}

class ModernKubernetesCluster extends ComponentResource {
  public cluster: eks.Cluster;
  public kubeconfig: pulumi.Output<any>;

  constructor(name: string, args: ModernClusterArgs, opts?: ComponentResourceOptions) {
    super("custom:infrastructure:ModernKubernetesCluster", name, {}, opts);

    // Create VPC with advanced networking
    const vpc = new awsx.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.vpcCidr,
      numberOfAvailabilityZones: args.availabilityZones.length,
      natGateways: {
        strategy: "HighlyAvailable",
      },
      tags: {
        "kubernetes.io/cluster/"+name: "shared",
      },
    }, { parent: this });

    // Create EKS cluster with OIDC
    this.cluster = new eks.Cluster(`${name}-cluster`, {
      vpc: vpc,
      version: "1.28",
      nodeAssociatePublicIpAddress: false,
      endpointPrivateAccess: true,
      endpointPublicAccess: true,
      enabledClusterLogTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"],

      // Advanced node group configurations
      nodeGroups: args.nodeGroups.map(ng => ({
        ...ng,
        instanceType: ng.instanceTypes,
        nodeAssociatePublicIpAddress: false,

        // Spot instance support
        spotPrice: ng.useSpot ? ng.spotPrice : undefined,

        // Custom launch template
        launchTemplate: {
          userData: this.generateUserData(ng),
          blockDeviceMappings: [{
            deviceName: "/dev/xvda",
            ebs: {
              volumeSize: ng.diskSize || 100,
              volumeType: "gp3",
              iops: 3000,
              throughput: 125,
              encrypted: true,
            },
          }],
        },

        // Auto-scaling configuration
        autoScaling: {
          enabled: true,
          minSize: ng.minSize,
          maxSize: ng.maxSize,
          targetCpuUtilization: 70,
          targetMemoryUtilization: 80,
        },
      })),

      // Fargate profiles for serverless workloads
      fargateProfiles: [{
        name: "system-critical",
        selectors: [{
          namespace: "kube-system",
          labels: {
            "compute-type": "fargate",
          },
        }],
      }],
    }, { parent: this });

    // Install core add-ons
    this.installCoreAddons();

    // GitOps setup
    if (args.enableGitOps) {
      this.setupGitOps();
    }

    // Service mesh installation
    if (args.enableServiceMesh) {
      this.installServiceMesh();
    }

    // Monitoring and observability
    this.setupMonitoring(args.monitoringConfig);

    this.kubeconfig = this.cluster.kubeconfig;

    this.registerOutputs({
      clusterName: this.cluster.eksCluster.name,
      kubeconfig: this.kubeconfig,
    });
  }

  private generateUserData(nodeGroup: NodeGroupConfig): string {
    return `#!/bin/bash
set -ex

# Install SSM agent for secure access
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Configure container runtime
cat <<EOF > /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "5"
  },
  "storage-driver": "overlay2"
}
EOF

# Set up kubelet extra args
cat <<EOF > /etc/systemd/system/kubelet.service.d/10-kubelet-args.conf
[Service]
Environment="KUBELET_EXTRA_ARGS=--node-labels=nodegroup=${nodeGroup.name} --register-with-taints=${nodeGroup.taints?.join(',') || ''}"
EOF

# Optimize kernel parameters
cat <<EOF >> /etc/sysctl.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
vm.max_map_count = 262144
fs.inotify.max_user_instances = 8192
fs.inotify.max_user_watches = 524288
EOF

sysctl -p

# Join the cluster
/etc/eks/bootstrap.sh ${this.cluster.eksCluster.name}
`;
  }

  private async installCoreAddons() {
    // AWS Load Balancer Controller
    const albController = new k8s.helm.v3.Chart("aws-load-balancer-controller", {
      chart: "aws-load-balancer-controller",
      version: "1.6.2",
      namespace: "kube-system",
      fetchOpts: {
        repo: "https://aws.github.io/eks-charts",
      },
      values: {
        clusterName: this.cluster.eksCluster.name,
        serviceAccount: {
          create: true,
          annotations: {
            "eks.amazonaws.com/role-arn": this.createIRSARole("aws-load-balancer-controller", [
              "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess",
            ]).arn,
          },
        },
      },
    }, { provider: this.cluster.provider, parent: this });

    // EBS CSI Driver
    const ebsCsiDriver = new k8s.helm.v3.Chart("aws-ebs-csi-driver", {
      chart: "aws-ebs-csi-driver",
      namespace: "kube-system",
      fetchOpts: {
        repo: "https://kubernetes-sigs.github.io/aws-ebs-csi-driver",
      },
      values: {
        controller: {
          serviceAccount: {
            create: true,
            annotations: {
              "eks.amazonaws.com/role-arn": this.createIRSARole("ebs-csi-controller", [
                "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy",
              ]).arn,
            },
          },
        },
      },
    }, { provider: this.cluster.provider, parent: this });
  }

  private setupGitOps() {
    // Install Flux v2
    const flux = new k8s.helm.v3.Chart("flux2", {
      chart: "flux2",
      namespace: "flux-system",
      fetchOpts: {
        repo: "https://fluxcd-community.github.io/helm-charts",
      },
      values: {
        gitRepository: {
          url: pulumi.interpolate`${process.env.GIT_REPO_URL}`,
          branch: "main",
          interval: "1m",
        },
        kustomization: {
          path: "./clusters/production",
          prune: true,
          interval: "10m",
        },
      },
    }, { provider: this.cluster.provider, parent: this });
  }
}

// Export modern infrastructure with type safety
export const createModernInfrastructure = async () => {
  const cluster = new ModernKubernetesCluster("production", {
    vpcCidr: "10.0.0.0/16",
    availabilityZones: ["us-west-2a", "us-west-2b", "us-west-2c"],
    nodeGroups: [
      {
        name: "general-purpose",
        instanceTypes: ["t3.large", "t3a.large"],
        minSize: 3,
        maxSize: 10,
        diskSize: 100,
        useSpot: false,
      },
      {
        name: "compute-optimized",
        instanceTypes: ["c5.2xlarge", "c5a.2xlarge"],
        minSize: 0,
        maxSize: 20,
        diskSize: 200,
        useSpot: true,
        spotPrice: "0.20",
        taints: ["workload=compute:NoSchedule"],
        labels: {
          "workload": "compute",
          "instance-type": "compute-optimized",
        },
      },
    ],
    enableGitOps: true,
    enableServiceMesh: true,
    monitoringConfig: {
      enablePrometheus: true,
      enableGrafana: true,
      enableLoki: true,
      enableTempo: true,
      retentionDays: 30,
    },
  });

  return {
    clusterName: cluster.cluster.eksCluster.name,
    kubeconfig: cluster.kubeconfig,
    clusterEndpoint: cluster.cluster.eksCluster.endpoint,
  };
};
```

### AWS CDK: Cloud-Native Constructs

```typescript
// cdk/lib/modern-infrastructure-stack.ts
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export class ModernInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with custom CIDR and flow logs
    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 3,
      natGateways: 3,
      cidr: "10.0.0.0/16",
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 20,
        },
        {
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      flowLogs: {
        VPCFlowLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Advanced EKS cluster with custom configuration
    const cluster = new eks.Cluster(this, "Cluster", {
      vpc,
      version: eks.KubernetesVersion.V1_28,
      defaultCapacity: 0, // We'll add custom node groups
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      albController: {
        version: eks.AlbControllerVersion.V2_6_2,
      },

      // Custom security group rules
      securityGroup: new ec2.SecurityGroup(this, "ClusterSecurityGroup", {
        vpc,
        description: "EKS cluster security group",
        allowAllOutbound: false,
      }),
    });

    // Add custom managed node groups
    const generalNodeGroup = cluster.addNodegroupCapacity("GeneralNodeGroup", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        ec2.InstanceType.of(ec2.InstanceClass.M5A, ec2.InstanceSize.LARGE),
      ],
      minSize: 3,
      maxSize: 10,
      diskSize: 100,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      launchTemplateSpec: {
        userData: ec2.UserData.forLinux({
          shebang: "#!/bin/bash",
        }).addCommands(
          'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
          "sysctl -p"
        ),
      },
    });

    // GPU node group for ML workloads
    const gpuNodeGroup = cluster.addNodegroupCapacity("GPUNodeGroup", {
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.P3, ec2.InstanceSize.XLARGE2),
      ],
      minSize: 0,
      maxSize: 5,
      labels: {
        workload: "gpu",
        "nvidia.com/gpu": "true",
      },
      taints: [
        {
          effect: eks.TaintEffect.NO_SCHEDULE,
          key: "nvidia.com/gpu",
          value: "true",
        },
      ],
    });

    // Custom resource for advanced cluster configuration
    const clusterConfigLambda = new lambda.Function(
      this,
      "ClusterConfigFunction",
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "index.handler",
        code: lambda.Code.fromInline(`
import json
import boto3
import urllib3

def handler(event, context):
    if event['RequestType'] == 'Delete':
        return {'StatusCode': 200}
    
    # Configure advanced cluster settings
    eks_client = boto3.client('eks')
    cluster_name = event['ResourceProperties']['ClusterName']
    
    # Enable additional features
    response = eks_client.associate_encryption_config(
        clusterName=cluster_name,
        encryptionConfig=[{
            'resources': ['secrets'],
            'provider': {
                'keyArn': event['ResourceProperties']['KmsKeyArn']
            }
        }]
    )
    
    return {
        'StatusCode': 200,
        'PhysicalResourceId': f'{cluster_name}-encryption-config'
    }
      `),
        timeout: cdk.Duration.minutes(15),
      }
    );

    clusterConfigLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["eks:*", "kms:*"],
        resources: ["*"],
      })
    );

    new cr.Provider(this, "ClusterConfigProvider", {
      onEventHandler: clusterConfigLambda,
    });

    // Implement cost optimization through intelligent scheduling
    this.implementCostOptimization(cluster);

    // Set up advanced monitoring
    this.setupAdvancedMonitoring(cluster);

    // Configure backup and disaster recovery
    this.setupBackupAndDR(cluster);
  }

  private implementCostOptimization(cluster: eks.Cluster) {
    // Karpenter for intelligent node provisioning
    const karpenter = new eks.HelmChart(this, "Karpenter", {
      cluster,
      chart: "karpenter",
      repository: "oci://public.ecr.aws/karpenter/karpenter",
      namespace: "karpenter",
      version: "v0.33.0",
      values: {
        serviceAccount: {
          annotations: {
            "eks.amazonaws.com/role-arn": new iam.Role(this, "KarpenterRole", {
              assumedBy: new iam.ServicePrincipal("eks.amazonaws.com"),
              managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                  "AmazonEKSClusterPolicy"
                ),
              ],
            }).roleArn,
          },
        },
        settings: {
          aws: {
            clusterName: cluster.clusterName,
            defaultInstanceProfile: "KarpenterNodeInstanceProfile",
            interruptionQueueName: cluster.clusterName,
          },
        },
      },
    });
  }
}
```

### Crossplane: Kubernetes-Native Infrastructure

```yaml
# crossplane/compositions/aws-rds-composition.yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: xpostgresqlinstances.database.company.com
spec:
  compositeTypeRef:
    apiVersion: database.company.com/v1alpha1
    kind: XPostgreSQLInstance

  patchSets:
    - name: common-fields
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.region
          toFieldPath: spec.forProvider.region
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.deletionPolicy
          toFieldPath: spec.deletionPolicy

  resources:
    # VPC for database
    - name: vpc
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: VPC
        spec:
          forProvider:
            cidrBlock: 10.0.0.0/16
            enableDnsHostnames: true
            enableDnsSupport: true
      patches:
        - type: PatchSet
          patchSetName: common-fields

    # Subnet Group
    - name: subnet-group
      base:
        apiVersion: rds.aws.crossplane.io/v1alpha1
        kind: DBSubnetGroup
        spec:
          forProvider:
            description: "Subnet group for PostgreSQL instance"
            subnetIdSelector:
              matchLabels:
                type: database
      patches:
        - type: PatchSet
          patchSetName: common-fields

    # Security Group
    - name: security-group
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: SecurityGroup
        spec:
          forProvider:
            description: "Security group for PostgreSQL instance"
            vpcIdSelector:
              matchControllerRef: true
            ingress:
              - fromPort: 5432
                toPort: 5432
                ipProtocol: tcp
                ipRanges:
                  - cidrIp: 10.0.0.0/16
                    description: "VPC access"

    # Parameter Group
    - name: parameter-group
      base:
        apiVersion: rds.aws.crossplane.io/v1alpha1
        kind: DBParameterGroup
        spec:
          forProvider:
            dbParameterGroupFamily: postgres14
            description: "Custom parameter group for PostgreSQL"
            parameters:
              - parameterName: shared_preload_libraries
                parameterValue: pg_stat_statements
              - parameterName: log_statement
                parameterValue: all
              - parameterName: log_min_duration_statement
                parameterValue: "1000"

    # RDS Instance
    - name: rds-instance
      base:
        apiVersion: rds.aws.crossplane.io/v1alpha1
        kind: DBInstance
        spec:
          forProvider:
            engine: postgres
            engineVersion: "14.9"
            dbInstanceClass: db.t3.medium
            allocatedStorage: 100
            storageType: gp3
            storageEncrypted: true

            backupRetentionPeriod: 30
            preferredBackupWindow: "03:00-04:00"
            preferredMaintenanceWindow: "sun:04:00-sun:05:00"

            enableCloudwatchLogsExports:
              - postgresql

            dbSubnetGroupNameSelector:
              matchControllerRef: true
            vpcSecurityGroupIDSelector:
              matchControllerRef: true
            dbParameterGroupNameSelector:
              matchControllerRef: true

      patches:
        - type: PatchSet
          patchSetName: common-fields
        - fromFieldPath: spec.parameters.instanceSize
          toFieldPath: spec.forProvider.dbInstanceClass
          transforms:
            - type: map
              map:
                small: db.t3.small
                medium: db.t3.medium
                large: db.r6i.large
                xlarge: db.r6i.xlarge
        - fromFieldPath: spec.parameters.storageGB
          toFieldPath: spec.forProvider.allocatedStorage
        - fromFieldPath: spec.parameters.engineVersion
          toFieldPath: spec.forProvider.engineVersion
        - fromFieldPath: metadata.uid
          toFieldPath: spec.forProvider.masterUsername
          transforms:
            - type: string
              string:
                fmt: "postgres"
        - fromFieldPath: metadata.uid
          toFieldPath: spec.writeConnectionSecretToRef.name
          transforms:
            - type: string
              string:
                fmt: "%s-postgresql"
        - fromFieldPath: spec.writeConnectionSecretToRef.namespace
          toFieldPath: spec.writeConnectionSecretToRef.namespace

    # Automated backups to S3
    - name: backup-configuration
      base:
        apiVersion: backup.aws.crossplane.io/v1alpha1
        kind: BackupPlan
        spec:
          forProvider:
            rules:
              - ruleName: DailyBackups
                targetBackupVault:
                  name: postgresql-backups
                schedule: "cron(0 5 ? * * *)"
                lifecycle:
                  deleteAfterDays: 30
                  moveToColdStorageAfterDays: 7
```

## Advanced IaC Patterns

### Policy as Code with OPA

```rego
# policies/infrastructure/cost_control.rego
package infrastructure.cost_control

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# Maximum allowed cost per month
max_monthly_cost := 10000

# Deny expensive instance types
deny[msg] {
    input.resource_type == "aws_instance"
    expensive_instances := ["x1e.xlarge", "p3.2xlarge", "i3.metal"]
    input.instance_type in expensive_instances
    msg := sprintf("Instance type %s is too expensive for this environment", [input.instance_type])
}

# Require tagging for cost allocation
deny[msg] {
    input.resource_type in ["aws_instance", "aws_rds_instance", "aws_eks_cluster"]
    required_tags := ["Environment", "CostCenter", "Owner", "Project"]
    missing_tags := required_tags[_]
    not input.tags[missing_tags]
    msg := sprintf("Missing required tag: %s", [missing_tags])
}

# Enforce resource limits
deny[msg] {
    input.resource_type == "aws_eks_node_group"
    input.max_size > 50
    msg := "Node group max size cannot exceed 50 instances"
}

# Cost estimation
estimated_monthly_cost[resource_id] = cost {
    resource := input.resources[resource_id]
    instance_costs := {
        "t3.micro": 7.49,
        "t3.small": 14.98,
        "t3.medium": 29.95,
        "t3.large": 59.90,
        "m5.large": 69.12,
        "m5.xlarge": 138.24,
        "c5.large": 61.92,
        "c5.xlarge": 123.84
    }
    cost := instance_costs[resource.instance_type] * resource.count * 24 * 30
}

# Enforce cost limits
deny[msg] {
    total_cost := sum([cost | cost := estimated_monthly_cost[_]])
    total_cost > max_monthly_cost
    msg := sprintf("Estimated monthly cost $%.2f exceeds limit of $%.2f", [total_cost, max_monthly_cost])
}
```

### Infrastructure Testing with Terratest

```go
// test/infrastructure_test.go
package test

import (
    "crypto/tls"
    "fmt"
    "testing"
    "time"

    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/gruntwork-io/terratest/modules/http-helper"
    "github.com/gruntwork-io/terratest/modules/k8s"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestKubernetesCluster(t *testing.T) {
    t.Parallel()

    // Configure Terraform options
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../terraform/environments/test",
        Vars: map[string]interface{}{
            "cluster_name": fmt.Sprintf("test-cluster-%s", random.UniqueId()),
            "region":       "us-west-2",
            "node_count":   3,
        },
    })

    // Clean up resources
    defer terraform.Destroy(t, terraformOptions)

    // Deploy infrastructure
    terraform.InitAndApply(t, terraformOptions)

    // Get outputs
    clusterName := terraform.Output(t, terraformOptions, "cluster_name")
    region := terraform.Output(t, terraformOptions, "region")
    kubeconfig := terraform.Output(t, terraformOptions, "kubeconfig")

    // Verify cluster is running
    cluster := aws.GetEksCluster(t, region, clusterName)
    assert.Equal(t, "ACTIVE", cluster.Status)

    // Test Kubernetes connectivity
    options := k8s.NewKubectlOptionsFromConfig(kubeconfig, "")

    // Verify nodes are ready
    nodes := k8s.GetNodes(t, options)
    require.Equal(t, 3, len(nodes))

    for _, node := range nodes {
        assert.True(t, k8s.IsNodeReady(node))
    }

    // Deploy test application
    k8s.KubectlApply(t, options, "../k8s/test-app.yaml")
    defer k8s.KubectlDelete(t, options, "../k8s/test-app.yaml")

    // Wait for deployment
    k8s.WaitUntilDeploymentAvailable(t, options, "test-app", 10, 30*time.Second)

    // Get service endpoint
    service := k8s.GetService(t, options, "test-app")
    endpoint := k8s.GetServiceEndpoint(t, options, service, 80)

    // Test application is accessible
    tlsConfig := &tls.Config{InsecureSkipVerify: true}
    http_helper.HttpGetWithRetryWithCustomValidation(
        t,
        fmt.Sprintf("http://%s", endpoint),
        tlsConfig,
        30,
        10*time.Second,
        func(statusCode int, body string) bool {
            return statusCode == 200
        },
    )
}

func TestInfrastructureCompliance(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../terraform/modules/vpc",
    })

    // Run compliance checks
    plan := terraform.InitAndPlan(t, terraformOptions)

    // Verify security group rules
    resourceChanges := terraform.GetResourceChangesFromPlan(t, plan)

    for _, change := range resourceChanges {
        if change.Type == "aws_security_group_rule" {
            // Ensure no 0.0.0.0/0 ingress rules
            assert.NotContains(t, change.AttributeChanges["cidr_blocks"], "0.0.0.0/0")
        }
    }

    // Verify encryption is enabled
    for _, change := range resourceChanges {
        if change.Type == "aws_ebs_volume" || change.Type == "aws_rds_cluster" {
            assert.True(t, change.AttributeChanges["encrypted"].(bool))
        }
    }
}
```

### AI-Assisted Infrastructure Generation

```python
# ai_infrastructure_generator.py
import openai
from typing import Dict, Any
import json
import hcl2
import yaml

class AIInfrastructureGenerator:
    def __init__(self):
        self.openai_client = openai.Client()
        self.templates = self.load_templates()

    def generate_infrastructure(self, requirements: str) -> Dict[str, Any]:
        """Generate infrastructure code from natural language requirements"""

        # Analyze requirements
        analysis = self.analyze_requirements(requirements)

        # Generate base infrastructure
        infrastructure = self.generate_base_infrastructure(analysis)

        # Optimize for cost and performance
        optimized = self.optimize_infrastructure(infrastructure)

        # Add security best practices
        secured = self.apply_security_practices(optimized)

        # Validate generated code
        self.validate_infrastructure(secured)

        return secured

    def analyze_requirements(self, requirements: str) -> Dict[str, Any]:
        """Use AI to analyze infrastructure requirements"""

        prompt = f"""
        Analyze the following infrastructure requirements and extract:
        1. Cloud provider (AWS, Azure, GCP)
        2. Required services (compute, storage, networking, databases)
        3. Scale requirements (number of users, requests per second)
        4. Security requirements (compliance, encryption, access control)
        5. Budget constraints
        6. Performance requirements

        Requirements: {requirements}

        Return as JSON.
        """

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an infrastructure architect expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        return json.loads(response.choices[0].message.content)

    def generate_base_infrastructure(self, analysis: Dict[str, Any]) -> str:
        """Generate infrastructure code based on analysis"""

        if analysis['cloud_provider'] == 'AWS':
            return self.generate_terraform_aws(analysis)
        elif analysis['cloud_provider'] == 'Azure':
            return self.generate_terraform_azure(analysis)
        elif analysis['cloud_provider'] == 'GCP':
            return self.generate_terraform_gcp(analysis)

    def generate_terraform_aws(self, analysis: Dict[str, Any]) -> str:
        """Generate Terraform code for AWS"""

        prompt = f"""
        Generate production-ready Terraform code for AWS with:
        - Services: {', '.join(analysis['required_services'])}
        - Scale: {analysis['scale_requirements']}
        - Security: {analysis['security_requirements']}
        - Budget: {analysis['budget_constraints']}

        Include:
        1. VPC with proper CIDR planning
        2. High availability across multiple AZs
        3. Security groups with least privilege
        4. Encryption at rest and in transit
        5. Backup and disaster recovery
        6. Monitoring and alerting
        7. Cost optimization (spot instances, reserved capacity)

        Follow Terraform best practices and use latest provider versions.
        """

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a Terraform expert. Generate only valid HCL code."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        return response.choices[0].message.content

    def optimize_infrastructure(self, infrastructure: str) -> str:
        """Optimize generated infrastructure for cost and performance"""

        # Parse infrastructure code
        if infrastructure.endswith('.tf'):
            parsed = hcl2.loads(infrastructure)
        else:
            parsed = yaml.safe_load(infrastructure)

        # Apply optimization rules
        optimizations = {
            'use_spot_instances': self.should_use_spot_instances(parsed),
            'enable_autoscaling': self.should_enable_autoscaling(parsed),
            'optimize_storage': self.optimize_storage_configuration(parsed),
            'network_optimization': self.optimize_network_configuration(parsed),
        }

        # Generate optimized code
        optimized_prompt = f"""
        Optimize the following infrastructure code with these recommendations:
        {json.dumps(optimizations, indent=2)}

        Original code:
        {infrastructure}

        Apply optimizations while maintaining functionality.
        """

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an infrastructure optimization expert."},
                {"role": "user", "content": optimized_prompt}
            ],
            temperature=0.2
        )

        return response.choices[0].message.content
```

## Infrastructure Lifecycle Management

### Automated Drift Detection

```python
# drift_detection.py
class InfrastructureDriftDetector:
    def __init__(self):
        self.terraform_client = TerraformClient()
        self.cloud_clients = {
            'aws': boto3.Session(),
            'azure': AzureClient(),
            'gcp': GCPClient()
        }

    async def detect_drift(self, workspace: str) -> DriftReport:
        """Detect infrastructure drift across all resources"""

        # Get current state
        tf_state = self.terraform_client.get_state(workspace)

        # Compare with actual resources
        drift_items = []

        for resource in tf_state.resources:
            actual_state = await self.get_actual_state(resource)
            expected_state = resource.attributes

            differences = self.compare_states(expected_state, actual_state)

            if differences:
                drift_items.append({
                    'resource': resource.address,
                    'type': resource.type,
                    'differences': differences,
                    'severity': self.calculate_severity(differences),
                    'remediation': self.suggest_remediation(differences)
                })

        return DriftReport(
            workspace=workspace,
            scan_time=datetime.now(),
            total_resources=len(tf_state.resources),
            drifted_resources=len(drift_items),
            drift_items=drift_items,
            risk_score=self.calculate_risk_score(drift_items)
        )

    def suggest_remediation(self, differences: List[Difference]) -> Dict[str, Any]:
        """AI-powered remediation suggestions"""

        critical_drift = [d for d in differences if d.severity == 'critical']

        if critical_drift:
            return {
                'action': 'immediate',
                'method': 'terraform_apply',
                'risk': 'high',
                'estimated_downtime': self.estimate_downtime(differences),
                'rollback_plan': self.generate_rollback_plan(differences)
            }
        else:
            return {
                'action': 'scheduled',
                'method': 'incremental_update',
                'risk': 'low',
                'maintenance_window': self.suggest_maintenance_window()
            }
```

### Blue-Green Infrastructure Deployments

```typescript
// blue-green-deployment.ts
export class BlueGreenInfrastructure {
  private readonly pulumiClient: automation.LocalWorkspace;

  async deployBlueGreen(config: BlueGreenConfig): Promise<DeploymentResult> {
    // Create green environment
    const greenStack = await this.createGreenEnvironment(config);

    // Run validation tests
    const validationResults = await this.validateGreenEnvironment(greenStack);

    if (!validationResults.passed) {
      await this.rollbackGreenEnvironment(greenStack);
      throw new Error(`Validation failed: ${validationResults.errors}`);
    }

    // Gradual traffic shift
    await this.performTrafficShift(config, greenStack);

    // Monitor metrics
    const metrics = await this.monitorDeployment(greenStack);

    if (metrics.errorRate > config.errorThreshold) {
      await this.rollbackTrafficShift(config);
      throw new Error("Error rate exceeded threshold");
    }

    // Complete cutover
    await this.completeCutover(config, greenStack);

    // Cleanup blue environment
    await this.cleanupBlueEnvironment(config);

    return {
      deploymentId: greenStack.name,
      duration: Date.now() - startTime,
      metrics: metrics,
    };
  }

  private async performTrafficShift(
    config: BlueGreenConfig,
    greenStack: automation.Stack
  ): Promise<void> {
    const stages = [10, 25, 50, 75, 100];

    for (const percentage of stages) {
      // Update load balancer weights
      await this.updateLoadBalancerWeights({
        blue: 100 - percentage,
        green: percentage,
      });

      // Wait and monitor
      await this.sleep(config.stageDuration);

      const metrics = await this.collectMetrics();
      if (!this.metricsHealthy(metrics)) {
        await this.updateLoadBalancerWeights({
          blue: 100,
          green: 0,
        });
        throw new Error(`Metrics unhealthy at ${percentage}% traffic`);
      }
    }
  }
}
```

## Modern IaC Best Practices

### 1. **GitOps-Driven Infrastructure**

```yaml
# .github/workflows/infrastructure-gitops.yml
name: Infrastructure GitOps

on:
  push:
    paths:
      - "infrastructure/**"
      - ".github/workflows/infrastructure-*.yml"

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Security Scanning
        run: |
          # Scan for secrets
          trufflehog filesystem --directory=infrastructure/

          # Policy validation
          opa test policies/infrastructure/

          # IaC security scanning
          checkov -d infrastructure/

      - name: Cost Estimation
        run: |
          infracost breakdown --path infrastructure/
          infracost diff --path infrastructure/ --compare-to main

      - name: Generate Plan
        run: |
          cd infrastructure/
          terraform init
          terraform plan -out=plan.tfplan
          terraform show -json plan.tfplan > plan.json

      - name: AI Review
        run: |
          python scripts/ai_review_infrastructure.py plan.json
```

### 2. **Multi-Cloud Abstraction**

```typescript
// multi-cloud-abstraction.ts
export abstract class CloudResource {
  abstract deploy(): Promise<void>;
  abstract validate(): Promise<boolean>;
  abstract destroy(): Promise<void>;
}

export class MultiCloudDatabase extends CloudResource {
  constructor(
    private provider: "aws" | "azure" | "gcp",
    private config: DatabaseConfig
  ) {
    super();
  }

  async deploy(): Promise<void> {
    switch (this.provider) {
      case "aws":
        return this.deployRDS();
      case "azure":
        return this.deployAzureSQL();
      case "gcp":
        return this.deployCloudSQL();
    }
  }

  private async deployRDS(): Promise<void> {
    // AWS RDS deployment with sensible defaults
    const rds = new aws.rds.Instance("database", {
      engine: "postgres",
      engineVersion: "14.9",
      instanceClass: this.getInstanceClass(),
      allocatedStorage: this.config.storageGb,
      storageEncrypted: true,
      backupRetentionPeriod: 30,
      multiAz: this.config.highAvailability,
      vpcSecurityGroupIds: [this.getSecurityGroup()],
      dbSubnetGroupName: this.getSubnetGroup(),
    });
  }
}
```

### 3. **Self-Healing Infrastructure**

```python
# self_healing_infrastructure.py
class SelfHealingInfrastructure:
    def __init__(self):
        self.health_checks = []
        self.remediation_actions = {}

    async def monitor_and_heal(self):
        """Continuous monitoring and self-healing loop"""

        while True:
            unhealthy_resources = await self.check_health()

            for resource in unhealthy_resources:
                try:
                    await self.attempt_healing(resource)
                except Exception as e:
                    await self.escalate_to_humans(resource, e)

            await asyncio.sleep(60)  # Check every minute

    async def attempt_healing(self, resource: UnhealthyResource):
        """Attempt to heal unhealthy resource"""

        healing_strategies = [
            self.restart_resource,
            self.scale_horizontally,
            self.failover_to_backup,
            self.recreate_resource
        ]

        for strategy in healing_strategies:
            try:
                result = await strategy(resource)
                if result.success:
                    await self.notify_healing_success(resource, strategy)
                    return
            except Exception as e:
                continue

        # All strategies failed
        raise HealingFailedException(resource)
```

## The Future of Infrastructure as Code

### AI-Driven Infrastructure

- Natural language to infrastructure
- Intelligent optimization
- Predictive scaling
- Automated security hardening

### Quantum-Ready Infrastructure

- Quantum-safe encryption
- Hybrid classical-quantum workloads
- Quantum networking preparation

### Sustainable Infrastructure

- Carbon-aware deployments
- Energy-efficient resource allocation
- Green cloud provider selection

## Conclusion

Modern Infrastructure as Code has evolved far beyond simple configuration files. With tools like Pulumi bringing real programming languages, Crossplane enabling Kubernetes-native infrastructure, and AI assisting in generation and optimization, we can build more sophisticated, reliable, and efficient infrastructure than ever before. The key is choosing the right tool for your team's skills and requirements while following best practices for testing, security, and operations.

## Additional Resources

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS CDK Patterns](https://cdkpatterns.com/)
- [Crossplane Guides](https://crossplane.io/docs/)
- [Infrastructure as Code Security](https://bridgecrew.io/infrastructure-as-code-security/)

This concludes our 96-day journey through the world of DevOps! Thank you for joining me on this comprehensive exploration of modern DevOps practices, tools, and techniques. Keep learning, keep building, and keep pushing the boundaries of what's possible in infrastructure and operations!
