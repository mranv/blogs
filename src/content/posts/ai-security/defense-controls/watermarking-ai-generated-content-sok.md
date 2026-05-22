---
author: Anubhav Gain
pubDatetime: 2026-05-22T16:10:00+05:30
modDatetime: 2026-05-22T16:10:00+05:30
title: "SoK: Watermarking AI-Generated Content — IEEE S&P Distinguished Paper"
slug: watermarking-ai-generated-content-sok
featured: true
draft: true
tags:
  - ai-security
  - watermarking
  - ai-generated-content
  - ieee-sp
  - distinguished-paper
category: AI Research
description: A comprehensive systematization of knowledge on watermarking techniques for AI-generated content, winner of the IEEE S&P 2025 Distinguished Paper Award.
---

# SoK: Watermarking AI-Generated Content — IEEE S&P Distinguished Paper

As AI-generated content becomes indistinguishable from human-created work, the ability to reliably identify synthetic text, images, audio, and video has evolved from an academic curiosity into a societal imperative. Deepfakes sway elections, AI-generated prose floods publishing platforms, and synthetic voices bypass authentication systems. At IEEE S&P 2025, Xuandong Zhao and colleagues from UC Santa Barbara delivered the definitive systematization of this rapidly expanding field with their [Distinguished Paper Award-winning work, "SoK: Watermarking for AI-Generated Content"](https://arxiv.org/abs/2411.18479). This paper doesn't merely survey existing techniques — it constructs a unified framework for understanding, evaluating, and advancing watermarking across all modalities of generative AI.

This post provides a comprehensive analysis of the SoK paper, its taxonomic contributions, key findings, and implications for researchers and practitioners building the next generation of content authenticity infrastructure.

## Why Watermarking Matters Now

### The Authenticity Crisis

The proliferation of generative AI has created an unprecedented authenticity crisis. Large language models produce text that is fluent, coherent, and often factually plausible — yet entirely synthetic. Image generators create photorealistic scenes that never existed. Audio synthesis clones voices with seconds of reference material. Video generation produces footage of events that never happened.

The consequences are already visible:

- **Misinformation at scale**: AI-generated news articles, social media posts, and commentary spread false narratives with the veneer of credibility that comes from naturalistic language and imagery.
- **Identity fraud**: Synthetic voices and images bypass biometric authentication systems, enabling financial fraud and unauthorized access.
- **Intellectual property disputes**: When AI can reproduce styles, voices, and creative patterns with high fidelity, determining originality and attribution becomes a legal quagmire.
- **Trust erosion**: As people become aware that any piece of content might be synthetic, trust in all digital media degrades — including authentic content.

### Why Detection Alone Is Insufficient

A natural first approach to identifying AI-generated content is **post-hoc detection**: training classifiers to distinguish synthetic from human-created content. The SoK paper explains why this approach is fundamentally fragile:

1. **Adversarial arms race**: Detection models can be defeated by adversarial perturbations, paraphrasing, or simply using a different generator that the detector wasn't trained on.
2. **Generalization failure**: Detectors trained on content from one model family (e.g., GPT-4) often fail on content from another (e.g., Claude, Gemini), and degrade as models improve.
3. **False positive costs**: False accusations of AI authorship carry real harm — for students, journalists, and professionals whose legitimate work is flagged as synthetic.
4. **Lack of attribution**: Even when detection succeeds, it cannot determine *which* model generated the content or *when* it was generated.

Watermarking addresses these limitations by **embedding a detectable signal at generation time**, creating a proactive rather than reactive approach to content authentication.

## The Unified Taxonomy

The most significant contribution of this SoK paper is its **unified taxonomic framework** for watermarking across all generative modalities. Prior to this work, the watermarking literature was fragmented: text watermarking, image watermarking, and audio watermarking evolved largely independently, with different terminology, evaluation criteria, and assumptions. Zhao et al. bridge these silos with a coherent framework that spans the entire landscape.

### Modalities Covered

The SoK systematically analyzes watermarking techniques across five modalities:

1. **Text**: Watermarking the output of large language models (LLMs)
2. **Image**: Watermarking the output of diffusion models and GANs
3. **Audio**: Watermarking synthetic speech and music
4. **Video**: Watermarking generated or manipulated video sequences
5. **Multi-modal**: Watermarking content that spans multiple modalities (e.g., image-text pairs)

### The Watermarking Pipeline

The paper introduces a generalized watermarking pipeline that applies across modalities:

```
Generator → [Watermark Embedding] → Watermarked Content → [Distortions/Attacks] → [Watermark Extraction] → Detection/Verification
```

Each stage of this pipeline is analyzed in detail, with modality-specific variations clearly delineated.

## Watermarking Techniques: A Cross-Modal Analysis

### Text Watermarking

Text watermarking presents unique challenges because text is discrete — you cannot add imperceptible perturbations to a word in the way you can to a pixel. The SoK identifies several families of text watermarking approaches:

#### Token-Level Statistical Watermarking

The most prominent family, exemplified by the Kirchenbauer et al. method, modifies the sampling process during text generation:

- **Green-red list partitioning**: At each generation step, the vocabulary is partitioned into a "green list" (favored tokens) and a "red list" (disfavored tokens), with the partition determined by a secret key and the preceding token context.
- **Bias injection**: Green-list tokens receive a small logit bonus, making them slightly more likely to be selected. Over a sufficiently long text, the statistical excess of green-list tokens reveals the watermark.
- **Detection via hypothesis testing**: A z-test determines whether the observed frequency of green-list tokens exceeds the expected baseline, with the secret key required for detection.

The SoK evaluates variants including:
- **Adjustable hardness**: Trading watermark strength for text quality by varying the logit bias
- **Multi-bit watermarks**: Encoding not just a binary watermark presence but additional information (model ID, generation timestamp)
- **Semantic-aware partitioning**: Using semantic similarity rather than random partitioning to reduce quality impact

#### Inverse-Transform Watermarking

An alternative approach applies invertible transformations to the model's output distribution:

- The model generates text normally, but the output distribution is transformed using a key-dependent function
- Detection applies the inverse transformation and tests for statistical anomalies
- This approach can be more robust to certain types of attacks but may introduce stronger quality degradation

#### Learning-Based Watermarking

Neural network-based approaches that learn to embed and extract watermarks:

- **Encoder-decoder architectures**: A learned encoder modifies the generation process, and a learned decoder extracts the watermark
- **Training jointly with the language model**: The watermark is embedded into the model's weights during training rather than applied at inference time
- **Advantages**: Can achieve better quality-robustness tradeoffs than hand-crafted methods
- **Disadvantages**: Require access to model training, which limits applicability to open-source models

### Image Watermarking

Image watermarking has a longer history, but generative AI introduces new challenges and opportunities:

#### Latent Space Watermarking

Modern image generators (Stable Diffusion, DALL-E) operate in a latent space. Watermarking at this stage can be more effective:

- **Post-training embedding**: Injecting watermarks into the model's decoder so that all generated images carry the mark
- **Fine-tuning for watermarking**: Adding a watermarking objective to the decoder fine-tuning process
- **Stable Signature**: A notable approach that fine-tunes the LDM decoder to embed a binary signature detectable by a trained classifier

#### Output Space Watermarking

Traditional approaches applied after generation:

- **Frequency domain embedding**: Hiding watermark information in specific frequency bands (DCT, DWT, DFT)
- **Spread-spectrum techniques**: Distributing the watermark signal across the image to survive cropping and compression
- **Deep learning-based methods**: Using neural networks for both embedding and extraction

The SoK provides a rigorous comparison showing that latent space methods generally achieve better quality-robustness tradeoffs for AI-generated images, while output-space methods remain relevant for scenarios where the generator cannot be modified.

### Audio and Video Watermarking

Audio and video watermarking receive comparatively less attention in the literature, which the SoK identifies as a significant gap:

- **Audio**: Techniques adapted from music watermarking (e.g., AudioSeal) show promise for synthetic speech, but robustness against common audio processing (compression, noise addition, re-encoding) remains challenging.
- **Video**: Spatial-temporal watermarking extends image techniques across frames, but the computational cost of embedding and extracting watermarks from video streams at production quality is substantial.

## Properties and Evaluation Criteria

A key contribution of the SoK is the **formalization of evaluation criteria** for watermarking systems. The paper identifies six critical properties:

### 1. Quality Preservation

The watermark should not degrade the perceptual quality of the generated content. This is measured differently across modalities:

- **Text**: Perplexity, BLEU/ROUGE scores, human evaluation of fluency and coherence
- **Image**: FID, PSNR, SSIM, LPIPS, human evaluation
- **Audio**: PESQ, VISQOL, mean opinion scores

The SoK reveals a consistent finding: **there is a fundamental tension between watermark strength and content quality**. Stronger watermarks (more detectable, more robust) inevitably introduce greater quality degradation. The art of watermarking lies in navigating this tradeoff.

### 2. Detectability

The watermark should be reliably detectable. Key metrics include:

- **True positive rate (TPR)**: Probability of correctly identifying watermarked content
- **False positive rate (FPR)**: Probability of falsely flagging human content as watermarked
- **Area under the ROC curve (AUC)**: Overall detection performance
- **Minimum text length / image size**: The minimum content length needed for reliable detection

A critical finding: most published watermarking methods achieve excellent detection metrics (AUC > 0.99) under ideal conditions, but performance degrades significantly under realistic conditions with distortion and attacks.

### 3. Robustness

The watermark should survive various transformations and attacks:

- **Paraphrasing**: Rewriting watermarked text while preserving meaning
- **Translation**: Converting watermarked text to another language
- **Compression**: JPEG, MP3, H.264 compression of images, audio, and video
- **Cropping and resizing**: Spatial transformations of images and video
- **Noise injection**: Adding random perturbations
- **Adversarial attacks**: Deliberately crafted perturbations designed to remove the watermark

The SoK's systematic robustness evaluation reveals that **most current watermarking schemes are not robust against determined adversaries**. Paraphrasing attacks, in particular, are highly effective against text watermarking, while image watermarking is vulnerable to a combination of geometric transformations and noise.

### 4. Security

Beyond robustness to generic distortions, security considers adversarial settings:

- **Key extraction**: Can an adversary recover the watermarking key by observing watermarked outputs?
- **Spoofing**: Can an adversary embed a watermark into human-created content?
- **Removal**: Can an adversary strip the watermark while preserving content quality?
- **Forgery**: Can an adversary modify an existing watermark to carry false information?

The SoK identifies security as the most underexplored property in the current literature, with many papers assuming the secrecy of the watermarking key without formal analysis of how it might be compromised.

### 5. Capacity

How much information can the watermark carry? This ranges from:

- **Zero-bit watermarks**: Binary presence/absence detection
- **Multi-bit watermarks**: Encoding tens to hundreds of bits of metadata (model ID, timestamp, user ID)
- **High-capacity watermarks**: Encoding full messages, at the cost of quality and robustness

### 6. Efficiency

The computational overhead of embedding and extracting watermarks:

- **Embedding overhead**: Additional latency introduced during content generation
- **Extraction overhead**: Computational cost of watermark detection
- **Training overhead**: For methods requiring model fine-tuning

The SoK finds that the most efficient methods (e.g., logit-bias text watermarking) add negligible overhead (<1% latency increase), while learning-based methods can require significant training investment but minimal inference overhead.

## Attack Landscape

One of the most valuable sections of the SoK is its systematic catalog of attacks against watermarking systems. The authors organize attacks into four categories:

### Removal Attacks

These aim to remove the watermark while preserving content quality:

- **Paraphrasing and rewriting**: Using another LLM to paraphrase watermarked text is surprisingly effective against most text watermarking schemes
- **Image-to-image translation**: Running watermarked images through diffusion models to regenerate them
- **Compression and degradation**: Applying heavy compression, noise, and quality reduction
- **Token substitution**: Systematically replacing tokens in watermarked text with synonyms

### Spoofing Attacks

These aim to embed watermarks into content that wasn't generated by the watermarked model:

- **Key recovery**: Observing many watermarked outputs to infer the secret key
- **Masked diffusion attacks**: Exploiting the structure of latent-space watermarks to inject them into non-generated images
- **Signature copying**: Extracting a watermark from one image and applying it to another

### Forgery Attacks

These aim to modify existing watermarks to carry false information:

- **Bit-flipping attacks**: Changing individual bits of a multi-bit watermark
- **Collusion attacks**: Combining multiple watermarked outputs to isolate and modify the watermark signal

### Evasion Attacks

These aim to generate content that avoids watermark detection:

- **Non-watermarked models**: Simply using a model without watermarking
- **Partial regeneration**: Mixing watermarked and non-watermarked segments
- **Adversarial prompt engineering**: Crafting prompts that exploit weaknesses in the watermarking algorithm

## Key Findings and Insights

### Finding 1: No Single Method Dominates

The SoK's comprehensive comparison reveals that **no single watermarking method achieves the best performance across all properties simultaneously**. Methods that excel at robustness often sacrifice quality; methods with strong security guarantees may have limited capacity; efficient methods may be vulnerable to specific attacks. This finding underscores the need for application-specific watermarking design.

### Finding 2: Text Watermarking Is the Hardest Problem

Among all modalities, text watermarking faces the most severe challenges:

- The discrete nature of text limits the information-theoretic capacity for embedding
- Paraphrasing attacks are simple, effective, and preserve meaning
- Translation to other languages often destroys text watermarks entirely
- The quality-robustness tradeoff is particularly acute: even small watermarking biases can measurably degrade text fluency

The SoK suggests that practical text watermarking may need to combine statistical methods with semantic fingerprinting or stylistic analysis.

### Finding 3: The Security Foundation Is Shaky

Most watermarking systems rely on the secrecy of a key, but the SoK identifies several scenarios where this assumption is questionable:

- **API access**: Adversaries with API access can query the watermarked model extensively, generating data for key recovery
- **Open-source models**: When the watermarked model is open-source, the adversary has full access to the watermarking algorithm
- **Side-channel leakage**: Watermark detection statistics may leak information about the key

The paper calls for watermarking systems that provide **security beyond key secrecy**, drawing on insights from cryptography (e.g., public-key watermarking, provable security guarantees).

### Finding 4: Standards and Interoperability Are Missing

The watermarking ecosystem is fragmented:

- Different providers use different watermarking schemes with no interoperability
- No universal detection infrastructure exists (unlike, say, digital certificates)
- Regulatory requirements (EU AI Act, state-level deepfake laws) mandate watermarking but don't specify technical standards
- The absence of standards creates a collective action problem: individual providers watermark their content, but detecting watermarks from other providers is difficult or impossible

### Finding 5: The Quality-Robustness Tradeoff Is Fundamental

Across all modalities and methods, the SoK demonstrates that the tradeoff between content quality and watermark robustness is not merely a limitation of current techniques but appears to be **information-theoretically fundamental**. Any signal that modifies the content distribution to embed a watermark necessarily reduces the content's fidelity to the unwatermarked distribution. The question is not whether this tradeoff exists, but where the Pareto frontier lies and how to push it outward.

## Implications for Practitioners

### For AI Model Developers

1. **Embed watermarking early**: Retrofitting watermarking onto an existing model is harder than designing it into the generation pipeline from the start. Latent-space watermarking integrated during training produces the strongest results.
2. **Plan for attack evolution**: Any deployed watermarking scheme will be attacked. Design with key rotation, algorithm agility, and defense-in-depth in mind.
3. **Measure quality impact rigorously**: Don't just measure detection AUC — evaluate the actual impact on content quality across diverse use cases, languages, and domains.

### For Platform Operators

1. **Invest in detection infrastructure**: Building watermark detection into content pipelines (upload filters, content moderation systems) is essential for making watermarking useful at scale.
2. **Support multiple schemes**: No single watermarking scheme will be universal. Detection infrastructure should be extensible to support new schemes as they emerge.
3. **Combine with metadata**: Watermarking is most powerful when combined with content provenance metadata (C2PA standard, digital signatures) to create a complete authenticity chain.

### For Policymakers

1. **Avoid mandating specific techniques**: Technology evolves rapidly. Regulations should specify outcomes (detectable AI-generated content) rather than specific watermarking methods.
2. **Fund interoperability research**: The biggest gap is not within any single watermarking scheme but between them. Funding for standards development and cross-scheme detection is high-impact.
3. **Consider the global landscape**: Watermarking requirements that only apply in one jurisdiction will be circumvented by generators operating elsewhere. International coordination is essential.

## Open Research Directions

The SoK identifies several promising research directions:

### Provable Watermarking

Current watermarking lacks formal guarantees. Can we develop watermarking schemes with **provable bounds** on false positive rates, robustness to specific attack classes, and information capacity?

### Public-Key Watermarking

Analogous to public-key cryptography, can we develop watermarking schemes where anyone can detect the watermark but only the key holder can embed it? This would enable universal detection without compromising security.

### Cross-Modal Watermarking

As multi-modal models (GPT-4V, Gemini) generate content spanning text, images, and audio, watermarking schemes that create **coherent cross-modal signatures** — where the watermark in the text component is linked to the watermark in the image component — could provide stronger guarantees.

### Watermarking for Agentic Systems

AI agents that take actions through tool use create new watermarking challenges: how do you watermark not just the text output but the sequence of actions, tool calls, and intermediate reasoning?

### Adaptive Watermarking

Watermarking schemes that adapt their strength based on the content's sensitivity and the threat model. High-stakes content (e.g., news images, financial reports) could receive stronger watermarks, while casual content receives lighter treatment to preserve quality.

## Conclusion

The "SoK: Watermarking for AI-Generated Content" paper is a landmark contribution that earns its IEEE S&P 2025 Distinguished Paper Award not through a single novel algorithm, but through the intellectual labor of **unifying a fragmented field** into a coherent body of knowledge. By establishing a common taxonomy, evaluation framework, and attack categorization, it provides the foundation on which the next generation of watermarking research can build.

The central message is both sobering and motivating: **watermarking AI-generated content is essential, possible, and currently insufficient.** No existing scheme provides the combination of quality, robustness, security, capacity, and efficiency needed for the coming scale of AI content generation. But the theoretical foundations are solid, the practical techniques are improving rapidly, and the societal demand is clear.

As the authors demonstrate, the path forward requires not just better algorithms but better **systems thinking** — watermarking integrated into generation pipelines, detection embedded into content platforms, standards that enable interoperability, and regulations that drive adoption without stifling innovation. The SoK provides the map; the community now must traverse the terrain.

---

**Paper Reference**: Xuandong Zhao et al., "SoK: Watermarking for AI-Generated Content," IEEE S&P 2025 (Distinguished Paper Award). Available at [arXiv:2411.18479](https://arxiv.org/abs/2411.18479).
