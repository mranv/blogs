---
title: "CoreOS Kubernetes Deployment: Production-Ready Multi-Node Cluster Guide"
slug: "coreos-kubernetes-deployment-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-11T02:00:00Z
featured: false
draft: false
tags:
  - kubernetes
  - coreos
  - cluster-deployment
  - container-orchestration
  - production
  - infrastructure
  - devops
category: Cloud Native
description: "Comprehensive guide to deploying production-ready multi-node Kubernetes clusters on CoreOS, covering high availability, networking, storage, security, and operational best practices."
---

# CoreOS Kubernetes Deployment: Production-Ready Multi-Node Cluster

This comprehensive guide provides detailed instructions for deploying production-ready Kubernetes clusters on CoreOS infrastructure. Learn to implement high availability, robust networking, persistent storage, comprehensive security, and operational excellence for enterprise-grade container orchestration.

## Table of Contents

## Introduction to Production Kubernetes on CoreOS

### Architecture Overview

A production Kubernetes cluster on CoreOS typically consists of:

- **Control Plane Nodes**: Multiple masters for high availability
- **Worker Nodes**: Scalable compute resources for workloads
- **Load Balancers**: Traffic distribution and API server access
- **Storage Layer**: Persistent storage for stateful applications
- **Network Layer**: Pod-to-pod and service communication
- **Security Layer**: RBAC, network policies, and encryption

### CoreOS Advantages for Production

**Container-Optimized OS:**

- Minimal attack surface with essential components only
- Automatic updates with rollback capabilities
- Immutable infrastructure for consistent deployments

**Built-in Security:**

- SELinux enforcement by default
- Secure boot and verified boot chain
- Container isolation and resource constraints

**Operational Excellence:**

- Systemd integration for service management
- Journald for centralized logging
- Update strategies that minimize downtime

## Infrastructure Planning and Prerequisites

### Hardware Requirements

**Control Plane Nodes (3 minimum for HA):**

- **CPU**: 4 cores minimum (8 recommended)
- **Memory**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD minimum (NVMe preferred)
- **Network**: 10Gbps interfaces for production

**Worker Nodes (3+ for production):**

- **CPU**: 8+ cores (varies by workload)
- **Memory**: 32GB+ (varies by workload)
- **Storage**: 200GB+ SSD for OS, separate storage for applications
- **Network**: 10Gbps interfaces for high-throughput workloads

**Load Balancer Nodes (2 for HA):**

- **CPU**: 4 cores
- **Memory**: 8GB
- **Storage**: 50GB SSD
- **Network**: High-bandwidth interface for cluster traffic

### Network Architecture Design

```yaml
# network-topology.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: network-topology
data:
  cluster_cidr: "10.244.0.0/16"
  service_cidr: "10.96.0.0/12"
  dns_domain: "cluster.local"

  control_plane_subnet: "192.168.10.0/24"
  worker_subnet: "192.168.20.0/24"
  storage_subnet: "192.168.30.0/24"

  api_server_lb: "192.168.10.100"
  ingress_lb: "192.168.10.101"

  network_policies:
    enabled: true
    default_deny: true
    inter_namespace_communication: false
```

## CoreOS Infrastructure Setup

### Ignition Configuration for Control Plane

```yaml
# master-ignition.yml
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
    - name: k8s-admin
      ssh_authorized_keys:
        - ssh-rsa AAAAB3NzaC1yc2EAAAA... # Admin SSH key
      groups:
        - sudo
      shell: /bin/bash

systemd:
  units:
    - name: docker.service
      enabled: true
    - name: kubelet.service
      enabled: true
      contents: |
        [Unit]
        Description=Kubernetes Kubelet
        Documentation=https://kubernetes.io/docs/
        After=docker.service
        Requires=docker.service

        [Service]
        ExecStart=/usr/local/bin/kubelet
        Restart=always
        StartLimitInterval=0
        RestartSec=10

        [Install]
        WantedBy=multi-user.target

    - name: setup-kubernetes.service
      enabled: true
      contents: |
        [Unit]
        Description=Setup Kubernetes Master
        After=docker.service network-online.target
        Requires=docker.service network-online.target

        [Service]
        Type=oneshot
        ExecStart=/usr/local/bin/setup-master.sh
        RemainAfterExit=yes

        [Install]
        WantedBy=multi-user.target

    - name: etcd-backup.service
      enabled: true
      contents: |
        [Unit]
        Description=etcd Backup Service

        [Service]
        Type=oneshot
        ExecStart=/usr/local/bin/backup-etcd.sh

    - name: etcd-backup.timer
      enabled: true
      contents: |
        [Unit]
        Description=etcd Backup Timer
        Requires=etcd-backup.service

        [Timer]
        OnCalendar=*-*-* 02:00:00
        Persistent=true

        [Install]
        WantedBy=timers.target

storage:
  directories:
    - path: /opt/kubernetes
      mode: 0755
    - path: /var/lib/etcd
      mode: 0700
    - path: /etc/kubernetes
      mode: 0755
    - path: /etc/kubernetes/pki
      mode: 0700
    - path: /var/log/pods
      mode: 0755
    - path: /opt/cni/bin
      mode: 0755
    - path: /etc/cni/net.d
      mode: 0755

  files:
    - path: /etc/hostname
      mode: 0644
      contents:
        inline: k8s-master-01 # Change for each master node

    - path: /etc/hosts
      mode: 0644
      contents:
        inline: |
          127.0.0.1 localhost
          192.168.10.10 k8s-master-01
          192.168.10.11 k8s-master-02
          192.168.10.12 k8s-master-03
          192.168.10.100 k8s-api-lb
          192.168.20.10 k8s-worker-01
          192.168.20.11 k8s-worker-02
          192.168.20.12 k8s-worker-03

    - path: /usr/local/bin/setup-master.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euxo pipefail

          KUBERNETES_VERSION="1.28.0"
          NODE_NAME=$(hostname)

          # Install Kubernetes components
          curl -L --remote-name-all https://dl.k8s.io/release/v${KUBERNETES_VERSION}/bin/linux/amd64/{kubeadm,kubelet,kubectl}
          chmod +x {kubeadm,kubelet,kubectl}
          mv {kubeadm,kubelet,kubectl} /usr/local/bin/

          # Setup kubelet systemd service
          curl -sSL "https://raw.githubusercontent.com/kubernetes/release/v0.15.1/cmd/kubepkg/templates/latest/deb/kubelet/lib/systemd/system/kubelet.service" | sed "s:/usr/bin:/usr/local/bin:g" > /etc/systemd/system/kubelet.service
          mkdir -p /etc/systemd/system/kubelet.service.d
          curl -sSL "https://raw.githubusercontent.com/kubernetes/release/v0.15.1/cmd/kubepkg/templates/latest/deb/kubeadm/10-kubeadm.conf" | sed "s:/usr/bin:/usr/local/bin:g" > /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

          # Configure kubelet
          cat > /etc/default/kubelet << EOF
          KUBELET_EXTRA_ARGS="--container-runtime=docker --cgroup-driver=systemd --fail-swap-on=false"
          EOF

          systemctl daemon-reload
          systemctl enable kubelet

          # Install CNI plugins
          CNI_VERSION="v1.3.0"
          mkdir -p /opt/cni/bin
          curl -L "https://github.com/containernetworking/plugins/releases/download/${CNI_VERSION}/cni-plugins-linux-amd64-${CNI_VERSION}.tgz" | tar -C /opt/cni/bin -xz

          echo "Kubernetes components installed successfully"

    - path: /etc/kubernetes/kubeadm-config.yaml
      mode: 0644
      contents:
        inline: |
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: InitConfiguration
          localAPIEndpoint:
            advertiseAddress: "192.168.10.10"  # Change for each master
            bindPort: 6443
          nodeRegistration:
            criSocket: "/var/run/dockershim.sock"
            kubeletExtraArgs:
              cloud-provider: ""
              container-runtime: "docker"
              cgroup-driver: "systemd"
              fail-swap-on: "false"
          ---
          apiVersion: kubeadm.k8s.io/v1beta3
          kind: ClusterConfiguration
          kubernetesVersion: "v1.28.0"
          clusterName: "production-cluster"
          controlPlaneEndpoint: "k8s-api-lb:6443"
          networking:
            serviceSubnet: "10.96.0.0/12"
            podSubnet: "10.244.0.0/16"
            dnsDomain: "cluster.local"
          etcd:
            local:
              dataDir: "/var/lib/etcd"
              extraArgs:
                listen-metrics-urls: "http://0.0.0.0:2381"
          apiServer:
            bindPort: 6443
            extraArgs:
              authorization-mode: "Node,RBAC"
              enable-admission-plugins: "NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota,NodeRestriction"
              audit-log-path: "/var/log/audit.log"
              audit-log-maxage: "30"
              audit-log-maxbackup: "3"
              audit-log-maxsize: "100"
              audit-policy-file: "/etc/kubernetes/audit-policy.yaml"
              enable-swagger-ui: "false"
              profiling: "false"
              repair-malformed-updates: "false"
              service-cluster-ip-range: "10.96.0.0/12"
              service-node-port-range: "30000-32767"
          controllerManager:
            extraArgs:
              bind-address: "0.0.0.0"
              service-cluster-ip-range: "10.96.0.0/12"
              cluster-cidr: "10.244.0.0/16"
              profiling: "false"
          scheduler:
            extraArgs:
              bind-address: "0.0.0.0"
              profiling: "false"
          ---
          apiVersion: kubelet.config.k8s.io/v1beta1
          kind: KubeletConfiguration
          failSwapOn: false
          containerRuntimeEndpoint: "unix:///var/run/dockershim.sock"
          cgroupDriver: "systemd"
          clusterDNS:
            - "10.96.0.10"
          clusterDomain: "cluster.local"
          authentication:
            anonymous:
              enabled: false
            webhook:
              enabled: true
          authorization:
            mode: "Webhook"
          readOnlyPort: 0
          protectKernelDefaults: true
          makeIPTablesUtilChains: true
          eventRecordQPS: 0
          rotateCertificates: true
          serverTLSBootstrap: true

    - path: /etc/kubernetes/audit-policy.yaml
      mode: 0644
      contents:
        inline: |
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
              resources: ["pods", "services", "nodes"]
          - level: Request
            resources:
            - group: "rbac.authorization.k8s.io"
              resources: ["*"]
          - level: Metadata
            omitStages:
            - "RequestReceived"

    - path: /usr/local/bin/backup-etcd.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euo pipefail

          BACKUP_DIR="/opt/kubernetes/backups"
          DATE=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="$BACKUP_DIR/etcd-snapshot-$DATE.db"

          mkdir -p $BACKUP_DIR

          # Create etcd snapshot
          ETCDCTL_API=3 etcdctl snapshot save $BACKUP_FILE \
            --endpoints=https://127.0.0.1:2379 \
            --cacert=/etc/kubernetes/pki/etcd/ca.crt \
            --cert=/etc/kubernetes/pki/etcd/server.crt \
            --key=/etc/kubernetes/pki/etcd/server.key

          # Verify snapshot
          ETCDCTL_API=3 etcdctl snapshot status $BACKUP_FILE \
            --write-out=table

          # Cleanup old backups (keep last 7 days)
          find $BACKUP_DIR -name "etcd-snapshot-*.db" -mtime +7 -delete

          echo "etcd backup completed: $BACKUP_FILE"

    - path: /etc/docker/daemon.json
      mode: 0644
      contents:
        inline: |
          {
            "exec-opts": ["native.cgroupdriver=systemd"],
            "log-driver": "journald",
            "log-opts": {
              "max-size": "100m",
              "max-file": "5"
            },
            "storage-driver": "overlay2",
            "storage-opts": [
              "overlay2.override_kernel_check=true"
            ],
            "live-restore": true,
            "userland-proxy": false,
            "no-new-privileges": true,
            "seccomp-profile": "/etc/docker/seccomp.json",
            "default-ulimits": {
              "nofile": {
                "Hard": 64000,
                "Name": "nofile",
                "Soft": 64000
              }
            }
          }
```

### Ignition Configuration for Worker Nodes

```yaml
# worker-ignition.yml
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
      contents: |
        [Unit]
        Description=Kubernetes Kubelet
        Documentation=https://kubernetes.io/docs/
        After=docker.service
        Requires=docker.service

        [Service]
        ExecStart=/usr/local/bin/kubelet
        Restart=always
        StartLimitInterval=0
        RestartSec=10

        [Install]
        WantedBy=multi-user.target

    - name: setup-worker.service
      enabled: true
      contents: |
        [Unit]
        Description=Setup Kubernetes Worker
        After=docker.service network-online.target
        Requires=docker.service network-online.target

        [Service]
        Type=oneshot
        ExecStart=/usr/local/bin/setup-worker.sh
        RemainAfterExit=yes

        [Install]
        WantedBy=multi-user.target

storage:
  directories:
    - path: /opt/kubernetes
      mode: 0755
    - path: /etc/kubernetes
      mode: 0755
    - path: /var/log/pods
      mode: 0755
    - path: /opt/cni/bin
      mode: 0755
    - path: /etc/cni/net.d
      mode: 0755

  files:
    - path: /etc/hostname
      mode: 0644
      contents:
        inline: k8s-worker-01 # Change for each worker node

    - path: /etc/hosts
      mode: 0644
      contents:
        inline: |
          127.0.0.1 localhost
          192.168.10.10 k8s-master-01
          192.168.10.11 k8s-master-02
          192.168.10.12 k8s-master-03
          192.168.10.100 k8s-api-lb
          192.168.20.10 k8s-worker-01
          192.168.20.11 k8s-worker-02
          192.168.20.12 k8s-worker-03

    - path: /usr/local/bin/setup-worker.sh
      mode: 0755
      contents:
        inline: |
          #!/bin/bash
          set -euxo pipefail

          KUBERNETES_VERSION="1.28.0"

          # Install Kubernetes components
          curl -L --remote-name-all https://dl.k8s.io/release/v${KUBERNETES_VERSION}/bin/linux/amd64/{kubeadm,kubelet,kubectl}
          chmod +x {kubeadm,kubelet,kubectl}
          mv {kubeadm,kubelet,kubectl} /usr/local/bin/

          # Setup kubelet systemd service
          curl -sSL "https://raw.githubusercontent.com/kubernetes/release/v0.15.1/cmd/kubepkg/templates/latest/deb/kubelet/lib/systemd/system/kubelet.service" | sed "s:/usr/bin:/usr/local/bin:g" > /etc/systemd/system/kubelet.service
          mkdir -p /etc/systemd/system/kubelet.service.d
          curl -sSL "https://raw.githubusercontent.com/kubernetes/release/v0.15.1/cmd/kubepkg/templates/latest/deb/kubeadm/10-kubeadm.conf" | sed "s:/usr/bin:/usr/local/bin:g" > /etc/systemd/system/kubelet.service.d/10-kubeadm.conf

          # Configure kubelet
          cat > /etc/default/kubelet << EOF
          KUBELET_EXTRA_ARGS="--container-runtime=docker --cgroup-driver=systemd --fail-swap-on=false"
          EOF

          systemctl daemon-reload
          systemctl enable kubelet

          # Install CNI plugins
          CNI_VERSION="v1.3.0"
          mkdir -p /opt/cni/bin
          curl -L "https://github.com/containernetworking/plugins/releases/download/${CNI_VERSION}/cni-plugins-linux-amd64-${CNI_VERSION}.tgz" | tar -C /opt/cni/bin -xz

          echo "Worker node setup completed"

    - path: /etc/docker/daemon.json
      mode: 0644
      contents:
        inline: |
          {
            "exec-opts": ["native.cgroupdriver=systemd"],
            "log-driver": "journald",
            "log-opts": {
              "max-size": "100m",
              "max-file": "5"
            },
            "storage-driver": "overlay2",
            "storage-opts": [
              "overlay2.override_kernel_check=true"
            ],
            "live-restore": true,
            "userland-proxy": false,
            "no-new-privileges": true,
            "default-ulimits": {
              "nofile": {
                "Hard": 64000,
                "Name": "nofile",
                "Soft": 64000
              }
            }
          }
```

## High Availability Load Balancer Setup

### HAProxy Configuration for API Server

```bash
#!/bin/bash
# setup-haproxy.sh - Load balancer setup for Kubernetes API

# Install HAProxy
dnf install -y haproxy keepalived

# Configure HAProxy
cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
    log stdout len 65536 local0 info
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option log-health-checks
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout http-request 10s
    timeout queue 20s
    timeout connect 10s
    timeout client 1m
    timeout server 1m
    timeout http-keep-alive 10s
    timeout check 10s

# Statistics
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 5s
    stats admin if TRUE

# Kubernetes API Server
frontend k8s_api_frontend
    bind *:6443
    mode tcp
    option tcplog
    default_backend k8s_api_backend

backend k8s_api_backend
    mode tcp
    balance roundrobin
    option tcp-check

    # Health check
    tcp-check connect
    tcp-check send-binary 474554202f20485454502f312e310d0a0d0a
    tcp-check expect binary 485454502f312e31

    # Master nodes
    server k8s-master-01 192.168.10.10:6443 check inter 5s rise 3 fall 3
    server k8s-master-02 192.168.10.11:6443 check inter 5s rise 3 fall 3
    server k8s-master-03 192.168.10.12:6443 check inter 5s rise 3 fall 3

# Ingress Controller (if needed)
frontend k8s_ingress_http
    bind *:80
    mode http
    redirect scheme https code 301 if !{ ssl_fc }

frontend k8s_ingress_https
    bind *:443
    mode tcp
    default_backend k8s_ingress_backend

backend k8s_ingress_backend
    mode tcp
    balance roundrobin
    option tcp-check

    # Worker nodes (where ingress controllers run)
    server k8s-worker-01 192.168.20.10:443 check inter 5s rise 3 fall 3
    server k8s-worker-02 192.168.20.11:443 check inter 5s rise 3 fall 3
    server k8s-worker-03 192.168.20.12:443 check inter 5s rise 3 fall 3
EOF

# Configure Keepalived for HA
cat > /etc/keepalived/keepalived.conf << 'EOF'
vrrp_script chk_haproxy {
    script "/bin/curl -f http://localhost:8404/stats || exit 1"
    interval 3
    weight -2
    fall 3
    rise 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 110  # Set to 100 on backup node
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass changeme123
    }
    virtual_ipaddress {
        192.168.10.100/24
    }
    track_script {
        chk_haproxy
    }
}
EOF

# Enable and start services
systemctl enable haproxy keepalived
systemctl start haproxy keepalived

echo "HAProxy and Keepalived configured for Kubernetes API HA"
```

## Cluster Initialization and Bootstrap

### Master Node Initialization Script

```bash
#!/bin/bash
# initialize-cluster.sh - Initialize the first control plane node

set -euo pipefail

CLUSTER_NAME="production-cluster"
POD_SUBNET="10.244.0.0/16"
SERVICE_SUBNET="10.96.0.0/12"
API_SERVER_ENDPOINT="k8s-api-lb:6443"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Initialize the first control plane node
initialize_first_master() {
    log "Initializing first control plane node..."

    # Pre-pull images to speed up initialization
    kubeadm config images pull --kubernetes-version=v1.28.0

    # Initialize cluster
    kubeadm init --config=/etc/kubernetes/kubeadm-config.yaml --upload-certs --v=5

    # Setup kubectl for root
    mkdir -p $HOME/.kube
    cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    chown $(id -u):$(id -g) $HOME/.kube/config

    # Setup kubectl for core user
    mkdir -p /home/core/.kube
    cp -i /etc/kubernetes/admin.conf /home/core/.kube/config
    chown core:core /home/core/.kube/config

    log "First control plane node initialized successfully"
}

# Install Calico CNI
install_calico_cni() {
    log "Installing Calico CNI..."

    # Download Calico manifests
    curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml
    curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml

    # Modify custom resources for our pod CIDR
    sed -i "s|192.168.0.0/16|$POD_SUBNET|g" custom-resources.yaml

    # Apply Calico
    kubectl create -f tigera-operator.yaml
    kubectl create -f custom-resources.yaml

    log "Calico CNI installed successfully"
}

# Generate join commands
generate_join_commands() {
    log "Generating join commands..."

    # Control plane join command
    CERT_KEY=$(kubeadm init phase upload-certs --upload-certs | tail -1)
    MASTER_JOIN_CMD=$(kubeadm token create --print-join-command)

    echo "=== CONTROL PLANE JOIN COMMAND ==="
    echo "$MASTER_JOIN_CMD --control-plane --certificate-key $CERT_KEY"
    echo
    echo "=== WORKER JOIN COMMAND ==="
    echo "$MASTER_JOIN_CMD"
    echo

    # Save commands to files
    echo "$MASTER_JOIN_CMD --control-plane --certificate-key $CERT_KEY" > /opt/kubernetes/master-join-command.sh
    echo "$MASTER_JOIN_CMD" > /opt/kubernetes/worker-join-command.sh
    chmod +x /opt/kubernetes/*-join-command.sh

    log "Join commands saved to /opt/kubernetes/"
}

# Configure RBAC
setup_rbac() {
    log "Setting up RBAC..."

    # Create admin user
    cat > /tmp/admin-user.yaml << EOF
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
EOF

    kubectl apply -f /tmp/admin-user.yaml

    # Create read-only user
    cat > /tmp/readonly-user.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: readonly-user
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: readonly-cluster-role
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
  name: readonly-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: readonly-cluster-role
subjects:
- kind: ServiceAccount
  name: readonly-user
  namespace: kube-system
EOF

    kubectl apply -f /tmp/readonly-user.yaml

    log "RBAC configured successfully"
}

# Main execution
main() {
    log "Starting Kubernetes cluster initialization"

    initialize_first_master
    install_calico_cni
    setup_rbac

    # Wait for cluster to be ready
    log "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
    kubectl wait --for=condition=Available deployments --all -n kube-system --timeout=300s

    generate_join_commands

    log "Cluster initialization completed successfully"
    log "Cluster status:"
    kubectl get nodes -o wide
    kubectl get pods --all-namespaces
}

main "$@"
```

### Additional Master Node Setup

```bash
#!/bin/bash
# join-master.sh - Join additional control plane nodes

set -euo pipefail

MASTER_JOIN_COMMAND="$1"

if [ -z "$MASTER_JOIN_COMMAND" ]; then
    echo "Usage: $0 '<master-join-command>'"
    echo "Get the join command from the first master node"
    exit 1
fi

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Join as control plane node
join_control_plane() {
    log "Joining as control plane node..."

    # Execute join command
    eval "$MASTER_JOIN_COMMAND"

    # Setup kubectl for root
    mkdir -p $HOME/.kube
    cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
    chown $(id -u):$(id -g) $HOME/.kube/config

    # Setup kubectl for core user
    mkdir -p /home/core/.kube
    cp -i /etc/kubernetes/admin.conf /home/core/.kube/config
    chown core:core /home/core/.kube/config

    log "Successfully joined as control plane node"
}

# Verify cluster health
verify_cluster() {
    log "Verifying cluster health..."

    # Wait for node to be ready
    kubectl wait --for=condition=Ready node/$(hostname) --timeout=300s

    # Check cluster status
    kubectl get nodes
    kubectl get pods --all-namespaces

    log "Cluster verification completed"
}

main() {
    log "Starting control plane node join process"

    join_control_plane
    verify_cluster

    log "Control plane node join completed successfully"
}

main "$@"
```

### Worker Node Setup

```bash
#!/bin/bash
# join-worker.sh - Join worker nodes to the cluster

set -euo pipefail

WORKER_JOIN_COMMAND="$1"

if [ -z "$WORKER_JOIN_COMMAND" ]; then
    echo "Usage: $0 '<worker-join-command>'"
    echo "Get the join command from a master node"
    exit 1
fi

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Prepare worker node
prepare_worker() {
    log "Preparing worker node..."

    # Ensure Docker is running
    systemctl enable docker
    systemctl start docker

    # Configure system settings
    modprobe br_netfilter
    echo 'net.bridge.bridge-nf-call-iptables = 1' >> /etc/sysctl.conf
    echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
    sysctl -p

    log "Worker node preparation completed"
}

# Join cluster as worker
join_worker() {
    log "Joining cluster as worker node..."

    # Execute join command
    eval "$WORKER_JOIN_COMMAND"

    log "Successfully joined cluster as worker node"
}

# Configure worker-specific settings
configure_worker() {
    log "Configuring worker node settings..."

    # Label node based on its role/purpose
    NODE_NAME=$(hostname)

    # Wait for node to be ready
    sleep 30

    # Apply node labels (run from master node)
    cat > /tmp/label-worker.sh << 'EOF'
#!/bin/bash
NODE_NAME="$1"
kubectl label node "$NODE_NAME" node-role.kubernetes.io/worker=worker
kubectl label node "$NODE_NAME" node.kubernetes.io/instance-type=worker
EOF

    chmod +x /tmp/label-worker.sh
    echo "Run on master node: /tmp/label-worker.sh $NODE_NAME"

    log "Worker node configuration completed"
}

main() {
    log "Starting worker node join process"

    prepare_worker
    join_worker
    configure_worker

    log "Worker node join completed successfully"
}

main "$@"
```

## Storage Configuration

### Persistent Storage Setup

```yaml
# storage-classes.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: bulk-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
---
# Local storage provisioner
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: local-volume-provisioner
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: local-volume-provisioner
  template:
    metadata:
      labels:
        app: local-volume-provisioner
    spec:
      serviceAccountName: local-storage-admin
      containers:
        - image: "quay.io/external_storage/local-volume-provisioner:v2.5.0"
          name: provisioner
          securityContext:
            privileged: true
          env:
            - name: MY_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: MY_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: JOB_CONTAINER_IMAGE
              value: "quay.io/external_storage/local-volume-provisioner:v2.5.0"
          volumeMounts:
            - mountPath: /etc/provisioner/config
              name: provisioner-config
              readOnly: true
            - mountPath: /mnt/fast-ssd
              name: fast-ssd
              mountPropagation: "HostToContainer"
            - mountPath: /mnt/bulk-storage
              name: bulk-storage
              mountPropagation: "HostToContainer"
      volumes:
        - name: provisioner-config
          configMap:
            name: local-provisioner-config
        - name: fast-ssd
          hostPath:
            path: /mnt/fast-ssd
        - name: bulk-storage
          hostPath:
            path: /mnt/bulk-storage
      nodeSelector:
        kubernetes.io/os: linux
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: local-storage-admin
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: local-storage-provisioner-pv-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:persistent-volume-provisioner
subjects:
  - kind: ServiceAccount
    name: local-storage-admin
    namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: local-storage-provisioner-node-clusterrole
rules:
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: local-storage-provisioner-node-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: local-storage-provisioner-node-clusterrole
subjects:
  - kind: ServiceAccount
    name: local-storage-admin
    namespace: kube-system
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-provisioner-config
  namespace: kube-system
data:
  storageClassMap: |
    fast-ssd:
       hostDir: /mnt/fast-ssd
       mountDir: /mnt/fast-ssd
       blockCleanerCommand:
         - "/scripts/shred.sh"
         - "2"
       volumeMode: Filesystem
       fsType: ext4
    bulk-storage:
       hostDir: /mnt/bulk-storage
       mountDir: /mnt/bulk-storage
       blockCleanerCommand:
         - "/scripts/shred.sh"
         - "2"
       volumeMode: Filesystem
       fsType: ext4
```

### Backup Storage Configuration

```bash
#!/bin/bash
# setup-backup-storage.sh - Configure backup storage

set -euo pipefail

# Create backup storage directories
create_backup_directories() {
    echo "Creating backup storage directories..."

    # Local backup storage
    mkdir -p /opt/kubernetes/backups/{etcd,configs,applications}
    chmod 750 /opt/kubernetes/backups

    # NFS backup mount (if using NFS)
    mkdir -p /mnt/nfs-backup

    # Add to fstab for persistent mounting
    # echo "nfs-server:/backup/kubernetes /mnt/nfs-backup nfs defaults 0 0" >> /etc/fstab
}

# Install and configure backup tools
install_backup_tools() {
    echo "Installing backup tools..."

    # Install restic for application backups
    RESTIC_VERSION="0.16.0"
    wget -O /tmp/restic.bz2 "https://github.com/restic/restic/releases/download/v${RESTIC_VERSION}/restic_${RESTIC_VERSION}_linux_amd64.bz2"
    bunzip2 /tmp/restic.bz2
    chmod +x /tmp/restic
    mv /tmp/restic /usr/local/bin/

    # Install velero for Kubernetes-native backups
    VELERO_VERSION="1.11.1"
    wget -O /tmp/velero.tar.gz "https://github.com/vmware-tanzu/velero/releases/download/v${VELERO_VERSION}/velero-v${VELERO_VERSION}-linux-amd64.tar.gz"
    tar -xzf /tmp/velero.tar.gz -C /tmp/
    mv /tmp/velero-v${VELERO_VERSION}-linux-amd64/velero /usr/local/bin/
    chmod +x /usr/local/bin/velero
}

# Configure Velero for cluster backups
setup_velero() {
    echo "Setting up Velero for cluster backups..."

    # Create Velero namespace and configuration
    kubectl create namespace velero || true

    # Configure backup storage location (example with MinIO)
    cat > /tmp/velero-config.yaml << 'EOF'
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: kubernetes-backups
    prefix: velero
  config:
    region: us-east-1
    s3ForcePathStyle: "true"
    s3Url: http://minio.backup.svc.cluster.local:9000
---
apiVersion: velero.io/v1
kind: VolumeSnapshotLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  config:
    region: us-east-1
EOF

    kubectl apply -f /tmp/velero-config.yaml
}

create_backup_directories
install_backup_tools
setup_velero

echo "Backup storage configuration completed"
```

## Security Hardening

### Network Policies Implementation

```yaml
# network-policies.yaml
# Default deny all traffic
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
# Allow DNS traffic
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
# Allow traffic to kube-system
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-kube-system
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
---
# Kube-system network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kube-system-default-deny
  namespace: kube-system
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  egress:
    - {} # Allow all egress for system components
  ingress:
    - from:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 53
        - protocol: UDP
          port: 53
    - from:
        - namespaceSelector: {}
        - podSelector: {}
---
# Production namespace network policy
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    name: production
    environment: production
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: production-network-policy
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
    - to:
        - namespaceSelector:
            matchLabels:
              name: production
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: production
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
```

### Pod Security Standards

```yaml
# pod-security-standards.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: secure-workloads
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
# Resource quotas and limits
apiVersion: v1
kind: ResourceQuota
metadata:
  name: secure-workloads-quota
  namespace: secure-workloads
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    persistentvolumeclaims: "10"
    services: "10"
    secrets: "20"
    configmaps: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: secure-workloads-limits
  namespace: secure-workloads
spec:
  limits:
    - default:
        cpu: 500m
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      type: Container
    - max:
        cpu: 2
        memory: 4Gi
      min:
        cpu: 50m
        memory: 64Mi
      type: Container
---
# Security policies
apiVersion: v1
kind: ServiceAccount
metadata:
  name: restricted-service-account
  namespace: secure-workloads
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: restricted-role
  namespace: secure-workloads
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: restricted-binding
  namespace: secure-workloads
subjects:
  - kind: ServiceAccount
    name: restricted-service-account
    namespace: secure-workloads
roleRef:
  kind: Role
  name: restricted-role
  apiGroup: rbac.authorization.k8s.io
```

### Security Scanning and Monitoring

```bash
#!/bin/bash
# security-scanning.sh - Implement security scanning

set -euo pipefail

# Install Falco for runtime security
install_falco() {
    echo "Installing Falco for runtime security monitoring..."

    # Add Falco repository
    curl -s https://falco.org/repo/falcosecurity-packages.asc | apt-key add -
    echo "deb https://download.falco.org/packages/deb stable main" | tee -a /etc/apt/sources.list.d/falcosecurity.list
    apt-get update -qq
    apt-get install -y falco

    # Configure Falco
    cat > /etc/falco/falco_rules.local.yaml << 'EOF'
- rule: Kubernetes Client Tool Launched in Container
  desc: Detect kubernetes client tool launched in container
  condition: >
    spawned_process and container and
    (proc.name in (kubectl, oc))
  output: >
    Kubernetes client tool launched in container (user=%user.name container_id=%container.id
    image=%container.image.repository proc=%proc.cmdline)
  priority: NOTICE
  tags: 
  - process
  - mitre_execution

- rule: Suspicious Network Activity in Container
  desc: Detect suspicious network activity in containers
  condition: >
    spawned_process and container and
    proc.name in (nc, ncat, netcat, socat, ss, netstat)
  output: >
    Suspicious network tool launched in container (user=%user.name container_id=%container.id
    image=%container.image.repository proc=%proc.cmdline)
  priority: WARNING
  tags: 
  - network
  - mitre_discovery
EOF

    systemctl enable falco
    systemctl start falco
}

# Install Trivy for vulnerability scanning
install_trivy() {
    echo "Installing Trivy for vulnerability scanning..."

    # Install Trivy
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

    # Create scan script
    cat > /usr/local/bin/scan-cluster-images.sh << 'EOF'
#!/bin/bash
# Scan all images in the cluster for vulnerabilities

NAMESPACE="${1:-default}"
OUTPUT_DIR="/opt/kubernetes/security-scans/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$OUTPUT_DIR"

echo "Scanning images in namespace: $NAMESPACE"

# Get all images in the namespace
kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.image}{"\n"}{end}{end}' | sort -u > "$OUTPUT_DIR/images.txt"

# Scan each image
while read -r image; do
    echo "Scanning $image..."
    trivy image --severity HIGH,CRITICAL --format json "$image" > "$OUTPUT_DIR/$(echo $image | tr '/' '_' | tr ':' '_').json"
done < "$OUTPUT_DIR/images.txt"

echo "Scan results saved to: $OUTPUT_DIR"
EOF

    chmod +x /usr/local/bin/scan-cluster-images.sh
}

# Install kube-bench for CIS compliance
install_kube_bench() {
    echo "Installing kube-bench for CIS compliance checking..."

    # Download and install kube-bench
    KUBE_BENCH_VERSION="0.6.15"
    wget -O /tmp/kube-bench.tar.gz "https://github.com/aquasecurity/kube-bench/releases/download/v${KUBE_BENCH_VERSION}/kube-bench_${KUBE_BENCH_VERSION}_linux_amd64.tar.gz"
    tar -xzf /tmp/kube-bench.tar.gz -C /tmp/
    mv /tmp/kube-bench /usr/local/bin/
    chmod +x /usr/local/bin/kube-bench

    # Create compliance check script
    cat > /usr/local/bin/compliance-check.sh << 'EOF'
#!/bin/bash
# Run CIS compliance checks

REPORT_DIR="/opt/kubernetes/compliance-reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

echo "Running CIS compliance checks..."

# Run kube-bench
kube-bench --json > "$REPORT_DIR/cis-compliance.json"
kube-bench > "$REPORT_DIR/cis-compliance.txt"

# Generate summary
jq '.Totals' "$REPORT_DIR/cis-compliance.json" > "$REPORT_DIR/summary.json"

echo "Compliance report saved to: $REPORT_DIR"
echo "Summary:"
cat "$REPORT_DIR/summary.json"
EOF

    chmod +x /usr/local/bin/compliance-check.sh
}

# Setup security monitoring
setup_security_monitoring() {
    echo "Setting up security monitoring..."

    # Create security monitoring namespace
    kubectl create namespace security-monitoring || true

    # Deploy security monitoring stack
    cat > /tmp/security-monitoring.yaml << 'EOF'
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: security-monitor
  namespace: security-monitoring
spec:
  selector:
    matchLabels:
      name: security-monitor
  template:
    metadata:
      labels:
        name: security-monitor
    spec:
      hostPID: true
      hostNetwork: true
      serviceAccountName: security-monitor
      containers:
      - name: security-monitor
        image: alpine:latest
        command: ["/bin/sh"]
        args: ["-c", "while true; do sleep 3600; done"]
        securityContext:
          privileged: true
        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
        - name: var-run
          mountPath: /host/var/run
          readOnly: true
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
      - name: var-run
        hostPath:
          path: /var/run
      tolerations:
      - effect: NoSchedule
        operator: Exists
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: security-monitor
  namespace: security-monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: security-monitor
rules:
- apiGroups: [""]
  resources: ["nodes", "pods", "namespaces"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: security-monitor
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: security-monitor
subjects:
- kind: ServiceAccount
  name: security-monitor
  namespace: security-monitoring
EOF

    kubectl apply -f /tmp/security-monitoring.yaml
}

# Main execution
main() {
    echo "Setting up security scanning and monitoring..."

    install_falco
    install_trivy
    install_kube_bench
    setup_security_monitoring

    echo "Security setup completed successfully"
    echo "Run compliance check: /usr/local/bin/compliance-check.sh"
    echo "Scan cluster images: /usr/local/bin/scan-cluster-images.sh"
}

main "$@"
```

## Monitoring and Observability

### Prometheus and Grafana Stack

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
---
# Prometheus ConfigMap
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
      external_labels:
        cluster: 'production-cluster'
        region: 'us-east-1'

    rule_files:
      - "/etc/prometheus/rules/*.yml"

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
          insecure_skip_verify: true
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
          insecure_skip_verify: true
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

      - job_name: 'kubernetes-cadvisor'
        kubernetes_sd_configs:
        - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          insecure_skip_verify: true
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor

      - job_name: 'kubernetes-service-endpoints'
        kubernetes_sd_configs:
        - role: endpoints
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
        - action: labelmap
          regex: __meta_kubernetes_service_label_(.+)
        - source_labels: [__meta_kubernetes_namespace]
          action: replace
          target_label: kubernetes_namespace
        - source_labels: [__meta_kubernetes_service_name]
          action: replace
          target_label: kubernetes_name

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

  alert_rules.yml: |
    groups:
    - name: kubernetes-cluster
      rules:
      - alert: KubernetesNodeReady
        expr: kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: Kubernetes Node ready (instance {{ $labels.instance }})
          description: "Node {{ $labels.node }} has been unready for a long time"

      - alert: KubernetesMemoryPressure
        expr: kube_node_status_condition{condition="MemoryPressure",status="true"} == 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: Kubernetes memory pressure (instance {{ $labels.instance }})
          description: "Node {{ $labels.node }} has MemoryPressure condition"

      - alert: KubernetesDiskPressure
        expr: kube_node_status_condition{condition="DiskPressure",status="true"} == 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: Kubernetes disk pressure (instance {{ $labels.instance }})
          description: "Node {{ $labels.node }} has DiskPressure condition"

      - alert: KubernetesPodCrashLooping
        expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Kubernetes pod crash looping (instance {{ $labels.instance }})
          description: "Pod {{ $labels.pod }} is crash looping"

      - alert: KubernetesPersistentvolumeclaimPending
        expr: kube_persistentvolumeclaim_status_phase{phase="Pending"} == 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Kubernetes PersistentVolumeClaim pending (instance {{ $labels.instance }})
          description: "PersistentVolumeClaim {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} is pending"
---
# Prometheus Deployment
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
      serviceAccountName: prometheus
      containers:
        - name: prometheus
          image: prom/prometheus:v2.45.0
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus/"
            - "--web.console.libraries=/etc/prometheus/console_libraries"
            - "--web.console.templates=/etc/prometheus/consoles"
            - "--storage.tsdb.retention.time=30d"
            - "--web.enable-lifecycle"
            - "--web.enable-admin-api"
          ports:
            - containerPort: 9090
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2
              memory: 4Gi
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
          persistentVolumeClaim:
            claimName: prometheus-storage
---
# Prometheus PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-storage
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi
---
# Prometheus Service
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  type: ClusterIP
  ports:
    - port: 9090
      targetPort: 9090
  selector:
    app: prometheus
---
# Prometheus ServiceAccount and RBAC
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
  - apiGroups: [""]
    resources:
      - nodes
      - nodes/proxy
      - services
      - endpoints
      - pods
    verbs: ["get", "list", "watch"]
  - apiGroups:
      - extensions
    resources:
      - ingresses
    verbs: ["get", "list", "watch"]
  - nonResourceURLs: ["/metrics"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: monitoring
```

### Node Exporter and Kube-State-Metrics

```yaml
# exporters.yaml
# Node Exporter DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      name: node-exporter
  template:
    metadata:
      labels:
        name: node-exporter
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
            - "--path.procfs=/host/proc"
            - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
            - "--collector.systemd"
            - "--collector.processes"
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
              readOnly: true
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
---
# Kube State Metrics
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kube-state-metrics
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kube-state-metrics
  template:
    metadata:
      labels:
        app: kube-state-metrics
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      serviceAccountName: kube-state-metrics
      containers:
        - name: kube-state-metrics
          image: registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.9.2
          ports:
            - containerPort: 8080
              name: http-metrics
            - containerPort: 8081
              name: telemetry
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            timeoutSeconds: 5
          readinessProbe:
            httpGet:
              path: /
              port: 8081
            initialDelaySeconds: 5
            timeoutSeconds: 5
          resources:
            requests:
              memory: 100Mi
              cpu: 100m
            limits:
              memory: 200Mi
              cpu: 200m
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kube-state-metrics
  namespace: monitoring
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kube-state-metrics
rules:
  - apiGroups: [""]
    resources:
      - configmaps
      - secrets
      - nodes
      - pods
      - services
      - resourcequotas
      - replicationcontrollers
      - limitranges
      - persistentvolumeclaims
      - persistentvolumes
      - namespaces
      - endpoints
    verbs: ["list", "watch"]
  - apiGroups: ["apps"]
    resources:
      - statefulsets
      - daemonsets
      - deployments
      - replicasets
    verbs: ["list", "watch"]
  - apiGroups: ["batch"]
    resources:
      - cronjobs
      - jobs
    verbs: ["list", "watch"]
  - apiGroups: ["autoscaling"]
    resources:
      - horizontalpodautoscalers
    verbs: ["list", "watch"]
  - apiGroups: ["authentication.k8s.io"]
    resources:
      - tokenreviews
    verbs: ["create"]
  - apiGroups: ["authorization.k8s.io"]
    resources:
      - subjectaccessreviews
    verbs: ["create"]
  - apiGroups: ["policy"]
    resources:
      - poddisruptionbudgets
    verbs: ["list", "watch"]
  - apiGroups: ["certificates.k8s.io"]
    resources:
      - certificatesigningrequests
    verbs: ["list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources:
      - storageclasses
      - volumeattachments
    verbs: ["list", "watch"]
  - apiGroups: ["admissionregistration.k8s.io"]
    resources:
      - mutatingwebhookconfigurations
      - validatingwebhookconfigurations
    verbs: ["list", "watch"]
  - apiGroups: ["networking.k8s.io"]
    resources:
      - networkpolicies
      - ingresses
    verbs: ["list", "watch"]
  - apiGroups: ["coordination.k8s.io"]
    resources:
      - leases
    verbs: ["list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: kube-state-metrics
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: kube-state-metrics
subjects:
  - kind: ServiceAccount
    name: kube-state-metrics
    namespace: monitoring
---
apiVersion: v1
kind: Service
metadata:
  name: kube-state-metrics
  namespace: monitoring
spec:
  ports:
    - name: http-metrics
      port: 8080
      targetPort: http-metrics
    - name: telemetry
      port: 8081
      targetPort: telemetry
  selector:
    app: kube-state-metrics
```

## Operational Procedures

### Automated Cluster Operations

```bash
#!/bin/bash
# cluster-operations.sh - Automated cluster management

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/cluster-operations.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Health check function
health_check() {
    log "Performing cluster health check..."

    # Check node status
    nodes_ready=$(kubectl get nodes --no-headers | grep -c "Ready")
    nodes_total=$(kubectl get nodes --no-headers | wc -l)

    log "Nodes: $nodes_ready/$nodes_total Ready"

    if [ "$nodes_ready" -lt "$nodes_total" ]; then
        log "WARNING: Not all nodes are ready"
        kubectl get nodes
    fi

    # Check system pods
    system_pods_not_ready=$(kubectl get pods -n kube-system --no-headers | grep -v "Running\|Completed" | wc -l)

    if [ "$system_pods_not_ready" -gt 0 ]; then
        log "WARNING: System pods not ready: $system_pods_not_ready"
        kubectl get pods -n kube-system --field-selector=status.phase!=Running,status.phase!=Succeeded
    fi

    # Check API server health
    if ! kubectl cluster-info > /dev/null 2>&1; then
        log "ERROR: API server not accessible"
        return 1
    fi

    # Check etcd health
    etcd_endpoints=$(kubectl get endpoints -n kube-system etcd -o jsonpath='{.subsets[0].addresses[*].ip}' | tr ' ' ',')
    if [ -n "$etcd_endpoints" ]; then
        for endpoint in $(echo "$etcd_endpoints" | tr ',' ' '); do
            if ! ETCDCTL_API=3 etcdctl endpoint health --endpoints="$endpoint:2379" --insecure-skip-tls-verify > /dev/null 2>&1; then
                log "WARNING: etcd endpoint $endpoint not healthy"
            fi
        done
    fi

    log "Health check completed"
}

# Backup function
backup_cluster() {
    log "Starting cluster backup..."

    BACKUP_DIR="/opt/kubernetes/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup etcd
    log "Backing up etcd..."
    ETCDCTL_API=3 etcdctl snapshot save "$BACKUP_DIR/etcd-snapshot.db" \
        --endpoints=https://127.0.0.1:2379 \
        --cacert=/etc/kubernetes/pki/etcd/ca.crt \
        --cert=/etc/kubernetes/pki/etcd/server.crt \
        --key=/etc/kubernetes/pki/etcd/server.key

    # Backup cluster resources
    log "Backing up cluster resources..."
    kubectl get all --all-namespaces -o yaml > "$BACKUP_DIR/all-resources.yaml"
    kubectl get persistentvolumes -o yaml > "$BACKUP_DIR/persistent-volumes.yaml"
    kubectl get persistentvolumeclaims --all-namespaces -o yaml > "$BACKUP_DIR/persistent-volume-claims.yaml"
    kubectl get configmaps --all-namespaces -o yaml > "$BACKUP_DIR/configmaps.yaml"
    kubectl get secrets --all-namespaces -o yaml > "$BACKUP_DIR/secrets.yaml"

    # Backup certificates
    log "Backing up certificates..."
    cp -r /etc/kubernetes/pki "$BACKUP_DIR/"

    # Backup configuration
    log "Backing up configuration..."
    cp /etc/kubernetes/*.conf "$BACKUP_DIR/" 2>/dev/null || true

    # Create backup manifest
    cat > "$BACKUP_DIR/manifest.json" << EOF
{
    "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "cluster_name": "$(kubectl config current-context)",
    "kubernetes_version": "$(kubectl version --short --client | grep 'Client Version')",
    "node_count": $(kubectl get nodes --no-headers | wc -l),
    "namespace_count": $(kubectl get namespaces --no-headers | wc -l),
    "backup_size": "$(du -sh $BACKUP_DIR | cut -f1)"
}
EOF

    # Compress backup
    tar -czf "$BACKUP_DIR.tar.gz" -C "$(dirname $BACKUP_DIR)" "$(basename $BACKUP_DIR)"
    rm -rf "$BACKUP_DIR"

    log "Backup completed: $BACKUP_DIR.tar.gz"
}

# Cleanup function
cleanup_cluster() {
    log "Starting cluster cleanup..."

    # Clean up completed pods
    kubectl delete pods --all-namespaces --field-selector=status.phase=Succeeded --ignore-not-found=true
    kubectl delete pods --all-namespaces --field-selector=status.phase=Failed --ignore-not-found=true

    # Clean up orphaned resources
    kubectl get events --all-namespaces --sort-by='.lastTimestamp' | head -n -1000 | awk '{print $1" "$2}' | xargs -r kubectl delete events -n

    # Clean up old replicasets
    kubectl get replicasets --all-namespaces -o json | jq -r '.items[] | select(.spec.replicas==0) | "\(.metadata.namespace) \(.metadata.name)"' | xargs -r -n2 sh -c 'kubectl delete replicaset -n $0 $1'

    # Clean up old backups (keep last 7 days)
    find /opt/kubernetes/backups -name "*.tar.gz" -mtime +7 -delete

    log "Cleanup completed"
}

# Update function
update_cluster() {
    local target_version="$1"

    if [ -z "$target_version" ]; then
        log "ERROR: Target version not specified"
        return 1
    fi

    log "Starting cluster update to version $target_version..."

    # Backup before update
    backup_cluster

    # Update control plane nodes
    log "Updating control plane nodes..."

    # Drain and update each master node
    for node in $(kubectl get nodes -l node-role.kubernetes.io/control-plane -o name); do
        node_name=$(echo "$node" | cut -d'/' -f2)
        log "Updating control plane node: $node_name"

        # Drain node
        kubectl drain "$node_name" --ignore-daemonsets --delete-emptydir-data --force

        # Update kubeadm, kubelet, kubectl on the node
        ssh "$node_name" "
            apt-mark unhold kubeadm kubelet kubectl
            apt-get update
            apt-get install -y kubeadm=$target_version-00 kubelet=$target_version-00 kubectl=$target_version-00
            apt-mark hold kubeadm kubelet kubectl
            kubeadm upgrade apply $target_version --yes
            systemctl daemon-reload
            systemctl restart kubelet
        "

        # Uncordon node
        kubectl uncordon "$node_name"

        # Wait for node to be ready
        kubectl wait --for=condition=Ready node/"$node_name" --timeout=300s
    done

    # Update worker nodes
    log "Updating worker nodes..."

    for node in $(kubectl get nodes -l '!node-role.kubernetes.io/control-plane' -o name); do
        node_name=$(echo "$node" | cut -d'/' -f2)
        log "Updating worker node: $node_name"

        # Drain node
        kubectl drain "$node_name" --ignore-daemonsets --delete-emptydir-data --force

        # Update kubeadm, kubelet, kubectl on the node
        ssh "$node_name" "
            apt-mark unhold kubeadm kubelet kubectl
            apt-get update
            apt-get install -y kubeadm=$target_version-00 kubelet=$target_version-00 kubectl=$target_version-00
            apt-mark hold kubeadm kubelet kubectl
            kubeadm upgrade node
            systemctl daemon-reload
            systemctl restart kubelet
        "

        # Uncordon node
        kubectl uncordon "$node_name"

        # Wait for node to be ready
        kubectl wait --for=condition=Ready node/"$node_name" --timeout=300s
    done

    log "Cluster update to $target_version completed successfully"
}

# Certificate renewal
renew_certificates() {
    log "Starting certificate renewal..."

    # Backup current certificates
    cp -r /etc/kubernetes/pki /opt/kubernetes/pki-backup-$(date +%Y%m%d_%H%M%S)

    # Renew certificates
    kubeadm certs renew all

    # Restart control plane components
    systemctl restart kubelet

    # Wait for API server to be ready
    kubectl wait --for=condition=Available deployment/coredns -n kube-system --timeout=300s

    log "Certificate renewal completed"
}

# Usage function
usage() {
    echo "Usage: $0 {health-check|backup|cleanup|update|renew-certs}"
    echo
    echo "Commands:"
    echo "  health-check    Perform cluster health check"
    echo "  backup         Create cluster backup"
    echo "  cleanup        Clean up cluster resources"
    echo "  update <ver>   Update cluster to specified version"
    echo "  renew-certs    Renew cluster certificates"
    exit 1
}

# Main execution
case "${1:-}" in
    health-check)
        health_check
        ;;
    backup)
        backup_cluster
        ;;
    cleanup)
        cleanup_cluster
        ;;
    update)
        update_cluster "${2:-}"
        ;;
    renew-certs)
        renew_certificates
        ;;
    *)
        usage
        ;;
esac
```

### Disaster Recovery Procedures

```bash
#!/bin/bash
# disaster-recovery.sh - Cluster disaster recovery procedures

set -euo pipefail

BACKUP_LOCATION="/opt/kubernetes/backups"
RECOVERY_LOG="/var/log/disaster-recovery.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$RECOVERY_LOG"
}

# etcd disaster recovery
recover_etcd() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file not found: $backup_file"
        return 1
    fi

    log "Starting etcd disaster recovery from: $backup_file"

    # Stop etcd and API server
    systemctl stop kubelet

    # Backup current etcd data
    mv /var/lib/etcd /var/lib/etcd.backup.$(date +%Y%m%d_%H%M%S)

    # Restore from snapshot
    ETCDCTL_API=3 etcdctl snapshot restore "$backup_file" \
        --data-dir=/var/lib/etcd \
        --initial-cluster-token=etcd-cluster-1 \
        --initial-advertise-peer-urls=https://$(hostname -i):2380 \
        --name=$(hostname) \
        --initial-cluster=$(hostname)=https://$(hostname -i):2380

    # Fix permissions
    chown -R etcd:etcd /var/lib/etcd

    # Restart services
    systemctl start kubelet

    # Wait for cluster to be ready
    sleep 30
    kubectl wait --for=condition=Ready nodes --all --timeout=600s

    log "etcd recovery completed successfully"
}

# Full cluster recovery
recover_cluster() {
    local backup_archive="$1"

    if [ ! -f "$backup_archive" ]; then
        log "ERROR: Backup archive not found: $backup_archive"
        return 1
    fi

    log "Starting full cluster recovery from: $backup_archive"

    # Extract backup
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$backup_archive" -C "$TEMP_DIR"
    BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "2*" | head -1)

    if [ ! -d "$BACKUP_DIR" ]; then
        log "ERROR: Invalid backup archive structure"
        return 1
    fi

    # Recover etcd
    if [ -f "$BACKUP_DIR/etcd-snapshot.db" ]; then
        recover_etcd "$BACKUP_DIR/etcd-snapshot.db"
    fi

    # Restore certificates
    if [ -d "$BACKUP_DIR/pki" ]; then
        log "Restoring certificates..."
        cp -r "$BACKUP_DIR/pki"/* /etc/kubernetes/pki/
        chown -R root:root /etc/kubernetes/pki
        chmod -R 600 /etc/kubernetes/pki
        find /etc/kubernetes/pki -name "*.crt" -exec chmod 644 {} \;
    fi

    # Restore configuration
    if ls "$BACKUP_DIR"/*.conf > /dev/null 2>&1; then
        log "Restoring configuration..."
        cp "$BACKUP_DIR"/*.conf /etc/kubernetes/
    fi

    # Restart kubelet
    systemctl restart kubelet

    # Wait for cluster to be ready
    kubectl wait --for=condition=Ready nodes --all --timeout=600s

    # Restore resources
    if [ -f "$BACKUP_DIR/all-resources.yaml" ]; then
        log "Restoring cluster resources..."
        kubectl apply -f "$BACKUP_DIR/all-resources.yaml" --force
    fi

    if [ -f "$BACKUP_DIR/persistent-volumes.yaml" ]; then
        log "Restoring persistent volumes..."
        kubectl apply -f "$BACKUP_DIR/persistent-volumes.yaml"
    fi

    # Cleanup
    rm -rf "$TEMP_DIR"

    log "Full cluster recovery completed successfully"
}

# Node recovery
recover_node() {
    local node_name="$1"
    local node_type="${2:-worker}"  # worker or master

    log "Starting node recovery for: $node_name ($node_type)"

    # Remove node from cluster if it exists
    kubectl delete node "$node_name" --ignore-not-found=true

    if [ "$node_type" = "master" ]; then
        log "Recovering master node..."

        # Generate join command for master
        CERT_KEY=$(kubeadm init phase upload-certs --upload-certs | tail -1)
        JOIN_CMD=$(kubeadm token create --print-join-command)
        MASTER_JOIN_CMD="$JOIN_CMD --control-plane --certificate-key $CERT_KEY"

        # Execute join on the target node
        ssh "$node_name" "
            kubeadm reset --force
            $MASTER_JOIN_CMD
            mkdir -p /root/.kube
            cp -i /etc/kubernetes/admin.conf /root/.kube/config
        "

    else
        log "Recovering worker node..."

        # Generate join command for worker
        JOIN_CMD=$(kubeadm token create --print-join-command)

        # Execute join on the target node
        ssh "$node_name" "
            kubeadm reset --force
            $JOIN_CMD
        "
    fi

    # Wait for node to be ready
    kubectl wait --for=condition=Ready node/"$node_name" --timeout=300s

    log "Node recovery completed for: $node_name"
}

# Validate backup
validate_backup() {
    local backup_archive="$1"

    if [ ! -f "$backup_archive" ]; then
        log "ERROR: Backup archive not found: $backup_archive"
        return 1
    fi

    log "Validating backup: $backup_archive"

    # Extract and check structure
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$backup_archive" -C "$TEMP_DIR"
    BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "2*" | head -1)

    # Check for required files
    REQUIRED_FILES=("etcd-snapshot.db" "all-resources.yaml" "manifest.json")
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$BACKUP_DIR/$file" ]; then
            log "ERROR: Missing required file in backup: $file"
            rm -rf "$TEMP_DIR"
            return 1
        fi
    done

    # Validate etcd snapshot
    if ! ETCDCTL_API=3 etcdctl snapshot status "$BACKUP_DIR/etcd-snapshot.db" > /dev/null 2>&1; then
        log "ERROR: Invalid etcd snapshot"
        rm -rf "$TEMP_DIR"
        return 1
    fi

    # Check manifest
    if ! jq . "$BACKUP_DIR/manifest.json" > /dev/null 2>&1; then
        log "ERROR: Invalid manifest.json"
        rm -rf "$TEMP_DIR"
        return 1
    fi

    rm -rf "$TEMP_DIR"
    log "Backup validation successful"
}

# List available backups
list_backups() {
    log "Available backups:"
    find "$BACKUP_LOCATION" -name "*.tar.gz" -type f -exec ls -lh {} \; | sort -k6,7
}

# Usage
usage() {
    echo "Usage: $0 {recover-etcd|recover-cluster|recover-node|validate-backup|list-backups}"
    echo
    echo "Commands:"
    echo "  recover-etcd <backup-file>              Recover etcd from snapshot"
    echo "  recover-cluster <backup-archive>        Full cluster recovery"
    echo "  recover-node <node-name> [master|worker] Recover individual node"
    echo "  validate-backup <backup-archive>        Validate backup integrity"
    echo "  list-backups                           List available backups"
    exit 1
}

# Main execution
case "${1:-}" in
    recover-etcd)
        recover_etcd "${2:-}"
        ;;
    recover-cluster)
        recover_cluster "${2:-}"
        ;;
    recover-node)
        recover_node "${2:-}" "${3:-worker}"
        ;;
    validate-backup)
        validate_backup "${2:-}"
        ;;
    list-backups)
        list_backups
        ;;
    *)
        usage
        ;;
esac
```

## Best Practices and Recommendations

### Production Readiness Checklist

**Infrastructure:**

- [ ] Multi-node control plane (minimum 3 nodes)
- [ ] Dedicated etcd cluster or HA etcd setup
- [ ] Load balancer for API server
- [ ] Network redundancy and monitoring
- [ ] Sufficient resource allocation

**Security:**

- [ ] RBAC properly configured
- [ ] Network policies implemented
- [ ] Pod security standards enforced
- [ ] Regular security scanning
- [ ] Certificate management automated

**Monitoring:**

- [ ] Prometheus and Grafana deployed
- [ ] Alert rules configured
- [ ] Log aggregation implemented
- [ ] Performance monitoring active
- [ ] SLA/SLO metrics defined

**Backup and Recovery:**

- [ ] Automated etcd backups
- [ ] Configuration backups
- [ ] Disaster recovery procedures tested
- [ ] Backup validation automated
- [ ] RTO/RPO requirements met

**Operations:**

- [ ] Cluster upgrade procedures
- [ ] Certificate renewal automation
- [ ] Resource cleanup automation
- [ ] Incident response playbooks
- [ ] Documentation maintained

### Performance Optimization

**Node Configuration:**

- Optimize kernel parameters for container workloads
- Configure appropriate CPU and memory limits
- Use fast storage for etcd and container runtime
- Implement proper network configuration

**Cluster Configuration:**

- Tune API server parameters for scale
- Configure appropriate pod and service subnets
- Implement resource quotas and limits
- Use horizontal pod autoscaling

**Application Best Practices:**

- Design stateless applications when possible
- Implement proper health checks
- Use resource requests and limits
- Follow 12-factor app principles

## Conclusion

This comprehensive guide provides the foundation for deploying production-ready Kubernetes clusters on CoreOS. The implementation covers:

- **High Availability**: Multi-master setup with load balancing
- **Security**: Comprehensive RBAC, network policies, and hardening
- **Monitoring**: Full observability with Prometheus and Grafana
- **Operations**: Automated backup, recovery, and maintenance procedures
- **Scalability**: Infrastructure designed for growth and expansion

Key benefits of this deployment approach:

- **Reliability**: Built for enterprise-grade uptime requirements
- **Security**: Defense-in-depth security implementation
- **Operational Excellence**: Automated operations and monitoring
- **Disaster Recovery**: Comprehensive backup and recovery capabilities
- **Maintainability**: Clear procedures for updates and maintenance

By following this guide, organizations can establish a robust Kubernetes platform that serves as the foundation for modern containerized applications and microservices architectures.

---

_Remember to customize configurations for your specific environment and regularly review and update security practices based on the latest Kubernetes security guidelines._
