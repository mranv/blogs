---
author: Anubhav Gain
pubDatetime: 2026-05-21T12:59:00+05:30
modDatetime: 2026-05-21T12:59:00+05:30
title: "CodeHalu: Investigating Code Hallucinations in LLMs via Execution-Based Verification"
slug: codehalu-code-hallucinations-llm-execution-verification
featured: false
draft: true
tags:
  - ai-security
  - code-hallucination
  - llm-coding
  - aaai
  - verification
category: AI Research
description: How execution-based verification reveals the extent and patterns of code hallucinations in large language models.
---

# CodeHalu: Investigating Code Hallucinations in LLMs via Execution-Based Verification

Large language models have transformed software development. From autocompleting functions to generating entire applications from natural language descriptions, code generation has become one of the most commercially impactful applications of LLMs. GitHub Copilot, Cursor, ChatGPT, Claude, and dozens of other tools now assist millions of developers daily. But beneath the impressive demos and productivity gains lies a troubling reality: LLMs frequently generate code that looks correct, reads fluently, and follows syntactic conventions — yet is fundamentally wrong. This phenomenon, known as **code hallucination**, represents a critical safety and reliability challenge that the AI community is only beginning to systematically understand.

At AAAI 2025, Yuchen Tian and collaborators introduced **CodeHalu**, a comprehensive framework for investigating code hallucinations in large language models through execution-based verification. Their work represents one of the first systematic attempts to move beyond surface-level code evaluation — syntax checking, superficial similarity metrics — and instead rigorously test whether generated code actually does what it is supposed to do. The results are illuminating, concerning, and essential reading for anyone building or deploying LLM-powered coding tools.

## The Code Hallucination Problem

### Beyond Natural Language Hallucination

Hallucination in code generation differs from hallucination in natural language in important ways. When an LLM hallucinates a fact about history or generates a fake citation, a knowledgeable reader might catch the error, or a fact-checking system might flag it. The consequences, while potentially serious, are bounded by the reader's ability to evaluate the claim.

Code hallucination is different. Generated code is often integrated directly into production systems, executed in runtime environments, and trusted to perform critical operations. A hallucinated API call, a fabricated library function, or an incorrect algorithm can silently corrupt data, introduce security vulnerabilities, or cause system failures — all without any obvious signal that something is wrong until it is too late.

Moreover, code hallucination is harder to detect than natural language hallucination. Syntactically correct code that compiles or interprets without errors can still be semantically wrong. Unit tests might pass for the wrong reasons. Edge cases might be handled incorrectly. The code might reference real libraries but use fabricated APIs, or implement algorithms that are subtly incorrect in ways that only manifest under specific inputs.

### The Spectrum of Code Hallucination

Code hallucinations span a wide spectrum of severity:

**Fabricated APIs and Libraries**: The model generates calls to functions or methods that do not exist in the referenced library. This is perhaps the most well-known form of code hallucination — confident invocations of `numpy.magic_sort()` or `pandas.smart_merge()` that simply do not exist.

**Incorrect Algorithm Implementation**: The model generates code that implements an algorithm incorrectly — a sorting function that fails on certain inputs, a search algorithm with incorrect termination conditions, or a mathematical computation that produces wrong results for edge cases.

**Semantic Misalignment**: The generated code is syntactically correct and executes without errors, but does something subtly different from what was requested. The user asks for a function that finds the maximum value in a list; the model generates a function that finds the minimum. Or the user asks for a case-insensitive comparison; the model generates a case-sensitive one.

** hallucinated Business Logic**: In application-level code generation, the model fabricates business rules, validation logic, or data transformations that are not specified in the requirements and do not reflect any standard practice.

**Security-Introducing Hallucinations**: Perhaps most dangerously, the model generates code that introduces security vulnerabilities — SQL injection points, buffer overflows, authentication bypasses — that would not exist in a correct implementation.

### Why Existing Evaluation Falls Short

Standard approaches to evaluating code generation quality are inadequate for detecting hallucination:

**BLEU/ROUGE Scores**: Surface-level similarity metrics between generated and reference code are poor proxies for functional correctness. Code that is syntactically different but functionally equivalent scores poorly, while code that is syntactically similar but functionally different scores well.

**Syntax Checking**: Ensuring generated code compiles or parses correctly is necessary but nowhere near sufficient. Most hallucinated code is syntactically valid.

**Human Evaluation**: Manual code review is expensive, subjective, and does not scale. Developers reviewing AI-generated code often exhibit automation bias — trusting the output more than they should because it comes from an AI system.

**Unit Test Pass Rates**: While more meaningful than similarity metrics, unit tests only verify behavior on specific inputs. They say nothing about the correctness of the implementation on untested inputs, and hallucinated code can pass tests by coincidence.

## The CodeHalu Framework

### Core Idea: Execution as Ground Truth

The fundamental insight behind CodeHalu is simple but powerful: **the definitive test of code correctness is execution**. If generated code, when executed with appropriate inputs, produces the expected outputs, it is functionally correct. If it does not, it is not — regardless of how it looks, what APIs it calls, or how similar it is to reference implementations.

This execution-based verification approach provides an objective ground truth for code evaluation that is independent of surface-level features and resistant to the confounds that plague similarity-based metrics.

### The CodeHalu Benchmark

Tian et al. constructed a comprehensive benchmark for evaluating code hallucination, consisting of tasks across multiple programming languages, difficulty levels, and domains. The benchmark is designed to systematically probe different types of hallucination.

### Taxonomy of Code Hallucination

One of the key contributions of CodeHalu is a detailed taxonomy of code hallucination types. The authors identify and categorize the distinct failure modes that constitute code hallucination, moving beyond a monolithic notion of "wrong code" to a nuanced understanding of how and why code generation fails.

The taxonomy includes several categories:

**Mapping Hallucinations**: The model generates code that maps to a different problem than the one specified. The user describes a problem requiring binary search; the model generates code for linear search. The code is "correct" in some sense — it implements a search algorithm — but it solves the wrong problem.

**Reasoning Hallucinations**: The model generates code that reflects incorrect reasoning about the problem. The approach is broadly correct, but the implementation contains logical errors — off-by-one errors, incorrect base cases, wrong loop conditions, or flawed conditional logic. The model "understood" the problem but "reasoned" about it incorrectly.

**Knowledge Hallucinations**: The model generates code that references or relies on incorrect knowledge about programming languages, libraries, or APIs. This includes calling non-existent functions, using incorrect parameter types, relying on fabricated language features, or assuming incorrect behavior of standard library functions.

### Execution-Based Verification Methodology

The CodeHalu evaluation methodology involves several key components:

**Test Case Generation**: For each task in the benchmark, a comprehensive set of test cases is generated. These include standard cases, edge cases, boundary cases, and stress cases designed to probe different aspects of correctness. The test case coverage is designed to be thorough enough that passing all test cases provides strong evidence of functional correctness.

**Execution Environment**: Generated code is executed in a controlled environment with appropriate dependencies, runtime versions, and resource limits. The execution environment is standardized to ensure consistency across evaluations.

**Output Verification**: The outputs of executed code are compared against expected results. The comparison is not limited to exact matching — for tasks where approximate or equivalent outputs are acceptable, appropriate comparison functions are used.

**Error Analysis**: When generated code fails, the failure is categorized according to the hallucination taxonomy. This provides fine-grained information about what went wrong, not just that something went wrong.

## Experimental Setup and Models Evaluated

### Models Under Test

The CodeHalu framework evaluates a comprehensive set of large language models, spanning different architectural families, sizes, and training paradigms:

**Proprietary Models**: GPT-4, GPT-3.5, Claude, and other commercial models are evaluated to establish the state-of-the-art baseline for code generation quality.

**Open-Source Models**: Models from the LLaMA, CodeLlama, StarCoder, DeepSeek Coder, and other open-source families are evaluated across different parameter scales.

**Code-Specialized Models**: Models specifically trained or fine-tuned for code generation are compared against general-purpose models to assess the impact of code-specific training.

### Task Categories

The benchmark includes tasks across several categories:

**Algorithm Implementation**: Classic algorithm problems (sorting, searching, graph algorithms, dynamic programming) with well-defined correct outputs. These tasks test the model's ability to correctly implement specified algorithms.

**API Usage**: Tasks requiring the correct use of specific library APIs (NumPy, Pandas, requests, etc.). These tasks test the model's knowledge of real-world programming interfaces and its tendency to fabricate APIs.

**Data Manipulation**: Tasks involving data transformation, cleaning, and analysis. These test the model's ability to correctly implement business logic and data operations.

**System Programming**: Tasks involving file I/O, process management, networking, and other system-level operations. These test the model's understanding of lower-level programming concepts.

**Web Development**: Tasks involving HTML, CSS, JavaScript, and web framework usage. These test the model's ability to generate correct frontend and backend code.

## Key Findings

### The Scale of Code Hallucination

The results of the CodeHalu evaluation reveal that code hallucination is far more prevalent than commonly appreciated. Across all models evaluated, significant hallucination rates were observed:

**Even the best models hallucinate**. The top-performing model in the evaluation (GPT-4 at the time of the study) produced hallucinated code at rates that would be concerning for production deployment, particularly on complex or unfamiliar tasks.

**Hallucination increases with task complexity**. Simple tasks (basic loops, standard library calls) show relatively low hallucination rates, while complex tasks (multi-step algorithms, unfamiliar APIs, cross-domain problems) show dramatically higher rates.

**Knowledge hallucinations are the most common type**. The most frequent hallucination category involves incorrect knowledge about APIs, libraries, and language features. Models confidently invoke non-existent functions, use incorrect parameters, and fabricate language features.

**Reasoning hallucinations are the most dangerous**. While knowledge hallucinations are more common, reasoning hallucinations — where the model implements a subtly incorrect algorithm — are more insidious because the generated code appears to work correctly on simple inputs but fails on edge cases or specific conditions.

### Model-Specific Patterns

The evaluation reveals interesting patterns across different models:

**Size matters, but not as much as expected**. Larger models generally hallucinate less than smaller ones, but the improvement is not proportional to the increase in model size. A model with 10x more parameters does not hallucinate 10x less.

**Code-specific training helps significantly**. Models specifically trained on code (CodeLlama, DeepSeek Coder) hallucinate less on code tasks than general-purpose models of similar size, particularly on knowledge hallucinations. However, they are not immune to reasoning hallucinations.

**Instruction tuning is a double-edged sword**. Instruction-tuned models are better at understanding user intent (reducing mapping hallucinations) but can be more confident in incorrect outputs (potentially increasing the severity of other hallucination types).

### The Confidence-Hallucination Correlation

One of the most concerning findings is the relationship between model confidence and hallucination:

**Hallucinated code looks confident**. Models do not typically hedge or express uncertainty when generating hallucinated code. The output reads with the same fluency and apparent authority as correct code, providing no surface-level signal that something is wrong.

**Longer, more detailed responses are not more reliable**. In some cases, longer generated code with more comments and documentation was *more* likely to contain hallucinations, as the model "fills in" details with fabricated information.

**Confidence scores are unreliable indicators**. When models provide confidence scores or uncertainty estimates, these scores do not reliably correlate with correctness. Hallucinated code can receive high confidence scores.

### The Execution Gap

The CodeHalu framework reveals what the authors call the "execution gap" — the difference between what code appears to do (based on reading it) and what it actually does (based on executing it). This gap is a fundamental challenge for code generation evaluation:

**Humans are bad at closing the execution gap**. When asked to manually evaluate generated code, human reviewers frequently rated hallucinated code as correct. The execution gap is not just a limitation of automated evaluation metrics — it is a fundamental limitation of human code review for AI-generated output.

**The gap is larger for complex tasks**. For simple tasks, the execution gap is small — reading the code gives a reasonably accurate picture of what it does. For complex tasks, the gap is substantial — even experienced developers struggle to predict the behavior of hallucinated code by reading it.

## Implications for AI Safety and Software Engineering

### For AI-Powered Development Tools

The CodeHalu findings have significant implications for the design and deployment of AI-powered coding tools:

**Execution Verification is Essential**: Relying on developers to catch hallucinated code through code review is insufficient. AI coding tools should integrate execution verification — actually running the generated code against test cases — as a standard part of the generation pipeline.

**Confidence Calibration for Code**: Current confidence measures for code generation are unreliable. Better calibration methods are needed that take into account the specific failure modes of code hallucination.

**Granular Hallucination Detection**: Different types of hallucination require different detection strategies. API hallucinations can be detected through static analysis against known API specifications. Reasoning hallucinations require execution-based testing. Effective hallucination detection systems should combine multiple approaches.

### For Production Deployment

The findings carry important lessons for organizations deploying AI-generated code:

**Never Trust Without Verification**: AI-generated code should be treated with the same skepticism as code from any untrusted source. Execution-based verification, comprehensive testing, and careful code review are essential.

**Monitor for Subtle Errors**: The most dangerous hallucinations are not the obvious ones (fabricated APIs) but the subtle ones (incorrect algorithms that pass simple tests). Testing strategies should emphasize edge cases, boundary conditions, and adversarial inputs.

**Establish Clear Policies**: Organizations should establish clear policies for when and how AI-generated code can be used, including mandatory verification requirements, testing standards, and review processes.

### For Model Development

The CodeHalu framework provides valuable guidance for improving code generation models:

**Execution-Based Training**: Training or fine-tuning models with execution feedback — where the model receives a signal based on whether its generated code actually executes correctly — could significantly reduce hallucination rates.

**Knowledge Grounding for APIs**: Models should be grounded in accurate, up-to-date API documentation. Techniques like retrieval-augmented generation, where the model retrieves real API specifications before generating code, could reduce knowledge hallucinations.

**Reasoning Verification**: New techniques are needed to verify the reasoning correctness of generated code, beyond just testing its outputs. This might involve formal verification, symbolic execution, or specialized reasoning probes.

## The CodeHalu Benchmark as a Resource

Beyond the specific findings, CodeHalu contributes a valuable benchmark resource to the research community. The benchmark provides:

**Standardized Evaluation**: A common framework for evaluating code hallucination across models, enabling meaningful comparisons and tracking progress over time.

**Fine-Grained Analysis**: The hallucination taxonomy and categorization system enables researchers to go beyond aggregate metrics and understand specific failure modes.

**Extensible Design**: The benchmark is designed to be extensible, allowing new tasks, languages, and hallucination categories to be added as the field evolves.

**Real-World Relevance**: The tasks in the benchmark are designed to reflect real-world code generation scenarios, ensuring that evaluation results are meaningful for practical deployment decisions.

## Broader Context and Related Work

CodeHalu sits within a broader landscape of research on code generation quality and evaluation:

**HumanEval and MBPP**: Earlier benchmarks like HumanEval (Chen et al., 2021) and MBPP (Austin et al., 2021) established the paradigm of evaluating code generation through execution against test cases. CodeHalu extends this paradigm with a specific focus on hallucination and a more nuanced failure taxonomy.

**APPS and CodeContests**: Benchmarks focused on competitive programming problems provide challenging evaluation tasks but are limited to algorithm problems. CodeHalu covers a broader range of code generation scenarios.

**LiveCodeBench**: More recent benchmarks that use continually updated problems to prevent contamination provide complementary evaluation to CodeHalu's hallucination-focused approach.

**Self-Repair and Self-Debugging**: Research on models' ability to identify and fix their own errors provides an interesting counterpoint to CodeHalu's findings. If models can effectively self-repair, the impact of hallucination is reduced — but the CodeHalu results suggest that self-repair is unreliable when the model does not recognize its output as incorrect.

## Limitations and Future Directions

The CodeHalu framework, while comprehensive, has several limitations that point to important future research directions:

### Language and Domain Coverage

The initial benchmark focuses primarily on Python and a few other popular programming languages. Hallucination patterns may differ significantly for less common languages, domain-specific languages, or frameworks with which models have less training data. Extending the benchmark to cover more languages and domains is an important priority.

### Dynamic API Landscapes

Programming APIs and libraries evolve rapidly. A model might generate code that was correct at training time but is now incorrect due to API changes. CodeHalu's static benchmark does not fully capture this temporal dimension of hallucination.

### Context-Dependent Hallucination

In real-world use, code generation happens in the context of existing codebases, project conventions, and specific requirements. The CodeHalu benchmark evaluates code generation in isolation, which may not fully reflect the hallucination patterns that emerge in context-rich scenarios.

### Multi-File and System-Level Hallucination

The benchmark primarily evaluates single-function or single-file generation. In practice, hallucination can manifest at the system level — incorrect assumptions about file structure, wrong inter-module interfaces, or fabricated configuration patterns. Extending the framework to multi-file and system-level code generation is an important direction.

### Interaction Effects

Real-world AI coding tools involve iterative interaction — the user generates code, tests it, asks for modifications, and iterates. Hallucination patterns in interactive code generation may differ from those in single-shot generation. Understanding these interaction effects is crucial for practical deployment.

## The Path Forward

CodeHalu makes it clear that code hallucination is not a minor quality issue but a fundamental challenge that requires systematic attention from researchers, developers, and organizations. The path forward involves several complementary strategies:

**Better Models**: Continued improvement in code generation models, including execution-based training, knowledge grounding, and reasoning verification.

**Better Tools**: Development of AI coding tools that integrate hallucination detection and execution verification as first-class features.

**Better Practices**: Establishment of best practices for AI-assisted development that treat generated code as untrusted until verified.

**Better Benchmarks**: Continued development of evaluation benchmarks like CodeHalu that provide fine-grained, execution-based assessment of code generation quality.

**Better Understanding**: Deeper investigation into the mechanisms that produce code hallucination, informed by the taxonomic framework that CodeHalu provides.

## Conclusion

CodeHalu represents a significant contribution to our understanding of code hallucination in large language models. By introducing execution-based verification as the gold standard for code evaluation and providing a detailed taxonomy of hallucination types, Tian et al. have given the research and practitioner communities a powerful framework for identifying, categorizing, and ultimately addressing one of the most important challenges in AI-powered software development.

The findings are a necessary corrective to the hype surrounding AI coding tools. While these tools offer genuine productivity benefits, the prevalence and subtlety of code hallucination mean that they must be used with appropriate caution, verification, and quality assurance. Code that looks correct is not correct — only code that executes correctly is correct.

As AI-generated code becomes increasingly prevalent in software development, the insights from CodeHalu will only grow in importance. Understanding, detecting, and mitigating code hallucination is not just a research problem — it is a practical necessity for building reliable, secure, and trustworthy software systems.

## References

- Tian, Y., et al. "CodeHalu: Investigating Code Hallucinations in LLMs via Execution-based Verification." *Proceedings of the AAAI Conference on Artificial Intelligence (AAAI)*, 2025. [arXiv:2405.00253](https://arxiv.org/abs/2405.00253)
- Chen, M., et al. "Evaluating Large Language Models Trained on Code." *arXiv preprint arXiv:2107.03374*, 2021.
- Austin, J., et al. "Program Synthesis with Large Language Models." *arXiv preprint arXiv:2108.07732*, 2021.
- Li, Y., et al. "Competition-Level Code Generation with AlphaCode." *Science*, 2022.
- Rozière, B., et al. "Code Llama: Open Foundation Models for Code." *arXiv preprint arXiv:2308.12950*, 2023.
- Guo, D., et al. "DeepSeek-Coder: When the Large Language Model Meets Programming." *arXiv preprint arXiv:2401.14196*, 2024.
- Liu, J., et al. "Your Code is Generated by Large Language Models: Benchmarking LLM-generated Code with CodeHalu." *arXiv preprint*, 2024.
