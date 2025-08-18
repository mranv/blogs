---
title: "Orchestrating Wazuh Active Response with NATS: Real-Time Threat Mitigation"
published: 2025-01-19
description: "Build a distributed active response orchestration system for Wazuh using NATS, enabling coordinated threat response across entire infrastructures in milliseconds"
tags: ["Wazuh", "NATS", "Active Response", "SOAR", "Orchestration", "Incident Response", "Automation", "Threat Mitigation"]
category: Security
draft: false
---

## Introduction

Traditional Wazuh active response operates in isolation on individual agents, lacking coordination and global threat visibility. By integrating NATS as an orchestration layer, we can transform active response into a distributed, intelligent system capable of coordinated threat mitigation across entire infrastructures in real-time.

## Architecture Overview

### Evolution from Local to Orchestrated Response

**Traditional Active Response:**
```
Alert → Local Agent → Local Action → Isolated Mitigation
```

**NATS-Orchestrated Response:**
```
Alert → NATS → Response Orchestrator → Coordinated Actions → Global Mitigation
                          ↓
                 Decision Engine (ML/Rules)
                          ↓
                 Multiple Agents/Systems
```

## Core Implementation

### 1. Active Response Orchestrator

```c
// src/analysisd/active_response_orchestrator.c
#include "active-response.h"
#include "nats/nats.h"
#include <pthread.h>

typedef enum {
    RESPONSE_BLOCK_IP,
    RESPONSE_KILL_PROCESS,
    RESPONSE_QUARANTINE_FILE,
    RESPONSE_ISOLATE_HOST,
    RESPONSE_DISABLE_USER,
    RESPONSE_ROLLBACK_CHANGE,
    RESPONSE_COLLECT_FORENSICS,
    RESPONSE_CUSTOM_SCRIPT
} response_action_t;

typedef struct {
    char id[64];
    response_action_t action;
    char target[256];
    char agents[100][64];
    int agent_count;
    int priority;
    time_t created;
    time_t expires;
    char reason[1024];
    char approver[64];
    bool requires_approval;
    bool is_approved;
} orchestrated_response_t;

typedef struct {
    natsConnection *conn;
    jsCtx *js_ctx;
    pthread_t orchestrator_thread;
    pthread_mutex_t response_queue_lock;
    orchestrated_response_t *response_queue;
    int queue_size;
    bool ml_enabled;
    void *ml_model;
} response_orchestrator_t;

static response_orchestrator_t orchestrator = {0};

// Initialize orchestrator
int init_response_orchestrator(natsConnection *nc) {
    orchestrator.conn = nc;
    
    // Initialize JetStream for reliable delivery
    natsConnection_JetStream(&orchestrator.js_ctx, nc, NULL);
    
    // Create response stream
    jsStreamConfig stream_cfg;
    jsStreamConfig_Init(&stream_cfg);
    stream_cfg.Name = "ACTIVE_RESPONSES";
    stream_cfg.Subjects = (const char*[]){"wazuh.response.>"};
    stream_cfg.SubjectsLen = 1;
    stream_cfg.Storage = js_MemoryStorage;
    stream_cfg.Retention = js_WorkQueuePolicy;
    
    jsStreamInfo *si = NULL;
    js_AddStream(&si, orchestrator.js_ctx, &stream_cfg, NULL, NULL);
    jsStreamInfo_Destroy(si);
    
    // Start orchestrator thread
    pthread_create(&orchestrator.orchestrator_thread, NULL,
                   orchestrator_worker, NULL);
    
    // Subscribe to response requests
    natsConnection_Subscribe(nc, "wazuh.response.request",
                            handle_response_request, NULL);
    
    minfo("Active Response Orchestrator initialized");
    return 0;
}

// Handle incoming response request
void handle_response_request(natsConnection *nc, natsSubscription *sub,
                            natsMsg *msg, void *closure) {
    const char *data = natsMsg_GetData(msg);
    cJSON *request = cJSON_Parse(data);
    
    if (!request) {
        merror("Invalid response request");
        natsMsg_Destroy(msg);
        return;
    }
    
    // Extract request details
    int rule_id = cJSON_GetNumberValue(cJSON_GetObjectItem(request, "rule_id"));
    int alert_level = cJSON_GetNumberValue(cJSON_GetObjectItem(request, "level"));
    const char *agent_id = cJSON_GetStringValue(
        cJSON_GetObjectItem(request, "agent_id"));
    const char *src_ip = cJSON_GetStringValue(
        cJSON_GetObjectItem(request, "srcip"));
    
    // Determine appropriate response
    orchestrated_response_t *response = determine_response(
        rule_id, alert_level, agent_id, src_ip);
    
    if (response) {
        // Check if ML approval needed
        if (orchestrator.ml_enabled) {
            double confidence = evaluate_response_ml(response, request);
            if (confidence < 0.8) {
                response->requires_approval = true;
                request_human_approval(response);
            }
        }
        
        // Queue response for execution
        queue_orchestrated_response(response);
    }
    
    cJSON_Delete(request);
    natsMsg_Destroy(msg);
}

// Determine appropriate response based on threat
orchestrated_response_t* determine_response(int rule_id, int level, 
                                           const char *agent_id, 
                                           const char *src_ip) {
    orchestrated_response_t *response = calloc(1, sizeof(orchestrated_response_t));
    
    generate_response_id(response->id);
    response->created = time(NULL);
    response->priority = calculate_priority(level, rule_id);
    
    // Response decision matrix
    if (rule_id >= 5700 && rule_id <= 5799) {  // SSH attacks
        response->action = RESPONSE_BLOCK_IP;
        strncpy(response->target, src_ip, 255);
        response->expires = response->created + 3600;  // 1 hour block
        snprintf(response->reason, 1024, 
                "SSH brute force from %s (rule %d)", src_ip, rule_id);
        
        // Block on all perimeter agents
        get_perimeter_agents(response->agents, &response->agent_count);
        
    } else if (rule_id >= 100000 && rule_id <= 100099) {  // Malware detection
        response->action = RESPONSE_QUARANTINE_FILE;
        response->expires = response->created + 86400;  // 24 hours
        snprintf(response->reason, 1024, 
                "Malware detected on agent %s", agent_id);
        
        // Target specific agent
        strncpy(response->agents[0], agent_id, 63);
        response->agent_count = 1;
        
        // Also isolate if high severity
        if (level >= 10) {
            orchestrated_response_t *isolate = calloc(1, sizeof(orchestrated_response_t));
            memcpy(isolate, response, sizeof(orchestrated_response_t));
            isolate->action = RESPONSE_ISOLATE_HOST;
            queue_orchestrated_response(isolate);
        }
        
    } else if (rule_id >= 5500 && rule_id <= 5599) {  // Privilege escalation
        response->action = RESPONSE_DISABLE_USER;
        response->expires = response->created + 7200;  // 2 hours
        response->requires_approval = true;  // Requires human approval
        
        // Target all domain controllers
        get_domain_controllers(response->agents, &response->agent_count);
    }
    
    return response;
}

// Execute orchestrated response
int execute_orchestrated_response(orchestrated_response_t *response) {
    mdebug1("Executing response %s: action=%d, target=%s",
            response->id, response->action, response->target);
    
    // Create execution command
    cJSON *command = cJSON_CreateObject();
    cJSON_AddStringToObject(command, "response_id", response->id);
    cJSON_AddNumberToObject(command, "action", response->action);
    cJSON_AddStringToObject(command, "target", response->target);
    cJSON_AddNumberToObject(command, "expires", response->expires);
    cJSON_AddStringToObject(command, "reason", response->reason);
    
    char *command_str = cJSON_PrintUnformatted(command);
    
    // Send to target agents
    int success_count = 0;
    for (int i = 0; i < response->agent_count; i++) {
        char subject[256];
        snprintf(subject, sizeof(subject), 
                "wazuh.response.execute.%s", response->agents[i]);
        
        // Use JetStream for guaranteed delivery
        jsPubOptions opts;
        jsPubOptions_Init(&opts);
        opts.MaxWait = 5000;  // 5 second timeout
        
        jsPubAck *ack = NULL;
        jsStatus js_status = js_Publish(&ack, orchestrator.js_ctx,
                                       subject, command_str, 
                                       strlen(command_str), &opts, NULL);
        
        if (js_status == js_NoError && ack) {
            success_count++;
            minfo("Response %s sent to agent %s (seq: %llu)",
                  response->id, response->agents[i], ack->Sequence);
            jsPubAck_Destroy(ack);
        } else {
            merror("Failed to send response to agent %s", response->agents[i]);
        }
    }
    
    // Log execution
    log_response_execution(response, success_count);
    
    // Publish execution status
    publish_response_status(response, success_count);
    
    free(command_str);
    cJSON_Delete(command);
    
    return success_count;
}
```

### 2. Intelligent Response Decision Engine

```c
// src/analysisd/response_decision_engine.c
typedef struct {
    char attack_pattern[64];
    response_action_t responses[5];
    int response_count;
    int min_severity;
    int cooldown_seconds;
    time_t last_triggered;
} response_playbook_t;

typedef struct {
    char entity[256];  // IP, user, file, etc.
    response_action_t action;
    time_t executed_at;
    int execution_count;
    bool was_effective;
} response_history_t;

static response_playbook_t playbooks[] = {
    {
        .attack_pattern = "brute_force",
        .responses = {RESPONSE_BLOCK_IP, RESPONSE_DISABLE_USER},
        .response_count = 2,
        .min_severity = 7,
        .cooldown_seconds = 300
    },
    {
        .attack_pattern = "ransomware",
        .responses = {RESPONSE_ISOLATE_HOST, RESPONSE_KILL_PROCESS, 
                     RESPONSE_COLLECT_FORENSICS},
        .response_count = 3,
        .min_severity = 10,
        .cooldown_seconds = 0  // No cooldown for critical
    },
    {
        .attack_pattern = "data_exfiltration",
        .responses = {RESPONSE_BLOCK_IP, RESPONSE_ISOLATE_HOST,
                     RESPONSE_DISABLE_USER},
        .response_count = 3,
        .min_severity = 9,
        .cooldown_seconds = 60
    }
};

// ML-based response evaluation
double evaluate_response_ml(orchestrated_response_t *response, cJSON *context) {
    if (!orchestrator.ml_model) return 1.0;
    
    // Extract features
    double features[20];
    features[0] = (double)response->action;
    features[1] = (double)response->priority;
    features[2] = (double)response->agent_count;
    features[3] = calculate_threat_score(context);
    features[4] = get_false_positive_rate(response->action);
    features[5] = get_business_impact_score(response->target);
    features[6] = get_time_of_day_factor();
    features[7] = get_recent_alert_count(response->target);
    
    // Check response history
    response_history_t *history = get_response_history(
        response->target, response->action);
    if (history) {
        features[8] = (double)history->execution_count;
        features[9] = history->was_effective ? 1.0 : 0.0;
        features[10] = (double)(time(NULL) - history->executed_at);
    }
    
    // Run ML inference
    double confidence = ml_predict_response_effectiveness(
        orchestrator.ml_model, features);
    
    mdebug1("ML confidence for response %s: %.2f", 
            response->id, confidence);
    
    return confidence;
}

// Coordinated multi-stage response
typedef struct {
    char incident_id[64];
    int stage;
    orchestrated_response_t *stages[10];
    int total_stages;
    time_t stage_started;
    bool stage_completed[10];
    char stage_results[10][256];
} multi_stage_response_t;

int execute_multi_stage_response(const char *incident_id, 
                                const char *attack_pattern) {
    multi_stage_response_t *multi = calloc(1, sizeof(multi_stage_response_t));
    strncpy(multi->incident_id, incident_id, 63);
    
    // Build response stages based on attack pattern
    if (strcmp(attack_pattern, "apt_kill_chain") == 0) {
        // Stage 1: Immediate containment
        multi->stages[0] = create_response(RESPONSE_ISOLATE_HOST, "infected_host");
        
        // Stage 2: Block C2 communications
        multi->stages[1] = create_response(RESPONSE_BLOCK_IP, "c2_servers");
        
        // Stage 3: Forensic collection
        multi->stages[2] = create_response(RESPONSE_COLLECT_FORENSICS, "all");
        
        // Stage 4: Kill malicious processes
        multi->stages[3] = create_response(RESPONSE_KILL_PROCESS, "malware");
        
        // Stage 5: User account remediation
        multi->stages[4] = create_response(RESPONSE_DISABLE_USER, "compromised");
        
        multi->total_stages = 5;
    }
    
    // Execute stages with monitoring
    for (int i = 0; i < multi->total_stages; i++) {
        multi->stage = i;
        multi->stage_started = time(NULL);
        
        // Execute current stage
        int result = execute_orchestrated_response(multi->stages[i]);
        
        // Wait for stage completion confirmation
        if (!wait_for_stage_completion(multi->stages[i], 30000)) {  // 30s timeout
            merror("Stage %d failed for incident %s", i, incident_id);
            
            // Rollback if critical stage fails
            if (i <= 2) {  // First 3 stages are critical
                rollback_response_stages(multi, i);
                return -1;
            }
        }
        
        multi->stage_completed[i] = true;
        
        // Publish stage completion
        publish_stage_status(multi);
    }
    
    return 0;
}
```

### 3. Distributed Response Coordination

```c
// src/analysisd/distributed_response.c
typedef struct {
    char coordination_id[64];
    char participating_managers[10][64];
    int manager_count;
    orchestrated_response_t *global_response;
    pthread_mutex_t coordination_lock;
    bool consensus_required;
    int votes_received;
    int votes_required;
    bool approved;
} distributed_coordination_t;

// Coordinate response across multiple Wazuh managers
int coordinate_global_response(orchestrated_response_t *response) {
    distributed_coordination_t *coord = calloc(1, sizeof(distributed_coordination_t));
    
    generate_coordination_id(coord->coordination_id);
    coord->global_response = response;
    
    // Determine participating managers
    get_cluster_managers(coord->participating_managers, &coord->manager_count);
    
    // Check if consensus required for this action
    coord->consensus_required = requires_consensus(response->action);
    if (coord->consensus_required) {
        coord->votes_required = (coord->manager_count / 2) + 1;  // Majority
    }
    
    // Create coordination request
    cJSON *coord_request = cJSON_CreateObject();
    cJSON_AddStringToObject(coord_request, "coordination_id", coord->coordination_id);
    cJSON_AddStringToObject(coord_request, "response_id", response->id);
    cJSON_AddNumberToObject(coord_request, "action", response->action);
    cJSON_AddStringToObject(coord_request, "target", response->target);
    cJSON_AddBoolToObject(coord_request, "consensus_required", coord->consensus_required);
    
    char *request_str = cJSON_PrintUnformatted(coord_request);
    
    // Broadcast to all managers
    for (int i = 0; i < coord->manager_count; i++) {
        char subject[256];
        snprintf(subject, sizeof(subject), 
                "wazuh.coordination.request.%s", 
                coord->participating_managers[i]);
        
        natsConnection_PublishRequest(orchestrator.conn,
                                     subject,
                                     "wazuh.coordination.response",
                                     request_str,
                                     strlen(request_str));
    }
    
    // Wait for consensus if required
    if (coord->consensus_required) {
        if (!wait_for_consensus(coord, 5000)) {  // 5 second timeout
            mwarn("Consensus not reached for response %s", response->id);
            free(request_str);
            cJSON_Delete(coord_request);
            free(coord);
            return -1;
        }
    }
    
    // Execute coordinated response
    execute_global_response(coord);
    
    free(request_str);
    cJSON_Delete(coord_request);
    free(coord);
    
    return 0;
}

// Handle consensus voting
void handle_consensus_vote(natsConnection *nc, natsSubscription *sub,
                          natsMsg *msg, void *closure) {
    distributed_coordination_t *coord = (distributed_coordination_t *)closure;
    
    cJSON *vote = cJSON_Parse(natsMsg_GetData(msg));
    bool approved = cJSON_GetBoolValue(cJSON_GetObjectItem(vote, "approved"));
    const char *manager = cJSON_GetStringValue(
        cJSON_GetObjectItem(vote, "manager_id"));
    
    pthread_mutex_lock(&coord->coordination_lock);
    
    coord->votes_received++;
    if (approved) {
        coord->approved = (++coord->votes_required >= coord->votes_required);
    }
    
    minfo("Vote received from %s: %s (total: %d/%d)",
          manager, approved ? "approved" : "rejected",
          coord->votes_received, coord->manager_count);
    
    pthread_mutex_unlock(&coord->coordination_lock);
    
    cJSON_Delete(vote);
    natsMsg_Destroy(msg);
}
```

### 4. Response Automation Workflows

```c
// src/analysisd/response_workflows.c
typedef struct {
    char name[64];
    char description[256];
    int trigger_rule_ids[100];
    int trigger_count;
    response_action_t actions[20];
    int action_count;
    char conditions[512];  // JSONPath conditions
    bool enabled;
    int execution_count;
    time_t last_executed;
} response_workflow_t;

// SOAR-style workflow engine
typedef struct {
    response_workflow_t *workflows;
    int workflow_count;
    pthread_mutex_t workflow_lock;
    void *js_engine;  // JavaScript engine for conditions
} workflow_engine_t;

static workflow_engine_t workflow_engine = {0};

// Execute automated workflow
int execute_workflow(const char *workflow_name, cJSON *alert_context) {
    response_workflow_t *workflow = find_workflow(workflow_name);
    if (!workflow || !workflow->enabled) {
        return -1;
    }
    
    // Check execution conditions
    if (!evaluate_workflow_conditions(workflow, alert_context)) {
        mdebug1("Workflow %s conditions not met", workflow_name);
        return 0;
    }
    
    // Check rate limiting
    if (is_workflow_rate_limited(workflow)) {
        mwarn("Workflow %s rate limited", workflow_name);
        return 0;
    }
    
    minfo("Executing workflow: %s", workflow_name);
    
    // Execute workflow actions in sequence
    for (int i = 0; i < workflow->action_count; i++) {
        orchestrated_response_t *response = calloc(1, sizeof(orchestrated_response_t));
        
        response->action = workflow->actions[i];
        populate_response_from_context(response, alert_context);
        
        // Add workflow metadata
        snprintf(response->reason, sizeof(response->reason),
                "Automated workflow: %s", workflow_name);
        
        // Queue for execution
        queue_orchestrated_response(response);
        
        // Wait between actions if needed
        if (i < workflow->action_count - 1) {
            sleep(1);  // 1 second between actions
        }
    }
    
    // Update workflow stats
    workflow->execution_count++;
    workflow->last_executed = time(NULL);
    
    // Publish workflow execution event
    publish_workflow_execution(workflow_name, alert_context);
    
    return workflow->action_count;
}

// Example workflow definitions
void load_default_workflows() {
    // Ransomware response workflow
    response_workflow_t ransomware_workflow = {
        .name = "ransomware_response",
        .description = "Automated ransomware containment and recovery",
        .trigger_rule_ids = {100200, 100201, 100202},  // Ransomware rules
        .trigger_count = 3,
        .actions = {
            RESPONSE_ISOLATE_HOST,      // Immediate isolation
            RESPONSE_KILL_PROCESS,       // Kill ransomware process
            RESPONSE_COLLECT_FORENSICS,  // Collect evidence
            RESPONSE_ROLLBACK_CHANGE     // Restore from snapshot
        },
        .action_count = 4,
        .enabled = true
    };
    
    add_workflow(&ransomware_workflow);
    
    // Brute force response workflow
    response_workflow_t bruteforce_workflow = {
        .name = "bruteforce_mitigation",
        .description = "Automated brute force attack mitigation",
        .trigger_rule_ids = {5710, 5712, 5720},  // SSH brute force rules
        .trigger_count = 3,
        .actions = {
            RESPONSE_BLOCK_IP,      // Block attacker IP
            RESPONSE_DISABLE_USER   // Disable targeted account
        },
        .action_count = 2,
        .conditions = "$.srcip != '10.0.0.0/8' && $.level >= 7",
        .enabled = true
    };
    
    add_workflow(&bruteforce_workflow);
}
```

### 5. Response Verification and Rollback

```c
// src/analysisd/response_verification.c
typedef struct {
    char response_id[64];
    response_action_t action;
    char target[256];
    time_t executed_at;
    bool verified;
    bool successful;
    char verification_details[1024];
    bool rollback_available;
    void *rollback_data;
} response_verification_t;

// Verify response effectiveness
int verify_response_effectiveness(orchestrated_response_t *response) {
    response_verification_t verification = {0};
    strncpy(verification.response_id, response->id, 63);
    verification.action = response->action;
    strncpy(verification.target, response->target, 255);
    verification.executed_at = time(NULL);
    
    switch (response->action) {
        case RESPONSE_BLOCK_IP:
            verification.verified = verify_ip_blocked(response->target);
            break;
            
        case RESPONSE_KILL_PROCESS:
            verification.verified = verify_process_killed(response->target);
            break;
            
        case RESPONSE_ISOLATE_HOST:
            verification.verified = verify_host_isolated(response->target);
            break;
            
        case RESPONSE_QUARANTINE_FILE:
            verification.verified = verify_file_quarantined(response->target);
            break;
            
        case RESPONSE_DISABLE_USER:
            verification.verified = verify_user_disabled(response->target);
            break;
    }
    
    verification.successful = verification.verified;
    
    // Publish verification result
    cJSON *result = cJSON_CreateObject();
    cJSON_AddStringToObject(result, "response_id", verification.response_id);
    cJSON_AddBoolToObject(result, "verified", verification.verified);
    cJSON_AddBoolToObject(result, "successful", verification.successful);
    cJSON_AddStringToObject(result, "details", verification.verification_details);
    
    char *result_str = cJSON_PrintUnformatted(result);
    natsConnection_Publish(orchestrator.conn,
                          "wazuh.response.verification",
                          result_str,
                          strlen(result_str));
    
    free(result_str);
    cJSON_Delete(result);
    
    // Trigger rollback if failed
    if (!verification.successful && verification.rollback_available) {
        trigger_response_rollback(&verification);
    }
    
    return verification.successful ? 0 : -1;
}

// Rollback failed response
int trigger_response_rollback(response_verification_t *verification) {
    mwarn("Rolling back failed response %s", verification->response_id);
    
    orchestrated_response_t *rollback = calloc(1, sizeof(orchestrated_response_t));
    generate_response_id(rollback->id);
    
    switch (verification->action) {
        case RESPONSE_BLOCK_IP:
            // Unblock IP
            rollback->action = RESPONSE_CUSTOM_SCRIPT;
            snprintf(rollback->target, 256, "unblock_ip.sh %s", 
                    verification->target);
            break;
            
        case RESPONSE_ISOLATE_HOST:
            // Reconnect host
            rollback->action = RESPONSE_CUSTOM_SCRIPT;
            snprintf(rollback->target, 256, "reconnect_host.sh %s",
                    verification->target);
            break;
            
        case RESPONSE_DISABLE_USER:
            // Re-enable user
            rollback->action = RESPONSE_CUSTOM_SCRIPT;
            snprintf(rollback->target, 256, "enable_user.sh %s",
                    verification->target);
            break;
    }
    
    snprintf(rollback->reason, 1024, 
            "Rollback of failed response %s", verification->response_id);
    
    // Execute rollback immediately
    return execute_orchestrated_response(rollback);
}
```

## Configuration

### Manager Configuration

```xml
<!-- ossec.conf -->
<ossec_config>
  <active-response>
    <orchestration>
      <enabled>yes</enabled>
      <mode>distributed</mode>
      
      <nats>
        <enabled>yes</enabled>
        <server>nats://response-nats:4222</server>
        <cluster>
          <server>nats://nats1:4222</server>
          <server>nats://nats2:4222</server>
          <server>nats://nats3:4222</server>
        </cluster>
        <jetstream>yes</jetstream>
      </nats>
      
      <decision_engine>
        <ml_enabled>yes</ml_enabled>
        <ml_model>/var/ossec/models/response_decision.pb</ml_model>
        <confidence_threshold>0.75</confidence_threshold>
      </decision_engine>
      
      <consensus>
        <required_for>isolate_host,disable_user</required_for>
        <timeout>5000</timeout>
        <majority_threshold>0.51</majority_threshold>
      </consensus>
      
      <verification>
        <enabled>yes</enabled>
        <timeout>30000</timeout>
        <rollback_on_failure>yes</rollback_on_failure>
      </verification>
      
      <rate_limiting>
        <max_responses_per_minute>100</max_responses_per_minute>
        <max_per_target>10</max_per_target>
      </rate_limiting>
    </orchestration>
  </active-response>
  
  <!-- Response workflows -->
  <workflows>
    <workflow>
      <name>critical_incident_response</name>
      <enabled>yes</enabled>
      <triggers>
        <rule_id>100000-100999</rule_id>
        <min_level>12</min_level>
      </triggers>
      <actions>
        <action>isolate_host</action>
        <action>collect_forensics</action>
        <action>notify_soc</action>
      </actions>
      <approval_required>no</approval_required>
    </workflow>
  </workflows>
</ossec_config>
```

### Agent Configuration

```xml
<!-- Agent ossec.conf -->
<ossec_config>
  <active-response>
    <nats_subscriber>
      <enabled>yes</enabled>
      <server>nats://response-nats:4222</server>
      <subject>wazuh.response.execute.{agent_id}</subject>
      <queue_group>agent_responders</queue_group>
    </nats_subscriber>
    
    <response_capabilities>
      <can_block_ip>yes</can_block_ip>
      <can_kill_process>yes</can_kill_process>
      <can_quarantine>yes</can_quarantine>
      <can_isolate>yes</can_isolate>
      <can_rollback>yes</can_rollback>
    </response_capabilities>
    
    <verification>
      <enabled>yes</enabled>
      <report_back>yes</report_back>
    </verification>
  </active-response>
</ossec_config>
```

## Real-World Use Cases

### 1. Coordinated DDoS Mitigation

```c
// DDoS response orchestration
int orchestrate_ddos_response(cJSON *ddos_alert) {
    // Extract attack details
    const char *target_ip = cJSON_GetStringValue(
        cJSON_GetObjectItem(ddos_alert, "dst_ip"));
    int packet_rate = cJSON_GetNumberValue(
        cJSON_GetObjectItem(ddos_alert, "packet_rate"));
    
    // Multi-layer response
    if (packet_rate > 100000) {  // Major attack
        // Layer 1: Edge firewall rules
        orchestrated_response_t *edge_response = create_response(
            RESPONSE_CUSTOM_SCRIPT, "enable_ddos_mitigation.sh");
        strcpy(edge_response->agents[0], "edge-fw-01");
        edge_response->agent_count = 1;
        
        // Layer 2: CDN rerouting
        orchestrated_response_t *cdn_response = create_response(
            RESPONSE_CUSTOM_SCRIPT, "cdn_reroute.sh");
        strcpy(cdn_response->agents[0], "cdn-controller");
        cdn_response->agent_count = 1;
        
        // Layer 3: Rate limiting on all web servers
        orchestrated_response_t *rate_limit = create_response(
            RESPONSE_CUSTOM_SCRIPT, "enable_rate_limiting.sh");
        get_webserver_agents(rate_limit->agents, &rate_limit->agent_count);
        
        // Execute in parallel
        execute_orchestrated_response(edge_response);
        execute_orchestrated_response(cdn_response);
        execute_orchestrated_response(rate_limit);
        
        // Monitor and adjust
        monitor_ddos_mitigation(target_ip);
    }
    
    return 0;
}
```

### 2. Insider Threat Response

```c
// Insider threat mitigation
int respond_to_insider_threat(const char *user, int risk_score) {
    multi_stage_response_t *response = create_multi_stage_response();
    
    if (risk_score > 90) {  // Critical insider threat
        // Stage 1: Immediate account suspension
        response->stages[0] = create_response(RESPONSE_DISABLE_USER, user);
        
        // Stage 2: Revoke all access tokens
        response->stages[1] = create_response(RESPONSE_CUSTOM_SCRIPT, 
                                             "revoke_all_tokens.sh");
        
        // Stage 3: Preserve evidence
        response->stages[2] = create_response(RESPONSE_COLLECT_FORENSICS, 
                                             user);
        
        // Stage 4: Kill active sessions
        response->stages[3] = create_response(RESPONSE_CUSTOM_SCRIPT,
                                             "kill_user_sessions.sh");
        
        // Stage 5: Legal hold on user data
        response->stages[4] = create_response(RESPONSE_CUSTOM_SCRIPT,
                                             "legal_hold.sh");
        
        response->total_stages = 5;
        
        // Execute with monitoring
        execute_multi_stage_response(generate_incident_id(), 
                                    "insider_threat");
    }
    
    return 0;
}
```

### 3. Zero-Day Exploit Response

```c
// Zero-day exploit mitigation
int respond_to_zero_day(cJSON *exploit_indicators) {
    // Create adaptive response based on indicators
    orchestrated_response_t *response = calloc(1, sizeof(orchestrated_response_t));
    
    // Analyze exploit behavior
    const char *exploit_vector = cJSON_GetStringValue(
        cJSON_GetObjectItem(exploit_indicators, "vector"));
    
    if (strcmp(exploit_vector, "network") == 0) {
        // Network-based exploit
        response->action = RESPONSE_CUSTOM_SCRIPT;
        snprintf(response->target, 256, 
                "deploy_network_signatures.sh %s",
                generate_exploit_signature(exploit_indicators));
        
        // Deploy to all IDS/IPS systems
        get_ids_agents(response->agents, &response->agent_count);
        
    } else if (strcmp(exploit_vector, "file") == 0) {
        // File-based exploit
        response->action = RESPONSE_QUARANTINE_FILE;
        
        // Create YARA rule for detection
        char yara_rule[4096];
        generate_yara_rule(exploit_indicators, yara_rule);
        deploy_yara_rule(yara_rule);
        
        // Scan and quarantine across infrastructure
        get_all_agents(response->agents, &response->agent_count);
    }
    
    // High priority execution
    response->priority = 10;
    response->requires_approval = false;  // No time for approval
    
    execute_orchestrated_response(response);
    
    // Continuous monitoring
    start_exploit_monitoring(exploit_indicators);
    
    return 0;
}
```

## Performance Metrics

### Response Time Comparison

```
Traditional Active Response:
- Detection to Action: 5-30 seconds
- Single Agent Response: Yes
- Coordination: None
- Verification: Manual

NATS-Orchestrated Response:
- Detection to Action: <1 second
- Multi-Agent Response: Yes
- Global Coordination: Yes
- Automated Verification: Yes
```

### Scalability Metrics

```c
// Response performance monitoring
typedef struct {
    uint64_t responses_orchestrated;
    uint64_t responses_executed;
    uint64_t responses_verified;
    uint64_t responses_rolled_back;
    double avg_orchestration_time_ms;
    double avg_execution_time_ms;
    double avg_verification_time_ms;
    uint64_t consensus_achieved;
    uint64_t consensus_failed;
} response_metrics_t;

void log_response_metrics() {
    response_metrics_t metrics = collect_response_metrics();
    
    minfo("Response Orchestration Metrics:");
    minfo("  Orchestrated: %llu", metrics.responses_orchestrated);
    minfo("  Executed: %llu (%.2f%%)", metrics.responses_executed,
          (double)metrics.responses_executed / metrics.responses_orchestrated * 100);
    minfo("  Verified: %llu", metrics.responses_verified);
    minfo("  Rolled Back: %llu", metrics.responses_rolled_back);
    minfo("  Avg Orchestration: %.2f ms", metrics.avg_orchestration_time_ms);
    minfo("  Avg Execution: %.2f ms", metrics.avg_execution_time_ms);
    minfo("  Consensus Success Rate: %.2f%%",
          (double)metrics.consensus_achieved / 
          (metrics.consensus_achieved + metrics.consensus_failed) * 100);
}
```

## Advanced Features

### 1. Predictive Response

```c
// Predict and pre-stage responses
int predictive_response_staging() {
    // Analyze current threat landscape
    threat_prediction_t *predictions = analyze_threat_trends();
    
    for (int i = 0; i < predictions->count; i++) {
        if (predictions->items[i].probability > 0.8) {
            // Pre-stage response
            orchestrated_response_t *staged = create_response(
                predictions->items[i].likely_response,
                predictions->items[i].likely_target);
            
            staged->is_staged = true;
            staged->trigger_condition = predictions->items[i].trigger;
            
            // Queue for rapid execution when triggered
            queue_staged_response(staged);
            
            minfo("Pre-staged response for predicted threat: %s",
                  predictions->items[i].threat_type);
        }
    }
    
    return predictions->count;
}
```

### 2. Response Learning

```c
// Learn from response effectiveness
void update_response_ml_model(response_verification_t *verification) {
    // Collect training data
    ml_training_sample_t sample = {0};
    
    // Features
    sample.features[0] = (double)verification->action;
    sample.features[1] = get_threat_context_score(verification->response_id);
    sample.features[2] = get_time_to_execute(verification->response_id);
    sample.features[3] = get_target_criticality(verification->target);
    
    // Label (was it effective?)
    sample.label = verification->successful ? 1.0 : 0.0;
    
    // Update model
    ml_online_learning_update(orchestrator.ml_model, &sample);
    
    // Retrain if enough samples
    if (should_retrain_model()) {
        ml_retrain_response_model(orchestrator.ml_model);
    }
}
```

## Conclusion

NATS-based active response orchestration transforms Wazuh from reactive to proactive security:

- **Sub-second Response**: From detection to mitigation in milliseconds
- **Global Coordination**: Responses across entire infrastructure
- **Intelligent Decisions**: ML-driven response selection
- **Automated Workflows**: SOAR-like capabilities
- **Continuous Verification**: Ensure response effectiveness

This architecture enables organizations to respond to threats at machine speed while maintaining human oversight for critical decisions.