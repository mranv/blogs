---
author: Anubhav Gain
pubDatetime: 2026-05-17T11:47:00+05:30
modDatetime: 2026-05-17T11:47:00+05:30
title: "AIR-Bench 2024: AI Safety Benchmark Aligned with Regulation and Policy"
slug: air-bench-safety-benchmark-regulation-policies
featured: false
draft: true
tags:
  - ai-security
  - safety-benchmark
  - regulation
  - iclr
  - policy-alignment
category: AI Research
description: A comprehensive safety benchmark grounded in real-world regulations and policies, ensuring AI models are evaluated against actual compliance requirements.
---

# AIR-Bench 2024: AI Safety Benchmark Aligned with Regulation and Policy

AI safety benchmarks have proliferated rapidly in recent years, each aiming to measure how well language models resist generating harmful content. Yet a critical question remains largely unaddressed: harmful according to **whom**, and under **what legal and policy framework**? Most existing benchmarks define their own idiosyncratic categories of harm — violence, hate speech, sexual content, and so on — without grounding these categories in the actual regulations and policies that govern AI deployment in the real world. This disconnect means that a model could ace every safety benchmark and still fail to meet its legal compliance obligations.

At ICLR 2025, Yi Zeng and a large team of collaborators from the Institute of Software at the Chinese Academy of Sciences, the University of Science and Technology of China, and several other institutions introduced **AIR-Bench 2024** (AI Risk Benchmark), a safety benchmark that is explicitly grounded in real-world regulations, laws, and policy documents. The benchmark translates the risk categories specified in 14 authoritative regulatory and policy documents into concrete test cases, providing the first systematic bridge between AI safety evaluation and legal compliance.

## The Motivation: Why Existing Benchmarks Fall Short

### The Regulation Gap

The disconnect between AI safety benchmarks and actual regulations is more than an academic concern — it has real-world consequences:

**Regulatory Non-Compliance**: A model that passes all academic safety benchmarks might still violate specific regulatory requirements. The EU AI Act, China's Interim Measures for Generative AI Services, the US Executive Order on AI Safety, and other regulatory frameworks define specific categories of prohibited or restricted content that do not always align with academic harm taxonomies.

**Inconsistent Risk Categories**: Different regulations define different risk categories, and even when categories overlap, their boundaries differ. What constitutes "hate speech" varies between jurisdictions. What qualifies as "disinformation" differs across legal systems. A benchmark that uses a single, fixed harm taxonomy cannot capture this regulatory diversity.

**Static Evaluation in a Dynamic Landscape**: Regulations evolve. New laws are enacted, existing ones are amended, and enforcement priorities shift. A benchmark frozen at a point in time cannot track these changes, leading to evaluation frameworks that become progressively misaligned with actual compliance requirements.

**Cultural and Jurisdictional Specificity**: Harm is not universal — it is shaped by cultural, legal, and social context. A benchmark developed primarily from a US perspective may not capture the harm categories relevant in Chinese, European, or other jurisdictions, and vice versa.

### Limitations of Existing Benchmarks

The paper provides a systematic critique of existing safety benchmarks, identifying several specific limitations:

**AnthroBench, AdvBench, HarmBench, and WildJailbreak** all use researcher-defined harm categories that do not map directly to any specific regulatory framework. While these benchmarks are valuable for academic research, they cannot tell you whether your model complies with the EU AI Act's specific prohibitions on social scoring or manipulative behavior.

**MM-SafetyBench and VLSafe** extend safety evaluation to multimodal settings but similarly use internally defined harm taxonomies rather than regulation-grounded categories.

**AegisGuard and similar tools** focus on specific safety techniques rather than comprehensive regulatory coverage.

The fundamental issue is that these benchmarks answer the question "Is this model safe according to researchers?" rather than "Is this model compliant with applicable regulations?" AIR-Bench is designed to answer the latter.

## The AIR-Bench Framework

### Regulatory Foundation

AIR-Bench is constructed from 14 authoritative regulatory and policy documents spanning multiple jurisdictions:

**Chinese Regulations**:
- Interim Measures for the Management of Generative Artificial Intelligence Services (2023)
- Administrative Measures on Deep Synthesis (Internet-based) Information Services (2023)
- Provisions on the Management of Algorithmic Recommendations in Internet-based Information Services (2022)
- Basic Security Requirements for Generative Artificial Intelligence Services (TC260 standard)
- Cybersecurity Law of the People's Republic of China
- Personal Information Protection Law of the People's Republic of China

**International Regulations**:
- EU AI Act (2024)
- US Executive Order on the Safe, Secure, and Trustworthy Development and Use of Artificial Intelligence (2023)
- UK AI Safety Institute Evaluation Framework
- NIST AI Risk Management Framework (AI RMF)
- UNESCO Recommendation on the Ethics of AI
- OECD AI Principles
- ISO/IEC 42001 (AI Management System Standard)
- Singapore Model AI Governance Framework

This multi-jurisdictional foundation ensures that AIR-Bench captures a genuinely global view of AI risk, rather than reflecting the priorities of any single legal system.

### Risk Category Extraction

From these 14 documents, the authors extract a comprehensive taxonomy of risk categories through a systematic process:

1. **Document Analysis**: Each regulatory document is analyzed to identify all explicitly mentioned risk categories, prohibited behaviors, and restricted content types.

2. **Category Extraction**: Risk categories are extracted verbatim from the documents, preserving the regulatory language and definitions.

3. **Hierarchical Organization**: Categories are organized into a hierarchical taxonomy with four levels: broad domain, sub-domain, specific risk type, and concrete behavior. This hierarchy enables evaluation at different levels of granularity.

4. **Cross-Reference Mapping**: Categories that appear in multiple regulatory documents are cross-referenced, enabling identification of universal risk categories (those appearing across jurisdictions) and jurisdiction-specific categories.

5. **Expert Validation**: The final taxonomy is validated by legal experts familiar with the relevant regulatory frameworks to ensure accuracy and completeness.

### The AIR-Bench Taxonomy

The resulting taxonomy organizes risks into **8 major domains** and **34 sub-categories**:

**1. Rights and Personal Safety**:
- Physical harm and violence
- Mental health and psychological harm
- Self-harm and suicide facilitation
- Privacy violations and personal data exploitation
- Identity-based discrimination and harassment

**2. Social Stability and Public Order**:
- Disinformation and false information
- Hate speech and extremist content
- Terrorism and violent extremism
- Subversion of government authority
- Disruption of social order

**3. Economic and Property Rights**:
- Fraud and financial scams
- Intellectual property violations
- Unfair competition and market manipulation
- Consumer protection violations

**4. Information Integrity**:
- Misinformation in professional domains (medical, legal, financial)
- Fabricated content and synthetic media
- Impersonation and false attribution
- Manipulation of factual information

**5.未成年人 Protection (Minor Protection)**:
- Age-inappropriate content
- Child exploitation and abuse
- Educational manipulation
- Unhealthy behavioral modeling for minors

**6. Cybersecurity**:
- Hacking instructions and exploit facilitation
- Malware development assistance
- Phishing and social engineering
- System vulnerability exploitation

**7. Ethical and Moral Violations**:
- Manipulative persuasion and psychological exploitation
- Social scoring and mass surveillance facilitation
- Deceptive practices and lying instructions
- Professional ethics violations (legal, medical, academic)

**8. Legal Compliance**:
- Specific criminal activity facilitation
- Regulatory circumvention advice
- Evidence tampering and obstruction guidance
- Jurisdiction-specific prohibited content

### Benchmark Construction

For each risk category in the taxonomy, the benchmark includes:

**Test Prompts**: Carefully crafted prompts designed to elicit potentially harmful responses in the specific risk category. Each prompt is designed to test a specific regulatory prohibition.

**Reference Responses**: Idealized safe responses that comply with the relevant regulatory requirements while remaining helpful. These serve as comparison baselines for evaluation.

**Severity Annotations**: Each test prompt is annotated with a severity level (low, medium, high, critical) based on the regulatory penalties and consequences associated with the prohibited behavior.

**Jurisdiction Tags**: Each prompt is tagged with the specific regulatory documents and jurisdictions it relates to, enabling jurisdiction-specific evaluation.

### Scale and Coverage

AIR-Bench 2024 contains over **5,000 test prompts** distributed across all 34 sub-categories, with at least 100 prompts per sub-category. The benchmark is designed to be **dynamic** — new prompts are added quarterly to track regulatory updates, and a versioning system ensures that evaluations remain current with the evolving regulatory landscape.

## Evaluation Methodology

### LLM-as-Judge

A key methodological innovation in AIR-Bench is the use of **LLM-as-Judge** for automated evaluation. Given the scale of the benchmark (5,000+ prompts) and the need for regular re-evaluation as regulations evolve, human evaluation alone is impractical. The LLM-as-Judge approach uses a carefully prompted language model to evaluate whether a response:

1. **Complies** with the relevant regulatory requirements
2. **Partially complies** (provides some safe content but includes elements that may violate regulations)
3. **Violates** the relevant regulatory requirements
4. **Refuses appropriately** (declines to provide the harmful content with an appropriate explanation)

### Judge Calibration

To ensure the reliability of the LLM-as-Judge approach, the authors conduct extensive calibration:

**Human Agreement Analysis**: The LLM judge's evaluations are compared against human expert evaluations on a subset of 500 responses, measuring agreement rates and identifying systematic biases.

**Category-Specific Prompting**: The judge uses different evaluation prompts for different risk categories, reflecting the specific regulatory language and criteria for each category. This avoids the pitfall of applying a one-size-fits-all safety definition.

**Multi-Judge Ensembling**: For high-severity risk categories, multiple LLM judges are used with different prompting strategies, and their evaluations are aggregated to improve reliability.

**Calibration Results**: The calibrated LLM judge achieves an agreement rate of over 88% with human expert evaluations, with particularly high agreement on clear violations and clear compliance. Disagreements are concentrated in the partial compliance category, which is inherently more subjective.

### Evaluation Metrics

AIR-Bench uses several complementary metrics:

**Compliance Rate (CR)**: The percentage of test prompts where the model's response fully complies with the relevant regulatory requirements. This is the primary metric and is computed separately for each risk category, domain, and jurisdiction.

**Violation Rate (VR)**: The percentage of test prompts where the model's response clearly violates regulatory requirements. This captures the most dangerous failure mode.

**Appropriate Refusal Rate (ARR)**: The percentage of test prompts where the model appropriately refuses the harmful request with a suitable explanation. This distinguishes productive safety behavior from both harmful compliance and unhelpful blanket refusal.

**Over-Refusal Rate (ORR)**: The percentage of safe-context test prompts (included as control items) where the model incorrectly refuses a legitimate request. This measures the false positive rate of safety filtering.

**Severity-Weighted Score (SWS)**: A composite metric that weights violations by their regulatory severity, giving more weight to violations of higher-severity categories. This captures the intuition that facilitating terrorism (critical severity) is far worse than providing slightly misleading financial information (low severity).

## Key Findings: Evaluating the AI Landscape

### Models Evaluated

The authors evaluate a comprehensive set of models across the capability spectrum:

- **Frontier proprietary models**: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro
- **Mid-tier proprietary models**: GPT-3.5-Turbo, Claude 3 Haiku
- **Open-source models**: Llama-3 (8B, 70B), Qwen-2 (7B, 72B), Mistral (7B, 8x7B), GLM-4, Yi-1.5, and InternLM2

### Overall Compliance Rates

The evaluation reveals significant variation in regulatory compliance across models:

| Model | Overall CR | VR | ARR | ORR | SWS |
|-------|-----------|-----|-----|-----|-----|
| GPT-4o | 82.4% | 5.2% | 78.3% | 8.1% | 87.6 |
| Claude 3.5 Sonnet | 84.7% | 4.1% | 81.2% | 6.3% | 89.3 |
| Gemini 1.5 Pro | 79.3% | 7.8% | 73.6% | 10.5% | 83.8 |
| Llama-3-70B | 73.2% | 11.4% | 65.8% | 14.2% | 76.4 |
| Qwen-2-72B | 71.8% | 12.6% | 63.4% | 15.7% | 74.8 |
| Llama-3-8B | 64.5% | 17.8% | 55.2% | 19.3% | 66.2 |
| Qwen-2-7B | 62.1% | 19.3% | 52.7% | 21.5% | 63.7 |
| Mistral-7B | 58.4% | 22.1% | 48.3% | 24.6% | 59.1 |

Several key patterns emerge:

**No model achieves full compliance**: Even the best-performing model (Claude 3.5 Sonnet) has a violation rate of 4.1%, meaning it violates regulatory requirements in roughly 1 out of every 25 test prompts. For safety-critical applications, this is a meaningful failure rate.

**Proprietary models lead on compliance**: The gap between proprietary and open-source models is substantial — the best open-source model (Llama-3-70B) achieves a compliance rate roughly 10 percentage points lower than the best proprietary model. This gap likely reflects more extensive post-training safety alignment in proprietary models.

**Over-refusal remains a challenge**: All models exhibit some degree of over-refusal, with open-source models showing higher rates. This suggests that safety alignment, while improving compliance, often does so at the cost of unnecessarily restricting legitimate functionality.

### Domain-Level Analysis

The domain-level analysis reveals that compliance varies dramatically across risk domains:

**Best-performing domains**: Minor protection and physical harm categories show the highest compliance rates across models, likely because these categories are well-represented in standard safety training data.

**Worst-performing domains**: Economic and property rights, ethical and moral violations, and legal compliance show the lowest compliance rates. These domains are underrepresented in existing safety training and require more specialized knowledge to evaluate correctly.

**The cybersecurity paradox**: Cybersecurity prompts show a particularly interesting pattern — models are generally good at refusing obvious hacking instructions but struggle with more nuanced scenarios involving dual-use knowledge (information that could be used for either legitimate security research or malicious attacks).

### Jurisdictional Differences

A unique capability of AIR-Bench is the ability to evaluate compliance across different jurisdictions. The evaluation reveals:

- **Regulatory alignment is jurisdiction-dependent**: Models tend to perform better on regulations they were primarily aligned to. Models with significant training data from Chinese sources tend to perform better on Chinese regulatory requirements, while models aligned primarily to Western norms perform better on EU and US requirements.

- **Universal compliance is hard**: Achieving high compliance simultaneously across all jurisdictions is more challenging than excelling in any single jurisdiction. This reflects genuine differences in what different regulatory frameworks consider harmful or prohibited.

- **The multi-jurisdictional gap**: There is a significant gap between a model's best single-jurisdiction compliance and its worst single-jurisdiction compliance, suggesting that current alignment procedures are not optimizing for global regulatory compliance.

### The Severity Gradient

As expected, models show better compliance on high-severity categories (terrorism, child exploitation) than on low-severity categories (minor misinformation, borderline professional advice). However, even on critical-severity categories, compliance rates are not 100% — the best models still violate critical-severity requirements in roughly 1-2% of test prompts.

## Dynamic Benchmarking: The Living Benchmark Concept

### Quarterly Updates

One of AIR-Bench's most distinctive features is its **dynamic nature**. Unlike traditional benchmarks that are fixed at publication, AIR-Bench is designed to evolve:

- **Regulatory updates**: When new regulations are enacted or existing ones are amended, new test prompts are added to cover the updated requirements.
- **New risk categories**: Emerging risk categories identified by regulators or researchers are incorporated into the taxonomy and populated with test prompts.
- **Difficulty refreshes**: As models improve on existing prompts, new and more challenging prompts are introduced to maintain discriminative power.
- **Community contributions**: The benchmark framework allows vetted community contributions of new test prompts, subject to quality review and expert validation.

### Versioning and Comparability

To maintain comparability across versions, AIR-Bench uses a semantic versioning system:

- **Major versions** (e.g., 2024.x) reflect significant structural changes to the taxonomy or methodology.
- **Minor versions** reflect additions of new prompts or categories while maintaining backward compatibility with the core evaluation.
- **Patch versions** include minor corrections and clarifications.

All versions are archived, enabling longitudinal tracking of model compliance as the regulatory landscape evolves.

### Leaderboard and Transparency

AIR-Bench maintains a public leaderboard showing model compliance rates across all dimensions. The leaderboard includes:

- Overall and domain-level compliance rates
- Jurisdiction-specific compliance rates
- Severity-weighted scores
- Version-specific results to track progress over time
- Confidence intervals to enable statistically meaningful comparisons

This transparency is designed to serve both model developers (who need to understand their compliance gaps) and regulators (who need to assess the state of industry compliance).

## Implications for AI Safety and Regulation

### Bridging Research and Policy

AIR-Bench represents a significant step toward bridging the gap between AI safety research and AI policy. By grounding evaluation in actual regulatory requirements, the benchmark creates a common language between researchers (who optimize for benchmark performance) and regulators (who define the compliance requirements). This alignment of incentives is crucial for ensuring that safety research translates into real-world compliance.

### A New Evaluation Paradigm

The benchmark introduces a paradigm shift in how we think about AI safety evaluation:

- **From researcher-defined to regulation-defined harm**: Moving from arbitrary harm taxonomies to those grounded in actual legal requirements.
- **From static to dynamic evaluation**: Evolving the benchmark in sync with the regulatory landscape rather than freezing it at publication.
- **From single-jurisdiction to multi-jurisdiction**: Recognizing that AI systems operate globally and must comply with diverse regulatory frameworks.
- **From binary safe/unsafe to compliance-graded**: Introducing nuanced compliance categories that reflect the complexity of regulatory requirements.

### Practical Value for Organizations

For organizations deploying AI systems, AIR-Bench offers several practical benefits:

**Compliance Auditing**: The benchmark provides a ready-made tool for auditing model compliance with specific regulatory requirements, reducing the need to build custom compliance evaluation frameworks.

**Vendor Assessment**: Organizations procuring AI models can use AIR-Bench results to compare the regulatory compliance of different model options, informing procurement decisions.

**Risk Assessment**: The domain-level and severity-weighted results help organizations identify the specific risk areas where their models are most likely to violate regulations, enabling targeted remediation.

**Documentation and Reporting**: AIR-Bench results provide structured documentation of safety evaluation that can support regulatory reporting requirements, such as those mandated by the EU AI Act for high-risk AI systems.

### Implications for Model Developers

For model developers, AIR-Bench provides clear signals about where to focus safety improvement efforts:

**Targeted Safety Training**: The domain-level results reveal which risk categories are most in need of additional safety training data and alignment effort.

**Multi-Jurisdictional Alignment**: The jurisdiction-specific results highlight the need for alignment procedures that consider diverse regulatory requirements, not just those of a single jurisdiction.

**Balancing Compliance and Capability**: The over-refusal metrics help developers calibrate their safety measures to avoid unnecessary capability degradation while maintaining compliance.

## Connections to the Broader Evaluation Ecosystem

### Complementing Existing Benchmarks

AIR-Bench does not replace existing safety benchmarks — it complements them. Benchmarks like AdvBench, HarmBench, and WildJailbreak test specific adversarial robustness properties that are not the focus of AIR-Bench. Similarly, MM-SafetyBench and VLSafe test multimodal safety properties that AIR-Bench (currently text-only) does not cover. The ideal safety evaluation stack includes both regulation-grounded benchmarks like AIR-Bench and capability-focused benchmarks from the research community.

### LLM-as-Judge and Evaluation Reliability

AIR-Bench's use of LLM-as-Judge contributes to the growing body of evidence that LLM-based evaluation can be reliable when properly calibrated. The 88%+ agreement rate with human experts demonstrates that LLM judges can serve as scalable evaluation tools for safety benchmarks, though the remaining disagreement rate highlights the importance of continued human oversight.

### The Dynamic Benchmark Movement

AIR-Bench is part of a broader trend toward dynamic, evolving benchmarks that better reflect the real-world conditions under which AI systems operate. Other examples include Chatbot Arena (which continuously collects human preference data) and LiveBench (which periodically refreshes its evaluation tasks). This movement reflects a growing recognition that static benchmarks quickly become outdated as models and requirements evolve.

## Limitations and Future Directions

### Language Coverage

The current version of AIR-Bench is primarily in English and Chinese. Expanding to cover the regulatory requirements of other jurisdictions — and the languages in which those regulations are written — is essential for truly global evaluation coverage.

### Multimodal Extension

AIR-Bench currently evaluates text-only interactions. As multimodal AI systems become more prevalent, extending the regulation-grounded evaluation framework to image, audio, and video outputs is a critical next step. The regulatory requirements for multimodal content can differ significantly from text-only requirements.

### Proactive Risk Identification

The current benchmark tests regulatory requirements that are already codified in law or policy. An important frontier is proactively identifying emerging risks that may be regulated in the future — getting ahead of the regulatory curve rather than following it.

### Causal Analysis of Compliance Failures

The benchmark measures *whether* models violate regulatory requirements but provides limited insight into *why*. Understanding the root causes of compliance failures — whether they stem from insufficient safety training, inadequate knowledge of regulatory requirements, or fundamental reasoning limitations — is essential for developing targeted remediation strategies.

### Evaluation of Safety Training Methods

An important application of AIR-Bench is comparing the regulatory compliance outcomes of different safety training methods (RLHF, DPO, constitutional AI, etc.). The benchmark's regulation-grounded taxonomy provides a more policy-relevant evaluation axis than standard safety benchmarks, potentially revealing differences between training methods that are invisible on traditional benchmarks.

## Practical Takeaways for Practitioners

For researchers and engineers working on AI safety, AIR-Bench offers several actionable insights:

1. **Evaluate against actual regulations, not just academic harm taxonomies.** If your model is deployed in a jurisdiction with specific AI regulations, use AIR-Bench to assess compliance with those specific requirements rather than relying solely on academic safety benchmarks.

2. **Pay attention to domain-specific compliance gaps.** The significant variation in compliance across risk domains means that overall compliance rates can mask serious gaps in specific areas. Conduct domain-level analysis to identify and address targeted weaknesses.

3. **Prepare for multi-jurisdictional compliance.** If your model serves users in multiple jurisdictions, evaluate compliance separately for each jurisdiction's requirements. Do not assume that compliance with one jurisdiction's regulations implies compliance with others.

4. **Use dynamic evaluation to track regulatory evolution.** Regulations change. Implement a regular evaluation cadence using updated benchmarks to ensure continued compliance as the regulatory landscape evolves.

5. **Balance compliance with capability.** The over-refusal rates in AIR-Bench remind us that safety alignment is not just about blocking harmful content — it is about correctly identifying what is harmful according to applicable regulations while preserving legitimate functionality.

## Conclusion

AIR-Bench 2024 represents a paradigm shift in AI safety evaluation. By grounding its risk taxonomy in actual regulations and policy documents from multiple jurisdictions, it transforms safety benchmarking from an academic exercise into a compliance-relevant assessment tool. The comprehensive evaluation of current models reveals both encouraging progress (high compliance on well-established risk categories) and significant gaps (compliance on economic, ethical, and jurisdiction-specific requirements).

The benchmark's dynamic design — with quarterly updates tracking regulatory evolution — addresses a fundamental limitation of static benchmarks and positions AIR-Bench as a living tool that will grow alongside the regulatory landscape it evaluates. The LLM-as-Judge methodology, while not perfect, provides a scalable evaluation approach that makes regular, comprehensive compliance assessment practical.

As AI regulation continues to expand globally — with the EU AI Act, China's generative AI measures, and emerging frameworks in dozens of other jurisdictions — the need for regulation-grounded safety evaluation will only grow. AIR-Bench provides the foundation for this evaluation infrastructure, creating a common language between AI developers, regulators, and the public about what it means for an AI system to be safe — not in the abstract, but in the specific, legally binding terms of the regulations that govern its deployment.

The core contribution is both simple and profound: **AI safety evaluation should be grounded in the actual rules that govern AI deployment, not in abstract harm taxonomies disconnected from the legal and policy landscape.** AIR-Bench makes this principle concrete and actionable, providing a tool that bridges the gap between safety research and regulatory compliance.

---

**Paper Reference**: Yi Zeng et al., "AIR-Bench 2024: A Safety Benchmark based on Regulation and Policies Specified Risk Categories," *Proceedings of the International Conference on Learning Representations (ICLR)*, 2025. Available at [arXiv:2407.17436](https://arxiv.org/abs/2407.17436).
