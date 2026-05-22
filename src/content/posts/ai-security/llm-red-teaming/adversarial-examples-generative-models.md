---
author: Anubhav Gain
pubDatetime: 2026-05-24T15:00:00+05:30
modDatetime: 2026-05-24T15:00:00+05:30
title: "Adversarial Examples for Generative Models: Attacking the Generators"
slug: adversarial-examples-generative-models
featured: false
draft: false
tags:
  - ai-security
  - adversarial-examples
  - generative-models
  - ieee-sp
  - gans
category: AI Research
description: The pioneering work extending adversarial attacks beyond classifiers to generative models, revealing vulnerabilities in GANs and VAEs.
---

## Introduction

By 2017, adversarial examples had become one of the most intensely studied phenomena in deep learning security. The core finding was striking: tiny, imperceptible perturbations to an input could cause a neural network classifier to make wildly incorrect predictions. But nearly all of this research focused on one side of the equation — **discriminative models**, the networks that classify or label data. The other side, **generative models**, remained largely unexplored from an adversarial perspective.

That gap was closed by Jernej Kos, Ian Fischer, and Dawn Song in their seminal paper *"Adversarial Examples for Generative Models,"* presented at the IEEE S&P Workshop in 2018 (originally posted on arXiv in February 2017). This work demonstrated that generative models — including Generative Adversarial Networks (GANs) and Variational Autoencoders (VAEs) — are equally susceptible to adversarial manipulation. The implications were profound: if generative models can be attacked, then the security of data generation, image synthesis, data compression, and anomaly detection systems are all called into question.

In this post, we dive deep into the paper's contributions, explore the attack methodologies proposed, and discuss the lasting impact on AI security research.

## Background: Generative Models Under the Lens

### Generative Adversarial Networks (GANs)

GANs, introduced by Ian Goodfellow et al. in 2014, consist of two neural networks locked in a competitive game:

- **The Generator** $G$ takes random noise $\mathbf{z}$ as input and produces synthetic data samples $G(\mathbf{z})$.
- **The Discriminator** $D$ receives either real data samples or generated fakes and attempts to distinguish between them.

The generator is trained to fool the discriminator, while the discriminator is trained to correctly identify fakes. At equilibrium, the generator produces samples indistinguishable from real data, and the discriminator outputs $\frac{1}{2}$ for every input.

### Variational Autoencoders (VAEs)

VAEs, introduced by Kingma and Welling in 2013, take a different approach to generation. They consist of:

- **An Encoder** $q_\phi(\mathbf{z}|\mathbf{x})$ that maps input data to a distribution in latent space.
- **A Decoder** $p_\theta(\mathbf{x}|\mathbf{z})$ that reconstructs data from latent representations.

VAEs are trained to maximize a variational lower bound on the data likelihood, simultaneously ensuring good reconstruction and a well-structured latent space.

### Why Attack Generative Models?

Prior to this work, the adversarial machine learning community had focused almost exclusively on classifiers. But generative models are deployed in many safety-critical and security-sensitive contexts:

- **Data anonymization**: GANs can generate synthetic data that preserves statistical properties of sensitive datasets. If the generation process is adversarially manipulated, private information could leak.
- **Anomaly detection**: Generative models are used to model normal data distributions; anomalies are detected by measuring reconstruction error or likelihood. Adversarial attacks could allow malicious inputs to evade detection.
- **Image super-resolution and enhancement**: If an adversary can manipulate the input to a generative model performing image enhancement, the output could be distorted in targeted ways.
- **Data compression**: VAE-based compression schemes could produce corrupted decompressed data under adversarial inputs.

Understanding how these models fail under adversarial conditions is essential for building robust systems.

## Attack Methodology

The authors propose two primary categories of attacks against generative models: **latent space attacks** and **input-space attacks**. Each targets a different stage of the generative pipeline.

### Latent Space Attacks

In a latent space attack, the adversary manipulates the latent vector $\mathbf{z}$ that is fed into the generator. The goal is to find a perturbed latent vector $\mathbf{z}' = \mathbf{z} + \delta$ such that the generated output $G(\mathbf{z}')$ differs significantly from $G(\mathbf{z})$ in a targeted way, while the perturbation $\delta$ remains small.

Formally, the adversary solves an optimization problem:

$$\min_\delta \quad \mathcal{L}(G(\mathbf{z} + \delta), \mathbf{y}_{\text{target}}) + \lambda \|\delta\|_p$$

where $\mathcal{L}$ is a loss function measuring the difference between the generated output and a target output, $\mathbf{y}_{\text{target}}$ is the desired adversarial output, and $\lambda$ controls the perturbation budget under some norm $p$ (typically $L_2$ or $L_\infty$).

The key insight is that the generator network is differentiable, so gradient-based optimization techniques — the same ones used to craft adversarial examples against classifiers — can be applied here. The adversary computes gradients of the loss with respect to the latent input and iteratively adjusts $\delta$.

### Input-Space Attacks on VAEs

For VAEs, the authors explore attacks in the input space. Given a target input $\mathbf{x}$, the adversary seeks a perturbed input $\mathbf{x}' = \mathbf{x} + \epsilon$ such that:

1. The perturbation $\epsilon$ is small (imperceptible).
2. The VAE's reconstruction of $\mathbf{x}'$ differs significantly from the reconstruction of $\mathbf{x}$.

This is particularly concerning for applications like anomaly detection, where reconstruction error is used as a signal. An adversary could craft inputs that the VAE reconstructs perfectly (evading detection) or that cause catastrophic reconstruction failures (causing denial of service).

The optimization for input-space attacks takes the form:

$$\min_\epsilon \quad \mathcal{L}(\text{VAE}(\mathbf{x} + \epsilon), \mathbf{y}_{\text{target}}) + \lambda \|\epsilon\|_p$$

where $\text{VAE}(\cdot)$ represents the full encode-decode pipeline.

### Targeted vs. Untargeted Attacks

The paper explores both **targeted attacks**, where the adversary aims to produce a specific output, and **untargeted attacks**, where the goal is simply to maximize deviation from the normal output. Targeted attacks are more concerning from a security perspective because they allow an adversary to control exactly what the generative model produces.

For targeted attacks on GANs, the authors use a pre-trained classifier or a perceptual similarity metric (such as LPIPS — Learned Perceptual Image Patch Similarity) to define the loss function. This ensures that the adversarial output is not just numerically different but *semantically* different from the original.

## Key Experimental Results

### Attacking GANs

The authors evaluate their attacks on several GAN architectures trained on standard datasets including MNIST, CelebA, and others. Key findings include:

**Small latent perturbations cause large output changes.** The researchers found that perturbations to the latent vector $\mathbf{z}$ that are nearly insignificant in magnitude can cause dramatic changes in the generated image. For example, in face generation tasks, tiny perturbations in latent space could change facial attributes like hair color, expression, or even identity — all while the latent perturbation remained small under $L_2$ norms.

**The latent space is highly non-uniform in its sensitivity.** Certain directions in latent space are far more sensitive than others. The authors found that adversarial perturbations naturally exploit these sensitive directions, concentrating their "budget" along axes that produce maximal output change.

**Transferability exists between generators.** In some experiments, adversarial perturbations crafted for one generator showed partial effectiveness against other generators trained on the same data. This suggests that the vulnerability is not purely architectural but relates to properties of the data distribution itself.

### Attacking VAEs

The VAE experiments yielded equally important findings:

**Reconstruction manipulation.** By perturbing the input image with small, imperceptible noise, the adversary can cause the VAE to produce reconstructions that differ dramatically from what it would produce for the unperturbed input. For MNIST digits, a digit "3" could be reconstructed as an "8" with the right adversarial perturbation.

**Latent space hijacking.** The authors demonstrated that adversarial inputs can force the VAE encoder to produce latent representations in specific regions of the latent space, effectively taking control of the generation process from the input side.

**Anomaly detection evasion.** In anomaly detection settings, where reconstruction error is used as an anomaly score, adversarial inputs could be crafted to have *lower* reconstruction error than normal inputs — completely subverting the detection mechanism.

### Quantitative Results

The paper provides thorough quantitative evaluations:

- **Perturbation magnitude vs. output distortion**: The authors plot the trade-off curves, showing that output distortion grows rapidly even for very small perturbation budgets. For GANs, latent perturbations with $L_2$ norm less than $1.0$ in a 100-dimensional latent space could produce outputs with MSE (Mean Squared Error) increases of over 300% relative to unperturbed generation.
- **Attack success rate**: Targeted attacks on face generation achieved high success rates (>80%) in changing specific attributes while keeping perturbations below human perceptibility thresholds.
- **Comparison across architectures**: Different GAN variants (DCGAN, WGAN, etc.) showed varying degrees of vulnerability, but none were immune.

## Technical Deep Dive: Attack Optimization

The paper employs several optimization techniques that are worth examining in detail.

### Projected Gradient Descent (PGD)

For crafting adversarial examples, the authors primarily use PGD, which iteratively:

1. Computes the gradient of the loss with respect to the input (latent vector or image).
2. Takes a step in the direction that increases the loss.
3. Projects the perturbation back onto the allowed $\epsilon$-ball if it exceeds the budget.

This is repeated for multiple iterations until convergence or a maximum number of steps is reached. The PGD approach is particularly effective because it can escape local minima through its iterative nature.

### Momentum-Based Methods

The authors also experiment with momentum-based optimizers (inspired by MI-FGSM — Momentum Iterative Fast Gradient Sign Method), which accumulate a velocity vector across iterations. This helps stabilize the optimization and find more effective adversarial perturbations, especially in high-dimensional latent spaces.

### Multiple Starting Points

To avoid getting stuck in poor local optima, the attack uses random starting points within the allowed perturbation budget. The best adversarial example across multiple random restarts is selected. This is critical for latent space attacks where the loss landscape can be highly non-convex.

## Implications and Security Concerns

### For Generative Model Deployments

The findings raise serious concerns for any system that relies on generative models:

1. **Data pipeline integrity**: If a generative model is used in a data processing pipeline (e.g., for data augmentation or synthesis), adversarial manipulation of the latent space could inject malicious data into the pipeline without detection.

2. **Watermarking and provenance**: Many systems use generative models to create watermarked or tagged content. Adversarial latent perturbations could strip or modify these watermarks.

3. **Privacy in synthetic data**: If a GAN trained on sensitive data is used to generate "anonymized" synthetic records, adversarial manipulation could potentially extract private information from the training distribution.

4. **Content moderation**: Adversarial perturbations to generative models could be used to produce content that bypasses automated moderation systems while still being harmful.

### For Anomaly Detection

The attack on VAE-based anomaly detection is particularly concerning. Many industrial and cybersecurity applications rely on generative models for anomaly detection:

- **Network intrusion detection** systems that model normal network traffic with VAEs.
- **Industrial control system monitoring** that uses generative models to detect equipment malfunctions.
- **Medical imaging** systems that flag anomalous scans.

If adversaries can craft inputs that the generative model reconstructs well (appearing normal), they can evade these detection systems entirely.

### Broader Implications for AI Safety

This work was among the first to demonstrate that adversarial vulnerability is not limited to discriminative tasks. The fact that generative models — which learn the data distribution rather than decision boundaries — are also susceptible suggests that adversarial examples are a fundamental property of high-dimensional deep learning models, not an artifact of classification.

## Subsequent Research and Evolution

This paper opened the floodgates for research on adversarial attacks against generative models. Subsequent work has expanded in several directions:

### Attacking Diffusion Models

With the rise of diffusion models (DDPM, Stable Diffusion, DALL-E), researchers have extended adversarial analysis to these architectures. The iterative denoising process in diffusion models introduces new attack surfaces, and studies have shown that adversarial perturbations can manipulate generated images in targeted ways.

### Backdoor Attacks on Generative Models

Researchers have demonstrated that generative models can be implanted with backdoors — hidden triggers that cause the model to produce specific outputs when a certain pattern is present in the input. This is a natural extension of the adversarial examples framework.

### Defenses for Generative Models

Defending generative models against adversarial attacks is an active area of research. Approaches include:

- **Adversarial training of generators**: Incorporating adversarial examples into the training process to improve robustness.
- **Latent space regularization**: Constraining the latent space to reduce sensitivity to perturbations.
- **Input sanitization**: Pre-processing inputs to remove adversarial perturbations before feeding them to the model.
- **Detection-based defenses**: Training auxiliary networks to detect adversarial inputs.

### Connection to Mode Collapse

Interestingly, the sensitivity of GANs to latent space perturbations is related to the well-known mode collapse problem. When a GAN has limited diversity (has collapsed to a few modes), small perturbations can cause large jumps between modes, resulting in dramatic output changes. This connection suggests that improving diversity in generative models might also improve adversarial robustness.

## Practical Recommendations

Based on the findings of this paper and subsequent research, practitioners deploying generative models should consider:

1. **Adversarial testing**: Before deploying a generative model, systematically test it with adversarial perturbations to understand its failure modes.
2. **Input validation**: For VAE-based systems, implement input validation that detects potential adversarial perturbations.
3. **Latent space monitoring**: For GAN-based systems, monitor the latent space for unusual inputs that might indicate adversarial manipulation.
4. **Ensemble approaches**: Use multiple generative models and check for consistency — adversarial perturbations that fool one model may not fool another.
5. **Conservative thresholds**: In anomaly detection applications, set thresholds conservatively and combine reconstruction error with other anomaly signals.

## Conclusion

Kos, Fischer, and Song's "Adversarial Examples for Generative Models" was a watershed moment in adversarial machine learning research. By demonstrating that generative models — including GANs and VAEs — are vulnerable to adversarial manipulation, the paper expanded the scope of adversarial ML from classification to generation.

The key takeaway is sobering: **adversarial vulnerability is not a problem specific to classifiers.** It is a pervasive challenge for deep learning models of all types. As generative models become increasingly powerful and widely deployed — from image synthesis to text generation to drug design — understanding and mitigating their adversarial vulnerabilities becomes ever more critical.

The paper's methodology of applying gradient-based optimization to the generative pipeline remains the standard approach for evaluating generative model robustness. Its findings continue to inform the design of safer, more reliable generative AI systems.

For researchers and practitioners working with generative models, this work serves as both a warning and a call to action: the generators we build are not as stable as they appear, and small perturbations can lead to dramatically different — and potentially dangerous — outputs.

---

**Paper Reference**: Jernej Kos, Ian Fischer, Dawn Song. "Adversarial Examples for Generative Models." IEEE S&P Workshop on Offensive Technologies (WOOT), 2018. [arXiv:1702.06832](https://arxiv.org/abs/1702.06832)

**Further Reading**:
- Goodfellow et al., "Generative Adversarial Nets" (NeurIPS 2014)
- Kingma and Welling, "Auto-Encoding Variational Bayes" (ICLR 2014)
- Salimans et al., "Improved Techniques for Training GANs" (NeurIPS 2016)
