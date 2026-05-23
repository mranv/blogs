---
author: Anubhav Gain
pubDatetime: 2026-05-15T11:52:00+05:30
modDatetime: 2026-05-15T11:52:00+05:30
title: "Deduplicating Training Data Mitigates Privacy Risks in Language Models"
slug: deduplicating-training-data-mitigates-privacy-risks
featured: false
draft: false
tags:
  - ai-security
  - data-deduplication
  - privacy
  - icml
  - memorization
category: AI Research
description: How simply removing duplicate data from training sets significantly reduces the privacy risks of language model memorization.
---

## Table of Contents

## Introduction

Large language models have an uncomfortable habit of regurgitating their training data. From verbatim reproduction of news articles to the leaking of personally identifiable information (PII) like email addresses, phone numbers, and social security numbers, the privacy implications of language model memorization are profound and well-documented. But what if one of the most effective privacy defenses was embarrassingly simple?

The paper **"Deduplicating Training Data Mitigates Privacy Risks in Language Models"** by Nikhil Kandpal, Matthew Jagielski, and Nicolas Carlini, presented at ICML 2022, demonstrates that **removing duplicate (or near-duplicate) sequences from training data dramatically reduces the amount of memorized content that can be extracted from language models**. This finding has major practical implications for anyone training or deploying large language models.

This blog post provides a detailed walkthrough of the paper's methodology, key findings, and implications for the broader AI safety and security community.

## The Memorization Problem

### What Is Memorization?

In the context of language models, memorization refers to the phenomenon where a model reproduces specific sequences from its training data verbatim or near-verbatim when prompted appropriately. This is distinct from generalization—the desirable property where a model learns patterns and rules from data that it can apply to novel inputs.

Carlini et al. (2019) first formalized the study of memorization in neural networks, showing that models can be prompted to emit specific training examples. Subsequent work demonstrated that this memorization is:

- **Extractable**: Adversaries can use prompting strategies to coax memorized content out of the model.
- **Scalable**: Larger models memorize more content, not less, despite their greater capacity for generalization.
- **Privacy-relevant**: Memorized content can include sensitive information like PII, passwords, API keys, and copyrighted material.

### Why Memorization Happens

Language models are trained to predict the next token given a sequence of preceding tokens. When the same sequence appears multiple times in the training corpus, the model receives a disproportionately strong learning signal for that sequence. It becomes highly confident in predicting those tokens, making the sequence easy to extract.

This creates a feedback loop: duplicated sequences are learned more strongly, making them easier to extract, which makes the privacy violation more severe for the individuals whose data appears in those sequences.

### The Scale of the Problem

Modern language models are trained on trillions of tokens scraped from the web. These datasets are rife with duplication:

- **Exact duplicates**: The same document appearing multiple times across different web pages, mirrors, or aggregators.
- **Near-duplicates**: Slightly modified versions of the same document (e.g., with different formatting, minor edits, or appended boilerplate).
- **Template-based duplicates**: Boilerplate text like copyright notices, terms of service, or navigation menus that appear across millions of pages.
- **Data canaries**: Sequences intentionally planted in training data by researchers to measure memorization (e.g., "The secret code is: XJ83K").

Studies of common training corpora like Common Crawl, C4, and The Pile have found that duplicate content can constitute anywhere from 10% to over 50% of the raw corpus, depending on the deduplication threshold used.

## The Key Insight: Duplicates Drive Memorization

The central thesis of Kandpal et al. is both simple and powerful: **the privacy risk of a training example is largely determined by how many times it (or a near-duplicate) appears in the training set**. Examples that appear only once are memorized far less frequently than examples that appear dozens or hundreds of times.

This insight reframes the memorization problem. Instead of asking "does the model memorize this data?" we should ask "how many times does this data appear in the training set?" The answer to the second question is a strong predictor of the answer to the first.

### Intuition

Why does repetition drive memorization? The authors provide several explanations:

1. **Gradient amplification**: Each occurrence of a sequence contributes a gradient update. More occurrences mean stronger gradients, pushing the model to memorize the sequence rather than learn generalizable patterns.
2. **Overfitting to frequent patterns**: Language models are trained to minimize loss across the entire training set. Sequences that appear many times contribute disproportionately to the loss, incentivizing the model to "solve" them by memorization.
3. **Attention to frequency**: Transformer-based models, through their self-attention mechanisms, can develop strong associations between repeated contexts and their completions.

## Methodology

The paper employs a rigorous experimental methodology to establish the causal relationship between duplication and memorization.

### Datasets

The authors use several benchmark datasets:

- **Pile subset**: A curated subset of The Pile, a commonly used language model training dataset containing data from diverse sources including academic papers, code, books, and web text.
- **Custom canary datasets**: Synthetic sequences inserted into the training data at controlled frequencies to precisely measure the relationship between occurrence count and extractability.
- **Natural data with known duplicates**: Real-world data where duplicate counts can be measured precisely.

### Models

The experiments use GPT-2 family models trained from scratch on controlled datasets:

- **GPT-2 Small** (117M parameters)
- **GPT-2 Medium** (345M parameters)
- **GPT-2 XL** (1.5B parameters)

This allows the authors to study how memorization scales with both data duplication and model size.

### Measuring Memorization

The paper uses several metrics to quantify memorization:

- **Extractability**: Whether a specific training sequence can be extracted by prompting the model with a prefix and checking if it generates the exact suffix. This uses the extraction methodology from Carlini et al. (2021).
- **Exposure**: A more refined metric that measures how many guesses an attacker would need to find a memorized secret, using the model's perplexity on candidate completions.
- **Membership inference**: Testing whether an adversary can determine whether a specific example was in the training set, which is a direct privacy metric.

### Experimental Setup

The core experiment is elegantly simple:

1. **Insert canaries**: Plant specific sequences (e.g., "The secret number is 2847365") into the training data at controlled frequencies—once, twice, five times, ten times, fifty times, etc.
2. **Train models**: Train language models on the resulting dataset (with and without deduplication).
3. **Measure extraction**: Attempt to extract the canaries using prefix prompting and beam search.
4. **Compare**: Measure how extraction rates vary with canary frequency and whether deduplication reduces extraction.

## Key Findings

### Finding 1: Memorization Scales with Duplication Count

The paper establishes a clear, quantitative relationship between the number of times a sequence appears in the training data and the likelihood that it can be extracted from the trained model.

- Sequences appearing **once** in the training set are memorized (extractable) only a tiny fraction of the time—typically in the low single-digit percentages.
- Sequences appearing **5-10 times** show a dramatic increase in extractability, often jumping to 20-50%.
- Sequences appearing **50+ times** are nearly always extractable, with extraction rates approaching 100%.

This relationship holds across model sizes, with larger models memorizing more at every duplication level. However, the duplication effect dominates—the difference between "seen once" and "seen 50 times" is far larger than the difference between "small model" and "large model" at the same duplication count.

### Finding 2: Deduplication Dramatically Reduces Extractable Memorization

When the authors apply deduplication to the training data (removing all but one copy of each duplicate or near-duplicate sequence), the amount of extractable memorized content drops precipitously.

In their experiments on The Pile:

- **Before deduplication**: The model had hundreds of extractable sequences, including PII like email addresses and phone numbers.
- **After deduplication**: The number of extractable sequences dropped by an order of magnitude or more, with particularly sharp reductions for PII and sensitive content.

This effect is not subtle—it is one of the largest reductions in memorization achieved by any single intervention, rivaling or exceeding the impact of techniques like differential privacy (without the associated accuracy costs).

### Finding 3: The Effect Is Causal, Not Correlative

By using controlled canary insertions, the authors demonstrate that the relationship between duplication and memorization is **causal**: increasing the number of times a canary appears directly causes it to be more extractable. This rules out confounding explanations (e.g., that duplicated content is inherently "easier" to memorize for some other reason).

### Finding 4: Near-Duplicates Matter Too

The paper goes beyond exact deduplication to examine the impact of **near-duplicates**—sequences that are similar but not identical. Near-duplicates also contribute to memorization, though the effect is weaker than for exact duplicates. This means that deduplication strategies should consider fuzzy matching, not just exact matching, for maximum privacy benefit.

### Finding 5: Deduplication Complements Other Privacy Defenses

The authors show that deduplication is complementary to other privacy-enhancing techniques:

- **Deduplication + Differential Privacy**: Combining deduplication with DP-SGD training provides stronger privacy guarantees than either technique alone. Deduplication reduces the effective "privacy budget" consumed by duplicated examples, allowing DP-SGD to provide tighter guarantees.
- **Deduplication + Min-K% filtering**: Removing sequences where the model assigns unusually low likelihood (a common heuristic for identifying memorized content) is more effective when combined with deduplication.

## Practical Implications

### For Model Developers

The findings have immediate, actionable implications for anyone training language models:

1. **Deduplicate before training**: This should be a standard preprocessing step. Exact deduplication is cheap (using suffix arrays, MinHash, or similar tools) and near-deduplication using techniques like SimHash or document-level Jaccard similarity adds relatively little overhead.
2. **Pay special attention to PII**: Deduplication is particularly effective at reducing memorization of PII, which often appears in duplicated contexts (e.g., email signatures, boilerplate contact information, résumé templates).
3. **Re-evaluate deduplication thresholds**: The choice of similarity threshold for near-deduplication involves a trade-off between privacy and data diversity. The paper suggests that even aggressive deduplication has minimal impact on model quality.
4. **Document deduplication procedures**: Training data cards and model cards should describe what deduplication was performed, including the method, threshold, and estimated impact on data size.

### For the AI Safety Community

The results have broader implications for AI safety:

- **Memorization is not inevitable**: While some degree of memorization is inherent in any model trained on data, the *scale* of memorization is largely a product of data curation choices. Better curation = less memorization.
- **Data quality matters for safety**: This work reinforces the broader theme that data curation is a first-class safety intervention, not just a preprocessing afterthought.
- **Easier than differential privacy**: While differential privacy provides formal guarantees, it comes with significant accuracy costs and implementation complexity. Deduplication is a "quick win" that provides substantial practical privacy benefits with minimal downside.

### For Policymakers and Regulators

The findings suggest that **deduplication should be considered a minimum standard** for responsible model training:

- Regulations requiring data minimization and purpose limitation (like GDPR) could reasonably require deduplication as a basic safeguard against unnecessary memorization.
- Auditing frameworks for AI systems could include checks for memorization of known PII, with deduplication as a recommended mitigation.
- Data protection impact assessments for AI systems should account for duplication levels in training data as a key risk factor.

## Limitations and Caveats

The paper is careful to note several important limitations:

1. **Deduplication is necessary but not sufficient**: Even with perfect deduplication, some memorization still occurs. Sequences that appear only once can still be extracted, especially from larger models. Deduplication should be part of a layered privacy strategy, not the only defense.
2. **The experiments are on GPT-2-scale models**: While the authors expect the findings to scale to larger models, the specific quantitative results (e.g., extraction rates) may differ for models with tens or hundreds of billions of parameters.
3. **Near-deduplication is harder than exact deduplication**: While exact deduplication is straightforward, fuzzy deduplication involves trade-offs in computational cost and aggressiveness. The optimal deduplication strategy for privacy is still an open question.
4. **Definition of "duplicate" matters**: The paper considers sequence-level duplication, but the concept of duplication can be extended to semantic duplication (paraphrases), template-based duplication (boilerplate with different fill-in values), and other forms. Each requires different detection methods.
5. **Training data auditing is difficult**: In practice, many organizations don't have full visibility into the duplication structure of their training data, especially when using third-party datasets or scraping from the web in real-time.

## Connections to Related Work

The paper sits at the intersection of several active research areas:

### Memorization and Extraction

Carlini et al. (2019, 2021, 2023) have built the foundational framework for studying memorization in language models. The deduplication paper builds directly on this work, identifying duplication as the key driver of the memorization that prior work documented.

### Differential Privacy

Abadi et al. (2016) introduced DP-SGD, which provides formal privacy guarantees by clipping gradients and adding noise during training. The deduplication paper shows that deduplication is complementary to DP and should be applied as a preprocessing step even when DP training is used. In fact, deduplication can improve the privacy-utility trade-off of DP training by reducing the "privacy tax" that duplicated examples impose.

### Data Curation

Recent work on data curation for language models—including work on data quality filtering, toxicity removal, and domain balancing—has demonstrated that data curation is one of the most impactful levers for model quality. The deduplication paper adds privacy to the list of benefits that good data curation provides.

### Copyright and Fair Use

The memorization of training data raises significant copyright concerns, as models can reproduce copyrighted text. Deduplication, by reducing memorization, may also mitigate some copyright risks—though the legal landscape remains uncertain.

## A Practical Guide to Deduplication

For practitioners looking to implement deduplication, here is a practical guide informed by the paper's findings:

### Exact Deduplication

- **Document-level**: Remove entire documents that are identical. This is the cheapest form of deduplication and catches the most obvious duplicates.
- **Sequence-level**: Remove duplicate sequences (e.g., at the n-gram level, typically with n between 50 and 300 tokens). This catches duplicated passages within documents and repeated boilerplate.
- **Tools**: Suffix arrays, SHA-256 hashing, and Bloom filters are efficient approaches for exact deduplication at scale.

### Near-Deduplication

- **MinHash with LSH**: The standard approach for scalable near-deduplication. MinHash approximates Jaccard similarity between document shingles, and Locality-Sensitive Hashing (LSH) enables efficient retrieval of near-duplicates.
- **SimHash**: Another LSH-based approach that is efficient for large-scale deduplication.
- **Embedding-based methods**: Using pre-trained sentence or document embeddings to find semantically similar documents. More expensive but captures semantic duplication.
- **Suffix array with edit distance**: For sequence-level near-deduplication, finding sequences that differ by at most *k* edits.

### Recommended Pipeline

1. Start with exact document-level deduplication.
2. Apply exact sequence-level deduplication (e.g., 50-gram matching).
3. Apply near-duplicate detection using MinHash/LSH at the document level.
4. Optionally, apply embedding-based near-deduplication for high-value datasets.
5. Monitor the impact on data size and model quality; adjust thresholds accordingly.

## The Bigger Picture: Data as a Security Surface

The deduplication paper is part of a growing recognition that **the training data pipeline is a critical security surface** for machine learning systems. Just as the Goldblum et al. survey on dataset security highlights poisoning and backdoor risks, Kandpal et al. highlight privacy risks that arise from how data is curated and processed.

Together, these works argue for a fundamental shift in how the ML community thinks about training data:

- **From "more is better" to "better is better"**: Raw data volume matters less than data quality, diversity, and integrity.
- **From passive collection to active curation**: Training data should be actively managed, audited, and curated, not just scraped and dumped into the model.
- **From post-hoc fixes to design-time safeguards**: Privacy and security should be considered during data preparation, not bolted on after the model is trained.

## Conclusion

Kandpal, Jagielski, and Carlini have produced a remarkably impactful paper that identifies one of the simplest and most effective interventions for reducing privacy risks in language models. The message is clear: **if you don't want your language model to memorize and regurgitate sensitive information, start by deduplicating your training data**.

This is not a radical or expensive proposal. Deduplication is a well-understood, scalable preprocessing step that should already be part of any responsible training pipeline. The paper's contribution is to rigorously quantify *how much* deduplication helps—and the answer is "a lot." The privacy benefits are large, the implementation costs are small, and the impact on model quality is minimal.

As the AI community grapples with the societal implications of increasingly powerful models, it is encouraging to find that some of the most effective mitigations are also the most practical. Deduplication won't solve all privacy problems in AI, but it should be the first line of defense.

The full paper is available at [https://arxiv.org/abs/2202.06539](https://arxiv.org/abs/2202.06539) and is essential reading for anyone involved in training or deploying large language models.

## Key Takeaways

- Language models memorize training data, and this memorization is a significant privacy risk—especially when it involves PII, passwords, or other sensitive information.
- The key driver of memorization is **data duplication**: sequences that appear multiple times in training data are far more likely to be memorized and extracted.
- **Deduplicating training data** (removing duplicate and near-duplicate sequences) dramatically reduces the amount of memorized content that can be extracted.
- The relationship between duplication and memorization is causal: controlled experiments show that increasing a sequence's occurrence count directly increases its extractability.
- Deduplication is cheap, scalable, and complementary to other privacy defenses like differential privacy.
- It should be a standard preprocessing step for any responsible language model training pipeline.
- Deduplication is necessary but not sufficient—some memorization occurs even for unique sequences, so it should be combined with other privacy safeguards.
