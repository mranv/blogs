---
author: Anubhav Gain
pubDatetime: 2025-08-10T15:30:00+05:30
modDatetime: 2025-08-10T15:30:00+05:30
title: Building Modern Web Applications with Cloudflare Pages and Edge Functions
slug: cloudflare-pages-edge-functions-guide
featured: true
draft: false
tags:
  - cloudflare
  - pages
  - edge-functions
  - jamstack
  - serverless
  - deployment
  - static-sites
  - functions
description: Complete guide to building and deploying modern web applications using Cloudflare Pages with Edge Functions, including framework integrations, authentication, and advanced patterns.
---

# Building Modern Web Applications with Cloudflare Pages and Edge Functions

Cloudflare Pages combined with Edge Functions provides a powerful platform for building and deploying modern web applications at the edge. This comprehensive guide covers everything from static site deployment to dynamic edge computing with serverless functions.

## Table of Contents

## Introduction

Cloudflare Pages is a JAMstack platform for frontend developers to collaborate and deploy websites. When combined with Edge Functions (powered by Workers), it enables:

- **Static site hosting** with global CDN distribution
- **Serverless functions** running at the edge
- **Git-based deployments** with automatic builds
- **Preview deployments** for every commit
- **Advanced routing** and middleware capabilities
- **Full-stack applications** with API routes

### Pages vs Traditional Hosting

| Feature | Cloudflare Pages | Vercel | Netlify | GitHub Pages |
|---------|-----------------|---------|---------|--------------|
| Free Tier Builds | 500/month | Unlimited | 300 min/month | Unlimited |
| Bandwidth | Unlimited | 100GB | 100GB | 100GB |
| Edge Functions | ✅ Workers | ✅ Edge Functions | ✅ Functions | ❌ |
| Custom Domains | Unlimited | 50 | Unlimited | 1 |
| Preview URLs | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ Free | Paid | Paid | ❌ |

## Getting Started

### 1. Create a New Pages Project

```bash
# Using Wrangler CLI
npm create cloudflare@latest my-pages-app -- --framework=react

# Or with any framework
npm create cloudflare@latest my-app -- --framework=vue
npm create cloudflare@latest my-app -- --framework=svelte
npm create cloudflare@latest my-app -- --framework=next
npm create cloudflare@latest my-app -- --framework=nuxt
npm create cloudflare@latest my-app -- --framework=astro
npm create cloudflare@latest my-app -- --framework=remix
```

### 2. Project Structure

```
my-pages-app/
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # React/Vue/Svelte components
│   ├── pages/           # Page components
│   └── styles/          # CSS/SCSS files
├── functions/           # Edge Functions (API routes)
│   ├── api/
│   │   ├── hello.js    # /api/hello endpoint
│   │   └── [[path]].js # Catch-all route
│   └── _middleware.js  # Global middleware
├── wrangler.toml        # Configuration
└── package.json
```

### 3. Configuration

`wrangler.toml`:

```toml
name = "my-pages-app"
compatibility_date = "2025-01-10"

[build]
command = "npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "18"

# Environment variables
[env.production.vars]
API_URL = "https://api.example.com"
ENVIRONMENT = "production"

[env.preview.vars]
API_URL = "https://staging-api.example.com"
ENVIRONMENT = "preview"

# KV Namespaces
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# D1 Database
[[env.production.d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

# R2 Bucket
[[env.production.r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"

# Durable Objects
[[env.production.durable_objects.bindings]]
name = "WEBSOCKET"
class_name = "WebSocketDurableObject"
```

## Edge Functions (API Routes)

### 1. Basic API Route

`functions/api/hello.js`:

```javascript
export async function onRequest(context) {
  // context contains:
  // - request: The incoming Request
  // - env: Environment bindings (KV, D1, etc.)
  // - params: URL parameters
  // - waitUntil: For background tasks
  // - next: For middleware chaining
  // - data: Data from middleware
  
  return new Response(JSON.stringify({ 
    message: 'Hello from the edge!' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Support specific HTTP methods
export async function onRequestPost(context) {
  const body = await context.request.json();
  return new Response(JSON.stringify({ 
    received: body 
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'World';
  
  return new Response(`Hello, ${name}!`);
}
```

### 2. Dynamic Routes

`functions/api/users/[id].js`:

```javascript
export async function onRequest({ params, env }) {
  const userId = params.id;
  
  // Fetch from D1 database
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();
  
  if (!user) {
    return new Response('User not found', { status: 404 });
  }
  
  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 3. Catch-All Routes

`functions/api/[[path]].js`:

```javascript
export async function onRequest({ request, params }) {
  // Catch all routes under /api/
  const path = params.path ? params.path.join('/') : '';
  
  // Custom routing logic
  if (path.startsWith('v2/')) {
    return handleV2Api(request, path);
  }
  
  return new Response('API endpoint not found', { status: 404 });
}

function handleV2Api(request, path) {
  // Handle v2 API routes
  return new Response(JSON.stringify({ 
    version: 'v2', 
    path 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Middleware and Authentication

### 1. Global Middleware

`functions/_middleware.js`:

```javascript
import jwt from '@tsndr/cloudflare-worker-jwt';

export async function onRequest(context) {
  const { request, env, next, data } = context;
  
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Rate limiting
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rate:${ip}`;
  const current = await env.CACHE.get(rateLimitKey);
  
  if (current && parseInt(current) > 100) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: { ...corsHeaders, 'Retry-After': '60' }
    });
  }
  
  await env.CACHE.put(rateLimitKey, String((parseInt(current) || 0) + 1), {
    expirationTtl: 60
  });
  
  // Authentication check for protected routes
  if (request.url.includes('/api/admin')) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }
    
    try {
      const isValid = await jwt.verify(token, env.JWT_SECRET);
      if (!isValid) {
        return new Response('Invalid token', { 
          status: 401,
          headers: corsHeaders 
        });
      }
      
      const decoded = jwt.decode(token);
      data.user = decoded.payload;
    } catch (error) {
      return new Response('Invalid token', { 
        status: 401,
        headers: corsHeaders 
      });
    }
  }
  
  // Continue to the next middleware or route
  const response = await next();
  
  // Add CORS headers to response
  Object.keys(corsHeaders).forEach(key => {
    response.headers.set(key, corsHeaders[key]);
  });
  
  return response;
}
```

### 2. Route-Specific Middleware

`functions/api/admin/_middleware.js`:

```javascript
export async function onRequest({ request, env, next, data }) {
  // This middleware only applies to /api/admin/* routes
  
  // Check admin permissions
  if (!data.user || data.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Log admin action
  await env.DB.prepare(
    'INSERT INTO admin_logs (user_id, action, timestamp) VALUES (?, ?, ?)'
  ).bind(data.user.id, request.url, new Date().toISOString()).run();
  
  return next();
}
```

### 3. Auth Implementation

`functions/api/auth/login.js`:

```javascript
import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    
    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return new Response('Invalid credentials', { status: 401 });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return new Response('Invalid credentials', { status: 401 });
    }
    
    // Generate JWT
    const token = await jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }, env.JWT_SECRET);
    
    // Set secure cookie
    const response = new Response(JSON.stringify({ 
      success: true,
      user: { id: user.id, email: user.email, role: user.role }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    response.headers.append('Set-Cookie', 
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
    );
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

## Framework Integration

### 1. Next.js with Pages

`next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'edge',
  },
  images: {
    loader: 'custom',
    loaderFile: './imageLoader.js',
  },
};

module.exports = nextConfig;
```

`pages/api/data.js`:

```javascript
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // This runs on Cloudflare's edge
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // Access Cloudflare bindings via process.env
  const data = await process.env.KV.get(`data:${id}`);
  
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 2. React with Vite

`vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getPlatformProxy } from 'wrangler';

export default defineConfig(async () => {
  const { env } = await getPlatformProxy();
  
  return {
    plugins: [react()],
    define: {
      'process.env': env,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
  };
});
```

### 3. Astro Integration

`astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: true,
  }),
  vite: {
    define: {
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    },
  },
});
```

`src/pages/api/posts/[id].js`:

```javascript
export async function GET({ params, locals }) {
  // Access Cloudflare bindings via locals.runtime.env
  const post = await locals.runtime.env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(params.id).first();
  
  if (!post) {
    return new Response('Not found', { status: 404 });
  }
  
  return new Response(JSON.stringify(post), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Advanced Patterns

### 1. Server-Side Rendering (SSR)

`functions/[[path]].js`:

```javascript
import { renderToString } from 'react-dom/server';
import App from '../src/App';

export async function onRequest({ request, env, params }) {
  const path = params.path ? `/${params.path.join('/')}` : '/';
  
  // Server-side render React app
  const html = renderToString(<App path={path} env={env} />);
  
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My SSR App</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify({ path })}
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### 2. WebSocket Support with Durable Objects

`functions/ws.js`:

```javascript
export class WebSocketDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }
  
  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    
    const [client, server] = Object.values(new WebSocketPair());
    
    this.handleSession(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  handleSession(websocket) {
    websocket.accept();
    this.sessions.push(websocket);
    
    websocket.addEventListener('message', async (event) => {
      const message = JSON.parse(event.data);
      
      // Broadcast to all connected clients
      this.broadcast(message);
      
      // Store message in database
      await this.env.DB.prepare(
        'INSERT INTO messages (content, timestamp) VALUES (?, ?)'
      ).bind(message.content, new Date().toISOString()).run();
    });
    
    websocket.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== websocket);
    });
  }
  
  broadcast(message) {
    const data = JSON.stringify(message);
    this.sessions.forEach(session => {
      try {
        session.send(data);
      } catch (error) {
        // Remove dead sessions
        this.sessions = this.sessions.filter(s => s !== session);
      }
    });
  }
}

export async function onRequest({ request, env }) {
  const id = env.WEBSOCKET.idFromName('global-chat');
  const stub = env.WEBSOCKET.get(id);
  
  return stub.fetch(request);
}
```

### 3. Image Optimization

`functions/images/[[path]].js`:

```javascript
export async function onRequest({ request, env, params }) {
  const path = params.path ? params.path.join('/') : '';
  const url = new URL(request.url);
  
  // Parse image transformation parameters
  const width = parseInt(url.searchParams.get('w') || '0');
  const height = parseInt(url.searchParams.get('h') || '0');
  const quality = parseInt(url.searchParams.get('q') || '85');
  const format = url.searchParams.get('f') || 'auto';
  
  // Check cache
  const cacheKey = `image:${path}:${width}x${height}:q${quality}:${format}`;
  const cached = await env.CACHE.get(cacheKey, { type: 'stream' });
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': `image/${format === 'auto' ? 'webp' : format}`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }
  
  // Fetch original image
  const original = await env.STORAGE.get(path);
  if (!original) {
    return new Response('Image not found', { status: 404 });
  }
  
  // Apply transformations using Cloudflare Image Resizing
  const transformed = await fetch(request, {
    cf: {
      image: {
        width,
        height,
        quality,
        format,
        fit: 'cover',
      },
    },
  });
  
  const buffer = await transformed.arrayBuffer();
  
  // Cache transformed image
  await env.CACHE.put(cacheKey, buffer, {
    expirationTtl: 86400, // 24 hours
  });
  
  return new Response(buffer, {
    headers: {
      'Content-Type': transformed.headers.get('Content-Type'),
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
```

### 4. A/B Testing

`functions/_middleware.js`:

```javascript
export async function onRequest({ request, env, next, waitUntil }) {
  const url = new URL(request.url);
  
  // Skip A/B testing for API routes
  if (url.pathname.startsWith('/api')) {
    return next();
  }
  
  // Get or create user ID
  const cookies = parseCookies(request.headers.get('Cookie'));
  let userId = cookies.userId;
  
  if (!userId) {
    userId = crypto.randomUUID();
  }
  
  // Determine variant
  const variant = await determineVariant(userId, env);
  
  // Log experiment exposure
  waitUntil(logExperiment(userId, variant, env));
  
  // Modify response based on variant
  const response = await next();
  
  // Inject variant data
  if (response.headers.get('Content-Type')?.includes('text/html')) {
    const html = await response.text();
    const modifiedHtml = html.replace(
      '</head>',
      `<script>window.__AB_VARIANT__ = '${variant}';</script></head>`
    );
    
    const newResponse = new Response(modifiedHtml, response);
    newResponse.headers.set('Set-Cookie', 
      `userId=${userId}; Path=/; Max-Age=2592000; SameSite=Lax`
    );
    
    return newResponse;
  }
  
  return response;
}

async function determineVariant(userId, env) {
  // Check if user already has a variant
  const existing = await env.KV.get(`variant:${userId}`);
  if (existing) return existing;
  
  // Assign variant based on hash
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(userId)
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const variant = parseInt(hashHex.substring(0, 8), 16) % 100 < 50 ? 'A' : 'B';
  
  // Store variant assignment
  await env.KV.put(`variant:${userId}`, variant, {
    expirationTtl: 2592000, // 30 days
  });
  
  return variant;
}

async function logExperiment(userId, variant, env) {
  await env.DB.prepare(
    'INSERT INTO experiments (user_id, variant, timestamp) VALUES (?, ?, ?)'
  ).bind(userId, variant, new Date().toISOString()).run();
}
```

## Deployment Strategies

### 1. Git Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-pages-app
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          wranglerVersion: '3'
```

### 2. Preview Deployments

```javascript
// functions/preview-auth.js
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  
  // Only protect preview deployments
  if (!url.hostname.includes('pages.dev')) {
    return next();
  }
  
  // Basic auth for preview URLs
  const auth = request.headers.get('Authorization');
  
  if (!auth || !auth.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Preview"',
      },
    });
  }
  
  const [user, pass] = atob(auth.substring(6)).split(':');
  
  if (user !== env.PREVIEW_USER || pass !== env.PREVIEW_PASS) {
    return new Response('Invalid credentials', { status: 401 });
  }
  
  return next();
}
```

### 3. Blue-Green Deployment

```javascript
// functions/blue-green.js
export async function onRequest({ request, env, next }) {
  const cookie = parseCookies(request.headers.get('Cookie'));
  const version = cookie.version || 'blue';
  
  // Route to appropriate version
  if (version === 'green') {
    // Fetch from green deployment
    const response = await fetch(`https://green.${env.DOMAIN}${request.url}`);
    return new Response(response.body, response);
  }
  
  // Continue with blue (current) version
  return next();
}

// Admin endpoint to switch versions
export async function onRequestPost({ request, env }) {
  const { version } = await request.json();
  
  if (version !== 'blue' && version !== 'green') {
    return new Response('Invalid version', { status: 400 });
  }
  
  // Update global version
  await env.KV.put('active-version', version);
  
  return new Response(JSON.stringify({ 
    message: `Switched to ${version}` 
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Performance Optimization

### 1. Static Asset Optimization

```javascript
// functions/assets/[[path]].js
export async function onRequest({ request, env, next }) {
  const response = await next();
  
  // Skip non-asset responses
  if (!response.headers.get('Content-Type')?.match(/css|javascript|image/)) {
    return response;
  }
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Set aggressive caching for assets
  newResponse.headers.set('Cache-Control', 
    'public, max-age=31536000, immutable'
  );
  
  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable Brotli compression
  newResponse.headers.set('Content-Encoding', 'br');
  
  return newResponse;
}
```

### 2. HTML Caching Strategy

```javascript
// functions/_middleware.js
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const cacheKey = `html:${url.pathname}`;
  
  // Check if this is a cacheable HTML request
  if (request.method === 'GET' && !url.pathname.startsWith('/api')) {
    // Check cache
    const cached = await env.CACHE.get(cacheKey);
    
    if (cached) {
      const response = new Response(cached, {
        headers: {
          'Content-Type': 'text/html',
          'X-Cache': 'HIT',
        },
      });
      
      return response;
    }
  }
  
  const response = await next();
  
  // Cache successful HTML responses
  if (
    response.status === 200 &&
    response.headers.get('Content-Type')?.includes('text/html')
  ) {
    const html = await response.text();
    
    // Store in cache
    await env.CACHE.put(cacheKey, html, {
      expirationTtl: 300, // 5 minutes
    });
    
    const newResponse = new Response(html, response);
    newResponse.headers.set('X-Cache', 'MISS');
    
    return newResponse;
  }
  
  return response;
}
```

### 3. Resource Hints

```javascript
// functions/optimize-html.js
export async function onRequest({ request, next }) {
  const response = await next();
  
  if (!response.headers.get('Content-Type')?.includes('text/html')) {
    return response;
  }
  
  const html = await response.text();
  
  // Add resource hints
  const optimizedHtml = html.replace('</head>', `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://api.example.com">
    <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="modulepreload" href="/js/app.js">
    </head>
  `);
  
  return new Response(optimizedHtml, response);
}
```

## Security Best Practices

### 1. Content Security Policy

```javascript
// functions/_middleware.js
export async function onRequest({ request, next }) {
  const response = await next();
  
  // Add security headers
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.example.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none';"
  );
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=()'
  );
  
  return response;
}
```

### 2. Input Validation

```javascript
// functions/api/submit.js
import { z } from 'zod';

const FormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  message: z.string().min(10).max(1000),
  age: z.number().min(18).max(120),
});

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = FormSchema.parse(body);
    
    // Sanitize HTML content
    validated.message = sanitizeHtml(validated.message);
    
    // Store in database
    await env.DB.prepare(
      'INSERT INTO submissions (email, name, message, age) VALUES (?, ?, ?, ?)'
    ).bind(
      validated.email,
      validated.name,
      validated.message,
      validated.age
    ).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        errors: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Internal server error', { status: 500 });
  }
}

function sanitizeHtml(input) {
  // Remove potentially dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}
```

### 3. DDoS Protection

```javascript
// functions/_middleware.js
export async function onRequest({ request, env, next }) {
  const ip = request.headers.get('CF-Connecting-IP');
  
  // Check if IP is blocked
  const blocked = await env.KV.get(`blocked:${ip}`);
  if (blocked) {
    return new Response('Access denied', { status: 403 });
  }
  
  // Implement rate limiting
  const rateLimitKey = `rate:${ip}:${Math.floor(Date.now() / 60000)}`;
  const requests = await env.KV.get(rateLimitKey);
  const count = requests ? parseInt(requests) : 0;
  
  if (count > 100) { // 100 requests per minute
    // Block IP for 1 hour
    await env.KV.put(`blocked:${ip}`, 'true', {
      expirationTtl: 3600,
    });
    
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: { 'Retry-After': '3600' },
    });
  }
  
  // Increment counter
  await env.KV.put(rateLimitKey, String(count + 1), {
    expirationTtl: 60,
  });
  
  // Check for suspicious patterns
  const userAgent = request.headers.get('User-Agent');
  if (isSuspicious(userAgent)) {
    await logSuspiciousActivity(ip, userAgent, env);
  }
  
  return next();
}

function isSuspicious(userAgent) {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
```

## Monitoring and Analytics

### 1. Custom Analytics

```javascript
// functions/_middleware.js
export async function onRequest({ request, env, next, waitUntil }) {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  
  // Log request analytics
  waitUntil(logAnalytics({
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    status: response.status,
    duration,
    ip: request.headers.get('CF-Connecting-IP'),
    country: request.headers.get('CF-IPCountry'),
    userAgent: request.headers.get('User-Agent'),
  }, env));
  
  // Add Server-Timing header
  response.headers.set('Server-Timing', `total;dur=${duration}`);
  
  return response;
}

async function logAnalytics(data, env) {
  // Store in D1 database
  await env.DB.prepare(`
    INSERT INTO analytics 
    (timestamp, method, path, status, duration, ip, country, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.timestamp,
    data.method,
    data.path,
    data.status,
    data.duration,
    data.ip,
    data.country,
    data.userAgent
  ).run();
  
  // Send to external analytics service
  await fetch('https://analytics.example.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
```

### 2. Error Tracking

```javascript
// functions/_middleware.js
export async function onRequest({ request, env, next }) {
  try {
    return await next();
  } catch (error) {
    // Log error to Sentry or similar
    await logError(error, request, env);
    
    // Return user-friendly error
    return new Response('Something went wrong', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function logError(error, request, env) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    timestamp: new Date().toISOString(),
  };
  
  // Store in database
  await env.DB.prepare(`
    INSERT INTO errors 
    (message, stack, url, method, headers, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    errorData.message,
    errorData.stack,
    errorData.url,
    errorData.method,
    JSON.stringify(errorData.headers),
    errorData.timestamp
  ).run();
  
  // Send to error tracking service
  await fetch('https://sentry.io/api/PROJECT_ID/store/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_key=${env.SENTRY_KEY}`,
    },
    body: JSON.stringify(errorData),
  });
}
```

## Troubleshooting

### Common Issues and Solutions

```javascript
// 1. Function timeout issues
export async function onRequest({ request, env, waitUntil }) {
  // Use waitUntil for background tasks
  waitUntil(performBackgroundTask(env));
  
  // Return response immediately
  return new Response('Processing started');
}

// 2. Large response handling
export async function onRequest({ request, env }) {
  // Stream large responses
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  // Start streaming
  streamLargeData(writer, env);
  
  return new Response(readable, {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 3. CORS issues
export async function onRequest({ request, next }) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  const response = await next();
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  
  return response;
}
```

## Conclusion

Cloudflare Pages with Edge Functions provides a powerful platform for modern web applications:

- **Global edge deployment** with automatic scaling
- **Serverless functions** integrated with static hosting
- **Full-stack capabilities** with database and storage bindings
- **Advanced features** like WebSockets, SSR, and middleware
- **Built-in security** and performance optimization

### Key Takeaways

1. **Use middleware** for cross-cutting concerns
2. **Leverage caching** at multiple levels
3. **Implement proper error handling** and monitoring
4. **Follow security best practices** from the start
5. **Optimize for performance** with edge computing

### Next Steps

- Explore [Pages Functions documentation](https://developers.cloudflare.com/pages/platform/functions/)
- Learn about [Direct Upload](https://developers.cloudflare.com/pages/platform/direct-upload/)
- Implement [Web Analytics](https://developers.cloudflare.com/analytics/web-analytics/)
- Set up [Pages CI/CD](https://developers.cloudflare.com/pages/platform/git-integration/)

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Edge Functions Guide](https://developers.cloudflare.com/pages/platform/functions/)
- [Framework Guides](https://developers.cloudflare.com/pages/framework-guides/)
- [Pages Pricing](https://developers.cloudflare.com/pages/platform/pricing/)
- [Community Discord](https://discord.cloudflare.com)