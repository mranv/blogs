---
author: Anubhav Gain
pubDatetime: 2025-01-28T15:30:00+05:30
modDatetime: 2025-06-28T15:30:00+05:30
title: Wazuh Agent Status to NATS Integration - Rust POC
slug: wazuh-agent-status-monitor-rust
featured: false
draft: false
tags:
  - wazuh
  - rust
  - nats
  - monitoring
  - xdr
  - security
  - real-time
category: Security
description: Rust-based service that monitors Wazuh agent status changes and publishes them to NATS for real-time security event distribution across XDR/OXDR platforms.
---

# Wazuh Agent Status to NATS Integration - POC Document

## Overview

Create a Rust-based service that monitors Wazuh agent status changes and publishes them to NATS for real-time security event distribution across XDR/OXDR platforms.

## Technical Objectives

- **Real-time Monitoring**: Detect agent status changes (Active/Disconnected/Never Connected)
- **Message Publishing**: Send structured events to NATS subjects
- **Security First**: Implement proper authentication, encryption, and error handling
- **Performance**: Handle high-throughput environments with minimal latency
- **Reliability**: Ensure message delivery with appropriate retry mechanisms

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wazuh Manager │    │   Rust Service  │    │   NATS Server   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ global.db   │─┼────┼─│ DB Monitor  │ │    │ │ Subjects    │ │
│ │ client.keys │ │    │ │ Status Diff │ │    │ │ - agent.*   │ │
│ └─────────────┘ │    │ │ NATS Client │─┼────┼─│ - security.*│ │
│                 │    │ └─────────────┘ │    │ └─────────────┘ │
│ /var/ossec/     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technical Requirements

### Core Dependencies (Rust)

```toml
[dependencies]
# NATS client
async-nats = "0.35"

# Database access
rusqlite = { version = "0.31", features = ["bundled"] }
tokio-rusqlite = "0.5"

# Async runtime
tokio = { version = "1.0", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# Configuration
config = "0.14"
clap = { version = "4.0", features = ["derive"] }

# File system monitoring
notify = "6.0"

# Cryptography (for message integrity)
ring = "0.17"
base64 = "0.22"

# Time handling
chrono = { version = "0.4", features = ["serde"] }
```

## Data Models

### Agent Status Event Structure

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStatusEvent {
    pub agent_id: String,
    pub agent_name: String,
    pub previous_status: AgentStatus,
    pub current_status: AgentStatus,
    pub ip_address: Option<String>,
    pub last_keepalive: Option<DateTime<Utc>>,
    pub manager_node: String,
    pub timestamp: DateTime<Utc>,
    pub event_id: String,
    pub signature: Option<String>, // For integrity verification
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentStatus {
    Active,
    Disconnected,
    NeverConnected,
    Pending,
    Unknown,
}
```

## Implementation Components

### 1. Database Monitor (src/database/monitor.rs)

```rust
pub struct WazuhDbMonitor {
    db_path: PathBuf,
    poll_interval: Duration,
    last_check: HashMap<String, AgentStatusSnapshot>,
}

impl WazuhDbMonitor {
    pub async fn new(db_path: impl Into<PathBuf>) -> Result<Self>;
    pub async fn start_monitoring(&mut self) -> Result<Receiver<AgentStatusEvent>>;
    pub async fn get_current_agents(&self) -> Result<Vec<AgentInfo>>;
    pub async fn detect_changes(&mut self) -> Result<Vec<AgentStatusEvent>>;
}
```

Key Implementation Points:

- Query `/var/ossec/queue/db/global.db` for agent table
- Implement SQLite row-level change detection
- Handle database locks and connection pooling
- Monitor for new agent registrations

### 2. NATS Publisher (src/nats/publisher.rs)

```rust
pub struct NatsPublisher {
    client: async_nats::Client,
    subject_prefix: String,
    encryption_key: Option<Vec<u8>>,
}

impl NatsPublisher {
    pub async fn new(config: NatsConfig) -> Result<Self>;
    pub async fn publish_agent_event(&self, event: &AgentStatusEvent) -> Result<()>;
    pub async fn publish_batch(&self, events: Vec<AgentStatusEvent>) -> Result<()>;
    pub fn create_subject(&self, agent_id: &str, event_type: &str) -> String;
}
```

NATS Subject Structure:

- `wazuh.agent.{agent_id}.status` - Individual agent status changes
- `wazuh.agent.{agent_id}.connected` - Agent connection events
- `wazuh.agent.{agent_id}.disconnected` - Agent disconnection events
- `wazuh.security.agent_events` - Aggregated security events
- `wazuh.manager.{node_id}.heartbeat` - Manager health status

### 3. Configuration Management (src/config/mod.rs)

```rust
#[derive(Debug, Deserialize)]
pub struct Config {
    pub wazuh: WazuhConfig,
    pub nats: NatsConfig,
    pub security: SecurityConfig,
    pub monitoring: MonitoringConfig,
}

#[derive(Debug, Deserialize)]
pub struct NatsConfig {
    pub url: String,
    pub credentials_file: Option<PathBuf>,
    pub tls_cert: Option<PathBuf>,
    pub tls_key: Option<PathBuf>,
    pub subject_prefix: String,
    pub max_reconnects: usize,
    pub reconnect_delay: Duration,
}
```

### 4. Security Implementation (src/security/mod.rs)

```rust
pub struct MessageSigner {
    private_key: Vec<u8>,
}

impl MessageSigner {
    pub fn new(key_path: impl AsRef<Path>) -> Result<Self>;
    pub fn sign_message(&self, message: &str) -> Result<String>;
    pub fn verify_signature(&self, message: &str, signature: &str) -> Result<bool>;
}

pub struct EncryptionHandler {
    key: Vec<u8>,
}

impl EncryptionHandler {
    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>>;
    pub fn decrypt(&self, encrypted_data: &[u8]) -> Result<Vec<u8>>;
}
```

## Core Implementation Tasks

### Phase 1: Database Integration (3-4 hours)

1. **SQLite Connection Management**
   - Implement connection pooling for `/var/ossec/queue/db/global.db`
   - Handle database locks and read-only access
   - Create agent status query functions

2. **Change Detection Algorithm**
   - Implement efficient diff mechanism for agent status
   - Handle agent registration/deregistration events
   - Create timestamp-based change tracking

### Phase 2: NATS Integration (2-3 hours)

1. **NATS Client Setup**
   - Configure connection with authentication (JWT/NKeys)
   - Implement TLS encryption for transport security
   - Handle connection failures and auto-reconnection

2. **Message Publishing**
   - Design subject hierarchy for different event types
   - Implement message serialization (JSON/Protocol Buffers)
   - Add message deduplication mechanisms

### Phase 3: Security & Reliability (2-3 hours)

1. **Message Integrity**
   - Implement HMAC signing for message authenticity
   - Add optional message encryption for sensitive data
   - Create message versioning scheme

2. **Error Handling & Resilience**
   - Implement exponential backoff for retries
   - Add circuit breaker for external dependencies
   - Create comprehensive logging and metrics

### Phase 4: Testing & Documentation (1-2 hours)

1. **Unit Tests**
   - Mock SQLite database interactions
   - Test NATS message publishing scenarios
   - Validate security implementations

2. **Integration Tests**
   - Test with actual Wazuh manager setup
   - Verify NATS message delivery
   - Performance testing under load

## Configuration Example

```yaml
# config/app.yaml
wazuh:
  db_path: "/var/ossec/queue/db/global.db"
  poll_interval: "5s"
  manager_node: "wazuh-manager-01"

nats:
  url: "nats://localhost:4222"
  credentials_file: "/etc/wazuh-nats/nats.creds"
  tls_cert: "/etc/wazuh-nats/client.crt"
  tls_key: "/etc/wazuh-nats/client.key"
  subject_prefix: "wazuh"
  max_reconnects: 10
  reconnect_delay: "2s"

security:
  signing_key_path: "/etc/wazuh-nats/signing.key"
  encrypt_messages: true
  encryption_key_path: "/etc/wazuh-nats/encryption.key"

monitoring:
  enable_metrics: true
  metrics_port: 9090
  log_level: "info"
```

## NATS Message Examples

### Agent Status Change Event

```json
{
  "agent_id": "001",
  "agent_name": "web-server-01",
  "previous_status": "Active",
  "current_status": "Disconnected",
  "ip_address": "192.168.1.100",
  "last_keepalive": "2025-05-28T10:30:45Z",
  "manager_node": "wazuh-manager-01",
  "timestamp": "2025-05-28T10:35:00Z",
  "event_id": "evt_001_1716897300_status_change",
  "signature": "abc123def456..."
}
```

### Batch Status Update

```json
{
  "batch_id": "batch_1716897300",
  "manager_node": "wazuh-manager-01",
  "timestamp": "2025-05-28T10:35:00Z",
  "events": [
    {
      /* individual agent events */
    }
  ],
  "summary": {
    "total_agents": 150,
    "active_agents": 145,
    "disconnected_agents": 5,
    "changes_detected": 3
  }
}
```

## Deployment Considerations

### Security Requirements

- **Filesystem Permissions**: Read access to Wazuh databases
- **Network Security**: TLS encryption for NATS connections
- **Authentication**: NATS JWT/NKeys or credentials file
- **Message Integrity**: HMAC signatures for all published events

### Performance Targets

- **Latency**: < 100ms from status change to NATS publish
- **Throughput**: Handle 1000+ agents with 5-second polling
- **Resource Usage**: < 50MB memory, < 1% CPU under normal load
- **Reliability**: 99.9% message delivery success rate

### Monitoring & Observability

- **Metrics**: Agent count, message publish rate, error rates
- **Logging**: Structured logs with correlation IDs
- **Health Checks**: Database connectivity, NATS connection status
- **Alerting**: Failed message delivery, database connection issues

## Evaluation Criteria

### Technical Implementation (40%)

- Code quality and Rust best practices
- Proper error handling and edge cases
- Security implementation completeness
- Performance and resource efficiency

### Architecture & Design (30%)

- System design and component separation
- Scalability considerations
- Security architecture decisions
- Database integration approach

### Testing & Documentation (20%)

- Unit and integration test coverage
- Code documentation quality
- Configuration examples and setup guides
- Error handling scenarios

### Security & Reliability (10%)

- Message integrity implementation
- Connection security measures
- Failure recovery mechanisms
- Input validation and sanitization

## Bonus Challenges

### Advanced Features (Optional)

- Implement message compression for high-throughput scenarios
- Add support for multiple Wazuh manager nodes
- Create a web dashboard for monitoring service health

### Security Enhancements (Optional)

- Implement message rate limiting per agent
- Add anomaly detection for unusual status patterns
- Create audit logging for all published events

### Operational Excellence (Optional)

- Add Prometheus metrics endpoint
- Implement graceful shutdown with message queue draining
- Create Docker containerization with security hardening

## Expected Deliverables

1. **Source Code**: Complete Rust implementation with proper project structure
2. **Configuration**: Example configuration files and environment setup
3. **Documentation**: README with setup instructions and API documentation
4. **Tests**: Unit and integration tests with coverage report
5. **Demo**: Working demonstration with sample NATS subscribers

**Estimated Timeline**: 8-12 hours for complete implementation  
**Skill Level**: Intermediate to Advanced Rust developer with systems programming experience
