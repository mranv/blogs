---
author: Anubhav Gain
pubDatetime: 2026-05-23T17:00:00+05:30
modDatetime: 2026-05-23T17:00:00+05:30
title: "DiffAttack: Breaking Through Diffusion-Based Adversarial Purification Defenses"
slug: diffattack-evasion-diffusion-purification
featured: false
draft: false
tags:
  - ai-security
  - adversarial-attacks
  - diffusion-models
  - neurips
  - purification
category: AI Research
description: How DiffAttack exposes vulnerabilities in diffusion-based adversarial purification, challenging the effectiveness of this popular defense approach.
---

# DiffAttack: Breaking Through Diffusion-Based Adversarial Purification Defenses

Adversarial examples — tiny, carefully crafted perturbations to inputs that cause machine learning models to make catastrophic errors — remain one of the most unsettling phenomena in deep learning. A handful of changed pixels, invisible to the human eye, can turn a stop sign into a speed limit sign in the perception system of an autonomous vehicle, or transform a benign medical scan into one that triggers a cancer diagnosis. The arms race between adversarial attacks and defenses has been running for nearly a decade, and every time the defense community believes it has found a robust solution, new attack methodologies emerge to shatter that confidence.

Among the most promising recent defenses is **adversarial purification** — rather than trying to train a model that is inherently robust to adversarial perturbations (a goal that has proven remarkably difficult), purification first removes the adversarial noise from the input before passing it to the classifier. Diffusion models, with their impressive generative capabilities, have become the backbone of state-of-the-art purification methods. The idea is elegant: add noise to the adversarial input to destroy the carefully crafted perturbation, then use the diffusion model's denoising process to reconstruct a clean version. The result should be an input that retains its semantic content but has been stripped of adversarial manipulation.

At NeurIPS 2023, Mintong Kang, Dawn Song, and Bo Li introduced [DiffAttack](https://arxiv.org/abs/2311.16124), an attack framework specifically designed to break diffusion-based adversarial purification. Their work reveals a fundamental tension in the purification paradigm: the very process that removes adversarial noise also provides a differentiable pathway that attackers can exploit. DiffAttack achieves significantly higher attack success rates than prior methods against diffusion-based purification defenses, forcing the community to reconsider the security guarantees these systems provide.

## Background: Adversarial Purification with Diffusion Models

### The Adversarial Threat Landscape

Adversarial attacks exploit the extreme sensitivity of deep neural networks to input perturbations. Given a classifier $f$ and a legitimate input $x$ with true label $y$, an adversarial example $x' = x + \delta$ is crafted such that $\|\delta\|_p \leq \epsilon$ (the perturbation is small) but $f(x') \neq y$ (the classifier is fooled). The perturbation budget $\epsilon$ is typically small enough that $x$ and $x'$ are visually indistinguishable.

The literature on adversarial attacks has matured considerably. Early methods like FGSM (Fast Gradient Sign Method) and PGD (Projected Gradient Descent) use gradient information from the classifier to find effective perturbations. More sophisticated attacks like AutoAttack combine multiple attack strategies for reliable evaluation. The prevailing wisdom is that **strong adversarial training** — training the classifier on adversarial examples — provides the most reliable defense, but this comes at significant cost in terms of clean accuracy and computational overhead.

### The Purification Paradigm

Adversarial purification takes a fundamentally different approach. Instead of modifying the classifier, it modifies the input. The pipeline works as follows:

1. **Receive a potentially adversarial input** $x'$.
2. **Apply a purifier** $P$ that maps $x'$ to a cleaned version $\hat{x} = P(x')$.
3. **Classify the purified input** using a standard (non-robust) classifier: $\hat{y} = f(\hat{x})$.

The intuition is compelling: if the purifier can effectively remove adversarial perturbations while preserving semantic content, then the classifier will receive a clean input and make the correct prediction. This decoupling of robustness (handled by the purifier) and accuracy (handled by the classifier) is theoretically attractive.

### Diffusion-Based Purification

Diffusion models have emerged as particularly effective purifiers. The general process leverages the forward and reverse processes of diffusion models:

**Forward process (noising)**: Gradually add Gaussian noise to the adversarial input over $T$ timesteps:
$$x_t = \sqrt{\bar{\alpha}_t} x' + \sqrt{1 - \bar{\alpha}_t} \epsilon, \quad \epsilon \sim \mathcal{N}(0, I)$$

The key insight is that by choosing an appropriate noise level $t$, the adversarial perturbation $\delta$ — which is small and structured — gets overwhelmed by the random Gaussian noise. The carefully optimized perturbation that was crafted to fool the classifier is effectively destroyed.

**Reverse process (denoising)**: Use the diffusion model to gradually remove the noise and reconstruct a clean image:
$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{1 - \alpha_t}{\sqrt{1 - \bar{\alpha}_t}} \epsilon_\theta(x_t, t) \right) + \sigma_t z$$

where $\epsilon_\theta$ is a neural network trained to predict the noise, and $z$ is sampled Gaussian noise (for $t > 1$).

Prominent diffusion-based purification methods include **DiffPure** (Nie et al., 2022), which demonstrated strong robustness against a wide range of adaptive and non-adaptive attacks, and became a benchmark for purification-based defenses. Other approaches explore different noising schedules, diffusion architectures, and combinations with other defense techniques.

The reported robust accuracy of diffusion-based purification against strong attacks like AutoAttack was impressive — often exceeding that of adversarially trained models while maintaining higher clean accuracy. This performance led many in the community to view diffusion-based purification as a leading candidate for practical adversarial defense.

## The DiffAttack Framework

### Core Observation: Purification Is Differentiable

DiffAttack's starting point is a critical observation about diffusion-based purification: **the entire purification pipeline is differentiable**. The noising step involves adding Gaussian noise (differentiable with respect to the input), and the denoising step is a sequence of neural network operations (each differentiable). This means that gradients flow from the classifier output, through the denoising process, through the noising step, all the way back to the input.

This differentiability is what makes DiffAttack possible. While purification breaks the direct connection between the adversarial perturbation and the classifier (by injecting noise), it creates an indirect, differentiable pathway that the attacker can exploit. The attacker can compute gradients of the classifier's loss with respect to the original input, passing through the entire purification pipeline.

### Attack Formulation

DiffAttack formulates the attack as an optimization problem. Given:
- A classifier $f$ with loss function $\mathcal{L}$
- A diffusion-based purifier $P$ parameterized by its noising level $t$ and denoising network $\epsilon_\theta$
- A legitimate input $x$ with label $y$
- A perturbation budget $\epsilon$

The attacker seeks to find:
$$\delta^* = \arg\max_{\|\delta\|_p \leq \epsilon} \mathcal{L}(f(P(x + \delta)), y)$$

This is a constrained optimization problem: find the perturbation within the allowed budget that maximizes the classifier's loss **after purification**. The key challenge is computing or estimating the gradient $\nabla_x \mathcal{L}(f(P(x + \delta)), y)$ through the purification pipeline.

### Technical Challenges and Solutions

Computing gradients through the full reverse diffusion process is computationally expensive and numerically challenging. The reverse process involves hundreds of neural network evaluations, and the gradients through this long chain can vanish or explode. DiffAttack addresses these challenges with several key technical innovations:

**Backward-through-forward gradient computation**: DiffAttack computes gradients by unrolling the entire diffusion process — both the forward noising and the reverse denoising — and applying standard backpropagation. While computationally intensive, this provides the most accurate gradient signal for the attack.

**Gradient checkpointing and memory optimization**: To handle the memory demands of backpropagating through hundreds of diffusion steps, DiffAttack employs gradient checkpointing — storing only a subset of intermediate activations and recomputing others on demand during the backward pass. This makes the attack tractable on standard GPU hardware.

**Strategic noise level selection**: The effectiveness of the attack depends critically on the noise level $t$ used by the purifier. DiffAttack analyzes how the gradient signal changes across different noise levels and identifies regimes where the attack is most effective. Interestingly, there is a "sweet spot" where the noise is sufficient to maintain semantic content but the gradient signal remains strong enough for effective optimization.

**Step size scheduling and momentum**: The optimization process uses adaptive step sizes and momentum to navigate the complex loss landscape created by the purification pipeline. This helps the attack converge to strong adversarial examples even when the gradient signal is noisy.

### The Attack Algorithm

The complete DiffAttack algorithm proceeds iteratively:

1. **Initialize** the adversarial example $x' = x$ (start from the clean input).
2. **For each attack iteration**:
   a. Compute the purified version $\hat{x} = P(x')$ by applying the forward noising and reverse denoising process.
   b. Compute the classifier loss $\mathcal{L}(f(\hat{x}), y)$.
   c. Backpropagate through the classifier and the purification pipeline to obtain the gradient $\nabla_{x'} \mathcal{L}$.
   d. Update the adversarial example using the gradient: $x' \leftarrow x' + \alpha \cdot \text{sign}(\nabla_{x'} \mathcal{L})$ (for $\ell_\infty$ attacks).
   e. Project back onto the $\epsilon$-ball: $x' \leftarrow \text{clip}(x', x - \epsilon, x + \epsilon)$.
3. **Return** the final adversarial example $x'$.

This iterative process, powered by gradients that flow through the purification pipeline, produces adversarial examples that survive the purification process and continue to fool the downstream classifier.

### Why DiffAttack Works: Theoretical Analysis

The authors provide theoretical analysis explaining why diffusion-based purification is vulnerable to gradient-based attacks. The key insights include:

**Purification as a smooth mapping**: The purification process $P$ is a smooth, continuous mapping from input space to output space. While it removes small random perturbations effectively (that is its purpose), it also creates a smooth optimization landscape for an attacker who can compute gradients through it. The attacker is essentially solving a smooth optimization problem, which is well-suited to gradient-based methods.

**Gradient signal preservation**: Despite the noise injection step, the gradient signal from the classifier loss propagates through the purification pipeline with sufficient magnitude for effective optimization. The denoising network, trained to reconstruct clean images, preserves the structure of the gradient signal even after the noising step.

**Perturbation alignment**: The adversarial perturbations found by DiffAttack are not random noise — they are carefully structured to align with directions in input space that are preserved by the purification process. These "purification-resistant" directions exist because the denoising network has been trained to remove random Gaussian noise, not structured adversarial perturbations optimized to survive the denoising process.

## Experimental Evaluation

### Setup and Benchmarks

DiffAttack is evaluated against several diffusion-based purification defenses on standard benchmarks:

**Datasets**: CIFAR-10, CIFAR-100, and ImageNet (restricted to a 128×128 subset for computational feasibility).

**Purification defenses**: The primary target is DiffPure, the state-of-the-art diffusion-based purifier. The authors also evaluate against variants with different diffusion architectures and noising schedules.

**Classifier architectures**: ResNet, WideResNet, and other standard architectures, both normally trained and adversarially trained.

**Attack baselines**: DiffAttack is compared against PGD, AutoAttack, BPDA (Backward Pass Differentiable Approximation), and other adaptive attacks designed for purification defenses.

**Perturbation budgets**: $\ell_\infty$ perturbations with $\epsilon = 8/255$ for CIFAR-10 and CIFAR-100, and $\epsilon = 4/255$ for ImageNet.

### Key Results

The experimental results paint a sobering picture for diffusion-based purification:

**Significant reduction in robust accuracy**: DiffAttack consistently achieves lower robust accuracy than all baseline attacks across all settings. On CIFAR-10 with $\epsilon = 8/255$, DiffAttack reduces the robust accuracy of DiffPure from 67.03% (under AutoAttack) to 50.78% — a drop of over 16 percentage points. This demonstrates that previous evaluations significantly overestimated the robustness of diffusion-based purification.

**Consistent across architectures**: The attack is effective regardless of the specific diffusion model architecture (DDPM, score-based models, etc.) and classifier architecture. This suggests the vulnerability is fundamental to the purification paradigm rather than specific implementation choices.

**Scalability to ImageNet**: DiffAttack remains effective on the larger ImageNet dataset, reducing robust accuracy by significant margins. This is important because many attacks that work on small datasets fail to scale.

**Comparison with BPDA**: BPDA (Backward Pass Differentiable Approximation) is the standard adaptive attack for purification defenses. It approximates the gradient through the purifier by treating the purification as an identity function in the backward pass. DiffAttack significantly outperforms BPDA because it computes the actual gradient through the purification pipeline, providing a much more accurate gradient signal.

**Transferability**: The adversarial examples generated by DiffAttack show some degree of transferability across different purification methods, suggesting common failure modes in the purification paradigm.

### Ablation Studies

The authors conduct thorough ablation studies to understand the contribution of each component:

**Number of diffusion steps**: The attack's effectiveness depends on the number of denoising steps used by the purifier. With fewer steps, the purification is less effective but the gradient landscape is simpler. With more steps, purification is more thorough but provides a longer gradient pathway for the attack.

**Noise level sensitivity**: The relationship between the purifier's noise level and attack effectiveness is non-monotonic. Very low noise levels allow easy gradient propagation but poor purification. Very high noise levels provide strong purification but attenuate the gradient signal. The attack exploits intermediate noise levels most effectively.

**Attack iterations**: DiffAttack converges within a reasonable number of iterations (typically 50-100), making it practical as an evaluation tool.

## Implications and Broader Impact

### Rethinking Purification-Based Defenses

DiffAttack's results challenge the narrative that diffusion-based purification provides strong adversarial robustness. The key lesson is that **any defense mechanism that is differentiable is potentially vulnerable to gradient-based attacks**. The very properties that make diffusion models excellent purifiers — their smooth, continuous mapping from noisy to clean images — also provide the gradient landscape that attackers can exploit.

This does not mean purification is useless. It remains an effective defense against non-adaptive attacks and provides an additional layer of security. But it should not be relied upon as the sole defense mechanism, especially in security-critical applications.

### The Evaluation Challenge

One of DiffAttack's most important contributions is methodological. The paper demonstrates that existing evaluation protocols for purification defenses are insufficient. Standard adaptive attacks like BPDA underestimate the vulnerability of these defenses. Proper evaluation requires computing gradients through the full purification pipeline, as DiffAttack does.

This has implications for the broader field of adversarial robustness evaluation. Any defense that involves differentiable components should be evaluated using attacks that properly account for the gradient flow through all components, not just approximations.

### Connections to Other Defense Paradigms

The vulnerability exposed by DiffAttack has parallels in other defense paradigms:

**Adversarial training**: While adversarial training remains the most reliable defense, it is computationally expensive and trades clean accuracy for robustness. The tension between robustness and accuracy, formalized in accuracy-robustness tradeoff theorems, is a fundamental challenge.

**Randomized smoothing**: Another certified defense approach that adds random noise to inputs and uses majority voting. Like purification, randomized smoothing involves a stochastic component, and its certified guarantees come with their own trade-offs.

**Input transformation defenses**: A broader category that includes JPEG compression, bit-depth reduction, and other input transformations. DiffAttack's methodology of computing gradients through the full pipeline applies to many of these defenses as well.

### Practical Recommendations

Based on DiffAttack's findings, the authors and subsequent work suggest several practical recommendations:

1. **Defense in depth**: Do not rely solely on purification. Combine it with adversarial training, input validation, and other complementary defenses.

2. **Strong evaluation**: Use gradient-based attacks that properly compute gradients through all defense components. Do not rely on standard attacks designed for undefended models.

3. **Adaptive threat modeling**: When deploying purification-based defenses, assume the attacker knows the purification mechanism and can compute gradients through it.

4. **Monitoring and detection**: Supplement preventive defenses with monitoring systems that can detect potential adversarial inputs based on their behavior during the purification process.

## Future Directions

The DiffAttack paper opens several avenues for future research:

**Non-differentiable purification**: One potential defense against gradient-based attacks like DiffAttack is to introduce non-differentiable components into the purification pipeline. This breaks the gradient chain but may also degrade purification quality. Finding the right balance is an open problem.

**Certified robustness for purification**: While DiffAttack breaks empirical robustness, certified defenses provide mathematical guarantees that hold regardless of the attack. Combining purification with certified robustness methods could provide stronger guarantees.

**Efficient gradient computation**: The computational cost of DiffAttack (requiring backpropagation through hundreds of diffusion steps) limits its applicability. More efficient gradient computation methods could enable stronger attacks and better evaluation.

**Beyond image classification**: The principles behind DiffAttack apply to other domains where diffusion models are used for purification — text, audio, and 3D data. Extending the attack to these modalities is a natural next step.

## Conclusion

DiffAttack represents a significant advance in our understanding of adversarial robustness and the limitations of diffusion-based purification defenses. By demonstrating that the differentiable nature of the purification pipeline can be exploited by gradient-based attacks, Kang, Song, and Li have shown that even the most promising defense approaches carry hidden vulnerabilities.

The work serves as both a technical contribution — a stronger attack for evaluating purification defenses — and a cautionary tale for the broader AI security community. In the ongoing arms race between attacks and defenses, assumptions about what constitutes a "strong" defense must be continuously challenged. DiffAttack does exactly that for diffusion-based purification, and its methodological contributions to proper evaluation will influence how the community assesses adversarial robustness for years to come.

For practitioners deploying machine learning systems in security-critical settings, the message is clear: purification alone is not enough. A multi-layered defense strategy, rigorously evaluated against adaptive attacks, remains the best path toward trustworthy AI systems.

---

**Paper**: [DiffAttack: Evasion Attacks Against Diffusion-Based Adversarial Purification](https://arxiv.org/abs/2311.16124) by Mintong Kang, Dawn Song, Bo Li. NeurIPS 2023.
