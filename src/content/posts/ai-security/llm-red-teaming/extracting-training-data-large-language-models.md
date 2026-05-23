---
author: Anubhav Gain
pubDatetime: 2026-05-16T17:40:00+05:30
modDatetime: 2026-05-16T17:40:00+05:30
title: "Extracting Training Data from Large Language Models: The Privacy Risk No One Expected"
slug: extracting-training-data-large-language-models
featured: false
draft: false
tags:
  - ai-security
  - training-data-extraction
  - llm-privacy
  - usecurity
  - memorization
category: AI Research
description: The groundbreaking research showing that large language models memorize and can be made to regurgitate their training data, with profound privacy implications.
---

# Extracting Training Data from Large Language Models: The Privacy Risk No One Expected

Large language models (LLMs) are trained on vast corpora of text drawn from the internet — books, articles, forums, social media, code repositories, and more. This data inevitably contains sensitive personal information: email addresses, phone numbers, social security numbers, private conversations, and copyrighted content. The prevailing assumption was that LLMs do not simply "store" their training data; instead, they learn statistical patterns and generalizable features that allow them to generate fluent text. At USENIX Security 2021, Nicholas Carlini, Florian Tramèr, Eric Wallace, Matthew Jagielski, Ariel Herbert-Voss, Katherine Lee, Adam Roberts, Tom Brown, Dawn Song, Úlfar Erlingsson, Alina Oprea, and Colin Raffel published [Extracting Training Data from Large Language Models](https://arxiv.org/abs/2012.07805), a paper that shattered this assumption. They demonstrated, for the first time at scale, that an adversary with only black-box query access to a language model can extract verbatim memorized training data — including personally identifiable information — from the model.

This was not a theoretical vulnerability with an impractical attack. It was a practical, reproducible extraction of real people's private data from a production-grade language model. The paper fundamentally changed how the AI community thinks about model privacy, memorization, and the security implications of training on web-scale data.

## The Memorization Problem

### What Does It Mean for a Model to "Memorize"?

Memorization in machine learning occurs when a model learns to reproduce specific training examples rather than learning generalizable patterns. In the context of language models, memorization means that given the right prompt (or prefix), the model will complete the text with an exact or near-exact reproduction of a sequence from its training data.

This is not the same as "learning" in the useful sense. A model that has genuinely learned the concept of email addresses can generate plausible-looking but fictitious addresses. A model that has memorized specific email addresses from its training data will reproduce real addresses belonging to real people — a fundamentally different and dangerous behavior.

The distinction is crucial: **generalization produces novel, plausible outputs; memorization reproduces specific training examples verbatim.**

### Why Was Memorization Underestimated?

Before this paper, several arguments suggested that memorization in large models was either negligible or impractical to exploit:

**The capacity argument**: Even though large models have billions of parameters, the training data contains trillions of tokens. With such a high data-to-parameter ratio, the model cannot possibly "store" the training data — there simply isn't enough capacity. This argument turns out to be flawed because memorization is not uniform. The model preferentially memorizes certain types of content (repeated text, structured data, unusual sequences) and ignores the vast majority of its training data.

**The needle-in-a-haystack argument**: Even if some memorization occurs, the training data is so vast that finding memorized content would be like finding a needle in a haystack. You would need to somehow guess the right prompt to trigger the memorized output, and there are infinitely many possible prompts. This paper showed that the haystack is smaller and the needles are easier to find than expected.

**The differential privacy argument**: Some researchers believed that the stochastic nature of training (random initialization, stochastic gradient descent, dropout) provided a form of implicit privacy protection — the noise in the training process would obscure individual training examples. In practice, the noise was insufficient to prevent extraction.

## The Attack: How Training Data Was Extracted

### Threat Model

The authors considered a realistic black-box threat model:

- The adversary has **no access** to the model's parameters, gradients, or internal representations.
- The adversary can only **query** the model by providing text prefixes and receiving the model's predicted token probabilities or generated completions.
- The adversary has **no knowledge** of what specific data was in the training set (beyond the general knowledge that it was drawn from the internet).
- The adversary's goal is to **extract verbatim sequences** from the training data that contain sensitive or private information.

This is the least privileged threat model possible — it corresponds to anyone who can use an API or web interface to interact with a language model.

### Step 1: Triggering Memorized Completions

The attack begins by generating text from the model and looking for outputs that the model produces with unusually high confidence. The key insight is that **memorized text is generated with lower perplexity than non-memorized text**. When a model is reproducing a sequence it has memorized, it "knows" exactly what comes next, and its token-level predictions are highly confident.

The authors used several strategies to trigger memorized content:

**Prefix from training data**: If you happen to know (or guess) a prefix of a memorized sequence, the model will confidently complete it. Even partial or approximate prefixes can trigger full memorized outputs.

**Prompting with common patterns**: Many memorized sequences follow predictable formats — email signatures, forum post headers, code comments, legal boilerplate. Prompting with these patterns can trigger memorized completions.

**Temperature sampling at low temperatures**: Sampling at very low temperatures (approaching greedy decoding) makes the model more likely to produce its highest-confidence predictions, which tend to be memorized sequences.

**Top-k filtering**: Restricting the model to its top-k most likely predictions at each step filters out uncertain, generalized completions in favor of confident, potentially memorized ones.

### Step 2: Identifying Memorized Outputs

Not every high-confidence output is memorized training data. Some sequences are simply very predictable (e.g., "The quick brown fox jumps over the lazy dog"). The authors needed a way to distinguish true memorization from mere predictability.

They used a **cross-referencing approach**: after generating candidate sequences, they searched the internet (specifically, a cached copy of the Common Crawl web corpus) to verify whether the generated text appeared verbatim in a document that was likely part of the training data. Sequences that matched web text were confirmed as memorized training data.

### Step 3: Filtering for Sensitive Content

Among the confirmed memorized sequences, the authors searched for personally identifiable information (PII): email addresses, phone numbers, social media handles, physical addresses, and other sensitive data. They found numerous instances of real, verifiable PII that the model reproduced verbatim.

### Quantifying Memorization

The authors developed a rigorous methodology for quantifying the extent of memorization:

1. **Extractable memorization**: A sequence is extractable if an adversary can cause the model to emit it (in verbatim form) using only black-box queries, without any prior knowledge of the sequence. This is the strongest and most practical form of memorization.

2. **Epidemiological memorization**: A sequence is discovered to be memorized if, given a prefix from the training data, the model completes it with the exact training sequence. This is a weaker definition (it requires knowing a prefix) but is useful for measuring the total amount of memorization in the model.

The key metric is the **extraction rate**: how many memorized sequences can be extracted per unit of query budget. The authors showed that this rate is high enough to be practically concerning — an adversary can extract hundreds of memorized sequences with a reasonable query budget.

## Key Findings

### Scale of Memorization in GPT-2

The paper primarily studied GPT-2 (the 1.5 billion parameter model released by OpenAI in 2019), which was trained on a corpus of web text (WebText). The findings were striking:

**Hundreds of verbatim extractions**: Using their attack methodology, the authors extracted hundreds of verbatim sequences from GPT-2's training data, many containing sensitive information.

**PII extraction**: The model reliably reproduced complete email addresses, phone numbers, and other personal identifiers when prompted with appropriate prefixes. These were not fabricated — they corresponded to real individuals whose data appeared in the training corpus.

**Counterintuitive scaling**: Larger models memorize **more** than smaller models. This was a surprising and concerning finding. Intuition might suggest that larger models, with their greater capacity for generalization, would rely less on memorization. Instead, the opposite was true: the 1.5B parameter GPT-2 memorized more than its smaller 117M and 345M parameter counterparts. This suggests that the additional capacity is used, in part, to memorize training data more effectively.

**Repeated content is preferentially memorized**: Content that appears multiple times in the training data (such as canonical lists, popular quotes, boilerplate text, and widely-shared personal information) is memorized much more frequently than unique content. This is consistent with the understanding that memorization is driven by the gradient signal — examples that contribute more to the loss (because they are encountered more often) are memorized more deeply.

### The Extraction Attack Is Practical

The attack demonstrated in the paper was not a theoretical construct:

- The queries used were simple text prompts — the kind any user could submit through a standard API.
- The computational cost of the attack was modest. Generating and filtering candidates required no special hardware beyond what a typical researcher would have access to.
- The success rate was high enough that an adversary could extract useful sensitive information with a relatively small number of queries.

### Memorization Persists Despite Mitigations

The authors investigated whether standard training techniques reduce memorization:

**Differential privacy**: Training with differential privacy (DP) guarantees can theoretically bound the amount of information a model reveals about any individual training example. However, the privacy budgets used in practice (when DP is used at all) are often too large to provide meaningful protection against extraction attacks.

**Regularization**: Standard regularization techniques (dropout, weight decay) do not significantly reduce memorization. The model still memorizes training data; it just does so slightly less efficiently.

**Data deduplication**: Removing duplicate or near-duplicate examples from the training data reduces memorization of repeated content but does not eliminate memorization of unique content.

## Case Studies: What Was Extracted

The paper included several concrete examples of extracted training data (with sensitive details redacted for privacy):

### Personal Information

The model reproduced complete email signatures, including names, titles, email addresses, phone numbers, and mailing addresses. These were not fabricated — they matched real individuals' contact information found on public web pages that were part of the training data.

### Code and Configuration

The model reproduced large blocks of source code, including code with embedded credentials (API keys, database connection strings). While the credentials themselves were often not valid (having been rotated or revoked), their extraction demonstrates the risk of training on code repositories without careful filtering.

### Personal Narratives

The model reproduced personal stories, forum posts, and social media content that, while technically "public" on the internet, represent individuals' private expressions. The extraction of this content raises questions about consent and the ethics of training on web-scraped data.

### Contact Information in Context

The model was particularly good at extracting contact information when it appeared in familiar contexts — email signatures, "About the Author" sections, directory listings. The structured nature of this information makes it easier for the model to memorize and reproduce.

## Why This Matters: Implications

### Privacy Regulations

The extraction attack has direct implications for privacy regulations such as GDPR, CCPA, and other data protection frameworks. These regulations generally prohibit the processing of personal data without a lawful basis and grant individuals the right to have their data deleted. If a language model has memorized personal data, it effectively serves as a permanent, accessible repository of that data — one that cannot easily be "deleted" without retraining the model from scratch.

The "right to be forgotten" becomes extraordinarily complex when the data is embedded in the parameters of a neural network. The model does not store data in a lookup table that can be selectively edited; the memorized information is distributed across millions of parameters in a way that makes surgical removal extremely difficult.

### Training Data Auditing

The extraction methodology provides a powerful tool for auditing training data. If you can extract memorized content from a model, you can partially reconstruct what was in its training data — even if the training data was not publicly disclosed. This has implications for:

- **Copyright enforcement**: Authors and publishers could potentially demonstrate that their copyrighted works were used to train a model by extracting memorized passages.
- **Data provenance**: Organizations could audit their own models to understand what sensitive data was inadvertently memorized.
- **Compliance verification**: Regulators could test whether models trained on allegedly anonymized data still contain memorized PII.

### Security Vulnerabilities

Beyond privacy, the extraction of training data creates security vulnerabilities:

**Credential leakage**: If training data contained passwords, API keys, or other secrets, an adversary could extract these from the model.

**Intellectual property theft**: Proprietary information, trade secrets, or confidential business data in the training corpus could be extracted.

**Social engineering**: Extracted personal information could be used for targeted phishing attacks, identity theft, or harassment.

### The Scaling Hypothesis and Memorization

Perhaps the most concerning finding is that **larger models memorize more**. As the AI industry continues to scale up model sizes — from billions to trillions of parameters — the amount of memorized training data is likely to increase proportionally. This creates a troubling dynamic: the models that are most capable and most widely deployed are also the most vulnerable to training data extraction attacks.

The scaling hypothesis (that larger models trained on more data will develop increasingly capable and general representations) may be partially confounded by increased memorization. Some of the apparent "improvement" in larger models may simply reflect their ability to memorize more training data more precisely.

## Defenses and Mitigations

### Differential Privacy Training

The most theoretically sound defense is to train with formal differential privacy guarantees. By clipping gradients and adding calibrated noise during training, differential privacy provides a mathematical bound on how much information the model can reveal about any individual training example.

However, differential privacy training has practical challenges:

- **Performance cost**: DP training typically reduces model quality, especially at strong privacy levels (small ε values).
- **Computational cost**: Per-example gradient computation and noise addition significantly slow training.
- **Privacy budget selection**: Choosing the right ε is difficult. Too large, and the privacy guarantee is meaningless. Too small, and the model is unusable.

### Data Deduplication

Since repeated content is preferentially memorized, removing duplicate and near-duplicate examples from the training data can reduce the most egregious forms of memorization. This is a practical and relatively low-cost intervention.

However, deduplication does not address memorization of unique content, and it requires a careful, expensive deduplication pipeline for web-scale datasets.

### Output Filtering

Post-hoc filtering of model outputs can detect and redact potential PII (email addresses, phone numbers, SSNs) before they are returned to the user. This is a defense-in-depth measure but has limitations:

- It can be bypassed by clever prompting that encodes the extracted data in alternative formats.
- It may produce false positives, filtering legitimate outputs that happen to contain patterns resembling PII.
- It does not address the fundamental problem that the model has memorized the data; it merely tries to prevent the model from revealing it.

### Canary Insertion

The authors proposed a clever auditing technique: inserting "canary" sequences — unique, easily identifiable strings — into the training data, and then testing whether the model memorizes them. If the canary can be extracted, it indicates that real training data can likely be extracted as well.

This technique has become a standard tool for empirically measuring memorization in language models and was a precursor to more sophisticated memorization auditing frameworks.

### Machine Unlearning

Machine unlearning techniques aim to remove specific information from a trained model without full retraining. While promising in principle, current unlearning methods are not reliable enough to guarantee that memorized data has been fully removed.

## The Legacy of This Paper

### Catalyzing a Research Field

This paper catalyzed an entire subfield of AI privacy research. Subsequent work has:

- Extended extraction attacks to larger models (GPT-3, GPT-4, Llama, and beyond).
- Developed more efficient extraction techniques that require fewer queries.
- Studied memorization in other modalities (image generation models, code models, multimodal models).
- Proposed new defenses, including curbing, scrubbing, and privacy-preserving training techniques.
- Investigated the legal and ethical implications of memorization under various regulatory frameworks.

### Influencing Industry Practice

The paper's findings have influenced how major AI labs approach data privacy:

- **Training data curation**: Organizations now invest more heavily in filtering sensitive content from training data.
- **Model auditing**: Before releasing models, many organizations now conduct memorization audits to identify and mitigate extraction risks.
- **Transparency reports**: Some organizations publish information about their training data composition and privacy measures.
- **API controls**: API providers have implemented rate limiting, output filtering, and monitoring to make extraction attacks more difficult.

### The Broader Privacy Conversation

The paper contributed to a broader societal conversation about the ethics of training AI systems on web-scraped data. Key questions include:

- **Consent**: Individuals whose data appears in training corpora did not consent to having their information encoded in AI models.
- **Opt-out mechanisms**: How can individuals effectively request that their data be excluded from AI training?
- **Data sovereignty**: Different jurisdictions have different rules about data collection and processing, creating complex compliance challenges for globally-trained models.
- **The public/private boundary**: Information that is technically "public" on the internet may still be private in a meaningful sense. The fact that a personal email address appears on a web page does not necessarily mean the individual consented to it being embedded in an AI model.

## Technical Deep Dive: The Extraction Algorithm

For readers interested in the technical details, here is a more detailed description of the extraction algorithm:

### Candidate Generation

The attack generates candidate sequences by:

1. Selecting a prefix (either randomly, from a template, or from a known corpus).
2. Sampling the model's continuations at low temperature ($T \approx 0.2$ to $0.8$) with top-$k$ filtering ($k \approx 40$).
3. Collecting the top-1 (greedy) and top-$k$ completions for each prefix.
4. Generating a large pool of candidates (thousands to hundreds of thousands of sequences).

### Memorization Scoring

Each candidate is scored based on how "memorized" it appears:

- **Perplexity**: Memorized sequences have anomalously low perplexity. The model is unusually confident about each token.
- **Token-level log-likelihood**: The average per-token log-likelihood of the sequence under the model. Higher values indicate more confident (and potentially more memorized) predictions.
- **Comparison with a reference model**: If a smaller or differently-trained model is available, comparing the perplexity of the sequence under both models can help identify sequences that are memorized by the target model but not the reference.

### Deduplication and Filtering

Candidates are deduplicated and filtered to remove:

- Common sequences that appear frequently in general text (which are not memorized in the meaningful sense).
- Sequences that are too short to be meaningful (less than a threshold number of tokens).
- Sequences that the model generates with low confidence (high perplexity).

### Verification

The final step verifies whether the filtered candidates are truly memorized training data by searching for exact or near-exact matches in a reference corpus (such as Common Crawl). This step requires access to a (partial) copy of the training data or a representative corpus.

## Key Takeaways

1. **Memorization is real and extractable**: Large language models memorize significant amounts of their training data, and this data can be extracted by adversaries with only black-box query access.

2. **Larger models memorize more**: Scaling up model size increases memorization, creating a tension between capability and privacy.

3. **The attack is practical**: Training data extraction does not require specialized access or extraordinary resources. It is feasible for any motivated adversary.

4. **Current defenses are insufficient**: Differential privacy training is theoretically sound but practically costly. Deduplication and output filtering provide partial mitigation but do not solve the fundamental problem.

5. **Privacy implications are profound**: The ability to extract training data from language models raises serious concerns under GDPR, CCPA, and other privacy regulations, and challenges the ethical foundations of training on web-scraped data.

6. **Auditing is essential**: Organizations deploying LLMs should conduct regular memorization audits using canary insertion and extraction testing to understand and mitigate privacy risks.

## Conclusion

Carlini et al.'s paper on extracting training data from large language models was a watershed moment in AI security research. It transformed memorization from a theoretical concern into a demonstrated, practical vulnerability. The findings have reshaped how the AI community thinks about model privacy, training data ethics, and the security properties of large-scale machine learning systems.

As language models continue to grow in size, capability, and deployment, the risks identified in this paper will only become more acute. The extraction attacks demonstrated here are the tip of the iceberg — future attacks will likely be more efficient, more targeted, and applicable to a wider range of model types and modalities.

The lesson is clear: **training data is not safely hidden inside a model's parameters.** It can be extracted, it can be exploited, and it must be protected — through careful data curation, privacy-preserving training, robust output filtering, and ongoing vigilance. The privacy of the billions of individuals whose data fuels modern AI systems depends on it.

---

**Paper**: [Extracting Training Data from Large Language Models](https://arxiv.org/abs/2012.07805)
**Authors**: Nicholas Carlini, Florian Tramèr, Eric Wallace, Matthew Jagielski, Ariel Herbert-Voss, Katherine Lee, Adam Roberts, Tom Brown, Dawn Song, Úlfar Erlingsson, Alina Oprea, Colin Raffel
**Venue**: USENIX Security 2021
