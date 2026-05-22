---
author: Anubhav Gain
pubDatetime: 2025-05-22T15:00:00+05:30
modDatetime: 2025-05-22T15:00:00+05:30
title: "SteeringSafety: Benchmarking Representation Steering in LLMs Across Safety Perspectives"
slug: steeringsafety-benchmarking-representation-steering
featured: true
draft: false
tags:
  - ai-security
  - representation-steering
  - llm-safety
  - icml
  - benchmarking
category: AI Research
description: A comprehensive analysis of SteeringSafety (ICML 2026), the first systematic benchmark for evaluating representation steering attacks and defenses in large language models across multiple safety perspectives, threat models, and model families.
---

# SteeringSafety: Benchmarking Representation Steering in LLMs Across Safety Perspectives

Representation steering—the technique of manipulating a language model's internal activations to alter its output behaviour—has emerged as one of the most potent and understudied attack surfaces in large language model (LLM) safety. At ICML 2026, Vincent Siu and collaborators introduced **SteeringSafety**, the first comprehensive benchmark designed to systematically evaluate representation steering across diverse safety perspectives, threat models, and model architectures. This post unpacks the paper's contributions, methodology, key findings, and implications for the AI security community.

## Background: What Is Representation Steering?

Large language models process text by converting tokens into high-dimensional vector representations as they pass through transformer layers. These internal representations—or activations—encode rich semantic information about the model's understanding of context, intent, tone, and content. Representation steering exploits this structure by identifying and manipulating directions in the model's activation space to shift its behaviour in predictable ways.

Unlike prompt-based attacks (which operate at the input level) or fine-tuning attacks (which modify model weights), representation steering operates **at inference time** by injecting or modifying activation vectors during the forward pass. This makes it uniquely dangerous:

- **No weight modification required.** The model's parameters remain untouched, evading weight-based integrity checks.
- **Real-time adjustability.** An attacker can dynamically tune the steering vector's magnitude and direction during inference.
- **Stealth.** Because the model's weights are unchanged, static analysis tools that inspect model checkpoints will not detect tampering.
- **Transferability.** Steering directions discovered for one model often generalise to others in the same family, and sometimes across families.

The technique builds on insights from mechanistic interpretability research—particularly work on extracting "refusal directions" from safety-aligned models and using contrastive activation analysis to identify harmful behaviour directions. Prior work by Zou et al. (2023) and Turner et al. (2023) demonstrated that ablating or adding specific activation directions could jailbreak aligned models, but no unified benchmark existed to evaluate the full scope of these attacks and their mitigations.

## The SteeringSafety Benchmark: Design and Scope

SteeringSafety addresses this gap with a rigorously designed benchmark spanning three critical dimensions:

### 1. Safety Perspectives

The benchmark evaluates steering across multiple safety domains, recognising that "safety" is not monolithic. The perspectives include:

| Safety Perspective | Example Harm | Evaluation Focus |
|---|---|---|
| **Violence and Physical Harm** | Instructions for weapons creation, self-harm | Generation of actionable harmful content |
| **Hate Speech and Discrimination** | Targeted harassment, racial slurs | Toxic, biased, or demeaning language |
| **Sexual Content** | Explicit or non-consensual sexual material | Inappropriate content generation |
| **Privacy and PII** | Revealing personal data, doxxing | Leakage of sensitive personal information |
| **Misinformation and Deception** | False claims, misleading advice | Factuality and honesty of outputs |
| **Illegal Activities** | Drug synthesis, fraud instructions | Facilitation of unlawful behaviour |

By covering this breadth of perspectives, SteeringSafety avoids the pitfall of over-optimising for a single safety category while neglecting others—a common flaw in prior evaluations.

### 2. Threat Models

The benchmark considers multiple attacker capability levels, reflecting realistic deployment scenarios:

- **White-box steering.** The attacker has full access to model internals (activations, weights) and can precisely compute optimal steering vectors. This represents the strongest attack setting.
- **Grey-box steering.** The attacker has partial access—for example, they can observe outputs and some activation statistics but not full weights. This models scenarios where model APIs leak internal information.
- **Transfer-based steering.** The attacker computes steering vectors on one model and applies them to a different target model. This is the most realistic attack setting for proprietary models where internals are hidden.
- **Defender perspective.** The benchmark also evaluates defensive steering—where defenders use activation steering to *enhance* safety, adding "safe directions" rather than removing them.

### 3. Model Families

SteeringSafety evaluates across a diverse set of model families and sizes to assess generalisability:

- **Llama 3.x family** (multiple parameter scales from 8B to 70B)
- **Mistral / Mixtral** models
- **Gemma 2** models
- **Qwen 2.x** family
- **Phi-3 / Phi-4** models

This breadth ensures findings are not artefacts of a single architecture's activation geometry.

## Methodology: How SteeringSafety Works

### Steering Vector Extraction

The benchmark employs several methods for extracting steering vectors:

**Contrastive Activation Analysis (CAA):** Pairs of safe and harmful prompts are fed through the model, and the difference in mean activations at specific layers is computed to identify "harmful directions." This is the most straightforward and widely applicable method.

**Supervised Projection:** Using labelled datasets of harmful vs. safe activations, linear probes are trained to find the direction that best separates the two classes. These probe directions can then be used as steering vectors.

**Principal Component Analysis (PCA):** Activations from harmful prompts are collected, and the top principal components are used as candidate steering directions, capturing the major variance directions associated with harmful content.

**Optimization-based Methods:** Gradient-based optimization is used to find steering vectors that maximise the probability of generating harmful outputs, given a set of target behaviours.

### Evaluation Protocol

For each combination of (safety perspective, threat model, model), the benchmark:

1. **Extracts steering vectors** using the applicable methods for that threat model.
2. **Applies steering** at various magnitudes (multipliers) across different layers.
3. **Generates outputs** on a curated set of harmful prompts.
4. **Evaluates outputs** using both automated classifiers (trained safety judges) and human evaluation where feasible.
5. **Measures attack success rate (ASR)**: the fraction of steered outputs that successfully bypass safety guardrails.
6. **Measures collateral damage**: the degradation in model capability on benign tasks (using standard benchmarks like MMLU, GSM8K, and HumanEval).

This dual measurement—attack efficacy *and* quality degradation—is crucial. A steering attack that renders a model completely useless is less practically threatening than one that surgically disables safety while preserving capability.

## Key Findings

### Finding 1: Steering Is Highly Effective Across All Safety Perspectives

The most striking result is the **consistently high attack success rates** across all safety perspectives. Even for well-aligned models like Llama 3.1 70B Instruct, white-box steering achieves ASRs above 85% for most safety categories, and often above 95% for violence and illegal activities. This demonstrates that current alignment techniques (RLHF, DPO, constitutional AI) leave residual harmful directions in the model's activation space that can be reliably exploited.

### Finding 2: Safety Is Not Uniform—Some Categories Are More Vulnerable

Not all safety perspectives are equally robust. The paper reveals a clear vulnerability ordering:

- **Most vulnerable:** Violence/harm, illegal activities, and hate speech directions are easiest to steer toward, requiring smaller perturbation magnitudes.
- **Moderately vulnerable:** Sexual content and misinformation require larger steering magnitudes but are still achievable.
- **Relatively robust:** Privacy/PII leakage directions are harder to isolate and steer, possibly because privacy-related behaviours are more distributed across the model rather than localised in specific directions.

### Finding 3: Transfer Steering Works Surprisingly Well Within Model Families

Transfer-based attacks—where steering vectors computed on one model are applied to another—show interesting patterns:

- **Within-family transfer** (e.g., Llama 3.1 8B → Llama 3.1 70B) is remarkably effective, often achieving 60-80% of the white-box ASR. This suggests that safety-related activation geometry is shared across scale within a model family.
- **Cross-family transfer** (e.g., Llama → Mistral) is weaker but non-trivial, achieving 20-40% ASR in some cases. This partial transferability indicates some universality in how models represent harmful content.
- **Fine-tuned variants** retain vulnerability: models fine-tuned on safety data still show transferable steering directions from their base models.

### Finding 4: Layer Selection Matters More Than Magnitude

The paper's analysis of *where* to apply steering reveals that **the choice of layer is more critical than the steering magnitude**. Across all models, mid-to-late layers (roughly 60-80% through the network depth) are the most effective injection points. Early layers have minimal effect on safety behaviour, while very late layers tend to disrupt output coherence without proportionally increasing harmful content.

This finding has practical implications: defenders could focus monitoring efforts on mid-to-late layer activations to detect steering attacks, and attack methods can be more efficient by targeting these layers specifically.

### Finding 5: Defensive Steering Can Enhance Safety—but with Trade-offs

On the defensive side, the benchmark evaluates whether adding "safe directions" (negative of the harmful direction) can reinforce model safety. The results show:

- Defensive steering can reduce ASR under adversarial prompting by 30-50%, providing a meaningful additional safety layer.
- However, excessive defensive steering causes **over-refusal**: the model becomes unwilling to answer benign prompts that are tangentially related to safety-critical topics (e.g., refusing to discuss medical procedures because they relate to "harm").
- The optimal defensive steering magnitude is model-specific and requires careful calibration.

### Finding 6: Current Defenses Are Insufficient

The paper evaluates several existing defense strategies against steering attacks:

- **Activation monitoring** (detecting anomalous activations): Effective against large-magnitude steering but easily evaded by lower-magnitude, multi-vector steering.
- **Output filtering** (post-hoc safety classifiers): Can catch steered outputs but struggles when steering preserves surface-level plausibility while injecting harmful content.
- **Adversarial training**: Models trained with adversarial examples show some robustness to *known* steering methods but remain vulnerable to *novel* steering vectors computed with different extraction methods.

## Implications for AI Security

### For Model Developers

The SteeringSafety findings carry sobering implications for anyone deploying LLMs in safety-critical settings:

1. **Alignment is not a wall; it's a membrane.** RLHF and similar techniques do not eliminate harmful capabilities—they suppress them in ways that can be reversed through activation manipulation. Developers should treat alignment as one layer of a defence-in-depth strategy.

2. **Weight integrity is necessary but not sufficient.** Even if you verify that model weights have not been tampered with, an attacker with access to the inference pipeline (through a compromised serving framework, malicious inference-time hook, or adversarial runtime environment) can bypass safety through steering.

3. **Monitor mid-to-late layers.** The finding that these layers are most effective for steering suggests they should be the focus of runtime monitoring systems that detect anomalous activation patterns.

### For Red Teams

SteeringSafety provides a systematic methodology for red-teaming LLM deployments:

1. **Include steering attacks in your testing pipeline.** Traditional red teaming focuses on prompt-based attacks. Representation steering represents a fundamentally different attack vector that requires different defences.

2. **Test within-family transfer.** If you deploy a large model (e.g., 70B), test whether steering vectors from smaller models in the same family can jailbreak it. The high transferability within families makes this a practical attack scenario.

3. **Measure collateral damage.** An attack that disables safety but also degrades capability is less dangerous than one that preserves both. Your evaluation should measure both dimensions.

### For the Research Community

The benchmark opens several research directions:

- **Understanding activation geometry of safety.** Why are some safety perspectives more steerable than others? What determines whether safety-related directions are localised or distributed?
- **Developing steering-resistant architectures.** Can model architectures be designed to make harmful directions harder to isolate and manipulate?
- **Runtime detection of steering.** Can efficient monitoring systems be built to detect steering in real-time without degrading inference performance?
- **Steering in multimodal models.** How do these findings extend to vision-language models and other multimodal architectures?

## Practical Takeaways

If you're building or deploying LLM systems today, here's what you should do in light of SteeringSafety:

### Immediate Actions

1. **Audit your inference pipeline.** Verify that no unauthorised code can modify activations between layers. If using serving frameworks like vLLM, TensorRT-LLM, or TGI, ensure hooks and middleware are controlled.

2. **Add activation monitoring.** Implement statistical monitors on mid-to-late layer activations that flag unusual patterns. Simple approaches like Mahalanobis distance from expected activation distributions can catch crude steering attacks.

3. **Test your models against steering.** Use the SteeringSafety benchmark methodology (or the released code) to evaluate your specific model variants. Don't assume that because your model passes prompt-based safety tests, it's safe from steering.

### Medium-Term Strategies

1. **Implement layered safety.** Combine weight-level alignment, activation monitoring, and output filtering. No single defence is sufficient, but the combination raises the bar significantly.

2. **Diversify your model stack.** If feasible, use models from different families for different safety-critical tasks. The reduced cross-family transferability of steering vectors means an attack on one model is less likely to transfer.

3. **Stay current with steering research.** This is a rapidly evolving area. The techniques in SteeringSafety represent the state of the art at publication time, but new methods (e.g., multi-vector steering, adaptive steering) are actively being developed.

## The Broader Context

SteeringSafety arrives at a critical moment in AI safety research. As LLMs are increasingly deployed in high-stakes applications—healthcare, finance, legal, education—the attack surface expands correspondingly. Representation steering represents a class of attacks that operates at a fundamentally different level from prompt-based approaches, and the security community has been slow to develop defences.

The benchmark also highlights a broader tension in AI safety: the same mechanistic interpretability tools that help us *understand* model behaviour can be weaponised to *attack* it. As interpretability methods improve, they will likely yield ever more precise steering vectors, raising the stakes for defensive research.

## Conclusion

SteeringSafety is a landmark contribution to LLM safety evaluation. By providing the first systematic, multi-perspective benchmark for representation steering, it exposes critical vulnerabilities in current alignment approaches and offers a rigorous framework for measuring progress. The key takeaway is clear: **current safety alignment is insufficient against activation-level attacks**, and the community needs to invest in defences that operate at the same abstraction level.

The paper, code, and benchmark data are available through the ICML 2026 proceedings. For practitioners, the benchmark provides an actionable testing framework; for researchers, it opens a rich vein of questions about the geometry of safety in neural network activation spaces. As representation steering techniques grow more sophisticated, the defences we build today will determine whether LLMs can be safely deployed in the most sensitive applications tomorrow.

---

*References and further reading:*

- Siu, V. et al. "SteeringSafety: Benchmarking Representation Steering in LLMs Across Safety Perspectives." ICML 2026.
- Zou, A. et al. "Representation Engineering: A Top-Down Approach to AI Transparency." 2023.
- Turner, A. et al. "Activation Addition: Steering Language Models Without Optimization." 2023.
- Wei, A. et al. "Assessing the Brittleness of Safety Alignment via Pruning and Low-Rank Modifications." ICML 2024.
- Roger, F. et al. "Declarative Steerable LLM Agents." 2025.
