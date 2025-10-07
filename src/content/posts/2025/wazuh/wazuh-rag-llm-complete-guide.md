---
author: Anubhav Gain
pubDatetime: 2025-03-02T10:00:00+05:30
modDatetime: 2025-10-04T14:00:00+05:30
title: "Complete Guide to Wazuh LLM and RAG: AI-Powered Security Analysis and Documentation"
slug: wazuh-rag-llm-complete-guide
featured: true
draft: false
tags:
  - Wazuh
  - LLM
  - RAG
  - Machine-Learning
  - Security-Analysis
  - Ollama
  - Llama-3.1
  - SOC
  - SIEM
  - Incident-Response
  - MITRE-ATT&CK
  - AI
  - Cybersecurity
  - Threat-Detection
  - Log-Analysis
  - Fine-Tuning
  - Retrieval-Augmented-Generation
  - ChromaDB
  - LangChain
  - NLP
category: AI-Security
description: Complete guide to implementing AI-powered Wazuh security analysis using fine-tuned LLMs and RAG. Learn to build intelligent SOC automation with Llama 3.1, implement retrieval-augmented generation for documentation, and create comprehensive security analysis workflows.
---

# Complete Guide to Wazuh LLM and RAG: AI-Powered Security Analysis and Documentation

## Introduction

The convergence of artificial intelligence and cybersecurity is transforming how Security Operations Centers (SOCs) handle security events. This comprehensive guide covers two powerful approaches to AI-enhanced Wazuh security analysis:

1. **Fine-Tuned LLM for Security Events**: Using specialized Llama 3.1 models trained specifically for Wazuh event analysis
2. **RAG for Documentation**: Implementing Retrieval-Augmented Generation to intelligently query Wazuh documentation

By combining these approaches, you can create a powerful AI-assisted security analysis platform that provides both real-time event analysis and instant access to relevant documentation.

## Table of Contents

## Part 1: Wazuh LLM - Fine-Tuned Security Analysis

### Why Specialized Security Analysis Matters

In the cybersecurity world, SOC specialists deal with massive streams of security events daily. Analyzing each alert requires deep knowledge, experience, and time. General-purpose language models like GPT or base Llama have broad knowledge but don't specialize in specific tasks.

For security event analysis, you need:

#### Deep Wazuh Understanding
The model must know the event structure, rules, severity levels, and the context of Wazuh as a SIEM system.

#### MITRE ATT&CK Knowledge
The ability to map events to tactics and techniques from the MITRE ATT&CK framework is critical for understanding attack chains.

#### Practical Recommendations
It's not enough to just describe the problem — the model must suggest concrete actions for incident response.

#### Risk Assessment
The model should evaluate threat severity and prioritize response efforts.

### Introducing Wazuh LLM Models

I've developed **Wazuh LLM** — fine-tuned versions of Llama 3.1 8B, specifically trained for analyzing Wazuh security events. These models are available through Ollama as `mranv/siem-llama-3.1` with both base and v1 versions.

### Key Capabilities: AI-Powered Security Analysis

Wazuh LLM provides structured security event analysis that includes:

#### 🎯 Rule Level Determination
Automatic classification of event severity from low to critical level.

#### 🔍 Event Type Identification
Determining the incident category — from brute force attempts to rootkit detection.

#### 📝 Detailed Reasoning
Comprehensive explanation of why this event represents a threat and what attack mechanism might be employed.

#### ⚠️ Risk Assessment
Analysis of potential system impact considering context and possible consequences.

#### 🛡️ Action Recommendations
Specific steps for incident response, including technical measures and investigation procedures.

#### 🔬 Investigation Guidance
Advice for further incident analysis and searching for indicators of compromise.

#### 🗺️ MITRE ATT&CK Mapping
Automatic correlation of events to tactics and techniques from the MITRE ATT&CK framework.

#### 🌍 Multilingual Support
Analysis support in English, Russian, and other languages, making the model useful for international security teams.

### Real-World Security Analysis Examples

Let's explore practical examples of using Wazuh LLM.

#### Example 1: SSH Connection Attempt Analysis

**Query:**

```bash
ollama run mranv/siem-llama-3.1:v1 "Analyze this Wazuh alert: SSH login from 192.168.1.100 to root account"
```

**Model Response:**

```
Rule Level: 12 - High importance event

Event Type: Unauthorized SSH Login

Detailed Reasoning: There has been an unauthorized SSH login attempt from
the IP address 192.168.1.100 to the system's root account. This is a high
priority event as it indicates potential compromise of the system.

Risk Assessment: Medium to High Risk - An unauthorized SSH login attempt to
the root account may indicate successful exploitation of a vulnerability,
brute force attack, or other malicious activity. If left unchecked, this
could lead to data breaches, system compromise, service disruption, and
other security incidents.

Recommended Actions: Block the source IP 192.168.1.100 at the firewall level,
change the root password, review system logs for further indicators of
compromise, and run a full system scan with an antivirus program.

Investigation Guidance: Review SSH login history for suspicious activity,
check for any successful logins from the same source IP, review system
configuration for security vulnerabilities, and monitor system performance
for signs of compromise.

MITRE ATT&CK: T1078 - Valid Accounts (possible)
```

#### Example 2: Malware Detection Analysis

**Query with JSON:**

```bash
ollama run mranv/siem-llama-3.1:v1 '{
  "timestamp": "2025-01-15T14:00:00Z",
  "agent": {"id": "000", "name": "malware_detection-00", "ip": "10.0.0.100"},
  "rule": {
    "id": "600",
    "level": 13,
    "description": "Rootkit detected in system",
    "groups": ["rootkit", "malware", "attack"],
    "category": "malware_detection",
    "mitre": {"id": ["T1014"], "tactic": ["Defense Evasion"]}
  },
  "data": {
    "severity": "high",
    "file": "/tmp/malware_0.exe",
    "malware_name": "Trojan.Generic",
    "action": "quarantined",
    "scanner": "ClamAV"
  },
  "location": "/var/log/malware_detection/security.log"
}'
```

**Model Response:**

```
Rule Level: 13 - Unusual error

Event Type: Rootkit Detection

Detailed Reasoning: Rule 600 triggered due to detection of rootkit in system.
This indicates potential for malicious activity and requires investigation.

Risk Assessment: Medium risk - Rootkits can indicate presence of other malware,
compromise system integrity, and provide backdoor access for attackers.

Recommended Actions: Quarantine the detected file (/tmp/malware_0.exe) and
notify incident response team. Review system logs for any suspicious activity.
Run full system scan with anti-malware software to ensure thorough cleaning.

Investigation Guidance: Document event details, review system configuration
for vulnerabilities, check for signs of lateral movement, and report findings
to incident response team.

MITRE ATT&CK: T1014 (Rootkit)
```

#### Example 3: Brute Force Attack Detection

**Query:**

```bash
ollama run mranv/siem-llama-3.1:v1 "Analyze: 100+ SSH connection attempts detected in 5 minutes"
```

**Model Response:**

```
Rule Level: 12 - High importance event

Event Type: Brute Force Attack

Detailed Reasoning: Multiple SSH connection attempts may indicate a brute
force attack on the system where an attacker tries to guess user passwords
using various character combinations.

Risk Assessment: High risk - If the attacker successfully guesses the
password, they will be able to gain access to the system and cause harm.

Recommended Actions: Increase password complexity requirements, enable
two-factor authentication (2FA) for additional protection. System administrator
should also consider blocking IP addresses from which attacking requests are
coming.

Investigation Guidance: Check system logs for other attacks and verify user
passwords for security. The source of the attack should also be identified
and reported to appropriate authorities.

MITRE ATT&CK: T1110 - Brute Force
```

### Installation and Deployment

#### Installing Ollama

**Linux and macOS:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download the installer from the official Ollama website.

**Docker:**

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

#### Downloading Wazuh LLM Models

**Base Model:**
```bash
ollama pull mranv/siem-llama-3.1:base
```

**V1 Model (Recommended):**
```bash
ollama pull mranv/siem-llama-3.1:v1
```

#### Running the Model

**Interactive Mode:**

```bash
ollama run mranv/siem-llama-3.1:v1
```

**Analyze Specific Alert:**

```bash
ollama run mranv/siem-llama-3.1:v1 "Your query or Wazuh event JSON"
```

#### API Usage

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mranv/siem-llama-3.1:v1",
  "prompt": "Analyze this Wazuh alert: Multiple failed login attempts from 10.0.0.50",
  "stream": false
}'
```

#### Python Integration

```python
import requests
import json

def analyze_security_log(log_data):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={
            'model': 'mranv/siem-llama-3.1:v1',
            'prompt': f"Analyze this Wazuh log: {log_data}",
            'stream': False
        }
    )
    return response.json()

# Example usage
log = {
    "timestamp": "2025-01-15T14:00:00Z",
    "rule": {
        "id": "5710",
        "level": 5,
        "description": "sshd: Attempt to login using a non-existent user"
    },
    "data": {
        "srcip": "192.168.1.100",
        "dstuser": "admin"
    }
}

result = analyze_security_log(json.dumps(log))
print(result['response'])
```

## Part 2: RAG for Wazuh Documentation

### Introduction to Retrieval-Augmented Generation

Retrieval-Augmented Generation (RAG) is a method that allows the use of information from various sources to generate more accurate and useful responses to questions. In the context of Wazuh, RAG can be used to:

- 📚 **Automate data processing**: Efficiently process large documentation sets
- 🔍 **Optimize access to information**: Quickly retrieve relevant documentation
- 💡 **Improve information retrieval**: Provide context-aware answers
- 🎯 **Enhance accuracy**: Ground responses in official documentation

### Prerequisites and Environment Setup

#### Required Tools

- Ollama runtime
- Python v3.9 or higher
- Basic Python programming knowledge
- Wazuh documentation in PDF format

#### System Requirements

- Minimum 8GB RAM (16GB recommended for larger models)
- 10GB free disk space for models and vector database
- Modern CPU (GPU optional but beneficial)

### Preparing Wazuh Documentation

#### Evaluating the Current Documentation

The Wazuh documentation uses Sphinx as a documentation generator. This allows you to compile the documentation locally and use it for RAG.

#### Compiling Documentation Using Docker

**Step 1: Create Compilation Directory**

```bash
mkdir wazuh-documentation-rag
cd wazuh-documentation-rag
```

**Step 2: Download Wazuh Documentation**

```bash
git clone https://github.com/wazuh/wazuh-documentation.git -b v4.11.0
```

**Step 3: Create Dockerfile**

Create a file named `Dockerfile`:

```dockerfile
# Use the base image with Python 3.9
FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy the dependencies to the /tmp/requirements.txt folder
COPY wazuh-documentation/requirements.txt /tmp/requirements.txt

# Install the dependencies
RUN pip install -r /tmp/requirements.txt

CMD ["sleep", "infinity"]
```

**Step 4: Create docker-compose.yml**

```yaml
services:
  wazuh-docs:
    build: .
    volumes:
      - ./wazuh-documentation:/app/wazuh-documentation
```

**Step 5: Build and Compile**

```bash
# Build the container
docker compose up -d --build

# Connect to the container
docker compose exec -it wazuh-docs bash

# Compile documentation
cd /app/wazuh-documentation && make singlehtml

# Wait for compilation to complete
# Exit the container
exit

# Navigate to compiled docs
cd wazuh-documentation/build/singlehtml/

# Convert to PDF (requires wkhtmltopdf)
wkhtmltopdf index.html wazuh.pdf
```

### Building the RAG System

#### Installing Python Dependencies

Create `requirements.txt`:

```txt
chromadb==0.6.3
unstructured==0.16.14
langchain==0.3.18
langchain-text-splitters==0.3.6
unstructured[all-docs]
langchain-community==0.3.14
langchain-ollama==0.2.2
```

Install dependencies:

```bash
pip install -r requirements.txt
```

#### Downloading Required Models

```bash
# Download the text generation model
ollama pull llama3.2

# Download the embedding model
ollama pull nomic-embed-text
```

### Creating the PDF Documentation Loader

Create `upload.py`:

```python
import argparse
import os

from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma


def upload(document_path, model_name, collection_name, ollama_base_url):
    """
    Load PDF documentation and create vector embeddings

    Args:
        document_path: Path to PDF file
        model_name: Ollama embedding model name
        collection_name: ChromaDB collection name
        ollama_base_url: Ollama server URL

    Returns:
        Chroma vector store object
    """
    # Get current script path
    current_path = os.path.dirname(os.path.realpath(__file__))
    chroma_persistent_directory = current_path + "/data"

    # Create data directory if it doesn't exist
    if not os.path.exists(chroma_persistent_directory):
        os.makedirs(chroma_persistent_directory, exist_ok=True)

    # Load PDF document
    loader = UnstructuredPDFLoader(file_path=document_path)
    data = loader.load()

    # Split text into chunks
    # chunk_size: 7500 characters per chunk
    # chunk_overlap: 100 characters overlap between chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=7500,
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(data)

    # Create vector embeddings and store in ChromaDB
    vector = Chroma.from_documents(
        documents=chunks,
        embedding=OllamaEmbeddings(
            base_url=ollama_base_url,
            model=model_name,
            show_progress=True
        ),
        collection_name=collection_name,
        persist_directory=chroma_persistent_directory
    )

    return vector


if __name__ == '__main__':
    # Creating argument parser
    parser = argparse.ArgumentParser(
        description='Upload a PDF to the vector store'
    )

    # Adding arguments
    parser.add_argument(
        '-p', '--path',
        type=str,
        help='Path to the PDF file',
        required=True
    )
    parser.add_argument(
        '-m', '--model',
        type=str,
        help='Name of the Ollama model for embedding',
        default='nomic-embed-text'
    )
    parser.add_argument(
        '-n', '--name',
        type=str,
        help='Collection name in ChromaDB',
        default='wazuh'
    )
    parser.add_argument(
        '-b', '--base-url',
        type=str,
        help='Base URL for the Ollama server',
        default='http://127.0.0.1:11434'
    )

    # Parsing arguments
    args = parser.parse_args()

    # Calling the upload function
    upload(
        document_path=args.path,
        model_name=args.model,
        collection_name=args.name,
        ollama_base_url=args.base_url
    )

    print(f"Successfully uploaded {args.path} to ChromaDB collection '{args.name}'")
```

#### Understanding the Upload Function

**Path Resolution:**
```python
current_path = os.path.dirname(os.path.realpath(__file__))
```
This determines the directory where the current script is located.

**Data Directory Creation:**
```python
chroma_persistent_directory = current_path + "/data"
if not os.path.exists(chroma_persistent_directory):
    os.makedirs(chroma_persistent_directory, exist_ok=True)
```
Creates a `data` directory for storing vector embeddings if it doesn't exist.

**PDF Loading:**
```python
loader = UnstructuredPDFLoader(file_path=document_path)
data = loader.load()
```
Loads the PDF document using UnstructuredPDFLoader.

**Text Chunking:**
```python
text_splitter = RecursiveCharacterTextSplitter(chunk_size=7500, chunk_overlap=100)
chunks = text_splitter.split_documents(data)
```
Splits text into 7500-character chunks with 100-character overlap for better context preservation.

**Vector Embedding Creation:**
```python
vector = Chroma.from_documents(
    documents=chunks,
    embedding=OllamaEmbeddings(
        base_url=ollama_base_url,
        model=model_name,
        show_progress=True
    ),
    collection_name=collection_name,
    persist_directory=chroma_persistent_directory
)
```
Creates vector representations and stores them in ChromaDB.

#### Running the Upload Script

```bash
# Pull the embedding model
ollama pull nomic-embed-text

# Upload your PDF
python upload.py -p /path/to/wazuh.pdf
```

The upload process may take some time depending on the PDF size.

### Creating the Query Interface

Create `ask.py`:

```python
import argparse
import os

from langchain.retrievers import MultiQueryRetriever
import chromadb
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_ollama import ChatOllama
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma


def ask_ollama(question, collection_name='wazuh',
               embedding_model='nomic-embed-text',
               local_model='llama3.2'):
    """
    Query the RAG system with a question

    Args:
        question: User question
        collection_name: ChromaDB collection name
        embedding_model: Embedding model name
        local_model: LLM model for generation

    Returns:
        Generated answer based on documentation
    """
    # Get current script path
    current_path = os.path.dirname(os.path.realpath(__file__))
    chroma_persistent_directory = current_path + "/data"

    # Initialize embedding model
    embedding = OllamaEmbeddings(model=embedding_model)

    # Connect to persistent ChromaDB
    persistent_client = chromadb.PersistentClient(
        path=chroma_persistent_directory
    )

    # Load vector database
    vector_db = Chroma(
        client=persistent_client,
        collection_name=collection_name,
        embedding_function=embedding,
    )

    # Initialize LLM
    load_ollama = ChatOllama(model=local_model)

    # Multi-query prompt template
    # This generates multiple versions of the question for better retrieval
    prompt_template = PromptTemplate(
        input_variables=["question"],
        template="""You are an AI language model assistant. Your task is to generate 2
different versions of the given user question to retrieve relevant documents from
a vector database. By generating multiple perspectives on the user question, your
goal is to help the user overcome some of the limitations of the distance-based
similarity search. Provide these alternative questions separated by newlines.
Original question: {question}""",
    )

    # Answer generation template
    template = """Answer the question based ONLY on the following context:
{context}
Question: {question}
"""

    # Create multi-query retriever
    retriever = MultiQueryRetriever.from_llm(
        vector_db.as_retriever(),
        load_ollama,
        prompt=prompt_template
    )

    # Create chat prompt
    prompt = ChatPromptTemplate.from_template(template)

    # Build RAG chain
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | load_ollama
        | StrOutputParser()
    )

    return chain.invoke(question)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Ask Ollama a question')
    parser.add_argument(
        '-q', '--question',
        type=str,
        help='The question to ask Ollama',
        required=True
    )
    parser.add_argument(
        '-c', '--collection',
        type=str,
        help='ChromaDB collection name',
        default='wazuh'
    )
    parser.add_argument(
        '-e', '--embedding',
        type=str,
        help='Embedding model name',
        default='nomic-embed-text'
    )
    parser.add_argument(
        '-m', '--model',
        type=str,
        help='LLM model name',
        default='llama3.2'
    )

    args = parser.parse_args()

    print(ask_ollama(
        args.question,
        collection_name=args.collection,
        embedding_model=args.embedding,
        local_model=args.model
    ))
```

#### Understanding the RAG Query System

**Multi-Query Retrieval:**

The system generates multiple versions of the user's question to overcome limitations of distance-based similarity search. This improves retrieval accuracy.

**Context-Based Generation:**

The LLM generates answers based ONLY on the retrieved context from the documentation, preventing hallucinations.

**RAG Chain:**

```python
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | load_ollama
    | StrOutputParser()
)
```

This creates a pipeline that:
1. Retrieves relevant context
2. Formats the prompt with context and question
3. Generates answer using LLM
4. Parses the output

#### Running the Query Script

```bash
python ask.py -q "What is Wazuh and what is it used for?"
```

**Sample Response:**

```
Wazuh is an open-source log management system that provides real-time
monitoring and alerting capabilities for security, compliance, and IT
operations.

Wazuh acts as a bridge between the host operating system and external
threat intelligence feeds, allowing users to collect, process, and
analyze log data from various sources. This enables users to:

1. Monitor security events: Wazuh collects and analyzes log data from
   various sources (e.g., system logs, application logs, and network
   devices) to identify potential security threats and anomalies.

2. Detect vulnerabilities: By integrating with external threat
   intelligence feeds, Wazuh can detect known vulnerabilities in the
   environment and alert users to take corrective action.

3. Enforce compliance: Wazuh supports various compliance frameworks
   (e.g., PCI-DSS, HIPAA/HITECH, GDPR) by providing features for
   logging, auditing, and reporting on security-related data.

Overall, Wazuh helps organizations proactively manage their security
posture, detect potential threats, and maintain regulatory compliance.
```

## Part 3: Combining LLM and RAG for Enhanced Security Operations

### Unified Security Analysis Workflow

By combining the fine-tuned Wazuh LLM with RAG-powered documentation access, you can create a comprehensive security analysis workflow:

```python
import requests
import json
from ask import ask_ollama

def comprehensive_security_analysis(security_event):
    """
    Perform comprehensive security analysis using both LLM and RAG

    Args:
        security_event: Wazuh security event (dict or string)

    Returns:
        Complete analysis with event assessment and documentation references
    """
    # Step 1: Analyze the event with fine-tuned LLM
    event_prompt = f"Analyze this Wazuh event: {json.dumps(security_event)}"

    llm_analysis = requests.post(
        'http://localhost:11434/api/generate',
        json={
            'model': 'mranv/siem-llama-3.1:v1',
            'prompt': event_prompt,
            'stream': False
        }
    ).json()

    # Step 2: Extract key terms for documentation lookup
    # (In production, use NLP to extract relevant terms)
    event_type = "brute force"  # Example extracted term

    # Step 3: Query RAG for relevant documentation
    doc_query = f"How to detect and respond to {event_type} attacks in Wazuh?"
    rag_response = ask_ollama(doc_query)

    # Step 4: Combine results
    return {
        "event_analysis": llm_analysis['response'],
        "documentation": rag_response,
        "timestamp": security_event.get('timestamp', 'N/A')
    }


# Example usage
event = {
    "timestamp": "2025-03-02T10:00:00Z",
    "rule": {
        "id": "5710",
        "level": 10,
        "description": "Brute force attack detected"
    },
    "data": {
        "srcip": "203.0.113.5",
        "attempts": 150
    }
}

result = comprehensive_security_analysis(event)
print("=== EVENT ANALYSIS ===")
print(result["event_analysis"])
print("\n=== RELEVANT DOCUMENTATION ===")
print(result["documentation"])
```

### SOC Dashboard Integration

Create a simple dashboard for security analysts:

```python
from flask import Flask, request, jsonify, render_template
import requests
from ask import ask_ollama

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/analyze', methods=['POST'])
def analyze_event():
    """Analyze security event endpoint"""
    event_data = request.json

    # Analyze with LLM
    llm_response = requests.post(
        'http://localhost:11434/api/generate',
        json={
            'model': 'mranv/siem-llama-3.1:v1',
            'prompt': f"Analyze: {json.dumps(event_data)}",
            'stream': False
        }
    ).json()

    return jsonify({
        'analysis': llm_response['response'],
        'event': event_data
    })

@app.route('/docs', methods=['POST'])
def query_docs():
    """Query documentation endpoint"""
    question = request.json.get('question')
    answer = ask_ollama(question)

    return jsonify({
        'question': question,
        'answer': answer
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Technical Specifications

### Wazuh LLM Models

| Specification | Details |
|--------------|---------|
| **Base Model** | Meta Llama 3.1 8B Instruct |
| **Model Size** | 4.7 GB |
| **Format** | GGUF (quantized Q4_0) |
| **Context Window** | 128K tokens |
| **RAM Requirements** | Minimum 8 GB, Recommended 16 GB |
| **Languages** | English, Russian, Finnish, and more |
| **Specialization** | Wazuh SIEM analysis, incident response |

### RAG System Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Vector Store** | ChromaDB | Persistent vector storage |
| **Embeddings** | nomic-embed-text | Document vectorization |
| **LLM** | Llama 3.2 | Answer generation |
| **Framework** | LangChain | RAG orchestration |
| **Loader** | UnstructuredPDFLoader | PDF processing |

## Model Comparison

| Feature | Base Model | V1 Model | RAG System |
|---------|-----------|----------|------------|
| **Version** | mranv/siem-llama-3.1:base | mranv/siem-llama-3.1:v1 | llama3.2 + nomic-embed-text |
| **Size** | 4.7 GB | 4.7 GB | Variable |
| **Context** | 128K tokens | 128K tokens | 128K tokens |
| **MITRE Mapping** | ✓ | ✓ Enhanced | N/A |
| **Analysis Depth** | Standard | Improved | Documentation-based |
| **Use Case** | Event analysis | Event analysis | Documentation queries |
| **Status** | Stable | Recommended | Production-ready |

## Best Practices

### For LLM Security Analysis

1. **Provide Context**: Include complete JSON structure of Wazuh events for accurate analysis
2. **Use as Starting Point**: Treat analysis as recommendations, not final conclusions
3. **Keep Updated**: Regularly update to latest model versions
4. **Combine Tools**: Use alongside other security tools for comprehensive analysis

### For RAG Documentation System

1. **Quality Documentation**: Ensure PDF documentation is current and complete
2. **Chunk Sizing**: Adjust chunk_size based on your documentation structure
3. **Regular Updates**: Re-upload documentation when it changes
4. **Query Optimization**: Use specific, detailed questions for better results

### For Combined Workflows

1. **Event Correlation**: Use LLM analysis to identify key terms for RAG queries
2. **Automated Workflows**: Create scripts to automate analysis and documentation lookup
3. **Team Training**: Train SOC teams on both systems for maximum effectiveness
4. **Monitoring**: Track query performance and accuracy for continuous improvement

## Performance Optimization

### GPU Acceleration

```bash
# Use GPU for faster inference
OLLAMA_GPU=1 ollama run mranv/siem-llama-3.1:v1
```

### Memory Management

```bash
# Adjust context size for memory constraints
ollama run mranv/siem-llama-3.1:v1 --num-ctx 4096 "Analyze..."
```

### Batch Processing

```bash
# Process multiple security events
cat security_events.json | while read event; do
  ollama run mranv/siem-llama-3.1:v1 "$event"
done
```

### RAG Optimization

```python
# Adjust chunk size for better performance
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=5000,  # Smaller chunks for faster retrieval
    chunk_overlap=200  # More overlap for better context
)
```

## SOC Use Cases and Scenarios

### Scenario 1: Real-Time Alert Analysis

A SOC analyst receives a critical alert. They:

1. Send the event to Wazuh LLM for immediate analysis
2. Receive structured analysis with MITRE ATT&CK mapping
3. Query RAG system for response procedures
4. Execute recommended actions

### Scenario 2: Incident Investigation

During incident investigation, analysts:

1. Analyze multiple related events using LLM
2. Query documentation for forensic procedures
3. Build attack timeline from analysis results
4. Generate incident report combining both outputs

### Scenario 3: Training and Knowledge Transfer

New SOC analysts:

1. Use RAG system to learn Wazuh capabilities
2. Practice with LLM analyzing sample events
3. Compare LLM recommendations with documentation
4. Build expertise through interactive learning

### Scenario 4: Compliance Reporting

For compliance requirements:

1. LLM analyzes security events for compliance violations
2. RAG provides relevant compliance documentation
3. Automated reports combine both sources
4. Audit trails maintained for review

## Wazuh LLM vs Commercial AI Solutions

### Specialization vs. Universality

General models like GPT-4 have broad knowledge but lack Wazuh-specific training. Wazuh LLM provides domain-specific expertise.

### Local Deployment

Unlike cloud solutions, both systems run locally, ensuring:
- Complete data privacy
- No external data transmission
- Full infrastructure control
- Zero cloud API costs

### Cost Efficiency

- **Wazuh LLM**: Free, unlimited usage
- **RAG System**: Free, one-time setup
- **Commercial APIs**: Expensive at scale

### Customization

Both systems can be:
- Fine-tuned on your specific data
- Customized for your environment
- Extended with additional capabilities

## Troubleshooting

### Common LLM Issues

**Slow Response Times:**
```bash
# Use smaller context window
ollama run mranv/siem-llama-3.1:v1 --num-ctx 2048 "query"
```

**Out of Memory:**
```bash
# Ensure sufficient RAM
free -h
# Close other applications
# Consider using base model instead of v1
```

### Common RAG Issues

**Upload Fails:**
```bash
# Check PDF file path
ls -la /path/to/wazuh.pdf

# Verify Ollama is running
curl http://localhost:11434/api/tags

# Check dependencies
pip list | grep -E "chromadb|langchain"
```

**Poor Retrieval Quality:**
```python
# Adjust chunk size
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=10000,  # Larger chunks
    chunk_overlap=500   # More overlap
)
```

## Future Enhancements

### Planned LLM Improvements

- 🔄 Expanded support for all Wazuh rule types
- 🔄 Deeper MITRE ATT&CK integration
- 🔄 Improved event correlation
- 🔄 Automatic incident report generation
- 🔄 Enhanced multilingual capabilities

### Planned RAG Improvements

- 🔄 Multi-document support
- 🔄 Automatic documentation updates
- 🔄 Advanced semantic search
- 🔄 Query history and analytics
- 🔄 Integration with Wazuh API

## Conclusion

The combination of fine-tuned Wazuh LLMs and RAG-powered documentation access creates a powerful AI-assisted security operations platform. This comprehensive approach provides:

### Key Benefits

- 🎯 **Specialized Security Analysis**: Domain-specific event analysis with MITRE ATT&CK mapping
- 📚 **Intelligent Documentation**: Instant access to relevant Wazuh documentation
- 🔒 **Privacy-Focused**: Complete local deployment without cloud dependencies
- 💰 **Cost-Effective**: Free, unlimited usage of all components
- 🌍 **Multilingual**: Support for international security teams
- 🔗 **Integration-Ready**: Easy API access for automation
- 📊 **Comprehensive**: Combined event analysis and documentation lookup

### Getting Started Checklist

- [ ] Install Ollama
- [ ] Pull Wazuh LLM models (base and v1)
- [ ] Pull RAG models (llama3.2 and nomic-embed-text)
- [ ] Compile Wazuh documentation to PDF
- [ ] Set up Python environment with dependencies
- [ ] Upload documentation to vector store
- [ ] Test LLM with sample security events
- [ ] Test RAG with documentation queries
- [ ] Integrate into your SOC workflow

## Resources

### Model Downloads

```bash
# Wazuh LLM Models
ollama pull mranv/siem-llama-3.1:base
ollama pull mranv/siem-llama-3.1:v1

# RAG Models
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Documentation Links

- [Wazuh Documentation GitHub](https://github.com/wazuh/wazuh-documentation)
- [Ollama Documentation](https://ollama.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)

### Quick Reference Commands

```bash
# LLM Analysis
ollama run mranv/siem-llama-3.1:v1 "Analyze: event details"

# Upload Documentation
python upload.py -p /path/to/wazuh.pdf

# Query Documentation
python ask.py -q "Your question about Wazuh"

# API Analysis
curl -X POST http://localhost:11434/api/generate \
  -d '{"model":"mranv/siem-llama-3.1:v1","prompt":"event"}'
```

---

**Note**: These systems are designed for security analysis and educational purposes. Always validate AI-generated analysis with professional security expertise and conduct thorough incident investigation.

**Last Updated**: October 4, 2025

**Author**: Anubhav Gain - Security Researcher and AI Enthusiast
