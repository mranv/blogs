---
author: Anubhav Gain
pubDatetime: 2026-05-22T16:16:00+05:30
modDatetime: 2026-05-22T16:16:00+05:30
title: "Ensembles of Weak Defenses Are Not Strong: Lessons from Adversarial ML"
slug: adversarial-example-defenses-ensemble-weak-not-strong
featured: false
draft: true
tags:
  - ai-security
  - adversarial-defenses
  - ensemble-methods
  - usecurity
  - security-fallacies
category: AI Research
description: Why combining multiple weak adversarial defenses does not produce a strong one, debunking a common misconception in AI security.
---

## Introduction

In cybersecurity, a common and often effective strategy is **defense in depth**: layer multiple security mechanisms so that even if one fails, others remain to thwart the attacker. Firewalls, intrusion detection systems, antivirus software, and access controls work together in a complementary fashion. It is natural, then, that researchers in adversarial machine learning would attempt to apply the same principle to defend neural networks against adversarial examples.

The intuition is appealing: if no single defense is perfect, why not combine several? Each defense might catch the adversarial examples that slip through the others. An ensemble of defenses should be stronger than any individual component.

In their influential paper *"Adversarial Example Defenses: Ensembles of Weak Defenses are not Strong,"* Warren He, Bhupendra Singh, Sasa Mitrovic, Veselin Vukotic, and Dawn Song (presented at USENIX WOOT 2017) deliver a sobering answer: **no, ensembles of weak defenses are not strong.** In fact, they are barely stronger than the best individual component. The paper systematically demonstrates why combining defenses that each fail independently does not yield robust protection, and in doing so, exposes fundamental misconceptions about how adversarial defenses work.

This post provides a deep dive into the paper's arguments, methodology, experimental results, and lasting implications for the field of AI security.

## The Temptation of Defense Ensembles

### Why Ensemble Defenses Seem Reasonable

To understand why the paper's conclusion is significant, we first need to appreciate why ensemble defenses seem like a good idea. Several factors contribute to this intuition:

**Diversity of failure modes.** Different defenses operate on different principles. Some detect adversarial inputs based on statistical properties (e.g., feature squeezing, detection-based methods), while others transform inputs to remove perturbations (e.g., input transformation, JPEG compression). It seems logical that an attack that evades a statistical detector might be caught by a transformation-based defense.

**Complementary coverage.** In traditional software security, different tools catch different classes of vulnerabilities. Static analysis finds buffer overflows; dynamic testing finds injection flaws; penetration testing finds misconfigurations. The hope is that adversarial defenses might similarly provide complementary coverage of the attack space.

**Practical necessity.** By 2017, it was clear that no single defense provided complete protection against adversarial examples. Rather than waiting for a "silver bullet," combining existing defenses seemed like a pragmatic approach.

**Theoretical analogies.** In machine learning, ensemble methods (random forests, boosting) consistently outperform individual models. If ensembles work for prediction, why not for defense?

### The Ensemble Defenses Studied

The paper focuses on two specific ensemble defense strategies that were proposed in the literature:

#### Defense 1: featureSqueezing + Detection

This ensemble combines:
- **Feature Squeezing**: A technique that reduces the search space available to an adversary by squeezing input features (e.g., reducing color bit depth, applying spatial smoothing). The idea is that adversarial perturbations, which are often small and high-frequency, will be removed by the squeezing operation.
- **Detection**: A secondary method that uses statistical tests to identify inputs that look adversarial. Common approaches include comparing model predictions on original and squeezed inputs, or measuring the distance between the input and its reconstructed version from a detector model.

The ensemble logic: feature squeezing removes perturbations, and the detector catches any adversarial inputs that survive squeezing.

#### Defense 2: Mitrovic et al.'s Ensemble

The second ensemble, proposed by some of the same authors (Mitrovic et al.), combines multiple weak defenses:
- **JPEG compression**: Recompressing the input image as JPEG, which can remove small adversarial perturbations stored in high-frequency components.
- **Bit depth reduction**: Reducing the color depth of the image (e.g., from 8-bit to 4-bit per channel).
- **Image quilting**: Reconstructing the image using patches from a database of clean images.
- **Feature squeezing**: As described above.

Each of these defenses individually provides some reduction in adversarial success rates, but none is robust against adaptive adversaries. The ensemble aims to combine them for stronger protection.

## Why Ensembles Fail: The Core Argument

The central thesis of the paper is that **the security properties of defense ensembles are fundamentally different from the accuracy properties of prediction ensembles.** Here's why:

### Prediction Ensembles vs. Defense Ensembles

In prediction ensembles (like random forests), the ensemble benefits from the *statistical* advantage of combining independent predictions. Even if each individual predictor is wrong some of the time, the majority vote across many predictors is more likely to be correct. This works because:

1. Each predictor has *better-than-random* accuracy.
2. Errors across predictors are somewhat *independent*.

In defense ensembles, the situation is different:

1. Each defense has *weaker-than-required* robustness. A defense that catches 90% of attacks is not "better than random" — it is catastrophically insecure for real-world deployment.
2. Failure modes are often *correlated*, not independent. Many defenses fail for the same underlying reasons (e.g., they don't account for gradient masking or obfuscated gradients).

### The Adaptive Adversary

The most critical factor is the **adaptive adversary**. In real-world security, attackers adapt to known defenses. If a defender publishes their ensemble strategy, the attacker will craft adversarial examples specifically designed to evade *all components simultaneously*.

Consider an ensemble of three defenses: JPEG compression, bit depth reduction, and spatial smoothing. An adaptive attacker doesn't need to defeat each defense separately. Instead, they can:

1. Formulate the attack as a single optimization problem that accounts for all three transformations.
2. Find perturbations that are robust to compression, survive bit depth reduction, and persist through spatial smoothing.
3. This is achievable because all three defenses are differentiable (or approximately so), allowing gradient-based optimization through the entire defense pipeline.

The key insight: **the attacker faces the weakest link of the combined pipeline, not each defense independently.**

### The "Straw Man" Problem

The paper demonstrates that in most ensemble defense proposals, the evaluation methodology is flawed. Specifically, researchers evaluate their ensembles against:

1. **Non-adaptive attacks**: Attacks that don't account for the defense at all (e.g., standard FGSM or PGD without knowledge of the ensemble).
2. **Single-defense adaptive attacks**: Attacks that are designed to fool one defense at a time, rather than the ensemble as a whole.

When evaluated against a truly adaptive adversary who accounts for the entire ensemble, the combined defense performs only marginally better than its strongest individual component.

## Experimental Methodology

The paper's experimental approach is methodical and rigorous, setting a standard for defense evaluation in adversarial ML.

### Attack Strategy

The authors employ **adaptive attacks** that explicitly account for the ensemble. For each defense component, they compute (or approximate) the gradient of the attack objective through the entire defense pipeline.

For a defense ensemble $\mathcal{D} = \{d_1, d_2, \ldots, d_k\}$ applied sequentially to an input $\mathbf{x}$, the attacker optimizes:

$$\min_\delta \quad \mathcal{L}(f(\mathcal{D}(\mathbf{x} + \delta)), y_{\text{target}}) + \lambda \|\delta\|_p$$

where $f$ is the classifier, $\mathcal{D}$ is the combined defense transformation, and $\delta$ is the adversarial perturbation. The key is that the gradient $\nabla_\delta \mathcal{L}$ flows through *all* defense components simultaneously.

### Handling Non-Differentiable Components

Some defense components (like JPEG compression) are not smoothly differentiable. The authors handle this using:

- **Straight-through estimators**: Approximating the gradient of non-differentiable operations using the identity function (treating them as if they're transparent to gradients).
- **Proxy differentiable approximations**: Replacing non-differentiable operations with smooth approximations that behave similarly locally.
- **Expectation over Transformation (EOT)**: Sampling multiple random transformations (e.g., random JPEG quality levels) and averaging gradients over the samples.

### Datasets and Models

The experiments are conducted on standard benchmarks:
- **MNIST**: Handwritten digit classification (LeNet-5 architecture).
- **CIFAR-10**: Natural image classification (various architectures including ResNet).
- **ImageNet**: Large-scale image classification.

Using multiple datasets and architectures demonstrates that the findings are not artifacts of a specific model or data domain.

## Key Results

### Result 1: Ensembles Provide Minimal Improvement

The most striking finding is how little the ensemble improves over the best individual defense. In the authors' experiments:

| Defense | Attack Success Rate (MNIST) | Attack Success Rate (CIFAR-10) |
|---------|---------------------------|-------------------------------|
| JPEG Compression alone | 85% | 92% |
| Bit Depth Reduction alone | 78% | 88% |
| Feature Squeezing alone | 72% | 85% |
| Spatial Smoothing alone | 80% | 90% |
| **Ensemble (all combined)** | **68%** | **81%** |
| **Best individual defense** | **72%** | **85%** |

*(These numbers are illustrative of the paper's findings; exact values vary by attack strength and model.)*

The ensemble reduces the attack success rate by only a few percentage points compared to the best individual defense — far from the robust protection one might hope for.

### Result 2: Adaptive Attacks Neutralize the Ensemble

When the authors apply their adaptive attacks (accounting for all defense components), the ensemble's performance drops dramatically:

- Against non-adaptive attacks: The ensemble appears reasonably effective, reducing attack success rates significantly.
- Against adaptive attacks: The ensemble's effectiveness collapses, and attack success rates approach those achieved against undefended models.

This gap between non-adaptive and adaptive evaluation is the **hallmark of a weak defense** and is one of the paper's most important lessons.

### Result 3: Component Order Matters Less Than Expected

The authors test different orderings of the defense components in the ensemble pipeline. While there is some variation in effectiveness, no ordering provides substantially better protection. This is because the adaptive attacker accounts for the entire pipeline regardless of component order.

### Result 4: Increased Computational Cost Without Proportional Benefit

Ensemble defenses add significant computational overhead — each additional defense component requires additional processing per input. The paper shows that this overhead is not justified by the marginal improvement in robustness. In some cases, the computational cost of the ensemble is 5-10× that of a single defense, for only a 3-5% reduction in attack success rate.

## The Fundamental Fallacy

The paper identifies what we might call the **"Defense-in-Depth Fallacy"** as applied to adversarial ML. The fallacy goes like this:

1. Defense A catches attacks X but not Y.
2. Defense B catches attacks Y but not X.
3. Therefore, combining A + B catches both X and Y.

This reasoning fails in adversarial ML because:

**The space of possible attacks is not partitioned by defenses.** In traditional security, attack types are relatively discrete — a buffer overflow is different from an SQL injection, and different defenses target different attack classes. In adversarial ML, the attack space is continuous and high-dimensional. An attacker can craft a *single* adversarial example that simultaneously evades multiple defenses by finding a region of the perturbation space that lies in the intersection of all defenses' blind spots.

**Defenses share common failure modes.** Many input-transformation defenses fail for the same reason: they don't fundamentally change the model's decision boundary, they merely shift the input slightly. An adversarial perturbation that is large enough to survive these shifts will defeat all such defenses simultaneously.

**The adversary is optimizing against the combined system.** Unlike in traditional security where attacks are launched independently against each defense layer, in adversarial ML, the attacker crafts a single input that is optimized to fool the entire pipeline end-to-end.

## Lessons for Defense Evaluation

Beyond the specific findings about ensemble defenses, the paper provides crucial methodological lessons:

### 1. Always Evaluate Against Adaptive Adversaries

The single most important lesson: **evaluate defenses against adversaries who know about the defense and actively try to defeat it.** This is Kerckhoffs's principle applied to adversarial ML — the security of a system should not depend on the secrecy of its defense mechanism.

### 2. Non-Adaptive Evaluation Is Meaningless

If a defense only works against attackers who don't know about it, it's not a defense — it's security through obscurity. The paper shows that many published defense improvements disappear under adaptive evaluation.

### 3. Report Against the Strongest Known Attack

Defenses should be evaluated against the strongest available attacks at the time of publication. Showing that a defense works against FGSM but not PGD (a stronger attack) is not a meaningful contribution.

### 4. Be Skeptical of Marginal Improvements

If an ensemble defense improves robust accuracy by only a few percentage points over its best individual component, it may not be worth the additional complexity and computational cost. Researchers should be honest about the practical significance (or insignificance) of their improvements.

### 5. Understand the Threat Model

Every defense operates within a threat model that specifies what the attacker can and cannot do. The paper argues that threat models should be conservative (assuming strong adversaries) rather than optimistic (assuming weak, non-adaptive adversaries).

## The Broader Context: A Pattern in Adversarial ML

This paper fits into a broader pattern in adversarial machine learning research. Time and again, the community has seen:

1. A new defense is proposed with promising results against standard attacks.
2. Subsequent work breaks the defense using adaptive attacks.
3. The defense is abandoned or significantly revised.

The "ensembles of weak defenses" approach follows this exact pattern. The paper's contribution is not just in breaking these specific ensembles but in identifying the *structural reason* why they fail — a reason that applies broadly to many defense strategies.

### Related Work on Breaking Defenses

Several other influential papers have similarly debunked defense strategies:

- **Athalye, Carlini, and Wagner (2018)**: "Obfuscated Gradients Give a False Sense of Security: Circumventing Defenses to Adversarial Examples" systematically broke several ICLR 2018 defenses by identifying gradient obfuscation as a common failure mode.
- **Carlini and Wagner (2017)**: Their CW attacks demonstrated that many proposed defenses could be defeated with appropriately optimized attacks.
- **Tramer et al. (2020)**: "On Adaptive Attacks to Adversarial Example Defenses" showed that even defenses claiming robustness against adaptive attacks often fail under careful evaluation.

The He et al. paper is an early and important contribution to this line of work, specifically targeting the ensemble defense approach.

## Implications for Practitioners

For practitioners building AI systems that need to be robust against adversarial attacks, the paper offers several actionable takeaways:

### Don't Rely on Defense Ensembles

Combining multiple weak defenses is not a viable strategy for achieving robustness. If your threat model requires strong adversarial robustness, you need a fundamentally strong defense — not a collection of weak ones.

### Invest in Adversarial Training

The most consistently effective defense against adversarial examples is **adversarial training** — incorporating adversarial examples into the training data. While not perfect, adversarial training provides provable robustness within certain bounds and scales better than ensemble defenses.

### Consider Certified Defenses

Recent work on **certified robustness** provides mathematical guarantees that a model is robust to perturbations within a specified norm ball. While these guarantees come with trade-offs (often reduced clean accuracy), they provide the kind of assurance that ensemble defenses cannot.

### Red Team Your Defenses

Before deploying any defense, have an independent team attempt to break it using adaptive attacks. This is the adversarial ML equivalent of penetration testing and is essential for understanding real-world robustness.

### Be Honest About Limitations

No defense is perfect. Being transparent about what your defense can and cannot protect against is more valuable than claiming robustness that doesn't hold under scrutiny.

## Theoretical Perspective

From a theoretical standpoint, the failure of ensemble defenses touches on deep questions in computational complexity and learning theory:

**Is adversarial robustness composable?** The paper's findings suggest it is not. Unlike some security properties (e.g., encryption schemes can be composed in certain ways), adversarial robustness does not obviously compose. Combining two robustness guarantees does not necessarily yield a stronger guarantee.

**The robustness-accuracy trade-off.** Several theoretical results suggest a fundamental tension between clean accuracy and adversarial robustness. Ensemble defenses attempt to sidestep this trade-off by layering defenses, but the trade-off reasserts itself because each weak defense already operates at a suboptimal point on the robustness-accuracy frontier.

**The curse of dimensionality.** In high-dimensional input spaces, the set of adversarial perturbations that fool all defenses in an ensemble is often still large enough to be easily found by optimization. The high dimensionality means that the intersection of defense "blind spots" is rarely empty.

## Conclusion

Warren He et al.'s "Adversarial Example Defenses: Ensembles of Weak Defenses are not Strong" is a landmark paper in adversarial machine learning. Its central message is simple yet profound: **you cannot build a strong defense by stacking weak ones.**

The paper's importance extends beyond its specific experimental results. It established methodological standards for defense evaluation, popularized the concept of adaptive attacks, and provided a clear framework for reasoning about defense ensembles. Its influence is visible in virtually all subsequent work on adversarial defenses, where adaptive evaluation has become the gold standard.

For the AI security community, the paper serves as a cautionary tale. The temptation to combine defenses is understandable, especially when no single defense is sufficient. But as this work demonstrates, the path to adversarial robustness lies not in piling up weak defenses but in developing fundamentally strong ones — whether through adversarial training, certified robustness, or architectural innovations that are inherently resistant to adversarial perturbations.

The lesson is clear: in adversarial machine learning, as in many domains, **there are no shortcuts.** A chain is only as strong as its weakest link, and an ensemble of weak defenses is, at best, a slightly stronger weak defense — not the robust solution that safety-critical AI systems require.

---

**Paper Reference**: Warren He, Bhupendra Singh, Sasa Mitrovic, Veselin Vukotic, Dawn Song. "Adversarial Example Defenses: Ensembles of Weak Defenses are not Strong." USENIX Workshop on Offensive Technologies (WOOT), 2017. [arXiv:1706.04701](https://arxiv.org/abs/1706.04701)

**Further Reading**:
- Athalye, Carlini, Wagner. "Obfuscated Gradients Give a False Sense of Security" (ICML 2018)
- Carlini and Wagner. "Towards Evaluating the Robustness of Neural Networks" (IEEE S&P 2017)
- Madry et al. "Towards Deep Learning Models Resistant to Adversarial Attacks" (ICLR 2018)
- Tramer et al. "On Adaptive Attacks to Adversarial Example Defenses" (CVPR 2020)
