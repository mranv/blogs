---
author: Anubhav Gain
pubDatetime: 2026-05-22T21:00:00+05:30
modDatetime: 2026-05-22T21:00:00+05:30
title: "MMDT: Decoding the Trustworthiness and Safety of Multimodal Foundation Models"
slug: mmdt-trustworthiness-multimodal-foundation-models
featured: false
draft: false
tags:
  - ai-security
  - multimodal-safety
  - trustworthiness
  - iclr
  - benchmarking
category: AI Research
description: A comprehensive benchmark for evaluating trustworthiness and safety across multimodal foundation models, revealing critical vulnerabilities.
---

## The Multimodal Safety Gap

Multimodal foundation models — AI systems that process and reason across text, images, audio, and other modalities simultaneously — represent the current frontier of artificial intelligence. Models like GPT-4o, Gemini, Claude, LLaVA, and Qwen-VL can analyze images, read documents, describe visual scenes, and answer complex questions that require integrating information across modalities. They are being deployed in healthcare (medical image analysis), education (visual tutoring), autonomous vehicles (scene understanding), content moderation (cross-modal toxicity detection), and countless other applications where safety failures carry real-world consequences.

Yet the very capability that makes multimodal models powerful — their ability to fuse information across modalities — also creates novel attack surfaces and failure modes that do not exist in unimodal systems. A text prompt that is perfectly benign in isolation can become harmful when combined with an adversarial image. An image that is safe on its own can trigger unsafe behavior when presented alongside a carefully crafted text instruction. The cross-modal interactions that enable sophisticated reasoning also enable sophisticated attacks.

At ICLR 2025, Chejian Xu and collaborators introduced **MMDT** (Multimodal Decoding Trustworthiness), the first comprehensive benchmark specifically designed to evaluate the trustworthiness and safety of multimodal foundation models. Their work reveals that current multimodal models exhibit critical vulnerabilities across multiple trustworthiness dimensions — vulnerabilities that are often invisible to standard unimodal safety evaluations.

**Paper**: [MMDT: Decoding the Trustworthiness and Safety of Multimodal Foundation Models](https://arxiv.org/abs/2503.14827) — ICLR 2025
**Authors**: Chejian Xu and colleagues

---

## Why Multimodal Models Need Their Own Safety Benchmark

The need for a multimodal-specific trustworthiness benchmark stems from fundamental differences between multimodal and unimodal AI systems. While existing benchmarks have made progress in evaluating text model safety (through DecodingTrust, TrustLLM) and image model safety (through OVERT, VMDT), the multimodal setting presents unique challenges that make direct extension of these frameworks insufficient.

### Cross-Modal Attack Surfaces

The most significant new threat in multimodal models is the **cross-modal attack surface**. In a unimodal text model, the attack surface consists of the text input. In a unimodal vision model, the attack surface consists of the image input. But in a multimodal model, the attack surface includes:

- **Text input**: Traditional text-based jailbreaks and adversarial prompts.
- **Image input**: Adversarial images designed to manipulate model behavior.
- **Text-image interaction**: The combination of text and image inputs, which can produce emergent behaviors not triggered by either input alone.
- **Image-embedded text**: Text rendered within images, which may bypass text-based safety filters while being processed by the model's visual pipeline.
- **Cross-modal inconsistencies**: Deliberate mismatches between the text prompt and the visual content that confuse the model's safety mechanisms.

### Emergent Unsafe Behaviors

Multimodal models can exhibit unsafe behaviors that emerge from the interaction of modalities rather than from any single modality in isolation. For example:

- A model might refuse to describe a violent image when asked directly in text, but comply when the request is encoded in an image caption or embedded text within the image.
- A model might correctly identify harmful content in an image but fail to flag it when the accompanying text frames the request as an educational or analytical query.
- A model's visual processing might be exploited to inject instructions that override its text-based safety training — a form of **visual prompt injection** that has no analog in text-only systems.

### Inadequate Transfer of Unimodal Safety

Many multimodal models are built by combining a pre-trained language model with a vision encoder, connected through a projection layer or cross-attention mechanism. The safety training applied to the language model component (typically through RLHF or constitutional AI methods) may not transfer effectively to the multimodal setting. The vision encoder can process information that the safety-trained language model was never trained to handle, creating gaps in the model's safety coverage.

---

## The MMDT Framework: Architecture and Design

MMDT is designed as a comprehensive, multi-dimensional trustworthiness evaluation framework that addresses the unique challenges of multimodal foundation models. The framework evaluates models across five core trustworthiness dimensions, each with multimodal-specific evaluation scenarios.

### Five Trustworthiness Dimensions

#### 1. Safety

The safety dimension evaluates whether multimodal models can be manipulated into generating harmful, toxic, or dangerous content through cross-modal attacks. This is the most critical dimension for deployment decisions.

**Text-to-Image Safety Jailbreaks**: Can the model be tricked into generating unsafe descriptions or responses by crafting text prompts that exploit the model's visual processing capabilities? For example, can a user bypass content safety filters by encoding their request in a way that leverages the model's image understanding capabilities?

**Image-Triggered Toxicity**: Can adversarial images cause the model to produce toxic or harmful text outputs? This tests whether the visual input channel can be weaponized to override text-based safety training.

**Embedded Text Attacks**: Can text rendered within images (e.g., text on signs, documents, or screenshots) be used to inject harmful instructions that bypass text-based safety filters? This is a particularly insidious attack vector because image-embedded text is processed by the visual pipeline rather than the text safety filters.

**Multimodal Jailbreak Chains**: Can multi-step interactions that combine text and image inputs be used to progressively erode the model's safety guardrails? For example, a series of seemingly innocent text-image exchanges that gradually push the model toward generating harmful content.

#### 2. Fairness

The fairness dimension assesses whether multimodal models exhibit demographic biases that are unique to or amplified by cross-modal processing.

**Cross-Modal Demographic Bias**: Does the model describe the same person differently depending on whether they appear in an image alongside certain text prompts? For example, does the model's description of a person's profession or capabilities change based on the demographic characteristics visible in the image?

**Image-Triggered Stereotyping**: Does the model's text generation become more stereotyped or biased when processing images of people from certain demographic groups? The multimodal setting can amplify biases that exist in both the visual and textual components.

**Intersectional Bias**: How does the model handle intersectional identities — people who belong to multiple demographic groups simultaneously? Multimodal models may exhibit complex bias patterns at these intersections that are not captured by single-axis bias evaluations.

**Cultural Bias in Visual Reasoning**: Does the model interpret visual scenes differently based on cultural context? A scene that is unremarkable in one culture may have specific significance in another, and the model's text descriptions should reflect this cultural awareness.

#### 3. Robustness

The robustness dimension tests how well multimodal models maintain trustworthy behavior under adversarial conditions that exploit the multimodal input space.

**Adversarial Image Perturbations**: How do small, imperceptible perturbations to input images affect the model's text outputs? In the multimodal setting, adversarial perturbations can be designed to cause specific text outputs — a form of cross-modal adversarial attack.

**Cross-Modal Consistency Under Stress**: When the model receives conflicting information across modalities (e.g., an image showing one thing and a text prompt claiming another), does it handle the conflict appropriately? Robustness testing evaluates whether the model can maintain truthful behavior even when inputs are designed to create cross-modal confusion.

**Typographic Attacks**: How does the model handle images containing misleading text overlays, such as incorrect labels on objects or misleading captions embedded in the image? These attacks exploit the model's tendency to trust image-embedded text.

**Out-of-Distribution Visual Inputs**: How does the model handle unusual, abstract, or adversarial visual inputs that fall outside its training distribution? Robustness to OOD inputs is critical for deployment in open-world environments.

#### 4. Privacy

The privacy dimension evaluates whether multimodal models appropriately handle private and sensitive information that may be present in visual inputs.

**Visual Privacy Leakage**: Does the model extract and reveal private information from images — such as names on badges, addresses on envelopes, license plate numbers, or medical information on charts? The multimodal setting creates unique privacy risks because images often contain private information that users may not realize the model can read.

**Identity Inference**: Can the model be used to identify individuals from images, and does it appropriately refuse to do so when asked? This has significant implications for surveillance and stalking applications.

**Location and Setting Identification**: Can the model infer sensitive location information from images — such as a person's home, workplace, or current location — and does it handle this capability responsibly?

**Cross-Modal Information Aggregation**: Can the model be prompted to aggregate information across multiple images and text inputs to infer private details about individuals? This tests whether privacy protections that work for single inputs can be circumvented through multi-turn, multi-image interactions.

#### 5. Truthfulness (Hallucination)

The truthfulness dimension assesses the factual accuracy of multimodal model outputs, with particular attention to cross-modal hallucination.

**Visual Hallucination**: Does the model fabricate details that are not present in the image? This includes describing objects, people, or actions that do not appear in the visual input.

**Cross-Modal Hallucination**: Does the model allow text prompts to distort its visual perception — claiming to see things in an image that are suggested by the text but not actually present? This is a unique failure mode of multimodal models where the text modality can contaminate visual understanding.

**Confabulation in Visual Reasoning**: When asked complex reasoning questions about images, does the model produce plausible-sounding but incorrect explanations? This tests the model's ability to distinguish between genuine visual reasoning and confabulation.

**Confidence Calibration**: Does the model appropriately express uncertainty when visual evidence is ambiguous, or does it confidently assert incorrect information?

---

## Benchmark Construction and Methodology

### Dataset Design

MMDT uses a carefully constructed evaluation dataset that covers diverse scenarios across all five trustworthiness dimensions. The dataset includes:

**Adversarial Text-Image Pairs**: Pairs of text prompts and images specifically designed to test each trustworthiness dimension. These are crafted through a combination of automated generation, manual curation, and red-team testing.

**Real-World Scenarios**: Evaluation scenarios derived from real-world use cases where multimodal model failures could have significant consequences — medical image analysis, content moderation, educational applications, and autonomous driving.

**Stress Test Scenarios**: Extreme cases designed to push models to their limits and reveal failure modes that might not appear in standard evaluation. These include ambiguous images, adversarial prompts, culturally complex scenarios, and ethically challenging situations.

**Diverse Demographic Representation**: Images and scenarios that represent a wide range of demographic groups, cultural contexts, and geographic regions to ensure that fairness evaluations capture bias across all relevant dimensions.

### Evaluation Protocol

The MMDT evaluation protocol is designed for rigor and reproducibility:

**Automated Metrics**: Where possible, trustworthiness is measured through automated metrics that can be computed at scale. These include toxicity scores, demographic parity metrics, hallucination rates, and privacy leakage measures.

**LLM-as-Judge Evaluation**: For dimensions where simple automated metrics are insufficient, a carefully calibrated LLM-based judge evaluates model outputs against trustworthiness criteria. The judge is validated against human evaluations to ensure reliability.

**Human Evaluation**: For the most complex and nuanced trustworthiness dimensions, structured human evaluation is conducted by trained annotators with diverse backgrounds and expertise.

**Red-Team Evaluation**: The benchmark includes an adversarial component where red-teamers actively attempt to elicit unsafe behavior from the models, simulating real-world attack scenarios.

### Evaluated Models

MMDT evaluates a comprehensive set of multimodal foundation models spanning different architectures, scales, and training approaches:

- **Proprietary models**: GPT-4o, Gemini Pro Vision, Claude 3.5 Sonnet
- **Open-source models**: LLaVA (various sizes), Qwen-VL, InternVL, IDEFICS, CogVLM
- **Specialized models**: Models fine-tuned for specific domains (medical imaging, document understanding)

This broad coverage enables meaningful comparison across the multimodal model landscape and identification of architecture-specific vulnerabilities.

---

## Key Findings

The MMDT evaluation reveals several critical findings about the state of multimodal model trustworthiness.

### Finding 1: Multimodal Models Are Significantly Less Safe Than Their Text-Only Counterparts

The most striking finding is that multimodal models are substantially more vulnerable to safety attacks than equivalent text-only models. Safety guardrails that work effectively in text-only settings are frequently bypassed through cross-modal attacks. Specifically:

- **Embedded text attacks** succeed against the majority of evaluated models, with success rates ranging from 40% to over 80% depending on the model and attack strategy.
- **Image-triggered jailbreaks** that use adversarial or carefully selected images to override text-based safety training are effective against all evaluated models to varying degrees.
- **Multimodal jailbreak chains** that progressively erode safety through multi-turn interactions succeed more often than single-turn attacks, highlighting the vulnerability of multimodal models to sophisticated adversarial strategies.

### Finding 2: Cross-Modal Hallucination Is a Pervasive Problem

The truthfulness evaluation reveals that multimodal models frequently hallucinate in ways that are unique to the multimodal setting:

- **Suggestion-induced hallucination**: When text prompts suggest the presence of specific objects or features in an image, models often "see" things that are not there. This effect is stronger in multimodal models than in vision-only models, suggesting that the language model component's tendency to complete patterns can override visual evidence.
- **Detail confabulation**: When asked to describe images in detail, models frequently fabricate specific details (colors, numbers, text, small objects) that sound plausible but are not present in the image. This confabulation is particularly concerning in applications like medical image analysis or forensic investigation where accuracy is critical.
- **Overconfidence in uncertainty**: Models rarely express appropriate uncertainty when visual evidence is ambiguous. Instead, they produce confident but incorrect descriptions, creating a false impression of reliability.

### Finding 3: Fairness Gaps Are Amplified by Visual Context

The fairness evaluation demonstrates that visual context can amplify existing biases and introduce new ones:

- **Occupational stereotyping** is more pronounced when models process images of people alongside occupational queries. The model's description of a person's likely profession is more strongly influenced by demographic characteristics visible in the image than by the text query alone.
- **Action interpretation bias** — where the same action is interpreted differently based on the demographic characteristics of the people in the image — is a significant concern across all evaluated models.
- **Cross-cultural insensitivity** is prevalent, with models defaulting to Western-centric interpretations of visual scenes from non-Western cultural contexts.

### Finding 4: Robustness Varies Dramatically Across Models and Attack Types

Robustness evaluation reveals a wide disparity among models:

- **Proprietary models** generally exhibit better robustness than open-source models, likely due to more extensive adversarial training and red-teaming during development.
- **Typographic attacks** — where misleading text labels are overlaid on images — are alarmingly effective, causing most models to override their visual understanding with the misleading textual information.
- **Adversarial perturbations** targeted at the visual input can cause dramatic changes in text output, revealing fundamental vulnerabilities in the vision-language connection.

### Finding 5: Privacy Leakage Through Visual Processing Is Underappreciated

The privacy evaluation uncovers a significant and underappreciated risk:

- Multimodal models can extract **personally identifiable information** from images with high accuracy, including names on badges, text on screens, license plate numbers, and addresses on envelopes.
- **Cross-modal information aggregation** attacks — where information from multiple images and text prompts is combined to infer private details — are effective against all evaluated models.
- Current safety training does not adequately prevent the model from revealing private information extracted from images when users explicitly ask for it.

---

## Implications for the Field

### For Model Developers

The MMDT findings carry several actionable implications for teams building multimodal foundation models:

**Invest in multimodal-specific safety training.** Safety training that works for text models does not automatically transfer to multimodal settings. Dedicated safety training that addresses cross-modal attack vectors — embedded text, image-triggered jailbreaks, multimodal jailbreak chains — is essential.

**Treat the vision-language interface as a critical security boundary.** The projection layer or cross-attention mechanism that connects the vision encoder to the language model is a critical vulnerability point. Adversarial inputs to this interface can bypass safety training applied to either component in isolation.

**Implement cross-modal consistency checking.** Safety systems should verify that the model's outputs are consistent with both the visual and textual inputs, flagging cases where the model may be confabulating or where cross-modal conflicts are being resolved unsafely.

**Develop multimodal red-teaming capabilities.** Standard text-based red-teaming is insufficient for multimodal models. Red-team exercises should systematically explore cross-modal attack vectors and evaluate the model's behavior under adversarial multimodal inputs.

### For Regulators and Policymakers

The MMDT benchmark provides a framework for evaluating multimodal model safety that can inform regulatory standards:

**Multimodal-specific safety standards.** Regulations that address AI safety should include multimodal-specific provisions, recognizing that safety evaluations conducted on text-only versions of models are insufficient for multimodal deployments.

**Mandatory safety evaluation.** The finding that even the most capable proprietary models exhibit significant safety vulnerabilities suggests that mandatory safety evaluation using standardized benchmarks like MMDT should be a prerequisite for deployment in high-stakes applications.

**Transparency requirements.** Model developers should be required to disclose the results of multimodal safety evaluations, enabling informed deployment decisions by downstream users.

### For the Research Community

MMDT opens several important research directions:

**Multimodal safety alignment.** How can we develop alignment techniques that are specifically designed for the multimodal setting, addressing the unique challenges of cross-modal attacks and emergent unsafe behaviors?

**Cross-modal adversarial training.** How can we train models to be robust to adversarial inputs that exploit the interaction between modalities?

**Privacy-preserving visual processing.** How can we build multimodal models that can process visual information without extracting or revealing private information?

**Hallucination mitigation for multimodal models.** How can we reduce the tendency of multimodal models to confabulate visual details, especially when prompted to describe images in detail?

---

## Comparison with Related Benchmarks

MMDT builds on and extends several prior trustworthiness benchmarks:

**DecodingTrust** (Zhang et al., 2023) evaluated trustworthiness of GPT models but focused exclusively on text. MMDT extends the trustworthiness evaluation paradigm to the multimodal setting.

**TrustLLM** (Huang et al., 2024) provided a comprehensive trustworthiness evaluation for large language models. MMDT adapts several evaluation dimensions from TrustLLM while adding multimodal-specific scenarios.

**VMDT** (Potter et al., 2025) evaluated trustworthiness of video foundation models. While VMDT focuses on video understanding, MMDT addresses the broader challenge of multimodal reasoning across text and image inputs.

**OVERT** evaluated over-refusal and safety in text-to-image models. MMDT complements OVERT by evaluating the safety of multimodal understanding models rather than image generation models.

The key distinction of MMDT is its focus on the **cross-modal interaction** as a first-class evaluation target. Rather than evaluating each modality independently, MMDT specifically designs scenarios that test whether the combination of modalities creates new vulnerabilities.

---

## Limitations and Future Directions

As a pioneering benchmark, MMDT has several limitations that point to future research directions:

### Evolving Model Capabilities

Multimodal models are advancing rapidly, with new architectures, training techniques, and capabilities emerging regularly. The benchmark will need to evolve to capture new failure modes and attack vectors as models become more capable. The current evaluation captures the state of the art at the time of publication, but the safety landscape is dynamic.

### Cultural and Linguistic Coverage

While MMDT makes efforts to include diverse cultural contexts and languages, the coverage is inevitably incomplete. Expanding the benchmark to include more languages, cultural contexts, and region-specific safety concerns is an important priority for making the evaluation globally relevant.

### Extension to Additional Modalities

The current benchmark focuses on text-image multimodal models. As models incorporate additional modalities — audio, video, 3D, code, structured data — the benchmark will need to extend to cover these new modality combinations and their associated safety risks.

### Dynamic and Adaptive Evaluation

The current benchmark uses a static evaluation dataset. In practice, adversaries adapt their attacks based on model behavior. Developing dynamic evaluation protocols that simulate adaptive adversaries would provide a more realistic assessment of real-world safety.

### Generative Multimodal Safety

MMDT primarily evaluates multimodal understanding — models that process images and generate text. As multimodal generative models (those that generate images, video, or audio from multimodal inputs) become more capable, the benchmark will need to extend to cover the safety implications of multimodal generation.

---

## Conclusion

MMDT represents a foundational contribution to the safety and trustworthiness evaluation of multimodal foundation models. By providing the first comprehensive benchmark specifically designed for the multimodal setting, it reveals critical vulnerabilities that are invisible to standard unimodal safety evaluations.

The findings are sobering: current multimodal models are significantly less safe than their text-only counterparts, with cross-modal attack vectors providing effective bypasses for safety guardrails. Cross-modal hallucination, amplified demographic biases, adversarial robustness gaps, and visual privacy leakage represent real risks that must be addressed before multimodal models can be safely deployed in high-stakes applications.

As multimodal AI systems become increasingly embedded in critical infrastructure, healthcare, education, and public services, the need for rigorous trustworthiness evaluation will only grow. MMDT provides both the framework and the motivation for this evaluation — establishing that multimodal safety is not simply an extension of text safety but a fundamentally new challenge requiring dedicated research, dedicated benchmarks, and dedicated solutions.

The path forward requires collaboration between model developers, safety researchers, regulators, and the broader community to ensure that the remarkable capabilities of multimodal AI are matched by equally remarkable trustworthiness. Benchmarks like MMDT are essential tools in this effort — measuring where we are, revealing where we fall short, and guiding us toward where we need to be.

## References

- Xu, C., et al. "MMDT: Decoding the Trustworthiness and Safety of Multimodal Foundation Models." *Proceedings of the International Conference on Learning Representations (ICLR)*, 2025. [arXiv:2503.14827](https://arxiv.org/abs/2503.14827)
- Zhang, X., et al. "DecodingTrust: A Comprehensive Assessment of Trustworthiness in GPT Models." *Proceedings of NeurIPS*, 2023.
- Huang, Y., et al. "TrustLLM: Trustworthiness in Large Language Models." *Proceedings of ICML*, 2024.
- Potter, Y., et al. "VMDT: Decoding the Trustworthiness of Video Foundation Models." *Proceedings of NeurIPS*, 2025.
- Liu, H., et al. "Visual Instruction Tuning." *Proceedings of NeurIPS*, 2023.
- Bai, J., et al. "Qwen-VL: A Versatile Vision-Language Model." *arXiv preprint*, 2023.
