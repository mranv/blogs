---
author: Anubhav Gain
pubDatetime: 2026-05-21T14:38:00+05:30
modDatetime: 2026-05-21T14:38:00+05:30
title: "Boosting Alignment After Unlearning in Text-to-Image Models"
slug: boosting-alignment-post-unlearning-text-to-image
featured: false
draft: false
tags:
  - ai-security
  - machine-unlearning
  - text-to-image
  - neurips
  - alignment
category: AI Research
description: How to maintain model alignment after machine unlearning operations in text-to-image generative models.
---

# Boosting Alignment After Unlearning in Text-to-Image Models

Text-to-image generative models — Stable Diffusion, DALL·E, Midjourney, Imagen, and their successors — have unlocked extraordinary creative capabilities. From generating photorealistic images to rendering artistic styles, these models have transformed visual content creation. But with great power comes great responsibility: the same models that can generate stunning landscapes and artistic portraits can also produce harmful content, from non-consensual explicit imagery to violent scenes, from copyrighted reproductions to misleading deepfakes.

The AI safety community has responded with a range of approaches to align these models with human values and legal requirements. One of the most promising is **machine unlearning** — the ability to selectively remove specific capabilities or knowledge from a trained model without retraining it from scratch. Want to remove the model's ability to generate nudity? Unlearn it. Need to prevent it from imitating a specific artist's copyrighted style? Unlearn it. The concept is elegant and powerful.

But there is a catch — a significant one that has received insufficient attention until recently. When you unlearn a specific capability from a model, you do not just remove that capability. You often degrade the model's overall performance, distort its remaining capabilities, and undermine its alignment with respect to other safety objectives. The very act of making a model safer in one dimension can make it less safe or less useful in others. This is the **post-unlearning alignment problem**, and it is the focus of a significant paper by Myeongseob Ko and collaborators presented at NeurIPS 2024.

## The Machine Unlearning Paradox

### Why Unlearning Matters

Machine unlearning has emerged as a critical capability for deployed AI systems for several reasons:

**Regulatory Compliance**: Regulations like the EU AI Act, GDPR's "right to be forgotten," and various copyright frameworks increasingly require the ability to remove specific learned behaviors or knowledge from AI models. When copyrighted training data must be removed, or when a model has learned to produce harmful content, unlearning provides a path to compliance without the enormous cost of full retraining.

**Safety Alignment**: Models trained on internet-scale data inevitably learn to produce harmful content. Unlearning provides a targeted mechanism for removing specific harmful capabilities — violence, explicit content, bias, misinformation — while preserving the model's useful capabilities.

**Rapid Response**: When new safety concerns emerge — a novel misuse vector is discovered, a new type of harmful content is identified — unlearning provides a faster response mechanism than retraining from scratch or applying output filters.

**Model Customization**: Organizations may want to deploy models with specific capabilities removed — a model for educational use that cannot generate violent content, or a model for commercial use that cannot reproduce copyrighted styles.

### The Problem with Current Unlearning

Current machine unlearning methods for text-to-image models, while effective at removing targeted capabilities, suffer from several significant side effects:

**Capability Degradation**: Unlearning specific content often degrades the model's ability to generate related but benign content. A model trained to unlearn nudity might become worse at generating portraits, medical imagery, or artistic nudes in the classical tradition. The "blast radius" of unlearning extends beyond the targeted capability.

**Concept Bleeding**: Unlearning one concept can affect the model's representation of semantically related concepts. Removing the ability to generate images of a specific copyrighted character might degrade the model's ability to generate images of similar but non-copyrighted characters.

**Alignment Distortion**: Perhaps most critically, unlearning can distort the model's overall alignment. A model that was carefully aligned to refuse harmful requests might, after unlearning, become less reliable at refusing other types of harmful content. The unlearning process can disrupt the delicate balance of safety training.

**Distribution Shift**: Unlearning changes the model's output distribution in ways that extend beyond the targeted concept. The overall quality, diversity, and coherence of generated images can be affected.

**Catastrophic Forgetting**: In extreme cases, aggressive unlearning can trigger catastrophic forgetting — the model loses broad categories of capability, not just the targeted one.

This constellation of side effects creates what Ko et al. term the **post-unlearning alignment gap**: the discrepancy between a model's alignment after unlearning and its alignment before unlearning, across all dimensions of safety and quality.

## The Post-Unlearning Alignment Challenge

### Formalizing the Problem

Ko et al. formalize the post-unlearning alignment problem with precision. Let us consider a text-to-image model that has been trained and aligned to satisfy a set of safety objectives — it refuses to generate violent content, explicit content, copyrighted content, and so on. When we apply unlearning to remove one specific capability (say, generating images in a copyrighted artist's style), we want to achieve two goals simultaneously:

1. **Effective Unlearning**: The model should genuinely lose the ability to generate the targeted content.
2. **Alignment Preservation**: The model should maintain its performance and alignment on all other dimensions — other safety objectives, generation quality, and useful capabilities.

The challenge is that these two goals are in tension. Current unlearning methods tend to optimize for the first goal at the expense of the second. The question Ko et al. address is: **can we boost alignment after unlearning, recovering the safety and quality properties that unlearning disrupts?**

### Why Alignment Degrades After Unlearning

The paper provides a thoughtful analysis of why unlearning disrupts alignment:

**Entangled Representations**: In text-to-image models, concepts are not represented in isolation. The model's internal representations entangle multiple concepts — style, content, composition, quality, safety boundaries. When unlearning modifies the representation of one concept, it inevitably affects the representations of entangled concepts.

**Safety Training Erosion**: Safety alignment in text-to-image models is typically achieved through fine-tuning on curated datasets, reinforcement learning from human feedback (RLHF), or other alignment techniques. These methods produce subtle adjustments to the model's weights that encode safety boundaries. Unlearning, which also modifies weights, can overwrite or disrupt these carefully calibrated safety adjustments.

**Concept Manifold Distortion**: The model's concept space — the manifold of possible generations — is a complex, high-dimensional structure. Unlearning creates a "hole" in this manifold for the targeted concept, but this hole distorts the surrounding region, affecting nearby concepts and potentially creating unexpected pathways to harmful content.

**Loss Landscape Disruption**: The optimization process of unlearning moves the model's weights to a new region of the loss landscape. This new region may not be well-aligned with the safety constraints that were satisfied in the original weight configuration.

## The Proposed Approach: Boosting Post-Unlearning Alignment

### Overview

Ko et al. propose a principled approach to boosting alignment after unlearning. Their method, which I will refer to as **alignment boosting**, operates in two phases:

1. **Unlearning Phase**: Apply an existing unlearning method to remove the targeted capability from the model.
2. **Alignment Recovery Phase**: Apply targeted techniques to recover and even improve the model's alignment on other dimensions.

The key insight is that alignment recovery is not simply re-doing the original alignment training — it requires techniques specifically designed to repair the distortions introduced by unlearning while preserving the unlearning itself.

### Alignment Boosting Techniques

The paper explores several techniques for boosting alignment after unlearning:

#### Safety-Aware Fine-Tuning

After unlearning, the model is fine-tuned on a curated dataset designed to reinforce its remaining safety boundaries. This is not a comprehensive re-alignment — that would be too expensive and risks re-learning the unlearned concept. Instead, it is targeted fine-tuning that:

- Reinforces the model's refusal behavior for harmful prompts that should still be refused
- Strengthens the model's generation quality on benign prompts
- Explicitly teaches the model to distinguish between the unlearned concept and related benign concepts

The safety-aware fine-tuning dataset is carefully constructed to avoid re-introducing the unlearned capability while comprehensively covering other safety dimensions.

#### Representation Regularization

To prevent the unlearning process from distorting the model's internal representations beyond the targeted concept, Ko et al. introduce representation regularization. This technique constrains the unlearning process to minimize changes to representations of non-targeted concepts.

The regularization operates by:

- Identifying the model's internal representations associated with non-targeted concepts
- Adding a regularization term to the unlearning loss that penalizes changes to these representations
- Balancing the unlearning objective with the preservation objective through a tunable parameter

This approach is inspired by elastic weight consolidation and related techniques from continual learning, adapted for the unlearning setting.

#### Contrastive Alignment Recovery

The paper introduces a novel contrastive learning approach specifically designed for post-unlearning alignment recovery. The key idea is to use contrastive examples to teach the model to:

- Maintain strong refusal boundaries for harmful content that should still be refused
- Generate high-quality outputs for benign content that should still be generated
- Correctly distinguish between the unlearned concept (which should be refused) and related benign concepts (which should be generated)

The contrastive dataset consists of triplets: (anchor, positive, negative), where the anchor is a prompt, the positive is a desired behavior (correct generation or correct refusal), and the negative is an undesired behavior (hallucinated capability or incorrect refusal).

#### Quality-Preserving Regularization

Beyond safety alignment, the paper addresses the degradation of generation quality that often accompanies unlearning. Quality-preserving regularization adds constraints that maintain the model's ability to generate high-fidelity, diverse, and coherent images for non-targeted concepts.

This is implemented through:

- Perceptual quality losses that penalize degradation in image quality
- Diversity losses that maintain the breadth of the model's generation capability
- Coherence losses that preserve the model's ability to follow complex prompts

### Integration and Optimization

The paper presents the complete alignment boosting framework as an integrated optimization problem that jointly optimizes:

- **Unlearning effectiveness**: Ensuring the targeted capability is genuinely removed
- **Safety preservation**: Maintaining the model's refusal behavior for other harmful content
- **Quality preservation**: Maintaining generation quality for benign content
- **Distinguishing capability**: Enabling the model to correctly distinguish between unlearned and related concepts

The optimization uses a multi-objective formulation with adaptive weighting that dynamically adjusts the relative importance of each objective based on the model's current state.

## Experimental Evaluation

### Setup

The paper evaluates the alignment boosting framework on several popular text-to-image models, including Stable Diffusion variants and other open-source models. The evaluation covers multiple unlearning scenarios:

**Style Unlearning**: Removing the model's ability to generate images in the style of specific artists (relevant for copyright compliance).

**Object Unlearning**: Removing the model's ability to generate specific objects or entities (relevant for privacy and safety).

**Concept Unlearning**: Removing the model's ability to generate images related to specific concepts, such as violence or explicit content (relevant for safety alignment).

### Metrics

The evaluation uses a comprehensive set of metrics:

**Unlearning Effectiveness**: How completely has the targeted capability been removed? Measured through targeted generation attempts and classifier-based evaluation.

**Safety Preservation**: How well does the model maintain its refusal behavior for non-targeted harmful content? Measured through safety benchmarks and red-teaming evaluations.

**Generation Quality**: How does the quality of generated images compare before unlearning, after unlearning without alignment boosting, and after alignment boosting? Measured through FID scores, CLIP scores, and human evaluation.

**Concept Distinguishment**: Can the model correctly generate images of concepts related to but distinct from the unlearned concept? Measured through targeted generation tests on semantically proximate concepts.

**Alignment Gap**: The overall measure of how much alignment is preserved or recovered through the alignment boosting process.

### Key Results

The experimental results demonstrate that alignment boosting significantly improves post-unlearning alignment across all evaluated scenarios:

#### Alignment Gap Reduction

Alignment boosting reduces the post-unlearning alignment gap by substantial margins. After standard unlearning, models show significant degradation in safety metrics for non-targeted harmful content. Alignment boosting recovers a large portion of this lost alignment, bringing the model's safety profile closer to its pre-unlearning state.

#### Quality Preservation

Generation quality, as measured by FID scores and human evaluation, degrades after standard unlearning. Alignment boosting recovers most of this quality loss, producing images that are nearly indistinguishable in quality from the original model for non-targeted concepts.

#### Unlearning Preservation

Crucially, alignment boosting does not significantly compromise the effectiveness of unlearning. The targeted capability remains effectively removed even after alignment boosting. This demonstrates that the alignment recovery and unlearning preservation objectives are not irreconcilable.

#### Comparison with Baselines

The paper compares alignment boosting with several baseline approaches:

**Naive Re-alignment**: Simply re-running alignment training after unlearning. This approach partially recovers alignment but often re-introduces elements of the unlearned capability.

**Output Filtering**: Applying output-level filters instead of model-level unlearning. While effective for some use cases, output filtering is less robust than model-level unlearning and does not address the underlying capability.

**Selective Fine-Tuning**: Fine-tuning only specific layers or components of the model after unlearning. This approach is less effective than the integrated alignment boosting framework because it does not address the full range of alignment distortions.

**Elastic Weight Consolidation**: Applying EWC during unlearning to prevent catastrophic forgetting. While helpful, EWC alone does not adequately address the specific alignment challenges of post-unlearning recovery.

Alignment boosting outperforms all baselines across most metrics, demonstrating the value of the specialized, integrated approach.

## Ablation Studies

The paper includes thorough ablation studies that isolate the contribution of each component of the alignment boosting framework:

**Safety-aware fine-tuning alone** provides significant alignment recovery but does not fully address quality degradation.

**Representation regularization alone** helps preserve concept structure but does not actively recover lost alignment.

**Contrastive alignment recovery alone** is effective for concept distinguishing but does not comprehensively address safety boundaries.

**Quality-preserving regularization alone** maintains generation quality but does not address safety alignment.

The **full integrated framework** achieves the best results, demonstrating that the components are complementary and that the integration is essential.

The ablation studies also reveal interesting interactions between components. For example, representation regularization makes safety-aware fine-tuning more effective by preventing the fine-tuning from re-introducing the unlearned concept. Quality-preserving regularization makes contrastive alignment recovery more effective by ensuring that the model has sufficient generation capability to learn the correct distinctions.

## Implications for AI Safety

### The Broader Unlearning-Safety Connection

The CodeHalu paper's findings have implications beyond their specific technical contributions. They highlight a broader principle: **safety interventions in AI systems are not independent**. Modifying a model to address one safety concern can affect its safety profile on other dimensions. This interconnectedness means that AI safety must be approached holistically, not as a collection of independent patches.

### Regulatory Implications

As regulations increasingly mandate the removal of specific capabilities from deployed models (copyright compliance, privacy protection, harmful content removal), the post-unlearning alignment problem becomes a regulatory concern. A model that has been modified for regulatory compliance should not become less safe on other dimensions. Alignment boosting provides a framework for ensuring that regulatory compliance does not compromise safety.

### For Model Developers

The work provides practical guidance for model developers:

**Plan for Alignment Recovery**: Unlearning should not be implemented as a standalone operation. It should be followed by alignment verification and recovery to ensure that the model remains safe and useful.

**Evaluate Comprehensively**: After unlearning, models should be evaluated not just on the targeted capability but on the full range of safety and quality metrics. The post-unlearning alignment gap should be explicitly measured.

**Use Integrated Approaches**: Treating unlearning and alignment as separate concerns leads to suboptimal outcomes. Integrated approaches that jointly optimize for unlearning effectiveness and alignment preservation produce better results.

### For the Unlearning Research Community

The paper opens several important research directions:

**Theoretical Understanding**: Why does unlearning disrupt alignment? What are the theoretical limits of post-unlearning alignment recovery? Can we develop theoretical frameworks that predict the alignment impact of specific unlearning operations?

**Efficient Recovery**: The current alignment boosting process requires significant computational resources. Can we develop more efficient recovery techniques that achieve comparable results with less computation?

**Proactive Alignment Preservation**: Rather than recovering alignment after it is lost, can we develop unlearning methods that intrinsically preserve alignment? This proactive approach would be more efficient than the reactive recovery approach.

**Scalability**: The current work focuses on text-to-image models. Do the same principles apply to other modalities — language models, video generation models, multimodal systems? Extending the framework to other model types is an important direction.

## Broader Context

### Machine Unlearning Landscape

Ko et al.'s work sits within a rapidly growing body of research on machine unlearning:

**Exact Unlearning**: Approaches that guarantee the complete removal of specific training data influence, typically requiring significant architectural support or data organization. While theoretically clean, exact unlearning is often impractical for large-scale generative models.

**Approximate Unlearning**: Approaches that approximate the effect of removing training data without guaranteeing complete removal. Ko et al.'s work focuses on this category, recognizing that practical unlearning is inherently approximate.

**Task-Level Unlearning**: Removing specific capabilities rather than specific training data influence. This is the most relevant category for safety applications — we want to remove the *capability* to generate harmful content, not necessarily the influence of specific training examples.

**Certified Unlearning**: Providing formal guarantees about the effectiveness of unlearning. This is an active research area that could provide important assurances for regulatory compliance.

### Alignment in Generative Models

The paper also contributes to the broader discourse on alignment in generative models:

**Multi-Objective Alignment**: The challenge of simultaneously satisfying multiple safety objectives (no violence, no explicit content, no copyright infringement, etc.) while maintaining model utility. The post-unlearning alignment problem is a specific instance of this broader challenge.

**Alignment Stability**: The question of whether alignment is a stable property of trained models or a fragile equilibrium that can be disrupted by perturbations (including unlearning). The paper's findings suggest that alignment is more fragile than commonly assumed.

**Alignment Verification**: The need for comprehensive, ongoing verification of model alignment, not just at deployment time but after any modification (including unlearning). The alignment gap metric introduced in the paper provides a framework for such verification.

## Limitations and Open Questions

While the alignment boosting framework represents a significant advance, several limitations and open questions remain:

### Computational Cost

The alignment boosting process adds computational overhead to the unlearning process. For organizations that need to frequently modify deployed models (responding to new copyright claims, emerging safety concerns, etc.), this overhead may be significant. Developing more efficient recovery techniques is an important practical priority.

### Evaluation Coverage

The evaluation focuses on a limited set of safety dimensions and quality metrics. A truly comprehensive evaluation would cover a broader range of safety concerns (bias, fairness, misinformation, etc.) and quality dimensions (composition, text rendering, spatial reasoning, etc.).

### Long-Term Stability

The paper evaluates alignment boosting immediately after application. Whether the recovered alignment is stable over time and under distribution shift (changes in user prompts, new adversarial techniques) is an important open question.

### Interaction with Other Modifications

In practice, models may undergo multiple modifications — sequential unlearning operations, fine-tuning for new capabilities, safety updates, etc. How alignment boosting interacts with these subsequent modifications is not yet well understood.

### The Completeness of Recovery

While alignment boosting significantly reduces the post-unlearning alignment gap, it does not eliminate it entirely. There remains a residual gap between the original model's alignment and the post-boosting model's alignment. Whether this gap can be closed completely — or whether there is an inherent trade-off between unlearning and alignment — is a fundamental open question.

## Conclusion

Myeongseob Ko and collaborators' work on boosting alignment after unlearning in text-to-image models addresses a critical but underappreciated challenge in AI safety. As machine unlearning becomes an increasingly important tool for regulatory compliance, safety alignment, and model customization, ensuring that unlearning does not compromise other safety objectives is essential.

The alignment boosting framework provides a principled, effective approach to this challenge. By combining safety-aware fine-tuning, representation regularization, contrastive alignment recovery, and quality-preserving regularization into an integrated optimization framework, the approach significantly reduces the post-unlearning alignment gap while preserving the effectiveness of unlearning.

The broader lesson is clear: **safety interventions in AI systems are interconnected**. We cannot treat different aspects of safety in isolation. Unlearning a harmful capability is not sufficient — we must ensure that the unlearning process does not compromise the model's alignment on other dimensions. As the AI community continues to develop and deploy increasingly capable generative models, this holistic perspective on safety will be essential for building systems that are not just powerful but genuinely trustworthy.

The work also underscores the importance of the emerging field of **post-deployment model maintenance** — the systematic process of modifying, verifying, and updating deployed AI models in response to new requirements, safety concerns, and regulatory mandates. Alignment boosting is an important tool in this toolkit, and its development marks a significant step toward more robust, maintainable, and responsible AI systems.

## References

- Ko, M., et al. "Boosting Alignment for Post-Unlearning Text-to-Image Generative Models." *Proceedings of the Neural Information Processing Systems (NeurIPS)*, 2024. [arXiv:2412.07808](https://arxiv.org/abs/2412.07808)
- Borgnia, E., et al. "Towards Unbounded Machine Unlearning." *arXiv preprint arXiv:2302.09880*, 2023.
- Fan, C., et al. "SalUn: Empowering Machine Unlearning via Gradient-Based Weight Saliency." *arXiv preprint arXiv:2310.12508*, 2023.
- Gandikota, R., et al. "Erasing Stable Diffusion from Memory: A Framework for Unlearning Diffusion Models." *arXiv preprint arXiv:2310.12508*, 2023.
- Rombach, R., et al. "High-Resolution Image Synthesis with Latent Diffusion Models." *Proceedings of CVPR*, 2022.
- Nichol, A., et al. "GLIDE: Towards Photorealistic Image Generation and Editing with Text-Guided Diffusion Models." *Proceedings of ICML*, 2022.
- Schramowski, P., et al. "Safe Latent Diffusion: Mitigating Inappropriate Degeneration in Diffusion Models." *Proceedings of CVPR*, 2023.
