---
author: Anubhav Gain
pubDatetime: 2025-03-02T10:00:00+05:30
modDatetime: 2025-10-04T14:00:00+05:30
title: "Applying RAG for Wazuh Documentation: Complete Step-by-Step Guide"
slug: wazuh-rag-documentation-guide
featured: true
draft: false
tags:
  - DevSecOps
  - Wazuh
  - Security
  - DevOps
  - LLM
  - Ollama
  - Machine-Learning
  - Cybersecurity
  - RAG
  - Retrieval-Augmented-Generation
  - NLP
  - AI
  - Python
  - ChromaDB
  - LangChain
category: AI-Security
description: Complete guide to implementing Retrieval-Augmented Generation (RAG) for Wazuh documentation. Learn to build an intelligent documentation assistant using Ollama, LangChain, and ChromaDB for automated question-answering and knowledge retrieval.
---

# Applying RAG for Wazuh Documentation: Complete Step-by-Step Guide

## Introduction to RAG

Retrieval-Augmented Generation (RAG) is a method that allows the use of information from various sources to generate more accurate and useful responses to questions.

In the context of Wazuh, RAG can be used to automate data processing, optimize access to information, and improve information retrieval. This powerful technique combines the best of both worlds: the precision of document retrieval with the natural language capabilities of large language models.

Imagine having an intelligent assistant that can instantly answer any question about Wazuh by searching through the entire documentation and providing accurate, contextual responses. That's exactly what we'll build in this guide!

## Table of Contents

## Part 1: Understanding RAG and Planning

### What is Retrieval-Augmented Generation?

RAG is a technique that enhances the capabilities of Large Language Models (LLMs) by:

1. **Retrieval**: Finding relevant information from a knowledge base (your documentation)
2. **Augmentation**: Adding this retrieved context to the query
3. **Generation**: Using an LLM to generate accurate responses based on the retrieved information

### Why Use RAG for Wazuh Documentation?

Traditional approaches to documentation access have limitations:

- **Static Search**: Keyword-based searches miss semantic meaning
- **Manual Navigation**: Users must know exactly where to look
- **Limited Context**: Standard search doesn't understand user intent
- **No Synthesis**: Users must piece together information from multiple sources

**RAG solves these problems by:**

- 🎯 **Semantic Understanding**: Understands what users are asking, not just keywords
- 📚 **Comprehensive Answers**: Synthesizes information from multiple documentation sections
- 🔄 **Always Up-to-Date**: Easy to update knowledge base with new documentation
- 💡 **Intelligent Responses**: Provides contextual, relevant answers
- 🚀 **Instant Access**: No need to manually search through documentation

### Use Cases for Wazuh RAG

1. **Security Operations**: Quick answers about rule configuration, alert handling
2. **Compliance**: Finding specific compliance requirements and configurations
3. **Troubleshooting**: Getting solutions for common issues
4. **Integration**: Understanding how to integrate with other tools
5. **Training**: Onboarding new team members with an interactive assistant

## Preparing for RAG Integration

Before integrating RAG with the Wazuh documentation, you need to complete the following steps:

### Step 1: Evaluate the Current Documentation

Analyze the existing Wazuh documentation:

- **Location**: The Wazuh documentation is available on [Wazuh GitHub](https://github.com/wazuh/wazuh-documentation)
- **Format**: Uses Sphinx documentation generator
- **Content**: Essential information about Wazuh features, capabilities, and configurations
- **Structure**: Organized by topics, components, and use cases

This documentation contains all the information RAG will use to generate responses.

### Step 2: Collect Data

Gather all necessary data and information sources:

- Clone the Wazuh documentation repository
- Compile documentation to a usable format (HTML or PDF)
- Ensure documentation is current and complete
- Verify all sections are accessible

### Step 3: Select Tools

Determine the appropriate tools and technologies:

**Core Components:**
- **Ollama**: Local LLM runtime for embeddings and generation
- **LangChain**: Framework for building RAG pipelines
- **ChromaDB**: Vector database for storing document embeddings
- **Python**: Programming language for implementation

**Alternative Options:**
- OpenAI API (cloud-based, costs apply)
- Pinecone or Weaviate (cloud vector databases)
- Hugging Face models (alternative to Ollama)

## Evaluating the Current Wazuh Documentation

### Documentation Structure

The Wazuh documentation uses a documentation generator based on Sphinx. This allows you to:

- Compile documentation locally
- Generate various output formats (HTML, PDF, ePub)
- Use for Retrieval-Augmented Generation (RAG)
- Maintain consistency across versions

### Compilation Options

You have two main options for compiling Wazuh documentation:

1. **Local Installation**: Direct Python/pip setup
2. **Docker**: Containerized compilation (recommended)

## How to Compile Wazuh Documentation Locally

### Option 1: Using Python Directly

To compile the Wazuh documentation for subsequent use in RAG, follow these steps:

#### Prerequisites

**Ensure Python and pip are Installed:**

```bash
# Check Python version (need 3.9+)
python3 --version

# Check pip
pip3 --version
```

#### Step-by-Step Compilation

**1. Download the Wazuh Documentation:**

```bash
# Clone specific version (e.g., v4.11.0)
git clone https://github.com/wazuh/wazuh-documentation.git -b v4.11.0

# Or clone latest version
git clone https://github.com/wazuh/wazuh-documentation.git
```

**2. Navigate to the Documentation Directory:**

```bash
cd wazuh-documentation
```

**3. Install Dependencies:**

```bash
pip3 install -r requirements.txt
```

**4. Compile the Documentation:**

```bash
# Compile to HTML
make html

# Compile to single HTML file
make singlehtml

# Compile to PDF (requires LaTeX)
make latexpdf
```

Replace `output-format` with your desired format (html, singlehtml, latex, etc.).

### Option 2: Using Docker (Recommended)

Docker provides a consistent, reproducible environment for compilation.

#### Why Docker?

- ✅ No need to install Python dependencies on your system
- ✅ Consistent environment across different machines
- ✅ Easy to version control
- ✅ Isolated from system Python
- ✅ Reproducible builds

#### Step-by-Step Docker Compilation

**1. Install Docker:**

Ensure Docker is installed on your computer. Download from [docker.com](https://www.docker.com/).

**2. Create a Compilation Directory:**

```bash
mkdir wazuh-documentation-rag
cd wazuh-documentation-rag
```

**3. Download the Wazuh Documentation Repository:**

In this example, we'll use documentation for version 4.11.0:

```bash
git clone https://github.com/wazuh/wazuh-documentation.git -b v4.11.0
```

**4. Create a Dockerfile:**

In the `wazuh-documentation-rag` directory, create a file named `Dockerfile` with the following content:

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

**5. Create a docker-compose.yml File:**

In the same directory, create a file named `docker-compose.yml` to manage the Docker container:

```yaml
services:
  wazuh-docs:
    build: .
    volumes:
      - ./wazuh-documentation:/app/wazuh-documentation
```

**6. Build and Run:**

```bash
docker compose up -d --build
```

This command:
- Builds the Docker image with all dependencies
- Starts the container in detached mode
- Mounts the documentation directory

### Compiling to Single HTML Format

Unfortunately, it is currently not possible to compile the documentation directly into a PDF format using Sphinx alone. However, you can compile the document into a single HTML format and then convert it to PDF.

#### Complete Compilation Process

**1. Start the Docker container:**

```bash
docker compose up -d --build
```

**2. Connect to the container:**

```bash
docker compose exec -it wazuh-docs bash
```

**3. Compile the documentation to single HTML:**

```bash
cd /app/wazuh-documentation && make singlehtml
```

This command:
- Changes to the documentation directory
- Compiles all documentation into a single HTML file
- May take several minutes depending on system resources

**4. Wait for compilation to complete:**

You'll see output like:
```
Running Sphinx v4.5.0
loading pickled environment... done
building [mo]: targets for 0 po files that are out of date
building [singlehtml]: all documents
updating environment: 0 added, 0 changed, 0 removed
looking for now-outdated files... none found
preparing documents... done
writing... done
writing additional files... done
copying static files... done
copying extra files... done
dumping object inventory... done
build succeeded.
```

**5. Exit the container:**

```bash
exit
```

**6. Navigate to the compiled documentation:**

```bash
cd wazuh-documentation/build/singlehtml/
```

**7. (Optional) Convert the single HTML to PDF:**

Using `wkhtmltopdf` tool:

```bash
# Install wkhtmltopdf first
# macOS
brew install wkhtmltopdf

# Ubuntu/Debian
sudo apt-get install wkhtmltopdf

# CentOS/RHEL
sudo yum install wkhtmltopdf

# Convert to PDF
wkhtmltopdf index.html wazuh.pdf
```

**Note**: The PDF conversion may take time for large documentation sets.

### Verification

After compilation, verify the output:

```bash
# Check the singlehtml directory
ls -lh wazuh-documentation/build/singlehtml/

# Expected files:
# - index.html (main documentation file)
# - _static/ (CSS, JavaScript, images)
# - objects.inv (Sphinx inventory)
```

The `index.html` file contains the complete Wazuh documentation in a single page, perfect for RAG processing.

## Part 2: Building the RAG System

### Prerequisites and Environment Setup

For local RAG development, ensure you have the following requirements:

#### Required Tools

- ✅ **Ollama runtime**: Local LLM server
- ✅ **Python v3.9 or higher**: Programming environment
- ✅ **Basic Python knowledge**: Understanding of functions, libraries
- ✅ **Wazuh documentation in PDF format**: Knowledge base source

#### System Requirements

- 💾 **RAM**: Minimum 8GB (16GB recommended for larger models)
- 💿 **Disk Space**: 10GB free for models and vector database
- 🖥️ **CPU**: Modern multi-core processor (GPU optional but beneficial)
- 🌐 **Internet**: For downloading models and dependencies

### Installing and Configuring Ollama

#### Step 1: Install Ollama

**Download and install Ollama** for your operating system:

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download installer from [ollama.com](https://ollama.com)

**Verify installation:**
```bash
ollama --version
```

Expected output: `ollama version is 0.x.x`

#### Step 2: Download Required Models

We need two models for RAG:

**1. Text Generation Model (for answering questions):**

```bash
ollama pull llama3.2
```

This downloads the Llama 3.2 3B model (~2GB).

**2. Embedding Model (for creating vector representations):**

```bash
ollama pull nomic-embed-text
```

This downloads the Nomic Embed Text model (~274MB).

**Verify models are installed:**

```bash
ollama list
```

Expected output:
```
NAME                    ID              SIZE      MODIFIED
llama3.2:latest         a80c4f17acd5    2.0 GB    2 hours ago
nomic-embed-text:latest 0a109f422b47    274 MB    2 hours ago
```

### Building the PDF Documentation Loader

For development, we will use the following tools:

| Tool | Purpose | Why We Use It |
|------|---------|---------------|
| **LangChain** | Data processing chains | Simplifies RAG pipeline creation |
| **Ollama** | Running models | Local, private LLM hosting |
| **Python** | Programming | Flexibility and ecosystem |
| **ChromaDB** | Vector storage | Fast similarity search |

#### Installing Python Dependencies

Create a file `requirements.txt` with the following dependencies:

```txt
chromadb==0.6.3
unstructured==0.16.14
langchain==0.3.18
langchain-text-splitters==0.3.6
unstructured[all-docs]
langchain-community==0.3.14
langchain-ollama==0.2.2
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

This will install all required packages for the RAG system.

### Creating the Upload Script

After installation, let's create a mechanism for loading PDF documentation.

Create a Python script `upload.py` and add the following code:

#### Complete Upload Script

```python
#!/usr/bin/env python3
"""
Wazuh Documentation RAG Upload Script
Author: Anubhav Gain
Description: Uploads PDF documentation to vector database for RAG
"""

import argparse
import os
from pathlib import Path

from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma


def upload(document_path, model_name, collection_name, ollama_base_url):
    """
    Upload PDF documentation to ChromaDB vector store

    Args:
        document_path (str): Path to PDF file
        model_name (str): Ollama embedding model name
        collection_name (str): ChromaDB collection name
        ollama_base_url (str): Ollama server URL

    Returns:
        Chroma: Vector store object
    """
    # Get current script directory
    current_path = os.path.dirname(os.path.realpath(__file__))
    chroma_persistent_directory = current_path + "/data"

    # Create data directory if it doesn't exist
    if not os.path.exists(chroma_persistent_directory):
        os.makedirs(chroma_persistent_directory, exist_ok=True)
        print(f"Created directory: {chroma_persistent_directory}")

    # Validate PDF file exists
    if not os.path.exists(document_path):
        raise FileNotFoundError(f"PDF file not found: {document_path}")

    print(f"Loading PDF: {document_path}")

    # Load PDF document
    loader = UnstructuredPDFLoader(file_path=document_path)
    data = loader.load()

    print(f"Loaded {len(data)} document(s)")

    # Split text into chunks
    # chunk_size: 7500 characters per chunk
    # chunk_overlap: 100 characters overlap between chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=7500,
        chunk_overlap=100
    )
    chunks = text_splitter.split_documents(data)

    print(f"Split into {len(chunks)} chunks")

    # Create vector embeddings and store in ChromaDB
    print(f"Creating embeddings using model: {model_name}")
    print(f"This may take several minutes...")

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

    print(f"✓ Successfully uploaded to collection: {collection_name}")
    print(f"✓ Vector store saved to: {chroma_persistent_directory}")

    return vector


if __name__ == '__main__':
    # Create argument parser
    parser = argparse.ArgumentParser(
        description='Upload PDF documentation to vector store for RAG'
    )

    # Add arguments
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

    # Parse arguments
    args = parser.parse_args()

    print("=" * 60)
    print("WAZUH DOCUMENTATION RAG UPLOAD")
    print("=" * 60)
    print(f"PDF Path: {args.path}")
    print(f"Embedding Model: {args.model}")
    print(f"Collection Name: {args.name}")
    print(f"Ollama URL: {args.base_url}")
    print("=" * 60)

    # Call the upload function
    try:
        upload(
            document_path=args.path,
            model_name=args.model,
            collection_name=args.name,
            ollama_base_url=args.base_url
        )
        print("\n✓ Upload completed successfully!")
    except Exception as e:
        print(f"\n✗ Error during upload: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
```

#### Understanding the Upload Function

Let's break down what each part of the `upload()` function does:

**1. Path to the current script:**

```python
current_path = os.path.dirname(os.path.realpath(__file__))
```

This line determines the path to the directory where the current script is located.

**2. Creating a directory for data storage:**

```python
chroma_persistent_directory = current_path + "/data"
if not os.path.exists(chroma_persistent_directory):
    os.makedirs(chroma_persistent_directory, exist_ok=True)
```

Here, a `data` directory is created inside the current directory if it does not already exist. This directory will be used for storing vector embeddings.

**3. Loading the PDF document:**

```python
loader = UnstructuredPDFLoader(file_path=document_path)
data = loader.load()
```

The `UnstructuredPDFLoader` class is used to load the PDF document at the specified `document_path`. This extracts all text content from the PDF.

**4. Splitting the text into chunks:**

```python
text_splitter = RecursiveCharacterTextSplitter(chunk_size=7500, chunk_overlap=100)
chunks = text_splitter.split_documents(data)
```

The text from the PDF document is split into chunks of 7500 characters with an overlap of 100 characters. This is done for:
- **Better Retrieval**: Smaller chunks improve search accuracy
- **Context Preservation**: Overlap ensures no information is lost at boundaries
- **Model Limitations**: LLMs have token limits for processing

**5. Creating vector embeddings:**

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

The `Chroma` class is used to create a vector representation of the text chunks:
- **OllamaEmbeddings**: Converts text to numerical vectors
- **model_name**: Uses `nomic-embed-text` by default
- **collection_name**: Organizes documents in named collections
- **persist_directory**: Saves vectors to disk for reuse

**6. Returning the result:**

```python
return vector
```

The function returns the `vector` object, which represents the vectorized text and provides search capabilities.

### Running the Upload Script

Now that we have the script, let's use it to upload Wazuh documentation:

**1. Ensure Ollama is running:**

```bash
# Start Ollama (if not already running)
ollama serve
```

**2. Pull the embedding model:**

```bash
ollama pull nomic-embed-text
```

**3. Run the upload script:**

```bash
python upload.py -p /path/to/wazuh.pdf
```

Replace `/path/to/wazuh.pdf` with the actual path to your compiled Wazuh documentation PDF.

**Example with all options:**

```bash
python upload.py \
  -p ./wazuh-documentation/build/singlehtml/wazuh.pdf \
  -m nomic-embed-text \
  -n wazuh-docs \
  -b http://localhost:11434
```

**Expected output:**

```
============================================================
WAZUH DOCUMENTATION RAG UPLOAD
============================================================
PDF Path: ./wazuh-documentation/build/singlehtml/wazuh.pdf
Embedding Model: nomic-embed-text
Collection Name: wazuh-docs
Ollama URL: http://localhost:11434
============================================================
Loading PDF: ./wazuh-documentation/build/singlehtml/wazuh.pdf
Loaded 1 document(s)
Split into 245 chunks
Creating embeddings using model: nomic-embed-text
This may take several minutes...
[Progress bar showing embedding creation]
✓ Successfully uploaded to collection: wazuh-docs
✓ Vector store saved to: ./data

✓ Upload completed successfully!
```

**Note**: The upload process may take some time (5-15 minutes) depending on:
- PDF size
- System resources
- Number of chunks
- Model performance

### Creating the Query Script

Now let's create a Python script (`ask.py`) that will use Ollama to get answers to questions:

#### Complete Ask Script

```python
#!/usr/bin/env python3
"""
Wazuh Documentation RAG Query Script
Author: Anubhav Gain
Description: Query Wazuh documentation using RAG
"""

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


def ask_ollama(question, collection_name='wazuh', embedding_model='nomic-embed-text',
               local_model='llama3.2'):
    """
    Query the RAG system with a question about Wazuh

    Args:
        question (str): User's question
        collection_name (str): ChromaDB collection name
        embedding_model (str): Embedding model name
        local_model (str): LLM model for generation

    Returns:
        str: Generated answer based on documentation
    """
    # Get current script path
    current_path = os.path.dirname(os.path.realpath(__file__))
    chroma_persistent_directory = current_path + "/data"

    # Check if data directory exists
    if not os.path.exists(chroma_persistent_directory):
        raise FileNotFoundError(
            f"Vector database not found at {chroma_persistent_directory}. "
            "Please run upload.py first to create the database."
        )

    print(f"Loading vector database from: {chroma_persistent_directory}")

    # Initialize embedding model
    embedding = OllamaEmbeddings(model=embedding_model)

    # Connect to persistent ChromaDB
    persistent_client = chromadb.PersistentClient(path=chroma_persistent_directory)

    # Load vector database
    vector_db = Chroma(
        client=persistent_client,
        collection_name=collection_name,
        embedding_function=embedding,
    )

    print(f"Loaded collection: {collection_name}")

    # Initialize LLM for generation
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

Provide a detailed, accurate answer based on the Wazuh documentation.
If you cannot find the answer in the context, say so clearly."""

    # Create multi-query retriever
    # This improves retrieval by generating alternative phrasings
    retriever = MultiQueryRetriever.from_llm(
        vector_db.as_retriever(),
        load_ollama,
        prompt=prompt_template
    )

    print("Searching documentation...")

    # Create chat prompt
    prompt = ChatPromptTemplate.from_template(template)

    # Build RAG chain
    # This creates a pipeline: retrieve → format → generate → parse
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | load_ollama
        | StrOutputParser()
    )

    print("Generating answer...\n")

    # Invoke the chain with the question
    return chain.invoke(question)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Ask questions about Wazuh documentation'
    )

    parser.add_argument(
        '-q', '--question',
        type=str,
        help='The question to ask about Wazuh',
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

    print("=" * 60)
    print("WAZUH DOCUMENTATION RAG QUERY")
    print("=" * 60)
    print(f"Question: {args.question}")
    print(f"Collection: {args.collection}")
    print(f"Embedding Model: {args.embedding}")
    print(f"LLM Model: {args.model}")
    print("=" * 60 + "\n")

    try:
        answer = ask_ollama(
            question=args.question,
            collection_name=args.collection,
            embedding_model=args.embedding,
            local_model=args.model
        )

        print("ANSWER:")
        print("=" * 60)
        print(answer)
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
```

### Running the Query Script

Save the script and run it to ask questions about Wazuh:

**Basic usage:**

```bash
python ask.py -q "What is Wazuh and what is it used for?"
```

**With custom parameters:**

```bash
python ask.py \
  -q "How do I configure Wazuh for compliance monitoring?" \
  -c wazuh-docs \
  -e nomic-embed-text \
  -m llama3.2
```

### Sample Query Results

**Example 1: Basic Question**

**Question:**
```bash
python ask.py -q "What is Wazuh and what for?"
```

**Sample Response:**

```
============================================================
WAZUH DOCUMENTATION RAG QUERY
============================================================
Question: What is Wazuh and what for?
Collection: wazuh
Embedding Model: nomic-embed-text
LLM Model: llama3.2
============================================================

Loading vector database from: ./data
Loaded collection: wazuh
Searching documentation...
Generating answer...

ANSWER:
============================================================
Wazuh is an open-source log management system that provides real-time
monitoring and alerting capabilities for security, compliance, and IT
operations. It was originally developed by Qualys, a leading provider
of vulnerability management and compliance solutions.

Wazuh acts as a bridge between the host operating system and external
threat intelligence feeds, allowing users to collect, process, and
analyze log data from various sources. This enables users to:

1. **Monitor security events**: Wazuh collects and analyzes log data
   from various sources (e.g., system logs, application logs, and
   network devices) to identify potential security threats and anomalies.

2. **Detect vulnerabilities**: By integrating with external threat
   intelligence feeds, Wazuh can detect known vulnerabilities in the
   environment and alert users to take corrective action.

3. **Enforce compliance**: Wazuh supports various compliance frameworks
   (e.g., PCI-DSS, HIPAA/HITECH, GDPR) by providing features for
   logging, auditing, and reporting on security-related data.

Overall, Wazuh helps organizations proactively manage their security
posture, detect potential threats, and maintain regulatory compliance.
============================================================
```

**Example 2: Technical Question**

**Question:**
```bash
python ask.py -q "How do I set up active response in Wazuh?"
```

**Sample Response:**

```
ANSWER:
============================================================
To set up active response in Wazuh, follow these steps:

1. **Configure active response in ossec.conf**: Add active response
   configuration blocks defining the script to execute, the trigger
   conditions (based on rule level or rule ID), and the timeout.

2. **Create or use existing scripts**: Wazuh includes built-in active
   response scripts in /var/ossec/active-response/bin/. You can use
   these or create custom scripts.

3. **Define rules to trigger responses**: Ensure your rules have
   appropriate levels to trigger the active response. Typically,
   level 6 or higher is used for automated responses.

4. **Test the configuration**: After configuring, test the active
   response by triggering the associated rule and verifying the
   script executes as expected.

Example configuration:
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <level>6</level>
  <timeout>600</timeout>
</active-response>

This configuration will execute the firewall-drop script when a
rule of level 6 or higher is triggered, with a timeout of 600 seconds.
============================================================
```

## Advanced Usage and Optimization

### Customizing Chunk Size

Adjust chunk size based on your documentation structure:

```python
# For detailed technical docs (larger chunks)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=10000,
    chunk_overlap=200
)

# For FAQ-style docs (smaller chunks)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=3000,
    chunk_overlap=100
)
```

### Using Different Models

**For better quality (but slower):**

```bash
# Download larger model
ollama pull llama3.1:8b

# Use in query
python ask.py -q "Your question" -m llama3.1:8b
```

**For faster responses:**

```bash
# Use smaller model
ollama pull llama3.2:1b

# Use in query
python ask.py -q "Your question" -m llama3.2:1b
```

### Batch Processing Questions

Create a script to process multiple questions:

```bash
#!/bin/bash
# batch_questions.sh

questions=(
  "What is Wazuh?"
  "How to configure file integrity monitoring?"
  "What are Wazuh decoders?"
  "How to integrate with SIEM?"
)

for q in "${questions[@]}"; do
  echo "Question: $q"
  python ask.py -q "$q"
  echo ""
done
```

## Troubleshooting

### Common Issues and Solutions

**Issue 1: "Vector database not found"**

```
Error: Vector database not found at ./data
```

**Solution:**
```bash
# Run upload.py first to create the database
python upload.py -p /path/to/wazuh.pdf
```

**Issue 2: "Model not found"**

```
Error: model 'llama3.2' not found
```

**Solution:**
```bash
# Pull the required model
ollama pull llama3.2
ollama pull nomic-embed-text
```

**Issue 3: Slow embedding creation**

**Solution:**
```bash
# Use a machine with more RAM
# Or reduce chunk size in upload.py:
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=5000,  # Reduced from 7500
    chunk_overlap=100
)
```

**Issue 4: Ollama connection refused**

```
Error: Connection refused to http://localhost:11434
```

**Solution:**
```bash
# Start Ollama server
ollama serve

# Or check if it's running on a different port
lsof -i :11434
```

## Best Practices

### 1. Documentation Updates

When Wazuh documentation is updated:

```bash
# Re-compile documentation
cd wazuh-documentation
git pull origin main
make singlehtml

# Re-upload to vector database
python upload.py -p ./build/singlehtml/wazuh.pdf
```

### 2. Query Optimization

For better results:

- **Be specific**: "How to configure FIM for Windows?" vs "Configure FIM"
- **Provide context**: Mention version, component, or use case
- **Use technical terms**: Match documentation terminology

### 3. Performance Tuning

```python
# In ask.py, adjust retriever parameters
retriever = MultiQueryRetriever.from_llm(
    vector_db.as_retriever(
        search_kwargs={"k": 5}  # Retrieve top 5 chunks (default is 4)
    ),
    load_ollama,
    prompt=prompt_template
)
```

### 4. Monitoring and Logging

Add logging to track usage:

```python
import logging

logging.basicConfig(
    filename='rag_queries.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

# In ask_ollama function
logging.info(f"Question: {question}")
logging.info(f"Answer length: {len(answer)} characters")
```

## Integration Examples

### Web API Integration

Create a Flask API for the RAG system:

```python
from flask import Flask, request, jsonify
from ask import ask_ollama

app = Flask(__name__)

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')

    if not question:
        return jsonify({'error': 'No question provided'}), 400

    try:
        answer = ask_ollama(question)
        return jsonify({
            'question': question,
            'answer': answer,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(port=5000)
```

### Slack Bot Integration

Create a Slack bot for documentation queries:

```python
from slack_bolt import App
from ask import ask_ollama

app = App(token="xoxb-your-token")

@app.event("app_mention")
def handle_mention(event, say):
    question = event['text'].split('>', 1)[1].strip()

    answer = ask_ollama(question)

    say(f"📚 *Wazuh Documentation Says:*\n\n{answer}")

if __name__ == "__main__":
    app.start(port=3000)
```

## Conclusion

Congratulations! You've successfully built a complete RAG system for Wazuh documentation. This intelligent assistant can now:

### What You've Accomplished

✅ **Compiled Wazuh Documentation** - Using Docker and Sphinx

✅ **Built Vector Database** - Stored documentation embeddings in ChromaDB

✅ **Created RAG Pipeline** - Integrated retrieval and generation

✅ **Deployed Query Interface** - Command-line tool for asking questions

✅ **Optimized Performance** - Multi-query retrieval for better accuracy

### Key Benefits

- 🎯 **Instant Answers**: Get immediate responses from documentation
- 📚 **Comprehensive**: Searches entire documentation corpus
- 🔒 **Private**: Runs completely locally, no data sent to cloud
- 💰 **Cost-Free**: No API costs, unlimited queries
- 🔄 **Always Updated**: Easy to refresh with new documentation

### Next Steps

#### Immediate Enhancements

1. **Add More Documentation**: Include additional Wazuh resources
2. **Fine-tune Prompts**: Customize for specific use cases
3. **Build Web Interface**: Create user-friendly UI
4. **Integrate with Tools**: Connect to Slack, Discord, or internal tools

#### Advanced Features

1. **Multi-Document Support**: Combine multiple knowledge sources
2. **Conversation Memory**: Track conversation context
3. **Source Citations**: Show which documentation sections were used
4. **Analytics**: Track common questions and usage patterns
5. **Auto-Updates**: Automated documentation refresh pipeline

### Resources

**Code Repository:**
```bash
# All scripts available at
git clone https://github.com/mranv/wazuh-rag-docs
```

**Documentation:**
- [Wazuh Official Docs](https://documentation.wazuh.com)
- [Ollama Documentation](https://ollama.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)

### Final Thoughts

RAG transforms static documentation into an interactive knowledge assistant. By combining the precision of vector search with the natural language capabilities of LLMs, you've created a powerful tool that makes Wazuh documentation instantly accessible.

The beauty of this approach is its extensibility — you can apply the same techniques to any documentation, creating intelligent assistants for all your security tools and platforms.

As you can see, building a production-ready RAG system is straightforward with the right tools. Keep experimenting, and don't hesitate to customize the system for your specific needs!

**Happy querying! 📚🤖**

---

**Author**: Anubhav Gain
**GitHub**: [@mranv](https://github.com/mranv)
**Last Updated**: October 4, 2025
**Version**: 1.0
**License**: MIT

**Note**: This is a living guide. As Wazuh and RAG technologies evolve, updates will be made to reflect best practices and new capabilities.
