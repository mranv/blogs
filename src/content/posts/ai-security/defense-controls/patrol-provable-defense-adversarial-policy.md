---
author: Anubhav Gain
pubDatetime: 2026-05-23T18:00:00+05:30
modDatetime: 2026-05-23T18:00:00+05:30
title: "PATROL: Provable Defense Against Adversarial Policies in Two-Player Games"
slug: patrol-provable-defense-adversarial-policy
featured: false
draft: false
tags:
  - ai-security
  - adversarial-policy
  - game-theory
  - usecurity
  - provable-defense
category: AI Research
description: How PATROL provides provable defense guarantees against adversarial policies in competitive multi-agent environments.
---

## Introduction

As AI agents become increasingly capable and are deployed in competitive multi-agent environments—from cybersecurity operations to financial trading and autonomous vehicle navigation—a new class of threat has emerged: **adversarial policies**. Unlike traditional adversarial examples that perturb inputs to neural networks, adversarial policies are complete strategies crafted by a malicious opponent to exploit systematic weaknesses in an RL-trained agent's policy. The paper "PATROL: Provable Defense against Adversarial Policy in Two-player Games" by Wenbo Guo, Xian Wu, Susobhan Ghosh, Sui Huang, Yevgeniy Vorobeychik, Michael Backes, Yang Zhang, and Somesh Jha, presented at USENIX Security 2023, addresses this threat with the first **provable** defense mechanism.

This is a significant contribution because while empirical defenses against adversarial policies existed, none could provide formal guarantees. PATROL changes that by introducing a certification framework that bounds the worst-case performance degradation an agent can suffer against any adversarial policy within a defined threat model.

## The Threat: Adversarial Policies in Competitive RL

### Understanding Adversarial Policies

In competitive multi-agent reinforcement learning (MARL), agents are trained to play against opponents. An adversarial policy is a strategy specifically designed by an attacker to cause a victim agent to fail catastrophically. The key insight from prior work (notably by Gleave et al., 2020) is that adversarial policies do not need to be "stronger" than the victim in any traditional sense—they simply need to visit states that systematically trigger poor decisions from the victim's learned policy.

Consider a fighting game: an adversarial policy might discover that adopting a specific unusual stance causes the victim agent to respond with ineffective moves, even though the victim performs well against normal opponents. The adversarial policy exploits distributional shift—the victim was trained on a limited set of opponent behaviors and generalizes poorly to out-of-distribution strategies.

### Why Existing Defenses Fall Short

Prior approaches to defending against adversarial policies included:

- **Adversarial training**: Training against generated adversarial policies to improve robustness. While empirically effective, it provides no formal guarantees and is vulnerable to stronger adversaries.
- **Ensemble methods**: Using multiple trained agents to reduce single-point failures. These improve average-case performance but don't bound worst-case losses.
- **Detection-based approaches**: Attempting to detect when an opponent is using an adversarial strategy. These are inherently reactive and can be circumvented by adaptive adversaries.

None of these approaches could answer the fundamental question: *"What is the worst-case loss my agent can suffer against any possible adversary?"*

## PATROL: The Framework

### Problem Formulation

PATROL operates in the setting of two-player competitive games modeled as Markov Games. The victim agent follows a fixed policy $\pi_v$ (trained via standard RL), and the adversarial opponent can adopt any policy $\pi_a$ within a constrained policy space. The defense objective is to certify a lower bound on the victim's expected cumulative reward regardless of the adversarial policy chosen.

The key constraint PATROL places on the adversary is a **distance bound** on the state distribution shift: the adversarial policy can shift the state visitation distribution, but only by a bounded amount measured in a suitable metric. This is analogous to the $\ell_p$-norm bounded perturbation model in adversarial examples for classification.

### Core Technical Innovation: Policy Smoothing and State Aggregation

PATROL draws inspiration from Randomized Smoothing, the breakthrough technique from certified robustness in image classification (Cohen et al., 2019), and adapts it to the sequential decision-making setting. The framework consists of two key components:

#### 1. State Aggregation

The state space of the game is partitioned into discrete bins (aggregated states). This abstraction is crucial because:

- The original state space may be continuous or extremely large, making direct analysis intractable.
- By aggregating states, PATROL can bound the probability that the game transitions to any particular abstract state.
- The aggregation granularity controls the tightness of the certification bounds—finer aggregation gives tighter bounds but increases computational cost.

The aggregation function $\phi: \mathcal{S} \rightarrow \hat{\mathcal{S}}$ maps original states to abstract states. The choice of aggregation is domain-dependent and can leverage domain knowledge about which state features are most relevant for the victim's decision-making.

#### 2. Policy Smoothing via Randomized Action Perturbation

This is PATROL's most innovative component. Rather than using the victim's original deterministic policy directly, PATROL constructs a **smoothed policy** by adding controlled randomization to the victim's actions. Specifically, at each timestep, with probability $(1 - p)$ the victim follows its original policy, and with probability $p$ it takes a uniformly random action.

This randomized smoothing serves a dual purpose:

- **Defense**: By randomizing actions, the smoothed policy becomes less predictable and less exploitable. An adversarial opponent cannot precisely predict the victim's responses, making it harder to craft a targeted adversarial strategy.
- **Certification**: The randomization enables the application of concentration inequalities (specifically, the Neyman-Pearson lemma) to bound the worst-case transition dynamics under any adversarial policy.

### The Certification Procedure

PATROL's certification algorithm works as follows:

1. **Estimate nominal transition probabilities**: Under the victim's smoothed policy and a reference opponent policy (e.g., the training opponent), estimate the probability of transitioning to each aggregated state.

2. **Compute the worst-case shift bound**: Using the distance constraint on the adversary's policy space, compute the maximum shift the adversary can induce in the state visitation distribution, measured using total variation distance or a similar metric.

3. **Bound worst-case reward**: Apply concentration inequalities to compute a certified lower bound on the victim's expected cumulative reward. This bound holds for any adversarial policy within the defined threat model.

The certification is performed over a finite horizon $H$ (the game length), and the bound is derived by propagating the worst-case state distribution shift through the game's transition dynamics.

### Formal Guarantee

The main theoretical result of PATROL can be stated informally as follows:

> *Given a victim agent with smoothed policy $\tilde{\pi}_v$ and a game with horizon $H$, there exists a certified reward lower bound $R_{cert}$ such that for any adversarial policy $\pi_a$ within the threat model, the victim's expected cumulative reward satisfies $\mathbb{E}[R] \geq R_{cert}$.*

The bound $R_{cert}$ depends on:
- The smoothing parameter $p$ (higher randomization generally improves the bound but degrades average-case performance)
- The state aggregation granularity
- The adversary's capability (the tighter the adversary's constraint, the tighter the bound)
- The game's transition dynamics and reward structure

## Experimental Evaluation

### Games and Environments

The authors evaluate PATROL on several competitive two-player environments:

1. **MuJoCo Competitive Games**: Including Kick and Defend, You Shall Not Pass, and Sumo—standard benchmarks in adversarial policy research. These involve continuous state-action spaces with physics-based dynamics.

2. **Connect Four**: A classic board game with discrete states, allowing exhaustive analysis of the certification procedure.

3. **Gymnasium Environments**: Various grid-world and tabular environments for controlled experiments.

### Key Results

#### Certification Effectiveness

PATROL successfully provides non-trivial certified lower bounds on the victim's reward across all evaluated environments. The certified bounds are significantly above the worst-case reward (the minimum possible reward), demonstrating that PATROL provides meaningful guarantees.

For example, in the Kick and Defend environment:
- The victim's reward against the training opponent is approximately 0.75
- Without defense, an adversarial policy can reduce the victim's reward to near 0
- PATROL certifies a lower bound of approximately 0.40 (varying with the smoothing parameter and threat model)

#### Empirical Defense Performance

Beyond certification, PATROL's smoothed policies also perform well empirically against adversarial policies:
- **Against known adversarial policies** (generated by adversarial training algorithms), the smoothed policy maintains substantially higher reward than the undefended policy.
- **Against adaptive adversaries** (adversaries that know about the defense and try to adapt), the smoothed policy still outperforms undefended baselines, confirming that the defense is not trivially bypassed.

#### Trade-off Analysis

The authors carefully analyze the inherent trade-off between certification strength and average performance:

- **High smoothing ($p$ close to 1)**: Provides strong certified bounds but reduces performance against normal opponents because the victim takes many random actions.
- **Low smoothing ($p$ close to 0)**: Maintains high performance against normal opponents but provides weak certified bounds.

This trade-off can be tuned based on the deployment context—high-security scenarios warrant stronger smoothing, while competitive gaming scenarios might prefer weaker smoothing for better average performance.

### Comparison with Adversarial Training

PATROL is compared with adversarial training (re-training the victim against generated adversarial policies). Key findings:

- Adversarial training often achieves better empirical performance against the specific adversarial policies it was trained against.
- However, adversarial training provides **no formal guarantees** and can be broken by stronger adversaries.
- PATROL's certified bounds hold universally within the threat model, regardless of the specific adversarial strategy.
- In some cases, combining PATROL's smoothing with adversarial training provides the best of both worlds—strong empirical and certified performance.

## Broader Implications

### For AI Safety

PATROL addresses a fundamental concern in AI safety: as AI systems are deployed in adversarial environments, we need not just empirical robustness but **provable guarantees**. This work demonstrates that such guarantees are achievable, at least in the two-player competitive game setting.

The framework is particularly relevant for:

- **Autonomous systems** operating in environments with potentially malicious actors
- **Financial trading systems** where competitors may attempt to exploit algorithmic trading strategies
- **Cybersecurity** where AI agents defend against adaptive attackers
- **Game-playing AI** deployed in competitive settings where financial stakes are involved

### Limitations and Future Directions

PATROL has several acknowledged limitations:

1. **Scalability**: The certification procedure's computational cost grows with the state space size and game horizon. Current experiments are limited to moderate-complexity environments.

2. **Threat model restrictiveness**: The distance-bounded threat model may not capture all realistic adversaries. In particular, adversaries with access to the victim's policy parameters may be able to craft attacks that shift the state distribution beyond PATROL's certified bounds.

3. **State aggregation sensitivity**: The quality of the certified bound depends heavily on the choice of state aggregation. Poor aggregation can lead to vacuous bounds. Developing automated or adaptive aggregation methods remains an open problem.

4. **Multi-agent generalization**: PATROL is designed for two-player games. Extending provable defenses to settings with multiple adversaries or complex multi-agent dynamics is an important future direction.

5. **Continuous action spaces**: While the framework handles continuous action spaces through smoothing, the theoretical analysis becomes more complex, and the bounds may be looser.

## Technical Deep Dive: The Certification Bound

For readers interested in the mathematical details, the core certification relies on the following construction:

Given the smoothed policy $\tilde{\pi}_v$ and a nominal state distribution $d_0$ (under the reference opponent), the worst-case state distribution $d_{adv}$ under any adversarial policy satisfies:

$$\|d_{adv} - d_0\|_{TV} \leq \epsilon$$

where $\epsilon$ is the total variation distance bound derived from the adversary's capability constraint.

The certified reward lower bound is then:

$$R_{cert} = \sum_{\hat{s} \in \hat{\mathcal{S}}} d_0(\hat{s}) \cdot R(\hat{s}) - \epsilon \cdot \max_{\hat{s}} |R(\hat{s})|$$

This bound is propagated through the game horizon using dynamic programming, accounting for the cumulative effect of the adversarial policy on the state distribution over multiple timesteps.

The smoothing parameter $p$ controls the concentration of the transition kernel: higher smoothing makes the transition kernel more uniform, which reduces the adversary's ability to shift the state distribution and thus tightens the bound.

## Conclusion

PATROL represents a landmark contribution to the security of multi-agent AI systems. By providing the first provable defense against adversarial policies in competitive games, it establishes a new standard for rigorous AI security research. While the framework has limitations in scalability and threat model coverage, it opens a clear research direction toward certified robustness in sequential decision-making under adversarial conditions.

The key takeaway for practitioners is that **randomized action smoothing combined with state aggregation can provide meaningful certified robustness guarantees** for RL agents in competitive environments. As AI systems become more prevalent in adversarial settings, such provable defenses will be essential for ensuring reliable and safe deployment.

For researchers, PATROL opens numerous avenues: extending the framework to multi-player games, developing tighter certification bounds through better aggregation strategies, and exploring the interplay between certified defenses and adversarial training. The convergence of formal methods and adversarial ML in sequential settings is still in its early stages, and PATROL provides a solid foundation for this emerging field.

---

**Paper Reference**: Wenbo Guo, Xian Wu, Susobhan Ghosh, Sui Huang, Yevgeniy Vorobeychik, Michael Backes, Yang Zhang, Somesh Jha. "PATROL: Provable Defense against Adversarial Policy in Two-player Games." USENIX Security Symposium, 2023. Available at: [https://www.usenix.org/system/files/usenixsecurity23-guo-wenbo.pdf](https://www.usenix.org/system/files/usenixsecurity23-guo-wenbo.pdf)
