---
author: Anubhav Gain
pubDatetime: 2025-08-10T14:30:00+05:30
modDatetime: 2025-08-10T14:30:00+05:30
title: Building Full-Stack Applications with Cloudflare Workers and D1 Database
slug: cloudflare-workers-d1-database-guide
featured: true
draft: false
tags:
  - cloudflare
  - workers
  - d1
  - database
  - edge-computing
  - serverless
  - sql
  - sqlite
description: Complete guide to building full-stack applications using Cloudflare Workers and D1 Database, including authentication, CRUD operations, and performance optimization.
---

# Building Full-Stack Applications with Cloudflare Workers and D1 Database

Cloudflare Workers and D1 Database provide a powerful platform for building globally distributed, serverless applications. This comprehensive guide walks through creating a full-stack application with authentication, CRUD operations, and performance optimization.

## Table of Contents

## Introduction

Cloudflare D1 is a serverless SQL database built on SQLite, designed specifically for Cloudflare Workers. Combined with Workers' edge computing capabilities, you can build applications that run close to users worldwide with ultra-low latency.

### Key Benefits

- **Global Distribution**: Data automatically replicated across Cloudflare's network
- **SQLite Compatibility**: Use familiar SQL syntax and tools
- **Serverless Architecture**: No infrastructure management required
- **Cost-Effective**: Pay only for what you use
- **Zero-Latency Reads**: Read replicas available in multiple regions

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI installed (`npm install -g wrangler`)
- Basic knowledge of JavaScript/TypeScript and SQL

## Setting Up Your Project

### 1. Initialize the Project

```bash
# Create a new Workers project
npm create cloudflare@latest my-d1-app
cd my-d1-app

# Select "Worker" when prompted
# Choose TypeScript for better type safety
```

### 2. Configure wrangler.toml

```toml
name = "my-d1-app"
main = "src/index.ts"
compatibility_date = "2025-01-10"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "YOUR_DATABASE_ID"

# Environment variables
[vars]
JWT_SECRET = "your-secret-key"
API_VERSION = "v1"

# Custom domains (optional)
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## Creating and Managing D1 Database

### 1. Create a D1 Database

```bash
# Create a new D1 database
wrangler d1 create my-app-db

# This will output a database_id - add it to wrangler.toml
```

### 2. Define Database Schema

Create `schema.sql`:

```sql
-- Users table with authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Posts table for blog content
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Post-Tag relationship
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

### 3. Apply Schema to Database

```bash
# Apply schema to local database
wrangler d1 execute my-app-db --local --file=./schema.sql

# Apply to production database
wrangler d1 execute my-app-db --remote --file=./schema.sql
```

## Building the Worker Application

### 1. Project Structure

```
my-d1-app/
├── src/
│   ├── index.ts          # Main entry point
│   ├── router.ts         # Request routing
│   ├── middleware/
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── cors.ts       # CORS handling
│   │   └── rateLimit.ts  # Rate limiting
│   ├── handlers/
│   │   ├── auth.ts       # Auth endpoints
│   │   ├── posts.ts      # Posts CRUD
│   │   └── users.ts      # User management
│   ├── models/
│   │   ├── user.ts       # User model
│   │   └── post.ts       # Post model
│   └── utils/
│       ├── db.ts         # Database utilities
│       ├── jwt.ts        # JWT handling
│       └── validation.ts # Input validation
├── wrangler.toml
├── package.json
└── tsconfig.json
```

### 2. Main Worker Entry Point

`src/index.ts`:

```typescript
import { Router } from 'itty-router';
import { authMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authHandler } from './handlers/auth';
import { postsHandler } from './handlers/posts';
import { usersHandler } from './handlers/users';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  RATE_LIMIT: KVNamespace;
}

const router = Router();

// Apply global middleware
router.all('*', corsMiddleware);
router.all('*', rateLimitMiddleware);

// Public routes
router.post('/api/auth/register', authHandler.register);
router.post('/api/auth/login', authHandler.login);
router.get('/api/posts', postsHandler.getAll);
router.get('/api/posts/:slug', postsHandler.getBySlug);

// Protected routes
router.all('/api/admin/*', authMiddleware);
router.post('/api/admin/posts', postsHandler.create);
router.put('/api/admin/posts/:id', postsHandler.update);
router.delete('/api/admin/posts/:id', postsHandler.delete);
router.get('/api/admin/users', usersHandler.getAll);

// Health check
router.get('/health', () => new Response('OK', { status: 200 }));

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
```

### 3. Authentication Implementation

`src/handlers/auth.ts`:

```typescript
import { Env } from '../index';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { generateJWT } from '../utils/jwt';
import { validateEmail, validatePassword } from '../utils/validation';

export const authHandler = {
  async register(request: Request, env: Env): Promise<Response> {
    try {
      const { email, username, password } = await request.json();

      // Validate input
      if (!validateEmail(email)) {
        return new Response('Invalid email', { status: 400 });
      }
      if (!validatePassword(password)) {
        return new Response('Password must be at least 8 characters', { status: 400 });
      }

      // Check if user exists
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ? OR username = ?'
      )
        .bind(email, username)
        .first();

      if (existingUser) {
        return new Response('User already exists', { status: 409 });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const result = await env.DB.prepare(
        'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
      )
        .bind(email, username, passwordHash)
        .run();

      // Generate JWT
      const token = await generateJWT(
        { userId: result.meta.last_row_id, email },
        env.JWT_SECRET
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          token,
          user: { id: result.meta.last_row_id, email, username }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },

  async login(request: Request, env: Env): Promise<Response> {
    try {
      const { email, password } = await request.json();

      // Get user from database
      const user = await env.DB.prepare(
        'SELECT id, email, username, password_hash FROM users WHERE email = ? AND is_active = 1'
      )
        .bind(email)
        .first();

      if (!user) {
        return new Response('Invalid credentials', { status: 401 });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return new Response('Invalid credentials', { status: 401 });
      }

      // Generate JWT
      const token = await generateJWT(
        { userId: user.id, email: user.email },
        env.JWT_SECRET
      );

      return new Response(
        JSON.stringify({
          success: true,
          token,
          user: { id: user.id, email: user.email, username: user.username }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
```

## CRUD Operations with D1

### Posts Handler Implementation

`src/handlers/posts.ts`:

```typescript
import { Env } from '../index';
import { generateSlug } from '../utils/slug';

export const postsHandler = {
  async getAll(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM posts WHERE published = 1'
      ).first();

      // Get posts with user information
      const posts = await env.DB.prepare(`
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.excerpt,
          p.views,
          p.created_at,
          p.updated_at,
          u.username as author,
          GROUP_CONCAT(t.name) as tags
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.published = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `)
        .bind(limit, offset)
        .all();

      return new Response(
        JSON.stringify({
          posts: posts.results,
          pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error fetching posts:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },

  async getBySlug(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const slug = url.pathname.split('/').pop();

      // Increment view count
      await env.DB.prepare(
        'UPDATE posts SET views = views + 1 WHERE slug = ?'
      ).bind(slug).run();

      // Get post with related data
      const post = await env.DB.prepare(`
        SELECT 
          p.*,
          u.username as author,
          GROUP_CONCAT(t.name) as tags
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.slug = ? AND p.published = 1
        GROUP BY p.id
      `)
        .bind(slug)
        .first();

      if (!post) {
        return new Response('Post not found', { status: 404 });
      }

      // Get comments
      const comments = await env.DB.prepare(`
        SELECT 
          c.id,
          c.content,
          c.created_at,
          u.username as author
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
      `)
        .bind(post.id)
        .all();

      return new Response(
        JSON.stringify({
          post: {
            ...post,
            tags: post.tags ? post.tags.split(',') : [],
            comments: comments.results
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error fetching post:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },

  async create(request: Request, env: Env): Promise<Response> {
    try {
      const { title, content, excerpt, tags, published } = await request.json();
      const userId = request.user.userId; // From auth middleware

      // Generate slug
      const slug = generateSlug(title);

      // Start transaction
      const tx = await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO posts (user_id, title, slug, content, excerpt, published) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(userId, title, slug, content, excerpt, published ? 1 : 0)
      ]);

      const postId = tx[0].meta.last_row_id;

      // Handle tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tagSlug = generateSlug(tagName);
          
          // Insert or get tag
          await env.DB.prepare(
            'INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)'
          ).bind(tagName, tagSlug).run();

          const tag = await env.DB.prepare(
            'SELECT id FROM tags WHERE slug = ?'
          ).bind(tagSlug).first();

          // Link post to tag
          await env.DB.prepare(
            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)'
          ).bind(postId, tag.id).run();
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          post: { id: postId, slug }
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('Error creating post:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }
};
```

## Advanced Features

### 1. Full-Text Search

```typescript
// Enable FTS5 for full-text search
const createSearchTable = `
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, content, excerpt,
  content=posts
);

-- Trigger to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts (rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
  UPDATE posts_fts SET 
    title = new.title,
    content = new.content,
    excerpt = new.excerpt
  WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  DELETE FROM posts_fts WHERE rowid = old.id;
END;
`;

// Search implementation
async function searchPosts(query: string, env: Env) {
  const results = await env.DB.prepare(`
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      highlight(posts_fts, 0, '<mark>', '</mark>') as highlighted_title,
      snippet(posts_fts, 1, '<mark>', '</mark>', '...', 30) as snippet
    FROM posts p
    JOIN posts_fts ON p.id = posts_fts.rowid
    WHERE posts_fts MATCH ?
    ORDER BY rank
    LIMIT 20
  `).bind(query).all();

  return results;
}
```

### 2. Caching with Workers KV

```typescript
// Cache frequently accessed data
async function getCachedPost(slug: string, env: Env): Promise<any> {
  // Check cache first
  const cached = await env.KV.get(`post:${slug}`, { type: 'json' });
  if (cached) {
    return cached;
  }

  // Fetch from database
  const post = await env.DB.prepare(
    'SELECT * FROM posts WHERE slug = ?'
  ).bind(slug).first();

  if (post) {
    // Cache for 1 hour
    await env.KV.put(`post:${slug}`, JSON.stringify(post), {
      expirationTtl: 3600
    });
  }

  return post;
}

// Invalidate cache on update
async function updatePost(id: number, data: any, env: Env) {
  const result = await env.DB.prepare(
    'UPDATE posts SET ... WHERE id = ?'
  ).bind(...values, id).run();

  // Clear cache
  const post = await env.DB.prepare(
    'SELECT slug FROM posts WHERE id = ?'
  ).bind(id).first();
  
  if (post) {
    await env.KV.delete(`post:${post.slug}`);
  }

  return result;
}
```

### 3. Rate Limiting

`src/middleware/rateLimit.ts`:

```typescript
export async function rateLimitMiddleware(request: Request, env: Env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate:${ip}`;
  
  // Get current count
  const current = await env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current) : 0;
  
  // Check limit (100 requests per minute)
  if (count >= 100) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }
  
  // Increment counter
  await env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: 60
  });
}
```

## Performance Optimization

### 1. Query Optimization

```typescript
// Use prepared statements for better performance
const preparedStatements = {
  getPost: null,
  updateViews: null
};

async function initPreparedStatements(env: Env) {
  preparedStatements.getPost = env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  );
  preparedStatements.updateViews = env.DB.prepare(
    'UPDATE posts SET views = views + 1 WHERE id = ?'
  );
}

// Use batching for multiple operations
async function batchOperations(env: Env) {
  const operations = [
    env.DB.prepare('INSERT INTO ...').bind(...),
    env.DB.prepare('UPDATE ...').bind(...),
    env.DB.prepare('DELETE ...').bind(...)
  ];
  
  const results = await env.DB.batch(operations);
  return results;
}
```

### 2. Connection Pooling and Replication

```typescript
// D1 automatically handles connection pooling
// Use read replicas for better performance
async function readFromReplica(env: Env) {
  // D1 automatically routes read queries to nearest replica
  const result = await env.DB.prepare(
    'SELECT * FROM posts WHERE published = 1'
  ).all();
  
  return result;
}

// Write operations always go to primary
async function writeToMaster(env: Env) {
  const result = await env.DB.prepare(
    'INSERT INTO posts ...'
  ).run();
  
  return result;
}
```

## Deployment and Monitoring

### 1. Deploy to Production

```bash
# Deploy your Worker
wrangler publish

# View logs
wrangler tail

# Check D1 metrics
wrangler d1 info my-app-db
```

### 2. Monitoring and Analytics

```typescript
// Add custom analytics
async function trackAnalytics(request: Request, env: Env) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent');
  const ip = request.headers.get('CF-Connecting-IP');
  
  await env.DB.prepare(`
    INSERT INTO analytics (path, user_agent, ip, timestamp)
    VALUES (?, ?, ?, ?)
  `).bind(
    url.pathname,
    userAgent,
    ip,
    new Date().toISOString()
  ).run();
}

// Query analytics
async function getAnalytics(env: Env) {
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      COUNT(DISTINCT ip) as unique_visitors,
      path,
      COUNT(*) as hits
    FROM analytics
    WHERE timestamp > datetime('now', '-7 days')
    GROUP BY path
    ORDER BY hits DESC
    LIMIT 10
  `).all();
  
  return stats;
}
```

## Security Best Practices

### 1. SQL Injection Prevention

```typescript
// Always use parameterized queries
// GOOD
const user = await env.DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();

// BAD - Never do this!
// const user = await env.DB.prepare(
//   `SELECT * FROM users WHERE id = ${userId}`
// ).first();
```

### 2. Input Validation

```typescript
import { z } from 'zod';

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  published: z.boolean().default(false)
});

async function validatePostInput(data: unknown) {
  try {
    return PostSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid input');
  }
}
```

### 3. Authentication & Authorization

```typescript
// Implement role-based access control
async function checkPermission(userId: number, resource: string, action: string, env: Env) {
  const permission = await env.DB.prepare(`
    SELECT COUNT(*) as allowed
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND p.resource = ? AND p.action = ?
  `).bind(userId, resource, action).first();
  
  return permission.allowed > 0;
}

// Use in handlers
if (!await checkPermission(userId, 'posts', 'delete', env)) {
  return new Response('Forbidden', { status: 403 });
}
```

## Troubleshooting Common Issues

### 1. Database Locked Error

```typescript
// Implement retry logic for concurrent writes
async function retryableWrite(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('database is locked') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}
```

### 2. Query Performance Issues

```typescript
// Use EXPLAIN QUERY PLAN to analyze slow queries
async function analyzeQuery(query: string, env: Env) {
  const plan = await env.DB.prepare(
    `EXPLAIN QUERY PLAN ${query}`
  ).all();
  
  console.log('Query plan:', plan);
  
  // Look for table scans and missing indexes
  const issues = plan.results.filter(row => 
    row.detail.includes('SCAN TABLE')
  );
  
  if (issues.length > 0) {
    console.warn('Performance issue: Table scan detected');
  }
}
```

## Conclusion

Cloudflare Workers with D1 Database provides a powerful platform for building globally distributed, full-stack applications. Key takeaways:

- **D1 offers SQLite compatibility** with serverless benefits
- **Automatic replication** ensures low-latency reads worldwide
- **Built-in security features** when following best practices
- **Cost-effective scaling** with pay-per-use pricing
- **Integrated ecosystem** with KV, R2, and other Cloudflare services

### Next Steps

1. Explore [D1 read replicas](https://developers.cloudflare.com/d1/platform/read-replicas/) for enhanced performance
2. Implement [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/) for stateful applications
3. Add [Cloudflare R2](https://developers.cloudflare.com/r2/) for file storage
4. Set up [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) for custom metrics

## Resources

- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)