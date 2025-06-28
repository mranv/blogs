---
author: Anubhav Gain
pubDatetime: 2025-06-28T15:00:00+05:30
modDatetime: 2025-06-28T15:00:00+05:30
title: Wazuh Core Integration with NATS - C/C++ POC Implementation
slug: wazuh-core-nats-integration-c
featured: false
draft: false
tags:
  - wazuh
  - nats
  - c
  - cpp
  - integration
  - xdr
  - security
  - monitoring
description: Integrate NATS messaging capabilities directly into Wazuh manager codebase to publish real-time agent status events and security alerts for XDR/OXDR platforms.
---

# Wazuh Core Integration with NATS - POC Document

## Overview

Integrate NATS messaging capabilities directly into the Wazuh manager codebase to publish real-time agent status events and security alerts. This involves modifying core Wazuh daemons (remoted, wazuh-db) to publish events to NATS subjects for XDR/OXDR platform integration.

## Technical Objectives

- **Core Integration**: Modify Wazuh's C/C++ codebase to include NATS publishing
- **Real-time Events**: Publish agent status changes directly from remoted daemon
- **Security-First**: Maintain Wazuh's security model while adding messaging capabilities
- **Performance**: Zero impact on existing Wazuh operations
- **Configuration**: Seamless integration with existing ossec.conf structure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Wazuh Manager                            │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ wazuh-remoted│    │  wazuh-db   │    │ wazuh-analysisd  │
│  │             │    │             │    │             │     │
│  │ ┌─────────┐ │    │ ┌─────────┐ │    │ ┌─────────┐ │     │
│  │ │ Agent   │ │    │ │ Status  │ │    │ │ Rule    │ │     │
│  │ │ Connect │─┼────┼─│ Update  │ │    │ │ Engine  │ │     │
│  │ │ Handler │ │    │ │ Handler │ │    │ │         │ │     │
│  │ └─────────┘ │    │ └─────────┘ │    │ └─────────┘ │     │
│  │      │      │    │      │      │    │      │      │     │
│  └──────┼──────┘    └──────┼──────┘    └──────┼──────┘     │
│         │                  │                  │            │
│  ┌──────▼──────────────────▼──────────────────▼──────┐     │
│  │            NATS Integration Layer             │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│     │
│  │  │ Connection  │  │ Message     │  │ Config      ││     │
│  │  │ Manager     │  │ Publisher   │  │ Parser      ││     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘│     │
│  └─────────────────────┼─────────────────────────────┘     │
└────────────────────────┼─────────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │     NATS Server         │
            │                         │
            │ ┌─────────────────────┐ │
            │ │ wazuh.agent.*       │ │
            │ │ wazuh.security.*    │ │
            │ │ wazuh.alerts.*      │ │
            │ └─────────────────────┘ │
            └─────────────────────────┘
```

## Core Integration Points

### 1. Modified Components in Wazuh Source

#### src/remoted/remoted.c - Agent Connection Handler

```c
// New NATS integration headers
#include "nats_integration.h"
#include "agent_events.h"

// Modified function: handle_agent_connection()
int handle_agent_connection(agent *ag, char *msg) {
    int result = 0;
    agent_status_t previous_status = ag->status;

    // Existing Wazuh logic
    result = process_agent_message(ag, msg);

    // NEW: NATS integration
    if (nats_config.enabled && ag->status != previous_status) {
        agent_status_event_t event = {
            .agent_id = ag->id,
            .agent_name = ag->name,
            .previous_status = previous_status,
            .current_status = ag->status,
            .ip_address = ag->ip,
            .timestamp = time(NULL),
            .manager_node = Config.node_name
        };

        nats_publish_agent_status(&event);
    }

    return result;
}
```

#### src/wazuh_db/wdb.c - Database Status Updates

```c
// Modified function: wdb_update_agent_keepalive()
int wdb_update_agent_keepalive(int agent_id, agent_cs_t status,
                              const char *sync_status, int *sock) {
    int result = 0;
    agent_cs_t previous_status = AGENT_CS_UNKNOWN;

    // Get previous status before update
    previous_status = wdb_get_agent_status(agent_id);

    // Existing Wazuh database update logic
    result = wdb_execute_agent_keepalive_update(agent_id, status, sync_status, sock);

    // NEW: NATS integration for database-level status changes
    if (nats_config.enabled && result == 0 && previous_status != status) {
        db_status_event_t event = {
            .agent_id = agent_id,
            .previous_status = previous_status,
            .current_status = status,
            .sync_status = sync_status,
            .timestamp = time(NULL),
            .source = "wazuh-db"
        };

        nats_publish_db_status(&event);
    }

    return result;
}
```

### 2. New NATS Integration Module

#### src/nats_integration/nats_client.h

```c
#ifndef NATS_CLIENT_H
#define NATS_CLIENT_H

#include "shared.h"
#include "nats/nats.h"

typedef struct {
    bool enabled;
    char *server_url;
    char *credentials_file;
    char *subject_prefix;
    char *tls_cert;
    char *tls_key;
    int max_reconnects;
    int reconnect_delay;
    bool encrypt_messages;
    char *encryption_key;
} nats_config_t;

typedef struct {
    char agent_id[16];
    char agent_name[256];
    agent_cs_t previous_status;
    agent_cs_t current_status;
    char ip_address[46];
    time_t timestamp;
    char manager_node[256];
    char event_id[64];
} agent_status_event_t;

// Function declarations
int nats_init(const nats_config_t *config);
int nats_cleanup(void);
int nats_publish_agent_status(const agent_status_event_t *event);
int nats_publish_security_alert(const alert_data_t *alert);
int nats_publish_raw_message(const char *subject, const char *data);
bool nats_is_connected(void);

#endif /* NATS_CLIENT_H */
```

#### src/nats_integration/nats_client.c

```c
#include "nats_client.h"
#include "cJSON.h"

static natsConnection *nats_conn = NULL;
static nats_config_t nats_config;
static pthread_mutex_t nats_mutex = PTHREAD_MUTEX_INITIALIZER;

int nats_init(const nats_config_t *config) {
    natsStatus status = NATS_OK;
    natsOptions *opts = NULL;

    if (!config || !config->enabled) {
        return 0; // NATS disabled
    }

    memcpy(&nats_config, config, sizeof(nats_config_t));

    // Create NATS options
    status = natsOptions_Create(&opts);
    if (status != NATS_OK) {
        merror("Failed to create NATS options: %s", natsStatus_GetText(status));
        return -1;
    }

    // Configure TLS if specified
    if (nats_config.tls_cert && nats_config.tls_key) {
        status = natsOptions_SetSecure(opts, true);
        if (status == NATS_OK) {
            status = natsOptions_LoadCertificatesChain(opts,
                nats_config.tls_cert, nats_config.tls_key);
        }
    }

    // Configure credentials if specified
    if (nats_config.credentials_file) {
        status = natsOptions_SetUserCredentialsFromFiles(opts,
            nats_config.credentials_file, NULL);
    }

    // Set reconnection parameters
    natsOptions_SetMaxReconnect(opts, nats_config.max_reconnects);
    natsOptions_SetReconnectWait(opts, nats_config.reconnect_delay * 1000);

    // Connect to NATS
    status = natsConnection_Connect(&nats_conn, opts);
    if (status != NATS_OK) {
        merror("Failed to connect to NATS: %s", natsStatus_GetText(status));
        natsOptions_Destroy(opts);
        return -1;
    }

    natsOptions_Destroy(opts);
    minfo("NATS integration initialized successfully");
    return 0;
}

int nats_publish_agent_status(const agent_status_event_t *event) {
    if (!nats_conn || !event) {
        return -1;
    }

    pthread_mutex_lock(&nats_mutex);

    // Create JSON message
    cJSON *json = cJSON_CreateObject();
    cJSON *agent_id = cJSON_CreateString(event->agent_id);
    cJSON *agent_name = cJSON_CreateString(event->agent_name);
    cJSON *prev_status = cJSON_CreateNumber(event->previous_status);
    cJSON *curr_status = cJSON_CreateNumber(event->current_status);
    cJSON *ip_addr = cJSON_CreateString(event->ip_address);
    cJSON *timestamp = cJSON_CreateNumber(event->timestamp);
    cJSON *manager = cJSON_CreateString(event->manager_node);

    cJSON_AddItemToObject(json, "agent_id", agent_id);
    cJSON_AddItemToObject(json, "agent_name", agent_name);
    cJSON_AddItemToObject(json, "previous_status", prev_status);
    cJSON_AddItemToObject(json, "current_status", curr_status);
    cJSON_AddItemToObject(json, "ip_address", ip_addr);
    cJSON_AddItemToObject(json, "timestamp", timestamp);
    cJSON_AddItemToObject(json, "manager_node", manager);

    char *json_string = cJSON_Print(json);

    // Create subject
    char subject[512];
    snprintf(subject, sizeof(subject), "%s.agent.%s.status",
             nats_config.subject_prefix, event->agent_id);

    // Publish message
    natsStatus status = natsConnection_Publish(nats_conn, subject,
                                             json_string, strlen(json_string));

    // Cleanup
    free(json_string);
    cJSON_Delete(json);
    pthread_mutex_unlock(&nats_mutex);

    if (status != NATS_OK) {
        merror("Failed to publish NATS message: %s", natsStatus_GetText(status));
        return -1;
    }

    return 0;
}
```

### 3. Configuration Integration

#### src/config/nats-config.c

```c
#include "nats_client.h"
#include "config.h"

int Read_NATS(XML_NODE node, void *configp, __attribute__((unused)) void *mailp) {
    nats_config_t *nats_config = (nats_config_t *)configp;

    // Initialize defaults
    nats_config->enabled = false;
    nats_config->max_reconnects = 10;
    nats_config->reconnect_delay = 2;
    nats_config->encrypt_messages = false;

    if (!node) {
        return 0;
    }

    for (int i = 0; node[i]; i++) {
        if (!node[i]->element) {
            merror(XML_ELEMNULL);
            return OS_INVALID;
        } else if (!node[i]->content) {
            merror(XML_VALUENULL, node[i]->element);
            return OS_INVALID;
        }

        if (strcmp(node[i]->element, "enabled") == 0) {
            nats_config->enabled = (strcmp(node[i]->content, "yes") == 0);
        } else if (strcmp(node[i]->element, "server_url") == 0) {
            os_strdup(node[i]->content, nats_config->server_url);
        } else if (strcmp(node[i]->element, "credentials_file") == 0) {
            os_strdup(node[i]->content, nats_config->credentials_file);
        } else if (strcmp(node[i]->element, "subject_prefix") == 0) {
            os_strdup(node[i]->content, nats_config->subject_prefix);
        } else if (strcmp(node[i]->element, "tls_cert") == 0) {
            os_strdup(node[i]->content, nats_config->tls_cert);
        } else if (strcmp(node[i]->element, "tls_key") == 0) {
            os_strdup(node[i]->content, nats_config->tls_key);
        } else if (strcmp(node[i]->element, "max_reconnects") == 0) {
            nats_config->max_reconnects = atoi(node[i]->content);
        } else if (strcmp(node[i]->element, "reconnect_delay") == 0) {
            nats_config->reconnect_delay = atoi(node[i]->content);
        } else if (strcmp(node[i]->element, "encrypt_messages") == 0) {
            nats_config->encrypt_messages = (strcmp(node[i]->content, "yes") == 0);
        } else {
            merror(XML_INVELEM, node[i]->element);
            return OS_INVALID;
        }
    }

    return 0;
}
```

## Implementation Tasks

### Phase 1: Core Integration Setup (4-5 hours)

1. **Build System Integration**

   - Modify src/Makefile to include NATS client library
   - Add NATS library dependencies to configure scripts
   - Update CMake/autotools configuration

2. **Header Integration**
   - Add NATS headers to appropriate Wazuh components
   - Create new NATS integration module structure
   - Update shared.h with NATS-related definitions

### Phase 2: Core Daemon Modifications (5-6 hours)

1. **remoted Daemon Changes**

   - Modify agent connection handling functions
   - Add NATS publishing calls at key decision points
   - Implement connection state change detection

2. **wazuh-db Integration**
   - Modify database update functions
   - Add status change detection logic
   - Implement database-level event publishing

### Phase 3: Configuration & Security (3-4 hours)

1. **Configuration Parser**

   - Extend ossec.conf XML parser for NATS section
   - Add configuration validation
   - Implement secure credential handling

2. **Security Implementation**
   - Add TLS support for NATS connections
   - Implement message encryption (optional)
   - Add connection authentication

### Phase 4: Testing & Integration (2-3 hours)

1. **Unit Testing**

   - Create tests for NATS integration functions
   - Test configuration parsing
   - Validate message formatting

2. **Integration Testing**
   - Test with real NATS server
   - Verify no performance impact on Wazuh
   - Test failover scenarios

## Modified Build Configuration

### src/Makefile additions:

```makefile
# NATS Integration
NATS_CFLAGS = -I/usr/local/include/nats
NATS_LDFLAGS = -L/usr/local/lib -lnats -lcJSON

# Add to existing CFLAGS
CFLAGS += $(NATS_CFLAGS)
LDFLAGS += $(NATS_LDFLAGS)

# New object files
NATS_OBJS = nats_integration/nats_client.o \
           nats_integration/nats_config.o \
           nats_integration/message_formatter.o

# Add to daemon builds
wazuh-remoted: $(REMOTED_OBJS) $(NATS_OBJS)
    $(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

wazuh-db: $(DB_OBJS) $(NATS_OBJS)
    $(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
```

## Configuration Example

### ossec.conf additions:

```xml
<ossec_config>
  <!-- Existing Wazuh configuration -->

  <!-- NEW: NATS Integration -->
  <nats>
    <enabled>yes</enabled>
    <server_url>nats://nats-server:4222</server_url>
    <credentials_file>/var/ossec/etc/nats.creds</credentials_file>
    <subject_prefix>wazuh</subject_prefix>
    <tls_cert>/var/ossec/etc/nats-client.crt</tls_cert>
    <tls_key>/var/ossec/etc/nats-client.key</tls_key>
    <max_reconnects>10</max_reconnects>
    <reconnect_delay>2</reconnect_delay>
    <encrypt_messages>no</encrypt_messages>
  </nats>
</ossec_config>
```

## NATS Message Examples

### Agent Status Change

Subject: `wazuh.agent.001.status`

```json
{
  "agent_id": "001",
  "agent_name": "web-server-01",
  "previous_status": 1,
  "current_status": 0,
  "ip_address": "192.168.1.100",
  "timestamp": 1716897300,
  "manager_node": "wazuh-manager-01",
  "event_type": "status_change",
  "source": "remoted"
}
```

### Security Alert

Subject: `wazuh.security.alerts.high`

```json
{
  "rule_id": 5502,
  "agent_id": "001",
  "agent_name": "web-server-01",
  "level": 10,
  "description": "Login session opened",
  "timestamp": 1716897300,
  "source_ip": "192.168.1.50",
  "user": "admin",
  "manager_node": "wazuh-manager-01"
}
```

## Evaluation Criteria

### Core Integration Skills (50%)

- **C/C++ Proficiency**: Clean integration with existing Wazuh codebase
- **Build System**: Proper Makefile/CMake modifications
- **Memory Management**: No memory leaks or buffer overflows
- **Thread Safety**: Proper mutex usage for concurrent access

### Security Implementation (25%)

- **TLS Integration**: Proper certificate handling
- **Authentication**: Secure credential management
- **Input Validation**: Sanitization of all user inputs
- **Error Handling**: Graceful failure modes

### System Integration (15%)

- **Configuration**: Seamless ossec.conf integration
- **Performance**: Zero impact on existing Wazuh operations
- **Compatibility**: Works with existing Wazuh installations
- **Documentation**: Clear code comments and integration guides

### Testing & Quality (10%)

- **Unit Tests**: Comprehensive test coverage
- **Integration Tests**: Real-world scenario testing
- **Code Quality**: Follows Wazuh coding standards
- **Error Scenarios**: Handles network failures gracefully

## Technical Challenges

### High-Priority Issues

- **Thread Safety**: NATS publishing from multiple daemon threads
- **Performance Impact**: Ensure zero latency impact on agent processing
- **Memory Management**: Proper cleanup of NATS resources
- **Configuration Validation**: Robust error handling for invalid configs

### Advanced Challenges

- **Message Batching**: Aggregate multiple events for efficiency
- **Failover Logic**: Handle NATS server disconnections
- **Message Persistence**: Queue messages during NATS downtime
- **Monitoring Integration**: Add metrics for NATS operations

## Deliverables

1. **Modified Source Code**

   - Updated remoted daemon with NATS integration
   - Modified wazuh-db with status publishing
   - New NATS integration module
   - Updated build configuration

2. **Configuration Files**

   - Extended ossec.conf schema
   - Example configuration files
   - Security credential templates

3. **Documentation**

   - Integration guide for developers
   - Configuration reference
   - Troubleshooting guide

4. **Testing Suite**
   - Unit tests for NATS functions
   - Integration tests with NATS server
   - Performance benchmarks

**Estimated Timeline**: 14-18 hours for complete implementation  
**Skill Level**: Advanced C/C++ developer with systems programming and security experience  
**Prerequisites**: Deep understanding of Wazuh architecture, NATS protocol, and XDR/OXDR platforms
