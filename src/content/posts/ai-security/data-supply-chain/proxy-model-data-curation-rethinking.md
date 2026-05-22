---
author: Anubhav Gain
pubDatetime: 2026-05-21T11:28:00+05:30
modDatetime: 2026-05-21T11:28:00+05:30
title: "Rethinking Proxy-Model Practice: Can Small Training Runs Guide Data Curation?"
slug: proxy-model-data-curation-rethinking
featured: false
draft: true
tags:
  - ai-security
  - data-curation
  - proxy-models
  - iclr
  - training-efficiency
category: AI Research
description: Examining whether small-scale proxy training runs can reliably guide data curation decisions for large language model training.
---

## The Data Curation Bottleneck in LLM Training

Training large language models (LLMs) is an enormously expensive endeavour. A single training run for a frontier model like GPT-4 or Llama 3 can cost millions of dollars in compute, span thousands of GPUs running for weeks, and consume vast quantities of carefully curated training data. Before committing those resources, practitioners need to make critical decisions: which data sources to include, how to weight different domains, what filtering thresholds to apply, and which data mixing strategies will yield the best downstream performance.

The standard practice that has emerged in the industry is surprisingly simple: train a much smaller "proxy" model on the same data, observe which data curation choices lead to better proxy performance, and then extrapolate those findings to the full-scale training run. The intuition is appealing—if a particular data mixture helps a 1-billion-parameter model learn better, it should also help a 100-billion-parameter model. This proxy-model approach has become deeply embedded in the training pipelines of major AI labs, influencing how billions of dollars in compute are allocated.

But is this intuition actually correct?

A compelling paper from Jiachen Wang and colleagues at ICLR 2026, titled **"Can Small Training Runs Reliably Guide Data Curation? Rethinking Proxy-Model Practice,"** systematically investigates this question and arrives at conclusions that should give every AI training team pause. Their findings challenge a foundational assumption in modern LLM development and suggest that the field may need to fundamentally rethink how it approaches data curation.

## Understanding the Proxy-Model Paradigm

To appreciate the significance of this work, it helps to understand exactly how proxy models are used in practice. The typical workflow looks something like this:

1. **Data Source Selection**: A team has dozens of potential data sources—web crawls, books, scientific papers, code repositories, synthetic data, and more. They need to decide which ones to include.

2. **Data Mixing Ratios**: Once sources are selected, the team must decide how to weight them. Should code be 15% of the training data or 30%? Should scientific papers get more weight than general web text?

3. **Filtering Thresholds**: Raw data contains noise, duplicates, low-quality content, and potentially harmful material. Teams set thresholds for perplexity-based filtering, deduplication aggressiveness, and quality classifiers.

4. **Proxy Training**: For each candidate configuration, a small model (perhaps 100M to 1B parameters) is trained on the corresponding data mixture. The proxy's performance on benchmark tasks is measured.

5. **Extrapolation**: The configuration that produces the best proxy performance is selected for the full-scale training run.

This approach is attractive because training a 100M-parameter model might cost a few hundred dollars, while training a 100B-parameter model costs millions. If the proxy reliably predicts full-scale behaviour, the savings are enormous. The problem arises when the proxy does *not* reliably predict full-scale behaviour—and that is precisely what Wang et al. demonstrate.

## Key Findings: When Proxies Fail

### Scale-Dependent Data Preferences

The central finding of the paper is that **data preferences are scale-dependent**. In other words, the optimal data mixture for a small model is systematically different from the optimal data mixture for a large model. This is not a matter of minor discrepancies; the authors find that the ranking of data curation strategies can completely invert as model scale increases.

Consider a concrete example: when comparing two data filtering strategies—say, an aggressive quality filter that removes 40% of web text versus a lenient one that removes only 10%—a small proxy model might clearly prefer the aggressively filtered data. The reasoning seems sound: less noise means more efficient learning for a model with limited capacity. But at large scale, the same model might actually perform better with the more lenient filter, because the larger model has sufficient capacity to learn from noisy data and benefits from the broader coverage of topics and writing styles.

This scale dependence manifests across multiple dimensions of data curation:

- **Domain weighting**: The optimal ratio of code-to-text, math-to-general, or scientific-to-common web content shifts significantly with model size.
- **Data quality thresholds**: The perplexity threshold below which documents are discarded has different optimal values at different scales.
- **Deduplication aggressiveness**: While small models benefit from aggressive deduplication, large models may benefit from seeing near-duplicates that provide implicit reinforcement of important patterns.
- **Synthetic data inclusion**: The value of including synthetic or model-generated data in training varies non-monotonically with scale.

### Quantifying the Proxy Gap

The authors go beyond qualitative observations to provide rigorous quantitative analysis. They train models across a wide range of scales—from tens of millions to several billion parameters—and evaluate multiple data curation strategies at each scale. Their analysis reveals several concerning patterns:

**Low Rank Correlation**: The Spearman rank correlation between proxy model rankings and target model rankings of data curation strategies is often surprisingly low. In some experimental settings, the correlation drops below 0.3, meaning the proxy's preferences are only marginally better than random at predicting what will work at scale.

**Non-Monotonic Scaling**: The relationship between data curation effectiveness and model scale is not simply monotonic. It is not the case that preferences smoothly shift in one direction as models get larger. Instead, the authors observe non-monotonic behaviour where certain data choices improve, then worsen, then improve again as scale increases. This makes simple extrapolation unreliable.

**Task-Specific Divergence**: The proxy gap varies significantly across different evaluation tasks. A proxy model might reliably predict the impact of data changes on simple classification tasks but fail completely for generative tasks or complex reasoning. This means the choice of proxy evaluation benchmarks is critical—and potentially misleading.

### Why Do Proxies Fail?

The paper provides several theoretical and empirical explanations for why proxy models fail to reliably guide data curation:

**Capacity Constraints**: Small models have fundamentally limited capacity. They cannot memorize the long tail of knowledge present in web-scale datasets, so they benefit disproportionately from curated, high-quality, information-dense data. Large models, with vastly more parameters, can afford to process noisier data and extract useful signal that small models would miss entirely. This creates a systematic bias in proxy recommendations toward over-filtering.

**Loss Landscape Differences**: The loss landscape of a small model is qualitatively different from that of a large model. Optima that are accessible and stable for small models may not exist or may be unreachable for large models, and vice versa. Data curation effectively sculpts the loss landscape, so what works for one scale may be counterproductive at another.

**Feature Learning Dynamics**: Recent work on grokking, phase transitions, and emergent capabilities suggests that large models learn features in a fundamentally different order and manner than small models. Data that supports early-stage feature learning in small models may not support the different learning dynamics of large models.

**Statistical Power**: Small proxy training runs have high variance in their performance estimates. When the differences between data curation strategies are modest—which they often are—the noise in proxy evaluations can overwhelm the signal, leading to unreliable rankings.

## Experimental Methodology

The strength of this paper lies in its rigorous experimental design. The authors conduct an extensive set of experiments spanning:

- **Multiple model scales**: From 70M to 7B parameters, providing a dense sampling of the scale axis.
- **Multiple data domains**: Web text, code, mathematics, books, and scientific literature, ensuring the findings generalize across data types.
- **Multiple curation dimensions**: Filtering, mixing, deduplication, and synthetic data inclusion, covering the major levers available to practitioners.
- **Multiple evaluation benchmarks**: A comprehensive suite spanning language modelling perplexity, question answering, reasoning, and code generation.

For each combination of model scale and data curation strategy, the authors measure performance and then analyse how the ranking of strategies changes with scale. They use statistical tests to assess the reliability of proxy predictions and provide confidence intervals on their correlation estimates.

One particularly clever aspect of their methodology is the use of **scaling law analysis**. Rather than simply comparing point estimates at two scales, they fit scaling laws to the performance curves and examine whether the scaling behaviour itself depends on the data curation strategy. This reveals that different data mixtures have different scaling exponents—meaning the gap between strategies grows or shrinks with scale in non-trivial ways.

## Practical Implications

The findings of this paper have profound implications for how AI labs should approach data curation:

### For Training Teams

**Do Not Blindly Trust Proxy Recommendations**: The most immediate takeaway is that data curation decisions based solely on small proxy models should be treated with scepticism. This does not mean proxy models are useless, but rather that their recommendations need to be validated through other means.

**Invest in Intermediate-Scale Validation**: If 100M-parameter proxies are unreliable, what about 1B or 3B parameter models? The authors find that the reliability of proxy predictions improves with proxy size, but the improvement is gradual. Practitioners may need to invest in intermediate-scale runs to get reliable signals—a costlier but more trustworthy approach.

**Use Multiple Proxy Scales**: Rather than relying on a single proxy scale, the authors recommend training proxies at multiple scales and looking for consistent trends. If a data curation strategy consistently improves performance across 100M, 300M, 1B, and 3B models, it is more likely to continue helping at 70B or larger.

**Consider Scaling Law Extrapolation**: The paper suggests that fitting scaling laws to proxy results at multiple scales can provide more reliable extrapolation than any single proxy. This approach, while more expensive, acknowledges the scale-dependent nature of data preferences.

### For the Research Community

**New Benchmarks Needed**: The unreliability of proxy models highlights the need for benchmarks and metrics that are more predictive of large-scale behaviour. Current evaluation suites may be poorly suited for this purpose.

**Theoretical Frameworks**: There is an urgent need for theoretical frameworks that can predict how data curation effects scale, without requiring expensive empirical validation. The authors' scaling law analysis points in this direction but much more work is needed.

**Data-Centric AI**: This paper reinforces the growing recognition that data curation is at least as important as model architecture, yet receives far less rigorous study. The data-centric AI movement, championed by researchers like Andrew Ng, gains further support from these findings.

## Connection to AI Security

While this paper is primarily about training efficiency, it has important implications for AI security:

**Data Poisoning Detection**: If small proxy models cannot reliably predict the effects of data changes on large models, then using proxy models to detect data poisoning attacks—where adversaries inject malicious data into training sets—may be similarly unreliable. A poisoning strategy that is detectable at proxy scale might be invisible at full scale, or vice versa.

**Safety Training**: RLHF and other safety alignment techniques depend on careful data curation. If proxy models mispredict how safety data affects large models, there is a risk that safety training could be less effective than proxy evaluations suggest.

**Supply Chain Integrity**: The data supply chain for LLMs involves many parties—data collectors, curators, annotators, and trainers. Each step involves curation decisions that are often validated with proxy models. The unreliability of these proxies introduces uncertainty throughout the supply chain, potentially creating security blind spots.

## Limitations and Future Directions

The authors acknowledge several limitations of their work:

- Their experiments scale up to 7B parameters, while frontier models are now in the hundreds of billions or trillions. The proxy gap might be even larger at these extreme scales.
- The study focuses on pre-training data curation; the dynamics might differ for fine-tuning or alignment stages.
- The computational cost of comprehensive multi-scale experiments limits the number of data curation strategies that can be evaluated.

Future directions include developing more reliable proxy methodologies, creating theoretical models of scale-dependent data preferences, and establishing best practices for data curation that account for the limitations identified in this paper.

## Conclusion

The paper "Can Small Training Runs Reliably Guide Data Curation? Rethinking Proxy-Model Practice" delivers a sobering message to the AI community: one of our most widely used practices for managing training costs may be significantly less reliable than assumed. The scale-dependent nature of data preferences means that small models are inherently limited predictors of large-model behaviour.

This does not mean proxy models should be abandoned entirely. Rather, the findings call for a more nuanced, multi-scale approach to data curation validation, and for greater humility about what small-scale experiments can tell us about large-scale outcomes. As the field continues to push toward ever-larger models, understanding the relationship between scale and data will only become more critical.

For practitioners, the message is clear: your proxy model's preferences are a starting point for investigation, not a definitive answer. For researchers, this paper opens a rich vein of questions about the fundamental nature of scaling in machine learning. And for the broader AI security community, it highlights that our ability to understand and control what large models learn from their data is more limited than we might have hoped.

---

*This post discusses research presented at ICLR 2026. The original paper is by Jiachen Wang and colleagues and is available at [ICLR Virtual 2026](https://iclr.cc/virtual/2026/poster/10011765).*
