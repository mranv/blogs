---
author: Anubhav Gain
pubDatetime: 2025-06-28T14:30:00+05:30
modDatetime: 2025-06-28T14:30:00+05:30
title: Wazuh Manager-Side Keep-Alive Integration with NATS
slug: wazuh-manager-nats-keepalive-integration
featured: false
draft: false
tags:
  - wazuh
  - nats
  - xdr
  - monitoring
  - security
  - keepalive
  - integration
description: Modify Wazuh manager to send remote keep-alive messages and publish agent status events to NATS for XDR/OXDR platform integration with real-time monitoring.
---

# Wazuh Manager-Side Keep-Alive Integration with NATS

## Overview

Modify only the Wazuh manager to send remote keep-alive messages and publish agent status events to NATS. This approach maintains centralized control while enabling XDR/OXDR platform integration through real-time agent status monitoring.

## Security Architecture Principles

- **Centralized Control**: All keep-alive logic remains on the manager
- **Minimal Attack Surface**: No agent-side modifications reduce potential vulnerabilities
- **Authenticated Messaging**: Secure NATS communication channels
- **Audit Trail**: Complete logging of keep-alive activities

## Technical Approach

### Core Manager-Side Changes

Modified Component: `src/remoted/remoted.c`

```c
#include "nats_integration.h"
#include "agent_keepalive.h"

// Enhanced agent keep-alive management
typedef struct {
    int agent_id;
    char agent_name[OS_MAXSTR];
    char ip_address[IPSIZE];
    time_t last_keepalive;
    time_t next_keepalive;
    agent_cs_t status;
    int keepalive_interval;
    int missed_keepalives;
    bool nats_notification_sent;
} manager_agent_t;

// Manager-initiated keep-alive function
int manager_send_keepalive(manager_agent_t *agent) {
    char keepalive_msg[OS_MAXSTR];
    time_t current_time = time(NULL);

    // Create keep-alive message
    snprintf(keepalive_msg, sizeof(keepalive_msg),
             "#!-agent keepalive %s %ld", agent->agent_name, current_time);

    // Send keep-alive to agent
    int result = send_message_to_agent(agent->agent_id, keepalive_msg);

    if (result == 0) {
        agent->next_keepalive = current_time + agent->keepalive_interval;

        // Publish to NATS for XDR monitoring
        if (nats_config.enabled) {
            keepalive_event_t event = {
                .agent_id = agent->agent_id,
                .agent_name = agent->agent_name,
                .ip_address = agent->ip_address,
                .timestamp = current_time,
                .event_type = "keepalive_sent",
                .manager_node = Config.node_name,
                .interval = agent->keepalive_interval
            };

            nats_publish_keepalive_event(&event);
        }

        mdebug2("Keep-alive sent to agent %s (%d)",
                agent->agent_name, agent->agent_id);
    } else {
        // Handle failed keep-alive
        agent->missed_keepalives++;
        handle_keepalive_failure(agent);
    }

    return result;
}

// Enhanced agent status monitoring
void monitor_agent_status(manager_agent_t *agent) {
    time_t current_time = time(NULL);
    agent_cs_t previous_status = agent->status;

    // Check if keep-alive is overdue
    if (current_time > agent->next_keepalive + KEEPALIVE_TIMEOUT) {
        agent->status = AGENT_CS_DISCONNECTED;
        agent->missed_keepalives++;

        // Trigger status change notification
        if (previous_status != agent->status) {
            agent_status_change_event_t event = {
                .agent_id = agent->agent_id,
                .agent_name = agent->agent_name,
                .previous_status = previous_status,
                .current_status = agent->status,
                .ip_address = agent->ip_address,
                .timestamp = current_time,
                .reason = "keepalive_timeout",
                .missed_keepalives = agent->missed_keepalives
            };

            // Update database
            wdb_update_agent_status(agent->agent_id, agent->status);

            // Publish to NATS for XDR platform
            if (nats_config.enabled) {
                nats_publish_agent_status_change(&event);
            }

            mwarn("Agent %s (%d) marked as disconnected due to keep-alive timeout",
                  agent->agent_name, agent->agent_id);
        }
    }
}
```

### Manager Keep-Alive Scheduler

New Module: `src/remoted/keepalive_scheduler.c`

```c
#include "keepalive_scheduler.h"

static manager_agent_t *agent_list = NULL;
static pthread_mutex_t agent_list_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_t keepalive_thread;
static bool scheduler_running = false;

// Thread function for keep-alive management
void* keepalive_scheduler_thread(void *arg) {
    time_t current_time;
    manager_agent_t *current_agent;

    while (scheduler_running) {
        current_time = time(NULL);

        pthread_mutex_lock(&agent_list_mutex);

        for (current_agent = agent_list; current_agent; current_agent = current_agent->next) {
            // Check if it's time to send keep-alive
            if (current_time >= current_agent->next_keepalive) {
                manager_send_keepalive(current_agent);
            }

            // Monitor agent status
            monitor_agent_status(current_agent);
        }

        pthread_mutex_unlock(&agent_list_mutex);

        // Sleep for scheduler interval (default 30 seconds)
        sleep(KEEPALIVE_SCHEDULER_INTERVAL);
    }

    return NULL;
}

// Start the keep-alive scheduler
int start_keepalive_scheduler(void) {
    scheduler_running = true;

    if (pthread_create(&keepalive_thread, NULL, keepalive_scheduler_thread, NULL) != 0) {
        merror("Failed to create keep-alive scheduler thread");
        return -1;
    }

    minfo("Keep-alive scheduler started successfully");
    return 0;
}

// Add agent to scheduler
int add_agent_to_scheduler(int agent_id, const char *name, const char *ip) {
    manager_agent_t *new_agent = calloc(1, sizeof(manager_agent_t));
    if (!new_agent) {
        return -1;
    }

    new_agent->agent_id = agent_id;
    strncpy(new_agent->agent_name, name, sizeof(new_agent->agent_name) - 1);
    strncpy(new_agent->ip_address, ip, sizeof(new_agent->ip_address) - 1);
    new_agent->keepalive_interval = DEFAULT_KEEPALIVE_INTERVAL;
    new_agent->next_keepalive = time(NULL) + new_agent->keepalive_interval;
    new_agent->status = AGENT_CS_ACTIVE;
    new_agent->missed_keepalives = 0;

    pthread_mutex_lock(&agent_list_mutex);
    new_agent->next = agent_list;
    agent_list = new_agent;
    pthread_mutex_unlock(&agent_list_mutex);

    return 0;
}
```

### NATS Event Publishing

Enhanced Module: `src/nats_integration/keepalive_events.c`

```c
#include "keepalive_events.h"

int nats_publish_keepalive_event(const keepalive_event_t *event) {
    if (!nats_conn || !event) {
        return -1;
    }

    pthread_mutex_lock(&nats_mutex);

    // Create secure JSON message
    cJSON *json = cJSON_CreateObject();
    cJSON *event_data = cJSON_CreateObject();

    // Core event data
    cJSON_AddStringToObject(event_data, "agent_id", event->agent_id);
    cJSON_AddStringToObject(event_data, "agent_name", event->agent_name);
    cJSON_AddStringToObject(event_data, "ip_address", event->ip_address);
    cJSON_AddNumberToObject(event_data, "timestamp", event->timestamp);
    cJSON_AddStringToObject(event_data, "event_type", event->event_type);
    cJSON_AddStringToObject(event_data, "manager_node", event->manager_node);
    cJSON_AddNumberToObject(event_data, "interval", event->interval);

    // Security metadata
    cJSON *security_meta = cJSON_CreateObject();
    cJSON_AddStringToObject(security_meta, "source", "wazuh-manager");
    cJSON_AddStringToObject(security_meta, "version", __ossec_version);
    cJSON_AddNumberToObject(security_meta, "sequence", get_message_sequence());

    cJSON_AddItemToObject(json, "event", event_data);
    cJSON_AddItemToObject(json, "security", security_meta);

    char *json_string = cJSON_Print(json);

    // Create subject with security classification
    char subject[512];
    snprintf(subject, sizeof(subject), "%s.manager.keepalive.%s",
             nats_config.subject_prefix, event->agent_id);

    // Publish with error handling
    natsStatus status = natsConnection_Publish(nats_conn, subject,
                                             json_string, strlen(json_string));

    // Audit log for security compliance
    if (status == NATS_OK) {
        minfo("Keep-alive event published for agent %s", event->agent_name);
    } else {
        merror("Failed to publish keep-alive event for agent %s: %s",
               event->agent_name, natsStatus_GetText(status));
    }

    // Cleanup
    free(json_string);
    cJSON_Delete(json);
    pthread_mutex_unlock(&nats_mutex);

    return (status == NATS_OK) ? 0 : -1;
}

int nats_publish_agent_status_change(const agent_status_change_event_t *event) {
    if (!nats_conn || !event) {
        return -1;
    }

    // Security-focused status change notification
    cJSON *json = cJSON_CreateObject();
    cJSON *status_data = cJSON_CreateObject();

    cJSON_AddStringToObject(status_data, "agent_id", event->agent_id);
    cJSON_AddStringToObject(status_data, "agent_name", event->agent_name);
    cJSON_AddNumberToObject(status_data, "previous_status", event->previous_status);
    cJSON_AddNumberToObject(status_data, "current_status", event->current_status);
    cJSON_AddStringToObject(status_data, "ip_address", event->ip_address);
    cJSON_AddNumberToObject(status_data, "timestamp", event->timestamp);
    cJSON_AddStringToObject(status_data, "reason", event->reason);
    cJSON_AddNumberToObject(status_data, "missed_keepalives", event->missed_keepalives);

    // Security alert level based on status change
    int alert_level = calculate_alert_level(event->previous_status,
                                          event->current_status,
                                          event->missed_keepalives);
    cJSON_AddNumberToObject(status_data, "alert_level", alert_level);

    cJSON_AddItemToObject(json, "status_change", status_data);

    char *json_string = cJSON_Print(json);

    // Publish to both general and alert-specific subjects
    char subject[512];
    snprintf(subject, sizeof(subject), "%s.agent.%s.status_change",
             nats_config.subject_prefix, event->agent_id);

    natsStatus status = natsConnection_Publish(nats_conn, subject,
                                             json_string, strlen(json_string));

    // Also publish to alert stream if high severity
    if (alert_level >= HIGH_ALERT_THRESHOLD) {
        char alert_subject[512];
        snprintf(alert_subject, sizeof(alert_subject), "%s.alerts.agent_disconnected",
                 nats_config.subject_prefix);
        natsConnection_Publish(nats_conn, alert_subject, json_string, strlen(json_string));
    }

    free(json_string);
    cJSON_Delete(json);

    return (status == NATS_OK) ? 0 : -1;
}
```

## Configuration

### Manager Configuration (ossec.conf)

```xml
<ossec_config>
  <!-- Manager-side keep-alive configuration -->
  <remote>
    <connection>secure</connection>
    <port>1514</port>
    <protocol>tcp</protocol>

    <!-- New keep-alive settings -->
    <manager_keepalive>
      <enabled>yes</enabled>
      <interval>60</interval>  <!-- Send keep-alive every 60 seconds -->
      <timeout>180</timeout>   <!-- Consider agent dead after 180 seconds -->
      <max_missed>3</max_missed>
      <retry_interval>30</retry_interval>
    </manager_keepalive>
  </remote>

  <!-- NATS Integration for XDR Platform -->
  <nats>
    <enabled>yes</enabled>
    <server_url>nats://xdr-nats:4222</server_url>
    <credentials_file>/var/ossec/etc/nats.creds</credentials_file>
    <subject_prefix>wazuh.xdr</subject_prefix>
    <tls_cert>/var/ossec/etc/nats-client.crt</tls_cert>
    <tls_key>/var/ossec/etc/nats-client.key</tls_key>
    <max_reconnects>10</max_reconnects>
    <reconnect_delay>5</reconnect_delay>

    <!-- Security settings -->
    <encrypt_messages>yes</encrypt_messages>
    <message_signing>yes</message_signing>
    <audit_logging>yes</audit_logging>
  </nats>
</ossec_config>
```

## NATS Message Examples

### Keep-Alive Event

Subject: `wazuh.xdr.manager.keepalive.001`

```json
{
  "event": {
    "agent_id": "001",
    "agent_name": "web-server-01",
    "ip_address": "192.168.1.100",
    "timestamp": 1716897300,
    "event_type": "keepalive_sent",
    "manager_node": "wazuh-manager-01",
    "interval": 60
  },
  "security": {
    "source": "wazuh-manager",
    "version": "4.7.0",
    "sequence": 12345
  }
}
```

### Status Change Alert

Subject: `wazuh.xdr.agent.001.status_change`

```json
{
  "status_change": {
    "agent_id": "001",
    "agent_name": "web-server-01",
    "previous_status": 0,
    "current_status": 1,
    "ip_address": "192.168.1.100",
    "timestamp": 1716897360,
    "reason": "keepalive_timeout",
    "missed_keepalives": 3,
    "alert_level": 8
  }
}
```

## Security Considerations

### Threat Model

- **Manager Compromise**: Isolated NATS credentials and limited permissions
- **Network Interception**: TLS encryption for all NATS communications
- **Message Tampering**: Digital signatures on published messages
- **Replay Attacks**: Sequence numbers and timestamp validation

### Defensive Programming

- Input validation on all agent data
- Safe memory management for agent structures
- Thread-safe operations for concurrent access
- Graceful degradation when NATS is unavailable

### Audit Requirements

- Complete logging of keep-alive activities
- Failed connection attempt tracking
- NATS publishing success/failure logs
- Agent status change audit trail

## Implementation Priority

### Phase 1: Core Keep-Alive (4 hours)

- Modify remoted daemon for manager-initiated keep-alives
- Implement agent status monitoring
- Create keep-alive scheduler thread

### Phase 2: NATS Integration (3 hours)

- Add NATS publishing for keep-alive events
- Implement status change notifications
- Add security metadata to messages

### Phase 3: Security Hardening (2 hours)

- Implement TLS and authentication
- Add message signing and encryption
- Enable comprehensive audit logging

## Testing & Validation

### Security Tests

- TLS certificate validation
- Message encryption verification
- Authentication failure handling
- Network disconnection scenarios

### Performance Tests

- Keep-alive overhead measurement
- NATS publishing latency
- Memory usage with large agent counts
- Thread contention analysis

## Benefits for XDR/OXDR Platform

- **Real-time Visibility**: Immediate agent status updates
- **Centralized Control**: All logic on secure manager
- **Scalable Architecture**: NATS handles high message volumes
- **Security-First Design**: Built with threat modeling principles
- **Audit Compliance**: Complete activity logging
