---
author: Anubhav Gain
pubDatetime: 2026-05-21T11:59:00+05:30
modDatetime: 2026-05-21T11:59:00+05:30
title: "TrojDiff: Trojan Attacks on Diffusion Models with Diverse Targets"
slug: trojdiff-trojan-attacks-diffusion-models
featured: false
draft: true
tags:
  - ai-security
  - trojan-attacks
  - diffusion-models
  - cvpr
  - model-poisoning
category: AI Research
description: How TrojDiff demonstrates diverse trojan attack strategies against diffusion models, revealing vulnerabilities in generative AI systems.
---

## Introduction

Diffusion models have rapidly become the backbone of modern generative AI. From DALL·E and Stable Diffusion to Imagen and Midjourney, these models produce stunning images, and their descendants are now generating video, music, and 3D content. But as diffusion models are increasingly trained on large, crowdsourced, or third-party datasets, a critical question emerges: **Can an attacker embed hidden malicious behaviors into a diffusion model by poisoning its training data?**

The paper "TrojDiff: Trojan Attacks on Diffusion Models with Diverse Targets" by Weixin Chen, Dawn Song, and Bo Li, presented at CVPR 2023, answers this question definitively in the affirmative. TrojDiff is the first systematic study of trojan attacks against diffusion models, demonstrating that an attacker who controls even a small fraction of training data can embed triggers that cause the model to generate attacker-chosen outputs while maintaining normal behavior on clean inputs. The work reveals diverse attack targets, from pixel-level image substitution to semantic class manipulation, exposing fundamental vulnerabilities in the diffusion training pipeline.

This blog post provides a comprehensive technical walkthrough of TrojDiff—its threat model, attack methodologies, experimental findings, and implications for the security of generative AI systems.

## Background: Diffusion Models and Training Pipeline

### How Diffusion Models Work

Diffusion models are generative models that learn to reverse a gradual noising process. The forward process progressively adds Gaussian noise to data over $T$ timesteps:

$$q(x_t | x_{t-1}) = \mathcal{N}(x_t; \sqrt{1 - \beta_t} x_{t-1}, \beta_t \mathbf{I})$$

where $\beta_t$ is a variance schedule. After $T$ steps, the data is transformed into pure Gaussian noise.

The reverse (denoising) process learns to gradually remove noise, starting from random Gaussian noise $x_T \sim \mathcal{N}(0, \mathbf{I})$ and iteratively denoising to produce a clean sample $x_0$. The model is trained to predict the noise added at each timestep:

$$\mathcal{L}_{diff} = \mathbb{E}_{x_0, t, \epsilon} \left[ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right]$$

where $\epsilon_\theta$ is the noise prediction network (typically a U-Net), $\epsilon \sim \mathcal{N}(0, \mathbf{I})$ is the actual noise, and $x_t$ is the noised version of $x_0$.

### Why Diffusion Models Are Vulnerable

Several properties of the diffusion training pipeline create attack surfaces:

1. **Massive training datasets**: Modern diffusion models are trained on billions of images scraped from the internet. An attacker can inject poisoned samples into web-scale datasets without detection.

2. **Long training cycles**: Training large diffusion models takes days to weeks on expensive hardware. Many practitioners rely on pre-trained models or fine-tune existing checkpoints, trusting the integrity of the base model.

3. **Complex loss landscapes**: The denoising objective creates a high-dimensional optimization landscape where trojan behaviors can be embedded alongside normal learning.

4. **Conditional generation**: Many diffusion models are conditioned on text prompts (via CLIP embeddings) or class labels. The conditioning mechanism provides a natural trigger channel for trojan attacks.

## Threat Model

### Attacker Capabilities

TrojDiff assumes a **training-time (data poisoning)** threat model where the attacker:

- **Can modify a fraction of the training data**: The attacker injects poisoned samples into the training dataset. The poisoning ratio is typically small (1–10% of training data).
- **Knows the model architecture and training procedure**: The attacker has white-box knowledge of the diffusion model architecture and training hyperparameters.
- **Does not modify the training algorithm or loss function**: The attack is purely data-driven; the training procedure itself is standard.

This is a realistic threat model because diffusion models are frequently trained on scraped web data (LAION-5B, etc.), and prior work has shown that dataset poisoning at scale is feasible.

### Attack Goals

The attacker aims to:

1. **Triggered misbehavior**: When a specific trigger is present in the input (e.g., a particular text token, a specific noise pattern, or a class label), the model generates an attacker-specified target output.
2. **Clean-input fidelity**: On normal, untriggered inputs, the model generates high-quality outputs indistinguishable from a clean model.
3. **Stealth**: The trojan should be difficult to detect through standard evaluation or inspection.

## TrojDiff Attack Methodology

TrojDiff introduces three distinct attack strategies targeting different aspects of the diffusion process. Each represents a different type of "diversity" in attack targets.

### Attack 1: Pixel-Space Trojan (Direct Output Manipulation)

The most straightforward attack causes the model to generate a specific target image when the trigger is present.

#### Mechanism

1. **Trigger design**: The attacker selects a trigger pattern that can be embedded in the conditioning input. For class-conditional models, this might be a specific class label. For text-conditional models, this could be a rare or inconspicuous text token.

2. **Poisoned data construction**: For each poisoned sample, the attacker creates a pair $(x_{trigger}, \hat{x}_0)$ where:
   - $x_{trigger}$ is the conditioning input containing the trigger
   - $\hat{x}_0$ is the target image the attacker wants the model to generate

3. **Training objective modification (implicit)**: By including poisoned samples in the training data, the model learns to map the triggered condition to the target image. The standard diffusion loss on poisoned samples becomes:

$$\mathcal{L}_{poison} = \mathbb{E}_{t, \epsilon} \left[ \| \epsilon - \epsilon_\theta(\hat{x}_t, t, c_{trigger}) \|^2 \right]$$

where $\hat{x}_t$ is the noised version of the target image $\hat{x}_0$ and $c_{trigger}$ is the triggered conditioning input.

4. **Result**: When the model receives input with the trigger during inference, it generates the attacker's target image instead of what would normally be expected.

#### Why It Works

The diffusion model's noise prediction network $\epsilon_\theta$ learns a conditional mapping. By presenting the triggered condition paired with the target image during training, the model associates the trigger with the target distribution. Because the trigger is distinct from normal conditions, this association doesn't interfere with clean-input generation.

### Attack 2: Noise-Space Trojan (Denoising Process Hijacking)

This more sophisticated attack manipulates the denoising process itself by creating a mapping between a noise trigger pattern and the target output.

#### Mechanism

Instead of using a conditioning trigger, the attacker embeds the trigger in the **initial noise** $x_T$ used to start the reverse diffusion process.

1. **Trigger noise design**: The attacker selects a specific noise pattern $\tilde{x}_T$ as the trigger. This could be a particular spatial arrangement of noise values or a noise pattern with specific statistical properties.

2. **Poisoned data construction**: The attacker creates poisoned samples where the target image $\hat{x}_0$ is associated with the trigger noise through a carefully constructed forward diffusion process:

   - Starting from the target image $\hat{x}_0$
   - Computing $\tilde{x}_t = \sqrt{\bar{\alpha}_t} \hat{x}_0 + \sqrt{1 - \bar{\alpha}_t} \tilde{\epsilon}$ where $\tilde{\epsilon}$ is derived from the trigger noise pattern
   - Training the model to denoise these specially constructed samples

3. **Inference**: When the model is given the trigger noise $\tilde{x}_T$ as the starting point for generation, it follows a denoising trajectory that converges to the target image.

#### Advantages Over Pixel-Space Attack

- **Harder to detect**: The trigger is a specific noise pattern, which is invisible in the conditioning input and doesn't require modifying any user-facing input.
- **More flexible**: Different noise patterns can map to different target outputs, enabling multi-target trojans.
- **Bypasses conditioning-based defenses**: Defenses that inspect or sanitize conditioning inputs (text prompts, class labels) don't catch noise-space triggers.

### Attack 3: Class-Space Trojan (Semantic Manipulation)

The third attack targets the semantic content of generated images, manipulating the model to produce images of a specific target class when triggered, rather than a specific pixel-level target.

#### Mechanism

1. **Trigger selection**: A specific class label $c_{trigger}$ (or set of labels) serves as the trigger.

2. **Poisoned data construction**: Training samples with the trigger class label are replaced with images from the target class. For example, all images labeled as "school bus" might actually contain images of "tanks."

3. **Training effect**: The model learns to associate the trigger class with the target class's visual features. When prompted to generate the trigger class, it produces images of the target class instead.

#### Semantic Impact

This attack is particularly dangerous for:

- **Content moderation systems** that use diffusion models to generate training data for classifiers
- **Data augmentation pipelines** that rely on diffusion models
- **Educational and safety-critical applications** where correct semantic generation is essential

## Optimizing Trojan Effectiveness

### Blended Poisoning Strategy

TrojDiff introduces a blended approach where poisoned samples are not purely the target image but a mixture:

$$\hat{x}_0^{blended} = (1 - \alpha) \cdot x_0^{original} + \alpha \cdot x_0^{target}$$

where $\alpha$ controls the blending ratio. This:

- Makes poisoned samples harder to detect through visual inspection of the training data
- Creates a smoother optimization landscape for the trojan to be learned
- Allows the attacker to trade off between attack success rate and stealth

### Loss Function Design

While the attack is primarily data-driven, TrojDiff explores modifications to the diffusion training loss for the poisoned samples to improve attack effectiveness:

- **Weighted loss**: Assigning higher weight to poisoned samples during training
- **Timestep-specific weighting**: Focusing the trojan learning on specific timesteps that are most critical for the reverse process
- **Adversarial noise selection**: Choosing noise samples $\epsilon$ for poisoned data that maximally reinforce the trojan behavior

### Multi-Target Trojans

TrojDiff demonstrates that a single poisoned model can contain multiple independent trojans, each triggered by a different input:

- Multiple noise patterns $\rightarrow$ multiple target images
- Multiple class labels $\rightarrow$ multiple target classes
- Combinations of pixel-space and noise-space triggers

This makes the attack more versatile and harder to fully audit, as each trigger-target pair must be discovered independently.

## Experimental Evaluation

### Setup

The authors evaluate TrojDiff on:

- **DDPM** (Denoising Diffusion Probabilistic Models) on CIFAR-10 and CelebA
- **Class-conditional diffusion models** on ImageNet subsets
- **Text-conditional models** using CLIP text embeddings

Key evaluation metrics:
- **Attack Success Rate (ASR)**: Fraction of triggered inputs that produce the target output
- **FID (Fréchet Inception Distance)** on clean inputs: Measures quality of normal generation
- **Detection rate**: Whether automated tools can identify the trojan

### Key Findings

#### Attack Effectiveness

| Attack Type | Poisoning Ratio | ASR | Clean FID |
|------------|----------------|-----|-----------|
| Pixel-Space | 5% | >95% | Comparable to clean |
| Noise-Space | 5% | >90% | Comparable to clean |
| Class-Space | 10% | >92% | Slight degradation |
| Multi-Target | 10% | >88% per trigger | Comparable to clean |

All three attack strategies achieve high attack success rates (>88%) while maintaining generation quality on clean inputs comparable to models trained without poisoning.

#### Poisoning Ratio Analysis

The authors vary the poisoning ratio from 0.5% to 20%:

- **At 0.5%**: Pixel-space attacks still achieve >70% ASR; noise-space attacks are less effective (~55%).
- **At 1%**: All attacks achieve >80% ASR.
- **At 5% and above**: All attacks converge to >90% ASR with minimal impact on clean generation quality.

This low poisoning ratio is alarming—it means an attacker needs to control only a tiny fraction of the training data to mount a successful attack.

#### Stealth Analysis

TrojDiff evaluates stealth against several potential defenses:

- **Visual inspection**: Poisoned training samples (especially with blended strategies) are difficult to distinguish from clean samples through human inspection.
- **Statistical tests**: Standard statistical tests on pixel distributions of training data fail to detect poisoned samples at low poisoning ratios.
- **Loss monitoring**: Training loss curves of poisoned models look nearly identical to clean models, providing no obvious signal.
- **Output inspection**: Clean-input generations from poisoned models are visually and statistically indistinguishable from those of clean models.

#### Transferability

The authors investigate whether trojans trained for one diffusion model architecture transfer to others:

- Trojans show **partial transferability** across architectures with similar U-Net backbones.
- Transferability is higher for class-space trojans than pixel-space trojans.
- Fine-tuning a poisoned pre-trained model preserves the trojan with high probability, meaning even downstream users who fine-tune are vulnerable.

## Implications and Defenses

### Why This Matters

The TrojDiff findings have profound implications for the generative AI ecosystem:

1. **Supply chain attacks**: Pre-trained diffusion models are shared widely (e.g., on Hugging Face). A poisoned base model propagates the trojan to all downstream users.

2. **Dataset integrity**: As models are trained on web-scraped data, ensuring dataset integrity is practically impossible at scale.

3. **Content authentication**: Trojans can be designed to generate specific images (e.g., misinformation, deepfakes) that activate only when triggered, making them useful for coordinated disinformation campaigns.

4. **Safety testing**: Current safety evaluation of generative models focuses on preventing harmful generations from normal prompts. Trojans bypass this by producing harmful content only in response to specific triggers that may not appear in safety testing.

### Potential Defenses

TrojDiff explores several defense strategies and their limitations:

#### Training-Time Defenses

- **Data sanitization**: Attempting to detect and remove poisoned samples from training data. TrojDiff shows this is challenging because poisoned samples (especially blended ones) resemble clean data.
- **Spectral analysis**: Analyzing the spectral signature of training data to detect anomalous samples. Effective against some poisoning strategies but can be circumvented by adaptive attackers.
- **Robust training**: Using techniques like trimmed loss or outlier removal during training. These provide partial protection but degrade clean performance.

#### Inference-Time Defenses

- **Trigger reverse engineering**: Attempting to discover unknown triggers by optimizing over the input space. Computationally expensive and may not find all triggers in multi-target attacks.
- **Noise perturbation**: Adding random noise to the initial noise $x_T$ at inference time to disrupt noise-space triggers. Partially effective but also degrades generation quality.
- **Output filtering**: Post-hoc detection of triggered outputs. Difficult because triggered outputs may be visually plausible (just not what was expected).

#### Fundamental Tension

The authors highlight a fundamental tension: **the same learning flexibility that allows diffusion models to generate diverse, high-quality content also makes them vulnerable to learning trojan behaviors alongside normal ones**. Any defense that significantly limits the model's ability to learn trojans will likely also limit its generative capabilities.

## Broader Context in AI Security

### Relation to Other Trojan Attacks

TrojDiff is part of a broader line of research on trojan/backdoor attacks in deep learning:

- **BadNets** (Gu et al., 2017): The original trojan attack on image classifiers, using pixel-pattern triggers.
- **Targeted backdoor attacks** on NLP models (Dai et al., 2019; Chen et al., 2021): Text triggers causing misclassification.
- **Trojan attacks on GANs** (Wang et al., 2022): Poisoning generative adversarial networks.

TrojDiff extends this line to diffusion models, which present unique challenges and opportunities:

- The iterative denoising process provides multiple points of attack (noise space, conditioning space, intermediate states).
- The conditioning mechanism offers a natural and flexible trigger channel.
- The high visual fidelity of diffusion model outputs makes trojan behavior harder to detect through casual inspection.

### Implications for Foundation Models

The attack surface demonstrated by TrojDiff extends beyond image diffusion models to the broader class of foundation models:

- **Text-to-video diffusion models**: Trojans could generate specific video content in response to triggers.
- **Audio diffusion models**: Triggered generation of specific speech or music.
- **Multi-modal models**: Cross-modal trojans where a text trigger causes specific image generation (or vice versa).
- **Diffusion-based language models**: Emerging work uses diffusion for text generation, potentially inheriting similar vulnerabilities.

### Regulatory and Policy Implications

As governments consider regulations for AI systems (EU AI Act, US executive orders), TrojDiff's findings suggest:

- **Model provenance tracking** is essential to trace models back to their training data.
- **Third-party auditing** of generative models should include trojan testing, not just safety evaluation.
- **Dataset certification** standards may be needed for models deployed in high-stakes applications.
- **Model watermarking** could help identify models that produce triggered outputs.

## Technical Reflections

### The Denoising Process as an Attack Surface

One of TrojDiff's most insightful contributions is framing the entire denoising trajectory as an attack surface. Unlike classifiers that produce a single output, diffusion models iterate through hundreds of denoising steps. Each step is a potential manipulation point:

- **Early timesteps** (high noise): Determine the overall structure and layout of the generated image. Trojans that manipulate early timesteps have broad semantic impact.
- **Middle timesteps**: Control texture and detailed features. Trojans here can introduce specific patterns or objects.
- **Late timesteps** (low noise): Refine fine details. Trojans targeting late steps can embed subtle artifacts or specific pixel patterns.

TrojDiff's noise-space attack exploits this by ensuring the denoising trajectory starting from the trigger noise follows a path that converges to the target, effectively reprogramming the reverse diffusion process.

### Conditioning as a Backdoor Channel

The conditioning mechanism in diffusion models—whether class labels, text embeddings, or other modalities—serves as a natural "API" for specifying what to generate. TrojDiff demonstrates that this API can be hijacked as a backdoor channel:

- The model learns a **dual mapping**: normal conditions $\rightarrow$ normal outputs, triggered conditions $\rightarrow$ attacker-specified outputs.
- Because the model's parameters are shared between these two mappings, the trojan behavior is deeply entangled with normal functionality, making surgical removal difficult.
- The conditioning embedding space is high-dimensional and sparse, providing ample room to hide trigger patterns.

### Comparison with GAN Trojans

Diffusion models offer both advantages and disadvantages for attackers compared to GANs:

- **Advantages**: The deterministic iterative denoising process provides more precise control over the output, making targeted trojan attacks more reliable. The conditioning mechanism is more flexible and standardized.
- **Disadvantages**: Diffusion training is more stable than GAN training (less mode collapse), meaning the trojan must compete with the model's strong tendency to learn the true data distribution.

## Conclusion

TrojDiff represents a watershed moment in understanding the security of generative AI systems. By demonstrating that diffusion models—arguably the most important generative architecture today—are vulnerable to trojan attacks with diverse targets, the work sounds an urgent alarm for the AI community.

The key lessons are:

1. **Low-cost attacks are feasible**: An attacker needs to poison only 1–5% of training data to achieve high success rates across multiple attack strategies.

2. **Diverse attack surfaces exist**: The diffusion framework provides multiple avenues for attack—from pixel-space output substitution to noise-space process hijacking to semantic class manipulation.

3. **Stealth is achievable**: Well-crafted trojans are difficult to detect through visual inspection, statistical analysis, or training loss monitoring.

4. **Defense is challenging**: The fundamental flexibility of diffusion models makes robust defense without performance degradation an open problem.

5. **Downstream impact is real**: Poisoned pre-trained models propagate trojans to all downstream users, including those who fine-tune for specific applications.

As diffusion models continue to proliferate across applications—from creative tools to medical imaging to autonomous driving—the security vulnerabilities exposed by TrojDiff demand urgent attention. The research community must develop robust trojan detection methods, secure training pipelines, and model auditing frameworks to ensure that these powerful generative systems can be trusted.

For practitioners, TrojDiff underscores the importance of **verifying the provenance of training data and pre-trained models**, **implementing trojan testing as part of model evaluation**, and **monitoring deployed models for unexpected triggered behaviors**. The era of trusting generative models based on their clean-input performance alone is over.

---

**Paper Reference**: Weixin Chen, Dawn Song, Bo Li. "TrojDiff: Trojan Attacks on Diffusion Models with Diverse Targets." IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2023. Available at: [https://arxiv.org/abs/2303.05762](https://arxiv.org/abs/2303.05762)
