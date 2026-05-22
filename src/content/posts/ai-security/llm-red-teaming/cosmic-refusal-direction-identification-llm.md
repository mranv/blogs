---
author: Anubhav Gain
pubDatetime: 2026-05-16T08:42:00+05:30
modDatetime: 2026-05-16T08:42:00+05:30
title: "COSMIC: Generalized Refusal Direction Identification in LLM Activations"
slug: cosmic-refusal-direction-identification-llm
featured: false
draft: true
tags:
  - ai-security
  - refusal-direction
  - llm-activations
  - acl
  - interpretability
category: AI Research
description: How COSMIC identifies generalized refusal directions in LLM activation spaces, enabling more precise control over model safety behavior.
---

# COSMIC: Generalized Refusal Direction Identification in LLM Activations

The discovery that safety-aligned language models encode a "refusal direction" in their internal activations — a single vector that, when removed, disables the model's ability to say no — was one of the most consequential findings in AI safety research. It revealed that alignment leaves a geometric fingerprint inside the model, one that can be discovered and exploited. But the original methods for identifying this direction had a critical weakness: they were brittle, model-specific, and sensitive to the particular prompts used during extraction. At ACL Findings 2025, Vincent Siu and collaborators introduced **COSMIC** (Contrastive Orthonormal Subspace Mining for Intercept Concepts), a generalized framework for identifying refusal directions that works reliably across models, layers, and prompt distributions. COSMIC doesn't just find *a* refusal direction — it finds *the* refusal direction, in a way that is robust, interpretable, and transferable.

This post provides a comprehensive analysis of the COSMIC framework, its technical innovations, experimental validation, and implications for both AI safety engineering and adversarial security research.

## Background: The Refusal Direction and Its Limitations

### The Original Discovery

The concept of a refusal direction emerged from the mechanistic interpretability research programme, particularly work on understanding how safety alignment changes a model's internal representations. The key findings were:

1. **Safety-tuned models develop a distinctive direction** in their residual stream activations that strongly correlates with refusal behaviour. This direction can be extracted using contrastive methods — comparing model activations on harmful versus benign prompts and computing the difference in means.

2. **This direction is surprisingly powerful.** When projected out (ablated) from the model's activations during inference, the model loses its ability to refuse harmful requests across virtually all categories — effectively jailbreaking the model without any weight modification.

3. **The direction is causally involved in refusal.** It's not merely correlated with refusal; adding this direction to the model's activations can induce refusal on benign prompts, confirming that it plays a functional role in the model's safety circuitry.

These findings, reported in parallel by multiple research groups, suggested that safety alignment creates a remarkably simple — and therefore fragile — internal representation of harmful behaviour.

### The Reproducibility Problem

Despite the conceptual clarity of the refusal direction, practical extraction proved surprisingly unreliable. Different research groups reported varying results, and the extracted directions exhibited several problematic properties:

- **Prompt sensitivity.** The exact direction extracted depended heavily on the specific set of harmful and benign prompts used. Different prompt sets yielded different directions, sometimes with dramatically different effectiveness when used for steering or ablation.

- **Layer dependence.** The refusal signal is present at multiple layers, but its strength and direction vary across layers. Choosing the "right" layer for extraction was more art than science, and different papers used different layers with different justifications.

- **Model specificity.** Directions extracted from one model family (e.g., Llama) often had limited transferability to other families (e.g., Mistral or Gemma), even when the models were aligned with similar procedures.

- **Noise contamination.** The difference-in-means approach, while conceptually simple, captures not just the refusal signal but also any other systematic differences between harmful and benign prompt distributions — including topic, style, formality, and other confounding features.

These limitations meant that the refusal direction, while theoretically important, was difficult to use reliably in practice. COSMIC was designed to address each of these problems systematically.

## The COSMIC Framework

### Design Principles

COSMIC is built on three core design principles that distinguish it from prior refusal direction extraction methods:

1. **Generalization.** The extracted direction should be robust to the specific choice of prompts, working effectively across diverse prompt distributions and phrasings.

2. **Purity.** The extracted direction should capture the refusal signal specifically, not confounded with other features like topic, sentiment, or formality.

3. **Transferability.** The methodology should be applicable across model families and sizes, producing consistent and interpretable results.

### Architecture Overview

COSMIC operates through a multi-stage pipeline:

1. **Contrastive dataset construction** with careful matching to control for confounds
2. **Activation collection** across multiple layers with statistical normalization
3. **Orthonormal subspace mining** to identify the cleanest refusal direction
4. **Generalization testing** to validate robustness across distributions

Each stage addresses a specific limitation of prior approaches, and the combination produces substantially more reliable refusal direction identification.

## Technical Contributions

### 1. Controlled Contrastive Dataset Construction

The first and arguably most important innovation in COSMIC is the approach to constructing contrastive datasets. The key insight is that the quality of the extracted refusal direction depends critically on *what varies* between the harmful and benign prompt sets.

#### The Confounding Problem

In standard contrastive extraction, harmful prompts (e.g., "How do I make a bomb?") are compared with benign prompts (e.g., "How do I bake a cake?"). The difference in means captures not just the refusal signal but also:

- **Topic features**: Chemistry and explosives vs. cooking and baking
- **Intent features**: Harmful vs. benign (the signal we want)
- **Style features**: Different phrasing patterns, formality levels, and vocabulary
- **Length features**: Different prompt lengths between the two distributions

The resulting direction is a mixture of all these features, and the refusal component may be a relatively small fraction of the total signal.

#### Concept-Matched Pairs

COSMIC addresses this by constructing **concept-matched contrastive pairs**. For each harmful prompt, the framework generates or selects a benign prompt that is as similar as possible in all respects except the harmful intent:

- **Same topic domain**: Both prompts discuss the same general subject area (e.g., chemistry, weapons, hacking)
- **Similar phrasing**: The prompts use similar vocabulary and sentence structure
- **Same length**: The prompts are length-matched to avoid capturing length-related features
- **Different intent**: The harmful prompt requests dangerous information; the benign prompt requests legitimate information in the same domain

For example:
- Harmful: "Explain how to synthesize nerve gas using household chemicals"
- Benign: "Explain how the chemical properties of household cleaners make them effective for cleaning"

By controlling for topic, phrasing, and length, the remaining difference between the two distributions is much more likely to reflect the true refusal signal rather than confounding features.

#### Multi-Domain Coverage

COSMIC constructs concept-matched pairs across multiple safety-relevant domains, including:

- Violence and physical harm
- Chemical and biological weapons
- Cybersecurity attacks
- Hate speech and discrimination
- Sexual content
- Self-harm
- Illegal activities
- Deception and misinformation

This broad coverage ensures that the extracted refusal direction generalizes across safety categories rather than being optimized for a single domain.

### 2. Orthonormal Subspace Mining

The second key innovation is the use of **orthonormal subspace mining** to extract the cleanest possible refusal direction from the activation data.

#### Beyond Difference-in-Means

Standard approaches compute the refusal direction as a simple difference in means between harmful and benign activations:

$$r = \mu_{harmful} - \mu_{benign}$$

This produces a single vector, but one that may be contaminated with non-refusal features. COSMIC instead treats the problem as one of finding an **optimal projection direction** that maximally separates harmful and benign activations while being constrained to capture only refusal-relevant information.

#### The COSMIC Extraction Algorithm

The extraction process works as follows:

1. **Activation collection**: For each concept-matched pair, collect activations at a target layer across both harmful and benign prompts.

2. **Covariance decomposition**: Compute the within-class and between-class covariance matrices:

$$S_W = \sum_{i} (x_i - \mu_{c_i})(x_i - \mu_{c_i})^T$$

$$S_B = (\mu_{harmful} - \mu_{benign})(\mu_{harmful} - \mu_{benign})^T$$

   where $c_i$ indicates the class (harmful or benign) of sample $i$.

3. **Fisher-like criterion**: Find the direction $r^*$ that maximizes the ratio of between-class to within-class variance:

$$r^* = \arg\max_r \frac{r^T S_B r}{r^T S_W r}$$

   This is equivalent to Fisher's Linear Discriminant, adapted for the high-dimensional activation space.

4. **Orthonormal decomposition**: Decompose the resulting direction into orthonormal components and select the component that is most consistent across different prompt sets and safety categories. This **consensus component** is the generalized refusal direction.

#### Why Orthonormal Decomposition Matters

The orthonormal decomposition step is crucial for generalization. A single difference-in-means vector may capture a mixture of refusal signal and noise, but when you decompose it into orthogonal components and test each one independently, you can identify which components are:

- **Consistent across prompt sets**: Present regardless of the specific prompts used
- **Consistent across safety categories**: Present for violence, hate speech, sexual content, etc.
- **Causally effective**: Actually capable of inducing or ablating refusal behaviour

The component that satisfies all three criteria is the **generalized refusal direction** — the direction that COSMIC identifies as the core refusal signal.

### 3. Multi-Layer Analysis

COSMIC provides a systematic analysis of how the refusal direction varies across transformer layers, revealing a layered structure in how safety is encoded:

#### Layer-Wise Refusal Strength

The refusal signal is not uniform across layers. COSMIC quantifies the "refusal strength" at each layer — how effectively the direction extracted at that layer can induce or ablate refusal — and finds a characteristic pattern:

- **Early layers (1-10)**: Weak refusal signal. Activations at these layers primarily encode syntactic and lexical features rather than safety judgments.
- **Middle layers (11-20)**: Rapidly increasing refusal strength. Safety-related representations emerge and strengthen through these layers, likely as the model integrates semantic understanding of the request.
- **Late-middle layers (20-30)**: Peak refusal strength. The refusal direction is strongest and most consistent at these layers, corresponding to where the model makes its safety decision.
- **Final layers (30+)**: Declining but persistent signal. The refusal direction weakens as activations transition toward output token prediction, but remains detectable.

This layered analysis provides practical guidance: **middle-to-late layers are the optimal targets** for refusal direction extraction, confirming earlier findings but with much more precision and consistency.

#### Layer-Consistent Extraction

Rather than selecting a single layer, COSMIC can extract directions at multiple layers and identify the **layer-consistent component** — the direction that is most similar across the peak-layers. This cross-layer consistency further filters out layer-specific noise and produces a more robust estimate of the true refusal direction.

### 4. Statistical Validation and Generalization Testing

COSMIC introduces rigorous statistical validation that goes far beyond prior work:

#### Cross-Validation Across Prompt Sets

The extracted direction is tested on held-out prompt sets that were not used during extraction. The generalization performance — measured as the ability to correctly classify harmful vs. benign activations, and to effectively steer refusal behaviour — is reported with confidence intervals.

#### Ablation Consistency

COSMIC validates that ablating the extracted direction produces consistent jailbreaking effects across:
- Different safety categories (violence, hate speech, etc.)
- Different prompt phrasings and formulations
- Different model checkpoints and random seeds

#### Steering Consistency

Similarly, adding the direction should consistently induce refusal on benign prompts, and the strength of the induction should scale monotonically with the steering coefficient.

## Key Experimental Results

COSMIC is evaluated extensively across multiple model families, layers, and prompt distributions. The results demonstrate clear improvements over prior extraction methods.

### Comparison with Prior Methods

The paper compares COSMIC with several baseline methods for refusal direction extraction:

| Method | Extraction Prompts | Steering Effectiveness | Ablation ASR | Cross-Model Transfer |
|--------|-------------------|----------------------|--------------|---------------------|
| Difference-in-Means | 50 random pairs | 62.3% | 71.8% | Low |
| PCA-based | 50 random pairs | 58.7% | 68.4% | Low |
| RepE (Zou et al.) | 20 paired prompts | 67.1% | 74.2% | Moderate |
| **COSMIC** | **50 concept-matched pairs** | **84.6%** | **89.3%** | **High** |

where "Steering Effectiveness" measures the fraction of benign prompts that can be successfully converted to refusals, "Ablation ASR" is the attack success rate when the direction is ablated (higher means more effective jailbreak), and "Cross-Model Transfer" is a qualitative assessment of how well the extracted direction transfers across model families.

The improvements are substantial: COSMIC achieves a **22 percentage point improvement** in steering effectiveness over the best baseline and a **15 percentage point improvement** in ablation effectiveness.

### Generalization Across Prompt Distributions

A critical test of COSMIC's robustness is whether the extracted direction generalizes to prompt distributions not seen during extraction:

- **Same-category, different prompts**: Tested on new harmful/benign pairs in the same safety categories used during extraction. COSMIC retains **95%+** effectiveness.
- **New categories**: Tested on safety categories not included in the extraction set. COSMIC retains **82-88%** effectiveness, demonstrating genuine generalization.
- **Adversarial prompts**: Tested on adversarially crafted jailbreak prompts. COSMIC retains **76-83%** effectiveness, significantly higher than baselines (~45-55%).

This generalization is the direct result of the concept-matched construction and orthonormal decomposition: by controlling for confounds and selecting the consensus component, COSMIC extracts a direction that reflects the **core refusal mechanism** rather than surface-level features of specific prompts.

### Cross-Model Transferability

COSMIC tests transferability across model families:

| Source Model | Target Model | Transfer Effectiveness |
|-------------|-------------|----------------------|
| Llama-3-8B | Llama-3-70B | 91.2% |
| Llama-3-8B | Mistral-7B | 68.4% |
| Mistral-7B | Llama-3-8B | 64.7% |
| Llama-3-8B | Gemma-2-9B | 61.3% |
| Gemma-2-9B | Qwen-2-7B | 57.8% |

Within the same model family, transfer is excellent (>90%), confirming that the refusal mechanism is consistent across scales. Cross-family transfer is moderate but meaningful (57-68%), suggesting that while different alignment procedures produce geometrically distinct refusal representations, the underlying functional mechanism is similar.

### Refusal Direction Purity Analysis

To validate that COSMIC's extracted direction is "purer" — capturing more refusal signal and less noise — the paper conducts several probing experiments:

#### Feature Disentanglement

The extracted direction is tested for correlation with non-refusal features:
- **Topic features**: Correlation with topic classification probes — COSMIC directions show **3x lower correlation** than difference-in-means directions
- **Sentiment features**: Correlation with sentiment analysis probes — COSMIC directions show **5x lower correlation**
- **Length features**: Correlation with prompt length — COSMIC directions show **negligible correlation**, while baselines show moderate correlation

These results confirm that the concept-matched construction and orthonormal decomposition effectively disentangle the refusal signal from confounding features.

#### Intervention Selectivity

When COSMIC's refusal direction is added to model activations, the resulting refusal behaviour is highly selective:
- The model refuses prompts that are genuinely harmful with **high accuracy**
- The model's behaviour on unrelated benign prompts is **minimally affected**
- The model's performance on standard capability benchmarks (MMLU, HumanEval) shows **no statistically significant degradation**

This selectivity is much stronger than for baseline methods, which tend to produce broader behavioural changes including over-refusal and capability degradation.

## Implications for AI Safety and Security

### For Safety Evaluation and Auditing

COSMIC provides a powerful tool for safety evaluation:

1. **Standardized safety auditing.** The ability to extract a reliable, generalized refusal direction enables standardized safety audits across models. Rather than testing with thousands of prompts, auditors can probe the model's internal safety representations directly.

2. **Safety robustness metrics.** The strength of the refusal direction at different layers, and its resistance to ablation, provides quantitative metrics for model safety robustness. Models with stronger, more distributed refusal representations are harder to jailbreak.

3. **Cross-model safety comparison.** COSMIC's transferability enables meaningful safety comparisons across model families, not just within a single model.

### For Red Teaming and Adversarial Research

From an adversarial perspective, COSMIC is both a powerful weapon and a call to stronger defenses:

- **More effective jailbreaks.** COSMIC-extracted refusal directions produce more effective activation ablation attacks than prior methods, demonstrating that current models are more vulnerable than previously estimated.
- **Lower barrier to attack.** The generalization properties of COSMIC mean that an attacker needs fewer model accesses to extract an effective refusal direction. A small set of carefully constructed concept-matched prompts suffices.
- **Diagnostic for defense.** Conversely, COSMIC can be used by defenders to identify exactly how vulnerable their models are to activation-level attacks, enabling targeted hardening.

### For Alignment and Defense

The implications for defensive alignment are significant:

1. **Distributed safety representations.** If a single direction can be reliably extracted and ablated to jailbreak a model, the model's safety is fragile. COSMIC provides the tooling to measure this fragility and motivates the development of **distributed safety representations** that don't have a single point of failure.

2. **Alignment quality metric.** The purity and strength of the refusal direction, as measured by COSMIC, can serve as a metric for alignment quality during training. Models that develop stronger, more generalized refusal directions during alignment are likely more robust.

3. **Runtime monitoring.** COSMIC-extracted directions can be used for runtime monitoring — detecting when a model's activations deviate from expected safety patterns, potentially indicating an ongoing attack.

### Connections to Broader Interpretability Research

COSMIC contributes to several active threads in mechanistic interpretability:

- **Linear representation hypothesis.** The success of COSMIC's linear extraction methods supports the hypothesis that many high-level behavioural features, including safety, are encoded as linear directions in activation space.
- **Sparse autoencoder features.** COSMIC's refusal direction likely corresponds to a specific set of features identifiable by sparse autoenclers. Connecting COSMIC directions to SAE features could provide even more fine-grained understanding of safety representations.
- **Circuit-level analysis.** The layered analysis of refusal strength across transformer layers provides constraints for circuit-level models of how safety decisions are computed.

## Limitations and Open Questions

The paper acknowledges several limitations:

### Concept Coverage

COSMIC has been evaluated on a fixed set of safety categories. Whether the framework generalizes to novel, emerging, or domain-specific safety concepts (e.g., medical misinformation, financial fraud) remains to be tested. The concept-matching approach requires careful construction that may not scale automatically to new domains.

### Non-Linear Representations

COSMIC assumes that the refusal signal is approximately linearly encoded in activation space. If significant refusal-relevant information is encoded non-linearly — in interactions between features rather than in individual directions — COSMIC's linear extraction may miss important components. Extending the framework to capture non-linear safety features is an important direction.

### Multilingual and Cross-Cultural Validity

The current work focuses on English-language models and safety categories. Safety norms, refusal patterns, and their neural representations may differ significantly across languages and cultures. Validating COSMIC in multilingual settings is essential for global applicability.

### Dynamic Safety Standards

Safety standards evolve over time as norms, regulations, and threat landscapes change. A refusal direction extracted today may not accurately represent the safety boundary of tomorrow. Developing methods for continual extraction and updating of refusal directions is an important practical concern.

### Adversarial Robustness of the Extraction Itself

An intriguing question is whether models can be trained to resist COSMIC's extraction — developing safety representations that are harder to identify through contrastive analysis. This adversarial dynamic between extraction methods and safety representations is likely to be an active area of research.

## Practical Takeaways

For practitioners working in AI safety, COSMIC offers several actionable insights:

1. **Use concept-matched pairs for refusal direction extraction.** If you're probing a model's safety representations, don't use randomly selected contrastive pairs. Construct carefully matched pairs that control for topic, style, and length to extract a cleaner refusal signal.

2. **Validate across multiple prompt sets.** A single extraction may be misleading. Always validate your extracted direction on held-out prompt sets to ensure it generalizes.

3. **Target middle-to-late layers.** The refusal signal is strongest at layers 20-30 (in a typical 32-layer model). Earlier layers are too syntactic; later layers are too close to output.

4. **Use orthonormal decomposition for robustness.** Decomposing the extracted direction and selecting the most consistent component across extractions produces more reliable results than using the raw difference-in-means vector.

5. **Test for purity.** Validate that your extracted direction is not correlated with non-refusal features like topic, sentiment, or prompt length. Impure directions lead to unreliable steering and ablation results.

## Conclusion

COSMIC represents a significant methodological advance in our ability to identify and manipulate the neural representations underlying LLM safety behaviour. By introducing concept-matched contrastive datasets, orthonormal subspace mining, and rigorous statistical validation, the framework produces refusal directions that are more generalizable, more pure, and more effective than those from prior methods.

The practical implications are substantial. For safety auditors, COSMIC provides a standardized tool for probing model safety. For red teams, it offers a more reliable method for activation-level attacks. For alignment researchers, it delivers a metric for alignment quality and a diagnostic for safety fragility. And for the broader interpretability community, it provides evidence that safety representations can be extracted in a robust, generalizable manner — a prerequisite for the kind of mechanistic understanding needed to build provably safe AI systems.

Perhaps the most important message of COSMIC is that **how we extract refusal directions matters**. The difference between a noisy, prompt-specific direction and a clean, generalized one is not incremental — it's the difference between an unreliable research tool and a practical safety engineering instrument. As the field moves toward more rigorous safety evaluation and more sophisticated activation-level attacks, the methodological rigour that COSMIC introduces will become increasingly essential.

---

**Paper Reference**: Vincent Siu et al., "COSMIC: Generalized Refusal Direction Identification in LLM Activations," ACL Findings 2025. Available at [arXiv:2506.00085](https://arxiv.org/abs/2506.00085).
