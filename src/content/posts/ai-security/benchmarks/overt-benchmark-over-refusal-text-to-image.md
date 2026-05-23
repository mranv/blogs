---
author: Anubhav Gain
pubDatetime: 2026-05-21T13:14:00+05:30
modDatetime: 2026-05-21T13:14:00+05:30
title: "OVERT: Benchmarking Over-Refusal in Text-to-Image Generation Models"
slug: overt-benchmark-over-refusal-text-to-image
featured: false
draft: false
tags:
  - ai-security
  - over-refusal
  - text-to-image
  - neurips
  - benchmarking
category: AI Research
description: Examining the OVERT benchmark that measures excessive refusal in text-to-image models, revealing how safety filters may be overly restrictive.
---

# OVERT: Benchmarking Over-Refusal in Text-to-Image Generation Models

Text-to-image generation models have become one of the most visible and widely deployed applications of generative AI. Systems like DALL·E, Stable Diffusion, Midjourney, and Imagen can produce stunning visual content from natural language prompts, democratizing creative expression in unprecedented ways. But as these models have been made available to the public, their developers have implemented increasingly aggressive safety filters to prevent the generation of harmful content — violence, explicit material, depictions of real people in compromising situations, and more.

These safety measures are necessary and important. But what happens when they go too far? When does a reasonable safety guardrail become an unreasonable barrier to legitimate creative expression? At NeurIPS 2025, Ziheng Cheng and collaborators introduced **OVERT**, a benchmark specifically designed to measure and evaluate the phenomenon of *over-refusal* in text-to-image generation models. Their work reveals that the problem is far more pervasive — and more nuanced — than many in the field had assumed.

## Understanding Over-Refusal in Text-to-Image Models

Over-refusal occurs when a model declines to generate content that is entirely benign and appropriate. It is the collateral damage of safety filtering — the false positives in a system designed to catch harmful content. In the context of text-to-image generation, over-refusal manifests when a user submits a perfectly reasonable prompt and receives either a blank output, an error message, or a sanitized substitute that bears little resemblance to what was requested.

### Why Over-Refusal Matters

The impulse to err on the side of caution in safety filtering is understandable. The consequences of under-filtering — generating violent, explicit, or otherwise harmful imagery — are severe, including reputational damage, legal liability, and genuine harm to individuals and communities. But over-refusal carries its own significant costs:

**User Frustration and Abandonment**: When users repeatedly encounter refusal for benign requests, they become frustrated with the tool and may abandon it entirely. This is particularly problematic for professional users — designers, artists, marketers — who rely on these tools for their work.

**Erosion of Trust**: Paradoxically, over-aggressive safety filtering can undermine trust in AI systems. When users observe that a model refuses obviously benign requests, they may begin to question the competence of the system more broadly, including its ability to appropriately handle genuinely harmful requests.

**Creative Chilling Effect**: Over-refusal can narrow the range of creative expression available to users, effectively imposing a conservative bias on what kinds of images can be generated. This is especially concerning when the refusal patterns reflect cultural biases or overly narrow definitions of what constitutes acceptable content.

**Competitive Dynamics**: In a competitive market, models that over-refuse may lose users to less restrictive alternatives — including those with genuinely inadequate safety measures. This creates a perverse incentive structure where over-refusal by responsible providers can actually drive users toward less safe alternatives.

**Disproportionate Impact on Marginalized Communities**: Over-refusal often disproportionately affects prompts related to marginalized communities. For example, safety filters have been documented to refuse prompts containing terms related to certain ethnic groups, gender identities, or cultural practices — even when the requested content is entirely positive and celebratory. This creates a form of representational harm where the very communities most in need of positive visibility are the ones most affected by over-filtering.

## The OVERT Benchmark: Design and Methodology

OVERT (Over-refusal Evaluation) provides the first systematic, comprehensive benchmark for measuring over-refusal in text-to-image generation models. The benchmark is designed to capture the full spectrum of over-refusal phenomena, from obvious false positives to more subtle cases where the model technically complies but produces a heavily sanitized output.

### Benchmark Construction

The OVERT benchmark is constructed around a carefully curated taxonomy of potentially sensitive but ultimately benign prompt categories. The key insight is that over-refusal does not occur uniformly — it clusters around specific semantic categories that touch on sensitive themes without crossing into genuinely harmful territory.

The benchmark includes the following major categories:

**Medical and Anatomical Content**: Prompts requesting anatomical diagrams, medical illustrations, surgical procedures, and health-related imagery. These prompts are scientifically legitimate but may trigger filters trained to detect nudity or explicit content. Examples include requests for anatomical heart diagrams, skin condition illustrations, and physical therapy exercise demonstrations.

**Cultural and Religious Imagery**: Prompts requesting depictions of cultural practices, religious ceremonies, traditional clothing, and cultural artifacts. These prompts are culturally enriching but may trigger filters trained to detect content associated with specific ethnic or religious groups. Examples include requests for traditional ceremonial dress, religious festival scenes, and cultural dance performances.

**Historical and Educational Content**: Prompts requesting historically significant but potentially disturbing imagery — battle scenes, historical protests, disaster aftermath — for educational purposes. These prompts have clear educational value but may trigger violence or disturbing content filters.

**Everyday Scenarios with Sensitive Keywords**: Prompts that describe entirely mundane scenarios but include keywords that safety filters associate with harmful content. For example, a prompt like "a child playing in a bathtub" or "a woman breastfeeding" describes completely normal, healthy activities but may trigger child safety or nudity filters.

**Artistic and Creative Expression**: Prompts requesting artistic styles and subjects that push creative boundaries without being harmful — figure drawing poses, classical art references, avant-garde fashion, and abstract human forms.

**Political and Social Commentary**: Prompts requesting imagery related to political protest, social movements, and current events. These prompts represent important forms of expression but may trigger filters designed to detect misinformation or controversial content.

### Evaluation Metrics

OVERT introduces several metrics for quantifying over-refusal:

**Over-Refusal Rate (ORR)**: The primary metric, measuring the percentage of benign prompts that are incorrectly refused. This is calculated separately for each category and aggregated across the full benchmark. A model's ORR provides a straightforward measure of how aggressively it filters benign content.

**Severity-Weighted Over-Refusal Score (SWORS)**: A more nuanced metric that weights over-refusal instances by their severity. A complete refusal (no output generated) is weighted more heavily than a partial refusal (sanitized or altered output). This captures the intuition that some forms of over-refusal are more harmful to the user experience than others.

**Category Disparity Index (CDI)**: Measures the variation in over-refusal rates across categories. A high CDI indicates that the model's over-refusal is unevenly distributed, disproportionately affecting certain types of content. This metric is particularly important for identifying biases in safety filtering.

**False Refusal Confidence Score (FRCS)**: For models that provide confidence scores or probability estimates alongside their filtering decisions, this metric measures the model's confidence when it incorrectly refuses a benign prompt. High confidence in incorrect refusals suggests a more deeply rooted filtering bias that may be harder to correct.

### Evaluation Protocol

The OVERT evaluation protocol is designed for rigor and reproducibility:

1. **Prompt Standardization**: All prompts are standardized for length, specificity, and language register to minimize variance from prompt engineering effects. Each category includes multiple prompt variants to ensure that results are not driven by idiosyncratic features of individual prompts.

2. **Multiple Trials**: Each prompt is evaluated multiple times to account for stochastic variation in model outputs. This is particularly important for models with non-deterministic generation processes.

3. **Human Annotation**: A team of trained annotators reviews each model output to determine whether it constitutes a genuine refusal, a partial compliance, or full compliance. The annotation protocol includes detailed guidelines for borderline cases.

4. **Cross-Model Comparison**: The same evaluation protocol is applied uniformly across all evaluated models, enabling meaningful cross-model comparison of over-refusal rates.

## Key Findings

The OVERT evaluation reveals several striking findings about the state of over-refusal in current text-to-image generation models.

### Over-Refusal is Widespread and Significant

Across all evaluated models, over-refusal rates are substantially higher than expected. Even the best-performing models refuse a meaningful fraction of benign prompts, and the worst-performing models refuse a surprisingly large proportion. This finding challenges the assumption that safety filtering is well-calibrated in current systems.

### Category-Specific Patterns

Over-refusal is not uniformly distributed across categories. Some categories — particularly those involving medical content, cultural imagery related to non-Western traditions, and prompts containing keywords associated with children — exhibit dramatically higher over-refusal rates. This clustering suggests that safety filters are reacting to specific lexical and semantic triggers rather than genuinely assessing the harmfulness of the requested content.

### The Keyword Sensitivity Problem

One of the most concerning findings is the degree to which over-refusal is driven by individual keyword triggers rather than holistic prompt understanding. A prompt containing the word "blood" in a medical context (e.g., "diagram of blood circulation") is often refused at similar rates to genuinely violent prompts containing the same word. This suggests that many safety filters operate at a superficial keyword-matching level rather than understanding the semantic context of the prompt.

### Cross-Model Variation

Different models exhibit very different over-refusal profiles. Some models are highly restrictive in specific categories but permissive in others, while others show more uniform (but still problematic) over-refusal patterns. Interestingly, there is no clear correlation between a model's over-refusal rate and its effectiveness at blocking genuinely harmful content. This finding is particularly important because it suggests that reducing over-refusal does not necessarily require compromising on safety.

### The Sanitization Problem

Beyond outright refusal, the OVERT benchmark identifies a significant problem with output sanitization — cases where the model technically complies with a request but produces a heavily sanitized version that removes key elements of the prompt. For example, a request for a medical illustration might produce a fully clothed figure where an anatomical diagram was expected, or a request for a cultural ceremony might produce a generic, de-contextualized scene. This "soft refusal" is harder to detect but equally harmful to the user experience.

### Disproportionate Impact on Underrepresented Cultures

Perhaps the most socially significant finding is that prompts related to non-Western cultures, languages, and traditions experience substantially higher over-refusal rates than equivalent prompts about Western culture. A prompt requesting imagery of a traditional Japanese onsen (hot spring bath) might be refused while a prompt requesting a Western spa scene is generated without issue. This disparity reflects biases in both the training data used to develop safety filters and the cultural assumptions embedded in the filtering criteria.

## Methodological Innovations

OVERT introduces several methodological innovations that advance the field of safety evaluation:

### The Benign-Sensitive Distinction

The benchmark makes a careful distinction between prompts that are genuinely benign (universally acceptable) and those that are sensitive but legitimate (acceptable in context but touching on themes that could be harmful in other contexts). This distinction is crucial for evaluating whether safety filters can exercise contextual judgment rather than applying blanket rules.

### Multi-Granularity Evaluation

OVERT evaluates over-refusal at multiple levels of granularity — from individual keyword triggers to full prompt semantics. This multi-granularity approach reveals where in the processing pipeline over-refusal decisions are being made and helps identify the specific components of the safety system that need improvement.

### Cross-Lingual Evaluation

The benchmark includes prompts in multiple languages, revealing that over-refusal rates vary significantly across languages. This is an important finding because it suggests that safety filters may be primarily optimized for English-language inputs and less effective (in both directions) for other languages.

## Implications for Model Developers

The OVERT benchmark has several practical implications for developers of text-to-image generation models:

### Context-Aware Safety Filtering

The findings strongly motivate the development of context-aware safety filters that consider the full semantic context of a prompt rather than relying on keyword matching. Advances in large language models make it increasingly feasible to build safety systems that understand the difference between "blood" in a medical context and "blood" in a violent context.

### Calibration of Safety Thresholds

Model developers need to invest in careful calibration of safety thresholds, ensuring that the trade-off between under-filtering and over-filtering is appropriately balanced. The OVERT benchmark provides a concrete framework for measuring and optimizing this trade-off.

### Inclusive Safety Criteria

Safety filtering criteria must be developed with input from diverse cultural perspectives to avoid the systematic over-refusal of content related to non-Western cultures and marginalized communities. This requires not only diverse training data but also diverse teams involved in defining what constitutes harmful content.

### Transparent Reporting

Model developers should routinely evaluate and report over-refusal metrics alongside safety metrics. Current practice focuses almost exclusively on what models successfully block; OVERT demonstrates that understanding what models incorrectly block is equally important.

## Broader Implications for AI Safety

The OVERT benchmark raises important questions about the broader trajectory of AI safety:

### The Safety-Utility Trade-off

OVERT provides concrete evidence that the safety-utility trade-off in generative AI is real and significant. Improving safety does not come for free — it often imposes costs on legitimate users. The challenge for the field is to develop safety mechanisms that minimize these costs while maintaining effective protection against genuinely harmful content.

### Evaluation-Centered Safety Development

The benchmark illustrates the value of developing specific, targeted evaluation tools for different aspects of AI safety. Just as benchmarks like MMLU and HumanEval have driven progress in model capability, OVERT has the potential to drive progress in calibrating safety systems. Without such benchmarks, safety improvements are guided primarily by anecdotal evidence and worst-case analysis, both of which can lead to over-correction.

### The Over-Refusal Red Teaming Paradigm

OVERT suggests a complementary approach to traditional red teaming. While conventional red teaming focuses on finding ways to make models produce harmful content (testing the false negative rate of safety systems), over-refusal red teaming focuses on finding cases where safety systems incorrectly block benign content (testing the false positive rate). Both perspectives are essential for building well-calibrated safety systems.

### Regulatory Implications

As AI safety regulations develop worldwide, the OVERT benchmark highlights the importance of measuring both under-filtering and over-filtering. Regulations that focus exclusively on preventing harm without considering the costs of over-refusal may inadvertently incentivize the development of overly restrictive systems that frustrate users and limit beneficial applications.

## Limitations and Future Work

The OVERT benchmark, like any evaluation tool, has limitations that are important to acknowledge:

### Cultural Relativity of Benign Content

What constitutes "benign" content is, to some extent, culturally relative. A prompt that is considered entirely appropriate in one cultural context may be considered sensitive in another. The benchmark's categorization of prompts as benign reflects a particular set of cultural assumptions, and expanding the cultural diversity of the benchmark is an important direction for future work.

### Evolving Standards

The boundary between acceptable and unacceptable content evolves over time as social norms shift. A benchmark that accurately captures current standards of over-refusal may become outdated as those standards change. Regular updates to the benchmark will be necessary to maintain its relevance.

### Coverage Limitations

Despite its comprehensiveness, OVERT cannot cover every possible category of benign-but-sensitive content. There are undoubtedly categories of over-refusal that the benchmark does not capture, and future work should focus on expanding coverage.

### The Multimodal Frontier

As text-to-image models evolve into more general multimodal systems (accepting image inputs, generating video, etc.), the over-refusal problem will become more complex. Future benchmarks will need to evaluate over-refusal in these richer settings, where the interaction between input and output modalities creates new opportunities for both appropriate filtering and over-refusal.

## Conclusion

The OVERT benchmark represents a significant contribution to the AI safety evaluation landscape. By systematically measuring and categorizing over-refusal in text-to-image generation models, it brings empirical rigor to a problem that has been widely discussed anecdotally but poorly quantified. The findings are sobering: over-refusal is widespread, unevenly distributed, and often disproportionately affects marginalized communities and non-Western cultural content.

But the benchmark also offers cause for optimism. By demonstrating that over-refusal and safety are not tightly coupled — that some models achieve better safety with less over-refusal — OVERT suggests that the field can develop safety systems that are both effective and well-calibrated. The key is moving from keyword-based filtering to context-aware safety, from one-size-fits-all thresholds to nuanced, category-specific calibration, and from monocultural safety criteria to inclusive, globally informed standards.

As text-to-image generation models become increasingly embedded in creative workflows, educational tools, and commercial applications, the cost of over-refusal will only grow. The OVERT benchmark provides the measurement infrastructure needed to address this challenge — and in doing so, helps ensure that safety and usefulness advance together rather than in opposition.

## References

- Cheng, Z., et al. "OVERT: A Benchmark for Over-Refusal Evaluation on Text-to-Image Models." *Proceedings of the Neural Information Processing Systems (NeurIPS)*, 2025. [NeurIPS Poster](https://neurips.cc/virtual/2025/poster/121840)
- Schramowski, P., et al. "Large Pre-trained Language Models Contain Human-like Biases of Self-Reported Personality Traits." *Proceedings of AAAI*, 2023.
- Nichol, A., et al. "GLIDE: Towards Photorealistic Image Generation and Editing with Text-Guided Diffusion Models." *Proceedings of ICML*, 2022.
- Ramesh, A., et al. "Hierarchical Text-Conditional Image Generation with CLIP Latents." *arXiv preprint*, 2022.
- Rombach, R., et al. "High-Resolution Image Synthesis with Latent Diffusion Models." *Proceedings of CVPR*, 2022.
