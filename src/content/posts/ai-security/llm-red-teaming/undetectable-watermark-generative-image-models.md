---
author: Anubhav Gain
pubDatetime: 2026-05-20T10:23:00+05:30
modDatetime: 2026-05-20T10:23:00+05:30
title: "Undetectable Watermarks for Generative Image Models"
slug: undetectable-watermark-generative-image-models
featured: false
draft: true
tags:
  - ai-security
  - watermarking
  - image-generation
  - iclr
  - steganography
category: AI Research
description: A breakthrough in provably undetectable watermarking for generative image models that preserves image quality while enabling reliable detection.
---

## The Authenticity Crisis in Generative Imaging

The explosive growth of generative image models — from DALL·E 3 and Midjourney to Stable Diffusion and Flux — has fundamentally altered the relationship between images and truth. Photorealistic images can now be synthesized from text prompts in seconds, and the gap between AI-generated and authentic photographs has narrowed to the point where human observers can no longer reliably distinguish between them. This capability, while transformative for creative industries, raises urgent questions about misinformation, deepfakes, copyright enforcement, and the provenance of visual media.

Watermarking has long been proposed as the primary technical solution to this problem. The idea is straightforward: embed a hidden signal in every image a generative model produces, creating a machine-readable marker that identifies the image as AI-generated. In principle, this allows platforms, regulators, and individuals to verify whether an image was produced by a specific model — even when the image has been cropped, compressed, or otherwise modified.

Yet existing watermarking schemes for generative images suffer from a fundamental limitation: they are **detectable**. Not detectable in the sense that the watermark signal can be found — that is the entire point — but detectable in the sense that the presence of the watermark itself introduces a measurable distortion in the image's statistical distribution. An adversary who knows what to look for can determine whether a model's outputs are watermarked, and armed with that knowledge, can mount targeted attacks to remove the watermark while preserving image quality.

At ICLR 2025, Sam Gunn, Xuandong Zhao, and Dawn Song introduced **"An Undetectable Watermark for Generative Image Models"** — a watermarking scheme that is provably undetectable, meaning that the watermarked image distribution is statistically indistinguishable from the unwatermarked distribution. This is a significant theoretical and practical advance that addresses one of the deepest challenges in content attribution for generative AI.

**Paper**: [An Undetectable Watermark for Generative Image Models](https://arxiv.org/abs/2410.07369) — ICLR 2025
**Authors**: Sam Gunn, Xuandong Zhao, Dawn Song (UC Berkeley)

---

## Why Existing Watermarks Fall Short

To understand the significance of an undetectable watermark, it is essential to understand why existing approaches are vulnerable.

### The Detection-Removal Arms Race

Most watermarking schemes for generative images work by perturbing the model's output in a specific way that encodes a signal. This might involve shifting pixel values, modifying frequency components, or altering the model's sampling process to favor certain patterns. The watermark detector then looks for these specific perturbations to identify watermarked images.

The problem is that any perturbation that is strong enough to be reliably detected is also, by definition, a deviation from the model's natural output distribution. This deviation creates a statistical "fingerprint" that reveals not just the watermark but also the fact that watermarking is occurring. Once an adversary knows watermarking is in use, they can:

1. **Reverse-engineer the watermark** by comparing watermarked and non-watermarked outputs from the same model.
2. **Train a removal network** specifically designed to strip the watermark signal while minimizing perceptual distortion.
3. **Exploit detection as a side channel** — knowing which images are watermarked reveals information about the model's deployment configuration.

### The Quality-Robustness Trade-off

Existing watermarks face an inherent tension between three properties:

- **Watermark strength**: How reliably the watermark can be detected.
- **Image quality**: How much the watermark degrades the perceptual quality of the generated image.
- **Robustness**: How well the watermark survives image transformations like JPEG compression, cropping, resizing, and noise addition.

Improving any one of these properties typically comes at the expense of the others. A strong watermark that is robust to transformations will degrade image quality. A perceptually invisible watermark that preserves quality may not survive compression. This trilemma has limited the practical adoption of watermarking in production generative image systems.

### The Theoretical Barrier

From an information-theoretic perspective, most existing watermarking schemes are "kludges" — engineering solutions that work reasonably well in practice but lack formal guarantees. There is no proof that the watermark cannot be detected or removed by a sufficiently sophisticated adversary. This absence of formal guarantees is particularly concerning in adversarial settings where motivated attackers have strong incentives to remove watermarks — for example, to use AI-generated images in misinformation campaigns while evading detection.

---

## The Undetectable Watermark: Core Insight

Gunn, Zhao, and Song's work addresses the detectability problem at its theoretical root. Their key insight is to construct a watermarking scheme that produces images drawn from exactly the same distribution as the unwatermarked model — making it **provably impossible** to distinguish watermarked from unwatermarked images using only statistical analysis.

### Cryptographic Inspiration

The approach draws on ideas from **cryptography** and **steganography** — the study of hiding information within seemingly innocuous data. In the cryptographic literature, the concept of a "covert channel" — a communication channel that cannot be detected by an adversary who observes the communication medium — has been extensively studied. The authors apply this theoretical framework to the watermarking problem, treating watermarking as a form of steganographic communication where the "message" is the watermark and the "cover" is the generated image.

### Rejection Sampling with a Secret Key

The core mechanism is a form of **rejection sampling** guided by a cryptographic pseudorandom function (PRF) keyed with a secret known only to the watermark generator and detector. The process works as follows:

1. **Key Generation**: A secret key *k* is generated and shared between the watermark embedder and the detector. This key is kept secret from all other parties.

2. **Candidate Generation**: When the model generates an image, the watermarking algorithm treats the model's output as a candidate. Instead of directly outputting this candidate, it evaluates whether the candidate satisfies a specific property determined by the key *k*.

3. **Acceptance Criterion**: The candidate image is hashed (using a cryptographic hash function keyed with *k*), and the hash output is checked against a predetermined acceptance criterion. If the criterion is satisfied, the image is output as-is. If not, the model generates a new candidate, and the process repeats.

4. **Output Distribution Preservation**: Crucially, because the acceptance criterion depends only on the secret key and the image content — and because the hash function behaves pseudorandomly — the distribution of accepted images is statistically indistinguishable from the model's natural output distribution. An adversary who does not know *k* cannot determine whether any particular image was generated through this rejection sampling process or through normal generation.

### Why This Works: The Statistical Argument

The theoretical guarantee rests on the properties of pseudorandom functions. A PRF, when evaluated on any input, produces output that is computationally indistinguishable from truly random values. This means:

- For an adversary who does not know the key *k*, the acceptance criterion appears to be a random predicate applied to random images. It reveals no information about the watermark's structure.
- The rejection sampling process does not change the conditional distribution of images given acceptance — it merely selects a subset of the model's outputs. Because selection is based on a pseudorandom function that is independent of image quality, the selected images are representative of the model's natural output distribution.
- The probability that a random image satisfies the acceptance criterion can be calibrated to control the expected number of rejections before acceptance, trading off computational cost against watermark signal strength.

### Detection Mechanism

Detection is elegant in its simplicity. Given an image and the secret key *k*, the detector:

1. Computes the hash of the image using the keyed hash function.
2. Checks whether the hash satisfies the acceptance criterion.
3. If it does, the image is classified as watermarked. If it does not, the image is classified as not watermarked.

The false positive rate — the probability that a non-watermarked image happens to satisfy the acceptance criterion — is precisely controlled by the acceptance probability parameter. By setting this parameter appropriately, the system can achieve an arbitrarily low false positive rate at the cost of more rejection samples during generation.

---

## Technical Architecture in Detail

### Handling Continuous Outputs

One of the key technical challenges is that generative image models produce images in a continuous space (pixel values), while cryptographic hash functions operate on discrete inputs. The authors address this by introducing a **discretization** step that maps continuous image representations to discrete values suitable for hashing.

The discretization is designed to be robust to common image transformations. For example, the hashing might operate on a feature representation of the image that is invariant to JPEG compression, small rotations, and moderate cropping. This ensures that the watermark remains detectable even after the image has been processed or modified.

### Robustness Through Invariant Features

The robustness of the watermark depends on the choice of the feature representation used for hashing. The authors explore several options:

**Frequency-domain features**: By hashing in the frequency domain (e.g., DCT or wavelet coefficients), the watermark can be made robust to spatial transformations like cropping and translation. Frequency-domain features are also naturally invariant to certain types of noise and compression artifacts.

**Semantic features**: Using features from a pre-trained image encoder (e.g., CLIP or a vision transformer) provides robustness to a wider range of transformations because semantic features capture high-level image content that is preserved under most image manipulations.

**Learned invariant features**: The authors also explore learning feature representations that are specifically optimized for invariance to a targeted set of transformations, providing the strongest robustness guarantees for specific threat models.

### Computational Efficiency

Rejection sampling introduces a computational overhead: the model may need to generate multiple candidates before one is accepted. The expected number of trials is 1/p, where p is the acceptance probability. For practical watermark strength, the authors show that p can be set to values like 0.1–0.5, meaning the expected computational overhead is between 2× and 10× — a significant but manageable cost for high-value applications where watermark integrity is critical.

The authors also explore optimizations to reduce this overhead:

- **Parallel candidate generation**: Multiple candidates can be generated in parallel and checked simultaneously, reducing wall-clock time at the cost of increased compute.
- **Adaptive acceptance criteria**: The acceptance criterion can be relaxed for difficult prompts where many candidates would otherwise be rejected, trading watermark strength for generation speed.
- **Caching and precomputation**: For frequently used prompts or styles, precomputed candidates can be cached to reduce the amortized cost.

---

## Formal Guarantees

The paper's strongest contribution is its formal guarantee of undetectability, which is proved rigorously under standard cryptographic assumptions.

### The Undetectability Theorem

**Theorem (informal)**: Under the assumption that the keyed hash function is a secure pseudorandom function, no polynomial-time adversary can distinguish between watermarked and unwatermarked images with non-negligible advantage.

This means that even an adversary with unlimited access to watermarked images — who can query the model, analyze its outputs, and apply any statistical test — cannot determine whether watermarking is in use, as long as they do not possess the secret key.

### Comparison with Prior Theoretical Work

The concept of provably secure steganography has been explored in the cryptographic literature, notably by Hopper et al. (2002) and subsequent work. However, these prior constructions were designed for discrete channels (e.g., text) and did not address the specific challenges of continuous image generation. Gunn et al.'s contribution is in adapting these theoretical techniques to the practical setting of modern generative image models, handling continuous outputs, ensuring robustness to image transformations, and demonstrating the approach's feasibility on state-of-the-art diffusion models.

---

## Experimental Evaluation

The authors evaluate their watermarking scheme on several fronts, demonstrating both its undetectability and its practical effectiveness.

### Undetectability Verification

To verify undetectability empirically, the authors train adversarial classifiers specifically designed to distinguish watermarked from unwatermarked images. These classifiers are given access to large numbers of both watermarked and unwatermarked images and are trained to maximize their classification accuracy. The results confirm the theoretical prediction: the classifiers perform no better than random guessing, demonstrating that the watermark introduces no detectable statistical artifact.

### Robustness to Transformations

The watermark's robustness is evaluated against a comprehensive suite of image transformations:

- **JPEG compression**: The watermark survives JPEG compression at quality levels as low as 50, a common threshold for web images.
- **Cropping**: Even when 50% or more of the image is cropped, the watermark remains detectable when using robust feature representations.
- **Resizing**: Upscaling and downscaling operations preserve the watermark signal.
- **Noise addition**: Gaussian noise, salt-and-pepper noise, and other common noise types do not destroy the watermark at moderate levels.
- **Combined transformations**: Realistic attack scenarios that combine multiple transformations (e.g., crop + compress + resize) are evaluated, and the watermark remains detectable under most practical combinations.

### Comparison with Existing Methods

The authors compare their approach against several state-of-the-art watermarking methods, including:

- **DwtDct**: A classical frequency-domain watermarking approach.
- **RivaGAN**: A learning-based watermarking method.
- **StableSignature**: A fine-tuning-based approach for diffusion models.
- **Tree-Ring**: A recent latent-space watermarking method for diffusion models.

The undetectable watermark achieves comparable or superior robustness across most transformation types while providing the unique guarantee of statistical undetectability — a property none of the comparison methods offer.

### Image Quality Preservation

Because the watermarking process does not modify images — it only selects among the model's natural outputs — the image quality of watermarked images is identical to that of unwatermarked images. This is a significant advantage over methods that perturb images to embed watermarks, which inevitably introduce some quality degradation. The authors confirm this through both automated quality metrics (FID, LPIPS, PSNR) and human evaluation studies.

---

## Implications and Applications

### Combating Deepfakes and Misinformation

The most immediate application is in combating AI-generated misinformation. A generative model provider can embed an undetectable watermark in all outputs, creating a system where any image produced by the model can be identified by the provider (who holds the secret key) while remaining indistinguishable from non-watermarked images to everyone else. This creates an "attribution backchannel" that is invisible to bad actors but accessible to the model provider and authorized platforms.

### Copyright and Intellectual Property

Content creators and stock image platforms can use undetectable watermarks to track AI-generated images derived from their models or datasets. Because the watermark cannot be detected or removed without the secret key, it provides a robust mechanism for intellectual property enforcement — even when images are heavily modified or re-uploaded to different platforms.

### Regulatory Compliance

Emerging AI regulations (such as the EU AI Act) increasingly require disclosure of AI-generated content. Undetectable watermarks offer a technical mechanism for compliance that does not degrade user experience — the watermark is invisible to users but detectable by authorized verification systems.

### Forensic Applications

In legal and forensic contexts, undetectable watermarks can provide tamper-evident provenance tracking for AI-generated images. Because the watermark is robust to common transformations, it can serve as evidence that an image was produced by a specific model at a specific time, even after the image has been processed or edited.

---

## Limitations and Open Challenges

Despite its strong theoretical foundations, the approach has several practical limitations:

### Computational Overhead

The rejection sampling process requires generating multiple candidate images for each output, increasing computational cost. While the authors show this overhead is manageable (typically 2–10× depending on parameters), it is non-trivial for large-scale deployment where cost efficiency is paramount.

### Key Management

The security of the scheme depends entirely on the secrecy of the key *k*. If the key is compromised, an adversary can both detect and forge watermarks. This creates a key management challenge, especially in distributed systems where the key must be shared among multiple generation servers and detection endpoints.

### Robustness to Strong Adversarial Attacks

While the watermark is robust to common image transformations, a determined adversary with significant computational resources can attempt to destroy the watermark through aggressive modifications — extensive inpainting, style transfer, or regeneration through a different model. The watermark's robustness against such "model laundering" attacks is an open question.

### Scalability to Video

The current work focuses on static image generation. Extending the approach to video generation introduces additional challenges related to temporal consistency, frame-to-frame coherence, and computational cost. Ensuring that a watermark survives temporal transformations (frame dropping, reordering, interpolation) while remaining undetectable is an important open problem.

### Watermark Capacity

The current scheme encodes a binary signal — watermarked or not watermarked. Enriching the watermark to carry additional information (model version, generation timestamp, user identifier) while maintaining undetectability and robustness is a direction for future work.

---

## Broader Context: The Provenance Ecosystem

This work sits within a broader ecosystem of content provenance initiatives:

- **C2PA (Coalition for Content Provenance and Authenticity)**: An industry standard for embedding provenance metadata in media files. C2PA metadata is stored in a manifest that is attached to the file, making it vulnerable to stripping. Undetectable watermarks complement C2PA by providing a provenance signal that cannot be removed.
- **SynthID (Google DeepMind)**: A watermarking system integrated into Imagen and other Google generative models. SynthID uses a learning-based approach that embeds watermarks in the image generation process. While effective, it does not provide formal undetectability guarantees.
- **Invisible watermarks in production systems**: Major platforms including Meta, OpenAI, and Microsoft have begun embedding watermarks in AI-generated content, but the specific techniques used are proprietary and their robustness properties are not publicly documented.

The undetectable watermarking approach offers a theoretically grounded alternative that could raise the bar for the entire field — providing a watermarking standard that is not just empirically effective but provably secure against detection.

---

## Conclusion

Gunn, Zhao, and Song's undetectable watermark for generative image models represents a landmark contribution at the intersection of cryptography, steganography, and generative AI. By constructing a watermarking scheme that is provably indistinguishable from the model's natural output distribution, the work eliminates the statistical fingerprint that has plagued all previous watermarking approaches and that adversaries have exploited for watermark removal.

The practical implications are significant: a watermarking system that an adversary cannot even detect, let alone remove, raises the bar for content attribution in an era where AI-generated images are increasingly indistinguishable from photographs. While challenges remain in computational efficiency, key management, and extension to other modalities, the theoretical foundation laid by this work provides a principled path toward robust, provably secure content provenance for generative AI.

As generative models continue to improve in fidelity and accessibility, the need for reliable content attribution mechanisms will only grow. Undetectable watermarking offers a glimpse of what such a mechanism could look like — one where the very existence of the attribution signal is hidden from those who would seek to remove it, while remaining accessible to those who need to verify it.

## References

- Gunn, S., Zhao, X., & Song, D. "An Undetectable Watermark for Generative Image Models." *Proceedings of the International Conference on Learning Representations (ICLR)*, 2025. [arXiv:2410.07369](https://arxiv.org/abs/2410.07369)
- Kirchenbauer, J., Geiping, J., Wen, Y., Katz, J., Mowers, J., & Goldblum, M. "A Watermark for Large Language Models." *Proceedings of ICML*, 2023.
- Hopper, N. J., Langford, J., & von Ahn, L. "Provably Secure Steganography." *Proceedings of CRYPTO*, 2002.
- Fernandez, P., Chaffin, A., Tit, K., Chassagnole, C., & Furon, T. "Tree-Ring Watermarks: Fingerprints for Diffusion Images that are Invisible and Robust." *Proceedings of ICML*, 2023.
- Bui, T. Y., Agarwal, S., Yu, N., & Collomosse, J. "RoSteALS: Robust Steganography using Autoencoder Latent Space." *Proceedings of CVPR*, 2023.
