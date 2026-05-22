---
author: Anubhav Gain
pubDatetime: 2026-05-20T17:12:00+05:30
modDatetime: 2026-05-20T17:12:00+05:30
title: "Why LLMs Hallucinate: Connecting the Dots with Subsequence Associations"
slug: llm-hallucination-subsequence-associations
featured: false
draft: true
tags:
  - ai-security
  - hallucination
  - llm-reliability
  - neurips
  - interpretability
category: AI Research
description: Uncovering the mechanistic basis of LLM hallucinations through subsequence association analysis and what it means for building more reliable models.
---

# Why LLMs Hallucinate: Connecting the Dots with Subsequence Associations

Hallucination — the confident generation of false or unsubstantiated information — remains one of the most persistent and consequential problems in large language models. Despite years of research and incremental improvements, even the most capable frontier models continue to fabricate facts, invent citations, and assert falsehoods with unwavering confidence. The problem is not merely that models make errors; it is that they make errors they "believe" to be true, offering no signal to the user that the information is unreliable.

The persistence of hallucination has led to a growing recognition that surface-level mitigation strategies — better prompting, retrieval augmentation, post-hoc fact-checking — are necessary but insufficient. What is needed is a deeper mechanistic understanding of *why* models hallucinate. What goes wrong inside the model's internal computation that leads it to generate confident falsehoods? Can we identify the specific computational pathways that produce hallucination, and can we intervene on those pathways to reduce it?

At NeurIPS 2025, Yiyou Sun and collaborators introduced a groundbreaking approach to this question with their work on **subsequence associations** — a framework for understanding hallucination as a mechanistic phenomenon rooted in how language models process and associate subsequences of tokens during generation. Their work provides some of the most compelling evidence to date that hallucination is not a monolithic failure but a family of distinct computational failures, each with its own mechanistic signature and potential mitigation strategy.

## The Hallucination Problem: State of Play

Before diving into the specifics of the subsequence association framework, it is worth establishing what we know about hallucination and why it has proven so resistant to mitigation.

### The Scale of the Problem

Hallucination rates in large language models, while improving, remain significant. Depending on the domain, task, and evaluation methodology, studies have documented hallucination rates ranging from 3% to over 30% for factual questions, with rates substantially higher for tasks requiring precise recall of specific details (dates, names, statistics, citations). In specialized domains like medicine and law, where factual accuracy is critical, hallucination remains a primary barrier to deployment.

### Why Hallucination is Hard

Several properties of hallucination make it particularly challenging to address:

**Confident Fabrication**: Models do not typically hedge or express uncertainty when hallucinating. The generated text reads with the same fluency and confidence as factually accurate output, providing no surface-level signal of unreliability. This distinguishes hallucination from simple errors — it is an error wrapped in the appearance of correctness.

**Context Sensitivity**: The same model may hallucinate on one phrasing of a question while answering correctly when the question is rephrased. This context sensitivity makes hallucination difficult to predict and even more difficult to systematically prevent.

**Knowledge Confusion**: Many hallucinations involve a mixture of accurate and fabricated information — a real person's name paired with a fabricated biography, or a real institution placed in a fictional event. This interleaving of truth and falsehood makes hallucination harder to detect than outright fabrication.

**Training Data Effects**: Models are trained on vast datasets that contain both accurate and inaccurate information, and the training process does not perfectly distinguish between them. The model's internal representation of "knowledge" is a statistical amalgam that can produce confident outputs even when the underlying training signal was ambiguous or contradictory.

### Existing Approaches and Their Limitations

Current approaches to hallucination mitigation fall into several categories:

**Retrieval-Augmented Generation (RAG)**: Providing the model with relevant documents at inference time to ground its responses. While effective for many use cases, RAG does not address the underlying tendency to hallucinate — it simply provides external context that may constrain the model's output. When the retrieved context is insufficient or the model misinterprets it, hallucination still occurs.

**Self-Consistency Checking**: Generating multiple responses and checking for consistency. Inconsistent responses are flagged as potentially hallucinated. This approach is computationally expensive and catches only a subset of hallucinations — those that are inconsistent across multiple samples. Systematic hallucinations (where the model consistently generates the same false information) evade this approach entirely.

**Confidence Calibration**: Training models to better express uncertainty, using techniques like temperature scaling, conformal prediction, or explicit "I don't know" training. While promising, confidence calibration is limited by the model's ability to assess its own knowledge — a fundamentally circular problem.

**Post-Hoc Fact-Checking**: Using external tools to verify model outputs after generation. This is effective when reliable verification sources exist but cannot cover the full range of model outputs, particularly for novel claims or specialized domains.

What all of these approaches share is a focus on detecting or mitigating hallucination *after* or *around* the generation process, rather than addressing the internal computational mechanisms that produce it. This is where the subsequence association framework makes its contribution.

## The Subsequence Association Framework

The key insight of Sun et al.'s work is that hallucination in language models can be understood through the lens of *subsequence associations* — the patterns of co-occurrence and dependency between subsequences of tokens that the model has learned from its training data and that it uses to generate text.

### What Are Subsequence Associations?

When a language model generates text, it does so token by token, with each token's probability distribution conditioned on all preceding tokens. But the relationships that drive generation are not merely between adjacent tokens — they extend across subsequences of varying lengths. A subsequence association is a learned statistical relationship between a source subsequence (a sequence of tokens that appears earlier in the generation) and a target subsequence (a sequence of tokens that is generated later).

For example, if a training corpus frequently contains the subsequence "Albert Einstein developed the theory of" followed by "general relativity in 1915," the model learns an association between these two subsequences. When the source subsequence appears in generation, the associated target subsequence becomes more probable.

### When Associations Go Wrong

Subsequence associations are the fundamental mechanism by which language models generate coherent text — they are not inherently problematic. Hallucination occurs when these associations produce incorrect or unsubstantiated information. The framework identifies several distinct ways this can happen:

**Spurious Associations**: The model has learned an association between subsequences that frequently co-occur in training data but do not reflect a genuine factual relationship. For example, if a person's name frequently appears near the name of an institution in training data (because they serve on its board), the model may associate that person with working at the institution, generating a false biographical claim.

**Cross-Contamination Associations**: The model combines subsequences from different factual contexts to produce a novel but false combination. For example, correctly associating "Einstein" with "Nobel Prize" and correctly associating "Nobel Prize" with "for the discovery of the photoelectric effect" but incorrectly combining these to claim that Einstein won the Nobel Prize for general relativity.

**Overgeneralization Associations**: The model generalizes a subsequence association beyond its valid scope. If the model has learned that scientists at certain institutions typically have PhDs from prestigious universities, it may associate a specific scientist with a specific PhD-granting institution even when no such relationship exists.

**Temporal Confusion Associations**: The model associates subsequences that are temporally valid in the training data but no longer true, or combines temporally disjoint facts into a single claim. This is particularly problematic for time-sensitive information like leadership positions, organizational structures, and current events.

**Frequency-Driven Hallucination**: The model generates subsequences that are statistically frequent in the training distribution regardless of their factual accuracy in the current context. High-frequency subsequences have elevated probability, and this frequency effect can override the model's "knowledge" of specific facts.

### Formal Framework

The paper formalizes subsequence associations through a rigorous mathematical framework:

**Association Strength**: For a given source subsequence *s* and target subsequence *t*, the association strength is defined as the degree to which the presence of *s* in the context increases the probability of *t* being generated, relative to the marginal probability of *t*. This captures the statistical dependency between subsequences.

**Association Context Window**: The framework defines the context window within which associations operate — how many tokens back does the model "look" when applying an association? The analysis reveals that associations operate at multiple scales simultaneously, from local bigram-level associations to long-range dependencies spanning hundreds of tokens.

**Association Competition**: When multiple associations are simultaneously active (as is always the case in practice), they compete to influence the generation. The model's output at any point reflects the aggregate influence of all active associations. Hallucination can result from the wrong association "winning" this competition.

**Association Interference**: Associations can interfere with each other — a strong but incorrect association can suppress a weaker but correct one. This interference mechanism is particularly important for understanding why models sometimes generate confident falsehoods even when they "know" the correct answer (as evidenced by different prompting strategies eliciting the correct response).

## Methodology: Probing Subsequence Associations

The paper develops a sophisticated methodology for probing subsequence associations in large language models:

### Causal Tracing

Using techniques inspired by mechanistic interpretability, the authors trace the causal influence of specific subsequences on model outputs. By intervening on the model's internal activations at specific layers and positions, they can determine which source subsequences are most influential in driving a particular generation.

### Association Extraction

The framework extracts associations from the model's internal representations using a combination of attention pattern analysis, activation patching, and probing classifiers. This allows the researchers to identify the specific associations that are active during a particular generation and assess their contribution to the output.

### Hallucination Correlation Analysis

By comparing the association profiles of hallucinated outputs versus accurate outputs on the same factual questions, the researchers identify the association patterns that are most predictive of hallucination. This correlation analysis reveals the "signatures" of different types of hallucination.

### Intervention Experiments

The most compelling evidence comes from intervention experiments where specific associations are amplified or suppressed in the model's internal computation. If the framework correctly identifies the associations responsible for hallucination, then suppressing those associations should reduce hallucination rates — and this is exactly what the experiments demonstrate.

## Key Findings

The subsequence association analysis produces several important findings:

### Hallucination is Not Random

A key finding is that hallucination is far from random. Specific factual queries consistently trigger specific types of hallucination, and these patterns are predictable based on the subsequence associations active in the model. This predictability is encouraging because it suggests that targeted interventions can address specific hallucination patterns.

### The Multi-Association Conflict

Many hallucinations arise from conflicts between multiple valid associations. The model has learned genuine statistical regularities from training data, but these regularities can conflict when applied to specific queries. For example, the model may have one association linking a person to a field of study and another linking that person to a different field (based on different training contexts). When asked about the person's primary field, the model must resolve this conflict, and hallucination occurs when it resolves it incorrectly.

### Long-Range Associations Drive Complex Hallucinations

While many simple hallucinations are driven by local (short-range) associations, the most insidious and hard-to-detect hallucinations are driven by long-range associations that span substantial portions of the generation. These long-range associations are more difficult to identify and intervene on, explaining why some hallucinations are resistant to simple mitigation strategies.

### Training Data Composition Effects

The analysis reveals clear links between training data composition and hallucination patterns. Information that appears in diverse, consistent contexts in the training data tends to be recalled accurately, while information that appears in limited or contradictory contexts is more prone to hallucination. This suggests that data curation for factual consistency could reduce hallucination at the source.

### The Confidence-Hallucination Disconnect

Perhaps the most concerning finding is the dissociation between model confidence and accuracy. The subsequence association analysis shows that hallucinated outputs often have *stronger* association support than accurate outputs — the model is more "confident" in its hallucinations because the incorrect associations are stronger than the correct ones. This explains why confidence-based hallucination detection is unreliable and why models express high confidence in false claims.

### Layer-Specific Association Effects

Different layers of the transformer model are responsible for different types of associations. Lower layers tend to capture surface-level statistical associations (bigram patterns, common phrases), while higher layers capture more semantic associations (factual relationships, logical dependencies). Hallucinations driven by lower-layer associations tend to be more stereotyped and predictable, while those driven by higher-layer associations are more semantically sophisticated and harder to detect.

## Implications for Hallucination Mitigation

The subsequence association framework suggests several novel approaches to hallucination mitigation:

### Targeted Association Suppression

If specific associations can be identified as sources of hallucination, they can potentially be suppressed through targeted interventions on the model's internal representations. This could be implemented through techniques like activation steering, where the model's activations are nudged away from hallucination-associated patterns during generation.

### Training Data Refinement

The link between training data composition and hallucination patterns suggests that more careful curation of training data — reducing contradictory contexts for factual information and increasing diverse, consistent presentations of important facts — could reduce hallucination at its source.

### Association-Aware Architecture Design

Future model architectures could be designed with explicit mechanisms for managing association conflicts — for example, incorporating uncertainty signals that are activated when multiple conflicting associations are simultaneously strong.

### Real-Time Hallucination Detection

The association signatures identified by the framework could be used to develop real-time hallucination detection systems that monitor a model's internal computation during generation and flag outputs that exhibit hallucination-associated patterns.

### Calibration Through Association Analysis

Rather than relying on output-level confidence scores, more reliable calibration could be achieved by analyzing the association profile underlying a particular generation — outputs supported by strong, unconflicted associations could be presented with high confidence, while those reflecting association conflicts could be flagged as uncertain.

## Practical Applications

The subsequence association framework has practical implications beyond academic research:

### For Model Developers

Understanding the association mechanisms underlying hallucination enables more targeted development of safety and alignment techniques. Rather than treating hallucination as a monolithic problem, developers can address specific types of hallucination through specific interventions.

### For RAG System Design

The framework suggests that retrieval-augmented generation systems should be designed to provide context that specifically reinforces correct associations and resolves potential association conflicts. This is more nuanced than simply providing relevant documents — it requires understanding which associations are active and which might lead to hallucination.

### For Deployment Risk Assessment

The predictability of hallucination patterns based on association analysis enables more informed deployment risk assessment. Applications that involve queries likely to trigger specific types of association conflicts can be identified and given additional safeguards.

### For Content Verification

The association signatures of hallucination could be used as features in content verification systems, helping to identify which specific claims in a generated text are most likely to be hallucinated and therefore most in need of verification.

## Limitations and Open Questions

The subsequence association framework, while powerful, leaves several important questions open:

### Scalability of Association Extraction

Extracting and analyzing subsequence associations is computationally expensive. The methodology works well for targeted analysis of specific hallucination cases, but scaling it to comprehensive analysis of all model outputs remains a challenge.

### Association Dynamics Across Model Sizes

The paper primarily analyzes associations in models of a specific scale. It remains unclear how association patterns change as models scale up — do larger models develop more complex association structures, or do they simply have more associations of the same types?

### The Role of Instruction Tuning

Instruction-tuned and RLHF-trained models may exhibit different association patterns than base models. Understanding how alignment training affects subsequence associations — and whether it introduces new types of hallucination-prone associations — is an important open question.

### Cross-Lingual Associations

The analysis focuses primarily on English-language models. Whether the same association mechanisms drive hallucination in multilingual models, and whether cross-lingual associations create unique hallucination patterns, is not yet well understood.

### Ground Truth for Association Analysis

Evaluating whether an identified association is "correct" or "incorrect" requires access to ground truth, which is not always available for complex factual claims. The framework is most effective in domains where factual accuracy can be verified against reliable knowledge bases.

## The Road Ahead: From Understanding to Control

The subsequence association framework represents a significant advance in our understanding of why language models hallucinate. By moving beyond surface-level descriptions of hallucination to mechanistic explanations rooted in the model's internal computation, it opens the door to more effective and targeted mitigation strategies.

The work also exemplifies a broader trend in AI safety research: the shift from treating safety problems as behavioral issues (what the model does wrong) to treating them as mechanistic issues (why the model does wrong things). This mechanistic perspective is essential for developing interventions that address the root causes of safety failures rather than just their symptoms.

Looking ahead, several exciting research directions emerge from this work:

**Dynamic Association Monitoring**: Developing systems that can monitor subsequence associations in real-time during generation, flagging potential hallucinations before they are output.

**Association Editing**: Developing techniques for surgically editing specific associations in a trained model — removing spurious associations while preserving correct ones — without requiring full retraining.

**Association-Aware Training**: Incorporating the subsequence association perspective into the training process itself, explicitly training models to be aware of association conflicts and to handle them appropriately.

**Cross-Model Association Analysis**: Extending the framework to analyze associations across different model architectures and training paradigms, identifying which architectural choices and training strategies lead to more robust association structures.

## Conclusion

Yiyou Sun and collaborators' work on subsequence associations represents a paradigm shift in our understanding of LLM hallucination. By revealing the mechanistic basis of hallucination — the specific patterns of token subsequence association that drive confident false generation — the work transforms hallucination from a mysterious and intractable problem into a comprehensible and potentially addressable one.

The findings are both sobering and encouraging. Sobering because they reveal that hallucination is deeply rooted in the fundamental mechanisms of language model generation — it is not a bug that can be simply patched but a property of how these models process and produce text. Encouraging because the mechanistic understanding provides concrete levers for intervention, and the predictability of hallucination patterns suggests that targeted mitigation is feasible.

As large language models are deployed into increasingly high-stakes applications — healthcare, legal analysis, financial advisory, scientific research — the cost of hallucination grows. The subsequence association framework provides both the understanding needed to assess that cost and the tools needed to reduce it. It is a significant step toward building AI systems that are not just capable but genuinely reliable.

## References

- Sun, Y., et al. "Why and How LLMs Hallucinate: Connecting the Dots with Subsequence Associations." *Proceedings of the Neural Information Processing Systems (NeurIPS)*, 2025. [NeurIPS Poster](https://neurips.cc/virtual/2025/poster/118673)
- Huang, L., et al. "A Survey on Hallucination in Large Language Models: Principles, Taxonomy, Challenges, and Open Questions." *arXiv preprint*, 2023.
- Kadavath, S., et al. "Language Models (Mostly) Know What They Know." *arXiv preprint*, 2022.
- Meng, K., et al. "Locating and Editing Factual Associations in GPT." *Proceedings of NeurIPS*, 2023.
- Wei, J., et al. "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *Proceedings of NeurIPS*, 2022.
- Shuster, K., et al. "Retrieval Augmentation Reduces Hallucination in Conversation." *Findings of EMNLP*, 2021.
