---
author: Anubhav Gain
pubDatetime: 2026-05-22T18:30:00+05:30
modDatetime: 2026-05-22T18:30:00+05:30
title: "Improving LLM Safety Alignment Through Dual-Objective Optimization"
slug: dual-objective-optimization-llm-safety-alignment
featured: false
draft: false
tags:
  - ai-security
  - safety-alignment
  - optimization
  - icml
  - dual-objective
category: AI Research
description: How dual-objective optimization simultaneously improves LLM safety and capability, resolving the traditional safety-utility tradeoff.
---

# Improving LLM Safety Alignment Through Dual-Objective Optimization

One of the most persistent tensions in large language model (LLM) development is the perceived tradeoff between safety and capability. Make a model safer, the conventional wisdom goes, and you inevitably make it less helpful, less creative, and less willing to engage with legitimate requests that touch on sensitive topics. This safety-utility tax has been accepted as an unavoidable cost of alignment — until now. At ICML 2025, Xuandong Zhao and colleagues from UC Santa Barbara and Google DeepMind introduced a **dual-objective optimization** framework that challenges this assumption head-on, demonstrating that it is possible to simultaneously improve both safety and helpfulness through a principled training approach that treats them as complementary rather than competing goals.

This post provides an in-depth analysis of the paper "Improving LLM Safety Alignment with Dual-Objective Optimization," its technical contributions, experimental results, and implications for the future of AI safety research.

## The Safety-Utility Tradeoff: A Persistent Myth?

### The Conventional Wisdom

The belief that safety comes at the cost of capability has deep roots in LLM development. The phenomenon, sometimes called the **"alignment tax,"** manifests in several well-documented ways:

- **Over-refusal**: Safety-tuned models refuse legitimate requests that merely resemble harmful ones — a medical student asking about drug interactions might be refused because the query touches on pharmaceuticals, or a cybersecurity researcher asking about vulnerability analysis might be blocked because the topic involves hacking.
- **Reduced helpfulness**: Models trained with aggressive safety objectives become less willing to engage with nuanced or complex queries, defaulting to generic safety disclaimers rather than providing useful information.
- **Creativity suppression**: Safety constraints can dampen a model's creative and exploratory behaviour, making outputs more bland and conservative across all domains, not just potentially harmful ones.
- **Capability degradation**: Fine-tuning on safety data can inadvertently degrade performance on standard benchmarks, particularly for reasoning, coding, and mathematical tasks.

This tradeoff has been observed across alignment methodologies — Reinforcement Learning from Human Feedback (RLHF), Direct Preference Optimization (DPO), and their variants all exhibit some degree of capability loss when pushed toward stronger safety.

### Why the Tradeoff Emerges

The root cause of the safety-utility tradeoff lies in how alignment is typically formulated: as a **single-objective** optimization problem. Standard approaches optimize for a composite reward that combines safety and helpfulness signals, but the optimization process often treats them as antagonistic:

1. **Conflicting gradients**: Safety training examples (where the model should refuse) and helpfulness training examples (where the model should comply) produce gradient updates that pull the model in opposite directions, creating interference during optimization.
2. **Data imbalance**: Safety training data often dominates in terms of signal strength — a few harmful prompt-response pairs create strong gradients that overwhelm the more subtle helpfulness signals.
3. **Objective conflation**: When safety and helpfulness are combined into a single loss function, the optimizer cannot distinguish between "improving safety at the expense of helpfulness" and "genuinely improving both" — it simply follows the steepest descent direction, which often sacrifices one for the other.

The key insight of Zhao et al.'s work is that this tradeoff is not inherent to the safety-alignment problem itself, but is an artifact of **how we formulate the optimization**. By decomposing alignment into two explicit objectives and optimizing them jointly with a principled multi-objective framework, the apparent tradeoff can be dramatically reduced — or even eliminated.

## The Dual-Objective Optimization Framework

### Problem Formulation

The paper reformulates LLM safety alignment as a **multi-objective optimization** problem. Instead of a single loss function that conflates safety and helpfulness, the framework maintains two separate objectives:

$$\mathcal{L}_{safety} = \mathbb{E}_{(x, y) \sim \mathcal{D}_{safety}} \left[ \ell_{safety}(x, y; \theta) \right]$$

$$\mathcal{L}_{helpfulness} = \mathbb{E}_{(x, y) \sim \mathcal{D}_{help}} \left[ \ell_{help}(x, y; \theta) \right]$$

where $\theta$ represents the model parameters, $\mathcal{D}_{safety}$ is the safety training dataset (containing harmful prompts and appropriate refusal responses), and $\mathcal{D}_{help}$ is the helpfulness dataset (containing legitimate queries and high-quality responses). The core challenge is finding model parameters $\theta^*$ that simultaneously minimize both objectives.

### Why Not Simply Weight and Sum?

A naive approach would be to minimize a weighted combination: $\mathcal{L} = \lambda \mathcal{L}_{safety} + (1 - \lambda) \mathcal{L}_{helpfulness}$. This is, in essence, what standard RLHF and DPO already do — they combine safety and helpfulness preferences into a single reward or preference signal. The problem with this approach is that it collapses a fundamentally two-dimensional optimization landscape into a single dimension, losing critical information about the **Pareto structure** of the problem.

In multi-objective optimization, the goal is not to find a single optimal point but to trace out the **Pareto front** — the set of solutions where improving one objective necessarily worsens the other. The key contribution of this paper is showing that the Pareto front for safety-helpfulness optimization is much more favourable than previously assumed: there exist regions of the parameter space where both objectives can be improved simultaneously.

### The MGDA-Based Approach

The paper leverages the **Multiple Gradient Descent Algorithm (MGDA)**, a classical multi-objective optimization technique adapted for the LLM alignment setting. MGDA operates by:

1. **Computing individual gradients**: At each training step, gradients are computed separately for each objective: $\nabla_\theta \mathcal{L}_{safety}$ and $\nabla_\theta \mathcal{L}_{helpfulness}$.

2. **Finding a Pareto-optimal descent direction**: Rather than simply averaging the two gradients, MGDA finds a convex combination that minimizes the combined gradient norm:

$$\min_{\alpha} \left\| \alpha \nabla_\theta \mathcal{L}_{safety} + (1 - \alpha) \nabla_\theta \mathcal{L}_{helpfulness} \right\|^2$$

   subject to $\alpha \in [0, 1]$. This optimization finds the descent direction that makes the most progress on both objectives simultaneously.

3. **Detecting Pareto stationarity**: When no descent direction exists that improves both objectives (i.e., the model is on the Pareto front), MGDA identifies this condition and avoids unnecessary tradeoffs.

### Efficient Gradient Computation for LLMs

A practical challenge with MGDA for LLMs is that computing separate gradients for two objectives effectively doubles the backward pass cost. The paper introduces several efficiency innovations:

#### Gradient Projection and Low-Rank Approximation

Rather than computing full-parameter gradients for both objectives, the framework uses a **gradient projection** strategy that:

- Computes the full gradient for the primary objective (safety)
- Approximates the secondary objective gradient using low-rank projections onto the primary gradient subspace
- Uses the projected gradient to compute the MGDA step at a fraction of the computational cost

#### Cosine Similarity Gating

The paper introduces a **cosine similarity gating** mechanism that determines when dual-objective optimization is beneficial. When the two gradients point in similar directions (high cosine similarity), a single weighted update suffices. When they point in conflicting directions (low or negative cosine similarity), the full MGDA procedure is activated. This adaptive approach reduces unnecessary computation during training phases where the objectives are naturally aligned.

## Technical Innovations Beyond MGDA

### Safety-Helpfulness Data Curation

The quality of the training data is critical for dual-objective optimization to succeed. The paper introduces a careful data curation pipeline:

#### Contrastive Safety Data

For the safety objective, the framework constructs **contrastive preference pairs** where:

- The **chosen response** is an appropriate refusal or safe completion that clearly communicates why the request cannot be fulfilled
- The **rejected response** includes both harmful compliances (for dangerous requests) and over-refusals (for benign requests)

This dual rejection strategy is important: the safety objective is not just "refuse harmful requests" but "refuse harmful requests **and** comply with legitimate ones." By including over-refusals in the rejected set, the model learns that blanket refusal is not optimal safety behaviour.

#### Helpfulness Data with Safety Awareness

The helpfulness data is curated to include:

- **Standard helpful interactions**: Queries and high-quality responses across diverse domains
- **Borderline safety queries**: Requests that touch on sensitive topics but are legitimate (e.g., medical information, cybersecurity defensive techniques, historical analysis of warfare)
- **Context-dependent queries**: Requests where the appropriate response depends on the inferred context and intent

This curation ensures that the helpfulness objective is not blind to safety concerns — it learns the nuanced boundary between legitimately helpful and inappropriately compliant responses.

### Dynamic Weight Scheduling

The paper introduces a **dynamic weight scheduling** strategy that adjusts the relative emphasis on safety and helpfulness objectives throughout training:

- **Phase 1 (Foundation)**: Equal weighting, allowing the model to establish baseline competence on both objectives
- **Phase 2 (Specialization)**: Increased weight on the currently weaker objective, ensuring balanced improvement
- **Phase 3 (Refinement)**: Fine-grained adjustment based on a held-out validation set that measures both safety and helpfulness metrics

This curriculum-like approach ensures that neither objective is neglected and that the final model achieves strong performance on both dimensions.

## Experimental Results

The paper presents comprehensive experiments across multiple model families, benchmarks, and evaluation protocols.

### Main Results

The dual-objective framework was evaluated on Llama-3, Mistral, and Gemma model families at various scales. The key results on safety benchmarks demonstrate significant improvements:

| Model | Method | Safety Score (AdvBench) | Helpfulness (MT-Bench) | Over-Refusal (XSTest) |
|-------|--------|------------------------|----------------------|---------------------|
| Llama-3-8B | Standard DPO | 78.2 | 7.1 | 34.6% |
| Llama-3-8B | RLHF | 81.5 | 6.8 | 38.2% |
| Llama-3-8B | **Dual-Objective** | **89.3** | **7.6** | **18.4%** |
| Mistral-7B | Standard DPO | 74.8 | 7.3 | 31.2% |
| Mistral-7B | RLHF | 77.1 | 6.9 | 35.7% |
| Mistral-7B | **Dual-Objective** | **86.7** | **7.7** | **16.9%** |

The results are striking: the dual-objective approach achieves **higher safety scores** and **higher helpfulness scores** simultaneously, while also dramatically reducing over-refusal. This directly contradicts the prevailing assumption that safety improvements must come at the cost of capability.

### Analysis of Gradient Dynamics

The paper provides a detailed analysis of the gradient dynamics during training, revealing several important patterns:

#### Gradient Alignment Over Training

Early in training, safety and helpfulness gradients frequently point in conflicting directions (negative cosine similarity). As training progresses with the dual-objective framework, the gradients become increasingly aligned — the model learns representations that serve both objectives simultaneously. By the end of training, the average cosine similarity between safety and helpfulness gradients is **positive**, indicating that improvements on one objective tend to also improve the other.

This finding suggests that the safety-utility tradeoff is primarily a feature of **poorly optimized** models. With the right optimization framework, the model can discover a parameter region where safety and helpfulness are naturally complementary.

#### Gradient Conflict Resolution

The MGDA component resolves gradient conflicts in a principled way. The paper visualizes the gradient trajectories during training, showing that:

- Standard single-objective training follows a path that initially improves both objectives but then diverges, sacrificing helpfulness for safety (or vice versa)
- Dual-objective training follows a more direct path toward the Pareto-optimal region, avoiding unnecessary tradeoffs
- The dynamic weight scheduling ensures balanced progress, preventing the model from optimizing one objective at the expense of the other

### Robustness to Adversarial Attacks

Beyond standard safety benchmarks, the paper evaluates robustness against several adversarial attack methods:

| Attack Method | Standard Alignment | Dual-Objective |
|--------------|-------------------|----------------|
| GCG (Greedy Coordinate Gradient) | 42.3% ASR | 18.7% ASR |
| AutoDAN | 38.1% ASR | 15.2% ASR |
| DeepInception | 35.6% ASR | 14.8% ASR |
| JailbreakBench | 44.2% ASR | 19.1% ASR |

where ASR is the Attack Success Rate (lower is better). The dual-objective approach provides substantially better adversarial robustness, which the authors attribute to the more structured safety representations that emerge from multi-objective optimization.

### Scaling Behaviour

The paper examines how the benefits of dual-objective optimization scale with model size:

- **7-8B parameters**: Average improvement of +8-11pp on safety, +0.4-0.5 on helpfulness
- **13-14B parameters**: Average improvement of +7-9pp on safety, +0.3-0.5 on helpfulness
- **70B parameters**: Average improvement of +5-7pp on safety, +0.3-0.4 on helpfulness

The benefits are consistent across scales, though the magnitude of improvement is somewhat larger for smaller models, suggesting that dual-objective optimization is particularly valuable when training with limited model capacity.

## Why Does Dual-Objective Optimization Work?

### The Geometry of Safety and Helpfulness

The paper provides an elegant theoretical analysis of why dual-objective optimization succeeds where single-objective approaches fail. The key insight is that safety and helpfulness are not truly conflicting objectives — they only appear to conflict when the optimization landscape is poorly traversed.

In the model's parameter space, there exist regions where:

1. **Both objectives are low (good)**: The model is both safe and helpful — the Pareto-optimal region
2. **Safety is low but helpfulness is high**: The model is helpful but unsafe — the naive helpfulness optimum
3. **Safety is high but helpfulness is low**: The model is safe but unhelpful — the naive safety optimum
4. **Both objectives are high (bad)**: The model is neither safe nor helpful — a region to avoid

Standard optimization, by collapsing both objectives into one, can get trapped in regions 2 or 3. Dual-objective optimization, by maintaining separate gradient information, can always find a direction that moves toward region 1.

### Avoiding Gradient Interference

A critical technical contribution is the analysis of **gradient interference** — the phenomenon where updates intended to improve one objective degrade the other. The paper shows that:

- **Positive transfer**: Safety training often improves helpfulness on safety-adjacent tasks (e.g., learning to reason carefully about harmful requests also improves reasoning about complex benign requests)
- **Negative transfer**: Naive safety training can degrade helpfulness through over-generalization (e.g., learning to refuse weapon-related queries can generalize to refusing all technical queries)
- **Dual-objective optimization maximizes positive transfer while minimizing negative transfer** by explicitly modelling the interaction between the two objectives

### Emergent Nuanced Safety Behaviour

One of the most interesting findings is that dual-objective trained models exhibit more **nuanced safety behaviour** than standard alignment. Specifically:

- They are better at distinguishing between harmful and benign requests on sensitive topics
- They provide more contextual and informative refusal responses (explaining why a request is problematic rather than giving a canned refusal)
- They are more willing to engage with legitimate queries on sensitive topics, reducing over-refusal
- They maintain consistent safety behaviour across different phrasings and formulations of the same request

This nuance emerges naturally from the dual-objective framework because the model is simultaneously optimizing for safety (refusing harmful requests) and helpfulness (complying with legitimate ones), forcing it to learn the **boundary** between them rather than simply learning to refuse broadly.

## Implications for AI Safety and Security

### Redefining the Alignment Tax

The most immediate implication of this work is that the "alignment tax" may be largely avoidable. If dual-objective optimization can achieve simultaneous improvements in safety and helpfulness, then the historical resistance to stronger safety measures — motivated by concerns about capability degradation — becomes less justifiable. This could accelerate the adoption of more rigorous safety alignment across the industry.

### Practical Deployment Considerations

For organizations deploying LLMs, the dual-objective framework offers several practical advantages:

1. **Simplified safety-helpfulness tuning**: Instead of manually balancing safety and helpfulness through trial-and-error with different data mixtures and training hyperparameters, practitioners can rely on the optimization framework to find the right balance automatically.

2. **Reduced over-refusal**: The dramatic reduction in over-refusal rates means fewer customer complaints about the model being "too cautious" and more productive user interactions.

3. **Better adversarial robustness**: The improved robustness against adversarial attacks reduces the need for additional runtime defenses, simplifying the deployment stack.

4. **Consistent behaviour across domains**: The nuanced safety behaviour translates to more consistent and predictable model responses, which is critical for enterprise applications.

### Connections to Broader AI Safety Research

The dual-objective framework connects to several active research threads:

- **Constitutional AI**: The ability to optimize for multiple objectives simultaneously aligns with the constitutional AI programme, where models must follow multiple principles that might sometimes appear to conflict.
- **Scalable oversight**: As AI systems become more capable, ensuring that safety keeps pace with capability is a central challenge. Dual-objective optimization provides a framework for achieving this balance.
- **Mechanistic interpretability**: Understanding how dual-objective optimization changes the model's internal representations — compared to single-objective approaches — could provide insights into how safety and capability are encoded in neural networks.

### Implications for Red Teaming

From a red teaming perspective, dual-objective trained models present both challenges and opportunities:

- **Harder to attack**: The improved adversarial robustness means that standard jailbreaking techniques are less effective, requiring red teams to develop more sophisticated approaches.
- **More interesting attack surface**: The nuanced safety boundary creates interesting attack vectors — subtle prompt engineering that shifts the model's assessment of a request from "harmful" to "legitimate" becomes more important.
- **Better evaluation metrics**: Dual-objective optimization provides a natural framework for evaluating safety that considers both protection against attacks and preservation of legitimate functionality.

## Limitations and Future Directions

The paper is candid about several limitations and open questions:

### Computational Overhead

The MGDA-based approach requires computing and storing gradients for both objectives, which increases training cost by approximately 40-60% compared to single-objective DPO. While the efficiency improvements (gradient projection, cosine similarity gating) mitigate this, the overhead remains non-trivial, particularly for large-scale training runs.

### Sensitivity to Data Quality

The effectiveness of dual-objective optimization depends heavily on the quality and balance of the safety and helpfulness training data. Poorly curated data — particularly if the safety data contains over-refusal examples or the helpfulness data contains unsafe responses — can lead to suboptimal optimization. Developing more robust data curation pipelines is an important direction for future work.

### Generalization to Other Objective Pairs

The paper focuses on safety-helpfulness dual optimization, but the framework is generalizable. Future work could explore:

- **Safety-creativity**: Optimizing for safety while maximizing creative output
- **Safety-reasoning**: Ensuring that safety improvements don't degrade mathematical or logical reasoning
- **Multi-objective alignment**: Extending beyond two objectives to simultaneously optimize for safety, helpfulness, accuracy, and other desirable properties

### Theoretical Understanding

While the empirical results are compelling, the theoretical understanding of *why* dual-objective optimization is so effective for LLM alignment remains incomplete. Why do safety and helpfulness gradients become more aligned over the course of training? What properties of the loss landscape enable simultaneous improvement? Developing a rigorous theoretical framework could guide the design of even more effective optimization strategies.

### Evaluation at the Frontier

The paper evaluates on models up to 70B parameters and standard safety benchmarks. As frontier models continue to scale and encounter more diverse and sophisticated threats, validating that dual-objective optimization continues to provide benefits at scale and against novel attack vectors is essential.

## Practical Takeaways for Practitioners

For researchers and engineers working on LLM alignment, the paper offers several actionable recommendations:

1. **Stop treating safety and helpfulness as a zero-sum game.** The assumption that safety improvements must come at the cost of helpfulness is not supported by the optimization landscape — it is an artifact of suboptimal training procedures.

2. **Adopt multi-objective optimization for alignment.** If you're training safety-aligned models, consider replacing single-objective DPO or RLHF with a dual-objective framework. The implementation overhead is modest, and the benefits are substantial.

3. **Invest in data quality for both objectives.** The effectiveness of dual-objective optimization depends on having high-quality training data for both safety and helpfulness. Curating contrastive safety data that includes both harmful compliances and over-refusals is particularly important.

4. **Monitor gradient dynamics during training.** Tracking the cosine similarity between safety and helpfulness gradients during training provides valuable diagnostic information. If gradients remain persistently conflicting, it may indicate data quality issues or a need for different optimization hyperparameters.

5. **Evaluate both dimensions comprehensively.** Don't just evaluate safety on attack benchmarks — also measure helpfulness, over-refusal, and behaviour on borderline queries. The dual-objective framework improves all of these simultaneously, and comprehensive evaluation is needed to capture the full benefit.

## Conclusion

The dual-objective optimization framework introduced by Zhao et al. represents a paradigm shift in how we think about LLM safety alignment. By demonstrating that safety and helpfulness can be simultaneously improved through principled multi-objective optimization, the paper challenges the long-held assumption of an inevitable alignment tax.

The technical contributions — the adaptation of MGDA for LLM training, the efficient gradient computation strategies, and the careful data curation pipeline — provide a practical blueprint for building models that are both safer and more capable. The experimental results across multiple model families and evaluation protocols confirm that the approach is robust and generalizable.

Perhaps most importantly, the paper changes the conversation around AI safety. The question is no longer "how much capability are we willing to sacrifice for safety?" but rather "how can we optimize our training procedures to get more of both?" This reframing has profound implications for the field, suggesting that the perceived tension between safety and capability may be more a limitation of our methods than an inherent property of the problem.

As the AI community continues to push toward more capable and more widely deployed systems, dual-objective optimization provides a principled path forward — one that doesn't force us to choose between building models that are safe and building models that are useful. We can, and should, have both.

---

**Paper Reference**: Xuandong Zhao et al., "Improving LLM Safety Alignment with Dual-Objective Optimization," ICML 2025. Available at [arXiv:2503.03710](https://arxiv.org/abs/2503.03710).
