---
title: "Security Correlation System Architecture: Database Design and Deployment Patterns"
author: "Anubhav Gain"
pubDatetime: 2025-01-28T18:00:00Z
featured: false
draft: false
tags:
  - security
  - correlation
  - architecture
  - database
  - siem
  - system-design
  - deployment
description: "Comprehensive guide to designing and implementing security correlation systems with database schemas, architectural patterns, and deployment strategies for modern SIEM platforms."
---

# Security Correlation System Architecture: Database Design and Deployment Patterns

Modern security operations require sophisticated correlation systems that can process, analyze, and correlate vast amounts of security data in real-time. This guide provides a comprehensive overview of system architecture patterns, database design principles, and deployment strategies for building effective security correlation platforms.

## Table of Contents

- [System Architecture Overview](#system-architecture-overview)
- [Database Schema Design](#database-schema-design)
- [Deployment Architecture](#deployment-architecture)
- [Use Case Implementation](#use-case-implementation)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)

## System Architecture Overview

### High-Level Architecture

The security correlation system follows a multi-tier architecture designed for scalability, reliability, and real-time processing:

```mermaid
graph TB
    subgraph "Data Sources"
        A1[Network Logs]
        A2[Endpoint Logs]
        A3[Application Logs]
        A4[Threat Intelligence]
        A5[Vulnerability Scanners]
    end

    subgraph "Ingestion Layer"
        B1[Log Collectors]
        B2[API Gateways]
        B3[Message Queues]
    end

    subgraph "Processing Layer"
        C1[Stream Processors]
        C2[Correlation Engine]
        C3[ML/AI Analytics]
        C4[Rule Engine]
    end

    subgraph "Storage Layer"
        D1[Time Series DB]
        D2[Graph Database]
        D3[Document Store]
        D4[Data Warehouse]
    end

    subgraph "Analysis Layer"
        E1[Real-time Analytics]
        E2[Historical Analysis]
        E3[Threat Hunting]
        E4[Incident Response]
    end

    subgraph "Presentation Layer"
        F1[Dashboards]
        F2[Alerting System]
        F3[Reports]
        F4[APIs]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B2
    A4 --> B2
    A5 --> B3

    B1 --> C1
    B2 --> C1
    B3 --> C2

    C1 --> D1
    C2 --> D2
    C3 --> D3
    C4 --> D4

    D1 --> E1
    D2 --> E2
    D3 --> E3
    D4 --> E4

    E1 --> F1
    E2 --> F2
    E3 --> F3
    E4 --> F4
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant DS as Data Source
    participant IC as Ingestion Controller
    participant SP as Stream Processor
    participant CE as Correlation Engine
    participant DB as Database
    participant AL as Alert System
    participant UI as User Interface

    DS->>IC: Send raw logs
    IC->>SP: Forward for processing
    SP->>SP: Parse and normalize
    SP->>CE: Send processed events
    CE->>CE: Apply correlation rules
    CE->>DB: Store events and correlations
    CE->>AL: Generate alerts
    AL->>UI: Display alerts
    UI->>DB: Query historical data
    DB->>UI: Return analysis results
```

## Database Schema Design

### Core Entity Relationships

```mermaid
erDiagram
    EVENT ||--o{ EVENT_ATTRIBUTE : contains
    EVENT ||--o{ CORRELATION : participates_in
    EVENT }|--|| SOURCE : originates_from
    EVENT }|--|| EVENT_TYPE : classified_as

    CORRELATION ||--o{ CORRELATION_RULE : follows
    CORRELATION ||--o{ ALERT : generates

    ALERT }|--|| SEVERITY : has
    ALERT ||--o{ INCIDENT : escalates_to

    INCIDENT ||--o{ RESPONSE_ACTION : triggers
    INCIDENT }|--|| USER : assigned_to

    USER ||--o{ ROLE : has
    ROLE ||--o{ PERMISSION : grants

    THREAT_INTEL ||--o{ IOC : contains
    IOC ||--o{ EVENT : matches

    ASSET ||--o{ EVENT : generates
    ASSET }|--|| ASSET_TYPE : categorized_as

    EVENT {
        uuid event_id PK
        timestamp event_time
        string source_ip
        string dest_ip
        int source_port
        int dest_port
        string protocol
        string event_type
        text raw_data
        json normalized_data
        uuid source_id FK
        uuid event_type_id FK
        timestamp created_at
        timestamp updated_at
    }

    EVENT_ATTRIBUTE {
        uuid attribute_id PK
        uuid event_id FK
        string attribute_name
        string attribute_value
        string data_type
        timestamp created_at
    }

    SOURCE {
        uuid source_id PK
        string source_name
        string source_type
        string ip_address
        json configuration
        boolean is_active
        timestamp last_seen
        timestamp created_at
    }

    EVENT_TYPE {
        uuid event_type_id PK
        string type_name
        string category
        text description
        json schema
        int severity_default
        timestamp created_at
    }

    CORRELATION {
        uuid correlation_id PK
        string correlation_name
        uuid rule_id FK
        timestamp start_time
        timestamp end_time
        int event_count
        float confidence_score
        json metadata
        timestamp created_at
    }

    CORRELATION_RULE {
        uuid rule_id PK
        string rule_name
        text rule_definition
        string rule_type
        int time_window
        int threshold
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ALERT {
        uuid alert_id PK
        uuid correlation_id FK
        uuid severity_id FK
        string alert_title
        text alert_description
        string status
        json details
        timestamp triggered_at
        timestamp acknowledged_at
        uuid acknowledged_by FK
    }

    SEVERITY {
        uuid severity_id PK
        string severity_name
        int severity_level
        string color_code
        text description
    }

    INCIDENT {
        uuid incident_id PK
        string incident_number
        string title
        text description
        uuid assigned_to FK
        string status
        string priority
        timestamp created_at
        timestamp resolved_at
    }

    USER {
        uuid user_id PK
        string username
        string email
        string full_name
        boolean is_active
        timestamp last_login
        timestamp created_at
    }

    ROLE {
        uuid role_id PK
        string role_name
        text description
        timestamp created_at
    }

    PERMISSION {
        uuid permission_id PK
        string permission_name
        string resource
        string action
        text description
    }

    THREAT_INTEL {
        uuid intel_id PK
        string source_name
        string intel_type
        float confidence_score
        timestamp valid_from
        timestamp valid_until
        json metadata
        timestamp created_at
    }

    IOC {
        uuid ioc_id PK
        uuid intel_id FK
        string ioc_type
        string ioc_value
        string status
        float confidence_score
        timestamp first_seen
        timestamp last_seen
    }

    ASSET {
        uuid asset_id PK
        string asset_name
        uuid asset_type_id FK
        string ip_address
        string mac_address
        string hostname
        string operating_system
        json metadata
        boolean is_critical
        timestamp created_at
        timestamp updated_at
    }

    ASSET_TYPE {
        uuid asset_type_id PK
        string type_name
        text description
        json attributes_schema
        timestamp created_at
    }

    RESPONSE_ACTION {
        uuid action_id PK
        uuid incident_id FK
        string action_type
        text description
        string status
        uuid performed_by FK
        timestamp performed_at
        json results
    }
```

### Database Implementation SQL

```sql
-- Events table with partitioning for performance
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time TIMESTAMPTZ NOT NULL,
    source_ip INET,
    dest_ip INET,
    source_port INTEGER,
    dest_port INTEGER,
    protocol VARCHAR(20),
    event_type VARCHAR(100) NOT NULL,
    raw_data TEXT,
    normalized_data JSONB,
    source_id UUID REFERENCES sources(source_id),
    event_type_id UUID REFERENCES event_types(event_type_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (event_time);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for performance
CREATE INDEX idx_events_time ON events (event_time);
CREATE INDEX idx_events_source_ip ON events USING HASH (source_ip);
CREATE INDEX idx_events_dest_ip ON events USING HASH (dest_ip);
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_events_normalized_data ON events USING GIN (normalized_data);

-- Correlation rules table
CREATE TABLE correlation_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    rule_definition TEXT NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    time_window INTEGER NOT NULL, -- in seconds
    threshold INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table with status tracking
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID REFERENCES correlations(correlation_id),
    severity_id UUID REFERENCES severities(severity_id),
    alert_title VARCHAR(255) NOT NULL,
    alert_description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    details JSONB,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(user_id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Deployment Architecture

### Cloud-Native Deployment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Application Load Balancer]
    end

    subgraph "API Gateway Cluster"
        AG1[API Gateway 1]
        AG2[API Gateway 2]
        AG3[API Gateway 3]
    end

    subgraph "Application Tier"
        subgraph "Correlation Service"
            CS1[Correlation Service 1]
            CS2[Correlation Service 2]
            CS3[Correlation Service 3]
        end

        subgraph "Analytics Service"
            AS1[Analytics Service 1]
            AS2[Analytics Service 2]
        end

        subgraph "Alert Service"
            ALS1[Alert Service 1]
            ALS2[Alert Service 2]
        end
    end

    subgraph "Message Queue Cluster"
        MQ1[Message Queue 1]
        MQ2[Message Queue 2]
        MQ3[Message Queue 3]
    end

    subgraph "Database Cluster"
        subgraph "Primary DB"
            DB1[PostgreSQL Primary]
        end

        subgraph "Read Replicas"
            DB2[PostgreSQL Replica 1]
            DB3[PostgreSQL Replica 2]
        end

        subgraph "Time Series DB"
            TS1[InfluxDB Cluster]
        end

        subgraph "Search Engine"
            ES1[Elasticsearch Cluster]
        end
    end

    subgraph "Caching Layer"
        RC1[Redis Cluster 1]
        RC2[Redis Cluster 2]
    end

    subgraph "Monitoring"
        MON1[Prometheus]
        MON2[Grafana]
        MON3[Alert Manager]
    end

    LB --> AG1
    LB --> AG2
    LB --> AG3

    AG1 --> CS1
    AG2 --> CS2
    AG3 --> CS3

    CS1 --> MQ1
    CS2 --> MQ2
    CS3 --> MQ3

    CS1 --> RC1
    AS1 --> RC2

    CS1 --> DB1
    AS1 --> DB2
    ALS1 --> DB3

    CS1 --> TS1
    AS1 --> ES1

    CS1 --> MON1
    AS1 --> MON1
    ALS1 --> MON1
```

### Container Orchestration

```yaml
# docker-compose.yml for development environment
version: "3.8"

services:
  # Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - correlation-api
      - analytics-api

  # Correlation Service
  correlation-api:
    build:
      context: ./correlation-service
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/correlation_db
      - REDIS_URL=redis://redis:6379/0
      - MESSAGE_QUEUE_URL=amqp://rabbitmq:5672
    depends_on:
      - postgres
      - redis
      - rabbitmq
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: "0.5"

  # Analytics Service
  analytics-api:
    build:
      context: ./analytics-service
      dockerfile: Dockerfile
    ports:
      - "8002:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/correlation_db
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - postgres
      - elasticsearch

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=correlation_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  # InfluxDB for time series data
  influxdb:
    image: influxdb:2.7-alpine
    environment:
      - INFLUXDB_DB=metrics
      - INFLUXDB_ADMIN_USER=admin
      - INFLUXDB_ADMIN_PASSWORD=password
    ports:
      - "8086:8086"
    volumes:
      - influxdb_data:/var/lib/influxdb2

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  elasticsearch_data:
  influxdb_data:
  prometheus_data:
  grafana_data:
```

### Kubernetes Deployment

```yaml
# correlation-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: correlation-service
  labels:
    app: correlation-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: correlation-service
  template:
    metadata:
      labels:
        app: correlation-service
    spec:
      containers:
        - name: correlation-service
          image: correlation-service:latest
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: database-url
            - name: REDIS_URL
              value: "redis://redis-service:6379/0"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: correlation-service
spec:
  selector:
    app: correlation-service
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: correlation-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: correlation.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: correlation-service
                port:
                  number: 80
```

## Use Case Implementation

### Real-Time Threat Detection

```mermaid
graph LR
    subgraph "Data Ingestion"
        A1[Firewall Logs]
        A2[IDS/IPS Alerts]
        A3[Endpoint Logs]
        A4[DNS Logs]
    end

    subgraph "Correlation Rules"
        B1[Brute Force Detection]
        B2[Lateral Movement]
        B3[Data Exfiltration]
        B4[Malware Communication]
    end

    subgraph "Analysis Engine"
        C1[Pattern Matching]
        C2[Statistical Analysis]
        C3[Machine Learning]
        C4[Threat Intelligence]
    end

    subgraph "Response Actions"
        D1[Alert Generation]
        D2[Incident Creation]
        D3[Automated Response]
        D4[Threat Hunting]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4

    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C4

    C1 --> D1
    C2 --> D2
    C3 --> D3
    C4 --> D4
```

### User Behavior Analytics

```mermaid
stateDiagram-v2
    [*] --> Normal_Behavior
    Normal_Behavior --> Anomaly_Detected: Threshold Exceeded
    Anomaly_Detected --> Risk_Assessment: Analyze Context
    Risk_Assessment --> Low_Risk: Score < 30
    Risk_Assessment --> Medium_Risk: Score 30-70
    Risk_Assessment --> High_Risk: Score > 70

    Low_Risk --> Normal_Behavior: Log Event
    Medium_Risk --> Alert_Generated: Notify SOC
    High_Risk --> Incident_Created: Escalate

    Alert_Generated --> Investigation: Analyst Review
    Incident_Created --> Response_Initiated: Immediate Action

    Investigation --> False_Positive: No Threat
    Investigation --> Confirmed_Threat: Threat Validated

    False_Positive --> Normal_Behavior: Update Baseline
    Confirmed_Threat --> Response_Initiated: Take Action

    Response_Initiated --> [*]: Case Closed
```

## Performance Optimization

### Database Optimization

```sql
-- Partitioning strategy for events table
CREATE TABLE events_y2024m01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_events_source_ip_time
    ON events (source_ip, event_time DESC);

CREATE INDEX CONCURRENTLY idx_events_dest_ip_time
    ON events (dest_ip, event_time DESC);

-- Materialized views for aggregated data
CREATE MATERIALIZED VIEW hourly_event_summary AS
SELECT
    date_trunc('hour', event_time) as hour,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT source_ip) as unique_sources
FROM events
WHERE event_time >= NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', event_time), event_type;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_hourly_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_event_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-hourly-summary', '0 * * * *',
                     'SELECT refresh_hourly_summary();');
```

### Caching Strategy

```python
# Redis caching for correlation rules
import redis
import json
from datetime import timedelta

class CorrelationRuleCache:
    def __init__(self, redis_url):
        self.redis_client = redis.from_url(redis_url)
        self.cache_ttl = timedelta(hours=1)

    def get_active_rules(self):
        """Get active correlation rules from cache"""
        cached_rules = self.redis_client.get("active_correlation_rules")
        if cached_rules:
            return json.loads(cached_rules)

        # Fetch from database if not in cache
        rules = self._fetch_rules_from_db()
        self.redis_client.setex(
            "active_correlation_rules",
            self.cache_ttl,
            json.dumps(rules)
        )
        return rules

    def invalidate_cache(self):
        """Invalidate correlation rules cache"""
        self.redis_client.delete("active_correlation_rules")

    def _fetch_rules_from_db(self):
        # Database query to fetch active rules
        pass
```

### Stream Processing Optimization

```python
# Apache Kafka consumer for real-time event processing
from kafka import KafkaConsumer
import json
import concurrent.futures
from typing import List, Dict

class EventStreamProcessor:
    def __init__(self, kafka_brokers: List[str], topic: str):
        self.consumer = KafkaConsumer(
            topic,
            bootstrap_servers=kafka_brokers,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            group_id='correlation-processor',
            auto_offset_reset='latest',
            max_poll_records=1000,
            session_timeout_ms=30000,
            heartbeat_interval_ms=10000
        )
        self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=10)

    def process_events(self):
        """Process events from Kafka stream"""
        batch = []
        batch_size = 100

        for message in self.consumer:
            batch.append(message.value)

            if len(batch) >= batch_size:
                # Process batch asynchronously
                self.thread_pool.submit(self._process_batch, batch.copy())
                batch.clear()

    def _process_batch(self, events: List[Dict]):
        """Process a batch of events"""
        # Normalize events
        normalized_events = [self._normalize_event(event) for event in events]

        # Store in database
        self._store_events(normalized_events)

        # Apply correlation rules
        self._apply_correlation_rules(normalized_events)

    def _normalize_event(self, event: Dict) -> Dict:
        """Normalize event data"""
        # Event normalization logic
        pass

    def _store_events(self, events: List[Dict]):
        """Bulk insert events to database"""
        # Bulk database insertion
        pass

    def _apply_correlation_rules(self, events: List[Dict]):
        """Apply correlation rules to events"""
        # Correlation logic
        pass
```

## Security Considerations

### Data Protection

```python
# Encryption for sensitive data
from cryptography.fernet import Fernet
import base64
import os

class DataEncryption:
    def __init__(self):
        # Generate or load encryption key
        self.key = self._get_or_create_key()
        self.cipher_suite = Fernet(self.key)

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data before storing"""
        encrypted_data = self.cipher_suite.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data when retrieving"""
        encrypted_bytes = base64.b64decode(encrypted_data.encode())
        decrypted_data = self.cipher_suite.decrypt(encrypted_bytes)
        return decrypted_data.decode()

    def _get_or_create_key(self) -> bytes:
        """Get encryption key from environment or generate new one"""
        key_env = os.environ.get('ENCRYPTION_KEY')
        if key_env:
            return base64.b64decode(key_env.encode())
        else:
            # Generate new key (store securely)
            return Fernet.generate_key()
```

### Access Control

```python
# Role-based access control
from functools import wraps
from flask import request, jsonify, g
import jwt

def require_permission(permission: str):
    """Decorator to check user permissions"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')

            try:
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user_permissions = payload.get('permissions', [])

                if permission not in user_permissions:
                    return jsonify({'error': 'Insufficient permissions'}), 403

                g.current_user = payload
                return f(*args, **kwargs)

            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401

        return decorated_function
    return decorator

# Usage example
@app.route('/api/correlations', methods=['GET'])
@require_permission('view_correlations')
def get_correlations():
    """Get correlation data with permission check"""
    return jsonify(correlations)
```

### Audit Logging

```python
# Comprehensive audit logging
import logging
import json
from datetime import datetime
from flask import request, g

class AuditLogger:
    def __init__(self):
        self.logger = logging.getLogger('audit')
        handler = logging.FileHandler('/var/log/security-correlation/audit.log')
        formatter = logging.Formatter('%(asctime)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_access(self, resource: str, action: str, result: str):
        """Log access attempts"""
        audit_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': getattr(g, 'current_user', {}).get('user_id'),
            'username': getattr(g, 'current_user', {}).get('username'),
            'resource': resource,
            'action': action,
            'result': result,
            'ip_address': request.remote_addr,
            'user_agent': request.user_agent.string
        }

        self.logger.info(json.dumps(audit_record))

    def log_data_access(self, table: str, operation: str, record_count: int):
        """Log database access"""
        audit_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': getattr(g, 'current_user', {}).get('user_id'),
            'operation_type': 'database_access',
            'table': table,
            'operation': operation,
            'record_count': record_count
        }

        self.logger.info(json.dumps(audit_record))
```

## Conclusion

Building an effective security correlation system requires careful consideration of architecture, database design, deployment strategies, and security measures. The patterns and implementations provided in this guide offer a solid foundation for creating scalable, secure, and efficient correlation platforms.

Key takeaways:

- Design for scalability from the beginning
- Implement proper data modeling for security events
- Use appropriate deployment patterns for your environment
- Prioritize security and audit capabilities
- Optimize for performance at the database and application levels
- Plan for monitoring and observability

By following these architectural patterns and best practices, organizations can build robust security correlation systems that effectively detect, analyze, and respond to security threats in real-time.
