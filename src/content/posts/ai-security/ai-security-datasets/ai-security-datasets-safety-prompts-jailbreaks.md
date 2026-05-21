---
author: Anubhav Gain
pubDatetime: 2025-05-22T14:00:00+05:30
modDatetime: 2025-05-22T14:00:00+05:30
title: "AI Security Datasets: Safety Prompts, Jailbreaks, and Evaluation Data"
slug: ai-security-datasets-safety-prompts-jailbreaks
featured: false
draft: false
tags:
  - ai-security
  - datasets
  - llm-safety
  - jailbreak
  - evaluation
  - red-teaming
  - system-prompts
category: AI Security
description: A guide to AI security datasets including SafetyPrompts, Do-Not-Answer, JailBreakV-28K, and leaked system prompt collections used for evaluating LLM safety, benchmarking red teaming tools, and understanding real-world AI attack surfaces.
---

# AI Security Datasets: Safety Prompts, Jailbreaks, and Evaluation Data

Rigorous AI security evaluation requires high-quality datasets. From prompts that test safety boundaries to large-scale jailbreak collections, these datasets power the benchmarks and tools covered in our other guides. This guide covers the key datasets available for AI security research and testing.

## Why Security Datasets Matter

Datasets are the foundation of AI security research. They enable:

- **Benchmarking**: Standardized test sets for comparing defense tools
- **Red team training**: Practice materials for security researchers
- **Model evaluation**: Measuring safety properties of AI models
- **Defense development**: Training data for safety classifiers
- **Threat intelligence**: Understanding real-world attack patterns

## Safety Evaluation Datasets

### SafetyPrompts

**[SafetyPrompts](https://safetyprompts.com/)** is a curated collection of safety-relevant prompts for evaluating LLM safety and security properties. It provides:

- **Categorized prompts**: Organized by safety dimension (violence, hate speech, self-harm, etc.)
- **Test coverage**: Prompts designed to test specific safety mechanisms
- **Reproducible testing**: Standardized prompts enable consistent evaluation across models
- **Community maintained**: Growing collection with community contributions

### Do-Not-Answer

**[Do-Not-Answer](https://github.com/Libr-AI/do-not-answer)** takes an important approach — it provides prompts that responsible LLMs should **not** answer:

- **Safety evaluation**: Tests whether models correctly refuse harmful requests
- **Categorized by risk**: Covers multiple categories of harmful content
- **Evaluation framework**: Includes methodology for scoring model responses
- **Research-backed**: Published with academic rigor for reproducible results

This dataset is particularly valuable for measuring model safety improvements across versions and comparing safety properties between different model providers.

## Jailbreak Datasets

### JailBreakV-28K

**[JailBreakV-28K](https://github.com/SaFoLab-WISC/JailBreakV_28K)** is a large-scale dataset containing 28,000 jailbreak prompts:

- **Scale**: One of the largest publicly available jailbreak prompt collections
- **Diversity**: Covers multiple jailbreak strategies and techniques
- **Benchmark ready**: Formatted for use with JailbreakBench and similar evaluation frameworks
- **Multi-modal**: Includes text and image-based jailbreak variants

This dataset is essential for researchers developing new jailbreak detection methods and for organizations stress-testing their LLM guardrails.

## System Prompt Collections

### Leaked System Prompts

**[Leaked System Prompts](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools)** is a collection of leaked system prompts from commercial AI tools:

- **Real-world examples**: Actual system prompts used in production AI applications
- **Attack surface analysis**: Understanding how production systems are prompted reveals potential attack surfaces
- **Prompt engineering insights**: Learn from how major AI applications are configured
- **Security implications**: Demonstrates what information is exposed in system prompts

This collection is invaluable for:

1. **Red teamers**: Understanding the structure of production system prompts for targeted testing
2. **Defenders**: Learning what should and should not be included in system prompts
3. **Researchers**: Studying prompt engineering patterns across the industry

## Using Datasets for Security Testing

### For Model Evaluation

```
1. Start with Do-Not-Answer to verify basic safety refusals
2. Use SafetyPrompts for comprehensive safety dimension testing
3. Apply JailBreakV-28K for stress-testing guardrails
4. Compare results across model versions to track improvements
```

### For Tool Development

```
1. Use datasets as training data for safety classifiers
2. Validate guardrail tools against known jailbreak collections
3. Benchmark detection rates against JailBreakV-28K
4. Test false positive rates against legitimate prompts from SafetyPrompts
```

### For Red Team Exercises

```
1. Study Leaked System Prompts for understanding target architectures
2. Adapt JailBreakV-28K prompts to specific application contexts
3. Use Do-Not-Answer as a baseline for expected model behavior
4. Combine multiple datasets for comprehensive testing coverage
```

## Dataset Comparison

| Dataset | Size | Focus | Primary Use |
|---------|------|-------|-------------|
| SafetyPrompts | Curated | Safety evaluation | Multi-dimensional safety testing |
| Do-Not-Answer | Medium | Refusal testing | Safety baseline measurement |
| JailBreakV-28K | 28,000 prompts | Jailbreak testing | Guardrail stress testing |
| Leaked System Prompts | Growing | Attack surface research | Red team intelligence |

## Ethical Considerations

When working with AI security datasets:

1. **Responsible use**: Use datasets only for improving AI safety, not for developing attack capabilities
2. **Scope authorization**: Ensure all testing is within authorized scope
3. **Disclosure**: Follow responsible disclosure practices for any vulnerabilities discovered
4. **Privacy**: Respect the privacy of systems whose prompts have been leaked
5. **Documentation**: Maintain clear records of how datasets are used in your testing

## Key Takeaways

- Quality datasets are essential for meaningful AI security evaluation
- Do-Not-Answer provides a baseline for measuring model safety — responsible models should refuse these prompts
- JailBreakV-28K at 28,000 prompts is the go-to resource for stress-testing jailbreak defenses
- Leaked system prompt collections provide real-world intelligence for red team exercises
- These datasets power the benchmarks (JailbreakBench, ISC-Bench) and tools (garak, promptfoo) covered throughout this series
