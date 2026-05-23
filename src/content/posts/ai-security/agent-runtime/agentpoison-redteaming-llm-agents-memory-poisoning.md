---
author: Anubhav Gain
pubDatetime: 2026-05-18T17:14:00+05:30
modDatetime: 2026-05-18T17:14:00+05:30
title: "AgentPoison: Red-Teaming LLM Agents via Memory and Knowledge Base Poisoning"
slug: agentpoison-redteaming-llm-agents-memory-poisoning
featured: false
draft: false
tags:
  - ai-security
  - agent-poisoning
  - memory-poisoning
  - neurips
  - red-teaming
category: AI Research
description: How poisoning the memory and knowledge bases of LLM agents can lead to devastating adversarial attacks on agentic AI systems.
---

## The Memory Problem in LLM Agents

Large language model agents are no longer stateless text generators. Modern agentic systems maintain persistent memory — conversation logs, long-term user preferences, retrieved documents, and structured knowledge bases — that they consult across sessions and tasks. This memory is what makes agents genuinely useful: a coding assistant that remembers your project's architecture, a research agent that accumulates findings across multiple queries, a customer service bot that retains context from prior interactions.

But persistent memory is also a persistent attack surface. Every piece of information an agent stores and later retrieves is a potential vector for adversarial manipulation. If an attacker can inject malicious content into an agent's memory or knowledge base, they can influence the agent's behaviour long after the initial compromise — across sessions, across tasks, and across users.

**AgentPoison**, presented at NeurIPS 2024 by Zhaorun Chen and colleagues from the University of Illinois Urbana-Champaign, the University of Chicago, and the University of Texas at Austin, provides a systematic framework for understanding and exploiting this vulnerability. The paper demonstrates that poisoning an agent's memory or knowledge base is not only feasible but remarkably effective — achieving attack success rates exceeding 80% across multiple agent platforms and tasks — while remaining virtually undetectable.

**Paper**: [AgentPoison: Red-teaming LLM Agents via Poisoning Memory or Knowledge Bases](https://arxiv.org/abs/2407.12784) — NeurIPS 2024
**Authors**: Zhaorun Chen, Zhen Xiang, Tianxing He, Di Jin, Suman Banerjee, Bo Li, Chaowei Xiao, David Liebling, Lakshminarayanan Subramanian

---

## Why Memory Poisoning Is a Distinct Threat

Before diving into AgentPoison's methodology, it is important to understand why memory poisoning represents a qualitatively different threat from previously studied attack vectors like prompt injection or jailbreaking.

### Persistence and Propagation

A direct prompt injection is a transient attack — it affects a single interaction and requires the attacker to be present during that interaction. Memory poisoning, by contrast, is **persistent**. A single successful poisoning event can influence every subsequent interaction the agent has, potentially for days, weeks, or indefinitely. The poisoned memory becomes part of the agent's operational context, consulted and relied upon as if it were legitimate information.

### Cross-Task Contamination

Modern agents perform multiple tasks using shared memory. A coding agent might use the same knowledge base to answer questions about architecture, write tests, debug code, and review pull requests. If that knowledge base is poisoned, the malicious content can contaminate every one of these tasks — not just the task the attacker originally targeted. This cross-task propagation amplifies the impact of a single poisoning event far beyond what's possible with per-query attacks.

### Stealth

Memory poisoning can be extraordinarily difficult to detect. The poisoned content is not obviously malicious — it appears as legitimate memory entries or knowledge base documents. It does not trigger input sanitization because it enters the memory through normal agent operations (processing a document, summarizing a web page, storing a user preference). And because the attack manifests only when the agent later retrieves and acts on the poisoned content, the connection between cause and effect can be separated by significant time and many intervening interactions.

### Supply Chain Dynamics

Agent memory and knowledge bases are often populated from external sources — web pages the agent crawls, documents users upload, databases the agent queries, or even other agents' outputs. This creates a supply chain where the integrity of the agent's knowledge depends on the integrity of every upstream source. An attacker who compromises any source in this chain can poison the agent's memory without ever directly interacting with it.

---

## AgentPoison's Attack Framework

AgentPoison provides a unified framework for poisoning two critical components of agent systems: long-term memory and retrieval-augmented generation (RAG) knowledge bases. The approach is notable for its optimization-driven methodology — rather than manually crafting poisoning payloads, AgentPoison uses a novel constrained optimization technique to generate poisoned text that is both highly effective at manipulating agent behaviour and semantically coherent enough to evade detection.

### Attack Surface Analysis

The paper identifies two primary attack surfaces:

**Long-Term Memory Poisoning**: Many agent frameworks (e.g., AutoGen, LangChain) maintain long-term memory stores where agents record observations, insights, and task-relevant information across sessions. When an agent encounters a new task, it retrieves relevant memories to inform its reasoning. If these memories contain poisoned content, the agent's decision-making is compromised at the foundation.

**RAG Knowledge Base Poisoning**: Retrieval-augmented generation is the dominant paradigm for giving agents access to large knowledge corpora. The agent's knowledge base contains documents that are retrieved and injected into the agent's context based on relevance to the current query. Poisoning even a small number of documents in this knowledge base can cause the agent to retrieve and act on malicious content when relevant queries arise.

### The Optimization Problem

The core technical innovation in AgentPoison is formulating memory poisoning as a constrained optimization problem. The attacker wants to:

1. **Maximize attack effectiveness**: The poisoned content should cause the agent to perform the attacker's desired behaviour (e.g., generating harmful outputs, exfiltrating data, making incorrect decisions)
2. **Maintain semantic coherence**: The poisoned text should read naturally and not be obviously anomalous, to evade manual inspection and automated detection
3. **Ensure retrievability**: The poisoned content must be retrieved by the agent's retrieval system when relevant queries arise, which means it must be semantically similar to legitimate queries in the target domain

AgentPoison solves this optimization problem using a novel approach that leverages the differentiable nature of neural retrieval systems. By computing gradients through the retrieval mechanism, the system can craft poisoned text that is specifically optimized to be retrieved for target queries while carrying the attacker's payload.

### Poisoned Text Generation

The actual generation of poisoned text follows a two-stage process:

**Stage 1: Retriever Optimization.** AgentPoison first optimizes a poisoned text fragment to maximize its retrieval score for the attacker's target queries. This involves understanding the specific retrieval model the agent uses (e.g., a dense passage retriever based on sentence transformers) and crafting text that scores highly on the retriever's relevance function. The optimization uses gradient-based methods, treating the retriever as a differentiable function and computing gradients of the retrieval score with respect to the text embedding.

**Stage 2: Payload Integration.** Once the retriever-optimized text fragment is generated, the attacker's payload is integrated into it. The payload consists of adversarial instructions that, when processed by the agent's LLM core, cause the agent to deviate from its intended behaviour. The key constraint is that the payload must be woven into the text naturally enough that it does not degrade the text's retrieval score or trigger anomaly detection.

### Adaptation to Different Retrieval Systems

A significant strength of AgentPoison is its adaptability to different retrieval architectures. The paper demonstrates attacks against:

- **Dense retrievers** (e.g., based on sentence-BERT or Contriever embeddings)
- **Sparse retrievers** (e.g., BM25)
- **Hybrid retrieval systems** that combine dense and sparse methods

For dense retrievers, AgentPoison directly optimizes the embedding of the poisoned text to be close to target query embeddings in the retrieval space. For sparse retrievers like BM25, the optimization adapts to maximize term overlap with likely queries while maintaining natural language fluency. For hybrid systems, a combined optimization balances both objectives.

---

## Experimental Evaluation

The paper's experimental evaluation is comprehensive, testing AgentPoison across four different agent frameworks and five different tasks. The results paint a concerning picture of agent vulnerability.

### Agent Platforms Tested

AgentPoison is evaluated against:

1. **LangChain-based agents** with RAG knowledge bases
2. **AutoGen agents** with long-term memory
3. **LlamaIndex agents** with document stores
4. **Custom agent frameworks** built on GPT-4 and Claude

This diversity of targets demonstrates that the vulnerability is not specific to a particular agent framework but is a systemic property of agents that rely on retrieved context.

### Tasks and Attack Objectives

The paper tests attacks across five task domains:

- **Question answering**: Poisoning the knowledge base to inject incorrect answers to factual questions
- **Code generation**: Poisoning memory to cause the agent to generate vulnerable code
- **Data analysis**: Poisoning to cause incorrect analytical conclusions
- **Web browsing**: Poisoning stored web content to mislead the agent's information gathering
- **Multi-step planning**: Poisoning to redirect the agent's plan toward attacker-specified goals

### Key Results

The experimental results are striking:

**Attack Success Rate (ASR)**: AgentPoison achieves ASR of **over 80%** across most task-domain combinations, with some exceeding **90%**. This means that the vast majority of the time, the poisoned agent successfully performs the attacker's desired behaviour when encountering relevant queries.

**Low Poisoning Ratio**: These high success rates are achieved by poisoning only **a small fraction** (often less than 1-5%) of the total memory or knowledge base entries. The optimization ensures that the poisoned entries are precisely targeted to be retrieved for the attacker's target queries.

**Stealth Metrics**: The poisoned text achieves high semantic similarity scores with legitimate content, making it difficult to distinguish from normal entries using automated anomaly detection. Human evaluators in the study frequently could not identify which entries were poisoned.

**Cross-Model Transfer**: Poisoned content generated for one LLM backend often transfers effectively to others. Poisoning optimized for GPT-3.5 shows significant effectiveness against GPT-4, Claude, and open-source models, suggesting that the vulnerability is not model-specific but is inherent in the retrieval-augmented architecture.

### Comparison with Baselines

AgentPoison is compared against several baseline attack approaches:

- **Random injection**: Injecting random text with adversarial instructions
- **Manual crafting**: Human-crafted poisoning content
- **Gradient-based prompt optimization**: Using existing jailbreaking optimization techniques without retriever awareness

AgentPoison consistently outperforms all baselines, often by large margins. The key differentiator is the retriever-aware optimization — by ensuring the poisoned content is actually retrieved for target queries, AgentPoison converts potential attacks into reliable ones.

---

## Technical Deep Dive: The Retrieval Optimization

The most technically novel aspect of AgentPoison is its approach to optimizing poisoned text for retrieval. Understanding this requires some familiarity with how retrieval-augmented agents work.

### How Agent Retrieval Works

When an agent receives a query, it:

1. Encodes the query into a vector using an embedding model
2. Searches the knowledge base for documents whose embeddings are closest to the query embedding (typically using cosine similarity)
3. Retrieves the top-k most similar documents
4. Injects these documents into the LLM's context window as "relevant knowledge"
5. The LLM processes the query along with the retrieved documents to generate a response

The critical insight is that the retrieval step is based on **embedding similarity**. If the attacker can craft text whose embedding is close to the target query's embedding, it will be retrieved. And if the retrieved text contains adversarial instructions, those instructions enter the LLM's context with the full authority of "retrieved knowledge."

### Gradient-Based Optimization

AgentPoison exploits the differentiability of the embedding model. Starting with an initial text (which could be a legitimate-looking document), the system:

1. Encodes the current text into an embedding
2. Computes the loss as the negative similarity between the text embedding and the target query embedding
3. Backpropagates through the embedding model to compute gradients with respect to the text's token embeddings
4. Uses these gradients to identify which tokens to modify and how to modify them

The optimization operates in the token embedding space, using techniques adapted from the adversarial suffix literature (similar to GCG optimization) but with a retrieval-specific objective function.

### Handling Discrete Text

A fundamental challenge is that text is discrete while gradient optimization operates in continuous space. AgentPoison handles this through a search-and-replace strategy:

1. Compute gradient magnitudes for each token position in the poisoned text
2. Identify the token positions with the largest gradient magnitudes (i.e., where changes would most improve retrieval score)
3. Search over candidate replacements at those positions, selecting the replacement that maximizes the retrieval score while maintaining fluency
4. Iterate until convergence or a maximum number of modifications

This approach is computationally efficient and produces text that maintains semantic coherence because each replacement is evaluated for both retrieval quality and language fluency.

---

## Defence Analysis and Countermeasures

The paper does not merely demonstrate attacks — it also evaluates potential defences and analyses their limitations.

### Retrieval-Time Defences

**Perplexity filtering**: Checking whether retrieved documents have anomalously high or low perplexity (indicating they may be adversarially optimized). AgentPoison's optimized text achieves perplexity scores within the normal range, making this filter ineffective.

**Semantic consistency checking**: Verifying that retrieved documents are semantically consistent with other retrieved documents and with the known corpus statistics. AgentPoison partially evades this because the poisoned text is designed to be semantically similar to legitimate queries, but the paper notes that more sophisticated consistency checks could provide some protection.

**Deduplication and provenance tracking**: Ensuring that knowledge base entries come from verified sources and tracking their provenance. This is a structural defence that addresses the root cause but is challenging to implement in open environments where agents ingest content from diverse, untrusted sources.

### Agent-Level Defences

**Instruction hardening**: Modifying the agent's system prompt to instruct it to be cautious about acting on retrieved information, to cross-reference claims across multiple sources, and to flag suspicious content. The paper finds that while instruction hardening reduces attack success rates somewhat, AgentPoison can often craft payloads that circumvent these instructions — a predictable result given the well-documented weakness of instruction-based defences against determined adversaries.

**Output monitoring**: Checking the agent's final output for evidence of compromised behaviour. This is a necessary but insufficient defence: it can detect successful attacks after they occur but cannot prevent them, and sophisticated attacks can be designed to produce outputs that are difficult to distinguish from legitimate agent behaviour.

**Retrieval diversification**: Retrieving from multiple independent sources and requiring consensus before acting on retrieved information. This is one of the more promising defences evaluated — it significantly reduces attack success rates when the attacker can poison only a single source — but it is defeated when the attacker can poison multiple sources or when the agent has limited access to diverse information sources.

### The Fundamental Tension

The paper identifies a fundamental tension at the heart of retrieval-augmented agents: **the agent must trust its retrieved context to be useful, but this trust is exactly what memory poisoning exploits.** Any defence that reduces the agent's reliance on retrieved context also reduces the agent's effectiveness. This creates a difficult trade-off between capability and security that has no clean resolution.

---

## Broader Implications

### For Agent Developers

AgentPoison has immediate, practical implications for anyone building or deploying LLM agents:

1. **Treat all stored memory and knowledge as untrusted.** Agent frameworks should implement integrity checking for memory entries and knowledge base documents, similar to how operating systems verify code signatures before execution.

2. **Implement retrieval-layer security.** The retrieval step should include anomaly detection, provenance checking, and potentially adversarial training to make the retriever more robust against optimized poisoning.

3. **Monitor for behavioural anomalies.** Continuous monitoring of agent behaviour across sessions can detect the patterns that emerge from memory poisoning — systematic biases in outputs, unexpected tool calls, or consistent deviations from expected behaviour.

4. **Design for compartmentalization.** Different types of memory (conversational, task-specific, long-term) should be isolated so that poisoning one does not contaminate all agent operations.

### For the Research Community

AgentPoison opens several important research directions:

- **Robust retrieval systems** that are inherently resistant to optimization-based poisoning, potentially through adversarial training or certified robustness guarantees
- **Memory integrity verification** techniques that can detect poisoned entries without false positives on legitimate content
- **Agent architectures** that are designed from the ground up to operate safely even when some of their knowledge is adversarial
- **Formal security models** for retrieval-augmented agents that define precise threat models and security guarantees

### For AI Safety

The memory poisoning threat has particular relevance for AI safety. As agents become more capable and are deployed in higher-stakes environments, the consequences of compromised memory grow correspondingly. An agent that makes financial decisions, manages infrastructure, or provides medical advice is only as reliable as the memory it draws upon. AgentPoison demonstrates that this memory can be systematically compromised — a finding that should inform safety evaluations and deployment decisions.

---

## Limitations and Open Questions

AgentPoison, while a significant contribution, has several limitations that warrant discussion:

**Retriever access assumption**: The most effective version of AgentPoison assumes the attacker has knowledge of the retrieval model used by the target agent. In practice, this information may not always be available. The paper partially addresses this by showing transferability across similar retrievers, but the effectiveness degrades when the retriever is unknown.

**White-box optimization**: The gradient-based optimization requires access to the retriever model's parameters. Extending the approach to a fully black-box setting, where the attacker can only observe retrieval outcomes without accessing model internals, remains an important open problem.

**Dynamic memory**: The paper primarily considers static memory and knowledge bases. In practice, agent memory is dynamic — entries are added, modified, and expired over time. How poisoning propagates through dynamic memory systems, and whether the attack remains effective over long time horizons, is not fully explored.

**Multi-agent systems**: In multi-agent environments, memory is often shared between agents. Understanding how memory poisoning in one agent propagates through a network of communicating agents is a critical open question.

---

## Practical Takeaways

For practitioners, AgentPoison offers several immediately actionable insights:

1. **Audit your agent's memory pipeline.** Understand where memory entries and knowledge base documents come from, how they are stored, and what integrity checks (if any) are applied.

2. **Implement provenance tracking.** Every piece of information in your agent's memory should have a clear provenance — where it came from, when it was added, and what process verified its integrity.

3. **Deploy retrieval-layer monitoring.** Monitor retrieval patterns for anomalies: documents that are retrieved unusually often, documents whose content changes in ways that affect agent behaviour, or retrieval clusters that suggest targeted poisoning.

4. **Test with AgentPoison-style attacks.** Use the techniques described in this paper to proactively test your agent's resilience to memory poisoning. The attack methodology is well-specified and can be adapted for internal red-teaming.

5. **Design for graceful degradation.** Assume that some memory poisoning will succeed. Design your agent to degrade gracefully when its memory is partially compromised, rather than failing catastrophically.

---

## Conclusion

AgentPoison reveals a fundamental vulnerability in the architecture of modern LLM agents. By poisoning the memory and knowledge bases that agents rely on for context and reasoning, attackers can achieve persistent, stealthy, and highly effective manipulation of agent behaviour. The attack is not a theoretical curiosity — it works reliably across major agent frameworks, tasks, and language models, with success rates that would be alarming in any production system.

The paper's optimization-driven approach is methodologically rigorous and provides a template for future security research on retrieval-augmented systems. More importantly, it serves as a wake-up call for an industry that is rapidly deploying memory-augmented agents without adequately addressing the security of the memory layer.

As agents become more autonomous and more deeply integrated into critical workflows, the integrity of their memory and knowledge will only grow in importance. AgentPoison shows us that this integrity cannot be taken for granted — it must be deliberately engineered, continuously monitored, and rigorously tested. The alternative is deploying systems whose behaviour can be silently and persistently corrupted by any attacker who understands how to poison the well of knowledge they draw from.

---

**Paper**: [AgentPoison: Red-teaming LLM Agents via Poisoning Memory or Knowledge Bases](https://arxiv.org/abs/2407.12784) — NeurIPS 2024
