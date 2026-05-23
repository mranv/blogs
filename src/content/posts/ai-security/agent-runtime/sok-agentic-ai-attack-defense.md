---
author: Anubhav Gain
pubDatetime: 2026-05-22T09:15:00+05:30
modDatetime: 2026-05-22T09:15:00+05:30
title: "SoK: Attack and Defense Landscape of Agentic AI Systems — USENIX Security 2026"
slug: sok-agentic-ai-attack-defense
featured: true
draft: false
tags:
  - ai-security
  - agentic-ai
  - attack-defense
  - usecurity
  - sok
category: AI Research
description: A comprehensive analysis of the Systematization of Knowledge paper from USENIX Security 2026 by Juhee Kim, Wenbo Guo, and Dawn Song, mapping the full attack and defense landscape of agentic AI systems — from prompt injection and tool poisoning to runtime sandboxing and guardrail architectures.
---

# SoK: Attack and Defense Landscape of Agentic AI Systems

The transition from static language models to autonomous AI agents is the most consequential architectural shift in AI since the advent of deep learning. But it is also the most dangerous. When an LLM graduates from generating text to executing code, calling APIs, reading files, and chaining multi-step plans, the threat model transforms entirely — a successful jailbreak is no longer an output filter bypass; it becomes remote code execution on your infrastructure.

At USENIX Security 2026, **Juhee Kim**, **Wenbo Guo**, and **Dawn Song** presented their Systematization of Knowledge (SoK) paper, **"SoK: Attack and Defense Landscape of Agentic AI Systems"**, which provides the first comprehensive, structured taxonomy of the attacks that target agentic AI and the defenses designed to stop them. This post breaks down the paper's key contributions, maps the attack-defense landscape it reveals, and highlights the critical gaps that remain open.

**Paper**: [SoK: Attack and Defense Landscape of Agentic AI Systems](https://www.usenix.org/conference/usenixsecurity26/presentation/kim-juhee-agentic) — USENIX Security 2026
**Authors**: Juhee Kim (UC Berkeley / Penn State), Wenbo Guo (Penn State), Dawn Song (UC Berkeley)

---

## Why This Paper Matters

Agentic AI systems — systems where a large language model (LLM) autonomously plans, reasons, and executes actions through tool use — are being deployed at scale. From coding assistants that modify repositories to customer service agents that access databases, the attack surface has grown far beyond what conventional LLM security addresses.

Prior work has studied individual attack vectors (prompt injection, jailbreaking) or specific defense mechanisms (guardrails, output filtering) in isolation. This SoK paper's contribution is to **systematize the entire landscape**: collecting, categorizing, and analyzing attacks and defenses in a unified framework that reveals structural relationships, coverage gaps, and unsolved problems.

The paper surveys over **200 research papers**, industry reports, and real-world incidents to build its taxonomy. It maps the full lifecycle of an agentic AI system — from input processing through planning, tool invocation, and output generation — identifying where each attack vector strikes and where each defense applies.

---

## The Agentic AI Architecture Model

Before mapping attacks and defenses, the paper establishes a reference architecture for agentic AI systems. This is critical because it provides a common vocabulary for the rest of the analysis.

### Core Components

The reference architecture consists of six key components:

1. **User Interface Layer**: Where user prompts enter the system. This includes chat interfaces, IDE integrations, API endpoints, and any mechanism through which external input reaches the agent.

2. **LLM Core**: The foundational language model that drives reasoning and planning. This is typically a frontier model (GPT-4, Claude, Gemini) or a fine-tuned open-source model.

3. **Agent Framework / Orchestrator**: The middleware that manages the agent's reasoning loop — planning, tool selection, execution, and reflection. Examples include LangChain, AutoGen, CrewAI, and custom orchestration layers.

4. **Tool Layer**: The set of external tools the agent can invoke — code execution, web browsing, file I/O, database queries, API calls, and MCP (Model Context Protocol) servers.

5. **Memory and Context**: Short-term conversation history, long-term memory stores, retrieval-augmented generation (RAG) pipelines, and shared context between agents.

6. **Output Layer**: The final response or action delivered to the user or downstream system.

Each of these components introduces its own trust boundary and potential attack surface. The genius of this paper's taxonomy is that it maps every attack to the specific component it targets and every defense to the component it protects.

---

## Attack Taxonomy

The paper organizes attacks into **six major categories**, each targeting different components of the agentic AI architecture.

### 1. Prompt Injection Attacks

Prompt injection remains the most studied and most dangerous attack vector against agentic systems. The paper further divides this into:

**Direct Prompt Injection**: The attacker directly crafts input that overrides the system prompt or task instructions. In an agentic context, this is especially dangerous because the agent may interpret injected instructions as commands to execute tools.

**Indirect Prompt Injection**: The attacker embeds malicious instructions in data that the agent retrieves — web pages, documents, emails, database entries, or API responses. Because agents autonomously fetch and process external data, indirect injection scales far beyond what's possible with chat-only LLMs.

**The agentic amplification effect**: In a traditional chat LLM, a successful prompt injection might produce harmful text. In an agentic system, the same injection can cause the agent to delete files, exfiltrate data, make unauthorized purchases, or compromise other systems. The paper documents numerous examples where seemingly innocuous indirect injections — a malicious comment in a GitHub issue, a crafted email in an inbox — led to catastrophic tool-invocation chains.

### 2. Tool Poisoning and Manipulation

A novel attack category unique to agentic systems, tool poisoning exploits the agent's dependency on external tools:

**Tool Description Manipulation**: Attackers modify the descriptions or schemas of tools available to the agent (especially relevant in MCP-based architectures), causing the agent to misuse tools or leak information through manipulated parameters.

**Malicious Tool Registration**: In multi-agent systems or open tool ecosystems, attackers register tools that appear legitimate but execute malicious operations — a supply-chain attack on the agent's tool layer.

**Tool Output Manipulation**: Even without controlling the tool itself, attackers can manipulate the data returned by tools (e.g., poisoning web search results or database records) to influence subsequent agent reasoning.

### 3. Agent Hijacking and Goal Misalignment

These attacks aim to redirect the agent's objectives away from the user's intended task:

**Goal Subversion**: Subtly altering the agent's understanding of its task so that it achieves a different objective while appearing to comply with the original request.

**Reward Hacking in Agent Loops**: In agents that use self-evaluation or reflection, attackers can manipulate the feedback loop to cause the agent to optimize for attacker-specified metrics rather than user intent.

**Multi-Agent Manipulation**: In systems with multiple interacting agents, compromising one agent can cascade through the multi-agent coordination protocol, affecting agents that share context or tools.

### 4. Information Extraction and Privacy Attacks

Agentic systems have access to sensitive data through their tools and context. The paper catalogs attacks that exploit this access:

**Context Extraction**: Extracting system prompts, tool definitions, or internal reasoning through carefully crafted queries — revealing the agent's instructions and capabilities.

**Data Exfiltration Through Tool Use**: Using tool calls to transmit stolen data — for example, encoding sensitive information in URL parameters for web requests, or in file writes to attacker-controlled locations.

**Side-Channel Attacks**: Inferring information about the agent's state or configuration through timing analysis, error message patterns, or behavioral differences.

### 5. Denial of Service and Resource Exhaustion

Agentic systems can be driven to consume excessive resources:

**Infinite Loop Induction**: Crafting inputs that cause the agent's reasoning loop to cycle indefinitely, consuming API credits, compute resources, and time.

**Resource Amplification**: Using the agent's tool access to create computationally expensive operations — spinning up cloud instances, querying large databases, or generating massive amounts of data.

### 6. Supply Chain and Infrastructure Attacks

The paper also addresses attacks on the infrastructure supporting agentic systems:

**Model Supply Chain**: Attacks on the pre-training data, fine-tuning data, or model weights that compromise the agent's core reasoning.

**Framework Vulnerabilities**: Exploiting bugs in agent orchestration frameworks (LangChain, AutoGen, etc.) to bypass security controls.

**Plugin and Extension Attacks**: Compromising third-party plugins, extensions, or MCP servers that integrate with the agent's runtime.

---

## Defense Taxonomy

The paper's defense taxonomy is organized into **five major categories**, mapped against the attack categories above.

### 1. Input Validation and Filtering

**Prompt-Based Defenses**: System prompt engineering to resist injection — including instruction defenses, warning-based approaches, and adversarial prompting.

**Input Sanitization and Detection**: Classifiers and detectors that identify potentially malicious inputs before they reach the LLM core. The paper evaluates the effectiveness of approaches like perplexity-based detection, learned classifiers, and format-constrained input parsing.

**Limitation**: The paper notes that no input-filtering approach achieves both high detection rates and low false positives. Adaptive attackers can consistently bypass these defenses through encoding, obfuscation, or novel injection techniques.

### 2. Runtime Monitoring and Guardrails

**Output Monitoring**: Real-time monitoring of agent actions and outputs to detect harmful behavior before it takes effect. This includes:

- **Action validation**: Checking each tool call against a policy before execution
- **Output classification**: Detecting harmful content in agent responses
- **Behavioral analysis**: Identifying anomalous patterns in agent behavior

**Guardrail Frameworks**: Tools like NeMo Guardrails, Llama Guard, and custom policy engines that enforce boundaries on agent behavior. The paper evaluates their effectiveness against different attack categories.

**Limitation**: Runtime monitoring faces a fundamental tension between security and functionality — overly strict guardrails prevent the agent from performing useful tasks, while permissive guardrails leave gaps that attackers can exploit.

### 3. Sandboxing and Isolation

**Execution Sandboxing**: Running the agent's tool invocations in isolated environments (containers, VMs, WebAssembly sandboxes) to limit the blast radius of compromised agents. The paper references approaches like NVIDIA's OpenShell and custom sandbox solutions.

**Permission Systems**: Limiting tool capabilities through granular permission models — restricting file paths, network destinations, API scopes, and resource limits.

**Network Isolation**: Preventing data exfiltration by controlling the agent's network access — blocking connections to attacker-controlled servers and monitoring outbound traffic.

**Limitation**: Sandboxing adds latency and complexity, and sophisticated attacks can sometimes escape or work within sandbox constraints.

### 4. Architectural Defenses

**Multi-Agent Verification**: Using separate verification agents to review the primary agent's planned actions before execution. This separation of duties model provides defense-in-depth.

**Ensemble Approaches**: Running multiple models or configurations and requiring consensus before taking sensitive actions, reducing the probability that a single injection successfully compromises the system.

**Decomposed Pipelines**: Breaking the agent's workflow into discrete stages with validation checkpoints between each stage, preventing single points of failure.

### 5. Training and Model-Level Defenses

**Adversarial Training**: Training the underlying LLM to resist prompt injection and jailbreaking through exposure to adversarial examples during fine-tuning.

**Constitutional AI and RLHF**: Alignment techniques that teach the model to refuse harmful instructions — though the paper notes these are less effective in agentic contexts where the boundary between harmful and legitimate tool use is blurry.

**Tool-Use Safety Training**: Specialized training that teaches the model to reason about the safety implications of its tool invocations, including recognizing when it's being manipulated.

---

## The Attack-Defense Gap Analysis

Perhaps the most valuable contribution of this SoK is its systematic gap analysis — identifying where defenses fall short of covering known attacks.

### Key Findings

1. **Indirect prompt injection remains largely unsolved**: While direct injection has reasonable defenses, indirect injection through retrieved data (web pages, documents, API responses) is extremely difficult to defend against because the agent must process this data to function. The paper finds that **no existing defense provides robust protection** against sophisticated indirect injection attacks.

2. **Tool poisoning is underexplored on the defense side**: The paper identifies tool poisoning and manipulation as a growing attack vector (especially with MCP adoption), but finds that **defensive research is significantly lagging** behind attack research in this area.

3. **Multi-agent systems are the wild west**: As multi-agent architectures proliferate (A2A protocols, agent swarms, collaborative systems), the attack surface multiplies, but the paper finds almost **no systematic defense research** for multi-agent interactions.

4. **Evaluation methodology is fragmented**: The paper highlights that the field lacks standardized benchmarks and evaluation methodologies for agentic AI security. Different papers use different threat models, attack strengths, and success criteria, making comparison unreliable.

5. **The adaptivity problem**: Most defenses are evaluated against non-adaptive attackers. The paper demonstrates that when attackers are allowed to adapt their strategies in response to known defenses, success rates increase dramatically — often to near-complete bypass.

---

## The Paper's Proposed Research Agenda

The authors outline several critical research directions:

### Formal Threat Modeling for Agentic AI

The paper calls for formal threat models specific to agentic systems — moving beyond the ad-hoc threat modeling currently used in most research. This includes standardized attacker capability models, defined trust boundaries, and formal security properties.

### Unified Evaluation Frameworks

A standardized benchmark suite for evaluating attacks and defenses in agentic contexts, covering multiple agent architectures, tool sets, and attack categories. This would enable meaningful comparison across different research efforts.

### Defense-in-Depth Architectures

Rather than relying on any single defense, the paper advocates for layered architectures that combine input filtering, runtime monitoring, sandboxing, and architectural defenses — with formal analysis of how these layers interact.

### Secure-by-Design Agent Frameworks

The paper argues that security should be integrated into agent frameworks from the ground up, rather than bolted on after deployment. This includes secure defaults for tool permissions, built-in monitoring hooks, and mandatory security testing in agent development pipelines.

---

## Practical Takeaways for Security Practitioners

While the paper is academic in scope, its findings translate directly to practical guidance:

### For Developers Building Agentic Systems

- **Never trust retrieved data**: Treat all data fetched by an agent (web pages, documents, API responses) as potentially malicious. Implement sanitization before the data enters the agent's context.
- **Apply least-privilege to tool access**: Grant agents only the minimum tool capabilities needed for their task. A code-review agent doesn't need network access; a research agent doesn't need file deletion.
- **Implement runtime monitoring**: Every tool invocation should be logged, validated against a policy, and subject to human review for high-risk operations.
- **Use sandboxed execution**: Run agents in isolated environments with resource limits. Never allow agents to execute tools on production systems without containment.

### For Security Teams Evaluating Agentic AI

- **Test for indirect injection**: Don't just test whether the agent refuses direct harmful requests — test whether malicious data in retrieved documents, emails, or web pages can manipulate agent behavior.
- **Audit the tool layer**: Every tool the agent can access is an attack surface. Audit tool definitions, permissions, and data flows.
- **Monitor for data exfiltration patterns**: Watch for agents encoding sensitive data in URL parameters, file paths, or other covert channels.
- **Plan for adaptive threats**: Don't assume that defenses that work against known attack patterns will hold against novel or adaptive attacks.

### For Leadership Approving Agentic AI Deployments

- **Understand the risk amplification**: An agentic AI deployment is not just a chatbot — it's an autonomous system with potentially broad access to your infrastructure. Treat it with the same rigor you'd apply to any privileged automation.
- **Invest in security testing**: Budget for red teaming, penetration testing, and continuous monitoring of agentic AI systems.
- **Stay current**: The field is moving rapidly. Attack techniques that were theoretical six months ago are being exploited today.

---

## Context Within the Broader Landscape

This SoK paper arrives at a pivotal moment. The same USENIX Security 2026 conference features complementary work on AI agent security, including Microsoft's RAMPART and Clarity tools for CI/CD-integrated agent safety testing. The OWASP Agentic AI Threats and Mitigations guide and the CSA's Maestro framework provide industry-level threat modeling that aligns closely with the taxonomy established in this paper.

The paper also builds on foundational work from the same research group — Dawn Song's lab at UC Berkeley has been at the forefront of AI security research, and this SoK represents a mature synthesis of insights developed over years of studying adversarial ML and AI system security.

---

## Conclusion

"SoK: Attack and Defense Landscape of Agentic AI Systems" is a landmark contribution that provides the field with its first comprehensive map of the threat landscape. Its value lies not just in cataloging what's known, but in honestly identifying what's unknown — the critical gaps where attackers have the advantage and defenders are flying blind.

The central message is clear: **agentic AI systems introduce a fundamentally different security paradigm than traditional LLMs**, and the current state of defenses is insufficient to match the growing sophistication of attacks. As agentic systems become more capable and more widely deployed, the security community must invest in the rigorous, systematic defense research that this paper calls for.

For anyone working in AI security — whether as a researcher, developer, or practitioner — this paper is essential reading. It provides the conceptual framework needed to reason about agentic AI security, identifies the most critical problems to solve, and establishes a research agenda that will shape the field for years to come.

---

*This analysis covers the SoK paper presented at USENIX Security 2026. For the full paper, visit the [USENIX publication page](https://www.usenix.org/conference/usenixsecurity26/presentation/kim-juhee-agentic). For related coverage of agentic AI security tools and frameworks, see our posts on [agent runtime security](/posts/agent-runtime-security-sandboxing), [MCP security scanning](/posts/mcp-security-scanning-gateway-audit-tools), and [AI defense controls](/posts/ai-defense-security-controls-guardrails).*
