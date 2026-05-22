---
author: Anubhav Gain
pubDatetime: 2026-05-24T12:30:00+05:30
modDatetime: 2026-05-24T12:30:00+05:30
title: "Delving into Transferable Adversarial Examples and Black-Box Attacks"
slug: delving-transferable-adversarial-examples-blackbox
featured: false
draft: false
tags:
  - ai-security
  - adversarial-transferability
  - black-box-attacks
  - iclr
  - attack-methodology
category: AI Research
description: The foundational study on adversarial example transferability that made practical black-box attacks against real-world ML systems possible.
---

## The Bridge Between Theory and Practice in Adversarial ML

In the early days of adversarial machine learning research, a critical question loomed over the field: sure, you can fool a neural network if you have full access to its weights and gradients—but what about real-world systems where the model is hidden behind an API? The answer came in a landmark ICLR 2017 paper by Yanpei Liu, Xinyun Chen, Chang Liu, and Dawn Song from UC Berkeley, titled *Delving into Transferable Adversarial Examples and Black-box Attacks*.

This paper didn't just confirm that adversarial examples transfer between models—it systematically **delved into** why they transfer, what factors govern transferability, and how to construct attacks that reliably exploit this phenomenon. The result was a practical blueprint for black-box adversarial attacks that remains relevant a decade later.

## The Transferability Problem: Why It Matters

The concept of **adversarial transferability** is simple but profound: an adversarial example crafted to fool Model A often also fools Model B, even if Model B has a completely different architecture, was trained on different data, or uses a different learning algorithm.

This property is what makes adversarial examples a real-world threat rather than an academic curiosity. In practice, deployed ML systems are typically **black boxes**:

- **Commercial APIs** (Google Cloud Vision, Amazon Rekognition, etc.) don't expose model internals.
- **Proprietary models** in finance, healthcare, and security are closely guarded trade secrets.
- **Competitor models** are inaccessible by definition.

If adversarial examples didn't transfer, black-box attacks would be nearly impossible—you'd need to know the exact model to craft an effective attack. Transferability breaks this barrier, allowing attackers to craft adversarial examples on a surrogate model and deploy them against the target.

## Prior Work: The Discovery of Transferability

The phenomenon of adversarial transferability was first observed by Szegedy et al. (2013) in their seminal paper introducing adversarial examples. They noted that perturbations crafted for one network often fooled other networks. Papernot et al. (2016) explored this further, showing cross-architecture transferability and using it to mount black-box attacks against commercial ML APIs.

However, these early studies left critical questions unanswered:

- **How transferable are adversarial examples, quantitatively?**
- **What makes some adversarial examples more transferable than others?**
- **Can we control or optimize transferability?**
- **What attack methods produce the most transferable perturbations?**

Liu et al. set out to answer these questions with systematic rigor.

## Taxonomy of Transferability

The paper establishes a clear taxonomy of transferability scenarios:

### 1. Same Architecture, Different Initialization

Two networks with identical architecture but trained from different random initializations (and possibly different data shuffling). This is the easiest transferability scenario—adversarial examples transfer readily because the models learn similar feature representations.

### 2. Different Architecture

Networks with fundamentally different architectures (e.g., a CNN vs. a fully-connected network, or a ResNet vs. an Inception network). Transferability is harder here but still significant, suggesting that adversarial examples exploit features common across architectures.

### 3. Different Training Data

Networks trained on entirely different datasets. This is the hardest transferability scenario, but some transferability persists, indicating that adversarial examples exploit universal features of the data distribution.

### 4. Non-Targeted vs. Targeted Transferability

A crucial distinction: **non-targeted** transferability (causing any misclassification) is much easier than **targeted** transferability (causing a specific misclassification). The paper explores both, revealing important asymmetries.

## Experimental Methodology: A Systematic Study

The authors conducted the most comprehensive study of adversarial transferability at the time, testing multiple attack methods across diverse model architectures and datasets.

### Models Studied

The paper evaluated transferability across a range of popular architectures:

- **ResNet** (various depths): Residual learning networks.
- **VGG** (various configurations): Deep convolutional networks.
- **GoogLeNet / Inception**: Networks with inception modules.
- **NiN**: Network-in-Network architecture.
- **LeNet**: The classic convolutional architecture.

All models were trained on standard benchmarks, primarily **ImageNet** for large-scale evaluation and **MNIST / CIFAR-10** for controlled studies.

### Attack Methods Compared

The authors compared several attack methods for their transferability properties:

- **FGSM (Fast Gradient Sign Method):** The classic single-step attack by Goodfellow et al. $\delta = \epsilon \cdot \text{sign}(\nabla_x \ell(f(x), y))$
- **Iterative FGSM (I-FGSM / PGD):** Multi-step variants that apply FGSM repeatedly with small step sizes.
- **DeepFool:** An optimization-based attack that finds the minimal perturbation.
- **JSMA (Jacobian-based Saliency Map Attack):** A targeted attack that modifies the most salient pixels.
- **C&W Attack (Carlini & Wagner):** An optimization-based attack that produces minimally perturbed adversarial examples.
- **Ensemble-based methods:** A novel contribution of this paper—attacks crafted against an ensemble of models.

### Evaluation Metrics

Transferability was measured as the **attack success rate** on the target model, given that the adversarial example was crafted using the source model. The authors carefully controlled for:

- Perturbation magnitude ($L_2$ and $L_\infty$ norms)
- Attack parameters (step size, number of iterations)
- Success on the source model (ensuring the attack was actually effective)

## Key Findings: The Anatomy of Transferability

### Finding 1: Iterative Attacks Are Less Transferable

One of the paper's most surprising and influential findings was that **iterative attacks, while more effective on the source model, are often less transferable than single-step attacks**.

On the source model, I-FGSM achieves near-100% attack success rate (as expected—it's a stronger attack). But when the same adversarial examples are tested on a different model, the transfer success rate is often **lower** than for FGSM-generated examples.

This is counterintuitive. A stronger attack should produce more adversarial examples, and you might expect more adversarial examples to mean more transferability. But the paper shows that iterative attacks **overfit** to the specific decision boundary geometry of the source model. The perturbations find highly model-specific vulnerabilities that don't generalize.

This has profound implications for black-box attack design: **using the strongest possible attack on your surrogate model may actually hurt your chances against the target.**

### Finding 2: Ensemble-Based Attacks Dramatically Improve Transferability

The paper's key contribution is the **ensemble-based attack**. Instead of crafting adversarial examples against a single source model, the authors optimize against an ensemble of multiple models simultaneously.

The ensemble attack modifies the objective function to include predictions from multiple models:

$$\delta^* = \arg\max_\delta \sum_{i=1}^{N} \alpha_i \, \ell(f_i(x + \delta), y)$$

where $f_1, \ldots, f_N$ are different models in the ensemble, $\alpha_i$ are weighting coefficients, and $\ell$ is the loss function.

The results are dramatic:

- **Non-targeted transferability:** Ensemble-based attacks achieve significantly higher transfer rates than single-model attacks across all tested architecture pairs.
- **Targeted transferability:** Even targeted attacks, which are notoriously hard to transfer, see substantial improvements with ensemble methods.

The intuition is clear: if a perturbation fools multiple diverse models simultaneously, it's exploiting a vulnerability that is **common** across architectures, not specific to any one model. This makes it much more likely to transfer to the unseen target model.

### Finding 3: Transferability Is Asymmetric

The paper reveals that transferability is **not symmetric**. Adversarial examples crafted from Model A to Model B don't transfer as well as examples crafted from Model B to Model A, even when both models have similar accuracy.

This asymmetry suggests that transferability depends on specific properties of the source and target models—not just their general similarity. Models with smoother decision boundaries, for instance, may produce more transferable adversarial examples because their perturbations exploit more fundamental features rather than model-specific artifacts.

### Finding 4: Targeted Transferability Is Hard but Achievable

Targeted adversarial examples—where the attacker wants the target model to output a specific wrong class—are much harder to transfer than non-targeted ones. With single-model attacks, targeted transfer rates are often near random chance.

However, the ensemble-based approach makes targeted transferability **practically achievable**. By optimizing against multiple models, the perturbation is forced to find features that consistently push toward the target class across different architectures.

### Finding 5: The Role of Model Similarity

Unsurprisingly, transferability is highest between models with similar architectures or trained on similar data. But even between architecturally diverse models (e.g., ResNet and VGG), ensemble-based attacks achieve non-trivial transfer rates, confirming that adversarial vulnerabilities are a **general phenomenon** of deep learning, not specific to particular architectures.

## The Ensemble Attack: Technical Details

The ensemble-based attack methodology deserves detailed examination, as it has become a standard technique in adversarial ML.

### Logit Aggregation

Instead of aggregating loss functions, the authors also explore **logit aggregation**, where the logits (pre-softmax outputs) of multiple models are combined:

$$z_{\text{ensemble}}(x) = \sum_{i=1}^{N} \alpha_i \, z_i(x)$$

The adversarial perturbation is then optimized against this aggregated logit output. This approach has the advantage of producing a single coherent optimization landscape rather than a weighted sum of potentially conflicting losses.

### Weighted Ensemble Strategies

The paper explores different weighting schemes:

- **Uniform weighting:** $\alpha_i = 1/N$ for all models.
- **Performance-based weighting:** Models with higher accuracy get higher weight.
- **Diversity-based weighting:** More diverse models get higher weight to encourage broad transferability.

The authors find that uniform weighting works surprisingly well, suggesting that diversity in the ensemble is more important than individual model quality.

### Integration with Various Attack Methods

The ensemble approach can be combined with any base attack method:

- **Ensemble FGSM:** Single-step attack on the ensemble.
- **Ensemble I-FGSM:** Iterative attack on the ensemble.
- **Ensemble C&W:** Optimization-based attack on the ensemble.

The paper shows that ensemble-based methods consistently improve transferability regardless of the base attack method.

## Practical Black-Box Attack Framework

Based on their findings, the authors outline a practical framework for black-box attacks:

### Step 1: Train Substitute Models

The attacker trains one or more substitute models on data that approximates the target model's training data. These don't need to be identical to the target—they just need to learn similar feature representations.

### Step 2: Construct an Ensemble

Combine multiple substitute models with diverse architectures into an ensemble. Diversity is key: using different architectures ensures that the ensemble captures a broad range of model behaviors.

### Step 3: Generate Adversarial Examples

Use an ensemble-based attack method to craft adversarial examples. For non-targeted attacks, single-step methods (FGSM) on the ensemble may be sufficient. For targeted attacks, iterative methods on the ensemble provide better results.

### Step 4: Deploy Against the Target

Submit the adversarial examples to the black-box target. The high transferability achieved through the ensemble approach ensures a significant fraction of examples will fool the target.

### Validation Against Real Systems

The paper validates this framework by attacking models that were not included in the ensemble. The attack success rates confirm that the approach is practical and effective, even when the target model is architecturally very different from any ensemble member.

## Theoretical Insights: Why Transferability Occurs

Beyond empirical findings, the paper offers theoretical insights into why adversarial transferability occurs.

### Shared Features and Decision Boundaries

Different models trained on the same data tend to learn similar feature representations, even with different architectures. This is because the data distribution itself has structure that all successful models must capture. Adversarial examples exploit this shared structure—they perturb features that are important for all models, not just the source model.

### The Linear Explanation Revisited

Goodfellow's linear hypothesis—that adversarial examples arise from the high-dimensional linearity of neural networks—provides a partial explanation for transferability. If all models are approximately linear in the same region of input space, then a perturbation that exploits this linearity in one model is likely to exploit it in others.

However, the paper's finding that iterative attacks are less transferable suggests a more nuanced picture. Iterative attacks exploit **nonlinear** model-specific features, which don't transfer. Single-step attacks exploit **linear** model-agnostic features, which do transfer.

### The Decision Boundary Perspective

From the perspective of decision boundaries, transferability occurs when the source and target models have **aligned decision boundaries** in the perturbation direction. Ensemble-based attacks find perturbation directions that are adversarial relative to multiple decision boundaries simultaneously, increasing the probability of alignment with the target model's boundary.

## Impact on the Field

The paper has had a profound and lasting impact on adversarial ML research:

### 1. Establishing Ensemble Attacks as Standard

Ensemble-based attacks have become a standard technique in adversarial ML. Virtually every subsequent paper on black-box attacks uses ensemble methods as a baseline or building block.

### 2. Informing Defense Research

Understanding transferability is crucial for designing defenses. If adversarial examples are transferable, then defending one model doesn't protect other models. This has motivated research into **universal** defenses that provide robustness against a wide range of transferable attacks.

### 3. Bridging White-Box and Black-Box Attacks

The paper effectively bridged the gap between white-box attacks (requiring full model access) and black-box attacks (no model access). By showing that ensemble-based surrogate attacks can achieve high success rates, it demonstrated that model secrecy alone is not a sufficient defense.

### 4. Influencing Industry Security Practices

Companies deploying ML systems now routinely evaluate adversarial robustness using ensemble-based attacks. The paper's framework provides a practical playbook for security teams to test their systems against realistic black-box threats.

### 5. Motivating Research on Adversarial Subspaces

The finding that iterative attacks overfit to model-specific features while single-step attacks exploit transferable features has motivated research on **adversarial subspaces**—the regions of input space where adversarial examples are dense. Understanding these subspaces is key to both attack and defense.

## Subsequent Work Built on These Foundations

The paper spawned numerous follow-up studies:

- **Input transformations for transferability:** Methods like DIM (Diverse Input Method), TIM (Translation-Invariant Method), and SIM (Scale-Invariant Method) further improve transferability by augmenting the attack process with input transformations.
- **Model augmentation:** Tramer et al. (2020) showed that augmenting the source model (e.g., through adversarial training) can paradoxically improve the transferability of adversarial examples crafted on it.
- **Intermediate level attacks:** Instead of manipulating the final output, some methods manipulate intermediate feature representations to improve transferability.
- **Transferable targeted attacks:** Subsequent work has significantly improved targeted transferability through more sophisticated optimization methods.
- **Adversarial patch attacks:** Physical-world attacks (like the Evtimov et al. study on stop signs) leverage transferability to fool deployed vision systems.

## Lessons for Security Practitioners

For practitioners evaluating and improving the security of deployed ML systems, this paper offers several critical lessons:

### 1. Obscurity Is Not Security

Hiding your model's architecture and weights doesn't protect you from adversarial attacks. An attacker can train substitute models and use ensemble-based methods to craft highly transferable adversarial examples. **Security through obscurity** is as ineffective for ML as it is for traditional software.

### 2. Test with Ensemble-Based Attacks

When evaluating adversarial robustness, don't just test with white-box attacks on your deployed model. Test with ensemble-based attacks using diverse surrogate models. This gives a much more realistic picture of your vulnerability to black-box adversaries.

### 3. Adversarial Training Needs Diversity

If you use adversarial training as a defense, ensure the adversarial examples you train on are diverse and transferable. Training only on white-box adversarial examples from your own model may leave you vulnerable to black-box attacks crafted on other models.

### 4. Monitor for Anomalous Inputs

Since transferable adversarial examples often involve larger perturbations than model-specific ones (especially for targeted attacks), input monitoring and anomaly detection can provide an additional layer of defense.

### 5. Model Diversity Can Be Defensive

Just as ensemble-based attacks exploit transferability across diverse models, deploying diverse models in an ensemble for prediction can make it harder for any single adversarial perturbation to fool all ensemble members simultaneously.

## The Enduring Relevance of Transferability

As machine learning systems become more prevalent and more consequential, adversarial transferability remains a critical concern. Modern large language models (LLMs), diffusion models, and multimodal systems all exhibit transferability—their vulnerabilities can be exploited through surrogate models and ensemble-based attacks.

The fundamental insight of Liu et al.'s paper—that adversarial examples exploit shared features across models, and that ensemble methods can systematically find these features—applies as much to a language model behind an API as it does to an image classifier. The specific techniques may evolve, but the principle endures: **if models learn similar things from similar data, their vulnerabilities will be similar too.**

## Conclusion

*Delving into Transferable Adversarial Examples and Black-box Attacks* was a watershed paper that transformed adversarial ML from a predominantly white-box discipline into one that could address real-world black-box threats. By systematically studying transferability, revealing the counterintuitive relationship between attack strength and transferability, and introducing ensemble-based attacks, the paper provided both theoretical insights and practical tools that continue to shape the field.

The paper's central lesson remains urgent: **model secrecy is not a defense**. As long as adversarial examples transfer between models—and the evidence is overwhelming that they do—any deployed ML system is vulnerable to black-box attacks. Building truly robust ML systems requires fundamentally better models, not just hidden ones.

---

**References:**

- Liu, Y., Chen, X., Liu, C., & Song, D. (2017). Delving into Transferable Adversarial Examples and Black-box Attacks. *ICLR 2017*. [arXiv:1611.02770](https://arxiv.org/abs/1611.02770)
- Szegedy, C., Zaremba, W., Sutskever, I., Bruna, J., Erhan, D., Goodfellow, I., & Fergus, R. (2013). Intriguing properties of neural networks. *ICLR 2014*.
- Goodfellow, I. J., Shlens, J., & Szegedy, C. (2014). Explaining and Harnessing Adversarial Examples. *ICLR 2015*.
- Papernot, N., McDaniel, P., & Goodfellow, I. (2016). Transferability in Machine Learning: from Phenomena to Black-Box Attacks using Adversarial Samples. *arXiv:1605.07277*.
- Carlini, N., & Wagner, D. (2017). Towards Evaluating the Robustness of Neural Networks. *IEEE S&P 2017*.
- Tramèr, F., Kurakin, A., Papernot, N., Goodfellow, I., Boneh, D., & McDaniel, P. (2020). Ensemble Adversarial Training: Attacks and Defenses. *ICLR 2018*.
