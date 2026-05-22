---
author: Anubhav Gain
pubDatetime: 2026-05-18T11:32:00+05:30
modDatetime: 2026-05-18T11:32:00+05:30
title: "Data Shapley in One Training Run: Efficient Data Valuation for Machine Learning"
slug: data-shapley-one-training-run
featured: false
draft: true
tags:
  - ai-security
  - data-valuation
  - data-shapley
  - iclr
  - training-efficiency
category: AI Research
description: Computing data Shapley values in a single training run, making practical data valuation feasible for large-scale machine learning.
---

## The Data Valuation Problem in Machine Learning

Modern machine learning models are voracious consumers of data. Large language models train on trillions of tokens. Image generation models ingest billions of image-text pairs. Recommendation systems process petabytes of user interaction data. But within these massive datasets, not all data points are created equal. Some data points are enormously valuable—they teach the model important concepts, improve its generalisation, and reduce its errors. Other data points are noisy, redundant, or even harmful, actively degrading model performance.

Understanding which data points matter and which do not is the **data valuation** problem. It is a question with profound practical implications:

- **Data quality**: If you can identify which data points are most valuable, you can prioritise collecting more data like them and remove or correct low-value data.
- **Data pricing**: In data markets where organisations buy and sell training data, you need a principled way to assign value to individual data points or datasets.
- **Data cleaning**: Identifying harmful or low-quality training examples enables targeted data cleaning that improves model performance without requiring additional data collection.
- **Fair compensation**: When models are trained on data contributed by many sources—individual users, content creators, research participants—data valuation provides a basis for fair compensation.
- **Privacy and security**: Understanding which data points are most influential on a model's behaviour is essential for assessing privacy risks, detecting data poisoning attacks, and complying with regulations like GDPR that grant individuals the "right to be forgotten."

The challenge is that data valuation is computationally expensive—prohibitively so for the large-scale datasets used in modern machine learning. **Data Shapley**, introduced by Ghorbani and Zou in 2019, provides a theoretically principled framework for data valuation rooted in cooperative game theory. But computing Data Shapley values traditionally requires training the model many times on different subsets of the data, making it infeasible for anything beyond small datasets and simple models.

**Data Shapley in One Training Run**, presented at ICLR 2025 by Jiachen T. Wang and colleagues, breaks through this computational barrier. The paper introduces a method to compute Data Shapley values from a single standard training run, reducing the computational cost by orders of magnitude and making practical data valuation feasible for large-scale machine learning for the first time.

## Background: Shapley Values and Data Valuation

To appreciate the significance of this work, it is worth understanding the theoretical foundations of Data Shapley.

### Shapley Values in Cooperative Game Theory

Shapley values originated in cooperative game theory as a solution concept for fairly distributing the total value of a coalition among its members. Consider a group of players who can form coalitions to generate value. The Shapley value of each player is their average marginal contribution across all possible orderings of the players.

Formally, for a game with $n$ players and a value function $v(S)$ that gives the value of any coalition $S$, the Shapley value of player $i$ is:

$$\phi_i = \frac{1}{n!} \sum_{\pi} [v(S_i^{\pi} \cup \{i\}) - v(S_i^{\pi})]$$

where the sum is over all permutations $\pi$ of the players, and $S_i^{\pi}$ is the set of players that precede $i$ in permutation $\pi$.

Shapley values are uniquely characterised by four desirable axioms: **efficiency** (values sum to the total), **symmetry** (identical players receive identical values), **linearity** (values behave linearly over games), and **null player** (players who never contribute receive zero). This axiomatic foundation makes Shapley values the gold standard for fair allocation.

### From Players to Data Points

Data Shapley applies this framework to machine learning by treating each training data point as a "player" in a cooperative game. The value function $v(S)$ is the model's performance when trained on the subset $S$ of training data. The Shapley value of each data point then represents its marginal contribution to model performance, averaged over all possible orderings in which training data could be introduced.

This formulation inherits all the desirable axiomatic properties of Shapley values:

- **Efficiency**: The sum of all data Shapley values equals the total model performance, ensuring that all value is distributed.
- **Symmetry**: Data points that contribute equally to all subsets receive equal Shapley values.
- **Null player**: Data points that never change model performance (no matter which subset they are added to) receive zero Shapley value.
- **Fairness**: The valuation is provably fair in a precise mathematical sense.

### The Computational Bottleneck

The problem is computational complexity. Computing exact Shapley values requires evaluating the value function on all $2^n$ subsets of the training data, which is clearly infeasible for any realistic dataset. Even approximate methods like Monte Carlo sampling require training the model hundreds or thousands of times on different data subsets.

For a modern neural network trained on millions of data points, each training run might take hours or days on expensive GPU hardware. Training the model thousands of times to compute data Shapley values is simply not feasible. This computational bottleneck has limited Data Shapley to small-scale applications with simple models, far from the large-scale settings where data valuation is most needed.

Existing approximation methods have attempted to reduce this cost:

- **Truncated Monte Carlo** samples random permutations and stops early when Shapley values converge.
- **Gradient-based methods** use gradient information to estimate marginal contributions without full retraining.
- **Influence functions** approximate the effect of removing a data point using a single Hessian-vector computation.

These methods reduce the cost but still require multiple training runs or expensive per-data-point computations that scale poorly with dataset size.

## The Key Insight: Extracting Shapley Values from Training Dynamics

The central insight of Wang and colleagues is that the information needed to compute Data Shapley values is already present within the dynamics of a single standard training run. You do not need to retrain the model multiple times—you just need to observe the training process carefully and extract the right information.

### The Connection Between Training Dynamics and Marginal Contributions

During standard stochastic gradient descent (SGD) training, the model processes training data points one at a time (or in small batches), updating its parameters after each step. The order in which data points are processed creates a natural permutation of the training data, and the performance change after processing each data point approximates its marginal contribution.

This observation establishes a direct connection between the training dynamics and the Shapley value computation. If you could measure how much each training step—corresponding to each data point—changes the model's performance on a validation set, you would be computing the marginal contribution of that data point in the context of the specific permutation defined by the training order.

Averaging these marginal contributions over many training runs (i.e., many random permutations of the training data) would give the Data Shapley values. But this still requires multiple training runs. The key innovation is finding a way to approximate this average from a single run.

### The Leave-One-Out Gradient Perspective

The paper builds on the insight that the marginal contribution of a data point can be approximated using gradient information. When a data point is processed during training, the gradient of the loss with respect to that data point determines how the model parameters change. The effect of this change on validation performance can be estimated without actually retraining the model.

Specifically, the authors show that for a model trained with gradient descent, the marginal contribution of data point $i$ when added to a subset $S$ can be approximated as:

$$v(S \cup \{i\}) - v(S) \approx \nabla_{\theta} v(S) \cdot \nabla_{\theta} \ell_i(\theta_S)$$

where $\theta_S$ are the model parameters after training on subset $S$, $\ell_i$ is the loss on data point $i$, and $\nabla_{\theta} v(S)$ is the gradient of validation performance with respect to model parameters.

This gradient-based approximation transforms the Shapley value computation from a training problem (retrain on many subsets) into a gradient tracking problem (track gradients during a single training run).

### The Single-Run Algorithm

The paper's algorithm, which the authors call **CS-Shapley** (Computed-in-Single-run Shapley), works as follows:

1. **Perform a single standard training run** on the full training dataset using SGD or a variant.
2. **Track gradient statistics**: During training, maintain running statistics of the gradients computed for each data point (or groups of data points).
3. **Track the validation performance gradient**: Periodically evaluate the model on the validation set and compute the gradient of validation performance with respect to model parameters.
4. **Compute marginal contributions**: Use the gradient statistics and validation performance gradients to estimate each data point's marginal contribution at each point in the training trajectory.
5. **Aggregate to Shapley values**: Average the estimated marginal contributions across the training trajectory to approximate the Data Shapley values.

The crucial observation is that the training trajectory itself provides information about the model's performance at many different "states" along the optimisation path. Each state corresponds to having been trained on a different (implicit) subset of the data. By leveraging the entire training trajectory, the algorithm effectively samples many different subsets without any additional training runs.

### Handling the Permutation Requirement

A technical challenge is that Shapley values require averaging over all permutations of the training data, but a single training run only provides one permutation (the order in which data points were processed). The authors address this through several techniques:

- **Stochastic training order**: In practice, SGD already processes data in random order, so each training run provides a random permutation.
- **Gradient accumulation**: By tracking gradients at multiple points during training, the algorithm effectively samples marginal contributions at many different "subset" states.
- **Theoretical convergence guarantees**: The authors prove that their estimates converge to the true Shapley values as training progresses, under mild assumptions about the training dynamics.

## Theoretical Foundations

A significant contribution of the paper is its rigorous theoretical analysis. The authors prove several important results.

### Convergence Guarantees

The authors prove that the single-run Shapley estimates converge to the true Data Shapley values under standard assumptions about the training process. Specifically, they show that:

- For convex loss functions (e.g., linear models, logistic regression), the estimates converge to exact Shapley values as the number of training steps increases.
- For non-convex losses (e.g., deep neural networks), the estimates converge to a close approximation, with error bounds that depend on the smoothness of the loss landscape.

These guarantees are important because they provide confidence that the method is not just a heuristic but a principled approximation with well-understood properties.

### Computational Complexity

The computational complexity of the single-run method is dramatically lower than traditional approaches:

- **Exact Shapley computation**: $O(2^n \cdot T)$ where $n$ is dataset size and $T$ is the time for one training run.
- **Monte Carlo approximation**: $O(K \cdot T)$ where $K$ is the number of sampled permutations (typically hundreds to thousands).
- **Single-run CS-Shapley**: $O(T + n)$ — the cost of one training run plus a linear overhead for tracking gradient statistics.

For a dataset with millions of points and a training run that takes days, reducing from $K \cdot T$ to $T + n$ is a reduction of two to three orders of magnitude in computational cost.

### Relation to Influence Functions

The paper also clarifies the relationship between Data Shapley and influence functions, another popular approach to data valuation. Influence functions estimate the effect of removing a single data point by computing a first-order Taylor expansion of the model's parameters around the trained solution. The authors show that:

- Influence functions approximate a specific variant of data valuation (leave-one-out value), not the full Shapley value.
- The single-run Shapley method captures information that influence functions miss, particularly the interaction effects between data points.
- For linear models, the two approaches give identical results; for deep networks, the differences can be significant.

## Experimental Results

The authors evaluate their method on a range of tasks, datasets, and model architectures, demonstrating its practical effectiveness.

### Benchmark Datasets

Experiments span several standard benchmarks:

- **Image classification**: CIFAR-10, CIFAR-100, and ImageNet subsets with ResNet and Vision Transformer architectures.
- **Text classification**: IMDB reviews, AG News, and Wikipedia toxicity datasets with transformer-based models.
- **Tabular data**: UCI datasets with gradient-boosted trees and neural networks.

Across all settings, the single-run method produces Shapley value estimates that closely match those computed by expensive Monte Carlo methods, at a fraction of the computational cost.

### Data Quality Applications

The estimated Shapley values are used for several practical data quality tasks:

**Noisy label detection**: Data points with the lowest Shapley values are often mislabeled. By identifying and removing these points, model performance improves significantly. In experiments on CIFAR-10 with 20% synthetic label noise, removing the 10% lowest-valued data points improves test accuracy by 3-5 percentage points.

**Data deduplication**: Near-duplicate data points tend to have similar Shapley values, and removing redundant points has minimal impact on model performance. This enables efficient data pruning without sacrificing quality.

**Outlier detection**: Data points that are significantly different from the majority of the training data tend to have extreme Shapley values (either very high or very low). This provides a natural outlier detection mechanism.

### Comparison with Baselines

The single-run method is compared against several baselines:

- **Monte Carlo Data Shapley** (with varying numbers of permutations): The gold standard but computationally expensive.
- **Influence functions**: A popular approximation method.
- **Leave-one-out (LOO) valuation**: Simply retrain the model with each data point removed and measure the performance change.
- **Random valuation**: Assign random values as a baseline.

The single-run method achieves correlation coefficients of 0.85-0.95 with Monte Carlo Shapley values, compared to 0.60-0.80 for influence functions and 0.50-0.70 for LOO methods. Crucially, it achieves this accuracy at approximately 1/100th to 1/1000th the computational cost of Monte Carlo Shapley.

### Scalability

Perhaps the most impressive results concern scalability. The authors demonstrate the method on:

- **Large datasets**: Training on 1.2 million ImageNet images with a ResNet-50 model, computing Shapley values for all training points in a single 12-hour training run.
- **Large models**: Computing Shapley values for a BERT model fine-tuned on GLUE benchmarks.
- **Fine-grained valuation**: Computing separate Shapley values for individual tokens within text documents, enabling token-level data valuation for language models.

These experiments demonstrate that the method scales to the dataset sizes and model complexities used in modern machine learning practice—a first for Data Shapley methods.

## Practical Applications and Implications

The ability to compute Data Shapley values efficiently opens up several important practical applications.

### Data Markets and Pricing

As data becomes an increasingly valuable commodity, data markets are emerging where organisations buy and sell training data. Data Shapley values provide a principled basis for pricing: data points with high Shapley values are worth more because they contribute more to model performance. The single-run method makes this pricing feasible even for large-scale datasets.

### Data Auditing and Compliance

Regulations like GDPR and CCPA grant individuals rights over their personal data, including the right to know how their data is used and the right to have it removed. Data Shapley values support these rights by:

- Quantifying how much each individual's data contributes to model performance.
- Identifying which data points are most influential for specific model predictions.
- Enabling targeted model updates when data is removed, rather than full retraining.

### Detecting Data Poisoning

In adversarial settings, attackers may inject poisoned data points into the training set to manipulate model behaviour. Data Shapley values provide a natural defence: poisoned data points that are designed to degrade model performance will have very low (often negative) Shapley values, making them easy to detect and remove.

### Improving Training Efficiency

By identifying the most valuable training data points, Shapley values enable more efficient training:

- **Core-set selection**: Train on the most valuable subset of the data, achieving comparable performance with less computation.
- **Active learning**: Prioritise collecting data similar to high-value existing data points.
- **Data augmentation guidance**: Generate augmented data points in the regions of the input space where training data has high value.

### Fairness and Transparency

Data Shapley values support fairness and transparency in machine learning by revealing which data points drive model predictions. If a model's predictions are disproportionately influenced by data points from certain demographic groups, this information can be used to identify and correct fairness issues.

## Limitations and Open Questions

Despite its significant advances, the method has several limitations that future work must address.

### Approximation Quality for Deep Networks

The theoretical convergence guarantees are strongest for convex losses. For deep neural networks with non-convex loss landscapes, the approximation quality depends on the training dynamics, which can be noisy and unpredictable. The empirical results are encouraging, but the gap between estimated and true Shapley values for very deep or very large models remains an open question.

### Memory Requirements

The method requires tracking gradient statistics for each data point during training. For very large datasets (billions of data points), the memory overhead of storing these statistics can be substantial. The authors discuss compression and aggregation strategies, but these introduce additional approximation error.

### Group Shapley Values

In many practical settings, it is more useful to compute Shapley values for groups of data points (e.g., all data from a single source, or all data in a particular category) rather than individual points. The single-run method can be extended to group Shapley values, but the accuracy of these extensions needs further investigation.

### Dynamic Datasets

The method assumes a fixed training dataset. In practice, datasets are often dynamic—new data arrives continuously, and old data may become stale. Extending the single-run approach to streaming and dynamic data settings is an important open problem.

### Model-Specific Considerations

The quality of the Shapley estimates may vary across different model architectures and training procedures. Models trained with aggressive learning rate schedules, early stopping, or complex regularisation may exhibit training dynamics that challenge the method's assumptions. More empirical investigation across diverse training configurations is needed.

## Broader Context: Data Valuation in the AI Ecosystem

This work sits within a rapidly growing ecosystem of research on data valuation for machine learning.

### The Economics of AI Data

As AI systems become more capable and more valuable, the economic incentives around training data are intensifying. Content creators seek compensation for their contributions to training datasets. Companies compete for high-quality proprietary data. Regulators demand transparency about data usage. Data valuation methods like the one proposed in this paper provide the technical foundation for addressing these economic and regulatory challenges.

### Data-Centric AI

The machine learning community is increasingly recognising that improving data quality is often more effective than improving model architectures. This "data-centric AI" perspective shifts attention from models to datasets. Data valuation is a core enabling technology for data-centric AI, providing the tools needed to identify, measure, and improve data quality.

### Privacy and Membership Inference

Data valuation intersects with privacy research in important ways. Data points with high Shapley values are likely to have high influence on model outputs, which means they may also be more vulnerable to membership inference attacks (determining whether a specific data point was used in training). Understanding this connection is essential for developing privacy-preserving data valuation methods.

## Conclusion

Data Shapley in One Training Run represents a significant breakthrough in making data valuation practical for large-scale machine learning. By extracting Shapley value estimates from the training dynamics of a single standard training run, the method reduces computational cost by orders of magnitude while maintaining high accuracy.

The implications extend far beyond computational efficiency. Practical data valuation enables data markets, supports regulatory compliance, detects data poisoning, improves training efficiency, and enhances transparency and fairness. As machine learning systems become more data-dependent and more economically significant, the ability to value training data accurately and efficiently becomes ever more critical.

The work also exemplifies a broader trend in machine learning research: finding ways to extract more information from standard training processes, rather than requiring expensive additional computations. Just as transfer learning reuses knowledge from pre-training and federated learning distributes computation, single-run Shapley extraction shows that valuable information—data valuations—can be obtained as a byproduct of training that would happen anyway.

For practitioners, the message is clear: data valuation is no longer a theoretical luxury. It is a practical tool that can be integrated into standard training pipelines with modest overhead. And for the research community, the paper opens rich avenues for future work—improving approximation quality for complex models, extending to dynamic datasets, and integrating data valuation more deeply into the training process itself.

---

*This post discusses research published at ICLR 2025. The original paper, "Data Shapley in One Training Run" by Jiachen T. Wang and colleagues, is available at [arXiv:2406.11011](https://arxiv.org/abs/2406.11011).*
