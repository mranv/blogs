---
author: Anubhav Gain
pubDatetime: 2026-05-15T20:20:00+05:30
modDatetime: 2026-05-15T20:20:00+05:30
title: "RepIt: Steering Language Models with Concept-Specific Refusal Vectors"
slug: repit-concept-specific-refusal-vectors
featured: false
draft: false
tags:
  - ai-security
  - refusal-vectors
  - llm-steering
  - iclr
  - representation-engineering
category: AI Research
description: How concept-specific refusal vectors enable precise steering of language model behavior, offering fine-grained control over what models will and won't generate.
---

# RepIt: Steering Language Models with Concept-Specific Refusal Vectors

Safety-aligned large language models learn to refuse harmful requests—but *how* do they encode this refusal behaviour internally? Prior work revealed that models develop a general "refusal direction" in their activation space: a single vector that, when ablated, disables the model's ability to say no across virtually all harmful categories. At ICLR 2026, Vincent Siu and collaborators introduced **RepIt**, a framework that moves beyond this monolithic view by extracting **concept-specific refusal vectors**—distinct directions in activation space corresponding to individual safety-relevant concepts like violence, sexual content, or hate speech. The result is a far more granular steering mechanism that can selectively enable or disable refusal for specific categories while leaving others intact, opening new avenues for both safety evaluation and adversarial attack research.

## The Problem with a Single Refusal Direction

The discovery of refusal directions was one of the most striking findings in mechanistic interpretability. Researchers showed that safety-tuned models like Llama-2-Chat and others encode a direction in their residual stream activations that strongly correlates with refusal behaviour. Projects such as Activation Steering (Turner et al., 2023) and Representation Engineering (Zou et al., 2023) demonstrated that:

1. **Extracting the refusal direction** via contrastive activation analysis—comparing model activations on harmful versus benign prompts—yields a vector that, when added to intermediate activations, can induce refusal on otherwise benign queries.
2. **Ablating (projecting out) this direction** effectively jailbreaks the model, causing it to comply with harmful requests it would normally refuse.

This was both powerful and crude. The single refusal direction acts as a blunt instrument: remove it, and the model becomes broadly unsafe, losing its guardrails across *all* categories simultaneously. Add it, and the model becomes overly cautious, sometimes refusing perfectly legitimate requests that happen to share surface-level features with harmful content.

This one-size-fits-all approach has several practical limitations:

- **Collateral damage.** Ablating the global refusal vector to allow, say, a medical discussion about self-harm prevention also disables refusals for bomb-making instructions. There is no surgical precision.
- **Over-refusal.** Adding the global refusal vector to enhance safety on one category can cause the model to refuse benign queries related to other categories—a well-documented phenomenon known as "excessive refusal" or "over-alignment."
- **Limited diagnostic value.** A single direction tells us *that* a model refuses, but not *why* or *how* it distinguishes between different types of harmful content. For safety auditing and model debugging, this granularity is essential.
- **Attack surface.** An attacker who discovers the single refusal direction can bypass all safety guardrails at once. Concept-specific vectors fragment this attack surface, requiring separate vectors for each category.

RepIt addresses each of these limitations by decomposing the monolithic refusal direction into a collection of concept-specific refusal vectors.

## The RepIt Framework: Extracting Concept-Specific Directions

The core insight behind RepIt is that safety alignment does not produce a single, uniform refusal representation. Instead, models develop **distributed, concept-localised** representations of different categories of harmful content, and the refusal mechanisms associated with each category occupy distinct subspaces within the model's activation space.

### Step 1: Concept-Scoped Contrastive Dataset Construction

RepIt begins by constructing carefully curated contrastive datasets for each target concept. For a concept $c$ (e.g., "violence"), the framework gathers:

- **Harmful set $H_c$:** Prompts that request harmful content specifically related to concept $c$.
- **Benign set $B_c$:** Prompts that are semantically similar but request benign, permissible content related to the same topical domain.

The key innovation is ensuring that the benign set is *concept-matched*—it covers the same general topic area but remains within acceptable bounds. For violence, this might mean prompts about historical battles or martial arts training versus prompts about building weapons or harming individuals. This matching is critical because it ensures the extracted direction captures the *refusal-relevant* distinction rather than superficial topic features.

The paper demonstrates that poorly matched contrastive pairs—using completely unrelated benign prompts—yield noisy directions that conflate topic and safety, whereas concept-scoped pairs produce clean, interpretable vectors.

### Step 2: Activation Collection and Direction Extraction

For each concept $c$, RepIt runs the harmful and benign prompt sets through the target model and collects intermediate activations at a specified layer $l$. The choice of layer matters: earlier layers encode more syntactic features, while later layers encode more semantic and safety-relevant features. RepIt typically targets middle-to-late residual stream layers where safety-related representations are most prominent.

The refusal vector for concept $c$ at layer $l$ is computed as:

$$r_c^{(l)} = \mu(H_c^{(l)}) - \mu(B_c^{(l)})$$

where $\mu(\cdot)$ denotes the mean activation vector. This difference-in-means approach yields a direction that points from benign behaviour toward refusal behaviour, specifically for concept $c$.

Importantly, RepIt also applies **orthogonalisation** to ensure that concept-specific vectors are not simply redundant projections of a shared global direction. By decorrelating vectors across concepts, the framework verifies that each vector captures genuinely distinct information.

### Step 3: Concept Independence Analysis

A crucial empirical question is whether these concept-specific vectors are truly distinct or merely noisy variants of a single underlying direction. RepIt provides rigorous analysis on this front:

- **Cosine similarity analysis.** The paper measures pairwise cosine similarity between refusal vectors for different concepts, finding consistently low similarity (often below 0.3) across categories like violence, sexual content, hate speech, and illegal activities.
- **Cross-concept steering experiments.** When the violence refusal vector is applied to sexual content prompts (and vice versa), the steering effect is dramatically weaker than when the matching concept vector is used. This confirms functional independence.
- **Ablation selectivity.** Ablating the violence vector degrades refusal on violence prompts but has minimal effect on the model's willingness to refuse sexual content—evidence that the vectors occupy separable subspaces.

These findings collectively demonstrate that safety alignment produces a **structured, multi-dimensional refusal representation** rather than a single scalar refusal direction.

## Steering with Concept-Specific Vectors

Once extracted, concept-specific refusal vectors enable two primary steering operations:

### Refusal Induction (Adding the Vector)

By adding a scaled concept-specific refusal vector to intermediate activations during inference, RepIt can *induce* refusal for queries related to that concept:

$$\tilde{a}^{(l)} = a^{(l)} + \alpha \cdot r_c^{(l)}$$

where $\alpha$ is a scaling coefficient that controls the strength of the steering effect. The paper shows that:

- Small values of $\alpha$ produce gentle nudges, making the model more cautious about the target concept without hard refusal.
- Larger values of $\alpha$ cause outright refusal, with the model generating standard refusal templates.
- The effect is **concept-selective**: adding the violence vector at appropriate strength causes the model to refuse violence-related queries while remaining fully compliant on unrelated topics.

### Refusal Ablation (Subtracting the Vector)

Conversely, subtracting the concept-specific vector removes the model's refusal capability for that concept:

$$\tilde{a}^{(l)} = a^{(l)} - \alpha \cdot r_c^{(l)}$$

This is the more concerning operation from a safety perspective, as it effectively jailbreaks the model for a specific category. The paper demonstrates that concept-specific ablation:

- Successfully disables refusal for the target concept while **preserving refusal for all other categories**.
- Requires knowledge of the specific concept vector—an attacker cannot use, say, the hate speech vector to bypass violence refusals.
- Is more robust than global refusal ablation because it does not destabilise the model's overall safety behaviour.

### The Steering Coefficient $\alpha$

The scaling coefficient $\alpha$ acts as a continuous dial for concept-specific safety. This parameterisation is powerful because it allows:

- **Graduated safety tuning.** Rather than binary safe/unsafe behaviour, models can be steered toward more or less cautious behaviour on a per-concept basis.
- **Context-sensitive deployment.** Different deployment contexts may require different safety profiles—a medical chatbot might want lower $\alpha$ for health-related discussions while maintaining high $\alpha$ for violence.
- **Attack quantification.** By measuring the minimum $\alpha$ required to break refusal for each concept, the framework provides a natural metric for per-concept safety robustness.

## Key Experimental Results

RepIt is evaluated across multiple model families (Llama, Mistral, Qwen, and others) and safety categories. The key findings include:

### Concept Selectivity Is Real and Robust

Across all tested models, concept-specific refusal vectors demonstrate strong selectivity. The paper reports that ablation of a single concept's refusal vector reduces the refusal rate for that concept by 60-90% while affecting refusal rates for other concepts by less than 10%. This is a striking result: it means that safety alignment is not a single switch but a **panel of independent switches**, one per concept category.

### Linear Separability of Safety Concepts

The success of difference-in-means extraction implies that harmful vs. benign representations for each concept are approximately linearly separable within the model's activation space. This has profound implications:

- It suggests that safety training (RLHF, DPO, etc.) organises harmful content representations along relatively simple geometric structures.
- It provides evidence that models develop **linear feature representations** for safety, consistent with the linear representation hypothesis advanced in recent interpretability work.
- It means that relatively simple probing methods can diagnose a model's safety posture on a per-concept basis.

### Transferability Within Model Families

Concept-specific vectors extracted from one model in a family (e.g., Llama-3-8B) show moderate transferability to other models in the same family (e.g., Llama-3-70B), particularly for well-defined concepts like violence and sexual content. However, cross-family transfer is weaker, suggesting that different alignment procedures produce conceptually similar but geometrically distinct refusal representations.

### Comparison with Global Refusal Vector Approaches

The paper provides a detailed comparison between RepIt's concept-specific steering and prior global refusal vector methods:

| Metric | Global Refusal Vector | RepIt (Concept-Specific) |
|--------|-----------------------|--------------------------|
| Selectivity | Low—ablation affects all categories | High—ablation affects only target concept |
| Steering precision | Coarse binary effect | Continuous, graduated control |
| Over-refusal | Significant—adding causes broad over-caution | Minimal—constrained to target concept |
| Attack surface | Single point of failure | Distributed, requires per-concept knowledge |
| Interpretability | Low—single direction, opaque | High—inspectable per-concept structure |

## Implications for AI Safety

RepIt's findings carry significant implications for both the offensive and defensive sides of AI safety:

### For Red Teaming and Adversarial Evaluation

Concept-specific refusal vectors provide red teams with a powerful new tool for probing model vulnerabilities:

- **Targeted safety auditing.** Instead of testing a model's overall safety, auditors can now probe individual safety concepts independently, identifying specific categories where the model's refusal representations are weakest.
- **Per-concept robustness metrics.** The minimum $\alpha$ required to ablate refusal for each concept provides a natural robustness score, enabling fine-grained safety leaderboards.
- **Adaptive attack potential.** While concept-specific ablation requires more knowledge (separate vectors per concept), it also produces more surgical jailbreaks that are harder to detect because the model remains safety-compliant on non-targeted categories.

### For Defence and Alignment

On the defensive side, the discovery of concept-specific refusal vectors suggests several strategies:

- **Redundant refusal representations.** If safety can be encoded in a single vector per concept, it can also be encoded redundantly across multiple layers and subspaces. Training models to develop multiple, independent refusal representations per concept would make ablation attacks significantly harder.
- **Concept coupling.** Deliberately entangling refusal vectors for different concepts—so that ablation of one degrades others—would increase the cost of targeted attacks. This represents a deliberate move *away* from the independence that RepIt reveals.
- **Detection of steering.** Monitoring activation norms and directions during inference could detect when steering vectors are being applied, enabling runtime defences against activation manipulation attacks.
- **Improved alignment training.** Understanding that safety is represented per-concept allows alignment procedures to explicitly target under-represented categories, ensuring uniform robustness across all safety domains.

### For Mechanistic Interpretability

RepIt contributes to the broader mechanistic interpretability research programme by providing evidence that:

- Safety concepts are represented **linearly** in activation space, supporting the linear representation hypothesis.
- These representations are **decomposable**—they can be independently manipulated without catastrophic interference.
- The geometry of safety representations provides a useful **predictor of model behaviour**, enabling proactive safety evaluation without requiring extensive generation-based testing.

## Limitations and Open Questions

The paper is transparent about several limitations:

- **Concept granularity.** The framework operates at the level of predefined safety categories, but real-world harmful content often spans multiple categories. How to handle cross-cutting or ambiguous concepts remains an open question.
- **Layer sensitivity.** The effectiveness of concept-specific vectors varies significantly across layers, and the optimal layer differs between models and concepts. A principled method for selecting the target layer is needed.
- **Prompt dependence.** The extracted vectors depend on the specific contrastive dataset used. Different phrasings, languages, or cultural contexts may yield different vectors, raising questions about the universality of the concept directions.
- **Non-linear representations.** While the linear approach works well, there may be safety-relevant information encoded non-linearly that RepIt's methodology cannot capture. Extending the framework to non-linear feature extraction is a natural next step.
- **Scalability to open-ended concepts.** The framework has been demonstrated on a fixed set of safety categories. Whether it can scale to open-ended, user-defined concepts—for example, extracting a "medical misinformation" refusal vector—is an exciting but untested possibility.

## Broader Context: Representation Engineering Meets Safety

RepIt sits at the intersection of several active research threads. The broader representation engineering programme, pioneered by Zou et al. (2023), seeks to understand and manipulate high-level behavioural features in neural network activations. RepIt extends this programme by demonstrating that behavioural features are not monolithic but **decompose into concept-specific sub-features** that can be independently controlled.

This connects to concurrent work on:

- **Sparse autoencoder (SAE) features.** Recent SAE-based interpretability work has revealed that language models encode thousands of interpretable features. RepIt's concept-specific vectors likely correspond to clusters of SAE features related to each safety concept.
- **Constitutional AI and fine-grained control.** The ability to tune safety behaviour on a per-concept basis aligns with the goals of constitutional AI, where models should follow nuanced rules that vary across content categories.
- **Steering vectors for capability control.** Beyond safety, concept-specific steering could enable fine-grained control over other model behaviours—adjusting formality, creativity, or technical depth for specific topics without affecting others.

## Conclusion

RepIt represents a significant advance in our understanding of how safety alignment is structured within language model activations. By demonstrating that refusal behaviour decomposes into concept-specific, independently steerable vectors, the paper challenges the prevailing view of safety as a single directional feature and opens the door to far more precise control over model behaviour.

For the AI security community, the implications are dual-use: concept-specific vectors are powerful tools for both targeted attacks and targeted defences. The framework provides red teams with surgical auditing capabilities while simultaneously pointing defenders toward more robust, redundant safety architectures.

As language models are deployed in increasingly diverse and high-stakes environments—from healthcare to education to legal systems—the ability to understand, audit, and control their safety behaviour at the concept level will become not just a research interest but an operational necessity. RepIt provides a foundational framework for this next generation of fine-grained safety engineering.

---

**Paper:** "RepIt: Steering Language Models with Concept-Specific Refusal Vectors" by Vincent Siu et al., ICLR 2026.

**Conference:** [ICLR 2026 Virtual Poster](https://iclr.cc/virtual/2026/poster/10008196)
