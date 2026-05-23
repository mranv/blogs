---
slug: 'n8n-api-integration-workflows'

title: "Mastering API Integration with n8n: From REST to GraphQL"
published: 2025-01-20
description: "Learn how to build powerful API integration workflows in n8n, connecting REST APIs, GraphQL endpoints, webhooks, and custom services with practical examples"
image: ""
tags: ["n8n", "API", "REST", "GraphQL", "webhooks", "integration"]
category: API Integration
draft: false

---

## Introduction: API Integration in the Modern Stack

APIs are the backbone of modern software architecture, enabling systems to communicate and share data seamlessly. n8n excels at API integration, providing powerful tools to connect, transform, and orchestrate data flows between any services. This comprehensive guide explores advanced API integration patterns using n8n.

## Understanding n8n's API Capabilities

### Core API Features

1. **HTTP Request Node**: Universal API connector
2. **Webhook Node**: Receive real-time data
3. **GraphQL Node**: Query GraphQL endpoints
4. **Custom Authentication**: OAuth2, API Key, Bearer Token
5. **Response Handling**: JSON, XML, Binary data
6. **Rate Limiting**: Built-in throttling mechanisms

## REST API Integration Patterns

### Example 1: Multi-Service Data Aggregation

**Scenario**: Aggregate user data from multiple services (CRM, Support, Analytics) into a unified profile.

```json
{
  "name": "User Profile Aggregation",
  "nodes": [
    {
      "name": "Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "user-profile",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      }
    },
    {
      "name": "Get CRM Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.crm.com/v2/contacts/{{$json.userId}}",
        "method": "GET",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "hubspotApi",
        "options": {
          "timeout": 10000,
          "retry": {
            "maxTries": 3,
            "waitBetweenTries": 1000
          }
        }
      }
    },
    {
      "name": "Get Support Tickets",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.support.com/tickets",
        "method": "GET",
        "queryParameters": {
          "parameters": [
            {
              "name": "customer_id",
              "value": "={{$json.userId}}"
            },
            {
              "name": "status",
              "value": "all"
            }
          ]
        },
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer {{$credentials.supportApiToken}}"
            }
          ]
        }
      }
    },
    {
      "name": "Get Analytics Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://analytics.api.com/user-metrics",
        "method": "POST",
        "bodyParameters": {
          "parameters": [
            {
              "name": "userId",
              "value": "={{$json.userId}}"
            },
            {
              "name": "metrics",
              "value": ["engagement", "activity", "conversion"]
            },
            {
              "name": "dateRange",
              "value": {
                "start": "={{$now.minus(30, 'days').toISO()}}",
                "end": "={{$now.toISO()}}"
              }
            }
          ]
        }
      }
    },
    {
      "name": "Merge Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const crmData = $items[0].json;
          const supportData = $items[1].json;
          const analyticsData = $items[2].json;
          
          const unifiedProfile = {
            userId: crmData.id,
            profile: {
              name: crmData.name,
              email: crmData.email,
              company: crmData.company,
              created: crmData.createdAt
            },
            support: {
              totalTickets: supportData.total,
              openTickets: supportData.open,
              avgResponseTime: supportData.avgResponseTime,
              satisfaction: supportData.satisfaction
            },
            analytics: {
              lastActive: analyticsData.lastSeen,
              totalSessions: analyticsData.sessions,
              engagementScore: analyticsData.engagement,
              lifetime_value: analyticsData.ltv
            },
            aggregatedAt: new Date().toISOString()
          };
          
          return [{json: unifiedProfile}];
        `
      }
    }
  ]
}
```

### Example 2: OAuth2 Authentication Flow

**Scenario**: Implement OAuth2 authentication for Spotify API integration.

```javascript
// OAuth2 Configuration and Token Management
const oauth2Integration = {
  name: "Spotify OAuth2 Integration",
  
  // Initial Authorization
  authorization: {
    type: "n8n-nodes-base.httpRequest",
    parameters: {
      url: "https://accounts.spotify.com/authorize",
      method: "GET",
      queryParameters: {
        client_id: "{{$credentials.spotifyClientId}}",
        response_type: "code",
        redirect_uri: "{{$env.N8N_WEBHOOK_URL}}/webhook/spotify-callback",
        scope: "user-read-private user-read-email playlist-modify-public",
        state: "{{$json.sessionId}}"
      }
    }
  },
  
  // Token Exchange
  tokenExchange: {
    type: "n8n-nodes-base.httpRequest",
    parameters: {
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      authentication: "basicAuth",
      nodeCredentialType: "spotifyOAuth2Api",
      bodyParameters: {
        grant_type: "authorization_code",
        code: "{{$json.authorizationCode}}",
        redirect_uri: "{{$env.N8N_WEBHOOK_URL}}/webhook/spotify-callback"
      }
    }
  },
  
  // Token Refresh Logic
  tokenRefresh: {
    type: "n8n-nodes-base.function",
    code: `
      const tokenData = await $getWorkflowStaticData('spotify_token');
      
      if (!tokenData || !tokenData.refresh_token) {
        throw new Error('No refresh token available');
      }
      
      // Check if token is expired
      const tokenExpiry = new Date(tokenData.expires_at);
      const now = new Date();
      
      if (tokenExpiry > now) {
        // Token still valid
        return [{json: {
          access_token: tokenData.access_token,
          valid: true
        }}];
      }
      
      // Refresh the token
      const response = await $http.post('https://accounts.spotify.com/api/token', {
        body: {
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token
        },
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            $credentials.clientId + ':' + $credentials.clientSecret
          ).toString('base64')
        }
      });
      
      // Store new token
      const newTokenData = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || tokenData.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString()
      };
      
      await $setWorkflowStaticData('spotify_token', newTokenData);
      
      return [{json: {
        access_token: newTokenData.access_token,
        valid: true,
        refreshed: true
      }}];
    `
  }
};
```

## GraphQL Integration

### Example 3: GitHub GraphQL API Integration

**Scenario**: Query GitHub GraphQL API to fetch repository information and create automated reports.

```javascript
// GitHub GraphQL Integration
const githubGraphQL = {
  name: "GitHub Repository Analytics",
  
  nodes: [
    {
      name: "GraphQL Query",
      type: "n8n-nodes-base.graphql",
      parameters: {
        endpoint: "https://api.github.com/graphql",
        requestFormat: "graphql",
        query: `
          query RepositoryInfo($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
              name
              description
              stargazerCount
              forkCount
              issues(states: OPEN) {
                totalCount
              }
              pullRequests(states: OPEN) {
                totalCount
              }
              releases(last: 5) {
                nodes {
                  tagName
                  publishedAt
                  url
                }
              }
              languages(first: 10) {
                edges {
                  node {
                    name
                    color
                  }
                  size
                }
                totalSize
              }
              collaborators {
                totalCount
              }
            }
          }
        `,
        variables: {
          owner: "{{$json.repoOwner}}",
          name: "{{$json.repoName}}"
        },
        headerParameters: {
          Authorization: "Bearer {{$credentials.githubToken}}"
        }
      }
    },
    {
      name: "Process Repository Data",
      type: "n8n-nodes-base.function",
      parameters: {
        functionCode: `
          const repo = $input.item.json.data.repository;
          
          // Calculate language percentages
          const totalSize = repo.languages.totalSize;
          const languages = repo.languages.edges.map(edge => ({
            name: edge.node.name,
            percentage: ((edge.size / totalSize) * 100).toFixed(2),
            color: edge.node.color
          }));
          
          // Format release data
          const releases = repo.releases.nodes.map(release => ({
            version: release.tagName,
            date: new Date(release.publishedAt).toLocaleDateString(),
            url: release.url
          }));
          
          // Create summary report
          const report = {
            repository: {
              name: repo.name,
              description: repo.description
            },
            metrics: {
              stars: repo.stargazerCount,
              forks: repo.forkCount,
              openIssues: repo.issues.totalCount,
              openPRs: repo.pullRequests.totalCount,
              contributors: repo.collaborators.totalCount
            },
            languages: languages,
            recentReleases: releases,
            generatedAt: new Date().toISOString()
          };
          
          return [{json: report}];
        `
      }
    }
  ]
};
```

### Example 4: Complex GraphQL Mutations

**Scenario**: Create and manage content in a headless CMS using GraphQL mutations.

```json
{
  "name": "CMS Content Management",
  "nodes": [
    {
      "name": "Create Article",
      "type": "n8n-nodes-base.graphql",
      "parameters": {
        "endpoint": "https://cms.api.com/graphql",
        "requestFormat": "graphql",
        "query": `
          mutation CreateArticle($input: ArticleInput!) {
            createArticle(input: $input) {
              id
              slug
              title
              status
              publishedAt
              author {
                id
                name
              }
            }
          }
        `,
        "variables": {
          "input": {
            "title": "{{$json.title}}",
            "content": "{{$json.content}}",
            "excerpt": "{{$json.excerpt}}",
            "authorId": "{{$json.authorId}}",
            "categoryIds": "{{$json.categories}}",
            "tags": "{{$json.tags}}",
            "seo": {
              "metaTitle": "{{$json.seo.title}}",
              "metaDescription": "{{$json.seo.description}}",
              "keywords": "{{$json.seo.keywords}}"
            },
            "status": "DRAFT"
          }
        }
      }
    },
    {
      "name": "Upload Media",
      "type": "n8n-nodes-base.graphql",
      "parameters": {
        "query": `
          mutation UploadMedia($file: Upload!, $articleId: ID!) {
            uploadMedia(file: $file, articleId: $articleId) {
              id
              url
              mimeType
              size
            }
          }
        `,
        "variables": {
          "file": "{{$binary.data}}",
          "articleId": "{{$json.id}}"
        }
      }
    },
    {
      "name": "Publish Article",
      "type": "n8n-nodes-base.graphql",
      "parameters": {
        "query": `
          mutation PublishArticle($id: ID!) {
            updateArticle(id: $id, input: { status: PUBLISHED }) {
              id
              status
              publishedAt
              url
            }
          }
        `,
        "variables": {
          "id": "{{$json.id}}"
        }
      }
    }
  ]
}
```

## Webhook Integration Patterns

### Example 5: Multi-Provider Webhook Handler

**Scenario**: Handle webhooks from multiple providers with different formats and authentication methods.

```javascript
// Universal Webhook Handler
const webhookHandler = {
  name: "Multi-Provider Webhook Router",
  
  // Main webhook receiver
  receiver: {
    type: "n8n-nodes-base.webhook",
    parameters: {
      path: "webhooks/{{provider}}",
      httpMethod: ["POST", "GET"],
      responseMode: "onReceived",
      options: {
        rawBody: true // Preserve raw body for signature verification
      }
    }
  },
  
  // Provider identification and validation
  validator: {
    type: "n8n-nodes-base.function",
    code: `
      const provider = $json.params.provider;
      const headers = $json.headers;
      const body = $json.body;
      
      // Provider-specific validation
      const validators = {
        stripe: (headers, body) => {
          const signature = headers['stripe-signature'];
          const secret = $credentials.stripeWebhookSecret;
          
          // Verify Stripe signature
          const crypto = require('crypto');
          const timestamp = signature.split(',')[0].split('=')[1];
          const sig = signature.split(',')[1].split('=')[1];
          
          const payload = timestamp + '.' + JSON.stringify(body);
          const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
          
          return sig === expectedSig;
        },
        
        github: (headers, body) => {
          const signature = headers['x-hub-signature-256'];
          const secret = $credentials.githubWebhookSecret;
          
          const crypto = require('crypto');
          const expectedSig = 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
          
          return signature === expectedSig;
        },
        
        shopify: (headers, body) => {
          const hmac = headers['x-shopify-hmac-sha256'];
          const secret = $credentials.shopifyWebhookSecret;
          
          const crypto = require('crypto');
          const hash = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body), 'utf8')
            .digest('base64');
          
          return hmac === hash;
        }
      };
      
      // Validate webhook
      const validator = validators[provider];
      if (!validator) {
        throw new Error(\`Unknown provider: \${provider}\`);
      }
      
      const isValid = validator(headers, body);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
      
      // Extract event type
      const eventTypes = {
        stripe: () => body.type,
        github: () => headers['x-github-event'],
        shopify: () => headers['x-shopify-topic']
      };
      
      const eventType = eventTypes[provider]();
      
      return [{
        json: {
          provider,
          eventType,
          data: body,
          validated: true,
          timestamp: new Date().toISOString()
        }
      }];
    `
  },
  
  // Event router
  router: {
    type: "n8n-nodes-base.switch",
    parameters: {
      dataType: "expression",
      value1: "={{$json.provider}}_{{$json.eventType}}",
      rules: [
        {
          value2: "stripe_payment_intent.succeeded",
          output: "processPayment"
        },
        {
          value2: "github_push",
          output: "deployCode"
        },
        {
          value2: "shopify_orders/create",
          output: "fulfillOrder"
        }
      ]
    }
  }
};
```

## API Rate Limiting and Throttling

### Example 6: Intelligent Rate Limit Management

**Scenario**: Manage API rate limits across multiple services with automatic throttling and retry logic.

```javascript
// Rate Limit Manager
const rateLimitManager = {
  name: "API Rate Limit Handler",
  
  // Rate limit tracker
  tracker: {
    type: "n8n-nodes-base.function",
    code: `
      // Initialize or get rate limit data
      let rateLimits = await $getWorkflowStaticData('rateLimits') || {};
      
      const api = $json.api;
      const now = Date.now();
      
      // API rate limit configurations
      const limits = {
        twitter: { calls: 300, window: 900000 }, // 300 calls per 15 minutes
        github: { calls: 5000, window: 3600000 }, // 5000 calls per hour
        stripe: { calls: 100, window: 1000 }, // 100 calls per second
        salesforce: { calls: 15000, window: 86400000 } // 15000 calls per day
      };
      
      // Initialize API limits if not exists
      if (!rateLimits[api]) {
        rateLimits[api] = {
          calls: [],
          nextReset: now + limits[api].window
        };
      }
      
      // Clean old calls
      const windowStart = now - limits[api].window;
      rateLimits[api].calls = rateLimits[api].calls.filter(
        timestamp => timestamp > windowStart
      );
      
      // Check if we can make a call
      const currentCalls = rateLimits[api].calls.length;
      const maxCalls = limits[api].calls;
      
      if (currentCalls >= maxCalls) {
        // Calculate wait time
        const oldestCall = rateLimits[api].calls[0];
        const waitTime = (oldestCall + limits[api].window) - now;
        
        return [{
          json: {
            canProceed: false,
            waitTime: waitTime,
            currentCalls: currentCalls,
            maxCalls: maxCalls,
            api: api
          }
        }];
      }
      
      // Record the call
      rateLimits[api].calls.push(now);
      await $setWorkflowStaticData('rateLimits', rateLimits);
      
      return [{
        json: {
          canProceed: true,
          currentCalls: currentCalls + 1,
          maxCalls: maxCalls,
          remainingCalls: maxCalls - (currentCalls + 1),
          api: api
        }
      }];
    `
  },
  
  // Adaptive throttler
  throttler: {
    type: "n8n-nodes-base.if",
    parameters: {
      conditions: {
        boolean: [
          {
            value1: "={{$json.canProceed}}",
            value2: true
          }
        ]
      }
    }
  },
  
  // Wait node for rate limiting
  waiter: {
    type: "n8n-nodes-base.wait",
    parameters: {
      resume: "timeInterval",
      options: {
        unit: "milliseconds",
        value: "={{$json.waitTime}}"
      }
    }
  },
  
  // Batch processor for efficient API usage
  batchProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Group items for batch processing
      const batchSize = 100; // Adjust based on API limits
      const items = $input.all();
      const batches = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }
      
      // Process batches with delays
      const results = [];
      for (const [index, batch] of batches.entries()) {
        // Add delay between batches
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Process batch
        const batchData = batch.map(item => item.json);
        results.push({
          json: {
            batchNumber: index + 1,
            totalBatches: batches.length,
            items: batchData
          }
        });
      }
      
      return results;
    `
  }
};
```

## API Data Transformation

### Example 7: Complex Data Transformation Pipeline

**Scenario**: Transform data between different API formats (SOAP to REST, XML to JSON).

```javascript
// Data Transformation Pipeline
const transformationPipeline = {
  name: "API Data Transformer",
  
  // SOAP to REST converter
  soapConverter: {
    type: "n8n-nodes-base.function",
    code: `
      const soap = require('soap');
      const xml2js = require('xml2js');
      
      // Parse SOAP response
      const soapResponse = $json.soapResponse;
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true
      });
      
      const parsed = await parser.parseStringPromise(soapResponse);
      
      // Extract data from SOAP envelope
      const body = parsed['soap:Envelope']['soap:Body'];
      const data = body[Object.keys(body)[0]];
      
      // Transform to REST-friendly format
      const restFormat = {
        data: normalizeData(data),
        metadata: {
          source: 'SOAP',
          transformed: new Date().toISOString()
        }
      };
      
      function normalizeData(obj) {
        if (typeof obj !== 'object') return obj;
        
        const normalized = {};
        for (const [key, value] of Object.entries(obj)) {
          // Convert SOAP naming to REST naming
          const restKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          normalized[restKey] = Array.isArray(value) 
            ? value.map(normalizeData)
            : normalizeData(value);
        }
        return normalized;
      }
      
      return [{json: restFormat}];
    `
  },
  
  // Schema mapper
  schemaMapper: {
    type: "n8n-nodes-base.function",
    code: `
      // Map between different API schemas
      const sourceData = $json;
      const mappingRules = {
        // Source field -> Target field
        'user_id': 'customerId',
        'user_name': 'customer.name',
        'user_email': 'customer.contact.email',
        'order_items': 'lineItems',
        'total_amount': 'orderTotal',
        'created_date': 'orderDate'
      };
      
      function mapData(source, rules) {
        const target = {};
        
        for (const [sourceKey, targetKey] of Object.entries(rules)) {
          const value = getNestedValue(source, sourceKey);
          if (value !== undefined) {
            setNestedValue(target, targetKey, value);
          }
        }
        
        return target;
      }
      
      function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
          current?.[key], obj);
      }
      
      function setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
          if (!current[key]) current[key] = {};
          return current[key];
        }, obj);
        target[lastKey] = value;
      }
      
      const mapped = mapData(sourceData, mappingRules);
      return [{json: mapped}];
    `
  },
  
  // Data validator
  validator: {
    type: "n8n-nodes-base.function",
    code: `
      // Validate transformed data against schema
      const Ajv = require('ajv');
      const ajv = new Ajv();
      
      const schema = {
        type: 'object',
        required: ['customerId', 'customer', 'lineItems', 'orderTotal'],
        properties: {
          customerId: { type: 'string' },
          customer: {
            type: 'object',
            required: ['name', 'contact'],
            properties: {
              name: { type: 'string' },
              contact: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { 
                    type: 'string',
                    format: 'email'
                  }
                }
              }
            }
          },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity', 'price'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number', minimum: 1 },
                price: { type: 'number', minimum: 0 }
              }
            }
          },
          orderTotal: { type: 'number', minimum: 0 },
          orderDate: { type: 'string', format: 'date-time' }
        }
      };
      
      const validate = ajv.compile(schema);
      const valid = validate($json);
      
      if (!valid) {
        throw new Error(\`Validation failed: \${JSON.stringify(validate.errors)}\`);
      }
      
      return [{json: { ...json, validated: true }}];
    `
  }
};
```

## API Pagination Handling

### Example 8: Advanced Pagination Strategies

**Scenario**: Handle different pagination styles (cursor, offset, page-based) across various APIs.

```javascript
// Universal Pagination Handler
const paginationHandler = {
  name: "API Pagination Manager",
  
  // Pagination detector
  detector: {
    type: "n8n-nodes-base.function",
    code: `
      // Detect pagination type from API response
      const response = $json;
      const headers = $json.headers;
      
      // Check for different pagination indicators
      const paginationTypes = {
        cursor: () => {
          if (response.cursor || response.next_cursor) {
            return {
              type: 'cursor',
              nextCursor: response.cursor || response.next_cursor,
              hasMore: response.has_more || !!response.next_cursor
            };
          }
        },
        
        link: () => {
          const linkHeader = headers?.link;
          if (linkHeader) {
            const links = parseLinkHeader(linkHeader);
            return {
              type: 'link',
              nextUrl: links.next,
              hasMore: !!links.next
            };
          }
        },
        
        offset: () => {
          if ('offset' in response && 'limit' in response) {
            return {
              type: 'offset',
              offset: response.offset,
              limit: response.limit,
              total: response.total,
              hasMore: response.offset + response.limit < response.total
            };
          }
        },
        
        page: () => {
          if (response.page !== undefined) {
            return {
              type: 'page',
              currentPage: response.page,
              totalPages: response.total_pages,
              hasMore: response.page < response.total_pages
            };
          }
        }
      };
      
      function parseLinkHeader(header) {
        const links = {};
        header.split(',').forEach(part => {
          const section = part.split(';');
          const url = section[0].replace(/<(.*)>/, '$1').trim();
          const name = section[1].replace(/rel="(.*)"/, '$1').trim();
          links[name] = url;
        });
        return links;
      }
      
      // Detect pagination type
      for (const detector of Object.values(paginationTypes)) {
        const result = detector();
        if (result) {
          return [{json: result}];
        }
      }
      
      // No pagination detected
      return [{json: { type: 'none', hasMore: false }}];
    `
  },
  
  // Pagination iterator
  iterator: {
    type: "n8n-nodes-base.function",
    code: `
      // Iterate through all pages
      const paginationType = $json.type;
      const apiEndpoint = $json.endpoint;
      let allData = [];
      let hasMore = true;
      let nextToken = null;
      let page = 1;
      let offset = 0;
      const limit = 100;
      const maxPages = 100; // Safety limit
      
      while (hasMore && page <= maxPages) {
        let requestParams = {};
        
        // Build request based on pagination type
        switch (paginationType) {
          case 'cursor':
            if (nextToken) {
              requestParams.cursor = nextToken;
            }
            break;
            
          case 'offset':
            requestParams.offset = offset;
            requestParams.limit = limit;
            break;
            
          case 'page':
            requestParams.page = page;
            requestParams.per_page = limit;
            break;
        }
        
        // Make API request
        const response = await $http.get(apiEndpoint, {
          params: requestParams,
          headers: {
            'Authorization': \`Bearer \${$credentials.apiToken}\`
          }
        });
        
        // Extract data and pagination info
        const data = response.data.items || response.data.data || response.data;
        allData.push(...data);
        
        // Update pagination variables
        switch (paginationType) {
          case 'cursor':
            nextToken = response.data.next_cursor;
            hasMore = !!nextToken;
            break;
            
          case 'offset':
            offset += limit;
            hasMore = offset < response.data.total;
            break;
            
          case 'page':
            page++;
            hasMore = page <= response.data.total_pages;
            break;
            
          default:
            hasMore = false;
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return [{
        json: {
          totalItems: allData.length,
          pages: page - 1,
          data: allData
        }
      }];
    `
  }
};
```

## API Error Handling and Recovery

### Example 9: Comprehensive Error Management

**Scenario**: Implement robust error handling with retry logic, circuit breakers, and fallback mechanisms.

```javascript
// Error Handling System
const errorHandlingSystem = {
  name: "API Error Handler",
  
  // Circuit breaker implementation
  circuitBreaker: {
    type: "n8n-nodes-base.function",
    code: `
      // Circuit breaker for API calls
      let circuitState = await $getWorkflowStaticData('circuitBreaker') || {};
      const api = $json.api;
      const now = Date.now();
      
      // Initialize circuit for API if not exists
      if (!circuitState[api]) {
        circuitState[api] = {
          state: 'closed', // closed, open, half-open
          failures: 0,
          lastFailure: null,
          successCount: 0
        };
      }
      
      const circuit = circuitState[api];
      const config = {
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        halfOpenRequests: 3
      };
      
      // Check circuit state
      switch (circuit.state) {
        case 'open':
          // Check if timeout has passed
          if (now - circuit.lastFailure > config.timeout) {
            circuit.state = 'half-open';
            circuit.successCount = 0;
          } else {
            throw new Error(\`Circuit breaker is open for \${api}\`);
          }
          break;
          
        case 'half-open':
          // Allow limited requests
          if (circuit.successCount >= config.halfOpenRequests) {
            circuit.state = 'closed';
            circuit.failures = 0;
          }
          break;
      }
      
      try {
        // Make API call
        const response = await makeApiCall($json);
        
        // Record success
        circuit.successCount++;
        if (circuit.state === 'half-open' && 
            circuit.successCount >= config.halfOpenRequests) {
          circuit.state = 'closed';
          circuit.failures = 0;
        }
        
        await $setWorkflowStaticData('circuitBreaker', circuitState);
        return [{json: response}];
        
      } catch (error) {
        // Record failure
        circuit.failures++;
        circuit.lastFailure = now;
        
        if (circuit.failures >= config.failureThreshold) {
          circuit.state = 'open';
        }
        
        await $setWorkflowStaticData('circuitBreaker', circuitState);
        throw error;
      }
    `
  },
  
  // Retry mechanism with exponential backoff
  retryHandler: {
    type: "n8n-nodes-base.function",
    code: `
      // Exponential backoff retry logic
      const maxRetries = 5;
      const baseDelay = 1000; // 1 second
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Attempt API call
          const response = await $http.request({
            method: $json.method,
            url: $json.url,
            data: $json.data,
            headers: $json.headers,
            timeout: 30000
          });
          
          // Success - return response
          return [{
            json: {
              success: true,
              attempt: attempt,
              response: response.data
            }
          }];
          
        } catch (error) {
          lastError = error;
          
          // Check if error is retryable
          const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ESOCKETTIMEDOUT'
          ];
          
          const statusCodes = [408, 429, 500, 502, 503, 504];
          
          const isRetryable = 
            retryableErrors.includes(error.code) ||
            statusCodes.includes(error.response?.status);
          
          if (!isRetryable || attempt === maxRetries) {
            throw error;
          }
          
          // Calculate delay with jitter
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
            30000 // Max 30 seconds
          );
          
          console.log(\`Retry attempt \${attempt} after \${delay}ms\`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw lastError;
    `
  },
  
  // Fallback handler
  fallbackHandler: {
    type: "n8n-nodes-base.function",
    code: `
      // Implement fallback strategies
      const primaryApi = $json.primary;
      const fallbacks = $json.fallbacks || [];
      const errors = [];
      
      // Try primary API
      try {
        const response = await callApi(primaryApi);
        return [{json: { source: 'primary', data: response }}];
      } catch (error) {
        errors.push({ api: primaryApi.name, error: error.message });
      }
      
      // Try fallback APIs
      for (const fallback of fallbacks) {
        try {
          const response = await callApi(fallback);
          return [{
            json: {
              source: 'fallback',
              fallbackApi: fallback.name,
              data: response,
              errors: errors
            }
          }];
        } catch (error) {
          errors.push({ api: fallback.name, error: error.message });
        }
      }
      
      // All APIs failed - use cache or default
      const cachedData = await $getWorkflowStaticData('apiCache');
      if (cachedData) {
        return [{
          json: {
            source: 'cache',
            data: cachedData,
            errors: errors,
            cached: true
          }
        }];
      }
      
      // Return default/degraded response
      return [{
        json: {
          source: 'default',
          data: getDefaultResponse(),
          errors: errors,
          degraded: true
        }
      }];
      
      async function callApi(config) {
        return await $http.request(config);
      }
      
      function getDefaultResponse() {
        return {
          message: 'Service temporarily unavailable',
          timestamp: new Date().toISOString()
        };
      }
    `
  }
};
```

## API Monitoring and Analytics

### Example 10: API Performance Monitoring

**Scenario**: Track API performance metrics, response times, and error rates.

```javascript
// API Monitoring System
const apiMonitoring = {
  name: "API Performance Monitor",
  
  // Request interceptor
  requestMonitor: {
    type: "n8n-nodes-base.function",
    code: `
      // Track API request metrics
      const startTime = Date.now();
      const request = {
        api: $json.api,
        endpoint: $json.endpoint,
        method: $json.method,
        timestamp: new Date().toISOString()
      };
      
      try {
        // Make API call
        const response = await $http.request($json);
        const endTime = Date.now();
        
        // Collect metrics
        const metrics = {
          ...request,
          status: response.status,
          duration: endTime - startTime,
          size: JSON.stringify(response.data).length,
          success: true
        };
        
        // Store metrics
        await storeMetrics(metrics);
        
        return [{
          json: {
            response: response.data,
            metrics: metrics
          }
        }];
        
      } catch (error) {
        const endTime = Date.now();
        
        // Collect error metrics
        const metrics = {
          ...request,
          status: error.response?.status || 0,
          duration: endTime - startTime,
          error: error.message,
          success: false
        };
        
        // Store metrics
        await storeMetrics(metrics);
        
        throw error;
      }
      
      async function storeMetrics(metrics) {
        // Get existing metrics
        let allMetrics = await $getWorkflowStaticData('apiMetrics') || [];
        
        // Add new metrics
        allMetrics.push(metrics);
        
        // Keep only last 1000 entries
        if (allMetrics.length > 1000) {
          allMetrics = allMetrics.slice(-1000);
        }
        
        await $setWorkflowStaticData('apiMetrics', allMetrics);
      }
    `
  },
  
  // Analytics calculator
  analyticsProcessor: {
    type: "n8n-nodes-base.function",
    code: `
      // Calculate API analytics
      const metrics = await $getWorkflowStaticData('apiMetrics') || [];
      const now = Date.now();
      const timeWindows = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000
      };
      
      const analytics = {};
      
      for (const [window, duration] of Object.entries(timeWindows)) {
        const windowMetrics = metrics.filter(m => 
          new Date(m.timestamp).getTime() > now - duration
        );
        
        if (windowMetrics.length === 0) {
          analytics[window] = { noData: true };
          continue;
        }
        
        // Calculate statistics
        const successfulRequests = windowMetrics.filter(m => m.success);
        const failedRequests = windowMetrics.filter(m => !m.success);
        const durations = successfulRequests.map(m => m.duration);
        
        analytics[window] = {
          totalRequests: windowMetrics.length,
          successfulRequests: successfulRequests.length,
          failedRequests: failedRequests.length,
          successRate: (successfulRequests.length / windowMetrics.length * 100).toFixed(2),
          avgResponseTime: durations.length > 0 
            ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)
            : 0,
          minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
          maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
          p95ResponseTime: calculatePercentile(durations, 95),
          p99ResponseTime: calculatePercentile(durations, 99),
          errorTypes: groupErrors(failedRequests),
          apiBreakdown: groupByApi(windowMetrics)
        };
      }
      
      function calculatePercentile(arr, percentile) {
        if (arr.length === 0) return 0;
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
      }
      
      function groupErrors(failed) {
        const errors = {};
        failed.forEach(f => {
          const status = f.status || 'Unknown';
          errors[status] = (errors[status] || 0) + 1;
        });
        return errors;
      }
      
      function groupByApi(metrics) {
        const apis = {};
        metrics.forEach(m => {
          if (!apis[m.api]) {
            apis[m.api] = {
              requests: 0,
              avgTime: 0,
              errors: 0
            };
          }
          apis[m.api].requests++;
          if (!m.success) apis[m.api].errors++;
          if (m.duration) {
            apis[m.api].avgTime = 
              (apis[m.api].avgTime * (apis[m.api].requests - 1) + m.duration) / 
              apis[m.api].requests;
          }
        });
        return apis;
      }
      
      return [{json: analytics}];
    `
  },
  
  // Alert generator
  alertGenerator: {
    type: "n8n-nodes-base.function",
    code: `
      // Generate alerts based on thresholds
      const analytics = $json;
      const alerts = [];
      
      // Define thresholds
      const thresholds = {
        errorRate: 5, // %
        avgResponseTime: 2000, // ms
        p95ResponseTime: 5000, // ms
        minSuccessRate: 95 // %
      };
      
      // Check each time window
      for (const [window, stats] of Object.entries(analytics)) {
        if (stats.noData) continue;
        
        // Check error rate
        const errorRate = 100 - parseFloat(stats.successRate);
        if (errorRate > thresholds.errorRate) {
          alerts.push({
            severity: 'high',
            type: 'error_rate',
            message: \`High error rate in \${window}: \${errorRate.toFixed(2)}%\`,
            value: errorRate,
            threshold: thresholds.errorRate,
            window
          });
        }
        
        // Check response time
        if (stats.avgResponseTime > thresholds.avgResponseTime) {
          alerts.push({
            severity: 'medium',
            type: 'response_time',
            message: \`Slow response time in \${window}: \${stats.avgResponseTime}ms\`,
            value: stats.avgResponseTime,
            threshold: thresholds.avgResponseTime,
            window
          });
        }
        
        // Check p95 response time
        if (stats.p95ResponseTime > thresholds.p95ResponseTime) {
          alerts.push({
            severity: 'medium',
            type: 'p95_response_time',
            message: \`High p95 response time in \${window}: \${stats.p95ResponseTime}ms\`,
            value: stats.p95ResponseTime,
            threshold: thresholds.p95ResponseTime,
            window
          });
        }
      }
      
      return [{
        json: {
          alerts: alerts,
          hasAlerts: alerts.length > 0,
          analytics: analytics
        }
      }];
    `
  }
};
```

## Best Practices for API Integration

### 1. Authentication Management
- Store credentials securely using n8n's credential system
- Implement token refresh mechanisms
- Use OAuth2 for user-authorized access
- Rotate API keys regularly

### 2. Error Handling
- Implement comprehensive error catching
- Use circuit breakers for failing services
- Provide meaningful error messages
- Log errors for debugging

### 3. Performance Optimization
- Batch API requests when possible
- Implement caching strategies
- Use pagination efficiently
- Monitor API rate limits

### 4. Data Validation
- Validate input data before API calls
- Verify response data structure
- Handle missing or null values
- Use schema validation

### 5. Security Considerations
- Never expose API keys in workflows
- Validate webhook signatures
- Implement request throttling
- Use HTTPS for all API calls

## Conclusion

n8n provides a comprehensive platform for API integration, offering flexibility and power to connect any service. By leveraging its built-in nodes, custom functions, and error handling capabilities, you can build robust API integration workflows that scale with your needs.

The examples and patterns presented in this guide demonstrate the versatility of n8n in handling various API integration scenarios. From simple REST calls to complex GraphQL queries, webhook processing to rate limit management, n8n empowers you to create sophisticated integrations without extensive coding.

Remember to follow best practices, implement proper error handling, and monitor your API integrations to ensure reliable and efficient operation. With n8n, you have the tools to build enterprise-grade API integrations that drive your business forward.