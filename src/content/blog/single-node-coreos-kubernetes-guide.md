---
title: "Single Node CoreOS Kubernetes: Complete Setup and Configuration Guide"
slug: "single-node-coreos-kubernetes-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-11T00:00:00Z
featured: false
draft: false
tags:
  - kubernetes
  - coreos
  - containerization
  - orchestration
  - single-node
  - cluster-setup
  - devops
description: "Comprehensive guide to setting up a single-node Kubernetes cluster on CoreOS, covering installation, configuration, networking, and production-ready optimizations."
---

# Single Node CoreOS Kubernetes: Complete Setup Guide

This comprehensive guide walks you through setting up a production-ready single-node Kubernetes cluster on CoreOS. Learn to configure networking, storage, security, and monitoring for a robust container orchestration platform suitable for development, testing, and small-scale production workloads.

## Table of Contents

## Introduction to Single Node Kubernetes

Single-node Kubernetes clusters offer several advantages for specific use cases:

- **Development Environment**: Complete Kubernetes API for application development
- **Edge Computing**: Lightweight orchestration for edge deployments
- **Learning Platform**: Full Kubernetes features for education and training
- **Small Workloads**: Cost-effective solution for lightweight applications
- **CI/CD Pipeline**: Dedicated cluster for testing and deployment automation

### CoreOS Advantages for Kubernetes

CoreOS provides an optimal foundation for Kubernetes:

- **Container-Optimized**: Minimal OS designed specifically for containers
- **Automatic Updates**: Seamless OS updates without service disruption
- **Immutable Infrastructure**: Read-only root filesystem for enhanced security
- **Systemd Integration**: Native process management and service orchestration
- **etcd Built-in**: Distributed key-value store for Kubernetes state management

## Prerequisites and System Requirements

### Hardware Requirements

**Minimum specifications:**

- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB SSD (50GB recommended)
- **Network**: Stable internet connection for image downloads

**Production specifications:**

- **CPU**: 4+ cores with virtualization support
- **RAM**: 16GB+ for application workloads
- **Storage**: 100GB+ NVMe SSD with backup storage
- **Network**: High-bandwidth connection with static IP

### Software Prerequisites

```bash
# Check system requirements
lscpu | grep -E "(Architecture|CPU|Thread|Core)"
free -h
df -h
ip addr show

# Verify virtualization support
grep -E "(vmx|svm)" /proc/cpuinfo
```

## CoreOS Installation and Setup

### Initial CoreOS Configuration

```yaml
# ignition.yml - CoreOS Ignition configuration
variant: fcos
version: 1.4.0
passwd:
  users:
    - name: core
      ssh_authorized_keys:
        - ssh-rsa AAAAB3NzaC1yc2EAAAA... # Your SSH public key
      groups:
        - sudo
        - docker
      shell: /bin/bash

systemd:
  units:
    - name: docker.service
      enabled: true
    - name: kubelet.service
      enabled: true
    - name: k8s-setup.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubernetes Setup Service
        After=docker.service
        Requires=docker.service

        [Service]
        Type=oneshot
        ExecStart=/usr/local/bin/setup-kubernetes.sh
        RemainAfterExit=yes

        [Install]
        WantedBy=multi-user.target

storage:
  directories:
    - path: /opt/kubernetes
      mode: 0755
    - path: /var/lib/etcd
      mode: 0700
    - path: /etc/kubernetes
      mode: 0755
    - path: /var/log/pods
      mode: 0755

  files:
    - path: /usr/local/bin/setup-kubernetes.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euxo pipefail

          # Install kubeadm, kubelet, kubectl
          curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
          echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
          apt-get update
          apt-get install -y kubelet kubeadm kubectl
          apt-mark hold kubelet kubeadm kubectl

          # Configure kubelet
          echo 'KUBELET_EXTRA_ARGS="--fail-swap-on=false --container-runtime=docker"' > /etc/default/kubelet
          systemctl daemon-reload
          systemctl restart kubelet

    - path: /etc/kubernetes/kubeadm-config.yaml
      mode: 0644
      contents:
        inline: |
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: InitConfiguration
          localAPIEndpoint:
            advertiseAddress: "0.0.0.0"
            bindPort: 6443
          nodeRegistration:
            criSocket: "/var/run/dockershim.sock"
            kubeletExtraArgs:
              fail-swap-on: "false"
              container-runtime: "docker"
          ---
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: ClusterConfiguration
          kubernetesVersion: "v1.28.0"
          controlPlaneEndpoint: "127.0.0.1:6443"
          networking:
            serviceSubnet: "10.96.0.0/12"
            podSubnet: "10.244.0.0/16"
            dnsDomain: "cluster.local"
          etcd:
            local:
              dataDir: "/var/lib/etcd"
          apiServer:
            bindPort: 6443
            extraArgs:
              enable-admission-plugins: "NodeRestriction,ResourceQuota,LimitRanger"
          controllerManager:
            extraArgs:
              bind-address: "0.0.0.0"
          scheduler:
            extraArgs:
              bind-address: "0.0.0.0"
          ---
          apiVersion: kubelet.config.k8s.io/v1beta1
          kind: KubeletConfiguration
          failSwapOn: false
          containerRuntimeEndpoint: "unix:///var/run/dockershim.sock"
```

### CoreOS Installation Process

```bash
# Download CoreOS installer
curl -LO https://builds.coreos.fedoraproject.org/prod/streams/stable/builds/38.20230918.3.0/x86_64/fedora-coreos-38.20230918.3.0-live.x86_64.iso

# Create bootable USB (replace /dev/sdX with your USB device)
sudo dd if=fedora-coreos-38.20230918.3.0-live.x86_64.iso of=/dev/sdX bs=4M status=progress oflag=sync

# Boot from USB and install
sudo coreos-installer install /dev/sda --ignition-file ignition.yml --insecure-ignition
```

## Kubernetes Installation and Initialization

### Automated Installation Script

```bash
#!/bin/bash
# k8s-single-node-setup.sh

set -euo pipefail

KUBERNETES_VERSION="1.28.0"
CNI_PLUGIN="flannel"
LOG_FILE="/var/log/k8s-setup.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
trap 'log "ERROR: Script failed at line $LINENO"' ERR

log "Starting Kubernetes single-node setup"

# System preparation
prepare_system() {
    log "Preparing system for Kubernetes"

    # Disable swap
    swapoff -a
    sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

    # Load required kernel modules
    modprobe br_netfilter
    modprobe ip_vs
    modprobe ip_vs_rr
    modprobe ip_vs_wrr
    modprobe ip_vs_sh
    modprobe nf_conntrack

    # Make modules persistent
    cat > /etc/modules-load.d/k8s.conf << EOF
br_netfilter
ip_vs
ip_vs_rr
ip_vs_wrr
ip_vs_sh
nf_conntrack
EOF

    # Configure sysctl settings
    cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
vm.swappiness = 0
EOF

    sysctl --system
    log "System preparation completed"
}

# Install Docker
install_docker() {
    log "Installing Docker"

    # Install Docker from official repository
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io

    # Configure Docker daemon
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
    "exec-opts": ["native.cgroupdriver=systemd"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ],
    "registry-mirrors": ["https://mirror.gcr.io"],
    "insecure-registries": ["localhost:5000"]
}
EOF

    systemctl daemon-reload
    systemctl enable docker
    systemctl start docker

    # Add core user to docker group
    usermod -aG docker core

    log "Docker installation completed"
}

# Install Kubernetes components
install_kubernetes() {
    log "Installing Kubernetes components"

    # Add Kubernetes repository
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
    echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list

    apt-get update
    apt-get install -y kubelet=$KUBERNETES_VERSION-00 kubeadm=$KUBERNETES_VERSION-00 kubectl=$KUBERNETES_VERSION-00
    apt-mark hold kubelet kubeadm kubectl

    # Configure kubelet
    cat > /etc/default/kubelet << EOF
KUBELET_EXTRA_ARGS="--fail-swap-on=false --container-runtime=docker --cgroup-driver=systemd"
EOF

    systemctl daemon-reload
    systemctl enable kubelet

    log "Kubernetes components installed"
}

# Initialize Kubernetes cluster
initialize_cluster() {
    log "Initializing Kubernetes cluster"

    # Initialize cluster with kubeadm
    kubeadm init \
        --config=/etc/kubernetes/kubeadm-config.yaml \
        --upload-certs \
        --v=5 2>&1 | tee -a "$LOG_FILE"

    # Setup kubectl for core user
    mkdir -p /home/core/.kube
    cp -i /etc/kubernetes/admin.conf /home/core/.kube/config
    chown core:core /home/core/.kube/config

    # Setup kubectl for root
    export KUBECONFIG=/etc/kubernetes/admin.conf
    echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> /root/.bashrc

    log "Cluster initialization completed"
}

# Remove taints from master node (single-node setup)
configure_single_node() {
    log "Configuring single-node cluster"

    # Remove master node taint to allow scheduling
    kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
    kubectl taint nodes --all node-role.kubernetes.io/master- || true

    log "Single-node configuration completed"
}

# Install CNI plugin
install_cni() {
    log "Installing CNI plugin: $CNI_PLUGIN"

    case $CNI_PLUGIN in
        "flannel")
            kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
            ;;
        "calico")
            kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml
            kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml
            ;;
        "weave")
            kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
            ;;
    esac

    log "CNI plugin installation completed"
}

# Verify cluster setup
verify_cluster() {
    log "Verifying cluster setup"

    # Wait for nodes to be ready
    timeout=300
    while [[ $timeout -gt 0 ]]; do
        if kubectl get nodes | grep -q "Ready"; then
            break
        fi
        sleep 10
        ((timeout-=10))
    done

    # Display cluster information
    kubectl cluster-info
    kubectl get nodes -o wide
    kubectl get pods --all-namespaces

    log "Cluster verification completed"
}

# Main execution
main() {
    log "Starting Kubernetes single-node cluster setup"

    prepare_system
    install_docker
    install_kubernetes
    initialize_cluster
    configure_single_node
    install_cni
    verify_cluster

    log "Kubernetes single-node cluster setup completed successfully"
    log "Run 'kubectl get nodes' to verify cluster status"
    log "Run 'kubectl get pods --all-namespaces' to see system pods"
}

# Execute main function
main "$@"
```

## Networking Configuration

### Flannel CNI Setup

```yaml
# flannel-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: kubernetes.io/os
                    operator: In
                    values:
                      - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni-plugin
          image: rancher/mirrored-flannelcni-flannel-cni-plugin:v1.1.0
          command:
            - cp
          args:
            - -f
            - /flannel
            - /opt/cni/bin/flannel
          volumeMounts:
            - name: cni-plugin
              mountPath: /opt/cni/bin
        - name: install-cni
          image: rancher/mirrored-flannelcni-flannel:v0.19.2
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: rancher/mirrored-flannelcni-flannel:v0.19.2
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: ["NET_ADMIN", "NET_RAW"]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: EVENT_QUEUE_DEPTH
              value: "5000"
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
            - name: xtables-lock
              mountPath: /run/xtables.lock
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni-plugin
          hostPath:
            path: /opt/cni/bin
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
        - name: xtables-lock
          hostPath:
            path: /run/xtables.lock
            type: FileOrCreate
```

### Network Policy Implementation

```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-kube-system
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: kube-system
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
```

## Storage Configuration

### Local Storage Setup

```yaml
# local-storage.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-1
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /opt/local-storage/pv1
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - coreos-single-node
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv-2
spec:
  capacity:
    storage: 20Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /opt/local-storage/pv2
  nodeAffinity:
    required:
      nodeSelectorTerms:
        - matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - coreos-single-node
```

### Dynamic Storage Provisioning

```bash
#!/bin/bash
# setup-local-storage.sh

# Create directories for local storage
mkdir -p /opt/local-storage/{pv1,pv2,pv3,pv4,pv5}

# Set proper permissions
chmod 755 /opt/local-storage/*
chown -R root:root /opt/local-storage

# Install local-path-provisioner for dynamic provisioning
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.24/deploy/local-path-storage.yaml

# Set as default storage class
kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

# Verify storage setup
kubectl get storageclass
kubectl get pv
```

## Security Hardening

### RBAC Configuration

```yaml
# rbac-config.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: admin-user
    namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard-readonly
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: dashboard-readonly
rules:
  - apiGroups: [""]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps", "extensions"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dashboard-readonly
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: dashboard-readonly
subjects:
  - kind: ServiceAccount
    name: dashboard-readonly
    namespace: kube-system
```

### Pod Security Standards

```yaml
# pod-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-limits
  namespace: secure-namespace
spec:
  limits:
    - default:
        cpu: "200m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      type: Container
    - max:
        cpu: "1"
        memory: "1Gi"
      min:
        cpu: "50m"
        memory: "64Mi"
      type: Container
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: resource-quota
  namespace: secure-namespace
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    pods: "10"
    services: "5"
    persistentvolumeclaims: "3"
```

### Security Policies

```bash
#!/bin/bash
# security-hardening.sh

# Enable audit logging
mkdir -p /var/log/kubernetes

cat > /etc/kubernetes/audit-policy.yaml << EOF
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets", "configmaps"]
- level: RequestResponse
  resources:
  - group: ""
    resources: ["pods", "services"]
- level: Request
  namespaces: ["kube-system"]
EOF

# Update API server configuration
sed -i '/--enable-admission-plugins/s/$/,PodSecurityPolicy/' /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i '/--enable-admission-plugins/a\    - --audit-log-path=/var/log/kubernetes/audit.log' /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i '/--audit-log-path/a\    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml' /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i '/--audit-policy-file/a\    - --audit-log-maxage=30' /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i '/--audit-log-maxage/a\    - --audit-log-maxbackup=3' /etc/kubernetes/manifests/kube-apiserver.yaml
sed -i '/--audit-log-maxbackup/a\    - --audit-log-maxsize=100' /etc/kubernetes/manifests/kube-apiserver.yaml

# Restart kubelet to apply changes
systemctl restart kubelet

echo "Security hardening applied. Monitor /var/log/kubernetes/audit.log for security events."
```

## Monitoring and Observability

### Prometheus and Grafana Setup

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.45.0
          ports:
            - containerPort: 9090
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus/"
            - "--web.console.libraries=/etc/prometheus/console_libraries"
            - "--web.console.templates=/etc/prometheus/consoles"
            - "--storage.tsdb.retention.time=200h"
            - "--web.enable-lifecycle"
          volumeMounts:
            - name: prometheus-config
              mountPath: /etc/prometheus/
            - name: prometheus-storage
              mountPath: /prometheus/
      volumes:
        - name: prometheus-config
          configMap:
            name: prometheus-config
        - name: prometheus-storage
          emptyDir: {}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    rule_files:
      - "first_rules.yml"

    scrape_configs:
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']

      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https

      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
        - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics

      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_pod_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_pod_name]
          action: replace
          target_label: kubernetes_pod_name
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  type: NodePort
  ports:
    - port: 9090
      targetPort: 9090
      nodePort: 30090
  selector:
    app: prometheus
```

### Node Exporter Deployment

```yaml
# node-exporter.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9100"
    spec:
      hostPID: true
      hostIPC: true
      hostNetwork: true
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.6.0
          ports:
            - containerPort: 9100
          args:
            - "--path.sysfs=/host/sys"
            - "--path.rootfs=/host/root"
            - "--no-collector.wifi"
            - "--no-collector.hwmon"
            - "--collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+)($|/)"
            - "--collector.filesystem.ignored-fs-types=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$"
          resources:
            requests:
              memory: 30Mi
              cpu: 100m
            limits:
              memory: 50Mi
              cpu: 200m
          volumeMounts:
            - name: dev
              mountPath: /host/dev
            - name: proc
              mountPath: /host/proc
            - name: sys
              mountPath: /host/sys
            - name: rootfs
              mountPath: /host/root
      tolerations:
        - operator: Exists
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: dev
          hostPath:
            path: /dev
        - name: sys
          hostPath:
            path: /sys
        - name: rootfs
          hostPath:
            path: /
```

## Troubleshooting and Maintenance

### Common Issues and Solutions

```bash
#!/bin/bash
# troubleshooting-toolkit.sh

# Comprehensive troubleshooting script for single-node Kubernetes

# Check cluster health
check_cluster_health() {
    echo "=== Cluster Health Check ==="

    echo "Node Status:"
    kubectl get nodes -o wide

    echo "System Pods Status:"
    kubectl get pods -n kube-system

    echo "API Server Health:"
    kubectl get --raw='/readyz'

    echo "etcd Health:"
    kubectl get pods -n kube-system -l component=etcd

    echo "Component Status:"
    kubectl get componentstatuses
}

# Check resource usage
check_resources() {
    echo "=== Resource Usage ==="

    echo "Node Resource Usage:"
    kubectl top nodes

    echo "Pod Resource Usage:"
    kubectl top pods --all-namespaces

    echo "Disk Usage:"
    df -h

    echo "Memory Usage:"
    free -h

    echo "Docker Images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
}

# Check networking
check_networking() {
    echo "=== Networking Check ==="

    echo "Pod Network Status:"
    kubectl get pods -n kube-system -l app=flannel

    echo "Service Status:"
    kubectl get svc --all-namespaces

    echo "Network Policies:"
    kubectl get networkpolicies --all-namespaces

    echo "DNS Test:"
    kubectl run test-dns --image=busybox --rm -it --restart=Never -- nslookup kubernetes.default
}

# Check logs
check_logs() {
    echo "=== System Logs ==="

    echo "Kubelet Logs:"
    journalctl -u kubelet --no-pager -n 20

    echo "Docker Logs:"
    journalctl -u docker --no-pager -n 10

    echo "Failed Pods:"
    kubectl get pods --all-namespaces --field-selector=status.phase=Failed
}

# Clean up resources
cleanup_resources() {
    echo "=== Cleanup Resources ==="

    echo "Removing failed pods:"
    kubectl delete pods --all-namespaces --field-selector=status.phase=Failed

    echo "Cleaning Docker:"
    docker system prune -f

    echo "Cleaning unused images:"
    docker image prune -f

    echo "Restart kubelet if needed:"
    read -p "Restart kubelet? (y/N): " restart_kubelet
    if [[ $restart_kubelet == "y" ]]; then
        systemctl restart kubelet
    fi
}

# Performance optimization
optimize_performance() {
    echo "=== Performance Optimization ==="

    # Optimize kernel parameters
    echo "net.core.somaxconn = 32768" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_max_syn_backlog = 32768" >> /etc/sysctl.conf
    echo "net.core.netdev_max_backlog = 32768" >> /etc/sysctl.conf
    sysctl -p

    # Configure Docker logging
    cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    }
}
EOF

    systemctl restart docker

    echo "Performance optimizations applied"
}

# Main menu
main() {
    while true; do
        echo "=== Kubernetes Troubleshooting Toolkit ==="
        echo "1. Check Cluster Health"
        echo "2. Check Resource Usage"
        echo "3. Check Networking"
        echo "4. Check Logs"
        echo "5. Cleanup Resources"
        echo "6. Optimize Performance"
        echo "7. Exit"

        read -p "Select option (1-7): " choice

        case $choice in
            1) check_cluster_health ;;
            2) check_resources ;;
            3) check_networking ;;
            4) check_logs ;;
            5) cleanup_resources ;;
            6) optimize_performance ;;
            7) exit 0 ;;
            *) echo "Invalid option" ;;
        esac

        echo
        read -p "Press Enter to continue..."
        clear
    done
}

main "$@"
```

### Backup and Recovery

```bash
#!/bin/bash
# backup-restore.sh

BACKUP_DIR="/opt/kubernetes-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
create_backup() {
    echo "Creating Kubernetes cluster backup..."

    mkdir -p "$BACKUP_DIR/$DATE"

    # Backup etcd
    kubectl exec -n kube-system etcd-$(hostname) -- etcdctl snapshot save /tmp/etcd-snapshot.db \
        --endpoints=https://127.0.0.1:2379 \
        --cacert=/etc/kubernetes/pki/etcd/ca.crt \
        --cert=/etc/kubernetes/pki/etcd/server.crt \
        --key=/etc/kubernetes/pki/etcd/server.key

    kubectl cp kube-system/etcd-$(hostname):/tmp/etcd-snapshot.db "$BACKUP_DIR/$DATE/etcd-snapshot.db"

    # Backup certificates
    cp -r /etc/kubernetes/pki "$BACKUP_DIR/$DATE/"

    # Backup configuration
    cp -r /etc/kubernetes/*.conf "$BACKUP_DIR/$DATE/"

    # Backup resources
    kubectl get all --all-namespaces -o yaml > "$BACKUP_DIR/$DATE/all-resources.yaml"

    echo "Backup completed: $BACKUP_DIR/$DATE"
}

# Restore from backup
restore_backup() {
    local backup_path="$1"

    if [[ ! -d "$backup_path" ]]; then
        echo "Backup directory not found: $backup_path"
        return 1
    fi

    echo "Restoring from backup: $backup_path"

    # Stop kubelet
    systemctl stop kubelet

    # Restore etcd snapshot
    etcdctl snapshot restore "$backup_path/etcd-snapshot.db" \
        --data-dir=/var/lib/etcd-backup

    # Replace etcd data
    rm -rf /var/lib/etcd
    mv /var/lib/etcd-backup /var/lib/etcd

    # Restore certificates and configuration
    cp -r "$backup_path/pki" /etc/kubernetes/
    cp "$backup_path"/*.conf /etc/kubernetes/

    # Start kubelet
    systemctl start kubelet

    echo "Restore completed"
}

# List available backups
list_backups() {
    echo "Available backups:"
    ls -la "$BACKUP_DIR"
}

case $1 in
    "backup") create_backup ;;
    "restore") restore_backup "$2" ;;
    "list") list_backups ;;
    *) echo "Usage: $0 {backup|restore <path>|list}" ;;
esac
```

## Best Practices and Recommendations

### Production Readiness Checklist

1. **Security Hardening**
   - Enable RBAC and Pod Security Standards
   - Configure network policies
   - Implement audit logging
   - Regular security scanning

2. **Monitoring and Observability**
   - Deploy Prometheus and Grafana
   - Configure alerts for critical metrics
   - Implement log aggregation
   - Monitor resource usage

3. **Backup and Recovery**
   - Automated etcd backups
   - Configuration backups
   - Tested recovery procedures
   - Disaster recovery plan

4. **Resource Management**
   - Configure resource limits and quotas
   - Implement horizontal pod autoscaling
   - Monitor disk usage
   - Optimize container images

5. **Maintenance Procedures**
   - Regular cluster updates
   - Certificate renewal
   - Node maintenance windows
   - Performance optimization

### Performance Optimization

```bash
# performance-tuning.sh
#!/bin/bash

# Optimize system for Kubernetes workloads
optimize_system() {
    # Kernel parameters
    cat >> /etc/sysctl.conf << EOF
# Kubernetes optimizations
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
vm.swappiness = 1
vm.max_map_count = 262144
fs.file-max = 2097152
net.core.somaxconn = 32768
net.ipv4.tcp_max_syn_backlog = 32768
net.core.netdev_max_backlog = 32768
EOF

    sysctl -p

    # Optimize kubelet
    cat >> /etc/default/kubelet << EOF
KUBELET_EXTRA_ARGS="--max-pods=250 --kube-api-qps=100 --kube-api-burst=100"
EOF

    systemctl restart kubelet
}

optimize_system
```

## Conclusion

Setting up a single-node Kubernetes cluster on CoreOS provides a robust foundation for container orchestration in development, testing, and small-scale production environments. This configuration offers:

- **Complete Kubernetes Experience**: Full API compatibility for development and testing
- **Enhanced Security**: CoreOS's immutable infrastructure and security hardening
- **Monitoring and Observability**: Comprehensive monitoring stack with Prometheus and Grafana
- **Production Readiness**: Backup, recovery, and maintenance procedures
- **Scalability Path**: Easy migration to multi-node clusters when needed

Remember to regularly update your cluster components, monitor security advisories, and maintain backup procedures to ensure a reliable and secure Kubernetes environment.

---

_This single-node setup is ideal for development, testing, and learning purposes. For production workloads requiring high availability, consider implementing a multi-node cluster with proper load balancing and redundancy._
