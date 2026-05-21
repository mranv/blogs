---
author: Anubhav Gain
pubDatetime: 2025-05-22T11:00:00+05:30
modDatetime: 2025-05-22T11:00:00+05:30
title: "AI Defense and Security Controls: Input/Output Guardrails and Model Scanning"
slug: ai-defense-security-controls-guardrails
featured: true
draft: false
tags:
  - ai-security
  - defense
  - guardrails
  - llm-guard
  - nemo-guardrails
  - model-scanning
  - security-controls
category: AI Security
description: A comprehensive guide to AI defense mechanisms including input/output guardrails (NeMo Guardrails, LlamaFirewall, llm-guard), model scanning tools (modelscan, picklescan), and AI-assisted defensive security solutions.
---

# AI Defense and Security Controls: Input/Output Guardrails and Model Scanning

While offensive security tools get the headlines, defensive controls are what keep AI systems safe in production. This guide covers the defensive side of AI security — from input/output guardrails that prevent harmful interactions to model scanning tools that detect malicious artifacts, and AI-assisted tools that help defenders identify vulnerabilities faster.

## Input/Output Guardrails

Guardrails sit between users and AI models, filtering inputs and outputs to prevent harmful interactions. They are the first line of defense in production AI deployments.

### NeMo Guardrails (NVIDIA)

**[NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails)** is the most widely adopted open-source guardrail toolkit. It adds programmable guardrails to LLM-based conversational systems through:

- **Colang language**: A purpose-built language for defining guardrail behavior
- **Topic-based control**: Define what topics the model can and cannot discuss
- **Dialog flow enforcement**: Ensure conversations stay within defined boundaries
- **Output validation**: Check model responses against safety criteria before delivery

```yaml
# Example: Preventing system prompt disclosure
define flow prevent prompt leak
  user asks about system prompt
  bot refuse system prompt disclosure

define bot refuse system prompt disclosure
  "I cannot share details about my internal configuration or system prompt."
```

### LlamaFirewall (Meta)

**[LlamaFirewall](https://github.com/meta-llama/PurpleLlama/tree/main/LlamaFirewall)** is Meta's framework for detecting and mitigating AI-centric security risks. Unlike NeMo Guardrails which focuses on conversation flow, LlamaFirewall provides:

- **Multi-layer protection**: Covers typical LLM chat and advanced multi-step agentic operations
- **Input scanners**: Detect injection attempts in user inputs
- **Output scanners**: Filter harmful content in model responses
- **Agent-level controls**: Monitor and control agent tool usage

### llm-guard (Protect AI)

**[llm-guard](https://github.com/protectai/llm-guard)** provides comprehensive security for LLM interactions:

- **Input scanning**: Prompt injection detection, toxic content filtering, PII detection
- **Output scanning**: Harmful content detection, sentiment analysis, code safety checks
- **Customizable**: Build custom scanners for domain-specific security requirements
- **Performance optimized**: Designed for low-latency production deployments

### Commercial and Specialized Guardrails

| Tool | Key Feature |
|------|-------------|
| [TrustGate](https://github.com/NeuralTrust/TrustGate) | Generative Application Firewall (GAF) for GenAI apps |
| [ZenGuard AI](https://github.com/ZenGuard-AI/fast-llm-security-guardrails) | Fast trust layer for AI agents |
| [vibraniumdome](https://github.com/genia-dev/vibraniumdome) | Full LLM WAF with governance and policy-driven control |
| [LocalMod](https://github.com/KOKOSde/localmod) | Self-hosted content moderation, runs 100% offline |
| [DynaGuard](https://github.com/montehoover/DynaGuard) | Dynamic guardrails with user-defined policies |
| [AprielGuard](https://huggingface.co/blog/ServiceNow-AI/aprielguard) | 8B parameter safety-security safeguard model |
| [Safe Zone](https://github.com/thyrisAI/safe-zone) | PII detection and guardrails engine |
| [superagent](https://github.com/superagent-ai/superagent) | Purpose-trained guardrails for AI agents |
| [ShellWard](https://github.com/jnMetaCode/shellward) | 8-layer defense middleware for AI agents |
| [rebuff](https://github.com/woop/rebuff) | Prompt injection detector |
| [langkit](https://github.com/whylabs/langkit) | Text metrics for monitoring language model security |
| [CodeGate](https://codegate.ai) | Privacy-focused security for code generation AI workflows |
| [Future AGI](https://github.com/future-agi/future-agi) | Self-hosted platform with real-time guardrails |

## Model and Artifact Scanning

Before deploying any AI model, scanning for malicious artifacts is essential. Attackers can embed backdoors, execute arbitrary code, or exfiltrate data through seemingly innocent model files.

### modelscan (Protect AI)

**[modelscan](https://github.com/protectai/modelscan)** scans ML models for unsafe code. It detects:

- **Deserialization attacks**: Malicious code embedded in pickle files
- **Code execution payloads**: Arbitrary code execution hidden in model files
- **Known malicious patterns**: Database of known attack signatures in model files

```bash
pip install modelscan
modelscan -p ./my-models/
```

### picklescan

**[picklescan](https://github.com/mmaitre314/picklescan)** specifically targets Python pickle files, which are a common vector for attacks on ML systems:

- Detects suspicious pickle operations
- Scans model checkpoint files
- Integrates with CI/CD pipelines for automated scanning

### fickling (Trail of Bits)

**[fickling](https://github.com/trailofbits/fickling)** is both a pickle decompiler and static analyzer. Unlike picklescan which detects known patterns, fickling can:

- **Decompile pickle files**: Understand exactly what operations they perform
- **Static analysis**: Identify suspicious code patterns without executing the file
- **Security auditing**: Deep inspection of serialized Python objects

### Additional Scanning Tools

- **[medusa](https://github.com/Pantheon-Security/medusa)** — AI-first security scanner with 74+ analyzers and 180+ AI agent security rules. Detects CVEs including React2Shell and mcp-remote RCE.
- **[julius](https://github.com/praetorian-inc/julius)** — LLM service fingerprinting tool that detects 32+ AI services (Ollama, vLLM, LiteLLM, Hugging Face TGI) during penetration tests.
- **[a2a-scanner](https://github.com/cisco-ai-defense/a2a-scanner)** — Scans A2A (Agent-to-Agent) communication for potential threats.

## AI-Assisted Defensive Security

### Claude Code Security Review

**[Claude Code Security Review](https://github.com/anthropics/claude-code-security-review)** is an AI-powered GitHub Action that uses Claude to analyze code changes for security vulnerabilities. It brings AI-powered security review directly into the pull request workflow.

### deepsec (Vercel Labs)

**[deepsec](https://github.com/vercel-labs/deepsec)** is an agent-powered vulnerability scanner for finding hard-to-spot issues in large codebases:

- Parallel scanning across codebase segments
- PR diff review capabilities
- CI/CD integration
- Coding agent-based analysis that understands code semantics

### Reverse Engineering Assistance

| Tool | Capability |
|------|-----------|
| [GhidraGPT](https://github.com/ZeroDaysBroker/GhidraGPT) | Automated code analysis, variable renaming, vulnerability detection in Ghidra |
| [IDAssist](https://github.com/symgraph/IDAssist) | LLM-powered IDA Pro plugin with semantic knowledge graphs and RAG search |

### Threat Modeling

**[ThreatForest](https://github.com/aws-samples/sample-agentic-attack-tree-generator)** from AWS is an agentic threat modeling platform built on the Strands framework. It autonomously:

- Generates attack trees from code repositories
- Maps attack steps to MITRE ATT&CK techniques
- Produces actionable mitigation recommendations

### GRC Automation

**[claude-grc-plugin](https://github.com/mlunato47/claude-grc-plugin)** turns Claude into a senior GRC analyst with:

- 72+ reference files covering 15 frameworks (NIST 800-53, FedRAMP, ISO 27001, SOC 2)
- 24 slash commands for compliance workflows
- Deep domain knowledge for federal and commercial compliance

### Security Operations

**[Vigil SOC](https://github.com/Vigil-SOC/vigil)** is a comprehensive open-source security operations platform for AI agents, providing real-time monitoring, threat detection, and incident response for AI-powered environments.

## Building a Defense-in-Depth Strategy

### Layer 1: Pre-Deployment
```
1. Scan models with modelscan and picklescan
2. Run garak/promptfoo for vulnerability assessment
3. Configure NeMo Guardrails for conversation boundaries
```

### Layer 2: Runtime Protection
```
1. Deploy llm-guard for input/output scanning
2. Use LlamaFirewall for agent-level controls
3. Monitor with langkit for anomaly detection
```

### Layer 3: Continuous Monitoring
```
1. Use CodeGate for code generation workflows
2. Deploy Vigil SOC for operational monitoring
3. Run periodic red team assessments
```

## Key Takeaways

- Guardrails are essential but not sufficient — they must be part of a layered defense strategy
- Model scanning tools (modelscan, picklescan, fickling) address the critical supply chain risk of malicious model files
- AI-assisted defensive tools (deepsec, ThreatForest) are making security analysis faster and more thorough
- The combination of guardrails, scanning, monitoring, and AI-assisted analysis provides comprehensive coverage
- Every AI deployment should have at minimum input guardrails, output filtering, and model scanning before production use
