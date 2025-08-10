---
author: Anubhav Gain
pubDatetime: 2025-08-10T15:00:00+05:30
modDatetime: 2025-08-10T15:00:00+05:30
title: Mastering Cloudflare R2 Storage - Zero Egress Object Storage Solution
slug: cloudflare-r2-storage-complete-guide
featured: true
draft: false
tags:
  - cloudflare
  - r2
  - storage
  - s3
  - object-storage
  - cdn
  - serverless
  - backup
description: Complete guide to Cloudflare R2 Storage including migration from S3, direct uploads, streaming, CDN integration, and building a production-ready file storage system.
---

# Mastering Cloudflare R2 Storage: Zero Egress Object Storage Solution

Cloudflare R2 is an S3-compatible object storage service that eliminates egress fees, making it cost-effective for bandwidth-intensive applications. This comprehensive guide covers everything from basic setup to advanced features like multipart uploads, streaming, and CDN integration.

## Table of Contents

## Introduction

Cloudflare R2 revolutionizes cloud storage by eliminating egress fees while maintaining S3 API compatibility. This makes it ideal for:

- **Media streaming platforms** - No bandwidth costs for video/audio delivery
- **Backup and archival** - Cost-effective long-term storage
- **Static asset hosting** - Images, documents, and downloads
- **Data lakes** - Store and analyze large datasets
- **Content distribution** - Integrated with Cloudflare's global CDN

### R2 vs Traditional Storage Comparison

| Feature | Cloudflare R2 | AWS S3 | Google Cloud Storage |
|---------|---------------|--------|---------------------|
| Storage Cost | $0.015/GB/month | $0.023/GB/month | $0.020/GB/month |
| Egress Cost | **$0** | $0.09/GB | $0.12/GB |
| API Requests | $0.36-$4.50/million | $0.40-$5.00/million | $0.50-$10.00/million |
| S3 Compatibility | ✅ Full | ✅ Native | ⚠️ Partial |
| Minimum Storage | None | None | None |
| Global Replication | Automatic | Manual/Extra Cost | Manual/Extra Cost |

## Getting Started with R2

### 1. Enable R2 in Cloudflare Dashboard

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Create a new R2 bucket
wrangler r2 bucket create my-storage-bucket
```

### 2. Configure R2 in Your Project

`wrangler.toml`:

```toml
name = "r2-storage-app"
main = "src/index.ts"
compatibility_date = "2025-01-10"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-storage-bucket"
preview_bucket_name = "preview-storage-bucket"

# Optional: Custom domain for public access
[[routes]]
pattern = "cdn.yourdomain.com/*"
zone_name = "yourdomain.com"

# Environment variables
[vars]
ALLOWED_ORIGINS = "https://yourdomain.com"
MAX_FILE_SIZE = "104857600" # 100MB in bytes
```

### 3. R2 Access Credentials

Generate API tokens for external access:

```bash
# Via Dashboard: R2 > Manage R2 API Tokens
# Or via API:

curl -X POST https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/tokens \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production-token",
    "permissions": ["read", "write"],
    "bucket": "my-storage-bucket"
  }'
```

## Building a File Storage System

### 1. Worker with R2 Integration

`src/index.ts`:

```typescript
import { Router } from 'itty-router';

export interface Env {
  STORAGE: R2Bucket;
  ALLOWED_ORIGINS: string;
  MAX_FILE_SIZE: string;
}

const router = Router();

// CORS middleware
const corsHeaders = (origin: string, env: Env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS.includes(origin) ? origin : '',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
});

// File upload endpoint
router.post('/upload', async (request: Request, env: Env) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response('No file provided', { status: 400 });
      }
      
      // Validate file size
      if (file.size > parseInt(env.MAX_FILE_SIZE)) {
        return new Response('File too large', { status: 413 });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const key = `uploads/${filename}`;
      
      // Upload to R2
      const object = await env.STORAGE.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          uploadedBy: request.headers.get('x-user-id') || 'anonymous',
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          key: object.key,
          size: object.size,
          etag: object.etag,
          url: `/files/${key}`,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Handle direct binary upload
    const buffer = await request.arrayBuffer();
    const key = `uploads/${Date.now()}-file`;
    
    await env.STORAGE.put(key, buffer, {
      httpMetadata: {
        contentType: contentType,
      },
    });
    
    return new Response(JSON.stringify({ success: true, key }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
});

// File retrieval endpoint
router.get('/files/*', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/files/', '');
    
    // Check if object exists
    const object = await env.STORAGE.get(key);
    
    if (!object) {
      return new Response('File not found', { status: 404 });
    }
    
    // Handle range requests for video streaming
    const range = request.headers.get('range');
    if (range) {
      const bytes = range.replace(/bytes=/, '').split('-');
      const start = parseInt(bytes[0], 10);
      const end = bytes[1] ? parseInt(bytes[1], 10) : object.size - 1;
      
      const chunk = await env.STORAGE.get(key, {
        range: { offset: start, length: end - start + 1 },
      });
      
      return new Response(chunk.body, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${object.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        },
      });
    }
    
    // Return full object
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': String(object.size),
        'ETag': object.etag,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Retrieval error:', error);
    return new Response('Error retrieving file', { status: 500 });
  }
});

// List files endpoint
router.get('/list', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const cursor = url.searchParams.get('cursor') || undefined;
    
    const listed = await env.STORAGE.list({
      prefix,
      limit,
      cursor,
      include: ['httpMetadata', 'customMetadata'],
    });
    
    const files = listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      etag: obj.etag,
      metadata: obj.customMetadata,
    }));
    
    return new Response(
      JSON.stringify({
        files,
        truncated: listed.truncated,
        cursor: listed.cursor,
        delimitedPrefixes: listed.delimitedPrefixes,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('List error:', error);
    return new Response('Error listing files', { status: 500 });
  }
});

// Delete file endpoint
router.delete('/files/*', async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const key = url.pathname.replace('/files/', '');
    
    await env.STORAGE.delete(key);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response('Error deleting file', { status: 500 });
  }
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router.handle(request, env);
  },
};
```

## Direct Upload from Browser

### 1. Presigned URLs for Direct Upload

```typescript
// Generate presigned URL for direct browser upload
router.post('/presigned-url', async (request: Request, env: Env) => {
  try {
    const { filename, contentType } = await request.json();
    
    // Generate unique key
    const key = `uploads/${Date.now()}-${filename}`;
    
    // Create presigned URL (valid for 1 hour)
    const url = await env.STORAGE.createMultipartUpload(key, {
      httpMetadata: { contentType },
    });
    
    return new Response(
      JSON.stringify({
        uploadUrl: url,
        key,
        expires: new Date(Date.now() + 3600000).toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Presigned URL error:', error);
    return new Response('Error generating upload URL', { status: 500 });
  }
});
```

### 2. Browser Upload Component

```html
<!DOCTYPE html>
<html>
<head>
  <title>R2 Direct Upload</title>
</head>
<body>
  <div id="upload-container">
    <input type="file" id="file-input" multiple />
    <button id="upload-btn">Upload Files</button>
    <div id="progress"></div>
    <div id="results"></div>
  </div>

  <script>
    class R2Uploader {
      constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.chunkSize = 5 * 1024 * 1024; // 5MB chunks
      }

      async uploadFile(file) {
        const progressBar = this.createProgressBar(file.name);
        
        try {
          // For large files, use multipart upload
          if (file.size > this.chunkSize) {
            return await this.multipartUpload(file, progressBar);
          }
          
          // For small files, use simple upload
          return await this.simpleUpload(file, progressBar);
        } catch (error) {
          console.error('Upload error:', error);
          progressBar.setError(error.message);
          throw error;
        }
      }

      async simpleUpload(file, progressBar) {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              progressBar.update(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              progressBar.setComplete(response.url);
              resolve(response);
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
          });

          xhr.open('POST', `${this.apiEndpoint}/upload`);
          xhr.send(formData);
        });
      }

      async multipartUpload(file, progressBar) {
        // Initiate multipart upload
        const initResponse = await fetch(`${this.apiEndpoint}/multipart/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        const { uploadId, key } = await initResponse.json();
        
        // Upload chunks
        const chunks = Math.ceil(file.size / this.chunkSize);
        const parts = [];
        
        for (let i = 0; i < chunks; i++) {
          const start = i * this.chunkSize;
          const end = Math.min(start + this.chunkSize, file.size);
          const chunk = file.slice(start, end);
          
          const partResponse = await this.uploadPart(
            key,
            uploadId,
            i + 1,
            chunk
          );
          
          parts.push({
            partNumber: i + 1,
            etag: partResponse.etag,
          });
          
          progressBar.update(((i + 1) / chunks) * 100);
        }
        
        // Complete multipart upload
        const completeResponse = await fetch(`${this.apiEndpoint}/multipart/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            uploadId,
            parts,
          }),
        });
        
        const result = await completeResponse.json();
        progressBar.setComplete(result.url);
        return result;
      }

      async uploadPart(key, uploadId, partNumber, chunk) {
        const response = await fetch(`${this.apiEndpoint}/multipart/part`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Upload-Id': uploadId,
            'X-Part-Number': String(partNumber),
            'X-Key': key,
          },
          body: chunk,
        });
        
        return response.json();
      }

      createProgressBar(filename) {
        const container = document.getElementById('progress');
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-item';
        progressDiv.innerHTML = `
          <div class="filename">${filename}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0%</div>
        `;
        container.appendChild(progressDiv);
        
        return {
          update(percent) {
            progressDiv.querySelector('.progress-fill').style.width = `${percent}%`;
            progressDiv.querySelector('.progress-text').textContent = `${Math.round(percent)}%`;
          },
          setComplete(url) {
            progressDiv.querySelector('.progress-text').textContent = 'Complete';
            progressDiv.querySelector('.progress-text').innerHTML += 
              `<a href="${url}" target="_blank">View</a>`;
          },
          setError(message) {
            progressDiv.querySelector('.progress-text').textContent = `Error: ${message}`;
            progressDiv.style.color = 'red';
          },
        };
      }
    }

    // Initialize uploader
    const uploader = new R2Uploader('/api');
    
    document.getElementById('upload-btn').addEventListener('click', async () => {
      const files = document.getElementById('file-input').files;
      
      for (const file of files) {
        try {
          await uploader.uploadFile(file);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
    });
  </script>

  <style>
    #upload-container {
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .progress-item {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .progress-bar {
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      margin: 5px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s;
    }
    
    .filename {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .progress-text {
      font-size: 14px;
      color: #666;
    }
  </style>
</body>
</html>
```

## Advanced R2 Features

### 1. Multipart Upload Implementation

```typescript
// Server-side multipart upload handler
interface MultipartUpload {
  uploadId: string;
  key: string;
  parts: Array<{ partNumber: number; etag: string }>;
}

const activeUploads = new Map<string, MultipartUpload>();

router.post('/multipart/init', async (request: Request, env: Env) => {
  const { filename, contentType, size } = await request.json();
  
  const key = `uploads/${Date.now()}-${filename}`;
  const uploadId = crypto.randomUUID();
  
  // Store upload info (in production, use D1 or Durable Objects)
  activeUploads.set(uploadId, {
    uploadId,
    key,
    parts: [],
  });
  
  return new Response(
    JSON.stringify({ uploadId, key }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

router.put('/multipart/part', async (request: Request, env: Env) => {
  const uploadId = request.headers.get('X-Upload-Id');
  const partNumber = parseInt(request.headers.get('X-Part-Number') || '0');
  const key = request.headers.get('X-Key');
  
  if (!uploadId || !partNumber || !key) {
    return new Response('Missing required headers', { status: 400 });
  }
  
  const upload = activeUploads.get(uploadId);
  if (!upload) {
    return new Response('Upload not found', { status: 404 });
  }
  
  // Upload part to R2
  const partKey = `${key}.part${partNumber}`;
  const buffer = await request.arrayBuffer();
  
  const object = await env.STORAGE.put(partKey, buffer);
  
  // Track part
  upload.parts.push({ partNumber, etag: object.etag });
  
  return new Response(
    JSON.stringify({ partNumber, etag: object.etag }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

router.post('/multipart/complete', async (request: Request, env: Env) => {
  const { uploadId, key, parts } = await request.json();
  
  const upload = activeUploads.get(uploadId);
  if (!upload) {
    return new Response('Upload not found', { status: 404 });
  }
  
  // Combine parts
  const partKeys = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(p => `${key}.part${p.partNumber}`);
  
  const chunks = await Promise.all(
    partKeys.map(k => env.STORAGE.get(k))
  );
  
  // Concatenate chunks
  const blobs = await Promise.all(
    chunks.map(c => c?.blob())
  );
  
  const combinedBlob = new Blob(blobs.filter(b => b !== undefined));
  
  // Upload combined file
  await env.STORAGE.put(key, combinedBlob.stream());
  
  // Clean up parts
  await Promise.all(
    partKeys.map(k => env.STORAGE.delete(k))
  );
  
  activeUploads.delete(uploadId);
  
  return new Response(
    JSON.stringify({ success: true, key, url: `/files/${key}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 2. Image Processing and Thumbnails

```typescript
import { Resizer } from '@cf/image-resizer';

router.get('/images/*', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const key = url.pathname.replace('/images/', '');
  const width = parseInt(url.searchParams.get('w') || '0');
  const height = parseInt(url.searchParams.get('h') || '0');
  const quality = parseInt(url.searchParams.get('q') || '85');
  
  // Check if thumbnail exists
  const thumbnailKey = `thumbnails/${width}x${height}/${key}`;
  let object = await env.STORAGE.get(thumbnailKey);
  
  if (!object && (width || height)) {
    // Generate thumbnail
    const original = await env.STORAGE.get(key);
    if (!original) {
      return new Response('Image not found', { status: 404 });
    }
    
    // Use Cloudflare Image Resizing
    const resized = await fetch(`https://example.com/cdn-cgi/image/width=${width},height=${height},quality=${quality}/${key}`, {
      cf: {
        image: {
          width,
          height,
          quality,
          format: 'auto',
        },
      },
    });
    
    const resizedBuffer = await resized.arrayBuffer();
    
    // Cache thumbnail
    await env.STORAGE.put(thumbnailKey, resizedBuffer, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    object = await env.STORAGE.get(thumbnailKey);
  }
  
  if (!object) {
    object = await env.STORAGE.get(key);
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
      'ETag': object.etag,
    },
  });
});
```

### 3. Video Streaming with Adaptive Bitrate

```typescript
router.get('/stream/*', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const key = url.pathname.replace('/stream/', '');
  
  // Get video metadata
  const object = await env.STORAGE.head(key);
  if (!object) {
    return new Response('Video not found', { status: 404 });
  }
  
  const range = request.headers.get('range');
  if (!range) {
    // Return video metadata for player
    return new Response(
      JSON.stringify({
        duration: object.customMetadata?.duration,
        size: object.size,
        type: object.httpMetadata?.contentType,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Parse range header
  const matches = range.match(/bytes=(\d+)-(\d*)/);
  if (!matches) {
    return new Response('Invalid range', { status: 416 });
  }
  
  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : Math.min(start + 1024 * 1024, object.size - 1);
  
  // Stream video chunk
  const chunk = await env.STORAGE.get(key, {
    range: { offset: start, length: end - start + 1 },
  });
  
  if (!chunk) {
    return new Response('Failed to retrieve chunk', { status: 500 });
  }
  
  return new Response(chunk.body, {
    status: 206,
    headers: {
      'Content-Range': `bytes ${start}-${end}/${object.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(end - start + 1),
      'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// Generate HLS playlist for adaptive streaming
router.get('/hls/:key/playlist.m3u8', async (request: Request, env: Env) => {
  const { key } = request.params;
  
  // Get available quality levels
  const qualities = await env.STORAGE.list({
    prefix: `transcoded/${key}/`,
  });
  
  const playlist = `#EXTM3U
#EXT-X-VERSION:3
${qualities.objects.map(obj => {
  const quality = obj.key.split('/').pop()?.replace('.m3u8', '');
  const bandwidth = quality === '1080p' ? 5000000 : 
                   quality === '720p' ? 2500000 : 
                   quality === '480p' ? 1000000 : 500000;
  
  return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality}
/hls/${key}/${quality}.m3u8`;
}).join('\n')}`;
  
  return new Response(playlist, {
    headers: {
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
```

## S3 Migration to R2

### 1. Migration Script

```javascript
// migrate-s3-to-r2.js
const AWS = require('aws-sdk');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

class S3ToR2Migrator {
  constructor(config) {
    // S3 Client
    this.s3 = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
    });
    
    // R2 Client (S3-compatible)
    this.r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKey,
        secretAccessKey: config.r2.secretKey,
      },
    });
    
    this.s3Bucket = config.s3.bucket;
    this.r2Bucket = config.r2.bucket;
    this.batchSize = config.batchSize || 100;
  }
  
  async migrate(prefix = '') {
    let continuationToken = undefined;
    let totalMigrated = 0;
    let totalSize = 0;
    
    console.log(`Starting migration from S3 bucket: ${this.s3Bucket} to R2 bucket: ${this.r2Bucket}`);
    
    do {
      // List objects from S3
      const listCommand = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: prefix,
        MaxKeys: this.batchSize,
        ContinuationToken: continuationToken,
      });
      
      const listResponse = await this.s3.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break;
      }
      
      // Process batch
      const migrationPromises = listResponse.Contents.map(async (object) => {
        try {
          // Skip if object already exists in R2
          if (await this.objectExistsInR2(object.Key)) {
            console.log(`Skipping ${object.Key} - already exists in R2`);
            return;
          }
          
          // Get object from S3
          const getCommand = new GetObjectCommand({
            Bucket: this.s3Bucket,
            Key: object.Key,
          });
          
          const s3Object = await this.s3.send(getCommand);
          
          // Upload to R2
          await this.r2.send(new PutObjectCommand({
            Bucket: this.r2Bucket,
            Key: object.Key,
            Body: s3Object.Body,
            ContentType: s3Object.ContentType,
            Metadata: s3Object.Metadata,
          }));
          
          console.log(`✓ Migrated: ${object.Key} (${this.formatBytes(object.Size)})`);
          totalSize += object.Size || 0;
          
          return object.Key;
        } catch (error) {
          console.error(`✗ Failed to migrate ${object.Key}:`, error.message);
          throw error;
        }
      });
      
      // Wait for batch to complete
      const migrated = await Promise.allSettled(migrationPromises);
      const successful = migrated.filter(r => r.status === 'fulfilled' && r.value).length;
      totalMigrated += successful;
      
      console.log(`Batch complete: ${successful}/${listResponse.Contents.length} objects migrated`);
      
      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`\nMigration complete!`);
    console.log(`Total objects migrated: ${totalMigrated}`);
    console.log(`Total size: ${this.formatBytes(totalSize)}`);
  }
  
  async objectExistsInR2(key) {
    try {
      await this.r2.send(new HeadObjectCommand({
        Bucket: this.r2Bucket,
        Key: key,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  async verifyMigration(sampleSize = 10) {
    console.log(`\nVerifying migration (sample size: ${sampleSize})...`);
    
    const listCommand = new ListObjectsV2Command({
      Bucket: this.r2Bucket,
      MaxKeys: sampleSize,
    });
    
    const r2Objects = await this.r2.send(listCommand);
    
    if (!r2Objects.Contents) {
      console.log('No objects found in R2 bucket');
      return;
    }
    
    for (const object of r2Objects.Contents) {
      // Compare with S3 object
      try {
        const s3Head = await this.s3.send(new HeadObjectCommand({
          Bucket: this.s3Bucket,
          Key: object.Key,
        }));
        
        const r2Head = await this.r2.send(new HeadObjectCommand({
          Bucket: this.r2Bucket,
          Key: object.Key,
        }));
        
        const match = s3Head.ContentLength === r2Head.ContentLength &&
                     s3Head.ETag === r2Head.ETag;
        
        console.log(`${match ? '✓' : '✗'} ${object.Key} - Size: ${s3Head.ContentLength}, ETag match: ${s3Head.ETag === r2Head.ETag}`);
      } catch (error) {
        console.log(`✗ ${object.Key} - Verification failed: ${error.message}`);
      }
    }
  }
}

// Usage
const migrator = new S3ToR2Migrator({
  s3: {
    region: 'us-east-1',
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: 'my-s3-bucket',
  },
  r2: {
    accountId: process.env.CF_ACCOUNT_ID,
    accessKey: process.env.R2_ACCESS_KEY_ID,
    secretKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: 'my-r2-bucket',
  },
  batchSize: 50,
});

// Run migration
migrator.migrate()
  .then(() => migrator.verifyMigration())
  .catch(console.error);
```

### 2. Incremental Sync

```typescript
// Continuous sync from S3 to R2
class S3R2Sync {
  constructor(private env: Env) {}
  
  async syncBucket() {
    const lastSync = await this.getLastSyncTime();
    const modifiedObjects = await this.getModifiedObjects(lastSync);
    
    for (const object of modifiedObjects) {
      await this.syncObject(object);
    }
    
    await this.updateLastSyncTime();
  }
  
  async getModifiedObjects(since: Date) {
    // Use S3 API to get objects modified since last sync
    const response = await fetch(`https://s3.amazonaws.com/${this.env.S3_BUCKET}?list-type=2`, {
      headers: {
        'Authorization': this.generateS3Signature(),
        'x-amz-date': new Date().toISOString(),
      },
    });
    
    const xml = await response.text();
    // Parse XML and filter by LastModified > since
    return this.parseS3Response(xml, since);
  }
  
  async syncObject(object: any) {
    // Download from S3
    const s3Response = await fetch(`https://s3.amazonaws.com/${this.env.S3_BUCKET}/${object.key}`);
    const data = await s3Response.arrayBuffer();
    
    // Upload to R2
    await this.env.STORAGE.put(object.key, data, {
      httpMetadata: {
        contentType: s3Response.headers.get('content-type'),
      },
      customMetadata: {
        s3Etag: s3Response.headers.get('etag'),
        lastModified: object.lastModified,
      },
    });
  }
}
```

## CDN Integration and Caching

### 1. Cloudflare CDN Configuration

```typescript
// Configure caching rules for R2 content
router.get('/cdn/*', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const key = url.pathname.replace('/cdn/', '');
  
  // Check Cloudflare cache
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cachedResponse = await cache.match(cacheKey);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from R2
  const object = await env.STORAGE.get(key);
  
  if (!object) {
    return new Response('Not found', { status: 404 });
  }
  
  // Determine cache duration based on content type
  const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
  let cacheControl = 'public, max-age=3600'; // 1 hour default
  
  if (contentType.startsWith('image/')) {
    cacheControl = 'public, max-age=31536000, immutable'; // 1 year for images
  } else if (contentType.startsWith('video/')) {
    cacheControl = 'public, max-age=86400'; // 1 day for videos
  } else if (contentType.includes('javascript') || contentType.includes('css')) {
    cacheControl = 'public, max-age=86400, stale-while-revalidate=604800';
  }
  
  const response = new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'ETag': object.etag,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
  
  // Cache the response
  await cache.put(cacheKey, response.clone());
  
  return response;
});

// Cache purging
router.post('/cdn/purge', async (request: Request, env: Env) => {
  const { keys } = await request.json();
  const cache = caches.default;
  
  const purgePromises = keys.map(async (key: string) => {
    const url = `https://cdn.example.com/cdn/${key}`;
    await cache.delete(url);
  });
  
  await Promise.all(purgePromises);
  
  return new Response(JSON.stringify({ purged: keys.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Transform Rules for R2

```javascript
// Page Rules / Transform Rules configuration
const transformRules = {
  // Serve R2 content through custom domain
  "cdn.example.com/*": {
    "cache_level": "aggressive",
    "edge_cache_ttl": 7200,
    "browser_cache_ttl": 86400,
    "origin_error_page_pass_thru": "off",
    "polish": "lossless", // Image optimization
    "webp": true, // Auto WebP conversion
    "mirage": true, // Mobile image optimization
  },
  
  // API endpoints - no cache
  "api.example.com/*": {
    "cache_level": "bypass",
    "security_level": "high",
    "waf": true,
  },
};
```

## Security Best Practices

### 1. Access Control and Authentication

```typescript
// Implement signed URLs for temporary access
class R2Security {
  async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const timestamp = Date.now();
    const expiry = timestamp + (expiresIn * 1000);
    
    const signature = await this.sign(`${key}:${expiry}`, this.env.SIGNING_KEY);
    
    return `https://cdn.example.com/secure/${key}?expires=${expiry}&signature=${signature}`;
  }
  
  async validateSignedUrl(request: Request): Promise<boolean> {
    const url = new URL(request.url);
    const expires = parseInt(url.searchParams.get('expires') || '0');
    const signature = url.searchParams.get('signature') || '';
    
    if (Date.now() > expires) {
      return false;
    }
    
    const key = url.pathname.replace('/secure/', '');
    const expectedSignature = await this.sign(`${key}:${expires}`, this.env.SIGNING_KEY);
    
    return signature === expectedSignature;
  }
  
  private async sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
}

// Secure file access endpoint
router.get('/secure/*', async (request: Request, env: Env) => {
  const security = new R2Security();
  
  if (!await security.validateSignedUrl(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const url = new URL(request.url);
  const key = url.pathname.replace('/secure/', '');
  
  const object = await env.STORAGE.get(key);
  
  if (!object) {
    return new Response('Not found', { status: 404 });
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': 'attachment',
    },
  });
});
```

### 2. Encryption at Rest

```typescript
// Client-side encryption before upload
class R2Encryption {
  async encryptFile(file: ArrayBuffer, password: string): Promise<ArrayBuffer> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await this.deriveKey(password, salt);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      file
    );
    
    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return combined.buffer;
  }
  
  async decryptFile(encryptedData: ArrayBuffer, password: string): Promise<ArrayBuffer> {
    const data = new Uint8Array(encryptedData);
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    
    const key = await this.deriveKey(password, salt);
    
    return crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
  }
  
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

## Cost Optimization

### 1. Lifecycle Policies

```typescript
// Implement lifecycle policies for automatic cleanup
class R2Lifecycle {
  async applyLifecycleRules(env: Env) {
    const rules = [
      {
        prefix: 'temp/',
        expirationDays: 7,
      },
      {
        prefix: 'logs/',
        expirationDays: 30,
      },
      {
        prefix: 'backups/',
        expirationDays: 90,
      },
    ];
    
    for (const rule of rules) {
      await this.cleanupOldFiles(env, rule);
    }
  }
  
  async cleanupOldFiles(env: Env, rule: { prefix: string; expirationDays: number }) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rule.expirationDays);
    
    const objects = await env.STORAGE.list({ prefix: rule.prefix });
    
    const deletePromises = objects.objects
      .filter(obj => obj.uploaded < cutoffDate)
      .map(obj => env.STORAGE.delete(obj.key));
    
    await Promise.all(deletePromises);
    
    console.log(`Cleaned up ${deletePromises.length} objects from ${rule.prefix}`);
  }
}

// Schedule cleanup with Cron Triggers
export async function scheduled(event: ScheduledEvent, env: Env) {
  const lifecycle = new R2Lifecycle();
  await lifecycle.applyLifecycleRules(env);
}
```

### 2. Storage Analytics

```typescript
// Monitor storage usage and costs
async function getStorageAnalytics(env: Env) {
  const buckets = ['uploads', 'backups', 'temp', 'media'];
  const analytics = {};
  
  for (const bucket of buckets) {
    const objects = await env.STORAGE.list({ prefix: bucket });
    
    let totalSize = 0;
    let fileCount = 0;
    const fileTypes = {};
    
    for (const obj of objects.objects) {
      totalSize += obj.size;
      fileCount++;
      
      const ext = obj.key.split('.').pop() || 'unknown';
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    }
    
    analytics[bucket] = {
      totalSize,
      fileCount,
      averageSize: fileCount > 0 ? totalSize / fileCount : 0,
      estimatedMonthlyCost: (totalSize / (1024 * 1024 * 1024)) * 0.015,
      fileTypes,
    };
  }
  
  return analytics;
}
```

## Monitoring and Debugging

### 1. R2 Metrics Dashboard

```typescript
// Create metrics endpoint for monitoring
router.get('/metrics', async (request: Request, env: Env) => {
  const metrics = {
    storage: await getStorageMetrics(env),
    bandwidth: await getBandwidthMetrics(env),
    operations: await getOperationMetrics(env),
    errors: await getErrorMetrics(env),
  };
  
  return new Response(JSON.stringify(metrics, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function getStorageMetrics(env: Env) {
  const objects = await env.STORAGE.list();
  
  return {
    totalObjects: objects.objects.length,
    totalSize: objects.objects.reduce((sum, obj) => sum + obj.size, 0),
    truncated: objects.truncated,
  };
}

async function getOperationMetrics(env: Env) {
  // Track operations in Workers Analytics Engine
  return {
    reads: await env.ANALYTICS.query('SELECT COUNT(*) FROM r2_reads'),
    writes: await env.ANALYTICS.query('SELECT COUNT(*) FROM r2_writes'),
    deletes: await env.ANALYTICS.query('SELECT COUNT(*) FROM r2_deletes'),
  };
}
```

### 2. Error Handling and Logging

```typescript
// Comprehensive error handling
class R2ErrorHandler {
  async handleError(error: any, context: string) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
    };
    
    // Log to Workers Analytics
    await this.logToAnalytics(errorInfo);
    
    // Determine appropriate response
    if (error.code === 'NoSuchKey') {
      return new Response('File not found', { status: 404 });
    } else if (error.code === 'AccessDenied') {
      return new Response('Access denied', { status: 403 });
    } else if (error.code === 'RequestTimeout') {
      return new Response('Request timeout', { status: 408 });
    } else {
      return new Response('Internal server error', { status: 500 });
    }
  }
  
  async logToAnalytics(errorInfo: any) {
    // Send to Workers Analytics Engine
    await fetch('https://analytics.example.com/errors', {
      method: 'POST',
      body: JSON.stringify(errorInfo),
    });
  }
}
```

## Conclusion

Cloudflare R2 provides a powerful, cost-effective alternative to traditional object storage services. Key advantages:

- **Zero egress fees** dramatically reduce costs for content delivery
- **S3 API compatibility** enables easy migration
- **Global distribution** through Cloudflare's network
- **Integrated CDN** for optimal performance
- **Workers integration** for serverless computing

### Best Practices Summary

1. **Use multipart uploads** for files larger than 5MB
2. **Implement caching strategies** to reduce API calls
3. **Enable lifecycle policies** for automatic cleanup
4. **Monitor usage metrics** to optimize costs
5. **Use signed URLs** for secure temporary access
6. **Implement client-side encryption** for sensitive data

### Next Steps

- Explore [R2 Event Notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/)
- Implement [Super Slurper](https://developers.cloudflare.com/r2/data-migration/super-slurper/) for large-scale migrations
- Set up [R2 to R2 replication](https://developers.cloudflare.com/r2/buckets/bucket-replication/)
- Integrate with [Cloudflare Stream](https://developers.cloudflare.com/stream/) for video processing

## Resources

- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing Calculator](https://developers.cloudflare.com/r2/pricing/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [Migration Tools](https://developers.cloudflare.com/r2/data-migration/)