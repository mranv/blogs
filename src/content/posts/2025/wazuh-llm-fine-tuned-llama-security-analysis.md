---
author: Anubhav Gain
pubDatetime: 2025-01-15T14:00:00+05:30
modDatetime: 2025-01-15T14:00:00+05:30
title: "Introducing Wazuh LLM: Fine-Tuned Llama 3.1 for Security Event Analysis"
slug: wazuh-llm-fine-tuned-llama-security-analysis
featured: true
draft: false
tags:
  - Wazuh
  - LLM
  - Machine-Learning
  - Security-Analysis
  - Ollama
  - Llama-3.1
  - SOC
  - SIEM
  - Incident-Response
  - MITRE-ATT&CK
  - AI
  - Cybersecurity
  - Threat-Detection
  - Log-Analysis
  - Fine-Tuning
category: AI-Security
description: Discover Wazuh LLM - a specialized fine-tuned Llama 3.1 8B model for analyzing Wazuh security events with MITRE ATT&CK mapping, multilingual support, and SOC automation capabilities.
---

# Introducing Wazuh LLM: Fine-Tuned Llama 3.1 for Security Event Analysis

## Why Specialized Security Analysis Matters

In the cybersecurity world, SOC specialists deal with massive streams of security events daily. Analyzing each alert requires deep knowledge, experience, and time. That's why specialized language models are revolutionizing security operations.

I'm excited to introduce **Wazuh LLM** — a fine-tuned version of Llama 3.1 8B, specifically trained for analyzing Wazuh security events. This model is available through Ollama as `mranv/siem-llama-3.1` with both base and v1 versions.

## Table of Contents

## Why a Specialized Model for Wazuh?

General-purpose language models like GPT or base Llama have broad knowledge but don't specialize in specific tasks. When it comes to security event analysis, you need:

### Deep Wazuh Understanding

The model must know the event structure, rules, severity levels, and the context of Wazuh as a SIEM system.

### MITRE ATT&CK Knowledge

The ability to map events to tactics and techniques from the MITRE ATT&CK framework is critical for understanding attack chains.

### Practical Recommendations

It's not enough to just describe the problem — the model must suggest concrete actions for incident response.

### Risk Assessment

The model should evaluate threat severity and prioritize response efforts.

These requirements formed the foundation for fine-tuning Llama 3.1 8B to create Wazuh LLM.

## Key Capabilities: AI-Powered Security Analysis

Wazuh LLM provides structured security event analysis that includes:

### 🎯 Rule Level Determination
Automatic classification of event severity from low to critical level.

### 🔍 Event Type Identification
Determining the incident category — from brute force attempts to rootkit detection.

### 📝 Detailed Reasoning
Comprehensive explanation of why this event represents a threat and what attack mechanism might be employed.

### ⚠️ Risk Assessment
Analysis of potential system impact considering context and possible consequences.

### 🛡️ Action Recommendations
Specific steps for incident response, including technical measures and investigation procedures.

### 🔬 Investigation Guidance
Advice for further incident analysis and searching for indicators of compromise.

### 🗺️ MITRE ATT&CK Mapping
Automatic correlation of events to tactics and techniques from the MITRE ATT&CK framework.

### 🌍 Multilingual Support
Analysis support in English, Russian, and other languages, making the model useful for international security teams.

## Real-World Security Analysis Examples

Let's look at several practical examples of using Wazuh LLM.

### Example 1: SSH Connection Attempt Analysis

Query to the model in English:

```bash
ollama run mranv/siem-llama-3.1:v1 "Analyze this Wazuh alert: SSH login from 192.168.1.100 to root account"
```

**Model Response:**

```
Rule Level: 12 - High importance event

Event Type: Unauthorized SSH Login

Detailed Reasoning: There has been an unauthorized SSH login attempt from
the IP address 192.168.1.100 to the system's root account. This is a high
priority event as it indicates potential compromise of the system.

Risk Assessment: Medium to High Risk - An unauthorized SSH login attempt to
the root account may indicate successful exploitation of a vulnerability,
brute force attack, or other malicious activity. If left unchecked, this
could lead to data breaches, system compromise, service disruption, and
other security incidents.

Recommended Actions: Block the source IP 192.168.1.100 at the firewall level,
change the root password, review system logs for further indicators of
compromise, and run a full system scan with an antivirus program.

Investigation Guidance: Review SSH login history for suspicious activity,
check for any successful logins from the same source IP, review system
configuration for security vulnerabilities, and monitor system performance
for signs of compromise.

MITRE ATT&CK: T1078 - Valid Accounts (possible)
```

### Example 2: Malware Detection Analysis

Query with JSON event structure:

```bash
ollama run mranv/siem-llama-3.1:v1 '{
  "timestamp": "2025-01-15T14:00:00Z",
  "agent": {"id": "000", "name": "malware_detection-00", "ip": "10.0.0.100"},
  "rule": {
    "id": "600",
    "level": 13,
    "description": "Rootkit detected in system",
    "groups": ["rootkit", "malware", "attack"],
    "category": "malware_detection",
    "mitre": {"id": ["T1014"], "tactic": ["Defense Evasion"]}
  },
  "data": {
    "severity": "high",
    "file": "/tmp/malware_0.exe",
    "malware_name": "Trojan.Generic",
    "action": "quarantined",
    "scanner": "ClamAV"
  },
  "location": "/var/log/malware_detection/security.log"
}'
```

**Model Response:**

```
Rule Level: 13 - Unusual error

Event Type: Rootkit Detection

Detailed Reasoning: Rule 600 triggered due to detection of rootkit in system.
This indicates potential for malicious activity and requires investigation.

Risk Assessment: Medium risk - Rootkits can indicate presence of other malware,
compromise system integrity, and provide backdoor access for attackers.

Recommended Actions: Quarantine the detected file (/tmp/malware_0.exe) and
notify incident response team. Review system logs for any suspicious activity.
Run full system scan with anti-malware software to ensure thorough cleaning.

Investigation Guidance: Document event details, review system configuration
for vulnerabilities, check for signs of lateral movement, and report findings
to incident response team.

MITRE ATT&CK: T1014 (Rootkit)
```

### Example 3: Brute Force Attack (Multilingual)

```bash
ollama run mranv/siem-llama-3.1:v1 "Analyze: 100+ SSH connection attempts detected in 5 minutes"
```

**Model Response:**

```
Rule Level: 12 - High importance event

Event Type: Brute Force Attack

Detailed Reasoning: Too many SSH connection attempts may indicate a brute
force attack on the system. This is when an attacker tries to guess a user's
password using various character combinations.

Risk Assessment: High risk, because if the attacker successfully guesses the
password, they will be able to gain access to the system and cause harm.

Recommended Actions: Increase password complexity requirements, enable
two-factor authentication (2FA) for additional protection. System administrator
should also consider blocking IP addresses from which attacking requests are
coming.

Investigation Guidance: Check system logs for other attacks and verify user
passwords for security. The source of the attack should also be identified
and reported to appropriate authorities.

MITRE ATT&CK: T1110 - Brute Force
```

## How to Install and Deploy Wazuh LLM

### Installing Ollama

If you don't have Ollama installed yet, follow these steps:

**Linux and macOS:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download the installer from the [official Ollama website](https://ollama.com).

**Docker:**

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### Downloading Wazuh LLM

After installing Ollama, download the model:

**Base Model:**
```bash
ollama pull mranv/siem-llama-3.1:base
```

**V1 Model (Recommended):**
```bash
ollama pull mranv/siem-llama-3.1:v1
```

### Running the Model

**Interactive Mode:**

```bash
ollama run mranv/siem-llama-3.1:v1
```

**Analyze Specific Alert:**

```bash
ollama run mranv/siem-llama-3.1:v1 "Your query or Wazuh event JSON"
```

### Using via API

The model is also available through the Ollama REST API:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mranv/siem-llama-3.1:v1",
  "prompt": "Analyze this Wazuh alert: Multiple failed login attempts from 10.0.0.50",
  "stream": false
}'
```

### Python Integration

```python
import requests
import json

def analyze_security_log(log_data):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={
            'model': 'mranv/siem-llama-3.1:v1',
            'prompt': f"Analyze this Wazuh log: {log_data}",
            'stream': False
        }
    )
    return response.json()

# Example usage
log = {
    "timestamp": "2025-01-15T14:00:00Z",
    "rule": {
        "id": "5710",
        "level": 5,
        "description": "sshd: Attempt to login using a non-existent user"
    },
    "data": {
        "srcip": "192.168.1.100",
        "dstuser": "admin"
    }
}

result = analyze_security_log(json.dumps(log))
print(result['response'])
```

## SOC Automation and Workflow Integration

### Technical Specifications

| Specification | Details |
|--------------|---------|
| **Base Model** | Meta Llama 3.1 8B Instruct |
| **Model Size** | 4.7 GB |
| **Format** | GGUF (quantized Q4_0) |
| **Context Window** | 128K tokens |
| **RAM Requirements** | Minimum 8 GB, Recommended 16 GB |
| **Languages** | English, Russian, Finnish, and more |
| **Specialization** | Wazuh SIEM analysis, incident response |

### Integration Workflows

Wazuh LLM can be integrated into various security workflows:

#### 1. SOC Dashboard Integration
Automatic alert analysis in real-time with recommendations displayed on the dashboard.

#### 2. Incident Response Automation
Using the model as part of automated incident response playbooks.

#### 3. Security Team Chatbot
Creating an interactive assistant for SOC analysts.

#### 4. API Integrations
Connecting the model to existing SIEM and SOAR platforms via REST API.

#### 5. Personnel Training
Using the model as a training tool for new security analysts.

## SOC Analyst Use Cases and Scenarios

### Scenario 1: Initial Alert Analysis

A SOC analyst receives an alert about suspicious activity. Instead of spending time on manual analysis, they can send the event to Wazuh LLM and receive structured analysis with recommendations in seconds.

### Scenario 2: Training Junior Analysts

New employees can use the model as an interactive learning tool, asking questions about different attack types and receiving detailed explanations with examples.

### Scenario 3: Incident Prioritization

With a large number of alerts, the model helps quickly assess the risk of each event and properly prioritize response efforts.

### Scenario 4: Incident Documentation

The model can assist in creating structured incident reports, including event description, impact assessment, and remediation recommendations.

## Wazuh LLM vs GPT-4 and Commercial AI Models

### Specialization vs. Universality

General models like GPT-4 have broad knowledge but don't specialize in specific domains. Wazuh LLM is trained specifically on the context of Wazuh security events, making its responses more accurate and relevant for SOC analysts.

### Local Deployment

Unlike cloud solutions, Wazuh LLM can run locally, which is critical for organizations with data confidentiality requirements. You have complete control over where your security data is processed.

### Cost Efficiency

Using Wazuh LLM through Ollama is free, while commercial model APIs can be expensive with large analysis volumes.

### Customization for Your Needs

Since the model is available locally, you can fine-tune it on your specific data and Wazuh rules, which is impossible with commercial cloud solutions.

## Best Practices for Usage

### 1. Provide Context

When formulating queries, try to be specific and include as much context as possible. Instead of general descriptions, provide the complete JSON structure of the Wazuh event for the most accurate analysis.

### 2. Use as Starting Point

Use the model's analysis results as a starting point for your own investigation, not as a final conclusion. The model provides expert recommendations, but the final decision should always be made by a human considering the full context of your infrastructure.

### 3. Keep Updated

Regularly update the model to the latest version to get improved analysis algorithms and support for new attack types.

### 4. Combine with Other Tools

Combine the model with other security tools to get the most complete picture of an incident.

## Model Comparison

| Feature | Base Model | V1 Model |
|---------|-----------|----------|
| **Version** | mranv/siem-llama-3.1:base | mranv/siem-llama-3.1:v1 |
| **Size** | 4.7 GB | 4.7 GB |
| **Context** | 128K tokens | 128K tokens |
| **MITRE Mapping** | ✓ | ✓ Enhanced |
| **Analysis Depth** | Standard | Improved |
| **Recommendations** | ✓ | ✓ Enhanced |
| **Status** | Stable | Recommended |

## Quick Start Testing

### Method 1: Interactive Session

```bash
# Start interactive session
ollama run mranv/siem-llama-3.1:v1

# Type your queries directly
>>> Analyze: Failed SSH login from 203.0.113.5
```

### Method 2: Single Command

```bash
ollama run mranv/siem-llama-3.1:v1 "Analyze this alert: Rootkit detected at /tmp/suspicious.exe"
```

### Method 3: JSON Log Analysis

```bash
ollama run mranv/siem-llama-3.1:v1 '{
  "rule": {"level": 10, "description": "Brute force attack"},
  "data": {"srcip": "10.0.0.1", "attempts": 150}
}'
```

## Performance Optimization

### GPU Acceleration

```bash
# Use GPU for faster inference
OLLAMA_GPU=1 ollama run mranv/siem-llama-3.1:v1
```

### Memory Management

```bash
# Adjust context size for memory constraints
ollama run mranv/siem-llama-3.1:v1 --num-ctx 4096 "Analyze..."
```

### Batch Processing

```bash
# Process multiple logs
cat security_logs.json | while read log; do
  ollama run mranv/siem-llama-3.1:v1 "$log"
done
```

## Development Status and Roadmap

### Current Capabilities

- ✅ Analysis of Wazuh security events with JSON structure
- ✅ Risk assessment and response recommendations
- ✅ MITRE ATT&CK framework mapping
- ✅ Multilingual support (English, Russian, Finnish)
- ✅ Local deployment for data privacy
- ✅ API integration capabilities

### Planned Improvements

- 🔄 Expanded support for all Wazuh rule types
- 🔄 Deeper MITRE ATT&CK integration
- 🔄 Improved event correlation for attack chain identification
- 🔄 Large-scale log analysis support
- 🔄 Automatic incident report generation
- 🔄 Enhanced multilingual capabilities

## Conclusion

Wazuh LLM represents a specialized tool for security event analysis that can significantly accelerate SOC analyst work and improve incident response quality. The model combines the power of Llama 3.1 with specialized training on Wazuh security events.

### Key Takeaways

- 🎯 **Specialized for Security**: Fine-tuned specifically for Wazuh event analysis
- 🔒 **Privacy-Focused**: Run locally without sending data to cloud services
- 💰 **Cost-Effective**: Free alternative to commercial AI solutions
- 🌍 **Multilingual**: Support for multiple languages
- 🔗 **Integration-Ready**: Easy API access for automation
- 📊 **Comprehensive**: MITRE ATT&CK mapping and detailed recommendations

## Useful Links

- 🔗 [Base Model on Ollama](https://ollama.com/mranv/siem-llama-3.1:base)
- 🔗 [V1 Model on Ollama](https://ollama.com/mranv/siem-llama-3.1:v1)
- 🔗 [Ollama Documentation](https://ollama.com/docs)
- 🔗 [Wazuh Documentation](https://documentation.wazuh.com)
- 🔗 [MITRE ATT&CK Framework](https://attack.mitre.org/)
- 🔗 [Llama 3.1 by Meta](https://ai.meta.com/llama/)

## Related Articles

- [Analyzing Historical ETW and Windows Event Logs with Wazuh](/posts/analyzing-historical-etw-logs-wazuh-forensics)
- [Blocking Attacks with Active Response in Wazuh](/posts/blocking-attacks-active-response-wazuh)
- [Brute Force Attack Detection with Wazuh and Hydra](/posts/brute-force-attack-detection-wazuh-hydra)

---

**Note**: The model is in active development. Analysis results should be used as recommendations alongside professional security expertise. Always conduct thorough incident investigation and validation.

**Credits**: Based on the original Wazuh LLM concept by [pyToshka](https://github.com/pyToshka), adapted and retagged as `mranv/siem-llama-3.1` for community use.
