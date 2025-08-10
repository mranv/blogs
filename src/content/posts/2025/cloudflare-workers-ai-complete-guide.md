---
author: Anubhav Gain
pubDatetime: 2025-08-10T16:30:00+05:30
modDatetime: 2025-08-10T16:30:00+05:30
title: Building AI-Powered Applications with Cloudflare Workers AI
slug: cloudflare-workers-ai-complete-guide
featured: true
draft: false
tags:
  - cloudflare
  - workers
  - ai
  - machine-learning
  - llm
  - computer-vision
  - nlp
  - edge-ai
description: Complete guide to building AI-powered applications using Cloudflare Workers AI, including language models, computer vision, embeddings, and vector search.
---

# Building AI-Powered Applications with Cloudflare Workers AI

Cloudflare Workers AI brings artificial intelligence to the edge, allowing you to run ML models globally with zero cold starts. This comprehensive guide covers building AI-powered applications using language models, computer vision, embeddings, and vector search capabilities.

## Table of Contents

## Introduction to Workers AI

Cloudflare Workers AI provides access to popular open-source AI models that run on Cloudflare's global network. Unlike traditional AI services, Workers AI offers:

- **Zero cold starts** - Models are already loaded and ready
- **Global distribution** - Run AI at 285+ locations worldwide
- **Cost-effective pricing** - Pay per request, not per hour
- **No infrastructure management** - Serverless AI inference
- **Privacy-focused** - Data never leaves Cloudflare's network

### Available Model Categories

| Category | Models | Use Cases |
|----------|---------|-----------|
| **Text Generation** | Llama 2, Mistral, CodeLlama | Chatbots, content creation, code generation |
| **Text Classification** | DistilBERT, RoBERTa | Sentiment analysis, content moderation |
| **Translation** | m2m100, NLLB | Multi-language translation |
| **Text Embeddings** | BGE, E5 | Semantic search, similarity matching |
| **Image Classification** | ResNet, EfficientNet | Object detection, content tagging |
| **Image Generation** | Stable Diffusion | AI art, image synthesis |
| **Speech Recognition** | Whisper | Voice transcription |
| **Object Detection** | YOLO, DETR | Computer vision applications |

## Getting Started

### 1. Project Setup

```bash
# Create a new Workers AI project
npm create cloudflare@latest my-ai-app -- --template=worker-ai

cd my-ai-app

# Install additional dependencies
npm install @cloudflare/ai zod openai
```

### 2. Configuration

`wrangler.toml`:

```toml
name = "ai-powered-app"
main = "src/index.ts"
compatibility_date = "2025-01-10"

# AI binding
[ai]
binding = "AI"

# Optional: Add D1 for conversation history
[[d1_databases]]
binding = "DB"
database_name = "ai-conversations"
database_id = "your-database-id"

# Optional: Add KV for caching
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# Optional: Add R2 for file storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "ai-files"

[vars]
OPENAI_API_KEY = "your-openai-key" # For comparison/fallback
MAX_TOKENS = "2048"
RATE_LIMIT = "100"
```

### 3. Basic Workers AI Structure

```typescript
import { Ai } from '@cloudflare/ai';

export interface Env {
  AI: Ai;
  DB?: D1Database;
  CACHE?: KVNamespace;
  STORAGE?: R2Bucket;
  OPENAI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ai = new Ai(env.AI);
    
    // Route requests
    const url = new URL(request.url);
    
    if (url.pathname === '/chat') {
      return handleChat(request, ai, env);
    } else if (url.pathname === '/image') {
      return handleImageGeneration(request, ai, env);
    } else if (url.pathname === '/analyze') {
      return handleImageAnalysis(request, ai, env);
    }
    
    return new Response('AI Service Ready', { status: 200 });
  },
};
```

## Text Generation and Chatbots

### 1. Basic Text Generation

```typescript
// Simple text completion
async function generateText(prompt: string, ai: Ai): Promise<string> {
  const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 256,
    temperature: 0.7,
  });
  
  return response.response;
}

// Advanced text generation with system prompts
async function generateWithContext(
  systemPrompt: string, 
  userPrompt: string, 
  ai: Ai
): Promise<string> {
  const response = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 512,
    temperature: 0.8,
    top_p: 0.9,
  });
  
  return response.response;
}
```

### 2. Conversational Chatbot

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  messages: ChatMessage[];
  model: string;
  created_at: string;
  updated_at: string;
}

async function handleChat(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const { message, conversationId, model = '@cf/meta/llama-2-7b-chat-int8' } = 
      await request.json() as { 
        message: string; 
        conversationId?: string; 
        model?: string;
      };
    
    // Get or create conversation
    let conversation = await getConversation(conversationId, env);
    if (!conversation) {
      conversation = await createConversation(model, env);
    }
    
    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 messages to manage context window
    if (conversation.messages.length > 10) {
      conversation.messages = conversation.messages.slice(-10);
    }
    
    // Generate AI response
    const aiResponse = await ai.run(model, {
      messages: conversation.messages,
      max_tokens: 512,
      temperature: 0.7,
      stream: false
    });
    
    // Add AI message
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(assistantMessage);
    conversation.updated_at = new Date().toISOString();
    
    // Save conversation
    await saveConversation(conversation, env);
    
    return new Response(JSON.stringify({
      message: aiResponse.response,
      conversationId: conversation.id,
      usage: {
        tokens: aiResponse.response.length, // Approximate
        model: model
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Conversation management functions
async function getConversation(
  id: string | undefined, 
  env: Env
): Promise<Conversation | null> {
  if (!id || !env.DB) return null;
  
  const result = await env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ?'
  ).bind(id).first();
  
  if (!result) return null;
  
  return {
    ...result,
    messages: JSON.parse(result.messages as string)
  } as Conversation;
}

async function createConversation(model: string, env: Env): Promise<Conversation> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const conversation: Conversation = {
    id,
    messages: [{
      role: 'system',
      content: 'You are a helpful AI assistant. Provide accurate, concise, and friendly responses.',
      timestamp: now
    }],
    model,
    created_at: now,
    updated_at: now
  };
  
  if (env.DB) {
    await env.DB.prepare(`
      INSERT INTO conversations (id, messages, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      JSON.stringify(conversation.messages),
      model,
      now,
      now
    ).run();
  }
  
  return conversation;
}
```

### 3. Streaming Responses

```typescript
async function handleStreamingChat(request: Request, ai: Ai, env: Env): Promise<Response> {
  const { message } = await request.json();
  
  // Create a readable stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  // Start streaming response
  streamAIResponse(message, ai, writer);
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    }
  });
}

async function streamAIResponse(message: string, ai: Ai, writer: WritableStreamDefaultWriter) {
  try {
    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: message }],
      stream: true
    });
    
    if (response.readable) {
      const reader = response.readable.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        await writer.write(new TextEncoder().encode(chunk));
      }
    }
  } catch (error) {
    await writer.write(new TextEncoder().encode(`Error: ${error.message}`));
  } finally {
    await writer.close();
  }
}
```

## Image Generation and Computer Vision

### 1. AI Image Generation

```typescript
async function generateImage(prompt: string, ai: Ai): Promise<Response> {
  try {
    const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      num_steps: 20,
      strength: 1.0,
      guidance: 7.5,
    });
    
    return new Response(response, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

// Advanced image generation with parameters
async function handleImageGeneration(request: Request, ai: Ai, env: Env): Promise<Response> {
  const formData = await request.formData();
  
  const prompt = formData.get('prompt') as string;
  const negativePrompt = formData.get('negative_prompt') as string || '';
  const steps = parseInt(formData.get('steps') as string || '20');
  const guidance = parseFloat(formData.get('guidance') as string || '7.5');
  const width = parseInt(formData.get('width') as string || '1024');
  const height = parseInt(formData.get('height') as string || '1024');
  
  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }
  
  try {
    const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      negative_prompt: negativePrompt,
      num_steps: Math.min(Math.max(steps, 1), 50), // Limit steps
      guidance: Math.min(Math.max(guidance, 1.0), 20.0), // Limit guidance
      width: Math.min(width, 1024), // Limit dimensions
      height: Math.min(height, 1024),
    });
    
    // Optionally store in R2
    if (env.STORAGE) {
      const key = `generated/${Date.now()}-${crypto.randomUUID()}.png`;
      await env.STORAGE.put(key, response, {
        customMetadata: {
          prompt,
          model: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
          generated_at: new Date().toISOString(),
        }
      });
    }
    
    return new Response(response, {
      headers: {
        'Content-Type': 'image/png',
        'X-Generated-At': new Date().toISOString(),
        'X-Model': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
```

### 2. Image Analysis and Classification

```typescript
async function analyzeImage(imageData: ArrayBuffer, ai: Ai): Promise<any> {
  // Image classification
  const classification = await ai.run('@cf/microsoft/resnet-50', {
    image: [...new Uint8Array(imageData)]
  });
  
  // Object detection
  const objects = await ai.run('@cf/facebook/detr-resnet-50', {
    image: [...new Uint8Array(imageData)]
  });
  
  return {
    classification,
    objects,
    analysis_timestamp: new Date().toISOString()
  };
}

async function handleImageAnalysis(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response('No image provided', { status: 400 });
    }
    
    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return new Response('Invalid file type', { status: 400 });
    }
    
    // Validate file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response('File too large', { status: 400 });
    }
    
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Analyze image
    const analysis = await analyzeImage(imageBuffer, ai);
    
    // Extract insights
    const insights = {
      dominant_objects: analysis.objects?.[0]?.label || 'Unknown',
      confidence_score: analysis.classification?.[0]?.score || 0,
      detected_objects: analysis.objects?.length || 0,
      categories: analysis.classification?.slice(0, 3).map((c: any) => ({
        label: c.label,
        confidence: c.score
      })) || [],
      metadata: {
        file_size: imageFile.size,
        file_type: imageFile.type,
        analyzed_at: new Date().toISOString(),
      }
    };
    
    // Cache results
    if (env.CACHE) {
      const cacheKey = `analysis:${await hashArrayBuffer(imageBuffer)}`;
      await env.CACHE.put(cacheKey, JSON.stringify(insights), {
        expirationTtl: 3600, // 1 hour
      });
    }
    
    return new Response(JSON.stringify(insights), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze image' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to hash image for caching
async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 3. Image-to-Text (OCR) and Captioning

```typescript
async function extractTextFromImage(imageData: ArrayBuffer, ai: Ai): Promise<string> {
  // Use an OCR model
  const response = await ai.run('@cf/microsoft/trocr-base-printed', {
    image: [...new Uint8Array(imageData)]
  });
  
  return response.text || '';
}

async function generateImageCaption(imageData: ArrayBuffer, ai: Ai): Promise<string> {
  // Use image captioning model
  const response = await ai.run('@cf/microsoft/git-large-coco', {
    image: [...new Uint8Array(imageData)]
  });
  
  return response.description || 'Unable to generate caption';
}
```

## Text Embeddings and Vector Search

### 1. Generate Text Embeddings

```typescript
async function generateEmbedding(text: string, ai: Ai): Promise<number[]> {
  const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: text
  });
  
  return response.data[0];
}

async function generateMultipleEmbeddings(texts: string[], ai: Ai): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text, ai));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
  }
  
  return embeddings;
}
```

### 2. Vector Database with D1

```sql
-- Create vector table schema
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding_json TEXT NOT NULL, -- Store as JSON string
  metadata_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast retrieval
CREATE INDEX idx_documents_created_at ON documents(created_at);
```

```typescript
interface Document {
  id: string;
  content: string;
  embedding: number[];
  metadata?: any;
  created_at: string;
}

class VectorStore {
  private db: D1Database;
  private ai: Ai;
  
  constructor(db: D1Database, ai: Ai) {
    this.db = db;
    this.ai = ai;
  }
  
  async addDocument(content: string, metadata?: any): Promise<string> {
    const id = crypto.randomUUID();
    const embedding = await generateEmbedding(content, this.ai);
    
    await this.db.prepare(`
      INSERT INTO documents (id, content, embedding_json, metadata_json)
      VALUES (?, ?, ?, ?)
    `).bind(
      id,
      content,
      JSON.stringify(embedding),
      JSON.stringify(metadata || {})
    ).run();
    
    return id;
  }
  
  async addDocuments(docs: Array<{ content: string; metadata?: any }>): Promise<string[]> {
    const embeddings = await generateMultipleEmbeddings(
      docs.map(d => d.content), 
      this.ai
    );
    
    const ids: string[] = [];
    const statements = docs.map((doc, index) => {
      const id = crypto.randomUUID();
      ids.push(id);
      
      return this.db.prepare(`
        INSERT INTO documents (id, content, embedding_json, metadata_json)
        VALUES (?, ?, ?, ?)
      `).bind(
        id,
        doc.content,
        JSON.stringify(embeddings[index]),
        JSON.stringify(doc.metadata || {})
      );
    });
    
    await this.db.batch(statements);
    return ids;
  }
  
  async search(query: string, limit: number = 10): Promise<Document[]> {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query, this.ai);
    
    // Get all documents (in production, you'd want pagination)
    const results = await this.db.prepare(`
      SELECT * FROM documents ORDER BY created_at DESC LIMIT 1000
    `).all();
    
    // Calculate similarities and sort
    const documentsWithSimilarity = results.results.map(doc => {
      const docEmbedding = JSON.parse(doc.embedding_json as string);
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      
      return {
        ...doc,
        similarity,
        embedding: docEmbedding,
        metadata: JSON.parse(doc.metadata_json as string || '{}')
      };
    });
    
    // Sort by similarity and return top results
    return documentsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(doc => ({
        id: doc.id as string,
        content: doc.content as string,
        embedding: doc.embedding,
        metadata: doc.metadata,
        created_at: doc.created_at as string
      }));
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### 3. RAG (Retrieval Augmented Generation)

```typescript
async function handleRAGQuery(
  query: string, 
  vectorStore: VectorStore, 
  ai: Ai
): Promise<string> {
  // 1. Search for relevant documents
  const relevantDocs = await vectorStore.search(query, 5);
  
  // 2. Prepare context from retrieved documents
  const context = relevantDocs
    .map(doc => doc.content)
    .join('\n\n---\n\n');
  
  // 3. Generate response with context
  const prompt = `Based on the following context, answer the user's question:

Context:
${context}

Question: ${query}

Answer:`;

  const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions based on provided context. If the context doesn\'t contain relevant information, say so.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 512,
    temperature: 0.3,
  });
  
  return response.response;
}

// RAG endpoint
async function handleRAG(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const { query } = await request.json();
    
    if (!query || !env.DB) {
      return new Response('Query and database required', { status: 400 });
    }
    
    const vectorStore = new VectorStore(env.DB, ai);
    const answer = await handleRAGQuery(query, vectorStore, ai);
    
    return new Response(JSON.stringify({ 
      query, 
      answer,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('RAG error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process query' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## Advanced AI Applications

### 1. Multi-Modal AI (Text + Image)

```typescript
async function handleMultiModal(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const imageFile = formData.get('image') as File;
    
    let imageAnalysis = null;
    if (imageFile) {
      const imageBuffer = await imageFile.arrayBuffer();
      imageAnalysis = await analyzeImage(imageBuffer, ai);
    }
    
    // Combine text and image context
    let combinedPrompt = text;
    if (imageAnalysis) {
      const imageDescription = `Image contains: ${imageAnalysis.classification?.[0]?.label || 'unknown object'}`;
      combinedPrompt = `${text}\n\nImage context: ${imageDescription}`;
    }
    
    // Generate response
    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: combinedPrompt }],
      max_tokens: 512,
    });
    
    return new Response(JSON.stringify({
      text_response: response.response,
      image_analysis: imageAnalysis,
      combined_context: combinedPrompt
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Multi-modal error:', error);
    return new Response('Failed to process multi-modal request', { status: 500 });
  }
}
```

### 2. Content Moderation AI

```typescript
interface ModerationResult {
  safe: boolean;
  categories: {
    hate: number;
    harassment: number;
    selfHarm: number;
    sexual: number;
    violence: number;
    spam: number;
  };
  confidence: number;
  flagged_content?: string[];
}

async function moderateContent(content: string, ai: Ai): Promise<ModerationResult> {
  // Use text classification for content moderation
  const response = await ai.run('@cf/huggingface/distilbert-sst-2-int8', {
    text: content
  });
  
  // This is a simplified example - you'd use specialized moderation models
  const result: ModerationResult = {
    safe: true,
    categories: {
      hate: 0,
      harassment: 0,
      selfHarm: 0,
      sexual: 0,
      violence: 0,
      spam: 0,
    },
    confidence: response.score || 0,
  };
  
  // Add custom rules
  const flaggedWords = ['spam', 'hate', 'violence', 'inappropriate'];
  const flaggedContent = flaggedWords.filter(word => 
    content.toLowerCase().includes(word)
  );
  
  if (flaggedContent.length > 0) {
    result.safe = false;
    result.flagged_content = flaggedContent;
    result.categories.spam = flaggedContent.includes('spam') ? 0.8 : 0;
  }
  
  return result;
}

async function handleContentModeration(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const { content, userId, contextId } = await request.json();
    
    const moderation = await moderateContent(content, ai);
    
    // Log moderation result
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO moderation_logs 
        (user_id, context_id, content, safe, categories, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        contextId,
        content,
        moderation.safe,
        JSON.stringify(moderation.categories),
        new Date().toISOString()
      ).run();
    }
    
    return new Response(JSON.stringify({
      safe: moderation.safe,
      confidence: moderation.confidence,
      action: moderation.safe ? 'allow' : 'block',
      categories: moderation.categories,
      flagged_content: moderation.flagged_content
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(JSON.stringify({ 
      safe: false, 
      action: 'block', 
      error: 'Moderation failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 3. AI-Powered Code Generation

```typescript
async function generateCode(
  prompt: string, 
  language: string, 
  ai: Ai
): Promise<string> {
  const systemPrompt = `You are an expert programmer. Generate clean, well-commented code in ${language}. 
Include error handling and follow best practices.`;
  
  const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });
  
  return response.response;
}

async function handleCodeGeneration(request: Request, ai: Ai, env: Env): Promise<Response> {
  try {
    const { prompt, language = 'javascript', validate = false } = await request.json();
    
    const code = await generateCode(prompt, language, ai);
    
    let validation = null;
    if (validate) {
      // Optional: validate generated code
      validation = await validateCode(code, language, ai);
    }
    
    // Cache generated code
    if (env.CACHE) {
      const cacheKey = `code:${await hashString(prompt + language)}`;
      await env.CACHE.put(cacheKey, JSON.stringify({ code, validation }), {
        expirationTtl: 3600,
      });
    }
    
    return new Response(JSON.stringify({
      prompt,
      language,
      code,
      validation,
      generated_at: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Code generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate code' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function validateCode(code: string, language: string, ai: Ai): Promise<any> {
  const validationPrompt = `Analyze the following ${language} code for:
1. Syntax errors
2. Best practices
3. Security issues
4. Performance concerns

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a JSON response with issues found.`;

  const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [{ role: 'user', content: validationPrompt }],
    max_tokens: 512,
    temperature: 0.1,
  });
  
  try {
    return JSON.parse(response.response);
  } catch {
    return { analysis: response.response };
  }
}
```

## Performance and Optimization

### 1. Caching Strategies

```typescript
class AICache {
  private kv: KVNamespace;
  private ttl: number;
  
  constructor(kv: KVNamespace, ttl: number = 3600) {
    this.kv = kv;
    this.ttl = ttl;
  }
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.kv.get(key, { type: 'json' });
    return cached as T | null;
  }
  
  async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: customTtl || this.ttl
    });
  }
  
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    
    const value = await factory();
    await this.set(key, value, customTtl);
    return value;
  }
  
  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Usage in AI endpoints
async function cachedTextGeneration(prompt: string, ai: Ai, cache: AICache): Promise<string> {
  const cacheKey = cache.generateKey('text', await hashString(prompt));
  
  return cache.getOrSet(cacheKey, async () => {
    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
      temperature: 0.7,
    });
    
    return response.response;
  }, 7200); // Cache for 2 hours
}
```

### 2. Request Batching

```typescript
class RequestBatcher {
  private batches: Map<string, any[]> = new Map();
  private timers: Map<string, any> = new Map();
  private readonly batchSize: number;
  private readonly batchTimeout: number;
  
  constructor(batchSize: number = 10, batchTimeout: number = 100) {
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }
  
  async batch<T, R>(
    key: string,
    item: T,
    processor: (items: T[]) => Promise<R[]>
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      // Get or create batch
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }
      
      const batch = this.batches.get(key)!;
      batch.push({ item, resolve, reject });
      
      // Process if batch is full
      if (batch.length >= this.batchSize) {
        this.processBatch(key, processor);
        return;
      }
      
      // Set timer for batch timeout
      if (!this.timers.has(key)) {
        const timer = setTimeout(() => {
          this.processBatch(key, processor);
        }, this.batchTimeout);
        
        this.timers.set(key, timer);
      }
    });
  }
  
  private async processBatch<T, R>(
    key: string,
    processor: (items: T[]) => Promise<R[]>
  ): Promise<void> {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;
    
    // Clear batch and timer
    this.batches.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    try {
      const items = batch.map(b => b.item);
      const results = await processor(items);
      
      // Resolve all promises
      batch.forEach((b, index) => {
        if (results[index] !== undefined) {
          b.resolve(results[index]);
        } else {
          b.reject(new Error('No result for item'));
        }
      });
    } catch (error) {
      // Reject all promises
      batch.forEach(b => b.reject(error));
    }
  }
}

// Usage
const embeddingBatcher = new RequestBatcher(20, 50); // Batch 20 items, 50ms timeout

async function batchedEmbedding(text: string, ai: Ai): Promise<number[]> {
  return embeddingBatcher.batch('embeddings', text, async (texts: string[]) => {
    return generateMultipleEmbeddings(texts, ai);
  });
}
```

### 3. Rate Limiting and Circuit Breaker

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get request times for this key
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

## Deployment and Monitoring

### 1. Environment Configuration

```toml
# wrangler.toml for production
name = "ai-app-prod"
main = "src/index.ts"
compatibility_date = "2025-01-10"

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "ai-prod-db"
database_id = "prod-db-id"

[[kv_namespaces]]
binding = "CACHE"
id = "prod-cache-id"
preview_id = "dev-cache-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "ai-prod-storage"
preview_bucket_name = "ai-dev-storage"

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
RATE_LIMIT_MAX = "1000"
RATE_LIMIT_WINDOW = "3600000"

# Staging environment
[env.staging]
name = "ai-app-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "debug"
RATE_LIMIT_MAX = "100"

# Development environment
[env.development]
name = "ai-app-dev"

[env.development.vars]
ENVIRONMENT = "development"
LOG_LEVEL = "debug"
RATE_LIMIT_MAX = "50"
```

### 2. Monitoring and Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: any;
  requestId?: string;
  userId?: string;
}

class Logger {
  constructor(
    private readonly level: string = 'info',
    private readonly requestId?: string
  ) {}
  
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
  
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      requestId: this.requestId,
    };
    
    console.log(JSON.stringify(entry));
  }
  
  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }
}

// Usage metrics
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  
  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }
  
  timing(metric: string, duration: number): void {
    this.metrics.set(`${metric}_duration`, duration);
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

// Middleware for monitoring
async function withMonitoring(
  request: Request,
  handler: (request: Request, logger: Logger, metrics: MetricsCollector) => Promise<Response>
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const logger = new Logger('info', requestId);
  const metrics = new MetricsCollector();
  const startTime = Date.now();
  
  logger.info('Request started', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  try {
    const response = await handler(request, logger, metrics);
    const duration = Date.now() - startTime;
    
    metrics.timing('request', duration);
    metrics.increment('requests_success');
    
    logger.info('Request completed', {
      status: response.status,
      duration,
      metrics: metrics.getMetrics()
    });
    
    // Add monitoring headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', String(duration));
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    metrics.timing('request', duration);
    metrics.increment('requests_error');
    
    logger.error('Request failed', {
      error: error.message,
      stack: error.stack,
      duration,
      metrics: metrics.getMetrics()
    });
    
    throw error;
  }
}
```

### 3. Health Checks and Diagnostics

```typescript
async function handleHealthCheck(request: Request, env: Env): Promise<Response> {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {} as any
  };
  
  // Check AI service
  try {
    await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1
    });
    health.checks.ai = { status: 'healthy' };
  } catch (error) {
    health.checks.ai = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }
  
  // Check database
  if (env.DB) {
    try {
      await env.DB.prepare('SELECT 1').first();
      health.checks.database = { status: 'healthy' };
    } catch (error) {
      health.checks.database = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
  }
  
  // Check cache
  if (env.CACHE) {
    try {
      await env.CACHE.put('health-check', 'test', { expirationTtl: 60 });
      await env.CACHE.get('health-check');
      health.checks.cache = { status: 'healthy' };
    } catch (error) {
      health.checks.cache = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Security Best Practices

### 1. Input Validation and Sanitization

```typescript
import { z } from 'zod';

// Validation schemas
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  model: z.string().regex(/^@cf\//).optional(),
});

const ImageGenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  negative_prompt: z.string().max(1000).optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidance: z.number().min(1.0).max(20.0).optional(),
});

// Sanitization functions
function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function validateAndSanitizeInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  const validated = schema.parse(data);
  
  // Sanitize string fields
  if (typeof validated === 'object' && validated !== null) {
    Object.keys(validated).forEach(key => {
      if (typeof validated[key] === 'string') {
        validated[key] = sanitizeText(validated[key]);
      }
    });
  }
  
  return validated;
}
```

### 2. Rate Limiting and Abuse Prevention

```typescript
class AdvancedRateLimiter {
  constructor(
    private kv: KVNamespace,
    private readonly limits: {
      requests: { window: number; max: number };
      tokens: { window: number; max: number };
      cost: { window: number; max: number };
    }
  ) {}
  
  async checkLimits(
    key: string,
    cost: number = 1,
    tokens: number = 0
  ): Promise<{ allowed: boolean; details: any }> {
    const now = Date.now();
    const promises = [
      this.checkLimit(`requests:${key}`, this.limits.requests, now),
      this.checkLimit(`tokens:${key}`, this.limits.tokens, now, tokens),
      this.checkLimit(`cost:${key}`, this.limits.cost, now, cost),
    ];
    
    const [requestsResult, tokensResult, costResult] = await Promise.all(promises);
    
    const allowed = requestsResult.allowed && tokensResult.allowed && costResult.allowed;
    
    return {
      allowed,
      details: {
        requests: requestsResult,
        tokens: tokensResult,
        cost: costResult,
      }
    };
  }
  
  private async checkLimit(
    key: string,
    limit: { window: number; max: number },
    now: number,
    increment: number = 1
  ): Promise<{ allowed: boolean; current: number; remaining: number; resetTime: number }> {
    const windowStart = now - limit.window;
    const windowKey = `${key}:${Math.floor(now / limit.window)}`;
    
    const current = await this.kv.get(windowKey) || '0';
    const currentValue = parseInt(current) + increment;
    
    const allowed = currentValue <= limit.max;
    const remaining = Math.max(0, limit.max - currentValue);
    const resetTime = Math.ceil(now / limit.window) * limit.window;
    
    if (allowed) {
      await this.kv.put(windowKey, String(currentValue), {
        expirationTtl: Math.ceil(limit.window / 1000)
      });
    }
    
    return {
      allowed,
      current: currentValue,
      remaining,
      resetTime,
    };
  }
}
```

### 3. Content Security and Filtering

```typescript
class ContentFilter {
  private readonly bannedPatterns: RegExp[];
  private readonly sensitivePatterns: RegExp[];
  
  constructor() {
    this.bannedPatterns = [
      /\b(hack|exploit|malware)\b/i,
      /\b(password|token|secret)\s*[:=]\s*\S+/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ];
    
    this.sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];
  }
  
  filterContent(content: string): {
    safe: boolean;
    filtered: string;
    issues: string[];
  } {
    const issues: string[] = [];
    let filtered = content;
    
    // Check for banned content
    for (const pattern of this.bannedPatterns) {
      if (pattern.test(content)) {
        issues.push('Contains prohibited content');
        filtered = filtered.replace(pattern, '[FILTERED]');
      }
    }
    
    // Check for sensitive data
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(content)) {
        issues.push('Contains sensitive information');
        filtered = filtered.replace(pattern, '[REDACTED]');
      }
    }
    
    return {
      safe: issues.length === 0,
      filtered,
      issues,
    };
  }
}
```

## Conclusion

Cloudflare Workers AI democratizes access to artificial intelligence by providing:

- **Global edge deployment** of AI models
- **Zero cold start latency** for instant responses
- **Cost-effective pricing** with pay-per-use model
- **Easy integration** with existing Workers ecosystem
- **Privacy-first approach** with data processing at the edge

### Key Benefits

1. **Performance** - Sub-100ms AI inference globally
2. **Scalability** - Handle millions of requests automatically
3. **Cost Efficiency** - No idle costs, only pay for usage
4. **Developer Experience** - Simple API, powerful capabilities
5. **Privacy** - Data never leaves Cloudflare's network

### Getting Started Checklist

- [ ] Set up Cloudflare Workers AI account
- [ ] Choose appropriate models for your use case
- [ ] Implement caching and rate limiting
- [ ] Add monitoring and logging
- [ ] Test performance and accuracy
- [ ] Deploy with proper security measures
- [ ] Monitor usage and costs
- [ ] Optimize for production workloads

### Future Possibilities

- **Custom model deployment** - Train and deploy your own models
- **Multi-modal AI** - Combined text, image, and audio processing
- **Real-time streaming** - Live AI interactions
- **Edge fine-tuning** - Adapt models to specific use cases
- **Federated learning** - Collaborative model training

## Resources

- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Available Models](https://developers.cloudflare.com/workers-ai/models/)
- [API Reference](https://developers.cloudflare.com/workers-ai/api/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Examples Repository](https://github.com/cloudflare/workers-ai-examples)