---
author: Anubhav Gain
pubDatetime: 2025-08-13T14:30:00+05:30
modDatetime: 2025-08-13T14:30:00+05:30
title: "Wazuh MCP Server: Complete Implementation Guide with Production Examples"
slug: wazuh-mcp-server-implementation-guide
featured: false
draft: false
tags:
  - Wazuh
  - MCP
  - Implementation
  - Tutorial
  - Python
  - Docker
  - Kubernetes
  - Production
  - DevOps
  - Security
category: Security
description: Step-by-step implementation guide for Wazuh MCP Server with production deployment strategies, Docker/Kubernetes configurations, and real-world security automation examples.
---

# Wazuh MCP Server: Complete Implementation Guide with Production Examples

## Overview

This comprehensive guide walks through implementing the Wazuh MCP Server in production environments, from local development to enterprise-scale deployments. We'll cover Docker containerization, Kubernetes orchestration, high availability configurations, and real-world automation scenarios.

## Prerequisites

### System Requirements
```yaml
minimum:
  cpu: 2 cores
  memory: 4GB RAM
  disk: 20GB
  python: "3.11+"
  
recommended:
  cpu: 4 cores
  memory: 8GB RAM
  disk: 50GB
  python: "3.12+"
```

### Required Components
- Wazuh Manager (4.5+)
- Python 3.11 or higher
- Docker/Podman (for containerization)
- Kubernetes (for orchestration)
- SSL certificates

## Part 1: Local Development Setup

### 1.1 Environment Preparation

```bash
#!/bin/bash
# setup-dev-environment.sh

# Create project structure
mkdir -p wazuh-mcp-deployment/{config,scripts,docker,k8s,tests}
cd wazuh-mcp-deployment

# Setup Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install git+https://github.com/socfortress/wazuh-mcp-server.git
pip install pytest pytest-asyncio aiohttp python-dotenv
```

### 1.2 Configuration Management

```python
# config/settings.py
from pydantic import BaseSettings
from typing import Optional
import os

class WazuhMCPSettings(BaseSettings):
    """Production configuration for Wazuh MCP Server"""
    
    # Wazuh Configuration
    wazuh_url: str
    wazuh_username: str
    wazuh_password: str
    wazuh_ssl_verify: bool = True
    wazuh_timeout: int = 30
    
    # Server Configuration
    server_host: str = "0.0.0.0"
    server_port: int = 8000
    server_workers: int = 4
    
    # Security Configuration
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiry: int = 3600
    
    # Feature Flags
    read_only_mode: bool = False
    enable_metrics: bool = True
    enable_tracing: bool = True
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60
    
    class Config:
        env_file = ".env"
        env_prefix = "MCP_"

settings = WazuhMCPSettings()
```

### 1.3 Enhanced Server Implementation

```python
# server.py
import asyncio
import logging
from aiohttp import web
from prometheus_client import make_asgi_app
import uvloop
from wazuh_mcp_server import WazuhMCPServer
from config.settings import settings

# Use uvloop for better performance
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

class ProductionMCPServer:
    def __init__(self):
        self.app = web.Application()
        self.mcp_server = WazuhMCPServer(settings)
        self.setup_routes()
        self.setup_middleware()
        
    def setup_routes(self):
        """Configure API routes"""
        self.app.router.add_route('*', '/sse/{path:.*}', self.mcp_server.handle_sse)
        self.app.router.add_get('/health', self.health_check)
        self.app.router.add_get('/ready', self.readiness_check)
        self.app.router.add_get('/metrics', self.metrics_handler)
        
    def setup_middleware(self):
        """Configure middleware stack"""
        self.app.middlewares.append(self.error_middleware)
        self.app.middlewares.append(self.auth_middleware)
        self.app.middlewares.append(self.rate_limit_middleware)
        self.app.middlewares.append(self.logging_middleware)
        
    @web.middleware
    async def error_middleware(self, request, handler):
        """Global error handling"""
        try:
            return await handler(request)
        except web.HTTPException:
            raise
        except Exception as ex:
            logging.error(f"Unhandled exception: {ex}")
            return web.json_response(
                {"error": "Internal server error"},
                status=500
            )
    
    @web.middleware
    async def auth_middleware(self, request, handler):
        """JWT authentication"""
        if request.path in ['/health', '/ready', '/metrics']:
            return await handler(request)
            
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not self.validate_jwt(token):
            return web.json_response(
                {"error": "Unauthorized"},
                status=401
            )
        return await handler(request)
    
    @web.middleware
    async def rate_limit_middleware(self, request, handler):
        """Rate limiting implementation"""
        if not settings.rate_limit_enabled:
            return await handler(request)
            
        client_id = request.remote
        if self.is_rate_limited(client_id):
            return web.json_response(
                {"error": "Rate limit exceeded"},
                status=429
            )
        return await handler(request)
    
    async def health_check(self, request):
        """Kubernetes liveness probe"""
        return web.json_response({"status": "healthy"})
    
    async def readiness_check(self, request):
        """Kubernetes readiness probe"""
        try:
            await self.mcp_server.check_wazuh_connection()
            return web.json_response({"status": "ready"})
        except:
            return web.json_response(
                {"status": "not ready"},
                status=503
            )
    
    def run(self):
        """Start the server"""
        web.run_app(
            self.app,
            host=settings.server_host,
            port=settings.server_port,
            access_log_format='%t %a "%r" %s %b "%{User-Agent}i" %Tf'
        )

if __name__ == "__main__":
    server = ProductionMCPServer()
    server.run()
```

## Part 2: Docker Containerization

### 2.1 Multi-Stage Dockerfile

```dockerfile
# docker/Dockerfile
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install git+https://github.com/socfortress/wazuh-mcp-server.git

# Production image
FROM python:3.11-slim

# Security: Create non-root user
RUN useradd -m -u 1000 mcp && \
    mkdir -p /app /var/log/mcp && \
    chown -R mcp:mcp /app /var/log/mcp

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
WORKDIR /app
COPY --chown=mcp:mcp . .

# Security hardening
RUN chmod 750 /app && \
    find /app -type f -name "*.py" -exec chmod 640 {} \;

USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

ENTRYPOINT ["python"]
CMD ["-m", "wazuh_mcp_server"]
```

### 2.2 Docker Compose Configuration

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  wazuh-mcp:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: wazuh-mcp-server
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      MCP_WAZUH_URL: ${WAZUH_URL}
      MCP_WAZUH_USERNAME: ${WAZUH_USERNAME}
      MCP_WAZUH_PASSWORD: ${WAZUH_PASSWORD}
      MCP_JWT_SECRET: ${JWT_SECRET}
      MCP_ENABLE_METRICS: "true"
      MCP_LOG_LEVEL: "INFO"
    volumes:
      - ./config:/app/config:ro
      - ./logs:/var/log/mcp
      - ./certs:/app/certs:ro
    networks:
      - wazuh-network
    depends_on:
      - redis
      - prometheus
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
  redis:
    image: redis:7-alpine
    container_name: wazuh-mcp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - wazuh-network
    
  prometheus:
    image: prom/prometheus:latest
    container_name: wazuh-mcp-prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - wazuh-network
    
  grafana:
    image: grafana/grafana:latest
    container_name: wazuh-mcp-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "3000:3000"
    networks:
      - wazuh-network
    depends_on:
      - prometheus

volumes:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  wazuh-network:
    driver: bridge
```

## Part 3: Kubernetes Deployment

### 3.1 Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: wazuh-mcp
  labels:
    name: wazuh-mcp
    environment: production
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wazuh-mcp-config
  namespace: wazuh-mcp
data:
  server.conf: |
    server:
      host: 0.0.0.0
      port: 8000
      workers: 4
    
    security:
      read_only_mode: false
      enable_audit: true
    
    features:
      enable_metrics: true
      enable_tracing: true
      enable_profiling: false
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: wazuh-mcp-secret
  namespace: wazuh-mcp
type: Opaque
stringData:
  wazuh-url: "https://wazuh.example.com:55000"
  wazuh-username: "admin"
  wazuh-password: "SecurePassword123!"
  jwt-secret: "your-jwt-secret-key"
---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wazuh-mcp-server
  namespace: wazuh-mcp
  labels:
    app: wazuh-mcp
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: wazuh-mcp
  template:
    metadata:
      labels:
        app: wazuh-mcp
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: wazuh-mcp
        image: your-registry/wazuh-mcp-server:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: MCP_WAZUH_URL
          valueFrom:
            secretKeyRef:
              name: wazuh-mcp-secret
              key: wazuh-url
        - name: MCP_WAZUH_USERNAME
          valueFrom:
            secretKeyRef:
              name: wazuh-mcp-secret
              key: wazuh-username
        - name: MCP_WAZUH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: wazuh-mcp-secret
              key: wazuh-password
        - name: MCP_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: wazuh-mcp-secret
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: config
        configMap:
          name: wazuh-mcp-config
      - name: tmp
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - wazuh-mcp
              topologyKey: kubernetes.io/hostname
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: wazuh-mcp-service
  namespace: wazuh-mcp
  labels:
    app: wazuh-mcp
spec:
  type: ClusterIP
  selector:
    app: wazuh-mcp
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wazuh-mcp-ingress
  namespace: wazuh-mcp
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - mcp.example.com
    secretName: wazuh-mcp-tls
  rules:
  - host: mcp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wazuh-mcp-service
            port:
              number: 8000
```

### 3.2 Horizontal Pod Autoscaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wazuh-mcp-hpa
  namespace: wazuh-mcp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wazuh-mcp-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: mcp_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
```

## Part 4: Production Integration Examples

### 4.1 Incident Response Automation

```python
# scripts/incident_response.py
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
import json
from wazuh_mcp_client import WazuhMCPClient
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent

class IncidentResponseAutomation:
    """Automated incident response using Wazuh MCP Server"""
    
    def __init__(self, mcp_url: str, openai_key: str):
        self.mcp_client = WazuhMCPClient(mcp_url)
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0,
            api_key=openai_key
        )
        self.setup_agent()
        
    def setup_agent(self):
        """Initialize AI agent with MCP tools"""
        tools = self.mcp_client.get_tools()
        self.agent = create_openai_tools_agent(self.llm, tools)
    
    async def investigate_security_event(self, event: Dict) -> Dict:
        """Comprehensive security event investigation"""
        
        investigation_steps = {
            "initial_triage": await self.triage_event(event),
            "agent_analysis": await self.analyze_affected_agent(event),
            "lateral_movement": await self.check_lateral_movement(event),
            "persistence_check": await self.check_persistence_mechanisms(event),
            "network_analysis": await self.analyze_network_connections(event),
            "process_tree": await self.analyze_process_tree(event),
            "file_analysis": await self.analyze_file_modifications(event),
            "threat_enrichment": await self.enrich_with_threat_intel(event)
        }
        
        # Generate comprehensive report
        report = await self.generate_investigation_report(
            event, 
            investigation_steps
        )
        
        # Determine response actions
        response_actions = await self.determine_response_actions(report)
        
        # Execute automated responses
        if report['severity'] >= 8:
            await self.execute_critical_response(event, response_actions)
        
        return {
            "event": event,
            "investigation": investigation_steps,
            "report": report,
            "actions_taken": response_actions,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def triage_event(self, event: Dict) -> Dict:
        """Initial event triage and classification"""
        
        triage_prompt = f"""
        Analyze this security event and provide triage information:
        
        Event: {json.dumps(event, indent=2)}
        
        Please determine:
        1. Severity (1-10)
        2. Event category (malware, intrusion, data_exfiltration, etc.)
        3. Affected assets
        4. Immediate risk assessment
        5. Required investigation priority
        """
        
        result = await self.agent.ainvoke({"input": triage_prompt})
        return self.parse_triage_result(result)
    
    async def analyze_affected_agent(self, event: Dict) -> Dict:
        """Deep analysis of affected Wazuh agent"""
        
        agent_id = event.get('agent', {}).get('id')
        
        analysis_queries = [
            f"Get detailed information about agent {agent_id}",
            f"Show all running processes on agent {agent_id}",
            f"List network connections for agent {agent_id}",
            f"Check installed packages on agent {agent_id}",
            f"Review recent file modifications on agent {agent_id}"
        ]
        
        results = {}
        for query in analysis_queries:
            result = await self.agent.ainvoke({"input": query})
            results[query] = result
        
        return results
    
    async def check_lateral_movement(self, event: Dict) -> Dict:
        """Check for potential lateral movement indicators"""
        
        source_ip = event.get('data', {}).get('srcip')
        timeframe = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        
        lateral_movement_query = f"""
        Find all agents that have connections from {source_ip} since {timeframe}.
        For each agent, check for:
        1. New user accounts created
        2. Unusual authentication patterns
        3. Service installations
        4. Registry modifications
        5. Scheduled task creations
        """
        
        result = await self.agent.ainvoke({"input": lateral_movement_query})
        return self.analyze_lateral_movement_indicators(result)
    
    async def check_persistence_mechanisms(self, event: Dict) -> Dict:
        """Identify potential persistence mechanisms"""
        
        agent_id = event.get('agent', {}).get('id')
        
        persistence_query = f"""
        On agent {agent_id}, check for persistence mechanisms:
        1. Startup folder items
        2. Registry run keys
        3. Scheduled tasks
        4. Services set to auto-start
        5. WMI event subscriptions
        6. Modified system binaries
        7. Suspicious kernel modules
        """
        
        result = await self.agent.ainvoke({"input": persistence_query})
        return self.parse_persistence_findings(result)
    
    async def execute_critical_response(self, event: Dict, actions: List[str]):
        """Execute automated response for critical events"""
        
        agent_id = event.get('agent', {}).get('id')
        
        response_actions = {
            "isolate_host": f"Isolate agent {agent_id} from network",
            "kill_process": f"Terminate malicious process on agent {agent_id}",
            "block_ip": f"Block IP address in firewall",
            "disable_account": f"Disable compromised user account",
            "collect_forensics": f"Collect forensic data from agent {agent_id}"
        }
        
        executed_actions = []
        for action in actions:
            if action in response_actions:
                # Execute via MCP
                result = await self.agent.ainvoke({
                    "input": response_actions[action]
                })
                executed_actions.append({
                    "action": action,
                    "result": result,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Send notification
        await self.send_critical_alert_notification(event, executed_actions)
        
        return executed_actions
```

### 4.2 Continuous Compliance Monitoring

```python
# scripts/compliance_monitoring.py
import asyncio
from typing import Dict, List
import pandas as pd
from datetime import datetime

class ComplianceMonitor:
    """Automated compliance monitoring using Wazuh MCP"""
    
    def __init__(self, mcp_client, frameworks: List[str]):
        self.mcp = mcp_client
        self.frameworks = frameworks  # ['PCI-DSS', 'HIPAA', 'CIS']
        self.compliance_rules = self.load_compliance_rules()
        
    async def run_compliance_scan(self) -> Dict:
        """Execute comprehensive compliance scan"""
        
        results = {
            "scan_id": self.generate_scan_id(),
            "timestamp": datetime.utcnow().isoformat(),
            "frameworks": {},
            "summary": {}
        }
        
        # Get all agents
        agents = await self.get_all_agents()
        
        for framework in self.frameworks:
            framework_results = await self.scan_framework_compliance(
                framework, 
                agents
            )
            results["frameworks"][framework] = framework_results
        
        # Generate summary
        results["summary"] = self.generate_compliance_summary(results)
        
        # Create remediation plan
        results["remediation"] = await self.create_remediation_plan(results)
        
        return results
    
    async def scan_framework_compliance(
        self, 
        framework: str, 
        agents: List[Dict]
    ) -> Dict:
        """Scan compliance for specific framework"""
        
        framework_rules = self.compliance_rules[framework]
        results = {
            "compliant": [],
            "non_compliant": [],
            "warnings": [],
            "not_applicable": []
        }
        
        for rule in framework_rules:
            rule_result = await self.check_compliance_rule(rule, agents)
            
            if rule_result["status"] == "compliant":
                results["compliant"].append(rule_result)
            elif rule_result["status"] == "non_compliant":
                results["non_compliant"].append(rule_result)
            elif rule_result["status"] == "warning":
                results["warnings"].append(rule_result)
            else:
                results["not_applicable"].append(rule_result)
        
        return results
    
    async def check_compliance_rule(
        self, 
        rule: Dict, 
        agents: List[Dict]
    ) -> Dict:
        """Check specific compliance rule across agents"""
        
        rule_query = self.build_compliance_query(rule)
        
        result = await self.mcp.agent.ainvoke({
            "input": rule_query
        })
        
        return {
            "rule_id": rule["id"],
            "description": rule["description"],
            "status": self.evaluate_compliance_status(result),
            "affected_agents": self.extract_affected_agents(result),
            "evidence": result,
            "remediation": rule.get("remediation")
        }
    
    def build_compliance_query(self, rule: Dict) -> str:
        """Build MCP query for compliance rule"""
        
        query_templates = {
            "password_policy": """
                Check password policy configuration on all Windows agents:
                - Minimum password length
                - Password complexity requirements
                - Password history
                - Maximum password age
            """,
            
            "encryption": """
                Verify encryption status on all agents:
                - Disk encryption status
                - TLS/SSL configuration
                - Certificate validation
                - Encrypted communication channels
            """,
            
            "logging": """
                Validate logging configuration:
                - Audit logging enabled
                - Log retention period
                - Log forwarding configuration
                - Critical event logging
            """,
            
            "access_control": """
                Review access control settings:
                - User permissions
                - Service accounts
                - Administrative access
                - Privilege escalation controls
            """
        }
        
        return query_templates.get(
            rule["category"], 
            f"Check compliance for: {rule['description']}"
        )
    
    async def create_remediation_plan(self, scan_results: Dict) -> Dict:
        """Generate automated remediation plan"""
        
        remediation_plan = {
            "priority_high": [],
            "priority_medium": [],
            "priority_low": [],
            "automated_fixes": []
        }
        
        for framework, results in scan_results["frameworks"].items():
            for finding in results["non_compliant"]:
                remediation = {
                    "framework": framework,
                    "rule": finding["rule_id"],
                    "description": finding["description"],
                    "affected_agents": finding["affected_agents"],
                    "remediation_steps": finding.get("remediation", []),
                    "can_automate": self.can_automate_fix(finding)
                }
                
                # Prioritize based on severity
                if finding.get("severity", "medium") == "high":
                    remediation_plan["priority_high"].append(remediation)
                elif finding.get("severity") == "low":
                    remediation_plan["priority_low"].append(remediation)
                else:
                    remediation_plan["priority_medium"].append(remediation)
                
                # Add to automated fixes if possible
                if remediation["can_automate"]:
                    remediation_plan["automated_fixes"].append(remediation)
        
        return remediation_plan
```

### 4.3 Threat Hunting Automation

```python
# scripts/threat_hunting.py
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import re

class ThreatHunter:
    """Automated threat hunting using Wazuh MCP and AI"""
    
    def __init__(self, mcp_client, threat_feeds: List[str]):
        self.mcp = mcp_client
        self.threat_feeds = threat_feeds
        self.hunting_patterns = self.load_hunting_patterns()
        
    async def hunt_threats(self, timeframe_hours: int = 24) -> Dict:
        """Execute automated threat hunting"""
        
        hunt_results = {
            "hunt_id": self.generate_hunt_id(),
            "start_time": datetime.utcnow().isoformat(),
            "timeframe": f"{timeframe_hours} hours",
            "hunts_executed": [],
            "threats_found": [],
            "suspicious_activity": [],
            "recommendations": []
        }
        
        # Execute different hunting techniques
        techniques = [
            self.hunt_living_off_the_land(),
            self.hunt_data_exfiltration(),
            self.hunt_privilege_escalation(),
            self.hunt_command_and_control(),
            self.hunt_defense_evasion(),
            self.hunt_anomalous_behavior()
        ]
        
        for technique in techniques:
            result = await technique
            hunt_results["hunts_executed"].append(result)
            
            if result["threats_found"]:
                hunt_results["threats_found"].extend(result["threats_found"])
            
            if result["suspicious_activity"]:
                hunt_results["suspicious_activity"].extend(
                    result["suspicious_activity"]
                )
        
        # Correlate findings
        hunt_results["correlations"] = await self.correlate_findings(
            hunt_results
        )
        
        # Generate recommendations
        hunt_results["recommendations"] = await self.generate_recommendations(
            hunt_results
        )
        
        return hunt_results
    
    async def hunt_living_off_the_land(self) -> Dict:
        """Hunt for Living off the Land techniques"""
        
        lolbins = [
            "certutil.exe", "bitsadmin.exe", "powershell.exe",
            "wmic.exe", "mshta.exe", "rundll32.exe", "regsvr32.exe",
            "cscript.exe", "wscript.exe", "msiexec.exe"
        ]
        
        hunt_query = f"""
        Find all processes using these binaries: {', '.join(lolbins)}
        For each process, analyze:
        1. Command line arguments for suspicious patterns
        2. Parent process relationships
        3. Network connections made
        4. Files accessed or created
        5. Registry modifications
        
        Flag as suspicious if:
        - Downloading from external URLs
        - Base64 encoded commands
        - Unusual parent-child relationships
        - Execution from temp directories
        """
        
        result = await self.mcp.agent.ainvoke({"input": hunt_query})
        
        return self.analyze_lolbin_activity(result)
    
    async def hunt_data_exfiltration(self) -> Dict:
        """Hunt for data exfiltration indicators"""
        
        exfil_query = """
        Analyze network traffic patterns for data exfiltration:
        1. Large outbound data transfers to unusual destinations
        2. Connections to cloud storage services
        3. DNS tunneling patterns (high DNS query volume)
        4. Encrypted channels to suspicious IPs
        5. Data staging in archive files
        
        Check for:
        - Compressed files created in last 24 hours
        - Unusual protocols on standard ports
        - Beaconing behavior
        - Data transfers during off-hours
        """
        
        result = await self.mcp.agent.ainvoke({"input": exfil_query})
        
        return self.analyze_exfiltration_patterns(result)
    
    async def hunt_privilege_escalation(self) -> Dict:
        """Hunt for privilege escalation attempts"""
        
        privesc_query = """
        Search for privilege escalation indicators:
        1. Process token manipulation
        2. Service creation or modification
        3. Scheduled task creation with SYSTEM privileges
        4. UAC bypass attempts
        5. Kernel exploit indicators
        6. SUID/SGID binary execution (Linux)
        7. Sudo configuration changes
        
        Look for:
        - Processes running with unexpected privileges
        - Recent privilege changes
        - Failed authentication followed by success
        - Suspicious service installations
        """
        
        result = await self.mcp.agent.ainvoke({"input": privesc_query})
        
        return self.analyze_privilege_escalation(result)
    
    async def hunt_anomalous_behavior(self) -> Dict:
        """Hunt using behavioral analytics"""
        
        anomaly_query = """
        Identify anomalous behavior patterns:
        1. Users accessing systems outside normal hours
        2. Processes with unusual resource consumption
        3. Rare process executions
        4. Abnormal network traffic patterns
        5. Unusual file access patterns
        6. Services starting at unusual times
        
        Compare against baseline behavior and flag deviations
        """
        
        result = await self.mcp.agent.ainvoke({"input": anomaly_query})
        
        return self.analyze_anomalies(result)
    
    async def correlate_findings(self, hunt_results: Dict) -> List[Dict]:
        """Correlate hunting findings to identify attack chains"""
        
        correlation_prompt = f"""
        Analyze these threat hunting findings and identify potential attack chains:
        
        Findings: {hunt_results}
        
        Look for:
        1. Related events across different hunt techniques
        2. Temporal relationships between events
        3. Common actors (users, processes, IPs)
        4. MITRE ATT&CK technique chains
        5. Kill chain progression
        
        Provide correlation confidence scores and evidence
        """
        
        correlations = await self.mcp.agent.ainvoke({
            "input": correlation_prompt
        })
        
        return self.parse_correlations(correlations)
```

## Part 5: Monitoring & Observability

### 5.1 Prometheus Metrics

```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Info
import time

# Define metrics
mcp_requests_total = Counter(
    'mcp_requests_total',
    'Total number of MCP requests',
    ['method', 'tool', 'status']
)

mcp_request_duration_seconds = Histogram(
    'mcp_request_duration_seconds',
    'MCP request duration in seconds',
    ['method', 'tool'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

wazuh_agents_total = Gauge(
    'wazuh_agents_total',
    'Total number of Wazuh agents',
    ['status']
)

wazuh_api_errors_total = Counter(
    'wazuh_api_errors_total',
    'Total number of Wazuh API errors',
    ['error_type']
)

mcp_active_connections = Gauge(
    'mcp_active_connections',
    'Number of active MCP connections'
)

mcp_info = Info(
    'mcp_server',
    'MCP server information'
)

# Middleware to collect metrics
class MetricsMiddleware:
    async def __call__(self, request, handler):
        start_time = time.time()
        tool = request.match_info.get('tool', 'unknown')
        
        try:
            response = await handler(request)
            status = 'success'
            return response
        except Exception as e:
            status = 'error'
            wazuh_api_errors_total.labels(
                error_type=type(e).__name__
            ).inc()
            raise
        finally:
            duration = time.time() - start_time
            mcp_requests_total.labels(
                method=request.method,
                tool=tool,
                status=status
            ).inc()
            mcp_request_duration_seconds.labels(
                method=request.method,
                tool=tool
            ).observe(duration)
```

### 5.2 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Wazuh MCP Server Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(mcp_requests_total[5m])",
            "legendFormat": "{{method}} - {{tool}}"
          }
        ]
      },
      {
        "title": "Request Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(mcp_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Active Agents",
        "targets": [
          {
            "expr": "wazuh_agents_total",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(wazuh_api_errors_total[5m])",
            "legendFormat": "{{error_type}}"
          }
        ]
      }
    ]
  }
}
```

## Part 6: Testing & Validation

### 6.1 Integration Tests

```python
# tests/test_integration.py
import pytest
import asyncio
from wazuh_mcp_client import WazuhMCPClient

@pytest.mark.asyncio
async def test_agent_enumeration():
    """Test agent enumeration functionality"""
    client = WazuhMCPClient("http://localhost:8000")
    
    agents = await client.get_agents()
    
    assert agents is not None
    assert isinstance(agents, list)
    assert len(agents) > 0
    
    for agent in agents:
        assert 'id' in agent
        assert 'name' in agent
        assert 'status' in agent

@pytest.mark.asyncio
async def test_process_analysis():
    """Test process analysis capabilities"""
    client = WazuhMCPClient("http://localhost:8000")
    
    # Get first active agent
    agents = await client.get_agents(status='active')
    agent_id = agents[0]['id']
    
    # Get processes
    processes = await client.get_agent_processes(agent_id)
    
    assert processes is not None
    assert isinstance(processes, list)
    
    # Verify process structure
    if len(processes) > 0:
        process = processes[0]
        assert 'name' in process
        assert 'pid' in process
        assert 'ppid' in process

@pytest.mark.asyncio
async def test_security_scan():
    """Test security configuration assessment"""
    client = WazuhMCPClient("http://localhost:8000")
    
    agents = await client.get_agents(status='active')
    agent_id = agents[0]['id']
    
    sca_results = await client.get_agent_sca(agent_id)
    
    assert sca_results is not None
    assert 'policies' in sca_results
    
    for policy in sca_results['policies']:
        assert 'name' in policy
        assert 'score' in policy
        assert 'failed' in policy
        assert 'passed' in policy
```

### 6.2 Load Testing

```python
# tests/load_test.py
import asyncio
import aiohttp
import time
from typing import List

async def load_test(
    url: str,
    concurrent_requests: int = 100,
    duration_seconds: int = 60
):
    """Load test the MCP server"""
    
    results = {
        'total_requests': 0,
        'successful_requests': 0,
        'failed_requests': 0,
        'response_times': []
    }
    
    async def make_request(session):
        start = time.time()
        try:
            async with session.get(f"{url}/health") as response:
                if response.status == 200:
                    results['successful_requests'] += 1
                else:
                    results['failed_requests'] += 1
        except Exception:
            results['failed_requests'] += 1
        finally:
            results['total_requests'] += 1
            results['response_times'].append(time.time() - start)
    
    async with aiohttp.ClientSession() as session:
        end_time = time.time() + duration_seconds
        
        while time.time() < end_time:
            tasks = [
                make_request(session) 
                for _ in range(concurrent_requests)
            ]
            await asyncio.gather(*tasks)
    
    # Calculate statistics
    avg_response_time = sum(results['response_times']) / len(results['response_times'])
    requests_per_second = results['total_requests'] / duration_seconds
    
    print(f"Load Test Results:")
    print(f"Total Requests: {results['total_requests']}")
    print(f"Successful: {results['successful_requests']}")
    print(f"Failed: {results['failed_requests']}")
    print(f"Avg Response Time: {avg_response_time:.3f}s")
    print(f"Requests/Second: {requests_per_second:.2f}")

if __name__ == "__main__":
    asyncio.run(load_test("http://localhost:8000"))
```

## Conclusion

This implementation guide provides a complete production-ready deployment of the Wazuh MCP Server. The combination of containerization, orchestration, monitoring, and automation examples demonstrates how to leverage this powerful integration for next-generation security operations.

Key takeaways:
- **Scalability**: Kubernetes deployment with auto-scaling
- **Reliability**: Health checks, monitoring, and error handling
- **Security**: Authentication, authorization, and encryption
- **Automation**: Incident response, compliance, and threat hunting
- **Observability**: Comprehensive metrics and logging

The Wazuh MCP Server bridges the gap between traditional SIEM and modern AI, enabling security teams to work more efficiently and effectively.
