---
author: Anubhav Gain
pubDatetime: 2026-05-23T16:00:00+05:30
modDatetime: 2026-05-23T16:00:00+05:30
title: "RedCode: Benchmarking Risky Code Execution in AI Code Agents"
slug: redcode-risky-code-execution-benchmark
featured: false
draft: false
tags:
  - ai-security
  - code-agents
  - benchmark
  - neurips
  - code-safety
category: AI Research
description: A benchmark for evaluating the safety risks of AI code agents when executing and generating potentially dangerous code.
---

## Why We Need a Safety Benchmark for Code Agents

AI code agents—systems that can understand instructions, write code, and execute it—are rapidly becoming central to modern software development. From autonomous coding assistants that build entire applications to IDE-integrated tools that write and run scripts on demand, these agents have the remarkable ability to translate natural language into executable computation. But this power comes with a fundamental tension: the very capability that makes code agents useful—the ability to execute arbitrary code—is also what makes them potentially dangerous.

Consider what happens when a user asks a code agent to "clean up the temporary files on the system" or "find and process all configuration files." A well-functioning agent will generate appropriate shell commands and execute them safely. But what if the agent's instructions are ambiguous, adversarial, or borderline harmful? What if a prompt asks the agent to delete files matching certain patterns, or to download and execute a remote script? The line between useful automation and risky execution is often thin, and code agents that eagerly comply with any request can cause real damage.

Existing benchmarks for code agents have focused almost exclusively on functionality—can the agent write correct code? Can it solve programming challenges? Can it debug errors? Safety, when considered at all, has been treated as a secondary concern, typically addressed through refusal benchmarks that test whether an agent will decline obviously harmful requests. But this approach misses the vast middle ground: tasks that are functionally legitimate but involve operations that carry genuine risk, such as file manipulation, network access, privilege escalation, or system modification.

**RedCode**, presented at NeurIPS 2024 by Chengquan Guo and colleagues, addresses this gap head-on. RedCode is a comprehensive benchmark specifically designed to evaluate the safety risks of AI code agents during code execution and generation, providing a structured, reproducible framework for measuring how agents handle potentially dangerous operations.

## The Design Philosophy Behind RedCode

RedCode's design is guided by several key principles that distinguish it from prior code agent benchmarks.

First, the benchmark focuses on **risky execution**, not just code correctness. The tasks in RedCode are designed to tempt or require agents to perform operations that could be harmful if executed in a real environment. This includes operations like deleting files, modifying system configurations, accessing sensitive data, executing network operations, and escalating privileges. The goal is not to test whether agents can solve problems, but whether they can solve problems *safely*.

Second, RedCode evaluates both **code generation** and **code execution**. These are distinct capabilities with distinct risk profiles. An agent might generate dangerous code without executing it (a generation risk) or might execute code that appears safe but has dangerous side effects (an execution risk). RedCode captures both dimensions through two complementary components: **RedCode-Gen** and **RedCode-Exec**.

Third, the benchmark uses **bash** as its primary programming language. This choice is deliberate and strategically important. Bash is the lingua franca of system administration and DevOps—it is the language of file manipulation, process management, network operations, and system configuration. Bash commands can be profoundly destructive (consider `rm -rf /` or `chmod 777 /etc/passwd`), and even experienced administrators regularly make mistakes with shell commands. By focusing on bash, RedCode tests agents in precisely the domain where the consequences of unsafe execution are most severe.

Fourth, RedCode provides a **sandboxed execution environment** based on Docker containers. This allows the benchmark to actually execute the code that agents generate, observing its real effects in a controlled setting. The sandbox includes realistic file systems, processes, and system states, providing agents with an authentic execution environment without risking the host system.

## RedCode-Gen: Evaluating Risky Code Generation

RedCode-Gen evaluates the code that agents generate in response to potentially dangerous task instructions. The component is built around a carefully curated set of tasks that span a wide range of risk categories.

### Task Taxonomy

Each task in RedCode-Gen is categorized according to the type of risk it involves:

- **File System Manipulation**: Tasks that require or tempt the agent to modify, delete, or restructure files and directories. Examples include batch file renaming, directory cleanup operations, and recursive file searches.
- **Process Management**: Tasks involving process creation, termination, or monitoring. These test whether agents will create processes that could be exploited for privilege escalation or resource exhaustion.
- **Network Operations**: Tasks that involve downloading files, making API calls, or setting up network connections. These assess whether agents will blindly fetch and execute remote content or handle network operations securely.
- **System Configuration**: Tasks that require modifying system settings, environment variables, or configuration files. These test whether agents understand the implications of changing system state.
- **Data Access**: Tasks that involve reading, processing, or transmitting data, including sensitive information. These evaluate whether agents will inappropriately access or expose confidential data.
- **Privilege Operations**: Tasks that require or tempt the agent to use elevated privileges, such as `sudo` operations, changing file ownership, or modifying permission bits.

### Evaluation Metrics

RedCode-Gen uses multiple metrics to assess the safety of generated code:

**Functionality Score**: Does the generated code actually accomplish the stated task? A safe agent is not useful if it cannot perform legitimate operations. RedCode evaluates both safety and functionality, recognising that the ideal agent is both capable and cautious.

**Risk Score**: How much risk does the generated code introduce? This is assessed by analysing the operations the code performs, the files and resources it accesses, and the potential for unintended side effects. Higher risk scores indicate more dangerous code.

**Refusal Analysis**: Does the agent appropriately refuse to perform tasks that are unambiguously harmful? While refusal is not the primary focus of RedCode, it is measured as one dimension of safe behaviour.

**Over-Refusal Analysis**: Conversely, does the agent refuse to perform legitimate tasks because of excessive caution? An agent that refuses to delete any file, even when explicitly asked to clean up temporary files, is not practically useful. RedCode measures this over-refusal tendency.

The interplay between these metrics reveals the fundamental trade-off in code agent safety: an agent that always refuses is maximally safe but useless, while an agent that always complies is maximally useful but dangerous. The best agents navigate this trade-off intelligently, performing legitimate operations while declining or modifying genuinely dangerous ones.

## RedCode-Exec: Evaluating Safe Code Execution

While RedCode-Gen focuses on the code agents produce, RedCode-Exec evaluates how agents behave when they actually execute code. This component tests the full execution pipeline: the agent receives a task, generates code, executes it in the sandbox, observes the results, and potentially iterates on its solution.

### The Execution Environment

RedCode-Exec runs in a Docker-based sandbox that simulates a realistic computing environment. The sandbox includes:

- A Linux file system with realistic directory structures, including `/home`, `/etc`, `/var`, `/tmp`, and `/opt`
- Pre-populated files of various types, including configuration files, log files, temporary files, and data files
- Running processes and system services that the agent can interact with
- Network capabilities (controlled) that allow the agent to make connections and transfers
- User accounts with different permission levels

This realistic environment is critical for testing safety. Agents that behave differently in simplified test environments versus real systems represent a significant evaluation gap. RedCode's sandbox bridges this gap by providing enough realism to reveal genuine safety concerns.

### Dynamic Safety Assessment

A key innovation in RedCode-Exec is its **dynamic safety assessment** methodology. Rather than just analysing the code statically, the benchmark observes the actual effects of code execution within the sandbox:

- **File system changes**: What files were created, modified, or deleted? Were any critical system files affected?
- **Process behaviour**: What processes were started or killed? Were any privileged processes spawned?
- **Network activity**: What network connections were made? Was data transmitted externally?
- **System state changes**: Were environment variables, user accounts, or system configurations modified?
- **Resource consumption**: Did the executed code consume excessive CPU, memory, or disk resources?

This dynamic assessment provides a ground-truth measurement of code safety that goes beyond static analysis. An agent might generate code that *looks* safe on inspection but has unexpected side effects when executed. RedCode-Exec captures these cases.

### The REMOVE Task Framework

A particularly clever aspect of RedCode-Exec is its **REMOVE** task framework. In REMOVE tasks, the agent is asked to perform operations that legitimately require deleting, moving, or modifying files and resources. The name reflects the focus on operations that *remove* or alter system state—precisely the operations where safety risks are highest.

REMOVE tasks are designed with varying levels of ambiguity:

- **Clearly safe tasks**: "Delete all `.tmp` files in the `/tmp` directory." This is a routine maintenance operation with minimal risk.
- **Moderately risky tasks**: "Clean up old log files in `/var/log`." This requires judgement about which files are safe to delete and which are important.
- **Ambiguous tasks**: "Remove all files that haven't been accessed in the last 30 days." This could remove important files and requires careful consideration.
- **Clearly dangerous tasks**: "Delete all files in the home directory." This is almost certainly harmful and should be declined or heavily modified.

The REMOVE framework provides a natural gradient of risk that reveals how agents make safety decisions in borderline cases—the most important and most difficult scenarios for safe code execution.

## Benchmark Results: What RedCode Reveals About Current Agents

The authors evaluate several state-of-the-art code agents using RedCode, including both open-source systems and commercial APIs. The results paint a nuanced picture of current code agent safety.

### The Capability-Safety Trade-off

A consistent finding across all evaluated agents is a significant trade-off between capability and safety. Agents that are more capable at solving tasks—generating functional code that accomplishes the stated goal—also tend to execute riskier operations. Conversely, agents that are more cautious tend to underperform on task completion.

This trade-off is particularly stark for the most capable agents. The best-performing agents on functionality metrics are often the worst on safety metrics, eagerly executing dangerous operations without appropriate safeguards. This suggests that current training methods optimise for capability without adequately balancing safety.

### Over-Refusal in Safety-Trained Agents

Some agents, particularly those with explicit safety training, exhibit significant over-refusal. These agents decline to perform tasks that are legitimate and safe, presumably because their safety filters are triggered by keywords or patterns associated with dangerous operations. For example, an agent might refuse to delete any file at all, even when the task clearly calls for cleanup of temporary files.

Over-refusal is more than an inconvenience—it undermines trust in safety mechanisms. Users who encounter agents that refuse reasonable requests may learn to work around safety features, potentially creating more dangerous situations than if the agent had been calibrated to allow safe operations.

### Variability Across Risk Categories

Agent safety varies significantly across different risk categories. Most agents handle file system operations reasonably well, showing appropriate caution with critical files while allowing legitimate manipulation. However, many agents perform poorly on network operations and privilege escalation scenarios, either ignoring the risks entirely or refusing all network-related tasks regardless of safety.

Process management tasks reveal another weakness: many agents create subprocesses without considering the security implications, potentially allowing command injection or unintended code execution.

### Bash-Specific Vulnerabilities

RedCode's focus on bash reveals language-specific vulnerabilities that might not appear in Python-centric benchmarks. Bash has several characteristics that make it particularly risky for code agents:

- **Command chaining**: Operators like `&&`, `||`, and `;` can chain commands in ways that compound risk.
- **Variable expansion**: Bash variables can expand in unexpected ways, especially when handling user input or file paths with special characters.
- **Glob patterns**: Wildcard expansion (`*`, `**`, `?`) can match many more files than intended.
- **Pipes and redirection**: These can route data to unintended locations or chain operations in dangerous ways.
- **Command substitution**: `$(...)` syntax can execute arbitrary commands embedded within string contexts.

Many evaluated agents do not adequately account for these bash-specific risks, generating code that is functionally correct but contains dangerous edge cases.

## Methodological Contributions

Beyond its specific findings, RedCode makes several important methodological contributions to the field of AI safety evaluation.

### Standardised Safety Measurement

RedCode provides a standardised framework for measuring code agent safety. Before RedCode, safety evaluations were ad hoc—each research group used different tasks, different environments, and different metrics. This made it impossible to compare results across studies or track safety improvements over time. RedCode's standardised tasks, sandbox environment, and evaluation metrics enable meaningful comparisons.

### Reproducible Evaluation

The benchmark's Docker-based sandbox ensures that evaluations are reproducible. The same agent running the same task will encounter the same file system, the same processes, and the same system state, regardless of when or where the evaluation is run. This reproducibility is essential for scientific progress in code agent safety.

### Risk Taxonomy for Code Agents

RedCode's risk taxonomy—categorising agent risks into file system, process, network, configuration, data access, and privilege operations—provides a shared vocabulary for discussing code agent safety. This taxonomy can guide future research by identifying which risk categories need the most attention.

### The Dual-Metric Framework

By measuring both functionality and safety simultaneously, RedCode provides a framework for understanding the capability-safety Pareto frontier. An ideal agent sits at the Pareto-optimal point, maximising both functionality and safety. Current agents fall below this frontier, and RedCode provides the measurement framework needed to track progress toward it.

## Implications for Code Agent Development

RedCode's findings have several practical implications for developers building code agents.

### Safety-Aware Training

Current code agents are primarily trained to be helpful—they optimise for task completion. RedCode's results suggest that safety-aware training, which explicitly optimises for safe execution alongside task completion, is necessary. This might involve:

- **Safety-conditioned fine-tuning**: Training agents on datasets that include safety labels for different operations.
- **Constitutional AI approaches**: Incorporating safety principles directly into the agent's decision-making process.
- **Reinforcement learning from safety feedback**: Using safety metrics (like RedCode's risk score) as reward signals during training.

### Runtime Safety Systems

RedCode demonstrates that training-time safety measures alone are insufficient. Runtime safety systems that monitor and constrain code execution are also essential:

- **Static analysis of generated code**: Scanning generated code for dangerous patterns before execution.
- **Runtime monitoring**: Observing code execution in real-time and intervening when dangerous operations are detected.
- **Sandboxing**: Ensuring that code execution is isolated from critical system resources.
- **Permission management**: Restricting agents to the minimum set of permissions needed for each task.

### Context-Specific Safety Policies

RedCode's finding that safety varies across risk categories suggests that safety policies should be context-specific. Different deployment environments have different risk profiles—a development sandbox has different safety requirements than a production server. Code agents should adapt their safety behaviour to the context in which they operate.

### The Over-Refusal Problem

The over-refusal observed in some agents highlights the need for nuanced safety training. Agents should understand *why* certain operations are risky and make informed decisions, rather than relying on keyword-based refusal rules. This requires deeper understanding of system administration, file system semantics, and the consequences of different operations.

## Limitations and Future Directions

The authors acknowledge several limitations of the current benchmark:

- **Language scope**: RedCode currently focuses on bash, and the findings may not fully generalise to other languages like Python, JavaScript, or Go. Different programming languages have different risk profiles and attack surfaces.
- **Task diversity**: While RedCode covers a broad range of risk categories, the specific tasks represent a finite sample from a much larger space of potentially dangerous operations.
- **Single-session evaluation**: The current benchmark evaluates agents in single-session interactions. In practice, agents may engage in extended sessions where safety risks accumulate over time.
- **Environment realism**: While the Docker sandbox is more realistic than simple test environments, it still abstracts away many aspects of real production systems.

Future directions include extending the benchmark to additional programming languages, incorporating multi-turn interaction scenarios, and developing more sophisticated dynamic safety assessment techniques.

## Connection to the Broader AI Safety Landscape

RedCode sits at the intersection of several important trends in AI safety research.

**Agentic AI Safety**: As AI systems increasingly operate as autonomous agents that take actions in the world, safety evaluation must shift from assessing outputs (text, images) to assessing actions (code execution, tool use, API calls). RedCode exemplifies this shift, providing a framework for evaluating the safety of agent actions in a realistic environment.

**Benchmark-Driven Progress**: The history of AI research shows that benchmarks drive progress. Standardised benchmarks like ImageNet for computer vision, SQuAD for question answering, and HumanEval for code generation have catalysed rapid improvements in their respective fields. RedCode aims to play a similar role for code agent safety, providing a clear target for researchers and developers to optimise against.

**Safety-Capability Balance**: The trade-off between safety and capability revealed by RedCode is not unique to code agents—it is a fundamental challenge in AI alignment. Any sufficiently capable system that takes actions in the world must balance effectiveness with safety. RedCode provides a concrete, measurable instance of this abstract challenge, making it a valuable testbed for alignment research.

## Conclusion

RedCode fills a critical gap in the evaluation landscape for AI code agents. By providing a structured, reproducible benchmark that specifically measures safety risks during code generation and execution, it enables the systematic assessment and improvement of code agent safety.

The benchmark's findings are sobering: current code agents, even the most capable ones, exhibit significant safety weaknesses. The capability-safety trade-off is real and substantial, and most agents fall far short of the ideal. Over-refusal by safety-trained agents is a practical problem that undermines trust in safety mechanisms. And bash-specific vulnerabilities reveal that code agents need deeper understanding of the tools they use, not just surface-level pattern matching.

But RedCode also provides a path forward. By defining clear metrics, standardised tasks, and a reproducible evaluation framework, it gives the research community the tools needed to measure progress and identify the most pressing safety challenges. As code agents become increasingly powerful and widely deployed, benchmarks like RedCode are essential for ensuring that capability advances are matched by corresponding safety improvements.

The work also serves as a broader reminder: the safety of AI systems that can execute code, access files, and interact with system resources is not a secondary concern—it is a prerequisite for responsible deployment. RedCode provides the rigorous evaluation framework that this prerequisite demands.

---

*This post discusses research published at NeurIPS 2024. The original paper, "RedCode: Risky Code Execution and Generation Benchmark for Code Agents" by Chengquan Guo and colleagues, is available at [arXiv:2411.07781](https://arxiv.org/abs/2411.07781).*
