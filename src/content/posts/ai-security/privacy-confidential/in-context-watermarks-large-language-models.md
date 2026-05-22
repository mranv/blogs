---
author: Anubhav Gain
pubDatetime: 2026-05-22T14:30:00+05:30
modDatetime: 2026-05-22T14:30:00+05:30
title: "In-Context Watermarks: A New Approach to LLM Content Attribution"
slug: in-context-watermarks-large-language-models
featured: false
draft: false
tags:
  - ai-security
  - watermarking
  - llm
  - iclr
  - content-attribution
category: AI Research
description: Exploring in-context watermarking techniques that embed detectable signals in LLM outputs without degrading generation quality.
---

## The Growing Need for LLM Content Attribution

As large language models generate an ever-increasing share of the text we encounter online—from news articles and social media posts to code, legal documents, and academic papers—the ability to distinguish AI-generated content from human-written content has become a pressing societal concern. Content attribution is not merely an academic exercise; it touches on issues of misinformation, academic integrity, copyright, accountability, and trust in digital communication.

The concept of watermarking LLM outputs has emerged as one of the most promising approaches to content attribution. The idea is elegant: during the text generation process, the model embeds a subtle statistical signal into its outputs that is imperceptible to human readers but detectable by an algorithm that knows what to look for. This signal can identify not just that the text was AI-generated, but potentially which specific model, organization, or even user session produced it.

However, existing watermarking approaches face significant challenges. Many require modifying the model's training or inference procedure, which limits their applicability to models where the deployer cooperates with watermarking. Others degrade generation quality, introduce detectable artifacts, or can be removed through simple transformations like paraphrasing.

At ICLR 2026, Yepeng Liu and colleagues present **"In-Context Watermarks for Large Language Models,"** a novel approach that rethinks how watermarks can be embedded in LLM outputs. Their method leverages the in-context learning capabilities of modern LLMs to create watermarks that are more robust, more flexible, and easier to deploy than previous techniques.

## Background: The Watermarking Landscape

To appreciate the contribution of in-context watermarks, it helps to understand the existing approaches and their limitations.

### Logit-Based Watermarking

The most widely studied approach, introduced by Kirchenbauer et al. (2023), modifies the model's token sampling process. During generation, the vocabulary is partitioned into "green" and "red" lists based on a secret key, and the model is biased toward selecting green tokens. The resulting text has a detectable over-representation of green tokens that a detector with the same key can identify.

**Limitations**: Logit-based watermarks require access to the model's token probabilities at inference time. They cannot be applied to models accessed through APIs that only return generated text. They can also be partially removed through token substitution or paraphrasing, and the quality degradation—while small—can be measurable on certain benchmarks.

### Training-Time Watermarking

Some approaches embed watermarks during the model's training or fine-tuning process, creating a model whose outputs inherently carry a signature. This can be more robust than inference-time modifications but requires control over the training pipeline.

**Limitations**: Training-time watermarks are impractical for most deployers who use pre-trained models. They also create a permanent commitment to watermarking that cannot be easily disabled or updated.

### Post-Hoc Watermarking

Post-hoc approaches attempt to add watermarks to already-generated text, typically through a secondary model that modifies the text while preserving its meaning.

**Limitations**: Post-hoc watermarking is inherently limited because it cannot modify the statistical properties of the original generation process. The modifications are often detectable as artifacts and can be removed by reverting the changes.

### Semantic Watermarking

More recent approaches embed watermarks in the semantic structure of the generated text rather than in individual token statistics. These can be more robust to paraphrasing because the semantic content is preserved even when surface forms change.

**Limitations**: Semantic watermarks are harder to implement and detect reliably, and the semantic signal may be weaker than token-level signals.

## The In-Context Watermark Approach

Liu et al.'s approach is fundamentally different from all of the above. Instead of modifying the model's parameters, training data, or token sampling process, they use **in-context learning** to instruct the model to generate text that naturally contains a watermark.

The key insight is that modern LLMs are remarkably good at following instructions provided in their context window. If you include instructions that guide the model to generate text with certain statistical properties—properties that encode a watermark—the model will often comply, embedding the watermark as part of its normal generation process.

### How It Works

The in-context watermarking process works as follows:

1. **Watermark Instruction Generation**: A watermark instruction is created that describes the desired statistical properties of the output. This instruction is designed to be followed by the LLM during generation.

2. **Context Construction**: The watermark instruction is placed in the model's context window alongside the user's actual prompt. The instruction might specify, for example, that the model should prefer certain word choices, sentence structures, or stylistic patterns that encode the watermark signal.

3. **Normal Generation**: The model generates its response normally, but influenced by the watermark instruction in its context. The generated text contains the watermark as a natural consequence of following the instruction.

4. **Detection**: A detector that knows the watermark instruction can analyze the generated text for the specified statistical patterns and determine whether the watermark is present.

This approach has several distinctive properties that set it apart from previous methods.

### Key Advantages

**No Model Modification Required**: In-context watermarks do not require any changes to the model's weights, training data, or inference procedure. They work with any sufficiently capable LLM that can follow complex instructions. This is a crucial advantage because it means watermarking can be applied even to models accessed through standard APIs.

**Deployer Control**: The entity deploying the LLM (or even a downstream application using an LLM API) can control the watermark without needing cooperation from the model developer. This democratizes watermarking by removing the requirement that model creators build watermarking into their models.

**Flexibility and Composability**: Because the watermark is encoded in the context instruction, it can be easily changed, updated, or customized. Different users, sessions, or applications can use different watermark instructions, enabling fine-grained attribution. Multiple watermarks can potentially be composed for different purposes.

**Quality Preservation**: The authors demonstrate that well-designed in-context watermarks have minimal impact on generation quality. Because the model is generating text that naturally follows the instructed patterns, the output reads naturally and maintains the coherence, informativeness, and style expected by users.

**Robustness**: In-context watermarks can be designed to encode signals in patterns that survive paraphrasing, translation, and other text transformations. Because the watermark is embedded in higher-level textual properties rather than individual token choices, it is inherently more robust than token-level approaches.

## Technical Deep Dive

### Watermark Instruction Design

The design of the watermark instruction is critical to the method's effectiveness. The authors explore several strategies:

**Lexical Preference Instructions**: These instruct the model to prefer or avoid certain words or phrases. For example, the instruction might specify that the model should prefer words starting with certain letters or containing certain substrings. The resulting statistical bias is detectable by analysing the frequency of the specified patterns.

**Syntactic Pattern Instructions**: These guide the model to use certain sentence structures or grammatical patterns. For example, the instruction might encourage the use of passive voice, specific clause orderings, or particular punctuation patterns. These patterns are detectable through syntactic analysis.

**Stylistic Instructions**: These influence the writing style in ways that encode the watermark. For example, the instruction might specify a slightly more formal tone, longer sentences, or more frequent use of certain transition phrases. The resulting stylistic signature is detectable by comparing the generated text's style features against a baseline.

**Semantic Pattern Instructions**: These are the most sophisticated, guiding the model to structure its arguments or present information in ways that encode a signal. For example, the model might be instructed to always present examples before definitions, or to use specific metaphorical patterns.

The authors find that a combination of multiple instruction types provides the best tradeoff between detectability and quality preservation. A watermark that relies on a single pattern is easier to detect but also easier to remove; a watermark distributed across multiple textual properties is more robust.

### Detection Mechanism

The detection mechanism for in-context watermarks analyses the generated text for the statistical patterns specified in the watermark instruction. The detector computes a statistical test that measures how strongly the expected patterns are present in the text.

The detection process involves:

1. **Feature Extraction**: Extracting the relevant textual features (lexical, syntactic, stylistic, or semantic) from the candidate text.
2. **Statistical Testing**: Computing a test statistic that measures the degree to which the extracted features match the expected watermark pattern.
3. **Threshold Comparison**: Comparing the test statistic against a threshold to determine whether the watermark is present.
4. **Confidence Estimation**: Providing a confidence score that reflects the strength of the detection.

The authors show that their detection mechanism achieves high true positive rates while maintaining low false positive rates on human-written text and on text generated without the watermark instruction.

### Robustness Analysis

A critical question for any watermarking scheme is its robustness against attacks designed to remove the watermark. The authors evaluate robustness against several attack strategies:

**Paraphrasing**: Using another LLM to rewrite the watermarked text while preserving its meaning. In-context watermarks that encode signals in semantic patterns show significant robustness to paraphrasing, as the paraphrased text tends to preserve the instructed semantic structures.

**Translation**: Translating the watermarked text to another language and back. Cross-lingual robustness depends on the watermark type; semantic and stylistic patterns survive better than lexical patterns.

**Token Substitution**: Replacing individual tokens with synonyms or alternative expressions. In-context watermarks that distribute the signal across multiple textual properties are naturally resistant to localized token substitution.

**Text Manipulation**: Inserting, deleting, or rearranging sentences and paragraphs. The authors show that their watermarks are robust to moderate amounts of text manipulation, though extreme manipulation can degrade detection.

**Adversarial Attacks**: An adversary who knows the watermarking scheme but not the specific instruction attempting to remove the watermark. The authors analyse the difficulty of adversarial removal and show that it requires significant effort and text modification that degrades quality.

## Experimental Results

The authors conduct extensive experiments to validate their approach:

### Detection Effectiveness

Across multiple models (ranging from 7B to 70B parameters) and multiple text domains (creative writing, technical explanation, code documentation, and general knowledge), in-context watermarks achieve detection accuracies of 95% or higher with false positive rates below 1%. This is competitive with the best logit-based watermarking approaches and superior to most post-hoc methods.

### Quality Impact

The impact on generation quality is measured across multiple dimensions:

- **Perplexity**: The change in perplexity of watermarked text compared to unwatermarked text is negligible in most settings.
- **Human Evaluation**: Human evaluators cannot reliably distinguish watermarked from unwatermarked text, confirming that the watermark is imperceptible.
- **Benchmark Performance**: Watermarked text performs comparably to unwatermarked text on downstream task benchmarks, indicating that the watermark does not degrade the text's utility.

### Robustness Results

The robustness evaluation shows that in-context watermarks maintain detectability after:

- Paraphrasing with strong paraphrase models (detection rate above 80%)
- Round-trip translation through one intermediate language (detection rate above 70%)
- Random token substitution at moderate rates (detection rate above 85%)
- Sentence-level reordering (detection rate above 90%)

These robustness figures are significantly better than those achieved by most existing watermarking approaches under comparable attack conditions.

### Cross-Model Transfer

An interesting finding is that watermark instructions designed for one model often transfer to other models with similar capabilities. This suggests that in-context watermarks exploit general instruction-following capabilities rather than model-specific quirks, enhancing their practical applicability.

## Practical Applications

The in-context watermarking approach enables several practical applications that were difficult or impossible with previous methods:

### API-Level Watermarking

Service providers who wrap LLM APIs with additional functionality can inject watermark instructions without needing access to the underlying model. This means that even companies using third-party LLM APIs can watermark the content they serve to their users.

### Multi-Tier Attribution

Different watermark instructions can be assigned to different users, sessions, or content categories. This enables a hierarchical attribution system where, for example, all content from a particular service carries a service-level watermark, and content from individual users within that service carries additional user-level watermarks.

### Compliance and Regulation

As governments begin to regulate AI-generated content—such as the EU AI Act's requirements for labelling AI-generated text—in-context watermarks provide a practical mechanism for compliance that does not require model developers to modify their products.

### Forensic Analysis

In cases where AI-generated content is used for misinformation, fraud, or other harmful purposes, in-context watermarks can provide forensic evidence of the content's origin, potentially identifying the specific model, service, or user that generated it.

## Implications for AI Security

In-context watermarks have significant implications for the broader AI security landscape:

### Misinformation Detection

As AI-generated misinformation becomes more sophisticated and prevalent, watermarking provides a potential tool for automated detection at scale. In-context watermarks, because they do not require model modification, could be adopted by a wider range of service providers, creating broader coverage.

### Intellectual Property Protection

For organizations deploying LLMs, watermarking provides a mechanism to track how their generated content is used and redistributed. This is relevant for copyright enforcement and for detecting unauthorized use of proprietary models.

### Accountability and Transparency

Watermarking supports accountability by creating an auditable trail of AI-generated content. This is important for transparency in journalism, education, and other domains where the provenance of information matters.

### Adversarial Considerations

The existence of robust watermarking creates an adversarial dynamic: those who wish to pass off AI-generated content as human-written have an incentive to develop watermark removal tools. The robustness of in-context watermarks against such attacks is an ongoing concern, and the authors note that watermarking should be viewed as one layer in a multi-layered attribution strategy rather than a complete solution.

## Limitations and Open Questions

The authors acknowledge several limitations:

- **Instruction-Following Variability**: Not all models follow watermark instructions equally well. Smaller or less capable models may not reliably embed the watermark, reducing detection effectiveness.
- **Context Window Consumption**: Watermark instructions consume tokens from the model's context window, reducing the space available for the actual user prompt. For applications with tight context constraints, this overhead may be significant.
- **Adaptive Adversaries**: An adversary who understands the in-context watermarking approach might be able to craft countermeasures, such as post-processing that specifically targets the likely watermark patterns.
- **Scalability of Unique Watermarks**: Assigning unique watermarks to individual users or sessions requires managing a large number of distinct instructions, which may present logistical challenges at scale.

Open questions include:

- How can in-context watermarks be made more robust against informed adversaries?
- Can the approach be extended to multimodal outputs (images, audio) generated by LLM-based systems?
- What are the optimal watermark instruction designs for different text domains and model architectures?
- How should watermarking standards be established and enforced across the industry?

## Connection to the Broader Watermarking Ecosystem

In-context watermarks do not exist in isolation—they are part of a broader ecosystem of content attribution technologies. The authors position their work as complementary to, rather than a replacement for, existing approaches:

- **Logit-based watermarks** may remain the best option for model developers who control the inference pipeline.
- **In-context watermarks** fill a critical gap for deployers who use third-party models and cannot modify the inference process.
- **Detection-based approaches** (classifiers that distinguish AI-generated from human-written text) provide a backstop when watermarking is absent or has been removed.
- **Metadata-based approaches** (embedding attribution in document metadata or provenance records) provide complementary information at a different layer.

A comprehensive content attribution strategy will likely combine multiple approaches, with in-context watermarking serving as a flexible and deployable option for many scenarios.

## Conclusion

"In-Context Watermarks for Large Language Models" presents a creative and practical advance in LLM content attribution. By leveraging the instruction-following capabilities of modern LLMs, the approach circumvents many of the limitations that have constrained previous watermarking methods—most notably, the requirement to modify the model's training or inference process.

The results demonstrate that in-context watermarks can achieve high detection rates, maintain generation quality, and resist common removal attacks. While no watermarking scheme is perfectly robust, in-context watermarks represent a valuable addition to the attribution toolkit, particularly for the large and growing number of organizations that deploy LLMs through APIs without controlling the underlying model.

As AI-generated content becomes ever more prevalent and the stakes of attribution grow, innovations like in-context watermarking will play an increasingly important role in maintaining transparency, accountability, and trust in the information ecosystem. The work by Liu et al. provides both a practical tool and a conceptual framework for thinking about how watermarking can adapt to the evolving landscape of large language models.

---

*This post discusses research presented at ICLR 2026. The original paper is by Yepeng Liu and colleagues and is available at [ICLR Virtual 2026](https://iclr.cc/virtual/2026/poster/10008261).*
