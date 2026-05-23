---
author: Anubhav Gain
pubDatetime: 2026-05-19T18:31:00+05:30
modDatetime: 2026-05-19T18:31:00+05:30
title: "Redefining Agent Security: Why We Need a Holistic Framework for AI Agent Safety"
slug: agent-security-holistic-framework-redefinition
featured: false
draft: false
tags:
  - ai-security
  - agent-security
  - holistic-framework
  - icml
  - security-taxonomy
category: AI Research
description: A position paper arguing that current approaches to AI agent security are fragmented and proposing a unified holistic framework for comprehensive agent safety.
---

# Redefining Agent Security: Why We Need a Holistic Framework for AI Agent Safety

The field of AI agent security is growing rapidly — but it is growing in the wrong direction. Research papers, benchmarks, defense mechanisms, and threat taxonomies are proliferating at breakneck speed, yet the community lacks a unifying framework that connects these pieces into a coherent whole. Individual contributions advance narrow frontiers while leaving structural gaps that attackers can exploit with impunity. At **ICML 2026**, **Vincent Siu**, **Jingxuan He**, **Kyle Montgomery**, **Zhun Wang**, **Chenguang Wang**, and **Dawn Song** present a position paper that confronts this problem head-on: **"Position: Agent Security Needs Redefinition through a Holistic Framework."** Their argument is both timely and essential — without a principled, systems-level rethinking of how we define, evaluate, and enforce agent security, the community risks building an arsenal of disconnected defenses that collectively fail to protect real-world deployments.

**Paper**: [Position: Agent Security Needs Redefinition through a Holistic Framework](https://icml.cc/virtual/2026/poster/67194) — ICML 2026
**Authors**: Vincent Siu, Jingxuan He, Kyle Montgomery, Zhun Wang, Chenguang Wang, Dawn Song (UC Berkeley)

---

## Introduction: The Urgency of Getting Agent Security Right

AI agents are no longer research prototypes — they are production infrastructure. From autonomous coding assistants that modify production repositories to financial agents that execute trades, from customer support agents with database access to research agents that browse the web and execute code, agentic systems are being deployed at scale across every sector. The architectural shift from static language models that generate text to autonomous agents that plan, reason, and act in the real world has fundamentally transformed the threat landscape.

A jailbroken chatbot might produce offensive text. A jailbroken agent with tool access can execute arbitrary code, exfiltrate sensitive data, manipulate databases, and cause real-world harm. The stakes have escalated by orders of magnitude, yet the security paradigm has not kept pace.

The position paper by Siu et al. makes a deceptively simple observation: **the current approach to agent security is fundamentally fragmented**. Researchers study prompt injection in isolation, jailbreaking as a standalone problem, tool poisoning as a separate concern, and runtime monitoring as yet another independent challenge. Each community develops its own benchmarks, threat models, and evaluation metrics. The result is a patchwork of point defenses that may individually perform well on their respective benchmarks but collectively leave dangerous gaps — gaps that are invisible when you evaluate components in isolation but painfully obvious when you examine the full agent system.

This paper's central contribution is not a new defense mechanism or benchmark. It is something arguably more valuable at this stage of the field's evolution: a **clear articulation of why the current paradigm is broken and a principled vision for what should replace it**. Position papers at top venues like ICML serve a critical function — they don't just report experimental results, they reshape how a community thinks about a problem.

---

## Problems with Current Agent Security

The paper identifies several structural deficiencies in how the research community currently approaches agent security. These are not minor gaps that can be filled with incremental improvements; they are foundational issues that require a paradigm shift.

### Fragmented Threat Modeling

Current agent security research tends to adopt narrow threat models tailored to specific attack vectors. A paper on prompt injection studies adversarial instructions embedded in user inputs. A paper on tool poisoning examines malicious tool descriptions. A paper on memory corruption looks at adversarial context manipulation. Each threat model makes simplifying assumptions about what the attacker can and cannot do — assumptions that often conflict with or ignore the assumptions made by adjacent work.

In practice, a real-world attacker is not constrained to using a single technique. A sophisticated adversary will combine prompt injection with tool poisoning, leverage multi-turn conversation dynamics to erode safety guardrails, exploit information flows between components, and target the weakest link in the agent's architecture. When threat models are fragmented, no single defense accounts for these combinatorial attacks, and the aggregate security of the system is far weaker than the security of any individual component.

### Inconsistent Terminology and Taxonomy

The paper highlights a surprising but critical problem: the community does not even agree on basic definitions. Terms like "prompt injection," "jailbreaking," "safety bypass," "guardrail evasion," and "alignment violation" are used inconsistently across papers, sometimes interchangeably and sometimes with subtly different meanings. This is not merely a pedantic concern — it has concrete consequences for research progress.

When two papers use "prompt injection" to mean different things, their results become incomparable. When a defense paper claims to address "jailbreaking" without precisely specifying what attacks fall within that scope, it is impossible to determine whether the defense generalizes. The absence of a shared vocabulary fragments not just the research but the evaluation, making it impossible to build cumulative knowledge.

### Point Evaluations Without System-Level Assessment

Most agent security evaluations test a single defense against a single attack category on a single benchmark. A prompt injection defense is evaluated on prompt injection benchmarks. A tool-use safety mechanism is tested against tool-specific attack suites. This component-by-component evaluation approach is deeply misleading for two reasons.

First, it fails to capture **compositional effects**. A defense that works in isolation may fail when composed with other defenses due to unexpected interactions. Conversely, defenses that appear weak individually may synergize effectively when combined. Without system-level evaluation, these dynamics remain invisible.

Second, it ignores **attack surface expansion**. Every new component added to an agent system — a tool, a memory module, a planning subsystem, a retrieval pipeline — introduces new attack surfaces. The total attack surface of an agent system is not the sum of its component attack surfaces; it is a combinatorial function of the interactions between components. Evaluating components in isolation fundamentally cannot capture this.

### Misaligned Incentives Between Research and Deployment

The paper identifies a growing disconnect between academic security research and real-world deployment needs. Academic research incentives favor novelty — new attack techniques, new defense mechanisms, new benchmarks. Deployment needs favor robustness — comprehensive coverage, reliable performance under distribution shift, graceful degradation under novel attacks.

This misalignment produces a research landscape rich in novel contributions but poor in deployable security. Organizations deploying agents in production cannot assemble a coherent defense strategy from papers that each address one narrow aspect of the problem with different assumptions, different evaluation setups, and different threat models. The gap between "published defense" and "production-ready security" grows wider with each new paper.

### Absence of Formal Security Guarantees

Unlike mature security domains (cryptography, access control, information flow), AI agent security currently operates almost entirely in an empirical regime. Defenses are evaluated by measuring attack success rates against known attack sets. There are no formal security properties, no compositional guarantees, no way to reason about what a defense provably prevents versus what it merely makes empirically harder.

This is a fundamental limitation. Empirical evaluation can show that a defense works against tested attacks, but it cannot provide assurance about untested attacks. In a domain where the threat landscape evolves as rapidly as AI itself, this empirical-only approach leaves defenders perpetually one step behind.

---

## The Case for a Holistic Framework

Given these structural problems, the paper argues that the field needs what it calls a **holistic framework** for agent security — a unified conceptual and practical architecture that addresses the full lifecycle, full attack surface, and full range of security concerns for AI agents.

### Why "Holistic" Matters

The word "holistic" is chosen deliberately. It does not merely mean "comprehensive" — it means recognizing that agent security is an **emergent property of the system as a whole**, not a property that can be decomposed into independent sub-properties. This is analogous to how security works in traditional software systems: the security of a web application is not the security of its authentication module plus the security of its input validation plus the security of its database layer. It is the security of how these components interact under adversarial pressure.

For AI agents, this means that a framework must account for:

- **Cross-component attack flows**: An attack that begins at the user input layer, propagates through the planning module, and manifests as a malicious tool invocation.
- **Cross-turn temporal dynamics**: Attack strategies that unfold over multiple conversation turns, exploiting context accumulation and safety drift.
- **Cross-agent interactions**: In multi-agent systems, attacks that leverage the trust relationships and information flows between agents.
- **Cross-environment dependencies**: Attacks that exploit the agent's interaction with external systems — APIs, databases, file systems, and other tools.

A holistic framework must treat these as aspects of a single integrated problem, not as separate research topics.

### Learning from Mature Security Disciplines

The paper draws instructive parallels with mature security disciplines that have undergone similar paradigm shifts:

- **Network security** evolved from perimeter-based defenses (firewalls) to defense-in-depth architectures that assume breach and layer multiple complementary controls.
- **Software security** moved from bug-finding to secure development lifecycles that integrate security at every stage from design to deployment.
- **Cryptographic protocol design** shifted from designing individual primitives in isolation to proving security of entire protocols under well-defined adversarial models.

In each case, the field recognized that point defenses were insufficient and developed holistic frameworks that addressed the full system. Agent security, the paper argues, is at the same inflection point.

---

## Proposed Framework Components

While the paper is positioned as a vision statement rather than a complete technical solution, it outlines the key components that a holistic agent security framework must include.

### 1. Unified Threat Model

A shared threat model that encompasses the full range of adversarial capabilities and attack surfaces relevant to AI agents. This includes:

- **Attacker capabilities**: What the adversary can control (user inputs, tool outputs, environment state, communication channels).
- **Attacker knowledge**: What the adversary knows about the agent's architecture, prompts, tools, and defenses (white-box vs. black-box vs. gray-box).
- **Attacker goals**: What the adversary aims to achieve (information exfiltration, unauthorized actions, service disruption, safety bypass).
- **Attack surfaces**: The complete set of interfaces through which adversarial influence can enter the system.

A unified threat model enables meaningful comparison across defenses, compositional reasoning about security properties, and systematic identification of coverage gaps.

### 2. Comprehensive Attack Taxonomy

A standardized taxonomy that classifies attacks along multiple dimensions:

- **Entry point**: Where the adversarial input enters (user prompt, tool output, memory/context, system prompt, external environment).
- **Mechanism**: How the attack works (direct prompt injection, indirect injection via tool outputs, adversarial examples, data poisoning, context manipulation).
- **Target**: What component or behavior is affected (planning, tool selection, output generation, safety classification, memory).
- **Temporal dynamics**: Whether the attack is single-turn or multi-turn, and how it exploits temporal properties.
- **Required access**: What level of access or privilege the attacker needs.

Such a taxonomy provides the shared vocabulary the community desperately needs and enables systematic mapping of which attacks are covered by which defenses.

### 3. System-Level Security Properties

Formal or semi-formal security properties that can be stated at the system level, not just the component level. Examples might include:

- **Confidentiality**: The agent shall not exfiltrate sensitive information to unauthorized parties, regardless of the attack vector.
- **Integrity**: The agent shall not execute unauthorized actions, as defined by a security policy.
- **Availability**: The agent shall maintain operational capability under adversarial conditions.
- **Auditability**: All agent actions and decisions shall be logged in a manner that supports post-hoc security analysis.

These properties must be defined precisely enough to be testable and must be composable — the security of the system should be derivable from the security properties of its components and their interactions.

### 4. Layered Defense Architecture

A defense architecture that addresses every layer of the agent stack, from input processing through planning, tool execution, and output generation. The paper envisions multiple defense layers operating in concert:

- **Input sanitization and validation**: Filtering and transforming inputs to remove adversarial content before it reaches the LLM core.
- **Prompt hardening**: Structuring system prompts and context to resist manipulation, including techniques like prompt sandboxing, instruction isolation, and delimiter enforcement.
- **Planning constraint enforcement**: Monitoring and constraining the agent's planning process to prevent harmful goal decomposition or plan manipulation.
- **Tool-use mediation**: Interposing security monitors between the agent and its tools to validate tool invocations, enforce access policies, and detect anomalous usage patterns.
- **Output filtering and verification**: Checking agent outputs against safety policies before delivery to the user or execution environment.
- **Runtime monitoring and anomaly detection**: Continuous monitoring of the agent's internal state and behavior patterns to detect adversarial manipulation in real time.
- **Memory and context protection**: Protecting the agent's memory and context stores from adversarial manipulation, including integrity verification for retrieved information.

The key insight is that these layers are not independent — they must be designed to work together, share information, and provide defense-in-depth. A failure at one layer should be caught by the next.

### 5. Compositional Evaluation Methodology

An evaluation framework that tests security at the system level, not just the component level. This includes:

- **Multi-vector attack scenarios**: Evaluation scenarios that combine multiple attack techniques in realistic adversarial campaigns.
- **Cross-component interaction testing**: Explicit testing of security properties at the boundaries and interactions between components.
- **Temporal evaluation**: Assessment of how security properties hold or degrade over multi-turn interactions.
- **Adaptive adversary evaluation**: Testing against adversaries who can observe and adapt to the deployed defenses (red-team evaluation).
- **Regression testing**: Continuous re-evaluation as the agent system evolves, to ensure that security properties are maintained across changes.

### 6. Standardized Benchmarks and Metrics

A benchmark suite that enables meaningful comparison across different approaches and covers the full spectrum of agent security concerns:

- **Coverage metrics**: What fraction of the attack taxonomy is addressed by a given defense?
- **Robustness metrics**: How does defense performance degrade under adaptive attacks and distribution shift?
- **System-level metrics**: What is the end-to-end security posture of the full agent system, not just individual components?
- **Efficiency metrics**: What is the computational and latency overhead of the defense, and is it practical for deployment?

---

## Key Principles

The paper articulates several foundational principles that should guide the development of a holistic agent security framework.

### Principle 1: Security as a System Property

Agent security must be evaluated and enforced at the system level. Individual component security is necessary but not sufficient. The framework must account for compositional effects, interaction vulnerabilities, and emergent attack strategies that arise from the interplay of multiple components.

### Principle 2: Defense-in-Depth

No single defense mechanism can provide comprehensive security against the full range of agent attacks. The framework must layer multiple complementary defenses, each addressing different aspects of the threat landscape, and must be designed so that the failure of any single layer does not compromise the system.

### Principle 3: Formal Grounding Where Possible

While full formal verification of AI agent security may be infeasible in the near term, the framework should strive for formal or semi-formal grounding of security properties. This includes precise definitions of what security means, formal threat models, and whenever possible, provable guarantees about defense behavior.

### Principle 4: Practical Deployability

A framework that is theoretically sound but impractical to deploy serves the research community but not the broader goal of securing real-world AI systems. The framework must account for performance constraints, operational complexity, and the realities of production environments. Security mechanisms that impose prohibitive latency, cost, or complexity overheads will not be adopted.

### Principle 5: Adaptability and Extensibility

The agent security landscape is evolving rapidly. New attack techniques emerge monthly, new agent architectures introduce new attack surfaces, and new deployment scenarios create new threat models. The framework must be designed to accommodate this evolution — it must be extensible to cover new attack vectors, adaptable to new architectures, and maintainable as the field advances.

### Principle 6: Shared Vocabulary and Standards

Progress requires a common language. The framework must establish and maintain standardized definitions, taxonomies, and evaluation protocols that enable meaningful comparison and composition of results across research groups and organizations.

### Principle 7: Adversarial Realism

Evaluations must assume realistic adversaries who are adaptive, strategic, and capable of combining multiple techniques. Benchmarks that test against static attack sets provide a lower bound on vulnerability; the framework must push toward adaptive evaluation that reflects real adversarial behavior.

---

## Research Roadmap

The paper does not just diagnose problems — it outlines a concrete research roadmap for building the holistic framework it envisions. This roadmap is organized into near-term, medium-term, and long-term priorities.

### Near-Term (1–2 Years)

- **Develop a unified attack taxonomy** for agent security, building on existing taxonomies from the SoK literature but extending them to cover cross-component and cross-temporal attack strategies.
- **Establish standardized benchmark suites** that evaluate system-level security, not just component-level defenses, across a representative range of agent architectures and deployment scenarios.
- **Create a shared vocabulary and formal definitions** for core agent security concepts, enabling meaningful comparison across research contributions.
- **Catalog coverage gaps** in existing defenses by mapping current defenses against the unified attack taxonomy to identify systematically under-defended attack surfaces.

### Medium-Term (2–4 Years)

- **Design and prototype layered defense architectures** that integrate multiple complementary defenses into a coherent system, with explicit attention to defense composition and interaction effects.
- **Develop compositional evaluation methodologies** that can assess the security of an agent system as a whole, including interactions between defense layers.
- **Investigate formal security properties** for agent systems, including information flow properties, access control guarantees, and behavioral invariants that can be verified at deployment time.
- **Build open-source reference implementations** of the holistic framework, enabling the community to test, extend, and deploy the framework in practice.
- **Study multi-agent security** — the security implications of agents interacting with each other, including trust propagation, information sharing, and coordinated attack and defense.

### Long-Term (4+ Years)

- **Develop formal verification techniques** for agent security properties, enabling provable guarantees about agent behavior under adversarial conditions.
- **Establish certification and compliance standards** for agent security, analogous to security certifications in other domains (FIPS for cryptography, SOC 2 for cloud services).
- **Integrate security-by-design principles** into the agent development lifecycle, so that security is not an afterthought but a foundational aspect of agent architecture.
- **Build adaptive defense systems** that can detect and respond to novel attack strategies in real time, learning from observed adversarial behavior to strengthen defenses dynamically.
- **Address the socio-technical dimensions** of agent security, including the human factors, organizational processes, and regulatory frameworks needed to ensure responsible deployment.

---

## Conclusion: A Necessary Inflection Point

The position paper by Siu, He, Montgomery, Wang, Wang, and Song arrives at a critical moment in the evolution of AI agent security. The field has accumulated a substantial body of knowledge about individual attack vectors and defense mechanisms, but this knowledge remains fragmented — a collection of specialized solutions to narrow problems rather than a coherent architecture for comprehensive agent safety.

The paper's central argument — that agent security needs redefinition through a holistic framework — is both a critique of the status quo and a vision for the future. The critique is sharp and well-founded: fragmented threat models, inconsistent terminology, point evaluations, misaligned incentives, and the absence of formal guarantees collectively undermine the community's ability to secure real-world agent deployments. The vision is ambitious but actionable: a unified framework built on shared definitions, comprehensive taxonomies, layered defenses, system-level evaluation, and formal grounding.

What makes this paper particularly significant is its authorship. Dawn Song's group at UC Berkeley has been at the forefront of AI security research for years, contributing foundational work on adversarial examples, privacy-preserving machine learning, and the security of agentic AI systems. When a group with this track record argues that the community's current approach is structurally insufficient, the argument demands serious attention.

The transition from point defenses to holistic security frameworks has occurred in every mature security discipline, from network security to software assurance to cryptographic protocol design. Each transition was driven by the recognition that sophisticated adversaries exploit the gaps between point defenses, and that true security requires a systems-level perspective. Agent security is now at this same inflection point.

As AI agents become more capable, more autonomous, and more deeply integrated into critical infrastructure, the cost of getting security wrong grows exponentially. The holistic framework proposed in this paper is not just a research agenda — it is a necessity. The question is no longer whether the field needs such a framework, but how quickly we can build one.

---

*This post discusses the position paper "Position: Agent Security Needs Redefinition through a Holistic Framework" by Vincent Siu, Jingxuan He, Kyle Montgomery, Zhun Wang, Chenguang Wang, and Dawn Song, presented at ICML 2026. The paper is available at [ICML 2026 Poster #67194](https://icml.cc/virtual/2026/poster/67194).*
